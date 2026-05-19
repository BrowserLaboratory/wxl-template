## MODIFIED Requirements

### Requirement: Router dispatches to correct runtime based on challenge type

Upon intercepting a request, the Service Worker SHALL look up the registered challenge's `port` (a `MessagePort` transferred from the challenge page at registration time). The Service Worker SHALL serialize the request into `{ method, url, headers, body }`, create a per-request `MessageChannel`, and send `{ type: 'HANDLE_REQUEST', method, url, headers, body, responsePort }` to the challenge's `port` with `responsePort` as a transferable. The Service Worker SHALL await the response on the other end of the per-request channel. All backend types (`flask`, `fastapi`, and `php`) SHALL use the same port-based `relayRequest(port, request)` mechanism for dispatching requests.

#### Scenario: Flask challenge request is dispatched via MessageChannel relay

- **WHEN** the active challenge has `backend: flask` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL send a `HANDLE_REQUEST` message to the challenge's registered `MessagePort` and await a `{ status, headers, body }` response

#### Scenario: FastAPI challenge request is dispatched via MessageChannel relay

- **WHEN** the active challenge has `backend: fastapi` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL send a `HANDLE_REQUEST` message to the challenge's registered `MessagePort` and await a `{ status, headers, body }` response

#### Scenario: PHP challenge request is dispatched via MessageChannel relay

- **WHEN** the active challenge has `backend: php` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL send a `HANDLE_REQUEST` message to the challenge's registered `MessagePort` and await a `{ status, headers, body }` response, using the same `relayRequest(port, request)` mechanism as Python backends

#### Scenario: Unknown backend type returns 501

- **WHEN** the active challenge has an unrecognized `backend` value
- **THEN** the Service Worker SHALL return an HTTP 501 Not Implemented response
