## 1. 從 relativePath 倒數第二段取 slug

- [x] [P] 1.1 修正 `ChallengeLayout.vue` 的 slug computed，從 `relativePath` 的倒數第二段（parent directory name）取值，並保留 flat path fallback，完成 slug derivation from per-folder challenge path
- [x] [P] 1.2 更新 `tests/unit/layouts/ChallengeLayout.test.ts` 中的 slug 相關測試，確認 per-folder 路徑產出正確 slug

## 2. Watch disabled prop 觸發自動導航

- [x] [P] 2.1 在 `BrowserPanel.vue` 加入 watch `disabled` prop，從 `true` 變為 `false` 時自動呼叫 `navigate()`，實現 auto-navigation on runtime ready
- [x] [P] 2.2 更新 `tests/unit/components/BrowserPanel.test.ts` 加入自動導航測試案例

## 3. 驗證

- [x] 3.1 執行 `pnpm test -- --run` 確認全部測試通過（604 passed, 0 failed）
