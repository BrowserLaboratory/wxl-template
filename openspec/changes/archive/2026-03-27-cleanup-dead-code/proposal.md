## Summary

清理已確認的 dead code 並妥善處理遺留文件 `Usage.md`（先遷移獨有內容，再刪除）。

## Motivation

全面審計後發現以下 dead code 和遺留文件：

1. **`DescriptionModal.vue` + `descriptionModalVisible`**：`descriptionModalVisible` 永遠為 `false`，modal 永遠不會顯示。組件被 import 但 `v-if` 條件永遠不成立。
2. **`Usage.md`**：包含三段獨有內容（keygen 腳本詳細流程、GitHub Pages 部署 workflow、Cloudflare Pages 部署指南）不存在於其他文件。但也包含過時的 frontmatter 格式（仍使用已棄用的 `fs`、`flag_verifier` 欄位）。不能直接刪除，需先遷移再刪。

## Proposed Solution

### Dead code 刪除

- 從 `ChallengeLayout.vue` 移除 `DescriptionModal` import、`descriptionModalVisible` ref、以及對應的 `<DescriptionModal>` 模板區塊
- 刪除 `DescriptionModal.vue` 組件檔案

### Usage.md 遷移後刪除

`Usage.md` 內容分析：

| 段落 | 處理方式 |
|------|----------|
| 挑戰者操作指南 | 已被 `docs/guide/index.md` 完整覆蓋 → 不遷移 |
| 出題者 — frontmatter 格式 | 已被 `README.md` 覆蓋，且 Usage.md 版本**過時** → 不遷移 |
| 出題者 — create-challenge | 已被 `CONTRIBUTE.md` 覆蓋 → 不遷移 |
| 出題者 — keygen 腳本詳細流程 | **獨有內容** → 遷移至 `CONTRIBUTE.md` 新增「Challenge Keygen」段落 |
| 部署者 — GitHub Pages workflow | **獨有內容** → 遷移至 `README.md` 新增「部署」段落 |
| 部署者 — Cloudflare Pages | **獨有內容** → 同上遷移至 `README.md`「部署」段落 |

遷移時更新過時內容（repo URL 改為 `CXPhoenix/wxl`）。遷移完成後刪除 `Usage.md`。

## Non-Goals

- 不刪除 `useUserVfs.ts`（已標記為 future work，保留）
- 不修改任何功能邏輯

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-description-modal`: 移除 DescriptionModal 組件相關需求（已在前次 sync 中標記為 removed）

## Impact

- 刪除檔案：`DescriptionModal.vue`、`Usage.md`
- 編輯檔案：`ChallengeLayout.vue`、`README.md`、`CONTRIBUTE.md`
- 不影響任何 spec 的 active requirements（DescriptionModal 相關需求已 removed）
