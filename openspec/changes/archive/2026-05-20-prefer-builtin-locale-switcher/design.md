## Context

After commit `90e966e` (the previous hot-fix), VitePress's built-in `VPNavBarTranslations` is hidden via CSS and the custom `LocaleSwitcher.vue` is mounted in the `nav-bar-content-before` slot. This works but is non-idiomatic: the switcher lands on the left of the nav bar instead of the standard right-side utility group, the spacing relies on a `ml-4` tweak inside the component, and the layout depends on CSS targeting VitePress's private class names.

The custom switcher existed for a real reason: VitePress's built-in dropdown changes the URL but does NOT update `i18n.global.locale.value`. Components using `t()` from `vue-i18n` would render stale strings until a hard reload. The custom component centralised three side effects in one click handler: route navigation, vue-i18n locale update, and `localStorage.setItem`.

This change switches the default-theme nav to VitePress's built-in dropdown and moves the vue-i18n + localStorage side effects into a route watcher in the Layout setup. The custom component stays on disk and behind a `USE_CUSTOM_LOCALE_SWITCHER` feature flag so the project retains the ability to swap back to it without a Spectra change.

Constraints:
- VitePress 2.0.0-alpha.16. `useRouter()` and `useRoute()` are setup-only composables. The watcher MUST live inside a component's `setup()` (Layout), not in `enhanceApp`.
- vue-i18n 10 with `legacy: false`. `i18n.global.locale.value` is a `Ref`.
- Existing helpers `detectInitialLocale()` and `persistLocale()` in `.vitepress/theme/i18n/index.ts` already implement the canonical URL → locale parsing and the `localStorage` write under key `wxl-locale`. The watcher SHALL reuse them.
- VitePress's SSR build pass has no `window` / `document`. The watcher's client-only side effects MUST be guarded.
- Challenge pages render via `ChallengeLayout` + `MergedNav` (not the VitePress default theme nav). They already use the custom `LocaleSwitcher` and are not touched by this change.

Stakeholders: maintainer, the `i18n-runtime` capability spec, any future contributor wanting to revert to the custom switcher.

## Goals / Non-Goals

**Goals:**

- Default-theme pages render VitePress's built-in `VPNavBarTranslations` dropdown in the standard right-side nav position.
- A route watcher syncs `i18n.global.locale.value` and `localStorage` on every URL prefix change, preserving the existing cross-session locale persistence behaviour.
- `LocaleSwitcher.vue` stays on disk and can be re-activated by toggling `USE_CUSTOM_LOCALE_SWITCHER = true` and rebuilding.
- `pnpm docs:build` and `pnpm test --run` remain green; new tests cover the watcher behaviour including pathological inputs.

**Non-Goals:**

- Deleting `LocaleSwitcher.vue` or its test file.
- Modifying `MergedNav.vue` or any challenge-page UI.
- Changing `locales` configuration in `.vitepress/config.mts`.
- Adding flag UI at runtime (the flag is a compile-time constant by design).
- Hiding any other VitePress built-in UI element.

## Decisions

### Feature flag at theme entry, body-class CSS scope

The `USE_CUSTOM_LOCALE_SWITCHER` constant lives in `.vitepress/theme/index.ts`. When `true`, Layout's `onMounted` adds `use-custom-locale-switcher` to `document.body`'s class list; when `false`, the class is absent. The existing CSS rule that hides `.VPNavBarTranslations` is rescoped to `body.use-custom-locale-switcher .VPNavBarTranslations`. Rationale: a single source of truth (the JS constant) drives both the slot injection and the CSS visibility; flipping the constant is a one-line edit plus a rebuild.

### Route watcher lives in Layout setup, not enhanceApp

`useRouter()` / `useRoute()` are setup-only composables in VitePress 2. `enhanceApp({ app })` runs before any component is mounted and cannot consume them. Therefore the watcher SHALL be installed inside the Layout component's `setup()`, alongside the existing `frontmatter`-watcher that toggles `challenge-page` on body. Rationale: matches VitePress's API contract; keeps router-coupled code colocated with the rest of Layout's reactive setup.

### Detection rule mirrors `buildTargetPath` in `LocaleSwitcher.vue`

The watcher's detection function checks `path === '/zh-TW' || path === '/zh-TW/' || path.startsWith('/zh-TW/')`. Rationale: identical semantics to the existing `LocaleSwitcher.buildTargetPath`, so behaviour is consistent regardless of which switcher is active. Pathological inputs like `/zh-TWfoo` (no trailing slash) correctly resolve to `'en'`.

### Idempotent sync to avoid redundant writes

The watcher compares the detected locale against the current `i18n.global.locale.value` before writing. If equal, no writes occur. Rationale: the watcher fires on every route change (including navigation within the same locale tree, e.g., `/zh-TW/index` → `/zh-TW/guide/`), but locale-state changes only when the URL prefix actually crosses locale boundaries. Skipping no-op writes avoids unnecessary `localStorage` traffic and reactive churn.

