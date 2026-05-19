## Context

平台使用 `--ch-*` CSS custom properties 作為 design tokens 的 single source of truth。挑戰頁面的 15 個 Vue 元件已全面使用 `--ch-*`，但首頁 `HomeContent.vue` 仍使用 VitePress 預設的 `--vp-c-*` 變數（29 處）。VitePress 的 docs/guide 頁面也使用 `--vp-c-*`，未橋接至平台色系。

Dark mode 下 VitePress feature cards 的 SVG icon 繼承 `currentColor`（VitePress 預設暗灰），在 `#0f0f23` 背景上對比極低。

經討論確認使用 Refined Indigo 配色方案，icon 採圓角方形容器設計。

## Goals / Non-Goals

**Goals:**

- HomeContent.vue 的 29 處 `--vp-c-*` 全面遷移至 `--ch-*`
- VitePress feature card icon 在 dark/light mode 都加上圓角方形容器
- Dark mode token 微調提亮
- VitePress 全域變數橋接至 `--ch-*`，使 docs/guide 頁面色彩一致

**Non-Goals:**

- 不改動挑戰頁面元件（已經用 `--ch-*`）
- 不更換整體色系（維持 Indigo）
- 不修改 SVG icon 檔案本身

## Decisions

### HomeContent.vue 遷移至 ch tokens

逐一將 `--vp-c-*` 對應至 `--ch-*`：

| VitePress 變數 | 對應 ch token |
|---|---|
| `--vp-c-text-1` | `--ch-text-1` |
| `--vp-c-text-2` | `--ch-text-2` |
| `--vp-c-text-3` | `--ch-text-3` |
| `--vp-c-bg-soft` | `--ch-bg-soft` |
| `--vp-c-divider` | `--ch-border` |
| `--vp-c-brand-1` | `--ch-accent` |
| `--vp-c-brand-soft` | `--ch-accent-soft` |

### VitePress feature card icon 圓角方形容器

在 `style.css` 新增 CSS override，針對 VitePress 內建的 `.VPFeature` icon 區域：

```css
/* Dark mode */
.dark .VPFeature .VPImage {
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 8px;
  color: #a5b4fc;
}

/* Light mode */
.VPFeature .VPImage {
  background: rgba(67, 56, 202, 0.08);
  border: 1px solid rgba(67, 56, 202, 0.12);
  border-radius: 12px;
  padding: 8px;
  color: #4338ca;
}
```

需確認 VitePress 的 feature card icon DOM 結構中正確的 CSS selector（可能是 `.VPFeature .icon` 或 `.VPImage`）。

### Dark mode token 微調

微調 `style.css` 中 `.dark` selector 的值：

- `--ch-border`: `#2a2a4a` → `#2d2d55`（提亮）
- 新增 `--ch-icon`: `#a5b4fc`（icon 專用 token）
- `--ch-bg-card`: `#12122a` → `#15152f`（微亮）

### VitePress 全域 CSS 橋接

在 `style.css` 中新增橋接，讓 VitePress 預設變數指向 `--ch-*`：

```css
:root {
  --vp-c-bg-soft: var(--ch-bg-soft);
  --vp-c-text-1: var(--ch-text-1);
  --vp-c-text-2: var(--ch-text-2);
  --vp-c-text-3: var(--ch-text-3);
  --vp-c-divider: var(--ch-border);
}
```

這確保 docs/guide 等 VitePress 預設 layout 的頁面也會跟隨 `--ch-*` 色系。

## Risks / Trade-offs

- [風險] VitePress feature card 的 icon CSS selector 可能因版本更新而改變 → 需用 browser DevTools 確認實際 DOM 結構再決定 selector
- [風險] 覆蓋 `--vp-c-bg-soft` 等核心變數可能影響 VitePress 的 sidebar、code block 等元件 → 如有衝突，改用更精確的 selector scope
- [取捨] 不改 SVG 檔案（維持 `currentColor`）→ 依賴 CSS 控制顏色，更靈活但需確保 CSS 優先級正確
