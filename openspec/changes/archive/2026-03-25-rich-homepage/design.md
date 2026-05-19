## Context

首頁定義在 `docs/index.md`，使用 VitePress 內建的 `home` layout。目前 frontmatter 僅含基本 hero（name、text、tagline）和一個 action button。VitePress home layout 原生支援 `features` 陣列（feature cards）和 slot（如 `home-features-after`），可透過 `<script setup>` 在 markdown 中引入自訂元件。

品牌色系已定義在 `.vitepress/theme/style.css`，使用 `--ch-accent` 系列 design tokens（indigo #4338ca / #6366f1）。但 hero gradient 仍使用預設的紫/藍色，需要對齊品牌色。

挑戰資料由 `docs/shared/challenges.data.ts` 的 `createContentLoader` 在 build time 收集，`HomeContent.vue` 可直接 import 使用。

## Goals / Non-Goals

**Goals:**

- 利用 VitePress home layout 原生 `features` 陣列顯示 6 張功能卡片
- 建立 `HomeContent.vue` 元件提供動態內容：平台介紹、統計、最新挑戰、快速開始
- 新增 6 個 SVG icon 檔案供 feature cards 使用
- Hero gradient 對齊 indigo 品牌色系
- 全域註冊 HomeContent 以便在 markdown 中使用

**Non-Goals:**

- 不修改 challenges data loader（僅讀取）
- 不實作使用者登入或個人化內容
- 不實作動態 API 呼叫（統計資料來自 build time data）
- 不修改任何 challenge 頁面

## Decisions

### 使用 VitePress 原生 features 陣列而非自訂 Vue 元件

VitePress home layout 內建 `features` frontmatter 陣列，支援 icon、title、details 和 link。採用原生功能可減少自訂元件的複雜度，確保與未來 VitePress 版本的相容性。

**替代方案：** 全部用自訂 Vue grid 元件 — 需要重新實作 VitePress 已有的 responsive card layout，增加維護成本。

### HomeContent 透過 markdown 嵌入而非 Layout slot

在 `docs/index.md` 中使用 `<script setup>` import 並以 `<HomeContent />` 嵌入 markdown body。VitePress home layout 會將 markdown 內容渲染在 features 之後。這比修改 Layout.vue 加入 slot 更簡單。

**替代方案：** 在 Layout.vue 使用 `home-features-after` slot — 需修改 Layout.vue 加入首頁判斷邏輯，較為侵入性。

### SVG icons 放在 docs/public/icons/

Feature cards 的 `icon` 欄位接受 public 目錄下的路徑。將 SVG 放在 `docs/public/icons/` 可透過 `/icons/*.svg` 路徑直接引用，無需 bundler 處理。

**替代方案：** 使用 inline SVG 或 emoji — inline SVG 會使 frontmatter 過於冗長；emoji 風格不一致且不夠專業。

### Hero gradient 色彩更新

將 `--vp-home-hero-name-background` 的 gradient 從預設的紫/cyan（#bd34fe / #41d1ff）改為 indigo 品牌色（#4338ca / #6366f1），與 `--ch-accent` tokens 一致。同時更新 `--vp-home-hero-image-background-image` 的 gradient。

## Risks / Trade-offs

- **風險：** 統計數據在 build time 固定，新增或刪除 challenge 後需重新 build 才能更新首頁統計 → 緩解：VitePress 本身就是 SSG，這是預期行為，dev mode 下 HMR 會自動更新
- **風險：** 6 個 SVG icon 檔案增加 repo 大小 → 緩解：SVG 檔案極小（每個約 1-2KB），影響可忽略
- **風險：** HomeContent 依賴 challenges data loader 的 `ChallengeData` 型別 → 緩解：僅使用已穩定的欄位（title、difficulty、url），不依賴 `extend-challenge-data-model` 的新欄位
