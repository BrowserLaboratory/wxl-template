import { describe, it, expect, vi } from 'vitest'
import { PhpRuntime } from '../../../.vitepress/theme/composables/usePhpRuntime'

const APP_PHP = '<?php header("Content-Type: application/json"); echo "{}"; ?>'

describe('PhpRuntime response headers', () => {
  it('forwards header() calls from PHP to the response', async () => {
    const run = vi.fn().mockResolvedValue({
      output: '{}',
      headers: ['Content-Type: application/json', 'X-Custom: test'],
      exitCode: 0,
    })
    const php = { run, writeFile: vi.fn() }
    const loadPhp = vi.fn().mockResolvedValue(php)
    const runtime = new PhpRuntime(loadPhp)
    await runtime.initialize(APP_PHP)

    const response = await runtime.handleRequest(
      new Request('https://challenge-test.localhost/api'),
    )

    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.headers.get('x-custom')).toBe('test')
  })
})
