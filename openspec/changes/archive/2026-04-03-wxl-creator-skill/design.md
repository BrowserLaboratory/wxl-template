## Context

wxl 專案是一個瀏覽器端的 Web 漏洞練習平台，challenge 以 per-folder 結構存放在 `docs/challenge/<slug>/` 下。目前出題流程為：

1. 跑 `pnpm create:challenge --name <slug> --backend <type>` 產生 skeleton
2. 手動編輯 `src/app.py`（或 `index.php`）加入漏洞
3. 手動更新 `index.md` frontmatter 的 description、tags 等
4. 分別跑 `pnpm challenge:analyze <slug>` 和 `pnpm challenge:validate <slug>` 檢查

這個 skill 將以上步驟封裝為一個互動式流程，放在 `.agent/skills/wxl-creator`。

專案已有的基礎設施：
- `scripts/create-challenge.ts`：接受 `--name`、`--backend`、`--difficulty`、`--flag`、`--title`，scaffold 完自動跑 keygen
- `scripts/challenge-validate.ts`：驗證 frontmatter 格式、檔案存在性、tools/commands 合法性
- `scripts/challenge-analyze.ts`：驗證 + 內容分析（flag 格式、localhost 引用、檔案大小估算）
- `.agent/skills/` 目錄下已有 spectra 系列 skill 可參考結構

## Goals / Non-Goals

**Goals:**

- 透過 `AskUserQuestion` 互動收集出題所需的所有參數
- 自動呼叫 `pnpm create:challenge` 完成 scaffold
- 根據漏洞類型和描述，生成包含真實漏洞的應用程式碼
- 自動更新 `index.md` frontmatter（description、tags、source_visible 等）
- 執行 analyze + validate 驗證，失敗時進入自動修正循環
- 提供可設定的循環限制器，防止無限修正

**Non-Goals:**

- 不修改現有的 scripts — 直接當作黑盒呼叫
- 不產生解題 writeup 或解法
- 不處理 challenge 的部署或發布
- 不新增 CLI 工具

## Decisions

### Skill 檔案結構

採用單檔 skill + config 分離的結構：

```
.agent/skills/
  wxl-creator           ← skill 主檔（markdown，含 frontmatter）
  wxl-creator/
    config.local.md     ← 使用者可設定的 config（YAML frontmatter）
```

**理由**: 與現有 `.agent/skills/spectra-*` 系列結構一致。config 放在子資料夾的 `.local.md` 中，遵循 plugin-settings 的 pattern，允許使用者自訂且不進 git。

**替代方案**: 把 config 直接寫在 skill frontmatter 裡 — 但這樣使用者無法自訂而不改動 skill 本身。

### 互動收集流程設計

使用 `AskUserQuestion` 分三輪收集：

**第一輪**（必填）：
- 題目名稱（slug）：kebab-case
- Backend 類型：flask / fastapi / php
- 漏洞類型：自由文字輸入（例如 SQLi、XSS、SSRF、LFI、RCE 等）

**第二輪**（題目內容）：
- 題目描述：情境說明，Claude 根據這個描述生成漏洞程式碼
- 難度：easy / medium / hard

**第三輪**（可選，有預設值）：
- Flag 格式：預設 `FLAG{<slug>_<random>}`，可自訂
- Title：預設從 slug 轉 Title Case

**理由**: 分輪收集避免一次問太多問題讓使用者疲勞。必填項先問、可選項最後問並提供預設值。

**替代方案**: 一次問全部 — 但 `AskUserQuestion` 一次只能問一個問題，多輪是必然的。如果使用者在初始 prompt 中已經提供了部分資訊，skill 應直接使用，跳過對應的詢問。

### 漏洞程式碼生成策略

Scaffold 完成後，skill 讀取 `src/app.py`（或 `index.php`），根據收集到的漏洞類型和描述，重寫檔案內容為包含真實漏洞的版本。

**生成原則**：
- 保持程式碼結構與 skeleton 一致（入口點、import 風格）
- 漏洞必須是真實可利用的，但有明確的攻擊面
- Flag 從 `/flag.txt` 讀取（與 skeleton pattern 一致）
- 根據漏洞類型自動推薦 `packages` 清單（例如 SQLi 需要 sqlite3）

**理由**: 這是 skill 的核心價值 — 把「想像漏洞」→「寫出漏洞程式碼」的步驟自動化。

### 自動修正循環設計

```
validate/analyze
    │
    ├─ 全部通過 → 結束
    └─ 有錯誤 →
        ├─ 超過循環上限 → 顯示剩餘錯誤，結束
        └─ 未超過 →
            ├─ 自動修正
            ├─ 顯示 diff 給使用者確認
            ├─ 使用者確認 → 重跑 validate
            └─ 使用者拒絕 → 顯示錯誤，結束
```

- 循環上限預設 10 次
- 每次修正後顯示變更內容，等使用者確認才繼續
- 可透過 `config.local.md` 設定 `max_fix_attempts` 覆蓋預設值

**理由**: 自動修 + 人工確認平衡效率與安全。限制器防止無限迴圈。10 次足以處理大部分 frontmatter/結構性問題，但不會讓使用者等太久。

### Config 格式

```markdown
---
max_fix_attempts: 10
---
```

Skill 在啟動時讀取 `.agent/skills/wxl-creator/config.local.md`，解析 YAML frontmatter 取得設定值。若檔案不存在則使用預設值。

**理由**: 遵循 plugin-settings pattern（`.local.md` + YAML frontmatter），使用者可在不修改 skill 的情況下調整行為。

## Risks / Trade-offs

- **[風險] 漏洞程式碼品質不穩定** → 漏洞生成依賴 LLM 能力，可能產出不可利用或過於簡單的漏洞。減緩方式：validate + analyze 流程會抓住結構性問題；真正的漏洞品質需要出題者自行驗證。
- **[風險] 自動修正可能改壞漏洞邏輯** → 每次修正都要使用者確認 diff，不會靜默套用。
- **[風險] 循環限制器用完仍有錯誤** → 顯示剩餘錯誤讓使用者手動處理，不會阻塞。
- **[取捨] 分輪收集較慢** → 比一次收集慢，但使用者體驗更好，且 AskUserQuestion 的限制使分輪成為必然。
