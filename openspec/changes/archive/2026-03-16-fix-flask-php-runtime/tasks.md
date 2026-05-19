## 1. 修復 Flask — 使用 wasm_fs_reset 取代 wasm_fs_init

- [x] 1.1 在 `ChallengeLayout.vue` 的 WASM import 中加入 `wasm_fs_reset`，並將 `wasm_fs_init(paths, blobs)` 改為 `wasm_fs_reset(paths, blobs)`（對應 design 決策：使用 wasm_fs_reset 取代 wasm_fs_init；滿足 spec：Challenge page initializes WASM runtime on mount — WASM FS store is reset on each challenge mount）
- [x] 1.2 移除 `wasm_fs_init` 的 import（若不再使用），避免 dead import（對應 spec：Python challenge runtime initializes on first mount）
- [x] 1.3 手動測試：啟動 `pnpm dev`，先載入 FastAPI 挑戰，再導覽至 Flask（sqli-demo）挑戰，確認不再出現「decryption failed」錯誤，runtime 正常初始化

## 2. 修復 PHP — 接入 php-wasm/PhpWeb adapter

- [x] 2.1 在 `ChallengeLayout.vue` 的 PHP backend 分支中，將 stub callback 替換為真實的 `php-wasm/PhpWeb.mjs` adapter（對應 design 決策：PhpWeb adapter 放在 ChallengeLayout.vue，不改動 usePhpRuntime.ts；滿足 spec：PHP challenge page loads without runtime error）
- [x] 2.2 Adapter 實作：動態 import `php-wasm/PhpWeb.mjs`，instantiate `PhpWeb`，await `php.binary` 取得 Emscripten binary，回傳 `PhpInstance`-compatible 物件（對應 spec：PHP Runtime executes challenge PHP code via php-wasm）
- [x] 2.3 Adapter 的 `run(code)` 方法：在 `php.run(code)` 前掛上 `output` listener 收集 stdout，run 完成後移除 listener，回傳 `{ output, headers: [], exitCode }`（對應 design 決策：output 捕捉策略：事前掛 listener，事後移除；對應 design 決策：headers 暫時回傳空陣列）
- [x] 2.4 Adapter 的 `writeFile(path, data)` 方法：呼叫 `phpBinary.FS.writeFile(path, data)`（對應 spec：Virtual FS entries are mounted into php-wasm before execution）
- [x] 2.5 手動測試：啟動 `pnpm dev`，導覽至 PHP（php-demo）挑戰，確認不再出現「PHP runtime loader not configured」錯誤，送出 GET 請求能收到 PHP 執行結果

## 4. 修復 Flask sqlite3 — 區分 native 與 pip 套件

- [x] 4.1 在 `ChallengeLayout.vue` 的 `BASE_PACKAGES.flask`（或對應位置）加入 `'sqlite3'`，確保 Flask 挑戰初始化時會載入 sqlite3（對應 spec：Python challenge runtime initializes on first mount）
- [x] 4.2 在 `usePythonRuntime.ts` 的 `_init()` 中加入 `PYODIDE_NATIVE_PKGS` 白名單（`['sqlite3', 'ssl', 'lzma', 'numpy', 'pandas']`），將 native packages 路由到 `pyodide.loadPackage()` 而非 `micropip.install()`（對應 design 決策：Flask sqlite3：native packages 用 loadPackage，pip packages 用 micropip）
- [x] 4.3 確認 `pnpm test` 所有測試仍通過（無回歸）

## 5. 修復 PHP WASM — Vite optimizeDeps 排除 php-wasm

- [x] 5.1 在 `.vitepress/config.mts` 的 Vite 設定中加入 `optimizeDeps: { exclude: ['php-wasm'] }`，避免 Vite esbuild 預處理 php-wasm 破壞 `import.meta.url` 的 WASM 路徑解析（對應 design 決策：PHP WASM：php-wasm 排除 optimizeDeps）
- [x] 5.2 手動測試：`pnpm dev` 後導覽至 PHP（php-demo）挑戰，確認不再出現「Cannot read properties of undefined (reading 'FS')」，PhpWeb binary 可正常載入

## 6. 修復 SW — PHP relay stub 與 SW 未就緒的 dispatch 錯誤

- [x] 6.1 `docs/public/challenge-sw.js`：移除 PHP 特殊 stub（直接回傳 503 的分支），讓 `backend === 'php'` 走與 flask/fastapi 相同的 `relayRequest(port, request)` 路徑（對應 design 決策：PHP 透過 MessageChannel relay；滿足 spec：PHP challenge page loads without runtime error）
- [x] 6.2 `ChallengeLayout.vue`：`dispatch` 函數加入 SW controller 檢查，若 `navigator.serviceWorker.controller` 為 null 則回傳 503 錯誤訊息，取代瀏覽器直接拋出 ERR_CONNECTION_REFUSED（對應 spec：Challenge page initializes WASM runtime on mount）
- [x] 6.3 確認 `pnpm test` 所有測試仍通過（無回歸）

## 7. 修復 WSGI/ASGI 橋接 — _asgi_bridge 同時支援 Flask (WSGI) 與 FastAPI (ASGI)

- [x] 7.1 在 `usePythonRuntime.ts` 的 `_asgi_bridge` 中加入 `_is_wsgi()` 偵測函式，當 app 為 2-arg 非 coroutine callable（WSGI）時走 WSGI 路徑（呼叫 `app(environ, start_response)`），否則走原有 ASGI 路徑（`await app(scope, receive, send)`）（修復：Flask.__call__() takes 3 positional arguments but 4 were given）
- [x] 7.2 確認 `pnpm test` 所有測試仍通過（無回歸）

## 3. 修復既有失敗測試

- [x] 3.1 `tests/__mocks__/virtual-fs.ts`：補上 `wasm_fs_reset` no-op export（對應 design 決策：測試 mock 需同步更新），避免使用 ChallengeLayout 的測試找不到此函式
- [x] 3.2 `tests/unit/composables/usePythonRuntime-packages.test.ts`：`makeMockPyodide` 的 pyodide mock 加入 `loadPackage: vi.fn().mockResolvedValue(undefined)`，修復「this.pyodide.loadPackage is not a function」
- [x] 3.3 `tests/unit/composables/usePythonRuntime-request.test.ts`：更新 `makeMockFlaskPyodide` 與 scope-capture test，mock `globals.get('_asgi_bridge')` 回傳符合新 API 的函式（取代舊有 `globals.get('app')` ASGI mock），修復「bridge is not a function」
- [x] 3.4 `tests/e2e/flask-sqli.test.ts`：同 3.3，更新 `makeMockFlaskPyodide` 支援 `'_asgi_bridge'`，修復「expected 500 to be 200」
- [x] 3.5 執行 `pnpm test`，確認所有測試通過（無回歸）
