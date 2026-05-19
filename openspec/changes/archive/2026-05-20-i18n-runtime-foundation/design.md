## Context

WXL template 目前狀態（截至 2026-05-19 / `project-audit-and-cleanup` archive 之後）：

- **單一範例**：`docs/challenge/door-is-open/` 為唯一保留的 demo challenge。
- **零 i18n 基礎建設**：
  - `package.json` 無 `vue-i18n`、`@intlify/*` 任何相關套件。
  - `.vitepress/config.mts` 無 `locales` 設定，nav / sidebar 寫死繁中。
  - 8 個 Vue 元件共 53 個 CJK 字元出現點，全部寫死於 template / 屬性 / `placeholder` / `aria-label` / `title`。
  - `docs/index.md` hero frontmatter 為繁中、`features` 條目為繁中。
- **VitePress 版本**：`vitepress@2.0.0-alpha.16`，srcDir 為 `docs/`。
- **Pinia 已透過 `app.use(createPinia())` 安裝**於 `.vitepress/theme/index.ts` 的 `enhanceApp`，本 change 將以同樣模式安裝 vue-i18n。
- **既有測試基準**：`tests/unit/components/CodeEditorPanel.test.ts` 有 5 個既知失敗（見 `AUDIT.md` §A.3，已 parked 到後續 change），其餘 vitest 全綠；本 change 不得令任何其他 test 退化。
- **執行限制**：純前端 + Service Worker + WASM，無後端、無 SSR runtime（VitePress build 階段為 Node SSG，runtime 為 client-only）。任何 locale negotiation 只能在 client side 進行。
- **CLAUDE.md 規範**：所有中文輸出（含本 change 產出之 zh-TW locale message）必須使用台灣慣用繁體中文用語；分類詞如「資料」「資訊」「應用程式」「使用者」需符合台灣慣例。

後續 changes 依賴本 change：
- `content-i18n-migration`（Change 3）：把 `docs/guide/*` 與 `docs/challenge/door-is-open/index.md` 雙語化，會直接寫入本 change 建立的 `docs/zh-TW/` 與英文側位置。
- `developer-docs-english`（Change 4）：英化 `README.md` / `CONTRIBUTE.md`；不依賴 i18n runtime 但時間軸排在本 change 之後。

## Goals / Non-Goals

**Goals:**

- 建立 vue-i18n runtime：`app.use(createI18n(...))` 於 `enhanceApp` 安裝，使任一元件可透過 `useI18n()` 或 template `$t()` 取得字串。
- 建立 VitePress i18n routing：root locale = `en`，第二 locale = `zh-TW`（URL prefix `/zh-TW/`）。
- 抽出 8 個 Vue 元件全部 CJK 字串至 `messages/en.json` 與 `messages/zh-TW.json`，使元件 template 不再出現 CJK literal。
- 提供 `LocaleSwitcher.vue`，掛入 challenge nav 與 default theme nav；切換時同步 `i18n.global.locale`、`localStorage`、URL 路由。
- Init-time 自動偵測：依 `localStorage.wxl-locale` ➜ URL prefix ➜ default `en` 順序決定 locale。
- 提供 vitest 單元測試覆蓋切換器邏輯、URL 對映、message keys 對齊性。
- 為 Change 3 預備好 `docs/zh-TW/` 目錄樹（內容沿用現有繁中，不翻譯）與英文側 placeholder（不英化內文，僅佔位）。

**Non-Goals:**

- **不**翻譯任何 markdown 內文（hero frontmatter 與 site title / description 除外）。
- **不**做 server-side locale negotiation（無 server）。
- **不**支援 `Accept-Language` 自動偵測（客戶端 build 為 SSG，HTML 首次回應已含 lang attribute；首次切換交由 LocaleSwitcher）。
- **不**支援 RTL 或 ICU 複數規則（CTF UI 字串無此需求）。
- **不**翻譯 challenge frontmatter（`title` / `description`）— `content-i18n-migration` 處理。
- **不**重做 nav / sidebar 項目順序與分類，只把現有結構搬入 per-locale 區塊。
- **不**動 Rust WASM 工作區、`scripts/challenge-keygen.ts`、Service Worker (`public/challenge-sw.js`)。

