## Why

攻擊 session 匯出的 JSON 目前只包含 session 資料（slug、title、events），使用者將其丟給 AI 產生 Writeup 時，AI 缺乏足夠 context（題目描述、難度、system prompt 指引、時區資訊），導致產出品質不穩定且需要使用者手動補充。

## What Changes

- **AI Writeup system prompt**：匯出 JSON 內嵌一份全局硬編碼的 system prompt，指引 AI 如何從攻擊紀錄產生結構化 Writeup
- **Challenge 基本資訊**：匯出 JSON 加入 challenge 的 frontmatter 欄位（difficulty、category、description）與完整 Markdown body 描述
- **Build time Markdown 注入**：在 VitePress `transformPageData` hook 中讀取 challenge 頁面的原始 Markdown body，注入至 `frontmatter.markdownBody`，供 runtime 使用
- **使用者時區**：匯出時透過 `Intl.DateTimeFormat` 取得瀏覽器時區，寫入 JSON 以便 AI 產生正確的時間內容
- **匯出 JSON 結構重組**：將匯出格式從扁平的 `AttackSession` 改為分層結構（`meta` / `challenge` / `session`），**BREAKING**：匯出 JSON schema 不向後相容

## Capabilities

### New Capabilities

- `challenge-markdown-injection`：VitePress build time 將 challenge 頁面的原始 Markdown body 注入至 frontmatter，供 runtime 元件使用

### Modified Capabilities

- `attack-session-tracking`：`exportSession()` 輸出格式從扁平 AttackSession 改為分層結構，加入 system prompt、challenge 資訊與時區

## Impact

- 新增 VitePress config hook：`.vitepress/config.mts`（`transformPageData`）
- 修改 composable：`.vitepress/theme/composables/useAttackSession.ts`（`exportSession` 函式簽名與輸出格式）
- 修改元件：`.vitepress/theme/layouts/ChallengeLayout.vue`（傳遞 challenge 資訊給 `exportSession`）
- 修改測試：`tests/unit/composables/useAttackSession.test.ts`