### Reuse `detectInitialLocale()` and `persistLocale()` helpers, do not duplicate

The watcher imports and calls `persistLocale()` for the `localStorage` write. For initial-load detection (cold page load), the existing call to `detectInitialLocale()` in `enhanceApp` is preserved unchanged. Rationale: single implementation of the URL → locale rule keeps `LocaleSwitcher.vue`, the route watcher, and any future caller consistent.

### Existing `LocaleSwitcher` test stays as-is

`tests/unit/i18n/locale-switcher.test.ts` exercises the custom component's click handler, which is unchanged by this PR. Rationale: keeping the test alive guarantees that flipping `USE_CUSTOM_LOCALE_SWITCHER = true` later won't regress the component. Removing the test would create a hidden risk for the documented swap-back path.

### New test file for route watcher: pure-logic + DOM test split

The new test file `tests/unit/i18n/route-locale-sync.test.ts` covers the watcher's behaviour in two parts: (a) pure-logic tests for the detection function exported separately from Layout (so the function is unit-testable without mounting VitePress), and (b) a DOM-level integration test that mounts Layout with a stubbed `useRoute`/`useRouter` and verifies the side effects. Rationale: pure-logic tests give cheap exhaustive coverage of detection edge cases (including the pathological `/zh-TWfoo`); the DOM test verifies the Vue reactivity wiring works.

## Implementation Contract

**Behaviour delivered:**

- On default-theme pages, the VitePress built-in `VPNavBarTranslations` dropdown is visible in the standard right-side nav group (between menu items and the appearance toggle).
- Clicking an entry navigates to the matching locale URL; the route watcher detects the new URL prefix and updates `i18n.global.locale.value` + `localStorage`.
- The custom `LocaleSwitcher.vue` is NOT mounted in any default-theme nav slot when `USE_CUSTOM_LOCALE_SWITCHER === false`.
- On challenge pages, `MergedNav.vue` continues to render the custom `LocaleSwitcher` — behaviour unchanged.

**Interfaces / data shapes preserved:**

- `i18n.global.locale.value` type is unchanged (`'en' | 'zh-TW'`).
- `localStorage` key remains `wxl-locale` with values `'en'` or `'zh-TW'`.
- `LocaleSwitcher.vue`'s public API (props, exposed methods) is unchanged.
- `.vitepress/config.mts` `locales` configuration is unchanged.

**Acceptance criteria:**

- `pnpm docs:build` exits 0; the rendered HTML for `/` contains a `.VPNavBarTranslations` element (visible, not hidden) when `USE_CUSTOM_LOCALE_SWITCHER === false`.
- `pnpm test --run tests/unit/i18n/locale-switcher.test.ts` PASSES unchanged (14 tests).
- `pnpm test --run tests/unit/i18n/route-locale-sync.test.ts` PASSES with at least 6 new tests covering the scenarios in the spec delta.
- `pnpm test --run` FULL suite exits 0.
- `spectra validate prefer-builtin-locale-switcher` exits 0; `spectra analyze` is Clean.
- `/spectra-audit` returns 0 Critical / 0 Warning.

**Scope boundaries:**

- IN: `.vitepress/theme/index.ts`, `.vitepress/theme/style.css`, new `tests/unit/i18n/route-locale-sync.test.ts`, spec delta for `i18n-runtime`.
- OUT: `LocaleSwitcher.vue`, `MergedNav.vue`, `config.mts`, `tests/unit/i18n/locale-switcher.test.ts`, all docs Markdown, any other file in the repo.

## Risks / Trade-offs

- [Watcher fires for SSR pass and crashes on `window`] → Watcher's `persistLocale()` call is already SSR-safe (the helper guards `typeof window !== 'undefined'`); the locale-detection function operates on a plain string and has no DOM dependency.
- [Built-in dropdown styling clashes with project tokens] → VitePress's dropdown inherits the `--vp-c-*` brand tokens which are already overridden to `--ch-accent` in `style.css`; visual inspection during apply will confirm. If colour drift appears, a small CSS override is in scope.
- [Mobile menu's `VPNavScreenTranslations` behaves differently] → The class-scoped CSS rule also covers `VPNavScreenTranslations`, so flipping the flag stays consistent across desktop and mobile.
- [Detection rule misclassifies a future path] → The detection function has an explicit dedicated test for the pathological `/zh-TWfoo` case to lock the rule in place against regression.
- [Initial-load locale mismatch] → The existing `detectInitialLocale()` call in `enhanceApp` runs before the watcher and sets the initial value; the watcher then takes over for subsequent route changes. Both paths use the same parsing rule (via `detectInitialLocale` / detection function) so they cannot disagree.

## Migration Plan

No data migration. Toggling the feature flag from `false` to `true` and rebuilding is fully reversible. Roll-back path: change `USE_CUSTOM_LOCALE_SWITCHER = false` back to `true`, rebuild — behaviour returns to the post-`90e966e` state.

## Open Questions

None at this time.
