## ADDED Requirements

### Requirement: Active specifications declare concrete purpose text

Every active specification under `openspec/specs/` SHALL include a concrete `## Purpose` section that describes the capability covered by that spec. Active specs SHALL NOT retain archive-generated placeholder Purpose text.

#### Scenario: Placeholder purpose is treated as a defect

- **WHEN** an active spec still contains archive-generated placeholder Purpose text
- **THEN** release-readiness review SHALL treat that spec as incomplete until a concrete Purpose statement is written

#### Scenario: Newly archived capability is normalized before release

- **WHEN** a newly archived change creates or updates an active spec
- **THEN** the resulting active spec SHALL have a concrete Purpose statement before the release review can pass

### Requirement: Active specifications maintain unique requirement headers

Within a single active spec file, each `### Requirement:` header SHALL be unique after a release-readiness normalization pass. Parallel copies of the same requirement header SHALL be merged or removed before the spec corpus is eligible for release.

#### Scenario: Duplicate requirement header is flagged

- **WHEN** an active spec contains two `### Requirement:` blocks with the same header text
- **THEN** release-readiness review SHALL treat the spec as needing normalization before release

#### Scenario: Requirement normalization preserves a single canonical block

- **WHEN** duplicate requirement headers are reconciled during a spec cleanup change
- **THEN** the active spec SHALL retain exactly one canonical requirement block for that header
