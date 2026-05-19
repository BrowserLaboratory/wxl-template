## ADDED Requirements

### Requirement: E2E test mock completeness

All E2E test mock objects for `PyodideInstance` SHALL implement every method defined in the `PyodideInstance` interface, including `runPythonAsync`, `loadPackage`, `FS.writeFile`, `globals.get`, and `globals.set`.

#### Scenario: Flask SQLi E2E test mock includes loadPackage

- **WHEN** `PythonRuntime.initialize()` is called with a mock Pyodide in the Flask SQLi E2E test
- **THEN** the mock SHALL provide a `loadPackage` method that resolves to `undefined`
- **AND** the initialization SHALL complete without TypeError

#### Scenario: Flask SQLi E2E test mock includes globals.set

- **WHEN** `PythonRuntime` accesses `pyodide.globals.set` during initialization
- **THEN** the mock SHALL provide a `globals.set` method as a no-op function
