## MODIFIED Requirements

### Requirement: Frontmatter schema defines challenge metadata

Each challenge page SHALL declare its configuration via YAML frontmatter in its `.md` file. The required fields SHALL be `title`, `backend` (one of `flask`, `fastapi`, `php`), and `app` (a path relative to the challenge source root). Optional fields SHALL include `difficulty`, `category`, `description`, `source_visible` (default `false`), `packages` (default `[]`), `flag`, `tools` (default `[browser, network, repeater, code]` — the Terminal tab requires explicit opt-in), `commands`, and `wasmModule`. The `fs` field SHALL remain accepted only as a deprecated compatibility field during the `src/` auto-scan migration. The fields `fs_key`, `fsKeyParts`, `encryptedFs`, and `flag_verifier` SHALL NOT appear in frontmatter. The build pipeline SHALL populate `wasmModule` after successful per-challenge payload generation.

The `tools` default SHALL be applied by the challenge layout at render time, not injected by the config validator; the validated config SHALL carry `tools` as `undefined` when the field is absent.

#### Scenario: Minimal frontmatter passes validation

- **WHEN** a challenge page declares `title`, `backend`, and `app`
- **THEN** the challenge config validator SHALL accept the frontmatter and apply defaults to optional fields

#### Scenario: Absent tools field is preserved as undefined by the validator

- **WHEN** a challenge page omits the `tools` field
- **THEN** the validated config SHALL carry `tools` as `undefined`
- **AND** the rendered tab set SHALL be resolved from that absence by the challenge layout

#### Scenario: Deprecated fs field emits a compatibility warning

- **WHEN** a challenge page still declares the `fs` field
- **THEN** the validator SHALL accept the frontmatter and emit a warning that `fs` is deprecated in favor of `src/` auto-scan

#### Scenario: wasmModule is injected by the build pipeline

- **WHEN** the build pipeline processes challenge `sqli-demo`
- **THEN** the processed challenge data SHALL include `wasmModule: /challenge/sqli-demo/runtime.wasm`
