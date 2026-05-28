## Why

`ci-quality-gates` capability 之 archive design.md 之 Open Questions 段已記錄三條 prose-audit CI 化候選路徑（Option A Phase 1 deterministic-only / Option B verify-committed-summary / Option C Claude API），並明確聲明本系列首個 change 不實作任何一條。完整 `humane-prose-audit` 五階段流程仰賴外部 LLM harness 投放 Phase 2 sub-agent sidecar JSON，無法在無 LLM 的 GitHub-hosted runner 上跑完 verdict——`prose-audit-outward-docs` spec 之 PASS 條款（0 Critical AND 0 High 含 Phase 2 sub-agent findings）因此仍只在 release-time 由維護者手動驅動，PR-time CI 對 outward Markdown 全無攔截。

本 change 採行 **Option A Phase 1 deterministic-only**：把 `~/.claude/skills/humane-prose-audit/` 之 14 個 deterministic Python checker module + orchestrator Phase-1-only 路徑（`audit_orchestrator.py --phase 1 --no-fuzz`）vendor 進 repo 之 `scripts/prose-audit/`，並於 `.github/workflows/quality-gates.yml` 新增 `prose-audit` job 對 PR 改動之 `*.md` 跑 deterministic 子集，任一 Critical finding 即紅燈擋 merge。低保真但全自動，是三條候選中唯一不需要 LLM secret 或維護者 commit 紀律的路徑；Option B / Option C 留作後續 change，本 design.md 之 Open Questions 段持續紀錄其 trade-off 以利接手。

## What Changes

- 新增 `scripts/prose-audit/` 目錄，vendor 自 `~/.claude/skills/humane-prose-audit/` 之三組程式碼：
  - `checks/<rule>.py` × 14：`mainland_vocab` / `placeholder_grep` / `duplicate_sentences` / `citation_format` / `readability_metrics` / `lazy_writer_check` / `ai_tells` / `burstiness` / `hedge_density` / `imperative_fog` / `lexical_diversity` / `pronoun_consistency` / `discourse_marker_density` / `repetition_fingerprint`。
  - `scripts/audit_orchestrator.py` 精簡為 Phase-1-only 模式（移除 Phase 2 sub-agent dispatch / Phase 3 fuzz / Phase 4 humane-signal / Phase 5 consolidated findings 邏輯路徑；對應 schema 與 journal helper 隨之裁減）。
  - `scripts/_common/{config_resolver,output_schema,journal}.py` + `schemas/check-output.schema.json`。
- 新增 wrapper CLI（建議 `scripts/prose-audit/run.py` 或 `pnpm prose:audit:phase1`）封裝呼叫慣例：`run.py <file>... --phase 1 --no-fuzz --fail-on critical`。Exit 0 = 0 Critical，非 0 = 至少 1 Critical 或內部錯誤。
- 在 `.github/workflows/quality-gates.yml` 新增第三個並行 job `prose-audit`，於 PR 對 `main` / `staging` 觸發時：
  - `actions/checkout@v6` + `actions/setup-python@v6` with `python-version: 3.12`。
  - `pip install pyyaml jsonschema textstat tiktoken py-readability-metrics`。
  - 算出 PR `git diff --name-only --diff-filter=AM origin/<base>...HEAD -- '*.md'` 之改動 markdown 清單，過濾 outward-facing surface（與 `prose-audit-outward-docs` spec 之列表一致）。
  - 對清單跑 `python scripts/prose-audit/run.py <files> --phase 1 --no-fuzz --fail-on critical`，輸出 per-file `audit-report.phase1.json` 至 `audit-runs/prose-phase1-ci/<slug>/`。
  - `actions/upload-artifact@v5` 上傳整個 `audit-runs/prose-phase1-ci/` 目錄供 PR debug（retention 14 日）。
  - exit 非 0 時 job 紅燈，連帶讓 PR 不可 merge（前提是 branch protection rule 已將 `prose-audit` 列為 required check；本 change 之 spec 同步補進 `ci-quality-gates` 之 §Branch protection ruleset Requirement）。
- 擴充 `ci-quality-gates` capability（**不是新 capability**）：在 `openspec/specs/ci-quality-gates/spec.md` 新增第 13 條 ADDED Requirement「The pipeline SHALL run Phase-1 deterministic prose audit on changed markdown files」。Branch protection ruleset 之 required status checks 表同步加入 `prose-audit` job。
- 新增 `.gitignore` 條目 `audit-runs/prose-phase1-ci/` 阻擋 CI artifact 進 repo（與既有 `audit-runs/` 條款一致）。
- 文件更新：`CONTRIBUTE.md` 新增「Phase-1 prose-audit 本地等效命令」段、`README.md` Status badges 段加入 `prose-audit` badge。
- **不在本次處理**：
  - Option B（verify-committed-summary）與 Option C（Claude API）路徑——本 design.md 之 Open Questions 段保留兩者作為未來 follow-up，本 change 不實作。
  - `release.yml` 之 prose-audit 整合（release-time 仍由維護者手動跑完整五階段 + LLM sub-agent dispatch，per `prose-audit-outward-docs` spec line 19–20）。
  - `prose-audit-outward-docs` spec 任何 normative 條款修改——該 spec 規範 release-time 完整 verdict，本 change 只加 PR-time deterministic 子集，兩者語意正交，無 MODIFIED 需求。
  - 升級 `humane-prose-audit` 上游 skill 或反向同步 vendor 變更回 `~/.claude/skills/`——vendor 後即 fork，後續 upstream patch 須個別 follow-up。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ci-quality-gates`: extended to require a Phase-1 deterministic prose-audit job on PR-time, complementing the existing `test` and `build` jobs. The new requirement (ADDED, the 13th in this capability) codifies the trigger contract, scan-scope policy (PR-changed `*.md` intersected with the outward-facing surface), failure threshold (`fail-on critical`), and artifact upload policy. Branch protection's required status checks table gains a `prose-audit` row.

## Impact

- Affected specs:
  - `ci-quality-gates` (MODIFIED — one ADDED Requirement + one MODIFIED Requirement extending the Branch-protection-ruleset required-checks table)
  - `prose-audit-outward-docs` (no spec change; semantic intersection only — release-time full pipeline remains authoritative)
- Affected code:
  - New: `scripts/prose-audit/{checks/*.py, scripts/audit_orchestrator.py, scripts/_common/*.py, schemas/check-output.schema.json, run.py}` (≈ 5450–5630 LOC vendor + ≈ 80–120 LOC wrapper, per Skill-source LOC audit)
  - New: `.github/workflows/quality-gates.yml` `prose-audit` job
  - Modified: `.gitignore`, `CONTRIBUTE.md`, `README.md`
  - Removed: (none)
- Affected runtime / infrastructure:
  - PR-time CI 增加第三個並行 job（預估 cold-cache 90–150s wall-clock：Python 安裝 ~10s + pip deps ~30s + 對 ≤ 20 個 markdown 跑 14 checker ~50–100s；後續 PR 命中 pip cache 可降至 60–90s）。
  - GitHub Actions usage 增加，但仍限於 `wxl-template` repo 之 PR/push 流量。
  - 不引入新 secret（Phase 1 純 deterministic，不呼 LLM）。
- Affected docs / spec corpus：本 change archive 後，`ci-quality-gates/spec.md` 之第 13 條 Requirement 落地；`audit-runs/prose-phase1-ci/` 進 `.gitignore` 但 CI 仍以 artifact 形式保留 14 日供 debug。
