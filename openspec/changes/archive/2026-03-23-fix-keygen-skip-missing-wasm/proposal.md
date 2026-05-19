## Why

`challenge-keygen` 腳本在判斷是否跳過挑戰時，僅檢查 frontmatter 中的 `wasmModule` 欄位是否存在，但未驗證對應的 `runtime.wasm` 檔案是否實際存在於磁碟上。由於 `.wasm` 檔案被 `.gitignore` 排除，CI 環境（如 Cloudflare Pages）中 frontmatter 已包含 `wasmModule` 但 `.wasm` 檔案並不存在，導致所有挑戰被錯誤跳過，最終部署產物缺少 `runtime.wasm`。

## What Changes

- 修改 `challenge-keygen.ts` 的跳過邏輯：除了檢查 `wasmModule` frontmatter 欄位外，同時驗證輸出的 `runtime.wasm` 檔案是否存在
- 當 frontmatter 已標記但 `.wasm` 檔案不存在時（CI 環境），腳本會自動重新產生
- 更新 `Usage.md` 說明跳過邏輯行為
- 更新 `README.md` frontmatter 範例，移除已棄用的 `fs_key`、`flag_verifier` 欄位

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `wasm-challenge-payload`: 跳過邏輯新增輸出檔案存在性檢查，確保 CI 環境能正確重新產生 WASM

## Impact

- 受影響程式碼：`scripts/challenge-keygen.ts`
- 受影響文件：`Usage.md`、`README.md`
- 受影響流程：Cloudflare Pages CI 部署流程（修正後將正確產生 `runtime.wasm`）
