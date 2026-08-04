## Purpose

Covers the Rust `virtual-fs` WASM module that holds a challenge's files: initialization parses the `chall-data` custom section payload, checks its magic header, recovers the AES-256 key internally by re-applying the XOR chain of compile-time masks, and fills an in-memory `FsStore` whose entries stay AES-GCM-256 encrypted under a fresh random 12-byte IV per write. It also covers the rest of that module's surface — decrypt-on-read, write, path listing (including `__app__`), and reset — plus the rule that no key is ever passed in from JavaScript and the consequence that an in-memory store re-initializes from the payload on every page load.

## MODIFIED Requirements

### Requirement: Rust WASM module encrypts and stores FS content in IndexedDB

A Rust WASM module (`wasm-fs`) SHALL provide functions to initialize, read, and write a virtual filesystem backed by an in-memory `HashMap` (`FsStore`). All data stored in the `FsStore` SHALL be encrypted with AES-GCM-256 using an internally-held 32-byte key (derived from the custom section at initialization) and a randomly generated 12-byte IV per write operation. The auth tag SHALL be stored alongside the ciphertext. The key SHALL NOT be accepted as an external parameter — it SHALL be derived internally from the WASM custom section `"chall-data"`.

> **Note:** IndexedDB persistence is planned for a future iteration. The current implementation uses in-memory storage only.

#### Scenario: File is stored encrypted in memory

- **WHEN** `wasm_fs_write(path, plaintext)` is called
- **THEN** the module SHALL encrypt `plaintext` with AES-GCM-256 using the internally-held key, generate a random IV, and store `{ iv, ciphertext, tag }` in the in-memory `FsStore` HashMap

#### Scenario: Stored content is not human-readable

- **WHEN** a developer inspects the `FsStore` HashMap entries programmatically
- **THEN** all values SHALL appear as encrypted binary data with no readable plaintext


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

### Requirement: FS content is decrypted on read and mounted into runtime memory

When a challenge initializes, the `wasm-fs` module SHALL populate the in-memory `FsStore` from the custom section payload and expose a synchronous virtual filesystem interface for the ASGI bridge and PHP runtime to use. Decrypted content SHALL reside only in WASM linear memory and SHALL NOT be exposed outside the module in plaintext.

#### Scenario: File is read and decrypted correctly

- **WHEN** `wasm_fs_read(path)` is called after initialization
- **THEN** the module SHALL return the original plaintext bytes using the internally-held key

#### Scenario: Uninitialized module rejects read

- **WHEN** `wasm_fs_read(path)` is called before `wasm_fs_init` has completed
- **THEN** the module SHALL return an error and SHALL NOT attempt decryption


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

### Requirement: FS is initialized from build-time encrypted blob

At challenge page load, the challenge framework SHALL call `wasm_fs_init(challenge_slug)`. The module SHALL read the `"chall-data"` custom section, verify the magic header, derive the AES-256 key by reversing the XOR chain with compile-time constants, and populate the in-memory `FsStore` with decrypted-then-re-encrypted entries. Since storage is in-memory, every page reload SHALL re-initialize from the custom section payload.

#### Scenario: Page load initializes FsStore from custom section

- **WHEN** a user visits a challenge page (including revisits and page reloads)
- **THEN** the `wasm-fs` module SHALL read the `"chall-data"` custom section, derive the key, decrypt the embedded FS entries, and write them to the in-memory `FsStore` (re-encrypted with the same key)

#### Scenario: Invalid custom section causes initialization error

- **WHEN** the `"chall-data"` custom section has invalid magic bytes or corrupted data
- **THEN** the module SHALL return an initialization error and SHALL NOT populate the `FsStore`


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

### Requirement: FS supports reset to initial state

The challenge framework SHALL expose a `resetFs()` function that deletes all IndexedDB entries for the current challenge and re-initializes from the custom section data. This allows a student to reset the challenge without refreshing the page.

#### Scenario: Reset restores original FS state

- **WHEN** a student calls `resetFs()` after modifying challenge state
- **THEN** all IndexedDB entries for that challenge SHALL be deleted and re-populated from the WASM custom section data

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

### Requirement: List all encrypted FS entry paths

The WASM virtual-fs module SHALL expose a `wasm_fs_list()` function that returns all entry paths currently stored in the `FsStore`. The function SHALL return a JSON-serialized array of strings. The `__app__` entry SHALL be included in the listing alongside all other paths.

#### Scenario: List entries after initialization

- **WHEN** `wasm_fs_init(slug, payload)` has been called successfully
- **AND** the payload contains entries `["__app__", "/flag.txt", "/data.json"]`
- **THEN** `wasm_fs_list()` SHALL return a JSON array containing exactly those three path strings

#### Scenario: List entries before initialization

- **WHEN** `wasm_fs_init` has NOT been called
- **THEN** `wasm_fs_list()` SHALL return an error indicating the FS is not initialized

#### Scenario: List reflects writes

- **WHEN** `wasm_fs_write("/new-file.txt", data)` is called after initialization
- **THEN** `wasm_fs_list()` SHALL include `"/new-file.txt"` in its result

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