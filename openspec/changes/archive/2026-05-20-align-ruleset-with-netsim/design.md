## Context

PR #6 merge 之後 maintainer 在實機建立 ruleset 時，把 sister repo `BrowserLaboratory/netsim-template` 的 `main-required-ci-gates` 拉出來比對，發現本 repo `Protect main` (id `16637478`) 缺多條 sister repo 已具備的 hardening：

| 設定 | netsim `main-required-ci-gates` | wxl `Protect main`（本 change 前） |
| --- | --- | --- |
| ref include | `~DEFAULT_BRANCH` | `refs/heads/main`（寫死） |
| rules | 5 rules（含 deletion／non_fast_forward／required_linear_history／pull_request 細項／required_status_checks 細項） | 2 rules（bare pull_request + required_status_checks）|
| pull_request 細項 | `dismiss_stale_reviews_on_push=true`、`required_review_thread_resolution=true`、`allowed_merge_methods=["squash","rebase"]` | 全 default |
| required_status_checks `integration_id` | `15368`（鎖 GitHub Actions） | 缺（任何 App 可報） |
| `strict_required_status_checks_policy` | `true` | `false` |
| `bypass_actors` | `RepositoryRole(5)`、`bypass_mode=pull_request` | `OrganizationAdmin` + `RepositoryRole(5)`、皆 `bypass_mode=always` |

關鍵限制：

- 本 change 不修改 `staging` branch 保護（`staging` 尚未啟用）。
- 本 change 不引入新 required check（lighthouse／prose-audit／site-smoke 仍由各自獨立 change 處理）。
- 本 change 不引入 Node matrix（被 `AUDIT.md §A.2.1` Node 24 相容性技術債阻擋）。
- 本 change 不負責實際 PUT ruleset；和 `configure-branch-protection-ruleset` 同樣分工模式：spec 規範形狀、`CONTRIBUTE.md` 提供重現指令、maintainer 在 settings 端執行。

## Goals / Non-Goals

**Goals:**

- 把可以「補了沒副作用」的 4 條設定（`deletion`／`non_fast_forward`／`integration_id=15368`／`~DEFAULT_BRANCH`）對齊到 sister repo 水準。
- 把「有 trade-off 但 net positive」的 3 條設定（`bypass_mode=pull_request`／`dismiss_stale_reviews_on_push=true`／`required_review_thread_resolution=true`）一併補齊。
- 糾正原 Requirement 把 `RepositoryAdmin` 當合法 `actor_type` 的錯誤命名（GitHub API 實際只認 `RepositoryRole` + `actor_id`）。
- `CONTRIBUTE.md` 範例 payload 同步升級，包含「初次建立 ruleset 的 POST 指令」與「升級既有 ruleset 的 PUT 指令」雙重路徑，讓 use-template 衍生 repo 既有 ruleset 的 maintainer 也能跟著升級。
- 衍生 repo maintainer 拿到 template 後，依 `CONTRIBUTE.md` 升級指令在 5 分鐘內把 ruleset 同步到新形狀。

**Non-Goals:**

- 不引入 `required_linear_history`（影響 git history 結構，需團隊政策共識）。
- 不引入 `allowed_merge_methods: ["squash", "rebase"]`（同上，限制 merge 方式為政策層議題）。
- 不開 `strict_required_status_checks_policy=true`（sister repo 已開，但其 CI 是 Node 22/24 matrix、成本高；wxl 只有 `test`／`build` 兩個 check，要每次 rebase 多走一輪 CI 的痛感雖小、但解決的問題（base drift）也小，等補完 Node matrix 後再評估）。
- 不引入新 required check（如 lighthouse、prose-audit、site-smoke）。
- 不引入「驗證 ruleset 設定符合 spec 的 CI 步驟」（同 `configure-branch-protection-ruleset` 立場：需額外 token 權限、衍生 repo 失敗）。
- 不更動 `contributor-guide` 第 6 條 Requirement（措辭夠通用，文件升級不違反 Requirement）。

## Decisions

### 補 `deletion` rule（禁刪 `main`）

ruleset `rules` array 加入 `{ "type": "deletion" }`。

