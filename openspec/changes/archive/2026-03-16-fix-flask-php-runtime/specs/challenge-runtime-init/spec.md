## MODIFIED Requirements

### Requirement: Challenge page initializes WASM runtime on mount

When a challenge page mounts, the ChallengeLayout SHALL decrypt all FS entries using the `virtual-fs` WASM module, initialize the appropriate runtime (PythonRuntime or PhpRuntime), install micropip packages if specified, and establish a MessageChannel with the Service Worker. The runtime SHALL be initialized exactly once per page lifecycle.

#### Scenario: Python challenge runtime initializes on first mount

- **WHEN** a user navigates to a Python challenge page (`backend: flask` or `backend: fastapi`)
- **THEN** ChallengeLayout SHALL reconstruct the AES-GCM key from `fsKeyParts`, call `wasm_fs_reset` with `encryptedFs` paths and blobs to clear any previous challenge data and load the current challenge's encrypted blobs, call `wasm_fs_read` to decrypt each entry, call `PythonRuntime.initialize(appCode, fsEntries, packages)`, and display a loading state until initialization completes

#### Scenario: WASM FS store is reset on each challenge mount

- **WHEN** a user navigates from one challenge page to another within the same SPA session
- **THEN** ChallengeLayout SHALL call `wasm_fs_reset` (not `wasm_fs_init`) so that the WASM store is cleared and repopulated with the current challenge's encrypted blobs before decryption

#### Scenario: Runtime initialization is idempotent

- **WHEN** the same challenge page is already initialized and `initialize()` is called again
- **THEN** the runtime SHALL NOT re-load Pyodide or re-execute the app code

#### Scenario: Loading state is shown during initialization

- **WHEN** runtime initialization is in progress
- **THEN** the Send button in BrowserPanel SHALL be disabled and a loading indicator SHALL be visible
