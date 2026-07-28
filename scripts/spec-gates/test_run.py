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

import contextlib
import io
import json
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUN = HERE / "run.py"
sys.path.insert(0, str(HERE))

import run as gates  # noqa: E402

results: list[tuple[bool, str]] = []


def _capture_error(fn):
    """The exception fn raises, or None."""
    try:
        fn()
    except Exception as exc:  # noqa: BLE001 - the message is what is under test
        return exc
    return None


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


# ── sh(): subprocess failures must not read as empty output ──────────────────
# `git grep` exits 1 for "no match" and 128 for an error, and sh() returned
# stdout for both. G3 asks whether a deleted literal survives anywhere; a failed
# grep therefore looked exactly like "it survives nowhere" and the gate passed.


def _raises(fn, exc=Exception):
    try:
        fn()
    except exc:
        return True
    except Exception:
        return False
    return False


# Assembled at runtime: these gates grep the whole repository, and this file is
# part of it, so a literal needle written here would find itself.
ABSENT = "zqx" + "-not-present-" + "anywhere"

check(
    lambda: gates.sh("git", "grep", "-l", ABSENT, "--", ".", ok=(0, 1)) == "",
    "sh: git grep's 'no match' exit 1 is an accepted outcome, not an error",
)
check(
    lambda: _raises(lambda: gates.sh("git", "grep", ABSENT, "--", "/nonexistent-pathspec"),
                    gates.GateError),
    "sh: an unexpected exit code raises rather than returning empty output",
)
check(
    lambda: "git" in str(
        _capture_error(lambda: gates.sh("git", "grep", ABSENT, "--", "/nonexistent-pathspec"))
    ),
    "sh: the raised message names the command that failed",
)
check(
    lambda: _raises(lambda: gates.sh("definitely-not-a-real-binary-xyz"), gates.GateError),
    "sh: a missing binary raises GateError rather than FileNotFoundError",
)
check(
    lambda: gates.sh("git", "rev-parse", "--git-dir", ok=(0, 128)).strip() != "",
    "sh: an explicitly tolerated exit code still returns its output",
)

# G3's adapter must keep tolerating "no match" while a real failure propagates.
check(
    lambda: gates._grep_lines(ABSENT, "nothing/") == [],
    "G3: a literal with no occurrence yields an empty hit list, not an error",
)
check(
    lambda: len(gates._grep_lines("gate_invariance", "nothing/")) > 0,
    "G3: a literal that does occur is found",
)
check(
    lambda: gates.grep_phrase(ABSENT, "nothing/") == [],
    "G1: a phrase with no occurrence yields an empty hit list",
)


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
# The pattern was case-sensitive, so the ordinary sentence-initial English
# phrasing of an unchanged-claim escaped the gate entirely.
check(
    lambda: gates.gate_invariance(
        [(1, "- `scripts/foo.ts` is Unchanged by this change.")], {"scripts/foo.ts"}
    ).status == "FAIL",
    "G2: an unchanged-claim is matched regardless of letter case",
)
check(
    lambda: gates.gate_invariance(
        [(1, "- No change to `scripts/foo.ts`.")], {"scripts/foo.ts"}
    ).status == "FAIL",
    "G2: a sentence-initial 'No change to' is matched",
)
check(
    # basename("a/b/") is "" and "" is a substring of every line, so a directory
    # entry would otherwise match every claim in the file.
    lambda: gates.gate_invariance([(1, "- 不改任何東西。")], {"scripts/spec-gates/"}).status == "PASS",
    "G2: a directory entry does not match every line via an empty basename",
)

# Matching by basename substring made a claim about one file answer for another
# that merely shares a filename. This repository has three `run.py` files.
def _g2_homonym():
    return gates.gate_invariance(
        [(1, "- 不改 `scripts/prose-audit/run.py`。")], {"scripts/spec-gates/run.py"}
    )


check(lambda: _g2_homonym().status == "PASS",
      "G2: a claim naming a different file with the same basename does not FAIL")
