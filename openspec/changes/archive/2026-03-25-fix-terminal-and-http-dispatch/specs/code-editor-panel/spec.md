## MODIFIED Requirements

### Requirement: Code Editor Panel executes Python via Pyodide

The "Run" button (and the Ctrl+Enter keyboard shortcut) SHALL execute the editor's content using Pyodide's `runPythonAsync`. The Python execution environment SHALL have two HTTP dispatch paths: (1) the real `requests` library (installed via micropip) whose `HTTPAdapter.send()` is monkey-patched to call the async JS dispatch bridge via `pyodide.ffi.run_sync()`, and (2) a lightweight async `_RequestsStub` injected before user code execution that directly `await`s the JS bridge. The dispatch bridge function SHALL be injected into Pyodide globals as `_wxlsh_dispatch_bridge` via `py.globals.set()` before either path is used. `print()` output and return values SHALL be shown in the output region. Uncaught exceptions SHALL be shown as a formatted traceback in the output region.

#### Scenario: Run button executes code and shows output

- **WHEN** the user clicks "Run" or presses Ctrl+Enter
- **THEN** the code in the editor SHALL be executed and its print output SHALL appear in the output region

#### Scenario: requests.get routes through async dispatch bridge

- **WHEN** Python code calls `requests.get("https://challenge-sqli.localhost/")`
- **THEN** the request SHALL be routed through the async JS dispatch bridge (NOT synchronous XMLHttpRequest)
- **AND** the response SHALL be returned to the Python caller as a standard `requests.Response`

#### Scenario: Python exception shows traceback

- **WHEN** the code raises an unhandled exception
- **THEN** the output region SHALL display the exception type, message, and traceback in red

#### Scenario: Panel is disabled when runtime is not ready

- **WHEN** `runtimeReady` is false
- **THEN** the "Run" button SHALL be disabled and the editor SHALL display a "Runtime loading…" overlay

#### Scenario: Dispatch bridge injected before requests patch

- **WHEN** Pyodide initialization completes in ChallengeLayout
- **THEN** `_wxlsh_dispatch_bridge` SHALL be set on Pyodide globals via `py.globals.set()` before `REQUESTS_MONKEY_PATCH` is executed
- **AND** the bridge function SHALL route HTTP through the same dispatch path used by Browser panel
