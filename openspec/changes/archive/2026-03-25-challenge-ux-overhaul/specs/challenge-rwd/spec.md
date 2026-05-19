## ADDED Requirements

### Requirement: Three-breakpoint responsive layout

The challenge page SHALL support three responsive breakpoints with distinct layout behaviors.

#### Scenario: Desktop layout at 1024px and above

- **WHEN** viewport width is ≥ 1024px
- **THEN** the page renders: single-row merged nav bar, two-column content (description 38% left, tools 62% right)

#### Scenario: Tablet layout between 768px and 1023px

- **WHEN** viewport width is 768–1023px
- **THEN** the page renders: condensed merged nav bar (back link as icon, Notes as icon), two-column content (narrower description)

#### Scenario: Mobile layout below 768px

- **WHEN** viewport width is < 768px
- **THEN** the page renders: two-row merged nav bar with hamburger menu, single-column tools-only layout, description collapsed by default (accessible via fullscreen modal), tool tabs as horizontally scrollable bar, flag submission sticky at bottom
