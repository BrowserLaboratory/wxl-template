## ADDED Requirements

### Requirement: Description panel collapsible on all breakpoints

The description panel SHALL be collapsible on Desktop, Tablet, and Mobile breakpoints. When collapsed, the tools panel SHALL expand to occupy 100% of the available width.

#### Scenario: Desktop description collapse

- **WHEN** user clicks the collapse button (◀) on the description panel at ≥ 768px
- **THEN** the description panel is hidden
- **AND** the tools panel expands to 100% width
- **AND** a "📖 題目" button appears in the merged nav bar

#### Scenario: Desktop description expand

- **WHEN** user clicks "📖 題目" in the merged nav bar at ≥ 768px
- **THEN** the description panel slides out from the left (38% width)
- **AND** the "📖 題目" button is removed from the nav bar

### Requirement: Mobile description defaults to collapsed

On Mobile viewports (< 768px), the description panel SHALL be collapsed by default. The tools panel SHALL occupy the full screen.

#### Scenario: Mobile initial state

- **WHEN** user loads a challenge page on a < 768px viewport
- **THEN** the description panel is hidden
- **AND** the tools panel is displayed at full width
- **AND** a "📖 題目" button is visible in the nav bar second row

### Requirement: Mobile description opens as fullscreen modal

On Mobile viewports, opening the description SHALL display it as a fullscreen modal overlay (100% width, 100% height) for focused reading.

#### Scenario: Mobile description modal open

- **WHEN** user taps "📖 題目" on a < 768px viewport
- **THEN** a fullscreen modal overlay appears containing: challenge title + badges in the modal header, full markdown description content (scrollable), and a "✕ 關閉" close button
- **AND** the flag submission input is included at the bottom of the modal

#### Scenario: Mobile description modal close

- **WHEN** user taps "✕ 關閉" in the description modal
- **THEN** the modal is dismissed
- **AND** the tools panel is visible again at full width

### Requirement: Flag submission always accessible

The flag submission input SHALL be accessible regardless of the description panel state.

#### Scenario: Flag submit visible when description collapsed on desktop

- **WHEN** description is collapsed on Desktop
- **THEN** the flag submission input is accessible (positioned in the merged nav area or a persistent bottom bar)

#### Scenario: Flag submit visible in mobile modal

- **WHEN** the description modal is open on Mobile
- **THEN** the flag submission input is displayed at the bottom of the modal
