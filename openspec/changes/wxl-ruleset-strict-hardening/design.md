## Context

前一個 change `align-ruleset-with-netsim`（archived 2026-05-20）把 wxl `Protect main` ruleset 從「2 條 rule、bypass_mode=always」升級到「4 條 rule、bypass_mode=pull_request、integration_id pinned」，但**刻意把三條紅燈擋在 Non-Goals**，原因是當時這三條與「ruleset hardening 收尾」goal 不直接相關、且都需要團隊政策共識。三條紅燈為：

- `required_linear_history`（禁 merge commits、強制 squash／rebase merge）
- `allowed_merge_methods: ["squash", "rebase"]`（UI 層 merge button 鎖兩種）
- `strict_required_status_checks_policy: true`（PR head 必須 rebase 到最新 base、base 改動後 PR 要重跑 CI）

**重要 framing 釐清**：sister repo `BrowserLaboratory/netsim-template` 用的是 **legacy GitHub branch protection rules**（透過 Settings UI 設定），**不是**新式 repository rulesets。前一個 change 之所以能「對齊 sister」是因為兩 repo 採用同樣的 ruleset 機制——但事實上 sister 從未轉到 ruleset。本 change 不是「對齊 sister 之 ruleset payload」（沒有 payload 可抄），而是「wxl 在自身工作流脈絡下、自主評估是否要採用這三條 hardening」之政策決策。spec／文件 framing 必須老實寫這個事實，避免日後 maintainer 誤以為又是 copy-paste from sister。

關鍵限制：

- 本 change 不修改 `staging` branch 保護（`staging` 尚未啟用）。Open Question 段討論「是否先在 staging 試」之 framing。
- 本 change 不引入新 required check（lighthouse／prose-audit／site-smoke 仍由各自獨立 change 處理）。
- 本 change 不負責實際 PUT ruleset；和 `configure-branch-protection-ruleset`／`align-ruleset-with-netsim` 同樣分工模式：spec 規範形狀、`CONTRIBUTE.md` 提供重現指令、maintainer 在 GitHub settings 端執行。
- Server-side ruleset id 為 `16637478`（GitHub.com BrowserLaboratory/wxl-template，由前兩個 ruleset change 建立並升級至今）。

| 設定 | 現狀（align-ruleset-with-netsim 後） | 本 change 後 |
| --- | --- | --- |
| `rules` 條數 | 4（deletion／non_fast_forward／pull_request／required_status_checks） | 5（多 required_linear_history） |
| `pull_request.parameters.allowed_merge_methods` | 缺（GitHub default = 全開） | `["squash", "rebase"]` |
| `required_status_checks.parameters.strict_required_status_checks_policy` | `false` | `true` |
| 其餘設定（bypass_actors／integration_id pinning／~DEFAULT_BRANCH／pull_request 細項） | 已就緒 | 不動 |

**prose-audit reconciliation 註**：本 change 之 spec delta 於 propose 階段（在 `prose-audit-phase-1-deterministic` archive 之前）寫成 required checks 只列 `test`+`build`。但該 sibling change archive 後，canonical spec 第 12 條已被改為 `test`+`build`+`prose-audit`（並把 prose-audit 標記為 `Required by ruleset: Yes`）。為避免本 change archive 時把已落地的 prose-audit required check 從 spec 洗掉，spec delta 與 `CONTRIBUTE.md` 的 POST／PUT payload 均更新為三個 required check（`test`／`build`／`prose-audit`）並列三條紅燈。這不是「引入新 required check」（prose-audit 已是 canonical 規範），而是把本 change 的 delta 與既有 canonical 對齊。實際 live ruleset 的 prose-audit required check 與三條紅燈，於本 change PR merge 後由 maintainer 以**單一 PUT** 一次升級（兩者改同一個 `required_status_checks` rule，PUT 整包取代，分兩次會互相 clobber）。

## Goals / Non-Goals

**Goals:**

