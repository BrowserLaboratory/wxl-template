## MODIFIED Requirements

### Requirement: ChallengeConfig schema

The ChallengeConfig interface SHALL include the following fields: `title` (required), `backend` (required), `app` (required, relative to src/), `flag` (optional, default "flag.txt", relative to src/), `tools` (optional, array of tab IDs), `commands` (optional, array of Tier 5 command names or "all"), `source_visible`, `packages`, `wasmModule`, `difficulty`, `category`, `description`, `date`, `tags`. The `fs` field SHALL be removed from the schema.

#### Scenario: Valid config with new fields

- **WHEN** frontmatter contains `app: app.py`, `flag: secret/flag.txt`, `tools: [browser, terminal]`, `commands: [sqlmap]`
- **THEN** validation passes

#### Scenario: Legacy fs field triggers warning

- **WHEN** frontmatter contains an `fs` field
- **THEN** the validator logs a deprecation warning

### Requirement: Valid tools values

The `tools` field SHALL only accept values from the set: `browser`, `network`, `repeater`, `terminal`, `code`.

#### Scenario: Invalid tools value rejected

- **WHEN** frontmatter contains `tools: [browser, invalid]`
- **THEN** validation fails with an error indicating `invalid` is not a valid tab ID

### Requirement: Valid commands values

The `commands` field SHALL only accept values from the set: `dirb`, `dirsearch`, `sqlmap`, `jwt`, `hydra`, `nmap`, or the string `all`.

#### Scenario: Invalid commands value rejected

- **WHEN** frontmatter contains `commands: [sqlmap, fake_tool]`
- **THEN** validation fails with an error indicating `fake_tool` is not a valid command
