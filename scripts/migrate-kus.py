#!/usr/bin/env python3
"""
KU Migration Script (Stage 2): Semantic Remapping of Knowledge Units

Remaps old chunk_id references in god-learn/knowledge.jsonl to new chunks
in ChromaDB by embedding each KU's claim text and finding the best match.

Input:
  - god-learn/knowledge.jsonl  (existing KUs with old chunk_id references)
  - ChromaDB at localhost:8001  (new chunks from v7 ingestion pipeline)

Output:
  - god-learn/knowledge.jsonl   (migrated KUs with updated references)
  - god-learn/quarantine.jsonl  (KUs that failed semantic matching)

Usage:
  python3 scripts/migrate-kus.py [--threshold 0.95] [--dry-run]
"""

import argparse
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path

import chromadb
import requests


EMBED_URL = "http://127.0.0.1:8000/embed"
CHROMA_HOST = "127.0.0.1"
CHROMA_PORT = 8001
COLLECTION = "knowledge_chunks"


def embed_text(text: str) -> list[float]:
    """Embed a single text via the embedding server."""
    resp = requests.post(
        EMBED_URL,
        json={"texts": [text]},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["embeddings"][0]


def compute_ku_id(claim: str, sources: list[dict]) -> str:
    """Recompute KU ID: ku_ + sha256(claim + sorted(sources))[:16]."""
    # Sort sources by chunk_id for deterministic hashing
    sorted_sources = sorted(sources, key=lambda s: s.get("chunk_id", ""))
    payload = claim + json.dumps(sorted_sources, sort_keys=True)
    return "ku_" + hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def load_kus(path: Path) -> list[dict]:
    """Load KUs from JSONL file."""
    kus = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                kus.append(json.loads(line))
    return kus


def write_jsonl(path: Path, records: list[dict]) -> None:
    """Write records to JSONL file."""
    with path.open("w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def main():
    parser = argparse.ArgumentParser(description="Migrate KU chunk references to new ChromaDB chunks")
    parser.add_argument("--threshold", type=float, default=0.95,
                        help="Cosine similarity threshold for migration (default: 0.95)")
    parser.add_argument("--knowledge", default="god-learn/knowledge.jsonl",
                        help="Path to knowledge.jsonl (default: god-learn/knowledge.jsonl)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would happen without writing files")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Show per-KU migration details")
    args = parser.parse_args()

    knowledge_path = Path(args.knowledge)
    quarantine_path = knowledge_path.parent / "quarantine.jsonl"

    if not knowledge_path.exists():
        print(f"ERROR: {knowledge_path} not found", file=sys.stderr)
        return 1

    # Connect to ChromaDB
    print(f"[migrate-kus] Connecting to ChromaDB at {CHROMA_HOST}:{CHROMA_PORT}...")
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    collection = client.get_collection(COLLECTION)
    print(f"[migrate-kus] Collection '{COLLECTION}' has {collection.count()} chunks")

    # Load existing KUs
    kus = load_kus(knowledge_path)
    print(f"[migrate-kus] Loaded {len(kus)} KUs from {knowledge_path}")

    migrated = []
    quarantined = []
    quarantine_queries = defaultdict(list)  # query -> list of quarantined KU claims

    for i, ku in enumerate(kus):
        claim = ku.get("claim", "")
        old_id = ku.get("id", "?")

        # Embed the claim
        try:
            embedding = embed_text(claim)
        except Exception as e:
            print(f"  [ERROR] Failed to embed KU {old_id}: {e}", file=sys.stderr)
            quarantined.append(ku)
            query = ku.get("created_from_query", "unknown")
            quarantine_queries[query].append(claim[:80])
            continue

        # Query ChromaDB for best match
        results = collection.query(
            query_embeddings=[embedding],
            n_results=1,
            include=["metadatas", "distances", "documents"],
        )

        if not results["ids"] or not results["ids"][0]:
            print(f"  [WARN] No match for KU {old_id}", file=sys.stderr)
            quarantined.append(ku)
            query = ku.get("created_from_query", "unknown")
            quarantine_queries[query].append(claim[:80])
            continue

        # ChromaDB returns L2 distances; convert to cosine similarity
        # For normalized embeddings: cosine_sim = 1 - L2²/2
        l2_dist = results["distances"][0][0]
        cosine_sim = 1.0 - (l2_dist ** 2) / 2.0

        match_id = results["ids"][0][0]
        match_meta = results["metadatas"][0][0]

        if cosine_sim >= args.threshold:
            # Update sources with new chunk references
            new_sources = []
            for src in ku.get("sources", []):
                updated_src = dict(src)
                updated_src["chunk_id"] = match_id
                updated_src["pages"] = [match_meta.get("page_start", 0), match_meta.get("page_end", 0)]
                updated_src["has_bboxes"] = match_meta.get("has_bboxes", False)
                updated_src["source_method"] = match_meta.get("source_method", "unknown")
                # Include bboxes if available
                bboxes_raw = match_meta.get("bboxes", "")
                if bboxes_raw and bboxes_raw != "[]":
                    updated_src["bboxes"] = bboxes_raw  # Keep as JSON string
                new_sources.append(updated_src)

            # Recompute KU ID
            new_id = compute_ku_id(claim, new_sources)

            migrated_ku = dict(ku)
            migrated_ku["id"] = new_id
            migrated_ku["sources"] = new_sources
            migrated.append(migrated_ku)

            if args.verbose:
                print(f"  [{i+1}/{len(kus)}] MIGRATED {old_id} → {new_id} "
                      f"(sim={cosine_sim:.4f}, chunk={match_id})")
        else:
            quarantined.append(ku)
            query = ku.get("created_from_query", "unknown")
            quarantine_queries[query].append(claim[:80])
            if args.verbose:
                print(f"  [{i+1}/{len(kus)}] QUARANTINED {old_id} "
                      f"(sim={cosine_sim:.4f} < {args.threshold}, best={match_id})")

    # Print summary
    print(f"\n{'='*50}")
    print(f"=== KU MIGRATION RESULTS ===")
    print(f"{'='*50}")
    print(f"Migrated:    {len(migrated)} of {len(kus)} ({100*len(migrated)/max(len(kus),1):.1f}%)")
    print(f"Quarantined: {len(quarantined)} of {len(kus)} ({100*len(quarantined)/max(len(kus),1):.1f}%)")

    if quarantined:
        print(f"\nQuarantined by source query:")
        for query, claims in sorted(quarantine_queries.items()):
            print(f"  {len(claims)} from: {query[:80]}...")

    if args.dry_run:
        print("\n[DRY RUN] No files written.")
        return 0

    # Write outputs
    write_jsonl(knowledge_path, migrated)
    print(f"\n[migrate-kus] Wrote {len(migrated)} migrated KUs to {knowledge_path}")

    if quarantined:
        write_jsonl(quarantine_path, quarantined)
        print(f"[migrate-kus] Wrote {len(quarantined)} quarantined KUs to {quarantine_path}")

        # Generate re-promotion commands
        print(f"\n# === QUARANTINE RE-PROMOTION COMMANDS ===")
        print(f"# {len(quarantined)} KUs quarantined from {len(quarantine_queries)} queries.")
        print(f"# Review quarantine.jsonl, then run:\n")
        for query in sorted(quarantine_queries.keys()):
            if query == "manual_curation":
                print(f"# (manual_curation KUs — re-curate manually)")
                continue
            safe_q = query.replace('"', '\\"')
            print(f'god-learn update --query "{safe_q}" '
                  f'--k 8 --overfetch 30 --skip-compile --skip-reasoning --skip-gpu-switch')

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
