# ci-quality-gates Specification

## Purpose

Defines the GitHub Actions workflow at `.github/workflows/quality-gates.yml` that enforces repository-wide quality gates—Vitest, Rust/WASM tests, VitePress build, and challenge frontmatter validation—on every pull request targeting `main`/`staging` and on every push to `main`. This makes spec-defined local-PASS requirements (from `code-editor-panel`, `oss-readme`, etc.) CI-enforced rather than purely conventional, and complements the existing release-time pipeline in `release.yml` by adding a PR-time first line of defense.

## Requirements

### Requirement: PR-time quality gates SHALL trigger on PRs to `main`/`staging` and pushes to `main`

The repository SHALL define a GitHub Actions workflow at `.github/workflows/quality-gates.yml` that triggers on:

- `pull_request` events whose base branch is `main` or `staging` (event types `opened`, `synchronize`, `reopened` — the default `pull_request` set)
- `push` events to the `main` branch

The workflow SHALL NOT trigger on tag pushes (those belong to `release.yml`). The workflow SHALL NOT trigger on PRs whose base branch is neither `main` nor `staging` (e.g., PRs into feature branches MUST NOT consume PR-time CI budget).

#### Scenario: PR opened against `staging` triggers the workflow

- **WHEN** a contributor opens a pull request whose base branch is `staging`
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

#### Scenario: PR against a feature branch does not trigger the workflow

- **WHEN** a contributor opens a PR whose base branch is neither `main` nor `staging` (e.g., a stacked PR onto another feature branch)
- **THEN** the `Quality Gates` workflow SHALL NOT be queued for that PR

---
### Requirement: The workflow SHALL define two parallel jobs named `test` and `build`

The `quality-gates.yml` workflow SHALL define exactly two top-level jobs whose IDs are `test` and `build`. The two jobs SHALL run in parallel — neither job SHALL declare a `needs:` dependency on the other. Job IDs SHALL remain stable across workflow revisions because external consumers (branch-protection required-check rules and status badges) bind to job names.

#### Scenario: Both jobs run in parallel

- **WHEN** the workflow is triggered by any qualifying event
- **THEN** the GitHub Actions UI SHALL show `test` and `build` jobs scheduled and running concurrently (subject to runner availability)
- **AND** neither job SHALL block the other from starting

#### Scenario: One job failing does not abort the other

- **WHEN** the `test` job exits with a non-zero status while the `build` job is still running
- **THEN** the `build` job SHALL run to completion (success or its own failure)
- **AND** the workflow's overall conclusion SHALL be `failure` because at least one job failed

---
### Requirement: Both jobs SHALL share an identical setup step sequence

The `test` and `build` jobs SHALL each execute the following setup steps in the listed order before any gate-specific step runs:

1. `actions/checkout@v4`
2. `dtolnay/rust-toolchain@stable`
3. `Swatinem/rust-cache@v2`
4. `jetli/wasm-pack-action@v0.4.0`
5. Install `binaryen` via `apt-get install -y binaryen`
6. `pnpm/action-setup@v4`
7. `actions/setup-node@v4` with `node-version: 22` and `cache: pnpm`
8. `pnpm install --frozen-lockfile`
9. `pnpm wasm:build`
10. `pnpm challenge:keygen`

This setup sequence SHALL match the setup steps used by `.github/workflows/release.yml` (lines 16–47 at the time of this spec). Any future change to the setup sequence in `release.yml` SHALL be mirrored in `quality-gates.yml` in the same change.

#### Scenario: Setup sequence matches `release.yml`

- **WHEN** a maintainer compares `quality-gates.yml` setup steps against `release.yml` setup steps
- **THEN** the action references and pinned versions for `actions/checkout`, `dtolnay/rust-toolchain`, `Swatinem/rust-cache`, `jetli/wasm-pack-action`, `pnpm/action-setup`, and `actions/setup-node` SHALL be identical
- **AND** the `pnpm install`, `pnpm wasm:build`, and `pnpm challenge:keygen` commands SHALL be present in both workflows with identical arguments

#### Scenario: `pnpm install` uses `--frozen-lockfile`

- **WHEN** the workflow runs `pnpm install`
- **THEN** the invocation SHALL include the `--frozen-lockfile` flag
- **AND** the job SHALL fail if `pnpm-lock.yaml` is out of sync with `package.json`

---
### Requirement: The `test` job SHALL execute `pnpm wasm:test` and `pnpm test --run`

After the shared setup sequence, the `test` job SHALL execute these two gate steps in order:

