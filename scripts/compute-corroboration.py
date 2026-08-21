#!/usr/bin/env python3
"""
Compute corroboration scores for reasoning edges.

For each unique (source, relation, target) triple, counts how many distinct
pipelines independently produced that edge. Adds a corroboration_score field:

Exact matching:
  - 1 pipeline  -> 1.0 (baseline)
  - 2 pipelines -> 1.5 (corroborated)
  - 3+ pipelines -> 2.0 (strongly corroborated)

Fuzzy matching (near-misses like "phantasia" vs "phantasia (I9)"):
  - 2 pipelines -> 1.3 (fuzzy corroborated)
  - 3+ pipelines -> 1.8 (fuzzy strongly corroborated)

The higher score wins when an edge has both exact and fuzzy matches.
Each edge gets a corroboration_method field: "exact", "fuzzy", or "none".

Matching rules:
  - source/target normalized to lowercase
  - relation matched exactly
  - Only distinct pipelines count
"""

import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

REASONING_FILE = Path(__file__).resolve().parent.parent / "god-reason" / "reasoning.jsonl"


def normalize_concept(name: str) -> str:
    """Normalize a concept name for fuzzy matching.

    Strips parenthetical qualifiers, lowercases, removes diacritics,
    replaces hyphens/underscores with spaces, and collapses whitespace.
    """
    # Strip parenthetical qualifiers: "phantasia (I9)" -> "phantasia"
    name = re.sub(r"\s*\([^)]*\)", "", name)
    # Lowercase
    name = name.lower()
    # Strip diacritics: decompose then drop combining marks
    name = unicodedata.normalize("NFD", name)
    name = "".join(ch for ch in name if unicodedata.category(ch) != "Mn")
    # Replace hyphens/underscores with spaces
    name = re.sub(r"[-_]", " ", name)
    # Collapse multiple spaces and strip
    name = re.sub(r"\s+", " ", name).strip()
    return name


def make_triple_key(edge: dict) -> tuple[str, str, str] | None:
    """Normalize source/target to lowercase, keep relation exact.
    Returns None for edges without source/target (e.g., Phase 7 auto-derived)."""
    source = edge.get("source", "").strip().lower()
    target = edge.get("target", "").strip().lower()
    relation = edge.get("relation", "").strip()
    if not source or not target or not relation:
        return None
    return (source, relation, target)


def fuzzy_triple_key(edge: dict) -> tuple[str, str, str] | None:
    """Apply normalize_concept() to source and target; relation stays exact.
    Returns None for edges without source/target."""
    source = edge.get("source", "").strip()
    target = edge.get("target", "").strip()
    relation = edge.get("relation", "").strip()
    if not source or not target or not relation:
        return None
    return (normalize_concept(source), relation, normalize_concept(target))


def compute_corroboration_score(pipeline_count: int) -> float:
    if pipeline_count >= 3:
        return 2.0
    elif pipeline_count == 2:
        return 1.5
    else:
        return 1.0


def compute_fuzzy_corroboration_score(pipeline_count: int) -> float:
    if pipeline_count >= 3:
        return 1.8
    elif pipeline_count == 2:
        return 1.3
    else:
        return 1.0


