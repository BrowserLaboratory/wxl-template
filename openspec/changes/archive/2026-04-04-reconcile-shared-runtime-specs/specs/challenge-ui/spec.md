## MODIFIED Requirements

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL expose a shared challenge workspace with five default tabs in canonical order: Browser, Network, Repeater, Terminal, and Code. If challenge frontmatter defines a `tools` allowlist, the tab bar SHALL render only the listed tools while preserving that canonical order. All request-emitting panels SHALL call source-specific wrappers over a shared `trackedDispatch` pipeline, and the Network panel SHALL render the traffic log recorded by that pipeline.

#### Scenario: Default challenge shows the full tool set

- **WHEN** challenge frontmatter omits the `tools` field
- **THEN** the tab bar SHALL display Browser, Network, Repeater, Terminal, and Code

#### Scenario: Frontmatter filters visible tabs

- **WHEN** challenge frontmatter sets `tools: ['browser', 'network', 'repeater']`
- **THEN** the tab bar SHALL hide Terminal and Code while keeping the remaining tabs in canonical order

#### Scenario: Network panel sends a request to Repeater

- **WHEN** the Network panel emits a Send to Repeater action
- **THEN** ChallengeLayout SHALL inject the raw request into Repeater and switch the active tab to Repeater

### Requirement: Browser Panel simulates a web browser address bar and viewport

The Browser Panel SHALL provide a URL bar pre-populated with `https://challenge-<slug>.localhost/` and a Go action that issues a GET request through the injected dispatch function. HTML responses SHALL render inside a sandboxed `iframe` using `sandbox="allow-scripts allow-forms"`. The Browser Panel SHALL inject its own interceptor script into HTML responses so that link clicks and form submissions can be relayed to the parent without requiring `allow-same-origin`.

#### Scenario: HTML response renders in a sandboxed iframe

- **WHEN** the challenge runtime returns `Content-Type: text/html`
- **THEN** the Browser Panel SHALL render the response in an iframe with `allow-scripts allow-forms` and no `allow-same-origin`

#### Scenario: Link navigation stays inside the panel

- **WHEN** a user clicks a link inside the rendered HTML
- **THEN** the injected interceptor SHALL post the navigation to the parent, the URL bar SHALL update, and the Browser Panel SHALL dispatch a new GET request without leaving the page

### Requirement: Browser Panel intercepts HTML form submissions inside the iframe

The Browser Panel SHALL handle form submissions by injecting a postMessage-based interceptor into rendered HTML. The interceptor SHALL prevent native iframe navigation, resolve the form `action` against `https://challenge-<slug>.localhost/`, preserve the declared HTTP method, and serialize fields as query parameters for `GET`, `application/x-www-form-urlencoded` for standard `POST`, or `FormData` for `multipart/form-data`.

#### Scenario: GET form appends fields to the query string

- **WHEN** a user submits a form with `method="GET"` inside the rendered iframe
- **THEN** the Browser Panel SHALL dispatch a GET request whose URL contains the serialized form fields and whose body is empty

#### Scenario: Multipart form keeps FormData transport

- **WHEN** a user submits a form with `method="POST"` and `enctype="multipart/form-data"`
- **THEN** the Browser Panel SHALL dispatch a POST request whose body is a `FormData` object and SHALL NOT set the multipart boundary header manually

### Requirement: BrowserPanel dispatches HTTP requests to the challenge runtime

The BrowserPanel SHALL call the injected `dispatch` prop directly instead of issuing browser `fetch()` requests that depend on Service Worker interception. The panel SHALL wrap dispatches in `browserFetch()` so that `X-Wxlsh-Cookie` is attached before the request, `X-Wxlsh-Set-Cookie` is harvested after the response, and up to five redirects are followed with the stored cookie jar.

#### Scenario: Browser request succeeds without a Service Worker fetch round-trip

- **WHEN** the user presses Go in the Browser Panel
- **THEN** the panel SHALL construct a `Request` object and pass it to the injected `dispatch` function directly

#### Scenario: Redirect reuses the cookie jar

- **WHEN** a response returns `302`, `Location: /files`, and `X-Wxlsh-Set-Cookie: session_user=guest; Path=/`
- **THEN** the BrowserPanel SHALL store the cookie, follow the redirect as a GET request, and include `X-Wxlsh-Cookie: session_user=guest` on the next dispatch
