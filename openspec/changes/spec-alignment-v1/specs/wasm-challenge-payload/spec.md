## MODIFIED Requirements

### Requirement: Post-build obfuscation pipeline strips symbols and applies mutations

The build pipeline SHALL run its obfuscation passes in this order:

1. **Strip and optimise.** The pipeline SHALL run `wasm-tools strip` over the compiled `wasm-pack` output, SHALL run `wasm-opt -O4` over the stripped result, and SHALL stage the outcome as `template.wasm`. This stage SHALL complete before any `"chall-data"` section is injected.
2. **Inject.** The pipeline SHALL copy `template.wasm` and append the `"chall-data"` custom section to that copy.
3. **Mutate.** The pipeline SHALL run `wasm-tools mutate` with a per-challenge seed over the injected copy.

The pipeline SHALL NOT run a strip pass after stage 2, over either the injected copy or any per-challenge output. Stripping after injection destroys the payload: the pipeline's `wasm-tools strip` invocation does not pass `--all`, and a default strip run removes the `"chall-data"` custom section from the artifact it was just handed.

Byte-identical reproducibility SHALL only be promised when the payload bytes, key material, and mutation seed are held constant. The default keygen flow SHALL generate fresh per-challenge key material and therefore SHALL only guarantee semantically equivalent output, not byte-identical output, across repeated runs.

`wasm-tools strip`, `wasm-opt`, and `wasm-tools mutate` SHALL each be optional at build time. When a tool is absent from `PATH`, the pipeline SHALL emit a warning naming the pass it is skipping and SHALL continue: for `wasm-tools strip` by staging the `wasm-pack` output as `template.wasm` unchanged, for `wasm-opt` by keeping the stripped result, and for `wasm-tools mutate` by keeping the injected output. A `wasm-opt` run that exits non-zero or yields an unusable result SHALL be discarded with a warning and SHALL leave the stripped result intact; a failed `wasm-tools mutate` run SHALL leave the injected output in place with a warning.

Tool absence SHALL NOT be conflated with a corrupt strip result. When `wasm-tools strip` runs but writes a file that is shorter than the 8-byte module header, does not begin with the WASM magic bytes, or is less than half the size of its input, the pipeline SHALL abort with an error identifying the pass instead of continuing.

#### Scenario: Strip precedes injection

- **WHEN** the pipeline appends `"chall-data"` to a copy of `template.wasm`
- **THEN** the strip and optimise passes SHALL already have completed
- **AND** no further strip pass SHALL run over that copy, so the shipped `runtime.wasm` SHALL still contain its `"chall-data"` custom section

#### Scenario: Fixed inputs remain reproducible

- **WHEN** the same template WASM, payload bytes, key material, and mutation seed are reused for the same challenge
- **THEN** the post-build obfuscation step SHALL produce byte-identical output

#### Scenario: Fresh key generation changes the output bytes

- **WHEN** the build script runs twice with fresh key generation enabled
- **THEN** the resulting per-challenge WASM files SHALL be allowed to differ at the byte level while preserving the same runtime behavior

#### Scenario: A missing tool degrades to a warning

- **WHEN** `wasm-tools` or `wasm-opt` is absent from `PATH` during a build
- **THEN** the pipeline SHALL emit a warning for each pass that tool provides — `wasm-strip` and `wasm-mutate` for `wasm-tools`, optimization for `wasm-opt` — and SHALL continue to a successful build

#### Scenario: Corrupt strip output aborts the build

- **WHEN** the strip pass exits successfully but writes a file that is shorter than the 8-byte module header, lacks the WASM magic bytes, or is less than half the size of its input
- **THEN** the pipeline SHALL abort with an error identifying the pass and SHALL NOT proceed to injection
