## 1. Requirement 校正(由 delta spec 承載,archive 時落地)

每一項的驗收都對「delta 內的新文字」執行,因為 requirement 要到 archive 才會併入 live spec。

- [x] 1.1 `Challenge list page uses a globally registered Vue component embedded in markdown` —— 改為宣告 `layout: page`(default theme 的 page layout)、以 `challenges` prop 傳入資料集、並明寫裸元件不是支援用法。驗收:delta 內該 requirement 含 `layout: page` 與 `SHALL NOT be a supported usage`,且不含 `VitePress default layout`
- [x] 1.2 `Challenge data loader is locale-aware via per-locale data files sharing one ChallengeData type` —— 資料匯入禁令改為只禁 value 匯入、明確允許 type-only 匯入。驗收:delta 內該 requirement 含 `type-only` 與 `erased`,且其 scenario 不再無條件禁止所有 `.data.ts` 匯入
- [x] 1.3 `Challenge frontmatter values are localized per content tree` —— 移除與 card/row 實況不符的殘留描述。驗收:人工複讀該 requirement 全文,確認不再宣稱每題渲染為 card,並把複讀結果記入本檔
- [x] 1.4 `Challenge list displays each challenge as a card with metadata and a link` 移除,由 `Challenge list renders each challenge as a list row by default and as a card in grid view` 取代 —— 舊標題斷言每題渲染為 card,但預設 view 是 list。驗收:delta 含 `## REMOVED Requirements` 與 `## ADDED Requirements` 兩段,REMOVED 同時有 Reason 與 Migration 且兩者不互相否定
- [x] 1.5 `Post-build obfuscation pipeline strips symbols and applies mutations` —— 三階段順序改為 strip 先於注入,並寫明理由。驗收:delta 內該 requirement 含 strip 不得在注入後執行的禁令;且不含任何列舉 strip 豁免 section 名稱的句子(該列舉已連錯兩版,只留「chall-data 不在豁免內」這個載重事實)
- [x] 1.6 `Mechanical spec-drift gates run on every pull request` —— 對齊 G7 永不 FAIL,並收窄關於封存如何被 git 記錄的全稱句。驗收:delta 內該 requirement 不含要求 G7 回報 FAIL 的句子
- [x] 1.7 `Gates cover claim parity, invariance claims, and archive trace parity` —— FAIL 來源只留宣告檔缺席;G1 的全庫窮舉句收窄為排除封存目錄;修正候選判定身分的數量。驗收:delta 內該 requirement 提及封存目錄為 G1 搜尋範圍的排除項,且不含 `Three candidate identities`
- [x] 1.8 `CONTRIBUTE documents maintainer setup for branch protection ruleset` —— 必要檢查敘述改為不列名,且一致性規則只約束「描述完整集合」的列舉。驗收:delta 內該 requirement 不含硬編的三個 context 名字清單作為規範內容
- [x] 1.9 Requirement: The workflow SHALL define two parallel jobs named `test` and `build` —— 內文刪除「exactly two top-level jobs」。標題逐字保留,因為工具在標題以反引號結尾時無法改名(見 7.1)。驗收:delta 內該 requirement 不含 `exactly two`
- [x] 1.10 delta 整體體檢。驗收:對 `openspec/changes/spec-alignment-v1/specs/` 遞迴搜尋禁用詞零命中;搜尋 Purpose 標題與 trace 註解零命中;`spectra validate spec-alignment-v1` 回報 valid

## 2. Purpose 補寫(直接編輯 live spec,Purpose 非 requirement 不進 delta)

- [x] 2.1 [P] 替 10 個帶封存 placeholder 的 spec 各寫一段具體 Purpose:fork-init-script、site-smoke-tests、skill-agent-usability、prose-audit-outward-docs、spec-drift-gates、wxl-crosscheck-skill、wxl-blind-solve-verification、wxl-create-skill、wxl-verify-skill、wxl-mutate-skill。每段須讀完該 spec 全部 requirement 後撰寫,能讓人判斷「我要找的東西在不在這裡」,不抄 requirement 標題。驗收:對 `openspec/specs/` 遞迴搜尋封存 placeholder 字串零命中
- [x] 2.2 [P] 替 5 個完全缺 Purpose 段的 spec 補寫:challenge-framework、challenge-runtime-init、encrypted-virtual-fs、wasm-challenge-payload、wasm-source-loading。驗收:對每個 `openspec/specs/<cap>/spec.md` 檢查皆含 Purpose 標題,無一遺漏
- [x] 2.3 修正 challenge-list 的 Purpose——現行寫在 VitePress default layout 內,與 1.1 的修法矛盾。驗收:該檔搜尋 `VitePress default layout` 零命中

## 3. 貢獻指南與 skill 文件的連帶校正

