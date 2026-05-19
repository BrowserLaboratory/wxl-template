## Problem

E2E 測試 `tests/e2e/flask-sqli.test.ts` 中的第一個測試案例（`routes challenge request through SW → Python runtime → returns response`）失敗，錯誤訊息為：

```
TypeError: this.pyodide.loadPackage is not a function
```

commit `646e910` 新增了 `_installAndPatchRequests()` 方法，在 `PythonRuntime._init()` 結尾會呼叫 `this.pyodide.loadPackage('micropip')`，但 E2E 測試的 mock Pyodide 物件並未跟著更新。

## Root Cause

`flask-sqli.test.ts` 中的 `makeMockFlaskPyodide()` 建立的 mock 缺少兩個屬性：

- `loadPackage` — `_installAndPatchRequests()` 在第 263 行呼叫，導致 TypeError
- `globals.set` — `PyodideInstance` 介面要求但 mock 未提供

同一個 PR 中新增的 unit test（`usePythonRuntime-requests.test.ts`）已正確包含這兩個屬性，但 E2E test 的 mock 遺漏了。

## Proposed Solution

更新 `tests/e2e/flask-sqli.test.ts` 中 `makeMockFlaskPyodide()` 的 mock 物件，補上缺少的 `loadPackage` 和 `globals.set`，使其符合 `PyodideInstance` 介面的完整定義。

## Success Criteria

- `pnpm test -- --run` 全部 601 個測試皆通過（0 failed）
- `flask-sqli.test.ts` 的兩個測試案例均為綠燈
- mock 物件完整覆蓋 `PyodideInstance` 介面所有必要方法

## Impact

- Affected code: `tests/e2e/flask-sqli.test.ts`
