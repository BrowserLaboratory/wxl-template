# authoring-skill-pattern Specification

## Purpose

Standardizes the cross-agent authoring-skill conventions extracted from `wxl-creator-skill` Req "Skill prose is host-agent-neutral" and Req "Skill is installed via a single source with thin pointer files". Defines the canonical source location (`.agent/skills/<skill-name>/`), the official host agent matrix (Claude Code / Codex CLI / Gemini CLI), the forbidden host-agent-specific primitives, the thin pointer body limit, and the starter template contents. Establishes the foundation every subsequent challenge-authoring skill MUST follow so that skill structure, prose tone, and installation steps remain consistent across host agents.

## Requirements

### Requirement: Authoring skill canonical source location

The canonical source of every authoring skill SHALL live under `.agent/skills/<skill-name>/`. The skill source directory SHALL contain at minimum a `SKILL.md` file as the entry-point prose and an `AGENTS.md` file describing host-agent compatibility notes. Additional implementation files (reference docs, templates, configuration) SHALL reside under the same `.agent/skills/<skill-name>/` directory when present.

#### Scenario: Source location detection

- **WHEN** a maintainer needs to update an authoring skill's workflow content
- **THEN** the maintainer SHALL edit only files under `.agent/skills/<skill-name>/` and SHALL NOT edit any file under `.claude/skills/<skill-name>/`, `.codex/skills/<skill-name>/`, or `.gemini/skills/<skill-name>/`

#### Scenario: Minimum source files

- **WHEN** a maintainer lists the contents of an authoring skill source directory
- **THEN** `.agent/skills/<skill-name>/SKILL.md` and `.agent/skills/<skill-name>/AGENTS.md` SHALL both exist

---
### Requirement: Thin pointer files for each official host agent

For every authoring skill, the three official host agent paths `.claude/skills/<skill-name>/SKILL.md`, `.codex/skills/<skill-name>/SKILL.md`, and `.gemini/skills/<skill-name>/SKILL.md` SHALL each contain a thin pointer file whose body (excluding optional frontmatter) is at most three lines and whose sole purpose is to direct the host agent to read `.agent/skills/<skill-name>/SKILL.md` for the canonical prose. Pointer files SHALL include host-agent-specific frontmatter keys (such as `name` and `description`) when the host runtime requires them, but SHALL NOT duplicate the canonical prose body.

#### Scenario: Pointer body length

- **WHEN** a maintainer counts the lines of any thin pointer body, excluding YAML frontmatter
- **THEN** the line count SHALL be at most three

#### Scenario: Single source of truth

- **WHEN** a maintainer updates the canonical skill prose under `.agent/skills/<skill-name>/SKILL.md`
- **THEN** the three thin pointer files SHALL NOT require any edit and SHALL continue to direct the host agent to the same canonical location

##### Example: pointer body content

| Pointer path | Body content (≤3 lines) |
|--------------|--------------------------|
| `.claude/skills/<skill-name>/SKILL.md` | `Read .agent/skills/<skill-name>/SKILL.md for the canonical skill content.` |
| `.codex/skills/<skill-name>/SKILL.md`  | `Read .agent/skills/<skill-name>/SKILL.md for the canonical skill content.` |
| `.gemini/skills/<skill-name>/SKILL.md` | `Read .agent/skills/<skill-name>/SKILL.md for the canonical skill content.` |

---
### Requirement: Host-agent-neutral skill prose

The skill prose under `.agent/skills/<skill-name>/` (including `SKILL.md`, `AGENTS.md`, and every file under any subdirectory) SHALL NOT contain references to host-agent-specific primitives. The forbidden primitives SHALL be: `AskUserQuestion`, `Agent(subagent_type=...)`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, `TaskUpdate`. The skill SHALL use only tools that are commonly available across the official host agent matrix (Claude Code, Codex CLI, Gemini CLI): `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`. MCP tools (such as `chrome-devtools-mcp`) SHALL appear in the prose only when the prose declares the call as best-effort and specifies the degraded behavior when the MCP server is unavailable.

#### Scenario: Forbidden primitive detection

- **WHEN** a maintainer runs `git grep -nE 'AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate' .agent/skills/<skill-name>/`
- **THEN** the command SHALL return exit code 1, indicating zero matches

#### Scenario: Cross-runtime skill activation

- **WHEN** a maintainer activates the skill in any of Claude Code, Codex CLI, or Gemini CLI
- **THEN** the skill SHALL produce equivalent prose output and SHALL NOT fail on missing host-agent-specific tools

---
### Requirement: Official supported agent matrix

The official supported host agent matrix for every authoring skill SHALL be exactly three host agents: Claude Code, Codex CLI, Gemini CLI. The corresponding thin pointer paths SHALL be `.claude/skills/<skill-name>/SKILL.md`, `.codex/skills/<skill-name>/SKILL.md`, and `.gemini/skills/<skill-name>/SKILL.md`. Adding a new official host agent or removing an existing one SHALL require an independent change proposal that updates this Requirement.

#### Scenario: Matrix enumeration

- **WHEN** a maintainer reads the official agent matrix definition for an authoring skill
- **THEN** the matrix SHALL contain exactly the three host agents: Claude Code, Codex CLI, and Gemini CLI

##### Example: official matrix

| Host agent | Thin pointer path |
|------------|---------------------|
| Claude Code | `.claude/skills/<skill-name>/SKILL.md` |
| Codex CLI   | `.codex/skills/<skill-name>/SKILL.md`  |
| Gemini CLI  | `.gemini/skills/<skill-name>/SKILL.md` |

---
### Requirement: Starter template location and required contents

A starter template directory SHALL exist at `.agent/skills/_template/` to provide a copy-and-replace baseline for authors creating a new authoring skill. The starter template directory SHALL contain at minimum these four files: `SKILL.md` (canonical source template), `AGENTS.md` (host compatibility notes template), `INSTALL.md` (installation guide template covering all three official agent paths), and `POINTER.template.md` (thin pointer body template with a body of at most three lines).

#### Scenario: Starter template files exist

- **WHEN** a maintainer lists `.agent/skills/_template/`
- **THEN** the listing SHALL include `SKILL.md`, `AGENTS.md`, `INSTALL.md`, and `POINTER.template.md`

#### Scenario: Template body conforms to forbidden primitive rule

- **WHEN** a maintainer runs `git grep -nE 'AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate' .agent/skills/_template/`
- **THEN** the command SHALL return exit code 1, indicating zero matches

---
### Requirement: Starter template is not activated as a skill

The starter template SHALL NOT have a corresponding thin pointer in any official host agent path. The paths `.claude/skills/_template/`, `.codex/skills/_template/`, and `.gemini/skills/_template/` SHALL NOT exist on a clean checkout. The starter template SHALL only be activated indirectly: an author copies `.agent/skills/_template/` to `.agent/skills/<new-skill-name>/`, replaces placeholder tokens, and then creates thin pointers at the new skill name (not at `_template`).

#### Scenario: No host agent pointer for template

- **WHEN** a maintainer lists `.claude/skills/_template/`, `.codex/skills/_template/`, and `.gemini/skills/_template/`
- **THEN** each listing SHALL report "No such file or directory"

<!-- @trace
source: authoring-skill-pattern
updated: 2026-05-31
code:
  - .agent/skills/_template/SKILL.md
  - .agent/skills/_template/AGENTS.md
  - .agent/skills/_template/INSTALL.md
  - .agent/skills/_template/POINTER.template.md
tests: []
-->
