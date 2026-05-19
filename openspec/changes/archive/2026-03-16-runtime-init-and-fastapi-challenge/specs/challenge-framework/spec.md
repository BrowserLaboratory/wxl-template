## ADDED Requirements

### Requirement: Frontmatter supports optional packages field for micropip

Challenge frontmatter SHALL support an optional `packages` field containing an array of Python package names to install via micropip before the app runs. This field is optional; when absent, no additional packages are installed beyond those implied by `backend`.

#### Scenario: packages field is parsed and passed to runtime

- **WHEN** a challenge frontmatter contains `packages: ['requests', 'pyjwt']`
- **THEN** the VitePress plugin SHALL include `packages: ['requests', 'pyjwt']` in the processed challenge data available to the runtime

#### Scenario: Missing packages field defaults to empty

- **WHEN** a challenge frontmatter does not contain a `packages` field
- **THEN** the processed challenge data SHALL treat `packages` as an empty array `[]`

## MODIFIED Requirements

### Requirement: Frontmatter schema defines challenge metadata

Each challenge page SHALL declare its configuration via YAML frontmatter in its `.md` file. The frontmatter MUST include: `title`, `flag_verifier` (PBKDF2 hash of flag), `fs_key` (64-byte hex AES-GCM key), `backend` (one of `flask`, `fastapi`, `php`), `app` (relative path to app source file), and `fs` (map of virtual paths to local file paths or inline strings). Optional fields: `difficulty`, `category`, `description`, `source_visible` (boolean, default `false`), `packages` (array of strings, default `[]`).

#### Scenario: Valid Flask challenge frontmatter is parsed

- **WHEN** a `.md` file contains frontmatter with `backend: flask`, `app: ./app.py`, `fs: { /flag.txt: ./flag.txt }`, `flag_verifier: <hash>`, and `fs_key: <hex>`
- **THEN** the VitePress plugin SHALL extract all fields without error and make them available to the challenge page component

#### Scenario: Valid FastAPI challenge frontmatter with packages is parsed

- **WHEN** a `.md` file contains frontmatter with `backend: fastapi`, `packages: ['fastapi', 'anyio']`, and all required fields
- **THEN** the VitePress plugin SHALL extract `packages` as a string array and include it in the processed challenge data

## ADDED Requirements

### Requirement: Build plugin encrypts app source file and stores it under reserved key

During build-time processing, the VitePress challenge plugin SHALL read the local file referenced by the `app` frontmatter field, encrypt it with AES-GCM-256 using `fs_key`, and store the result in `encryptedFs` under the reserved virtual key `__app__`. This entry is in addition to all entries declared in the `fs` map.

#### Scenario: app file is included in encryptedFs at __app__ key

- **WHEN** a challenge has `app: ./sqli-demo/app.py` and `fs_key: <hex>`
- **THEN** `processChallengeFrontmatter` SHALL include `encryptedFs['__app__']` containing the AES-GCM-256 encrypted content of `./sqli-demo/app.py`

#### Scenario: __app__ key is separate from fs map entries

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and `app: ./app.py`
- **THEN** `encryptedFs` SHALL contain both `/flag.txt` (from `fs` map) and `__app__` (from `app` field), with no collision
