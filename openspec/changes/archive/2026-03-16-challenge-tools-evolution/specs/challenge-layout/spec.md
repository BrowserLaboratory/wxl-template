## ADDED Requirements

### Requirement: ChallengeLayout gates all tool panels on both runtimeReady and swReady

`ChallengeLayout.vue` SHALL maintain two separate reactive booleans: `runtimeReady` (set to `true` when the Python/PHP/WASM runtime finishes initialization) and `swReady` (set to `true` when `navigator.serviceWorker.controller` is non-null). All tool panels (Browser, Terminal, Repeater, Code) SHALL receive a `disabled` prop computed as `!runtimeReady || !swReady`. The SW readiness MUST be established before `swReady` is set to `true`.

#### Scenario: Tools are disabled until both runtime and SW are ready

- **WHEN** the runtime has finished loading but `navigator.serviceWorker.controller` is still null
- **THEN** all tool panels SHALL have `disabled: true` and SHALL NOT allow the user to send requests

#### Scenario: Tools are enabled once both are ready

- **WHEN** both `runtimeReady` and `swReady` are true
- **THEN** all tool panels SHALL have `disabled: false` and SHALL accept user input

#### Scenario: swReady becomes true on controllerchange

- **WHEN** the page loads without an active SW controller (e.g., hard refresh) and the SW takes control via `controllerchange`
- **THEN** `swReady` SHALL be set to `true` and the tools SHALL become enabled

## MODIFIED Requirements

### Requirement: Challenge layout renders a left-right split view

The `ChallengeLayout.vue` SHALL render a two-column layout: a left column containing the markdown description panel and flag submit form, and a right column containing the Browser, wxlsh Terminal, Repeater, and Code Editor interaction panels (four tabs total).

#### Scenario: Left and right columns are both visible

- **WHEN** a challenge page loads
- **THEN** the left column (description + flag submit) and the right column (interaction panels with four tabs) SHALL both be visible simultaneously
