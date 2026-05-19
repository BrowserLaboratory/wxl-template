## ADDED Requirements

### Requirement: Desktop browser chrome with capsule URL bar

On Desktop viewports (≥ 768px), the Browser tab SHALL render a browser-like chrome bar containing navigation buttons and a capsule-shaped URL input.

#### Scenario: Desktop browser chrome layout

- **WHEN** the Browser tab is active on a ≥ 768px viewport
- **THEN** a chrome bar is rendered below the tab bar containing: ← back button, → forward button, ↻ reload button, a capsule-shaped URL input field (border-radius: 20px) with 🔒 lock icon and URL text (protocol in gray, domain in white), and a "Go" button

#### Scenario: Desktop URL navigation

- **WHEN** user edits the URL in the capsule input and clicks "Go" or presses Enter
- **THEN** the browser panel navigates to the entered URL via dispatch

### Requirement: Mobile browser with minimal URL bar

On Mobile viewports (< 768px), the Browser tab SHALL render a minimal URL bar without navigation buttons.

#### Scenario: Mobile browser URL bar layout

- **WHEN** the Browser tab is active on a < 768px viewport
- **THEN** a URL bar is rendered containing only: a URL input field and a → (go) button
- **AND** no ← → ↻ navigation buttons are displayed

#### Scenario: Mobile URL navigation

- **WHEN** user edits the URL and taps the → button or presses Enter
- **THEN** the browser panel navigates to the entered URL via dispatch
