## 1. Workflow 檔案建立與基礎設定

- [x] 1.1 建立 `.github/workflows/release.yml`，使用 tag push 作為觸發條件（`on: push: tags: ['v*']`），實作 tag-triggered release workflow，確保非 tag push 不觸發
- [x] 1.2 設定 build 環境設定：`ubuntu-latest` runner、Rust stable toolchain（`dtolnay/rust-toolchain`）、Rust build caching（`Swatinem/rust-cache`）

## 2. Build Pipeline 實作

- [x] 2.1 安裝 binaryen（wasm-opt）套件，確保 `wasm-opt` 可用（對應 wasm-pack target 設定）
- [x] 2.2 設定 Node.js（v22）與 pnpm（`pnpm/action-setup`，版本從 `packageManager` 讀取），執行 `pnpm install`
- [x] 2.3 實作完整 build pipeline 執行：依序執行 `pnpm wasm:build` → `pnpm challenge:keygen` → `pnpm docs:build`，任一步驟失敗即停止

## 3. Artifact 打包與 Release 建立

- [x] 3.1 實作 artifact packaging：將 `.vitepress/dist` 打包為 `web-exploitation-seclab-{tag}.zip`（打包與上傳策略）
- [x] 3.2 實作 GitHub Release creation with asset：使用 `softprops/action-gh-release` 建立 Release（名稱 `Release {tag}`），附加 zip 檔案，啟用 auto-generated release notes

## 4. 驗證

- [x] 4.1 本地檢查 workflow YAML 語法正確性
- [x] 4.2 確認 workflow 涵蓋所有 spec requirements：tag-triggered release workflow、complete build pipeline execution、artifact packaging、GitHub Release creation with asset、Rust build caching
