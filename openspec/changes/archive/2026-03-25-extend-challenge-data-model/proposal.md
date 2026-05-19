## Why

Challenge 資料模型目前缺少 `date`（出題時間）和 `tags`（標籤）欄位。這導致題目總覽無法依時間排序、無法以標籤搜尋，首頁也無法展示「最新題目」。此變更為後續的首頁改版（統計 + 最新題目）和題目總覽改版（搜尋/排序/篩選）提供資料基礎。

## What Changes

- `ChallengeConfig` interface 新增 `date?: string` 和 `tags?: string[]` 欄位
- `validateChallengeConfig()` 函式中提取並回傳新欄位
- `ChallengeData` interface 新增 `date?`, `tags?`, `description?` 欄位，修正 `'esay'` typo
- `createContentLoader` 的 `transform()` 提取新欄位
- `create-challenge.ts` 的 `generateMarkdown()` 自動填入 `date`（系統時區 ISO 格式）和 `tags: []`
- 現有 3 個 challenge frontmatter 補上 `date` 和 `tags` 欄位

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-scaffold`: `generateMarkdown()` 新增自動填入 `date` 和 `tags` 欄位的需求
- `challenge-list`: `ChallengeData` interface 擴充，data loader transform 提取新欄位

## Impact

- 受影響程式碼：
  - `.vitepress/challenge/config.ts` — interface 和驗證函式
  - `docs/shared/challenges.data.ts` — data loader interface 和 transform
  - `scripts/create-challenge.ts` — markdown 生成函式
  - `docs/challenge/sqli-demo.md`, `php-demo.md`, `fastapi-demo.md` — frontmatter 欄位
- 無破壞性變更：所有新欄位皆為 optional
