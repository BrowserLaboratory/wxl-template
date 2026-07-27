## Summary

把挑戰頁的 Terminal tab 從「預設開啟」改為「作者明確指定才開啟」,同時讓 Browser tab 在作者有指定 `tools:` 時一律注入。

## Motivation

`tools` frontmatter 欄位缺席時,`ChallengeLayout.vue` 目前回傳全部五個 tab,包含 Terminal。這使得每一道沒特別設定的挑戰都附贈一個完整的 shell,與「出題者決定解題者能用什麼工具」的設計意圖相反——作者必須主動排除才能拿掉,而非主動加入才給予。

同時,`tools` 是純 allowlist,作者可以寫出不含 `browser` 的清單,讓一道網站攻防挑戰連瀏覽器都沒有。這在實務上沒有意義。

另有一個既存缺陷:`tools: []` 目前會落入 `allowedTools.length === 0` 分支而回傳全部五個 tab,與「空清單」的直覺完全相反,且 `tests/unit/challenge/config.test.ts` 的測試名稱寫的是「no tabs shown」,語意與實作矛盾。

## Proposed Solution

改寫 `ChallengeLayout.vue` 的 `tabs` computed,建立三條規則:

- `tools` 缺席 → `browser, network, repeater, code`(排除 terminal)
- `tools: []` → `browser`
- `tools: [a, b]` → `browser` 與清單的聯集,依既有 tab 順序排列

面板本身維持 `v-show` 掛載方式不變。`WxlshPanel` 已有容器尺寸為 0 時跳過初始化的守衛,xterm 在 tab 不可達時本就不會被載入,改用 `v-if` 只換來 DOM 整潔卻要牽動三個既有測試,不符成本效益。

三道現有挑戰不修改 frontmatter:`door-is-open` 已明確宣告不含 terminal 的清單且已列出 browser,行為不變;`confidential-files` 與 `jwt-none-alg` 未宣告 `tools:`,將失去 Terminal——兩者的 Playwright 解題腳本均未引用 terminal,解法不受影響。

實作採 TDD:先寫涵蓋三條規則的失敗測試,再改實作。

## Non-Goals

- 不動 `commands` 欄位。`challenge-tools-control` spec 明載其 frontmatter 至 WxlshPanel 的管線尚未接通,屬 future work。
- 不改 `scripts/create-challenge.ts` 的 frontmatter 樣板。新挑戰將沿用新預設,`tools` 欄位的說明改寫在 README 的 frontmatter 範例旁。
- 不改面板的掛載方式(維持 `v-show`),不新增 Playwright 測試。
- 不改 `docs/guide/index.md` 關於工具「在瀏覽器內執行」的敘述,以及首頁的 Terminal 功能卡——兩者描述的是平台能力與執行位置,不因本次變更而失真。
- 不改 `scripts/challenge-validate.ts`:其 tools 檢查僅在欄位存在時執行,不受預設值變更影響。

## Alternatives Considered

- **預設只給 browser,其餘全部 opt-in**:語意最純粹,但會讓兩道現有挑戰從五個 tab 掉到一個,體驗變動過大。
- **維持程式預設全開,改以文件約定要求作者排除 terminal**:零程式風險,但新作者忘記寫 `tools:` 時仍會全開,無法達成目的。
- **改用 `v-if` 卸載未啟用的面板**:語意更正確,但效能理由不成立(xterm 本就 lazy),且會牽動三個既有測試。

## Impact

- Affected specs: challenge-tools-control(delta)、challenge-layout(delta)、challenge-framework(delta)
- Affected code:
  - Modified:
    - .vitepress/theme/layouts/ChallengeLayout.vue
    - scripts/challenge-analyze.ts
    - tests/unit/layouts/ChallengeLayout.test.ts
    - tests/challenge-analyze.test.ts
    - tests/unit/challenge/config.test.ts
    - README.md
    - docs/guide/terminal.md
    - docs/guide/index.md
    - docs/guide/network.md
    - docs/zh-TW/guide/terminal.md
    - docs/zh-TW/guide/index.md
    - docs/zh-TW/guide/network.md
