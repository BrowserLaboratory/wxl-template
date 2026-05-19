## Context

Challenge 平台使用 Service Worker 攔截 `challenge-<slug>.localhost` 的 fetch 請求，透過 MessageChannel relay 將請求轉發回頁面端的 runtime（PythonRuntime / PhpRuntime）處理。目前的流程：

```
BrowserPanel.dispatch() → fetch() → SW fetch handler → registry.get(slug)
  → MessageChannel relay → 頁面端 handleRequest() → runtime.handleRequest()
  → 回傳 response 給 SW → 回傳給 fetch caller
```

問題在於 `registry.get(slug)` 可能在 `REGISTER_CHALLENGE` 訊息到達前執行，導致隨機出現 503 "challenge not registered" 錯誤。

受影響檔案：
- `docs/public/challenge-sw.js` — SW fetch handler
- `.vitepress/theme/layouts/ChallengeLayout.vue` — dispatch 函式、SW 註冊流程

## Goals / Non-Goals

**Goals:**

- 消除所有導致 "challenge not registered" 的 race condition
- 對 BrowserPanel / RepeatPanel 的程式化請求：繞過 SW，直接呼叫 runtime
- 對 iframe 子資源等仍經 SW 的請求：加入等待機制作為 safety net

**Non-Goals:**

- 不改變 SW 的整體架構（仍保留 SW 攔截能力）
- 不改變 runtime 初始化流程
- 不改變 MessageChannel 註冊協議（REGISTER_CHALLENGE / UNREGISTER_CHALLENGE 訊息格式不變）

## Decisions

### 直接 dispatch 繞過 SW

ChallengeLayout 的 `dispatch()` 目前是 `fetch(request)`，改為直接呼叫 `runtime.handleRequest(request)`。

**理由**：現行流程 Page → SW → Page → runtime → Page → SW → Page 是不必要的 round-trip。直接呼叫 runtime 不僅消除 race condition，還減少延遲。

**替代方案**：僅靠 SW 端等待機制修復。但這只治標不治本 —— 程式化請求根本不需要經過 SW。

### SW 等待機制

在 `challenge-sw.js` 的 `handleChallengeRequest()` 中，當 `registry.get(slug)` 回傳 `undefined` 時，建立一個 Promise 等待 `REGISTER_CHALLENGE` 訊息到達（timeout 3 秒）。

實作方式：維護一個 `pendingRegistrations` Map，key 為 slug，value 為 resolve callback 陣列。收到 `REGISTER_CHALLENGE` 時，resolve 所有等待該 slug 的 callback。

**理由**：iframe 子資源載入（CSS、圖片等）仍會觸發 SW fetch，無法被頁面端 dispatch 攔截。等待機制確保這些請求不會因為時序問題失敗。

**timeout 3 秒**：runtime 初始化通常需要數秒（載入 Pyodide、安裝 packages）。3 秒足夠等待 registration，但不會讓使用者等太久。超時後仍回傳 503，代表真正的註冊失敗。

## Risks / Trade-offs

- [SW 等待阻塞] 在 registration 前到達的 SW 請求會被阻塞最多 3 秒 → 可接受，因為這些請求原本就會失敗，等待後成功是更好的結果
- [直接 dispatch 跳過 SW] 如果未來有邏輯需要在 SW 層攔截/修改請求，直接 dispatch 會繞過 → 目前無此需求，未來如有需要可在 dispatch 層加 hook
- [Runtime 未就緒時直接 dispatch] runtime 未初始化完成時呼叫 handleRequest 會報錯 → 由現有 `toolsDisabled` gate 防護，使用者無法在 runtime ready 前操作
