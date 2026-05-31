# a01-access-control-template-pack Specification

## Purpose

Defines the OWASP A01 (Broken Access Control) challenge-type pack for the wxl platform: the canonical set of reference challenges covering every supported runtime (IDOR on FastAPI, JWT alg:none bypass on Flask, path traversal on PHP), the A01 reference document the wxl-creator skill consults during code generation and repair, the dispatch trigger regex and tag taxonomy that route A01-class vulnerabilities to that guidance, and the per-primitive fix hints authors apply. This capability is the template that subsequent OWASP-category packs (A02–A10) copy and adapt.

## Requirements

### Requirement: Pack includes reference challenges covering every supported runtime

The pack SHALL ship at least three reference challenges. The set of challenges SHALL cover every backend runtime that the `challenge-runtimes` capability currently supports (as of this change: `fastapi`, `flask`, `php`). When `challenge-runtimes` later adds a new backend, a follow-up change SHALL extend the pack; this change SHALL NOT block on future runtimes.

The three reference challenges in scope for this change are:

| Slug | Primitive | Backend | Difficulty |
|------|-----------|---------|------------|
| `door-is-open` | IDOR | fastapi | easy |
| `jwt-none-alg` | JWT alg:none bypass | flask | medium |
| `confidential-files` | Path traversal (LFI) | php | easy |

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - docs/challenge/door-is-open/index.md
  - docs/challenge/jwt-none-alg/index.md
  - docs/challenge/confidential-files/index.md
-->

#### Scenario: Every supported runtime is represented

- **WHEN** an inspector enumerates the three reference challenges and reads each `index.md` `backend` field
- **THEN** the set of distinct `backend` values SHALL equal `{fastapi, flask, php}`

#### Scenario: Each reference challenge passes verify

- **WHEN** `pnpm challenge:verify <slug>` runs for each of `door-is-open`, `jwt-none-alg`, `confidential-files`
- **THEN** every invocation SHALL exit with status 0 (L1 frontmatter, L2 analysis, L3 Playwright all pass)


<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - docs/challenge/jwt-none-alg/index.md
  - docs/challenge/jwt-none-alg/src/flag.txt
  - docs/challenge/jwt-none-alg/src/app.py
  - docs/challenge/confidential-files/index.md
  - docs/challenge/confidential-files/src/index.php
  - docs/challenge/confidential-files/src/flag.txt
tests:
  - tests/challenges/confidential-files.spec.ts
  - tests/challenges/jwt-none-alg.spec.ts
-->

---
### Requirement: Pack ships an A01 reference document at the canonical path

The pack SHALL provide a reference document at `.agent/skills/wxl-creator/reference/a01-access-control.md`. The document SHALL contain at least three top-level (`##`) sections with these exact titles: `Recognition heuristics`, `Per-primitive fix hints`, `Reference challenges table`. The document SHALL be host-agent-neutral and SHALL NOT contain any literal occurrence of the forbidden host-agent primitive regex (`AskUserQuestion`, `Agent(subagent_type`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, `TaskUpdate`); if the document needs to reference the regex itself, it SHALL use the placeholder token `<FORBIDDEN-PATTERN>`.

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - .agent/skills/wxl-creator/reference/a01-access-control.md
-->

#### Scenario: Reference document exists with the three required sections

- **WHEN** an inspector reads `.agent/skills/wxl-creator/reference/a01-access-control.md`
- **THEN** the file SHALL exist and SHALL contain the three `##` headings `Recognition heuristics`, `Per-primitive fix hints`, `Reference challenges table` in that order

#### Scenario: Forbidden primitive scan returns no matches

- **WHEN** an inspector runs `git grep -nE 'AskUserQuestion|Agent\(subagent_type|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate' .agent/skills/wxl-creator/reference/a01-access-control.md`
- **THEN** the command SHALL exit with status 1 (no matches)


<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - docs/challenge/jwt-none-alg/index.md
  - docs/challenge/jwt-none-alg/src/flag.txt
  - docs/challenge/jwt-none-alg/src/app.py
  - docs/challenge/confidential-files/index.md
  - docs/challenge/confidential-files/src/index.php
  - docs/challenge/confidential-files/src/flag.txt
tests:
  - tests/challenges/confidential-files.spec.ts
  - tests/challenges/jwt-none-alg.spec.ts
-->

---
### Requirement: Pack declares an A01 dispatch trigger regex

