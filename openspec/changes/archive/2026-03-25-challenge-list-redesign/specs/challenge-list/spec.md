## MODIFIED Requirements

### Requirement: Challenge list displays each challenge as a card with metadata and a link

The challenge list layout SHALL render each challenge as a card showing: the challenge `id` as a zero-padded three-digit number (e.g., `#001`), the challenge title, a difficulty badge with semantic color coding, a category badge, a description excerpt (limited to 2-3 lines via CSS line-clamp), tag pills for each tag, a formatted date, and a link to the challenge page. Clicking the card SHALL navigate to the individual challenge page. Difficulty badges SHALL use the following semantic colors: `easy` = green tones, `medium` = yellow/amber tones, `hard` = red tones, `mystery` = purple tones. The card SHALL display a top-edge accent line using the `--ch-accent` color on hover.

#### Scenario: Challenge card displays full metadata including description, tags, and date

- **WHEN** the list page renders a challenge with `id: 1`, `title: "SQL Injection"`, `difficulty: "easy"`, `category: "web"`, `description: "Learn SQL injection..."`, `tags: ["sql", "injection"]`, `date: "2025-03-01T10:30:00.000Z"`
- **THEN** the card SHALL display `#001`, the title, a green-toned easy badge, a web category badge, the description clamped to 2-3 lines, tag pills for each tag, and a formatted date

#### Scenario: Difficulty badge uses semantic color coding

- **WHEN** a challenge has `difficulty: "hard"`
- **THEN** its badge SHALL use red tones (dark: red-transparent bg, red fg; light: red-light bg, dark-red fg)

#### Scenario: Card hover shows accent top-edge line

- **WHEN** the user hovers over a challenge card
- **THEN** a top-edge line using the `--ch-accent` color SHALL become visible and the card border SHALL change to `--ch-border-hover`

#### Scenario: Clicking a challenge card navigates to the challenge

- **WHEN** the user clicks a challenge card
- **THEN** the browser SHALL navigate to the corresponding challenge page

---

## ADDED Requirements

### Requirement: Challenge list provides debounced text search across title, description, and tags

The `ChallengeList` component SHALL include a text search input field. The search SHALL filter challenges by matching the query string against `title`, `description`, and `tags` fields (case-insensitive). The search input SHALL be debounced with a 300ms delay using an inline implementation (`setTimeout` / `clearTimeout`), without depending on `@vueuse/core`.

#### Scenario: Search filters challenges by title

- **WHEN** the user types "SQL" in the search input
- **THEN** after 300ms debounce, only challenges whose title, description, or tags contain "SQL" (case-insensitive) SHALL be displayed

#### Scenario: Search input is debounced at 300ms

- **WHEN** the user types rapidly in the search input
- **THEN** the filter SHALL only execute 300ms after the last keystroke, not on every keystroke

#### Scenario: Clearing the search input shows all challenges

- **WHEN** the user clears the search input
- **THEN** all challenges (subject to other active filters) SHALL be displayed

---

### Requirement: Challenge list provides difficulty and category dropdown filters

The `ChallengeList` component SHALL include a difficulty dropdown filter with options: all (default), easy, medium, hard, mystery. The component SHALL also include a category dropdown filter whose options are dynamically generated from the unique `category` values present in the challenge data. Selecting "all" in either filter SHALL show all challenges for that dimension.

#### Scenario: Filtering by difficulty

- **WHEN** the user selects "hard" from the difficulty dropdown
- **THEN** only challenges with `difficulty: "hard"` SHALL be displayed

#### Scenario: Category dropdown options are dynamically generated

- **WHEN** the challenge data contains categories "web" and "crypto"
- **THEN** the category dropdown SHALL include options: all, web, crypto

#### Scenario: Combining difficulty and category filters

- **WHEN** the user selects difficulty "easy" and category "web"
- **THEN** only challenges matching both `difficulty: "easy"` AND `category: "web"` SHALL be displayed

---

### Requirement: Challenge list provides sort controls with direction toggle

The `ChallengeList` component SHALL include sort controls allowing the user to sort by: ID, difficulty, category, or date. A direction toggle button SHALL switch between ascending and descending order. Difficulty sorting SHALL use the fixed order `['easy', 'medium', 'hard', 'mystery']`, not alphabetical order. The default sort SHALL be by ID ascending.

#### Scenario: Sorting by difficulty uses fixed order

- **WHEN** the user selects sort by "difficulty" in ascending order
- **THEN** challenges SHALL be ordered: easy, medium, hard, mystery

#### Scenario: Toggling sort direction

- **WHEN** the user clicks the direction toggle while sorting by date ascending
- **THEN** the sort direction SHALL change to descending (newest first)

#### Scenario: Default sort is by ID ascending

- **WHEN** the challenge list first renders
- **THEN** challenges SHALL be sorted by ID in ascending order

---

### Requirement: Challenge list supports grid and list view modes

The `ChallengeList` component SHALL provide a view mode toggle between grid view and list view. Grid view SHALL render rich cards with ID, title, badges, description (2-3 line clamp), tags, and date. List view SHALL render compact table rows with ID, title, difficulty, category, and date. The view mode toggle buttons SHALL use the `ch-view-btn` and `ch-view-btn-active` UnoCSS shortcuts.

#### Scenario: Grid view displays rich cards

- **WHEN** the user selects grid view (default)
- **THEN** each challenge SHALL be rendered as a card with ID, title, difficulty badge, category badge, description excerpt, tag pills, and date

#### Scenario: List view displays compact rows

- **WHEN** the user selects list view
- **THEN** each challenge SHALL be rendered as a compact table row showing ID, title, difficulty, category, and date

#### Scenario: View mode persists during filtering

- **WHEN** the user switches to list view and then applies a search filter
- **THEN** the filtered results SHALL continue to render in list view

---

### Requirement: Challenge list displays empty state when no challenges match filters

The `ChallengeList` component SHALL display a user-friendly empty state message when the combination of active search query, difficulty filter, and category filter produces zero matching challenges.

#### Scenario: Empty state message appears when no results match

- **WHEN** the user searches for "nonexistent" and no challenges match
- **THEN** the component SHALL display an empty state message instead of an empty grid/list

#### Scenario: Empty state disappears when filters are relaxed

- **WHEN** the user clears the search query that caused an empty state
- **THEN** the matching challenges SHALL be displayed again and the empty state message SHALL be hidden

---

### Requirement: UnoCSS shortcuts for challenge list controls are defined in uno.config.ts

The `uno.config.ts` file SHALL define the following shortcuts for the challenge list redesign: `ch-input` (search input styling), `ch-select` (dropdown styling), `ch-view-btn` (view toggle button inactive state), `ch-view-btn-active` (view toggle button active state), `ch-tag` (tag pill styling), and `ch-list-row` (list view row styling). All shortcuts SHALL follow the existing `ch-*` naming convention and use CSS custom properties (`--ch-*`) to ensure dark/light theme compatibility.

#### Scenario: ch-input shortcut applies consistent input styling

- **WHEN** a text input element uses the `ch-input` class
- **THEN** it SHALL be styled with border, background, text color, and focus states using `--ch-*` custom properties

#### Scenario: ch-tag shortcut renders tag pills

- **WHEN** a tag element uses the `ch-tag` class
- **THEN** it SHALL render as a small pill with appropriate background and text color from `--ch-*` custom properties

#### Scenario: ch-list-row shortcut applies row styling

- **WHEN** a list view row uses the `ch-list-row` class
- **THEN** it SHALL render with border-bottom, padding, and hover state using `--ch-*` custom properties
