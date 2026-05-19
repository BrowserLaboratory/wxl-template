## Context

平台提供 Python Code Editor（基於 Pyodide）、Terminal（自訂 xterm.js 終端）和 Network Traffic/Repeater 等工具面板，但目前沒有任何文件頁面引導使用者操作這些工具。VitePress config 中的 nav 和 sidebar 設定已由 `challenge-nav-integration` change 處理，本 change 專注於撰寫文件內容。

相關 spec：`openspec/specs/platform-documentation/spec.md`（本 change 新建）

## Goals / Non-Goals

**Goals:**

- 建立 4 頁結構化文件，讓使用者可以查閱平台各工具的功能和操作方式
- 文件以繁體中文撰寫，技術術語保留英文原文
- 每頁包含清晰的章節結構、操作步驟和範例

**Non-Goals:**

- 修改 VitePress config（由 `challenge-nav-integration` 處理）
- 建立 API reference 或開發者文件
- 國際化（i18n）多語系支援
- 影片或互動式教學內容

## Decisions

### 文件放置於 `docs/docs/` 目錄

所有文件頁面放在 `docs/docs/` 下，與 `challenge-nav-integration` 中已設定的 `/docs/` sidebar path 對應。這使得文件與挑戰頁面（`docs/challenge/`）在路由層級上清楚區分。

**替代方案：** 放在 `docs/guide/` 下 — 需要額外修改 VitePress sidebar config，且 `challenge-nav-integration` 已將 nav link 指向 `/guide/`（可視為 `/docs/` 的別名或需調整）。選擇 `docs/docs/` 以符合 sidebar 設定。

### 每頁獨立、不拆分子頁面

4 個主題各自為一個完整的 Markdown 頁面，不進一步拆分為多個子頁面。文件內容量適中（預估每頁 200–400 行），單頁結構搭配 VitePress 的自動目錄（Table of Contents）已足夠導航。

**替代方案：** 將每個主題拆成多個子頁面（如 `python-guide/modules.md`、`python-guide/examples.md`）— 增加維護成本且跨頁閱讀體驗不佳，在目前文件量下不必要。

### 使用繁體中文 + 英文技術術語混寫風格

文件正文使用繁體中文，但程式碼、指令名稱、技術概念保留英文原文（如 `requests.get()`、`base64`、Service Worker）。這符合台灣技術社群的慣用寫法，避免生硬翻譯降低可讀性。

**替代方案：** 純英文撰寫 — 目標讀者為繁體中文使用者，中文文件的可親近性更高。

### 文件頁面使用 VitePress 預設 doc layout

文件頁面不指定 `layout` frontmatter（或使用預設 `doc`），由 VitePress DefaultTheme 自動渲染 sidebar、目錄和內容區。這與挑戰頁面的 `layout: challenge` 區隔開來。

## Risks / Trade-offs

- **風險：** 文件內容可能與平台功能更新脫節 → 緩解：在 contributor guide 中建議功能變更時同步更新相關文件頁面
- **風險：** 相依於 `challenge-nav-integration` 完成的 sidebar 設定 → 緩解：文件頁面本身為獨立 Markdown 檔案，即使 sidebar 未就緒也不影響建置，僅影響導航體驗
- **Trade-off：** 不含互動式範例或嵌入式 playground → 可接受：靜態文件已能滿足當前需求，互動式教學可在未來 change 中補充
