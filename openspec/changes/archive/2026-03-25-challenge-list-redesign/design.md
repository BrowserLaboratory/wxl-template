## Context

`ChallengeList.vue` 目前是一個簡單的 `<script setup>` 元件，接收 `challenges: ChallengeData[]` prop，依 ID 排序後以卡片格線呈現。前置變更 `extend-challenge-data-model` 已為 `ChallengeData` 新增 `date`、`tags`、`description` 欄位，本變更利用這些欄位實作完整的搜尋/篩選/排序/檢視切換功能。

樣式系統使用 UnoCSS shortcuts（定義於 `uno.config.ts`），搭配 CSS 自訂屬性（`--ch-*`）實現深淺色主題相容。

## Goals / Non-Goals

**Goals:**

- 在 `ChallengeList.vue` 中實作 debounced 搜尋、難度篩選、類別篩選、排序與方向切換、Grid/List 檢視模式
- 格線卡片顯示完整資訊：ID、標題、badges、description clamp、tags、日期
- 列表模式以表格列呈現精簡資訊
- 篩選無結果顯示空狀態提示
- 在 `uno.config.ts` 新增對應的 UnoCSS shortcuts

**Non-Goals:**

- 修改 `ChallengeData` interface 或 data loader（由 `extend-challenge-data-model` 處理）
- 新增頁面路由或 layout
- 後端 API 或全文搜尋索引
- i18n 多語系

## Decisions

### Inline Debounce 實作

搜尋使用 inline debounce（`setTimeout` / `clearTimeout`），不引入 `@vueuse/core` 的 `useDebouncedRef`。

**理由：** 專案目前未使用 `@vueuse/core`，為單一功能新增依賴不划算。Inline debounce 約 5 行程式碼，維護成本低。

**替代方案：** 使用 `@vueuse/core` — 功能更豐富但增加 bundle size 和依賴管理風險。

### Debounce 延遲 300ms

搜尋 debounce 延遲設定為 300ms，平衡回應速度與效能。

### 動態類別列表

類別下拉選單的選項從 `challenges` prop 中動態擷取（`[...new Set(challenges.map(c => c.category))]`），不硬編碼類別值。

**理由：** 新增類別時無需修改元件程式碼，自動反映資料變化。

### Description 行數限制

格線卡片的 description 使用 CSS `line-clamp` 限制為 2-3 行，避免卡片高度不一致。

### 排序欄位與方向獨立控制

排序使用兩個獨立的響應式變數：`sortField`（id / difficulty / category / date）和 `sortDir`（asc / desc），透過 toggle 按鈕切換方向。

**理由：** 比合併為單一值（如 `id-asc`）更直觀，也更容易擴充新欄位。

### 難度排序使用固定順序

難度排序依 `['easy', 'medium', 'hard', 'mystery']` 固定順序，而非字母序。

## Component Architecture

### 響應式狀態

```
searchQuery: string          — 使用者輸入的搜尋文字
debouncedQuery: string       — debounce 後的搜尋文字（用於實際篩選）
difficultyFilter: string     — 選中的難度（'' = 全部）
categoryFilter: string       — 選中的類別（'' = 全部）
sortField: 'id' | 'difficulty' | 'category' | 'date'
sortDir: 'asc' | 'desc'
viewMode: 'grid' | 'list'
```

### 運算屬性（Computed）

```
categories: string[]         — 從 props.challenges 動態擷取的不重複類別
filteredChallenges: ChallengeData[]  — 經搜尋 + 篩選 + 排序後的結果
```

### 篩選邏輯流程

```
props.challenges
  → 搜尋篩選（title / description / tags 包含 debouncedQuery）
  → 難度篩選（difficultyFilter 為空 = 不篩選）
  → 類別篩選（categoryFilter 為空 = 不篩選）
  → 排序（依 sortField + sortDir）
  → filteredChallenges
```

## Template Structure

### 控制列（Toolbar）

```
搜尋輸入框 | 難度下拉 | 類別下拉 | 排序下拉 + 方向 toggle | Grid/List 切換
```

### Grid 模式 — 卡片

```
┌─────────────────────────────┐
│ #001  SQL Injection 入門     │
│ [easy] [web]                │
│ 透過 SQL 注入攻擊取得...     │  ← 2-3 line clamp
│ sql injection flask         │  ← tags
│ 2025-03-01                  │  ← date
└─────────────────────────────┘
```

### List 模式 — 表格列

```
#001 | SQL Injection 入門 | easy | web | 2025-03-01
```

### 空狀態

```
找不到符合條件的題目
```

## UnoCSS Shortcuts

在 `uno.config.ts` 的 `shortcuts` 陣列新增：

| Shortcut | 用途 |
|----------|------|
| `ch-input` | 搜尋輸入框樣式 |
| `ch-select` | 下拉選單樣式 |
| `ch-view-btn` | 檢視切換按鈕（非啟用狀態） |
| `ch-view-btn-active` | 檢視切換按鈕（啟用狀態） |
| `ch-tag` | 標籤 pill 樣式 |
| `ch-list-row` | 列表模式每行樣式 |

所有 shortcuts 遵循現有 `ch-*` 命名慣例，使用 CSS 自訂屬性（`--ch-*`）確保深淺色主題相容。

## Risks / Trade-offs

- **風險：** 搜尋為前端記憶體篩選，當題目數超過數百題時可能有效能問題 → 緩解：目前規模（數十題）無影響，未來可改為 MiniSearch 等方案
- **風險：** Inline debounce 不如 `@vueuse/core` 的 `watchDebounced` 功能完整 → 緩解：搜尋場景單純，inline 實作足夠
- **Trade-off：** Grid 模式的 description clamp 可能截斷重要資訊 → 緩解：使用者可點擊卡片進入詳細頁
