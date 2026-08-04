## MODIFIED Requirements

### Requirement: Challenge list page uses a globally registered Vue component embedded in markdown

The challenge list display logic SHALL be implemented as a Vue component (`.vitepress/theme/components/ChallengeList.vue`) globally registered in `enhanceApp` via `app.component('ChallengeList', ChallengeList)`. The `docs/challenges.md` and `docs/zh-TW/challenges.md` pages SHALL declare `layout: page` in frontmatter — a layout name resolved by the VitePress default theme, whose `VPContent.vue` dispatches `frontmatter.layout === 'page'` to its `VPPage` component — and SHALL NOT name a layout component registered by this project's theme. Each page SHALL embed the component with an explicit dataset: a `<script setup>` block SHALL import `data` from that locale's loader (`./shared/challenges.data.ts` for the root English page, `../shared/challenges.zh-TW.data.ts` for the Traditional Chinese page) and the markdown body SHALL contain `<ChallengeList :challenges="data" />`. The `challenges` prop is declared non-optional via `defineProps<{ challenges: ChallengeData[] }>()`, so a bare `<ChallengeList />` SHALL NOT be a supported usage. `.vitepress/theme/index.ts` SHALL NOT register a layout named `challenge-list`, and `.vitepress/theme/layouts/ChallengeListLayout.vue` SHALL NOT exist.

#### Scenario: Challenge list page renders through the default theme page layout

- **WHEN** the user navigates to `/challenges`
- **THEN** VitePress SHALL render the page through the default theme's `page` layout, selected by the `layout: page` frontmatter key
- **AND** the `<ChallengeList :challenges="data" />` element SHALL render every entry of the dataset imported from `./shared/challenges.data.ts`, because no search, difficulty, or category filter is active on first render

#### Scenario: ChallengeList can be embedded in any markdown page that supplies the challenges prop

- **WHEN** any `.md` file adds a `<script setup>` block importing `data` from a challenges data loader and embeds `<ChallengeList :challenges="data" />` in its body
- **THEN** the component SHALL render the imported challenge entries without requiring `layout: challenge-list` in frontmatter and without requiring any project-defined theme layout component
- **AND** embedding `<ChallengeList />` without the `challenges` prop SHALL NOT be a supported usage — the `challenges` prop is declared non-optional, and mounting the component without it SHALL NOT render the list

### Requirement: Challenge data loader is locale-aware via per-locale data files sharing one ChallengeData type

The challenge data loading layer SHALL expose one VitePress `createContentLoader` per active locale. For the root English locale, `docs/shared/challenges.data.ts` SHALL glob `challenge/*/index.md` and export `default` plus a named `data: ChallengeData[]`. For the Traditional Chinese locale, `docs/shared/challenges.zh-TW.data.ts` SHALL glob `zh-TW/challenge/*/index.md` and export the same shape. The `ChallengeData` TypeScript interface SHALL be defined exactly once in `docs/shared/challenges.data.ts` and re-imported via `import type { ChallengeData } from './challenges.data'` by `docs/shared/challenges.zh-TW.data.ts`. Both loaders SHALL preserve the closed difficulty union `'easy' | 'medium' | 'hard' | 'mystery'` established by the prior `fix-project-config` change. Markdown pages SHALL select the appropriate loader by import path: `docs/index.md` and `docs/challenges.md` SHALL import from `./shared/challenges.data.ts`; `docs/zh-TW/index.md` and `docs/zh-TW/challenges.md` SHALL import from `../shared/challenges.zh-TW.data.ts`. Vue components (`HomeContent.vue`, `ChallengeList.vue`) SHALL remain locale-agnostic and SHALL receive the active dataset exclusively via the `challenges` prop. Those components SHALL NOT contain a value import of any `.data.ts` module. A type-only import of the `ChallengeData` interface SHALL be permitted in those components: an `import type` declaration is erased by the TypeScript compiler and emits no runtime import, so it carries no challenge data into the component and does not bind it to a locale.

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

