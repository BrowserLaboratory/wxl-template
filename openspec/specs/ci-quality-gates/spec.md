# ci-quality-gates Specification

## Purpose

Defines the GitHub Actions workflow at `.github/workflows/quality-gates.yml` that enforces repository-wide quality gates—Vitest, Rust/WASM tests, VitePress build, and challenge frontmatter validation—on every pull request targeting `main` and on every push to `main`. This makes spec-defined local-PASS requirements (from `code-editor-panel`, `oss-readme`, etc.) CI-enforced rather than purely conventional, and complements the existing release-time pipeline in `release.yml` by adding a PR-time first line of defense.

## Requirements

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

<!-- @trace
source: main-only-branch-flow
updated: 2026-05-29
code:
  - CONTRIBUTE.md
  - .github/workflows/quality-gates.yml
-->

---
### Requirement: The workflow SHALL define two parallel jobs named `test` and `build`

The `quality-gates.yml` workflow SHALL define, among its top-level jobs, one whose ID is `test` and one whose ID is `build`. The two jobs SHALL run in parallel — neither job SHALL declare a `needs:` dependency on the other. This requirement SHALL NOT be read as an upper bound on the number of top-level jobs in `quality-gates.yml`; conformance SHALL be judged only on the presence, parallelism, and IDs of `test` and `build`.

The `test` and `build` job IDs SHALL remain stable across workflow revisions, because the branch-protection requirement in this capability lists `test` and `build` among the required status checks and identifies those checks by these job IDs.

#### Scenario: Both jobs run in parallel

- **WHEN** the workflow is triggered by any qualifying event
- **THEN** the GitHub Actions UI SHALL show `test` and `build` jobs scheduled and running concurrently (subject to runner availability)
- **AND** neither job SHALL block the other from starting

#### Scenario: One job failing does not abort the other

- **WHEN** the `test` job exits with a non-zero status while the `build` job is still running
- **THEN** the `build` job SHALL run to completion (success or its own failure)
- **AND** the workflow's overall conclusion SHALL be `failure` because at least one job failed

#### Scenario: Additional top-level jobs are not a violation of this requirement

- **WHEN** an auditor enumerates the keys under `jobs:` in `.github/workflows/quality-gates.yml` and finds job IDs other than `test` and `build`
- **THEN** those additional job IDs SHALL NOT be reported as a violation of this requirement
- **AND** the audit SHALL confirm only that `test` and `build` are both present as top-level jobs and that neither declares a `needs:` dependency on the other

---
### Requirement: Both jobs SHALL share an identical setup step sequence

The `test` and `build` jobs SHALL each execute the following setup steps in the listed order before any gate-specific step runs:

