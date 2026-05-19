# platform-documentation Specification

## Purpose

Defines the platform's user-facing documentation pages, including a Getting Started guide, Python Code Editor guide, Terminal/wxlsh guide, and Network Traffic guide, all rendered as VitePress doc-layout pages with sidebar navigation.

## Requirements

### Requirement: Getting Started page provides platform introduction and quick start guide

The file `docs/guide/index.md` SHALL be a VitePress Markdown page using the default `doc` layout. It SHALL contain sections covering: platform introduction (what the platform is and who it's for), system requirements (browser compatibility, network requirements), quick start steps (how to navigate to a challenge and begin), a tool overview (brief descriptions of Code Editor, Terminal, Browser, Network Traffic, and Repeater panels), and a FAQ section addressing common questions.

#### Scenario: Getting Started page renders with VitePress default layout

- **WHEN** a user navigates to the Getting Started page
- **THEN** the page SHALL render using VitePress DefaultTheme with sidebar navigation visible

#### Scenario: Getting Started page contains all required sections

- **WHEN** the Getting Started page is built
- **THEN** it SHALL contain headings for: platform introduction, system requirements, quick start, tool overview, and FAQ


<!-- @trace
source: documentation-pages
updated: 2026-03-25
code:
  - docs/public/icons/network.svg
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo.md
  - .vitepress/theme/style.css
  - docs/public/icons/repeater.svg
  - uno.config.ts
  - docs/public/icons/notes.svg
  - docs/guide/index.md
  - docs/guide/network.md
  - .vitepress/theme/components/ChallengeList.vue
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/browser.svg
  - scripts/create-challenge.ts
  - .vitepress/config.mts
  - docs/challenge/sqli-demo.md
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/public/icons/terminal.svg
  - .vitepress/theme/index.ts
  - docs/shared/challenges.data.ts
  - docs/index.md
  - docs/guide/terminal.md
  - .vitepress/theme/components/HomeContent.vue
  - .vitepress/theme/Layout.vue
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Python Guide page documents Code Editor and Pyodide environment

The file `docs/guide/python.md` SHALL be a VitePress Markdown page documenting the Python Code Editor. It SHALL cover: Code Editor UI overview (editor pane, output pane, run button), available modules (Pyodide standard library, `requests` stub module), `requests` module usage with examples (`requests.get()`, `requests.post()`, accessing `response.status_code`, `response.text`, `response.json()`), attack script examples (e.g., SQL injection testing, parameter fuzzing), keyboard shortcuts, and save/load functionality.

#### Scenario: Python Guide page documents requests stub usage

- **WHEN** the Python Guide page is built
- **THEN** it SHALL contain code examples showing `requests.get()` and `requests.post()` usage with explanations of how the stub routes requests through the Service Worker

#### Scenario: Python Guide page documents available modules

- **WHEN** the Python Guide page is built
- **THEN** it SHALL list the available Python modules including the `requests` stub and Pyodide standard library modules relevant to security testing (e.g., `json`, `base64`, `hashlib`, `re`)


<!-- @trace
source: documentation-pages
updated: 2026-03-25
code:
  - docs/public/icons/network.svg
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo.md
  - .vitepress/theme/style.css
  - docs/public/icons/repeater.svg
  - uno.config.ts
  - docs/public/icons/notes.svg
  - docs/guide/index.md
  - docs/guide/network.md
  - .vitepress/theme/components/ChallengeList.vue
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/browser.svg
  - scripts/create-challenge.ts
  - .vitepress/config.mts
  - docs/challenge/sqli-demo.md
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/public/icons/terminal.svg
  - .vitepress/theme/index.ts
  - docs/shared/challenges.data.ts
  - docs/index.md
  - docs/guide/terminal.md
  - .vitepress/theme/components/HomeContent.vue
  - .vitepress/theme/Layout.vue
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Terminal Guide page documents built-in terminal commands

The file `docs/guide/terminal.md` SHALL be a VitePress Markdown page documenting the Terminal panel. It SHALL cover: Terminal UI overview (prompt, output area, scrollback), built-in commands (`help`, `clear`, `base64`, `hex`, `curl`, `decode`, `encode`) with usage syntax and examples for each, command history navigation (up/down arrow keys), and keyboard shortcuts.

#### Scenario: Terminal Guide page documents each built-in command

- **WHEN** the Terminal Guide page is built
- **THEN** it SHALL contain a dedicated subsection for each built-in command (`help`, `clear`, `base64`, `hex`, `curl`, `decode`, `encode`) with syntax and at least one usage example per command

#### Scenario: Terminal Guide page documents history navigation

- **WHEN** the Terminal Guide page is built
- **THEN** it SHALL explain how to navigate command history using up/down arrow keys


<!-- @trace
source: documentation-pages
updated: 2026-03-25
code:
  - docs/public/icons/network.svg
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo.md
  - .vitepress/theme/style.css
  - docs/public/icons/repeater.svg
  - uno.config.ts
  - docs/public/icons/notes.svg
  - docs/guide/index.md
  - docs/guide/network.md
  - .vitepress/theme/components/ChallengeList.vue
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/browser.svg
  - scripts/create-challenge.ts
  - .vitepress/config.mts
  - docs/challenge/sqli-demo.md
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/public/icons/terminal.svg
  - .vitepress/theme/index.ts
  - docs/shared/challenges.data.ts
  - docs/index.md
  - docs/guide/terminal.md
  - .vitepress/theme/components/HomeContent.vue
  - .vitepress/theme/Layout.vue
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Network Guide page documents Traffic Log and Repeater workflow

The file `docs/guide/network.md` SHALL be a VitePress Markdown page documenting the Network Traffic panel and Repeater. It SHALL cover: Traffic Log panel overview (request list, column descriptions), HTTP status code meanings in the context of challenge responses, the "Send to Repeater" workflow (selecting a request, clicking Send to Repeater, modifying and resending), Repeater panel features (method selector, URL editor, headers editor, body editor, response viewer), and combined workflow examples showing how to use Network Traffic with Code Editor and Terminal for a complete attack flow.

#### Scenario: Network Guide page documents Send to Repeater workflow

- **WHEN** the Network Guide page is built
- **THEN** it SHALL contain step-by-step instructions for sending a captured request to the Repeater and modifying it

#### Scenario: Network Guide page includes combined workflow examples

- **WHEN** the Network Guide page is built
- **THEN** it SHALL contain at least one example showing how Network Traffic, Code Editor, and Terminal tools work together in a typical attack scenario

<!-- @trace
source: documentation-pages
updated: 2026-03-25
code:
  - docs/public/icons/network.svg
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo.md
  - .vitepress/theme/style.css
  - docs/public/icons/repeater.svg
  - uno.config.ts
  - docs/public/icons/notes.svg
  - docs/guide/index.md
  - docs/guide/network.md
  - .vitepress/theme/components/ChallengeList.vue
  - docs/guide/python.md
  - .vitepress/challenge/config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/browser.svg
  - scripts/create-challenge.ts
  - .vitepress/config.mts
  - docs/challenge/sqli-demo.md
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/public/icons/terminal.svg
  - .vitepress/theme/index.ts
  - docs/shared/challenges.data.ts
  - docs/index.md
  - docs/guide/terminal.md
  - .vitepress/theme/components/HomeContent.vue
  - .vitepress/theme/Layout.vue
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->