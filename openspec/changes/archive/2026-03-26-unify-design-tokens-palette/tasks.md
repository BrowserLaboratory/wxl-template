## 1. Dark mode token 微調與 VitePress 橋接

- [x] [P] 1.1 在 `style.css` 的 `.dark` selector 微調 token 值：`--ch-border` 改為 `#2d2d55`、`--ch-bg-card` 改為 `#15152f`，新增 `--ch-icon: #a5b4fc`，實現 platform defines a CSS custom property token system as single source of truth
- [x] [P] 1.2 在 `style.css` 的 `:root` selector 新增 `--ch-icon: var(--ch-accent)`，實現 dark mode icon token
- [x] 1.3 在 `style.css` 新增 VitePress 全域 CSS 橋接：`--vp-c-bg-soft` → `var(--ch-bg-soft)`、`--vp-c-text-1/2/3` → `var(--ch-text-1/2/3)`、`--vp-c-divider` → `var(--ch-border)`，實現 VitePress default variables bridge to ch tokens

## 2. VitePress feature card icon 圓角方形容器

- [x] 2.1 確認 VitePress feature card icon 結構：`VPFeature.vue` 用 `.icon` div 包裹（需 `wrap: true`），img 用 `.VPImage` class；`.icon` 使用 `var(--vp-c-default-soft)` 背景
- [x] 2.2 在 `style.css` 新增 dark mode feature card icon override：圓角方形容器（`border-radius: 12px`、`rgba(99,102,241,0.15)` bg via `--vp-c-default-soft`、`rgba(99,102,241,0.2)` border），加 CSS filter 提亮 SVG，實現 feature card icons use rounded-square container
- [x] 2.3 在 `style.css` 新增 light mode feature card icon override：淡 indigo 容器（`rgba(67,56,202,0.08)` bg、`rgba(67,56,202,0.12)` border），加 `wrap: true` 到 frontmatter

## 3. HomeContent.vue 遷移至 ch tokens

- [x] 3.1 將 `HomeContent.vue` 中所有 `--vp-c-*` 替換為對應 `--ch-*` token（含 difficulty 硬編碼色改用 `--ch-easy-fg` 等），實現 homepage uses VitePress home layout with enhanced hero and feature cards 的 ch tokens exclusively 要求
- [x] 3.2 確認替換對應：`--vp-c-text-1` → `--ch-text-1`、`--vp-c-text-2` → `--ch-text-2`、`--vp-c-text-3` → `--ch-text-3`、`--vp-c-bg-soft` → `--ch-bg-soft`、`--vp-c-divider` → `--ch-border`、`--vp-c-brand-1` → `--ch-accent`、`--vp-c-brand-soft` → `--ch-accent-soft`

## 4. 測試驗證

- [x] 4.1 執行 `pnpm test -- --run` 確認所有單元測試通過（47 files, 604 tests passed）
- [x] 4.2 手動驗證首頁 dark mode：feature card icon 圓角方形容器可見、stats/cards 色彩與挑戰頁一致（截圖確認）
- [x] 4.3 手動驗證首頁 light mode：icon 容器淡 indigo、整體色彩協調（截圖確認）
- [x] 4.4 手動驗證 docs/guide 頁面：dark/light mode 色彩跟隨平台色系（截圖確認）
