## ADDED Requirements

### Requirement: Challenge runtime initializes once per challenge session

A challenge backend runtime SHALL load and initialize its execution engine and the challenge's app code exactly once per challenge session (not per request). The resulting application SHALL be cached and reused for all subsequent requests in that session. This applies to both the Python ASGI runtime (Pyodide) and the PHP runtime (php-wasm).

#### Scenario: Pyodide is loaded lazily on first challenge access

- **WHEN** a user navigates to a Python challenge page for the first time
- **THEN** Pyodide SHALL be loaded and `app_code` SHALL be executed to produce the ASGI app callable

#### Scenario: Subsequent Python requests reuse cached app

- **WHEN** a second request arrives for the same challenge session
- **THEN** Pyodide SHALL NOT be re-loaded and the cached app callable SHALL be invoked directly

#### Scenario: Repeated PHP requests reuse php-wasm instance

- **WHEN** a second HTTP request arrives for the same PHP challenge session
- **THEN** php-wasm SHALL NOT be re-initialized and the cached instance SHALL be used

### Requirement: Challenge runtime mounts the virtual filesystem before executing app code

Before executing the challenge's app code, the runtime SHALL mount all decrypted FS entries (obtained from `wasm-fs`) into the runtime's in-memory filesystem at the virtual paths defined in the challenge frontmatter. When writing FS entries, the runtime SHALL create parent directories before writing files so that nested source structures such as `src/templates/` are supported. Decrypted content SHALL be accessible only inside the runtime's sandboxed environment.

#### Scenario: /flag.txt is accessible from the Python app

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and the app reads `open('/flag.txt').read()`
- **THEN** the Python code SHALL receive the decrypted flag content

#### Scenario: /flag.txt is accessible from PHP

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and the PHP script reads `file_get_contents('/flag.txt')`
- **THEN** the PHP code SHALL receive the decrypted flag content

#### Scenario: FS mount does not expose content to JavaScript

- **WHEN** the FS is mounted into the runtime
- **THEN** the decrypted content SHALL only be accessible inside the runtime sandbox, not via JavaScript `window` or `globalThis`

#### Scenario: Nested FS entry path creates parent directories

- **WHEN** an FS entry has path `/templates/login.html`
- **THEN** the runtime SHALL create directory `/templates` before writing the file

### Requirement: Challenge runtime modules reside in .vitepress/theme/composables

Each challenge backend runtime SHALL be implemented as a composable under `.vitepress/theme/composables` (`usePythonRuntime.ts` for the Python ASGI runtime, the PHP runtime composable for PHP). Consumers such as `.vitepress/sw/router.ts` and test files SHALL import from these paths. The public runtime API SHALL remain stable across the migration from the former `chall-wasm/*-bridge/*-runtime.ts` locations.

#### Scenario: Python runtime is importable from .vitepress/composables

- **WHEN** `.vitepress/sw/router.ts` imports `PythonRuntime`
- **THEN** the import path SHALL be `.vitepress/theme/composables/usePythonRuntime` and the import SHALL resolve without error

#### Scenario: Existing runtime behavior is preserved after migration

- **WHEN** `PythonRuntime.handleRequest()` is called with an HTTP request after migration
- **THEN** it SHALL produce the same response as before the migration (verified by existing test suite passing)

### Requirement: Python ASGI runtime translates HTTP requests to WSGI/ASGI and invokes the app

The canonical Python request bridge SHALL be installed by `.vitepress/theme/composables/usePythonRuntime.ts` as inline Python executed inside Pyodide. The bridge SHALL inspect the loaded `app` object and choose WSGI translation for synchronous two-argument callables or ASGI translation for async applications. Rust code under `chall-wasm/asgi-bridge/` SHALL NOT be treated as the canonical challenge request translation path in the active runtime contract.

#### Scenario: Flask-style app receives a WSGI environ

- **WHEN** the loaded `app` is a synchronous two-argument callable and a `GET /users` request is handled
- **THEN** the runtime SHALL build a WSGI environ with `REQUEST_METHOD`, `PATH_INFO`, `QUERY_STRING`, and request headers mapped into `HTTP_*` keys before invoking the app

#### Scenario: FastAPI app receives an ASGI scope

- **WHEN** the loaded `app` is an async ASGI application and a `POST /login` request is handled
- **THEN** the runtime SHALL build an ASGI HTTP scope and provide `receive` and `send` callables that deliver the request body and collect response events

