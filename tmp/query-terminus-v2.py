#!/usr/bin/env python3
"""Broader search: any Physics chunk mentioning the terminus/end-point naming principle."""
import json, re, urllib.request

BASE = "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database"

def http_get(url):
    with urllib.request.urlopen(urllib.request.Request(url), timeout=15) as r:
        return json.loads(r.read())

def http_post(url, body):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def embed(text):
    r = http_post("http://localhost:8000/embed", {"texts": [text]})
    return r.get("embeddings", [None])[0] or r.get("data", [{}])[0].get("embedding")

cols = http_get(f"{BASE}/collections")
col_id = next(c["id"] for c in cols if c["name"] == "knowledge_chunks")

queries = [
    "motion gets its name from that to which it proceeds rather than that from which",
    "a thing changes into something, and is named after what it becomes",
    "whiteness and blackness: change gets its name from the terminus",
    "from contrary to contrary: the end gives the change its character",
    "change is classified by the end toward which it tends",
    "motion from not-white to white is called whitening",
]

hits = {}
for q in queries:
    emb = embed(q)
    r = http_post(
        f"{BASE}/collections/{col_id}/query",
        {"query_embeddings": [emb], "n_results": 15,
         "where": {"$and": [{"author_raw": {"$eq": "Aristotle"}}, {"title_raw": {"$eq": "Physics"}}]},
         "include": ["metadatas", "documents", "distances"]},
    )
    ids = r.get("ids", [[]])[0]
    docs = r.get("documents", [[]])[0]
    metas = r.get("metadatas", [[]])[0]
    dists = r.get("distances", [[]])[0]
    for cid, doc, m, d in zip(ids, docs, metas, dists):
        if cid not in hits or d < hits[cid][2]:
            hits[cid] = (m, doc, d)

# Now scan each hit for relevant language without a strict filter
print(f"top candidates from semantic pass: {len(hits)}\n")
by_dist = sorted(hits.items(), key=lambda kv: kv[1][2])[:8]
for cid, (m, doc, d) in by_dist:
    pg = m.get("page_start") or m.get("page") or "?"
    print(f"\n=== {cid}  [p.{pg} / d={d:.3f}] ===")
    # surface any relevant phrases
    for needle in ["named", "name from", "rather than", "end-point", "whiteness", "whitening",
                   "that to which", "from which", "whither", "whence", "terminus",
                   "classified", "denominated", "called after", "takes its name"]:
        idx = 0
        while True:
            j = doc.lower().find(needle, idx)
            if j < 0: break
            s = max(0, j-120); e = min(len(doc), j+180)
            snippet = doc[s:e].replace("\n", " ")
            print(f"  [{needle!r}] …{snippet}…")
            idx = j + len(needle)
