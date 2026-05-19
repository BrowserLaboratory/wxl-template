## Context

目前 `useAttackSession.exportSession()` 直接將 `AttackSession` 物件序列化為 JSON 下載。使用者拿到 JSON 後丟給 AI 產生 Writeup，但 AI 缺少 system prompt 指引、題目描述、時區資訊，需要使用者手動補充 context。

VitePress 的 `<Content />` 在 build time 將 Markdown 編譯為 HTML，runtime 無法取得原始 Markdown body。需要在 build time 透過 `transformPageData` hook 預先注入。

## Goals / Non-Goals

**Goals:**

- 讓匯出 JSON 自帶足夠 context，使用者可直接丟給 AI 產生高品質 Writeup
- 在 build time 注入 challenge 原始 Markdown body 至 frontmatter
- 保持 IndexedDB 儲存格式不變，僅在 export 時重組輸出結構

**Non-Goals:**

- 不修改 IndexedDB `AttackSession` schema
- 不提供 per-challenge 自訂 system prompt（使用全局硬編碼）
- 不處理 Markdown body 的 i18n

## Decisions

### Build time Markdown body 注入

在 `.vitepress/config.mts` 的 `transformPageData` hook 中，對 `layout === 'challenge'` 的頁面讀取原始 .md 檔案，去除 YAML frontmatter 後將 Markdown body 存入 `pageData.frontmatter.markdownBody`。

**替代方案**：Runtime 抓取 `<Content />` 渲染的 DOM innerHTML。**拒絕** — HTML 含 VitePress 產生的 anchor、class 等噪音，對 AI 理解題目描述不利，且有 DOM 時序問題。

### 匯出 JSON 分層結構

匯出格式改為三層結構：

```json
{
  "meta": {
    "systemPrompt": "...",
    "timezone": "Asia/Taipei",
    "exportedAt": "2026-03-23T14:30:00+08:00"
  },
  "challenge": {
    "slug": "sqli-demo",
    "title": "SQL Injection Demo",
    "difficulty": "easy",
    "category": "web",
    "backend": "flask",
    "description": "A simple Flask app with a SQL injection vulnerability...",
    "fullDescription": "# SQL Injection Demo\n\nA login form backed by SQLite..."
  },
  "session": {
    "startedAt": 1711180200000,
    "solvedAt": 1711181400000,
    "events": [...]
  }
}
```

- `meta.systemPrompt`：全局硬編碼的 AI Writeup 指引
- `meta.timezone`：透過 `Intl.DateTimeFormat().resolvedOptions().timeZone` 取得
- `meta.exportedAt`：ISO 8601 格式的匯出時間
- `challenge.description`：來自 frontmatter 的短摘要
- `challenge.fullDescription`：來自 `transformPageData` 注入的完整 Markdown body
- `session`：現有 `AttackSession` 的 events 與時間資料

### 全局硬編碼 system prompt

system prompt 直接定義在 `useAttackSession.ts` 中作為模組層級常數。內容指引 AI：使用匯出的攻擊紀錄產生結構化 CTF Writeup，包含題目概述、解題思路、攻擊步驟、flag 取得過程。

**替代方案**：per-challenge frontmatter 欄位（`writeup_prompt:`）。**拒絕** — Writeup 格式通常固定，不需要每題自訂，且增加出題者負擔。

### exportSession 參數傳遞

`exportSession()` 需要 challenge 資訊（frontmatter 欄位 + markdownBody），這些資訊在 `ChallengeLayout.vue` 中透過 `useData()` 可取得。改為 `exportSession(challengeInfo)` 接受一個物件參數，由 ChallengeLayout 在呼叫時傳入。

**替代方案**：在 `useAttackSession` 初始化時就傳入所有 challenge 資訊。**拒絕** — 增加初始化參數數量且部分資訊（如 markdownBody）可能在初始化時尚未就緒。

## Risks / Trade-offs

- [風險] `transformPageData` 讀取檔案時路徑拼接需正確使用 `srcDir`（`docs`）→ 緩解：使用 VitePress 提供的 `pageData.filePath` 或組合 `srcDir` + `relativePath`
- [風險] 匯出 JSON schema 不向後相容 → 緩解：此為首次發布的功能，目前無外部消費者依賴此格式
- [Trade-off] Markdown body 對所有 challenge 頁面都會注入至 frontmatter，即使使用者不匯出 → 影響極小，challenge 頁面數量少且 Markdown body 通常很短
