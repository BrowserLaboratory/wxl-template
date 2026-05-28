# wxl-creator-skill Specification

## Purpose

Provides an interactive AI skill that guides challenge authors through creating new web exploitation challenges, from collecting parameters and scaffolding files to generating vulnerable application code and auto-fixing validation errors.

## Requirements

### Requirement: Skill collects challenge parameters interactively

The skill SHALL prompt the user via plain-text question blocks to collect challenge creation parameters in multiple rounds. The skill SHALL NOT use `AskUserQuestion`, `EnterPlanMode`, or any host-agent-specific tool. For each question, the skill SHALL emit a question block listing options (when applicable), then wait for the next user message before continuing. If the user's initial prompt already provides some parameters, the skill SHALL extract them and skip the corresponding questions.

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
- **THEN** no matches SHALL be found under `.agent/skills/wxl-creator/`


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Skill calls create:challenge for scaffolding

The skill SHALL invoke `pnpm create:challenge --name <slug> --backend <backend> --difficulty <difficulty> --flag <flag> --title <title>` via Bash after collecting all parameters. The skill SHALL NOT duplicate the scaffolding logic.

#### Scenario: Successful scaffold

- **WHEN** all parameters are collected and no collision exists
- **THEN** the skill SHALL run `pnpm create:challenge` with all collected arguments and report the scaffold result

#### Scenario: Scaffold collision detected

- **WHEN** `pnpm create:challenge` exits with code 1 due to an existing challenge
- **THEN** the skill SHALL display the error and ask the user whether to choose a different name or abort


<!-- @trace
source: wxl-creator-skill
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/door-is-open/index.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - docs/challenge/door-is-open/src/flag.txt
  - .vitepress/theme/components/BrowserPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
-->

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


<!-- @trace
source: wxl-creator-skill
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/door-is-open/index.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - docs/challenge/door-is-open/src/flag.txt
  - .vitepress/theme/components/BrowserPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
-->

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


<!-- @trace
source: wxl-creator-skill
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/door-is-open/index.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - docs/challenge/door-is-open/src/flag.txt
  - .vitepress/theme/components/BrowserPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
-->

---
### Requirement: Skill runs analyze and validate after creation

The skill SHALL execute `pnpm challenge:verify <slug>` (without `--blind`) after completing all file generation. The L1 sub-layer of `challenge:verify` invokes the previously separate `challenge:validate` check, and the L2 sub-layer invokes the previously separate `challenge:analyze` check, so this requirement preserves its historical name while delegating the orchestration to the new layered verifier. The skill SHALL display the layered results (L1 / L2 / L3) of `pnpm challenge:verify` to the user.

#### Scenario: Verify exits with code 0

- **WHEN** `pnpm challenge:verify <slug>` exits with code 0
- **THEN** the skill SHALL display a success message listing each passed layer and the challenge SHALL be considered complete

#### Scenario: Verify exits with non-zero code

- **WHEN** `pnpm challenge:verify <slug>` exits with code 1
- **THEN** the skill SHALL enter the auto-fix loop and address the failing layer

#### Scenario: Verify reports L1 or L2 warnings

- **WHEN** `pnpm challenge:verify <slug>` exits with code 0 but stdout indicates L1 / L2 warnings (e.g., hardcoded localhost reference, flag format mismatch)
- **THEN** the skill SHALL display the warnings and enter the auto-fix loop to address them


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Skill auto-fixes validation errors with user confirmation

When `pnpm challenge:verify <slug>` (without `--blind`) reports errors or warnings, the skill SHALL enter an auto-fix loop. The "user confirmation" referenced in this requirement's name SHALL be implemented as a plain-text confirmation prompt; the skill SHALL NOT invoke `AskUserQuestion` or any host-agent-specific confirmation primitive. The auto-fix loop:

1. Parse the error / warning output
2. Attempt to fix the identified issues automatically (e.g., correct frontmatter fields, add missing files, repair flag format)
3. Display the proposed changes (diff form) to the user
4. Emit a plain-text confirmation prompt and wait for the user's next message before applying the changes
5. After applying, re-run `pnpm challenge:verify <slug>`
6. Repeat until all layers pass or the loop limit is reached

The confirmation prompt SHALL be a plain-text block — NOT `AskUserQuestion` — that lists the proposed change summary and explicitly accepts `apply` / `skip` (or equivalent text) as the next response.

#### Scenario: Auto-fix succeeds on first attempt

- **WHEN** verify fails due to a missing `description` field in frontmatter
- **THEN** the skill SHALL add the field, emit a plain-text "apply this fix? reply apply / skip" prompt, wait for the user response, apply the fix on confirmation, and re-verify successfully

#### Scenario: User rejects a proposed fix

