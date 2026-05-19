## Why

平台的 BrowserPanel 不支援 HTTP Cookie 和 302 Redirect，導致需要登入流程的 Challenge（如 IDOR、Session Hijacking）無法正常運作。根本原因是 Fetch API 將 `Cookie`（request）和 `Set-Cookie`（response）列為 forbidden header，`new Request()` 和 `new Response()` 會靜默過濾掉這兩個 header。此外，`serde_wasm_bindgen` 將 Rust `HashMap` 序列化為 JS `Map`（非 plain object），導致 wxlsh Terminal 的 flags 傳遞至 Python 時變成空物件。另有 `useChallengePersistence` 中 Vue reactive proxy 無法被 IndexedDB structured clone 的 bug。

## What Changes

- **BrowserPanel Cookie Jar**：新增 cookie 管理機制，攔截回應中的 `Set-Cookie` 並在後續請求注入 `Cookie`
- **BrowserPanel Redirect**：`handleResponse` 偵測 3xx + `Location` header，自動以 GET 跟隨（上限 5 次）
- **Forbidden Header Transport**：引入 `X-Wxlsh-Cookie` / `X-Wxlsh-Set-Cookie` 自訂 header 做傳輸通道，繞過 Fetch API 限制
  - `usePythonRuntime.handleRequest`：`X-Wxlsh-Cookie` → `cookie`（request）；`set-cookie` → `X-Wxlsh-Set-Cookie`（response）
  - `useTrafficLog`：在 display headers 中還原為標準 `Cookie` / `Set-Cookie`
  - `ChallengeLayout.dispatchBridge`：`transportCookie()` 轉換 + `restoreSetCookie()` 還原（Code/Terminal panel 路徑）
  - `ChallengeLayout.handleRequest`：Service Worker 路徑同步處理
  - `RepeatPanel.parseRawRequest`：Repeater 路徑同步處理
- **usePythonRuntime mkdir**：寫入 FS entry 前自動建立父目錄，支援 `src/templates/` 等子目錄結構
- **usePythonRuntime Set-Cookie append**：response header 處理改用 `append`（已被 transport 機制取代，但邏輯保留）
- **useChallengePersistence DataCloneError 修正**：`saveAttackSession` 使用 `JSON.parse(JSON.stringify())` 去除 Vue reactive proxy
- **useWxlsh Map→Object 修正**：WASM parser 回傳的 `flags`（JS Map）在傳給 Python 前轉為 plain object

## Non-Goals

- 不實作跨 Challenge 的 cookie 共享
- 不實作 `document.cookie` 在 iframe sandbox 中的存取（XSS cookie stealing 需要另外的機制）
- 不修改 wxlsh WASM parser 的 Rust 原始碼（在 JS 端轉換即可）
- 不重構 wxlsh Terminal 的命令解析流程（僅修正 flags 傳遞問題）

## Capabilities

### New Capabilities

（無新 capability — 所有改動皆為既有 capability 的 bug fix 或增強）

### Modified Capabilities

- `challenge-ui`：BrowserPanel 新增 cookie jar 和 redirect 跟隨行為
- `python-asgi-runtime`：handleRequest 支援 forbidden header transport 和 FS 子目錄建立
- `attack-session-tracking`：saveAttackSession 修正 structured clone 相容性
- `network-traffic-panel`：response headers 顯示還原 `Set-Cookie`；request headers 顯示還原 `Cookie`
- `wxlsh-terminal`：Python command 呼叫時 flags Map→Object 轉換

## Impact

- 受影響程式碼：
  - `.vitepress/theme/components/BrowserPanel.vue`
  - `.vitepress/theme/components/RepeatPanel.vue`
  - `.vitepress/theme/composables/usePythonRuntime.ts`
  - `.vitepress/theme/composables/useTrafficLog.ts`
  - `.vitepress/theme/composables/useChallengePersistence.ts`
  - `.vitepress/theme/composables/useWxlsh.ts`
  - `.vitepress/theme/layouts/ChallengeLayout.vue`
- 受影響 specs：`challenge-ui`、`python-asgi-runtime`、`attack-session-tracking`、`network-traffic-panel`、`wxlsh-terminal`
