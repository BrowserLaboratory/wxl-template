## MODIFIED Requirements

### Requirement: Challenge pages use a custom VitePress layout registered as "challenge"

**REMOVE** the clause: "the page SHALL NOT include the default VitePress sidebar or navbar".

**REPLACE WITH:** The VitePress theme SHALL always render `DefaultTheme.Layout` as the root layout component. When `frontmatter.layout === 'challenge'`, Layout.vue SHALL inject `ChallengeLayout.vue` via the `#layout-bottom` slot of `DefaultTheme.Layout`. The VitePress navbar (VPNav) SHALL remain visible on challenge pages, preserving dark/light mode toggle, navigation links, and social links.

Layout.vue SHALL use `onMounted` and `watch(frontmatter)` to add the CSS class `challenge-page` to `document.body` when the current page has `layout: challenge`, and remove the class otherwise. This body class toggle MUST be SSR-safe (only executed on the client side).

#### Scenario: Challenge page renders within DefaultTheme.Layout

- **WHEN** a `.md` file with `layout: challenge` in frontmatter is rendered
- **THEN** `DefaultTheme.Layout` SHALL be the root layout component
- **AND** `ChallengeLayout.vue` SHALL be rendered inside the `#layout-bottom` slot
- **AND** the VitePress navbar SHALL be visible with dark/light toggle, nav links, and social links

#### Scenario: Body class is applied on challenge pages

- **WHEN** a challenge page is mounted in the browser
- **THEN** `document.body` SHALL have the class `challenge-page`

#### Scenario: Body class is removed on non-challenge pages

- **WHEN** the user navigates from a challenge page to a non-challenge page
- **THEN** `document.body` SHALL NOT have the class `challenge-page`

## ADDED Requirements

### Requirement: VitePress default content areas are hidden on challenge pages

When `body.challenge-page` is present, the theme CSS SHALL hide the following VitePress default components via `display: none`: VPLocalNav (`.VPLocalNav`), VPSidebar (`.VPSidebar`), VPContent (`.VPContent`), and VPFooter (`.VPFooter`). This MUST be achieved through CSS rules in `style.css`, not through JavaScript DOM manipulation.

#### Scenario: Default content areas hidden on challenge page

- **WHEN** a challenge page is loaded
- **THEN** VPLocalNav, VPSidebar, VPContent, and VPFooter SHALL NOT be visible
- **AND** only the VitePress navbar and the ChallengeLayout (via `#layout-bottom`) SHALL be visible

#### Scenario: Default content areas visible on normal pages

- **WHEN** a non-challenge page is loaded
- **THEN** VPLocalNav, VPSidebar, VPContent, and VPFooter SHALL be visible as normal

### Requirement: ChallengeLayout height accounts for VitePress navbar

`ChallengeLayout.vue` SHALL use `h-[calc(100vh-var(--vp-nav-height))]` instead of `h-screen` for its root container height. The root container SHALL also apply `mt-[var(--vp-nav-height)]` to offset below the fixed VitePress navbar. The CSS variable `--vp-nav-height` is defined by VitePress and MUST be used to ensure synchronization with the navbar height.

#### Scenario: ChallengeLayout fills remaining viewport below navbar

- **WHEN** a challenge page loads
- **THEN** the ChallengeLayout root container height SHALL equal `100vh` minus the VitePress navbar height
- **AND** the ChallengeLayout SHALL be positioned directly below the navbar with no overlap

### Requirement: VitePress config provides navigation, path-based sidebar, and correct social links

The VitePress `config.mts` SHALL define the following in `themeConfig`:

1. `nav` SHALL include at minimum: a 'Home' link (`/`), a 'Challenges' link (`/challenges/`), and a 'Docs' link (`/guide/`).
2. `sidebar` SHALL be a path-based object (not an empty array), allowing different sidebar configurations for different URL paths.
3. `socialLinks` SHALL contain a GitHub link pointing to the correct repository URL for this project.

#### Scenario: Navbar shows navigation links

- **WHEN** any page loads
- **THEN** the VitePress navbar SHALL display links for Home, Challenges, and Docs

#### Scenario: Sidebar is path-aware

- **WHEN** a page under `/guide/` is loaded
- **THEN** the sidebar SHALL show guide-related navigation items
- **WHEN** a challenge page is loaded
- **THEN** the sidebar SHALL be hidden (via the `body.challenge-page` CSS rule)

#### Scenario: Social links point to correct repository

- **WHEN** any page loads
- **THEN** the GitHub social link in the navbar SHALL point to this project's repository, not the VitePress default
