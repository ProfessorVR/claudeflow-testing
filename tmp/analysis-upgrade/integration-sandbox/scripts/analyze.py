#!/usr/bin/env python3
"""End-to-end orchestrator: extract claims → resolve concepts → generate bridges
→ (optional) recompile index. Single entry point for both primary and
secondary texts under the new extractor schema.

Usage:
    python analyze.py --pdf PATH --genre [primary|secondary] \
         --author NAME --title TITLE --year YEAR --slug SLUG \
         --first-page N --last-page N [--skip-recompile]
"""
from __future__ import annotations
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
SCRIPTS = BASE / "scripts"
INDEX = BASE / "corpus" / "index"


def run(cmd: list[str], label: str) -> None:
    print(f"\n═══ {label} ═══")
    print("$ " + " ".join(cmd))
    t0 = time.time()
    r = subprocess.run(cmd, check=False)
    print(f"({time.time()-t0:.1f}s, rc={r.returncode})")
    if r.returncode != 0:
        print(f"[analyze] FAILED at {label}")
        sys.exit(r.returncode)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--pdf", required=True)
    p.add_argument("--genre", choices=["primary", "secondary"], required=True)
    p.add_argument("--author", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--year", required=True)
    p.add_argument("--slug", required=True)
    p.add_argument("--first-page", type=int, required=True)
    p.add_argument("--last-page", type=int, required=True)
    p.add_argument("--skip-recompile", action="store_true")
    p.add_argument("--skip-bridges", action="store_true")
    p.add_argument("--skip-verify", action="store_true")
    p.add_argument("--model", default="claude-sonnet-4-5")
    args = p.parse_args()

    paper_dir = INDEX / args.slug
    paper_dir.mkdir(parents=True, exist_ok=True)
    claims_path = paper_dir / f"{args.slug}-claims.jsonl"
    mentions_path = paper_dir / f"{args.slug}-concept-mentions.jsonl"
    bridges_path = paper_dir / f"{args.slug}-bridge-candidates.jsonl"

    # Stage 1: extract
    extract_cmd = [
        sys.executable, str(SCRIPTS / "extractor" / "extractor.py"),
        "--pdf", args.pdf,
        "--first-page", str(args.first_page),
        "--last-page", str(args.last_page),
        "--genre", args.genre,
        "--author", args.author,
        "--title", args.title,
        "--year", args.year,
        "--slug", args.slug,
        "--out", str(claims_path),
        "--model", args.model,
    ]
    if args.skip_verify:
        extract_cmd.append("--no-verify")
    run(extract_cmd, f"EXTRACT [{args.slug}]")

    # Stage 2: resolve concepts
    run([sys.executable, str(SCRIPTS / "resolve_concepts.py"),
         "--claims", str(claims_path), "--out", str(mentions_path)],
        f"RESOLVE [{args.slug}]")

    # Stage 3: generate bridges
    if not args.skip_bridges:
        run([sys.executable, str(SCRIPTS / "generate_bridges.py"),
             "--claims", str(claims_path),
             "--mentions", str(mentions_path),
             "--out", str(bridges_path)],
            f"BRIDGES [{args.slug}]")
    else:
        print("\n═══ BRIDGES [skipped] ═══")

    # Stage 4: recompile
    if not args.skip_recompile:
        run([sys.executable, str(SCRIPTS / "recompile_index.py")], "RECOMPILE")
    else:
        print("\n═══ RECOMPILE [skipped] ═══")

    # Summary
    counts = {
        "claims": sum(1 for _ in claims_path.read_text().splitlines() if _.strip()) if claims_path.exists() else 0,
        "mentions": sum(1 for _ in mentions_path.read_text().splitlines() if _.strip()) if mentions_path.exists() else 0,
        "bridges": sum(1 for _ in bridges_path.read_text().splitlines() if _.strip()) if bridges_path.exists() else 0,
    }
    print(f"\n═══ DONE [{args.slug}] ═══  {counts}")


if __name__ == "__main__":
    main()
