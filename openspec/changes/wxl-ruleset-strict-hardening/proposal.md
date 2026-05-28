## Why

前一個 change `align-ruleset-with-netsim` 把六項「sister repo 已具備、補了沒副作用」之 ruleset hardening 補齊（`deletion`／`non_fast_forward`／`integration_id=15368` pinning／`~DEFAULT_BRANCH`／`bypass_mode=pull_request`／`pull_request` 細項），但**刻意把三條紅燈擋在 Non-Goals**：`required_linear_history`、`allowed_merge_methods: ["squash","rebase"]`、`strict_required_status_checks_policy: true`。三條都有 trade-off 與工作流副作用、需團隊政策共識，當時與「ruleset hardening 收尾」不直接相關所以推到後續 change。本 change 即為三條紅燈的政策決策與落地。

**重要 framing 釐清**：sister repo `BrowserLaboratory/netsim-template` 雖然有開這三條，但 sister repo 用的是 **legacy GitHub branch protection rules**（在 Settings UI 設定），**不是**新式 repository rulesets，無法用 `gh api .../rulesets/<id>` 拉出可比對的 JSON payload。因此本 change **不是**「對齊 sister repo 之 ruleset 形狀」（沒有 payload 可抄）、而是「wxl 在自身工作流脈絡下、評估是否要採用這三條額外 hardening」的**自主政策決策**。Non-Goals 段會解釋為何不把這個 framing 寫成「對齊 sister」、以避免日後 maintainer 誤以為這次也是從 sister payload copy-paste 過來。

每條紅燈的好處與工作流副作用：

- **`required_linear_history`**（強制線性 history、禁 merge commits）：好處是 history 容易閱讀、`git log --oneline` 一條線、`git bisect` 不會走進 merge commit；副作用是所有 PR 必須 squash 或 rebase merge，不能保留 feature branch 的多 commit history 結構，原作者多 commit 的 logical grouping 會被壓平。對 solo + AI-pair 模式影響極小（PR 多半本來就少 commit），對「衍生 repo 多人協作、希望保留 feature branch granular history」會有副作用。
- **`allowed_merge_methods: ["squash","rebase"]`**（禁 merge commit 按鈕）：與上條同源、是 UI 層的對應強制。好處是把「merge button 預設選項」鎖在線性 history 友善的兩種、避免 oncall 慣性點 "Create a merge commit"；副作用是 maintainer 必須調整肌肉記憶。和 `required_linear_history` 一起設算 belt-and-suspenders。
- **`strict_required_status_checks_policy: true`**（要求 PR head 必須 rebase 到最新 base、base 變動後要重跑 CI）：好處是消除「base drift 導致 PR 帶舊 base、merge 後 base 上的其他變更 + 此 PR 組合可能踩到沒測過的狀態」這類細微 bug；**主要副作用**是「綠了又被打回」連鎖——A、B 兩 PR 同時開、A 先 merge，B 的 CI 即使本來綠了也會被打回「out of date with base」狀態、必須點 "Update branch" 重跑全套 CI 才能再次成為可 merge 狀態。對於同時開 3-5 個 PR 的 burst 期影響顯著、對於 solo + 一次一個 PR 影響極小。

本 change 採取**全部三條一起開**的決策（理由見 `design.md` Decisions 段），但保留 Open Question：是否要先在 staging branch 試一週後再 promote 到 main、或先合 1-2 條再分批合最後一條，留待 PR review 期間決議。

## What Changes

- **MODIFIED Requirement (`ci-quality-gates` 第 12 條「Branch protection ruleset guards main with required status checks」)**：在現有 5 個 Scenario 之上新增 3 個 Scenario，覆蓋三條新加 hardening：
  - 新 Scenario：非 squash／rebase 的 merge commit 嘗試在 main 上會被拒（覆蓋 `required_linear_history` + `allowed_merge_methods`）。
  - 新 Scenario：UI 上 "Create a merge commit" 按鈕對 main PR 不可用（覆蓋 `allowed_merge_methods` 之使用者可觀察行為）。
  - 新 Scenario：PR head 落後於 base 時，即使 `test`／`build` 曾經報 success，PR 仍不可 merge、必須先 rebase／update branch 並等新 head 之 CI 重跑成功（覆蓋 `strict_required_status_checks_policy: true`）。
  - Requirement body 段落補三條新規範的描述（`rules` 列表新增 `required_linear_history`、`pull_request` rule 新增 `allowed_merge_methods` parameter、`required_status_checks` rule 之 `strict_required_status_checks_policy` 從 `false` 改 `true`）。**Header 不動、僅 body 與 Scenarios 變動**（spectra archive 對 MODIFIED Requirement header 變更只半自動，要避開）。
