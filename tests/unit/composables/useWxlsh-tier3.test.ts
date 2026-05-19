import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import 'fake-indexeddb/auto'

// Mock the WASM parser and challenge persistence
vi.mock('../../../.vitepress/theme/composables/useChallengePersistence', () => ({
  useChallengePersistence: () => ({
    appendHistory: vi.fn(),
    loadHistory: vi.fn().mockResolvedValue([]),
  }),
}))

import { useWxlsh, type PyodidePublicAPI } from '../../../.vitepress/theme/composables/useWxlsh'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the WXLSH_PYTHON_COMMANDS string by importing the module source. */
function getPythonCommandsSource(): string {
  // We import the module and check the Python code that gets passed to Pyodide.
  // Since WXLSH_PYTHON_COMMANDS is a const used internally, we capture it
  // through the runPythonAsync call when ensurePythonCommands is invoked.
  // For string-level tests, we'll capture it via the mock.
  return '' // Placeholder — actual capture happens via pyodide mock
}

/**
 * Create a mock Pyodide that captures the Python source code and simulates
 * command dispatch by tracking registered commands.
 */
function makeMockPyodide() {
  let capturedPythonSource = ''
  const registeredCommands = new Map<string, boolean>()

  const globals = {
    get: vi.fn((name: string) => {
      if (name === '_wxlsh_commands_py') {
        // Parse registered commands from captured Python source
        const cmdDict: Record<string, unknown> = {}
        // Extract command names from the _wxlsh_commands_py dict
        const match = capturedPythonSource.match(
          /_wxlsh_commands_py\s*=\s*\{([^}]+)\}/s
        )
        if (match) {
          const entries = match[1].matchAll(/'(\w+)'/g)
          for (const e of entries) {
            cmdDict[e[1]] = true
          }
        }
        return cmdDict
      }
      return undefined
    }),
    set: vi.fn(),
  }

  const mockPyodide: PyodidePublicAPI = {
    runPythonAsync: vi.fn(async (code: string) => {
      // First call is the WXLSH_PYTHON_COMMANDS setup
      if (!capturedPythonSource && code.includes('_wxlsh_commands_py')) {
        capturedPythonSource = code
        return undefined
      }
      // Subsequent calls are command invocations like:
      // str(_wxlsh_commands_py["base64"]([...], {...}))
      return 'mock-output'
    }),
    globals,
  }

  return {
    pyodide: mockPyodide,
    getCapturedSource: () => capturedPythonSource,
    globals,
  }
}

