## Context

WXL 的 i18n 改造分為四個 changes，本 change 是第三個。Change 1（`project-audit-and-cleanup`，archived 2026-05-19）建立基準並精簡 demo 題目；Change 2（`i18n-runtime-foundation`，archived 2026-05-20）裝設 vue-i18n v10、抽 8 個元件硬編碼字串、建立 `docs/zh-TW/` 平行樹、LocaleSwitcher、init-time locale detection。

Change 2 完成後留下三條未盡之事，由本 change 補完：

1. **markdown 內容 placeholder**：`docs/guide/{index,python,terminal,network}.md` 與 `docs/challenge/door-is-open/index.md` 之 body 在 Change 2 留下英文 placeholder（含 `<!-- TODO: full content migration in change content-i18n-migration -->`），主因是 Change 2 已 scope 為「runtime + 元件字串抽取」、不負責產出 markdown 真實內文。
2. **challenge 雙語資料載入**：Change 2 在其 Non-Goals 明示「不調整 `docs/shared/challenges.data.ts` 的資料模型」。當前 `docs/zh-TW/index.md` 與 `docs/zh-TW/challenges.md` 仍 import 英文 loader，造成 zh-TW 首頁與 challenge 列表顯示英文 challenge 卡片。
3. **元件 `formatDate` locale 寫死**：`HomeContent.vue:38` 與 `ChallengeList.vue:102` 都呼叫 `toLocaleDateString('zh-TW', ...)`，在英文頁面會顯示繁中格式日期（「2026年4月2日」而非「Apr 2, 2026」），與 i18n 主題不一致。

事實核對結果（plan 階段已完成）：
- `HomeContent.vue` / `ChallengeList.vue` 皆以 `defineProps<{ challenges: ChallengeData[] }>` 接收資料；資料 import 發生在 4 個 markdown 頁面的 `<script setup>`，元件本身對資料來源是中立的。
- `ChallengeLayout.vue` 從未讀取 `fm.value.app`（grep 0 hits）；app 程式碼於 `challenge:keygen` 階段加密進 `runtime.wasm` 的 `__app__` custom section；`wasmModule` 為絕對路徑 `/challenge/door-is-open/runtime.wasm`，自任何頁面 URL 解析結果相同。zh-TW challenge 樹不需複製 `src/` 與 `runtime.wasm`。
- `challenge-list` capability 之既有 requirement 規範「ChallengeData.difficulty 為 closed union `'easy' | 'medium' | 'hard' | 'mystery'`」必須在新 loader 維持。

## Goals / Non-Goals

**Goals:**

- 補齊英文側 markdown 之真實內文，使 `/` 與 `/guide/*` 在 English locale 下可獨立閱讀。
- 完成 challenge 資料雙語化，使 `/zh-TW/` 與 `/zh-TW/challenges/` 顯示繁中 challenge 卡片、`/` 與 `/challenges/` 顯示英文 challenge 卡片。
- 在 `docs/zh-TW/challenge/door-is-open/index.md` 提供繁中 challenge 描述；英文版維持英文。
- 修補元件層 `formatDate` 之 hardcoded locale，使日期顯示與當前語系一致。
- 保留 Change 2 既有 i18n 元件契約（props / emits / template 結構）、`.vitepress/config.mts` locales 結構、message key namespace 與既有 vitest 測試集。
- 在每個 stage 結束以 `/spectra-audit` + `/tw-emoji-commit` 收尾，最終 stage 5 加上「artifact 層 `spectra analyze`」與「code 層 `/spectra-audit` 累計 diff 稽核」雙重 gate。

**Non-Goals:**

