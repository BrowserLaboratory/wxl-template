## Problem

VitePress v2.0.0-alpha.16 的 `extends: DefaultTheme` 機制無法正確覆蓋自訂 `Layout` 屬性。當使用者在 theme `index.ts` 中設定 `extends: DefaultTheme` 並提供自訂 `Layout` 時，VitePress 始終使用 DefaultTheme 的內建 Layout，忽略自訂版本。

DefaultTheme 的 `VPContent.vue` 對 `layout: challenge` 等自訂 layout 值會渲染 `<component :is="frontmatter.layout" />`。由於 `ChallengeLayout` 既未註冊為全域元件、也未被 Layout override 正確載入，頁面輸出空白的 `<challenge></challenge>` HTML 元素 — 整個挑戰頁面無法渲染，導致攻擊紀錄下載按鈕不存在。

## Root Cause

VitePress 的 `resolveThemeExtends()` 使用 `{ ...base, ...theme }` 合併 theme 物件。理論上自訂 `Layout` 應覆蓋 base theme 的 Layout，但在 v2.0.0-alpha.16 的實際行為中，`extends` 關鍵字導致 DefaultTheme 的 Layout 始終優先。此外，原先 `Layout.vue` 使用 `#layout-bottom` slot 將 `ChallengeLayout` 注入 DefaultTheme.Layout，但 VitePress 的 VPContent 對自訂 layout 類型不會渲染此 slot — 它只對 `doc`/`page`/`home` layout 才會走 VPDoc/VPPage 路徑。

## Proposed Solution

1. 將 `extends: DefaultTheme` 替換為 `...DefaultTheme`（object spread），確保自訂 `Layout` 屬性確實覆蓋 DefaultTheme 的 Layout
2. 使用 `defineComponent` + setup render function 定義 Layout，當 `frontmatter.layout === 'challenge'` 時直接渲染 `ChallengeLayout`，否則渲染 `DefaultTheme.Layout`
3. 手動在 `enhanceApp` 中呼叫 `DefaultTheme.enhanceApp?.()` 以保留 DefaultTheme 的功能（CSS、元件等）

## Success Criteria

- 使用 `pnpm docs:dev` 啟動開發伺服器後，瀏覽 `/challenge/php-demo/` 應看到完整的挑戰頁面（MergedNav、Description Panel、Browser/Terminal/Code tabs、FlagSubmit）
- 正確提交 flag 後，「下載攻擊紀錄」按鈕出現且點擊後成功下載 JSON 檔案
- 「下載滲透筆記」按鈕同樣正常運作
- 所有現有 608 個單元測試通過
- 非挑戰頁面（首頁、文件頁、挑戰列表）仍使用 DefaultTheme Layout 正常渲染

## Impact

- 受影響程式碼：`.vitepress/theme/index.ts`（主要變更）、`.vitepress/theme/Layout.vue`（已成為 dead code）
- 受影響規格：`challenge-layout`
