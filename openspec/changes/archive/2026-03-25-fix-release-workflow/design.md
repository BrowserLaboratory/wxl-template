## Context

目前的 GitHub Actions release workflow 在 `Build VitePress site` 之前不執行任何品質閘門。建置流程為：install → wasm:build → challenge:keygen → docs:build → package → release。如果測試失敗或挑戰 frontmatter 不合格，release 仍然會被建立。

## Goals / Non-Goals

**Goals:**

- 在建置前加入 `pnpm test --run` 步驟
- 在建置前加入 `pnpm challenge:validate` 步驟
- 任一步驟失敗即中止 release

**Non-Goals:**

- 不加入 lint/format 檢查（目前專案未設定）
- 不改變 workflow 的觸發條件或 release 格式

## Decisions

### 測試與驗證步驟放在 keygen 之後、docs:build 之前

順序：wasm:build → challenge:keygen → **test --run** → **challenge:validate** → docs:build。

理由：測試和驗證需要 WASM 模組和 keygen 產出的檔案才能正確執行。放在 docs:build 之前可以在耗時的靜態網站建置前攔截問題。

### 使用 `pnpm test --run` 而非 `pnpm test`

`--run` 旗標確保 vitest 在 CI 環境以非 watch 模式執行，跑完即退出。

## Risks / Trade-offs

- [風險] 測試步驟增加 release 時間 → 測試執行時間通常在 30 秒內，相對於 WASM 建置和 docs:build 的時間可以接受