- [x] 3.1 CONTRIBUTE.md 兩處仍寫必要檢查只有 test 與 build,改為不列名的寫法。驗收:文件敘述與 GitHub ruleset 查詢指令回傳的必要檢查集合不衝突,且不再硬編兩個名字
- [x] 3.2 CONTRIBUTE.md 的 G7 敘述與 1.6 及 1.7 的修法一致。驗收:該檔內每一處提及 G7 的敘述都與「G7 永不 FAIL」相符
- [x] 3.3 fork-init skill 文件把 binaryen 從建置必要條件降為選用。驗收:該檔內 binaryen 的敘述不再宣稱它是建置的必要條件
- [x] 3.4 CONTRIBUTE.md 的 G1 排除項由一項改為兩項。驗收:該行同時點名 `openspec/changes/archive/` 與該 change 自己的 `tasks.md`,且與 `scripts/spec-gates/run.py` 的 `EXCLUDE_ARCHIVE` 常數與 tasks.md skip 兩處相符
- [x] 3.5 CONTRIBUTE.md 與兩處程式碼註解把「archive PR 的目錄搬移被 git 記錄為 rename」寫成無條件句,改為涵蓋兩種記錄方式。驗收:逐一分類本 repo 所有碰過 `openspec/changes/archive/` 的 commit,rename 與純新增兩種都存在(實測 33 個 commit:17 rename、14 純新增、1 混合、1 僅修改),且該敘述所依賴的結論(這些 commit 都不會讓 live change id 出現在 `--name-only`)仍成立
- [x] 3.6 CONTRIBUTE.md 的 G7 段落有一處代名詞無先行詞(「this capability」)。驗收:該句明確點名 `spec-drift-gates`

## 4. 程式碼註解與 docstring 的假陳述

- [x] 4.1 [P] `.vitepress/theme/index.ts` 中元件註冊處的註解指向不存在的路徑,且描述的裸元件用法會拋例外。驗收:該檔搜尋 `docs/challenges/index.md` 零命中
- [x] 4.2 [P] `scripts/spec-gates/run.py` 的三處假 docstring:模組開頭宣稱 G7 會 FAIL、trace 比對處的 FAIL 形狀說明、以及宣稱另一份 spec 規範了 trace 格式(該檔只有實例)。驗收:該檔內所有提及 G7 與 FAIL 的敘述皆與「G7 永不 FAIL」相符
- [x] 4.3 [P] `scripts/spec-gates/test_run.py` 開頭 docstring 的三處錯誤,以及誤導的輔助函式名。驗收:該檔搜尋 `_g7_fail` 零命中;執行該測試檔退出碼 0

## 5. change id 驗證排序(唯一的行為變更,TDD)

- [x] 5.1 先寫失敗測試:在 `scripts/spec-gates/test_run.py` 新增一則斷言,傳入帶路徑穿越的 change id 時輸出訊息來自 id 驗證而非目錄查找,退出碼為 2。驗收:此時執行該測試檔,新測試為紅
- [x] 5.2 把 change id 白名單驗證抽成獨立函式,在任何檔案系統存取之前呼叫。驗收:以帶路徑穿越的 id 執行 `scripts/spec-gates/run.py`,輸出不含目錄查找訊息、退出碼 2;5.1 的測試轉綠
- [x] 5.3 反向變異:暫時把驗證呼叫移回目錄判斷之後,5.1 的測試必須變紅;還原後轉綠。驗收:兩次執行結果如上述,並記錄輸出

## 6. 全套驗證

- [x] 6.1 執行 `scripts/spec-gates/test_run.py` 退出碼 0,測試數不少於 173
- [x] 6.2 `pnpm test --run` 全數通過,測試數不少於 885
- [x] 6.3 `spectra analyze spec-alignment-v1 --json` 的 Critical 與 Warning 皆為 0
- [x] 6.4 對本 change 執行 spec-gates 腳本並以 origin/main 為 base,逐項記錄判定並確認無 FAIL
- [x] 6.5 確認未觸及封存目錄。驗收:對 `openspec/changes/archive/` 查詢工作區狀態為零輸出

### 1.3 的人工複讀紀錄

複讀 delta 內 `Challenge frontmatter values are localized per content tree` 全文:該 requirement 只規範跨語系 frontmatter 的欄位對等(技術欄位逐位元相同、僅 title/description 與正文因語言而異),**全文 `card` 零出現**,不再宣稱每題渲染為 card。複驗指令:對該 requirement 區塊搜尋 `card`,零命中。

### 5.3 的反向變異輸出紀錄

| 階段 | 結果 |
|---|---|
| 5.1 加入 4 則測試後(尚未修) | **175/177**,失敗兩則:`CLI: a traversing change id is refused by the id rule, not by a directory lookup`、`CLI: the refusal names the id rule that rejected it` |
| 5.2 抽出 `validate_change_id` 並在 `is_dir()` 前呼叫 | **177/177** |
| 5.3 變異(把呼叫移回 `is_dir()` 之後) | **175/177**,失敗的是同樣那兩則 |
| 還原 | **177/177** |

