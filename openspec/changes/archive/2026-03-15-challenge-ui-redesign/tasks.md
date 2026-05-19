## 1. Token 架構（CSS Variables 作為 Design Token 單一來源）

- [x] 1.1 重寫 `.vitepress/theme/style.css`：定義 `--ch-*` CSS custom properties，`:root` 為 light（Enterprise Indigo），`.dark` 為 dark（Midnight Indigo），並套用 VitePress `--vp-c-brand-*` 覆寫策略：覆寫 `--vp-c-brand-*` 指向對應的 `--ch-accent-*` token
- [x] 1.2 新增 `uno.config.ts`：設定 `theme.colors` 指向 `var(--ch-*)` CSS vars，加入 UnoCSS 整合 VitePress 的 vite plugin，`content.filesystem` 包含 `**/*.{vue,md,ts}`
- [x] 1.3 更新 `.vitepress/config.mts`：加入 UnoCSS vite plugin
- [x] 1.4 在 `uno.config.ts` 定義 shortcuts：`ch-card`、`ch-tab-btn`、`ch-tab-btn-active`、`ch-badge-easy`（green tones）、`ch-badge-medium`（yellow/amber tones）、`ch-badge-hard`（red tones）、`ch-badge-mystery`（purple tones）、`ch-badge-web`（blue tones）——符合 UnoCSS config references CSS vars for color tokens 規範，確認 UnoCSS color utilities resolve via CSS vars，符合 platform defines a CSS custom property token system as single source of truth 規範

## 2. Markdown 渲染修正（ChallengeLayout .vp-doc wrapper）

- [x] 2.1 修改 `ChallengeLayout.vue`：依 markdown 渲染修正：`.vp-doc` wrapper 策略，在 `<Content />` 外層加上 `<div class="vp-doc description-content">`，移除原本獨立的 `.description-content` div；同時套用 UnoCSS 整合方式：shortcuts + CSS vars 至 description-column 樣式——確認 vp-doc wrapper is present in the DOM，符合 description panel renders markdown via Content component and is collapsible 規範

## 3. ChallengeLayout UnoCSS 遷移

- [x] 3.1 將 `ChallengeLayout.vue` 的 `<style scoped>` 全面替換為 UnoCSS utility classes，保留必要的 CSS transition rules（`width`、`min-width` 動畫）於最小化 scoped block——確認 challenge UI components use UnoCSS utility classes for styling 規範
- [x] 3.2 套用 Midnight Indigo dark / Enterprise Indigo light 配色到 ChallengeLayout header、body、左欄、右欄——符合 challenge UI applies the platform color palette 規範

## 4. 互動元件 UnoCSS 遷移

- [x] 4.1 將 `BrowserPanel.vue` 的 `<style scoped>` 替換為 UnoCSS utilities，套用 `--ch-*` token 配色
- [x] 4.2 將 `TerminalPanel.vue` 的 `<style scoped>` 替換為 UnoCSS utilities，套用 `--ch-*` token 配色
- [x] 4.3 將 `RepeatPanel.vue` 的 `<style scoped>` 替換為 UnoCSS utilities，套用 `--ch-*` token 配色
- [x] 4.4 將 `FlagSubmit.vue` 的 `<style scoped>` 替換為 UnoCSS utilities，套用 `--ch-*` token 配色——確認 dark mode applies via CSS var change, not class toggle 規範

## 5. ChallengeList 重設計

- [x] 5.1 更新 `ChallengeList.vue`：卡片新增 `#id` 零補位三位數顯示（`#001`），套用 ch-card shortcut，hover 時顯示頂端 accent line（`--ch-accent` 色）——確認 challenge list displays each challenge as a card with metadata and a link 規範
- [x] 5.2 替換 ChallengeList 的 badge 樣式：difficulty 改用語意配色 shortcuts（`ch-badge-easy`、`ch-badge-medium`、`ch-badge-hard`、`ch-badge-mystery`），category 改用 `ch-badge-web` 等——確認 difficulty badge uses semantic color coding 規範
- [x] 5.3 將 `ChallengeList.vue` 的 `<style scoped>` 替換為 UnoCSS utilities

## 6. 視覺驗證

- [x] 6.1 執行 `pnpm docs:dev`，開啟 challenge list 頁面，驗證 dark/light mode 切換、卡片 hover、badge 配色正確
- [x] 6.2 開啟任一 challenge 頁面，驗證左側 markdown 說明欄正確渲染（heading、code、blockquote 有樣式），flag submit bar 固定底部
- [x] 6.3 確認 Browser/Terminal/Repeater panel 配色與 ChallengeLayout 一致

