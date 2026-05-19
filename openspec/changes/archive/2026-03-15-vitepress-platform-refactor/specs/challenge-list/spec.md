## ADDED Requirements

### Requirement: Challenge list page collects all challenge frontmatter at build time using createContentLoader

A VitePress data loader file (`docs/challenges/challenges.data.ts`) SHALL use `createContentLoader('challenges/*.md', { excerpt: true })` to collect frontmatter from all challenge `.md` files at build time. The exported data SHALL be typed and include at minimum: `title`, `difficulty`, `category`, and the URL of each challenge page.

#### Scenario: Data loader exports typed challenge entries

- **WHEN** VitePress builds the site
- **THEN** `challenges.data.ts` SHALL export a `ChallengeData[]` array with one entry per `docs/challenges/*.md` file, each containing `title`, `url`, `difficulty`, and `category` fields

#### Scenario: Adding a new challenge file auto-includes it in the list

- **WHEN** a new `.md` file is added to `docs/challenges/`
- **THEN** the next build SHALL include the new challenge in the list without any manual configuration change

### Requirement: Challenge list page uses a custom "challenge-list" layout

The `docs/challenges/index.md` page SHALL declare `layout: challenge-list` in its frontmatter. The theme SHALL register a `challenge-list` layout in `theme/index.ts`. This layout SHALL import and render the challenge data from `challenges.data.ts`.

#### Scenario: Challenge list layout is applied

- **WHEN** the user navigates to `/challenges/`
- **THEN** VitePress SHALL apply the `challenge-list` layout and display all available challenges

### Requirement: Challenge list displays each challenge as a card with metadata and a link

The challenge list layout SHALL render each challenge as a card showing: the challenge title, difficulty badge, category badge, and a link to the challenge page. Clicking the card or its title SHALL navigate to the individual challenge page.

#### Scenario: Challenge card displays correct metadata

- **WHEN** the list page renders a challenge with `title: "SQL Injection 入門"`, `difficulty: "beginner"`, `category: "SQLi"`
- **THEN** the card SHALL display those exact values and a link to the challenge URL

#### Scenario: Clicking a challenge card navigates to the challenge

- **WHEN** the user clicks a challenge card
- **THEN** the browser SHALL navigate to the corresponding challenge page
