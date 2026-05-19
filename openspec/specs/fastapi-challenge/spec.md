# fastapi-challenge Specification

## Purpose

Provides a working FastAPI-based demo challenge that demonstrates the `backend: fastapi` configuration, automatic `BASE_PACKAGES` injection, and the `packages` frontmatter field for additional Python dependencies.

## Requirements

### Requirement: FastAPI demo challenge is available as a working example

A FastAPI-based challenge SHALL be provided at `docs/challenge/fastapi-demo.md` to demonstrate the `backend: fastapi` configuration and the `packages` frontmatter field. The challenge SHALL use a realistic vulnerability pattern suitable for a CTF context.

The `packages` frontmatter field is optional, not required. `ChallengeLayout.vue` SHALL provide `BASE_PACKAGES` defaults (for fastapi: `['fastapi', 'anyio', 'sqlite3']`) that are always included when the backend is `fastapi`. If a `packages` field is present in frontmatter, its entries SHALL be added on top of the `BASE_PACKAGES` defaults.

#### Scenario: FastAPI challenge page loads and renders correctly

- **WHEN** a user navigates to the FastAPI demo challenge page
- **THEN** the page SHALL display the challenge title, description, difficulty badge, and an interactive BrowserPanel with the default URL set to `https://challenge-fastapi-demo.localhost/`

#### Scenario: FastAPI challenge responds to HTTP requests

- **WHEN** a user sends a GET request to `https://challenge-fastapi-demo.localhost/`
- **THEN** the runtime SHALL return an HTTP response from the FastAPI app with status 200 and `Content-Type: application/json` or `text/html`

#### Scenario: FastAPI challenge uses BASE_PACKAGES defaults without packages frontmatter

- **WHEN** a FastAPI challenge's frontmatter does NOT contain a `packages` field
- **THEN** `ChallengeLayout.vue` SHALL provide `BASE_PACKAGES` defaults (`['fastapi', 'anyio', 'sqlite3']`) to the runtime initialization

#### Scenario: FastAPI challenge merges extra packages with BASE_PACKAGES

- **WHEN** a FastAPI challenge's frontmatter contains `packages: ['extra-lib']`
- **THEN** `ChallengeLayout.vue` SHALL merge the extra packages with `BASE_PACKAGES`, resulting in `['fastapi', 'anyio', 'sqlite3', 'extra-lib']` being passed to the runtime initialization

<!-- @trace
source: runtime-init-and-fastapi-challenge
updated: 2026-03-16
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/challenge/config.ts
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - tests/__mocks__/virtual-fs.ts
  - docs/challenge/php-demo/flag.txt
  - docs/challenge/sqli-demo/app.py
  - docs/challenge/fastapi-demo/app.py
  - docs/challenge/php-demo.md
  - vitest.config.ts
  - docs/challenge/sqli-demo.md
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/php-demo/index.php
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/workers/router.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/fastapi-demo/flag.txt
  - docs/public/challenge-sw.js
  - docs/challenge/fastapi-demo.md
  - .vitepress/challenge/plugin.ts
tests:
  - tests/unit/challenge/plugin.test.ts
  - tests/unit/workers/router.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/challenge/config.test.ts
-->