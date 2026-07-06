# spec-corpus-governance Specification

## Purpose

Defines the minimum metadata hygiene standards that active specifications must meet before a release. Ensures every active spec has a concrete Purpose statement and no duplicate requirement headers, preventing archive-generated placeholder text from persisting into formal releases.

## Requirements

### Requirement: Active specifications declare concrete purpose text

Every active specification under `openspec/specs/` SHALL include a concrete `## Purpose` section that describes the capability covered by that spec. Active specs SHALL NOT retain archive-generated placeholder Purpose text.

#### Scenario: Placeholder purpose is treated as a defect

- **WHEN** an active spec still contains archive-generated placeholder Purpose text
- **THEN** release-readiness review SHALL treat that spec as incomplete until a concrete Purpose statement is written

#### Scenario: Newly archived capability is normalized before release

- **WHEN** a newly archived change creates or updates an active spec
- **THEN** the resulting active spec SHALL have a concrete Purpose statement before the release review can pass


<!-- @trace
source: fill-active-spec-purpose-statements
updated: 2026-04-04
code:
  - .agent/skills/spectra-archive/SKILL.md
  - .github/workflows/release.yml
  - .agent/skills/spectra-ask/SKILL.md
  - .agent/skills/spectra-ingest/SKILL.md
  - .agent/skills/spectra-debug/SKILL.md
  - scripts/challenge-keygen.ts
  - .agent/skills/spectra-audit/SKILL.md
  - .agent/skills/spectra-propose/SKILL.md
  - .agent/skills/spectra-apply/SKILL.md
  - .agent/skills/spectra-discuss/SKILL.md
  - .vitepress/theme/composables/usePhpRuntime.ts
tests:
  - tests/unit/scripts/challenge-keygen.test.ts
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
-->

---
### Requirement: Active specifications maintain unique requirement headers

Within a single active spec file, each `### Requirement:` header SHALL be unique after a release-readiness normalization pass. Parallel copies of the same requirement header SHALL be merged or removed before the spec corpus is eligible for release.

#### Scenario: Duplicate requirement header is flagged

- **WHEN** an active spec contains two `### Requirement:` blocks with the same header text
- **THEN** release-readiness review SHALL treat the spec as needing normalization before release

#### Scenario: Requirement normalization preserves a single canonical block

- **WHEN** duplicate requirement headers are reconciled during a spec cleanup change
- **THEN** the active spec SHALL retain exactly one canonical requirement block for that header

<!-- @trace
source: fill-active-spec-purpose-statements
updated: 2026-04-04
code:
  - .agent/skills/spectra-archive/SKILL.md
  - .github/workflows/release.yml
  - .agent/skills/spectra-ask/SKILL.md
  - .agent/skills/spectra-ingest/SKILL.md
  - .agent/skills/spectra-debug/SKILL.md
  - scripts/challenge-keygen.ts
  - .agent/skills/spectra-audit/SKILL.md
  - .agent/skills/spectra-propose/SKILL.md
  - .agent/skills/spectra-apply/SKILL.md
  - .agent/skills/spectra-discuss/SKILL.md
  - .vitepress/theme/composables/usePhpRuntime.ts
tests:
  - tests/unit/scripts/challenge-keygen.test.ts
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
-->