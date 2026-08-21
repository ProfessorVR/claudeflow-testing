#!/usr/bin/env python3
"""
knowledge-prune.py — Detect contradictory, stale, and orphaned edges in the reasoning graph.

Input:  god-reason/reasoning.jsonl
Output: god-reason/review-queue.json

Non-destructive: reads only, never modifies the source file.
"""

import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
INPUT_PATH = os.path.join(PROJECT_ROOT, "god-reason", "reasoning.jsonl")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "god-reason", "review-queue.json")

# Relation pairs that signal contradictions or potential contradictions.
# Key: frozenset of two relations -> (type, note)
CONFLICT_RULES = {
    frozenset({"supports", "contrasts_with"}): (
        "contradiction",
        "Same source/target with supports AND contrasts_with",
    ),
    frozenset({"supports", "undermines"}): (
        "contradiction",
        "Same source/target with supports AND undermines",
    ),
    frozenset({"depends_on", "contrasts_with"}): (
        "potential_contradiction",
        "Same source/target with depends_on AND contrasts_with",
    ),
    frozenset({"presupposes", "contrasts_with"}): (
        "potential_contradiction",
        "Same source/target with presupposes AND contrasts_with",
    ),
    frozenset({"depends_on", "undermines"}): (
        "potential_contradiction",
        "Same source/target with depends_on AND undermines",
    ),
    frozenset({"presupposes", "undermines"}): (
        "potential_contradiction",
        "Same source/target with presupposes AND undermines",
    ),
    frozenset({"enables", "contrasts_with"}): (
        "potential_contradiction",
        "Same source/target with enables AND contrasts_with",
    ),
    frozenset({"enables", "undermines"}): (
        "potential_contradiction",
        "Same source/target with enables AND undermines",
    ),
}


