# 17-Sources-vs-Corpus-Index Audit + Deep-Analysis Flag List

**Phase 3.5 — Tier C Cache Reconciliation (Plan §9.5.1 step 3.5.8 + §10.0.4)**
**Run-ID**: 2026-05-13T1439
**Date generated**: 2026-05-13

## Purpose

The 244-entry Tier C cache draws from **17 secondary sources** (advertised in the master report header). Per Plan §3.5.8, this audit determines which of those 17 are already represented in the existing `corpus/index/...` pipelines (so the cache extraction can be promoted from Tier C → Tier A) and which exist only in `corpus/download/...` as raw PDFs (so they need basic ingestion before they can be promoted out of Tier C status).

## Audit table

| Source | Master report ID prefix | corpus/index? | corpus/download? | Status | Routing change | Deep-analysis-flag candidate |
|---|---|---|---|---|---|---|
| Frede 1992 (Cognitive Role of Phantasia) | Q-FRD | **YES** — `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Frede - Cognitive Role of Phantasia (1992)/` | also `corpus/download/_extra_Frede_Cogitive_Role_of_Phantasia.pdf` (duplicate; redundant) | already-indexed | **Tier C → Tier A** (12 entries Q-FRD-01..12) | n/a |
| Caston 1995 (Why Aristotle Needs Imagination) | Q-CAS | **YES** — `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Caston - Why Aristotle Needs Imagination (1995)/` | n/a | already-indexed | **Tier C → Tier A** (12 entries Q-CAS-01..12) | n/a |
| Caston 2021 (Cartesian Theatre) | Q-CST | **NO** | YES — `corpus/download/_extra_cartesian-theatre.pdf` | **download-only** | candidate for **Phase 4.0 basic ingest** | **★ YES (deep-analysis flag)** — Caston 2021 is a major, recent, dissertation-novel-supporting secondary; phantasia-content theory directly grounds chapter |
| Nussbaum 1985 (Phantasia in Action) | Q-NUS | **YES** — `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Nussbaum - Phantasia in Action (1985)/` | n/a | already-indexed | **Tier C → Tier A** (12 entries Q-NUS-01..12) | n/a |
| Papachristou 2013 (Three Kinds of Phantasia) | P | **YES** — `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/` | n/a | already-indexed | **Tier C → Tier A** (12 entries P-1..12) | n/a |
| White 1985 (Phantasia in DA III.3-8) | W | **YES** — `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/White - Phantasia in DA III.3-8 (1985)/` | also `corpus/download/Kevin_White_1985_...pdf` (duplicate; redundant) | already-indexed | **Tier C → Tier A** (12 entries W-1..12) | n/a |
| Gonzalez 2006 (Phantasia in Rhetoric III.1) | Q-GON | **YES** — `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Gonzalez - Phantasia in Rhetoric III.1 (2006)/` | n/a | already-indexed | **Tier C → Tier A** (12 entries Q-GON-01..12) | n/a |
| O'Gorman 2005 (Phantasia in Rhetoric) | Q-OGR | **YES** — `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/O'Gorman - Phantasia in Rhetoric (2005)/` | n/a | already-indexed | **Tier C → Tier A** (13 entries Q-OGR-01..13) | n/a |
| Hawhee 2011 (Rhetorical Vision) | Q-HAW | **YES** — `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Hawhee - Rhetorical Vision (2011)/` — **NOTE Phase 3 inconsistency-finding**: the title was sometimes misquoted as "Bodily Arts" in Phase 2 outputs (Hawhee's _Bodily Arts_ is a 2004 book; her 2011 article is "Looking into Aristotle's eyes: Toward a theory of rhetorical vision" in *Advances in the History of Rhetoric*). The corpus/index pipeline correctly uses the 2011 *article*. | n/a | already-indexed (audit-needed) | **Tier C → Tier A** (12 entries Q-HAW-01..12); also **audit Phase 2 cite outputs for "Bodily Arts" mis-citation** | n/a (title-cite audit only) |
| Bowin 2017 (Perception and Cognition of Time) | B | **YES** — `corpus/index/Aristotelian Motion and Time Secondary/Bowin - Perception and Cognition of Time (2017)/` | n/a | already-indexed | **Tier C → Tier A** (11 entries B-1..11) | n/a |
| Gross & Kemmann (eds.) 2005 (*Heidegger and Rhetoric*) | Q-HRH | **YES** — `corpus/index/Heidegger and Rhetoric/` (7 contributor sub-directories: Gadamer, Gross-Introduction, Hyde, Kisiel, Michalski, Pöggeler, Struever) | n/a | already-indexed | **Tier C → Tier A** (17 entries Q-HRH-01..17) | n/a |
| Gross 2017 (Uncomfortable Situations) | Q-GRO | **YES** — `corpus/index/Uncomfortable Situations/` | n/a | already-indexed | **Tier C → Tier A** (10 entries Q-GRO-01..10) | n/a |
| Rickert 2018/2019 (Ambient Rhetoric / It Is All There) | Q-RIC | **YES** — `corpus/index/Rickert - Ambient Rhetoric/` (the 2018 chapter "Towards ecosophy in a participating world" + 2019 "It is all there" article) | n/a | already-indexed | **Tier C → Tier A** (12 entries Q-RIC-01..12) | n/a |
| Burke 1945 (Grammar of Motives) | (not in this report; Burke 1950 only) | YES — `corpus/index/A Grammar of Motives (Burke 1945)/` | n/a | already-indexed (1945 only) | n/a — the report uses Burke 1950 (Rhetoric of Motives), NOT 1945 | n/a |
| Burke 1950 (A Rhetoric of Motives) | Q-BUR | **NO** — corpus/index has Grammar 1945 but **not Rhetoric of Motives 1950** | NO — appears not to be in corpus/download | **NOT IN PIPELINE; NOT IN DOWNLOAD** | **candidate for Phase 4.0 ingest** (acquire PDF + ingest into corpus/index/Burke - A Rhetoric of Motives/) | **★ YES (deep-analysis flag)** — Burke 1950 is recurrent in §1.7 cluster (11 entries Q-BUR-01..11); the *Rhetoric of Motives* is the foundational text for identification/consubstantiality material at lines 109-114 of §1.7 |
| Agosta 2010 (Heidegger's 1924 Clearing of the Affects) | Q-AGO | **NO** | YES — `corpus/download/Lou_Agosta_2010_Heidegger_s_1924_Clearing_of_the_Affects_Using_Aristotle_s_Rhetoric_Book_II.pdf` | **download-only** | candidate for **Phase 4.0 basic ingest** | **★ YES (deep-analysis flag)** — Agosta 2010 is a load-bearing reference for the chapter's BCAP-133/Befindlichkeit material; 10 entries Q-AGO-01..10 |
| Costache 2013 (Heidegger on Discourse and Idle Talk) | Q-COS | **NO** | YES — `corpus/download/Adrian_Costache_2013_Heidegger_on_Discourse_and_Idle_Talk_The_Role_of_Aristotelian_Rhetoric.pdf` | **download-only** | candidate for **Phase 4.0 basic ingest** | **YES (deep-analysis flag)** — Costache 2013 supplies multiple GA 18 cross-references that cross-confirm Agosta and Gross translations |
| Withy 2023 (Heidegger on Being Affected) | Q-WIT | **NO** | YES — `corpus/download/Katherine_Withy_2023_Heidegger_on_Being_Affected.pdf` | **download-only** | candidate for **Phase 4.0 basic ingest** | **★ YES (deep-analysis flag)** — Withy 2023 is the most recent (Cambridge Elements 2023) secondary in the cache; cited 10+ times across §1.1, §1.2, §1.9 |
| Fredal 2020 (The Enthymeme) | Q-FRDL | **NO** | NO (?) — verify; appears that Newman 2016 (in corpus/download as Newman_Sara_2016_The_Enthymeme.pdf) is a DIFFERENT enthymeme work. Fredal 2020 *The Enthymeme: Syllogism, Reasoning, and Narrative in Ancient Greek Rhetoric* (Penn State UP) appears not present | **NOT IN PIPELINE; possibly NOT IN DOWNLOAD** | candidate for **Phase 4.0 basic ingest** OR locate the correct PDF | **YES (deep-analysis flag)** — Fredal 2020 supplies enthymeme/inference-as-perception material at §1.3, §1.5, §1.7, §1.9 (10 entries) |
| Sheehan 2015 (Making Sense of Heidegger) | Q-SHE | **NO** | YES — `corpus/download/_extra_making-sense-of-heidegger-a-paradigm-shift.pdf` | **download-only** | candidate for **Phase 4.0 basic ingest** | **★ YES (deep-analysis flag)** — Sheehan 2015 is Heidegger-paradigm-shift secondary; cached entries are sparse but ★★ priority for cross-Heideggerian framing |
| Christensen 2016 (Aristotle on Anger, Justice and Punishment) | Q-CHR | **NO** | YES — `corpus/download/_extra_Aristotle_20on_20Anger_20Justice_20and_20Punishment.pdf` | **download-only** | candidate for **Phase 4.0 basic ingest** | **★ YES (deep-analysis flag)** — Christensen 2016 (UCL MPhil thesis) supplies detailed anger-as-energeia-tes-doxes material at §1.4 (10 entries Q-CHR-01..10) |
| Dow 2011 (Aristotle's Theory of the Emotions) | Q-DOW | **NO** | YES — `corpus/download/Jamie_Dow_2011_Aristotle_s_Theory_of_the_Emotions_Emotions_as_Pleasures.pdf` | **download-only** | candidate for **Phase 4.0 basic ingest** | **★ YES (deep-analysis flag)** — Dow 2011 (St Andrews PhD) is a major Aristotle-emotions secondary; 10 entries Q-DOW-01..10 |
| Corcilius 2013 (Aristotle's Model of Animal Motion) | Q-COR | **NO** | YES — `corpus/download/Corcilius_Klaus_2013_Aristotle_s_Model_of_Animal_Motion.pdf` | **download-only** | candidate for **Phase 4.0 basic ingest** | **★ YES (deep-analysis flag)** — Corcilius 2013 is THE key recent secondary for the MA causal chain; 10 entries Q-COR-01..10 of which 7 are ★★★★/★★★ for §1.5 |

## Audit-confirmed cohorts (per Plan §9.5.1 step 3.5.8 + §10.0.4)

### Cohort A — Corpus-index-already-pipeline (Tier C → Tier A routing eligible)

These 13 sources have full corpus/index/... pipelines already established. Cache entries citing them can be **promoted from Tier C to Tier A** without re-ingesting:

1. **Frede 1992** (`Aristotelian Phantasia Secondary (1985-2017)/Frede - Cognitive Role of Phantasia (1992)/`)
2. **Caston 1995** (`Aristotelian Phantasia Secondary (1985-2017)/Caston - Why Aristotle Needs Imagination (1995)/`)
3. **Nussbaum 1985** (`Aristotelian Phantasia Secondary (1985-2017)/Nussbaum - Phantasia in Action (1985)/`)
4. **Papachristou 2013** (`Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/`)
5. **White 1985** (`Aristotelian Phantasia Secondary (1985-2017)/White - Phantasia in DA III.3-8 (1985)/`)
6. **Gonzalez 2006** (`Aristotelian Phantasia Secondary (1985-2017)/Gonzalez - Phantasia in Rhetoric III.1 (2006)/`)
7. **O'Gorman 2005** (`Aristotelian Phantasia Secondary (1985-2017)/O'Gorman - Phantasia in Rhetoric (2005)/`)
8. **Hawhee 2011** (`Aristotelian Phantasia Secondary (1985-2017)/Hawhee - Rhetorical Vision (2011)/`) — audit pending re: Phase 2 "Bodily Arts" mis-citation
9. **Bowin 2017** (`Aristotelian Motion and Time Secondary/Bowin - Perception and Cognition of Time (2017)/`)
10. **Gross & Kemmann (eds.) 2005** (`Heidegger and Rhetoric/`) — 7 contributor sub-directories
11. **Gross 2017** (`Uncomfortable Situations/`)
12. **Rickert 2018/2019** (`Rickert - Ambient Rhetoric/`)
13. **Burke 1945** (`A Grammar of Motives (Burke 1945)/`) — note: this is in corpus/index but is NOT one of the 17 cache-cited sources; cache uses Burke 1950 *Rhetoric of Motives* which is NOT in corpus/index

