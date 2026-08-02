#!/usr/bin/env python3
"""Behavior tests for run.py (the spec-drift gates, reduced to G1/G2/G7).

Standalone — run with `python scripts/spec-gates/test_run.py` (no pytest needed).
Exits 0 if every assertion holds, 1 otherwise.

The gate functions take their evidence as arguments rather than shelling out, so
each verdict is testable without building a fixture git repository. `run_gates`
-- the integration path the CLI and CI execute -- is exercised against a real
git repository built in a temp directory, because wiring defects are invisible
to the unit assertions: a gate can be fed the wrong input, or dropped from the
list entirely, with every part still passing.

Reduced semantics under test (design.md, Implementation Contract):
- G1 claim-parity: the per-change gates.yaml is mandatory. Absent -> FAIL;
  present with `claim_phrases: []` -> PASS, reported as a deliberate declaration.
- G2 invariance: REVIEW-only. Bare and qualified claims are both listed; the
  gate never blocks CI.
- G7 archive trace-parity: diff-based, aligned per requirement between base and
  HEAD. A requirement present on both sides whose @trace count decreased ->
  FAIL; a requirement that vanishes from HEAD -> REVIEW; additions -> PASS.
"""
from __future__ import annotations

import contextlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
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
# stdout for both. G1 asks where a declared phrase occurs, so a grep that
# errored would read as "no occurrences" and the gate would pass silently.


def _raises(fn, exc=Exception):
    try:
        fn()
    except exc:
        return True
    except Exception:
        return False
    return False


# Assembled at runtime: G1 greps the whole repository, and this file is part of
# it, so a literal needle written here would find itself.
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
check(
    lambda: gates.grep_phrase(ABSENT, "nothing/") == [],
    "G1: a phrase with no occurrence yields an empty hit list",
)


# ── G1 claim-parity ──────────────────────────────────────────────────────────
# Reduced semantics: the per-change gates.yaml is mandatory. load_config signals
# its absence (None) so run_gates can turn that into a G1 FAIL, and an existing
# file declaring `claim_phrases: []` is a deliberate statement, reported as such
# rather than passed over silently.

HEDGES = ["where the challenge", "若", "僅在"]

check(
    lambda: gates.gate_claim_parity([], HEDGES, lambda _p: []).status == "PASS",
    "G1: an empty declared-phrase list -> PASS",
)
check(
    lambda: "deliberately" in str(
        gates.gate_claim_parity([], HEDGES, lambda _p: []).detail.get("note", "")).lower(),
    "G1: an empty declaration is reported as deliberate, not as an omission",
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
    "G1: declared phrases never produce FAIL",
)

# load_config: absence is a signal, not a silent fallback. The old fallback to
# the global config made "the author forgot" indistinguishable from "the author
# considered it and declared none".
_cfg_absent = Path(tempfile.mkdtemp(prefix="spec-gates-noyaml-"))
try:
    check(
        lambda: gates.load_config(_cfg_absent) is None,
        "G1: load_config returns None when the per-change gates.yaml is absent",
    )
finally:
    shutil.rmtree(_cfg_absent, ignore_errors=True)

# C1: an existing gates.yaml that carries no claim_phrases key is an absent
# declaration — the same signal as a missing file, not a silent empty list. The
# delta spec requires the file "to exist and to carry a `claim_phrases` key";
# a zero-byte file and a file with only other keys both fail that requirement.
_cfg_zero = Path(tempfile.mkdtemp(prefix="spec-gates-zerobyte-"))
(_cfg_zero / "gates.yaml").write_text("", encoding="utf-8")
try:
    check(
        lambda: gates.load_config(_cfg_zero) is None,
        "G1: a zero-byte gates.yaml is an absent declaration, not an empty one",
    )
finally:
    shutil.rmtree(_cfg_zero, ignore_errors=True)

_cfg_nokey = Path(tempfile.mkdtemp(prefix="spec-gates-nokey-"))
(_cfg_nokey / "gates.yaml").write_text("hedge_markers: []\n", encoding="utf-8")
try:
    check(
        lambda: gates.load_config(_cfg_nokey) is None,
        "G1: gates.yaml without a claim_phrases key is an absent declaration",
    )
finally:
    shutil.rmtree(_cfg_nokey, ignore_errors=True)

# H3: a scalar where a list belongs is silent sabotage, not a working config.
# `hedge_markers: unless` iterates the string character by character, and
# 'u' in text.lower() is near-universally true, so G1's uncovered list goes
# permanently empty. A scalar claim_phrases greps the repo once per character.
# Both must refuse loudly, naming the key and the actual type.
_cfg_badhedge = Path(tempfile.mkdtemp(prefix="spec-gates-badhedge-"))
(_cfg_badhedge / "gates.yaml").write_text(
    "claim_phrases: []\nhedge_markers: unless\n", encoding="utf-8")
try:
    check(
        lambda: _raises(lambda: gates.load_config(_cfg_badhedge), gates.GateError),
        "G1: a scalar hedge_markers raises GateError instead of iterating characters",
    )
    check(
        lambda: (lambda m: "hedge_markers" in m and "str" in m)(
            str(_capture_error(lambda: gates.load_config(_cfg_badhedge)))),
        "G1: the hedge_markers type error names the key and the actual type",
    )
finally:
    shutil.rmtree(_cfg_badhedge, ignore_errors=True)

_cfg_badclaim = Path(tempfile.mkdtemp(prefix="spec-gates-badclaim-"))
(_cfg_badclaim / "gates.yaml").write_text(
    'claim_phrases: "Some phrase"\n', encoding="utf-8")
try:
    check(
        lambda: _raises(lambda: gates.load_config(_cfg_badclaim), gates.GateError),
        "G1: a scalar claim_phrases raises GateError instead of grepping per character",
    )
    check(
        lambda: (lambda m: "claim_phrases" in m and "str" in m)(
            str(_capture_error(lambda: gates.load_config(_cfg_badclaim)))),
        "G1: the claim_phrases type error names the key and the actual type",
    )
finally:
    shutil.rmtree(_cfg_badclaim, ignore_errors=True)

# M7: a malformed gates.yaml raised yaml.YAMLError, which main() does not
# catch — the contributor got a traceback and an exit code that reads like a
# gate FAIL. Parse failures are "the gates could not be evaluated": GateError.
_cfg_broken = Path(tempfile.mkdtemp(prefix="spec-gates-broken-"))
(_cfg_broken / "gates.yaml").write_text("claim_phrases: [\n", encoding="utf-8")
try:
    check(
        lambda: _raises(lambda: gates.load_config(_cfg_broken), gates.GateError),
        "G1: a malformed gates.yaml raises GateError, not a bare yaml.YAMLError",
    )
    check(
        lambda: "gates.yaml" in str(_capture_error(lambda: gates.load_config(_cfg_broken))),
        "G1: the parse-failure message names the file that failed to parse",
    )
finally:
    shutil.rmtree(_cfg_broken, ignore_errors=True)

_cfg_dir = Path(tempfile.mkdtemp(prefix="spec-gates-cfg-"))
(_cfg_dir / "gates.yaml").write_text("claim_phrases: []\n", encoding="utf-8")
try:
    check(
        lambda: isinstance(gates.load_config(_cfg_dir), dict),
        "G1: load_config returns a dict when gates.yaml exists",
    )
    check(
        lambda: gates.load_config(_cfg_dir)["claim_phrases"] == [],
        "G1: an explicit empty claim_phrases list survives loading as an empty list",
    )
    check(
        lambda: len(gates.load_config(_cfg_dir)["hedge_markers"]) > 0,
        "G1: hedge_markers fall back to the global default when gates.yaml omits them",
    )
finally:
    shutil.rmtree(_cfg_dir, ignore_errors=True)


# M2: load_config reads claim_phrases from the per-change file alone, so a
# claim_phrases key in the global config.yaml is dead — its presence (and the
# old comment implying a fallback) misled authors into declaring phrases where
# they have no effect.
def _global_config():
    import yaml
    return yaml.safe_load((HERE / "config.yaml").read_text(encoding="utf-8")) or {}


check(
    lambda: "claim_phrases" not in _global_config(),
    "config: the global config.yaml carries no dead claim_phrases key",
)
check(
    lambda: "hedge_markers" in _global_config(),
    "config: the global config.yaml still provides the hedge_markers default",
)


# M3: `hedge_markers: []` is a deliberate tightening — no wording counts as
# hedged — but falsy-based fallback silently swapped it for the loosest setting
# (the built-in defaults). Presence of the key decides; absence falls back.
_cfg_strict = Path(tempfile.mkdtemp(prefix="spec-gates-strict-"))
(_cfg_strict / "gates.yaml").write_text(
    "claim_phrases: []\nhedge_markers: []\n", encoding="utf-8")
