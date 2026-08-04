## Context

`openspec/specs/` 是系統當前行為的 source of truth,`openspec/changes/archive/` 是歷程紀錄。這個區分決定了本 change 的整個形狀:**只校正前者,絕不修改後者。**

證據來源是 11 個 agent 的裁決與碰撞檢查,完整表格在 `.spectra/analysis/spec-alignment-v1/evidence-table.md`(43 列 evidence、26 筆碰撞、9 筆待決;待決已全部由使用者拍板)。該目錄不進版控,因此本檔記錄的是它的結論與理由,不是它的替代品。

## Goals

- 讓 `openspec/specs/` 中每一句規範性陳述,都能被一個可重跑的指令證明為真。
- 每一處修法都附帶「為什麼是 spec 錯而不是程式碼錯」的裁決依據。
- 修法落地後,不製造新的假陳述。

## Non-Goals

見 proposal 的 Non-Goals 一節。其中最重要的兩條:不動已封存目錄;不把已知的程式碼缺陷寫進 spec。

## 決策一:不得無條件對齊到程式碼

spec 說 SHALL X 而程式碼做 Y,有兩種可能:spec 錯,或程式碼有 bug。**把後者當成前者處理,就是把 bug 寫成規範。** 這是本 change 最容易犯、後果也最嚴重的錯誤——一旦寫進 spec,那個 bug 就取得了規範地位,未來任何人想修它都會變成「違反 spec」。

因此每一筆都必須先裁決,並記下依據。本輪 43 筆全部裁決為 spec 錯或其連帶,但**有兩筆走向相反,正好證明這道紀律不是形式**:

- **keygen 的 skip 分支永遠不觸發。** 準備 template 的函式每次執行都重寫 `.vitepress/wasm/template.wasm`,而該檔是 staleness 判定的輸入之一,實測連跑兩次都印 stale。spec 描述的增量行為是刻意設計的,對齊到現況等於宣告「永遠不 skip」是正確行為。裁決:程式碼錯,本 change 不動。
- **spec-gates 腳本的 change id 驗證排序。** spec 與貢獻指南都保證「在讀檔案系統之前拒絕」,實作卻先對串接後的路徑做目錄判斷。實測傳入一個帶路徑穿越的 id,印出的是路徑訊息而非 guard 訊息。裁決:程式碼錯,**改程式碼**。這是本 change 唯一的行為變更。

裁決依據的形式必須是「為什麼」,不能是「程式碼就是這樣」。例如 challenge-list 的 hover accent 判為 spec 錯,依據是同檔較新的一組 requirement 已經完整重新規範 grid hover 且與樣式設定逐字相符,加上樣式檔只有一個 commit——代表該效果從未存在,不是回歸。

## 決策二:修法的理由句本身也要通過查證

碰撞檢查(在修法落地**之前**,由獨立 agent 檢查「這段新文字會不會讓 corpus 裡其他原本為真的句子變成假的」)回報 26 筆。其中一筆直接改寫了本 change 的修法內容,值得單獨記錄:

**wasm-challenge-payload 的順序修正,它的理由句連錯三代 —— 這是本 change 存在理由的縮影。**

| 版本 | 文字 | 為何錯 |
|---|---|---|
| v0 | 「strip 移除**每一個** custom section」 | 憑印象。實際有豁免 |
| v1 | 「除 `name` / `component-type` / `dylink.0` 外全部移除」 | **抄 `--help`**。而 `--help` 兩個方向都不準 |
| v2 | 「除 `name` / `dylink.0` / 名稱以 `component-type:` 開頭者外」 | 實測正確,但列舉會隨工具版本腐化 |
| v3(交付) | 拿掉列舉,只留「`chall-data` 不在豁免內」 | 載重事實,工具升版不會腐化 |

v2 是唯一真的做了實驗的那一步:造一個帶 `component-type:mycomp`、`component-type`、`dylink.0`、`producers`、`name`、`chall-data` 的 module,以釘版的 wasm-tools 1.249.0 執行 strip,存活的是 `component-type:mycomp`、`dylink.0`、`name`;被刪的是 `component-type`(名稱正好等於該字串者)、`producers`、`chall-data`。**豁免是 `component-type:` 前綴比對,不是名稱比對。**

