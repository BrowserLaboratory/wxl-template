## MODIFIED Requirements

### Requirement: Challenge page header structure

The challenge page SHALL render a single merged navigation bar instead of a separate challenge header below the VitePress nav. The merged nav bar combines challenge metadata (title, badges, status) with site navigation (back link, brand, dark mode toggle) in a single ~40px bar.

#### Scenario: Challenge page with merged nav

- **WHEN** user navigates to a challenge page
- **THEN** only one navigation bar is rendered (merged nav)
- **AND** the VitePress default nav bar is hidden
- **AND** the challenge title, difficulty badge, category badge, and runtime status are displayed in the merged nav bar

### Requirement: Description panel collapse behavior

The description panel SHALL support full collapse on all viewport sizes. When collapsed on Desktop/Tablet, the tools panel SHALL expand to 100% width. When expanded on Desktop/Tablet, the description panel SHALL occupy 38% width.

#### Scenario: Description collapsed on desktop

- **WHEN** user clicks the collapse button on the description panel at ≥ 768px
- **THEN** the description panel is completely hidden
- **AND** the tools panel occupies 100% of the content width

## REMOVED Requirements

### Requirement: Separate challenge header bar

**Reason**: Replaced by the merged navigation bar that combines VitePress nav and challenge header into a single bar.
**Migration**: Challenge metadata (title, badges, status, Notes button) is now rendered within the merged nav bar component instead of a separate `<header>` element.

#### Scenario: No separate header on challenge page

- **WHEN** user navigates to a challenge page
- **THEN** no separate challenge header bar is rendered below the navigation
