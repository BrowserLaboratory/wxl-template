## MODIFIED Requirements

### Requirement: Runtime CLI dispatch via environment variable

The L4 subsystem SHALL select the host agent runtime(s) to spawn based on the `WXL_VERIFY_RUNTIME` environment variable, which SHALL accept either a single runtime name or a comma-separated list of runtime names. The accepted values SHALL be `claude`, `codex`, and `gemini`. If `WXL_VERIFY_RUNTIME` is unset or empty, the subsystem SHALL default to a single-element list containing `claude`.

The subsystem SHALL resolve the variable into an ordered runtime list by splitting on commas, trimming surrounding whitespace from each element, and removing duplicate runtimes while preserving first-occurrence order. If ANY resolved element is not one of the accepted runtimes, the subsystem SHALL exit with code 1 and emit an error message listing the accepted values. When the resolved list contains exactly one runtime, the subsystem's selection behavior SHALL be identical to the prior single-runtime behavior. When the resolved list contains more than one runtime, the subsystem SHALL run each selected runtime as defined by the `l4-multi-agent-cross-check` capability.

For each selected runtime, the subsystem SHALL spawn the corresponding non-interactive CLI session with these contracts:

- **claude**: `claude --print --output-format json --add-dir <player-package-dir> --max-turns <turn_budget> "<prompt>"`. The `--add-dir` flag restricts file system access to the player package directory.
- **codex**: `codex exec --output-format json --working-dir <player-package-dir> --max-turns <turn_budget> "<prompt>"`. The `--working-dir` flag confines the session to the player package directory.
- **gemini**: `gemini -p "<prompt>" --working-dir <player-package-dir> --max-turns <turn_budget> --output-format json`. The `--working-dir` flag confines the session to the player package directory.

The subsystem SHALL stream each spawned process's stdout into a `run.log` file under that runtime's ephemeral working directory for diagnostic purposes (this log file is ephemeral and is removed when the verify run ends). When exactly one runtime is selected, that working directory SHALL be `tmp/wxl-verify/<slug>/`; the per-runtime working-directory layout for multi-runtime runs is defined by the `l4-multi-agent-cross-check` capability.

If a selected runtime's CLI binary is not found on `PATH`, the subsystem SHALL exit with code 2 and emit `runtime <name> CLI not found on PATH`.

#### Scenario: Default runtime is claude

- **WHEN** the subsystem is invoked without `WXL_VERIFY_RUNTIME` set
- **THEN** the subsystem SHALL resolve the runtime list to `[claude]` and spawn the `claude --print ...` command

#### Scenario: Codex runtime selected

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=codex`
- **THEN** the subsystem SHALL spawn the `codex exec ...` command

#### Scenario: Comma-separated list resolves to multiple runtimes

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=claude,codex`
- **THEN** the subsystem SHALL resolve the runtime list to `[claude, codex]` and run both runtimes

#### Scenario: Duplicates are removed while order is preserved

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=gemini, claude , gemini`
- **THEN** the subsystem SHALL resolve the runtime list to `[gemini, claude]`

#### Scenario: Unknown runtime value

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=copilot`
- **THEN** the subsystem SHALL exit with code 1 and emit `unknown WXL_VERIFY_RUNTIME: copilot; accepted: claude, codex, gemini`

#### Scenario: Unknown runtime within a list

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=claude,copilot`
- **THEN** the subsystem SHALL exit with code 1 and emit an error message listing the accepted values `claude, codex, gemini`

#### Scenario: Runtime CLI missing from PATH

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=gemini` and `gemini` is not on `PATH`
- **THEN** the subsystem SHALL exit with code 2 and emit `runtime gemini CLI not found on PATH`
