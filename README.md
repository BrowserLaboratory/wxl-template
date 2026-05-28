# Web eXploitation Laboratory (WXL)

> A fully browser-based, WebAssembly-powered web exploitation training platform — no backend server required.

[![License: ECL-2.0](https://img.shields.io/badge/License-ECL--2.0-blue.svg)](LICENSE)
[![VitePress](https://img.shields.io/badge/VitePress-2.0.0--alpha.16-green.svg)](https://vitepress.dev)
[![pnpm](https://img.shields.io/badge/pnpm-10.28.0-orange.svg)](https://pnpm.io)

## Overview

**Web eXploitation Laboratory (WXL)** is a CTF-style web exploitation training platform. Every challenge runs entirely in the browser: WebAssembly simulates a realistic backend environment so the platform can be deployed and used without any server infrastructure.

### Core features

- **Pure-frontend execution**: a Service Worker intercepts HTTP requests and emulates backend behavior in the browser.
- **Multiple backend runtimes**: Python Flask / FastAPI (via Pyodide) and PHP (via php-wasm) are all supported.
- **Encrypted virtual filesystem**: flags and application assets are stored under AES-GCM-256 encryption, preventing direct reads.
- **Static deployment**: build output is plain static files and can be hosted on any static service (GitHub Pages, Cloudflare Pages, etc.).

## Tech stack

| Layer | Technology |
|------|------|
| Documentation framework | [VitePress](https://vitepress.dev) 2.0.0-alpha.16 |
| UI framework | [Vue 3](https://vuejs.org) 3.5 + [UnoCSS](https://unocss.dev) |
| State management | [Pinia](https://pinia.vuejs.org) 3 |
| Python runtime | [Pyodide](https://pyodide.org) 0.29 |
| PHP runtime | [php-wasm](https://github.com/seanmorris/php-wasm) |
| WASM modules | Rust 2021 + [wasm-pack](https://rustwasm.github.io/wasm-pack/) |
| Attack session tracking | IndexedDB (`idb` package) attack-session persistence |
| Package manager | [pnpm](https://pnpm.io) 10.28 |

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 10 (`npm install -g pnpm`)
- **Rust** toolchain (install via [rustup](https://rustup.rs/))
- **wasm-pack** (`cargo install wasm-pack`)
- **Chromium for Playwright** — required only before the first `pnpm challenge:verify` run. After `pnpm install`, install the browser binary once with:

  ```bash
  pnpm exec playwright install chromium
  ```

## Quick start

```bash
# 1. Clone the project
git clone https://github.com/CXPhoenix/wxl.git
cd wxl

# 2. Install Node.js dependencies
pnpm install

# 3. Build the WASM modules and start the dev server
pnpm dev
```

The dev server starts at `http://localhost:5173` by default.

## Available scripts

| Command | Description |
|------|------|
| `pnpm dev` | Build the WASM modules and start the dev server |
| `pnpm build` | Build the WASM modules and emit the static site |
| `pnpm docs:dev` | Start the VitePress dev server only (skips the WASM build) |
| `pnpm docs:build` | Build the VitePress static site only |
| `pnpm docs:preview` | Preview the built static site |
| `pnpm test` | Run the TypeScript / JavaScript unit tests (Vitest) |
| `pnpm wasm:build` | Build every Rust WASM module |
| `pnpm wasm:test` | Run the Rust unit tests (`cargo test`) |
| `pnpm challenge:keygen` | Generate the encrypted WASM module for every challenge |
| `pnpm create:challenge` | Interactively scaffold a new challenge |
| `pnpm challenge:retype` | Mutate an existing challenge's backend / difficulty / tags / category |
| `pnpm challenge:verify` | Run the layered verify gate (L1 lint, L2 build, L3 Playwright e2e) on a challenge |
| `pnpm challenge:verify:blind` | Run the L4 blind-solve sub-routine standalone (also reached via `pnpm challenge:verify <slug> --blind`) |

## Architecture

```
Browser
├── VitePress site (Vue 3 + UnoCSS)
│   ├── Challenge pages (Markdown + YAML frontmatter)
│   └── IndexedDB (attack-session persistence + tool state)
├── Service Worker (workers/)
│   └── Intercepts HTTP requests and routes them to the matching WASM runtime
└── WASM runtimes
    ├── virtual-fs      Encrypted virtual filesystem (Rust)
    ├── asgi-bridge     Python ASGI/WSGI bridge layer (Rust)
    ├── python-bridge   Pyodide integration (TypeScript)
    └── php-bridge      php-wasm integration (TypeScript)
```

### Request flow

1. The user interacts with a challenge page, triggering an HTTP request to the "backend".
2. The Service Worker intercepts the request and routes it to the right runtime per the challenge configuration.
3. The Python runtime or the PHP runtime handles the request and returns an HTTP response.
4. The challenge page renders the result.

### Challenge configuration format

Every challenge is a Markdown file with a YAML frontmatter block declaring its configuration:

```yaml
---
title: Door Is Open
backend: fastapi         # flask | fastapi | php
app: ./app.py
wasmModule: /challenge/door-is-open/runtime.wasm  # produced by keygen
fs:
  /flag.txt: ./flag.txt
difficulty: easy
source_visible: false    # true = white-box, false = black-box (default)
---
```

## Contributing

See [CONTRIBUTE.md](CONTRIBUTE.md) for the branching strategy, PR workflow, and commit conventions.

## Deployment

Build output lives in `.vitepress/dist/` as plain static files and can be deployed to any static hosting service.

### Build steps

```bash
# 1. Install dependencies
pnpm install

# 2. Full build (WASM + keygen + VitePress)
pnpm build
```

### Deploying to GitHub Pages

```yaml
# Example: .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo install wasm-pack
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .vitepress/dist
```

### Deploying to Cloudflare Pages

1. Create a new project on Cloudflare Pages and link the GitHub repository.
2. Set the build command:

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal \
     && . "$HOME/.cargo/env" \
     && cargo install wasm-tools \
     && pnpm install \
     && pnpm build
   ```

3. Set the output directory to `.vitepress/dist`.
4. Add `NODE_VERSION=22` to the environment variables.

> **Note**: Cloudflare Pages does not ship a Rust toolchain by default; the build command above installs a minimal Rust toolchain and `wasm-tools` automatically. `wasm-pack` is declared as a devDependency, so `pnpm install` picks it up.

## License

This project is licensed under the [Educational Community License, Version 2.0 (ECL-2.0)](LICENSE).
