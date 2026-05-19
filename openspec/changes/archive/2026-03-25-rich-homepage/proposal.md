## Why

首頁目前只有一個簡單的 hero 標題和一顆按鈕，無法向訪客傳達平台的功能、價值和內容深度。對於第一次造訪的使用者而言，缺少平台介紹、功能卡片、統計數據和最新挑戰等資訊，使得首頁既不具吸引力也無法引導使用者開始使用平台。此變更將首頁改版為功能豐富的 landing page，提升第一印象與轉換率。

## What Changes

- `docs/index.md`：重寫 VitePress home layout frontmatter — 強化 hero tagline、新增第二個 action button（「使用指南」）、加入 6 張 feature cards 並指定 SVG icon
- `docs/public/icons/`：新增 6 個 SVG icon 檔案（browser、terminal、code、repeater、network、notes），對應平台核心功能
- `.vitepress/theme/components/HomeContent.vue`：新元件，包含平台介紹區塊、統計資訊（總題數 + 難度分佈）、最新 3 道挑戰、3 步驟快速開始
- `.vitepress/theme/index.ts`：全域註冊 `HomeContent` 元件
- `.vitepress/theme/style.css`：hero gradient 色彩更新為 indigo 品牌色（#4338ca / #6366f1）

## Capabilities

### New Capabilities

- `homepage-content`: 首頁內容元件，提供平台介紹、統計資訊、最新挑戰、快速開始等區塊

### Modified Capabilities

- `challenge-list`: HomeContent 需使用 challenges data loader 取得最新 3 道挑戰（僅讀取，不修改 data loader）

## Impact

- 受影響程式碼：
  - `docs/index.md` — frontmatter 完全重寫
  - `docs/public/icons/*.svg` — 6 個新檔案
  - `.vitepress/theme/components/HomeContent.vue` — 新元件
  - `.vitepress/theme/index.ts` — 新增 import 和 component 註冊
  - `.vitepress/theme/style.css` — hero gradient 色彩修改
- 無破壞性變更：所有修改僅影響首頁外觀，不改變既有的 challenge 或 navigation 邏輯
