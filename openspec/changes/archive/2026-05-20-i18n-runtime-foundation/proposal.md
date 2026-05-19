## Why

WXL（Web eXploitation Laboratory）作為對外可重用的純前端 WASM CTF 靶場 template，目前 UI 字串 100% 寫死成繁體中文，沒有 vue-i18n、沒有 VitePress i18n routing。前一個 change（`project-audit-and-cleanup`，已 archive）已將 4 個範例題目精簡為 1 個（`door-is-open`），現在是建立 i18n 基礎建設的乾淨切入點。本 change 不翻譯任何內容，只架設 runtime 與路由基礎，讓後續 `content-i18n-migration` / `developer-docs-english` 兩個 changes 有底層可依附。

## What Changes

- 新增 `vue-i18n@10` 為 `dependencies`，於 `.vitepress/theme/index.ts` 的 `enhanceApp` 透過 `app.use(createI18n(...))` 安裝；預設 locale 為 `en`，fallback 也是 `en`。
- 新增 `.vitepress/theme/i18n/` 目錄與 `messages/en.json`、`messages/zh-TW.json` 兩個 locale message 檔，存放從 8 個 Vue 元件（FlagSubmit、HomeContent、ChallengeList、MergedNav、NotesButton、NotesModal、NoteCard、NoteEditor）抽出的所有 UI 字串。**English 訊息為英語原文新撰**；zh-TW 訊息為現有繁中字串的逐字搬遷（無新翻譯、無內容刪改）。
- 上述 8 個元件全部改為以 `$t('<key>')` 或 `useI18n()` 取得字串，**移除元件 template 中所有 CJK 字元**（53 個出現點全清）。
- 新增 `LocaleSwitcher.vue` 元件，掛在 `MergedNav.vue`（challenge layout）與 VitePress default theme 的 nav bar slot（home/challenges/guide layout）。切換時：(a) 更新 `i18n.global.locale`、(b) 寫入 `localStorage` key `wxl-locale`、(c) 導航至對應 locale 的 URL（root ↔ `/zh-TW/` 對映）。
- 改寫 `.vitepress/config.mts` 為 VitePress `locales` 結構：root locale = `en`（lang `en-US`，label `English`），第二 locale = `zh-TW`（lang `zh-TW`，label `繁體中文`，link `/zh-TW/`）；每個 locale 各有獨立的 `themeConfig.nav` 與 `themeConfig.sidebar`，原硬編碼 zh-TW nav/sidebar 搬入 `zh-TW` locale 區塊。
- 改寫 `docs/index.md`：將寫死繁中 frontmatter（hero / features）改為英文原文；繁中版本搬到新建 `docs/zh-TW/index.md`。
- 建立 `docs/zh-TW/` 目錄骨架：`docs/zh-TW/{index.md, challenges/index.md, guide/index.md, guide/python.md, guide/terminal.md, guide/network.md}` 全為現有繁中內容直接搬移；對應的英文側（`docs/{index.md, challenges/index.md, guide/*.md}`）若無英文版則建立 **placeholder**（hero / 標題英化、內文標註 `<!-- TODO: content migration in next change -->`，但 frontmatter 與 layout 必須是正確英文 hero / 完整可導覽）。
- 新增 init-time locale 偵測：頁面載入時讀 `localStorage.wxl-locale`，若不存在則以 URL 前綴判定（`/zh-TW/*` → `zh-TW`，其餘 → `en`）；偵測結果寫回 `i18n.global.locale`。
- 新增 `tests/unit/i18n/locale-switcher.test.ts` 與 `tests/unit/i18n/messages-shape.test.ts` 兩個 vitest 檔，覆蓋切換器行為、URL 對映、persistence、與 en/zh-TW message keys 對齊性。

## Non-Goals

