## ADDED Requirements

<!-- NetworkPanel displays a chronological list of all HTTP traffic entries — moved to canonical location below -->

<!-- @trace
source: add-network-traffic-panel
updated: 2026-03-22
code:
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/components/NetworkPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
  - tests/unit/components/RepeatPanel.test.ts
-->

<!-- NetworkPanel shows request and response details for a selected entry — moved to canonical location below -->

<!-- @trace
source: add-network-traffic-panel
updated: 2026-03-22
code:
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/components/NetworkPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
  - tests/unit/components/RepeatPanel.test.ts
-->

<!-- NetworkPanel provides a Clear button to reset traffic history — moved to canonical location below -->

<!-- @trace
source: add-network-traffic-panel
updated: 2026-03-22
code:
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/components/NetworkPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
  - tests/unit/components/RepeatPanel.test.ts
-->

<!-- NetworkPanel provides Send to Repeater action for each traffic entry — moved to canonical location below -->

<!-- @trace
source: add-network-traffic-panel
updated: 2026-03-22
code:
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/components/NetworkPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
  - tests/unit/components/RepeatPanel.test.ts
-->

<!-- Traffic recording intercepts all requests via dispatch wrapper — moved to canonical location below -->

## Requirements

<!-- @trace
source: add-network-traffic-panel
updated: 2026-03-22
code:
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/components/NetworkPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
  - tests/unit/components/RepeatPanel.test.ts
-->

### Requirement: NetworkPanel displays a chronological list of all HTTP traffic entries

The `NetworkPanel.vue` component SHALL render a table listing all recorded HTTP traffic entries in chronological order. Each row SHALL display: entry number, HTTP method, URL path, response status code, and request duration in milliseconds. The panel SHALL display the total number of recorded entries.

#### Scenario: Traffic entry appears after a request completes

- **WHEN** any panel issues an HTTP request through the tracked dispatch function
- **THEN** NetworkPanel SHALL display a new row with the request's method, URL, status code, and duration

#### Scenario: Empty state when no traffic has been recorded

- **WHEN** the NetworkPanel is displayed and no requests have been made
- **THEN** the panel SHALL display an empty state message indicating no traffic has been recorded

---
### Requirement: NetworkPanel shows request and response details for a selected entry

When a user clicks on a traffic entry row, the panel SHALL expand a detail section below the list showing the full request and response data. The detail section SHALL provide two sub-tabs: "Request" and "Response". The Request sub-tab SHALL display the HTTP method, URL, all request headers, and the request body (if present). The Response sub-tab SHALL display the status code, all response headers, and the response body.

#### Scenario: User expands a traffic entry to view request details

- **WHEN** a user clicks on a traffic entry row
- **THEN** a detail section SHALL appear below the row showing the Request sub-tab by default
- **AND** the Request sub-tab SHALL display the method, full URL, all request headers, and the request body

#### Scenario: User switches to response details

- **WHEN** a user clicks the "Response" sub-tab in the expanded detail section
- **THEN** the panel SHALL display the response status code, all response headers, and the response body

#### Scenario: User collapses an expanded entry

- **WHEN** a user clicks on an already-expanded traffic entry row
- **THEN** the detail section SHALL collapse and be hidden

---
### Requirement: NetworkPanel provides a Clear button to reset traffic history

The panel SHALL include a Clear button that removes all recorded traffic entries and resets the entry counter display to zero.

#### Scenario: User clears all traffic entries

- **WHEN** a user clicks the Clear button
- **THEN** all traffic entries SHALL be removed from the list
- **AND** the total entry count SHALL display zero
- **AND** any expanded detail section SHALL be closed

---
### Requirement: NetworkPanel provides Send to Repeater action for each traffic entry

Each expanded traffic entry SHALL include a "Send to Repeater" button. When clicked, the button SHALL emit an event containing the selected entry's request data formatted as a raw HTTP request string (method, path, headers, and body in CRLF-delimited format). The parent layout SHALL receive this event, inject the raw request into RepeatPanel, and switch to the Repeater tab.

#### Scenario: User sends a traffic entry to Repeater

- **WHEN** a user clicks "Send to Repeater" on an expanded POST request to `/login` with form body
- **THEN** the RepeatPanel SHALL be activated and its request editor SHALL contain the raw HTTP request including the method line, all headers, and the form body
- **AND** the active tab SHALL switch to Repeater

#### Scenario: Send to Repeater preserves original request headers and body

- **WHEN** a user sends a traffic entry with custom headers and a JSON body to Repeater
- **THEN** the RepeatPanel request editor SHALL contain all original request headers and the exact JSON body from the traffic entry

---
### Requirement: Traffic recording intercepts all requests via dispatch wrapper

The `ChallengeLayout.vue` SHALL wrap the `dispatch` function with a `trackedDispatch` function that records every request and response. The `trackedDispatch` function SHALL capture: HTTP method, URL, request headers, request body, response status, response headers, response body, and duration (time between request start and response completion). All panels that issue requests SHALL use `trackedDispatch` instead of the raw `dispatch`.

#### Scenario: BrowserPanel request is recorded in traffic log

- **WHEN** BrowserPanel navigates to a URL using the tracked dispatch function
- **THEN** the traffic log SHALL contain an entry with the request method, URL, and the response status and body

#### Scenario: RepeatPanel request is recorded in traffic log

- **WHEN** RepeatPanel sends a crafted HTTP request using the tracked dispatch function
- **THEN** the traffic log SHALL contain an entry with the complete request and response data

#### Scenario: Duration is measured accurately

- **WHEN** a request takes 150ms to complete
- **THEN** the recorded traffic entry's duration SHALL reflect approximately 150ms (within reasonable timer precision)

---
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

<!-- @trace
source: challenge-ux-and-attack-session
updated: 2026-03-23
code:
  - CONTRIBUTE.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/FlagSubmit.vue
  - README.md
  - Usage.md
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/composables/useAttackSession.test.ts
-->

---
### Requirement: Traffic log displays request and response headers

The traffic log SHALL display a `Cookie` header in request display headers when the original request contained `X-Wxlsh-Cookie`. The `X-Wxlsh-Cookie` transport header itself SHALL NOT appear in the display.

The traffic log SHALL display `Set-Cookie` headers in response display headers by converting `X-Wxlsh-Set-Cookie` back to individual `Set-Cookie` entries (splitting by newline). The `X-Wxlsh-Set-Cookie` transport header itself SHALL NOT appear in the display.

#### Scenario: Request with transported cookie displays Cookie header

- **WHEN** a request has header `X-Wxlsh-Cookie: session_user=guest`
- **THEN** the traffic log request headers SHALL show `Cookie: session_user=guest` and SHALL NOT show `X-Wxlsh-Cookie`

#### Scenario: Response with transported set-cookie displays Set-Cookie header

- **WHEN** a response has header `X-Wxlsh-Set-Cookie: a=1\nb=2`
- **THEN** the traffic log response headers SHALL show two entries: `Set-Cookie: a=1` and `Set-Cookie: b=2`

<!-- @trace
source: browser-cookie-and-redirect
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/door-is-open/index.md
  - docs/challenge/door-is-open/src/flag.txt
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
-->