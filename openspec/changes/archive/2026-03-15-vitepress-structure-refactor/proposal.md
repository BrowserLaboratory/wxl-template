## Why

目前專案目錄結構與 VitePress 慣例不符：layout routing 邏輯內嵌於 `theme/index.ts`、`ChallengeList` 被錯誤設計為獨立 layout、Service Worker 原始碼目錄命名語意不清、24 個測試檔案散落在 `.vitepress/` 各處。統一整頓後可大幅降低維護成本並符合 VitePress 2.x 最佳實踐。

## What Changes

- `theme/index.ts` 移除 inline Layout function，改由 `theme/Layout.vue` SFC 負責 layout routing
- `ChallengeList` 從 `layouts/ChallengeListLayout.vue` 重構為 `components/ChallengeList.vue`，全域註冊後可在 markdown 中直接以 `<ChallengeList />` 呼叫
- `docs/challenges/index.md` 移除 `layout: challenge-list` frontmatter，改為 default layout + `<ChallengeList />` 元件嵌入
- `.vitepress/sw/` 重命名為 `.vitepress/workers/`，語意更精確
- 所有 `.test.ts` 從 `.vitepress/**` 遷移至 `tests/unit/`（鏡像 source 結構），vitest.config.ts 更新 include 路徑
- 刪除殘留的 `components/ChallengeLayout.vue`（舊版重複檔案）
- 刪除 `layouts/ChallengeListLayout.vue`（由 ChallengeList 元件取代）

## Capabilities

### New Capabilities

（無新增 capability，本次為結構重構）

### Modified Capabilities

- `challenge-list`: 從獨立 layout 模式改為可嵌入 markdown 的全域元件模式，改變頁面整合方式
- `service-worker-router`: 原始碼目錄從 `.vitepress/sw/` 遷移至 `.vitepress/workers/`，不影響執行期行為

## Impact

- 影響 spec：`challenge-list`（整合方式變更）、`service-worker-router`（路徑變更）
- 影響程式碼：
  - `.vitepress/theme/index.ts`
  - `.vitepress/theme/Layout.vue`（新增）
  - `.vitepress/theme/components/ChallengeList.vue`（新增，改自 ChallengeListLayout.vue）
  - `.vitepress/theme/layouts/ChallengeListLayout.vue`（刪除）
  - `.vitepress/theme/components/ChallengeLayout.vue`（刪除，殘留檔案）
  - `.vitepress/sw/` → `.vitepress/workers/`（重命名）
  - `vitest.config.ts`（更新 include 路徑）
  - `tests/unit/**/*.test.ts`（24 個測試檔案遷移）
  - `docs/challenges/index.md`（移除 layout frontmatter）
