## ADDED Requirements

### Requirement: CodeEditorPanel test suite is deterministic under full-suite vitest

The test fixtures in `tests/unit/components/CodeEditorPanel.test.ts` SHALL PASS deterministically when invoked via the project's full-suite vitest run (`pnpm test --run`) as well as in single-file isolation (`pnpm test --run tests/unit/components/CodeEditorPanel.test.ts`). The named scenarios below MUST NOT exhibit cross-file order sensitivity, microtask-timing flakiness, or assertions that depend on undefined Pyodide mock resolution order.

Assertion strength MUST be preserved when repairing these tests. Specifically:

- `expect(py.runPythonAsync).toHaveBeenCalled()` MUST NOT be weakened to a vacuously-true predicate.
- `expect(cb).toHaveBeenCalledTimes(1)` MUST remain an exact-count assertion (not `toHaveBeenCalled()`).
- `expect(arg.error).toBe(true)` MUST remain a strict equality on the boolean `true` (not `toBeTruthy()`).

#### Scenario: Run button invokes Pyodide runPythonAsync

- **WHEN** the user clicks the Run button on a mounted `CodeEditorPanel` whose Pyodide stub has resolved
- **THEN** the test `CodeEditorPanel > calls runPythonAsync when Run is clicked` SHALL PASS with `py.runPythonAsync` observably invoked at least once before assertion

#### Scenario: Unmount lifecycle disposes the CodeMirror editor

- **WHEN** a `CodeEditorPanel` is mounted and then unmounted within the full-suite vitest run
- **THEN** the test `CodeEditorPanel > destroys editor on unmount` SHALL PASS without depending on file execution order
- **AND** the test SHALL NOT exhibit pass-in-isolation / fail-in-full-suite flakiness

#### Scenario: Successful execution triggers onCodeExecuted exactly once

- **WHEN** Python code is executed successfully via the Run button while an `onCodeExecuted` prop is provided
- **THEN** the test `CodeEditorPanel > calls onCodeExecuted callback on successful execution` SHALL PASS with the callback invoked exactly once

#### Scenario: Exception path sets the error flag on the callback payload

- **WHEN** Python code execution raises an exception while an `onCodeExecuted` prop is provided
- **THEN** the test `CodeEditorPanel > calls onCodeExecuted with error flag on exception` SHALL PASS with the callback payload containing `error: true` (strict equality)

#### Scenario: Optional callback prop does not block execution

- **WHEN** `CodeEditorPanel` is mounted without an `onCodeExecuted` prop and the Run button is clicked
- **THEN** the test `CodeEditorPanel > works without onCodeExecuted prop (optional)` SHALL PASS with `py.runPythonAsync` observably invoked at least once

#### Scenario: Three consecutive full-suite runs all exit zero

- **WHEN** `pnpm test --run` is invoked three times in succession on a clean working tree
- **THEN** all three invocations SHALL exit 0
- **AND** none of the three runs SHALL report any failure in `tests/unit/components/CodeEditorPanel.test.ts`
