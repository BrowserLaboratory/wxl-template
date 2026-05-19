<!--
Behavior + verification per task. File paths are locator context, not the task.
[P] = parallel-eligible (different files, no dependency on incomplete tasks in same group).
Stages map to design.md decisions; each stage ends with /spectra-audit + /tw-emoji-commit.
-->

## 1. 安裝 vue-i18n v10 與 i18n module 骨架

- [x] 1.1 將 `vue-i18n@^10` 加入 `package.json` 的 `dependencies`，使 `pnpm install` 完成後 `node_modules/vue-i18n/package.json` 的 `version` 落在 `^10` 範圍。此 task 對應設計決策「vue-i18n v10 with Composition API mode and global injection」與規格「vue-i18n plugin installed via enhanceApp with English as default and fallback locale」之依賴條件。Verification：`pnpm install` exit 0；`pnpm ls vue-i18n --depth 0` 顯示 `vue-i18n ^10.x.x`。
- [x] 1.2 建立 `.vitepress/theme/i18n/index.ts` 模組，預設 export `createI18n` 實例（`legacy: false`, `locale: 'en'`, `fallbackLocale: 'en'`, `globalInjection: true`, `messages` 載自 `./messages/en.json` 與 `./messages/zh-TW.json`），並 named-export `detectInitialLocale()` 與 `persistLocale(loc)` 兩個 helper（其行為遵循「Locale persistence: localStorage with key `wxl-locale`, init-time precedence」設計決策）。Verification：`pnpm exec tsc --noEmit` 對該模組無型別錯誤；後續 task 1.3 引用該模組 build 可通過。
- [x] 1.3 在 `.vitepress/theme/index.ts` 的 `enhanceApp` 中於 `app.use(createPinia())` 之後加入 `app.use(i18n)`，使任一元件 `setup()` 內 `useI18n()` 不再拋例外，達成規格「vue-i18n plugin installed via enhanceApp with English as default and fallback locale」之第一個 Scenario（enhanceApp installs i18n alongside Pinia）。Verification：`pnpm wasm:build && pnpm challenge:keygen && pnpm docs:build` exit 0（未動 component 字串時 build 仍綠）。
- [x] 1.4 Stage 1 收尾：執行 `/spectra-audit`，無 Critical/High finding 後以 `/tw-emoji-commit` 產 commit。Verification：`spectra analyze i18n-runtime-foundation --json` 之 Critical+High 計數為 0；`git log --oneline -1` 顯示符合台灣繁中慣例的 emoji commit 訊息。

## 2. Locale message files 與 key 命名骨架

- [x] 2.1 建立 `.vitepress/theme/i18n/messages/en.json` 與 `.vitepress/theme/i18n/messages/zh-TW.json`，先放入 `locale_switcher.english_label`、`locale_switcher.tw_label`、`locale_switcher.button_aria` 三個 key（採設計決策「Message key naming: namespaced by component, snake_case leaves」之兩階 namespacing 規範），en 值為英文 / zh-TW 值為「English」「繁體中文」「切換語系」對應台灣繁中。Verification：兩檔以 `JSON.parse` 解析無錯；en.json 之 leaf 無 U+4E00–U+9FFF 字元（`rg '[一-鿿]' .vitepress/theme/i18n/messages/en.json` exit 1）；zh-TW.json `locale_switcher.tw_label` 與 `locale_switcher.button_aria` 之 leaf 含 CJK。此 task 為規格「Locale message files exist for en and zh-TW with parity of keys」之骨架階段。

## 3. VitePress locales routing 設定

