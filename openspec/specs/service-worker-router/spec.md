# service-worker-router Specification

## Purpose

Manages the Service Worker that intercepts challenge-origin HTTP requests and relays them to the appropriate in-browser runtime (Python/PHP) via MessagePort, enabling fully client-side challenge execution without a real backend server.

## Requirements

### Requirement: Service Worker intercepts challenge-*.localhost requests

A Service Worker registered at the root scope SHALL intercept browser-generated fetch and navigation requests whose URL host matches `challenge-<slug>.localhost`. Requests not matching that pattern SHALL pass through unchanged. Direct runtime dispatches from challenge UI panels SHALL remain valid even when they do not create a browser `fetch` event.

#### Scenario: Matching browser fetch is intercepted

- **WHEN** a browser fetch targets `https://challenge-sqli-basic.localhost/api/users`
- **THEN** the Service Worker SHALL intercept the request and route it through the challenge relay path instead of forwarding it to the network

#### Scenario: UI panel dispatch does not require a fetch event

- **WHEN** BrowserPanel calls its injected `dispatch` prop with a `Request` object
- **THEN** the request SHALL be handled by the runtime without depending on a Service Worker `fetch` event


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agent/skills/spectra-debug/SKILL.md
  - .agent/skills/spectra-discuss/SKILL.md
  - .agent/skills/spectra-archive/SKILL.md
  - .agent/skills/spectra-ingest/SKILL.md
  - .agent/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agent/skills/spectra-audit/SKILL.md
  - .agent/skills/spectra-propose/SKILL.md
  - .agent/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Router dispatches to correct runtime based on challenge type

Upon intercepting a challenge-origin request, the Service Worker SHALL look up the registered challenge entry, serialize the request into `{ method, url, headers, body }`, and relay it to the page through the registered `MessagePort`. The relay contract SHALL be backend-agnostic: `flask`, `fastapi`, and `php` SHALL all use the same `HANDLE_REQUEST` request/response message shape, while backend-specific execution remains page-side runtime logic.

#### Scenario: PHP challenge uses the same relay contract as Python challenges

- **WHEN** a registered challenge declares `backend: php` and the Service Worker intercepts a challenge-origin request
- **THEN** the Service Worker SHALL send the same `HANDLE_REQUEST` message shape that it uses for `flask` and `fastapi`

#### Scenario: Unknown backend returns 501

- **WHEN** the registered challenge entry contains an unrecognized backend value
- **THEN** the Service Worker SHALL return an HTTP `501 Not Implemented` response


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agent/skills/spectra-debug/SKILL.md
  - .agent/skills/spectra-discuss/SKILL.md
  - .agent/skills/spectra-archive/SKILL.md
  - .agent/skills/spectra-ingest/SKILL.md
  - .agent/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agent/skills/spectra-audit/SKILL.md
  - .agent/skills/spectra-propose/SKILL.md
  - .agent/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Challenge page registers itself with the Service Worker

When a challenge page mounts, it SHALL send `{ type: 'REGISTER_CHALLENGE', slug, backend, port }` to the Service Worker and transfer the `MessagePort` used for request relay. When the challenge page unmounts, it SHALL send `{ type: 'UNREGISTER_CHALLENGE', slug }`. A ready Service Worker with an active registration SHALL be sufficient for the page to complete registration and unlock runtime tooling, even before `controllerchange` fires.

#### Scenario: Active worker without controller still permits registration

- **WHEN** `navigator.serviceWorker.controller` is null but `navigator.serviceWorker.ready` resolves with an active worker
- **THEN** the challenge page SHALL register the challenge and treat Service Worker readiness as satisfied

#### Scenario: Unregistration clears the routing entry

- **WHEN** the challenge page sends `UNREGISTER_CHALLENGE`
- **THEN** the Service Worker SHALL remove the slug mapping and subsequent intercepted requests for that slug SHALL return HTTP `503`


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agent/skills/spectra-debug/SKILL.md
  - .agent/skills/spectra-discuss/SKILL.md
  - .agent/skills/spectra-archive/SKILL.md
  - .agent/skills/spectra-ingest/SKILL.md
  - .agent/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agent/skills/spectra-audit/SKILL.md
  - .agent/skills/spectra-propose/SKILL.md
  - .agent/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Service Worker returns structured error responses on runtime failure

If the dispatched runtime throws an unhandled error, the Service Worker SHALL return an HTTP 500 response with a JSON body `{ error: string, stack?: string }` in development mode, or `{ error: "Internal Server Error" }` in production mode.

#### Scenario: Runtime exception produces 500 response

- **WHEN** the Python or PHP runtime throws an unhandled exception while processing a request
- **THEN** the Service Worker SHALL catch the exception and return HTTP 500 with error details