## Decisions

### vue-i18n v10 with Composition API mode and global injection

選用 `vue-i18n@^10`（最新穩定主版本）而非 v9，因為 v10 預設啟用 Composition API、移除 v8 legacy options、與 Vue 3.5 完整相容；安裝模式為 `createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', globalInjection: true, messages })`，使 template `$t()` 與 Composition API `useI18n()` 並行可用。**Alternative considered**：VitePress 內建 `themeData` + frontmatter 多語可覆蓋 nav / sidebar / hero，但無法處理 Vue 元件 template 內字串（FlagSubmit 的「下載攻擊紀錄」、ChallengeList 的「找不到符合條件的題目」等），仍需 vue-i18n；故採「VitePress locales（路由 + nav/sidebar）+ vue-i18n（元件字串）」並用模式。

### English as root locale, Traditional Chinese under /zh-TW/

URL 結構：root `/` 為英文（locale code `en`，VitePress lang `en-US`），`/zh-TW/` 為繁中（locale code `zh-TW`，VitePress lang `zh-TW`）。Root locale 採 `en` 而非 `zh-TW` 的理由：本 template 對外發布定位為國際可重用，預設語言為英文符合 OSS 慣例；現有繁中內容透過 prefix 保留無損失。**Alternative considered**：root 留 zh-TW、`/en/` 放英文，但與 OSS 主流 template 慣例不一致，後續若擴充第三語系會更難調整。VitePress `locales` 配置以 `root` 物件指 EN，`zh-TW` 物件 `link: '/zh-TW/'`。

### Message key naming: namespaced by component, snake_case leaves

Message key 採 `<component>.<purpose>` 兩層結構，例如 `flag_submit.submit_button`、`challenge_list.search_placeholder`、`home_content.about_heading`、`merged_nav.notes_label`、`notes_modal.empty_state_no_notes`。理由：(a) 同元件字串聚合便於 review、(b) 避免單一 flat namespace 衝突、(c) 不過度深層（最多 2 階）使 fallback 行為穩定。**Alternative considered**：依語意分類（`common.submit`、`errors.flag_incorrect`）會在跨元件共用字串時有反向耦合風險，且本 change 字串多為元件專屬，namespacing by component 更直白。en.json 與 zh-TW.json 的 key 結構必須完全鏡像（messages-shape 測試強制檢查）。

### LocaleSwitcher mounted in MergedNav and via Layout slot for default theme

`LocaleSwitcher.vue` 為單一元件實作，UI 為 `<button>` + dropdown（兩個 locale 各一行：`English` / `繁體中文`），符合既有 `ch-nav-icon-btn` / dropdown 樣式（複用 MergedNav 的 hamburger menu pattern）。Challenge layout 在 `MergedNav.vue` 的「Right section」既有區塊內插入該元件；非 challenge layout（home / challenges / guide）透過 VitePress default theme 的 `nav-bar-content-after` slot 注入。**Alternative considered**：透過 VitePress 內建 locales 選單即可（VitePress 會自動產生），但其外觀無法與 challenge 頁的 MergedNav 統一；本 change 統一以 `LocaleSwitcher` 元件處理兩種 layout，確保 UI 與行為一致。

### Locale persistence: localStorage with key `wxl-locale`, init-time precedence

Locale 來源優先順序（init-time 偵測，於 `enhanceApp` 與每次 route change 後執行）：

1. `localStorage.getItem('wxl-locale')` 若存在且為已知 locale（`en` / `zh-TW`），採用之；否則
2. 當前 URL `pathname` 以 `/zh-TW/` 開頭 → `zh-TW`，否則 → `en`；
3. 步驟 1/2 決定後，**寫回** `localStorage`（首次造訪也記錄），並設定 `i18n.global.locale.value`。

**Edge case 處理**：若 `localStorage` 內存值與 URL prefix 不符（例如使用者貼了 `/zh-TW/...` 連結但 localStorage 為 `en`），以 URL 為準 — 因為訪客明確要求該 URL 之內容；切換完成後寫回 localStorage。**Alternative considered**：用 cookie 同步給 SSG 階段，但 VitePress SSG 已 build 出固定 lang HTML，client side override 已足夠且無 hydration mismatch 風險（lang attribute 由 VitePress per-locale 處理）。

