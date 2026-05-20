## Why

PR #6 merge 後在實機驗證 `configure-branch-protection-ruleset` 的 ruleset 設定時，把 sister repo `BrowserLaboratory/netsim-template` 的 `main-required-ci-gates` ruleset 拉出來比對，發現本 repo 的 `Protect main` (id `16637478`) 缺了多條 sister repo 已具備的 hardening，且 spec 第 12 條 Requirement 對 `bypass_actors` 的描述（`RepositoryAdmin`）並非實際 GitHub API 合法的 `actor_type`。差異多為「sister repo 在做、本 repo 漏做」的縱深防禦項目，沒有 trade-off 理由不對齊。

## What Changes

- **MODIFIED Requirement (`ci-quality-gates` 第 12 條「Branch protection ruleset guards main with required status checks」)**：擴充 ruleset 規範，從目前「PR-only ＋ required status checks」放大到包含：
  - 補 `deletion` rule（禁刪 `main`）。
  - 補 `non_fast_forward` rule（禁 force-push `main`，含 admin）。
  - `required_status_checks` 的 `test`／`build` entry 必須鎖 `integration_id=15368`（GitHub Actions App），避免第三方 App 偽冒同名 check。
  - `pull_request` rule 設 `dismiss_stale_reviews_on_push=true`、`required_review_thread_resolution=true`（多人 team 受用，solo 無副作用）。
  - `bypass_actors` 收緊為 `bypass_mode=pull_request`（取代原 `always`，admin 仍可緊急 bypass，但**必須**走 PR、不能直推）。
  - `bypass_actors` 用 `OrganizationAdmin` + `RepositoryRole(actor_id=5, Admin)`，明文糾正原 Requirement 把 `RepositoryAdmin` 當 `actor_type` 的錯誤命名。
  - `conditions.ref_name.include` 改用 `~DEFAULT_BRANCH` 動態變數，default branch 改名時不會孤兒、衍生 repo 用 `master`／`trunk` 也能繼承。
- **`CONTRIBUTE.md` 範例 payload 升級**：把 `gh api -X POST .../rulesets` heredoc 換成擴充後的版本，含上述 6 項新設定；補 maintainer 升級既有 ruleset 用的 `gh api -X PUT .../rulesets/<id>` 指令樣板，並補對應 Notes（新 rule 用途、`integration_id` 與 GitHub Actions App、`bypass_mode` 差異）。
- **不在本 change 端實際 PUT ruleset**：和先前 `configure-branch-protection-ruleset` 同樣模式，本 change 只規範形狀＋文件化指令，實際 `gh api -X PUT /repos/BrowserLaboratory/wxl-template/rulesets/16637478 ...` 由 maintainer 在 PR merged 之後執行；衍生 repo maintainer 也用同樣 PUT 指令升級自己已有的 ruleset。

## Non-Goals (optional)

- **不引入 `required_linear_history`**：禁 merge commits、強制 squash／rebase merge 會改變 git history 樣貌，需團隊共識；目前 wxl 沒有強制 linear history 的需求。
- **不引入 `allowed_merge_methods: ["squash", "rebase"]`**：與上同源，限制 merge 方式為團隊政策決定，不在本 change 範圍。
- **不開 `strict_required_status_checks_policy=true`**：sister repo 開了，但 sister repo 有 Node 22/24 matrix（CI 成本高）；wxl 只有 `test`／`build`、CI 時間短，trade-off 沒 sister repo 痛。等 wxl 補完 Node matrix 後再評估。
- **不引入新 required status check**（lighthouse／prose-audit／site-smoke 等）：仍維持 `test`／`build` 兩個 check，新 check 由各自獨立 change 引入。
- **不動 `staging` branch ruleset**：`staging` 尚未啟用，待之後另開 change 處理。
- **不修改 `contributor-guide` 第 6 條 Requirement**：原文要求「copy-paste-ready `gh api` command」、「verification command」、「stricter approval policy 升級指引」等仍由更新後的 CONTRIBUTE.md 內容滿足，Requirement 措辭不需動。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `ci-quality-gates`：MODIFY 第 12 條 Requirement「Branch protection ruleset guards main with required status checks」之 ruleset 形狀描述，補 `deletion`／`non_fast_forward`／`integration_id` pinning／`pull_request` 細項／`bypass_mode=pull_request`／`~DEFAULT_BRANCH`，並糾正 `bypass_actors` actor_type 命名。

## Impact

- Affected specs: `ci-quality-gates`（MODIFIED 第 12 條 Requirement，無 ADDED／REMOVED／RENAMED）
- Affected code:
  - Modified:
    - `CONTRIBUTE.md`
    - `openspec/specs/ci-quality-gates/spec.md`
  - New: （無）
  - Removed: （無）
- 操作面影響：本 change PR merge 後，maintainer 需依 `CONTRIBUTE.md` 更新後章節用 `gh api -X PUT /repos/BrowserLaboratory/wxl-template/rulesets/16637478 ...` 把現有 ruleset 升級為新形狀；不執行升級則 spec 與 server side 之間會出現可被 audit surface 的差異（不算 spec violation，spec 規範形狀、不規範時程，但建議在 setup checklist 註明）。
- 對 use-template 衍生 repo：spec 與 `CONTRIBUTE.md` 都會被繼承；衍生 repo 的 maintainer 拿到 template 後可選擇照「初次建立」流程跑 POST（含新設定），或對既有 ruleset 跑 PUT 升級。
