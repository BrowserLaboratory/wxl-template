## Context

三項獨立的設定問題影響開發體驗與型別安全：

1. `tsconfig.json` 的 `types` 只有 `["vitepress/client"]`，但 vitest 設定了 `globals: true`，導致 IDE 無法辨識 `describe`、`it`、`expect` 等全域函式
2. `package.json` 的 `description` 為空字串，GitHub repo page 顯示空白
3. `ChallengeData.difficulty` 型別為 `'easy' | 'medium' | 'hard' | string`，其中 `| string` 使 union 完全失效

## Goals / Non-Goals

**Goals:**

- 在 `tsconfig.json` 加入 `vitest/globals` 型別宣告
- 為 `package.json` 填入描述
- 修正 `ChallengeData.difficulty` 型別定義

**Non-Goals:**

- 不大幅重構 tsconfig（如 project references 等）
- 不改變 ChallengeData 介面的其他欄位

## Decisions

### tsconfig 加入 vitest/globals

在 `compilerOptions.types` 陣列中加入 `"vitest/globals"`，使 IDE 在測試檔案中正確辨識全域測試 API。

### 使用專案已有的 difficulty 常數作為型別來源

`ChallengeList.vue` 中的 difficulty dropdown 使用 `['easy', 'medium', 'hard', 'mystery']`。將 `ChallengeData.difficulty` 改為 `'easy' | 'medium' | 'hard' | 'mystery'`（移除 `| string`）。

## Risks / Trade-offs

- [風險] 加入 `vitest/globals` 後，非測試檔案也能存取 `describe` 等函式 → 影響極低，TypeScript 不會因此產生錯誤引用
