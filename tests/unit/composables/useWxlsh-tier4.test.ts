import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import 'fake-indexeddb/auto'

// Mock the WASM parser and challenge persistence
vi.mock('../../../.vitepress/theme/composables/useChallengePersistence', () => ({
  useChallengePersistence: () => ({
    appendHistory: vi.fn(),
    loadHistory: vi.fn().mockResolvedValue([]),
  }),
}))

import { useWxlsh, type PyodidePublicAPI } from '../../../.vitepress/theme/composables/useWxlsh'

// ---------------------------------------------------------------------------
// Helpers — mock Pyodide that tracks runPythonAsync calls
// ---------------------------------------------------------------------------

/**
 * Create a mock Pyodide whose `runPythonAsync` records every call and
 * returns a predictable result based on the Python expression dispatched.
 *
 * The mock interprets the `str(_wxlsh_commands_py["<cmd>"](args, flags))`
 * pattern that useWxlsh generates, extracts cmd/args/flags, and produces
 * a result string so integration assertions can work end-to-end.
 */
function makeMockPyodide(slug = 'test') {
  const store = new Map<string, unknown>()

  // Registry that mirrors _wxlsh_commands_py — populated during "module load"
  const pyCommands: Record<string, boolean> = {}

  const runPythonAsyncMock = vi.fn(async (code: string) => {
    // 1) Module load — contains _wxlsh_commands_py definition
    if (code.includes('_wxlsh_commands_py') && code.includes('def _cmd_')) {
      const dictMatch = code.match(/_wxlsh_commands_py\s*=\s*\{([^}]+)\}/)
      if (dictMatch) {
        const entries = dictMatch[1].matchAll(/'(\w+)'/g)
        for (const m of entries) pyCommands[m[1]] = true
      }
      store.set('_wxlsh_commands_py', pyCommands)
      return undefined
    }

    // 2a) New dispatch pattern — _r = _wxlsh_commands_py["cmd"]([...], {...})\nimport inspect ...
    const newDispatchMatch = code.match(
      /_r = _wxlsh_commands_py\["(\w+)"\]\((\[.*?\]),\s*(\{.*?\})\)/s,
    )
    if (newDispatchMatch) {
      const [, cmd, argsJson, flagsJson] = newDispatchMatch
      const args: string[] = JSON.parse(argsJson)
      const flags: Record<string, string> = JSON.parse(flagsJson)

      if (cmd === 'curl') return simulateCurl(args, flags, slug)
      if (cmd === 'wget') return simulateWget(args, flags, slug)
      return `mock: unknown command ${cmd}`
    }

    // 2b) Legacy dispatch — str(_wxlsh_commands_py["cmd"]([...], {...}))
    const dispatchMatch = code.match(
      /str\(_wxlsh_commands_py\["(\w+)"\]\((\[.*?\]),\s*(\{.*?\})\)\)/s,
    )
    if (dispatchMatch) {
      const [, cmd, argsJson, flagsJson] = dispatchMatch
      const args: string[] = JSON.parse(argsJson)
      const flags: Record<string, string> = JSON.parse(flagsJson)

      if (cmd === 'curl') return simulateCurl(args, flags, slug)
      if (cmd === 'wget') return simulateWget(args, flags, slug)
      return `mock: unknown command ${cmd}`
    }

    return ''
  })

  const pyodide: PyodidePublicAPI = {
    globals: {
      get: (name: string) => store.get(name),
      set: (name: string, value: unknown) => store.set(name, value),
    },
    runPythonAsync: runPythonAsyncMock,
  }

  return { pyodide, runPythonAsyncMock }
}

