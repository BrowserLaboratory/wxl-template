# github-release-workflow Specification

## Purpose

Defines the tag-triggered GitHub Actions workflow that builds, tests, validates, and publishes release artifacts. The workflow enforces a strict sequential gate ordering — Rust/WASM build, challenge payload generation, Rust tests, Vitest suite, challenge validation, and documentation build — ensuring no release is created unless every gate passes.

## Requirements

### Requirement: Tag-triggered release workflow

The system SHALL provide a GitHub Actions workflow at `.github/workflows/release.yml` that triggers when a tag matching `v*` pattern is pushed to the repository.

#### Scenario: Tag push triggers workflow

- **WHEN** a git tag matching `v*` (e.g., `v0.6.0`) is pushed to the repository
- **THEN** the release workflow SHALL be triggered automatically

#### Scenario: Non-tag push does not trigger

- **WHEN** a regular commit is pushed to any branch without a `v*` tag
- **THEN** the release workflow SHALL NOT be triggered


<!-- @trace
source: add-release-github-action
updated: 2026-03-23
code:
  - .github/workflows/release.yml
  - package.json
-->

---
### Requirement: Complete build pipeline execution

The release workflow SHALL execute the full build pipeline in order: install Rust toolchain and wasm-pack, install binaryen, install Node.js and pnpm, install dependencies, `pnpm wasm:build`, `pnpm challenge:keygen`, `pnpm wasm:test`, `pnpm test --run`, `pnpm challenge:validate`, and `pnpm docs:build`. Artifact packaging and GitHub Release creation SHALL run only after every gate succeeds.

#### Scenario: Successful release run executes every gate

- **WHEN** the workflow is triggered by a valid release tag
- **THEN** it SHALL run `pnpm wasm:build`, `pnpm challenge:keygen`, `pnpm wasm:test`, `pnpm test --run`, `pnpm challenge:validate`, and `pnpm docs:build` before packaging artifacts

#### Scenario: Rust test failure halts the release

- **WHEN** `pnpm wasm:test` fails during the workflow
- **THEN** the workflow SHALL stop immediately, SHALL NOT run `pnpm test --run` or `pnpm docs:build`, and SHALL NOT create a GitHub Release


<!-- @trace
source: tighten-github-release-gates
updated: 2026-04-04
code:
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .github/workflows/release.yml
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Artifact packaging

The workflow SHALL package the `.vitepress/dist` directory into a zip file named `wxl-{tag}.zip` where `{tag}` is the git tag that triggered the workflow (e.g., `wxl-v1.0.0.zip`).

#### Scenario: Dist directory packaged as zip

- **WHEN** the build pipeline completes successfully
- **THEN** the workflow SHALL create a zip file containing the contents of `.vitepress/dist`
- **AND** the zip filename SHALL include the triggering tag name


<!-- @trace
source: add-release-github-action
updated: 2026-03-23
code:
  - .github/workflows/release.yml
  - package.json
-->

---
### Requirement: GitHub Release creation with asset

The workflow SHALL create a GitHub Release associated with the triggering tag and attach the zip artifact as a downloadable release asset.

#### Scenario: Release created with zip asset

- **WHEN** the zip artifact is successfully created
- **THEN** the workflow SHALL create a GitHub Release with the name `Release {tag}`
- **AND** the zip file SHALL be attached as a release asset
- **AND** the release SHALL use GitHub auto-generated release notes


<!-- @trace
source: add-release-github-action
updated: 2026-03-23
code:
  - .github/workflows/release.yml
  - package.json
-->

---
### Requirement: Rust build caching

The workflow SHALL use Rust compilation caching to reduce build times for subsequent runs.

#### Scenario: Cache hit reduces build time

- **WHEN** the workflow runs and a valid Rust cache exists from a previous run
- **THEN** the workflow SHALL restore the cached Rust compilation artifacts
- **AND** the Rust/WASM build step SHALL complete faster than a cold build

<!-- @trace
source: add-release-github-action
updated: 2026-03-23
code:
  - .github/workflows/release.yml
  - package.json
-->