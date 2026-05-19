## Why

挑戰者在解題過程中缺乏系統性的操作記錄，無法在完成挑戰後回顧完整攻擊流程或產生 Writeup。此外，Repeater 的快照儲存使用 `window.prompt()` 造成體驗割裂，平台文件也缺乏完整的使用指南。

## What Changes

- **Repeater Save Modal**：將 Repeater 快照命名從 `window.prompt()` 改為內嵌 inline modal UI，保持與平台視覺風格一致
- **攻擊流程記錄系統**：新增 `useAttackSession` composable，在 IndexedDB 中追蹤每個挑戰的攻擊 session（HTTP 請求、flag 嘗試、開始/結束時間），並在 flag 正確提交後提供 JSON 匯出
- **平台文件補全**：更新 README.md 與 CONTRIBUTE.md，新增 Usage.md（涵蓋挑戰者操作、出題者 scripts 使用、部署者建置流程）

## Capabilities

### New Capabilities

- `attack-session-tracking`：以 IndexedDB 為儲存後端，記錄挑戰者的完整攻擊 session（`challenge_start`、`http_request`、`flag_attempt`、`challenge_solved` 事件），session 跨頁面持久化直到 flag 正確為止，solved 後提供完整攻擊流程 JSON 匯出

### Modified Capabilities

- `challenge-ui`：Repeater 快照儲存改用 inline modal 取代 `window.prompt()`；FlagSubmit 在成功狀態下新增「下載攻擊紀錄」按鈕
- `challenge-persistence`：擴充 IndexedDB 用途，新增 `attack-sessions` object store，儲存結構化的 `AttackSession` 物件（含事件序列）
- `network-traffic-panel`：`HttpRequestEvent` 需標注 `source: 'browser' | 'repeater'`，在 `trackedDispatch` 層加入來源 context

## Impact

- 新增 composable：`.vitepress/theme/composables/useAttackSession.ts`
- 修改元件：`RepeatPanel.vue`（inline modal）、`FlagSubmit.vue`（匯出按鈕）、`ChallengeLayout.vue`（注入 session composable）
- 修改 composable：`useTrafficLog.ts`（dispatch source 標記）、`useChallengePersistence.ts`（新增 attack-sessions store）
- 新增/更新文件：`README.md`、`CONTRIBUTE.md`、`Usage.md`（新增）
- 更新 `Usage.md`：Cloudflare Pages 部署指令改為包含 Rust toolchain 安裝的完整建置指令
