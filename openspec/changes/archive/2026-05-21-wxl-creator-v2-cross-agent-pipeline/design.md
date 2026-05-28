## Context

`wxl-template` 平台目前的出題流程由四個 pnpm CLI 與一個 Claude-only 技巧拼起來：

- pnpm create:challenge — scaffold 題目目錄、產 backend skeleton、寫 `flag.txt`、跑 keygen
- pnpm challenge:validate — frontmatter / structure lint
- pnpm challenge:analyze — flag pattern、localhost grep、檔案大小估算
- pnpm challenge:keygen — 把 `src/` 加密成 `runtime.wasm`
- `.claude/skills/wxl-creator/SKILL.md` — Claude Code 內的「建立題目」orchestration 技巧

技巧本身在 `.claude/skills/` 之下、且呼叫 Claude-only 的 `AskUserQuestion` tool — 等於排除 Codex CLI 與 Gemini CLI。技巧也只負責 Create；題目出完後若要 (a) 改 backend、改 difficulty、改 tags（「題目類型調整」），或 (b) 驗證題目是否仍可被一個 LLM 玩家用最小 context 解出（「自動化測試題目是否正確」），都得 maintainer 手動處理。歷次 wxl 比賽前的事故清單中，**unintended unsolvable**（sanitize 過狠導致誰都解不出來）佔了相當大的比例，且通常要等到比賽當天選手抱怨才被發現。

Stakeholders：

- 出題者 — 想用任一家 host agent runtime（Claude Code / Codex CLI / Gemini CLI）跑同一套出題流程。
- 平台維運者 — 想在 release path 上有「題目實際可解」的自動 gate，不再依賴 maintainer 手動點瀏覽器驗收。
- CI / pre-commit — 不被本變更影響（Verify 是 maintainer 手動 gate，不掛 commit-time block）。

Constraints：

- 三家 host agent 共有的基本能力只有 Bash、Read、Write、Edit、Glob、Grep — 任何 Claude-only / Codex-only / Gemini-only 原語都不能寫進 skill prose。
- wxl 題目跑在瀏覽器內（Service Worker 攔 fetch → WASM runtime 處理），任何驗證若不走真實 Chromium 就摸不到 WASM 行為。
- `wxl-template` 既有工具鏈是 Node.js + pnpm + Rust + wasm-pack；引入 Python toolchain 會破壞「pnpm install 就齊全」的 contributor 體驗。
- `ctf_challenges` 那邊的 `tools/auto-solve/` 是 Docker-based HTTP 題目專用，套用模型跟 wxl 不符，已決定不類比。

## Goals / Non-Goals

**Goals:**

- 技巧在 Claude Code、Codex CLI、Gemini CLI 三家都能跑 Create / Mutate / Verify 三階段，prose 只用 shell-invocable CLI 與三家共有 tool。
- 出題流程涵蓋率從「只 Create」擴到「Create + Mutate + Verify」。
- Verify 階段含四層 gate（L1 結構 lint、L2 內容 + WASM build 驗證、L3 確定性 Playwright e2e、L4 最小 context 盲解），且任何 maintainer 在 release path 上都能用單一指令跑完全部 gate。
- L4 盲解可由 maintainer 指定 host agent runtime（透過 `WXL_VERIFY_RUNTIME` 環境變數），三家都支援。
- Skill 真實來源單一化在 `.agent/skills/wxl-creator/`；三家 host agent 的 discovery 路徑只放 thin pointer。
- Harness 全程 TypeScript，沿用既有 pnpm 工具鏈，不引入 Python、Docker、額外 system dependency（瀏覽器 binary 由 `@playwright/test` 安裝指令處理）。

**Non-Goals:**

- 不引入 `docs/challenge/<slug>/solution/` 目錄、不持久化 agent run trace、不沿用 `ctf_challenges` 的 `tools/auto-solve/` Python harness 形式。
- 不把 Verify 掛到 `pnpm challenge:lint-staged` / git pre-commit hook — Verify 是 maintainer 手動 gate，不是 commit-time block。
- 不改 `scripts/create-challenge.ts`、`scripts/challenge-validate.ts`、`scripts/challenge-analyze.ts`、`scripts/challenge-keygen.ts` 的既有 CLI 介面與輸出格式 —Verify 內部 import 它們的 export，不重做。
- 不重做 `docs/challenge/door-is-open/` canonical reference（繼續沿用）。
- 不在本變更內處理 Verify 結果的 CI 報表化、不引入 Verify dashboard — 那是後續變更的事。
- L4 盲解結果**不**寫進 `docs/challenge/<slug>/`、不入 git；只回 exit code 與 stdout summary。
- 不引入 Verify 結果 caching；每次 pnpm challenge:verify 都重跑全部 gate。

## Decisions

### Decision 1: Skill 真實來源放 `.agent/skills/wxl-creator/`，三家用 thin pointer

**What:** 完整 skill prose（SKILL.md、SKILL.zhTW.md、AGENTS.md、reference/、templates/）只放在 `.agent/skills/wxl-creator/`。`.claude/skills/wxl-creator/SKILL.md`、`.codex/skills/wxl-creator/SKILL.md`、`.gemini/skills/wxl-creator/SKILL.md` 各自只含一段指向真實來源的指示性內容（一行 frontmatter + 一句「讀 `.agent/skills/wxl-creator/SKILL.md`」）。

