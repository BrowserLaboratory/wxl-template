## ADDED Requirements

### Requirement: Skill collects challenge parameters interactively

The skill SHALL use `AskUserQuestion` to collect challenge creation parameters in multiple rounds. If the user's initial prompt already provides some parameters, the skill SHALL extract them and skip the corresponding questions.

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
- **THEN** the skill SHALL extract all provided parameters and skip all AskUserQuestion rounds

#### Scenario: No parameters provided

- **WHEN** the user invokes the skill with no arguments
- **THEN** the skill SHALL ask Round 1 questions first, then Round 2, then Round 3

#### Scenario: Partial parameters provided

- **WHEN** the user provides only the slug and vulnerability type
- **THEN** the skill SHALL skip those questions and ask the remaining ones in order

---

### Requirement: Skill calls create:challenge for scaffolding

The skill SHALL invoke `pnpm create:challenge --name <slug> --backend <backend> --difficulty <difficulty> --flag <flag> --title <title>` via Bash after collecting all parameters. The skill SHALL NOT duplicate the scaffolding logic.

#### Scenario: Successful scaffold

- **WHEN** all parameters are collected and no collision exists
- **THEN** the skill SHALL run `pnpm create:challenge` with all collected arguments and report the scaffold result

#### Scenario: Scaffold collision detected

- **WHEN** `pnpm create:challenge` exits with code 1 due to an existing challenge
- **THEN** the skill SHALL display the error and ask the user whether to choose a different name or abort

---

### Requirement: Skill generates vulnerable application code

After scaffolding, the skill SHALL read the generated skeleton file (`src/app.py` or `src/index.php`) and rewrite it with application code that contains a real, exploitable vulnerability matching the specified vulnerability type and description.

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

---

### Requirement: Skill updates index.md frontmatter with metadata

After generating the vulnerable code, the skill SHALL update the `index.md` frontmatter to include:
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

---

### Requirement: Skill runs analyze and validate after creation

The skill SHALL execute `pnpm challenge:analyze <slug>` followed by `pnpm challenge:validate <slug>` after completing all file generation. The skill SHALL display the results of both commands to the user.

#### Scenario: Both checks pass

- **WHEN** analyze and validate both exit with code 0
- **THEN** the skill SHALL display a success message and the challenge is complete

#### Scenario: Validate fails

- **WHEN** `pnpm challenge:validate <slug>` exits with a non-zero code
- **THEN** the skill SHALL enter the auto-fix loop

#### Scenario: Analyze reports warnings

- **WHEN** `pnpm challenge:analyze <slug>` reports warnings (e.g., hardcoded localhost, flag format mismatch)
- **THEN** the skill SHALL display the warnings and enter the auto-fix loop to address them

---

### Requirement: Skill auto-fixes validation errors with user confirmation

When validation or analysis fails, the skill SHALL enter an auto-fix loop:

1. Parse the error/warning output
2. Attempt to fix the identified issues automatically (e.g., fix frontmatter fields, add missing files, correct flag format)
3. Display the proposed changes (diff) to the user
4. Wait for user confirmation before applying the changes
5. After applying, re-run analyze and validate
6. Repeat until all checks pass or the loop limit is reached

#### Scenario: Auto-fix succeeds on first attempt

- **WHEN** validate fails due to a missing `description` field in frontmatter
- **THEN** the skill SHALL add the field, show the diff, wait for user confirmation, apply the fix, and re-validate successfully

#### Scenario: User rejects a proposed fix

- **WHEN** the skill proposes an auto-fix and the user rejects it
- **THEN** the skill SHALL display the remaining errors and stop the loop without applying the rejected fix

#### Scenario: Multiple fixes needed

- **WHEN** both analyze warnings and validate errors exist
- **THEN** the skill SHALL address all issues in a single fix attempt before re-running validation

---

### Requirement: Fix loop has a configurable maximum iteration limit

The auto-fix loop SHALL have a maximum iteration limit to prevent infinite loops. The default limit SHALL be 10 attempts.

The limit SHALL be configurable via `.agent/skills/wxl-creator/config.local.md` with YAML frontmatter:

```yaml
---
max_fix_attempts: 10
---
```

If the config file does not exist, the skill SHALL use the default value of 10.

#### Scenario: Loop reaches maximum limit

- **WHEN** the auto-fix loop reaches the configured maximum (e.g., 10 attempts) without all checks passing
- **THEN** the skill SHALL display the remaining errors/warnings and stop, informing the user that the limit has been reached

#### Scenario: Custom limit configured

- **WHEN** `config.local.md` contains `max_fix_attempts: 5`
- **THEN** the auto-fix loop SHALL stop after 5 attempts if checks still fail

#### Scenario: Config file does not exist

- **WHEN** `.agent/skills/wxl-creator/config.local.md` does not exist
- **THEN** the skill SHALL use the default limit of 10 attempts
