# Tier B Citation Fill Proposal — DISS-01-G01-fallback

**Run-id**: 2026-05-13T1439 / Phase 4 Agent 2 (Tier B ChromaDB)
**Generated**: 2026-05-13T18:30 (local)
**Section**: DISS-01-A0
**Claim id**: DISS-01-C042
**Severity**: (fallback designation)
**Load-bearing**: see primary Tier A route for C042
**Support tier (original)**: T1-textually-confirmed (the claim is itself supported by C041)
**Routing tier final**: **NOT REQUIRED — Tier A corpus/index entries cover this**.
**Vetting tag**: `chromadb-weak / Tier-A-route-stands`

## Claim

> "The qua-structure governs everything: what is actualized in motion is actualized as potential, not as achieved completion."

DISS-01-A0 line 21; supported by DISS-01-C041 (Aristotle Physics III.1 quotation). The corpus-routing-plan listed this gap as Tier B "fallback if u-fp2a/u-fp2b corpus/index miss." Phase 4 confirms: u-fp2a and u-fp2b corpus/index entries DO exist and are not missing.

## Outcome: NO TIER B CITATION FILL NEEDED — REROUTED TO TIER A

The corpus-routing-plan flagged `DISS-01-G01-fallback` as Tier B only as a contingency in case corpus/index entries `u-fp2a` (Physics III.1, 200a35–200b25, "the qua-structure") and `u-fp2b` (Physics III.2-3, energeia of the imperfect) were missing. Direct verification:

```
$ ls "corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp2a.md"
corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp2a.md
$ ls "corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp2b.md"
corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp2b.md
```

Both u-fp2a and u-fp2b corpus/index entries exist and are intact. The Tier A route is therefore not missed; this fallback Tier B gap is **resolved without further action**.

## ChromaDB diagnostic (recorded for completeness)

Out of an abundance of caution, queries were nonetheless executed against `knowledge_chunks` (metadata `{collection: metaphysics}` and `{collection: rhetorical_ontology}`):

- Query "Bewegtheit kinēsis Seinscharakter GA 18 Heidegger ontology motion qua-structure" → top hit dist=0.7358 (Aristotle Metaphysics on animal-genus differentiation — off-topic)
- Query "potentiality actualization qua structure motion incompleteness ousia Aristotle Physics" → top hit dist=0.6367 (Aristotle Metaphysics on substance-of-foot — off-topic)
- Query "motion qua potential actualized incomplete energeia entelecheia Aristotle being-character" → top hit dist=0.4759 (Burke 1945 Grammar of Motives on nominalism-vs-realism — off-topic)

No directly-on-topic Bewegtheit material was surfaced via ChromaDB on `knowledge_chunks` (this is because the Bewegtheit content is curated as user-authored corpus/index analyses, not ingested raw text in the metaphysics or rhetorical_ontology collections).

## Recommendation

- **Cite via corpus/index**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp2a.md` (qua-structure, Bekker 200a35-200b25) and `phase2-u-fp2b.md` (energeia of the imperfect, Physics III.2-3).
- **Mark routing**: Tier A confirmed; remove this gap from the Tier B count in the final synthesis tally.

## Provenance

- Phase 4 query script: `tmp/Dissertation/phase4-tier-b/run_all.py`
- Raw result JSON: `tmp/Dissertation/phase4-tier-b/results/DISS-01-G01-fallback.json`
- Tier A entries verified present at: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp2a.md` and `phase2-u-fp2b.md`
