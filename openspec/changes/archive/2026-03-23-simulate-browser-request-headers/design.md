## Context

BrowserPanel 目前透過 `dispatch()` 發送 HTTP request，但建立 `Request` 物件時僅帶有極少的 header。由於 `useTrafficLog.wrap()` 直接讀取 `request.headers.entries()`，Network Traffic 面板記錄的 header 自然也不完整。

實作過程中發現：瀏覽器 Fetch API（及 happy-dom / jsdom）將多數「瀏覽器識別用」header 視為 **forbidden request headers**，`new Request()` 建構時會靜默丟棄。受影響的 header 包含：`User-Agent`、`Referer`、`Origin`、`Host`、`Content-Length`、`Accept-Encoding`、`Connection`，以及所有 `Sec-*` header。因此，原「在 BrowserPanel 建構 Request 時直接設定 header」的方案無法實作。

受影響檔案：
- `.vitepress/theme/components/BrowserPanel.vue` — 請求情境標記
- `.vitepress/theme/composables/useTrafficLog.ts` — header 補全邏輯

## Goals / Non-Goals

**Goals:**

- 讓 Network Traffic 面板顯示完整的模擬瀏覽器 header
- 依請求情境（網址列導航、連結點擊、form 提交）動態組合正確的 header 集合
- 集中管理 header 邏輯，避免各呼叫點重複

**Non-Goals:**

- 不修改 `RepeatPanel.vue` — 使用者手動編輯 raw request，已有完整 header
- 不模擬 Cookie（Cookie 由 runtime 的 Set-Cookie 控制，屬於另一層）
- 不模擬 `If-None-Match`、`If-Modified-Since` 等 cache-related header
- 不讓 Runtime 真正收到 forbidden headers（瀏覽器 Fetch API 限制，無法突破）

## Decisions

### 情境標記透過 metadata header 傳遞，header 補全在 useTrafficLog 層進行

BrowserPanel 在建立 `Request` 時加入兩個自訂 metadata header：
- `X-Wxlsh-Context`: `navigation` | `link` | `form-get` | `form-post`
- `X-Wxlsh-Referer`: 當前頁面 URL（只有 link / form 情境）

`useTrafficLog.wrap()` 在攔截時：
1. 讀取並移除這兩個 metadata header（避免傳到 runtime）
2. 依情境組合完整的「顯示用」模擬瀏覽器 header
3. 以帶有完整 header 的 `TrafficEntry.requestHeaders` 記錄
4. 將移除 metadata header 後的乾淨 request 傳給實際 dispatch

**理由**：Forbidden headers 無法透過 JavaScript 設定在 Request 物件上；但 `useTrafficLog` 在記錄時可以自行組合顯示資料，不受此限制。自訂 `X-Wxlsh-*` 前綴確保不與應用程式 header 衝突，且在進入 runtime 前被移除。

**替代方案（放棄）**：在 BrowserPanel 端的 `buildBrowserRequest()` 設定 header — 實作驗證後確認 forbidden headers 會被靜默丟棄，功能無法實現。

### 靜態 header 集合（所有請求共用，在 useTrafficLog 補全）

```
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Sec-Ch-Ua: "Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="24"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "macOS"
Upgrade-Insecure-Requests: 1
```

**理由**：固定模擬 Chrome 120 on macOS，與 RepeatPanel 預設值一致。

### 動態 header 依情境加入（在 useTrafficLog 補全）

| 情境 | 額外 header |
|------|-------------|
| 所有請求 | `Host: challenge-<slug>.localhost` |
| 網址列 GET | `Sec-Fetch-Dest: document`、`Sec-Fetch-Mode: navigate`、`Sec-Fetch-Site: none`、`Sec-Fetch-User: ?1` |
| 連結點擊 GET | `Referer: <currentUrl>`、`Sec-Fetch-Dest: document`、`Sec-Fetch-Mode: navigate`、`Sec-Fetch-Site: same-origin` |
| Form GET | `Referer: <formPageUrl>`、`Sec-Fetch-Dest: document`、`Sec-Fetch-Mode: navigate`、`Sec-Fetch-Site: same-origin`、`Sec-Fetch-User: ?1` |
| Form POST（urlencoded）| 上述 + `Origin: http://challenge-<slug>.localhost`、`Content-Type: application/x-www-form-urlencoded`、`Content-Length: <n>` |
| Form POST（multipart）| 上述（`Content-Type` 由 fetch 自動帶 boundary） |

### Header 名稱大小寫：Title-Case（HTTP/1.1）

`buildDisplayHeaders()` 輸出前統一套用 `toTitleCase()` 轉換，將 `user-agent` → `User-Agent`、`sec-fetch-site` → `Sec-Fetch-Site` 等。Response headers 亦同。

**理由**：HTTP/1.1 慣例為 Title-Case（與 Burp Suite 風格一致）；HTTP/2 規範雖為全小寫，但本平台所有請求均為 HTTP/1.1，固定 Title-Case 輸出即可。

### Host header 排序：固定第二行

`buildDisplayHeaders()` 以 Map 插入順序為準，Host 最先插入，確保在顯示與 Send to Repeater 輸出中固定出現在 request line 之後的第一行（HTTP/1.1 慣例）。

### `<pre>` 顯示的空白問題修正

NetworkPanel 的 `<pre>` 區塊原使用縮排的 `<template>` 子元素，Vue 會將縮排空白原樣輸出，導致第一行出現多餘前置空格。改為將整個內容以單一 inline expression `{{ expr }}` 緊貼 `<pre>` 標籤輸出，消除不必要的空白字元。

## Risks / Trade-offs

- [Runtime 看不到模擬 header] Forbidden headers 在 JS 環境無法設定，runtime 只能看到 Content-Type 等非禁止 header → 可接受，Network panel 的顯示目的已達成；若日後需要 runtime 辨識 User-Agent，可考慮在 ASGI bridge 層注入
- [X-Wxlsh-* 洩漏] 若 dispatch chain 不經過 useTrafficLog，metadata header 會進入 runtime → 緩解：useTrafficLog.wrap() 負責清除，設計上 BrowserPanel 一律使用 trackedDispatch
