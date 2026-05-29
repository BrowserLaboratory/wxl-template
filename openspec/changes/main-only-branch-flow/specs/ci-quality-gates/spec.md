## REMOVED Requirements

### Requirement: PR-time quality gates SHALL trigger on PRs to `main`/`staging` and pushes to `main`

**Reason**: This template repository is now main-only; the `staging` integration branch is not used here, so the trigger no longer needs to cover `staging`. Superseded by the main-only trigger requirement added in this same delta.
**Migration**: Use the ADDED requirement "PR-time quality gates SHALL trigger on PRs to `main` and pushes to `main`". A derived repository that adopts a `staging` branch re-introduces the `staging` trigger via its own change.

## ADDED Requirements

### Requirement: PR-time quality gates SHALL trigger on PRs to `main` and pushes to `main`

The repository SHALL define a GitHub Actions workflow at `.github/workflows/quality-gates.yml` that triggers on:

- `pull_request` events whose base branch is `main` (event types `opened`, `synchronize`, `reopened` — the default `pull_request` set)
- `push` events to the `main` branch

The workflow SHALL NOT trigger on tag pushes (those belong to `release.yml`). The workflow SHALL NOT trigger on PRs whose base branch is not `main` (e.g., PRs into feature branches MUST NOT consume PR-time CI budget).

#### Scenario: PR opened against `main` triggers the workflow

- **WHEN** a contributor opens a pull request whose base branch is `main`
- **THEN** GitHub Actions SHALL queue the `Quality Gates` workflow within 60 seconds
- **AND** both the `test` and `build` jobs SHALL appear as in-progress checks on the PR

#### Scenario: Push to `main` triggers the workflow

- **WHEN** a commit is pushed to the `main` branch (including squash-merge from a PR)
- **THEN** GitHub Actions SHALL queue the `Quality Gates` workflow
- **AND** the workflow run SHALL be associated with the `main` branch in the Actions UI

#### Scenario: Tag push does not trigger the workflow

- **WHEN** a contributor pushes a tag matching `v*` to the repository
- **THEN** the `Quality Gates` workflow SHALL NOT be queued
- **AND** the existing `release.yml` workflow SHALL handle the tag-triggered flow independently

#### Scenario: PR against a non-main branch does not trigger the workflow

- **WHEN** a contributor opens a PR whose base branch is not `main` (e.g., a stacked PR onto another feature branch)
- **THEN** the `Quality Gates` workflow SHALL NOT be queued for that PR
