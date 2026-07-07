## ADDED Requirements

### Requirement: Skill collects challenge parameters interactively

The `wxl-create` skill SHALL prompt the user via plain-text question blocks to collect challenge creation parameters in multiple rounds. The skill SHALL NOT use `AskUserQuestion`, `EnterPlanMode`, or any host-agent-specific tool. For each question, the skill SHALL emit a question block listing options (when applicable), then wait for the next user message before continuing. If the user's initial prompt already provides some parameters, the skill SHALL extract them and skip the corresponding questions.

The plain-text question block SHALL follow this shape:

```
📋 Round <N> — <topic>:
  1) <option-A>
  2) <option-B>
  3) <option-C>
Please reply with a number, the option name, or a custom value.
```

**Round 1 (required)**:
- Challenge name (slug): kebab-case identifier
- Backend type: `flask`, `fastapi`, or `php`
- Vulnerability type: free-text (e.g., SQLi, XSS, SSRF, LFI, RCE)

**Round 2 (content)**:
- Challenge description: scenario narrative for code generation
- Difficulty: `easy`, `medium`, or `hard`

**Round 3 (optional with defaults)**:
- Flag format: defaults to `FLAG{<slug>_<random8hex>}`
- Title: defaults to slug converted to Title Case

#### Scenario: All parameters provided in initial prompt

- **WHEN** the user invokes the skill with "name: xss-basic, backend: flask, vuln: reflected XSS, desc: a search form with XSS, difficulty: easy"
- **THEN** the skill SHALL extract all provided parameters and skip all plain-text question rounds

#### Scenario: No parameters provided

- **WHEN** the user invokes the skill with no arguments
- **THEN** the skill SHALL emit Round 1 plain-text question blocks first, then Round 2, then Round 3, waiting for a user response between rounds

#### Scenario: Partial parameters provided

- **WHEN** the user provides only the slug and vulnerability type
- **THEN** the skill SHALL skip those question blocks and emit the remaining ones in order

#### Scenario: Host-agent-neutral primitive check

