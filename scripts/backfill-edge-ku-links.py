#!/usr/bin/env python3
"""
Backfill knowledge_ids on orphaned reasoning edges using semantic embedding similarity.

Uses the local gte-Qwen2-1.5B-instruct embedding model (port 8000) to compute
cosine similarity between edge concept strings and KU claims.

Usage:
    python3 scripts/backfill-edge-ku-links.py
    python3 scripts/backfill-edge-ku-links.py --threshold 0.60 --dry-run
    python3 scripts/backfill-edge-ku-links.py --stats
"""

import argparse
import json
import math
import os
import sys
import urllib.error
import urllib.request

# ---------------------------------------------------------------------------
# Paths (relative to repo root)
# ---------------------------------------------------------------------------
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KU_PATH = os.path.join(REPO_ROOT, "god-learn", "knowledge.jsonl")
EDGES_PATH = os.path.join(REPO_ROOT, "god-reason", "reasoning.jsonl")

EMBED_URL = "http://localhost:8000/embed"
BATCH_SIZE = 50

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_jsonl(path: str) -> list[dict]:
    """Load a JSONL file, returning a list of dicts."""
    items = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            stripped = line.strip()
            if stripped:
                items.append(json.loads(stripped))
    return items


def write_jsonl(path: str, items: list[dict]) -> None:
    """Write a list of dicts to a JSONL file."""
    with open(path, "w", encoding="utf-8") as fh:
        for item in items:
            fh.write(json.dumps(item, ensure_ascii=False) + "\n")


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Send a batch of texts to the embedding server and return vectors."""
    payload = json.dumps({
        "texts": texts,
    }).encode("utf-8")

    req = urllib.request.Request(
        EMBED_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read().decode("utf-8"))

    return body["embeddings"]


def embed_all(texts: list[str]) -> list[list[float]]:
    """Embed all texts in batches of BATCH_SIZE."""
    all_vecs: list[list[float]] = []
    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        vecs = embed_batch(batch)
        all_vecs.extend(vecs)
        # Progress indicator
        done = min(start + BATCH_SIZE, len(texts))
        print(f"  Embedded {done}/{len(texts)} texts", file=sys.stderr)
    return all_vecs


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for ai, bi in zip(a, b):
        dot += ai * bi
        norm_a += ai * ai
        norm_b += bi * bi
    denom = math.sqrt(norm_a) * math.sqrt(norm_b)
    if denom == 0.0:
        return 0.0
    return dot / denom


def edge_text(edge: dict) -> str:
    """Build the embedding string for an edge."""
    source = edge.get("source", "")
    target = edge.get("target", "")
    relation = edge.get("relation", "")
    # Phase 7 edges may lack source/target; use evidence claims instead
    if not source and "evidence" in edge:
        claims = [ev.get("claim", "") for ev in edge["evidence"][:2]]
        return f"{relation} {' '.join(claims)}"
    return f"{source} {relation} {target}"


def check_server() -> bool:
    """Check whether the embedding server is reachable."""
    try:
        payload = json.dumps({"texts": ["test"]}).encode("utf-8")
        req = urllib.request.Request(
            EMBED_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return "embeddings" in body
    except (urllib.error.URLError, OSError):
        return False


# ---------------------------------------------------------------------------
# Stats mode
# ---------------------------------------------------------------------------

def print_stats(edges: list[dict], kus: list[dict]) -> None:
    """Print current orphan/link statistics."""
    total = len(edges)
    orphaned = sum(1 for e in edges if not e.get("knowledge_ids"))
    linked = total - orphaned

    # Count how many distinct KU ids are referenced
    referenced_ids = set()
    for e in edges:
        for kid in e.get("knowledge_ids", []):
            referenced_ids.add(kid)

    all_ku_ids = {ku["id"] for ku in kus}
    unreferenced_kus = all_ku_ids - referenced_ids

    print(f"Knowledge Units:       {len(kus)}")
    print(f"  Referenced by edges: {len(referenced_ids)}")
    print(f"  Unreferenced:        {len(unreferenced_kus)}")
    if unreferenced_kus:
        for uid in sorted(unreferenced_kus):
            claim = next((ku["claim"] for ku in kus if ku["id"] == uid), "?")
            print(f"    {uid}: {claim[:80]}")
    print()
    print(f"Reasoning Edges:       {total}")
    print(f"  Linked (have KU):    {linked} ({100*linked/total:.1f}%)")
    print(f"  Orphaned (no KU):    {orphaned} ({100*orphaned/total:.1f}%)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill knowledge_ids on reasoning edges via embedding similarity."
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.65,
        help="Minimum cosine similarity to link an edge to a KU (default: 0.65)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing to disk",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Print current orphan statistics and exit (no embedding needed)",
    )
    args = parser.parse_args()

    # Load data
    if not os.path.isfile(KU_PATH):
        print(f"ERROR: KU file not found: {KU_PATH}", file=sys.stderr)
        sys.exit(1)
    if not os.path.isfile(EDGES_PATH):
        print(f"ERROR: Edges file not found: {EDGES_PATH}", file=sys.stderr)
        sys.exit(1)

    kus = load_jsonl(KU_PATH)
    edges = load_jsonl(EDGES_PATH)

    print(f"Loaded {len(kus)} KUs from {KU_PATH}")
    print(f"Loaded {len(edges)} edges from {EDGES_PATH}")

    # Stats-only mode
    if args.stats:
        print()
        print_stats(edges, kus)
        return

    # Need embedding server for backfill
    if not check_server():
        print(
            "ERROR: Embedding server not reachable at http://localhost:8000. "
            "Start it with: ./scripts/god-launch start",
            file=sys.stderr,
        )
        sys.exit(1)

    # Build texts to embed
    ku_texts = [ku["claim"] for ku in kus]
    edge_texts = [edge_text(e) for e in edges]

    print(f"\nEmbedding {len(ku_texts)} KU claims...")
    ku_vecs = embed_all(ku_texts)

    print(f"\nEmbedding {len(edge_texts)} edge strings...")
    edge_vecs = embed_all(edge_texts)

    # Compute similarities and assign links
    threshold = args.threshold
    previously_orphaned = sum(1 for e in edges if not e.get("knowledge_ids"))
    newly_linked_count = 0
    new_links_added = 0

    for i, edge in enumerate(edges):
        existing_ids = set(edge.get("knowledge_ids", []))
        added = []

        for j, ku in enumerate(kus):
            sim = cosine_similarity(edge_vecs[i], ku_vecs[j])
            if sim >= threshold and ku["id"] not in existing_ids:
                added.append(ku["id"])
                existing_ids.add(ku["id"])

        if added:
            # Preserve existing list, append new
            current = list(edge.get("knowledge_ids", []))
            current.extend(added)
            edge["knowledge_ids"] = current
            new_links_added += len(added)

            was_orphan = not edge.get("knowledge_ids") or (
                len(edge.get("knowledge_ids", [])) == len(added)
            )
            # The edge was an orphan if it had no prior knowledge_ids
            # and we just added the first ones
            prior_count = len(edge["knowledge_ids"]) - len(added)
            if prior_count == 0:
                newly_linked_count += 1

    still_orphaned = sum(1 for e in edges if not e.get("knowledge_ids"))

    # Summary
    print(f"\n{'=' * 56}")
    print(f"  Backfill Summary (threshold = {threshold})")
    print(f"{'=' * 56}")
    print(f"  Total edges:            {len(edges)}")
    print(f"  Previously orphaned:    {previously_orphaned}")
    print(f"  Newly linked:           {newly_linked_count}")
    print(f"  New KU links added:     {new_links_added}")
    print(f"  Still orphaned:         {still_orphaned}")
    print(f"{'=' * 56}")

    if args.dry_run:
        print("\n  [DRY RUN] No files were modified.")
    else:
        write_jsonl(EDGES_PATH, edges)
        print(f"\n  Wrote {len(edges)} edges to {EDGES_PATH}")


if __name__ == "__main__":
    main()
