## 1. Freshness and packaging

- [x] 1.1 實作 Source freshness detection，更新 "Build script produces per-challenge WASM binary with embedded payload" 與 "Keygen skip logic verifies output file existence" 的輸入比對與 skip 條件。
- [x] 1.2 實作 Binary-preserving FS packaging，更新 "Automatic src scanning" 與 "Build script produces per-challenge WASM binary with embedded payload" 的 byte-preserving 路徑。

## 2. Spec and test alignment

- [x] 2.1 更新 "Post-build obfuscation pipeline strips symbols and applies mutations" requirement，將 Reproducibility wording 與 fresh key generation contract 對齊。
- [x] 2.2 擴充 `tests/unit/scripts/challenge-keygen.test.ts`，驗證 Source freshness detection、Binary-preserving FS packaging、與 Reproducibility wording 對應的 stale rebuild、binary asset、fixed-input coverage。
