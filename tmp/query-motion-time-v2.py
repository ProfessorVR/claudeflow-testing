#!/usr/bin/env python3
"""Find the exact Bekker-numbered passage where Aristotle states we perceive
motion and time together (Physics IV.11, canonically ~219a3-9).

Strategy: text-based search on chunk documents rather than semantic only,
since the target passage uses very specific wording that the embedder may
not distinguish from surrounding IV.11 material.
"""
import json
import re
import urllib.request

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


def list_collections():
    return http_get(f"{BASE}/collections")


def query_coll(col_id, embedding, where=None, n=10, include=None):
    body = {
        "query_embeddings": [embedding],
        "n_results": n,
        "include": include or ["metadatas", "documents", "distances"],
    }
    if where:
        body["where"] = where
    return http_post(f"{BASE}/collections/{col_id}/query", body)


def get_doc(col_id, chunk_id):
    body = {"ids": [chunk_id], "include": ["metadatas", "documents"]}
    return http_post(f"{BASE}/collections/{col_id}/get", body)


def main():
    cols = list_collections()
    physics_cols = [c for c in cols if c["name"] in
                    ("knowledge_chunks", "rhetorical_ontology", "metaphysics")]
    print(f"Collections: {[c['name'] for c in physics_cols]}")

    # Phrasings likely to land on the target passage
    queries = [
        "we perceive motion and time together, for even when it is dark and we are not being affected through the body",
        "if any movement takes place in the mind we at once suppose some time has elapsed",
        "time is the number of motion in respect of the before and after",
    ]

    seen = set()
    for col in physics_cols:
        print(f"\n{'='*70}\nCollection: {col['name']}  (id {col['id'][:8]}…)\n{'='*70}")
        for q in queries:
            emb = embed(q)
            where = {"$and": [
                {"author_raw": {"$eq": "Aristotle"}},
                {"title_raw": {"$eq": "Physics"}},
            ]}
            try:
                r = query_coll(col["id"], emb, where=where, n=6)
            except Exception:
                try:
                    r = query_coll(col["id"], emb, where=None, n=6)
                except Exception as e:
                    print(f"  query failed: {e}"); continue

            ids = r.get("ids", [[]])[0]
            docs = r.get("documents", [[]])[0]
            metas = r.get("metadatas", [[]])[0]
            dists = r.get("distances", [[]])[0]
            print(f"\n-- query: {q[:60]}…")
            for cid, doc, m, d in zip(ids, docs, metas, dists):
                if cid in seen:
                    continue
                seen.add(cid)
                # only show if seems related
                if doc and re.search(r"(movement|motion).{0,40}(time|together)|time.{0,40}(movement|motion)|in the mind|if any movement|when it is dark",
                                     doc, re.IGNORECASE):
                    auth = m.get("author_raw") or m.get("author") or "?"
                    title = m.get("title_raw") or m.get("title") or "?"
                    pg = m.get("page_start") or m.get("page") or "?"
                    bekker = m.get("bekker") or m.get("bekker_page") or m.get("bekker_line") or ""
                    print(f"\n  ✓ match [{auth} / {title} / p.{pg} / bekker:{bekker} / d={d:.3f}]")
                    print(f"    id: {cid}")
                    # show the matching window
                    m_obj = re.search(r".{0,180}(movement|motion).{0,180}(time|together).{0,180}|.{0,120}(if any movement).{0,200}",
                                      doc, re.IGNORECASE | re.DOTALL)
                    snippet = (m_obj.group(0) if m_obj else doc)[:600]
                    print(f"    snippet: {snippet.strip()}")


if __name__ == "__main__":
    main()
