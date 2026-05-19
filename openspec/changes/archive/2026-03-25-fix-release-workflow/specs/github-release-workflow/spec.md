## MODIFIED Requirements

### Requirement: Complete build pipeline execution

The workflow SHALL execute the full build pipeline in order: install Rust toolchain and wasm-pack → install binaryen (wasm-opt) → install Node.js and pnpm → install dependencies → wasm:build → challenge:keygen → **test --run** → **challenge:validate** → docs:build. The test and validation steps SHALL run after challenge:keygen (which generates files needed by tests) and before docs:build. If either `pnpm test --run` or `pnpm challenge:validate` fails, the workflow SHALL stop and no GitHub Release SHALL be created.

#### Scenario: Successful build pipeline with tests and validation

- **WHEN** the workflow is triggered by a valid tag push
- **THEN** the workflow SHALL execute `pnpm wasm:build`, `pnpm challenge:keygen`, `pnpm test --run`, `pnpm challenge:validate`, and `pnpm docs:build` in sequence
- **AND** the `.vitepress/dist` directory SHALL contain the built static site

#### Scenario: Test failure halts workflow before building

- **WHEN** `pnpm test --run` fails during the workflow
- **THEN** the workflow SHALL stop and report the failure
- **AND** `pnpm docs:build` SHALL NOT execute
- **AND** no GitHub Release SHALL be created

#### Scenario: Validation failure halts workflow before building

- **WHEN** `pnpm challenge:validate` fails during the workflow
- **THEN** the workflow SHALL stop and report the failure
- **AND** `pnpm docs:build` SHALL NOT execute
- **AND** no GitHub Release SHALL be created

#### Scenario: Build failure halts workflow

- **WHEN** any step in the build pipeline fails
- **THEN** the workflow SHALL stop and report the failure
- **AND** no GitHub Release SHALL be created
