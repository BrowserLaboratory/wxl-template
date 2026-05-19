## MODIFIED Requirements

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL be implemented as a VitePress custom layout (registered under the name `challenge` in `theme/index.ts`) rather than an embeddable Vue component used inside `.md` files. It SHALL render three panels accessible via tab navigation: Browser Panel, Terminal Panel, and Repeater Panel. All three panels SHALL share a single `useChallengeHttp` composable for issuing requests. The layout SHALL receive the challenge `slug` from the page's frontmatter via VitePress's `useData()` composable rather than as a component prop.

#### Scenario: User switches between panels without losing state

- **WHEN** a user switches from the Browser Panel to the Terminal Panel and back
- **THEN** each panel SHALL retain its previous input state (URL, method, request body, response history)

#### Scenario: All panels target the same challenge origin

- **WHEN** any panel sends an HTTP request
- **THEN** the request SHALL target `http://challenge-<slug>.localhost` and be intercepted by the Service Worker

#### Scenario: Layout is activated via frontmatter, not component embedding

- **WHEN** a challenge `.md` file declares `layout: challenge` in its frontmatter
- **THEN** VitePress SHALL render the `ChallengeLayout.vue` layout without any `<ChallengeLayout>` or `<ChallengeUI>` tag appearing in the `.md` content body
