## ADDED Requirements

### Requirement: Merged navigation bar replaces dual-bar layout

On challenge pages (`layout: challenge`), the system SHALL hide the VitePress default navigation bar and render a single merged navigation bar (~40px height) that combines all navigation and challenge metadata functions.

#### Scenario: Challenge page renders merged nav

- **WHEN** user navigates to a challenge page
- **THEN** the VitePress nav bar is hidden via CSS `display: none !important` on `.VPNav`
- **AND** a single merged nav bar is rendered containing: WXL brand, ← Challenges link, challenge title, difficulty badge, category badge, runtime status indicator, Notes button, dark mode toggle, and GitHub link

### Requirement: Merged nav A2 compact left-heavy layout

The merged nav bar SHALL use a left-heavy flow layout: brand logo, separator, back link, separator, challenge title, and badges flow left-to-right. Utility controls (runtime status, Notes, dark mode, GitHub) SHALL be positioned on the right side.

#### Scenario: Desktop full bar content

- **WHEN** viewport width is ≥ 1024px
- **THEN** the left section displays: "WXL" brand | "← Challenges" link | challenge title | difficulty badge | category badge
- **AND** the right section displays: runtime status dot (green when ready) | "📝 Notes" button | dark mode toggle | GitHub link

#### Scenario: Tablet condensed bar

- **WHEN** viewport width is 768–1023px
- **THEN** the back link displays as "←" icon only (without "Challenges" text)
- **AND** the Notes button displays as icon only (without "Notes" text)

#### Scenario: Mobile two-row bar

- **WHEN** viewport width is < 768px
- **THEN** the nav bar splits into two rows: row 1 contains brand + back + utilities; row 2 contains challenge title + badges + "📖 題目" button
- **AND** a hamburger menu (☰) appears in row 1 to contain Home/Docs/GitHub links

### Requirement: Non-challenge pages retain VitePress nav

The system SHALL NOT modify VitePress navigation on non-challenge pages (home, docs, challenge list).

#### Scenario: Docs page renders default VitePress nav

- **WHEN** user navigates to a docs page
- **THEN** the VitePress default nav bar is displayed normally
- **AND** no merged nav bar is rendered
