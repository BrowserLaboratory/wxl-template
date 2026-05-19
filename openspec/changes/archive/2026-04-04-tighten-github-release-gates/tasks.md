## 1. Release gate contract

- [x] 1.1 依照 Gate ordering 更新 `github-release-workflow` 的 "Complete build pipeline execution" requirement，將 Rust/WASM tests 納入正式 tag release gate。
- [x] 1.2 依照 Rust test command selection 修改 `.github/workflows/release.yml` 與必要 script wiring，使 "Complete build pipeline execution" 依序執行 `pnpm wasm:test`、`pnpm test --run`、`pnpm challenge:validate`、`pnpm docs:build`。

## 2. Release review readiness

- [x] 2.1 補齊 release workflow 的 active spec metadata 與審查說明，讓 release review 可以直接依據 "Complete build pipeline execution"、Gate ordering、Rust test command selection 驗證 blocking sequence。
