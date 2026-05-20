# i18n-runtime Specification

## Purpose

Provides the runtime internationalization (i18n) foundation for the VitePress documentation site, enabling parallel English (default) and Traditional Chinese (`zh-TW`) experiences. Defines how `vue-i18n` is installed and bootstrapped, how locale messages are organized and validated, how the `LocaleSwitcher` UI lets users toggle locales, how initial locale detection resolves between `localStorage` and URL prefix, how VitePress is configured to emit both locale trees, where parallel localized content lives, and what Vitest coverage protects the contract.

## Requirements

### Requirement: vue-i18n plugin installed via enhanceApp with English as default and fallback locale

The system SHALL install `vue-i18n` (version range `^10`) as a runtime dependency in `package.json`. The custom VitePress theme at `.vitepress/theme/index.ts` SHALL call `app.use(i18n)` inside `enhanceApp`, where `i18n` is a `createI18n` instance configured with `legacy: false`, `locale: 'en'`, `fallbackLocale: 'en'`, `globalInjection: true`, and `messages` containing two locales: `en` and `zh-TW`. The instance SHALL be exported from `.vitepress/theme/i18n/index.ts` so that test code and `LocaleSwitcher` can import it.

#### Scenario: enhanceApp installs i18n alongside Pinia

- **WHEN** the VitePress dev or build process boots the theme
- **THEN** `enhanceApp({ app })` SHALL invoke `app.use(i18n)` after `app.use(createPinia())`
- **AND** subsequent component setup SHALL be able to call `useI18n()` without throwing

#### Scenario: vue-i18n is a runtime dependency

- **WHEN** a developer runs `pnpm install`
- **THEN** `node_modules/vue-i18n` SHALL exist
- **AND** `package.json` `dependencies` SHALL list `vue-i18n` with a version specifier of `^10` or compatible

#### Scenario: $t() resolves at template compile time

- **WHEN** a Vue single-file component template uses `{{ $t('flag_submit.submit_button') }}`
- **THEN** the rendered output SHALL be the leaf value for that key in the active locale's message file
- **AND** if the key is missing in the active locale, the value from the `en` fallback SHALL be used

---
### Requirement: Locale message files exist for en and zh-TW with parity of keys

The system SHALL provide two locale message files at `.vitepress/theme/i18n/messages/en.json` and `.vitepress/theme/i18n/messages/zh-TW.json`. Both files SHALL share the exact same nested key structure (key parity). Each leaf value SHALL be a string. The `en` file SHALL NOT contain any CJK Unified Ideograph (U+4E00–U+9FFF) in any leaf value. The `zh-TW` file SHALL contain at least one CJK Unified Ideograph in every leaf value that represents user-facing UI text (keys representing identifiers, codes, or non-translatable terms are exempt only if also non-translatable in `en`).

#### Scenario: en.json and zh-TW.json keys match exactly

- **WHEN** a tooling step or test enumerates the key paths of both files
- **THEN** the sorted set of key paths SHALL be identical between the two files

##### Example: parity check

| en.json keys                                              | zh-TW.json keys                                            | Result |
| --------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| `flag_submit.submit_button`, `flag_submit.success_label`  | `flag_submit.submit_button`, `flag_submit.success_label`   | pass   |
| `flag_submit.submit_button`, `flag_submit.success_label`  | `flag_submit.submit_button`                                | fail (missing key in zh-TW) |
| `flag_submit.submit_button`                               | `flag_submit.submit_button`, `flag_submit.success_label`   | fail (extra key in zh-TW) |

#### Scenario: en.json contains no CJK characters

- **WHEN** the message file `.vitepress/theme/i18n/messages/en.json` is scanned for code points in the range U+4E00–U+9FFF
- **THEN** zero matches SHALL be found

#### Scenario: zh-TW.json values contain Traditional Chinese

