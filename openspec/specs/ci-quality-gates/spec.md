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

---
### Requirement: Workflows declare minimal token permissions

Every workflow file under `.github/workflows/` SHALL declare a `permissions:` block at either the workflow level or at every job level. The declared permission set SHALL grant only the minimum scopes required by the workflow's jobs. Workflows whose jobs only read repository contents SHALL declare `contents: read` and SHALL NOT request additional scopes. Workflows that require write scopes for release publishing SHALL declare exactly the scopes their actions require and SHALL include an inline YAML comment explaining why the elevated scope is necessary. The repository SHALL NOT rely on the GitHub Actions default `GITHUB_TOKEN` permission set determined by repository settings, because that default is not under version control and is not subject to pull-request review.

#### Scenario: quality-gates.yml declares workflow-level read-only permissions

- **WHEN** a reviewer inspects `.github/workflows/quality-gates.yml`
- **THEN** the file SHALL contain a top-level `permissions:` block with `contents: read`
- **AND** neither the `test` job nor the `build` job SHALL override the workflow-level permissions with broader scopes

#### Scenario: release.yml declares justified write permission

- **WHEN** a reviewer inspects `.github/workflows/release.yml`
- **THEN** the file SHALL contain a top-level `permissions:` block with `contents: write`
- **AND** the `permissions:` block SHALL be accompanied by a YAML comment naming the consumer of the write scope (the `softprops/action-gh-release` step that creates the GitHub Release and uploads the build artifact)

#### Scenario: New workflow without permissions declaration is rejected

- **WHEN** a pull request introduces a new file under `.github/workflows/` that lacks a `permissions:` block at both workflow and job levels
- **THEN** pull-request review SHALL flag the omission as a violation of this requirement
- **AND** the pull request SHALL NOT be merged until the workflow declares an explicit minimal `permissions:` block

##### Example: permissions placement matrix

| Workflow file state                                                                                              | Compliance                |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Top-level `permissions: { contents: read }`, no job overrides                                                    | Compliant                 |
| Top-level `permissions: { contents: write }` with inline comment naming the release-publishing action            | Compliant                 |
| Top-level `permissions:` absent, every job declares its own minimal `permissions:`                               | Compliant                 |
| Top-level `permissions:` absent, at least one job has no `permissions:` block                                    | Violation                 |
| Top-level `permissions: write-all` with no justification                                                         | Violation (not minimal)   |

---
### Requirement: Third-party GitHub Actions pinned to commit SHAs

Every GitHub Action referenced from `.github/workflows/quality-gates.yml` and `.github/workflows/release.yml` SHALL be pinned to a full 40-character commit SHA rather than a mutable tag or branch. Each pinned reference SHALL include a trailing comment of the form `# vN.x.y` (or `# stable` for actions that publish only a `stable` branch reference) indicating the corresponding semantic version for human auditability. The repository SHALL NOT use floating references such as `@v4`, `@main`, or `@latest` in any workflow file under `.github/workflows/`.

#### Scenario: Workflow uses no mutable tag references

- **WHEN** an auditor runs `rg '@v[0-9]+(\.[0-9]+)*$' .github/workflows/` against the repository
- **THEN** the search SHALL return no matches
- **AND** every `uses:` line in both workflow files SHALL resolve to a 40-character hexadecimal commit SHA followed by a ` # ` comment naming the semantic version

#### Scenario: Pinned reference includes version comment

- **WHEN** a contributor reads any `uses:` line in `.github/workflows/quality-gates.yml` or `.github/workflows/release.yml`
- **THEN** the line SHALL match the shape `uses: <owner>/<repo>@<40-char SHA> # <version-tag>`
- **AND** the version-tag suffix SHALL be a valid release of the referenced action, allowing the reviewer to confirm the SHA-to-tag mapping out of band

##### Example: pinned action reference

- **GIVEN** the workflow references the `actions/checkout` action at release `v4.2.2`
- **WHEN** the workflow file is inspected
- **THEN** the reference SHALL appear as `uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2` rather than `uses: actions/checkout@v4`

---
### Requirement: CI workflows install build toolchain at fixed versions

