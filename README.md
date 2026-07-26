# Web eXploitation Laboratory (WXL)

> A fully browser-based, WebAssembly-powered web exploitation training platform — no backend server required.

[![Quality Gates](https://github.com/BrowserLaboratory/wxl-template/actions/workflows/quality-gates.yml/badge.svg)](https://github.com/BrowserLaboratory/wxl-template/actions/workflows/quality-gates.yml)
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

- **Node.js** >= 22.6 — the challenge scripts run through `node --experimental-strip-types`, which is unavailable on earlier releases. CI builds on Node 24.
- **pnpm** >= 10 (`npm install -g pnpm`)
- **Rust** toolchain (install via [rustup](https://rustup.rs/))
- **wasm-pack** (`cargo install wasm-pack`) — not a package dependency; install it into your Rust toolchain
- **wasm-tools** (`cargo install wasm-tools`, or `pnpm wasm:tools`) — required by the L2 stage of `pnpm challenge:verify`, which runs `wasm-tools validate` on the generated payload. `pnpm challenge:keygen` also uses it to strip the WASM binary, but degrades to a warning when it is absent.
- **Chromium for Playwright** — required before the first `pnpm challenge:verify` or `pnpm test:smoke` run. After `pnpm install`, install the browser binary once with:

  ```bash
  pnpm exec playwright install chromium
  ```

## Quick start

```bash
# 1. Clone the project
git clone https://github.com/BrowserLaboratory/wxl-template.git
cd wxl-template

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
| `pnpm test:smoke` | Run the Playwright smoke tests against the built site |
| `pnpm wasm:build` | Build every Rust WASM module |
| `pnpm wasm:test` | Run the Rust unit tests (`cargo test`) |
| `pnpm wasm:tools` | Attempt to install `wasm-tools` into the Rust toolchain; it silences failures and always exits 0, so confirm with `wasm-tools --version` |
| `pnpm fork:init` | Rewrite the project identity after forking or cloning this template (package name, VitePress base, GitHub URLs) |
| `pnpm challenge:keygen` | Generate the encrypted WASM module for every challenge |
| `pnpm create:challenge` | Interactively scaffold a new challenge |
| `pnpm challenge:validate` | Validate every challenge's frontmatter and file layout |
| `pnpm challenge:analyze` | Report the content and configuration of a challenge |
| `pnpm challenge:retype` | Mutate an existing challenge's backend / difficulty / tags / category |
| `pnpm challenge:verify` | Run the layered verify gate (L1 lint, L2 build, L3 Playwright e2e) on a challenge |
| `pnpm challenge:verify:blind` | Run the L4 blind-solve sub-routine standalone (also reached via `pnpm challenge:verify <slug> --blind`) |
| `pnpm challenge:verify:cross` | Maintainer-only L4 multi-agent cross-check — runs the blind gate against `claude,codex,gemini` and aggregates verdicts |

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
    ├── wxlsh-parser    wxlsh terminal command parser and native commands (Rust)
    ├── python-bridge   Pyodide integration (TypeScript)
    └── php-bridge      php-wasm integration (TypeScript)
```

The three Rust crates live under `chall-wasm/` and are built by `pnpm wasm:build`.

### Request flow

1. The user interacts with a challenge page, triggering an HTTP request to the "backend".
2. The Service Worker intercepts the request and routes it to the right runtime per the challenge configuration.
3. The Python runtime or the PHP runtime handles the request and returns an HTTP response.
4. The challenge page renders the result.

### Challenge configuration format

Every challenge is a Markdown file with a YAML frontmatter block declaring its configuration:

```yaml
---
title: Door Is Open      # required
layout: challenge        # selects the challenge UI; without it the page renders as a plain docs page
backend: fastapi         # required — flask | fastapi | php
app: app.py              # required — path relative to the challenge's src/ root
difficulty: easy
category: web
packages: []             # extra Python packages to install via micropip
tools: [ browser, network, repeater, code ]
source_visible: false    # true = white-box, false = black-box (default)
wasmModule: /challenge/door-is-open/runtime.wasm  # produced by keygen
---
```

Challenge source files are picked up by scanning the challenge's `src/` directory. The legacy `fs:` mapping is still accepted for compatibility, but the validator emits a deprecation warning — new challenges SHALL rely on the `src/` scan instead.

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

This repository ships a working deployment workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — use it as-is rather than writing your own. Its shape:

- **Trigger**: a `v*` release tag push, plus manual `workflow_dispatch`. Pushing to `main` does not deploy.
- **Pages source**: the GitHub Actions deployment method (`actions/upload-pages-artifact` + `actions/deploy-pages`). There is no `gh-pages` branch.
- **Toolchain**: Node 24 and a SHA-pinned `wasm-pack` 0.14.0, matching `release.yml`.
- **Base path**: the build step sets `SITE_BASE: /wxl-template/`.

`SITE_BASE` is what makes a project site work. VitePress bakes it into every asset URL, so a site served from `https://<user>.github.io/<repo>/` needs `SITE_BASE: /<repo>/` — without it, the deployed page requests its assets from the domain root and every one of them 404s. Set it only in the deploy workflow; leaving it unset keeps local and CI builds rooted at `/`.

Two settings live in the GitHub UI rather than in this repository:

1. **Settings → Pages → Source** must be set to **GitHub Actions**.
2. The **`github-pages` environment** must allow deployments from `v*` tags (in addition to the `main` branch, which authorises `workflow_dispatch` runs). Without that rule, the tag-triggered deploy job is rejected.

After forking, run `pnpm fork:init` to rewrite `SITE_BASE` and the other project-identity values for your own repository name.

### Deploying to Cloudflare Pages

1. Create a new project on Cloudflare Pages and link the GitHub repository.
2. Set the build command:

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal \
     && . "$HOME/.cargo/env" \
     && cargo install wasm-pack \
     && pnpm install \
     && pnpm build
   ```

3. Set the output directory to `.vitepress/dist`.
4. Add `NODE_VERSION=24` to the environment variables.
5. If the site is served from a sub-path, add `SITE_BASE` with that path (leave it unset for a root-domain deployment).

> **Note**: Cloudflare Pages does not ship a Rust toolchain by default. `wasm-pack` is a Rust binary, not a package dependency — `pnpm install` will not provide it — so the build command above installs the minimal Rust toolchain along with `wasm-pack` and `wasm-tools` before building.

## License

This project is licensed under the [Educational Community License, Version 2.0 (ECL-2.0)](LICENSE).
