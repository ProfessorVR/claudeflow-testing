#!/usr/bin/env python3
"""Find where Aristotle claims motion is named/known from its terminus, not its starting point."""
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
    "change takes its name from the end toward which it proceeds, not from its starting point",
    "motion is named and defined by that to which it goes, its terminus",
    "a thing is called after that which it becomes, not that from which",
    "change gets its name from the that-to-which, not the that-from-which",
    "motion is defined rather by the end than by the beginning",
    "every change is from something to something, named from the goal",
    "we speak of becoming healthy rather than becoming from sickness",
]

PATTERN = re.compile(
    r"(named|denominat|called|defined|characteriz|designat).{0,80}(end|goal|terminus|that.to.which|that at which|whither|which it becomes|which it changes to|which it issues)|"
    r"(takes its name|derive.{0,30}name|get.{0,20}name).{0,80}(end|goal|terminus|that to which|whither)|"
    r"rather.{0,30}(end|goal|to which|terminus).{0,60}(beginning|from which|starting|privation)|"
    r"that to which.{0,30}(rather than|more than|not).{0,30}(that from which|starting|whence)|"
    r"the terminus|which it changes to|whither.{0,40}whence|whence.{0,40}whither",
    re.IGNORECASE | re.DOTALL,
)

hits = {}
for q in queries:
    emb = embed(q)
    for where in [
        {"$and": [{"author_raw": {"$eq": "Aristotle"}}, {"title_raw": {"$eq": "Physics"}}]},
        {"author_raw": {"$eq": "Aristotle"}},
    ]:
        try:
            r = http_post(
                f"{BASE}/collections/{col_id}/query",
                {"query_embeddings": [emb], "n_results": 10, "where": where,
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
        break

print(f"matches: {len(hits)}\n")
for cid, (m, doc, d) in sorted(hits.items(), key=lambda kv: kv[1][2])[:10]:
    title = m.get("title_raw","?"); pg = m.get("page_start") or m.get("page") or "?"
    print(f"=== {cid}  [{title} / p.{pg} / d={d:.3f}] ===")
    for mobj in PATTERN.finditer(doc):
        s = max(0, mobj.start()-200); e = min(len(doc), mobj.end()+200)
        print(f"  …{doc[s:e].strip()}…\n")
