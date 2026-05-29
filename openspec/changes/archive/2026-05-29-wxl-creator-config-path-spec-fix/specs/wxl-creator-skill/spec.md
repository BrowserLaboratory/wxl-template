## MODIFIED Requirements

### Requirement: Fix loop has a configurable maximum iteration limit

The auto-fix loop SHALL have a maximum iteration limit to prevent infinite loops. The default limit SHALL be 10 attempts.

The limit SHALL be configurable via `.wxl-creator/config.yaml`:

```yaml
# wxl-creator skill configuration
max_fix_attempts: 10
```

If the config file does not exist, the skill SHALL use the default value of 10.

#### Scenario: Loop reaches maximum limit

- **WHEN** the auto-fix loop reaches the configured maximum (e.g., 10 attempts) without all checks passing
- **THEN** the skill SHALL display the remaining errors/warnings and stop, informing the user that the limit has been reached

#### Scenario: Custom limit configured

- **WHEN** `.wxl-creator/config.yaml` contains `max_fix_attempts: 5`
- **THEN** the auto-fix loop SHALL stop after 5 attempts if checks still fail

#### Scenario: Config file does not exist

- **WHEN** `.wxl-creator/config.yaml` does not exist
- **THEN** the skill SHALL use the default limit of 10 attempts
