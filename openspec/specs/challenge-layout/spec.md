# challenge-layout Specification

## Purpose

Defines the custom VitePress layout for challenge pages, rendering a two-column split view with a collapsible description panel and flag submit form on the left, and tabbed interaction panels (Browser, Network, Repeater, Terminal, Code Editor) on the right, gated on runtime and Service Worker readiness.

## Requirements

### Requirement: Challenge pages use a custom VitePress layout registered as "challenge"

The VitePress theme `index.ts` SHALL use object spread (`...DefaultTheme`) instead of `extends: DefaultTheme` to inherit from the default theme. The theme SHALL define `Layout` as a `defineComponent` with a `setup` function that returns a render function. When `frontmatter.layout === 'challenge'`, the render function SHALL return `h(ChallengeLayout)`. For all other layout values, the render function SHALL return `h(DefaultTheme.Layout)`.

The `enhanceApp` function SHALL explicitly call `DefaultTheme.enhanceApp?.({ app })` before registering project-specific components and plugins to preserve the default theme's functionality.

The `setup` function SHALL use `onMounted` to add the CSS class `challenge-page` to `document.body` when the current page has `layout: challenge`, and `onUnmounted` to remove the class. This body class toggle MUST be SSR-safe (lifecycle hooks only execute on the client side).

`Layout.vue` SHALL NOT be imported by `index.ts`. The layout switching logic SHALL be fully contained within the `defineComponent` in `index.ts`.

#### Scenario: Challenge page renders ChallengeLayout directly

- **WHEN** a `.md` file with `layout: challenge` in frontmatter is rendered
- **THEN** the Layout component SHALL render `ChallengeLayout` directly via `h(ChallengeLayout)`
- **AND** `DefaultTheme.Layout` SHALL NOT be rendered for that page
- **AND** `ChallengeLayout` SHALL be visible with MergedNav, description panel, tool tabs, and FlagSubmit

#### Scenario: Non-challenge page renders DefaultTheme.Layout

- **WHEN** a `.md` file without `layout: challenge` (or with `layout: doc`, `layout: page`, `layout: home`) is rendered
- **THEN** the Layout component SHALL render `DefaultTheme.Layout` via `h(DefaultTheme.Layout)`
- **AND** the standard VitePress navigation and content layout SHALL be visible

#### Scenario: Body class is applied on challenge pages

- **WHEN** a challenge page is mounted in the browser
- **THEN** `document.body` SHALL have the class `challenge-page`

#### Scenario: Body class is removed on non-challenge pages

- **WHEN** the user navigates from a challenge page to a non-challenge page
- **THEN** `document.body` SHALL NOT have the class `challenge-page`

#### Scenario: DefaultTheme functionality is preserved

- **WHEN** the theme is loaded
- **THEN** `DefaultTheme.enhanceApp` SHALL be called before project-specific `enhanceApp` logic
- **AND** all DefaultTheme styles and components SHALL be available


<!-- @trace
source: fix-challenge-layout-not-rendering
updated: 2026-03-27
code:
  - .vitepress/theme/index.ts
  - .vitepress/theme/Layout.vue
-->

---
### Requirement: Challenge layout renders a left-right split view

The `ChallengeLayout.vue` SHALL render a two-column layout: a left column containing the markdown description panel and flag submit form, and a right column containing the Browser, Network, Repeater, Terminal, and Code Editor interaction panels (five tabs total).

#### Scenario: Left and right columns are both visible

- **WHEN** a challenge page loads
- **THEN** the left column (description + flag submit) and the right column (interaction panels with five tabs) SHALL both be visible simultaneously


<!-- @trace
source: restore-terminal-and-code-panels
updated: 2026-03-24
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/components/WxlshPanel.test.ts
-->

---
### Requirement: Description panel renders markdown via Content component and is collapsible

The left column SHALL include a description panel that renders the challenge page's markdown content using VitePress's `<Content />` component. The `<Content />` component SHALL be wrapped in a container element with the `vp-doc` CSS class to ensure VitePress typography styles (headings, code blocks, blockquotes, lists) are applied correctly. The panel SHALL be collapsible: clicking a toggle button SHALL collapse the panel to a minimal width and expand the right column to fill the remaining space. Clicking again SHALL restore the panel.

#### Scenario: Description markdown is rendered with VitePress typography

- **WHEN** a challenge page loads
- **THEN** the description panel SHALL render the markdown content as formatted HTML with VitePress typography styles applied (headings SHALL be styled, inline code SHALL have background highlight, blockquotes SHALL be visually distinct)

