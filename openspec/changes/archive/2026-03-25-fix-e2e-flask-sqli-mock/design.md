## Context

commit `646e910` 在 `PythonRuntime` 新增了 `_installAndPatchRequests()` 方法，此方法在 `_init()` 結尾呼叫 `this.pyodide.loadPackage('micropip')` 安裝 requests 套件。同一個 PR 的 unit test (`usePythonRuntime-requests.test.ts`) 已正確 mock `loadPackage`，但較早寫的 E2E test (`flask-sqli.test.ts`) 的 mock 未同步更新。

現有 `PyodideInstance` 介面定義（`usePythonRuntime.ts:96-101`）：

```typescript
interface PyodideInstance {
  runPythonAsync(code: string): Promise<unknown>
  loadPackage(packages: string | string[]): Promise<void>
  FS: { writeFile(path: string, data: Uint8Array | string): void }
  globals: { get(name: string): unknown; set(name: string, value: unknown): void }
}
```

## Goals / Non-Goals

**Goals:**

- 修復 `flask-sqli.test.ts` 的 mock，使其完整符合 `PyodideInstance` 介面
- 全部 601 個測試通過

**Non-Goals:**

- 不重構測試結構或抽取共用 mock factory
- 不處理 ECONNREFUSED 3000 的 stderr 噪音（來自 Vitest API server，非測試失敗）

## Decisions

### 補齊 mock 屬性而非重構共用 factory

直接在 `makeMockFlaskPyodide()` 補上 `loadPackage` 和 `globals.set`，而非抽取跨檔共用的 mock factory。原因：

- 僅一個檔案需要修改，抽取 factory 屬於 over-engineering
- E2E 和 unit test 的 mock 需求不同（E2E 需要自訂 `_asgi_bridge` 回傳值），共用 factory 反而增加複雜度

## Risks / Trade-offs

- [風險] 未來若 `PyodideInstance` 介面再擴充，mock 可能再次不同步 → 這屬於一般維護風險，目前不值得為此建立共用 factory
