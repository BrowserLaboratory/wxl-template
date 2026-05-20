# challenge-list Specification

## Purpose

Provides a build-time data loader and globally registered Vue component that collects all challenge frontmatter and renders a browsable, filterable challenge list page within the VitePress default layout.

## Requirements

### Requirement: Challenge list page collects all challenge frontmatter at build time using createContentLoader

The challenges data loader (`docs/shared/challenges.data.ts`) SHALL export `ChallengeData[]`. The `ChallengeData.difficulty` field SHALL be typed as `'easy' | 'medium' | 'hard' | 'mystery'` (a closed union without `| string`) to ensure compile-time type safety for difficulty values.

#### Scenario: Difficulty field rejects arbitrary string values at compile time

- **WHEN** a developer assigns an arbitrary string (e.g., `"unknown"`) to `ChallengeData.difficulty`
- **THEN** the TypeScript compiler SHALL report a type error

#### Scenario: Valid difficulty values are accepted

- **WHEN** a developer assigns `'easy'`, `'medium'`, `'hard'`, or `'mystery'` to `ChallengeData.difficulty`
- **THEN** the TypeScript compiler SHALL accept the assignment without error


<!-- @trace
source: fix-project-config
updated: 2026-03-25
code:
  - package.json
  - .vitepress/theme/index.ts
  - .github/workflows/release.yml
  - docs/shared/challenges.data.ts
  - tsconfig.json
-->

---
### Requirement: Challenge list page uses a globally registered Vue component embedded in markdown

The challenge list display logic SHALL be implemented as a Vue component (`theme/components/ChallengeList.vue`) globally registered in `enhanceApp` via `app.component('ChallengeList', ChallengeList)`. The `docs/challenges.md` page SHALL use the VitePress default layout and embed `<ChallengeList />` directly in the markdown body. The `challenge-list` layout registration in `theme/index.ts` SHALL be removed, and `ChallengeListLayout.vue` SHALL be deleted.

#### Scenario: Challenge list page renders without layout frontmatter

- **WHEN** the user navigates to `/challenges`
- **THEN** VitePress SHALL apply the default layout and the `<ChallengeList />` component SHALL render all available challenges

#### Scenario: ChallengeList can be embedded in any markdown page

- **WHEN** any `.md` file includes `<ChallengeList />` in its body
- **THEN** the component SHALL render the full challenge list without requiring `layout: challenge-list` in frontmatter


<!-- @trace
source: vitepress-structure-refactor
updated: 2026-03-15
-->


<!-- @trace
source: vitepress-structure-refactor
updated: 2026-03-15
code:
  - .vitepress/theme/index.ts
  - .vitepress/theme/Layout.vue
  - .vitepress/workers/router.ts
  - .vitepress/sw/router.ts
  - docs/challenges/index.md
  - vitest.config.ts
  - .vitepress/theme/components/ChallengeList.vue
  - package.json
  - .vitepress/theme/layouts/ChallengeListLayout.vue
  - .vitepress/theme/components/ChallengeLayout.vue
tests:
  - .vitepress/theme/layouts/ChallengeLayout.test.ts
  - tests/unit/challenge/plugin-obfuscation.test.ts
  - tests/unit/challenge/flag-verifier.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePhpRuntime-post.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/ChallengeList.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
  - tests/unit/components/SourceViewer.test.ts
  - .vitepress/theme/composables/usePhpRuntime-singleton.test.ts
  - .vitepress/sw/router.test.ts
  - tests/e2e/php-demo.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/composables/usePhpRuntime.test.ts
  - tests/e2e/flask-sqli.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - .vitepress/theme/layouts/ChallengeListLayout.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/theme/composables/usePhpRuntime-fs.test.ts
  - tests/unit/composables/usePhpRuntime-headers.test.ts
  - .vitepress/theme/composables/usePhpRuntime-post.test.ts
  - .vitepress/theme/composables/usePythonRuntime.test.ts
  - tests/unit/challenge/plugin.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - tests/unit/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - .vitepress/theme/composables/usePythonRuntime-request.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - tests/unit/composables/usePhpRuntime-fs.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - .vitepress/challenge/plugin.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/config.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - .vitepress/theme/composables/usePhpRuntime-headers.test.ts
  - .vitepress/theme/composables/usePythonRuntime-fs.test.ts
  - tests/unit/composables/usePhpRuntime-singleton.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/workers/router.test.ts
  - .vitepress/theme/composables/usePhpRuntime.test.ts
