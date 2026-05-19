## Problem

Code Editor 和 Terminal 面板在所有挑戰類型下都因為 `TypeError: unhashable type: 'pyodide.ffi.JsProxy'` 而無法使用。`py.globals.set()` 連設定一個普通字串都會失敗。此外，hard refresh（`Cmd+Shift+R`）後 `swReady` 永遠為 `false`，導致面板卡在 "Loading runtime..."。

## Root Cause

### Bug 1：Vue reactive proxy 包裝 Pyodide 實例

`ChallengeLayout.vue` 使用 `ref<PyodidePublicAPI | null>(null)` 儲存 Pyodide 實例。Vue 3 的 `ref()` 在 setter 中會將物件值透過 `reactive()` 包裝成 JavaScript `Proxy`。這個 Vue Proxy 包裝了 Pyodide 的 `PyProxy`，形成雙重 proxy（Vue Proxy → Pyodide PyProxy），導致 `globals.set()` 在 Pyodide 內部觸發 JsProxy hash 操作而失敗。

### Bug 2：hard refresh 後 `swReady` 永遠為 false

`swReady` 的設定邏輯僅檢查 `navigator.serviceWorker.controller`。在 hard refresh 後，瀏覽器刻意將 `controller` 設為 `null`（繞過 SW），即使 SW 已 active。但此專案的 `dispatch()` 直接呼叫 runtime（不經過 SW），`registerWithSW()` 也使用 `reg.active.postMessage()`（不需要 controller），因此只需 SW active 即可。

### Bug 3：Code Editor dispatch bridge 傳遞 raw async function

`CodeEditorPanel.vue` 透過 `py.globals.set('_wxlsh_code_dispatch', asyncFn)` 傳遞 raw async function。改為與 Terminal 一致的 object pattern `{ call: asyncFn }` 更安全。

## Proposed Solution

1. 將 `pyodideInstance` 從 `ref()` 改為 `shallowRef()` — 不 deep-reactive 包裝 Pyodide 實例
2. `swReady` fallback 改為在 `navigator.serviceWorker.ready` resolve 後，只要 `reg.active` 存在就設定 `swReady = true`
3. Code Editor dispatch bridge 改用 `{ call: asyncFn }` object pattern，Python stub 改用 `_wxlsh_code_bridge.call()`

## Success Criteria

1. 所有挑戰類型（Flask/FastAPI/PHP）的 Code Editor 可正常執行 `print("Hello")` 並顯示輸出
2. hard refresh 後 runtime 不再卡在 "Loading runtime..."
3. 所有 259 個單元測試通過

## Impact

- 受影響檔案：
  - `.vitepress/theme/layouts/ChallengeLayout.vue` — `ref` → `shallowRef`、`swReady` fallback 修正
  - `.vitepress/theme/components/CodeEditorPanel.vue` — bridge object pattern、stub 更新
  - `tests/unit/components/CodeEditorPanel.test.ts` — 更新 bridge 變數名
  - `tests/unit/layouts/ChallengeLayout.test.ts` — 已有測試覆蓋
