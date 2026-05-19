## Context

WASM virtual-fs 模組使用 `FsStore`（`HashMap<String, Vec<u8>>`）儲存加密的 FS 條目。目前暴露 `wasm_fs_init`、`wasm_fs_read`、`wasm_fs_write`、`wasm_fs_reset`、`wasm_fs_verify_flag`，但**沒有列舉 keys 的功能**。

ChallengeLayout 依賴 frontmatter `fs` 欄位來決定要提取哪些檔案，但 per-folder 挑戰不使用此欄位，導致除了 `__app__` 之外的檔案（如 `/flag.txt`）不會被寫入 runtime FS。

## Goals / Non-Goals

**Goals:**

- 在 Rust WASM 新增 `wasm_fs_list()` 函式
- ChallengeLayout 改用 `wasm_fs_list()` 自動提取所有檔案
- 更新 JS mock 和測試

**Non-Goals:**

- 不移除 frontmatter `fs` 欄位的支援（保留向後相容）
- 不修改 keygen 打包邏輯
- 不修改 WASM binary payload 格式

## Decisions

### 在 FsStore 新增 keys 方法並暴露 wasm_fs_list

`FsStore` 新增 `pub fn keys(&self) -> Vec<String>` 回傳所有 entry paths。

`wasm_api.rs` 新增：
```rust
#[wasm_bindgen]
pub fn wasm_fs_list() -> Result<JsValue, JsValue> {
    // 回傳 JSON 陣列 ["__app__", "/flag.txt", ...]
}
```

回傳 `JsValue`（JSON 序列化的字串陣列），因為 wasm-bindgen 不直接支援 `Vec<String>` 跨 WASM boundary。使用 `serde_wasm_bindgen::to_value()` 或 `JsValue::from_str()` 搭配 JSON。

替代方案考慮：回傳 `JsValue` 直接做 `js_sys::Array` → 不採用，JSON 字串更簡單且和現有 API 一致。

### ChallengeLayout 改用 wasm_fs_list 自動提取

```typescript
// 取代 fm.value.fs 依賴
const allPaths: string[] = JSON.parse(wasm_fs_list())
const fsPaths = allPaths.filter(p => p !== '__app__')
for (const path of fsPaths) {
  fsEntries[path] = wasm_fs_read(path)
}
```

保留 `fm.value.fs` 作為 fallback：如果 `wasm_fs_list` 不存在（舊 WASM binary），退回到原邏輯。

### Mock 更新策略

`tests/__mocks__/virtual-fs.ts` 新增 `wasm_fs_list` mock，回傳空陣列或測試用的路徑清單。

## Risks / Trade-offs

- [風險] `serde-wasm-bindgen` dependency → 已經是 `wasm-bindgen` 生態系的標準做法，大小影響極小
- [風險] WASM rebuild 需要 Rust toolchain → 開發環境已配置，CI 也有
