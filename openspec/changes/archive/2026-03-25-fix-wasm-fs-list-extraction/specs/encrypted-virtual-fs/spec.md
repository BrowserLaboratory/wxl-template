## ADDED Requirements

### Requirement: List all encrypted FS entry paths

The WASM virtual-fs module SHALL expose a `wasm_fs_list()` function that returns all entry paths currently stored in the `FsStore`. The function SHALL return a JSON-serialized array of strings. The `__app__` entry SHALL be included in the listing alongside all other paths.

#### Scenario: List entries after initialization

- **WHEN** `wasm_fs_init(slug, payload)` has been called successfully
- **AND** the payload contains entries `["__app__", "/flag.txt", "/data.json"]`
- **THEN** `wasm_fs_list()` SHALL return a JSON array containing exactly those three path strings

#### Scenario: List entries before initialization

- **WHEN** `wasm_fs_init` has NOT been called
- **THEN** `wasm_fs_list()` SHALL return an error indicating the FS is not initialized

#### Scenario: List reflects writes

- **WHEN** `wasm_fs_write("/new-file.txt", data)` is called after initialization
- **THEN** `wasm_fs_list()` SHALL include `"/new-file.txt"` in its result
