## Context

`ChallengeList.vue` 提供 grid 和 list 兩種 view mode，預設為 grid（2 columns auto-fill）。Grid card 使用 `ch-card` UnoCSS shortcut。List view 使用 `ch-list-row` shortcut，呈現為表格式單行。

目前 grid card 內的資訊排列為：ID+標題 → badges → 描述 → tags → 日期，所有元素從上到下堆疊，缺乏視覺分群。List row 則只顯示 ID、標題、badges、日期，資訊量較少但整齊。

## Goals / Non-Goals

**Goals:**

- 預設 view mode 改為 list
- List view row 增加描述和 tags 顯示，提供更完整的資訊
- Grid card 改善視覺層次和 hover 效果
- 維持已有的篩選、排序、搜尋功能不變

**Non-Goals:**

- 不新增功能（如 pagination、infinite scroll）
- 不改動資料結構或 challenges.data.ts
- 不修改 toolbar 的篩選/排序 UI

## Decisions

### 預設 view mode 改為 list

`viewMode` 的 `ref` 初始值從 `'grid'` 改為 `'list'`。使用者切換後 view mode 仍保持在當前選擇。

### List view row 重新設計

改為兩行結構：
- 第一行：ID badge + 標題 + difficulty/category badges + 日期（右對齊）
- 第二行：描述（truncate 單行）+ tags

```
┌──────────────────────────────────────────────────────────┐
│  #001  FastAPI IDOR Demo      [easy] [web]   2025年4月1日 │
│  A FastAPI notes app with an IDOR vulnerability...  idor │
└──────────────────────────────────────────────────────────┘
```

Row hover 效果：背景色微亮（`--ch-bg-soft`），左側加 2px accent 色條。

### Grid card 改善

- 標題行：ID 和標題獨立一行，字級稍大
- Badges 行：difficulty + category 並排
- 描述區：獨立段落，2 行 line-clamp
- 底部：tags + 日期，以 flex spacer 分隔

Hover 效果增強：border 變色（`--ch-border-hover`）+ 微上移（`translateY(-2px)`）+ shadow。

### Challenges 頁面改為滿版佈局

`challenges.md` frontmatter 加上 `layout: page`，使 VitePress 以全寬 `.VPPage` 渲染（而非預設 `.VPDoc` 的 ~688px 限制）。`ChallengeList.vue` 容器寬度從 `max-w-[960px]` 改為 `max-w-screen-xl`（1280px），讓內容在寬螢幕下善用空間，同時保持置中。

### 首頁「關於 WXL」段落排版修正

`HomeContent.vue` 的「關於 WXL」段落移除 `max-w-2xl`（672px）限制，讓文字填滿 section 寬度（`max-w-screen-lg` = 1024px）。改用 `text-justify` 兩端對齊，避免中文長段落置中排列時最後一行懸空不美觀。行距從 `leading-relaxed` 改為 `leading-loose`，提升可讀性。

## Risks / Trade-offs

- [取捨] List view 增加描述和 tags 會讓 row 高度從單行變為兩行 → 可接受，資訊量更豐富
- [取捨] 預設改為 list 可能影響偏好 grid 的使用者 → Grid 仍可手動切換，影響很小
- [取捨] Challenges 頁面 `layout: page` 不再有 VitePress 預設 doc 容器 → 可接受，ChallengeList 自帶容器控制寬度
- [取捨] 「關於 WXL」段落改為兩端對齊 → 中文排版更整齊，僅最後一行保持自然收尾
