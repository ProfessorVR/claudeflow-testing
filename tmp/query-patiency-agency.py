#!/usr/bin/env python3
"""Find where Aristotle speaks of the moved mover in terms of patiency/agency."""
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
    "the moved mover is both patient and agent",
    "patiency and agency in the same thing",
    "being acted upon and acting, patient and agent",
    "it is moved by the object of desire and moves the animal",
    "the desiring faculty moves insofar as it is moved",
]

hits = {}
for q in queries:
    emb = embed(q)
    for where in [
        {"$and": [{"author_raw": {"$eq": "Aristotle"}}, {"title_raw": {"$eq": "De Anima"}}]},
        {"$and": [{"author_raw": {"$eq": "Aristotle"}}, {"title_raw": {"$eq": "On the Soul"}}]},
        {"author_raw": {"$eq": "Aristotle"}},
    ]:
        try:
            r = http_post(
                f"{BASE}/collections/{col_id}/query",
                {"query_embeddings": [emb], "n_results": 8, "where": where,
                 "include": ["metadatas", "documents", "distances"]},
            )
        except Exception:
            continue
        ids = r.get("ids", [[]])[0]
        docs = r.get("documents", [[]])[0]
        metas = r.get("metadatas", [[]])[0]
        dists = r.get("distances", [[]])[0]
        for cid, doc, m, d in zip(ids, docs, metas, dists):
            if not doc: continue
            if re.search(r"patienc|agenc|patient and agent|agent and patient|both\s+(act|suffer)|acted upon and acts|both\s+passive and active", doc, re.IGNORECASE):
                if cid not in hits or d < hits[cid][2]:
                    hits[cid] = (m, doc, d)
        break  # first working filter is enough per query

print(f"matches: {len(hits)}\n")
for cid, (m, doc, d) in sorted(hits.items(), key=lambda kv: kv[1][2]):
    auth = m.get("author_raw","?"); title = m.get("title_raw","?")
    pg = m.get("page_start") or m.get("page") or "?"
    print(f"--- {cid}  [{auth} / {title} / p.{pg} / d={d:.3f}] ---")
    mobj = re.search(r".{0,220}(patienc|agenc|patient and agent|agent and patient|acted upon and acts|both\s+passive and active).{0,220}",
                     doc, re.IGNORECASE | re.DOTALL)
    print((mobj.group(0) if mobj else doc[:500]).strip())
    print()
