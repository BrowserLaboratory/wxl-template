## ADDED Requirements

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
