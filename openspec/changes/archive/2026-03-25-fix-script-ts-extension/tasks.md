## 1. 修正 import 路徑缺少 `.ts` 副檔名

- [x] [P] 1.1 修正 `scripts/challenge-keygen.ts` 第 26 行：`'./challenge-utils'` → `'./challenge-utils.ts'`
- [x] [P] 1.2 修正 `scripts/challenge-analyze.ts` 第 18 行：`'./challenge-utils'` → `'./challenge-utils.ts'`
- [x] 1.3 掃描 `scripts/` 目錄所有 `.ts` 檔案，確認無其他缺少 `.ts` extension 的相對 import（額外修正 fsignore + config 共 4 處）
- [x] 1.4 執行 `pnpm challenge:keygen` 確認不再出現 `ERR_MODULE_NOT_FOUND`（已確認：錯誤變為 WASM 未建置，import 路徑正確）
