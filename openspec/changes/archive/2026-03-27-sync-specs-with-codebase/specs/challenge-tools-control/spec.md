## MODIFIED Requirements

### Requirement: Tier 5 command allowlist via commands field

The challenge frontmatter SHALL support an optional `commands` field that controls which Tier 5 penetration testing tools are available in the terminal. The `commands` field is defined in the spec and recognized in frontmatter, but the pipeline from frontmatter to WxlshPanel is not yet connected. Full implementation of `commands` filtering in WxlshPanel SHALL be treated as future work.

The `tools` field (tab allowlist) works correctly and SHALL continue to control which UI tabs are displayed.

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
