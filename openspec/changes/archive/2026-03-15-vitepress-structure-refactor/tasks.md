## 1. Layout.vue 作為 layout router（Layout.vue 作為 layout router 決策）

- [x] 1.1 新增 `.vitepress/theme/Layout.vue`：以 `computed` 根據 `frontmatter.layout` 切換 `ChallengeLayout` 或 `DefaultTheme.Layout`，並以 `<component :is="layout" />` 渲染
- [x] 1.2 更新 `.vitepress/theme/index.ts`：移除 inline Layout arrow function，改為 `import Layout from './Layout.vue'` 並設定 `Layout` 欄位

## 2. ChallengeList 改為全域元件（ChallengeList 改為全域元件決策）

- [x] 2.1 將 `.vitepress/theme/layouts/ChallengeListLayout.vue` 的內容重構為 `.vitepress/theme/components/ChallengeList.vue`，實作 Challenge list page uses a globally registered Vue component embedded in markdown 需求
- [x] 2.2 在 `theme/index.ts` 的 `enhanceApp` 中新增 `app.component('ChallengeList', ChallengeList)` 全域註冊
- [x] 2.3 更新 `docs/challenges/index.md`：移除 `layout: challenge-list` frontmatter，在 markdown body 新增 `<ChallengeList />`，移除 Challenge list page uses a custom "challenge-list" layout 需求
- [x] 2.4 刪除 `.vitepress/theme/layouts/ChallengeListLayout.vue`（已由 ChallengeList.vue 取代）
- [x] 2.5 刪除 `.vitepress/theme/components/ChallengeLayout.vue`（舊版殘留，非 layouts/ 下的正式版本）

## 3. Service Worker 目錄遷移（Service Worker source resides in .vitepress/workers/ 需求）

- [x] 3.1 將 `.vitepress/sw/` 目錄整體重命名為 `.vitepress/workers/`（包含 `router.ts`），實作 Service Worker source resides in .vitepress/workers/ 需求

## 4. 測試集中至 tests/unit/（tests/ 鏡像結構決策）

- [x] 4.1 建立 `tests/unit/challenge/` 並移動 `.vitepress/challenge/*.test.ts`（5 個檔案），更新各檔案的 import 相對路徑
- [x] 4.2 建立 `tests/unit/workers/` 並移動 `.vitepress/sw/router.test.ts`，更新 import 路徑指向 `.vitepress/workers/router.ts`（Router test file imports from the new path 需求）
- [x] 4.3 建立 `tests/unit/components/` 並移動 `.vitepress/theme/components/*.test.ts`（6 個檔案，含 `ChallengeListLayout.test.ts` 重命名為 `ChallengeList.test.ts`），更新各檔案 import 路徑
- [x] 4.4 建立 `tests/unit/composables/` 並移動 `.vitepress/theme/composables/*.test.ts`（8 個檔案），更新各檔案 import 路徑
- [x] 4.5 建立 `tests/unit/layouts/` 並移動 `.vitepress/theme/layouts/ChallengeLayout.test.ts`（1 個檔案），更新 import 路徑
- [x] 4.6 更新 `vitest.config.ts`：將 `include` 從多組 `.vitepress/**/*.test.ts` glob 改為 `['tests/**/*.test.ts']`
- [x] 4.7 執行 `pnpm test` 確認所有測試通過（Compiled output is unaffected 需求驗證）
