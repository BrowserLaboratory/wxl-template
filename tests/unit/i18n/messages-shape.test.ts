import { describe, it, expect } from 'vitest'
import en from '../../../.vitepress/theme/i18n/messages/en.json'
import zhTW from '../../../.vitepress/theme/i18n/messages/zh-TW.json'

type MessageNode = string | { [k: string]: MessageNode }

function flatten(obj: MessageNode, prefix = ''): Record<string, string> {
  if (typeof obj === 'string') return { [prefix]: obj }
  const result: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key
    Object.assign(result, flatten(obj[key], newPrefix))
  }
  return result
}

const CJK_RE = /[一-鿿]/

describe('messages shape parity', () => {
  it('en.json and zh-TW.json have identical key paths', () => {
    const enKeys = Object.keys(flatten(en as MessageNode)).sort()
    const zhKeys = Object.keys(flatten(zhTW as MessageNode)).sort()
    expect(zhKeys).toEqual(enKeys)
  })

  it('en.json leaves contain no CJK characters', () => {
    const flat = flatten(en as MessageNode)
    for (const [path, value] of Object.entries(flat)) {
      expect(value, `key path: ${path}`).not.toMatch(CJK_RE)
    }
  })

  it('zh-TW.json leaves contain CJK (with carve-out for non-translatable terms equal to en)', () => {
    // Spec scenario: "keys representing identifiers, codes, or non-translatable
    // terms are exempt only if also non-translatable in en" — i.e., the zh-TW
    // value is byte-equal to the en value (a proper name like "English").
    const enFlat = flatten(en as MessageNode)
    const zhFlat = flatten(zhTW as MessageNode)
    for (const [path, zhValue] of Object.entries(zhFlat)) {
      const enValue = enFlat[path]
      if (zhValue === enValue) continue
      expect(zhValue, `key path: ${path}`).toMatch(CJK_RE)
    }
  })
})
