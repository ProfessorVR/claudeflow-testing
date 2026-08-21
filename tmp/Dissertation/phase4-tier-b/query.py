#!/usr/bin/env python3
"""
Phase 4 Tier B query helper.

Embeds query text via local /embed endpoint (gte-Qwen2-1.5B-instruct, 1536D),
then queries ChromaDB collections directly with the embedding vector.

Collections targeted:
  - dissertation-perplexity-cache (Phase 4.0 ingest of 12 corpus/download PDFs)
  - knowledge_chunks with where:{collection:"metaphysics"}
  - knowledge_chunks with where:{collection:"new_media"}
  - knowledge_chunks with where:{collection:"rhetorical_ontology"}

Filtering on the dissertation-perplexity-cache collection supports targeting
specific source authors via metadata {"author": ...} or {"source_pdf_filename": ...}.
"""

import json
import re
import sys
import urllib.request

CHROMA_BASE = "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections"
EMBED_URL = "http://localhost:8000/embed"

DPC_ID = "b215ff2b-e3ce-4067-aa00-dc8fdc9be24c"          # dissertation-perplexity-cache
KC_ID = "2351bc36-0847-4071-ac16-31da2b634a22"           # knowledge_chunks


def _post(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def embed(text: str):
    """Return a single 1536D embedding for the input text."""
    out = _post(EMBED_URL, {"texts": [text]})
    return out["embeddings"][0]


def query_collection(coll_id: str, vec, n_results: int = 5, where=None):
    payload = {
        "query_embeddings": [vec],
        "n_results": n_results,
        "include": ["documents", "metadatas", "distances"],
    }
    if where is not None:
        payload["where"] = where
    return _post(f"{CHROMA_BASE}/{coll_id}/query", payload)


def query_dpc(text: str, n_results: int = 3, author_filter=None, source_pdf_filter=None):
    """Query dissertation-perplexity-cache. Returns top n_results."""
    vec = embed(text)
    where = None
    if author_filter is not None:
        where = {"author": {"$eq": author_filter}}
    elif source_pdf_filter is not None:
        where = {"source_pdf_filename": {"$eq": source_pdf_filter}}
    return query_collection(DPC_ID, vec, n_results=n_results, where=where)


def query_metaphysics(text: str, n_results: int = 3):
    vec = embed(text)
    return query_collection(KC_ID, vec, n_results=n_results, where={"collection": "metaphysics"})


def query_rhetorical_ontology(text: str, n_results: int = 3):
    vec = embed(text)
    return query_collection(KC_ID, vec, n_results=n_results, where={"collection": "rhetorical_ontology"})


def query_new_media(text: str, n_results: int = 3):
    vec = embed(text)
    return query_collection(KC_ID, vec, n_results=n_results, where={"collection": "new_media"})


def summarize(result, label="result"):
    """Print a compact summary of a ChromaDB query result."""
    ids = result.get("ids", [[]])[0]
    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]
    dists = result.get("distances", [[]])[0]
    print(f"\n=== {label} ({len(ids)} hits) ===")
    for i, (cid, doc, meta, dist) in enumerate(zip(ids, docs, metas, dists)):
        print(f"\n--- Hit {i+1} | distance={dist:.4f} | id={cid} ---")
        author = meta.get("author") or meta.get("author_raw") or "?"
        year = meta.get("year") or "?"
        title = meta.get("title") or meta.get("title_raw") or meta.get("source_pdf_filename") or "?"
        pgs = f"pp.{meta.get('page_start','?')}-{meta.get('page_end','?')}"
        idx = meta.get("chunk_index", "?")
        print(f"  source: {author} ({year}) — {title}")
        print(f"  loc:    {pgs} chunk={idx}")
        # Compact doc: collapse whitespace, truncate to 800 chars
        text = re.sub(r"\s+", " ", (doc or "").strip())
        print(f"  text:   {text[:800]}")
        if len(text) > 800:
            print(f"  ...({len(text)-800} more chars)")
    return list(zip(ids, docs, metas, dists))


if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else "test query"
    res = query_dpc(text, n_results=3)
    summarize(res, label="dissertation-perplexity-cache")
