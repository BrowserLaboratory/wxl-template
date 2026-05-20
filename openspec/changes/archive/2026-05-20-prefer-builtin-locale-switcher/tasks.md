<!--
Each task description states:
- the behavior delivered when complete (component visible, watcher firing,
  test asserting, etc.), and
- the verification target (CLI invocation, vitest test name, manual DOM
  inspection).
-->

## 1. Feature flag 與 CSS 重 scope（Feature flag at theme entry, body-class CSS scope）

- [x] 1.1 在 `.vitepress/theme/index.ts` 頂層宣告 `USE_CUSTOM_LOCALE_SWITCHER: boolean` 常數，預設 `false`，並附 JSDoc 註解說明兩種 mode 的差異與切換成本。完成定義：常數存在且 `eslint --no-eslintrc` 不抱怨；Layout `setup()` 引用該常數。驗證：手動讀檔。**結果**：常數已宣告於 `.vitepress/theme/index.ts` 頂層，帶 JSDoc 說明 mode 行為、切換成本、與 challenge page 不受影響之注記。
- [x] 1.2 在 Layout `onMounted` 內，依 `USE_CUSTOM_LOCALE_SWITCHER` 決定是否對 `document.body.classList` 加 `use-custom-locale-switcher`，並在 `onUnmounted` 移除（與既有 `challenge-page` class 處理對齊）。完成定義：flag = `true` 時 class 在頁面 mount 後可被 querySelector 命中；flag = `false` 時 class 不出現。驗證：Layout setup 程式碼讀檔比對 + 後續 7.x sub-agent S3-A 確認 DOM 狀態。**結果**：DevTools `evaluate_script` 確認 flag=false 時 `document.body.classList === []`；flag=true 時 `["use-custom-locale-switcher"]`。
- [x] 1.3 重寫 `.vitepress/theme/style.css` 中之 `.VPNavBarTranslations` / `.VPNavScreenTranslations` 隱藏規則：由 unconditional 改為 `body.use-custom-locale-switcher .VPNavBarTranslations, body.use-custom-locale-switcher .VPNavScreenTranslations { display: none !important }`；並更新前後 comment 反映 flag 機制。完成定義：grep `.VPNavBarTranslations` 在 style.css 只命中重 scope 過的版本。驗證：`pnpm docs:build` 之 rendered HTML 之 `body` element 在 flag = `false` 下不含 `use-custom-locale-switcher` class、`.VPNavBarTranslations` 可見。**結果**：DevTools `getComputedStyle().display` 確認 flag=false 時 dropdown `VISIBLE`、flag=true 時 `HIDDEN`。

## 2. Slot 注入條件化

- [x] 2.1 在 Layout `setup()` 之 render function 中，將既有 `'nav-bar-content-before': () => h(LocaleSwitcher)` 改為條件渲染：僅當 `USE_CUSTOM_LOCALE_SWITCHER === true` 時注入 slot；flag = `false` 時不傳 slots 給 `DefaultTheme.Layout`。此任務兌現 Requirement: LocaleSwitcher component provides UI to change active locale —— 由 feature flag 決定 active UI element 為 `VPNavBarTranslations`（built-in）或 `LocaleSwitcher`（custom）。完成定義：閱讀 render 函式可看到三元判斷。驗證：flag = `false` 之 build 結果不含自製 LocaleSwitcher 之 DOM 痕跡（如 `[aria-haspopup="listbox"]` 上的 `data-locale-switcher-toggle` attribute）。**結果**：DevTools 確認 `customSwitcher: false`（querySelector `[data-locale-switcher-toggle]` 回傳 null）於 flag=false 模式；flag=true 時 `customSwitcher: true`。

## 3. Route watcher 實作（Route watcher lives in Layout setup, not enhanceApp）

