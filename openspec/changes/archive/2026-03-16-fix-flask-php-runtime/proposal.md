## Why

Flask 挑戰因 WASM 虛擬 FS store 在頁面切換後未重置，導致以錯誤 key 解密前一個挑戰的資料而失敗；PHP 挑戰因 `php-wasm` loader 未接入 `ChallengeLayout.vue`，runtime 永遠拋出 stub 錯誤，挑戰無法運行。手動測試後發現兩個新問題：Flask 因 Pyodide unvendored sqlite3 拋出 `ModuleNotFoundError`；PHP 因 Vite optimizeDeps 預打包破壞 `import.meta.url` 造成 `phpBinary` 為 undefined。

## What Changes

- `ChallengeLayout.vue`：將 `wasm_fs_init` 改為 `wasm_fs_reset`，確保每次載入挑戰時 WASM store 先清空再重新載入當前挑戰的加密 FS 資料
- `ChallengeLayout.vue`：PHP backend 的 `PhpRuntime` loader 改為動態 import `php-wasm/PhpWeb.mjs`，並包裝成符合 `PhpInstance` 介面的 adapter（捕捉 `output` 事件、透過 Emscripten FS 寫檔）
- `ChallengeLayout.vue`（或 `usePythonRuntime.ts`）：`BASE_PACKAGES.flask` 加入 `'sqlite3'`；`_init()` 加入 `PYODIDE_NATIVE_PKGS` 白名單，native packages 用 `loadPackage()`，pip packages 用 `micropip.install()`
- `.vitepress/config.mts`：Vite 設定加 `optimizeDeps: { exclude: ['php-wasm'] }`，避免 esbuild 預打包破壞 php-wasm 的 WASM 路徑解析
- 修復 5 個失敗測試（stale mock）：
  - `tests/__mocks__/virtual-fs.ts`：補 `wasm_fs_reset` no-op export
  - `tests/unit/composables/usePythonRuntime-packages.test.ts`：mock 補 `loadPackage`
  - `tests/unit/composables/usePythonRuntime-request.test.ts`：mock 由舊 `app` ASGI API 改為 `_asgi_bridge`
  - `tests/e2e/flask-sqli.test.ts`：同上

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-runtime-init`：挑戰頁面初始化 WASM FS store 的行為由「若非空則跳過」改為「每次強制重置」，確保跨挑戰導覽時資料正確
- `php-runtime`：PHP Runtime 現在透過 `php-wasm/PhpWeb` 真實執行 PHP 程式碼，而非拋出 stub 錯誤

## Impact

- Affected code:
  - `.vitepress/theme/layouts/ChallengeLayout.vue`
  - `.vitepress/theme/composables/usePythonRuntime.ts`
  - `.vitepress/config.mts`
  - `tests/__mocks__/virtual-fs.ts`
  - `tests/unit/composables/usePythonRuntime-packages.test.ts`
  - `tests/unit/composables/usePythonRuntime-request.test.ts`
  - `tests/e2e/flask-sqli.test.ts`
- Affected specs: `challenge-runtime-init`、`php-runtime`、`python-runtime`
- Affected packages: `php-wasm` (v0.0.8，已安裝，首次實際使用)
