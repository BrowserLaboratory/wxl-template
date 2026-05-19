## 1. UnoCSS Shortcuts 新增

- [x] [P] 1.1 在 `uno.config.ts` 的 `shortcuts` 陣列新增 `ch-input` shortcut（搜尋輸入框樣式，使用 `--ch-*` 自訂屬性）— 實現 UnoCSS shortcuts for challenge list controls are defined in uno.config.ts；參見 UnoCSS Shortcuts
- [x] [P] 1.2 在 `uno.config.ts` 新增 `ch-select` shortcut（下拉選單樣式）— 實現 UnoCSS shortcuts for challenge list controls are defined in uno.config.ts；參見 UnoCSS Shortcuts
- [x] [P] 1.3 在 `uno.config.ts` 新增 `ch-view-btn` 和 `ch-view-btn-active` shortcuts（檢視切換按鈕）— 實現 UnoCSS shortcuts for challenge list controls are defined in uno.config.ts；參見 UnoCSS Shortcuts
- [x] [P] 1.4 在 `uno.config.ts` 新增 `ch-tag` shortcut（標籤 pill 樣式）— 實現 UnoCSS shortcuts for challenge list controls are defined in uno.config.ts；參見 UnoCSS Shortcuts
- [x] [P] 1.5 在 `uno.config.ts` 新增 `ch-list-row` shortcut（列表模式每行樣式）— 實現 UnoCSS shortcuts for challenge list controls are defined in uno.config.ts；參見 UnoCSS Shortcuts

## 2. ChallengeList.vue — 響應式狀態與搜尋

- [x] 2.1 在 `ChallengeList.vue` 建立響應式狀態：`searchQuery`、`debouncedQuery`、`difficultyFilter`、`categoryFilter`、`sortField`、`sortDir`、`viewMode` — 參見 Component Architecture / 響應式狀態；排序欄位與方向獨立控制
- [x] 2.2 實作 inline debounce 實作機制（`setTimeout` / `clearTimeout`，debounce 延遲 300ms）將 `searchQuery` 同步至 `debouncedQuery` — 實現 Challenge list provides debounced text search across title, description, and tags

## 3. ChallengeList.vue — 篩選與排序邏輯

- [x] 3.1 實作 `categories` 運算屬性（Computed）：從 `props.challenges` 動態擷取不重複類別值（動態類別列表）— 實現 Challenge list provides difficulty and category dropdown filters / Category dropdown options are dynamically generated
- [x] 3.2 實作 `filteredChallenges` 運算屬性（Computed）：依序執行搜尋篩選（title/description/tags）、難度篩選、類別篩選、排序 — 參見 篩選邏輯流程
- [x] 3.3 排序邏輯中難度排序使用固定順序 `['easy', 'medium', 'hard', 'mystery']`，預設依 ID 升冪 — 實現 Challenge list provides sort controls with direction toggle

## 4. ChallengeList.vue — 控制列（Toolbar）Template

- [x] 4.1 新增搜尋輸入框（使用 `ch-input` class），綁定 `searchQuery` — 實現 Challenge list provides debounced text search across title, description, and tags；參見 控制列（Toolbar）
- [x] 4.2 新增難度下拉選單（使用 `ch-select` class），選項包含全部/easy/medium/hard/mystery — 實現 Challenge list provides difficulty and category dropdown filters；參見 控制列（Toolbar）
- [x] 4.3 新增類別下拉選單（使用 `ch-select` class），選項從 `categories` computed 動態生成 — 實現 Challenge list provides difficulty and category dropdown filters；參見 控制列（Toolbar）
- [x] 4.4 新增排序欄位下拉 + 方向 toggle 按鈕 — 實現 Challenge list provides sort controls with direction toggle；參見 控制列（Toolbar）
- [x] 4.5 新增 Grid/List 檢視切換按鈕（使用 `ch-view-btn` / `ch-view-btn-active` class）— 實現 Challenge list supports grid and list view modes；參見 控制列（Toolbar）

## 5. ChallengeList.vue — Grid 模式 — 卡片 Template

- [x] 5.1 重寫格線卡片 template，顯示 ID、標題、difficulty badge、category badge — 實現 Challenge list displays each challenge as a card with metadata and a link；參見 Grid 模式 — 卡片
- [x] 5.2 新增 description 區塊，使用 CSS line-clamp 限制 2-3 行（description 行數限制）— 參見 Grid 模式 — 卡片
- [x] 5.3 新增 tags 區塊，使用 `ch-tag` class 呈現每個 tag — 參見 Grid 模式 — 卡片
- [x] 5.4 新增 date 顯示區塊 — 參見 Grid 模式 — 卡片

## 6. ChallengeList.vue — List 模式 — 表格列 Template

- [x] 6.1 新增列表模式 template，使用 `ch-list-row` class，顯示 ID、標題、難度、類別、日期 — 實現 Challenge list supports grid and list view modes / List view displays compact rows；參見 List 模式 — 表格列

## 7. 空狀態

- [x] 7.1 新增空狀態 template，當 `filteredChallenges` 長度為 0 時顯示提示訊息 — 實現 Challenge list displays empty state when no challenges match filters

## 8. 驗證

- [x] 8.1 驗證 `pnpm docs:dev` 正常啟動，題目列表頁可正確顯示
- [x] 8.2 手動測試搜尋、篩選、排序、檢視切換、空狀態功能