try:
    check(
        lambda: gates.load_config(_cfg_strict)["hedge_markers"] == [],
        "G1: an explicit empty hedge_markers list is honored, not swapped for defaults",
    )
finally:
    shutil.rmtree(_cfg_strict, ignore_errors=True)

_cfg_custom = Path(tempfile.mkdtemp(prefix="spec-gates-custom-"))
(_cfg_custom / "gates.yaml").write_text(
    'claim_phrases: []\nhedge_markers: ["僅在"]\n', encoding="utf-8")
try:
    check(
        lambda: gates.load_config(_cfg_custom)["hedge_markers"] == ["僅在"],
        "G1: a declared hedge_markers list is used verbatim",
    )
finally:
    shutil.rmtree(_cfg_custom, ignore_errors=True)


# R2-5: `claim_phrases:` with nothing after it is YAML null, not an empty list.
# Treating it as `[]` printed "the author deliberately declared that this change
# alters no claim's truth conditions" over a line the author plainly had not
# finished -- the exact substitution load_config exists to refuse. It is also
# fewer characters than the compliant `claim_phrases: []`, so it is the shape a
# hurried contributor lands on.
_cfg_null = Path(tempfile.mkdtemp(prefix="spec-gates-nullclaim-"))
(_cfg_null / "gates.yaml").write_text("claim_phrases:\n", encoding="utf-8")
try:
    check(
        lambda: gates.load_config(_cfg_null) is None,
        "G1: `claim_phrases:` with no value is an absent declaration, not an empty one",
    )
finally:
    shutil.rmtree(_cfg_null, ignore_errors=True)

_cfg_null_explicit = Path(tempfile.mkdtemp(prefix="spec-gates-nullclaim2-"))
(_cfg_null_explicit / "gates.yaml").write_text("claim_phrases: null\n", encoding="utf-8")
try:
    check(
        lambda: gates.load_config(_cfg_null_explicit) is None,
        "G1: an explicit `claim_phrases: null` is an absent declaration too",
    )
finally:
    shutil.rmtree(_cfg_null_explicit, ignore_errors=True)

# The asymmetry is deliberate and pinned here: for hedge_markers the *presence*
# of the key is the declaration (M3), and an empty value is the strictest
# setting the author can ask for -- nothing counts as a hedge. For claim_phrases
# the value is the declaration, so an empty value declares nothing. Reading a
# blank hedge_markers as "fall back to the defaults" would hand the strictest
# author the loosest setting; reading a blank claim_phrases as "[]" would put
# words in a silent author's mouth. Opposite defaults, same principle.
_cfg_null_hedge = Path(tempfile.mkdtemp(prefix="spec-gates-nullhedge-"))
(_cfg_null_hedge / "gates.yaml").write_text(
    "claim_phrases: []\nhedge_markers:\n", encoding="utf-8")
try:
    check(
        lambda: gates.load_config(_cfg_null_hedge)["hedge_markers"] == [],
        "G1: `hedge_markers:` with no value stays an empty list, not a fallback",
    )
    check(
        lambda: gates.load_config(_cfg_null_hedge)["claim_phrases"] == [],
        "G1: the blank-hedge_markers file still carries its explicit claim_phrases",
    )
finally:
    shutil.rmtree(_cfg_null_hedge, ignore_errors=True)


# R2-3: the per-change file has an isinstance(dict) guard; the fallback to the
# global scripts/spec-gates/config.yaml did not, and called .get() on whatever
# parsed. A global config that is a valid YAML list or scalar therefore raised
# AttributeError -- an uncaught traceback whose exit code 1 reads like a gate
# FAIL, which is precisely what _load_yaml's GateError conversion exists to
# prevent. A file that cannot be used is "the gates could not be evaluated".
def _with_global_config(text: str, fn):
    """Run fn() with the global config replaced by `text`."""
    tmp = Path(tempfile.mkdtemp(prefix="spec-gates-global-"))
    original = gates.GLOBAL_CONFIG
    try:
        path = tmp / "config.yaml"
        path.write_text(text, encoding="utf-8")
        gates.GLOBAL_CONFIG = path
        return fn(path)
    finally:
        gates.GLOBAL_CONFIG = original
        shutil.rmtree(tmp, ignore_errors=True)


_cfg_fallback = Path(tempfile.mkdtemp(prefix="spec-gates-fallback-"))
(_cfg_fallback / "gates.yaml").write_text("claim_phrases: []\n", encoding="utf-8")
try:
    check(
        lambda: _with_global_config(
            "- unless\n- 若\n",
            lambda _p: _raises(lambda: gates.load_config(_cfg_fallback), gates.GateError)),
        "config: a global config.yaml parsing as a list raises GateError, not AttributeError",
    )
    check(
        lambda: _with_global_config(
            "- unless\n",
            lambda p: (lambda m: str(p) in m and "list" in m)(
                str(_capture_error(lambda: gates.load_config(_cfg_fallback))))),
        "config: the global-config type error names the file and the actual type",
    )
    check(
        lambda: _with_global_config(
            "just a string\n",
            lambda _p: _raises(lambda: gates.load_config(_cfg_fallback), gates.GateError)),
        "config: a global config.yaml parsing as a scalar raises GateError",
    )
    check(
        lambda: _with_global_config(
            "", lambda _p: gates.load_config(_cfg_fallback)["hedge_markers"]
            == gates.DEFAULT_HEDGES),
        "config: an empty global config.yaml still falls back to the built-in defaults",
    )
    check(
        lambda: _with_global_config(
            'hedge_markers: ["若"]\n',
            lambda _p: gates.load_config(_cfg_fallback)["hedge_markers"] == ["若"]),
        "config: a well-formed global config.yaml still supplies the fallback markers",
    )
finally:
    shutil.rmtree(_cfg_fallback, ignore_errors=True)


# ── G2 invariance ────────────────────────────────────────────────────────────
# Reduced semantics: REVIEW-only. The bare/qualified split is heuristic — three
# audit rounds showed the FAIL verdict misfired in both directions — so both
# kinds of hit are listed for a human and neither blocks CI.
#
# gate_invariance takes (artifact, line_no, text) triples: a hit that carries a
# line number but not the file it sits in cannot be looked up when the change
# ships more than one artifact, and every change ships at least two.

_ARTIFACT = "openspec/changes/demo/design.md"


def g2(rows, changed, artifact: str = _ARTIFACT):
    """gate_invariance over (line, text) pairs, all attributed to one artifact.

    The cases below vary the claim, not the file it lives in; the multi-artifact
    behaviour is asserted separately.
    """
    return gates.gate_invariance([(artifact, n, t) for n, t in rows], changed)


def _g2_bare():
    return g2([(1, "- 不改 `scripts/foo.ts`。")], {"scripts/foo.ts"})


check(
    lambda: _g2_bare().status == "REVIEW",
    "G2: a bare unchanged-claim naming a touched file -> REVIEW, not FAIL",
)
check(
    lambda: any("scripts/foo.ts" in str(row) for row in (_g2_bare().detail.get("bare") or [])),
    "G2: the bare hit is still enumerated under REVIEW",
)
check(
    lambda: g2(
        [(1, "- 不改 `scripts/foo.ts` 對 tools 值的**合法性驗證規則**。")], {"scripts/foo.ts"}
    ).status == "REVIEW",
    "G2: a qualified unchanged-claim naming a touched file -> REVIEW",
)
check(
    lambda: g2([(1, "- 不改 `scripts/bar.ts`。")], {"scripts/foo.ts"}).status == "PASS",
    "G2: an unchanged-claim naming an untouched file -> PASS",
)
# The pattern was case-sensitive, so the ordinary sentence-initial English
# phrasing of an unchanged-claim escaped the gate entirely.
check(
    lambda: g2(
        [(1, "- `scripts/foo.ts` is Unchanged by this change.")], {"scripts/foo.ts"}
    ).status == "REVIEW",
    "G2: an unchanged-claim is matched regardless of letter case",
)
check(
    lambda: g2(
        [(1, "- No change to `scripts/foo.ts`.")], {"scripts/foo.ts"}
    ).status == "REVIEW",
    "G2: a sentence-initial 'No change to' is matched",
)
check(
    # basename("a/b/") is "" and "" is a substring of every line, so a directory
    # entry would otherwise match every claim in the file.
    lambda: g2([(1, "- 不改任何東西。")], {"scripts/spec-gates/"}).status == "PASS",
    "G2: a directory entry does not match every line via an empty basename",
)

# Matching by basename substring made a claim about one file answer for another
# that merely shares a filename. `scripts/prose-audit/` and `scripts/spec-gates/`
# each hold a `run.py`.
def _g2_homonym():
    return g2(
        [(1, "- 不改 `scripts/prose-audit/run.py`。")], {"scripts/spec-gates/run.py"}
    )


