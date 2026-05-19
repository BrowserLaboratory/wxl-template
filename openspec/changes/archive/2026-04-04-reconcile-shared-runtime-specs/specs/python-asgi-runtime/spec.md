## MODIFIED Requirements

### Requirement: ASGI bridge translates HTTP requests to ASGI scope and invokes Pyodide app

The canonical Python request bridge SHALL be installed by `.vitepress/theme/composables/usePythonRuntime.ts` as inline Python executed inside Pyodide. The bridge SHALL inspect the loaded `app` object and choose WSGI translation for synchronous two-argument callables or ASGI translation for async applications. Rust code under `chall-wasm/asgi-bridge/` SHALL NOT be treated as the canonical challenge request translation path in the active runtime contract.

#### Scenario: Flask-style app receives a WSGI environ

- **WHEN** the loaded `app` is a synchronous two-argument callable and a `GET /users` request is handled
- **THEN** the runtime SHALL build a WSGI environ with `REQUEST_METHOD`, `PATH_INFO`, `QUERY_STRING`, and request headers mapped into `HTTP_*` keys before invoking the app

#### Scenario: FastAPI app receives an ASGI scope

- **WHEN** the loaded `app` is an async ASGI application and a `POST /login` request is handled
- **THEN** the runtime SHALL build an ASGI HTTP scope and provide `receive` and `send` callables that deliver the request body and collect response events

### Requirement: ASGI bridge collects response events and returns HTTP response

The inline bridge SHALL normalize both WSGI and ASGI execution results into a JSON response descriptor with `status`, `headers`, and a base64-encoded `body`. `PythonRuntime.handleRequest()` SHALL decode that descriptor into a JavaScript `Response`.

#### Scenario: WSGI response is normalized

- **WHEN** a Flask-style app calls `start_response('200 OK', [('Content-Type', 'text/plain')])` and returns body bytes
- **THEN** the runtime SHALL serialize a response descriptor with status `200`, the emitted headers, and a base64-encoded body

#### Scenario: ASGI body chunks are concatenated

- **WHEN** an ASGI app emits multiple `http.response.body` events with `more_body: true`
- **THEN** the bridge SHALL concatenate all body chunks before returning the final response descriptor

### Requirement: Runtime handles HTTP request dispatch

`PythonRuntime.handleRequest()` SHALL accept a browser-created `Request`, filter out `X-Wxlsh-*` transport headers before calling the bridge, convert `X-Wxlsh-Cookie` back into a real `cookie` header, and transport all `set-cookie` response headers back to JavaScript via a single `X-Wxlsh-Set-Cookie` response header.

#### Scenario: Cookie transport is restored before bridge invocation

- **WHEN** a request arrives with header `X-Wxlsh-Cookie: session_user=guest`
- **THEN** the bridge input SHALL include `cookie: session_user=guest` and SHALL NOT include any `x-wxlsh-*` headers

#### Scenario: Set-Cookie headers are transported back to JavaScript

- **WHEN** the bridge returns response headers containing two `set-cookie` entries
- **THEN** `PythonRuntime.handleRequest()` SHALL emit a JavaScript `Response` with `X-Wxlsh-Set-Cookie` containing the newline-joined cookie values and SHALL omit raw `set-cookie` headers
