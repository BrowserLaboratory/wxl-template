## 1. 注入 dispatch bridge 至 Pyodide globals

- [x] [P] 1.1 在 `ChallengeLayout.vue` 的 Pyodide 初始化流程中，將 dispatch function 包裝為 async JS bridge 並注入 `py.globals.set('_wxlsh_dispatch_bridge', bridge)`，實現注入 dispatch bridge 至 Pyodide globals
- [x] [P] 1.2 同步更新 `installRequestsPatch()` 使其接受 dispatch bridge 參數，用於非 Python backend（PHP）場景

## 2. 修復 requests-shim：monkey-patch HTTPAdapter.send for dispatch bridge

- [x] 2.1 改寫 `usePythonRuntime.ts` 的 `REQUESTS_MONKEY_PATCH`，實現 monkey-patch HTTPAdapter.send for dispatch bridge：將 `_patched_send` 從 synchronous XMLHttpRequest 改為使用 `_wxlsh_dispatch_bridge` global 呼叫 async JS dispatch bridge，並將結果轉換為 `requests.Response`
- [x] 2.2 確認 dispatch bridge not available 場景：當 `_wxlsh_dispatch_bridge` 未設定時，`_patched_send` 拋出 `ConnectionError`

## 3. 修復 Terminal curl/wget：統一 HTTP dispatch 為 async JS bridge（Option B）

- [x] 3.1 將 `useWxlsh.ts` 中的 `_WxlshDispatch.request()` 改為 `async def` + `await self._bridge.call(...)`
- [x] 3.2 將 `_cmd_curl` 和 `_cmd_wget` 改為 `async def` + `await _wxlsh_http.request(...)`，實現 Tier 4 network commands available
- [x] 3.3 修改 TypeScript `executeSingle()` 中 `runPythonAsync()` 的 Python eval 字串，對 async Python commands 加上 `await`

## 4. Terminal prompt 改為 Linux 風格

- [x] [P] 4.1 修改 `WxlshPanel.vue` 的 prompt 格式從 `wxlsh$ ` 改為 `hacker@wxlsh:<cwd>$ `，使用 ANSI 色碼（綠色 username@host、藍色 path），實現 wxlsh terminal renders using xterm.js 的 Linux-style prompt
- [x] [P] 4.2 將 prompt 動態化：`useWxlsh` 暴露 `getCwd()` 方法，`WxlshPanel` 在每次指令執行後更新 prompt 中的 cwd 顯示（`~` shorthand for `/home/hacker`）

## 5. Tier 1 指令修正：command behavior aligned to real Linux tools

- [x] [P] 5.1 修正 `date` 指令輸出為 Linux 格式（`Tue Mar 25 22:40:36 CST 2026`），實現 command behavior aligned to real Linux tools
- [x] [P] 5.2 修正 `cd` 指令支援 `..`（parent directory），解析 `cd ../foo`、`cd /home/hacker/../tmp` 等路徑
- [x] [P] 5.3 修正 help 指令列出所有可用指令（Tier 1-4 含 Python-backed 指令），按功能分類顯示，實現 help lists all available commands by tier（five-tier command system）
- [x] [P] 5.4 修正 `which` 指令辨識 Python-backed 指令（Tier 2-4），回傳 `/usr/bin/<cmd>`

## 6. Code Editor Panel 整合：Code Editor Panel executes Python via Pyodide

- [x] 6.1 確認 Code Editor Panel executes Python via Pyodide：`requests.get()` 等呼叫改走 async JS dispatch bridge 後能正確回傳 `requests.Response`（dispatch bridge injected before requests patch）
- [x] 6.2 驗證 Code Editor `requests.get routes through async dispatch bridge` 場景：執行 `requests.get('https://challenge-<slug>.localhost/notes/1')` 回傳正確 JSON

## 7. 測試驗證

- [x] 7.1 執行 `pnpm test -- --run` 確認所有既有單元測試通過（47 files, 604 tests passed）
- [x] 7.2 手動驗證 FastAPI IDOR Demo：Terminal `curl https://challenge-fastapi-demo.localhost/notes/1` 回傳正確 JSON（截圖確認）
- [x] 7.3 手動驗證 FastAPI IDOR Demo：Code Editor `requests.get(...)` 回傳正確 `requests.Response`（截圖確認）
