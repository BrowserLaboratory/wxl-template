## 1. Rust WASM：在 FsStore 新增 keys 方法並暴露 wasm_fs_list

- [x] [P] 1.1 在 `chall-wasm/virtual-fs/src/idb.rs` 的 `FsStore` 新增 `pub fn keys(&self) -> Vec<String>` 方法，回傳所有 entry paths，實現 list all encrypted FS entry paths
- [x] [P] 1.2 在 `chall-wasm/virtual-fs/src/wasm_api.rs` 新增 `wasm_fs_list()` 函式，從 `ChallengeState.store` 取得 keys 並以 JSON 字串陣列回傳
- [x] 1.3 執行 `cargo test --workspace` 確認 Rust 測試通過（57 passed）

## 2. WASM Build

- [x] 2.1 執行 `pnpm wasm:build` 重新編譯 WASM，確認 `wasm_fs_list` 出現在 `.vitepress/wasm/virtual-fs/virtual_fs.js` exports

## 3. ChallengeLayout 改用 wasm_fs_list 自動提取

- [x] 3.1 修改 `ChallengeLayout.vue` 的 `initRuntime()`，import `wasm_fs_list` 並用它取得完整檔案清單，過濾掉 `__app__` 後提取所有檔案，保留 fallback 到 `fm.value.fs`，完成 auto-extract all encrypted FS entries during runtime initialization
- [x] 3.2 依照 mock 更新策略，更新 `tests/__mocks__/virtual-fs.ts` 新增 `wasm_fs_list` mock

## 4. 驗證

- [x] 4.1 執行 `pnpm test -- --run` 確認前端測試全部通過（604 passed, 0 failed）
