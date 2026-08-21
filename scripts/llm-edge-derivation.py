#!/usr/bin/env python3
"""
Sprint 3 Task 15: LLM-Assisted Edge Derivation (GraphRAG-style)

Two-stage pipeline:
  Stage 1 (pre-filter): Embed all KU claims via local gte-Qwen2 server,
           filter pairs by cosine similarity >= 0.5 (falls back to Jaccard-only
           if embedding server is unavailable).
  Stage 2 (classify):   Send filtered pairs to Claude for relationship
           classification using the canonical 15-type ontology.

Usage:
    python3 scripts/llm-edge-derivation.py --dry-run
    python3 scripts/llm-edge-derivation.py --output god-reason/llm-derived-edges.jsonl
    python3 scripts/llm-edge-derivation.py --output god-reason/llm-derived-edges.jsonl --append

Requires: ANTHROPIC_API_KEY environment variable (or .env file)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


REPO_ROOT = Path(__file__).resolve().parents[1]
KU_PATH = REPO_ROOT / "god-learn" / "knowledge.jsonl"
REASONING_PATH = REPO_ROOT / "god-reason" / "reasoning.jsonl"

EMBEDDING_URL = "http://localhost:8000/embed"

CANONICAL_RELATIONS = [
    "depends_on", "presupposes", "contrasts_with", "explains", "refines",
    "operationalizes", "supports", "completes", "defined_as", "defined_by",
    "instantiates", "is_meaning_of", "is_species_of", "is_principle_of",
]

STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
    "by", "as", "is", "are", "was", "were", "be", "been", "being", "that",
    "this", "not", "no", "but",
}


# ---------------------------------------------------------------------------
# Tokenization & Jaccard
# ---------------------------------------------------------------------------

def tokenize(text: str) -> Set[str]:
    words = re.findall(r"[a-z]+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) >= 3}


def jaccard(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


# ---------------------------------------------------------------------------
# Stage 1: Embedding pre-filter
# ---------------------------------------------------------------------------

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Get embeddings from local gte-Qwen2 server."""
    payload = json.dumps({"texts": texts})
    req = urllib.request.Request(
        EMBEDDING_URL,
        data=payload.encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            return result["embeddings"]
    except Exception as e:
        print(f"Embedding server error: {e}", file=sys.stderr)
        return []


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def embedding_server_available() -> bool:
    """Check if the embedding server is reachable with a lightweight request."""
    try:
        payload = json.dumps({"texts": ["test"]})
        req = urllib.request.Request(
            EMBEDDING_URL,
            data=payload.encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            _ = resp.read()
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Stage 2: Anthropic API classification
# ---------------------------------------------------------------------------

def classify_with_claude(claim_a: str, claim_b: str, api_key: str) -> dict:
    """Classify relationship between two KU claims using Anthropic Claude."""
    prompt = build_classification_prompt(claim_a, claim_b)
    payload = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 50,
        "messages": [{"role": "user", "content": prompt}],
    })
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload.encode(),
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            text = result["content"][0]["text"].strip().lower()
            # Extract relation from response
            for rel in CANONICAL_RELATIONS + ["none"]:
                if rel in text:
                    return {"relation": rel if rel != "none" else None, "raw_response": text}
            return {"relation": None, "raw_response": text}
    except Exception as e:
        print(f"  Claude API error: {e}", file=sys.stderr)
        return {"relation": None, "raw_response": str(e)}


# ---------------------------------------------------------------------------
# KU loading & prompt
# ---------------------------------------------------------------------------

def load_kus(path: Path) -> List[Dict[str, Any]]:
    items = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    items.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return items


def build_classification_prompt(claim_a: str, claim_b: str) -> str:
    relations_list = "\n".join(f"  - {r}" for r in CANONICAL_RELATIONS)
    return f"""Analyze the relationship between these two scholarly claims:

Claim A: "{claim_a}"
Claim B: "{claim_b}"

What is the primary relationship from Claim A to Claim B? Choose EXACTLY ONE from:
{relations_list}
  - none (no meaningful relationship)

Respond with ONLY the relation name (e.g., "presupposes" or "none"). No explanation."""


# ---------------------------------------------------------------------------
# Edge construction helpers
# ---------------------------------------------------------------------------

def extract_key_concepts(claim: str) -> str:
    """Extract a short key-concept slug from a claim for edge source/target."""
    tokens = tokenize(claim)
    # Pick the 3 most distinctive tokens (longest first as a heuristic)
    ranked = sorted(tokens, key=lambda t: -len(t))[:3]
    return "_".join(sorted(ranked)) if ranked else "unknown"


