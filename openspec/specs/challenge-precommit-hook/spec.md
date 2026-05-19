# challenge-precommit-hook Specification

## Purpose

Enforces challenge integrity at commit time via a git pre-commit hook that automatically validates and analyzes all staged challenge files, blocking commits when required files are missing or validation/analysis checks fail.

## Requirements

### Requirement: Slug derivation from staged files

The system SHALL accept a list of staged file paths and derive the set of affected challenge slugs. A file path is considered challenge-related if it matches the pattern `docs/challenge/<slug>/`. The slug SHALL be extracted as the first path segment after `docs/challenge/`. Duplicate slugs SHALL be deduplicated.

#### Scenario: Single challenge file staged

- **WHEN** the staged file list contains `docs/challenge/sqli-demo/index.md`
- **THEN** the system derives slug `sqli-demo`

#### Scenario: Multiple files in the same challenge

- **WHEN** the staged file list contains `docs/challenge/sqli-demo/index.md` and `docs/challenge/sqli-demo/src/app.py`
- **THEN** the system derives a single slug `sqli-demo` (deduplicated)

#### Scenario: Files from multiple challenges

- **WHEN** the staged file list contains `docs/challenge/sqli-demo/src/app.py` and `docs/challenge/php-demo/index.md`
- **THEN** the system derives slugs `sqli-demo` and `php-demo`

#### Scenario: Non-challenge files staged

- **WHEN** the staged file list contains only files outside `docs/challenge/` (e.g., `scripts/foo.ts`, `README.md`)
- **THEN** the system derives zero slugs and exits with code 0 (no validation needed)

#### Scenario: Legacy flat file staged

- **WHEN** the staged file list contains `docs/challenge/old-chall.md`
- **THEN** the system derives slug `old-chall`


<!-- @trace
source: validate-challenge-precommit
updated: 2026-04-01
code:
  - scripts/pre-commit.sh
  - scripts/challenge-lint-staged.ts
  - GEMINI.md
tests:
  - tests/pre-commit-sh.test.ts
  - tests/challenge-lint-staged.test.ts
-->

---
### Requirement: Validation execution per slug

For each derived slug, the system SHALL run the existing `validateChallenge` function (from `challenge-validate.ts`) and the existing `validateChallenge` + `analyzeChallenge` functions (from `challenge-analyze.ts`). The system SHALL reuse these functions by importing them, not by spawning child processes.

#### Scenario: All slugs pass validation and analysis

- **WHEN** all derived slugs pass both validate and analyze with zero errors and zero warnings
- **THEN** the script exits with code 0

#### Scenario: One slug fails validation

- **WHEN** slug `sqli-demo` fails `validateChallenge` with errors
- **THEN** the script prints the validation errors for `sqli-demo` to stderr and exits with code 1

#### Scenario: One slug has analyze warnings

- **WHEN** slug `fastapi-demo` passes validation but `analyzeChallenge` returns warnings (e.g., hardcoded localhost, flag format mismatch)
- **THEN** the script prints the warnings for `fastapi-demo` to stderr and exits with code 1


<!-- @trace
source: validate-challenge-precommit
updated: 2026-04-01
code:
  - scripts/pre-commit.sh
  - scripts/challenge-lint-staged.ts
  - GEMINI.md
tests:
  - tests/pre-commit-sh.test.ts
  - tests/challenge-lint-staged.test.ts
-->

---
### Requirement: Pre-commit hook registration

The project SHALL use `simple-git-hooks` to register a pre-commit hook. The hook SHALL execute `scripts/pre-commit.sh`. The shell script SHALL query `git diff --cached --name-only --diff-filter=ACMRD` to obtain all staged file paths (including deletions), filter for paths matching `docs/challenge/**`, and pass matching paths to `scripts/challenge-lint-staged.ts`. If no challenge files are staged, the script SHALL exit 0 immediately.

#### Scenario: Developer runs pnpm install

- **WHEN** a developer runs `pnpm install` on a fresh clone
- **THEN** `simple-git-hooks` installs the pre-commit hook via the `prepare` script in `package.json`

#### Scenario: Developer commits challenge changes

- **WHEN** a developer stages files under `docs/challenge/` and runs `git commit`
- **THEN** the pre-commit hook queries staged files via git, filters for challenge paths, and passes them to `challenge-lint-staged.ts`

#### Scenario: Developer commits non-challenge changes only

- **WHEN** a developer stages only files outside `docs/challenge/` and runs `git commit`
- **THEN** the pre-commit hook finds no matching challenge paths and exits 0 without invoking `challenge-lint-staged.ts`


<!-- @trace
source: validate-challenge-precommit
updated: 2026-04-01
code:
  - scripts/pre-commit.sh
  - scripts/challenge-lint-staged.ts
  - GEMINI.md
tests:
  - tests/pre-commit-sh.test.ts
  - tests/challenge-lint-staged.test.ts
-->

---
### Requirement: Commit blocking on failure

The pre-commit hook SHALL block the commit (exit code 1) if any challenge fails validation or produces analyze warnings. The hook SHALL allow the commit (exit code 0) only when all affected challenges pass validation and analysis with no errors and no warnings.

#### Scenario: Commit blocked due to missing flag file