check(lambda: _g2_homonym().status == "PASS",
      "G2: a claim naming a different file with the same basename stays PASS")
check(
    lambda: not (_g2_homonym().detail.get("bare") or []),
    "G2: no row is emitted for a file the claim does not name",
)
check(
    lambda: g2(
        [(1, "- 不改 `scripts/spec-gates/run.py`。")], {"scripts/spec-gates/run.py"}
    ).status == "REVIEW",
    "G2: a claim naming the full path of a changed file -> REVIEW",
)
check(
    lambda: g2(
        [(1, "- 不改 `spec-gates/run.py`。")], {"scripts/spec-gates/run.py"}
    ).status == "REVIEW",
    "G2: a path suffix resolves to the changed file it uniquely identifies -> REVIEW",
)
check(
    lambda: g2(
        [(1, "- `config.yaml` 不變。")], {"scripts/spec-gates/config.yaml"}
    ).status == "REVIEW",
    "G2: a bare basename that uniquely identifies a changed file -> REVIEW",
)
check(
    lambda: g2(
        [(1, "- 不改 `scripts/foo.ts` 的 rules。")], {"scripts/foo.ts"}
    ).status == "REVIEW",
    "G2: the bare word 'rules' does not hide the claim; it is listed as REVIEW",
)
check(
    lambda: g2(
        [(1, "- **注意**:不改 `scripts/foo.ts`。")], {"scripts/foo.ts"}
    ).status == "REVIEW",
    "G2: a bold label before the file reference is listed as REVIEW, not FAIL",
)
check(
    lambda: g2(
        [(1, "- 不改 `scripts/foo.ts` 對 tools 值的**合法性驗證規則**。")], {"scripts/foo.ts"}
    ).status == "REVIEW",
    "G2: a bold span after the file reference qualifies the claim -> REVIEW",
)

# The keyword and the file reference had to fall on one line, so the ordinary
# way of writing this claim -- a lead-in followed by a bulleted list -- escaped
# the gate entirely.
check(
    lambda: g2(
        [(1, "- 下列檔案不變:"), (2, "  - `scripts/foo.ts`"), (3, "  - `scripts/bar.ts`")],
        {"scripts/foo.ts"},
    ).status == "REVIEW",
    "G2: a claim whose list continues onto later lines is still caught -> REVIEW",
)
check(
    lambda: g2(
        [(1, "- The following are unchanged:"), (2, "  - `scripts/foo.ts` — **the parser only**")],
        {"scripts/foo.ts"},
    ).status == "REVIEW",
    "G2: a continuation line carrying a bold marker is listed as REVIEW",
)
check(
    lambda: g2(
        [(1, "- 下列檔案不變:"), (2, "  - `scripts/bar.ts`")], {"scripts/foo.ts"}
    ).status == "PASS",
    "G2: a continuation list naming only untouched files passes",
)
check(
    lambda: g2(
        [(1, "- 下列檔案不變:"), (2, ""), (3, "## Next section"), (4, "- `scripts/foo.ts` 已更新")],
        {"scripts/foo.ts"},
    ).status == "PASS",
    "G2: the claim's reach stops at a blank line and a new heading",
)
# Regression: the first continuation implementation carried the claim onto the
# next three lines unconditionally, so a bullet that merely *mentions* the word
# 不變 mid-sentence swallowed its sibling bullets.
check(
    lambda: g2(
        [(1, "- **G2 invariance**:交叉檢查「X 不變」型的宣稱。"),
         (2, "- **檢查範圍**:比對 `scripts/foo.ts` 的字面值。")],
        {"scripts/foo.ts"},
    ).status == "PASS",
    "G2: a sibling bullet is not swallowed by a claim that merely mentions 不變",
)
check(
    lambda: g2(
        [(1, "- 說明:此處討論「不變」的語意。"),
         (2, "- 另一項:`scripts/foo.ts` 的處理方式。")],
        {"scripts/foo.ts"},
    ).status == "PASS",
    "G2: reach requires a lead-in, not any mention of the keyword",
)

# The core of the reduced contract: no input makes G2 FAIL. Every shape that
# used to FAIL is swept here so a reintroduced FAIL path cannot hide behind a
# single fixture.
_G2_NEVER_FAIL_CASES = [
    ([(1, "- 不改 `scripts/foo.ts`。")], {"scripts/foo.ts"}),
    ([(1, "- `scripts/foo.ts` is Unchanged by this change.")], {"scripts/foo.ts"}),
    ([(1, "- No change to `scripts/foo.ts`.")], {"scripts/foo.ts"}),
    ([(1, "- 不改 `scripts/foo.ts` 的 rules。")], {"scripts/foo.ts"}),
    ([(1, "- **注意**:不改 `scripts/foo.ts`。")], {"scripts/foo.ts"}),
    ([(1, "- 下列檔案不變:"), (2, "  - `scripts/foo.ts`")], {"scripts/foo.ts"}),
    ([(1, "- 不改 `scripts/foo.ts` 對 tools 值的**合法性驗證規則**。")], {"scripts/foo.ts"}),
    ([(1, "- `config.yaml` 不變。")], {"scripts/spec-gates/config.yaml"}),
]
check(
    lambda: all(g2(lines, changed).status != "FAIL"
                for lines, changed in _G2_NEVER_FAIL_CASES),
    "G2: never reports FAIL, for any claim shape",
)


# R2-7: a hit reported as `line: 47` is unusable when the change ships both a
# proposal.md and a design.md -- line 47 exists in both, and the reader is left
# comparing the quoted text against two files to find out which one to open.
# Every hit carries the artifact it was found in. The key is `artifact`, kept
# distinct from `names`: `names` is the changed file the claim asserts is
# unchanged, `artifact` is the change document the assertion is written in.
_G2_TWO_FILES = [
    ("openspec/changes/demo/proposal.md", 47, "- 不改 `scripts/foo.ts`。"),
    ("openspec/changes/demo/design.md", 47, "- 不改 `scripts/bar.ts`。"),
]


def _g2_two():
    return gates.gate_invariance(_G2_TWO_FILES, {"scripts/foo.ts", "scripts/bar.ts"})


check(
    lambda: sorted(row["artifact"] for row in _g2_two().detail["bare"])
    == ["openspec/changes/demo/design.md", "openspec/changes/demo/proposal.md"],
    "G2: two hits sharing a line number are distinguished by their artifact",
)
check(
    lambda: {(row["artifact"], row["names"]) for row in _g2_two().detail["bare"]}
    == {("openspec/changes/demo/proposal.md", "scripts/foo.ts"),
        ("openspec/changes/demo/design.md", "scripts/bar.ts")},
    "G2: each hit pairs the artifact it sits in with the changed file it names",
)
check(
    lambda: all(row["line"] == 47 for row in _g2_two().detail["bare"]),
    "G2: the line number is still the artifact's own, not a concatenated offset",
)
check(
    lambda: (lambda row: row["artifact"] != row["names"])(_g2_bare().detail["bare"][0]),
    "G2: artifact and names are separate keys with separate meanings",
)
check(
    lambda: _g2_bare().detail["bare"][0]["artifact"] == _ARTIFACT,
    "G2: a qualified or bare hit carries the artifact it was read from",
)
check(
    lambda: gates.gate_invariance(
        [("openspec/changes/demo/proposal.md", 9, "- 下列檔案不變:")],
        {"scripts/foo.ts"},
    ).status == "PASS",
    "G2: a lead-in with no list under it is not a hit by itself",
)
# The lead-in's reach is bounded by indentation, and a new artifact is a harder
# boundary than any indent: proposal.md ending on a lead-in must not annex the
# first bullet of design.md, which the single concatenated line list allowed.
check(
    lambda: gates.gate_invariance(
        [("openspec/changes/demo/proposal.md", 9, "- 下列檔案不變:"),
         ("openspec/changes/demo/design.md", 1, "  - `scripts/foo.ts` 已重寫")],
        {"scripts/foo.ts"},
    ).status == "PASS",
    "G2: a lead-in at the end of one artifact does not reach into the next",
)


# ── change-id resolution (--resolve-change) ──────────────────────────────────
# The CI job resolved the id from whatever single directory sat under
# openspec/changes/, with no link to the PR's diff, so an unrelated PR opened
# while a change was live ran that change's gates against its own diff.
# change_ids_from_diff is what `--resolve-change` prints.

