## 1. 修正 Code Editor requests stub 的 JsProxy 錯誤

- [x] 1.1 在 `CodeEditorPanel.vue` 的 `buildRequestsStub()` 中，移除 `from js import _wxlsh_code_dispatch`，改為直接從 Python globals 存取（對應：Code Editor Panel executes Python via Pyodide、決策 1：修正 requests stub 的 namespace 存取方式）
- [x] 1.2 撰寫單元測試驗證 requests stub 正確存取 dispatch bridge（對應：requests stub accesses dispatch bridge from Python globals）

## 2. PHP 挑戰獨立載入 Pyodide

- [x] 2.1 在 `ChallengeLayout.vue` 的 `initRuntime()` 結尾，當 `pyodideInstance` 為 null 時獨立載入 Pyodide 實例（對應：ChallengeLayout loads Pyodide for all backend types、決策 2：PHP 挑戰獨立載入 Pyodide 作為工具層）
- [x] 2.2 撰寫 ChallengeLayout 單元測試：驗證 PHP backend 也會設定 pyodideInstance（對應：PHP challenge provides Pyodide to Code Editor and Terminal）
- [x] 2.3 撰寫 ChallengeLayout 單元測試：驗證 Python backend 不會重複載入 Pyodide（對應：Python challenge reuses runtime Pyodide）

## 3. 整合驗證

- [x] 3.1 驗證 ChallengeLayout gates all tool panels on both runtimeReady and swReady 在 PHP 挑戰下也正確運作（對應：決策 3：Code Editor 的 dispatch 在 PHP 挑戰下走正常路徑）
- [x] 3.2 執行全部單元測試確認無 regression
