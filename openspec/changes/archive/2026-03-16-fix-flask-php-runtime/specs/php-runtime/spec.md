## MODIFIED Requirements

### Requirement: PHP Runtime executes challenge PHP code via php-wasm

The PHP Runtime SHALL use the existing `php-wasm` package (v0.0.8) to execute PHP challenge app code. The runtime SHALL be encapsulated in a `PhpRuntime` class that abstracts the php-wasm API version, enabling future upgrades without changes to the Service Worker.

`ChallengeLayout.vue` SHALL provide a `LoadPhpFn` callback to `PhpRuntime` that dynamically imports `php-wasm/PhpWeb.mjs`, instantiates a `PhpWeb` object, waits for the Emscripten binary to be ready, and returns a `PhpInstance`-compatible adapter. The adapter SHALL:

1. Capture stdout output by attaching an `output` event listener before calling `PhpWeb.run()` and removing it after resolution
2. Provide a `writeFile(path, data)` method that delegates to the Emscripten FS (`phpBinary.FS.writeFile`)
3. Return `{ output: string, headers: string[], exitCode: number }` where `headers` is always an empty array (php-wasm does not expose PHP `header()` calls)

#### Scenario: PHP script is executed and response is returned

- **WHEN** the Service Worker dispatches a request with `backend: php` to the PHP Runtime
- **THEN** the `PhpRuntime` class SHALL set up PHP superglobals (`$_SERVER`, `$_GET`, `$_POST`, `$_COOKIE`), execute the app's PHP file, capture the stdout output via the `output` event, and return it as the response body

#### Scenario: PHP challenge page loads without runtime error

- **WHEN** a user navigates to a PHP challenge page
- **THEN** the runtime SHALL initialize successfully (no "PHP runtime loader not configured" error) and `runtimeReady` SHALL become `true` after `PhpWeb` binary loads
