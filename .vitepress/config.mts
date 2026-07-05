import { defineConfig } from 'vitepress'
import UnoCSS from 'unocss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractMarkdownBody } from './challenge/plugin'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",
  vite: {
    plugins: [UnoCSS(), wasm(), topLevelAwait()],
    optimizeDeps: {
      exclude: ['php-wasm'],
    },
    build: {
      // Required: vite-plugin-top-level-await emits a destructuring pattern that
      // esbuild cannot lower to the default browserslist target. Do NOT relax
      // this without first upgrading vite-plugin-top-level-await OR removing
      // TLA usage OR confirming the esbuild transformer now supports it.
      // See AUDIT.md A.2.2 for the full rationale and the forbidden-revert rules.
      target: 'esnext',
    },
    define: {
      // vue-i18n reads these Vue build flags at runtime; not defining them
      // causes "ReferenceError: __VUE_PROD_DEVTOOLS__ is not defined" during SSR.
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      __VUE_OPTIONS_API__: 'true',
      __INTLIFY_PROD_DEVTOOLS__: 'false',
    },
  },

  title: "Web eXploitation Laboratory",
  description: "Browser-based web exploitation challenge platform powered by WASM",
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Challenges', link: '/challenges/' },
          { text: 'Docs', link: '/guide/' },
        ],
        sidebar: {
          '/guide/': [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Python Code Guide', link: '/guide/python' },
            { text: 'Terminal Usage Guide', link: '/guide/terminal' },
            { text: 'Network & Repeater', link: '/guide/network' },
          ],
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/BrowserLaboratory/wxl-template' }
        ],
      },
    },
    'zh-TW': {
      label: '繁體中文',
      lang: 'zh-TW',
      link: '/zh-TW/',
      themeConfig: {
        nav: [
          { text: '首頁', link: '/zh-TW/' },
          { text: '挑戰', link: '/zh-TW/challenges/' },
          { text: '指南', link: '/zh-TW/guide/' },
        ],
        sidebar: {
          '/zh-TW/guide/': [
            { text: '快速開始', link: '/zh-TW/guide/' },
            { text: 'Python 程式碼指南', link: '/zh-TW/guide/python' },
            { text: 'Terminal 使用指南', link: '/zh-TW/guide/terminal' },
            { text: 'Network & Repeater', link: '/zh-TW/guide/network' },
          ],
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/BrowserLaboratory/wxl-template' }
        ],
      },
    },
  },

  transformPageData(pageData, ctx) {
    if (pageData.frontmatter.layout !== 'challenge') return
    const filePath = resolve(ctx.siteConfig.srcDir, pageData.relativePath)
    const raw = readFileSync(filePath, 'utf-8')
    pageData.frontmatter.markdownBody = extractMarkdownBody(raw)
  },
})