Every continuous-integration workflow under `.github/workflows/` that installs a build toolchain component (including but not limited to `wasm-pack`, the Rust toolchain, and `pnpm`) through a third-party GitHub Action SHALL specify a concrete version string (for example, a tag such as `v0.14.0`) on that action's version input. The workflow SHALL NOT pass floating values such as `'latest'`, `'stable'`, or unqualified branch names that can resolve to different versions across jobs or across runs. Where the same toolchain component is installed by multiple jobs in the same workflow file, every job SHALL declare the same concrete version string for that component.

#### Scenario: wasm-pack action declares a concrete version

- **WHEN** a CI workflow step installs `wasm-pack` through the `jetli/wasm-pack-action` GitHub Action
- **THEN** the step SHALL pass a concrete version string to the action's `version` input
- **AND** the step SHALL NOT pass `'latest'`, `'stable'`, or any other floating tag to the `version` input

#### Scenario: Deterministic toolchain across parallel jobs

- **WHEN** two or more CI jobs in the same workflow file install the same build toolchain component
- **THEN** every job SHALL declare the same concrete version string for that component
- **AND** the workflow SHALL fail closed if the installer reports a mismatched version, rather than continuing the build with an unintended toolchain

##### Example: wasm-pack version pinning across the quality-gates workflow

| Workflow                          | Job     | Action `version` input    | Compliance               |
| --------------------------------- | ------- | ------------------------- | ------------------------ |
| `.github/workflows/quality-gates.yml` | `test`  | `'v0.14.0'` (concrete)    | Compliant                |
| `.github/workflows/quality-gates.yml` | `build` | `'v0.14.0'` (concrete)    | Compliant                |
| `.github/workflows/release.yml`       | `release` | `'v0.14.0'` (concrete)  | Compliant                |
| (any workflow)                        | (any)   | `'latest'` or `'stable'`  | Violation (not concrete) |
| (any workflow)                        | (any)   | omitted (input defaulted) | Violation (not pinned)   |

---
### Requirement: Branch protection ruleset guards main with required status checks

The default branch SHALL be guarded by a GitHub repository ruleset whose `conditions.ref_name.include` is `["~DEFAULT_BRANCH"]` so that the ruleset follows the repository's default branch even if its name changes (for example, `main` renamed to `trunk`, or a derived repository using `master`). The ruleset SHALL be `enforcement: "active"` and `target: "branch"`.

The ruleset SHALL include the following `rules`, in addition to any rules introduced by other capabilities:

- A `pull_request` rule that requires every change to land via a pull request rather than a direct push. The rule's `parameters` SHALL set `dismiss_stale_reviews_on_push` to `true` (a new commit on the pull request invalidates prior approving reviews) and `required_review_thread_resolution` to `true` (every review-conversation thread MUST be resolved before merge). `required_approving_review_count` is NOT required to be non-zero by this requirement; teams that want a stricter approval policy SHALL follow the upgrade snippet documented in `CONTRIBUTE.md`.
- A `required_status_checks` rule listing both `test` and `build` as required status checks, each pinned to `integration_id: 15368` (the GitHub Actions App). Pinning `integration_id` prevents a third-party GitHub App from reporting a same-named check and bypassing the gate. Both checks MUST report a success conclusion before a pull request becomes mergeable. The `test` and `build` contexts refer to the job IDs defined in `.github/workflows/quality-gates.yml`, which are pinned by other requirements in this capability and SHALL NOT be renamed without also updating the ruleset.
- A `deletion` rule that prevents the default branch from being deleted, even by accounts that would otherwise have administrative permission. Deletion MUST go through explicit `bypass_actors` invocation and SHALL be recorded in the GitHub audit log.
- A `non_fast_forward` rule that prevents force-push to the default branch (`git push --force`, `git push --force-with-lease`, and equivalent rewrites). Force-push MUST go through explicit `bypass_actors` invocation and SHALL be recorded in the GitHub audit log.

