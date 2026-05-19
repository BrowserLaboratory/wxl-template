## 1. ChallengeConfig Interface 擴充

- [x] [P] 1.1 在 `.vitepress/challenge/config.ts` 的 `ChallengeConfig` interface 新增 `date?: string` 和 `tags?: string[]`（所有新欄位皆為 optional；tags 為 string array 儲存於 frontmatter）
- [x] [P] 1.2 在 `validateChallengeConfig()` 回傳物件中提取 `date` 和 `tags` 欄位（使用 ISO 8601 格式儲存日期）

## 2. Data Loader 擴充

- [x] [P] 2.1 更新 `ChallengeData` interface，修正 typo — 實現 challenge list page collects all challenge frontmatter at build time using createContentLoader 的擴充欄位
- [x] [P] 2.2 更新 `createContentLoader` transform 提取 `date`, `tags`, `description`，缺少時使用 fallback 值

## 3. Scaffold Script

- [x] [P] 3.1 更新 `generateMarkdown()` 使 frontmatter stub uses correct PLACEHOLDER values 並包含 `date` 和 `tags` 欄位

## 4. 現有 Challenge Frontmatter 補齊

- [x] [P] 4.1 在 `docs/challenge/sqli-demo.md` frontmatter 補上 `date` 和 `tags: [sql, injection, flask, sqlite]`
- [x] [P] 4.2 在 `docs/challenge/php-demo.md` frontmatter 補上 `date` 和 `tags: [lfi, php, file-inclusion]`
- [x] [P] 4.3 在 `docs/challenge/fastapi-demo.md` frontmatter 補上 `date` 和 `tags: [idor, fastapi, rest-api]`

## 5. 測試

- [x] 5.1 更新或新增 `tests/unit/scripts/create-challenge.test.ts` 驗證 `generateMarkdown()` 輸出包含 `date` 和 `tags`
- [x] 5.2 驗證 `pnpm docs:dev` 正常啟動，console 無錯誤
