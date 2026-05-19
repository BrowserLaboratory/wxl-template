## Why

目前挑戰工具區（Browser、Terminal、Repeater）功能陽春、UI 過時，且存在多個會影響使用者體驗的 bug（iframe 導航失效、Service Worker ready gate 缺失）。需要在修復 bug 的同時，大幅升級工具品質，使平台更接近真實的 web 安全工具環境。

## What Changes

- **修復** `BrowserPanel` 中 iframe 連結點擊後頁面空白（缺少導航攔截機制）
- **修復** `ChallengeLayout` 中 SW ready 狀態未與 UI disabled 綁定，導致偶發性 "SW not ready" 錯誤
- **重寫** `BrowserPanel`：移除 HTTP method selector，改為純瀏覽器風格（URL bar + Go button），支援 iframe 內連結點擊觸發導航
- **新增** `wxlsh` — 以 xterm.js 為顯示層的終端介面，架構採 Rust WASM 語法解析 + Pyodide 執行，同時保留 Rust-native command 擴展空間
- **升級** `RepeatPanel` UI/UX：保留原始 HTTP 編輯功能，但介面現代化（layout、syntax highlight、snapshots 管理改善）
- **新增** 第四個工具 tab：`Code` — 以 CodeMirror 為基礎的 Python 編輯器，含 autocomplete、syntax hint，下方可調整大小的 output 區域
- **新增** IndexedDB 持久化層：存儲 CodeMirror 腳本（使用者可命名、查詢歷史），以及 wxlsh 指令歷史
- **強化** Virtual FS 整合：將 IndexedDB 儲存納入本次規劃

## Capabilities

### New Capabilities

- `wxlsh-terminal`: xterm.js 顯示 + Rust WASM 語法解析 + Pyodide 執行的客製化終端介面，品牌名稱為 `wxlsh`
- `code-editor-panel`: CodeMirror Python 編輯器 tab，含 autocomplete、syntax hint 及可調整大小的 output 區域
- `challenge-persistence`: IndexedDB 持久化層，儲存使用者的 Code scripts（含命名管理）與 terminal 指令歷史

### Modified Capabilities

- `challenge-ui`: 新增第四個 tab（Code），BrowserPanel 改為純瀏覽器風格（移除 method selector、加入 iframe 導航攔截），RepeatPanel UI 升級，SW readiness gate 修復
- `challenge-layout`: `runtimeReady` 拆分為 `runtimeReady + swReady`，disabled 改為 `!runtimeReady || !swReady`
- `service-worker-router`: 確認 navigation request 類型處理正確，避免 iframe 連結導航失敗

## Impact

- 新增依賴：`xterm`、`@xterm/addon-fit`、`@codemirror/lang-python`、`@codemirror/autocomplete`、`codemirror`
- 受影響檔案：
  - `.vitepress/theme/components/BrowserPanel.vue`
  - `.vitepress/theme/components/TerminalPanel.vue` → 重寫為 WxlshPanel.vue
  - `.vitepress/theme/components/RepeatPanel.vue`
  - `.vitepress/theme/components/CodeEditorPanel.vue`（新增）
  - `.vitepress/theme/layouts/ChallengeLayout.vue`
  - `.vitepress/theme/composables/useWxlsh.ts`（新增）
  - `.vitepress/theme/composables/useChallengePersistence.ts`（新增）
  - `chall-wasm/wxlsh-parser/`（新增 Rust crate）
  - `docs/public/challenge-sw.js`