def _fuzzy_from_exact(exact_key: tuple[str, str, str]) -> tuple[str, str, str]:
    """Convert an exact triple key to its fuzzy equivalent."""
    src, rel, tgt = exact_key
    return (normalize_concept(src), rel, normalize_concept(tgt))


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

    # --- Build exact triple -> set of pipelines ---
    exact_pipelines: dict[tuple[str, str, str], set[str]] = defaultdict(set)
    for edge in edges:
        key = make_triple_key(edge)
        if key is None:
            continue
        pipeline = edge.get("pipeline", "unknown")
        exact_pipelines[key].add(pipeline)

    # --- Build fuzzy triple -> set of pipelines ---
    fuzzy_pipelines: dict[tuple[str, str, str], set[str]] = defaultdict(set)
    for edge in edges:
        key = fuzzy_triple_key(edge)
        if key is None:
            continue
        pipeline = edge.get("pipeline", "unknown")
        fuzzy_pipelines[key].add(pipeline)

    # --- Track which exact keys are already corroborated ---
    exact_corroborated_keys: set[tuple[str, str, str]] = {
        k for k, ps in exact_pipelines.items() if len(ps) >= 2
    }

    # --- Assign corroboration scores (higher wins) ---
    for edge in edges:
        exact_key = make_triple_key(edge)
        fuzzy_key = fuzzy_triple_key(edge)

        exact_count = len(exact_pipelines[exact_key]) if exact_key else 0
        fuzzy_count = len(fuzzy_pipelines[fuzzy_key]) if fuzzy_key else 0

        exact_score = compute_corroboration_score(exact_count)
        fuzzy_score = compute_fuzzy_corroboration_score(fuzzy_count)

        if exact_score >= fuzzy_score:
            edge["corroboration_score"] = exact_score
            if exact_count >= 2:
                edge["corroboration_method"] = "exact"
            else:
                edge["corroboration_method"] = "none"
        else:
            edge["corroboration_score"] = fuzzy_score
            edge["corroboration_method"] = "fuzzy"

    # --- Write back (preserve order, one JSON object per line) ---
    with open(REASONING_FILE, "w", encoding="utf-8") as f:
        for edge in edges:
            f.write(json.dumps(edge, ensure_ascii=False) + "\n")

    # --- Summary ---
    unique_exact = len(exact_pipelines)
    unique_fuzzy = len(fuzzy_pipelines)
    exact_corr = sum(1 for ps in exact_pipelines.values() if len(ps) >= 2)
    exact_strong = sum(1 for ps in exact_pipelines.values() if len(ps) >= 3)
    fuzzy_corr = sum(1 for ps in fuzzy_pipelines.values() if len(ps) >= 2)
    fuzzy_strong = sum(1 for ps in fuzzy_pipelines.values() if len(ps) >= 3)

    # Fuzzy-only: corroborated via fuzzy but NOT via exact
    # Build mapping from fuzzy key to exact keys that map to it
    fuzzy_only_corr = 0
    fuzzy_only_strong = 0
    for fk, fps in fuzzy_pipelines.items():
        if len(fps) >= 2:
            # Check if ALL exact keys mapping to this fuzzy key are single-pipeline
            # i.e., none of the exact keys under this fuzzy key are themselves corroborated
            exact_keys_for_fuzzy = [
                ek for ek in exact_pipelines if _fuzzy_from_exact(ek) == fk
            ]
            any_exact_corr = any(
                len(exact_pipelines[ek]) >= 2 for ek in exact_keys_for_fuzzy
            )
            if not any_exact_corr:
                fuzzy_only_corr += 1
                if len(fps) >= 3:
                    fuzzy_only_strong += 1

    exact_corr_edges = sum(1 for e in edges if e.get("corroboration_method") == "exact")
    fuzzy_corr_edges = sum(1 for e in edges if e.get("corroboration_method") == "fuzzy")

    print(f"\n--- Corroboration Summary ---")
    print(f"Total edges:                  {total}")
    print(f"Unique exact triples:         {unique_exact}")
    print(f"Unique fuzzy triples:         {unique_fuzzy}")
    print(f"Exact corroborated (2+ pipes):  {exact_corr} triples / {exact_corr_edges} edges")
    print(f"Exact strongly corr. (3+):      {exact_strong} triples")
    print(f"Fuzzy-only corroborated (2+):   {fuzzy_only_corr} triples / {fuzzy_corr_edges} edges")
    print(f"Fuzzy-only strongly corr. (3+): {fuzzy_only_strong} triples")
    print(f"\nAll edges updated with corroboration_score and corroboration_method fields.")

    # --- Top exact corroborated triples ---
    top_exact = sorted(exact_pipelines.items(), key=lambda x: len(x[1]), reverse=True)
    print(f"\n--- Top 15 Most Corroborated Triples (Exact) ---")
    for (src, rel, tgt), pipes in top_exact[:15]:
        if len(pipes) < 2:
            break
        print(f"  [{len(pipes)} pipes] {src} --{rel}--> {tgt}  ({', '.join(sorted(pipes))})")

    # --- Top fuzzy-only corroborated triples ---
    top_fuzzy = sorted(fuzzy_pipelines.items(), key=lambda x: len(x[1]), reverse=True)
    print(f"\n--- Top 15 Fuzzy-Only Corroborated Triples ---")
    shown = 0
    for (src, rel, tgt), pipes in top_fuzzy:
        if shown >= 15:
            break
        if len(pipes) < 2:
            break
        # Skip if this fuzzy key has an exact-corroborated constituent
        exact_keys_for_fuzzy = [
            ek for ek in exact_pipelines if _fuzzy_from_exact(ek) == (src, rel, tgt)
        ]
        any_exact_corr = any(
            len(exact_pipelines[ek]) >= 2 for ek in exact_keys_for_fuzzy
        )
        if any_exact_corr:
            continue
        print(f"  [{len(pipes)} pipes] {src} --{rel}--> {tgt}  ({', '.join(sorted(pipes))})")
        shown += 1


if __name__ == "__main__":
    main()
