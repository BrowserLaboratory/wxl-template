## 1. Traffic 攔截層

- [x] 1.1 在 ChallengeLayout 中定義 `TrafficEntry` 型別與 reactive `trafficLog` 陣列，實作 dispatch wrapper（trackedDispatch）記錄所有 request/response 的 method、URL、headers、body、status、duration — 對應 design「Traffic 攔截層：包裝 dispatch 函數」與「Traffic Entry 資料結構」
- [x] 1.2 將 BrowserPanel 與 RepeatPanel 的 dispatch prop 改為傳入 trackedDispatch，確保 traffic recording intercepts all requests via dispatch wrapper

## 2. NetworkPanel 元件

- [x] 2.1 建立 `NetworkPanel.vue` 元件，實作 traffic 列表表格，NetworkPanel displays a chronological list of all HTTP traffic entries（含 method、URL、status、duration、總筆數）
- [x] 2.2 實作展開/收合詳情功能，NetworkPanel shows request and response details for a selected entry（Request/Response sub-tab 切換）
- [x] 2.3 實作 Clear 按鈕，NetworkPanel provides a Clear button to reset traffic history
- [x] 2.4 實作 Send to Repeater 按鈕，NetworkPanel provides Send to Repeater action for each traffic entry，將 request 格式化為 raw HTTP request 字串並 emit 事件

## 3. ChallengeLayout 整合

- [x] 3.1 新增 Network tab 到 tab 導航系統，修改「ChallengeLayout provides three switchable interaction panels」為四個面板（對應 design「NetworkPanel 元件為獨立 Tab」）
- [x] 3.2 處理 NetworkPanel 的 Send to Repeater 事件：透過 prop 注入 initial request 到 RepeatPanel 並切換 tab（對應 design「Send to Repeater：透過 prop 注入 initial request」）

## 4. RepeatPanel 擴展

- [x] 4.1 為 RepeatPanel 新增 `injectedRequest` optional prop，watch 變化後填入編輯區（對應 Send to Repeater 功能）

## 5. 測試

- [x] 5.1 為 trackedDispatch 撰寫單元測試，驗證 traffic recording intercepts all requests via dispatch wrapper
- [x] 5.2 為 NetworkPanel 撰寫元件測試，涵蓋列表顯示、展開詳情、Clear、Send to Repeater
- [x] 5.3 為 RepeatPanel 的 injectedRequest prop 撰寫測試
- [x] 5.4 更新 ChallengeLayout 測試，驗證 Network tab 與 Send to Repeater 整合流程
