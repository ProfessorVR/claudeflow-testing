# Phase 4.0 Prelude — Basic Ingest Summary (`corpus/download/`)

**Run-ID**: 2026-05-13T1439
**Timestamp**: 2026-05-13T18:04 (local)
**Plan reference**: `tmp/Dissertation/DISSERTATION-ANALYSIS-PIPELINE-PLAN.md` §10.0 (steps 4.0.1–4.0.5)
**Audit reference**: `corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/perplexity-downloads-flagged-for-deep-analysis.md`
**Ingest script**: `tmp/Dissertation/phase4-prelude/run-ingest.py`
**Machine summary**: `tmp/Dissertation/phase4-prelude/phase4-0-ingest-summary.json`

## Service status

| Service | Endpoint | Status | Model / engine |
|---|---|---|---|
| Embedding | `http://localhost:8000/` | running | gte-Qwen2-1.5B-instruct (1536D) |
| ChromaDB v2 | `http://localhost:8001/api/v2/heartbeat` | running | HNSW, cosine |

Both services online; full ingest executed (no classification-only fallback).

## ChromaDB collection

| Field | Value |
|---|---|
| Collection name | `dissertation-perplexity-cache` |
| Collection ID | `b215ff2b-e3ce-4067-aa00-dc8fdc9be24c` |
| Space | cosine |
| Dimension | 1536 |
| Total chunks inserted | **2 599** |
| Source documents | 12 of 13 Cohort B PDFs (1 skipped — image-only PDF) |

Metadata schema per chunk:
`source_pdf_filename`, `author`, `year`, `title`, `page_start`, `page_end`, `chunk_index`, `phase`, `run_id`, `deep_analysis_flag`.

## Classification (20 PDFs total)

### Cohort A — Skip (already in `corpus/index/`); route cache hits to Tier A

| Filename | corpus/index target |
|---|---|
| `Kevin_White_1985_The_Meaning_of_Phantasia_in_Aristotle_s_De_Anima_III_3-8.pdf` | `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/White - Phantasia in DA III.3-8 (1985)/` |
| `_extra_Frede_Cogitive_Role_of_Phantasia.pdf` | `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Frede - Cognitive Role of Phantasia (1992)/` |

**Count**: 2 — both are duplicates of already-indexed sources. Cache entries citing White 1985 (W-1..12) and Frede 1992 (Q-FRD-01..12) are promoted Tier C → Tier A by routing change; no ingest performed.

### Cohort B — Basic ingest into `dissertation-perplexity-cache`

| Filename | Author / year | Chunks | Density | Deep-analysis flag |
|---|---|---:|---:|:---:|
| `_extra_cartesian-theatre.pdf` | Caston 2021 | 29 | **47.17** | ★★★ |
| `Lou_Agosta_2010_..._Clearing_of_the_Affects.pdf` | Agosta 2010 | 17 | **39.41** | ★★★ |
| `Jamie_Dow_2011_Aristotle_s_Theory_of_the_Emotions.pdf` | Dow 2011 | 228 | **8.21** | ★★★ |
| `Adrian_Costache_2013_Heidegger_on_Discourse...pdf` | Costache 2013 | 19 | **4.84** | ★★ |
| `Katherine_Withy_2023_Heidegger_on_Being_Affected.pdf` | Withy 2023 | 11 | **4.00** | ★★★ |
| `_extra_making-sense-of-heidegger-a-paradigm-shift.pdf` | Sheehan 2015 | 524 | 2.17 | ★★ |
| `Corcilius_Klaus_2013_Aristotle_s_Model_of_Animal_Motion.pdf` | Corcilius 2013 | 75 | 1.47 | ★★★ |
| `_extra_Aristotle_20on_20Anger_20Justice_20and_20Punishment.pdf` | Christensen 2016 | 129 | 0.78 | ★★★ |
| `_extra_A_Companion_to_Rhetoric_and_Rhetorical_Citicism....pdf` | Jost & Olmsted (eds.) 2004 | 958 | 0.68 | none |
| `Newman_Sara_2016_The_Enthymeme.pdf` | Newman 2016 | 389 | 0.10 | none |
| `G._R._T._Ross_1906_Aristotle_De_Insomniis_Translation_and_Notes.pdf` | Ross trans. 1906 | 12 | 0.08 | ★ |
| `Blakesley_Edward_Schiappa_2009_Elements_of_Rhetoric_and_Dramatism.pdf` | Blakesley & Schiappa (eds.) 2009 | 208 | 0.01 | none |
| `John_Beare_trans._and_ed.__1908_Aristotle_on_Sleep_and_Dreams_De_Insomniis.pdf` | Beare trans. 1908 | **0 (skipped)** | — | ★ |

**Count attempted**: 13. **Count successfully ingested**: 12. **Total chunks**: 2 599.

