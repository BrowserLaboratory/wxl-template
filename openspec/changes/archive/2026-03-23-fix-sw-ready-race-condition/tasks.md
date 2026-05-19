## 1. 在 onMounted 新增同步 controller 檢查

- [x] 1.1 在 ChallengeLayout.vue 的 `onMounted` 中，掛載 `controllerchange` listener 之後加入同步檢查 `navigator.serviceWorker.controller`，若非 null 則立即設定 `swReady = true`（對應 spec: Challenge page initializes WASM runtime on mount — swReady unlocks when controllerchange fires before listener is attached）

## 2. 對首次造訪追加 navigator.serviceWorker.ready fallback

- [x] 2.1 當同步檢查 controller 仍為 null 時，透過 `navigator.serviceWorker.ready.then()` 等待 SW active 後再次檢查 controller 並設定 `swReady`（對應 spec: swReady unlocks on first visit via ready promise）

## 3. 測試

- [x] 3.1 在 `tests/unit/layouts/ChallengeLayout.test.ts` 新增測試：模擬 `controllerchange` 在 setup 與 onMounted 之間觸發的場景，驗證 swReady 仍能正確解鎖
- [x] 3.2 新增測試：模擬首次造訪（controller 為 null），驗證 `navigator.serviceWorker.ready` fallback 能正確設定 swReady
- [x] 3.3 執行完整測試套件確認無 regression