- [x] 3.1 改寫 `.vitepress/config.mts`，把現有 `themeConfig.nav` 與 `themeConfig.sidebar` 拆分到 `locales.root.themeConfig`（lang `en-US`, label `English`, nav/sidebar 內文均為英文 placeholder）與 `locales.zh-TW.themeConfig`（lang `zh-TW`, label `繁體中文`, link `/zh-TW/`, nav/sidebar 內文沿用原繁中），實現規格「VitePress config exposes locales for root EN and zh-TW subpath」與設計決策「English as root locale, Traditional Chinese under /zh-TW/」「VitePress config: locales structure with per-locale themeConfig」。Verification：`pnpm docs:build` exit 0；`ls .vitepress/dist/index.html .vitepress/dist/zh-TW/index.html` 兩個檔案皆存在；用 `head -c 200` 檢視兩檔的 `<html lang="...">` 分別為 `en-US` 與 `zh-TW`。
- [ ] 3.2 Stage 3 收尾：執行 `/spectra-audit` 後以 `/tw-emoji-commit` commit。Verification：`spectra analyze i18n-runtime-foundation --json` 之 Critical+High 計數仍為 0；commit 訊息符合台灣繁中慣例。

## 4. docs/zh-TW/ 平行樹建立與英文側 placeholder

- [x] 4.1 [P] 將 `docs/index.md` 既有繁中 frontmatter 與內文（hero name/text/tagline、actions text、features title+details）一字不變搬到新建的 `docs/zh-TW/index.md`，達成設計決策「docs/zh-TW/ 平行樹建立策略：搬移既有繁中，英文側補 placeholder」與規格「docs/zh-TW/ parallel tree carries existing Traditional Chinese content」之首個 Scenario（zh-TW home page preserves existing hero）。Verification：手動逐欄比對 `docs/zh-TW/index.md` 與 git 中 `docs/index.md` 該次 change 開始前版本的 hero/features 條目逐字相同（用 `git show <pre-change-commit>:docs/index.md` 對照）。
- [x] 4.2 [P] 改寫 `docs/index.md` 為英文版（hero name 維持 `WXL`，text/tagline/actions/features 全英文），達成規格「docs/zh-TW/ parallel tree carries existing Traditional Chinese content」之第二 Scenario（English root home has English hero and features）。Verification：`rg '[一-鿿]' docs/index.md` exit 1（0 hits）；`pnpm docs:dev` 開啟 `/` 看到英文 hero。
- [x] 4.3 [P] 建立 `docs/zh-TW/{challenges/index.md, guide/index.md, guide/python.md, guide/terminal.md, guide/network.md}` 五個檔，內容從 `docs/{challenges.md, guide/index.md, guide/python.md, guide/terminal.md, guide/network.md}` 對應檔直接搬移繁中內文（VitePress 會自動將 `challenges.md` 與 `challenges/index.md` 視為同一路由，若原為 `challenges.md` 則新檔為 `docs/zh-TW/challenges.md`）。Verification：每個新檔以 `wc -c` 字元數與來源檔相同（誤差 ≤ 5 bytes 容忍 newline 差異）；`rg '[一-鿿]' docs/zh-TW/` 回傳 > 50 行（證實繁中內容入位）。
- [x] 4.4 [P] 在英文側建立 placeholder：`docs/challenges.md`（或 `docs/challenges/index.md` 視原檔位置）、`docs/guide/{index,python,terminal,network}.md` 內容改為英文 frontmatter（title 英文）+ `# Title` 英文標題 + `<!-- TODO: full content migration in change content-i18n-migration -->` 註記，使 root locale 樹仍可導覽。Verification：`rg '[一-鿿]' docs/challenges.md docs/guide/` exit 1（0 hits）；`pnpm docs:build` 後 `dist/challenges.html` 與 `dist/guide/*.html` 皆存在且回應 200。
- [ ] 4.5 Stage 4 收尾：執行 `/spectra-audit` + `/tw-emoji-commit`。Verification：`spectra analyze` Critical+High = 0；`pnpm docs:build` exit 0；`rg '[一-鿿]' docs/index.md docs/challenges.md docs/guide/` exit 1。

## 5. 抽 8 個元件 CJK 字串至 messages，元件改用 $t()

每個 5.x 任務的共同 verification 形狀：(a) 該檔 `rg '[一-鿿]'` exit 1（0 hits）；(b) 該元件對應的 message keys 同時存在於 en.json 與 zh-TW.json（手動 diff 或於 Stage 8 messages-shape test 自動覆蓋）；(c) zh-TW message 為原 CJK 字串 byte-equivalent 搬遷（無翻譯改寫）。本群實現規格「Vue components in custom theme do not contain CJK literals in template or attribute strings」與設計決策「Component refactor pattern: $t() in template, useI18n() in script when needed」。

