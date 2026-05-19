## Why

專案的 TypeScript 與 metadata 設定存在數個不一致之處：`tsconfig.json` 缺少 `vitest/globals` 型別宣告導致 IDE 中測試全域函式報錯；`package.json` 的 `description` 為空字串；`ChallengeData` 介面的 `difficulty` 欄位型別為 `'easy' | 'medium' | 'hard' | string`，其中 `| string` 使 union 完全失去型別保護效果。這些問題影響開發體驗與型別安全。

## What Changes

- 在 `tsconfig.json` 的 `compilerOptions.types` 中加入 `"vitest/globals"`
- 為 `package.json` 填入有意義的 `description` 欄位
- 修正 `ChallengeData.difficulty` 型別，移除多餘的 `| string`

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-list`：`ChallengeData.difficulty` 型別收窄為 `'easy' | 'medium' | 'hard' | 'mystery'`，移除多餘的 `| string`

## Impact

- 受影響檔案：`tsconfig.json`、`package.json`、`docs/shared/challenges.data.ts`
