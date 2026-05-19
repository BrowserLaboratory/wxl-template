## ADDED Requirements

### Requirement: Challenge validate script

The system SHALL provide a `pnpm challenge:validate [slug]` CLI command that validates challenge structure and frontmatter correctness.

#### Scenario: Validate single challenge passes

- **WHEN** user runs `pnpm challenge:validate fastapi-demo` on a correctly structured challenge
- **THEN** the script outputs per-item ✓/✗ results for: frontmatter required fields, backend-app type match, app file existence, flag file existence, tools field validity, commands field validity, .fsignore syntax
- **AND** the final output is "All checks passed."

#### Scenario: Validate all challenges

- **WHEN** user runs `pnpm challenge:validate` without a slug argument
- **THEN** the script validates all challenges under `docs/challenge/*/index.md`

#### Scenario: Validate detects missing app file

- **WHEN** the challenge frontmatter references `app: app.py` but `src/app.py` does not exist
- **THEN** the script outputs ✗ for the app file check with a message indicating the file is missing

#### Scenario: Validate detects invalid tools value

- **WHEN** frontmatter contains `tools: [browser, invalid_tab]`
- **THEN** the script outputs ✗ indicating `invalid_tab` is not a valid tab ID

### Requirement: Challenge analyze script

The system SHALL provide a `pnpm challenge:analyze [slug]` CLI command that performs validation plus content analysis.

#### Scenario: Analyze includes validation

- **WHEN** user runs `pnpm challenge:analyze fastapi-demo`
- **THEN** the script first runs all validation checks (same as validate)
- **AND** if validation fails, analysis is skipped with an error message

#### Scenario: Analyze outputs file statistics

- **WHEN** validation passes
- **THEN** the script outputs: file count and sizes in `src/`, estimated encrypted WASM payload size, flag format check (FLAG{...} or CTF{...}), tools/commands enablement summary

#### Scenario: Analyze detects potential issues

- **WHEN** the app source contains hardcoded host/port references or imports of unsupported Python modules
- **THEN** the script outputs warnings for each detected issue

#### Scenario: Analyze all challenges produces overview

- **WHEN** user runs `pnpm challenge:analyze` without a slug
- **THEN** the script analyzes all challenges and outputs a summary table with: slug, backend, difficulty, file count, estimated payload size, and any warnings
