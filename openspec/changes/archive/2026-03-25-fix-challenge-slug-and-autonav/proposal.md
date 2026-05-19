## Problem

三個挑戰頁面（FastAPI IDOR Demo、PHP File Inclusion Demo、SQL Injection Demo）全部無法正確運作。Browser 面板只顯示「Enter a URL and press Go」，URL 欄位都是 `https://challenge-index.localhost/` 而非挑戰專屬的 URL。

## Root Cause

兩個獨立的 bug：

### Bug 1: Slug 提取錯誤（Critical）

`ChallengeLayout.vue` 的 slug 提取邏輯在 commit `7ce9518`（重構挑戰檔案結構為 per-folder 模式）後未跟著更新：

- **舊路徑**: `challenge/sqli-demo.md` → slug = `sqli-demo` ✓
- **新路徑**: `challenge/sqli-demo/index.md` → slug = `index` ❌

所有挑戰的 slug 都變成 `"index"`，導致 SW 路由、URL 生成、session tracking 全部錯位。

### Bug 2: BrowserPanel 無自動導航

`BrowserPanel.vue` 的 `onMounted` 只註冊 message listener，不會自動呼叫 `navigate()`。使用者必須手動按 Go 按鈕才能載入挑戰內容。

## Proposed Solution

1. 修正 `ChallengeLayout.vue` 的 slug 提取，從 `relativePath` 的倒數第二段取值（parent directory name）
2. 在 `BrowserPanel.vue` 加入自動導航：watch `disabled` prop 從 `true` → `false` 時觸發 `navigate()`

## Success Criteria

- 三個挑戰頁面的 Browser URL 欄分別顯示正確的 `challenge-<slug>.localhost`
- 進入挑戰頁面後，Browser 自動載入挑戰的首頁內容（不需手動按 Go）
- SW 以正確的 slug 註冊挑戰
- 既有單元測試全部通過

## Impact

- Affected specs: `challenge-layout`（新增 slug 推導規則）、`challenge-browser-chrome`（新增自動導航行為）
- Affected code: `.vitepress/theme/layouts/ChallengeLayout.vue`, `.vitepress/theme/components/BrowserPanel.vue`
