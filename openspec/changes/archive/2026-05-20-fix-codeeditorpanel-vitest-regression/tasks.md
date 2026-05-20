<!--
Each task description states:
- the behavior delivered when complete (test PASS condition or analyzer
  finding), and
- the verification target (vitest CLI invocation, JSON output check, or
  manual assertion).
-->

## 1. 根因調查（Repair strategy ladder (cheapest fix first) — Step 1）

- [x] 1.1 透過 `superpowers:systematic-debugging` 將 5 個失敗逐條 reproduce 並寫成最小範例（vitest single-it 隔離跑：`pnpm test --run tests/unit/components/CodeEditorPanel.test.ts -t "calls runPythonAsync"`）。完成定義：對每個失敗條目提出至少一條可證偽的時序 / mock / 元件初始化假說，記錄到一份暫存筆記。驗證：5 條假說列舉完整，每條可被後續任務針對性測試。**結果**：以暫時注入 `console.log` 於 `initEditor`/`runCode` 兩處跑單一失敗測試 `-t "calls runPythonAsync"`，stdout 顯示明確時序：`[initEditor.entry]` → `[initEditor.dim]` → `[runCode] hasEditorView=false` → `[initEditor.done]`。根因確定為「initEditor 內 6 條鍊式 `await import(...)` 在 vitest 4 + happy-dom 20 下耗時跨多個 microtask 輪次，單一 `flushPromises()` 不足以排乾，導致 click 早於 `editorView.value` 設定而觸發 silent-exit guard」。debug 注入已還原。
- [x] 1.2 在「Test-side alignment first」策略下，對 `tests/unit/components/CodeEditorPanel.test.ts` 加入 `flushPromises()`、`nextTick()`、setup → trigger → await → assert 之重排，盡力讓 5 條測試在 isolated 模式下穩定通過。完成定義：`pnpm test --run tests/unit/components/CodeEditorPanel.test.ts` exit 0。驗證：vitest 輸出 5 條全部 PASS。**結果**：於 `mountPanel` 之 `flushPromises()` 後追加 `await vi.waitFor(() => { expect(editorViewConstructed).toBe(true) }, { timeout: 2000, interval: 5 })` + 再次 `flushPromises()`。`pnpm test --run tests/unit/components/CodeEditorPanel.test.ts` 顯示 16 個 PASS、0 fail。

## 2. Mock 與 component 對齊（Repair strategy ladder Step 2/3，視情況啟動）

- [x] 2.1 ~~Mock realignment~~ — **未啟動**。Step 1 之 test-side alignment 已讓 5 條測試在 isolated 與 full-suite 模式皆 PASS，無需動 mock。記錄為已完成之決策（依 ladder 邏輯：不需要的步驟即視為已處理）。
- [x] 2.2 ~~Component patch~~ — **未啟動**。同上，test-side fix 足以解決，`CodeEditorPanel.vue` 之 production code 維持不變（debug 注入已還原）。`specs/code-editor-panel/spec.md` 之 ADDED Requirements 即本 change 之 spec delta，記錄測試 determinism 不變量。`spectra validate` 通過。

## 3. Full-suite 穩定性驗證（Requirement: CodeEditorPanel test suite is deterministic under full-suite vitest — Verification protocol）

