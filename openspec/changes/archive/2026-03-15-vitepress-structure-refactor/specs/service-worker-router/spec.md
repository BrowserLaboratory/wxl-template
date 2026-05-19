## ADDED Requirements

### Requirement: Service Worker source resides in .vitepress/workers/

The Service Worker router source file SHALL be located at `.vitepress/workers/router.ts` (renamed from `.vitepress/sw/router.ts`). The compiled output path (`docs/public/challenge-sw.js`) and all runtime behaviors SHALL remain unchanged. Any build scripts or import references that pointed to `.vitepress/sw/` SHALL be updated to `.vitepress/workers/`.

#### Scenario: Router test file imports from the new path

- **WHEN** the test suite at `tests/unit/workers/router.test.ts` imports the router module
- **THEN** the import SHALL resolve from `.vitepress/workers/router.ts` without error

#### Scenario: Compiled output is unaffected

- **WHEN** the service worker is compiled to `docs/public/challenge-sw.js`
- **THEN** the output file path and contents SHALL be identical to before the rename
