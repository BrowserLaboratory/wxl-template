## Purpose

Covers the per-challenge `runtime.wasm` emitted by the `scripts/challenge-keygen.ts` build script: AES-GCM-encrypted challenge files, XOR-masked key material, and a PBKDF2 flag verifier packed into a `CHWD`-magic `chall-data` custom section appended to a copy of the template module, which the pipeline then mutates with a per-challenge seed. Also covers the module's `wasm_verify_flag` export, which checks a submitted flag inside WASM so the verifier hash never reaches JavaScript, and the input-freshness conditions under which keygen rebuilds or skips a challenge.

## ADDED Requirements

<!-- Build script produces per-challenge WASM binary with embedded payload — moved to canonical location below -->

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

<!-- Custom section uses binary-packed format with magic header — moved to canonical location below -->

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

<!-- Key material is obfuscated using XOR chain with compile-time constants — moved to canonical location below -->

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

<!-- Post-build obfuscation pipeline strips symbols and applies mutations — moved to canonical location below -->

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

<!-- Flag verification is performed inside WASM — moved to canonical location below -->

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


<!-- @trace
source: harden-wasm-challenge-payload-pipeline
updated: 2026-04-04
code:
  - .agent/skills/spectra-apply/SKILL.md
  - .agent/skills/spectra-archive/SKILL.md
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agent/skills/spectra-ingest/SKILL.md
  - .agent/skills/spectra-discuss/SKILL.md
  - .agent/skills/spectra-propose/SKILL.md
  - .agent/skills/spectra-debug/SKILL.md
  - .github/workflows/release.yml
  - .agent/skills/spectra-ask/SKILL.md
  - .agent/skills/spectra-audit/SKILL.md
tests:
  - tests/unit/scripts/challenge-keygen.test.ts
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
-->

---
### Requirement: Custom section uses binary-packed format with magic header

The `"chall-data"` custom section SHALL use a binary format starting with magic bytes `"CHWD"`, followed by a version byte, challenge slug, obfuscated key material, flag verifier hash, encrypted FS entries, and JSON metadata. All multi-byte integers SHALL use little-endian encoding.

#### Scenario: Custom section starts with valid magic and version

- **WHEN** the WASM module reads its `"chall-data"` custom section
- **THEN** the first 4 bytes SHALL be `0x43 0x48 0x57 0x44` ("CHWD") and the 5th byte SHALL be the format version number

#### Scenario: Invalid magic causes initialization failure

- **WHEN** the WASM module reads a `"chall-data"` section with incorrect magic bytes
- **THEN** initialization SHALL fail with an error and SHALL NOT attempt decryption

---
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

---
### Requirement: Post-build obfuscation pipeline strips symbols and applies mutations

The build pipeline SHALL run its obfuscation passes in this order:

1. **Strip and optimise.** The pipeline SHALL run `wasm-tools strip` over the compiled `wasm-pack` output, SHALL run `wasm-opt -O4` over the stripped result, and SHALL stage the outcome as `template.wasm`. This stage SHALL complete before any `"chall-data"` section is injected.
2. **Inject.** The pipeline SHALL copy `template.wasm` and append the `"chall-data"` custom section to that copy.
3. **Mutate.** The pipeline SHALL run `wasm-tools mutate` with a per-challenge seed over the injected copy.

The pipeline SHALL NOT run a strip pass after stage 2, over either the injected copy or any per-challenge output. Stripping after injection destroys the payload: the pipeline's `wasm-tools strip` invocation does not pass `--all`, and a default strip run removes the `"chall-data"` custom section from the artifact it was just handed.

Byte-identical reproducibility SHALL only be promised when the payload bytes, key material, and mutation seed are held constant. The default keygen flow SHALL generate fresh per-challenge key material and therefore SHALL only guarantee semantically equivalent output, not byte-identical output, across repeated runs.

`wasm-tools strip`, `wasm-opt`, and `wasm-tools mutate` SHALL each be optional at build time. When a tool is absent from `PATH`, the pipeline SHALL emit a warning naming the pass it is skipping and SHALL continue: for `wasm-tools strip` by staging the `wasm-pack` output as `template.wasm` unchanged, for `wasm-opt` by keeping the stripped result, and for `wasm-tools mutate` by keeping the injected output. A `wasm-opt` run that exits non-zero or yields an unusable result SHALL be discarded with a warning and SHALL leave the stripped result intact; a failed `wasm-tools mutate` run SHALL leave the injected output in place with a warning.

Tool absence SHALL NOT be conflated with a corrupt strip result. When `wasm-tools strip` runs but writes a file that is shorter than the 8-byte module header, does not begin with the WASM magic bytes, or is less than half the size of its input, the pipeline SHALL abort with an error identifying the pass instead of continuing.

#### Scenario: Strip precedes injection

- **WHEN** the pipeline appends `"chall-data"` to a copy of `template.wasm`
- **THEN** the strip and optimise passes SHALL already have completed
- **AND** no further strip pass SHALL run over that copy, so the shipped `runtime.wasm` SHALL still contain its `"chall-data"` custom section

#### Scenario: Fixed inputs remain reproducible

- **WHEN** the same template WASM, payload bytes, key material, and mutation seed are reused for the same challenge
- **THEN** the post-build obfuscation step SHALL produce byte-identical output

#### Scenario: Fresh key generation changes the output bytes

- **WHEN** the build script runs twice with fresh key generation enabled
- **THEN** the resulting per-challenge WASM files SHALL be allowed to differ at the byte level while preserving the same runtime behavior

#### Scenario: A missing tool degrades to a warning

- **WHEN** `wasm-tools` or `wasm-opt` is absent from `PATH` during a build
- **THEN** the pipeline SHALL emit a warning for each pass that tool provides — `wasm-strip` and `wasm-mutate` for `wasm-tools`, optimization for `wasm-opt` — and SHALL continue to a successful build

#### Scenario: Corrupt strip output aborts the build

- **WHEN** the strip pass exits successfully but writes a file that is shorter than the 8-byte module header, lacks the WASM magic bytes, or is less than half the size of its input
- **THEN** the pipeline SHALL abort with an error identifying the pass and SHALL NOT proceed to injection

---
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

---
### Requirement: Keygen skip logic verifies output file existence

The keygen script SHALL skip a challenge only when all of the following are true: the `wasmModule` frontmatter field is present and non-empty, the corresponding `runtime.wasm` output file exists, and the tracked payload inputs are unchanged since the last successful generation. If any tracked input changes, the script SHALL rebuild the challenge even when `runtime.wasm` already exists.

#### Scenario: Existing output with changed source is rebuilt

- **WHEN** `runtime.wasm` exists but the challenge markdown or any tracked `src/` file has changed since that output was written
- **THEN** the script SHALL rebuild the challenge instead of logging that it is already processed

#### Scenario: Force flag overrides skip logic

- **WHEN** the `--force` flag is provided
- **THEN** the script SHALL rebuild the challenge regardless of output existence or tracked input freshness

<!-- @trace
source: harden-wasm-challenge-payload-pipeline
updated: 2026-04-04
code:
  - .agent/skills/spectra-apply/SKILL.md
  - .agent/skills/spectra-archive/SKILL.md
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agent/skills/spectra-ingest/SKILL.md
  - .agent/skills/spectra-discuss/SKILL.md
  - .agent/skills/spectra-propose/SKILL.md
  - .agent/skills/spectra-debug/SKILL.md
  - .github/workflows/release.yml
  - .agent/skills/spectra-ask/SKILL.md
  - .agent/skills/spectra-audit/SKILL.md
tests:
  - tests/unit/scripts/challenge-keygen.test.ts
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
-->
