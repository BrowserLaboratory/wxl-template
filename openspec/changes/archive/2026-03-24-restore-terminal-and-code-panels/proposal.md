## Why

Terminal（wxlsh）和 Code Editor 面板已完整實作，但在 commit 79b9e80 中被暫時停用（HTML/JS 註解）。這兩個面板是攻擊工具鏈的核心組成：Terminal 提供 command-line 操作（curl、decode、encode），Code Editor 提供 Python 腳本執行環境。目前使用者只能透過 Browser 和 Repeater 發起攻擊，缺少程式化攻擊手段。此外，現有的 attack session 記錄系統只追蹤 HTTP 請求（source: `'browser' | 'repeater'`），無法記錄 terminal 指令執行和 code 執行的軌跡，導致匯出的 session 無法完整還原使用者的攻擊流程。

## What Changes

- 取消 `ChallengeLayout.vue` 中 Terminal 和 Code tab 定義及 template 面板的註解，恢復為可用狀態
- 為 Terminal 和 Code 面板建立帶 source 標記的 dispatch wrapper（`makeSourceDispatch('terminal')` / `makeSourceDispatch('code')`），讓其 HTTP 請求被正確記錄到 attack session
- 擴充 `AttackEvent` 的 `http_request.source` 類型，新增 `'terminal' | 'code'`
- 新增 `terminal_command` 事件類型，記錄 terminal 指令、輸出、是否錯誤
- 新增 `code_execution` 事件類型，記錄 Python 程式碼、輸出、是否錯誤、執行時間
- 在 `useAttackSession` 新增 `addTerminalCommand()` 和 `addCodeExecution()` 方法
- `WxlshPanel` 新增 `onCommandExecuted` callback prop，在指令執行後通知 parent
- `CodeEditorPanel` 新增 `onCodeExecuted` callback prop，在程式碼執行後通知 parent（callback 位於 `finally` 區塊最前面，避開 stdout 還原失敗風險）
- 更新 `WRITEUP_SYSTEM_PROMPT`，加入 `terminal_command` 和 `code_execution` 事件的說明

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `attack-session-tracking`: 擴充 `AttackEvent` union type，新增 `terminal_command` 和 `code_execution` 事件類型；`http_request.source` 擴充為 `'browser' | 'repeater' | 'terminal' | 'code'`；新增 `addTerminalCommand()` 和 `addCodeExecution()` 方法；更新匯出 system prompt
- `challenge-layout`: 取消 Terminal/Code 面板的註解；新增 `terminalDispatch` / `codeDispatch` source dispatch wrapper；傳遞 recording callback props 給兩個面板
- `challenge-ui`: tab 數量從 3 個恢復為 5 個（Browser、Network、Repeater、Terminal、Code）
- `wxlsh-terminal`: 新增 `onCommandExecuted` callback prop，在指令執行後回報 command/output/error
- `code-editor-panel`: 新增 `onCodeExecuted` callback prop，在程式碼執行後回報 code/output/error/duration

## Impact

- 受影響檔案：
  - `.vitepress/theme/composables/useChallengePersistence.ts` — `AttackEvent` type 擴充
  - `.vitepress/theme/composables/useAttackSession.ts` — 新增方法 + system prompt 更新
  - `.vitepress/theme/layouts/ChallengeLayout.vue` — 取消註解 + dispatch + callback 整合
  - `.vitepress/theme/components/WxlshPanel.vue` — 新增 callback prop + 呼叫點
  - `.vitepress/theme/components/CodeEditorPanel.vue` — 新增 callback prop + 呼叫點（注意 error path）
  - `tests/unit/layouts/ChallengeLayout.test.ts` — 更新面板和 tab 相關測試
  - `tests/unit/components/WxlshPanel.test.ts` — 新增 callback 測試
  - `tests/unit/components/CodeEditorPanel.test.ts` — 新增 callback 測試
  - `tests/unit/composables/useAttackSession.test.ts` — 新增事件類型測試（如存在）
- 不需要 IndexedDB schema 升版（AttackEvent 是 JSON value，不影響 object store 結構）
- 不影響既有 Browser/Repeater 功能
