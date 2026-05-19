## 1. Dead code 清理 — DescriptionModal

- [x] 1.1 從 `ChallengeLayout.vue` 移除 DescriptionModal import、`descriptionModalVisible` ref、以及 `<DescriptionModal>` 模板區塊（Description panel collapsible on all breakpoints — DescriptionModal component does not exist scenario）
- [x] 1.2 刪除 `.vitepress/theme/components/DescriptionModal.vue` 檔案
- [x] 1.3 確認是否有 `DescriptionModal` 相關的測試檔案，若有則一併刪除

## 2. Usage.md 獨有內容遷移

- [x] 2.1 將 `Usage.md` 中「keygen 腳本詳細流程」段落（pnpm challenge:keygen 用法、執行流程 1-5 步、skip 邏輯說明）遷移至 `CONTRIBUTE.md` 的「新增挑戰」段落之後，作為新的「Challenge Keygen」子段落
- [x] 2.2 將 `Usage.md` 中「部署者指南」段落（建置流程、前置需求、GitHub Pages workflow yaml、Cloudflare Pages 設定）遷移至 `README.md` 的「授權」段落之前，作為新的「部署」段落。更新 repo URL 為 `CXPhoenix/wxl`

## 3. Usage.md 刪除

- [x] 3.1 刪除 `Usage.md` 檔案
