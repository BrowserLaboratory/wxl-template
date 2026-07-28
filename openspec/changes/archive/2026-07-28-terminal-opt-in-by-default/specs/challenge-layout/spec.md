## MODIFIED Requirements

### Requirement: Challenge layout renders a left-right split view

The `ChallengeLayout.vue` SHALL render a two-column layout: a left column containing the markdown description panel and flag submit form, and a right column containing the interaction panels.

The right column SHALL render a tab bar whose entries are determined by the challenge's `tools` frontmatter field as defined by the challenge-tools-control capability. The number of tabs SHALL therefore vary by challenge and SHALL NOT be assumed to be five. A challenge that does not declare `tools` SHALL show four tabs (Browser, Network, Repeater, Code).

The panel components themselves SHALL remain mounted regardless of which tabs are displayed, with visibility governed by the currently active tab.

No control SHALL make a panel active while its tab is absent from the tab bar. This applies to programmatic navigation as well as to the tab bar itself: the Traffic Log's send-to-repeater action SHALL be inert on a challenge that did not grant the Repeater, rather than opening a panel the reader has no tab to leave by. A panel that never becomes active never obtains non-zero container dimensions, so any panel that defers initialization until its container has dimensions SHALL NOT initialize while its tab is absent.

#### Scenario: Left and right columns are both visible

- **WHEN** a challenge page loads
- **THEN** the left column (description + flag submit) and the right column (interaction panels with its tab bar) SHALL both be visible simultaneously

#### Scenario: Send to Repeater is inert without a Repeater tab

- **WHEN** a challenge declares `tools: [browser, network]` and the reader activates send-to-repeater on a Traffic Log entry
- **THEN** the active tab SHALL remain unchanged
- **AND** the Repeater panel SHALL NOT become visible

#### Scenario: Tab bar reflects the challenge tool allowlist

- **WHEN** a challenge page loads without a `tools` frontmatter field
- **THEN** the right column's tab bar SHALL contain four tabs
- **AND** no tab bar entry SHALL address the Terminal panel
