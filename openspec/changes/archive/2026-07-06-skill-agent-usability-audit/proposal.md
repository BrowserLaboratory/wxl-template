## Why

本 repo 有 14 個 skill 分散在 `.agent`、`.claude`、`.codex`、`.gemini` 四個 host 根目錄，但目前只有 `authoring-skill-pattern` spec 規範「結構」（canonical 位置、thin pointer、host matrix、host-neutral 措辭），沒有任何 spec 保證「一個 LLM agent 真的能把 skill 從頭到尾正確依循」——也就是 skill 內指示 agent 讀取或執行的每個檔案、script、pnpm 指令都必須實際存在且有效。缺了這道驗證，skill 可能結構合規、卻在使用時撞到不存在的路徑或已移除的指令而失敗。此變更建立可用性稽核與對應的可驗證需求，並修復稽核確認的 repo-owned 缺陷。

## What Changes

- 新增 capability `skill-agent-usability`：把「skill 引用可解析」「frontmatter 合法且具可觸發 description」「canonical 與 thin pointer 一致」等 LLM-agent 可用性要求正式化為可驗證需求，補 `authoring-skill-pattern` 只管結構的缺口。
- 對 repo 內全部 14 個 skill 依九項 rubric 執行可用性稽核，產出 findings ledger 於 `.spectra/analysis/skill-agent-usability-audit.md`，每個 skill 對每項檢查標記 PASS 或 FAIL 並附證據與可重現指令。
- 對 ledger 的每一筆 finding 執行 multi-agent adversarial review（驗真、去偽、補漏），只保留 CONFIRMED。
- 修復 CONFIRMED 的 repo-owned skill 缺陷（`wxl-creator`、`wxl-fork-init`、`_template`），以「重跑該筆檢查指令通過」為驗收。
- 將 vendored `spectra-*` 的問題（缺 `.codex` pointer、`spectra-analyze` 與 `spectra-verify` 僅存於 `.claude`、`.agent` 下缺 AGENTS.md）以 triage 方式記錄處置，不直接修改其檔案。

## Non-Goals

- 不修改 vendored `spectra-*` skill 的檔案內容：由 Spectra CLI 管理，直接改會在下次同步被覆寫；僅記錄 triage 處置。
- 不改動 `authoring-skill-pattern` spec 既有 Requirement 的語意；本變更為新增可用性 capability，非重寫既有結構規範。
- 不重寫 skill 的教學內容或擴充功能；範圍限「可用性正確性」修復。
- 不做跨 host runtime 的實機執行測試（Codex 與 Gemini 端）；以靜態可解析性與 Claude Code 端可用性為準。

## Capabilities

### New Capabilities

- `skill-agent-usability`: 規範 repo 內每個 skill 必須能被官方 host agent matrix 正確依循——引用的檔案、script、指令可解析，frontmatter 合法且具可觸發 description，canonical 與 thin pointer 一致——並定義可重現的稽核驗證程序。

### Modified Capabilities

(none)

## Impact

- Affected specs:
  - New: `openspec/specs/skill-agent-usability/spec.md`
- Affected code:
  - New: `.spectra/analysis/skill-agent-usability-audit.md`
  - Modified: `.agent/skills/wxl-creator/SKILL.md`、`.agent/skills/wxl-fork-init/SKILL.md`、`.agent/skills/_template/SKILL.md` 及其對應 thin pointer（依稽核確認的缺陷而定）
  - Removed: 無預期刪除