#### Scenario: vp-doc wrapper is present in the DOM

- **WHEN** the challenge page renders
- **THEN** the element wrapping `<Content />` SHALL have the `vp-doc` CSS class

#### Scenario: User collapses the description panel

- **WHEN** the user clicks the collapse toggle
- **THEN** the description panel SHALL animate to minimal width and the right column SHALL expand to fill the space

#### Scenario: User expands the description panel

- **WHEN** the description panel is collapsed and the user clicks the toggle
- **THEN** the description panel SHALL animate back to its original width


<!-- @trace
source: vitepress-platform-refactor
updated: 2026-03-15
code:
  - env.d.ts
  - vitest.config.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - tsconfig.json
  - docs/challenges/sqli-demo.md
  - package.json
  - .vitepress/theme/Layout.vue
  - .vitepress/theme/composables/usePhpRuntime.ts
  - chall-wasm/python-bridge/python-runtime.ts
  - docs/challenges/php-demo.md
  - .vitepress/theme/index.ts
  - .vitepress/config.mts
  - docs/challenges/challenges.data.ts
  - chall-wasm/php-bridge/php-runtime.ts
  - .vitepress/theme/layouts/ChallengeListLayout.vue
  - docs/challenges/index.md
tests:
  - .vitepress/theme/composables/usePhpRuntime-singleton.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - .vitepress/theme/composables/usePythonRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - tests/e2e/flask-sqli.test.ts
  - .vitepress/theme/composables/usePhpRuntime-headers.test.ts
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - .vitepress/theme/layouts/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/composables/usePythonRuntime-request.test.ts
  - .vitepress/theme/layouts/ChallengeListLayout.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/composables/usePhpRuntime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-post.test.ts
  - .vitepress/theme/composables/usePythonRuntime.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
-->

---
### Requirement: Flag submit form is fixed at the bottom of the left column

The left column SHALL contain a `FlagSubmit` component anchored to the bottom of the column, remaining visible regardless of description scroll position.

#### Scenario: Flag submit is always accessible

- **WHEN** the challenge description is long enough to scroll
- **THEN** the `FlagSubmit` component SHALL remain visible at the bottom of the left column without scrolling


<!-- @trace
source: vitepress-platform-refactor
updated: 2026-03-15
code:
  - env.d.ts
  - vitest.config.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - tsconfig.json
  - docs/challenges/sqli-demo.md
  - package.json
  - .vitepress/theme/Layout.vue
  - .vitepress/theme/composables/usePhpRuntime.ts
  - chall-wasm/python-bridge/python-runtime.ts
  - docs/challenges/php-demo.md
  - .vitepress/theme/index.ts
  - .vitepress/config.mts
  - docs/challenges/challenges.data.ts
  - chall-wasm/php-bridge/php-runtime.ts
  - .vitepress/theme/layouts/ChallengeListLayout.vue
  - docs/challenges/index.md
tests:
  - .vitepress/theme/composables/usePhpRuntime-singleton.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - .vitepress/theme/composables/usePythonRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - tests/e2e/flask-sqli.test.ts
  - .vitepress/theme/composables/usePhpRuntime-headers.test.ts
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - .vitepress/theme/layouts/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/composables/usePythonRuntime-request.test.ts
  - .vitepress/theme/layouts/ChallengeListLayout.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/composables/usePhpRuntime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-post.test.ts
  - .vitepress/theme/composables/usePythonRuntime.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
-->

---
### Requirement: Challenge layout includes a navigation bar with a back link to the challenge list

The `ChallengeLayout.vue` SHALL render a top navigation bar containing: a "← Challenges" link that navigates to the challenge list page, the challenge title from frontmatter, and difficulty and category badges if those frontmatter fields are present.

#### Scenario: Back link navigates to challenge list

- **WHEN** the user clicks "← Challenges"
- **THEN** the browser SHALL navigate to the challenge list page (`/challenges/`)

#### Scenario: Title and badges are shown

- **WHEN** a challenge page with `difficulty` and `category` in frontmatter loads
- **THEN** the nav bar SHALL display the challenge title, difficulty badge, and category badge

