#!/usr/bin/env python3
"""
compile-corpus-index-v2.py — promotion-ready extended compiler.

Drop-in replacement for `scripts/compile-corpus-index.py` that additionally
aggregates:

  - corpus/index/<paper>/claims.jsonl             → compiled-index.json["claims"]
  - corpus/index/<paper>/concept-mentions.jsonl   → compiled-index.json["conceptMentions"]
  - corpus/index/<paper>/bridge-candidates.jsonl  → compiled-index.json["bridgeCandidates"]
  - any auto-generated hooks from bridge-candidates → extend crossPipelineHooks

The original compiler's output schema is preserved; only ADDITIONS are made.

Run from repo root:
    python3 scripts/compile-corpus-index-v2.py
"""
from __future__ import annotations
import json, sys, glob, subprocess
from pathlib import Path
from datetime import datetime, timezone

REPO = Path(__file__).resolve().parents[1]
CORPUS_INDEX = REPO / "corpus" / "index"
ORIGINAL_COMPILER = REPO / "scripts" / "compile-corpus-index.py"
OUTPUT = CORPUS_INDEX / "compiled-index.json"


def run_original_compiler() -> dict:
    """Run the existing compile-corpus-index.py and read its output."""
    if not ORIGINAL_COMPILER.exists():
        print(f"WARNING: original compiler not found at {ORIGINAL_COMPILER}; loading existing compiled-index.json", file=sys.stderr)
        return json.loads(OUTPUT.read_text())
    print(f"[v2] running original compiler {ORIGINAL_COMPILER}")
    r = subprocess.run([sys.executable, str(ORIGINAL_COMPILER)], capture_output=True, text=True, cwd=REPO)
    if r.returncode != 0:
        print(f"ORIGINAL COMPILER FAILED:\n{r.stderr}", file=sys.stderr)
        sys.exit(1)
    print(r.stdout)
    return json.loads(OUTPUT.read_text())


def loadl(p: Path) -> list:
    if not p.exists() or p.stat().st_size == 0: return []
    return [json.loads(line) for line in p.read_text().splitlines() if line.strip()]


def aggregate_secondary_lit() -> tuple[list, list, list]:
    """Scan corpus/index/ for paper-specific claims/mentions/bridges files."""
    claims, mentions, cands = [], [], []
    # Look for <paper>/*-claims.jsonl or claims.jsonl
    for dir_path in CORPUS_INDEX.iterdir():
        if not dir_path.is_dir(): continue
        for pat in ("*-claims.jsonl", "claims.jsonl"):
            for fp in dir_path.glob(pat):
                claims.extend(loadl(fp))
        for pat in ("*-concept-mentions.jsonl", "concept-mentions.jsonl"):
            for fp in dir_path.glob(pat):
                mentions.extend(loadl(fp))
        for pat in ("*-bridge-candidates.jsonl", "bridge-candidates.jsonl"):
            for fp in dir_path.glob(pat):
                cands.extend(loadl(fp))
    return claims, mentions, cands


def bridge_candidates_to_hooks(cands: list) -> list:
    """Promote LLM-validated bridge candidates to crossPipelineHooks entries."""
    out = []
    for c in cands:
        if c.get("relation") == "unrelated": continue
        if c.get("confidence") == "low" and c.get("relation") != "alignment": continue
        source_parts = (c.get("anchor_source") or " :: ").split(" :: ")
        target_parts = (c.get("anchor_target") or " :: ").split(" :: ")
        out.append({
            "id": c.get("id", ""),
            "sourceText": source_parts[0] if len(source_parts) > 0 else "",
            "sourceConcept": c.get("nussbaum_concept") or c.get("concept",""),
            "targetText": target_parts[0] if len(target_parts) > 0 else "",
            "targetConcept": target_parts[1] if len(target_parts) > 1 else "",
            "title": f"Secondary-lit reading of {c.get('shared_concept') or c.get('concept','')}",
            "bridge": c.get("rationale",""),
            "relevance": f"{c.get('relation','')}: {c.get('rationale','')}"[:300],
            "tag": c.get("tag","INTERP-medium-AUTO"),
            "auto_generated": True,
            "needs_review": True,
            "anchor_hook_id": c.get("anchor_hook_id",""),
        })
    return out


def direct_hooks_from_mentions(claims: list, mentions: list, min_score: float = 0.65) -> list:
    """Generate direct secondary-lit → original-author hooks from high-confidence mentions."""
    claims_by_id = {c["id"]: c for c in claims if "id" in c}
    # Take top-score mention per (concept, author-year) pair
    best_per = {}
    for m in mentions:
        if m.get("score", 0) < min_score: continue
        key = (m.get("ontology_node",""), m.get("author",""), m.get("year",""))
        if key not in best_per or m["score"] > best_per[key]["score"]:
            best_per[key] = m
    out = []
    for (concept, author, year), m in best_per.items():
        cl = claims_by_id.get(m.get("claim_id",""))
        if not cl: continue
        author_year = f"{author.split(',')[0]} {year}" if author else "Secondary lit"
        out.append({
            "id": f"hook-{author_year.lower().replace(' ','-').replace(',','')}-{concept.lower().replace(' ','-').replace('/','-')[:30]}",
            "sourceText": author_year,
            "sourceConcept": (cl.get("key_concepts") or [concept])[0] if cl.get("key_concepts") else concept,
            "targetText": "Aristotle",   # TODO: generalize when non-Aristotle primary corpora are added
            "targetConcept": concept,
            "title": f"{author_year} on {concept}",
            "bridge": cl.get("claim","")[:400],
            "relevance": cl.get("ground","")[:200] or cl.get("claim","")[:200],
            "tag": "INTERP-direct-AUTO",
            "auto_generated": True,
            "needs_review": True,
        })
    return out


def main():
    idx = run_original_compiler()
    print(f"[v2] original: {len(idx.get('ontologyNodes',[]))} nodes, {len(idx.get('crossPipelineHooks',[]))} hooks, {len(idx.get('tensionEdges',[]))} tensions")

    claims, mentions, cands = aggregate_secondary_lit()
    print(f"[v2] aggregated: {len(claims)} claims, {len(mentions)} mentions, {len(cands)} bridge candidates")

    promoted_hooks = bridge_candidates_to_hooks(cands)
    direct_hooks = direct_hooks_from_mentions(claims, mentions)
    all_new_hooks = promoted_hooks + direct_hooks

    idx["claims"] = claims
    idx["conceptMentions"] = mentions
    idx["bridgeCandidates"] = cands
    idx["crossPipelineHooks"] = idx.get("crossPipelineHooks", []) + all_new_hooks
    idx["builtAt"] = datetime.now(timezone.utc).isoformat()
    idx["schemaVersion"] = 2

    OUTPUT.write_text(json.dumps(idx, indent=2))

    print(f"[v2] wrote {OUTPUT}")
    print(f"  total hooks:        {len(idx['crossPipelineHooks'])}  (+{len(all_new_hooks)} new)")
    print(f"  + promoted bridges: {len(promoted_hooks)}")
    print(f"  + direct hooks:     {len(direct_hooks)}")
    print(f"  claims:             {len(claims)}")
    print(f"  conceptMentions:    {len(mentions)}")
    print(f"  bridgeCandidates:   {len(cands)}")


if __name__ == "__main__":
    main()
