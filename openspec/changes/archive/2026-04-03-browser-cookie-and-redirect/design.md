## Context

WXL 平台的 HTTP dispatch 鏈完全在瀏覽器內運行（Pyodide ASGI bridge → JS Request/Response → traffic log → UI render），不經過真實的 HTTP 伺服器。Fetch API 將 `Cookie`（request）和 `Set-Cookie`（response）列為 forbidden header，`new Request()` / `new Response()` 建構時會靜默過濾。此限制無法被任何標準 API 繞過。

## Goals / Non-Goals

**Goals:**

- BrowserPanel 能自動管理 cookie（攔截 Set-Cookie、注入 Cookie）和跟隨 302 redirect
- 所有 dispatch 路徑（Browser、Code、Terminal、Repeater、Service Worker）都能正確傳遞 cookie
- Network panel 正確顯示 Cookie / Set-Cookie header
- 修正 IndexedDB structured clone 對 Vue reactive proxy 的相容性問題
- usePythonRuntime 支援 FS 子目錄（`src/templates/` 等）

**Non-Goals:**

- iframe sandbox 中的 `document.cookie` 存取（XSS cookie stealing 需要另外的機制）
- 跨 Challenge 的 cookie 共享
- 修改 wxlsh WASM parser 的 Rust 原始碼

## Decisions

### Forbidden Header Transport 機制

使用自訂 `X-Wxlsh-Cookie` / `X-Wxlsh-Set-Cookie` header 做傳輸通道。在建立 `new Request()` 前將 `Cookie` 轉為 `X-Wxlsh-Cookie`，在 `usePythonRuntime.handleRequest` 中還原為 `cookie` 傳給 ASGI bridge。Response 方向同理。

**替代方案**：修改 dispatch 鏈不使用 Fetch API 的 Request/Response → 需要大幅重構 traffic log、attack session 等依賴 Response 物件的元件，成本過高。

### BrowserPanel Cookie Jar 實作

使用 component-level `Map<string, string>` 儲存 cookie。每次 dispatch 後呼叫 `extractCookies()`，每次 dispatch 前呼叫 `injectCookies()`。統一封裝為 `browserFetch()` 函式。

**替代方案**：在 ChallengeLayout 層級管理 cookie jar（全局共用）→ 不同 panel 的 cookie 管理需求不同（Repeater 不應自動帶 cookie），component-level 更合適。

### Redirect 跟隨

在 `handleResponse` 中遞迴處理 3xx response，上限 5 次。Redirect 請求統一使用 GET method（符合瀏覽器對 301/302/303 的行為）。

### DataCloneError 修正

`saveAttackSession` 使用 `JSON.parse(JSON.stringify(session))` 去除 Vue reactive proxy。

**替代方案**：使用 Vue 的 `toRaw()` → 只解除一層 proxy，nested array（如 headers `[string, string][]`）仍是 proxy。`JSON.parse(JSON.stringify())` 深度去除所有 proxy。

### useWxlsh flags Map→Object 轉換

`serde_wasm_bindgen::to_value()` 將 Rust `HashMap` 序列化為 JS `Map`。`JSON.stringify(Map)` 回傳 `'{}'`。在傳給 Python 前用 `Object.fromEntries(flags)` 轉換。

**替代方案**：修改 Rust WASM 程式碼使用 `serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true)` → 需要重新編譯 WASM，且影響所有使用 HashMap 的地方。JS 端轉換更安全。

## Risks / Trade-offs

- **[Risk] X-Wxlsh-* header 在所有 dispatch 路徑都需要處理** → 已在 BrowserPanel、dispatchBridge、handleRequest、RepeatPanel 四個入口點處理。新增 dispatch 路徑時需記得加入 transport 邏輯。
- **[Risk] `JSON.parse(JSON.stringify())` 效能** → 對 attack session 資料量（通常 < 100 events）影響可忽略。
- **[Trade-off] Cookie jar 不支援 path/domain/expires 屬性** → 目前所有 challenge 都是 same-origin，簡化實作足夠。未來如需更精確的 cookie 管理可擴充。
