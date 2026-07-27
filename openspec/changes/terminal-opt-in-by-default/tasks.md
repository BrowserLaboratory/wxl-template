## 1. TDD:先寫失敗測試(layout)

依專案 `.spectra.yaml` 的 `tdd: true` 與本次變更的明確要求,實作前先讓測試紅燈。本群組完成時,`pnpm test --run tests/unit/layouts/ChallengeLayout.test.ts` 必須因新測試而失敗,且失敗原因是斷言不符而非語法或掛載錯誤。

- [x] 1.1 在 `tests/unit/layouts/ChallengeLayout.test.ts` 改寫既有的「renders all five interaction tabs when tools field is not set (default)」一則:改為斷言 `tools` 缺席時渲染四個 tab,且 `data-tab` 集合為 browser、network、repeater、code,不含 terminal。完成判準:該測試先失敗(目前實作回傳五個)。驗證:單獨執行該檔並確認失敗訊息為 tab 數量 5 ≠ 4。
- [x] 1.2 新增測試「empty tools array yields browser only」:frontmatter `tools: []` 時只渲染一個 tab,`data-tab` 為 browser。完成判準:先失敗(目前空陣列走全開分支回傳五個)。驗證:失敗訊息為 tab 數量 5 ≠ 1。
- [x] 1.3 新增測試「browser is injected into an explicit allowlist that omits it」:frontmatter `tools: ['code']` 時渲染兩個 tab,依序為 browser、code。完成判準:先失敗(目前只回傳 code)。驗證:失敗訊息為缺少 browser。
- [x] 1.4 新增測試「explicit terminal opt-in shows the Terminal tab」:frontmatter `tools: ['browser', 'terminal']` 時 `data-tab` 集合含 terminal。完成判準:此則在現行實作下即通過,作為防止過度修正的迴歸護欄——實作改完後必須仍然通過。驗證:實作前後各執行一次。
- [x] 1.5 新增測試「tabs render in canonical order regardless of author order」:frontmatter `tools: ['code', 'network']` 時 `data-tab` 依序為 browser、network、code。完成判準:先失敗或先通過皆可,重點是鎖定排序契約。驗證:確認斷言的是順序而非集合。

## 2. 實作:layout 的分頁計算

- [x] 2.1 改寫 `.vitepress/theme/layouts/ChallengeLayout.vue` 的 `tabs` computed,實作 design.md「Implementation Contract」表格的三條規則:缺席走預設四項、空陣列走 browser 注入、非空陣列走 browser 與清單的聯集。排序一律沿用 `ALL_TABS` 的既有順序,重複元素不產生重複分頁。完成判準:群組 1 的五則測試全部轉綠。驗證:`pnpm test --run tests/unit/layouts/ChallengeLayout.test.ts`。
- [x] 2.2 確認面板區塊未被更動:五個 `data-panel` 的 `v-show` 條件維持原樣,未引入 `v-if`。完成判準:`git diff` 在該範圍內只有 `tabs` computed 的變更。驗證:檢視 `ChallengeLayout.vue` 的完整 diff。
- [x] 2.3 確認既有測試無迴歸,特別是讀取 `WxlshPanel` props 的三則(它們依賴面板永遠掛載這個前提)。完成判準:`pnpm test --run tests/unit/layouts/` 全綠。驗證:執行該目錄的全部測試。

## 3. analyze 的輸出與其測試

- [x] 3.1 先改 `tests/challenge-analyze.test.ts` 中對 `tools` 缺席情境的斷言,改為期望輸出列出實際生效的分頁並標示為預設。完成判準:該測試先失敗。驗證:執行該檔並確認失敗訊息為字串不符。
- [x] 3.2 改 `scripts/challenge-analyze.ts` 的 `toolsSummary`:`tools` 缺席時輸出實際生效的四個分頁並標示 default 與 terminal 被排除,不再輸出 `all enabled (default)`。`tools` 存在時的三個分支行為不變。完成判準:3.1 的測試轉綠且該檔其餘測試不受影響。驗證:`pnpm test --run tests/challenge-analyze.test.ts`。

## 4. 既有測試名稱的語意修正

- [x] 4.1 修正 `tests/unit/challenge/config.test.ts` 中「accepts empty tools array (no tabs shown)」的名稱:空陣列現在的結果是只顯示 browser,不是不顯示任何 tab。改為與實際行為相符的敘述。該測試只斷言驗證器不擲錯,行為本身不變。完成判準:名稱不再與實際行為矛盾。驗證:執行該檔確認仍全綠。

