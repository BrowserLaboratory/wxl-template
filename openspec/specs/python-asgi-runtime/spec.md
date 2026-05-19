## ADDED Requirements

<!-- ASGI bridge translates requirement moved to canonical location below -->


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

<!-- ASGI bridge collects requirement moved to canonical location below -->


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

<!-- Pyodide app is initialized once per challenge session — moved to canonical location below -->

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

<!-- Virtual FS is mounted into Pyodide before app initialization — moved to canonical location below -->

<!-- Python ASGI runtime installs micropip packages before app execution — moved to canonical location below -->

## Requirements

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

### Requirement: ASGI bridge translates HTTP requests to ASGI scope and invokes Pyodide app

The canonical Python request bridge SHALL be installed by `.vitepress/theme/composables/usePythonRuntime.ts` as inline Python executed inside Pyodide. The bridge SHALL inspect the loaded `app` object and choose WSGI translation for synchronous two-argument callables or ASGI translation for async applications. Rust code under `chall-wasm/asgi-bridge/` SHALL NOT be treated as the canonical challenge request translation path in the active runtime contract.

#### Scenario: Flask-style app receives a WSGI environ

- **WHEN** the loaded `app` is a synchronous two-argument callable and a `GET /users` request is handled
- **THEN** the runtime SHALL build a WSGI environ with `REQUEST_METHOD`, `PATH_INFO`, `QUERY_STRING`, and request headers mapped into `HTTP_*` keys before invoking the app

#### Scenario: FastAPI app receives an ASGI scope

- **WHEN** the loaded `app` is an async ASGI application and a `POST /login` request is handled
- **THEN** the runtime SHALL build an ASGI HTTP scope and provide `receive` and `send` callables that deliver the request body and collect response events


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: ASGI bridge collects response events and returns HTTP response

The inline bridge SHALL normalize both WSGI and ASGI execution results into a JSON response descriptor with `status`, `headers`, and a base64-encoded `body`. `PythonRuntime.handleRequest()` SHALL decode that descriptor into a JavaScript `Response`.

#### Scenario: WSGI response is normalized

- **WHEN** a Flask-style app calls `start_response('200 OK', [('Content-Type', 'text/plain')])` and returns body bytes
- **THEN** the runtime SHALL serialize a response descriptor with status `200`, the emitted headers, and a base64-encoded body

#### Scenario: ASGI body chunks are concatenated

- **WHEN** an ASGI app emits multiple `http.response.body` events with `more_body: true`
- **THEN** the bridge SHALL concatenate all body chunks before returning the final response descriptor


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Pyodide app is initialized once per challenge session

The Python ASGI runtime SHALL load Pyodide and execute the challenge's `app_code` exactly once per challenge session (not per request). The resulting ASGI application callable SHALL be cached and reused for all subsequent requests.

#### Scenario: Pyodide is loaded lazily on first challenge access

- **WHEN** a user navigates to a Python challenge page for the first time
- **THEN** Pyodide SHALL be loaded and `app_code` SHALL be executed to produce the ASGI app callable

#### Scenario: Subsequent requests reuse cached app

- **WHEN** a second request arrives for the same challenge session
- **THEN** Pyodide SHALL NOT be re-loaded and the cached app callable SHALL be invoked directly

---
### Requirement: Virtual FS is mounted into Pyodide before app initialization

Before executing `app_code`, the ASGI runtime SHALL mount all decrypted FS entries (obtained from `wasm-fs`) into Pyodide's MEMFS. The mount point SHALL match the virtual paths defined in the challenge frontmatter.

#### Scenario: /flag.txt is accessible from Python app

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and the app reads `open('/flag.txt').read()`
- **THEN** the Python code SHALL receive the decrypted flag content

#### Scenario: FS mount does not expose content to JavaScript

- **WHEN** the FS is mounted into Pyodide MEMFS
- **THEN** the decrypted content SHALL only be accessible inside the Pyodide Python environment, not via JavaScript `window` or `globalThis`

---
### Requirement: Python ASGI runtime module resides in .vitepress/composables

The `PythonRuntime` class SHALL be implemented in `.vitepress/theme/composables/usePythonRuntime.ts` (renamed from `chall-wasm/python-bridge/python-runtime.ts`). All consumers (`.vitepress/sw/router.ts` and test files) SHALL import from the new path. The public API — `initialize(appCode: string, fsEntries: Record<string, Uint8Array>, packages: string[]): Promise<void>` and `handleRequest(request: Request): Promise<Response>` — SHALL remain unchanged except for the `initialize()` signature update.

