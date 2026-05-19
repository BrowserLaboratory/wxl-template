## Context

Challenge 資料模型定義在 `.vitepress/challenge/config.ts`（`ChallengeConfig` interface）和 `docs/shared/challenges.data.ts`（`ChallengeData` interface + `createContentLoader` transform）。目前缺少 `date` 和 `tags` 欄位，限制了前端的排序、篩選和搜尋能力。`create-challenge.ts` script 負責生成新挑戰的 frontmatter，需同步更新以自動填入新欄位。

## Goals / Non-Goals

**Goals:**

- 擴充 `ChallengeConfig` 和 `ChallengeData` interfaces 以支援 `date` 和 `tags`
- 更新 data loader 提取新欄位供前端使用
- 更新 scaffold script 自動填入 `date`（ISO 8601 格式，系統時區）
- 為現有 3 個 challenge 補上 `date` 和 `tags` frontmatter

**Non-Goals:**

- 前端 UI 改版（由後續 changes 處理）
- 全文搜尋索引建置
- i18n / 多語系支援

## Decisions

### 使用 ISO 8601 格式儲存日期

日期欄位使用 `new Date().toISOString()` 產生 ISO 8601 格式字串（如 `2025-03-01T10:30:00.000Z`）。此格式可直接排序、跨時區一致，且 JavaScript `Date` 構造器原生支援。

**替代方案：** 僅用 `YYYY-MM-DD` 日期字串 — 排序功能相同但失去時間精度。鑒於未來可能需要精確排序，選擇完整 ISO 8601。

### Tags 為 string array 儲存於 frontmatter

`tags` 作為 `string[]` 儲存在 YAML frontmatter 中（如 `tags: [sql, injection, flask]`），不設定固定的 tag taxonomy。前端從資料中動態提取可用 tags。

**替代方案：** 使用 enum 限制合法 tags — 過於僵化，不利於快速新增挑戰。

### 所有新欄位皆為 optional

保持向後相容，不修改 `REQUIRED` 陣列。Data loader 對缺少新欄位的 challenge 提供 fallback 值（`date: null`, `tags: []`, `description: ''`）。

## Risks / Trade-offs

- **風險：** 現有 challenge 若未手動補上 `date`，排序時會排在最後 → 緩解：Phase 0 中統一補齊所有現有 challenge 的 `date`
- **風險：** `tags` 無驗證規範，可能出現不一致的標籤命名 → 緩解：由 contributor guide 規範 tag 命名慣例（lowercase, kebab-case），但不在此 change 中強制驗證