**理由**：sister repo 已有；補上之後 admin（甚至 organization owner）都無法不小心或惡意 `git push --delete origin main` 把主分支刪掉。即便 `bypass_actors` 允許 admin bypass，這條 rule 仍會讓刪除動作走顯式 bypass 流程（在 audit log 留痕）。零副作用。

**替代方案**：不補——拒絕。漏這條等於把「最災難的單一操作」開放給每個 admin 不假思索就能做。

### 補 `non_fast_forward` rule（禁 force-push `main`）

ruleset `rules` array 加入 `{ "type": "non_fast_forward" }`。

**理由**：sister repo 已有；補上之後 admin 也不能對 `main` 做 `git push --force`／`git push --force-with-lease`，避免「不小心 rebase 後覆寫遠端 history」這類災難。零副作用。

**替代方案**：不補——拒絕。force-push 的破壞性與「刪除」等級，沒理由保留。

### `required_status_checks` 鎖 `integration_id=15368`（GitHub Actions App）

`required_status_checks` array 每個 entry 加 `"integration_id": 15368`。

**理由**：GitHub Actions 報 check 的 App ID 固定為 `15368`。不鎖時，任何能裝在 repo 上的 GitHub App（具備 `Checks: write` 權限）都可發名為 `test`／`build` 的 success conclusion，繞過 CI gate；鎖了之後只有 GitHub Actions 報的 `test`／`build` 才算數。本 repo 目前沒裝其他 App，這條是縱深防禦。

**替代方案**：不鎖——拒絕。縱深防禦無理由跳過；spec 已要求「`test`／`build` 為 `quality-gates.yml` 內的 job」，鎖 integration_id 才是把 spec 意圖完整反映到 ruleset。

### `conditions.ref_name.include` 改用 `~DEFAULT_BRANCH`

ruleset `conditions.ref_name.include` 由 `["refs/heads/main"]` 改為 `["~DEFAULT_BRANCH"]`。

**理由**：GitHub 提供 `~DEFAULT_BRANCH` 動態變數，會跟隨 repo settings 內 default branch 設定。優點：(1) 衍生 repo 把 default branch 改名（例如 `master`、`trunk`）時 ruleset 不需重設；(2) 萬一未來 wxl 自己改 default branch（少見但有可能），ruleset 不會孤兒。sister repo 已採用。零副作用。

**替代方案**：保留 `refs/heads/main` 寫死——拒絕。沒有必須寫死的理由；spec Scenario 內仍可正常描述「main」是 default branch。

### `bypass_mode` 從 `always` 收緊到 `pull_request`

`bypass_actors` 每個 entry 由 `"bypass_mode": "always"` 改為 `"bypass_mode": "pull_request"`。

**理由**：`always` 允許 admin 任意繞過 ruleset（直推 main、不等 check、不開 PR）；`pull_request` 仍允許 admin 緊急時 self-merge 沒等 CI 跑綠的 PR（透過 GitHub 的 "Merge without waiting for requirements to be met" 按鈕），但**禁止直推 `main` 而不開 PR**。差別在：

- `always`：admin oncall 時可 `git push origin main` 一條指令解決，但失去任何 PR record、reviewer 看不到 context、history 也不會有 merge commit 描述。
- `pull_request`：admin 必須開 PR、寫描述、再用 "bypass" 按鈕 merge；多花 30 秒、但留下完整 audit trail。

sister repo 已用此模式。對 solo maintainer 影響極小（多 30 秒），對 audit／onboarding／衍生 repo maintainer 有顯著保護。

**替代方案 A**：維持 `always`——拒絕。前面 `configure-branch-protection-ruleset` 用此設定是因為「先讓 ruleset 立起來」、深度沒走完，並非有意保留直推 main 的能力。

**替代方案 B**：完全禁 bypass（移除 admin from `bypass_actors`）——拒絕。solo maintainer 必須有緊急 fix 路徑；`pull_request` mode 已經是最嚴格的「保留 fix 能力又留 audit trail」設計。

### `bypass_actors` 改用合法 `actor_type`／`actor_id` 組合

`bypass_actors` 改為：

```
[
  { "actor_type": "OrganizationAdmin", "actor_id": 1, "bypass_mode": "pull_request" },
  { "actor_type": "RepositoryRole",    "actor_id": 5, "bypass_mode": "pull_request" }
]
```

