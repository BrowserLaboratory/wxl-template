## Why

接下來 12 個 R# change（R2-R12）將陸續新增多個跨 agent 的 challenge-authoring skill（題型 / runtime / 驗題等類別）。目前唯一的 cross-agent 範例是 `wxl-creator-skill` Req #9（host-agent-neutral 文字）與 Req #10（single source + thin pointer 安裝慣例），若每個新 skill 都各自 fork 這套 pattern，必然出現措辭、目錄結構、安裝指南、agent-matrix 的 drift；事後又要逐 skill 重新對齊。本 change 在 R2-R12 任何新 skill 動工前，把 `wxl-creator-skill` 已落地的 pattern 標準化成獨立 capability 與 starter template，作為後續所有新 authoring skill 的唯一依據。

## What Changes

- 新增 `authoring-skill-pattern` capability：以 SHALL 條款定義跨 agent authoring skill 的最低標準，涵蓋 host-agent-neutral 措辭、single source + thin pointer 安裝結構、安裝指南必含項目、官方 agent matrix 涵蓋範圍。
- 新增 1 份「starter template」資產（純檔案範本、零執行時程式碼）給 R2-R12 作者複製起手：含 SKILL source 範本、AGENTS.md 範本、thin pointer 範本與安裝指南範本。實際存放位置由 design.md 決定（候選位置 `templates/authoring-skill-starter/` 或 `.agent/skills/_template/` 在 design 階段擇一）。
- 不改 `wxl-creator-skill` canonical spec：`wxl-creator-skill` Req #9/#10 維持原文，作為新 capability 引用的歷史依據；任何將 `wxl-creator-skill` 對齊新 capability 的工作另立 change 處理。
- 不實作任何新 authoring skill：R2-R12 各自的 skill 仍由其 own change 用本 capability 與 template 起手。

## Non-Goals

- 不在本 change 內把 `wxl-creator-skill` Req #9/#10 改成「SHALL conform to authoring-skill-pattern」式引用（避免在 pattern 剛落地時同步改動 source spec、降低 archive 風險）；該對齊由獨立後續 change 處理。
- 不引入新 npm/Cargo/pip 依賴。
- 不新增 CLI、不新增 CI gate、不改 ruleset。
- 不規定特定 agent host 的 runtime 細節（例如 Claude Code 與 Codex 的 invocation 差異），只規定文件 + 結構 + 安裝步驟層級的中立性。

## Capabilities

### New Capabilities

- `authoring-skill-pattern`: 跨 agent challenge-authoring skill 的標準結構、措辭與安裝慣例規範；定義 source-of-truth 位置、thin pointer 結構、agent matrix 必含項與安裝指南最低欄位。

### Modified Capabilities

(none)

## Impact

- Affected specs: 新增 `openspec/specs/authoring-skill-pattern/spec.md`（純 ADDED capability，無 MODIFIED）。
- Affected code:
  - New:
    - `openspec/specs/authoring-skill-pattern/spec.md`
    - Starter template 目錄（具體路徑由 design.md 決定，預設候選為 `templates/authoring-skill-starter/`，內含 `SKILL.md`、`AGENTS.md`、`thin-pointer.md`、`INSTALL.md` 等範本檔）
  - Modified: 無
  - Removed: 無
- 不影響 runtime、build pipeline、CI gate、ruleset、release flow。
- 為後續 R2-R12 解鎖：任何新 authoring skill 必須引用本 capability 並以 starter template 為起點。
