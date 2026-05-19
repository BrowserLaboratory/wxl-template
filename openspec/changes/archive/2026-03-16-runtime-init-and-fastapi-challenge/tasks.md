## 1. Frontmatter Schema 與 Build Plugin 更新

- [x] 1.1 在 `ChallengeConfig` 介面新增 `packages?: string[]` 欄位，更新 `validateChallengeConfig` 預設為空陣列（challenge-framework: Frontmatter supports optional packages field for micropip）
- [x] 1.2 在 `ProcessedChallenge` 介面新增 `packages: string[]` 與 `appVirtualPath: '__app__'` 欄位
- [x] 1.3 更新 `processChallengeFrontmatter`：build plugin 自動將 app 檔案加入 encryptedFs — 自動讀取 `app` 欄位指定的本地檔案，加密後存入 `encryptedFs['__app__']`（challenge-framework: Build plugin encrypts app source file and stores it under reserved key）
- [x] 1.4 更新 `processChallengeFrontmatter`：將 `packages` 傳遞至 `ProcessedChallenge.packages`（challenge-framework: Frontmatter schema defines challenge metadata）
- [x] 1.5 撰寫/更新 `config.test.ts` 測試：驗證 `packages` 欄位解析、缺少時預設 `[]`
- [x] 1.6 撰寫/更新 `plugin.test.ts` 測試：驗證 `__app__` 加密條目存在於 `encryptedFs`，且與 `fs` map 條目不衝突（challenge-framework: __app__ key is separate from fs map entries）

## 2. Python Runtime 新增 micropip 支援

- [x] 2.1 更新 `PythonRuntime.initialize()` 簽名：新增 `packages: string[] = []` 參數（python-asgi-runtime: Python ASGI runtime installs micropip packages before app execution）
- [x] 2.2 在 `PythonRuntime._init()` 中，若 `packages` 非空，在執行 `app_code` 前執行 `micropip.install(packages)`（python-asgi-runtime: Packages are installed before app code runs）
- [x] 2.3 確保 `packages` 為空時跳過 micropip 呼叫（python-asgi-runtime: Empty packages list skips micropip）
- [x] 2.4 micropip 安裝失敗時，讓 `initialize()` 以含套件名稱的錯誤 reject（python-asgi-runtime: Package installation failure surfaces as initialization error）
- [x] 2.5 撰寫 `usePythonRuntime-packages.test.ts` 測試：覆蓋安裝成功、空陣列跳過、安裝失敗三個情境

## 3. Service Worker MessageChannel Relay 重寫

- [x] 3.1 使用 MessageChannel relay 連接 SW 與頁面 runtime — 重寫 `docs/public/challenge-sw.js`：`REGISTER_CHALLENGE` 訊息改為接收並儲存 `msg.port`（MessagePort），移除 `SET_PYTHON_DISPATCH` / `SET_PHP_DISPATCH` 處理器（service-worker-router: Challenge page registers itself with the Service Worker）
- [x] 3.2 在 `challenge-sw.js` 的 `handleChallengeRequest` 中：序列化 request（method, url, headers, body ArrayBuffer），建立 per-request MessageChannel，透過 challenge port 發送 `{ type: 'HANDLE_REQUEST', ...requestData, responsePort }`，await response（service-worker-router: Router dispatches to correct runtime based on challenge type）
- [x] 3.3 在 `challenge-sw.js` 中組裝來自 page 的 `{ status, headers, body }` response 並回傳（service-worker-router: Flask challenge request is dispatched via MessageChannel relay；FastAPI challenge request is dispatched via MessageChannel relay）
- [x] 3.4 更新 `.vitepress/workers/router.ts`：同步更新 TypeScript 原始檔以反映新的訊息協定（確保測試檔案可用）
- [x] 3.5 撰寫/更新 `tests/unit/workers/router.test.ts` 測試：覆蓋 MessageChannel relay、未知 backend 501、unregister 後 503

