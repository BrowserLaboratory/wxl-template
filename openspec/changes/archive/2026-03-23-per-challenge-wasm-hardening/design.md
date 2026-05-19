## Context

目前挑戰系統將所有敏感資料（加密金鑰 `fsKeyParts`、密文 `encryptedFs`、flag 驗證 hash `flag_verifier`）嵌入 markdown frontmatter，最終以 JSON 形式出現在 HTML hydration data 中。金鑰混淆僅為 3 段字串拼接，攻擊者可透過閱讀 HTML source 或餵給 LLM 在數分鐘內完成破解。

現有架構：
- Rust WASM (`virtual-fs`) 負責 IndexedDB 加解密，但金鑰由前端 JS 組裝後傳入
- VitePress build plugin (`challenge-keygen.ts`) 在 build 時加密 FS 內容並寫入 frontmatter
- Flag 驗證完全在前端 JS 進行（`flag-verifier.ts`）

目標群體：高中至一般大學生（非資安專長），需讓破解成本從「看 source 即可」提升至「需要 WASM 逆向能力」。

## Goals / Non-Goals

**Goals:**

- 從前端 HTML/JS 中完全移除金鑰材料、密文、flag verifier
- 每個挑戰產出獨立的 `.wasm` binary，內嵌該挑戰專屬的加密資料與混淆金鑰
- 維持教學者新增題目的便利性：不需碰 Rust，只寫 markdown + config + source code
- 使用 Level 2 混淆（XOR chain + compile-time constant scatter）保護 WASM 內的金鑰
- Build 後套用 `wasm-strip` → `wasm-opt` → `wasm-mutate` 工具鏈

**Non-Goals:**

- 完全防禦有 WASM 逆向經驗的攻擊者（C 類攻擊者，接受無法完全防禦）
- 控制流扁平化、假分支等 Level 3 混淆（對目標群體 overkill）
- 引入後端伺服器進行金鑰管理（維持純靜態站台架構）
- 改變教學者的出題流程或要求其學習 Rust

## Decisions

### Per-challenge WASM binary 透過 post-build 注入產生

Rust 程式碼只編譯一次產出 `template.wasm`，build script 對每個挑戰複製一份後注入 per-challenge 資料為 WASM custom section `"chall-data"`。

**替代方案：**
- 共用 WASM + master secret：一破全破，安全性不足
- Per-challenge 重新編譯 Rust：教學者需碰 Rust，不可接受

**理由：** 兼顧每題獨立金鑰（不會一破全破）與教學者零 Rust 門檻。

### Custom section 資料格式

`"chall-data"` custom section 內含二進位打包的結構：

```
┌──────────────────────────────────────────────┐
│ magic: [u8; 4]        "CHWD"                 │
│ version: u8           1                      │
│ slug_len: u16         challenge slug 長度      │
│ slug: [u8; slug_len]  challenge slug          │
│ key_material_len: u16 混淆金鑰材料長度         │
│ key_material: [u8; key_material_len]          │
│   → XOR-encoded key + scatter constants       │
│ verifier_len: u16     flag verifier 長度       │
│ verifier: [u8; verifier_len]  PBKDF2 hash     │
│ entry_count: u16      FS entry 數量            │
│ entries: [Entry; entry_count]                 │
│   Entry:                                      │
│     path_len: u16                             │
│     path: [u8; path_len]                      │
│     data_len: u32                             │
│     data: [u8; data_len]  AES-GCM encrypted   │
│ metadata_len: u16                             │
│ metadata: [u8; metadata_len]  JSON            │
│   → { backend, source_visible, packages }     │
└──────────────────────────────────────────────┘
```

**理由：** 二進位格式讓 custom section dump 出來的內容不可直接閱讀，增加逆向門檻。

### Level 2 金鑰混淆策略

金鑰不以明文存在於 WASM binary 中。Build script 進行以下變換：

1. 產生隨機 per-challenge AES-256 key（32 bytes）
2. 產生 3 個隨機 XOR mask（各 32 bytes），作為 Rust compile-time constants 嵌入 template.wasm 的 code section
3. `stored_key = key XOR mask_a XOR mask_b XOR mask_c`
4. `stored_key` 存入 custom section 的 `key_material`
5. Runtime 解碼：WASM 內部從 code section 取 3 個 mask，XOR 還原 key

**注意：** 3 個 XOR mask 是固定嵌入 template.wasm 的 compile-time constants，所有挑戰共用。但因為每題的 `stored_key` 不同（per-challenge random key XOR 固定 masks），破解一題不等於破解其他題——除非攻擊者同時逆向出 masks（此時等同逆向了核心演算法）。

**替代方案：**
- Level 1（簡單散布）：靜態分析太容易
- Level 3（控制流混淆）：對目標群體 overkill，維護成本高

