#!/usr/bin/env python3
"""
Backfill visual provenance (bboxes) on existing KUs.

Iterates through god-learn/knowledge.jsonl, looks up each source's chunk_id
in ChromaDB, and copies has_bboxes, source_method, and bboxes into the
source object. All chunk_ids are guaranteed to exist in ChromaDB since the
KUs were promoted directly from it during Phase D re-promotion.

Usage:
  python3 scripts/backfill-ku-bboxes.py [--dry-run] [--verbose]
"""

import argparse
import json
import sys
from pathlib import Path

import chromadb

CHROMA_HOST = "127.0.0.1"
CHROMA_PORT = 8001
COLLECTION = "knowledge_chunks"
KNOWLEDGE_PATH = Path("god-learn/knowledge.jsonl")


def main():
    parser = argparse.ArgumentParser(description="Backfill bbox metadata on KU sources")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    col = client.get_collection(COLLECTION)

    kus = []
    with KNOWLEDGE_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                kus.append(json.loads(line))

    enriched_kus = 0
    enriched_sources = 0
    skipped = 0
    warnings = 0

    for ku in kus:
        ku_modified = False
        for src in ku.get("sources", []):
            if src.get("has_bboxes"):
                skipped += 1
                continue

            chunk_id = src.get("chunk_id", "")
            if not chunk_id:
                continue

            try:
                r = col.get(ids=[chunk_id], include=["metadatas"])
            except Exception as e:
                print(f"  [WARN] ChromaDB error for {chunk_id}: {e}", file=sys.stderr)
                warnings += 1
                continue

            if not r["ids"] or not r["metadatas"] or not r["metadatas"][0]:
                print(f"  [WARN] chunk_id {chunk_id} not found in ChromaDB", file=sys.stderr)
                warnings += 1
                continue

            meta = r["metadatas"][0]
            if not meta.get("has_bboxes"):
                skipped += 1
                continue

            src["has_bboxes"] = True
            src["source_method"] = str(meta.get("source_method", ""))
            src["bboxes"] = str(meta.get("bboxes", ""))
            enriched_sources += 1
            ku_modified = True

            if args.verbose:
                print(f"  [{ku['id']}] {chunk_id}: "
                      f"method={src['source_method']}, "
                      f"bbox_len={len(src['bboxes'])}")

        if ku_modified:
            enriched_kus += 1

    print(f"\n=== BACKFILL RESULTS ===")
    print(f"Total KUs:        {len(kus)}")
    print(f"KUs enriched:     {enriched_kus}")
    print(f"Sources enriched:  {enriched_sources}")
    print(f"Sources skipped:   {skipped} (already had bboxes or chunk has none)")
    print(f"Warnings:          {warnings}")

    if args.dry_run:
        print("\n[DRY RUN] No files written.")
        return 0

    with KNOWLEDGE_PATH.open("w", encoding="utf-8") as f:
        for ku in kus:
            f.write(json.dumps(ku, ensure_ascii=False) + "\n")

    print(f"\nWrote {len(kus)} KUs to {KNOWLEDGE_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
