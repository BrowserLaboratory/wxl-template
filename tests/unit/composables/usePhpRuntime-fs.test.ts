import { describe, it, expect, vi } from 'vitest'
import { PhpRuntime } from '../../../.vitepress/theme/composables/usePhpRuntime'

const APP_PHP = '<?php echo file_get_contents("/flag.txt"); ?>'
const FLAG_CONTENT = 'CTF{php_flag_test}'

describe('PhpRuntime FS mount', () => {
  it('writes FS entries into php-wasm before execution', async () => {
    const writeFile = vi.fn()
    const run = vi.fn().mockResolvedValue({ output: FLAG_CONTENT, headers: [], exitCode: 0 })
    const php = { run, writeFile }
    const loadPhp = vi.fn().mockResolvedValue(php)
    const runtime = new PhpRuntime(loadPhp)

    const fsEntries: Record<string, Uint8Array> = {
      '/flag.txt': new TextEncoder().encode(FLAG_CONTENT),
    }
    await runtime.initialize(APP_PHP, fsEntries)

    expect(writeFile).toHaveBeenCalledWith('/flag.txt', expect.any(Uint8Array))
  })

  it('writes FS before any request is handled', async () => {
    const callOrder: string[] = []
    const writeFile = vi.fn().mockImplementation(() => callOrder.push('writeFile'))
    const run = vi.fn().mockImplementation(async () => {
      callOrder.push('run')
      return { output: '', headers: [], exitCode: 0 }
    })
    const php = { run, writeFile }
    const loadPhp = vi.fn().mockResolvedValue(php)
    const runtime = new PhpRuntime(loadPhp)

    await runtime.initialize(APP_PHP, { '/flag.txt': new TextEncoder().encode(FLAG_CONTENT) })
    await runtime.handleRequest(new Request('https://challenge-test.localhost/'))

    expect(callOrder.indexOf('writeFile')).toBeLessThan(callOrder.indexOf('run'))
  })
})
