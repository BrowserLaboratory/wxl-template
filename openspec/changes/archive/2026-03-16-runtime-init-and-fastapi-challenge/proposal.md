## Why

進入挑戰頁面時，WASM runtime（Pyodide / PHP-WASM）從未被初始化，service worker 嘗試透過 `postMessage` 傳遞 JS 函數（不可行），導致所有挑戰請求回傳 503。此外，缺乏 FastAPI 示範挑戰及 micropip 額外套件安裝支援。

## What Changes

- **修復 SW dispatch 機制**：將 `challenge-sw.js` 的 broken function-passing 改為 MessageChannel relay（SW ↔ 頁面雙向序列化 request/response）
- **新增 Runtime 初始化流程**：`ChallengeLayout.vue` 在 mount 時解密 FS、初始化 Pyodide/PHP-WASM runtime，並建立 MessageChannel 與 SW 溝通
- **`app` 欄位處理**：build plugin 自動將 `app` 指定的本地檔案加入 `encryptedFs`，runtime 解密後執行
- **新增 `packages` frontmatter 欄位**：指定需透過 micropip 額外安裝的 Python 套件（`backend` 類型自動帶對應基礎套件）
- **新增 FastAPI 示範挑戰**：含 FastAPI app 程式碼、虛擬 FS、flag 驗證

## Capabilities

### New Capabilities

- `challenge-runtime-init`: 挑戰頁面 mount 時解密 FS 並初始化 Python/PHP WASM runtime 的完整流程（含 virtual-fs WASM 整合、micropip 套件安裝）
- `fastapi-challenge`: FastAPI 後端挑戰的示範實作（含 `packages` 欄位使用示例）

### Modified Capabilities

- `service-worker-router`: SW dispatch 從 broken function-passing 改為 MessageChannel relay（HANDLE_REQUEST / RESPONSE 訊息協定）
- `python-asgi-runtime`: 新增 `packages?: string[]` 初始化參數，在 `app_code` 執行前透過 micropip 安裝套件
- `challenge-framework`: 新增 `packages` 可選 frontmatter 欄位（`string[]`），build plugin 自動將 `app` 指定檔案加入 `encryptedFs`

## Impact

- Affected specs: `service-worker-router`, `python-asgi-runtime`, `challenge-framework`, new `challenge-runtime-init`, new `fastapi-challenge`
- Affected code:
  - `docs/public/challenge-sw.js`
  - `.vitepress/theme/layouts/ChallengeLayout.vue`
  - `.vitepress/theme/composables/usePythonRuntime.ts`
  - `.vitepress/challenge/config.ts`
  - `.vitepress/challenge/plugin.ts`
  - `docs/challenge/fastapi-demo.md` (new)
  - `docs/challenge/fastapi-demo/app.py` (new)
  - `docs/challenge/fastapi-demo/flag.txt` (new)
