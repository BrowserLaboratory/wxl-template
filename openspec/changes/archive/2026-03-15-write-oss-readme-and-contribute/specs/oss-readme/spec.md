## ADDED Requirements

### Requirement: README contains project overview section

The `README.md` file SHALL include a project overview section that describes the platform as a browser-only, WebAssembly-based web exploitation challenge environment (CTF-style) requiring no backend server.

#### Scenario: Visitor understands project purpose without reading code

- **WHEN** a visitor opens the README on GitHub
- **THEN** the first two sections SHALL convey the project's purpose, the technology stack (VitePress, Rust WASM, Pyodide, php-wasm), and the supported challenge backends (Flask, FastAPI, PHP)

### Requirement: README contains prerequisites and quick start instructions

The `README.md` SHALL list all prerequisites required to build the project locally and provide step-by-step commands to install dependencies, build WASM modules, and start the development server.

#### Scenario: Contributor can set up local environment from README alone

- **WHEN** a new contributor follows only the README instructions
- **THEN** running the listed commands SHALL result in a working local development server without consulting any other documentation

#### Scenario: Prerequisites list covers all required runtimes

- **WHEN** the prerequisites section is read
- **THEN** it SHALL list Node.js (with pnpm), Rust toolchain (with wasm-pack), and any other required system dependencies

### Requirement: README contains architecture overview

The `README.md` SHALL include an architecture section that describes the major subsystems: VitePress static site, Service Worker router, virtual filesystem WASM module, ASGI bridge WASM module, and runtime bridges (Python, PHP).

#### Scenario: Architecture section describes module boundaries

- **WHEN** the architecture section is read
- **THEN** it SHALL describe each major module, its responsibility, and how it connects to other modules, without exposing implementation details

### Requirement: README contains available scripts table

The `README.md` SHALL list all `package.json` scripts with a brief description of each.

#### Scenario: All npm scripts are documented

- **WHEN** the scripts section is read
- **THEN** it SHALL document `docs:dev`, `docs:build`, `docs:preview`, `test`, `wasm:build`, `wasm:test`, `dev`, and `build`

### Requirement: README contains license section

The `README.md` SHALL include a license section referencing the project's license file.

#### Scenario: License is clearly stated

- **WHEN** a visitor reads the README
- **THEN** the license type SHALL be clearly stated with a link to the `LICENSE` file
