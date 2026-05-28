# Runtime CLI mapping — L4 blind solve

`scripts/wxl-solver/spawn-runtime.ts` reads `WXL_VERIFY_RUNTIME` (default `claude`) and dispatches to one of the three supported agent CLIs. This table is the ground truth for the dispatch table; updates here MUST be mirrored in `spawn-runtime.ts` (and vice versa).

The L4 contract demands a single line of the form `FINAL_FLAG=<value>` on stdout. The wxl side never depends on each runtime's structured-JSON output shape — extraction reads the plain-text contract line from the last 20 lines of stdout, which is invariant across runtimes.

| Runtime | CLI command (with example `--max-turns 30`) | Notes |
|---------|---------------------------------------------|-------|
| `claude` | `claude --print --add-dir <workDir> --max-turns 30 [--mcp-config <path>] "<prompt>"` | Default. Plain-text output (no `--output-format json` envelope — the contract line `FINAL_FLAG=<value>` must remain on raw stdout). `--mcp-config` is auto-added when a project-local `.mcp.json` is present at the project root. |
| `codex` | `codex exec --output-format json --working-dir <workDir> --max-turns 30 "<prompt>"` | Requires Codex CLI v0.20+ for MCP support. Codex's MCP config is read from `~/.codex/config.toml`; project-local `.mcp.json` is **not** forwarded automatically. |
| `gemini` | `gemini -p "<prompt>" --working-dir <workDir> --max-turns 30 --output-format json` | MCP support is partial; chrome-devtools-mcp may be unavailable on older releases. Project-local `.mcp.json` is **not** forwarded automatically (use the host runtime's MCP config). Inconclusive is the expected verdict when MCP tools are missing — see caveat below. |

## Exit-code expectations

| Verdict | wxl-side exit code | Source |
|---------|--------------------|--------|
| Agent emitted `FINAL_FLAG=<value>` matching the canonical `flag.txt` byte-for-byte and the FLAG_REGEX | 0 (pass) | `extract-flag.ts` `compareToCanonical()` |
| Agent emitted `FINAL_FLAG=<value>` but the value does not match | 1 (fail) | `extract-flag.ts` `compareToCanonical()` |
| Agent emitted `FINAL_FLAG=INCONCLUSIVE`, no `FINAL_FLAG` line at all, runtime CLI missing on PATH, or dev server not reachable | 2 (inconclusive) | `extract-flag.ts` + pre-flight + spawn-runtime guards |

## Gemini MCP caveat

The `chrome-devtools-mcp` toolset is still maturing in Gemini CLI. When MCP is unavailable in the Gemini runtime, the spawned session will be unable to drive the real browser and will typically end with `FINAL_FLAG=INCONCLUSIVE`. This is an expected, well-formed outcome — wxl returns exit code 2 with a reason, the verify gate does not record a false fail, and the maintainer can fall back to running `WXL_VERIFY_RUNTIME=claude` (or `codex`) for the L4 gate.

## Non-interactive MCP loading caveat

By default, `claude --print` (and similarly the non-interactive modes of `codex exec` / `gemini -p`) do **not** auto-load MCP servers from the user's interactive configuration. Each runtime needs MCP wired explicitly:

- **`claude --print --mcp-config <path>`** — `scripts/wxl-solver/spawn-runtime.ts` auto-detects `<projectRoot>/.mcp.json` and passes it through. The repo ships a `.mcp.json` declaring `chrome-devtools-mcp`; maintainers can extend it with additional servers.
- **`codex exec`** honors `~/.codex/config.toml` plus the project's `.codex/mcp/` directory. The project-local `.mcp.json` is not auto-forwarded — codex maintainers manage MCP via the user-level config.
- **`gemini -p`** reads the host runtime's MCP config; consult the Gemini CLI docs for the current behaviour.

When MCP is missing in the spawned session (e.g. running codex without configuring `~/.codex/config.toml`, or running gemini on an older release), the agent will be unable to drive a browser, can't solve the challenge, and returns `FINAL_FLAG=INCONCLUSIVE`. wxl translates this to exit code 2 (inconclusive) — the well-formed outcome per the L4 contract, not a false-fail.

## Adding a new runtime

To support a new agent CLI:

1. Add the runtime name to `KNOWN_RUNTIMES` in `scripts/wxl-solver/spawn-runtime.ts`.
2. Add a `case` to `buildRuntimeCommand` that emits the full argv. Reuse the same five concept slots: `--max-turns <N>`, the working-directory pin, the JSON output format flag, and the prompt as the final argument.
3. Add a row to the table above with the example command line and any maturity caveats.
4. Add a unit test in `tests/unit/scripts/wxl-solver/spawn-runtime.test.ts` that exercises the new runtime's argv.

The prompt itself (see `buildPrompt` in `scripts/challenge-verify-blind.ts`) is runtime-agnostic — all five mandatory substrings (Target / Description / Flag format / chrome-devtools-mcp / FINAL_FLAG=) plus the fabrication prohibition sentence must remain in any new prompt template variation.
