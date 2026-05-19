## Why

目前挑戰介面只有 BrowserPanel（查看渲染結果）和 RepeatPanel（手動發送 request），缺少一個被動觀察所有 HTTP traffic 的工具。對 web exploit 初學者來說，能直接看到「操作 → request → response」的完整流程是最重要的學習回饋。新增類似 Burp Suite HTTP History 的 Network Traffic 面板，讓學習者不需要外部工具就能觀察與靶機的所有互動紀錄。

## What Changes

- 新增 `NetworkPanel` 元件，作為獨立 tab 與 Browser、Repeater 並列
- 在 `dispatch()` 攔截點記錄所有 request/response 資料（method、URL、status、headers、body、duration）
- 提供列表視圖 + 展開詳情（Request/Response sub-tab 切換）
- 提供「Send to Repeater」功能，將選中的 request 內容注入 RepeatPanel
- 提供 Clear 按鈕清空記錄、顯示總筆數

## Capabilities

### New Capabilities

- `network-traffic-panel`: 定義 NetworkPanel 元件的 UI 結構、traffic 記錄的資料模型、列表/詳情互動、以及 Send to Repeater 的跨面板通訊機制

### Modified Capabilities

- `challenge-ui`: 新增 Network tab 到現有的 tab 導航系統，擴展面板切換邏輯

## Impact

- 受影響的程式碼：
  - `.vitepress/theme/layouts/ChallengeLayout.vue`（新增 tab、traffic 狀態管理、dispatch 攔截）
  - `.vitepress/theme/components/NetworkPanel.vue`（新元件）
  - `.vitepress/theme/components/RepeatPanel.vue`（接收 Send to Repeater 注入）
- 無外部依賴變更
- 無 breaking changes
