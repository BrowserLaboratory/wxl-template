## 1. 挑戰 per-folder 檔案結構重構（Challenge file structure）

- [x] [P] 1.1 修改 `challenge-keygen.ts` 掃描 `docs/challenge/*/index.md`，slug 從目錄名稱取得（per-folder challenge structure、slug derived from directory name）
- [x] [P] 1.2 實作 `src/` 自動遞迴掃描邏輯，含內建預設排除清單（automatic src scanning、built-in default exclusions）
- [x] [P] 1.3 實作 `.fsignore` 解析器（gitignore 語法）（custom .fsignore support）
- [x] 1.4 修改 `challenge-keygen.ts` 支援 `app` 為 src 內相對路徑、`flag` 可選欄位（simplified frontmatter app field、configurable flag file location）
- [x] 1.5 移除 `fs` 欄位處理邏輯，加入 legacy 警告（fs frontmatter field removed）
- [x] 1.6 遷移現有 3 個挑戰（sqli-demo, php-demo, fastapi-demo）到 per-folder 結構

## 2. Frontmatter Schema 更新（ChallengeConfig schema）

- [x] [P] 2.1 更新 `challenge/config.ts` ChallengeConfig interface：新增 `flag`、`tools`、`commands` 欄位，移除 `fs`（ChallengeConfig schema）
- [x] [P] 2.2 實作 `tools` 欄位驗證（valid tools values：browser, network, repeater, terminal, code）
- [x] [P] 2.3 實作 `commands` 欄位驗證（valid commands values：dirb, dirsearch, sqlmap, jwt, hydra, nmap, all）
- [x] 2.4 更新 `challenge/plugin.ts` 的 frontmatter 處理邏輯

## 3. 出題者 Scaffold 更新（Challenge scaffolding）

- [x] 3.1 修改 `create-challenge.ts` 產生 per-folder 結構（challenge scaffolding creates per-folder structure、scaffold generates simplified frontmatter）

## 4. 出題者 Validate / Analyze 腳本

- [x] [P] 4.1 建立 `scripts/challenge-validate.ts`：驗證 frontmatter、src 結構、檔案存在性、欄位合法性（challenge validate script）
- [x] [P] 4.2 建立 `scripts/challenge-analyze.ts`：執行 validate + 檔案統計、payload 預估、flag 格式檢查、問題掃描（challenge analyze script）
- [x] 4.3 在 `package.json` 註冊 `challenge:validate` 和 `challenge:analyze` scripts

## 5. Merged Nav Bar（A2 Compact Left-Heavy）

- [x] 5.1 修改 `Layout.vue`：challenge 頁面隱藏 `.VPNav`（VitePress nav hidden on challenge pages）
- [x] 5.2 建立 MergedNav 元件，實作 challenge page header structure（merged navigation bar replaces dual-bar layout、merged nav A2 compact left-heavy layout、MergedNav component）
- [x] 5.3 整合 MergedNav 到 `ChallengeLayout.vue`，移除舊 `<header>` 區塊（separate challenge header bar removed）
- [x] 5.4 更新 `style.css` 新增 `.VPNav` 隱藏規則和 merged nav design tokens（merged nav design tokens）
- [x] [P] 5.5 更新 `uno.config.ts` 新增 merged nav 相關 shortcuts
- [x] 5.6 確認非挑戰頁面不受影響（non-challenge pages retain VitePress nav）

## 6. Description 收合與 Mobile Modal（Description panel collapse behavior）

- [x] 6.1 修改 `ChallengeLayout.vue` description panel collapse behavior：收合後 tools 佔 100% 寬度、「📖 題目」按鈕移入 nav bar（description panel collapsible on all breakpoints）
- [x] 6.2 建立 DescriptionModal 元件：全螢幕 modal overlay、含 flag 輸入（DescriptionModal component、mobile description opens as fullscreen modal、mobile description defaults to collapsed）
- [x] 6.3 確保 flag 輸入在所有狀態下可用（flag submission always accessible）

## 7. Browser URL Bar 差異化（Browser chrome）

