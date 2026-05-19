## Context

目前平台有三條 HTTP 路徑：Browser panel 走 `fetch()` → Service Worker → ASGI/WSGI bridge 運作正常；Terminal `curl`/`wget` 走 `_wxlsh_bridge.call()` 但 Python 端沒有 `await` async 結果；Code Editor `requests` 走 synchronous `XMLHttpRequest` 打虛擬域名 `challenge-*.localhost` 但該域名不存在實際 server。

Terminal 外觀也有多項問題：prompt 格式 `wxlsh$ ` 不像 Linux、`help` 只列 Tier 1 指令、`date` 輸出 JS 格式、`cd ..` 不支援、`which` 找不到 Python 指令。

## Goals / Non-Goals

**Goals:**

- 統一 Terminal 與 Code Editor 的 HTTP dispatch 為同一個 async JS bridge 路徑
- 修復 Terminal `curl`/`wget` 的 async/await 錯誤
- 修復 Code Editor `requests` 的 `_patched_send` 改用 async JS dispatch bridge
- 改善 Terminal 外觀使其更接近原生 Linux（prompt、help、date、cd）
- 徹查並修復所有 Tier 1-4 指令的正確性

**Non-Goals:**

- 不實作 VFS file commands（ls、cat、head、tail 等仍為 stub，待 UserVFS 整合）
- 不實作 Tier 5 指令
- 不修改 Service Worker 路由邏輯
- 不添加 Tab completion

## Decisions

### 統一 HTTP dispatch 為 async JS bridge（Option B）

所有 HTTP 請求（Terminal curl/wget、Code Editor requests）統一經過注入至 Pyodide globals 的 async JS dispatch bridge function，不再使用 synchronous XHR。

**Terminal 端修改：**
- `_WxlshDispatch.request()` 改為 `async def`，`await self._bridge.call(...)`
- `_cmd_curl` 和 `_cmd_wget` 改為 `async def`，`await _wxlsh_http.request(...)`
- TypeScript `executeSingle()` 中的 `runPythonAsync()` 呼叫字串加 `await`

**Code Editor 端修改：**
- `REQUESTS_MONKEY_PATCH` 中的 `_patched_send` 改為使用注入的 JS dispatch bridge
- ChallengeLayout 在 Pyodide 初始化時將 dispatch function 注入為 `_wxlsh_dispatch_bridge` global
- `_patched_send` 使用 `pyodide.ffi.run_sync()` 將 async bridge 呼叫轉為 sync，因為 `requests` API 本身是 sync

替代方案考慮：Option A（修路由讓 XHR 解析虛擬域名）— 不採用，因為 sync XHR + Service Worker 在部分瀏覽器有限制，且增加不必要的路由複雜度。

### Terminal prompt 改為 Linux 風格

Prompt 格式從 `wxlsh$ ` 改為 `hacker@wxlsh:~$ `，其中 `~` 會根據 `cwd` 動態變化：
- 在 `/home/hacker` 顯示 `~`
- 在 `/home/hacker/subdir` 顯示 `~/subdir`
- 在其他路徑顯示完整路徑

Banner 維持 "wxlsh 1.0 — web exploit shell" 品牌。

### help 指令列出所有可用指令

`help` 指令改為列出所有 Tier 的可用指令，包含 Python-backed 指令（curl、wget、decode、encode 等），按功能分類顯示。

### Tier 1 指令修正

- `date`：從 `new Date().toString()` 改為 Linux 格式 `Tue Mar 25 22:40:36 CST 2026`
- `cd`：支援 `..`（parent directory）和 `~`（home）
- `which`：辨識 Python-backed 指令（Tier 2-4），回傳 `/usr/bin/<cmd>`

### 注入 dispatch bridge 至 Pyodide globals

ChallengeLayout 在 Pyodide 初始化完成後，將 dispatch function 包裝為 bridge 並注入 `py.globals.set('_wxlsh_dispatch_bridge', bridge)`。`usePythonRuntime.ts` 的 `REQUESTS_MONKEY_PATCH` 使用此 global 而非自行建立 XHR。

dispatch bridge 的 JS function signature：
```typescript
async (method: string, url: string, headersJson: string, body: string) => string
```

回傳 JSON 字串 `{ status, headers, body }` 以避免 JsProxy 跨 WASM boundary 問題。

## Risks / Trade-offs

- [風險] `pyodide.ffi.run_sync()` 在 Pyodide 版本之間 API 變動 → 需確認目前使用的 Pyodide 版本是否支援，若不支援可改用 `XMLHttpRequest` 同步呼叫搭配 `_asgi_bridge` 直接在 Python 端串接
- [風險] Terminal 的 Python 指令改為 async 後，pipe chain 需要正確 await → 現有 `executeSingle` 已使用 `runPythonAsync`，只需在 Python eval 字串中加 `await`
- [取捨] `help` 顯示所有指令需要 hardcode 或動態查詢 Python registry → 使用 hardcode 分類列表較簡單且不依賴 Pyodide 載入狀態