The pack SHALL declare exactly one trigger regular expression that authoring skills use to detect A01-class vulnerabilities from free-text `vuln` input. The regex SHALL be `/idor|jwt|path.?traversal|access.?control|broken.?access/i`. The regex SHALL be recorded both in the pack's reference document `Recognition heuristics` section and in the wxl-creator skill's registry table (per the `wxl-creator-skill` capability's reference-consumption requirement). The two recordings SHALL match exactly.

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - .agent/skills/wxl-creator/reference/a01-access-control.md
  - .agent/skills/wxl-creator/SKILL.md
  - .agent/skills/wxl-creator/SKILL.zhTW.md
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


<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - docs/challenge/jwt-none-alg/index.md
  - docs/challenge/jwt-none-alg/src/flag.txt
  - docs/challenge/jwt-none-alg/src/app.py
  - docs/challenge/confidential-files/index.md
  - docs/challenge/confidential-files/src/index.php
  - docs/challenge/confidential-files/src/flag.txt
tests:
  - tests/challenges/confidential-files.spec.ts
  - tests/challenges/jwt-none-alg.spec.ts
-->

---
### Requirement: Pack declares an A01 tag taxonomy

The pack SHALL declare a tag taxonomy: the set `{idor, access-control, jwt, path-traversal, broken-access}`. Every reference challenge in this pack SHALL include at least one tag from the taxonomy in its `index.md` `tags` array.

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - docs/challenge/door-is-open/index.md
  - docs/challenge/jwt-none-alg/index.md
  - docs/challenge/confidential-files/index.md
-->

#### Scenario: Each reference challenge carries at least one taxonomy tag

- **WHEN** an inspector reads each reference challenge's `index.md` `tags` array
- **THEN** the intersection of each challenge's tags with `{idor, access-control, jwt, path-traversal, broken-access}` SHALL be non-empty

##### Example: per-challenge tag intersection

| Slug | `tags` array | Taxonomy intersection |
|------|--------------|------------------------|
| `door-is-open` | `[idor, access-control, fastapi, sqlite]` | `{idor, access-control}` |
| `jwt-none-alg` | `[jwt, access-control, authentication, flask]` | `{jwt, access-control}` |
| `confidential-files` | `[path-traversal, access-control, lfi, php]` | `{path-traversal, access-control}` |


<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - docs/challenge/jwt-none-alg/index.md
  - docs/challenge/jwt-none-alg/src/flag.txt
  - docs/challenge/jwt-none-alg/src/app.py
  - docs/challenge/confidential-files/index.md
  - docs/challenge/confidential-files/src/index.php
  - docs/challenge/confidential-files/src/flag.txt
tests:
  - tests/challenges/confidential-files.spec.ts
  - tests/challenges/jwt-none-alg.spec.ts
-->

---
### Requirement: Pack reference document covers IDOR, JWT alg:none, and Path traversal primitives

The pack's reference document `Per-primitive fix hints` section SHALL contain a subsection (`###`) for each of these three primitives: `IDOR`, `JWT alg:none`, and `Path traversal`. Each subsection SHALL contain at least one concrete fix description (not a placeholder). The subsection SHALL NOT contain the forbidden words `TBD`, `TODO`, `FIXME`, `???`, or `TKTK`.

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - .agent/skills/wxl-creator/reference/a01-access-control.md
-->

#### Scenario: Three primitive subsections exist with concrete content

- **WHEN** an inspector reads the `Per-primitive fix hints` section of `.agent/skills/wxl-creator/reference/a01-access-control.md`
- **THEN** the section SHALL contain `###` subsections titled `IDOR`, `JWT alg:none`, and `Path traversal`, and each subsection SHALL contain at least one fix description and SHALL NOT contain `TBD`, `TODO`, `FIXME`, `???`, or `TKTK`

<!-- @trace
source: a01-access-control-template-pack
updated: 2026-05-31
code:
  - docs/challenge/jwt-none-alg/index.md
  - docs/challenge/jwt-none-alg/src/flag.txt
  - docs/challenge/jwt-none-alg/src/app.py
  - docs/challenge/confidential-files/index.md
  - docs/challenge/confidential-files/src/index.php
  - docs/challenge/confidential-files/src/flag.txt
tests:
  - tests/challenges/confidential-files.spec.ts
  - tests/challenges/jwt-none-alg.spec.ts
-->