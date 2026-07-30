#!/usr/bin/env python3
"""
Merge manual bootstrap edges + Phase 7 auto-derived edges + LLM-derived edges
into a single god-reason/reasoning.jsonl with all schema fields applied.

Phase 7 edges without source/target get ontology-anchored entity matching
via corpus/index/compiled-index.json. Unanchored edges (where one or both
concepts fail to match) are split to god-reason/unanchored-edges.jsonl.
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BACKUP_EDGES = REPO / "tmp" / "backup-pre-ku-plan-2026-03-18" / "data" / "reasoning.jsonl"
PHASE7_SOURCE = REPO / "god-reason" / "reasoning.jsonl"
LLM_EDGES = REPO / "god-reason" / "llm-derived-edges.jsonl"
COMPILED_INDEX = REPO / "corpus" / "index" / "compiled-index.json"
OUTPUT = REPO / "god-reason" / "reasoning.jsonl"
UNANCHORED_OUTPUT = REPO / "god-reason" / "unanchored-edges.jsonl"


def guard_overwrite(path: Path) -> None:
    """Truncation guard (index-overhaul step A10; audit B-57, B-49).

    PHASE7_SOURCE and OUTPUT are the same file, so this script truncates its own
    input; a second run also truncates unanchored-edges.jsonl (1,141 -> 0 measured).
    Before any open(path, 'w') on a non-empty target: write a timestamped .bak,
    and refuse to proceed unless --force is passed (or GOD_MERGE_FORCE=1).
    """
    import datetime
    import os
    import shutil
    import sys

    if not path.exists() or path.stat().st_size == 0:
        return
    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    bak = path.with_name(path.name + f".bak-{ts}")
    shutil.copy2(path, bak)
    print(f"  [guard] backed up non-empty {path.name} -> {bak.name}")
    forced = "--force" in sys.argv or os.environ.get("GOD_MERGE_FORCE", "") in ("1", "true", "yes")
    if not forced:
        print(
            f"  [guard] REFUSING to overwrite non-empty {path} without --force "
            f"(or GOD_MERGE_FORCE=1). A backup was written; re-run with --force to proceed.",
            file=sys.stderr,
        )
        sys.exit(2)


# ---------------------------------------------------------------------------
# Ontology lookup
# ---------------------------------------------------------------------------

def build_ontology_lookup(index_path: Path) -> list[tuple[str, str]]:
    """
    Build a list of (term, canonical_name) tuples from compiled-index.json.

    Each ontologyNode contributes its name, transliteration, greek, and any
    aliases as search terms that all resolve to node.name (the canonical name).
    The list is sorted by term length descending so that longer terms match
    first (e.g. "sense-perception" before "sense").
    """
    with open(index_path, encoding="utf-8") as f:
        index = json.load(f)

    nodes = index.get("ontologyNodes", [])
    pairs: dict[str, str] = {}

    for node in nodes:
        canonical = node["name"]
        # Primary fields: name, transliteration, greek
        for field in ("name", "transliteration", "greek"):
            val = node.get(field)
            if val and val.strip():
                term = val.strip()
                # Don't overwrite a mapping with a less-specific canonical
                if term not in pairs:
                    pairs[term] = canonical
        # Aliases
        for alias in node.get("aliases", []):
            alias = alias.strip()
            if alias and alias not in pairs:
                pairs[alias] = canonical

    # Sort by term length descending to prevent partial matches
    lookup = sorted(pairs.items(), key=lambda x: len(x[0]), reverse=True)
    return lookup


def match_canonical_concept(claim: str, lookup: list[tuple[str, str]]) -> str | None:
    """
    Scan claim text for the first ontology term match.

    Uses case-insensitive word-boundary matching. Returns the canonical
    concept name, or None if no term matches.
    """
    for term, canonical in lookup:
        if re.search(r'\b' + re.escape(term) + r'\b', claim, re.IGNORECASE):
            return canonical
    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # 0. Read current reasoning.jsonl (Phase 7 source) BEFORE we overwrite it
    phase7_edges = []
    if PHASE7_SOURCE.exists():
        with open(PHASE7_SOURCE, encoding="utf-8") as f:
            phase7_edges = [json.loads(l) for l in f if l.strip()]
    print(f"Phase 7 edges loaded from reasoning.jsonl: {len(phase7_edges)}")

    # 1. Load original manual edges from backup
    with open(BACKUP_EDGES, encoding="utf-8") as f:
        manual_edges = [json.loads(l) for l in f if l.strip()]
    print(f"Manual edges loaded: {len(manual_edges)}")

    # 2. Remove the confirmed contradiction
    manual_edges = [e for e in manual_edges if not (
        e.get("source") == "resonant_motion"
        and e.get("relation") == "contrasts_with"
        and e.get("target") == "resonant_affect"
    )]
    print(f"After contradiction removal: {len(manual_edges)}")

    # 3. Add epoch/derivation fields to manual edges
    for e in manual_edges:
        e["generation_epoch"] = 0
        if e.get("pipeline", "").startswith("bridge_"):
            e["derivation"] = "bridge"
        else:
            e["derivation"] = "manual"
        if "corroboration_method" not in e:
            e["corroboration_method"] = "none"

    # 4. Build ontology lookup
    lookup: list[tuple[str, str]] = []
    if COMPILED_INDEX.exists():
        lookup = build_ontology_lookup(COMPILED_INDEX)
        print(f"Ontology lookup loaded: {len(lookup)} terms")
    else:
        print(f"WARNING: {COMPILED_INDEX} not found — all Phase 7 edges will be unanchored")

    # 5. Process Phase 7 edges: add schema fields + ontology matching
    for e in phase7_edges:
        e["generation_epoch"] = 1
        e["derivation"] = "phase7"
        if "reason_id" in e and "id" not in e:
            e["id"] = e["reason_id"]
        if "pipeline" not in e:
            e["pipeline"] = "phase7_auto"
        if "corroboration_score" not in e:
            e["corroboration_score"] = 1.0
        if "corroboration_method" not in e:
            e["corroboration_method"] = "none"
        if "confidence" not in e:
            e["confidence"] = "medium"

        # Ontology-anchored entity matching (only if source not already set)
        if "source" not in e:
            evidence = e.get("evidence", [])
            claim0 = evidence[0]["claim"] if len(evidence) > 0 else ""
            claim1 = evidence[1]["claim"] if len(evidence) > 1 else ""

            src = match_canonical_concept(claim0, lookup)
            tgt = match_canonical_concept(claim1, lookup)

            if src is not None and tgt is not None:
                e["source"] = src
                e["target"] = tgt
                e["status"] = "anchored"
            else:
                e["source"] = src
                e["target"] = tgt
                e["status"] = "unanchored"

    # 6. Load LLM-derived edges
    llm_edges = []
    if LLM_EDGES.exists():
        with open(LLM_EDGES, encoding="utf-8") as f:
            llm_edges = [json.loads(l) for l in f if l.strip()]
        for e in llm_edges:
            e["generation_epoch"] = 1
            e["derivation"] = "llm"
            if "corroboration_score" not in e:
                e["corroboration_score"] = 1.0
            if "corroboration_method" not in e:
                e["corroboration_method"] = "none"
    print(f"LLM-derived edges: {len(llm_edges)}")

    # 7. Split Phase 7 edges by anchor status
    anchored_phase7 = [e for e in phase7_edges if e.get("status") != "unanchored"]
    unanchored_phase7 = [e for e in phase7_edges if e.get("status") == "unanchored"]

    # 8. Merge all active edge sources
    active_edges = manual_edges + anchored_phase7 + llm_edges

    # 8a. C-01: Remove self-referential edges (source == target)
    pre_selfref = len(active_edges)
    active_edges = [e for e in active_edges if e.get("source") != e.get("target")]
    selfref_removed = pre_selfref - len(active_edges)
    if selfref_removed:
        print(f"  Removed {selfref_removed} self-referential edges (source == target)")

    # 8b. C-02: Deduplicate by (source, relation, target), keeping highest corroboration_score
    seen: dict[tuple[str, str, str], int] = {}
    for i, e in enumerate(active_edges):
        key = (
            (e.get("source") or "").lower(),
            (e.get("relation") or ""),
            (e.get("target") or "").lower(),
        )
        if key in seen:
            prev_idx = seen[key]
            prev_score = active_edges[prev_idx].get("corroboration_score", 1.0)
            curr_score = e.get("corroboration_score", 1.0)
            if curr_score > prev_score:
                seen[key] = i  # keep the higher-scoring edge
        else:
            seen[key] = i
    pre_dedup = len(active_edges)
    active_edges = [active_edges[i] for i in sorted(seen.values())]
    dupes_removed = pre_dedup - len(active_edges)
    if dupes_removed:
        print(f"  Removed {dupes_removed} duplicate triples (kept highest corroboration_score)")

    # 8c. Write deduplicated active edges
    guard_overwrite(OUTPUT)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        for e in active_edges:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    # 9. Write unanchored Phase 7 edges (preserve full evidence[])
    guard_overwrite(UNANCHORED_OUTPUT)
    with open(UNANCHORED_OUTPUT, "w", encoding="utf-8") as f:
        for e in unanchored_phase7:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    # 10. Summary
    print(f"\n{'='*50}")
    print(f"  Manual edges:          {len(manual_edges)}")
    print(f"  Anchored Phase 7:      {len(anchored_phase7)}")
    print(f"  Unanchored Phase 7:    {len(unanchored_phase7)}")
    print(f"  LLM edges:             {len(llm_edges)}")
    print(f"  ─────────────────────────────────")
    print(f"  Total active:          {len(active_edges)}")
    print(f"  Total unanchored:      {len(unanchored_phase7)}")
    print(f"{'='*50}")

    print(f"\nWrote {len(active_edges)} active edges to {OUTPUT}")
    print(f"Wrote {len(unanchored_phase7)} unanchored edges to {UNANCHORED_OUTPUT}")

    # Derivation breakdown for active edges
    derivation_counts = Counter(e.get("derivation", "unknown") for e in active_edges)
    print("\nActive edges by derivation:")
    for d, c in sorted(derivation_counts.items()):
        print(f"  {d}: {c}")


if __name__ == "__main__":
    main()
