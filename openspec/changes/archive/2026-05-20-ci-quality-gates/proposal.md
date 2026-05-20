## Why

i18n master plan 與 `docs-prose-polish` 收尾後（2026-05-20），repo 已沉澱出三條品質 gate（`pnpm test --run` 0 fail、`pnpm docs:build` clean、`pnpm wasm:test` 0 fail），由 `code-editor-panel` 與 `oss-readme` spec 各自規範。這些 gate 目前只活在 spec 規範與人工流程，沒被 CI 強制——`.github/workflows/release.yml` 雖然在 tag-triggered 時會跑同樣的命令，但那是 release-time 第二道防線，已經 merge 進 `main` / `staging` 才會被擋下，違反 git flow 在 PR 階段就攔的本意。本 change 把 PR-time test + build gate 寫進新的 GitHub Actions workflow，讓未來 PR 自動 enforce 既有 spec。

## What Changes

- 新增 `.github/workflows/quality-gates.yml`，於 PR 對 `main` / `staging` 開啟、以及 push 至 `main` 時觸發。
- workflow 內含兩個並行 job：`test` 跑 `pnpm wasm:test` + `pnpm test --run`；`build` 跑 `pnpm challenge:validate` + `pnpm docs:build`。
- 兩 job 共用 setup（checkout、Rust toolchain、wasm-pack via `jetli/wasm-pack-action@v0.4.0`、binaryen、pnpm、Node 22、`pnpm install --frozen-lockfile`、`pnpm wasm:build`、`pnpm challenge:keygen`），步驟順序對齊既有 `release.yml`。
- 新增 `ci-quality-gates` capability spec，將「PR-time CI 必須跑 X」寫成 SHALL 條款，與既有 `code-editor-panel` / `oss-readme` spec 之 local-PASS 規範形成 CI enforcement 層。
- **不改** `release.yml`——tag-triggered 流程保持不變，作為 release-time redundancy。
- **不在本次處理** prose-audit gate 的 CI 化：humane-prose-audit Phase 2（sub-agent dispatch）需要 LLM harness 投放 sidecar JSON，無法在無 LLM 的 CI runner 上跑完整 verdict；design.md 會紀錄三個 follow-up 路徑（Phase 1 deterministic-only / verify-committed-summary / Claude API），留待後續 change 決定。

## Capabilities

### New Capabilities

- `ci-quality-gates`: GitHub Actions workflow that enforces PR-time quality gates—vitest, Rust/WASM tests, VitePress build, challenge frontmatter validation—so spec-defined local-PASS requirements become CI-enforced rather than purely conventional.

### Modified Capabilities

(none)

## Impact

- Affected specs: `ci-quality-gates`（new capability）
- Affected code:
  - New: `.github/workflows/quality-gates.yml`
  - Modified: (none)
  - Removed: (none)
- Affected runtime / infrastructure:
  - 新增 PR-time CI 執行時間負擔（兩 job 並行；以 release.yml 既有量級推估約 8–12 分鐘 wall-clock，視 Rust cache hit 與 pnpm cache hit 而定）。
  - GitHub Actions usage 增加，但僅限 `wxl-template` repo 的 PR/push 流量。
- Affected docs / spec corpus：本 change archive 後，新 spec 會在 `openspec/specs/ci-quality-gates/spec.md` 落地。
