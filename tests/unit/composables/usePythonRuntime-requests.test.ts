import { describe, it, expect, vi } from 'vitest'
import { PythonRuntime } from '../../../.vitepress/theme/composables/usePythonRuntime'

const APP_CODE = 'app = lambda scope, receive, send: None'

function makeMockPyodide() {
  const runPythonAsync = vi.fn().mockResolvedValue(undefined)
  const pyodide = {
    runPythonAsync,
    loadPackage: vi.fn().mockResolvedValue(undefined),
    FS: { writeFile: vi.fn() },
    globals: { get: vi.fn().mockReturnValue(vi.fn()), set: vi.fn() },
  }
  const loadPyodide = vi.fn().mockResolvedValue(pyodide)
  return { loadPyodide, pyodide, runPythonAsync }
}

describe('PythonRuntime - requests monkey-patch', () => {
  it('installs requests via micropip during initialization', async () => {
    const { loadPyodide, runPythonAsync } = makeMockPyodide()
    const runtime = new PythonRuntime(loadPyodide)

    await runtime.initialize(APP_CODE, {}, ['flask'])

    const calls = runPythonAsync.mock.calls.map((c: string[]) => c[0] as string)
    const requestsInstall = calls.find(c => c.includes('requests'))
    expect(requestsInstall).toBeDefined()
  })

  it('monkey-patches HTTPAdapter.send after installing requests', async () => {
    const { loadPyodide, runPythonAsync } = makeMockPyodide()
    const runtime = new PythonRuntime(loadPyodide)

    await runtime.initialize(APP_CODE, {}, ['flask'])

    const calls = runPythonAsync.mock.calls.map((c: string[]) => c[0] as string)
    const patchCall = calls.find(c => c.includes('HTTPAdapter') && c.includes('send'))
    expect(patchCall).toBeDefined()
  })

  it('requests install and patch happen after app code execution', async () => {
    const { loadPyodide, runPythonAsync } = makeMockPyodide()
    const runtime = new PythonRuntime(loadPyodide)

    await runtime.initialize(APP_CODE, {}, ['flask'])

    const calls = runPythonAsync.mock.calls.map((c: string[]) => c[0] as string)
    const appCodeIdx = calls.findIndex(c => c === APP_CODE)
    const patchIdx = calls.findIndex(c => c.includes('HTTPAdapter'))
    expect(patchIdx).toBeGreaterThan(appCodeIdx)
  })
})
