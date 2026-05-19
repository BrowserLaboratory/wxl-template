## Why

tag release workflow 目前沒有執行 Rust/WASM 測試，讓核心 runtime regression 可以在 release pipeline 中被直接漏掉。既然發版已依賴 `wasm:build` 與 per-challenge payload，release gate 就必須同時驗證對應的 Rust workspace。

## What Changes

- 將 Rust/WASM 測試納入 tag-triggered release workflow，讓 `cargo test --workspace` 或等價腳本成為正式發版 gate。
- 明確 release workflow 中各個 gate 的執行順序與失敗條件，包含 build、payload generation、test、validate 與 docs build。
- 補完 `github-release-workflow` spec 的 Purpose 與 requirement 細節，讓 workflow 規格可直接用於 release readiness review。

## Non-Goals (optional)

- 不改變 release 觸發條件、tag naming 規則或 GitHub Releases 發佈格式。
- 不新增與正式 tag release 無關的 PR-only CI jobs。
- 不在本 change 中擴增 deploy、publish 或 announcement 流程。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `github-release-workflow`: 將 release gate contract 擴充到 Rust/WASM 測試與完整 blocking sequence。

## Impact

- Affected specs: `github-release-workflow`
- Affected code: `.github/workflows/release.yml`, `package.json`
