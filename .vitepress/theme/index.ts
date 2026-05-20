// https://vitepress.dev/guide/custom-theme

// vue-i18n's prebuilt ESM (loaded externally by VitePress SSR) references
// Vue build-time flags as bare globals. Define them on globalThis before any
// `app.use(i18n)` runs to prevent ReferenceError during `pnpm docs:build`.
// Unconditional assignment (not `??=`) — any prior value would be a hijack
// surface for re-enabling devtools in a production bundle.
;(globalThis as any).__VUE_PROD_DEVTOOLS__ = false
;(globalThis as any).__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false
;(globalThis as any).__VUE_OPTIONS_API__ = true
;(globalThis as any).__INTLIFY_PROD_DEVTOOLS__ = false

import { computed, defineComponent, h, onMounted, onUnmounted, watch } from 'vue'
import type { Theme } from 'vitepress'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createPinia } from 'pinia'
import 'virtual:uno.css'
import './style.css'
import ChallengeLayout from './layouts/ChallengeLayout.vue'
import SourceViewer from './components/SourceViewer.vue'
import ChallengeList from './components/ChallengeList.vue'
import HomeContent from './components/HomeContent.vue'
import LocaleSwitcher from './components/LocaleSwitcher.vue'
import { i18n, detectInitialLocale, detectLocaleFromPath, persistLocale } from './i18n'

/**
 * Locale-switcher selection flag.
 *
 * - `false` (default): use VitePress's built-in `VPNavBarTranslations`
 *   dropdown on default-theme pages. A route watcher in the Layout setup
 *   syncs `i18n.global.locale.value` and `localStorage` whenever the URL
 *   prefix changes.
 * - `true`: use the custom `LocaleSwitcher.vue` component, mounted into
 *   the `nav-bar-content-before` slot. The built-in dropdown is hidden
 *   via CSS scoped to `body.use-custom-locale-switcher`.
 *
 * Challenge pages always render the custom LocaleSwitcher through
 * MergedNav.vue regardless of this flag — it only governs the default
 * theme nav.
 *
 * Flip this and rebuild; no spec change is required (the i18n-runtime
 * spec covers both modes).
 */
const USE_CUSTOM_LOCALE_SWITCHER = false as boolean

export default {
  ...DefaultTheme,
  Layout: defineComponent({
    name: 'Layout',
    setup() {
      const { frontmatter } = useData()
      const isChallenge = computed(() => frontmatter.value.layout === 'challenge')

      // Route watcher — syncs vue-i18n's `locale.value` and `localStorage`
      // whenever the URL prefix crosses locale boundaries (SPA navigation,
      // browser back/forward, or built-in dropdown selection). Idempotent:
      // a no-op when the detected locale already matches. Reuses the
      // single-sourced `detectLocaleFromPath` rule (mirrors LocaleSwitcher
      // semantics) and `persistLocale` helper (SSR-safe).
      const route = useRoute()
      const stopRouteWatch = watch(
        () => route.path,
        (newPath) => {
          const target = detectLocaleFromPath(newPath)
          if (i18n.global.locale.value === target) return
          i18n.global.locale.value = target
          persistLocale(target)
        },
        // `flush: 'pre'` runs the watcher BEFORE child components update on
        // the same tick, so any component using `t()` re-renders with the
        // already-synchronised locale rather than the stale one. Vue 3's
        // default is `'pre'`, but we set it explicitly so the contract is
        // audit-proof and survives future Vue defaults changing.
        { flush: 'pre' },
      )

      onMounted(() => {
        // Challenge-specific global styles
        document.body.classList.toggle('challenge-page', isChallenge.value)
        // Custom-switcher CSS scope — when true, scopes the CSS hide rule
        // for `.VPNavBarTranslations` so the built-in dropdown disappears.
        if (USE_CUSTOM_LOCALE_SWITCHER) {
          document.body.classList.add('use-custom-locale-switcher')
        }
      })
      onUnmounted(() => {
        document.body.classList.remove('challenge-page')
        document.body.classList.remove('use-custom-locale-switcher')
        stopRouteWatch()
      })

      return () => {
        if (isChallenge.value) return h(ChallengeLayout)
        // Default-theme nav: when the flag is true, inject the custom
        // LocaleSwitcher into the `nav-bar-content-before` slot. When
        // false, render no slot — VitePress's built-in dropdown takes
        // over and the route watcher above keeps vue-i18n in sync.
        if (USE_CUSTOM_LOCALE_SWITCHER) {
          return h(DefaultTheme.Layout, null, {
            'nav-bar-content-before': () => h(LocaleSwitcher),
          })
        }
        return h(DefaultTheme.Layout)
      }
    },
  }),
  enhanceApp({ app }: { app: any }) {
    // Call DefaultTheme's enhanceApp first
    DefaultTheme.enhanceApp?.({ app })

    // Pinia — installed once at app level; pyodide and php-wasm are lazy-loaded
    // per-challenge page to avoid loading heavy WASM on every page
    app.use(createPinia())

    app.use(i18n)

    // Client-only init: detect the locale from localStorage / URL prefix and
    // persist the resolved value. Guarded so VitePress SSR rendering (which
    // has no `window`) keeps the createI18n default ('en').
    if (typeof window !== 'undefined') {
      const detected = detectInitialLocale()
      i18n.global.locale.value = detected
      persistLocale(detected)
    }

    // SourceViewer is used in challenge pages via markdown
    app.component('SourceViewer', SourceViewer)

    // ChallengeList is used in docs/challenges/index.md via <ChallengeList />
    app.component('ChallengeList', ChallengeList)

    // HomeContent is used in docs/index.md via <HomeContent />
    app.component('HomeContent', HomeContent)

    // Register Service Worker (challenge router)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}challenge-sw.js`).catch((err: Error) => {
        console.warn('[challenge-sw] registration failed:', err)
      })
    }
  },
} satisfies Theme