- 不英化 `docs/challenge/door-is-open/src/app.py` 內 HTML 字串（攻擊目標 app 內部 UI 故意保持單語）。
- 不英化 `README.md`、`CONTRIBUTE.md`、`CLAUDE.md`、`AGENTS.md`、`GEMINI.md`、`openspec/specs/**/spec.md`（Change 4 範圍）。
- 不修改 `.vitepress/config.mts` 之 locales / nav / sidebar 結構。
- 不新增 vue-i18n message key、不修改 `.vitepress/theme/i18n/messages/*.json`。
- 不修改 Vue 元件之 props / emits / template；`formatDate` 僅內部實作改 locale-aware。
- 不擴大 `ChallengeData` 介面（不引入 `titleEn` / `titleZh` 雙欄位）。
- 不修改 Rust / WASM 模組、`scripts/challenge-keygen.ts`、`runtime.wasm`。
- 不複製 `docs/challenge/door-is-open/src/` 或 `runtime.wasm` 至 zh-TW 樹。
- 不處理 `tests/unit/components/CodeEditorPanel.test.ts` 5 個 known regression（已 parked 為 `fix-codeeditorpanel-vitest-regression`）。
- 不新增 vitest 測試（既有 i18n 測試自然通過即可）。

## Decisions

### Per-locale data loader 採「新增 zh-TW loader + markdown 頁面切換 import」

**選擇：** 新增 `docs/shared/challenges.zh-TW.data.ts`，`docs/zh-TW/index.md` 與 `docs/zh-TW/challenges.md` 切換其 import path 指向此檔。`HomeContent.vue` 與 `ChallengeList.vue` 元件不動。

**理由：**
- VitePress `createContentLoader` 設計為單一 glob 對應單一 `.data.ts` 檔；各 locale 一個 loader 是符合 VitePress 慣例的最小修改。
- 元件以 props 接收資料、對來源中立，將切換邏輯放在 markdown 頁面層保持元件純粹。
- `ChallengeData` 介面唯一定義並 re-import，避免型別重複；spec 層既有 closed difficulty union 自動繼承。

**Alternatives Considered:**
- **Option A — Loader 不變、雙語共用英文資料**：被否決，理由是 zh-TW 使用者看到英文 challenge 標題與描述破壞 i18n 一致性。
- **Option C — 單一 loader 同時掃兩棵樹、輸出 `{ titleEn, titleZh }` 雙欄位**：被否決，理由是會破壞 `ChallengeData` 既有 single-string shape、需要修改元件對欄位的存取邏輯、未來新增第三 locale 時需再次擴張型別。Option B 在新增 locale 時 pattern 一致（再加一個 loader）。

### `formatDate` locale 取得方式採「`useI18n()` 直接讀 `locale.value`」

**選擇：** `HomeContent.vue` 與 `ChallengeList.vue` 之 `formatDate` 內 `import { useI18n } from 'vue-i18n'`，於 `<script setup>` 取 `const { locale } = useI18n()`，呼叫 `toLocaleDateString(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', { ... })`。

**理由：**
- 與 Change 2 既有「`$t('...')` 對 message、`useI18n()` 對 locale 自身」分工一致。
- `locale.value` 是 reactive `Ref<string>`，可被 Vue 自動追蹤；切換語系時日期格式即時更新無需手動 watch。
- 明確映射兩個合法 locale 到對應 BCP-47 標籤（`'zh-TW'` → `'zh-TW'`、`'en'` → `'en-US'`）；對未知 locale 退化為 `'en-US'` 較 `undefined`（依瀏覽器）更可預測。

**Alternatives Considered:**
- **將 `formatDate` 抽到共用 composable**：被否決，理由是只兩處使用、抽 composable 反而增加 indirection；若未來再加多處使用點再抽即可。
- **保留 `'zh-TW'` hardcoded、視為「平台預設」**：被否決，與 Change 2 i18n 主題嚴重不一致；英文使用者看繁中日期突兀。

### Challenge 雙語化採「資料層解決、layout 不動」

**選擇：** 在 `docs/challenge/door-is-open/index.md` 與新建的 `docs/zh-TW/challenge/door-is-open/index.md` 各自寫入該 locale 的 `title` / `description` frontmatter；body markdown 各自為對應語系內文。`ChallengeLayout.vue` 不動。

**理由：**
- VitePress 路由把 `/challenge/door-is-open/` 與 `/zh-TW/challenge/door-is-open/` 視為兩個獨立頁面、各自渲染 frontmatter；layout 讀 `fm.value.title` / `fm.value.description` 自然取到正確語系資料。
- 避開觸碰 ChallengeLayout（Change 2 大量 i18n wiring 已在裡面、動它風險高）。
- 兩語系 challenge frontmatter 之 `date`、`difficulty`、`category`、`backend`、`tags`、`wasmModule` 等技術欄位必須逐字一致，以保證 ChallengeList 排序、篩選、執行時行為跨語系一致。

