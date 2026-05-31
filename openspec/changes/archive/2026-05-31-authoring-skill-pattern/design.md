## Context

`wxl-creator-skill` 是 repo 內目前唯一的 cross-agent challenge-authoring skill；它已在 spec 的 Req #9（host-agent-neutral）與 Req #10（single source + thin pointer）落地一套「`.agent/skills/<name>/` 為 source、`.claude` / `.codex` / `.gemini` 下 ≤3 行 pointer 引用」的安裝慣例（見 `openspec/specs/wxl-creator-skill/spec.md` 行 438 與 496）。R2-R12 將陸續新增題型、runtime、驗題相關的新 authoring skill；若每個 R# 都重新發明這套 pattern，措辭、目錄、agent matrix、安裝步驟必然 drift。本 change 在 R2-R12 任何新 skill 動工前，把該 pattern 抽成獨立 `authoring-skill-pattern` capability，並提供 starter template 起手包，作為後續所有 authoring skill 的唯一依據。

## Goals / Non-Goals

**Goals:**

- 把現有 `wxl-creator-skill` Req #9 / #10 已驗證可行的安裝慣例，標準化成獨立 capability 的 SHALL/MUST 條款。
- 提供作者複製即用的 starter template 目錄，內含 source SKILL 範本、AGENTS 範本、安裝指南範本、thin pointer body 範本。
- 明列官方支援的 agent host matrix（Claude Code / Codex CLI / Gemini CLI），與 wxl-creator 既有三家一致。
- 為新 skill 提供可被 `git grep` 驗證的禁止字串清單（forbidden host-agent-specific primitive）。

**Non-Goals:**

- 不把 `wxl-creator-skill` 既有 Req #9 / #10 改寫成「SHALL conform to authoring-skill-pattern」式引用，避免在 pattern 剛落地就同步改 source spec 增加 archive 風險；該對齊由後續獨立 change 處理。
- 不新增 CI gate / lint job / pre-commit hook 強制 enforce 本 capability，validation 階段以 `git grep` + 人工 review 為主；後續若需要強制 enforce 再立新 change。
- 不替既有 wxl-creator skill 重新寫 starter template（既有檔不動）。
- 不引入新 npm/Cargo/pip 依賴、不改 build pipeline。
- 不規範 agent-host-specific runtime 細節（例如 Claude Code 的 hook 機制、Codex 的 model 選擇），只規範文件 + 結構 + 安裝步驟層級的中立性。

## Decisions

### Starter template 放置於 `.agent/skills/_template/`

採用與 `.agent/skills/wxl-creator/` 同層的 `.agent/skills/_template/` 為 starter template root。底線 prefix `_template` 用來避免被任何 host agent 當成 active skill 載入（active skill 透過各家 `.claude/.codex/.gemini/skills/<name>/SKILL.md` pointer 才會被認，本 starter pack 不放任何 pointer 即不會被啟用）。

候選方案比較：

| 候選 | 優點 | 缺點 | 採否 |
|------|------|------|------|
| `.agent/skills/_template/` | 與 wxl-creator source 同層，作者複製 `.agent/skills/_template/` → `.agent/skills/<new>/` 路徑替換最少 | 需明文禁止 starter 同名 `.claude` pointer，否則會被誤載入 | ✅ |
| `templates/authoring-skill-starter/` | 概念純粹（純檔案範本），跟 runtime path 解耦 | 與 wxl-creator source 不同層，作者複製後要手動搬到 `.agent/skills/` | ❌ |
| `openspec/templates/authoring-skill-starter/` | 與 spec 同 dir 樹 | openspec dir 是 capability/change/spec 的，混入 template 概念耦合 | ❌ |

對應 SHALL 條款：spec 內明文「starter template SHALL NOT have a matching pointer under any of `.claude/skills/_template/`、`.codex/skills/_template/`、`.gemini/skills/_template/`」。

### Agent matrix = Claude Code / Codex CLI / Gemini CLI

採用 wxl-creator-skill Req #10 既有的三家 agent host 為「官方支援」matrix，與既有 thin pointer 證據（`.claude/skills/wxl-creator/`、`.codex/skills/wxl-creator/`、`.gemini/skills/wxl-creator/` 三條 pointer 已存在）一致。新 capability 不擴增也不縮減，避免初次落地就規範未驗證 host。未來增加 host（如 Cursor / Aider）由獨立 change 加 Requirement。

### Starter template 四件套

starter template 目錄至少包含以下四檔，分別對應 author 起手新 skill 必走的四個步驟：

1. `.agent/skills/_template/SKILL.md` — canonical source 範本（含 frontmatter 範例 + body 章節骨架 + forbidden primitive 註解警告）。
2. `.agent/skills/_template/AGENTS.md` — host-agent compatibility 註記範本（列每個 host 的 invocation 慣例與差異）。
3. `.agent/skills/_template/INSTALL.md` — 安裝指南範本（thin pointer 應放路徑、body 範例、`git grep` 驗證指令）。
4. `.agent/skills/_template/POINTER.template.md` — thin pointer body 範本（≤3 行、單一 `Read .agent/skills/<NAME>/SKILL.md ...` 指令）。

對應 SHALL 條款：spec 內明文 starter template 目錄 SHALL 至少包含這四檔；本 change apply 階段建出這四檔即滿足。

### wxl-creator-skill 既有 Req #9 / #10 維持原文

