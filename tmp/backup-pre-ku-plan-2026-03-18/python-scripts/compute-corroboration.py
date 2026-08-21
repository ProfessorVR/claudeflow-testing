#!/usr/bin/env python3
"""
Compute corroboration scores for reasoning edges.

For each unique (source, relation, target) triple, counts how many distinct
pipelines independently produced that edge. Adds a corroboration_score field:
  - 1 pipeline  -> 1.0 (baseline)
  - 2 pipelines -> 1.5 (corroborated)
  - 3+ pipelines -> 2.0 (strongly corroborated)

Matching rules:
  - source/target normalized to lowercase
  - relation matched exactly
  - Only distinct pipelines count
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

REASONING_FILE = Path(__file__).resolve().parent.parent / "god-reason" / "reasoning.jsonl"


def make_triple_key(edge: dict) -> tuple[str, str, str]:
    """Normalize source/target to lowercase, keep relation exact."""
    return (
        edge["source"].strip().lower(),
        edge["relation"].strip(),
        edge["target"].strip().lower(),
    )


def compute_corroboration_score(pipeline_count: int) -> float:
    if pipeline_count >= 3:
        return 2.0
    elif pipeline_count == 2:
        return 1.5
    else:
        return 1.0


def main():
    # --- Read all edges ---
    edges: list[dict] = []
    with open(REASONING_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            edges.append(json.loads(line))

    total = len(edges)
    print(f"Read {total} edges from {REASONING_FILE}")

    # --- Build triple -> set of pipelines ---
    triple_pipelines: dict[tuple[str, str, str], set[str]] = defaultdict(set)
    for edge in edges:
        key = make_triple_key(edge)
        pipeline = edge.get("pipeline", "unknown")
        triple_pipelines[key].add(pipeline)

    # --- Assign corroboration scores ---
    for edge in edges:
        key = make_triple_key(edge)
        pipeline_count = len(triple_pipelines[key])
        edge["corroboration_score"] = compute_corroboration_score(pipeline_count)

    # --- Write back (preserve order, one JSON object per line) ---
    with open(REASONING_FILE, "w", encoding="utf-8") as f:
        for edge in edges:
            f.write(json.dumps(edge, ensure_ascii=False) + "\n")

    # --- Summary ---
    unique_triples = len(triple_pipelines)
    corroborated = sum(1 for ps in triple_pipelines.values() if len(ps) >= 2)
    strongly = sum(1 for ps in triple_pipelines.values() if len(ps) >= 3)

    corroborated_edges = sum(1 for e in edges if e["corroboration_score"] >= 1.5)
    strongly_edges = sum(1 for e in edges if e["corroboration_score"] >= 2.0)

    print(f"\n--- Corroboration Summary ---")
    print(f"Total edges:              {total}")
    print(f"Unique triples:           {unique_triples}")
    print(f"Corroborated (2+ pipes):  {corroborated} triples / {corroborated_edges} edges")
    print(f"Strongly corr. (3+ pipes):{strongly} triples / {strongly_edges} edges")
    print(f"\nAll edges updated with corroboration_score field.")

    # --- Top corroborated triples ---
    top = sorted(triple_pipelines.items(), key=lambda x: len(x[1]), reverse=True)
    print(f"\n--- Top 15 Most Corroborated Triples ---")
    for (src, rel, tgt), pipes in top[:15]:
        print(f"  [{len(pipes)} pipes] {src} --{rel}--> {tgt}  ({', '.join(sorted(pipes))})")


if __name__ == "__main__":
    main()