- **WHEN** the skill emits a confirmation prompt and the user replies "skip"
- **THEN** the skill SHALL display the remaining errors and stop the loop without applying the rejected fix

#### Scenario: Multiple fixes needed

- **WHEN** verify reports both L1 frontmatter errors and L3 spec assertion failures
- **THEN** the skill SHALL address all issues in a single confirmation prompt (one combined diff) before re-running verify

#### Scenario: Plain-text confirmation primitive check

- **WHEN** a maintainer greps the auto-fix loop prose for `AskUserQuestion`
- **THEN** no matches SHALL be found


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Fix loop has a configurable maximum iteration limit

The auto-fix loop SHALL have a maximum iteration limit to prevent infinite loops. The default limit SHALL be 10 attempts.

The limit SHALL be configurable via `.agent/skills/wxl-creator/config.local.md` with YAML frontmatter:

```yaml

<!-- @trace
source: wxl-creator-skill
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/door-is-open/index.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - docs/challenge/door-is-open/src/flag.txt
  - .vitepress/theme/components/BrowserPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
-->

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

---
### Requirement: Skill uses canonical reference example for code generation style

The `wxl-creator` skill SHALL use exactly one canonical challenge directory as the reference example when generating vulnerable application code for a new challenge. The canonical reference SHALL be `docs/challenge/door-is-open/`.

The skill SHALL read the canonical reference's `src/app.py` (or backend-equivalent entry point) and `index.md` before generating new code, and the generated code SHALL follow the same conventions as the canonical reference for:

- Entry point structure (route definitions, imports, framework initialisation)
- Flag file reading pattern (`/flag.txt` location and access)
- Frontmatter shape (`description`, `tags`, `tools`, `packages`, `source_visible`, `difficulty`, `date`)
- Markdown body layout (challenge narrative, hints, source visibility note)

When the canonical reference is changed in the future, both this requirement and the corresponding skill prose in `.claude/skills/wxl-creator/SKILL.md` MUST be updated together in a single change.

#### Scenario: Canonical reference is door-is-open after Change 1

- **WHEN** a maintainer invokes `/wxl-creator` to scaffold a new challenge
- **THEN** the skill SHALL read `docs/challenge/door-is-open/src/app.py` and `docs/challenge/door-is-open/index.md` as the reference for code style and frontmatter shape, and SHALL NOT read any other archived demo challenge as a reference

#### Scenario: Canonical reference becomes unavailable

- **WHEN** the canonical reference directory (`docs/challenge/door-is-open/`) is missing or its `src/app.py` or `index.md` cannot be read
- **THEN** the skill SHALL halt the scaffold operation, leave no partially-generated files on disk, emit an error message containing the literal path `docs/challenge/door-is-open/`, and SHALL NOT read code-style reference content from any other location — specifically forbidden fallback sources include any directory under `.archive/`, any other directory under `docs/challenge/`, any user-supplied path, and any directory auto-discovered by globbing the filesystem

#### Scenario: Canonical reference and SKILL.md drift detection

- **WHEN** the skill prose in `.claude/skills/wxl-creator/SKILL.md` references a directory that does not match the canonical reference declared in this requirement
- **THEN** a maintainer running `/spectra-audit` against the wxl-creator-skill capability SHALL receive at least one finding flagging the drift

##### Example: drift detection

| SKILL.md mentions | This requirement says | Audit finding |
| --- | --- | --- |
| `docs/challenge/door-is-open/` | `docs/challenge/door-is-open/` | none |
| `docs/challenge/sqli-demo/` | `docs/challenge/door-is-open/` | drift flagged |
| `docs/challenge/some-future-demo/` | `docs/challenge/door-is-open/` | drift flagged |

---
### Requirement: Skill prose is host-agent-neutral

The skill SHALL NOT depend on any host-agent-specific tool or primitive. The skill prose under `.agent/skills/wxl-creator/` (including `SKILL.md`, `SKILL.zhTW.md`, `AGENTS.md`, and all files under `reference/` and `templates/`) SHALL NOT contain references to `AskUserQuestion`, `Agent(subagent_type=...)`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, or `TaskUpdate`. The skill SHALL use only tools that are commonly available across Claude Code, Codex CLI, and Gemini CLI: `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`. MCP tools (notably `chrome-devtools-mcp`) MAY be referenced when the prose declares the call as best-effort and specifies the degraded behavior when the MCP server is unavailable.

#### Scenario: Forbidden primitive detection

- **WHEN** a maintainer runs `git grep -nE 'AskUserQuestion|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate|subagent_type' .agent/skills/wxl-creator/`
- **THEN** the command SHALL return exit code 1 (no matches) on a clean checkout of this change

#### Scenario: Cross-runtime skill activation

- **WHEN** a maintainer activates the `wxl-creator` skill in any of Claude Code, Codex CLI, or Gemini CLI
- **THEN** the skill SHALL produce equivalent prose output (modulo each runtime's natural rendering differences) and SHALL NOT fail on missing host-agent-specific tools


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Skill is installed via a single source with thin pointer files

The skill's canonical content SHALL live under `.agent/skills/wxl-creator/`. The host-agent-specific paths `.claude/skills/wxl-creator/SKILL.md`, `.codex/skills/wxl-creator/SKILL.md`, and `.gemini/skills/wxl-creator/SKILL.md` SHALL each contain a pointer file whose body is at most three lines and whose sole purpose is to direct the host agent to read `.agent/skills/wxl-creator/SKILL.md` for the canonical prose. The pointer file MAY include host-agent-specific frontmatter keys (`name`, `description`) when required by that runtime, but MUST NOT duplicate the canonical prose body.

#### Scenario: Pointer file body content

- **WHEN** a maintainer reads `.claude/skills/wxl-creator/SKILL.md`, `.codex/skills/wxl-creator/SKILL.md`, or `.gemini/skills/wxl-creator/SKILL.md`
- **THEN** the file body (excluding frontmatter) SHALL be at most three lines and SHALL contain a directive instructing the reader to consult `.agent/skills/wxl-creator/SKILL.md`

##### Example: pointer body

| Pointer path                              | Body content                                                              |
|-------------------------------------------|----------------------------------------------------------------------------|
| `.claude/skills/wxl-creator/SKILL.md`     | `Read .agent/skills/wxl-creator/SKILL.md for the canonical skill content.` |
| `.codex/skills/wxl-creator/SKILL.md`      | `Read .agent/skills/wxl-creator/SKILL.md for the canonical skill content.` |
| `.gemini/skills/wxl-creator/SKILL.md`     | `Read .agent/skills/wxl-creator/SKILL.md for the canonical skill content.` |

#### Scenario: Canonical prose location

- **WHEN** a maintainer needs to update the skill workflow
- **THEN** they SHALL edit only files under `.agent/skills/wxl-creator/` and SHALL NOT need to update the three pointer files


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Skill generates a Playwright e2e spec for each new challenge

After generating vulnerable application code in the Create flow, the skill SHALL write a Playwright e2e exploit spec to `tests/challenges/<slug>.spec.ts`. The spec SHALL be derived from the template at `.agent/skills/wxl-creator/templates/exploit-spec.ts.tmpl` by substituting the placeholders `{{SLUG}}`, `{{BASE_URL}}`, `{{EXPLOIT_PATH}}`, `{{EXPLOIT_PAYLOAD}}`, and `{{FLAG_REGEX}}`. The generated spec SHALL be runnable as-is via `pnpm exec playwright test tests/challenges/<slug>.spec.ts` and SHALL contain at least one test that asserts the response body matches `{{FLAG_REGEX}}` after the exploit is performed.

#### Scenario: Spec file created

- **WHEN** the skill completes the vuln code generation step for slug `xss-basic`
- **THEN** the file `tests/challenges/xss-basic.spec.ts` SHALL exist and SHALL contain an `import { test, expect } from '@playwright/test'` line and at least one `expect(<body>).toMatch(FLAG_REGEX)` assertion

#### Scenario: Template not found

- **WHEN** the skill attempts to read `.agent/skills/wxl-creator/templates/exploit-spec.ts.tmpl` and the file does not exist
- **THEN** the skill SHALL halt the Create flow, emit an error message identifying the missing template, and SHALL NOT leave a partially-written `tests/challenges/<slug>.spec.ts` on disk


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Skill performs best-effort exploit self-test via chrome-devtools-mcp

After writing the Playwright spec, the skill SHALL attempt to verify the freshly generated vuln is exploitable by driving a real Chromium instance through `chrome-devtools-mcp` tools (`navigate_page`, `evaluate_script`, etc.). The skill SHALL make up to three attempts: each failed attempt MAY trigger one revision of `docs/challenge/<slug>/src/<app>` followed by a retry. If the third attempt still fails, or if `chrome-devtools-mcp` is unavailable, or if `pnpm docs:dev` is not running on `localhost:5173`, the skill SHALL gracefully degrade by emitting a message instructing the user to manually run `pnpm challenge:verify <slug>` and SHALL continue to the next step rather than halting the workflow.

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


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Skill supports the mutate stage via challenge:retype

The skill SHALL expose a Mutate stage for changing an existing challenge's `backend`, `difficulty`, `tags`, or `category` after Create. The Mutate stage SHALL invoke `pnpm challenge:retype <slug>` (with appropriate `--backend`, `--difficulty`, `--tags`, or `--category` flags) and SHALL NOT directly Edit `index.md` frontmatter or rename application files in skill prose. After `pnpm challenge:retype` exits, the skill SHALL run `pnpm challenge:verify <slug>` to confirm the mutation did not break the challenge.

#### Scenario: Mutate backend within the same language family

- **WHEN** the user invokes the Mutate stage with `slug=door-is-open, backend=flask` (currently fastapi)
- **THEN** the skill SHALL invoke `pnpm challenge:retype door-is-open --backend flask`, observe exit code 0, and follow with `pnpm challenge:verify door-is-open`

#### Scenario: Mutate backend across language families requires manual handling

- **WHEN** the user invokes the Mutate stage with `slug=door-is-open, backend=php` and `pnpm challenge:retype` exits with code 2 ("manual retype required")
- **THEN** the skill SHALL surface the `pnpm challenge:retype` stderr to the user, explain that PHP retype requires manual work, and abort the Mutate stage without retrying

#### Scenario: Mutate metadata only

- **WHEN** the user invokes the Mutate stage with `slug=door-is-open, difficulty=hard, tags=[idor,access-control,fastapi,sqlite,advanced]`
- **THEN** the skill SHALL invoke `pnpm challenge:retype door-is-open --difficulty hard --tags 'idor,access-control,fastapi,sqlite,advanced'` and follow with `pnpm challenge:verify door-is-open`


<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->

---
### Requirement: Skill triggers challenge:verify automatically at the end of the Create flow

After the metadata frontmatter update step in the Create flow, the skill SHALL execute `pnpm challenge:verify <slug>` (without `--blind`). The skill SHALL parse the stdout and react accordingly: on exit code 0, emit a completion summary and stop; on exit code 1, enter the existing fix loop (governed by the "Skill auto-fixes validation errors with user confirmation" and "Fix loop has a configurable maximum iteration limit" requirements). The L4 blind-solve gate SHALL NOT be auto-triggered by the skill — it is reserved for explicit maintainer invocation prior to a release.

#### Scenario: Verify passes on first attempt

- **WHEN** the skill completes Create flow and `pnpm challenge:verify <slug>` exits with code 0
- **THEN** the skill SHALL emit a "challenge ready" message listing the verify layers that passed and SHALL stop the workflow

#### Scenario: Verify fails and triggers fix loop

- **WHEN** `pnpm challenge:verify <slug>` exits with code 1 after Create
- **THEN** the skill SHALL enter the auto-fix loop, parse the failed layer's output, propose fixes, and respect the configured `max_fix_attempts` limit

#### Scenario: L4 is not auto-triggered

- **WHEN** the skill completes the Create flow
- **THEN** the skill SHALL NOT invoke `pnpm challenge:verify <slug> --blind` even if verify passes; the L4 gate SHALL be invoked only by an explicit maintainer command

<!-- @trace
source: wxl-creator-v2-cross-agent-pipeline
updated: 2026-05-21
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/wxl-solver/spawn-runtime.ts
  - -
  - .mcp.json
  - CONTRIBUTE.md
  - package.json
  - playwright.config.ts
  - scripts/challenge-verify.ts
  - scripts/wxl-solver/build-player-package.ts
  - scripts/wxl-solver/extract-flag.ts
  - README.md
  - .codex/skills/wxl-creator/SKILL.md
  - scripts/challenge-retype.ts
  - scripts/challenge-verify-blind.ts
tests:
  - tests/unit/scripts/challenge-retype-metadata.test.ts
  - tests/unit/scripts/challenge-verify-blind-prompt.test.ts
  - tests/unit/scripts/challenge-retype-same-family.test.ts
  - tests/unit/scripts/challenge-verify-L3.test.ts
  - tests/unit/scripts/challenge-verify-layers-filter.test.ts
  - tests/unit/scripts/challenge-retype-errors.test.ts
  - tests/unit/scripts/challenge-verify-L2.test.ts
  - tests/unit/scripts/challenge-retype-spec-sync.test.ts
  - tests/unit/scripts/challenge-verify-blind-orchestration.test.ts
  - tests/unit/scripts/challenge-verify-blind-cleanup.test.ts
  - tests/unit/scripts/wxl-solver/build-player-package.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag-compare.test.ts
  - tests/unit/scripts/challenge-verify-L1.test.ts
  - tests/unit/scripts/challenge-verify-json.test.ts
  - tests/unit/scripts/challenge-verify-L4-dispatch.test.ts
  - tests/unit/scripts/challenge-retype-cross-family.test.ts
  - tests/unit/scripts/challenge-verify-orchestration.test.ts
  - tests/unit/scripts/wxl-solver/extract-flag.test.ts
  - tests/unit/scripts/challenge-verify-args.test.ts
  - tests/challenges/door-is-open.spec.ts
  - tests/unit/scripts/wxl-solver/spawn-runtime.test.ts
-->