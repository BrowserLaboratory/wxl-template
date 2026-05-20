## Context

`tests/unit/components/CodeEditorPanel.test.ts` has 5 failing `it()` cases since the `wxl-template` baseline (AUDIT.md §A.3). 4 fail deterministically under full-suite `pnpm test --run`; the 5th (`destroys editor on unmount`) is flaky — passes in single-file isolation, fails in full-suite. All failures concentrate on Pyodide async mock expectations (`runPythonAsync`, `onCodeExecuted` callback) — the asserted call never happens before the assertion fires.

This change does NOT modify component behavior beyond restoring test fidelity. `CodeEditorPanel.vue` already implements all spec'd requirements (see `openspec/specs/code-editor-panel/spec.md`); the regression is in the test harness's timing alignment with the component's async setup, not in the component itself.

Constraints:
- vitest 4.1.0, @vue/test-utils 2.4.6, happy-dom 20 — versions fixed (per proposal Non-Goals).
- `tests/__mocks__/` Pyodide stub — reusable across test files; changes here must not break other test files that share the same mock.
- Test suite size: 49 files, 652 tests; this change must keep 647 currently-green tests green.

Stakeholders: contributor authoring this fix; CI gate enforcer (post-merge, full-suite green required).

## Goals / Non-Goals

**Goals:**

- Restore the 5 named tests to deterministic PASS under full-suite `pnpm test --run`.
- Confirm root cause (mock timing vs. component init order vs. assertion timing) via systematic-debugging before patching.
- Keep mock changes scoped — any change to `tests/__mocks__/` must not perturb other tests that share the same mock surface.

**Non-Goals:**

- No functional change to `CodeEditorPanel.vue` (allowed only if root cause is confirmed component bug; minimum-viable patch and a separate design entry required).
- No new test framework / mock library.
- No fix for other flaky tests outside the named 5.
- No happy-dom / jsdom environment upgrade.

## Decisions

### Repair strategy ladder (cheapest fix first)

1. **Test-side alignment first.** Add `await flushPromises()` / `await nextTick()` between user interaction and assertion; reorder setup → trigger → await → assert; ensure mounting completes (e.g., `await wrapper.vm.$nextTick()`) before clicking Run. Rationale: cheapest, no shared surface change, no behavioral risk.
2. **Mock realignment second.** If (1) fails, adjust the Pyodide stub's Promise resolution shape (e.g., make `runPythonAsync` return a properly-resolved Promise queued behind a known number of microtasks) — but only via additive options, never by changing existing exported mock behavior. Rationale: contained, but risks shared mock churn.
3. **Component patch last.** Only if root cause is a real CodeEditorPanel.vue defect (e.g., an `onMounted` race with no fix on the test side). Requires a separate design entry and a spec scenario delta.

### Flakiness handling for `destroys editor on unmount`

The flake is full-suite-only (single-file passes). Hypothesis: another test file's cleanup leaks state (timers / global refs / leftover wrappers) that perturbs CodeEditorPanel's unmount path. Decision: investigate full-suite cross-file isolation before patching the test itself. If a leaking neighbor is identified, fix the leak (in the neighbor file or with a vitest `afterEach` hook) rather than weakening the assertion.

### Verification protocol

Run `pnpm test --run` three consecutive times. All three runs MUST show 0 fail. A single intermittent fail in any of the three runs disqualifies the change as not-done.

## Implementation Contract

**Behavior delivered:** `pnpm test --run` exits 0 deterministically; all 5 named scenarios in `CodeEditorPanel.test.ts` PASS in both isolated (`pnpm test --run tests/unit/components/CodeEditorPanel.test.ts`) and full-suite invocations.

**Interface preserved:** No change to public APIs of `CodeEditorPanel.vue`, its props, or the Pyodide bridge contract. Mock surfaces in `tests/__mocks__/` keep backward compatibility for non-CodeEditorPanel callers.

**Acceptance criteria:**

- All 5 tests named in AUDIT.md §A.3 PASS by name match in vitest output.
- Test strength preserved — none of the original assertions weakened (e.g., `toHaveBeenCalledTimes(1)` MUST NOT become `toHaveBeenCalled()`; `expect(arg.error).toBe(true)` MUST NOT become `expect(arg.error).toBeTruthy()`).
- 3 consecutive `pnpm test --run` invocations all exit 0.
- `spectra-audit` returns no Critical / Warning.

**Failure modes intentionally surfaced:**

- If root cause turns out to be a real component bug, the fix moves to component code AND a spec scenario delta is added in this same change (with a design entry documenting the decision).
- If a neighbor test leaks state, the fix lives in the neighbor (or a shared `afterEach`), not by weakening CodeEditorPanel's assertion.

**Scope boundaries:**

- In scope: `tests/unit/components/CodeEditorPanel.test.ts`, possibly Pyodide mock files under `tests/__mocks__/`, possibly a narrowly-scoped `afterEach` hook in a neighbor test if cross-file leakage is identified.
- Out of scope: `CodeEditorPanel.vue` behavioral changes; other test files' assertions; vitest / happy-dom / @vue/test-utils version bumps; new mock infrastructure.

## Risks / Trade-offs

- [Weakening assertion strength to chase green] → Reject in code review; S1-A sub-agent audit checks each repaired assertion against original.
- [Mock change breaks other test files sharing the Pyodide stub] → Run full suite after every mock change; the 647 currently-green tests must remain green.
- [Flake is environmental (CI-only later)] → Verification protocol requires 3 consecutive local full-suite runs; CI behavior tracked as follow-up if local stability does not transfer.
- [Hidden component bug masked by test-side fix] → If S1-B mock-integrity sub-agent finds production / mock divergence beyond timing, escalate to component-patch path (decision ladder step 3).
