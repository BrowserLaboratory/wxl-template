## ADDED Requirements

### Requirement: Player package construction in ephemeral working directory

The L4 blind-solve subsystem SHALL build a minimal-context "player package" for each verify invocation under the path `tmp/wxl-verify/<slug>/player-package/`. The path SHALL be relative to the repository root. The directory SHALL be created fresh for each invocation and SHALL contain exactly two files:

- `description.md`: extracted from `docs/challenge/<slug>/index.md`. Only the H1 heading line and the body paragraphs immediately following it (up to the first sub-heading or end of file) SHALL be copied. The YAML frontmatter block (delimited by `---` lines) SHALL be stripped. Any HTML comments SHALL be stripped. Any content under a sub-heading explicitly tagged `<!-- maintainer-only -->` SHALL be stripped.
- `META.yaml`: a YAML document with exactly these top-level keys: `base_url` (string, e.g., `http://localhost:5173/challenge/<slug>/`), `flag_regex` (string, e.g., `^FLAG\{[^}]+\}$|^CTF\{[^}]+\}$`), `turn_budget` (integer, default 30), `verification_run_id` (ISO-8601 UTC timestamp string).

The subsystem SHALL NOT copy any file from `docs/challenge/<slug>/src/`, SHALL NOT copy `docs/challenge/<slug>/src/flag.txt`, and SHALL NOT copy `tests/challenges/<slug>.spec.ts` into the player package. The subsystem SHALL ensure `.gitignore` contains `tmp/wxl-verify/` so player packages never enter version control.

#### Scenario: Player package contains exactly two files

- **WHEN** the subsystem builds the player package for slug `door-is-open`
- **THEN** the directory `tmp/wxl-verify/door-is-open/player-package/` SHALL exist and SHALL contain exactly `description.md` and `META.yaml`, with no other files or subdirectories

#### Scenario: src directory is not leaked into player package

- **WHEN** the subsystem builds the player package
- **THEN** the player package directory SHALL NOT contain any file whose contents match the bytes of `docs/challenge/<slug>/src/app.py`, `docs/challenge/<slug>/src/index.php`, or `docs/challenge/<slug>/src/flag.txt`

#### Scenario: Frontmatter is stripped from description.md

- **WHEN** `docs/challenge/<slug>/index.md` contains a YAML frontmatter block at the top
- **THEN** `tmp/wxl-verify/<slug>/player-package/description.md` SHALL NOT contain the frontmatter `---` delimiters or any YAML key from that block

##### Example: description extraction

| Input (`index.md`)                              | Output (`description.md`)               |
|-------------------------------------------------|------------------------------------------|
| `---\ntitle: T\n---\n# Door Is Open\nBody...`   | `# Door Is Open\nBody...`                |
| `---\nt: x\ntags: [a,b]\n---\n# X\nbody\n## H`  | `# X\nbody`                              |

#### Scenario: .gitignore covers ephemeral directory

- **WHEN** a maintainer inspects the repository's `.gitignore`
- **THEN** the file SHALL contain a line matching `tmp/wxl-verify/` (or a parent pattern that covers it)

---

### Requirement: Runtime CLI dispatch via environment variable

The L4 subsystem SHALL select the host agent runtime to spawn based on the `WXL_VERIFY_RUNTIME` environment variable. The accepted values SHALL be `claude`, `codex`, and `gemini`. If `WXL_VERIFY_RUNTIME` is unset or empty, the subsystem SHALL default to `claude`. If `WXL_VERIFY_RUNTIME` is set to any value other than the three accepted runtimes, the subsystem SHALL exit with code 1 and emit an error message listing the accepted values.

For each accepted runtime, the subsystem SHALL spawn the corresponding non-interactive CLI session with these contracts:

- **claude**: `claude --print --output-format json --add-dir <player-package-dir> --max-turns <turn_budget> "<prompt>"`. The `--add-dir` flag restricts file system access to the player package directory.
- **codex**: `codex exec --output-format json --working-dir <player-package-dir> --max-turns <turn_budget> "<prompt>"`. The `--working-dir` flag confines the session to the player package directory.
- **gemini**: `gemini -p "<prompt>" --working-dir <player-package-dir> --max-turns <turn_budget> --output-format json`. The `--working-dir` flag confines the session to the player package directory.

The subsystem SHALL stream the spawned process's stdout into `tmp/wxl-verify/<slug>/run.log` for diagnostic purposes (this log file is also ephemeral and is removed when the verify run ends).

If the chosen CLI binary is not found on `PATH`, the subsystem SHALL exit with code 2 and emit `runtime <name> CLI not found on PATH`.

#### Scenario: Default runtime is claude

- **WHEN** the subsystem is invoked without `WXL_VERIFY_RUNTIME` set
- **THEN** the subsystem SHALL spawn the `claude --print ...` command

#### Scenario: Codex runtime selected

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=codex`
- **THEN** the subsystem SHALL spawn the `codex exec ...` command

#### Scenario: Unknown runtime value

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=copilot`
- **THEN** the subsystem SHALL exit with code 1 and emit `unknown WXL_VERIFY_RUNTIME: copilot; accepted: claude, codex, gemini`

#### Scenario: Runtime CLI missing from PATH

- **WHEN** the subsystem is invoked with `WXL_VERIFY_RUNTIME=gemini` and `gemini` is not on `PATH`
- **THEN** the subsystem SHALL exit with code 2 and emit `runtime gemini CLI not found on PATH`

