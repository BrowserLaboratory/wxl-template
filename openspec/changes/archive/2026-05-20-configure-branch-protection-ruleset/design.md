## Context

`harden-ci-workflows` archive 後，`ci-quality-gates` 已有 11 條 Requirement 把兩個 workflow 的 hardening 鎖死，但 server side 仍**任何 maintainer 都可直推 `main`、任何 PR 都可在 red CI 狀態下手動 merge**——`quality-gates.yml` 的 `test`／`build` 兩個 job 即使存在、即使綠燈，也只是「資訊性 check」而非「mandatory check」。

關鍵限制：

- `test`／`build` job ID 已由 `ci-quality-gates` spec 「Two Parallel Jobs」與「Test Job Steps」／「Build Job Steps」三條 Requirement 凍結；本 change 把這兩個 job 名稱當作 required status checks 的穩定 binding key 引用。
- `CONTRIBUTE.md` 已存在於 repo root，現有 sections（Branch model／Development workflow／PR submission workflow／Adding a new challenge／Commit conventions／Reporting issues）皆為**對 contributor** 的指引；本 change 需新增第一個**對 maintainer** 的指引段落。
- GitHub 提供兩種 branch 保護機制：legacy「Branch protection rules」與較新的「Repository rulesets」。後者支援 API 完整管理、bypass actor 分層、UI 與 `gh api` 對等存取；前者已被 GitHub 標為「we recommend using rulesets」。
- 在這台機器上，Claude Code 本機 permission rule 已擋住直接 push main（archive `harden-ci-workflows` 時偶然驗證）；但這只對這個 agent、這台機器生效。其他 client（人類 maintainer 終端、CI runner、衍生 repo）完全不受影響——這正是需要 server side ruleset 的理由。
- 本 change 不負責實際在 GitHub 上建 ruleset：實際操作由 maintainer（user）依本 change 產出的 `CONTRIBUTE.md` 指令執行。spec 規範「應該存在的形狀」，文件提供「重現指令」，執行歸 maintainer。

## Goals / Non-Goals

**Goals:**

- `ci-quality-gates` spec 明文宣告 `main` ruleset 必須將 `test`／`build` 兩個 job 列為 required status checks 並禁止直推（PR-only）。
- `contributor-guide` spec 明文宣告 `CONTRIBUTE.md` 必須有「Maintainer Setup → Branch protection ruleset」段落含 `gh` 重現指令。
- `CONTRIBUTE.md` 實際新增該段落，內含可一鍵複製貼上的 `gh` 指令、設定後驗證指令、與 spec 條目對應指引。
- 衍生 repo 的 maintainer 拿到 template 後，依本 change 文件能在 5 分鐘內把 ruleset 建好、看到 `gh ruleset view` 印出正確 required checks。

**Non-Goals:**

- 不嘗試把 ruleset 設定 commit 進 repo（GitHub ruleset 是 server side state、無檔案載體）。
- 不引入「驗證 ruleset 存在」的 CI 步驟（需額外 token 權限、衍生 repo 失敗、與 permissions minimal 原則衝突）。
- 不引入 `staging` branch ruleset（`staging` 尚未啟用，待之後另開 change）。
- 不引入新 required check（lighthouse／prose-audit／site-smoke 等屬於各自獨立 change）。
- 不硬性規定 PR review approval 數量（template repo 規模差異大，spec 規範「可設定」，文件提供 default + 升級指引）。
- 不嘗試取消 Claude Code 本機禁推 main 的 permission rule（兩條規則平行存在、各管各的：Claude Code rule 管 agent 行為、ruleset 管所有 client）。

## Decisions

### Ruleset，不用 legacy Branch protection rules

採用 GitHub「Repository rulesets」。**理由**：(1) GitHub 官方推薦；(2) API 完整、支援 `gh api -X POST /repos/<owner>/<repo>/rulesets` 一鍵建立；(3) bypass actor 分層精細，admin override 可顯式設定；(4) 對齊 `netsim-template` 同期 hardening 方向（與 sister repo 維持同方向利於 cross-repo audit）。

**替代方案**：legacy Branch protection rules——拒絕。GitHub 已標示為「we recommend rulesets」、預期長期被 ruleset 取代；同時 `gh ruleset` 系列指令直接面向 ruleset，文件化指令更乾淨。

### Required status checks 只含 `test`／`build`

ruleset 的 `required_status_checks.required_status_checks` array 只列：
```
[{"context": "test", "integration_id": null}, {"context": "build", "integration_id": null}]
```

