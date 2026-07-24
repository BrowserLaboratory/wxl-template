# wxl-create — Host Agent Compatibility Notes

This document lists how the three official host-agent runtimes — **Claude Code**, **Codex CLI**, and **Gemini CLI** — discover and dispatch the `wxl-create` skill, and how it relates to the sibling `wxl-mutate`, `wxl-verify`, and `wxl-crosscheck` skills. The official agent matrix is fixed by the `authoring-skill-pattern` capability; adding a host requires an independent change.

## Single source, three pointers

The canonical prose lives at `.agent/skills/wxl-create/SKILL.md`. Each runtime has a discovery directory containing only a thin pointer (≤3 lines) redirecting to the canonical source.

| Host agent | Thin pointer path | 啟動方式（一般慣例） |
|------------|-------------------|----------------------|
| Claude Code | `.claude/skills/wxl-create/SKILL.md` | 自動 skill discovery；亦可由使用者輸入 `/wxl-create` 觸發 |
| Codex CLI | `.codex/skills/wxl-create/SKILL.md` | session 啟動載入 skill discovery；對話內以關鍵字觸發 |
| Gemini CLI | `.gemini/skills/wxl-create/SKILL.md` | 透過 activate_skill 工具觸發；session 啟動載入 metadata |

Each pointer body reads `Read .agent/skills/wxl-create/SKILL.md for the canonical skill content.` Maintainers SHALL edit only files under `.agent/skills/wxl-create/`; pointers never need re-syncing when the canonical prose changes.

## When the skill is invoked

- The user types `/wxl-create` (or the runtime's equivalent `activate_skill wxl-create`).
- The user says "create challenge", "new challenge", "出題", or "建立題目".
- The user describes a challenge to author (e.g. "build a Flask SQLi challenge called login-bypass").

`wxl-create` covers the **Create** verb only: grill design intent to convergence (Step 0) → collect parameters → scaffold → generate vulnerable code → frontmatter → Playwright spec → best-effort MCP self-test → hand off to `wxl-verify` for the L1–L3 gate.

## Relationship to other skills and CLIs

| Tool / skill | Relationship |
|--------------|--------------|
| `pnpm create:challenge` (existing CLI) | Called during the scaffold step. Not modified by this skill. |
| `wxl-verify` (sibling skill) | Create hands off to it for the `pnpm challenge:verify` gate (L1–L3) and the auto-fix loop. |
| `wxl-mutate` (sibling skill) | Independent. Changes an existing challenge's backend / difficulty / tags / category. |
| `wxl-crosscheck` (sibling skill) | Independent, maintainer-only. Runs the L4 blind cross-check; Create never triggers L4. |
| `chrome-devtools-mcp` (MCP server) | Best-effort self-test in Step 6; the prose degrades explicitly when unavailable. |
| `reference/a01-access-control.md` | Consulted during code generation when `vuln` matches the A01 registry trigger. |
| `grilling` (technique, `.agents/skills/grilling/`) | **Inlined technique, not a dispatched skill.** Step 0 copies the grilling method (one question at a time, recommend an answer, look up facts, no action until shared understanding) into `wxl-create`'s prose to converge challenge design. The `grilling` skill is never invoked or dispatched — inlining keeps the flow host-agent-neutral. |
| `spectra-*` skills | Independent. `wxl-create` does not call any spec-driven workflow skill. |

## Discovery contract (must hold for all three runtimes)

- Skill prose contains **no host-agent-specific primitives** (platform-only question tools, plan-mode entry/exit, platform task trackers, in-process sub-agent dispatchers). The forbidden-primitive matrix and enforcement command live in `reference/agent-tools.md`.
- Each pointer body (excluding frontmatter) is ≤3 lines and contains `Read .agent/skills/wxl-create/SKILL.md`.
- The canonical prose uses only `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`, plus the optional `chrome-devtools-mcp` toolset with explicit degradation when unavailable.

## File layout

```
.agent/skills/wxl-create/
├── SKILL.md                          # Canonical prose (English)
├── SKILL.zhTW.md                     # Traditional Chinese mirror (Taiwan) — registry table in parity with SKILL.md
├── AGENTS.md                         # This file
├── reference/
│   ├── agent-tools.md                # Shared-tool matrix across Claude / Codex / Gemini
│   └── a01-access-control.md         # OWASP A01 capability pack (consulted during generation; also read by wxl-verify fix hints)
└── templates/
    └── exploit-spec.ts.tmpl          # Playwright e2e spec template (mustache-style placeholders)
```