- [ ] 5.1 [P] 抽 `.vitepress/theme/components/FlagSubmit.vue` 中 `下載攻擊紀錄` / `下載滲透筆記` 兩個 button text 為 `$t('flag_submit.export_attack_log')` 與 `$t('flag_submit.export_pentest_notes')`；en 值給「Export Attack Log」「Export Pentest Notes」。Verification：`rg '[一-鿿]' .vitepress/theme/components/FlagSubmit.vue` exit 1；既有與 FlagSubmit 相關之 vitest（若有）通過。
- [ ] 5.2 [P] 抽 `.vitepress/theme/components/HomeContent.vue` 之 12 個 CJK 出現點（about heading、about paragraph、stats heading、`題目總數`、latest challenges heading、quick start heading 與三步驟標題與敘述）至 `home_content.*` keys；en 值為對應英文（如 `About WXL`、`Total challenges` 等）。Verification：`rg '[一-鿿]' .vitepress/theme/components/HomeContent.vue` exit 1；`pnpm docs:dev` 後 `/` 與 `/zh-TW/` 之 home 內容各自顯示英 / 繁版本。
- [ ] 5.3 [P] 抽 `.vitepress/theme/components/ChallengeList.vue` 之 12 個 CJK 出現點（search placeholder、`所有難度`、`所有類別`、四個 sort option、sort direction title、grid/list mode title、`{n} 道挑戰` 後綴、empty state 文字）至 `challenge_list.*` keys。Verification：`rg '[一-鿿]' .vitepress/theme/components/ChallengeList.vue` exit 1；challenge list page 於兩語系下篩選與排序仍可運作（手動煙霧測試）。
- [ ] 5.4 [P] 抽 `.vitepress/theme/components/MergedNav.vue` 之 `📖 題目` 兩個出現點（emoji 保留，僅 `題目` 進入 messages 為 `merged_nav.description_toggle_label`）以及 `Switch to light mode` / `Switch to dark mode` 兩個英文 title 移為 message keys（順便為日後新增其他語系預備）。Verification：`rg '[一-鿿]' .vitepress/theme/components/MergedNav.vue` exit 1；challenge layout nav 之 hamburger、darkmode toggle 行為不變。
- [ ] 5.5 [P] 抽 `.vitepress/theme/components/NotesButton.vue` 之 `滲透筆記`（aria-label + 內文）為 `notes_button.label`。Verification：`rg '[一-鿿]' .vitepress/theme/components/NotesButton.vue` exit 1。
- [ ] 5.6 [P] 抽 `.vitepress/theme/components/NotesModal.vue` 之 15 個 CJK 出現點（aria-label `開啟滲透筆記`、header label `滲透筆記`、search placeholder、sort title 兩態、5 個 action button title、empty state 兩種、editor placeholder）至 `notes_modal.*` keys。Verification：`rg '[一-鿿]' .vitepress/theme/components/NotesModal.vue` exit 1；既有 NotesModal 相關 vitest（若存在）不退化。
- [ ] 5.7 [P] 抽 `.vitepress/theme/components/NoteCard.vue` 之 4 個 CJK 出現點（`編輯筆記` / `刪除筆記` titles、`（空筆記）`、`(已編輯)`）至 `note_card.*` keys。Verification：`rg '[一-鿿]' .vitepress/theme/components/NoteCard.vue` exit 1。
- [ ] 5.8 [P] 抽 `.vitepress/theme/components/NoteEditor.vue` 之 4 個 CJK 出現點（textarea placeholder、preview placeholder、`取消` button、`儲存` button）至 `note_editor.*` keys。Verification：`rg '[一-鿿]' .vitepress/theme/components/NoteEditor.vue` exit 1。
- [ ] 5.9 Stage 5 收尾：總集 grep 確認 8 元件無 CJK 殘留、執行 `/spectra-audit` + `/tw-emoji-commit`。Verification：`rg '[一-鿿]' .vitepress/theme/components/*.vue` exit 1（0 hits 覆蓋全部 8 個檔）；`spectra analyze` Critical+High = 0。

