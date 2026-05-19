# challenge-rwd Specification

## Purpose

Defines the three-breakpoint responsive layout for challenge pages, adapting the merged navigation bar, description/tools column arrangement, and flag submission placement across desktop (>=1024px), tablet (768-1023px), and mobile (<768px) viewports.

## Requirements

### Requirement: Three-breakpoint responsive layout

The challenge page SHALL support three responsive breakpoints with distinct layout behaviors.

#### Scenario: Desktop layout at 1024px and above

- **WHEN** viewport width is >= 1024px
- **THEN** the page renders: single-row merged nav bar, two-column content (description 38% left, tools 62% right)

#### Scenario: Tablet layout between 768px and 1023px

- **WHEN** viewport width is 768-1023px
- **THEN** the page renders: condensed merged nav bar (back link as icon, Notes as icon), two-column content (narrower description)

#### Scenario: Mobile layout below 768px

- **WHEN** viewport width is < 768px
- **THEN** the page renders: two-row merged nav bar with hamburger menu, description visible by default and collapsible via toggle button (same as desktop), tool tabs as horizontally scrollable bar, flag submission sticky at bottom

<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - scripts/challenge-analyze.ts
  - scripts/challenge-utils.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - .vitepress/theme/components/BrowserChrome.vue
  - .vitepress/theme/components/MergedNav.vue
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - scripts/create-challenge.ts
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