def load_edges(path):
    """Load all edges from a JSONL file."""
    edges = []
    with open(path, "r", encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                edges.append(json.loads(line))
            except json.JSONDecodeError as exc:
                print(f"WARNING: skipping malformed line {lineno}: {exc}", file=sys.stderr)
    return edges


def edge_summary(edge):
    """Return a compact dict for reporting."""
    return {
        "id": edge.get("id", "UNKNOWN"),
        "source": edge.get("source", ""),
        "relation": edge.get("relation", ""),
        "target": edge.get("target", ""),
        "confidence": edge.get("confidence", ""),
        "pipeline": edge.get("pipeline", ""),
    }


def detect_contradictions(edges):
    """Find edge pairs where the same source/target have conflicting relations."""
    # Group edges by (source, target) pair.
    pair_map = defaultdict(list)
    for edge in edges:
        key = (edge.get("source", ""), edge.get("target", ""))
        pair_map[key].append(edge)

    contradictions = []
    potential_contradictions = []
    seen_pairs = set()

    for (src, tgt), group in pair_map.items():
        if len(group) < 2:
            continue

        # Collect distinct relations for this source/target pair.
        relations_in_group = set(e.get("relation", "") for e in group)

        # Check every pair of distinct relations against conflict rules.
        relations_list = sorted(relations_in_group)
        for i in range(len(relations_list)):
            for j in range(i + 1, len(relations_list)):
                pair_key = frozenset({relations_list[i], relations_list[j]})
                if pair_key not in CONFLICT_RULES:
                    continue

                conflict_type, note = CONFLICT_RULES[pair_key]

                # Pick one representative edge for each relation.
                edge_a = next(e for e in group if e.get("relation") == relations_list[i])
                edge_b = next(e for e in group if e.get("relation") == relations_list[j])

                # Deduplicate (same IDs in either order).
                dedup_key = tuple(sorted([edge_a.get("id", ""), edge_b.get("id", "")]))
                if dedup_key in seen_pairs:
                    continue
                seen_pairs.add(dedup_key)

                entry = {
                    "edge_a": edge_summary(edge_a),
                    "edge_b": edge_summary(edge_b),
                    "type": conflict_type,
                    "note": note,
                }

                if conflict_type == "contradiction":
                    contradictions.append(entry)
                else:
                    potential_contradictions.append(entry)

    # Also check the reverse direction: A supports B, but B contrasts_with A.
    # Build a full relation index: (src, tgt) -> set of relations.
    full_index = defaultdict(set)
    edge_lookup = defaultdict(list)
    for edge in edges:
        key = (edge.get("source", ""), edge.get("target", ""))
        rel = edge.get("relation", "")
        full_index[key].add(rel)
        edge_lookup[(key, rel)].append(edge)

    for (src, tgt), rels_fwd in full_index.items():
        rels_rev = full_index.get((tgt, src), set())
        if not rels_rev:
            continue

        for rel_fwd in rels_fwd:
            for rel_rev in rels_rev:
                pair_key = frozenset({rel_fwd, rel_rev})
                if pair_key not in CONFLICT_RULES:
                    continue

                conflict_type, note = CONFLICT_RULES[pair_key]
                note += " (cross-direction)"

                edge_a = edge_lookup[((src, tgt), rel_fwd)][0]
                edge_b = edge_lookup[((tgt, src), rel_rev)][0]

                dedup_key = tuple(sorted([edge_a.get("id", ""), edge_b.get("id", "")]))
                if dedup_key in seen_pairs:
                    continue
                seen_pairs.add(dedup_key)

                entry = {
                    "edge_a": edge_summary(edge_a),
                    "edge_b": edge_summary(edge_b),
                    "type": conflict_type,
                    "note": note,
                }

                if conflict_type == "contradiction":
                    contradictions.append(entry)
                else:
                    potential_contradictions.append(entry)

    return contradictions, potential_contradictions


def detect_stale(edges):
    """Flag edges that are uncorroborated (score missing or 1.0) AND low confidence."""
    stale = []
    for edge in edges:
        corr = edge.get("corroboration_score")
        is_uncorroborated = corr is None or corr == 1.0
        is_low_confidence = edge.get("confidence") == "low"

        if is_uncorroborated and is_low_confidence:
            entry = edge_summary(edge)
            entry["corroboration_score"] = corr
            entry["reason"] = "uncorroborated (score=1.0 or missing) with low confidence"
            stale.append(entry)

    return stale


def detect_orphans(edges):
    """Count edges with empty or missing knowledge_ids."""
    orphaned_ids = []
    for edge in edges:
        kids = edge.get("knowledge_ids")
        if kids is None or len(kids) == 0:
            orphaned_ids.append(edge.get("id", "UNKNOWN"))
    return orphaned_ids


def main():
    if not os.path.isfile(INPUT_PATH):
        print(f"ERROR: input file not found: {INPUT_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading edges from {INPUT_PATH} ...")
    edges = load_edges(INPUT_PATH)
    print(f"  Loaded {len(edges)} edges.")

    print("Detecting contradictions ...")
    contradictions, potential_contradictions = detect_contradictions(edges)
    print(f"  {len(contradictions)} contradictions, {len(potential_contradictions)} potential contradictions.")

    print("Detecting stale/uncorroborated edges ...")
    stale = detect_stale(edges)
    print(f"  {len(stale)} stale edges (uncorroborated + low confidence).")

    print("Detecting orphaned edges ...")
    orphaned_ids = detect_orphans(edges)
    print(f"  {len(orphaned_ids)} orphaned edges (empty/missing knowledge_ids).")

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_edges": len(edges),
            "contradictions": len(contradictions),
            "potential_contradictions": len(potential_contradictions),
            "stale_uncorroborated": len(stale),
            "orphaned": len(orphaned_ids),
        },
        "contradictions": contradictions + potential_contradictions,
        "stale": stale,
        "orphaned_count": len(orphaned_ids),
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\nReport written to {OUTPUT_PATH}")
    print(f"\n--- Summary ---")
    for key, val in report["summary"].items():
        print(f"  {key}: {val}")


if __name__ == "__main__":
    main()
