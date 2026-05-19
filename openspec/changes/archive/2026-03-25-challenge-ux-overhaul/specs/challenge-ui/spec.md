## ADDED Requirements

### Requirement: MergedNav component

The system SHALL provide a MergedNav component that renders the unified navigation bar on challenge pages, containing brand, navigation links, challenge metadata, and utility controls.

#### Scenario: MergedNav renders on challenge page

- **WHEN** a challenge page is loaded
- **THEN** the MergedNav component renders with all required elements based on the current viewport breakpoint

### Requirement: DescriptionModal component

The system SHALL provide a DescriptionModal component for Mobile viewports that renders the challenge description as a fullscreen overlay.

#### Scenario: DescriptionModal opens and closes

- **WHEN** user opens the description modal on Mobile
- **THEN** a fullscreen overlay appears with scrollable challenge content and a close button
- **AND** clicking close dismisses the modal

### Requirement: BrowserChrome component

The system SHALL provide a BrowserChrome component that renders the browser-like URL bar, adapting its layout between Desktop (capsule with nav buttons) and Mobile (minimal input + go button).

#### Scenario: BrowserChrome adapts to viewport

- **WHEN** viewport changes from Desktop to Mobile
- **THEN** the BrowserChrome switches from capsule layout (← → ↻ + capsule URL + Go) to minimal layout (URL input + → button)