## 5. 作者面文件

- [x] 5.1 在 `README.md` 的 challenge frontmatter 範例中,於 `tools:` 那一行旁加註說明:欄位缺席時的預設集合(四項、不含 terminal)、Terminal 需明確列出才會出現、以及作者宣告清單時 browser 一律被注入。完成判準:讀者不需查閱 spec 即可從範例得知三條規則。驗證:對照 design.md 的 Implementation Contract 表格逐條核對措辭。

## 6. 解題者面文件(英中同步)

本群組的英中兩版改的是同一批事實敘述,分屬不同檔案,可平行處理。

- [x] 6.1 [P] 修正 `docs/guide/terminal.md`:第 26 行附近「Tiers 1–4 are available in every challenge」在本變更後為假,改為說明 Terminal 面板本身需由挑戰作者授予,並保留原本關於 Tier 5 未實作的敘述。完成判準:全檔不再有「每道挑戰都有 terminal」意涵的句子。驗證:全檔搜尋 every challenge 與 all challenges 並逐句判定。
- [x] 6.2 [P] 修正 `docs/zh-TW/guide/terminal.md` 的對應段落,使其與 6.1 做出相同的事實宣稱。完成判準:與英文版逐句對應。驗證:兩版並排比對該段。
- [x] 6.3 [P] 修正 `docs/guide/index.md`:工具總覽表的 Terminal 列、導覽步驟中「使用 Terminal」的敘述、以及 FAQ 中關於流量記錄涵蓋 Terminal 請求的句子,一律改為條件語氣(該挑戰有啟用時)。不更動關於工具「在瀏覽器內執行」的敘述。完成判準:三處皆為條件語氣且未擴及執行位置的描述。驗證:逐處對照 design.md 的 Non-Goals。
- [x] 6.4 [P] 修正 `docs/zh-TW/guide/index.md` 的對應三處。完成判準:與 6.3 做出相同宣稱。驗證:兩版並排比對。
- [x] 6.5 [P] 修正 `docs/guide/network.md` 的「Terminal 與 Code Editor 搭配 Traffic Log」組合流程:加上該流程以挑戰啟用 Terminal 為前提的說明,保留流程本身。此段受 platform-documentation spec 的 SHALL 約束(要求 network 指南包含與 Code Editor 及 Terminal 的組合流程範例),不得刪除。完成判準:段落仍在且 SHALL 仍被滿足。驗證:對照 `openspec/specs/platform-documentation/spec.md` 的 Network Guide requirement 逐句核對。
- [x] 6.6 [P] 修正 `docs/zh-TW/guide/network.md` 的對應段落。完成判準:與 6.5 做出相同宣稱。驗證:兩版並排比對。

## 7. 全面複驗

- [x] 7.1 執行完整單元測試:`pnpm test --run`。完成判準:全數通過,無新增 skip。驗證:記錄通過數與失敗數。
- [x] 7.2 執行 `pnpm docs:build`。完成判準:exit 0。驗證:檢視結尾的 build complete 訊息。
- [x] 7.3 執行 repo prose gate 於所有更動的 Markdown 檔。完成判準:每檔 0 blocking。驗證:逐檔執行 `python3 scripts/prose-audit/run.py <file>`(該腳本每次只吃一個檔)。
- [x] 7.4 驗證 `door-is-open` 的分頁集合未因本變更而改變:其 frontmatter 宣告 `[browser, network, repeater, code]`,已含 browser 且已排除 terminal,新規則下結果應完全相同。完成判準:以該 frontmatter 推導新規則的輸出並與舊行為比對。驗證:於 layout 測試中以該實際值執行一次斷言。
- [x] 7.5 執行 `spectra validate` 與 `spectra analyze`。完成判準:validate 通過、analyze 無 Critical 或 Warning。驗證:記錄 findings 數量與層級。

## 8. Delta spec 逐條驗收

本群組逐條核對三份 delta spec 的 requirement 是否被實作與文件滿足。每一項都必須指出滿足該 requirement 的具體程式碼或文字,不得以「應該有做到」帶過。

