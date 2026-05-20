<!--
每個 task 描述須同時表達「交付的行為／契約」與「驗證目標」。檔案路徑僅作 locator，不能單獨成為 task。
-->

## 1. SHA 取得與版本驗證

- [x] 1.1 [P] 取得 `actions/checkout` v6 線 latest stable 的 release tag 與其 dereferenced commit SHA，並確認 `action.yml` 之 `runs.using` 為 `node24`，落實設計決策「採用 actions/checkout v6 線之 latest stable 並 pin commit SHA」。驗證：`gh api /repos/actions/checkout/releases/latest` 取得 tag_name；`git ls-remote https://github.com/actions/checkout refs/tags/<tag>` 取得 tag object，再 `gh api /repos/actions/checkout/git/tags/<tag-sha>` dereference 取 commit SHA；`curl` 取對應 commit 之 `action.yml` 並 grep `runs.using:.*node24`；結果寫進本 task 的 commit message 之 SHA／版本／runtime 三欄
- [x] 1.2 [P] 取得 `actions/setup-node` v6 線 latest stable 的 release tag 與其 dereferenced commit SHA，並確認 `runs.using: node24`，落實設計決策「採用 actions/setup-node v6 線之 latest stable 並 pin commit SHA」。驗證：同 1.1 之三步驟（latest release → annotated tag dereference → 抓 action.yml grep runs.using）
- [x] 1.3 [P] 取得 `pnpm/action-setup` v6 線 latest stable 的 release tag 與其 dereferenced commit SHA，並確認 `runs.using: node24`，落實設計決策「採用 pnpm/action-setup v6 線之 latest stable 並 pin commit SHA」。驗證：同 1.1，並額外確認 v4 → v6 CHANGELOG 之 cache key 章節沒有 breaking 變動（若有則記入 design Open Questions）
- [x] 1.4 [P] 取得 `taiki-e/install-action` v2 線 latest stable 的 release tag 與其 dereferenced commit SHA，並確認 `runs.using: composite`、且該版本 manifest 收錄 `wasm-pack` 0.14.0，落實設計決策「替換 jetli/wasm-pack-action → taiki-e/install-action」。驗證：`gh api /repos/taiki-e/install-action/releases/latest` + dereference；`curl` 取 `action.yml` 並 grep `runs.using:.*composite`；以 `curl -s https://raw.githubusercontent.com/taiki-e/install-action/<sha>/manifests/wasm-pack.json` 或同等資料源確認 `0.14.0` 在 manifest 中

## 2. quality-gates.yml workflow 更新

- [x] 2.1 在 `.github/workflows/quality-gates.yml` 之 `test` 與 `build` 兩個 job 完成 4 個 Node-runtime action 的 SHA + 版本註解替換，使該檔案經升級後不再引用任何 `runs.using: node20` 或 `node16` 之 action，落實 Requirement「Third-party GitHub Actions pinned to commit SHAs」之新 SHA 格式。驗證：`rg '@[0-9a-f]{40}' .github/workflows/quality-gates.yml | wc -l` 等於該檔之 `uses:` 行總數；每個 `uses:` 行皆帶 `# vN.x.y` 註解；`rg 'jetli/wasm-pack-action' .github/workflows/quality-gates.yml` 為空
- [x] 2.2 在 `.github/workflows/quality-gates.yml` 兩個 job 把 `node-version: 22` 改為 `node-version: 24`，落實 Requirement「The workflow SHALL pin Node.js to version 24 LTS」；同時把 setup-node step 之相關註解（若有提及 §A.2.1）一併移除。驗證：`rg 'node-version:\s*22' .github/workflows/quality-gates.yml` 為空；`rg 'node-version:\s*24' .github/workflows/quality-gates.yml` 命中兩次（兩 job 各一）
- [x] 2.3 在 `.github/workflows/quality-gates.yml` 兩個 job 將 wasm-pack 安裝步驟改為 `taiki-e/install-action` 並設 `tool: wasm-pack@0.14.0`，落實 Requirement「`wasm-pack` SHALL be installed via a composite-based GitHub Action, not via npm」與 Requirement「CI workflows install build toolchain at fixed versions」。驗證：`rg 'taiki-e/install-action' .github/workflows/quality-gates.yml` 命中兩次；`rg 'wasm-pack@0\.14\.0' .github/workflows/quality-gates.yml` 命中兩次；`rg 'jetli/wasm-pack-action' .github/workflows/quality-gates.yml` 為空；`package.json` `dependencies` / `devDependencies` 仍 SHALL NOT 列 `wasm-pack`（`jq '.dependencies, .devDependencies | keys' package.json | rg -i wasm-pack` 為空）

## 3. release.yml workflow 更新