**理由**：GitHub API 合法 `actor_type` 列舉值為 `Integration`／`OrganizationAdmin`／`RepositoryRole`／`Team`／`DeployKey`；前一條 Requirement 寫的 `RepositoryAdmin` 並不合法（POST 會 422）。要表達「repo 管理員可 bypass」必須用 `RepositoryRole` + GitHub 內建 Admin role 的 `actor_id=5`。`OrganizationAdmin` 補上 `actor_id=1`（雖然 server 接受 null 並 normalize 為 null，但顯式寫出較清楚）。`RepositoryRole` `actor_id` 對照表為 1=Read／2=Triage／3=Write／4=Maintain／5=Admin（GitHub 內建 role）。

**替代方案**：在 Requirement 維持 `RepositoryAdmin` 文字、僅在 CONTRIBUTE.md 範例修正——拒絕。spec 應描述 server-truth；繼續用錯誤名稱會誤導後續 maintainer。

### `pull_request` rule 設 `dismiss_stale_reviews_on_push=true`、`required_review_thread_resolution=true`

`pull_request` rule parameters 設這兩個 flag 為 `true`，其餘維持 default（特別是 `required_approving_review_count` 仍為 0，沿用 solo-maintainer 友善設計）。

**理由**：

- `dismiss_stale_reviews_on_push=true`：當作者推新 commit 到 PR，原有 approve 自動 dismiss、要重新 review。對 solo 模式無影響（沒人 review）；對多人 team 防止「approve 之後偷塞 code 進去」的常見漏洞。
- `required_review_thread_resolution=true`：所有 review 留下的 conversation thread 必須解決才能 merge。對 solo 模式無影響（沒人開 thread）；對多人 team 防止「reviewer 提出問題但 PR 還是被 merge」。

兩個都是 solo-mode 零副作用、多人 mode net positive 的設定，沒有不開的理由。sister repo 已開。

**替代方案**：維持 default（不開）——拒絕。等到衍生 repo 變多人 team 才開太晚；先在 template 寫死預設值。

### 不引入 `required_linear_history`、`allowed_merge_methods`、`strict_required_status_checks_policy=true`

sister repo 開了這三條，本 change **不**對齊。

**理由（各條）**：

- `required_linear_history`：禁 merge commits，逼所有 PR 必須 squash 或 rebase merge。會改變 git history 樣貌（變線性、不再有 merge commit 顯示「來自哪條分支」），是「git history 政策」議題。本 change 限縮在「ruleset hardening」，不混入 git policy 變更。
- `allowed_merge_methods: ["squash", "rebase"]`：同上，是 merge 方式政策。GitHub default 是「全開」，要鎖需團隊共識。
- `strict_required_status_checks_policy=true`：要求 PR head 必須 rebase 到最新 base，base 改了之後 PR 要重跑 CI 才能 merge。sister repo 開了是因為 sister repo 的 CI matrix 大、避免 base drift 後 stale；wxl 只有 `test`／`build` 兩個 check、CI 跑得快、base drift 影響小。等 wxl 補完 Node matrix 後再評估。

**替代方案**：一併補齊——拒絕。三條都有 trade-off、需團隊共識、與「hardening 收尾」這個本 change goal 不直接相關。

### 提供「升級既有 ruleset」的 PUT 指令樣板

`CONTRIBUTE.md` 同時保留「初次建立」的 POST 指令與新增「升級既有」的 PUT 指令片段。

**理由**：本 change merge 後，本 repo 的 maintainer 不會「初次建立」（ruleset 已存在 id `16637478`），需要用 `gh api -X PUT /repos/.../rulesets/<id>` 升級。衍生 repo 的 maintainer 視情境會有兩條路徑：(a) 還沒建過 → 跑 POST（含新設定）；(b) 已建過舊版 → 跑 PUT 升級。文件兩者都提供。

**替代方案**：只更新 POST 範例——拒絕。本 repo 與衍生 repo 都會有「升級既有 ruleset」需求，少了 PUT 範例就要 maintainer 自行查 GitHub docs，違反「5 分鐘設好」的 design goal。

## Implementation Contract

**Observable behavior（apply 完成 + PR merge 後）**：

