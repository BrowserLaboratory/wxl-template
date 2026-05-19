## ADDED Requirements

### Requirement: Challenge pages use a custom VitePress layout registered as "challenge"

The VitePress theme SHALL register a custom layout named `challenge` in `theme/index.ts` under the `layouts` option. Each challenge `.md` file SHALL declare `layout: challenge` in its YAML frontmatter. The layout SHALL be implemented as `theme/layouts/ChallengeLayout.vue`.

#### Scenario: Challenge page loads with custom layout

- **WHEN** a `.md` file with `layout: challenge` in frontmatter is rendered
- **THEN** VitePress SHALL apply `ChallengeLayout.vue` instead of the default layout and the page SHALL NOT include the default VitePress sidebar or navbar

### Requirement: Challenge layout renders a left-right split view

The `ChallengeLayout.vue` SHALL render a two-column layout: a left column containing the markdown description panel and flag submit form, and a right column containing the Browser, Terminal, and Repeater interaction panels.

#### Scenario: Left and right columns are both visible

- **WHEN** a challenge page loads
- **THEN** the left column (description + flag submit) and the right column (interaction panels) SHALL both be visible simultaneously

### Requirement: Description panel renders markdown via Content component and is collapsible

The left column SHALL include a description panel that renders the challenge page's markdown content using VitePress's `<Content />` component. The panel SHALL be collapsible: clicking a toggle button SHALL collapse the panel to a minimal width and expand the right column to fill the remaining space. Clicking again SHALL restore the panel.

#### Scenario: Description markdown is rendered

- **WHEN** a challenge page loads
- **THEN** the description panel SHALL render the markdown content below the frontmatter as formatted HTML

#### Scenario: User collapses the description panel

- **WHEN** the user clicks the collapse toggle
- **THEN** the description panel SHALL animate to minimal width and the right column SHALL expand to fill the space

#### Scenario: User expands the description panel

- **WHEN** the description panel is collapsed and the user clicks the toggle
- **THEN** the description panel SHALL animate back to its original width

### Requirement: Flag submit form is fixed at the bottom of the left column

The left column SHALL contain a `FlagSubmit` component anchored to the bottom of the column, remaining visible regardless of description scroll position.

#### Scenario: Flag submit is always accessible

- **WHEN** the challenge description is long enough to scroll
- **THEN** the `FlagSubmit` component SHALL remain visible at the bottom of the left column without scrolling

### Requirement: Challenge layout includes a navigation bar with a back link to the challenge list

The `ChallengeLayout.vue` SHALL render a top navigation bar containing: a "← Challenges" link that navigates to the challenge list page, the challenge title from frontmatter, and difficulty and category badges if those frontmatter fields are present.

#### Scenario: Back link navigates to challenge list

- **WHEN** the user clicks "← Challenges"
- **THEN** the browser SHALL navigate to the challenge list page (`/challenges/`)

#### Scenario: Title and badges are shown

- **WHEN** a challenge page with `difficulty` and `category` in frontmatter loads
- **THEN** the nav bar SHALL display the challenge title, difficulty badge, and category badge
