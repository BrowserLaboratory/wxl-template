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
