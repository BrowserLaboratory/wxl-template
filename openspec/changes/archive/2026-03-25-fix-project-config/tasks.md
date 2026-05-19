## 1. TypeScript 設定

- [x] 1.1 [P] 在 `tsconfig.json` 的 `compilerOptions.types` 加入 `"vitest/globals"`（對應 design 決策「tsconfig 加入 vitest/globals」）

## 2. Package Metadata

- [x] 2.1 [P] 為 `package.json` 填入有意義的 `description`（如 "Browser-based web exploitation challenge platform powered by WASM"）

## 3. 型別修正

- [x] 3.1 [P] 修正 `docs/shared/challenges.data.ts` 中 `ChallengeData.difficulty` 型別，從 `'easy' | 'medium' | 'hard' | string` 改為 `'easy' | 'medium' | 'hard' | 'mystery'`（對應 design 決策「使用專案已有的 difficulty 常數作為型別來源」），使 challenge list page collects all challenge frontmatter at build time using createContentLoader 的型別安全性提升

## 4. 驗證

- [x] 4.1 確認 TypeScript 編譯無錯誤，並執行現有測試確認無回歸