**理由**：這兩個 job 是 `ci-quality-gates` 既有 spec 鎖死的 job ID（Requirement「Two Parallel Jobs」），是 stable binding key。其他 job／workflow（如未來的 prose-audit、site-smoke）由各自獨立 change 引入，不在本 change 範圍。

**替代方案**：列入 quality-gates workflow 內所有 step 名稱——拒絕。step 名稱由 workflow 內部結構決定、容易變動，不是穩定 ID。

### 設「Require a pull request before merging」，allow admin bypass

ruleset 加入：
- `pull_request` rule：required PR、禁直推。
- bypass actors：包含 organization admin（actor_type=OrganizationAdmin、bypass_mode=always）與 repository admin（actor_type=RepositoryAdmin、bypass_mode=always）。

**理由**：solo maintainer（user 目前情境）必要時可緊急直推 fix；多人 organization 可由 admin 角色處理意外狀況。bypass_mode=always 允許這些 actor 隨時繞過、不需審批；若未來要更嚴格可改 pull_request_only。文件需明示 bypass 機制存在、使用要謹慎。

**替代方案**：完全禁 bypass——拒絕。solo maintainer 在 oncall 時無法快速 fix，反而傷害 hardening 立意（不是讓 maintainer 痛苦才叫 hardening）。

### Approval count = 0（default），文件指引升級到 1

`gh ruleset` 指令 default 不要 PR review approval。

**理由**：template repo 主要使用者是個人或小團隊，硬性 require 1 approval 在 solo maintainer 情境會直接死鎖（自己 PR、無人可 approve）；又因 admin bypass 已開、approval 規則容易被 admin 略過、強制效果有限。但多人 team 受用，所以文件指引怎麼升級。

**替代方案 A**：default = 1——拒絕，會卡死 solo maintainer。

**替代方案 B**：default = 0 + 完全不提升級——拒絕，多人 team 沒指引會自己摸索。

### CONTRIBUTE.md 新章節放尾端

新章節「Maintainer Setup」放在現有「Reporting issues」段落**之後**，作為 top-level section（`##`）。

**理由**：(1) 維持「contributor first, maintainer later」的閱讀順序——新貢獻者不需在「branch model」之前讀到「Maintainer Setup」這種與己無關的章節；(2) 後續若要加更多 maintainer 操作（如 release 流程、ruleset 更新），都集中放在這個 section 下，避免散落各處。

### `gh` 指令用 `gh api` 而非 `gh ruleset create`

文件示範指令採 `gh api -X POST /repos/{owner}/{repo}/rulesets -F name=... -F target=... --raw-field rules='[...]'` 形式。

**理由**：`gh ruleset` 子命令是 newer subcommand 仍在迭代；`gh api` 直打 REST endpoint 是穩定底層、文件對應 GitHub REST docs、未來不會因 `gh` CLI 改版而 stale。指令較長但每個 flag 對應一個明確語意，可逐行註解。

**替代方案**：`gh ruleset create` 簡潔指令——拒絕，當前該 subcommand 在 gh 2.x 仍標 experimental，未來 breaking 風險高。

## Implementation Contract

**Observable behavior（apply 完成 + PR merge 後）**：

- `openspec/specs/ci-quality-gates/spec.md` 多 1 條 Requirement「Branch protection ruleset SHALL guard main with required status checks」（總數 11→12）。
- `openspec/specs/contributor-guide/spec.md` 多 1 條 Requirement「CONTRIBUTE SHALL document maintainer setup」（總數 N→N+1）。
- `CONTRIBUTE.md` 新增 top-level section「Maintainer Setup」，含子 section「Branch protection ruleset」，內有：(a) why-this-matters 一小段、(b) bash code block 含完整 `gh api` 指令、(c) `gh ruleset list` / `gh api -X GET .../rulesets/{id}` 驗證指令、(d) 指向 `ci-quality-gates` spec 對應 Requirement 的引用。
- 本 change PR 自身 merge 仍走目前流程（無 ruleset enforcing），但 merge 之後 maintainer 可依新章節指令建立 ruleset，建立後**下一個** PR 就會被 ruleset enforce。

**Interface / data shape**：

- 新 spec Requirement 名稱（後續 trace 用）：
  - `ci-quality-gates`：`Branch protection ruleset guards main with required status checks`
  - `contributor-guide`：`CONTRIBUTE documents maintainer setup for branch protection ruleset`
