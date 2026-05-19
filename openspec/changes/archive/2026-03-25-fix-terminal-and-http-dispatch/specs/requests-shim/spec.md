## MODIFIED Requirements

### Requirement: Monkey-patch HTTPAdapter.send for dispatch bridge

The system SHALL monkey-patch `requests.adapters.HTTPAdapter.send()` to route all HTTP requests through the async JS dispatch bridge instead of attempting socket connections or synchronous XMLHttpRequest. The dispatch bridge function SHALL be injected into Pyodide globals as `_wxlsh_dispatch_bridge` before the monkey-patch is applied. Because `HTTPAdapter.send()` is a synchronous API but the JS bridge is async, `_patched_send` SHALL use `pyodide.ffi.run_sync()` to synchronously resolve the JS Promise returned by the bridge, then convert the result back to a `requests.Response` object.

#### Scenario: requests.get routes through async dispatch bridge

- **WHEN** user executes `requests.get('https://challenge-<slug>.localhost/api')` in Code Editor
- **THEN** the request SHALL be routed through the async JS dispatch bridge function (NOT synchronous XMLHttpRequest)
- **AND** the response SHALL be returned as a standard `requests.Response` object with correct `status_code`, `text`, `headers`, and `json()` method

#### Scenario: Full requests API compatibility

- **WHEN** user uses requests features including Session, cookies, auth, headers, and redirect following
- **THEN** all features work as expected because only the transport layer is patched; all higher-level requests logic remains native

#### Scenario: Dispatch bridge not available

- **WHEN** `_wxlsh_dispatch_bridge` is not set in Pyodide globals
- **THEN** `_patched_send` SHALL raise a `ConnectionError` with a descriptive message indicating the bridge is not initialized