#### Scenario: Runtime module is importable from .vitepress/composables

- **WHEN** `.vitepress/sw/router.ts` imports `PythonRuntime`
- **THEN** the import path SHALL be `.vitepress/theme/composables/usePythonRuntime` and the import SHALL resolve without error

#### Scenario: Existing runtime behavior is preserved after migration

- **WHEN** `PythonRuntime.handleRequest()` is called with an HTTP request after migration
- **THEN** it SHALL produce the same response as before the migration (verified by existing test suite passing)

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
### Requirement: Python ASGI runtime installs micropip packages before app execution

The `PythonRuntime.initialize()` method SHALL accept the following signature: `initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}, packages: string[] = []): Promise<void>`. The `fsEntries` parameter SHALL be a `Record<string, Uint8Array>` mapping virtual paths to binary content. The `packages` parameter SHALL be an optional array of package names to install via micropip.

#### Scenario: initialize called with all parameters

- **WHEN** `PythonRuntime.initialize(appCode, { '/flag.txt': flagBytes }, ['fastapi', 'anyio'])` is called
- **THEN** the runtime SHALL mount `/flag.txt` into Pyodide MEMFS, install `fastapi` and `anyio` via micropip, and execute `appCode`

#### Scenario: initialize called with defaults

- **WHEN** `PythonRuntime.initialize(appCode)` is called without fsEntries or packages
- **THEN** the runtime SHALL use empty defaults and execute `appCode` without mounting files or installing packages

---
### Requirement: E2E test mock completeness

All E2E test mock objects for `PyodideInstance` SHALL implement every method defined in the `PyodideInstance` interface, including `runPythonAsync`, `loadPackage`, `FS.writeFile`, `globals.get`, and `globals.set`.

#### Scenario: Flask SQLi E2E test mock includes loadPackage

- **WHEN** `PythonRuntime.initialize()` is called with a mock Pyodide in the Flask SQLi E2E test
- **THEN** the mock SHALL provide a `loadPackage` method that resolves to `undefined`
- **AND** the initialization SHALL complete without TypeError

#### Scenario: Flask SQLi E2E test mock includes globals.set

- **WHEN** `PythonRuntime` accesses `pyodide.globals.set` during initialization
- **THEN** the mock SHALL provide a `globals.set` method as a no-op function

<!-- @trace
source: fix-e2e-flask-sqli-mock
updated: 2026-03-25
tests:
  - tests/e2e/flask-sqli.test.ts
-->

---
### Requirement: Runtime handles HTTP request dispatch

`PythonRuntime.handleRequest()` SHALL accept a browser-created `Request`, filter out `X-Wxlsh-*` transport headers before calling the bridge, convert `X-Wxlsh-Cookie` back into a real `cookie` header, and transport all `set-cookie` response headers back to JavaScript via a single `X-Wxlsh-Set-Cookie` response header.

#### Scenario: Cookie transport is restored before bridge invocation

- **WHEN** a request arrives with header `X-Wxlsh-Cookie: session_user=guest`
- **THEN** the bridge input SHALL include `cookie: session_user=guest` and SHALL NOT include any `x-wxlsh-*` headers

#### Scenario: Set-Cookie headers are transported back to JavaScript

- **WHEN** the bridge returns response headers containing two `set-cookie` entries
- **THEN** `PythonRuntime.handleRequest()` SHALL emit a JavaScript `Response` with `X-Wxlsh-Set-Cookie` containing the newline-joined cookie values and SHALL omit raw `set-cookie` headers


<!-- @trace
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Runtime initializes virtual filesystem from encrypted entries

When writing FS entries to the Pyodide filesystem, the runtime SHALL create parent directories (via `FS.mkdir()`) before writing files. This enables challenge source structures with subdirectories such as `src/templates/`.

#### Scenario: FS entry with nested path

- **WHEN** an FS entry has path `/templates/login.html`
- **THEN** the runtime SHALL create directory `/templates` before writing the file

<!-- @trace
source: browser-cookie-and-redirect
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/door-is-open/index.md
  - docs/challenge/sqli-demo/index.md
  - docs/challenge/door-is-open/src/flag.txt
  - docs/challenge/fastapi-demo/index.md
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - docs/challenge/php-demo/index.md
-->