import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FlagSubmit from '../../../.vitepress/theme/components/FlagSubmit.vue'

const CORRECT_FLAG = 'CTF{test_flag}'

describe('FlagSubmit', () => {
  it('shows success indicator when correct flag is submitted', async () => {
    const verify = vi.fn().mockResolvedValue(true)
    const wrapper = mount(FlagSubmit, { props: { verify } })

    await wrapper.find('[data-flag-input]').setValue(CORRECT_FLAG)
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(verify).toHaveBeenCalledWith(CORRECT_FLAG)
    expect(wrapper.find('[data-success]').exists()).toBe(true)
    expect(wrapper.find('[data-failure]').exists()).toBe(false)
  })

  it('shows export button on success when onExport is provided', async () => {
    const verify = vi.fn().mockResolvedValue(true)
    const onExport = vi.fn()
    const wrapper = mount(FlagSubmit, { props: { verify, onExport } })

    await wrapper.find('[data-flag-input]').setValue(CORRECT_FLAG)
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const exportBtn = wrapper.find('[data-export]')
    expect(exportBtn.exists()).toBe(true)
    expect(exportBtn.text()).toContain('下載攻擊紀錄')
  })

  it('clicking export button calls onExport', async () => {
    const verify = vi.fn().mockResolvedValue(true)
    const onExport = vi.fn()
    const wrapper = mount(FlagSubmit, { props: { verify, onExport } })

    await wrapper.find('[data-flag-input]').setValue(CORRECT_FLAG)
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-export]').trigger('click')
    expect(onExport).toHaveBeenCalledOnce()
  })

  it('does not show export button on failure', async () => {
    const verify = vi.fn().mockResolvedValue(false)
    const onExport = vi.fn()
    const wrapper = mount(FlagSubmit, { props: { verify, onExport } })

    await wrapper.find('[data-flag-input]').setValue('CTF{wrong}')
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-export]').exists()).toBe(false)
  })

  it('does not show export button when onExport is not provided', async () => {
    const verify = vi.fn().mockResolvedValue(true)
    const wrapper = mount(FlagSubmit, { props: { verify } })

    await wrapper.find('[data-flag-input]').setValue(CORRECT_FLAG)
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-export]').exists()).toBe(false)
  })

  it('shows export notes button on success when onExportNotes is provided', async () => {
    const verify = vi.fn().mockResolvedValue(true)
    const onExportNotes = vi.fn()
    const wrapper = mount(FlagSubmit, { props: { verify, onExportNotes } })

    await wrapper.find('[data-flag-input]').setValue(CORRECT_FLAG)
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const exportNotesBtn = wrapper.find('[data-export-notes]')
    expect(exportNotesBtn.exists()).toBe(true)
    expect(exportNotesBtn.text()).toContain('下載滲透筆記')
  })

  it('clicking export notes button calls onExportNotes', async () => {
    const verify = vi.fn().mockResolvedValue(true)
    const onExportNotes = vi.fn()
    const wrapper = mount(FlagSubmit, { props: { verify, onExportNotes } })

    await wrapper.find('[data-flag-input]').setValue(CORRECT_FLAG)
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-export-notes]').trigger('click')
    expect(onExportNotes).toHaveBeenCalledOnce()
  })

  it('does not show export notes button when onExportNotes is not provided', async () => {
    const verify = vi.fn().mockResolvedValue(true)
    const wrapper = mount(FlagSubmit, { props: { verify } })

    await wrapper.find('[data-flag-input]').setValue(CORRECT_FLAG)
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-export-notes]').exists()).toBe(false)
  })

  it('does not show export notes button on failure', async () => {
    const verify = vi.fn().mockResolvedValue(false)
    const onExportNotes = vi.fn()
    const wrapper = mount(FlagSubmit, { props: { verify, onExportNotes } })

    await wrapper.find('[data-flag-input]').setValue('CTF{wrong}')
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-export-notes]').exists()).toBe(false)
  })

  it('shows failure indicator and no hint when wrong flag submitted', async () => {
    const verify = vi.fn().mockResolvedValue(false)
    const wrapper = mount(FlagSubmit, { props: { verify } })

    await wrapper.find('[data-flag-input]').setValue('CTF{wrong}')
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-failure]').exists()).toBe(true)
    expect(wrapper.find('[data-success]').exists()).toBe(false)
    // Response must not leak the correct flag
    expect(wrapper.html()).not.toContain(CORRECT_FLAG)
  })
})