## 6. LocaleSwitcher 元件實作與掛載

- [ ] 6.1 建立 `.vitepress/theme/components/LocaleSwitcher.vue`：button + dropdown UI，dropdown 列出 `English` 與 `繁體中文`，點擊時 (a) 更新 `i18n.global.locale.value`、(b) 寫 `localStorage.wxl-locale`、(c) 透過 VitePress `useRouter()` 將 `window.location.pathname` 之 `/zh-TW` prefix 加入或移除後 navigate。實現規格「LocaleSwitcher component provides UI to change active locale」與設計決策「LocaleSwitcher mounted in MergedNav and via Layout slot for default theme」。Verification：Stage 8 的 `tests/unit/i18n/locale-switcher.test.ts` 覆蓋兩方向切換 + URL 對映 + localStorage 寫入，全綠。
- [ ] 6.2 [P] 在 `.vitepress/theme/components/MergedNav.vue` 的「Right section」既有區塊插入 `<LocaleSwitcher />`（位於 darkmode toggle 與 github link 之間或之後，視排版而定），不破壞 hamburger / notes / dark toggle 既有行為。實現規格 Scenario「LocaleSwitcher renders inside MergedNav on challenge pages」。Verification：`pnpm dev` 開啟 `/challenges/door-is-open/` 與 `/zh-TW/challenges/door-is-open/`，皆能在 MergedNav 看到 LocaleSwitcher 且雙向切換可運作。
- [ ] 6.3 [P] 在非 challenge layout（VitePress default theme 之 home / challenges / guide layout）注入 `<LocaleSwitcher />`，方式為使用 VitePress 2 alpha 的 `nav-bar-content-after` slot（透過 `.vitepress/theme/Layout.vue` 或 `index.ts` 包 wrapper）；若該 slot 不可用，退而以 `Layout.vue` `<template>` 末段絕對定位插入。實現規格 Scenario「LocaleSwitcher is reachable on default theme pages」。Verification：`pnpm dev` 開啟 `/`、`/challenges/`、`/guide/`，三頁皆能看到 LocaleSwitcher 並可運作切換；切換後 URL 變化正確（如 `/` → `/zh-TW/`，`/challenges/` → `/zh-TW/challenges/`）。
- [ ] 6.4 Stage 6 收尾：執行 `/spectra-audit` + `/tw-emoji-commit`。Verification：`spectra analyze` Critical+High = 0；手動驗證雙 layout 之 LocaleSwitcher 行為一致。

## 7. Init-time locale detection 與 persistence wiring

- [ ] 7.1 在 `.vitepress/theme/index.ts` 的 `enhanceApp` 中、`app.use(i18n)` 之後，加入 client-only 初始化（`typeof window !== 'undefined'` guard），呼叫 `detectInitialLocale()` 並將結果寫回 `i18n.global.locale.value` 與 `localStorage.wxl-locale`；偵測順序遵循規格「Init-time locale detection follows localStorage then URL prefix」與設計決策「Locale persistence: localStorage with key `wxl-locale`, init-time precedence」之優先序（localStorage → URL prefix → 預設 `en`）。Verification：Stage 8 之 locale-switcher.test.ts 內 precedence matrix 7 列全部通過；`pnpm docs:build` 在 SSR 階段不因 `localStorage` 未定義而失敗。
- [ ] 7.2 `detectInitialLocale()` 與 `persistLocale()` 內以 try/catch 包覆所有 `localStorage` 讀寫，例外時 silently 退回 URL-based 偵測。Verification：locale-switcher.test.ts 含一案例 mock `localStorage.getItem` / `setItem` 拋 `SecurityError`，斷言函式回傳 `'en'` 或 `'zh-TW'`（依 URL）且不重新拋例外。
- [ ] 7.3 Stage 7 收尾：執行 `/spectra-audit` + `/tw-emoji-commit`。Verification：`spectra analyze` Critical+High = 0。

