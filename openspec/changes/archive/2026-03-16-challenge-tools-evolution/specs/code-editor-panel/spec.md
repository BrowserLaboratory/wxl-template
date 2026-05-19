## ADDED Requirements

### Requirement: Code Editor Panel provides a Python editing environment with CodeMirror

The `CodeEditorPanel.vue` component SHALL embed a CodeMirror 6 editor configured for Python. It SHALL include `@codemirror/lang-python` for syntax highlighting, `@codemirror/autocomplete` for autocompletion (Python keywords, builtins, and a `requests`-stub API). The editor SHALL be initialized lazily inside `onMounted` and cleaned up in `onUnmounted`.

#### Scenario: Python syntax is highlighted

- **WHEN** the user types Python code in the editor
- **THEN** keywords, strings, comments, and built-in functions SHALL be visually distinguished via syntax highlighting

#### Scenario: Autocomplete triggers on typing

- **WHEN** the user types two or more characters in the editor
- **THEN** a completion dropdown SHALL appear with Python keyword and identifier suggestions

#### Scenario: Editor is lazy-loaded

- **WHEN** the user has not yet opened the Code tab
- **THEN** the CodeMirror library SHALL NOT be loaded (dynamic import deferred until tab activation)

---

### Requirement: Code Editor Panel has a resizable vertical split layout

The panel SHALL be divided into two regions: an editor region (top) and an output region (bottom). A drag handle between the two regions SHALL allow the user to resize them. The editor region SHALL have a minimum height of 120px and the output region SHALL have a minimum height of 80px. The default split SHALL be approximately 65% editor / 35% output.

#### Scenario: Drag handle resizes editor and output

- **WHEN** the user drags the handle between editor and output downward
- **THEN** the output region SHALL grow and the editor region SHALL shrink accordingly

#### Scenario: Minimum heights are enforced

- **WHEN** the user drags the handle to the extreme top or bottom
- **THEN** neither the editor nor the output region SHALL collapse below their minimum height

---

### Requirement: Code Editor Panel executes Python via Pyodide

The "Run" button (and the Ctrl+Enter keyboard shortcut) SHALL execute the editor's content using Pyodide's `runPythonAsync`. The Python execution environment SHALL have a pre-injected `requests` stub that routes HTTP calls through the challenge's `dispatch()` function. `print()` output and return values SHALL be shown in the output region. Uncaught exceptions SHALL be shown as a formatted traceback in the output region.

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

---

### Requirement: Code Editor Panel supports named script save and load via IndexedDB

A "Save" button in the toolbar SHALL open a name-input prompt. Confirming SHALL persist the current editor content to IndexedDB under that name via `useChallengePersistence`. A "Load" button SHALL open a dropdown listing all saved scripts. Selecting one SHALL replace the editor content with the saved content.

#### Scenario: User saves a script with a name

- **WHEN** the user clicks "Save", enters a name, and confirms
- **THEN** the script SHALL be stored in IndexedDB and appear in the Load dropdown

#### Scenario: User loads a previously saved script

- **WHEN** the user opens the Load dropdown and selects a saved script
- **THEN** the editor content SHALL be replaced with the saved script content

#### Scenario: Saved scripts survive page reload

- **WHEN** the user reloads the challenge page and opens the Load dropdown
- **THEN** all previously saved scripts SHALL still be listed
