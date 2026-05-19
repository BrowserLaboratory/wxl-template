## MODIFIED Requirements

### Requirement: Challenge list page uses a globally registered Vue component embedded in markdown

The challenge list display logic SHALL be implemented as a Vue component (`theme/components/ChallengeList.vue`) globally registered in `enhanceApp` via `app.component('ChallengeList', ChallengeList)`. The `docs/challenges.md` page SHALL use the VitePress default layout and embed `<ChallengeList />` directly in the markdown body. The `challenge-list` layout registration in `theme/index.ts` SHALL be removed, and `ChallengeListLayout.vue` SHALL be deleted.

#### Scenario: Challenge list page renders without layout frontmatter

- **WHEN** the user navigates to `/challenges`
- **THEN** VitePress SHALL apply the default layout and the `<ChallengeList />` component SHALL render all available challenges

#### Scenario: ChallengeList can be embedded in any markdown page

- **WHEN** any `.md` file includes `<ChallengeList />` in its body
- **THEN** the component SHALL render the full challenge list without requiring `layout: challenge-list` in frontmatter