- **WHEN** the message file `.vitepress/theme/i18n/messages/zh-TW.json` is scanned for code points in the range U+4E00–U+9FFF
- **THEN** at least one match SHALL be found in every leaf value that is translated user-facing text

---
### Requirement: Vue components in custom theme do not contain CJK literals in template or attribute strings

After this change is implemented, the system SHALL ensure that no Vue single-file component under `.vitepress/theme/components/*.vue` contains CJK Unified Ideograph code points (U+4E00–U+9FFF) in the `<template>` section or in any attribute string literal (`placeholder`, `title`, `aria-label`, button text, span text). All such strings SHALL be sourced via `$t('<key>')` or `useI18n().t('<key>')`.

#### Scenario: ripgrep scan finds no CJK in component templates

- **WHEN** a developer runs `rg '[一-鿿]' .vitepress/theme/components/`
- **THEN** the command SHALL exit with status 1 (no matches) for files included in this change's scope (FlagSubmit, HomeContent, ChallengeList, MergedNav, NotesButton, NotesModal, NoteCard, NoteEditor)

#### Scenario: every replaced string has a message key

- **WHEN** a string previously written as CJK literal in a component is now rendered via `$t(key)`
- **THEN** the same key SHALL exist in both `en.json` and `zh-TW.json`
- **AND** the `zh-TW` value SHALL be the original CJK string verbatim (no rewording during this change)

---
### Requirement: LocaleSwitcher component provides UI to change active locale

The system SHALL render a locale-switcher UI element in the navigation area of every public page. On challenge pages (using `layout: challenge`), the UI element SHALL be the custom `LocaleSwitcher.vue` component mounted inside `MergedNav.vue`. On default-theme pages (home, challenges index, guide), the UI element MAY be either: (a) VitePress's built-in `VPNavBarTranslations` dropdown (the default, enabled by configuring `locales` in `.vitepress/config.mts`), OR (b) the custom `LocaleSwitcher.vue` component mounted into the `nav-bar-content-before` slot. The choice between (a) and (b) on default-theme pages SHALL be controlled by the `USE_CUSTOM_LOCALE_SWITCHER` constant in `.vitepress/theme/index.ts`.

Selecting an entry in the active UI element SHALL change `i18n.global.locale.value` and SHALL write the selected locale to `localStorage` under the key `wxl-locale`. When the active UI element is the custom `LocaleSwitcher`, this update path runs inside the component's click handler. When the active UI element is VitePress's built-in, this update path runs inside a route watcher registered in the Layout setup (see the Requirement below for `Route-prefix change syncs vue-i18n locale`).

#### Scenario: switching from English to Traditional Chinese

- **GIVEN** the current URL pathname is `/challenges/door-is-open/` and active locale is `en`
- **WHEN** the user activates the `繁體中文` entry in the active locale switcher
- **THEN** `i18n.global.locale.value` SHALL become `'zh-TW'`
- **AND** `localStorage.getItem('wxl-locale')` SHALL return `'zh-TW'`
- **AND** the browser SHALL navigate to `/zh-TW/challenges/door-is-open/`

#### Scenario: switching from Traditional Chinese back to English

- **GIVEN** the current URL pathname is `/zh-TW/guide/` and active locale is `zh-TW`
- **WHEN** the user activates the `English` entry in the active locale switcher
- **THEN** `i18n.global.locale.value` SHALL become `'en'`
- **AND** `localStorage.getItem('wxl-locale')` SHALL return `'en'`
- **AND** the browser SHALL navigate to `/guide/`

#### Scenario: LocaleSwitcher renders inside MergedNav on challenge pages

- **WHEN** a challenge page using `layout: challenge` is rendered
- **THEN** the MergedNav right section SHALL contain a `LocaleSwitcher` element regardless of the `USE_CUSTOM_LOCALE_SWITCHER` flag value

#### Scenario: A locale switcher is reachable on default theme pages

