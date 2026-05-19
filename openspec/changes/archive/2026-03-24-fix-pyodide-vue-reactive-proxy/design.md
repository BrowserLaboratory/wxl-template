## Context

透過 systematic debugging（Phase 1 diagnostic instrumentation）定位到錯誤發生在 `py.globals.set()` 呼叫本身，而非 requests stub 或 user code。進一步測試確認連設定純字串都失敗，最終確認根因為 Vue `ref()` 的 reactive proxy 雙重包裝 Pyodide PyProxy。

## Goals / Non-Goals

**Goals:**

- 修復 Vue reactive proxy 導致的 Pyodide `globals.set()` 失敗
- 修復 hard refresh 後 `swReady` 永遠為 false 的問題
- 統一 Code Editor 和 Terminal 的 JS bridge pattern

**Non-Goals:**

- 不修改 Pyodide 版本或 Service Worker 檔案
- 不修改面板的功能行為

## Decisions

### 決策 1：使用 shallowRef 取代 ref 儲存 Pyodide 實例

Vue `ref()` 會在 setter 中呼叫 `toReactive()`，將物件值包裝成 `reactive()` Proxy。Pyodide 實例是 exotic JS object（本身包含 PyProxy），被 Vue Proxy 二次包裝後，所有 Python-JS 跨界呼叫都會異常。

`shallowRef()` 只追蹤 `.value` 的賦值，不對內部值進行 reactive 包裝。這是 Vue 官方推薦的做法，用於外部庫物件（如 CodeMirror EditorView、xterm Terminal）。

### 決策 2：swReady fallback 改為檢查 reg.active

`dispatch()` 直接呼叫 `runtime.handleRequest()`（不經過 SW fetch interception），`registerWithSW()` 使用 `reg.active.postMessage()`（不需要 `controller`）。因此只需要 SW 處於 active 狀態即可解鎖面板。

### 決策 3：Code Editor bridge 改用 object pattern

與 Terminal 的 `_wxlsh_bridge` 一致，將 dispatch 函式包裝在 `{ call: asyncFn }` 物件中。Python stub 透過 `_wxlsh_code_bridge.call(...)` 呼叫。

## Risks / Trade-offs

- **[Risk] shallowRef 不追蹤 Pyodide 內部變化** → 不影響，因為 `pyodideInstance` 只在初始化時設定一次，之後不變。
- **[Risk] swReady 在 SW 未實際控制頁面時設為 true** → dispatch 不依賴 SW control，Browser panel 的 iframe 在後續 navigation 會自動被 SW 控制。
