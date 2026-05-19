## Context

目前新增挑戰需要手動完成：建立目錄、撰寫 frontmatter、建立 app 骨架、建立 flag.txt，再執行 `pnpm challenge:keygen`。已有 `challenge:keygen` script 處理加密部分；本 change 補上 scaffold 前置步驟。

現有的 `scripts/challenge-keygen.ts` 使用 `yaml` 套件解析 frontmatter，可供本 script 直接複用（已在 devDependencies）。三種 backend 的骨架結構在 `docs/challenge/` 中均有既有範例（sqli-demo、fastapi-demo、php-demo）。

## Goals / Non-Goals

**Goals:**
- `pnpm create:challenge --name <slug> [--title] [--backend] [--difficulty] [--flag]` 一行完成初始化
- 自動偵測名稱衝突，已存在則報錯並中止
- 自動呼叫 keygen，讓挑戰建立後立刻可在 dev server 使用
- 產生有意義的 app 骨架（示範讀取 `/flag.txt`、有可運作的路由）

**Non-Goals:**
- 互動式 wizard（`inquirer` 等 prompt 套件）——保持 CLI 單行可腳本化
- 刪除或重新命名現有挑戰
- 修改 VitePress config 或 nav（挑戰列表由 `createContentLoader` 自動掃描）

## Decisions

### CLI 引數解析使用 `node:util.parseArgs`

**理由**：Node 18+ 內建，零依賴，足以應付 5 個具名選項（`--name`、`--title`、`--backend`、`--difficulty`、`--flag`）。不引入 `yargs`/`commander` 等套件以降低維護負擔。

### 骨架以 inline template string 嵌入 script

**理由**：三種 backend 的骨架很小（< 60 行），直接嵌入 script 比維護獨立 template 目錄更簡單，也不需要額外的檔案讀取邏輯。

### flag 自動生成格式：`FLAG{<slug>_<random8hex>}`

**理由**：slug 部分讓 flag 與挑戰名稱有關聯，方便辨識；random8hex（4 bytes）確保同名挑戰每次生成的 flag 不同，避免硬編碼衝突。

### 建立後自動呼叫 keygen 使用 `child_process.execSync`

**理由**：直接呼叫 `node --experimental-strip-types scripts/challenge-keygen.ts <slug>` 與 keygen 共用相同的加密邏輯，不需要在 create script 中重複實作加密。若 keygen 失敗，create script 以非零 exit code 報錯。

## Risks / Trade-offs

- **Node 18+ 必須**：`parseArgs` 和 `--experimental-strip-types` 均需 Node 18+，但專案已依賴此版本（Pyodide 0.29.3 要求），故影響極小。
- **骨架內容硬編碼**：app 骨架直接寫在 script 中，更新骨架需修改 script。考量骨架極少變動，可接受。
- **keygen 自動執行**：若 app.py 骨架內容有語法錯誤，keygen 仍會成功（keygen 只做檔案加密，不驗證 Python 語法）。但這在設計上是正確的——語法驗證屬於 runtime 職責。
