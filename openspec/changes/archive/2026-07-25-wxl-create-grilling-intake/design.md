## Context

`wxl-create` 是 host-agent-neutral 的出題 skill，canonical prose 在 `.agent/skills/wxl-create/SKILL.md`，並有台灣繁中鏡像 `SKILL.zhTW.md` 與 host 相容性說明 `AGENTS.md`。現行 workflow 為 Step 1（參數收集）→ Step 2 scaffold → Step 3 生成漏洞碼 → Step 4 frontmatter → Step 5 exploit spec → Step 6 self-test → Step 7 交棒 `wxl-verify`。

現行 Step 1 用 round-based 純文字問題塊，只收 slug／backend／vuln／description／difficulty／flag／title 七個機械參數，不追問題目設計的正確性。`grilling` 技法（`.agents/skills/grilling/SKILL.md`）的核心是：一次一題、逐一走決策樹並解相依、每題給建議答案、可查的事實自己查、達成共識前不動手——正好補上「先把設計問清楚再動檔案」這一段。

約束：
- **Host-agent-neutral**：`wxl-create-skill` spec 有一條 scenario，會 grep `AskUserQuestion`／`EnterPlanMode`／`ExitPlanMode`／`TaskCreate`／`subagent_type`，在 `.agent/skills/wxl-create/` 下不得命中。新增的 prose 一律受此驗證涵蓋。
- **雙語同步**：`SKILL.md` 與 `SKILL.zhTW.md` 內容須對應（registry table 逐列一致的既有要求延伸到新段落的結構一致）。
- **既有下游不動**：Step 1～Step 7 的機械行為維持原樣。

## Goals / Non-Goals

**Goals:**

- 在 workflow 最前面新增 Step 0，用內嵌的 grilling 技法把題目「設計意圖」收斂到 agent 能精準生成漏洞碼的程度。
- Step 0 的訪談聚焦設計層面：漏洞真實性／非顯而易見性、預期攻擊路徑、難度校準、誤導或紅鯡、flag 位置合理性，以及決策間的相依。
- Step 0 收斂出的欄位無縫回饋 Step 1，避免重複拷問。
- 保持 host-agent-neutral 與雙語同步。

**Non-Goals:**

- 不改寫 Step 1～Step 7 的機械行為。
- 不在 skill 內以任何 host 的 dispatch 機制呼叫 grilling skill。
- 不改 `grilling` skill、`wxl-mutate`／`wxl-verify`／`wxl-crosscheck`、`pnpm create:challenge`。

## Decisions

### 以前置 Step 0 收斂設計，Step 1 維持機械參數收集

新增獨立的 Step 0 排在 Step 1 之前，而非把兩者合併改寫。Step 0 負責「設計對不對」（開放式、走決策樹），Step 1 負責「欄位填了沒」（結構化、可跳過）。分工清楚、既有 Step 1 與其 spec/scenario 幾乎不動，改動面最小、回歸風險最低。

替代方案：把 Step 1 直接改成一次一題的 grilling 式訪談、合而為一。否決原因——需重寫 Step 1 與雙語版本，且會牽動既有多條 Step 1 scenario（All/No/Partial parameters provided），改動面與回歸風險都大於效益。

### 內嵌 grilling 技法為 prose，而非 dispatch grilling skill

Step 0 直接把 grilling 的方法寫進 `wxl-create` 的 prose（一次一題、給建議答案、可查的事實自己查、達成共識前不動手），並在 `AGENTS.md` 標註技法來源為 `grilling` skill，但**不呼叫**它。

理由：`wxl-create` 的 host-neutral 驗證會 grep host 專屬原語；透過任何 host 的 skill dispatch 機制觸發 grilling 會破壞跨 agent 承諾與該驗證。內嵌 prose 讓三家 CLI（Claude Code／Codex／Gemini）都能一致執行，git grep 中立性驗證仍過。

替代方案：正式呼叫 grilling skill。否決原因——Claude Code 專屬、破壞 host-neutral 契約。

### Step 0 訪談深入題目設計維度

Step 0 不只把七個欄位問完，而是逐一走設計決策樹：(1) 漏洞真實性與非顯而易見性、(2) 預期攻擊路徑是否成立、(3) 難度與情境是否相符、(4) 是否需要誤導或紅鯡以及其強度、(5) flag 位置是否合理。每個維度都是一題、附建議答案，並解出維度間相依（例如難度會回頭影響是否加紅鯡）。

理由：題目設計缺陷通常要到 self-test 或 `wxl-verify` gate 才爆，前移到動檔案之前收斂可大幅減少重工。

### Step 0 一次一題、可查事實自己查、達成共識前不動任何檔案

