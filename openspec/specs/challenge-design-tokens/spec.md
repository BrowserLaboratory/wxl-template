# challenge-design-tokens Specification

## Purpose

Defines the CSS custom property token system used as the single source of truth for the platform's visual design — colors, palette tokens, and their integration with UnoCSS and VitePress brand variables.

## Requirements

### Requirement: Platform defines a CSS custom property token system as single source of truth

The `style.css` file SHALL define all platform color tokens as CSS custom properties under the `:root` and `.dark` selectors. The tokens SHALL include background (`--ch-bg`, `--ch-bg-soft`, `--ch-bg-card`, `--ch-bg-panel`), border (`--ch-border`, `--ch-border-hover`), accent (`--ch-accent`, `--ch-accent-soft`), text (`--ch-text-1`, `--ch-text-2`, `--ch-text-3`), icon (`--ch-icon`), and difficulty badge colors. In dark mode, `--ch-border` SHALL be `#2d2d55`, `--ch-bg-card` SHALL be `#15152f`, and `--ch-icon` SHALL be `#a5b4fc`. VitePress brand variables SHALL point to the corresponding `--ch-*` tokens, and VitePress default layout variables (`--vp-c-bg-soft`, `--vp-c-text-*`, `--vp-c-divider`) SHALL also bridge to `--ch-*` tokens.

#### Scenario: All design tokens defined in style.css

- **WHEN** a developer inspects the CSS custom properties on `:root` and `.dark`
- **THEN** all `--ch-*` tokens SHALL be present and VitePress `--vp-c-brand-*` and `--vp-c-bg-soft`/`--vp-c-text-*`/`--vp-c-divider` SHALL resolve to `--ch-*` values

#### Scenario: Dark mode tokens provide sufficient contrast

- **WHEN** dark mode is enabled
- **THEN** `--ch-border` SHALL be `#2d2d55` (visible against `--ch-bg-card` `#15152f`)
- **AND** `--ch-icon` SHALL be `#a5b4fc` (high contrast against dark backgrounds)


<!-- @trace
source: unify-design-tokens-palette
updated: 2026-03-26
code:
  - .vitepress/theme/components/HomeContent.vue
  - docs/index.md
  - .vitepress/theme/style.css
-->

---
### Requirement: UnoCSS config references CSS vars for color tokens

The `uno.config.ts` SHALL configure `theme.colors` entries that reference `--ch-*` CSS custom properties using `var()` syntax. The config SHALL also define shortcuts for commonly used component patterns (e.g., `ch-card`, `ch-badge-easy`, `ch-badge-medium`, `ch-badge-hard`, `ch-badge-mystery`, `ch-tab-btn`, `ch-tab-btn-active`). The `content.pipeline` SHALL include `**/*.{vue,md,ts}` to ensure all utility classes used in component templates are scanned.

#### Scenario: UnoCSS color utilities resolve via CSS vars

- **WHEN** a Vue component applies a UnoCSS color utility that references a `--ch-*` var
- **THEN** the rendered CSS SHALL use `var(--ch-*)` and respond to dark/light mode switching without additional class changes

#### Scenario: ch-badge-easy shortcut applies correct semantic color

- **WHEN** the `ch-badge-easy` shortcut is applied to an element
- **THEN** the element SHALL display with the easy difficulty color (green tones in both modes)

---
### Requirement: Merged nav design tokens

The theme SHALL provide CSS custom properties for the merged navigation bar styling, using the existing `--ch-*` Midnight Indigo palette to ensure visual consistency with the rest of the challenge layout.

#### Scenario: Merged nav uses ch palette

- **WHEN** the merged nav bar renders
- **THEN** its background uses `--ch-bg`, text uses `--ch-text-1`, and accents use `--ch-accent`

