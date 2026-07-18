"""wraith-infer — GPU inference service for the WRAITH box (2x RTX 3090).

Serves two things over one FastAPI process, bound to 0.0.0.0:8100:

  * Embeddings   — Alibaba-NLP/gte-Qwen2-1.5B-instruct (1536-dim), OpenAI-compatible shape.
  * Reranking    — BAAI/bge-reranker-v2-m3 cross-encoder, Jina/Cohere-style shape.

Design constraints (see plans/wraith-retrieval-upgrade-plan-2026-07-17.md, Design decision 4):
  * Embedding model + normalization mirror the primary box's embedding-api/api_embedder.py
    EXACTLY so vectors are parity-identical (cosine > 0.999) — the two boxes must share one
    embedding space.
  * `kind == "query"` applies gte-Qwen2's query instruction prompt (sentence-transformers
    prompt_name="query"); default `kind == "document"` does not. This is the asymmetric-instruct
    behavior gte-Qwen2 expects.
  * NO storage side effects. Unlike api_embedder.py's /embed (which writes into a Chroma
    collection), this service is pure inference.
  * Reranker scores are sigmoid(logit) in [0, 1], sorted descending.

Port 8100 is deliberate: 8001/8002 are Marker OCR on WRAITH; 8000/8001/8002 are
embedder/Chroma/vLLM on the primary box. Do not reuse those numbers here.
"""

from __future__ import annotations

import os
import time
from typing import List, Literal, Optional

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# --- Configuration -----------------------------------------------------------
EMBEDDING_MODEL = os.getenv("WRAITH_EMBEDDING_MODEL", "Alibaba-NLP/gte-Qwen2-1.5B-instruct")
RERANKER_MODEL = os.getenv("WRAITH_RERANKER_MODEL", "BAAI/bge-reranker-v2-m3")
EMBEDDING_DIM = int(os.getenv("WRAITH_EMBEDDING_DIM", "1536"))
MAX_SEQ_LENGTH = int(os.getenv("WRAITH_MAX_SEQ_LENGTH", "8192"))
RERANK_MAX_LENGTH = int(os.getenv("WRAITH_RERANK_MAX_LENGTH", "1024"))
EMBED_BATCH = int(os.getenv("WRAITH_EMBED_BATCH", "32"))
RERANK_BATCH = int(os.getenv("WRAITH_RERANK_BATCH", "64"))
PORT = int(os.getenv("WRAITH_INFER_PORT", "8100"))
DEVICE = os.getenv("WRAITH_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")

# --- Model load (once, at import) --------------------------------------------
# CRITICAL parity requirement: load EXACTLY like the primary box's embedding-api/api_embedder.py
# — i.e. WITHOUT trust_remote_code. gte-Qwen2's custom remote code switches attention to
# bidirectional, which changes the embeddings entirely (cosine ~0.32 vs the corpus). The corpus
# was embedded via the stock (causal) load, so we must match it to stay in one embedding space.
print(f"[wraith-infer] loading embedding model {EMBEDDING_MODEL} on {DEVICE} ...", flush=True)
from sentence_transformers import CrossEncoder, SentenceTransformer

embedder = SentenceTransformer(EMBEDDING_MODEL, device=DEVICE)
embedder.max_seq_length = MAX_SEQ_LENGTH
print(f"[wraith-infer] embedding model loaded (max_seq_length={embedder.max_seq_length}).", flush=True)

print(f"[wraith-infer] loading reranker {RERANKER_MODEL} on {DEVICE} ...", flush=True)
reranker = CrossEncoder(RERANKER_MODEL, max_length=RERANK_MAX_LENGTH, device=DEVICE)
print("[wraith-infer] reranker loaded.", flush=True)


def _sigmoid(x: np.ndarray) -> np.ndarray:
    """Numerically stable logistic sigmoid.

    bge-reranker-v2-m3 loaded as a single-label CrossEncoder emits raw logits (Identity
    activation), so we map them into [0, 1] ourselves. Applied unconditionally: the model
    is regression/1-label, never pre-sigmoided.
    """
    return np.where(x >= 0, 1.0 / (1.0 + np.exp(-x)), np.exp(x) / (1.0 + np.exp(x)))


# --- Request / response schemas ----------------------------------------------
class EmbeddingsRequest(BaseModel):
    input: List[str] = Field(..., description="Texts to embed.")
    model: Optional[str] = None  # echoed back; the server ignores the requested name.
    kind: Literal["query", "document"] = "document"


class RerankRequest(BaseModel):
    query: str
    documents: List[str]
    model: Optional[str] = None
    top_n: Optional[int] = None


app = FastAPI(title="wraith-infer", version="1.0")


# --- Endpoints ---------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    return {
        "status": "online",
        "models": {
            "embedding": {"name": EMBEDDING_MODEL, "dim": EMBEDDING_DIM},
            "reranker": {"name": RERANKER_MODEL},
        },
        "device": DEVICE,
    }


@app.post("/v1/embeddings")
def embeddings(req: EmbeddingsRequest) -> dict:
    """OpenAI-compatible embeddings, plus a `kind` extension for query vs document mode."""
    if not req.input:
        raise HTTPException(status_code=400, detail="`input` must be a non-empty list of strings.")
    try:
        encode_kwargs = {
            "batch_size": EMBED_BATCH,
            "normalize_embeddings": True,
            "convert_to_numpy": True,
        }
        if req.kind == "query":
            encode_kwargs["prompt_name"] = "query"
        vectors = embedder.encode(req.input, **encode_kwargs)
    except Exception as exc:  # noqa: BLE001 — surface any inference failure to the caller
        raise HTTPException(status_code=500, detail=f"embedding failed: {exc}") from exc

    data = [
        {"object": "embedding", "index": i, "embedding": vec.tolist()}
        for i, vec in enumerate(vectors)
    ]
    total_tokens = sum(len(t.split()) for t in req.input)  # coarse; usage is informational only
    return {
        "object": "list",
        "data": data,
        "model": req.model or EMBEDDING_MODEL,
        "usage": {"prompt_tokens": total_tokens, "total_tokens": total_tokens},
    }


@app.post("/v1/rerank")
def rerank(req: RerankRequest) -> dict:
    """Jina/Cohere-style rerank. Returns results sorted by relevance_score descending."""
    if not req.documents:
        return {"model": req.model or RERANKER_MODEL, "results": []}
    try:
        pairs = [[req.query, doc] for doc in req.documents]
        logits = reranker.predict(pairs, batch_size=RERANK_BATCH, convert_to_numpy=True)
        scores = _sigmoid(np.asarray(logits, dtype=np.float64))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"rerank failed: {exc}") from exc

    order = np.argsort(-scores)  # descending
    results = [{"index": int(i), "relevance_score": float(scores[i])} for i in order]
    if req.top_n is not None:
        results = results[: req.top_n]
    return {"model": req.model or RERANKER_MODEL, "results": results}


@app.get("/")
def root() -> dict:
    return health()


if __name__ == "__main__":
    import uvicorn

    print(f"[wraith-infer] serving on 0.0.0.0:{PORT} (device={DEVICE}) at {time.strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
