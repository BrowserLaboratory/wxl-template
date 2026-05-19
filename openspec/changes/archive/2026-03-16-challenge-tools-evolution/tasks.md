## 1. 依賴安裝與 Rust Crate 初始化

- [x] 1.1 安裝新依賴：`xterm`、`@xterm/addon-fit`、`codemirror`、`@codemirror/lang-python`、`@codemirror/autocomplete`（package.json 新增依賴，遵循新依賴設計決策）
- [x] 1.2 在 `chall-wasm/` 下新增 `wxlsh-parser` Rust crate（`Cargo.toml` workspace member），建立基本 crate 結構以支援 wxlsh uses Rust WASM for command parsing
- [x] 1.3 更新 `package.json` 的 `wasm:build` script，加入 `wxlsh-parser` 的 wasm-pack 指令

## 2. Bug 修復：SW Readiness Gate

- [x] 2.1 在 `ChallengeLayout.vue` 新增 `swReady` ref，初始值為 `navigator.serviceWorker.controller != null`；監聽 `controllerchange` 事件將其設為 `true`，以實作 ChallengeLayout gates all tool panels on both runtimeReady and swReady
- [x] 2.2 將所有工具面板的 `disabled` prop 從 `!runtimeReady` 改為 `computed(() => !runtimeReady.value || !swReady.value)`

## 3. Bug 修復：Service Worker iframe 導航

- [x] 3.1 確認 `docs/public/challenge-sw.js` 的 fetch handler 不排除 `request.mode === "navigate"`，以實作 Service Worker handles navigation requests from iframe link clicks 與 Service Worker intercepts challenge-*.localhost requests（修改版）

## 4. Browser Panel 重寫

- [x] 4.1 移除 `BrowserPanel.vue` 中的 HTTP method selector（select 元件與 methods 陣列）及 request body textarea，以實作 Browser Panel simulates a web browser address bar and viewport（BrowserPanel iframe 連結導航攔截設計決策）
- [x] 4.2 在 URL input 上加入 `@keydown.enter` 觸發 `navigate()`，加入 "Go" button 取代原本的 "Send" button
- [x] 4.3 在 iframe `load` 事件後用 `contentDocument.addEventListener('click', ...)` 攔截 `<a>` 點擊，`preventDefault()` 後取出 href 呼叫 `navigate()`，更新 URL bar，實作 link click in iframe triggers in-panel navigation
- [x] 4.4 加入 `sandbox="allow-scripts allow-forms allow-same-origin"` 至 iframe（原本缺少 `allow-same-origin`）
- [x] 4.5 撰寫 `BrowserPanel.vue` 的單元測試，覆蓋：Enter 鍵導航、連結點擊攔截、HTML/JSON 回應顯示

## 5. challenge-persistence（IndexedDB 持久化層）

- [x] 5.1 建立 `.vitepress/theme/composables/useChallengePersistence.ts`，使用 `idb` 套件開啟 `challenge-tools` DB（version 1），建立 `code-scripts` 與 `terminal-history` object stores，以實作 useChallengePersistence manages an IndexedDB database for user tool data
- [x] 5.2 實作 `saveScript`、`listScripts`、`loadScript`、`deleteScript` 函式（含 `updatedAt` 排序），以實作 Code scripts can be saved, listed, loaded, and deleted
- [x] 5.3 實作 `appendHistory`（含重複命令去重）與 `loadHistory(limit?)` 函式，以實作 Terminal history is persisted to IndexedDB
- [x] 5.4 撰寫 `useChallengePersistence` 的單元測試（mock `idb`），覆蓋所有 CRUD 與去重邏輯

## 6. wxlsh-parser Rust WASM 實作

- [x] 6.1 在 `chall-wasm/wxlsh-parser/src/lib.rs` 實作 `parse_command(input: &str) -> ParsedCommand`，處理 quoted string、`--flag=value`、`-f value` 語法，以實作 wxlsh uses Rust WASM for command parsing
- [x] 6.2 在 `commands` 模組加入 Rust-native 命令：`help`（列出所有命令）、`clear`（清空終端）、`base64`、`hex`，以實作 wxlsh supports Rust-native command extension
- [x] 6.3 撰寫 wxlsh-parser 的 Rust unit tests，覆蓋 tokenize 引號、flag shorthands、空輸入

## 7. useWxlsh 組合函式

- [x] 7.1 建立 `.vitepress/theme/composables/useWxlsh.ts`，實作命令 registry（Rust-native 優先查找，其次 Python-backed），以實作 wxlsh dispatches commands via Python (Pyodide) by default 中的 wxlsh 架構（Option B）設計決策
- [x] 7.2 在 useWxlsh 中載入 Python-backed 命令集（curl-like HTTP、decode、encode）至 Pyodide，HTTP 命令透過 `dispatch()` prop 路由
- [x] 7.3 實作命令歷史管理（in-memory + `appendHistory` 寫入 IDB、`loadHistory` 還原），以實作 wxlsh terminal history navigable with arrow keys

