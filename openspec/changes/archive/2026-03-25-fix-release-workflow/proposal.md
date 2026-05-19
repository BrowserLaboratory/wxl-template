## Why

目前的 GitHub Actions release workflow（`.github/workflows/release.yml`）在建置靜態網站前沒有執行任何測試或驗證步驟。一個帶有壞掉的測試或不合格 frontmatter 的版本可以直接被打包發布為 GitHub Release，無人察覺。

## What Changes

- 在 `Build VitePress site` 步驟之前加入 `pnpm test --run`（單元測試）
- 在 `Build VitePress site` 步驟之前加入 `pnpm challenge:validate`（挑戰 frontmatter 結構驗證）
- 任一步驟失敗時 workflow 應中止，不發布 release

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `github-release-workflow`：workflow 新增測試與驗證 gate，所有測試通過後才進行建置

## Impact

- 受影響檔案：`.github/workflows/release.yml`
- 受影響 spec：`github-release-workflow`
