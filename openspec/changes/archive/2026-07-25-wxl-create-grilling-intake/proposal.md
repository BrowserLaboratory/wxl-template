## Why

`wxl-create` 目前一開場就用結構化的 round-based 問題塊，把 slug、backend、vuln、description、difficulty 等機械參數逐輪填滿，然後直接進 scaffold。這個流程只確認「要建什麼欄位」，卻從不追問「這題設計得對不對」——漏洞是否真實可利用、預期攻擊路徑是否成立、難度是否與情境相符、flag 擺放是否合理。結果是 agent 常常憑一句模糊的 description 就生成程式碼，等到 Step 6/7 self-test 或 `wxl-verify` gate 才發現題目設計本身有洞，來回重工。若能在動任何檔案之前，先用 grilling 技法把使用者的設計意圖問到收斂、聚焦，agent 生成的漏洞碼就能更精準命中需求。

## What Changes

- 在 `wxl-create` workflow 最前面新增一個 **Step 0：Grill 收斂題目設計**，排在現有的 Step 1（參數收集）之前。
- Step 0 以 **內嵌 prose 的形式**採用 grilling 技法——一次只問一題、每題附上建議答案、可從環境（檔案系統、工具）查到的事實自己查而不問使用者、達成共識前不動任何檔案——技法來源標註為 `grilling` skill（`.agents/skills/grilling/`）。
- Step 0 的訪談**深入題目設計層面**，而不只是填欄位：漏洞真實性與非顯而易見性、預期攻擊路徑、難度校準、可能的誤導／紅鯡（red herring）、flag 位置的合理性，以及這些設計決策彼此的相依關係。
- Step 0 收斂出的結論（尤其 slug／backend／vuln／description／difficulty）**回饋給 Step 1**：Step 1 沿用既有「已提供的參數就跳過」邏輯，只補問 Step 0 未定案的欄位，不重複拷問。
- Step 0 維持 **host-agent-neutral**：只用純文字問答，不引入 `AskUserQuestion`／`EnterPlanMode`／`TaskCreate`／`subagent_type` 等 host 專屬原語，沿用既有的 git grep 中立性驗證。
- 同步更新 `SKILL.md`（canonical 英文）、`SKILL.zhTW.md`（台灣繁中鏡像）與 workflow 圖，並在 `AGENTS.md` 記錄 grilling 是「內嵌技法」而非「被 dispatch 的 skill」。

## Non-Goals (optional)

- 不改動 Step 1～Step 7 既有的機械行為（scaffold、生成漏洞碼、frontmatter、exploit spec、self-test、交棒 `wxl-verify`）。Step 0 只在最前面新增，不改寫下游步驟。
- 不在 `wxl-create` 內**呼叫** grilling skill（不透過任何 host 的 skill dispatch 機制）——那會破壞 host-neutral 驗證與跨 agent 承諾。本變更只把 grilling 的技法以 prose 內嵌。
- 不強制 Step 0 一定要跑：若使用者初始訊息已把設計講得夠清楚，Step 0 允許快速確認後即通過，不為了對談而對談。
- 不修改 `wxl-mutate`／`wxl-verify`／`wxl-crosscheck`，也不動 `pnpm create:challenge` scaffold CLI。
- 不改 `grilling` skill 本身的內容。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `wxl-create-skill`: 新增一條 requirement，規範在參數收集之前，skill SHALL 先以內嵌的 grilling 技法對題目設計進行一次一題、達成共識前不動手的收斂訪談，並保持 host-agent-neutral。

## Impact

- Affected specs: `wxl-create-skill`（新增 requirement）
- Affected code:
  - Modified:
    - `.agent/skills/wxl-create/SKILL.md`（新增 Step 0 與更新 workflow 圖）
    - `.agent/skills/wxl-create/SKILL.zhTW.md`（同步鏡像）
    - `.agent/skills/wxl-create/AGENTS.md`（記錄 grilling 為內嵌技法、更新關係表）
  - New: (none)
  - Removed: (none)
