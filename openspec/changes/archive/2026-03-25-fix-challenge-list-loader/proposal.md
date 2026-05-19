## Why

`docs/shared/challenges.data.ts` 的 `createContentLoader` glob pattern 為 `'challenge/*.md'`，但專案已全面遷移至 per-folder 結構（`challenge/<slug>/index.md`）。此外 transform 中的 `.filter((page) => !page.url.endsWith('/'))` 會排除所有 per-folder 挑戰的 URL（因為它們的 URL 以 `/` 結尾）。兩個 bug 疊加導致挑戰列表頁面（`/challenges/`）和首頁最新挑戰區塊完全空白，沒有任何挑戰被載入。

## What Changes

- 修正 `createContentLoader` 的 glob pattern，改為匹配 `challenge/*/index.md`
- 移除或調整錯誤的 `.filter()` 邏輯，確保 per-folder 挑戰不被排除
- 確認修正後的 data loader 能正確匯出 `ChallengeData[]` 給 `ChallengeList` 和 `HomeContent` 使用

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-list`：data loader 的 glob pattern 與 filter 邏輯需與 per-folder 結構對齊

## Impact

- 受影響程式碼：`docs/shared/challenges.data.ts`
- 受影響頁面：`/challenges/`（ChallengeList 元件）、`/`（HomeContent 最新挑戰）
- 受影響 spec：`challenge-list`
