# challenge-description-modal Specification

## Purpose

Governs the collapse/expand behavior of the challenge description panel across all breakpoints, ensuring the tools panel can occupy full width when the description is hidden and that flag submission remains accessible regardless of panel state.

## Requirements

### Requirement: Description panel collapsible on all breakpoints

The description panel on challenge pages SHALL support a collapse/expand toggle. When collapsed, the tools panel SHALL expand to occupy the full width. A "📖 題目" button SHALL appear in the merged navigation bar when the description is collapsed, allowing users to re-expand it. The `DescriptionModal` component SHALL NOT exist in the codebase — the collapse/expand mechanism replaces it entirely.

#### Scenario: Description collapsed hides panel and shows nav button

- **WHEN** the user clicks the collapse toggle on the description panel
- **THEN** the description panel width SHALL animate to zero
- **AND** the tools panel SHALL expand to full width
- **AND** a "📖 題目" button SHALL appear in MergedNav

#### Scenario: DescriptionModal component does not exist

- **WHEN** inspecting the codebase for modal-based description display
- **THEN** no `DescriptionModal.vue` component SHALL exist
- **AND** `ChallengeLayout.vue` SHALL NOT import or reference `DescriptionModal`
- **AND** no `descriptionModalVisible` ref SHALL exist in `ChallengeLayout.vue`


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

---
### ~~Requirement: Mobile description defaults to collapsed~~

**Reason:** The current design keeps the description visible by default on all breakpoints, including mobile. There is no separate collapsed-by-default behavior for mobile.

#### Scenario: Removal confirmed

- **WHEN** a user loads a challenge page on a < 768px viewport
- **THEN** the description panel SHALL be visible by default, the same as on desktop and tablet breakpoints

---
### ~~Requirement: Mobile description opens as fullscreen modal~~

**Reason:** The `DescriptionModal` component exists but is not actively used. The description is toggled via a collapse/expand mechanism on all breakpoints, not via a fullscreen modal overlay.

#### Scenario: Removal confirmed

- **WHEN** the user interacts with the description toggle on mobile
- **THEN** the description SHALL collapse or expand in-place
- **AND** no fullscreen modal overlay SHALL be displayed

---
### Requirement: Flag submission always accessible

The flag submission input SHALL be accessible regardless of the description panel state. When the description panel is collapsed, a persistent flag bar SHALL remain visible so users can always submit flags.

#### Scenario: Flag submit visible when description collapsed on desktop

- **WHEN** description is collapsed on Desktop
- **THEN** the flag submission input SHALL be accessible via a persistent flag bar

#### Scenario: Flag submit visible when description collapsed on mobile

- **WHEN** description is collapsed on Mobile
- **THEN** the flag submission input SHALL be accessible via the same persistent flag bar as desktop

#### Scenario: Flag submit visible when description expanded

- **WHEN** the description panel is expanded on any breakpoint
- **THEN** the flag submission input SHALL be visible at the bottom of the description panel

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