**Why:** 三家共用一份真實內容、避免 drift；任何 prose 修改只動一處。

**Alternatives considered:**

- *三份完整 SKILL.md 各自獨立* — 修改要同步三處，第一次 drift 就出包。淘汰。
- *symlink 而非 pointer 檔* — Windows / 部分 CI runner 對 symlink 支援不完整；pointer 檔是純文字、版本控制系統處理穩定。採 pointer。
- *統一放 `.shared/skills/`* — 違反三家現有的 skill discovery 慣例（Claude 看 `.claude/`、Codex 看 `.codex/`、Gemini 看 `.gemini/`）。淘汰。

### Decision 2: 移除 `AskUserQuestion`、改成 plain-text 提問

**What:** Skill prose 內所有「問使用者一個有選項的問題」的場景，改成 host agent 自然輸出一段問句（含選項列舉與「請回覆 1/2/3 或自訂內容」的提示），然後等下一輪使用者訊息。

**Why:** `AskUserQuestion` 是 Claude Code 專屬 tool，Codex / Gemini 沒有對應原語；strip 掉是「三家共用」的必要條件。

**Alternatives considered:**

- *三家各自寫一份 SKILL.md* — 違反 Decision 1。淘汰。
- *引入跨家提問 MCP server* — 大幅增加部署成本；plain text 提問已足夠。淘汰。

### Decision 3: Mutate 階段拆獨立 CLI（pnpm challenge:retype）而非 skill 內 Edit

**What:** 新增 `scripts/challenge-retype.ts`，提供下列形式：

```
pnpm challenge:retype <slug> --backend <new>
pnpm challenge:retype <slug> --difficulty <new>
pnpm challenge:retype <slug> --tags 'sql,injection,flask'
pnpm challenge:retype <slug> --category <new>
```

可組合多個 flag。Skill prose 只呼叫此 CLI，不直接 Edit 檔案。

**Why:** 變更 backend 涉及 rename app 檔（`src/app.py` ↔ `src/index.php`）、swap skeleton import header、重跑 keygen、調整對應 spec 檔的 fetch path — 這些是檔案系統 + 編譯 + 測試的多步操作，必須有測試覆蓋。寫進 CLI 才能用 Vitest 測；寫在 skill prose 內無法測。

**Alternatives considered:**

- *Skill 透過 Read + Write + Bash 自己手動編排* — 跨家行為一致性差、無法回歸測試。淘汰。
- *把 mutate 加進 `create-challenge.ts`* — 違反 Goals 的「不改既有 CLI 介面」。淘汰。

### Decision 4: Verify pipeline 採 L1-L4 四層 gate

**What:** 新增 `scripts/challenge-verify.ts`，預設跑 L1 + L2 + L3、`--blind` 旗標加上 L4。

| 層 | 內容 | 既有 / 新增 |
|---|---|---|
| L1 | validate + analyze（沿用既有 export） | 既有 |
| L2 | keygen + wasm-tools validate | keygen 既有；wasm-tools validate 新增呼叫 |
| L3 | Playwright e2e 跑 `tests/challenges/<slug>.spec.ts` | 新增 |
| L4 | spawn fresh agent CLI 做最小 context 盲解 | 新增 |

**Why:** 四層由淺入深、由 deterministic 到 LLM-driven；前三層在每次 commit / PR 都跑得起，L4 因為要燒 LLM token、限定在 release 前手動觸發。

**Alternatives considered:**

- *只 L1 + L2*（既有兩個 CLI 已涵蓋的最小版本）— 抓不到「題目 Playwright 跑得過但實際解題路徑壞了」的情況。淘汰。
- *只 L1 + L2 + L3* — Playwright spec 是 LLM 自己寫的，等於「LLM 寫了題又寫了自己對自己的解答」，無法測 unintended unsolvable。L4 不能省。
- *把 L1-L4 拆四個 CLI（pnpm challenge:lint / pnpm challenge:e2e / ...）* — 違反「單一指令跑完全部 gate」Goal。淘汰。

### Decision 5: L4 採 spawn fresh agent CLI session、放棄 ctf-solver 風格 sub-agent

**What:** L4 由 `scripts/challenge-verify-blind.ts` 實作 — 讀 `WXL_VERIFY_RUNTIME`（預設 claude），依此 spawn 對應 CLI 的 non-interactive session（claude --print、codex exec、gemini -p），帶上 turn budget 上限、--working-dir / --add-dir 鎖住玩家視角資料夾、prompt 內含 BASE_URL 與 FLAG_REGEX，由 agent 自己決定怎麼解。

**Why:** ctf-solver 是 Claude `Agent` tool + `subagent_type` 的形式，Claude-only、且仰賴 same-session sub-agent；Codex / Gemini 沒有對應原語。Spawn 獨立 CLI session 是三家共有的、最低成本的「給 agent 一個新 context」做法。

**Alternatives considered:**

- *Same-session sub-agent dispatch（Claude Agent tool）* — Claude-only。淘汰。
- *固定 payload 的 Playwright fuzz（不靠 LLM）* — 退化成 pattern matching，失去「LLM 玩家視角」訊號。淘汰。
- *Spawn 後 sub-agent 走 ctf-solver-style 完整 trace / writeup* — 持久化 artefacts 違反 Non-Goals。本變更只取 exit code 與 final_flag 一個 bit。

