## Context

`scripts/challenge-keygen.ts` 中的 `processChallenge()` 函式在判斷是否跳過已處理的挑戰時，僅依賴 frontmatter 中 `wasmModule` 欄位的存在性。然而 `.wasm` 檔案已被 `.gitignore` 中的 `**/*.wasm` 規則排除，導致 CI 環境（Cloudflare Pages）中 frontmatter 狀態與檔案系統狀態不一致。

目前的跳過邏輯（第 371-376 行）：
```typescript
const hasWasmModule = typeof fm.wasmModule === 'string' && fm.wasmModule !== ''
if (hasWasmModule && !force) { return }
```

## Goals / Non-Goals

**Goals:**

- 修正 CI 環境中 `challenge:keygen` 錯誤跳過所有挑戰的問題
- 在本地開發環境中保持既有的快取行為（已存在的 `.wasm` 不重新產生）
- 更新文件以反映當前的 frontmatter 格式與跳過邏輯

**Non-Goals:**

- 不修改 `.gitignore` 策略（`.wasm` 檔案仍維持不納入版控）
- 不變更 WASM payload 格式或加密機制

## Decisions

### 以檔案存在性作為跳過條件的補充

在現有的 `hasWasmModule` 檢查之外，新增 `existsSync(outputWasmPath)` 檢查。僅當 frontmatter 已標記**且**輸出檔案實際存在時才跳過。

**替代方案**：移除 `**/*.wasm` gitignore 規則，將產生的 `.wasm` 納入版控。此方案雖可解決問題，但會增加 repo 大小且違反「建置產物不入版控」的原則。

### 提前計算 root 路徑

將 `root` 變數的計算從輸出階段（原第 452 行）提前到跳過檢查階段，以便建構輸出路徑進行檢查。後續輸出階段直接復用此變數。

## Risks / Trade-offs

- [風險] CI 環境每次建置都會重新產生所有 WASM → 這是預期行為，因為 `.wasm` 不在版控中，CI 本就需要完整建置
- [風險] 本地開發者刪除 `.wasm` 檔案後可能觸發非預期的重新產生 → 這是正確的行為，確保檔案系統與 frontmatter 一致