The ruleset SHALL permit bypass for the `OrganizationAdmin` actor type (which represents organization-level administrators; the GitHub API accepts this `actor_type` with `actor_id: 1`) and for the `RepositoryRole` actor type with `actor_id: 5` (which represents the repository's built-in Admin role). Both bypass entries SHALL use `bypass_mode: "pull_request"` so that bypass is permitted only through the pull-request flow (for example, a maintainer self-merging without waiting for required status checks): the `bypass_mode: "always"` setting that would permit direct push to the default branch SHALL NOT be used. The legacy actor-type name `RepositoryAdmin` is not a valid GitHub API value and SHALL NOT appear in the payload. Bypass invocation SHALL be discoverable in the GitHub audit log, providing an after-the-fact accountability trail.

The ruleset itself is GitHub server-side state and SHALL NOT be expected to live in this repository; the maintainer SHALL create and maintain it out-of-band using the procedure documented under `CONTRIBUTE.md` "Maintainer Setup", which provides both an initial-create (`gh api -X POST .../rulesets`) command and an upgrade (`gh api -X PUT .../rulesets/<id>`) command. This requirement constrains the shape the ruleset takes; the act of provisioning or upgrading the ruleset on a given GitHub repository is a maintainer responsibility, not an automated step in any workflow.

#### Scenario: Direct push to the default branch is rejected once the ruleset is provisioned

- **WHEN** a maintainer with a personal access token attempts `git push origin <default-branch>` after the ruleset is provisioned
- **THEN** the push SHALL be rejected by GitHub with a message indicating the branch is protected by a ruleset
- **AND** because every bypass actor uses `bypass_mode: "pull_request"`, no direct-push variant SHALL succeed — the maintainer MUST open a pull request and use the pull-request bypass flow even when bypassing required status checks

#### Scenario: Force-push or deletion of the default branch is rejected

- **WHEN** any account, including organization or repository administrators, attempts `git push --force origin <default-branch>` or `git push origin --delete <default-branch>`
- **THEN** the push SHALL be rejected by the `non_fast_forward` and `deletion` rules respectively
- **AND** the operation SHALL succeed only when the actor is in the bypass list and explicitly opts to bypass, which SHALL be recorded in the GitHub audit log

#### Scenario: Pull request to the default branch cannot merge while a required check is failing

- **WHEN** a contributor opens a pull request targeting the default branch whose `quality-gates` workflow run has either `test` or `build` reporting a failure conclusion
- **THEN** the GitHub merge button SHALL be disabled with a message indicating one or more required status checks have not passed
- **AND** the pull request SHALL only become mergeable once both `test` and `build`, each reported by the GitHub Actions App (`integration_id: 15368`), report success on the head commit
- **AND** any unresolved review-conversation thread SHALL also block merge, per `required_review_thread_resolution: true`

#### Scenario: Third-party app reporting a same-named check does not satisfy the gate

- **GIVEN** the required-status-checks rule pins each check entry to `integration_id: 15368`
- **WHEN** a non-GitHub-Actions GitHub App installed on the repository publishes a status check with the same `context` name (`test` or `build`) and a `success` conclusion
- **THEN** the pull request SHALL NOT become mergeable on the strength of that third-party report
- **AND** mergeability SHALL require a `success` conclusion from the GitHub Actions App specifically

#### Scenario: New required check appears only after spec update

- **WHEN** a maintainer wishes to add another mandatory status check (for example, a future `site-smoke` job)
- **THEN** the maintainer SHALL first update this requirement to include the new check name (and the appropriate `integration_id`) as a required status check, ensuring spec and ruleset converge
- **AND** the maintainer SHALL update the ruleset on GitHub via the procedure documented in `CONTRIBUTE.md` so that the new check becomes enforceable

##### Example: required status checks contract

| Check ID       | Source workflow                          | `integration_id` | Required by ruleset | Notes                                                 |
| -------------- | ---------------------------------------- | ---------------- | ------------------- | ----------------------------------------------------- |
| `test`         | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Vitest + Rust/WASM tests; pinned by other Requirement |
| `build`        | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Challenge validate + VitePress build                  |
| `release`      | `.github/workflows/release.yml`          | `15368`          | No                  | Tag-driven only; not part of PR gate                  |
| Future checks  | (not yet defined)                        | (set when the check is added) | No     | Adding one requires updating this Requirement first   |
