## Problem

Code Editor 面板有兩個 bug 導致所有挑戰都無法使用：

1. **Python 挑戰（Flask/FastAPI）**：執行任何程式碼（包含 `print("Hello")`）都報 `TypeError: unhashable type: 'pyodide.ffi.JsProxy'`。錯誤在注入 `buildRequestsStub()` 時發生。
2. **PHP 挑戰**：Code 面板 Run 按鈕永遠顯示 "Loading..."，因為 PHP runtime 不載入 Pyodide，`pyodideInstance` 永遠為 `null`。

同時，wxlsh Terminal 面板在 PHP 挑戰下也有相同的 Loading 問題（依賴 Pyodide 執行 Python-backed commands）。

## Root Cause

### Bug 1：JsProxy namespace 不匹配

`CodeEditorPanel.vue` 的 `buildRequestsStub()` 中：
- JS 端透過 `py.globals.set('_wxlsh_code_dispatch', asyncFn)` 將函式設定在 Python 的 `__main__.__dict__`
- Python stub 卻用 `from js import _wxlsh_code_dispatch` 嘗試從 `globalThis`（JS 全域）取得函式
- 這兩個是不同的 namespace，導致 import 失敗或取到錯誤的 JsProxy 物件

對比 `useWxlsh.ts`（Terminal — 運作正常）的做法：
- `py.globals.set('_wxlsh_bridge', bridge)` 設定在 Python globals
- Python 端直接以 `_wxlsh_bridge` 存取（不用 `from js import`）

### Bug 2：PHP 挑戰不載入 Pyodide

`ChallengeLayout.vue` 的 `initRuntime()` 只在 `backend === 'flask' || backend === 'fastapi'` 時載入 Pyodide。PHP 挑戰使用 `PhpRuntime`，不會設定 `pyodideInstance`。Code Editor 和 Terminal 的 disabled 條件包含 `!props.pyodide`，永遠為 `true`。

## Proposed Solution

### Fix 1：修正 requests stub 的 namespace 存取

將 `buildRequestsStub()` 中的 `from js import _wxlsh_code_dispatch` 改為直接從 Python `__main__` globals 存取，與 `useWxlsh.ts` 的做法一致。

### Fix 2：PHP 挑戰獨立載入 Pyodide

在 `ChallengeLayout.vue` 的 `initRuntime()` 中，無論 backend 類型為何，都載入 Pyodide 實例供 Code Editor 和 Terminal 使用。對於 PHP 挑戰，Pyodide 僅作為工具層（執行學生的 Python 腳本和 terminal 指令），不處理 challenge runtime 本身。

## Success Criteria

1. Python 挑戰（Flask/FastAPI）的 Code Editor 可以正常執行 `print("Hello")` 並顯示輸出
2. Python 挑戰的 Code Editor 可以使用 `requests.get()` stub 發送 HTTP 請求
3. PHP 挑戰的 Code Editor Run 按鈕可用，能執行 Python 程式碼
4. PHP 挑戰的 Terminal 面板可用，能執行 wxlsh 指令（含 curl）
5. 所有挑戰中，Code Editor 和 Terminal 的執行記錄都正確寫入 attack session（`code_execution` 和 `terminal_command` 事件）
6. 現有的 256 個單元測試全部通過

## Impact

- 受影響檔案：
  - `.vitepress/theme/components/CodeEditorPanel.vue` — 修正 requests stub 的 namespace 存取
  - `.vitepress/theme/layouts/ChallengeLayout.vue` — PHP 挑戰獨立載入 Pyodide
  - `.vitepress/theme/composables/useWxlsh.ts` — 可能需要調整 PHP 挑戰的 bridge 初始化
  - `tests/unit/components/CodeEditorPanel.test.ts` — 更新測試
  - `tests/unit/layouts/ChallengeLayout.test.ts` — 新增 PHP backend Pyodide 載入測試
