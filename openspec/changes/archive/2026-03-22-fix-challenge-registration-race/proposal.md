## Why

Challenge 頁面隨機出現 `{"error": "challenge not registered"}` 503 錯誤。根本原因是 Service Worker 的 fetch 攔截與 `REGISTER_CHALLENGE` 訊息之間存在 race condition —— fetch 事件可能在 challenge 註冊完成前觸發，導致 SW 的 registry 查無該 slug。此問題嚴重影響 UX，必須修復。

## What Changes

- **直接 dispatch**：`ChallengeLayout.vue` 的 `dispatch()` 改為直接呼叫 `runtime.handleRequest()`，繞過 SW round-trip。所有由 BrowserPanel / RepeatPanel 發起的程式化請求不再經過 SW，從根源消除主要 race condition。
- **SW 等待機制**：`challenge-sw.js` 的 `handleChallengeRequest()` 在 registry miss 時，不立即回傳 503，而是等待 `REGISTER_CHALLENGE` 到達（帶 timeout），作為 iframe 子資源載入等仍經 SW 路徑的 safety net。
- **修改 `service-worker-router` spec**：SW 的 dispatch 行為從「立即 503」改為「等待 registration 後重試」。
- **修改 `challenge-runtime-init` spec**：challenge page 的 dispatch 策略從「透過 fetch → SW relay」改為「直接呼叫 runtime」。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `service-worker-router`：SW fetch handler 在 registry miss 時新增等待機制，而非立即回傳 503
- `challenge-runtime-init`：challenge page dispatch 策略改為直接呼叫 runtime，繞過 SW round-trip

## Impact

- 受影響程式碼：
  - `docs/public/challenge-sw.js` — 修改 `handleChallengeRequest()` 加入等待邏輯
  - `.vitepress/theme/layouts/ChallengeLayout.vue` — 修改 `dispatch()` 直接呼叫 runtime
- 受影響 specs：`service-worker-router`、`challenge-runtime-init`
- 無 breaking changes、無新增依賴
