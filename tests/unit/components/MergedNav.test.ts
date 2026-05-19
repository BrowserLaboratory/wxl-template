import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock vitepress useData
const mockIsDark = { value: false }
vi.mock('vitepress', () => ({
  useData: vi.fn(() => ({
    isDark: mockIsDark,
    site: {
      value: {
        themeConfig: {
          socialLinks: [
            { icon: 'github', link: 'https://github.com/example/repo' },
          ],
        },
      },
    },
  })),
}))

import MergedNav from '../../../.vitepress/theme/components/MergedNav.vue'

const defaultProps = {
  title: 'SQL Injection Demo',
  difficulty: 'easy',
  category: 'web',
  runtimeReady: false,
  runtimeError: null as string | null,
  noteCount: 0,
  descriptionCollapsed: false,
}

describe('MergedNav', () => {
  it('renders WXL brand text', () => {
    const wrapper = mount(MergedNav, { props: defaultProps })
    expect(wrapper.text()).toContain('WXL')
  })

  it('renders back link to /challenges/', () => {
    const wrapper = mount(MergedNav, { props: defaultProps })
    const backLink = wrapper.find('a[href="/challenges/"]')
    expect(backLink.exists()).toBe(true)
  })

  it('renders challenge title', () => {
    const wrapper = mount(MergedNav, { props: defaultProps })
    expect(wrapper.text()).toContain('SQL Injection Demo')
  })

  it('renders difficulty badge', () => {
    const wrapper = mount(MergedNav, { props: defaultProps })
    const badge = wrapper.find('[data-badge="difficulty"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('easy')
  })

  it('renders category badge', () => {
    const wrapper = mount(MergedNav, { props: defaultProps })
    const badge = wrapper.find('[data-badge="category"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('web')
  })

  it('shows runtime loading indicator when not ready', () => {
    const wrapper = mount(MergedNav, { props: { ...defaultProps, runtimeReady: false, runtimeError: null } })
    const status = wrapper.find('[data-runtime-status]')
    expect(status.exists()).toBe(true)
  })

  it('shows green dot when runtime is ready', () => {
    const wrapper = mount(MergedNav, { props: { ...defaultProps, runtimeReady: true } })
    const status = wrapper.find('[data-runtime-status="ready"]')
    expect(status.exists()).toBe(true)
  })

  it('shows error indicator when runtime has error', () => {
    const wrapper = mount(MergedNav, { props: { ...defaultProps, runtimeError: 'WASM failed' } })
    const status = wrapper.find('[data-runtime-status="error"]')
    expect(status.exists()).toBe(true)
  })

  it('renders notes button and emits open-notes on click', async () => {
    const wrapper = mount(MergedNav, { props: { ...defaultProps, noteCount: 3 } })
    const notesBtn = wrapper.find('[data-notes-btn]')
    expect(notesBtn.exists()).toBe(true)
    await notesBtn.trigger('click')
    expect(wrapper.emitted('open-notes')).toHaveLength(1)
  })

  it('renders dark mode toggle and toggles isDark on click', async () => {
    mockIsDark.value = false
    const wrapper = mount(MergedNav, { props: defaultProps })
    const toggle = wrapper.find('[data-darkmode-toggle]')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    expect(mockIsDark.value).toBe(true)
  })

  it('renders GitHub link from site config', () => {
    const wrapper = mount(MergedNav, { props: defaultProps })
    const ghLink = wrapper.find('a[href="https://github.com/example/repo"]')
    expect(ghLink.exists()).toBe(true)
  })

  it('shows description toggle button when description is collapsed', () => {
    const wrapper = mount(MergedNav, { props: { ...defaultProps, descriptionCollapsed: true } })
    const descBtn = wrapper.find('[data-desc-toggle]')
    expect(descBtn.exists()).toBe(true)
  })

  it('emits toggle-description when description button is clicked', async () => {
    const wrapper = mount(MergedNav, { props: { ...defaultProps, descriptionCollapsed: true } })
    const descBtn = wrapper.find('[data-desc-toggle]')
    await descBtn.trigger('click')
    expect(wrapper.emitted('toggle-description')).toHaveLength(1)
  })

  it('does not show description toggle button when description is expanded', () => {
    const wrapper = mount(MergedNav, { props: { ...defaultProps, descriptionCollapsed: false } })
    const descBtn = wrapper.find('[data-desc-toggle]')
    expect(descBtn.exists()).toBe(false)
  })
})
