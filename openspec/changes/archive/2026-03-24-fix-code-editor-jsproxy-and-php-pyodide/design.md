## Context

Code Editor（CodeEditorPanel）和 Terminal（WxlshPanel）在所有挑戰類型下都無法正常使用。Python 挑戰會報 JsProxy 錯誤，PHP 挑戰則因為沒有 Pyodide 而永遠 Loading。

目前 `ChallengeLayout.vue` 的 `initRuntime()` 在 line 204-211 只在 `backend === 'flask' || 'fastapi'` 時載入 Pyodide，且在 line 240-242 透過 `runtime instanceof PythonRuntime` 判斷是否設定 `pyodideInstance`。PHP 挑戰走 `PhpRuntime` 分支，完全不碰 Pyodide。

## Goals / Non-Goals

**Goals:**

- 修復 Python 挑戰中 Code Editor 的 `TypeError: unhashable type: 'pyodide.ffi.JsProxy'`
- 讓 PHP 挑戰也能使用 Code Editor 和 Terminal
- 確保所有挑戰的 code/terminal 執行都被記錄到 attack session

**Non-Goals:**

- 不改變 PHP runtime 本身的行為
- 不為 PHP 挑戰提供 PHP 語言的 code editor（學生仍然用 Python 寫攻擊腳本）
- 不修改 CodeEditorPanel 的 `requests` stub API 介面

## Decisions

### 決策 1：修正 requests stub 的 namespace 存取方式

**問題**：`buildRequestsStub()` 中 `from js import _wxlsh_code_dispatch` 嘗試從 `globalThis` 取函式，但函式是透過 `py.globals.set()` 設定在 Python `__main__.__dict__`。

**修正**：移除 `from js import _wxlsh_code_dispatch`，改為直接存取 Python global（與 `useWxlsh.ts` 中 `_wxlsh_bridge` 的做法一致）。

在 `_dispatch` method 中改為：
```python
async def _dispatch(self, method, url, **kwargs):
    # _wxlsh_code_dispatch is set in __main__ via py.globals.set()
    r = await _wxlsh_code_dispatch(method, url, list(headers.items()), body or '')
```

移除 `from js import _wxlsh_code_dispatch` 這行即可。

### 決策 2：PHP 挑戰獨立載入 Pyodide 作為工具層

**選擇**：在 `initRuntime()` 完成後（無論 backend 類型），如果 `pyodideInstance` 仍為 null，額外載入一個獨立的 Pyodide 實例。

**實作方式**：在 `initRuntime()` 的結尾（`runtimeReady.value = true` 之後），加入：

```typescript
// 無論 backend 類型，確保 Pyodide 可用供 Code Editor / Terminal 使用
if (!pyodideInstance.value) {
  await import('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js')
  const loadPyodide = (globalThis as any).loadPyodide
  if (typeof loadPyodide === 'function') {
    const toolsPyodide = await loadPyodide()
    pyodideInstance.value = toolsPyodide
  }
}
```

**替代方案**：
- (A) 在 PHP 分支前就載入 Pyodide → 拒絕：會增加 PHP 挑戰的初始載入時間，Pyodide 很大
- (B) 延遲到使用者第一次點擊 Code/Terminal tab 才載入 → 可行但增加複雜度，目前先用簡單方案

**注意**：這個工具用 Pyodide 實例是「乾淨的」— 沒有載入 Flask/FastAPI 套件，也沒有執行 challenge app code。學生的 Python 程式碼在這個乾淨的 Pyodide 中執行，但 `requests` stub 仍透過 `dispatch()` 路由到實際的 PHP runtime 處理 HTTP 請求。

### 決策 3：Code Editor 的 dispatch 在 PHP 挑戰下走正常路徑

PHP 挑戰中 `codeDispatch`（透過 `makeSourceDispatch('code')`）最終會呼叫 `PhpRuntime.handleRequest()`。`requests` stub 的 `_wxlsh_code_dispatch` bridge 呼叫 `props.dispatch(req)`，這會路由到正確的 runtime。不需要額外處理。

Terminal 的 `curl` command 也是同理 — `terminalDispatch` 路由到 `PhpRuntime`。

## Risks / Trade-offs

- **[Risk] PHP 挑戰載入 Pyodide 增加頁面體積** → Pyodide CDN 約 15MB。PHP 挑戰原本不需要載入它。Mitigation：Pyodide 載入是 async 的，不阻塞 runtime 準備；且 Code/Terminal 只在使用者真正需要工具時才有意義。
- **[Risk] 工具用 Pyodide 實例沒有載入 micropip/sqlite3** → 學生如果在 Code Editor 中 `import sqlite3` 會失敗。Mitigation：這是預期行為 — Code Editor 的用途是寫攻擊腳本（用 `requests` 發 HTTP），不是直接操作資料庫。
- **[Trade-off] 簡單方案 vs 延遲載入** → 選擇在 `initRuntime()` 結尾同步載入，而非延遲到第一次使用。這讓 PHP 挑戰的初始載入稍慢，但實作最簡單且與 Python 挑戰行為一致。
