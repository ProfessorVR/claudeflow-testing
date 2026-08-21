#!/usr/bin/env python3
"""Resolve extractor claims (new schema) → ontology-node concept mentions.

Changes from analysis-upgrade/sandbox/scripts/resolve_concepts.py:
- Accepts any claim file (path via CLI) instead of Nussbaum-hardcoded.
- Uses the new schema fields: `claim`, `key_concepts`, `ground`, `speaker`,
  `stance`, `use_mention`, `faithfulness`, `grounding.extracted_anchor`.
- Filters: skip claims with faithfulness == 'unsupported'.
- Writes `concept-mentions.jsonl` alongside the claim file.
"""
from __future__ import annotations
import argparse
import json
import math
import os
import sys
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]  # integration-sandbox
EMB_FILE = BASE / "corpus" / "index" / "ontology-embeddings.jsonl"
EMBED_URL = os.environ.get("EMBED_URL", "http://localhost:8000/embed")
TOPK = 5
MIN_SCORE = 0.55


def cos(a, b):
    s = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return s / (na * nb + 1e-12)


def embed(texts: list[str]) -> list[list[float]]:
    body = json.dumps({"texts": texts}).encode()
    req = urllib.request.Request(EMBED_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    return d["embeddings"]


def run(claims_path: Path, out_path: Path) -> None:
    print(f"[resolve] loading ontology embeddings: {EMB_FILE}")
    onto = [json.loads(l) for l in EMB_FILE.read_text().splitlines() if l.strip()]
    print(f"  {len(onto)} ontology embeddings")

    all_claims = [json.loads(l) for l in claims_path.read_text().splitlines() if l.strip()]
    # filter: drop unsupported faithfulness (hallucinated claims)
    claims = [c for c in all_claims if c.get("faithfulness") != "unsupported"]
    dropped = len(all_claims) - len(claims)
    print(f"[resolve] {len(claims)}/{len(all_claims)} claims after dropping {dropped} unsupported")

    BATCH = 16
    mentions: list[dict] = []
    for i in range(0, len(claims), BATCH):
        batch = claims[i : i + BATCH]
        texts = []
        for c in batch:
            kc = c.get("key_concepts", []) or []
            t = ". ".join([c.get("claim", ""), ", ".join(kc), c.get("ground", "")])
            texts.append(t[:1500])
        embs = embed(texts)
        for c, ce in zip(batch, embs):
            scored = sorted(
                [(cos(ce, n["embedding"]), n["name"], n.get("greek", "")) for n in onto],
                reverse=True,
            )
            for score, name, greek in scored[:TOPK]:
                if score < MIN_SCORE:
                    continue
                mentions.append({
                    "claim_id": c["id"],
                    "ontology_node": name,
                    "ontology_greek": greek,
                    "score": round(float(score), 4),
                    "author": c.get("source", {}).get("author", c.get("author", "")),
                    "year": c.get("source", {}).get("year", c.get("year", "")),
                    "speaker": c.get("speaker", ""),
                    "stance": c.get("stance", ""),
                    "use_mention": c.get("use_mention", ""),
                    "claim_type": c.get("claim_type", ""),
                    "faithfulness": c.get("faithfulness", ""),
                    "provenance": {
                        "bekker": c.get("grounding", {}).get("extracted_anchor") or c.get("nearby_provenance", ""),
                        "chunk_id": c.get("chunk_id", ""),
                        "char_start": c.get("grounding", {}).get("char_start"),
                        "char_end": c.get("grounding", {}).get("char_end"),
                    },
                })
        print(f"  progress {i+len(batch)}/{len(claims)}  (top1: {scored[0][1]} {scored[0][0]:.3f})")

    out_path.write_text("\n".join(json.dumps(m) for m in mentions))
    print(f"[resolve] wrote {len(mentions)} mentions → {out_path}")

    # summary
    from collections import Counter
    c = Counter(m["ontology_node"] for m in mentions)
    print("Top-15 linked ontology nodes:")
    for name, n in c.most_common(15):
        print(f"  {n:3d}  {name}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--claims", required=True, help="path to claims.jsonl (new schema)")
    p.add_argument("--out", required=True, help="path to write concept-mentions.jsonl")
    args = p.parse_args()
    run(Path(args.claims), Path(args.out))


if __name__ == "__main__":
    main()
