#!/usr/bin/env python3
"""
Backfill chunk_id provenance on KUs that have chunk_id: null.

For each KU, queries ChromaDB using the claim text to find the best matching
chunk from the KU's source document, then backfills chunk_id and pages.

Usage:
    python3 scripts/backfill-ku-chunk-ids.py
    python3 scripts/backfill-ku-chunk-ids.py --dry-run
"""

import argparse
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

KNOWLEDGE_PATH = Path(__file__).resolve().parent.parent / "god-learn" / "knowledge.jsonl"
CHROMADB_URL = "http://localhost:8001"
EMBEDDING_URL = "http://localhost:8000"
COLLECTION_NAME = "knowledge_chunks"


def http_json(method: str, url: str, body: dict | None = None, timeout: int = 15) -> dict:
    """Make an HTTP request and return parsed JSON."""
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def resolve_collection_id() -> str:
    """List ChromaDB collections and find the knowledge_chunks UUID."""
    url = f"{CHROMADB_URL}/api/v2/tenants/default_tenant/databases/default_database/collections"
    collections = http_json("GET", url)
    for coll in collections:
        if coll.get("name") == COLLECTION_NAME:
            return coll["id"]
    raise RuntimeError(f'Collection "{COLLECTION_NAME}" not found in ChromaDB')


def embed_text(text: str) -> list[float]:
    """Get embedding vector for a text string via the embedding server."""
    result = http_json("POST", f"{EMBEDDING_URL}/embed", {
        "texts": [text],
    })
    return result["embeddings"][0]


def query_chromadb(collection_id: str, embedding: list[float], doc_id: str) -> dict | None:
    """
    Query ChromaDB for the best matching chunk from a specific document.
    Returns {"chunk_id": ..., "page_start": ..., "page_end": ...} or None.
    """
    url = (
        f"{CHROMADB_URL}/api/v2/tenants/default_tenant/databases/default_database"
        f"/collections/{collection_id}/query"
    )
    body = {
        "query_embeddings": [embedding],
        "n_results": 1,
        "include": ["metadatas", "distances"],
        "where": {"doc_id": {"$eq": doc_id}},
    }
    result = http_json("POST", url, body)

    ids = result.get("ids", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]

    if not ids:
        return None

    meta = metadatas[0] if metadatas else {}
    return {
        "chunk_id": ids[0],
        "page_start": meta.get("page_start"),
        "page_end": meta.get("page_end"),
        "distance": distances[0] if distances else None,
    }


def load_kus() -> list[dict]:
    """Load all KUs from knowledge.jsonl."""
    kus = []
    with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                kus.append(json.loads(line))
    return kus


def save_kus(kus: list[dict]) -> None:
    """Write KUs back to knowledge.jsonl."""
    with open(KNOWLEDGE_PATH, "w", encoding="utf-8") as f:
        for ku in kus:
            f.write(json.dumps(ku, ensure_ascii=False) + "\n")


def main():
    parser = argparse.ArgumentParser(description="Backfill chunk_id on KUs with null chunk_id")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()

    # Load KUs
    if not KNOWLEDGE_PATH.exists():
        print(f"[ERROR] {KNOWLEDGE_PATH} not found", file=sys.stderr)
        sys.exit(1)

    kus = load_kus()
    print(f"Loaded {len(kus)} KUs from {KNOWLEDGE_PATH}")

    # Find KUs needing backfill
    needs_backfill = []
    for ku in kus:
        sources = ku.get("sources", [])
        if sources and sources[0].get("chunk_id") is None:
            needs_backfill.append(ku)

    if not needs_backfill:
        print("All KUs already have chunk_id — nothing to do.")
        return

    print(f"Found {len(needs_backfill)} KUs with chunk_id: null")

    # Connect to ChromaDB
    try:
        collection_id = resolve_collection_id()
        print(f'Resolved collection "{COLLECTION_NAME}" → {collection_id}')
    except (urllib.error.URLError, ConnectionRefusedError, OSError) as e:
        print(f"[ERROR] Cannot connect to ChromaDB at {CHROMADB_URL}: {e}", file=sys.stderr)
        print("Make sure ChromaDB is running (./scripts/god-launch start)", file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)

    # Backfill each KU
    updated = 0
    failed = 0

    for ku in needs_backfill:
        ku_id = ku["id"]
        claim = ku["claim"]
        doc_id = ku["sources"][0]["doc_id"]
        claim_preview = claim[:60] + ("..." if len(claim) > 60 else "")

        try:
            # Embed the claim text
            embedding = embed_text(claim)

            # Query ChromaDB for best match from this document
            match = query_chromadb(collection_id, embedding, doc_id)

            if match is None:
                print(f"[SKIP]     {ku_id}: no chunks found for doc_id={doc_id}")
                failed += 1
                continue

            chunk_id = match["chunk_id"]
            page_start = match["page_start"]
            page_end = match["page_end"]
            distance = match["distance"]

            # Build pages list
            pages = []
            if page_start is not None and page_end is not None:
                pages = list(range(int(page_start), int(page_end) + 1))
            elif page_start is not None:
                pages = [int(page_start)]

            # Update the KU
            ku["sources"][0]["chunk_id"] = chunk_id
            ku["sources"][0]["pages"] = pages

            dist_str = f" (dist={distance:.4f})" if distance is not None else ""
            print(f"[BACKFILL] {ku_id}: {claim_preview} → chunk_id={chunk_id}, pages={pages}{dist_str}")
            updated += 1

        except (urllib.error.URLError, OSError) as e:
            print(f"[ERROR]    {ku_id}: {e}", file=sys.stderr)
            failed += 1
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            print(f"[ERROR]    {ku_id}: unexpected response format — {e}", file=sys.stderr)
            failed += 1

    # Write results
    print(f"\n--- Summary ---")
    print(f"  Total KUs:    {len(kus)}")
    print(f"  Needed:       {len(needs_backfill)}")
    print(f"  Updated:      {updated}")
    print(f"  Failed/Skip:  {failed}")

    if updated > 0 and not args.dry_run:
        save_kus(kus)
        print(f"\nWrote {len(kus)} KUs to {KNOWLEDGE_PATH}")
    elif args.dry_run and updated > 0:
        print(f"\n[DRY RUN] Would have written {len(kus)} KUs to {KNOWLEDGE_PATH}")
    else:
        print("\nNo changes to write.")


if __name__ == "__main__":
    main()