- 把三條紅燈 hardening 採用到 wxl `Protect main` ruleset 之 payload 形狀（spec 與 CONTRIBUTE.md POST／PUT 範例同步）。
- 在 spec 第 12 條 Requirement 新增 3 個 Scenario，分別覆蓋三條紅燈對 maintainer／contributor 可觀察行為（merge commit 被拒、UI 按鈕不可用、stale base 不可 merge）。
- Notes 段如實描述每條 hardening 之工作流副作用（特別是 `strict_required_status_checks_policy: true` 造成的「綠了又被打回」連鎖），避免後續 maintainer 升級後驚訝。
- 衍生 repo maintainer 拿到 template 後，依 `CONTRIBUTE.md` 升級指令在 5 分鐘內把 ruleset 同步到新形狀，**並且**在 Notes 段讀到此三條 hardening 之副作用、可自行決定是否要 opt out（CONTRIBUTE.md 留有「如何 opt out 個別 hardening」之選用替換片段）。

**Non-Goals:**

- 不把 framing 寫成「對齊 sister」（如 Context 段所述，sister 用 legacy branch protection、無 ruleset payload）。
- 不引入新 required check。
- 不引入「驗證 ruleset 設定符合 spec 的 CI 步驟」（同 `configure-branch-protection-ruleset` 立場：需額外 token 權限、衍生 repo 失敗）。
- 不更動 `contributor-guide` 第 6 條 Requirement。
- 不調整 `bypass_actors`／`bypass_mode`／`integration_id` pinning 等已落地之設定。
- 不在本 change 端實際跑 PUT 升級 ruleset。

## Decisions

### 採用 `required_linear_history` rule

ruleset `rules` array 加入 `{ "type": "required_linear_history" }`。

**理由**：

- **history 可讀性**：合入後 `git log --oneline main` 為一條線、無 merge commit 干擾、`git bisect` 不會走進 merge commit 之間穿插路徑。對 AI-pair 模式下「快速從 git log 回溯改動意圖」之 workflow 友善。
- **與本 repo 既有實踐一致**：檢視 wxl 既有 PR merge history（截至 2026-05-28），多數 PR 已採用 squash merge、極少 merge commit；正式採用此設定只是把既有 de facto 慣例 codify 成 server-side enforcement。
- **副作用界定**：禁止 "Create a merge commit" 按鈕；feature branch 多 commit 之 logical grouping 會在 squash 時被壓平（contributor 必須在 commit message body 或 PR description 自行記錄 commit-level intent）。對 solo + AI-pair 模式影響極小。

**替代方案 A：不開**——拒絕。本 repo 既有實踐已是線性 history，server-side 鎖住可避免「某次 oncall 誤點 Create a merge commit」之意外漂移。

**替代方案 B：先在 staging 試**——保留為 Open Question（見後段）；目前 baseline 採直接合入 main。

### 採用 `allowed_merge_methods: ["squash", "rebase"]` parameter

`pull_request` rule 之 `parameters` 加入 `"allowed_merge_methods": ["squash", "rebase"]`。

**理由**：

- 與 `required_linear_history` 為 belt-and-suspenders：`required_linear_history` 在 server 端 enforce（即使 UI bug 顯示 merge commit button 可點，server 仍會拒絕該操作），而 `allowed_merge_methods` 是 UI 層強制（merge commit button 在 PR page 直接灰掉，不會誤點）。兩者一起設可避免「按了 button、跳 error message、要重點別的 button」之 friction。
- GitHub default 為 `["merge", "squash", "rebase"]`（全開）；本設定僅是移除 `"merge"` 選項。
- **副作用界定**：使用者必須調整肌肉記憶；如 maintainer 過往慣性用 merge commit，需明示切到 squash 或 rebase。

**替代方案：不開、只開 `required_linear_history`**——拒絕。只開 server-side enforce 不開 UI 強制會導致 contributor 在 PR 上看到 merge button 可用、點下後跳 server-side 拒絕之 error，是不必要的 friction。

### 採用 `strict_required_status_checks_policy: true`

`required_status_checks` rule 之 `parameters.strict_required_status_checks_policy` 由 `false` 改 `true`。

