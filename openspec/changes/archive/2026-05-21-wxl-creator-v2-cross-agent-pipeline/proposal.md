## Why

現有的 `wxl-creator` 技巧只能在 Claude Code 跑得動 — 它依賴 `AskUserQuestion` 這個 Claude-only 原語、且 skill 安裝路徑只放在 `.claude/skills/`，等於排除掉 Codex CLI 與 Gemini CLI 兩家。涵蓋範圍也只有「建立題目」一個動作，maintainer 日常還有兩個需求沒被自動化：(a) 出完題後變更 backend / difficulty / tags（題目類型調整）；(b) 驗證題目是否真的可被一個 LLM 玩家用最小 context 解出（unintended unsolvable 過去多次發生在 sanitize 過狠的 SQLi / XSS 題，比賽當天才被選手回報）。本變更把技巧升級為跨三家 host agent、三階段管線（Create / Mutate / Verify），並引入「最小 context 盲解」的驗證層。

## What Changes

- Create 階段沿用 pnpm create:challenge 既有 scaffold，但 skill 完成 vuln code 寫入後額外產生 `tests/challenges/<slug>.spec.ts`（Playwright e2e exploit spec），並 best-effort 透過 chrome-devtools-mcp 即時驅動瀏覽器自我驗證 vuln 是否真的能拿到 flag；驗證失敗則修 vuln code 重試（上限 N 次）。
- 新增 Mutate 階段 CLI pnpm challenge:retype `<slug>` — 變更 backend 時自動 rename app 檔（`src/app.py` ↔ `src/index.php`）、swap skeleton import header（保留 vuln 主體；無法保留時 fail-fast）、更新 frontmatter 的 backend + app 欄位、重跑 keygen、同步調整 `tests/challenges/<slug>.spec.ts` 的 fetch path；變更 difficulty / tags / category 時只動 frontmatter。
- 新增 Verify 階段 CLI pnpm challenge:verify `<slug>` — orchestrate 四層 gate：L1 結構 + frontmatter lint（呼叫既有 validateChallenge export）、L2 內容 lint + keygen + wasm-tools validate runtime.wasm、L3 Playwright e2e 跑題目對應 spec、L4（--blind 旗標）spawn fresh agent CLI session 做最小 context 盲解。
- L4 盲解子系統：在 `tmp/wxl-verify/<slug>/player-package/` 組出只含 description.md（從 index.md 抽出本文，去除 maintainer 視角 frontmatter）+ META.yaml（含 BASE_URL、FLAG_REGEX、turn budget）的玩家視角資料夾，依 `WXL_VERIFY_RUNTIME` 環境變數（預設 claude）選擇 host agent CLI 並 spawn fresh non-interactive session，agent 透過 chrome-devtools-mcp 驅動真實瀏覽器解題，最後回傳的 final_flag 與 `docs/challenge/<slug>/src/flag.txt` byte-compare；artefacts 不持久化、不入 git、不留 trace。
- Skill 內所有 `AskUserQuestion` 呼叫改為 plain-text 提問格式（讓 host agent 自然把問句輸出、等使用者回應），prose 不再綁定任何 Claude-only 原語。
- Skill 真實來源從 `.claude/skills/wxl-creator/` 遷移至 `.agent/skills/wxl-creator/` 作為單一來源；`.claude/skills/wxl-creator/SKILL.md`、`.codex/skills/wxl-creator/SKILL.md`、`.gemini/skills/wxl-creator/SKILL.md` 三個位置改成 thin pointer（每個檔只含「請讀 `.agent/skills/wxl-creator/SKILL.md`」的指示性內容，三家 host agent 載入時會 follow pointer）。
- 新增 devDependency `@playwright/test`；README 與 CONTRIBUTE.md 補上「首次安裝後需執行 pnpm exec playwright install chromium」與 verify gate 說明。
- **BREAKING**：`.claude/skills/wxl-creator/SKILL.md` 從完整 skill 內容退化為 pointer。任何下游（目前 repo 內無此引用）若直接 import 該檔案完整內容，需改向 `.agent/skills/wxl-creator/SKILL.md`。

## Capabilities

### New Capabilities

- `wxl-blind-solve-verification`: L4 盲解驗證子系統。負責建構最小 context 的玩家視角資料夾、依 `WXL_VERIFY_RUNTIME` 環境變數選擇 host agent CLI（claude / codex / gemini）並 spawn 帶有 turn budget 的 fresh non-interactive session、提供 prompt template 讓 agent 知道目標 URL 與輸出 final_flag 的固定格式、回收 final_flag 並與 canonical flag byte-compare、轉成 exit code（0 = solved、2 = inconclusive、1 = fail）；所有 artefacts 在 verify 結束後刪除，不寫進 `docs/challenge/<slug>/solution/`、不入 git。

### Modified Capabilities

- `wxl-creator-skill`: 加 Mutate 階段 Requirement（skill 透過 pnpm challenge:retype 改 backend / difficulty / tags、不直接 Edit 檔案）；加 Verify 階段 Requirement（skill 在 Create 結束時自動跑 pnpm challenge:verify、結果不過則進 fix loop）；加 host-agent-neutral Requirement（禁用 AskUserQuestion、所有提問用 plain text、skill prose 只能用 shell-invocable CLI 與 Read/Write/Edit 等三家共有的 tool 名稱）；加 skill 安裝位置 Requirement（單一來源 `.agent/skills/wxl-creator/`、三家 thin pointer）；加 Create 階段 Playwright spec 自動生成 Requirement（從 `templates/exploit-spec.ts.tmpl` 套出）；加 Create 階段 chrome-devtools-mcp 自我驗證 Requirement（best-effort、MCP 不可用時降級）。
- `challenge-author-scripts`: 加 pnpm challenge:retype CLI Requirement（accept --backend / --difficulty / --tags 三組 flag、行為如 What Changes 所述）；加 pnpm challenge:verify CLI Requirement（accept --blind 旗標、L1-L3 預設執行、L4 opt-in、exit code 與 stdout 格式契約）；加 @playwright/test 為 devDependency 的 Requirement（含首次安裝後 pnpm exec playwright install chromium 步驟）。

## Impact

- Affected specs:
  - `openspec/specs/wxl-creator-skill/spec.md` (modified)
  - `openspec/specs/challenge-author-scripts/spec.md` (modified)
  - `openspec/specs/wxl-blind-solve-verification/spec.md` (new)
- Affected code:
  - New:
    - `scripts/challenge-retype.ts`
    - `scripts/challenge-verify.ts`
    - `scripts/challenge-verify-blind.ts`
    - `scripts/wxl-solver/build-player-package.ts`
    - `scripts/wxl-solver/spawn-runtime.ts`
    - `scripts/wxl-solver/extract-flag.ts`
    - `tests/challenges/door-is-open.spec.ts`
    - `.agent/skills/wxl-creator/SKILL.md`
    - `.agent/skills/wxl-creator/SKILL.zhTW.md`
    - `.agent/skills/wxl-creator/AGENTS.md`
    - `.agent/skills/wxl-creator/reference/agent-tools.md`
    - `.agent/skills/wxl-creator/reference/runtime-cli.md`
    - `.agent/skills/wxl-creator/templates/exploit-spec.ts.tmpl`
    - `.codex/skills/wxl-creator/SKILL.md`
    - `.gemini/skills/wxl-creator/SKILL.md`
  - Modified:
    - `.claude/skills/wxl-creator/SKILL.md`
    - `package.json`
    - `.gitignore`
    - `README.md`
    - `CONTRIBUTE.md`
  - Removed: (none)