- [x] 8.1 驗收 `challenge-tools-control` 的 requirement「UI tab allowlist via tools field」:五個 Scenario(Terminal excluded by default、Terminal enabled by explicit opt-in、Browser injected into an explicit allowlist、Empty allowlist yields browser only、Restricted tab set)各自指出對應的測試案例與實作行。完成判準:五個 Scenario 皆有具名的測試對應。驗證:列出 Scenario 與測試名稱的對照表。
- [x] 8.2 驗收 `challenge-tools-control` 的 requirement「Tier 5 command allowlist via commands field」:確認本次變更未動 `commands` 管線,且新增的那句「Terminal 未授予時 commands 無可觀察效果」與實作一致。完成判準:確認 `commands` 相關程式碼零改動,且該句可由 layout 的分頁規則推導。驗證:`git diff` 搜尋 commands 應無命中。
- [x] 8.3 驗收 `challenge-layout` 的 requirement「Challenge layout renders a left-right split view」:確認分頁數量不再固定為五、面板仍以 `v-show` 掛載、未授予的面板因容器尺寸為 0 而不初始化。完成判準:三項各指出實作依據。驗證:對照 `ChallengeLayout.vue` 的面板區塊與 `WxlshPanel.vue` 的尺寸守衛。
- [x] 8.4 驗收 `challenge-framework` 的 requirement「Frontmatter schema defines challenge metadata」:確認 `tools` 的預設值敘述與實作一致,且驗證器仍將缺席的 `tools` 保持為 `undefined` 而非注入預設。完成判準:指出 `config.ts` 中原樣傳遞的那一行,並確認 layout 才是套用預設之處。驗證:對照 `.vitepress/challenge/config.ts` 與 `ChallengeLayout.vue`。

## 9. Round 1 audit 修復

背景:round 1(22 agents 全數完成、0 錯誤、0 dead layer)回報 5 筆 blocking(去重後三個相異缺陷)與 15 筆 advisory。另有一筆被對抗式複審評為 Medium 的項目,經我自行複驗判定為當機迴歸並升級處理。

- [x] 9.1 修正 `onSendToRepeater` 繞過允許清單的漏洞:該函式無條件設定 `activeTab.value = 'repeater'`,使 Repeater 面板在未被授予時仍可經 Traffic Log 的送出按鈕開啟,且開啟後沒有分頁按鈕可離開。這使 delta spec 新寫的全稱句「A panel whose tab is absent SHALL be unreachable」為假。修法:新增 `hasTab()` 並在該函式開頭擋下。完成判準:全檔僅存的兩個 `activeTab` 寫入點皆受 `tabs` 約束。驗證:新增測試以 `tools: ['browser','network']` 掛載、觸發 sendToRepeater,斷言 active tab 仍為 network 且 repeater 面板維持 `display: none`。
- [x] 9.2 修正我引入的當機迴歸:`tools` 寫成裸 `tools:`(YAML 解析為 `null`)時,新的 `tabs` computed 會對 `null` 呼叫 `.includes` 而擲 TypeError,使挑戰頁渲染失敗;舊碼的 `!allowedTools` 判斷則會回傳全部分頁。layout 讀的是原始 frontmatter,`config.ts` 的陣列檢查攔不到。修法:改以 `Array.isArray()` 判斷,非陣列一律回退至預設集合。完成判準:`null`、字串、數字三種輸入皆回傳預設四項且不擲錯。驗證:以 `it.each` 三案例先紅後綠。
- [x] 9.3 修正 `scripts/challenge-validate.ts` 的 `else` 分支字串 `'not specified (default all)'`——它描述的正是本次變更改掉的預設。我原先把該檔列為 Non-Goal,理由是「其 tools 檢查僅在欄位存在時執行」,那是只讀了 `if` 分支的誤判。同步修正 proposal 與 design 中的該項 Non-Goal 措辭。完成判準:字串與 `challenge-analyze.ts` 一致。驗證:新增測試釘住該字串,防止兩者再度漂移。
- [x] 9.4 修正 baseline spec 的 Purpose:`challenge-tools-control/spec.md` 仍寫「defaulting to all five tabs」,`challenge-layout/spec.md` 仍把五個面板描述為固定分頁。delta 只能攜帶 requirement 層級區塊(歷史上僅見 ADDED/MODIFIED/REMOVED/NEW Requirements),Purpose 會原封不動存活過 archive,故直接修改 baseline 檔。完成判準:兩份 Purpose 與新行為一致。驗證:archive 後複查兩行仍為修正後版本。
- [x] 9.5 修正 `challenge-analyze.ts` 對非空陣列的輸出:原本原樣印出作者清單,未反映被注入的 browser,`tools: []` 更會印出空字串而與實際渲染的 browser 矛盾。改為輸出實際生效的分頁。完成判準:`tools: []` 與未列 browser 的清單皆顯示 browser。驗證:執行該檔測試。
- [x] 9.6 修正我自己 artifact 中的不實敘述:design.md 的驗收條件寫「全部測試在實作前撰寫並先行失敗」,但其中兩則是刻意的迴歸護欄,實作前即通過。改為區分「行為變更的測試先紅」與「護欄測試前後皆綠」。完成判準:敘述與 tasks.md 群組 1 的記載一致。驗證:對照 1.4 的完成判準。
- [x] 9.7 修正剩餘文件不一致:英中版對 Terminal 缺席頻率的量詞不同(many pages / 多數頁面),兩者皆無從查證,改為不帶量詞的條件敘述;`network.md` 的 Traffic Log 提示仍無條件把 Terminal 列為記錄來源,與同一次變更在 index.md 的處理不一致。完成判準:英中做出相同宣稱且皆為條件語氣。驗證:兩版並排比對。
- [x] 9.8 補上 delta spec 未被測試釘住的兩條規則:重複 id 不產生重複分頁、驗證器保留缺席的 `tools` 為 `undefined`。同時放寬 delta 中那句因果子句的推廣範圍——原句把 `WxlshPanel` 的尺寸守衛推廣為所有面板的性質,改為只陳述可驗證的部分。完成判準:兩條規則各有具名測試。驗證:執行對應測試檔。
- [x] 9.9 全面複驗:`pnpm test --run`、`pnpm docs:build`、七個 Markdown 檔的 prose gate、`spectra validate` 與 `analyze`。驗證:記錄通過數與 findings 層級。