**理由**：

- **避免 base drift 風險**：當 A、B 兩 PR 並行開、A 先 merge，B 之 head 仍然是 base-pre-A 之 commit；B 上 `test`／`build` 是針對 base-pre-A 跑出的綠燈，**未驗證** base-with-A + B 之組合。`strict: true` 強制 B 必須 rebase 到 base-with-A 並重跑 CI 之後才能 merge，把該組合納入驗證範圍。
- **trade-off 評估**：對 wxl 目前 CI 跑時間（`test` ~2 min、`build` ~3 min，總共 < 5 min）影響相對小；對 solo + 一次一個 PR 模式影響極小（沒有 base drift 機會）；對「同時開 3-5 個 PR」之 burst 期影響顯著——前面提到的「綠了又被打回」連鎖正是這種情況。
- **wxl 是 template repo、CI 成本與真實業務 repo 相比為輕量**：wxl 不像 sister repo 有 Node 22/24 matrix，本身 CI 量級小；採用 strict policy 之 incremental 成本相對划算。

**主要副作用——「綠了又被打回」連鎖**：

設 maintainer 同時開 PR A 與 PR B，兩者皆通過 CI。流程變成：

1. A merge 進 main 後，B 的 PR page 顯示 "This branch is out-of-date with the base branch"。
2. B 之 merge button disabled、雖然 CI 仍顯示 success（針對舊 base）。
3. Maintainer 在 B 上點 "Update branch"，B 之 head 推進到 base-with-A、CI 自動重跑。
4. CI 重跑成功後 merge button 才再次可用。

對 wxl 之 burst 期模式（例如一次 archive 兩個 spectra change、開兩個 PR），這條鏈會新增約 5-10 分鐘等待時間。**Acceptable**：交換到的是「base-with-A + B 組合不會因未測試而踩到細微 bug」之保證，與 wxl 對 spec／文件正確性之高要求一致。

**替代方案 A：不開、維持 `false`**——拒絕。`align-ruleset-with-netsim` 已留下「等補完 Node matrix 後再評估」之 footnote；現實是 Node matrix 未必會在近期加入（屬 backlog），與其無限延後不如現在採用。
**替代方案 B：先在 staging 試**——保留為 Open Question。
**替代方案 C：分批採用（先合前兩條 hardening、觀察一週後再合 `strict: true`）**——保留為 Open Question；現 baseline 採三條同時合入。

### 三條紅燈同時採用、不分批

本 change 把三條紅燈作為**一個 atomic 升級**處理。

**理由**：

- 三條都針對「main branch hardening」、屬同一語意 group。
- 同 change 處理可一次 review、一次 PUT 升級 ruleset，減少 spec／server-side 不同步之 surface。
- `required_linear_history` 與 `allowed_merge_methods` 為 belt-and-suspenders，本來就應一起合。
- 唯一有副作用觀察需求的是 `strict_required_status_checks_policy: true`，是否分批留待 Open Question。

**替代方案：分批**——保留為 Open Question 4.2。

### 不調整 ruleset id `16637478` 之 ownership 或 conditions

ruleset id 維持原本 `16637478`、`conditions.ref_name.include` 維持 `["~DEFAULT_BRANCH"]`、`bypass_actors` 維持原本兩條 entry。

**理由**：本 change 純粹是 incremental hardening，不重啟前一個 change 已定的設計討論。

## Implementation Contract

**Observable behavior（apply 完成 + PR merge 後）**：

- `openspec/specs/ci-quality-gates/spec.md` 第 12 條 Requirement「Branch protection ruleset guards main with required status checks」之 body 與 Scenarios 更新後反映：
  - `rules` 列表新增 `required_linear_history`。
  - `pull_request` rule 之 parameters 新增 `allowed_merge_methods: ["squash", "rebase"]`。
  - `required_status_checks` rule 之 `strict_required_status_checks_policy` 描述由「`false`」改為「`true`」。
  - `required_status_checks` 之 required checks 由「`test`+`build`」更新為「`test`+`build`+`prose-audit`」（reconcile：canonical 第 12 條已被 prose-audit-phase-1 archive 加入 `prose-audit`，本 change 之 delta 須帶上以免 archive 時退化）。
