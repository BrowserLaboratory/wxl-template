## MODIFIED Requirements

### Requirement: NetworkPanel provides Send to Repeater action for each traffic entry

Each expanded traffic entry SHALL include a "Send to Repeater" button whenever the challenge grants the Repeater tab. When clicked, the button SHALL emit an event containing the selected entry's request data formatted as a raw HTTP request string (method, path, headers, and body in CRLF-delimited format). The parent layout SHALL receive this event, inject the raw request into RepeatPanel, and switch to the Repeater tab.

When the challenge withholds the Repeater tab, the button SHALL NOT be rendered, and the parent layout SHALL ignore the event if it arrives by any other route. A rendered button that silently does nothing is not an acceptable substitute: the reader SHALL NOT be offered an action the challenge has disabled.

#### Scenario: User sends a traffic entry to Repeater

- **WHEN** a user clicks "Send to Repeater" on an expanded POST request to `/login` with form body
- **THEN** the RepeatPanel SHALL be activated and its request editor SHALL contain the raw HTTP request including the method line, all headers, and the form body
- **AND** the active tab SHALL switch to Repeater

#### Scenario: Send to Repeater is absent when the challenge withholds the Repeater

- **WHEN** a challenge declares `tools: [browser, network]` and a user expands a traffic entry
- **THEN** the entry's action row SHALL NOT contain a "Send to Repeater" button
