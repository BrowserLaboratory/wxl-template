## 1. 修正 keygen 跳過邏輯（keygen skip logic verifies output file existence）

- [x] 1.1 實作「Keygen skip logic verifies output file existence」：修改 `scripts/challenge-keygen.ts` 的跳過條件，新增 `existsSync(outputWasmPath)` 檢查（以檔案存在性作為跳過條件的補充）
- [x] 1.2 提前計算 `root` 路徑變數，移除後續重複宣告（提前計算 root 路徑）

## 2. 更新文件

- [x] 2.1 更新 `Usage.md`，說明 keygen 跳過邏輯與 CI 環境行為
- [x] 2.2 更新 `README.md` frontmatter 範例，移除已棄用的 `fs_key`、`flag_verifier` 欄位

## 3. 驗證

- [x] 3.1 執行 `pnpm test` 確認所有測試通過
- [x] 3.2 確認本地 `pnpm challenge:keygen` 在已存在 `.wasm` 時正確跳過
- [x] 3.3 確認刪除 `.wasm` 後 `pnpm challenge:keygen` 會重新產生