## 4. ChallengeLayout Runtime 初始化

- [x] 4.1 在 `ChallengeLayout.vue` 的 `onMounted` 中：使用 virtual-fs WASM 解密，而非 TypeScript aesGcmDecrypt — 載入 `virtual-fs` WASM 模組（`wasm_fs_init` / `wasm_fs_read`）（challenge-runtime-init: App code is decrypted from encryptedFs and executed）
- [x] 4.2 從 frontmatter 的 `fsKeyParts` 重組 32-byte key，呼叫 `wasm_fs_init(paths, encryptedBlobs)` 初始化 FS store（challenge-runtime-init: Challenge page initializes WASM runtime on mount）
- [x] 4.3 呼叫 `wasm_fs_read` 解密所有 FS 條目（包含 `__app__`），取得 `appCode` 與 `fsEntries`
- [x] 4.4 以 `backend` 類型決定基礎 micropip 套件，`packages` 只加額外套件 — 依據 `backend` 決定基礎套件（`flask` → `['flask']`；`fastapi` → `['fastapi', 'anyio']`），合併 frontmatter `packages`，呼叫 `PythonRuntime.initialize(appCode, fsEntries, mergedPackages)` 或 `PhpRuntime.initialize(appCode, fsEntries)`（challenge-runtime-init: Python challenge runtime initializes on first mount）
- [x] 4.5 初始化期間顯示 loading 狀態，BrowserPanel Send 按鈕在 runtime ready 前 disabled（challenge-runtime-init: Loading state is shown during initialization）
- [x] 4.6 建立 `MessageChannel`，在 `REGISTER_CHALLENGE` 訊息中傳入 `port2` 作為 transferable（challenge-runtime-init: ChallengeLayout establishes MessageChannel with Service Worker）
- [x] 4.7 在 `port1` 監聽 `HANDLE_REQUEST` 訊息：重建 `Request`，呼叫 `runtime.handleRequest()`，序列化 response 回傳給 `responsePort`（challenge-runtime-init: ChallengeLayout handles HANDLE_REQUEST and responds）
- [x] 4.8 runtime 初始化確保只執行一次（challenge-runtime-init: Runtime initialization is idempotent）
- [x] 4.9 監聽 `navigator.serviceWorker` 的 `controllerchange` 事件，重新發送 `REGISTER_CHALLENGE` 以應對 SW 更新

## 5. FastAPI 示範挑戰

- [x] 5.1 建立 `docs/challenge/fastapi-demo/app.py`：FastAPI demo challenge is available as a working example — 含簡單 FastAPI 應用程式，包含 `/` 端點與一個安全漏洞（fastapi-challenge: FastAPI challenge responds to HTTP requests）
- [x] 5.2 建立 `docs/challenge/fastapi-demo/flag.txt`：含佔位 flag（例如 `FLAG{fastapi_demo_placeholder}`）
- [x] 5.3 建立 `docs/challenge/fastapi-demo.md`：frontmatter 含 `backend: fastapi`、`packages: ['fastapi', 'anyio']`、`app`、`fs`、`flag_verifier`（佔位）、`fs_key`（佔位）（fastapi-challenge: FastAPI challenge page loads and renders correctly；fastapi-challenge: FastAPI challenge frontmatter specifies packages）
- [x] 5.4 確認 FastAPI 挑戰出現在挑戰列表中

## 6. 整合驗收

- [x] 6.1 啟動 `pnpm dev`，導覽至 Flask（sqli-demo）挑戰：確認 runtime 初始化、Send 回傳正常 HTTP 回應（而非 503）
- [x] 6.2 啟動 `pnpm dev`，導覽至 FastAPI 示範挑戰：確認 micropip 安裝 fastapi/anyio、Send 回傳正常回應
- [x] 6.3 確認 `pnpm test` 通過所有新增與既有測試