### Decision 6: Player-package 寫在 `tmp/wxl-verify/<slug>/`、verify 結束即刪、不引入 `solution/` 目錄

**What:** L4 spawn 前在 `tmp/wxl-verify/<slug>/player-package/` 寫入：

- description.md（從 `docs/challenge/<slug>/index.md` 抽出 H1 以下的本文，去掉 maintainer 視角的 frontmatter）
- META.yaml（含 BASE_URL、FLAG_REGEX、turn_budget、verification_run_id）

**沒有的東西：**

- 沒有 `src/` 副本
- 沒有 `flag.txt` 副本
- 沒有 `tests/challenges/<slug>.spec.ts` 副本
- 沒有 `docs/challenge/<slug>/solution/` 目錄、沒有 agent-runs/、沒有 trace.jsonl

verify 程序結束（無論 pass / fail）時，整個 `tmp/wxl-verify/<slug>/` 立刻刪除。`.gitignore` 加 `tmp/wxl-verify/` 防意外入 git。

**Why:** ctf_challenges 那邊持久化所有 trace 是因為它有「campaign-level 對 N 題的整體報表」需求；wxl 不需要這層 — 每題只需要「過 / 沒過」一個 bit。持久化反而會把 maintainer 視角資料留在 release tree 內，違反「題目對玩家應該是黑箱」原則。

**Alternatives considered:**

- *持久化到 `docs/challenge/<slug>/solution/agent-runs/`* — 違反 Non-Goals，且要處理 VitePress ignore + keygen 排除。淘汰。
- *持久化到 repo 外 `~/.wxl-verify-runs/`* — 失去「co-locate artefact 跟題目」的好處，但又不能直接被 VCS 追蹤，定位不清。淘汰。

### Decision 7: L3 e2e 採 Playwright + `tests/challenges/<slug>.spec.ts`

**What:** 引入 `@playwright/test` 為 devDependency，每題對應一個 `tests/challenges/<slug>.spec.ts`。Spec 內容由 skill 在 Create 階段從 `templates/exploit-spec.ts.tmpl` 套出，包含：launch chromium → `page.goto(BASE_URL)` → `page.waitForFunction('navigator.serviceWorker.controller !== null')` → `page.evaluate` 發 exploit fetch → assert response body 含 `FLAG_REGEX` 匹配的字串。

**Why:** Playwright 是純 pnpm 套件、三家對等；Service Worker 攔截 + WASM runtime 都要靠真實 Chromium 才測得到。spec 檔由 skill 自動寫、不用 maintainer 手寫（但 maintainer 可以後續編輯）。

**Alternatives considered:**

- *Vitest + JSDOM* — JSDOM 沒有 Service Worker 支援。淘汰。
- *Node fetch（不開瀏覽器）* — 不會經過 Service Worker、摸不到 WASM。淘汰。
- *chrome-devtools-mcp 跑 L3* — MCP 走 host agent，需要每次 verify 都帶 LLM；L3 應該是 deterministic。淘汰。

### Decision 8: Harness 全程 TypeScript、不引入 Python

