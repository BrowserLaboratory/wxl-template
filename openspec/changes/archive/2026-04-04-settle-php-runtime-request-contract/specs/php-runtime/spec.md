## MODIFIED Requirements

### Requirement: PHP Runtime executes challenge PHP code via php-wasm

The PHP Runtime SHALL use `php-wasm` to execute challenge PHP code and SHALL prepare the supported request context before each run: `$_SERVER`, `$_GET`, `$_POST`, `$_COOKIE`, and `$GLOBALS['_RAW_INPUT']`. The adapter returned by `ChallengeLayout.vue` SHALL continue to expose `headers: string[]`, but those headers SHALL remain empty until `php-wasm` can surface `header()` output.

#### Scenario: Cookie-backed request context is visible to PHP code

- **WHEN** a request arrives with header `Cookie: session_user=guest`
- **THEN** the executed PHP app SHALL be able to read `$_COOKIE['session_user'] === 'guest'`

#### Scenario: header() output remains unavailable

- **WHEN** the executed PHP app calls `header('X-Test: 1')`
- **THEN** the runtime SHALL still return the response body and SHALL NOT rely on adapter-provided response headers

### Requirement: PHP Runtime handles HTTP request method and body

The PHP Runtime SHALL populate `$_GET` from the request query string, `$_POST` from `application/x-www-form-urlencoded` POST bodies, `$_COOKIE` from the incoming `Cookie` header, and `$GLOBALS['_RAW_INPUT']` from the raw request body. `$_SERVER['REQUEST_METHOD']`, `$_SERVER['REQUEST_URI']`, and `$_SERVER['HTTP_HOST']` SHALL reflect the incoming request. If the same cookie name appears multiple times in the header, the last value encountered SHALL win. Non-form request bodies SHALL leave `$_POST` empty while preserving `_RAW_INPUT`.

#### Scenario: JSON request body does not populate $_POST

- **WHEN** a POST request with `Content-Type: application/json` body arrives
- **THEN** `$_POST` SHALL be empty and `$GLOBALS['_RAW_INPUT']` SHALL contain the raw JSON string

#### Scenario: Cookie header populates $_COOKIE

- **WHEN** a request arrives with `Cookie: theme=dark; session_user=guest`
- **THEN** `$_COOKIE['theme']` SHALL equal `dark` and `$_COOKIE['session_user']` SHALL equal `guest`

#### Scenario: Missing Cookie header yields an empty cookie map

- **WHEN** a request arrives without a `Cookie` header
- **THEN** the runtime SHALL initialize `$_COOKIE` as an empty array
