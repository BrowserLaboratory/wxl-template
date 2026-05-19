## Problem

三個挑戰（FastAPI IDOR Demo、SQL Injection Demo、PHP File Inclusion Demo）的 runtime 初始化失敗，錯誤為 `FileNotFoundError: [Errno 44] No such file or directory: '/flag.txt'`。

challenge-keygen 正確地將 `src/` 目錄下的所有檔案（包含 `flag.txt`）加密並打包進 WASM binary，但 ChallengeLayout 在初始化時只提取 frontmatter `fs` 欄位列出的檔案。Per-folder 挑戰不使用 `fs` 欄位，導致除了 `__app__` 之外的所有檔案（如 `/flag.txt`）都沒有被寫入 runtime 虛擬檔案系統。

## Root Cause

ChallengeLayout 的檔案提取邏輯依賴 `fm.value.fs`：

```typescript
const fsPaths = Object.keys(fm.value.fs ?? {})
for (const path of fsPaths) {
  fsEntries[path] = wasm_fs_read(path)
}
```

但 per-folder 挑戰的 frontmatter 沒有 `fs` 欄位（keygen 不會產生），所以 `fsPaths` 永遠是空陣列。

WASM virtual-fs 模組目前只提供 `wasm_fs_init`、`wasm_fs_read`、`wasm_fs_write`、`wasm_fs_reset`、`wasm_verify_flag`，**沒有列舉已加密檔案路徑的功能**。

## Proposed Solution

1. **Rust 層**：在 `FsStore` 新增 `keys()` 方法，在 `wasm_api.rs` 暴露 `wasm_fs_list()` 函式，回傳所有已加密檔案路徑的 JSON 陣列
2. **JS 層**：ChallengeLayout 改用 `wasm_fs_list()` 取得完整檔案清單，自動提取所有檔案（排除 `__app__`），不再依賴 frontmatter `fs` 欄位

## Success Criteria

- 三個挑戰頁面的 runtime 初始化成功（MergedNav 綠色圓點）
- Browser 面板自動載入挑戰首頁內容
- `/flag.txt` 正確寫入 Pyodide / PHP 虛擬檔案系統
- WASM unit tests（`cargo test`）通過
- 前端單元測試全部通過

## Impact

- Affected specs: `encrypted-virtual-fs`（新增 list 能力）、`challenge-runtime-init`（修改檔案提取邏輯）
- Affected code:
  - `chall-wasm/virtual-fs/src/idb.rs`（FsStore.keys()）
  - `chall-wasm/virtual-fs/src/wasm_api.rs`（wasm_fs_list）
  - `.vitepress/theme/layouts/ChallengeLayout.vue`（initRuntime 檔案提取）
  - `tests/__mocks__/virtual-fs.ts`（mock 更新）
