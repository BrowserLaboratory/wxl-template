## Summary

重構 `ChallengeList.vue` 元件，從簡單的卡片格線升級為具備搜尋、篩選、排序與雙檢視模式的完整題目總覽介面。同時在 `uno.config.ts` 新增對應的 UnoCSS shortcuts。

## Motivation

目前的題目列表只是一個靜態卡片格線，隨著題目數量增長，使用者無法快速找到目標題目。缺少以下能力：

- **搜尋**：無法透過關鍵字搜尋題目名稱、描述或標籤
- **篩選**：無法依難度或類別縮小範圍
- **排序**：僅依 ID 排序，無法依難度、類別或日期排序
- **檢視切換**：僅有格線模式，缺少適合快速掃描的列表模式
- **空狀態**：篩選無結果時沒有提示訊息

此變更為使用者提供高效的題目瀏覽體驗，是平台可用性的基礎改善。

## Proposed Solution

### 搜尋

- 新增文字搜尋欄位，對 `title`、`description`、`tags` 進行 fuzzy match
- 使用 inline debounce 實作（不引入 `@vueuse/core` 避免依賴問題），延遲 300ms

### 篩選

- 難度下拉選單：全部 / easy / medium / hard / mystery
- 類別下拉選單：動態從資料中擷取所有不重複的 category 值

### 排序

- 排序欄位：ID、難度、類別、日期
- 方向切換：升冪/降冪 toggle 按鈕

### 檢視模式

- **格線模式（Grid）**：豐富卡片，顯示 ID、標題、難度/類別 badge、description（2-3 行 clamp）、tags、日期
- **列表模式（List）**：精簡表格列，適合快速掃描
- 檢視切換按鈕

### 空狀態

- 篩選無結果時顯示友善提示訊息

### UnoCSS Shortcuts

- 在 `uno.config.ts` 新增：`ch-input`、`ch-select`、`ch-view-btn`、`ch-tag`、`ch-list-row`

## Impact

- 受影響程式碼：
  - `.vitepress/theme/components/ChallengeList.vue` — 完整重寫
  - `uno.config.ts` — 新增 shortcuts
- 無破壞性變更：元件 API（`<ChallengeList :challenges="data" />`）維持不變
- 依賴前置變更：`extend-challenge-data-model` 需先完成（提供 `date`、`tags`、`description` 欄位）
