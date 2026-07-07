# wxl-crosscheck — Host Agent Compatibility Notes

How the three official host-agent runtimes — **Claude Code**, **Codex CLI**, **Gemini CLI** — discover and dispatch the `wxl-crosscheck` skill. The official agent matrix is fixed by the `authoring-skill-pattern` capability. This skill is maintainer-only.

## Single source, three pointers

Canonical prose lives at `.agent/skills/wxl-crosscheck/SKILL.md`. Each runtime has a discovery directory with only a thin pointer (≤3 lines) → the canonical source.

| Host agent | Thin pointer path | 啟動方式（一般慣例） |
|------------|-------------------|----------------------|
| Claude Code | `.claude/skills/wxl-crosscheck/SKILL.md` | 自動 skill discovery；亦可 `/wxl-crosscheck` 觸發 |
| Codex CLI | `.codex/skills/wxl-crosscheck/SKILL.md` | session 啟動載入；對話內以關鍵字觸發 |
| Gemini CLI | `.gemini/skills/wxl-crosscheck/SKILL.md` | activate_skill 工具觸發 |

Each pointer body reads `Read .agent/skills/wxl-crosscheck/SKILL.md for the canonical skill content.` Maintainers SHALL edit only files under `.agent/skills/wxl-crosscheck/`.

## When the skill is invoked

- A maintainer runs the L4 blind cross-check before a release, or types `/wxl-crosscheck`.

`wxl-crosscheck` covers the **L4 cross-check** verb: a thin wrapper over `pnpm challenge:verify --blind [--agents ...]`. Not run in CI; requires the target runtimes' CLIs installed locally.

## Relationship to other skills and CLIs

| Tool / skill | Relationship |
|--------------|--------------|
| `pnpm challenge:verify --blind` / `pnpm challenge:verify:cross` (existing CLIs) | The L4 entry points this skill wraps. Not modified by this skill. |
| `l4-multi-agent-cross-check` (capability) | Owns the CLI contract: `--agents`, verdict precedence, divergence report. |
| `wxl-verify` (sibling skill) | Owns L1–L3; this skill is the separate L4 concern. |
| `reference/runtime-cli.md` | Dispatch table, precedence rules, per-runtime CLI argv contracts. |
| `scripts/wxl-solver/spawn-runtime.ts` | Runtime spawner whose mapping table mirrors `reference/runtime-cli.md`. |

## Discovery contract (must hold for all three runtimes)

- Skill prose contains **no host-agent-specific primitives**.
- Each pointer body (excluding frontmatter) is ≤3 lines and contains `Read .agent/skills/wxl-crosscheck/SKILL.md`.
- The canonical prose uses only `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`.

## File layout

```
.agent/skills/wxl-crosscheck/
├── SKILL.md                # Canonical prose (English)
├── AGENTS.md               # This file
└── reference/
    └── runtime-cli.md      # CLI command/flag mapping for the L4 spawn-runtime dispatcher
```
