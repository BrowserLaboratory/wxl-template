## ADDED Requirements

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