check(
    lambda: gates.change_ids_from_diff(
        "openspec/changes/my-change/proposal.md\nsrc/a.ts\n"
    ) == ["my-change"],
    "resolve: the change id comes from the diff",
)
check(
    lambda: gates.change_ids_from_diff("src/a.ts\ndocs/b.md\n") == [],
    "resolve: a PR touching no change directory resolves to no id",
)
check(
    lambda: gates.change_ids_from_diff(
        "openspec/changes/archive/2026-01-01-old/proposal.md\n"
    ) == [],
    "resolve: an archived change is not a live change id",
)
check(
    lambda: gates.change_ids_from_diff(
        "openspec/changes/a/proposal.md\nopenspec/changes/b/tasks.md\n"
    ) == ["a", "b"],
    "resolve: two touched change directories both resolve, sorted",
)
check(
    lambda: not any(f.endswith("/") for f in gates.changed_files_from(
        "", "?? scripts/spec-gates/\0"
    )),
    "diff: a directory entry never reaches the file set",
)
check(
    lambda: "skills-lock.json" not in gates.changed_files_from(
        "skills-lock.json\n", ""
    ),
    "diff: the skills lockfile is excluded as incidental",
)

# L4: `line.split()[-1]` mangled any status path containing a space, and the
# non-z porcelain C-quotes non-ASCII paths. The status side is now the raw
# `git status --porcelain -z -uall` output, NUL-delimited and unquoted; a
# renamed entry is two NUL-separated fields (target first, then origin).
check(
    lambda: "my draft file.md" in gates.changed_files_from("", "?? my draft file.md\0"),
    "diff: a status path containing spaces survives -z parsing intact",
)
check(
    lambda: "文件/說明.md" in gates.changed_files_from("", " M 文件/說明.md\0"),
    "diff: a non-ASCII status path arrives unquoted and unmangled",
)
check(
    lambda: gates.changed_files_from("", "R  new dir/new name.md\0old name.md\0")
    == {"new dir/new name.md", "old name.md"},
    "diff: a renamed entry contributes both its target and its origin, nothing else",
)
check(
    lambda: gates.changed_files_from("", "R  b.md\0a.md\0 M c.md\0")
    == {"a.md", "b.md", "c.md"},
    "diff: the entry after a rename's origin field is not misread",
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
    lambda: "0" in printed([gates.Verdict("G1 claim-parity", "REVIEW", {"total_hits": 0})]),
    "print: a zero-valued count is still printed rather than skipped",
)


# ── G7 archive trace-parity ──────────────────────────────────────────────────
# Diff-based, aligned per requirement. gate_trace_parity(base, head) takes two
# mappings shaped {capability: {requirement_title: {trace identity, ...}}}.
#
# R2-1: the identity of a trace is the `source:` value it carries, not its
# position in the file. Counting `<!-- @trace` occurrences reported a
# *consolidation* -- two blocks under one requirement naming the same source,
# rewritten as a single block listing both code paths -- as metadata loss, and
# FAILed a change that lost no information at all. Whole-file counting would
# likewise flag a legitimate requirement removal as loss; the per-requirement
# alignment is what lets a deliberate `## REMOVED` through as REVIEW.


def _trace_block(source=None, code="a.ts", updated="2026-01-01") -> str:
    """One `<!-- @trace -->` block in the shape openspec/specs/**/spec.md uses."""
    out = ["<!-- @trace"]
    if source is not None:
        out.append(f"source: {source}")
    out += [f"updated: {updated}", "code:", f"  - {code}", "-->"]
    return "\n".join(out) + "\n"


def _traces_of(body: str, title: str = "R one") -> dict:
    return gates._spec_traces(
        f"# cap\n\n## Requirements\n\n### Requirement: {title}\n{body}"
        "\n#### Scenario: s\n\n- **WHEN** x\n- **THEN** y\n")


# _spec_traces: identity, not arithmetic.
check(
    lambda: _traces_of(_trace_block("change-a")
                       + _trace_block("change-a", code="b.ts")) == {"R one": {"change-a"}},
    "G7: two trace blocks naming one source are one identity, not a count of two",
)
check(
    lambda: _traces_of(_trace_block("change-a", code="a.ts")) == {"R one": {"change-a"}},
    "G7: consolidating those blocks into one leaves the identity set unchanged",
)
check(
    lambda: _traces_of(_trace_block("change-a") + _trace_block("change-b"))
    == {"R one": {"change-a", "change-b"}},
    "G7: two blocks naming different sources are two identities",
)
check(
    lambda: _traces_of(_trace_block(None) + _trace_block(None)) == {"R one": {"#1", "#2"}},
    "G7: a source-less trace block still counts, under a synthetic identity",
)
check(
    lambda: _traces_of(_trace_block("change-a") + _trace_block(None))
    == {"R one": {"change-a", "#1"}},
    "G7: source-less identities are numbered among themselves, not by block position",
)
check(
    lambda: gates._spec_traces(
        _trace_block("orphan") + "### Requirement: R one\n") == {"R one": set()},
    "G7: a trace block before the first requirement belongs to no requirement",
)
check(
    lambda: gates._spec_traces(
        "### Requirement: R one\n" + _trace_block("change-a")
        + "### Requirement: R two\n" + _trace_block("change-b"))
    == {"R one": {"change-a"}, "R two": {"change-b"}},
    "G7: each trace block is attributed to the requirement it sits under",
)

check(
    lambda: gates.gate_trace_parity(
        {"widget": {"Widget renders": {"a"}, "Widget hides": {"a", "b"}}},
        {"widget": {"Widget renders": {"a"}, "Widget hides": {"a", "b"}}},
    ).status == "PASS",
    "G7: the same trace sources on both sides -> PASS",
)
check(
    lambda: not (
        (gates.gate_trace_parity(
            {"widget": {"Widget renders": {"a"}}}, {"widget": {"Widget renders": {"a"}}},
        ).detail.get("dropped") or [])
        or (gates.gate_trace_parity(
            {"widget": {"Widget renders": {"a"}}}, {"widget": {"Widget renders": {"a"}}},
        ).detail.get("vanished") or [])
    ),
    "G7: a PASS carries no hits",
)


# R2-1 regression guard: a merge that keeps every source is not a loss.
check(
    lambda: gates.gate_trace_parity(
        {"widget": {"Widget renders": {"change-a"}}},
        {"widget": {"Widget renders": {"change-a"}}},
    ).status == "PASS",
    "G7: consolidating same-source trace blocks -> PASS, not a phantom FAIL",
)


def _g7_fail():
    return gates.gate_trace_parity(
        {"widget": {"Widget renders": {"alpha", "beta"}, "Widget hides": {"gamma"}}},
        {"widget": {"Widget renders": set(), "Widget hides": {"gamma"}}},
    )


check(
    lambda: _g7_fail().status == "REVIEW" and len(_g7_fail().detail["dropped"]) == 1,
    "G7: a requirement present on both sides that loses its @trace -> REVIEW, recorded",
)
check(
    lambda: any(
        "widget" in str(row) and "Widget renders" in str(row)
        and "alpha" in str(row) and "beta" in str(row)
        for row in (_g7_fail().detail.get("dropped") or [])
    ),
    "G7: the FAIL names the capability, the requirement, and every lost source",
)
check(
    lambda: any(row.get("before") == 2 and row.get("after") == 0
                for row in (_g7_fail().detail.get("dropped") or [])),
    "G7: the FAIL still carries the before and after counts",
)


# The archive shape: two blocks under one requirement collapse into one that
# keeps only the archiving change's own source. The surviving count is nonzero,
# so a count comparison of 2 -> 1 and a source comparison agree here -- but the
# source comparison says *which* trace the archival discarded.
def _g7_merge_distinct():
    return gates.gate_trace_parity(
        {"widget": {"Widget renders": {"older-change", "newer-change"}}},
        {"widget": {"Widget renders": {"newer-change"}}},
    )


check(
    lambda: _g7_merge_distinct().status == "REVIEW",
    "G7: merging two blocks with different sources into one -> REVIEW",
)
check(
    lambda: [row.get("lost_sources") for row in (_g7_merge_distinct().detail.get("dropped") or [])]
    == [["older-change"]],
    "G7: the merge hit names exactly the source that disappeared",
)


# M6 (partial-loss half): five sources down to one has lost metadata just as
# surely as a drop to zero -- archive's wholesale block replacement does not
# stop at the last entry.
def _g7_partial():
    return gates.gate_trace_parity(
        {"widget": {"Widget renders": {"s1", "s2", "s3", "s4", "s5"}}},
        {"widget": {"Widget renders": {"s1"}}},
    )


check(
    lambda: _g7_partial().status == "REVIEW",
    "G7: a partial trace loss (5 sources -> 1) is reported, not only a loss to zero",
)
check(
    lambda: any(
        row.get("before") == 5 and row.get("after") == 1
        and row.get("lost_sources") == ["s2", "s3", "s4", "s5"]
        and "widget" in str(row) and "Widget renders" in str(row)
        for row in (_g7_partial().detail.get("dropped") or [])
    ),
    "G7: the partial-loss FAIL names capability, requirement, counts and lost sources",
)