<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - docs/challenge/php-demo/index.md
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/sqli-demo/src/app.py
  - docs/challenge/sqli-demo/index.md
  - scripts/challenge-analyze.ts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/fastapi-demo/src/app.py
  - scripts/challenge-utils.ts
  - docs/challenge/php-demo/index.php
  - docs/challenge/fastapi-demo/index.md
  - docs/challenge/php-demo/src/flag.txt
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - docs/challenge/php-demo/src/index.php
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - docs/challenge/php-demo/flag.txt
  - .vitepress/theme/components/BrowserChrome.vue
  - docs/challenge/sqli-demo/app.py
  - .vitepress/theme/components/MergedNav.vue
  - docs/challenge/fastapi-demo/app.py
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo/src/flag.txt
  - docs/challenge/sqli-demo/src/flag.txt
  - scripts/create-challenge.ts
  - docs/challenge/sqli-demo.md
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->

---
### Requirement: VitePress default variables bridge to ch tokens

The `style.css` SHALL override VitePress default CSS variables to point to the corresponding `--ch-*` tokens. Specifically: `--vp-c-bg-soft` SHALL resolve to `var(--ch-bg-soft)`, `--vp-c-text-1` to `var(--ch-text-1)`, `--vp-c-text-2` to `var(--ch-text-2)`, `--vp-c-text-3` to `var(--ch-text-3)`, and `--vp-c-divider` to `var(--ch-border)`. This ensures all VitePress default-layout pages (docs, guide) follow the platform color scheme.

#### Scenario: Guide page follows platform palette in dark mode

- **WHEN** a user visits a docs/guide page with dark mode enabled
- **THEN** the background, text, and border colors SHALL match the platform's `--ch-*` dark mode palette instead of VitePress defaults


<!-- @trace
source: unify-design-tokens-palette
updated: 2026-03-26
code:
  - .vitepress/theme/components/HomeContent.vue
  - docs/index.md
  - .vitepress/theme/style.css
-->

---
### Requirement: Feature card icons use rounded-square container

VitePress feature cards on the homepage SHALL render SVG icons inside a rounded-square container with a semi-transparent background and subtle border. In dark mode the container SHALL use `rgba(99,102,241,0.15)` background with `rgba(99,102,241,0.2)` border and the icon stroke color SHALL be achieved via CSS filter (`brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(210deg) brightness(1.2)`) which approximates the target `#a5b4fc` color. In light mode the container SHALL use `rgba(67,56,202,0.08)` background with `rgba(67,56,202,0.12)` border and the icon stroke color SHALL be `var(--ch-accent)`. The container SHALL have `border-radius: 12px`.

#### Scenario: Dark mode feature card icon is clearly visible

- **WHEN** the homepage is viewed in dark mode
- **THEN** each feature card icon SHALL have a visible rounded-square container with `rgba(99,102,241,0.15)` background
- **AND** the icon stroke color SHALL be applied via CSS filter (`brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(210deg) brightness(1.2)`) approximating bright purple-blue, providing high contrast against the dark card background

#### Scenario: Light mode feature card icon has consistent styling

- **WHEN** the homepage is viewed in light mode
- **THEN** each feature card icon SHALL have a rounded-square container with light indigo background
- **AND** the icon stroke color SHALL be the platform accent color


<!-- @trace
source: unify-design-tokens-palette
updated: 2026-03-26
code:
  - .vitepress/theme/components/HomeContent.vue
  - docs/index.md
  - .vitepress/theme/style.css
-->

---
### Requirement: Dark mode icon token

The design token system SHALL define a `--ch-icon` token for icon colors. In light mode, `--ch-icon` SHALL resolve to `var(--ch-accent)`. In dark mode, `--ch-icon` SHALL resolve to `#a5b4fc`.

#### Scenario: Icon token used across components

- **WHEN** a component references `var(--ch-icon)` for icon coloring
- **THEN** the icon SHALL be bright purple-blue in dark mode and dark indigo in light mode

<!-- @trace
source: unify-design-tokens-palette
updated: 2026-03-26
code:
  - .vitepress/theme/components/HomeContent.vue
  - docs/index.md
  - .vitepress/theme/style.css
-->