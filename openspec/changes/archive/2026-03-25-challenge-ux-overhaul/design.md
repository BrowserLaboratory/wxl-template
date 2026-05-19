## Context

WXL 平台是一個基於 VitePress + WebAssembly 的瀏覽器端 CTF Web Exploit 挑戰平台。目前挑戰介面存在以下問題：

1. VitePress nav bar 與 challenge layout 使用不同的色系，造成視覺斷裂
2. 雙層導覽列（VitePress nav ~64px + challenge header ~40px）佔用 ~104px 垂直空間
3. Pyodide 中 `import requests` 失敗，使用者無法用原生 Python 方式攻擊
4. Terminal（wxlsh）只有 3 個可用指令，`help` 都回傳 "command not found"
5. 挑戰檔案分散管理（`.md` 與同名資料夾分離），出題者不易維護
6. 出題者無法管控每題可用的工具與功能，也缺乏格式驗證工具

目標使用者包含教師教學與學習者自學兩種場景。設計取向：工具面板保持緊湊專業感（類 Burp Suite），題目描述區保持教學閱讀感（類 HackTheBox Academy）。

## Goals / Non-Goals

**Goals:**

- 解決 nav 配色斷層與空間壓迫問題
- 讓 `import requests` 在 Code Editor 中正常運作
- 建立完整的 Linux-like terminal 指令集
- 提供使用者可讀寫的虛擬檔案系統
- 將挑戰檔案結構改為 per-folder 自包含模式
- 讓出題者可控制每題可用功能，並提供驗證工具
- 完善三斷點 RWD 支援

**Non-Goals:**

- 不重新設計 ChallengeList 頁面（已在先前改版完成）
- 不實作完整的 `sqlmap` / `dirsearch` 等工具（精簡重寫核心功能）
- 不支援多使用者共享 FS 或即時協作
- 不更動加密 WASM payload 的二進位格式（`CHWD` v1 格式不變）

## Decisions

### Merged Nav Bar（A2 Compact Left-Heavy）

在挑戰頁面隱藏 VitePress 預設 nav bar，以單一 ~40px 自訂 bar 取代。左側流式排列：WXL 品牌 | ← Challenges | 標題 + badges。右側：runtime 狀態 + Notes + dark mode + GitHub。

**替代方案：** 方案 B（保留雙層 bar 只改配色）改動最小但不解決空間問題；方案 C（注入 challenge info 到 VitePress nav）受限於 VitePress nav slots 的彈性。A2 同時解決配色與空間兩個問題。

**實作：** `Layout.vue` 中偵測 `frontmatter.layout === 'challenge'` 時，透過 CSS `display: none !important` 隱藏 `.VPNav`（取代現有的只隱藏 `.VPContent` 等），並在 `ChallengeLayout.vue` 中新增 merged nav header 元件。

### Description 收合與 Mobile Modal

Desktop/Tablet：左側 description panel 保留現有的 `◀` 收合按鈕，收合後 tools 佔滿 100% 寬度，`📖 題目` 按鈕出現在 merged nav bar 中。

Mobile（<768px）：description 預設收合（隱藏），點擊 `📖 題目` 按鈕開啟全螢幕 Modal overlay（100% 寬高），專注閱讀。Modal 內含 flag 輸入區。

**替代方案：** 50% slide-down 在手機上空間不足且無法專注閱讀。全螢幕 Modal 提供最佳閱讀體驗。

### Browser URL Bar 差異化

Desktop：在 Browser tab 面板內部渲染擬真瀏覽器列——`← → ↻` 導覽按鈕 + 膠囊型 URL 輸入框（`border-radius: 20px`，含 🔒 icon + protocol 灰色 + domain 白色高亮）+ `Go` 按鈕。

Mobile：極簡——只有 `[URL 輸入框][→ 按鈕]`，不顯示導覽按鈕。

### requests Monkey-Patch 策略

透過 `micropip.install('requests')` 安裝真正的 `requests` 函式庫（含 `urllib3`, `charset_normalizer`, `certifi`, `idna`），然後 monkey-patch `requests.adapters.HTTPAdapter.send()` 方法，將實際的 HTTP 傳輸替換為走 JS dispatch bridge → Service Worker 路由。

**替代方案：** 自建 requests shim（API 覆蓋不完整，使用者學到的不是真正的 Python 技能）；使用 Pyodide 內建的 `pyodide.http`（會繞過 SW 路由，打不到 challenge host）。

**Patch 注入點：** 在 `usePythonRuntime.ts` 的 `PythonRuntime.initialize()` 結尾，安裝 requests 後立即執行 patch Python code。Patch 需將 `PreparedRequest` 的 method/url/headers/body 轉為 JS bridge call，再包裝回 `urllib3.HTTPResponse`。

