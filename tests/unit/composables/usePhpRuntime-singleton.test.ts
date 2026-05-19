import { describe, it, expect, vi } from 'vitest'
import { PhpRuntime } from '../../../.vitepress/theme/composables/usePhpRuntime'

const APP_PHP = '<?php echo "ok"; ?>'

describe('PhpRuntime singleton (initialize once)', () => {
  it('does NOT re-initialize php-wasm on second initialize call', async () => {
    const loadPhp = vi.fn().mockResolvedValue({
      run: vi.fn().mockResolvedValue({ output: 'ok', headers: [], exitCode: 0 }),
      writeFile: vi.fn(),
    })
    const runtime = new PhpRuntime(loadPhp)

    await runtime.initialize(APP_PHP)
    await runtime.initialize(APP_PHP)

    expect(loadPhp).toHaveBeenCalledOnce()
  })
})
