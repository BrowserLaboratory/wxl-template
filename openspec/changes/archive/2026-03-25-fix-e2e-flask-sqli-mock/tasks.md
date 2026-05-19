## 1. 補齊 mock 屬性而非重構共用 factory

- [x] 1.1 在 `tests/e2e/flask-sqli.test.ts` 的 `makeMockFlaskPyodide()` 中補上 `loadPackage: vi.fn().mockResolvedValue(undefined)`，修復 E2E test mock completeness
- [x] 1.2 在同一 mock 物件的 `globals` 中補上 `set: vi.fn()`，確保 E2E test mock includes globals.set

## 2. 驗證

- [x] 2.1 執行 `pnpm test -- --run` 確認全部 601 個測試通過（0 failed）