# A count comparison cannot see this one: the requirement keeps two traces, but
# one of them is not the trace it had.
def _g7_swap():
    return gates.gate_trace_parity(
        {"widget": {"Widget renders": {"kept", "discarded"}}},
        {"widget": {"Widget renders": {"kept", "brand-new"}}},
    )


check(
    lambda: _g7_swap().status == "REVIEW",
    "G7: a source replaced by another at an unchanged count is still reported",
)
check(
    lambda: [row.get("lost_sources") for row in (_g7_swap().detail.get("dropped") or [])]
    == [["discarded"]],
    "G7: the replaced source is named, and the added one is not reported as loss",
)


def _g7_vanish():
    return gates.gate_trace_parity(
        {"widget": {"Widget renders": {"a", "b", "c"}, "Widget hides": {"d"}}},
        {"widget": {"Widget hides": {"d"}}},
    )


check(
    lambda: _g7_vanish().status == "REVIEW",
    "G7: a requirement that vanishes from HEAD -> REVIEW, not FAIL",
)
check(
    lambda: any(
        "Widget renders" in str(row) and row.get("base_traces") == 3
        and row.get("base_sources") == ["a", "b", "c"]
        for row in (_g7_vanish().detail.get("vanished") or [])
    ),
    "G7: the REVIEW carries the vanished requirement's trace count and sources",
)
check(
    lambda: not (_g7_vanish().detail.get("dropped") or []),
    "G7: a vanished requirement is not also reported as dropped",
)


def _g7_growth():
    return gates.gate_trace_parity(
        {"widget": {"Widget renders": {"a"}}},
        {"widget": {"Widget renders": {"a", "b"}, "Brand new requirement": {"c"}},
         "gadget": {"Gadget spins": {"d"}}},
    )


check(
    lambda: _g7_growth().status == "PASS",
    "G7: new capabilities, new requirements and added sources -> PASS",
)
check(
    lambda: not ((_g7_growth().detail.get("dropped") or [])
                 or (_g7_growth().detail.get("vanished") or [])),
    "G7: growth produces no hits",
)


# ── run_gates(): the integration path CI actually executes ───────────────────
# Every assertion above tests a part. `run_gates` is what wires the parts to the
# repository -- which diff each gate sees, which file feeds which adapter, how a
# verdict list is assembled -- and nothing else exercises it. A gate could be
# wired to the wrong input, or dropped from the list, with the suite still green.
#
# These build a real git repository in a temp directory and run the real thing.


def _git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)


# The real shape: a `source:` naming the change that wrote the trace, then the
# code list. G7's identity comes from that source, so the fixture must carry one.
_TRACE_BLOCK = ("<!-- @trace\nsource: baseline-change\nupdated: 2026-01-01\n"
                "code:\n  - scripts/widget.ts\n-->\n")


def build_fixture_repo(tmp: Path, *, with_gates: bool = True, with_claim: bool = True,
                       gates_body: str = "claim_phrases: []\n") -> Path:
    """A repo with a baseline spec on `main` and a change on HEAD.

    The baseline spec carries a requirement with an @trace block so the G7
    wiring can be exercised by deleting it. `with_gates` controls whether the
    change directory ships a gates.yaml (with `gates_body` as its content);
    `with_claim` whether its design.md carries an invariance claim about a file
    the diff touched.
    """
    r = tmp / "repo"
    (r / "openspec" / "specs" / "widget").mkdir(parents=True)
    (r / "openspec" / "changes" / "demo").mkdir(parents=True)
    (r / "docs").mkdir()
    (r / "scripts").mkdir()

    (r / "openspec" / "specs" / "widget" / "spec.md").write_text(
        "# widget\n\n## Requirements\n\n"
        "### Requirement: Widget renders\n"
        + _TRACE_BLOCK +
        "\n#### Scenario: it renders when enabled\n\n- **WHEN** enabled\n- **THEN** it renders\n\n"
        "### Requirement: Widget hides\n\n"
        "#### Scenario: it hides when disabled\n\n- **WHEN** disabled\n- **THEN** it hides\n",
        encoding="utf-8")
    (r / "scripts" / "widget.ts").write_text(
        'export const MSG = "the widget is always visible here"\n', encoding="utf-8")
    (r / "docs" / "guide.md").write_text("# Guide\n\nThe widget is shown.\n", encoding="utf-8")

    _git(r, "init", "-q", "-b", "main")
    _git(r, "config", "user.email", "t@example.com")
    _git(r, "config", "user.name", "t")
    _git(r, "add", "-A")
    _git(r, "commit", "-qm", "baseline")

    # The change lands on a branch: run_gates diffs `base...HEAD`, which is empty
    # when both are the same commit.
    _git(r, "checkout", "-q", "-b", "change")

    (r / "scripts" / "widget.ts").write_text(
        'export const MSG = "the widget appears only when granted"\n', encoding="utf-8")
    (r / "openspec" / "changes" / "demo" / "proposal.md").write_text(
        "# demo\n\n## Impact\n\n- Affected code:\n  - Modified: scripts/widget.ts\n",
        encoding="utf-8")
    design = ("# design\n\n- 不改 `scripts/widget.ts`。\n" if with_claim
              else "# design\n\n- 說明:本變更調整 widget 的訊息字串。\n")
    (r / "openspec" / "changes" / "demo" / "design.md").write_text(design, encoding="utf-8")
    (r / "openspec" / "changes" / "demo" / "tasks.md").write_text(
        "# tasks\n\n- [x] 1.1 do the thing\n", encoding="utf-8")
    if with_gates:
        (r / "openspec" / "changes" / "demo" / "gates.yaml").write_text(
            gates_body, encoding="utf-8")
    _git(r, "add", "-A")
    _git(r, "commit", "-qm", "change")
    return r


def in_fixture(fn, **build_kw):
    """Run fn(repo_path) with cwd set to a fresh fixture repo."""
    tmp = Path(tempfile.mkdtemp(prefix="spec-gates-fixture-"))
    cwd = os.getcwd()
    try:
        repo = build_fixture_repo(tmp, **build_kw)
        os.chdir(repo)
        return fn(repo)
    finally:
        os.chdir(cwd)
        shutil.rmtree(tmp, ignore_errors=True)


# L5: `Path("openspec/changes") / change_id` follows whatever the id says, so
# an id carrying `/` or `..` escapes the changes directory. run_gates refuses
# such an id before touching the filesystem or git.
_L5_RESULTS: list = []


def _l5():
    if not _L5_RESULTS:
        def go(_repo):
            return (
                _raises(lambda: gates.run_gates("../demo", "main"), gates.GateError),
                _raises(lambda: gates.run_gates("a/b", "main"), gates.GateError),
                _raises(lambda: gates.run_gates("x/../../demo", "main"), gates.GateError),
            )
        _L5_RESULTS.append(in_fixture(go, with_gates=True, with_claim=False))
    return _L5_RESULTS[0]


check(lambda: _l5()[0], "run_gates: a change id containing .. raises GateError")
check(lambda: _l5()[1], "run_gates: a change id containing / raises GateError")
check(lambda: _l5()[2], "run_gates: a combined traversal id raises GateError")


# R2-4: the traversal guard was a substring test for "..", which also refuses a
# perfectly ordinary single-segment directory name such as `v1..v2`. With no
# separator in the id, `Path("openspec/changes") / id` cannot leave the
# directory whatever the dots do; only a complete `..` segment can. The guard
# tests segments, not substrings.
_R24: list = []


def _r24():
    if not _R24:
        def go(repo):
            d = repo / "openspec" / "changes" / "v1..v2"
            d.mkdir(parents=True)
            (d / "gates.yaml").write_text("claim_phrases: []\n", encoding="utf-8")
            return (gates.run_gates("v1..v2", "main"),
                    _raises(lambda: gates.run_gates("", "main"), gates.GateError),
                    _raises(lambda: gates.run_gates(".", "main"), gates.GateError))
        _R24.append(in_fixture(go, with_gates=True, with_claim=False))
    return _R24[0]


check(
    lambda: len(_r24()[0]) == 3,
    "run_gates: a dotted-but-single-segment id like v1..v2 is evaluated, not refused",
)
check(
    lambda: next((v for v in _r24()[0] if v.gate.startswith("G1")), None).status == "PASS",
    "run_gates: v1..v2 reads that directory's own gates.yaml -> G1 PASS",
)
check(lambda: _r24()[1], "run_gates: an empty change id raises GateError")
check(lambda: _r24()[2], "run_gates: a bare '.' change id raises GateError")


# R2-2: changed_files_from() -- the parser -- was tested against hand-built NUL
# strings, but the call that produces those strings was not. A wrong flag
# (dropping -z, dropping -uall) is invisible to a parser test and produces
# exactly the mangling the parser was written to prevent. This runs the real
# `git status` invocation against a working tree carrying every shape that
# breaks without the flags: a space in the name, a non-ASCII path, and a rename.
_R22: list = []


