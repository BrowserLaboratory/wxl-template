import { describe, it, expect, vi } from 'vitest'
import { PhpRuntime } from '../../../.vitepress/theme/composables/usePhpRuntime'

const APP_PHP = '<?php echo "ok"; ?>'

function makeMockPhp() {
  const run = vi.fn().mockResolvedValue({ output: 'ok', headers: [], exitCode: 0 })
  const php = { run, writeFile: vi.fn() }
  const loadPhp = vi.fn().mockResolvedValue(php)
  return { loadPhp, run }
}

describe('PhpRuntime POST body handling', () => {
  it('populates $_POST from form-encoded body', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=admin&password=secret',
    }))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain("'username'")
    expect(code).toContain("'admin'")
    expect(code).toContain("'password'")
    expect(code).toContain("'secret'")
  })

  it('makes raw JSON body available via $GLOBALS[_RAW_INPUT]', async () => {
    const { loadPhp, run } = makeMockPhp()
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    const jsonBody = '{"key":"value"}'
    await runtime.handleRequest(new Request('https://challenge-test.localhost/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBody,
    }))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain(jsonBody)
  })
})
