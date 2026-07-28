## 1. TDD:閘門判定邏輯的失敗測試

專案 `.spectra.yaml` 設定 `tdd: true`。本群組先建立測試骨架與紅燈,實作在群組 2。測試沿用 `scripts/prose-audit/test_run.py` 的既有形狀:與被測腳本同目錄、**獨立執行不需 pytest**、以 `python scripts/spec-gates/test_run.py` 呼叫,全通過退出碼 0、有失敗退出碼 1。

- [x] 1.1 建立 `scripts/spec-gates/test_run.py` 與最小的 `run.py` 骨架(僅 CLI 解析與空的閘門函式),使 `python scripts/spec-gates/test_run.py` 可執行並因斷言不符而回報 FAIL。完成判準:失敗來自斷言而非 ImportError 或 SyntaxError。驗證:執行該檔並檢視每則的 PASS／FAIL 標記。
- [x] 1.2 [P] 為 G3 撰寫三則測試:被刪除的散文字面值仍存活 → FAIL;被刪除後又在新增行重現 → PASS;被刪除的是識別字或 template 片段 → 不列入判定。第三則是實跑得出的誤報迴歸護欄。完成判準:三則皆先失敗。驗證:對照 design.md 契約中的散文型判定規則。
- [x] 1.3 [P] 為 G5 撰寫三則測試:delta 涵蓋 baseline 全部 scenario → PASS;有遺失且未記錄於 tasks → FAIL;有遺失但標題出現在 tasks → REVIEW。第三則是實跑得出的誤報迴歸護欄。完成判準:三則皆先失敗。驗證:以 fixture 目錄模擬 delta 與 baseline。
- [x] 1.4 [P] 為 G4 撰寫兩則測試:列舉與實際一致 → PASS;proposal 少列一份 delta spec → FAIL 且輸出點名該 spec。完成判準:兩則皆先失敗。驗證:斷言輸出含該 spec 名稱。
- [x] 1.5 [P] 為 G2 撰寫兩則測試:裸宣稱點名 diff 中的檔案 → FAIL;限定式宣稱點名同一檔案 → REVIEW。完成判準:兩則皆先失敗。驗證:以 design.md 契約定義的限定式判定為準。
- [x] 1.6 [P] 為 G1 撰寫三則測試:未宣告任何短語 → PASS 且輸出載明未宣告;命中全部帶條件 → PASS;有未涵蓋命中 → REVIEW 且逐項列出檔案與行號。完成判準:三則皆先失敗。驗證:斷言 G1 永不回傳 FAIL。
- [x] 1.7 [P] 為 G7 撰寫兩則測試:計數未減少 → PASS;`@trace` 數減少 → FAIL 且輸出含 capability 名稱與前後兩個數字。完成判準:兩則皆先失敗。驗證:以合成的快照 JSON 為輸入。
- [x] 1.8 為退出碼契約撰寫測試:任一閘門 FAIL → 退出碼 1;全為 PASS 或 REVIEW → 退出碼 0;change 目錄不存在 → 退出碼 2。完成判準:三則皆先失敗。驗證:以 subprocess 呼叫腳本並檢查回傳碼。

## 2. 實作閘門腳本

- [x] 2.1 實作 `scripts/spec-gates/run.py` 的 CLI 與四種模式(預設檢查、`--snapshot`、`--verify-archive`、`--resolve-change`),含 `--help` 與 `--json`。完成判準:1.1 與 1.8 轉綠。驗證:執行四種模式各一次。
- [x] 2.2 實作 G1 至 G6 六道閘門,依 design.md 的 Implementation Contract 逐條對應。完成判準:1.2 至 1.6 全部轉綠。驗證:執行 `python scripts/spec-gates/test_run.py`(本群組第 3 行已載明不需 pytest)。
- [x] 2.3 實作 G7 的快照與比對兩段模式。完成判準:1.7 轉綠。驗證:同上。
- [x] 2.4 撰寫 `scripts/spec-gates/config.yaml` 與 `requirements.txt`。config 提供 `claim_phrases` 與 `hedge_markers` 兩鍵的預設值(前者為空、後者含中英常見措辭);requirements 只列 PyYAML。完成判準:腳本在 `openspec/changes/<id>/gates.yaml` 存在時優先讀取它。驗證:以兩種情境各執行一次。

## 3. 以已封存的真實 change 驗收

