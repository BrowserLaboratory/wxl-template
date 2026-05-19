/**
 * useWxlsh — command dispatch composable for the wxlsh terminal.
 *
 * Architecture (Option B):
 *   User input
 *     → Rust WASM parser  (tokenise + parse flags)
 *     → Command Dispatcher
 *         ├─ Rust-native commands  (help, clear, base64, hex)
 *         └─ Python-backed commands (curl, decode, encode, …) via Pyodide
 */

import { ref, type Ref } from 'vue'
import { useChallengePersistence } from './useChallengePersistence'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandResult {
  output: string
  /** When true the terminal should be cleared before this output. */
  clear?: boolean
  /** When true the output is an error message. */
  error?: boolean
}

export interface WxlshOptions {
  /** The challenge slug — used to build the challenge hostname for HTTP commands. */
  slug: string
  /** Dispatch function from ChallengeLayout — routes HTTP requests through the SW. */
  dispatch: (req: Request) => Promise<Response>
  /** Pyodide instance (may be null when runtime is not yet ready). */
  pyodide: Ref<PyodidePublicAPI | null>
  /** Tier 5 command allowlist from frontmatter. Empty = all disabled. */
  commands?: string[]
}

/** Minimal subset of the Pyodide public API used here. */
export interface PyodidePublicAPI {
  runPythonAsync(code: string, options?: { globals?: unknown }): Promise<unknown>
  globals: { get(name: string): unknown; set(name: string, value: unknown): void }
}

// ─── Lazy WASM loader ─────────────────────────────────────────────────────────

let wasmReady: Promise<WasmParser> | null = null

interface WasmParser {
  wasm_parse_command(input: string): ParsedCommand | null
  wasm_execute_native(command: string, args: unknown, flags: unknown): NativeResult | null
}

interface ParsedCommand {
  command: string
  args: string[]
  flags: Record<string, string>
}

interface NativeResult {
  output: string
  clear: boolean
}

async function loadWasm(): Promise<WasmParser> {
  if (!wasmReady) {
    wasmReady = import('../../../.vitepress/wasm/wxlsh-parser/wxlsh_parser.js').then(async (mod) => {
      await mod.default()  // initialise WASM binary
      return mod as unknown as WasmParser
    }).catch(() => {
      // Fallback: WASM not built yet — return a pure-TS stub
      return {
        wasm_parse_command: (input: string) => tsParseCommand(input),
        wasm_execute_native: () => null,
      } as WasmParser
    })
  }
  return wasmReady
}

// ─── Pure-TS parser fallback (mirrors Rust logic, used when WASM unavailable) ──

function tsParseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim()
  if (!trimmed) return { command: '', args: [], flags: {} }
  const tokens = tsTokenize(trimmed)
  if (tokens.length === 0) return { command: '', args: [], flags: {} }
  const command = tokens[0].value
  const args: string[] = []
  const flags: Record<string, string> = {}
  let i = 1
  while (i < tokens.length) {
    const tok = tokens[i]
    if (tok.quoted) { args.push(tok.value); i++; continue }
    if (tok.value.startsWith('--')) {
      const long = tok.value.slice(2)
      const eq = long.indexOf('=')
      if (eq >= 0) flags[long.slice(0, eq)] = long.slice(eq + 1)
      else flags[long] = ''
    } else if (tok.value.startsWith('-') && tok.value.length > 1) {
      const key = tok.value.slice(1)
      const next = tokens[i + 1]
      if (next && !next.value.startsWith('-') && !next.quoted) {
        flags[key] = next.value; i++
      } else if (next && !next.value.startsWith('-') && next.quoted) {
        flags[key] = next.value; i++
      } else {
        flags[key] = ''
      }
    } else {
      args.push(tok.value)
    }
    i++
  }
  return { command, args, flags }
}

function tsTokenize(input: string): Array<{ value: string; quoted: boolean }> {
  const tokens: Array<{ value: string; quoted: boolean }> = []
  let current = ''
  let inQuote: string | null = null
  let isQuoted = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuote === null && (ch === '"' || ch === "'")) {
      inQuote = ch; isQuoted = true
    } else if (inQuote !== null && ch === inQuote) {
      tokens.push({ value: current, quoted: true }); current = ''; inQuote = null; isQuoted = false
    } else if (inQuote === '"' && ch === '\\') {
      const next = input[++i]
      current += next === 'n' ? '\n' : next === 't' ? '\t' : next ?? ''
    } else if (inQuote === null && /\s/.test(ch)) {
      if (current) { tokens.push({ value: current, quoted: isQuoted }); current = ''; isQuoted = false }
    } else {
      current += ch
    }
  }
  if (current) tokens.push({ value: current, quoted: isQuoted })
  return tokens
}

