## Context

專案 `web-exploitation-seclab` 目前版本為 0.6.0，build pipeline 包含三個階段：`wasm:build` → `challenge:keygen` → `docs:build`。產出物為 `.vitepress/dist` 靜態網站目錄。目前無任何 CI/CD 設定，release 完全手動。

專案使用 pnpm 作為套件管理器，Rust/wasm-pack 產生 WASM binary，VitePress 產生靜態網站。

## Goals / Non-Goals

**Goals:**

- 推送 `v*` tag 時自動觸發 build 並建立 GitHub Release
- 將 `.vitepress/dist` 打包為 zip 附加至 Release assets
- Release 名稱與 tag 保持一致

**Non-Goals:**

- 不處理自動部署至外部 hosting（如 GitHub Pages、Netlify）
- 不處理 Docker image 建置
- 不處理 changelog 自動產生
- 不包含 CI test workflow（僅 release workflow）

## Decisions

### 使用 tag push 作為觸發條件

採用 `on: push: tags: ['v*']` 作為 workflow 觸發條件，而非手動 dispatch 或 release event。

理由：tag-based 觸發最為直覺且符合語意化版本管理慣例。開發者只需 `git tag v0.6.0 && git push --tags` 即可觸發完整 release 流程。

### Build 環境設定

- **Runner**: `ubuntu-latest`
- **Rust toolchain**: `stable`，透過 `dtolnay/rust-toolchain` action 安裝
- **wasm-pack**: 透過 `cargo install wasm-pack` 或 `jetli/wasm-pack-action` 安裝
- **Node.js**: v22（LTS），透過 `actions/setup-node` 安裝
- **pnpm**: 透過 `pnpm/action-setup` 安裝，版本從 `packageManager` 欄位讀取
- **wasm-opt (binaryen)**: build pipeline 中 `challenge:keygen` 依賴 `binaryen`，需確保 `wasm-opt` 可用。透過 apt 安裝 `binaryen` 套件

### 打包與上傳策略

- 使用 `zip -r` 將 `.vitepress/dist` 打包為 `web-exploitation-seclab-{tag}.zip`
- 透過 `softprops/action-gh-release` action 建立 GitHub Release 並附加 zip 檔案
- Release 名稱格式：`Release {tag}`（例如 `Release v0.6.0`）
- 自動產生 release notes（使用 GitHub 的 auto-generated release notes）

### wasm-pack target 設定

沿用現有 `package.json` 中的 `wasm:build` script，target 為 `--target web`，無需額外調整。

## Risks / Trade-offs

- **Build 時間較長**：完整 pipeline 包含 Rust 編譯 + WASM build + VitePress build，預估 5-10 分鐘。→ 可透過 Rust cache（`Swatinem/rust-cache`）加速
- **Runner 磁碟空間**：WASM 編譯可能佔用較多空間。→ `ubuntu-latest` 預設 14GB 可用空間，應足夠
- **wasm-pack 版本不一致**：CI 安裝的 wasm-pack 版本可能與本地不同。→ 使用 `cargo install wasm-pack` 取最新穩定版，或在 workflow 中鎖定版本
- **binaryen/wasm-opt 可用性**：`challenge:keygen` 腳本依賴 `wasm-opt`（binaryen），若未安裝會導致 build 失敗。→ 在 workflow 中明確安裝 `binaryen` 套件
