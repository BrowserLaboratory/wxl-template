## MODIFIED Requirements

### Requirement: Homepage uses VitePress home layout with enhanced hero and feature cards

The homepage SHALL use VitePress's built-in `layout: home` with hero and features frontmatter. The `HomeContent.vue` component SHALL use exclusively `--ch-*` design tokens for all color references (backgrounds, text, borders, accents). The component SHALL NOT use VitePress default variables (`--vp-c-*`) directly. Specifically: text colors SHALL use `var(--ch-text-1)`, `var(--ch-text-2)`, `var(--ch-text-3)`; backgrounds SHALL use `var(--ch-bg-soft)` or `var(--ch-bg-card)`; borders SHALL use `var(--ch-border)` with hover state `var(--ch-border-hover)`; accent colors SHALL use `var(--ch-accent)` and `var(--ch-accent-soft)`.

#### Scenario: HomeContent uses ch tokens exclusively

- **WHEN** a developer inspects `HomeContent.vue` source code
- **THEN** all CSS variable references SHALL use `--ch-*` tokens
- **AND** no `--vp-c-*` variable SHALL appear in the component

#### Scenario: Homepage stats cards match platform palette in dark mode

- **WHEN** the homepage is viewed in dark mode
- **THEN** stats cards SHALL use `var(--ch-bg-soft)` for background and `var(--ch-border)` for borders
- **AND** the visual appearance SHALL be consistent with challenge page components

#### Scenario: Homepage latest challenges cards match platform palette

- **WHEN** the homepage is viewed in dark mode
- **THEN** challenge cards SHALL use `var(--ch-bg-soft)` background, `var(--ch-border)` border, and `var(--ch-accent)` for hover border
- **AND** text colors SHALL use `var(--ch-text-1)` for titles, `var(--ch-text-2)` for descriptions, `var(--ch-text-3)` for dates
