# wxl-verify-skill Specification

## Purpose

TBD - created by archiving change 'split-wxl-creator-skills'. Update Purpose after archive.

## Requirements

### Requirement: Skill runs the layered challenge:verify gate

The `wxl-verify` skill SHALL execute `pnpm challenge:verify <slug>` (without `--blind`) as the release-blocking gate for a challenge, whether invoked directly or handed off from the `wxl-create` and `wxl-mutate` skills. The L1 sub-layer invokes the frontmatter and structure lint, the L2 sub-layer invokes content analysis plus keygen and `wasm-tools validate`, and the L3 sub-layer runs the Playwright e2e exploit spec. The skill SHALL display the layered results (L1 / L2 / L3) to the user. The L4 blind-solve gate SHALL NOT be triggered by this skill.

#### Scenario: Verify exits with code 0

- **WHEN** `pnpm challenge:verify <slug>` exits with code 0
- **THEN** the skill SHALL display a success message listing each passed layer and the challenge SHALL be considered gate-clean

#### Scenario: Verify exits with non-zero code

- **WHEN** `pnpm challenge:verify <slug>` exits with code 1
- **THEN** the skill SHALL enter the auto-fix loop and address the failing layer

#### Scenario: Verify reports L1 or L2 warnings

- **WHEN** `pnpm challenge:verify <slug>` exits with code 0 but stdout indicates L1 / L2 warnings (e.g., hardcoded localhost reference, flag format mismatch)
- **THEN** the skill SHALL display the warnings and enter the auto-fix loop to address them

#### Scenario: Host-agent-neutral primitive check

- **WHEN** a maintainer greps the skill prose for `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, or `subagent_type`
- **THEN** no matches SHALL be found under `.agent/skills/wxl-verify/`

---
### Requirement: Skill auto-fixes validation errors with plain-text confirmation

When `pnpm challenge:verify <slug>` (without `--blind`) reports errors or warnings, the `wxl-verify` skill SHALL enter an auto-fix loop. The confirmation step SHALL be implemented as a plain-text confirmation prompt; the skill SHALL NOT invoke `AskUserQuestion` or any host-agent-specific confirmation primitive. The auto-fix loop:

1. Parse the error / warning output
2. Attempt to fix the identified issues automatically (e.g., correct frontmatter fields, add missing files, repair flag format)
3. Display the proposed changes (diff form) to the user
4. Emit a plain-text confirmation prompt and wait for the user's next message before applying the changes
5. After applying, re-run `pnpm challenge:verify <slug>`
6. Repeat until all layers pass or the loop limit is reached

The confirmation prompt SHALL be a plain-text block — NOT `AskUserQuestion` — that lists the proposed change summary and explicitly accepts `apply` / `skip` (or equivalent text) as the next response. When the failing challenge's `tags` array intersects the taxonomy declared by a registered capability pack, the skill SHALL read that capability's reference document (e.g., `.agent/skills/wxl-create/reference/a01-access-control.md`) and consult its `Per-primitive fix hints` section before proposing repair-loop fixes.

#### Scenario: Auto-fix succeeds on first attempt

- **WHEN** verify fails due to a missing `description` field in frontmatter
- **THEN** the skill SHALL add the field, emit a plain-text "apply this fix? reply apply / skip" prompt, wait for the user response, apply the fix on confirmation, and re-verify successfully

#### Scenario: User rejects a proposed fix

- **WHEN** the skill emits a confirmation prompt and the user replies "skip"
- **THEN** the skill SHALL display the remaining errors and stop the loop without applying the rejected fix

#### Scenario: Multiple fixes needed

- **WHEN** verify reports both L1 frontmatter errors and L3 spec assertion failures
- **THEN** the skill SHALL address all issues in a single confirmation prompt (one combined diff) before re-running verify

#### Scenario: Failing A01 challenge triggers fix-hint consultation

- **WHEN** `pnpm challenge:verify <slug>` returns a non-zero exit code and the failing challenge's `tags` array intersects an A01 taxonomy tag (one of `idor`, `access-control`, `jwt`, `path-traversal`, `broken-access`)
- **THEN** the skill SHALL read the `Per-primitive fix hints` section of `.agent/skills/wxl-create/reference/a01-access-control.md` before proposing repair-loop fixes

#### Scenario: Plain-text confirmation primitive check

- **WHEN** a maintainer greps the auto-fix loop prose for `AskUserQuestion`
- **THEN** no matches SHALL be found

---
### Requirement: Fix loop has a configurable maximum iteration limit

The auto-fix loop SHALL have a maximum iteration limit to prevent infinite loops. The default limit SHALL be 10 attempts.

The limit SHALL be configurable via `.wxl-verify/config.yaml`:

```yaml
# wxl-verify skill configuration
max_fix_attempts: 10
```

If the config file does not exist, the skill SHALL use the default value of 10.

#### Scenario: Loop reaches maximum limit

- **WHEN** the auto-fix loop reaches the configured maximum (e.g., 10 attempts) without all checks passing
- **THEN** the skill SHALL display the remaining errors/warnings and stop, informing the user that the limit has been reached

#### Scenario: Custom limit configured

- **WHEN** `.wxl-verify/config.yaml` contains `max_fix_attempts: 5`
- **THEN** the auto-fix loop SHALL stop after 5 attempts if checks still fail

#### Scenario: Config file does not exist

- **WHEN** `.wxl-verify/config.yaml` does not exist
- **THEN** the skill SHALL use the default limit of 10 attempts