---

### Requirement: Prompt template instructs agent to emit a final flag line

The L4 subsystem SHALL construct the prompt fed to the spawned CLI from a fixed template. The prompt SHALL contain: a one-sentence task statement, the `base_url` from `META.yaml`, the contents of `description.md`, the `flag_regex` value, an instruction listing `chrome-devtools-mcp` as the available browser-control tool, and a precise output contract directing the agent to emit exactly one line of the form `FINAL_FLAG=<value>` at the end of its response.

The prompt SHALL also instruct the agent: if the agent cannot solve the challenge within the turn budget, the agent SHALL emit `FINAL_FLAG=INCONCLUSIVE` and stop.

The prompt SHALL discourage hallucination by stating: the agent SHALL emit only flag values it has actually observed in the target's response body — fabricated flags are forbidden.

#### Scenario: Prompt contains required components

- **WHEN** the subsystem constructs the prompt for slug `door-is-open`
- **THEN** the prompt string SHALL contain literal substrings `Target:`, `Description:`, `Flag format:`, `chrome-devtools-mcp`, and `FINAL_FLAG=`

#### Scenario: Prompt declares fabrication prohibition

- **WHEN** the subsystem constructs the prompt
- **THEN** the prompt SHALL contain an instruction forbidding the agent from emitting flag values it has not directly retrieved from the target

---

### Requirement: Final flag extraction and byte-comparison

After the spawned CLI exits, the L4 subsystem SHALL parse its stdout to extract the agent's `final_flag`. The subsystem SHALL search the last 20 lines of stdout for a line matching the regex `^FINAL_FLAG=(.+)$`. If multiple matches occur, the last match SHALL be taken. The captured value SHALL be the agent's `final_flag`.

The subsystem SHALL byte-compare the extracted `final_flag` against the contents of `docs/challenge/<slug>/src/flag.txt` (after trimming a single trailing newline from the file, if present). If the byte sequences match exactly, the L4 verdict SHALL be `pass`. Otherwise, the verdict depends on the captured value:

- If no `FINAL_FLAG=` line is found, the verdict SHALL be `inconclusive`.
- If the captured value is the literal string `INCONCLUSIVE`, the verdict SHALL be `inconclusive`.
- If the captured value does not match the `flag_regex` from `META.yaml`, the verdict SHALL be `fail` with reason `extracted flag does not match flag_regex`.
- If the captured value matches the regex but differs from `flag.txt`, the verdict SHALL be `fail` with reason `extracted flag does not match canonical flag.txt`.

The subsystem SHALL exit with code 0 on `pass`, code 1 on `fail`, and code 2 on `inconclusive`.

#### Scenario: Flag match yields pass

- **WHEN** `flag.txt` contains `FLAG{door_open_abc123}` and the agent emits `FINAL_FLAG=FLAG{door_open_abc123}` in its stdout
- **THEN** the subsystem SHALL emit `verdict: pass` and exit with code 0

#### Scenario: No FINAL_FLAG line emitted

- **WHEN** the agent's stdout does not contain any line matching `^FINAL_FLAG=`
- **THEN** the subsystem SHALL emit `verdict: inconclusive (no FINAL_FLAG emitted)` and exit with code 2

#### Scenario: Explicit INCONCLUSIVE marker

- **WHEN** the agent emits `FINAL_FLAG=INCONCLUSIVE`
- **THEN** the subsystem SHALL emit `verdict: inconclusive (agent self-reported INCONCLUSIVE)` and exit with code 2

#### Scenario: Extracted flag fails regex

- **WHEN** the agent emits `FINAL_FLAG=hello world` and the regex requires `^FLAG\{[^}]+\}$`
- **THEN** the subsystem SHALL emit `verdict: fail (extracted flag does not match flag_regex)` and exit with code 1

#### Scenario: Extracted flag differs from canonical

- **WHEN** `flag.txt` contains `FLAG{door_open_abc123}` and the agent emits `FINAL_FLAG=FLAG{wrong_value}`
- **THEN** the subsystem SHALL emit `verdict: fail (extracted flag does not match canonical flag.txt)` and exit with code 1

---

### Requirement: Ephemeral artefact cleanup

After the L4 subsystem completes (regardless of verdict), it SHALL delete the entire `tmp/wxl-verify/<slug>/` directory. Cleanup SHALL be best-effort: if deletion fails (e.g., a file is still locked by another process), the subsystem SHALL emit a warning to stderr but SHALL NOT change its exit code. The subsystem SHALL NOT copy any artefact (`run.log`, `player-package/*`) into `docs/challenge/<slug>/`, into any `solution/` directory, into version control, or into any persistent location.

#### Scenario: Successful cleanup

- **WHEN** the subsystem completes a verify run for slug `door-is-open`
- **THEN** the directory `tmp/wxl-verify/door-is-open/` SHALL NOT exist after the subsystem exits

#### Scenario: Cleanup failure does not affect exit code

- **WHEN** the subsystem completes a verify run and `tmp/wxl-verify/<slug>/` cannot be deleted (locked file)
- **THEN** the subsystem SHALL emit a warning to stderr including the file path and the deletion error, but SHALL exit with the verdict-derived exit code unchanged

#### Scenario: No persistent artefact written

- **WHEN** the subsystem completes any verify run
- **THEN** `docs/challenge/<slug>/solution/` SHALL NOT exist after the run, and the working tree under `docs/challenge/<slug>/` SHALL be byte-identical to its state before the run
