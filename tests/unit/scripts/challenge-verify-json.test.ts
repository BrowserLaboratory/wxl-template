import { describe, it, expect } from 'vitest'
import {
  runVerify,
  parseVerifyArgs,
  formatJson,
  type LayerRunners,
  type LayerOutcome,
} from '../../../scripts/challenge-verify'

function passRunners(): LayerRunners {
  const pass = (name: 'L1' | 'L2' | 'L3' | 'L4') => async (): Promise<LayerOutcome> => ({
    layer: name,
    status: 'pass',
    reason: null,
  })
  return { L1: pass('L1'), L2: pass('L2'), L3: pass('L3'), L4: pass('L4') }
}

describe('verify --json output (task 4.7)', () => {
  it('serializes the full result with the contract-mandated keys', async () => {
    const result = await runVerify(parseVerifyArgs(['door-is-open']), passRunners())
    const json = formatJson(result)
    const parsed = JSON.parse(JSON.stringify(json))
    expect(Object.keys(parsed).sort()).toEqual(['failed_at', 'layers_run', 'results', 'slug', 'summary'])
    expect(parsed.slug).toBe('door-is-open')
    expect(parsed.layers_run).toEqual(['L1', 'L2', 'L3'])
    expect(parsed.summary).toBe('verified')
    expect(parsed.failed_at).toBeNull()
    expect(parsed.results).toHaveLength(3)
    expect(Object.keys(parsed.results[0]).sort()).toEqual(['layer', 'reason', 'status'])
  })

  it('records failed_at and summary=failed when a layer fails', async () => {
    const runners: LayerRunners = {
      L1: async () => ({ layer: 'L1', status: 'pass', reason: null }),
      L2: async () => ({ layer: 'L2', status: 'fail', reason: 'oops' }),
      L3: async () => ({ layer: 'L3', status: 'pass', reason: null }),
      L4: async () => ({ layer: 'L4', status: 'pass', reason: null }),
    }
    const result = await runVerify(parseVerifyArgs(['door-is-open']), runners)
    const json = formatJson(result)
    expect(json.summary).toBe('failed')
    expect(json.failed_at).toBe('L2')
    expect(json.layers_run).toEqual(['L1', 'L2'])
  })
})
