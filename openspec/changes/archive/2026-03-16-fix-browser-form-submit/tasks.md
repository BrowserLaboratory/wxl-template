## 1. BrowserPanel 重構：抽取 handleResponse 共用函式

- [x] 1.1 在 `BrowserPanel.vue` 中將 `navigate()` 內的回應處理邏輯抽取為私有函式 `handleResponse(res, resolvedUrl)`，實作「抽取 handleResponse 共用函式」設計決策；`navigate()` 改為呼叫此函式

## 2. Browser Panel form submit 攔截實作

- [x] 2.1 在 `attachIframeLinkInterceptor` 中新增 `submit` 事件監聽，實作「攔截 form submit 而非注入 `<base>` tag」設計決策；攔截到 submit 後 `preventDefault()`，取得 form 的 action、method、enctype
- [x] 2.2 實作「序列化策略：依 enctype 分支」：GET 方法附加 URLSearchParams 至 query string；POST + `application/x-www-form-urlencoded` 以 `URLSearchParams` body 送出；POST + `multipart/form-data` 以 `FormData` body 送出（不手動設 Content-Type）
- [x] 2.3 確認 form action 相對路徑解析邏輯：以 `https://challenge-<slug>.localhost/` 為 base，`action` 缺失時使用 `url.value`，實作「Browser Panel intercepts HTML form submissions inside the iframe」需求

## 3. 單元測試（TDD）

- [x] 3.1 在 `tests/unit/components/BrowserPanel.test.ts` 新增測試：POST form with default enctype is submitted，驗證 `dispatch` 被呼叫且 Content-Type 為 `application/x-www-form-urlencoded`
- [x] 3.2 新增測試：POST form with multipart/form-data enctype is submitted，驗證 body 為 `FormData` 且未手動設 Content-Type
- [x] 3.3 新增測試：GET form appends fields to query string，驗證 dispatch 的 URL 包含正確 query string
- [x] 3.4 新增測試：form action relative URL resolves to challenge origin（`/login` → `https://challenge-sqli-demo.localhost/login`）
- [x] 3.5 新增測試：form with no action attribute submits to current URL（url.value）

## 4. 驗證

- [x] 4.1 執行 `pnpm test --run tests/unit/components/BrowserPanel.test.ts`，確認所有測試通過
- [x] 4.2 執行 `pnpm test`，確認全體 148+ 測試通過