def make_edge_id(ku_a_id: str, ku_b_id: str, relation: str) -> str:
    """Deterministic edge ID from source KU, target KU, and relation."""
    raw = f"{ku_a_id}:{ku_b_id}:{relation}"
    h = hashlib.sha256(raw.encode()).hexdigest()[:12]
    return f"edge_{h}"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="LLM-assisted edge derivation")
    ap.add_argument("--threshold", type=float, default=0.15,
                    help="Jaccard overlap threshold for candidate selection (default: 0.15)")
    ap.add_argument("--cosine-threshold", type=float, default=0.5,
                    help="Cosine similarity threshold for embedding pre-filter (default: 0.5)")
    ap.add_argument("--output", default=None,
                    help="Output JSONL path (default: god-reason/llm-derived-edges.jsonl)")
    ap.add_argument("--append", action="store_true",
                    help="Also append derived edges to god-reason/reasoning.jsonl")
    ap.add_argument("--dry-run", action="store_true",
                    help="Show candidate pairs without calling LLM")
    ap.add_argument("--max-pairs", type=int, default=50,
                    help="Max pairs to classify (default: 50)")
    args = ap.parse_args()

    if not KU_PATH.exists():
        print(f"No knowledge.jsonl at {KU_PATH}", file=sys.stderr)
        return 1

    kus = load_kus(KU_PATH)
    print(f"Loaded {len(kus)} KUs")

    # ------------------------------------------------------------------
    # Compute pairwise Jaccard overlap → initial candidate set
    # ------------------------------------------------------------------
    candidates: List[Tuple[Dict, Dict, float]] = []
    for i in range(len(kus)):
        for j in range(i + 1, len(kus)):
            a_tokens = tokenize(kus[i].get("claim", ""))
            b_tokens = tokenize(kus[j].get("claim", ""))
            score = jaccard(a_tokens, b_tokens)
            if score >= args.threshold:
                candidates.append((kus[i], kus[j], score))

    candidates.sort(key=lambda x: -x[2])
    candidates = candidates[: args.max_pairs]
    print(f"Found {len(candidates)} Jaccard candidates above threshold {args.threshold}")

    if not candidates:
        print("No candidate pairs found.")
        return 0

    # ------------------------------------------------------------------
    # Stage 1: Embedding pre-filter (if server available)
    # ------------------------------------------------------------------
    use_embeddings = embedding_server_available()
    if use_embeddings:
        print("Embedding server available — running Stage 1 cosine pre-filter")
        # Collect unique claims that appear in candidates
        claim_set: dict[str, str] = {}  # ku_id -> claim
        for a, b, _ in candidates:
            claim_set[a["id"]] = a.get("claim", "")
            claim_set[b["id"]] = b.get("claim", "")

        ku_ids = list(claim_set.keys())
        claims = [claim_set[kid] for kid in ku_ids]

        embeddings = get_embeddings(claims)
        if embeddings and len(embeddings) == len(claims):
            emb_map: dict[str, list[float]] = dict(zip(ku_ids, embeddings))
            filtered: List[Tuple[Dict, Dict, float]] = []
            for a, b, jac_score in candidates:
                emb_a = emb_map.get(a["id"])
                emb_b = emb_map.get(b["id"])
                if emb_a and emb_b:
                    cos = cosine_similarity(emb_a, emb_b)
                    if cos >= args.cosine_threshold:
                        filtered.append((a, b, jac_score))
                else:
                    # Keep if embeddings missing for safety
                    filtered.append((a, b, jac_score))
            print(f"Stage 1 filter: {len(candidates)} → {len(filtered)} pairs (cosine >= {args.cosine_threshold})")
            candidates = filtered
        else:
            print("Embedding request returned incomplete results — skipping Stage 1 filter", file=sys.stderr)
    else:
        print("Embedding server not available — skipping Stage 1, using Jaccard candidates only")

    # ------------------------------------------------------------------
    # Dry-run: print candidates and exit
    # ------------------------------------------------------------------
    if args.dry_run:
        for a, b, score in candidates:
            print(f"\n  [{score:.3f}] {a.get('id', '?')} \u2194 {b.get('id', '?')}")
            print(f"    A: {a.get('claim', '')[:80]}")
            print(f"    B: {b.get('claim', '')[:80]}")
        print(f"\n[DRY RUN] Would send {len(candidates)} pairs to LLM for classification")
        return 0

    if not candidates:
        print("No candidates remain after filtering.")
        return 0

    # ------------------------------------------------------------------
    # Load API key
    # ------------------------------------------------------------------
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        env_path = REPO_ROOT / ".env"
        if env_path.exists():
            for line in env_path.read_text().split("\n"):
                if line.startswith("ANTHROPIC_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set. Use --dry-run to preview pairs.", file=sys.stderr)
        return 1

    # ------------------------------------------------------------------
    # Stage 2: LLM classification
    # ------------------------------------------------------------------
    output_path = Path(args.output) if args.output else (REPO_ROOT / "god-reason" / "llm-derived-edges.jsonl")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    derived_edges: List[Dict[str, Any]] = []
    total = len(candidates)

    for idx, (ku_a, ku_b, jac_score) in enumerate(candidates, 1):
        claim_a = ku_a.get("claim", "")
        claim_b = ku_b.get("claim", "")
        ku_a_id = ku_a.get("id", "unknown")
        ku_b_id = ku_b.get("id", "unknown")

        print(f"[{idx}/{total}] Classifying: {ku_a_id} \u2194 {ku_b_id} ... ", end="", flush=True)

        result = classify_with_claude(claim_a, claim_b, api_key)
        relation = result.get("relation")

        if relation:
            print(relation)
            edge = {
                "id": make_edge_id(ku_a_id, ku_b_id, relation),
                "source": extract_key_concepts(claim_a),
                "target": extract_key_concepts(claim_b),
                "relation": relation,
                "confidence": 0.85,
                "knowledge_ids": [ku_a_id, ku_b_id],
                "derivation": "llm",
                "generation_epoch": 1,
            }
            derived_edges.append(edge)
        else:
            print("none")

        # Rate-limit: small delay between API calls
        if idx < total:
            time.sleep(0.5)

    # ------------------------------------------------------------------
    # Write output
    # ------------------------------------------------------------------
    print(f"\nDerived {len(derived_edges)} edges from {total} pairs")

    if derived_edges:
        with output_path.open("w", encoding="utf-8") as f:
            for edge in derived_edges:
                f.write(json.dumps(edge) + "\n")
        print(f"Written to {output_path}")

        if args.append:
            with REASONING_PATH.open("a", encoding="utf-8") as f:
                for edge in derived_edges:
                    f.write(json.dumps(edge) + "\n")
            print(f"Appended {len(derived_edges)} edges to {REASONING_PATH}")
    else:
        print("No edges derived — nothing to write.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
