## MODIFIED Requirements

### Requirement: Challenge page initializes WASM runtime on mount

When a challenge page mounts, the ChallengeLayout SHALL load the per-challenge WASM binary specified by the `wasmModule` frontmatter field, call `wasm_fs_init(slug)` to initialize the virtual filesystem from the WASM custom section, decrypt all FS entries using the `virtual-fs` WASM module, initialize the appropriate runtime (PythonRuntime or PhpRuntime), install micropip packages if specified, and establish a MessageChannel with the Service Worker. The runtime SHALL be initialized exactly once per page lifecycle.

#### Scenario: Python challenge runtime initializes with per-challenge WASM

- **WHEN** a user navigates to a Python challenge page (`backend: flask` or `backend: fastapi`)
- **THEN** ChallengeLayout SHALL fetch and instantiate the per-challenge WASM binary from `wasmModule`, call `wasm_fs_init(slug)` (which internally derives the key from the custom section), call `wasm_fs_read(path)` to decrypt each entry (no external key parameter), call `PythonRuntime.initialize(appCode, fsEntries, packages)`, and display a loading state until initialization completes

#### Scenario: WASM FS store is reset on each challenge mount

- **WHEN** a user navigates from one challenge page to another within the same SPA session
- **THEN** ChallengeLayout SHALL load the new challenge's per-challenge WASM binary and call `wasm_fs_reset(slug)` so that the WASM store is cleared and repopulated from the new WASM's custom section data

#### Scenario: Runtime initialization is idempotent

- **WHEN** the same challenge page is already initialized and `initialize()` is called again
- **THEN** the runtime SHALL NOT re-load Pyodide or re-execute the app code

#### Scenario: Loading state is shown during initialization

- **WHEN** runtime initialization is in progress
- **THEN** the Send button in BrowserPanel SHALL be disabled and a loading indicator SHALL be visible

### Requirement: App code is decrypted from encryptedFs and executed

The app entrypoint is stored as an encrypted FS entry under the reserved key `__app__` within the WASM custom section. The runtime SHALL call `wasm_fs_read("__app__")` to obtain the decrypted app code bytes and execute them as the Python/PHP app code.

#### Scenario: App code is available after WASM initialization

- **WHEN** the runtime calls `wasm_fs_read("__app__")` after `wasm_fs_init` has completed
- **THEN** the returned bytes SHALL contain the Python or PHP app code, and the runtime SHALL execute it

#### Scenario: App code is not exposed to JavaScript

- **WHEN** `wasm_fs_read` returns the decrypted app code bytes
- **THEN** the bytes SHALL be passed directly to the runtime and SHALL NOT be stored in any JavaScript variable accessible from the global scope