- 第 12 條 Requirement 之 Scenarios 數量由 5 增加到 8（新增 3 個 Scenario 覆蓋三條紅燈），Example 維持原 1 個。
- **Header 不動**：spec delta 之 `### Requirement: Branch protection ruleset guards main with required status checks` 與 canonical spec L273 逐字一致（避開 spectra archive 對 header 變更只半自動之陷阱）。
- `CONTRIBUTE.md` 「Maintainer Setup → Branch protection ruleset」段落之 POST 與 PUT 範例 payload 同步升級（含三條新設定）；Notes 段新增三條解釋（含「綠了又被打回」副作用之中文／英文表述）；Verify 段更新預期 rule type 列表與新增 `allowed_merge_methods`／`strict_required_status_checks_policy` 之檢查。
- 本 change PR 自身 merge 後，maintainer 跑文件化 PUT 指令，把 `Protect main` (id `16637478`) 升級到新形狀。

**Interface / data shape（升級後 ruleset 應呈現）**：

- `gh api -X GET /repos/BrowserLaboratory/wxl-template/rulesets/16637478` 回傳應符合：
  - `enforcement: "active"`、`target: "branch"`、`conditions.ref_name.include: ["~DEFAULT_BRANCH"]`（不動）
  - `rules` 含 5 條：`deletion`、`non_fast_forward`、`required_linear_history`、`pull_request`、`required_status_checks`
  - `pull_request.parameters` 含 `allowed_merge_methods: ["squash", "rebase"]`、`dismiss_stale_reviews_on_push: true`、`required_review_thread_resolution: true`（後兩者不動）
  - `required_status_checks.parameters.required_status_checks` 含三個 context：`test`、`build`、`prose-audit`，皆 `integration_id: 15368`
  - `required_status_checks.parameters.strict_required_status_checks_policy: true`
  - `bypass_actors`：兩個 entry，皆 `bypass_mode: "pull_request"`（不動）

**Failure modes**：

- 若 maintainer 沒跑 PUT 指令：本 repo 的 `Protect main` 仍維持舊形狀，spec 與 server-side 出現可被 audit surface 的差異。緩解：CONTRIBUTE.md Verify 段明示「升級後應看到 5 條 rule、其中含 `required_linear_history`」。
- 若 PUT 把 `strict_required_status_checks_policy` 寫錯回 `false`：spec Scenario「stale base 不可 merge」會在下次 audit 失敗。緩解：Verify 段預期輸出明寫應為 `True`。
- 若 GitHub API 改變 `allowed_merge_methods` 之合法值集合：CONTRIBUTE.md 範例會 stale。緩解：文件指向 GitHub REST docs `/en/rest/repos/rules`，spec 規範行為形狀、不規範 API 欄位細節。
- 若團隊在升級後一週內反饋「綠了又被打回」連鎖造成 PR throughput 不可接受：rollback 路徑是再跑一次 PUT 把 `strict_required_status_checks_policy` 改回 `false`、其他兩條設定保留（屬於 partial rollback）。

**Acceptance criteria**：

