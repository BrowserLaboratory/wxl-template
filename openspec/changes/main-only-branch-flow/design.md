## Context

wxl-template 是模板 repo，過去文件描述了一套含 `staging` 整合分支的 git flow，但 `staging` 分支與其 ruleset 從未在本 repo 建立（P2.1 propose 後使用者反悔、parked change 已刪、本 repo 確立 main-only）。目前殘留的 staging 痕跡分布在：`CONTRIBUTE.md`（branch model / dev workflow / PR target / checklist / Maintainer Setup 註解）、`contributor-guide` spec（branch model 與 PR submission 兩條 Requirement）、`.github/workflows/quality-gates.yml`（`pull_request` 觸發 `[main, staging]`）、`ci-quality-gates` spec（trigger Requirement + Purpose + prose-audit/site-smoke 兩條 scenario）。本 change 把這些全部收斂為 main-only，恢復文件↔程式碼↔spec 一致。

## Goals / Non-Goals

**Goals:**

- `CONTRIBUTE.md` 與 `contributor-guide` spec 描述純 main-only 流程：所有工作分支基於 `main`、所有 PR 對 `main`、hotfix 不再雙合 staging。
- `quality-gates.yml` 只在 `main` 的 PR 與 push 觸發。
- `ci-quality-gates` spec 的觸發契約與所有附帶文字皆 main-only、零 `staging` 字眼。

**Non-Goals:**

- 不改 `default_branch`（本來就是 `main`）、不動「Protect main」branch-protection ruleset（本來就只保護 main）、不動 `release.yml`。
- 不在本 repo 重新引入 staging（那是衍生專案自己的事）。
- 不順手修整 `ci-quality-gates` 既有與 staging 無關的 pre-existing 文字債（例如 Maintainer Setup 驗證段仍寫 required checks 為 "test and build" 而非含 prose-audit）。
- 不改 `README.md`（grep 確認無 staging 引用）。
- 不更名 `contributor-guide` 的 "CONTRIBUTE describes git flow branch model" Requirement header（見 D2）；「git flow」僅留在 spec 內部 requirement 名稱、對貢獻者不可見、且不含 `staging` 字，屬可分離的純命名議題。

## Decisions

**D1：範圍＝純 main-only（含 CI），非 docs-only。** 使用者明確選擇連 CI 一起清、零 staging 殘跡。Alternative（只改 CONTRIBUTE.md、保留 CI 觸發 staging）被否決。

**D2：spec delta 一律避開 RENAMED（避開 archive header-rename 半自動坑與 analyze 的 MODIFIED-not-found 誤報）。**
- `contributor-guide` 兩條 Requirement 皆用 `## MODIFIED Requirements`、**header 維持原樣**（"CONTRIBUTE describes git flow branch model"、"CONTRIBUTE describes PR submission process"），只改 body/scenario 為 main-only。好處：保留原位置與 `@trace`、analyze 找得到原 header → 乾淨。代價：requirement 名稱仍含「git flow」字樣（不含 staging、可接受）。
- `ci-quality-gates` 的 trigger Requirement header **字面含 `staging`**，無法保留，改用 `## REMOVED` 舊條（附 Reason/Migration）+ `## ADDED` 新條（"... trigger on PRs to `main` and pushes to `main`"，header 與 body 一致、無 staging）。該 Requirement 原本無 `@trace`，故 REMOVED+ADDED 無 trace 損失；唯一副作用是新條於 archive 時會被附加到 spec 末尾（trigger 由首條移到尾條，純排版、可於 archive 時人工搬回首位但非必要）。

**D3：`ci-quality-gates` 三處附帶 staging 文字以 archive 手動 canonical touch-up 處理，不進 delta。** 對象：(a) Purpose 段「on every pull request targeting `main`/`staging`」→「targeting `main`」、(b) prose-audit Requirement 的 "PR-time deterministic audit is triggered on changed outward markdown" scenario WHEN「base branch is `main` or `staging`」→「is `main`」、(c) site-smoke Requirement 的 "site-smoke runs as a parallel advisory job" scenario WHEN「pull request to `main`/`staging`」→「to `main`」。理由：Purpose 非 requirement、delta 無對應 op；prose-audit/site-smoke 為含 `@trace` 的長 Requirement，僅為刪兩字而全文 restate 反提高轉錄/clobber 風險。採 repo 既有「archive 時手動修整 canonical」慣例，各為一次精準字串替換、以 `rg` 驗收。

**D4：archive 收尾檢核。** 因 D2 的 REMOVED+ADDED 與 D3 的手動 touch-up，archive 後須跑 `rg -n -i 'staging' openspec/specs/ci-quality-gates/spec.md openspec/specs/contributor-guide/spec.md` 確認零命中；trigger 新條若想搬回 spec 首位可人工移動（非必要）。

## Implementation Contract

**Behavior（apply 後可觀察）：**
- 讀 `CONTRIBUTE.md` 看不到任何叫人發 PR 到 `staging`、從 `staging` 切分支、或 hotfix 雙合 staging 的指引；branch model 表只列 `main` 與 `feature/*`/`bugfix/*`/`hotfix/*`（基底皆 `main`）；PR target 表與 checklist 一律 `main`。
- `rg -n -i 'staging' CONTRIBUTE.md` 僅可能命中 git 暫存區（staging area）語意者；無任何 staging **分支** 語意殘留。
- `.github/workflows/quality-gates.yml` 的 `on.pull_request.branches` 為 `[main]`。
- 對非 `main` base 的 PR 不觸發 quality-gates。

**Interface / data shape：** `quality-gates.yml`：`on.pull_request.branches: [main]`、`on.push.branches: [main]`；job 結構（test/build/prose-audit/site-smoke）不變。

**Failure modes：** 無新增 runtime 行為；CI 觸發面縮小。對 `main` 的 PR 行為完全不變（四個 job 照舊）。

**Acceptance criteria：**
- `rg -n -i 'staging' CONTRIBUTE.md .github/workflows/quality-gates.yml` 無 staging-分支 語意命中。
- archive 後 `rg -n -i 'staging' openspec/specs/ci-quality-gates/spec.md openspec/specs/contributor-guide/spec.md` 無命中。
- `pnpm docs:build` 成功（`CONTRIBUTE.md` 屬 outward docs、改後仍須通過 prose-audit blocking set）。
- `spectra validate main-only-branch-flow` 綠、`spectra analyze` 0 Critical/Warning。

**Scope boundaries：** In scope＝`CONTRIBUTE.md` + `.github/workflows/quality-gates.yml` 兩 code 檔 + `contributor-guide`/`ci-quality-gates` 兩 spec 之 staging 收斂（含 D3 archive 手動 touch-up）。Out of scope＝Non-Goals 所列。

## Risks / Trade-offs

- **D3 手動 canonical touch-up 可能漏做**：緩解：tasks 與本 design 明列三處字串替換、archive 後以 `rg` 驗收。
- **trigger 新條被附加到 spec 末尾（D2）**：純排版議題、不影響語意；可人工搬回首位。
- **轉錄風險**：ADDED 全文 restate trigger Requirement 時須與 canonical 逐字對照（已先讀取原文）。本 change 為唯一 active change，無 sibling-clobber 風險。
- **「git flow」字樣留在 contributor-guide requirement 名稱（D2）**：屬內部命名、不含 staging；若日後要純化可另開 cosmetic change 處理。
