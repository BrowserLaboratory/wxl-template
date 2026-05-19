## MODIFIED Requirements

### Requirement: Repeater Panel provides raw HTTP request editing

The Repeater Panel SHALL provide a text area for editing a raw HTTP/1.1 request (method, path, headers, body). It SHALL provide a "Send" button and display the raw HTTP response (status line, headers, body) in a separate read-only text area. The panel SHALL support saving and loading named request snapshots.

When a user clicks the "+ Save" button, the panel SHALL display an inline modal overlay — not a browser `window.prompt()` dialog — for entering the snapshot name. The modal SHALL contain a text input pre-focused on open, a "Save" confirm button, and a "Cancel" button. Pressing Escape or clicking Cancel SHALL dismiss the modal without saving.

#### Scenario: Raw request is parsed and sent

- **WHEN** a user edits a raw HTTP request in the Repeater Panel and clicks "Send"
- **THEN** the panel SHALL parse the raw text into method, path, headers, and body, then dispatch via the tracked dispatch function

#### Scenario: Raw response is displayed

- **WHEN** the response is received
- **THEN** the Repeater Panel SHALL display the status line, all response headers, and the raw body in the response text area

#### Scenario: Snapshot save uses inline modal instead of browser prompt

- **WHEN** a user clicks the "+ Save" button
- **THEN** an inline modal overlay SHALL appear within the panel (not a browser dialog)
- **AND** the text input inside the modal SHALL receive focus automatically

#### Scenario: Snapshot is saved after modal confirm

- **WHEN** a user enters a name in the save modal and clicks "Save" (or presses Enter)
- **THEN** the snapshot SHALL be persisted to localStorage with the given name
- **AND** the modal SHALL be dismissed

#### Scenario: Modal cancel discards the save operation

- **WHEN** a user clicks "Cancel" or presses Escape in the save modal
- **THEN** the modal SHALL be dismissed without saving any snapshot

#### Scenario: Snapshot can be restored

- **WHEN** a user clicks a saved snapshot in the sidebar
- **THEN** the request text area SHALL be populated with the saved snapshot content

## MODIFIED Requirements

### Requirement: Challenge page displays flag submission form

The challenge page SHALL include a persistent flag submission form below the interaction panels. The form SHALL have a text input and a submit button. On submission, it SHALL call the flag verification function and display a success or failure indicator.

When the flag is correct, the success state SHALL additionally display a "下載攻擊紀錄" (Download Attack Log) button. Clicking this button SHALL invoke an `onExport` callback prop provided by the parent layout, which triggers the JSON file download of the current attack session.

#### Scenario: Correct flag shows success message and export button

- **WHEN** a user submits the correct flag
- **THEN** the UI SHALL display a success indicator
- **AND** a "下載攻擊紀錄" button SHALL appear in the success state

#### Scenario: Export button triggers attack session download

- **WHEN** a user clicks "下載攻擊紀錄" after solving the challenge
- **THEN** the `onExport` prop callback SHALL be invoked
- **AND** the browser SHALL initiate a JSON file download of the attack session

#### Scenario: Incorrect flag shows failure message without revealing answer

- **WHEN** a user submits an incorrect flag
- **THEN** the UI SHALL display a failure indicator with no hint about the correct flag
- **AND** no export button SHALL be displayed
