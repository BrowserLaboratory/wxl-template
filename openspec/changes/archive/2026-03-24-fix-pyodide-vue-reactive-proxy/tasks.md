## 1. 修復 Vue reactive proxy 導致 Pyodide globals.set() 失敗

- [x] 1.1 在 `ChallengeLayout.vue` 中將 `pyodideInstance` 從 `ref()` 改為 `shallowRef()`，並新增 `shallowRef` 到 import（對應：決策 1：使用 shallowRef 取代 ref 儲存 Pyodide 實例）

## 2. 修復 hard refresh 後 swReady 永遠為 false

- [x] 2.1 在 `ChallengeLayout.vue` 的 `onMounted` SW fallback 中，改為 `navigator.serviceWorker.controller || reg.active` 判斷（對應：決策 2：swReady fallback 改為檢查 reg.active）

## 3. Code Editor bridge 改用 object pattern

- [x] 3.1 在 `CodeEditorPanel.vue` 中將 dispatch bridge 從 raw async function 改為 `{ call: asyncFn }` 物件，Python stub 改用 `_wxlsh_code_bridge.call()`（對應：決策 3：Code Editor bridge 改用 object pattern）
- [x] 3.2 更新 `CodeEditorPanel.test.ts` 中的 bridge 變數名驗證

## 4. 驗證

- [x] 4.1 執行全部單元測試確認無 regression（259 tests pass）
