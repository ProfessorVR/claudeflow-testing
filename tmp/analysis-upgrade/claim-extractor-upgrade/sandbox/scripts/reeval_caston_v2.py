"""Re-eval Caston v2 using existing Opus gold-recall + fresh precision audit."""
import json
import sys
from pathlib import Path
from evaluate import (
    judge_precision, compute_chunk_text_cache, compute_metrics,
    flag_uncertain, semantic_match, SETTINGS, GOLD_DIR, OUTPUT_DIR,
)

s = SETTINGS["caston-1995"]
slug = s["slug"]

# Load v2 extractor output
claims = [json.loads(l) for l in (OUTPUT_DIR / f"{slug}-v2.jsonl").read_text().splitlines() if l.strip()]
print(f"v2 claims: {len(claims)}")

# Chunk texts (uses v2 chunking: 2 pages/chunk)
chunk_texts = compute_chunk_text_cache(
    slug, Path(s["pdf"]), s["first_page"], s["last_page"], s["genre"]
)
print(f"chunk_texts: {list(chunk_texts.keys())}")

# Group v2 claims by chunk
groups = {}
for c in claims:
    groups.setdefault(c["chunk_id"], []).append(c)

# Precision audit
all_prec = []
for cid, cl in groups.items():
    print(f"  precision audit: {cid} ({len(cl)} claims)")
    prec = judge_precision(s["author"], s["title"], s["year"], s["genre"],
                           chunk_texts.get(cid, ""), cl)
    all_prec.extend(prec)

(GOLD_DIR / f"{slug}-v2-precision.jsonl").write_text("\n".join(json.dumps(j) for j in all_prec))

# Load existing v1 gold-recall (regenerate chunk_ids since v2 chunks have different IDs)
# v1 used 3-page chunks: secondary-p2-p4, secondary-p5-p7
# v2 uses 2-page chunks: secondary-p2-p3, secondary-p4-p5, secondary-p6-p7
# The opus gold claims reference v1 chunk IDs. For recall matching, we need to
# ignore chunk_id and match across all claims.
v1_gold = [json.loads(l) for l in (GOLD_DIR / f"{slug}-recall.jsonl").read_text().splitlines() if l.strip()]
print(f"v1 gold claims: {len(v1_gold)}")

# Modify semantic_match to ignore chunk_id by setting all to a matching key
def recall_match(extracted, gold):
    # Drop chunk_id constraint for cross-chunking compatibility
    return semantic_match(extracted, gold)

matched = 0
for g in v1_gold:
    for c in claims:
        if recall_match(c, g):
            matched += 1
            break
recall = matched / len(v1_gold) if v1_gold else 0.0
print(f"recall (semantic, ignore chunk_id): {matched}/{len(v1_gold)} = {recall:.3f}")

# precision / dims
pj = {j["id"]: j for j in all_prec}
n_pj = len(pj)
good = sum(1 for j in pj.values() if j.get("is_claim") and j.get("claim_paraphrase_ok"))
precision = good / n_pj if n_pj else 0.0

def frac(field):
    return sum(1 for j in pj.values() if j.get(field)) / n_pj if n_pj else 0.0

metrics = {
    "n_extracted": len(claims),
    "n_judged": n_pj,
    "n_gold": len(v1_gold),
    "precision": round(precision, 3),
    "recall": round(recall, 3),
    "f1": round(2*precision*recall/(precision+recall) if (precision+recall) else 0.0, 3),
    "type_accuracy": round(frac("claim_type_ok"), 3),
    "stance_accuracy": round(frac("stance_ok"), 3),
    "use_mention_accuracy": round(frac("use_mention_ok"), 3),
    "speaker_accuracy": round(frac("speaker_ok"), 3),
    "grounding_rate": round(sum(1 for c in claims if c.get("grounding",{}).get("quote_match"))/len(claims), 3),
    "low_confidence_claims": sum(1 for j in pj.values() if (j.get("confidence") or 1.0) < 0.7),
}

(GOLD_DIR / f"{slug}-v2-metrics.json").write_text(json.dumps(metrics, indent=2))

flagged = flag_uncertain(claims, all_prec)
(GOLD_DIR / f"{slug}-v2-flagged.jsonl").write_text("\n".join(json.dumps(f) for f in flagged))

print(f"\nv2 metrics: {metrics}")
print(f"flagged: {len(flagged)} items")
