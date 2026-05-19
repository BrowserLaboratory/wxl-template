## 1. 直接 dispatch 繞過 SW

- [x] 1.1 修改 ChallengeLayout.vue 的 `dispatch` 函式，從 `fetch(request)` 改為直接呼叫 `runtime.handleRequest(request)`，當 runtime 未就緒時回傳 503（ChallengeLayout establishes MessageChannel with Service Worker — dispatch calls runtime directly）
- [x] 1.2 更新 ChallengeLayout 測試，驗證 dispatch 直接呼叫 runtime 而非 fetch（dispatch returns error response when runtime is not ready）

## 2. SW 等待機制

- [x] 2.1 在 `challenge-sw.js` 新增 `pendingRegistrations` Map 和 `waitForRegistration(slug, timeout)` 函式，實作 Service Worker waits for challenge registration on registry miss 的等待邏輯
- [x] 2.2 修改 `handleChallengeRequest` 在 registry miss 時呼叫 `waitForRegistration`，timeout 3 秒
- [x] 2.3 修改 `message` event listener，收到 `REGISTER_CHALLENGE` 時 resolve 所有 pending callbacks
- [x] 2.4 更新 router.ts（單元測試用的 TypeScript 版本）同步等待機制邏輯
- [x] 2.5 新增或更新 SW 相關測試，驗證：fetch 在 registration 前到達後等待成功、timeout 後回傳 503、多個 fetch 等待同一 slug