// ─── Python-backed command module ─────────────────────────────────────────────

/** Python source that defines the Python-backed wxlsh commands. */
const WXLSH_PYTHON_COMMANDS = `
import json, base64 as _b64, urllib.parse, hashlib

class _WxlshDispatch:
    """Thin wrapper that routes HTTP via the async JS dispatch bridge."""
    def __init__(self, bridge):
        self._bridge = bridge

    async def request(self, method, url, headers=None, body=None):
        headers_json = json.dumps(dict(headers or {}))
        raw_json = await self._bridge(method, url, headers_json, body or '')
        raw = json.loads(raw_json)
        return _WxlshResponse(raw)

class _WxlshResponse:
    def __init__(self, raw):
        self.status_code = int(raw['status'])
        self._headers = dict(raw.get('headers', {}))
        self.text = raw.get('body', '')
        self.content = self.text.encode('utf-8', errors='replace')

    @property
    def headers(self):
        return self._headers

    def json(self):
        return json.loads(self.text)

    def __repr__(self):
        return f'<WxlshResponse [{self.status_code}]>'

_wxlsh_http = _WxlshDispatch(_wxlsh_dispatch_bridge)

async def _cmd_curl(args, flags):
    """curl — transfer data from or to a server.

    Flags:
      -X METHOD   Request method (default GET)
      -d DATA     POST data (auto-sets method to POST)
      -H "K: V"   Add request header (multiple -H stored in list)
      -i          Include response headers in output
      -s          Silent mode (suppress progress info)
      -L          Follow redirects (note: auto-followed by runtime)
      -o FILE     Write output to FILE instead of stdout
      -v          Verbose — show full request details
    """
    # Recover URLs swallowed by boolean flags (parser assigns next token as value)
    _bool_flags = ('i', 's', 'L', 'v')
    args = list(args)
    for bf in _bool_flags:
        val = flags.get(bf, '')
        if val:
            args.append(val)
            flags[bf] = ''

    method = flags.get('X', flags.get('method', 'GET')).upper()
    if 'd' in flags or 'data' in flags:
        method = 'POST'
    body = flags.get('d', flags.get('data', ''))

    # Collect headers from -H flags (value may contain colons, e.g. "Authorization: Bearer xxx")
    raw_headers = {}
    h_val = flags.get('H', flags.get('header', ''))
    if h_val:
        parts = h_val.split(':', 1)
        if len(parts) == 2:
            raw_headers[parts[0].strip()] = parts[1].strip()

    if not args:
        return 'Usage: curl [-X METHOD] [-d DATA] [-H "Header: Value"] [-i] [-s] [-L] [-o FILE] [-v] <url>'

    url = args[-1]
    if not url.startswith('http'):
        url = 'https://challenge-' + _wxlsh_slug + '.localhost/' + url.lstrip('/')

    # Flag booleans
    include_headers = 'i' in flags
    silent = 's' in flags
    follow_redirects = 'L' in flags
    output_file = flags.get('o', flags.get('output', ''))
    verbose = 'v' in flags

    r = await _wxlsh_http.request(method, url, raw_headers, body)

    lines = []

    # Verbose: show request details
    if verbose:
        lines.append(f'> {method} {url}')
        for k, v in raw_headers.items():
            lines.append(f'> {k}: {v}')
        if body:
            lines.append(f'> {body}')
        lines.append(f'< {r.status_code}')
        for k, v in r.headers.items():
            lines.append(f'< {k}: {v}')
        lines.append('')

    # Follow-redirects note
    if follow_redirects and not silent:
        lines.append('* follow redirects enabled (auto-followed by runtime)')

    # Output to file
    if output_file:
        return f'curl: saved to {output_file}'

    # Include response headers
    if include_headers and not verbose:
        lines.append(f'HTTP {r.status_code}')
        for k, v in r.headers.items():
            lines.append(f'{k}: {v}')
        lines.append('')

    # Response body
    ct = r.headers.get('content-type', r.headers.get('Content-Type', ''))
    if 'json' in ct:
        try:
            lines.append(json.dumps(r.json(), indent=2, ensure_ascii=False))
        except Exception:
            lines.append(r.text)
    else:
        lines.append(r.text)
    return '\\n'.join(lines)

async def _cmd_wget(args, flags):
    """wget — non-interactive network downloader.

    Flags:
      -O FILE   Save to FILE
      -q        Quiet mode (suppress output messages)
    """
    # Recover URLs swallowed by boolean flags (parser assigns next token as value)
    args = list(args)
    q_val = flags.get('q', '')
    if q_val:
        args.append(q_val)
        flags['q'] = ''

    if not args:
        return 'Usage: wget [-O FILE] [-q] <url>'

    url = args[-1]
    if not url.startswith('http'):
        url = 'https://challenge-' + _wxlsh_slug + '.localhost/' + url.lstrip('/')

    output_file = flags.get('O', '')
    quiet = 'q' in flags

    r = await _wxlsh_http.request('GET', url)

    if output_file:
        if not quiet:
            return f'wget: saved to {output_file} ({len(r.text)} bytes)'
        return f'wget: saved to {output_file}'

    lines = []
    if not quiet:
        lines.append(f'--  {url}')
        lines.append(f'HTTP {r.status_code}')
        lines.append('')
    lines.append(r.text)
    return '\\n'.join(lines)

def _cmd_decode(args, flags):
    if not args:
        return 'Usage: decode <base64|url|hex> <value>'
    mode = args[0] if len(args) > 1 else 'base64'
    value = ' '.join(args[1:] if len(args) > 1 else args)
    if mode == 'base64':
        try:
            return _b64.b64decode(value + '==').decode('utf-8', errors='replace')
        except Exception as e:
            return f'decode error: {e}'
    elif mode == 'url':
        return urllib.parse.unquote(value)
    elif mode == 'hex':
        try:
            return bytes.fromhex(value.replace(' ', '')).decode('utf-8', errors='replace')
        except Exception as e:
            return f'decode error: {e}'
    return f'Unknown encoding: {mode}'

def _cmd_encode(args, flags):
    if not args:
        return 'Usage: encode <base64|url|hex> <value>'
    mode = args[0] if len(args) > 1 else 'base64'
    value = ' '.join(args[1:] if len(args) > 1 else args)
    if mode == 'base64':
        return _b64.b64encode(value.encode()).decode()
    elif mode == 'url':
        return urllib.parse.quote(value)
    elif mode == 'hex':
        return value.encode('utf-8').hex()
    return f'Unknown encoding: {mode}'

def _cmd_base64(args, flags):
    value = ' '.join(args) if args else ''
    if 'd' in flags:
        try:
            return _b64.b64decode(value + '==').decode('utf-8', errors='replace')
        except Exception as e:
            return f'base64: invalid input: {e}'
    else:
        if not value:
            return 'Usage: base64 [-d] <string>'
        return _b64.b64encode(value.encode()).decode()

def _cmd_xxd(args, flags):
    value = ' '.join(args) if args else ''
    if 'r' in flags:
        try:
            hex_str = value.replace(' ', '').replace('\\n', '')
            return bytes.fromhex(hex_str).decode('utf-8', errors='replace')
        except Exception as e:
            return f'xxd: invalid hex: {e}'
    if 'p' in flags:
        if not value:
            return 'Usage: xxd [-r] [-p] <string>'
        return value.encode('utf-8').hex()
    if not value:
        return 'Usage: xxd [-r] [-p] <string>'
    data = value.encode('utf-8')
    lines = []
    for offset in range(0, len(data), 16):
        chunk = data[offset:offset+16]
        hex_part = ' '.join(f'{b:02x}' for b in chunk)
        ascii_part = ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)
        lines.append(f'{offset:08x}: {hex_part:<48s}  {ascii_part}')
    return '\\n'.join(lines)

def _cmd_md5sum(args, flags):
    value = ' '.join(args) if args else ''
    if not value:
        return 'Usage: md5sum <string>'
    h = hashlib.md5(value.encode()).hexdigest()
    return f'{h}  -'

def _cmd_sha256sum(args, flags):
    value = ' '.join(args) if args else ''
    if not value:
        return 'Usage: sha256sum <string>'
    h = hashlib.sha256(value.encode()).hexdigest()
    return f'{h}  -'

def _cmd_urlencode(args, flags):
    value = ' '.join(args) if args else ''
    if not value:
        return 'Usage: urlencode <string>'
    return urllib.parse.quote(value)

def _cmd_urldecode(args, flags):
    value = ' '.join(args) if args else ''
    if not value:
        return 'Usage: urldecode <string>'
    return urllib.parse.unquote(value)

def _pop_bool_flags(flags, keys, args):
    """Move values captured by boolean flags back into args list."""
    for k in keys:
        if k in flags and flags[k]:
            args.insert(0, flags[k])
            flags[k] = ''

import re as _re

def _cmd_grep(args, flags):
    _pop_bool_flags(flags, ['i', 'v', 'c', 'n'], args)
    case_i = 'i' in flags
    invert = 'v' in flags
    count = 'c' in flags
    line_nums = 'n' in flags
    if len(args) < 2:
        return 'Usage: grep [options] <pattern> <text>'
    pattern = args[0]
    text = ' '.join(args[1:])
    lines = text.split('\\n')
    regex_flags = _re.IGNORECASE if case_i else 0
    matched = []
    indices = []
    for idx, line in enumerate(lines):
        m = bool(_re.search(pattern, line, regex_flags))
        if invert:
            m = not m
        if m:
            matched.append(line)
            indices.append(idx)
    if count:
        return str(len(matched))
    if line_nums:
        return '\\n'.join(f'{indices[i]+1}:{matched[i]}' for i in range(len(matched)))
    return '\\n'.join(matched)

def _cmd_sed(args, flags):
    if len(args) < 2:
        return 'Usage: sed <expression> <text>'
    expr = args[0]
    text = ' '.join(args[1:])
    m = _re.match(r'^s/((?:[^/\\\\]|\\\\.)*)/((?:[^/\\\\]|\\\\.)*)/(g?)$', expr)
    if not m:
        return f'sed: invalid expression: {expr}'
    pat, repl, g = m.group(1), m.group(2), m.group(3)
    count_val = 0 if g else 1
    return _re.sub(pat, repl, text, count=count_val)

def _cmd_awk(args, flags):
    if len(args) < 2:
        return 'Usage: awk <program> <text>'
    program = args[0]
    text = ' '.join(args[1:])
    m = _re.match(r'^\\{print \\$(\\d+)\\}$', program)
    if not m:
        return f'awk: unsupported program: {program}'
    field_idx = int(m.group(1))
    lines = text.split('\\n')
    result = []
    for line in lines:
        fields = line.split()
        if field_idx == 0:
            result.append(line)
        elif field_idx <= len(fields):
            result.append(fields[field_idx - 1])
        else:
            result.append('')
    return '\\n'.join(result)

def _cmd_sort(args, flags):
    _pop_bool_flags(flags, ['r', 'n', 'u'], args)
    reverse = 'r' in flags
    numeric = 'n' in flags
    unique = 'u' in flags
    if not args:
        return ''
    text = ' '.join(args)
    lines = text.split('\\n')
    if numeric:
        lines.sort(key=lambda x: float(x) if x.replace('.','',1).replace('-','',1).isdigit() else 0)
    else:
        lines.sort()
    if reverse:
        lines.reverse()
    if unique:
        seen = set()
        deduped = []
        for l in lines:
            if l not in seen:
                seen.add(l)
                deduped.append(l)
        lines = deduped
    return '\\n'.join(lines)

def _cmd_uniq(args, flags):
    _pop_bool_flags(flags, ['c', 'd'], args)
    show_count = 'c' in flags
    dupes_only = 'd' in flags
    if not args:
        return ''
    text = ' '.join(args)
    lines = text.split('\\n')
    result = []
    i = 0
    while i < len(lines):
        cnt = 1
        while i + cnt < len(lines) and lines[i + cnt] == lines[i]:
            cnt += 1
        if dupes_only and cnt == 1:
            i += cnt
            continue
        if show_count:
            result.append(f'{cnt} {lines[i]}')
        else:
            result.append(lines[i])
        i += cnt
    return '\\n'.join(result)

def _cmd_cut(args, flags):
    delim = flags.get('d', '\\t')
    fields_str = flags.get('f', '1')
    if not args:
        return 'Usage: cut [-d delimiter] [-f fields] <text>'
    text = ' '.join(args)
    field_nums = [int(n) for n in fields_str.split(',')]
    lines = text.split('\\n')
    result = []
    for line in lines:
        parts = line.split(delim)
        result.append(delim.join(parts[f-1] if f-1 < len(parts) else '' for f in field_nums))
    return '\\n'.join(result)

def _cmd_tr(args, flags):
    if len(args) < 3:
        return 'Usage: tr <set1> <set2> <text>'
    set1, set2 = args[0], args[1]
    text = ' '.join(args[2:])
    table = str.maketrans(set1, set2[:len(set1)])
    return text.translate(table)

def _cmd_tee(args, flags):
    return ' '.join(args) if args else ''

def _cmd_xargs(args, flags):
    return ' '.join(args) if args else ''

def _cmd_diff(args, flags):
    if len(args) < 2:
        return 'Usage: diff <text1> <text2>'
    a_lines = args[0].split('\\n')
    b_lines = args[1].split('\\n')
    result = []
    max_len = max(len(a_lines), len(b_lines))
    for i in range(max_len):
        a = a_lines[i] if i < len(a_lines) else None
        b = b_lines[i] if i < len(b_lines) else None
        if a != b:
            if a is not None:
                result.append(f'< {a}')
            if b is not None:
                result.append(f'> {b}')
    return '\\n'.join(result) if result else ''

_wxlsh_commands_py = {
    'curl': _cmd_curl,
    'wget': _cmd_wget,
    'decode': _cmd_decode,
    'encode': _cmd_encode,
    'base64': _cmd_base64,
    'xxd': _cmd_xxd,
    'md5sum': _cmd_md5sum,
    'sha256sum': _cmd_sha256sum,
    'urlencode': _cmd_urlencode,
    'urldecode': _cmd_urldecode,
    'grep': _cmd_grep,
    'sed': _cmd_sed,
    'awk': _cmd_awk,
    'sort': _cmd_sort,
    'uniq': _cmd_uniq,
    'cut': _cmd_cut,
    'tr': _cmd_tr,
    'tee': _cmd_tee,
    'xargs': _cmd_xargs,
    'diff': _cmd_diff,
}
`

