## 1. 預設 view mode 改為 list

- [x] 1.1 將 `ChallengeList.vue` 的 `viewMode` ref 初始值從 `'grid'` 改為 `'list'`，實現 challenge list supports grid and list view modes 的 default view is list mode

## 2. List view row 重新設計

- [x] 2.1 重寫 `ChallengeList.vue` 的 list view template 為兩行結構：第一行 ID + 標題 + badges + 日期，第二行描述 + tags，實現 list view displays two-line rows with full information
- [x] 2.2 加上 list row hover 效果：背景色 `var(--ch-bg-soft)` + 左側 2px accent 色條

## 3. Grid card 改善

- [x] 3.1 調整 `ChallengeList.vue` 的 grid card template：改善資訊分群（標題行、badges 行、描述區、底部 tags+日期），實現 grid view displays enhanced cards
- [x] 3.2 加上 grid card hover 效果：border 變色（`var(--ch-border-hover)`）+ `translateY(-2px)` + shadow

## 4. 測試驗證

- [x] 4.1 執行 `pnpm test -- --run` 確認所有單元測試通過
- [x] 4.2 手動驗證 list view（dark/light）：兩行結構、hover 效果、篩選排序正常
- [x] 4.3 手動驗證 grid view（dark/light）：card 層次清晰、hover 效果

## 5. Challenges 頁面改為滿版佈局

- [x] 5.1 在 `docs/challenges.md` frontmatter 加上 `layout: page`，實現 challenges page uses full-width page layout
- [x] 5.2 將 `ChallengeList.vue` 容器從 `max-w-[960px]` 改為 `max-w-screen-xl`，實現 challenges page renders at full width

## 6. 首頁「關於 WXL」段落排版修正

- [x] 6.1 移除 `HomeContent.vue` 段落的 `max-w-2xl` 限制，改用 `text-justify` 兩端對齊 + `leading-loose` 行距，實現 homepage about section uses justified text alignment
