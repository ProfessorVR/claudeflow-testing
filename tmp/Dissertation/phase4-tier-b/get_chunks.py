#!/usr/bin/env python3
"""Get full text of specific chunks by author + chunk_index."""
import json
import re
import sys
import urllib.request

CHROMA_BASE = "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections"
DPC_ID = "b215ff2b-e3ce-4067-aa00-dc8fdc9be24c"
KC_ID = "2351bc36-0847-4071-ac16-31da2b634a22"


def get_chunks(collection_id, author_field, author, chunk_indices):
    req = urllib.request.Request(
        f"{CHROMA_BASE}/{collection_id}/get",
        data=json.dumps({
            "limit": 2000,
            "include": ["metadatas", "documents"],
            "where": {author_field: {"$eq": author}},
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read())
    metas = data["metadatas"]
    docs = data["documents"]
    out = []
    for m, d in zip(metas, docs):
        if m.get("chunk_index") in chunk_indices:
            out.append((m, d))
    out.sort(key=lambda x: x[0].get("chunk_index", 0))
    return out


if __name__ == "__main__":
    # Sheehan key chunks
    print("=" * 80)
    print("SHEEHAN 2015 — Chunks 421–428 (technē/praxis/phronēsis — Question of Technik)")
    print("=" * 80)
    chunks = get_chunks(DPC_ID, "author", "Sheehan, Thomas", [421, 422, 425, 426, 427, 428])
    for m, d in chunks:
        print(f"\n--- chunk={m.get('chunk_index')} pp.{m.get('page_start')}-{m.get('page_end')} ---")
        text = re.sub(r"\s+", " ", d).strip()
        print(text[:2400])
        if len(text) > 2400:
            print(f"...({len(text)-2400} more chars)")
