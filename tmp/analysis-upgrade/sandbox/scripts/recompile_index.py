#!/usr/bin/env python3
"""Extend the sandbox compiled-index.json with claims, mentions, and bridges."""
import json
from pathlib import Path
from datetime import datetime, timezone

SANDBOX = Path(__file__).resolve().parents[1]
COMPILED = SANDBOX / "corpus" / "index" / "compiled-index.json"
NUSS = SANDBOX / "corpus" / "index" / "Nussbaum 1985"
CLAIMS = NUSS / "nussbaum-1985-claims.jsonl"
MENTIONS = NUSS / "nussbaum-1985-concept-mentions.jsonl"
BRIDGES = NUSS / "bridge-candidates.jsonl"

def loadl(p):
    if not p.exists() or p.stat().st_size == 0: return []
    return [json.loads(l) for l in p.read_text().splitlines() if l.strip()]

def main():
    idx = json.loads(COMPILED.read_text())
    claims = loadl(CLAIMS)
    mentions = loadl(MENTIONS)
    cands = loadl(BRIDGES)

    # Convert Nussbaum bridge candidates into the same schema as crossPipelineHooks
    promoted_bridges = []
    for c in cands:
        if c.get("relation") == "unrelated": continue
        if c.get("confidence") == "low" and c.get("relation") != "alignment": continue
        promoted_bridges.append({
            "id": c["id"],
            "sourceText": "Nussbaum 1985",
            "sourceConcept": c.get("nussbaum_concept") or c.get("concept",""),
            "targetText": c["anchor_target"].split(" :: ")[0] if " :: " in c["anchor_target"] else c["anchor_target"],
            "targetConcept": c["anchor_target"].split(" :: ")[1] if " :: " in c["anchor_target"] else "",
            "title": f"Nussbaum's reading of {c.get('shared_concept') or c.get('concept','')}",
            "bridge": c.get("rationale",""),
            "relevance": f"{c.get('relation','')}: {c.get('rationale','')}"[:300],
            "tag": c.get("tag","INTERP-medium-AUTO"),
            "auto_generated": True,
            "needs_review": True,
            "anchor_hook_id": c.get("anchor_hook_id",""),
        })
    # Also generate direct Nussbaum→Aristotle bridges from top mentions (no LLM needed)
    from collections import defaultdict
    concept_top_claim = {}
    for m in mentions:
        cid = m.get("ontology_node")
        if cid not in concept_top_claim or m["score"] > concept_top_claim[cid]["score"]:
            concept_top_claim[cid] = m
    claims_by_id = {c["id"]: c for c in claims}
    auto_arist_bridges = []
    for cid, m in concept_top_claim.items():
        if m["score"] < 0.65: continue
        cl = claims_by_id.get(m["claim_id"])
        if not cl: continue
        auto_arist_bridges.append({
            "id": f"hook-nussbaum-arist-{cid.lower().replace(' ','-')}",
            "sourceText": "Nussbaum 1985",
            "sourceConcept": (cl.get("key_concepts") or [cid])[0],
            "targetText": "Aristotle",
            "targetConcept": cid,
            "title": f"Nussbaum on {cid}",
            "bridge": cl.get("claim",""),
            "relevance": cl.get("ground","") or cl.get("claim","")[:200],
            "tag": "INTERP-direct-AUTO",
            "auto_generated": True,
            "needs_review": True,
        })

    all_new_hooks = promoted_bridges + auto_arist_bridges

    # Build new ontology entries for novel Nussbaum concepts (not yet in index)
    existing_names = {n["name"].lower() for n in idx.get("ontologyNodes", [])}
    novel_terms = set()
    for cl in claims:
        for kc in cl.get("key_concepts", []) or []:
            if kc and kc.lower() not in existing_names and len(kc) > 3:
                novel_terms.add(kc)
    novel_nodes = []
    for term in sorted(novel_terms):
        novel_nodes.append({
            "name": term,
            "definition": f"Concept introduced via Nussbaum 1985 secondary lit.",
            "type": "secondary-lit",
            "units": ["Nussbaum-1985"],
            "text": "Nussbaum 1985",
            "aliases": [],
            "centralityTier": "peripheral",
            "auto_generated": True,
        })

    idx["claims"] = claims
    idx["conceptMentions"] = mentions
    idx["bridgeCandidates"] = cands
    idx["crossPipelineHooks"] = idx.get("crossPipelineHooks", []) + all_new_hooks
    idx["ontologyNodes"] = idx.get("ontologyNodes", []) + novel_nodes
    idx["builtAt"] = datetime.now(timezone.utc).isoformat()
    idx["sandboxNote"] = "Extended with Nussbaum 1985 secondary-lit integration"

    COMPILED.write_text(json.dumps(idx, indent=2))
    print(f"[recompile] wrote {COMPILED}")
    print(f"  claims:               {len(claims)}")
    print(f"  conceptMentions:      {len(mentions)}")
    print(f"  bridgeCandidates:     {len(cands)}")
    print(f"  +promoted hooks:      {len(promoted_bridges)}")
    print(f"  +direct Arist hooks:  {len(auto_arist_bridges)}")
    print(f"  +novel ontology:      {len(novel_nodes)}")
    print(f"  total hooks now:      {len(idx['crossPipelineHooks'])}")
    print(f"  total ontology now:   {len(idx['ontologyNodes'])}")

if __name__ == "__main__":
    main()