<!-- @trace
source: vitepress-platform-refactor
updated: 2026-03-15
code:
  - env.d.ts
  - vitest.config.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - tsconfig.json
  - docs/challenges/sqli-demo.md
  - package.json
  - .vitepress/theme/Layout.vue
  - .vitepress/theme/composables/usePhpRuntime.ts
  - chall-wasm/python-bridge/python-runtime.ts
  - docs/challenges/php-demo.md
  - .vitepress/theme/index.ts
  - .vitepress/config.mts
  - docs/challenges/challenges.data.ts
  - chall-wasm/php-bridge/php-runtime.ts
  - .vitepress/theme/layouts/ChallengeListLayout.vue
  - docs/challenges/index.md
tests:
  - .vitepress/theme/composables/usePhpRuntime-singleton.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - .vitepress/theme/composables/usePythonRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - tests/e2e/flask-sqli.test.ts
  - .vitepress/theme/composables/usePhpRuntime-headers.test.ts
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - .vitepress/theme/layouts/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/composables/usePythonRuntime-request.test.ts
  - .vitepress/theme/layouts/ChallengeListLayout.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/composables/usePhpRuntime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-post.test.ts
  - .vitepress/theme/composables/usePythonRuntime.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
-->

---
### Requirement: ChallengeLayout gates all tool panels on both runtimeReady and swReady

`ChallengeLayout.vue` SHALL maintain two separate reactive booleans: `runtimeReady` (set to `true` when the Python/PHP/WASM runtime finishes initialization) and `swReady` (set to `true` when `navigator.serviceWorker.controller` is non-null). All tool panels (Browser, Terminal, Repeater, Code, Network) SHALL receive a `disabled` prop computed as `!runtimeReady || !swReady`. The SW readiness MUST be established before `swReady` is set to `true`.

#### Scenario: Tools are disabled until both runtime and SW are ready

- **WHEN** the runtime has finished loading but `navigator.serviceWorker.controller` is still null
- **THEN** all tool panels SHALL have `disabled: true` and SHALL NOT allow the user to send requests

#### Scenario: Tools are enabled once both are ready

- **WHEN** both `runtimeReady` and `swReady` are true
- **THEN** all tool panels SHALL have `disabled: false` and SHALL accept user input

#### Scenario: swReady becomes true on controllerchange

- **WHEN** the page loads without an active SW controller (e.g., hard refresh) and the SW takes control via `controllerchange`
- **THEN** `swReady` SHALL be set to `true` and the tools SHALL become enabled


<!-- @trace
source: restore-terminal-and-code-panels
updated: 2026-03-24
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/components/WxlshPanel.test.ts
-->

---
### Requirement: ChallengeLayout provides source-attributed dispatch for Terminal and Code panels

`ChallengeLayout.vue` SHALL create `terminalDispatch` and `codeDispatch` functions using the same `makeSourceDispatch` pattern as `browserDispatch` and `repeaterDispatch`. These dispatch wrappers SHALL:
1. Call `trackedDispatch` to record the HTTP request in the traffic log
2. Call `attackSession.addHttpEvent(entry, 'terminal')` or `attackSession.addHttpEvent(entry, 'code')` respectively

The `WxlshPanel` SHALL receive `terminalDispatch` as its `dispatch` prop. The `CodeEditorPanel` SHALL receive `codeDispatch` as its `dispatch` prop.

#### Scenario: Terminal HTTP request is attributed to terminal source

- **WHEN** the wxlsh terminal executes a `curl` command that makes an HTTP request
- **THEN** the resulting traffic log entry and attack session event SHALL have `source: 'terminal'`

#### Scenario: Code Editor HTTP request is attributed to code source

- **WHEN** Python code in the Code Editor calls `requests.get()` via the dispatch bridge
- **THEN** the resulting traffic log entry and attack session event SHALL have `source: 'code'`


<!-- @trace
source: restore-terminal-and-code-panels
updated: 2026-03-24
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/components/WxlshPanel.test.ts
-->

---
### Requirement: ChallengeLayout wires recording callbacks for Terminal and Code panels

`ChallengeLayout.vue` SHALL pass an `onCommandExecuted` callback prop to `WxlshPanel` that calls `attackSession.addTerminalCommand(command, output, error)`. It SHALL pass an `onCodeExecuted` callback prop to `CodeEditorPanel` that calls `attackSession.addCodeExecution(code, output, error, duration)`.

#### Scenario: Terminal command execution is recorded via callback

- **WHEN** a user executes a command in the wxlsh terminal
- **THEN** `WxlshPanel` SHALL invoke the `onCommandExecuted` callback
- **AND** `ChallengeLayout` SHALL forward the data to `attackSession.addTerminalCommand()`

#### Scenario: Code execution is recorded via callback

