## 1. Build time Markdown body 注入

- [x] 1.1 在 `.vitepress/config.mts` 的 `transformPageData` hook 中實作「VitePress injects raw Markdown body into challenge page frontmatter at build time」：對 `layout === 'challenge'` 的頁面讀取原始 .md 檔案，去除 YAML frontmatter 後將 Markdown body 存入 `pageData.frontmatter.markdownBody`
- [x] 1.2 為 `transformPageData` 新增單元測試：驗證 challenge 頁面注入 markdownBody、非 challenge 頁面不受影響

## 2. 匯出 JSON 分層結構與 system prompt

- [x] 2.1 在 `useAttackSession.ts` 中定義 `ChallengeExportInfo` 介面與 `SessionExportPayload` 介面，實作匯出 JSON 分層結構（`meta` / `challenge` / `session`）
- [x] 2.2 定義全局硬編碼 system prompt 模組常數，實作全局硬編碼 system prompt 設計決策
- [x] 2.3 修改 `exportSession()` 為 `exportSession(challengeInfo)` 方法，滿足「useAttackSession provides session export as JSON」修改後規格：組裝 `SessionExportPayload`，包含 `meta.timezone`（`Intl.DateTimeFormat`）、`meta.exportedAt`（ISO 8601）、`meta.systemPrompt`，以及 `challenge` 資訊與 `session` events，實作 exportSession 參數傳遞設計決策
- [x] 2.4 更新 `useAttackSession` 單元測試：驗證匯出 JSON 包含 systemPrompt、timezone、exportedAt、challenge 資訊；驗證 optional 欄位 undefined 時正常匯出

## 3. ChallengeLayout 整合

- [x] 3.1 修改 `ChallengeLayout.vue` 的 `onExport` 函式，從 `fm.value` 中取得 difficulty、category、backend、description 與 markdownBody，組裝 `ChallengeExportInfo` 傳入 `attackSession.exportSession(challengeInfo)`
- [x] 3.2 更新 `ChallengeLayout` 單元測試：驗證 `onExport` 傳遞正確的 challenge 資訊給 `exportSession`
