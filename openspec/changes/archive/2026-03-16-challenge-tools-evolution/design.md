## Context

目前挑戰工具區由三個 Vue 元件構成（BrowserPanel、TerminalPanel、RepeatPanel），均共用 `ChallengeLayout` 傳入的 `dispatch()` 函式。已知問題：

- **BrowserPanel**：iframe 使用 `srcdoc` 渲染 HTML response，但連結點擊觸發的是 iframe 內部導航（navigation request），不走 `dispatch()`，導致頁面空白並出現 console error。另外 method selector 在「瀏覽器」體驗上顯得突兀。
- **ChallengeLayout**：`disabled` 只綁定 `runtimeReady`（Python/PHP runtime），未追蹤 Service Worker controller 狀態，導致 SW 尚未就緒時使用者仍可點擊工具按鈕。
- **TerminalPanel**：自製 CLI parser（純 TypeScript），功能單薄，UI 是普通 div，無法提供真實終端體驗。
- **RepeatPanel**：`<textarea>` 編輯原始 HTTP，UI 陽春，無語法 highlight。

## Goals / Non-Goals

**Goals:**

- 修復 iframe 連結導航（BrowserPanel）
- 修復 SW readiness gate（ChallengeLayout）
- 讓 BrowserPanel 真正像瀏覽器（移除 method selector、URL bar 直接 Enter/Go 觸發 fetch、連結點擊更新 URL bar）
- 新增 `wxlsh` terminal（xterm.js UI、Rust WASM 語法解析、Pyodide 執行、可擴展的 Rust-native command）
- 新增 `Code` tab（CodeMirror Python 編輯器，autocomplete、syntax hint、可調整 output 區域）
- 升級 RepeatPanel UI/UX（保留 raw HTTP 語意，改善 layout 與互動）
- 新增 IndexedDB 持久化層（Code scripts 命名存取、terminal 指令歷史）

**Non-Goals:**

- 不重寫 challenge 的 runtime（Pyodide / PHP WASM）邏輯
- 不更動 Service Worker 的 challenge 路由機制
- 不在 Code editor 中支援非 Python 語言（此版本）
- 不引入 WebSocket 或 SSE 等即時通訊協定

## Decisions

### BrowserPanel iframe 連結導航攔截

**問題：** `srcdoc` iframe 連結點擊觸發原生 navigation，不走 `dispatch()`。

**解法：** 在 iframe `load` 事件後，用 `contentDocument.addEventListener('click', ...)` 攔截所有 `<a>` 點擊，`preventDefault()`，取出 `href` 後呼叫 `dispatch()`，再更新 `srcdoc`。同步更新 URL bar 顯示。

**替代方案（捨棄）：** 讓 iframe 使用真實 URL（`src` 而非 `srcdoc`），依賴 SW 攔截 navigation request。問題：`srcdoc` 和 `src` 不能並存；改用 `src` 需要每個 response 先建立 Blob URL，增加記憶體管理複雜度。

### SW Readiness Gate

**問題：** `runtimeReady` 不代表 SW 已控制頁面。

**解法：** 在 `ChallengeLayout` 新增 `swReady` ref，初始值 `false`。`onMounted` 時：

```
if (navigator.serviceWorker.controller) swReady = true
else listen for 'controllerchange' → swReady = true
```

UI `disabled` 改為 `computed(() => !runtimeReady.value || !swReady.value)`。

**注意：** hard reload 時 SW controller 可能為 null，需等 `controllerchange` 事件。

### wxlsh 架構（Option B）

```
xterm.js (UI 顯示層)
    ↓ 使用者輸入
Rust WASM parser (chall-wasm/wxlsh-parser)
    - tokenize: 切分 tokens（支援 quoted string）
    - classify: 識別 builtin command vs user-defined
    - returns: { command: string, args: string[], flags: Map }
    ↓ 命令物件
Command Dispatcher (useWxlsh.ts)
    ├── Rust-native commands（在 parser 中實作，compiled-in）
    │     例：help, clear, history
    └── Python-backed commands（Pyodide 執行）
          例：curl-like HTTP 工具, decode, scan
```