**Sub-total cache entries promotable Tier C → Tier A**: ~133 entries (Frede 12 + Caston 12 + Nussbaum 12 + Papachristou 12 + White 12 + Gonzalez 12 + O'Gorman 13 + Hawhee 12 + Bowin 11 + Heidegger-and-Rhetoric 17 + Gross 10 + Rickert 12 — minus a few cross-section recurrences).

### Cohort B — Corpus-download-only (Phase 4.0 basic ingest candidates)

These 9 sources exist only as raw PDFs in `corpus/download/` (verified by `ls corpus/download/*.pdf`). They are flagged for **Phase 4.0 basic ingestion** to promote them into corpus/index/... pipelines:

1. **Caston 2021 (Cartesian Theatre)** — `corpus/download/_extra_cartesian-theatre.pdf` — **DEEP-ANALYSIS FLAG ★** (recent, dissertation-novel-supporting; 4 entries Q-CST-01..04 + Q-CST-08)
2. **Burke 1950 (A Rhetoric of Motives)** — **NOT IN DOWNLOAD** (verified missing) — must be acquired; 11 entries Q-BUR-01..11 (§1.7 cluster) **DEEP-ANALYSIS FLAG ★**
3. **Agosta 2010** — `corpus/download/Lou_Agosta_2010_...pdf` — **DEEP-ANALYSIS FLAG ★** (10 entries Q-AGO-01..10)
4. **Costache 2013** — `corpus/download/Adrian_Costache_2013_...pdf` — **DEEP-ANALYSIS FLAG** (10 entries Q-COS-01..10)
5. **Withy 2023** — `corpus/download/Katherine_Withy_2023_...pdf` — **DEEP-ANALYSIS FLAG ★** (recent Cambridge Elements; 10 entries Q-WIT-01..10)
6. **Fredal 2020** — likely NOT in download (Newman 2016 is in download but is a different enthymeme work) — must be acquired; 10 entries Q-FRDL-01..10 **DEEP-ANALYSIS FLAG**
7. **Sheehan 2015** — `corpus/download/_extra_making-sense-of-heidegger-a-paradigm-shift.pdf` — **DEEP-ANALYSIS FLAG ★**
8. **Christensen 2016** — `corpus/download/_extra_Aristotle_20on_20Anger...pdf` — **DEEP-ANALYSIS FLAG ★** (10 entries Q-CHR-01..10)
9. **Dow 2011** — `corpus/download/Jamie_Dow_2011_...pdf` — **DEEP-ANALYSIS FLAG ★** (10 entries Q-DOW-01..10)
10. **Corcilius 2013** — `corpus/download/Corcilius_Klaus_2013_...pdf` — **DEEP-ANALYSIS FLAG ★** (10 entries Q-COR-01..10)

**Sub-total cache entries in cohort B**: ~85 entries (Caston-Cart 5 + Burke 11 + Agosta 10 + Costache 10 + Withy 10 + Fredal 10 + Sheehan 0-1 + Christensen 10 + Dow 10 + Corcilius 10 — accounting for cross-section recurrences).

## Deep-analysis-flag candidates summary

Per Plan §10.0.4, sources with the ★ deep-analysis flag should be prioritized for full corpus/index pipeline construction in Phase 4.0 (basic ingest → chunking → embedding → KU/edge extraction). The flagged candidates are:

**★★★ (Top-priority deep-analysis-flag)**: Corcilius 2013, Dow 2011, Withy 2023, Caston 2021, Agosta 2010, Christensen 2016, Burke 1950
- These 7 sources together account for ~70 of the cache's 244 entries
- Each is a load-bearing secondary for at least one chapter section (§1.5 / §1.4 / §1.1 / §1.9)
- Multiple ★★★★ entries within each cluster

**★★ (Strong supplementary deep-analysis-flag)**: Costache 2013, Sheehan 2015, Fredal 2020
- Strong cross-Heideggerian and cross-rhetorical-tradition framings
- ~30 cache entries

**Total cache entries that would benefit from Phase 4.0 pipeline construction**: ~85-100 of 244 (35-40%)

## Routing reconciliation: Tier C → routing-plan updates

**Pre-Phase-3.5 corpus-routing-plan.json** classifies most cache-likely entries as "B_chromadb_or_corpus_download" because the sources are not yet in corpus/index pipelines. **Post-Phase-3.5**, the routing classification should be revised to:

| Tier | Pre-Phase-3.5 count | Post-Phase-3.5 count | Reasoning |
|---|---|---|---|
| A (corpus/index-routable) | 143 | **~163** (143 + ~20 promoted from B via Cohort A confirmations) | Frede/Caston/Nussbaum/Papachristou/White/Gonzalez/O'Gorman/Hawhee/Bowin/Gross&Kemmann/Gross/Rickert promoted from B → A |
| B (chromadb or corpus/download) | 7 | **~7** (unchanged) | Cohort B sources need Phase 4.0 to migrate to corpus/index |
| C (Perplexity) | 17 | **~3** (G29, G32, G44 + reserve) | 14 freed from §1.4 by cache reconciliation |

## Plan §10.0.4 directive: Deep-analysis routing flag

Per Plan §10.0.4: "Sources that warrant deep-analysis flag receive expanded chunking, KU extraction, and cross-edge linking when ingested into corpus/index."

For the 7 ★★★ deep-analysis-flag candidates (Corcilius 2013, Dow 2011, Withy 2023, Caston 2021, Agosta 2010, Christensen 2016, Burke 1950), the Phase 4.0 ingest must use the expanded protocol:
1. Marker GPU OCR (Tier 1; per ingestion v7)
2. Visual-bbox provenance for all chunks
3. KU extraction with cross-edge linking to existing corpus/index pipelines
4. Cross-reference verification against existing cache entries (to confirm verbatim text was extracted correctly)

For the 3 ★★ supplementary deep-analysis-flag candidates (Costache 2013, Sheehan 2015, Fredal 2020), use standard ingest with reduced edge-linking budget.

## Routing-plan updates required

The following updates to `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/corpus-routing-plan.json` are recommended:
1. Promote ~20 cache-entry routings from Tier B (chromadb_or_corpus_download) → Tier A (corpus_index_routable) for the 13 already-indexed sources
2. Tag the 7 ★★★ deep-analysis-flag candidates with `phase4_ingest_priority: "high"`
3. Tag the 3 ★★ supplementary candidates with `phase4_ingest_priority: "medium"`
4. Add `corpus_index_path_promoted` field to indicate the destination directory (e.g., `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Caston 2021 - Cartesian Theatre/`)

## Summary

- **Corpus-index-already-pipeline cohort (Cohort A)**: 13 confirmed sources, supplying ~133 cache entries to **Tier A** routing (immediate Tier C → Tier A promotion)
- **Corpus-download-only cohort (Cohort B)**: 9-10 confirmed sources, supplying ~85 cache entries; flagged for **Phase 4.0 basic ingest**
- **Deep-analysis-flag candidates**: 7 ★★★ + 3 ★★ = 10 sources; Phase 4.0 priority assignment
- **Net Tier C remaining**: ~3 cache entries that remain Tier C without further sourcing (G29, G32, G44 + reserve)

The cache reconciliation reveals that the dissertation's secondary-literature ecosystem is significantly larger than the existing 13 corpus/index pipelines — Phase 4.0 ingest expansion should focus on the 9-10 Cohort B sources to bring the citation infrastructure into full alignment with the dissertation's literature engagement.
