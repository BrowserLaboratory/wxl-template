## Problem

`tests/pre-commit-sh.test.ts` 之 4 條 vitest 測試（line 138 / 146 / 176 / 192）斷言 `scripts/pre-commit.sh` 在 challenge validation 失敗時退出 1，但在 Ubuntu CI runner（GitHub Actions ubuntu-latest）上實際拿到退出碼 123，造成 `Quality Gates / test` job 紅燈。本地 macOS 跑 `pnpm test --run` 完全 PASS（684/684），所以該 bug 直到新落地的 `ci-quality-gates` PR-time gate 第一次在 Linux 跑，才被攔下並公開。

`challenge-precommit-hook` spec §63 / §68 / §120 明確規範 hook 違反 validation 時退出 1；現行實作只在 BSD xargs 平台符合 spec，GNU xargs 平台違反 spec。

## Root Cause

`scripts/pre-commit.sh:34` 以 `xargs` 包裹 node 腳本：

```
echo "$CHALLENGE_FILES" | xargs node --experimental-strip-types scripts/challenge-lint-staged.ts || VALIDATION_EXIT=$?
```

當 `challenge-lint-staged.ts` 退出 1（spec-mandated validation failure）：

- **BSD xargs（macOS）**：透傳 child exit code → `VALIDATION_EXIT=1` → 符合 spec。
- **GNU xargs（Linux / CI runner）**：把 child exit 1–125 一律翻譯成 123，並在 stderr 印「exited with status 123」之提示 → `VALIDATION_EXIT=123` → 違反 spec。

GNU xargs 之 123 行為是 POSIX 規範之外的擴張，在文件中亦有明示；無 flag 可關閉。

## Proposed Solution

修改 `scripts/pre-commit.sh`，把退出碼決議方式從「依賴 xargs 透傳」改為「捕捉 node 腳本之原生退出碼」，並對 GNU xargs 之 123–125 範圍做明確規範化處理（normalize 為 1）。具體做法：

1. 改寫 line 33–34 之 pipeline，去掉 xargs，改用 bash 之 `mapfile -t FILES <<< "$CHALLENGE_FILES"` 將 newline-separated 列表轉成 array，再以 `"${FILES[@]}"` 形式一次性傳給 `challenge-lint-staged.ts`。node 腳本之退出碼直接被 `$?` 捕捉，無 xargs 翻譯。
2. 保留現行 stash-pop 流程與 set -euo pipefail 語意；確保 staged-snapshot 行為不變。
3. 在 `challenge-precommit-hook` spec 新增 cross-platform Requirement，明確規範 hook exit code 在 BSD xargs 與 GNU xargs 平台都 SHALL 為 1（validation 失敗）/ 0（validation 通過），把退出碼 cross-platform 規範化升級為 spec contract。

## Non-Goals

- 不修改 `scripts/challenge-lint-staged.ts`：node 腳本維持 validation logic 之 source of truth，本 change 只處理 shell-level pipeline 之退出碼傳遞。
- 不修改 `tests/pre-commit-sh.test.ts`：4 條失敗測試之斷言（`exitCode === 1`）符合 spec，應修 impl 讓測試轉綠，不該動測試遷就壞 impl。
- 不導入「BSD-xargs polyfill」或「GNU-xargs flag detection」之相容性 shim：直接去掉 xargs 依賴比偵測平台 + 條件分支簡單且更穩。
- 不修改 `simple-git-hooks` 註冊機制（`package.json` 之 `simple-git-hooks.pre-commit`）：hook 仍指向 `bash scripts/pre-commit.sh`，無改動。
- 不修改 `docs/challenge/**` 之 lint rule 或 frontmatter schema：本 change 之 scope 僅限 hook script 之退出碼正確性。

## Success Criteria

- 修改後 `scripts/pre-commit.sh` 在 Linux Ubuntu (GNU xargs / GNU bash) 與 macOS (BSD xargs / GNU bash 5+ via Homebrew) 兩個平台跑 `tests/pre-commit-sh.test.ts` 全 4 條失敗測試皆 PASS（exit code = 1）。
- `pnpm test --run` 在 Node 22.22.3 (本地 macOS) 與 ubuntu-latest CI runner 兩平台皆顯示 684/684 PASS（含先前 4 條失敗已恢復）。
- 重開或重 push `feature/ci-quality-gates` 之 PR #1 至 GitHub，`Quality Gates / test` 與 `Quality Gates / build` 兩個 check 皆綠燈。
- pre-commit hook 在本地實際 commit 時行為不變：staged challenge files 改動 → 觸發 lint → validation 失敗 → commit 被擋下、stash pop 還原；validation 通過 → commit 進行、stash pop 還原。

## Impact

- Affected specs: `challenge-precommit-hook`（modified：新增 1 條 cross-platform exit code Requirement）
- Affected code:
  - Modified: `scripts/pre-commit.sh`
  - New: (none)
  - Removed: (none)
- Affected tests: `tests/pre-commit-sh.test.ts`（不修改測試 — 修 impl 讓既有 4 條失敗轉綠）
- 不影響範圍：`scripts/challenge-lint-staged.ts` 內部邏輯（仍由它決定 exit 1 / 0）、`simple-git-hooks` 註冊機制、`docs/challenge/**` 之 lint rule。