## 8. Vitest 覆蓋（messages-shape + locale-switcher）

- [ ] 8.1 [P] 建立 `tests/unit/i18n/messages-shape.test.ts`，斷言 (a) `en.json` 與 `zh-TW.json` 之扁平化 key 路徑集合相同（任一 missing key 直接失敗）、(b) 掃 `en.json` 每個 leaf 值無 U+4E00–U+9FFF 字元、(c) 掃 `zh-TW.json` 每個 leaf 值至少有一個 U+4E00–U+9FFF 字元，實現規格「Vitest coverage validates LocaleSwitcher and message-shape parity」與設計決策「Vitest coverage scope」。Verification：在 `en.json` 暫時新增一個假 key 後跑 `pnpm test tests/unit/i18n/messages-shape.test.ts` 必須失敗並指出該 key path；移除後 exit 0。
- [ ] 8.2 [P] 建立 `tests/unit/i18n/locale-switcher.test.ts`，使用 `@vue/test-utils` mount `LocaleSwitcher.vue`（搭配 vue-i18n test instance），覆蓋：(a) 從 `/challenges/door-is-open/` 切到 zh-TW → URL `/zh-TW/challenges/door-is-open/`、localStorage `'zh-TW'`、`i18n.global.locale.value === 'zh-TW'`；(b) 反向切換；(c) init-time precedence matrix（spec.md 表格 7 列）；(d) `localStorage` SecurityError fallback。Verification：`pnpm test tests/unit/i18n/locale-switcher.test.ts` exit 0；test 數量 ≥ 11（兩方向切換 2 + precedence 7 + fallback 1 + 至少 1 個切換 UI 顯示測試）。
- [ ] 8.3 Stage 8 收尾：執行 `/spectra-audit` + `/tw-emoji-commit`。Verification：`spectra analyze` Critical+High = 0。

## 9. 完整 pipeline 驗收與終局 audit

- [ ] 9.1 全域 grep 終局檢查：`rg '[一-鿿]' .vitepress/theme/components/*.vue docs/index.md docs/challenges.md docs/guide/` exit 1（0 hits 跨 8 元件 + 英文側 markdown）。此 task 為規格「Vue components in custom theme do not contain CJK literals in template or attribute strings」之最終強制 gate。Verification：上述 `rg` 指令 exit code 為 1。
- [ ] 9.2 完整 build + test pipeline 驗收：依序執行 `pnpm install`、`pnpm wasm:build`、`pnpm challenge:keygen`、`pnpm docs:build`、`pnpm test`、`cargo test --workspace`。Verification：除 `AUDIT.md` §A.3 既知之 5 個 `CodeEditorPanel` 失敗外，所有指令 exit 0；新增之 `tests/unit/i18n/*.test.ts` 全綠；`docs/build` 同時產出 `dist/index.html` 與 `dist/zh-TW/index.html` 且兩者 `<html lang>` 正確。
- [ ] 9.3 手動瀏覽器 smoke test（chrome-devtools MCP 或本機）：依序開啟 `/`（驗證英文 hero + 元件英文字串 + LocaleSwitcher）、`/zh-TW/`（驗證繁中 hero + 元件繁中字串）、`/challenges/door-is-open/`（驗證 MergedNav 上 LocaleSwitcher + 雙語切換）、`/zh-TW/challenges/door-is-open/`（驗證繁中對應）；每處點 LocaleSwitcher 切換並 reload 驗證 `localStorage.wxl-locale` persistence。Verification：commit 訊息或 PR 描述中以條列方式記錄上述 4 個 URL 之觀察結果，每項皆為 PASS。
- [ ] 9.4 Stage 9 收尾終局 audit：執行 `/spectra-audit` 並產出 Stage 9 report；`spectra validate i18n-runtime-foundation` 通過後以 `/tw-emoji-commit` 收尾。Verification：`spectra analyze i18n-runtime-foundation --json` Critical+High = 0；`spectra validate i18n-runtime-foundation` exit 0。
