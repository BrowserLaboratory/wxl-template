## Why

目前專案版本已升級至 0.6.0，但尚無自動化 release 流程。每次發佈新版本時，需要手動 build 並打包產出物，既耗時又容易出錯。需要建立 GitHub Release Action，在建立 Git tag 時自動觸發 build pipeline，將 `.vitepress/dist` 打包為可下載的 artifact，讓使用者（教師、學生）能直接從 GitHub Releases 頁面下載部署。

## What Changes

- 新增 `.github/workflows/release.yml` GitHub Actions workflow，當推送 `v*` tag 時自動觸發
- Workflow 包含完整 build pipeline：安裝 Rust toolchain → wasm-pack build → challenge keygen → VitePress build
- 將 `.vitepress/dist` 打包為 `web-exploitation-seclab-v{version}.zip`，附加至 GitHub Release
- 自動從 `package.json` 讀取版本號，確保 release 與專案版本一致

## Capabilities

### New Capabilities

- `github-release-workflow`: 定義 GitHub Actions release workflow 的觸發條件、build 步驟與 artifact 上傳規則

### Modified Capabilities

（無）

## Impact

- 新增檔案：`.github/workflows/release.yml`
- 依賴：GitHub Actions runners 需支援 Rust toolchain、Node.js、pnpm、wasm-pack
- 系統：GitHub Releases 頁面將開始產生自動化的 release assets
