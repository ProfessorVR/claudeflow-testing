#!/usr/bin/env python3
"""Recompile sandbox compiled-index.json, integrating claims + mentions +
bridges from multiple papers under the new schema.

Usage:
    python recompile_index.py  # scans corpus/index/ for claims + mentions + bridges

Behaviors:
- Concatenates claims/mentions/bridges across all papers under corpus/index/.
- Novel ontology nodes: introduced if `key_concepts` term doesn't exist in
  the existing ontology. Tagged `type: secondary-lit` for secondary papers,
  `type: primary-citation` for primary-text claims.
- Promoted bridges: bridge candidates with relation in {alignment, extension,
  contestation} and confidence not "low" are promoted to crossPipelineHooks.
- Direct author→Aristotle hooks: auto-generated from top-scoring mentions per
  concept per paper (with score ≥ 0.65).
"""
from __future__ import annotations
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
INDEX_DIR = BASE / "corpus" / "index"
COMPILED = INDEX_DIR / "compiled-index.json"


def loadl(p: Path) -> list[dict]:
    if not p.exists() or p.stat().st_size == 0:
        return []
    return [json.loads(l) for l in p.read_text().splitlines() if l.strip()]


def find_paper_dirs(index_dir: Path) -> list[Path]:
    """Return subdirectories of index_dir containing claims.jsonl."""
    return [p for p in index_dir.iterdir() if p.is_dir() and any(p.glob("*-claims.jsonl"))]