而 v2 的結論是:這個列舉不該存在。

交付的寫法只斷言一件事:`chall-data` 不在豁免內 —— 這一點以已出貨的 runtime.wasm 實測(strip 後該 section 消失)。

**這是本 change 存在理由的縮影。** 一個為了消除假陳述而寫的句子,自己就可能是新的假陳述;唯一的差別是有沒有人在它落地前去查。

其餘影響措辭的碰撞:

- 清單頁 layout 的修法會弄假同一個 requirement 的標題與其 Scenario(它們仍寫「card」與「2-3 行」,而預設 view 是 row 且 grid 為 2 行),三者必須同批改。
- 明寫「裸元件不是支援用法」會把主題進入點的一行註解從「spec 背書」翻成「與 spec 矛盾」,該註解必須同批修。
- 建置管線的 best-effort 條款會弄假 fork skill 文件中「binaryen 是建置必要條件」的敘述,該處須同批降為選用。
- 豁免句若只點名最佳化與變異兩個工具,會弄假 README 與稽核文件中「strip 工具缺席時同樣只警告」的敘述,因此豁免句必須點名 strip,並區分「工具缺席=警告」與「strip 產出不合法=硬失敗」。
- 必要狀態檢查的修法會把讀者委派到 CI 品質閘門 capability,而該 capability 自己寫著「恰好兩個頂層 job」(實際五個),因此那兩行必須一併校正,否則等於把讀者導向一個自我矛盾的真相來源。

## 決策三:Purpose 的違反有兩種型態,只修一種等於白做

`spec-corpus-governance` 要求每個 active spec 都有具體的 Purpose,且不得保留封存產生的 placeholder。目前有 10 個 spec 帶 placeholder,另有 5 個**完全沒有 Purpose 段落**。

若只用「搜尋 placeholder 字串」來收斂,change 落地後那條 SHALL 仍然被證偽。因此兩種型態都納入。

Purpose 的撰寫標準:讀完該 spec 的全部 requirement 後,用一到兩句描述這個 capability 涵蓋什麼,且要能讓人判斷「我要找的東西是不是在這裡」。不抄 requirement 標題,不寫空話。

## 決策四:修法順序

會互相影響的排在一起,先做的完成後才動下一組:

1. **challenge-list 全組**(Purpose、layout、元件契約、card/row、hover、type-only 匯入)。組內互相牽動最密,必須一次改完再驗。
2. **wasm-challenge-payload 全組 + fork skill 文件**。順序修正牽動豁免句與名詞統一,單獨改任何一句都會留下矛盾。
3. **spec-drift-gates 全組 + 貢獻指南的兩處**。全部指向同一個判定層級。
4. **contributor-guide + CI 品質閘門 + 貢獻指南的另兩處**。委派鏈必須同時成立。
5. **15 個 Purpose**。彼此獨立,可任意順序。
6. **程式碼註解與 docstring**。依賴前五組的最終措辭,因此最後做。
7. **spec-gates 腳本的 guard 排序 + 測試**。唯一的行為變更,與前六組無耦合,獨立驗證。

## Implementation Contract

- **可觀察行為**:除第 7 組外,執行期行為零變更。第 7 組使一個帶路徑穿越的 change id 在任何檔案系統存取之前被拒絕,退出碼 2,訊息來自 guard 而非路徑查找。
- **驗收**:`pnpm test --run` 與 spec-gates 的 Python 測試皆全綠;每一組各自有可重跑的 grep 或指令能證明該組已完成(見 tasks)。
- **範圍邊界**:in scope 為 `openspec/specs/` 下的 18 個 spec、貢獻指南、fork skill 文件、主題進入點註解、spec-gates 腳本與其測試。out of scope 為 `openspec/changes/archive/` 全部內容、keygen 的 staleness 判定、spec 檔的結構整理、以及任何新增的機械檢查。
- **失效模式**:若某一組改完後,同組內出現新的互相矛盾,視為該組未完成,不得進入下一組。
