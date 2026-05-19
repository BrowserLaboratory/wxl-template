## 1. 擴充 AttackEvent 類型與 useAttackSession 方法

- [x] 1.1 擴充 `AttackEvent` union type：在 `useChallengePersistence.ts` 中依決策 5：新增 `terminal_command` 和 `code_execution` 事件結構，將 `http_request.source` 從 `'browser' | 'repeater'` 擴充為 `'browser' | 'repeater' | 'terminal' | 'code'`（對應：useAttackSession records HTTP request events with source attribution）
- [x] 1.2 在 `useAttackSession.ts` 新增 `addTerminalCommand(command, output, error)` 方法（對應：useAttackSession records terminal command events）
- [x] 1.3 在 `useAttackSession.ts` 新增 `addCodeExecution(code, output, error, duration)` 方法（對應：useAttackSession records code execution events）
- [x] 1.4 更新 `WRITEUP_SYSTEM_PROMPT` 常數，加入 `terminal_command` 和 `code_execution` 事件類型的說明（對應：useAttackSession provides session export as JSON）
- [x] 1.5 撰寫 `addTerminalCommand` 和 `addCodeExecution` 的單元測試

## 2. WxlshPanel 新增 callback prop

- [x] 2.1 在 `WxlshPanel.vue` 的 `defineProps` 新增 `onCommandExecuted` optional callback prop（對應：WxlshPanel reports command execution via callback prop）
- [x] 2.2 在 `handleEnter()` 中，`wxlsh.execute(line)` resolve 後、terminal display 寫入前呼叫 `onCommandExecuted`（對應：決策 4：WxlshPanel callback 位置——execute 完成後立即呼叫）
- [x] 2.3 撰寫 WxlshPanel callback 相關單元測試：成功指令、錯誤指令、空輸入不觸發、callback 未傳入不報錯

## 3. CodeEditorPanel 新增 callback prop

- [x] 3.1 在 `CodeEditorPanel.vue` 的 `defineProps` 新增 `onCodeExecuted` optional callback prop（對應：CodeEditorPanel reports code execution via callback prop）
- [x] 3.2 在 `runCode()` 中新增 `startTime` 計時和 `isError` boolean flag，注意 CodeEditorPanel 風險區域中的 error path（對應：決策 3：CodeEditorPanel callback 位置——放在 finally 區塊最前面）
- [x] 3.3 在 `runCode()` 的 `finally` 區塊最前面（stdout 還原之前）呼叫 `onCodeExecuted`，使用 `isError` flag 而非字串前綴判定
- [x] 3.4 撰寫 CodeEditorPanel callback 相關單元測試：成功執行、異常執行、silent exit 不觸發、callback 未傳入不報錯、callback 在 stdout 還原前執行

## 4. ChallengeLayout 整合

- [x] 4.1 取消 tab 定義中 Terminal 和 Code 的 JS 註解，恢復為 5 個 tab（對應：ChallengeLayout provides three switchable interaction panels）
- [x] 4.2 建立 `terminalDispatch = makeSourceDispatch('terminal')` 和 `codeDispatch = makeSourceDispatch('code')`（對應：ChallengeLayout provides source-attributed dispatch for Terminal and Code panels、決策 1：為 Terminal 和 Code 建立 source dispatch wrapper）
- [x] 4.3 取消 Template 中 Terminal 和 Code 面板的 HTML 註解，將 WxlshPanel 的 dispatch 改為 `terminalDispatch`、CodeEditorPanel 的 dispatch 改為 `codeDispatch`
- [x] 4.4 建立 `onCommandExecuted` 和 `onCodeExecuted` callback 並傳入對應面板（對應：ChallengeLayout wires recording callbacks for Terminal and Code panels、決策 2：透過 callback prop 記錄非 HTTP 事件）
- [x] 4.5 更新 ChallengeLayout 相關測試：驗證 5 個 tab 存在、Terminal/Code 面板渲染、dispatch source attribution

## 5. 規格對齊驗證

- [x] 5.1 驗證 challenge-layout spec：Challenge layout renders a left-right split view（5 tabs）、ChallengeLayout gates all tool panels on both runtimeReady and swReady（5 panels disabled）
- [x] 5.2 執行全部單元測試確認無 regression
