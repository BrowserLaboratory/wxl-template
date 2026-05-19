## ADDED Requirements

<!-- PHP Runtime executes challenge PHP code via php-wasm — moved to canonical location below -->

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
source: fix-flask-php-runtime
updated: 2026-03-16
code:
  - tests/__mocks__/virtual-fs.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/config.mts
  - docs/public/challenge-sw.js
  - docs/index.md
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/e2e/flask-sqli.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
-->

<!-- Virtual FS entries are mounted into php-wasm before execution — moved to canonical location below -->

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

<!-- PHP Runtime is initialized once per challenge session — moved to canonical location below -->

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

<!-- PHP Runtime handles HTTP request method and body — moved to canonical location below -->

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

### Requirement: PHP Runtime executes challenge PHP code via php-wasm

The PHP Runtime SHALL use `php-wasm` to execute challenge PHP code and SHALL prepare the supported request context before each run: `$_SERVER`, `$_GET`, `$_POST`, `$_COOKIE`, and `$GLOBALS['_RAW_INPUT']`. The adapter returned by `ChallengeLayout.vue` SHALL continue to expose `headers: string[]`, but those headers SHALL remain empty until `php-wasm` can surface `header()` output.

#### Scenario: Cookie-backed request context is visible to PHP code

- **WHEN** a request arrives with header `Cookie: session_user=guest`
- **THEN** the executed PHP app SHALL be able to read `$_COOKIE['session_user'] === 'guest'`

#### Scenario: header() output remains unavailable

- **WHEN** the executed PHP app calls `header('X-Test: 1')`
- **THEN** the runtime SHALL still return the response body and SHALL NOT rely on adapter-provided response headers


<!-- @trace
source: settle-php-runtime-request-contract
updated: 2026-04-04
code:
  - .agents/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-propose/SKILL.md
  - scripts/challenge-keygen.ts
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: Virtual FS entries are mounted into php-wasm before execution

Before executing the PHP script, the PHP Runtime SHALL write all decrypted FS entries (from `wasm-fs`) into php-wasm's virtual filesystem. Each entry SHALL be accessible at its defined virtual path.

#### Scenario: /flag.txt is accessible from PHP

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and the PHP script reads `file_get_contents('/flag.txt')`
- **THEN** the PHP code SHALL receive the decrypted flag content

---
### Requirement: PHP Runtime is initialized once per challenge session

The PHP Runtime SHALL initialize php-wasm exactly once per challenge session. Subsequent requests SHALL reuse the same php-wasm instance without re-initialization.

#### Scenario: Repeated requests reuse php-wasm instance

- **WHEN** a second HTTP request arrives for the same PHP challenge session
- **THEN** php-wasm SHALL NOT be re-initialized and the cached instance SHALL be used

---
### Requirement: PHP Runtime handles HTTP request method and body

The PHP Runtime SHALL populate `$_GET` from the request query string, `$_POST` from `application/x-www-form-urlencoded` POST bodies, `$_COOKIE` from the incoming `Cookie` header, and `$GLOBALS['_RAW_INPUT']` from the raw request body. `$_SERVER['REQUEST_METHOD']`, `$_SERVER['REQUEST_URI']`, and `$_SERVER['HTTP_HOST']` SHALL reflect the incoming request. If the same cookie name appears multiple times in the header, the last value encountered SHALL win. Non-form request bodies SHALL leave `$_POST` empty while preserving `_RAW_INPUT`.

#### Scenario: JSON request body does not populate $_POST

- **WHEN** a POST request with `Content-Type: application/json` body arrives
- **THEN** `$_POST` SHALL be empty and `$GLOBALS['_RAW_INPUT']` SHALL contain the raw JSON string

#### Scenario: Cookie header populates $_COOKIE

- **WHEN** a request arrives with `Cookie: theme=dark; session_user=guest`
- **THEN** `$_COOKIE['theme']` SHALL equal `dark` and `$_COOKIE['session_user']` SHALL equal `guest`

#### Scenario: Missing Cookie header yields an empty cookie map

- **WHEN** a request arrives without a `Cookie` header
- **THEN** the runtime SHALL initialize `$_COOKIE` as an empty array


<!-- @trace
source: settle-php-runtime-request-contract
updated: 2026-04-04
code:
  - .agents/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - .github/workflows/release.yml
  - .agents/skills/spectra-propose/SKILL.md
  - scripts/challenge-keygen.ts
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agents/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

---
### Requirement: PHP runtime module resides in .vitepress/composables

The `PhpRuntime.initialize()` method SHALL accept the following signature: `initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}): Promise<void>`. The `fsEntries` parameter SHALL be a `Record<string, Uint8Array>` mapping virtual paths to binary content.

#### Scenario: initialize called with fsEntries

- **WHEN** `PhpRuntime.initialize(appCode, { '/flag.txt': flagBytes })` is called
- **THEN** the runtime SHALL write `/flag.txt` into php-wasm's virtual filesystem and execute `appCode`

#### Scenario: initialize called with defaults

- **WHEN** `PhpRuntime.initialize(appCode)` is called without fsEntries
- **THEN** the runtime SHALL use an empty default and execute `appCode` without mounting additional files

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