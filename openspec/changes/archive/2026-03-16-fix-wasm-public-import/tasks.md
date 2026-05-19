## 1. 將 wasm-pack 輸出目錄移至 Vite source tree

- [x] 1.1 確保「WASM glue files SHALL reside in Vite source tree」：修改 `package.json` 的 `wasm:build` script，將 `virtual-fs` 和 `asgi-bridge` 的 `--out-dir` 從 `../../docs/public/wasm/<name>` 改為 `../../.vitepress/wasm/<name>`（將 wasm-pack 輸出目錄移至 `.vitepress/wasm/`）
- [x] 1.2 執行 `pnpm wasm:build`，確認產物輸出至 `.vitepress/wasm/virtual-fs/` 與 `.vitepress/wasm/asgi-bridge/`

## 2. 使用相對路徑匯入（update import path in ChallengeLayout.vue）

- [x] 2.1 修改 `.vitepress/theme/layouts/ChallengeLayout.vue` 中的 dynamic import：將 `/* @vite-ignore */ '/wasm/virtual-fs/virtual_fs.js'` 改為相對路徑 `'../../wasm/virtual-fs/virtual_fs.js'`，並移除 `@vite-ignore` 註解
- [x] 2.2 若專案中其他檔案也有引用 `/wasm/` 絕對路徑（grep 確認），一併更新

## 3. 更新 `.gitignore`（更新 .gitignore）

- [x] 3.1 在 `.gitignore` 中加入 `.vitepress/wasm/`，確保 WASM 建置產物不被提交（與 `.vitepress/dist/` 和 `.vitepress/cache/` 一致）

## 4. 驗證（developer starts dev server）

- [x] 4.1 執行 `pnpm dev`，確認開發伺服器啟動時不出現 `Cannot import non-asset file` 錯誤
- [x] 4.2 在瀏覽器開啟任一 challenge 頁面，確認 WASM 模組正常載入（`runtimeReady` 變為 `true`，無 Runtime Error badge）
- [x] 4.3 執行 `pnpm docs:build`，確認 production build 正常完成
