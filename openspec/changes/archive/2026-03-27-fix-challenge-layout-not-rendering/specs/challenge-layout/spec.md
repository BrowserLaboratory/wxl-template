## MODIFIED Requirements

### Requirement: Challenge pages use a custom VitePress layout registered as "challenge"

The VitePress theme `index.ts` SHALL use object spread (`...DefaultTheme`) instead of `extends: DefaultTheme` to inherit from the default theme. The theme SHALL define `Layout` as a `defineComponent` with a `setup` function that returns a render function. When `frontmatter.layout === 'challenge'`, the render function SHALL return `h(ChallengeLayout)`. For all other layout values, the render function SHALL return `h(DefaultTheme.Layout)`.

The `enhanceApp` function SHALL explicitly call `DefaultTheme.enhanceApp?.({ app })` before registering project-specific components and plugins to preserve the default theme's functionality.

The `setup` function SHALL use `onMounted` to add the CSS class `challenge-page` to `document.body` when the current page has `layout: challenge`, and `onUnmounted` to remove the class. This body class toggle MUST be SSR-safe (lifecycle hooks only execute on the client side).

`Layout.vue` SHALL NOT be imported by `index.ts`. The layout switching logic SHALL be fully contained within the `defineComponent` in `index.ts`.

#### Scenario: Challenge page renders ChallengeLayout directly

- **WHEN** a `.md` file with `layout: challenge` in frontmatter is rendered
- **THEN** the Layout component SHALL render `ChallengeLayout` directly via `h(ChallengeLayout)`
- **AND** `DefaultTheme.Layout` SHALL NOT be rendered for that page
- **AND** `ChallengeLayout` SHALL be visible with MergedNav, description panel, tool tabs, and FlagSubmit

#### Scenario: Non-challenge page renders DefaultTheme.Layout

- **WHEN** a `.md` file without `layout: challenge` (or with `layout: doc`, `layout: page`, `layout: home`) is rendered
- **THEN** the Layout component SHALL render `DefaultTheme.Layout` via `h(DefaultTheme.Layout)`
- **AND** the standard VitePress navigation and content layout SHALL be visible

#### Scenario: Body class is applied on challenge pages

- **WHEN** a challenge page is mounted in the browser
- **THEN** `document.body` SHALL have the class `challenge-page`

#### Scenario: Body class is removed on non-challenge pages

- **WHEN** the user navigates from a challenge page to a non-challenge page
- **THEN** `document.body` SHALL NOT have the class `challenge-page`

#### Scenario: DefaultTheme functionality is preserved

- **WHEN** the theme is loaded
- **THEN** `DefaultTheme.enhanceApp` SHALL be called before project-specific `enhanceApp` logic
- **AND** all DefaultTheme styles and components SHALL be available