1. `actions/checkout@v6`
2. `dtolnay/rust-toolchain@stable`
3. `Swatinem/rust-cache@v2` with `cache-bin: "false"` (the binary cache is disabled because `taiki-e/install-action` installs pinned prebuilt binaries into `$CARGO_HOME/bin`, and a restored cache would shadow them with stale versions)
4. `taiki-e/install-action@v2` with `tool: wasm-pack@0.14.0,wasm-tools@1.249.0` (composite-based; replaces the previously-used `jetli/wasm-pack-action`, which is now forbidden by another requirement in this capability; `wasm-tools` is pinned to 1.249.0 because that is the newest version in the pinned action revision's manifest and it matches the version the keygen strip/mutate passes were verified against)
5. Install `binaryen` via `apt-get install -y binaryen`
6. `pnpm/action-setup@v6`
7. `actions/setup-node@v6` with `node-version: 24` and `cache: pnpm`
8. `pnpm install --frozen-lockfile`
9. `pnpm wasm:build`
10. `pnpm challenge:keygen`

This setup sequence SHALL match the setup steps used by `.github/workflows/release.yml` (lines 16–47 at the time of this spec). Any future change to the setup sequence in `release.yml` SHALL be mirrored in `quality-gates.yml` in the same change.

#### Scenario: Setup sequence matches `release.yml`

- **WHEN** a maintainer compares `quality-gates.yml` setup steps against `release.yml` setup steps
- **THEN** the action references and pinned versions for `actions/checkout`, `dtolnay/rust-toolchain`, `Swatinem/rust-cache`, `taiki-e/install-action` (the composite-based wasm-pack and wasm-tools installer), `pnpm/action-setup`, and `actions/setup-node` SHALL be identical
- **AND** the `pnpm install`, `pnpm wasm:build`, and `pnpm challenge:keygen` commands SHALL be present in both workflows with identical arguments

#### Scenario: `pnpm install` uses `--frozen-lockfile`

- **WHEN** the workflow runs `pnpm install`
- **THEN** the invocation SHALL include the `--frozen-lockfile` flag
- **AND** the job SHALL fail if `pnpm-lock.yaml` is out of sync with `package.json`

#### Scenario: Toolchain parity is asserted by an automated test

- **WHEN** `pnpm test --run` executes the workflow toolchain parity test
- **THEN** the test SHALL parse `.github/workflows/quality-gates.yml`, `.github/workflows/deploy.yml`, and `.github/workflows/release.yml`
- **AND** for every job that uses `taiki-e/install-action`, the test SHALL assert the `tool` input equals `wasm-pack@0.14.0,wasm-tools@1.249.0`
- **AND** for every job that uses `Swatinem/rust-cache`, the test SHALL assert the `cache-bin` input equals `"false"`
- **AND** the test SHALL fail when any of the three workflows drifts from these values


<!-- @trace
source: ci-install-wasm-tools
updated: 2026-08-02
code:
  - .github/workflows/deploy.yml
  - README.md
  - package.json
  - .github/workflows/release.yml
  - .github/workflows/quality-gates.yml
tests:
  - tests/unit/workflows/toolchain-parity.test.ts
-->

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
### Requirement: The workflow SHALL pin Node.js to version 24 LTS

The `quality-gates.yml` workflow SHALL configure `actions/setup-node@v6` (or a later major version whose `runs.using` is `node24` or later) with `node-version: 24`. The Node 24 compatibility issues previously documented in `AUDIT.md` §A.2.1 and §A.2.2 have been resolved as of the `node-24-actions-upgrade` change; no Node-version deferral SHALL remain in this requirement or its scenarios.

#### Scenario: Node version is pinned to 24

- **WHEN** a maintainer inspects the `actions/setup-node` step
- **THEN** the `node-version` input SHALL be exactly `24` (or an equivalent SemVer expression that resolves only within the Node 24 LTS line)
- **AND** the workflow SHALL NOT use a matrix that includes Node 22 or lower
- **AND** the workflow SHALL NOT reference any deferral clause tied to `AUDIT.md` §A.2.1 or §A.2.2

---
### Requirement: `wasm-pack` SHALL be installed via a composite-based GitHub Action, not via npm

The `quality-gates.yml` workflow SHALL install `wasm-pack` via a composite-based GitHub Action whose `runs.using` is `composite` (and therefore not subject to GitHub's Node runtime deprecation policy). The workflow SHALL NOT install `wasm-pack` as an npm dependency (per `AUDIT.md` §A.2.1, which forbids re-adding `wasm-pack` to `devDependencies` because it triggers a minipass/minizlib version mismatch that breaks `wasm:build`). The workflow SHALL NOT install `wasm-pack` via the `jetli/wasm-pack-action` action, whose latest release `v0.4.0` (2022-11-23) declares `runs.using: node16` and whose upstream repository has been stale for more than three years.

The composite action used to install `wasm-pack` SHALL receive the version `0.14.0` (matching the pin established by §A.2.1) through that action's documented version input (for example, the `tool` input of `taiki-e/install-action`).

#### Scenario: `wasm-pack` comes from a composite action, not npm

- **WHEN** a maintainer inspects the workflow's wasm-pack installation step
- **THEN** the step SHALL invoke a GitHub Action whose `action.yml` declares `runs.using: composite`
- **AND** the step SHALL NOT invoke `jetli/wasm-pack-action` at any version
- **AND** `package.json` SHALL NOT list `wasm-pack` under `dependencies` or `devDependencies`

##### Example: taiki-e/install-action installs wasm-pack 0.14.0

- **GIVEN** the workflow uses `taiki-e/install-action` as the composite-based installer
- **WHEN** the workflow file is inspected
- **THEN** the step SHALL pass `tool: wasm-pack@0.14.0` (or equivalent input that resolves to `wasm-pack 0.14.0`)
- **AND** the step SHALL pin `taiki-e/install-action` to a full 40-character commit SHA with a trailing `# v2.x.y` version comment, per the third-party action pinning requirement of this capability

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

Every GitHub Action referenced from `.github/workflows/quality-gates.yml` and `.github/workflows/release.yml` SHALL be pinned to a full 40-character commit SHA rather than a mutable tag or branch. Each pinned reference SHALL include a trailing comment of the form `# vN.x.y` (or `# stable` for actions that publish only a `stable` branch reference) indicating the corresponding semantic version for human auditability. The repository SHALL NOT use floating references such as `@v4`, `@main`, or `@latest` in any workflow file under `.github/workflows/`. When the pinned target is an annotated tag, the pinned SHA SHALL be the commit SHA that the annotated tag dereferences to, not the tag object SHA, so that the reference is anchored to immutable commit history.

#### Scenario: Workflow uses no mutable tag references

- **WHEN** an auditor runs `rg '@v[0-9]+(\.[0-9]+)*$' .github/workflows/` against the repository
- **THEN** the search SHALL return no matches
- **AND** every `uses:` line in both workflow files SHALL resolve to a 40-character hexadecimal commit SHA followed by a ` # ` comment naming the semantic version

#### Scenario: Pinned reference includes version comment

- **WHEN** a contributor reads any `uses:` line in `.github/workflows/quality-gates.yml` or `.github/workflows/release.yml`
- **THEN** the line SHALL match the shape `uses: <owner>/<repo>@<40-char SHA> # <version-tag>`
- **AND** the version-tag suffix SHALL be a valid release of the referenced action, allowing the reviewer to confirm the SHA-to-tag mapping out of band

##### Example: pinned action reference

- **GIVEN** the workflow references the `actions/checkout` action at a release in the v6 line (the first major line whose `runs.using` is `node24`)
- **WHEN** the workflow file is inspected
- **THEN** the reference SHALL appear as `uses: actions/checkout@<40-char-commit-SHA> # v6.x.y` rather than `uses: actions/checkout@v6`
- **AND** the commit SHA SHALL be obtained by dereferencing the annotated release tag (for example via `git rev-parse v6.x.y^{}` or the GitHub API `GET /repos/actions/checkout/git/ref/tags/v6.x.y` followed by tag-object dereference), not the tag object SHA itself

---
### Requirement: CI workflows install build toolchain at fixed versions

Every continuous-integration workflow under `.github/workflows/` that installs a build toolchain component (including but not limited to `wasm-pack`, the Rust toolchain, and `pnpm`) through a third-party GitHub Action SHALL specify a concrete version string (for example, a tag such as `0.14.0`) on that action's version input. The workflow SHALL NOT pass floating values such as `'latest'`, `'stable'`, or unqualified branch names that can resolve to different versions across jobs or across runs. Where the same toolchain component is installed by multiple jobs in the same workflow file, every job SHALL declare the same concrete version string for that component.

#### Scenario: wasm-pack composite action declares a concrete version

- **WHEN** a CI workflow step installs `wasm-pack` through a composite-based GitHub Action (for example, `taiki-e/install-action`)
- **THEN** the step SHALL pass a concrete version string to the action's documented version input (for example, `tool: wasm-pack@0.14.0` for `taiki-e/install-action`)
- **AND** the step SHALL NOT pass `'latest'`, `'stable'`, or any other floating tag to that input

#### Scenario: Deterministic toolchain across parallel jobs

- **WHEN** two or more CI jobs in the same workflow file install the same build toolchain component
- **THEN** every job SHALL declare the same concrete version string for that component
- **AND** the workflow SHALL fail closed if the installer reports a mismatched version, rather than continuing the build with an unintended toolchain

##### Example: wasm-pack version pinning across the quality-gates workflow

| Workflow                              | Job       | Action invocation                            | Compliance               |
| ------------------------------------- | --------- | -------------------------------------------- | ------------------------ |
| `.github/workflows/quality-gates.yml` | `test`    | `taiki-e/install-action` with `tool: wasm-pack@0.14.0` | Compliant                |
| `.github/workflows/quality-gates.yml` | `build`   | `taiki-e/install-action` with `tool: wasm-pack@0.14.0` | Compliant                |
| `.github/workflows/release.yml`       | `release` | `taiki-e/install-action` with `tool: wasm-pack@0.14.0` | Compliant                |
| (any workflow)                        | (any)     | `tool: wasm-pack` (no version)               | Violation (not pinned)   |
| (any workflow)                        | (any)     | `tool: wasm-pack@latest`                     | Violation (not concrete) |
| (any workflow)                        | (any)     | `jetli/wasm-pack-action@<any SHA>`           | Violation (Node-runtime-bound action) |

---
### Requirement: Branch protection ruleset guards main with required status checks

The default branch SHALL be guarded by a GitHub repository ruleset whose `conditions.ref_name.include` is `["~DEFAULT_BRANCH"]` so that the ruleset follows the repository's default branch even if its name changes (for example, `main` renamed to `trunk`, or a derived repository using `master`). The ruleset SHALL be `enforcement: "active"` and `target: "branch"`.

The ruleset SHALL include the following `rules`, in addition to any rules introduced by other capabilities:

- A `pull_request` rule that requires every change to land via a pull request rather than a direct push. The rule's `parameters` SHALL set `dismiss_stale_reviews_on_push` to `true` (a new commit on the pull request invalidates prior approving reviews), `required_review_thread_resolution` to `true` (every review-conversation thread MUST be resolved before merge), and `allowed_merge_methods` to `["squash", "rebase"]` (the GitHub merge UI MUST only offer squash and rebase as merge methods — the legacy "Create a merge commit" button SHALL NOT be available for pull requests against the default branch). `required_approving_review_count` is NOT required to be non-zero by this requirement; teams that want a stricter approval policy SHALL follow the upgrade snippet documented in `CONTRIBUTE.md`.
- A `required_status_checks` rule listing `test`, `build`, and `prose-audit` as required status checks, each pinned to `integration_id: 15368` (the GitHub Actions App). Pinning `integration_id` prevents a third-party GitHub App from reporting a same-named check and bypassing the gate. The rule's `parameters.strict_required_status_checks_policy` SHALL be `true`: this requires every pull-request head commit to be up-to-date with the latest base before merge, so that the `test` / `build` / `prose-audit` outcome reflects the actual `base-with-this-PR` combination rather than a stale `base-without-other-merged-PRs` combination. All three checks MUST report a success conclusion on the up-to-date head before a pull request becomes mergeable. The `test`, `build`, and `prose-audit` contexts refer to the job IDs defined in `.github/workflows/quality-gates.yml`, which are pinned by other requirements in this capability and SHALL NOT be renamed without also updating the ruleset.
- A `deletion` rule that prevents the default branch from being deleted, even by accounts that would otherwise have administrative permission. Deletion MUST go through explicit `bypass_actors` invocation and SHALL be recorded in the GitHub audit log.
- A `non_fast_forward` rule that prevents force-push to the default branch (`git push --force`, `git push --force-with-lease`, and equivalent rewrites). Force-push MUST go through explicit `bypass_actors` invocation and SHALL be recorded in the GitHub audit log.
- A `required_linear_history` rule that prevents merges which would produce a merge commit on the default branch. Combined with the `pull_request` rule's `allowed_merge_methods: ["squash", "rebase"]`, this enforces a linear `git log --oneline <default-branch>` history end-to-end: server-side rejection of any non-fast-forward / non-linear merge, plus UI restriction of the merge button to squash and rebase modes. The combination is intentional belt-and-suspenders: `required_linear_history` enforces the constraint even if the UI restriction is bypassed or misconfigured, while `allowed_merge_methods` makes the constraint visible to the contributor at PR time (the merge-commit button is grayed out) rather than only at merge time (the merge fails with a server error).

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

- **WHEN** a contributor opens a pull request targeting the default branch whose `quality-gates` workflow run has any of `test`, `build`, or `prose-audit` reporting a failure conclusion
- **THEN** the GitHub merge button SHALL be disabled with a message indicating one or more required status checks have not passed
- **AND** the pull request SHALL only become mergeable once all three of `test`, `build`, and `prose-audit`, each reported by the GitHub Actions App (`integration_id: 15368`), report success on the head commit
- **AND** any unresolved review-conversation thread SHALL also block merge, per `required_review_thread_resolution: true`

#### Scenario: Third-party app reporting a same-named check does not satisfy the gate

- **GIVEN** the required-status-checks rule pins each check entry to `integration_id: 15368`
- **WHEN** a non-GitHub-Actions GitHub App installed on the repository publishes a status check with the same `context` name (`test`, `build`, or `prose-audit`) and a `success` conclusion
- **THEN** the pull request SHALL NOT become mergeable on the strength of that third-party report
- **AND** mergeability SHALL require a `success` conclusion from the GitHub Actions App specifically

#### Scenario: New required check appears only after spec update

- **WHEN** a maintainer wishes to add another mandatory status check (for example, a future `site-smoke` job)
- **THEN** the maintainer SHALL first update this requirement to include the new check name (and the appropriate `integration_id`) as a required status check, ensuring spec and ruleset converge
- **AND** the maintainer SHALL update the ruleset on GitHub via the procedure documented in `CONTRIBUTE.md` so that the new check becomes enforceable

#### Scenario: Merge-commit attempt against the default branch is rejected

- **GIVEN** the ruleset includes a `required_linear_history` rule
- **WHEN** a maintainer attempts to merge a pull request via the GitHub REST API `PUT /repos/{owner}/{repo}/pulls/{number}/merge` with `merge_method=merge`, or otherwise constructs a merge that would create a merge commit on the default branch
- **THEN** GitHub SHALL reject the operation with a response indicating the default branch requires a linear history
- **AND** the only paths to a successful merge SHALL be `merge_method=squash` or `merge_method=rebase`, which preserve `git log --oneline <default-branch>` as a single linear chain of commits

#### Scenario: GitHub merge UI exposes only squash and rebase methods

- **GIVEN** the ruleset includes a `pull_request` rule whose `parameters.allowed_merge_methods` is `["squash", "rebase"]`
- **WHEN** a contributor or maintainer views a pull request targeting the default branch in the GitHub web UI
- **THEN** the merge button SHALL offer only "Squash and merge" and "Rebase and merge"; the "Create a merge commit" option SHALL be hidden or disabled with a message indicating it is not permitted by branch protection
- **AND** the visible UI restriction SHALL match the server-side `required_linear_history` constraint, so the contributor is informed of the policy at PR time rather than discovering it only when attempting to merge

#### Scenario: Pull request whose head is stale relative to base cannot merge

- **GIVEN** the ruleset includes a `required_status_checks` rule whose `parameters.strict_required_status_checks_policy` is `true`
- **AND** pull request B has all three of `test`, `build`, and `prose-audit` reporting success conclusions on its current head commit
- **WHEN** another pull request A merges into the default branch, advancing the base ahead of B's head
- **THEN** B's merge button SHALL be disabled with a message indicating the branch is out-of-date with the base branch, even though `test`, `build`, and `prose-audit` still report success on B's existing head
- **AND** B SHALL only become mergeable once its head is advanced to the new base (via the GitHub "Update branch" button, `git rebase`, or `git merge` from the contributor side) AND all three of `test`, `build`, and `prose-audit` then re-run and report success on the new head commit

##### Example: required status checks contract

| Check ID       | Source workflow                          | `integration_id` | Required by ruleset | Notes                                                 |
| -------------- | ---------------------------------------- | ---------------- | ------------------- | ----------------------------------------------------- |
| `test`         | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Vitest + Rust/WASM tests; pinned by other Requirement |
| `build`        | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Challenge validate + VitePress build                  |
| `prose-audit`  | `.github/workflows/quality-gates.yml`    | `15368`          | Yes                 | Phase-1 deterministic prose audit on outward markdown |
| `release`      | `.github/workflows/release.yml`          | `15368`          | No                  | Tag-driven only; not part of PR gate                  |
| Future checks  | (not yet defined)                        | (set when the check is added) | No     | Adding one requires updating this Requirement first   |

---
### Requirement: The pipeline SHALL run Phase-1 deterministic prose audit on changed markdown files

The `quality-gates.yml` workflow SHALL define a third top-level job whose ID is `prose-audit`. This job SHALL run in parallel with the `test` and `build` jobs — it SHALL NOT declare a `needs:` dependency on either of them.

The `prose-audit` job SHALL execute the following sequence:

1. Check out the repository using the same pinned `actions/checkout` action and version used elsewhere in the workflow, with `fetch-depth: 0` so that the base-vs-head diff can be computed locally.
2. Set up Python 3.12 via `actions/setup-python@v6` (or a later major version whose `runs.using` is `node24` or later) with `cache: pip`.
3. Install the audit dependencies from `scripts/prose-audit/requirements.txt` (which SHALL declare concrete pinned versions of exactly `pyyaml`, `textstat`, and `jsonschema` — the only third-party packages imported by the vendored checkers; `tiktoken` and `py-readability-metrics` SHALL NOT be declared, because no vendored module imports them).
4. Compute the set of Added / Modified / Renamed `*.md` files between the pull-request base and head using `git diff --name-only --diff-filter=AMR -M origin/<base>...HEAD -- '*.md'`. Rename detection (`-M`) SHALL be enabled so that renamed-with-edit files are not split into a delete-plus-add pair that escapes scanning.
5. Intersect that diff set with the outward-facing surface defined by the `prose-audit-outward-docs` capability (the five root developer documents `README.md` / `CONTRIBUTE.md` / `CLAUDE.md` / `AGENTS.md` / `GEMINI.md`, plus every `*.md` file under `docs/`). Files outside the outward-facing surface — including everything under `openspec/`, `AUDIT.md`, `.claude/`, `.agents/`, `.spectra/`, and any other internal-tooling directory — SHALL NOT be audited.
6. Invoke `python scripts/prose-audit/run.py <files> --out audit-runs/prose-phase1-ci/ --json-summary audit-runs/prose-phase1-ci/summary.json`. The intersection from step 5 is the positional argument list; if the intersection is empty the wrapper SHALL exit 0 with a skip message and the job SHALL be green.
7. Upload the entire `audit-runs/prose-phase1-ci/` directory as a GitHub Actions artifact named `prose-audit-phase1-reports` with `retention-days: 14`. The upload step SHALL use `if: always()` so that the artifact is preserved even when the audit step reports failure (so contributors can inspect Critical findings).

The job SHALL fail if and only if the `run.py` wrapper exits with a non-zero status. The wrapper SHALL exit non-zero if and only if at least one checker in the **blocking set** — `mainland_vocab`, `placeholder_grep`, and `citation_format` — reports one or more findings on any audited file, regardless of the finding's `severity` label. Findings reported by the other eleven **advisory** checkers SHALL NOT, by themselves, cause the wrapper or the job to fail; they SHALL be recorded in the run output for human review only. Rationale: the vendored deterministic checkers never emit `severity: "critical"` (the maximum they emit is `high`), so a severity threshold such as `--fail-on critical` could never gate; the blocking set instead names the rules that detect objective, unambiguous errors (mainland-Chinese vocabulary, unfinished placeholders, and malformed citations), while stylistic checkers remain advisory to avoid false-positive merge blocks. A non-zero exit due to an internal error (a checker crash or `ImportError`) SHALL be distinguishable from a blocking finding (the wrapper SHALL use exit code 2 for internal error versus exit code 1 for a blocking finding).

The deterministic checker set SHALL comprise exactly these 14 checkers, vendored into `scripts/prose-audit/checks/`: `mainland_vocab`, `placeholder_grep`, `duplicate_sentences`, `citation_format`, `readability_metrics`, `lazy_writer_check`, `ai_tells`, `burstiness`, `hedge_density`, `imperative_fog`, `lexical_diversity`, `pronoun_consistency`, `discourse_marker_density`, `repetition_fingerprint`. `run.py` SHALL invoke these modules directly — one subprocess per `scripts/prose-audit/checks/<rule>.py` — and parse each checker's stdout JSON. The vendored tree SHALL additionally include `scripts/prose-audit/config.yaml` (the wordlist/pattern config read by `mainland_vocab`, `placeholder_grep`, `duplicate_sentences`, `lazy_writer_check`, and `readability_metrics`) and the minimal `_common` modules the checkers import (`locale_detect` for `burstiness`, `config_resolver` for `citation_format`). The change SHALL NOT vendor or invoke the `humane-prose-audit` orchestrator (`audit_orchestrator.py`) or any of its LLM sub-agent dispatch, fuzz-mutator, humane-signal-scoring, or consolidated-findings logic — those remain the responsibility of the maintainer's release-time manual run governed by the `prose-audit-outward-docs` capability. Each per-file run SHALL write `<file-slug>/findings.json`; the wrapper SHALL also write a merged `summary.json`.

The `prose-audit` job SHALL declare permissions equivalent to or narrower than `contents: read`. It SHALL NOT request `pull-requests: write`, `issues: write`, or any other elevated scope, since artifact upload alone is the chosen reporting mechanism.

#### Scenario: PR-time deterministic audit is triggered on changed outward markdown

- **WHEN** a contributor opens a pull request whose base branch is `main` and the diff modifies at least one `*.md` file inside the outward-facing surface
- **THEN** the `Quality Gates` workflow SHALL queue a `prose-audit` job alongside the existing `test` and `build` jobs within 60 seconds
- **AND** the job SHALL execute the Phase-1 deterministic checker pipeline against exactly the intersection of the PR diff and the outward-facing surface (no other files SHALL be scanned)
- **AND** the job's conclusion SHALL appear as a third check on the pull request named `Quality Gates / prose-audit`

#### Scenario: Blocking-rule finding blocks merge

- **WHEN** the `prose-audit` job runs and at least one blocking-set checker (`mainland_vocab`, `placeholder_grep`, or `citation_format`) reports one or more findings on any audited file
- **THEN** `scripts/prose-audit/run.py` SHALL exit with a non-zero status regardless of the findings' severity labels
- **AND** the `prose-audit` job's conclusion SHALL be `failure`
- **AND** the `audit-runs/prose-phase1-ci/` artifact SHALL nonetheless be uploaded (per the `if: always()` policy) so contributors can inspect the offending finding
- **AND** the pull request SHALL be blocked from merging by the `required_status_checks` rule (provided the branch-protection ruleset has been updated to include `prose-audit` in its required-checks list, per the MODIFIED requirement in this same spec delta)

#### Scenario: Advisory-only findings do not block merge

- **WHEN** the `prose-audit` job runs and every finding reported comes from an advisory checker (any of the eleven that are not in the blocking set — for example `burstiness`, `lexical_diversity`, or `hedge_density`)
- **THEN** `scripts/prose-audit/run.py` SHALL exit 0
- **AND** the `prose-audit` job's conclusion SHALL be `success`
- **AND** those advisory findings SHALL still be recorded in `summary.json` so a reviewer can read them without the job blocking the merge

#### Scenario: Non-outward markdown change does not consume audit budget

- **WHEN** a contributor opens a pull request whose only `*.md` modifications are under `openspec/`, `.claude/`, `.agents/`, `.spectra/`, or any other internal-tooling directory excluded from the outward-facing surface
- **THEN** the intersection of the PR diff and the outward-facing surface SHALL be empty
- **AND** `scripts/prose-audit/run.py` SHALL exit 0 with a "no markdown files to audit; skipping" message logged to stdout
- **AND** the `prose-audit` job's conclusion SHALL be `success`
- **AND** the workflow SHALL NOT invoke any of the 14 checker modules for this run

#### Scenario: Rename-with-edit on an outward file is still scanned

- **WHEN** a contributor renames an outward-facing file (e.g. `docs/guide/old-name.md` → `docs/guide/new-name.md`) and modifies its contents in the same pull request
- **THEN** `git diff --name-only --diff-filter=AMR -M origin/<base>...HEAD -- '*.md'` SHALL report `docs/guide/new-name.md` as the renamed target (because the `-M` rename-detection flag is mandated)
- **AND** the `prose-audit` job SHALL include `docs/guide/new-name.md` in the audit set
- **AND** the file SHALL NOT escape scanning by being split into a delete-plus-add pair

#### Scenario: Phase-1 job permissions are read-only

- **WHEN** a reviewer inspects the `prose-audit` job definition in `.github/workflows/quality-gates.yml`
- **THEN** either the workflow-level `permissions:` block (read-only) SHALL apply unmodified
- **OR** the job-level `permissions:` block SHALL declare `contents: read` and nothing else
- **AND** the job SHALL NOT request `pull-requests: write`, `issues: write`, or any other elevated scope

#### Scenario: Orchestrator and LLM phases are neither vendored nor invoked

- **WHEN** a maintainer inspects the post-run contents of the `audit-runs/prose-phase1-ci/` artifact uploaded by the `prose-audit` job
- **THEN** each per-file subdirectory SHALL contain `findings.json`, the run root SHALL contain `summary.json`, and the artifact SHALL NOT contain `preflight/`, `agents/_inputs.json`, `mutators/`, `fuzz/`, `humane_score.json`, or any artifact produced by the `humane-prose-audit` orchestrator or its LLM / fuzz / humane-signal / consolidated-findings phases
- **AND** `scripts/prose-audit/` SHALL NOT contain `audit_orchestrator.py`
- **AND** the workflow SHALL NOT define any `ANTHROPIC_API_KEY` (or equivalent LLM credential) secret reference for the `prose-audit` job, because the vendored deterministic checkers SHALL NOT invoke any LLM

---
### Requirement: The pipeline SHALL run an advisory site-smoke browser gate

The `quality-gates.yml` workflow SHALL define a top-level job whose ID is `site-smoke`. This job SHALL run in parallel with the `test`, `build`, and `prose-audit` jobs — it SHALL NOT declare a `needs:` dependency on any of them. The job ID SHALL remain stable across workflow revisions so that a future change can bind a required-status-check rule to it.

The `site-smoke` job SHALL execute the following sequence:

1. Check out the repository using the same pinned `actions/checkout` action and version used elsewhere in the workflow.
2. Set up pnpm and Node.js 24 LTS using the same pinned `pnpm/action-setup` and `actions/setup-node` actions and the same Node version as the `test` and `build` jobs.
3. Install dependencies with `pnpm install --frozen-lockfile`.
4. Build the production site by running `pnpm wasm:build`, `pnpm challenge:keygen`, and `pnpm docs:build` (challenge pages require the WASM modules and generated keys to render).
5. Install the Playwright Chromium browser — and only Chromium — together with its OS dependencies.
6. Run `pnpm test:smoke`, which executes the site-smoke suite (defined by the `site-smoke-tests` capability) against the previewed production site.

The `site-smoke` job SHALL declare permissions equivalent to or narrower than `contents: read`.

This requirement SHALL NOT add `site-smoke` to the branch-protection ruleset's required-status-checks list and SHALL NOT modify the existing required checks (`test`, `build`, `prose-audit`). The `site-smoke` job is advisory at this stage: a failing `site-smoke` job SHALL NOT block a pull request from merging. Promotion of `site-smoke` to a required status check is deferred to a separate future change once its stability has been demonstrated.

#### Scenario: site-smoke runs as a parallel advisory job

- **WHEN** the workflow is triggered by a pull request to `main` or a push to `main`
- **THEN** GitHub Actions SHALL queue a `site-smoke` job alongside the `test`, `build`, and `prose-audit` jobs without a `needs:` dependency
- **AND** the job's conclusion SHALL appear as a check named `Quality Gates / site-smoke`

#### Scenario: site-smoke failure does not block merge

- **WHEN** the `site-smoke` job concludes with `failure`
- **THEN** the pull request SHALL remain mergeable because `site-smoke` is not in the required-status-checks list
- **AND** the existing required checks (`test`, `build`, `prose-audit`) SHALL continue to gate merge unchanged

#### Scenario: site-smoke passes on a healthy site

- **WHEN** the previewed site renders the homepage and the `door-is-open` challenge page correctly
- **THEN** `pnpm test:smoke` SHALL exit 0
- **AND** the `site-smoke` job conclusion SHALL be `success`

<!-- @trace
source: playwright-site-smoke
updated: 2026-05-28
code:
  - .github/workflows/quality-gates.yml
  - package.json
  - playwright.site.config.ts
tests:
  - tests/site-smoke/site-smoke.spec.ts
-->
