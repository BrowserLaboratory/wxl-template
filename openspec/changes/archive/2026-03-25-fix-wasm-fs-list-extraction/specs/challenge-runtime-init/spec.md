## ADDED Requirements

### Requirement: Auto-extract all encrypted FS entries during runtime initialization

ChallengeLayout SHALL use `wasm_fs_list()` to enumerate all encrypted FS entries and extract every entry except `__app__` into the runtime virtual filesystem. The layout SHALL NOT depend on the frontmatter `fs` field for per-folder challenges.

If `wasm_fs_list` is not available (legacy WASM binary), the layout SHALL fall back to reading paths from the frontmatter `fs` field.

#### Scenario: Per-folder challenge with flag.txt

- **WHEN** a per-folder challenge's WASM payload contains `["__app__", "/flag.txt"]`
- **AND** the frontmatter does NOT have an `fs` field
- **THEN** ChallengeLayout SHALL call `wasm_fs_list()` to discover `/flag.txt`
- **AND** SHALL write `/flag.txt` to the runtime FS before executing the app code

#### Scenario: Multiple FS entries extracted

- **WHEN** a challenge's WASM payload contains `["__app__", "/flag.txt", "/data/users.json"]`
- **THEN** ChallengeLayout SHALL extract both `/flag.txt` and `/data/users.json` into the runtime FS

#### Scenario: Fallback to frontmatter fs field

- **WHEN** `wasm_fs_list` is not available as an export
- **AND** the frontmatter contains `fs: { "/flag.txt": "flag.txt" }`
- **THEN** ChallengeLayout SHALL use the frontmatter `fs` field to determine extraction paths
