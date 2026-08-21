#!/usr/bin/env python3
"""Follow-up Perplexity queries targeting concrete techniques."""
import sys
sys.path.insert(0, '.')
from run_perplexity import call, OUTDIR
import json, time

QUERIES = {
    "q09_claimify_deep": (
        "Describe Microsoft Claimify's four-stage pipeline (sentence-split, "
        "selection, rewriting, consolidation) in technical detail. What exact "
        "prompts or prompt patterns does it use? How does it achieve 99% "
        "entailment between extracted claims and source sentences? What are "
        "its failure modes on long academic prose or philosophical text?"
    ),
    "q10_fewshot_domain_shift": (
        "For LLM-based claim extraction, what does the 2024-2026 literature "
        "say about few-shot vs. zero-shot performance when the target domain "
        "differs from the examples (domain shift)? Does adding 2-8 in-domain "
        "exemplars help? Does chain-of-thought help for ambiguous cases? Any "
        "results on classical/non-contemporary prose, OCR-noisy input, or "
        "long sentences with embedded quotations?"
    ),
    "q11_dialectical_voicing": (
        "How do NLP systems handle texts with voiced positions — where the "
        "author presents a view only to refute it (aporetic, dialectical, "
        "polemical, Socratic)? This is common in Plato's dialogues, Aristotle's "
        "dialectical chapters, and Heidegger's critical engagements with prior "
        "philosophers. Discuss: (a) source attribution in argument mining, "
        "(b) stance detection within nested reported speech, (c) how to tell "
        "'Aristotle says X' from 'Aristotle endorses X'. Name any systems or "
        "2023-2026 papers that address this."
    ),
    "q12_span_grounding_techniques": (
        "What are the 2024-2026 techniques for making LLMs return exact source "
        "spans with extracted claims? Compare: (a) asking the LLM to return "
        "character offsets (unreliable?), (b) returning verbatim quote + "
        "fuzzy-matching post-hoc, (c) constrained decoding with span-only tokens, "
        "(d) two-pass — extract then locate, (e) Pointer Networks or RetrievalQA "
        "span predictors. Which is most reliable for long documents? What is the "
        "error rate for each?"
    ),
}

for qid, q in QUERIES.items():
    out = OUTDIR / f"{qid}.json"
    if out.exists() and out.stat().st_size > 500:
        print(f"[skip] {qid}")
        continue
    print(f"[run ] {qid}")
    t0 = time.time()
    try:
        resp = call(q)
        out.write_text(json.dumps(resp, indent=2))
        cost = resp.get("usage", {}).get("cost", {}).get("total_cost", 0)
        print(f"  ok  {time.time()-t0:.1f}s  ${cost:.4f}")
    except Exception as e:
        print(f"  ERR: {e}")
    time.sleep(1)
