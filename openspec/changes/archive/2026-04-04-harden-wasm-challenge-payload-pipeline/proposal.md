## Why

目前 `challenge:keygen` 只要看到既有 `runtime.wasm` 就會跳過產物更新，無法判斷 challenge source 是否已變更；同時 payload 封裝把掃到的檔案一律當成 UTF-8 文字處理，與 runtime 聲稱的 `Uint8Array` FS contract 不一致。這兩個問題會讓本地產物過期，也會阻礙未來 binary asset 進入 challenge FS。

## What Changes

- 改寫 per-challenge rebuild 判定，讓 `challenge:keygen` 依來源變更、輸出缺失或明確強制旗標決定是否重新產生 payload。
- 將 source scan、payload serialization 與 runtime load contract 收斂為 binary-safe 流程，保證非文字檔不會在 build 階段被破壞。
- 更新 payload spec 中關於 deterministic output、per-challenge key material 與 skip/rebuild 行為的敘述，消除互相衝突的語意。
- 補齊 unit 與整合測試，覆蓋 stale payload 防護、binary round-trip 與 frontmatter/runtime artifact 對齊。

## Non-Goals (optional)

- 不更換 `template.wasm` 的格式或 custom section 名稱。
- 不改變 challenge authoring frontmatter 的主要欄位設計，僅調整 build/payload 語義。
- 不在本 change 中重寫 Rust virtual FS runtime。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `wasm-challenge-payload`: 重新定義 payload build/rebuild contract 與 binary packaging guarantees。
- `challenge-file-structure`: 收斂 `src/` 自動掃描輸入與 embedded FS 輸出的 binary semantics。

## Impact

- Affected specs: `wasm-challenge-payload`, `challenge-file-structure`
- Affected code: `scripts/challenge-keygen.ts`, `scripts/challenge-utils.ts`, `tests/unit/scripts/challenge-keygen.test.ts`, `docs/public/challenge/*/runtime.wasm`
