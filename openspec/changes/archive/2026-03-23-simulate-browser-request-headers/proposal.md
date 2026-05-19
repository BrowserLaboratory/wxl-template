## Why

挑戰介面的 BrowserPanel 在建立 HTTP request 時幾乎不帶任何 header，導致 Network Traffic 面板記錄的內容與真實瀏覽器行為差距甚大，也使靶機（Flask/PHP runtime）收不到完整的瀏覽器標頭。對學習 web exploit 的使用者而言，觀察不完整的 header 會影響對 HTTP 協議的理解。

## What Changes

- 在 `BrowserPanel.vue` 新增 `buildBrowserRequest()` helper，集中管理完整的模擬瀏覽器 header
- 所有 request 加入靜態瀏覽器標頭：`User-Agent`、`Accept-Language`、`Accept-Encoding`、`Connection`、`Sec-Ch-Ua`、`Sec-Ch-Ua-Mobile`、`Sec-Ch-Ua-Platform`、`Upgrade-Insecure-Requests`
- 依請求情境動態加入：
  - 所有請求：`Host`、`Accept`
  - 連結點擊 GET：`Referer`、`Sec-Fetch-Site: same-origin`
  - Form POST：`Origin`、`Referer`、`Content-Length`、`Sec-Fetch-Site: same-origin`、`Sec-Fetch-User: ?1`
  - 網址列 GET：`Sec-Fetch-Site: none`、`Sec-Fetch-User: ?1`
- 所有 `new Request()` 呼叫改用 `buildBrowserRequest()`，使 runtime 也能真正收到完整 header

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `challenge-ui`：BrowserPanel 發出的 request 必須攜帶完整的模擬瀏覽器 header，header 集合依請求情境（網址列導航、連結點擊、form 提交）有所差異

## Impact

- 受影響程式碼：
  - `.vitepress/theme/components/BrowserPanel.vue`（新增 `buildBrowserRequest()` helper，替換所有 `new Request()` 呼叫）
- 無 breaking changes、無新增依賴
- NetworkPanel 記錄的 header 將自動完整，無需修改 `useTrafficLog.ts`