### Post-build WASM 混淆 pipeline

```
cargo build --release --target wasm32-unknown-unknown
    → wasm-strip（移除所有符號名稱與 debug info）
    → wasm-opt -O4（激進優化，重排指令）
    → 存為 template.wasm

per-challenge build：
    cp template.wasm → <slug>.wasm
    → 注入 custom section
    → wasm-mutate --seed <per-challenge-seed>（語意保持的隨機變換）
```

`wasm-mutate` 的 seed 使用挑戰 slug 的 hash，確保 build 可重現但每題的 WASM 結構不同。

**工具來源：**
- `wasm-strip`、`wasm-mutate`：`cargo install wasm-tools`
- `wasm-opt`：`pnpm add -D binaryen`

### Frontmatter 簡化與 wasmModule 欄位

Frontmatter 只保留公開資訊：

```yaml
---
layout: challenge
title: SQL Injection Demo
backend: flask
source_visible: true
difficulty: easy
category: injection
packages: []
wasmModule: /challenge/sqli-demo/runtime.wasm
---
```

`fs_key`、`fsKeyParts`、`encryptedFs`、`flag_verifier` 全部移除。新增 `wasmModule` 指向 per-challenge WASM 路徑。

### Flag 驗證移入 WASM

`flag_verifier` hash 嵌入 custom section。前端提交 flag 時呼叫 WASM export function `wasm_verify_flag(flag_bytes) -> bool`，WASM 內部進行 PBKDF2 計算與 constant-time comparison。

**理由：** 避免 `flag_verifier` hash 出現在 JS 可讀的範圍內。攻擊者無法從前端取得 hash 後離線暴力破解。

### Build script 重構

現有 `scripts/challenge-keygen.ts` 的職責從「加密 + 寫回 frontmatter」改為：

1. 讀取 challenge markdown 的 frontmatter（取 `backend`、`app`、`fs` 等欄位）
2. 讀取 `config.toml`（如果存在）或沿用 frontmatter 中的設定
3. 產生 random per-challenge key
4. 加密所有 FS entries（AES-GCM-256）
5. 計算 flag_verifier（PBKDF2-HMAC-SHA256）
6. 進行 Level 2 金鑰混淆
7. 打包為 binary blob
8. 複製 template.wasm → `<slug>.wasm`
9. 注入 blob 為 custom section `"chall-data"`
10. 執行 `wasm-mutate`
11. 輸出至 `docs/public/challenge/<slug>/runtime.wasm`
12. 更新 frontmatter 的 `wasmModule` 欄位

### WASM API 介面變更

現有 exports：
- `wasm_fs_init(slug, encrypted_blob, key)` — 外部傳入 key
- `wasm_fs_read(key, path)` — 外部傳入 key
- `wasm_fs_write(key, path, data)` — 外部傳入 key
- `wasm_fs_reset(slug, encrypted_blob, key)` — 外部傳入 key

新 exports：
- `wasm_fs_init(slug)` — 從 custom section 自行取得 key 與資料
- `wasm_fs_read(path)` — 不再需要外部傳入 key
- `wasm_fs_write(path, data)` — key 內部持有
- `wasm_fs_reset(slug)` — 從 custom section 重新載入
- `wasm_verify_flag(flag_bytes) -> bool` — 新增，flag 驗證

## Risks / Trade-offs

**[XOR masks 共用] → 緩解：每題 stored_key 不同**
3 個 XOR mask 嵌入 template.wasm 中且所有題目共用。理論上逆向一次 WASM 即可取得 masks，配合任何題目的 custom section 即可還原 key。但對目標群體（高中~大學生）來說，逆向 stripped + optimized + mutated 的 WASM 來找到散布在多個 function 中的 constants 仍然是極高的門檻。

**[Build 時間增加] → 緩解：僅首次需要 cargo install**
Cloudflare Pages 首次 build 需額外 `cargo install wasm-tools`（~2-3 分鐘），後續有 cache 可加速。per-challenge 的 `wasm-mutate` 操作每題 < 1 秒。

**[WASM 檔案體積] → 緩解：gzip 壓縮**
per-challenge WASM 檔案比共用一個 WASM 多出 N-1 份 code section 複本。但因 code section 完全相同（只有 custom section 不同），CDN gzip/brotli 壓縮效果極佳。

**[wasm_fs_write 仍需 key] → 內部持有即可**
IndexedDB 寫入加密仍需 key，但 key 已在 WASM 初始化時從 custom section 推導並存於 WASM linear memory 中，不需外部傳入。

**[source_visible 的明文 app code] → 接受**
白箱挑戰的 app source 本來就是公開的。新架構下白箱挑戰的 app code 仍以明文存在於 WASM custom section 的 metadata 中，但 flag.txt 永遠加密。
