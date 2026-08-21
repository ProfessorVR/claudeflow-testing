#!/usr/bin/env python3
"""
normalize-edges.py — Normalize edges from any of the 7 analysis pipeline CSV
formats into a canonical CSV or JSONL format.

Canonical CSV schema:
    source,relation,target,domain,confidence,pipeline,units,note

JSONL schema (matches god-reason/reasoning.jsonl):
    {"id", "source", "relation", "target", "domain", "confidence", "pipeline", "units", "note"}

Usage:
    python scripts/normalize-edges.py --input phantasia-analysis/global-edges.csv --pipeline phantasia
    python scripts/normalize-edges.py --input <path> --pipeline <name> --output normalized.csv
    python scripts/normalize-edges.py --input <path> --to-jsonl
    python scripts/normalize-edges.py --all
    python scripts/normalize-edges.py --all --to-jsonl --output merged-edges.jsonl
"""

import argparse
import csv
import hashlib
import io
import json
import os
import sys
from pathlib import Path
from typing import Optional


# ---------------------------------------------------------------------------
# Known pipeline registry
# ---------------------------------------------------------------------------

KNOWN_PIPELINES: dict[str, str] = {
    "phantasia": "phantasia-analysis/global-edges.csv",
    "rickert": "corpus/index/Rickert - Ambient Rhetoric/rickert-analysis/global-edges.csv",
    "bt": "corpus/index/Heidegger - Being and Time/bt-analysis/global-edges.csv",
    "bcap": "corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/global-edges.csv",
    "uexkull": "corpus/index/Von Uexkull - A Foray into the Worlds of Animals and Humans/uex-analysis/global-edges.csv",
    "aristotle": "corpus/index/Aristotle - Complete Works/global-edges.csv",
}

