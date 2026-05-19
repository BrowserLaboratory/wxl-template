## 1. 撰寫 README.md

- [x] 1.1 確認專案技術棧與版本資訊（package.json、Cargo.toml、chall-wasm 模組清單），作為文件素材
- [x] 1.2 依照「README 採用標準 OSS 章節結構」決策，建立 README 骨架（badge、簡介、技術棧、快速開始、架構、Scripts、License）
- [x] 1.3 撰寫「README contains project overview section」：描述平台為純前端 WASM CTF 挑戰環境，列出支援的後端類型（Flask、FastAPI、PHP）
- [x] 1.4 撰寫「README contains prerequisites and quick start instructions」：列出 Node.js + pnpm、Rust + wasm-pack 等前置需求，並提供 `pnpm install` → `pnpm dev` 的完整啟動指令
- [x] 1.5 撰寫「README contains architecture overview」：以模組邊界描述 VitePress、Service Worker router、virtual-fs WASM、asgi-bridge WASM、Python bridge、PHP bridge 的職責與連接關係
- [x] 1.6 撰寫「README contains available scripts table」：以表格列出所有 package.json scripts 並附上說明
- [x] 1.7 撰寫「README contains license section」：說明授權類型並連結 LICENSE 檔案

## 2. 撰寫 CONTRIBUTE.md

- [x] 2.1 依照「CONTRIBUTE 採用 git flow 分支模型說明」決策，建立 CONTRIBUTE 骨架（分支模型、PR 流程、Commit 規範、Issue 回報）
- [x] 2.2 撰寫「CONTRIBUTE describes git flow branch model」：以表格或圖示說明 main、staging、feature/*、bugfix/*、hotfix/* 的用途與 PR 目標分支規則
- [x] 2.3 撰寫「CONTRIBUTE describes PR submission process」：說明 fork → branch → commit → PR（目標 staging）→ review → merge 的完整流程，並列出 PR description 必填欄位
- [x] 2.4 依照「Commit message 採用 Conventional Commits + gitmoji」決策，撰寫「CONTRIBUTE describes commit message format」：列出格式規則、至少三個範例（feat、fix、refactor），以及 BREAKING CHANGE footer 的寫法
- [x] 2.5 撰寫「CONTRIBUTE describes issue reporting process」：說明 bug report 所需資訊（重現步驟、預期行為、實際行為、環境）與 feature request 的提交方式
