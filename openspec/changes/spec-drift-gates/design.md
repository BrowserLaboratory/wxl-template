## Context

這個 repo 目前有四道 CI 閘門:`test`(Vitest)、`build`(VitePress)、`site-smoke`(Playwright)、`prose-audit`(Python,PR 限定)。四者的共同性質是**其定義域都封閉在「本次被改動的產物」之上**。

`terminal-opt-in-by-default` 的 RCA 證實,反覆逃過稽核的缺陷類別恰好落在該定義域的補集:**未被改動的文字,被改動的程式碼弄假**。三輪修復期間,每一輪的全面複驗都是綠的,同時帶著 blocking 缺陷。

`prose-audit` 提供了本變更可直接沿用的形狀:`scripts/prose-audit/` 下有 `run.py`、`test_run.py`、`config.yaml`、`requirements.txt`,CI 中是獨立 job,以 Python 3.12 執行並快取 pip。其 changed-file 清單經由 `env:` 而非 `${{ }}` 傳入,並在註解中說明這是 CWE-78 的防護——本變更必須沿用同一手法。

七道閘門中的前六道已在 `terminal-opt-in-by-default` 期間以原型手動執行過。實測結果記錄於該 change 的 tasks.md 12.3 與 13.x,包含兩個由實跑發現的設計缺陷及其修正。

## Goals / Non-Goals

**Goals**

- 讓「未改動的敘述被改動的程式碼弄假」這一類缺陷在 CI 就被攔下,而非留給多輪 subagent 稽核。
- 讓 `spectra archive` 的 `@trace` 遺失不再靜默發生。
- 閘門本身可離線執行,讓作者在推送前就能自檢。

**Non-Goals**

- 不取代也不修改 `prose-audit`。
- 不自動修復任何 finding。
- 不修改 `spectra archive` 的行為。
- 不改變既有四個 CI job 的行為。

## Decisions

**決策一:七道閘門合為單一腳本,而非拆成 `checks/` 外掛**

`prose-audit` 採 `checks/` 外掛架構,因為每個 check 的介面一致(單一檔案進、findings 出)。本閘門的七道檢查輸入各不相同——有的吃 diff、有的吃全庫 grep、有的吃 archive 前後的快照——強行統一介面會製造沒有價值的抽象。單檔加上每道閘門一個函式即可。

**決策二:三級判定,只有 FAIL 阻斷 CI**

實跑顯示 G1、G2、G5、G6 會產生大量需要人判斷的命中(程式碼識別字、章節標題、限定式宣稱、刻意移除)。若一律阻斷,閘門會立刻被當成雜訊而繞過。因此:FAIL 表示機械上可確定為錯(G3 有存活的已刪除字面值、G4 列舉不符、G5 有未記錄的 scenario 遺失、G7 trace 減少);REVIEW 表示需人工判定,輸出清單但 exit 0;PASS 表示零命中。

**決策三:G1 的名詞短語由 `config.yaml` 提供,而非自動推導**

自動推導「哪些短語的真值條件被本次變更改動了」需要語意理解,那正是機械閘門不該做的事。改由變更作者在 config 中宣告,並在 tasks.md 記錄判定結果。這把判斷留給人,把窮舉留給機器——後者正是三輪稽核失敗的地方。

**決策四:G7 需要 archive 前的快照,因此以兩段式執行**

`spectra archive` 是破壞性操作,事後無法得知原本的 `@trace` 數量。腳本提供 `--snapshot` 與 `--verify-archive` 兩個模式:前者在 archive 前記錄各 baseline spec 的 requirement 與 trace 計數,後者在 archive 後比對。CI 無法涵蓋這一段(archive 由人在本機執行),因此 G7 的定位是本機自檢,並在 CONTRIBUTE.md 的 archive 步驟中明列。

**決策五:CI 中為 PR 限定的獨立 job**

與 `prose-audit` 相同的理由:G1 至 G6 需要 base 與 head 的 diff,而 `github.base_ref` 在 push 事件上為空。

## Implementation Contract

**命令列介面**

```
python scripts/spec-gates/run.py <change-id> [--base <ref>] [--json]
python scripts/spec-gates/run.py --snapshot <change-id> --out <path>
python scripts/spec-gates/run.py --verify-archive <change-id> --snapshot <path>
```

預設 base 為 `main`。`--json` 輸出機器可讀格式;預設輸出為人類可讀的逐閘門摘要。

**判定與退出碼**

每道閘門回傳 PASS、REVIEW 或 FAIL 其一。腳本在**任一閘門為 FAIL 時退出碼為 1**,否則為 0。REVIEW 不影響退出碼,但必須出現在輸出中並列出其命中項。

**各閘門的失敗條件**

