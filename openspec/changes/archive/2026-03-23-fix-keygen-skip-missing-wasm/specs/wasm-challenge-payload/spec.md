## ADDED Requirements

### Requirement: Keygen skip logic verifies output file existence

The keygen script SHALL skip a challenge only when BOTH conditions are met: (1) the `wasmModule` frontmatter field is present and non-empty, AND (2) the corresponding `runtime.wasm` output file exists on disk at `docs/public/challenge/<slug>/runtime.wasm`. If the frontmatter field is present but the output file is missing, the script SHALL re-process the challenge.

#### Scenario: CI environment with gitignored WASM files

- **WHEN** the keygen script runs in a CI environment where `wasmModule` is set in frontmatter but `docs/public/challenge/<slug>/runtime.wasm` does not exist on disk
- **THEN** the script SHALL re-process the challenge and produce the `runtime.wasm` file

#### Scenario: Local environment with existing WASM files

- **WHEN** the keygen script runs locally where both `wasmModule` frontmatter field and the corresponding `runtime.wasm` file exist
- **THEN** the script SHALL skip the challenge with a log message indicating it was already processed

#### Scenario: Force flag overrides skip logic

- **WHEN** the `--force` flag is provided
- **THEN** the script SHALL re-process the challenge regardless of frontmatter state or file existence