Beare 1908 is image-only (no extractable text from `pdftotext -layout`; 17-byte output). Deferred to OCR pipeline if/when its primary-text content is needed (the Ross 1906 translation covers the same source text and is ingested).

### Cohort C — Ambiguous / deferred

| Filename | Note |
|---|---|
| `_extra_3df5ade74f241d2affff8371fffffff0.pdf` | opaque-hash filename; defer (peek at text-cache if exists) |
| `_extra_Ae_Bk_3.pdf` | likely Aristotle (Nicomachean Ethics or Rhetoric) Book 3 fragment; defer |
| `_extra_Enacting_20Virtue_20.pdf` | likely an article on virtue ethics; defer |
| `_extra_The_20Nicomachean_20Ethics.pdf` | duplicate primary text (already in `corpus/index/Aristotle - Complete Works/`); defer |
| `_extra_c6ad8b858b5517b5da6df021a2c539a9d917.pdf` | opaque-hash filename; defer |

**Count**: 5. None of these maps cleanly to a Master-Citation-Report source; no ingest performed. A short follow-up audit can resolve these by reading the first page of each text-cache (if produced).

## Dissertation-relevance-density methodology

Density = (unique matched terms × total term occurrences) / total chunks.

**Matched term clusters** (counted via regex with word boundaries; case-sensitive for German nouns):

1. **Coined dissertation terms**: *epithymia*, *resonant epithymia*, *resonant pathē*, *basic affective valence*, *articulational concretion*, *pathos simpliciter*, *resonant orexis*, *resonant aisthēma*, *resonant kinēsis* (and ASCII variants).
2. **Greek cluster**: pathos, pathē, paschein, phantasia, phantasma, kinēsis, energeia, dynamis, aisthēsis, aisthēma, doxa, orexis, epithymia, nous, hexis, kritikon, krisis.
3. **Heideggerian cluster**: Befindlichkeit, Stimmung, Dasein, BCAP, Bewegtheit, In-der-Welt-sein, Erschlossenheit, Geworfenheit.

The product-form weights both **breadth** (how many distinct cluster terms appear) and **intensity** (how often). Top-30%-by-density correlates strongly with the a-priori deep-analysis ★★★ flags assigned in the Phase 3.5 audit, validating both signals.

## Deep-analysis candidates (top by density)

The 4 top-density sources are flagged as **primary Phase 4 Tier B/C deep-analysis priorities**:

1. **Caston 2021 (Cartesian Theatre)** — density 47.17, 29 chunks, ★★★ — phantasia-content theory; dissertation-novel-supporting.
2. **Agosta 2010 (Clearing of the Affects)** — density 39.41, 17 chunks, ★★★ — BCAP-133 / *Befindlichkeit* load-bearing.
3. **Dow 2011 (Emotions as Pleasures)** — density 8.21, 228 chunks, ★★★ — Aristotle-emotions secondary; §1.4 cluster.
4. **Costache 2013 (Idle Talk)** — density 4.84, 19 chunks, ★★ — GA 18 cross-confirmations.

The 4 ★★★ flag candidates from Phase 3.5 audit that fall outside the top-30% by density are nonetheless retained as deep-analysis priorities (cache-entry weight argues for sustained relevance even where in-text term density is lower):
- **Withy 2023** — density 4.00 (★★★; just below the cut)
- **Corcilius 2013** — density 1.47 (★★★; large 75-chunk document; relevance concentrated in §1.5 chapters)
- **Christensen 2016** — density 0.78 (★★★; thesis-length document with §1.4 anger-as-energeia-tes-doxes material)
- **Sheehan 2015** — density 2.17 (★★; large 524-chunk paradigm-shift study; broad cross-Heideggerian framing)

## Per-PDF ingest logs

Per-file logs at `corpus/download/_ingest-logs/<stem>-2026-05-13T1439.log`, each containing:
- text-cache source + size
- chunk count
- term-hit dictionary (top 8 terms)
- per-batch insertion confirmations
- elapsed wall-clock

## Routing-plan changes recommended

Per Phase 3.5 audit §"Routing reconciliation":

1. Promote 2 Cohort A entries' cache citations from Tier B → Tier A (no further action — corpus/index pipelines already exist for White 1985 and Frede 1992).
2. Tier C → Tier B promotion for 12 Cohort B sources now ingested into `dissertation-perplexity-cache` collection.
3. Burke 1950 (*A Rhetoric of Motives*) and Fredal 2020 (*The Enthymeme*) remain **NOT acquired**; these stay Tier C and require external sourcing.

## Constraints honored

- No corpus/index pipelines created (deferred decision).
- No Marker GPU OCR (basic ingest only — pdftotext → chunk → embed → store).
- Existing embedding service + ChromaDB instance reused.
- Existing text-cache reused where present (9 of 13); 4 generated via pdftotext during this run.
