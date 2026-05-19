## Why

`swReady` ref 在 `setup()` 階段初始化為 `false`（Service Worker 尚未 activate），但 `controllerchange` 事件可能在 `setup()` 與 `onMounted()` 之間的空窗期觸發——此時監聽器尚未掛載，事件遺漏導致 `swReady` 永遠為 `false`，按鈕（Go、Repeater）始終處於 disabled 狀態。

## What Changes

- 在 `onMounted` 掛載 `controllerchange` listener 之後，立即檢查 `navigator.serviceWorker.controller` 是否已存在，補上 race condition 的缺口
- 對首次造訪（SW 尚在安裝中）的場景，透過 `navigator.serviceWorker.ready` Promise 等待 SW 就緒後再檢查 controller 狀態

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-runtime-init`: 增加 `swReady` fallback 邏輯，確保 `controllerchange` 事件遺漏時仍能正確解鎖 UI

## Impact

- 受影響程式碼：`.vitepress/theme/layouts/ChallengeLayout.vue`（`onMounted` 區塊，約 283–310 行）
- 受影響規格：`challenge-runtime-init`
