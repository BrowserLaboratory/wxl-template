## Context

專案使用 `node --experimental-strip-types` 執行 TypeScript scripts。Node.js ESM resolver 在此模式下不會自動補全 `.ts` 副檔名，必須在 import 路徑中明確指定。

## Decisions

### 直接修正 import 路徑

在 `challenge-keygen.ts` 和 `challenge-analyze.ts` 中，將 `'./challenge-utils'` 改為 `'./challenge-utils.ts'`。

**替代方案：** 使用 `--experimental-specifier-resolution=node`（已被 Node.js 棄用且不穩定）。直接加副檔名是最簡單且符合 ESM 標準的做法。

## Risks / Trade-offs

- 無風險。ESM spec 要求明確的副檔名，此修正符合標準行為。
