## MODIFIED Requirements

### Requirement: Flag submission always accessible

The flag submission input SHALL be accessible regardless of the description panel state. When the description panel is collapsed, a persistent flag bar SHALL remain visible so users can always submit flags.

#### Scenario: Flag submit visible when description collapsed on desktop

- **WHEN** description is collapsed on Desktop
- **THEN** the flag submission input SHALL be accessible via a persistent flag bar

#### Scenario: Flag submit visible when description collapsed on mobile

- **WHEN** description is collapsed on Mobile
- **THEN** the flag submission input SHALL be accessible via the same persistent flag bar as desktop

#### Scenario: Flag submit visible when description expanded

- **WHEN** the description panel is expanded on any breakpoint
- **THEN** the flag submission input SHALL be visible at the bottom of the description panel

## REMOVED Requirements

### Requirement: Mobile description defaults to collapsed

**Reason:** The current design keeps the description visible by default on all breakpoints, including mobile. There is no separate collapsed-by-default behavior for mobile.

#### Scenario: Removal confirmed

- **WHEN** a user loads a challenge page on a < 768px viewport
- **THEN** the description panel SHALL be visible by default, the same as on desktop and tablet breakpoints

---

### Requirement: Mobile description opens as fullscreen modal

**Reason:** The `DescriptionModal` component exists but is not actively used. The description is toggled via a collapse/expand mechanism on all breakpoints, not via a fullscreen modal overlay.

#### Scenario: Removal confirmed

- **WHEN** the user interacts with the description toggle on mobile
- **THEN** the description SHALL collapse or expand in-place
- **AND** no fullscreen modal overlay SHALL be displayed