### docs/zh-TW/ 平行樹建立策略：搬移既有繁中，英文側補 placeholder

`docs/index.md` 現有繁中 hero / features → 完整內容**搬移**至 `docs/zh-TW/index.md`（一字不變），英文側 `docs/index.md` 重寫為英文 hero / features（site-level 文案是 i18n foundation 必須項，否則 root locale 無可呈現內容）。其餘 markdown（`docs/guide/*`、`docs/challenge/door-is-open/index.md`、`docs/challenges.md`）採同模式：繁中原文搬入 `docs/zh-TW/` 對應路徑、英文側建立 placeholder（含正確 frontmatter、`# Title` 英文標題、`<!-- TODO: full content migration in change content-i18n-migration -->` 註記）。`docs/zh-TW/<page>.md` 為唯一真實繁中來源，避免雙寫。**Alternative considered**：兩側都用 placeholder 等 Change 3 才搬，但這會讓本 change ship 時 `/zh-TW/` 路徑無實質內容，違反「foundation 須可用」原則。

### Component refactor pattern: $t() in template, useI18n() in script when needed

Template 內所有字串改 `{{ $t('component.key') }}` 或 `:placeholder="$t('...')"`、`:title="$t('...')"`、`:aria-label="$t('...')"`。Script 內若需動態字串（例如 `MergedNav.vue` 的 `:title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"`），改用 `const { t } = useI18n(); :title="isDark ? t('merged_nav.darkmode_to_light') : t('merged_nav.darkmode_to_dark')"`。**Forbidden**：本 change 結束時，`.vitepress/theme/components/*.vue` 不得有任何 CJK 字元出現（grep `[一-鿿]` should return 0 hits within these files）。CJK 出現點全部 → message file 條目。

### VitePress config: locales structure with per-locale themeConfig

`.vitepress/config.mts` 改寫為：

```typescript
export default defineConfig({
  srcDir: "docs",
  vite: { /* ... unchanged ... */ },
  title: "Web eXploitation Laboratory",
  description: "Browser-based web exploitation challenge platform powered by WASM",
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Challenges', link: '/challenges/' },
          { text: 'Docs', link: '/guide/' },
        ],
        sidebar: { '/guide/': [ /* English entries (placeholder titles) */ ] },
        socialLinks: [ { icon: 'github', link: 'https://github.com/CXPhoenix/wxl' } ],
      },
    },
    'zh-TW': {
      label: '繁體中文',
      lang: 'zh-TW',
      link: '/zh-TW/',
      themeConfig: {
        nav: [
          { text: '首頁', link: '/zh-TW/' },
          { text: '挑戰', link: '/zh-TW/challenges/' },
          { text: '指南', link: '/zh-TW/guide/' },
        ],
        sidebar: { '/zh-TW/guide/': [ /* current zh-TW entries */ ] },
        socialLinks: [ { icon: 'github', link: 'https://github.com/CXPhoenix/wxl' } ],
      },
    },
  },
  // transformPageData unchanged
})
```

頂層 `themeConfig` 若仍出現會被 VitePress 視為 root locale 預設值；本 change 明確將所有 nav / sidebar 移入 `locales.<x>.themeConfig`，避免雙重來源混淆。

### Vitest coverage scope

新增兩個測試檔（不修改既有測試）：

1. `tests/unit/i18n/messages-shape.test.ts`：deep-diff `messages/en.json` 與 `messages/zh-TW.json` 的 key tree，缺失 key 即測試失敗。額外確保 zh-TW.json 任何 leaf value 必須含 CJK 字元（防止英文洩漏到中文 message）、en.json 任何 leaf value 不得含 CJK 字元（防止反向洩漏）。
2. `tests/unit/i18n/locale-switcher.test.ts`：mount `LocaleSwitcher` 並驗證：(a) 點擊 `English` 設定 `localStorage` 為 `en` 且呼叫 router 導向去除 `/zh-TW` prefix 的 URL，(b) 點擊 `繁體中文` 設定 `localStorage` 為 `zh-TW` 且導向加 prefix 的 URL，(c) init-time 依 localStorage 設定當前 locale，(d) localStorage 為空時依 URL 設定 locale。