**What:** 所有新 CLI（challenge-retype、challenge-verify、challenge-verify-blind、wxl-solver/*）都用 TypeScript 寫，呼叫方式為 pnpm script、執行為 tsx；`@playwright/test` 是唯一新加的 system-impact dependency（瀏覽器 binary 約 170MB）。

**Why:** wxl-template 既有 README 強調「Node.js + pnpm 即可」的 contributor 體驗、CI 也只裝 Node + Rust；引入 Python 會破壞此承諾。`ctf_challenges` 那邊 `tools/auto-solve/lib/` 的核心邏輯（player-package loader、writeup schema 驗證、final_flag 比對）總共不到 500 行，重寫成 TypeScript 是一次性成本但換得型別安全 + 統一工具鏈。

**Alternatives considered:**

- *Python harness（直接複用 ctf_challenges 的 lib）* — 違反「pnpm install 就齊全」。淘汰。
- *Bash script* — 跨平台坑太多、缺乏型別保護。淘汰。

### Decision 9: Create 階段 chrome-devtools-mcp 自我驗證採 best-effort、MCP 不可用則優雅降級

**What:** Skill 在 Create 完成寫 vuln code + 寫 `tests/challenges/<slug>.spec.ts` 之後，**嘗試**透過 chrome-devtools-mcp 載 `http://localhost:5173/challenge/<slug>/`、發 exploit、確認回 flag。MCP 不可用、dev server 未啟動、或 exploit 跑失敗超過 N 次時，skill 不阻斷、改提示使用者「請手動跑 pnpm challenge:verify `<slug>` 確認」並收工。

**Why:** 三家 MCP 支援成熟度不一（Gemini CLI 較新），強制要求會讓 Gemini 使用者卡住。Verify 階段已經是 release-blocking gate；Create 階段的自我驗證是錦上添花，best-effort 即可。

**Alternatives considered:**

- *強制 MCP 可用* — 排除 Gemini 使用者。淘汰。
- *不做 Create-time 自我驗證* — 失去「LLM 寫完馬上知道對不對」的快回饋。採 best-effort 折衷。

## Implementation Contract

本節為 apply 階段的單一真實來源；任何後續 implementer 不需重新進行本次討論即可動工。

### 跨家 skill 安裝契約（Skill Cross-Agent Layout）

**Behavior:**

- 三家 host agent runtime 載入 `/wxl-creator` 技巧時，必須能讀到**同一份 prose 內容**。
- 修改 prose 只在 `.agent/skills/wxl-creator/` 動一處；三個 pointer 檔不再需要同步更新。
- 任何使用者在任一家 runtime 下 `cat .claude/skills/wxl-creator/SKILL.md` 或 `cat .codex/skills/wxl-creator/SKILL.md` 或 `cat .gemini/skills/wxl-creator/SKILL.md`，看到的都是一段 pointer 文字，指向 `.agent/skills/wxl-creator/SKILL.md`。

**Interface / file shape:**

- `.agent/skills/wxl-creator/SKILL.md` — 英文 imperative prose（為「skill 主體」）
- `.agent/skills/wxl-creator/SKILL.zhTW.md` — 繁中映射（內容與 SKILL.md 對齊）
- `.agent/skills/wxl-creator/AGENTS.md` — 跨家 dispatcher 說明（誰在何時呼叫此技巧）
- `.agent/skills/wxl-creator/reference/agent-tools.md` — 三家工具對照表（哪家 runtime 用哪個 tool 對應 prose 提到的能力）
- `.agent/skills/wxl-creator/reference/runtime-cli.md` — L4 spawn fresh CLI 的三家對照（命令、flag、output 解析）
- `.agent/skills/wxl-creator/templates/exploit-spec.ts.tmpl` — Playwright spec template（含可替換變數 SLUG / BASE_URL / EXPLOIT_PATH / EXPLOIT_PAYLOAD / FLAG_REGEX）
- `.claude/skills/wxl-creator/SKILL.md` — pointer 檔，內容固定為：

```
---
name: wxl-creator
description: Use when creating, mutating, or verifying a wxl challenge. See .agent/skills/wxl-creator/SKILL.md for the canonical prose.
---

Read `.agent/skills/wxl-creator/SKILL.md` for the canonical skill content.
```

- `.codex/skills/wxl-creator/SKILL.md`、`.gemini/skills/wxl-creator/SKILL.md` — 同上 pointer 格式（必要時依各家 frontmatter 慣例微調 key 名稱）。

**Failure modes:**

- pointer 檔找不到真實來源 → host agent 載入失敗、顯示 file-not-found 錯誤、使用者得手動修。
- 真實來源 SKILL.md 內含 Claude-only / Codex-only / Gemini-only 原語 → prose 違反 host-agent-neutral 契約、apply 時 spec 驗證會 fail。

**Acceptance criteria:**

- 在 Claude Code 內 `/wxl-creator` 載入後執行 Create flow 直到 scaffold + spec.ts 寫出。
- 在 Codex CLI 內 `/wxl-creator` 載入後執行同樣 flow，結果應一致。
- 在 Gemini CLI 內 `activate_skill wxl-creator` 後執行同樣 flow，結果應一致。
- `git grep -nE 'AskUserQuestion|subagent_type|Agent\(' .agent/skills/wxl-creator/` 應回 0 個結果。

**Scope boundaries:**

- 範圍內：`.agent/skills/wxl-creator/` 內容、三家 pointer 檔。
- 範圍外：對 `.claude/agents/`（subagent 定義目錄）的任何改動；對其他技巧（`spectra-*`）的改動。

### Mutate CLI 契約（`scripts/challenge-retype.ts`）

**Behavior:**

- 接受形式：`pnpm challenge:retype <slug> [--backend <new>] [--difficulty <new>] [--tags <comma-list>] [--category <new>]`，至少要帶一個 flag。
- 變更 backend 時：
  - 讀 `docs/challenge/<slug>/index.md` 的 frontmatter，比對舊 backend 與新 backend。
  - 若新舊都是 Python 系（flask / fastapi）：app 檔名不變（仍是 `src/app.py`）、只改 import / 框架初始化 header；保留 vuln 主體（route handler 內容、template、SQL 字串等）。
  - 若新舊跨語言（Python ↔ PHP）：rename app 檔（`src/app.py` ↔ `src/index.php`）、依新 backend 重灌完整 skeleton header、**保留**原 vuln 邏輯的語意（如 SQL injection 點、template 變數）但改用新語言語法；無法保留時（例如 vuln 主體依賴特定 framework 的 vulnerability）以非零 exit code 拒絕、列印「需手動 retype；reason: <reason>」。
  - 更新 frontmatter 的 `backend`、`app`、必要時 `packages` 欄位。
  - 重跑 pnpm challenge:keygen `<slug>`。
  - 同步更新 `tests/challenges/<slug>.spec.ts` 的 BASE_URL（不會變）與 EXPLOIT_PATH（可能因 framework 改變而變、需要 best-effort 推導；無法推導時保留原值、列印警告）。
- 變更 difficulty / tags / category 時：只 Edit frontmatter，不動程式碼、不重跑 keygen。
- 完成後印出「✓ Mutated <slug>: <changes-summary>」並 exit 0；失敗時 exit 非 0 並印錯誤原因。

**Interface / data shape:**

- 輸入 flag：
  - `--backend` 接受 `flask` / `fastapi` / `php` 之一
  - `--difficulty` 接受 `easy` / `medium` / `hard` 之一
  - `--tags` 接受 comma-separated 字串
  - `--category` 接受任意字串（與既有 challenge category 慣例對齊）
- 輸出格式：純文字到 stdout，無 JSON 形式。
- Exit code：0 = 成功；1 = 使用者輸入錯誤；2 = vuln 主體無法自動轉換；3 = 內部錯誤（IO / keygen 失敗）。

**Failure modes:**

- 找不到 `docs/challenge/<slug>/` → exit 1、列「Challenge <slug> not found」。
- `--backend` 帶不認得的值 → exit 1、列接受值。
- 跨語言轉換需手動 → exit 2、列「需手動 retype；reason: <reason>」、保持檔案系統未動。
- keygen 失敗 → exit 3、保留現場供 debug。

**Acceptance criteria:**

- 對既有 `door-is-open`（fastapi 題）跑 `pnpm challenge:retype door-is-open --difficulty hard`，frontmatter difficulty 變 hard，其他不動，`pnpm challenge:verify door-is-open` 仍通過。
- 對 `door-is-open` 跑 `pnpm challenge:retype door-is-open --backend flask`（同 Python 系），app.py 仍存在但 import header 更新，IDOR vuln 主體保留，verify 仍過。
- 對 `door-is-open` 跑 `pnpm challenge:retype door-is-open --backend php` — exit 2、列「需手動 retype；reason: sqlite3 IDOR pattern 需以 PDO 重寫」、檔案系統未動。
- Vitest 單元測試覆蓋上述四情境。

**Scope boundaries:**

- 範圍內：`scripts/challenge-retype.ts`、Vitest 對應測試、`package.json` scripts。
- 範圍外：對 `scripts/create-challenge.ts` 既有行為的修改；對 `scripts/challenge-keygen.ts` 既有 CLI 介面的修改（內部 import 它的 export 是 OK）。

### Verify CLI 契約（`scripts/challenge-verify.ts`）

**Behavior:**

- 接受形式：`pnpm challenge:verify <slug> [--blind] [--layers L1,L2,L3,L4]`。
- 預設跑 L1 + L2 + L3；帶 `--blind` 加上 L4；帶 `--layers` 指定子集（用於 debug）。
- L1：呼叫既有 `validateChallenge()` export（`scripts/challenge-validate.ts`）。
- L2：呼叫既有 analyze 邏輯（`scripts/challenge-analyze.ts`）、然後跑 pnpm challenge:keygen `<slug>` 確認 keygen 成功、最後對產出的 `docs/challenge/<slug>/runtime.wasm` 跑 wasm-tools validate。
- L3：呼叫 pnpm exec playwright test `tests/challenges/<slug>.spec.ts`。
- L4：呼叫 `scripts/challenge-verify-blind.ts`（見下節）。
- 每一層完成都印出「✓ L<n> passed」或「✗ L<n> failed: <reason>」、最後印 summary 並依結果 exit。

**Interface / data shape:**

- Stdout 格式：每行一個事件（「✓ L1 passed」、「✗ L3 failed: spec.ts assertion failed at line 42」等）；最末行為 summary（「verified: <slug> (L1 L2 L3)」或「failed: <slug> at L3」）。
- 提供 `--json` 旗標把整份結果輸出成單一 JSON object（用於 CI 整合）；JSON shape：
  ```
  {
    "slug": "...",
    "layers_run": ["L1","L2","L3"],
    "results": [{"layer":"L1","status":"pass","reason":null}, ...],
    "summary": "verified" | "failed" | "inconclusive",
    "failed_at": null | "L3"
  }
  ```
- Exit code：0 = 全部跑的 layer 都過；1 = 至少一 layer fail；2 = L4 inconclusive（layer fail 仍走 1）。

**Failure modes:**

- 任一層 fail → 後續層不再跑（fail-fast）、印錯誤、exit 1。
- L4 spawn agent CLI 失敗（CLI 不存在、turn budget 耗盡、agent 沒回 final_flag）→ inconclusive、exit 2、印「L4 inconclusive: <reason>」。
- pnpm docs:dev 未啟動 → L3 fetch 會 timeout、視為 L3 fail、提示使用者「verify 需要 dev server 已啟動於 localhost:5173」。

**Acceptance criteria:**

- `pnpm challenge:verify door-is-open` 對既有 IDOR 題完整跑 L1+L2+L3 並 pass。
- `pnpm challenge:verify door-is-open --blind` 跑完 L1-L4、L4 用預設 claude runtime、final_flag 與 `src/flag.txt` match、exit 0。
- 故意破壞 `door-is-open/src/app.py`（例如把 vuln 補上 sanitize），verify 應 L3 fail。
- Vitest 單元測試覆蓋（mock 各 layer、驗 orchestration 行為）。

**Scope boundaries:**

- 範圍內：`scripts/challenge-verify.ts`、Vitest 測試。
- 範圍外：本 CLI 不處理 challenge spec 的自動生成（那是 Create 階段 skill 的事）；不處理 verify 結果 caching。

### L4 Blind-solve 契約（`scripts/challenge-verify-blind.ts` + `scripts/wxl-solver/*.ts`）

**Behavior:**

- `challenge-verify-blind.ts` 是 `challenge-verify.ts` 的 sub-routine、也可獨立呼叫。
- 流程：
  1. 確認 `pnpm docs:dev` 已啟動於 localhost:5173；未啟動則 inconclusive。
  2. 呼叫 `wxl-solver/build-player-package.ts` 在 `tmp/wxl-verify/<slug>/player-package/` 寫 description.md（從 `docs/challenge/<slug>/index.md` 抽 H1 以下本文）+ META.yaml（含 BASE_URL=`http://localhost:5173/challenge/<slug>/`、FLAG_REGEX=`^FLAG\{[^}]+\}$` 或 `^CTF\{[^}]+\}$`、turn_budget=30、verification_run_id=ISO-UTC-timestamp）。
  3. 呼叫 `wxl-solver/spawn-runtime.ts` 讀 `WXL_VERIFY_RUNTIME`（預設 claude）、組對應 CLI 命令（見 reference/runtime-cli.md 對照表）、spawn 子程序、把 stdout 寫進 `tmp/wxl-verify/<slug>/run.log`。
  4. 子程序結束後呼叫 `wxl-solver/extract-flag.ts` 解析 stdout JSON、抓 final_flag。
  5. 用 fs.readFileSync 讀 `docs/challenge/<slug>/src/flag.txt`、byte-compare。
  6. 刪除整個 `tmp/wxl-verify/<slug>/`。
  7. Exit 0 / 1 / 2 依結果。
- Prompt template（spawn 給 agent 的 prompt）固定格式（中英對照、含 final_flag 輸出規範）：
  ```
  You are a CTF challenge solver. Target: <BASE_URL>. Description: <description.md content>. Flag format: <FLAG_REGEX>. Tools available: chrome-devtools-mcp. Solve the challenge and output exactly one line: FINAL_FLAG=<value> at the end of your response. Do not hallucinate flags. If you cannot solve within <turn_budget> turns, output FINAL_FLAG=INCONCLUSIVE.
  ```
- 解 final_flag：regex `^FINAL_FLAG=(.+)$` from last 5 lines of stdout。

**Interface / data shape:**

- `WXL_VERIFY_RUNTIME` 環境變數：`claude` / `codex` / `gemini`，預設 `claude`。
- Runtime CLI 對照（in `reference/runtime-cli.md`）：

  | Runtime | Command |
  |---|---|
  | claude | claude --print --output-format json --add-dir `<tmpdir>` --max-turns 30 "`<prompt>`" |
  | codex | codex exec --output-format json --working-dir `<tmpdir>` --max-turns 30 "`<prompt>`" |
  | gemini | gemini -p "`<prompt>`" --working-dir `<tmpdir>` --max-turns 30 --output-format json |

- META.yaml shape：
  ```
  base_url: "..."
  flag_regex: "..."
  turn_budget: 30
  verification_run_id: "2026-05-20T10:30:00Z"
  ```

**Failure modes:**

- Runtime CLI 不存在於 PATH → exit 2、列「runtime `<name>` CLI not found」。
- Spawn 失敗（permissions / sandbox） → exit 2。
- Agent 沒輸出 `FINAL_FLAG=` 行 → exit 2、inconclusive。
- Agent 輸出 `FINAL_FLAG=INCONCLUSIVE` → exit 2、inconclusive。
- final_flag 不匹配 FLAG_REGEX → exit 1、fail。
- final_flag 匹配 regex 但跟 `src/flag.txt` byte-compare 不過 → exit 1、fail（agent 拿到的可能是 unintended flag、或 hallucination）。

**Acceptance criteria:**

- 對 `door-is-open` 跑 L4 用 claude runtime，agent 透過 chrome-devtools-mcp 跑出 IDOR exploit、final_flag 與 `src/flag.txt` match、exit 0。
- 故意把 `door-is-open/src/flag.txt` 改成不同字串、再跑 L4 — exit 1、fail。
- `WXL_VERIFY_RUNTIME=codex pnpm challenge:verify door-is-open --blind` 應跑得起（前提：codex CLI 安裝）。
- `WXL_VERIFY_RUNTIME=gemini pnpm challenge:verify door-is-open --blind` 應跑得起，MCP 不可用時 exit 2 inconclusive、含明確 reason。
- verify 結束後 `tmp/wxl-verify/door-is-open/` 不存在（已刪）。
- `.gitignore` 涵蓋 `tmp/wxl-verify/`，意外不會入 git。

**Scope boundaries:**

- 範圍內：`scripts/challenge-verify-blind.ts`、`scripts/wxl-solver/build-player-package.ts`、`scripts/wxl-solver/spawn-runtime.ts`、`scripts/wxl-solver/extract-flag.ts`、`reference/runtime-cli.md`。
- 範圍外：在 L4 內進一步處理 trace / writeup / 多次 run 統計（這是 Non-Goals）；對 chrome-devtools-mcp server 本身的安裝與設定（使用者自己管）。

### Create 階段 spec 自動生成契約

**Behavior:**

- Skill 在 Create 階段完成寫 vuln code 後，**必須**從 `.agent/skills/wxl-creator/templates/exploit-spec.ts.tmpl` 套出 `tests/challenges/<slug>.spec.ts`。
- Template 變數：SLUG、BASE_URL、EXPLOIT_PATH（默認 `/`、可由 vuln type 推導）、EXPLOIT_PAYLOAD（依 vuln 類型，例如 SQLi 用 `admin' OR 1=1--`）、FLAG_REGEX。
- 寫出的 spec 必須直接可被 pnpm exec playwright test 執行、不需 maintainer 再編輯（maintainer 可選擇後續編輯）。

**Interface / data shape:**

- Template 檔放 `.agent/skills/wxl-creator/templates/exploit-spec.ts.tmpl`，內容大致：
  ```
  import { test, expect } from '@playwright/test'

  const BASE_URL = '{{BASE_URL}}'
  const FLAG_REGEX = /{{FLAG_REGEX}}/

  test('{{SLUG}} is solvable via {{EXPLOIT_PATH}}', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    const body = await page.evaluate(async () => {
      const r = await fetch('{{EXPLOIT_PATH}}', { method: 'POST', body: '{{EXPLOIT_PAYLOAD}}' })
      return await r.text()
    })
    expect(body).toMatch(FLAG_REGEX)
  })
  ```
- Skill 必須做的字串替換用 mustache-style `{{KEY}}` 或等價簡單實作（沒必要引入完整 template 引擎）。

**Failure modes:**

- Template 檔不存在 → skill 應 halt、列「template not found」、不繼續。
- Spec.ts 寫入失敗（permissions） → skill halt、IO 錯誤。

**Acceptance criteria:**

- Skill 完成 Create flow 後 `tests/challenges/<slug>.spec.ts` 存在、能 import `@playwright/test` 無 type 錯。
- `pnpm exec playwright test tests/challenges/<slug>.spec.ts` 跑得起來（不一定 pass — 要看 vuln 是否真實作對）。

**Scope boundaries:**

- 範圍內：Skill prose 內「寫 spec.ts」這步、template 檔內容。
- 範圍外：在 spec.ts 內加入 vuln-type-specific 進階斷言（例如 SQLi 特殊 payload 集）— 這是後續變更的事。

### Create 階段 chrome-devtools-mcp 自我驗證契約（best-effort）

**Behavior:**

- Skill 在寫出 spec.ts 後**嘗試**透過 chrome-devtools-mcp tool 載 BASE_URL、發 exploit、確認回應含 flag。
- 嘗試上限為 3 次：每次 fail 後 skill 修 vuln code 重試（最多兩次修改）；第三次仍 fail 則放棄、改提示使用者「請手動跑 pnpm challenge:verify <slug> 確認」、收工。
- MCP tool 不可用（host runtime 沒掛 chrome-devtools-mcp server）→ 跳過整個自我驗證、提示同上。
- pnpm docs:dev 未啟動 → 同上，跳過、提示使用者啟動後跑 verify。

**Interface / data shape:**

- Skill prose 用三家共通的 tool name 描述「mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page」等 chrome-devtools-mcp tool；prose 內說明若 tool 不可用就跳過。
- 失敗修 vuln code 時 skill 只動 `docs/challenge/<slug>/src/<app>`，不動 spec.ts、frontmatter、flag.txt。

**Failure modes:**

- MCP 不可用 → degrade、不阻斷 flow。
- pnpm docs:dev 未啟動 → degrade、不阻斷 flow。
- 3 次嘗試後仍解不出 → degrade、不阻斷 flow（但提示使用者）。

**Acceptance criteria:**

- 對 Claude Code 內、chrome-devtools-mcp 已掛載、dev server 已啟動的情況：skill 跑完 Create flow 後，自我驗證有跑、agent 至少嘗試一次 exploit。
- 對 chrome-devtools-mcp 未掛載的情況：skill 仍跑完 Create flow、最終提示使用者手動 verify、不報錯。

**Scope boundaries:**

- 範圍內：Skill prose 內描述「best-effort MCP self-test」這步的 imperative 指示。
- 範圍外：在 skill 內做 MCP 不可用時的 fallback（fallback 是「不做」，不是「換工具」）。

### Host-agent-neutral prose 契約

**Behavior:**

- `.agent/skills/wxl-creator/SKILL.md` 與 `SKILL.zhTW.md` 不得出現下列 Claude-only 符號（白名單以外的都禁止）：
  - `AskUserQuestion` 字串（出現即 fail）
  - `Agent(subagent_type=...)` 模式
  - `EnterPlanMode` / `ExitPlanMode`
  - `TaskCreate` / `TaskUpdate`（這些是 Claude Code 專屬 task 系統）
- 允許的 tool name 限定：Bash、Read、Write、Edit、Glob、Grep、WebFetch（三家共有）。
- chrome-devtools-mcp 在三家 MCP 設定可用時都能呼叫；prose 提到時必須附 best-effort 降級指示（見上一節）。

**Interface / data shape:**

- 提問格式：在 prose 內所有原本「使用 AskUserQuestion」的地方，改成 imperative 指示「請輸出以下問句、等使用者回應」，問句格式建議：
  ```
  📋 請選擇 backend：
    1) flask
    2) fastapi
    3) php
    請回覆 1/2/3 或輸入自訂值。
  ```

**Failure modes:**

- prose 內混入 Claude-only 原語 → grep check 會抓到、spec 驗證 fail。

**Acceptance criteria:**

- `git grep -nE 'AskUserQuestion|EnterPlanMode|ExitPlanMode|TaskCreate' .agent/skills/wxl-creator/` 應回 0。
- 三家 host agent runtime 各自跑 skill Create flow 都能順利完成。

**Scope boundaries:**

- 範圍內：`.agent/skills/wxl-creator/` 內所有檔案的內容。
- 範圍外：對其他技巧（如 spectra-*）的 host-agent-neutral 化改造（不在本變更內）。

### Verify 階段在 Create 結束時的自動觸發契約

**Behavior:**

- Skill 在 Create flow 最後一步（不論 MCP 自我驗證有沒有成功）都**必須**執行 pnpm challenge:verify `<slug>`（無 --blind）；結果 fail 則進入 fix loop（與既有 wxl-creator-skill spec 內 fix loop 同樣機制）。
- L4 盲解**不**在 Create 自動觸發；由 maintainer 在 release 前手動 `--blind`。

**Acceptance criteria:**

- Skill Create flow 跑完最後 stdout 必含「Running pnpm challenge:verify <slug>」與其結果。
- 對故意寫壞的 vuln code，skill 進入 fix loop、上限 10 次（依既有 `.wxl-creator/config.yaml` 設定）。

**Scope boundaries:**

- 範圍內：Skill prose 內 Create flow 最後一步的 imperative 指示。
- 範圍外：修改既有 fix loop 機制本身。

## Risks / Trade-offs

- **`@playwright/test` 增加 install size 約 170MB**（chromium binary） → Mitigation：CI 只在 verify 工作流安裝；contributor 文件清楚說明「首次安裝後需 pnpm exec playwright install chromium」；瀏覽器 binary 在 README Prerequisites 標示為 verify-only。
- **L4 LLM token 燒費** → Mitigation：L4 是 opt-in（--blind 才啟用）、turn budget 上限 30、明示「release 前手動跑、不掛 CI default」。
- **三家 CLI 行為差異**（特別是 stdout JSON shape） → Mitigation：`reference/runtime-cli.md` 對照表是 ground truth；`extract-flag.ts` 用 `FINAL_FLAG=<value>` 這個 host-runtime-neutral 約定（從 stdout 純文字抽，而不是依各家 JSON schema）；新 runtime 加入時只需更新 `runtime-cli.md` 與 `spawn-runtime.ts` 的 dispatch table。
- **chrome-devtools-mcp 在 Gemini CLI 成熟度較低** → Mitigation：Create-time 自我驗證 best-effort、Verify L4 也允許 MCP 不可用時 inconclusive。Gemini 使用者仍可完整跑 Create + Mutate + L1-L3。
- **pointer 檔在 Windows 上的路徑解析** → Mitigation：使用 POSIX-style path（`.agent/skills/wxl-creator/SKILL.md`），三家 host agent 在 Windows 都使用 POSIX path 解析 skill 內容；pointer 檔不靠 symlink、純文字內容。
- **L4 player-package 抽 description 可能漏內容** — index.md 可能含 maintainer-only 元素（hint metadata 等）；抽錯了會洩露 src 內容給 blind solver → Mitigation：`build-player-package.ts` 採 whitelist 策略（只抽 H1 + 一段 description 段落 + 顯式宣告為 player-facing 的內容），其他全部 strip；Vitest 測試覆蓋多種 index.md 形式。
- **Mutate 跨語言轉換的「保留 vuln 主體」邏輯有複雜性** → Mitigation：跨語言不嘗試自動翻譯、直接 exit 2、要求 maintainer 手動；只在同語言系（flask ↔ fastapi）做 best-effort 保留。設計上有明確 escape hatch。

## Migration Plan

本變更為 forward-compatible，不需要資料 migration：

1. **遷移現有 skill 內容**：把 `.claude/skills/wxl-creator/SKILL.md` 的完整內容**複製**到 `.agent/skills/wxl-creator/SKILL.md`（然後做 host-agent-neutral 化、移 `AskUserQuestion`）。原檔退化為 pointer。
2. **既有題目（door-is-open）的 spec 補寫**：apply 階段需手動為 `door-is-open` 寫一份 `tests/challenges/door-is-open.spec.ts`、確認 `pnpm challenge:verify door-is-open` 全綠（這也是 acceptance criteria 之一）。
3. **README / CONTRIBUTE.md 補新工具鏈步驟**：在 Prerequisites 加 `pnpm exec playwright install chromium`；在 Adding a new challenge 章節補 Mutate / Verify gate 說明。
4. **無 rollback 風險**：所有新檔案、新 CLI 都是 additive；既有 4 個 pnpm 既有 CLI 不被改動。若 verify 流程出現嚴重 bug，revert 本變更即可回到原狀。

## Open Questions

- **chrome-devtools-mcp 在 Codex CLI 的成熟度**：apply 時若發現 codex MCP 整合不穩，L4 用 codex runtime 可能會經常 inconclusive；屆時可在 `reference/runtime-cli.md` 加 known-issue 註記，不阻斷本變更。
- **Mutate 跨語言保留 vuln 邏輯的具體 heuristic**：apply 時可能會發現「同語言系」內部其實也有不可保留情境（例如 fastapi 用 async route、flask 用 sync route）；目前設計是 best-effort 試、不行就 exit 2 要求手動。具體判斷 heuristic 可在 implementation 階段細化、不影響本變更 scope。
