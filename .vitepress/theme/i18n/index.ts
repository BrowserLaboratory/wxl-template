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

/**
 * Pure-function locale detection from a URL pathname string. The rule:
 * a pathname equal to `/zh-TW`, equal to `/zh-TW/`, or starting with
 * `/zh-TW/` resolves to `'zh-TW'`; everything else resolves to `'en'`.
 *
 * Pathological inputs such as `/zh-TWfoo` (a hypothetical non-locale path
 * that happens to begin with the literal characters `zh-TW` but has no
 * separating slash) MUST resolve to `'en'` — the prefix rule requires the
 * locale segment to be terminated by `/` or end-of-string.
 *
 * **Silent fallback to `'en'` is intentional.** Any unrecognised pathname
 * (typo like `/zh-tw` lowercase, future-but-unconfigured locale prefix,
 * deep link to a deleted page) resolves to `'en'` without warning. This
 * matches VitePress's own `locales` routing semantics (the `root` locale
 * catches everything not in another configured prefix). If a third locale
 * is ever added, this function MUST be updated to dispatch on an explicit
 * list — the current binary fallback rule will silently misclassify the
 * new locale as `'en'` otherwise.
 *
 * SSR-safe: takes a plain string, touches no globals. Reused by both
 * `detectInitialLocale()` (for cold loads) and the Layout's route watcher
 * (for SPA navigation), keeping the rule single-sourced.
 */
export function detectLocaleFromPath(path: string): Locale {
  if (path === '/zh-TW' || path === '/zh-TW/' || path.startsWith('/zh-TW/')) {
    return 'zh-TW'
  }
  return 'en'
}

export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'

  const urlLocale = detectLocaleFromPath(window.location.pathname)

  let stored: Locale | null = null
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isKnownLocale(raw)) stored = raw
  } catch {
    // localStorage unavailable (private mode, SecurityError); fall through
  }

  // URL `/zh-TW/...` prefix is an explicit request and overrides stored 'en'
  if (urlLocale === 'zh-TW') return 'zh-TW'

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
