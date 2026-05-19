## 1. 專案設定檔更新

- [x] 1.1 更新 `package.json`：name 改為 `wxl`、version 改為 `1.0.0`、description 改為 Web eXploitation Laboratory 相關描述、repository/bugs/homepage URL 全部改為 `CXPhoenix/wxl`
- [x] 1.2 更新 `.vitepress/config.mts`：title 改為 `Web eXploitation Laboratory`、socialLinks 中 GitHub link 改為 `https://github.com/CXPhoenix/wxl`

## 2. CI/CD — Artifact packaging 檔名更新

- [x] 2.1 更新 `.github/workflows/release.yml`：zip 檔名從 `web-exploitation-seclab-${GITHUB_REF_NAME}.zip` 改為 `wxl-${GITHUB_REF_NAME}.zip`，包含 build 步驟與 release asset 引用處

## 3. 文件更新

- [x] 3.1 更新 `README.md`：標題改為 Web eXploitation Laboratory、描述文字更新、clone URL 改為 `https://github.com/CXPhoenix/wxl.git`、cd 指令改為 `cd wxl`
- [x] 3.2 更新 `CONTRIBUTE.md`：標題改為 Contributing to Web eXploitation Laboratory、所有 clone/upstream/issues URL 改為 `CXPhoenix/wxl`
- [x] 3.3 更新 `docs/guide/index.md`：平台描述中的名稱改為 Web eXploitation Laboratory

## 4. Spec 更新

- [x] 4.1 更新 `openspec/specs/github-release-workflow/spec.md`：將 Artifact packaging requirement 中的 zip 檔名從 `web-exploitation-seclab-{tag}.zip` 改為 `wxl-{tag}.zip`，範例更新為 `wxl-v1.0.0.zip`