**Alternatives Considered:**
- **將 challenge 之 title/description 抽到 vue-i18n message keys**：被否決，理由是 challenge frontmatter 是內容資料而非 UI 字串、新增 challenge 時必須同步 5 處（frontmatter + 兩 locale message + ChallengeLayout 讀取邏輯 + 測試），增加 wxl-creator skill 與貢獻者的 cognitive load；per-locale markdown 是 VitePress 慣用 pattern。

### zh-TW challenge 樹不複製 `src/` 與 `runtime.wasm`

**選擇：** `docs/zh-TW/challenge/door-is-open/` 只建立 `index.md`，不建立 `src/` 子樹、不複製 `runtime.wasm`。

**理由：**
- `ChallengeLayout.vue` 從未讀取 `fm.value.app`；`app:` 是給人類讀者參考的純文件型 frontmatter。
- App 程式碼來自 `runtime.wasm` 的 `__app__` custom section，由 `pnpm challenge:keygen` 在 build 時加密。
- `wasmModule` 為絕對路徑 `/challenge/door-is-open/runtime.wasm`，自 zh-TW 頁面 fetch 仍會擊中同一檔；題目實作完全共用，僅 challenge 敘述語言不同。

### 五階段切分搭配雙層稽核 gate

**選擇：** Stage 1（zh-TW challenge tree + 英文 body）→ Stage 2（data loader 雙語化 + `formatDate` 修補）→ Stage 3（`docs/guide/index.md` 英化）→ Stage 4（其餘三 guide 英化、`[P]` 並行）→ Stage 5（完整 pipeline + artifact 層 `spectra analyze` + code 層 `/spectra-audit`）。每 stage 結束以 `/spectra-audit` + `/tw-emoji-commit` 收尾。

**理由：**
- Stage 順序確保 Stage 2 之 import path 切換在 Stage 1 zh-TW challenge index.md 存在之後才執行，避免 404。
- Stage 3 與 Stage 4 拆分是因 `docs/guide/index.md` 是 sidebar 入口、必須先就位；其餘三 guide page 之間互不依賴，可並行（`[P]` 標記）。
- Stage 5 雙層稽核（artifact 層 + code 層）是本 change 在 Change 2 既有 stage-end pattern 之上的強化，回應 i18n 內容改動可能引入的安全與穩定性議題（如 stringly-typed import path 切換、`createContentLoader` glob 失配 silent fallback、跨 locale slug 不對齊造成卡片缺漏等）。

## Implementation Contract

### Observable Behavior

完成本 change 後，使用者在瀏覽器看到的可觀察行為：

1. 開啟 `/`（English root）：hero 顯示英文、首頁 challenge 卡片顯示英文 `Door Is Open` 標題與英文 IDOR 描述、卡片日期格式為 `Apr 2, 2026` 風格。
2. 開啟 `/zh-TW/`：hero 顯示繁中、首頁 challenge 卡片顯示繁中 `門已敞開` 標題與繁中描述、卡片日期格式為 `2026年4月` 風格。
3. 開啟 `/challenges`：英文 ChallengeList 顯示英文卡片；`/zh-TW/challenges` 顯示繁中卡片。
4. 開啟 `/guide/`、`/guide/python`、`/guide/terminal`、`/guide/network`：顯示完整英文 Getting Started / Python / Terminal / Network 文件，無 placeholder 與 TODO 文字。對應 `/zh-TW/guide/*` 路徑仍顯示既有繁中內容（Change 2 已建立）。
5. 開啟 `/challenge/door-is-open/`：題目敘述為英文；`/zh-TW/challenge/door-is-open/` 顯示繁中敘述。兩語系底層共用同一個 `runtime.wasm`，挑戰功能（WASM 載入、Pyodide 執行、flag 驗證）行為完全一致。
6. 在任一頁面點 LocaleSwitcher，URL 與內容同步切換；日期格式即時隨 locale 變化（reactive）；`localStorage.wxl-locale` 寫入正確值。

### Interface / Data Shape