<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->

---
### Requirement: Service Worker source resides in .vitepress/workers/

The Service Worker router source file SHALL be located at `.vitepress/workers/router.ts` (renamed from `.vitepress/sw/router.ts`). The compiled output path (`docs/public/challenge-sw.js`) and all runtime behaviors SHALL remain unchanged. Any build scripts or import references that pointed to `.vitepress/sw/` SHALL be updated to `.vitepress/workers/`. The Service Worker registration in `.vitepress/theme/index.ts` SHALL use `import.meta.env.BASE_URL` to construct the registration path as `${import.meta.env.BASE_URL}challenge-sw.js`, ensuring correct resolution when VitePress is configured with a non-root `base` path.

#### Scenario: Router test file imports from the new path

- **WHEN** the test suite at `tests/unit/workers/router.test.ts` imports the router module
- **THEN** the import SHALL resolve from `.vitepress/workers/router.ts` without error

#### Scenario: Compiled output is unaffected

- **WHEN** the service worker is compiled to `docs/public/challenge-sw.js`
- **THEN** the output file path and contents SHALL be identical to before the rename

#### Scenario: Service Worker registration respects VitePress base path

- **WHEN** VitePress is configured with `base: '/seclab/'`
- **THEN** the Service Worker SHALL be registered at `/seclab/challenge-sw.js`

#### Scenario: Service Worker registration works with default root base

- **WHEN** VitePress uses the default root base (`/`)
- **THEN** the Service Worker SHALL be registered at `/challenge-sw.js`


<!-- @trace
source: fix-build-settings
updated: 2026-03-25
code:
  - package.json
  - .github/workflows/release.yml
  - docs/shared/challenges.data.ts
  - tsconfig.json
  - .vitepress/theme/index.ts
-->

---
### Requirement: Service Worker waits for challenge registration on registry miss

When a fetch event arrives at the Service Worker and the target slug is not yet in the registry, the Service Worker SHALL NOT immediately return HTTP 503. Instead, it SHALL wait for a `REGISTER_CHALLENGE` message for that slug (with a timeout of 3 seconds). Once registration arrives, the Service Worker SHALL retry the request dispatch. If the timeout expires before registration, the Service Worker SHALL return HTTP 503.

#### Scenario: Fetch arrives before registration and succeeds after waiting

- **WHEN** a fetch event arrives for `challenge-<slug>.localhost` and the slug is not yet in the registry
- **AND** a `REGISTER_CHALLENGE` message for that slug arrives within 3 seconds
- **THEN** the Service Worker SHALL hold the fetch response, register the challenge, then dispatch the request and return the runtime's response

#### Scenario: Fetch times out waiting for registration and returns 503

- **WHEN** a fetch event arrives for `challenge-<slug>.localhost` and the slug is not yet in the registry
- **AND** no `REGISTER_CHALLENGE` message arrives within 3 seconds
- **THEN** the Service Worker SHALL return HTTP 503 with body `{ "error": "challenge not registered" }`

#### Scenario: Multiple concurrent fetches wait for the same slug registration

- **WHEN** multiple fetch events arrive for the same `challenge-<slug>.localhost` before registration
- **AND** a `REGISTER_CHALLENGE` message for that slug subsequently arrives
- **THEN** all waiting fetch requests SHALL be unblocked and dispatched after registration


<!-- @trace
source: fix-challenge-registration-race
updated: 2026-03-22
code:
  - docs/public/challenge-sw.js
  - .vitepress/workers/router.ts
tests:
  - tests/unit/workers/router.test.ts
-->


<!-- @trace
source: fix-challenge-registration-race
updated: 2026-03-22
code:
  - docs/public/challenge-sw.js
  - .vitepress/workers/router.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/workers/router.test.ts
-->

---
### Requirement: Service Worker handles navigation requests from iframe link clicks

The Service Worker SHALL handle `fetch` events with `request.mode === "navigate"` for URLs matching `challenge-<slug>.localhost`. Navigation requests SHALL be treated identically to regular fetch requests: routed through the registered challenge's `MessagePort` relay. The Service Worker SHALL NOT distinguish between navigation and non-navigation requests for challenge-origin URLs.

#### Scenario: iframe link click navigation request is intercepted

- **WHEN** a link inside the Browser Panel iframe is clicked, triggering a navigation fetch to `https://challenge-<slug>.localhost/path`
- **THEN** the Service Worker SHALL intercept the navigation request, relay it via MessageChannel, and return the response so the page-side handler can update the iframe

#### Scenario: Navigation request outside challenge origin passes through

- **WHEN** a navigation fetch event fires for a URL that does not match `challenge-*.localhost`
- **THEN** the Service Worker SHALL NOT intercept it and SHALL pass it through to the network

<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->