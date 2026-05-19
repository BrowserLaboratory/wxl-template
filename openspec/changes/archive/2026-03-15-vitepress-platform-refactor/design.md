## Context

此專案是純前端的 Web 資安挑戰平台，基於 VitePress 建構。Challenge 完全在瀏覽器中以 Pyodide（Python）和 php-wasm（PHP）執行。目前存在以下結構性問題：

1. TypeScript runtime bridge（`python-runtime.ts`, `php-runtime.ts`）與 Rust crate 並排放在 `chall-wasm/`，而非 `.vitepress/` 目錄樹中，導致 Vite 無法正確解析模組
2. `wasm-pack` 輸出至 `pkg/` 子目錄，瀏覽器無法直接存取；`docs/public/` 中沒有 WASM artifact
3. Challenge 頁面使用 VitePress 預設 layout，UI 元件被嵌入 `.md` 內容中，違反 VitePress 慣例
4. 無 Challenge list 頁面，使用者沒有入口瀏覽所有題目
5. 無 PWA 支援，每次啟動都需重新下載 Pyodide（~15MB）+ php-wasm（~5MB）

## Goals / Non-Goals

**Goals:**

- 正確的建構管線：`wasm:build` 輸出至 `docs/public/wasm/`，統一 `build` script
- TypeScript runtime bridge 遷移至 `.vitepress/theme/composables/`，符合 VitePress 慣例
- 自訂 `challenge` layout：frontmatter `layout: challenge` + `<Content />` 注入 markdown 描述（左欄可收縮）
- Challenge list 頁面：使用 `createContentLoader` 在 build time 收集所有 challenge frontmatter
- PWA 離線優先：預快取 WASM runtime 及靜態資源

**Non-Goals:**

- 修改安全模型（flag 驗證、AES-GCM 加密、fs_key 混淆）
- 新增 challenge 類型或後端
- 重新設計 Service Worker 路由邏輯（`router.ts`）
- 視覺設計精修（色彩、字型等細節超出此次範疇）

## Decisions

### Build script：`wasm:build` 先於 `docs:build`

新增 `"build": "pnpm wasm:build && pnpm docs:build"` 到 `package.json`。WASM artifact 必須存在於 `docs/public/wasm/` 才能讓 VitePress 在建構時正確處理靜態資源。

**替代方案**：Vite plugin 動態觸發 wasm-pack。**拒絕** — dev server 啟動時需要 Rust toolchain，增加啟動時間，熱重載也會受影響。

### wasm-pack output：`docs/public/wasm/<crate>/`

設定 `wasm-pack build chall-wasm/virtual-fs --out-dir ../../docs/public/wasm/virtual-fs --target web`，`asgi-bridge` 同理。`--target web` 產生 ES module 相容的 WASM，Vite 可直接 import。`docs/public/` 確保 VitePress 將 artifact 複製到建構輸出根目錄。

同時將 `docs/public/wasm/` 加入 `.gitignore`，避免將生成的 WASM binary 提交至 git。

**替代方案**：保留在 `pkg/` 並設定 Vite `publicDir` alias。**拒絕** — 增加間接性，破壞標準 VitePress 預期行為。

### Runtime bridge 位置：`.vitepress/theme/composables/`

將 `chall-wasm/python-bridge/python-runtime.ts` → `.vitepress/theme/composables/usePythonRuntime.ts`，`chall-wasm/php-bridge/php-runtime.ts` → `.vitepress/theme/composables/usePhpRuntime.ts`。改名為 Vue composable 慣例（`use` 前綴）。對外 API（`initialize()`, `handleRequest()`）不變，只有 import 路徑改變。

同步更新所有 import 端：`.vitepress/sw/router.ts`、測試檔案。

**替代方案**：保留在 `chall-wasm/`，在 `config.mts` 設 path alias。**拒絕** — 違反關注點分離，TypeScript 概念上屬於 VitePress 目錄樹。

### VitePress 自訂 layout：`theme/layouts/ChallengeLayout.vue`

在 `theme/index.ts` 的 `layouts` 選項中註冊：`layouts: { challenge: ChallengeLayout }`。Challenge `.md` 在 frontmatter 設定 `layout: challenge`。Layout 使用 `<Content />` 在左欄可收縮 panel 中渲染 markdown 描述，`FlagSubmit` 固定在左欄底部，右欄為 Browser/Terminal/Repeater tab。

這消除了在 `.md` 檔案內嵌入 Vue 元件的需求，符合 VitePress 慣例，且支援正確的 SSR。

**替代方案**：繼續在 `.md` 中使用 `<ChallengeLayout>` 標籤。**拒絕** — 不符合 VitePress 慣例，阻礙 SSR，混合內容與結構。

### Layout 結構：左右分割，左欄可收縮

```
┌─────────────────────────────────────────────────────┐
│  [← Challenges]                     [title] [badge] │  ← 頂部 bar
├──────────────────────┬──────────────────────────────┤
│  Description panel   │  [Browser] [Terminal] [Rep.] │
│  (collapsible ◀▶)    │                              │
│  <Content />         │  Panel content               │
│                      │                              │
│  ─────────────────   │                              │
│  [Flag Submit]       │                              │
└──────────────────────┴──────────────────────────────┘
```