## 10. Round 2 audit 修復

背景:round 2(10 agents 全數完成、0 錯誤、0 dead layer)回報 2 筆 blocking 與 10 筆 advisory。兩筆 blocking 均由 round 1 的修復造成,且 advisory 有一整叢源自同一根因——守衛讓 Send to Repeater 按鈕變成沉默的無效點擊。本輪改為從根因修起:按鈕在未授予 Repeater 時不渲染。

- [x] 10.1 驗收並更新 `network-traffic-panel` 的 requirement「NetworkPanel provides Send to Repeater action for each traffic entry」:baseline 無條件宣稱「The parent layout SHALL ... switch to the Repeater tab」,round 1 的守衛使其在未授予 Repeater 時為假,而本次 change 原本沒有涵蓋該 capability 的 delta,archive 後規範庫會留下兩句互相衝突的 SHALL。新增 delta,並明訂按鈕在未授予時不得渲染。完成判準:delta 的兩個 Scenario 各有具名測試。驗證:`tests/unit/components/NetworkPanel.test.ts` 的隱藏按鈕測試與既有的送出測試。
- [x] 10.2 為 `NetworkPanel` 新增 `canSendToRepeater` prop(預設 true)並於 false 時不渲染按鈕,由 layout 以 `hasTab('repeater')` 傳入。保留 layout 端的守衛作為縱深防禦。完成判準:未授予 Repeater 時按鈕不存在,而非存在但點擊無效。驗證:先寫失敗測試再實作。
- [x] 10.3 修正 design.md 的 Implementation Contract:「`tools` 存在時的輸出行為不變」為假——round 1 修改的正是該路徑。同時修正「`challenge:validate` 對 `tools` 的既有檢查行為不變」與 Goals 中只涵蓋缺席情境的措辭。完成判準:契約敘述與兩支腳本的實際輸出一致。驗證:對照 `challenge-analyze.ts` 與 `challenge-validate.ts` 的分支。
- [x] 10.4 讓 `challenge-validate.ts` 的清單輸出與 `challenge-analyze.ts` 一致(顯示實際生效的分頁而非原樣回印作者清單),使 10.3 修正後的契約成立。完成判準:兩支腳本對同一份 frontmatter 給出一致的分頁描述。驗證:執行兩支腳本的測試。
- [x] 10.5 修正 `challenge-analyze.ts` 以長度判斷 all enabled 的缺陷:`tools` 為五個重複元素時會被誤報為全部啟用。改為以實際生效的分頁集合判斷。完成判準:五個重複 `code` 的清單輸出為 `browser, code`。驗證:先寫失敗測試再實作。
- [x] 10.6 修正 `network.md` 英中兩版的兩處:Send to Repeater 流程未說明按鈕的條件性;round 1 加入的「沒有 Terminal 就從步驟二開始」與後續步驟自相矛盾(步驟三仍引用步驟一的 curl 記錄)。改為「略過步驟一、改在 Code Editor 發出同樣的探測」,並補上沒有 Repeater 時步驟四不適用。完成判準:走查全段無自相矛盾。驗證:兩版逐步比對。
- [x] 10.7 修正 `tests/challenge-analyze.test.ts` 中仍以 `'all enabled (default)'` 作為種子與斷言的三處——`analyzeChallenge` 已不可能產生該字串。完成判準:全檔搜尋該字串零命中。驗證:執行該檔測試。
- [x] 10.8 全面複驗:`pnpm test --run`、`pnpm docs:build`、七個 Markdown 檔的 prose gate、`spectra validate` 與 `analyze`。驗證:記錄通過數與 findings 層級。

