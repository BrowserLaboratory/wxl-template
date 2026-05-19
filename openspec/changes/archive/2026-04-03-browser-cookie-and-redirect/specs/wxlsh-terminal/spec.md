## ADDED Requirements

### Requirement: Python-backed commands receive parsed flags

When invoking Python-backed commands, the wxlsh executor SHALL convert the `flags` object to a plain JavaScript object before JSON-serializing it for Python. If `flags` is a JS `Map` (as produced by `serde_wasm_bindgen` for Rust `HashMap`), it SHALL be converted via `Object.fromEntries()`. This ensures `JSON.stringify(flags)` produces a populated object rather than `'{}'`.

#### Scenario: curl command with -H flag receives header value

- **WHEN** user runs `curl https://example.com -H "Cookie: session_user=guest"`
- **THEN** the Python `_cmd_curl` function SHALL receive `flags = {"H": "Cookie: session_user=guest"}` (not an empty dict)

#### Scenario: WASM parser Map flags are converted to plain object

- **WHEN** the WASM parser returns `flags` as a JS Map with entries `[["X", "POST"], ["H", "Content-Type: application/json"]]`
- **THEN** the executor SHALL convert it to `{"X": "POST", "H": "Content-Type: application/json"}` before passing to Python