收縮時左欄折疊至最小寬度，右欄擴展至全寬。使用 CSS transition 實現動畫。

### Challenge list 資料：`createContentLoader`

在 `docs/challenges/challenges.data.ts` 中使用 VitePress 內建的 `createContentLoader('challenges/*.md', { excerpt: true })`，build time 產生 `ChallengeData[]`。List 頁面（`docs/challenges/index.md`，frontmatter `layout: challenge-list`）透過 `data` import 消費此資料。零 runtime 成本，challenge 檔案異動時自動更新。

**替代方案**：Runtime fetch JSON manifest。**拒絕** — 不必要的 runtime 依賴，破壞離線優先目標。

### PWA 策略：`@vite-pwa/vitepress` + Workbox generateSW

使用 **`@vite-pwa/vitepress`**（VitePress 專用封裝，底層為 `vite-plugin-pwa`）。在 `config.mts` 以 `withPwa(defineConfig({...}))` 包裝設定。

快取策略：

| 資源類型 | 策略 | 說明 |
|---------|------|------|
| Pyodide CDN、php-wasm CDN、`/wasm/**/*.wasm` | `CacheFirst`（TTL 30 天）runtime cache | WASM 大型檔案，lazy — 首次請求時才快取，不阻塞 SW install |
| HTML 頁面（navigation requests）| `NetworkFirst` | 保持內容最新 |
| JS/CSS/圖片等靜態資源 | `StaleWhileRevalidate` | 快速載入 + 背景更新 |

`challenge-sw.js` 攔截 `challenge-*.localhost` 請求（**不同 origin**），與 PWA SW（`/` scope）天然不衝突，無需特殊處理。但 `challenge-sw.js` 仍須加入 `globIgnores` 避免被納入 PWA precache manifest。

使用 `generateSW` mode（非 `injectManifest`）：無自訂 SW 邏輯需求，`generateSW` 夠用且更簡單。

在 `theme/index.ts` 手動呼叫 `registerSW()`（`injectRegister: null`），並加上 `typeof window !== 'undefined'` guard 確保 SSG 相容性。

**替代方案**：手寫 Service Worker。**拒絕** — Workbox 提供穩健的 cache 版本管理與更新邏輯，不需重複造輪子。

### Description 渲染：`<Content />` via VitePress pipeline

Challenge 作者在 frontmatter 下方以 markdown 撰寫描述。`challenge` layout 在左欄可收縮 panel 中使用 `<Content />` 渲染。不需引入額外的 markdown-it 實例——VitePress 本身的 render pipeline 即已處理。

## Risks / Trade-offs

- **[WASM 檔案大小]** Pyodide ~15MB，php-wasm ~5MB，PWA 首次安裝下載量大 → 緩解：使用 runtime cache（非 precache），不阻塞 SW install
- **[雙 Service Worker]** Challenge routing SW + PWA SW 共存，可能有 scope 衝突 → 緩解：Challenge SW 攔截 `challenge-*.localhost`（不同 origin），PWA SW 管 `/`，不相交
- **[import 路徑破壞]** Bridge 遷移後，現有測試和 router.ts 的 import 路徑需全面更新 → 緩解：遷移任務包含更新所有 import site，並以測試通過確認
- **[.gitignore]** `docs/public/wasm/` 生成檔案不應提交 git → 緩解：更新 `.gitignore` 作為遷移任務的一部分

## Migration Plan

1. 更新 `wasm:build` script，加入 `--out-dir` 指向 `docs/public/wasm/`；更新 `.gitignore`
2. 新增 `build` script（`wasm:build && docs:build`）
3. 建立 `.vitepress/theme/composables/` 目錄，遷移 TypeScript bridge，更新所有 import 路徑，確認測試通過
4. 實作 `challenge` layout（`theme/layouts/ChallengeLayout.vue`）並在 `theme/index.ts` 註冊
5. 更新 `docs/challenges/*.md` frontmatter 加入 `layout: challenge`，移除舊的 `<ChallengeLayout>` 嵌入
6. 新增 `challenges.data.ts` + `docs/challenges/index.md`（challenge list）
7. 安裝 `@vite-pwa/vitepress`，以 `withPwa()` 包裝 `config.mts`，設定 Workbox 快取策略
8. 執行 `pnpm build` 端對端驗證

Rollback：每個步驟獨立，皆可透過 git revert 回復。

## Resolved Questions

- **`@vite-pwa/vitepress` 與 `challenge-sw.js` 共存**：無需特殊設定。`challenge-sw.js` 運行於 `challenge-*.localhost` origin，與 PWA SW（`/` scope）天然分離。僅需將 `challenge-sw.js` 加入 `globIgnores`。
- **WASM 快取時機**：採用 **lazy**（runtime cache）。WASM 不納入 SW install 時的 precache，改在首次請求時透過 `CacheFirst` runtime cache 快取，避免阻塞 SW 安裝。
