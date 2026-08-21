#!/usr/bin/env python3
"""
sample-gold-candidates.py — Priming helper for Phase 4 gold-set authoring.

Samples candidate claims from the compiled-index per genre, filtered by:
  - faithfulness in {author-endorsed, supported, partial} (no unsupported/speculative)
  - use_mention set (not null)
  - non-empty key_concepts
  - no SmokeTest / stray test-dir source

Writes candidates/<genre>.sample.jsonl with 3x the target count so the
human annotator has selection room. The annotator picks the ones to label,
discards the rest.

Usage:
  python3 scripts/sample-gold-candidates.py --dev-size 50 --holdout-size 20

Dependencies: stdlib only.
"""

from __future__ import annotations
import argparse
import json
import os
import random
import sys
from pathlib import Path

# Per-genre sampling rules: {genre_key: (target_n, author_predicate, primary_flag)}
DEV_DISTRIBUTION = {
    "primary_aristotle":         (15, lambda a: "Aristotle" in a and "Heidegger" not in a),
    "primary_heidegger":         (10, lambda a: "Heidegger" in a),
    "secondary_phantasia":       (15, lambda a: any(x in a for x in ("Nussbaum", "Caston", "Frede", "Papachristou", "White", "O'Gorman", "Bowin", "Hawhee", "Gonzalez"))),
    "secondary_non_phantasia":   (10, lambda a: any(x in a for x in ("Chalmers", "Metzinger", "Kim", "Barnes", "Audi", "Horgan", "Fodor", "Raven", "Silcox", "Ney", "O'Connor", "McDonnell", "Burke"))),
}

HOLDOUT_DISTRIBUTION = {
    "primary_aristotle":           (6,  lambda a: "Aristotle" in a and "Heidegger" not in a),
    "primary_heidegger":           (4,  lambda a: "Heidegger" in a),
    "secondary_phantasia":         (5,  lambda a: any(x in a for x in ("Nussbaum", "Caston", "Frede", "Papachristou", "White", "O'Gorman", "Bowin", "Hawhee", "Gonzalez"))),
    "secondary_modern_philosophy": (5,  lambda a: any(x in a for x in ("Chalmers", "Metzinger", "Kim", "Barnes", "Audi", "Horgan", "Fodor", "Raven", "Silcox", "Ney", "O'Connor", "McDonnell"))),
}

SAMPLE_MULTIPLIER = 3  # sample 3x target so annotator can pick best
ALLOWED_FAITH = {"author-endorsed", "supported", "partial"}
SKIP_SLUGS = {"releases", "test-paper", "SmokeTest", "smoketest"}


def load_all_claims(index_dir: Path) -> list[dict]:
    claims = []
    for slug_dir in sorted(index_dir.iterdir()):
        if not slug_dir.is_dir():
            continue
        if slug_dir.name in SKIP_SLUGS:
            continue
        f = slug_dir / "claims.jsonl"
        if not f.exists():
            continue
        with f.open() as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    claims.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return claims


def filter_candidate(claim: dict) -> bool:
    if claim.get("faithfulness") and claim["faithfulness"] not in ALLOWED_FAITH:
        return False
    if not claim.get("use_mention"):
        return False
    if not claim.get("key_concepts"):
        return False
    author = (claim.get("source") or {}).get("author", "")
    if any(s.lower() in author.lower() for s in SKIP_SLUGS):
        return False
    return True


def sample_per_genre(claims: list[dict], distribution: dict, rng: random.Random) -> dict:
    out = {}
    for genre, (target, pred) in distribution.items():
        pool = [c for c in claims if filter_candidate(c) and pred((c.get("source") or {}).get("author", ""))]
        n_sample = min(len(pool), target * SAMPLE_MULTIPLIER)
        picked = rng.sample(pool, n_sample) if n_sample > 0 else []
        out[genre] = picked
    return out


def write_candidates(out_dir: Path, label: str, samples: dict):
    out_dir.mkdir(parents=True, exist_ok=True)
    for genre, picks in samples.items():
        path = out_dir / f"{label}-{genre}.sample.jsonl"
        with path.open("w") as f:
            for c in picks:
                stub = {
                    "claim_id": c.get("id", ""),
                    "claim_text": c.get("claim", "")[:300],
                    "expected_ontology_nodes": None,    # LEFT UNFILLED — annotator's job
                    "rationale": None,                   # LEFT UNFILLED
                    "source": c.get("source", {}),
                    "genre": genre,
                    "notes": "",
                    "_candidate_metadata": {
                        "faithfulness": c.get("faithfulness"),
                        "use_mention": c.get("use_mention"),
                        "claim_type": c.get("claim_type"),
                        "key_concepts": c.get("key_concepts", []),
                    },
                }
                f.write(json.dumps(stub) + "\n")
        print(f"  {label}/{genre}: {len(picks)} candidates → {path.name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dev-size", type=int, default=50)
    ap.add_argument("--holdout-size", type=int, default=20)
    ap.add_argument("--index-dir", default=os.environ.get("CORPUS_INDEX_PATH", "data/corpus/index"))
    ap.add_argument("--out", default="data/gold/candidates")
    ap.add_argument("--seed", type=int, default=20260421)
    args = ap.parse_args()

    index_dir = Path(args.index_dir).resolve()
    out_dir = Path(args.out).resolve()

    if not index_dir.exists():
        print(f"ERROR: index-dir does not exist: {index_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading claims from {index_dir}...")
    all_claims = load_all_claims(index_dir)
    print(f"  loaded {len(all_claims)} claims across {len(list(index_dir.iterdir()))} dirs")

    rng = random.Random(args.seed)

    print("\nDev candidates:")
    dev_samples = sample_per_genre(all_claims, DEV_DISTRIBUTION, rng)
    write_candidates(out_dir, "dev", dev_samples)

    print("\nHoldout candidates:")
    holdout_samples = sample_per_genre(all_claims, HOLDOUT_DISTRIBUTION, rng)
    write_candidates(out_dir, "holdout", holdout_samples)

    print(f"\nDone. Candidates written to {out_dir}/")
    print(f"Edit the sampled items: set `expected_ontology_nodes` (array) and `rationale` (string).")
    print(f"Then concatenate all dev files → data/gold/resolver-gold-dev.jsonl")
    print(f"and all holdout files → data/gold/resolver-gold-holdout.jsonl")


if __name__ == "__main__":
    main()
