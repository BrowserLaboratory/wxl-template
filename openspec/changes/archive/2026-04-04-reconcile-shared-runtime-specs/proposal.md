## Why

共享 runtime 的 active specs 目前同時保留多個互斥敘述，讓 `ChallengeLayout.vue`、`router.ts`、`usePythonRuntime.ts` 與 frontmatter 解析器的真實契約無法由 spec 單獨判讀。正式發版前必須先把這些平台層 contract 收斂，否則後續 change 會繼續建立在錯誤或重複的需求描述上。

## What Changes

- 對齊 `challenge-ui` 對互動面板數量、共用 `trackedDispatch`、Browser Panel 請求路徑與 iframe sandbox 的規格描述。
- 更新 `challenge-framework` frontmatter schema，明確 `wasmModule` 的生成責任、`fs` 的相容定位，以及 challenge page 實際可依賴的欄位。
- 收斂 `python-asgi-runtime` 對 Rust/WASM bridge 與 `usePythonRuntime.ts` 的責任邊界，明確 request/response lifecycle 的真實流程。
- 補充 `service-worker-router` 與 shared runtime 的分工，界定哪些流量必須經過 Service Worker，哪些由 UI 直接 dispatch 到 runtime。

## Non-Goals (optional)

- 不重新設計 Challenge UI 或 Python runtime 架構。
- 不新增新的 panel、backend 類型或 browser sandbox 能力。
- 不處理與共享 runtime contract 無關的單一 challenge 內容問題。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `challenge-ui`: 將共享 panel、request flow 與 browser sandbox/origin 契約收斂成單一版本。
- `challenge-framework`: 將 frontmatter schema 與自動注入 `wasmModule` 的行為對齊現行平台。
- `python-asgi-runtime`: 將 ASGI bridge、Pyodide runtime 與請求轉譯責任改寫為單一一致的規格。
- `service-worker-router`: 明確 Service Worker 路由只負責需要攔截的 challenge-origin 請求，不與直接 runtime dispatch 混淆。

## Impact

- Affected specs: `challenge-ui`, `challenge-framework`, `python-asgi-runtime`, `service-worker-router`
- Affected code: `.vitepress/theme/layouts/ChallengeLayout.vue`, `.vitepress/theme/components/BrowserPanel.vue`, `.vitepress/theme/components/RepeatPanel.vue`, `.vitepress/theme/composables/usePythonRuntime.ts`, `.vitepress/challenge/config.ts`, `docs/public/challenge-sw.js`, `.vitepress/workers/router.ts`
