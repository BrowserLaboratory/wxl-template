import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BrowserPanel from '../../../.vitepress/theme/components/BrowserPanel.vue'

describe('BrowserPanel', () => {
  it('renders HTML response in iframe on navigate', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('<h1>Hello</h1>', {
        headers: { 'Content-Type': 'text/html' },
      }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const goBtn = wrapper.find('[data-go]')
    expect(goBtn.exists()).toBe(true)
    await goBtn.trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('sandbox')).toContain('allow-scripts')
    expect(iframe.attributes('sandbox')).toContain('allow-forms')
    // allow-same-origin must NOT be present — it defeats the sandbox
    expect(iframe.attributes('sandbox')).not.toContain('allow-same-origin')
  })

  it('does NOT render HTTP method selector', () => {
    const mockDispatch = vi.fn()
    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('displays JSON response as formatted text, not iframe', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('{"key":"value"}', {
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    await wrapper.find('[data-go]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const pre = wrapper.find('[data-response-text]')
    expect(pre.exists()).toBe(true)
    expect(pre.text()).toContain('key')
    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(false)
  })

  it('triggers navigate on Enter key in URL input', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('OK', { headers: { 'Content-Type': 'text/plain' } }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const input = wrapper.find('[data-url-input]')
    expect(input.exists()).toBe(true)
    await input.trigger('keydown.enter')
    await wrapper.vm.$nextTick()

    expect(mockDispatch).toHaveBeenCalledOnce()
    const req: Request = mockDispatch.mock.calls[0][0]
    expect(req.method).toBe('GET')
  })

  it('dispatches GET-only requests', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('OK', { headers: { 'Content-Type': 'text/plain' } }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    await wrapper.find('[data-go]').trigger('click')
    await wrapper.vm.$nextTick()

    const req: Request = mockDispatch.mock.calls[0][0]
    expect(req.method).toBe('GET')
  })

  it('shows disabled state when disabled prop is true', () => {
    const mockDispatch = vi.fn()
    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch, disabled: true },
    })
    const goBtn = wrapper.find('[data-go]')
    expect(goBtn.attributes('disabled')).toBeDefined()
  })
})

// ─── Form submit / link click via postMessage ─────────────────────────────────
// The iframe sandbox no longer includes allow-same-origin, so the injected script
// inside srcdoc relays events via parent.postMessage. Tests simulate this by
// dispatching MessageEvent on window with source=iframeEl.contentWindow.

/** Mount BrowserPanel, navigate to get the HTML iframe, and return helpers. */
async function mountWithIframe(slug: string, dispatch: ReturnType<typeof vi.fn>) {
  const wrapper = mount(BrowserPanel, {
    props: { slug, dispatch },
    attachTo: document.body,
  })
  // First call: navigate to render the iframe
  await wrapper.find('[data-go]').trigger('click')
  await flushPromises()

  const iframeEl = wrapper.find('iframe').element as HTMLIFrameElement
  return { wrapper, iframeEl }
}

/** Simulate the injected script posting a link click from inside the iframe. */
function postLinkClick(iframeEl: HTMLIFrameElement, href: string) {
  window.dispatchEvent(
    new MessageEvent('message', {
      source: iframeEl.contentWindow,
      data: { type: 'WXLSH_LINK_CLICK', href },
    }),
  )
}

/** Simulate the injected script posting a form submission from inside the iframe. */
function postFormSubmit(
  iframeEl: HTMLIFrameElement,
  opts: {
    action?: string
    method?: string
    enctype?: string
    fields?: [string, string][]
  } = {},
) {
  window.dispatchEvent(
    new MessageEvent('message', {
      source: iframeEl.contentWindow,
      data: {
        type: 'WXLSH_FORM_SUBMIT',
        action: opts.action ?? '',
        method: (opts.method ?? 'GET').toUpperCase(),
        enctype: opts.enctype ?? 'application/x-www-form-urlencoded',
        fields: opts.fields ?? [],
      },
    }),
  )
}

// ─── withContext: request context metadata headers ────────────────────────────
// Forbidden request headers (User-Agent, Sec-*, etc.) cannot be set on Request
// objects in JS. BrowserPanel passes context via X-Wxlsh-* metadata headers;
// useTrafficLog.wrap() uses them to build the full simulated header set for display.

