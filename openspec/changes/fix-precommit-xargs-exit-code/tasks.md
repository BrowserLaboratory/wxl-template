## 1. 修復 hook script 使「Pre-commit hook exit code SHALL be cross-platform stable」成立

- [x] 1.1 在 `scripts/pre-commit.sh` 之 validation pipeline 改寫——把 `echo "$CHALLENGE_FILES" | xargs node --experimental-strip-types scripts/challenge-lint-staged.ts || VALIDATION_EXIT=$?` 替換為以 `mapfile -t FILES <<< "$CHALLENGE_FILES"` 將 newline-separated 列表轉成 array，再以 `node --experimental-strip-types scripts/challenge-lint-staged.ts "${FILES[@]}" || VALIDATION_EXIT=$?` 直接呼叫 node 腳本——讓 node 之 exit code 不經 xargs 翻譯直接被 `$?` 捕捉。可觀察行為：`scripts/pre-commit.sh` 在 macOS BSD 與 Linux GNU 兩平台之 `$?` 皆與 `challenge-lint-staged.ts` 之 native exit code 相同。驗證：`grep -n "xargs" scripts/pre-commit.sh` 必須無命中；`grep -n "mapfile" scripts/pre-commit.sh` 至少一條命中。

## 2. 驗證 vitest 測試在兩平台皆 PASS

- [x] 2.1 在本地 Node 22.22.3 (macOS BSD userland) 跑 `pnpm test --run tests/pre-commit-sh.test.ts`——可觀察行為：4 條原本失敗測試（`tests/pre-commit-sh.test.ts` line 138 / 146 / 176 / 192，皆斷言 `result.exitCode === 1`）轉綠；該 test file 全 N 條測試 PASS。驗證：terminal 輸出 `Test Files  1 passed (1)`、`Tests  N passed (N)`、`Duration` 與 exit 0。
- [ ] 2.2 把 fix push 至 `feature/ci-quality-gates`（或本 change 之 fix branch）後，GitHub Actions `ubuntu-latest` runner 上跑 `pnpm test --run`——可觀察行為：`Quality Gates / test` job 由紅轉綠，4 條失敗測試在 Linux GNU userland 上也通過、684/684 全綠。驗證：`gh pr checks <pr-number>` 顯示 `test` 與 `build` 兩 check 皆 `pass`；或 PR Actions 頁面該 run 之 conclusion 為 `success`。

## 3. 行為回歸測試

- [x] 3.1 在本地 staged 一個故意壞掉的 challenge（例如刪掉 `flag.txt`），跑 `bash scripts/pre-commit.sh`——可觀察行為：hook 印出 validation error 至 stderr、退出 1、stash pop 正常還原 `docs/` 之 unstaged 變更與 untracked file。落實「Pre-commit hook exit code SHALL be cross-platform stable」之 `Validation failure on macOS exits 1` scenario。驗證：`echo $?` 顯示 1；`git stash list` 不殘留 hook 留下之 stash entry。
- [x] 3.2 在本地 staged 一個合法的 challenge（所有必要檔案齊全），跑 `bash scripts/pre-commit.sh`——可觀察行為：hook 安靜結束、退出 0、stash pop 正常還原。落實 `Validation success on either platform exits 0` scenario。驗證：`echo $?` 顯示 0；validation 階段無 stderr 輸出。
