## MODIFIED Requirements

### Requirement: Frontmatter schema defines challenge metadata

Each challenge page SHALL declare its configuration via YAML frontmatter in its `.md` file. The required fields SHALL be `title`, `backend` (one of `flask`, `fastapi`, `php`), and `app` (a path relative to the challenge source root). Optional fields SHALL include `difficulty`, `category`, `description`, `source_visible` (default `false`), `packages` (default `[]`), `flag`, `tools`, `commands`, and `wasmModule`. The `fs` field SHALL remain accepted only as a deprecated compatibility field during the `src/` auto-scan migration. The fields `fs_key`, `fsKeyParts`, `encryptedFs`, and `flag_verifier` SHALL NOT appear in frontmatter. The build pipeline SHALL populate `wasmModule` after successful per-challenge payload generation.

#### Scenario: Minimal frontmatter passes validation

- **WHEN** a challenge page declares `title`, `backend`, and `app`
- **THEN** the challenge config validator SHALL accept the frontmatter and apply defaults to optional fields

#### Scenario: Deprecated fs field emits a compatibility warning

- **WHEN** a challenge page still declares the `fs` field
- **THEN** the validator SHALL accept the frontmatter and emit a warning that `fs` is deprecated in favor of `src/` auto-scan

#### Scenario: wasmModule is injected by the build pipeline

- **WHEN** the build pipeline processes challenge `sqli-demo`
- **THEN** the processed challenge data SHALL include `wasmModule: /challenge/sqli-demo/runtime.wasm`


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
source: reconcile-shared-runtime-specs
updated: 2026-04-04
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/composables/usePhpRuntime.ts
  - .agent/skills/spectra-debug/SKILL.md
  - .agent/skills/spectra-discuss/SKILL.md
  - .agent/skills/spectra-archive/SKILL.md
  - .agent/skills/spectra-ingest/SKILL.md
  - .agent/skills/spectra-apply/SKILL.md
  - .github/workflows/release.yml
  - .agent/skills/spectra-audit/SKILL.md
  - .agent/skills/spectra-propose/SKILL.md
  - .agent/skills/spectra-ask/SKILL.md
tests:
  - tests/unit/composables/usePhpRuntime-cookie.test.ts
  - tests/unit/scripts/challenge-keygen.test.ts
-->

### Requirement: VitePress plugin processes challenge frontmatter at build time

A VitePress plugin SHALL transform each challenge page by: reading referenced app source files, reading referenced FS content files, and delegating encryption and WASM payload generation to the build script. The plaintext flag SHALL NOT appear anywhere in build output. The plugin SHALL NOT embed encrypted FS blobs or key material into page hydration data.

#### Scenario: Black-box challenge app source is not in build output

- **WHEN** the plugin processes a challenge with `source_visible: false` (or omitted)
- **THEN** the app source file content SHALL NOT appear as readable plaintext in any HTML, JS, or JSON build output

#### Scenario: White-box challenge app source is embedded as plaintext

- **WHEN** the plugin processes a challenge with `source_visible: true` and `app: ./challenges/sqli/app.py`
- **THEN** the plugin SHALL embed the app source file as readable plaintext in build output, making it accessible to the challenge page's source viewer

#### Scenario: No encrypted data in HTML hydration output

- **WHEN** the plugin processes any challenge
- **THEN** the HTML build output SHALL NOT contain `encryptedFs`, `fsKeyParts`, `fs_key`, or `flag_verifier` in any form


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

### Requirement: Flag verification uses PBKDF2 without storing plaintext flag

The challenge framework SHALL verify submitted flags by calling the WASM export function `wasm_verify_flag(flag_bytes)` which internally computes `PBKDF2-HMAC-SHA256(submitted_flag, challenge_slug, iterations=100000)` and compares the result against the `flag_verifier` value stored in the WASM custom section. The comparison SHALL use a constant-time equality check. No flag-related hash SHALL exist in JavaScript-accessible storage.

#### Scenario: Correct flag is accepted

- **WHEN** a user submits the correct flag string
- **THEN** the system SHALL call `wasm_verify_flag` which returns `true`

#### Scenario: Incorrect flag is rejected

- **WHEN** a user submits an incorrect flag string
- **THEN** the system SHALL call `wasm_verify_flag` which returns `false` without revealing the correct flag or any timing information

#### Scenario: Flag verifier hash is not in JavaScript scope

- **WHEN** the challenge page initializes
- **THEN** `flag_verifier` SHALL NOT be accessible via `window`, `console`, any global JavaScript variable, DOM attributes, or HTML source — it SHALL exist only within the WASM custom section


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

### Requirement: Build plugin encrypts app source file and stores it under reserved key

During build-time processing, the build script SHALL read the local file referenced by the `app` frontmatter field, encrypt it with AES-GCM-256 using the per-challenge key, and include the result in the WASM custom section's FS entries under the reserved virtual key `__app__`. This entry is in addition to all entries declared in the `fs` map. Encryption SHALL be performed by the build script (not the VitePress plugin).

#### Scenario: app file is included in WASM custom section at __app__ key

- **WHEN** a challenge has `app: ./sqli-demo/app.py`
- **THEN** the build script SHALL encrypt the content of `./sqli-demo/app.py` and include it as the `__app__` entry in the WASM custom section's FS entries

#### Scenario: __app__ key is separate from fs map entries

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and `app: ./app.py`
- **THEN** the WASM custom section SHALL contain both `/flag.txt` (from `fs` map) and `__app__` (from `app` field), with no collision

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

