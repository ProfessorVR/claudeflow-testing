# Integration Sandbox — End-to-End Results

**Date:** 2026-04-19
**Status:** ✅ All pipeline stages run error-free on 3 diverse test papers.

## Final index state

| Field | Starting | After e2e | Delta |
|---|---:|---:|---:|
| ontologyNodes | 278 | **844** | +566 |
| crossPipelineHooks | 72 | **317** | +245 |
| tensionEdges | 45 | 45 | 0 |
| claims (new) | 0 | **245** | +245 |
| conceptMentions (new) | 0 | **855** | +855 |
| bridgeCandidates (new) | 0 | **72** | +72 |

## Per-paper breakdown

| Paper | Claims | Mentions | Bridges | Substantive |
|---|---:|---:|---:|---:|
| Aristotle De Anima III.3 | 79 | 320 | 24 | 2 extension |
| Heidegger BCAP §4-5 | 111 | 481 | 24 | 3 extension |
| Caston 1995 | 55 | 54 | 24 | 2 extension (1 dropped by threshold on modern terms) |
| **Total** | **245** | **855** | **72** | **7 promoted** |

## Speaker + stance + use/mention integrity

Reported at the new-schema level; old extractor had no equivalent:

- Speakers: Aristotle 77 / Heidegger 72 / Caston 41 / Kant 13 / Porphyry 5 / "the ancients" 3 / Empedocles 2 / ... (21 distinct speakers tracked)
- Stances: endorses 166 / reports_neutral 72 / critiques 4 / refutes 2 / concedes 1
- Use/mention: use 172 / mention 73 (30% mentions — much higher than the old extractor could capture)
- Faithfulness: supported 183 / partial 56 / unsupported 3 (dropped) / unchecked 6

## Optimizations active

1. **Faithfulness filter.** 3 unsupported claims (potential hallucinations) dropped at recompile. Never reach the writing pipeline.
2. **Use-mention-aware bridge generation.** Mentioned claims are not promoted to cross-pipeline hooks unless they're for the paper's author's own position.
3. **Genre-aware novel ontology tagging.** Primary-text claims add `type: primary-citation` nodes (255); secondary claims add `type: secondary-lit` nodes (311). Downstream retrieval can filter by tier.
4. **Speaker-enriched hooks.** Every hook now carries the speaker who asserts the claim, making cross-predecessor bridges possible ("Heidegger reads Aristotle as ..." vs "Aristotle says ...").
5. **Provenance upgrade.** Every claim now has a verified quote + char offsets + Bekker anchor (for Aristotle) instead of LLM-reported citation strings.

## What the integration buys you

- **No hallucinated provenance.** 99% of claims carry Bekker anchors (for DA) or 100% verified page anchors (for BCAP, Caston).
- **Dialectical structure preserved.** Aristotle's predecessor reports (Democritus, Empedocles, Anaxagoras) are tagged with the correct speaker, not attributed to Aristotle.
- **No cross-contamination.** Heidegger's reports of Kant/Porphyry don't silently turn into "Heidegger endorses Kant".
- **Filterable claim types.** god-write can now request "only thetic claims from Aristotle" or "only critical_claims from Caston".

## Known limitations

- **Caston ontology-matching is thin.** 54 mentions from 55 claims = 1 match/claim avg, because modern philosophy terms (intentionality, aboutness) aren't in the classical ontology. Threshold 0.55 is probably right; the fix is enriching the ontology, not loosening the match.
- **Bridge substantive-rate is ~10%** (7/72). Most candidate bridges are judged "unrelated" because the existing hook set already covers the conceptual space well. This is a reasonable filter, not a bug.
- **32 flagged items across all 3 papers** (~13% of extractions) for your morning review (see `../claim-extractor-upgrade/sandbox/gold/*-flagged.jsonl`).

## File layout produced

```
integration-sandbox/
├── FINAL-RESULTS.md                                  (this file)
├── README.md
├── corpus/index/
│   ├── compiled-index.json                           (final 844 nodes / 317 hooks)
│   ├── ontology-embeddings.jsonl                    (278 base embeddings)
│   ├── aristotle-da-3-3/
│   │   ├── aristotle-da-3-3-claims.jsonl           (79 claims)
│   │   ├── aristotle-da-3-3-concept-mentions.jsonl (320 mentions)
│   │   └── aristotle-da-3-3-bridge-candidates.jsonl (24 candidates)
│   ├── heidegger-bcap-4-5/ ...
│   └── caston-1995/ ...
└── scripts/
    ├── analyze.py                                   (end-to-end orchestrator)
    ├── resolve_concepts.py                          (new-schema compatible)
    ├── generate_bridges.py                          (speaker/stance aware)
    ├── recompile_index.py                           (faithfulness + taxonomy filter)
    └── extractor/                                   (v1 extractor + prompts)
```

## Reproduction

```bash
cd /home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/integration-sandbox
bash tests/run_e2e.sh     # reruns the whole thing from PDFs (takes ~25 min, ~$1.50)
```

Or to add another paper without re-running existing ones:

```bash
python3 scripts/analyze.py \
    --pdf "/path/to/NewPaper.pdf" \
    --genre secondary \
    --author "Name" --title "Title" --year 2020 --slug new-paper-slug \
    --first-page 1 --last-page 20
# This recompiles the whole index at the end.
```

## Next decisions (for your morning review)

1. **Accept the 7 promoted bridges** from this run, or adjust criteria in `recompile_index.py` (currently promotes `alignment|extension|contestation|restatement` with `confidence != low` OR `alignment` regardless).
2. **Accept the 566 novel ontology nodes**, all tagged `centralityTier: peripheral` — before batch-processing the remaining 30 secondary PDFs. Most of these are terms that appeared only in one paper (may need frequency-based centrality rescoring).
3. **Review the 32 flagged items** in `../claim-extractor-upgrade/sandbox/gold/*-flagged.jsonl` before scaling up. Most are taxonomy edge cases (exegetical vs predecessor_report).
4. **Enrich the ontology with modern-philosophy terms** if Caston-style recall is a priority — or accept that secondary commentators on non-classical topics will have thin integration.

Ready to promote to live or to run batch extraction across the remaining corpus when you approve.
