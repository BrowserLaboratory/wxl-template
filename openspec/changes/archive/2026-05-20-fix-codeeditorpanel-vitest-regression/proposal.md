## Why

Five tests in `tests/unit/components/CodeEditorPanel.test.ts` have been failing since the `wxl-template` baseline established by Change 1（`project-audit-and-cleanup`）。failures are concentrated in Pyodide async mock 呼叫期望，AUDIT.md A.3 已詳列。本 change 之目的是把這個 known regression 從「durable-tracked finding」升級為「fix in flight」，避免被後續 i18n / docs 工作（Change 2/3/4）忽略而長期殘留。

未修復前，`pnpm test --run` 永遠 exit 1；CI 啟動後此 regression 會 block 任何嚴格 test gate。Stage 4.2 of Change 1 已將本 change 建立為 parked 狀態作為單一收容點。

## What Changes

- **修復**或**重寫** `tests/unit/components/CodeEditorPanel.test.ts` 內以下 5 個 `it()`，使其在 full-suite `pnpm test --run` 環境下全部通過：
  1. `CodeEditorPanel > calls runPythonAsync when Run is clicked`
  2. `CodeEditorPanel > destroys editor on unmount`（AUDIT.md A.3 標為 flaky：full-suite 穩定失敗、隔離跑時偶會通過）
  3. `CodeEditorPanel > calls onCodeExecuted callback on successful execution`
  4. `CodeEditorPanel > calls onCodeExecuted with error flag on exception`
  5. `CodeEditorPanel > works without onCodeExecuted prop (optional)`
- **根因調查**：以 systematic-debugging 流程定位是 mock 計時、setup 順序、`flushPromises()` 行為差異、Vue Test Utils v2.4.6 與 happy-dom v20 之新版 microtask scheduling 差異、Pyodide stub mock 與真實 Pyodide API 演化等多重可能性中的哪一條
- **不擴大修改範圍**：不修改 `CodeEditorPanel.vue` 之功能行為（除非根因確認為 component bug，且修正範圍最小化）；不修改其他元件之測試；不引入新測試框架 / 新 mock library

## Non-Goals

- 不修改 `CodeEditorPanel.vue` 之功能行為（除非根因確認為 component bug）
- 不修改其他 49 個 test files 之內容
- 不引入新的測試框架（vitest 4.1.0 與 @vue/test-utils 2.4.6 維持不變）
- 不引入新的 mock library（vi.fn / vi.mock 維持）
- 不解決其他偶發 / 未列入此 5 條清單之 flaky 測試
- 不在本 change 範圍內處理 happy-dom / jsdom 之 environment 升級

## Capabilities

### New Capabilities

（無新增 capability。本次為 test regression 修復，不引入新規範行為。）

### Modified Capabilities

（無 spec 變動。CodeEditorPanel.vue 之 capability `code-editor-panel` 規範若未變更則無 delta；若根因確認為 component bug 之微修，將另案決定是否需 spec delta。）

## Impact

- **Affected code**：`tests/unit/components/CodeEditorPanel.test.ts`（主要）；可能 `tests/__mocks__/` 下與 Pyodide 相關之 mock 檔；極少數情境下 `.vitepress/theme/components/CodeEditorPanel.vue`。
- **Affected workflows**：修復後 `pnpm test --run` exit 0；後續 CI 設定可開始要求測試套件全綠 gate。
- **Affected specs**：預期無；若修復觸及 component 規範行為再評估 delta。
- **Reference**：`AUDIT.md` §A.3（失敗清單與推測根因）。

## Source

本 change 由 `project-audit-and-cleanup` Stage 4.2 建立並 park。建立人：Spectra apply skill 於 2026-05-19。
