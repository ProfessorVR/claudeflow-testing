#!/usr/bin/env python3
"""Run Perplexity sonar-pro queries and save JSON responses.

Usage:
    python run_perplexity.py <query_id> "<question>"
Or with no args, runs all queries defined in QUERIES below.
"""
import json
import os
import sys
import time
from pathlib import Path
import urllib.request
import urllib.error

REPO = Path(__file__).resolve().parents[4]
OUTDIR = Path(__file__).resolve().parent.parent / "perplexity"
OUTDIR.mkdir(parents=True, exist_ok=True)

env = REPO / ".env"
for line in env.read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

API_KEY = os.environ["PERPLEXITY_API_KEY"]
URL = "https://api.perplexity.ai/chat/completions"
MODEL = "sonar-pro"

SYSTEM = (
    "You are an NLP researcher surveying the 2024-2026 literature on claim, "
    "proposition, and argument extraction — especially from academic philosophy, "
    "classical texts, and argumentative prose. Prefer primary sources (ACL, EMNLP, "
    "NAACL, TACL, CoNLL, arXiv). Cite paper titles and years explicitly. When "
    "evidence is thin, say so directly — do not fabricate."
)


def call(question: str) -> dict:
    body = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": question},
        ],
        "max_tokens": 2200,
        "return_related_questions": False,
    }).encode()
    req = urllib.request.Request(
        URL,
        data=body,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read())


QUERIES = {
    "q01_argument_mining_philosophy": (
        "What is the 2024-2026 state of the art for argument mining and claim "
        "extraction from academic philosophy papers and philosophical primary "
        "sources (e.g., Aristotle, Kant, Heidegger)? Name specific systems, "
        "benchmarks, and evaluation datasets. Distinguish approaches that handle "
        "classical/ancient texts vs. contemporary analytic journal prose."
    ),
    "q02_claim_taxonomies": (
        "What claim typologies are used in argument mining literature? Compare "
        "Toulmin (claim/ground/warrant/backing/qualifier/rebuttal), IBM Debater's "
        "Context-Dependent Claim schema, Stab & Gurevych's argumentation schemes, "
        "the AAEC corpus, and any recent 2024-2026 refinements. Which taxonomies "
        "best fit (a) argumentative academic papers, (b) philosophical primary "
        "texts that mix exposition, dialectic, and assertion?"
    ),
    "q03_llm_extraction_best_practices": (
        "What are the 2024-2026 best practices for using large language models "
        "(GPT-4, Claude, Gemini) to extract structured claims from long documents? "
        "Address: few-shot vs zero-shot, chain-of-thought, constrained JSON "
        "decoding, section-aware chunking vs whole-document, self-verification, "
        "hallucination mitigation, and span-anchored grounding to source text."
    ),
    "q04_primary_text_extraction_pitfalls": (
        "What are the known failure modes when extracting claims from "
        "pre-modern philosophical primary texts (Plato, Aristotle, medieval "
        "commentaries, Kant, Hegel, Heidegger)? Consider: aporetic/dialectical "
        "passages, voiced interlocutors, implicit premises, untranslated Greek, "
        "and distinguishing the author's own claims from claims they report to "
        "reject. Cite any NLP or digital humanities work addressing these."
    ),
    "q05_grounding_provenance": (
        "What methods are used to anchor extracted claims to exact source spans "
        "(page, paragraph, Bekker number, Stephanus page, line)? Discuss "
        "PaperTrail (2026), citation-anchored extraction, span prediction with "
        "LLMs, and verification pipelines that check a claim is actually stated "
        "in the cited span. Include pitfalls like citation drift and "
        "hallucinated Bekker numbers."
    ),
    "q06_evaluation_metrics": (
        "How is claim-extraction quality evaluated in the 2024-2026 literature? "
        "Discuss precision/recall/F1, inter-annotator agreement for argument "
        "components, BERTScore/ROUGE for paraphrased claims, faithfulness "
        "metrics, citation-groundedness tests, and LLM-as-judge protocols. "
        "Recommend evaluation strategies for a small gold set (~20-50 claims) "
        "over philosophical prose."
    ),
    "q07_digital_humanities_aristotle": (
        "Is there any digital-humanities or computational-philosophy work "
        "(2020-2026) that specifically extracts claims, arguments, or "
        "propositions from Aristotle's corpus — especially De Anima, De Motu "
        "Animalium, Rhetoric — or from Heidegger's lectures on Aristotle? Name "
        "projects, datasets, ontologies (e.g., Aristotelian Ontology, LOGEION, "
        "Perseus, Digital Aristotle, WLU-Aristotle) even if tangential."
    ),
    "q08_multi_stage_pipelines": (
        "What multi-stage pipelines for claim extraction combine: (1) candidate "
        "generation, (2) boundary/span refinement, (3) type classification, "
        "(4) stance/polarity, (5) grounding verification, (6) deduplication "
        "across sections? Name concrete 2024-2026 systems (e.g., PaperTrail, "
        "IBM Project Debater, ClaimRev, ARGEN, CLARIFIER) and describe their "
        "stage decomposition. What is the best stage decomposition for "
        "philosophical long-form text?"
    ),
}


def main():
    if len(sys.argv) >= 3:
        qid, question = sys.argv[1], sys.argv[2]
        queries = {qid: question}
    else:
        queries = QUERIES
    for qid, q in queries.items():
        out = OUTDIR / f"{qid}.json"
        if out.exists() and out.stat().st_size > 500:
            print(f"[skip] {qid} (already exists)")
            continue
        print(f"[run ] {qid}  ({len(q)} chars)")
        t0 = time.time()
        try:
            resp = call(q)
            out.write_text(json.dumps(resp, indent=2))
            # print cost + content first line
            cost = resp.get("usage", {}).get("cost", {}).get("total_cost", 0)
            first = resp["choices"][0]["message"]["content"].splitlines()[:2]
            print(f"  ok  {time.time()-t0:.1f}s  ${cost:.4f}")
            for line in first:
                print(f"    {line[:100]}")
        except urllib.error.HTTPError as e:
            print(f"  HTTP {e.code}: {e.read().decode()[:200]}")
        except Exception as e:
            print(f"  ERR {type(e).__name__}: {e}")
        time.sleep(1)


if __name__ == "__main__":
    main()