沿用 grilling 紀律：一次只問一題並等回覆；能從檔案系統或工具查到的事實（例如 slug 是否已存在、canonical reference 是否可讀）自己查，不拿去問使用者；在使用者確認達成共識前，Step 0 不執行 scaffold 或寫任何檔案。

理由：一次問多題令人困惑；把「事實查詢」與「設計決策」分流，讓使用者只需回答真正屬於他的決策。

### Step 0 結論回饋 Step 1 的既有跳過邏輯

Step 0 收斂出的 slug／backend／vuln／description／difficulty 視為「已提供的參數」，交給 Step 1 既有的「已提供就跳過」邏輯：Step 1 只補問 Step 0 未定案或屬 Round 3 選填（flag／title）的欄位，不重複拷問。

理由：兩步驟資料無縫銜接，使用者不會被同一件事問兩次。

### Step 0 允許在設計已清楚時快速通過

若使用者初始訊息已把設計講到足以精準生成，Step 0 允許摘要複述設計並請使用者一次確認即通過，不強制逐維度拷問。

理由：避免為對談而對談；grilling 是收斂工具，不是儀式。

## Implementation Contract

- **Behavior**：使用者觸發 `wxl-create` 後，skill 先進入 Step 0，用純文字、一次一題的方式就題目設計維度提問（每題附建議答案），可查的事實自行查詢，達成共識前不動任何檔案；共識達成後把設計結論帶入 Step 1，Step 1 只補問未定案欄位，其餘 Step 2～Step 7 行為不變。
- **Interface / 文件形態**：
  - `.agent/skills/wxl-create/SKILL.md` 新增 `### Step 0` 段落並更新 `## Workflow` 的 dot 圖（新增 `grill` 節點，指向 `collect`）。
  - `.agent/skills/wxl-create/SKILL.zhTW.md` 新增對應的中文 Step 0 段落並同步更新 workflow 圖。
  - `.agent/skills/wxl-create/AGENTS.md` 在關係表新增一列，載明 `grilling` 為「內嵌技法（prose），非被 dispatch 的 skill」，並在 workflow 描述句納入 Step 0。
  - `openspec/specs/wxl-create-skill` 透過本 change 的 delta 新增一條 requirement 與其 scenarios。
- **Failure modes**：Step 0 不引入新的 halt 條件；它是對談，不動檔案，因此無「半成品」風險。若使用者要求跳過設計拷問，Step 0 快速通過即可。既有 host-neutral grep 驗證涵蓋新段落——若新 prose 誤用禁字，驗證會失敗。
- **Acceptance criteria**：
  1. `SKILL.md` 與 `SKILL.zhTW.md` 皆含 Step 0 段落，且 workflow 圖含 `grill → collect`（或等義）節點。
  2. `git grep -nE '<FORBIDDEN-PATTERN>' .agent/skills/wxl-create/` exit code 1（禁字無命中），其中 `<FORBIDDEN-PATTERN>` 取自 `.agent/skills/wxl-create/reference/agent-tools.md`／`openspec/specs/authoring-skill-pattern/spec.md`。
  3. Step 0 段落明訂：一次一題、每題附建議答案、可查的事實自己查、達成共識前不動檔案、深入設計維度、結論回饋 Step 1。
  4. `AGENTS.md` 關係表載明 grilling 為內嵌技法而非被呼叫的 skill。
  5. `spectra validate wxl-create-grilling-intake` 通過。
- **Scope boundaries**：
  - In scope：`wxl-create` 的三份文件（`SKILL.md`／`SKILL.zhTW.md`／`AGENTS.md`）與 workflow 圖、`wxl-create-skill` 的 delta spec。
  - Out of scope：Step 1～Step 7 機械行為、`grilling` skill 內容、其他 wxl-* skill、scaffold CLI、任何實際 challenge 檔案。

## Risks / Trade-offs

- [Step 0 讓簡單題目變囉嗦，降低出題速度] → 明訂「設計已清楚時快速通過」規則，並讓 Step 0 只問屬於使用者的設計決策、事實自己查。
- [內嵌 prose 與 grilling skill 未來語意漂移] → 在 `AGENTS.md` 標註技法來源，維護者調整 grilling 哲學時可回頭對齊；本變更只取其穩定核心（一次一題／給建議／查事實／達共識前不動手）。
- [雙語版本不同步] → 沿用既有雙語同步要求，把 Step 0 段落與 workflow 圖同時寫入兩份；Acceptance criteria 明列兩份都要有。
- [新 prose 誤用 host 專屬原語破壞中立性] → 既有 git grep 驗證涵蓋整個 skill 目錄，會在驗證階段擋下。
