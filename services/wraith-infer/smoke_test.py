#!/usr/bin/env python3
"""Phase 0 acceptance harness — run from the PRIMARY box (RTX 5090), not WRAITH.

Verifies the deployed wraith-infer service against the plan's Phase 0 acceptance criteria:
  1. /health reports the embedding model + dim 1536 + reranker + cuda.
  2. Embedding parity: same text on local :8000/embed vs WRAITH /v1/embeddings (kind=document)
     has cosine similarity > 0.999 (must share one embedding space).
  3. Query-kind differs from document-kind for the same text (cosine < 0.999).
  4. Rerank sanity: an on-topic passage ranks first with a clearly higher score than off-topic ones.
  5. Throughput: 1000 rerank pairs < 30s; 1000-doc embed batch < 60s.

Usage:
  python smoke_test.py                          # WRAITH=192.168.50.22:8100, local=127.0.0.1:8000
  WRAITH_URL=http://192.168.50.22:8100 LOCAL_EMBED_URL=http://127.0.0.1:8000 python smoke_test.py
"""
import os
import sys
import time

import numpy as np
import requests

WRAITH_URL = os.getenv("WRAITH_URL", "http://192.168.50.22:8100").rstrip("/")
LOCAL_EMBED_URL = os.getenv("LOCAL_EMBED_URL", "http://127.0.0.1:8000").rstrip("/")

PASS, FAIL = "PASS", "FAIL"
results: list[tuple[str, str, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, PASS if ok else FAIL, detail))
    print(f"[{PASS if ok else FAIL}] {name}  {detail}")


def cosine(a, b) -> float:
    a, b = np.asarray(a, dtype=np.float64), np.asarray(b, dtype=np.float64)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))


def wraith_embed(texts, kind="document"):
    r = requests.post(
        f"{WRAITH_URL}/v1/embeddings",
        json={"model": "gte-Qwen2-1.5B-instruct", "input": texts, "kind": kind},
        timeout=120,
    )
    r.raise_for_status()
    data = sorted(r.json()["data"], key=lambda d: d["index"])
    return [d["embedding"] for d in data]


def wraith_rerank(query, documents, top_n=None):
    payload = {"model": "bge-reranker-v2-m3", "query": query, "documents": documents}
    if top_n is not None:
        payload["top_n"] = top_n
    r = requests.post(f"{WRAITH_URL}/v1/rerank", json=payload, timeout=120)
    r.raise_for_status()
    return r.json()["results"]


def local_embed_query(text):
    """Local :8000 /search embeds the query (is_query=True) but does not return the vector;
    /embed returns the vector in document mode. Use /embed for the parity (document) check."""
    r = requests.post(f"{LOCAL_EMBED_URL}/embed", json={"texts": [text]}, timeout=120)
    r.raise_for_status()
    return r.json()["embeddings"][0]


def main() -> int:
    # 1. health
    try:
        h = requests.get(f"{WRAITH_URL}/health", timeout=10).json()
        dim = h["models"]["embedding"]["dim"]
        record("health", dim == 1536 and h.get("device", "").startswith("cuda"),
               f"dim={dim} device={h.get('device')} reranker={h['models']['reranker']['name']}")
    except Exception as exc:  # noqa: BLE001
        record("health", False, f"error: {exc}")
        print("\nAborting: service unreachable.")
        return 1

    # 2. embedding parity (document mode) vs local :8000
    text = "test sentence"
    try:
        w_doc = wraith_embed([text], kind="document")[0]
        l_doc = local_embed_query(text)
        sim = cosine(w_doc, l_doc)
        record("embedding parity (doc vs local :8000)", sim > 0.999, f"cosine={sim:.6f}")
    except Exception as exc:  # noqa: BLE001
        record("embedding parity", False, f"error: {exc}")

    # 3. query-kind vs document-kind differ
    try:
        w_q = wraith_embed([text], kind="query")[0]
        sim_qd = cosine(w_q, w_doc)
        record("query-kind != document-kind", sim_qd < 0.999, f"cosine={sim_qd:.6f}")
    except Exception as exc:  # noqa: BLE001
        record("query vs doc kind", False, f"error: {exc}")

    # 4. rerank sanity
    try:
        q = "boredom in Heidegger"
        passages = [
            "Heidegger's analysis of profound boredom in The Fundamental Concepts of Metaphysics.",
            "A recipe for sourdough bread requires flour, water, salt, and patience.",
            "The quarterly earnings report showed a 3% increase in net revenue.",
        ]
        rr = wraith_rerank(q, passages)
        top = rr[0]
        on_topic_first = top["index"] == 0
        gap = top["relevance_score"] - max(x["relevance_score"] for x in rr if x["index"] != 0)
        record("rerank sanity (on-topic first)", on_topic_first and gap > 0.1,
               f"top_idx={top['index']} score={top['relevance_score']:.4f} gap={gap:.4f}")
    except Exception as exc:  # noqa: BLE001
        record("rerank sanity", False, f"error: {exc}")

    # 5. throughput
    try:
        docs = [f"Passage number {i} about virtual environments and phenomenology." for i in range(1000)]
        t0 = time.time()
        wraith_rerank("world-disclosedness in virtual environments", docs)
        dt_rr = time.time() - t0
        record("throughput rerank 1000 pairs < 30s", dt_rr < 30, f"{dt_rr:.1f}s")

        t0 = time.time()
        wraith_embed(docs, kind="document")
        dt_emb = time.time() - t0
        record("throughput embed 1000 docs < 60s", dt_emb < 60, f"{dt_emb:.1f}s")
    except Exception as exc:  # noqa: BLE001
        record("throughput", False, f"error: {exc}")

    # summary
    n_fail = sum(1 for _, s, _ in results if s == FAIL)
    print("\n=== Phase 0 acceptance summary ===")
    for name, status, detail in results:
        print(f"  [{status}] {name}  {detail}")
    print(f"\n{len(results) - n_fail}/{len(results)} passed.")
    return 1 if n_fail else 0


if __name__ == "__main__":
    sys.exit(main())
