## ADDED Requirements

### Requirement: UI tab allowlist via tools field

The challenge frontmatter SHALL support an optional `tools` field (array of tab IDs) that controls which UI tabs are displayed. Valid tab IDs: `browser`, `network`, `repeater`, `terminal`, `code`.

#### Scenario: Default all tabs enabled

- **WHEN** frontmatter does not contain a `tools` field
- **THEN** all five tabs (browser, network, repeater, terminal, code) are displayed

#### Scenario: Restricted tab set

- **WHEN** frontmatter contains `tools: [browser, terminal, code]`
- **THEN** only Browser, Terminal, and Code tabs are displayed
- **AND** Network and Repeater tabs are hidden

### Requirement: Tier 5 command allowlist via commands field

The challenge frontmatter SHALL support an optional `commands` field that controls which Tier 5 penetration testing tools are available in the terminal.

#### Scenario: Default no Tier 5 commands

- **WHEN** frontmatter does not contain a `commands` field
- **THEN** all Tier 5 commands (dirb, dirsearch, sqlmap, jwt, hydra, nmap) are disabled

#### Scenario: Specific commands enabled

- **WHEN** frontmatter contains `commands: [sqlmap, dirb]`
- **THEN** only `sqlmap` and `dirb` are available as Tier 5 commands
- **AND** other Tier 5 commands return "not available for this challenge"

#### Scenario: All commands enabled

- **WHEN** frontmatter contains `commands: all`
- **THEN** all Tier 5 commands are enabled