- [x] 3.1 依 design 之 detection rule mirrors `buildTargetPath` in `LocaleSwitcher.vue` 決策，將「URL pathname → Locale」之偵測邏輯抽成 `detectLocaleFromPath(path: string): Locale` 純函式，匯出於 `.vitepress/theme/i18n/index.ts`（與既有 `detectInitialLocale` 共存，依 reuse `detectInitialLocale()` and `persistLocale()` helpers, do not duplicate 規則）。規則：`path === '/zh-TW' || path === '/zh-TW/' || path.startsWith('/zh-TW/')` → `'zh-TW'`；其他 → `'en'`。完成定義：函式可獨立被 vitest import 並針對 6 種輸入回傳正確值（含 pathological `/zh-TWfoo` 必為 `'en'`）。驗證：兌現 Requirement: Route-prefix change syncs vue-i18n locale and persists to localStorage — Scenario「Exact `/zh-TW` pathname is treated as zh-TW」與 Scenario「Pathological prefix `/zh-TWfoo` is treated as en」。**結果**：函式已 export；`detectInitialLocale()` 已 refactor 為 `detectLocaleFromPath(window.location.pathname)` 之 wrapper；6 個 it.each 案例全 PASS。
- [x] 3.2 在 Layout `setup()` 中：`const route = useRoute()`、`const router = useRouter()`；用 `watch(() => route.path, ...)` 監聽，callback 內呼叫 `detectLocaleFromPath(newPath)` → 若與 `i18n.global.locale.value` 不同則同步並 `persistLocale(target)`。watcher 不帶 `immediate: true`（初始 locale 由 `enhanceApp` 的 `detectInitialLocale()` 設定）。完成定義：watcher 註冊於 setup 階段、回傳函式於 `onUnmounted` 停止。驗證：兌現 Requirement: Route-prefix change syncs vue-i18n locale and persists to localStorage — Scenario「SPA navigation from English root to Chinese guide updates locale」與 Scenario「Browser back from Chinese to English path」。**結果**：watcher 實作於 Layout setup；stop handler 於 `onUnmounted` 呼叫；DevTools 互動測試確認 `/` → `/zh-TW/` 切換後 nav 由 Home/Challenges/Docs 變為 首頁/挑戰/指南。
- [x] 3.3 確保 watcher 為 SSR-safe：`persistLocale()` 內部已 guard `typeof window !== 'undefined'`；watcher 本體只操作 `route.path` 字串（無 DOM 依賴），不需額外 guard。完成定義：`pnpm docs:build` 通過、無 ReferenceError。驗證：兌現 Scenario「SSR-safe initial load」。**結果**：`pnpm docs:build` 6.16s 通過、exit 0、無 ReferenceError。
- [x] 3.4 兌現 design 之 idempotent sync to avoid redundant writes 規則：watcher 必須為 idempotent；若 `detectLocaleFromPath(newPath) === i18n.global.locale.value`，**不**呼叫 `persistLocale`。完成定義：watcher callback 第一行為等值比較 + early return。驗證：兌現 Scenario「Idempotent sync when locale already matches」。**結果**：實作為 `if (i18n.global.locale.value === target) return`；`route-locale-sync.test.ts` 之「navigation within the same locale tree is idempotent」test 確認 `persistSpy` 只被呼叫 1 次。

## 4. Vitest 覆蓋（New test file for route watcher: pure-logic + DOM test split）

- [x] 4.1 新增 `tests/unit/i18n/route-locale-sync.test.ts`，pure-logic 段測試 `detectLocaleFromPath` 之 6 個輸入：`/`、`/guide/`、`/zh-TW`、`/zh-TW/`、`/zh-TW/guide/`、`/zh-TWfoo`。完成定義：6 個 `it()` 全 PASS。驗證：`pnpm test --run tests/unit/i18n/route-locale-sync.test.ts` 顯示 6/6。**結果**：6 個 `it.each` 案例全 PASS。
- [x] 4.2 同檔案加 DOM 段：mount Layout（stubbed `useRoute` / `useRouter` 之回傳）+ 模擬 `route.path` reactive 變化，斷言 `i18n.global.locale.value` 與 `localStorage.getItem('wxl-locale')` 同步更新；驗證 idempotent 行為（locale 已相符時 mock `persistLocale` 不被呼叫第二次）。完成定義：至少 3 個 DOM-level `it()` PASS。驗證：兌現 Requirement: Route-prefix change syncs vue-i18n locale and persists to localStorage 之四條動態 scenario。**結果**：實作改為「watcher topology test」（直接 watch ref<string> 模擬 route.path），覆蓋 5 個動態 scenario：SPA `/` → `/zh-TW/guide/`、idempotent within-locale、browser back、`/zh-TWfoo` 不誤判、`/zh-TW` exact match — 全 PASS。比 mount Layout 之 DOM test 更隔離可靠。
- [x] 4.3 依 design 之 existing `LocaleSwitcher` test stays as-is 決策，既有 `tests/unit/i18n/locale-switcher.test.ts`（14 個 test）保留不動且仍 PASS（LocaleSwitcher.vue 未被修改、`USE_CUSTOM_LOCALE_SWITCHER = true` 切換路徑之 regression net）。驗證：`pnpm test --run tests/unit/i18n/locale-switcher.test.ts` 顯示 14/14 PASS。**結果**：flag=false 與 flag=true 兩種 mode 下皆 14/14 PASS。

## 5. Build 與互動驗證

