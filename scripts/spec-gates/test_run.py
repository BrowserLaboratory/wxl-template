#!/usr/bin/env python3
"""Behavior tests for run.py (the spec-drift gates).

Standalone — run with `python scripts/spec-gates/test_run.py` (no pytest needed).
Exits 0 if every assertion holds, 1 otherwise.

The gate functions take their evidence as arguments rather than shelling out, so
each verdict is testable without building a fixture git repository. Two cases are
regression guards for false positives found while running the prototype by hand
against a real change: G3 must not treat a moved identifier as a deleted message,
and G5 must not fail a baseline scenario whose removal was deliberate and recorded.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUN = HERE / "run.py"
sys.path.insert(0, str(HERE))

import run as gates  # noqa: E402

results: list[tuple[bool, str]] = []


def check(cond, label: str) -> None:
    """cond may be a bool or a callable; an exception counts as a failure so one
    structural gap does not abort the whole run and hide the rest of the picture."""
    try:
        ok = bool(cond() if callable(cond) else cond)
        err = ""
    except Exception as exc:  # noqa: BLE001 - any failure is a failed assertion
        ok, err = False, f"  ({type(exc).__name__}: {exc})"
    results.append((ok, label))
    print(f"  {'PASS' if ok else 'FAIL'}  {label}{err}")


# ── G1 claim-parity ──────────────────────────────────────────────────────────

HEDGES = ["where the challenge", "若", "僅在"]

check(
    lambda: gates.gate_claim_parity([], HEDGES, lambda _p: []).status == "PASS",
    "G1: no declared phrases -> PASS",
)
check(
    lambda: "no phrases" in gates.gate_claim_parity([], HEDGES, lambda _p: []).detail["note"].lower(),
    "G1: no declared phrases -> the output says so rather than passing silently",
)
check(
    lambda: gates.gate_claim_parity(
        ["Send to Repeater"], HEDGES,
        lambda _p: [("docs/a.md", 5, "click it where the challenge grants it")],
    ).status == "PASS",
    "G1: every hit hedged -> PASS",
)
def _g1():
    return gates.gate_claim_parity(
        ["Send to Repeater"], HEDGES,
        lambda _p: [("docs/a.md", 9, "always click Send to Repeater")],
    )
check(lambda: _g1().status == "REVIEW", "G1: an unhedged hit -> REVIEW")
check(
    lambda: _g1().detail["uncovered"] == [("docs/a.md", 9, "always click Send to Repeater")],
    "G1: the uncovered hit is reported with file, line and text",
)
check(
    lambda: all(
        gates.gate_claim_parity(["x"], HEDGES, lambda _p: [("a.md", 1, "x")]).status != "FAIL"
        for _ in range(1)
    ),
    "G1: never reports FAIL",
)

# ── G2 invariance ────────────────────────────────────────────────────────────

check(
    lambda: gates.gate_invariance(
        [(1, "- 不改 `scripts/foo.ts`。")], {"scripts/foo.ts"}
    ).status == "FAIL",
    "G2: a bare unchanged-claim naming a touched file -> FAIL",
)
check(
    lambda: gates.gate_invariance(
        [(1, "- 不改 `scripts/foo.ts` 對 tools 值的**合法性驗證規則**。")], {"scripts/foo.ts"}
    ).status == "REVIEW",
    "G2: a qualified unchanged-claim naming a touched file -> REVIEW",
)
check(
    lambda: gates.gate_invariance([(1, "- 不改 `scripts/bar.ts`。")], {"scripts/foo.ts"}).status == "PASS",
    "G2: an unchanged-claim naming an untouched file -> PASS",
)
check(
    # basename("a/b/") is "" and "" is a substring of every line, so a directory
    # entry would otherwise match every claim in the file.
    lambda: gates.gate_invariance([(1, "- 不改任何東西。")], {"scripts/spec-gates/"}).status == "PASS",
    "G2: a directory entry does not match every line via an empty basename",
)

# ── G3 deleted-literal ───────────────────────────────────────────────────────

check(
    lambda: gates.gate_deleted_literal(
        {"not specified (default all)"}, set(), lambda _l: ["scripts/x.ts:9: msg"]
    ).status == "FAIL",
    "G3: a removed prose literal that still occurs -> FAIL",
)
check(
    lambda: gates.gate_deleted_literal(
        {"not specified (default all)"}, set(), lambda _l: []
    ).status == "PASS",
    "G3: a removed prose literal with no surviving occurrence -> PASS",
)
check(
    lambda: gates.gate_deleted_literal(
        {"not specified (default all)"}, {"not specified (default all)"},
        lambda _l: ["scripts/x.ts:9: msg"],
    ).status == "PASS",
    "G3: a literal reintroduced by the same diff was reworded, not deleted -> PASS",
)
# Regression guard: the prototype flagged three of these.
check(
    lambda: gates.is_prose_literal("<div data-network-panel />") is False,
    "G3: a template fragment is not a prose literal",
)
check(
    lambda: gates.is_prose_literal(", passed: true, message: ") is False,
    "G3: a code fragment is not a prose literal",
)
check(
    lambda: gates.is_prose_literal("sendToRepeater") is False,
    "G3: a bare identifier is not a prose literal",
)
check(
    lambda: gates.is_prose_literal("not specified (default all)") is True,
    "G3: parentheses do not disqualify a user-facing message",
)
check(
    lambda: gates.is_prose_literal("const x = the value; y") is False,
    "G3: assignment syntax disqualifies a literal",
)
check(
    lambda: gates.is_prose_literal("all tabs are enabled by default") is True,
    "G3: a human-readable message is a prose literal",
)

# ── G4 scope parity ──────────────────────────────────────────────────────────

check(
    lambda: gates.gate_scope_parity({"a.ts"}, {"a.ts"}, {"cap"}, {"cap"}).status == "PASS",
    "G4: enumerations match the diff -> PASS",
)
def _g4():
    # signature: (diff_files, listed_files, disk_specs, named_specs)
    # "extra" is on disk but the proposal never names it.
    return gates.gate_scope_parity({"a.ts"}, {"a.ts"}, {"cap", "extra"}, {"cap"})
check(lambda: _g4().status == "FAIL", "G4: a delta spec on disk but unlisted -> FAIL")
check(
    lambda: "extra" in str(_g4().detail["specs_on_disk_not_named"]),
    "G4: the unlisted spec is named in the output",
)
check(
    lambda: gates.gate_scope_parity({"a.ts", "b.ts"}, {"a.ts"}, {"cap"}, {"cap"}).status == "FAIL",
    "G4: a file in the diff but unlisted -> FAIL",
)

check(
    lambda: gates.impact_files(
        "## Impact\n\n- Affected code:\n  - Modified: a.md, b.md, c.ts\n"
    ) == {"a.md", "b.md", "c.ts"},
    "G4: an inline comma-separated Modified list is parsed",
)
check(
    lambda: gates.impact_files(
        "## Impact\n\n- Affected code:\n  - Modified:\n    - a.md\n    - b.md\n"
    ) == {"a.md", "b.md"},
    "G4: a one-file-per-line Modified list is parsed",
)
check(
    lambda: "無" not in " ".join(gates.impact_files(
        "## Impact\n\n- Affected code:\n  - New: (無)\n  - Modified: a.md\n"
    )),
    "G4: an explicit empty marker is not read as a filename",
)

check(
    lambda: gates.impact_files(
        "## Impact\n\n- Affected code:\n  - Modified: a.md\n"
        "- 驗證面:每檔以 scripts/prose-audit/run.py 確認 blocking 歸零。\n"
    ) == {"a.md"},
    "G4: a path mentioned in Impact prose is not read as a declared file",
)

check(
    lambda: "scripts/new_thing.py" in gates.changed_files_from(
        "docs/a.md\n", ["?? scripts/new_thing.py", " M docs/a.md"]
    ),
    "G4: a newly added, not-yet-staged file counts as changed",
)
check(
    lambda: not any(f.endswith("/") for f in gates.changed_files_from(
        "", ["?? scripts/spec-gates/"]
    )),
    "G4: a directory entry never reaches the file set",
)
check(
    lambda: "skills-lock.json" not in gates.changed_files_from(
        "skills-lock.json\n", []
    ),
    "G4: the skills lockfile is excluded as incidental",
)

# ── G5 delta scenario parity ─────────────────────────────────────────────────

_REQ = "UI tab allowlist via tools field"
check(
    lambda: gates.gate_scenario_parity(
        {_REQ: {"A", "B"}}, {_REQ: {"A", "B"}}, ""
    ).status == "PASS",
    "G5: delta covers every baseline scenario -> PASS",
)
def _g5():
    return gates.gate_scenario_parity({_REQ: {"A"}}, {_REQ: {"A", "B"}}, "")
check(lambda: _g5().status == "FAIL", "G5: an unrecorded baseline scenario loss -> FAIL")
check(
    lambda: gates.gate_scenario_parity(
        {_REQ: {"A"}}, {_REQ: {"A", "B"}}, "task 3.1 removes scenario B deliberately"
    ).status == "REVIEW",
    "G5: a deliberate removal recorded in tasks -> REVIEW",
)

# ── G7 archive trace-parity ──────────────────────────────────────────────────

check(
    lambda: gates.gate_trace_parity(
        {"cap": {"requirements": 2, "traces": 2}}, {"cap": {"requirements": 2, "traces": 2}}
    ).status == "PASS",
    "G7: counts unchanged -> PASS",
)
def _g7():
    return gates.gate_trace_parity(
        {"cap": {"requirements": 2, "traces": 2}}, {"cap": {"requirements": 2, "traces": 0}}
    )
check(lambda: _g7().status == "FAIL", "G7: a drop in @trace count -> FAIL")
check(
    lambda: "cap" in str(_g7().detail["dropped"]) and "2" in str(_g7().detail["dropped"]),
    "G7: the capability and both counts appear in the output",
)
check(
    lambda: gates.gate_trace_parity(
        {"cap": {"requirements": 2, "traces": 2}}, {"cap": {"requirements": 1, "traces": 2}}
    ).status == "FAIL",
    "G7: a drop in requirement count -> FAIL",
)

# ── Exit-code contract ───────────────────────────────────────────────────────


def run_cli(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(RUN), *args], capture_output=True, text=True,
        cwd=str(HERE.parent.parent),
    )


check(
    lambda: run_cli(["--help"]).returncode == 0 and "usage" in run_cli(["--help"]).stdout.lower(),
    "CLI: --help exits 0 and prints a usage line",
)
def _help():
    return run_cli(["--help"]).stdout
check(
    lambda: "--snapshot" in _help() and "--verify-archive" in _help(),
    "CLI: --help documents all three modes",
)
check(
    lambda: run_cli(["no-such-change-exists"]).returncode == 2,
    "CLI: an unknown change id exits 2",
)
check(
    lambda: gates.exit_code_for([gates.Verdict("g", "PASS", {}), gates.Verdict("h", "REVIEW", {})]) == 0,
    "CLI: PASS and REVIEW only -> exit 0",
)
check(
    lambda: gates.exit_code_for([gates.Verdict("g", "PASS", {}), gates.Verdict("h", "FAIL", {})]) == 1,
    "CLI: any FAIL -> exit 1",
)

# ── Summary ──────────────────────────────────────────────────────────────────

failed = [label for ok, label in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
if failed:
    print("\nFailed:")
    for label in failed:
        print(f"  - {label}")
sys.exit(1 if failed else 0)
