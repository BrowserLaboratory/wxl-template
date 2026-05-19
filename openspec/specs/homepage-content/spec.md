# homepage-content Specification

## Purpose

Defines the homepage content including the VitePress hero section, feature cards with SVG icons for each platform tool, stats display, and latest challenges listing, all styled with the platform's `--ch-*` design token palette.

## Requirements

### Requirement: Homepage uses VitePress home layout with enhanced hero and feature cards

The homepage SHALL use VitePress's built-in `layout: home` with hero and features frontmatter. The `HomeContent.vue` component SHALL use exclusively `--ch-*` design tokens for all color references (backgrounds, text, borders, accents). The component SHALL NOT use VitePress default variables (`--vp-c-*`) directly. Specifically: text colors SHALL use `var(--ch-text-1)`, `var(--ch-text-2)`, `var(--ch-text-3)`; backgrounds SHALL use `var(--ch-bg-soft)` or `var(--ch-bg-card)`; borders SHALL use `var(--ch-border)` with hover state `var(--ch-border-hover)`; accent colors SHALL use `var(--ch-accent)` and `var(--ch-accent-soft)`.

#### Scenario: HomeContent uses ch tokens exclusively

- **WHEN** a developer inspects `HomeContent.vue` source code
- **THEN** all CSS variable references SHALL use `--ch-*` tokens
- **AND** no `--vp-c-*` variable SHALL appear in the component

#### Scenario: Homepage stats cards match platform palette in dark mode

- **WHEN** the homepage is viewed in dark mode
- **THEN** stats cards SHALL use `var(--ch-bg-soft)` for background and `var(--ch-border)` for borders
- **AND** the visual appearance SHALL be consistent with challenge page components

#### Scenario: Homepage latest challenges cards match platform palette

- **WHEN** the homepage is viewed in dark mode
- **THEN** challenge cards SHALL use `var(--ch-bg-soft)` background, `var(--ch-border)` border, and `var(--ch-accent)` for hover border
- **AND** text colors SHALL use `var(--ch-text-1)` for titles, `var(--ch-text-2)` for descriptions, `var(--ch-text-3)` for dates


<!-- @trace
source: unify-design-tokens-palette
updated: 2026-03-26
code:
  - .vitepress/theme/components/HomeContent.vue
  - docs/index.md
  - .vitepress/theme/style.css
-->

---
### Requirement: SVG icon files exist for all six platform features

Six SVG icon files SHALL exist in `docs/public/icons/`: `browser.svg`, `terminal.svg`, `code.svg`, `repeater.svg`, `network.svg`, and `notes.svg`. Each file SHALL be a valid SVG document with a `viewBox` attribute and SHALL visually represent its corresponding platform feature. Icons SHALL use a consistent style (outline/line art) and be sized appropriately for VitePress feature cards.

#### Scenario: All six SVG files are present and valid

- **WHEN** VitePress builds the site
- **THEN** the files `browser.svg`, `terminal.svg`, `code.svg`, `repeater.svg`, `network.svg`, and `notes.svg` SHALL exist in the build output under `/icons/`

#### Scenario: SVG files are well-formed

- **WHEN** any of the six SVG files is parsed
- **THEN** it SHALL contain a valid `<svg>` root element with a `viewBox` attribute


<!-- @trace
source: rich-homepage
updated: 2026-03-25
code:
  - docs/guide/network.md
  - docs/public/icons/code.svg
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - .vitepress/theme/index.ts
  - docs/guide/terminal.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/config.mts
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/create-challenge.ts
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/Layout.vue
  - docs/public/icons/notes.svg
  - docs/public/icons/network.svg
  - docs/index.md
  - docs/public/icons/terminal.svg
  - uno.config.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: HomeContent component displays platform introduction section

The `HomeContent.vue` component SHALL render a platform introduction section that describes the platform's purpose and key value proposition. The section SHALL be visually distinct and use the platform's design tokens for styling.

#### Scenario: Introduction section is visible below features

- **WHEN** the homepage loads
- **THEN** a platform introduction section SHALL be visible below the feature cards


<!-- @trace
source: rich-homepage
updated: 2026-03-25
code:
  - docs/guide/network.md
  - docs/public/icons/code.svg
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - .vitepress/theme/index.ts
  - docs/guide/terminal.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/config.mts
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/create-challenge.ts
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/Layout.vue
  - docs/public/icons/notes.svg
  - docs/public/icons/network.svg
  - docs/index.md
  - docs/public/icons/terminal.svg
  - uno.config.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: HomeContent component displays challenge statistics

The `HomeContent.vue` component SHALL display challenge statistics including the total number of challenges and the distribution across difficulty levels. Statistics SHALL be computed from the challenges data loader at build time.

#### Scenario: Total challenge count is displayed

- **WHEN** the homepage loads with 3 challenges in the data loader
- **THEN** the statistics section SHALL display a total count of 3

#### Scenario: Difficulty distribution is displayed

