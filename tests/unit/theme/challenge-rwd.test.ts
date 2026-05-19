import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const mergedNavVue = readFileSync(
  resolve(__dirname, '../../../.vitepress/theme/components/MergedNav.vue'),
  'utf-8',
)

const challengeLayoutVue = readFileSync(
  resolve(__dirname, '../../../.vitepress/theme/layouts/ChallengeLayout.vue'),
  'utf-8',
)

describe('RWD - Desktop (≥1024px)', () => {
  it('MergedNav shows full "← Challenges" text on lg breakpoint', () => {
    expect(mergedNavVue).toContain('lg:inline')
    expect(mergedNavVue).toContain('← Challenges')
  })

  it('MergedNav shows "Notes" text on lg breakpoint', () => {
    expect(mergedNavVue).toMatch(/lg:inline[\s\S]*?Notes/)
  })

  it('ChallengeLayout uses two-column flex layout', () => {
    expect(challengeLayoutVue).toContain('description-column')
    expect(challengeLayoutVue).toContain('flex-1')
  })
})

describe('RWD - Tablet (768–1023px)', () => {
  it('MergedNav back link shows icon-only below lg', () => {
    expect(mergedNavVue).toContain('lg:hidden')
  })

  it('MergedNav Notes button shows icon-only below lg', () => {
    // "Notes" text is hidden below lg breakpoint
    expect(mergedNavVue).toMatch(/hidden\s+lg:inline/)
  })
})

describe('RWD - Mobile (<768px)', () => {
  it('MergedNav has mobile-specific layout classes', () => {
    // Should have md: breakpoint responsive classes
    expect(mergedNavVue).toContain('md:')
  })

  it('ChallengeLayout tab nav supports horizontal scrolling on mobile', () => {
    expect(challengeLayoutVue).toMatch(/overflow-x-auto|overflow-auto/)
  })
})