- `openspec/specs/ci-quality-gates/spec.md` 第 12 條 Requirement「Branch protection ruleset guards main with required status checks」之 main paragraph 與 Scenario 內容更新後反映：
  - 新規範包含 `deletion`／`non_fast_forward` 兩條 rule；
  - `required_status_checks` 必須鎖 `integration_id=15368`；
  - `pull_request` rule 必須含 `dismiss_stale_reviews_on_push=true`、`required_review_thread_resolution=true`；
  - `bypass_actors` 用合法 `actor_type`（`OrganizationAdmin` + `RepositoryRole` actor_id=5）、`bypass_mode=pull_request`；
  - `conditions.ref_name.include` 為 `~DEFAULT_BRANCH`（不是 `refs/heads/main` 寫死）。
- 第 12 條 Requirement 仍維持原 3 個 Scenario + 1 個 Example 結構，內容更新後對應上述 6 項變更（特別是「Direct push to main is rejected」與「Pull request to main cannot merge while a required check is failing」兩 Scenario 要納入新增 rules／pinning 的描述）；至少新增 1 個 Scenario 涵蓋「force-push／branch deletion 被 ruleset 拒絕」。
- `CONTRIBUTE.md` 「Maintainer Setup → Branch protection ruleset → Create the ruleset」code block 內 payload 完全替換為新版（含 6 項變更）。
- `CONTRIBUTE.md` 同段新增「Upgrade an existing ruleset」副段落，含 `gh api -X PUT /repos/{owner}/{repo}/rulesets/<id> ...` 指令範例（payload 形狀同 POST）。
- 本 change PR 自身 merge 後，maintainer 跑文件化 PUT 指令，把 `Protect main` (id `16637478`) 升級到新形狀。

**Interface / data shape（升級後 ruleset 應呈現）**：

- `gh api -X GET /repos/BrowserLaboratory/wxl-template/rulesets/16637478` 回傳應符合：
  - `enforcement: "active"`、`target: "branch"`
  - `conditions.ref_name.include: ["~DEFAULT_BRANCH"]`
  - `rules` 含 `deletion`、`non_fast_forward`、`pull_request`（with parameters as above）、`required_status_checks`（with `integration_id: 15368` on each check entry）共 4 條
  - `bypass_actors`：兩個 entry，皆 `bypass_mode: "pull_request"`，分別 `OrganizationAdmin` 與 `RepositoryRole(actor_id=5)`

**Failure modes**：

- 若 maintainer 沒跑 PUT 指令：本 repo 的 `Protect main` 仍維持舊形狀，spec 與 server-side 出現可被 audit surface 的差異。緩解：CONTRIBUTE.md 設定後驗證段落明示「升級後應看到 deletion 與 non_fast_forward 出現在 rules 列表」。
- 若 maintainer 升級時把 `bypass_mode` 寫錯回 `always`：spec Scenario「Direct push to main is rejected」會在下次 audit 失敗。緩解：scenario 文字明寫 admin 直推也應被擋。
- 若 GitHub 改變 ruleset API 形狀（增刪欄位、改 actor_id 編號）：CONTRIBUTE.md 範例會 stale。緩解：文件指向 GitHub REST docs `/en/rest/repos/rules`，spec 規範行為形狀、不規範 API 欄位細節，便於未來只更新文件而非 spec。

**Acceptance criteria**：

- `grep -c '^### Requirement:' openspec/specs/ci-quality-gates/spec.md` 維持 12（MODIFY、不增不減）。
- `grep -c '^### Requirement:' openspec/specs/contributor-guide/spec.md` 維持 6（不動）。
- `grep -c 'deletion' openspec/changes/align-ruleset-with-netsim/specs/ci-quality-gates/spec.md` ≥ 1。
- `grep -c 'non_fast_forward' openspec/changes/align-ruleset-with-netsim/specs/ci-quality-gates/spec.md` ≥ 1。
- `grep -c 'integration_id' CONTRIBUTE.md` ≥ 1（payload 內有鎖死）。
- `grep -c '~DEFAULT_BRANCH' CONTRIBUTE.md` ≥ 1。
- `grep -c 'bypass_mode.*pull_request' CONTRIBUTE.md` ≥ 1。
- `grep -c 'gh api -X PUT' CONTRIBUTE.md` ≥ 1（含升級指令範例）。
- `spectra validate align-ruleset-with-netsim` exit 0。
- `spectra analyze align-ruleset-with-netsim --json` 0 Critical / 0 Warning。
- `python3 -c "t=open('CONTRIBUTE.md').read(); assert t.count('\`\`\`')%2==0; print('ok')"` 印 ok。