- **WHEN** challenges include 2 easy and 1 medium
- **THEN** the statistics section SHALL display the count for each difficulty level present


<!-- @trace
source: rich-homepage
updated: 2026-03-25
code:
  - docs/guide/network.md
  - docs/public/icons/code.svg
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - .vitepress/theme/index.ts
  - docs/guide/terminal.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/config.mts
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/create-challenge.ts
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/Layout.vue
  - docs/public/icons/notes.svg
  - docs/public/icons/network.svg
  - docs/index.md
  - docs/public/icons/terminal.svg
  - uno.config.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: HomeContent component displays latest challenges

The `HomeContent.vue` component SHALL display the 3 most recent challenges. Each challenge entry SHALL show the title, difficulty badge, and a link to the challenge page. Challenges SHALL be sorted by date (newest first) if the `date` field is available, otherwise by array order.

#### Scenario: Three latest challenges are shown

- **WHEN** the data loader contains 5 or more challenges
- **THEN** the homepage SHALL display exactly 3 challenge entries in the latest challenges section

#### Scenario: Fewer than 3 challenges exist

- **WHEN** the data loader contains only 2 challenges
- **THEN** the homepage SHALL display all 2 available challenges

#### Scenario: Challenge entries link to challenge pages

- **WHEN** the user clicks a challenge entry in the latest challenges section
- **THEN** the browser SHALL navigate to that challenge's page


<!-- @trace
source: rich-homepage
updated: 2026-03-25
code:
  - docs/guide/network.md
  - docs/public/icons/code.svg
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - .vitepress/theme/index.ts
  - docs/guide/terminal.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/config.mts
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/create-challenge.ts
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/Layout.vue
  - docs/public/icons/notes.svg
  - docs/public/icons/network.svg
  - docs/index.md
  - docs/public/icons/terminal.svg
  - uno.config.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: HomeContent component displays quick-start guide

The `HomeContent.vue` component SHALL display a 3-step quick-start guide that helps new users understand how to begin using the platform. Each step SHALL have a step number, a title, and a brief description.

#### Scenario: Three steps are displayed

- **WHEN** the homepage loads
- **THEN** the quick-start section SHALL display exactly 3 numbered steps


<!-- @trace
source: rich-homepage
updated: 2026-03-25
code:
  - docs/guide/network.md
  - docs/public/icons/code.svg
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - .vitepress/theme/index.ts
  - docs/guide/terminal.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/config.mts
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/create-challenge.ts
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/Layout.vue
  - docs/public/icons/notes.svg
  - docs/public/icons/network.svg
  - docs/index.md
  - docs/public/icons/terminal.svg
  - uno.config.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: HomeContent is globally registered and embedded in homepage markdown

The `HomeContent` component SHALL be globally registered in `.vitepress/theme/index.ts` via `app.component('HomeContent', HomeContent)`. The `docs/index.md` SHALL embed `<HomeContent />` in its markdown body so it renders after the VitePress features section.

#### Scenario: HomeContent renders on the homepage

- **WHEN** VitePress builds and serves the homepage
- **THEN** the `<HomeContent />` component SHALL render below the feature cards

#### Scenario: HomeContent does not affect other pages

- **WHEN** the user navigates to a non-homepage page
- **THEN** the HomeContent component SHALL NOT render


<!-- @trace
source: rich-homepage
updated: 2026-03-25
code:
  - docs/guide/network.md
  - docs/public/icons/code.svg
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - .vitepress/theme/index.ts
  - docs/guide/terminal.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/config.mts
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/create-challenge.ts
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/Layout.vue
  - docs/public/icons/notes.svg
  - docs/public/icons/network.svg
  - docs/index.md
  - docs/public/icons/terminal.svg
  - uno.config.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Hero gradient uses indigo brand colors

The CSS custom properties `--vp-home-hero-name-background` and `--vp-home-hero-image-background-image` in `.vitepress/theme/style.css` SHALL use the platform's indigo brand colors (#4338ca and #6366f1) instead of the default purple/cyan gradient. The dark mode SHALL use the same indigo tones adjusted for dark backgrounds.

#### Scenario: Hero name gradient uses indigo colors

- **WHEN** the homepage hero renders
- **THEN** the hero name text SHALL display a gradient using #4338ca and #6366f1

#### Scenario: Hero image background uses indigo gradient

- **WHEN** the homepage hero renders
- **THEN** the decorative background gradient SHALL use indigo tones matching the brand palette

<!-- @trace
source: rich-homepage
updated: 2026-03-25
code:
  - docs/guide/network.md
  - docs/public/icons/code.svg
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - .vitepress/theme/index.ts
  - docs/guide/terminal.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/config.mts
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - scripts/create-challenge.ts
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/Layout.vue
  - docs/public/icons/notes.svg
  - docs/public/icons/network.svg
  - docs/index.md
  - docs/public/icons/terminal.svg
  - uno.config.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->