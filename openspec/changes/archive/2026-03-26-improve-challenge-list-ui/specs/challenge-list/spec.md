## MODIFIED Requirements

### Requirement: Challenge list supports grid and list view modes

The `ChallengeList.vue` component SHALL provide two view modes: grid and list. The default view mode SHALL be `'list'`. Users SHALL be able to toggle between grid and list via toolbar buttons. Both views SHALL display challenge ID, title, difficulty badge, category badge, description, tags, and date. The component SHALL support text search (title + description + tags), difficulty filter, category filter, and sorting by ID, difficulty, category, or date.

#### Scenario: Default view is list mode

- **WHEN** the Challenges page loads for the first time
- **THEN** the list view SHALL be active (not grid)
- **AND** the list toggle button SHALL appear in active state

#### Scenario: List view displays two-line rows with full information

- **WHEN** list view is active
- **THEN** each challenge SHALL be displayed as a row with two lines:
  - First line: ID badge, title, difficulty badge, category badge, and date (right-aligned)
  - Second line: description (truncated to single line) and tags
- **AND** hovering a row SHALL highlight the background with `var(--ch-bg-soft)` and show a left accent border

#### Scenario: Grid view displays enhanced cards

- **WHEN** grid view is active
- **THEN** each challenge SHALL be displayed as a card with clear visual grouping: title line (ID + title), badges line, description block (2-line clamp), and footer (tags + date)
- **AND** hovering a card SHALL change border to `var(--ch-border-hover)`, apply subtle upward translate, and add shadow

#### Scenario: User toggles between views

- **WHEN** user clicks the grid or list toggle button
- **THEN** the view mode SHALL switch immediately without losing filter/sort state

#### Scenario: Filtering and sorting work in both views

- **WHEN** user applies a difficulty filter, category filter, search query, or sort option
- **THEN** the filtered and sorted results SHALL display correctly in both grid and list views

## NEW Requirements

### Requirement: Challenges page uses full-width page layout

The `challenges.md` frontmatter SHALL specify `layout: page` to use VitePress full-width page layout instead of the default doc layout. The `ChallengeList.vue` container SHALL use `max-w-screen-xl` (1280px) with `mx-auto` centering, ensuring the content fills the viewport on wide screens while remaining centered.

#### Scenario: Challenges page renders at full width

- **WHEN** the Challenges page is loaded
- **THEN** the page content SHALL NOT be constrained by VitePress default doc container (~688px)
- **AND** the challenge list container SHALL have a max-width of 1280px with auto horizontal margins

### Requirement: Homepage about section uses justified text alignment

The `HomeContent.vue` "關於 WXL" section paragraph SHALL use `text-justify` alignment. The paragraph SHALL NOT have an inner max-width constraint (no `max-w-2xl`), allowing text to fill the section width (`max-w-screen-lg`). Line height SHALL be `leading-loose` for readability.

#### Scenario: About section text is justified

- **WHEN** the homepage is loaded and scrolled to the "關於 WXL" section
- **THEN** the paragraph text SHALL be justified (both left and right edges aligned)
- **AND** the paragraph SHALL span the full width of the section container
