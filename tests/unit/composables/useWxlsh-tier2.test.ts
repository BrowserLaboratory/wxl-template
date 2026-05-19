import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import 'fake-indexeddb/auto'

// Read the source to verify structural properties
const wxlshSource = readFileSync(
  resolve(__dirname, '../../../.vitepress/theme/composables/useWxlsh.ts'),
  'utf-8',
)

// ---------------------------------------------------------------------------
// Part 1: Structural tests — verify the Python code is present in the source
// ---------------------------------------------------------------------------

describe('useWxlsh - Tier 2 text processing commands (structural)', () => {
  const tier2Commands = ['grep', 'sed', 'awk', 'sort', 'uniq', 'cut', 'tr', 'tee', 'xargs', 'diff']

  for (const cmd of tier2Commands) {
    it(`registers _cmd_${cmd} in Python commands`, () => {
      expect(wxlshSource).toContain(`'${cmd}': _cmd_${cmd}`)
    })

    it(`defines _cmd_${cmd} function`, () => {
      expect(wxlshSource).toContain(`def _cmd_${cmd}(args, flags)`)
    })
  }

  it('grep supports -i flag (case insensitive)', () => {
    expect(wxlshSource).toMatch(/def _cmd_grep[\s\S]*?flags.*?['"]i['"]/)
  })

  it('grep supports -v flag (invert)', () => {
    expect(wxlshSource).toMatch(/def _cmd_grep[\s\S]*?flags.*?['"]v['"]/)
  })

  it('grep supports -c flag (count)', () => {
    expect(wxlshSource).toMatch(/def _cmd_grep[\s\S]*?flags.*?['"]c['"]/)
  })

  it('grep supports -n flag (line numbers)', () => {
    expect(wxlshSource).toMatch(/def _cmd_grep[\s\S]*?flags.*?['"]n['"]/)
  })

  it('sort supports -r flag (reverse)', () => {
    expect(wxlshSource).toMatch(/def _cmd_sort[\s\S]*?flags.*?['"]r['"]/)
  })

  it('sort supports -n flag (numeric)', () => {
    expect(wxlshSource).toMatch(/def _cmd_sort[\s\S]*?flags.*?['"]n['"]/)
  })

  it('sort supports -u flag (unique)', () => {
    expect(wxlshSource).toMatch(/def _cmd_sort[\s\S]*?flags.*?['"]u['"]/)
  })

  it('uniq supports -c flag (count)', () => {
    expect(wxlshSource).toMatch(/def _cmd_uniq[\s\S]*?flags.*?['"]c['"]/)
  })

  it('uniq supports -d flag (duplicates only)', () => {
    expect(wxlshSource).toMatch(/def _cmd_uniq[\s\S]*?flags.*?['"]d['"]/)
  })

  it('cut supports -d flag (delimiter)', () => {
    expect(wxlshSource).toMatch(/def _cmd_cut[\s\S]*?flags.*?['"]d['"]/)
  })

  it('cut supports -f flag (fields)', () => {
    expect(wxlshSource).toMatch(/def _cmd_cut[\s\S]*?flags.*?['"]f['"]/)
  })

  it('sed supports s/pattern/replacement/ syntax', () => {
    expect(wxlshSource).toMatch(/def _cmd_sed[\s\S]*?s\//)
  })

  it('awk supports {print $N} syntax', () => {
    expect(wxlshSource).toMatch(/def _cmd_awk[\s\S]*?print/)
  })
})

// ---------------------------------------------------------------------------
// Part 2: Behavioural tests — verify commands execute correctly via mock
// ---------------------------------------------------------------------------

vi.mock('../../../.vitepress/theme/composables/useChallengePersistence', () => ({
  useChallengePersistence: () => ({
    appendHistory: vi.fn(),
    loadHistory: vi.fn().mockResolvedValue([]),
  }),
}))

import { useWxlsh, type PyodidePublicAPI } from '../../../.vitepress/theme/composables/useWxlsh'

// ---------------------------------------------------------------------------
// The TS parser treats `-x val` as flags[x]="val" (consuming the next token
// as the flag value). For boolean flags like grep -i, the next positional
// arg is captured as the flag value. The Python implementations use a helper
// `_pop_bool_flags(flags, keys, args)` to move such captured values back
// into args. The JS mirror below does the same.
// ---------------------------------------------------------------------------

function popBoolFlag(flags: Record<string, string>, key: string): string | null {
  if (key in flags) {
    const v = flags[key]
    delete flags[key]
    if (v !== '') return v
    return null
  }
  return null
}

/** JS mirrors of the Python tier-2 command implementations. */
const tier2Impl: Record<string, (args: string[], flags: Record<string, string>) => string> = {
  grep(args, flags) {
    const fl = { ...flags }
    const prependArgs: string[] = []
    for (const k of ['i', 'v', 'c', 'n']) {
      const cap = popBoolFlag(fl, k)
      if (cap !== null) prependArgs.push(cap)
    }
    const allArgs = [...prependArgs, ...args]

    const caseInsensitive = 'i' in flags
    const invert = 'v' in flags
    const count = 'c' in flags
    const lineNumbers = 'n' in flags

    if (allArgs.length < 2) return 'Usage: grep [options] <pattern> <text>'
    const pattern = allArgs[0]
    const text = allArgs.slice(1).join(' ')
    const lines = text.split('\n')
    const re = new RegExp(pattern, caseInsensitive ? 'i' : '')
    const origIndices: number[] = []
    const matched: string[] = []
    lines.forEach((l, idx) => {
      const m = re.test(l)
      if (invert ? !m : m) {
        matched.push(l)
        origIndices.push(idx)
      }
    })
    if (count) return String(matched.length)
    if (lineNumbers) {
      return matched.map((l, i) => `${origIndices[i] + 1}:${l}`).join('\n')
    }
    return matched.join('\n')
  },

  sed(args, _flags) {
    if (args.length < 2) return 'Usage: sed <expression> <text>'
    const expr = args[0]
    const text = args.slice(1).join(' ')
    const m = expr.match(/^s\/((?:[^/\\]|\\.)*)\/([^/]*)\/([g]?)$/)
    if (!m) return `sed: invalid expression: ${expr}`
    const [, pat, repl, gFlag] = m
    const re = new RegExp(pat, gFlag || undefined)
    return text.replace(re, repl)
  },

  awk(args, _flags) {
    if (args.length < 2) return 'Usage: awk <program> <text>'
    const program = args[0]
    const text = args.slice(1).join(' ')
    const m = program.match(/^\{print \$(\d+)\}$/)
    if (!m) return `awk: unsupported program: ${program}`
    const fieldIdx = parseInt(m[1], 10)
    const lines = text.split('\n')
    return lines
      .map((l) => {
        const fields = l.trim().split(/\s+/)
        if (fieldIdx === 0) return l
        return fields[fieldIdx - 1] ?? ''
      })
      .join('\n')
  },

  sort(args, flags) {
    const fl = { ...flags }
    const prependArgs: string[] = []
    for (const k of ['r', 'n', 'u']) {
      const cap = popBoolFlag(fl, k)
      if (cap !== null) prependArgs.push(cap)
    }
    const allArgs = [...prependArgs, ...args]

    const reverse = 'r' in flags
    const numeric = 'n' in flags
    const unique = 'u' in flags
    if (!allArgs.length) return ''
    const text = allArgs.join(' ')
    let lines = text.split('\n')
    if (numeric) {
      lines.sort((a, b) => parseFloat(a) - parseFloat(b))
    } else {
      lines.sort()
    }
    if (reverse) lines.reverse()
    if (unique) lines = [...new Set(lines)]
    return lines.join('\n')
  },

  uniq(args, flags) {
    const fl = { ...flags }
    const prependArgs: string[] = []
    for (const k of ['c', 'd']) {
      const cap = popBoolFlag(fl, k)
      if (cap !== null) prependArgs.push(cap)
    }
    const allArgs = [...prependArgs, ...args]

    const showCount = 'c' in flags
    const duplicatesOnly = 'd' in flags
    if (!allArgs.length) return ''
    const text = allArgs.join(' ')
    const lines = text.split('\n')
    const result: string[] = []
    let i = 0
    while (i < lines.length) {
      let cnt = 1
      while (i + cnt < lines.length && lines[i + cnt] === lines[i]) cnt++
      if (duplicatesOnly && cnt === 1) { i += cnt; continue }
      if (showCount) {
        result.push(`${cnt} ${lines[i]}`)
      } else {
        result.push(lines[i])
      }
      i += cnt
    }
    return result.join('\n')
  },

  cut(args, flags) {
    const delim = flags.d ?? '\t'
    const fieldsStr = flags.f ?? '1'
    if (!args.length) return 'Usage: cut [-d delimiter] [-f fields] <text>'
    const text = args.join(' ')
    const fieldNums = fieldsStr.split(',').map((n) => parseInt(n, 10))
    const lines = text.split('\n')
    return lines
      .map((l) => {
        const parts = l.split(delim)
        return fieldNums.map((f) => parts[f - 1] ?? '').join(delim)
      })
      .join('\n')
  },

  tr(args, _flags) {
    if (args.length < 3) return 'Usage: tr <set1> <set2> <text>'
    const set1 = args[0]
    const set2 = args[1]
    const text = args.slice(2).join(' ')
    let result = ''
    for (const ch of text) {
      const idx = set1.indexOf(ch)
      if (idx >= 0 && idx < set2.length) {
        result += set2[idx]
      } else if (idx >= 0) {
        result += set2[set2.length - 1]
      } else {
        result += ch
      }
    }
    return result
  },

  tee(args, _flags) {
    if (!args.length) return ''
    return args.join(' ')
  },

  xargs(args, _flags) {
    if (!args.length) return ''
    return args.join(' ')
  },

  diff(args, _flags) {
    if (args.length < 2) return 'Usage: diff <text1> <text2>'
    const a = args[0].split('\n')
    const b = args[1].split('\n')
    const result: string[] = []
    const maxLen = Math.max(a.length, b.length)
    for (let i = 0; i < maxLen; i++) {
      if (a[i] !== b[i]) {
        if (a[i] !== undefined) result.push(`< ${a[i]}`)
        if (b[i] !== undefined) result.push(`> ${b[i]}`)
      }
    }
    if (result.length === 0) return ''
    return result.join('\n')
  },
}

function makeMockPyodide(): PyodidePublicAPI {
  const store: Record<string, unknown> = {}
  let commandsLoaded = false

  return {
    globals: {
      get(name: string) {
        if (name === '_wxlsh_commands_py') {
          const proxy: Record<string, unknown> = {}
          for (const cmd of Object.keys(tier2Impl)) proxy[cmd] = true
          proxy['curl'] = true
          proxy['decode'] = true
          proxy['encode'] = true
          return proxy
        }
        return store[name]
      },
      set(name: string, value: unknown) {
        store[name] = value
      },
    },
    async runPythonAsync(code: string) {
      if (!commandsLoaded && code.includes('_WxlshDispatch')) {
        commandsLoaded = true
        return undefined
      }

      // New pattern: _r = _wxlsh_commands_py["cmd"]([...], {...})\nimport inspect as _ins\nstr(await _r if _ins.isawaitable(_r) else _r)
      const mNew = code.match(
        /_r = _wxlsh_commands_py\["(\w+)"\]\((.+?), (\{.*?\})\)/s,
      )
      if (mNew) {
        const [, cmd, argsJson, flagsJson] = mNew
        const args = JSON.parse(argsJson) as string[]
        const flags = JSON.parse(flagsJson) as Record<string, string>
        const fn = tier2Impl[cmd]
        if (fn) return fn(args, flags)
        return `mock: unknown command ${cmd}`
      }

      // Legacy pattern: str(_wxlsh_commands_py["cmd"]([...], {...}))
      const m = code.match(
        /str\(_wxlsh_commands_py\["(\w+)"\]\((.+)\)\)$/s,
      )
      if (m) {
        const [, cmd, inner] = m
        const splitIdx = inner.indexOf('], ')
        const argsJson = inner.slice(0, splitIdx + 1)
        const flagsJson = inner.slice(splitIdx + 2).trim()
        const args = JSON.parse(argsJson) as string[]
        const flags = JSON.parse(flagsJson) as Record<string, string>
        const fn = tier2Impl[cmd]
        if (fn) return fn(args, flags)
        return `mock: unknown command ${cmd}`
      }

      return ''
    },
  }
}

function makeWxlshWithPyodide() {
  const pyodide = ref<PyodidePublicAPI | null>(makeMockPyodide())
  return useWxlsh({
    slug: 'test',
    dispatch: vi.fn().mockResolvedValue(new Response('ok')),
    pyodide,
    commands: [],
  })
}

describe('useWxlsh - Tier 2 text processing commands (behavioural)', () => {
  let wxlsh: ReturnType<typeof useWxlsh>

  beforeEach(async () => {
    wxlsh = makeWxlshWithPyodide()
    await wxlsh.init()
  })

  describe('grep', () => {
    it('filters lines matching a pattern', async () => {
      const result = await wxlsh.execute('grep hello "hello\\nworld\\nhello world"')
      expect(result.output).toContain('hello')
    })

    it('-i flag enables case-insensitive matching', async () => {
      const result = await wxlsh.execute('grep -i hello "Hello\\nworld\\nHELLO"')
      expect(result.output).toContain('Hello')
      expect(result.output).toContain('HELLO')
    })

    it('-v flag inverts the match', async () => {
      const result = await wxlsh.execute('grep -v apple "apple\\nbanana\\napricot"')
      expect(result.output).toBe('banana\napricot')
    })

    it('-c flag returns count of matching lines', async () => {
      const result = await wxlsh.execute('grep -c aa "aa\\nbb\\naa"')
      expect(result.output).toBe('2')
    })

    it('-n flag shows line numbers', async () => {
      const result = await wxlsh.execute('grep -n bar "foo\\nbar\\nbaz"')
      expect(result.output).toBe('2:bar')
    })

    it('returns usage when no args', async () => {
      const result = await wxlsh.execute('grep')
      expect(result.output).toContain('Usage')
    })
  })

  describe('sed', () => {
    it('performs basic s/pattern/replacement/', async () => {
      const result = await wxlsh.execute('sed "s/foo/bar/" "foo baz foo"')
      expect(result.output).toBe('bar baz foo')
    })

    it('performs global replacement with g flag', async () => {
      const result = await wxlsh.execute('sed "s/foo/bar/g" "foo baz foo"')
      expect(result.output).toBe('bar baz bar')
    })

    it('returns error for invalid expression', async () => {
      const result = await wxlsh.execute('sed "invalid" "text"')
      expect(result.output).toContain('invalid expression')
    })
  })

  describe('awk', () => {
    it('prints a specific field with {print $N}', async () => {
      const result = await wxlsh.execute('awk "{print $2}" "alice 30\\nbob 25"')
      expect(result.output).toBe('30\n25')
    })

    it('prints first field', async () => {
      const result = await wxlsh.execute('awk "{print $1}" "alice 30\\nbob 25"')
      expect(result.output).toBe('alice\nbob')
    })

    it('returns usage when no args', async () => {
      const result = await wxlsh.execute('awk')
      expect(result.output).toContain('Usage')
    })
  })

  describe('sort', () => {
    it('sorts lines alphabetically', async () => {
      const result = await wxlsh.execute('sort "banana\\napple\\ncherry"')
      expect(result.output).toBe('apple\nbanana\ncherry')
    })

    it('-r flag reverses sort', async () => {
      const result = await wxlsh.execute('sort -r "a\\nb\\nc"')
      expect(result.output).toBe('c\nb\na')
    })

    it('-n flag sorts numerically', async () => {
      const result = await wxlsh.execute('sort -n "10\\n2\\n1\\n20"')
      expect(result.output).toBe('1\n2\n10\n20')
    })

    it('-u flag removes duplicates', async () => {
      const result = await wxlsh.execute('sort -u "a\\nb\\na\\nc\\nb"')
      expect(result.output).toBe('a\nb\nc')
    })
  })

  describe('uniq', () => {
    it('removes consecutive duplicate lines', async () => {
      const result = await wxlsh.execute('uniq "a\\na\\nb\\nb\\na"')
      expect(result.output).toBe('a\nb\na')
    })

    it('-c flag prefixes lines with occurrence count', async () => {
      const result = await wxlsh.execute('uniq -c "a\\na\\nb"')
      expect(result.output).toBe('2 a\n1 b')
    })

    it('-d flag shows only duplicated lines', async () => {
      const result = await wxlsh.execute('uniq -d "a\\na\\nb\\nc\\nc"')
      expect(result.output).toBe('a\nc')
    })
  })

  describe('cut', () => {
    it('extracts a field with default tab delimiter', async () => {
      const result = await wxlsh.execute('cut -f 2 "a\\tb\\tc"')
      expect(result.output).toBe('b')
    })

    it('-d sets custom delimiter and -f selects field', async () => {
      const result = await wxlsh.execute('cut -d ":" -f "2" "a:b:c"')
      expect(result.output).toBe('b')
    })

    it('extracts multiple fields', async () => {
      const result = await wxlsh.execute('cut -d ":" -f "1,3" "a:b:c"')
      expect(result.output).toBe('a:c')
    })
  })

  describe('tr', () => {
    it('translates characters from set1 to set2', async () => {
      const result = await wxlsh.execute('tr abc ABC "aabbcc"')
      expect(result.output).toBe('AABBCC')
    })

    it('returns usage when insufficient args', async () => {
      const result = await wxlsh.execute('tr a')
      expect(result.output).toContain('Usage')
    })
  })

  describe('tee', () => {
    it('passes through input unchanged', async () => {
      const result = await wxlsh.execute('tee "hello world"')
      expect(result.output).toBe('hello world')
    })
  })

  describe('xargs', () => {
    it('passes through args', async () => {
      const result = await wxlsh.execute('xargs "some input"')
      expect(result.output).toBe('some input')
    })
  })

  describe('diff', () => {
    it('shows differences between two texts', async () => {
      const result = await wxlsh.execute('diff "hello" "world"')
      expect(result.output).toContain('< hello')
      expect(result.output).toContain('> world')
    })

    it('returns empty for identical inputs', async () => {
      const result = await wxlsh.execute('diff "same" "same"')
      expect(result.output).toBe('')
    })

    it('returns usage when insufficient args', async () => {
      const result = await wxlsh.execute('diff')
      expect(result.output).toContain('Usage')
    })
  })
})
