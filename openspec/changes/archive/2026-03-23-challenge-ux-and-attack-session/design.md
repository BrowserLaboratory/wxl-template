## Context

平台目前已有以下基礎設施：

- `useTrafficLog.ts`：以 `wrap(dispatch)` 模式記錄所有 HTTP 交換，產生 `TrafficEntry[]`（記憶體）
- `useChallengePersistence.ts`：使用 `idb` 套件操作 IndexedDB（DB: `challenge-tools` v1），目前有 `code-scripts` 與 `terminal-history` 兩個 object store
- `RepeatPanel.vue`：使用 `window.prompt()` 取得 snapshot 名稱
- `FlagSubmit.vue`：驗證通過後僅顯示靜態成功訊息，無後續操作
- `ChallengeLayout.vue`：統籌所有 runtime、dispatch、tab 切換邏輯

## Goals / Non-Goals

**Goals:**

- 以 IndexedDB 持久化挑戰者的攻擊流程，session 跨頁面存活直至 flag 正確
- 新增 `useAttackSession` composable 封裝 session 生命週期與事件寫入
- 在 `trackedDispatch` 層加入 `source` 標記（`browser` / `repeater`）以區分請求來源
- 將 Repeater 快照命名改為 inline modal，替換 `window.prompt()`
- flag 正確提交後在 FlagSubmit 成功狀態新增「下載攻擊紀錄」按鈕，輸出完整 session JSON
- 補全平台文件（README.md、CONTRIBUTE.md、新增 Usage.md）

**Non-Goals:**

- 不加密 IndexedDB 儲存內容（此為使用者自身資料，不含敏感 flag 以外之機密）
- 不實作多 session 歷史列表 UI（只保留最新一個 session per challenge）
- 不實作 session 同步或雲端備份
- Repeater snapshot 本身繼續使用 localStorage（維持原有行為，僅改 UI）

## Decisions

### 新增 `useAttackSession` composable 管理 session 生命週期

**決策**：將攻擊 session 邏輯完全封裝在新的 `useAttackSession.ts` 中，`ChallengeLayout` 注入後分發給子元件，不在元件層直接操作 IndexedDB。

**理由**：保持元件薄層原則；`ChallengeLayout` 已夠複雜，session 讀寫屬於 side-effect，適合 composable 隔離。

**替代方案**：直接在 `ChallengeLayout` 內寫 session 邏輯 → 拒絕，違反關注點分離。

### IndexedDB DB 版本升級（v1 → v2）加入 `attack-sessions` store

**決策**：在現有 `challenge-tools` DB 中新增第二個 object store `attack-sessions`，key 為 `challengeSlug`（`keyPath: 'challengeSlug'`），DB_VERSION 升至 2。

**理由**：複用現有 `idb` 連線管理模式，避免多 DB 增加複雜度；`attack-sessions` 邏輯上屬於 challenge 工具資料的一部分。

**替代方案**：獨立新開一個 DB → 拒絕，會造成 `idb` 連線重複初始化。

### AttackSession 與 AttackEvent Schema

```typescript
interface AttackSession {
  challengeSlug: string        // IndexedDB key
  challengeTitle: string
  startedAt: number
  solvedAt: number | null
  events: AttackEvent[]
}

type AttackEvent =
  | { type: 'challenge_start'; timestamp: number }
  | { type: 'http_request'; timestamp: number; source: 'browser' | 'repeater'
      id: number; method: string; url: string
      requestHeaders: [string, string][]; requestBody: string | null
      status: number; responseHeaders: [string, string][]; responseBody: string; duration: number }
  | { type: 'flag_attempt'; timestamp: number; submitted: string; correct: boolean }
  | { type: 'challenge_solved'; timestamp: number }
```

**決策**：`http_request` event 直接嵌入完整 headers + body，不引用 `TrafficEntry.id`。

**理由**：`trafficLog` 是記憶體狀態，頁面重整後消失；IndexedDB session 要跨頁面持久化，必須自給自足。

### `source` 標記透過 dispatch wrapper 傳遞

**決策**：在 `ChallengeLayout` 分別為 BrowserPanel 和 RepeatPanel 建立帶 source 標記的 dispatch wrapper，而非修改 `useTrafficLog` 的 `TrafficEntry` 介面。

**理由**：`TrafficEntry` 已有既有使用者（NetworkPanel）；攻擊 session 的 source 只有 `useAttackSession` 需要，不應污染通用的 traffic log 格式。

**實作方式**：`ChallengeLayout` 建立 `browserDispatch = wrapWithSource(trackedDispatch, 'browser')` 與 `repeaterDispatch = wrapWithSource(trackedDispatch, 'repeater')`，兩者都會計入 `trafficLog`，但 session event 中帶有來源標記。

### Repeater inline modal 實作

**決策**：在 `RepeatPanel.vue` 內部用 `ref<boolean>` 控制一個 `v-if` overlay div，包含 `<input>` 文字框、Confirm / Cancel 按鈕，替換 `window.prompt()`。

**理由**：不引入外部 modal 元件庫；保持元件自給自足；樣式與現有 challenge UI CSS 變數一致。

### Export 時機與格式

**決策**：`FlagSubmit` 接收一個 `onExport?: () => void` prop，在成功狀態顯示「下載攻擊紀錄」按鈕；`ChallengeLayout` 實作 `exportSession()` 函式，呼叫 `useAttackSession` 取得當前 session，序列化為 JSON，以 `Blob + <a download>` 方式觸發瀏覽器下載。

**匯出檔案命名**：`attack-session-<slug>-<yyyymmdd-hhmmss>.json`

## Risks / Trade-offs

- **IndexedDB schema 遷移**：DB_VERSION 從 1 升至 2，`upgrade()` 函式需要加判斷避免重複建立 store。若使用者有舊版 DB 資料（`code-scripts`、`terminal-history`），升級時應保留。→ 風險低，`idb` 的 `upgrade` callback 只新增 store，不刪除舊 store。
- **`http_request` event 資料量**：若挑戰者發送大量請求且 response body 很大，IndexedDB 儲存量可能成長。→ 可接受，一般 CTF 挑戰請求數量有限；未來可加 body size 截斷上限。
- **`FlagSubmit` prop 介面改動**：新增 `onExport` prop 為 optional，向後相容，不需修改現有呼叫點以外的地方。
