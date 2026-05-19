## MODIFIED Requirements

### Requirement: Runtime initialization installs requests

For Python-based challenges (flask/fastapi), the runtime initialization sequence SHALL install the `requests` library via `micropip.install('requests')` after loading base packages, and then apply the HTTPAdapter monkey-patch to route requests through the JS dispatch bridge.

#### Scenario: requests installed during init

- **WHEN** a Python-based challenge runtime initializes
- **THEN** `requests` and its dependencies are installed via micropip
- **AND** `requests.adapters.HTTPAdapter.send` is monkey-patched to use the dispatch bridge

### Requirement: Tool-layer Pyodide also patches requests

For non-Python backends (e.g., PHP) that load a standalone Pyodide as tool layer, the system SHALL also install and patch `requests` in the tool-layer Pyodide instance.

#### Scenario: PHP challenge tool-layer Pyodide has requests

- **WHEN** a PHP challenge initializes and loads standalone Pyodide for tools
- **THEN** `requests` is installed and patched in the tool-layer Pyodide
