## Why

專案正式定名為 **Web eXploitation Laboratory (WXL)**，版本從 0.6.0 升至 1.0.0，標誌著平台達到穩定可用的里程碑。同時 GitHub remote 已遷移至 `https://github.com/CXPhoenix/wxl.git`，所有設定檔、文件、CI/CD 流程中的舊名稱與 URL 需同步更新。

## What Changes

- **BREAKING**: npm 套件名稱從 `web-exploitation-seclab` 改為 `wxl`
- 主版本號從 `0.6.0` 升至 `1.0.0`
- 所有 GitHub URL 從 `CXPhoenix/web-exploitation-seclab` 改為 `CXPhoenix/wxl`
- VitePress 網站標題從 "Web Exploitation Challenges" 改為 "Web eXploitation Laboratory"
- Release workflow 產出的 zip 檔名從 `web-exploitation-seclab-{tag}.zip` 改為 `wxl-{tag}.zip`
- README.md、CONTRIBUTE.md、docs/guide/index.md 中的專案名稱與描述全面更新
- `openspec/specs/github-release-workflow/spec.md` 中的 zip 檔名引用更新
- Archived openspec changes **不更新**（保留歷史記錄原貌）
- Rust WASM 子模組（Cargo.toml）版本維持 0.1.0 不動

## Non-Goals

- 不更動 archived openspec changes（`openspec/changes/archive/*`），因為它們是歷史快照
- 不更動 Rust crate 版本（各 crate 有獨立版本生命週期）
- 不涉及功能變更或程式碼邏輯修改

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `github-release-workflow`: zip 產出檔名從 `web-exploitation-seclab-{tag}.zip` 改為 `wxl-{tag}.zip`

## Impact

- 受影響設定檔：`package.json`、`.vitepress/config.mts`、`.github/workflows/release.yml`
- 受影響文件：`README.md`、`CONTRIBUTE.md`、`docs/guide/index.md`
- 受影響 spec：`openspec/specs/github-release-workflow/spec.md`
- 不影響任何功能邏輯或 runtime 行為