def _r22():
    if not _R22:
        def go(repo):
            # quotePath is pinned on so the scenario does not depend on the
            # developer's gitconfig: without -z, git would C-quote the CJK path.
            _git(repo, "config", "core.quotePath", "true")
            _git(repo, "config", "status.renames", "true")
            (repo / "my draft file.md").write_text("draft\n", encoding="utf-8")
            (repo / "文件").mkdir()
            (repo / "文件" / "說明筆記.md").write_text("note\n", encoding="utf-8")
            _git(repo, "mv", "scripts/widget.ts", "scripts/renamed widget.ts")
            return gates.changed_files("main")
        _R22.append(in_fixture(go, with_gates=True, with_claim=False))
    return _R22[0]


check(
    lambda: "my draft file.md" in _r22(),
    "changed_files: a working-tree path containing spaces arrives intact from git",
)
check(
    lambda: "文件/說明筆記.md" in _r22(),
    "changed_files: an untracked non-ASCII path arrives unquoted and unmangled",
)
check(
    lambda: "scripts/renamed widget.ts" in _r22() and "scripts/widget.ts" in _r22(),
    "changed_files: a staged rename contributes both its target and its origin",
)
check(
    lambda: not any("\0" in f or '"' in f or "\n" in f or f.endswith("/") for f in _r22()),
    "changed_files: no entry carries a NUL, a quote, a newline, or a trailing slash",
)


# M1: the phrase sat in git grep's option slot, so an author-controlled phrase
# beginning with `-` was parsed as an option. Real options (`--cached`,
# `--no-index`, `--open-files-in-pager=<cmd>`) make git exit 0, which ok=(0, 1)
# does not intercept. The phrase must always be a literal pattern.
def _dash_grep(repo):
    p = Path("docs/opts.md")
    p.write_text("run with --cached to inspect the index\n", encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-qm", "opts doc")
    return gates.grep_phrase("--cached", "openspec/changes/demo/tasks.md")


_DASH_GREP: list = []


def _dash_grep_rows():
    if not _DASH_GREP:
        _DASH_GREP.append(in_fixture(_dash_grep, with_gates=True, with_claim=False))
    return _DASH_GREP[0]


check(
    lambda: any(path == "docs/opts.md" for path, _, _ in _dash_grep_rows()),
    "G1: a phrase that is a real git option is searched as a literal, not parsed",
)
check(
    lambda: all(line_no == 1 for path, line_no, _ in _dash_grep_rows()
                if path == "docs/opts.md"),
    "G1: the dash-leading phrase's hit carries the real line number",
)
check(
    lambda: gates.grep_phrase("--no-index" + ABSENT, "nothing/") == [],
    "G1: an absent dash-leading phrase yields no hits rather than a git error",
)


# L3: the tasks.md skip was a startswith() on the whole hit line, so
# `tasks.md.bak` and `tasks.md.orig` were swallowed with it. Only the exact
# path is the change's own task list; everything else is repository content.
def _bak_grep(repo):
    tasks = Path("openspec/changes/demo/tasks.md")
    tasks.write_text(tasks.read_text(encoding="utf-8")
                     + "\nthe needle-zqx phrase lives here\n", encoding="utf-8")
    Path("openspec/changes/demo/tasks.md.bak").write_text(
        "the needle-zqx phrase lives here too\n", encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-qm", "bak file")
    return gates.grep_phrase("needle-zqx", "openspec/changes/demo/tasks.md")


_BAK_GREP: list = []


def _bak_grep_rows():
    if not _BAK_GREP:
        _BAK_GREP.append(in_fixture(_bak_grep, with_gates=True, with_claim=False))
    return _BAK_GREP[0]


check(
    lambda: any(path == "openspec/changes/demo/tasks.md.bak"
                for path, _, _ in _bak_grep_rows()),
    "G1: tasks.md.bak is searched — the skip is the exact tasks.md path only",
)
check(
    lambda: all(path != "openspec/changes/demo/tasks.md"
                for path, _, _ in _bak_grep_rows()),
    "G1: the change's own tasks.md is still skipped",
)


# M5: with git's default core.quotePath=true, `ls-tree --name-only` C-quotes a
# non-ASCII path ("openspec/specs/\346\226\207/spec.md"), the parts[3] check
# misses, and the capability never enters the base map — gate_trace_parity
# iterates base only, so its trace loss vanished without a word. This repo
# writes in Traditional Chinese; a CJK capability name is not hypothetical.
_CJK_CAP = "終端機"
_CJK_G7: list = []


def _cjk_trace_loss():
    """G7 over a repo whose only capability has a CJK name: base carries a
    trace block, the working tree drops it. quotePath=true is pinned in the
    repo config so the scenario is deterministic under any user gitconfig."""
    if _CJK_G7:
        return _CJK_G7[0]
    tmp = Path(tempfile.mkdtemp(prefix="spec-gates-cjk-"))
    cwd = os.getcwd()
    try:
        r = tmp / "repo"
        spec = r / "openspec" / "specs" / _CJK_CAP / "spec.md"
        spec.parent.mkdir(parents=True)
        spec.write_text(
            f"# {_CJK_CAP}\n\n## Requirements\n\n### Requirement: 終端機顯示\n"
            + _TRACE_BLOCK +
            "\n#### Scenario: s\n\n- **WHEN** x\n- **THEN** y\n",
            encoding="utf-8")
        _git(r, "init", "-q", "-b", "main")
        _git(r, "config", "user.email", "t@example.com")
        _git(r, "config", "user.name", "t")
        _git(r, "config", "core.quotePath", "true")
        _git(r, "add", "-A")
        _git(r, "commit", "-qm", "baseline")
        _git(r, "checkout", "-q", "-b", "change")
        spec.write_text(
            spec.read_text(encoding="utf-8").replace(_TRACE_BLOCK, ""),
            encoding="utf-8")
        _git(r, "add", "-A")
        _git(r, "commit", "-qm", "drop the trace block")
        os.chdir(r)
        _CJK_G7.append(gates.gate_trace_parity(
            gates.spec_traces_at("main"), gates.spec_traces_worktree()))
    finally:
        os.chdir(cwd)
        shutil.rmtree(tmp, ignore_errors=True)
    return _CJK_G7[0]


check(
    lambda: _cjk_trace_loss().status == "REVIEW" and _cjk_trace_loss().detail["dropped"],
    "G7: a CJK-named capability's trace loss is detected, not silently skipped",
)
check(
    lambda: any(_CJK_CAP in str(row)
                for row in (_cjk_trace_loss().detail.get("dropped") or [])),
    "G7: the CJK capability is named unquoted in the hit detail",
)


def run_cli(args: list[str], cwd=None, env=None) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(RUN), *args], capture_output=True, text=True,
        cwd=str(cwd or HERE.parent.parent), env=env,
    )


_FIXTURE_RUNS: dict = {}


def fixture_verdicts(key: str, *, mutate=None, **build_kw):
    """run_gates("demo", "main") inside a fixture, computed once per scenario and
    inside a check() so a raising run reads as a failed assertion, not an abort."""
    if key not in _FIXTURE_RUNS:
        def go(repo):
            if mutate is not None:
                mutate(repo)
            return gates.run_gates("demo", "main")
        _FIXTURE_RUNS[key] = in_fixture(go, **build_kw)
    return _FIXTURE_RUNS[key]


def integration():
    return fixture_verdicts("default", with_gates=True, with_claim=True)


def gate_named(prefix, verdicts=None):
    vs = integration() if verdicts is None else verdicts
    return next((v for v in vs if v.gate.startswith(prefix)), None)


check(lambda: len(integration()) == 3,
      "run_gates: exactly the three reduced gates are assembled")
check(lambda: [v.gate[:2] for v in integration()] == ["G1", "G2", "G7"],
      "run_gates: the verdicts are G1, G2, G7 in order, none dropped or duplicated")
check(lambda: all(v.status in ("PASS", "REVIEW", "FAIL") for v in integration()),
      "run_gates: every verdict carries a legal status")
check(lambda: not any(v.status == "FAIL" for v in integration()),
      "run_gates: a change that ships gates.yaml reports zero FAIL")

# G1 wiring: the fixture declares claim_phrases: [], which must surface as the
# deliberate-declaration PASS, proving the per-change file was read.
check(
    lambda: (lambda v: v is not None and v.status == "PASS"
             and "deliberately" in str(v.detail).lower())(gate_named("G1")),
    "run_gates: claim_phrases: [] flows through as a deliberate PASS",
)

