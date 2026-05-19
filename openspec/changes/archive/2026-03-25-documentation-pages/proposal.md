## Why

平台目前沒有任何使用者文件頁面。新手使用者進入後無法了解 Python Code Editor、Terminal 和 Network/Repeater 等工具的用法，必須靠自己摸索。缺乏文件降低了平台的可用性和學習效率，也增加了 Discord/Issue 中的重複提問。新增結構化的文件頁面可以讓使用者自助查閱工具功能和操作流程，降低上手門檻。

## What Changes

- 在 `docs/docs/` 目錄下新增 4 個 VitePress Markdown 文件頁面：
  - `getting-started.md` — 平台介紹、系統需求、快速開始、工具總覽、常見問題
  - `python-guide.md` — Code Editor 介面、可用模組（requests stub、Pyodide stdlib）、requests 用法、攻擊腳本範例、快捷鍵、儲存/載入
  - `terminal-guide.md` — Terminal 介面、內建指令（help、clear、base64、hex、curl、decode、encode）、歷史紀錄、快捷鍵
  - `network-guide.md` — Traffic Log 面板、狀態碼說明、Send to Repeater 流程、Repeater 功能、組合工作流範例
- 文件內容使用繁體中文撰寫，技術術語保留英文（如 `requests.get()`、`base64`）

## Capabilities

### New Capabilities

- `platform-documentation`: 提供 4 頁 VitePress 文件，涵蓋平台入門、Python 工具、Terminal 工具和網路工具的使用指南

### Modified Capabilities

（無）

## Impact

- 新增檔案：
  - `docs/docs/getting-started.md`
  - `docs/docs/python-guide.md`
  - `docs/docs/terminal-guide.md`
  - `docs/docs/network-guide.md`
- 相依於 `challenge-nav-integration` change 完成的 VitePress config 更新（nav 'Docs' 連結和 `/docs/` path-based sidebar 設定）
- 無破壞性變更：純新增文件頁面，不修改任何現有程式碼或設定