- **WHEN** a maintainer greps the skill prose for `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, or `subagent_type`
- **THEN** no matches SHALL be found under `.agent/skills/wxl-create/`

### Requirement: Skill calls create:challenge for scaffolding

The `wxl-create` skill SHALL invoke `pnpm create:challenge --name <slug> --backend <backend> --difficulty <difficulty> --flag <flag> --title <title>` via Bash after collecting all parameters. The skill SHALL NOT duplicate the scaffolding logic.

#### Scenario: Successful scaffold

- **WHEN** all parameters are collected and no collision exists
- **THEN** the skill SHALL run `pnpm create:challenge` with all collected arguments and report the scaffold result

#### Scenario: Scaffold collision detected

- **WHEN** `pnpm create:challenge` exits with code 1 due to an existing challenge
- **THEN** the skill SHALL display the error and ask the user whether to choose a different name or abort

### Requirement: Skill generates vulnerable application code

After scaffolding, the `wxl-create` skill SHALL read the generated skeleton file (`src/app.py` or `src/index.php`) and rewrite it with application code that contains a real, exploitable vulnerability matching the specified vulnerability type and description.

The generated code SHALL:
- Maintain the same entry point structure as the skeleton (route definitions, imports)
- Read the flag from `/flag.txt` (consistent with the skeleton pattern)
- Contain a vulnerability that is exploitable but not trivially obvious
- Include appropriate packages in the frontmatter `packages` array if the vulnerability requires additional Python packages (e.g., `sqlite3` for SQLi)

#### Scenario: SQL injection vulnerability generation

- **WHEN** the vulnerability type is "SQLi" and the backend is "flask"
- **THEN** the skill SHALL generate a Flask app with a SQL injection vulnerability (e.g., unsanitized user input in a SQL query) and add relevant packages to frontmatter

#### Scenario: XSS vulnerability generation

- **WHEN** the vulnerability type is "XSS" and the backend is "fastapi"
- **THEN** the skill SHALL generate a FastAPI app with a cross-site scripting vulnerability (e.g., reflected user input in HTML response without escaping)

#### Scenario: PHP vulnerability generation

- **WHEN** the backend is "php" and the vulnerability type is "LFI"
- **THEN** the skill SHALL generate a PHP script with a local file inclusion vulnerability

### Requirement: Skill updates index.md frontmatter with metadata

After generating the vulnerable code, the `wxl-create` skill SHALL update the `index.md` frontmatter to include:
- `description`: a brief challenge description derived from the collected description
- `tags`: an array of relevant tags derived from the vulnerability type and backend
- `source_visible`: set to `false` by default

The skill SHALL also update the markdown body with a meaningful challenge description.

#### Scenario: Frontmatter updated with collected metadata

- **WHEN** the skill finishes generating vulnerable code for a SQLi challenge
- **THEN** `index.md` SHALL contain `description`, `tags: [sql, injection, <backend>]`, and `source_visible: false` in its frontmatter

#### Scenario: Markdown body updated

- **WHEN** the skill finishes generating vulnerable code
- **THEN** the markdown body below the frontmatter SHALL contain a challenge description replacing the "TODO: Write challenge description here." placeholder

### Requirement: Skill uses canonical reference example for code generation style

The `wxl-create` skill SHALL use exactly one canonical challenge directory as the reference example when generating vulnerable application code for a new challenge. The canonical reference SHALL be `docs/challenge/door-is-open/`.

The skill SHALL read the canonical reference's `src/app.py` (or backend-equivalent entry point) and `index.md` before generating new code, and the generated code SHALL follow the same conventions as the canonical reference for:

- Entry point structure (route definitions, imports, framework initialisation)
- Flag file reading pattern (`/flag.txt` location and access)
- Frontmatter shape (`description`, `tags`, `tools`, `packages`, `source_visible`, `difficulty`, `date`)
- Markdown body layout (challenge narrative, hints, source visibility note)

When the canonical reference is changed in the future, both this requirement and the corresponding skill prose in `.agent/skills/wxl-create/SKILL.md` MUST be updated together in a single change.

#### Scenario: Canonical reference is door-is-open

- **WHEN** a maintainer invokes the `wxl-create` skill to scaffold a new challenge
- **THEN** the skill SHALL read `docs/challenge/door-is-open/src/app.py` and `docs/challenge/door-is-open/index.md` as the reference for code style and frontmatter shape, and SHALL NOT read any other archived demo challenge as a reference

#### Scenario: Canonical reference becomes unavailable

- **WHEN** the canonical reference directory (`docs/challenge/door-is-open/`) is missing or its `src/app.py` or `index.md` cannot be read
- **THEN** the skill SHALL halt the scaffold operation, leave no partially-generated files on disk, emit an error message containing the literal path `docs/challenge/door-is-open/`, and SHALL NOT read code-style reference content from any other location — specifically forbidden fallback sources include any directory under `.archive/`, any other directory under `docs/challenge/`, any user-supplied path, and any directory auto-discovered by globbing the filesystem

#### Scenario: Canonical reference and SKILL.md drift detection

- **WHEN** the skill prose in `.agent/skills/wxl-create/SKILL.md` references a directory that does not match the canonical reference declared in this requirement
- **THEN** a maintainer running `/spectra-audit` against the wxl-create-skill capability SHALL receive at least one finding flagging the drift

##### Example: drift detection

| SKILL.md mentions | This requirement says | Audit finding |
| --- | --- | --- |
| `docs/challenge/door-is-open/` | `docs/challenge/door-is-open/` | none |
| `docs/challenge/sqli-demo/` | `docs/challenge/door-is-open/` | drift flagged |
| `docs/challenge/some-future-demo/` | `docs/challenge/door-is-open/` | drift flagged |

### Requirement: Skill consumes capability-specific reference documents via a registry table

The `wxl-create` skill SHALL maintain a registry table in `SKILL.md` (and its localized mirror in `SKILL.zhTW.md`) mapping `vuln`-trigger regular expressions to reference documents under `.agent/skills/wxl-create/reference/`. When the collected `vuln` matches any registry-table trigger regex, the skill SHALL read the corresponding `reference/<capability>.md` before proceeding to subsequent code-generation steps. The registry table is the sole extension point for adding new capability packs: new packs SHALL be added by appending a row, and SHALL NOT require modifying this Requirement.

The registry table SHALL contain at least the following columns: `Trigger regex`, `Reference file`. At the time of this change, the table SHALL contain at least one row: trigger regex `/idor|jwt|path.?traversal|access.?control|broken.?access/i` mapped to `reference/a01-access-control.md`.

#### Scenario: Registry table exists in SKILL.md with at least one row

- **WHEN** an inspector reads `.agent/skills/wxl-create/SKILL.md`
- **THEN** the file SHALL contain a Markdown table with header columns `Trigger regex` and `Reference file`, and the table SHALL contain at least one data row referencing `reference/a01-access-control.md`

#### Scenario: A01-class vuln triggers reference-document read before code generation

- **WHEN** a `wxl-create` session is invoked with `vuln: IDOR` (or `vuln: JWT bypass`, `vuln: path traversal`, `vuln: Broken Access Control`)
- **THEN** the skill SHALL read `.agent/skills/wxl-create/reference/a01-access-control.md` before reading the canonical reference example or generating vulnerable application code

#### Scenario: Non-matching vuln SHALL NOT trigger reference-document read

- **WHEN** a `wxl-create` session is invoked with `vuln: reflected XSS` (or any string that matches no registry-table trigger regex)
- **THEN** the skill SHALL NOT read `.agent/skills/wxl-create/reference/a01-access-control.md` and SHALL proceed directly to the canonical reference example

#### Scenario: Localized mirror SHALL stay in parity

- **WHEN** an inspector compares the registry-table rows in `SKILL.md` and `SKILL.zhTW.md`
- **THEN** the two tables SHALL contain the same set of rows (same trigger regexes and same reference file paths)

### Requirement: Skill generates a Playwright e2e spec for each new challenge

After generating vulnerable application code, the `wxl-create` skill SHALL write a Playwright e2e exploit spec to `tests/challenges/<slug>.spec.ts`. The spec SHALL be derived from the template at `.agent/skills/wxl-create/templates/exploit-spec.ts.tmpl` by substituting the placeholders `{{SLUG}}`, `{{BASE_URL}}`, `{{EXPLOIT_PATH}}`, `{{EXPLOIT_PAYLOAD}}`, and `{{FLAG_REGEX}}`. The generated spec SHALL be runnable as-is via `pnpm exec playwright test tests/challenges/<slug>.spec.ts` and SHALL contain at least one test that asserts the response body matches `{{FLAG_REGEX}}` after the exploit is performed.

#### Scenario: Spec file created

- **WHEN** the skill completes the vuln code generation step for slug `xss-basic`
- **THEN** the file `tests/challenges/xss-basic.spec.ts` SHALL exist and SHALL contain an `import { test, expect } from '@playwright/test'` line and at least one `expect(<body>).toMatch(FLAG_REGEX)` assertion

#### Scenario: Template not found

- **WHEN** the skill attempts to read `.agent/skills/wxl-create/templates/exploit-spec.ts.tmpl` and the file does not exist
- **THEN** the skill SHALL halt the Create flow, emit an error message identifying the missing template, and SHALL NOT leave a partially-written `tests/challenges/<slug>.spec.ts` on disk

### Requirement: Skill performs best-effort exploit self-test via chrome-devtools-mcp

After writing the Playwright spec, the `wxl-create` skill SHALL attempt to verify the freshly generated vuln is exploitable by driving a real Chromium instance through `chrome-devtools-mcp` tools (`navigate_page`, `evaluate_script`, etc.). The skill SHALL make up to three attempts: each failed attempt MAY trigger one revision of `docs/challenge/<slug>/src/<app>` followed by a retry. If the third attempt still fails, or if `chrome-devtools-mcp` is unavailable, or if `pnpm docs:dev` is not running on `localhost:5173`, the skill SHALL gracefully degrade by emitting a message instructing the user to manually run `pnpm challenge:verify <slug>` and SHALL continue to the next step rather than halting the workflow.

#### Scenario: Successful self-test on first attempt

- **WHEN** the skill performs the self-test against a correctly-implemented vuln and `chrome-devtools-mcp` is available
- **THEN** the self-test SHALL succeed within one attempt and the skill SHALL emit a "self-test passed" message before proceeding

#### Scenario: chrome-devtools-mcp unavailable

- **WHEN** the skill's host agent runtime does not have `chrome-devtools-mcp` tools loaded
- **THEN** the skill SHALL skip the self-test, emit a "MCP unavailable; please run pnpm challenge:verify <slug> manually" message, and continue the workflow

#### Scenario: Dev server not running

- **WHEN** the self-test cannot reach `http://localhost:5173/challenge/<slug>/`
- **THEN** the skill SHALL skip the self-test, emit a "dev server not running; please start pnpm docs:dev and run pnpm challenge:verify <slug> manually" message, and continue the workflow