- **新增模組**：`docs/shared/challenges.zh-TW.data.ts`，default export 為 VitePress `createContentLoader` 結果，內部 `transform` 回傳 `ChallengeData[]`；`ChallengeData` 型別自 `./challenges.data` `import type` 重用。
- **修改之 data fallback 字串**：`docs/shared/challenges.data.ts` 之 `title` fallback 由 `'網站攻防挑戰'` 改為 `'Web exploitation challenge'`、`category` fallback 由 `'綜合'` 改為 `'General'`。介面型別簽章 `ChallengeData` 不動。
- **`formatDate` 介面**：保持為元件內 local function `(d: string | null | undefined) => string`，呼叫端不變；內部實作改為 reactive locale-aware。
- **Markdown frontmatter 契約**：`docs/zh-TW/challenge/door-is-open/index.md` 之 frontmatter 與英文版逐字一致，僅 `title` / `description` 替換為繁中；`difficulty`、`category`、`backend`、`app`、`packages`、`tools`、`source_visible`、`date`、`tags`、`wasmModule` 維持英文版原值（特別是 `date` ISO timestamp 必須相同）。

### Failure Modes

- **zh-TW loader glob 不命中**：若 `zh-TW/challenge/*/index.md` 不存在或 0 個檔案命中，`createContentLoader` 回傳空陣列。`ChallengeList.vue` 既有邏輯顯示 empty state（vue-i18n message key `challenge_list.empty_state`），不拋例外。屬於可接受退化行為。
- **frontmatter `date` 缺漏**：`HomeContent.vue` 的 `latestChallenges` computed 已 `.filter(c => c.date)`；缺漏者不參與最新 3 筆排序，亦不報錯。屬於既有 graceful skip 行為。
- **元件 `useI18n()` 在 SSR 階段呼叫**：vue-i18n v10 之 `useI18n()` 在 SSR context 仍可正常回傳 reactive locale ref（Change 2 之 Stage 7 已驗證 SSR 不因 vue-i18n 而失敗）。本 change 不改變此契約。
- **未知 locale**：`formatDate` 對 `locale.value` 非 `'zh-TW'` 之值統一退化為 `'en-US'`，避免將任意字串傳給 `Intl.DateTimeFormat` 造成 RangeError。

### Acceptance Criteria

實作完成後須通過以下檢查（與 Change 2 Stage 9 同等嚴格，並額外加上 code-level 稽核）：

1. `rg '[一-鿿]' docs/index.md docs/challenges.md docs/guide/ docs/challenge/door-is-open/index.md docs/shared/challenges.data.ts` exit 1（0 hits 跨英文側 markdown 與英文 loader）。
2. `pnpm docs:build` exit 0；`dist/` 同時存在英文側與 `dist/zh-TW/` 對應檔案（含 challenge 子樹）；兩側 HTML `<html lang>` 各自正確。
3. `pnpm test --run` 失敗數 = 5（AUDIT.md §A.3 既知 CodeEditorPanel regression），不得新增任何失敗；既有 `tests/unit/i18n/*.test.ts` 全綠。
4. `pnpm challenge:validate` exit 0、`cargo test --workspace` exit 0。
5. 手動瀏覽器測試 14 個路由（`/`、`/zh-TW/`、`/challenges`、`/zh-TW/challenges`、`/guide/`、`/zh-TW/guide/`、`/challenge/door-is-open/`、`/zh-TW/challenge/door-is-open/`、`/guide/python`、`/zh-TW/guide/python`、`/guide/terminal`、`/zh-TW/guide/terminal`、`/guide/network`、`/zh-TW/guide/network`），每路由雙向切換 LocaleSwitcher、確認 URL 對映、`localStorage.wxl-locale` 寫入、首頁日期格式隨 locale 變化、challenge 卡片標題與描述語言切換。
6. Stage 5 雙層稽核：`spectra analyze content-i18n-migration --json` Critical+High = 0；`spectra validate content-i18n-migration` exit 0；對累計 diff 跑 `/spectra-audit` Critical+High = 0、Medium/Low 已在 commit message 或 design.md 中明確處置。

### Scope Boundaries

