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
  },

  title: "Web eXploitation Laboratory",
  description: "完全基於前端 WASM 的挑戰平台",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Challenges', link: '/challenges/' },
      { text: 'Docs', link: '/guide/' },
    ],

    sidebar: {
      '/guide/': [
        { text: '快速開始', link: '/guide/' },
        { text: 'Python 程式碼指南', link: '/guide/python' },
        { text: 'Terminal 使用指南', link: '/guide/terminal' },
        { text: 'Network & Repeater', link: '/guide/network' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/CXPhoenix/wxl' }
    ]
  },

  transformPageData(pageData, ctx) {
    if (pageData.frontmatter.layout !== 'challenge') return
    const filePath = resolve(ctx.siteConfig.srcDir, pageData.relativePath)
    const raw = readFileSync(filePath, 'utf-8')
    pageData.frontmatter.markdownBody = extractMarkdownBody(raw)
  },
})
