## MODIFIED Requirements

### Requirement: Frontmatter schema defines challenge metadata

Each challenge page SHALL declare its configuration via YAML frontmatter in its `.md` file. The frontmatter MUST include: `title`, `backend` (one of `flask`, `fastapi`, `php`), `app` (relative path to app source file), and `fs` (map of virtual paths to local file paths or inline strings). Optional fields: `difficulty`, `category`, `description`, `source_visible` (boolean, default `false`), `packages` (array of strings, default `[]`). The fields `fs_key`, `fsKeyParts`, `encryptedFs`, and `flag_verifier` SHALL NOT be present in frontmatter — these are now embedded in the per-challenge WASM binary. The build pipeline SHALL automatically generate and populate the `wasmModule` field pointing to the per-challenge WASM binary path.

#### Scenario: Valid Flask challenge frontmatter is parsed

- **WHEN** a `.md` file contains frontmatter with `backend: flask`, `app: ./app.py`, `fs: { /flag.txt: ./flag.txt }`, and `title: SQL Injection Demo`
- **THEN** the VitePress plugin SHALL extract all fields without error and make them available to the challenge page component

#### Scenario: Valid FastAPI challenge frontmatter with packages is parsed

- **WHEN** a `.md` file contains frontmatter with `backend: fastapi`, `packages: ['fastapi', 'anyio']`, and all required fields
- **THEN** the VitePress plugin SHALL extract `packages` as a string array and include it in the processed challenge data

#### Scenario: Frontmatter containing legacy key fields causes build warning

- **WHEN** a `.md` file's frontmatter contains `fs_key`, `fsKeyParts`, `encryptedFs`, or `flag_verifier`
- **THEN** the VitePress plugin SHALL emit a build warning indicating these fields are deprecated and ignored

#### Scenario: wasmModule field is auto-populated by build pipeline

- **WHEN** the build pipeline processes a challenge with slug `sqli-demo`
- **THEN** the processed challenge data SHALL include `wasmModule: /challenge/sqli-demo/runtime.wasm`

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

### Requirement: Build plugin encrypts app source file and stores it under reserved key

During build-time processing, the build script SHALL read the local file referenced by the `app` frontmatter field, encrypt it with AES-GCM-256 using the per-challenge key, and include the result in the WASM custom section's FS entries under the reserved virtual key `__app__`. This entry is in addition to all entries declared in the `fs` map. Encryption SHALL be performed by the build script (not the VitePress plugin).

#### Scenario: app file is included in WASM custom section at __app__ key

- **WHEN** a challenge has `app: ./sqli-demo/app.py`
- **THEN** the build script SHALL encrypt the content of `./sqli-demo/app.py` and include it as the `__app__` entry in the WASM custom section's FS entries

#### Scenario: __app__ key is separate from fs map entries

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and `app: ./app.py`
- **THEN** the WASM custom section SHALL contain both `/flag.txt` (from `fs` map) and `__app__` (from `app` field), with no collision
