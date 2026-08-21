"""Re-eval Caston v3 using existing Opus gold-recall + fresh precision audit."""
import json
from pathlib import Path
from evaluate import (
    judge_precision, compute_chunk_text_cache,
    flag_uncertain, semantic_match, SETTINGS, GOLD_DIR, OUTPUT_DIR,
)

s = SETTINGS["caston-1995"]
slug = s["slug"]
claims = [json.loads(l) for l in (OUTPUT_DIR / f"{slug}-v3.jsonl").read_text().splitlines() if l.strip()]
print(f"v3 claims: {len(claims)}")

chunk_texts = compute_chunk_text_cache(slug, Path(s["pdf"]), s["first_page"], s["last_page"], s["genre"])
groups = {}
for c in claims:
    groups.setdefault(c["chunk_id"], []).append(c)

all_prec = []
for cid, cl in groups.items():
    print(f"  precision audit: {cid} ({len(cl)} claims)")
    prec = judge_precision(s["author"], s["title"], s["year"], s["genre"], chunk_texts.get(cid, ""), cl)
    all_prec.extend(prec)

(GOLD_DIR / f"{slug}-v3-precision.jsonl").write_text("\n".join(json.dumps(j) for j in all_prec))

v1_gold = [json.loads(l) for l in (GOLD_DIR / f"{slug}-recall.jsonl").read_text().splitlines() if l.strip()]
print(f"gold claims (cached): {len(v1_gold)}")

matched = 0
for g in v1_gold:
    for c in claims:
        if semantic_match(c, g):
            matched += 1
            break
recall = matched / len(v1_gold) if v1_gold else 0.0

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

(GOLD_DIR / f"{slug}-v3-metrics.json").write_text(json.dumps(metrics, indent=2))
flagged = flag_uncertain(claims, all_prec)
(GOLD_DIR / f"{slug}-v3-flagged.jsonl").write_text("\n".join(json.dumps(f) for f in flagged))

print(f"\nv3 metrics: {metrics}")
print(f"flagged: {len(flagged)} items")