- **WHEN** a user runs Python code in the Code Editor
- **THEN** `CodeEditorPanel` SHALL invoke the `onCodeExecuted` callback
- **AND** `ChallengeLayout` SHALL forward the data to `attackSession.addCodeExecution()`

<!-- @trace
source: restore-terminal-and-code-panels
updated: 2026-03-24
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/components/WxlshPanel.test.ts
-->

---
### Requirement: ChallengeLayout loads Pyodide for all backend types

`ChallengeLayout.vue` SHALL ensure a Pyodide instance is available regardless of the challenge's backend type (flask, fastapi, or php). For Python-based backends, the Pyodide instance SHALL be the one created during `PythonRuntime` initialization. For non-Python backends (e.g., php), `ChallengeLayout` SHALL load a standalone Pyodide instance after the challenge runtime has initialized. This standalone instance SHALL be assigned to `pyodideInstance` and passed to `WxlshPanel` and `CodeEditorPanel` as the `pyodide` prop.

The standalone Pyodide instance SHALL NOT load any challenge-specific packages (no micropip, flask, fastapi, or sqlite3). It serves exclusively as a tool layer for the Code Editor and Terminal panels.

#### Scenario: PHP challenge provides Pyodide to Code Editor and Terminal

- **WHEN** a challenge with `backend: php` loads and the runtime finishes initialization
- **THEN** `ChallengeLayout` SHALL load a standalone Pyodide instance
- **AND** `pyodideInstance` SHALL be set to this instance
- **AND** the Code Editor "Run" button SHALL become enabled
- **AND** the Terminal SHALL be able to execute wxlsh commands

#### Scenario: Python challenge reuses runtime Pyodide

- **WHEN** a challenge with `backend: flask` or `backend: fastapi` loads
- **THEN** `pyodideInstance` SHALL be set from `PythonRuntime.getPyodide()`
- **AND** no additional Pyodide instance SHALL be loaded

#### Scenario: Code Editor dispatch routes through PHP runtime for PHP challenges

- **WHEN** a user runs Python code with `requests.get("/")` in a PHP challenge
- **THEN** the HTTP request SHALL be routed through `codeDispatch` → `trackedDispatch` → `PhpRuntime.handleRequest()`
- **AND** the response SHALL be returned to the Python caller via the `requests` stub

<!-- @trace
source: fix-code-editor-jsproxy-and-php-pyodide
updated: 2026-03-24
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/CodeEditorPanel.vue
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
-->

---
### Requirement: VitePress default content areas are hidden on challenge pages

When `body.challenge-page` is present, the theme CSS SHALL hide the following VitePress default components via `display: none`: VPNav (`.VPNav`), VPLocalNav (`.VPLocalNav`), VPSidebar (`.VPSidebar`), VPContent (`.VPContent`), and VPFooter (`.VPFooter`). This MUST be achieved through CSS rules in `style.css`, not through JavaScript DOM manipulation.

#### Scenario: Default content areas hidden on challenge page

- **WHEN** a challenge page is loaded
- **THEN** VPNav, VPLocalNav, VPSidebar, VPContent, and VPFooter SHALL NOT be visible
- **AND** only MergedNav and the ChallengeLayout (via `#layout-bottom`) SHALL be visible

#### Scenario: Default content areas visible on normal pages

- **WHEN** a non-challenge page is loaded
- **THEN** VPNav, VPLocalNav, VPSidebar, VPContent, and VPFooter SHALL be visible as normal


<!-- @trace
source: challenge-nav-integration
updated: 2026-03-25
code:
  - docs/public/icons/terminal.svg
  - scripts/create-challenge.ts
  - docs/public/icons/code.svg
  - docs/public/icons/browser.svg
  - .vitepress/challenge/config.ts
  - uno.config.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/Layout.vue
  - .vitepress/theme/style.css
  - docs/index.md
  - docs/shared/challenges.data.ts
  - .vitepress/theme/components/HomeContent.vue
  - docs/guide/python.md
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeList.vue
  - docs/guide/network.md
  - docs/guide/index.md
  - docs/public/icons/network.svg
  - docs/public/icons/notes.svg
  - docs/public/icons/repeater.svg
  - .vitepress/config.mts
  - docs/guide/terminal.md
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: ChallengeLayout height accounts for VitePress navbar

