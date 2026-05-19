## Context

目前 `challenge:keygen` 的 skip 行為只檢查 `wasmModule` 與輸出檔是否存在，無法辨識 challenge source 是否已變更；同時 `src/` 自動掃描會把所有檔案以 UTF-8 文字讀入再轉回 bytes，導致 runtime contract 與 build pipeline 對 binary FS 的假設不一致。這些問題不一定會在乾淨 CI 立即爆炸，但會讓本地產物 freshness 與未來 binary asset 支援失真。

## Goals / Non-Goals

**Goals:**

- 讓 keygen 的 skip/rebuild 決策真正反映 challenge source freshness。
- 讓 `src/` 掃描、payload 封裝與 runtime 載入一路保留 binary-safe semantics。
- 讓 payload spec 關於 randomness 與 reproducibility 的文字不再互相衝突。

**Non-Goals:**

- 不更換 payload custom section 格式。
- 不改寫 Rust virtual FS API 或加密演算法。
- 不把所有 build steps 改造成內容雜湊快取系統。

## Decisions

### Source freshness detection

keygen 的 skip 條件將以 `runtime.wasm` 的修改時間為基準，比對所有 payload 輸入：challenge markdown/frontmatter、`src/` 內被納入的檔案、`.fsignore`、flag file、以及 template WASM。只要任何輸入比輸出新，或輸出不存在，或使用 `--force`，就必須重建該 challenge 的 payload。

### Binary-preserving FS packaging

`src/` 掃描產物中的一般 FS entries 將以原始 bytes 讀取與封裝，不再經過 UTF-8 round-trip。只有 `app` 與必要的 metadata text 仍以文字解析；其餘虛擬檔案內容一律以 `Uint8Array` 形式進入 payload pipeline。

### Reproducibility wording

規格將區分「固定輸入下的可重現 obfuscation」與「預設 keygen flow 會產生新 key material」兩件事。也就是說，只有在 seed、key material 與 payload bytes 都固定時，byte-identical output 才是 contract；預設 fresh keygen 只保證行為等價，不保證位元完全相同。

## Risks / Trade-offs

- [Risk] 以 mtime 為基礎的 freshness 檢查在極端 clock skew 情境下可能有誤判。 → Mitigation: 保留 `--force`，並將輸入集合定義清楚，先解決本地 stale payload 主風險。
- [Risk] binary-safe 讀取會讓部分既有文字型測試 fixture 需要重寫為 bytes-aware assertions。 → Mitigation: 在同一 change 補上 round-trip tests，避免規格與測試再次分離。

## Migration Plan

1. 先更新 spec，固定 freshness 與 binary semantics。
2. 實作 keygen 判斷與 bytes-based packaging。
3. 以 `--force` 重新產生一次 challenge artifacts，確認新舊樣本都能載入。

## Open Questions

- 若未來 mtime-based freshness 仍不足，再評估是否引入 sidecar manifest 或內容雜湊，但不在本 change 先行擴張。
