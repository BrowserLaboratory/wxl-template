## 1. 在 SKILL.md 新增 grilling 驅動的 Step 0（canonical 英文）

- [x] 1.1 在 `.agent/skills/wxl-create/SKILL.md` 新增 `### Step 0` 段落，實作 spec requirement「Skill grills the user to converge challenge design before parameter collection」，依「以前置 Step 0 收斂設計，Step 1 維持機械參數收集」的分工，明訂 Step 0 在參數收集（Step 1）之前執行且不動任何檔案。驗證：段落存在且對照 spec 的 "Step 0 precedes parameter collection" 與 "Design not confirmed blocks downstream steps" scenarios 人工審閱通過。
- [x] 1.2 在 Step 0 段落依「內嵌 grilling 技法為 prose，而非 dispatch grilling skill」寫法描述技法，且不指示呼叫獨立的 grilling skill。驗證：對照 "Grilling is inlined, not dispatched" scenario——prose 含 grilling 技法描述、無任何 skill dispatch／invoke 指示。
- [x] 1.3 在 Step 0 段落納入「Step 0 一次一題、可查事實自己查、達成共識前不動任何檔案」紀律：一次一題、每題附建議答案、可查的事實自己查、達成共識前不動檔案。驗證：對照 "One question at a time with a recommended answer" 與 "Facts are looked up, decisions are asked" scenarios 逐項確認。
- [x] 1.4 在 Step 0 段落納入「Step 0 訪談深入題目設計維度」：漏洞真實性與非顯而易見性、預期攻擊路徑、難度校準、誤導／紅鯡、flag 位置合理性。驗證：對照 "Step 0 grills design dimensions beyond the parameter fields" scenario，五個維度皆列出。
- [x] 1.5 在 Step 0 段落納入「Step 0 結論回饋 Step 1 的既有跳過邏輯」與「Step 0 允許在設計已清楚時快速通過」：Step 0 定案的 slug／backend／vuln／description／difficulty 視為已提供、Step 1 只補問未定案欄位；設計已清楚時允許摘要＋單次確認即通過。驗證：對照 "Step 0 conclusions feed parameter collection without re-asking" 與 "Design already clear in the initial prompt" scenarios。
- [x] 1.6 更新 SKILL.md 的 `## Workflow` dot 圖，新增 `grill` 節點並使其指向既有 `collect` 節點。驗證：圖中含 `grill -> collect`（或等義的 Step 0 → 參數收集邊）。

## 2. 同步 SKILL.zhTW.md 鏡像

- [x] 2.1 在 `.agent/skills/wxl-create/SKILL.zhTW.md` 新增對應的中文 Step 0 段落，內容與 SKILL.md 的 Step 0 一致（涵蓋技法、一次一題紀律、五個設計維度、回饋 Step 1 與 fast-pass）。驗證：對照 "Localized mirror includes Step 0" scenario，兩份檔案皆含 Step 0 設計收斂段落且語意對應。
- [x] 2.2 更新 SKILL.zhTW.md 的 workflow 圖，同步新增 Step 0 節點並置於參數收集節點之前。驗證：中文版圖含 Step 0 節點先於 collect，且與 SKILL.md 圖結構一致。

## 3. AGENTS.md 記錄 grilling 關係

- [x] 3.1 [P] 在 `.agent/skills/wxl-create/AGENTS.md` 的關係表新增一列，載明「內嵌 grilling 技法為 prose，而非 dispatch grilling skill」——grilling 為內嵌技法（prose），非被 dispatch 的 skill；並在 workflow 描述句納入 Step 0。驗證：關係表含該列且 workflow 描述提及 Step 0，人工審閱通過。

## 4. 中立性與一致性驗證

- [x] 4.1 執行 host-agent-neutral grep 確認新 Step 0 prose 未引入禁字：`git grep -nE '<FORBIDDEN-PATTERN>' .agent/skills/wxl-create/`（`<FORBIDDEN-PATTERN>` 取自 `.agent/skills/wxl-create/reference/agent-tools.md`）。驗證：命令 exit code 1（無命中），對照 "Step 0 prose stays host-agent-neutral" scenario。
- [x] 4.2 執行 `spectra validate wxl-create-grilling-intake`。驗證：命令回報 change valid，無 error。
