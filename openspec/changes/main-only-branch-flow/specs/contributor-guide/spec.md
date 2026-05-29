## MODIFIED Requirements

### Requirement: CONTRIBUTE describes git flow branch model

The `CONTRIBUTE.md` file SHALL describe the branch model used in this project, including the purpose and lifetime of `main`, `feature/*`, `bugfix/*`, and `hotfix/*` branches. `main` SHALL be the single long-lived branch and the base for every working branch; `feature/*`, `bugfix/*`, and `hotfix/*` SHALL each branch from `main` and target `main` in their pull requests. The branch model SHALL NOT reference a `staging` (or any other long-lived integration) branch.

#### Scenario: Contributor knows which branch to branch from

- **WHEN** a contributor reads the branch model section
- **THEN** it SHALL be unambiguous that a working branch is based on `main` and that its pull request targets `main`

#### Scenario: Hotfix branch rules are documented

- **WHEN** a contributor needs to patch a production bug
- **THEN** the guide SHALL specify that `hotfix/*` branches from `main` and merges back into `main` via a pull request

### Requirement: CONTRIBUTE describes PR submission process

The `CONTRIBUTE.md` SHALL describe the end-to-end process for submitting a pull request, from forking the repository to having the PR merged.

#### Scenario: PR targets the correct base branch

- **WHEN** a contributor submits a pull request
- **THEN** the guide SHALL require that the PR targets `main`

#### Scenario: PR description requirements are stated

- **WHEN** a contributor opens a PR
- **THEN** the guide SHALL specify that the PR description MUST include: a summary of changes, the motivation, and a test plan
