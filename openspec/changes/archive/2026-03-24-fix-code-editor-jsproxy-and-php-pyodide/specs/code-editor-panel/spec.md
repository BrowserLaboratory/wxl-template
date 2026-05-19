## MODIFIED Requirements

### Requirement: Code Editor Panel executes Python via Pyodide

The "Run" button (and the Ctrl+Enter keyboard shortcut) SHALL execute the editor's content using Pyodide's `runPythonAsync`. The Python execution environment SHALL have a pre-injected `requests` stub that routes HTTP calls through the challenge's `dispatch()` function. The `requests` stub SHALL access the dispatch bridge function (`_wxlsh_code_dispatch`) directly from Python's `__main__` globals (set via `py.globals.set()`), and SHALL NOT use `from js import` to access it. `print()` output and return values SHALL be shown in the output region. Uncaught exceptions SHALL be shown as a formatted traceback in the output region.

#### Scenario: Run button executes code and shows output

- **WHEN** the user clicks "Run" or presses Ctrl+Enter
- **THEN** the code in the editor SHALL be executed and its print output SHALL appear in the output region

#### Scenario: requests.get routes through dispatch

- **WHEN** Python code calls `requests.get("https://challenge-sqli.localhost/")`
- **THEN** the request SHALL be routed through `dispatch()` and the response SHALL be returned to the Python caller

#### Scenario: Python exception shows traceback

- **WHEN** the code raises an unhandled exception
- **THEN** the output region SHALL display the exception type, message, and traceback in red

#### Scenario: Panel is disabled when runtime is not ready

- **WHEN** `runtimeReady` is false
- **THEN** the "Run" button SHALL be disabled and the editor SHALL display a "Runtime loading…" overlay

#### Scenario: requests stub accesses dispatch bridge from Python globals

- **WHEN** the `buildRequestsStub()` Python code is injected into Pyodide
- **THEN** the `_dispatch` method SHALL reference `_wxlsh_code_dispatch` as a Python global variable
- **AND** SHALL NOT use `from js import _wxlsh_code_dispatch`
- **AND** the bridge function SHALL have been set via `py.globals.set('_wxlsh_code_dispatch', ...)` before stub injection
