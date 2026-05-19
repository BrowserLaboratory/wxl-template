## MODIFIED Requirements

### Requirement: Build script produces per-challenge WASM binary with embedded payload

The build script SHALL produce one `.wasm` file per challenge by copying `template.wasm` and injecting a WASM custom section named `"chall-data"` containing the challenge payload. The script SHALL regenerate `docs/public/challenge/<slug>/runtime.wasm` whenever the output file is missing, `--force` is provided, or any payload input is newer than the existing output. The tracked payload inputs SHALL include the challenge markdown/frontmatter, the referenced app source, scanned `src/` files, `.fsignore`, the flag file, and the template WASM.

#### Scenario: Missing output forces regeneration

- **WHEN** frontmatter already contains `wasmModule` but `docs/public/challenge/sqli-demo/runtime.wasm` is absent
- **THEN** the build script SHALL regenerate the per-challenge WASM file instead of skipping the challenge

#### Scenario: Source change forces regeneration

- **WHEN** `docs/challenge/sqli-demo/src/templates/index.html` is newer than the existing `runtime.wasm`
- **THEN** the build script SHALL regenerate `docs/public/challenge/sqli-demo/runtime.wasm`

#### Scenario: Unchanged inputs permit skipping

- **WHEN** every tracked payload input is older than the existing `runtime.wasm` and `--force` is not provided
- **THEN** the build script SHALL skip rebuilding that challenge

### Requirement: Post-build obfuscation pipeline strips symbols and applies mutations

After injecting the custom section, the build pipeline SHALL continue to strip symbols and apply mutations to the copied WASM output. Byte-identical reproducibility SHALL only be promised when the payload bytes, key material, and mutation seed are held constant. The default keygen flow SHALL generate fresh per-challenge key material and therefore SHALL only guarantee semantically equivalent output, not byte-identical output, across repeated runs.

#### Scenario: Fixed inputs remain reproducible

- **WHEN** the same template WASM, payload bytes, key material, and mutation seed are reused for the same challenge
- **THEN** the post-build obfuscation step SHALL produce byte-identical output

#### Scenario: Fresh key generation changes the output bytes

- **WHEN** the build script runs twice with fresh key generation enabled
- **THEN** the resulting per-challenge WASM files SHALL be allowed to differ at the byte level while preserving the same runtime behavior

### Requirement: Keygen skip logic verifies output file existence

The keygen script SHALL skip a challenge only when all of the following are true: the `wasmModule` frontmatter field is present and non-empty, the corresponding `runtime.wasm` output file exists, and the tracked payload inputs are unchanged since the last successful generation. If any tracked input changes, the script SHALL rebuild the challenge even when `runtime.wasm` already exists.

#### Scenario: Existing output with changed source is rebuilt

- **WHEN** `runtime.wasm` exists but the challenge markdown or any tracked `src/` file has changed since that output was written
- **THEN** the script SHALL rebuild the challenge instead of logging that it is already processed

#### Scenario: Force flag overrides skip logic

- **WHEN** the `--force` flag is provided
- **THEN** the script SHALL rebuild the challenge regardless of output existence or tracked input freshness