- **WHEN** a staged challenge `xss-basic` is missing `src/flag.txt`
- **THEN** the commit is blocked with a message indicating the flag file is not found

#### Scenario: Commit allowed after fixing issues

- **WHEN** the developer fixes the missing flag file, re-stages, and commits again
- **THEN** validation passes and the commit proceeds


<!-- @trace
source: validate-challenge-precommit
updated: 2026-04-01
code:
  - scripts/pre-commit.sh
  - scripts/challenge-lint-staged.ts
  - GEMINI.md
tests:
  - tests/pre-commit-sh.test.ts
  - tests/challenge-lint-staged.test.ts
-->

---
### Requirement: Staged snapshot validation

The pre-commit hook SHALL validate the staged snapshot, not the working tree. Before running validation, the hook SHALL use `git stash push --keep-index --quiet` to temporarily hide unstaged changes so that only staged content is visible to the validator. After validation completes (regardless of pass or fail), the hook SHALL restore the stash with `git stash pop --quiet`. This ensures that unstaged files on disk do not mask missing files in the staged commit.

#### Scenario: Unstaged companion file does not mask missing staged file

- **WHEN** a developer stages `docs/challenge/xss-basic/index.md` but does NOT stage `docs/challenge/xss-basic/src/flag.txt` (the file exists on disk but is unstaged)
- **THEN** the pre-commit hook stashes unstaged changes, validation runs against the staged-only state, detects that `src/flag.txt` is missing from the staged tree, and blocks the commit

#### Scenario: Stash is restored after validation failure

- **WHEN** the pre-commit hook blocks a commit due to validation errors
- **THEN** unstaged working tree changes are restored via `git stash pop` and the developer's working directory is unchanged

#### Scenario: No unstaged changes to stash

- **WHEN** there are no unstaged changes (working tree matches index)
- **THEN** the hook skips stash/pop and runs validation directly


<!-- @trace
source: validate-challenge-precommit
updated: 2026-04-01
code:
  - scripts/pre-commit.sh
  - scripts/challenge-lint-staged.ts
  - GEMINI.md
tests:
  - tests/pre-commit-sh.test.ts
  - tests/challenge-lint-staged.test.ts
-->

---
### Requirement: Deleted file detection

The pre-commit hook SHALL detect staged file deletions. The `git diff --cached` query SHALL include the `D` diff filter (i.e., `--diff-filter=ACMRD`) so that deleted challenge files are included in the file list passed to `challenge-lint-staged.ts`. This ensures that deleting a required file (e.g., `src/flag.txt`, `src/app.py`) from a challenge triggers validation of the affected slug.

#### Scenario: Deletion of required file blocks commit

- **WHEN** a developer stages a deletion of `docs/challenge/sqli-demo/src/flag.txt` via `git rm`
- **THEN** the pre-commit hook includes `docs/challenge/sqli-demo/src/flag.txt` in the file list, derives slug `sqli-demo`, runs validation, detects that `flag.txt` is missing, and blocks the commit

#### Scenario: Deletion of non-required file passes

- **WHEN** a developer deletes `docs/challenge/sqli-demo/src/notes.txt` (not a required file)
- **THEN** the pre-commit hook derives slug `sqli-demo`, runs validation, all required files still exist, and the commit proceeds

#### Scenario: Whole challenge directory removal passes

- **WHEN** a developer runs `git rm -r docs/challenge/old-slug/` to remove an entire challenge (the directory no longer exists on disk)
- **THEN** the pre-commit hook derives slug `old-slug`, checks that the directory `docs/challenge/old-slug/` does NOT exist on disk, skips validation for that slug, and allows the commit

#### Scenario: Whole challenge rename passes

- **WHEN** a developer renames a challenge by deleting `docs/challenge/old-name/` and creating `docs/challenge/new-name/` in the same commit
- **THEN** the pre-commit hook derives both slugs, skips `old-name` (directory no longer exists on disk), validates `new-name` normally, and allows the commit if `new-name` is valid

#### Scenario: Incomplete staging blocks commit

- **WHEN** a developer stages `docs/challenge/new-slug/src/app.py` but does NOT stage `docs/challenge/new-slug/index.md` (the directory exists on disk but `index.md` is not present in the staged snapshot)
- **THEN** the pre-commit hook derives slug `new-slug`, checks that the directory `docs/challenge/new-slug/` EXISTS on disk, detects that `fullDiscover` returns no challenge file (because `index.md` is missing from the staged snapshot), reports an error indicating the challenge is incomplete, and blocks the commit

#### Scenario: Deleting only index.md blocks commit

- **WHEN** a developer runs `git rm docs/challenge/sqli-demo/index.md` without removing the rest of the challenge directory
- **THEN** the pre-commit hook derives slug `sqli-demo`, checks that the directory `docs/challenge/sqli-demo/` EXISTS on disk, detects that `index.md` is missing, reports an error, and blocks the commit

<!-- @trace
source: validate-challenge-precommit
updated: 2026-04-01
code:
  - scripts/pre-commit.sh
  - scripts/challenge-lint-staged.ts
  - GEMINI.md
tests:
  - tests/pre-commit-sh.test.ts
  - tests/challenge-lint-staged.test.ts
-->