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

The file `docs/guide/python.md` SHALL be a VitePress Markdown page documenting the Python Code Editor. It SHALL cover: Code Editor UI overview (editor pane, output pane, run button), available modules (Pyodide standard library, and the real `requests` library the platform installs with micropip), `requests` module usage with examples (`requests.get()`, `requests.post()`, accessing `response.status_code`, `response.text`, `response.json()`), attack script examples (e.g., SQL injection testing, parameter fuzzing), keyboard shortcuts, and save/load functionality.

The guide SHALL describe the `requests` library as the genuine upstream package rather than a hand-written stub, and SHALL attribute the redirection of its traffic to the monkey-patched transport layer (`HTTPAdapter.send`) that routes requests through the platform's dispatch bridge. It SHALL NOT claim that Code Editor requests are routed through the Service Worker.

#### Scenario: Python Guide page documents requests usage

- **WHEN** the Python Guide page is built
- **THEN** it SHALL contain code examples showing `requests.get()` and `requests.post()` usage with an explanation of how the patched transport layer routes requests through the platform's dispatch bridge

#### Scenario: Python Guide page documents available modules

- **WHEN** the Python Guide page is built
- **THEN** it SHALL list the available Python modules including the micropip-installed `requests` library and Pyodide standard library modules relevant to security testing (e.g., `json`, `base64`, `hashlib`, `re`)

<!-- @trace
source: documentation-pages
updated: 2026-03-25
code:
  - docs/public/icons/network.svg
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

The file `docs/guide/terminal.md` SHALL be a VitePress Markdown page documenting the Terminal panel. It SHALL cover: Terminal UI overview (the actual prompt format rendered by the terminal, output area, scrollback), the built-in command surface as defined by the wxlsh-commands capability spec (command names, syntax, flags, and pipe composition), command history navigation (up/down arrow keys), and history persistence behavior (history survives page reloads via IndexedDB-backed storage).

The command documentation SHALL match the wxlsh-commands capability spec: command names, argument syntax, and flag forms (for example `base64 <text>` / `base64 -d <text>`, `hex <text>` / `hex -d <hex>`) SHALL be identical to the parser's accepted grammar. The guide SHALL NOT document commands that the parser does not implement, and SHALL NOT omit the pipe (`|`) composition mechanism. The guide SHALL state the command coverage explicitly: either a dedicated subsection per documented command, or a command reference table covering every command group defined in the wxlsh-commands spec.

#### Scenario: Terminal Guide command documentation matches the parser grammar

- **WHEN** the Terminal Guide page is built
- **THEN** every documented command name, argument form, and flag SHALL be accepted by the wxlsh parser as documented
- **AND** the guide SHALL NOT list any command name the parser rejects as unknown

#### Scenario: Terminal Guide documents pipe composition

- **WHEN** the Terminal Guide page is built
- **THEN** it SHALL contain at least one example composing two commands with the pipe (`|`) operator

#### Scenario: Terminal Guide page documents history navigation and persistence

- **WHEN** the Terminal Guide page is built
- **THEN** it SHALL explain how to navigate command history using up/down arrow keys
- **AND** it SHALL state that command history persists across page reloads

<!-- @trace
source: documentation-pages
updated: 2026-03-25
code:
  - docs/public/icons/network.svg
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

The file `docs/guide/network.md` SHALL be a VitePress Markdown page documenting the Network Traffic panel and Repeater. It SHALL cover: Traffic Log panel overview (request list, column descriptions matching the rendered columns), the request capture scope (requests from all tool panels — Browser, Code Editor, Terminal, and Repeater — are recorded through the shared tracked dispatch layer), HTTP status code meanings in the context of challenge responses, the "Send to Repeater" workflow (selecting a request, sending it to the Repeater, modifying and resending), Repeater panel features as implemented (raw HTTP request editing area, send action, response viewer, and saved request snapshots), and combined workflow examples showing how to use Network Traffic with Code Editor and Terminal for a complete attack flow.

#### Scenario: Network Guide page documents Send to Repeater workflow

- **WHEN** the Network Guide page is built
- **THEN** it SHALL contain step-by-step instructions for sending a captured request to the Repeater and modifying it

#### Scenario: Network Guide page describes the Repeater as implemented

- **WHEN** the Network Guide page is built
- **THEN** the Repeater feature description SHALL match the implemented single raw-HTTP-request editing model
- **AND** it SHALL NOT describe separate method/URL/headers/body editor fields that the implementation does not render

#### Scenario: Network Guide page states the capture scope correctly

- **WHEN** the Network Guide page is built
- **THEN** it SHALL state that requests issued from every tool panel are recorded in the Traffic Log
- **AND** it SHALL NOT claim that any tool panel's requests are excluded from recording

#### Scenario: Network Guide page includes combined workflow examples

- **WHEN** the Network Guide page is built
- **THEN** it SHALL contain at least one example showing how Network Traffic, Code Editor, and Terminal tools work together in a typical attack scenario

<!-- @trace
source: documentation-pages
updated: 2026-03-25
code:
  - docs/public/icons/network.svg
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