def main():
    idx = json.loads(COMPILED.read_text())
    all_claims: list[dict] = []
    all_mentions: list[dict] = []
    all_bridges: list[dict] = []
    all_novel_ontology: list[dict] = []
    promoted_hooks: list[dict] = []
    direct_hooks: list[dict] = []

    existing_names = {n["name"].lower() for n in idx.get("ontologyNodes", [])}
    existing_hook_ids = {h.get("id") for h in idx.get("crossPipelineHooks", [])}

    paper_dirs = find_paper_dirs(INDEX_DIR)
    print(f"[recompile] {len(paper_dirs)} paper directories:")
    for d in paper_dirs:
        print(f"  - {d.name}")

    for paper_dir in paper_dirs:
        c_files = list(paper_dir.glob("*-claims.jsonl"))
        m_files = list(paper_dir.glob("*-concept-mentions.jsonl"))
        b_files = list(paper_dir.glob("*-bridge-candidates.jsonl"))
        for c in c_files:
            all_claims.extend(loadl(c))
        for m in m_files:
            all_mentions.extend(loadl(m))
        for b in b_files:
            all_bridges.extend(loadl(b))

    print(f"[recompile] aggregate: {len(all_claims)} claims, {len(all_mentions)} mentions, {len(all_bridges)} bridges")

    # Drop unsupported-faithfulness claims from the index
    pre = len(all_claims)
    all_claims = [c for c in all_claims if c.get("faithfulness") != "unsupported"]
    print(f"[recompile] dropped {pre - len(all_claims)} unsupported claims")

    # Promote substantive bridges (exclude `unrelated`, exclude `low` unless alignment)
    for b in all_bridges:
        rel = b.get("relation", "unrelated")
        conf = b.get("confidence", "low")
        if rel == "unrelated":
            continue
        if conf == "low" and rel != "alignment":
            continue
        # Extract source from bridge
        src_author = b.get("claim_speaker") or "Unknown"
        # Find the claim
        claim = next((c for c in all_claims if c["id"] == b.get("claim_id")), None)
        if not claim:
            continue
        src = claim.get("source", {})
        hid = b["id"]
        if hid in existing_hook_ids:
            continue
        promoted_hooks.append({
            "id": hid,
            "sourceText": f"{src.get('author','Unknown')} {src.get('year','')}",
            "sourceConcept": b.get("paper_concept") or b.get("concept", ""),
            "targetText": b["anchor_target"].split(" :: ")[0] if " :: " in b.get("anchor_target", "") else "",
            "targetConcept": b["anchor_target"].split(" :: ")[1] if " :: " in b.get("anchor_target", "") else "",
            "title": f"{src.get('author','Unknown')}'s reading of {b.get('shared_concept') or b.get('concept','')}",
            "bridge": b.get("rationale", ""),
            "relevance": f"{rel}: {b.get('rationale','')}"[:300],
            "tag": b.get("tag", "INTERP-medium-AUTO"),
            "auto_generated": True,
            "needs_review": True,
            "anchor_hook_id": b.get("anchor_hook_id", ""),
            "stance": b.get("claim_stance", ""),
            "faithfulness": b.get("claim_faithfulness", ""),
            "speaker": b.get("claim_speaker", ""),
        })

    # Direct author→Aristotle hooks from top mentions
    by_paper_concept: dict[tuple, dict] = {}
    for m in all_mentions:
        key = (m.get("author", ""), m.get("ontology_node", ""))
        if key not in by_paper_concept or m["score"] > by_paper_concept[key]["score"]:
            by_paper_concept[key] = m
    claims_by_id = {c["id"]: c for c in all_claims}

    for (author, onto), m in by_paper_concept.items():
        if m["score"] < 0.65:
            continue
        cl = claims_by_id.get(m["claim_id"])
        if not cl:
            continue
        src = cl.get("source", {})
        slug = src.get("slug") or author.replace(" ", "-").lower()
        hid = f"hook-{slug}-arist-{onto.lower().replace(' ','-').replace('/','-')}"
        if hid in existing_hook_ids:
            continue
        direct_hooks.append({
            "id": hid,
            "sourceText": f"{author} {src.get('year','')}".strip(),
            "sourceConcept": (cl.get("key_concepts") or [onto])[0],
            "targetText": "Aristotle",
            "targetConcept": onto,
            "title": f"{author} on {onto}",
            "bridge": cl.get("claim", ""),
            "relevance": cl.get("ground", "") or cl.get("claim", "")[:200],
            "tag": "INTERP-direct-AUTO",
            "auto_generated": True,
            "needs_review": True,
            "stance": cl.get("stance", ""),
            "speaker": cl.get("speaker", ""),
            "faithfulness": cl.get("faithfulness", ""),
        })

    # Novel ontology nodes
    novel_set: dict[str, dict] = {}
    for cl in all_claims:
        # primary-text claims bring primary-provenance concepts; secondary bring secondary-lit concepts
        src = cl.get("source", {})
        author = src.get("author", "")
        # Heuristic: if claim_type is a primary-only type, treat as primary
        primary_types = {
            "thetic", "definitional", "dialectical_objection", "dialectical_refutation",
            "aporetic", "predecessor_report", "exegetical_claim", "empirical_observation",
            "analogical_argument", "methodological_remark",
        }
        is_primary = cl.get("claim_type") in primary_types
        tier_type = "primary-citation" if is_primary else "secondary-lit"
        for kc in cl.get("key_concepts", []) or []:
            kc_clean = kc.strip()
            if not kc_clean or len(kc_clean) < 3:
                continue
            if kc_clean.lower() in existing_names:
                continue
            key = kc_clean.lower()
            if key not in novel_set:
                novel_set[key] = {
                    "name": kc_clean,
                    "definition": f"Concept introduced via {author}",
                    "type": tier_type,
                    "units": [src.get("slug", "")],
                    "text": f"{author} {src.get('year','')}".strip(),
                    "aliases": [],
                    "centralityTier": "peripheral",
                    "auto_generated": True,
                    "first_speakers": [cl.get("speaker", "")] if cl.get("speaker") else [],
                }
            else:
                # augment units
                novel_set[key]["units"].append(src.get("slug", ""))
                sp = cl.get("speaker", "")
                if sp and sp not in novel_set[key]["first_speakers"]:
                    novel_set[key]["first_speakers"].append(sp)

    # Dedup units
    for v in novel_set.values():
        v["units"] = sorted(set(v["units"]))

    all_novel_ontology = sorted(novel_set.values(), key=lambda x: x["name"])

    # Merge into index
    idx["claims"] = all_claims
    idx["conceptMentions"] = all_mentions
    idx["bridgeCandidates"] = all_bridges
    idx["crossPipelineHooks"] = idx.get("crossPipelineHooks", []) + promoted_hooks + direct_hooks
    idx["ontologyNodes"] = idx.get("ontologyNodes", []) + all_novel_ontology
    idx["builtAt"] = datetime.now(timezone.utc).isoformat()
    idx["integrationSandboxNote"] = "Built with new-schema extractors + faithfulness filter"

    COMPILED.write_text(json.dumps(idx, indent=2))
    print(f"[recompile] wrote {COMPILED}")
    print(f"  claims:               {len(all_claims)}")
    print(f"  conceptMentions:      {len(all_mentions)}")
    print(f"  bridgeCandidates:     {len(all_bridges)}")
    print(f"  promoted hooks:       +{len(promoted_hooks)}")
    print(f"  direct hooks:         +{len(direct_hooks)}")
    print(f"  novel ontology nodes: +{len(all_novel_ontology)}")
    print(f"  total hooks now:      {len(idx['crossPipelineHooks'])}")
    print(f"  total ontology now:   {len(idx['ontologyNodes'])}")


if __name__ == "__main__":
    main()
