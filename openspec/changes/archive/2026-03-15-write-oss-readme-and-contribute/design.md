## Context

專案 `web-exploitation-seclab` 是一個完全基於瀏覽器端 WebAssembly 的 CTF 網頁滲透練習平台，無需後端伺服器。目前 `README.md` 與 `CONTRIBUTE.md` 皆為空白，導致潛在貢獻者看不到專案目的與協作規範。專案使用 VitePress 2.x 作為文件站，Rust WASM 模組提供虛擬檔案系統與 ASGI/WSGI runtime，JS/TS bridges 整合 Pyodide（Python）與 php-wasm（PHP），以 Service Worker 攔截請求模擬後端行為。

## Goals / Non-Goals

**Goals:**

- 撰寫符合 OSS 慣例的 `README.md`，讓訪客在 30 秒內理解專案用途
- 撰寫 `CONTRIBUTE.md`，說明 git flow 分支策略與 PR 提交流程
- 包含足夠的技術說明讓貢獻者能在本地建置並測試

**Non-Goals:**

- 不撰寫 API 文件或挑戰設計教學
- 不修改任何功能程式碼
- 不建立 Issue / PR 範本檔案（`.github/` 目錄）

## Decisions

### README 採用標準 OSS 章節結構

**決策**：依序包含 Project Badge → 簡介 → 技術棧 → 快速開始 → 架構說明 → License。

**理由**：GitHub 訪客第一眼看 README，標準結構讓有經驗的開源貢獻者能快速掃描定位所需資訊。

**替代方案**：極簡 README（只有標題 + 一段描述）→ 資訊不足，不利貢獻者評估是否參與。

### CONTRIBUTE 採用 git flow 分支模型說明

**決策**：以 `main`（穩定）/ `staging`（整合）/ `feature/*`、`bugfix/*`、`hotfix/*` 為主軸，說明 PR 目標分支規則。

**理由**：專案已在使用 git flow 模式（用戶明確說明），文件只是顯式化現有流程。

**替代方案**：GitHub Flow（只有 main + feature）→ 現有分支已不符此模式。

### Commit message 採用 Conventional Commits + gitmoji

**決策**：要求 `<emoji> <type>: <description>` 格式，與現有 git log 一致。

**理由**：觀察 repo 的 git log 顯示已在使用 emoji + conventional commit 風格（如 `♻️ refactor:`, `✨ feat:`）。

## Risks / Trade-offs

- [風險] 架構描述可能隨程式碼演進而過時 → 緩解：架構章節僅描述模組邊界，不涉及實作細節，降低維護成本
- [風險] git flow 說明若過於繁複，貢獻者反而不看 → 緩解：使用流程圖或精簡表格取代長篇文字
