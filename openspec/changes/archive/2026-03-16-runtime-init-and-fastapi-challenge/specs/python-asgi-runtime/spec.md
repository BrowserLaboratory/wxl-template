## ADDED Requirements

### Requirement: Python ASGI runtime installs micropip packages before app execution

When `PythonRuntime.initialize()` is called with a non-empty `packages` array, the runtime SHALL install all specified packages via `micropip.install()` inside Pyodide before executing `app_code`. Package installation SHALL complete before the app callable is invoked.

#### Scenario: Packages are installed before app code runs

- **WHEN** `PythonRuntime.initialize(appCode, fsEntries, ['flask', 'requests'])` is called
- **THEN** Pyodide SHALL execute `import micropip; await micropip.install(['flask', 'requests'])` before executing `appCode`

#### Scenario: Empty packages list skips micropip

- **WHEN** `PythonRuntime.initialize(appCode, fsEntries, [])` is called
- **THEN** the runtime SHALL NOT call `micropip.install` and SHALL execute `appCode` directly

#### Scenario: Package installation failure surfaces as initialization error

- **WHEN** a package in the `packages` list does not exist in the Pyodide package index
- **THEN** `initialize()` SHALL reject with an error describing the failed package name
