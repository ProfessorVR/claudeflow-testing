#!/usr/bin/env python3
"""Generate cross-author bridge candidates for Nussbaum's top concepts.

For each ontology node Nussbaum links to (top-N by mention count), find existing
cross-pipeline-hooks involving that concept, and propose a Nussbaum-side bridge:

  (Nussbaum-claim, original-target-author, original-target-concept)

Then ask Claude: "Given Nussbaum's claim and the existing bridge target, is there
a substantive conceptual relation? Tag as alignment / extension / contestation /
restatement, with confidence high/medium/low."

Output: bridge-candidates.jsonl (all needsReview: true).
"""
import json, os, sys, time
from pathlib import Path
from collections import defaultdict
from anthropic import Anthropic

SANDBOX = Path(__file__).resolve().parents[1]
REPO = Path(__file__).resolve().parents[4]
COMPILED = SANDBOX / "corpus" / "index" / "compiled-index.json"
CLAIMS = SANDBOX / "corpus" / "index" / "Nussbaum 1985" / "nussbaum-1985-claims.jsonl"
MENTIONS = SANDBOX / "corpus" / "index" / "Nussbaum 1985" / "nussbaum-1985-concept-mentions.jsonl"
BRIDGES_OUT = SANDBOX / "corpus" / "index" / "Nussbaum 1985" / "bridge-candidates.jsonl"
TOP_CONCEPTS = 8           # how many of Nussbaum's top concepts to bridge
MAX_BRIDGES_PER_CONCEPT = 3

env_path = REPO / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

client = Anthropic()
MODEL = "claude-sonnet-4-5"

BRIDGE_PROMPT = """You are evaluating whether a cross-author conceptual bridge is substantive.

ANCHOR (existing bridge in our corpus index):
- Source: {source_text} — concept: {source_concept}
- Target: {target_text} — concept: {target_concept}
- Bridge text: {bridge_text}

NEW SECONDARY-LITERATURE CLAIM (from Nussbaum 1985, "The Role of Phantasia in Aristotle's Explanation of Action"):
- Claim: {claim}
- Ground: {ground}
- Key concepts she invokes: {key_concepts}
- Section: {section}

QUESTION: Does Nussbaum's claim engage with the SAME conceptual territory as the existing bridge? If so, classify the relation:
  - "alignment"     — Nussbaum extends or confirms the bridge in the same direction
  - "extension"     — Nussbaum adds a new dimension the bridge does not cover
  - "contestation"  — Nussbaum disputes or complicates the bridge
  - "restatement"   — Nussbaum says essentially the same thing in different terms
  - "unrelated"     — no substantive conceptual contact (be honest)

Return ONE JSON object only, no prose:
{{
  "relation": "alignment|extension|contestation|restatement|unrelated",
  "confidence": "high|medium|low",
  "rationale": "1-2 sentence justification",
  "nussbaum_concept": "the specific term/concept Nussbaum brings to bear",
  "shared_concept": "the underlying concept the two share, if any"
}}
"""

def main():
    idx = json.loads(COMPILED.read_text())
    hooks = idx.get("crossPipelineHooks", [])
    print(f"[bridges] {len(hooks)} existing hooks")

    claims = {c["id"]: c for c in (json.loads(l) for l in CLAIMS.read_text().splitlines() if l.strip())}
    mentions = [json.loads(l) for l in MENTIONS.read_text().splitlines() if l.strip()]
    print(f"[bridges] {len(claims)} claims, {len(mentions)} mentions")

    # Find top concepts Nussbaum links to
    concept_count = defaultdict(int)
    for m in mentions:
        concept_count[m["ontology_node"]] += 1
    top_concepts = [c for c, _ in sorted(concept_count.items(), key=lambda x: -x[1])[:TOP_CONCEPTS]]
    print(f"[bridges] top-{TOP_CONCEPTS} Nussbaum concepts: {top_concepts}")

    # For each top concept, find hooks that touch it (source or target match by case-insensitive substring)
    out = []
    for concept in top_concepts:
        c_lower = concept.lower()
        # Build candidate hook list
        cands = []
        for h in hooks:
            sc = (h.get("sourceConcept") or "").lower()
            tc = (h.get("targetConcept") or "").lower()
            if c_lower in sc or sc in c_lower or c_lower in tc or tc in c_lower:
                cands.append(h)
        cands = cands[:MAX_BRIDGES_PER_CONCEPT]
        if not cands:
            print(f"  [{concept}] no existing hooks; skipping")
            continue
        print(f"  [{concept}] {len(cands)} candidate hooks")
        # Find the strongest Nussbaum claim for this concept
        rel_mentions = [m for m in mentions if m["ontology_node"] == concept]
        rel_mentions.sort(key=lambda m: -m["score"])
        best_claim_id = rel_mentions[0]["claim_id"]
        claim = claims[best_claim_id]
        for h in cands:
            t0 = time.time()
            prompt = BRIDGE_PROMPT.format(
                source_text=h.get("sourceText",""),
                source_concept=h.get("sourceConcept",""),
                target_text=h.get("targetText",""),
                target_concept=h.get("targetConcept",""),
                bridge_text=(h.get("bridge") or "")[:800],
                claim=claim.get("claim",""),
                ground=claim.get("ground",""),
                key_concepts=", ".join(claim.get("key_concepts",[]) or []),
                section=claim.get("section",""),
            )
            try:
                msg = client.messages.create(model=MODEL, max_tokens=600,
                    messages=[{"role":"user","content":prompt}])
                raw = msg.content[0].text.strip()
                # strip code fences
                import re
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
                m = re.search(r"\{.*\}", raw, re.DOTALL)
                if m:
                    parsed = json.loads(m.group())
                else:
                    parsed = {"relation":"unrelated","confidence":"low","rationale":"parse failed"}
            except Exception as e:
                parsed = {"relation":"unrelated","confidence":"low","rationale":f"error: {e}"}
            entry = {
                "id": f"bridge-cand-nussbaum-{len(out)+1:03d}",
                "anchor_hook_id": h.get("id",""),
                "concept": concept,
                "claim_id": best_claim_id,
                "claim": claim.get("claim",""),
                "anchor_source": f"{h.get('sourceText','')} :: {h.get('sourceConcept','')}",
                "anchor_target": f"{h.get('targetText','')} :: {h.get('targetConcept','')}",
                "relation": parsed.get("relation","unrelated"),
                "confidence": parsed.get("confidence","low"),
                "rationale": parsed.get("rationale",""),
                "nussbaum_concept": parsed.get("nussbaum_concept",""),
                "shared_concept": parsed.get("shared_concept",""),
                "tag": f"INTERP-{parsed.get('confidence','low')}-AUTO",
                "needsReview": True,
            }
            out.append(entry)
            print(f"    -> {parsed.get('relation','?')}/{parsed.get('confidence','?')}  ({time.time()-t0:.1f}s)")

    BRIDGES_OUT.write_text("\n".join(json.dumps(b) for b in out))
    print(f"[bridges] wrote {len(out)} bridge candidates to {BRIDGES_OUT}")
    # Summary
    from collections import Counter
    rels = Counter(b["relation"] for b in out)
    print(f"  relations: {dict(rels)}")

if __name__ == "__main__":
    main()
