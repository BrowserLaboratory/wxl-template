import { describe, it, expect, vi } from 'vitest'
import { PhpRuntime } from '../../../.vitepress/theme/composables/usePhpRuntime'

const APP_PHP = '<?php echo "ok"; ?>'

function makeMockPhp() {
  const run = vi.fn().mockResolvedValue({ output: 'ok', headers: [], exitCode: 0 })
  const php = { run, writeFile: vi.fn() }
  const loadPhp = vi.fn().mockResolvedValue(php)
  return { loadPhp, run }
}

describe('PhpRuntime cookie parsing', () => {
  // NOTE: The Fetch API forbids setting Cookie header directly on Request objects.
  // In this system, BrowserPanel transports cookies via X-Wxlsh-Cookie header.
  // All cookie tests use X-Wxlsh-Cookie as the transport mechanism.

  it('populates $_COOKIE from Cookie header (via X-Wxlsh-Cookie transport)', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/', {
      headers: { 'X-Wxlsh-Cookie': 'theme=dark; session_user=guest' },
    }))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain('$_COOKIE')
    expect(code).toContain("'theme'")
    expect(code).toContain("'dark'")
    expect(code).toContain("'session_user'")
    expect(code).toContain("'guest'")
  })

  it('last-value-wins for duplicate cookie names', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/', {
      headers: { 'X-Wxlsh-Cookie': 'token=first; token=second' },
    }))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain('$_COOKIE')
    expect(code).toContain("'token'")
    expect(code).toContain("'second'")
    // Should NOT contain the first value as a cookie value assignment
    // The last value wins, so only 'second' should appear for 'token'
    const cookieSection = code.slice(code.indexOf('$_COOKIE'))
    const cookieBlock = cookieSection.slice(0, cookieSection.indexOf(';') + 1)
    expect(cookieBlock).not.toContain("'first'")
  })

  it('initializes $_COOKIE as empty array when no Cookie header', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/'))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain('$_COOKIE')
    // Should contain an empty cookie array assignment
    expect(code).toMatch(/\$_COOKIE\s*=\s*\[\s*\n\s*\]/)
  })

  it('reads cookies from x-wxlsh-cookie transport header', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/', {
      headers: { 'X-Wxlsh-Cookie': 'lang=en; role=admin' },
    }))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain('$_COOKIE')
    expect(code).toContain("'lang'")
    expect(code).toContain("'en'")
    expect(code).toContain("'role'")
    expect(code).toContain("'admin'")
  })

  it('preserves raw cookie values without URL decoding', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/', {
      headers: { 'X-Wxlsh-Cookie': 'data=hello%20world' },
    }))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain("'data'")
    // Raw value should be preserved, NOT decoded
    expect(code).toContain("'hello%20world'")
  })

  it('handles cookie with no value (name only)', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/', {
      headers: { 'X-Wxlsh-Cookie': 'novalue' },
    }))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain('$_COOKIE')
    expect(code).toContain("'novalue'")
  })

  it('handles cookie value containing equals sign', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/', {
      headers: { 'X-Wxlsh-Cookie': 'data=base64==value' },
    }))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain("'data'")
    expect(code).toContain("'base64==value'")
  })
})

describe('PhpRuntime upstream header limitations', () => {
  it('returns empty headers from adapter (php-wasm limitation)', async () => {
    const run = vi.fn().mockResolvedValue({
      output: 'response body',
      headers: [],
      exitCode: 0,
    })
    const php = { run, writeFile: vi.fn() }
    const loadPhp = vi.fn().mockResolvedValue(php)
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    const response = await runtime.handleRequest(
      new Request('https://challenge-test.localhost/'),
    )

    // Default Content-Type should be text/html
    expect(response.headers.get('content-type')).toBe('text/html')
    // No other custom headers when adapter returns empty array
    expect(response.headers.has('x-custom')).toBe(false)
  })
})
