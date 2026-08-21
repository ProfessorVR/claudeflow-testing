#!/usr/bin/env python3
"""Broader search: moved-mover dual aspect across DA III.10, MA, Physics VIII.5."""
import json, re, urllib.request

BASE = "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database"

def http_post(url, body):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def http_get(url):
    with urllib.request.urlopen(urllib.request.Request(url), timeout=15) as r:
        return json.loads(r.read())

def embed(text):
    r = http_post("http://localhost:8000/embed", {"texts": [text]})
    return r.get("embeddings", [None])[0] or r.get("data", [{}])[0].get("embedding")

cols = http_get(f"{BASE}/collections")
col_id = next(c["id"] for c in cols if c["name"] == "knowledge_chunks")

queries = [
    "the faculty of desire moves by being moved",
    "unmoved mover, moved mover, moved",
    "moves insofar as it is itself moved, desire",
    "both acts and is acted upon in the same respect",
    "the middle term both moves and is moved",
]

PATTERN = re.compile(
    r"patienc|agenc|patient and agent|agent and patient|acts and is acted upon|acted upon and acts|"
    r"both\s+active and passive|both\s+passive and active|active and passive|passive and active|"
    r"moves.{0,30}(insofar|in so far|qua|because|by being moved)|"
    r"moved by\s+(?:the\s+)?(object of desire|desire|desired)|"
    r"moved.{0,25}mover|middle term|faculty of desire",
    re.IGNORECASE,
)

hits = {}
for q in queries:
    emb = embed(q)
    for where in [
        {"$and": [{"author_raw": {"$eq": "Aristotle"}}, {"title_raw": {"$eq": "De Anima"}}]},
        {"$and": [{"author_raw": {"$eq": "Aristotle"}}, {"title_raw": {"$eq": "On the Soul"}}]},
        {"$and": [{"author_raw": {"$eq": "Aristotle"}}, {"title_raw": {"$eq": "De Motu Animalium"}}]},
        {"$and": [{"author_raw": {"$eq": "Aristotle"}}, {"title_raw": {"$eq": "Physics"}}]},
        {"author_raw": {"$eq": "Aristotle"}},
    ]:
        try:
            r = http_post(
                f"{BASE}/collections/{col_id}/query",
                {"query_embeddings": [emb], "n_results": 6, "where": where,
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
            if PATTERN.search(doc):
                if cid not in hits or d < hits[cid][2]:
                    hits[cid] = (m, doc, d)

print(f"matches: {len(hits)}\n")
for cid, (m, doc, d) in sorted(hits.items(), key=lambda kv: kv[1][2])[:12]:
    auth = m.get("author_raw","?"); title = m.get("title_raw","?")
    pg = m.get("page_start") or m.get("page") or "?"
    print(f"=== {cid}  [{auth} / {title} / p.{pg} / d={d:.3f}] ===")
    # find all matching windows
    for mobj in PATTERN.finditer(doc):
        s = max(0, mobj.start()-160); e = min(len(doc), mobj.end()+160)
        print(f"  …{doc[s:e].strip()}…\n")
