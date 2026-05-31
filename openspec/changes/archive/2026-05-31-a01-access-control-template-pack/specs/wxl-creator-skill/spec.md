## ADDED Requirements

### Requirement: Skill consumes capability-specific reference documents via a registry table

The skill SHALL maintain a registry table in `SKILL.md` (and its localized mirror in `SKILL.zhTW.md`) mapping `vuln`-trigger regular expressions to reference documents under `.agent/skills/wxl-creator/reference/`. When the collected `vuln` matches any registry-table trigger regex, the skill SHALL read the corresponding `reference/<capability>.md` before proceeding to subsequent code-generation steps. When the failing challenge's `tags` array intersects the taxonomy declared by any registered capability, the skill SHALL read that capability's reference document and consult its `Per-primitive fix hints` section before proposing repair-loop fixes. The registry table is the sole extension point for adding new capability packs: new packs SHALL be added by appending a row, and SHALL NOT require modifying this Requirement.

The registry table SHALL contain at least the following columns: `Trigger regex`, `Reference file`. At the time of this change, the table SHALL contain at least one row: trigger regex `/idor|jwt|path.?traversal|access.?control|broken.?access/i` mapped to `reference/a01-access-control.md`.

<!-- @trace
source: wxl-creator-skill
updated: 2026-05-31
code:
  - .agent/skills/wxl-creator/SKILL.md
  - .agent/skills/wxl-creator/SKILL.zhTW.md
  - .agent/skills/wxl-creator/reference/a01-access-control.md
-->

#### Scenario: Registry table exists in SKILL.md with at least one row

- **WHEN** an inspector reads `.agent/skills/wxl-creator/SKILL.md`
- **THEN** the file SHALL contain a Markdown table with header columns `Trigger regex` and `Reference file`, and the table SHALL contain at least one data row referencing `reference/a01-access-control.md`

#### Scenario: A01-class vuln triggers reference-document read before code generation

- **WHEN** a wxl-creator session is invoked with `vuln: IDOR` (or `vuln: JWT bypass`, `vuln: path traversal`, `vuln: Broken Access Control`)
- **THEN** the skill SHALL read `.agent/skills/wxl-creator/reference/a01-access-control.md` before reading the canonical reference example or generating vulnerable application code

#### Scenario: Non-matching vuln SHALL NOT trigger reference-document read

- **WHEN** a wxl-creator session is invoked with `vuln: reflected XSS` (or any string that matches no registry-table trigger regex)
- **THEN** the skill SHALL NOT read `.agent/skills/wxl-creator/reference/a01-access-control.md` and SHALL proceed directly to the canonical reference example

#### Scenario: Failing A01 challenge triggers fix-hint consultation in repair loop

- **WHEN** `pnpm challenge:verify <slug>` returns a non-zero exit code and the failing challenge's `tags` array intersects an A01 taxonomy tag (one of `idor`, `access-control`, `jwt`, `path-traversal`, `broken-access`)
- **THEN** the skill SHALL read `.agent/skills/wxl-creator/reference/a01-access-control.md` `Per-primitive fix hints` section before proposing repair-loop fixes

#### Scenario: Localized mirror SHALL stay in parity

- **WHEN** an inspector compares the registry-table rows in `SKILL.md` and `SKILL.zhTW.md`
- **THEN** the two tables SHALL contain the same set of rows (same trigger regexes and same reference file paths)
