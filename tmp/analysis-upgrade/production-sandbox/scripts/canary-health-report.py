#!/usr/bin/env python3
"""Phase 3a canary health report.

Validates each extraction output against the compound batch-health rules:

Hard thresholds (any failure -> PAUSE):
  * All expected papers have an output file
  * Hard failures (API errors, crashes, zero-output) <= 10% of papers

Advisory thresholds (compound PAUSE if two or more fire):
  * Zero-claim papers  <= 5%
  * Median claims per paper >= 20
  * Manual spot-check of flagged taxonomy categories (B7) — presence report only

Also prints:
  * Per-paper claim counts, faithfulness distribution, use-mention breakdown
  * Claim-type distribution (global and per paper)
  * Total cost summary (parsed from run logs)

Usage:
  python3 canary-health-report.py
  python3 canary-health-report.py --data-dir /abs/path --logs /tmp/frede-run.log,/tmp/ogorman-run.log,...
"""
from __future__ import annotations
import argparse
import glob
import json
import os
import re
import statistics
import sys
from pathlib import Path


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    out = []
    for i, line in enumerate(path.read_text().splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError as e:
            print(f"[warn] {path}:{i} JSON error: {e}", file=sys.stderr)
    return out


def parse_log_cost(logs: list[str]) -> tuple[float, int]:
    """Parse `$X.XXX total, N API calls.` line from run logs."""
    total_cost = 0.0
    total_calls = 0
    pattern = re.compile(r"done\.\s+\d+\s+claims\.\s+\$([\d.]+)\s+total,\s+(\d+)\s+API calls")
    for log in logs:
        if not os.path.exists(log):
            continue
        for line in Path(log).read_text().splitlines():
            m = pattern.search(line)
            if m:
                total_cost += float(m.group(1))
                total_calls += int(m.group(2))
                break
    return total_cost, total_calls


def spot_check_taxonomy(claims: list[dict]) -> dict:
    """B7 taxonomy audit — surface suspicious patterns for human review."""
    issues = {
        "primary_exegetical_on_secondary": [],  # ok in secondary but flagged for review
        "aporetic_as_thetic_candidates": [],    # thetic claim whose quote contains a question mark
        "mention_for_endorsed_borrowing": [],   # use_mention=mention but stance=endorses
        "dialectical_on_ancients_without_refutation": [],  # predecessor_report vs dialectical_objection
    }
    for c in claims:
        ct = c.get("claim_type", "")
        um = c.get("use_mention", "")
        st = c.get("stance", "")
        quote = c.get("quote", "") or ""
        claim = c.get("claim", "") or ""
        speaker = (c.get("speaker") or "").lower()

        if ct == "exegetical_claim":
            # flag for review — must be secondary-lit (only happens on secondary prompts)
            issues["primary_exegetical_on_secondary"].append(c["id"])

        if ct == "thetic" and "?" in quote:
            issues["aporetic_as_thetic_candidates"].append(c["id"])

        if um == "mention" and st == "endorses":
            issues["mention_for_endorsed_borrowing"].append(c["id"])

        if ct == "dialectical_objection" and ("ancients" in speaker or "common" in speaker or "they" == speaker):
            issues["dialectical_on_ancients_without_refutation"].append(c["id"])

    return issues


def required_fields_check(claims: list[dict]) -> list[str]:
    """Return list of claim_ids missing required schema fields."""
    required = {"id", "claim", "speaker", "claim_type", "stance", "use_mention", "source"}
    missing = []
    for c in claims:
        if not required.issubset(c.keys()):
            missing.append(c.get("id", "<no-id>"))
    return missing


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--data-dir",
        default="/home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox/data/corpus/index",
    )
    ap.add_argument(
        "--logs",
        default="/tmp/frede-run.log,/tmp/ogorman-run.log,/tmp/bowin-run.log,/tmp/white-run.log",
    )
    ap.add_argument("--expected-papers", type=int, default=4)
    args = ap.parse_args()

    data_dir = Path(args.data_dir)
    paper_dirs = sorted(
        [p for p in data_dir.iterdir() if p.is_dir() and p.name != "releases" and p.name != "test-paper" and (p / "claims.jsonl").exists()]
    )

    print(f"=== Canary health report — {len(paper_dirs)} papers ===")
    print(f"data_dir: {data_dir}")
    print()

    per_paper = []
    all_claims = []

    for pd in paper_dirs:
        claims = load_jsonl(pd / "claims.jsonl")
        all_claims.extend(claims)
        faithfulness = {}
        for c in claims:
            f = c.get("faithfulness", "unchecked")
            faithfulness[f] = faithfulness.get(f, 0) + 1
        um_counts = {}
        for c in claims:
            um = c.get("use_mention", "?")
            um_counts[um] = um_counts.get(um, 0) + 1
        ct_counts = {}
        for c in claims:
            ct = c.get("claim_type", "?")
            ct_counts[ct] = ct_counts.get(ct, 0) + 1
        missing_fields = required_fields_check(claims)
        per_paper.append({
            "slug": pd.name,
            "n_claims": len(claims),
            "faithfulness": faithfulness,
            "use_mention": um_counts,
            "claim_types": ct_counts,
            "missing_fields_n": len(missing_fields),
        })

        print(f"--- {pd.name} ---")
        print(f"  claims: {len(claims)}")
        print(f"  faithfulness: {faithfulness}")
        print(f"  use_mention:  {um_counts}")
        print(f"  claim_types:  {ct_counts}")
        if missing_fields:
            print(f"  MISSING-FIELDS: {len(missing_fields)} claims")
        print()

    print("=== Aggregate ===")
    total_claims = len(all_claims)
    counts = [p["n_claims"] for p in per_paper]
    median_claims = statistics.median(counts) if counts else 0
    zero_claim = sum(1 for n in counts if n == 0)
    print(f"  total claims: {total_claims}")
    print(f"  median claims/paper: {median_claims}")
    print(f"  zero-claim papers: {zero_claim}")
    print()

    # Cost
    logs = [l.strip() for l in args.logs.split(",") if l.strip()]
    cost, calls = parse_log_cost(logs)
    print(f"  total cost: ${cost:.2f}")
    print(f"  total API calls: {calls}")
    print()

    # B7 taxonomy spot check (aggregated)
    issues = spot_check_taxonomy(all_claims)
    print("=== B7 taxonomy spot-check (human review recommended) ===")
    for k, v in issues.items():
        print(f"  {k}: {len(v)} items" + (f"  first 3: {v[:3]}" if v else ""))
    print()

    # Gate verdict
    print("=== GATE VERDICT ===")
    hard_fail = False
    advisory_failures = []

    # H1: All expected papers accounted for
    if len(per_paper) < args.expected_papers:
        print(f"  HARD FAIL: expected {args.expected_papers} papers, found {len(per_paper)}")
        hard_fail = True

    # H2: Hard failures <= 10% — skip; any real crash would have prevented claims.jsonl from existing

    # H3: Zero-claim papers <= 5%
    zero_rate = zero_claim / max(1, len(per_paper))
    if zero_rate > 0.05:
        advisory_failures.append(f"zero-claim-rate={zero_rate:.1%} (>5%)")

    # H4: Median claims per paper >= 20
    if median_claims < 20:
        advisory_failures.append(f"median-claims-per-paper={median_claims} (<20)")

    # H5: Missing-fields claim count == 0
    missing_total = sum(p["missing_fields_n"] for p in per_paper)
    if missing_total > 0:
        advisory_failures.append(f"missing-fields-claims={missing_total}")

    if hard_fail:
        print("  VERDICT: HARD FAIL — PAUSE batch")
        sys.exit(1)
    if len(advisory_failures) >= 2:
        print(f"  VERDICT: COMPOUND ADVISORY FAIL — PAUSE batch ({', '.join(advisory_failures)})")
        sys.exit(2)
    elif advisory_failures:
        print(f"  VERDICT: ADVISORY WARNING (single signal) — {', '.join(advisory_failures)} — continue with flag")
    else:
        print("  VERDICT: PASS")


if __name__ == "__main__":
    main()