**In scope:**
- `docs/zh-TW/challenge/door-is-open/index.md` 新建與 frontmatter / body 撰寫。
- `docs/challenge/door-is-open/index.md` body 英化（frontmatter 不動）。
- `docs/shared/challenges.zh-TW.data.ts` 新建。
- `docs/shared/challenges.data.ts` fallback 字串英化。
- `docs/zh-TW/index.md` 與 `docs/zh-TW/challenges.md` 之 import path 切換。
- `docs/guide/{index,python,terminal,network}.md` 真實英文內容撰寫，結構與 zh-TW 來源 1:1 對應。
- `HomeContent.vue` 與 `ChallengeList.vue` 之 `formatDate` 改 locale-aware（僅內部實作，介面不動）。

**Out of scope:**
- `docs/challenge/door-is-open/src/*` 任何檔案（攻擊目標 app 內部 UI）。
- `docs/challenge/door-is-open/runtime.wasm`、`scripts/challenge-keygen.ts`、`chall-wasm/*`。
- `.vitepress/config.mts`（locales / nav / sidebar 結構）。
- `.vitepress/theme/i18n/messages/*.json`（不新增 message key）。
- `.vitepress/theme/layouts/ChallengeLayout.vue`、`.vitepress/theme/components/{LocaleSwitcher,MergedNav,FlagSubmit,NotesButton,NotesModal,NoteCard,NoteEditor}.vue`。
- `tests/unit/**`（不新增、不修改既有測試）。
- README、CONTRIBUTE、CLAUDE.md、AGENTS.md、GEMINI.md、openspec/specs/**（Change 4）。
- `fix-codeeditorpanel-vitest-regression` 之 5 個 known-fail（parked，本 change 之外處理）。

## Risks / Trade-offs

- **[Risk] 兩棵 challenge tree 之 slug 集合不對齊** → Mitigation：本 change 僅有單一 challenge `door-is-open`，slug 必然對齊；未來新增 challenge 時須同步建立 `docs/challenge/<slug>/` 與 `docs/zh-TW/challenge/<slug>/`，此規則應在後續 change（或 wxl-creator skill 更新）中強制化。本 change 不負責建立該強制機制，但 Stage 5 `/spectra-audit` 會檢查跨樹 slug 對齊情況並視需要建議補強。
- **[Risk] zh-TW frontmatter `date` 與英文版不一致導致 ChallengeList 排序錯亂** → Mitigation：Stage 1.1 task 描述明示 zh-TW frontmatter 之 `date` 必須與英文版逐字相同；Stage 5 code-level audit 會抽查此一致性。
- **[Risk] `formatDate` `useI18n()` 在 SSR 階段缺 i18n context 而拋例外** → Mitigation：vue-i18n v10 之 `useI18n()` 在 SSR 仍回傳 reactive locale ref（Change 2 Stage 7 已驗證）；若意外 regress，Stage 5.2 `pnpm docs:build` 立即失敗、無法跳過。
- **[Risk] 英文 guide 內容品質參差不齊** → Mitigation：撰寫時要求結構與 zh-TW 1:1 對應、技術術語英文原文保留、code block 逐字搬遷；review 階段可依此三條客觀規則判定；Stage 5 手動瀏覽器測試亦會發現顯眼的措辭問題。
- **[Trade-off] 兩個 data loader 帶來代碼重複（transform 邏輯近乎相同）** → 接受：複製成本約 25 行 TypeScript；換來型別介面唯一定義（`ChallengeData` re-import）、各 locale 資料完全獨立、未來新增第三 locale 時 pattern 一致（再加一個 loader）。若未來 locale 數量達 4+ 個再評估是否抽通用 loader factory。
- **[Trade-off] `formatDate` 對未知 locale 退化為 `'en-US'` 而非 browser default** → 接受：本 change 之合法 locale 只有 `'zh-TW'` 與 `'en'`；退化為 `'en-US'` 比 `undefined`（依瀏覽器 / OS 設定）更可預測，避免在 user agent 為日文或韓文系統時意外看到日韓格式日期。
- **[Trade-off] 不建立 zh-TW `src/` 鏡像導致 `app: app.py` frontmatter 在 zh-TW 頁面 source view 上指向「不存在於同層」之路徑** → 接受：`source_visible: false`（door-is-open 之設定），題目原始碼預設不顯示給挑戰者；即便切到 true，亦會以英文版 `src/` 路徑（共用）為唯一 source；無語意分歧風險。
