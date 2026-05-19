## Why

BrowserPanel 的 iframe 使用 `srcdoc` 搭配 `allow-same-origin` 屬性，導致 iframe 內的 HTML `<form>` 提交時，相對路徑的 `action`（如 `/login`）會解析到 Vite 開發伺服器（`localhost:5173`），而非挑戰的虛擬 host（`challenge-<slug>.localhost`）。這使得所有基於表單的挑戰（如 SQL Injection Demo）無法正常運作。

## What Changes

- 在 `BrowserPanel.vue` 的 `attachIframeLinkInterceptor` 中新增 `submit` 事件攔截器
- 攔截 `<form>` 提交，`preventDefault()` 後將 form action 解析至正確的挑戰 base URL
- 支援 `GET`（URLSearchParams 附加至 URL）與 `POST`（`application/x-www-form-urlencoded` 及 `multipart/form-data`）
- 將回應處理邏輯抽取為共用的 `handleResponse()` 函式，供 `navigate()` 與 submit handler 共用

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-ui`: BrowserPanel 新增 form submit 攔截行為（新需求）

## Impact

- Affected code: `.vitepress/theme/components/BrowserPanel.vue`、`tests/unit/components/BrowserPanel.test.ts`