check(
    lambda: gates.gate_invariance(
        [(1, "- 不改 `scripts/spec-gates/run.py`。")], {"scripts/spec-gates/run.py"}
    ).status == "FAIL",
    "G2: a claim naming the full path of a changed file still FAILs",
)
check(
    lambda: gates.gate_invariance(
        [(1, "- 不改 `spec-gates/run.py`。")], {"scripts/spec-gates/run.py"}
    ).status == "FAIL",
    "G2: a path suffix resolves to the changed file it uniquely identifies",
)
check(
    lambda: gates.gate_invariance(
        [(1, "- `config.yaml` 不變。")], {"scripts/spec-gates/config.yaml"}
    ).status == "FAIL",
    "G2: a bare basename that uniquely identifies a changed file still FAILs",
)
check(
    lambda: gates.gate_invariance(
        [(1, "- 不改 `scripts/prose-audit/run.py`。")], {"scripts/spec-gates/run.py"}
    ).detail["bare"] == [],
    "G2: no row is emitted for a file the claim does not name",
)

# `_QUALIFIED` also accepted the bare words `rules`, `aspect`, `semantics` and
# `關於` anywhere on the line, and any bold span anywhere including a leading
# label -- so a blanket claim escaped FAIL without using the documented marker.
check(
    lambda: gates.gate_invariance(
        [(1, "- 不改 `scripts/foo.ts` 的 rules。")], {"scripts/foo.ts"}
    ).status == "FAIL",
    "G2: the bare word 'rules' does not qualify a blanket claim",
)
check(
    lambda: gates.gate_invariance(
        [(1, "- **注意**:不改 `scripts/foo.ts`。")], {"scripts/foo.ts"}
    ).status == "FAIL",
    "G2: a bold label before the file reference is not a scope marker",
)
check(
    lambda: gates.gate_invariance(
        [(1, "- 不改 `scripts/foo.ts` 對 tools 值的**合法性驗證規則**。")], {"scripts/foo.ts"}
    ).status == "REVIEW",
    "G2: a bold span after the file reference qualifies the claim",
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

# ── G4 named-spec extraction ─────────────────────────────────────────────────
# Every fixture below is a verbatim `Affected specs` line lifted from an archived
# proposal in this repository. The first implementation recognised only the
# `capability(delta)` spelling, which is used by exactly one archived change --
# the one it was developed against -- so G4 reported FAIL on 82 of the other 83.
# Identifiers are resolved against a vocabulary of real capability names rather
# than a stopword list, because the annotations authors write around them
# ("new", "modified delta", "8 個現有 spec 需更新") are open-ended prose.

VOCAB = {
    "encrypted-virtual-fs", "challenge-framework", "challenge-runtime-init",
    "challenge-list", "challenge-layout", "challenge-ui", "wxlsh-terminal",
    "i18n-runtime", "service-worker-router", "python-asgi-runtime",
    "challenge-design-tokens", "challenge-tools-control", "network-traffic-panel",
    "ci-quality-gates", "contributor-guide", "platform-documentation",
}


def _named(line: str, vocab=None):
    return gates.named_specs(f"## Impact\n\n- {line}\n", vocab or VOCAB)


check(
    lambda: _named("**Affected specs**: `encrypted-virtual-fs`、`challenge-framework`、`challenge-runtime-init`")
    == {"encrypted-virtual-fs", "challenge-framework", "challenge-runtime-init"},
    "G4: backticked identifiers separated by 頓號 are all extracted",
)
check(
    lambda: _named("**Affected specs**：`challenge-list`（modified delta）。") == {"challenge-list"},
    "G4: a full-width parenthetical annotation is not read as an identifier",
)
check(
    lambda: _named(
        "Affected specs: challenge-layout, challenge-ui, wxlsh-terminal（3 個現有 spec 需更新）"
    ) == {"challenge-layout", "challenge-ui", "wxlsh-terminal"},
    "G4: a bare comma-separated list without backticks is extracted",
)
check(
    lambda: _named("Affected specs: 新增 `openspec/specs/i18n-runtime/spec.md`。") == {"i18n-runtime"},
    "G4: a full spec path is reduced to its capability name",
)
check(
    lambda: _named(
        "Affected specs: `service-worker-router`, `python-asgi-runtime`, new `challenge-runtime-init`"
    ) == {"service-worker-router", "python-asgi-runtime", "challenge-runtime-init"},
    "G4: a 'new' prefix does not hide the identifier that follows it",
)
check(
    lambda: _named("Affected specs: `challenge-design-tokens` (new), `challenge-layout`")
    == {"challenge-design-tokens", "challenge-layout"},
    "G4: an ASCII parenthetical annotation is not read as an identifier",
)
check(
    lambda: _named(
        "Affected specs: challenge-tools-control(delta)、challenge-layout(delta)"
    ) == {"challenge-tools-control", "challenge-layout"},
    "G4: the original capability(delta) spelling still parses",
)
check(
    lambda: _named("Affected specs: 無現有 spec 異動") == set(),
    "G4: an explicit 'no specs affected' declaration yields an empty set, not None",
)
check(
    lambda: _named(
        "Affected specs: none. This change is documentation-only; no capability requirements move."
    ) == set(),
    "G4: English prose asserting none contributes no identifiers",
)
check(
    lambda: gates.named_specs("## Impact\n\n- Affected code:\n  - Modified: a.md\n", VOCAB) is None,
    "G4: a proposal with no Affected-specs line yields None, distinct from an empty set",
)
check(
    lambda: gates.named_specs(
        "## Impact\n\n- Affected specs:\n  - `challenge-list`\n  - `challenge-ui`\n", VOCAB
    ) == {"challenge-list", "challenge-ui"},
    "G4: a multi-line Affected-specs list is followed onto its continuation bullets",
)
check(
    lambda: _named("Affected specs: `challenge-list` and the code-editor-panel spec")
    == {"challenge-list"},
    "G4: a capability name absent from the vocabulary is not invented",
)

# The three below are regression guards from replaying the parser over the real
# archive: each produced a FAIL that was the parser's fault, not the author's.
check(
    lambda: _named(
        "Affected specs: `ci-quality-gates`（delta-only：ADDED Requirements，無 MODIFIED）"
    ) == {"ci-quality-gates"},
    "G4: a full-width colon inside the annotation does not swallow the identifier",
)
check(
    lambda: gates.named_specs(
        "## Impact\n\n- Affected specs:\n"
        "  - 修改：openspec/specs/challenge-layout/spec.md\n"
        "  - 不變：challenge-list、wxlsh-terminal\n",
        VOCAB,
    ) == {"challenge-layout"},
    "G4: a 不變 continuation bullet declares specs out of scope, not in it",
)
check(
    lambda: gates.named_specs(
        "## Impact\n\n- Affected specs:\n"
        "  - `ci-quality-gates` (MODIFIED)\n"
        "  - `platform-documentation` (no spec change; semantic intersection only)\n",
        VOCAB,
    ) == {"ci-quality-gates"},
    "G4: an entry annotated as carrying no spec change is not counted as named",
)

# An absent declaration cannot be contradicted, so it must not FAIL. 37 of the 84
# archived changes that carry delta specs never write the line at all; failing
# them would violate the design's acceptance condition that the new job not FAIL
# on a PR the existing four jobs pass.
check(
    lambda: gates.gate_scope_parity({"a.ts"}, {"a.ts"}, {"cap"}, None).status == "REVIEW",
    "G4: no spec declaration -> REVIEW rather than FAIL",
)
check(
    lambda: "cap" in str(gates.gate_scope_parity({"a.ts"}, {"a.ts"}, {"cap"}, None).detail),
    "G4: the undeclared specs are still enumerated under REVIEW",
)
check(
    lambda: gates.gate_scope_parity({"a.ts", "b.ts"}, {"a.ts"}, {"cap"}, None).status == "FAIL",
    "G4: an absent spec declaration does not suppress the file-list half of the gate",
)
check(
    lambda: gates.gate_scope_parity({"a.ts"}, {"a.ts"}, {"cap"}, set()).status == "FAIL",
    "G4: an explicit 'none' contradicted by a spec on disk still FAILs",
)

# ── G4 change-id resolution ──────────────────────────────────────────────────
# The CI job resolved the id from whatever single directory sat under
# openspec/changes/, with no link to the PR's diff, so an unrelated PR opened
# while a change was live ran that change's gates against its own diff.

check(
    lambda: gates.change_ids_from_diff(
        "openspec/changes/my-change/proposal.md\nsrc/a.ts\n"
    ) == ["my-change"],
    "G4: the change id comes from the diff",
)
check(
    lambda: gates.change_ids_from_diff("src/a.ts\ndocs/b.md\n") == [],
    "G4: a PR touching no change directory resolves to no id",
)
check(
    lambda: gates.change_ids_from_diff(
        "openspec/changes/archive/2026-01-01-old/proposal.md\n"
    ) == [],
    "G4: an archived change is not a live change id",
)
check(
    lambda: gates.change_ids_from_diff(
        "openspec/changes/a/proposal.md\nopenspec/changes/b/tasks.md\n"
    ) == ["a", "b"],
    "G4: two touched change directories both resolve, sorted",
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

# ── G4 against the real archive ──────────────────────────────────────────────
# The first parser was written against a single archived change and recognised
# only that change's spelling, so G4 reported FAIL on 82 of the 83 others. A
# handful of hand-written fixtures would not have caught that; only replaying
# the whole corpus does. Skipped when the archive is unavailable so the suite
# still runs outside a full checkout.

_ARCHIVE = HERE.parent.parent / "openspec" / "changes" / "archive"
_SPECS_ROOT = HERE.parent.parent / "openspec" / "specs"


def _corpus():
    """(declared, extracted_something, fail_names) over archived changes with deltas."""
    vocab = {p.name for p in _SPECS_ROOT.iterdir() if p.is_dir()}
    declared, extracted, fails = 0, 0, []
    for d in sorted(_ARCHIVE.iterdir()):
        sd = d / "specs"
        if not sd.is_dir():
            continue
        prop = d / "proposal.md"
        text = prop.read_text(encoding="utf-8") if prop.exists() else ""
        disk = {p.name for p in sd.iterdir() if p.is_dir()}
        named = gates.named_specs(text, disk | vocab)
        if named is not None and "affected specs" in text.lower():
            declared += 1
            # An entry that names nothing is only correct when it says so.
            if named or gates._INVARIANCE.search(text) or "無" in text or "none" in text.lower():
                extracted += 1
        if gates.gate_scope_parity(set(), set(), disk, named).status == "FAIL":
            fails.append(d.name)
    return declared, extracted, fails


_CORPUS_CACHE = []


def corpus():
    """Computed on first use, inside a check(), so that a raising gate is
    reported as a failed assertion rather than aborting the whole run."""
    if not _CORPUS_CACHE:
        _CORPUS_CACHE.append(_corpus())
    return _CORPUS_CACHE[0]


if _ARCHIVE.is_dir() and _SPECS_ROOT.is_dir():
    check(lambda: corpus()[0] >= 40, "G4/corpus: the archive supplies enough declarations")
    check(
        lambda: corpus()[1] == corpus()[0],
        "G4/corpus: every declaration parses to identifiers or an explicit none",
    )
    # The residual failures are real, verified drift: each ships an ADDED
    # capability its proposal never lists. Raising this bound means the parser
    # regressed; lowering it means drift was fixed and the bound should follow.
    check(
        lambda: len(corpus()[2]) <= 5,
        "G4/corpus: at most 5 archived changes FAIL, all verified real drift",
    )
else:  # pragma: no cover - only outside a full checkout
    print("  SKIP  G4/corpus: openspec archive not present")


# ── G5 delta scenario parity ─────────────────────────────────────────────────

_REQ = "UI tab allowlist via tools field"
_KEEP = "Terminal stays hidden when tools omits it"
_GONE = "Repeater button renders for every challenge"

check(
    lambda: gates.gate_scenario_parity(
        {_REQ: {_KEEP, _GONE}}, {_REQ: {_KEEP, _GONE}}, ""
    ).status == "PASS",
    "G5: delta covers every baseline scenario -> PASS",
)
def _g5():
    return gates.gate_scenario_parity({_REQ: {_KEEP}}, {_REQ: {_KEEP, _GONE}}, "")
check(lambda: _g5().status == "FAIL", "G5: an unrecorded baseline scenario loss -> FAIL")
check(
    lambda: gates.gate_scenario_parity(
        {_REQ: {_KEEP}}, {_REQ: {_KEEP, _GONE}},
        f"- [x] 3.1 移除 scenario「{_GONE}」,理由見 design.md。",
    ).status == "REVIEW",
    "G5: a deliberate removal recorded in tasks -> REVIEW",
)
# The guard above used a one-character title against non-empty tasks text, so
# mutating `missing in tasks_text` to `bool(tasks_text)` kept the suite green.
# A non-empty tasks file that does NOT name the scenario must still FAIL.
check(
    lambda: gates.gate_scenario_parity(
        {_REQ: {_KEEP}}, {_REQ: {_KEEP, _GONE}},
        "- [x] 1.1 撰寫測試骨架。\n- [x] 1.2 實作 G5。\n",
    ).status == "FAIL",
    "G5: a non-empty tasks file that never names the scenario does not excuse the loss",
)

# ── G5 delta section awareness ───────────────────────────────────────────────
# scenarios_of collected every `### Requirement:` regardless of the
# ADDED / MODIFIED / REMOVED block it sat under, and run_gates fed it the whole
# delta. A correctly declared REMOVED requirement therefore looked like a
# MODIFIED one whose scenarios had all vanished, and G5 reported FAIL on it.
# The spec has always scoped G5 to MODIFIED; only the code disagreed.

_DELTA = """## ADDED Requirements

### Requirement: Brand new thing

#### Scenario: it works

- **WHEN** something
- **THEN** something

## MODIFIED Requirements

### Requirement: UI tab allowlist via tools field

#### Scenario: Terminal stays hidden when tools omits it

- **WHEN** tools omits terminal
- **THEN** the tab is absent

## REMOVED Requirements

### Requirement: Legacy layout registration

**Reason**: replaced by a component.

#### Scenario: the layout is no longer registered

- **WHEN** the theme initialises
- **THEN** nothing is registered
"""

check(
    lambda: set(gates.delta_sections(_DELTA)) == {"ADDED", "MODIFIED", "REMOVED"},
    "G5: the three delta blocks are parsed separately",
)
check(
    lambda: list(gates.delta_sections(_DELTA)["MODIFIED"]) == [_REQ],
    "G5: only the MODIFIED requirement lands in the MODIFIED bucket",
)
check(
    lambda: gates.delta_sections(_DELTA)["MODIFIED"][_REQ] == {_KEEP},
    "G5: the MODIFIED requirement's scenarios are collected",
)
check(
    lambda: "Legacy layout registration" in gates.delta_sections(_DELTA)["REMOVED"],
    "G5: a REMOVED requirement is kept in its own bucket, not merged",
)
check(
    lambda: gates.gate_scenario_parity(
        gates.delta_sections(_DELTA)["MODIFIED"],
        {"Legacy layout registration": {"the layout is no longer registered", "another one"},
         _REQ: {_KEEP}},
        "",
    ).status == "PASS",
    "G5: a correctly declared REMOVED requirement is not reported as a scenario loss",
)
check(
    lambda: gates.delta_sections("## Requirements\n\n### Requirement: Plain\n\n#### Scenario: s\n")
    .get("MODIFIED", {}) == {},
    "G5: a baseline file's plain `## Requirements` block is not read as MODIFIED",
)

# ── G6 added-lines trace ─────────────────────────────────────────────────────
# G6 had no test of any kind: replacing gate_added_lines_trace's whole body with
# `raise NotImplementedError` left the suite green. It also handed the printer
# bare strings, so its hits could not be enumerated by file and line as the spec
# requires of every REVIEW outcome.

_DIFF = """diff --git a/docs/a.md b/docs/a.md
--- a/docs/a.md
+++ b/docs/a.md
@@ -9,0 +10,2 @@
+The router will always return the cached response for a repeated request.
+short
diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -3 +3 @@
+每個挑戰一律會在載入時註冊 service worker,不需要手動重新整理頁面。
"""

check(
    lambda: gates.added_prose_lines(_DIFF)[0][0] == "docs/a.md",
    "G6: the file of an added line comes from the diff header",
)
check(
    lambda: gates.added_prose_lines(_DIFF)[0][1] == 10,
    "G6: the line number of an added line comes from the hunk header",
)
check(
    lambda: [r[1] for r in gates.added_prose_lines(_DIFF) if r[0] == "docs/a.md"] == [10, 11],
    "G6: consecutive added lines increment the line number",
)
check(
    lambda: [r for r in gates.added_prose_lines(_DIFF) if r[0] == "README.md"][0][1] == 3,
    "G6: a hunk header without a line count still yields a line number",
)
check(
    lambda: not any(r[2].startswith("++") for r in gates.added_prose_lines(_DIFF)),
    "G6: the +++ header is not read as an added line",
)
check(
    lambda: len(gates.added_prose_lines(_DIFF)) == 3,
    "G6: every added line is collected across both files",
)


def _g6():
    return gates.gate_added_lines_trace(gates.added_prose_lines(_DIFF))


check(lambda: _g6().status == "REVIEW", "G6: the outcome is REVIEW")
check(
    lambda: gates.gate_added_lines_trace([]).status == "REVIEW",
    "G6: an empty diff is still REVIEW, never FAIL",
)
check(
    lambda: all(
        isinstance(h.get("file"), str) and isinstance(h.get("line"), int)
        for h in _g6().detail["mechanism_sentences"]
    ),
    "G6: every hit carries a file and a line",
)
check(
    lambda: {h["file"] for h in _g6().detail["mechanism_sentences"]} == {"docs/a.md", "README.md"},
    "G6: mechanism assertions are found in both English and Chinese",
)
check(
    lambda: all(len(h["text"]) > 10 for h in _g6().detail["mechanism_sentences"])
    and len(_g6().detail["mechanism_sentences"]) == 2,
    "G6: a line carrying no mechanism assertion is not reported",
)

# ── Printed output ───────────────────────────────────────────────────────────
# Nothing asserted on the printer, so the 400-character truncation that dropped
# 24 of 31 real G1 hits went unnoticed -- in the exact output mode CI runs.


def printed(verdicts, as_json=False) -> str:
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        gates._print(verdicts, as_json)
    return buf.getvalue()


_MANY = gates.Verdict(
    "G1 claim-parity", "REVIEW",
    {"uncovered": [(f"docs/file-{i:03d}.md", i, f"a claim sentence number {i}") for i in range(40)]},
)

check(
    lambda: all(f"file-{i:03d}.md" in printed([_MANY]) for i in range(40)),
    "print: every hit of a 40-hit REVIEW appears in the default output",
)
check(
    lambda: printed([_MANY]).count("a claim sentence number ") == 40,
    "print: no hit is dropped or collapsed",
)
check(
    lambda: "REVIEW" in printed([_MANY]) and "G1 claim-parity" in printed([_MANY]),
    "print: the status and gate name are shown",
)
check(
    lambda: json.loads(printed([_MANY], as_json=True))[0]["detail"]["uncovered"][39][1] == 39,
    "print: --json carries the full detail too",
)
check(
    lambda: "0" in printed([gates.Verdict("G6 added-lines trace", "REVIEW",
                                          {"added_prose_lines": 0})]),
    "print: a zero-valued count is still printed rather than skipped",
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

# The spec's failure mode for an unusable git was never implemented: the script
# raised FileNotFoundError out of subprocess and exited 1 with a traceback.
def _no_git():
    env = {"PATH": "/nonexistent", "HOME": os.environ.get("HOME", "/tmp")}
    return subprocess.run([sys.executable, str(RUN), "spec-drift-gates"],
                          capture_output=True, text=True, cwd=str(HERE.parent.parent), env=env)


check(lambda: _no_git().returncode == 2, "CLI: git unavailable exits 2")
check(lambda: "Traceback" not in _no_git().stderr,
      "CLI: git unavailable reports an error rather than a traceback")
check(lambda: "git" in _no_git().stderr.lower(),
      "CLI: the message says git is the problem")
check(
    lambda: gates.exit_code_for([gates.Verdict("g", "PASS", {}), gates.Verdict("h", "REVIEW", {})]) == 0,
    "CLI: PASS and REVIEW only -> exit 0",
)
check(
    lambda: gates.exit_code_for([gates.Verdict("g", "PASS", {}), gates.Verdict("h", "FAIL", {})]) == 1,
    "CLI: any FAIL -> exit 1",
)

# ── Snapshot and verify-archive modes ────────────────────────────────────────
# Neither mode had a single test. Between them they shipped a flag name that
# contradicted the published contract, a silent mode switch, and a write into
# the repository root that the next gate run then reported as an undeclared file.

REPO = HERE.parent.parent
_CHANGE = "spec-drift-gates"


def _snapshot_default() -> Path:
    return REPO / ".git" / "spec-gates" / f"{_CHANGE}.json"


def _clean_snapshots():
    p = _snapshot_default()
    if p.exists():
        p.unlink()


def _tracked_dirty() -> list:
    out = subprocess.run(["git", "status", "--porcelain", "-uall"],
                         capture_output=True, text=True, cwd=str(REPO))
    return [ln for ln in out.stdout.splitlines() if ln.strip()]


_clean_snapshots()
_BEFORE = _tracked_dirty()
_SNAP = run_cli(["--snapshot", _CHANGE])

check(lambda: _SNAP.returncode == 0, "snapshot: a valid change exits 0")
check(lambda: _snapshot_default().exists(),
      "snapshot: the default destination is inside .git, outside the working tree")
check(
    lambda: not (REPO / f".spectra-gates-{_CHANGE}.json").exists(),
    "snapshot: nothing is written to the repository root",
)
# The spec's "SHALL NOT modify any file in the repository" was contradicted by a
# write the next G4 run then counted as an undeclared changed file.
check(
    lambda: _tracked_dirty() == _BEFORE,
    "snapshot: the working tree is unchanged, so the next gate run is unaffected",
)
check(
    lambda: json.loads(_snapshot_default().read_text(encoding="utf-8")),
    "snapshot: the file holds the per-capability counts",
)

check(
    lambda: run_cli(["--verify-archive", _CHANGE]).returncode == 0,
    "verify-archive: counts unchanged since the snapshot -> exit 0",
)
check(
    lambda: "PASS" in run_cli(["--verify-archive", _CHANGE]).stdout,
    "verify-archive: the verdict is printed",
)


def _verify_dropped():
    tmp = REPO / ".git" / "spec-gates" / "dropped.json"
    tmp.write_text(json.dumps({"spec-drift-gates": {"requirements": 99, "traces": 99}}),
                   encoding="utf-8")
    r = run_cli(["--verify-archive", _CHANGE, "--snapshot-file", str(tmp)])
    tmp.unlink()
    return r


check(lambda: _verify_dropped().returncode == 1,
      "verify-archive: a dropped count exits 1")
check(lambda: "FAIL" in _verify_dropped().stdout,
      "verify-archive: a dropped count is reported as FAIL")
check(
    lambda: run_cli(["--verify-archive", _CHANGE,
                     "--snapshot-file", "/nonexistent/snap.json"]).returncode == 2,
    "verify-archive: a missing snapshot exits 2",
)

# design.md published `--verify-archive <id> --snapshot <path>`. `--snapshot`
# takes a CHANGE_ID and was tested first, so the documented invocation silently
# ran snapshot mode against a filesystem path.
check(
    lambda: run_cli(["--verify-archive", _CHANGE, "--snapshot", "/tmp/x.json"]).returncode == 2,
    "CLI: --snapshot together with --verify-archive is rejected, not silently switched",
)
check(
    lambda: "--snapshot-file" in run_cli(
        ["--verify-archive", _CHANGE, "--snapshot", "/tmp/x.json"]).stderr,
    "CLI: the rejection names the flag the caller meant",
)
check(
    lambda: run_cli(["--snapshot", "no-such-change"]).returncode == 2,
    "snapshot: an unknown change exits 2",
)


def _out_flag():
    tmp = REPO / ".git" / "spec-gates" / "custom.json"
    r = run_cli(["--snapshot", _CHANGE, "--out", str(tmp)])
    ok = r.returncode == 0 and tmp.exists()
    if tmp.exists():
        tmp.unlink()
    return ok


check(_out_flag, "snapshot: --out redirects the destination")
_clean_snapshots()

# ── Summary ──────────────────────────────────────────────────────────────────

failed = [label for ok, label in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
if failed:
    print("\nFailed:")
    for label in failed:
        print(f"  - {label}")
sys.exit(1 if failed else 0)
