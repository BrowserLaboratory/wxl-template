## MODIFIED Requirements

### Requirement: UI tab allowlist via tools field

The challenge frontmatter SHALL support an optional `tools` field (array of tab IDs) that controls which UI tabs are displayed. Valid tab IDs: `browser`, `network`, `repeater`, `terminal`, `code`.

When the `tools` field is absent, the displayed tab set SHALL be `browser`, `network`, `repeater`, and `code`. The Terminal tab SHALL NOT be displayed unless the challenge lists `terminal` in its `tools` field, so terminal access is a capability the challenge author grants explicitly rather than one the platform supplies by default.

When the `tools` field is present, the displayed tab set SHALL be the union of `browser` and the listed tab IDs, regardless of whether `browser` itself appears in the list. Tabs SHALL be rendered in the platform's canonical tab order (`browser`, `network`, `repeater`, `terminal`, `code`) rather than the order the author wrote them, and a tab ID repeated in the list SHALL NOT produce a duplicate tab.

A `tools` field present but set to an empty array SHALL be treated as an explicitly empty allowlist, yielding `browser` alone — not as equivalent to an absent field.

A `tools` field whose value is not an array — for example a bare `tools:` line, which YAML parses as null — SHALL be treated as absent, yielding the default tab set, rather than as an empty allowlist. The layout reads raw frontmatter, so this case reaches it unvalidated and SHALL NOT raise.

Omitting `browser` from a non-empty `tools` list SHALL NOT be reported as an error by any validation or authoring tool; the tab is injected silently.

#### Scenario: Terminal excluded by default

- **WHEN** frontmatter does not contain a `tools` field
- **THEN** the Browser, Network, Repeater, and Code tabs SHALL be displayed
- **AND** the Terminal tab SHALL NOT be displayed

#### Scenario: Terminal enabled by explicit opt-in

- **WHEN** frontmatter contains a `tools` field whose value includes `terminal`
- **THEN** the Terminal tab SHALL be displayed

#### Scenario: Browser injected into an explicit allowlist

- **WHEN** frontmatter contains `tools: [code]`
- **THEN** the Browser and Code tabs SHALL be displayed
- **AND** the Browser tab SHALL be displayed even though the author did not list it

#### Scenario: Empty allowlist yields browser only

- **WHEN** frontmatter contains `tools: []`
- **THEN** only the Browser tab SHALL be displayed

#### Scenario: Restricted tab set

- **WHEN** frontmatter contains `tools: [browser, terminal, code]`
- **THEN** only Browser, Terminal, and Code tabs are displayed
- **AND** Network and Repeater tabs are hidden

### Requirement: Tier 5 command allowlist via commands field

The challenge frontmatter SHALL support an optional `commands` field that controls which Tier 5 penetration testing tools are available in the terminal. The `commands` field is defined in the spec and recognized in frontmatter, but the pipeline from frontmatter to WxlshPanel is not yet connected. Full implementation of `commands` filtering in WxlshPanel SHALL be treated as future work.

The `tools` field (tab allowlist) works correctly and SHALL continue to control which UI tabs are displayed.

Because the Terminal tab is not displayed unless `terminal` appears in `tools`, the `commands` field SHALL have no observable effect on a challenge that does not grant the Terminal tab.

#### Scenario: Default no Tier 5 commands

- **WHEN** frontmatter does not contain a `commands` field
- **THEN** all Tier 5 commands (dirb, dirsearch, sqlmap, jwt, hydra, nmap) are disabled

#### Scenario: Specific commands enabled (future work)

- **WHEN** frontmatter contains `commands: [sqlmap, dirb]`
- **THEN** only `sqlmap` and `dirb` SHALL be available as Tier 5 commands once the frontmatter-to-WxlshPanel pipeline is implemented
- **AND** other Tier 5 commands SHALL return "not available for this challenge"
- **NOTE:** This scenario documents the intended behavior; the pipeline is not yet connected

#### Scenario: All commands enabled (future work)

- **WHEN** frontmatter contains `commands: all`
- **THEN** all Tier 5 commands SHALL be enabled once the frontmatter-to-WxlshPanel pipeline is implemented
- **NOTE:** This scenario documents the intended behavior; the pipeline is not yet connected

#### Scenario: Tools field controls tab visibility independently

- **WHEN** frontmatter contains `tools: [browser, terminal, code]`
- **THEN** only Browser, Terminal, and Code tabs SHALL be displayed
- **AND** Network and Repeater tabs SHALL be hidden
- **AND** this behavior SHALL work correctly regardless of the `commands` field implementation status
