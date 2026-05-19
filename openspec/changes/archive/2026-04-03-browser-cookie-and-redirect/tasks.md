## 1. Forbidden Header Transport 機制

- [x] [P] 1.1 在 `ChallengeLayout.vue` 新增 `transportCookie()` helper：將 headers 中的 `Cookie`/`cookie` 移至 `X-Wxlsh-Cookie`，用於 dispatchBridge 和 handleRequest 路徑（實作「Runtime handles HTTP request dispatch」requirement 的 request 方向）
- [x] [P] 1.2 在 `ChallengeLayout.vue` 新增 `restoreSetCookie()` helper：將 Response 的 `X-Wxlsh-Set-Cookie` 還原為 `set-cookie` key，用於 dispatchBridge 回傳 Python 的 response headers
- [x] 1.3 修改 `usePythonRuntime.ts` 的 `handleRequest()`：過濾 `x-wxlsh-*` headers、讀取 `x-wxlsh-cookie` 並 push 為 `cookie` header 傳給 ASGI bridge（實作「Runtime handles HTTP request dispatch」requirement 的 cookie transport）
- [x] 1.4 修改 `usePythonRuntime.ts` 的 `handleRequest()`：收集 ASGI response 中的 `set-cookie` headers，以 newline-separated `X-Wxlsh-Set-Cookie` header 放在 JS Response 上（實作「Runtime handles HTTP request dispatch」requirement 的 Set-Cookie transport）
- [x] [P] 1.5 修改 `ChallengeLayout.vue` 的 `dispatchBridge`：呼叫 `transportCookie(headers)` 後再建立 Request；回傳時呼叫 `restoreSetCookie(res)` 還原 response headers
- [x] [P] 1.6 修改 `ChallengeLayout.vue` 的 `handleRequest`（SW 路徑）：呼叫 `transportCookie()` 處理 request headers；response 中將 `X-Wxlsh-Set-Cookie` 還原為 `set-cookie` entries
- [x] [P] 1.7 修改 `RepeatPanel.vue` 的 `parseRawRequest`：偵測 `Cookie` header 並轉為 `X-Wxlsh-Cookie`

## 2. BrowserPanel Cookie Jar 與 Redirect

- [x] 2.1 BrowserPanel Cookie Jar 實作：在 `BrowserPanel.vue` 新增 `cookieJar`（`Map<string, string>`）、`extractCookies()`（從 `X-Wxlsh-Set-Cookie` 解析）、`injectCookies()`（設定 `X-Wxlsh-Cookie`）（實作「BrowserPanel dispatches HTTP requests to the challenge runtime」requirement 的 cookie 管理）
- [x] 2.2 新增 `browserFetch()` 統一封裝：inject cookies → dispatch → extract cookies
- [x] 2.3 修改 `handleResponse()` 支援 3xx redirect 跟隨：偵測 `Location` header、遞迴呼叫 `browserFetch()`、上限 5 次（實作 redirect chain limit scenario）
- [x] 2.4 將 `navigate()`、`handleIframeMessage()` 中所有 `props.dispatch()` 呼叫改為 `browserFetch()`
- [x] 2.5 `extractCookies` 支援 cookie 刪除：偵測 `max-age=0` 或過期 `expires` 日期（實作 cookie deletion 的 scenario）

## 3. Traffic Log 顯示修正

- [x] 3.1 修改 `useTrafficLog.ts` 的 `wrap()`：讀取 `X-Wxlsh-Cookie` 並傳給 `buildDisplayHeaders`（實作「Traffic log displays request and response headers」requirement 的 request 方向）
- [x] 3.2 修改 `buildDisplayHeaders()`：新增 `cookie` 參數，在 display headers 中加入 `Cookie` header；過濾 `x-wxlsh-cookie` 不顯示
- [x] 3.3 修改 `wrap()` 中 response headers 建構：將 `x-wxlsh-set-cookie` 拆回個別 `Set-Cookie` entries 顯示

## 4. Attack Session Persistence 修正

- [x] 4.1 DataCloneError 修正：修改 `useChallengePersistence.ts` 的 `saveAttackSession()`，存入 IndexedDB 前用 `JSON.parse(JSON.stringify(session))` 深度複製，去除 Vue reactive proxy（實作「Attack sessions are persisted to IndexedDB」requirement）

## 5. usePythonRuntime FS 子目錄支援

- [x] 5.1 修改 `usePythonRuntime.ts` 的 `_init()`：寫入 FS entry 前，逐層呼叫 `FS.mkdir()` 建立父目錄（實作「Runtime initializes virtual filesystem from encrypted entries」requirement）

## 6. useWxlsh flags Map→Object 修正

- [x] 6.1 useWxlsh flags Map→Object 轉換：修改 `useWxlsh.ts` 的 `executeSingle()`，在 `JSON.stringify(flags)` 前檢查 `flags` 是否為 JS `Map`，若是則用 `Object.fromEntries()` 轉為 plain object（實作「Python-backed commands receive parsed flags」requirement）
