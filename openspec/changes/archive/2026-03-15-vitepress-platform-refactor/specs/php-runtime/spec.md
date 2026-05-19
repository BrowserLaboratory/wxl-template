## ADDED Requirements

### Requirement: PHP runtime module resides in .vitepress/composables

The `PhpRuntime` class SHALL be implemented in `.vitepress/theme/composables/usePhpRuntime.ts` (renamed from `chall-wasm/php-bridge/php-runtime.ts`). All consumers (`.vitepress/sw/router.ts` and test files) SHALL import from the new path. The public API — `initialize(appCode: string, fsEntries: FsEntry[]): Promise<void>` and `handleRequest(request: Request): Promise<Response>` — SHALL remain unchanged.

#### Scenario: Runtime module is importable from .vitepress/composables

- **WHEN** `.vitepress/sw/router.ts` imports `PhpRuntime`
- **THEN** the import path SHALL be `.vitepress/theme/composables/usePhpRuntime` and the import SHALL resolve without error

#### Scenario: Existing runtime behavior is preserved after migration

- **WHEN** `PhpRuntime.handleRequest()` is called with an HTTP request after migration
- **THEN** it SHALL produce the same response as before the migration (verified by existing test suite passing)