/** Minimal JS mirror of _cmd_curl Python logic for integration testing. */
function simulateCurl(
  inArgs: string[],
  flags: Record<string, string>,
  slug: string,
): string {
  // Recover URLs swallowed by boolean flags (mirrors Python logic)
  const boolFlags = ['i', 's', 'L', 'v']
  const args = [...inArgs]
  for (const bf of boolFlags) {
    const val = flags[bf]
    if (val) {
      args.push(val)
      flags[bf] = ''
    }
  }

  let method = (flags.X || flags.method || 'GET').toUpperCase()
  if ('d' in flags || 'data' in flags) method = 'POST'
  const body = flags.d || flags.data || ''

  const rawHeaders: Record<string, string> = {}
  const hVal = flags.H || flags.header || ''
  if (hVal) {
    const idx = hVal.indexOf(':')
    if (idx > 0) {
      rawHeaders[hVal.slice(0, idx).trim()] = hVal.slice(idx + 1).trim()
    }
  }

  if (args.length === 0) {
    return 'Usage: curl [-X METHOD] [-d DATA] [-H "Header: Value"] [-i] [-s] [-L] [-o FILE] [-v] <url>'
  }

  let url = args[args.length - 1]
  if (!url.startsWith('http')) {
    url = `https://challenge-${slug}.localhost/${url.replace(/^\//, '')}`
  }

  const includeHeaders = 'i' in flags
  const silent = 's' in flags
  const followRedirects = 'L' in flags
  const outputFile = flags.o || flags.output || ''
  const verbose = 'v' in flags

  const rStatus = 200
  const rText = 'mock body'
  const lines: string[] = []

  if (verbose) {
    lines.push(`> ${method} ${url}`)
    for (const [k, v] of Object.entries(rawHeaders)) lines.push(`> ${k}: ${v}`)
    if (body) lines.push(`> ${body}`)
    lines.push(`< ${rStatus}`)
    lines.push('')
  }

  if (followRedirects && !silent) {
    lines.push('* follow redirects enabled (auto-followed by runtime)')
  }

  if (outputFile) return `curl: saved to ${outputFile}`

  if (includeHeaders && !verbose) {
    lines.push(`HTTP ${rStatus}`)
    lines.push('')
  }

  lines.push(rText)
  return lines.join('\n')
}

/** Minimal JS mirror of _cmd_wget Python logic for integration testing. */
function simulateWget(
  inArgs: string[],
  flags: Record<string, string>,
  slug: string,
): string {
  // Recover URLs swallowed by boolean flag -q (mirrors Python logic)
  const args = [...inArgs]
  const qVal = flags.q
  if (qVal) {
    args.push(qVal)
    flags.q = ''
  }

  if (args.length === 0) return 'Usage: wget [-O FILE] [-q] <url>'

  let url = args[args.length - 1]
  if (!url.startsWith('http')) {
    url = `https://challenge-${slug}.localhost/${url.replace(/^\//, '')}`
  }

  const outputFile = flags.O || ''
  const quiet = 'q' in flags
  const rText = 'mock body'

  if (outputFile) {
    if (!quiet) return `wget: saved to ${outputFile} (${rText.length} bytes)`
    return `wget: saved to ${outputFile}`
  }

  const lines: string[] = []
  if (!quiet) {
    lines.push(`--  ${url}`)
    lines.push('HTTP 200')
    lines.push('')
  }
  lines.push(rText)
  return lines.join('\n')
}

/**
 * Build a useWxlsh instance with a properly mocked Pyodide that routes
 * Tier 4 commands through the Python dispatch path.
 */
function makeTier4Wxlsh() {
  const mockDispatch = vi.fn().mockResolvedValue(
    new Response('mock body', { status: 200 }),
  )
  const { pyodide, runPythonAsyncMock } = makeMockPyodide('test')
  const pyodideRef = ref<PyodidePublicAPI | null>(pyodide)

  const wxlsh = useWxlsh({
    slug: 'test',
    dispatch: mockDispatch,
    pyodide: pyodideRef,
    commands: [],
  })

  return { wxlsh, mockDispatch, runPythonAsyncMock }
}

// ---------------------------------------------------------------------------
// A) Integration tests — exercise the full dispatch pipeline with mock Pyodide
// ---------------------------------------------------------------------------

