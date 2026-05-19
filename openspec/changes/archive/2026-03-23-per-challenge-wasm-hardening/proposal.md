## Why

目前挑戰系統的加密金鑰（`fsKeyParts`）和密文（`encryptedFs`）全部存放在 frontmatter 中，以純文字形式出現在 HTML source 裡。金鑰混淆僅是將 64 字元 hex 切成 3 段，重組方式為 `fsKeyParts.join('')`，破解成本極低（LLM 5 分鐘內即可自動生成解密腳本取得 flag）。

需要將金鑰與密文從前端可見的 frontmatter 移入 WASM binary 內部，讓初級到中級程度的學習者（高中至一般大學生）無法透過簡單的 source 閱讀或 LLM 輔助來繞過挑戰，同時維持教學者新增題目的便利性。

## What Changes

- **移除 frontmatter 中的敏感資料**：`fs_key`、`fsKeyParts`、`encryptedFs`、`flag_verifier` 全部從 markdown frontmatter 移除，frontmatter 僅保留公開 metadata（title、backend、difficulty 等）
- **新增 per-challenge WASM binary**：每個挑戰在 build 階段產出獨立的 `.wasm` 檔案，內嵌該挑戰專屬的加密 FS 資料與變換後的金鑰
- **共用 template WASM + post-build 注入**：Rust 僅編譯一次產出 `template.wasm`，build script 透過 WASM custom section 注入 per-challenge 資料，教學者不需碰 Rust
- **Level 2 金鑰混淆**：金鑰在 WASM 內部以 XOR chain + compile-time constant 散布方式儲存，需逆向 WASM 才能還原
- **Post-build WASM 混淆 pipeline**：依序套用 `wasm-strip`（移除符號）、`wasm-opt -O4`（激進優化）、`wasm-mutate`（語意保持的隨機變換）
- **Flag 驗證移入 WASM**：`flag_verifier` hash 也內嵌於 WASM，前端不再持有任何可用於離線破解的資訊
- **前端改為僅傳 slug 給 WASM**：runtime 載入 per-challenge WASM，傳入 slug 即可取得解密後的 FS 內容，不再由 JS 組裝金鑰

## Capabilities

### New Capabilities

- `wasm-challenge-payload`: 定義 per-challenge WASM binary 的 build pipeline——從 template.wasm 複製、custom section 資料注入、金鑰混淆策略（XOR chain + constant scatter）、post-build 混淆工具鏈（wasm-strip → wasm-opt → wasm-mutate）

### Modified Capabilities

- `encrypted-virtual-fs`: WASM 不再接收外部傳入的金鑰，改為內部持有混淆後的金鑰並自行推導解密；新增 custom section 讀取與 flag 驗證功能
- `challenge-framework`: frontmatter schema 移除 `fs_key`、`fsKeyParts`、`encryptedFs`、`flag_verifier` 欄位，新增 `wasmModule` 欄位指向 per-challenge WASM 路徑
- `challenge-runtime-init`: 初始化流程改為載入 per-challenge WASM 而非共用 WASM + JS 傳入金鑰

## Impact

- **Affected specs**: `encrypted-virtual-fs`、`challenge-framework`、`challenge-runtime-init`
- **Affected code**:
  - `scripts/challenge-keygen.ts` — 重寫為 per-challenge WASM payload 注入 pipeline
  - `chall-wasm/virtual-fs/src/` — 新增 custom section 讀取、內部 key derivation、flag verification
  - `.vitepress/challenge/plugin.ts` — 移除 `fsKeyParts`/`encryptedFs` 處理
  - `.vitepress/challenge/config.ts` — 更新 frontmatter schema
  - `.vitepress/theme/layouts/ChallengeLayout.vue` — 改用 per-challenge WASM 載入
  - `.vitepress/theme/composables/usePythonRuntime.ts` — 移除 JS 側金鑰組裝邏輯
  - `.vitepress/theme/composables/usePhpRuntime.ts` — 同上
  - `.vitepress/challenge/crypto.ts` — 可能移除或簡化（加密邏輯移入 WASM）
  - `.vitepress/challenge/flag-verifier.ts` — 移除（驗證移入 WASM）
- **New dependencies**: `wasm-tools`（cargo install）、`binaryen`（pnpm devDependency）
