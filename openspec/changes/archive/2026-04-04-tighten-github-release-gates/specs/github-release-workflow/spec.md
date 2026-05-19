## MODIFIED Requirements

### Requirement: Complete build pipeline execution

The release workflow SHALL execute the full build pipeline in order: install Rust toolchain and wasm-pack, install binaryen, install Node.js and pnpm, install dependencies, `pnpm wasm:build`, `pnpm challenge:keygen`, `pnpm wasm:test`, `pnpm test --run`, `pnpm challenge:validate`, and `pnpm docs:build`. Artifact packaging and GitHub Release creation SHALL run only after every gate succeeds.

#### Scenario: Successful release run executes every gate

- **WHEN** the workflow is triggered by a valid release tag
- **THEN** it SHALL run `pnpm wasm:build`, `pnpm challenge:keygen`, `pnpm wasm:test`, `pnpm test --run`, `pnpm challenge:validate`, and `pnpm docs:build` before packaging artifacts

#### Scenario: Rust test failure halts the release

- **WHEN** `pnpm wasm:test` fails during the workflow
- **THEN** the workflow SHALL stop immediately, SHALL NOT run `pnpm test --run` or `pnpm docs:build`, and SHALL NOT create a GitHub Release
