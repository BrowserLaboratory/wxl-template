# wxl-mutate — Host Agent Compatibility Notes

How the three official host-agent runtimes — **Claude Code**, **Codex CLI**, **Gemini CLI** — discover and dispatch the `wxl-mutate` skill. The official agent matrix is fixed by the `authoring-skill-pattern` capability.

## Single source, three pointers

Canonical prose lives at `.agent/skills/wxl-mutate/SKILL.md`. Each runtime has a discovery directory with only a thin pointer (≤3 lines) → the canonical source.

| Host agent | Thin pointer path | 啟動方式（一般慣例） |
|------------|-------------------|----------------------|
| Claude Code | `.claude/skills/wxl-mutate/SKILL.md` | 自動 skill discovery；亦可 `/wxl-mutate` 觸發 |
| Codex CLI | `.codex/skills/wxl-mutate/SKILL.md` | session 啟動載入；對話內以關鍵字觸發 |
| Gemini CLI | `.gemini/skills/wxl-mutate/SKILL.md` | activate_skill 工具觸發 |

Each pointer body reads `Read .agent/skills/wxl-mutate/SKILL.md for the canonical skill content.` Maintainers SHALL edit only files under `.agent/skills/wxl-mutate/`.

## When the skill is invoked

- The user says "改 backend / 改難度 / 改 tags / change category / mutate / retype" against an existing challenge slug, or types `/wxl-mutate`.

`wxl-mutate` covers the **Mutate** verb: change an existing challenge's `backend` / `difficulty` / `tags` / `category` via `pnpm challenge:retype`, then hand off to `wxl-verify`.

## Relationship to other skills and CLIs

| Tool / skill | Relationship |
|--------------|--------------|
| `pnpm challenge:retype` (existing CLI) | The Mutate stage's only entry point. Not modified by this skill. |
| `wxl-verify` (sibling skill) | Hand-off target after a successful retype, to re-verify the challenge. |
| `wxl-create` (sibling skill) | Independent. Creates a new challenge from scratch. |

## Discovery contract (must hold for all three runtimes)

- Skill prose contains **no host-agent-specific primitives**.
- Each pointer body (excluding frontmatter) is ≤3 lines and contains `Read .agent/skills/wxl-mutate/SKILL.md`.
- The canonical prose uses only `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`.

## File layout

```
.agent/skills/wxl-mutate/
├── SKILL.md    # Canonical prose (English)
└── AGENTS.md   # This file
```
