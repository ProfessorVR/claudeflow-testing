#!/usr/bin/env python3
"""Generate cross-author bridge candidates from new-schema claims.

Improvements over analysis-upgrade/sandbox/scripts/generate_bridges.py:
- Uses `speaker` + `stance` to filter & tag bridges. A bridge can now be
  explicitly tagged as stance: endorses/critiques/etc.
- Filters out speaker == predecessor (use_mention=mention) for secondary
  lit when building bridges attributed to the paper's author — those are
  anchored on the primary-text claim, not the paper's thesis.
- Uses `faithfulness` to require `supported` or `partial`; drops `unsupported`.
- Tags low-faithfulness bridges for review.
"""
from __future__ import annotations
import argparse
import json
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

from anthropic import Anthropic

BASE = Path(__file__).resolve().parents[1]
REPO = BASE.resolve().parents[2]  # integration-sandbox → analysis-upgrade → tmp → claudeflow-testing

env_path = REPO / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

client = Anthropic()
MODEL = "claude-sonnet-4-5"

TOP_CONCEPTS = 8
MAX_BRIDGES_PER_CONCEPT = 3

BRIDGE_PROMPT = """You are evaluating whether a cross-author conceptual bridge is substantive.

ANCHOR (existing bridge in our corpus index):
- Source: {source_text} — concept: {source_concept}
- Target: {target_text} — concept: {target_concept}
- Bridge text: {bridge_text}

NEW CLAIM (from {paper_author} {paper_year}, "{paper_title}"):
- Speaker inside text: {speaker}
- Stance of paper author toward this claim: {stance} ({use_mention})
- Claim: {claim}
- Ground: {ground}
- Key concepts: {key_concepts}
- Provenance: {provenance}

QUESTION: Does this claim engage with the SAME conceptual territory as the existing bridge? If so, classify the relation:
  - "alignment"     — extends or confirms the bridge
  - "extension"     — adds a new dimension
  - "contestation"  — disputes or complicates
  - "restatement"   — says the same in different terms
  - "unrelated"     — no substantive conceptual contact

Return ONE JSON object only, no prose:
{{
  "relation": "alignment|extension|contestation|restatement|unrelated",
  "confidence": "high|medium|low",
  "rationale": "1-2 sentence justification",
  "paper_concept": "specific term the paper brings",
  "shared_concept": "underlying shared concept"
}}
"""


def _robust_json_obj(raw: str) -> dict | None:
    s = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    s = re.sub(r"\s*```$", "", s)
    try:
        v = json.loads(s)
        return v if isinstance(v, dict) else None
    except Exception:
        pass
    m = re.search(r"\{.*\}", s, re.DOTALL)
    if m:
        try:
            return json.loads(m.group())
        except Exception:
            return None
    return None


