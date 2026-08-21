#!/usr/bin/env python3
"""Extract A0-relevant content from the analysis-upgrade corpus index."""
import json
import os

INDEX_DIR = "/home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox/data/corpus/index"

TARGET_CONCEPTS = {
    "κίνησις", "kinesis", "motion", "movement",
    "ἐνέργεια", "energeia", "actuality", "being-at-work",
    "δύναμις", "dunamis", "dynamis", "potentiality", "potency", "capacity",
    "ἐντελέχεια", "entelecheia", "entelechy",
    "χρόνος", "chronos", "time", "temporality",
    "νῦν", "nun", "now",
    "οὐσία", "ousia", "substance", "being",
    "πρὸς τι", "pros ti", "relation", "relational",
    "ποίησις", "poiesis", "action",
    "πάθησις", "pathesis", "affection", "passion",
    "τέλος", "telos", "end",
    "Bewegtheit", "movedness", "Anwesenheit", "presence",
}


def concept_matches(txt):
    low = str(txt).lower()
    for c in TARGET_CONCEPTS:
        if c.lower() in low:
            return True
    return False


def main():
    report = []
    report.append("# A0 Index Extraction — Analysis-Upgrade Corpus\n")
    report.append("Date: 2026-04-23\n")
    report.append(
        "Target ontology nodes: kinesis, energeia, dunamis, entelecheia, chronos, nun, "
        "ousia, pros-ti, poiesis, pathesis, telos, Bewegtheit, Anwesenheit\n\n"
    )

    total_claims = 0
    total_mentions = 0
    total_bridges = 0

    for doc in ["aristotle-da-3-3", "heidegger-bcap-4-5"]:
        doc_dir = os.path.join(INDEX_DIR, doc)
        if not os.path.isdir(doc_dir):
            continue

        report.append(f"\n## Document: {doc}\n")

        # --- Claims ---
        claims_path = os.path.join(doc_dir, "claims.jsonl")
        kept_claims = []
        if os.path.exists(claims_path):
            with open(claims_path) as f:
                for line in f:
                    try:
                        c = json.loads(line)
                    except Exception:
                        continue
                    if c.get("faithfulness") not in ("supported",):
                        continue
                    if doc == "aristotle-da-3-3":
                        if c.get("speaker") != "Aristotle":
                            continue
                        if c.get("stance") != "endorses":
                            continue
                        if c.get("use_mention") != "use":
                            continue
                    kc = c.get("key_concepts", [])
                    hit = (
                        any(concept_matches(k) for k in kc)
                        or concept_matches(c.get("claim", ""))
                        or concept_matches(c.get("quote", ""))
                    )
                    if hit:
                        kept_claims.append(c)

        report.append(f"\n### Filtered Claims ({len(kept_claims)} kept)\n")
        for c in kept_claims:
            report.append(
                f"\n**{c.get('id')}** ({c.get('nearby_provenance', '?')}) — "
                f"{c.get('claim_type', '?')}\n"
            )
            report.append(f"- Quote: \"{c.get('quote', '').strip()}\"\n")
            report.append(f"- Claim: {c.get('claim', '').strip()}\n")
            if c.get("ground"):
                report.append(f"- Ground: {c['ground'].strip()}\n")
            if c.get("warrant"):
                report.append(f"- Warrant: {c['warrant'].strip()}\n")
            if c.get("qualifier"):
                report.append(f"- Qualifier: {c['qualifier'].strip()}\n")
            report.append(f"- Concepts: {', '.join(c.get('key_concepts', []))}\n")
        total_claims += len(kept_claims)

        # --- Concept-mentions ---
        cm_path = os.path.join(doc_dir, "concept-mentions.jsonl")
        kept_mentions = []
        if os.path.exists(cm_path):
            with open(cm_path) as f:
                for line in f:
                    try:
                        m = json.loads(line)
                    except Exception:
                        continue
                    if m.get("score", 0) < 0.6:
                        continue
                    node = m.get("ontology_node", "")
                    node_greek = m.get("ontology_greek", "")
                    if concept_matches(node) or concept_matches(node_greek):
                        kept_mentions.append(m)

        seen = set()
        deduped = []
        for m in sorted(kept_mentions, key=lambda x: -x.get("score", 0)):
            k = (m.get("claim_id"), m.get("ontology_node"))
            if k in seen:
                continue
            seen.add(k)
            deduped.append(m)

        report.append(
            f"\n### Filtered Concept-Mentions ({len(deduped)} kept, score≥0.6)\n"
        )
        for m in deduped[:40]:
            report.append(
                f"- [{m.get('ontology_node')}] score={m.get('score'):.3f} | "
                f"claim={m.get('claim_id')} | "
                f"{m.get('provenance', {}).get('bekker', '?')}\n"
            )
        total_mentions += len(deduped)

        # --- Bridges ---
        br_path = os.path.join(doc_dir, "bridge-candidates.jsonl")
        kept_bridges = []
        if os.path.exists(br_path):
            with open(br_path) as f:
                for line in f:
                    try:
                        b = json.loads(line)
                    except Exception:
                        continue
                    if b.get("confidence") not in ("high", "medium"):
                        continue
                    if b.get("relation") not in ("extension", "refines", "contradicts"):
                        continue
                    concept = (
                        b.get("concept", "")
                        + " "
                        + b.get("paper_concept", "")
                        + " "
                        + b.get("shared_concept", "")
                        + " "
                        + b.get("anchor_source", "")
                    )
                    if concept_matches(concept):
                        kept_bridges.append(b)

        report.append(f"\n### Filtered Bridge-Candidates ({len(kept_bridges)} kept)\n")
        for b in kept_bridges:
            report.append(f"\n**{b.get('id')}** [{b.get('relation')}, {b.get('confidence')}]\n")
            report.append(
                f"- Anchor: {b.get('anchor_source', '?')} → {b.get('anchor_target', '?')}\n"
            )
            report.append(f"- Paper concept: {b.get('paper_concept', '?')}\n")
            report.append(f"- Shared concept: {b.get('shared_concept', '?')}\n")
            report.append(f"- Claim: {b.get('claim', '').strip()[:200]}\n")
            report.append(f"- Rationale: {b.get('rationale', '').strip()[:300]}\n")
        total_bridges += len(kept_bridges)

    report.append("\n---\n\n## Totals\n")
    report.append(f"- Claims kept: {total_claims}\n")
    report.append(f"- Concept-mentions kept: {total_mentions}\n")
    report.append(f"- Bridge-candidates kept: {total_bridges}\n")

    out = "/home/dalton/projects/claudeflow-testing/tmp/a0-index-extraction-2026-04-23.md"
    with open(out, "w") as f:
        f.write("".join(report))
    print(f"Wrote: {out}")
    print(f"Totals: claims={total_claims}, mentions={total_mentions}, bridges={total_bridges}")


if __name__ == "__main__":
    main()
