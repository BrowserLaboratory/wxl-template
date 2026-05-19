## Why

`pnpm dev` 執行 `challenge:keygen` 時，Node.js v24 的 `--experimental-strip-types` 無法解析不含 `.ts` 副檔名的相對 import，導致 `ERR_MODULE_NOT_FOUND` 錯誤。這阻擋了整個開發流程（`pnpm dev` 無法啟動）。

## What Changes

- 修正 `scripts/challenge-keygen.ts` 中 `import { scanSrcDirectory } from './challenge-utils'` 為 `'./challenge-utils.ts'`
- 修正 `scripts/challenge-analyze.ts` 中相同的 import 路徑
- 全面掃描 `scripts/` 目錄，確認無其他遺漏的 `.ts` extension

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

（無 — 此為 import 路徑修正，不涉及 spec-level 行為變更）

## Impact

- Affected code:
  - `scripts/challenge-keygen.ts`（line 26）
  - `scripts/challenge-analyze.ts`（line 18）