### Requirement: Python ASGI runtime collects response events and returns an HTTP response

The inline bridge SHALL normalize both WSGI and ASGI execution results into a JSON response descriptor with `status`, `headers`, and a base64-encoded `body`. `PythonRuntime.handleRequest()` SHALL decode that descriptor into a JavaScript `Response`.

#### Scenario: WSGI response is normalized

- **WHEN** a Flask-style app calls `start_response('200 OK', [('Content-Type', 'text/plain')])` and returns body bytes
- **THEN** the runtime SHALL serialize a response descriptor with status `200`, the emitted headers, and a base64-encoded body

#### Scenario: ASGI body chunks are concatenated

- **WHEN** an ASGI app emits multiple `http.response.body` events with `more_body: true`
- **THEN** the bridge SHALL concatenate all body chunks before returning the final response descriptor

### Requirement: Python ASGI runtime initialize installs micropip packages before app execution

The `PythonRuntime.initialize()` method SHALL accept the signature `initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}, packages: string[] = []): Promise<void>`. The `fsEntries` parameter SHALL map virtual paths to binary content. The `packages` parameter SHALL be an optional array of package names installed via micropip before app execution.

#### Scenario: initialize called with all parameters

- **WHEN** `PythonRuntime.initialize(appCode, { '/flag.txt': flagBytes }, ['fastapi', 'anyio'])` is called
- **THEN** the runtime SHALL mount `/flag.txt` into Pyodide MEMFS, install `fastapi` and `anyio` via micropip, and execute `appCode`

#### Scenario: initialize called with defaults

- **WHEN** `PythonRuntime.initialize(appCode)` is called without fsEntries or packages
- **THEN** the runtime SHALL use empty defaults and execute `appCode` without mounting files or installing packages

### Requirement: Python ASGI runtime handles cookie and header transport on request dispatch

`PythonRuntime.handleRequest()` SHALL accept a browser-created `Request`, filter out `X-Wxlsh-*` transport headers before calling the bridge, convert `X-Wxlsh-Cookie` back into a real `cookie` header, and transport all `set-cookie` response headers back to JavaScript via a single `X-Wxlsh-Set-Cookie` response header.

#### Scenario: Cookie transport is restored before bridge invocation

- **WHEN** a request arrives with header `X-Wxlsh-Cookie: session_user=guest`
- **THEN** the bridge input SHALL include `cookie: session_user=guest` and SHALL NOT include any `x-wxlsh-*` headers

#### Scenario: Set-Cookie headers are transported back to JavaScript

- **WHEN** the bridge returns response headers containing two `set-cookie` entries
- **THEN** `PythonRuntime.handleRequest()` SHALL emit a JavaScript `Response` with `X-Wxlsh-Set-Cookie` containing the newline-joined cookie values and SHALL omit raw `set-cookie` headers

### Requirement: Python ASGI runtime supports FastAPI apps with BASE_PACKAGES and the packages frontmatter

The Python ASGI runtime SHALL support FastAPI applications. `ChallengeLayout.vue` SHALL provide `BASE_PACKAGES` defaults (for fastapi: `['fastapi', 'anyio', 'sqlite3']`) that are always included when the backend is `fastapi`. If a `packages` field is present in frontmatter, its entries SHALL be added on top of the `BASE_PACKAGES` defaults. A working FastAPI demo challenge SHALL be provided at `docs/challenge/door-is-open/index.md` using a realistic vulnerability pattern suitable for a CTF context.

#### Scenario: FastAPI challenge page loads and renders correctly

- **WHEN** a user navigates to the FastAPI demo challenge page
- **THEN** the page SHALL display the challenge title, description, difficulty badge, and an interactive BrowserPanel with the default URL set to `https://challenge-door-is-open.localhost/`

#### Scenario: FastAPI challenge responds to HTTP requests

- **WHEN** a user sends a GET request to `https://challenge-door-is-open.localhost/`
- **THEN** the runtime SHALL return an HTTP response from the FastAPI app with status 200 and `Content-Type: application/json` or `text/html`

#### Scenario: FastAPI challenge uses BASE_PACKAGES defaults without packages frontmatter

- **WHEN** a FastAPI challenge's frontmatter does NOT contain a `packages` field
- **THEN** `ChallengeLayout.vue` SHALL provide `BASE_PACKAGES` defaults (`['fastapi', 'anyio', 'sqlite3']`) to the runtime initialization

