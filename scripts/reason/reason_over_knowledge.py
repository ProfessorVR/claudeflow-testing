#!/usr/bin/env python3
"""
Phase 7: Cross-document reasoning over promoted knowledge units.

- Input:  god-learn/knowledge.jsonl
- Output: god-reason/reasoning.jsonl + god-reason/index.json

Constraints:
- NO Chroma queries
- NO embeddings
- Deterministic output
- Every reasoning unit references >= 2 knowledge units
- No new uncited claims: reasoning units only relate existing claims
"""

from __future__ import annotations

from typing import Dict, Iterable, List, Set, Tuple

import argparse
import hashlib
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple


# Canonical relation vocabulary (aligned with manual analysis pipelines)
# See docs/research/ku-reasoning-edge-system-analysis.md §11 Sprint 1 Task 5
VOCAB_MAP: Dict[str, str] = {
    "contrast": "contrasts_with",
    "elaboration": "explains",
    "is_variant_of": "is_variant_of",  # near-duplicate textual similarity
    "supports": "supports",
    "similar": "supports",  # weak support without causal mechanism
    "defined_as": "defined_as",
    "refines": "refines",
    "presupposes": "presupposes",
    # Legacy mappings (kept for backward compatibility with existing edges)
    "inheritance": "is_variant_of",
    "support": "supports",
}

CANONICAL_RELATIONS: Set[str] = {
    "depends_on", "presupposes", "contrasts_with", "explains", "refines",
    "operationalizes", "supports", "completes", "defined_as", "defined_by",
    "instantiates", "is_meaning_of", "is_species_of", "is_principle_of",
    "is_variant_of",
}

STOPWORDS: Set[str] = {
    # small, fixed list to keep determinism simple (expand if needed)
    "the","a","an","and","or","of","to","in","on","for","with","by","as","is","are",
    "was","were","be","been","being","that","this","these","those","it","its","at",
    "from","into","over","under","between","through","during","without","within",
    "not","no","but","however","rather","than","then","so","such","also","more","most",
}

CONTRAST_MARKERS = {"however", "but", "rather", "yet", "nevertheless", "although", "whereas"}
ELAB_MARKERS = {"for example", "e.g.", "specifically", "in particular", "thus", "therefore", "because"}
DEFINITION_MARKERS = {"is defined as", "means", "refers to", "is understood as", "denotes"}
REFINEMENT_MARKERS = {"more precisely", "narrower", "specifically", "in a stricter sense", "properly speaking"}
PRESUPPOSITION_MARKERS = {"requires", "assumes", "prior to", "precondition", "only possible if"}

TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z\-']+")

@dataclass(frozen=True)
class KnowledgeUnit:
    ku_id: str
    claim: str
    sources: list
    meta: dict


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def stable_reason_id(parts: List[str]) -> str:
    # ru_<16 hex>
    h = sha256_hex("|".join(parts))[:16]
    return f"ru_{h}"


def normalize_text(s: str) -> str:
    return " ".join(s.strip().split())


def tokenize(claim: str) -> List[str]:
    claim_l = claim.lower()
    toks = [m.group(0) for m in TOKEN_RE.finditer(claim_l)]
    toks = [t for t in toks if t not in STOPWORDS and len(t) >= 3]
    return toks

def char_ngrams(s: str, n: int = 5) -> set[str]:
    s = re.sub(r"\s+", " ", s.lower()).strip()
    s = re.sub(r"[^a-z0-9 \-']", "", s)  # conservative normalization
    if len(s) < n:
        return {s} if s else set()
    return {s[i:i+n] for i in range(len(s) - n + 1)}


def term_set(claim: str) -> Set[str]:
    return set(tokenize(claim))


