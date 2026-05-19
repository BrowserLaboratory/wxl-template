## Context

VitePress 專案的 `srcDir` 設為 `docs`，因此 `docs/public/` 是 VitePress 的靜態資產目錄。`wasm:build` script 將 wasm-pack 產物輸出至 `docs/public/wasm/`，使得 Vite 將這些 JS glue 檔案視為靜態資產而非 ES 模組。Vite 的 `import-analysis` plugin 禁止透過 `import()` 載入 public 目錄內的 JS 檔案，導致 `ChallengeLayout.vue` 在開發與建置時均出錯。

已安裝的 `vite-plugin-wasm` 支援直接在 source tree 中匯入 wasm-pack 產物，且能正確處理 `new URL('...bg.wasm', import.meta.url)` 模式。

## Goals / Non-Goals

**Goals:**

- 讓 `ChallengeLayout.vue` 的 dynamic import 能通過 Vite 的模組分析
- 不改變執行期行為（WASM 載入流程、API 介面不變）

**Non-Goals:**

- 重構 WASM 模組本身或其 API
- 改變 challenge 加密/解密邏輯

## Decisions

### 將 wasm-pack 輸出目錄移至 `.vitepress/wasm/`

wasm-pack 產物屬於「需被 Vite 處理的 ES 模組」，而非靜態資產。移至 `.vitepress/wasm/virtual-fs/` 後，Vite 可透過 module graph 正確打包，`vite-plugin-wasm` 也能處理 `.wasm` binary 的 asset emit。

替代方案考量：保留在 public、改用 `<script>` 標籤注入 — 過於複雜，且破壞現有的 clean async import 結構，因此排除。

### 使用相對路徑匯入

`ChallengeLayout.vue` 位於 `.vitepress/theme/layouts/`，相對路徑為 `../../wasm/virtual-fs/virtual_fs.js`。這是標準 ES 模組語法，不需要 `/* @vite-ignore */`。

### 更新 `.gitignore`

`.vitepress/wasm/` 為建置產物，應加入 `.gitignore`，與現有的 `.vitepress/dist/` 和 `.vitepress/cache/` 一致。

## Risks / Trade-offs

- [風險] `.vitepress/wasm/` 目錄不存在時，`docs:dev` 直接啟動（未先執行 `wasm:build`）會報 import 錯誤 → 緩解：文件說明需先執行 `pnpm dev`（已包含 wasm:build）；錯誤訊息比原本更清晰（找不到模組 vs. public 限制）
- [取捨] wasm 產物位置從 `docs/public/` 移走，不再直接可被 `<script src>` 存取 → 可接受，因為這些檔案本來就不應被直接引用為靜態資源