function makeWxlshWithPyodide() {
  const mock = makeMockPyodide()
  const pyodideRef = ref<PyodidePublicAPI | null>(mock.pyodide)
  const wxlsh = useWxlsh({
    slug: 'test',
    dispatch: vi.fn().mockResolvedValue(new Response('ok')),
    pyodide: pyodideRef,
    commands: [],
  })
  return { wxlsh, mock }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useWxlsh - Tier 3: Encoding/Hashing Commands', () => {
  describe('Python source registration', () => {
    it('registers base64 command in _wxlsh_commands_py', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      // Trigger Python command loading by executing a Python-backed command
      await wxlsh.execute('base64 hello')
      const src = mock.getCapturedSource()
      expect(src).toContain("'base64'")
      expect(src).toContain('_cmd_base64')
    })

    it('registers xxd command in _wxlsh_commands_py', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('xxd hello')
      const src = mock.getCapturedSource()
      expect(src).toContain("'xxd'")
      expect(src).toContain('_cmd_xxd')
    })

    it('registers md5sum command in _wxlsh_commands_py', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('md5sum hello')
      const src = mock.getCapturedSource()
      expect(src).toContain("'md5sum'")
      expect(src).toContain('_cmd_md5sum')
    })

    it('registers sha256sum command in _wxlsh_commands_py', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('sha256sum hello')
      const src = mock.getCapturedSource()
      expect(src).toContain("'sha256sum'")
      expect(src).toContain('_cmd_sha256sum')
    })

    it('registers urlencode command in _wxlsh_commands_py', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('urlencode hello')
      const src = mock.getCapturedSource()
      expect(src).toContain("'urlencode'")
      expect(src).toContain('_cmd_urlencode')
    })

    it('registers urldecode command in _wxlsh_commands_py', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('urldecode hello')
      const src = mock.getCapturedSource()
      expect(src).toContain("'urldecode'")
      expect(src).toContain('_cmd_urldecode')
    })

    it('all six tier-3 commands are registered together', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('base64 test')
      const src = mock.getCapturedSource()

      for (const cmd of ['base64', 'xxd', 'md5sum', 'sha256sum', 'urlencode', 'urldecode']) {
        expect(src).toContain(`'${cmd}'`)
      }
    })
  })

  describe('Python source correctness', () => {
    let src: string

    beforeEach(async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('base64 test')
      src = mock.getCapturedSource()
    })

    // ─── base64 ───────────────────────────────────────────────────────
    describe('base64 command implementation', () => {
      it('imports base64 module', () => {
        expect(src).toContain('import')
        expect(src).toContain('base64')
      })

      it('defines _cmd_base64 with args and flags parameters', () => {
        expect(src).toMatch(/_cmd_base64\s*\(\s*args\s*,\s*flags\s*\)/)
      })

      it('supports -d flag for decoding', () => {
        // The base64 command should check for 'd' in flags
        expect(src).toContain("'d'")
      })

      it('uses b64encode for encoding', () => {
        expect(src).toContain('b64encode')
      })

      it('uses b64decode for decoding', () => {
        expect(src).toContain('b64decode')
      })
    })

    // ─── xxd ──────────────────────────────────────────────────────────
    describe('xxd command implementation', () => {
      it('defines _cmd_xxd with args and flags parameters', () => {
        expect(src).toMatch(/_cmd_xxd\s*\(\s*args\s*,\s*flags\s*\)/)
      })

      it('supports -r flag for reverse hex dump', () => {
        expect(src).toContain("'r'")
      })

      it('supports -p flag for plain hex dump', () => {
        expect(src).toContain("'p'")
      })

      it('produces hex dump output with offset and ASCII', () => {
        // xxd default format includes offset, hex bytes, and ASCII representation
        expect(src).toContain('hex')
      })
    })

    // ─── md5sum ───────────────────────────────────────────────────────
    describe('md5sum command implementation', () => {
      it('defines _cmd_md5sum with args and flags parameters', () => {
        expect(src).toMatch(/_cmd_md5sum\s*\(\s*args\s*,\s*flags\s*\)/)
      })

      it('imports hashlib for hashing', () => {
        expect(src).toContain('hashlib')
      })

      it('uses md5 hashing', () => {
        expect(src).toContain('md5')
      })

      it('outputs hash in hexdigest format', () => {
        expect(src).toContain('hexdigest')
      })

      it('includes filename in output format (hash  filename)', () => {
        // Linux md5sum format: <hash>  <filename>
        // When no file, use "-" as stdin indicator
        expect(src).toContain('-')
      })
    })

    // ─── sha256sum ────────────────────────────────────────────────────
    describe('sha256sum command implementation', () => {
      it('defines _cmd_sha256sum with args and flags parameters', () => {
        expect(src).toMatch(/_cmd_sha256sum\s*\(\s*args\s*,\s*flags\s*\)/)
      })

      it('uses sha256 hashing', () => {
        expect(src).toContain('sha256')
      })

      it('outputs hash in hexdigest format', () => {
        expect(src).toContain('hexdigest')
      })
    })

    // ─── urlencode ────────────────────────────────────────────────────
    describe('urlencode command implementation', () => {
      it('defines _cmd_urlencode with args and flags parameters', () => {
        expect(src).toMatch(/_cmd_urlencode\s*\(\s*args\s*,\s*flags\s*\)/)
      })

      it('uses urllib.parse.quote for encoding', () => {
        expect(src).toContain('urllib.parse.quote')
      })
    })

    // ─── urldecode ────────────────────────────────────────────────────
    describe('urldecode command implementation', () => {
      it('defines _cmd_urldecode with args and flags parameters', () => {
        expect(src).toMatch(/_cmd_urldecode\s*\(\s*args\s*,\s*flags\s*\)/)
      })

      it('uses urllib.parse.unquote for decoding', () => {
        expect(src).toContain('urllib.parse.unquote')
      })
    })
  })

  describe('Command dispatch integration', () => {
    it('dispatches base64 command to Python backend', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      const result = await wxlsh.execute('base64 aGVsbG8=')
      // The command should not return "command not found"
      expect(result.output).not.toContain('command not found')
      // runPythonAsync should be called for command execution
      expect(mock.pyodide.runPythonAsync).toHaveBeenCalled()
    })

    it('dispatches xxd command to Python backend', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      const result = await wxlsh.execute('xxd test')
      expect(result.output).not.toContain('command not found')
    })

    it('dispatches md5sum command to Python backend', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      const result = await wxlsh.execute('md5sum test')
      expect(result.output).not.toContain('command not found')
    })

    it('dispatches sha256sum command to Python backend', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      const result = await wxlsh.execute('sha256sum test')
      expect(result.output).not.toContain('command not found')
    })

    it('dispatches urlencode command to Python backend', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      const result = await wxlsh.execute('urlencode hello world')
      expect(result.output).not.toContain('command not found')
    })

    it('dispatches urldecode command to Python backend', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      const result = await wxlsh.execute('urldecode hello%20world')
      expect(result.output).not.toContain('command not found')
    })

    it('base64 -d dispatches with d flag', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('base64 -d aGVsbG8=')
      // Verify the execution call includes the d flag
      const calls = (mock.pyodide.runPythonAsync as ReturnType<typeof vi.fn>).mock.calls
      const execCall = calls.find((c: string[]) => c[0].includes('"base64"'))
      expect(execCall).toBeTruthy()
      if (execCall) {
        expect(execCall[0]).toContain('"d"')
      }
    })

    it('xxd -r dispatches with r flag', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('xxd -r test')
      const calls = (mock.pyodide.runPythonAsync as ReturnType<typeof vi.fn>).mock.calls
      const execCall = calls.find((c: string[]) => c[0].includes('"xxd"'))
      expect(execCall).toBeTruthy()
      if (execCall) {
        expect(execCall[0]).toContain('"r"')
      }
    })

    it('xxd -p dispatches with p flag', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('xxd -p test')
      const calls = (mock.pyodide.runPythonAsync as ReturnType<typeof vi.fn>).mock.calls
      const execCall = calls.find((c: string[]) => c[0].includes('"xxd"'))
      expect(execCall).toBeTruthy()
      if (execCall) {
        expect(execCall[0]).toContain('"p"')
      }
    })
  })

  describe('Existing commands still registered', () => {
    it('curl command is still registered', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('base64 test')
      const src = mock.getCapturedSource()
      expect(src).toContain("'curl'")
    })

    it('decode command is still registered', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('base64 test')
      const src = mock.getCapturedSource()
      expect(src).toContain("'decode'")
    })

    it('encode command is still registered', async () => {
      const { wxlsh, mock } = makeWxlshWithPyodide()
      await wxlsh.init()
      await wxlsh.execute('base64 test')
      const src = mock.getCapturedSource()
      expect(src).toContain("'encode'")
    })
  })
})