1. `pnpm wasm:test` — runs the Rust/WASM test suite via `cargo test --workspace`.
2. `pnpm test --run` — runs the Vitest suite in one-shot mode (the `--run` flag is mandatory; the default Vitest mode is watch, which never exits on CI).

Either step exiting with a non-zero status SHALL cause the `test` job to fail.

#### Scenario: Vitest failure fails the `test` job

- **WHEN** at least one Vitest test in the repository fails during `pnpm test --run`
- **THEN** the `test` job's conclusion SHALL be `failure`
- **AND** the workflow run's overall conclusion SHALL be `failure`

#### Scenario: Rust/WASM test failure fails the `test` job

- **WHEN** at least one Rust test under any `chall-wasm/*` crate fails during `pnpm wasm:test`
- **THEN** the `test` job's conclusion SHALL be `failure`
- **AND** `pnpm test --run` SHALL NOT execute (subsequent steps are skipped after a step failure)

#### Scenario: Vitest watch mode is forbidden

- **WHEN** a maintainer reviews the `test` job step that runs Vitest
- **THEN** the invocation SHALL be `pnpm test --run` (or equivalent that disables watch mode)
- **AND** `pnpm test` without `--run` SHALL NOT appear in the workflow

---
### Requirement: The `build` job SHALL execute `pnpm challenge:validate` and `pnpm docs:build`

After the shared setup sequence, the `build` job SHALL execute these two gate steps in order:

1. `pnpm challenge:validate` — validates challenge frontmatter across `docs/challenge/**`.
2. `pnpm docs:build` — runs `vitepress build` against the `docs/` tree.

Either step exiting with a non-zero status SHALL cause the `build` job to fail.

#### Scenario: VitePress build error fails the `build` job

- **WHEN** `pnpm docs:build` reports any error (broken link, missing import, Vue compilation failure, etc.)
- **THEN** the `build` job's conclusion SHALL be `failure`

#### Scenario: Challenge frontmatter violation fails the `build` job

- **WHEN** `pnpm challenge:validate` reports any frontmatter violation on a `docs/challenge/**` file
- **THEN** the `build` job's conclusion SHALL be `failure`
- **AND** `pnpm docs:build` SHALL NOT execute

---
### Requirement: The workflow SHALL pin Node.js to version 22 LTS

The `quality-gates.yml` workflow SHALL configure `actions/setup-node@v4` with `node-version: 22`. The workflow SHALL NOT run on Node 24 or later until the Node 24 compatibility issue documented in `AUDIT.md` §A.2.1 is resolved.

#### Scenario: Node version is pinned to 22

- **WHEN** a maintainer inspects the `actions/setup-node` step
- **THEN** the `node-version` input SHALL be exactly `22` (or an equivalent SemVer expression that resolves only within the Node 22 LTS line)
- **AND** the workflow SHALL NOT use a matrix that includes Node 24 or higher

---
### Requirement: `wasm-pack` SHALL be installed via `jetli/wasm-pack-action`, not via npm

The `quality-gates.yml` workflow SHALL install `wasm-pack` via the `jetli/wasm-pack-action@v0.4.0` GitHub Action. The workflow SHALL NOT install `wasm-pack` as an npm dependency (per `AUDIT.md` §A.2.1, which forbids re-adding `wasm-pack` to `devDependencies` because it triggers a minipass/minizlib version mismatch that breaks `wasm:build`).

#### Scenario: `wasm-pack` comes from the action, not npm

- **WHEN** a maintainer inspects the workflow's wasm-pack installation step
- **THEN** the step SHALL invoke `jetli/wasm-pack-action@v0.4.0`
- **AND** `package.json` SHALL NOT list `wasm-pack` under `dependencies` or `devDependencies`

---
### Requirement: The PR-time workflow SHALL NOT duplicate the release-time packaging steps

The `quality-gates.yml` workflow SHALL execute up to and including `pnpm docs:build` (in the `build` job) and `pnpm test --run` (in the `test` job). The workflow SHALL NOT run any packaging, artifact upload, GitHub Release creation, or tag-push step — those belong exclusively to `.github/workflows/release.yml`.

#### Scenario: No release artifacts are produced

- **WHEN** the `Quality Gates` workflow completes
- **THEN** no `softprops/action-gh-release` step SHALL have executed
- **AND** no `zip`, `tar`, or `actions/upload-artifact` step SHALL have produced a release-bound artifact

#### Scenario: `release.yml` remains the sole release publisher

- **WHEN** a maintainer cuts a `v*` tag
- **THEN** `release.yml` SHALL handle the release, including packaging and GitHub Release creation
- **AND** `quality-gates.yml` SHALL NOT participate in that flow
