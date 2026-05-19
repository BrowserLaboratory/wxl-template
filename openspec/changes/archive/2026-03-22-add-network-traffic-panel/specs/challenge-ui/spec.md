## MODIFIED Requirements

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL render four panels accessible via tab navigation: Browser Panel, Repeater Panel, and Network Panel. All panels that issue HTTP requests SHALL share a single `trackedDispatch` wrapper for issuing requests. The Network Panel SHALL receive the traffic log populated by `trackedDispatch`.

#### Scenario: User switches between panels without losing state

- **WHEN** a user switches from the Browser Panel to the Network Panel and back
- **THEN** each panel SHALL retain its previous input state (URL, method, request body, response history, traffic entries)

#### Scenario: All panels target the same challenge origin

- **WHEN** any panel sends an HTTP request
- **THEN** the request SHALL target `http://challenge-<slug>.localhost` and be intercepted by the Service Worker

#### Scenario: Network tab is available alongside Browser and Repeater

- **WHEN** the challenge page loads
- **THEN** the tab navigation SHALL display three tabs: Browser, Repeater, and Network

#### Scenario: RepeatPanel receives injected request from Network panel

- **WHEN** the Network panel emits a Send to Repeater event
- **THEN** ChallengeLayout SHALL set the injected request content on RepeatPanel and switch the active tab to Repeater