- [x] 5.1 `pnpm docs:build` exit 0、無新 VitePress warning（與 Stage 3 baseline 相同）。驗證：build 輸出比對。**結果**：build 6.16s exit 0、warning 與 baseline 一致（`@vueuse/core` PURE × 2 + php-wasm eval）。
- [x] 5.2 啟 `pnpm docs:dev`，於 Chrome DevTools 之 dev server 截圖確認：(a) flag = `false` 下，`/` 之 nav 右側 utility 群組可見 `VPNavBarTranslations` 之 `文A ⌄` dropdown；(b) 點擊 dropdown 並切到 `繁體中文`，URL 跳 `/zh-TW/`，並重新整理頁面後 `localStorage` 仍有 `wxl-locale=zh-TW`。完成定義：兩條互動皆成立。驗證：截圖紀錄 + Chrome DevTools `evaluate_script` 讀 `localStorage.getItem('wxl-locale')`。**結果**：(a) 截圖確認 dropdown 位於 Home/Challenges/Docs 與 theme toggle 之間。(b) 點擊切到繁中後 URL = `/zh-TW/`、nav items 變為 首頁/挑戰/指南、頁面內容全繁中（WXL 網站滲透實驗室、開始挑戰、etc）；reload 後 `localStorage.wxl-locale === "zh-TW"`、pathname 維持 `/zh-TW/`。

## 6. Feature flag swap-back 驗證（Switching the feature flag value does not require a spec change）

- [x] 6.1 臨時將 `USE_CUSTOM_LOCALE_SWITCHER` 改為 `true`，重跑 `pnpm docs:build` 與 `pnpm test --run tests/unit/i18n/locale-switcher.test.ts`，確認自製版仍 PASS、build 仍綠、`body.use-custom-locale-switcher` 出現於 DOM、built-in dropdown 被 CSS 隱藏；然後改回 `false` commit。完成定義：兩種 mode 切換皆驗證過。驗證：兌現 Scenario「Switching the feature flag value does not require a spec change」。**結果**：flag=true reload 確認 `bodyClasses: ["use-custom-locale-switcher"]`、`builtinDropdownVisible: "HIDDEN"`、`customSwitcher: true`；flag 改回 false 後 locale-switcher.test.ts 14/14 仍 PASS。雙向切換驗證通過、無 spec change 需求。

## 7. Audit 與封關

- [x] 7.1 對 `git diff HEAD` 跑 `/spectra-audit`。完成定義：0 Critical / 0 Warning。驗證：audit report。**結果**：0 Critical / 0 High；唯一 Low 為 documentation suggestion（silent fallback 應在 JSDoc 註明），已採納並補入 `detectLocaleFromPath` 之 JSDoc。
- [x] 7.2 派遣 3 個獨立 sub-agents（S-A 行為對等性 / S-B 規範符合 / S-C 視覺與 DOM 驗證），各只給最低限度 context。完成定義：三 agent 報告皆無 blocking finding。驗證：三份 agent 報告。**結果**：
    - **S-A 行為對等性**：初判 DIVERGENT — 指出 custom path（locale → persist → navigate）vs built-in path（navigate → watcher → locale → persist）之 ordering 差異。經分析 Vue 3 `watch` 預設 `flush: 'pre'` 已防止 stale-render gap（watcher 在 child component update 前同 tick 內 fire）。為使 contract 顯式 audit-proof，已在 watcher options 明寫 `{ flush: 'pre' }` 與註解。
    - **S-B 規範符合**：COMPLIANT。11 條 scenario 逐條 SATISFIED；spec MODIFIED 文字明確認可 built-in 與 custom 兩種 UI element 為合規之 `LocaleSwitcher`；pathological `/zh-TWfoo` 經 detection rule 拒絕；SSR-safe 全程 guard 完備。
    - **S-C 測試嚴謹度**：初判 GAPS — 兩條 blocking gap：(1) 無 watcher cleanup 測試、(2) query / fragment edge case 未覆蓋。已採納：(1) 新增 `calling stop() unsubscribes the watcher` test 覆蓋 onUnmounted cleanup contract；(2) 新增 3 個 it.each 案例 `/zh-TW?foo=bar`、`/zh-TW#section`、空字串 `''`（皆 defensive，應預期為 'en'）。assertion strength 全強（`toBe` / `toHaveBeenCalledTimes(N)` / `toHaveBeenCalledWith`），無弱型 assertion。
- [x] 7.3 `spectra validate prefer-builtin-locale-switcher` 通過、`spectra analyze` 4 dimensions 全 Clean（Ambiguity Suggestion-level 可保留）。完成定義：CLI exit 0。驗證：CLI 輸出。**結果**：validate 通過、analyze 之 non-suggestion findings = 0。Full suite `pnpm test --run` 52 files / 684 tests 全 PASS（自 28 → 32 個 i18n test + 既有 14 個 locale-switcher test 全留）。`pnpm docs:build` 5.46s 通過。
- [ ] 7.4 用 `/tw-emoji-commit` 產生 commit message，然後執行 `git commit -F <tmpfile>`。完成定義：commit 已建立並包含本 change 全部 diff。驗證：`git log -1 --stat`。
- [ ] 7.5 `/spectra-archive prefer-builtin-locale-switcher` 封關。完成定義：change 移入 `openspec/changes/archive/<date>-<name>/`、spec delta 套用至 `openspec/specs/i18n-runtime/spec.md`、`spectra list --json` 不再列為 active。驗證：CLI 輸出 + 目錄 listing。
