## Purpose

Covers what ChallengeLayout does when a challenge page mounts: fetching the per-challenge WASM binary named by `wasmModule`, calling `wasm_fs_init` with the slug, discovering FS entry paths through `wasm_fs_list` (falling back to the frontmatter `fs` field on legacy binaries that lack the export), writing every entry except `__app__` into the runtime filesystem, and executing the decrypted `__app__` bytes as the app code in the Python or PHP runtime. It also covers the readiness rules around that sequence — initialization happening once per page lifecycle, the loading state that disables the Send button, the four ways the `swReady` Service Worker gate can unlock, and the unmount/remount cycle that re-initializes the store on challenge-to-challenge navigation instead of an explicit `wasm_fs_reset`.

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

<!-- @trace
source: per-challenge-wasm-hardening
updated: 2026-03-23
code:
  - package.json
  - .vitepress/challenge/plugin.ts
  - .vitepress/challenge/crypto.ts
  - chall-wasm/virtual-fs/src/tests.rs
  - chall-wasm/virtual-fs/src/flag_verify.rs
  - .vitepress/theme/composables/useWasmLoader.ts
  - scripts/create-challenge.ts
  - .vitepress/challenge/config.ts
  - chall-wasm/virtual-fs/src/key_derive.rs
  - chall-wasm/virtual-fs/src/lib.rs
  - .vitepress/challenge/flag-verifier.ts
  - chall-wasm/virtual-fs/src/payload.rs
  - scripts/challenge-keygen.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - tests/__mocks__/virtual-fs.ts
tests:
  - tests/unit/challenge/plugin-obfuscation.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
  - tests/unit/challenge/plugin.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/challenge/flag-verifier.test.ts
  - tests/unit/challenge/flag-verifier-global.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
-->


<!-- @trace
source: fix-sw-ready-race-condition
updated: 2026-03-23
tests:
  - tests/unit/layouts/ChallengeLayout.test.ts
-->

### Requirement: App code is decrypted from encryptedFs and executed

The app entrypoint is stored as an encrypted FS entry under the reserved key `__app__` within the WASM custom section. The runtime SHALL call `wasm_fs_read("__app__")` to obtain the decrypted app code bytes and execute them as the Python/PHP app code.

#### Scenario: App code is available after WASM initialization

- **WHEN** the runtime calls `wasm_fs_read("__app__")` after `wasm_fs_init` has completed
- **THEN** the returned bytes SHALL contain the Python or PHP app code, and the runtime SHALL execute it

#### Scenario: App code is not exposed to JavaScript

- **WHEN** `wasm_fs_read` returns the decrypted app code bytes
- **THEN** the bytes SHALL be passed directly to the runtime and SHALL NOT be stored in any JavaScript variable accessible from the global scope

## Requirements

<!-- @trace
source: per-challenge-wasm-hardening
updated: 2026-03-23
code:
  - package.json
  - .vitepress/challenge/plugin.ts
  - .vitepress/challenge/crypto.ts
  - chall-wasm/virtual-fs/src/tests.rs
  - chall-wasm/virtual-fs/src/flag_verify.rs
  - .vitepress/theme/composables/useWasmLoader.ts
  - scripts/create-challenge.ts
  - .vitepress/challenge/config.ts
  - chall-wasm/virtual-fs/src/key_derive.rs
  - chall-wasm/virtual-fs/src/lib.rs
  - .vitepress/challenge/flag-verifier.ts
  - chall-wasm/virtual-fs/src/payload.rs
  - scripts/challenge-keygen.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - tests/__mocks__/virtual-fs.ts
tests:
  - tests/unit/challenge/plugin-obfuscation.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
  - tests/unit/challenge/plugin.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/challenge/flag-verifier.test.ts
  - tests/unit/challenge/flag-verifier-global.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
-->

### Requirement: Auto-extract all encrypted FS entries during runtime initialization

ChallengeLayout SHALL use `wasm_fs_list()` to enumerate all encrypted FS entries and extract every entry except `__app__` into the runtime virtual filesystem. The layout SHALL NOT depend on the frontmatter `fs` field for per-folder challenges.

If `wasm_fs_list` is not available (legacy WASM binary), the layout SHALL fall back to reading paths from the frontmatter `fs` field.

#### Scenario: Per-folder challenge with flag.txt

- **WHEN** a per-folder challenge's WASM payload contains `["__app__", "/flag.txt"]`
- **AND** the frontmatter does NOT have an `fs` field
- **THEN** ChallengeLayout SHALL call `wasm_fs_list()` to discover `/flag.txt`
- **AND** SHALL write `/flag.txt` to the runtime FS before executing the app code

#### Scenario: Multiple FS entries extracted

- **WHEN** a challenge's WASM payload contains `["__app__", "/flag.txt", "/data/users.json"]`
- **THEN** ChallengeLayout SHALL extract both `/flag.txt` and `/data/users.json` into the runtime FS

#### Scenario: Fallback to frontmatter fs field

- **WHEN** `wasm_fs_list` is not available as an export
- **AND** the frontmatter contains `fs: { "/flag.txt": "flag.txt" }`
- **THEN** ChallengeLayout SHALL use the frontmatter `fs` field to determine extraction paths

<!-- @trace
source: fix-wasm-fs-list-extraction
updated: 2026-03-25
code:
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - tests/__mocks__/virtual-fs.ts
  - chall-wasm/virtual-fs/Cargo.toml
-->