- `CONTRIBUTE.md` 新章節結構：
  - `## Maintainer Setup`（H2）
    - `### Branch protection ruleset`（H3）
      - bash code block 1：`gh api -X POST /repos/{owner}/{repo}/rulesets -F ...`
      - bash code block 2：`gh ruleset list` 驗證
      - bash code block 3（選用）：`gh api -X GET /repos/{owner}/{repo}/rulesets/{id}` 詳查
- `gh api` 指令所用 JSON payload 必須涵蓋：`name=Protect main`、`target=branch`、`enforcement=active`、`conditions.ref_name.include=[refs/heads/main]`、`bypass_actors=[admin]`、`rules=[{type: pull_request}, {type: required_status_checks, parameters: {required_status_checks: [{context: test}, {context: build}], strict_required_status_checks_policy: false}}]`。

**Failure modes**：

- 若 maintainer 沒跑 `gh api` 指令：spec Requirement 仍存在，audit 時會 surface「ruleset 應該存在但未驗證」；不算 spec violation（spec 規範形狀、不規範時程），但建議在 CONTRIBUTE.md 註明「未設 ruleset 前 main 仍可被直推」。
- 若 maintainer 設了 ruleset 但少了 `test` 或 `build` required check：spec scenario 會在下次 audit 被 surface。
- 若 GitHub REST API 在未來改了 ruleset endpoint shape：`CONTRIBUTE.md` 內指令會 stale；mitigation 是文件指向 GitHub REST docs `https://docs.github.com/en/rest/repos/rules`（reviewer 可一鍵跳到 official source）。

**Acceptance criteria**：

- `grep -c '^### Requirement:' openspec/specs/ci-quality-gates/spec.md` 由 11 變 12。
- `grep -c '^### Requirement:' openspec/specs/contributor-guide/spec.md` 較 main 多 1。
- `CONTRIBUTE.md` 含一個 `## Maintainer Setup` H2 與一個 `### Branch protection ruleset` H3。
- `grep -c '^gh api' CONTRIBUTE.md` ≥ 1（至少一個可貼上執行的 `gh api` 指令）。
- `spectra validate configure-branch-protection-ruleset` 退出碼 0。
- `spectra analyze configure-branch-protection-ruleset --json` 為 0 Critical / 0 Warning。
- 在 quality-gates workflow CI 跑出綠燈（純 markdown 變動、不應影響 build／test）。

**Scope 邊界**：

- In scope：2 個 spec delta、`CONTRIBUTE.md` 新章節。
- Out of scope：實際在 GitHub 上建 ruleset（maintainer 操作）、`staging` branch 保護、Lighthouse／prose-audit／site-smoke 等其他 required check、Claude Code 本機 permission rule（已存在、不需動）、approval count 強制。

## Risks / Trade-offs

- Spec 描述了「應該有 ruleset」但無 server side enforcement：spec 看起來在說謊、實際 main 仍可被直推。 → 緩解：scenario 明示「the maintainer SHALL ensure...」，把責任歸給人；audit／onboarding 時可手動驗證。
- `gh api` 指令長且詳細，contributor 看到可能誤以為自己也要跑：→ 緩解：章節 H2 名稱「Maintainer Setup」明示是 maintainer 範圍；首段加一句「This section is for repository maintainers only; contributors can skip」。
- GitHub REST API breaking change：→ 緩解：文件附 GitHub REST docs 連結；spec 規範 ruleset 行為（required checks 為 test／build），不規範 API call shape，未來 API 變動只需更新文件。
- 衍生 repo maintainer 不執行設定：→ 接受。template 本來就無法強迫衍生 repo 套規範；文件存在已是最大努力。

## Migration Plan

- 對本 repo（`BrowserLaboratory/wxl-template`）：本 change PR merge 之後，user 依 `CONTRIBUTE.md` 新章節用 `gh api` 在 settings 端建 ruleset；建立後可選擇用 `git push origin main` 驗證會被 reject（預期 fail）來測試。
- 回滾：若 ruleset 設錯，`gh ruleset delete <id>` 即可移除；spec 規範未動，maintainer 重新設即可。
- 衍生 repo：use-template 衍生時繼承 CONTRIBUTE.md 段落；衍生 repo 的 maintainer 把 `{owner}/{repo}` 換成自家 repo 後跑同樣 `gh api` 指令即可。

## Open Questions

- approval count default 是否真的 0？user 偏好為主，design 暫定 0（solo-maintainer-friendly），實作時 `gh api` 指令的 `rules` array 內不放 `pull_request_required_approvals` 條目；文件指引「升級到 1 的方法」單獨列。若 apply 期間 user 偏好改為 1，把 `pull_request` rule parameters 加 `required_approving_review_count=1` 即可。
