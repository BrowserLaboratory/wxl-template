import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// ─── Mock xterm.js ────────────────────────────────────────────────────────────

let mockOnDataCb: ((data: string) => void) = () => {}

// Store the latest terminal instance so tests can inspect it
let mockTerminalInstance: {
  loadAddon: ReturnType<typeof vi.fn>
  open: ReturnType<typeof vi.fn>
  write: ReturnType<typeof vi.fn>
  clear: ReturnType<typeof vi.fn>
  focus: ReturnType<typeof vi.fn>
  dispose: ReturnType<typeof vi.fn>
  onData: ReturnType<typeof vi.fn>
}

vi.mock('@xterm/xterm', () => {
  class MockTerminal {
    loadAddon = vi.fn()
    open = vi.fn()
    write = vi.fn()
    clear = vi.fn()
    focus = vi.fn()
    dispose = vi.fn()
    onData = vi.fn(function(cb: (data: string) => void) { mockOnDataCb = cb })
    constructor() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      mockTerminalInstance = this as unknown as typeof mockTerminalInstance
    }
  }
  return { Terminal: MockTerminal }
})

vi.mock('@xterm/addon-fit', () => {
  class MockFitAddon {
    fit = vi.fn()
  }
  return { FitAddon: MockFitAddon }
})

vi.mock('@xterm/xterm/css/xterm.css', () => ({}))

// ─── Mock useWxlsh ────────────────────────────────────────────────────────────

const mockExecute = vi.fn(async (_input: string) => ({ output: 'ok', clear: false }))
const mockHistoryPrev = vi.fn((_: string) => 'prev-cmd')
const mockHistoryNext = vi.fn(() => 'next-cmd')

vi.mock('../../../.vitepress/theme/composables/useWxlsh', () => ({
  useWxlsh: vi.fn(() => ({
    init: vi.fn(async () => {}),
    execute: mockExecute,
    historyPrev: mockHistoryPrev,
    historyNext: mockHistoryNext,
    historyBuffer: ref([]),
    getPrompt: () => ({ text: 'hacker@wxlsh:~$ ', length: 16 }),
    getCwd: () => '~',
  })),
}))

// ─── Mock useChallengePersistence ─────────────────────────────────────────────

vi.mock('../../../.vitepress/theme/composables/useChallengePersistence', () => ({
  useChallengePersistence: vi.fn(() => ({
    appendHistory: vi.fn(async () => {}),
    loadHistory: vi.fn(async () => []),
  })),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockDispatch = vi.fn(async (req: Request) => new Response('ok', { status: 200 }))

async function mountPanel(disabled = false, onCommandExecuted?: (e: { command: string; output: string; error: boolean }) => void) {
  const props: Record<string, unknown> = {
    slug: 'test-challenge',
    dispatch: mockDispatch,
    disabled,
    pyodide: ref(null),
  }
  if (onCommandExecuted) props.onCommandExecuted = onCommandExecuted
  const wrapper = mount(
    (await import('../../../.vitepress/theme/components/WxlshPanel.vue')).default,
    { props, attachTo: document.body },
  )
  await flushPromises()
  return wrapper
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockOnDataCb = () => {}
  // jsdom has no layout engine so clientWidth/Height are 0; stub them so
  // initTerminal's dimension guard doesn't skip initialization in tests.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true, get: () => 800,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true, get: () => 600,
  })
})

afterEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true, get: () => 0,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true, get: () => 0,
  })
})

describe('WxlshPanel', () => {
  it('mounts the xterm container div', async () => {
    const wrapper = await mountPanel()
    expect(wrapper.find('div').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows a loading overlay when disabled=true', async () => {
    const wrapper = await mountPanel(true)
    expect(wrapper.text()).toMatch(/loading/i)
    wrapper.unmount()
  })

  it('does not show loading overlay when enabled', async () => {
    const wrapper = await mountPanel(false)
    expect(wrapper.text()).not.toMatch(/loading runtime/i)
    wrapper.unmount()
  })

  it('writes banner text on init', async () => {
    await mountPanel()
    const writeCalls = mockTerminalInstance.write.mock.calls.map(c => c[0] as string)
    const allOutput = writeCalls.join('')
    expect(allOutput).toContain('wxlsh 1.0')
    expect(allOutput).toContain('help')
  })

  it('calls execute() when Enter is pressed', async () => {
    const wrapper = await mountPanel()
    // Simulate typing and Enter
    mockOnDataCb('c')
    mockOnDataCb('u')
    mockOnDataCb('r')
    mockOnDataCb('l')
    mockOnDataCb('\r')
    await flushPromises()
    expect(mockExecute).toHaveBeenCalledWith('curl')
    wrapper.unmount()
  })

  it('navigates history with Up arrow', async () => {
    const wrapper = await mountPanel()
    mockOnDataCb('\x1b[A')
    await flushPromises()
    expect(mockHistoryPrev).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('navigates history with Down arrow', async () => {
    const wrapper = await mountPanel()
    mockOnDataCb('\x1b[B')
    await flushPromises()
    expect(mockHistoryNext).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('disposes terminal on unmount', async () => {
    const wrapper = await mountPanel()
    wrapper.unmount()
    expect(mockTerminalInstance.dispose).toHaveBeenCalled()
  })

  it('calls onCommandExecuted callback after successful command', async () => {
    mockExecute.mockResolvedValueOnce({ output: 'Available commands: ...', clear: false, error: false })
    const cb = vi.fn()
    const wrapper = await mountPanel(false, cb)
    mockOnDataCb('h')
    mockOnDataCb('e')
    mockOnDataCb('l')
    mockOnDataCb('p')
    mockOnDataCb('\r')
    await flushPromises()
    expect(cb).toHaveBeenCalledWith({ command: 'help', output: 'Available commands: ...', error: false })
    wrapper.unmount()
  })

  it('calls onCommandExecuted with error flag for failed command', async () => {
    mockExecute.mockResolvedValueOnce({ output: 'wxlsh: command not found: xyz', error: true })
    const cb = vi.fn()
    const wrapper = await mountPanel(false, cb)
    mockOnDataCb('x')
    mockOnDataCb('y')
    mockOnDataCb('z')
    mockOnDataCb('\r')
    await flushPromises()
    expect(cb).toHaveBeenCalledWith({ command: 'xyz', output: 'wxlsh: command not found: xyz', error: true })
    wrapper.unmount()
  })

  it('does not call onCommandExecuted on empty input', async () => {
    const cb = vi.fn()
    const wrapper = await mountPanel(false, cb)
    mockOnDataCb('\r')
    await flushPromises()
    expect(cb).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('works without onCommandExecuted prop (optional)', async () => {
    mockExecute.mockResolvedValueOnce({ output: 'ok', clear: false })
    const wrapper = await mountPanel(false) // no callback
    mockOnDataCb('t')
    mockOnDataCb('\r')
    await flushPromises()
    expect(mockExecute).toHaveBeenCalledWith('t')
    wrapper.unmount()
  })

  it('shows error output for unknown command', async () => {
    mockExecute.mockResolvedValueOnce({ output: 'wxlsh: command not found: foobar', error: true })
    const wrapper = await mountPanel()
    mockOnDataCb('f')
    mockOnDataCb('o')
    mockOnDataCb('o')
    mockOnDataCb('b')
    mockOnDataCb('a')
    mockOnDataCb('r')
    mockOnDataCb('\r')
    await flushPromises()
    const writeCalls = mockTerminalInstance.write.mock.calls.map(c => c[0] as string)
    expect(writeCalls.some(c => c.includes('command not found'))).toBe(true)
    wrapper.unmount()
  })
})
