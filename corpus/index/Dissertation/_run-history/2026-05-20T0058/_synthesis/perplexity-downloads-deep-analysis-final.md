# Perplexity-Downloads Deep-Analysis Final List (post-Phase-4.0 ingest)

**Successor to**: `perplexity-downloads-flagged-for-deep-analysis.md` (Phase 3.5 audit)
**Phase**: 4.0 prelude — basic ingest completed
**Run-ID**: 2026-05-13T1439
**Timestamp**: 2026-05-13T18:04

## Purpose

The Phase 3.5 audit assigned **a-priori** deep-analysis flags to 10 `corpus/download/` PDFs based on (a) their representation in the 244-entry Master Citation Report and (b) section-coverage importance. This document **updates** those flags with **empirical density data** from the Phase 4.0 ingest into ChromaDB collection `dissertation-perplexity-cache`.

The density metric (defined: `density = unique_matched_terms × total_hits / chunk_count`) measures concentration of dissertation-relevant terminology — coined terms (e.g., *resonant pathē*, *basic affective valence*), Greek philosophical vocabulary (pathos, phantasia, kinēsis, energeia, dynamis, aisthēsis, etc.), and Heideggerian terminology (Befindlichkeit, Stimmung, Dasein, BCAP, etc.).

## Empirical density ranking (12 ingested Cohort B sources)

| Rank | Filename / source | A-priori flag | Chunks | Density | Top terms |
|---:|---|:---:|---:|---:|---|
| 1 | **Caston 2021 (Cartesian Theatre)** `_extra_cartesian-theatre.pdf` | ★★★ | 29 | **47.17** | phantasia, kinēsis, energeia, aisthēsis |
| 2 | **Agosta 2010 (Clearing of the Affects)** | ★★★ | 17 | **39.41** | pathos, Befindlichkeit, Stimmung, paschein |
| 3 | **Dow 2011 (Emotions as Pleasures)** | ★★★ | 228 | **8.21** | pathos, doxa, aisthēsis, orexis |
| 4 | **Costache 2013 (Idle Talk)** | ★★ | 19 | **4.84** | Dasein, BCAP, Befindlichkeit, doxa |
| 5 | **Withy 2023 (Heidegger on Being Affected)** | ★★★ | 11 | **4.00** | Befindlichkeit, Stimmung, Dasein |
| 6 | **Sheehan 2015 (Paradigm Shift)** | ★★ | 524 | **2.17** | Dasein, Befindlichkeit |
| 7 | **Corcilius 2013 (Animal Motion)** | ★★★ | 75 | **1.47** | kinēsis, energeia, dynamis, orexis |
| 8 | **Christensen 2016 (Anger, Justice, Punishment)** | ★★★ | 129 | **0.78** | pathos, doxa, energeia (UCL MPhil) |
| 9 | Jost & Olmsted (eds.) 2004 (Companion to Rhetoric) | none | 958 | 0.68 | scattered |
| 10 | Newman 2016 (Enthymeme) | none | 389 | 0.10 | low (not the Fredal 2020 work) |
| 11 | Ross trans. 1906 (De Insomniis) | ★ | 12 | 0.08 | phantasia, phantasma (translation only) |
| 12 | Blakesley & Schiappa (eds.) 2009 (Dramatism) | none | 208 | 0.01 | minimal |

**Not ingested (image-only PDF, OCR required if needed)**: Beare trans. 1908 (Aristotle on Sleep and Dreams).

## Empirically-confirmed deep-analysis tier (post-Phase-4.0)

### TIER 1 — Mandatory deep analysis (density ≥ 4.0 OR a-priori ★★★)

These 8 sources must receive full Phase 4 Tier B/C deep analysis: detailed claim extraction, page-anchored citation candidates, cross-edge linking to existing corpus/index pipelines, verbatim verification of any cache entries already extracted from them.

1. **Caston 2021 (Cartesian Theatre)** — density 47.17 — phantasia-content theory; novel for §1.6 phantasma-as-resonant-aisthēma argument.
2. **Agosta 2010 (Clearing of the Affects)** — density 39.41 — BCAP / *Befindlichkeit* / Aristotle's Rhetoric Book II nexus; §1.1, §1.4.
3. **Dow 2011 (Emotions as Pleasures)** — density 8.21 — Aristotelian-emotion theory, doxa-pleasure-pathos triangulation; §1.4, §1.7.
4. **Costache 2013 (Idle Talk)** — density 4.84 — GA 18 / Aristotelian-rhetoric / Heideggerian-discourse; §1.2.
5. **Withy 2023 (Heidegger on Being Affected)** — density 4.00 — Cambridge Elements; §1.1, §1.2, §1.9; the most-current secondary.
6. **Corcilius 2013 (Animal Motion)** — density 1.47 (a-priori ★★★) — MA causal chain; **load-bearing for §1.5**; large 75-chunk source.
7. **Christensen 2016 (Anger)** — density 0.78 (a-priori ★★★) — anger-as-*energeia-tēs-doxēs*; §1.4 (UCL MPhil thesis).
8. **Sheehan 2015 (Paradigm Shift)** — density 2.17 (a-priori ★★) — paradigm-shift Heidegger reading; broad cross-Heideggerian framing.

