## Why

目前專案的建構管線、目錄結構與 VitePress 慣例存在多處不對齊：runtime bridge（TypeScript）放在 Rust crate 旁而非 `.vitepress/` 下；WASM artifact 未輸出至 `docs/public/`；Challenge 頁面使用預設 layout 而非自訂 layout，且缺乏 Challenge list 頁面與 PWA 離線能力。這些問題導致建構不完整、開發體驗差，且平台無法在無網路環境下使用。

## What Changes

- 新增 `build` npm script，依序執行 `wasm:build` → `docs:build`
- 將 `chall-wasm/python-bridge/` 與 `chall-wasm/php-bridge/` 的 TypeScript runtime 遷移至 `.vitepress/theme/composables/`
- 設定 `wasm-pack` 輸出目標為 `docs/public/wasm/`，讓瀏覽器可直接存取
- 新增自訂 `challenge` layout（frontmatter `layout: challenge`），使用 `<Content />` 注入 markdown 描述
- Layout A：左欄（可收縮 markdown description + 底部 flag submit）+ 右欄（Browser / Terminal / Repeater tab）
- 新增 Challenge list 頁面，使用 VitePress `createContentLoader` 在 build time 收集所有 challenge 的 frontmatter
- 新增 PWA 支援，以離線優先策略預快取 Pyodide、php-wasm 等大型 WASM runtime

## Capabilities

### New Capabilities

- `challenge-layout`: 自訂 VitePress layout，左右分割，左欄可收縮 markdown 描述、底部 flag submit，右欄 Browser/Terminal/Repeater tab
- `challenge-list`: Build time 收集所有 challenge frontmatter，提供 list 頁面與 card 展示
- `pwa-offline`: PWA manifest + Service Worker 離線策略，預快取 WASM runtime 與靜態資源

### Modified Capabilities

- `challenge-ui`: ChallengeLayout 元件從獨立元件改為 VitePress 自訂 layout，透過 frontmatter 指定；新增可收縮 description panel
- `python-asgi-runtime`: 模組路徑從 `chall-wasm/python-bridge/` 遷移至 `.vitepress/theme/composables/`，對外 API 不變
- `php-runtime`: 模組路徑從 `chall-wasm/php-bridge/` 遷移至 `.vitepress/theme/composables/`，對外 API 不變

## Impact

- 受影響的 spec：`challenge-ui`、`python-asgi-runtime`、`php-runtime`
- 受影響的程式碼：
  - `chall-wasm/python-bridge/python-runtime.ts` → `.vitepress/theme/composables/usePythonRuntime.ts`
  - `chall-wasm/php-bridge/php-runtime.ts` → `.vitepress/theme/composables/usePhpRuntime.ts`
  - `.vitepress/theme/components/ChallengeLayout.vue`（重寫為 VitePress layout）
  - `.vitepress/theme/index.ts`（註冊新 layout）
  - `.vitepress/config.mts`（新增 `createContentLoader` data loader）
  - `package.json`（新增 `build` script、`vite-plugin-pwa` 依賴）
  - `wasm-pack` 建構設定（output 指向 `docs/public/wasm/`）
  - `docs/challenges/*.md`（frontmatter 新增 `layout: challenge`）
  - 新增 `docs/challenges/index.md`（Challenge list 頁）
  - 新增 `docs/challenges/challenges.data.ts`（`createContentLoader`）