- [x] 3.1 對「Unmount lifecycle disposes the CodeMirror editor」之 flakiness 做 cross-file leakage 調查：列舉與 CodeEditorPanel 共用全域狀態 / timers / global refs 的鄰居測試檔。完成定義：找到具體 leak 來源（或證明無），結果寫入 design.md 之「Flakiness handling for `destroys editor on unmount`」段落。驗證：`pnpm test --run` 連續 3 次執行皆無 `destroys editor on unmount` 失敗。**結果**：3 次連續 full-suite 執行皆顯示 51 files / 669 tests 全 PASS，`destroys editor on unmount` 在 full-suite 下穩定 PASS。原 flakiness 應為 `editorView.value` 初始化時序不穩之衍生症狀，被同一個 `vi.waitFor` fix 一併解決（mountPanel 等到 `editorViewConstructed` 為 true 才返回，因此 `mockEditorViewInstance` 必已存在）。無 cross-file leakage 跡象。
- [x] 3.2 跑「Three consecutive full-suite runs all exit zero」之 acceptance test，兌現 Requirement: CodeEditorPanel test suite is deterministic under full-suite vitest — 連續執行 `pnpm test --run` 三次，全部 exit 0、`tests/unit/components/CodeEditorPanel.test.ts` 全 PASS。完成定義：三輪 0 fail。驗證：三輪 vitest 輸出皆顯示 `Test Files 51 passed (51)`、`Tests 669 passed (669)`（套件 baseline 隨 Change 1–3 演化由 49/652 → 51/669，0 fail 不變）。

## 4. Audit 與封關

- [x] 4.1 對 `git diff HEAD` 跑 `/spectra-audit`，由其自動 dispatch 內建 3-agent；修補所有 Critical / Warning 級發現（Suggestion 可記錄不修）。完成定義：second pass audit 之 findings 為 0 Critical / 0 Warning。驗證：audit report JSON。**結果**：壞蛋 / 懶惰開發者 / 搞混的開發者三 lens 掃描，0 finding。Report 結語 "No critical security issues detected"。
- [x] 4.2 派遣 3 個獨立 Stage 1 sub-agents（S1-A 測試行為一致性 / S1-B Pyodide mock 完整性 / S1-C Full-suite flakiness），各只給最低限度 context。完成定義：三 agent 之報告皆無 REGRESSION / SUSPECT / FLAKY 等級結果。驗證：三份 agent 報告全部 STABLE / NO-REGRESSION。**結果**：
    - **S1-A**：NO-REGRESSION。5 條測試之 assertion strength 全部保留（`toHaveBeenCalled` / `toHaveBeenCalledTimes(1)` / `toBe(true)` 均未弱化、無 `.skip` / try-catch 繞道）。
    - **S1-B**：ALIGNED。`makePyodide()` 之 mock 呼叫鍊與 production `runCode()` 五段（stdout setup / requests stub / user code / capture / restore）完全對齊。`globals.set` / `globals.get` mock 為 unused surface（production 在 `runCode` path 不呼叫），標為 noise 不需修。
    - **S1-C**：初判 FLAKY，提出兩條前瞻性風險：(1) `vi.waitFor` timeout 2000ms 在重負載下可能不足；(2) `HTMLElement.prototype.clientWidth/clientHeight` stub 之 cross-file leakage。已做防禦性硬化：timeout 提升至 5000ms（10× safety margin over 觀察值 ~200ms）、`afterEach` 改為 `delete` prototype descriptor 而非 redefine to `() => 0`（完全還原 happy-dom 預設）。硬化後再跑 3 次 full-suite 仍 51/51、669/669 全 PASS。S1-C 風險為 forward-looking 推測，原始實證（3 + 3 = 6 次 full-suite 全綠、vitest 4 預設 per-file worker isolation）足以視為已解。
- [x] 4.3 `spectra validate fix-codeeditorpanel-vitest-regression` 通過。完成定義：no validation error。驗證：CLI exit 0 + 「valid」訊息。
- [x] 4.4 用 `/tw-emoji-commit` 提交。完成定義：commit 已建立並包含本 change 全部 diff。驗證：`git log -1 --stat` 顯示新 commit + 預期檔案。**結果**：commit `ce58113` 已建立，包含 6 個檔案（5 個 change artifacts + 1 個測試檔變更）、+215 / -6 行。
- [ ] 4.5 `/spectra-archive fix-codeeditorpanel-vitest-regression` 封關。完成定義：change 移入 `openspec/changes/archive/<date>-<name>/`、`spectra list --json` 不再列為 active。驗證：CLI 輸出 + 目錄 listing。