-->

---
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


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
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


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

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


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

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


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
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


<!-- @trace
source: improve-challenge-list-ui
updated: 2026-03-26
code:
  - uno.config.ts
  - docs/challenges.md
  - .spectra.yaml
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-propose/SKILL.md
  - .vitepress/theme/components/HomeContent.vue
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-propose.prompt.md
  - .vitepress/theme/components/ChallengeList.vue
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/components/ChallengeList.test.ts
-->

---
### Requirement: Challenge list displays empty state when no challenges match filters

The `ChallengeList` component SHALL display a user-friendly empty state message when the combination of active search query, difficulty filter, and category filter produces zero matching challenges.

#### Scenario: Empty state message appears when no results match

- **WHEN** the user searches for "nonexistent" and no challenges match
- **THEN** the component SHALL display an empty state message instead of an empty grid/list

#### Scenario: Empty state disappears when filters are relaxed

- **WHEN** the user clears the search query that caused an empty state
- **THEN** the matching challenges SHALL be displayed again and the empty state message SHALL be hidden


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

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

<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Challenge data loader is locale-aware via per-locale data files sharing one ChallengeData type

The challenge data loading layer SHALL expose one VitePress `createContentLoader` per active locale. For the root English locale, `docs/shared/challenges.data.ts` SHALL glob `challenge/*/index.md` and export `default` plus a named `data: ChallengeData[]`. For the Traditional Chinese locale, `docs/shared/challenges.zh-TW.data.ts` SHALL glob `zh-TW/challenge/*/index.md` and export the same shape. The `ChallengeData` TypeScript interface SHALL be defined exactly once in `docs/shared/challenges.data.ts` and re-imported via `import type { ChallengeData } from './challenges.data'` by `docs/shared/challenges.zh-TW.data.ts`. Both loaders SHALL preserve the closed difficulty union `'easy' | 'medium' | 'hard' | 'mystery'` established by the prior `fix-project-config` change. Markdown pages SHALL select the appropriate loader by import path: `docs/index.md` and `docs/challenges.md` SHALL import from `./shared/challenges.data.ts`; `docs/zh-TW/index.md` and `docs/zh-TW/challenges.md` SHALL import from `../shared/challenges.zh-TW.data.ts`. Vue components (`HomeContent.vue`, `ChallengeList.vue`) SHALL remain locale-agnostic and SHALL receive the active dataset exclusively via the `challenges` prop.

#### Scenario: English root pages load English challenge data

- **WHEN** VitePress builds `/` or `/challenges/` from `docs/index.md` or `docs/challenges.md`
- **THEN** the page SHALL import `data` from `./shared/challenges.data.ts` or `../shared/challenges.data.ts`
- **AND** the resulting `ChallengeData[]` SHALL contain entries scanned from `docs/challenge/*/index.md`
- **AND** each entry's `title` and `description` SHALL be the English frontmatter values from those files

#### Scenario: Traditional Chinese pages load zh-TW challenge data

- **WHEN** VitePress builds `/zh-TW/` or `/zh-TW/challenges/` from `docs/zh-TW/index.md` or `docs/zh-TW/challenges.md`
- **THEN** the page SHALL import `data` from `../shared/challenges.zh-TW.data.ts`
- **AND** the resulting `ChallengeData[]` SHALL contain entries scanned from `docs/zh-TW/challenge/*/index.md`
- **AND** each entry's `title` and `description` SHALL be the Traditional Chinese frontmatter values from those files

#### Scenario: ChallengeData type is defined once and reused

- **WHEN** a developer reads `docs/shared/challenges.zh-TW.data.ts`
- **THEN** the file SHALL contain `import type { ChallengeData } from './challenges.data'`
- **AND** the file SHALL NOT redeclare the `ChallengeData` interface body
- **AND** the TypeScript compiler SHALL resolve `ChallengeData` references in the file to the single definition in `challenges.data.ts`

#### Scenario: Closed difficulty union remains enforced across both loaders

- **WHEN** a developer assigns an arbitrary string (e.g., `"unknown"`) to `ChallengeData.difficulty` in either loader's `transform` function
- **THEN** the TypeScript compiler SHALL report a type error
- **AND** the `'easy' | 'medium' | 'hard' | 'mystery'` union SHALL remain the only accepted set of values

