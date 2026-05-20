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

import { computed, defineComponent, h, onMounted, onUnmounted } from 'vue'
import type { Theme } from 'vitepress'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createPinia } from 'pinia'
import 'virtual:uno.css'
import './style.css'
import ChallengeLayout from './layouts/ChallengeLayout.vue'
import SourceViewer from './components/SourceViewer.vue'
import ChallengeList from './components/ChallengeList.vue'
import HomeContent from './components/HomeContent.vue'
import LocaleSwitcher from './components/LocaleSwitcher.vue'
import { i18n, detectInitialLocale, persistLocale } from './i18n'

export default {
  ...DefaultTheme,
  Layout: defineComponent({
    name: 'Layout',
    setup() {
      const { frontmatter } = useData()
      const isChallenge = computed(() => frontmatter.value.layout === 'challenge')

      // Toggle body class for challenge-specific global styles
      onMounted(() => {
        document.body.classList.toggle('challenge-page', isChallenge.value)
      })
      onUnmounted(() => {
        document.body.classList.remove('challenge-page')
      })

      return () => {
        if (isChallenge.value) return h(ChallengeLayout)
        return h(DefaultTheme.Layout, null, {
          // Custom LocaleSwitcher syncs the vue-i18n `locale.value` (which the
          // built-in VitePress translation dropdown does NOT do). Place it in
          // the nav before built-in content (theme toggle, divider, GitHub) so
          // it groups visually with the nav rather than dangling past the
          // GitHub icon. The built-in `VPNavBarTranslations` dropdown is
          // hidden via CSS in style.css to avoid two switchers competing.
          'nav-bar-content-before': () => h(LocaleSwitcher),
        })
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
