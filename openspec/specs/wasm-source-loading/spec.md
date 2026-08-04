## Purpose

Covers where wasm-pack output lands and how pages import it: the generated JS glue (`virtual_fs.js`, `asgi_bridge.js`) is built into `.vitepress/wasm/` inside the Vite source tree rather than `docs/public/`, so Vite can resolve it through the module graph as an ES module. Consumers such as `ChallengeLayout.vue` therefore import the glue by relative path instead of an absolute `/wasm/` URL, which is what keeps `pnpm dev` free of `Cannot import non-asset file` errors.

## Requirements

### Requirement: WASM glue files SHALL reside in Vite source tree

wasm-pack-generated JS glue files (e.g., `virtual_fs.js`, `asgi_bridge.js`) SHALL be output to the `.vitepress/wasm/` directory (inside the Vite source tree), NOT to `docs/public/`. This ensures Vite can process them as ES modules via the module graph.

#### Scenario: Developer starts dev server

- **WHEN** a developer runs `pnpm dev` (which includes `wasm:build`)
- **THEN** the dev server starts without `Cannot import non-asset file` errors

#### Scenario: ChallengeLayout imports WASM module

- **WHEN** `ChallengeLayout.vue` dynamically imports the virtual-fs WASM module
- **THEN** the import resolves via a relative path pointing to `.vitepress/wasm/virtual-fs/virtual_fs.js`, not an absolute `/wasm/` URL

<!-- @trace
source: fix-wasm-public-import
updated: 2026-03-16
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
-->