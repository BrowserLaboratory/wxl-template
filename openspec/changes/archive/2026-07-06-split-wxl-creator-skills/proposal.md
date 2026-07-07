## Summary

把單體的 wxl-creator authoring skill 依既有 CLI verb 邊界拆成四個細粒度 skill（wxl-create / wxl-mutate / wxl-verify / wxl-crosscheck），並將對應的 wxl-creator-skill spec capability 拆成四個 verb-specific capability，同時移除舊 skill 與舊 capability。

## Motivation

wxl-creator 的 canonical SKILL.md 有 412 行，是全 repo 最大的一份，把 create、mutate、verify、L4 cross-check 四種不同 verb、不同觸發時機、不同對象（出題者 vs maintainer）全綁在一起。

底層 CLI 早已依 verb 拆成四支獨立 script（challenge scaffold、retype、verify、blind verify），但 skill 層仍是單體，造成 skill 對 CLI 的對應為 1 對 4，也讓 auto-fix loop 邏輯在 create 與 mutate 尾端被口頭複製。spec 層同樣以單一 wxl-creator-skill capability 綁 13 條 requirement，難以針對單一 verb 做精細演進。

目標：讓每個 verb 成為可獨立觸發、獨立演進的 skill；skill 與 spec capability 皆與 CLI verb 1 對 1 對齊；並把共用的 verify gate 加 auto-fix loop 收斂成單一 wxl-verify skill 供 create 與 mutate 交棒。

## Proposed Solution

新增四個 authoring skill，各自 canonical 目錄 .agent/skills/<name>/ 加三家 thin pointer，橫切結構需求由既有 authoring-skill-pattern capability 通用規範：

- wxl-create：參數收集 → scaffold → 生成漏洞碼 → 更新 frontmatter → 產生 Playwright exploit spec → best-effort self-test → 交棒 wxl-verify；擁有 canonical reference（door-is-open）與 capability-pack registry（a01）。
- wxl-mutate：透過 retype 變更既有題目的 backend、difficulty、tags、category。
- wxl-verify：執行 challenge verify 的 L1 至 L3 gate 與 auto-fix loop（可設定 max_fix_attempts），為 create 與 mutate 共用。
- wxl-crosscheck：maintainer-only，透過 blind 多 runtime 交叉驗證執行 L4；CLI 契約沿用既有 l4-multi-agent-cross-check capability。

共用資產 re-home 至主要擁有者；橫切結構需求由 authoring-skill-pattern 繼承，不在新 capability 重複。移除舊 wxl-creator skill、三家 pointer、legacy workflow 檔與 wxl-creator-skill capability。

## Non-Goals

- 不修改任何底層 script 與其單元測試，只重組 skill 與 spec 層。
- 不改變 challenge 內容、L4 CLI 行為、或 authoring-skill-pattern 的橫切規範本身。
- 不重寫歷史或工作文件（CHANGELOG.md 與 repo root 的 AUDIT.md、VERIFICATION.md、DELETION-PLAN.md），這些為既往快照，維持原狀。
- 不保留舊觸發入口 wxl-creator，使用者已確認無需保留舊別名。
- tangential spec 中僅屬 trace metadata 或 Purpose 出處敘述的 wxl-creator 提及（如 wxl-blind-solve-verification、challenge-author-scripts、l4-multi-agent-cross-check 的 Purpose）維持歷史敘述，本 change 只更新 requirement 正文中會失準的路徑（a01-access-control-template-pack）。

## Alternatives Considered

- 保留單一 wxl-creator-skill capability、只更新路徑：否決，skill 對 capability 仍 1 對 4，未達更精細目標，且 audit 會把 1 對 4 對應視為未完成重組。
- 在每個新 capability 重複 host-neutral 與 thin-pointer 需求：否決，authoring-skill-pattern 已通用涵蓋，重複會造成規範漂移風險。
- 為 crosscheck 另立全新 CLI 契約 capability：否決，l4-multi-agent-cross-check 已規範 CLI，crosscheck skill 只是薄包裝。

## Impact

- Affected specs:
  - New: wxl-create-skill, wxl-mutate-skill, wxl-verify-skill, wxl-crosscheck-skill
  - Modified: a01-access-control-template-pack
  - Removed: wxl-creator-skill
- Affected code:
  - New:
    - .agent/skills/wxl-create/SKILL.md
    - .agent/skills/wxl-create/AGENTS.md
    - .agent/skills/wxl-create/SKILL.zhTW.md
    - .agent/skills/wxl-create/reference/a01-access-control.md
    - .agent/skills/wxl-create/reference/agent-tools.md
    - .agent/skills/wxl-create/templates/exploit-spec.ts.tmpl
    - .agent/skills/wxl-mutate/SKILL.md
    - .agent/skills/wxl-mutate/AGENTS.md
    - .agent/skills/wxl-verify/SKILL.md
    - .agent/skills/wxl-verify/AGENTS.md
    - .agent/skills/wxl-crosscheck/SKILL.md
    - .agent/skills/wxl-crosscheck/AGENTS.md
    - .agent/skills/wxl-crosscheck/reference/runtime-cli.md
    - .claude/skills/wxl-create/SKILL.md
    - .codex/skills/wxl-create/SKILL.md
    - .gemini/skills/wxl-create/SKILL.md
    - .claude/skills/wxl-mutate/SKILL.md
    - .codex/skills/wxl-mutate/SKILL.md
    - .gemini/skills/wxl-mutate/SKILL.md
    - .claude/skills/wxl-verify/SKILL.md
    - .codex/skills/wxl-verify/SKILL.md
    - .gemini/skills/wxl-verify/SKILL.md
    - .claude/skills/wxl-crosscheck/SKILL.md
    - .codex/skills/wxl-crosscheck/SKILL.md
    - .gemini/skills/wxl-crosscheck/SKILL.md
    - .wxl-verify/config.yaml
  - Modified:
    - openspec/specs/a01-access-control-template-pack/spec.md
    - scripts/wxl-solver/spawn-runtime.ts
    - .gitignore
  - Removed:
    - .agent/skills/wxl-creator/SKILL.md
    - .agent/skills/wxl-creator/SKILL.zhTW.md
    - .agent/skills/wxl-creator/AGENTS.md
    - .agent/skills/wxl-creator/reference/a01-access-control.md
    - .agent/skills/wxl-creator/reference/agent-tools.md
    - .agent/skills/wxl-creator/reference/runtime-cli.md
    - .agent/skills/wxl-creator/templates/exploit-spec.ts.tmpl
    - .claude/skills/wxl-creator/SKILL.md
    - .codex/skills/wxl-creator/SKILL.md
    - .gemini/skills/wxl-creator/SKILL.md
    - .agent/workflows/wxl-creator.md
    - .wxl-creator/config.yaml
