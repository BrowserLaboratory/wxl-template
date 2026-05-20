import { describe, it, expect } from 'vitest'
import {
  runVerify,
  parseVerifyArgs,
  type LayerRunners,
  type LayerOutcome,
} from '../../../scripts/challenge-verify'

function makeFakeRunners(overrides: Partial<LayerRunners> = {}): {
  runners: LayerRunners
  calls: string[]
} {
  const calls: string[] = []
  const make = (name: 'L1' | 'L2' | 'L3' | 'L4'): ((slug: string) => Promise<LayerOutcome>) =>
    async () => {
      calls.push(name)
      return { layer: name, status: 'pass', reason: null }
    }
  return {
    calls,
    runners: {
      L1: overrides.L1 ?? make('L1'),
      L2: overrides.L2 ?? make('L2'),
      L3: overrides.L3 ?? make('L3'),
      L4: overrides.L4 ?? make('L4'),
    },
  }
}

describe('L4 dispatch gate (task 4.5)', () => {
  it('does NOT invoke L4 without --blind', async () => {
    const { runners, calls } = makeFakeRunners()
    await runVerify(parseVerifyArgs(['door-is-open']), runners)
    expect(calls).toEqual(['L1', 'L2', 'L3'])
    expect(calls).not.toContain('L4')
  })

  it('invokes L4 only when --blind is set', async () => {
    const { runners, calls } = makeFakeRunners()
    await runVerify(parseVerifyArgs(['door-is-open', '--blind']), runners)
    expect(calls).toEqual(['L1', 'L2', 'L3', 'L4'])
  })

  it('passes the exit code through from the L4 runner', async () => {
    const { runners } = makeFakeRunners({
      L4: async () => ({ layer: 'L4', status: 'inconclusive', reason: 'no FINAL_FLAG line' }),
    })
    const result = await runVerify(parseVerifyArgs(['door-is-open', '--blind']), runners)
    expect(result.exitCode).toBe(2)
    expect(result.summary).toBe('inconclusive')
    expect(result.failedAt).toBe('L4')
  })
})
