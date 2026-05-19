## Context

目前挑戰頁面載入後，`ChallengeLayout.vue` 只向 Service Worker 發送 `REGISTER_CHALLENGE`，既未解密 FS 也未初始化 WASM runtime。Service Worker 的 `challenge-sw.js` 嘗試接收 `msg.dispatch`（JS 函數），但函數無法透過 `postMessage` 傳遞（不可序列化），導致 `pythonDispatch` 永遠是 `null`，所有挑戰請求回傳 503。

現有的可用基礎設施：
- `virtual-fs` WASM（`wasm_fs_init` / `wasm_fs_read`）已建置並部署於 `docs/public/wasm/virtual-fs/`
- `PythonRuntime` class 已完整實作於 `.vitepress/theme/composables/usePythonRuntime.ts`
- `aesGcmDecrypt` TypeScript 工具已實作於 `.vitepress/challenge/crypto.ts`
- Frontmatter 在 build time 已正確加密（`encryptedFs`、`fsKeyParts`）

## Goals / Non-Goals

**Goals:**

- 使挑戰頁面能正確初始化 Python/PHP WASM runtime
- 建立 Service Worker ↔ 頁面的 MessageChannel relay，讓 `challenge-*.localhost` fetch 真正被攔截並由 runtime 處理
- 讓 `backend: flask` 和 `backend: fastapi` 挑戰可正常執行
- 新增 `packages` frontmatter 欄位支援 micropip 額外套件
- 新增 FastAPI 示範挑戰

**Non-Goals:**

- 不修改 PHP runtime 的 dispatch 機制（保持現有 PHP 流程不變，未來另行處理）
- 不實作 IndexedDB 快取（virtual-fs 的 IDB 功能留待未來）
- 不修改 WASM 模組的 Rust 原始碼

## Decisions

### 使用 MessageChannel relay 連接 SW 與頁面 runtime

**選擇**：SW 攔截 `challenge-*.localhost` fetch → 透過 MessageChannel 傳序列化 request 給頁面 → 頁面用 runtime 處理 → 回傳序列化 response。

**理由**：
- 符合現有 spec（SW 確實攔截請求，URL 真正為 `challenge-slug.localhost`）
- 符合瀏覽器安全模型（不需特殊 CORS 設定）
- 相比 SharedWorker 方案更簡單，無需額外 worker 檔案

**實作細節**：
1. 頁面 mount 時建立 `MessageChannel`（mc）
2. `REGISTER_CHALLENGE` 訊息改為同時傳入 `mc.port2`（transferable）
3. SW 儲存 `registry.set(slug, { backend, port: mc.port2 })`
4. SW 攔截 fetch → 序列化 request → 建立 per-request MessageChannel（rc）→ 透過 challenge port 發送 `{ type: 'HANDLE_REQUEST', ...requestData, responsePort: rc.port2 }`
5. 頁面透過 `mc.port1` 接收 → 呼叫 `runtime.handleRequest()` → 序列化 response → postMessage 到 `responsePort`
6. SW 接收 response → 建構 `Response` 物件回傳

**Request 序列化格式**：
```
{ type: 'HANDLE_REQUEST', method, url, headers: [[k,v]], body: Uint8Array | null, responsePort: MessagePort }
```

**Response 序列化格式**：
```
{ status: number, headers: [[k,v]], body: Uint8Array }
```

### build plugin 自動將 app 檔案加入 encryptedFs

**選擇**：`processChallengeFrontmatter` 在處理 `fs` map 時，自動讀取 `app` 指定的本地檔案並以 `__app__` 為 key 加入 `encryptedFs`。`ProcessedChallenge` 新增 `appPath: '__app__'` 供 runtime 使用。

**理由**：
- 向後相容（frontmatter 的 `app: ./sqli-demo/app.py` 寫法不需改變）
- app code 以加密形式儲存，符合 black-box 挑戰設計
- 不改變 `fs` map 的語意（虛擬路徑 → 本地檔案）

**替代方案**：要求 app 必須出現在 `fs` map → 破壞既有 frontmatter，排除。

### 以 `backend` 類型決定基礎 micropip 套件，`packages` 只加額外套件

**選擇**：
- `backend: flask` → 自動安裝 `['flask']`
- `backend: fastapi` → 自動安裝 `['fastapi', 'anyio']`
- `packages: ['requests', ...]` → 與上述合併後一次安裝

**理由**：challenge 作者不需重複指定框架套件；`packages` 欄位只表達「除了框架之外還需要什麼」，更直覺。

### 使用 virtual-fs WASM 解密，而非 TypeScript aesGcmDecrypt

**選擇**：Runtime 初始化時使用 `wasm_fs_init` / `wasm_fs_read` 解密。

**理由**：`virtual-fs` WASM 已建置並部署；使用它可讓 key bytes 留在 Rust 記憶體中，不暴露於 JS heap（更好的安全特性）。`aesGcmDecrypt` TypeScript 版本作為 fallback 備用。

## Risks / Trade-offs

- **body 序列化大小**：大型 request body 透過 MessageChannel 傳遞會複製記憶體。使用 `Transferable`（`ArrayBuffer`）可避免複製，但需注意 transfer 後原 buffer 失效。→ 使用 `transfer` 選項傳遞 body ArrayBuffer。

- **SW 生命週期**：若 SW 更新（`skipWaiting`），舊頁面的 `mc.port2` 會失效，新 SW 不知道已有哪些 challenges 註冊。→ 頁面監聽 `controllerchange` 事件後重新發送 `REGISTER_CHALLENGE`。

- **Pyodide 載入時間**：Pyodide 首次載入需 5–15 秒（CDN 下載）。→ 在 `ChallengeLayout` 顯示載入狀態（loading indicator），待 runtime ready 後才啟用 Send 按鈕。

- **micropip 安裝失敗**：若指定套件在 Pyodide 套件庫中不存在，`micropip.install` 會拋出錯誤。→ 捕獲錯誤並在 terminal panel 顯示，讓作者知道套件名稱有誤。
