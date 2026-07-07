## 1. 建立 wxl-create skill（依 CLI verb 邊界切成四個 skill 的第一個）

- [x] 1.1 [P] 建立 wxl-create canonical `.agent/skills/wxl-create/SKILL.md` 與 `AGENTS.md`，內容涵蓋 create 全流程行為需求：Skill collects challenge parameters interactively、Skill calls create:challenge for scaffolding、Skill generates vulnerable application code、Skill updates index.md frontmatter with metadata、Skill uses canonical reference example for code generation style、Skill consumes capability-specific reference documents via a registry table、Skill generates a Playwright e2e spec for each new challenge、Skill performs best-effort exploit self-test via chrome-devtools-mcp、Skill triggers challenge:verify automatically at the end of the Create flow。驗證：`test -f` 兩檔皆存在，且 `SKILL.md` 內含 `docs/challenge/door-is-open/` canonical reference 與含 `reference/a01-access-control.md` 的 registry table 至少一列。
- [x] 1.2 [P] 共用資產 re-home 至主要擁有者：將 `templates/exploit-spec.ts.tmpl`、`SKILL.zhTW.md`、`reference/a01-access-control.md`、`reference/agent-tools.md` 由 wxl-creator 移入 `.agent/skills/wxl-create/`，使 create 生成與 registry 觸發可讀到同一份資產。驗證：四個目標路徑（含 `.agent/skills/wxl-create/templates/exploit-spec.ts.tmpl`）皆 `test -f` 通過。
- [x] 1.3 [P] 建立 wxl-create 三家 host thin pointer（`.claude`/`.codex`/`.gemini`），使各 host 啟動時導向 canonical。驗證：三檔 frontmatter 外 body 行數皆 ≤3 且指向 `.agent/skills/wxl-create/SKILL.md`。

## 2. 建立 wxl-mutate skill

- [x] 2.1 [P] 建立 wxl-mutate canonical `SKILL.md` 與 `AGENTS.md`，涵蓋 Skill supports the mutate stage via challenge:retype：以 `pnpm challenge:retype` 變更既有題目 backend/difficulty/tags/category 並交棒 wxl-verify 回歸。驗證：兩檔存在，且 `git grep -nE 'AskUserQuestion|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate|subagent_type' .agent/skills/wxl-mutate/` 回傳 exit code 1。
- [x] 2.2 [P] 建立 wxl-mutate 三家 host thin pointer。驗證：三檔 body 行數 ≤3 且指向 canonical。

## 3. 建立 wxl-verify skill（wxl-verify 為 create 與 mutate 共用的 gate 加 fix-loop）

- [x] 3.1 [P] 建立 wxl-verify canonical `SKILL.md` 與 `AGENTS.md`，涵蓋 Skill runs the layered challenge:verify gate、Skill auto-fixes validation errors with plain-text confirmation、Fix loop has a configurable maximum iteration limit，取代舊 Skill runs analyze and validate after creation 與 Skill auto-fixes validation errors with user confirmation，並成為 create 與 mutate 共用的 gate 加 auto-fix loop。驗證：兩檔存在，`SKILL.md` 描述 L1–L3 gate 與 `apply`/`skip` plain-text 確認迴圈，且 host-neutral grep exit code 1。
- [x] 3.2 config 檔隨 fix-loop 遷至 .wxl-verify：把 max_fix_attempts 設定由 `.wxl-creator/config.yaml` 遷至 `.wxl-verify/config.yaml`（缺檔時 wxl-verify 預設 10）。驗證：`test -f .wxl-verify/config.yaml` 且內容含 `max_fix_attempts`。
- [x] 3.3 [P] 建立 wxl-verify 三家 host thin pointer。驗證：三檔 body 行數 ≤3 且指向 canonical。

## 4. 建立 wxl-crosscheck skill（crosscheck 沿用 l4-multi-agent-cross-check CLI capability）

