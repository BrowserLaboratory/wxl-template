## Why

改善 Challenges 列表頁的 UI/UX 與整體頁面佈局。列表頁預設為 grid view 但資訊層次不清，且頁面寬度過窄未能善用螢幕空間。首頁「關於 WXL」段落的文字排列也需要改善。

## What Changes

1. **預設 view mode 改為 list** — `viewMode` 初始值從 `'grid'` 改為 `'list'`
2. **List view 重新設計** — 加強視覺層次：左側 ID + 難度 badge 色條、中間標題 + 描述、右側 tags + 日期；hover 時背景微亮
3. **Grid card 改善** — 調整資訊排版：標題與 badges 同行、描述獨立區塊、tags 和日期置底；增加 hover 效果
4. **統一走 `--ch-*` tokens** — 確保所有色彩引用一致
5. **Challenges 頁面改為滿版佈局** — 使用 VitePress `layout: page` 取代預設 `doc` 佈局，容器寬度從 `960px` 擴大至 `max-w-screen-xl`（1280px）
6. **首頁「關於 WXL」段落排版修正** — 移除段落 `max-w-2xl` 限制，改用 `text-justify` 兩端對齊，提升中文長段落的可讀性

## Capabilities

### New Capabilities

_無新增_

### Modified Capabilities

- `challenge-list`：頁面佈局改為 `layout: page` 滿版 + 容器寬度擴大；首頁「關於 WXL」段落排版改善

## Impact

- Affected specs: `challenge-list`（view mode 預設值 + card/list UI 規格變更 + 頁面佈局規格）
- Affected code:
  - `.vitepress/theme/components/ChallengeList.vue`（template + 容器寬度調整）
  - `.vitepress/theme/components/HomeContent.vue`（「關於 WXL」段落排版）
  - `docs/challenges.md`（frontmatter `layout: page`）
  - `uno.config.ts`（如需新增/調整 shortcut）