- **`CONTRIBUTE.md` 「Maintainer Setup → Branch protection ruleset」段落升級**：
  - 「Create the ruleset」與「Upgrade an existing ruleset」之 POST／PUT payload 同步更新：`rules` 新增 `{"type":"required_linear_history"}`、`pull_request.parameters` 新增 `"allowed_merge_methods":["squash","rebase"]`、`required_status_checks.parameters.strict_required_status_checks_policy` 由 `false` 改 `true`。
  - Notes 段新增三條新設定之解釋（功用、副作用、為何 wxl 此時採用、各條對 solo／多人團隊／衍生 repo 的差異影響）。
  - Verify 段更新預期 rule type 列表（從 4 條 rule 變 5 條、含 `required_linear_history`）、補一行檢查 `allowed_merge_methods` 與 `strict_required_status_checks_policy` 值之 Python 片段。
- **不在本 change 端實際 PUT ruleset**：和 `align-ruleset-with-netsim` 同樣模式，本 change 只規範形狀＋文件化指令；實際 `gh api -X PUT /repos/BrowserLaboratory/wxl-template/rulesets/16637478 ...` 由 maintainer 在 PR merged 之後執行；衍生 repo maintainer 視自家情況用同樣 PUT 指令升級。

## Non-Goals (optional)

- **不把 framing 寫成「對齊 sister」**：如 Why 段所述，sister repo 用 legacy branch protection rules、不是 rulesets，沒有 payload 可抄。本 change 是 wxl 自身對三條紅燈之政策採用，spec／文件不得出現「對齊 sister」「複製 sister payload」之描述以避免誤導。
- **不引入新 required status check**（lighthouse／prose-audit／site-smoke 等）：仍維持 `test`／`build` 兩個 check；新 check 由各自獨立 change 引入。`strict_required_status_checks_policy: true` 之影響範圍以現有兩 check 為基準討論。
- **不動 `staging` branch ruleset**：`staging` 尚未啟用，待之後另開 change 處理。Open Question 段討論「是否要先在 staging 試」之 framing，不在本 change 實作 staging 部分。
- **不修改 `contributor-guide` 第 6 條 Requirement**：原文要求「copy-paste-ready `gh api` command」、「verification command」、「stricter approval policy 升級指引」等仍由更新後的 CONTRIBUTE.md 內容滿足，Requirement 措辭不需動。
- **不調整 `bypass_actors`／`bypass_mode`／`integration_id` pinning** 等已落地之設定：本 change 純粹是 incremental hardening，不重新討論前一個 change 已決定之事項。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `ci-quality-gates`：MODIFY 第 12 條 Requirement「Branch protection ruleset guards main with required status checks」之 ruleset 形狀描述，補 `required_linear_history`／`allowed_merge_methods: ["squash","rebase"]`／`strict_required_status_checks_policy: true`；新增 3 個 Scenario 對應這三條 hardening 之可觀察行為。

## Impact

- Affected specs: `ci-quality-gates`（MODIFIED 第 12 條 Requirement，無 ADDED／REMOVED／RENAMED）
- Affected code:
  - Modified:
    - `CONTRIBUTE.md`
    - `openspec/specs/ci-quality-gates/spec.md`
  - New: （無）
  - Removed: （無）
- 操作面影響：本 change PR merge 後，maintainer 需依 `CONTRIBUTE.md` 更新後章節用 `gh api -X PUT /repos/BrowserLaboratory/wxl-template/rulesets/16637478 ...` 把現有 ruleset 升級為新形狀；不執行升級則 spec 與 server side 之間會出現可被 audit surface 的差異（不算 spec violation，spec 規範形狀、不規範時程，但 PR description 會明示「merge 後請立刻跑 PUT 指令」）。
- 工作流影響：升級完成後，maintainer 之直接副作用為——
  - 不能再用 "Create a merge commit"，要 squash 或 rebase merge。
  - 一段時間內可能會碰到「綠了又被打回」狀態：同時開兩個 PR、第一個 merge 後第二個的 CI 須重跑。對 solo + 一次一個 PR 模式影響極小、對 burst 期影響顯著。
- 對 use-template 衍生 repo：spec 與 `CONTRIBUTE.md` 都會被繼承；衍生 repo 的 maintainer 拿到 template 後可選擇照「初次建立」流程跑 POST（含新設定），或對既有 ruleset 跑 PUT 升級。多人協作的衍生 repo 應特別評估 `strict_required_status_checks_policy: true` 對其 PR throughput 之影響。
