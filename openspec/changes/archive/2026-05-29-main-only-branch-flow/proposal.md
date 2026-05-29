## Why

使用者已決定 wxl-template 這個模板 repo 維持 **main-only**（staging 留給衍生 use-template 專案自行啟用，見先前反悔的 P2.1）。但目前文件與 CI 仍殘留 staging：`CONTRIBUTE.md` 的 branch model 含 staging、要求 PR 發到 staging、hotfix 雙合 `main`+`staging`；`.github/workflows/quality-gates.yml` 觸發條件含 staging；`ci-quality-gates` spec 多處述及 `main`/`staging`。這些與 main-only 現實牴觸、會誤導貢獻者，需清除以恢復「文件↔程式碼↔spec」三者一致。

## What Changes

- `CONTRIBUTE.md`：branch model 改為 `main` + `feature/*` / `bugfix/*` / `hotfix/*`（皆以 `main` 為基底）；development workflow 改從 `main` 切工作分支；PR submission 與 checklist 一律以 `main` 為 PR 目標；hotfix 不再雙合到 staging；Maintainer Setup 的「Protect main」註解移除「staging … tracked as a separate change」字句。
- `contributor-guide` spec：把 "CONTRIBUTE describes git flow branch model" 更名為 "CONTRIBUTE describes the branch model" 並改寫為 main-only；"CONTRIBUTE describes PR submission process" 內「PR targets staging, not main」改為以 `main` 為目標。
- `.github/workflows/quality-gates.yml`：`pull_request` 觸發的 `branches` 由 `[main, staging]` 改為 `[main]`（`push` 本來就只 `main`）。
- `ci-quality-gates` spec：把 trigger requirement 更名與改寫為 main-only；其餘三處附帶提及 `main`/`staging` 的文字（Purpose 段、prose-audit 與 site-smoke 兩條 scenario 的 WHEN 子句）以 archive 時的 canonical 手動修整處理（這些非 requirement 主體、delta 不易精準表達，循 repo 既有 manual touch-up 慣例）。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `contributor-guide`: branch model 與 PR submission 兩條 Requirement 由 main+staging 收斂為 main-only（含一條 requirement 更名）。
- `ci-quality-gates`: PR-time 觸發 Requirement 由 main/staging 收斂為 main-only（含更名）；另含 archive 階段對 Purpose 與兩條 scenario 的 staging 字眼手動修整。

## Impact

- Affected specs: `contributor-guide`（rename 1 + modified 2）、`ci-quality-gates`（rename 1 + modified 1，另含 archive 手動 canonical 修整 3 處）
- Affected code:
  - New: （無）
  - Modified: `CONTRIBUTE.md`、`.github/workflows/quality-gates.yml`
  - Removed: （無）
- 不影響: `default_branch`（本來就是 `main`）、「Protect main」branch-protection ruleset（本來就只保護 main）、release.yml。
