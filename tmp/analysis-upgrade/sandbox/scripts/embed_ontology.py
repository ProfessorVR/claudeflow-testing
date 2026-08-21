#!/usr/bin/env python3
"""Embed all ontology nodes from compiled-index.json via the local GTE-Qwen embedder."""
import json, sys, os, time, urllib.request, urllib.error
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]   # /home/dalton/projects/claudeflow-testing
SANDBOX = Path(__file__).resolve().parents[1] # tmp/analysis-upgrade/sandbox
INDEX_IN = SANDBOX / "corpus" / "index" / "compiled-index.json"
INDEX_OUT = SANDBOX / "corpus" / "index" / "compiled-index.json"   # in-place
EMB_OUT = SANDBOX / "corpus" / "index" / "ontology-embeddings.jsonl"
EMBED_URL = "http://localhost:8000/embed"
BATCH = 16

def embed_batch(texts):
    body = json.dumps({"texts": texts}).encode()
    req = urllib.request.Request(EMBED_URL, data=body, headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    return d["embeddings"]

def node_text(n):
    parts = [n.get("name","")]
    if n.get("greek"): parts.append(n["greek"])
    if n.get("transliteration") and n["transliteration"] != n.get("name"):
        parts.append(n["transliteration"])
    if n.get("translation"): parts.append(n["translation"])
    if n.get("definition"): parts.append(n["definition"][:600])
    return ". ".join(p for p in parts if p)

def main():
    idx = json.loads(INDEX_IN.read_text())
    nodes = idx.get("ontologyNodes", [])
    print(f"[embed_ontology] {len(nodes)} nodes")
    out = []
    t0 = time.time()
    for i in range(0, len(nodes), BATCH):
        batch = nodes[i:i+BATCH]
        texts = [node_text(n) for n in batch]
        try:
            embs = embed_batch(texts)
        except urllib.error.URLError as e:
            print(f"  ERROR @ {i}: {e}", file=sys.stderr); sys.exit(1)
        for n, e in zip(batch, embs):
            out.append({"name": n["name"], "greek": n.get("greek",""), "embedding": e})
        if i % 64 == 0:
            print(f"  progress {i+len(batch)}/{len(nodes)} ({time.time()-t0:.1f}s)")
    EMB_OUT.write_text("\n".join(json.dumps(x) for x in out))
    print(f"[embed_ontology] wrote {EMB_OUT}  ({EMB_OUT.stat().st_size/1024:.1f} KB)  elapsed={time.time()-t0:.1f}s")

if __name__ == "__main__":
    main()