#### Scenario: Vue components import the ChallengeData type but never the data value

- **WHEN** a developer inspects `HomeContent.vue` and `ChallengeList.vue` source
- **THEN** neither component SHALL contain a value import from a `.data.ts` module, such as `import { data } from '...challenges.data'`
- **AND** both components SHALL receive challenge entries only through the `challenges: ChallengeData[]` prop declared via `defineProps`
- **AND** the type-only line `import type { ChallengeData } from '../../../docs/shared/challenges.data'` present in both components SHALL remain permitted, because it is erased at compile time and imports no value

##### Example: locale-to-loader mapping

| Markdown page                      | Imports from                                  | Globs                            |
| ---------------------------------- | --------------------------------------------- | -------------------------------- |
| `docs/index.md`                    | `./shared/challenges.data.ts`                 | `challenge/*/index.md`           |
| `docs/challenges.md`               | `./shared/challenges.data.ts`                 | `challenge/*/index.md`           |
| `docs/zh-TW/index.md`              | `../shared/challenges.zh-TW.data.ts`          | `zh-TW/challenge/*/index.md`     |
| `docs/zh-TW/challenges.md`         | `../shared/challenges.zh-TW.data.ts`          | `zh-TW/challenge/*/index.md`     |

### Requirement: Challenge frontmatter values are localized per content tree

For every challenge slug that exists in both `docs/challenge/<slug>/index.md` and `docs/zh-TW/challenge/<slug>/index.md`, the two files SHALL share identical values for technical frontmatter fields (`difficulty`, `category`, `backend`, `app`, `packages`, `tools`, `source_visible`, `date`, `tags`, `wasmModule`). Only the user-facing fields `title` and `description`, plus the markdown body, SHALL differ between the two files: the root tree SHALL contain English values, and the `zh-TW` tree SHALL contain Traditional Chinese values. This invariant ensures that `ChallengeList` sorting, filtering, and runtime behavior remain consistent across locales.

#### Scenario: Technical frontmatter fields are byte-identical across locales

- **WHEN** a reviewer compares `docs/challenge/door-is-open/index.md` and `docs/zh-TW/challenge/door-is-open/index.md` frontmatter
- **THEN** the `date`, `difficulty`, `category`, `backend`, `app`, `packages`, `tools`, `source_visible`, `tags`, and `wasmModule` field values SHALL be byte-identical
- **AND** the `title` and `description` field values SHALL differ in language: English in the root file, Traditional Chinese in the `zh-TW` file

#### Scenario: ChallengeList sorting is consistent across locales

- **WHEN** a user opens `/challenges` and `/zh-TW/challenges` and applies the same sort option (e.g., sort by date descending)
- **THEN** the displayed challenge entries SHALL appear in the same order on both pages
- **AND** only the rendered `title` and `description` text SHALL differ between the two pages

## REMOVED Requirements

### Requirement: Challenge list displays each challenge as a card with metadata and a link

**Reason**: Both the name and the body are false statements about the shipped component. The name asserts a card per challenge, but `viewMode` in `.vitepress/theme/components/ChallengeList.vue` is initialised to `'list'`, so the default rendering is rows, not cards. The body credits the rendering to a "challenge list layout" that does not exist, states a 2-3 line description clamp where the code clamps to 2 lines in grid view and truncates to 1 line in list view, and promises a top-edge accent line on hover that the `ch-card` shortcut in `uno.config.ts` never draws. A requirement name cannot be changed through a `MODIFIED` block, so the requirement is removed here and re-added under a corrected name. The same "cards on `/challenges`" falsity in the `Challenge frontmatter values are localized per content tree` requirement is corrected in the `MODIFIED` section of this delta rather than removed, because only its scenario wording is affected, not its name.