- [x] 4.1 [P] 建立 wxl-crosscheck canonical `SKILL.md` 與 `AGENTS.md`，涵蓋 Skill invokes the L4 blind multi-agent cross-check：maintainer-only 薄包裝 `pnpm challenge:verify <slug> --blind --agents`，並將 `reference/runtime-cli.md` re-home 至 `.agent/skills/wxl-crosscheck/`。驗證：`SKILL.md`、`AGENTS.md`、`reference/runtime-cli.md` 三檔存在，且 host-neutral grep exit code 1。
- [x] 4.2 [P] 建立 wxl-crosscheck 三家 host thin pointer。驗證：三檔 body 行數 ≤3 且指向 canonical。

## 5. spec 與外部引用對齊（橫切需求繼承 authoring-skill-pattern，不在新 capability 重複；a01 pack spec 路徑正文改指向 wxl-create）

- [x] 5.1 確認橫切需求繼承 authoring-skill-pattern，不在新 capability 重複 Skill prose is host-agent-neutral 與 Skill is installed via a single source with thin pointer files（四個新 capability delta 只含 verb 專屬需求）。驗證：`grep -L` 四個 delta 檔皆不含這兩條 requirement 標題。
- [x] 5.2 a01 pack spec 路徑正文改指向 wxl-create：核對 delta 已把 Pack ships an A01 reference document at the canonical path、Pack declares an A01 dispatch trigger regex、Pack reference document covers IDOR, JWT alg:none, and Path traversal primitives 的路徑改為 `.agent/skills/wxl-create/...`。驗證：`git grep wxl-creator openspec/changes/split-wxl-creator-skills/specs/a01-access-control-template-pack/spec.md` 零命中。
- [x] 5.3 更新 runtime 與 ignore 註解引用：`scripts/wxl-solver/spawn-runtime.ts`（runtime-cli 路徑註解）與 `.gitignore`（wxl-creator 註解）改指新的 wxl-crosscheck/wxl-verify 路徑與名稱，使註解不指向已刪除路徑。驗證：`git grep wxl-creator -- scripts/wxl-solver/spawn-runtime.ts .gitignore` 零命中。

## 6. 移除舊 wxl-creator 並以 grep 驗證零殘留

- [x] 6.1 移除舊 wxl-creator 並以 grep 驗證零殘留：刪除 `.agent/skills/wxl-creator/` 整個目錄、`.claude`/`.codex`/`.gemini` 三家 pointer、legacy 的 `.agent/workflows/wxl-creator.md`、以及 `.wxl-creator/config.yaml`。驗證：上述五路徑 `test ! -e` 全部成立。
- [x] 6.2 作用中程式碼零殘留：`git grep -n "wxl-creator"` 排除 `openspec/**`（`openspec/specs/**` 的舊引用屬 Spectra archive-time 才合併的 pre-archive 殘留，非 drift；`openspec/changes/archive/**` 為歷史）、`CHANGELOG.md`、`AUDIT.md`、`VERIFICATION.md`、`DELETION-PLAN.md`（歷史快照）後零命中。驗證：`git grep -n "wxl-creator" -- . ':(exclude)openspec/**' ':(exclude)CHANGELOG.md' ':(exclude)AUDIT.md' ':(exclude)VERIFICATION.md' ':(exclude)DELETION-PLAN.md'` exit code 1。（`openspec/specs/**` 的 wxl-creator 引用會在本 change `spectra archive` 套用 delta 時一併清掉。）

## 7. 整合驗收

- [x] 7.1 四個新 skill 逐一通過 authoring-skill-pattern 驗證（thin pointer body ≤3 行、host-neutral grep exit 1、canonical `SKILL.md` 加 `AGENTS.md` 存在、`_template` 未被啟用於任何 host）。驗證：對四個 skill 名各跑 INSTALL.md Step 4 的四項檢查全數通過。
- [x] 7.2 change 整體驗收：`spectra validate split-wxl-creator-skills` 通過，且既有單元/e2e 測試套件（底層 script 未動）維持綠燈。驗證：`spectra validate split-wxl-creator-skills` 與 `pnpm test` 皆 exit 0。
