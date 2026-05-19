## ADDED Requirements

### Requirement: Tag-triggered release workflow

The system SHALL provide a GitHub Actions workflow at `.github/workflows/release.yml` that triggers when a tag matching `v*` pattern is pushed to the repository.

#### Scenario: Tag push triggers workflow

- **WHEN** a git tag matching `v*` (e.g., `v0.6.0`) is pushed to the repository
- **THEN** the release workflow SHALL be triggered automatically

#### Scenario: Non-tag push does not trigger

- **WHEN** a regular commit is pushed to any branch without a `v*` tag
- **THEN** the release workflow SHALL NOT be triggered

### Requirement: Complete build pipeline execution

The workflow SHALL execute the full build pipeline in order: install Rust toolchain and wasm-pack → install binaryen (wasm-opt) → install Node.js and pnpm → install dependencies → wasm:build → challenge:keygen → docs:build.

#### Scenario: Successful build pipeline

- **WHEN** the workflow is triggered by a valid tag push
- **THEN** the workflow SHALL execute `pnpm wasm:build`, `pnpm challenge:keygen`, and `pnpm docs:build` in sequence
- **AND** the `.vitepress/dist` directory SHALL contain the built static site

#### Scenario: Build failure halts workflow

- **WHEN** any step in the build pipeline fails
- **THEN** the workflow SHALL stop and report the failure
- **AND** no GitHub Release SHALL be created

### Requirement: Artifact packaging

The workflow SHALL package the `.vitepress/dist` directory into a zip file named `web-exploitation-seclab-{tag}.zip` where `{tag}` is the git tag that triggered the workflow (e.g., `web-exploitation-seclab-v0.6.0.zip`).

#### Scenario: Dist directory packaged as zip

- **WHEN** the build pipeline completes successfully
- **THEN** the workflow SHALL create a zip file containing the contents of `.vitepress/dist`
- **AND** the zip filename SHALL include the triggering tag name

### Requirement: GitHub Release creation with asset

The workflow SHALL create a GitHub Release associated with the triggering tag and attach the zip artifact as a downloadable release asset.

#### Scenario: Release created with zip asset

- **WHEN** the zip artifact is successfully created
- **THEN** the workflow SHALL create a GitHub Release with the name `Release {tag}`
- **AND** the zip file SHALL be attached as a release asset
- **AND** the release SHALL use GitHub auto-generated release notes

### Requirement: Rust build caching

The workflow SHALL use Rust compilation caching to reduce build times for subsequent runs.

#### Scenario: Cache hit reduces build time

- **WHEN** the workflow runs and a valid Rust cache exists from a previous run
- **THEN** the workflow SHALL restore the cached Rust compilation artifacts
- **AND** the Rust/WASM build step SHALL complete faster than a cold build