# G2 wiring: design.md claims scripts/widget.ts is unchanged while the diff
# touched it -- listed as REVIEW, never FAIL, and the hit names the file.
check(
    lambda: (lambda v: v is not None and v.status == "REVIEW"
             and "scripts/widget.ts" in str(v.detail))(gate_named("G2")),
    "run_gates: G2 reads the artifacts, sees the diff, and lists the claim as REVIEW",
)
check(
    lambda: [row["artifact"] for row in gate_named("G2").detail["bare"]]
    == ["openspec/changes/demo/design.md"],
    "run_gates: the G2 hit names the change artifact it was read from, path and all",
)


# R2-7 wiring: run_gates numbers each artifact from 1 and concatenates the
# results, so the same line number arrives twice. Without the artifact on the
# row the two hits are indistinguishable in the output -- which is exactly what
# dogfooding this change produced.
def _two_artifacts(repo):
    body = "# x\n\n- 不改 `scripts/widget.ts`。\n"
    (repo / "openspec" / "changes" / "demo" / "proposal.md").write_text(body, encoding="utf-8")
    (repo / "openspec" / "changes" / "demo" / "design.md").write_text(body, encoding="utf-8")


def _g2_wired():
    return gate_named("G2", fixture_verdicts("two-artifacts", mutate=_two_artifacts,
                                             with_gates=True, with_claim=False))


check(
    lambda: sorted(row["artifact"] for row in _g2_wired().detail["bare"])
    == ["openspec/changes/demo/design.md", "openspec/changes/demo/proposal.md"],
    "run_gates: an identical claim in both artifacts yields two separable hits",
)
check(
    lambda: {row["line"] for row in _g2_wired().detail["bare"]} == {3},
    "run_gates: each artifact is numbered from its own line 1, not from the previous file",
)
check(
    lambda: all("openspec/changes/demo/" in row["artifact"]
                for row in _g2_wired().detail["bare"]),
    "run_gates: the artifact is a repository path a reader can open, not a bare name",
)

check(lambda: gates.exit_code_for(integration()) == 0,
      "run_gates: REVIEW-only verdicts leave the exit code at 0")


# G1 mandatory-file wiring: no gates.yaml in the change directory -> FAIL that
# names the path where the file was expected.
def _missing_gates():
    return fixture_verdicts("no-gates", with_gates=False, with_claim=False)


check(
    lambda: (lambda v: v is not None and v.status == "FAIL")(gate_named("G1", _missing_gates())),
    "run_gates: a change directory without gates.yaml -> G1 FAIL",
)
check(
    lambda: "openspec/changes/demo/gates.yaml" in str(
        (gate_named("G1", _missing_gates()) or gates.Verdict("", "", {})).detail),
    "run_gates: the G1 FAIL names the path where gates.yaml was expected",
)


# C1 wiring: a gates.yaml that exists but carries no claim_phrases key is the
# same FAIL, with a detail a contributor can tell apart from the missing-file
# cause — the fix differs (add the key vs create the file).
def _key_missing():
    return fixture_verdicts("key-missing", with_gates=True, with_claim=False,
                            gates_body="hedge_markers: []\n")


check(
    lambda: (lambda v: v is not None and v.status == "FAIL")(gate_named("G1", _key_missing())),
    "run_gates: gates.yaml present but without claim_phrases -> G1 FAIL",
)
check(
    lambda: (lambda d: "claim_phrases" in str(d) and "gates.yaml" in str(d))(
        (gate_named("G1", _key_missing()) or gates.Verdict("", "", {})).detail),
    "run_gates: the missing-key FAIL names the key and the file",
)
check(
    lambda: "missing_key" in (gate_named("G1", _key_missing())
                              or gates.Verdict("", "", {})).detail
    and "missing_key" not in (gate_named("G1", _missing_gates())
                              or gates.Verdict("", "", {})).detail,
    "run_gates: missing-file and missing-key causes are distinguishable in the detail",
)


# R2-5 wiring: `claim_phrases:` with no value reaches the same FAIL, and the
# detail has to tell the contributor what to write -- the fix is a literal `[]`,
# which is not obvious from "the key is missing" when the key is visibly there.
def _null_claim():
    return fixture_verdicts("null-claim", with_gates=True, with_claim=False,
                            gates_body="claim_phrases:\n")


check(
    lambda: (lambda v: v is not None and v.status == "FAIL")(gate_named("G1", _null_claim())),
    "run_gates: `claim_phrases:` with no value -> G1 FAIL, not a deliberate PASS",
)
check(
    lambda: "deliberately" not in str(
        (gate_named("G1", _null_claim()) or gates.Verdict("", "", {})).detail).lower(),
    "run_gates: an unfinished declaration is never reported as a deliberate one",
)
check(
    lambda: "claim_phrases: []" in str(
        (gate_named("G1", _null_claim()) or gates.Verdict("", "", {})).detail),
    "run_gates: the FAIL detail spells out the `claim_phrases: []` the author must write",
)


# R2-3 end to end: an unusable global config.yaml must exit 2 with a message.
# Exercised against a *copy* of run.py in a temp directory, because the fallback
# path is `Path(__file__).parent / "config.yaml"` -- pointing the copy at a bad
# neighbour is the only way to run the real resolution without editing the
# repository's own config. Before the fix this exited 1 with a traceback, which
# a contributor reads as "a gate failed".
_R23_CLI: list = []


def _r23_cli():
    if not _R23_CLI:
        tmp = Path(tempfile.mkdtemp(prefix="spec-gates-copyrun-"))
        try:
            shutil.copy(RUN, tmp / "run.py")
            (tmp / "config.yaml").write_text("- unless\n- 若\n", encoding="utf-8")
            _R23_CLI.append(in_fixture(
                lambda r: subprocess.run(
                    [sys.executable, str(tmp / "run.py"), "demo", "--base", "main"],
                    capture_output=True, text=True, cwd=str(r)),
                with_gates=True, with_claim=False, gates_body="claim_phrases: []\n"))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    return _R23_CLI[0]


check(lambda: _r23_cli().returncode == 2,
      "CLI: an unusable global config.yaml exits 2, not 1 as though a gate failed")
check(lambda: "Traceback" not in _r23_cli().stderr,
      "CLI: the unusable global config is reported as a message, not a traceback")
check(lambda: "config.yaml" in _r23_cli().stderr,
      "CLI: the message names the config file that could not be used")


