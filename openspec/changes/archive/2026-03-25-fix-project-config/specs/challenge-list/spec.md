## MODIFIED Requirements

### Requirement: Challenge list page collects all challenge frontmatter at build time using createContentLoader

The challenges data loader (`docs/shared/challenges.data.ts`) SHALL export `ChallengeData[]`. The `ChallengeData.difficulty` field SHALL be typed as `'easy' | 'medium' | 'hard' | 'mystery'` (a closed union without `| string`) to ensure compile-time type safety for difficulty values.

#### Scenario: Difficulty field rejects arbitrary string values at compile time

- **WHEN** a developer assigns an arbitrary string (e.g., `"unknown"`) to `ChallengeData.difficulty`
- **THEN** the TypeScript compiler SHALL report a type error

#### Scenario: Valid difficulty values are accepted

- **WHEN** a developer assigns `'easy'`, `'medium'`, `'hard'`, or `'mystery'` to `ChallengeData.difficulty`
- **THEN** the TypeScript compiler SHALL accept the assignment without error
