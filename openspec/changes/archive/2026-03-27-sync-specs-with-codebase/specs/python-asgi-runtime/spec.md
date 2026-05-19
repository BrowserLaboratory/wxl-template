## MODIFIED Requirements

### Requirement: ASGI bridge translates HTTP requests to ASGI scope and invokes Pyodide app

The ASGI bridge is implemented as inline Python code within Pyodide (in `usePythonRuntime.ts`), NOT as a Rust WASM module. The bridge SHALL accept an HTTP request descriptor `{ method, url, headers, body }` and construct a valid ASGI HTTP connection scope dict. It SHALL invoke the Pyodide-executed ASGI application callable with the scope, a `receive` callable that yields the request body, and a `send` callable that collects response events. The `chall-wasm/asgi-bridge/` Rust code exists but is used only for the custom section payload format, not for runtime ASGI bridging.

#### Scenario: GET request is translated to ASGI scope

- **WHEN** the ASGI bridge receives `{ method: "GET", url: "http://challenge-sqli.localhost/users", headers: {}, body: null }`
- **THEN** the bridge SHALL construct an ASGI scope with `type: "http"`, `method: "GET"`, `path: "/users"`, and the parsed query string, and invoke the Pyodide app callable

#### Scenario: POST request with body is forwarded

- **WHEN** the ASGI bridge receives a request with `method: "POST"` and a non-null body
- **THEN** the `receive` callable SHALL yield `{ type: "http.request", body: <bytes>, more_body: false }`

---
### Requirement: ASGI bridge collects response events and returns HTTP response

The ASGI bridge (implemented in inline Python within Pyodide) SHALL collect all `http.response.start` and `http.response.body` events emitted by the app's `send` callable, assemble them into a complete HTTP response descriptor `{ status, headers, body }`, and return it to the caller.

#### Scenario: Response is assembled from ASGI events

- **WHEN** the Pyodide app sends `http.response.start` with status 200 and headers, then `http.response.body` with body bytes
- **THEN** the bridge SHALL resolve with `{ status: 200, headers: [...], body: <bytes> }`

#### Scenario: Chunked response body is concatenated

- **WHEN** the Pyodide app sends multiple `http.response.body` events with `more_body: true`
- **THEN** all body chunks SHALL be concatenated before returning the final response

---
### Requirement: Python ASGI runtime module resides in .vitepress/composables

The `PythonRuntime` class SHALL be implemented in `.vitepress/theme/composables/usePythonRuntime.ts` (renamed from `chall-wasm/python-bridge/python-runtime.ts`). All consumers (`.vitepress/sw/router.ts` and test files) SHALL import from the new path. The public API — `initialize(appCode: string, fsEntries: Record<string, Uint8Array>, packages: string[]): Promise<void>` and `handleRequest(request: Request): Promise<Response>` — SHALL remain unchanged except for the `initialize()` signature update.

#### Scenario: Runtime module is importable from .vitepress/composables

- **WHEN** `.vitepress/sw/router.ts` imports `PythonRuntime`
- **THEN** the import path SHALL be `.vitepress/theme/composables/usePythonRuntime` and the import SHALL resolve without error

#### Scenario: Existing runtime behavior is preserved after migration

- **WHEN** `PythonRuntime.handleRequest()` is called with an HTTP request after migration
- **THEN** it SHALL produce the same response as before the migration (verified by existing test suite passing)

---
### Requirement: Python ASGI runtime installs micropip packages before app execution

The `PythonRuntime.initialize()` method SHALL accept the following signature: `initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}, packages: string[] = []): Promise<void>`. The `fsEntries` parameter SHALL be a `Record<string, Uint8Array>` mapping virtual paths to binary content. The `packages` parameter SHALL be an optional array of package names to install via micropip.

#### Scenario: initialize called with all parameters

- **WHEN** `PythonRuntime.initialize(appCode, { '/flag.txt': flagBytes }, ['fastapi', 'anyio'])` is called
- **THEN** the runtime SHALL mount `/flag.txt` into Pyodide MEMFS, install `fastapi` and `anyio` via micropip, and execute `appCode`

#### Scenario: initialize called with defaults

- **WHEN** `PythonRuntime.initialize(appCode)` is called without fsEntries or packages
- **THEN** the runtime SHALL use empty defaults and execute `appCode` without mounting files or installing packages
