import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vitepress', () => ({
  withBase: vi.fn((path: string) => path),
}))

const mockChallenges = [
  { id: 1, title: 'SQL Injection Demo', url: '/challenge/sqli-demo', difficulty: 'easy', category: 'web' },
  { id: 2, title: 'PHP File Inclusion Demo', url: '/challenge/php-demo', difficulty: 'easy', category: 'web' },
  { id: 3, title: 'Hard Challenge', url: '/challenge/hard', difficulty: 'hard', category: 'web' },
]

let ChallengeList: typeof import('../../../.vitepress/theme/components/ChallengeList.vue').default

beforeEach(async () => {
  const mod = await import('../../../.vitepress/theme/components/ChallengeList.vue')
  ChallengeList = mod.default
})

describe('ChallengeList', () => {
  it('renders a card for each challenge', async () => {
    const wrapper = mount(ChallengeList, { props: { challenges: mockChallenges } })
    // Switch to grid view (default is now list)
    await wrapper.find('button[title="格線模式"]').trigger('click')
    const cards = wrapper.findAll('[data-challenge-card]')
    expect(cards).toHaveLength(3)
  })

  it('renders challenge title in each card', () => {
    const wrapper = mount(ChallengeList, { props: { challenges: mockChallenges } })
    expect(wrapper.text()).toContain('SQL Injection Demo')
    expect(wrapper.text()).toContain('PHP File Inclusion Demo')
  })

  it('renders difficulty and category badges', () => {
    const wrapper = mount(ChallengeList, { props: { challenges: mockChallenges } })
    expect(wrapper.text()).toContain('easy')
    expect(wrapper.text()).toContain('web')
  })

  it('each card contains a link to the challenge page', async () => {
    const wrapper = mount(ChallengeList, { props: { challenges: mockChallenges } })
    // Switch to grid view (default is now list)
    await wrapper.find('button[title="格線模式"]').trigger('click')
    const links = wrapper.findAll('a[data-challenge-link]')
    expect(links).toHaveLength(3)
    const hrefs = links.map((l) => l.attributes('href'))
    expect(hrefs.some((h) => h?.includes('sqli-demo'))).toBe(true)
    expect(hrefs.some((h) => h?.includes('php-demo'))).toBe(true)
  })

  it('renders zero-padded id number for each card', () => {
    const wrapper = mount(ChallengeList, { props: { challenges: mockChallenges } })
    expect(wrapper.text()).toContain('#001')
    expect(wrapper.text()).toContain('#002')
    expect(wrapper.text()).toContain('#003')
  })

  it('applies semantic difficulty badge class for hard difficulty', () => {
    const wrapper = mount(ChallengeList, { props: { challenges: mockChallenges } })
    const hardBadge = wrapper.findAll('.ch-badge-hard')
    expect(hardBadge.length).toBeGreaterThan(0)
  })
})
