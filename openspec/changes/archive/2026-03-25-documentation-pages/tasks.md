## 1. 建立文件目錄

- [x] [P] 1.1 建立 `docs/docs/` 目錄（文件放置於 `docs/docs/` 目錄，對應 VitePress `/docs/` sidebar path）

## 2. Getting Started 頁面

- [x] [P] 2.1 建立 `docs/docs/getting-started.md`，文件頁面使用 VitePress 預設 doc layout、每頁獨立不拆分子頁面。使用繁體中文 + 英文技術術語混寫風格撰寫以下章節：平台介紹、系統需求、快速開始步驟、工具總覽（Code Editor、Terminal、Browser、Network Traffic、Repeater）、常見問題 — 實現 Getting Started page provides platform introduction and quick start guide

## 3. Python Guide 頁面

- [x] [P] 3.1 建立 `docs/docs/python-guide.md`（使用 VitePress 預設 doc layout，每頁獨立、不拆分子頁面），以繁體中文 + 英文技術術語混寫風格撰寫以下章節：Code Editor 介面說明、可用模組清單（Pyodide stdlib 和 requests stub）、requests 用法與範例、攻擊腳本範例（SQL injection 測試、參數 fuzzing）、快捷鍵、儲存與載入 — 實現 Python Guide page documents Code Editor and Pyodide environment

## 4. Terminal Guide 頁面

- [x] [P] 4.1 建立 `docs/docs/terminal-guide.md`（使用 VitePress 預設 doc layout，每頁獨立、不拆分子頁面），以繁體中文 + 英文技術術語混寫風格撰寫以下章節：Terminal 介面說明、內建指令詳解（help、clear、base64、hex、curl、decode、encode，每個指令含語法和範例）、歷史紀錄操作、快捷鍵 — 實現 Terminal Guide page documents built-in terminal commands

## 5. Network Guide 頁面

- [x] [P] 5.1 建立 `docs/docs/network-guide.md`（使用 VitePress 預設 doc layout，每頁獨立、不拆分子頁面），以繁體中文 + 英文技術術語混寫風格撰寫以下章節：Traffic Log 面板說明、HTTP 狀態碼說明、Send to Repeater 流程步驟、Repeater 功能說明（方法選擇器、URL 編輯器、Headers 編輯器、Body 編輯器、回應檢視器）、組合工作流範例 — 實現 Network Guide page documents Traffic Log and Repeater workflow

## 6. 驗證

- [x] 6.1 執行 `pnpm docs:build` 確認所有文件頁面正確建置，無錯誤
- [x] 6.2 執行 `pnpm docs:dev` 確認文件頁面可正常瀏覽、sidebar 導航正確（需 challenge-nav-integration 完成）
