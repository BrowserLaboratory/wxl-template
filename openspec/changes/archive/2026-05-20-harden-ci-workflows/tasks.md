<!-- 每個 task 都要明示「完成時可觀察的行為／契約」與「如何驗證」；檔案路徑只是定位用，不是 task 本體。 -->

## 1. SHA 解析（apply 前置）

- [x] 1.1 [P] 依「SHA 來源策略：先抄 netsim、其餘 `gh api` 即時解析」決策，解析 `Swatinem/rust-cache` 最新 `v2.x.y` 對應的 40-char commit SHA，並把「tag、SHA、解析日期」三項寫入後續 commit 訊息的事實依據。verification：`gh api /repos/Swatinem/rust-cache/git/ref/tags/<tag>` 與 `git ls-remote https://github.com/Swatinem/rust-cache.git refs/tags/<tag>` 兩種方式回傳同一 commit SHA。
- [x] 1.2 [P] 依「SHA 來源策略」決策，解析 `softprops/action-gh-release` 最新 `v2.x.y` 對應的 40-char commit SHA。verification：同 1.1 的雙來源比對；若任一來源失敗，halt apply，不得 fallback 到 mutable tag。

## 2. quality-gates.yml hardening

- [x] 2.1 落實「Workflows declare minimal token permissions」於 `.github/workflows/quality-gates.yml`：在 `on:` block 之後、`jobs:` block 之前，依「Permissions 放 workflow level，job level 不 override」決策，加入 workflow-level `permissions: { contents: read }`，並確認 `test` 與 `build` 兩 job 內皆未 override。verification：`rg -n '^permissions:' .github/workflows/quality-gates.yml` 印出剛好 1 行；`rg -n '^\s+permissions:' .github/workflows/quality-gates.yml` 應無 match。
- [x] 2.2 落實「Third-party GitHub Actions pinned to commit SHAs」於 `.github/workflows/quality-gates.yml`：依「SHA 來源策略」與「註解格式統一：`uses: <owner>/<repo>@<40-char SHA> # <tag>`」決策，把 `test` 與 `build` 兩 job 共 6 行 `uses:` 全部改寫成該形式（涵蓋 `actions/checkout`、`dtolnay/rust-toolchain`、`Swatinem/rust-cache`、`jetli/wasm-pack-action`、`pnpm/action-setup`、`actions/setup-node`）。verification：`rg '@v[0-9]+(\.[0-9]+)*$' .github/workflows/quality-gates.yml` 無 match；每行 `uses:` 右側皆為 40-char 小寫 hex SHA + ` # ` + tag。
- [x] 2.3 落實「CI workflows install build toolchain at fixed versions」於 `.github/workflows/quality-gates.yml`：依「wasm-pack 版本選 `v0.14.0`（與 netsim 同步）」決策，於 `test` 與 `build` 兩 job 共 2 處 `jetli/wasm-pack-action` 步驟補 `with: { version: 'v0.14.0' }`，並附 inline 註解標註版本鎖定來源。verification：`rg -nA2 'jetli/wasm-pack-action' .github/workflows/quality-gates.yml` 每個出現點下方都有 `version: 'v0.14.0'`。

## 3. release.yml hardening

- [x] 3.1 落實「Workflows declare minimal token permissions」於 `.github/workflows/release.yml`：保留現有 workflow-level `permissions: { contents: write }`，並於該 block 緊接著加上一行 YAML 註解，指明 `softprops/action-gh-release` 為何需要 write（建立 GitHub Release 與上傳 `wxl-${tag}.zip` asset）。verification：`grep -B1 -A2 'permissions:' .github/workflows/release.yml` 顯示 `contents: write` + 註解，且 `release` job 內無 permissions override。
- [x] 3.2 落實「Third-party GitHub Actions pinned to commit SHAs」於 `.github/workflows/release.yml`：依「SHA 來源策略」與「註解格式統一」決策，把 `release` job 內共 7 行 `uses:` 全部改寫成 SHA + tag 註解（六個基礎 action 與 `softprops/action-gh-release`）。verification：`rg '@v[0-9]+(\.[0-9]+)*$' .github/workflows/release.yml` 無 match；每行 `uses:` 右側皆為 40-char hex SHA + ` # ` + tag。
- [x] 3.3 落實「CI workflows install build toolchain at fixed versions」於 `.github/workflows/release.yml`：依「wasm-pack 版本選 `v0.14.0`」決策，於 `release` job 內 `jetli/wasm-pack-action` 步驟補 `with: { version: 'v0.14.0' }`。verification：`rg -nA2 'jetli/wasm-pack-action' .github/workflows/release.yml` 出現點下方有 `version: 'v0.14.0'`，且字串與 quality-gates.yml 完全一致（jobs 間版本不漂移）。

## 4. Spec 落地

- [x] 4.1 依「Spec delta 用「純 ADDED」操作」決策，確認 `openspec/changes/harden-ci-workflows/specs/ci-quality-gates/spec.md` 為 archive-ready 的純 ADDED delta（`spectra archive` 預設會自動把 delta merge 至 `openspec/specs/ci-quality-gates/spec.md`，故 apply 階段不可手動 append 以避免重複）。三條 Requirement 名稱：Workflows declare minimal token permissions、Third-party GitHub Actions pinned to commit SHAs、CI workflows install build toolchain at fixed versions。verification：`grep -c '^### Requirement:' openspec/changes/harden-ci-workflows/specs/ci-quality-gates/spec.md` 為 3；該檔內僅出現 `## ADDED Requirements`（不含 MODIFIED／REMOVED／RENAMED）；archive 之前 `openspec/specs/ci-quality-gates/spec.md` 內 Requirement 數維持 8 不動。

## 5. 整體驗證（apply 收尾）

- [x] 5.1 跑 spectra analyzer 確認三條 Requirement 與 design／tasks 互相對應、無 cross-reference 漏接。verification：`spectra analyze harden-ci-workflows --json` 回傳 0 Critical / 0 Warning；`spectra validate harden-ci-workflows` 退出碼 0。
- [x] 5.2 確認兩個 workflow 仍是合法 GitHub Actions YAML。verification：本機跑 `actionlint .github/workflows/*.yml` 退出碼 0（若機器無 actionlint，至少對兩個檔跑 `python -c 'import yaml,sys; yaml.safe_load(open(sys.argv[1]))' <file>` 確認 parse 不出錯）。
- [x] 5.3 在 feature branch 推一個 trivial commit（例如 README 加空白），觀察 `quality-gates` workflow 對該 PR 跑出 `test` 與 `build` 兩個 job 皆 PASS，且 GitHub UI job summary 顯示 declared permissions 為 `contents: read`。verification：`gh run list --workflow=quality-gates.yml --branch <branch>` 顯示最新 run conclusion 為 `success`，且 `gh run view <run-id> --log | rg 'Permissions'` 出現 `contents: read`。
