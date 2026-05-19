## ADDED Requirements

### Requirement: Install real requests library in Pyodide

The system SHALL install the real Python `requests` library (and its dependencies: urllib3, charset_normalizer, certifi, idna) via `micropip.install('requests')` during runtime initialization for Python-based challenges.

#### Scenario: requests available after runtime init

- **WHEN** a Python-based challenge (flask/fastapi) runtime initialization completes
- **THEN** `import requests` in both Code Editor and Terminal contexts succeeds without error

### Requirement: Monkey-patch HTTPAdapter.send for dispatch bridge

The system SHALL monkey-patch `requests.adapters.HTTPAdapter.send()` to route all HTTP requests through the JS dispatch bridge instead of attempting socket connections.

#### Scenario: requests.get routes through dispatch bridge

- **WHEN** user executes `requests.get('https://challenge-<slug>.localhost/api')` in Code Editor
- **THEN** the request is routed through the JS dispatch bridge to the Service Worker
- **AND** the response is returned as a standard `requests.Response` object with correct `status_code`, `text`, `headers`, and `json()` method

#### Scenario: Full requests API compatibility

- **WHEN** user uses requests features including Session, cookies, auth, headers, and redirect following
- **THEN** all features work as expected because only the transport layer is patched; all higher-level requests logic remains native

### Requirement: requests available for non-Python backends

For non-Python backends (e.g., PHP), where a standalone Pyodide is loaded as a tool layer, the system SHALL also install and patch `requests` in the tool-layer Pyodide instance.

#### Scenario: PHP challenge code editor uses requests

- **WHEN** user writes `import requests` in the Code Editor on a PHP challenge
- **THEN** the import succeeds and HTTP requests route through the dispatch bridge