- `grep -c '^### Requirement:' openspec/specs/ci-quality-gates/spec.md` 維持 13（MODIFY 第 12 條、不增不減；canonical 已含 prose-audit-phase-1 archive 加入的第 13 條）。
- `grep -c '"context": *"prose-audit"' CONTRIBUTE.md` ≥ 2（POST + PUT payload 各一處）。
- `grep -c '^### Requirement:' openspec/specs/contributor-guide/spec.md` 維持 6（不動）。
- `grep -c '^#### Scenario:' openspec/changes/wxl-ruleset-strict-hardening/specs/ci-quality-gates/spec.md` 為 8（原 5 + 新 3）。
- `grep -c '"type": *"required_linear_history"' CONTRIBUTE.md` ≥ 2（POST + PUT 各一）。
- `grep -c '"allowed_merge_methods"' CONTRIBUTE.md` ≥ 3（POST + PUT + Optional multi-reviewer 範例各一）。
- `grep -c '"strict_required_status_checks_policy": *true' CONTRIBUTE.md` ≥ 2。
- `grep -c '"strict_required_status_checks_policy": *false' CONTRIBUTE.md` 為 0。
- `spectra validate wxl-ruleset-strict-hardening --strict` exit 0。
- `spectra analyze wxl-ruleset-strict-hardening --json` 0 Critical / 0 Warning。
- `python3 -c "t=open('CONTRIBUTE.md').read(); assert t.count('\`\`\`')%2==0; print('ok')"` 印 ok。
- `grep -ci 'sister\|netsim' openspec/changes/wxl-ruleset-strict-hardening/specs/` 為 0（spec delta 不得有 sister framing）。

**Scope 邊界**：

- In scope：MODIFY `ci-quality-gates` 第 12 條 Requirement、更新 `CONTRIBUTE.md`「Maintainer Setup → Branch protection ruleset」段落（含三條新 hardening 之 POST／PUT／Notes／Verify 同步）。
- Out of scope：實際在 GitHub 上跑 PUT 升級 ruleset（maintainer 手動操作）；`staging` branch ruleset；新 required status check；Node matrix；`contributor-guide` spec 文字；前一個 change 已決定之 `bypass_actors`／`integration_id` 等設定。

## Risks / Trade-offs

- **「綠了又被打回」連鎖（`strict_required_status_checks_policy: true` 之主副作用）**：burst 期 PR throughput 受影響，預估每次 base merge 後其他 in-flight PR 多 5-10 分鐘等待。 → 緩解：升級後一週密切觀察 PR throughput；若不可接受採 partial rollback（把此單一 flag 改回 `false`，留其他兩條）。
- **線性 history 政策切換之 onboarding 成本**：未來 contributor 從 use-template 衍生時，預設拿到的就是「不能 merge commit」之 ruleset；如其專案文化偏好 merge commit、會在第一次 merge button 灰掉時意外。 → 緩解：CONTRIBUTE.md Notes 段明說此設定可個別停用之方式；衍生 repo maintainer 可選擇 opt out。
- **spec 與 server-side 短暫不同步**：本 change merge 到 maintainer 跑 PUT 之間，spec 描述新形狀但 server 還是舊。 → 緩解：PR description 明示「merge 後請立刻跑 PUT 指令」；CONTRIBUTE.md Verify 段補新形狀的驗證關鍵字。
- **衍生 repo 沒升級**：use-template 衍生 repo 可能停留在舊 ruleset 形狀。 → 接受。template 本來就無法強迫衍生 repo 套規範。
- **三條紅燈一起合、副作用 attribution 困難**：若升級後一週發生 PR 流程問題，難立刻辨認是哪一條造成（特別是「綠了又被打回」可能其實是 maintainer 同時點到 merge button 被拒之 friction）。 → 緩解：Verify 段預期輸出明列三條設定值；如有問題可逐條 toggle `false` 驗證。Open Question 4.2 預留分批合入選項。

## Migration Plan

- **本 repo（`BrowserLaboratory/wxl-template`）**：本 change PR merge 後，maintainer 依 `CONTRIBUTE.md` 升級段落跑 `gh api -X PUT /repos/BrowserLaboratory/wxl-template/rulesets/16637478 ...`；跑完用 `gh api -X GET .../rulesets/16637478 | python3 ...` 驗證 5 條 rule 都在、`allowed_merge_methods` 為 `["squash","rebase"]`、`strict_required_status_checks_policy` 為 `true`。
- **觀察期**：升級後 1 週密切觀察 PR throughput 與 maintainer 體感 friction。如有顯著問題（特別是 burst 期 PR queue 卡住），執行 partial rollback。
- **回滾**：
  - **Partial rollback**：再跑一次 PUT 把 `strict_required_status_checks_policy` 改回 `false`、保留前兩條 hardening。spec 需另開 change 反映（part of incremental adjustment、非緊急回滾）。
  - **Full rollback**：再跑一次 PUT 移除 `required_linear_history`／`allowed_merge_methods`／改 `strict: false`，回到 `align-ruleset-with-netsim` 後之 baseline。spec 需另開 change 反映。
  - **Nuclear**：完全刪 ruleset 用 `gh ruleset delete 16637478` 回到「無 ruleset 保護」狀態。不推薦。