- [x] 3.1 以 `2026-07-28-terminal-opt-in-by-default` 為輸入執行閘門,比對結果與該次手動實跑的記錄(封存 tasks.md 的 12.3 與 13.x)。完成判準:G3 與 G4 為 PASS,G5 為 REVIEW 且點名 `Default all tabs enabled`。驗證:逐閘門對照封存記錄中的判定。
- [x] 3.2 以 `docs-compliance-remediation`(純文件型)為輸入執行,確認腳本在不同形狀的 change 上的行為。完成判準:每一筆 FAIL 都須舉證為真陽性;凡屬閘門解析缺陷者一律修正並補上迴歸測試,**不得為了讓判準通過而放寬閘門**。驗證:逐筆列出 FAIL 的判定依據。

## 4. CI 整合

- [x] 4.1 於 `.github/workflows/quality-gates.yml` 新增 `spec-gates` job,沿用 `prose-audit` 的既有形狀:`pull_request` 限定、`fetch-depth: 0`、Python 3.12、pip 快取指向本腳本的 requirements。完成判準:job 定義與 prose-audit 的結構一致。驗證:並排比對兩個 job 的 steps。
- [x] 4.2 確認 change id 的推導不引入 CWE-78 script injection。`prose-audit` 的 changed-file 清單經 `env:` 傳入而非 `${{ }}`,並在註解說明原因;本 job 若需要任何來自 PR 的字串,必須採同一手法。完成判準:`run:` 區塊中無任何 `${{ }}` 直接插值於 shell 字串。驗證:逐行檢視新 job 的 `run:` 內容。
- [x] 4.3 驗證新 job 不改變既有四個 job 的行為。完成判準:`git diff` 在 quality-gates.yml 中僅為新增區塊。驗證:檢視該檔完整 diff。

## 5. 文件

- [x] 5.1 於 `CONTRIBUTE.md` 新增閘門說明:七道閘門各自檢查什麼、三級判定的意義、如何在本機執行、以及 `gates.yaml` 的 `claim_phrases` 該怎麼填。完成判準:讀者不需讀原始碼即可使用。驗證:對照 design.md 的契約逐項核對。
- [x] 5.2 於 `CONTRIBUTE.md` 的 archive 步驟補上 G7 的兩段式自檢(archive 前 `--snapshot`、archive 後 `--verify-archive`),並說明為何 CI 無法涵蓋這一段。完成判準:步驟可照著執行。驗證:實際照文件跑一次。

## 6. 全面複驗

- [x] 6.1 執行 `python scripts/spec-gates/test_run.py`。完成判準:退出碼 0 且無 FAIL 行。驗證:記錄通過數與失敗數。
- [x] 6.2 執行 `pnpm test --run` 確認未影響既有測試。完成判準:全數通過。驗證:記錄通過數。
- [x] 6.3 對本次變更自身執行閘門(dogfooding)。完成判準:零 FAIL;任何 REVIEW 逐項判定並記錄。驗證:輸出逐項判定表。
- [x] 6.4 對更動的 Markdown 檔執行 repo prose gate。完成判準:0 blocking。驗證:逐檔執行。
- [x] 6.5 執行 `spectra validate` 與 `spectra analyze`。完成判準:valid 且無 Critical 或 Warning。驗證:記錄 findings 層級。

## 7. Requirement 逐條驗收

逐條核對三條 requirement 是否被實作、測試與文件滿足。每一項須指出具體的程式碼或測試,不得以「應該有做到」帶過。

- [x] 7.1 驗收 requirement「Mechanical spec-drift gates run on every pull request」:三個 Scenario(無 drift 通過、存活的已刪除字面值阻斷、REVIEW 不阻斷)各指出對應測試;並確認腳本不修改 repo 中任何檔案。完成判準:三個 Scenario 皆有具名測試,且以 `git status` 確認執行前後工作區無變化。驗證:Scenario 與測試名稱對照表。
- [x] 7.2 驗收 requirement「Gates cover claim parity, scope parity, and delta completeness」:七道閘門的定義與四個 Scenario(識別字不誤判、刻意移除降為 REVIEW、範圍列舉漂移 FAIL、未宣告短語需可見)各指出對應實作行與測試。完成判準:G1 與 G6 永不 FAIL 一事有測試斷言。驗證:逐閘門對照 design.md 的 FAIL 條件表。
- [x] 7.3 驗收 requirement「Archive metadata loss is detected」:兩個 Scenario 各指出對應測試,並確認 CONTRIBUTE.md 確實記載兩段式步驟。完成判準:文件步驟可照著執行且與 CLI 實際介面一致。驗證:照文件對一個既有 capability 實跑 snapshot 與 verify。