### Terminal 五層指令分級

| Tier | 範圍 | 生命週期 |
|------|------|---------|
| 1 | 核心 shell（help, ls, cat, cd, pwd, echo, mkdir, touch, cp, mv, rm, head, tail, wc, whoami, id, env, export, history, file, date, which, clear） | 永遠啟用 |
| 2 | 文字處理（grep, sed, awk, sort, uniq, cut, tr, tee, xargs, diff） | 永遠啟用 |
| 3 | 編解碼/雜湊（base64, xxd, md5sum, sha256sum, urlencode, urldecode） | 永遠啟用 |
| 4 | 網路工具（curl, wget） | 永遠啟用 |
| 5 | 滲透工具（dirb, dirsearch, sqlmap, jwt, hydra, nmap） | 出題者透過 `commands` 欄位控制 |

所有指令的 flag 語法和輸出格式對齊真實 Linux 工具。Tier 5 工具為精簡重寫，不支援的真實參數回傳明確訊息 + 官方文件連結。

**實作層級：** Tier 1 核心指令以 TypeScript 實作（不需 Pyodide 即可運行）。Tier 2~5 以 Python 實作（透過 Pyodide），確保文字處理邏輯與 Linux 行為一致。

### User Virtual FS

使用者虛擬檔案系統以 IndexedDB 為底層儲存，掛載在 `/home/hacker/`（預設使用者名稱 `hacker`，可透過 `export USER=xxx` 自訂）。

每個挑戰 slug 有獨立的 IndexedDB store，跨挑戰不共享。挑戰檔案（WASM 解密的 app 原始碼與 FS entries）不暴露在使用者 FS 中，只存在於 Pyodide/PHP runtime 內部。

Pipe 支援：`|` 串接指令，透過 shell parser 解析 pipeline，前一個指令的 stdout 作為後一個指令的 stdin。

### 挑戰 Per-Folder 檔案結構

```
docs/challenge/<slug>/
├── index.md
└── src/
    ├── .fsignore
    ├── app.py
    ├── flag.txt
    └── ...
```

Build pipeline（`challenge-keygen.ts`）改為：
1. 掃描 `docs/challenge/*/index.md`（取代 `docs/challenge/*.md`）
2. Slug 從資料夾名稱取得（取代從 `.md` 檔名）
3. 遞迴掃描 `src/`，套用內建預設排除 + `.fsignore`
4. Flag 來源：`frontmatter.flag`（可選，預設 `flag.txt`），相對於 `src/`
5. `app` 欄位改為 `src/` 內的相對路徑（如 `app: app.py`）
6. `fs` 欄位移除

### 出題者功能管控

Frontmatter 新增兩個可選欄位：

- `tools: [browser, terminal, code]` — UI tab allowlist。不寫 = 預設全開 `[browser, network, repeater, terminal, code]`
- `commands: [curl, jwt]` — Tier 5 滲透工具 allowlist。不寫 = 預設全關。`commands: all` = 全開

`ChallengeLayout.vue` 根據 `tools` 過濾 tab 列表；`useWxlsh.ts` 根據 `commands` 決定 Tier 5 指令是否可用。

### 出題者 Validate / Analyze 腳本

兩個獨立 TypeScript 腳本，註冊為 `pnpm challenge:validate` 和 `pnpm challenge:analyze`。

**validate**：逐項檢查 frontmatter 必填欄位、`src/` 結構、檔案存在性、backend 與 app 類型對應、`tools`/`commands` 值合法性。輸出 ✓/✗ 結果。

**analyze**：先執行 validate，再進行：檔案統計、payload 大小預估、flag 格式檢查、app 程式碼潛在問題掃描、功能啟用狀態摘要。

## Risks / Trade-offs

- [requests 安裝時間] requests + 4 個 dependencies 會增加 Pyodide runtime init 時間 → 可透過並行安裝與 CDN 快取緩解；init 期間顯示進度指示

- [Terminal 指令完整度] 精簡版 Tier 5 工具（sqlmap, dirsearch 等）只覆蓋常用參數 → 明確回報未支援參數並附官方文件連結，不會靜默忽略或杜撰行為

- [檔案結構遷移] 現有 3 個挑戰需從 flat 結構遷移到 per-folder → 可寫遷移腳本自動處理，風險低

- [Pipe 支援複雜度] 完整的 shell pipe + redirection 實作複雜 → 初期只支援 `|` pipe，不支援 `>`, `>>`, `<`, `2>&1` 等 redirection，後續可擴展

- [VitePress nav 隱藏] 隱藏 VitePress nav 可能影響未來 VitePress 升級 → 使用 CSS override（`display: none`）而非修改 VitePress 內部，升級風險低
