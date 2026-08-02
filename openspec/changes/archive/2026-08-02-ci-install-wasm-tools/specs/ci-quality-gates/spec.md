## MODIFIED Requirements

### Requirement: Both jobs SHALL share an identical setup step sequence

The `test` and `build` jobs SHALL each execute the following setup steps in the listed order before any gate-specific step runs:

1. `actions/checkout@v6`
2. `dtolnay/rust-toolchain@stable`
3. `Swatinem/rust-cache@v2` with `cache-bin: "false"` (the binary cache is disabled because `taiki-e/install-action` installs pinned prebuilt binaries into `$CARGO_HOME/bin`, and a restored cache would shadow them with stale versions)
4. `taiki-e/install-action@v2` with `tool: wasm-pack@0.14.0,wasm-tools@1.249.0` (composite-based; replaces the previously-used `jetli/wasm-pack-action`, which is now forbidden by another requirement in this capability; `wasm-tools` is pinned to 1.249.0 because that is the newest version in the pinned action revision's manifest and it matches the version the keygen strip/mutate passes were verified against)
5. Install `binaryen` via `apt-get install -y binaryen`
6. `pnpm/action-setup@v6`
7. `actions/setup-node@v6` with `node-version: 24` and `cache: pnpm`
8. `pnpm install --frozen-lockfile`
9. `pnpm wasm:build`
10. `pnpm challenge:keygen`

This setup sequence SHALL match the setup steps used by `.github/workflows/release.yml` (lines 16–47 at the time of this spec). Any future change to the setup sequence in `release.yml` SHALL be mirrored in `quality-gates.yml` in the same change.

#### Scenario: Setup sequence matches `release.yml`

- **WHEN** a maintainer compares `quality-gates.yml` setup steps against `release.yml` setup steps
- **THEN** the action references and pinned versions for `actions/checkout`, `dtolnay/rust-toolchain`, `Swatinem/rust-cache`, `taiki-e/install-action` (the composite-based wasm-pack and wasm-tools installer), `pnpm/action-setup`, and `actions/setup-node` SHALL be identical
- **AND** the `pnpm install`, `pnpm wasm:build`, and `pnpm challenge:keygen` commands SHALL be present in both workflows with identical arguments

#### Scenario: `pnpm install` uses `--frozen-lockfile`

- **WHEN** the workflow runs `pnpm install`
- **THEN** the invocation SHALL include the `--frozen-lockfile` flag
- **AND** the job SHALL fail if `pnpm-lock.yaml` is out of sync with `package.json`

#### Scenario: Toolchain parity is asserted by an automated test

- **WHEN** `pnpm test --run` executes the workflow toolchain parity test
- **THEN** the test SHALL parse `.github/workflows/quality-gates.yml`, `.github/workflows/deploy.yml`, and `.github/workflows/release.yml`
- **AND** for every job that uses `taiki-e/install-action`, the test SHALL assert the `tool` input equals `wasm-pack@0.14.0,wasm-tools@1.249.0`
- **AND** for every job that uses `Swatinem/rust-cache`, the test SHALL assert the `cache-bin` input equals `"false"`
- **AND** the test SHALL fail when any of the three workflows drifts from these values
