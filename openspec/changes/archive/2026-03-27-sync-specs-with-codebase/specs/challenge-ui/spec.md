## MODIFIED Requirements

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL render four panels accessible via tab navigation: Browser Panel, Repeater Panel, and Network Panel. All panels that issue HTTP requests SHALL share a single `trackedDispatch` wrapper for issuing requests. The Network Panel SHALL receive the traffic log populated by `trackedDispatch`.

#### Scenario: User switches between panels without losing state

- **WHEN** a user switches from the Browser Panel to the Network Panel and back
- **THEN** each panel SHALL retain its previous input state (URL, method, request body, response history, traffic entries)

#### Scenario: All panels target the same challenge origin

- **WHEN** any panel sends an HTTP request
- **THEN** the request SHALL target `https://challenge-<slug>.localhost` and be intercepted by the Service Worker

#### Scenario: Network tab is available alongside Browser and Repeater

- **WHEN** the challenge page loads
- **THEN** the tab navigation SHALL display three tabs: Browser, Repeater, and Network

#### Scenario: RepeatPanel receives injected request from Network panel

- **WHEN** the Network panel emits a Send to Repeater event
- **THEN** ChallengeLayout SHALL set the injected request content on RepeatPanel and switch the active tab to Repeater

---

### Requirement: Browser Panel simulates a web browser address bar and viewport

The Browser Panel SHALL provide: a URL input field pre-populated with `https://challenge-<slug>.localhost/`, a "Go" button, and a response viewport that renders HTML responses in a sandboxed iframe with `sandbox="allow-scripts allow-forms"`.

The Browser Panel SHALL NOT include an HTTP method selector (GET/POST/PUT/DELETE/PATCH). HTTP method selection and request body editing are provided by the Repeater and Terminal panels.

#### Scenario: HTML response is rendered in sandboxed iframe

- **WHEN** the challenge app returns a response with `Content-Type: text/html`
- **THEN** the Browser Panel SHALL render the HTML in a sandboxed iframe

#### Scenario: Non-HTML response is shown as formatted text

- **WHEN** the challenge app returns `Content-Type: application/json`
- **THEN** the Browser Panel SHALL display the JSON as syntax-highlighted text, not rendered HTML

#### Scenario: Browser Panel does not include method selector or body editor

- **WHEN** the Browser Panel is rendered
- **THEN** there SHALL NOT be an HTTP method selector dropdown
- **AND** there SHALL NOT be a request body editor
- **AND** the panel SHALL only dispatch GET requests via the URL bar and "Go" button

## REMOVED Requirements

### Requirement: Browser Panel HTTP method selector

**Reason:** HTTP method selection (GET/POST/PUT/DELETE/PATCH) is provided by the Repeater Panel and Terminal Panel. The Browser Panel focuses on URL-bar-driven GET navigation only.

#### Scenario: Removal confirmed

- **WHEN** the Browser Panel is rendered
- **THEN** no HTTP method selector SHALL be present

---

### Requirement: Browser Panel request body editor for non-GET methods

**Reason:** Request body editing for non-GET methods is provided by the Repeater Panel and Terminal Panel. The Browser Panel does not need a body editor.

#### Scenario: Removal confirmed

- **WHEN** the Browser Panel is rendered
- **THEN** no request body editor SHALL be present