實測輸出:`python3 scripts/spec-gates/run.py '../../etc'` 修法前印 `error: no change directory at openspec/changes/../../etc`,修法後印 `error: invalid change id '../../etc': must be a bare directory name under openspec/changes/ (no separator, and not '.' or '..')`,兩者退出碼皆為 2。

### 6.3 的殘留(如實記錄,未達成嚴格為零)

`spectra analyze` 剩 1 筆 Warning:`Requirement 'Challenge list displays each challenge as a card with metadata and a link' has no scenarios`。

該 requirement 位於 `## REMOVED Requirements` 區塊 —— **REMOVED 依設計帶 Reason 與 Migration,不帶 scenario**。analyzer 對 REMOVED 套用了與 MODIFIED/ADDED 相同的規則,屬工具誤報。

已嘗試的兩次 analyze-fix 迭代把 Critical+Warning 從 11 降到 1;第 11 筆無法在不刪掉 REMOVED 區塊的前提下消除,而刪掉它會使 1.4 不成立。**驗收條件「皆為 0」未嚴格達成**,以此註記代替。

### 6.4 的 G1 逐筆裁決(19 筆 REVIEW,FAIL=0,exit 0)

**A 類 —— 正是本 change 要校正的句子,delta 已寫好、archive 時落地(4 筆):**

| 位置 | 短語 |
|---|---|
| `openspec/specs/challenge-list/spec.md:38` | VitePress default layout |
| `openspec/specs/ci-quality-gates/spec.md:52` | exactly two |
| `openspec/specs/contributor-guide/spec.md:125` | required status checks 只列 test 與 build |
| `openspec/specs/contributor-guide/spec.md:134` | 同上 |

這四筆在 live spec 上仍為舊文,因為 requirement 校正由 delta 承載、要到 archive 才併入。**archive 後應消失** —— 若未消失,代表 delta 沒有正確落地,那才是缺陷。

**B 類 —— 同字不同義,句子為真,不動(15 筆):**

| 位置 | 為何為真 |
|---|---|
| `challenge-design-tokens/spec.md:11` | 指 VitePress default layout 的 CSS 變數橋接,不是頁面 layout |
| `platform-documentation/spec.md:13` | Getting Started 頁確實用 default layout |
| `i18n-runtime/spec.md:163` | 「exactly two entries」指 locales 物件的兩個項目 |
| `wxl-blind-solve-verification/spec.md:11`、`:18` | 「exactly two files」指 player package 的兩個檔 |
| `ci-quality-gates/spec.md:303`、`:310`、`:315`、`:323`、`:334`、`:373` | 皆已列三個 context 或談 bypass/strict 政策,與檢查數量無關 |
| `contributor-guide/spec.md:146` | 「preserve the existing required status checks」不列名,為真 |
| `CONTRIBUTE.md:383`、`:447`、`:515` | 分別已列三個、談 bypass、以及本 change 剛改成不列名的版本 |

**結論:零筆需要在本 change 內額外修改。** A 類由 delta 處理,B 類為真。

## 7. 已知工具缺陷的記錄(不修,只留證據)

> **本 change 刻意退役兩筆 `@trace` provenance(archive 時發生,已預先裁決)。**
> 兩個 MODIFIED requirement 的 delta 不帶 `@trace` 區塊(全 repo 198 份封存 delta 中只有 8 份帶),
> 所以 archive 後這兩條的 source 集合會變空,G7 會以 **REVIEW** 回報 —— 那是預期行為,不是缺陷:
>
> | capability | requirement | 退役的 source |
> |---|---|---|
> | `challenge-list` | Challenge list page uses a globally registered Vue component embedded in markdown | `vitepress-structure-refactor` |
> | `wasm-challenge-payload` | Post-build obfuscation pipeline strips symbols and applies mutations | `harden-wasm-challenge-payload-pipeline` |
>
> 兩塊都是自動產生且部分已腐化 —— challenge-list 那塊列的 `docs/challenges/index.md`、
> `.vitepress/theme/layouts/ChallengeListLayout.vue`、`.vitepress/sw/router.ts` 皆已不存在;
> wasm 那塊把十個 `.agent/skills/spectra-*/SKILL.md` 列為 WASM 混淆 requirement 的 code。
> **在隔離 scratch repo 實跑 archive 驗證過:requirement 與 scenario 數量皆不變
> (12→12、14→14、6→6、2→2、6→6),唯一消失的 requirement 是刻意的 `## REMOVED` 那條。**

- [x] 7.1 把本輪實測發現的 spectra 缺陷寫入 `.spectra/future/`:當 live spec 的 requirement 標題以反引號結尾時,`## REMOVED Requirements` 的比對永遠不成立(archive 回報移除數為 0,舊條原封留下);`## RENAMED Requirements` 則 validate 通過但 archive 以退出碼 1 失敗。驗收:該檔存在,且含二分法定位結果與可重現步驟
- [x] 7.2 把 keygen 的 skip 分支失效寫入 `.spectra/future/`(本 change 的 Non-Goal)。驗收:該檔存在,且說明為何不得對齊到現行實作
