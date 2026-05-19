## MODIFIED Requirements

### Requirement: Challenge page initializes WASM runtime on mount

When a challenge page mounts, the ChallengeLayout SHALL load the per-challenge WASM binary specified by the `wasmModule` frontmatter field, call `wasm_fs_init(slug)` to initialize the virtual filesystem from the WASM custom section, decrypt all FS entries using the `virtual-fs` WASM module, initialize the appropriate runtime (PythonRuntime or PhpRuntime), install micropip packages if specified, and establish a MessageChannel with the Service Worker. The runtime SHALL be initialized exactly once per page lifecycle.

When navigating between challenges, the component unmounts and remounts, triggering a fresh `wasm_fs_init` with the new slug. This unmount/remount cycle is sufficient to clear and repopulate the WASM store; an explicit `wasm_fs_reset(slug)` call is NOT required.

The `swReady` readiness gate SHALL be unlocked (`true`) when any of the following conditions are met:
1. `navigator.serviceWorker.controller` is non-null at component setup time
2. `navigator.serviceWorker.controller` is non-null when `onMounted` executes (fallback for missed `controllerchange` events)
3. `navigator.serviceWorker.ready` resolves and `controller` is non-null (first-visit fallback)
4. A `controllerchange` event fires after the listener is attached

#### Scenario: Python challenge runtime initializes with per-challenge WASM

- **WHEN** a user navigates to a Python challenge page (`backend: flask` or `backend: fastapi`)
- **THEN** ChallengeLayout SHALL fetch and instantiate the per-challenge WASM binary from `wasmModule`, call `wasm_fs_init(slug)` (which internally derives the key from the custom section), call `wasm_fs_read(path)` to decrypt each entry (no external key parameter), call `PythonRuntime.initialize(appCode, fsEntries, packages)`, and display a loading state until initialization completes

#### Scenario: Component unmount/remount resets WASM FS state

- **WHEN** a user navigates from one challenge page to another within the same SPA session
- **THEN** ChallengeLayout SHALL unmount the old challenge component and remount a new one, which triggers a fresh `wasm_fs_init(slug)` with the new challenge's WASM binary, without requiring an explicit `wasm_fs_reset` call

#### Scenario: Runtime initialization is idempotent

- **WHEN** the same challenge page is already initialized and `initialize()` is called again
- **THEN** the runtime SHALL NOT re-load Pyodide or re-execute the app code

#### Scenario: Loading state is shown during initialization

- **WHEN** runtime initialization is in progress
- **THEN** the Send button in BrowserPanel SHALL be disabled and a loading indicator SHALL be visible

#### Scenario: swReady unlocks when controllerchange fires before listener is attached

- **WHEN** the Service Worker activates and calls `clients.claim()` between `setup()` and `onMounted()`
- **THEN** the `onMounted` fallback SHALL detect `navigator.serviceWorker.controller` is non-null and set `swReady` to `true`

#### Scenario: swReady unlocks on first visit via ready promise

- **WHEN** the Service Worker has not yet been installed (first visit) and `navigator.serviceWorker.controller` is `null` at mount time
- **THEN** ChallengeLayout SHALL wait for `navigator.serviceWorker.ready` to resolve, then check `controller` and set `swReady` to `true` once available
