## Why

2026-06-02 起 GitHub Actions runner 將強制使用 Node 24，2026-09-16 移除 Node 20 runtime；屆時所有仍以 Node 20 為執行階段的 JavaScript-based action 會直接停擺，CI 將完全跑不動。本 repo 兩支 workflow 目前共引用 4 個 Node-runtime action（`actions/checkout`、`actions/setup-node`、`pnpm/action-setup`、`jetli/wasm-pack-action`）皆停留在 Node 20 stack，且把 `node-version` 顯式 pin 在 22；同時 `AUDIT.md` §A.2.1 / §A.2.2 兩個 Node 24 build 阻擋已修復，繼續延後升級已沒有技術理由。趁 `v1.0.0-rc.1 → v1.0.0` 之間 hardening 黃金期一次處理，模板 fork 後不會在 6/2 後立刻 CI 全紅。

## What Changes

- 升級兩支 workflow（`.github/workflows/quality-gates.yml` 與 `.github/workflows/release.yml`）所引用之 4 個 Node-runtime action 至支援 Node 24 runtime 的版本，並依現行 spec 規範 pin 完整 40-char commit SHA + 版本註解：
  - `actions/checkout` v4.2.2 → 對應 v5.x（首版以 Node 24 為 runtime 之 stable release）
  - `actions/setup-node` v4.4.0 → 對應 v6.x（Node 24 stack）
  - `pnpm/action-setup` v4.1.0 → 最新 stable
  - `jetli/wasm-pack-action` v0.4.0 → 評估維護狀態；若 upstream 已停更或不支援 Node 24，改採等價替代品（例如手動 `cargo install wasm-pack` 或 `taiki-e/install-action`），保持「不從 npm devDep 安裝」之 §A.2.1 約束不變
- 將兩支 workflow 之 `node-version: 22` 升為 `node-version: 24`；同步移除 spec 內所有「until Node 24 compatibility issue documented in AUDIT.md §A.2.1 is resolved」之 deferred 條款
- 同步更新 `openspec/specs/ci-quality-gates/spec.md`：
  - MODIFIED「The workflow SHALL pin Node.js to version 22 LTS」→ pin Node 24 LTS，刪除 §A.2.1 deferred 條款
  - 若 `jetli/wasm-pack-action` 需替換，MODIFIED「`wasm-pack` SHALL be installed via `jetli/wasm-pack-action`, not via npm」→ 改述為「via a non-npm channel」並指明所選替代 action
  - MODIFIED「Third-party GitHub Actions pinned to commit SHAs」之 Example、與「CI workflows install build toolchain at fixed versions」之 Example 表格，使其指向新 SHA／新版本
- 同步更新 `AUDIT.md`：把 §A.2.1 / §A.2.2 註記為「已解除 Node 24 阻擋」，並補本 change 之 anchor reference
- 不修改 `openspec/specs/github-release-workflow/spec.md` 之 Requirement 文字：該 spec 對 Node 版本與具體 action 名稱皆只有描述性提及（「install Rust toolchain and wasm-pack」「install Node.js and pnpm」），未鎖具體版本，實作層 `release.yml` 改動不觸發 normative 變更

## Non-Goals (optional)

- 不引入 Node 22/24 build matrix。模板 repo 採單一 Node 版本足夠；matrix 會雙倍 CI 時間、且模板 fork 後使用者通常只跑一個 Node 版本
- 不升級 Rust-stack 之 `dtolnay/rust-toolchain` 與 `Swatinem/rust-cache`（不受 Node deprecation 影響）
- 不調整 `softprops/action-gh-release@v2.6.2`（雖然也是 Node-based，但 v2 線目前最新，待 upstream 釋出 Node 24 stack 後再 follow-up）
- 不調整 spec 中 ruleset、permissions、parallel jobs、wasm-pack 版本字串（v0.14.0）等其餘要求

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ci-quality-gates`: Node version pin 從 22 升至 24；`jetli/wasm-pack-action` 替換為 `taiki-e/install-action` 之 composite-based 安裝，「wasm-pack via action」Requirement 文字一併調整；Example 表格 SHA/version 更新

## Impact

- Affected specs: `ci-quality-gates`
- Affected code:
  - Modified:
    - `.github/workflows/quality-gates.yml`
    - `.github/workflows/release.yml`
    - `openspec/specs/ci-quality-gates/spec.md`
    - `AUDIT.md`
  - New: (none)
  - Removed: (none)
- 風險：(1) `jetli/wasm-pack-action` 若已停更需切換替代品，可能改變 install 路徑與快取行為；(2) Node 24 runtime 對某些 transitive deps 可能仍有未發現相容性問題，本 change 之 design.md SHALL 列出本機 `pnpm install --frozen-lockfile && pnpm wasm:build && pnpm test --run && pnpm docs:build` 全綠之前置驗證