- **WHEN** a home, challenges index, or guide page is rendered (non-challenge layout)
- **THEN** a locale-switcher UI element SHALL be reachable in the page's navigation area
- **AND** the element SHALL be either `VPNavBarTranslations` (when `USE_CUSTOM_LOCALE_SWITCHER` is `false`) or `LocaleSwitcher` (when `USE_CUSTOM_LOCALE_SWITCHER` is `true`)

#### Scenario: Switching the feature flag value does not require a spec change

- **GIVEN** the project is currently configured with `USE_CUSTOM_LOCALE_SWITCHER = false`
- **WHEN** a maintainer edits `.vitepress/theme/index.ts` to set the constant to `true` and rebuilds
- **THEN** the custom `LocaleSwitcher` SHALL be the active UI element on default theme pages
- **AND** the built-in `VPNavBarTranslations` SHALL be hidden via the `body.use-custom-locale-switcher` CSS scope
- **AND** all preceding scenarios in this Requirement SHALL continue to PASS

---
### Requirement: Init-time locale detection follows localStorage then URL prefix

On initial page load, the system SHALL determine the active locale by the following ordered precedence:

1. If `localStorage.getItem('wxl-locale')` returns a known locale code (`en` or `zh-TW`), use it.
2. Otherwise, if the current `window.location.pathname` starts with `/zh-TW/` (or equals `/zh-TW`), use `zh-TW`.
3. Otherwise, use `en`.

After detection, the system SHALL: (a) set `i18n.global.locale.value` to the detected locale, and (b) persist the detected locale to `localStorage` under the key `wxl-locale`. If `localStorage` is unavailable (e.g., private browsing), the system SHALL fall back to URL-prefix detection silently without raising user-facing errors.

#### Scenario: localStorage value drives initial locale

- **GIVEN** `localStorage.wxl-locale` is `'zh-TW'` and URL pathname is `/`
- **WHEN** the page loads
- **THEN** `i18n.global.locale.value` SHALL be `'zh-TW'`

#### Scenario: URL prefix drives initial locale when localStorage is empty

- **GIVEN** `localStorage.wxl-locale` is absent and URL pathname is `/zh-TW/challenges/`
- **WHEN** the page loads
- **THEN** `i18n.global.locale.value` SHALL be `'zh-TW'`
- **AND** `localStorage.wxl-locale` SHALL be written as `'zh-TW'`

#### Scenario: URL takes precedence when localStorage conflicts with pathname

- **GIVEN** `localStorage.wxl-locale` is `'en'` and URL pathname is `/zh-TW/`
- **WHEN** the page loads via direct link or refresh
- **THEN** `i18n.global.locale.value` SHALL be `'zh-TW'` because the user explicitly requested the localized URL
- **AND** `localStorage.wxl-locale` SHALL be overwritten to `'zh-TW'`

##### Example: precedence matrix

| localStorage    | URL pathname         | Resulting locale | localStorage after |
| --------------- | -------------------- | ---------------- | ------------------ |
| `'en'`          | `/`                  | `en`             | `'en'`             |
| `'zh-TW'`       | `/`                  | `zh-TW`          | `'zh-TW'`          |
| (absent)        | `/zh-TW/guide/`      | `zh-TW`          | `'zh-TW'`          |
| (absent)        | `/`                  | `en`             | `'en'`             |
| `'en'`          | `/zh-TW/`            | `zh-TW`          | `'zh-TW'`          |
| `'zh-TW'`       | `/`                  | `zh-TW`          | `'zh-TW'`          |
| invalid value   | `/`                  | `en`             | `'en'`             |

---
### Requirement: VitePress config exposes locales for root EN and zh-TW subpath

The system SHALL configure `.vitepress/config.mts` with a `locales` object containing exactly two entries: `root` (representing English, `lang: 'en-US'`, `label: 'English'`) and `'zh-TW'` (`lang: 'zh-TW'`, `label: '繁體中文'`, `link: '/zh-TW/'`). Each locale entry SHALL provide its own `themeConfig` with locale-appropriate `nav`, `sidebar`, and `socialLinks`. The top-level `themeConfig` SHALL NOT contain hard-coded `nav` or `sidebar` entries that overlap with locale-scoped ones.

