## MODIFIED Requirements

### Requirement: Description panel renders markdown via Content component and is collapsible

The left column SHALL include a description panel that renders the challenge page's markdown content using VitePress's `<Content />` component. The `<Content />` component SHALL be wrapped in a container element with the `vp-doc` CSS class to ensure VitePress typography styles (headings, code blocks, blockquotes, lists) are applied correctly. The panel SHALL be collapsible: clicking a toggle button SHALL collapse the panel to a minimal width and expand the right column to fill the remaining space. Clicking again SHALL restore the panel.

#### Scenario: Description markdown is rendered with VitePress typography

- **WHEN** a challenge page loads
- **THEN** the description panel SHALL render the markdown content as formatted HTML with VitePress typography styles applied (headings SHALL be styled, inline code SHALL have background highlight, blockquotes SHALL be visually distinct)

#### Scenario: vp-doc wrapper is present in the DOM

- **WHEN** the challenge page renders
- **THEN** the element wrapping `<Content />` SHALL have the `vp-doc` CSS class

#### Scenario: User collapses the description panel

- **WHEN** the user clicks the collapse toggle
- **THEN** the description panel SHALL animate to minimal width and the right column SHALL expand to fill the space

#### Scenario: User expands the description panel

- **WHEN** the description panel is collapsed and the user clicks the toggle
- **THEN** the description panel SHALL animate back to its original width
