## 1. SVG Icon 檔案（SVG icons 放在 docs/public/icons/）

- [x] [P] 1.1 建立 `docs/public/icons/browser.svg` — 瀏覽器圖示，valid SVG with viewBox — 實現 SVG icon files exist for all six platform features
- [x] [P] 1.2 建立 `docs/public/icons/terminal.svg` — 終端機圖示 — 實現 SVG icon files exist for all six platform features
- [x] [P] 1.3 建立 `docs/public/icons/code.svg` — 程式碼圖示 — 實現 SVG icon files exist for all six platform features
- [x] [P] 1.4 建立 `docs/public/icons/repeater.svg` — Repeater 圖示 — 實現 SVG icon files exist for all six platform features
- [x] [P] 1.5 建立 `docs/public/icons/network.svg` — 網路流量圖示 — 實現 SVG icon files exist for all six platform features
- [x] [P] 1.6 建立 `docs/public/icons/notes.svg` — 筆記圖示 — 實現 SVG icon files exist for all six platform features

## 2. Hero Gradient 色彩更新

- [x] [P] 2.1 更新 `.vitepress/theme/style.css` 的 `--vp-home-hero-name-background` gradient 為 indigo 品牌色（#4338ca / #6366f1）— 實現 hero gradient uses indigo brand colors
- [x] [P] 2.2 更新 `.vitepress/theme/style.css` 的 `--vp-home-hero-image-background-image` gradient 為 indigo 品牌色

## 3. HomeContent 元件

- [x] [P] 3.1 建立 `.vitepress/theme/components/HomeContent.vue` — 實現 HomeContent component displays platform introduction section
- [x] 3.2 在 HomeContent.vue 加入統計區塊，使用 challenges data loader 計算總題數和難度分佈 — 實現 HomeContent component displays challenge statistics
- [x] 3.3 在 HomeContent.vue 加入最新挑戰區塊，使用 challenges data loader 顯示最新 3 道挑戰（依 date 排序）— 實現 HomeContent component displays latest challenges + Challenge list page collects all challenge frontmatter at build time using createContentLoader（新增 consumer）
- [x] 3.4 在 HomeContent.vue 加入 3 步驟快速開始區塊 — 實現 HomeContent component displays quick-start guide

## 4. 元件註冊

- [x] 4.1 在 `.vitepress/theme/index.ts` import 並全域註冊 `HomeContent` 元件 — 實現 HomeContent is globally registered and embedded in homepage markdown（依賴 3.1）

## 5. 首頁 Frontmatter 重寫（使用 VitePress 原生 features 陣列而非自訂 Vue 元件）

- [x] 5.1 重寫 `docs/index.md` frontmatter：強化 hero tagline、新增第二個 action button、加入 6 張 feature cards — 實現 homepage uses VitePress home layout with enhanced hero and feature cards（依賴 1.1–1.6）
- [x] 5.2 在 `docs/index.md` markdown body 嵌入 `<HomeContent />` 元件 — HomeContent 透過 markdown 嵌入而非 Layout slot（依賴 4.1）

## 6. 測試

- [x] 6.1 驗證 `pnpm docs:dev` 正常啟動，首頁渲染 hero、feature cards、HomeContent 各區塊無錯誤
- [x] 6.2 新增 `HomeContent.vue` 元件測試，驗證統計計算和最新挑戰排序邏輯
