## MODIFIED Requirements

### Requirement: Unsupported real parameters reported explicitly

For Tier 5 tools implemented as simplified rewrites, any real parameter that is recognized but not implemented SHALL produce an explicit message indicating the parameter exists in the real tool but is not supported in this environment, with a link to the official documentation.

> **Future work:** Parameter-level allow/deny checking for Tier 5 commands is not yet implemented. Currently, Tier 5 commands only check command-name-level allow/deny via the challenge frontmatter `commands` field. Unsupported parameters within an allowed Tier 5 command are not individually detected or reported.

#### Scenario: Tier 5 commands use name-level gating only

- **WHEN** a user types a Tier 5 command (e.g., `sqlmap`) that is listed in the challenge `commands` field
- **THEN** the command SHALL execute regardless of which parameters are passed
- **AND** no per-parameter validation or "unsupported parameter" messages SHALL be displayed

#### Scenario: Unknown option falls through to command handler

- **WHEN** a user types a Tier 5 command with an unknown flag (e.g., `sqlmap --nonexistent-flag`)
- **THEN** the behavior SHALL be determined by the command's own handler, not by a parameter-level checker
