## Context

目前 `Layout.vue` 使用 `computed` 在 `DefaultTheme.Layout` 和 `ChallengeLayout` 之間做二選一切換。當 frontmatter 為 `layout: challenge` 時，整個 VitePress DefaultTheme.Layout 被替換，導致 navbar（含深色模式切換、導航連結、社群連結）完全消失。使用者在挑戰頁面上失去所有 VitePress 標準導航功能。

相關 spec：`openspec/specs/challenge-layout/spec.md`

## Goals / Non-Goals

**Goals:**

- 讓 challenge 頁面保留 VitePress navbar（深色/淺色切換、nav links、social links）
- 透過 `#layout-bottom` slot 將 ChallengeLayout 嵌入 DefaultTheme.Layout 中
- SSR 安全地控制 body class 以隱藏不需要的 VitePress 預設元件
- 調整 ChallengeLayout 高度以配合頂部 navbar 的空間
- 更新 VitePress config 中的 nav、sidebar 和 socialLinks

**Non-Goals:**

- 修改 ChallengeLayout 內部面板功能（Browser、Terminal 等）
- 響應式 / 移動端 layout 改版
- 新增自訂 navbar 元件

## Decisions

### 使用 DefaultTheme.Layout + #layout-bottom slot

所有頁面（包括 challenge 頁面）統一使用 `DefaultTheme.Layout`。Challenge 頁面透過 `#layout-bottom` slot 注入 `ChallengeLayout`。這樣 VitePress navbar 自然保留，不需要手動複製 navbar 元件。

**替代方案：** 在 ChallengeLayout 中手動引入 VPNav — 需要追蹤 VitePress 內部元件的 API 變化，維護成本高且容易與版本升級衝突。

### 使用 body class + CSS 隱藏預設區塊

透過 `onMounted` + `watch(frontmatter)` 動態切換 `body.challenge-page` class，搭配 CSS `display: none` 隱藏 VPLocalNav、VPSidebar、VPContent、VPFooter。此方式 SSR 安全（class 僅在 client 端添加），且不需要修改 VitePress 內部元件。

**替代方案：** 使用 VitePress 提供的其他 slot（如 `#doc-before`）控制顯示 — DefaultTheme.Layout 沒有提供足夠的 slot 來完全隱藏 sidebar 和 content 區塊，CSS 方案更直接可靠。

### ChallengeLayout 高度改用 calc(100vh - var(--vp-nav-height))

將 `h-screen` 改為 `h-[calc(100vh-var(--vp-nav-height))]` 並加上 `mt-[var(--vp-nav-height)]`，讓 ChallengeLayout 精確填滿 navbar 下方的剩餘空間。`--vp-nav-height` 是 VitePress 已定義的 CSS variable，保證與 navbar 高度同步。

**替代方案：** 使用固定像素值（如 `64px`）— VitePress 的 navbar 高度可能隨版本或配置變化，使用 CSS variable 更具韌性。

### VitePress config 調整

- `nav` 新增 `{ text: 'Docs', link: '/guide/' }` 連結，提供從挑戰頁返回文件區的途徑
- `sidebar` 從空陣列改為 path-based object，避免 challenge 頁面顯示不相關的 sidebar
- `socialLinks` 修正 GitHub link 指向正確的 repository

## Risks / Trade-offs

- **風險：** VitePress 版本升級可能更改 VPLocalNav、VPSidebar 等元件的 class name → 緩解：CSS selector 使用 VitePress 官方 class name，並在升級時進行視覺回歸測試
- **風險：** `#layout-bottom` slot 在未來版本可能被移除或改名 → 緩解：`layout-bottom` 是 VitePress DefaultTheme 的穩定 API slot，在 VitePress 文件中有明確記載
- **Trade-off：** CSS 隱藏方式意味著隱藏的元件仍會被渲染到 DOM 中 → 可接受：這些元件（sidebar、footer）很輕量，不影響效能
