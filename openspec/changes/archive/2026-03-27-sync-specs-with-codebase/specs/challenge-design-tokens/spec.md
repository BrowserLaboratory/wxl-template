## MODIFIED Requirements

### Requirement: Feature card icons use rounded-square container

VitePress feature cards on the homepage SHALL render SVG icons inside a rounded-square container with a semi-transparent background and subtle border. In dark mode the container SHALL use `rgba(99,102,241,0.15)` background with `rgba(99,102,241,0.2)` border and the icon stroke color SHALL be achieved via CSS filter (`brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(210deg) brightness(1.2)`) which approximates the target `#a5b4fc` color. In light mode the container SHALL use `rgba(67,56,202,0.08)` background with `rgba(67,56,202,0.12)` border and the icon stroke color SHALL be `var(--ch-accent)`. The container SHALL have `border-radius: 12px`.

#### Scenario: Dark mode feature card icon is clearly visible

- **WHEN** the homepage is viewed in dark mode
- **THEN** each feature card icon SHALL have a visible rounded-square container with `rgba(99,102,241,0.15)` background
- **AND** the icon stroke color SHALL be applied via CSS filter (`brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(210deg) brightness(1.2)`) approximating bright purple-blue, providing high contrast against the dark card background

#### Scenario: Light mode feature card icon has consistent styling

- **WHEN** the homepage is viewed in light mode
- **THEN** each feature card icon SHALL have a rounded-square container with light indigo background
- **AND** the icon stroke color SHALL be the platform accent color
