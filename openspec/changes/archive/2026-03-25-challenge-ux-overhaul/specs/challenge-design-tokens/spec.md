## MODIFIED Requirements

### Requirement: VitePress nav hidden on challenge pages

The CSS SHALL hide the VitePress navigation bar (`.VPNav`) on challenge pages in addition to the existing hidden elements (`.VPLocalNav`, `.VPSidebar`, `.VPContent`, `.VPFooter`).

#### Scenario: VPNav hidden on challenge page

- **WHEN** `body` has class `challenge-page`
- **THEN** `.VPNav` has `display: none !important` applied

## ADDED Requirements

### Requirement: Merged nav design tokens

The theme SHALL provide CSS custom properties for the merged navigation bar styling, using the existing `--ch-*` Midnight Indigo palette to ensure visual consistency with the rest of the challenge layout.

#### Scenario: Merged nav uses ch palette

- **WHEN** the merged nav bar renders
- **THEN** its background uses `--ch-bg`, text uses `--ch-text-1`, and accents use `--ch-accent`
