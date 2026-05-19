## Context

平台使用 VitePress 2.0.0-alpha.16 + UnoCSS 66.x 建構，已安裝 UnoCSS 套件但尚未設定 `uno.config.ts`。目前 `style.css` 沿用 VitePress 預設 indigo 配色；所有元件以 `<style scoped>` 撰寫，與 UnoCSS 完全分離。

`ChallengeLayout.vue` 的 `<Content />` 直接嵌入而未包覆 `.vp-doc` wrapper，導致 VitePress typography styles 不套用（heading、code block、blockquote 等呈現為純文字）。`docs/postcss.config.mjs` 使用 `postcssIsolateStyles()` 確保 VitePress 原生 CSS 只作用於 `.vp-doc` 範圍內，不影響 UnoCSS utility classes。

## Goals / Non-Goals

**Goals:**

- 建立以 CSS custom properties 為單一來源的 design token 系統
- Dark mode（Midnight Indigo）和 Light mode（Enterprise Indigo）雙主題支援
- UnoCSS 整合：challenge 相關元件改用 utility classes
- 修正 `ChallengeLayout` 左側說明欄 markdown 渲染問題
- `ChallengeList` 卡片重設計，含難度語意配色

**Non-Goals:**

- VitePress 預設頁面（home、nav、sidebar）的樣式不在本次範圍
- 字型替換（保留 VitePress 預設）
- RWD / 行動裝置適配（現有佈局比例不變）

## Decisions

### CSS Variables 作為 Design Token 單一來源

將所有設計 token 定義為 CSS custom properties（`--ch-*` 前綴）於 `style.css`：
- `:root` → light mode token
- `.dark` → dark mode token（VitePress 的 dark mode class）

UnoCSS `uno.config.ts` 的 `theme.colors` 指向這些 CSS vars（`color: 'var(--ch-accent)'`），shortcuts 封裝常用組合（`ch-card`、`ch-badge-easy` 等）。

**為何不直接用 UnoCSS 的 `theme` hardcode 色值？** CSS vars 允許 dark/light 切換時無需 UnoCSS 產生額外 class，且 VitePress 的 `--vp-c-brand-*` 覆寫也可直接指向同一組 vars，避免兩套顏色系統不同步。

### VitePress `--vp-c-brand-*` 覆寫策略

在 `:root` 和 `.dark` 中將 VitePress brand vars 指向 `--ch-accent-*`：
```css
--vp-c-brand-1: var(--ch-accent-1);
--vp-c-brand-2: var(--ch-accent-2);
--vp-c-brand-3: var(--ch-accent-3);
```
此方式讓 VitePress 原生元件（link、button 等）自動採用新配色，無需逐一覆寫。

### Markdown 渲染修正：`.vp-doc` Wrapper

在 `ChallengeLayout.vue` 的 `<Content />` 外層加上 `<div class="vp-doc description-content">`。`postcssIsolateStyles()` 將 VitePress typography CSS 的作用域限定在 `.vp-doc` 內，因此此 class 是 markdown 樣式正確渲染的必要條件。

**為何不移除 `postcssIsolateStyles`？** 移除會導致 VitePress 的 reset 和 typography styles 洩漏到 UnoCSS 元件區（右側互動面板），造成樣式衝突。現有機制應保留。

### UnoCSS 整合方式：Shortcuts + CSS Vars

元件改用 UnoCSS 的方式：
1. **Shortcuts**：定義 `ch-card`、`ch-tab-btn`、`ch-badge` 等複合 class
2. **直接 utility**：間距、flex、border-radius 等用 Tailwind 相容 utility（`p-3`、`flex`、`rounded-lg` 等）
3. **保留少量 scoped CSS**：僅用於 CSS var 引用或動態 transition（UnoCSS 不擅長 transition 中的 CSS var 動畫）

## Risks / Trade-offs

- **VitePress alpha 版本風險** → VitePress 2.0.0-alpha.16 API 可能有非預期行為；`.vp-doc` 的 CSS 作用域機制若版本升級後改變，需重新驗證 markdown 渲染。緩解：鎖定版本，升級時加測試
- **UnoCSS 與 VitePress SSG 的 class 掃描** → UnoCSS 需要能掃描 `.vue` 和 `.md` 檔案；須確認 `uno.config.ts` 的 `content.filesystem` 包含正確路徑。緩解：設定 `content: { filesystem: ['**/*.{vue,md,ts}'] }`
- **`postcssIsolateStyles` 路徑設定** → `docs/postcss.config.mjs` 需確認正確作用於 VitePress build；若路徑不對會導致所有 VitePress styles 失效。緩解：實作後立即 `pnpm docs:dev` 視覺驗證
