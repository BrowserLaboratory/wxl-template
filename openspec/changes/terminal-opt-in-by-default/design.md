## Context

挑戰頁由 `ChallengeLayout.vue` 渲染,右欄是五個工具面板的分頁介面。分頁按鈕由一個 computed 決定,其唯一輸入是挑戰 frontmatter 的 `tools` 欄位。該 computed 目前的邏輯是:清單缺席或為空陣列時回傳全部五個 tab,否則以清單過濾。

`tools` 的驗證發生在 `.vitepress/challenge/config.ts`,但該層只檢查值是否為合法 tab ID 陣列,不注入預設值——欄位缺席時 `tools` 原樣以 `undefined` 傳遞。因此預設值完全由 layout 決定,是單一決策點。

三道現有挑戰中,只有 `door-is-open` 宣告了 `tools`,其值為 `[ browser, network, repeater, code ]`。

`WxlshPanel.vue` 在 `onMounted` 呼叫 `initTerminal()`,其中有一道守衛:容器 `clientWidth` 或 `clientHeight` 為 0 時直接返回,並由 ResizeObserver 在容器可見時重試。xterm 及其 fit addon 是在該守衛之後才動態 import 的。這代表分頁按鈕不存在時,面板容器永遠不會取得尺寸,xterm 的 chunk 不會下載、Terminal 實例不會建立。

## Goals / Non-Goals

**Goals**

- 讓 Terminal 成為出題者主動授予的工具,而非預設附贈。
- 保證任何有宣告 `tools` 的挑戰都保有 Browser 分頁。
- 修正 `tools: []` 回傳全部分頁的反直覺行為。
- 讓 `challenge:analyze` 與 `challenge:validate` 的輸出如實反映實際生效的分頁,不論 `tools` 是否存在。

**Non-Goals**

- 不觸碰 `commands` 欄位與 Tier 5 指令管線。
- 不改變面板的掛載方式,不改 `create-challenge.ts` 的樣板,不新增 Playwright 測試。
- 不修改任何挑戰的 frontmatter。
- 不改 `challenge-validate.ts` 對 `tools` 值的**合法性驗證規則**;但其描述預設值與生效分頁的輸出字串會隨本次變更失真,屬必修範圍。

## Decisions

**決策一:預設集合為「全部扣除 terminal」,而非「僅 browser」**

選擇讓 `tools` 缺席時仍給出 browser、network、repeater、code 四個分頁。替代方案是只給 browser、其餘全部 opt-in,語意更純粹,但會讓兩道現有挑戰從五個分頁掉到一個,對既有內容的衝擊過大。本次變更的目標是收回 Terminal,不是重新設計工具授予模型。

**決策二:Browser 採「有指定才注入」,而非無條件常駐**

`tools` 缺席時 browser 本就在預設集合內,無須額外規則。只有在作者明確宣告清單時,才需要保證 browser 不被遺漏。這讓規則的作用範圍最小,也讓「缺席」與「空陣列」兩種情境有清楚區別:前者走預設,後者走注入。

**決策三:空陣列視為「明確指定的空清單」**

`tools: []` 套用注入規則後結果為僅 browser。替代方案是視同缺席而走預設四個分頁,但那會讓「作者寫了空陣列」與「作者沒寫」產生相同結果,使空陣列成為無意義的寫法。

**決策四:面板維持 `v-show`,不改用 `v-if`**

改用 `v-if` 可讓未授予的面板完全不進入 DOM,語意更正確。但因 `WxlshPanel` 的尺寸守衛已使 xterm 不被載入,效能收益趨近於零;而 `tests/unit/layouts/ChallengeLayout.test.ts` 中有三則測試依賴「面板永遠掛載」這個前提來讀取 `WxlshPanel` 的 props,改動需連帶重寫。收益與成本不成比例。

**決策五:採 TDD,測試僅寫在 Vitest 單元層**

先寫涵蓋三條規則的失敗測試再改實作。不新增 Playwright 測試:現有的挑戰 e2e 與 site-smoke 對分頁零斷言,新增瀏覽器層驗證會拉長 CI 而覆蓋的是同一條邏輯。

## Implementation Contract

**可觀察行為**

挑戰頁右欄的分頁按鈕集合,依 frontmatter `tools` 欄位決定:

