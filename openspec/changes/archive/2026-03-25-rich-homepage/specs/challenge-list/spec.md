## MODIFIED Requirements

### Requirement: Challenge list page collects all challenge frontmatter at build time using createContentLoader

The challenges data loader (`docs/shared/challenges.data.ts`) SHALL continue to export `ChallengeData[]` as defined in the existing `challenge-list` spec. In addition to being consumed by the challenge list page, the `HomeContent.vue` component SHALL import this same data loader to retrieve challenge entries for displaying latest challenges on the homepage. No modifications to the data loader's exports or types are required; this change only adds a new consumer.

#### Scenario: HomeContent reads challenge data without modifying the loader

- **WHEN** the homepage loads
- **THEN** `HomeContent.vue` SHALL import and use the data from `challenges.data.ts` to display the latest 3 challenges, without modifying the data loader's exports or types
