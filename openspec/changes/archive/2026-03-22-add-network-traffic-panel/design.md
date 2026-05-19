## Context

目前挑戰介面透過 `ChallengeLayout.vue` 提供 tab 式的工具面板（Browser、Repeater），所有 HTTP request 都經過 `dispatch()` 函數直接呼叫 runtime。這個 choke point 是攔截與記錄 traffic 的理想位置。

RepeatPanel 目前接收 `slug`、`dispatch`、`disabled` 三個 props，沒有從外部注入 request 內容的機制。

## Goals / Non-Goals

**Goals:**

- 提供完整的 HTTP traffic 列表，包含 method、URL、status、headers、body、duration
- 讓使用者能點擊任一筆 entry 查看 request/response 詳情
- 提供 Send to Repeater 功能，將 traffic entry 轉為 RepeatPanel 的 raw request
- 提供 Clear 按鈕與總筆數顯示

**Non-Goals:**

- 不做 traffic 持久化（session 性質，重載即清空）
- 不做自動 payload 標記或高亮（避免過度提示影響學習）
- 不做 filter/search 功能（初版保持簡單，未來可擴展）
- 不做 WebSocket 或 SSE traffic 記錄

## Decisions

### Traffic 攔截層：包裝 dispatch 函數

在 `ChallengeLayout.vue` 中建立 reactive 的 `trafficLog` 陣列，並將原始 `dispatch` 包裝為 `trackedDispatch`。所有面板（BrowserPanel、RepeatPanel）都使用 `trackedDispatch` 而非原始 `dispatch`，確保每一筆 request/response 都被記錄。

**替代方案**：在 Service Worker 層攔截 — 但 SW 只處理 iframe navigation 的 request，BrowserPanel 的 `dispatch()` 直接繞過 SW，無法捕獲所有 traffic。

### Send to Repeater：透過 prop 注入 initial request

為 RepeatPanel 新增一個 optional prop `injectedRequest`，型別為 `string | null`。當 NetworkPanel 觸發 Send to Repeater 時，ChallengeLayout 將 raw request 字串設定到此 prop 並切換到 Repeater tab。RepeatPanel watch 此 prop 變化後填入編輯區。

**替代方案**：使用 provide/inject 或 event bus — 但 prop 傳遞更明確、可測試、符合 Vue 單向資料流。

### Traffic Entry 資料結構

```ts
interface TrafficEntry {
  id: number
  timestamp: number
  method: string
  url: string
  requestHeaders: [string, string][]
  requestBody: string | null
  status: number
  responseHeaders: [string, string][]
  responseBody: string
  duration: number
}
```

使用自增 `id` 而非 timestamp 作為 key，避免同 ms 內多筆 request 的衝突。

### NetworkPanel 元件為獨立 Tab

與 Browser、Repeater 同層級的 tab，新增 `'network'` 到 `Tab` union type。不做底部常駐面板，因為右欄空間有限。

## Risks / Trade-offs

- **記憶體成長**：長時間互動會累積大量 entry（特別是 response body）→ 緩解：提供 Clear 按鈕；初版不設上限，未來可加。
- **大型 response body 的顯示**：二進位或超長文字可能影響渲染 → 緩解：對 body 做 truncation 顯示（如超過 10KB 顯示前段 + 提示）。
