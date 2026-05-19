## ADDED Requirements

### Requirement: Runtime handles HTTP request dispatch

The PythonRuntime.handleRequest() method SHALL read `X-Wxlsh-Cookie` from the incoming request headers and convert it to a standard `cookie` header in the ASGI scope. All `X-Wxlsh-*` headers SHALL be filtered out before passing to the ASGI bridge.

For response headers, the runtime SHALL collect all `set-cookie` headers from the ASGI response and transport them via a single `X-Wxlsh-Set-Cookie` header (newline-separated for multiple values) on the JS Response object. This bypasses the Fetch API restriction that silently drops `Set-Cookie` on programmatically constructed Response objects.

#### Scenario: Cookie header transport from browser to ASGI app

- **WHEN** a request arrives with header `X-Wxlsh-Cookie: session_user=guest`
- **THEN** the ASGI scope headers SHALL include `(b'cookie', b'session_user=guest')` and SHALL NOT include any `x-wxlsh-*` headers

#### Scenario: Set-Cookie header transport from ASGI app to browser

- **WHEN** the ASGI app sends an `http.response.start` event with header `(b'set-cookie', b'token=abc; Path=/')`
- **THEN** the JS Response SHALL include header `X-Wxlsh-Set-Cookie: token=abc; Path=/` and SHALL NOT include a `set-cookie` header

### Requirement: Runtime initializes virtual filesystem from encrypted entries

When writing FS entries to the Pyodide filesystem, the runtime SHALL create parent directories (via `FS.mkdir()`) before writing files. This enables challenge source structures with subdirectories such as `src/templates/`.

#### Scenario: FS entry with nested path

- **WHEN** an FS entry has path `/templates/login.html`
- **THEN** the runtime SHALL create directory `/templates` before writing the file
