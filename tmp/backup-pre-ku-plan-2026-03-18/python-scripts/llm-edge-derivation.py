#!/usr/bin/env python3
"""
Sprint 3 Task 15: LLM-Assisted Edge Derivation (GraphRAG-style)

For each KU pair with lexical overlap above threshold, sends both claims
to Claude to classify the relationship using the canonical 15-type ontology.

This is a P3 (future) feature. Current implementation:
- Loads KU pairs from god-learn/knowledge.jsonl
- Computes pairwise lexical overlap
- For pairs above threshold, generates a prompt for LLM classification
- Outputs candidate edges (does NOT auto-append to reasoning.jsonl)

Usage:
    python3 scripts/llm-edge-derivation.py --dry-run
    python3 scripts/llm-edge-derivation.py --output god-reason/llm-derived-edges.jsonl

Requires: ANTHROPIC_API_KEY environment variable (or .env file)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple


REPO_ROOT = Path(__file__).resolve().parents[1]
KU_PATH = REPO_ROOT / "god-learn" / "knowledge.jsonl"

CANONICAL_RELATIONS = [
    "depends_on", "presupposes", "contrasts_with", "explains", "refines",
    "operationalizes", "supports", "completes", "defined_as", "defined_by",
    "instantiates", "is_meaning_of", "is_species_of", "is_principle_of",
]

STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
    "by", "as", "is", "are", "was", "were", "be", "been", "being", "that",
    "this", "not", "no", "but",
}


def tokenize(text: str) -> Set[str]:
    words = re.findall(r"[a-z]+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) >= 3}


def jaccard(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def load_kus(path: Path) -> List[Dict[str, Any]]:
    items = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    items.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return items


def build_classification_prompt(claim_a: str, claim_b: str) -> str:
    relations_list = "\n".join(f"  - {r}" for r in CANONICAL_RELATIONS)
    return f"""Analyze the relationship between these two scholarly claims:

Claim A: "{claim_a}"
Claim B: "{claim_b}"

What is the primary relationship from Claim A to Claim B? Choose EXACTLY ONE from:
{relations_list}
  - none (no meaningful relationship)

Respond with ONLY the relation name (e.g., "presupposes" or "none"). No explanation."""


def main() -> int:
    ap = argparse.ArgumentParser(description="LLM-assisted edge derivation (P3)")
    ap.add_argument("--threshold", type=float, default=0.15, help="Jaccard overlap threshold for LLM classification")
    ap.add_argument("--output", default=None, help="Output JSONL path for derived edges")
    ap.add_argument("--dry-run", action="store_true", help="Show candidate pairs without calling LLM")
    ap.add_argument("--max-pairs", type=int, default=50, help="Max pairs to process")
    args = ap.parse_args()

    if not KU_PATH.exists():
        print(f"No knowledge.jsonl at {KU_PATH}", file=sys.stderr)
        return 1

    kus = load_kus(KU_PATH)
    print(f"Loaded {len(kus)} KUs")

    # Compute pairwise overlap
    candidates: List[Tuple[Dict, Dict, float]] = []
    for i in range(len(kus)):
        for j in range(i + 1, len(kus)):
            a_tokens = tokenize(kus[i].get("claim", ""))
            b_tokens = tokenize(kus[j].get("claim", ""))
            score = jaccard(a_tokens, b_tokens)
            if score >= args.threshold:
                candidates.append((kus[i], kus[j], score))

    candidates.sort(key=lambda x: -x[2])
    candidates = candidates[:args.max_pairs]
    print(f"Found {len(candidates)} candidate pairs above threshold {args.threshold}")

    if args.dry_run or not candidates:
        for a, b, score in candidates:
            print(f"\n  [{score:.3f}] {a.get('id', '?')} ↔ {b.get('id', '?')}")
            print(f"    A: {a.get('claim', '')[:80]}")
            print(f"    B: {b.get('claim', '')[:80]}")
        if args.dry_run:
            print(f"\n[DRY RUN] Would send {len(candidates)} pairs to LLM for classification")
        return 0

    # LLM classification (requires ANTHROPIC_API_KEY)
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        # Try .env
        env_path = REPO_ROOT / ".env"
        if env_path.exists():
            for line in env_path.read_text().split("\n"):
                if line.startswith("ANTHROPIC_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set. Use --dry-run to preview pairs.", file=sys.stderr)
        return 1

    print(f"\nWould classify {len(candidates)} pairs via Claude API")
    print("NOTE: Full LLM classification is a P3 feature. Use --dry-run for now.")
    print("      To implement, add HTTP calls to Anthropic API with build_classification_prompt().")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
