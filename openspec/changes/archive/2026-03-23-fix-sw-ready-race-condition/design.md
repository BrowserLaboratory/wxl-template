## Context

ChallengeLayout.vue 使用兩道 readiness gate（`runtimeReady` + `swReady`）控制互動元件的啟用時機。`swReady` 在 `setup()` 階段以 `navigator.serviceWorker.controller != null` 初始化，之後僅透過 `controllerchange` 事件更新為 `true`。

問題在於 Vue 的元件生命週期：`setup()` 與 `onMounted()` 之間存在時間差，若 Service Worker 在此空窗期完成 `skipWaiting()` → `activate` → `clients.claim()`，`controllerchange` 事件會在監聽器掛載之前觸發並遺漏。

## Goals / Non-Goals

**Goals:**

- 消除 `controllerchange` 事件遺漏造成按鈕永久 disabled 的 race condition
- 涵蓋首次造訪（SW 尚在安裝）與重複造訪（SW 已 controlling）兩種場景
- 不改變 SW 本身的行為或註冊邏輯

**Non-Goals:**

- 不重構 `toolsDisabled` 的整體架構
- 不處理 SW 註冊失敗的錯誤回復（已有 console.warn 處理）

## Decisions

### 在 onMounted 新增同步 controller 檢查

在掛載 `controllerchange` listener 之後，立即同步檢查 `navigator.serviceWorker.controller`。若已存在（表示事件在 `setup()` → `onMounted()` 之間被觸發），直接設定 `swReady.value = true`。

**替代方案**：將 `swReady` 的初始化移至 `onMounted`。但這會改變 ref 的響應式時序，可能影響其他依賴 `swReady` 的 computed。

### 對首次造訪追加 navigator.serviceWorker.ready fallback

當同步檢查 `controller` 仍為 `null`（首次造訪，SW 尚在安裝中），透過 `navigator.serviceWorker.ready.then()` 等待 SW 變為 active 後再次檢查 controller 狀態。

**替代方案**：使用 `setInterval` 輪詢 controller。不採用，因為 `ready` Promise 是瀏覽器原生 API，語意更明確且不需清理。

## Risks / Trade-offs

- **[重複設定]** `swReady` 可能被多個路徑同時設為 `true`（初始值 + fallback + `controllerchange`）→ 無影響，Vue ref 設定冪等，不會觸發多餘重渲染
- **[ready Promise 時序]** `navigator.serviceWorker.ready` resolve 時 `clients.claim()` 可能尚未完成 → `controllerchange` listener 仍在監聽，會補上這個空窗
