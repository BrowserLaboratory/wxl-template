## Why

`ci-quality-gates` capability 之 archive design.md 之 Open Questions 段已記錄三條 prose-audit CI 化候選路徑（Option A Phase 1 deterministic-only / Option B verify-committed-summary / Option C Claude API），並明確聲明本系列首個 change 不實作任何一條。完整 `humane-prose-audit` 五階段流程仰賴外部 LLM harness 投放 Phase 2 sub-agent sidecar JSON，無法在無 LLM 的 GitHub-hosted runner 上跑完 verdict——`prose-audit-outward-docs` spec 之 PASS 條款（0 Critical AND 0 High 含 Phase 2 sub-agent findings）因此仍只在 release-time 由維護者手動驅動，PR-time CI 對 outward Markdown 全無攔截。

本 change 採行 **Option A deterministic-only**：把 `~/.claude/skills/humane-prose-audit/` 之 14 個 deterministic Python checker module vendor 進 repo 之 `scripts/prose-audit/`，並新增一支 wrapper `run.py` **直接逐一以 subprocess 呼叫** `checks/<rule>.py`（**不** vendor、也不呼叫上游 orchestrator `audit_orchestrator.py`），再於 `.github/workflows/quality-gates.yml` 新增 `prose-audit` job 對 PR 改動之 outward `*.md` 跑這 14 個 checker。gate 政策採 **rule-allowlist**：只有 `mainland_vocab` / `placeholder_grep` / `citation_format` 這三個「客觀錯誤」checker 一旦有 finding 就紅燈擋 merge（不論 severity）；其餘 11 個 stylistic checker 只記錄不擋。低保真但全自動，是三條候選中唯一不需要 LLM secret 或維護者 commit 紀律的路徑；Option B / Option C 留作後續 change，本 design.md 之 Open Questions 段持續紀錄其 trade-off 以利接手。

> **設計修正紀錄（apply 前直接讀源碼驗證）**：propose 階段對源碼行為的三項假設皆不成立——(1) 14 個 deterministic checker **沒有任何一個發 `critical`**（最高 `high`；`mainland_vocab` 發 `Medium`、`placeholder_grep` 發 `High`），故原 `--fail-on critical` gate 永遠不會亮紅燈；(2) 上游 orchestrator **無 `--fail-on` flag**，且其 Phase-1 preflight 會把發 Title-case severity 的 6 個 checker 當 schema 違規隔離到 `_errored.json`，含本 change 最仰賴的 `mainland_vocab` / `placeholder_grep`；(3) 實際只 import `pyyaml` / `textstat` / `jsonschema`（`tiktoken`、`py-readability-metrics` 無人使用）。修正方向：改採 rule-allowlist + `run.py` 直接呼叫 checker（繞開 orchestrator 的隔離，且不必動 vendored checker 的大小寫）+ 修正依賴清單 + 補 vendor `config.yaml`。

## What Changes

- 新增 `scripts/prose-audit/` 目錄，vendor 自 `~/.claude/skills/humane-prose-audit/`：
  - `checks/<rule>.py` × 14：`mainland_vocab` / `placeholder_grep` / `duplicate_sentences` / `citation_format` / `readability_metrics` / `lazy_writer_check` / `ai_tells` / `burstiness` / `hedge_density` / `imperative_fog` / `lexical_diversity` / `pronoun_consistency` / `discourse_marker_density` / `repetition_fingerprint`。
  - `config.yaml`（5 個 checker 讀的 wordlist / pattern 設定：`mainland_vocab` / `placeholder_grep` / `duplicate_sentences` / `lazy_writer_check` / `readability_metrics`）。
  - 最小 `scripts/_common/` 子集：`locale_detect.py`（`burstiness` 用）+ `config_resolver.py`（`citation_format` 用）。
  - `schemas/check-output.schema.json`（vendor 供參考；`run.py` 不跑上游那套會隔離 checker 的 strict 驗證）。
  - **不** vendor `audit_orchestrator.py` 及其 Phase 2/3/4/5（sub-agent / fuzz / humane-signal / consolidated-findings）邏輯——`run.py` 直接呼叫 checker。
