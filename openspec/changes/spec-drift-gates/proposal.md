## Summary

新增一支機械式閘門腳本 `scripts/spec-gates/`,在 CI 檢查「本次變更是否讓語料中原本為真的敘述變成假的」,並將其掛入 `quality-gates.yml`。**本 change 已依三輪對抗式稽核與 RCA 決議縮編:七道閘門保留三道(G1、G2、G7),其餘四道(G3–G6)移除。**

## Motivation

`terminal-opt-in-by-default` 的根因分析(封存於 `openspec/changes/archive/2026-07-28-terminal-opt-in-by-default/`,tasks.md 群組 12)確認了一個現有閘門全部漏掉的缺陷類別:

**程式碼變更會讓未被改動的散文與 spec 變成假的,而所有既有閘門都只檢查「被改動的產物」。** 兩者的定義域恰好互補。

該次變更的原始碼 diff 是數十行,可能被它弄假的語料是 `docs/` 約 1,800 行加 `openspec/specs/` 約 11,500 行。三輪稽核、50 個 subagent 沒有查出的一筆缺陷,一支 grep 腳本在數秒內找到。RCA 也證實:在第一輪修復的當下執行一行 `git grep`,第二輪與第三輪的全部 blocking 就已同時出現在輸出裡。

同一個模式在此之前的 `docs-compliance-remediation` 已經發生過一次,共耗五輪。兩次都在同一個地方失效。

第二個獨立問題:`spectra archive` 在合併 delta 時會整塊替換 baseline requirement,連帶刪除該 requirement 的 `@trace` metadata。這在最近兩次 archive 各發生一次,各刪除三個區塊,兩次都是靠封存前的人工快照才還原。目前沒有任何自動檢查會發現這件事。

## 縮編決議(2026-08-02)

七道閘門的初版實作歷經三輪多 agent 對抗式稽核(blocking findings:R1 17 筆、R2 5 筆、R3 8 筆)未收斂,一次 multi-Opus RCA 判定根因是:**複審的 finding 產生器抽自一個「缺陷類別」常駐池——round 1 已經刻畫過這些類別但把它們歸在低一級(Medium advisory),之後每一輪把同一類別的下一個子句升級為 blocking,作者修掉那一個子句,類別本身留在池裡。** round 3 的 8 筆有 7 筆可追溯到 round 1 的祖先。該 RCA 開出的處方有兩半:因果的一半是九條協定變更(按類別而非實例計收斂、凍結審查器材、裁決層崩潰即視為該輪失敗、禁止斷言休止狀態等),scope 的一半是本節記載的縮編。

> **更正紀錄(2026-08-02,第二次 RCA)**:本節初版寫「RCA 判定根因是啟發式閘門的近似面無界」。查閱該次 RCA 的原始輸出後確認這是**誤引**——它明文把「啟發式表面」只當作 scope 論證而非因果論點(原文:「never a causal one: it fails its own falsifier」)。依據誤引的根因,團隊執行了 scope 的一半、跳過了因果的一半:九條協定變更**一條也沒有採用**。這正是本 change 要偵測的缺陷類別(引述某文件說 X、該文件沒說 X、沒人回頭查),而它就寫在本 change 自己的 proposal 裡。原始 findings 與兩次 RCA 的腳本保存於 `.spectra/analysis/spec-drift-gates-audit/`(不進版控)。

依「只留判定精確的閘門」原則縮編:

**保留(判定精確或僅供人工判讀)**

