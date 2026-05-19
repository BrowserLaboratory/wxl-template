## ADDED Requirements

### Requirement: Build script produces per-challenge WASM binary with embedded payload

The build script SHALL produce one `.wasm` file per challenge by copying `template.wasm` and injecting a WASM custom section named `"chall-data"` containing the challenge's encrypted FS entries, obfuscated key material, flag verifier hash, and metadata. The output SHALL be placed at `docs/public/challenge/<slug>/runtime.wasm`.

#### Scenario: Build produces per-challenge WASM file

- **WHEN** the build script processes a challenge with slug `sqli-demo`
- **THEN** it SHALL produce `docs/public/challenge/sqli-demo/runtime.wasm` containing a `"chall-data"` custom section with that challenge's encrypted data

#### Scenario: Each challenge gets an independent encryption key

- **WHEN** the build script processes multiple challenges
- **THEN** each challenge SHALL receive a randomly generated 32-byte AES-256 key, independent of all other challenges

#### Scenario: Template WASM is not modified

- **WHEN** the build script injects per-challenge data
- **THEN** the original `template.wasm` file SHALL remain unchanged; only the copied per-challenge `.wasm` file SHALL be modified

### Requirement: Custom section uses binary-packed format with magic header

The `"chall-data"` custom section SHALL use a binary format starting with magic bytes `"CHWD"`, followed by a version byte, challenge slug, obfuscated key material, flag verifier hash, encrypted FS entries, and JSON metadata. All multi-byte integers SHALL use little-endian encoding.

#### Scenario: Custom section starts with valid magic and version

- **WHEN** the WASM module reads its `"chall-data"` custom section
- **THEN** the first 4 bytes SHALL be `0x43 0x48 0x57 0x44` ("CHWD") and the 5th byte SHALL be the format version number

#### Scenario: Invalid magic causes initialization failure

- **WHEN** the WASM module reads a `"chall-data"` section with incorrect magic bytes
- **THEN** initialization SHALL fail with an error and SHALL NOT attempt decryption

### Requirement: Key material is obfuscated using XOR chain with compile-time constants

The build script SHALL obfuscate each challenge's AES-256 key by XOR-ing it with 3 compile-time constant masks (each 32 bytes) that are embedded in the template WASM's code section. The stored `key_material` in the custom section SHALL be `key XOR mask_a XOR mask_b XOR mask_c`. At runtime, the WASM module SHALL reverse the XOR chain to recover the original key.

#### Scenario: Key is not stored in plaintext in the custom section

- **WHEN** an attacker dumps the `"chall-data"` custom section from a challenge WASM binary
- **THEN** the key material bytes SHALL NOT match the actual AES-256 key used for encryption

#### Scenario: WASM module recovers the correct key at runtime

- **WHEN** the WASM module applies the 3 XOR masks to the stored key material
- **THEN** the recovered key SHALL successfully decrypt all FS entries without error

#### Scenario: XOR masks are embedded as Rust compile-time constants

- **WHEN** the template WASM is compiled
- **THEN** the 3 XOR masks SHALL exist as `const` values in the Rust source, compiled into the WASM code section (not the data section)

### Requirement: Post-build obfuscation pipeline strips symbols and applies mutations

After injecting the custom section, the build pipeline SHALL apply `wasm-mutate` with a per-challenge seed to produce semantically equivalent but structurally different WASM binaries. The template WASM SHALL be pre-processed with `wasm-strip` and `wasm-opt -O4` before being used as the template.

#### Scenario: Template WASM has no debug symbols

- **WHEN** `wasm2wat` is run on the template WASM
- **THEN** all function names SHALL appear as numeric indices (e.g., `$func0`) with no human-readable names

#### Scenario: Per-challenge WASM files have different binary structure

- **WHEN** `wasm-mutate` is applied to two different challenge WASM files with different seeds
- **THEN** the instruction sequences in the code section SHALL differ while producing identical runtime behavior

#### Scenario: Build is reproducible with same seed

- **WHEN** the build script runs twice for the same challenge with the same seed
- **THEN** the output WASM binary SHALL be byte-identical

### Requirement: Flag verification is performed inside WASM

The WASM module SHALL export a `wasm_verify_flag(flag_bytes) -> bool` function that computes `PBKDF2-HMAC-SHA256(flag, slug, iterations=100000)` and compares the result against the `flag_verifier` hash stored in the custom section. The comparison SHALL use constant-time equality.

#### Scenario: Correct flag returns true

- **WHEN** `wasm_verify_flag` is called with the correct flag bytes
- **THEN** the function SHALL return `true`

#### Scenario: Incorrect flag returns false

- **WHEN** `wasm_verify_flag` is called with incorrect flag bytes
- **THEN** the function SHALL return `false` without revealing timing information about which bytes matched

#### Scenario: Flag verifier hash is not accessible from JavaScript

- **WHEN** the challenge page is loaded
- **THEN** the `flag_verifier` hash SHALL NOT be present in any JavaScript variable, DOM element, or network response — it SHALL exist only in the WASM custom section
