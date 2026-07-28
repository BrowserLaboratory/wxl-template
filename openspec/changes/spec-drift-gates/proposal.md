## Summary

新增一支機械式閘門腳本 `scripts/spec-gates/`,在 CI 檢查「本次變更是否讓語料中原本為真的敘述變成假的」,並將其掛入 `quality-gates.yml`。

## Motivation

`terminal-opt-in-by-default` 的根因分析(封存於 `openspec/changes/archive/2026-07-28-terminal-opt-in-by-default/`,tasks.md 群組 12)確認了一個現有閘門全部漏掉的缺陷類別:

**程式碼變更會讓未被改動的散文與 spec 變成假的,而所有既有閘門都只檢查「被改動的產物」。** 兩者的定義域恰好互補。

該次變更的原始碼 diff 是數十行,可能被它弄假的語料是 `docs/` 約 1,800 行加 `openspec/specs/` 約 11,500 行。三輪稽核、50 個 subagent 沒有查出的一筆缺陷,一支 grep 腳本在數秒內找到。RCA 也證實:在第一輪修復的當下執行一行 `git grep`,第二輪與第三輪的全部 blocking 就已同時出現在輸出裡。

同一個模式在此之前的 `docs-compliance-remediation` 已經發生過一次,共耗五輪。兩次都在同一個地方失效。

第二個獨立問題:`spectra archive` 在合併 delta 時會整塊替換 baseline requirement,連帶刪除該 requirement 的 `@trace` metadata。這在最近兩次 archive 各發生一次,各刪除三個區塊,兩次都是靠封存前的人工快照才還原。目前沒有任何自動檢查會發現這件事。

## Proposed Solution

新增 `scripts/spec-gates/run.py`,實作七道確定性檢查。前六道的原型已在 `terminal-opt-in-by-default` 期間手動執行過並實證有效(見該 change 的 tasks.md 12.3 與 13.x);第七道針對上述的 archive metadata 遺失。

- **G1 claim-parity**:對變更改動了真值條件的名詞短語,掃描其在全庫的每一處出現位置,要求每一處或本身帶條件語氣、或落在已聲明前提的段落內、或被明確記錄為不受影響。
- **G2 invariance**:交叉檢查 change artifact 中「X 不變」型的宣稱,若 X 出現在實際 diff 中則標記。檔案參照以完整路徑或路徑邊界後綴解析,同名檔不互相牽連;限定式(參照之後有粗體標記)與裸宣稱分開處理。
- **G3 deleted-literal**:diff 移除且未在新增行重現的散文型字串字面值,必須在全庫零命中。
- **G4 scope parity**:proposal 的 Impact 檔案清單必須與 `git diff --name-only` 一致;若 proposal 寫了 delta spec 宣告,該宣告必須與磁碟上的 specs 目錄一致。宣告不存在時只報 REVIEW——沒作出的斷言無從被推翻。
- **G5 delta scenario parity**:每個 MODIFIED requirement 的 delta scenario 集合必須涵蓋 baseline 的集合,除非該移除已在 tasks.md 明確記錄。
- **G6 added-lines trace**:列出新增散文中的機制性斷言,供人工逐句對照原始碼出處。
- **G7 archive trace-parity**:比對 archive 前後各 baseline spec 的 `@trace` 區塊數量,任何減少即失敗。

腳本沿用 `scripts/prose-audit/` 的既有形狀:`run.py` 加 `test_run.py` 加 `config.yaml`,CI 中為獨立 job。閘門的判定分為 PASS、REVIEW、FAIL 三級——只有 FAIL 阻斷,REVIEW 表示需人工判定但不擋。

## Non-Goals

- 不取代 `prose-audit`。兩者的定義域不同:prose-audit 檢查散文品質,spec-gates 檢查跨檔案的真值一致性。
- 不修改 `spectra archive` 本身。G7 是偵測而非修復;archive 的 `@trace` 行為屬上游工具問題,本變更只確保它不再靜默發生。
- 不自動修復任何 finding。閘門只回報,修法由人決定——RCA 已證實自動化的修復正是注入源。
- 不改變 `quality-gates.yml` 中**既有四個 job 的定義與行為**;本變更只在該檔末尾新增一個 job。

## Alternatives Considered

- **只寫進 CLAUDE.md 當作紀律要求**:上一次的補救就是這種形式(寫在 change 自己的 tasks.md 裡),結果連移轉都沒發生——`grep` 全 repo 只在該次封存的 tasks.md 內命中。人的紀律不會跨 change 存活,腳本會。
- **擴充 prose-audit 的 checks/**:它的介面是「單一檔案進、findings 出」,而本閘門的輸入本質上是「一份 diff 加上全庫語料」,塞不進該介面。

## Impact

- Affected specs: spec-drift-gates(新增)
- Affected code:
  - New:
    - scripts/spec-gates/run.py
    - scripts/spec-gates/test_run.py
    - scripts/spec-gates/config.yaml
    - scripts/spec-gates/requirements.txt
  - Modified:
    - .github/workflows/quality-gates.yml
    - CONTRIBUTE.md