- [x] 3.1 在 `.github/workflows/release.yml` 完成同樣的 4 個 Node-runtime action SHA + 版本註解替換，使 release tag-push 觸發時不再引用 `runs.using: node20`/`node16` 之 action，落實 Requirement「Third-party GitHub Actions pinned to commit SHAs」。驗證：`rg '@[0-9a-f]{40}' .github/workflows/release.yml | wc -l` 等於該檔之 `uses:` 行總數；每行帶 `# vN.x.y` 註解
- [x] 3.2 在 `.github/workflows/release.yml` 將 `node-version: 22` 改為 `node-version: 24`，落實 Requirement「The workflow SHALL pin Node.js to version 24 LTS」。驗證：`rg 'node-version:\s*22' .github/workflows/release.yml` 為空；`rg 'node-version:\s*24' .github/workflows/release.yml` 命中一次
- [x] 3.3 在 `.github/workflows/release.yml` 將 wasm-pack 安裝步驟改為 `taiki-e/install-action` 並設 `tool: wasm-pack@0.14.0`，與 quality-gates.yml 保持相同 SHA 與版本字串以滿足 Requirement「CI workflows install build toolchain at fixed versions」之 Scenario「Deterministic toolchain across parallel jobs」之精神（跨 workflow 也保持一致）。驗證：兩支 workflow 之 `taiki-e/install-action` `uses:` 行的 SHA 相同；`wasm-pack@0.14.0` 字串於 release.yml 命中一次

## 4. 本機 Node 24 全綠驗證

- [x] 4.1 在 Node 24 環境下完整跑通 `pnpm install --frozen-lockfile && pnpm wasm:build && pnpm challenge:keygen && pnpm wasm:test && pnpm test --run && pnpm docs:build`，落實 design Implementation Contract 之第一列 acceptance criteria，確保「保持 node-version: 24 之單一版本而非 matrix」決策不引入未發現相容性 regression。驗證：`nvm use 24 && pnpm install --frozen-lockfile && pnpm wasm:build && pnpm challenge:keygen && pnpm wasm:test && pnpm test --run && pnpm docs:build` 全步驟 exit 0；若 vitest 出現 `CodeEditorPanel.test.ts` 之 5 個既有 regression 仍 fail，視為已 parked 之既知失敗、本 task 不被阻擋，但其餘任何新 failure 即為 rollback 觸發條件

## 5. Spec 與 AUDIT 同步

- [x] 5.1 在 PR commit 內套用 `openspec/changes/node-24-actions-upgrade/specs/ci-quality-gates/spec.md` 之 MODIFIED Requirements 至 `openspec/specs/ci-quality-gates/spec.md`，使該檔之第 4、5、9、10 條 Requirement 與 design「Spec MODIFIED 邊界」描述完全對齊，落實 Requirement「The workflow SHALL pin Node.js to version 24 LTS」、Requirement「`wasm-pack` SHALL be installed via a composite-based GitHub Action, not via npm」、Requirement「Third-party GitHub Actions pinned to commit SHAs」、Requirement「CI workflows install build toolchain at fixed versions」之 spec-side 收斂。驗證：`spectra archive node-24-actions-upgrade --dry-run` 之 spec diff 顯示僅該 4 條 Requirement 變動；`rg 'jetli/wasm-pack-action' openspec/specs/ci-quality-gates/spec.md` 僅出現於違規範例表行；`rg 'Node 22' openspec/specs/ci-quality-gates/spec.md` 為空（pin 已升至 24）
- [x] 5.2 在 `AUDIT.md` §A.2.1 與 §A.2.2 末段各補一行 anchor 標記「Node 24 阻擋已於 change `node-24-actions-upgrade` 解除（archived `<archive-date>-node-24-actions-upgrade`）」，使後續讀者於 AUDIT 內可反查解除來源。驗證：`rg 'node-24-actions-upgrade' AUDIT.md` 命中兩次（§A.2.1 與 §A.2.2 各一）；archive 後再次 grep 應命中含 archive 日期之完整字串

## 6. 全面驗證與 PR 流程

- [x] 6.1 [P] 跑 `spectra validate node-24-actions-upgrade`，確保 change artifacts 通過 spec-driven schema 驗證，落實「Spec MODIFIED 邊界」之最終一致性檢查。驗證：`spectra validate node-24-actions-upgrade` exit 0
- [x] 6.2 [P] 跑 `spectra analyze node-24-actions-upgrade --json`，filter `severity in (Critical, Warning)`，確保無未解決之 critical 或 warning finding。驗證：`spectra analyze node-24-actions-upgrade --json | jq '.findings[] | select(.severity == "Critical" or .severity == "Warning")'` 輸出為空陣列
- [ ] 6.3 開 PR 後觀察 `Quality Gates` workflow 之 `test` 與 `build` 兩個 status check 全綠通過，落實 Requirement「PR-time quality gates SHALL trigger on PRs to `main`/`staging` and pushes to `main`」於新 Node 24 stack 之延續正確性。驗證：PR run summary 顯示 `test` 與 `build` 皆 `success`；step inspection 顯示無 step 印出 Node runtime 廢棄警告
