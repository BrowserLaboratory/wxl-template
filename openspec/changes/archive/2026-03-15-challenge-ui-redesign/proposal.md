## Why

目前平台的視覺風格沿用 VitePress 預設配色，缺乏資安課程應有的「駭客/藍隊」專業感；且 `ChallengeLayout` 左側說明欄未正確套用 VitePress markdown typography，導致說明內容以純文字呈現。本次重設計以 UnoCSS 建立共享 design token 系統，並同步修正 markdown 渲染問題。

## What Changes

- 新增 `uno.config.ts`，建立 CSS Variables + UnoCSS shortcuts 共享 token 架構
- 新增完整 dark/light mode 雙主題配色（Dark: Midnight Indigo、Light: Enterprise Indigo）
- 重寫 `style.css`，以 CSS custom properties 定義設計 token，VitePress `--vp-c-brand-*` 覆寫指向新配色
- `ChallengeLayout.vue`：scoped CSS 遷移至 UnoCSS utilities；在 `<Content />` 外層加 `.vp-doc` wrapper 修正 markdown 渲染
- `BrowserPanel`、`TerminalPanel`、`RepeatPanel`、`FlagSubmit` 的 scoped CSS 遷移至 UnoCSS
- `ChallengeList.vue`：重設計卡片外觀，難度 badge 採語意配色（easy=綠、medium=黃、hard=紅、mystery=紫）
- `.vitepress/config.mts` 加入 UnoCSS vite plugin

## Capabilities

### New Capabilities

- `challenge-design-tokens`: 以 CSS custom properties 為單一來源，定義平台所有 dark/light mode 設計 token，UnoCSS config 指向同一組 vars

### Modified Capabilities

- `challenge-layout`: 左側說明欄新增 `.vp-doc` wrapper 需求，確保 VitePress markdown typography 正確渲染
- `challenge-ui`: 所有互動元件（Browser/Terminal/Repeater panels、FlagSubmit）改用 UnoCSS utility classes
- `challenge-list`: 卡片設計新增難度語意配色與 `#id` 編號顯示需求

## Impact

- Affected specs: `challenge-design-tokens` (new), `challenge-layout`, `challenge-ui`, `challenge-list`
- Affected code:
  - `.vitepress/theme/style.css`
  - `.vitepress/config.mts`
  - `uno.config.ts` (new)
  - `.vitepress/theme/layouts/ChallengeLayout.vue`
  - `.vitepress/theme/components/BrowserPanel.vue`
  - `.vitepress/theme/components/TerminalPanel.vue`
  - `.vitepress/theme/components/RepeatPanel.vue`
  - `.vitepress/theme/components/FlagSubmit.vue`
  - `.vitepress/theme/components/ChallengeList.vue`
