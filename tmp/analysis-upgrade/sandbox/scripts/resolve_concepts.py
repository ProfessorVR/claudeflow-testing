#!/usr/bin/env python3
"""For each Nussbaum claim, embed it and find top-K matching ontology nodes via cosine."""
import json, sys, os, math, urllib.request
from pathlib import Path

SANDBOX = Path(__file__).resolve().parents[1]
EMB_FILE  = SANDBOX / "corpus" / "index" / "ontology-embeddings.jsonl"
CLAIMS    = SANDBOX / "corpus" / "index" / "Nussbaum 1985" / "nussbaum-1985-claims.jsonl"
MENTIONS  = SANDBOX / "corpus" / "index" / "Nussbaum 1985" / "nussbaum-1985-concept-mentions.jsonl"
EMBED_URL = "http://localhost:8000/embed"
TOPK = 5
MIN_SCORE = 0.55

def cos(a, b):
    s = sum(x*y for x,y in zip(a,b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(y*y for y in b))
    return s / (na*nb + 1e-12)

def embed(texts):
    body = json.dumps({"texts": texts}).encode()
    req = urllib.request.Request(EMBED_URL, data=body, headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    return d["embeddings"]

def main():
    print("[resolve] loading ontology embeddings")
    onto = [json.loads(l) for l in EMB_FILE.read_text().splitlines() if l.strip()]
    print(f"  {len(onto)} ontology embeddings")

    print("[resolve] loading claims")
    claims = [json.loads(l) for l in CLAIMS.read_text().splitlines() if l.strip()]
    print(f"  {len(claims)} claims")

    # Build claim text and embed in batches
    BATCH = 16
    mentions = []
    for i in range(0, len(claims), BATCH):
        batch = claims[i:i+BATCH]
        texts = []
        for c in batch:
            kc = c.get("key_concepts", []) or []
            t = ". ".join([
                c.get("claim",""),
                ", ".join(kc),
                c.get("ground","")
            ])
            texts.append(t[:1500])
        embs = embed(texts)
        for c, ce in zip(batch, embs):
            scored = [(cos(ce, n["embedding"]), n["name"], n.get("greek","")) for n in onto]
            scored.sort(reverse=True)
            top = scored[:TOPK]
            for score, name, greek in top:
                if score >= MIN_SCORE:
                    mentions.append({
                        "claim_id": c["id"],
                        "ontology_node": name,
                        "ontology_greek": greek,
                        "score": round(float(score), 4),
                        "author": c["author"],
                        "year": c["year"],
                        "section": c.get("section",""),
                    })
        print(f"  progress {i+len(batch)}/{len(claims)}  (top1 sample: {scored[0][1]} {scored[0][0]:.3f})")

    MENTIONS.write_text("\n".join(json.dumps(m) for m in mentions))
    print(f"[resolve] wrote {len(mentions)} mentions to {MENTIONS}")

    # Print summary: which ontology nodes Nussbaum links to
    counts = {}
    for m in mentions:
        counts[m["ontology_node"]] = counts.get(m["ontology_node"], 0) + 1
    print("\nTop 20 ontology nodes by Nussbaum claim mentions:")
    for n, c in sorted(counts.items(), key=lambda x: -x[1])[:20]:
        print(f"  {c:3d}  {n}")

if __name__ == "__main__":
    main()
