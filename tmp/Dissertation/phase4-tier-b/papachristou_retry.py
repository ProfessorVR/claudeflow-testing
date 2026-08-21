#!/usr/bin/env python3
"""Retry Papachristou query with sharper text. Direct retrieve also works."""
import json
import os
import re
import sys
sys.path.insert(0, os.path.dirname(__file__))
import query as Q

QUERIES = [
    "Three kinds or grades of phantasia in Aristotle De Anima sensitive deliberative calculative",
    "sensitive phantasia calculative deliberative phantasia animals possessing reason",
    "phantasia faculty sensation thought representation phantasma Aristotle three kinds",
]

# Also do a narrower author-filtered query against rhetorical_ontology
import urllib.request

KC_ID = Q.KC_ID
CHROMA = Q.CHROMA_BASE


def query_with_author(text, author):
    vec = Q.embed(text)
    payload = {
        "query_embeddings": [vec],
        "n_results": 5,
        "include": ["documents", "metadatas", "distances"],
        "where": {"$and": [
            {"collection": {"$eq": "rhetorical_ontology"}},
            {"author_raw": {"$eq": author}},
        ]},
    }
    req = urllib.request.Request(
        f"{CHROMA}/{KC_ID}/query",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def main():
    out = []
    for qt in QUERIES:
        res = query_with_author(qt, "Papachristou, Christina")
        ids = res.get("ids", [[]])[0]
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]
        hits = [{
            "id": cid, "distance": dist, "metadata": meta, "document": doc
        } for cid, doc, meta, dist in zip(ids, docs, metas, dists)]
        out.append({"query": qt, "hits": hits})
        print(f"\n=== query: {qt[:60]} ===")
        for h in hits[:3]:
            print(f"  dist={h['distance']:.4f} chunk={h['metadata'].get('chunk_index')} pp.{h['metadata'].get('page_start')}-{h['metadata'].get('page_end')}")
            text = re.sub(r"\s+", " ", h["document"][:400]).strip()
            print(f"  text: {text}")
    out_path = os.path.join(os.path.dirname(__file__), "results", "DISS-05-G-C085-papachristou-author-filter.json")
    with open(out_path, "w") as f:
        json.dump(out, f, indent=2)
    print(f"\nSaved: {out_path}")


if __name__ == "__main__":
    main()