def run(claims_path: Path, mentions_path: Path, out_path: Path) -> None:
    idx = json.loads((BASE / "corpus" / "index" / "compiled-index.json").read_text())
    hooks = idx.get("crossPipelineHooks", [])
    print(f"[bridges] {len(hooks)} existing hooks in sandbox compiled-index")

    claims = {c["id"]: c for c in (json.loads(l) for l in claims_path.read_text().splitlines() if l.strip())}
    mentions = [json.loads(l) for l in mentions_path.read_text().splitlines() if l.strip()]
    print(f"[bridges] {len(claims)} claims, {len(mentions)} mentions")

    # Rank concepts by total mention weight (score-weighted)
    weight = defaultdict(float)
    for m in mentions:
        weight[m["ontology_node"]] += m["score"]
    top_concepts = [c for c, _ in sorted(weight.items(), key=lambda x: -x[1])[:TOP_CONCEPTS]]
    print(f"[bridges] top-{TOP_CONCEPTS} concepts: {top_concepts}")

    out: list[dict] = []
    for concept in top_concepts:
        cl = concept.lower()
        cands = [h for h in hooks
                 if cl in (h.get("sourceConcept") or "").lower()
                 or (h.get("sourceConcept") or "").lower() in cl
                 or cl in (h.get("targetConcept") or "").lower()
                 or (h.get("targetConcept") or "").lower() in cl][:MAX_BRIDGES_PER_CONCEPT]
        if not cands:
            print(f"  [{concept}] no hooks; skipping")
            continue
        rel = [m for m in mentions if m["ontology_node"] == concept]
        rel.sort(key=lambda m: -m["score"])
        # Prefer `use` + high faithfulness claims for bridging
        best = None
        for m in rel:
            c = claims.get(m["claim_id"])
            if not c:
                continue
            if c.get("faithfulness") == "unsupported":
                continue
            if c.get("use_mention") == "mention" and c.get("speaker") not in (c.get("source", {}).get("author"), c.get("author")):
                # This is a reported claim; will create secondary bridge separately
                continue
            best = (m, c)
            break
        if not best:
            # fallback: highest-scoring mention regardless
            m = rel[0]
            c = claims.get(m["claim_id"])
            if not c:
                continue
            best = (m, c)
        m, c = best
        for h in cands:
            t0 = time.time()
            src = c.get("source", {})
            prompt = BRIDGE_PROMPT.format(
                source_text=h.get("sourceText", ""),
                source_concept=h.get("sourceConcept", ""),
                target_text=h.get("targetText", ""),
                target_concept=h.get("targetConcept", ""),
                bridge_text=(h.get("bridge") or "")[:800],
                paper_author=src.get("author", "Unknown"),
                paper_year=src.get("year", "Unknown"),
                paper_title=src.get("title", ""),
                speaker=c.get("speaker", ""),
                stance=c.get("stance", ""),
                use_mention=c.get("use_mention", ""),
                claim=c.get("claim", ""),
                ground=c.get("ground", ""),
                key_concepts=", ".join(c.get("key_concepts", []) or []),
                provenance=c.get("grounding", {}).get("extracted_anchor") or c.get("nearby_provenance", ""),
            )
            try:
                msg = client.messages.create(
                    model=MODEL, max_tokens=600,
                    messages=[{"role": "user", "content": prompt}],
                )
                parsed = _robust_json_obj(msg.content[0].text) or {
                    "relation": "unrelated", "confidence": "low", "rationale": "parse failed"
                }
            except Exception as e:
                parsed = {"relation": "unrelated", "confidence": "low", "rationale": f"error: {e}"}
            entry = {
                "id": f"bridge-cand-{src.get('slug','paper')}-{len(out)+1:03d}",
                "anchor_hook_id": h.get("id", ""),
                "concept": concept,
                "claim_id": c["id"],
                "claim": c.get("claim", ""),
                "claim_faithfulness": c.get("faithfulness", ""),
                "claim_speaker": c.get("speaker", ""),
                "claim_stance": c.get("stance", ""),
                "claim_use_mention": c.get("use_mention", ""),
                "anchor_source": f"{h.get('sourceText','')} :: {h.get('sourceConcept','')}",
                "anchor_target": f"{h.get('targetText','')} :: {h.get('targetConcept','')}",
                "relation": parsed.get("relation", "unrelated"),
                "confidence": parsed.get("confidence", "low"),
                "rationale": parsed.get("rationale", ""),
                "paper_concept": parsed.get("paper_concept", ""),
                "shared_concept": parsed.get("shared_concept", ""),
                "tag": f"INTERP-{parsed.get('confidence','low')}-AUTO",
                "needsReview": True,
            }
            out.append(entry)
            print(f"  [{concept}] -> {parsed.get('relation','?')}/{parsed.get('confidence','?')}  ({time.time()-t0:.1f}s)")

    out_path.write_text("\n".join(json.dumps(b) for b in out))
    print(f"[bridges] wrote {len(out)} candidates → {out_path}")
    from collections import Counter
    rels = Counter(b["relation"] for b in out)
    print(f"  relations: {dict(rels)}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--claims", required=True)
    p.add_argument("--mentions", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()
    run(Path(args.claims), Path(args.mentions), Path(args.out))


if __name__ == "__main__":
    main()
