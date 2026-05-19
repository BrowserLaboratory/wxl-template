## Why

教師（出題者）目前在 commit 前沒有自動檢查機制，frontmatter 錯誤或資料夾結構不符只有在 CI release workflow 才會被發現，為時已晚。需要一個 pre-commit hook，在 `git commit` 時自動對被變更的 challenge 執行 `challenge:validate` 與 `challenge:analyze`，在本地端即時擋下不合規的提交。

## What Changes

- 新增 `simple-git-hooks` 與 `lint-staged` 為 devDependency
- 在 `package.json` 中設定 pre-commit hook 與 lint-staged 規則
- 新增一支 `scripts/challenge-lint-staged.ts` 腳本，接收 lint-staged 傳入的已暫存檔案路徑，反推受影響的 challenge slug，對其逐一執行 validate + analyze
- analyze 若偵測到 warnings 時以非零 exit code 結束，阻擋 commit
- 在 `package.json` 的 `scripts` 中新增 `prepare` script 以在 `pnpm install` 後自動啟用 git hooks
- **[P1 修復]** 將 pre-commit hook 從直接使用 `lint-staged` 改為自訂 shell script，先用 `git stash --keep-index` 暫存非 staged 的變更，在 staged-only 狀態下執行驗證，完成後還原 stash，確保驗證的是即將 commit 的內容而非 working tree
- **[P1 修復]** 在 `simple-git-hooks` 的 pre-commit 設定中改為執行自訂 script `scripts/pre-commit.sh`，該 script 先透過 `git diff --cached --name-only --diff-filter=ACMRD` 取得所有暫存檔案（含刪除），再呼叫 `challenge-lint-staged.ts`，確保刪除檔案也會觸發受影響 challenge 的驗證

## Non-Goals

- 不改動既有的 `challenge-validate.ts` 或 `challenge-analyze.ts` 核心邏輯
- 不在 pre-commit hook 中執行 `challenge:keygen`（耗時且需要 WASM build）
- 不攔截非 challenge 相關檔案的 commit（只處理 `docs/challenge/` 下的變更）

## Capabilities

### New Capabilities

- `challenge-precommit-hook`: 定義 pre-commit 階段的 challenge 驗證行為——接收暫存檔案列表、推導受影響的 slug、執行 validate 與 analyze、依結果決定是否阻擋 commit

### Modified Capabilities

（無）

## Impact

- 新增檔案：`scripts/challenge-lint-staged.ts`、`scripts/pre-commit.sh`
- 修改檔案：`package.json`（scripts、devDependencies、simple-git-hooks 設定；移除 lint-staged 設定）
- 修改檔案：`tests/challenge-lint-staged.test.ts`（新增 staged snapshot 驗證相關測試）
- 新增 devDependency：`simple-git-hooks`
- 移除 devDependency：`lint-staged`（改用自訂 pre-commit script 取代）