- 新增 wrapper CLI `scripts/prose-audit/run.py`，封裝呼叫慣例：`run.py <file>... [--out <dir>] [--json-summary <path>] [--surface <glob>]... [--block-rules <csv>]`。對每個檔逐一以 subprocess 跑 14 個 checker、parse stdout JSON。**Exit 1 iff** blocking-set（預設 `mainland_vocab,placeholder_grep,citation_format`）任一 checker 有 finding（不論 severity）；**Exit 0** 表示只剩 advisory finding 或無檔；**Exit 2** 表示內部錯誤（checker crash / ImportError）。
- 在 `.github/workflows/quality-gates.yml` 新增第三個並行 job `prose-audit`，於 PR 對 `main` / `staging` 觸發時：
  - `actions/checkout@v6`（`fetch-depth: 0`）+ `actions/setup-python@v6` with `python-version: '3.12'`、`cache: pip`。
  - `pip install -r scripts/prose-audit/requirements.txt`（`pyyaml` / `textstat` / `jsonschema`）。
  - 算出 PR `git diff --name-only --diff-filter=AMR -M origin/<base>...HEAD -- '*.md'` 之改動 markdown 清單，過濾 outward-facing surface（與 `prose-audit-outward-docs` spec 之列表一致）。
  - 對清單跑 `python scripts/prose-audit/run.py <files> --out audit-runs/prose-phase1-ci/ --json-summary audit-runs/prose-phase1-ci/summary.json`，輸出 per-file `<slug>/findings.json` + 合併 `summary.json`。
  - `actions/upload-artifact@v5` 上傳整個 `audit-runs/prose-phase1-ci/` 目錄供 PR debug（retention 14 日）。
  - exit 非 0 時 job 紅燈，連帶讓 PR 不可 merge（前提是 branch protection rule 已將 `prose-audit` 列為 required check；本 change 之 spec 同步補進 `ci-quality-gates` 之 §Branch protection ruleset Requirement）。
- 擴充 `ci-quality-gates` capability（**不是新 capability**）：在 `openspec/specs/ci-quality-gates/spec.md` 新增第 13 條 ADDED Requirement「The pipeline SHALL run Phase-1 deterministic prose audit on changed markdown files」。Branch protection ruleset 之 required status checks 表同步加入 `prose-audit` job。
- `.gitignore` **無需改動**：既有 `__pycache__/` / `*.pyc`（line 82–83）與 `audit-runs/`（line 111）條款已涵蓋 vendored pycache 與 CI artifact。
- 文件更新：`CONTRIBUTE.md` 新增「本地等效 prose-audit 命令」段、`README.md` Status badges 段加入 Quality Gates workflow-status badge（GitHub Actions badge 為 per-workflow，非 per-job）。
- **不在本次處理**：
  - Option B（verify-committed-summary）與 Option C（Claude API）路徑——本 design.md 之 Open Questions 段保留兩者作為未來 follow-up，本 change 不實作。
  - `release.yml` 之 prose-audit 整合（release-time 仍由維護者手動跑完整五階段 + LLM sub-agent dispatch，per `prose-audit-outward-docs` spec line 19–20）。
  - `prose-audit-outward-docs` spec 任何 normative 條款修改——該 spec 規範 release-time 完整 verdict，本 change 只加 PR-time deterministic 子集，兩者語意正交，無 MODIFIED 需求。
  - 升級 `humane-prose-audit` 上游 skill 或反向同步 vendor 變更回 `~/.claude/skills/`——vendor 後即 fork，後續 upstream patch 須個別 follow-up。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ci-quality-gates`: extended to require a deterministic prose-audit job at PR-time, complementing the existing `test` and `build` jobs. The new requirement (ADDED, the 13th in this capability) codifies the trigger contract, scan-scope policy (PR-changed `*.md` intersected with the outward-facing surface), the rule-allowlist failure policy (block only on `mainland_vocab` / `placeholder_grep` / `citation_format` findings; the other eleven checkers are advisory), and the artifact upload policy. Branch protection's required status checks table gains a `prose-audit` row.

## Impact

- Affected specs:
  - `ci-quality-gates` (MODIFIED — one ADDED Requirement + one MODIFIED Requirement extending the Branch-protection-ruleset required-checks table)
  - `prose-audit-outward-docs` (no spec change; semantic intersection only — release-time full pipeline remains authoritative)
- Affected code:
  - New: `scripts/prose-audit/{checks/*.py × 14, config.yaml, scripts/_common/{locale_detect,config_resolver}.py, schemas/check-output.schema.json, run.py, requirements.txt}`（≈ 2900–3100 LOC vendor + ≈ 150–200 LOC wrapper；**不含** orchestrator）
  - New: `.github/workflows/quality-gates.yml` `prose-audit` job
  - Modified: `CONTRIBUTE.md`、`README.md`
  - Unchanged: `.gitignore`（既有 `__pycache__/` / `*.pyc` / `audit-runs/` ignore 已涵蓋）
  - Removed: (none)
- Affected runtime / infrastructure:
  - PR-time CI 增加第三個並行 job（預估 cold-cache 60–120s wall-clock：setup-python ~10s + pip deps（3 個純 / 輕 wheel 套件）~15–25s + 對 ≤ 20 個 markdown 跑 14 checker ~40–90s；後續 PR 命中 pip cache 可降至 40–70s）。
  - GitHub Actions usage 增加，但仍限於 `wxl-template` repo 之 PR/push 流量。
  - 不引入新 secret（deterministic-only，不呼 LLM）。
- Affected docs / spec corpus：本 change archive 後，`ci-quality-gates/spec.md` 之第 13 條 Requirement 落地；CI 之 `audit-runs/prose-phase1-ci/` 已被既有 `.gitignore` 之 `audit-runs/` 條款涵蓋，但 CI 仍以 artifact 形式保留 14 日供 debug。
