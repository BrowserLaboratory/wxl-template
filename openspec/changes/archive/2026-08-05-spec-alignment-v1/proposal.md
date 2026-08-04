## Summary

把 live spec corpus 中「陳述為真但實際為假」的句子,校正到與已被使用者接受的 v1 行為一致。

## Motivation

`openspec/specs/` 是系統當前行為的 source of truth。目前它有 43 處陳述已被證偽——程式碼刻意改過、CI 設定調整過、閘門縮編過,而這些散文沒有跟著改。

三個具體後果:

- **貢獻者照 spec 寫會拿到 crash。** `challenge-list` 承諾任何 markdown 頁面放上裸的 challenge 清單元件就會渲染全部題目;實際該元件有必填 prop,裸用會在 `props.challenges.map()` 拋 TypeError。
- **照 spec 實作會刪光所有 flag payload。** `wasm-challenge-payload` 寫「注入 custom section 之後才 strip」,而 strip 會移除 `chall-data`。已實測:注入後跑 strip,section 消失、檔案大小回到注入前。
- **同一個 spec 內互相矛盾。** `spec-drift-gates` 有兩處要求 G7 回報 FAIL、一處要求它永不 FAIL,實作站在後者,因此其中一條 Scenario 是沒有任何測試會失敗的死規範。

另有 15 個 spec 違反 `spec-corpus-governance` 的 Purpose SHALL:10 個帶 archive 產生的 placeholder,5 個完全沒有 Purpose 段落。

這些是本 repo 的機械閘門結構上偵測不到的類別——G1 只掃該 change 宣告的名詞短語、G2 只讀該 change 自己的 proposal 與 design、G7 只比對 trace metadata。沒有一道會發現一句既有的 SHALL 已經變成假的。

## Proposed Solution

逐句校正,每一句都先裁決「spec 錯還是程式碼錯」,再決定改哪一邊。43 筆全部裁決為 spec 錯或其連帶。

- **challenge-list**:清單頁的 layout 宣告、元件的 prop 契約、card 與 row 兩種 view 的實際樣式、type-only 匯入的允許範圍。
- **wasm-challenge-payload**:建置管線的三階段順序改為先 strip 後注入,並寫明理由,避免下一個人再改回來。
- **spec-drift-gates**:所有 FAIL 語句對齊「G7 永不 FAIL」;修正候選判定身分的數量陳述;把一句全稱句收窄到它實際成立的範圍。
- **contributor-guide**:必要狀態檢查的敘述改為不列名的寫法,使新增 job 不會讓它再次腐化。
- **Purpose**:15 個 spec 各補一段能讓人判斷「我要找的東西在不在這裡」的敘述。
- **連帶產物**:貢獻指南、fork skill 文件、以及四處會因為 spec 改寫而變成矛盾的程式碼註解。
- **唯一的行為變更**:spec-gates 腳本的 change id 驗證排序。spec 與貢獻指南都保證「在讀檔案系統之前拒絕」,實作卻先對串接後的路徑做目錄判斷。這一處裁決為程式碼錯,因此改程式碼而非改 spec。

## Non-Goals

- **不修改任何已封存的 change。** 已封存目錄是歷史紀錄。改動它會湮滅「G7 的 FAIL 層是被刻意移除的」這條追溯線索,也會讓現行 spec 引用的兩份重播清單失去出處。
- **不修 keygen 的 skip 分支失效。** 準備 template 的函式每次執行都重寫 `.vitepress/wasm/template.wasm`,而該檔是 staleness 判定的輸入之一,實測連跑兩次都判定為 stale,skip 分支永遠不會觸發。這是程式碼缺陷而非 spec 錯誤——spec 描述的增量行為是刻意設計的,把現況寫進 spec 就是把 bug 寫成規範。
- **不修 spec 檔的結構缺陷**(缺一級標題、中段孤兒標題、殘留 HTML 註解)。沒有任何 SHALL 涵蓋它們,且校正內容與重組結構同時做,會讓驗收分不清「一條 requirement 消失」是被修正還是被搬走。
- **不新增擋 placeholder 的機械檢查。** 那是新增規範表面而非校正假陳述,另開後續 change 處理,並需先替 `spec-corpus-governance` 補一條說明該檢查存在的 scenario。
- **不對齊 trace metadata 區塊本身。** 它們是過去式的 provenance 紀錄,不是現在式斷言。
- **不動 `spec-drift-gates` 中「60 archive commits」這個數字。** 本 repo 查不到對應計數,但也無法證偽當初的語料口徑;無證據不得改成別的數字。

## Alternatives Considered

- **對齊到程式碼現況(全部照實作改 spec)。** 拒絕:其中兩處程式碼本身有缺陷,照做會把 bug 寫成規範。因此改為逐句裁決。
- **一次掃完 50 個 spec。** 拒絕:OpenSpec 官方 FAQ 明確反對整批生成 spec,且大範圍改寫會製造大量「看起來合理但無證據」的修訂。本 change 由已查得的不一致驅動,不由清單驅動。
- **順手把結構缺陷與 placeholder 護欄一起做。** 拒絕:見 Non-Goals。混合校正與新增規範表面會讓收斂目標不斷後退。

## Impact

- Affected specs: challenge-list, wasm-challenge-payload, spec-drift-gates, contributor-guide, ci-quality-gates, spec-corpus-governance(僅 Purpose 補寫,不改其 requirement)
- Affected code:
  - Modified:
    - openspec/specs/challenge-list/spec.md
    - openspec/specs/wasm-challenge-payload/spec.md
    - openspec/specs/spec-drift-gates/spec.md
    - openspec/specs/contributor-guide/spec.md
    - openspec/specs/ci-quality-gates/spec.md
    - openspec/specs/fork-init-script/spec.md
    - openspec/specs/site-smoke-tests/spec.md
    - openspec/specs/skill-agent-usability/spec.md
    - openspec/specs/prose-audit-outward-docs/spec.md
    - openspec/specs/wxl-crosscheck-skill/spec.md
    - openspec/specs/wxl-blind-solve-verification/spec.md
    - openspec/specs/wxl-create-skill/spec.md
    - openspec/specs/wxl-verify-skill/spec.md
    - openspec/specs/wxl-mutate-skill/spec.md
    - openspec/specs/challenge-framework/spec.md
    - openspec/specs/challenge-runtime-init/spec.md
    - openspec/specs/encrypted-virtual-fs/spec.md
    - openspec/specs/wasm-source-loading/spec.md
    - CONTRIBUTE.md
    - .agent/skills/wxl-fork-init/SKILL.md
    - .vitepress/theme/index.ts
    - scripts/spec-gates/run.py
    - scripts/spec-gates/test_run.py
  - New: (none)
  - Removed: (none)