describe('BrowserPanel — request context metadata (withContext)', () => {
  it('address bar navigation sets X-Wxlsh-Context: navigation', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('OK', { headers: { 'Content-Type': 'text/plain' } }),
    )
    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })
    await wrapper.find('[data-go]').trigger('click')
    await wrapper.vm.$nextTick()

    const req: Request = mockDispatch.mock.calls[0][0]
    expect(req.headers.get('X-Wxlsh-Context')).toBe('navigation')
    expect(req.headers.get('X-Wxlsh-Referer')).toBeNull()
  })

  it('link click sets X-Wxlsh-Context: link and X-Wxlsh-Referer', async () => {
    const mockDispatch = vi.fn()
      .mockResolvedValueOnce(new Response('<a href="/page2">link</a>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('page2', { headers: { 'Content-Type': 'text/plain' } }))
    const { iframeEl } = await mountWithIframe('test', mockDispatch)

    postLinkClick(iframeEl, '/page2')
    await flushPromises()

    const req: Request = mockDispatch.mock.calls[1][0]
    expect(req.headers.get('X-Wxlsh-Context')).toBe('link')
    expect(req.headers.get('X-Wxlsh-Referer')).toBeTruthy()
  })

  it('form POST sets X-Wxlsh-Context: form-post and X-Wxlsh-Referer', async () => {
    const mockDispatch = vi.fn()
      .mockResolvedValueOnce(new Response('<h1>page</h1>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('ok', { headers: { 'Content-Type': 'text/plain' } }))
    const { iframeEl } = await mountWithIframe('sqli-demo', mockDispatch)

    postFormSubmit(iframeEl, {
      method: 'POST',
      action: '/login',
      fields: [['username', 'admin'], ['password', 'secret']],
    })
    await flushPromises()

    const req: Request = mockDispatch.mock.calls[1][0]
    expect(req.headers.get('X-Wxlsh-Context')).toBe('form-post')
    expect(req.headers.get('X-Wxlsh-Referer')).toBeTruthy()
  })

  it('form GET sets X-Wxlsh-Context: form-get and X-Wxlsh-Referer', async () => {
    const mockDispatch = vi.fn()
      .mockResolvedValueOnce(new Response('<h1>page</h1>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('results', { headers: { 'Content-Type': 'text/plain' } }))
    const { iframeEl } = await mountWithIframe('test', mockDispatch)

    postFormSubmit(iframeEl, {
      method: 'GET',
      action: '/search',
      fields: [['q', 'test']],
    })
    await flushPromises()

    const req: Request = mockDispatch.mock.calls[1][0]
    expect(req.headers.get('X-Wxlsh-Context')).toBe('form-get')
    expect(req.headers.get('X-Wxlsh-Referer')).toBeTruthy()
  })
})

// ─── Form submit interception tests ───────────────────────────────────────────

describe('BrowserPanel — form submit interception', () => {
  it('3.1 POST form with default enctype is submitted via dispatch with urlencoded content-type', async () => {
    const mockDispatch = vi.fn()
      .mockResolvedValueOnce(new Response('<h1>page</h1>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('<p>ok</p>', { headers: { 'Content-Type': 'text/html' } }))

    const { iframeEl } = await mountWithIframe('sqli-demo', mockDispatch)

    postFormSubmit(iframeEl, {
      method: 'POST',
      action: '/login',
      enctype: 'application/x-www-form-urlencoded',
      fields: [['username', 'admin'], ['password', "' OR 1=1--"]],
    })
    await flushPromises()

    expect(mockDispatch).toHaveBeenCalledTimes(2)
    const req: Request = mockDispatch.mock.calls[1][0]
    expect(req.method).toBe('POST')
    expect(req.url).toBe('https://challenge-sqli-demo.localhost/login')
    expect(req.headers.get('content-type')).toContain('application/x-www-form-urlencoded')
  })

  it('3.2 POST form with multipart/form-data enctype dispatches without manually set content-type boundary', async () => {
    const mockDispatch = vi.fn()
      .mockResolvedValueOnce(new Response('<h1>page</h1>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('<p>ok</p>', { headers: { 'Content-Type': 'text/html' } }))

    const { iframeEl } = await mountWithIframe('test', mockDispatch)

    postFormSubmit(iframeEl, {
      method: 'POST',
      action: '/upload',
      enctype: 'multipart/form-data',
      fields: [['file_name', 'test.txt']],
    })
    await flushPromises()

    expect(mockDispatch).toHaveBeenCalledTimes(2)
    const req: Request = mockDispatch.mock.calls[1][0]
    expect(req.method).toBe('POST')
    expect(req.url).toBe('https://challenge-test.localhost/upload')
    // content-type for FormData body is set by the fetch API (includes boundary),
    // or null — either way it must NOT be the urlencoded type
    const ct = req.headers.get('content-type')
    expect(ct).not.toContain('application/x-www-form-urlencoded')
  })

  it('3.3 GET form appends fields to query string', async () => {
    const mockDispatch = vi.fn()
      .mockResolvedValueOnce(new Response('<h1>page</h1>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('<p>results</p>', { headers: { 'Content-Type': 'text/html' } }))

    const { iframeEl } = await mountWithIframe('test', mockDispatch)

    postFormSubmit(iframeEl, {
      method: 'GET',
      action: '/search',
      fields: [['q', 'hello world']],
    })
    await flushPromises()

    expect(mockDispatch).toHaveBeenCalledTimes(2)
    const req: Request = mockDispatch.mock.calls[1][0]
    expect(req.method).toBe('GET')
    const reqUrl = new URL(req.url)
    expect(reqUrl.hostname).toBe('challenge-test.localhost')
    expect(reqUrl.pathname).toBe('/search')
    expect(reqUrl.searchParams.get('q')).toBe('hello world')
  })

  it('3.4 form action relative URL resolves to challenge origin, not localhost:5173', async () => {
    const mockDispatch = vi.fn()
      .mockResolvedValueOnce(new Response('<h1>page</h1>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('<p>ok</p>', { headers: { 'Content-Type': 'text/html' } }))

    const { iframeEl } = await mountWithIframe('sqli-demo', mockDispatch)

    postFormSubmit(iframeEl, { method: 'POST', action: '/login' })
    await flushPromises()

    const req: Request = mockDispatch.mock.calls[1][0]
    expect(req.url).toBe('https://challenge-sqli-demo.localhost/login')
    expect(req.url).not.toContain('localhost:5173')
  })

  it('3.5 form with no action attribute submits to current url.value', async () => {
    const mockDispatch = vi.fn()
      .mockResolvedValueOnce(new Response('<h1>page</h1>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('<p>ok</p>', { headers: { 'Content-Type': 'text/html' } }))

    const { wrapper, iframeEl } = await mountWithIframe('sqli-demo', mockDispatch)

    // Default url.value is https://challenge-sqli-demo.localhost/
    postFormSubmit(iframeEl, { method: 'POST' /* no action */ })
    await flushPromises()

    const req: Request = mockDispatch.mock.calls[1][0]
    expect(req.url).toContain('challenge-sqli-demo.localhost')
    wrapper.unmount()
  })
})

// ─── Auto-navigation on runtime ready ──────────────────────────────────────────

describe('BrowserPanel — auto-navigation on runtime ready', () => {
  it('auto-navigates when disabled transitions from true to false', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('<h1>Welcome</h1>', { headers: { 'Content-Type': 'text/html' } }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'sqli-demo', dispatch: mockDispatch, disabled: true },
    })

    // Initially disabled — no dispatch should have been called
    expect(mockDispatch).not.toHaveBeenCalled()

    // Runtime becomes ready
    await wrapper.setProps({ disabled: false })
    await flushPromises()

    // Should have auto-navigated
    expect(mockDispatch).toHaveBeenCalledOnce()
    const req: Request = mockDispatch.mock.calls[0][0]
    expect(req.method).toBe('GET')
    expect(req.url).toBe('https://challenge-sqli-demo.localhost/')
  })

  it('does not auto-navigate if disabled stays false (no transition)', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('OK', { headers: { 'Content-Type': 'text/plain' } }),
    )

    // Mount with disabled=false from the start — the watch should not trigger
    // (watch only fires on true→false transition, not initial false)
    mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch, disabled: false },
    })
    await flushPromises()

    // No auto-navigation — dispatch not called
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
