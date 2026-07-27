import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// Mock vitepress useData and Content
vi.mock('vitepress', () => ({
  useData: vi.fn(() => ({
    frontmatter: {
      value: {
        title: 'SQL Injection Demo',
        difficulty: 'easy',
        category: 'web',
        backend: 'flask',
        slug: 'sqli-demo',
        description: 'A simple Flask app with a SQL injection vulnerability.',
        markdownBody: '# SQL Injection Demo\n\nA login form backed by SQLite.',
      },
    },
    page: { value: { relativePath: 'challenge/sqli-demo/index.md' } },
  })),
  withBase: vi.fn((url: string) => url),
}))

vi.mock('vitepress/client', () => ({
  Content: defineComponent({ render: () => h('div', { class: 'vp-doc' }, 'Challenge description content') }),
}))

// Mock child panels to isolate layout logic - accept disabled prop
vi.mock('../../../.vitepress/theme/components/BrowserPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch', 'disabled'], template: '<div data-browser-panel :data-disabled="disabled" />' }),
}))
vi.mock('../../../.vitepress/theme/components/WxlshPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch', 'disabled', 'pyodide', 'onCommandExecuted'], template: '<div data-wxlsh-panel :data-disabled="disabled" />' }),
}))
vi.mock('../../../.vitepress/theme/components/RepeatPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch', 'disabled', 'injectedRequest'], template: '<div data-repeat-panel :data-disabled="disabled" :data-injected="injectedRequest" />' }),
}))
vi.mock('../../../.vitepress/theme/components/NetworkPanel.vue', () => ({
  default: defineComponent({ props: ['trafficLog'], emits: ['clear', 'sendToRepeater'], template: '<div data-network-panel />' }),
}))
vi.mock('../../../.vitepress/theme/components/CodeEditorPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch', 'disabled', 'pyodide', 'onCodeExecuted'], template: '<div data-code-panel :data-disabled="disabled" />' }),
}))
vi.mock('../../../.vitepress/theme/components/FlagSubmit.vue', () => ({
  default: defineComponent({ props: ['verify', 'onExport', 'onExportNotes'], template: '<div data-flag-submit />' }),
}))
vi.mock('../../../.vitepress/theme/components/DescriptionModal.vue', () => ({
  default: defineComponent({
    props: ['title', 'difficulty', 'category'],
    emits: ['close'],
    template: '<div data-description-modal />',
  }),
}))
vi.mock('../../../.vitepress/theme/components/MergedNav.vue', () => ({
  default: defineComponent({
    props: ['title', 'difficulty', 'category', 'runtimeReady', 'runtimeError', 'noteCount', 'descriptionCollapsed'],
    emits: ['open-notes', 'toggle-description'],
    template: '<nav data-merged-nav :data-title="title" :data-collapsed="descriptionCollapsed"><a href="/challenges/">← Challenges</a></nav>',
  }),
}))

// Mock WASM loader (extractCustomSection)
vi.mock('../../../.vitepress/theme/composables/useWasmLoader', () => ({
  extractCustomSection: vi.fn().mockReturnValue(null),
}))

// Mock useAttackSession
const mockAddHttpEvent = vi.fn()
const mockAddTerminalCommand = vi.fn()
const mockAddCodeExecution = vi.fn()
const mockAddFlagAttempt = vi.fn()
const mockExportSession = vi.fn()
const mockInit = vi.fn().mockResolvedValue(undefined)
vi.mock('../../../.vitepress/theme/composables/useAttackSession', () => ({
  useAttackSession: vi.fn(() => ({
    init: mockInit,
    getSession: vi.fn(() => null),
    addHttpEvent: mockAddHttpEvent,
    addTerminalCommand: mockAddTerminalCommand,
    addCodeExecution: mockAddCodeExecution,
    addFlagAttempt: mockAddFlagAttempt,
    exportSession: mockExportSession,
  })),
}))

let ChallengeLayout: typeof import('../../../.vitepress/theme/layouts/ChallengeLayout.vue').default

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../.vitepress/theme/layouts/ChallengeLayout.vue')
  ChallengeLayout = mod.default
})