#### Scenario: Vue components do not import data modules directly

- **WHEN** a developer inspects `HomeContent.vue` and `ChallengeList.vue` source
- **THEN** neither component SHALL contain `import { data } from '...challenges.data'` or any similar direct import of a `.data.ts` module
- **AND** both components SHALL receive challenge entries only through the `challenges: ChallengeData[]` prop declared via `defineProps`

##### Example: locale-to-loader mapping

| Markdown page                      | Imports from                                  | Globs                            |
| ---------------------------------- | --------------------------------------------- | -------------------------------- |
| `docs/index.md`                    | `./shared/challenges.data.ts`                 | `challenge/*/index.md`           |
| `docs/challenges.md`               | `./shared/challenges.data.ts`                 | `challenge/*/index.md`           |
| `docs/zh-TW/index.md`              | `../shared/challenges.zh-TW.data.ts`          | `zh-TW/challenge/*/index.md`     |
| `docs/zh-TW/challenges.md`         | `../shared/challenges.zh-TW.data.ts`          | `zh-TW/challenge/*/index.md`     |

---
### Requirement: Challenge frontmatter values are localized per content tree

For every challenge slug that exists in both `docs/challenge/<slug>/index.md` and `docs/zh-TW/challenge/<slug>/index.md`, the two files SHALL share identical values for technical frontmatter fields (`difficulty`, `category`, `backend`, `app`, `packages`, `tools`, `source_visible`, `date`, `tags`, `wasmModule`). Only the user-facing fields `title` and `description`, plus the markdown body, SHALL differ between the two files: the root tree SHALL contain English values, and the `zh-TW` tree SHALL contain Traditional Chinese values. This invariant ensures that `ChallengeList` sorting, filtering, and runtime behavior remain consistent across locales.

#### Scenario: Technical frontmatter fields are byte-identical across locales

- **WHEN** a reviewer compares `docs/challenge/door-is-open/index.md` and `docs/zh-TW/challenge/door-is-open/index.md` frontmatter
- **THEN** the `date`, `difficulty`, `category`, `backend`, `app`, `packages`, `tools`, `source_visible`, `tags`, and `wasmModule` field values SHALL be byte-identical
- **AND** the `title` and `description` field values SHALL differ in language: English in the root file, Traditional Chinese in the `zh-TW` file

#### Scenario: ChallengeList sorting is consistent across locales

- **WHEN** a user opens `/challenges` and `/zh-TW/challenges` and applies the same sort option (e.g., sort by date descending)
- **THEN** the displayed challenge cards SHALL appear in the same order on both pages
- **AND** only the rendered `title` and `description` text SHALL differ between the two pages

---
### Requirement: Component formatDate respects active i18n locale

The challenge date formatting helper used by `HomeContent.vue` and `ChallengeList.vue` SHALL call `Intl.DateTimeFormat` (via `Date.prototype.toLocaleDateString`) with a locale string derived from the active vue-i18n locale. When the active locale is `'zh-TW'`, the formatter SHALL receive `'zh-TW'`. For any other active locale value (including the default `'en'`), the formatter SHALL receive `'en-US'`. The format options (`year: 'numeric'`, `month: 'short'`, `day: 'numeric'`) SHALL remain unchanged. The helper SHALL react to locale changes via vue-i18n's reactive `locale` ref so that switching language re-renders dates without a page reload.

#### Scenario: English locale produces English-format dates

- **WHEN** the active i18n locale is `'en'` and `formatDate('2026-04-02T08:54:17.674Z')` is called
- **THEN** the returned string SHALL be formatted according to `Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })`
- **AND** the visible output SHALL resemble `Apr 2, 2026`

#### Scenario: Traditional Chinese locale produces Chinese-format dates

- **WHEN** the active i18n locale is `'zh-TW'` and `formatDate('2026-04-02T08:54:17.674Z')` is called
- **THEN** the returned string SHALL be formatted according to `Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })`
- **AND** the visible output SHALL include CJK characters such as `年` and `月`

#### Scenario: Locale switch re-renders dates without reload

- **WHEN** the user is viewing the home page in `'en'` locale with date cards displayed in English format
- **AND** the user clicks LocaleSwitcher to switch to `'zh-TW'`
- **THEN** the displayed date strings SHALL update to Traditional Chinese format reactively
- **AND** no full page reload SHALL be required for the date format to update
