## Why

`wxl-template` 在 2026-05-20 切完 `v1.0.0-rc.1` 之後，CI 端只有 `ci-quality-gates` capability 描述 jobs 結構，**完全沒有任何 CI 安全 hardening 規範**。`.github/workflows/quality-gates.yml` 沒有 `permissions:` block，預設 `GITHUB_TOKEN` 權限受 repo settings 控制、不受 PR review 監督；兩個 workflow 內所有 `uses:` 行（共 7 種 action）都用 mutable tag，可被 action 作者於同一 tag 下推 breaking／惡意內容；`jetli/wasm-pack-action` 只 pin 了 action 本體版本，沒有透過 `version:` input 鎖定內部 wasm-pack，跨 run／跨 job 可能 install 到不同 wasm-pack。

對齊姊妹專案 `netsim-template` 的 `quality-assurance-gates` spec（已落地 SHA pin、minimal permissions、toolchain version pin），現在是 `v1.0.0-rc.1 → v1.0.0` 黃金期把 hardening 收尾的時機；過了正式版就會被 v1.0.x patch 流程綁住，且 use-template 衍生 repo 都能直接繼承這層保護。

## What Changes

- **新增 workflow-level token permissions**：`quality-gates.yml` 在 `on:` 之後、`jobs:` 之前加 `permissions: { contents: read }`；`release.yml` 保留現有 `permissions: { contents: write }`，附 inline 註解說明 `softprops/action-gh-release` 為何需要 write。
- **所有 GitHub Actions 改 SHA pinning**：兩個 workflow 內所有 `uses: foo@vN` 換成 `uses: foo@<40-char SHA> # vN.x.y` 格式，涵蓋 `actions/checkout`、`dtolnay/rust-toolchain`、`Swatinem/rust-cache`、`jetli/wasm-pack-action`、`pnpm/action-setup`、`actions/setup-node`、`softprops/action-gh-release`。
- **wasm-pack 內部工具版本鎖定**：兩個 workflow 共 3 處 `jetli/wasm-pack-action` 步驟補 `version: 'v0.14.0'` input。
- **Spec `ci-quality-gates` 補三條 Requirement**：分別規範 minimal token permissions、SHA pinning、toolchain version pinning，scenarios 寫成 wxl 語境（兩 workflow 共需遵守、`grep -E '@v[0-9]+$'` 應無 match、`jetli/wasm-pack-action` 必須帶具體 `version:`）。

不包含：不改既有 8 條 Requirement、不引入 Node 22/24 matrix、不引入 Playwright site-smoke、不引入 fork PR ephemeral key、不動 `release.yml` 的打包步驟與 `generate_release_notes: true` 行為、不設定 GitHub repo 端 ruleset（屬於姊妹 change `configure-branch-protection-ruleset`）。

## Non-Goals (optional)

- **不引入 Node matrix**：拉 Node 24 會撞 `AUDIT.md §A.2.1` Node 24 相容性技術債，必須先解技術債再做。
- **不引入 Playwright site-smoke**：影響範圍與 CI 預算太大，建議與「prose-audit gate CI 化」一起評估，獨立 change。
- **不引入 fork PR ephemeral key**：目前 repo 沒有 workflow secret；等 prose-audit Phase 2 引入 `ANTHROPIC_API_KEY` 時再一起做。
- **不設定 GitHub repo 端 ruleset**：repo settings 端的 required checks／direct-push 禁用屬於姊妹 change `configure-branch-protection-ruleset`，scope 性質不同（repo 內檔案 vs. repo 端 settings + CONTRIBUTE.md 文件），拆兩個 change 可降低衝突面。
- **不重寫 `release.yml` 的 release-note 生成路徑**：`generate_release_notes: true` 與後置 `gh release edit --notes-file` 客製流程繼續沿用，本變更不觸碰。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `ci-quality-gates`：在現有 8 條 Requirement 之外新增三條 hardening Requirement（minimal token permissions、SHA pinning、toolchain version pinning），不修改也不移除任何現有 Requirement。

## Impact

- Affected specs: `ci-quality-gates`（delta-only：ADDED Requirements，無 MODIFIED／REMOVED／RENAMED）
- Affected code:
  - Modified:
    - `.github/workflows/quality-gates.yml`
    - `.github/workflows/release.yml`
    - `openspec/specs/ci-quality-gates/spec.md`
  - New: （無）
  - Removed: （無）
- 相依 / 連動：
  - 後續 change `configure-branch-protection-ruleset` 仍以本變更維持的 `test`／`build` job ID 作為 required status checks，job ID 不會改動。
  - 對 use-template 衍生 repo 有正面外溢：workflow 直接被繼承、hardening 自動生效。
