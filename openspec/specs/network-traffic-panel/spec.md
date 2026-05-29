# network-traffic-panel Specification

## Purpose

Defines the Network Traffic panel that records and displays every HTTP request and response routed through the challenge layout's tracked dispatch — a chronological, inspectable traffic log with per-entry request/response detail, Clear and Send-to-Repeater actions, source-attributed dispatch wrappers, and transport-cookie header normalization for display.

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

---
### Requirement: Repeater Panel provides raw HTTP request editing

The Repeater Panel SHALL retain its core functionality (raw HTTP/1.1 request editing, send, response display, named snapshots). The visual presentation SHALL be upgraded: snapshot list SHALL be displayed as a named sidebar list rather than bottom inline chips, the "Save" button SHALL prompt the user for a snapshot name, and the textarea and response area SHALL use consistent monospace typography with improved line-height and border treatment.

#### Scenario: Raw request is parsed and sent

- **WHEN** a user edits a raw HTTP request in the Repeater Panel and clicks "Send"
- **THEN** the panel SHALL parse the raw text into method, path, headers, and body, then dispatch via `dispatch`

#### Scenario: Raw response is displayed

- **WHEN** the response is received
- **THEN** the Repeater Panel SHALL display the status line, all response headers, and the raw body

#### Scenario: Named snapshot can be saved and restored

- **WHEN** a user clicks "Save", enters a name, and confirms
- **THEN** the snapshot SHALL appear in the sidebar list and selecting it SHALL restore the request content

<!-- @trace
source: challenge-tools-evolution
code:
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/components/RepeatPanel.test.ts
-->

---
### Requirement: BrowserPanel sends realistic browser-like HTTP requests

Every request dispatched from `BrowserPanel.vue` SHALL include a complete set of simulated browser headers for display in the Network Traffic panel. `BrowserPanel` SHALL attach request-context metadata via `X-Wxlsh-Context` and `X-Wxlsh-Referer` headers; `useTrafficLog.wrap()` SHALL consume these metadata headers (stripping them before dispatch to the runtime), then synthesize the full simulated header set — including static browser identity headers and context-specific dynamic headers — for the recorded `TrafficEntry`. The synthesized headers SHALL follow HTTP/1.1 Title-Case convention and Chrome's conventional header ordering (Host first, Connection second, Accept-Encoding and Accept-Language last).

#### Scenario: Address bar navigation includes full browser headers

- **WHEN** a user navigates to a URL via the BrowserPanel address bar
- **THEN** the dispatched request SHALL include `User-Agent`, `Accept`, `Accept-Language`, `Accept-Encoding`, `Connection`, `Host`, `Sec-Ch-Ua`, `Sec-Ch-Ua-Mobile`, `Sec-Ch-Ua-Platform`, `Upgrade-Insecure-Requests`, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: none`, and `Sec-Fetch-User: ?1`

#### Scenario: Link click includes Referer and same-origin Sec-Fetch headers

- **WHEN** a user clicks a link inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Referer` set to the current page URL, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, and `Sec-Fetch-Site: same-origin`

#### Scenario: Form GET submission includes Referer and navigation headers

- **WHEN** a user submits a GET form inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Referer` set to the form page URL, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: same-origin`, and `Sec-Fetch-User: ?1`

#### Scenario: Form POST submission includes Origin, Referer, and Content-Length

- **WHEN** a user submits a POST form with `application/x-www-form-urlencoded` encoding inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Origin` set to the challenge origin, `Referer` set to the form page URL, `Content-Type: application/x-www-form-urlencoded`, `Content-Length` reflecting the byte length of the encoded body, `Sec-Fetch-Site: same-origin`, and `Sec-Fetch-User: ?1`

#### Scenario: NetworkPanel records complete headers from BrowserPanel requests

- **WHEN** BrowserPanel dispatches any request through `trackedDispatch`
- **THEN** the NetworkPanel traffic log SHALL display a header list matching the full set of browser-simulated headers defined by `buildBrowserRequest()`

<!-- @trace
source: simulate-browser-request-headers
code:
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
-->
