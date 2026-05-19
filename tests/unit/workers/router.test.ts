import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, type BackendDispatcher } from '../../../.vitepress/workers/router'

// ─── 5.1 SW intercepts challenge-*.localhost (HTTPS) ────────────────────────

describe('SW intercepts challenge-*.localhost (HTTPS)', () => {
  it('intercepts https://challenge-test.localhost/', () => {
    const router = createRouter()
    expect(router.shouldIntercept(new URL('https://challenge-test.localhost/'))).toBe(true)
  })

  it('intercepts https://challenge-sqli-basic.localhost/api/users', () => {
    const router = createRouter()
    expect(router.shouldIntercept(new URL('https://challenge-sqli-basic.localhost/api/users'))).toBe(true)
  })

  it('does NOT intercept https://vitepress.dev/', () => {
    const router = createRouter()
    expect(router.shouldIntercept(new URL('https://vitepress.dev/'))).toBe(false)
  })

  it('does NOT intercept https://localhost:5173/', () => {
    const router = createRouter()
    expect(router.shouldIntercept(new URL('https://localhost:5173/'))).toBe(false)
  })
})

// ─── 5.3 REGISTER / UNREGISTER challenge ────────────────────────────────────

describe('challenge registration', () => {
  it('routes to registered backend after REGISTER_CHALLENGE', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('ok'))
    const router = createRouter({ python: pythonDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'sqli', backend: 'flask' })

    const req = new Request('https://challenge-sqli.localhost/api')
    const res = await router.dispatch(req)

    expect(pythonDispatch).toHaveBeenCalledOnce()
  })

  it('returns 503 after UNREGISTER_CHALLENGE', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('ok'))
    const router = createRouter({ python: pythonDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'sqli', backend: 'flask' })
    router.handleMessage({ type: 'UNREGISTER_CHALLENGE', slug: 'sqli' })

    const req = new Request('https://challenge-sqli.localhost/api')
    const res = await router.dispatch(req)

    expect(res.status).toBe(503)
    expect(pythonDispatch).not.toHaveBeenCalled()
  })
})

// ─── 5.5 dispatch to correct runtime ────────────────────────────────────────

describe('runtime dispatch', () => {
  it('dispatches flask backend to python runtime', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('python ok'))
    const phpDispatch = vi.fn().mockResolvedValue(new Response('php ok'))
    const router = createRouter({ python: pythonDispatch, php: phpDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'flask-c', backend: 'flask' })
    await router.dispatch(new Request('https://challenge-flask-c.localhost/'))

    expect(pythonDispatch).toHaveBeenCalledOnce()
    expect(phpDispatch).not.toHaveBeenCalled()
  })

  it('[RED] dispatches fastapi backend to python runtime', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('python ok'))
    const phpDispatch = vi.fn().mockResolvedValue(new Response('php ok'))
    const router = createRouter({ python: pythonDispatch, php: phpDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'fastapi-c', backend: 'fastapi' })
    await router.dispatch(new Request('https://challenge-fastapi-c.localhost/'))

    expect(pythonDispatch).toHaveBeenCalledOnce()
    expect(phpDispatch).not.toHaveBeenCalled()
  })

  it('dispatches php backend to php runtime', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('python ok'))
    const phpDispatch = vi.fn().mockResolvedValue(new Response('php ok'))
    const router = createRouter({ python: pythonDispatch, php: phpDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'php-c', backend: 'php' })
    await router.dispatch(new Request('https://challenge-php-c.localhost/'))

    expect(phpDispatch).toHaveBeenCalledOnce()
    expect(pythonDispatch).not.toHaveBeenCalled()
  })

  it('returns 501 for unknown backend', async () => {
    const router = createRouter()
    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'unknown-c', backend: 'unknown' as any })
    const res = await router.dispatch(new Request('https://challenge-unknown-c.localhost/'))
    expect(res.status).toBe(501)
  })
})

// ─── registration wait mechanism ─────────────────────────────────────────────

describe('Service Worker waits for challenge registration on registry miss', () => {
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('resolves fetch when registration arrives before timeout', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('ok'))
    const router = createRouter({ python: pythonDispatch }, { registrationTimeout: 200 })

    // Dispatch before registration
    const dispatchPromise = router.dispatch(new Request('https://challenge-sqli.localhost/'))

    // Registration arrives synchronously
    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'sqli', backend: 'flask' })

    const res = await dispatchPromise
    expect(res.status).toBe(200)
    expect(pythonDispatch).toHaveBeenCalledOnce()
  })

  it('returns 503 after timeout if registration never arrives', async () => {
    vi.useFakeTimers()
    const router = createRouter({ python: vi.fn() }, { registrationTimeout: 3000 })

    const dispatchPromise = router.dispatch(new Request('https://challenge-unregistered.localhost/'))
    vi.advanceTimersByTime(3001)

    const res = await dispatchPromise
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('challenge not registered')
  })

  it('resolves all pending fetches for the same slug when registration arrives', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('ok'))
    const router = createRouter({ python: pythonDispatch }, { registrationTimeout: 200 })

    const d1 = router.dispatch(new Request('https://challenge-sqli.localhost/a'))
    const d2 = router.dispatch(new Request('https://challenge-sqli.localhost/b'))

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'sqli', backend: 'flask' })

    const [res1, res2] = await Promise.all([d1, d2])
    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    expect(pythonDispatch).toHaveBeenCalledTimes(2)
  })
})

// ─── 5.7 error handling ──────────────────────────────────────────────────────

describe('runtime error handling', () => {
  it('returns 500 with error JSON when runtime throws', async () => {
    const brokenDispatch = vi.fn().mockRejectedValue(new Error('runtime exploded'))
    const router = createRouter({ python: brokenDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'broken', backend: 'flask' })
    const res = await router.dispatch(new Request('https://challenge-broken.localhost/'))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('in production mode, 500 body does not contain stack trace', async () => {
    const brokenDispatch = vi.fn().mockRejectedValue(new Error('oops'))
    const router = createRouter({ python: brokenDispatch }, { production: true })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'prod-c', backend: 'flask' })
    const res = await router.dispatch(new Request('https://challenge-prod-c.localhost/'))
    const body = await res.json()

    expect(body.stack).toBeUndefined()
    expect(body.error).toBe('Internal Server Error')
  })
})
