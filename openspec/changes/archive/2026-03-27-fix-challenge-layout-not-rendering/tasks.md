## 1. 修復 Theme Layout 註冊機制

- [x] 1.1 將 `.vitepress/theme/index.ts` 的 `extends: DefaultTheme` 替換為 `...DefaultTheme`（object spread），使自訂 `Layout` 屬性確實覆蓋 DefaultTheme 的 Layout（Challenge pages use a custom VitePress layout registered as "challenge"）
- [x] 1.2 使用 `defineComponent` + `setup()` 定義 `Layout` 元件：在 `setup()` 中透過 `useData()` 取得 `frontmatter`，以 `computed` 判斷 `frontmatter.value.layout === 'challenge'`，render function 中以 `h(ChallengeLayout)` 或 `h(DefaultTheme.Layout)` 條件渲染
- [x] 1.3 在 `setup()` 中使用 `onMounted` / `onUnmounted` lifecycle hooks 管理 `document.body` 的 `challenge-page` class toggle，取代原先 Layout.vue 中的同等邏輯
- [x] 1.4 在 `enhanceApp` 中手動呼叫 `DefaultTheme.enhanceApp?.({ app })` 以保留 DefaultTheme 的樣式與元件功能（DefaultTheme functionality is preserved）
- [x] 1.5 移除 `index.ts` 對 `Layout.vue` 的 import，直接 import `ChallengeLayout` from `./layouts/ChallengeLayout.vue`

## 2. 清理與驗證

- [x] 2.1 修正 `Layout.vue` 的 template：將 `#layout-bottom` slot 方式改為 `v-if="isChallenge"` / `v-else` 直接渲染（雖已為 dead code，但保持正確性）
- [x] 2.2 刪除 `docs/.vitepress/` 殘留目錄（僅含 cache，為錯誤執行 `vitepress dev docs` 時產生的 stale 目錄）
- [x] 2.3 執行全部 608 個單元測試（`npx vitest run`），確認全數通過
- [x] 2.4 以 Playwright 進行端對端驗證：啟動 dev server → 瀏覽 PHP 挑戰頁 → 確認 ChallengeLayout 渲染、flag 提交成功、攻擊紀錄 JSON 下載正常
