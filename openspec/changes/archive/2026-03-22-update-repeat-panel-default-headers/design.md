## Context

RepeatPanel.vue 是 web-exploit-challenge 平台中的一個組件，用於發送自定義 HTTP 請求。目前的預設 requestText 只包含基本的 Host header，這對於學習 HTTP 請求的用戶來說不夠真實。

## Goals / Non-Goals

**Goals:**
- 將預設請求更新為包含常見瀏覽器 header 的格式
- 保持簡單易懂，不會讓初學者感到複雜
- 提供更好的測試體驗

**Non-Goals:**
- 不改變組件的核心功能
- 不增加新的依賴或複雜邏輯
- 不影響現有的快照或保存功能

## Decisions

### Header 選擇
選擇加入以下 header，因為它們是最常見且重要的：
- User-Agent: 識別瀏覽器類型
- Accept: 指定可接受的內容類型
- Accept-Language: 指定語言偏好
- Accept-Encoding: 指定壓縮編碼
- Connection: 指定連接類型

這些 header 足以模擬真實瀏覽器請求，而不會過度複雜。

### 格式保持
保持現有的 \r\n 換行格式，與現有程式碼一致。

## Risks / Trade-offs

- **Risk**: Header 過多可能讓初學者混亂 → **Mitigation**: 只加入最基本的 5 個 header
- **Risk**: 特定 header 值可能過時 → **Mitigation**: 使用通用的現代值，不指定版本號