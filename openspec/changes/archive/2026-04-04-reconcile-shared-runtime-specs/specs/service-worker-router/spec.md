## MODIFIED Requirements

### Requirement: Service Worker intercepts challenge-*.localhost requests

A Service Worker registered at the root scope SHALL intercept browser-generated fetch and navigation requests whose URL host matches `challenge-<slug>.localhost`. Requests not matching that pattern SHALL pass through unchanged. Direct runtime dispatches from challenge UI panels SHALL remain valid even when they do not create a browser `fetch` event.

#### Scenario: Matching browser fetch is intercepted

- **WHEN** a browser fetch targets `https://challenge-sqli-basic.localhost/api/users`
- **THEN** the Service Worker SHALL intercept the request and route it through the challenge relay path instead of forwarding it to the network

#### Scenario: UI panel dispatch does not require a fetch event

- **WHEN** BrowserPanel calls its injected `dispatch` prop with a `Request` object
- **THEN** the request SHALL be handled by the runtime without depending on a Service Worker `fetch` event

### Requirement: Router dispatches to correct runtime based on challenge type

Upon intercepting a challenge-origin request, the Service Worker SHALL look up the registered challenge entry, serialize the request into `{ method, url, headers, body }`, and relay it to the page through the registered `MessagePort`. The relay contract SHALL be backend-agnostic: `flask`, `fastapi`, and `php` SHALL all use the same `HANDLE_REQUEST` request/response message shape, while backend-specific execution remains page-side runtime logic.

#### Scenario: PHP challenge uses the same relay contract as Python challenges

- **WHEN** a registered challenge declares `backend: php` and the Service Worker intercepts a challenge-origin request
- **THEN** the Service Worker SHALL send the same `HANDLE_REQUEST` message shape that it uses for `flask` and `fastapi`

#### Scenario: Unknown backend returns 501

- **WHEN** the registered challenge entry contains an unrecognized backend value
- **THEN** the Service Worker SHALL return an HTTP `501 Not Implemented` response

### Requirement: Challenge page registers itself with the Service Worker

When a challenge page mounts, it SHALL send `{ type: 'REGISTER_CHALLENGE', slug, backend, port }` to the Service Worker and transfer the `MessagePort` used for request relay. When the challenge page unmounts, it SHALL send `{ type: 'UNREGISTER_CHALLENGE', slug }`. A ready Service Worker with an active registration SHALL be sufficient for the page to complete registration and unlock runtime tooling, even before `controllerchange` fires.

#### Scenario: Active worker without controller still permits registration

- **WHEN** `navigator.serviceWorker.controller` is null but `navigator.serviceWorker.ready` resolves with an active worker
- **THEN** the challenge page SHALL register the challenge and treat Service Worker readiness as satisfied

#### Scenario: Unregistration clears the routing entry

- **WHEN** the challenge page sends `UNREGISTER_CHALLENGE`
- **THEN** the Service Worker SHALL remove the slug mapping and subsequent intercepted requests for that slug SHALL return HTTP `503`