## 11. Round 3 audit 修復

背景:round 3(18 agents 全數完成、0 錯誤、0 dead layer)回報 2 筆 blocking(同一缺陷的英中兩版)與 16 筆 advisory。blocking 是 round 2 的修復只改了同一宣稱的其中一處:`network.md:50` 加了條件語氣,結構性描述所在的 `:15` 卻原封不動,同檔自相矛盾。三輪用盡仍未 clean,已依協定啟動多 Opus clean-context RCA。

- [x] 11.1 修正 `network.md` 英中兩版第 15 行的結構性描述:該句無條件宣稱展開記錄會出現 Send to Repeater 按鈕,round 2 讓按鈕變成條件渲染後即為假。修法改用「先 grep 出同一宣稱的全部出現位置再逐一處理」,而非只修被指出的那一處。完成判準:`grep -n "Send to Repeater"` 的每一處命中,不是本身帶條件語氣,就是位於已聲明前提的段落內。驗證:兩版各七處逐一判定。
- [x] 11.2 為「End-to-End Workflow Example」補上前提聲明(該段步驟三至五全部依賴 Repeater),並修正 round 2 加入的「後續步驟的讀法也一樣」——步驟三仍指名要找 `curl` 那一筆,而 Code Editor 路徑不會產生它。完成判準:兩段走查皆無自相矛盾。驗證:逐步比對英中兩版。
- [x] 11.3 修正 delta spec 漏帶 baseline scenario 的問題:`network-traffic-panel` 的 MODIFIED 區塊是整塊替換,我的 delta 只帶了兩個 scenario,archive 時會把 baseline 的「Send to Repeater preserves original request headers and body」整條刪除。補回該 scenario。完成判準:delta 的 scenario 數不少於 baseline 且新增的條件性 scenario 保留。驗證:與 `openspec/specs/network-traffic-panel/spec.md` 逐條比對。
- [x] 11.4 修正首頁 i18n 的 `step2_desc`(英中兩版):該句指示解題者「使用 Browser、Terminal、Code Editor、Repeater」,是對讀者的指令而非平台能力描述,原本用來排除首頁的 Non-Goal 理由不涵蓋它。改為條件語氣並同步 proposal 的 Non-Goal 說明。完成判準:JSON 仍可解析且英中做出相同宣稱。驗證:`json.load` 兩檔並比對語意。
- [x] 11.5 補上 layout→NetworkPanel 的 `canSendToRepeater` 接線測試。該接線是 round 2 根因修法的關鍵,卻無任何測試觀察它——原因是測試中的 NetworkPanel mock 只宣告了 `trafficLog` 一個 prop,新 prop 會落入 attrs 而不可見。完成判準:mock 宣告該 prop,且授予與未授予兩種情境各有斷言。驗證:`it.each` 兩案例。
- [x] 11.6 修正 `challenge-validate.ts` 與 `challenge-analyze.ts` 對「五項全開」描述不一致:analyze 輸出 `all enabled`,validate 輸出完整清單。統一為同一措辭。完成判準:同一份 frontmatter 兩支腳本給出一致描述。驗證:對照兩支腳本的分支。
- [x] 11.7 補上 `tools: []` 的 analyze 測試——那是本次變更下輸出改變最明顯的輸入(原本空字串,現為 browser),卻無測試覆蓋。完成判準:該案例有具名測試。驗證:執行該檔。
- [x] 11.8 更新 proposal 的 Impact 與 design 的範圍邊界:rounds 1、2 擴大了改動面(第四份 delta spec、NetworkPanel 的新 prop、validate 的輸出、首頁 i18n),兩份 artifact 的列舉卻停留在初版。以 `git diff main...HEAD --name-only` 為真實來源重寫。完成判準:列舉與實際 diff 一致。驗證:逐檔核對。
- [x] 11.9 全面複驗:`pnpm test --run`、`pnpm docs:build`、七個 Markdown 檔的 prose gate、`spectra validate` 與 `analyze`。驗證:記錄通過數與 findings 層級。
