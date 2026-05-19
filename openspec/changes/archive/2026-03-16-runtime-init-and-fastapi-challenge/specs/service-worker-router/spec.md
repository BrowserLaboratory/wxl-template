## MODIFIED Requirements

### Requirement: Router dispatches to correct runtime based on challenge type

Upon intercepting a request, the Service Worker SHALL look up the registered challenge's `port` (a `MessagePort` transferred from the challenge page at registration time). The Service Worker SHALL serialize the request into `{ method, url, headers, body }`, create a per-request `MessageChannel`, and send `{ type: 'HANDLE_REQUEST', method, url, headers, body, responsePort }` to the challenge's `port` with `responsePort` as a transferable. The Service Worker SHALL await the response on the other end of the per-request channel. If `backend` is `flask` or `fastapi`, the port-based relay SHALL be used. If `backend` is `php`, the existing PHP dispatch SHALL be used.

#### Scenario: Flask challenge request is dispatched via MessageChannel relay

- **WHEN** the active challenge has `backend: flask` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL send a `HANDLE_REQUEST` message to the challenge's registered `MessagePort` and await a `{ status, headers, body }` response

#### Scenario: FastAPI challenge request is dispatched via MessageChannel relay

- **WHEN** the active challenge has `backend: fastapi` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL send a `HANDLE_REQUEST` message to the challenge's registered `MessagePort` and await a `{ status, headers, body }` response

#### Scenario: PHP challenge request is dispatched to PHP runtime

- **WHEN** the active challenge has `backend: php` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL invoke the PHP Runtime with the request details

#### Scenario: Unknown backend type returns 501

- **WHEN** the active challenge has an unrecognized `backend` value
- **THEN** the Service Worker SHALL return an HTTP 501 Not Implemented response

## MODIFIED Requirements

### Requirement: Challenge page registers itself with the Service Worker

When a challenge page mounts, it SHALL send a `postMessage` to the Service Worker containing `{ type: 'REGISTER_CHALLENGE', slug: string, backend: string, port: MessagePort }` with `port` in the transferables array. The `port` is the page's end of a `MessageChannel` used for request relay. When the challenge page unmounts, it SHALL send `{ type: 'UNREGISTER_CHALLENGE', slug: string }`.

#### Scenario: Registration includes MessagePort and is acknowledged

- **WHEN** the challenge page sends `REGISTER_CHALLENGE` with a `MessagePort` transferable
- **THEN** the Service Worker SHALL store the slug-to-`{ backend, port }` mapping and reply with `{ type: 'REGISTERED' }`

#### Scenario: Unregistration clears the mapping

- **WHEN** the challenge page sends `UNREGISTER_CHALLENGE`
- **THEN** the Service Worker SHALL remove the slug-to-backend mapping, and subsequent requests to that slug SHALL return HTTP 503