// ─── Tier classification ─────────────────────────────────────────────────────

const TIER1_COMMANDS = new Set([
  'help', 'clear', 'echo', 'pwd', 'cd', 'whoami', 'id', 'env',
  'export', 'history', 'date', 'which',
])
const TIER5_COMMANDS = new Set(['dirb', 'dirsearch', 'sqlmap', 'jwt', 'hydra', 'nmap'])
const PYTHON_COMMANDS = new Set([
  'curl', 'wget', 'decode', 'encode', 'base64', 'xxd', 'md5sum', 'sha256sum',
  'urlencode', 'urldecode', 'grep', 'sed', 'awk', 'sort', 'uniq', 'cut',
  'tr', 'tee', 'xargs', 'diff',
])

// ─── Help registry ───────────────────────────────────────────────────────────

interface HelpEntry {
  brief: string
  usage: string
  description: string
  category: 'Shell' | 'Text' | 'Encoding' | 'Network'
}

const HELP_REGISTRY: Record<string, HelpEntry> = {
  // ── Shell ──────────────────────────────────────────────────────────────
  help:    { category: 'Shell', brief: 'display help for commands', usage: 'help [command]', description: 'Without arguments, lists all available commands.\nWith a command name, shows detailed usage for that command.' },
  clear:   { category: 'Shell', brief: 'clear the terminal screen', usage: 'clear', description: 'Clears all output from the terminal.' },
  echo:    { category: 'Shell', brief: 'display text', usage: 'echo [text ...]', description: 'Prints the given arguments separated by spaces.' },
  pwd:     { category: 'Shell', brief: 'print working directory', usage: 'pwd', description: 'Displays the current working directory path.' },
  cd:      { category: 'Shell', brief: 'change directory', usage: 'cd [directory]', description: 'Changes the current working directory.\n  cd         go to home directory (~)\n  cd ~       go to home directory\n  cd ..      go to parent directory\n  cd /path   go to absolute path\n  cd path    go to relative path' },
  whoami:  { category: 'Shell', brief: 'print current username', usage: 'whoami', description: 'Displays the current user name.' },
  id:      { category: 'Shell', brief: 'print user identity', usage: 'id', description: 'Displays uid, gid, and group membership of the current user.' },
  env:     { category: 'Shell', brief: 'print environment variables', usage: 'env', description: 'Displays all environment variables in KEY=VALUE format.' },
  export:  { category: 'Shell', brief: 'set environment variable', usage: 'export KEY=VALUE [...]', description: 'Sets one or more environment variables.\nExample: export DEBUG=1 LANG=en_US' },
  history: { category: 'Shell', brief: 'show command history', usage: 'history', description: 'Displays previously executed commands in this session.' },
  date:    { category: 'Shell', brief: 'display current date and time', usage: 'date', description: 'Displays the current date and time in Linux format.\nExample output: Tue Mar 25 22:40:36 CST 2026' },
  which:   { category: 'Shell', brief: 'locate a command', usage: 'which <command>', description: 'Shows the path of the given command, or reports if it is not found.' },
  // ── Text ───────────────────────────────────────────────────────────────
  grep:    { category: 'Text', brief: 'search text using patterns', usage: 'grep [options] <pattern> [text]', description: 'Searches for lines matching a pattern.\n  -i    case-insensitive matching\n  -v    invert match (show non-matching lines)\n  -c    print count of matching lines\n  -n    prefix each line with line number' },
  sed:     { category: 'Text', brief: 'stream editor for text', usage: 'sed <expression> [text]', description: 'Applies substitution and transformation expressions.\nExample: sed "s/old/new/g"' },
  awk:     { category: 'Text', brief: 'pattern scanning and processing', usage: 'awk <program> [text]', description: 'Processes text using a pattern-action language.\nExample: awk "{print $1}"' },
  sort:    { category: 'Text', brief: 'sort lines of text', usage: 'sort [options] [text]', description: 'Sorts input lines alphabetically.\n  -r    reverse order\n  -n    numeric sort\n  -u    unique lines only' },
  uniq:    { category: 'Text', brief: 'filter duplicate lines', usage: 'uniq [options] [text]', description: 'Removes consecutive duplicate lines.\n  -c    prefix lines with occurrence count\n  -d    only print duplicated lines' },
  cut:     { category: 'Text', brief: 'extract fields from text', usage: 'cut [options] [text]', description: 'Extracts sections from each line.\n  -d <delim>   use <delim> as field delimiter\n  -f <fields>  select fields (e.g., -f 1,3)' },
  tr:      { category: 'Text', brief: 'translate characters', usage: 'tr <set1> <set2> [text]', description: 'Translates or deletes characters.\nExample: tr "a-z" "A-Z" (lowercase to uppercase)' },
  tee:     { category: 'Text', brief: 'read from stdin and write to stdout', usage: 'tee [text]', description: 'Passes input through to output (useful in pipes).' },
  xargs:   { category: 'Text', brief: 'build commands from input', usage: 'xargs <command> [text]', description: 'Reads input and passes it as arguments to a command.' },
  diff:    { category: 'Text', brief: 'compare two texts', usage: 'diff <text1> <text2>', description: 'Shows differences between two inputs line by line.' },
  // ── Encoding ───────────────────────────────────────────────────────────
  base64:    { category: 'Encoding', brief: 'base64 encode/decode', usage: 'base64 [options] <text>', description: 'Encodes or decodes base64.\n  -d    decode instead of encode' },
  decode:    { category: 'Encoding', brief: 'auto-detect and decode', usage: 'decode <text>', description: 'Attempts to detect the encoding of the input and decode it automatically.' },
  encode:    { category: 'Encoding', brief: 'encode text in various formats', usage: 'encode <format> <text>', description: 'Encodes text in the specified format (base64, hex, url).' },
  xxd:       { category: 'Encoding', brief: 'hex dump', usage: 'xxd [options] <text>', description: 'Creates a hex dump of the input.\n  -r    reverse (hex to binary)\n  -p    plain hex dump (no line numbers)' },
  md5sum:    { category: 'Encoding', brief: 'compute MD5 hash', usage: 'md5sum <text>', description: 'Calculates and displays the MD5 hash of the input.' },
  sha256sum: { category: 'Encoding', brief: 'compute SHA-256 hash', usage: 'sha256sum <text>', description: 'Calculates and displays the SHA-256 hash of the input.' },
  urlencode: { category: 'Encoding', brief: 'URL-encode text', usage: 'urlencode <text>', description: 'Encodes text for use in URLs (percent-encoding).' },
  urldecode: { category: 'Encoding', brief: 'URL-decode text', usage: 'urldecode <text>', description: 'Decodes percent-encoded URL text back to plain text.' },
  // ── Network ────────────────────────────────────────────────────────────
  curl:    { category: 'Network', brief: 'transfer data from a URL', usage: 'curl [options] <url>', description: 'Sends HTTP requests and displays the response.\n  -X <method>   HTTP method (GET, POST, PUT, DELETE)\n  -d <data>     request body\n  -H <header>   add header (e.g., -H "Content-Type: application/json")\n  -v            verbose output (show headers)\n  -o <file>     write output to file\n  -I            show response headers only' },
  wget:    { category: 'Network', brief: 'download from a URL', usage: 'wget [options] <url>', description: 'Downloads content from a URL.\n  -O <file>   save to file\n  -q          quiet mode' },
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useWxlsh(options: WxlshOptions) {
  const { slug, dispatch, pyodide, commands: allowedCommands = [] } = options
  const { appendHistory, loadHistory } = useChallengePersistence()

  // In-memory history ring for arrow-key navigation
  const historyBuffer = ref<string[]>([])
  const historyIndex = ref(-1)   // -1 = not navigating
  let pythonCommandsLoaded = false

  // ─── Shell state ──────────────────────────────────────────────────────
  let cwd = '/home/hacker'
  const envVars: Record<string, string> = { USER: 'hacker', HOME: '/home/hacker', SHELL: '/bin/wxlsh' }

  // ─── Tier 1: TypeScript commands ─────────────────────────────────────
  function executeTier1(command: string, args: string[], _flags: Record<string, string>): CommandResult | null {
    if (!TIER1_COMMANDS.has(command)) return null
    switch (command) {
      case 'help': {
        if (args[0]) {
          const entry = HELP_REGISTRY[args[0]]
          if (!entry) return { output: `help: no help for '${args[0]}'` }
          return { output: `${args[0]} — ${entry.brief}\n\nUsage: ${entry.usage}\n\n${entry.description}` }
        }
        const categories: Array<{ label: string; key: HelpEntry['category'] }> = [
          { label: 'Shell', key: 'Shell' },
          { label: 'Text', key: 'Text' },
          { label: 'Encoding', key: 'Encoding' },
          { label: 'Network', key: 'Network' },
        ]
        const lines = ['Available commands:', '']
        for (const cat of categories) {
          const cmds = Object.entries(HELP_REGISTRY)
            .filter(([, e]) => e.category === cat.key)
            .sort(([a], [b]) => a.localeCompare(b))
          if (cmds.length === 0) continue
          lines.push(`  ${cat.label}:`)
          for (const [name, entry] of cmds) {
            lines.push(`    ${name.padEnd(12)}${entry.brief}`)
          }
          lines.push('')
        }
        lines.push("Type 'help <command>' for detailed usage.")
        return { output: lines.join('\n') }
      }
      case 'clear': return { output: '', clear: true }
      case 'echo': return { output: args.join(' ') }
      case 'pwd': return { output: cwd }
      case 'cd': {
        const target = args[0] ?? envVars.HOME
        let path: string
        if (target === '~' || target === '') path = envVars.HOME
        else if (target.startsWith('~/')) path = envVars.HOME + target.slice(1)
        else if (target.startsWith('/')) path = target
        else path = cwd === '/' ? `/${target}` : `${cwd}/${target}`
        // Normalize: resolve . and ..
        const parts = path.split('/').filter(Boolean)
        const resolved: string[] = []
        for (const p of parts) {
          if (p === '.') continue
          else if (p === '..') resolved.pop()
          else resolved.push(p)
        }
        cwd = '/' + resolved.join('/')
        return { output: '' }
      }
      case 'whoami': return { output: envVars.USER }
      case 'id': return { output: `uid=1000(${envVars.USER}) gid=1000(${envVars.USER}) groups=1000(${envVars.USER})` }
      case 'date': {
        const d = new Date()
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const pad = (n: number) => n.toString().padStart(2, '0')
        const tz = d.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() ?? ''
        return { output: `${days[d.getDay()]} ${months[d.getMonth()]} ${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${tz} ${d.getFullYear()}` }
      }
      case 'env': return { output: Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n') }
      case 'export': {
        for (const a of args) {
          const eq = a.indexOf('=')
          if (eq > 0) envVars[a.slice(0, eq)] = a.slice(eq + 1)
        }
        return { output: '' }
      }
      case 'which': {
        if (!args[0]) return { output: 'Usage: which <command>' }
        const cmd = args[0]
        if (TIER1_COMMANDS.has(cmd) || PYTHON_COMMANDS.has(cmd) || TIER5_COMMANDS.has(cmd)) {
          return { output: `/usr/bin/${cmd}` }
        }
        return { output: `${cmd} not found`, error: true }
      }
      case 'history': return { output: historyBuffer.value.join('\n') }
      default: return null
    }
  }

  // ─── Initialise ─────────────────────────────────────────────────────────

  /** Restore history from IDB on first use. */
  async function init() {
    historyBuffer.value = await loadHistory(200)
    historyIndex.value = -1
    await loadWasm()
  }

  // ─── Python bridge setup ────────────────────────────────────────────────

  async function ensurePythonCommands(): Promise<boolean> {
    const py = pyodide.value
    if (!py || pythonCommandsLoaded) return !!py
    try {
      // _wxlsh_dispatch_bridge is already injected by ChallengeLayout
      py.globals.set('_wxlsh_slug', slug)
      await py.runPythonAsync(WXLSH_PYTHON_COMMANDS)
      pythonCommandsLoaded = true
    } catch (e) {
      console.warn('[useWxlsh] Python command setup failed:', e)
    }
    return pythonCommandsLoaded
  }

  // ─── Command execution ───────────────────────────────────────────────────

  /** Execute a single command (no pipe handling). Accepts optional stdin from pipe. */
  async function executeSingle(cmdInput: string, stdin?: string): Promise<CommandResult> {
    const trimmed = cmdInput.trim()
    if (!trimmed) return { output: '' }

    const wasm = await loadWasm()
    const parsed = wasm.wasm_parse_command(trimmed)
    if (!parsed || !parsed.command) return { output: '' }

    const { command, flags } = parsed
    // When piped, prepend stdin as first arg so commands can consume it
    const args = stdin !== undefined ? [stdin, ...parsed.args] : parsed.args

    // ─── Tier 1: TypeScript core shell commands ────────────────────────
    const tier1Result = executeTier1(command, args, flags)
    if (tier1Result !== null) return tier1Result

    // ─── Tier 2–4: Python-backed commands (try WASM native first) ─────
    try {
      const native = wasm.wasm_execute_native(command, args, flags)
      if (native !== null) {
        return { output: native.output, clear: native.clear }
      }
    } catch {
      // WASM not available — fall through to Python
    }

    const pyReady = await ensurePythonCommands()
    if (pyReady && pyodide.value) {
      const py = pyodide.value
      try {
        const cmds = py.globals.get('_wxlsh_commands_py') as Record<string, unknown>
        if (cmds && command in cmds) {
          // serde_wasm_bindgen serializes HashMap as a JS Map, which JSON.stringify
          // ignores (produces '{}'). Convert to a plain object for Python.
          const plainFlags: Record<string, string> = flags instanceof Map
            ? Object.fromEntries(flags)
            : (typeof flags === 'object' && flags !== null ? { ...flags } : {})
          const result = await py.runPythonAsync(
            `_r = _wxlsh_commands_py[${JSON.stringify(command)}](${JSON.stringify(args)}, ${JSON.stringify(plainFlags)})\n` +
            `import inspect as _ins\n` +
            `str(await _r if _ins.isawaitable(_r) else _r)`
          )
          return { output: String(result) }
        }
      } catch (e) {
        return { output: `Error: ${e instanceof Error ? e.message : String(e)}`, error: true }
      }
    }

    // ─── Tier 5: Controlled penetration testing commands ──────────────
    if (TIER5_COMMANDS.has(command)) {
      const isAllowed = allowedCommands.includes('all') || allowedCommands.includes(command)
      if (!isAllowed) {
        return {
          output: `wxlsh: '${command}' is not available for this challenge.\nThis command is controlled by the challenge author.`,
          error: true,
        }
      }
      // TODO: Implement Tier 5 command execution (task 11.6)
      return { output: `${command}: not yet implemented`, error: true }
    }

    // ─── Unknown command ──────────────────────────────────────────────
    return {
      output: `wxlsh: command not found: ${command}\nType 'help' for available commands.`,
      error: true,
    }
  }

  /** Execute input with pipe `|` support. */
  async function execute(input: string): Promise<CommandResult> {
    const trimmed = input.trim()
    if (!trimmed) return { output: '' }

    // Persist to history
    await appendHistory(trimmed)
    historyBuffer.value = [...historyBuffer.value, trimmed]
    historyIndex.value = -1

    // Split on pipe `|` (outside quotes)
    const segments = splitPipe(trimmed)

    if (segments.length === 1) {
      return executeSingle(segments[0])
    }

    // Chain: each command's stdout becomes the next command's stdin
    let lastOutput: string | undefined
    let lastResult: CommandResult = { output: '' }
    for (const segment of segments) {
      lastResult = await executeSingle(segment, lastOutput)
      if (lastResult.error) return lastResult
      lastOutput = lastResult.output
    }
    return lastResult
  }

  /** Split input on `|` respecting quotes. */
  function splitPipe(input: string): string[] {
    const segments: string[] = []
    let current = ''
    let inQuote: string | null = null
    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      if (inQuote) {
        if (ch === inQuote) inQuote = null
        current += ch
      } else if (ch === '"' || ch === "'") {
        inQuote = ch
        current += ch
      } else if (ch === '|') {
        segments.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    if (current.trim()) segments.push(current)
    return segments
  }

  // ─── History navigation ──────────────────────────────────────────────────

  /** Returns the previous history entry (up arrow). */
  function historyPrev(currentInput: string): string {
    const buf = historyBuffer.value
    if (buf.length === 0) return currentInput
    if (historyIndex.value === -1) {
      historyIndex.value = buf.length - 1
    } else if (historyIndex.value > 0) {
      historyIndex.value--
    }
    return buf[historyIndex.value]
  }

  /** Returns the next history entry (down arrow), or '' if past the end. */
  function historyNext(): string {
    const buf = historyBuffer.value
    if (historyIndex.value === -1) return ''
    if (historyIndex.value < buf.length - 1) {
      historyIndex.value++
      return buf[historyIndex.value]
    }
    historyIndex.value = -1
    return ''
  }

  // ─── Prompt helpers ──────────────────────────────────────────────────────

  /** Return the current working directory with `~` shorthand for HOME. */
  function getCwd(): string {
    const home = envVars.HOME
    if (cwd === home) return '~'
    if (cwd.startsWith(home + '/')) return '~' + cwd.slice(home.length)
    return cwd
  }

  /** Return the ANSI-colored prompt string and its plain-text length. */
  function getPrompt(): { text: string; length: number } {
    const displayCwd = getCwd()
    const text = `\x1b[1;32mhacker@wxlsh\x1b[0m:\x1b[1;34m${displayCwd}\x1b[0m$ `
    const length = `hacker@wxlsh:${displayCwd}$ `.length
    return { text, length }
  }

  return { init, execute, historyPrev, historyNext, historyBuffer, getCwd, getPrompt }
}
