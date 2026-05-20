## ADDED Requirements

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