| 閘門 | FAIL 條件 |
|---|---|
| G1 claim-parity | 不會 FAIL——命中未被涵蓋時為 REVIEW |
| G2 invariance | 存在**裸**宣稱,其點名的檔案出現在 diff 中 |
| G3 deleted-literal | 存在被移除且未在新增行重現的散文型字面值,仍在全庫有命中 |
| G4 scope parity | proposal 的檔案清單與實際不符;或 proposal **有寫** delta spec 宣告但與磁碟不符。完全沒寫該宣告時為 REVIEW |
| G5 delta scenario parity | 存在未在 tasks.md 記錄的 baseline scenario 遺失 |
| G6 added-lines trace | 不會 FAIL——恆為 REVIEW,輸出機制性斷言清單 |
| G7 archive trace-parity | 任一 baseline spec 的 `@trace` 或 requirement 計數低於快照 |

**G3 的字面值判定**

只取「散文型」字面值:長度 12 至 80、含空白、含至少三個連續小寫字母,且不含 `<`、`>`、`{`、`}`、`;`、`=`,亦不以逗號開頭。此規則來自實跑——原始版本會把重構移動過的識別字與 template 片段誤判為被刪除的訊息字串,產生三筆誤報。

括號**不**列入排除字元。原型曾一併排除 `(` 與 `)`,但那會濾掉 `not specified (default all)` 這種真正的使用者訊息——正是上一個 change 中 G3 該抓的那一筆。排除字元只保留標記語法與賦值語法的特徵。

**G5 的例外**

baseline scenario 的移除若為刻意,其標題必須出現在該 change 的 tasks.md 中;此時降為 REVIEW 而非 FAIL。此例外同樣來自實跑——`terminal-opt-in-by-default` 刻意移除 `Default all tabs enabled` 並以新 scenario 取代,原始版本誤判為 FAIL。

**config.yaml**

```yaml
# 本次變更改動了真值條件的名詞短語,G1 將掃描其全部出現位置
claim_phrases: []
# 視為「已帶條件語氣」的措辭,中英皆可
hedge_markers: []
```

腳本在 `openspec/changes/<change-id>/gates.yaml` 存在時優先讀取它,否則讀 `scripts/spec-gates/config.yaml` 的預設值。`claim_phrases` 為空時 G1 直接回傳 PASS 並在輸出中註明未宣告任何短語。

**失效模式**

change 目錄不存在時以退出碼 2 中止並說明。`git` 不可用時同樣以退出碼 2 中止。閘門本身不得因單一命中的解析失敗而中止——該命中記為 REVIEW 並附上原始行。

**驗收條件**

- `scripts/spec-gates/test_run.py` 涵蓋每道閘門的 PASS、REVIEW、FAIL 三種路徑,並各自包含一則由實跑得出的誤報案例(G3 的識別字、G5 的刻意移除)作為迴歸護欄。
- 以已封存的 `2026-07-28-terminal-opt-in-by-default` 為輸入執行時,G3 與 G4 為 PASS,G5 為 REVIEW 且指出刻意移除的那一筆。
- CI 中新增的 job 在既有四個 job 全綠的 PR 上不得產生 FAIL。
- `python scripts/spec-gates/run.py --help` 可用且說明三種模式。

**範圍邊界**

*In scope*:新增 `scripts/spec-gates/` 四個檔案、`quality-gates.yml` 新增一個 job、CONTRIBUTE.md 補上閘門與 archive 自檢的說明、新增 `spec-drift-gates` capability spec。

*Out of scope*:`prose-audit` 的任何檔案、`spectra` 本身、既有四個 CI job、任何自動修復行為、既有 change 的重新稽核。

## Risks / Trade-offs

- [閘門產生過多 REVIEW 而被忽略] → 只有 FAIL 阻斷;REVIEW 的輸出要求逐項可判定(檔案、行號、原文),而非只給數量。實跑時 31 個 G1 命中在數分鐘內判定完畢。
- [`claim_phrases` 需人工宣告,作者可能不填] → 為空時 G1 輸出明確的「未宣告任何短語」訊息而非靜默通過,使遺漏可見。
- [G7 依賴人在 archive 前記得執行 `--snapshot`] → 寫入 CONTRIBUTE.md 的 archive 步驟。這是本變更唯一無法由 CI 保證的閘門,已在 Decisions 中言明。
- [Python 版本與相依] → 沿用 `prose-audit` 的 3.12 與 pip 快取設定;本腳本只用標準函式庫加 PyYAML,`requirements.txt` 據此撰寫。

## Migration Plan

無資料遷移。合併後:

1. 新 job 在後續 PR 自動執行。既有 change 不追溯檢查。
2. 作者在需要 G1 時,於 `openspec/changes/<id>/gates.yaml` 宣告 `claim_phrases`。
3. archive 前執行 `--snapshot`、archive 後執行 `--verify-archive`,步驟寫入 CONTRIBUTE.md。
