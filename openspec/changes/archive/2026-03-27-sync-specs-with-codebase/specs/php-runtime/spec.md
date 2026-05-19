## MODIFIED Requirements

### Requirement: PHP Runtime handles HTTP request method and body

The PHP Runtime SHALL populate PHP superglobals according to the incoming request: `$_GET` from query string, `$_POST` from form-encoded body, `$_SERVER['REQUEST_METHOD']` from HTTP method, and raw request body stored in `$GLOBALS['_RAW_INPUT']`. The raw body SHALL NOT be available via `php://input`.

#### Scenario: POST data is available in $_POST

- **WHEN** a POST request with `Content-Type: application/x-www-form-urlencoded` body arrives
- **THEN** `$_POST` SHALL contain the decoded key-value pairs

#### Scenario: Raw body is accessible via $GLOBALS['_RAW_INPUT']

- **WHEN** a POST request with `Content-Type: application/json` body arrives
- **THEN** `$GLOBALS['_RAW_INPUT']` SHALL contain the raw JSON string

---
### Requirement: PHP runtime module resides in .vitepress/composables

The `PhpRuntime.initialize()` method SHALL accept the following signature: `initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}): Promise<void>`. The `fsEntries` parameter SHALL be a `Record<string, Uint8Array>` mapping virtual paths to binary content.

#### Scenario: initialize called with fsEntries

- **WHEN** `PhpRuntime.initialize(appCode, { '/flag.txt': flagBytes })` is called
- **THEN** the runtime SHALL write `/flag.txt` into php-wasm's virtual filesystem and execute `appCode`

#### Scenario: initialize called with defaults

- **WHEN** `PhpRuntime.initialize(appCode)` is called without fsEntries
- **THEN** the runtime SHALL use an empty default and execute `appCode` without mounting additional files
