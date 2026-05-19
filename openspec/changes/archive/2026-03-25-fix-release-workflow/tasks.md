## 1. 新增品質閘門步驟

- [x] 1.1 在 `.github/workflows/release.yml` 的 `Generate challenge keys` 步驟之後、`Build VitePress site` 之前，新增 `pnpm test --run` 步驟（對應 design 決策「測試與驗證步驟放在 keygen 之後、docs:build 之前」與「使用 `pnpm test --run` 而非 `pnpm test`」），確保 complete build pipeline execution 包含測試
- [x] 1.2 在測試步驟之後，新增 `pnpm challenge:validate` 步驟，完成 complete build pipeline execution 的驗證閘門

## 2. 驗證

- [x] 2.1 確認 workflow YAML 語法正確（可透過 `yq` 或 `actionlint` 驗證）
