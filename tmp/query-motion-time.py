#!/usr/bin/env python3
"""Query ChromaDB for the passage where Aristotle states we perceive motion and time together."""
import json
import urllib.request

# Get knowledge_chunks collection ID
req = urllib.request.Request(
    "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections"
)
with urllib.request.urlopen(req, timeout=10) as r:
    cols = json.loads(r.read())
col_id = next(c["id"] for c in cols if c["name"] == "knowledge_chunks")

# Get embedding for the query
query = "we perceive movement and time together"
er = urllib.request.Request(
    "http://localhost:8000/embed",
    data=json.dumps({"texts": [query]}).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(er, timeout=30) as r:
    emb_result = json.loads(r.read())
emb = emb_result.get("embeddings", [None])[0]
if emb is None:
    # try different API shape
    emb = emb_result.get("data", [{}])[0].get("embedding")

# Query Chroma with metadata filter for Physics + author Aristotle
body = json.dumps({
    "query_embeddings": [emb],
    "n_results": 8,
    "where": {"$and": [
        {"author_raw": {"$eq": "Aristotle"}},
        {"title_raw": {"$eq": "Physics"}}
    ]},
    "include": ["metadatas", "documents", "distances"]
}).encode()
q = urllib.request.Request(
    f"http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections/{col_id}/query",
    data=body,
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(q, timeout=30) as r:
    data = json.loads(r.read())

ids = data.get("ids", [[]])[0]
docs = data.get("documents", [[]])[0]
metas = data.get("metadatas", [[]])[0]
dists = data.get("distances", [[]])[0]

print(f"Top {len(ids)} matches in Aristotle's Physics (rhetorical_ontology + metaphysics collections):\n")
for i, (did, doc, m, d) in enumerate(zip(ids, docs, metas, dists)):
    page = m.get("page_start", m.get("page", "?"))
    print(f"--- Match {i+1} (distance {d:.3f}, page ~{page}) ---")
    # Find the passage about perceiving motion and time together
    txt = doc[:800] if doc else ""
    print(txt)
    print()
