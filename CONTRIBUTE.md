# Contributing to Web eXploitation Laboratory

感謝你對本專案的興趣！在提交 PR 之前，請先閱讀本指南。

## 目錄

- [分支模型](#分支模型)
- [開發流程](#開發流程)
- [PR 提交流程](#pr-提交流程)
- [新增挑戰](#新增挑戰)
- [Commit 規範](#commit-規範)
- [Issue 回報](#issue-回報)

## 分支模型

本專案採用 **Git Flow** 分支策略：

| 分支 | 用途 | 穩定度 | 基於 |
|------|------|--------|------|
| `main` | 正式發布版本，永遠可部署 | 最高 | — |
| `staging` | 整合分支，所有 PR 的合併目標 | 中 | `main` |
| `feature/*` | 新功能開發 | 低 | `staging` |
| `bugfix/*` | 非緊急 bug 修復 | 低 | `staging` |
| `hotfix/*` | 緊急正式環境修復 | 中 | `main` |

### 分支命名規則

```
feat/<簡短描述>      # 例：feature/add-php-upload-challenge
bugfix/<簡短描述>       # 例：bugfix/fix-flag-verifier-timing
hotfix/<簡短描述>       # 例：hotfix/patch-wasm-memory-leak
```

### Hotfix 特殊規則

`hotfix/*` 從 `main` 切出，完成後需同時合併回 `main` **與** `staging`，確保修復不會在下次 release 時遺失：

```
main ──────────●──────────────────●── (merge hotfix)
               │                  ↑
               └─── hotfix/* ─────┤
                                  ↓
staging ──────────────────────────●── (merge hotfix)
```

## 開發流程

1. Fork 本 repository 並 clone 你的 fork：

   ```bash
   git clone https://github.com/<your-username>/wxl.git
   cd wxl
   pnpm install
   ```

2. 新增 upstream remote：

   ```bash
   git remote add upstream https://github.com/CXPhoenix/wxl.git
   ```

3. 從 `staging` 切出工作分支：

   ```bash
   git checkout staging
   git pull upstream staging
   git checkout -b feature/<your-feature>
   ```

4. 開發並在本地確認測試通過：

   ```bash
   pnpm dev          # 啟動開發伺服器
   pnpm test         # TypeScript / JavaScript 單元測試
   pnpm wasm:test    # Rust 單元測試
   ```

5. Commit 變更（見 [Commit 規範](#commit-規範)），並 push 至你的 fork。

6. 開啟 Pull Request（見 [PR 提交流程](#pr-提交流程)）。

## PR 提交流程

### 目標分支

| 情境 | PR 目標分支 |
|------|------------|
| 新功能、一般 bugfix | `staging` |
| 緊急正式環境修復 | `main`（並須同時開一個 PR 至 `staging`） |

> **請勿直接向 `main` 提交功能性 PR。**

### PR Description 必填欄位

PR 描述必須包含以下三個部分：

```markdown
## Summary

<!-- 簡述本次變更內容（1-3 條 bullet points） -->

## Motivation

<!-- 說明為什麼需要這個變更 -->

## Test Plan

<!-- 說明如何驗證變更正確性（測試指令、手動測試步驟等） -->
```

### PR Checklist

提交前請確認：

- [ ] 本地測試通過（`pnpm test` & `pnpm wasm:test`）
- [ ] Commit message 符合規範（見下方）
- [ ] PR 目標分支正確（`staging`；hotfix 則為 `main` 及 `staging`）
- [ ] PR description 包含 Summary / Motivation / Test Plan

## 新增挑戰

使用 `scripts/create-challenge.ts` scaffold 新挑戰：

```bash
pnpm create:challenge --name <slug> [--title <title>] \
  [--backend flask|fastapi|php] [--difficulty easy|medium|hard] \
  [--flag <flag>]
```

此腳本會自動：
1. 在 `docs/challenge/` 下建立挑戰目錄與 Markdown 檔案
2. 產生對應 backend 的 app 骨架（`app.py` 或 `index.php`）
3. 建立 `flag.txt` 並寫入指定 flag
4. 執行 `pnpm challenge:keygen` 產生加密 WASM 模組

### 範例

```bash
# 建立一個 Flask SQLi 挑戰
pnpm create:challenge --name sqli-login --title "SQL Injection Login Bypass" \
  --backend flask --difficulty medium --flag "CTF{sqli_bypassed}"
```

## Challenge Keygen

使用 `challenge-keygen` 腳本為挑戰產生加密 WASM payload：

```bash
pnpm challenge:keygen                 # 處理所有挑戰
pnpm challenge:keygen <slug>          # 處理指定挑戰
pnpm challenge:keygen --force <slug>  # 強制重新產生
```

此腳本執行以下流程：
1. 讀取挑戰 frontmatter 與 `src/` 目錄中的檔案
2. 產生隨機 AES-256 金鑰，加密所有 FS 項目
3. 推導 flag verifier（PBKDF2-HMAC-SHA256）
4. 打包為 WASM custom section，注入模板 WASM 二進位
5. 更新 frontmatter 中的 `wasmModule` 路徑

> **跳過邏輯**：若 frontmatter 已包含 `wasmModule` 且對應的 `runtime.wasm` 檔案存在，腳本會跳過該挑戰。在 CI 環境中，由於 `.wasm` 檔案未納入版控，腳本會自動重新產生。使用 `--force` 可強制重新產生。

## Commit 規範

本專案採用 **[Conventional Commits](https://www.conventionalcommits.org/)** 格式，並加入 **gitmoji** 前綴。

### 格式

```
<emoji> <type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 常用 Type 與 Emoji

| Emoji | Type | 說明 |
|-------|------|------|
| ✨ | `feat` | 新功能 |
| 🐛 | `fix` | Bug 修復 |
| ♻️ | `refactor` | 重構（不影響對外行為） |
| 📝 | `docs` | 文件修改 |
| ✅ | `test` | 新增或修改測試 |
| 🏗️ | `build` | 建置系統或依賴變更 |
| 🔧 | `chore` | 其他維護性工作 |
| 🚑️ | `hotfix` | 緊急修復 |

### 範例

```bash
# 新功能
✨ feat(challenge): 新增 SQL injection 進階練習題

# Bug 修復
🐛 fix(flag-verifier): 修正 PBKDF2 timing 比較邏輯

# 重構
♻️ refactor(service-worker): 將路由邏輯提取為獨立模組

# 建置系統
🏗️ build: 升級 VitePress 至 2.0.0-alpha.16
```

### Breaking Changes

若本次變更包含破壞性異動，必須在 commit footer 加入 `BREAKING CHANGE:`：

```
♻️ refactor(challenge-api): 修改 frontmatter schema

移除舊版 `backend_url` 欄位，改用 `backend` 指定執行環境。

BREAKING CHANGE: `backend_url` 欄位不再支援，請改用 `backend: flask|fastapi|php`。
```

## Issue 回報

請至 [GitHub Issues](https://github.com/CXPhoenix/wxl/issues) 建立 Issue。

### Bug 回報

請在 Issue 中提供以下資訊：

```markdown
**環境**
- OS：macOS / Windows / Linux
- Browser 及版本：Chrome 120 / Firefox 121 / ...
- Node.js 版本：
- pnpm 版本：

**重現步驟**
1. 前往 ...
2. 點擊 ...
3. 看到錯誤 ...

**預期行為**
<!-- 說明你預期應該發生什麼 -->

**實際行為**
<!-- 說明實際發生了什麼，附上錯誤訊息或截圖 -->
```

### Feature Request

Feature request 請在 Issue 標題加上 `[Feature]` 前綴，並描述：

- **需求情境**：你在做什麼時遇到了什麼限制？
- **期望功能**：你希望增加什麼功能？
- **替代方案**：你考慮過哪些其他做法？