**Rust-native vs Python-backed 分工原則：**
- Rust-native：不需要 HTTP dispatch 的純工具（help、clear、base64、hex）
- Python-backed：需要 `dispatch()` 或 challenge 邏輯的命令

**擴展空間：** challenge 作者可在 frontmatter 宣告 `wxlsh_commands`，在 Python 端定義對應的 handler function，由 Pyodide 動態載入。

**wxlsh 啟動 banner：**
```
wxlsh 1.0 — web exploit shell
type 'help' for available commands
```

### CodeMirror Code Editor Panel

- 使用 `@codemirror/lang-python` + `@codemirror/autocomplete`
- Layout：上下切分（vertical split），用 CSS resize 或 drag handle
  - 上：編輯器（預設 70% 高度）
  - 下：output（可拖曳調整，最小 80px）
- 執行：Run button（Ctrl+Enter），透過 Pyodide 執行
- Python 環境預設 import `requests`（stub 版，實際走 `dispatch()`）

### IndexedDB 持久化（useChallengePersistence）

使用已有的 `idb` 套件（`^8.0.3`）。

**DB Schema：**
```
DB: challenge-tools
├── store: code-scripts
│     key: id (uuid)
│     value: { id, name, content, createdAt, updatedAt }
└── store: terminal-history
      key: id (autoIncrement)
      value: { command, timestamp }
```

**UI 整合：**
- Code Editor：右上角 "Save" → 輸入名稱 → 存入 IDB；左上角 "Load" → 下拉選單選已命名腳本
- Terminal：指令歷史透過 ↑/↓ 鍵瀏覽（xterm.js addon）

### RepeatPanel UI 升級

保留語意（raw HTTP 編輯），改善：
- 換用等寬字體、適當的 border-radius、line-height
- 加入 `Content-Length` 自動計算提示
- Snapshot 改為 panel 側邊 list（而非底部 inline list），支援命名

### 新依賴

| 套件 | 用途 | 估計大小 |
|------|------|----------|
| `xterm` | Terminal UI | ~200KB |
| `@xterm/addon-fit` | Terminal resize | 小 |
| `codemirror` | Editor core | ~300KB |
| `@codemirror/lang-python` | Python syntax | ~100KB |
| `@codemirror/autocomplete` | Autocomplete | ~50KB |

**效能考量：** xterm.js 和 CodeMirror 均使用動態 import（只在 tab 切換到對應面板時才載入）。

## Risks / Trade-offs

- **[Risk] xterm.js 在 VitePress SSR 環境可能有 DOM API 問題** → Mitigation：使用 `onMounted` 延遲初始化，加 `if (typeof window === 'undefined') return` guard
- **[Risk] iframe `contentDocument` 跨 origin 存取限制** → Mitigation：`srcdoc` iframe 在同 origin 下，`allow-same-origin` sandbox flag 需加入；但注意開放 `allow-same-origin` 會讓 iframe 腳本能存取 parent document，需評估 XSS 風險 → 對於教學型 CTF 平台可接受
- **[Risk] Pyodide 執行 Python 指令的 latency（冷啟動慢）** → Mitigation：wxlsh Python commands 在 runtime 已初始化後才啟用；Pyodide 的 `runPythonAsync` 是增量的
- **[Risk] wxlsh Rust WASM 需要重新編譯** → Mitigation：新增獨立 crate `chall-wasm/wxlsh-parser`，加入 `wasm:build` script；parser 僅做語法解析，不含業務邏輯，改動頻率低

## Open Questions

- RepeatPanel snapshot 命名：要整合進 IndexedDB（和 Code scripts 共用 persistence），還是保持 in-memory？（建議整合）
- wxlsh 的 Python commands：是每個 challenge 獨立定義，還是有一個「平台預設命令集」？（建議：平台提供基礎集如 `curl`、`decode`，challenge 可 override）
