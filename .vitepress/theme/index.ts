// https://vitepress.dev/guide/custom-theme
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
