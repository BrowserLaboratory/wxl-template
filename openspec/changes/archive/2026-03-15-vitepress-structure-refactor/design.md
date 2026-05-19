## Context

專案目前有四個結構問題：

1. **Layout routing 內嵌**：`theme/index.ts` 用 inline arrow function 回傳不同 layout component。VitePress 慣例是將 Layout 定義為獨立 SFC（`Layout.vue`），讓 `index.ts` 的 `Layout` 欄位指向它。
2. **ChallengeList 設計錯誤**：`ChallengeListLayout.vue` 被設計為獨立 VitePress layout，但使用者只需要一個可嵌入 markdown 的 Vue 元件。目前寫法強制每個題目列表頁都要宣告 `layout: challenge-list`，不夠彈性。
3. **SW 目錄命名**：`.vitepress/sw/` 名稱太通用，`workers/` 更能表達其為 Web Worker/Service Worker 原始碼集合的語意。
4. **測試散落**：24 個 `.test.ts` 分散於 `.vitepress/challenge/`、`.vitepress/sw/`、`.vitepress/theme/components/`、`.vitepress/theme/composables/`、`.vitepress/theme/layouts/`，`vitest.config.ts` 需要多組 glob 才能覆蓋全部，且目錄結構難以一覽。

## Goals / Non-Goals

**Goals:**

- `Layout.vue` 成為 layout routing 的唯一入口
- `ChallengeList` 成為全域 Vue 元件，可在任意 markdown 以 `<ChallengeList />` 呼叫
- 所有測試集中在 `tests/unit/`，鏡像 source 目錄結構
- `.vitepress/workers/` 取代 `.vitepress/sw/`
- 刪除殘留的 stale 檔案

**Non-Goals:**

- 不修改 ChallengeLayout.vue 的功能或視覺
- 不修改任何測試內容（只移動位置，更新 import 路徑）
- 不新增任何新功能

## Decisions

### Layout.vue 作為 layout router

**決策**：新增 `theme/Layout.vue`，內容為一個 computed 元件選擇器，`theme/index.ts` 的 `Layout` 欄位直接 import 它。

**理由**：VitePress 官方範例中 custom theme 的 `Layout` 是 SFC，不是 inline function。SFC 寫法可享有 Volar 型別檢查、`<template>` 語意清晰、後續可使用 slots 注入。

**替代方案**：維持 inline function → 功能相同但不符合 VitePress 慣例，且無法使用 template slots。

### ChallengeList 改為全域元件

**決策**：`ChallengeListLayout.vue` 拆解為 `components/ChallengeList.vue`，在 `enhanceApp` 中以 `app.component('ChallengeList', ChallengeList)` 全域註冊。`docs/challenges/index.md` 改用 default layout + `<ChallengeList />`。

**理由**：VitePress 的 global component registration 讓任意 markdown 都能引用元件，不需要 frontmatter 宣告；且後續若需要在多個頁面顯示題目子集，可透過 props 擴充，layout 寫法則無法做到這一點。

**替代方案**：保留 layout 寫法，在 `ChallengeListLayout.vue` 裡引入更多邏輯 → 違反 VitePress 的 layout/component 職責分離原則。

### tests/ 鏡像結構

**決策**：
```
tests/unit/
  challenge/     ← .vitepress/challenge/
  workers/       ← .vitepress/sw/
  components/    ← .vitepress/theme/components/
  composables/   ← .vitepress/theme/composables/
  layouts/       ← .vitepress/theme/layouts/
tests/e2e/       （不動）
```

`vitest.config.ts` 的 `include` 改為 `['tests/**/*.test.ts']`。

**理由**：測試與 source 分離是大型專案常見做法。集中在 `tests/` 後可一眼看到整體測試覆蓋狀況，vitest 報告也更易讀。

**替代方案**：colocated tests（測試與 source 放在一起）→ VitePress 外掛通常採用此模式，但會讓 `.vitepress/` 目錄混雜生產程式碼與測試，在目前 24 個測試的規模下已明顯造成困擾。

## Risks / Trade-offs

- **Import 路徑更新風險**：移動 22 個測試檔案後，每個測試的 `import` 相對路徑都要調整。需逐一確認，或搭配 vitest alias 降低風險。→ 緩解：逐目錄移動，移動後立即跑 `pnpm test` 驗證。
- **`ChallengeListLayout.test.ts` 測試對應**：`ChallengeListLayout.vue` 改名為 `ChallengeList.vue` 後，原測試要同步重命名為 `ChallengeList.test.ts`，並更新 import。→ 緩解：在移動步驟中一併處理。
- **`docs/challenges/index.md` frontmatter 變更**：移除 `layout: challenge-list` 後頁面改用 default layout，VitePress nav bar 和 sidebar 會自動顯示（若有設定）。→ 緩解：確認 `config.mts` 的 sidebar 設定不會干擾題目列表頁的視覺。
