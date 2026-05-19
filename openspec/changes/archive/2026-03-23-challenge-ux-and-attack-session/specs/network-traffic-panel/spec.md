## ADDED Requirements

### Requirement: ChallengeLayout provides source-attributed dispatch wrappers

The `ChallengeLayout.vue` SHALL create two source-attributed dispatch wrappers derived from `trackedDispatch`: `browserDispatch` (passed to `BrowserPanel`) and `repeaterDispatch` (passed to `RepeatPanel`). Each wrapper SHALL invoke `useAttackSession.addHttpEvent(entry, source)` after every completed request, passing the appropriate `source` string (`'browser'` or `'repeater'`).

Both wrappers SHALL still route through `trackedDispatch`, so all requests continue to appear in the `trafficLog` displayed by `NetworkPanel`.

#### Scenario: BrowserPanel request is attributed to browser source

- **WHEN** BrowserPanel issues a request using `browserDispatch`
- **THEN** the resulting `http_request` event in the attack session SHALL have `source: 'browser'`
- **AND** the request SHALL still appear in the NetworkPanel traffic log

#### Scenario: RepeatPanel request is attributed to repeater source

- **WHEN** RepeatPanel sends a crafted request using `repeaterDispatch`
- **THEN** the resulting `http_request` event in the attack session SHALL have `source: 'repeater'`
- **AND** the request SHALL still appear in the NetworkPanel traffic log
