## MODIFIED Requirements

### Requirement: Challenge layout renders a left-right split view

The `ChallengeLayout.vue` SHALL render a two-column layout: a left column containing the markdown description panel and flag submit form, and a right column containing the Browser, Network, Repeater, Terminal, and Code Editor interaction panels (five tabs total).

#### Scenario: Left and right columns are both visible

- **WHEN** a challenge page loads
- **THEN** the left column (description + flag submit) and the right column (interaction panels with five tabs) SHALL both be visible simultaneously

---

### Requirement: ChallengeLayout gates all tool panels on both runtimeReady and swReady

`ChallengeLayout.vue` SHALL maintain two separate reactive booleans: `runtimeReady` (set to `true` when the Python/PHP/WASM runtime finishes initialization) and `swReady` (set to `true` when `navigator.serviceWorker.controller` is non-null). All tool panels (Browser, Terminal, Repeater, Code, Network) SHALL receive a `disabled` prop computed as `!runtimeReady || !swReady`. The SW readiness MUST be established before `swReady` is set to `true`.

#### Scenario: Tools are disabled until both runtime and SW are ready

- **WHEN** the runtime has finished loading but `navigator.serviceWorker.controller` is still null
- **THEN** all tool panels SHALL have `disabled: true` and SHALL NOT allow the user to send requests

#### Scenario: Tools are enabled once both are ready

- **WHEN** both `runtimeReady` and `swReady` are true
- **THEN** all tool panels SHALL have `disabled: false` and SHALL accept user input

#### Scenario: swReady becomes true on controllerchange

- **WHEN** the page loads without an active SW controller (e.g., hard refresh) and the SW takes control via `controllerchange`
- **THEN** `swReady` SHALL be set to `true` and the tools SHALL become enabled

## ADDED Requirements

### Requirement: ChallengeLayout provides source-attributed dispatch for Terminal and Code panels

`ChallengeLayout.vue` SHALL create `terminalDispatch` and `codeDispatch` functions using the same `makeSourceDispatch` pattern as `browserDispatch` and `repeaterDispatch`. These dispatch wrappers SHALL:
1. Call `trackedDispatch` to record the HTTP request in the traffic log
2. Call `attackSession.addHttpEvent(entry, 'terminal')` or `attackSession.addHttpEvent(entry, 'code')` respectively

The `WxlshPanel` SHALL receive `terminalDispatch` as its `dispatch` prop. The `CodeEditorPanel` SHALL receive `codeDispatch` as its `dispatch` prop.

#### Scenario: Terminal HTTP request is attributed to terminal source

- **WHEN** the wxlsh terminal executes a `curl` command that makes an HTTP request
- **THEN** the resulting traffic log entry and attack session event SHALL have `source: 'terminal'`

#### Scenario: Code Editor HTTP request is attributed to code source

- **WHEN** Python code in the Code Editor calls `requests.get()` via the dispatch bridge
- **THEN** the resulting traffic log entry and attack session event SHALL have `source: 'code'`

---

### Requirement: ChallengeLayout wires recording callbacks for Terminal and Code panels

`ChallengeLayout.vue` SHALL pass an `onCommandExecuted` callback prop to `WxlshPanel` that calls `attackSession.addTerminalCommand(command, output, error)`. It SHALL pass an `onCodeExecuted` callback prop to `CodeEditorPanel` that calls `attackSession.addCodeExecution(code, output, error, duration)`.

#### Scenario: Terminal command execution is recorded via callback

- **WHEN** a user executes a command in the wxlsh terminal
- **THEN** `WxlshPanel` SHALL invoke the `onCommandExecuted` callback
- **AND** `ChallengeLayout` SHALL forward the data to `attackSession.addTerminalCommand()`

#### Scenario: Code execution is recorded via callback

- **WHEN** a user runs Python code in the Code Editor
- **THEN** `CodeEditorPanel` SHALL invoke the `onCodeExecuted` callback
- **AND** `ChallengeLayout` SHALL forward the data to `attackSession.addCodeExecution()`
