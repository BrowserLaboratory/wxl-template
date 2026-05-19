## Context

release workflow 目前已經執行 `wasm:build`、`challenge:keygen`、Vitest、validation 與 docs build，但缺少 Rust/WASM test gate。由於核心 challenge runtime 依賴 Rust workspace，tag release 若不驗證這一層，就可能在正式打包時漏掉 regression。

## Goals / Non-Goals

**Goals:**

- 把 Rust/WASM tests 明確納入 release blocking sequence。
- 讓 release workflow spec 能直接描述完整 gate ordering。
- 保持現有 tag-triggered release 形狀不變。

**Non-Goals:**

- 不新增 PR-only CI matrix。
- 不修改 release artifact 命名或 GitHub Release 發佈方式。
- 不調整非 release workflow 的其他 CI jobs。

## Decisions

### Gate ordering

release workflow 會在 build artifacts 被打包前，依序執行 `pnpm wasm:build`、`pnpm challenge:keygen`、Rust/WASM tests、Vitest、challenge validation、docs build。任何一個 gate 失敗都直接中止後續步驟與 release creation。

### Rust test command selection

workflow 將以 repo 已定義的 `pnpm wasm:test` 作為 release gate，而不是在 workflow 內直接重寫 `cargo test --workspace`。這讓 release workflow 與 `package.json` 的專案入口保持一致，也保留未來調整 Rust test wrapper 的空間。

## Risks / Trade-offs

- [Risk] 多一個 release gate 會增加 tag build 時間。 → Mitigation: 既有 rust-cache 已經存在，新增的是 correctness gate 而非全新 toolchain。
- [Risk] 若 `pnpm wasm:test` 與本地開發習慣脫節，workflow 會更容易失敗。 → Mitigation: 使用既有 package script，避免 workflow 與 repo 標準指令分裂。

## Migration Plan

1. 先更新 workflow spec。
2. 再修改 release.yml 加入 `pnpm wasm:test`。
3. 以 dry run 或手動 workflow 驗證 gate ordering。

## Open Questions

- 未來是否要把 release gate 再向上提升到真 browser smoke tests，不在本 change 範圍內。
