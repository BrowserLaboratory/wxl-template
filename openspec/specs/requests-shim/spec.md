# requests-shim Specification

## Purpose

Enables Python `requests` library usage inside the Pyodide environment by installing the real library via micropip and monkey-patching `HTTPAdapter.send()` to route all HTTP traffic through the async JavaScript dispatch bridge instead of attempting socket connections.

## Requirements

### Requirement: Install real requests library in Pyodide

The system SHALL install the real Python `requests` library (and its dependencies: urllib3, charset_normalizer, certifi, idna) via `micropip.install('requests')` during runtime initialization for Python-based challenges.

#### Scenario: requests available after runtime init

- **WHEN** a Python-based challenge (flask/fastapi) runtime initialization completes
- **THEN** `import requests` in both Code Editor and Terminal contexts succeeds without error


<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - docs/challenge/php-demo/index.md
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/sqli-demo/src/app.py
  - docs/challenge/sqli-demo/index.md
  - scripts/challenge-analyze.ts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/fastapi-demo/src/app.py
  - scripts/challenge-utils.ts
  - docs/challenge/php-demo/index.php
  - docs/challenge/fastapi-demo/index.md
  - docs/challenge/php-demo/src/flag.txt
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - docs/challenge/php-demo/src/index.php
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - docs/challenge/php-demo/flag.txt
  - .vitepress/theme/components/BrowserChrome.vue
  - docs/challenge/sqli-demo/app.py
  - .vitepress/theme/components/MergedNav.vue
  - docs/challenge/fastapi-demo/app.py
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo/src/flag.txt
  - docs/challenge/sqli-demo/src/flag.txt
  - scripts/create-challenge.ts
  - docs/challenge/sqli-demo.md
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
### Requirement: Monkey-patch HTTPAdapter.send for dispatch bridge

The system SHALL monkey-patch `requests.adapters.HTTPAdapter.send()` to route all HTTP requests through the async JS dispatch bridge instead of attempting socket connections or synchronous XMLHttpRequest. The dispatch bridge function SHALL be injected into Pyodide globals as `_wxlsh_dispatch_bridge` before the monkey-patch is applied. Because `HTTPAdapter.send()` is a synchronous API but the JS bridge is async, `_patched_send` SHALL use `pyodide.ffi.run_sync()` to synchronously resolve the JS Promise returned by the bridge, then convert the result back to a `requests.Response` object.

#### Scenario: requests.get routes through async dispatch bridge

- **WHEN** user executes `requests.get('https://challenge-<slug>.localhost/api')` in Code Editor
- **THEN** the request SHALL be routed through the async JS dispatch bridge function (NOT synchronous XMLHttpRequest)
- **AND** the response SHALL be returned as a standard `requests.Response` object with correct `status_code`, `text`, `headers`, and `json()` method

#### Scenario: Full requests API compatibility

- **WHEN** user uses requests features including Session, cookies, auth, headers, and redirect following
- **THEN** all features work as expected because only the transport layer is patched; all higher-level requests logic remains native

#### Scenario: Dispatch bridge not available

- **WHEN** `_wxlsh_dispatch_bridge` is not set in Pyodide globals
- **THEN** `_patched_send` SHALL raise a `ConnectionError` with a descriptive message indicating the bridge is not initialized


<!-- @trace
source: fix-terminal-and-http-dispatch
updated: 2026-03-25
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useWxlsh.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
-->

---
### Requirement: requests available for non-Python backends

For non-Python backends (e.g., PHP), where a standalone Pyodide is loaded as a tool layer, the system SHALL also install and patch `requests` in the tool-layer Pyodide instance.

#### Scenario: PHP challenge code editor uses requests

- **WHEN** user writes `import requests` in the Code Editor on a PHP challenge
- **THEN** the import succeeds and HTTP requests route through the dispatch bridge

<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - docs/challenge/php-demo/index.md
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/sqli-demo/src/app.py
  - docs/challenge/sqli-demo/index.md
  - scripts/challenge-analyze.ts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/fastapi-demo/src/app.py
  - scripts/challenge-utils.ts
  - docs/challenge/php-demo/index.php
  - docs/challenge/fastapi-demo/index.md
  - docs/challenge/php-demo/src/flag.txt
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - docs/challenge/php-demo/src/index.php
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - docs/challenge/php-demo/flag.txt
  - .vitepress/theme/components/BrowserChrome.vue
  - docs/challenge/sqli-demo/app.py
  - .vitepress/theme/components/MergedNav.vue
  - docs/challenge/fastapi-demo/app.py
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo/src/flag.txt
  - docs/challenge/sqli-demo/src/flag.txt
  - scripts/create-challenge.ts
  - docs/challenge/sqli-demo.md
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