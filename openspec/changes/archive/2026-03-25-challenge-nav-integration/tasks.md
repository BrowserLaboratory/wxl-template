## 1. Layout.vue 重寫 — DefaultTheme.Layout + #layout-bottom slot

- [x] [P] 1.1 重寫 `.vitepress/theme/Layout.vue`：移除 `computed` 切換邏輯，始終渲染 `DefaultTheme.Layout`；當 `frontmatter.layout === 'challenge'` 時，透過 `#layout-bottom` slot 注入 `ChallengeLayout`（Challenge pages use a custom VitePress layout registered as "challenge"；使用 DefaultTheme.Layout + #layout-bottom slot）
- [x] [P] 1.2 在 `Layout.vue` 中使用 `onMounted` + `watch(frontmatter)` 切換 `document.body.classList` 的 `challenge-page` class，SSR 安全（Body class is applied on challenge pages；使用 body class + CSS 隱藏預設區塊）

## 2. CSS 隱藏規則

- [x] [P] 2.1 在 `.vitepress/theme/style.css` 新增 `body.challenge-page` 下的 CSS 規則，隱藏 `.VPLocalNav`、`.VPSidebar`、`.VPContent`、`.VPFooter`（VitePress default content areas are hidden on challenge pages；使用 body class + CSS 隱藏預設區塊）

## 3. ChallengeLayout 高度調整

- [x] [P] 3.1 修改 `.vitepress/theme/layouts/ChallengeLayout.vue`：root container 高度從 `h-screen` 改為 `h-[calc(100vh-var(--vp-nav-height))]`，並加上 `mt-[var(--vp-nav-height)]`（ChallengeLayout height accounts for VitePress navbar；ChallengeLayout 高度改用 calc(100vh - var(--vp-nav-height))）

## 4. VitePress Config 更新

- [x] [P] 4.1 更新 `.vitepress/config.mts` 的 `nav`：新增 `{ text: 'Docs', link: '/guide/' }` 連結（VitePress config provides navigation, path-based sidebar, and correct social links；VitePress config 調整）
- [x] [P] 4.2 更新 `.vitepress/config.mts` 的 `sidebar`：從空陣列改為 path-based object（VitePress config provides navigation, path-based sidebar, and correct social links；VitePress config 調整）
- [x] [P] 4.3 更新 `.vitepress/config.mts` 的 `socialLinks`：修正 GitHub link 指向正確的 repository URL（VitePress config provides navigation, path-based sidebar, and correct social links；VitePress config 調整）

## 5. 測試與驗證

- [x] 5.1 驗證 `pnpm docs:dev` 正常啟動，console 無錯誤
- [x] 5.2 驗證 challenge 頁面顯示 VitePress navbar（含深色/淺色切換）
- [x] 5.3 驗證 challenge 頁面隱藏 VPLocalNav、VPSidebar、VPContent、VPFooter
- [x] 5.4 驗證非 challenge 頁面正常顯示所有 VitePress 預設元件
- [x] 5.5 驗證 ChallengeLayout 不與 navbar 重疊