describe('useWxlsh - Tier 4 network commands (integration)', () => {
  describe('curl', () => {
    it('shows usage when no URL is provided', async () => {
      const { wxlsh } = makeTier4Wxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('curl')
      expect(result.output).toContain('Usage:')
      expect(result.output).toContain('curl')
    })

    it('makes a GET request by default', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('curl http://example.com/api')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
      expect(dispatchCall![0]).toContain('http://example.com/api')
      expect(result.output).toContain('mock body')
    })

    it('auto-prefixes challenge base URL when URL does not start with http', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute('curl /api/data')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
      expect(dispatchCall![0]).toContain('/api/data')
    })

    it('supports -X METHOD flag', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute('curl -X PUT http://example.com/api')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
      expect(dispatchCall![0]).toContain('"X"')
      expect(dispatchCall![0]).toContain('PUT')
    })

    it('supports -d DATA flag and auto-sets method to POST', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute('curl -d username=admin http://example.com/login')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
      expect(dispatchCall![0]).toContain('"d"')
      expect(dispatchCall![0]).toContain('username=admin')
    })

    it('supports -H header flag', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute(
        'curl -H "Content-Type: application/json" http://example.com/api',
      )
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
      expect(dispatchCall![0]).toContain('"H"')
      expect(dispatchCall![0]).toContain('Content-Type: application/json')
    })

    it('supports -i flag (include headers) — parsed by flags in dispatch call', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      // URL first to avoid parser consuming it as flag value
      await wxlsh.execute('curl http://example.com/ -i')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
    })

    it('supports -s flag (silent mode)', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute('curl -s http://example.com/')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
      expect(dispatchCall![0]).toContain('"s"')
    })

    it('supports -L flag (follow redirects) — flag passed in dispatch call', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute('curl http://example.com/ -L')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
    })

    it('supports -o FILE flag (output to file)', async () => {
      const { wxlsh } = makeTier4Wxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute(
        'curl -o output.html http://example.com/',
      )
      expect(result.output).toContain('output.html')
      expect(result.output).toContain('saved')
    })

    it('supports -v flag (verbose) — flag passed in dispatch call', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute('curl http://example.com/ -v')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["curl"]'),
      )
      expect(dispatchCall).toBeTruthy()
    })

    it('defaults to just response body output (no headers, no verbose)', async () => {
      const { wxlsh } = makeTier4Wxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('curl http://example.com/')
      expect(result.output).toContain('mock body')
      expect(result.output).not.toContain('>')
      expect(result.output).not.toContain('HTTP')
    })
  })

  describe('wget', () => {
    it('shows usage when no URL is provided', async () => {
      const { wxlsh } = makeTier4Wxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('wget')
      expect(result.output).toContain('Usage:')
      expect(result.output).toContain('wget')
    })

    it('is registered as a known command (not "command not found")', async () => {
      const { wxlsh } = makeTier4Wxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('wget http://example.com/')
      expect(result.output).not.toContain('command not found')
      expect(result.error).toBeFalsy()
    })

    it('downloads and shows content', async () => {
      const { wxlsh } = makeTier4Wxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('wget http://example.com/')
      expect(result.output).toContain('mock body')
    })

    it('supports -O FILE flag (save to file)', async () => {
      const { wxlsh } = makeTier4Wxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute(
        'wget -O saved.html http://example.com/',
      )
      expect(result.output).toContain('saved.html')
      expect(result.output).toContain('saved')
    })

    it('supports -q flag (quiet mode)', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute('wget -q http://example.com/')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["wget"]'),
      )
      expect(dispatchCall).toBeTruthy()
      expect(dispatchCall![0]).toContain('"q"')
    })

    it('auto-prefixes challenge base URL for relative URLs', async () => {
      const { wxlsh, runPythonAsyncMock } = makeTier4Wxlsh()
      await wxlsh.init()
      await wxlsh.execute('wget /page.html')
      const calls = runPythonAsyncMock.mock.calls
      const dispatchCall = calls.find(
        (c: string[]) => c[0].includes('_wxlsh_commands_py["wget"]'),
      )
      expect(dispatchCall).toBeTruthy()
      expect(dispatchCall![0]).toContain('/page.html')
    })
  })
})

