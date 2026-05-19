## Why

ChallengeLayout 目前完全繞過 VitePress 的 DefaultTheme.Layout，導致使用者在挑戰頁面上失去 VitePress navbar（深色/淺色切換、導航連結、社群連結）。這造成使用者體驗斷裂：從文件頁切換到挑戰頁時，熟悉的導航列消失，無法切換主題或回到文件區。

## What Changes

- `Layout.vue` 改為始終渲染 `DefaultTheme.Layout`。當頁面為 challenge 時，透過 `#layout-bottom` slot 注入 `ChallengeLayout`
- 使用 `onMounted` + `watch` 切換 `body.challenge-page` class（SSR 安全）
- 新增 CSS 規則：當 `body.challenge-page` 時隱藏 VPLocalNav、VPSidebar、VPContent、VPFooter
- `ChallengeLayout` 高度從 `h-screen` 改為 `h-[calc(100vh-var(--vp-nav-height))]`，並加上 `mt-[var(--vp-nav-height)]`
- VitePress config 更新：nav 新增 'Docs' 連結、sidebar 改為 path-based object、修正 socialLinks

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-layout`: Layout.vue 不再替換整個 layout，而是在 DefaultTheme.Layout 內透過 slot 嵌入 ChallengeLayout
- `challenge-layout`: ChallengeLayout 高度和定位調整以配合 VitePress navbar

## Impact

- 受影響程式碼：
  - `.vitepress/theme/Layout.vue` — 重寫為使用 DefaultTheme.Layout + slot
  - `.vitepress/theme/style.css` — 新增 `body.challenge-page` 下的 CSS 隱藏規則
  - `.vitepress/theme/layouts/ChallengeLayout.vue` — 高度和 margin 調整
  - `.vitepress/config.mts` — nav、sidebar、socialLinks 更新
- 無破壞性變更：現有 challenge 頁面功能不受影響，僅增加 VitePress navbar 可見性
