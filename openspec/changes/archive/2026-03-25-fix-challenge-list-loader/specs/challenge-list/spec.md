## MODIFIED Requirements

### Requirement: Challenge list page collects all challenge frontmatter at build time using createContentLoader

The challenges data loader (`docs/shared/challenges.data.ts`) SHALL use `createContentLoader('challenge/*/index.md', ...)` to match per-folder challenge structure. The loader SHALL NOT filter out pages whose URL ends with `/`. The loader SHALL export `ChallengeData[]` for consumption by both the challenge list page and the `HomeContent.vue` component.

#### Scenario: Per-folder challenges are loaded by the data loader

- **WHEN** challenges exist at `docs/challenge/<slug>/index.md` with valid frontmatter
- **THEN** the data loader SHALL include each challenge in the exported `ChallengeData[]` array with correct `title`, `url`, `difficulty`, `category`, `date`, `tags`, and `description` fields

#### Scenario: HomeContent reads challenge data without modifying the loader

- **WHEN** the homepage loads
- **THEN** `HomeContent.vue` SHALL import and use the data from `challenges.data.ts` to display the latest 3 challenges, without modifying the data loader's exports or types

#### Scenario: Empty challenge directory produces empty array

- **WHEN** no `challenge/*/index.md` files exist
- **THEN** the data loader SHALL export an empty `ChallengeData[]` array without error
