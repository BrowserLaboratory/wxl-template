## Why

Terminal 與 Code Editor 兩個面板的 HTTP 請求路徑都壞了：Terminal 的 `curl`/`wget` 因為 Python 呼叫 JS async bridge 沒有 `await` 導致 `PyodideFuture` 錯誤；Code Editor 的 `requests` monkey-patch 用 synchronous `XMLHttpRequest` 打虛擬域名 `challenge-*.localhost`，但該域名只是 Service Worker 攔截用的路由，XHR 無法解析，直接 `NetworkError`。此外 Terminal 的顯示方式不像原生 Linux（prompt 格式、`ls` 為空 stub、`help` 只列出 Tier 1、`date` 輸出 JS 格式等），需要一併改善。

## What Changes

- **統一 HTTP dispatch**：Terminal（`useWxlsh.ts`）和 Code Editor（`usePythonRuntime.ts`）的 HTTP 路徑統一改為經過 async JS dispatch bridge，不再使用 synchronous XHR
- **修復 Terminal curl/wget async 問題**：Python 端的 `_WxlshDispatch.request()` 和 `_cmd_curl`/`_cmd_wget` 改為 `async def` + `await`，TypeScript 呼叫端也加上 `await`
- **修復 Code Editor requests patch**：`_patched_send` 從 synchronous XHR 改為注入 JS dispatch bridge，透過 Pyodide 的 async 機制橋接 sync `requests` API
- **Terminal 外觀改善**：prompt 格式改為 `hacker@wxlsh:~$`、`help` 列出所有可用指令（含 Tier 2-4）、`date` 使用 Linux 格式、修復 `cd ..` 支援
- **徹查所有指令**：確認 Tier 1-4 所有指令能正確運作，修復 `which` 找不到 Python 指令等問題

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `wxlsh-terminal`: prompt 格式從 `wxlsh$ ` 改為 `hacker@wxlsh:~$`，banner 維持
- `wxlsh-commands`: `help` 須列出所有 Tier 含 Python 指令；`which` 須辨識 Python 指令；`date` 格式改為 Linux 標準；`cd` 支援 `..`
- `requests-shim`: `_patched_send` 從 synchronous XHR 改為 async JS dispatch bridge，透過 Pyodide 機制橋接
- `code-editor-panel`: Code Editor 執行 `requests.get()` 等呼叫改為走 JS dispatch bridge

## Impact

- Affected specs: `wxlsh-terminal`、`wxlsh-commands`、`requests-shim`、`code-editor-panel`
- Affected code:
  - `.vitepress/theme/composables/useWxlsh.ts`（Python commands + bridge + Tier 1 指令修正）
  - `.vitepress/theme/composables/usePythonRuntime.ts`（REQUESTS_MONKEY_PATCH 改寫）
  - `.vitepress/theme/components/WxlshPanel.vue`（prompt 格式、banner）
  - `.vitepress/theme/layouts/ChallengeLayout.vue`（注入 dispatch bridge 至 Pyodide globals）
  - `tests/__mocks__/virtual-fs.ts`（可能需更新 mock）
  - 相關單元測試
