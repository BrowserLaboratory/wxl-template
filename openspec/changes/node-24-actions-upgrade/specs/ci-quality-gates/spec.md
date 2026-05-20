## MODIFIED Requirements

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
