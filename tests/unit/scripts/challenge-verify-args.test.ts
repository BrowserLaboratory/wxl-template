import { describe, it, expect } from 'vitest'
import { parseVerifyArgs, VerifyArgError, selectLayers } from '../../../scripts/challenge-verify'

describe('parseVerifyArgs (task 4.1)', () => {
  it('accepts --blind --layers L1,L4 --json without parse error', () => {
    const args = parseVerifyArgs(['door-is-open', '--blind', '--layers', 'L1,L4', '--json'])
    expect(args.slug).toBe('door-is-open')
    expect(args.blind).toBe(true)
    expect(args.layers).toEqual(['L1', 'L4'])
    expect(args.json).toBe(true)
  })

  it('defaults blind=false, json=false, layers=undefined', () => {
    const args = parseVerifyArgs(['door-is-open'])
    expect(args.blind).toBe(false)
    expect(args.json).toBe(false)
    expect(args.layers).toBeUndefined()
  })

  it('rejects missing slug', () => {
    expect(() => parseVerifyArgs(['--blind'])).toThrow(VerifyArgError)
  })

  it('rejects invalid --layers entry', () => {
    expect(() => parseVerifyArgs(['door-is-open', '--layers', 'L5'])).toThrow(VerifyArgError)
  })

  it('selectLayers defaults to L1+L2+L3 without --blind', () => {
    const args = parseVerifyArgs(['door-is-open'])
    expect(selectLayers(args)).toEqual(['L1', 'L2', 'L3'])
  })

  it('selectLayers adds L4 with --blind', () => {
    const args = parseVerifyArgs(['door-is-open', '--blind'])
    expect(selectLayers(args)).toEqual(['L1', 'L2', 'L3', 'L4'])
  })

  it('selectLayers honors explicit --layers subset', () => {
    const args = parseVerifyArgs(['door-is-open', '--layers', 'L1,L3'])
    expect(selectLayers(args)).toEqual(['L1', 'L3'])
  })
})
