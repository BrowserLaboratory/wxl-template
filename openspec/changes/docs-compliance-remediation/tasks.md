## 1. 前置:建立指令面與實作行為的權威對照

- [x] 1.1 從 wxlsh-commands spec(openspec/specs/wxlsh-commands/spec.md)與 wxlsh-parser 實作(chall-wasm/wxlsh-parser)整理出指令權威清單:每個指令的名稱、參數語法、flag 形式(如 base64 -d)、pipe 行為、實際提示字元格式、歷史紀錄持久化行為,寫入工作筆記(不入 repo)。完成判準:清單涵蓋 wxlsh-commands spec 定義的所有指令群組,且每一條語法都能在 spec 或 parser 原始碼找到出處。驗證:對照 openspec/specs/wxlsh-commands/spec.md 逐條核對無遺漏。

## 2. A 群組:CI prose gate 阻斷項

- [x] 2.1 [P] 修正 docs/zh-TW/guide/python.md 的 3 筆 mainland_vocab(「運行」→「執行」、兩處「函數」→「函式」),使該檔通過 repo prose gate。驗證:python3 scripts/prose-audit/run.py docs/zh-TW/guide/python.md 輸出 0 blocking。
- [x] 2.2 [P] 修正 docs/zh-TW/guide/index.md 的「瀏覽器內運行」→「瀏覽器內執行」,使該檔通過 repo prose gate。驗證:python3 scripts/prose-audit/run.py docs/zh-TW/guide/index.md 輸出 0 blocking。
- [x] 2.3 [P] 修正 docs/zh-TW/guide/network.md 的「用戶端錯誤」→「客戶端錯誤」,使該檔通過 repo prose gate。驗證:python3 scripts/prose-audit/run.py docs/zh-TW/guide/network.md 輸出 0 blocking。
- [x] 2.4 更換英中兩版 terminal 指南的 hex 範例值,使 flag 範例不含 placeholder 樣式子字串(如改用 flag{hexec} 與對應 hex 編碼 666c61677b68657865637d,兩版的輸入與輸出行同步、hex 編碼與解碼結果一致)。驗證:python3 scripts/prose-audit/run.py 對 docs/guide/terminal.md 與 docs/zh-TW/guide/terminal.md 均輸出 0 blocking,且範例 hex 值以 python3 -c "print(bytes.fromhex('<hex>'))" 驗算與 flag 字串一致。(本任務與 3.x 同檔,合併在同一次改寫中執行)

## 3. B 群組:Terminal Guide page documents built-in terminal commands(英中兩版重寫)

- [x] 3.1 落實 Terminal Guide page documents built-in terminal commands requirement:依 1.1 的權威清單重寫 docs/guide/terminal.md,修正 base64/hex/encode/decode 的語法(base64 <text> / base64 -d <text>、hex <text> / hex -d <hex>、encode url <text> 等)、移除不存在的 cls、補齊指令清單(以指令參考表涵蓋所有指令群組)、加入至少一個 pipe(|)組合範例、全篇提示字元改為實際格式、歷史紀錄描述改為「經 IndexedDB 持久化、重新整理後保留」。完成判準:文件中每個指令語法皆可在 wxlsh parser 文法中找到對應;無任何 parser 不認得的指令。驗證:逐條對照 1.1 清單,並以 python3 scripts/prose-audit/run.py docs/guide/terminal.md 確認 0 blocking。
- [x] 3.2 將 3.1 的重寫同步至 docs/zh-TW/guide/terminal.md(台灣繁中,技術名詞保留英文;段落結構與英文版 1:1)。驗證:兩版標題數與程式碼區塊數一致(grep -c 核對),python3 scripts/prose-audit/run.py docs/zh-TW/guide/terminal.md 輸出 0 blocking。

## 4. C 群組:README 部署與設定修正

