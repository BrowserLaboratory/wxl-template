## REMOVED Requirements

### Requirement: Skill collects challenge parameters interactively

**Reason**: wxl-creator is split by CLI verb; the interactive parameter collection moves to the dedicated wxl-create skill.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill collects challenge parameters interactively".

### Requirement: Skill calls create:challenge for scaffolding

**Reason**: Scaffolding belongs to the Create verb.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill calls create:challenge for scaffolding".

### Requirement: Skill generates vulnerable application code

**Reason**: Vulnerable-code generation belongs to the Create verb.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill generates vulnerable application code".

### Requirement: Skill updates index.md frontmatter with metadata

**Reason**: Frontmatter update belongs to the Create verb.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill updates index.md frontmatter with metadata".

### Requirement: Skill runs analyze and validate after creation

**Reason**: The layered verify gate is extracted into the shared wxl-verify skill so Create and Mutate both hand off to it.
**Migration**: See the `wxl-verify-skill` capability, Requirement "Skill runs the layered challenge:verify gate".

### Requirement: Skill auto-fixes validation errors with user confirmation

**Reason**: The auto-fix loop is extracted into the shared wxl-verify skill.
**Migration**: See the `wxl-verify-skill` capability, Requirement "Skill auto-fixes validation errors with plain-text confirmation".

### Requirement: Fix loop has a configurable maximum iteration limit

**Reason**: The fix loop and its config move to the wxl-verify skill; the config file re-homes to `.wxl-verify/config.yaml`.
**Migration**: See the `wxl-verify-skill` capability, Requirement "Fix loop has a configurable maximum iteration limit".

### Requirement: Skill uses canonical reference example for code generation style

**Reason**: Canonical reference usage belongs to the Create verb.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill uses canonical reference example for code generation style".

### Requirement: Skill prose is host-agent-neutral

**Reason**: Host-agent neutrality is a cross-cutting concern already governed generically for every authoring skill by the authoring-skill-pattern capability.
**Migration**: See the `authoring-skill-pattern` capability, Requirement "Host-agent-neutral skill prose"; it applies to `.agent/skills/wxl-create/`, `.agent/skills/wxl-mutate/`, `.agent/skills/wxl-verify/`, and `.agent/skills/wxl-crosscheck/`.

### Requirement: Skill is installed via a single source with thin pointer files

**Reason**: The single-source-plus-thin-pointer install pattern is a cross-cutting concern already governed generically by the authoring-skill-pattern capability.
**Migration**: See the `authoring-skill-pattern` capability, Requirements "Authoring skill canonical source location" and "Thin pointer files for each official host agent".

### Requirement: Skill generates a Playwright e2e spec for each new challenge

**Reason**: Playwright spec generation belongs to the Create verb.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill generates a Playwright e2e spec for each new challenge".

### Requirement: Skill performs best-effort exploit self-test via chrome-devtools-mcp

**Reason**: The best-effort self-test belongs to the Create verb.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill performs best-effort exploit self-test via chrome-devtools-mcp".

### Requirement: Skill supports the mutate stage via challenge:retype

**Reason**: The Mutate stage becomes its own wxl-mutate skill.
**Migration**: See the `wxl-mutate-skill` capability, Requirement "Skill supports the mutate stage via challenge:retype".

### Requirement: Skill triggers challenge:verify automatically at the end of the Create flow

**Reason**: The Create-flow verify trigger belongs to the Create verb, handing off to wxl-verify.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill triggers challenge:verify automatically at the end of the Create flow".

### Requirement: Skill consumes capability-specific reference documents via a registry table

**Reason**: The capability-pack registry table belongs to the Create verb.
**Migration**: See the `wxl-create-skill` capability, Requirement "Skill consumes capability-specific reference documents via a registry table".
