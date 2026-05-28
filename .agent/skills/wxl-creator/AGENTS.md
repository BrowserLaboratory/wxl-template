# wxl-creator — Cross-Agent Dispatcher Notes

This document describes how the three supported host-agent runtimes — **Claude Code**, **Codex CLI**, and **Gemini CLI** — discover and dispatch the `wxl-creator` skill, and how the skill relates to other agent-side tooling in this repository.

## Single source, three pointers

The canonical skill prose lives at `.agent/skills/wxl-creator/SKILL.md`. Each host-agent runtime has a discovery directory that contains only a **thin pointer file** redirecting the runtime to the canonical source:

| Host agent | Discovery path | Role |
|------------|----------------|------|
| Claude Code | `.claude/skills/wxl-creator/SKILL.md` | Pointer → `.agent/skills/wxl-creator/SKILL.md` |
| Codex CLI | `.codex/skills/wxl-creator/SKILL.md` | Pointer → `.agent/skills/wxl-creator/SKILL.md` |
| Gemini CLI | `.gemini/skills/wxl-creator/SKILL.md` | Pointer → `.agent/skills/wxl-creator/SKILL.md` |

Each pointer file body is at most three lines and reads `Read .agent/skills/wxl-creator/SKILL.md for the canonical skill content.` Maintainers SHALL only edit files under `.agent/skills/wxl-creator/`; the pointer files do not need to be re-synchronized when the canonical prose changes.

## When the skill is invoked

The skill activates on any of the following triggers (each runtime maps them to its own invocation syntax):

- The user types `/wxl-creator` (Claude Code slash command, Codex CLI slash command, or Gemini CLI `activate_skill wxl-creator`).
- The user says "create challenge", "new challenge", "出題", or "建立題目".
- The user describes a challenge to author (e.g., "build a Flask SQLi challenge called login-bypass").

The skill covers three stages of a challenge's lifecycle:

1. **Create** — scaffold, generate vulnerable code, write frontmatter, write Playwright spec, optional MCP self-test, run `pnpm challenge:verify`.
2. **Mutate** — change an existing challenge's backend / difficulty / tags / category via `pnpm challenge:retype`, then re-verify.
3. **Verify (release-blocking gate)** — run `pnpm challenge:verify`, with the L4 blind-solve gate gated behind `--blind` and the `WXL_VERIFY_RUNTIME` environment variable selecting the agent CLI used for L4.

## Relationship to other skills and CLIs

| Tool / skill | Relationship |
|--------------|--------------|
| `pnpm create:challenge` (existing CLI) | Called by `wxl-creator` during the Create stage scaffold step. Not modified by this skill. |
| `pnpm challenge:validate` / `pnpm challenge:analyze` (existing CLIs) | Indirectly invoked through `pnpm challenge:verify` (L1 / L2). Skill prose calls `challenge:verify`, never the legacy two-step pair directly. |
| `pnpm challenge:retype` (new CLI) | The Mutate stage's only entry point. Skill prose never edits frontmatter or renames `src/app.py` / `src/index.php` by hand. |
| `pnpm challenge:verify` (new CLI) | The Verify gate orchestrator. Default L1+L2+L3; `--blind` adds L4. |
| `pnpm challenge:verify:blind` (new CLI) | Standalone entry point for L4 (also dispatched from `challenge:verify --blind`). |
| `chrome-devtools-mcp` (MCP server) | Used by the skill during the Create stage as a best-effort self-test. Skill prose explicitly degrades when MCP is unavailable. |
| `spectra-*` skills | Independent. `wxl-creator` does not call `spectra-propose`, `spectra-apply`, or any spec-driven workflow skill. |

## Discovery contract (must hold for all three runtimes)

- Skill prose contains **no host-agent-specific primitives** (platform-only question tools, plan-mode entry / exit tools, platform task trackers, in-process sub-agent dispatchers). The forbidden-primitive matrix and enforcement command live in `reference/agent-tools.md`.
- Each pointer file's body (excluding frontmatter) is ≤ 3 lines and contains the directive `Read .agent/skills/wxl-creator/SKILL.md`.
- The canonical prose uses only tools shared across all three runtimes — `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch` — plus the optional `chrome-devtools-mcp` toolset with explicit degradation when unavailable. See `reference/agent-tools.md` for the shared-tool matrix.

## File layout

```
.agent/skills/wxl-creator/
├── SKILL.md                          # Canonical prose (English)
├── SKILL.zhTW.md                     # Traditional Chinese mirror (Taiwan)
├── AGENTS.md                         # This file
├── reference/
│   ├── agent-tools.md                # Shared-tool matrix across Claude / Codex / Gemini
│   └── runtime-cli.md                # CLI command and flag mapping for the L4 spawn-runtime dispatcher
└── templates/
    └── exploit-spec.ts.tmpl          # Playwright e2e spec template (mustache-style placeholders)
```
