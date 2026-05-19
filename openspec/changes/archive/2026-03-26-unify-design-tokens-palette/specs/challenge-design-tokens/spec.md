## ADDED Requirements

### Requirement: VitePress default variables bridge to ch tokens

The `style.css` SHALL override VitePress default CSS variables to point to the corresponding `--ch-*` tokens. Specifically: `--vp-c-bg-soft` SHALL resolve to `var(--ch-bg-soft)`, `--vp-c-text-1` to `var(--ch-text-1)`, `--vp-c-text-2` to `var(--ch-text-2)`, `--vp-c-text-3` to `var(--ch-text-3)`, and `--vp-c-divider` to `var(--ch-border)`. This ensures all VitePress default-layout pages (docs, guide) follow the platform color scheme.

#### Scenario: Guide page follows platform palette in dark mode

- **WHEN** a user visits a docs/guide page with dark mode enabled
- **THEN** the background, text, and border colors SHALL match the platform's `--ch-*` dark mode palette instead of VitePress defaults

### Requirement: Feature card icons use rounded-square container

VitePress feature cards on the homepage SHALL render SVG icons inside a rounded-square container with a semi-transparent background and subtle border. In dark mode the container SHALL use `rgba(99,102,241,0.12)` background with `rgba(99,102,241,0.2)` border and the icon stroke color SHALL be `#a5b4fc`. In light mode the container SHALL use `rgba(67,56,202,0.08)` background with `rgba(67,56,202,0.12)` border and the icon stroke color SHALL be `var(--ch-accent)`. The container SHALL have `border-radius: 12px`.

#### Scenario: Dark mode feature card icon is clearly visible

- **WHEN** the homepage is viewed in dark mode
- **THEN** each feature card icon SHALL have a visible rounded-square container with indigo-tinted background
- **AND** the icon stroke color SHALL be bright purple-blue (`#a5b4fc`) providing high contrast against the dark card background

#### Scenario: Light mode feature card icon has consistent styling

- **WHEN** the homepage is viewed in light mode
- **THEN** each feature card icon SHALL have a rounded-square container with light indigo background
- **AND** the icon stroke color SHALL be the platform accent color

### Requirement: Dark mode icon token

The design token system SHALL define a `--ch-icon` token for icon colors. In light mode, `--ch-icon` SHALL resolve to `var(--ch-accent)`. In dark mode, `--ch-icon` SHALL resolve to `#a5b4fc`.

#### Scenario: Icon token used across components

- **WHEN** a component references `var(--ch-icon)` for icon coloring
- **THEN** the icon SHALL be bright purple-blue in dark mode and dark indigo in light mode

## MODIFIED Requirements

### Requirement: Platform defines a CSS custom property token system as single source of truth

The `style.css` file SHALL define all platform color tokens as CSS custom properties under the `:root` and `.dark` selectors. The tokens SHALL include background (`--ch-bg`, `--ch-bg-soft`, `--ch-bg-card`, `--ch-bg-panel`), border (`--ch-border`, `--ch-border-hover`), accent (`--ch-accent`, `--ch-accent-soft`), text (`--ch-text-1`, `--ch-text-2`, `--ch-text-3`), icon (`--ch-icon`), and difficulty badge colors. In dark mode, `--ch-border` SHALL be `#2d2d55`, `--ch-bg-card` SHALL be `#15152f`, and `--ch-icon` SHALL be `#a5b4fc`. VitePress brand variables SHALL point to the corresponding `--ch-*` tokens, and VitePress default layout variables (`--vp-c-bg-soft`, `--vp-c-text-*`, `--vp-c-divider`) SHALL also bridge to `--ch-*` tokens.

#### Scenario: All design tokens defined in style.css

- **WHEN** a developer inspects the CSS custom properties on `:root` and `.dark`
- **THEN** all `--ch-*` tokens SHALL be present and VitePress `--vp-c-brand-*` and `--vp-c-bg-soft`/`--vp-c-text-*`/`--vp-c-divider` SHALL resolve to `--ch-*` values

#### Scenario: Dark mode tokens provide sufficient contrast

- **WHEN** dark mode is enabled
- **THEN** `--ch-border` SHALL be `#2d2d55` (visible against `--ch-bg-card` `#15152f`)
- **AND** `--ch-icon` SHALL be `#a5b4fc` (high contrast against dark backgrounds)