- [x] 4.1 改寫 README.md 的 Cloudflare Pages 段:移除「wasm-pack 是 devDependency」的錯誤宣稱,改為描述實際的安裝需求(對照 package.json 與 scripts/ 的實際建構路徑),使照該段操作可完成部署。驗證:段落中提及的每個指令與檔案皆存在於 repo(grep 核對 package.json scripts 與 scripts/ 目錄)。
- [x] 4.2 改寫 README.md 的 GitHub Pages 部署段:範例與 .github/workflows/deploy.yml 實際內容一致(trigger、Actions 部署機制、SITE_BASE),或改為直接引導讀者參考該檔並說明 SITE_BASE 的作用。驗證:與 .github/workflows/deploy.yml 逐項比對無矛盾。
- [x] 4.3 修正 README.md 的 challenge frontmatter 範例:加入 layout: challenge、移除 deprecated 的 fs: 對映,與 docs/challenge/door-is-open/index.md 的現行格式一致。驗證:與 door-is-open frontmatter 及 challenge-file-structure spec 逐欄比對。
- [x] 4.4 [P] 修正 README.md 的 Prerequisites:Node 版本改為 22.6+(附 --experimental-strip-types 理由)、補列 wasm-tools。驗證:grep 確認 scripts/*.ts 執行路徑使用 --experimental-strip-types,challenge:verify 相關腳本引用 wasm-tools。
- [x] 4.5 [P] 補齊 README.md 的 Available scripts 表(含 fork:init 等 4 個遺漏 script),使表列與 package.json scripts 中對使用者有意義的項目一致。驗證:與 package.json 的 scripts 區塊逐項核對。
- [x] 4.6 [P] README.md 架構圖補上 wxlsh-parser WASM crate。驗證:與 chall-wasm/ 實際目錄(asgi-bridge、virtual-fs、wxlsh-parser)一致。

## 5. D 群組:Network Guide page documents Traffic Log and Repeater workflow 與其他 guide drift

- [x] 5.1 落實 Network Guide page documents Traffic Log and Repeater workflow requirement:修正英中兩版 network 指南(docs/guide/network.md、docs/zh-TW/guide/network.md),記錄範圍改為「四個工具面板的請求皆經 tracked dispatch 記錄」、Repeater 描述改為實作的 raw HTTP request 編輯模型(含 Saved Snapshots)、URL 欄描述改為實際顯示內容(path + query)。驗證:與 network-traffic-panel spec 及 Repeater/Traffic 相關元件原始碼對照;prose gate 兩檔 0 blocking。
- [x] 5.2 修正英中兩版 python 指南(docs/guide/python.md、docs/zh-TW/guide/python.md):requests 描述改為「micropip 安裝完整 requests 套件、僅 patch 傳輸層」(對照 requests-shim spec)、移除不存在的 Cmd/Ctrl+S 與 Tab 快捷鍵、移除不存在的「清除輸出」按鈕與狀態列描述、Load 描述改為下拉選單。驗證:與 requests-shim spec 及 CodeEditorPanel 元件原始碼對照;prose gate 兩檔 0 blocking。
- [x] 5.3 修正英中兩版 getting started 指南(docs/guide/index.md、docs/zh-TW/guide/index.md)的 FAQ:Network Traffic 記錄範圍改為四面板皆記錄(與 5.1 一致)、Pentest Notes 儲存機制改為 IndexedDB(草稿除外)、第三方套件說明改為「平台以 micropip 安裝,題目可用 packages frontmatter 宣告」(apply 期間查證 usePythonRuntime 的 micropip.install 路徑後新增,原檢核此筆被 verifier 誤駁)。驗證:與 pentest-notes / challenge-persistence / challenge-framework spec 對照;prose gate 兩檔 0 blocking。

## 6. E 群組:CONTRIBUTE.md

- [x] 6.1 [P] 統一 CONTRIBUTE.md 的 branch 前綴為 feature/(修正 branch naming convention 區塊的 feat/),並補齊 TOC 遺漏的 Challenge Keygen 與 Maintainer Setup 兩章。驗證:grep 全檔無 feat/ 殘留;TOC 條目與實際 ## 章節一一對應。

## 7. 全面驗證

- [x] 7.1 對 outward surface 全部 21 檔執行 python3 scripts/prose-audit/run.py,確認 0 blocking;對本次修改的每一檔執行 humane-prose-audit(technical-doc profile),確認 verdict PASS(0 Critical/High)。驗證:兩套工具輸出。
- [x] 7.2 執行 pnpm docs:build 確認建置成功,並抽查修改頁面的內部連結與 code fence 完整性。驗證:build exit 0;連結核對無 404 目標。

## 8. Round 1 audit 修復(以真實執行 harness 取得地面真相)

背景:round 1 四層復檢回報 3 筆 High blocking + 11 筆 advisory,但 adversarial review 有 73/125 個 agent 失敗,26 筆「駁回」中有 25 筆是 reviewer 崩潰導致 0 票、被預設判駁,不可採信。改以真實 WASM parser + 真實 Python 指令原始碼建立端到端執行 harness(工作筆記,不入 repo)取得地面真相,逐條實測後再修。

- [x] 8.1 落實 Terminal Guide command documentation matches the parser grammar scenario:修正英中兩版 terminal 指南中所有經實測不成立的指令語法與範例輸出——base64/hex 解碼改為實際可用的 `base64 "-d" <text>` 形式並註明未加引號的形式目前只會印 Usage;`xxd` 移除 `-r`/`-p` 兩個實際失效的 flag;`curl` flag 清單移除未實作的 `-I`、補上實際支援的 `-i`/`-s`/`-L`;`tr` 範例改為不含字元範圍的形式;`xargs` 說明改為「回傳其參數,不執行任何指令」;md5sum/sha256sum 範例輸出補上實作固定附加的 `  -` 後綴;`encode url` 範例補上引號。完成判準:文件中每一個指令呼叫與其宣稱輸出,皆能在執行 harness 中重現。驗證:逐條以 harness 執行比對。
- [x] 8.2 修正英中兩版 terminal 指南的 Tier 5 段落:六個 Tier 5 指令實際皆為 `not yet implemented` stub,且 `commands` frontmatter 從未傳入終端機(WxlshPanel 呼叫 useWxlsh 時未帶 commands),因此永遠處於未開放狀態。改為明確說明此層尚未實作、目前無法由題目作者開啟。完成判準:不再宣稱這些指令可用或可由 frontmatter 開啟。驗證:對照 useWxlsh.ts 的 Tier 5 分支與 WxlshPanel.vue 的 useWxlsh 呼叫。
- [x] 8.3 落實 Terminal Guide documents pipe composition scenario:修正英中兩版的 pipe 說明與範例——實作是把上游輸出插入為**第一個** positional 參數,故 `echo "hello world" | grep hello` 實際輸出為空。改為說明此語意並改用實測可行的範例(如 `echo secret | md5sum`、`echo admin | base64 | decode`)。驗證:harness 執行每個 pipe 範例輸出與文件一致。
- [x] 8.4 修正英中兩版 terminal 指南的 help 與歷史紀錄敘述:`hex` 未登錄於 HELP_REGISTRY,故 `help` 不會列出它、`which hex` 也回報 not found,需明確註記;歷史紀錄的 IndexedDB store 無 slug 維度,所有挑戰共用同一份歷史,需移除「重新開啟該挑戰時載入」的逐題暗示。驗證:對照 HELP_REGISTRY、executeTier1 的 which 分支與 useChallengePersistence 的 terminal-history store。
- [x] 8.5 落實 Network Guide page states the capture scope correctly scenario:移除英中兩版 network 指南中「每一筆記錄都會標記來源面板」這句——`source` 欄位只存在於 Attack Session 事件記錄,Traffic Log 面板 UI 並無來源欄。保留「所有面板共用同一層 dispatch 因此都會被記錄」的正確部分。驗證:對照 NetworkPanel.vue 的表頭與 useAttackSession.ts 的 addHttpEvent。
- [x] 8.6 落實 Network Guide page documents Traffic Log and Repeater workflow requirement 的欄位與明細描述:欄位表補上實際渲染的 `#` 序號欄、`Timing` 更名為實際的 `Time`;展開後的明細改為描述實作的 Request／Response 兩個子頁籤(各自顯示完整 raw HTTP 訊息)與 Send to Repeater 按鈕,取代原本四個獨立區塊的錯誤描述。驗證:對照 NetworkPanel.vue 表頭與 detail 區塊。
- [x] 8.7 落實 Network Guide page includes combined workflow examples scenario:在英中兩版 network 指南補一節,示範 Terminal 與 Code Editor 連同 Network Traffic Log、Repeater 的組合攻擊流程。完成判準:該節同時出現 Terminal 與 Code Editor 的實際操作步驟,且所用指令與 API 皆經查證存在。驗證:與 terminal.md／python.md 的權威指令面交叉比對。
- [x] 8.8 [P] 修正 README.md 三筆事實偏差:`pnpm wasm:tools` 說明加註它會吞掉安裝失敗、需自行確認;Cloudflare Pages build command 移除非必要的 `cargo install wasm-tools`;frontmatter 範例移除 `layout: challenge` 的 required 註記(validator 必填欄位清單不含它)。驗證:對照 package.json 的 wasm:tools script、challenge validator 的必填欄位清單。
- [x] 8.9 [P] 修正 zh-TW 用語三處:network.md 的「客戶端錯誤」改為「使用者端錯誤」(repo gate 的 mainland_vocab 規則封鎖「用戶」,故不能回退為「用戶端」);「參數篡改」改為台灣慣用的「參數竄改」;python.md 的「快捷鍵」改為「快速鍵」,與 terminal.md 一致。驗證:三檔 prose gate 0 blocking,且全域 grep 無殘留。
- [x] 8.10 全面複驗:對本次修改的每一檔重跑 repo prose gate 與 humane-prose-audit,並執行 pnpm docs:build。驗證:prose gate 0 blocking、humane-prose-audit verdict PASS、build exit 0。