**Migration**: Replaced by `### Requirement: Challenge list renders each challenge as a list row by default and as a card in grid view`, added in this same delta. Every scenario of this requirement is carried over there in corrected form, with one exception: the `--ch-accent` top-edge hover line is dropped rather than carried over, because no code has ever drawn it. The replacement states that negation explicitly, so the dropped obligation cannot silently return. This edit changes spec prose only; runtime behavior is unchanged.

## ADDED Requirements

### Requirement: Challenge list renders each challenge as a list row by default and as a card in grid view

`.vitepress/theme/components/ChallengeList.vue` SHALL render the challenge entries it receives through the `challenges` prop, subject to the active search, filter, and sort state, and no component under `.vitepress/theme/layouts/` SHALL render the challenge list. The component's `viewMode` ref SHALL default to `'list'`, so the default rendering SHALL be one row per rendered challenge; when grid view is active the same entries SHALL be rendered as cards.

In both views each entry SHALL show: the challenge `id` rendered by the `paddedId` helper (a `#` prefix followed by the number left-padded with zeroes to a minimum of three digits, e.g. `#001`), the challenge title, a difficulty badge with semantic color coding when the entry has a `difficulty` value, a category badge when it has a `category` value, a description excerpt when it has a `description` value, one tag pill per entry in `tags`, a formatted date when it has a `date` value, and a link to the challenge page. The description excerpt SHALL be clamped to two lines in grid view (`line-clamp-2`) and truncated to a single line in list view (`truncate`). Each rendered entry SHALL be an anchor element whose `href` is `withBase(url)`, so activating a card or a row SHALL navigate to that challenge's page.

Difficulty badges SHALL use the following semantic colors, supplied through the `--ch-*` custom properties behind the `ch-badge-*` shortcuts: `easy` = green tones, `medium` = yellow/amber tones, `hard` = red tones, `mystery` = purple tones.

Hover feedback SHALL differ by view. In grid view the `ch-card` shortcut SHALL change the border color to `--ch-border-hover`, translate the card upward, and add a box shadow; it SHALL NOT draw a top-edge accent line. In list view the `ch-list-row` shortcut SHALL change the row background to `--ch-bg-soft` and change its left border from transparent to `--ch-accent`.

#### Scenario: Grid view card displays full metadata including description, tags, and date

- **WHEN** grid view is active and the list page renders a challenge with `id: 1`, `title: "SQL Injection"`, `difficulty: "easy"`, `category: "web"`, `description: "Learn SQL injection..."`, `tags: ["sql", "injection"]`, `date: "2025-03-01T10:30:00.000Z"`
- **THEN** the card SHALL display `#001`, the title, a green-toned easy badge, a web category badge, the description clamped to 2 lines, a tag pill for each tag, and a formatted date

#### Scenario: List view row displays full metadata with a single-line description

- **WHEN** list view is active — the default — and the list page renders the same challenge
- **THEN** the row SHALL display `#001`, the title, a green-toned easy badge, a web category badge, a formatted date, the description truncated to a single line, and a tag pill for each tag

#### Scenario: Difficulty badge uses semantic color coding

- **WHEN** a challenge has `difficulty: "hard"`
- **THEN** its badge SHALL use red tones (dark: red-transparent bg, red fg; light: red-light bg, dark-red fg)

#### Scenario: Grid card hover changes border, lifts the card, and adds a shadow

- **WHEN** the user hovers over a challenge card in grid view
- **THEN** the card border SHALL change to `--ch-border-hover`, the card SHALL translate upward, and a box shadow SHALL be applied
- **AND** no top-edge accent line SHALL appear

#### Scenario: List row hover highlights the row and reveals a left accent border

- **WHEN** the user hovers over a challenge row in list view
- **THEN** the row background SHALL change to `--ch-bg-soft`
- **AND** its left border SHALL change from transparent to `--ch-accent`

#### Scenario: Clicking a challenge entry navigates to the challenge

- **WHEN** the user clicks a challenge card in grid view or a challenge row in list view
- **THEN** the browser SHALL navigate to `withBase(url)` of that challenge, which is the individual challenge page
