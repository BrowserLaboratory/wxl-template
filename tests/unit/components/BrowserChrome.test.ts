import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import BrowserChrome from '../../../.vitepress/theme/components/BrowserChrome.vue'

describe('BrowserChrome', () => {
  const defaultProps = {
    modelValue: 'https://challenge-test.localhost/',
    disabled: false,
  }

  it('renders URL input with current value', () => {
    const wrapper = mount(BrowserChrome, { props: defaultProps })
    const input = wrapper.find('[data-url-input]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('https://challenge-test.localhost/')
  })

  it('renders Go button', () => {
    const wrapper = mount(BrowserChrome, { props: defaultProps })
    expect(wrapper.find('[data-go]').exists()).toBe(true)
  })

  it('emits navigate on Go click', async () => {
    const wrapper = mount(BrowserChrome, { props: defaultProps })
    await wrapper.find('[data-go]').trigger('click')
    expect(wrapper.emitted('navigate')).toHaveLength(1)
  })

  it('emits navigate on Enter key in URL input', async () => {
    const wrapper = mount(BrowserChrome, { props: defaultProps })
    await wrapper.find('[data-url-input]').trigger('keydown.enter')
    expect(wrapper.emitted('navigate')).toHaveLength(1)
  })

  it('emits update:modelValue when URL input changes', async () => {
    const wrapper = mount(BrowserChrome, { props: defaultProps })
    const input = wrapper.find('[data-url-input]')
    await input.setValue('https://new-url.localhost/')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['https://new-url.localhost/'])
  })

  it('renders navigation buttons (back, forward, reload) on desktop', () => {
    const wrapper = mount(BrowserChrome, { props: defaultProps })
    expect(wrapper.find('[data-nav-back]').exists()).toBe(true)
    expect(wrapper.find('[data-nav-forward]').exists()).toBe(true)
    expect(wrapper.find('[data-nav-reload]').exists()).toBe(true)
  })

  it('emits back, forward, reload events', async () => {
    const wrapper = mount(BrowserChrome, { props: defaultProps })
    await wrapper.find('[data-nav-back]').trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
    await wrapper.find('[data-nav-forward]').trigger('click')
    expect(wrapper.emitted('forward')).toHaveLength(1)
    await wrapper.find('[data-nav-reload]').trigger('click')
    expect(wrapper.emitted('navigate')).toHaveLength(1)
  })

  it('renders lock icon', () => {
    const wrapper = mount(BrowserChrome, { props: defaultProps })
    expect(wrapper.find('[data-lock-icon]').exists()).toBe(true)
  })

  it('disables Go button when disabled prop is true', () => {
    const wrapper = mount(BrowserChrome, { props: { ...defaultProps, disabled: true } })
    const go = wrapper.find('[data-go]')
    expect((go.element as HTMLButtonElement).disabled).toBe(true)
  })
})