#### Scenario: FastAPI challenge merges extra packages with BASE_PACKAGES

- **WHEN** a FastAPI challenge's frontmatter contains `packages: ['extra-lib']`
- **THEN** `ChallengeLayout.vue` SHALL merge the extra packages with `BASE_PACKAGES`, resulting in `['fastapi', 'anyio', 'sqlite3', 'extra-lib']` being passed to the runtime initialization

### Requirement: Python ASGI runtime E2E test mocks are complete

All E2E test mock objects for `PyodideInstance` SHALL implement every method defined in the `PyodideInstance` interface, including `runPythonAsync`, `loadPackage`, `FS.writeFile`, `globals.get`, and `globals.set`.

#### Scenario: Flask SQLi E2E test mock includes loadPackage

- **WHEN** `PythonRuntime.initialize()` is called with a mock Pyodide in the Flask SQLi E2E test
- **THEN** the mock SHALL provide a `loadPackage` method that resolves to `undefined`
- **AND** the initialization SHALL complete without TypeError

#### Scenario: Flask SQLi E2E test mock includes globals.set

- **WHEN** `PythonRuntime` accesses `pyodide.globals.set` during initialization
- **THEN** the mock SHALL provide a `globals.set` method as a no-op function

### Requirement: PHP runtime executes challenge PHP code via php-wasm with request context

The PHP runtime SHALL use `php-wasm` to execute challenge PHP code and SHALL prepare the supported request context before each run: `$_SERVER`, `$_GET`, `$_POST`, `$_COOKIE`, and `$GLOBALS['_RAW_INPUT']`. The adapter returned by `ChallengeLayout.vue` SHALL continue to expose `headers: string[]`, but those headers SHALL remain empty until `php-wasm` can surface `header()` output.

#### Scenario: Cookie-backed request context is visible to PHP code

- **WHEN** a request arrives with header `Cookie: session_user=guest`
- **THEN** the executed PHP app SHALL be able to read `$_COOKIE['session_user'] === 'guest'`

#### Scenario: header() output remains unavailable

- **WHEN** the executed PHP app calls `header('X-Test: 1')`
- **THEN** the runtime SHALL still return the response body and SHALL NOT rely on adapter-provided response headers

### Requirement: PHP runtime populates request superglobals from method and body

The PHP runtime SHALL populate `$_GET` from the request query string, `$_POST` from `application/x-www-form-urlencoded` POST bodies, `$_COOKIE` from the incoming `Cookie` header, and `$GLOBALS['_RAW_INPUT']` from the raw request body. `$_SERVER['REQUEST_METHOD']`, `$_SERVER['REQUEST_URI']`, and `$_SERVER['HTTP_HOST']` SHALL reflect the incoming request. If the same cookie name appears multiple times in the header, the last value encountered SHALL win. Non-form request bodies SHALL leave `$_POST` empty while preserving `_RAW_INPUT`.

#### Scenario: JSON request body does not populate $_POST

- **WHEN** a POST request with `Content-Type: application/json` body arrives
- **THEN** `$_POST` SHALL be empty and `$GLOBALS['_RAW_INPUT']` SHALL contain the raw JSON string

#### Scenario: Cookie header populates $_COOKIE

- **WHEN** a request arrives with `Cookie: theme=dark; session_user=guest`
- **THEN** `$_COOKIE['theme']` SHALL equal `dark` and `$_COOKIE['session_user']` SHALL equal `guest`

#### Scenario: Missing Cookie header yields an empty cookie map

- **WHEN** a request arrives without a `Cookie` header
- **THEN** the runtime SHALL initialize `$_COOKIE` as an empty array

### Requirement: PHP runtime initialize accepts app code and FS entries

The `PhpRuntime.initialize()` method SHALL accept the signature `initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}): Promise<void>`. The `fsEntries` parameter SHALL map virtual paths to binary content written into php-wasm's virtual filesystem before execution.

#### Scenario: initialize called with fsEntries

- **WHEN** `PhpRuntime.initialize(appCode, { '/flag.txt': flagBytes })` is called
- **THEN** the runtime SHALL write `/flag.txt` into php-wasm's virtual filesystem and execute `appCode`

#### Scenario: initialize called with defaults

- **WHEN** `PhpRuntime.initialize(appCode)` is called without fsEntries
- **THEN** the runtime SHALL use an empty default and execute `appCode` without mounting additional files
