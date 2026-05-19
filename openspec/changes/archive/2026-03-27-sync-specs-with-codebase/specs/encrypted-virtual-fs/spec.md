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

---

### Requirement: FS content is decrypted on read and mounted into runtime memory

When a challenge initializes, the `wasm-fs` module SHALL populate the in-memory `FsStore` from the custom section payload and expose a synchronous virtual filesystem interface for the ASGI bridge and PHP runtime to use. Decrypted content SHALL reside only in WASM linear memory and SHALL NOT be exposed outside the module in plaintext.

#### Scenario: File is read and decrypted correctly

- **WHEN** `wasm_fs_read(path)` is called after initialization
- **THEN** the module SHALL return the original plaintext bytes using the internally-held key

#### Scenario: Uninitialized module rejects read

- **WHEN** `wasm_fs_read(path)` is called before `wasm_fs_init` has completed
- **THEN** the module SHALL return an error and SHALL NOT attempt decryption

---

### Requirement: FS is initialized from build-time encrypted blob

At challenge page load, the challenge framework SHALL call `wasm_fs_init(challenge_slug)`. The module SHALL read the `"chall-data"` custom section, verify the magic header, derive the AES-256 key by reversing the XOR chain with compile-time constants, and populate the in-memory `FsStore` with decrypted-then-re-encrypted entries. Since storage is in-memory, every page reload SHALL re-initialize from the custom section payload.

#### Scenario: Page load initializes FsStore from custom section

- **WHEN** a user visits a challenge page (including revisits and page reloads)
- **THEN** the `wasm-fs` module SHALL read the `"chall-data"` custom section, derive the key, decrypt the embedded FS entries, and write them to the in-memory `FsStore` (re-encrypted with the same key)

#### Scenario: Invalid custom section causes initialization error

- **WHEN** the `"chall-data"` custom section has invalid magic bytes or corrupted data
- **THEN** the module SHALL return an initialization error and SHALL NOT populate the `FsStore`

## REMOVED Requirements

### Requirement: ~~Subsequent visit skips re-initialization~~

> Removed: Since storage is in-memory (not IndexedDB), there are no persisted entries to detect. Every page load re-initializes from the custom section payload. The "skip re-initialization if IndexedDB already has entries" behavior is no longer applicable.

#### Scenario: Subsequent visit skips re-initialization

- **WHEN** a user revisits a challenge page where IndexedDB already contains entries
- **THEN** ~~the `wasm-fs` module SHALL skip custom section processing and use existing IndexedDB entries~~
