## 1. 安裝依賴與 Pre-commit hook registration

- [x] 1.1 安裝 `simple-git-hooks` 和 `lint-staged` 為 devDependency（`pnpm add -D simple-git-hooks lint-staged`）
- [x] 1.2 在 `package.json` 中新增 `"prepare": "simple-git-hooks"` script，確保 `pnpm install` 後自動註冊 git hooks
- [x] 1.3 完成 pre-commit hook registration：在 `package.json` 中新增 `simple-git-hooks` 設定區塊，將 `pre-commit` 指向 `npx lint-staged`
- [x] 1.4 在 `package.json` 中新增 `lint-staged` 設定區塊，匹配 `docs/challenge/**` 檔案並執行 `node --experimental-strip-types scripts/challenge-lint-staged.ts`

## 2. 核心腳本：Slug derivation from staged files 與 Validation execution per slug

- [x] 2.1 建立 `scripts/challenge-lint-staged.ts`，實作接收 lint-staged 傳入的檔案路徑列表（透過 `process.argv`），從路徑中推導受影響的 challenge slug（slug derivation from staged files）
- [x] 2.2 對每個推導出的 slug，import 並呼叫 `challenge-validate.ts` 的 `validateChallenge` 函式執行 validation execution per slug
- [x] 2.3 對每個推導出的 slug，import 並呼叫 `challenge-analyze.ts` 的 `analyzeChallenge` 函式，檢查 warnings
- [x] 2.4 實作 commit blocking on failure——任一 challenge 驗證失敗或 analyze 有 warnings 時 exit code 1，全部通過時 exit code 0
- [x] 2.5 在 stderr 印出清楚的錯誤與警告訊息，讓教師能快速定位問題

## 3. 測試（初始）

- [x] 3.1 新增 `tests/challenge-lint-staged.test.ts`，測試 slug derivation 邏輯（單一檔案、多檔案同 slug 去重、跨 slug、非 challenge 檔案、legacy flat file）
- [x] 3.2 執行 `pnpm test --run` 確認所有既有測試與新測試通過
- [x] 3.3 手動端對端驗證：stage 一個 challenge 檔案後執行 `git commit`，確認 hook 觸發且 validate + analyze 正確執行

## 4. P1 修復：Staged snapshot validation + Deleted file detection

- [x] 4.1 建立 `scripts/pre-commit.sh`：使用 `git diff --cached --name-only --diff-filter=ACMRD` 取得所有暫存檔案（含刪除），篩選 `docs/challenge/` 路徑，若無匹配則 exit 0；若有匹配則先 `git stash push --keep-index --quiet` 隱藏未暫存變更，執行 `node --experimental-strip-types scripts/challenge-lint-staged.ts` 並傳入篩選後的檔案列表，記錄 exit code，最後 `git stash pop --quiet` 還原，以記錄的 exit code 退出。若無未暫存變更（`git diff --quiet` 成功）則跳過 stash/pop
- [x] 4.2 更新 `package.json`：將 `simple-git-hooks.pre-commit` 從 `npx lint-staged` 改為 `bash scripts/pre-commit.sh`
- [x] 4.3 更新 `package.json`：移除 `lint-staged` 設定區塊（不再使用 lint-staged）
- [x] 4.4 移除 `lint-staged` devDependency（`pnpm remove lint-staged`）
- [x] 4.5 執行 `npx simple-git-hooks` 重新安裝 git hooks，確認 `.git/hooks/pre-commit` 已更新為新的 script

## 5. P1 修復測試

- [x] 5.1 新增 `tests/pre-commit-sh.test.ts`：測試 `pre-commit.sh` 的 staged file detection 邏輯——建立 temp git repo，stage 不同情境的檔案（含刪除），驗證 script 的 exit code
- [x] 5.2 執行 `pnpm test --run` 確認所有測試通過（包含既有 621 tests + 新測試）
- [ ] 5.3 手動端對端驗證 staged snapshot validation：stage 一個 challenge 的 `index.md` 但不 stage 其 `src/flag.txt`（檔案在 working tree 存在但未暫存），確認 commit 被擋下
- [ ] 5.4 手動端對端驗證 deleted file detection：`git rm docs/challenge/sqli-demo/src/flag.txt` 後 commit，確認 hook 偵測到刪除並擋下 commit，之後 `git checkout` 還原
