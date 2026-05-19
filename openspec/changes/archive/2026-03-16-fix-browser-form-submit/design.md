## Context

`BrowserPanel.vue` 使用 `srcdoc` 搭配 `sandbox="allow-scripts allow-forms allow-same-origin"` 屬性渲染挑戰的 HTML 回應。由於 `srcdoc` iframe 在 `allow-same-origin` 模式下繼承 parent 的 origin（`localhost:5173`），iframe 內 `<form action="/login">` 的相對路徑解析至 Vite 開發伺服器，而非 `challenge-<slug>.localhost`。

現有的 `attachIframeLinkInterceptor` 函式已攔截 `<a>` click 事件；`<form>` submit 事件尚未被攔截。

## Goals / Non-Goals

**Goals:**
- 攔截 `srcdoc` iframe 內的 `<form>` submit 事件，透過 `dispatch()` 發送請求
- 支援 GET（query string）、POST `application/x-www-form-urlencoded`、POST `multipart/form-data`
- 將 navigate() 與 submit handler 的回應處理邏輯共用（抽取 `handleResponse`）
- 更新 BrowserPanel 單元測試覆蓋 form submit 情境

**Non-Goals:**
- 支援 `<form method="PUT">` 等非標準 HTML form method（HTML spec 只允許 GET/POST）
- 處理 3xx redirect（`dispatch()` 回應由 Flask/runtime 決定，不在 BrowserPanel 層處理）
- 改變 iframe sandbox 屬性或切換到 `src` URL 模式

## Decisions

### 攔截 form submit 而非注入 `<base>` tag

**決策**：在 `attachIframeLinkInterceptor` 加 `submit` 事件監聽，`preventDefault()` 後序列化並呼叫 `dispatch()`。

**原因**：注入 `<base href="...">` 會讓 form action 解析到正確的 challenge origin，但 submit 仍是瀏覽器原生導航，iframe 會離開 `srcdoc` 模式。之後 `contentDocument` 會因跨域（`challenge-<slug>.localhost` vs `localhost:5173`）而無法存取，導致現有的 link click 攔截器失效。submit 攔截與 link click 攔截模式一致，且完全在 `dispatch()` 層內完成，不影響 iframe 的 srcdoc 狀態。

### 序列化策略：依 enctype 分支

**決策**：
- GET → `URLSearchParams(new FormData(form))` 作為 query string
- POST + `application/x-www-form-urlencoded`（或無 enctype）→ `URLSearchParams` body，手動設 `Content-Type`
- POST + `multipart/form-data` → `FormData` 直接作為 body，不設 `Content-Type`（讓 fetch 自動加 boundary）

**原因**：`multipart/form-data` 的 boundary 必須由瀏覽器自動生成並寫入 `Content-Type` header，手動設定會導致 boundary 不匹配。使用 `URLSearchParams` 序列化 `application/x-www-form-urlencoded` 可確保正確 percent-encoding，且 Flask 的 `request.form` 能正確解析兩種 enctype。

### 抽取 handleResponse 共用函式

**決策**：將目前 `navigate()` 內的 `responseState` 更新邏輯抽取為 `handleResponse(res: Response, resolvedUrl: string)`，供 `navigate()` 與 form submit handler 共用。

**原因**：避免重複邏輯。URL bar 更新（`url.value = resolvedUrl`）也在此函式中統一處理。

## Risks / Trade-offs

- **`action` 屬性缺失**：若 `<form>` 沒有 `action` 屬性，預設應為目前 URL（`url.value`）。需在 resolve 前處理空字串情形。
- **`<input type="file">`**：`multipart/form-data` 可能包含 file input。`dispatch()` 透過 `Request` → Service Worker → MessageChannel 傳遞 `ArrayBuffer`，應能支援，但未測試。本次 scope 不涵蓋 file upload 情境。