## 8. WxlshPanel.vue 元件

- [x] 8.1 建立 `.vitepress/theme/components/WxlshPanel.vue`，使用 xterm.js 作為顯示層，在 `onMounted` 中初始化（lazy），在 `onUnmounted` 中 dispose，以實作 wxlsh terminal renders using xterm.js
- [x] 8.2 顯示啟動 banner："wxlsh 1.0 — web exploit shell\ntype 'help' for available commands"
- [x] 8.3 接入 `useWxlsh` 組合函式，將 xterm.js key input 連接至命令執行
- [x] 8.4 實作 Up/Down 箭頭鍵歷史導航（xterm.js key event handler）
- [x] 8.5 撰寫 WxlshPanel.vue 的單元測試，覆蓋：banner 顯示、lazy load、unmount cleanup、unknown command 錯誤訊息

## 9. CodeEditorPanel.vue 元件

- [x] 9.1 建立 `.vitepress/theme/components/CodeEditorPanel.vue`，使用 CodeMirror 6 + `@codemirror/lang-python` + `@codemirror/autocomplete`，lazy init in `onMounted`，以實作 Code Editor Panel provides a Python editing environment with CodeMirror
- [x] 9.2 實作上下可調整大小的 vertical split layout（drag handle、最小高度 120px/80px、預設 65/35），以實作 Code Editor Panel has a resizable vertical split layout
- [x] 9.3 實作 "Run" 按鈕與 Ctrl+Enter 快捷鍵，透過 Pyodide `runPythonAsync` 執行程式碼；注入 `requests` stub 路由至 `dispatch()`，以實作 Code Editor Panel executes Python via Pyodide
- [x] 9.4 實作 "Save" 按鈕（prompt 輸入名稱 → `saveScript`）與 "Load" 下拉選單（`listScripts` → 選取 → `loadScript`），以實作 Code Editor Panel supports named script save and load via IndexedDB
- [x] 9.5 撰寫 CodeEditorPanel.vue 的單元測試，覆蓋：Python syntax highlight 初始化、Run 按鈕觸發執行、disabled overlay、Save/Load 流程

## 10. RepeatPanel UI 升級

- [x] 10.1 重構 `RepeatPanel.vue` layout：將 snapshot list 從底部 inline chips 改為右側 sidebar named list，以實作 Repeater Panel provides raw HTTP request editing（RepeatPanel UI 升級設計決策）
- [x] 10.2 "Save" 按鈕改為 prompt 輸入快照名稱後儲存（named snapshot can be saved and restored）
- [x] 10.3 統一字體、border、line-height 等視覺細節，符合 challenge UI 色彩規範

## 11. ChallengeLayout 整合

- [x] 11.1 在 `ChallengeLayout.vue` 匯入並加入第四個 tab（Code），label "Code"，render `CodeEditorPanel`，以實作 ChallengeLayout provides three switchable interaction panels（升級為四個 tab）
- [x] 11.2 將 `TerminalPanel` import 替換為 `WxlshPanel`，以實作 Terminal Panel accepts curl and HTTPie-style commands（以 wxlsh 取代）
- [x] 11.3 套用 SW Readiness Gate 修復（task 2.1/2.2）至 layout，所有 `disabled` prop 更新，實作 ChallengeLayout gates all tool panels on both runtimeReady and swReady
- [x] 11.4 更新 ChallengeLayout.vue 的單元測試：新增 Code tab 覆蓋、swReady gate 行為、四個 tab 切換狀態保留
- [x] 11.5 確認 Challenge layout renders a left-right split view（左右分欄）在加入第四個 tab 後仍正確運作
- [x] 11.6 確認 Challenge pages use a custom VitePress layout registered as "challenge" frontmatter 機制不受本次改動影響；確認 Layout is activated via frontmatter, not component embedding 語意不變
- [x] 11.7 確認 Description panel renders markdown via Content component and is collapsible 與 Flag submit form is fixed at the bottom of the left column 在新佈局下仍正常運作
- [x] 11.8 確認 Challenge layout includes a navigation bar with a back link to the challenge list 仍正確顯示
- [x] 11.9 套用 UnoCSS utility classes 至 WxlshPanel 與 CodeEditorPanel，確認 Challenge UI components use UnoCSS utility classes for styling；驗證新元件符合 Challenge UI applies the platform color palette（CodeMirror Code Editor Panel 與 IndexedDB 持久化（useChallengePersistence）新元件均使用 `--ch-*` design tokens）

## 12. 最終驗證

- [x] 12.1 執行 `pnpm wasm:build`，確認 wxlsh-parser WASM 編譯無錯誤
- [x] 12.2 執行 `pnpm test`（unit tests），確認所有測試通過
- [ ] 12.3 執行 `pnpm dev`，手動驗證：Browser 連結點擊導航、wxlsh curl 命令、Code Editor Run、IndexedDB script 儲存/載入