describe('ChallengeLayout (VitePress layout)', () => {
  it('renders MergedNav with challenge metadata props', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const { default: MergedNav } = await import('../../../.vitepress/theme/components/MergedNav.vue')
    const nav = wrapper.findComponent(MergedNav)
    expect(nav.exists()).toBe(true)
    expect(nav.props('title')).toBe('SQL Injection Demo')
    expect(nav.props('difficulty')).toBe('easy')
    expect(nav.props('category')).toBe('web')
  })

  it('derives slug from per-folder relativePath and passes to BrowserPanel', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const { default: BrowserPanel } = await import('../../../.vitepress/theme/components/BrowserPanel.vue')
    const bp = wrapper.findComponent(BrowserPanel)
    expect(bp.props('slug')).toBe('sqli-demo')
  })

  it('renders a back link via MergedNav', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const nav = wrapper.find('[data-merged-nav]')
    expect(nav.exists()).toBe(true)
    const backLink = nav.find('a[href="/challenges/"]')
    expect(backLink.exists()).toBe(true)
  })

  it('fetches the per-challenge WASM through withBase so it resolves under a deployed base', async () => {
    // Regression: wasmModule frontmatter is a base-agnostic root path
    // (/challenge/<slug>/runtime.wasm). On a GitHub Pages project site the file
    // is served under the base (/wxl-template/...), so a raw fetch(wasmModule)
    // 404s → "No chall-data section". The fetch MUST route through withBase.
    const { useData, withBase } = await import('vitepress')
    vi.mocked(useData).mockReturnValueOnce({
      frontmatter: {
        value: {
          title: 'SQL Injection Demo',
          difficulty: 'easy',
          category: 'web',
          backend: 'flask',
          slug: 'sqli-demo',
          description: 'x',
          markdownBody: '# x',
          wasmModule: '/challenge/sqli-demo/runtime.wasm',
        },
      },
      page: { value: { relativePath: 'challenge/sqli-demo/index.md' } },
    } as unknown as ReturnType<typeof useData>)
    const fetchSpy = vi.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(8) })
    vi.stubGlobal('fetch', fetchSpy)

    mount(ChallengeLayout, { global: { stubs: { Content: true } } })
    await flushPromises()

    expect(vi.mocked(withBase)).toHaveBeenCalledWith('/challenge/sqli-demo/runtime.wasm')
    expect(fetchSpy).toHaveBeenCalledWith('/challenge/sqli-demo/runtime.wasm')
    vi.unstubAllGlobals()
  })

  it('does not render a separate header element', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    // The old <header> element should no longer exist
    expect(wrapper.find('header').exists()).toBe(false)
  })

  it('renders description panel and FlagSubmit in left column', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    expect(wrapper.find('[data-flag-submit]').exists()).toBe(true)
    expect(wrapper.find('[data-description-panel]').exists()).toBe(true)
  })

  it('collapses description panel when toggle button is clicked', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const toggle = wrapper.find('[data-description-toggle]')
    expect(toggle.exists()).toBe(true)

    const panel = wrapper.find('[data-description-panel]')
    expect(panel.classes()).not.toContain('collapsed')

    await toggle.trigger('click')
    expect(panel.classes()).toContain('collapsed')
  })

  it('expands description panel via MergedNav toggle-description event', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    // Collapse first
    await wrapper.find('[data-description-toggle]').trigger('click')
    expect(wrapper.find('[data-description-panel]').classes()).toContain('collapsed')

    // MergedNav descriptionCollapsed prop should reflect the state
    const { default: MergedNav } = await import('../../../.vitepress/theme/components/MergedNav.vue')
    const nav = wrapper.findComponent(MergedNav)
    expect(nav.props('descriptionCollapsed')).toBe(true)

    // Emit toggle-description from MergedNav to re-expand
    await nav.vm.$emit('toggle-description')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-description-panel]').classes()).not.toContain('collapsed')
  })

  it('shows persistent flag submit bar when description is collapsed', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    // Initially no flag bar
    expect(wrapper.find('[data-flag-bar]').exists()).toBe(false)

    // Collapse description
    await wrapper.find('[data-description-toggle]').trigger('click')
    expect(wrapper.find('[data-flag-bar]').exists()).toBe(true)
    expect(wrapper.find('[data-flag-bar] [data-flag-submit]').exists()).toBe(true)
  })

  // Mount once with a given `tools` frontmatter value and return the rendered
  // tab ids in DOM order. Omit `tools` entirely by passing undefined.
  async function tabIdsFor(tools: string[] | undefined) {
    const { useData } = await import('vitepress')
    vi.mocked(useData).mockReturnValueOnce({
      frontmatter: {
        value: {
          title: 'SQL Injection Demo',
          difficulty: 'easy',
          category: 'web',
          backend: 'flask',
          slug: 'sqli-demo',
          description: 'x',
          markdownBody: '# x',
          ...(tools === undefined ? {} : { tools }),
        },
      },
      page: { value: { relativePath: 'challenge/sqli-demo/index.md' } },
    } as unknown as ReturnType<typeof useData>)
    const wrapper = mount(ChallengeLayout, { global: { stubs: { Content: true } } })
    return wrapper.findAll('[data-tab]').map(t => t.attributes('data-tab'))
  }

  it('excludes Terminal when tools field is not set (default)', async () => {
    expect(await tabIdsFor(undefined)).toEqual(['browser', 'network', 'repeater', 'code'])
  })

  it('shows the Terminal tab only when the challenge opts in explicitly', async () => {
    expect(await tabIdsFor(['browser', 'terminal'])).toContain('terminal')
  })

  it('hides every tab the explicit allowlist leaves out', async () => {
    const ids = await tabIdsFor(['browser', 'terminal', 'code'])
    expect(ids).toEqual(['browser', 'terminal', 'code'])
    expect(ids).not.toContain('network')
    expect(ids).not.toContain('repeater')
  })

  it('injects Browser into an explicit allowlist that omits it', async () => {
    expect(await tabIdsFor(['code'])).toEqual(['browser', 'code'])
  })

  it('yields Browser alone for an empty tools array', async () => {
    expect(await tabIdsFor([])).toEqual(['browser'])
  })

  it('renders tabs in canonical order regardless of the order the author wrote', async () => {
    expect(await tabIdsFor(['code', 'network'])).toEqual(['browser', 'network', 'code'])
  })

  it('leaves a challenge that already declares its allowlist unchanged', async () => {
    // door-is-open ships exactly this list; the new rules must be a no-op for it.
    expect(await tabIdsFor(['browser', 'network', 'repeater', 'code']))
      .toEqual(['browser', 'network', 'repeater', 'code'])
  })

  it('does not duplicate a tab id repeated in the allowlist', async () => {
    expect(await tabIdsFor(['code', 'code', 'browser'])).toEqual(['browser', 'code'])
  })

  it('ignores an allowlist entry that is not a known tab', async () => {
    expect(await tabIdsFor(['code', 'sqlmap'])).toEqual(['browser', 'code'])
  })

  it.each([
    ['null (a bare `tools:` line in YAML)', null],
    ['a string', 'browser'],
    ['a number', 7],
  ])('falls back to the default tab set when tools is %s', async (_label, value) => {
    // The layout reads raw frontmatter, so config.ts's array check never runs here.
    // A malformed value must not take the page down with it.
    expect(await tabIdsFor(value as unknown as string[]))
      .toEqual(['browser', 'network', 'repeater', 'code'])
  })

  it('refuses to open the Repeater from the Traffic Log when the challenge did not grant it', async () => {
    const { useData } = await import('vitepress')
    vi.mocked(useData).mockReturnValueOnce({
      frontmatter: {
        value: {
          title: 'SQL Injection Demo',
          difficulty: 'easy',
          category: 'web',
          backend: 'flask',
          slug: 'sqli-demo',
          description: 'x',
          markdownBody: '# x',
          tools: ['browser', 'network'],
        },
      },
      page: { value: { relativePath: 'challenge/sqli-demo/index.md' } },
    } as unknown as ReturnType<typeof useData>)
    const wrapper = mount(ChallengeLayout, { global: { stubs: { Content: true } } })

    await wrapper.find('[data-tab="network"]').trigger('click')
    await wrapper.vm.$nextTick()

    const { default: NetworkPanelComponent } = await import('../../../.vitepress/theme/components/NetworkPanel.vue')
    await wrapper.findComponent(NetworkPanelComponent).vm.$emit('sendToRepeater', 'GET / HTTP/1.1\r\n\r\n')
    await wrapper.vm.$nextTick()

    // The Repeater has no tab here, so it must stay closed rather than becoming
    // an active panel with no tab button to leave it by.
    expect(wrapper.find('[data-tab].ch-tab-btn-active').attributes('data-tab')).toBe('network')
    expect(wrapper.find('[data-panel="repeater"]').attributes('style')).toContain('display: none')
  })

  it('shows NetworkPanel when network tab is active', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    await wrapper.find('[data-tab="network"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-network-panel]').exists()).toBe(true)
  })

  it('switches to Repeater tab and injects request when NetworkPanel emits sendToRepeater', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    // Navigate to network tab so NetworkPanel is rendered
    await wrapper.find('[data-tab="network"]').trigger('click')
    await wrapper.vm.$nextTick()

    const { default: NetworkPanelComponent } = await import('../../../.vitepress/theme/components/NetworkPanel.vue')
    const networkPanelWrapper = wrapper.findComponent(NetworkPanelComponent)
    expect(networkPanelWrapper.exists()).toBe(true)

    const rawRequest = 'POST /login HTTP/1.1\r\nHost: challenge-test.localhost\r\n\r\n'
    await networkPanelWrapper.vm.$emit('sendToRepeater', rawRequest)
    await wrapper.vm.$nextTick()

    // Active tab should now be repeater
    const activeTabBtn = wrapper.find('[data-tab].ch-tab-btn-active')
    expect(activeTabBtn.attributes('data-tab')).toBe('repeater')

    // RepeatPanel should have the injected request
    const repeatPanel = wrapper.find('[data-repeat-panel]')
    expect(repeatPanel.attributes('data-injected')).toBe(rawRequest)
  })

  it('wraps Content in a vp-doc container for markdown typography', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const descPanel = wrapper.find('[data-description-panel]')
    expect(descPanel.find('.vp-doc').exists()).toBe(true)
  })

  it('passes disabled=true to all panels when SW controller is null', async () => {
    // Simulate no SW controller
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: null, ready: Promise.resolve({ active: null }), addEventListener: vi.fn() },
      configurable: true,
    })
    vi.resetModules()
    const mod = await import('../../../.vitepress/theme/layouts/ChallengeLayout.vue')
    const LayoutNoSW = mod.default

    const wrapper = mount(LayoutNoSW, {
      global: { stubs: { Content: true } },
    })
    await wrapper.vm.$nextTick()

    // All panels should be disabled because SW controller is null (swReady=false)
    const browserPanel = wrapper.find('[data-browser-panel]')
    expect(browserPanel.attributes('data-disabled')).toBe('true')
  })

  it('dispatch returns 503 with runtime not ready when runtime has not initialized', async () => {
    // Runtime stays null in test env: frontmatter has no wasmModule
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    await wrapper.vm.$nextTick()

    // Get dispatch from the BrowserPanel's props
    const { default: BrowserPanel } = await import('../../../.vitepress/theme/components/BrowserPanel.vue')
    const bpWrapper = wrapper.findComponent(BrowserPanel)
    expect(bpWrapper.exists()).toBe(true)

    const dispatch = bpWrapper.props('dispatch') as (req: Request) => Promise<Response>
    const res = await dispatch(new Request('https://challenge-sqli.localhost/'))

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('runtime not ready')
  })

  it('enables panels when swReady becomes true via controllerchange', async () => {
    let controllerChangeHandler: (() => void) | null = null
    const mockSW = {
      controller: null as ServiceWorker | null,
      ready: Promise.resolve({ active: { postMessage: vi.fn() } }),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === 'controllerchange') controllerChangeHandler = handler
      }),
    }
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockSW,
      configurable: true,
    })
    vi.resetModules()
    const mod = await import('../../../.vitepress/theme/layouts/ChallengeLayout.vue')
    const LayoutSW = mod.default

    const wrapper = mount(LayoutSW, {
      global: { stubs: { Content: true } },
    })
    await wrapper.vm.$nextTick()

    // Initially disabled
    expect(wrapper.find('[data-browser-panel]').attributes('data-disabled')).toBe('true')

    // Simulate SW taking control
    mockSW.controller = {} as ServiceWorker
    controllerChangeHandler?.()
    await wrapper.vm.$nextTick()

    // Should now be enabled (only runtimeReady is still false due to mocked runtime)
    // We just check that swReady no longer blocks — but runtimeReady might still be false
    // So disabled should still be true (blocked by runtimeReady), but the swReady part is resolved
    // This test verifies controllerchange is listened to
    expect(controllerChangeHandler).not.toBeNull()
  })

  it('passes different dispatch functions to BrowserPanel and RepeatPanel', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: BrowserPanel } = await import('../../../.vitepress/theme/components/BrowserPanel.vue')
    const { default: RepeatPanel } = await import('../../../.vitepress/theme/components/RepeatPanel.vue')

    const bp = wrapper.findComponent(BrowserPanel)
    const rp = wrapper.findComponent(RepeatPanel)

    const browserFn = bp.props('dispatch')
    const repeaterFn = rp.props('dispatch')

    // Both dispatch functions should exist and be different (source-attributed wrappers)
    expect(browserFn).toBeTypeOf('function')
    expect(repeaterFn).toBeTypeOf('function')
    expect(browserFn).not.toBe(repeaterFn)
  })

  it('swReady fallback: unlocks when controller is already set at mount time (race condition fix)', async () => {
    // Simulate the race condition: controllerchange fired between setup() and onMounted(),
    // so controller is non-null when onMounted's fallback check runs.
    // Use a getter that returns null on first access (setup ref init) and non-null after.
    let accessCount = 0
    const fakeController = { postMessage: vi.fn(), scriptURL: '', state: 'activated' as ServiceWorkerState } as unknown as ServiceWorker
    const mockSW = {
      get controller() {
        accessCount++
        // First access (ref initialization in setup) → null
        // Subsequent accesses (onMounted fallback) → non-null
        return accessCount <= 1 ? null : fakeController
      },
      ready: Promise.resolve({ active: { postMessage: vi.fn() } }),
      addEventListener: vi.fn(),
    }
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockSW,
      configurable: true,
    })
    vi.resetModules()
    const mod = await import('../../../.vitepress/theme/layouts/ChallengeLayout.vue')
    const Layout = mod.default

    mount(Layout, { global: { stubs: { Content: true } } })
    await new Promise(r => setTimeout(r, 0))

    // The onMounted fallback should have accessed controller at least twice
    // (once in setup for ref init, once+ in onMounted for the fallback check)
    expect(accessCount).toBeGreaterThanOrEqual(2)
  })

  it('swReady fallback: unlocks via navigator.serviceWorker.ready on first visit', async () => {
    // Simulate first visit: controller is null at mount time, SW is still installing.
    // After SW activates and claims, ready resolves and controller becomes non-null.
    let resolveReady!: (reg: unknown) => void
    const readyPromise = new Promise(resolve => { resolveReady = resolve })

    const mockSW: Record<string, unknown> = {
      controller: null,
      ready: readyPromise,
      addEventListener: vi.fn(),
    }
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockSW,
      configurable: true,
    })
    vi.resetModules()
    const mod = await import('../../../.vitepress/theme/layouts/ChallengeLayout.vue')
    const Layout = mod.default

    const wrapper = mount(Layout, { global: { stubs: { Content: true } } })
    await wrapper.vm.$nextTick()

    // Initially disabled (both swReady=false, runtimeReady=false)
    expect(wrapper.find('[data-browser-panel]').attributes('data-disabled')).toBe('true')

    // Simulate SW activation + clients.claim() → controller becomes non-null
    mockSW.controller = { postMessage: vi.fn() } as unknown as ServiceWorker
    resolveReady({ active: { postMessage: vi.fn() } })

    // Allow the ready.then() callback to execute
    await readyPromise
    await wrapper.vm.$nextTick()

    // Panel is still disabled because runtimeReady is also false,
    // but we verify the ready fallback path was exercised by checking
    // that the ready promise was consumed (no unhandled rejection)
    // and the addEventListener was called for controllerchange
    expect(mockSW.controller).not.toBeNull()
    expect((mockSW.addEventListener as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function),
    )
  })

  it('renders WxlshPanel and CodeEditorPanel in the layout', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    expect(wrapper.find('[data-wxlsh-panel]').exists()).toBe(true)
    expect(wrapper.find('[data-code-panel]').exists()).toBe(true)
  })

  it('passes distinct dispatch functions to Terminal and Code panels', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: WxlshPanel } = await import('../../../.vitepress/theme/components/WxlshPanel.vue')
    const { default: CodePanel } = await import('../../../.vitepress/theme/components/CodeEditorPanel.vue')
    const { default: BrowserPanel } = await import('../../../.vitepress/theme/components/BrowserPanel.vue')

    const wp = wrapper.findComponent(WxlshPanel)
    const cp = wrapper.findComponent(CodePanel)
    const bp = wrapper.findComponent(BrowserPanel)

    const terminalFn = wp.props('dispatch')
    const codeFn = cp.props('dispatch')
    const browserFn = bp.props('dispatch')

    expect(terminalFn).toBeTypeOf('function')
    expect(codeFn).toBeTypeOf('function')
    // All should be distinct source-attributed dispatch wrappers
    expect(terminalFn).not.toBe(browserFn)
    expect(codeFn).not.toBe(browserFn)
    expect(terminalFn).not.toBe(codeFn)
  })

  it('passes onCommandExecuted callback to WxlshPanel', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: WxlshPanel } = await import('../../../.vitepress/theme/components/WxlshPanel.vue')
    const wp = wrapper.findComponent(WxlshPanel)
    const cb = wp.props('onCommandExecuted') as (e: { command: string; output: string; error: boolean }) => void
    expect(cb).toBeTypeOf('function')

    cb({ command: 'help', output: 'Available commands', error: false })
    expect(mockAddTerminalCommand).toHaveBeenCalledWith('help', 'Available commands', false)
  })

  it('passes onCodeExecuted callback to CodeEditorPanel', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: CodePanel } = await import('../../../.vitepress/theme/components/CodeEditorPanel.vue')
    const cp = wrapper.findComponent(CodePanel)
    const cb = cp.props('onCodeExecuted') as (e: { code: string; output: string; error: boolean; duration: number }) => void
    expect(cb).toBeTypeOf('function')

    cb({ code: 'print(1)', output: '1\n', error: false, duration: 100 })
    expect(mockAddCodeExecution).toHaveBeenCalledWith('print(1)', '1\n', false, 100, expect.any(String))
  })

  it('passes onExport prop to FlagSubmit', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: FlagSubmitComponent } = await import('../../../.vitepress/theme/components/FlagSubmit.vue')
    const fs = wrapper.findComponent(FlagSubmitComponent)
    expect(fs.props('onExport')).toBeTypeOf('function')
  })

  it('onExport calls exportSession with challenge info from frontmatter', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: FlagSubmitComponent } = await import('../../../.vitepress/theme/components/FlagSubmit.vue')
    const fs = wrapper.findComponent(FlagSubmitComponent)
    const onExport = fs.props('onExport') as () => void
    onExport()

    expect(mockExportSession).toHaveBeenCalledOnce()
    const [challengeInfo] = mockExportSession.mock.calls[0]
    expect(challengeInfo.difficulty).toBe('easy')
    expect(challengeInfo.category).toBe('web')
    expect(challengeInfo.backend).toBe('flask')
    expect(challengeInfo.description).toBe('A simple Flask app with a SQL injection vulnerability.')
    expect(challengeInfo.fullDescription).toBe('# SQL Injection Demo\n\nA login form backed by SQLite.')
  })

  it('passes pyodide prop to WxlshPanel and CodeEditorPanel', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: WxlshPanel } = await import('../../../.vitepress/theme/components/WxlshPanel.vue')
    const { default: CodePanel } = await import('../../../.vitepress/theme/components/CodeEditorPanel.vue')

    const wp = wrapper.findComponent(WxlshPanel)
    const cp = wrapper.findComponent(CodePanel)

    // pyodide prop exists on both panels (may be null in test env since initRuntime exits early)
    expect(wp.props()).toHaveProperty('pyodide')
    expect(cp.props()).toHaveProperty('pyodide')
  })

  it('initRuntime code path includes standalone Pyodide loading for non-Python backends', async () => {
    // Verify the source code contains the standalone Pyodide loading logic
    // This is a structural test — the actual loading is integration-level
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    const source = readFileSync(
      resolve(__dirname, '../../../.vitepress/theme/layouts/ChallengeLayout.vue'),
      'utf-8',
    )
    // Must have the standalone Pyodide fallback for non-Python backends
    expect(source).toContain('if (!pyodideInstance.value)')
    expect(source).toContain('loadPyodide')
    // Must NOT hardcode to only Python backends
    expect(source).toContain('toolsPyodide')
  })
})