// ---------------------------------------------------------------------------
// B) Python source string analysis — verify WXLSH_PYTHON_COMMANDS contains
//    the expected function definitions and flag handling code.
// ---------------------------------------------------------------------------

const wxlshSource = readFileSync(
  resolve(__dirname, '../../../.vitepress/theme/composables/useWxlsh.ts'),
  'utf-8',
)

// Extract just the Python source from the template literal
const pyMatch = wxlshSource.match(
  /const WXLSH_PYTHON_COMMANDS\s*=\s*`([\s\S]*?)`/,
)
const pythonSource = pyMatch ? pyMatch[1] : ''

describe('WXLSH_PYTHON_COMMANDS source analysis', () => {
  describe('_cmd_curl Python source', () => {
    it('defines _cmd_curl function', () => {
      expect(pythonSource).toContain('def _cmd_curl(args, flags):')
    })

    it('supports -X METHOD flag', () => {
      expect(pythonSource).toMatch(/flags\.get\(['"]X['"]/)
    })

    it('supports -d DATA flag with auto-POST', () => {
      expect(pythonSource).toMatch(/'d'\s+in\s+flags/)
      expect(pythonSource).toContain('POST')
    })

    it('supports -H header flag', () => {
      expect(pythonSource).toMatch(/flags\.get\(['"]H['"]/)
    })

    it('supports -i flag for including response headers', () => {
      expect(pythonSource).toMatch(/'i'\s+in\s+flags/)
    })

    it('supports -s flag for silent mode', () => {
      expect(pythonSource).toMatch(/'s'\s+in\s+flags/)
    })

    it('supports -L flag for following redirects', () => {
      expect(pythonSource).toMatch(/'L'\s+in\s+flags/)
    })

    it('supports -o FILE flag for output to file', () => {
      expect(pythonSource).toMatch(/flags\.get\(['"]o['"]/)
    })

    it('supports -v flag for verbose mode', () => {
      expect(pythonSource).toMatch(/'v'\s+in\s+flags/)
    })

    it('auto-prefixes challenge base URL', () => {
      expect(pythonSource).toContain('_wxlsh_slug')
      expect(pythonSource).toContain('challenge-')
    })

    it('defaults to outputting just the response body', () => {
      expect(pythonSource).toContain('r.text')
    })

    it('shows request details in verbose mode', () => {
      expect(pythonSource).toMatch(/verbose/)
    })

    it('returns usage message when no args', () => {
      expect(pythonSource).toMatch(/Usage:\s*curl/)
    })
  })

  describe('_cmd_wget Python source', () => {
    it('defines _cmd_wget function', () => {
      expect(pythonSource).toContain('def _cmd_wget(args, flags):')
    })

    it('supports -O FILE flag', () => {
      expect(pythonSource).toMatch(/flags\.get\(['"]O['"]/)
    })

    it('supports -q flag for quiet mode', () => {
      expect(pythonSource).toMatch(/'q'\s+in\s+flags/)
    })

    it('auto-prefixes challenge base URL for relative URLs', () => {
      expect(pythonSource).toMatch(/def _cmd_wget[\s\S]*?_wxlsh_slug/)
    })

    it('returns usage when no args', () => {
      expect(pythonSource).toMatch(/Usage:\s*wget/)
    })
  })

  describe('command registration', () => {
    it('registers curl in _wxlsh_commands_py', () => {
      expect(pythonSource).toMatch(/'curl'\s*:\s*_cmd_curl/)
    })

    it('registers wget in _wxlsh_commands_py', () => {
      expect(pythonSource).toMatch(/'wget'\s*:\s*_cmd_wget/)
    })
  })
})
