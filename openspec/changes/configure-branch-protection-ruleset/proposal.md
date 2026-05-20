## Why

`harden-ci-workflows` 已落地 `ci-quality-gates` 的 11 條 Requirement，把兩個 workflow（`quality-gates.yml`、`release.yml`）的安全 hardening 鎖死在 repo 檔案內。但 hardening 只完成「程式碼層」，GitHub 端的 ruleset 仍未設定：

- 任何具 write 權限的 maintainer 都可以 `git push origin main` 直接推 main，繞過 PR review 與 `test`／`build` 的 CI gate。
- `quality-gates` workflow 即使有 `test`／`build` 兩個 job 跑出綠燈，沒有 ruleset 把它們列為 required status checks，紅燈狀態仍可被人手動 merge。
- `use-template` 衍生 repo 不會繼承 GitHub server side 的 ruleset 設定（ruleset 不在 git tree 內），導致每個衍生 repo 的 maintainer 都必須自己重做一次。沒有 `CONTRIBUTE.md` 文件化的指令，這層保護就只是「口頭傳承」。

此外 2026-05-20 archive `harden-ci-workflows` 時偶然發現，Claude Code 本機 permission rule **已單機擋住** Claude agent 對 main 的直接 push（archive commit 觸發），但這是個別 client 的設定，不是 server side 規範，對人類 maintainer 與其他 client 完全不適用。

現在是補上 server side ruleset 的時機：`test`／`build` job ID 已由 spec 凍結（`harden-ci-workflows` 不動 job 結構就是為了維持綁定面），required checks 設定有穩定錨點；hardening 黃金期（v1.0.0-rc.1 → v1.0.0）尚未結束。

## What Changes

- **Spec `ci-quality-gates` 新增 1 條 Requirement**：明文宣告 `main` branch 必須由 GitHub branch protection ruleset 保護，requied status checks 必須包含 `test` 與 `build` 兩個 job，禁止直推 main、禁止 PR 在 red CI 狀態下 merge。明示這條規範只描述「ruleset 應該存在的形狀」，實際設定由 maintainer 在 repo settings 端操作（無法 commit 進 repo）。
- **Spec `contributor-guide` 新增 1 條 Requirement**：明文宣告 `CONTRIBUTE.md` 必須包含「Maintainer Setup」段落，內含 ruleset 重現指令（`gh ruleset create` 或 `gh api -X POST /repos/.../rulesets`）與設定後驗證指令，讓 use-template 衍生 repo 的 maintainer 能照樣設、不必逆向工程。
- **`CONTRIBUTE.md` 新增「Maintainer Setup → Branch protection ruleset」段落**：放在現有「Reporting issues」之後（top-level section），內容包括：(a) 為什麼要設 ruleset、(b) `gh ruleset create` 一鍵指令、(c) `gh ruleset list` / `gh ruleset view` 的驗證指令、(d) 對應 `ci-quality-gates` spec 哪一條 Requirement 的指引。
- **不在本 change 端實際設 ruleset**：實際 `gh ruleset create` 由 maintainer（user）在 PR merged 之後依 `CONTRIBUTE.md` 指令在 GitHub settings 設定。本 change 只負責「規範該設」與「文件化重現指令」，不嘗試 commit ruleset 設定本身。

## Non-Goals (optional)

- **不嘗試把 ruleset 設定 commit 進 repo**：GitHub ruleset 是 server side state，無對應 `.github/` 檔案可承載。即使有人提出用 `repository-rules.yml` 之類非官方方案，本 change 拒絕——增加實作複雜度、且無 GitHub 官方支援、衍生 repo 還是要手動匯入。
- **不引入自動化驗證 ruleset 是否設好的 CI**：例如 quality-gates workflow 加一步「query GitHub API 確認 ruleset 存在」，會：(a) 需要額外 token 權限、(b) 在 use-template 衍生 repo 上每個 PR 都失敗、(c) 與 hardening spec「permissions minimal」原則衝突。改為由 maintainer 在 setup 時人工驗證。
- **不引入新 required check**：本 change 只把 spec `ci-quality-gates` 既有的 `test`／`build` job 列為 required，不引入 lighthouse、prose-audit、site-smoke 等其他 check（這些屬於各自獨立 change 的範圍）。
- **不修改 `staging` branch ruleset**：目前遠端只有 `main`，`staging` branch 由 `contributor-guide` 描述但尚未啟用；待 `staging` 實際建立後再另開 change 處理其保護。
- **不改 PR review approval 數量規定**：approval 數量是 maintainer 偏好（單人 repo vs 多人 repo），spec 不硬性規定，文件僅以註解形式列出 1-approval 為建議值。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `ci-quality-gates`：新增 1 條 Requirement 宣告 `main` ruleset 應將 `test`／`build` 列為 required status checks 並禁止直推。
- `contributor-guide`：新增 1 條 Requirement 宣告 `CONTRIBUTE.md` 必須有「Maintainer Setup」段落含 ruleset 重現指令。

## Impact

- Affected specs: `ci-quality-gates`、`contributor-guide`（皆為 delta-only ADDED Requirements，無 MODIFIED／REMOVED／RENAMED）
- Affected code:
  - Modified:
    - `CONTRIBUTE.md`
    - `openspec/specs/ci-quality-gates/spec.md`
    - `openspec/specs/contributor-guide/spec.md`
  - New: （無）
  - Removed: （無）
- 操作面影響：本 change PR merge 後，maintainer（user）需在 `https://github.com/BrowserLaboratory/wxl-template/settings/rules/new` 或 `gh ruleset create` 依 `CONTRIBUTE.md` 新章節指令實際建立 ruleset；spec 規範本身不會自動觸發 ruleset 生效。
- 對 use-template 衍生 repo：spec 與 `CONTRIBUTE.md` 都會被繼承，每個衍生 repo 的 maintainer 可依文件設自己的 ruleset；spec 的「應該存在」描述使衍生 repo 即使不照做也能在 audit 時被 surface。
