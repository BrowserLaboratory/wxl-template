## Context

`docs/shared/challenges.data.ts` 使用 VitePress 的 `createContentLoader` 在建置時收集所有挑戰的 frontmatter。專案已從 legacy 結構（`challenge/<slug>.md`）全面遷移至 per-folder 結構（`challenge/<slug>/index.md`），但 data loader 的 glob pattern 和 filter 邏輯未同步更新。

目前程式碼：
- glob: `'challenge/*.md'` — 只匹配根層 `.md` 檔，不匹配子目錄中的 `index.md`
- filter: `.filter((page) => !page.url.endsWith('/'))` — per-folder 的 URL 以 `/` 結尾，全部被排除

## Goals / Non-Goals

**Goals:**

- 修正 glob pattern 使其匹配 per-folder 挑戰（`challenge/*/index.md`）
- 修正 filter 邏輯使 per-folder 挑戰不被排除
- 保持 `ChallengeData[]` 匯出介面不變

**Non-Goals:**

- 不處理 legacy 結構的向下相容（目前已無 legacy 挑戰）
- 不修改 `ChallengeList.vue` 或 `HomeContent.vue` 元件

## Decisions

### 使用 `challenge/*/index.md` 作為唯一 glob pattern

將 glob 從 `'challenge/*.md'` 改為 `'challenge/*/index.md'`。

替代方案：`'challenge/**/*.md'` — 過於寬泛，可能誤匹配未來的子頁面。由於專案已全面遷移至 per-folder 結構，精確匹配 `index.md` 即可。

### 移除 URL 尾斜線 filter

移除 `.filter((page) => !page.url.endsWith('/'))` 這行。此 filter 原本是為了排除目錄索引頁，但 per-folder 結構下的挑戰 URL 就是以 `/` 結尾。改為 glob 本身只匹配挑戰的 `index.md`，不需要額外 filter。

## Risks / Trade-offs

- [風險] 若未來有人在 `challenge/` 下新增非挑戰的子目錄且包含 `index.md`，會被誤載入 → 透過出題者工具（`create:challenge`）統一管理，非挑戰目錄不會有 `index.md`