def jaccard(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def contains_any_phrase(text_l: str, phrases: Set[str]) -> bool:
    return any(p in text_l for p in phrases)


def infer_relation(claim_a: str, claim_b: str, score: float, shared: Set[str]) -> str | None:
    """
    Char n-gram similarity-based relation inference (no curated keyword lists).
    `score` is Jaccard(char_ngrams(a), char_ngrams(b)).
    """
    a_l = claim_a.lower()
    b_l = claim_b.lower()

    # Definition detection
    if score >= 0.06 and (contains_any_phrase(a_l, DEFINITION_MARKERS) or contains_any_phrase(b_l, DEFINITION_MARKERS)):
        return "defined_as"

    # Refinement detection
    if score >= 0.06 and (contains_any_phrase(a_l, REFINEMENT_MARKERS) or contains_any_phrase(b_l, REFINEMENT_MARKERS)):
        return "refines"

    # Presupposition detection
    if score >= 0.06 and (contains_any_phrase(a_l, PRESUPPOSITION_MARKERS) or contains_any_phrase(b_l, PRESUPPOSITION_MARKERS)):
        return "presupposes"

    # Contrast / elaboration rely on explicit discourse markers
    if score >= 0.06 and (contains_any_phrase(a_l, CONTRAST_MARKERS) or contains_any_phrase(b_l, CONTRAST_MARKERS)):
        return "contrast"

    if score >= 0.06 and (contains_any_phrase(a_l, ELAB_MARKERS) or contains_any_phrase(b_l, ELAB_MARKERS)):
        return "elaboration"

    # Near-duplicate / very strong textual similarity → distinct from logical support
    if score >= 0.18:
        return "is_variant_of"

    # Default: logical corroboration when there is modest similarity
    if score >= 0.08:
        return "supports"

    return None





def load_knowledge(path: Path) -> List[KnowledgeUnit]:
    units: List[KnowledgeUnit] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            ku_id = obj.get("id") or obj.get("ku_id")
            if not ku_id:
                raise ValueError(f"Missing knowledge id at line {line_no}")
            claim = normalize_text(obj.get("claim", ""))
            sources = obj.get("sources", obj.get("citations", []))
            meta = {k: v for k, v in obj.items() if k not in ("id", "ku_id", "claim", "sources", "citations")}
            units.append(KnowledgeUnit(ku_id=ku_id, claim=claim, sources=sources, meta=meta))

    # Deterministic base ordering
    units.sort(key=lambda u: u.ku_id)
    return units

# Cross-author relations that are semantically valid across philosophical traditions.
# "supports" is forbidden cross-author UNLESS a curated cross-pipeline hook licenses it.
CROSS_AUTHOR_ALLOWED: Set[str] = {
    "contrasts_with", "explains", "defined_as", "refines", "presupposes",
}

# Hook-licensed pairs: if a cross-pipeline hook bridges two concepts, "supports" is allowed
# because the relationship has been manually verified by the corpus curator.
_hook_licensed_pairs: Set[frozenset] | None = None

def load_hook_licensed_pairs() -> Set[frozenset]:
    """Load cross-pipeline hooks and build a set of licensed concept pairs."""
    global _hook_licensed_pairs
    if _hook_licensed_pairs is not None:
        return _hook_licensed_pairs

    _hook_licensed_pairs = set()
    index_path = Path("corpus/index/compiled-index.json")
    if not index_path.exists():
        return _hook_licensed_pairs

    try:
        with open(index_path, encoding="utf-8") as f:
            index = json.load(f)
        for hook in index.get("crossPipelineHooks", []):
            src = (hook.get("sourceConcept") or "").lower().strip()
            tgt = (hook.get("targetConcept") or "").lower().strip()
            if src and tgt:
                _hook_licensed_pairs.add(frozenset({src, tgt}))
    except Exception:
        pass

    return _hook_licensed_pairs


def is_hook_licensed(claim_a: str, claim_b: str) -> bool:
    """Check if two claims discuss concepts bridged by a cross-pipeline hook."""
    pairs = load_hook_licensed_pairs()
    if not pairs:
        return False
    a_lower = claim_a.lower()
    b_lower = claim_b.lower()
    for pair in pairs:
        terms = list(pair)
        if len(terms) == 2:
            t0, t1 = terms
            # Check if each claim contains one side of the bridge
            if ((t0 in a_lower and t1 in b_lower) or (t1 in a_lower and t0 in b_lower)):
                return True
    return False


def topic_bucket(units: List[KnowledgeUnit], query: str | None) -> Dict[str, List[KnowledgeUnit]]:
    """
    Author-scoped bucketing: group KUs by primary author.
    - If --query provided: single filtered bucket "query"
    - Else: one bucket per distinct primary author (from sources[0].author)
    Replaces the disabled keyword-vocabulary bucketing and the single-bucket fallback.
    """
    if query:
        return {"query": [u for u in units if query.lower() in u.claim.lower()]}

    buckets: Dict[str, List[KnowledgeUnit]] = {}
    for u in units:
        author = "unknown"
        if u.sources and isinstance(u.sources, list) and len(u.sources) > 0:
            src = u.sources[0]
            if isinstance(src, dict):
                author = src.get("author", "unknown")
        author = author.strip() or "unknown"
        buckets.setdefault(author, []).append(u)

    # Sort KUs within each bucket by ku_id (determinism)
    for bucket in buckets.values():
        bucket.sort(key=lambda u: u.ku_id)

    return buckets


def build_reasoning(
    units: List[KnowledgeUnit],
    query: str | None,
    max_pairs: int,
    top_k_per_unit: int,
) -> Tuple[List[dict], dict]:

    buckets = topic_bucket(units, query=query)

    reasoning_rows: List[dict] = []
    stats = {
        "units_total": len(units),
        "buckets": {k: len(v) for k, v in buckets.items()},
        "pairs_considered": 0,
        "reasoning_units_emitted": 0,
        "reasoning_units_pre_prune": 0,
        "reasoning_units_post_prune": 0,
        "top_k_per_unit": top_k_per_unit,
        "author_bucketing": {
            "enabled": True,
            "author_count": len(buckets),
            "cross_author_allowed_relations": sorted(CROSS_AUTHOR_ALLOWED),
        },
    }

    for topic in sorted(buckets.keys()):
        bucket = buckets[topic]
        # pairwise comparisons, deterministic order
        n = len(bucket)
        for i in range(n):
            for j in range(i + 1, n):
                if stats["pairs_considered"] >= max_pairs:
                    break
                a = bucket[i]
                b = bucket[j]

                ga = char_ngrams(a.claim, n=4)
                gb = char_ngrams(b.claim, n=4)
                shared = ga & gb
                score = jaccard(ga, gb)
                raw_rel = infer_relation(a.claim, b.claim, score, shared)

                stats["pairs_considered"] += 1
                if raw_rel is None:
                    continue

                # Map to canonical relation vocabulary
                rel = VOCAB_MAP.get(raw_rel, raw_rel)
                if rel not in CANONICAL_RELATIONS:
                    continue  # drop unmapped / non-canonical relations

                # Deterministic small sample of shared n-grams (avoid huge JSONL rows)
                shared_sample = sorted(shared)[:25]

                # Stable hash from canonical fields only (do NOT hash the full shared set)
                canonical = {
                    "relation": rel,
                    "topic": topic,
                    "knowledge_ids": [a.ku_id, b.ku_id],
                    "shared_ngrams_sample": shared_sample,
                }
                canonical_s = json.dumps(canonical, sort_keys=True, ensure_ascii=False)
                rid = stable_reason_id([canonical_s])

                row = {
                    "reason_id": rid,
                    "relation": rel,
                    "topic": topic,
                    "knowledge_ids": [a.ku_id, b.ku_id],
                    "shared_ngrams_sample": shared_sample,
                    "shared_ngrams_count": len(shared),
                    "evidence": [
                        {"ku_id": a.ku_id, "claim": a.claim, "sources": a.sources},
                        {"ku_id": b.ku_id, "claim": b.claim, "sources": b.sources},
                    ],
                    "score": round(score, 6),
                    "hash": "sha256:" + sha256_hex(canonical_s),
                }
                reasoning_rows.append(row)

            if stats["pairs_considered"] >= max_pairs:
                break

    # --- Cross-author pass (constrained relation vocabulary) ---
    # Compare KUs across author boundaries, but ONLY allow relations that are
    # semantically valid across philosophical traditions. "supports" is forbidden
    # to prevent false harmonization of distinct frameworks.
    author_keys = sorted(buckets.keys())
    for ai in range(len(author_keys)):
        for aj in range(ai + 1, len(author_keys)):
            if stats["pairs_considered"] >= max_pairs:
                break
            bucket_a = buckets[author_keys[ai]]
            bucket_b = buckets[author_keys[aj]]
            cross_topic = f"cross:{author_keys[ai]}__vs__{author_keys[aj]}"

            for ua in bucket_a:
                if stats["pairs_considered"] >= max_pairs:
                    break
                for ub in bucket_b:
                    if stats["pairs_considered"] >= max_pairs:
                        break

                    ga = char_ngrams(ua.claim, n=4)
                    gb = char_ngrams(ub.claim, n=4)
                    shared = ga & gb
                    score = jaccard(ga, gb)
                    raw_rel = infer_relation(ua.claim, ub.claim, score, shared)

                    stats["pairs_considered"] += 1
                    if raw_rel is None:
                        continue

                    rel = VOCAB_MAP.get(raw_rel, raw_rel)
                    if rel not in CANONICAL_RELATIONS:
                        continue
                    # CONSTRAINT: forbid "supports" and "is_variant_of" across authors
                    # EXCEPTION: allow "supports" if a curated cross-pipeline hook licenses
                    # the relationship between the two concepts
                    if rel not in CROSS_AUTHOR_ALLOWED:
                        if rel == "supports" and is_hook_licensed(ua.claim, ub.claim):
                            pass  # Hook licenses this cross-author supports edge
                        else:
                            continue

                    shared_sample = sorted(shared)[:25]
                    canonical = {
                        "relation": rel,
                        "topic": cross_topic,
                        "knowledge_ids": [ua.ku_id, ub.ku_id],
                        "shared_ngrams_sample": shared_sample,
                    }
                    canonical_s = json.dumps(canonical, sort_keys=True, ensure_ascii=False)
                    rid = stable_reason_id([canonical_s])

                    row = {
                        "reason_id": rid,
                        "relation": rel,
                        "topic": cross_topic,
                        "knowledge_ids": [ua.ku_id, ub.ku_id],
                        "shared_ngrams_sample": shared_sample,
                        "shared_ngrams_count": len(shared),
                        "evidence": [
                            {"ku_id": ua.ku_id, "claim": ua.claim, "sources": ua.sources},
                            {"ku_id": ub.ku_id, "claim": ub.claim, "sources": ub.sources},
                        ],
                        "score": round(score, 6),
                        "hash": "sha256:" + sha256_hex(canonical_s),
                    }
                    reasoning_rows.append(row)

        if stats["pairs_considered"] >= max_pairs:
            break

    # Deterministic ordering of emitted reasoning units (pre-prune)
    reasoning_rows.sort(key=lambda r: (r["topic"], r["relation"], r["reason_id"]))
    stats["reasoning_units_pre_prune"] = len(reasoning_rows)

    # --- Deterministic top-K pruning per knowledge unit ---
    def prune_top_k_per_unit(rows: List[dict], k: int) -> List[dict]:
        if k <= 0:
            return rows

        by_unit: Dict[str, List[dict]] = {}
        for r in rows:
            a_id, b_id = r["knowledge_ids"]
            by_unit.setdefault(a_id, []).append(r)
            by_unit.setdefault(b_id, []).append(r)

        keep_ids: Set[str] = set()
        for ku_id, edges in by_unit.items():
            # Highest score first; tie-break deterministically by reason_id
            edges_sorted = sorted(edges, key=lambda e: (-e["score"], e["reason_id"]))
            for e in edges_sorted[:k]:
                keep_ids.add(e["reason_id"])

        pruned = [r for r in rows if r["reason_id"] in keep_ids]
        pruned.sort(key=lambda r: (r["topic"], r["relation"], r["reason_id"]))
        return pruned

    reasoning_rows = prune_top_k_per_unit(reasoning_rows, top_k_per_unit)
    stats["reasoning_units_post_prune"] = len(reasoning_rows)

    stats["reasoning_units_emitted"] = len(reasoning_rows)
    return reasoning_rows, stats



def write_outputs(out_dir: Path, rows: List[dict], stats: dict, query: str | None) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    reasoning_path = out_dir / "reasoning.jsonl"
    index_path = out_dir / "index.json"

    with reasoning_path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    index = {
        "phase": 7,
        "input": "god-learn/knowledge.jsonl",
        "output": {
            "reasoning_jsonl": str(reasoning_path),
            "index_json": str(index_path),
        },
        "query": query,
        "stats": stats,
        "determinism": {
            "sorted_units_by": "ku_id",
            "sorted_buckets_by": "topic key",
            "sorted_outputs_by": "(topic, relation, reason_id)",
            "hashing": "sha256(canonical_json_sorted_keys)",
        },
    }
    with index_path.open("w", encoding="utf-8") as f:
        f.write(json.dumps(index, indent=2, ensure_ascii=False) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--knowledge", default="god-learn/knowledge.jsonl")
    ap.add_argument("--out", default="god-reason")
    ap.add_argument("--query", default=None, help="Optional substring filter on claim text")
    ap.add_argument("--max_pairs", type=int, default=200000, help="Safety cap on pairwise comparisons")
    ap.add_argument("--top_k_per_unit", type=int, default=12,
                help="Keep only top-K edges per knowledge unit (0 disables)")

    args = ap.parse_args()

    knowledge_path = Path(args.knowledge)
    if not knowledge_path.exists():
        raise SystemExit(f"Missing input: {knowledge_path}")

    units = load_knowledge(knowledge_path)
    rows, stats = build_reasoning(
        units,
        query=args.query,
        max_pairs=args.max_pairs,
        top_k_per_unit=args.top_k_per_unit,
    )
    write_outputs(Path(args.out), rows, stats, query=args.query)

    print(f"[Phase7:reason] units={len(units)} reasoning={len(rows)} out={args.out}")


if __name__ == "__main__":
    main()