**Scope 邊界**：

- In scope：MODIFY `ci-quality-gates` 第 12 條 Requirement、更新 `CONTRIBUTE.md`「Maintainer Setup → Branch protection ruleset」段落（含新增 PUT 升級子段落）。
- Out of scope：實際在 GitHub 上跑 PUT 升級 ruleset（maintainer 手動操作）；`staging` branch ruleset；`required_linear_history`／`allowed_merge_methods`／`strict_required_status_checks_policy`／Node matrix／新 required check；Claude Code 本機 permission rule；`contributor-guide` spec 文字。

## Risks / Trade-offs

- **多 30 秒的緊急路徑**：`bypass_mode=pull_request` 比 `always` 多開個 PR 流程，oncall fix 從「git push origin main」變成「開 PR + 自批 merge」。 → 緩解：實際成本約 30 秒；換到完整 audit trail，net positive。
- **spec 與 server-side 短暫不同步**：本 change merge 到 maintainer 跑 PUT 之間，spec 描述新形狀但 server 還是舊。 → 緩解：PR description 明示「merge 後請立刻跑 PUT 指令」；CONTRIBUTE.md「Verify the ruleset」段補新形狀的驗證關鍵字（看到 `deletion`／`non_fast_forward` 等於 server 已升級）。
- **衍生 repo 沒升級**：use-template 衍生 repo 可能停留在舊 ruleset 形狀。 → 接受。template 本來就無法強迫衍生 repo 套規範；spec 與文件存在即是最大努力。
- **`integration_id=15368` 假設**：未來 GitHub 改變 Actions App 的 integration_id 值。 → 緩解：CONTRIBUTE.md Notes 解釋 15368 來源；如要查證可用 `gh api /repos/{owner}/{repo}/actions/runs/<run-id> --jq '.workflow_run.app.id'`（取一個 quality-gates 跑過的 run）。
- **`~DEFAULT_BRANCH` 變數錯解**：衍生 repo 改 default branch 為非主流名稱（例如 `dev`）會自動套用 ruleset 到該 branch。 → 接受／視為功能。要避免就讓 default branch 維持 `main`。

## Migration Plan

- **本 repo（`BrowserLaboratory/wxl-template`）**：本 change PR merge 後，maintainer 依 `CONTRIBUTE.md` 升級段落跑 `gh api -X PUT /repos/BrowserLaboratory/wxl-template/rulesets/16637478 ...`；跑完用 `gh api -X GET .../rulesets/16637478` 驗證 4 條 rule 都在、`integration_id=15368` 都鎖到、`bypass_mode=pull_request` 等。
- **回滾**：若 PUT 後出狀況（例如 admin bypass 不如預期），可：(a) 再跑一次 PUT 把 `bypass_mode` 改回 `always`、(b) 完全刪 ruleset 用 `gh ruleset delete 16637478` 回到「無 ruleset 保護」狀態。spec 規範不需動。
- **衍生 repo**：use-template 衍生時繼承新版 `CONTRIBUTE.md` 與 spec；衍生 repo 的 maintainer 視自己有無既有 ruleset 選 POST 或 PUT 路徑。

## Open Questions

- **是否在本 change 同時驗證 `staging` ruleset 路徑？**：`staging` 尚未啟用，但 sister repo 的 `~DEFAULT_BRANCH` 套用方式對 `staging` 有「未來會自動套用嗎？」的疑問。答：`~DEFAULT_BRANCH` 只套用到 default branch，`staging` 不會被誤套用；若未來 `staging` 要保護需另開 change。本 question 在 design 階段確認、無需動 spec。
- **是否要在 CONTRIBUTE.md 加 `integration_id` 查詢方式的範例？**：考量到 derived repo 可能不確定自家的 GitHub Actions App ID（理論上都是 15368 常數，但 GHES 環境可能不同）。答：本 change 文件假設 `15368` 為常數（GitHub.com 永遠固定），GHES 環境的衍生使用屬於 out-of-scope；如未來有 GHES 用戶反映，再另開 change 補充。