#### Scenario: docs:build produces both locale trees

- **WHEN** a developer runs `pnpm docs:build`
- **THEN** the build SHALL exit with status 0
- **AND** the output directory SHALL contain `index.html` for the root English locale
- **AND** the output directory SHALL contain `zh-TW/index.html` for the Traditional Chinese locale

#### Scenario: English page sets lang attribute to en-US

- **WHEN** the built page at `/` is loaded in a browser
- **THEN** the document `<html>` element SHALL have `lang="en-US"`

#### Scenario: Traditional Chinese page sets lang attribute to zh-TW

- **WHEN** the built page at `/zh-TW/` is loaded in a browser
- **THEN** the document `<html>` element SHALL have `lang="zh-TW"`

---
### Requirement: docs/zh-TW/ parallel tree carries existing Traditional Chinese content

The system SHALL create a parallel content tree under `docs/zh-TW/` that mirrors at least the following pages from the root tree: `docs/zh-TW/index.md`, `docs/zh-TW/challenges/index.md`, `docs/zh-TW/guide/index.md`, `docs/zh-TW/guide/python.md`, `docs/zh-TW/guide/terminal.md`, and `docs/zh-TW/guide/network.md`. Each file in `docs/zh-TW/` SHALL contain the existing Traditional Chinese content (verbatim from prior to this change). The root tree counterparts SHALL contain English content for the homepage hero/features, and English placeholders with correct frontmatter for the remaining pages (full content migration is deferred to a subsequent change).

#### Scenario: zh-TW home page preserves existing hero

- **WHEN** a developer reads `docs/zh-TW/index.md`
- **THEN** the file SHALL contain the prior Traditional Chinese hero `text`, `tagline`, action labels, and feature entries verbatim from the root `docs/index.md` as it existed before this change

#### Scenario: English root home has English hero and features

- **WHEN** a developer reads `docs/index.md`
- **THEN** the hero `text`, `tagline`, action labels, and feature entries SHALL be written in English
- **AND** the file SHALL NOT contain any CJK Unified Ideograph code points in its frontmatter or body

#### Scenario: zh-TW tree is reachable via VitePress routing

- **WHEN** a built site is served and a user requests `/zh-TW/guide/python`
- **THEN** the response SHALL be the rendered HTML of `docs/zh-TW/guide/python.md`
- **AND** the response status SHALL be 200

---
### Requirement: Vitest coverage validates LocaleSwitcher and message-shape parity

The system SHALL include two new test files under `tests/unit/i18n/`: `locale-switcher.test.ts` and `messages-shape.test.ts`. The `messages-shape` test SHALL validate that `en.json` and `zh-TW.json` share identical nested key paths and SHALL enforce the CJK rules described elsewhere in this spec. The `locale-switcher` test SHALL mount `LocaleSwitcher.vue` with a vue-i18n test instance and SHALL verify the URL transformation, locale state update, and localStorage persistence for both directions.

#### Scenario: messages-shape test catches missing key

- **GIVEN** `en.json` defines key `flag_submit.success_label` but `zh-TW.json` omits it
- **WHEN** `pnpm test tests/unit/i18n/messages-shape.test.ts` runs
- **THEN** the test SHALL fail with an assertion identifying the missing key path

#### Scenario: locale-switcher test catches broken URL mapping

- **GIVEN** `LocaleSwitcher.vue` regresses such that switching to `zh-TW` no longer prepends `/zh-TW`
- **WHEN** `pnpm test tests/unit/i18n/locale-switcher.test.ts` runs
- **THEN** the test SHALL fail with an assertion identifying the incorrect target URL


