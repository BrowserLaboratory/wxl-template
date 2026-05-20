## MODIFIED Requirements

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

## ADDED Requirements

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
