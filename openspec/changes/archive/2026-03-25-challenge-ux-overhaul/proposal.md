## Why

目前挑戰介面存在多項 UI/UX 問題：VitePress nav 與 challenge layout 配色斷層、雙層導覽列壓縮可用空間、`requests` 函式庫缺失導致使用者無法用原生 Python 方式進行挑戰、terminal 指令不完整（`help` 都無法使用）、挑戰檔案結構分散不易管理、出題者缺乏功能管控能力與格式驗證工具。這些問題影響學習體驗與出題效率，需要一次性全面改善。

## What Changes

- **Merged Nav Bar**：挑戰頁面隱藏 VitePress nav，合併為單一 ~40px bar（A2 Compact Left-Heavy 方案），統一使用 `--ch-*` Midnight Indigo 配色
- **Description 收合**：Desktop/Tablet 左側面板可收合至 100% tools 寬度；Mobile 預設收合，點擊開啟全螢幕 Modal
- **Browser URL Bar**：Desktop 使用膠囊型 `← → ↻ [🔒 URL] [Go]`；Mobile 使用極簡 `[URL][→]`
- **RWD 三斷點**：≥1024px 完整雙欄、768–1023px 精簡雙欄、<768px 單欄 + hamburger
- **requests 函式庫**：安裝真正的 `requests`，monkey-patch `HTTPAdapter.send()` 走 JS dispatch bridge
- **Terminal 指令系統重構**：五層分級（核心 shell / 文字處理 / 編解碼 / 網路工具 / 滲透工具），行為對齊真實 Linux 工具
- **User Virtual FS**：`/home/hacker/`（可自訂使用者名稱），IndexedDB 儲存，支援 pipe `|` 串接
- **挑戰檔案結構重構**：從 flat `challenge/*.md` 改為 `challenge/<slug>/index.md` + `src/` 子目錄，自動掃描 + `.fsignore`
- **出題者功能管控**：frontmatter 新增 `tools`（UI tab allowlist）與 `commands`（Tier 5 滲透工具 allowlist）
- **出題者工具**：新增 `pnpm challenge:validate` 與 `pnpm challenge:analyze` 腳本

## Capabilities

### New Capabilities

- `challenge-merged-nav`: 挑戰頁面合併導覽列，取代 VitePress nav + challenge header 雙層結構
- `challenge-description-modal`: Description 收合機制與 Mobile 全螢幕 Modal
- `challenge-browser-chrome`: 擬真瀏覽器 URL bar（Desktop 膠囊型 / Mobile 極簡型）
- `challenge-rwd`: 挑戰頁面三斷點 RWD 策略
- `requests-shim`: Pyodide 內安裝真正 requests 並 monkey-patch 傳輸層走 dispatch bridge
- `wxlsh-commands`: Terminal 五層指令系統（Tier 1~5），行為對齊真實 Linux 工具
- `user-virtual-fs`: 使用者可讀寫虛擬檔案系統（IndexedDB），含 pipe 支援
- `challenge-file-structure`: 挑戰 per-folder 檔案結構 + src/ 自動掃描 + .fsignore
- `challenge-tools-control`: 出題者透過 frontmatter 管控可用 UI tab 與 terminal 滲透工具
- `challenge-author-scripts`: validate 與 analyze CLI 腳本供出題者驗證挑戰格式與內容

### Modified Capabilities

- `challenge-layout`: 移除雙層 header、改為 merged nav、Description 收合邏輯變更
- `challenge-ui`: 新增 merged nav 元件、Description Modal 元件、Browser Chrome 元件
- `wxlsh-terminal`: 指令系統從 3 個指令擴展為五層完整指令集，新增 User VFS 整合
- `challenge-scaffold`: `create-challenge.ts` 需對應新的 per-folder 結構
- `challenge-framework`: frontmatter schema 新增 `tools`、`commands`、`flag` 欄位，移除 `fs`
- `challenge-runtime-init`: runtime init 流程新增 `requests` 安裝與 monkey-patch
- `code-editor-panel`: Code Editor 中 `import requests` 可直接使用
- `challenge-design-tokens`: VitePress nav override CSS、merged nav 配色 token

## Impact

- Affected specs: challenge-layout, challenge-ui, wxlsh-terminal, challenge-scaffold, challenge-framework, challenge-runtime-init, code-editor-panel, challenge-design-tokens（8 個現有 spec 需更新）
- Affected code:
  - `.vitepress/theme/layouts/ChallengeLayout.vue` — 移除舊 header、整合 merged nav
  - `.vitepress/theme/Layout.vue` — 挑戰頁面隱藏 VitePress nav
  - `.vitepress/theme/style.css` — nav override CSS
  - `.vitepress/theme/components/BrowserPanel.vue` — 新 URL bar 元件
  - `.vitepress/theme/components/WxlshPanel.vue` — 指令系統整合
  - `.vitepress/theme/composables/useWxlsh.ts` — 五層指令分派
  - `.vitepress/theme/composables/usePythonRuntime.ts` — requests monkey-patch
  - `.vitepress/challenge/config.ts` — frontmatter schema 更新
  - `scripts/challenge-keygen.ts` — 新檔案結構掃描邏輯
  - `scripts/create-challenge.ts` — per-folder scaffold
  - `scripts/challenge-validate.ts` — 新增
  - `scripts/challenge-analyze.ts` — 新增
  - `docs/challenge/*/index.md` — 現有挑戰遷移
  - `uno.config.ts` — 新增 merged nav 相關 shortcuts
- Dependencies: `requests` 套件（透過 micropip 在 runtime 安裝）
