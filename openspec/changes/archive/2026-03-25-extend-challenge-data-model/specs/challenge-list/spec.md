## MODIFIED Requirements

### Requirement: Challenge list page collects all challenge frontmatter at build time using createContentLoader

A VitePress data loader file (`docs/shared/challenges.data.ts`) SHALL use `createContentLoader('challenge/*.md', { excerpt: true })` to collect frontmatter from all challenge `.md` files at build time. The exported data SHALL be typed as `ChallengeData` and include: `title`, `url`, `difficulty`, `category`, `id`, `date`, `tags`, and `description`. The `ChallengeData` interface SHALL define `difficulty` with correct spelling (`'easy'`, not `'esay'`).

#### Scenario: Data loader exports typed challenge entries with extended fields

- **WHEN** VitePress builds the site
- **THEN** `challenges.data.ts` SHALL export a `ChallengeData[]` array with one entry per `docs/challenge/*.md` file, each containing `title`, `url`, `difficulty`, `category`, `id`, `date`, `tags`, and `description` fields

#### Scenario: Missing optional fields use fallback values

- **WHEN** a challenge `.md` file omits `date`, `tags`, or `description` in its frontmatter
- **THEN** the data loader SHALL use fallback values: `date` as `null`, `tags` as `[]`, and `description` as `''`

#### Scenario: Adding a new challenge file auto-includes it in the list

- **WHEN** a new `.md` file is added to `docs/challenge/`
- **THEN** the next build SHALL include the new challenge in the list without any manual configuration change
