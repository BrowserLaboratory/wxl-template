## 1. 情境標記（BrowserPanel）與 header 補全（useTrafficLog）

- [x] 1.1 在 `BrowserPanel.vue` 中定義 `withContext(init, context, referer?)` helper，將情境以 `X-Wxlsh-Context` / `X-Wxlsh-Referer` metadata header 標記，取代原 `buildBrowserRequest` 方案（forbidden headers 無法設定的限制）
- [x] 1.2 在 `useTrafficLog.ts` 中實作 `buildDisplayHeaders()`，讀取 metadata header 並依情境組合完整的靜態 + 動態顯示用 header（User-Agent、Host、Accept、Referer、Origin、Sec-Fetch-*、Sec-Ch-Ua-* 等）

## 2. BrowserPanel 呼叫點替換

- [x] 2.1 網址列 GET → `withContext({ method: 'GET' }, 'navigation')`，context 為 navigation
- [x] 2.2 iframe 連結點擊 GET → `withContext({ method: 'GET' }, 'link', referer)`
- [x] 2.3 Form GET 提交 → `withContext({ method: 'GET' }, 'form-get', referer)`
- [x] 2.4 Form POST（urlencoded）→ `withContext({ method, body, headers: {...} }, 'form-post', referer)`
- [x] 2.5 Form POST（multipart）→ `withContext({ method, body }, 'form-post', referer)`（不手動設 Content-Type）

## 3. 測試

- [x] 3.1 在 `useTrafficLog.test.ts` 中新增測試，驗證 `buildDisplayHeaders` 依情境正確注入完整 header（navigation、link、form-get、form-post）
- [x] 3.2 更新 `BrowserPanel.test.ts`，驗證 dispatch 被呼叫時 request 帶有正確的 `X-Wxlsh-Context` header（確保情境標記正確傳遞）
