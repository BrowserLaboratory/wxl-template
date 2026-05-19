import { createI18n } from 'vue-i18n'
import en from './messages/en.json'
import zhTW from './messages/zh-TW.json'

export type Locale = 'en' | 'zh-TW'

export const LOCALE_STORAGE_KEY = 'wxl-locale'
export const KNOWN_LOCALES: readonly Locale[] = ['en', 'zh-TW'] as const

export function isKnownLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'zh-TW'
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  globalInjection: true,
  // Stage 1 ships with empty message catalogues; Stage 2 populates them.
  // Suppress the per-key "Not found" warnings so the dev console isn't flooded
  // until messages land. Re-enable if you need to debug missing keys.
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en,
    'zh-TW': zhTW,
  },
})

export default i18n

// NOTE: `detectInitialLocale()` is exported here but is only wired into
// `enhanceApp` in Task 7.1 (Stage 7). Until then, the i18n instance starts
// fixed at `'en'` and locale state changes only when LocaleSwitcher runs.
export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'

  const { pathname } = window.location
  const urlIsZhTW = pathname === '/zh-TW' || pathname.startsWith('/zh-TW/')

  let stored: Locale | null = null
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isKnownLocale(raw)) stored = raw
  } catch {
    // localStorage unavailable (private mode, SecurityError); fall through
  }

  // URL `/zh-TW/...` prefix is an explicit request and overrides stored 'en'
  if (urlIsZhTW) return 'zh-TW'

  if (stored) return stored

  return 'en'
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // localStorage unavailable; silently ignore
  }
}