- **不翻譯任何 markdown 內容**（hero CTA 標題以外）：`docs/index.md` 的 features 英化是為了 hero 可運作；`docs/guide/*` 與 `docs/challenges/door-is-open/index.md` 的內文翻譯**留給下一個 change `content-i18n-migration`**，本 change 在 `docs/{guide,challenges/door-is-open}/` 下只放 placeholder。
- **不英化開發者文件**（`README.md`、`CONTRIBUTE.md`、`CLAUDE.md`、`AGENTS.md`、`GEMINI.md`）：留給 Change 4 `developer-docs-english`。
- **不引入伺服器端 locale negotiation**：純前端純 WASM 靶場無 server，僅做 `localStorage` + URL prefix 判定。
- **不引入 ICU MessageFormat / 複數 / 性別變化**：本 change 用 vue-i18n 預設 fallback 模式即可；CTF UI 字串無複雜屈折變化需求。
- **不調整 `docs/shared/challenges.data.ts` 的資料模型**：`title` / `description` 等 challenge frontmatter 欄位仍維持 single-string（內容多語化是 `content-i18n-migration` 的工作）。
- **不重做 sidebar / nav 結構**：只把現有 nav/sidebar 拆成 per-locale，項目與順序維持原樣。
- **不改 Rust WASM 模組或 challenge runtime**：i18n 純前端 Vue 層，不觸碰 `chall-wasm/*`、`scripts/challenge-keygen.ts`、`docs/.../runtime.wasm`。

## Capabilities

### New Capabilities

- `i18n-runtime`: 定義 vue-i18n 安裝與設定、locale message 檔結構、語系切換器元件契約、locale persistence 與 URL 對映規則、以及 VitePress `locales` 路由整合。涵蓋從 `enhanceApp` 安裝、init-time 偵測、執行時切換、到 message keys 命名規範的全部 runtime 行為。

### Modified Capabilities

(無 — 既有 specs 描述的是元件行為與資料結構，本 change 在其上加一層 i18n indirection，元件對外契約不變。)

## Impact

- Affected specs: 新增 `openspec/specs/i18n-runtime/spec.md`。
- Affected dependencies:
  - 新增 `vue-i18n@^10` 至 `package.json` `dependencies`。
  - `pnpm install` 必須能解析該版本與 vue@3.5.30 共存（vue-i18n@10 支援 Vue 3 Composition API）。
- Affected code（修改）：
  - `.vitepress/config.mts`（locales 結構重寫）
  - `.vitepress/theme/index.ts`（`createI18n` 安裝、locale 偵測 hook）
  - `.vitepress/theme/components/FlagSubmit.vue`
  - `.vitepress/theme/components/HomeContent.vue`
  - `.vitepress/theme/components/ChallengeList.vue`
  - `.vitepress/theme/components/MergedNav.vue`
  - `.vitepress/theme/components/NotesButton.vue`
  - `.vitepress/theme/components/NotesModal.vue`
  - `.vitepress/theme/components/NoteCard.vue`
  - `.vitepress/theme/components/NoteEditor.vue`
  - `docs/index.md`（hero / features 英化）
- Affected code（新增）：
  - `.vitepress/theme/i18n/index.ts`（createI18n + locale 偵測 + persistence helper）
  - `.vitepress/theme/i18n/messages/en.json`
  - `.vitepress/theme/i18n/messages/zh-TW.json`
  - `.vitepress/theme/components/LocaleSwitcher.vue`
  - `docs/zh-TW/index.md`、`docs/zh-TW/challenges/index.md`、`docs/zh-TW/guide/{index,python,terminal,network}.md`
  - `docs/challenges/index.md` 英化 placeholder（若不存在）、`docs/guide/{python,terminal,network}.md` 英化 placeholder
  - `tests/unit/i18n/locale-switcher.test.ts`
  - `tests/unit/i18n/messages-shape.test.ts`
- Affected pipeline:
  - `pnpm docs:build` 須能同時 build root 與 `/zh-TW/` 兩條樹（VitePress 內建支援）。
  - `pnpm test` 必須涵蓋新增的 i18n unit tests。
  - 既有 vitest（含 `CodeEditorPanel` 5 個 already-failing tests，見 `AUDIT.md` §A.3）狀態不得退化 — 本 change 不修也不增加失敗數。