- [x] 7.1 建立 BrowserChrome 元件：Desktop 膠囊型 URL bar（← → ↻ + 🔒 URL + Go）、Mobile 極簡型（URL + →）（BrowserChrome component、desktop browser chrome with capsule URL bar、mobile browser with minimal URL bar）
- [x] 7.2 整合 BrowserChrome 到 `BrowserPanel.vue`，取代現有 URL 輸入區

## 8. RWD 三斷點（Three-breakpoint responsive layout）

- [x] 8.1 實作 ≥1024px Desktop 佈局（完整一行 bar + 雙欄）
- [x] 8.2 實作 768–1023px Tablet 佈局（精簡 bar + 窄 desc 雙欄）
- [x] 8.3 實作 <768px Mobile 佈局（兩行 bar + hamburger + 單欄 + tab 橫向捲動）
- [x] 8.4 整合 RWD 斷點到 MergedNav、Description、BrowserChrome 元件（three-breakpoint responsive layout）

## 9. requests Monkey-Patch 策略（requests 函式庫整合）

- [x] 9.1 在 `usePythonRuntime.ts` 實作 runtime initialization installs requests：`micropip.install('requests')`（install real requests library in Pyodide）
- [x] 9.2 撰寫 `HTTPAdapter.send()` monkey-patch Python code，走 JS dispatch bridge（monkey-patch HTTPAdapter.send for dispatch bridge、full requests API compatibility）
- [x] 9.3 在 tool-layer Pyodide（PHP backend）也安裝並 patch requests（tool-layer Pyodide also patches requests、requests available for non-Python backends）
- [x] 9.4 確認 Code Editor 中 `import requests` 可正常使用（code editor supports import requests）

## 10. User Virtual FS

- [x] 10.1 建立 `useUserVfs.ts` composable：IndexedDB CRUD、per-slug 隔離（user writable virtual filesystem、per-challenge isolated storage）
- [x] 10.2 實作預設使用者名稱 `hacker` 與 `export USER` 自訂邏輯（default username hacker with customization）
- [x] 10.3 確保挑戰檔案不暴露在 user FS 中（challenge files not exposed in user FS）
- [x] 10.4 設定預設工作目錄為 `/home/hacker/`（default working directory）

## 11. Terminal 五層指令分級系統（wxlsh-commands）

- [x] 11.1 重構 `useWxlsh.ts` 為五層分派架構（five-tier command system、command dispatch routing）
- [x] [P] 11.2 實作 Tier 1 核心 shell 指令（TypeScript）：help, clear, echo, cat, ls, pwd, cd, mkdir, touch, cp, mv, rm, head, tail, wc, whoami, id, env, export, history, file, date, which（tier 1 core shell commands、help command lists available commands）
- [x] [P] 11.3 實作 Tier 2 文字處理指令（Python）：grep, sed, awk, sort, uniq, cut, tr, tee, xargs, diff（tier 2 text processing commands）
- [x] [P] 11.4 實作 Tier 3 編解碼/雜湊指令：base64, xxd, md5sum, sha256sum, urlencode, urldecode（tier 3 encoding and hashing commands）
- [x] [P] 11.5 重構 Tier 4 網路指令 curl/wget，對齊真實 Linux 工具 flag 語法（tier 4 network commands、command behavior aligned to real Linux tools）
- [x] 11.6 實作 Tier 5 滲透工具精簡版：dirb, dirsearch, sqlmap, jwt, hydra, nmap（tier 5 commands controlled by challenge author）
- [x] 11.7 實作未支援參數回報機制 + 官方文件連結（unsupported real parameters reported explicitly）
- [x] 11.8 實作 pipe `|` 支援（pipe support）
- [x] 11.9 整合 User VFS 到所有檔案操作指令（user VFS integration）
- [x] 11.10 整合 `commands` frontmatter 過濾 Tier 5 指令（UI tab allowlist via tools field、tier 5 command allowlist via commands field）

## 12. 出題者功能管控 — UI Tab 過濾（Tools control）

- [x] 12.1 修改 `ChallengeLayout.vue`：根據 frontmatter `tools` 欄位過濾 tab 列表（UI tab allowlist via tools field）
