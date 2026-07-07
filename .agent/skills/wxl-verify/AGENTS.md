# wxl-verify — Host Agent Compatibility Notes

How the three official host-agent runtimes — **Claude Code**, **Codex CLI**, **Gemini CLI** — discover and dispatch the `wxl-verify` skill. The official agent matrix is fixed by the `authoring-skill-pattern` capability.

## Single source, three pointers

Canonical prose lives at `.agent/skills/wxl-verify/SKILL.md`. Each runtime has a discovery directory with only a thin pointer (≤3 lines) → the canonical source.

| Host agent | Thin pointer path | 啟動方式（一般慣例） |
|------------|-------------------|----------------------|
| Claude Code | `.claude/skills/wxl-verify/SKILL.md` | 自動 skill discovery；亦可 `/wxl-verify` 觸發 |
| Codex CLI | `.codex/skills/wxl-verify/SKILL.md` | session 啟動載入；對話內以關鍵字觸發 |
| Gemini CLI | `.gemini/skills/wxl-verify/SKILL.md` | activate_skill 工具觸發 |

Each pointer body reads `Read .agent/skills/wxl-verify/SKILL.md for the canonical skill content.` Maintainers SHALL edit only files under `.agent/skills/wxl-verify/`.

## When the skill is invoked

- The user asks to verify / gate a challenge, or types `/wxl-verify`.
- `wxl-create` hands off after generating a challenge; `wxl-mutate` hands off after a retype, to confirm the change did not break the challenge.

`wxl-verify` covers the **Verify** verb: the L1–L3 release-blocking gate plus the bounded auto-fix loop. It never runs L4.

## Relationship to other skills and CLIs

| Tool / skill | Relationship |
|--------------|--------------|
| `pnpm challenge:verify` (existing CLI) | The gate orchestrator this skill drives (L1+L2+L3). Not modified by this skill. |
| `wxl-create` / `wxl-mutate` (sibling skills) | Hand off to this skill for the gate and fix loop. |
| `wxl-crosscheck` (sibling skill) | Owns L4 (`--blind`); this skill never triggers it. |
| `.wxl-verify/config.yaml` | Read for `max_fix_attempts` (default 10 when absent). |
| `.agent/skills/wxl-create/reference/a01-access-control.md` | Read for `Per-primitive fix hints` when a failing challenge's tags intersect the A01 taxonomy. |

## Discovery contract (must hold for all three runtimes)

- Skill prose contains **no host-agent-specific primitives**; the confirmation step is a plain-text `apply` / `skip` block, never a host-specific question tool.
- Each pointer body (excluding frontmatter) is ≤3 lines and contains `Read .agent/skills/wxl-verify/SKILL.md`.
- The canonical prose uses only `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`.

## File layout

```
.agent/skills/wxl-verify/
├── SKILL.md    # Canonical prose (English)
└── AGENTS.md   # This file
```