- **衍生 repo**：use-template 衍生時繼承新版 `CONTRIBUTE.md` 與 spec；衍生 repo 的 maintainer 視自己有無既有 ruleset 選 POST 或 PUT 路徑。多人協作衍生 repo 應特別評估 `strict_required_status_checks_policy: true` 對其 PR throughput 影響、並評估是否要 opt out。

## Open Questions

- **Open Question 4.1：是否要先在 staging branch 試一週後再 promote 三條紅燈到 main？**
  - **論點 A（直接 main）**：staging branch 尚未啟用，要啟用 staging 本身就需要另一個 change；先啟 staging 再用 staging 試三條紅燈，總路徑長、ROI 不高。三條紅燈之副作用（特別是「綠了又被打回」）只有在「base 有變動」之 PR 上才會發生，staging 變動頻率比 main 低、staging 試一週也未必觀察到副作用。
  - **論點 B（staging 先試）**：staging 流量低、即使三條一起出問題影響範圍小、滾回容易。staging 試一週後再 promote 到 main 是穩健做法。
  - **決議方式**：留待本 change PR review 期間於 PR comment 決議；目前 baseline 採論點 A（直接 main）。如決議改採 B，本 change 需 park 直到 staging branch 啟用之 change 完成。
  - **已決議（2026-05-28）：採論點 A（直接合入 main，不走 staging）。** staging 尚未啟用、ROI 不高。
- **Open Question 4.2：是否要分批合入三條紅燈（例如先合 `required_linear_history` + `allowed_merge_methods`、觀察一週後再合 `strict_required_status_checks_policy`）？**
  - **論點 A（三條同合）**：三條都是 main hardening、語意 group 一致；同 PUT 升級 ruleset 減少 spec／server 不同步 surface；副作用 attribution 在 Verify 段預期輸出已可逐條驗證、不需分批就能辨認問題來源。
  - **論點 B（分批）**：副作用最大的是 `strict_required_status_checks_policy: true`（「綠了又被打回」），與前兩條 hardening 之副作用屬性不同（前兩條是 UI／git policy 議題、後一條是 PR throughput 議題）；分批可隔離觀察。
  - **決議方式**：留待本 change PR review 期間於 PR comment 決議；目前 baseline 採論點 A（三條同合）。如決議改採 B，本 change 須拆為兩 change（例如 `wxl-ruleset-strict-hardening-history-policy`+`wxl-ruleset-strict-hardening-strict-checks`）。
  - **已決議（2026-05-28）：採論點 A（三條同時合入，不分批）。** 同一語意 group、一次 PUT 升級，副作用可由 Verify 段逐條驗證。
- **Open Question 4.3：CONTRIBUTE.md 是否要明寫「衍生 repo 可如何 opt out 三條中的個別 hardening」之選用替換片段？**
  - **論點 A（寫**）**：本 change Notes 段已說明三條之副作用、衍生 repo maintainer 有自主決定權；提供 opt-out 範例可降低衍生 repo 採用阻力。
  - **論點 B（不寫）**：opt-out 範例會讓文件膨脹；本 change 之 baseline 是「三條都採用」，opt-out 屬於 advanced 用法、可由衍生 repo maintainer 自行查 GitHub docs。
  - **決議方式**：留待本 change PR review 期間決議；目前 baseline 採論點 B（不寫 opt-out 範例）。
  - **已決議（2026-05-28）：採論點 B（不寫 opt-out 範例）。** Notes 段 `strict` bullet 已附帶「可單獨 revert 此 flag」說明，足以指引衍生 repo，無須完整 opt-out 片段。
