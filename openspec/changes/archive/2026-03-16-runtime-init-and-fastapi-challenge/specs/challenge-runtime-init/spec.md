## ADDED Requirements

### Requirement: Challenge page initializes WASM runtime on mount

When a challenge page mounts, the ChallengeLayout SHALL decrypt all FS entries using the `virtual-fs` WASM module, initialize the appropriate runtime (PythonRuntime or PhpRuntime), install micropip packages if specified, and establish a MessageChannel with the Service Worker. The runtime SHALL be initialized exactly once per page lifecycle.

#### Scenario: Python challenge runtime initializes on first mount

- **WHEN** a user navigates to a Python challenge page (`backend: flask` or `backend: fastapi`)
- **THEN** ChallengeLayout SHALL reconstruct the AES-GCM key from `fsKeyParts`, call `wasm_fs_init` with `encryptedFs` paths and blobs, call `wasm_fs_read` to decrypt each entry, call `PythonRuntime.initialize(appCode, fsEntries, packages)`, and display a loading state until initialization completes

#### Scenario: Runtime initialization is idempotent

- **WHEN** the same challenge page is already initialized and `initialize()` is called again
- **THEN** the runtime SHALL NOT re-load Pyodide or re-execute the app code

#### Scenario: Loading state is shown during initialization

- **WHEN** runtime initialization is in progress
- **THEN** the Send button in BrowserPanel SHALL be disabled and a loading indicator SHALL be visible

### Requirement: ChallengeLayout establishes MessageChannel with Service Worker

After runtime initialization, ChallengeLayout SHALL create a `MessageChannel`, send `port2` to the Service Worker via the `REGISTER_CHALLENGE` message as a transferable, and listen on `port1` for `HANDLE_REQUEST` messages.

#### Scenario: MessagePort is transferred to Service Worker at registration

- **WHEN** ChallengeLayout sends `REGISTER_CHALLENGE`
- **THEN** the message SHALL include `port: MessagePort` in the transferables list and the Service Worker SHALL receive and store it

#### Scenario: ChallengeLayout handles HANDLE_REQUEST and responds

- **WHEN** a `HANDLE_REQUEST` message arrives on `port1` from the Service Worker
- **THEN** ChallengeLayout SHALL reconstruct a `Request` from the serialized data, call `runtime.handleRequest(request)`, serialize the response `{ status, headers, body }`, and post it to `event.data.responsePort`

### Requirement: App code is decrypted from encryptedFs and executed

The app entrypoint is stored under the reserved key `__app__` in `encryptedFs`. The runtime SHALL decrypt this entry and execute it as the Python/PHP app code.

#### Scenario: App code is available after decryption

- **WHEN** the runtime decrypts the FS entries
- **THEN** the entry with key `__app__` SHALL contain the Python or PHP app code bytes, and the runtime SHALL execute it

#### Scenario: App code is not exposed to JavaScript

- **WHEN** `wasm_fs_read` returns the decrypted app code bytes
- **THEN** the bytes SHALL be passed directly to the runtime and SHALL NOT be stored in any JavaScript variable accessible from the global scope
