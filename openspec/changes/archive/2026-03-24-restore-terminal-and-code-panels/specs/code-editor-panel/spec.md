## ADDED Requirements

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