# Auto-detection: substrings in the file path that identify a pipeline
PATH_HINTS: list[tuple[str, str]] = [
    ("phantasia-analysis", "phantasia"),
    ("rickert-analysis", "rickert"),
    ("Rickert - Ambient Rhetoric", "rickert"),
    ("bt-analysis", "bt"),
    ("Being and Time", "bt"),
    ("bcap-analysis", "bcap"),
    ("Basic Concepts of Aristotelian", "bcap"),
    ("uex-analysis", "uexkull"),
    ("Von Uexkull", "uexkull"),
    ("Aristotle - Complete Works", "aristotle"),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def detect_pipeline(filepath: str) -> Optional[str]:
    """Guess the pipeline name from the file path."""
    for substring, name in PATH_HINTS:
        if substring in filepath:
            return name
    return None


def edge_id(source: str, relation: str, target: str, pipeline: str) -> str:
    """Deterministic edge id (matches god-reason convention: edge_ + 12 hex)."""
    payload = f"{source}|{relation}|{target}|{pipeline}"
    digest = hashlib.sha256(payload.encode()).hexdigest()[:12]
    return f"edge_{digest}"


def resolve_confidence(row: dict) -> str:
    """Extract or infer confidence from a row."""
    raw = (row.get("confidence") or row.get("weight") or "").strip()
    if not raw:
        return "medium"
    # Aristotle uses numeric weights like 0.95 — map to high/medium/low
    try:
        val = float(raw)
        if val >= 0.8:
            return "high"
        elif val >= 0.5:
            return "medium"
        else:
            return "low"
    except ValueError:
        pass
    if raw.lower() in ("high", "medium", "low"):
        return raw.lower()
    return "medium"


def resolve_domain(row: dict) -> str:
    """Extract domain from whichever column name the pipeline uses."""
    return (row.get("domain") or row.get("edge_domain") or "").strip()


def resolve_units(row: dict) -> str:
    """Extract units, falling back to chapter/chapters/works."""
    raw = (
        row.get("units")
        or row.get("chapter")
        or row.get("chapters")
        or row.get("works")
        or ""
    )
    return raw.strip().strip('"')


def resolve_note(row: dict) -> str:
    """Extract note, falling back to evidence."""
    return (row.get("note") or row.get("evidence") or "").strip().strip('"')


# ---------------------------------------------------------------------------
# Core normalization
# ---------------------------------------------------------------------------

def normalize_row(row: dict, pipeline: str) -> dict:
    """Convert one raw CSV row into the canonical schema."""
    source = row.get("source", "").strip()
    target = row.get("target", "").strip()
    relation = row.get("relation", "").strip()
    domain = resolve_domain(row)
    confidence = resolve_confidence(row)
    units = resolve_units(row)
    note = resolve_note(row)

    return {
        "source": source,
        "relation": relation,
        "target": target,
        "domain": domain,
        "confidence": confidence,
        "pipeline": pipeline,
        "units": units,
        "note": note,
    }


def read_and_normalize(filepath: str, pipeline: str) -> list[dict]:
    """Read a CSV file and return a list of canonical rows."""
    rows: list[dict] = []
    with open(filepath, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for raw in reader:
            # Strip whitespace from keys (some CSVs have spaces after commas in header)
            cleaned = {k.strip(): v for k, v in raw.items() if k is not None}
            rows.append(normalize_row(cleaned, pipeline))
    return rows


# ---------------------------------------------------------------------------
# Output formatters
# ---------------------------------------------------------------------------

CANONICAL_FIELDS = ["source", "relation", "target", "domain", "confidence", "pipeline", "units", "note"]


def write_csv(rows: list[dict], out) -> None:
    """Write canonical CSV to a file-like object."""
    writer = csv.DictWriter(out, fieldnames=CANONICAL_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)


def write_jsonl(rows: list[dict], out) -> None:
    """Write JSONL (god-reason schema) to a file-like object."""
    for row in rows:
        entry = {
            "id": edge_id(row["source"], row["relation"], row["target"], row["pipeline"]),
            "source": row["source"],
            "relation": row["relation"],
            "target": row["target"],
            "domain": row["domain"],
            "confidence": row["confidence"],
            "pipeline": row["pipeline"],
            "units": row["units"],
        }
        if row.get("note"):
            entry["note"] = row["note"]
        out.write(json.dumps(entry, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def find_project_root() -> Path:
    """Walk up from this script to find the project root (where .git lives)."""
    p = Path(__file__).resolve().parent
    while p != p.parent:
        if (p / ".git").exists():
            return p
        p = p.parent
    # Fallback: assume script is in <root>/scripts/
    return Path(__file__).resolve().parent.parent


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize analysis pipeline edge CSVs into canonical format."
    )
    parser.add_argument("--input", "-i", help="Path to a single input CSV file.")
    parser.add_argument(
        "--pipeline", "-p",
        help="Pipeline name (phantasia, rickert, bt, bcap, uexkull, aristotle). Auto-detected if omitted.",
    )
    parser.add_argument("--output", "-o", help="Output file path (default: stdout).")
    parser.add_argument(
        "--all", action="store_true",
        help="Process all known pipeline CSVs and merge into a single output.",
    )
    parser.add_argument(
        "--to-jsonl", action="store_true",
        help="Output JSONL (god-reason schema) instead of CSV.",
    )
    parser.add_argument(
        "--stats", action="store_true",
        help="Print per-pipeline edge counts to stderr.",
    )

    args = parser.parse_args()

    if not args.input and not args.all:
        parser.error("Provide --input <csv_path> or --all to process every known pipeline.")

    root = find_project_root()
    all_rows: list[dict] = []
    stats: dict[str, int] = {}

    if args.all:
        for name, rel_path in KNOWN_PIPELINES.items():
            full = root / rel_path
            if not full.exists():
                print(f"[SKIP] {name}: {full} not found", file=sys.stderr)
                continue
            rows = read_and_normalize(str(full), name)
            stats[name] = len(rows)
            all_rows.extend(rows)
    else:
        filepath = args.input
        if not os.path.isabs(filepath):
            filepath = str(root / filepath)
        if not os.path.exists(filepath):
            parser.error(f"File not found: {filepath}")

        pipeline = args.pipeline or detect_pipeline(filepath)
        if not pipeline:
            parser.error(
                f"Cannot auto-detect pipeline for {filepath}. "
                "Use --pipeline <name> to specify."
            )

        rows = read_and_normalize(filepath, pipeline)
        stats[pipeline] = len(rows)
        all_rows.extend(rows)

    # Deduplicate by (source, relation, target, pipeline)
    seen: set[tuple[str, ...]] = set()
    deduped: list[dict] = []
    for row in all_rows:
        key = (row["source"], row["relation"], row["target"], row["pipeline"])
        if key not in seen:
            seen.add(key)
            deduped.append(row)

    dupes_removed = len(all_rows) - len(deduped)

    # Output
    if args.output:
        with open(args.output, "w", newline="", encoding="utf-8") as fh:
            if args.to_jsonl:
                write_jsonl(deduped, fh)
            else:
                write_csv(deduped, fh)
        print(f"Wrote {len(deduped)} edges to {args.output}", file=sys.stderr)
    else:
        out = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", newline="")
        if args.to_jsonl:
            write_jsonl(deduped, out)
        else:
            write_csv(deduped, out)
        out.flush()

    # Stats
    if args.stats or args.all:
        total = sum(stats.values())
        print(f"\n--- Edge normalization summary ---", file=sys.stderr)
        for name, count in sorted(stats.items()):
            print(f"  {name:12s}: {count:>4d} edges", file=sys.stderr)
        print(f"  {'total':12s}: {total:>4d} raw", file=sys.stderr)
        if dupes_removed > 0:
            print(f"  {'duplicates':12s}: {dupes_removed:>4d} removed", file=sys.stderr)
        print(f"  {'output':12s}: {len(deduped):>4d} canonical edges", file=sys.stderr)


if __name__ == "__main__":
    main()