`ChallengeLayout.vue` SHALL use `h-[calc(100vh-var(--vp-nav-height))]` for its root container height. Because VPNav is hidden on challenge pages and `--vp-nav-height` is set to `0px`, the layout effectively fills the full viewport height. The root container SHALL NOT apply `mt-[var(--vp-nav-height)]` since the navbar is hidden and no margin-top offset is needed.

#### Scenario: ChallengeLayout fills full viewport when navbar is hidden

- **WHEN** a challenge page loads
- **AND** VPNav is hidden with `--vp-nav-height` set to `0px`
- **THEN** the ChallengeLayout root container height SHALL equal `100vh` (since `calc(100vh - 0px)` = `100vh`)
- **AND** no margin-top SHALL be applied to the ChallengeLayout root container


<!-- @trace
source: challenge-nav-integration
updated: 2026-03-25
code:
  - docs/public/icons/terminal.svg
  - scripts/create-challenge.ts
  - docs/public/icons/code.svg
  - docs/public/icons/browser.svg
  - .vitepress/challenge/config.ts
  - uno.config.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/Layout.vue
  - .vitepress/theme/style.css
  - docs/index.md
  - docs/shared/challenges.data.ts
  - .vitepress/theme/components/HomeContent.vue
  - docs/guide/python.md
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeList.vue
  - docs/guide/network.md
  - docs/guide/index.md
  - docs/public/icons/network.svg
  - docs/public/icons/notes.svg
  - docs/public/icons/repeater.svg
  - .vitepress/config.mts
  - docs/guide/terminal.md
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: VitePress config provides navigation, path-based sidebar, and correct social links

The VitePress `config.mts` SHALL define the following in `themeConfig`:

1. `nav` SHALL include at minimum: a 'Home' link (`/`), a 'Challenges' link (`/challenges/`), and a 'Docs' link (`/guide/`).
2. `sidebar` SHALL be a path-based object (not an empty array), allowing different sidebar configurations for different URL paths.
3. `socialLinks` SHALL contain a GitHub link pointing to the correct repository URL for this project.

#### Scenario: Navbar shows navigation links

- **WHEN** any page loads
- **THEN** the VitePress navbar SHALL display links for Home, Challenges, and Docs

#### Scenario: Sidebar is path-aware

- **WHEN** a page under `/guide/` is loaded
- **THEN** the sidebar SHALL show guide-related navigation items
- **WHEN** a challenge page is loaded
- **THEN** the sidebar SHALL be hidden (via the `body.challenge-page` CSS rule)

#### Scenario: Social links point to correct repository

- **WHEN** any page loads
- **THEN** the GitHub social link in the navbar SHALL point to this project's repository, not the VitePress default

<!-- @trace
source: challenge-nav-integration
updated: 2026-03-25
code:
  - docs/public/icons/terminal.svg
  - scripts/create-challenge.ts
  - docs/public/icons/code.svg
  - docs/public/icons/browser.svg
  - .vitepress/challenge/config.ts
  - uno.config.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/Layout.vue
  - .vitepress/theme/style.css
  - docs/index.md
  - docs/shared/challenges.data.ts
  - .vitepress/theme/components/HomeContent.vue
  - docs/guide/python.md
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeList.vue
  - docs/guide/network.md
  - docs/guide/index.md
  - docs/public/icons/network.svg
  - docs/public/icons/notes.svg
  - docs/public/icons/repeater.svg
  - .vitepress/config.mts
  - docs/guide/terminal.md
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Slug derivation from per-folder challenge path

ChallengeLayout SHALL derive the challenge slug from the parent directory name of the current page's `relativePath`. For a path like `challenge/<slug>/index.md`, the slug SHALL be extracted as the second-to-last path segment (i.e., `<slug>`).

If the path has fewer than two segments, the system SHALL fall back to extracting the filename without the `.md` extension.

#### Scenario: Per-folder challenge path yields correct slug

- **WHEN** `page.relativePath` is `"challenge/sqli-demo/index.md"`
- **THEN** the computed slug SHALL be `"sqli-demo"`

#### Scenario: Per-folder FastAPI challenge path yields correct slug

- **WHEN** `page.relativePath` is `"challenge/fastapi-demo/index.md"`
- **THEN** the computed slug SHALL be `"fastapi-demo"`

#### Scenario: Fallback for flat file path

- **WHEN** `page.relativePath` is `"challenge/legacy-demo.md"` (single-level path)
- **THEN** the computed slug SHALL be `"legacy-demo"`

<!-- @trace
source: fix-challenge-slug-and-autonav
updated: 2026-03-25
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/BrowserPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
-->