不對 `enhanceApp` 內的 vue-i18n 安裝直接測試（VitePress build 時 SSR 行為較複雜），改以 `docs:build` 通過、`docs:dev` smoke test（可看到雙語 URL）作為 integration 驗收。

## Implementation Contract

**Observable behavior after this change ships:**

1. 使用者開啟根網址 `/` → VitePress 渲染英文版 home（`docs/index.md`），lang attribute 為 `en-US`，所有 Vue 元件 UI 字串顯示為英文（取自 `messages/en.json`）。
2. 使用者開啟 `/zh-TW/` → VitePress 渲染繁中版 home（`docs/zh-TW/index.md`），lang attribute 為 `zh-TW`，所有 Vue 元件 UI 字串顯示為繁體中文（取自 `messages/zh-TW.json`）。
3. 任一頁面右上 nav（challenge layout 為 MergedNav，其他為 default theme nav）皆顯示 `LocaleSwitcher`；點開後出現兩列選項 `English` / `繁體中文`，**當前 locale 加上 checked 標記或 active 樣式**。
4. 點擊另一語系 → URL 變為對應 prefix（或移除 prefix）、頁面內容切到該 locale、`localStorage.wxl-locale` 更新；瀏覽器 reload 後維持該 locale。
5. 直接貼上 `/zh-TW/challenges/` 連結進入，顯示繁中、`localStorage` 寫入 `zh-TW`；後續造訪 `/` 會被切回（init-time 偵測再次依 URL 判定，使用者意圖明確）。
6. 任一 Vue 元件 template 都不含 CJK 字元（驗收：`rg '[一-鿿]' .vitepress/theme/components/` 須回傳 0 行）。
7. `pnpm docs:build` 成功；輸出含 root locale 樹與 `/zh-TW/` 樹兩份 HTML，且 VitePress sitemap（若有）涵蓋兩份。
8. `pnpm test` 通過（既有 5 個 already-failing `CodeEditorPanel` 測試之外，新增 2 個 i18n test file 全綠）。

**Interface / data shape:**

- `app.use(VueI18n)` 安裝 plugin instance，由 `.vitepress/theme/i18n/index.ts` 預設 export 提供：
  ```typescript
  export const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    globalInjection: true,
    messages: { en, 'zh-TW': zhTW },
  })
  export function detectInitialLocale(): 'en' | 'zh-TW'
  export function persistLocale(loc: 'en' | 'zh-TW'): void
  ```
- Message file schema（en.json / zh-TW.json）：JSON object，至多 2 階 nesting，leaf 為 string。範例 root keys（不窮舉）：`flag_submit`、`home_content`、`challenge_list`、`merged_nav`、`notes_button`、`notes_modal`、`note_card`、`note_editor`、`locale_switcher`。
- `LocaleSwitcher.vue` props：無；自取 `useI18n()`、`useRouter()`（VitePress `useRouter`）；emits：無；其餘行為見 Decisions。
- VitePress `locales` config：上節已列出結構。

**Failure modes:**

- 若 `messages/en.json` 缺少 key 而 `zh-TW.json` 有 → `messages-shape.test.ts` 失敗，CI 阻擋。
- 若元件 template 留有 CJK literal → 新增的 grep check（建議放入 `scripts/pre-commit.sh` 或 stage 8 task 內 manual check）回報失敗；本 change 不強制把該 check 自動化（留給 Stage 8 verification），但 Stage 4 完成時 grep 必須為 0。
- 若 `localStorage` 不可用（隱私瀏覽模式）→ try/catch swallow，回退至 URL-based detection；不阻斷頁面。
- 若 vue-i18n 載入失敗（不應發生，dep 已 pinned）→ `app.use` 拋例外，VitePress build 失敗 — 屬於 build-time 偵測，不需 runtime fallback。

**Acceptance criteria:**

