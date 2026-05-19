## 1. 修正 Data Loader

- [x] 1.1 [P] 將 `createContentLoader` 的 glob pattern 從 `'challenge/*.md'` 改為 `'challenge/*/index.md'`，使其匹配 per-folder 挑戰結構（對應 design 決策「使用 `challenge/*/index.md` 作為唯一 glob pattern」）
- [x] 1.2 [P] 移除 `.filter((page) => !page.url.endsWith('/'))` 邏輯（對應 design 決策「移除 URL 尾斜線 filter」），確保 challenge list page collects all challenge frontmatter at build time using createContentLoader

## 2. 驗證

- [x] 2.1 確認現有測試通過，並驗證 per-folder challenges 能正確載入至 ChallengeData[] 陣列
