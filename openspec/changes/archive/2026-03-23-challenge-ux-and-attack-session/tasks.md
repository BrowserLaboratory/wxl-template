## 1. IndexedDB 升級與 Attack Session 儲存層

- [x] 1.1 修改 `useChallengePersistence` 使其符合「useChallengePersistence manages an IndexedDB database for user tool data」規格：DB_VERSION 升至 2，在 `upgrade` 回調中新增 `attack-sessions` object store（keyPath: `challengeSlug`），實現 IndexedDB DB 版本升級（v1 → v2）加入 `attack-sessions` store，定義 AttackSession 與 AttackEvent schema 型別介面，保留既有 `code-scripts` 與 `terminal-history` stores 及資料不遺失
- [x] 1.2 在 `useChallengePersistence` 中新增 `saveAttackSession` 與 `loadAttackSession`，滿足「Attack sessions can be saved and loaded per challenge slug」規格（upsert 語意，未知 slug 回傳 null）
- [x] 1.3 為 `useChallengePersistence` 新增單元測試：驗證 v2 資料庫初始化、v1 → v2 遷移不遺失資料、saveAttackSession 覆寫行為、loadAttackSession 回傳 null for 未知 slug

## 2. useAttackSession Composable 實作

- [x] 2.1 建立 `.vitepress/theme/composables/useAttackSession.ts`，新增 `useAttackSession` composable 管理 session 生命週期，實作「useAttackSession tracks a persistent attack session per challenge」：初始化時從 IndexedDB 讀取既有 unsolved session（resume）或建立新 session 並附加 `challenge_start` 事件；已 solved session 重訪時建立新 session 覆蓋
- [x] 2.2 實作 `addHttpEvent(entry, source)` 方法，滿足「useAttackSession records HTTP request events with source attribution」：完整 request/response 資料嵌入事件，source 標記透過 dispatch wrapper 傳遞（不依賴記憶體中的 TrafficEntry）
- [x] 2.3 實作 `addFlagAttempt(submitted, correct)` 方法，滿足「useAttackSession records flag attempt events」：附加 `flag_attempt` 事件；若 `correct` 為 true，附加 `challenge_solved` 事件並設置 `solvedAt`
- [x] 2.4 實作 `exportSession()` 方法，滿足「useAttackSession provides session export as JSON」及「export 時機與格式」設計決策：序列化 AttackSession 並以 `attack-session-<slug>-<yyyymmdd-hhmmss>.json` 觸發瀏覽器下載（Blob + `<a download>`）
- [x] 2.5 為 `useAttackSession` 新增單元測試：驗證新 session 建立、unsolved session resume、solved session 重訪建立新 session、flag attempt 紀錄、session solved 狀態轉換、exportSession 觸發下載

## 3. ChallengeLayout 整合 source-attributed dispatch wrappers

- [x] 3.1 在 `ChallengeLayout.vue` 中引入 `useAttackSession`，依 `challengeSlug` 與 `challengeTitle` 初始化 session
- [x] 3.2 實作「ChallengeLayout provides source-attributed dispatch wrappers」：建立 `browserDispatch` 與 `repeaterDispatch`，各自在請求完成後呼叫 `addHttpEvent`，透過 `source` 標記透過 dispatch wrapper 傳遞來區分 `'browser'` / `'repeater'`，同時保持 `trackedDispatch` 的 trafficLog 記錄不中斷
- [x] 3.3 將 `browserDispatch` 傳給 `BrowserPanel`，`repeaterDispatch` 傳給 `RepeatPanel`
- [x] 3.4 在 `ChallengeLayout` 中處理「export 時機與格式」：實作 `exportSession` 並作為 `onExport` prop 傳給 `FlagSubmit`；在 `verify()` 成功後呼叫 `addFlagAttempt(flag, true)`，失敗時呼叫 `addFlagAttempt(flag, false)`
- [x] 3.5 更新 `ChallengeLayout` 單元測試：驗證 browserDispatch/repeaterDispatch source 標記、flag attempt 事件轉發

## 4. Repeater Panel inline modal

- [x] 4.1 修改 `RepeatPanel.vue`，實作 Repeater inline modal 實作：以 `ref<boolean>` 控制 `v-if` overlay，包含自動聚焦的 `<input>`、Confirm 與 Cancel 按鈕，替換 `window.prompt()`；支援 Escape 鍵關閉，滿足「Repeater Panel provides raw HTTP request editing」更新規格
- [x] 4.2 更新 `RepeatPanel` 單元測試：驗證點擊「+ Save」開啟 modal、Confirm 儲存 snapshot、Cancel/Escape 關閉不儲存、snapshot restore 功能

## 5. FlagSubmit 匯出按鈕

- [x] 5.1 修改 `FlagSubmit.vue`，依據「Challenge page displays flag submission form」更新規格：新增 optional `onExport?: () => void` prop；在 `state === 'success'` 時渲染「下載攻擊紀錄」按鈕，點擊時呼叫 `onExport`
- [x] 5.2 更新 `FlagSubmit` 單元測試：驗證成功狀態顯示匯出按鈕、點擊按鈕呼叫 onExport、失敗狀態不顯示匯出按鈕、無 onExport prop 時按鈕不渲染

## 6. 文件更新

- [x] 6.1 更新 `README.md`：補充技術棧表格（加入 IndexedDB attack session tracking）、更新架構圖說明、修正指令表格
- [x] 6.2 更新 `CONTRIBUTE.md`：補充 `scripts/create-challenge.ts` 說明與使用流程
- [x] 6.3 新增 `Usage.md`：涵蓋三個受眾的完整使用路徑 ——（1）挑戰者操作指南（Browser/Network/Repeater/FlagSubmit/攻擊紀錄匯出）、（2）出題者指南（challenge frontmatter 格式、`scripts/create-challenge.ts`、`scripts/challenge-keygen.ts` 使用）、（3）部署者指南（建置流程、靜態部署至 GitHub Pages / Cloudflare Pages）
- [x] 6.4 更新 `Usage.md` Cloudflare Pages 部署指令：改為包含 Rust toolchain 安裝的完整建置指令（`rustup` minimal profile + `cargo install wasm-tools` + `pnpm install` + `pnpm build`），移除「建議改用 GitHub Actions」的注意事項
