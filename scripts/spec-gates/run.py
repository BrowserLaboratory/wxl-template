#!/usr/bin/env python3
"""Spec-drift gates — detect statements a change falsified without editing.

Every other gate in this repository (vitest, the VitePress build, playwright,
prose-audit) is closed over the artifacts a change *touched*. The defect class
that repeatedly survives multi-round review is the complement: prose and spec
sentences that were true, were not edited, and became false because the code
they describe changed. These checks cover that complement.

Verdicts are PASS / REVIEW / FAIL. Only FAIL affects the exit code — the review
tier exists because several of these checks legitimately surface hits a human
must adjudicate (section headings, code identifiers, deliberate removals), and
a gate that blocks on those is a gate people learn to bypass.

Usage:
    run.py <change-id> [--base REF] [--json]
    run.py --snapshot <change-id> [--out PATH]
    run.py --verify-archive <change-id> [--snapshot-file PATH]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

EXCLUDE_ARCHIVE = ":!openspec/changes/archive"
DEFAULT_HEDGES = [
    "where the challenge", "only on challenges", "unless", "assumes", "when granted",
    "grants", "granted", "offers it", "may be absent",
    "若", "如果", "有授予", "僅在", "未授予", "假設", "除非",
]


@dataclass
class Verdict:
    gate: str
    status: str  # PASS | REVIEW | FAIL
    detail: dict = field(default_factory=dict)


class GateError(RuntimeError):
    """The gates could not be evaluated. Distinct from a gate reporting FAIL."""


def sh(*args: str, ok=(0,)) -> str:
    """stdout of a command, refusing to let a failure look like empty output.

    `git grep` exits 1 for "no match" and 128 for an error, and both were being
    returned as an empty string. G3 asks whether a deleted literal survives
    anywhere, so a grep that errored read as "it survives nowhere" and the gate
    passed silently. Callers that have a benign non-zero code declare it in `ok`.
    """
    try:
        proc = subprocess.run(args, capture_output=True, text=True)
    except (FileNotFoundError, NotADirectoryError, PermissionError) as exc:
        raise GateError(f"cannot run {args[0]!r}: {exc}") from exc
    if proc.returncode not in ok:
        raise GateError(
            f"{' '.join(args)} exited {proc.returncode}: "
            f"{(proc.stderr or proc.stdout).strip()[:400]}")
    return proc.stdout


# ── G1 claim-parity ──────────────────────────────────────────────────────────

def gate_claim_parity(phrases, hedges, grep) -> Verdict:
    """Every occurrence of a phrase whose truth conditions the change altered must
    be hedged, sit under a stated premise, or be recorded as unaffected.

    `grep(phrase)` yields (path, line_no, text). Never FAILs: deciding whether an
    occurrence is a claim at all needs a reader.
    """
    if not phrases:
        return Verdict("G1 claim-parity", "PASS",
                       {"note": "no phrases declared — set claim_phrases in gates.yaml "
                                "if this change altered the truth conditions of any claim"})
    hits, uncovered = [], []
    for phrase in phrases:
        for path, line_no, text in grep(phrase):
            hits.append((path, line_no, text))
            if not any(h.lower() in text.lower() for h in hedges):
                uncovered.append((path, line_no, text))
    return Verdict("G1 claim-parity", "REVIEW" if uncovered else "PASS",
                   {"total_hits": len(hits), "uncovered": uncovered})


# ── G2 invariance ────────────────────────────────────────────────────────────

_INVARIANCE = re.compile(
    r"不變|不改|無異動|unchanged|not affected|no\s+\w*\s*changes?\b", re.IGNORECASE)
# A qualified claim names *which aspect* is unchanged, so it can hold even when
# the file itself was edited elsewhere. The marker is a bold span placed after
# the file reference -- the convention CONTRIBUTE.md documents. Bare words such
# as "rules" or a bold label opening the line are not scope markers: accepting
# them let a blanket claim reach REVIEW without saying what it had scoped.
_QUALIFIED = re.compile(r"\*\*[^*]+\*\*")
# Backticked spans first, then bare path-shaped tokens.
_PATH_REF = re.compile(r"`([^`]+)`|((?:[\w.-]+/)*[\w-]+\.[A-Za-z0-9]+)")


def _references(text: str):
    """(reference, end offset) for each file path the line names."""
    out = []
    for m in _PATH_REF.finditer(text):
        ref = (m.group(1) or m.group(2) or "").strip()
        if ref and not ref.endswith("/"):
            out.append((ref, m.end()))
    return out


def gate_invariance(lines, changed_files) -> Verdict:
    """`X is unchanged` in a change artifact, where X is a file the diff touched.

    A reference resolves to a changed file only when it is that path or a
    path-boundary suffix of it. Matching on basename alone made a true claim
    about `scripts/prose-audit/run.py` fail because the diff touched
    `scripts/spec-gates/run.py` -- and reported the wrong file as the cause.
    """
    bare, qualified = [], []
    changed = set(changed_files)
    for line_no, text in lines:
        if not _INVARIANCE.search(text):
            continue
        for ref, end in _references(text):
            hit = next((f for f in sorted(changed)
                        if f == ref or f.endswith("/" + ref)), None)
            if not hit:
                continue
            row = {"line": line_no, "names": hit, "text": text.strip()[:160]}
            marker = _QUALIFIED.search(text, end)
            (qualified if marker else bare).append(row)
            break
    if bare:
        return Verdict("G2 invariance", "FAIL", {"bare": bare, "qualified": qualified})
    return Verdict("G2 invariance", "REVIEW" if qualified else "PASS",
                   {"bare": [], "qualified": qualified})


# ── G3 deleted-literal ───────────────────────────────────────────────────────

_CODE_SHAPED = re.compile(r"[<>{};=]")


def is_prose_literal(s: str) -> bool:
    """A message a human reads, not an identifier or a markup fragment.

    Parentheses do NOT disqualify: `not specified (default all)` is exactly the
    kind of user-facing string this gate exists to chase, and an earlier draft of
    this rule excluded it.
    """
    if not 12 <= len(s) <= 80:
        return False
    if " " not in s or s.lstrip().startswith(","):
        return False
    if _CODE_SHAPED.search(s):
        return False
    return bool(re.search(r"[a-z]{3}", s))


def gate_deleted_literal(removed, added, grep) -> Verdict:
    """A literal the diff deleted must not survive anywhere. One it reintroduced
    was reworded, not deleted, so it is out of scope."""
    survivors = {}
    candidates = set(removed) - set(added)
    for lit in sorted(candidates):
        hits = grep(lit)
        if hits:
            survivors[lit] = hits[:5]
    return Verdict("G3 deleted-literal", "FAIL" if survivors else "PASS",
                   {"checked": len(candidates), "survivors": survivors})


# ── G4 scope parity ──────────────────────────────────────────────────────────

_FILE_TOKEN = re.compile(r"[\w./-]+\.[A-Za-z0-9]+")


def impact_files(proposal_text: str) -> set:
    """File paths named in the proposal's Impact section.

    Authors write the list either one path per bullet or inline after
    `Modified:`, and both shapes occur in this repository's archive. Extract
    file-looking tokens from the section rather than demanding one layout —
    an earlier version required per-line bullets and reported a well-formed
    inline list as ten missing files.
    """
    section = proposal_text.split("## Impact", 1)
    if len(section) < 2:
        return set()
    body = re.split(r"(?m)^## ", section[1])[0]
    out, collecting, marker_indent = set(), False, 0
    for line in body.splitlines():
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        m = re.match(r"\s*-\s*(Modified|New|Removed|新增|修改|移除)\s*:(.*)$", line)
        if m:
            collecting, marker_indent = True, indent
            out |= {f for f in _FILE_TOKEN.findall(m.group(2)) if not f.startswith("(")}
            continue
        # Continuation bullets sit deeper than the marker they belong to. Prose
        # in the Impact section must not contribute paths: an earlier version
        # read a tool named in a verification note as a declared file.
        if collecting and indent > marker_indent and line.lstrip().startswith("-"):
            out |= {f for f in _FILE_TOKEN.findall(line) if not f.startswith("(")}
        elif indent <= marker_indent:
            collecting = False
    return out


_SPECS_ENTRY = re.compile(r"^\s*-\s*\**\s*Affected specs\s*\**\s*[:：]", re.IGNORECASE)
_IDENT = re.compile(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)+")


def named_specs(proposal_text: str, vocabulary):
    """Capability identifiers the proposal's `Affected specs` entry names.

    Returns ``None`` when the proposal carries no such entry at all. That is
    not the same as naming none: an absent declaration makes no claim, and a
    gate whose job is to catch a declaration drifting from reality has nothing
    to compare. 37 of the 84 archived changes that ship delta specs never write
    the line.

    Identifiers are resolved against `vocabulary` -- the capability names that
    actually exist -- rather than by pattern alone. Authors annotate the list
    in open-ended prose ("new", "（modified delta）", "8 個現有 spec 需更新"),
    and no stopword list survives contact with it.
    """
    section = proposal_text.split("## Impact", 1)
    body = re.split(r"(?m)^## ", section[1])[0] if len(section) > 1 else proposal_text
    entry, collecting, marker_indent = None, False, 0
    for line in body.splitlines():
        m = _SPECS_ENTRY.match(line)
        if m:
            entry = ("" if entry is None else entry) + " " + line[m.end():]
            collecting, marker_indent = True, len(line) - len(line.lstrip())
            continue
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        # Continuation bullets sit deeper than the marker they belong to; a
        # sibling bullet at the same depth ends the entry. A bullet declaring
        # what is *unaffected* names specs to exclude -- reading it as a
        # declaration of scope inverts the author's meaning, and did so on
        # three archived changes.
        if collecting and indent > marker_indent:
            if not _INVARIANCE.search(line):
                entry += " " + line
        elif indent <= marker_indent:
            collecting = False
    if entry is None:
        return None
    # Same inversion inside a parenthetical: "`cap` (no spec change)" mentions
    # the capability precisely to say it ships no delta.
    entry = re.sub(r"[（(][^）)]*[）)]",
                   lambda p: "" if _INVARIANCE.search(p.group(0)) else p.group(0), entry)
    # A path names its capability in the second-to-last segment.
    text = re.sub(r"openspec/specs/([a-z0-9-]+)/spec\.md", r" \1 ", entry)
    return {t for t in _IDENT.findall(text) if t in set(vocabulary)}


def change_ids_from_diff(diff_names: str):
    """Live change directories the diff touches.

    The id must come from what the pull request changed. Reading it from
    whichever directory happens to sit under `openspec/changes/` binds an
    unrelated PR to whatever change is live at the time.
    """
    out = set()
    for path in diff_names.split():
        parts = path.split("/")
        if len(parts) > 2 and parts[0] == "openspec" and parts[1] == "changes":
            if parts[2] != "archive":
                out.add(parts[2])
    return sorted(out)


def gate_scope_parity(diff_files, listed_files, disk_specs, named_specs) -> Verdict:
    detail = {
        "in_diff_not_listed": sorted(set(diff_files) - set(listed_files)),
        "listed_not_in_diff": sorted(set(listed_files) - set(diff_files)),
    }
    undeclared = named_specs is None
    if undeclared:
        detail["specs_not_declared"] = sorted(disk_specs)
    else:
        detail["specs_on_disk_not_named"] = sorted(set(disk_specs) - set(named_specs))
        detail["specs_named_not_on_disk"] = sorted(set(named_specs) - set(disk_specs))
    if any(detail[k] for k in ("in_diff_not_listed", "listed_not_in_diff")) or (
        not undeclared and (detail["specs_on_disk_not_named"] or detail["specs_named_not_on_disk"])
    ):
        return Verdict("G4 scope parity", "FAIL", detail)
    return Verdict("G4 scope parity", "REVIEW" if undeclared and disk_specs else "PASS", detail)


# ── G5 delta scenario parity ─────────────────────────────────────────────────

def gate_scenario_parity(delta_scenarios, baseline_scenarios, tasks_text) -> Verdict:
    """A MODIFIED block replaces the baseline requirement wholesale, so a scenario
    the delta omits is silently deleted from the corpus — unless the removal was
    deliberate, which the change records by naming the scenario in its tasks."""
    dropped = []
    for req, delta_set in delta_scenarios.items():
        for missing in sorted(baseline_scenarios.get(req, set()) - set(delta_set)):
            dropped.append({"requirement": req, "scenario": missing,
                            "recorded_as_deliberate": missing in tasks_text})
    unrecorded = [d for d in dropped if not d["recorded_as_deliberate"]]
    if unrecorded:
        return Verdict("G5 delta scenario parity", "FAIL", {"dropped": dropped})
    return Verdict("G5 delta scenario parity", "REVIEW" if dropped else "PASS",
                   {"dropped": dropped})


# ── G6 added-lines trace ─────────────────────────────────────────────────────

_MECHANISM = re.compile(
    r"\b(does|will|shall|routes|returns|produces|writes|is written)\b|會|將|即可|一律|必定",
    re.IGNORECASE)


_HUNK = re.compile(r"^@@ -\S+ \+(\d+)(?:,\d+)? @@")


def added_prose_lines(diff_text: str):
    """(file, line, text) for every line the diff adds.

    A REVIEW outcome must enumerate its hits by file and line, so G6 cannot be
    handed bare strings: an author given a sentence but not its location has to
    grep the diff back by hand.
    """
    rows, path, lineno = [], None, 0
    for line in diff_text.splitlines():
        if line.startswith("+++ "):
            ref = line[4:].strip()
            path = ref[2:] if ref.startswith(("a/", "b/")) else ref
            continue
        if line.startswith("---") or line.startswith("diff --git"):
            continue
        hunk = _HUNK.match(line)
        if hunk:
            lineno = int(hunk.group(1))
            continue
        if line.startswith("+") and path and path != "/dev/null":
            rows.append((path, lineno, line[1:].strip()))
            lineno += 1
    return rows


def gate_added_lines_trace(added_rows) -> Verdict:
    """Mechanism assertions among the prose a change adds, for a human to trace to
    source. The recurring defect is a sentence asserted one step beyond the code
    the author actually read."""
    hits = [{"file": f, "line": n, "text": t[:200]}
            for f, n, t in added_rows if len(t) > 40 and _MECHANISM.search(t)]
    return Verdict("G6 added-lines trace", "REVIEW",
                   {"added_prose_lines": len(added_rows), "mechanism_sentences": hits})


# ── G7 archive trace-parity ──────────────────────────────────────────────────

def gate_trace_parity(snapshot, current) -> Verdict:
    """`spectra archive` replaces each MODIFIED requirement block wholesale, which
    discards the @trace metadata attached to it when the delta does not carry it."""
    dropped = []
    for cap, before in snapshot.items():
        after = current.get(cap, {"requirements": 0, "traces": 0})
        for key in ("requirements", "traces"):
            if after.get(key, 0) < before.get(key, 0):
                dropped.append({"capability": cap, "field": key,
                                "before": before.get(key, 0), "after": after.get(key, 0)})
    return Verdict("G7 archive trace-parity", "FAIL" if dropped else "PASS",
                   {"dropped": dropped})


def exit_code_for(verdicts) -> int:
    return 1 if any(v.status == "FAIL" for v in verdicts) else 0


# ── Repository adapters ──────────────────────────────────────────────────────

def spec_counts(paths) -> dict:
    out = {}
    for cap, path in paths.items():
        p = Path(path)
        text = p.read_text(encoding="utf-8") if p.exists() else ""
        out[cap] = {"requirements": len(re.findall(r"(?m)^### Requirement:", text)),
                    "traces": text.count("<!-- @trace")}
    return out


_DELTA_SECTION = re.compile(r"^## (ADDED|MODIFIED|REMOVED|RENAMED|NEW) Requirements\s*$")


def delta_sections(text: str) -> dict:
    """{section: {requirement: {scenario, ...}}} for a delta spec.

    G5 is scoped to MODIFIED blocks, because those replace the baseline
    requirement wholesale. Collecting every `### Requirement:` regardless of its
    block made a correctly declared REMOVED requirement look like a MODIFIED one
    whose scenarios had all vanished, and G5 failed the change for declaring a
    removal properly.
    """
    out, section, cur = {}, None, None
    for line in text.splitlines():
        m = _DELTA_SECTION.match(line)
        if m:
            section, cur = m.group(1), None
            out.setdefault(section, {})
            continue
        if line.startswith("## "):  # any other block ends the delta section
            section, cur = None, None
            continue
        if section is None:
            continue
        if line.startswith("### Requirement:"):
            cur = line.split(":", 1)[1].strip()
            out[section][cur] = set()
        elif line.startswith("#### Scenario:") and cur:
            out[section][cur].add(line.split(":", 1)[1].strip())
    return out


def scenarios_of(path) -> dict:
    """{requirement: {scenario, ...}} across a whole file, block-agnostic.

    Used for baseline specs, whose requirements sit under a plain
    `## Requirements`. Delta specs go through `delta_sections` instead.
    """
    out, cur = {}, None
    p = Path(path)
    if not p.exists():
        return out
    for line in p.read_text(encoding="utf-8").splitlines():
        if line.startswith("### Requirement:"):
            cur = line.split(":", 1)[1].strip()
            out[cur] = set()
        elif line.startswith("#### Scenario:") and cur:
            out[cur].add(line.split(":", 1)[1].strip())
    return out


def load_config(change_dir: Path) -> dict:
    import yaml
    per_change = change_dir / "gates.yaml"
    default = Path(__file__).resolve().parent / "config.yaml"
    src = per_change if per_change.exists() else default
    data = (yaml.safe_load(src.read_text(encoding="utf-8")) or {}) if src.exists() else {}
    return {"claim_phrases": data.get("claim_phrases") or [],
            "hedge_markers": data.get("hedge_markers") or DEFAULT_HEDGES}


def changed_files_from(diff_names: str, status_lines) -> set:
    """Union of the committed diff and the working tree.

    Untracked entries count: a change that ADDS files would otherwise be told
    its proposal lists files that are not in the diff — which is exactly what
    this gate reported against its own change before this was fixed. `git
    status --porcelain` already omits ignored paths, so scratch files that are
    gitignored do not leak in.
    """
    out = set(diff_names.split())
    for line in status_lines:
        if line.strip():
            out.add(line.split()[-1])
    # `git status --porcelain` collapses an untracked directory into one entry
    # ending in "/". Callers pass -uall so this should not arise, but a bare
    # directory must never reach the file set: its basename is "", and "" is a
    # substring of every line, which made G2 match claims it had no business
    # matching.
    return {f for f in out if f != "skills-lock.json" and not f.endswith("/")}


def changed_files(base: str) -> set:
    return changed_files_from(
        sh("git", "diff", "--name-only", f"{base}...HEAD"),
        sh("git", "status", "--porcelain", "-uall").splitlines(),
    )


def _grep_lines(pattern: str, skip_prefix: str, fixed=True):
    args = ["git", "grep", "-n"] + (["-F"] if fixed else []) + [pattern, "--", EXCLUDE_ARCHIVE]
    return [h for h in sh(*args, ok=(0, 1)).splitlines() if not h.startswith(skip_prefix)]


def grep_phrase(phrase: str, skip_prefix: str):
    rows = []
    for hit in [h for h in sh("git", "grep", "-n", "-i", "-F", phrase, "--",
                              EXCLUDE_ARCHIVE, ok=(0, 1)).splitlines()
                if not h.startswith(skip_prefix)]:
        parts = hit.split(":", 2)
        if len(parts) != 3:
            continue
        try:
            rows.append((parts[0], int(parts[1]), parts[2]))
        except ValueError:
            # An unparseable line is reported rather than dropped.
            rows.append((parts[0], 0, parts[2]))
    return rows


def diff_literals(base: str):
    removed, added = set(), set()
    for line in sh("git", "diff", "-U0", f"{base}...HEAD").splitlines():
        if line.startswith(("---", "+++")):
            continue
        found = {m for m in re.findall(r"['\"]([^'\"]{12,80})['\"]", line) if is_prose_literal(m)}
        if line.startswith("-"):
            removed |= found
        elif line.startswith("+"):
            added |= found
    return removed, added


def run_gates(change_id: str, base: str):
    change_dir = Path("openspec/changes") / change_id
    cfg = load_config(change_dir)
    skip = f"{change_dir}/tasks.md"
    diff = changed_files(base)

    verdicts = [gate_claim_parity(cfg["claim_phrases"], cfg["hedge_markers"],
                                  lambda p: grep_phrase(p, skip))]

    lines = []
    for art in ("proposal.md", "design.md"):
        p = change_dir / art
        if p.exists():
            lines += list(enumerate(p.read_text(encoding="utf-8").splitlines(), 1))
    verdicts.append(gate_invariance(lines, diff))

    removed, added = diff_literals(base)
    verdicts.append(gate_deleted_literal(removed, added,
                                         lambda lit: _grep_lines(lit, skip)))

    prop_path = change_dir / "proposal.md"
    prop = prop_path.read_text(encoding="utf-8") if prop_path.exists() else ""
    listed = impact_files(prop)
    specs_dir = change_dir / "specs"
    disk = set(os.listdir(specs_dir)) if specs_dir.is_dir() else set()
    baseline = set(os.listdir("openspec/specs")) if Path("openspec/specs").is_dir() else set()
    named = named_specs(prop, disk | baseline)
    verdicts.append(gate_scope_parity(
        {f for f in diff if not f.startswith("openspec/changes/")}, listed, disk, named))

    tasks_path = change_dir / "tasks.md"
    tasks_text = tasks_path.read_text(encoding="utf-8") if tasks_path.exists() else ""
    merged = {}
    for cap in sorted(disk):
        delta_path = specs_dir / cap / "spec.md"
        text = delta_path.read_text(encoding="utf-8") if delta_path.exists() else ""
        # MODIFIED only: ADDED has no baseline counterpart, and REMOVED declares
        # the requirement's departure rather than losing scenarios by accident.
        d = delta_sections(text).get("MODIFIED", {})
        b = scenarios_of(Path("openspec/specs") / cap / "spec.md")
        for row in gate_scenario_parity(d, b, tasks_text).detail["dropped"]:
            merged[f"{cap}/{row['scenario']}"] = {"capability": cap, **row}
    unrecorded = [r for r in merged.values() if not r["recorded_as_deliberate"]]
    verdicts.append(Verdict("G5 delta scenario parity",
                            "FAIL" if unrecorded else ("REVIEW" if merged else "PASS"),
                            {"dropped": list(merged.values())}))

    verdicts.append(gate_added_lines_trace(added_prose_lines(
        sh("git", "diff", "-U0", f"{base}...HEAD", "--",
           "docs/", "README.md", "CONTRIBUTE.md"))))
    return verdicts


# Snapshots live under .git/, which is outside the working tree. Writing them to
# the repository root left an untracked file that the spec forbids ("SHALL NOT
# modify any file in the repository") and that the next G4 run then counted as an
# undeclared changed file, failing the following change for no reason.
SNAPSHOT_DIR = ".git/spec-gates"


def snapshot_path(change_id: str) -> Path:
    return Path(SNAPSHOT_DIR) / f"{change_id}.json"


def affected_specs(change_id: str) -> dict:
    specs_dir = Path("openspec/changes") / change_id / "specs"
    caps = sorted(os.listdir(specs_dir)) if specs_dir.is_dir() else []
    return {c: str(Path("openspec/specs") / c / "spec.md") for c in caps}


def _print(verdicts, as_json: bool) -> None:
    if as_json:
        print(json.dumps([{"gate": v.gate, "status": v.status, "detail": v.detail}
                          for v in verdicts], ensure_ascii=False, indent=2))
        return
    for v in verdicts:
        print(f"{v.status:<7} {v.gate}")
        for key, val in v.detail.items():
            if not (val or isinstance(val, int)):
                continue
            # A list is the hit enumeration the spec requires REVIEW and FAIL to
            # carry, so it is printed one entry per line and never truncated. An
            # earlier version json-dumped it and cut the result at 400
            # characters, which silently dropped 24 of 31 hits on a real run --
            # in exactly the output mode CI uses.
            if isinstance(val, list):
                print(f"        {key}: {len(val)}")
                for item in val:
                    print(f"          - {json.dumps(item, ensure_ascii=False)}")
            elif isinstance(val, dict):
                print(f"        {key}: {len(val)}")
                for k, item in val.items():
                    print(f"          - {k}: {json.dumps(item, ensure_ascii=False)}")
            else:
                print(f"        {key}: {json.dumps(val, ensure_ascii=False)}")
    n_fail = sum(1 for v in verdicts if v.status == "FAIL")
    n_review = sum(1 for v in verdicts if v.status == "REVIEW")
    print(f"\n{len(verdicts)} gates | FAIL={n_fail} | REVIEW={n_review}")


def main() -> int:
    ap = argparse.ArgumentParser(
        prog="run.py", description="Spec-drift gates (G1-G7).",
        epilog="Modes: default check; --snapshot before archiving; "
               "--verify-archive after archiving.")
    ap.add_argument("change_id", nargs="?", help="change id under openspec/changes/")
    ap.add_argument("--base", default="main", help="base ref for the diff (default: main)")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    ap.add_argument("--snapshot", metavar="CHANGE_ID",
                    help="record requirement/@trace counts before archiving")
    ap.add_argument("--verify-archive", metavar="CHANGE_ID",
                    help="compare counts against a snapshot after archiving")
    ap.add_argument("--out", metavar="PATH",
                    help=f"snapshot output path (with --snapshot; default {SNAPSHOT_DIR}/<id>.json)")
    ap.add_argument("--snapshot-file", metavar="PATH",
                    help="snapshot input path (with --verify-archive)")
    ap.add_argument("--resolve-change", action="store_true",
                    help="print the change ids the diff against --base touches, one per line")
    args = ap.parse_args()

    if args.resolve_change:
        for cid in change_ids_from_diff(sh("git", "diff", "--name-only", f"{args.base}...HEAD")):
            print(cid)
        return 0

    if args.snapshot and args.verify_archive:
        # --snapshot takes a CHANGE_ID and was tested first, so this combination
        # silently ran snapshot mode against whatever path was supplied. The
        # published contract used to name --snapshot here; it means --snapshot-file.
        print("error: --snapshot and --verify-archive are separate modes; "
              "to supply a snapshot to --verify-archive use --snapshot-file",
              file=sys.stderr)
        return 2

    if args.snapshot:
        counts = spec_counts(affected_specs(args.snapshot))
        if not counts:
            print(f"error: no delta specs found for change '{args.snapshot}'", file=sys.stderr)
            return 2
        out = Path(args.out) if args.out else snapshot_path(args.snapshot)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(counts, indent=2), encoding="utf-8")
        print(f"snapshot written to {out} ({len(counts)} capabilities)")
        return 0

    if args.verify_archive:
        snap = Path(args.snapshot_file) if args.snapshot_file \
            else snapshot_path(args.verify_archive)
        if not snap.exists():
            print(f"error: snapshot not found at {snap}", file=sys.stderr)
            return 2
        snapshot = json.loads(snap.read_text(encoding="utf-8"))
        current = spec_counts({c: str(Path("openspec/specs") / c / "spec.md") for c in snapshot})
        v = gate_trace_parity(snapshot, current)
        print(f"{v.status:<7} {v.gate}")
        for row in v.detail["dropped"]:
            print(f"        {row['capability']}: {row['field']} "
                  f"{row['before']} -> {row['after']}")
        return exit_code_for([v])

    if not args.change_id:
        ap.print_help()
        return 2
    if not (Path("openspec/changes") / args.change_id).is_dir():
        print(f"error: no change directory at openspec/changes/{args.change_id}", file=sys.stderr)
        return 2
    if not sh("git", "rev-parse", "--git-dir", ok=(0, 128)).strip():
        print("error: not a git repository, or git is unavailable", file=sys.stderr)
        return 2

    verdicts = run_gates(args.change_id, args.base)
    _print(verdicts, args.json)
    return exit_code_for(verdicts)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except GateError as exc:
        # Exit 2 is "the gates could not be evaluated", distinct from exit 1
        # "a gate reported FAIL". A traceback here would read as a crash in the
        # gate rather than a broken environment.
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(2)
