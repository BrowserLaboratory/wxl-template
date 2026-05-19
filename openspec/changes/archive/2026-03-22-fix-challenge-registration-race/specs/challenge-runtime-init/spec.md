## MODIFIED Requirements

### Requirement: ChallengeLayout establishes MessageChannel with Service Worker

After runtime initialization, ChallengeLayout SHALL create a `MessageChannel`, send `port2` to the Service Worker via the `REGISTER_CHALLENGE` message as a transferable, and listen on `port1` for `HANDLE_REQUEST` messages. The `dispatch` function passed to child components (BrowserPanel, RepeatPanel) SHALL call `runtime.handleRequest(request)` directly instead of calling `fetch(request)` through the Service Worker. The Service Worker MessageChannel relay SHALL remain active for iframe sub-resource loads that bypass the page-level dispatch.

#### Scenario: MessagePort is transferred to Service Worker at registration

- **WHEN** ChallengeLayout sends `REGISTER_CHALLENGE`
- **THEN** the message SHALL include `port: MessagePort` in the transferables list and the Service Worker SHALL receive and store it

#### Scenario: ChallengeLayout handles HANDLE_REQUEST and responds

- **WHEN** a `HANDLE_REQUEST` message arrives on `port1` from the Service Worker
- **THEN** ChallengeLayout SHALL reconstruct a `Request` from the serialized data, call `runtime.handleRequest(request)`, serialize the response `{ status, headers, body }`, and post it to `event.data.responsePort`

#### Scenario: dispatch calls runtime directly without going through Service Worker

- **WHEN** BrowserPanel or RepeatPanel calls `dispatch(request)` after runtime is ready
- **THEN** the dispatch function SHALL call `runtime.handleRequest(request)` directly and return the response, without issuing a `fetch()` that would be intercepted by the Service Worker

#### Scenario: dispatch returns error response when runtime is not ready

- **WHEN** `dispatch(request)` is called before the runtime has finished initializing
- **THEN** the dispatch function SHALL return an HTTP 503 response with `{ "error": "runtime not ready" }`
