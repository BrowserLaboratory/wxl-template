## Summary

On default-theme pages (home, challenges index, guide), switch from the custom `LocaleSwitcher.vue` (currently mounted via VitePress's `nav-bar-content-before` slot) to VitePress's built-in `VPNavBarTranslations` dropdown. Add a rigorous route watcher in Layout setup that syncs `i18n.global.locale.value` and writes `localStorage` whenever the URL prefix changes. Keep `LocaleSwitcher.vue` on disk and reachable through a `USE_CUSTOM_LOCALE_SWITCHER` feature flag so the project can swap back without a Spectra change. Challenge pages (which use the merged ChallengeLayout nav) continue to render the custom `LocaleSwitcher` through `MergedNav.vue` — that surface is out of scope.

## Motivation

Hot-fix commit `90e966e` resolved a visual conflict by hiding VitePress's built-in dropdown with CSS and re-positioning the custom switcher via a slot, but the result is non-idiomatic: the locale switcher sits on the left of the nav instead of the standard right-side utility group, requires a `ml-4` margin tweak, and depends on CSS targeting VitePress's private class names. Adopting the built-in dropdown removes the CSS hack, restores idiomatic nav layout, gives mobile screen-menu integration for free, and reduces custom surface area. The previously-unused functionality of the custom switcher (`i18n.global.locale.value` sync, `localStorage` persistence) is preserved via a small route watcher that hooks VitePress's router.

The feature flag is a stated requirement: the user explicitly wants the option to revert to the custom switcher without re-opening this Spectra change.

## Proposed Solution

- Add `USE_CUSTOM_LOCALE_SWITCHER: boolean` constant in `.vitepress/theme/index.ts` (default `false`).
- When the flag is `false`:
  - Do NOT inject the custom `LocaleSwitcher` into `nav-bar-content-before`.
  - Do NOT add the `body.use-custom-locale-switcher` class, so the CSS hide rule does not apply and VitePress's built-in `VPNavBarTranslations` / `VPNavScreenTranslations` render normally.
- When the flag is `true`:
  - Inject the custom `LocaleSwitcher` into the slot (existing behavior).
  - Add `use-custom-locale-switcher` class to `document.body`, scoping the existing CSS hide rule to that class so the built-in dropdown is hidden.
- Replace the unconditional `.VPNavBarTranslations { display: none }` rule in `style.css` with a class-scoped version: `body.use-custom-locale-switcher .VPNavBarTranslations`.
- Add a route watcher in the Layout setup that:
  - Detects the locale from `useRoute().path` using the same parsing rules already in `LocaleSwitcher.vue`'s `buildTargetPath` (i.e., `/zh-TW`, `/zh-TW/`, or `/zh-TW/...` → `'zh-TW'`; anything else → `'en'`).
  - Updates `i18n.global.locale.value` only when the detected locale differs from the current value (avoid redundant writes).
  - Calls `persistLocale()` to write `localStorage`, preserving cross-session preference behavior.
- Add Vitest coverage for the route watcher behavior covering: initial SSR-safe init, SPA route change, `/zh-TW` exact match, `/zh-TWfoo` (must NOT match), back-to-`/` from `/zh-TW/guide/`, and `persistLocale` write verification.
- Existing `tests/unit/i18n/locale-switcher.test.ts` continues to PASS unchanged because `LocaleSwitcher.vue` is not modified.

## Non-Goals

- Deleting `LocaleSwitcher.vue` or its existing test file. The component stays for flexibility.
- Modifying `MergedNav.vue` or the challenge-page nav. Challenge pages keep the custom switcher.
- Changing the `locales` configuration in `.vitepress/config.mts`. Both locales remain defined the same way.
- Removing the existing `detectInitialLocale()` / `persistLocale()` helpers in `theme/i18n/index.ts`. The route watcher reuses them.
- Adding a UI control for the feature flag at runtime. The flag is a compile-time constant; flipping it requires a code edit and rebuild.
- Hiding any other VitePress built-in UI element beyond what is already class-scoped.

## Impact

- Affected specs: `i18n-runtime` (MODIFIED Requirement for the LocaleSwitcher reachability scenario; ADDED Requirement for route-prefix-sync behavior).
- Affected code:
  - Modified: `.vitepress/theme/index.ts`, `.vitepress/theme/style.css`
  - New: `tests/unit/i18n/route-locale-sync.test.ts`
  - Removed: none
