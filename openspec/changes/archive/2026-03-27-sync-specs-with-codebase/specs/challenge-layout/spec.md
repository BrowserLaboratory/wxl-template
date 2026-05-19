## MODIFIED Requirements

### Requirement: Challenge pages use a custom VitePress layout registered as "challenge"

**REMOVE** the clause: "the page SHALL NOT include the default VitePress sidebar or navbar".

**REPLACE WITH:** The VitePress theme SHALL always render `DefaultTheme.Layout` as the root layout component. When `frontmatter.layout === 'challenge'`, Layout.vue SHALL inject `ChallengeLayout.vue` via the `#layout-bottom` slot of `DefaultTheme.Layout`. The VitePress navbar (VPNav) SHALL be hidden on challenge pages; MergedNav replaces it.

Layout.vue SHALL use `onMounted` and `watch(frontmatter)` to add the CSS class `challenge-page` to `document.body` when the current page has `layout: challenge`, and remove the class otherwise. This body class toggle MUST be SSR-safe (only executed on the client side).

#### Scenario: Challenge page renders within DefaultTheme.Layout

- **WHEN** a `.md` file with `layout: challenge` in frontmatter is rendered
- **THEN** `DefaultTheme.Layout` SHALL be the root layout component
- **AND** `ChallengeLayout.vue` SHALL be rendered inside the `#layout-bottom` slot
- **AND** the VitePress navbar (VPNav) SHALL be hidden via CSS
- **AND** MergedNav SHALL be visible as the replacement navigation

#### Scenario: Body class is applied on challenge pages

- **WHEN** a challenge page is mounted in the browser
- **THEN** `document.body` SHALL have the class `challenge-page`

#### Scenario: Body class is removed on non-challenge pages

- **WHEN** the user navigates from a challenge page to a non-challenge page
- **THEN** `document.body` SHALL NOT have the class `challenge-page`

---

### Requirement: VitePress default content areas are hidden on challenge pages

When `body.challenge-page` is present, the theme CSS SHALL hide the following VitePress default components via `display: none`: VPNav (`.VPNav`), VPLocalNav (`.VPLocalNav`), VPSidebar (`.VPSidebar`), VPContent (`.VPContent`), and VPFooter (`.VPFooter`). This MUST be achieved through CSS rules in `style.css`, not through JavaScript DOM manipulation.

#### Scenario: Default content areas hidden on challenge page

- **WHEN** a challenge page is loaded
- **THEN** VPNav, VPLocalNav, VPSidebar, VPContent, and VPFooter SHALL NOT be visible
- **AND** only MergedNav and the ChallengeLayout (via `#layout-bottom`) SHALL be visible

#### Scenario: Default content areas visible on normal pages

- **WHEN** a non-challenge page is loaded
- **THEN** VPNav, VPLocalNav, VPSidebar, VPContent, and VPFooter SHALL be visible as normal

---

### Requirement: ChallengeLayout height accounts for VitePress navbar

`ChallengeLayout.vue` SHALL use `h-[calc(100vh-var(--vp-nav-height))]` for its root container height. Because VPNav is hidden on challenge pages and `--vp-nav-height` is set to `0px`, the layout effectively fills the full viewport height. The root container SHALL NOT apply `mt-[var(--vp-nav-height)]` since the navbar is hidden and no margin-top offset is needed.

#### Scenario: ChallengeLayout fills full viewport when navbar is hidden

- **WHEN** a challenge page loads
- **AND** VPNav is hidden with `--vp-nav-height` set to `0px`
- **THEN** the ChallengeLayout root container height SHALL equal `100vh` (since `calc(100vh - 0px)` = `100vh`)
- **AND** no margin-top SHALL be applied to the ChallengeLayout root container

## REMOVED Requirements

### Requirement: ChallengeLayout applies mt-[var(--vp-nav-height)] margin

**Reason:** Since VPNav is hidden on challenge pages and `--vp-nav-height` is set to `0px`, there is no fixed navbar to offset below. The `mt-[var(--vp-nav-height)]` margin-top is unnecessary and has been removed.

#### Scenario: Removal confirmed

- **WHEN** a challenge page loads
- **THEN** the ChallengeLayout root container SHALL NOT have a margin-top offset for the navbar