| `tools` 的值 | 顯示的分頁 |
|---|---|
| 欄位缺席(`undefined`) | Browser、Network、Repeater、Code |
| `[]` | Browser |
| 非空陣列 | Browser 與陣列元素的聯集 |

非空陣列情境的排列順序,依既有分頁順序(browser、network、repeater、terminal、code),不依作者書寫順序。陣列中重複的元素不產生重複分頁。

**介面**

frontmatter 的 `tools` 欄位型別不變:選填的合法 tab ID 陣列。合法值不變:`browser`、`network`、`repeater`、`terminal`、`code`。`config.ts` 的驗證行為不變——本變更不在該層注入預設值。

**面板掛載**

五個面板的掛載條件不變,仍由 `v-show` 依當前作用中的分頁決定顯示。未出現在分頁列的面板,其容器不會取得尺寸,因此其惰性初始化不會觸發。

**命令列輸出**

`challenge:analyze` 與 `challenge:validate` 一律描述實際生效的分頁,而非原樣回印作者寫下的清單。`tools` 缺席時額外標示其為預設值;`tools` 存在時輸出 browser 與清單元素的聯集,依既有分頁順序排列,且僅在該聯集涵蓋全部五項時才稱為 all enabled。

**失效模式**

作者宣告的清單若不含 `browser`,不視為錯誤,不發出警告——Browser 靜默注入。`challenge:validate` 對 `tools` 值的**合法性驗證規則**不變;其描述預設值與生效分頁的輸出字串則隨本變更同步。

**驗收條件**

- `tests/unit/layouts/ChallengeLayout.test.ts` 涵蓋上表三種情境,外加「清單未列 browser 仍注入」與「清單明確列出 terminal 則 Terminal 分頁出現」兩則。凡實作變更了行為的案例,測試皆在實作前撰寫並先行失敗;另有數則是刻意的迴歸護欄,實作前後皆須通過,不得因此被視為未走 TDD。
- `tests/challenge-analyze.test.ts` 對缺席情境的斷言更新為新輸出。
- `pnpm test --run` 全數通過。
- `pnpm docs:build` 成功。
- `door-is-open` 的分頁集合不因本變更而改變。

**範圍邊界**

*In scope*:layout 的分頁計算與 Repeater 跳轉守衛、NetworkPanel 的 Send to Repeater 條件渲染、analyze 與 validate 的分頁摘要字串、四份 spec 的對應 requirement(含 network-traffic-panel)、README 的 frontmatter 註解、首頁 i18n 中指示使用 Terminal 的句子,以及解題者指南中因本變更而失真的敘述。

*Out of scope*:任何挑戰的 frontmatter、`create-challenge.ts`、`challenge-validate.ts` 的合法性驗證規則、`commands` 欄位、面板掛載方式(維持 `v-show`)、Playwright、首頁的功能卡與 `homepage-content` spec。

## Risks / Trade-offs

- [兩道現有挑戰失去 Terminal,若其解法實際需要 shell 則變成不可解] → 已檢查 `tests/challenges/confidential-files.spec.ts` 與 `jwt-none-alg.spec.ts`,兩者的解題腳本均未引用 terminal 或分頁;`pnpm test:smoke` 會在 CI 覆驗。
- [作者升級後未察覺預設改變,新挑戰意外少了 Terminal] → README frontmatter 範例旁加註說明;`challenge:analyze` 的輸出改為明列實際分頁,作者執行時即可看見。
- [Browser 靜默注入可能違反作者本意] → 屬刻意設計:平台的挑戰皆為網站攻防,無瀏覽器的挑戰不具意義。此行為寫入 spec 而非隱藏於實作。
- [解題者指南仍有多處假設 Terminal 存在] → 本變更同步條件化 `terminal.md` 與 `index.md` 中失真的敘述,並將 `network.md` 的組合流程改為條件語氣。

## Migration Plan

無資料遷移。變更生效後:

1. 既有已宣告 `tools` 的挑戰行為不變(除非其清單不含 browser——目前無此案例)。
2. 未宣告 `tools` 的挑戰失去 Terminal 分頁。若某挑戰需要保留,在其 frontmatter 補上含 `terminal` 的完整清單即可。
3. 無需重新產生任何 WASM 產物或執行 keygen。
