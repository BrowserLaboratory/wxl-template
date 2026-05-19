## ADDED Requirements

### Requirement: Service Worker waits for challenge registration on registry miss

When the Service Worker intercepts a fetch for `challenge-<slug>.localhost` and `registry.get(slug)` returns `undefined`, the Service Worker SHALL NOT immediately return HTTP 503. Instead, it SHALL wait up to 3 seconds for a `REGISTER_CHALLENGE` message for that slug to arrive. If registration arrives within the timeout, the Service Worker SHALL proceed with normal dispatch. If the timeout expires without registration, the Service Worker SHALL return HTTP 503 with `{ "error": "challenge not registered" }`.

#### Scenario: Fetch arrives before registration and registration arrives within timeout

- **WHEN** a fetch event fires for `challenge-<slug>.localhost` before the challenge page has sent `REGISTER_CHALLENGE`, AND the page sends `REGISTER_CHALLENGE` within 3 seconds
- **THEN** the Service Worker SHALL resolve the pending fetch using the newly registered entry and return a successful response

#### Scenario: Fetch arrives before registration and timeout expires

- **WHEN** a fetch event fires for `challenge-<slug>.localhost` before registration, AND no `REGISTER_CHALLENGE` arrives within 3 seconds
- **THEN** the Service Worker SHALL return HTTP 503 with `{ "error": "challenge not registered" }`

#### Scenario: Multiple fetches wait for the same slug registration

- **WHEN** multiple fetch events fire for the same unregistered slug before `REGISTER_CHALLENGE` arrives
- **THEN** all pending fetches for that slug SHALL be resolved when registration arrives
