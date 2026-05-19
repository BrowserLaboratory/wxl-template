## MODIFIED Requirements

### Requirement: Rust WASM module encrypts and stores FS content in IndexedDB

A Rust WASM module (`wasm-fs`) SHALL provide functions to initialize, read, and write a virtual filesystem backed by IndexedDB. All data written to IndexedDB SHALL be encrypted with AES-GCM-256 using an internally-held 32-byte key (derived from the custom section at initialization) and a randomly generated 12-byte IV per write operation. The auth tag SHALL be stored alongside the ciphertext. The key SHALL NOT be accepted as an external parameter — it SHALL be derived internally from the WASM custom section `"chall-data"`.

#### Scenario: File is stored encrypted

- **WHEN** `wasm_fs_write(path, plaintext)` is called
- **THEN** the module SHALL encrypt `plaintext` with AES-GCM-256 using the internally-held key, generate a random IV, and store `{ iv, ciphertext, tag }` in IndexedDB under the challenge's store name

#### Scenario: IndexedDB content is not human-readable

- **WHEN** a user opens DevTools > Application > IndexedDB and inspects the challenge store
- **THEN** all values SHALL appear as binary blobs with no readable plaintext

### Requirement: FS content is decrypted on read and mounted into runtime memory

When a challenge initializes, the `wasm-fs` module SHALL read all encrypted entries from IndexedDB, decrypt them using the internally-held key (derived from the custom section), and expose a synchronous virtual filesystem interface for the ASGI bridge and PHP runtime to use. Decrypted content SHALL reside only in WASM linear memory and SHALL NOT be written back to IndexedDB in plaintext.

#### Scenario: File is read and decrypted correctly

- **WHEN** `wasm_fs_read(path)` is called after initialization
- **THEN** the module SHALL return the original plaintext bytes using the internally-held key

#### Scenario: Uninitialized module rejects read

- **WHEN** `wasm_fs_read(path)` is called before `wasm_fs_init` has completed
- **THEN** the module SHALL return an error and SHALL NOT attempt decryption

### Requirement: FS is initialized from build-time encrypted blob

At challenge page load, the challenge framework SHALL call `wasm_fs_init(challenge_slug)`. The module SHALL read the `"chall-data"` custom section, verify the magic header, derive the AES-256 key by reversing the XOR chain with compile-time constants, and populate IndexedDB with decrypted-then-re-encrypted entries. If IndexedDB already contains entries for `challenge_slug`, it SHALL skip re-initialization.

#### Scenario: First visit initializes IndexedDB from custom section

- **WHEN** a user visits a challenge page for the first time
- **THEN** the `wasm-fs` module SHALL read the `"chall-data"` custom section, derive the key, decrypt the embedded FS entries, and write them to IndexedDB (re-encrypted with the same key)

#### Scenario: Subsequent visit skips re-initialization

- **WHEN** a user revisits a challenge page where IndexedDB already contains entries
- **THEN** the `wasm-fs` module SHALL skip custom section processing and use existing IndexedDB entries

#### Scenario: Invalid custom section causes initialization error

- **WHEN** the `"chall-data"` custom section has invalid magic bytes or corrupted data
- **THEN** the module SHALL return an initialization error and SHALL NOT populate IndexedDB

### Requirement: FS supports reset to initial state

The challenge framework SHALL expose a `resetFs()` function that deletes all IndexedDB entries for the current challenge and re-initializes from the custom section data. This allows a student to reset the challenge without refreshing the page.

#### Scenario: Reset restores original FS state

- **WHEN** a student calls `resetFs()` after modifying challenge state
- **THEN** all IndexedDB entries for that challenge SHALL be deleted and re-populated from the WASM custom section data
