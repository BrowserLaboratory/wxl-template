## ADDED Requirements

### Requirement: CONTRIBUTE describes git flow branch model

The `CONTRIBUTE.md` file SHALL describe the git flow branching strategy used in this project, including the purpose and lifetime of `main`, `staging`, `feature/*`, `bugfix/*`, and `hotfix/*` branches.

#### Scenario: Contributor knows which branch to branch from

- **WHEN** a contributor reads the branch model section
- **THEN** it SHALL be unambiguous which branch to base a feature branch on and which branch to target for a PR

#### Scenario: Hotfix branch rules are documented

- **WHEN** a contributor needs to patch a production bug
- **THEN** the guide SHALL specify that `hotfix/*` branches from `main` and merges into both `main` and `staging`

### Requirement: CONTRIBUTE describes PR submission process

The `CONTRIBUTE.md` SHALL describe the end-to-end process for submitting a pull request, from forking the repository to having the PR merged.

#### Scenario: PR targets the correct base branch

- **WHEN** a contributor submits a feature PR
- **THEN** the guide SHALL require that the PR targets `staging`, not `main`

#### Scenario: PR description requirements are stated

- **WHEN** a contributor opens a PR
- **THEN** the guide SHALL specify that the PR description MUST include: a summary of changes, the motivation, and a test plan

### Requirement: CONTRIBUTE describes commit message format

The `CONTRIBUTE.md` SHALL specify the required commit message format, using Conventional Commits with gitmoji prefix (e.g., `✨ feat: add login page`).

#### Scenario: Commit message format is shown with examples

- **WHEN** a contributor reads the commit message section
- **THEN** it SHALL show the format pattern and at least three concrete examples covering feat, fix, and refactor types

#### Scenario: Breaking change notation is documented

- **WHEN** a commit introduces a breaking change
- **THEN** the guide SHALL specify that `BREAKING CHANGE:` MUST appear in the commit footer

### Requirement: CONTRIBUTE describes issue reporting process

The `CONTRIBUTE.md` SHALL describe how to report bugs and request features via GitHub Issues.

#### Scenario: Bug report requirements are stated

- **WHEN** a contributor wants to report a bug
- **THEN** the guide SHALL specify the required information: reproduction steps, expected behavior, actual behavior, and environment details