<!-- @trace
source: i18n-runtime-foundation
updated: 2026-05-20
code:
  - package.json
  - .vitepress/config.mts
  - .vitepress/theme/index.ts
  - .vitepress/theme/i18n/index.ts
  - .vitepress/theme/i18n/messages/en.json
  - .vitepress/theme/i18n/messages/zh-TW.json
  - .vitepress/theme/components/LocaleSwitcher.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/HomeContent.vue
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/components/MergedNav.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
  - docs/index.md
  - docs/zh-TW/index.md
  - docs/zh-TW/challenges/index.md
  - docs/zh-TW/guide/index.md
  - docs/zh-TW/guide/python.md
  - docs/zh-TW/guide/terminal.md
  - docs/zh-TW/guide/network.md
  - tests/unit/i18n/locale-switcher.test.ts
  - tests/unit/i18n/messages-shape.test.ts
-->

---
### Requirement: Route-prefix change syncs vue-i18n locale and persists to localStorage

When the active URL pathname changes (initial load, SPA navigation, or browser back/forward), the Layout SHALL detect the locale implied by the URL prefix and synchronise `i18n.global.locale.value` and `localStorage` accordingly. The detection rule SHALL be: a pathname equal to `/zh-TW`, equal to `/zh-TW/`, or starting with `/zh-TW/` resolves to `'zh-TW'`; every other pathname resolves to `'en'`. The rule SHALL NOT match pathological inputs such as `/zh-TWfoo` (no trailing slash) — these resolve to `'en'`.

The synchronisation SHALL be idempotent: if the detected locale equals the current `i18n.global.locale.value`, no write SHALL occur (neither to the i18n locale nor to `localStorage`).

The synchronisation SHALL be SSR-safe: the watcher SHALL not access `window` or `document` outside of a client-only guard, and the initial-load detection SHALL run only when `typeof window !== 'undefined'`.

#### Scenario: SPA navigation from English root to Chinese guide updates locale

- **GIVEN** the user is on `/` with `i18n.global.locale.value === 'en'`
- **WHEN** the SPA router navigates to `/zh-TW/guide/`
- **THEN** the route watcher SHALL set `i18n.global.locale.value = 'zh-TW'`
- **AND** `localStorage.getItem('wxl-locale')` SHALL be `'zh-TW'`

#### Scenario: Exact `/zh-TW` pathname is treated as zh-TW

- **GIVEN** the user navigates to a pathname exactly equal to `/zh-TW` (no trailing slash)
- **WHEN** the route watcher fires
- **THEN** the detected locale SHALL be `'zh-TW'`

#### Scenario: Pathological prefix `/zh-TWfoo` is treated as en

- **GIVEN** the user navigates to `/zh-TWfoo` (a hypothetical non-locale path that happens to start with `zh-TW`)
- **WHEN** the route watcher fires
- **THEN** the detected locale SHALL be `'en'`
- **AND** the watcher SHALL NOT misclassify this as the zh-TW locale

#### Scenario: Idempotent sync when locale already matches

- **GIVEN** `i18n.global.locale.value === 'zh-TW'` and the user is on `/zh-TW/index`
- **WHEN** the SPA router navigates to `/zh-TW/guide/` (locale unchanged, only path within the same locale)
- **THEN** the watcher SHALL NOT call `persistLocale()` again
- **AND** the watcher SHALL NOT write `localStorage` again

#### Scenario: Browser back from Chinese to English path

- **GIVEN** the user navigated `/` → `/zh-TW/guide/` and `i18n.global.locale.value === 'zh-TW'`
- **WHEN** the user presses the browser back button, returning to `/`
- **THEN** the route watcher SHALL set `i18n.global.locale.value = 'en'`
- **AND** `localStorage.getItem('wxl-locale')` SHALL be `'en'`

#### Scenario: SSR-safe initial load

- **WHEN** the VitePress SSR pass renders a page (no `window` or `document` available)
- **THEN** the route watcher's client-only branches SHALL NOT execute
- **AND** no `ReferenceError` SHALL occur during `pnpm docs:build`