### TIER 2 — Selective deep analysis (density 0.5 – 2.0 OR a-priori ★)

These 2 sources may yield isolated useful citations; deep analysis should be targeted (use search-by-term within ChromaDB collection rather than chunk-by-chunk reading).

9. **Jost & Olmsted (eds.) 2004 (Companion to Rhetoric)** — density 0.68 — large reference work; useful for chapter-level rhetorical-theory positioning but not for primary argument.
10. **Ross trans. 1906 (De Insomniis)** — density 0.08 — primary-text translation, useful as backup to Loeb / Aristotle Complete Works for phantasma/dreams material in §1.6.

### TIER 3 — No deep analysis (density < 0.5 AND no a-priori flag)

These 2 sources are retained in the collection for completeness but do not warrant deep analysis at the Phase 4 stage:

11. **Newman 2016 (Enthymeme)** — density 0.10 — note: this is **NOT the Fredal 2020 *Enthymeme* work** cited in the Master Citation Report; Fredal 2020 remains an unfulfilled Tier C item.
12. **Blakesley & Schiappa (eds.) 2009 (Dramatism)** — density 0.01 — Burkean-tradition reference, peripheral to the dissertation's argumentative arc.

## Cross-validation against Phase 3.5 a-priori flags

Of the 8 Phase 3.5 ★★★ candidates that exist in `corpus/download/`:

| Candidate | A-priori flag | Empirical density | Validation outcome |
|---|:---:|---:|---|
| Caston 2021 | ★★★ | 47.17 | **confirmed** |
| Agosta 2010 | ★★★ | 39.41 | **confirmed** |
| Dow 2011 | ★★★ | 8.21 | **confirmed** |
| Withy 2023 | ★★★ | 4.00 | **confirmed** |
| Corcilius 2013 | ★★★ | 1.47 | **partial** — large doc; relevance concentrated in §1.5 chapters |
| Christensen 2016 | ★★★ | 0.78 | **partial** — thesis-length doc; relevance concentrated in §1.4 anger-chapter |

Of the 2 Phase 3.5 ★★ candidates that exist in `corpus/download/`:

| Candidate | A-priori flag | Empirical density | Validation outcome |
|---|:---:|---:|---|
| Costache 2013 | ★★ | 4.84 | **upgraded** — density warrants ★★★ treatment |
| Sheehan 2015 | ★★ | 2.17 | **confirmed** |

Of the 2 Phase 3.5 ★★★ candidates NOT in `corpus/download/`:

| Candidate | Notes |
|---|---|
| Burke 1950 (*A Rhetoric of Motives*) | Still missing. Cohort B placeholder retained. 11 cache entries Q-BUR-01..11 remain Tier C until acquired. |
| Fredal 2020 (*The Enthymeme*) | Still missing. Newman 2016 in corpus/download is a different enthymeme work and does NOT substitute. 10 cache entries Q-FRDL-01..10 remain Tier C until acquired. |

## ChromaDB query pattern for Phase 4 Tier B/C agents

```bash
# Tier B/C agents should query the collection with metadata filters:
curl -X POST "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections/b215ff2b-e3ce-4067-aa00-dc8fdc9be24c/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query_embeddings": [<embedding>],
    "n_results": 10,
    "where": {"deep_analysis_flag": {"$in": ["★★★", "★★"]}}
  }'

# Or, restrict to a specific high-density source:
"where": {"source_pdf_filename": "_extra_cartesian-theatre.pdf"}
```

## Routing-plan updates required

Add to `corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/corpus-routing-plan.json`:

```json
{
  "tier_b_chromadb_collection": "dissertation-perplexity-cache",
  "tier_b_collection_id": "b215ff2b-e3ce-4067-aa00-dc8fdc9be24c",
  "tier_b_chunk_count": 2599,
  "tier_b_source_count": 12,
  "tier_b_density_top_4": [
    "_extra_cartesian-theatre.pdf",
    "Lou_Agosta_2010_...pdf",
    "Jamie_Dow_2011_...pdf",
    "Adrian_Costache_2013_...pdf"
  ],
  "tier_c_still_required": ["Burke 1950 — A Rhetoric of Motives", "Fredal 2020 — The Enthymeme"]
}
```

## Summary

Phase 3.5 audit's a-priori deep-analysis flags are **empirically confirmed** by the post-ingest density rankings. Eight of 10 Phase 3.5 ★★★/★★ candidates are validated; Costache 2013 is upgraded from ★★ to operational ★★★ priority based on density. Burke 1950 and Fredal 2020 remain unfulfilled Tier C items. The `dissertation-perplexity-cache` ChromaDB collection (2 599 chunks across 12 sources) is now query-ready for Phase 4 Tier B/C agents.
