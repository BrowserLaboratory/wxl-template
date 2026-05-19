## Summary

統一全站色彩系統：所有頁面從 VitePress 預設變數 (`--vp-c-*`) 遷移至平台自有 design tokens (`--ch-*`)，並修正 dark mode 下 icon 對比度不足、色彩不協調的問題。

## Motivation

首頁 `HomeContent.vue` 使用 29 處 `--vp-c-*` 變數，與其餘 15 個已遷移至 `--ch-*` 的元件不一致。Dark mode 下 VitePress feature card 的 icon 因繼承 `currentColor`（暗灰色）而幾乎不可見。VitePress docs/guide 頁面的背景、文字色也未橋接至 `--ch-*`，造成切換頁面時色彩跳動。

整體色系經討論確認使用 **Refined Indigo** 方案（提亮版），icon 採用**圓角方形容器 + 微邊框**設計。

## Proposed Solution

1. **Dark mode token 微調**（`style.css`）— 提亮 border `#252550`→`#2d2d55`、icon 色 `#a5b4fc`
2. **VitePress feature card icon override**（`style.css`）— 新增 `.dark .VPFeature .VPImage` CSS override：圓角方形容器（`border-radius: 12px`、`rgba(99,102,241,0.12)` bg、`rgba(99,102,241,0.2)` border）+ light mode 對應版本
3. **HomeContent.vue 全面遷移** — 29 處 `--vp-c-*` → 對應 `--ch-*` token
4. **VitePress 全域 CSS 橋接**（`style.css`）— 讓 `--vp-c-bg-soft`、`--vp-c-text-1/2/3`、`--vp-c-divider` 等指向 `--ch-*`，使 docs/guide 頁面自動跟隨平台色系
5. **Light mode icon 容器** — 同步加上淡 indigo 背景容器

## Impact

- Affected specs: `challenge-design-tokens`（token 值調整 + 新增 VitePress 橋接）、`homepage-content`（元件遷移至 `--ch-*`）
- Affected code:
  - `.vitepress/theme/style.css`（token 微調 + icon override + 全域橋接）
  - `.vitepress/theme/components/HomeContent.vue`（`--vp-c-*` → `--ch-*`）
  - 相關單元測試