- A1：`pnpm install` 成功，`vue-i18n` 在 `node_modules` 中、版本符合 `^10`。
- A2：`pnpm docs:build` exit 0，`dist/` 同時含 `index.html`（英文）與 `zh-TW/index.html`（繁中），且兩者 `<html lang="...">` 正確。
- A3：`pnpm test` exit 0（除既知 5 個 CodeEditorPanel failure 外無新增 failure）；`tests/unit/i18n/*.test.ts` 兩個 test file 全綠。
- A4：`pnpm dev` 啟動後，瀏覽 `/` 看到英文 nav + 英文元件字串、瀏覽 `/zh-TW/` 看到繁中對應；點 LocaleSwitcher 雙向切換成功；`localStorage.wxl-locale` 持久化。
- A5：執行 `rg '[一-鿿]' .vitepress/theme/components/*.vue` 回傳 0 行。
- A6：`/spectra-audit` 對 change `i18n-runtime-foundation` 無 Critical / High finding。

**Scope boundaries:**

In scope:
- vue-i18n 安裝、locale messages 抽取、LocaleSwitcher 元件、VitePress locales 設定、init-time locale 偵測與 persistence、docs/zh-TW/ 骨架、英文 hero 與 placeholder、新增 2 個 vitest 檔。

Out of scope:
- 翻譯 markdown 內文（除 hero / features 之外）；challenge frontmatter 多語化；Rust / WASM 任何變更；Service Worker；challenge-keygen；既有 CodeEditorPanel 測試修復；任何 dev doc 英化。

## Risks / Trade-offs

- [VitePress alpha 與 vue-i18n 整合風險] → vitepress@2.0.0-alpha.16 為 alpha 版本，與 vue-i18n@10 整合未必有文件背書；mitigation：以 `enhanceApp` 安裝（與 Pinia 同模式，已驗證可用），i18n 與 VitePress 的 `locales` 機制本身互不依賴，分離關注點降低整合風險。萬一 alpha 出問題，rollback 路徑為 git revert 本 change 的 commits。
- [docs:build 雙樹效能] → 站台從單樹變雙樹，build 時間約上升 1.5–1.8 倍；mitigation：可接受（目前 6.86s → 預估 ~12s 仍在合理範圍）；若超過 30s 才視為 regression。
- [既有 markdown 連結失效] → `docs/index.md` 的 actions link 從 `/challenges/` / `/guide/` 改為英文位置；但 `/zh-TW/` 樹的對應 link 必須指 `/zh-TW/challenges/` 與 `/zh-TW/guide/`；mitigation：每個 markdown 內連結審視一遍（Stage 5 task）。
- [既有測試 mock 假設 single-locale] → vitest 環境中 vue-i18n 未安裝會讓使用 `$t()` 的元件 mount 失敗；mitigation：在 `vitest.config.ts` 或 individual test setup 中 install vue-i18n test plugin（Stage 6 task 顯式處理）。
- [LocaleSwitcher 在 default theme nav 注入] → VitePress 2 alpha 的 `nav-bar-content-after` slot 可能尚未穩定；mitigation：若 slot 不可用，退而以 markdown frontmatter 或 `Layout.vue` wrap 注入；Stage 3 task 內提供 fallback 路徑。
- [使用者貼 `/zh-TW/` URL 卻已有英文 localStorage 偏好] → 採「URL 為準」策略可能不符部分使用者預期；mitigation：行為文件化於 design.md（本節）、locale_switcher dropdown 出現時即可改回。

## Migration Plan

本 change 為純前端 + build-time 改動，無資料庫、無線上遷移。Stage commit 流程：

1. Stage 1 commit 後 `pnpm install` + `pnpm docs:build` 必須 pass（vue-i18n 安裝完成、未動 components 時 build 仍應綠）。
2. Stage 2–5 每完成一個 stage commit 後執行 `/spectra-audit` 與 `pnpm test`；若任一退化，先 revert stage 該 commit 再排查根因。
3. 若需 rollback 整個 change：`git revert` 範圍內 commits，或棄置 branch；無持久狀態洩漏（localStorage 在使用者瀏覽器，無 server 端資料）。
4. 部署：本 template 採 GitHub Release workflow（見 `openspec/specs/github-release-workflow/spec.md`），本 change archive 後下次 release 自動納入。
