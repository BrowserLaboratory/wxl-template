## Context

這個 repo 目前有四道 CI 閘門:`test`(Vitest)、`build`(VitePress)、`site-smoke`(Playwright)、`prose-audit`(Python,PR 限定)。四者的共同性質是**其定義域都封閉在「本次被改動的產物」之上**。

`terminal-opt-in-by-default` 的 RCA 證實,反覆逃過稽核的缺陷類別恰好落在該定義域的補集:**未被改動的文字,被改動的程式碼弄假**。三輪修復期間,每一輪的全面複驗都是綠的,同時帶著 blocking 缺陷。

`prose-audit` 提供了本變更可直接沿用的形狀:`scripts/prose-audit/` 下有 `run.py`、`test_run.py`、`config.yaml`、`requirements.txt`,CI 中是獨立 job,以 Python 3.12 執行並快取 pip。其 changed-file 清單經由 `env:` 而非 `${{ }}` 傳入,並在註解中說明這是 CWE-78 的防護——本變更必須沿用同一手法。

**縮編背景(2026-08-02)**:七道閘門的初版已完整實作(tasks 群組 1–7,27/27),但歷經三輪對抗式稽核未收斂,RCA 決議縮編為 G1/G2/G7。原始 findings 保存於 `.spectra/analysis/spec-drift-gates-audit/`。群組 8 的任務即為執行此縮編。

## Goals / Non-Goals

**Goals**

- 讓「未改動的敘述被改動的程式碼弄假」這一類缺陷在 CI 就被攔下,而非留給多輪 subagent 稽核。
- 讓 `spectra archive` 的 `@trace` 遺失不再靜默發生——且由 CI 攔截,不依賴人記得執行本機自檢。
- 閘門本身可離線執行,讓作者在推送前就能自檢。
- FAIL 只來自精確判定;啟發式判定至多 REVIEW。

**Non-Goals**

- 不取代也不修改 `prose-audit`。
- 不自動修復任何 finding。
- 不修改 `spectra archive` 的行為。
- 不改變既有四個 CI job 的行為。
- 不以任何形式保留或重新引入 G3–G6。

## Decisions

**決策一:閘門合為單一腳本,而非拆成 `checks/` 外掛**

`prose-audit` 採 `checks/` 外掛架構,因為每個 check 的介面一致(單一檔案進、findings 出)。本閘門的檢查輸入各不相同——有的吃 diff、有的吃全庫 grep——強行統一介面會製造沒有價值的抽象。單檔加上每道閘門一個函式即可。

**決策二:三級判定,只有 FAIL 阻斷 CI**

實跑顯示啟發式判定會產生大量需要人判斷的命中。縮編後此決策收得更緊:FAIL 只保留給**判定與被斷言的性質同一**的那一種情況——G1 的宣告缺席(檔案或鍵是否存在)。G2 全面降為 REVIEW;G7 也不設 FAIL 層,理由見決策八(它判的是一個 repo 內沒有定義的詞,阻斷級判定必須可裁決)。另有第三種結果不是判定而是「無法評估」:宣告檔壞掉、change id 不合法時退出碼 2,見決策四與「判定與退出碼」。

**決策三:G1 的名詞短語由 gates.yaml 提供,而非自動推導**

自動推導「哪些短語的真值條件被本次變更改動了」需要語意理解,那正是機械閘門不該做的事。改由變更作者宣告。這把判斷留給人,把窮舉留給機器。

**決策四(縮編修訂):per-change `gates.yaml` 必須存在且必須帶 `claim_phrases` 鍵**

原設計在 `openspec/changes/<id>/gates.yaml` 不存在時靜默退回全域 `scripts/spec-gates/config.yaml`。這使「作者忘了考慮 claim_phrases」與「作者考慮過並刻意不宣告」不可區分——與決策三的意圖矛盾。縮編後的宣告檔契約如下:

