import { describe, it, expect, vi } from 'vitest'
import { PhpRuntime } from '../../../.vitepress/theme/composables/usePhpRuntime'

const APP_PHP = '<?php echo "hello"; ?>'

interface MockPhpResult {
  output: string
  headers: string[]
  exitCode: number
}

function makeMockPhp(result: Partial<MockPhpResult> = {}) {
  const run = vi.fn().mockResolvedValue({
    output: result.output ?? '',
    headers: result.headers ?? [],
    exitCode: result.exitCode ?? 0,
  })
  const writeFile = vi.fn()
  const php = { run, writeFile }
  const loadPhp = vi.fn().mockResolvedValue(php)
  return { loadPhp, php, run, writeFile }
}

describe('PhpRuntime.handleRequest()', () => {
  it('sets $_SERVER[REQUEST_METHOD] to GET for GET request', async () => {
    const { loadPhp, run } = makeMockPhp({ output: 'ok' })
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/'))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain("'REQUEST_METHOD'")
    expect(code).toContain("'GET'")
  })

  it('populates $_GET from query string', async () => {
    const { loadPhp, run } = makeMockPhp({ output: 'ok' })
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    await runtime.handleRequest(new Request('https://challenge-test.localhost/?name=alice&id=42'))

    const code: string = run.mock.calls[0][0]
    expect(code).toContain("'name'")
    expect(code).toContain("'alice'")
    expect(code).toContain("'id'")
    expect(code).toContain("'42'")
  })
})
