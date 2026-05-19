## ADDED Requirements

### Requirement: Python ASGI runtime module resides in .vitepress/composables

The `PythonRuntime` class SHALL be implemented in `.vitepress/theme/composables/usePythonRuntime.ts` (renamed from `chall-wasm/python-bridge/python-runtime.ts`). All consumers (`.vitepress/sw/router.ts` and test files) SHALL import from the new path. The public API — `initialize(appCode: string, fsEntries: FsEntry[]): Promise<void>` and `handleRequest(request: Request): Promise<Response>` — SHALL remain unchanged.

#### Scenario: Runtime module is importable from .vitepress/composables

- **WHEN** `.vitepress/sw/router.ts` imports `PythonRuntime`
- **THEN** the import path SHALL be `.vitepress/theme/composables/usePythonRuntime` and the import SHALL resolve without error

#### Scenario: Existing runtime behavior is preserved after migration

- **WHEN** `PythonRuntime.handleRequest()` is called with an HTTP request after migration
- **THEN** it SHALL produce the same response as before the migration (verified by existing test suite passing)
