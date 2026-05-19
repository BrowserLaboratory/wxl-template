# challenge-author-scripts Specification

## Purpose

Provides CLI scripts for challenge authors to validate challenge structure and frontmatter correctness (`challenge:validate`), analyze challenges for common issues (`challenge:analyze`), scaffold new challenges (`create:challenge`), and generate encryption keys (`challenge:keygen`).

## Requirements

### Requirement: Challenge validate script

The system SHALL provide a `pnpm challenge:validate [slug]` CLI command that validates challenge structure and frontmatter correctness.

#### Scenario: Validate single challenge passes

- **WHEN** user runs `pnpm challenge:validate fastapi-demo` on a correctly structured challenge
- **THEN** the script outputs per-item ✓/✗ results for: frontmatter required fields, backend-app type match, app file existence, flag file existence, tools field validity, commands field validity, .fsignore syntax
- **AND** the final output is "All checks passed."

#### Scenario: Validate all challenges

- **WHEN** user runs `pnpm challenge:validate` without a slug argument
- **THEN** the script validates all challenges under `docs/challenge/*/index.md`

#### Scenario: Validate detects missing app file

- **WHEN** the challenge frontmatter references `app: app.py` but `src/app.py` does not exist
- **THEN** the script outputs ✗ for the app file check with a message indicating the file is missing

#### Scenario: Validate detects invalid tools value

- **WHEN** frontmatter contains `tools: [browser, invalid_tab]`
- **THEN** the script outputs ✗ indicating `invalid_tab` is not a valid tab ID


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
### Requirement: Challenge analyze script

The system SHALL provide a `pnpm challenge:analyze [slug]` CLI command that performs validation plus content analysis.

#### Scenario: Analyze includes validation

- **WHEN** user runs `pnpm challenge:analyze fastapi-demo`
- **THEN** the script first runs all validation checks (same as validate)
- **AND** if validation fails, analysis is skipped with an error message

#### Scenario: Analyze outputs file statistics

- **WHEN** validation passes
- **THEN** the script outputs: file count and sizes in `src/`, estimated encrypted WASM payload size, flag format check (FLAG{...} or CTF{...}), tools/commands enablement summary

#### Scenario: Analyze detects potential issues

- **WHEN** the app source contains hardcoded host/port references or imports of unsupported Python modules
- **THEN** the script outputs warnings for each detected issue

#### Scenario: Analyze all challenges produces overview

- **WHEN** user runs `pnpm challenge:analyze` without a slug
- **THEN** the script analyzes all challenges and outputs a summary table with: slug, backend, difficulty, file count, estimated payload size, and any warnings

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