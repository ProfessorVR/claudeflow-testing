#!/usr/bin/env python3
"""E0-lite telemetry wrapper.

For each canonical prompt, replicate the TS `loadCorpusIndexContext` +
`loadActiveClaims` scoring against the hydrated compiled-index. Report what
would be injected into the write-pipeline prompt without calling any LLM.

Output:
  results/provisional-diagnostic-<date>.json — provenance-stamped telemetry
  (claim lines, hook lines, tension lines, ontology lines, author diversity)
  per prompt. Intended for decision-making before step 4 (paid prose runs).

Mirrors TS scoring in:
  src-worktree/src/god-agent/universal/corpus-index-provider.ts
    - scoreCandidate        (term-frequency, case-insensitive regex)
    - loadCorpusIndexContext (12 ontology / 3 hooks / 5 tensions)
    - loadActiveClaims       (6 claims, default faithfulness + use_mention)
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


SANDBOX = Path(__file__).resolve().parents[1]
DATA_DIR = SANDBOX / "data/corpus/index"
PROMPTS_FILE = SANDBOX / "data/prompts/canonical-suite.json"
MANIFEST = DATA_DIR / "ARTIFACT-MANIFEST.json"
COMPILED = DATA_DIR / "compiled-index.json"
WORKTREE = SANDBOX / "src-worktree"


def score_candidate(topic_terms: list[str], search_text: str) -> int:
    """Mirror TS: term-frequency count, case-insensitive regex, no length norm."""
    if not search_text:
        return 0
    lower = search_text.lower()
    total = 0
    for t in topic_terms:
        pat = re.escape(t)
        matches = re.findall(pat, lower, flags=re.IGNORECASE)
        total += len(matches)
    return total


def load_corpus_index_context(topic: str, idx: dict,
                              max_ontology_nodes=12, max_hooks=3, max_tensions=5) -> dict:
    topic_terms = [t for t in topic.lower().split() if len(t) >= 4]
    if not topic_terms:
        return {"ontologyLines": [], "hookLines": [], "tensionLines": [],
                "ontology_top": [], "hook_top": [], "tension_top": []}

    # Score ontology nodes
    scored_nodes = []
    for n in idx.get("ontologyNodes", []):
        st = " ".join([
            n.get("name", ""), n.get("greek", ""), n.get("transliteration", ""),
            n.get("definition", "") or "",
            *[a for a in (n.get("aliases") or []) if a],
        ])
        s = score_candidate(topic_terms, st)
        if s > 0:
            scored_nodes.append((s, n))
    scored_nodes.sort(key=lambda p: -p[0])
    scored_nodes = scored_nodes[:max_ontology_nodes]
    ontology_top = [{"name": n.get("name"), "greek": n.get("greek"), "score": s,
                     "centrality": n.get("centralityTier"), "type": n.get("type")} for s, n in scored_nodes]

    # Score hooks
    scored_hooks = []
    for h in idx.get("crossPipelineHooks", []):
        st = " ".join([
            h.get("sourceConcept") or "", h.get("targetConcept") or "",
            h.get("bridge") or "", h.get("title") or "",
        ])
        s = score_candidate(topic_terms, st)
        if s > 0:
            scored_hooks.append((s, h))
    scored_hooks.sort(key=lambda p: -p[0])
    scored_hooks = scored_hooks[:max_hooks]
    hook_top = [{
        "id": h.get("id"),
        "sourceText": h.get("sourceText"), "targetText": h.get("targetText"),
        "sourceConcept": h.get("sourceConcept"), "targetConcept": h.get("targetConcept"),
        "tag": h.get("tag"), "score": s,
        "auto_generated": h.get("auto_generated", False),
    } for s, h in scored_hooks]

    # Score tensions
    scored_tensions = []
    for te in idx.get("tensionEdges", []):
        st = " ".join([te.get("nodeA", ""), te.get("nodeB", ""), te.get("description", "") or ""])
        s = score_candidate(topic_terms, st)
        if s > 0:
            scored_tensions.append((s, te))
    scored_tensions.sort(key=lambda p: -p[0])
    scored_tensions = scored_tensions[:max_tensions]
    tension_top = [{"id": te.get("id"), "nodeA": te.get("nodeA"), "nodeB": te.get("nodeB"),
                    "score": s} for s, te in scored_tensions]

    return {
        "ontologyLines": len(scored_nodes),
        "hookLines": len(scored_hooks),
        "tensionLines": len(scored_tensions),
        "ontology_top": ontology_top,
        "hook_top": hook_top,
        "tension_top": tension_top,
    }


def diversity_key(c: dict) -> str:
    """Match TS diversityKey: source.author > speaker > 'unknown'."""
    src = c.get("source") or {}
    if src.get("author"): return src["author"].lower()
    if c.get("speaker"): return c["speaker"].lower()
    return "unknown"


def load_active_claims(topic: str, idx: dict, max_claims=6,
                       max_claims_per_author=2,
                       allowed_faith=None, allowed_use_mention=None) -> dict:
    if allowed_faith is None:
        allowed_faith = ["author-endorsed", "supported", "partial"]
    if allowed_use_mention is None:
        allowed_use_mention = ["use", "mention"]

    claims = idx.get("claims") or []
    total_evaluated = len(claims)
    topic_terms = [t for t in topic.lower().split() if len(t) >= 4]
    if not topic_terms:
        return {"claim_lines": [], "total_evaluated": total_evaluated, "total_filtered": 0, "claim_top": []}

    total_filtered = 0
    scored_all = []
    for c in claims:
        # filter
        um = c.get("use_mention")
        if um and um not in allowed_use_mention:
            total_filtered += 1
            continue
        fa = c.get("faithfulness")
        if fa and fa not in allowed_faith:
            total_filtered += 1
            continue
        st = " ".join([
            c.get("claim") or "",
            c.get("quote") or "",
            " ".join(c.get("key_concepts") or []),
            c.get("speaker") or "",
        ])
        s = score_candidate(topic_terms, st)
        if s <= 0:
            continue
        scored_all.append((s, c))
    scored_all.sort(key=lambda p: -p[0])

    # Author-diversity greedy selection matching TS logic
    if max_claims_per_author is None or max_claims_per_author <= 0:
        scored = scored_all[:max_claims]
    else:
        per_author = {}
        capped = []
        overflow = []
        for s, c in scored_all:
            if len(capped) >= max_claims:
                break
            key = diversity_key(c)
            n = per_author.get(key, 0)
            if key != "unknown" and n >= max_claims_per_author:
                overflow.append((s, c))
                continue
            capped.append((s, c))
            per_author[key] = n + 1
        while len(capped) < max_claims and overflow:
            capped.append(overflow.pop(0))
        scored = capped

    claim_top = [{
        "id": c.get("id"),
        "speaker": c.get("speaker"),
        "use_mention": c.get("use_mention"),
        "stance": c.get("stance"),
        "claim_type": c.get("claim_type"),
        "faithfulness": c.get("faithfulness"),
        "claim": (c.get("claim") or "")[:160],
        "source_author": (c.get("source") or {}).get("author"),
        "source_year": (c.get("source") or {}).get("year"),
        "score": s,
    } for s, c in scored]

    return {
        "claim_lines": len(scored),
        "total_evaluated": total_evaluated,
        "total_filtered": total_filtered,
        "claim_top": claim_top,
    }


def distinct_authors(ctx: dict, claims: dict) -> list[str]:
    auths = set()
    for h in ctx.get("hook_top", []):
        if h.get("sourceText"): auths.add(h["sourceText"])
        if h.get("targetText"): auths.add(h["targetText"])
    for c in claims.get("claim_top", []):
        if c.get("source_author"): auths.add(c["source_author"])
    return sorted(auths)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    # Provenance
    manifest_hash = hashlib.sha256(MANIFEST.read_bytes()).hexdigest()
    prompts_hash = hashlib.sha256(PROMPTS_FILE.read_bytes()).hexdigest()
    try:
        sandbox_sha = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=WORKTREE, text=True
        ).strip()
    except Exception:
        sandbox_sha = "unknown"
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    idx = json.loads(COMPILED.read_text())
    suite = json.loads(PROMPTS_FILE.read_text())
    prompts = suite.get("prompts", [])

    telemetry = []
    for p in prompts:
        ctx = load_corpus_index_context(p["topic"], idx)
        claims = load_active_claims(p["topic"], idx)
        authors = distinct_authors(ctx, claims)

        # Gap signal: compute "expected vs actual" author activation
        expected = set((p.get("expected_secondary_presence") or []) + (p.get("expected_primary_authors") or []))
        missing_expected = sorted([e for e in expected
                                   if not any(e.lower() in a.lower() for a in authors)])

        telemetry.append({
            "prompt_id": p["id"],
            "label": p["label"],
            "topic": p["topic"],
            "activation": {
                "ontology_lines": ctx["ontologyLines"],
                "hook_lines": ctx["hookLines"],
                "claim_lines": claims["claim_lines"],
                "tension_lines": ctx["tensionLines"],
            },
            "claim_eval": {
                "total_evaluated": claims["total_evaluated"],
                "total_filtered_out": claims["total_filtered"],
            },
            "distinct_authors_activated": authors,
            "expected_authors": sorted(expected),
            "expected_missing": missing_expected,
            "ontology_top": ctx["ontology_top"],
            "hook_top": ctx["hook_top"],
            "claim_top": claims["claim_top"],
            "tension_top": ctx["tension_top"],
            "tests_per_plan": p.get("tests", []),
        })

    out = {
        "kind": "provisional-diagnostic",
        "plan_phase": "E0-lite (not formal E0)",
        "note": "Prompt-injection telemetry only. Runs no LLM. Not comparable to formal E0 which requires gold dev F1 + holdout F1 + god-write A/B.",
        "generated_at": ts,
        "provenance": {
            "sandbox_sha": sandbox_sha,
            "artifact_manifest_hash": manifest_hash,
            "canonical_prompt_suite_hash": prompts_hash,
        },
        "canonical_suite_version": suite.get("version"),
        "corpus_stats": {
            "ontology_nodes": len(idx.get("ontologyNodes", [])),
            "cross_pipeline_hooks": len(idx.get("crossPipelineHooks", [])),
            "tension_edges": len(idx.get("tensionEdges", [])),
            "claims": len(idx.get("claims", [])),
            "concept_mentions": len(idx.get("conceptMentions", [])),
            "canonical_terms": len(idx.get("canonicalTerms", [])),
        },
        "telemetry": telemetry,
    }

    out_path = Path(args.output) if args.output else (
        SANDBOX / "results" / f"provisional-diagnostic-{ts[:10]}.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"wrote {out_path}")

    # Console summary
    print()
    print("=" * 70)
    print("PROMPT ACTIVATION SUMMARY (activation = what would enter the prompt)")
    print("=" * 70)
    for t in telemetry:
        a = t["activation"]
        print(f"\n[{t['prompt_id']}] {t['label']}")
        print(f"  activation: ontology={a['ontology_lines']}/12  hooks={a['hook_lines']}/3  "
              f"claims={a['claim_lines']}/6  tensions={a['tension_lines']}/5")
        print(f"  claim pool used: {t['claim_eval']['total_evaluated']} evaluated, "
              f"{t['claim_eval']['total_filtered_out']} filtered")
        print(f"  distinct authors activated: {t['distinct_authors_activated']}")
        if t["expected_missing"]:
            print(f"  EXPECTED MISSING: {t['expected_missing']}")
        if not t["hook_top"] and t["activation"]["claim_lines"] == 0:
            print("  -> WARN: both hooks and claims are empty for this prompt")


if __name__ == "__main__":
    main()
