# challenge-markdown-injection Specification

## Purpose

Defines how VitePress injects raw Markdown body content into challenge page frontmatter at build time, enabling downstream consumers (e.g., session export) to include the full challenge description.

## Requirements

### Requirement: VitePress injects raw Markdown body into challenge page frontmatter at build time

The VitePress `transformPageData` hook SHALL read the original `.md` source file for every page whose `frontmatter.layout` equals `"challenge"`. It SHALL strip the YAML frontmatter block (delimited by `---`) and store the remaining Markdown body as `pageData.frontmatter.markdownBody` (a string). Non-challenge pages SHALL NOT be affected.

#### Scenario: Challenge page receives markdownBody at build time

- **WHEN** VitePress processes a `.md` file with `layout: challenge` frontmatter
- **THEN** `pageData.frontmatter.markdownBody` SHALL contain the raw Markdown text after the frontmatter block
- **AND** the original frontmatter fields SHALL remain unchanged

#### Scenario: Non-challenge pages are unaffected

- **WHEN** VitePress processes a `.md` file without `layout: challenge` (e.g., the home page or challenge list)
- **THEN** `pageData.frontmatter.markdownBody` SHALL NOT be set

<!-- @trace
source: enhance-session-export-for-ai-writeup
updated: 2026-03-23
code:
  - .vitepress/config.mts
  - .vitepress/challenge/plugin.ts
tests:
  - tests/unit/challenge/markdown-injection.test.ts
-->

<!-- @trace
source: enhance-session-export-for-ai-writeup
updated: 2026-03-23
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/config.mts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/challenge/plugin.ts
tests:
  - tests/unit/challenge/markdown-injection.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
-->