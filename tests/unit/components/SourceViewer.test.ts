import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SourceViewer from '../../../.vitepress/theme/components/SourceViewer.vue'

const PYTHON_SOURCE = 'from flask import Flask\napp = Flask(__name__)'

describe('SourceViewer — white-box/black-box mode', () => {
  it('renders syntax-highlighted source when source_visible is true', () => {
    const wrapper = mount(SourceViewer, {
      props: { sourceCode: PYTHON_SOURCE, visible: true },
    })

    const viewer = wrapper.find('[data-source-viewer]')
    expect(viewer.exists()).toBe(true)
    expect(viewer.text()).toContain('Flask')
  })

  it('does NOT render source viewer when source_visible is false', () => {
    const wrapper = mount(SourceViewer, {
      props: { sourceCode: PYTHON_SOURCE, visible: false },
    })

    expect(wrapper.find('[data-source-viewer]').exists()).toBe(false)
    // No readable source in DOM
    expect(wrapper.html()).not.toContain('Flask')
  })

  it('does NOT render source viewer when visible is omitted (default black-box)', () => {
    const wrapper = mount(SourceViewer, {
      props: { sourceCode: PYTHON_SOURCE },
    })

    expect(wrapper.find('[data-source-viewer]').exists()).toBe(false)
  })
})