- **兩種缺席都是 G1 FAIL**:檔案不存在,以及檔案存在但解析後不帶 `claim_phrases` 鍵(零位元組檔即屬此類)。兩者一樣無法與「作者從未考慮」區分,把後者當成「刻意宣告無短語」等於替作者代言。`load_config` 對兩者都回傳缺席訊號,`run_gates` 再依 `gates.yaml` 是否存在,把 FAIL 的 detail 分成「請建立此檔」與「請補上此鍵」兩種——成因不同,修法也不同。
- **檔案存在且 `claim_phrases: []`** 是刻意宣告,PASS 並在輸出載明。
- **型別錯誤不是 FAIL,是無法評估**:`claim_phrases` 或 `hedge_markers` 存在但不是 list(例如寫成字串),`_require_list` 丟出 `GateError`,退出碼 2。字串會被逐字元迭代——單一字元的 hedge marker 幾乎命中每一行,G1 的未涵蓋清單就永遠是空的;字串短語則會逐字元 grep 全庫。這是靜默破壞而非可用設定,必須大聲拒絕而不是照跑。格式錯誤的 YAML 同樣由 `_load_yaml` 轉成 `GateError` → 退出碼 2,不是 traceback。
- **`hedge_markers` 的退回以「鍵是否存在」判定,而非以值是否為真**:鍵存在就照用其值,因此 `hedge_markers: []` 表示「沒有任何措辭算 hedge」,是刻意收緊;以真假值判斷的舊寫法反而讓這位作者拿到最寬鬆的預設。只有鍵完全不存在才退回全域 `config.yaml`,再退回 `run.py` 的內建預設。`claim_phrases` 沒有這條退路,只認 per-change 檔。

這改變貢獻者契約:每個 change 目錄必須帶一份 gates.yaml,且必須寫出 `claim_phrases` 鍵(空清單即可)。

**決策五:CI 中為 PR 限定的獨立 job,change id 由 PR diff 推導**