本 change 不修 `openspec/specs/wxl-creator-skill/spec.md`；既有 Req #9 / #10 維持原樣，作為 authoring-skill-pattern capability 引用的歷史依據。未來若要把 wxl-creator-skill 對齊「SHALL conform to authoring-skill-pattern」是獨立後續 change（避免本 change apply 階段同時動 source spec + 新 capability spec，降低 sibling-clobber 風險、見 memory `feedback_sibling_change_delta_clobber`）。

## Implementation Contract

**Behavior**：本 change apply 後，repo 內新增一個 `authoring-skill-pattern` capability spec 與一個 `.agent/skills/_template/` starter template 目錄；其他 R# change 的作者起手新 authoring skill 時，能完成下列三步而不需查任何外部文件：
1. 把 `.agent/skills/_template/` 整目錄複製為 `.agent/skills/<new-skill-name>/` 並改名替換內文 `<NAME>`。
2. 對照 `INSTALL.md` 在三個 host agent path 建 thin pointer。
3. 用 `git grep` 驗證 forbidden primitive 0 命中（`AskUserQuestion`、`Agent(subagent_type=...)`、`EnterPlanMode`、`ExitPlanMode`、`TaskCreate`、`TaskUpdate`）。

**Interface / data shape**：

- 新 capability spec 路徑：`openspec/specs/authoring-skill-pattern/spec.md`。
- Starter template 目錄結構（在本 change apply 後即建立、後續 change 複製即用）：
  ```
  .agent/skills/_template/
  ├── SKILL.md
  ├── AGENTS.md
  ├── INSTALL.md
  └── POINTER.template.md
  ```
- 新 skill 安裝後的最終目錄結構（任何遵循本 capability 的 skill 都應達成）：
  ```
  .agent/skills/<skill>/SKILL.md            ← canonical source（≥1 章節）
  .agent/skills/<skill>/AGENTS.md           ← host compatibility 註記
  .claude/skills/<skill>/SKILL.md           ← thin pointer，body ≤3 行
  .codex/skills/<skill>/SKILL.md            ← thin pointer，body ≤3 行
  .gemini/skills/<skill>/SKILL.md           ← thin pointer，body ≤3 行
  ```
- Forbidden primitive 清單（spec 內明文枚舉，與 wxl-creator-skill Req #9 一致）：`AskUserQuestion`、`Agent(subagent_type=...)`、`EnterPlanMode`、`ExitPlanMode`、`TaskCreate`、`TaskUpdate`。

**Failure modes**：

- starter template 任一檔缺失 → spec 違反、`spectra validate` 不會抓（無 CI gate）但 review 階段以人工 + checklist 偵測。
- 任一 thin pointer body 超過 3 行 → 違反本 capability 的對應 Requirement，後續 change 套用時應在自己的 design 階段以 `wc -l` 驗證。
- `_template` 出現對應 `.claude/.codex/.gemini` pointer → 違反本 capability 的對應 Requirement；本 change apply 階段不會建這些 pointer，後續 sanity 檢查 `ls .claude/skills/_template 2>/dev/null` 應為空。

**Acceptance criteria**：

- `ls openspec/specs/authoring-skill-pattern/spec.md` 存在且 `spectra validate authoring-skill-pattern` 為空（本 change 階段）/ 整 repo `spectra validate` 為空（archive 後）。
- `ls .agent/skills/_template/` 至少回傳 `SKILL.md`、`AGENTS.md`、`INSTALL.md`、`POINTER.template.md` 四個檔。
- `ls .claude/skills/_template .codex/skills/_template .gemini/skills/_template` 三條皆 `No such file or directory`。
- `git grep -nE 'AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate' .agent/skills/_template/` 回退碼 1（0 命中）。
- `spectra archive` 後，`openspec/specs/` 數量從 41 → 42。

**Scope boundaries**：

- In scope：新增 `authoring-skill-pattern` capability spec、新增 `.agent/skills/_template/` 四檔 starter template。
- Out of scope：修改既有 `openspec/specs/wxl-creator-skill/spec.md`、改 `.agent/skills/wxl-creator/` 任何檔、改任何 `.claude/.codex/.gemini/skills/wxl-creator/` pointer、新增 CI gate / lint / pre-commit hook、加新 npm/Cargo/pip 依賴、改 build/release pipeline。

## Risks / Trade-offs

- **starter template `_template` 可能誤被某 host agent 載入**：以底線 prefix + 不建 thin pointer 雙重防護；後續若有 host agent 因 fuzzy match 將 `_template` 認成 skill，補修當前 host 的 pointer 規則。Mitigation：spec 內明列「SHALL NOT have thin pointer」+ 本 change apply 階段不建任何 `.claude/.codex/.gemini/skills/_template/` 檔。
- **無 CI gate 強制 enforce**：作者寫新 skill 若不遵循 pattern，本 capability 形同空文。Mitigation：(1) 後續 R# change 各自 design 階段可 reference 本 capability 並把對應 acceptance criteria 寫進自己的 tasks；(2) 未來若 drift 嚴重再立獨立 change 加 lint gate。
- **不同步改 wxl-creator-skill 留下兩套 Req#9/#10 + 本 capability 並存的「概念重複」**：短期可接受（reader 仍能讀 wxl-creator-skill spec 看原文），長期由獨立 change 把 wxl-creator-skill 改成 reference-only。Mitigation：在 wxl-creator-skill Req #9 / #10 加一條 informative 註解指向本 capability（這條註解屬於後續 change 範圍，本 change 不做）。