# G7 wiring: the base commit's spec carries an @trace block on a requirement;
# HEAD deletes the block. Asserting on the detail, not just the status -- a
# status-only assertion cannot tell a wired gate from a constant.
def _delete_trace(repo):
    spec = Path("openspec/specs/widget/spec.md")
    text = spec.read_text(encoding="utf-8").replace(_TRACE_BLOCK, "")
    spec.write_text(text, encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-qm", "drop the trace block")


def _trace_loss():
    return fixture_verdicts("trace-loss", mutate=_delete_trace,
                            with_gates=True, with_claim=False)


check(
    lambda: (lambda v: v is not None and v.status == "REVIEW" and v.detail["dropped"])(
        gate_named("G7", _trace_loss())),
    "run_gates: G7 reports a deleted @trace block, at the REVIEW tier",
)
check(
    lambda: "Widget renders" in str(
        (gate_named("G7", _trace_loss()) or gates.Verdict("", "", {})).detail),
    "run_gates: the G7 hit names the requirement that lost its trace",
)


# CLI wiring through the same fixtures: the forced-FAIL path is G1's missing
# gates.yaml, per the reduced contract.
check(
    lambda: in_fixture(lambda r: run_cli(["demo"], cwd=r).returncode,
                       with_gates=False, with_claim=False) == 1,
    "CLI: a change without gates.yaml exits 1 via the G1 FAIL",
)
check(
    lambda: in_fixture(lambda r: run_cli(["demo"], cwd=r).returncode,
                       with_gates=True, with_claim=True) == 0,
    "CLI: REVIEW-only verdicts exit 0",
)


# ── Exit-code contract ───────────────────────────────────────────────────────

check(
    lambda: run_cli(["--help"]).returncode == 0 and "usage" in run_cli(["--help"]).stdout.lower(),
    "CLI: --help exits 0 and prints a usage line",
)
def _help():
    return run_cli(["--help"]).stdout
check(
    lambda: "--resolve-change" in _help(),
    "CLI: --help documents --resolve-change",
)
check(
    lambda: "--snapshot" not in _help() and "--verify-archive" not in _help(),
    "CLI: the snapshot and verify-archive modes are gone from the interface",
)
check(
    lambda: run_cli(["no-such-change-exists"]).returncode == 2,
    "CLI: an unknown change id exits 2",
)

# The spec's failure mode for an unusable git: exit 2 with a message, not a
# traceback. Run inside a fixture so the change directory exists regardless of
# what is live under this repository's openspec/changes/.
_NO_GIT_CACHE: list = []


def _no_git():
    if not _NO_GIT_CACHE:
        env = {"PATH": "/nonexistent", "HOME": os.environ.get("HOME", "/tmp")}
        _NO_GIT_CACHE.append(in_fixture(
            lambda r: run_cli(["demo"], cwd=r, env=env),
            with_gates=True, with_claim=False))
    return _NO_GIT_CACHE[0]


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

# ── --trace-parity-only: G7 without a change id ──────────────────────────────

# G7 compares every openspec/specs/**/spec.md between two refs; it needs no
# change id. CI must run it on every pull request, including the two shapes
# where no id resolves at all: a PR that never touches openspec/changes/, and
# an archive PR (git records the move as a rename, so the pre-archive path
# never appears in --name-only and the id set comes out empty). Without a
# G7-only mode, the only way to reach the gate is to fabricate a change
# directory, which puts CI's correctness at the mercy of G1's and G2's
# behaviour on a directory nobody wrote.
_TPO: dict = {}


def _trace_only(key: str, args: list[str], **build_kw):
    if key not in _TPO:
        _TPO[key] = in_fixture(lambda r: run_cli(args, cwd=r), **build_kw)
    return _TPO[key]


def _tpo_clean():
    return _trace_only("clean", ["--trace-parity-only", "--base", "main"],
                       with_gates=False, with_claim=False)


def _drop_trace(repo: Path) -> None:
    spec = repo / "openspec" / "specs" / "widget" / "spec.md"
    spec.write_text(spec.read_text(encoding="utf-8").replace(_TRACE_BLOCK, "\n"),
                    encoding="utf-8")


def _tpo_dropped():
    if "dropped" not in _TPO:
        def go(repo):
            _drop_trace(repo)
            return run_cli(["--trace-parity-only", "--base", "main"], cwd=repo)
        _TPO["dropped"] = in_fixture(go, with_gates=False, with_claim=False)
    return _TPO["dropped"]


check(lambda: "--trace-parity-only" in _help(),
      "CLI: --help documents --trace-parity-only")
check(lambda: _tpo_clean().returncode == 0,
      "CLI: --trace-parity-only needs no change id and exits 0 when traces are intact")
check(lambda: "G7" in _tpo_clean().stdout and "G1" not in _tpo_clean().stdout,
      "CLI: --trace-parity-only reports G7 alone, not the id-scoped gates")
check(lambda: _tpo_dropped().returncode == 0 and "REVIEW" in _tpo_dropped().stdout,
      "CLI: --trace-parity-only reports a lost @trace as REVIEW and does not block")
check(lambda: "Widget renders" in _tpo_dropped().stdout,
      "CLI: the G7-only hit names the requirement that lost its trace")
check(
    lambda: run_cli(["some-id", "--trace-parity-only"]).returncode == 2,
    "CLI: combining --trace-parity-only with a change id is refused, not resolved silently",
)


# ── R2-1 end to end: consolidation is not loss ───────────────────────────────
# The reported defect was reproduced through this exact path -- exit 1 on a
# rewrite that merged two same-source trace blocks into one. The unit
# assertions above cannot catch a regression that reintroduces block counting
# inside _spec_traces without changing gate_trace_parity's signature, so the
# guard is anchored on the CLI's exit code.
_MERGE: dict = {}


def _merge_run(key: str, base_blocks: str, head_blocks: str):
    """--trace-parity-only over a repo whose single requirement carries
    `base_blocks` at `main` and `head_blocks` at HEAD."""
    if key not in _MERGE:
        tmp = Path(tempfile.mkdtemp(prefix="spec-gates-merge-"))
        try:
            r = tmp / "repo"
            spec = r / "openspec" / "specs" / "widget" / "spec.md"
            spec.parent.mkdir(parents=True)
            top = "# widget\n\n## Requirements\n\n### Requirement: Widget renders\n"
            tail = "\n#### Scenario: s\n\n- **WHEN** x\n- **THEN** y\n"
            spec.write_text(top + base_blocks + tail, encoding="utf-8")
            _git(r, "init", "-q", "-b", "main")
            _git(r, "config", "user.email", "t@example.com")
            _git(r, "config", "user.name", "t")
            _git(r, "add", "-A")
            _git(r, "commit", "-qm", "baseline")
            _git(r, "checkout", "-q", "-b", "change")
            spec.write_text(top + head_blocks + tail, encoding="utf-8")
            _git(r, "add", "-A")
            _git(r, "commit", "-qm", "rewrite the trace blocks")
            _MERGE[key] = run_cli(["--trace-parity-only", "--base", "main"], cwd=r)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    return _MERGE[key]


def _merge_same():
    return _merge_run(
        "same",
        _trace_block("change-a", code="scripts/one.ts")
        + _trace_block("change-a", code="scripts/two.ts"),
        "<!-- @trace\nsource: change-a\nupdated: 2026-01-01\ncode:\n"
        "  - scripts/one.ts\n  - scripts/two.ts\n-->\n")


def _merge_lossy():
    return _merge_run(
        "lossy",
        _trace_block("older-change", code="scripts/one.ts")
        + _trace_block("newer-change", code="scripts/two.ts"),
        "<!-- @trace\nsource: newer-change\nupdated: 2026-01-01\ncode:\n"
        "  - scripts/one.ts\n  - scripts/two.ts\n-->\n")


check(lambda: _merge_same().returncode == 0,
      "CLI: merging two same-source trace blocks into one exits 0, not 1")
check(lambda: "FAIL=0" in _merge_same().stdout and "PASS" in _merge_same().stdout,
      "CLI: the same-source merge reports the gate as PASS with a zero FAIL count")
check(lambda: _merge_lossy().returncode == 0 and "REVIEW" in _merge_lossy().stdout,
      "CLI: a merge that discards a source is reported as REVIEW, not blocked")
check(lambda: "older-change" in _merge_lossy().stdout
      and "newer-change" not in _merge_lossy().stdout.split("older-change")[0],
      "CLI: the lossy merge names the discarded source in its output")


# ── G7 never blocks, and the corpus that decided it ──────────────────────────

# Two identities were tried against the same 60 archive commits in this
# repository. Source sets flagged 4 commits / 7 requirements; block counts
# flagged 1 commit / 3 requirements; the two hit sets do not intersect. Whether
# the 7 are false positives depends on which definition of "lost" the reader
# brought — under "the count held" they are noise, under "a `code:` path that
# still exists at HEAD is no longer named" they are all real. Neither reading
# is written down anywhere: `@trace` and `source:` carry no requirement in
# openspec/specs, and `spectra archive`, which writes them, is a closed binary.
# So G7 reports and a human adjudicates. This assertion is what stops the next
# identity change from quietly restoring a blocking verdict.
def _g7_never_fails():
    shapes = [
        ({}, {}),
        ({"c": {"R": {"a"}}}, {"c": {"R": {"a"}}}),
        ({"c": {"R": {"a", "b"}}}, {"c": {"R": {"a"}}}),          # partial loss
        ({"c": {"R": {"a"}}}, {"c": {"R": {"b"}}}),                # swap
        ({"c": {"R": {"a"}}}, {"c": {}}),                          # vanished
        ({"c": {"R": {"a"}}}, {}),                                 # capability gone
        ({"c": {"R": set()}}, {"c": {"R": {"a"}}}),                # growth
    ]
    return [gates.gate_trace_parity(b, h).status for b, h in shapes]


check(lambda: "FAIL" not in _g7_never_fails(),
      "G7: no input shape produces FAIL — the tier is REVIEW until the term is defined")
check(lambda: _g7_never_fails().count("REVIEW") == 4,
      "G7: loss, swap, vanish and capability removal are all still reported")
check(lambda: gates.exit_code_for([gates.gate_trace_parity(
          {"c": {"R": {"a"}}}, {"c": {"R": set()}})]) == 0,
      "G7: a total trace loss leaves the exit code at 0")


# ── R2-6: the module docstring's Usage block ─────────────────────────────────
# --help, design.md and CONTRIBUTE.md all list three invocations; the file's own
# Usage block listed two. A reader who opens run.py to find out how CI calls it
# is told the trace-parity-only mode does not exist.


def _usage_block() -> str:
    doc = gates.__doc__ or ""
    return doc.split("Usage:", 1)[1] if "Usage:" in doc else ""


check(lambda: "--trace-parity-only" in _usage_block(),
      "docs: the module Usage block lists --trace-parity-only")
check(
    lambda: all(form in _usage_block()
                for form in ("<change-id>", "--trace-parity-only", "--resolve-change")),
    "docs: the Usage block lists every invocation --help's epilog describes",
)

# ── Summary ──────────────────────────────────────────────────────────────────

failed = [label for ok, label in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
if failed:
    print("\nFailed:")
    for label in failed:
        print(f"  - {label}")
sys.exit(1 if failed else 0)