`pull_request` 限定與 `prose-audit` 同理(`github.base_ref` 在 push 事件為空)。change id 的推導從「工作樹下唯一的 change 目錄」改為「PR diff 中被觸及的 `openspec/changes/<id>/` 路徑(排除 archive)」:前者讓任何無關 PR 在 main 上掛著 change 目錄時撞上別人的判定(稽核 R1 #17),在 gates.yaml 改為強制後會直接把無關 PR 打成 FAIL,必須修。PR 觸及多個 change 目錄時逐一執行;未觸及任何 change 目錄時,**只跳過 id-scoped 的那個步驟**(G1 與 G2),G7 仍照跑——見決策七。

推導出來的 id 集合來自 fork PR 可控的檔案路徑,因此 id 迴圈另有兩條規則:

- **白名單 regex `^[a-z0-9-]+$`,不符即 fail-closed**:每個 id 在被拿去做任何事之前先過這條 regex,不符者以 `::error::` 點名該 id 並直接 `exit 2`,不進入 gates、也不靜默略過。這是 CWE-78 的第二層防護(第一層是 id 只經 `env:` 進入 shell、不經 `${{ }}`),而它同時對 change 目錄命名施加了一條契約:**live change 目錄只能用小寫英文字母、數字與連字號**。取名超出這個字集的目錄不會被 gated,而是會讓整個 job 停下來——這是刻意的,「沒被檢查」不該長得像「檢查過了」。
- **迴圈保留最嚴重的退出碼,2 勝過 1**:`run.py` 把「閘門判定 FAIL」(退出碼 1)與「閘門無法評估」(退出碼 2)分開,若迴圈把兩者壓平成 1,triage 紅燈的人就看不出差別——前者要改文件,後者要修環境或設定檔。因此迴圈以 `status` 累積:任一 id 得到 2 就鎖定 2,其餘非零才降級為 1。

**決策六(縮編修訂):G7 改為 diff-based,逐 requirement 對齊**

原設計是 snapshot/verify-archive 兩段式,依賴人在 archive 前後手動執行——從未接進 CI,三輪稽核也證實其 CLI 介面文件與實作不符、snapshot 檔會汙染工作區(R1 #4/#7/#11/#13)。縮編後 G7 進入 `run_gates` 的預設檢查,逐 requirement 標題對齊。

**比對的兩端是「base ref」與「工作樹」,不是 base 對 HEAD**:base 側由 `spec_traces_at(<base>)` 從該 ref 上 committed 的檔案讀出;另一側由 `spec_traces_worktree()` 直接讀磁碟上的 `openspec/specs/*/spec.md`,**含尚未 commit 的修改**。取工作樹的理由是這道閘門要判的是「這個 PR 最後會併進去的內容」,而它的後果在兩個執行場景並不對稱:

- **本機**:貢獻者在 commit 之前刪掉 `@trace` 區塊就會被抓到,不必等到 commit 或推上去才看到紅燈。這是刻意保留的較早訊號。
- **CI**:job 跑在剛 checkout 的乾淨工作樹上,工作樹的內容即等同 HEAD,兩種讀法得到同一份輸入,因此判定與「base 對 HEAD」一致——多出來的涵蓋範圍在 CI 不會改變任何結論。

**比對的身分是 `source:` 值的集合,不是 `@trace` 區塊的數量**:每個 requirement 底下的 `@trace` 區塊各帶一行 `source: <change-id>`,G7 收集這些值成為一個集合——

- requirement 兩邊都在,而 base 側的 `source:` 集合**不是**工作樹側集合的子集 → **REVIEW**,detail 為 `lost_sources`(排序後的遺失清單)加上 `before`／`after`(兩側集合大小)與 capability、requirement 標題。以集合而非計數判定有兩個好處:報告可直接指出是哪一筆 metadata 掉了(計數只能說「從五變一」),而且「掉一筆、又加一筆」這種替換不會因為總數相同就矇混過關。archive 整塊替換正是會掉 `source:` 的形狀——它常常只留下 delta 帶回來的那一筆。
- requirement 在 base 存在、工作樹側整條消失 → 同樣 **REVIEW**,detail 為 `base_traces`(base 側集合大小)與 `base_sources`(排序後的來源清單),同樣附上 capability 與 requirement 標題。合法的 `## REMOVED` 會在同一 PR 的 delta 中可見,由人判定;不因此阻斷。
- 其餘(新增 capability、新增 requirement、新增 `source:`)→ 不構成命中。

集合語意有兩個附帶結果,都是刻意接受的:沒有 `source:` 的區塊仍以 `#n` 這種合成識別計入(否則未標來源的 trace 就可以隨意刪),而同一 requirement 底下兩個 `source:` 相同的區塊會收斂成一個識別——刪掉其中一個不會被回報。後者與「把兩個同源區塊合併成一個」這種合法整併是同一個等價關係,無法只留下想要的那一半。

採逐 requirement 對齊而非整檔彙總,是因為整檔彙總會把合法的 requirement 移除誤判為 metadata 遺失——那會重蹈 G4「擋掉自己 72% 歷史」的覆轍。隨此決策刪除:`--snapshot`、`--verify-archive`、`--snapshot-file`、`--out` 四個旗標、`SNAPSHOT_DIR`、`snapshot_path()`,以及 test_run.py 的整段 snapshot/verify-archive 測試區塊(以 `# ──` 區塊註解定位,該區塊同時是把 `_CHANGE = "spec-drift-gates"` 寫死的定時炸彈——change 一封存,每個 PR 的測試就會紅)。

**決策八:G7 不設 FAIL 層,直到 `@trace` 的語意被寫成 requirement**

這一節記錄的是一個**決定**,不是一項查證結果。

縮編期間 G7 的判定身分改過三次:區塊計數掉到零 → 區塊計數任何減少 → `source:` 值集合。每一次都是為了消除前一版的誤報面,每一次都打開了新的。第三輪複審對本 repo 真實歷史重播後,兩個身分的命中集如下(指令見下方,可自行複驗):

| 身分 | 觸發的 archive commit | requirement 命中 | 形狀 |
|---|---|---|---|
| `source:` 值集合 | 4(`a79f744`、`810ac03`、`7c9065c`×2、`380fde7`×3) | 7 | 全部 `before == after`,集合內容不同 |
| 區塊計數(任何減少) | 1(`98552037` 的 `a01-access-control-template-pack`) | 3 | 2→1,倖存區塊的 `source:` 未變 |

**兩組命中的交集是空集合。** 每一個身分都是另一個身分正例類別上的漏報。

更關鍵的是:那 7 筆命中究竟是不是誤報,取決於讀者帶了哪一個「遺失」的定義。以「requirement 的 `@trace` 筆數是否維持」為準,7 筆全是雜訊;以「requirement 不再指向某個在 HEAD 仍然存在的 `code:` 路徑」為準,7 筆全部命中真實流失。這兩個定義,repo 裡都沒有寫下來——`openspec/specs` 全庫沒有任何一條 requirement 治理 `@trace` 或它的 `source:` 欄位,而產生這些區塊的 `spectra archive` 是一個封閉的二進位檔,其行為無法從 repo 內查證。

阻斷級判定必須是可裁決的。這一個在定義寫下來之前不可裁決,所以 **G7 不產生 FAIL**:它把看到的東西逐筆報出來,由人判斷。這使得縮編後唯一的 FAIL 來源是 G1 的宣告檔缺席(檔案或鍵是否存在,判定與被斷言的性質同一)。

要恢復 G7 的 FAIL 層,先決條件是把「什麼算 `@trace` 遺失」寫成 `openspec/specs` 內的一條 requirement,並以本節的兩份重播清單作為該定義的驗收語料——新定義必須能對這 10 筆命中逐筆給出答案。

重播指令:

```python
import sys; sys.path.insert(0, 'scripts/spec-gates'); import run as g
base = g.spec_traces_at('<sha>^'); head = g.spec_traces_at('<sha>')
v = g.gate_trace_parity(base, head)
```

**決策七:G7 不綁 change id,每個 PR 無條件執行**

決策五把整個 job 的執行綁在「PR 是否觸及 live change 目錄」上,對 G1、G2 合理(兩者都是逐 change 的判定),對 G7 卻留下兩個漏洞——而 G7 正是唯一會 FAIL 的機械判定:

- 不碰 `openspec/changes/` 的 PR 推導不出任何 id,id-scoped 步驟被跳過;但這種 PR 完全可以直接刪掉 `openspec/specs/**/spec.md` 裡的 `@trace` 區塊,無人攔阻。
- archive PR 把 `openspec/changes/<id>/` 搬進 `openspec/changes/archive/`,git 的 rename 偵測把整批搬移收斂成 R100 條目、只列出 archive 側路徑,awk 又把 archive 濾掉,於是 id 集為空——G7 對它最該守護的那個操作從未執行。這不是理論風險:本 repo 歷史中的封存**全部**以 rename 條目記錄(`git log -M --name-status` 下九十餘筆),零筆純刪除條目。

修法是把 G7 從 id 迴圈裡拉出來:`run.py` 新增 `--trace-parity-only` 模式(只跑 G7、不吃 change id,與 change id 併用即退出碼 2,因為兩種呼叫對「要評估什麼」的認知互斥),CI 的 `spec-gates` job 以一個**沒有 `if:`** 的步驟呼叫它;id-scoped 步驟維持 `if: steps.change.outputs.ids != ''`,只跑該跑的 G1/G2。此處不留 G7 空洞:`run.py <change-id>` 本來就會連 G7 一起跑,在有 id 的 PR 上只是以相同輸入重算一次、得到相同判定的冗餘。

不選「在 CI 裡臨時造一個假的 change 目錄好讓 id 迴圈跑起來」的替代方案:那會讓 CI 的判定取決於 G1、G2 如何對待一個沒人寫過的目錄。

## Implementation Contract(縮編後)

**命令列介面**

```
python scripts/spec-gates/run.py <change-id> [--base <ref>] [--json]
python scripts/spec-gates/run.py --trace-parity-only [--base <ref>] [--json]
python scripts/spec-gates/run.py --resolve-change --base <ref>
```

第一式對單一 change 跑三道閘門;第二式只跑 G7、不吃 change id(併用 change id → 退出碼 2),CI 以此在每個 PR 無條件執行 G7;第三式印出 diff 觸及的 change id,一行一個,是本機輔助工具(CI 另在 job 內以 `git diff --name-only | awk` 推導,不呼叫此旗標)。snapshot 與 verify-archive 模式不存在。預設 base 為 `main`。`--json` 輸出機器可讀格式;預設輸出為人類可讀的逐閘門摘要,REVIEW 與 FAIL 的每筆命中一行一筆、不得截斷清單。**每筆命中帶的識別資訊隨閘門而異,不是三道都給檔案與行號**:G1 給檔案路徑、行號與原文;G2 給宣稱寫在哪一份 change artifact、該 artifact 內的行號、原文,以及該宣稱點到的那個 diff 檔案(後兩者是不同的檔案,而且每份 artifact 各自從第一行起算,少了 artifact 名稱行號無從解讀);G7 逐 requirement 對齊、本來就沒有行號可報,改為給 capability 與 requirement 標題,外加相關的 `source:`。

**判定與退出碼**

每道閘門回傳 PASS、REVIEW 或 FAIL 其一。任一閘門 FAIL → 退出碼 1,否則 0。REVIEW 不影響退出碼。subprocess 失敗不得偽裝成空輸出(`git grep` 的 exit 1 是「無命中」,其餘非零一律傳播為錯誤)。

退出碼 2 = 「閘門無法評估」,成因如下,一律以訊息(或使用說明)呈現而非 traceback:

- 完全沒給 change id,也沒選用不需要 id 的模式:`main()` 印出 argparse 的使用說明後回傳 2。此路徑印的是 help 而非 `error:` 開頭的訊息,stderr 為空;
- change 目錄不存在;
- change id 不是單一目錄名——空字串、含路徑分隔字元、或本身就是 `.` 或 `..`:`run_gates` 在碰任何檔案或 git 之前就丟 `GateError`,因為該 id 會被接到 `openspec/changes/` 之後,穿越型的 id 會讀到該目錄以外的檔案;
- `git` 不可用(或當前不是 git repo);
- 宣告檔不是可解析的 YAML(`_load_yaml`);
- `claim_phrases` 或 `hedge_markers` 存在但型別錯誤(`_require_list`);
- `--trace-parity-only` 與 change id 併用。

CI 端另有兩個同樣以 2 收場的情況,見決策五:change id 未通過白名單 regex,以及多 id 迴圈中任一 id 得到 2。

**各閘門的判定條件**

| 閘門 | FAIL 條件 | REVIEW 條件 |
|---|---|---|
| G1 claim-parity | `openspec/changes/<id>/gates.yaml` 不存在,**或**存在但不帶 `claim_phrases` 鍵(FAIL detail 區分兩者) | 已宣告短語存在未涵蓋命中 |
| G2 invariance | 不會 FAIL | 「X 不變」型宣稱點名 diff 中的檔案(裸與限定式一律列出) |
| G7 archive trace-parity | 不會 FAIL(見決策八) | base 與工作樹皆有的 requirement,其 base 側 `@trace` `source:` 集合不是工作樹側集合的子集;或 requirement 在工作樹側整條消失 |

宣告檔本身無法解析(YAML 格式錯誤、`claim_phrases` 或 `hedge_markers` 不是 list)不走 FAIL,一律 `GateError` → 退出碼 2。

**gates.yaml 契約**

```yaml
# 必須存在,且 claim_phrases 必須有值(鍵不在、或寫了鍵卻不接值,都算沒宣告)。
# 空清單 = 刻意宣告本次無此類短語。
claim_phrases: []
```

`hedge_markers` 是選填鍵,但退回規則看的是**鍵在不在**,不是值是不是空:如上例整個省略,才會退回 `scripts/spec-gates/config.yaml`、再退回內建預設;若寫成 `hedge_markers: []`,得到的是「沒有任何措辭算 hedge」這個最嚴格的設定,不是預設值。兩者都合法,但要的是預設就別寫這個鍵。

**失效模式**

閘門本身不得因單一命中的解析失敗而中止——該命中記為 REVIEW 並附上原始行。

**驗收條件**

- `python scripts/spec-gates/test_run.py` 退出碼 0;G1 的三種路徑(缺檔 FAIL、空清單 PASS、未涵蓋 REVIEW)、G2 的 REVIEW-only、G7 的三種路徑(遺失 FAIL、消失 REVIEW、無變化 PASS)各有具名測試。
- 對 `run.py` 全文 `grep -n "gate_deleted_literal\|gate_scope_parity\|gate_scenario_parity\|gate_added_lines_trace\|--snapshot\|verify-archive\|SNAPSHOT_DIR"` 零命中(G3–G6 與 snapshot 模式無殘留)。
- 把本 change 目錄搬移模擬封存後,`python scripts/spec-gates/test_run.py` 仍退出碼 0(定時炸彈驗收)。
- 對本 change 自身執行 `run.py spec-drift-gates --base origin/main` 零 FAIL(dogfooding;本 change 目錄需自帶 gates.yaml)。
- `run.py --trace-parity-only --base <ref>` 不吃 change id 也能單獨判定 G7,併用 change id 退出碼 2;`quality-gates.yml` 的 `spec-gates` job 中該步驟不帶 `if:`。

**範圍邊界**

*In scope*:`scripts/spec-gates/run.py` 與 `test_run.py` 的縮編、`quality-gates.yml` 的 `spec-gates` job 的 change-id 推導修正與 G7 無條件步驟、全域設定檔 `scripts/spec-gates/config.yaml` 的清理(刪去已無作用的 `claim_phrases` 鍵、改寫註解說明它只供 hedge_markers 預設)、CONTRIBUTE.md 的 `## Spec-drift gates` 一節改寫、本 change 目錄新增 `gates.yaml`、delta spec 同步。

*Out of scope*:`prose-audit` 的任何檔案、`spectra` 本身、既有四個 CI job、任何自動修復行為、既有 change 的重新稽核、`requirements.txt` 的形狀。

**這條界線本身被 G2 抓過一次**:上一版的 *Out of scope* 把全域設定檔連同 `requirements.txt` 一起宣稱形狀不動,而決策四的修法又刪掉了該檔裡已無作用的鍵——宣稱在同一次變更裡被自己弄假。dogfooding 執行 `run.py spec-drift-gates --base origin/main` 時,G2 以一筆 bare 命中列出該行,才發現這處漂移。這正是本 change 想攔的缺陷類別,而且是閘門逮到自己的規格文件。

## Risks / Trade-offs

- [gates.yaml 強制化會讓既有未帶該檔的 change 在 CI FAIL] → change id 由 PR diff 推導,只有被 PR 觸及的 change 受檢;本 repo 目前唯一活躍 change 即本 change,隨本 change 補上 gates.yaml。
- [G2 降為 REVIEW 後失去阻斷力] → 這是刻意的:G2 的限定式判定是啟發式,三輪稽核證實其 FAIL 判定雙向誤判。清單價值保留,阻斷權收回。
- [G7 的 REVIEW(requirement 消失)可能被忽略] → 消失的 requirement 在同一 PR 的 delta 檔中同樣可見,REVIEW 是第二道提醒而非唯一防線。
- [Python 版本與相依] → 沿用 `prose-audit` 的 3.12 與 pip 快取設定;只用標準函式庫加 PyYAML。

## Migration Plan

1. 群組 8 的縮編任務在本 change 內完成,不另開 change。
2. 合併後,貢獻者契約新增一條:每個 change 目錄必須帶 `gates.yaml`(CONTRIBUTE.md 記載)。
3. archive 流程不再有 snapshot/verify 步驟;G7 由 CI 的 PR 檢查自動涵蓋——涵蓋得到的前提是決策七的無條件步驟,因為 archive PR 推導不出 change id。