- **G1 claim-parity**:宣告短語的全庫窮舉。縮編後 `openspec/changes/<id>/gates.yaml` **必須存在**——不存在即 FAIL;存在但 `claim_phrases: []` 為刻意宣告,PASS。這把「遺漏」與「刻意不宣告」分開,消除靜默 fallback。
- **G2 invariance**:「X 不變」型宣稱的交叉檢查。縮編後**僅 REVIEW、永不 FAIL**——三輪稽核顯示其限定式判定是啟發式(R1 #2/#3/#8/#16),不足以支撐阻斷級判定,但清單本身對人工複核有價值。
- **G7 archive trace-parity**:改為 **diff-based** 並接進 CI 的預設檢查路徑——比對 base ref 與工作樹之間各 capability spec 的 requirement 與 `@trace`,逐 requirement 對齊,遺失任何一個 `@trace` `source:` 即回報。**僅 REVIEW、不 FAIL**:`@trace` 與 `source:` 在 `openspec/specs` 內沒有任何規範性定義,而三個候選判定身分對真實歷史各自給出不相交的命中集,阻斷級判定因此不可裁決——理由與重播證據見 design.md 決策八。原本的 snapshot/verify-archive 兩段式模式(從未在 CI 執行、且 snapshot 檔寫進工作區還會汙染後續判定)整組移除。

**移除(判定為無界啟發式或建構上不可證偽)**

- **G3 deleted-literal**:散文型字面值判定的五個子句每輪被抽掉一個(12 字元下限使 CJK 規則不可達、`;`/`=` 排除誤殺真訊息),三輪零真實命中。
- **G4 scope parity**:`impact_files` 對 86 份封存 proposal 中 62 份(72%)回傳空集合;delta 宣告的 regex 對封存語料 FAIL 82/83。若為阻斷級會擋掉本 repo 自己的多數歷史。
- **G5 delta scenario parity**:「刻意移除」豁免在三種寫法下都未通過稽核,`_records_removal` 對封存語料 8% 誤豁免、對否定句雙向誤判。
- **G6 added-lines trace**:回傳字面 `"REVIEW"`,整合斷言恆真,建構上不可證偽;且輸出無檔案行號,不可判讀。

## Proposed Solution

`scripts/spec-gates/run.py` 實作三道確定性檢查,沿用 `scripts/prose-audit/` 的既有形狀:`run.py` 加 `test_run.py` 加 `config.yaml`,CI 中為獨立 job。判定分 PASS、REVIEW、FAIL 三級——只有 FAIL 阻斷。FAIL 的來源只有一個:G1 的 gates.yaml 缺席(檔案或鍵是否存在,判定與被斷言的性質同一)。G2 與 G7 一律只到 REVIEW。

CI job 的 change id 改由 **PR 自身的 diff** 推導(`openspec/changes/` 下被觸及的目錄,排除 archive),PR 未觸及任何 change 目錄時跳過——取代原本「從工作樹找唯一目錄」的推導,後者會讓無關 PR 撞上別人 change 的判定。

## Non-Goals

- 不取代 `prose-audit`。兩者的定義域不同:prose-audit 檢查散文品質,spec-gates 檢查跨檔案的真值一致性。
- 不修改 `spectra archive` 本身。G7 是偵測而非修復;archive 的 `@trace` 行為屬上游工具問題,本變更只確保它不再靜默發生。
- 不自動修復任何 finding。閘門只回報,修法由人決定——RCA 已證實自動化的修復正是注入源。
- 不改變 `quality-gates.yml` 中**既有四個 job 的定義與行為**;本變更只新增與修改 `spec-gates` job 自身。
- 不保留任何以 regex 近似語意判斷的阻斷級閘門;被移除的 G3–G6 不以其他形式重新引入。

## Alternatives Considered

- **只寫進 CLAUDE.md 當作紀律要求**:上一次的補救就是這種形式(寫在 change 自己的 tasks.md 裡),結果連移轉都沒發生——`grep` 全 repo 只在該次封存的 tasks.md 內命中。人的紀律不會跨 change 存活,腳本會。
- **擴充 prose-audit 的 checks/**:它的介面是「單一檔案進、findings 出」,而本閘門的輸入本質上是「一份 diff 加上全庫語料」,塞不進該介面。
- **繼續修七道閘門**(RCA 選項 continue-fixing):三輪 blocking 曲線(17→5→8)與「R3 的 8 筆有 7 筆可追溯至 R1 祖先」顯示啟發式表面修不完,被否決。

## Impact

- Affected specs: spec-drift-gates(新增)
- Affected code:
  - New:
    - scripts/spec-gates/run.py
    - scripts/spec-gates/test_run.py
    - scripts/spec-gates/config.yaml
    - scripts/spec-gates/requirements.txt
    - openspec/changes/spec-drift-gates/gates.yaml
  - Modified:
    - .github/workflows/quality-gates.yml
    - CONTRIBUTE.md
