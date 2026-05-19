## Why

RepeatPanel.vue 中的 requestText 預設值目前只包含基本的 Host header，這讓測試請求看起來不夠真實。為了提供更好的學習體驗和更貼近真實世界的測試情境，我們需要將預設值更新為包含常見瀏覽器 header 的請求格式。

## What Changes

- 更新 RepeatPanel.vue 中 requestText 的預設值，加入以下基本的瀏覽器 header：
  - User-Agent
  - Accept
  - Accept-Language
  - Accept-Encoding
  - Connection

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

- Affected code: .vitepress/theme/components/RepeatPanel.vue
- 這個改變不會影響現有功能，只是改進預設值，提供更好的用戶體驗