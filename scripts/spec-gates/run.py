#!/usr/bin/env python3
"""Spec-drift gates — detect statements a change falsified without editing.

Every other gate in this repository (vitest, the VitePress build, playwright,
prose-audit) is closed over the artifacts a change *touched*. The defect class
that repeatedly survives multi-round review is the complement: prose and spec
sentences that were true, were not edited, and became false because the code
they describe changed. These checks cover that complement.

Three gates remain after the reduction (design.md, Implementation Contract):

- G1 claim-parity: the per-change gates.yaml is mandatory; its absence is the
  one thing G1 FAILs on. Declared phrases with unhedged hits are REVIEW.
- G2 invariance: REVIEW-only — "X is unchanged" claims naming a file the diff
  touched are listed for a human, never blocked on.
- G7 archive trace-parity: diff-based, aligned per requirement between the base
  ref and the working tree. A requirement on both sides that lost a @trace
  `source:` is FAIL; a requirement that vanishes from HEAD is REVIEW.

Verdicts are PASS / REVIEW / FAIL. Only FAIL affects the exit code — the review
tier exists because these checks legitimately surface hits a human must
adjudicate, and a gate that blocks on those is a gate people learn to bypass.

Usage:
    run.py <change-id> [--base REF] [--json]
    run.py --trace-parity-only [--base REF] [--json]
    run.py --resolve-change [--base REF]
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
# The repository-wide hedge_markers fallback. A module constant rather than an
# expression inside load_config so a test can point the lookup at a file it
# controls without editing the one this repository ships.
GLOBAL_CONFIG = Path(__file__).resolve().parent / "config.yaml"
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
    returned as an empty string. G1 asks where a declared phrase occurs, so a
    grep that errored read as "no occurrences" and the gate passed silently.
    Callers that have a benign non-zero code declare it in `ok`.
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

    `grep(phrase)` yields (path, line_no, text). This function never FAILs:
    deciding whether an occurrence is a claim at all needs a reader. The one G1
    FAIL — a missing per-change gates.yaml — is issued by `run_gates`, because
    it is about the declaration file, not about any phrase.
    """
    if not phrases:
        return Verdict("G1 claim-parity", "PASS",
                       {"note": "claim_phrases is an empty list — the author deliberately "
                                "declared that this change alters no claim's truth conditions"})
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
# A qualified claim names *which aspect* is unchanged — the convention
# CONTRIBUTE.md documents is a bold span placed after the file reference. The
# split is kept purely as an annotation in the detail: three audit rounds
# showed the bare/qualified distinction misfires in both directions, so it no
# longer decides anything, and neither shape blocks CI.
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

    `lines` is (artifact, line_no, text) — the artifact being the change
    document the line was read from. A hit reports both, under keys that must
    not be confused: `artifact` is where the claim is written, `names` is the
    changed file the claim asserts is unchanged. A line number alone does not
    locate anything, because every change ships at least a proposal.md and a
    design.md and the caller numbers each from 1; a report of `line: 47` sent
    the reader to compare quoted text against two files to learn which to open.

    REVIEW-only: any hit — bare or qualified — is listed for a human, and no
    input makes this gate FAIL.

    A reference resolves to a changed file only when it is that path or a
    path-boundary suffix of it. Matching on basename alone made a true claim
    about `scripts/prose-audit/run.py` answer for `scripts/spec-gates/run.py`
    -- and reported the wrong file as the cause.
    """
    bare, qualified = [], []
    changed = set(changed_files)
    # A claim may name its files on the lines that follow it -- "下列檔案不變:"
    # then a bulleted list. Requiring the keyword and the reference on one line
    # let the most natural way of writing the claim through untouched.
    #
    # The reach opens only for a *lead-in*: a line ending in a colon, whose list
    # follows at a deeper indent. An unconditional window carried the claim onto
    # sibling bullets, and a bullet merely discussing the word 不變 then flagged
    # the next bullet that named a changed file.
    #
    # An artifact boundary closes the reach unconditionally: a proposal.md whose
    # last line is a lead-in has no list under it, and the first bullet of the
    # design.md that follows in the concatenated input is not that list.
    lead_indent, cur_artifact = None, None
    for artifact, line_no, text in lines:
        if artifact != cur_artifact:
            cur_artifact, lead_indent = artifact, None
        has_kw = bool(_INVARIANCE.search(text))
        indent = len(text) - len(text.lstrip())
        if lead_indent is not None:
            if not text.strip() or indent <= lead_indent:
                lead_indent = None
            elif not has_kw:
                has_kw = True  # inherited from the lead-in
        if has_kw and re.search(r"[:：]\s*$", text):
            lead_indent = indent
        if not has_kw:
            continue
        for ref, end in _references(text):
            hit = next((f for f in sorted(changed)
                        if f == ref or f.endswith("/" + ref)), None)
            if not hit:
                continue
            row = {"artifact": artifact, "line": line_no, "names": hit,
                   "text": text.strip()[:160]}
            marker = _QUALIFIED.search(text, end)
            (qualified if marker else bare).append(row)
            break
    return Verdict("G2 invariance", "REVIEW" if (bare or qualified) else "PASS",
                   {"bare": bare, "qualified": qualified})


# ── G7 archive trace-parity ──────────────────────────────────────────────────

def gate_trace_parity(base, head) -> Verdict:
    """Diff-based, aligned per requirement. `base` and `head` are shaped
    {capability: {requirement_title: {trace identity, ...}}}, where an identity
    is a @trace block's `source:` value (see `_spec_traces`).

    `spectra archive` replaces each MODIFIED requirement block wholesale, which
    discards the @trace metadata attached to it when the delta does not carry
    it. That is the FAIL shape: a requirement present on both sides that no
    longer carries a source it carried at base — losing four of five sources is
    metadata loss just as surely as losing the last one. A requirement that
    vanishes from HEAD entirely is REVIEW — a legitimate `## REMOVED` is visible
    in the same PR's delta, so a human adjudicates. Additions are not hits:
    whole-file counting would flag a deliberate requirement removal as loss.

    Comparing source sets rather than block counts is what keeps a legitimate
    consolidation out of the REVIEW list: two blocks naming the same source,
    rewritten as one block listing both code paths, drops the count from two to
    one while losing nothing a reader could name. The report names the sources
    that disappeared, which tells the author which trace to restore — a pair of
    numbers only told them that one had.

    Nothing here FAILs, and that is the load-bearing decision. Two identities
    were tried against the same 60 archive commits in this repository: source
    sets flagged 4 commits / 7 requirements, block counts flagged 1 commit / 3
    requirements, and *the two hit sets do not intersect at all* — each is a
    false negative on the other's positive class. Whether those 7 are false
    positives depends entirely on which definition of "lost" the reader brought:
    under "the requirement kept its count", all 7 are noise; under "the
    requirement stopped naming a `code:` path that still exists at HEAD", all 7
    are real. `@trace` and its `source:` field carry no normative definition
    anywhere in openspec/specs, and `spectra archive` — which produces them — is
    a closed binary. A blocking verdict has to be adjudicable, and this one is
    not adjudicable until somebody writes the definition down. Until then G7
    reports what it sees and a human decides. See design.md, 決策六.
    """
    dropped, vanished = [], []
    for cap in sorted(base):
        head_reqs = head.get(cap) or {}
        for req in sorted(base[cap]):
            before = base[cap][req]
            if req not in head_reqs:
                vanished.append({"capability": cap, "requirement": req,
                                 "base_traces": len(before),
                                 "base_sources": sorted(before)})
                continue
            lost = before - head_reqs[req]
            if lost:
                dropped.append({"capability": cap, "requirement": req,
                                "lost_sources": sorted(lost),
                                "before": len(before),
                                "after": len(head_reqs[req])})
    status = "REVIEW" if (dropped or vanished) else "PASS"
    return Verdict("G7 archive trace-parity", status,
                   {"dropped": dropped, "vanished": vanished})


def exit_code_for(verdicts) -> int:
    return 1 if any(v.status == "FAIL" for v in verdicts) else 0


# ── Repository adapters ──────────────────────────────────────────────────────

def _load_yaml(path: Path):
    """yaml.safe_load(path), with a parse failure surfaced as GateError.

    A malformed config is "the gates could not be evaluated" (exit 2), not a
    crash: a bare yaml.YAMLError escapes main() as a traceback whose exit code
    reads like a gate FAIL.
    """
    import yaml
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        raise GateError(f"cannot parse {path}: {exc}") from exc


def _require_list(value, key: str, source) -> list:
    """`value` as a list, where None means "the key was left empty".

    A scalar in either key is silent sabotage, not a working config: a string
    hedge marker iterates character by character ('u' is in almost every line,
    so G1's uncovered list goes permanently empty), and a string claim phrase
    greps the repository once per character. Refuse loudly, naming the key and
    the actual type, rather than evaluate a gate the author did not write.

    The None-means-empty reading holds for `hedge_markers` only. `load_config`
    intercepts a None `claim_phrases` before it reaches here — see the
    asymmetry argued there.
    """
    if value is None:
        return []
    if not isinstance(value, list):
        raise GateError(
            f"{source}: `{key}` must be a list, got {type(value).__name__} "
            f"({value!r})")
    return value


def _require_mapping(path: Path):
    """The YAML at `path` as a dict, where an empty file is an empty mapping.

    A config file that parses into a list or a scalar is valid YAML, so
    `_load_yaml` lets it through, and `.get()` on it raises AttributeError —
    an uncaught traceback whose exit code 1 reads like a gate FAIL. Same
    reasoning as `_load_yaml`'s: a file that cannot be used is "the gates could
    not be evaluated", which is exit 2.
    """
    data = _load_yaml(path)
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise GateError(
            f"{path}: must be a YAML mapping of keys to values, got "
            f"{type(data).__name__}")
    return data


def load_config(change_dir):
    """The per-change gates.yaml as a dict, or None when the declaration is absent.

    Absence is a signal, not a fallback. The old silent fallback to the global
    config made "the author forgot to consider claim_phrases" indistinguishable
    from "the author considered it and deliberately declared none", so the
    caller turns None into a G1 FAIL. The same signal covers a file that exists
    but carries no `claim_phrases` key — a zero-byte gates.yaml declares
    nothing, and reporting it as "deliberately declared none" would put words
    in the author's mouth. `claim_phrases` comes from the per-change file alone
    (an empty list is a deliberate declaration); `hedge_markers` may fall back
    to the global `scripts/spec-gates/config.yaml`, then to the built-in
    default.

    A `claim_phrases:` key with nothing after it is YAML null, and it is the
    same absent declaration: the author typed a heading and stopped. Reading it
    as `[]` would report the deliberate-declaration PASS over an unfinished
    line — and it is *fewer* characters than the compliant `claim_phrases: []`,
    so it is exactly the shape a hurried author lands on. `hedge_markers:` left
    empty keeps its existing meaning, an empty list. The asymmetry is
    deliberate: for hedge_markers the presence of the key is the declaration and
    an empty value is the strictest setting available (nothing counts as a
    hedge), so falling back there would hand the strictest author the loosest
    config; for claim_phrases the value *is* the declaration, so an empty value
    declares nothing.
    """
    per_change = Path(change_dir) / "gates.yaml"
    if not per_change.exists():
        return None
    data = _load_yaml(per_change)
    if data is None:
        data = {}
    if not isinstance(data, dict) or data.get("claim_phrases") is None:
        return None
    phrases = _require_list(data["claim_phrases"], "claim_phrases", per_change)
    # Presence of the key decides, not truthiness: `hedge_markers: []` is a
    # deliberate tightening — no wording counts as hedged — and a falsy-based
    # fallback silently handed exactly that author the loosest setting. Only
    # an absent key falls back to the global config, then to the built-in
    # default (the global file documents its own empty list as "use defaults").
    if "hedge_markers" in data:
        hedges = _require_list(data["hedge_markers"], "hedge_markers", per_change)
    else:
        hedges = []
        if GLOBAL_CONFIG.exists():
            hedges = _require_list(
                _require_mapping(GLOBAL_CONFIG).get("hedge_markers"),
                "hedge_markers", GLOBAL_CONFIG)
        if not hedges:
            hedges = DEFAULT_HEDGES
    return {"claim_phrases": phrases, "hedge_markers": hedges}


def changed_files_from(diff_names: str, status_z: str) -> set:
    """Union of the committed diff and the working tree.

    Untracked entries count: G2 must see a file the working tree adds or edits
    even before it is committed. `git status --porcelain` already omits ignored
    paths, so scratch files that are gitignored do not leak in.

    `status_z` is the raw `git status --porcelain -z -uall` output: NUL-
    delimited and never quoted, so paths containing spaces or non-ASCII arrive
    intact — the old `line.split()[-1]` mangled both. A renamed or copied
    entry is two NUL-separated fields (target path first, then origin); both
    are files the change touched.
    """
    out = set(diff_names.split())
    tokens = iter(status_z.split("\0"))
    for entry in tokens:
        # Porcelain v1: two status characters, a space, then the path.
        if len(entry) < 4:
            continue
        out.add(entry[3:])
        if entry[0] in "RC":
            out.add(next(tokens, ""))
    # `git status --porcelain` collapses an untracked directory into one entry
    # ending in "/". Callers pass -uall so this should not arise, but a bare
    # directory must never reach the file set: its basename is "", and "" is a
    # substring of every line, which made G2 match claims it had no business
    # matching. The truthiness test drops the empty string a truncated rename
    # record would contribute.
    return {f for f in out
            if f and f != "skills-lock.json" and not f.endswith("/")}


def changed_files(base: str) -> set:
    return changed_files_from(
        sh("git", "diff", "--name-only", f"{base}...HEAD"),
        sh("git", "status", "--porcelain", "-z", "-uall"),
    )


def grep_phrase(phrase: str, skip_path: str):
    # `-e` pins the phrase to the pattern slot: an author-controlled phrase
    # beginning with `-` would otherwise be parsed as a git option, and real
    # options (`--cached`, `--no-index`, `--open-files-in-pager=<cmd>`) make
    # git exit 0 — which ok=(0, 1) accepts as a clean "no match".
    rows = []
    for hit in sh("git", "grep", "-n", "-i", "-F", "-e", phrase,
                  "--", EXCLUDE_ARCHIVE, ok=(0, 1)).splitlines():
        parts = hit.split(":", 2)
        if len(parts) != 3:
            continue
        # Only the exact path is the change's own task list: a startswith()
        # on the raw hit line also swallowed tasks.md.bak and tasks.md.orig.
        if parts[0] == skip_path:
            continue
        try:
            rows.append((parts[0], int(parts[1]), parts[2]))
        except ValueError:
            # An unparseable line is reported rather than dropped.
            rows.append((parts[0], 0, parts[2]))
    return rows


def _spec_traces(text: str) -> dict:
    """{requirement_title: {trace identity, ...}} for one baseline spec file.

    A `### Requirement:` heading opens a requirement; each `<!-- @trace ... -->`
    block under it contributes one identity. A trace block before the first
    requirement belongs to no requirement and is not counted.

    The identity is the block's `source:` value — the change id that wrote the
    trace — and not the block's position, because a count of blocks is not a
    measure of the information a requirement carries. Two blocks naming the same
    source, rewritten as one block listing both code paths, lose nothing; a
    count reports that as loss. All 215 trace blocks in this repository carry a
    `source:` line, and the format documented in
    openspec/specs/ci-quality-gates/spec.md requires one.

    A block with no `source:` is still counted, under the synthetic identity
    `#n` where n numbers the source-less blocks within that requirement.
    Dropping such a block silently would make an unlabelled trace free to
    delete. Numbering them among themselves rather than by block position keeps
    the identity stable when a sourced block is inserted above one.

    The price of set semantics, accepted deliberately: two blocks in one
    requirement that name the *same* source collapse to one identity, so
    deleting one of them is not reported. That is the same equivalence that
    makes a legitimate consolidation pass, and it cannot be had one way only.
    """
    out, cur, anon = {}, None, 0
    source, in_block = None, False

    def close() -> None:
        nonlocal anon, source, in_block
        in_block = False
        if source:
            out[cur].add(source)
        else:
            anon += 1
            out[cur].add(f"#{anon}")
        source = None

    for line in text.splitlines():
        if not in_block:
            if line.startswith("### Requirement:"):
                cur = line.split(":", 1)[1].strip()
                out.setdefault(cur, set())
                anon = 0
                continue
            at = line.find("<!-- @trace")
            if at < 0 or cur is None:
                continue
            in_block = True
            rest = line[at + len("<!-- @trace"):]
        else:
            rest = line
        stripped = rest.strip()
        if source is None and stripped.startswith("source:"):
            source = stripped.split(":", 1)[1].strip()
        # A block left unterminated at EOF is closed below rather than dropped.
        if "-->" in rest:
            close()
    if in_block:
        close()
    return out


def spec_traces_at(ref: str) -> dict:
    """{capability: {requirement_title: {trace identity, ...}}} for every
    `openspec/specs/<cap>/spec.md` as committed at `ref`.

    Enumerated with `git ls-tree` so only files that exist at the ref are read
    — `git show` on a path the listing produced cannot miss. core.quotePath is
    forced off: under its default, a non-ASCII capability directory comes back
    C-quoted ("openspec/specs/\\346\\226\\207/spec.md"), the parts check
    misses, and the capability silently never enters the base map — this repo
    writes in Traditional Chinese, so CJK capability names are expected.
    """
    out = {}
    for path in sh("git", "-c", "core.quotePath=false", "ls-tree", "-r",
                   "--name-only", ref, "--", "openspec/specs").splitlines():
        parts = path.split("/")
        if len(parts) == 4 and parts[3] == "spec.md":
            out[parts[2]] = _spec_traces(sh("git", "show", f"{ref}:{path}"))
    return out


def spec_traces_worktree() -> dict:
    """The same shape read from the working tree — HEAD plus uncommitted edits,
    because the gate must judge what the PR will actually merge."""
    out = {}
    root = Path("openspec/specs")
    if root.is_dir():
        for spec in sorted(root.glob("*/spec.md")):
            out[spec.parent.name] = _spec_traces(spec.read_text(encoding="utf-8"))
    return out


# ── Change-id resolution (--resolve-change) ──────────────────────────────────

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


# ── run_gates(): assembly ────────────────────────────────────────────────────

def run_gates(change_id: str, base: str):
    """The three reduced gates, in order: G1, G2, G7."""
    # A change id is a directory name, never a path: a separator, or a `..`
    # standing alone, would make `Path("openspec/changes") / change_id` read
    # files outside the changes directory. Refused before anything touches the
    # filesystem or git.
    #
    # The test is on path segments, not on substrings. `".." in change_id`
    # also refused `v1..v2` — an ordinary directory name with no separator in
    # it, which `Path` concatenation cannot make escape anything, whatever its
    # dots. Since a separator is refused outright, the id is a single segment
    # and only that segment can be `..`. `.` is refused with it: it resolves to
    # the changes directory itself, which is not a change, and no directory can
    # be named that.
    if (not change_id or "/" in change_id or os.sep in change_id
            or change_id in ("..", ".")):
        raise GateError(
            f"invalid change id {change_id!r}: must be a bare directory name "
            "under openspec/changes/ (no separator, and not '.' or '..')")
    change_dir = Path("openspec/changes") / change_id
    cfg = load_config(change_dir)
    skip = f"{change_dir}/tasks.md"
    diff = changed_files(base)

    if cfg is None:
        # load_config signals both causes as None; the fix differs, so the
        # detail names which one this is: create the file, or add the key.
        gates_file = change_dir / "gates.yaml"
        if gates_file.exists():
            g1 = Verdict("G1 claim-parity", "FAIL", {
                "file": str(gates_file),
                "missing_key": "claim_phrases",
                "note": "gates.yaml exists but declares no claim_phrases — the "
                        "key is absent, or present with nothing after it (a bare "
                        "`claim_phrases:` is YAML null, not an empty list); write "
                        "`claim_phrases: []` to declare that this change alters "
                        "no claim's truth conditions"})
        else:
            g1 = Verdict("G1 claim-parity", "FAIL", {
                "missing": str(gates_file),
                "note": "the per-change gates.yaml is mandatory; "
                        "declare `claim_phrases: []` to state that none apply"})
    else:
        g1 = gate_claim_parity(cfg["claim_phrases"], cfg["hedge_markers"],
                               lambda p: grep_phrase(p, skip))

    # Each artifact is numbered from its own line 1, so the file has to travel
    # with the number: the two are one coordinate, and G2 reports both.
    lines = []
    for art in ("proposal.md", "design.md"):
        p = change_dir / art
        if p.exists():
            lines += [(str(p), n, text) for n, text
                      in enumerate(p.read_text(encoding="utf-8").splitlines(), 1)]

    return [g1,
            gate_invariance(lines, diff),
            gate_trace_parity(spec_traces_at(base), spec_traces_worktree())]


# ── Output & CLI ─────────────────────────────────────────────────────────────

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
        prog="run.py",
        description="Spec-drift gates: G1 claim-parity, G2 invariance, "
                    "G7 archive trace-parity.",
        epilog="Three invocations: `run.py <change-id>` runs the three gates for "
               "one change against --base; `run.py --trace-parity-only` runs G7 "
               "alone, which needs no change id; `run.py --resolve-change` prints "
               "the change ids the diff against --base touches, one per line.")
    ap.add_argument("change_id", nargs="?", help="change id under openspec/changes/")
    ap.add_argument("--base", default="main", help="base ref for the diff (default: main)")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    ap.add_argument("--trace-parity-only", action="store_true",
                    help="run G7 alone against --base; takes no change id")
    ap.add_argument("--resolve-change", action="store_true",
                    help="print the change ids the diff against --base touches, one per line")
    args = ap.parse_args()

    if args.resolve_change:
        for cid in change_ids_from_diff(sh("git", "diff", "--name-only", f"{args.base}...HEAD")):
            print(cid)
        return 0

    if args.trace_parity_only:
        # G7 compares every capability spec between two refs, so it is the one
        # gate that needs no change id — and the one CI must run on every pull
        # request. A PR that edits openspec/specs/ without touching
        # openspec/changes/ resolves no id at all, and neither does an archive
        # PR: git records the directory move as a rename, so the pre-archive
        # path never appears in `--name-only`. Without this mode the only way
        # to reach G7 in those runs is to fabricate a change directory, which
        # makes CI's verdict depend on how G1 and G2 treat a directory nobody
        # wrote.
        if args.change_id:
            print("error: --trace-parity-only takes no change id; it compares "
                  "every capability spec between --base and HEAD",
                  file=sys.stderr)
            return 2
        if not sh("git", "rev-parse", "--git-dir", ok=(0, 128)).strip():
            print("error: not a git repository, or git is unavailable", file=sys.stderr)
            return 2
        verdicts = [gate_trace_parity(spec_traces_at(args.base), spec_traces_worktree())]
        _print(verdicts, args.json)
        return exit_code_for(verdicts)

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
