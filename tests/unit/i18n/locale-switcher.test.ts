import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '../../../.vitepress/theme/i18n/messages/en.json'
import zhTW from '../../../.vitepress/theme/i18n/messages/zh-TW.json'

const mockGo = vi.fn()
vi.mock('vitepress', () => ({
  useRouter: () => ({ go: mockGo, route: { path: '/' } }),
}))

import LocaleSwitcher from '../../../.vitepress/theme/components/LocaleSwitcher.vue'
import {
  detectInitialLocale,
  persistLocale,
  LOCALE_STORAGE_KEY,
} from '../../../.vitepress/theme/i18n'

function makeI18n(locale: 'en' | 'zh-TW' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    globalInjection: true,
    messages: { en, 'zh-TW': zhTW },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function setPathname(p: string) {
  window.history.pushState({}, '', p)
}

beforeEach(() => {
  mockGo.mockReset()
  window.localStorage.clear()
  setPathname('/')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LocaleSwitcher UI', () => {
  it('renders both locale options when opened', async () => {
    const i18n = makeI18n('en')
    const wrapper = mount(LocaleSwitcher, { global: { plugins: [i18n] } })
    await wrapper.find('[data-locale-switcher-toggle]').trigger('click')
    const items = wrapper.findAll('[role="option"]')
    expect(items.length).toBe(2)
    expect(items[0].text()).toBe('English')
    expect(items[1].text()).toBe('Traditional Chinese')
  })

  it('switching EN → zh-TW from /challenges/door-is-open/ navigates with /zh-TW prefix, persists, and updates locale', async () => {
    setPathname('/challenges/door-is-open/')
    const i18n = makeI18n('en')
    const wrapper = mount(LocaleSwitcher, { global: { plugins: [i18n] } })
    await wrapper.find('[data-locale-switcher-toggle]').trigger('click')
    await wrapper.find('[data-locale-option="zh-TW"]').trigger('click')
    expect(i18n.global.locale.value).toBe('zh-TW')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('zh-TW')
    expect(mockGo).toHaveBeenCalledWith('/zh-TW/challenges/door-is-open/')
  })

  it('switching zh-TW → EN from /zh-TW/guide/ navigates without /zh-TW prefix', async () => {
    setPathname('/zh-TW/guide/')
    const i18n = makeI18n('zh-TW')
    const wrapper = mount(LocaleSwitcher, { global: { plugins: [i18n] } })
    await wrapper.find('[data-locale-switcher-toggle]').trigger('click')
    await wrapper.find('[data-locale-option="en"]').trigger('click')
    expect(i18n.global.locale.value).toBe('en')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    expect(mockGo).toHaveBeenCalledWith('/guide/')
  })

  it('switching from / to zh-TW yields /zh-TW/', async () => {
    setPathname('/')
    const i18n = makeI18n('en')
    const wrapper = mount(LocaleSwitcher, { global: { plugins: [i18n] } })
    await wrapper.find('[data-locale-switcher-toggle]').trigger('click')
    await wrapper.find('[data-locale-option="zh-TW"]').trigger('click')
    expect(mockGo).toHaveBeenCalledWith('/zh-TW/')
  })

  it('selecting the current locale is a no-op (no router navigation, no localStorage write)', async () => {
    setPathname('/')
    const i18n = makeI18n('en')
    const wrapper = mount(LocaleSwitcher, { global: { plugins: [i18n] } })
    await wrapper.find('[data-locale-switcher-toggle]').trigger('click')
    await wrapper.find('[data-locale-option="en"]').trigger('click')
    expect(mockGo).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull()
  })
})

describe('detectInitialLocale precedence matrix (spec.md table)', () => {
  const cases: Array<{
    label: string
    ls: string | null
    path: string
    expected: 'en' | 'zh-TW'
  }> = [
    { label: "ls='en' / URL='/'             → en",       ls: 'en',      path: '/',              expected: 'en' },
    { label: "ls='zh-TW' / URL='/'          → zh-TW",    ls: 'zh-TW',   path: '/',              expected: 'zh-TW' },
    { label: "ls absent / URL='/zh-TW/guide/' → zh-TW",  ls: null,      path: '/zh-TW/guide/',  expected: 'zh-TW' },
    { label: "ls absent / URL='/'           → en",       ls: null,      path: '/',              expected: 'en' },
    { label: "ls='en' / URL='/zh-TW/'       → zh-TW (URL wins)", ls: 'en', path: '/zh-TW/',      expected: 'zh-TW' },
    { label: "ls='zh-TW' / URL='/'          → zh-TW",    ls: 'zh-TW',   path: '/',              expected: 'zh-TW' },
    { label: "ls='invalid' / URL='/'        → en (fall through)", ls: 'invalid', path: '/',     expected: 'en' },
  ]
  for (const tc of cases) {
    it(tc.label, () => {
      setPathname(tc.path)
      window.localStorage.clear()
      if (tc.ls !== null) window.localStorage.setItem(LOCALE_STORAGE_KEY, tc.ls)
      expect(detectInitialLocale()).toBe(tc.expected)
    })
  }
})

describe('localStorage SecurityError fallback', () => {
  it('detectInitialLocale falls back to URL-based detection when getItem throws', () => {
    setPathname('/zh-TW/challenges/')
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => detectInitialLocale()).not.toThrow()
    expect(detectInitialLocale()).toBe('zh-TW')
  })

  it('persistLocale swallows setItem SecurityError without throwing', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => persistLocale('zh-TW')).not.toThrow()
  })
})
