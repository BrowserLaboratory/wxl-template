# code-editor-panel Specification

## Purpose

Provides an in-browser Python code editor powered by CodeMirror 6 with syntax highlighting and autocompletion, a resizable split layout with an output region, and Pyodide-based execution that routes HTTP requests through the Service Worker dispatch bridge.

## Requirements

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

---
### Requirement: Code Editor Panel has a resizable vertical split layout

The panel SHALL be divided into two regions: an editor region (top) and an output region (bottom). A drag handle between the two regions SHALL allow the user to resize them. The editor region SHALL have a minimum height of 120px and the output region SHALL have a minimum height of 80px. The default split SHALL be approximately 65% editor / 35% output.

#### Scenario: Drag handle resizes editor and output

- **WHEN** the user drags the handle between editor and output downward
- **THEN** the output region SHALL grow and the editor region SHALL shrink accordingly

#### Scenario: Minimum heights are enforced

- **WHEN** the user drags the handle to the extreme top or bottom
- **THEN** neither the editor nor the output region SHALL collapse below their minimum height


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

---
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

---
### Requirement: CodeEditorPanel reports code execution via callback prop

The `CodeEditorPanel.vue` component SHALL accept an optional `onCodeExecuted` callback prop with the signature:
```typescript
onCodeExecuted?: (event: { code: string; output: string; error: boolean; duration: number }) => void
```

The callback SHALL be invoked inside the `finally` block of `runCode()`, positioned **before** the stdout restoration step (`sys.stdout = sys.__stdout__`). This placement ensures the callback executes regardless of whether the code succeeded or threw an exception, and is not affected by potential stdout restoration failures.

The callback SHALL use a locally tracked boolean (`isError`) set in the `catch` block to determine the `error` flag, rather than relying on string prefix matching of the output text.

The `duration` field SHALL be computed as `Date.now() - startTime`, where `startTime` is captured at the beginning of `runCode()` before any Pyodide calls.

The callback SHALL NOT be invoked when `runCode()` exits early due to null `pyodide` or null `editorView` (silent exit path — no actual execution occurred).

If the callback prop is not provided, execution SHALL proceed without error (optional chaining).

#### Scenario: Successful code execution triggers callback

- **WHEN** a user runs Python code that prints "hello" and execution completes without error
- **THEN** `onCodeExecuted` SHALL be called with `{ code: <source>, output: 'hello\n', error: false, duration: <ms> }`
- **AND** the callback SHALL be invoked before stdout restoration

#### Scenario: Failed code execution triggers callback with error flag

- **WHEN** a user runs Python code that raises `NameError: name 'x' is not defined`
- **THEN** `onCodeExecuted` SHALL be called with `{ code: <source>, output: 'Error:\nNameError: ...', error: true, duration: <ms> }`

#### Scenario: Callback is not invoked on silent exit

- **WHEN** `runCode()` is called but `pyodide` is null (runtime not yet loaded)
- **THEN** `onCodeExecuted` SHALL NOT be invoked
- **AND** the function SHALL return without changing `outputText`

#### Scenario: Callback is optional

- **WHEN** `CodeEditorPanel` is mounted without an `onCodeExecuted` prop
- **THEN** code execution SHALL proceed normally without error

#### Scenario: Callback is invoked before stdout restoration

- **WHEN** code execution completes (success or error) and the `finally` block begins
- **THEN** `onCodeExecuted` SHALL be invoked first
- **AND** stdout restoration (`sys.stdout = sys.__stdout__`) SHALL happen after the callback

<!-- @trace
source: restore-terminal-and-code-panels
updated: 2026-03-24
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/components/WxlshPanel.test.ts
-->