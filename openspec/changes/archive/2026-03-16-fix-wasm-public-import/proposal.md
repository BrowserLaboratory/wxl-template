## Why

Vite 禁止透過 ES `import()` 載入 `/public` 目錄內的 JS 檔案，導致開發伺服器啟動時 `ChallengeLayout.vue` 拋出 `Cannot import non-asset file` 錯誤，頁面無法正常載入。`/* @vite-ignore */` 只能壓制「找不到模組」警告，無法繞過此限制。

## What Changes

- `wasm:build` script 輸出目錄由 `docs/public/wasm/` 改為 `.vitepress/wasm/`（移出 public，進入 Vite source tree）
- `ChallengeLayout.vue` 中的 dynamic import 路徑由 `/wasm/virtual-fs/virtual_fs.js` 改為相對路徑 `../../wasm/virtual-fs/virtual_fs.js`（同理更新 asgi-bridge 若有用到）
- 移除不再需要的 `/* @vite-ignore */` 註解

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

（無 — 此修正為純實作層面調整，不改變任何規格行為）

## Impact

- Affected code:
  - `package.json` — `wasm:build` script 輸出路徑
  - `.vitepress/theme/layouts/ChallengeLayout.vue` — dynamic import 路徑
  - `.gitignore` — 確保 `.vitepress/wasm/` 產物被忽略（若尚未加入）
