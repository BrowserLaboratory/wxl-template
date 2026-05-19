# Web eXploitation Laboratory (WXL)

> 完全基於前端 WebAssembly 的網頁滲透練習平台，無需後端伺服器

[![License: ECL-2.0](https://img.shields.io/badge/License-ECL--2.0-blue.svg)](LICENSE)
[![VitePress](https://img.shields.io/badge/VitePress-2.0.0--alpha.16-green.svg)](https://vitepress.dev)
[![pnpm](https://img.shields.io/badge/pnpm-10.28.0-orange.svg)](https://pnpm.io)

## 簡介

**Web eXploitation Laboratory (WXL)** 是一個 CTF 風格的網頁滲透技術練習平台。所有挑戰皆在瀏覽器端執行，透過 WebAssembly 模擬真實後端環境，不需要任何伺服器基礎設施即可部署與使用。

### 核心特色

- **純前端執行**：透過 Service Worker 攔截 HTTP 請求，在瀏覽器中模擬後端行為
- **多後端支援**：支援 Python Flask / FastAPI（Pyodide）與 PHP（php-wasm）
- **加密虛擬檔案系統**：Flag 與應用程式資源以 AES-GCM-256 加密儲存，防止直接讀取
- **靜態部署**：建置產物為純靜態檔案，可部署至任何靜態託管服務（GitHub Pages、Cloudflare Pages 等）

## 技術棧

| 層次 | 技術 |
|------|------|
| 文件框架 | [VitePress](https://vitepress.dev) 2.0.0-alpha.16 |
| UI 框架 | [Vue 3](https://vuejs.org) 3.5 + [UnoCSS](https://unocss.dev) |
| 狀態管理 | [Pinia](https://pinia.vuejs.org) 3 |
| Python 執行環境 | [Pyodide](https://pyodide.org) 0.29 |
| PHP 執行環境 | [php-wasm](https://github.com/seanmorris/php-wasm) |
| WASM 模組 | Rust 2021 + [wasm-pack](https://rustwasm.github.io/wasm-pack/) |
| 攻擊記錄追蹤 | IndexedDB（`idb` 套件）attack session persistence |
| 套件管理 | [pnpm](https://pnpm.io) 10.28 |

## 前置需求

- **Node.js** >= 18
- **pnpm** >= 10（`npm install -g pnpm`）
- **Rust** toolchain（透過 [rustup](https://rustup.rs/) 安裝）
- **wasm-pack**（`cargo install wasm-pack`）

## 快速開始

```bash
# 1. Clone 專案
git clone https://github.com/CXPhoenix/wxl.git
cd wxl

# 2. 安裝 Node.js 依賴
pnpm install

# 3. 建置 WASM 模組並啟動開發伺服器
pnpm dev
```

開發伺服器預設在 `http://localhost:5173` 啟動。

## 可用指令

| 指令 | 說明 |
|------|------|
| `pnpm dev` | 建置 WASM 模組並啟動開發伺服器 |
| `pnpm build` | 建置 WASM 模組並輸出靜態站台 |
| `pnpm docs:dev` | 僅啟動 VitePress 開發伺服器（跳過 WASM 建置） |
| `pnpm docs:build` | 僅建置 VitePress 靜態站台 |
| `pnpm docs:preview` | 預覽建置後的靜態站台 |
| `pnpm test` | 執行 TypeScript / JavaScript 單元測試（Vitest） |
| `pnpm wasm:build` | 建置所有 Rust WASM 模組 |
| `pnpm wasm:test` | 執行 Rust 單元測試（cargo test） |
| `pnpm challenge:keygen` | 為所有挑戰產生加密 WASM 模組 |
| `pnpm create:challenge` | 互動式建立新挑戰（scaffold） |

## 架構

```
瀏覽器
├── VitePress 站台（Vue 3 + UnoCSS）
│   ├── Challenge 頁面（Markdown + YAML frontmatter）
│   └── IndexedDB（attack session 持久化 + 工具資料）
├── Service Worker（workers/）
│   └── 攔截 HTTP 請求，路由至對應 WASM runtime
└── WASM Runtimes
    ├── virtual-fs      加密虛擬檔案系統（Rust）
    ├── asgi-bridge     Python ASGI/WSGI 橋接層（Rust）
    ├── python-bridge   Pyodide 整合（TypeScript）
    └── php-bridge      php-wasm 整合（TypeScript）
```

### 請求流程

1. 使用者在 Challenge 頁面操作，觸發對「後端」的 HTTP 請求
2. Service Worker 攔截請求，依 Challenge 設定路由至對應 runtime
3. Python runtime 或 PHP runtime 處理請求，回傳 HTTP 響應
4. Challenge 頁面渲染結果

### Challenge 設定格式

每個 Challenge 是一個 Markdown 檔案，透過 YAML frontmatter 宣告設定：

```yaml
---
title: Door Is Open
backend: fastapi         # flask | fastapi | php
app: ./app.py
wasmModule: /challenge/door-is-open/runtime.wasm  # 由 keygen 自動產生
fs:
  /flag.txt: ./flag.txt
difficulty: easy
source_visible: false    # true = 白箱，false = 黑箱（預設）
---
```

## 貢獻

請參閱 [CONTRIBUTE.md](CONTRIBUTE.md) 了解分支策略、PR 流程與 Commit 規範。

## 部署

建置產物位於 `.vitepress/dist/`，為純靜態檔案，可部署至任何靜態託管服務。

### 建置流程

```bash
# 1. 安裝依賴
pnpm install

# 2. 完整建置（WASM + keygen + VitePress）
pnpm build
```

### 部署至 GitHub Pages

```yaml
# .github/workflows/deploy.yml 範例
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

### 部署至 Cloudflare Pages

1. 在 Cloudflare Pages 建立新專案，連結 GitHub repository
2. 設定建置指令：

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal \
     && . "$HOME/.cargo/env" \
     && cargo install wasm-tools \
     && pnpm install \
     && pnpm build
   ```

3. 設定輸出目錄：`.vitepress/dist`
4. 環境變數中加入 `NODE_VERSION=22`

> **說明**：Cloudflare Pages 預設不含 Rust toolchain，上述建置指令會自動安裝 minimal Rust toolchain 與 `wasm-tools`。`wasm-pack` 已宣告為 devDependency，`pnpm install` 時會自動安裝。

## 授權

本專案採用 [Educational Community License, Version 2.0 (ECL-2.0)](LICENSE) 授權。
