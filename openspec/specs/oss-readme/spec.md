# oss-readme Specification

## Purpose

Defines the content and structure of the project's `README.md`, covering the project overview, technology stack, prerequisites, quick start instructions, architecture overview, and available npm scripts for contributors and visitors.

## Requirements

### Requirement: README contains project overview section

The `README.md` file SHALL include a project overview section that describes the platform as a browser-only, WebAssembly-based web exploitation challenge environment (CTF-style) requiring no backend server.

#### Scenario: Visitor understands project purpose without reading code

- **WHEN** a visitor opens the README on GitHub
- **THEN** the first two sections SHALL convey the project's purpose, the technology stack (VitePress, Rust WASM, Pyodide, php-wasm), and the supported challenge backends (Flask, FastAPI, PHP)


<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: README contains prerequisites and quick start instructions

The `README.md` SHALL list all prerequisites required to build the project locally and provide step-by-step commands to install dependencies, build WASM modules, and start the development server.

#### Scenario: Contributor can set up local environment from README alone

- **WHEN** a new contributor follows only the README instructions
- **THEN** running the listed commands SHALL result in a working local development server without consulting any other documentation

#### Scenario: Prerequisites list covers all required runtimes

- **WHEN** the prerequisites section is read
- **THEN** it SHALL list Node.js (with pnpm), Rust toolchain (with wasm-pack), and any other required system dependencies


<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: README contains architecture overview

The `README.md` SHALL include an architecture section that describes the major subsystems: VitePress static site, Service Worker router, virtual filesystem WASM module, ASGI bridge WASM module, and runtime bridges (Python, PHP).

#### Scenario: Architecture section describes module boundaries

- **WHEN** the architecture section is read
- **THEN** it SHALL describe each major module, its responsibility, and how it connects to other modules, without exposing implementation details


<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: README contains available scripts table

The `README.md` SHALL list all `package.json` scripts with a brief description of each.

#### Scenario: All npm scripts are documented

- **WHEN** the scripts section is read
- **THEN** it SHALL document `docs:dev`, `docs:build`, `docs:preview`, `test`, `wasm:build`, `wasm:test`, `dev`, and `build`


<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: README contains license section

The `README.md` SHALL include a license section referencing the project's license file.

#### Scenario: License is clearly stated

- **WHEN** a visitor reads the README
- **THEN** the license type SHALL be clearly stated with a link to the `LICENSE` file

<!-- @trace
source: write-oss-readme-and-contribute
updated: 2026-03-15
code:
  - package.json
  - README.md
  - CONTRIBUTE.md
-->

---
### Requirement: README is authored in English as source of truth

The `README.md` file SHALL be authored entirely in English. English is the source-of-truth language for this top-level document; any localized rendition (e.g., a future `README.zh-TW.md`) SHALL derive from the English source and not the reverse.

All Markdown structural elements — relative links, image references, heading anchors, code fences and their language tags, and YAML frontmatter (if any) — SHALL be preserved exactly when the source is updated; translation MUST NOT introduce dead links, missing assets, or anchor drift.

Technical identifiers that the broader project keeps in English (`commit`, `PR`, `deploy`, `cache`, `API`, `log`, `debug`, `Service Worker`, `WebAssembly`, `Pyodide`, `VitePress`) SHALL appear in English in `README.md` regardless of surrounding prose translation choices.

#### Scenario: README contains no Chinese characters in source prose

- **WHEN** a maintainer runs `rg '[一-鿿]' README.md`
- **THEN** zero matches SHALL be reported (i.e., the file contains no CJK Unified Ideograph characters in its source)

#### Scenario: All relative links in README resolve after translation

- **WHEN** any link target referenced from `README.md` is followed (`./CONTRIBUTE.md`, `./docs/*`, image assets, etc.)
- **THEN** the target SHALL exist in the repository at the referenced path
- **AND** no link SHALL 404 in `pnpm docs:build` output for any path that VitePress also renders
