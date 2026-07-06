## MODIFIED Requirements

### Requirement: Pack ships an A01 reference document at the canonical path

The pack SHALL provide a reference document at `.agent/skills/wxl-create/reference/a01-access-control.md`. The document SHALL contain at least three top-level (`##`) sections with these exact titles: `Recognition heuristics`, `Per-primitive fix hints`, `Reference challenges table`. The document SHALL be host-agent-neutral and SHALL NOT contain any literal occurrence of the forbidden host-agent primitive regex (`AskUserQuestion`, `Agent(subagent_type`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, `TaskUpdate`); if the document needs to reference the regex itself, it SHALL use the placeholder token `<FORBIDDEN-PATTERN>`.

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-07-06
code:
  - .agent/skills/wxl-create/reference/a01-access-control.md
-->

#### Scenario: Reference document exists with the three required sections

- **WHEN** an inspector reads `.agent/skills/wxl-create/reference/a01-access-control.md`
- **THEN** the file SHALL exist and SHALL contain the three `##` headings `Recognition heuristics`, `Per-primitive fix hints`, `Reference challenges table` in that order

#### Scenario: Forbidden primitive scan returns no matches

- **WHEN** an inspector runs `git grep -nE 'AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate' .agent/skills/wxl-create/reference/a01-access-control.md`
- **THEN** the command SHALL exit with status 1 (no matches)

### Requirement: Pack declares an A01 dispatch trigger regex

The pack SHALL declare exactly one trigger regular expression that authoring skills use to detect A01-class vulnerabilities from free-text `vuln` input. The regex SHALL be `/idor|jwt|path.?traversal|access.?control|broken.?access/i`. The regex SHALL be recorded both in the pack's reference document `Recognition heuristics` section and in the `wxl-create` skill's registry table (per the `wxl-create-skill` capability's reference-consumption requirement). The two recordings SHALL match exactly.

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-07-06
code:
  - .agent/skills/wxl-create/reference/a01-access-control.md
  - .agent/skills/wxl-create/SKILL.md
  - .agent/skills/wxl-create/SKILL.zhTW.md
-->

#### Scenario: Trigger regex matches A01-class vuln strings

- **WHEN** the trigger regex is applied to candidate `vuln` strings
- **THEN** the regex SHALL match A01-class strings and SHALL NOT match unrelated strings

##### Example: trigger regex match table

| Input `vuln` | Match? |
|--------------|--------|
| `IDOR` | yes |
| `JWT bypass` | yes |
| `path traversal` | yes |
| `Path-Traversal` | yes |
| `broken access control` | yes |
| `Broken Access Control` | yes |
| `reflected XSS` | no |
| `SQL injection` | no |
| `SSRF` | no |

### Requirement: Pack reference document covers IDOR, JWT alg:none, and Path traversal primitives

The pack's reference document `Per-primitive fix hints` section SHALL contain a subsection (`###`) for each of these three primitives: `IDOR`, `JWT alg:none`, and `Path traversal`. Each subsection SHALL contain at least one concrete fix description (not a placeholder). The subsection SHALL NOT contain the forbidden words `TBD`, `TODO`, `FIXME`, `???`, or `TKTK`.

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-07-06
code:
  - .agent/skills/wxl-create/reference/a01-access-control.md
-->

#### Scenario: Three primitive subsections exist with concrete content

- **WHEN** an inspector reads the `Per-primitive fix hints` section of `.agent/skills/wxl-create/reference/a01-access-control.md`
- **THEN** the section SHALL contain `###` subsections titled `IDOR`, `JWT alg:none`, and `Path traversal`, and each subsection SHALL contain at least one fix description and SHALL NOT contain `TBD`, `TODO`, `FIXME`, `???`, or `TKTK`
