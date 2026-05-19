## Context

Terminal（WxlshPanel）和 Code Editor（CodeEditorPanel）面板在 commit 79b9e80 中被暫時停用，方式為 HTML 註解和 JS 註解。兩個元件本身完整實作，所有支援基礎設施（composables、WASM parser、IndexedDB persistence、specs、tests）皆就位。

目前的 dispatch 架構：
- Browser 和 Repeater 面板透過 `makeSourceDispatch(source)` 包裝，HTTP 請求同時寫入 traffic log 和 attack session（帶 source 標記）
- Terminal 和 Code 面板原本接收 `trackedDispatch`（無 source 包裝），HTTP 請求只進 traffic log、不進 attack session
- Attack session 的 `AttackEvent` union type 只支援 4 種事件（`challenge_start`、`http_request`、`flag_attempt`、`challenge_solved`），無法記錄 terminal 指令執行或 code 執行

### CodeEditorPanel 風險區域

CodeEditorPanel 的 `runCode()` 函式有多條 error path 需要特別注意：
1. **Silent exit**：`pyodide` 為 null 或 `editorView` 為 null 時直接 return，無任何使用者回饋
2. **stdout 還原失敗**：finally 區塊中 `sys.stdout = sys.__stdout__` 的還原被 `catch { /* ignore */ }` 靜默吞錯
3. **JsProxy 轉換**（已修復 0bed487）：`_wxlsh_code_dispatch` 返回的 JS 物件需要 `.to_py()` 轉換

## Goals / Non-Goals

**Goals:**

- 恢復 Terminal 和 Code 面板為可用狀態
- 讓 Terminal/Code 面板的 HTTP 請求被正確記錄到 attack session（source attribution）
- 新增 `terminal_command` 和 `code_execution` 事件類型，完整記錄使用者的非 HTTP 操作
- 更新匯出 system prompt，讓 AI writeup 能分析完整攻擊流程
- 確保 callback 擺放位置不受 CodeEditorPanel 已知 error path 影響

**Non-Goals:**

- 不修復 CodeEditorPanel 的既有 bug（stdout 還原靜默失敗、缺少執行 timeout、silent exit 無回饋）
- 不變更 IndexedDB schema version
- 不新增 UI 元素或改變面板的視覺設計
- 不修改 Terminal/Code 面板的核心功能邏輯

## Decisions

### 決策 1：為 Terminal 和 Code 建立 source dispatch wrapper

**選擇**：沿用既有的 `makeSourceDispatch(source)` 模式，新增 `'terminal'` 和 `'code'` 兩個 source 值。

**替代方案**：讓 Terminal/Code 繼續使用 `trackedDispatch`，只在面板內部手動呼叫 `attackSession.addHttpEvent()`。
- 拒絕原因：違反 DRY 原則，且需要把 `attackSession` 傳入子元件，增加耦合。

**影響**：`http_request` 事件的 `source` 類型從 `'browser' | 'repeater'` 擴充為 `'browser' | 'repeater' | 'terminal' | 'code'`。

### 決策 2：透過 callback prop 記錄非 HTTP 事件

**選擇**：在 WxlshPanel 新增 `onCommandExecuted` prop、在 CodeEditorPanel 新增 `onCodeExecuted` prop，由 ChallengeLayout 提供 callback 呼叫 `attackSession.addTerminalCommand()` / `attackSession.addCodeExecution()`。

**替代方案 A**：使用 Vue provide/inject 讓子元件直接存取 attackSession。
- 拒絕原因：破壞既有的 explicit props 模式，增加隱式依賴。

**替代方案 B**：在 useWxlsh / CodeEditorPanel 內部直接匯入 useAttackSession。
- 拒絕原因：useAttackSession 需要 slug 和 title 參數，且在 ChallengeLayout 中已 init，重複建立會產生衝突。

### 決策 3：CodeEditorPanel callback 位置——放在 finally 區塊最前面

**選擇**：`onCodeExecuted` 在 `finally` 區塊的最前面呼叫（stdout 還原之前）。

**原因**：
1. 此時 `outputText.value` 已經被設定（無論是成功的 captured output 或 catch 中的 error message）
2. 不受 stdout 還原失敗（路徑 4）的影響
3. callback 使用 optional chaining（`props.onCodeExecuted?.()`），不會因為未傳入而拋錯

**error 判定方式**：檢查 `outputText.value.startsWith('Error:\n')`，與既有的 catch 區塊格式一致。

### 決策 4：WxlshPanel callback 位置——execute 完成後立即呼叫

**選擇**：在 `handleEnter()` 中，`wxlsh.execute(line)` resolve 後、terminal display 寫入前呼叫 `onCommandExecuted`。

**原因**：此時已有完整的 `CommandResult`（output、error flag），且 terminal 的流程比 CodeEditorPanel 簡單，沒有多層 error path。

### 決策 5：新增 `terminal_command` 和 `code_execution` 事件結構

```typescript
// terminal_command
{ type: 'terminal_command'; timestamp: number; command: string; output: string; error: boolean }

// code_execution
{ type: 'code_execution'; timestamp: number; code: string; output: string; error: boolean; duration: number }
```

`code_execution` 多一個 `duration` 欄位，因為 Python 程式碼執行可能耗時較長（含網路請求），執行時間是有用的分析資訊。Terminal 指令大多在毫秒內完成，不需要 duration。

## Risks / Trade-offs

- **[Risk] CodeEditorPanel error 判定依賴字串前綴** → 使用 `outputText.value.startsWith('Error:\n')` 判斷是否為錯誤。如果未來 catch 區塊的格式改變，判定會失效。Mitigation：在 finally 中使用一個 boolean flag（`let isError = false`），在 catch 中設為 true，比字串比對更穩固。
- **[Risk] callback 是 fire-and-forget** → callback 不 await 回傳值。如果 IndexedDB 寫入失敗，事件會遺失但不影響 UI。Mitigation：這與既有的 `addHttpEvent` 行為一致（也是 async 但 caller 不 await），可接受。
- **[Trade-off] `terminal_command` 記錄所有指令（含 help、clear）** → 會記錄一些非攻擊性的操作。可考慮過濾，但這會增加複雜度且可能遺漏有用的上下文。保留全部記錄，讓 AI writeup 自行判斷哪些重要。