#### Scenario: Three self-test attempts all fail

- **WHEN** the skill attempts the self-test three times with two revisions of the vuln code and still cannot retrieve the flag
- **THEN** the skill SHALL stop further revisions, emit a "self-test inconclusive after 3 attempts; please run pnpm challenge:verify <slug> manually and inspect" message, and continue the workflow

### Requirement: Skill triggers challenge:verify automatically at the end of the Create flow

After the metadata frontmatter update step, the `wxl-create` skill SHALL execute `pnpm challenge:verify <slug>` (without `--blind`) and hand the result **entirely** to the `wxl-verify` skill's gate and auto-fix loop, which owns the branch decision. The Create flow SHALL NOT restate the exit-code branching; `wxl-verify` determines whether the gate is clean (emit a completion summary and stop) or non-clean — exit code 1 **or** exit code 0 with L1/L2 warnings in stdout — in which case its auto-fix loop runs. The L4 blind-solve gate SHALL NOT be auto-triggered by the Create flow — it is reserved for explicit maintainer invocation via the `wxl-crosscheck` skill prior to a release.

#### Scenario: Verify passes on first attempt

- **WHEN** the skill completes the Create flow and `pnpm challenge:verify <slug>` exits with code 0 and reports no L1/L2 warnings
- **THEN** the skill SHALL emit a "challenge ready" completion summary listing the verify layers that passed and SHALL stop the workflow

#### Scenario: Verify fails and triggers the wxl-verify fix loop

- **WHEN** `pnpm challenge:verify <slug>` exits with code 1 after Create
- **THEN** the skill SHALL enter the `wxl-verify` auto-fix loop, parse the failed layer's output, propose fixes, and respect the configured `max_fix_attempts` limit

#### Scenario: L4 is not auto-triggered by Create

- **WHEN** the skill completes the Create flow
- **THEN** the skill SHALL NOT invoke `pnpm challenge:verify <slug> --blind` even if verify passes; the L4 gate SHALL be invoked only via the `wxl-crosscheck` skill
