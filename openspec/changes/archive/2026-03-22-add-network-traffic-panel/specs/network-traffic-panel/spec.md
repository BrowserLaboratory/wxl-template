## ADDED Requirements

### Requirement: NetworkPanel displays a chronological list of all HTTP traffic entries

The `NetworkPanel.vue` component SHALL render a table listing all recorded HTTP traffic entries in chronological order. Each row SHALL display: entry number, HTTP method, URL path, response status code, and request duration in milliseconds. The panel SHALL display the total number of recorded entries.

#### Scenario: Traffic entry appears after a request completes

- **WHEN** any panel issues an HTTP request through the tracked dispatch function
- **THEN** NetworkPanel SHALL display a new row with the request's method, URL, status code, and duration

#### Scenario: Empty state when no traffic has been recorded

- **WHEN** the NetworkPanel is displayed and no requests have been made
- **THEN** the panel SHALL display an empty state message indicating no traffic has been recorded

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

### Requirement: NetworkPanel provides a Clear button to reset traffic history

The panel SHALL include a Clear button that removes all recorded traffic entries and resets the entry counter display to zero.

#### Scenario: User clears all traffic entries

- **WHEN** a user clicks the Clear button
- **THEN** all traffic entries SHALL be removed from the list
- **AND** the total entry count SHALL display zero
- **AND** any expanded detail section SHALL be closed

### Requirement: NetworkPanel provides Send to Repeater action for each traffic entry

Each expanded traffic entry SHALL include a "Send to Repeater" button. When clicked, the button SHALL emit an event containing the selected entry's request data formatted as a raw HTTP request string (method, path, headers, and body in CRLF-delimited format). The parent layout SHALL receive this event, inject the raw request into RepeatPanel, and switch to the Repeater tab.

#### Scenario: User sends a traffic entry to Repeater

- **WHEN** a user clicks "Send to Repeater" on an expanded POST request to `/login` with form body
- **THEN** the RepeatPanel SHALL be activated and its request editor SHALL contain the raw HTTP request including the method line, all headers, and the form body
- **AND** the active tab SHALL switch to Repeater

#### Scenario: Send to Repeater preserves original request headers and body

- **WHEN** a user sends a traffic entry with custom headers and a JSON body to Repeater
- **THEN** the RepeatPanel request editor SHALL contain all original request headers and the exact JSON body from the traffic entry

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
