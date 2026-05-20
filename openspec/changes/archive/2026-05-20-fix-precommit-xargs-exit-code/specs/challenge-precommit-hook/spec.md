## ADDED Requirements

### Requirement: Pre-commit hook exit code SHALL be cross-platform stable

`scripts/pre-commit.sh` SHALL exit with the same exit code on every platform where it runs (currently: BSD-based macOS and GNU/Linux). Specifically:

- When `scripts/challenge-lint-staged.ts` exits with code 1 (validation failure), `scripts/pre-commit.sh` SHALL also exit with exit code 1.
- When `scripts/challenge-lint-staged.ts` exits with code 0 (validation success), `scripts/pre-commit.sh` SHALL also exit with exit code 0.

The script SHALL NOT introduce platform-specific exit code translation. In particular, the script SHALL NOT rely on `xargs` to forward the child process's exit code, because GNU `xargs` translates child exit codes in the range 1–125 into 123 while BSD `xargs` forwards them unchanged, and this divergence has previously caused the test suite at `tests/pre-commit-sh.test.ts` to PASS on macOS and FAIL on Linux CI (issue surfaced 2026-05-20 when the new `ci-quality-gates` workflow first ran the suite on `ubuntu-latest`).

The forwarding mechanism SHALL invoke `scripts/challenge-lint-staged.ts` such that its native exit code is observed directly by the shell (e.g., by passing the staged file list as command arguments rather than piping through `xargs`). Any future maintenance that reintroduces `xargs` or any other intermediary that may rewrite exit codes MUST also reintroduce an exit code normalization step that guarantees the SHALL conditions above.

#### Scenario: Validation failure on macOS exits 1

- **WHEN** `scripts/pre-commit.sh` runs on macOS (BSD userland) and `challenge-lint-staged.ts` exits with code 1
- **THEN** `scripts/pre-commit.sh` SHALL exit with code 1
- **AND** the calling shell's `$?` SHALL observe exactly the value 1

#### Scenario: Validation failure on Linux exits 1

- **WHEN** `scripts/pre-commit.sh` runs on Linux (GNU userland, e.g. `ubuntu-latest` GitHub Actions runner) and `challenge-lint-staged.ts` exits with code 1
- **THEN** `scripts/pre-commit.sh` SHALL exit with code 1
- **AND** the calling shell's `$?` SHALL observe exactly the value 1
- **AND** the exit code SHALL NOT be 123 (which would indicate that GNU `xargs` translation has leaked into the contract)

#### Scenario: Validation success on either platform exits 0

- **WHEN** `scripts/pre-commit.sh` runs on either macOS or Linux and `challenge-lint-staged.ts` exits with code 0
- **THEN** `scripts/pre-commit.sh` SHALL exit with code 0 on both platforms

#### Scenario: `tests/pre-commit-sh.test.ts` PASSes on both platforms

- **WHEN** `pnpm test --run tests/pre-commit-sh.test.ts` is invoked
- **THEN** the 4 scenarios that assert `result.exitCode === 1` (incomplete-challenge cases at `tests/pre-commit-sh.test.ts` line 138, 146, 176, 192) SHALL PASS on macOS
- **AND** the same 4 scenarios SHALL PASS on Linux (e.g., `ubuntu-latest`)
