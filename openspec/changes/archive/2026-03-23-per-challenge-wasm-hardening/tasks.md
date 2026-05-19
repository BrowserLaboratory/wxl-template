## 1. Rust WASM 核心改造

- [x] 1.1 在 `chall-wasm/virtual-fs/src/` 新增 custom section 讀取模組，實作 `"chall-data"` custom section 資料格式解析（magic header `CHWD`、版本驗證、欄位解包），對應 spec「Custom section uses binary-packed format with magic header」
- [x] 1.2 新增 Level 2 金鑰混淆策略的 XOR chain key derivation 模組，實作「Key material is obfuscated using XOR chain with compile-time constants」：定義 3 個 32-byte compile-time const masks，從 custom section 的 key_material XOR 還原 AES-256 key
- [x] 1.3 修改 WASM API 介面變更：`wasm_fs_init` / `wasm_fs_read` / `wasm_fs_write` / `wasm_fs_reset` 移除外部 key 參數，改為內部持有 key（對應 spec「Rust WASM module encrypts and stores FS content in IndexedDB」和「FS content is decrypted on read and mounted into runtime memory」）
- [x] 1.4 實作 `wasm_verify_flag(flag_bytes) -> bool` export function，內部執行 PBKDF2-HMAC-SHA256 + constant-time comparison（對應 spec「Flag verification is performed inside WASM」和「Flag verification uses PBKDF2 without storing plaintext flag」）
- [x] 1.5 修改 `wasm_fs_init(slug)` 從 custom section 讀取「FS is initialized from build-time encrypted blob」並初始化 IndexedDB
- [x] 1.6 修改 `wasm_fs_reset(slug)` 從 custom section 重新載入（對應 spec「FS supports reset to initial state」）

## 2. Build Pipeline 改造

- [x] 2.1 重寫 `scripts/challenge-keygen.ts`：產生 per-challenge random key、加密 FS entries、計算 flag_verifier、執行 Level 2 金鑰混淆、打包為 binary blob（對應 design「Build script 重構」和 spec「Build script produces per-challenge WASM binary with embedded payload」）
- [x] 2.2 實作 WASM custom section 注入邏輯（Node.js），將 binary blob 注入複製的 template.wasm 為 `"chall-data"` section
- [x] 2.3 整合 post-build 混淆 pipeline：`wasm-strip` → `wasm-opt -O4` → `wasm-mutate`（對應 design「Post-build WASM 混淆 pipeline」和 spec「Post-build obfuscation pipeline strips symbols and applies mutations」）
- [x] 2.4 新增 `binaryen` 為 devDependency，更新 `package.json` build scripts 加入 `cargo install wasm-tools` 步驟
- [x] 2.5 確保 template.wasm 在 Rust build 後自動產出並經過 strip + opt 處理（對應 design「Per-challenge WASM binary 透過 post-build 注入產生」）

## 3. Frontmatter Schema 與 VitePress Plugin 改造

- [x] 3.1 修改 `.vitepress/challenge/config.ts` frontmatter schema：移除 `fs_key`、`fsKeyParts`、`encryptedFs`、`flag_verifier` 欄位，新增 `wasmModule` 欄位（對應 spec「Frontmatter schema defines challenge metadata」和 design「Frontmatter 簡化與 wasmModule 欄位」）
- [x] 3.2 修改 `.vitepress/challenge/plugin.ts`：移除加密邏輯和 key obfuscation，改為只讀取公開 metadata 並委託 build script 處理加密（對應 spec「VitePress plugin processes challenge frontmatter at build time」和「Build plugin encrypts app source file and stores it under reserved key」遷移至 build script）
- [x] 3.3 更新所有挑戰 markdown 檔案（`docs/challenge/*.md`）：移除 `fs_key`、`fsKeyParts`、`encryptedFs`、`flag_verifier`，保留公開欄位
- [x] 3.4 新增 legacy 欄位偵測：若 frontmatter 含已廢棄欄位，emit build warning（對應 spec scenario「Frontmatter containing legacy key fields causes build warning」）

## 4. 前端 Runtime 整合

- [x] 4.1 修改 `ChallengeLayout.vue`：從 `wasmModule` 載入 per-challenge WASM，呼叫新的 `wasm_fs_init(slug)` API（對應 spec「Challenge page initializes WASM runtime on mount」）
- [x] 4.2 修改 `usePythonRuntime.ts` 和 `usePhpRuntime.ts`：移除 JS 側金鑰組裝邏輯（`fsKeyParts.join('')`），改用不帶 key 參數的 `wasm_fs_read(path)`
- [x] 4.3 修改 flag 提交流程：改為呼叫 `wasm_verify_flag(flag_bytes)` 而非 JS 側 PBKDF2 驗證（對應 design「Flag 驗證移入 WASM」）
- [x] 4.4 移除或簡化 `.vitepress/challenge/crypto.ts` 和 `.vitepress/challenge/flag-verifier.ts`（前端不再需要加解密和 flag 驗證邏輯）
- [x] 4.5 確認「App code is decrypted from encryptedFs and executed」流程：修改 `wasm_fs_reset(slug)` 呼叫點從 custom section 重新載入，確保 `__app__` entry 正確解密

## 5. 測試與驗證

- [x] 5.1 更新 Rust 單元測試：測試 custom section 解析、XOR key derivation、flag verification
- [x] 5.2 更新 `tests/__mocks__/virtual-fs.ts` mock 配合新 API（無 key 參數）
- [x] 5.3 更新 `tests/unit/challenge/plugin.test.ts` 和 `config.test.ts` 配合新 frontmatter schema
- [x] 5.4 更新 `tests/unit/composables/` 下的 runtime 測試配合新 WASM 載入流程
- [x] 5.5 更新 E2E 測試（`tests/e2e/`）確認挑戰端到端正常運作
- [x] 5.6 驗證 build output 中 HTML source 不包含任何 key/encrypted data（對應 spec scenario「No encrypted data in HTML hydration output」）
