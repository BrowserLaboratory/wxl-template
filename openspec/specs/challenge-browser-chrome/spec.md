# challenge-browser-chrome Specification

## Purpose

Provides a browser-like chrome bar for the Browser tab with navigation buttons (back, forward, reload), a capsule-shaped URL input field, and Go button, adapting its layout between desktop and mobile viewports.

## Requirements

### Requirement: Desktop browser chrome with capsule URL bar

On Desktop viewports (≥ 768px), the Browser tab SHALL render a browser-like chrome bar containing navigation buttons and a capsule-shaped URL input.

#### Scenario: Desktop browser chrome layout

- **WHEN** the Browser tab is active on a ≥ 768px viewport
- **THEN** a chrome bar is rendered below the tab bar containing: ← back button, → forward button, ↻ reload button, a capsule-shaped URL input field (border-radius: 20px) with 🔒 lock icon and URL text (protocol in gray, domain in white), and a "Go" button

#### Scenario: Desktop URL navigation

- **WHEN** user edits the URL in the capsule input and clicks "Go" or presses Enter
- **THEN** the browser panel navigates to the entered URL via dispatch


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
### Requirement: Mobile browser with minimal URL bar

On Mobile viewports (< 768px), the Browser tab SHALL render a minimal URL bar without navigation buttons.

#### Scenario: Mobile browser URL bar layout

- **WHEN** the Browser tab is active on a < 768px viewport
- **THEN** a URL bar is rendered containing only: a URL input field and a → (go) button
- **AND** no ← → ↻ navigation buttons are displayed

#### Scenario: Mobile URL navigation

- **WHEN** user edits the URL and taps the → button or presses Enter
- **THEN** the browser panel navigates to the entered URL via dispatch

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
### Requirement: Auto-navigation on runtime ready

BrowserPanel SHALL automatically navigate to the initial challenge URL when the `disabled` prop transitions from `true` to `false`. This ensures the challenge content loads without requiring the user to manually click the "Go" button.

The auto-navigation SHALL call the same `navigate()` function used by manual URL navigation, dispatching a GET request to the current URL value.

#### Scenario: Browser auto-loads challenge on runtime ready

- **WHEN** BrowserPanel is mounted with `disabled: true`
- **AND** the `disabled` prop subsequently changes to `false`
- **THEN** BrowserPanel SHALL automatically dispatch a GET request to the initial URL (`https://challenge-<slug>.localhost/`)
- **AND** the response content SHALL be rendered in the browser viewport

#### Scenario: No duplicate navigation on re-render

- **WHEN** the `disabled` prop is already `false` at mount time
- **THEN** BrowserPanel SHALL NOT automatically navigate on mount
- **AND** navigation SHALL only occur when the user explicitly triggers it or when `disabled` transitions from `true` to `false`

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

---
### Requirement: Browser Panel simulates a web browser address bar and viewport

The Browser Panel SHALL provide a URL bar pre-populated with `https://challenge-<slug>.localhost/` and a Go action that issues a GET request through the injected dispatch function. HTML responses SHALL render inside a sandboxed `iframe` using `sandbox="allow-scripts allow-forms"`. The Browser Panel SHALL inject its own interceptor script into HTML responses so that link clicks and form submissions can be relayed to the parent without requiring `allow-same-origin`.

#### Scenario: HTML response renders in a sandboxed iframe

- **WHEN** the challenge runtime returns `Content-Type: text/html`
- **THEN** the Browser Panel SHALL render the response in an iframe with `allow-scripts allow-forms` and no `allow-same-origin`

#### Scenario: Link navigation stays inside the panel

- **WHEN** a user clicks a link inside the rendered HTML
- **THEN** the injected interceptor SHALL post the navigation to the parent, the URL bar SHALL update, and the Browser Panel SHALL dispatch a new GET request without leaving the page

<!-- @trace
source: web-exploit-challenge-platform
code:
  - .vitepress/theme/components/BrowserPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
-->

---
### Requirement: Browser Panel intercepts HTML form submissions inside the iframe

The Browser Panel SHALL handle form submissions by injecting a postMessage-based interceptor into rendered HTML. The interceptor SHALL prevent native iframe navigation, resolve the form `action` against `https://challenge-<slug>.localhost/`, preserve the declared HTTP method, and serialize fields as query parameters for `GET`, `application/x-www-form-urlencoded` for standard `POST`, or `FormData` for `multipart/form-data`.

#### Scenario: GET form appends fields to the query string

- **WHEN** a user submits a form with `method="GET"` inside the rendered iframe
- **THEN** the Browser Panel SHALL dispatch a GET request whose URL contains the serialized form fields and whose body is empty

#### Scenario: Multipart form keeps FormData transport

- **WHEN** a user submits a form with `method="POST"` and `enctype="multipart/form-data"`
- **THEN** the Browser Panel SHALL dispatch a POST request whose body is a `FormData` object and SHALL NOT set the multipart boundary header manually

<!-- @trace
source: web-exploit-challenge-platform
code:
  - .vitepress/theme/components/BrowserPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
-->

---
### Requirement: BrowserPanel dispatches HTTP requests to the challenge runtime

The BrowserPanel SHALL call the injected `dispatch` prop directly instead of issuing browser `fetch()` requests that depend on Service Worker interception. The panel SHALL wrap dispatches in `browserFetch()` so that `X-Wxlsh-Cookie` is attached before the request, `X-Wxlsh-Set-Cookie` is harvested after the response, and up to five redirects are followed with the stored cookie jar.

#### Scenario: Browser request succeeds without a Service Worker fetch round-trip

- **WHEN** the user presses Go in the Browser Panel
- **THEN** the panel SHALL construct a `Request` object and pass it to the injected `dispatch` function directly

#### Scenario: Redirect reuses the cookie jar

- **WHEN** a response returns `302`, `Location: /files`, and `X-Wxlsh-Set-Cookie: session_user=guest; Path=/`
- **THEN** the BrowserPanel SHALL store the cookie, follow the redirect as a GET request, and include `X-Wxlsh-Cookie: session_user=guest` on the next dispatch

<!-- @trace
source: reconcile-shared-runtime-specs
code:
  - .vitepress/theme/components/BrowserPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
-->
