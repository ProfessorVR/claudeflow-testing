# Dissertation Analysis Pipeline — Living Plan

**Status**: v1.4 — PRE-FLIGHT LOCKED + EXISTING-CACHE INTEGRATED + ESCALATION POLICY ADDED, READY TO EXECUTE
**Created**: 2026-05-13
**Author of dissertation under analysis**: Dalton Salvo
**Working title (inferred)**: *The Rhetorical Soul: An Aristotelian–Heideggerian Architecture of the Actualization of Desire from Perception to Motion*
**Source root**: `tmp/Dissertation/`
**Pipeline output root**: `corpus/index/Dissertation/` (matches the convention of the other corpus pipelines, e.g. `corpus/index/In-Game (Calleja 2011)/`, `corpus/index/Heidegger and Rhetoric/`)
**Plan version history**:
- v1.0 (2026-05-13) — Initial pipeline plan, modeled on Calleja 2011 and Heidegger & Rhetoric 2005 corpus pipelines, with claim-level granularity, Lanham style integration, terminology reckoning, A→An renumbering audit, and re-runnable design
- v1.1 (2026-05-13) — Output root relocated from `tmp/Dissertation/_analysis/` to `corpus/index/Dissertation/` per user
- v1.2 (2026-05-13) — All 8 pre-flight questions resolved: file inventory locked to 7 files (no .md/.tex duplicates, no Pathe/), diagram-static-exports in TikZ-in-md format, Perplexity capped at 40 queries + $100 budget + pause-and-notify protocol, Tier C extended with corpus/download ingest + deep-analysis flagging, runs kept indefinitely, Lanham tier = auto (rationale §15.1), revision roadmap = hybrid (master + per-section, rationale §15.2)
- v1.3 (2026-05-13) — Pre-existing Perplexity citation work (`tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md`: 244 verbatim quotations across 17 secondary sources covering DISS-04-EMOTION's old Pathe §§1.1-1.9) integrated as Tier C cache. New Phase 3.5 (cache reconciliation) and Phase 4.0 prelude (basic ingest of 22 already-downloaded `corpus/download/` PDFs into ChromaDB) added. Expected to save 15-25 Perplexity queries, freeing budget for §§1.0/1.1/1.2/1.3/1.5. **Note** (user 2026-05-13): only `pdftotext -layout` extraction has been done on the 22 PDFs; the full corpus ingest pipeline has NOT been run — Phase 4.0 does basic ingest (text extraction → ChromaDB embed), and deep-analysis flags identify candidates for later full pipelines.
- v1.4 (2026-05-13) — Perplexity escalation policy added per user directive: S1 (sonar-pro + low context, default ~$0.015/q) → S2 (sonar-pro + medium context on no-usable-result, ~$0.04/q) → S3 (sonar-deep-research for load-bearing gaps only, ~$2-3/q). Auto-escalation capped at 3 attempts per gap. 40-query initial allocation is no longer a hard cap; user is willing to raise. Pause-and-notify protocol expanded with 5 user options (add funds, raise cap, S1-only-for-remainder, defer, downgrade). Empirical baseline from 2026-05-10 (15 queries / $0.23) used to project expected per-run cost ~$10, lifetime cost (4 runs) ~$25-40, well under $100 cap.

---

## 0. Reading guide

This plan is the analytical instrument that will be **wielded on the dissertation**, the way Calleja's PIM Operationalization Manual is the instrument wielded on games. It treats the in-progress dissertation chapter as a *primary text* the way the BCAP, BT, and Aristotle corpus pipelines treat their primary texts — but with two crucial inversions:

1. **Author is the user, not a third party.** The pipeline is *helping the user finish*, not adjudicating someone else's argument. Every "weakness," "fallacy," "gap" finding is therefore a *flag to address*, never a verdict. Every flag is paired with concrete remediation: where in `corpus/index/` to look, what specific claim needs scholarly support, what specific terminological alias needs reconciliation.

2. **The text is in motion, not fixed.** The corpus pipelines analyze frozen published volumes. This pipeline must be **idempotent and re-runnable**: the user will run it now on the in-progress draft, revise based on findings, then run it again on the "final" draft. Outputs must be diff-able across runs; the system must surface what's *new* in each run.

The plan therefore borrows the 5-phase pipeline geometry of the corpus pipelines but adds: (a) a claim-extraction layer below the section level; (b) a Lanham style-axis integration; (c) a terminology-reckoning deliverable; (d) an A₀→A₄ renumbering audit; (e) a *gap-filling search* phase that uses the existing corpus index first and the Perplexity API only as fallback; and (f) explicit run-versioning so the user can compare diagnoses across drafts.

---

## 1. Why this pipeline, why now

1. **The dissertation is structurally complete-but-uncalibrated.** Six chapter files (1.0 Introduction → 1.5 A₄ Completed Action) cover the spine $A_0 \rightarrow A_4$ that the dissertation's architectural claim requires. Section 1.4 ("Emotion is Motion") is the **gold standard** (most highly developed; user-named); the other sections are at varying stages of completion. The pipeline's job is to bring every section to 1.4-grade rigor.

2. **There are known structural debts.** The user has flagged several:
   - **A→An renumbering**: the actualization chain originally used $M_n \rightarrow M_{n+1}$; the user is migrating to $M_n \rightarrow A_{n+1}$ to denote that motions are named by their *termini* (actualities), per *Physics* V.1, 224b7–8. The migration is incomplete. Section 1.1 uses both conventions; 1.4 uses both inconsistently; 1.5 still uses the old $M \rightarrow M$ convention. The interactive HTML diagram (`actualization-chain-v7.html`) uses node IDs `A0–A4` and motion IDs `M01, M12, M23, M34` with display labels `M₁→A₁` style, so the diagram is *already* on the new convention — the prose lags.
   - **Terminological proliferation around `pathos`**: the user has coined `basic affective valence`, `pathos simpliciter`, `resonant kinēsis`, `resonant aisthēma`, `resonant orexis`, and uses `pathē/emotion` / `articulational concretion` alongside Aristotle's own four senses (alterability / actual alteration / harmful alteration / magnitude) and Heidegger's gloss. The user has explicitly flagged `resonant orexis` as one term that "may need to be rethought" — particularly when memory elicits the articulationally concrete *pathē* of the *Rhetoric* (anger, fear, shame), `resonant orexis` may need to include those more-developed emotional structures, not just basic hedonic tonality.
   - **Section relocations**: the user has identified that the analysis of *pathos*-as-Metaphysics-sense (currently in §1.4) belongs in §1.2 (Aisthesis), as does the *paschein*-as-preservative-vs-destructive distinction, and the Heideggerian-perception-as-*krisis* discussion. Section 1.2 is *under-developed* in the present draft on exactly these points.
   - **Introduction lag**: §1.0 was written first and has not been updated to reflect the theoretical development of subsequent sections.
   - **§1.5 (A₄ Conclusion) lag**: §1.5 is positioned as the overall conclusion but will need revision once §§1.0–1.4 are revised.

3. **Citation depth is uneven.** The user has explicitly identified that §§1.1, 1.2, and 1.3 need more direct quotations and supporting footnotes from Heidegger, Aristotle, and secondary commentators. §1.4 is closer but still incomplete. Several `\hl{...}` highlight markers and `\inlinenote{...}` annotations in the .tex files mark specific places where the user *knows* citations are needed.

4. **A style profile exists and must be enforced.** The active style profile (`dalton-academic-mkn82c3v`) characterizes the user's prose at 31.24 avg words/sentence, 51.6% long sentences, 20.1% passive, 0.64 formality, transitions {thus, specifically, indeed, accordingly, hence}, author-prominent citations (99.2%). The Lanham style module (`src/god-agent/cli/style/*`) can quantify the prose along six Lanham axes (noun/verb, parataxis/hypotaxis, periodic/running, voice, register, opacity/transparency) plus tacit rhetorical patterns. The §1.4 gold-standard's Lanham profile becomes the **per-section target** against which §§1.0/1.1/1.2/1.3/1.5 will be measured.

5. **Corpus indices exist and are dense.** The corpus index includes nine completed pipelines:
   - Aristotle - Complete Works
   - Heidegger - Basic Concepts of Aristotelian Philosophy (BCAP / GA 18)
   - Heidegger - Being and Time
   - Heidegger and Rhetoric (Gross & Kemmann eds. 2005) — secondary literature, multi-author
   - Aristotelian Phantasia Secondary (1985–2017) — multi-volume cluster
   - Aristotelian Motion and Time Secondary
   - Rickert - Ambient Rhetoric
   - Von Uexküll - Foray into the Worlds of Animals and Humans
   - Burke - Grammar of Motives
   - In-Game (Calleja 2011) — game studies
   
   The compiled-index.json (278 ontology nodes, 72 cross-pipeline hooks, 45 tension edges, 873 canonical terms) is the **first-pass retrieval substrate**. ChromaDB collections (`metaphysics`, `new_media`, `rhetorical_ontology`) are the second-pass substrate. Perplexity API is the third-pass fallback for genuinely-missing literature.

The pipeline is therefore the bridge between (a) the user's nearly-complete chapter draft and (b) the corpus index already curated to ground that chapter's argument. Most "gaps" are not genuine knowledge gaps — they are **retrieval gaps**: the citation exists in the corpus but the draft hasn't yet pulled it. The pipeline's job is to surface those connections at claim-level granularity and propose specific insertions.

---

## 2. Goals and non-goals

### Goals (in priority order)

| # | Goal | Output that satisfies it |
|---|------|--------------------------|
| G1 | Audit and reconcile **terminology** across all six dissertation files. | `_synthesis/terminology-reckoning.{md,json}` |
| G2 | Audit and propose corrections for the **A₀→A₄ + Mₙ→Aₙ₊₁ renumbering** across all files and the diagram. | `_synthesis/numbering-audit.{md,json}` + per-file patch suggestions |
| G3 | Extract every **propositional claim** in the dissertation at fine granularity, tag each as (supported / under-supported / unsupported / interpretive-conjecture / textually-confirmed-but-implication-overreaches). | `_per-section/<section-id>/claims.{md,json}` |
| G4 | For each under- or un-supported claim, propose **specific citation insertions** drawn first from `corpus/index/` and second from `corpus/<pdf-path>` directly; route genuinely missing literature to the Perplexity API queue. | `_per-section/<section-id>/citation-gap-table.{md,json}` |
| G5 | Identify **logical inconsistencies, fallacies, and unmarked interpretive leaps** within and across sections. | `_synthesis/inconsistencies-and-fallacies.{md,json}` |
| G6 | Quantify each section's **Lanham prose profile** and surface stylistic drift between §1.4 (gold) and the other sections. | `_synthesis/lanham-profile-matrix.{md,json}` + per-section Lanham diff |
| G7 | Identify **content relocations** (the user has flagged at least one: *pathos*-Metaphysics-sense from §1.4 to §1.2; *paschein* preservation/destruction from §1.4 to §1.2; perception-as-*krisis* from §1.4 to §1.2). | `_synthesis/relocations.{md,json}` |
| G8 | Produce a **revision roadmap** that the user can execute section-by-section, in priority order, with each task scoped to be completable in a single sitting and re-runnable on the next draft. | `_synthesis/revision-roadmap.{md,json}` |
| G9 | Be **idempotent and diff-able**: re-running on a revised draft must surface (a) which prior flags are resolved, (b) which remain, (c) what's new. | `_run-history/<run-id>/` snapshots + cross-run diff in synthesis |

### Non-goals

| # | Non-goal | Why |
|---|----------|-----|
| NG1 | We do **not** generate new prose for the dissertation. | The dissertation is the user's voice; this pipeline diagnoses and proposes, does not draft. (Exception: small mechanical fixes like Mₙ→Mₙ₊₁ → Mₙ→Aₙ₊₁ may be offered as `Edit`-ready patches, but only with user confirmation per patch.) |
| NG2 | We do **not** download Perplexity-sourced material into the corpus automatically. | The user has explicit preferences (`feedback-corpus-index-first.md`, `feedback-missing-source-placeholder.md`) about source vetting. Perplexity findings are *proposals* the user reviews. |
| NG3 | We do **not** rewrite the user's coined terminology unilaterally. | The user has explicitly flagged that coined terms (esp. `resonant orexis`) may need reworking but reserves judgment. The pipeline surfaces tensions and offers reformulation candidates; the user decides. |
| NG4 | We do **not** assert hard verdicts on contested interpretive claims (e.g., the *Physics* IV.14 strong reading of "time without soul is ontologically incomplete"). | The dissertation already flags these as cautious-conditional. The pipeline confirms that flagging is appropriate and flags any unflagged interpretive moves. |
| NG5 | We do **not** Phase-4-back-edit the corpus pipelines. | Phase 4 in the corpus pipelines (parked) would propagate dissertation findings *into* the corpus indices. That belongs in a separate downstream pipeline once the dissertation is final. |

---

## 3. Inputs and inventory

### 3.1 Dissertation files under analysis

**Locked per user 2026-05-13**: only the specific files listed below are analyzed. The user has explicitly excluded all other variants (`.md` working copies of sections that have a canonical `.tex`; the `Pathos and Pathe` working copy of §1.4; the `Pathe/` subdirectory which is notes-only).

| File ID | Path | Format | Status (per user) | Plan-internal section ID |
|---------|------|--------|-------------------|---------------------------|
| D-1.0 | `tmp/Dissertation/1.0 - Introduction/1.0 - Introduction.md` | Markdown w/ LaTeX | Needs development — written first, untouched since | DISS-00-INTRO |
| D-1.1 | `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex` | LaTeX | Needs additional direct quotations + footnotes | DISS-01-A0 |
| D-1.2 | `tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_OUTPUT_v1.tex` | LaTeX | Needs relocation of *pathos*/`paschein`/perception-as-*krisis* from §1.4 | DISS-02-A1A2 |
| D-1.3 | `tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md` | Markdown w/ LaTeX | Needs more direct quotations + footnotes | DISS-03-A3 |
| D-1.4 | `tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md` | Markdown w/ LaTeX | **GOLD STANDARD** — measure all others against this | DISS-04-EMOTION |
| D-1.5 | `tmp/Dissertation/1.5 - A4 - Completed Action/1.5 - A4 - Completed Action.md` | Markdown w/ LaTeX | Conclusion; needs rework after upstream revision | DISS-05-A4 |
| D-DIAG | `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/actualization-chain-v7.html` | HTML+SVG (interactive) | Already on M→A convention; needs (a) static LaTeX exports per section, (b) some sub-sections still under-fleshed (hexeis/settled doxa) | DISS-DIAG-V7 |
| D-DIAG-LATEX-REF | `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/Actualization of Desire Diagram in Latex Format.md` | TikZ-LaTeX-in-markdown | Reference format for static per-section exports (see Phase 2c) | DISS-DIAG-LATEX-REF |

### 3.2 Mapping: which dissertation sections correspond to which actualization-chain nodes

| Section ID | Chain region covered | Notes |
|------------|---------------------|-------|
| DISS-00-INTRO | All — framing | Frames the dissertation's overall thesis; positions the actualization-chain-as-instrument |
| DISS-01-A0 | A₀ (Motion + Time) | Establishes ontological ground; threshold to A₁ at section close |
| DISS-02-A1A2 | A₁ → A₂ (Aisthēsis) | Perception's actualization; *resonant kinēsis* dual trace at A₂ |
| DISS-03-A3 | M₂ → A₃ + A₃ (Phantasma + Three Orientational Modes + Doxa) | Phantasma proper; intellection, memory, deliberative/speculative; *doxa* as orthogonal committal layer |
| DISS-04-EMOTION | A₃-engagement → A₄ (Emotion is Motion) | Articulational concretion of pathos into pathē; emotion's function in chain; three types of action |
| DISS-05-A4 | A₄ + recursive close | Completed action; chain recursion; broader rhetorical implications |
| DISS-DIAG-V7 | Whole chain | Visual operationalization; needs per-section static excerpts |

### 3.3 Inputs from corpus/index (already-curated retrieval substrate)

| Index folder | Relevance to dissertation | Likely heavy users |
|--------------|---------------------------|---------------------|
| `Aristotle - Complete Works` | Primary texts: *De Anima*, *Metaphysics*, *Physics*, *De Motu Animalium*, *Rhetoric*, *NE*, *On Memory*, *On Dreams*, *Sense*, *Poetics* | All sections |
| `Heidegger - Basic Concepts of Aristotelian Philosophy` (BCAP / GA 18) | Heidegger's 1924 Marburg lectures — the dissertation's primary Heideggerian source | All sections, especially §§1.2, 1.3, 1.4 |
| `Heidegger - Being and Time` | BT §§29–30 (state-of-mind, fear), §32–33 (understanding, interpretation), §65 (temporality), §68 (taking-care), §81 (within-time-ness) | §§1.1, 1.2, 1.4 (state-of-mind), 1.3 (interpretation), 1.5 (completed action / *Sorge*) |
| `Heidegger and Rhetoric` (Gross & Kemmann 2005) | Secondary literature concordance: Gross intro on rhetorical ontology; Hyde on conscience/epideictic; Struever on *Alltäglichkeit*; Kisiel on protopolitics; Pöggeler restriction-thesis; Gadamer on rhetoric-as-*dynamis* | §§1.0, 1.4, 1.5 (rhetorical framing); §1.4 (pathos genealogy via Gross-A/B) |
| `Aristotelian Phantasia Secondary` | Frede, White, Nussbaum, Hawhee, Papachristou, O'Gorman, etc. | §§1.0 (introduction's phantasia framing), 1.2, 1.3 |
| `Aristotelian Motion and Time Secondary` | Bowin AMT; Coope; Broadie on Physics IV | §1.1 (the central section for this index) |
| `Rickert - Ambient Rhetoric` | Background rhetorical-ontology resonance | §§1.0, 1.5 |
| `Von Uexküll - A Foray into the Worlds of Animals and Humans` | *Funktionskreis*, *Umwelt*, *Merktöne/Wirktöne* — biosemiotic resonance | §§1.2 (perception), 1.3 (phantasma as meaning-carrier) |
| `A Grammar of Motives (Burke 1945)` | Already cited in §§1.1 (entelechy), 1.3 (Hazlitt-identification quoted from RoM); pentad latent | §§1.1, 1.3, 1.4, 1.5 |
| `In-Game (Calleja 2011)` | The dissertation's eventual *application* target (the user will deploy the chain on games via Calleja's PIM) | Future application chapter, not the present 1.0–1.5 spine — but the cross-link is in the corpus and should be flagged for forward integration |
| `Uncomfortable Situations` (Gross 2017) | Situated emotion; Gibson affordances bridge | §§1.4 (emotion), background for application chapter |

### 3.4 Inputs from the Lanham style module

| File | Purpose | How the pipeline uses it |
|------|---------|--------------------------|
| `src/god-agent/cli/style/lanham-analyzer-interface.ts` | ILanhamAnalyzer interface contract | Spec for what the pipeline calls |
| `src/god-agent/cli/style/lanham-prose-analyzer.ts` | Tier 1 (heuristic) implementation | Used by default for every per-section pass |
| `src/god-agent/cli/style/advanced-lanham-analyzer.ts` | Tier 2 (deep) implementation | Used for the §1.4 baseline + any axis Tier 2 is promoted on (currently `periodicRunning`) |
| `src/god-agent/universal/lanham-style-controller.ts` | Facade that merges Tier 1 + Tier 2 per axis-promotion policy | The canonical entry point |
| `src/god-agent/cli/style/lanham-style-policy.ts` | Genre thresholds, target metrics structure | Specifies `academic` genre for the dissertation |

The pipeline targets `genre: 'academic'` and uses §1.4's Lanham profile (computed first) as the per-section target for §§1.0/1.1/1.2/1.3/1.5.

### 3.5 Inputs from pre-existing Perplexity citations work (MAJOR — discovered 2026-05-13)

A substantial Perplexity-driven citation harvest was run on 2026-05-10 against the prior "Pathe chapter" (now consolidated into DISS-04-EMOTION = `1.4 - Emotion is Motion.md`). The artifacts are intact and unprocessed for the new pipeline. They are a Tier C cache.

| Artifact | Path | Contents |
|----------|------|----------|
| Master citation report | `tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md` | 244 verbatim quotations from 17 secondary sources, organized by old Pathe chapter §§1.1–1.9 (all of which now sit inside DISS-04-EMOTION), each with: Source ID, locus, verbatim text (≤80 words), **insertion site (section + quoted phrase from the user's chapter)**, use designation (in-text \| footnote \| epigraph), one-line rationale, priority ★★★★ through ★ |
| Raw quote harvests (6 files) | `tmp/Dissertation/Pathe/citations/quotes-*.md` | Full per-source verbatim harvests; the master report distills these |
| Per-query Perplexity results (16+ files) | `tmp/Dissertation/Pathe/citations/perplexity-results/q01.json` through `q??.json` | The original Perplexity JSON responses keyed by query ID |
| Downloaded PDFs (22 files) | `corpus/download/*.pdf` | 22 PDFs downloaded via Perplexity API search; **not yet ingested into the corpus pipeline** (per user note 2026-05-13: only the basic `pdftotext -layout` text extraction has been done, NOT the full Marker → ChromaDB embedding → KU extraction pipeline) |
| Downloads manifest | `corpus/download/MANIFEST.json` | Per-PDF metadata: qid, author, year, title, venue, url, why-relevant, filename, status |
| Pre-extracted text caches | `corpus/download/text-cache/*.txt` + `tmp/Dissertation/Pathe/citations/text-cache/*.txt` | `pdftotext -layout` outputs ready for grep / quick ChromaDB ingest |
| Download script | `tmp/Dissertation/Pathe/citations/parse-and-download.py` | Reusable for future Perplexity runs |
| Search script | `tmp/Dissertation/Pathe/citations/perplexity-search.sh` | Reusable |

**Why this is a major finding**:

1. **Most Tier C work for DISS-04-EMOTION is already done.** The master report's section coverage (Pathe §§1.1 → 1.9) maps entirely to the present DISS-04-EMOTION file. Every `★★★★` and `★★★` candidate in the report is a load-bearing citation proposal that already has the verbatim, the locus, the insertion site, and the rationale. The pipeline does NOT need to re-issue Perplexity queries for these gaps; it needs to **ingest the report as a Tier C cache and route DISS-04-EMOTION gaps through it first**.

2. **Pre-existing PDFs eliminate download cost** for the 17 sources represented in the report. The 22 PDFs cover: Frede 1992, Caston 1995, Caston 2021, Nussbaum 1985, O'Gorman 2005, Gonzalez 2006, Hawhee 2011, White 1985, Bowin 2017, Papachristou 2013, Gross 2017, Gross & Kemmann (eds.) 2005, Burke 1950, Rickert 2018/2019, Agosta 2010, Costache 2013, Withy 2023, Fredal 2020, Sheehan 2015, Christensen 2016, Dow 2011, Corcilius 2013. Many of these are *already in the existing corpus/index* (Frede, White, Caston, Hawhee, Papachristou, Nussbaum, Gonzalez, Bowin under `Aristotelian Phantasia Secondary`; Burke under `A Grammar of Motives` + cross-pipeline RoM; Gross & Kemmann eds. under `Heidegger and Rhetoric`; Gross 2017 under `Uncomfortable Situations`; Rickert under `Rickert - Ambient Rhetoric`). The new authors NOT in corpus/index but now in `corpus/download/` are: **Agosta 2010, Costache 2013, Withy 2023, Fredal 2020, Sheehan 2015, Christensen 2016, Dow 2011, Corcilius 2013, Caston 2021 (Cartesian Theatre)** — these are candidates for either (a) basic ingest into ChromaDB for the Phase 4 Tier C cache pass, or (b) full corpus/index pipelines later if any prove deep-analysis-worthy.

3. **The report's format is BETTER than what the original plan specified for Tier C output.** The report provides quoted phrase from user's chapter as the insertion anchor; this is precisely what the new pipeline's Tier C proposal format should match. The plan adopts this format.

4. **Two explicit `(CITE)` placeholders in the user's text** are already resolved in the report: §1.6 (Nussbaum) and §1.7 (De Insomniis cluster). These are flagged as "the two most consequential single insertions in this report" per the report's methodology notes.

**Phase implications** (carried forward into §10 below):

- **A new Phase 3.5 ("Tier C cache reconciliation") is added** between Phase 3 Wave 4 and Phase 4 to: (i) parse the master report into structured form; (ii) map old Pathe §-numbers to new DISS-04-EMOTION subsections; (iii) match each report entry to a DISS-04-EMOTION claim by quoted-phrase anchor; (iv) classify each gap as `cache-hit-strong` (★★★★ or ★★★ match) / `cache-hit-supplementary` (★★ or ★ match) / `cache-miss-need-perplexity`. See §9.5 below.
- **Phase 4 Tier C queries Perplexity ONLY for gaps not resolved by the cache.** This is expected to slash the DISS-04-EMOTION Perplexity budget from ~25-30 queries to ~0-5 queries, leaving the 40-query budget free for the OTHER 5 sections.
- **A new Phase 4 prelude ("basic ingest of `corpus/download/`") is added** to embed all 22 PDFs into ChromaDB so they're queryable for any cross-section gap not covered by the master report. The basic ingest does NOT promote them to full corpus/index pipelines — that's flagged for separate consideration.

### 3.6 Inputs from auxiliary memory

Per the running `MEMORY.md` index:
- Style profile: `dalton-academic-mkn82c3v` at `.agentdb/universal/style-profiles.json` — 31.24 avg words/sentence, 51.6% long, 20.1% passive, 0.64 formality
- Lanham authoritative gold set + calibration (2026-04-16) — current calibration scores: nv=0.590, reg=0.574, voice=0.372, para=0.372, opacity=0.193, periodic=0.349
- ICP pipeline (50 bindings, 15.7% citation coverage, 0 author hallucinations) — citation-validation infrastructure already in place
- A₃ Phantasma session (2026-04-27): A₀–A₄ renumbered (was Mn→Mn, now Mn→An); v1 phantasma output needs LaTeX/Bekker/Heidegger fixes
- Heidegger GA 18 PDFs + Active-Intellect Dialectic (2026-04-30): paused at Plato *Sophist* 248e–249d threshold; relevant to §§1.2 (perception-as-mean) and §1.4 (active intellect implication)
- Workflow preferences: backup before changes; max-effort on gold-set annotations; corpus/index FIRST then ChromaDB; ****** placeholder when source not in corpus

---

## 4. Pipeline architecture

The pipeline mirrors the 5-phase architecture of the existing corpus pipelines (Phase 0 overview → Phase 1 per-unit metadata → Phase 2 deep per-unit analysis → Phase 3 synthesis → Phase 4 cross-pipeline integration), with these adaptations:

- **Unit = section file**. The 6 main section files + the diagram = 7 primary units (DISS-00 through DISS-05 + DISS-DIAG).
- **No editorial apparatus** (no preface/index/bibliography in this draft — those come later).
- **Two-pass for every primary unit** (mandatory, like Heidegger & Rhetoric — all units are dissertation-critical by definition since they ARE the dissertation).
- **Claim-extraction layer** added at Phase 2 (granular below section level — this is the most distinctive feature of this pipeline).
- **Phase 3 has 4 specialized synthesis waves**: (3A) ontology + terminology + numbering; (3B) cross-section consistency + relocations; (3C) Lanham style; (3D) citation-gap matrix + corpus-routing.
- **Phase 4 is the gap-filling search phase** (corpus-index-first → ChromaDB → Perplexity), distinct from corpus-pipeline Phase 4 (which is forward integration into the corpus). It is **NOT parked** for this pipeline; it is the deliverable's payoff.
- **Phase 5 is the revision roadmap** (new). It compiles Phase 3 + Phase 4 outputs into an ordered punch-list the user executes.
- **Run-versioned outputs**: every full pipeline execution writes to `corpus/index/Dissertation/_run-history/<YYYY-MM-DDThhmm>/` so the user can diff across drafts. Unlike the other corpus pipelines (which analyze frozen published volumes and need no versioning), this pipeline preserves every run because the underlying dissertation is in revision.

### 4.1 Output layout

```
corpus/index/Dissertation/
├── _run-history/
│   └── <run-id>/                              # one per full execution
│       ├── manifest.json                      # files analyzed, hashes, agent versions
│       ├── phase0-preflight.md
│       ├── _per-section/
│       │   ├── DISS-00-INTRO/
│       │   │   ├── phase1-metadata.json
│       │   │   ├── phase2-claims.json
│       │   │   ├── phase2-claims.md
│       │   │   ├── phase2-narrative.md
│       │   │   ├── phase2-edges.csv
│       │   │   ├── phase2-lanham-profile.json
│       │   │   ├── citation-gap-table.{md,json}
│       │   │   ├── citation-fills/                 # populated by Phase 4: per-gap proposal files
│       │   │   └── revision-checklist.md           # tactical per-section checklist (Phase 5)
│       │   ├── DISS-01-A0/
│       │   ├── DISS-02-A1A2/
│       │   ├── DISS-03-A3/
│       │   ├── DISS-04-EMOTION/                # the gold-standard baseline
│       │   ├── DISS-05-A4/
│       │   └── DISS-DIAG-V7/
│       │       ├── phase1-metadata.json
│       │       ├── phase2-node-audit.json      # A0..A4 + M01..M34 + sub-nodes
│       │       ├── phase2-static-export-needs.md
│       │       └── static-exports/             # 7 TikZ-in-md files, one per export-id
│       │           ├── diag-A0-for-section-1.1.md
│       │           ├── diag-A1-A2-for-section-1.2.md
│       │           ├── diag-M2-A3-doxa-for-section-1.3.md
│       │           ├── diag-A3-M3-A4-for-section-1.4.md
│       │           ├── diag-hexeis-for-section-1.4.md
│       │           ├── diag-A4-recursive-for-section-1.5.md
│       │           └── diag-full-chain.md
│       ├── _synthesis/
│       │   ├── terminology-reckoning.{md,json}
│       │   ├── numbering-audit.{md,json}
│       │   ├── claims-master-index.{md,json}   # every claim from every section, cross-referenced
│       │   ├── inconsistencies-and-fallacies.{md,json}
│       │   ├── relocations.{md,json}
│       │   ├── lanham-profile-matrix.{md,json}
│       │   ├── citation-gap-master.{md,json}   # consolidated across all sections
│       │   ├── corpus-routing-plan.{md,json}   # which corpus index nodes resolve which gaps
│       │   ├── perplexity-queue.{md,json}      # gaps the corpus cannot resolve
│       │   ├── concept-matrix.csv              # concept × section coverage matrix
│       │   ├── global-edges.csv                # cross-section argument graph
│       │   ├── diagram-renumbering-patch.md    # specific HTML/SVG edits proposed for the source HTML
│       │   ├── diagram-static-export-spec.md   # spec for the 7 TikZ-in-md exports produced under _per-section/DISS-DIAG-V7/static-exports/
│       │   ├── perplexity-downloads-flagged-for-deep-analysis.md  # Tier C downloads worth promoting to a corpus/index pipeline
│       │   └── revision-roadmap.{md,json}      # master strategic roadmap (per-section tactical checklists live under _per-section/<id>/revision-checklist.md)
│       └── _graphs/
│           ├── diss-claim-network.mmd
│           ├── diss-terminology-cluster.mmd
│           ├── diss-citation-coverage.mmd
│           └── diss-cross-section-bridge.mmd
└── _living/                                   # symlinks/pointers to the most-recent run
    ├── latest -> _run-history/<latest-run-id>/
    └── diff-from-previous.md                  # what changed since the last full run
```

### 4.2 Run-versioning protocol

Each full pipeline execution gets a run-id of the form `YYYY-MM-DDThhmm` (local time, minute-precision, monotonic so a re-run later the same minute appends `-2`). The run writes ALL outputs into `_run-history/<run-id>/` and is **immutable** thereafter. The `_living/latest` pointer is updated atomically at the end of the run.

When the pipeline runs again on a revised dissertation, the new run:
1. Hashes every input file and notes deltas in its `manifest.json`.
2. Produces all the standard outputs into its own `_run-history/<new-run-id>/` directory.
3. **Generates a diff report** at `_living/diff-from-previous.md` summarizing:
   - Which flags from the previous run are now **resolved** (claim now supported, fallacy now removed, numbering now consistent, etc.).
   - Which flags **remain open** (with last-seen-in/first-seen-in run-ids).
   - Which flags are **new** in this run (often introduced by revisions that fixed one thing and broke another).
   - Which sections have **shifted Lanham profile** since the last run (drift toward or away from §1.4).

This guarantees idempotency: running the pipeline on an unchanged draft produces a near-identical output (only timestamp differs); running on a revised draft surfaces only what changed.

---

## 5. Controlled vocabularies

### 5.1 Object types (per-section claims and edges)

Adopted from Calleja+H&R pipelines, with dissertation-specific types added:

| Type | Description | Example |
|------|-------------|---------|
| CLAIM | A discrete propositional claim the dissertation makes. Each gets a unique ID `DISS-<sec>-C<n>`. | "Aristotle's three-factor schema is scale-invariant from cosmic to psychological levels (DISS-01-C12)" |
| CONCEPT | A named concept used in the dissertation. | *phantasia*, *resonant orexis*, *articulational concretion* |
| CONCEPT-COINED | A concept coined by the user (not standard Aristotelian/Heideggerian). | `basic affective valence`, `pathos simpliciter`, `resonant kinēsis`, `resonant aisthēma`, `resonant orexis`, `articulational concretion` |
| TERM-ALIAS-CANDIDATE | A term that is used in multiple senses or as a synonym for another term, requiring reckoning. | `Befindlichkeit` translated variously as "state-of-mind" / "attunement" / "disposition" / "findingness"; user has flagged need to fix to "state-of-mind" and *Stimmung* to "mood/attunement" |
| ARISTOTLE-LOCUS | A specific Aristotle citation (Bekker number). | `DA III.3, 428a1-3`; `Met. IX.8, 1049b12` |
| HEIDEGGER-LOCUS | A specific Heidegger citation (BCAP page, SZ section + H-page, GA volume + page). | `BCAP 110`; `SZ §29, H.135`; `GA 18, 117` |
| SECONDARY-LOCUS | A specific secondary-literature citation. | `Burke, Grammar 280–281`; `Frede 1992, 279` |
| INTERPRETIVE-MOVE | An explicit interpretive reading the dissertation advances (vs. textually-recovered claim). | "The strong reading of *Physics* IV.14 — time without soul is ontologically incomplete (DISS-01-IM3)" |
| CITATION-NEED | A specific point in the text where a citation is missing or insufficient. | "DISS-01 §1.1, line 23: claim that 'Heidegger reads kinēsis as Bewegtheit' currently has `\textbf{******}` placeholder — needs verbatim from GA 18" |
| RELOCATION | A passage in section X that should be moved to section Y. | "*pathos*-Metaphysics-sense (currently DISS-04 §X.Y) → DISS-02" |
| INCONSISTENCY | A logical or terminological inconsistency within or across sections. | "DISS-01 uses both $M_n \rightarrow M_{n+1}$ and $M_n \rightarrow A_{n+1}$ within the same chapter" |
| FALLACY-CANDIDATE | A potential logical fallacy or argumentative weakness. | "Begging the question by treating *pathos*-as-ontological-substrate as established and then using it to ground subsequent claims" |
| NODE-DIAGRAM | A node in the actualization-chain diagram. | `A0`, `A1`, `A2`, `A3-NOESIS`, `A3-DISCURSIVE` |
| MOTION-DIAGRAM | A motion in the actualization-chain diagram. | `M01`, `M12`, `M23`, `M34` |

### 5.2 Edge relations (claim-level argument graph)

Adopted from Calleja+H&R pipelines:

| Relation | Description |
|----------|-------------|
| `grounds` | Claim A provides the ontological/conceptual ground for Claim B |
| `depends_on` | Claim A presupposes Claim B |
| `instantiates` | Claim A is an instance of the general structure Claim B describes |
| `extends` | Claim A develops/extends Claim B beyond its original scope |
| `refines` | Claim A refines a coarser distinction in Claim B |
| `contrasts_with` | Claim A is in tension with Claim B (productive or unresolved) |
| `cites-as-support` | Claim A draws Locus X as support |
| `glosses-greek` / `glosses-german` | Claim A provides English gloss for a Greek/German term |
| `relocate-to` | Claim A's current section is wrong; it belongs in section Y |
| `inconsistent-with` | Claim A is logically/terminologically inconsistent with Claim B |
| `cites-but-misreads` | Claim A cites Locus X but the citation doesn't support what's claimed |
| `needs-citation` | Claim A is currently unsupported; specific citation needed |
| `awaits-corpus-resolution` | Claim A's citation gap is to be filled from `corpus/index/` |
| `awaits-perplexity-resolution` | Claim A's citation gap exceeds the corpus and must use external search |

### 5.3 Claim support tiers

Every CLAIM is classified into one of these tiers:

| Tier | Description | Action |
|------|-------------|--------|
| T1-textually-confirmed | The claim is directly stated in a primary text and the citation is present and correct. | None. |
| T2-textually-supported | The claim is supported by a primary text via reasonable inference; citation present. | Optional reinforcement with secondary literature. |
| T3-interpretive-but-flagged | The claim is the user's own interpretive reading and is explicitly flagged as such (`I argue`, `the chapter adopts a stronger reading`, etc.). | Verify the flag is present; verify alternative readings are at least gestured at. |
| T4-interpretive-but-unflagged | The claim is interpretive but reads as though textually-grounded. | **Add flagging language.** |
| T5-under-supported | The claim has only a partial citation (e.g., "CITE" placeholder, or vague "as scholars have noted") or no citation where one is needed. | **Add citation from corpus/index or Perplexity.** |
| T6-unsupported | The claim has no citation and the prose does not flag it as the user's own interpretive reading. | **Add citation OR explicitly flag as interpretive.** |
| T7-overreach | The claim is asserted at greater strength than the citation supports. | **Soften or strengthen.** |
| T8-secondary-needed | The primary citation is fine but the claim would benefit from secondary-scholarship reinforcement (esp. for contested readings). | **Add secondary citation (footnote).** |

### 5.4 Centrality tiers (concept-level)

- **core**: Concepts the dissertation's thesis structurally requires (e.g., *energeia ateles*, *resonant kinēsis*, the three-factor schema, *paschein*-as-preservation, *doxa* as orthogonal layer, *articulational concretion*).
- **important**: Concepts that carry chapter-internal load (e.g., *hexis* mode bivalence, *kairos*, *Befindlichkeit*).
- **supporting**: Concepts cited in passing or as illustrative examples.

### 5.5 Lanham axes (six + tacit)

Per the existing module:
1. **Noun/Verb style** — nominalization density, be-verb ratio, prepositional-phrase chaining.
2. **Parataxis/Hypotaxis** — coordination vs. subordination ratio.
3. **Periodic/Running** — sentence-end weight distribution.
4. **Voice** — active/passive balance and voicing strategies.
5. **Register** — Latinate vs. Anglo-Saxon lexical bias, formality, AWL ratio.
6. **Opacity/Transparency** — meta-linguistic markers, opacity content markers, alliteration density.
7. **Tacit patterns** (separate axis returned by both Tier 1 and Tier 2): anaphora, chiasmus, antithesis, isocolon, climax, polyptoton, alliteration density.

---

## 6. Phase 0 — Preflight

**Goal**: Establish run metadata, freeze inputs, run mechanical audits that don't require deep reading.

**Duration estimate**: 6–10 min wall time, sequential single agent (mostly I/O and regex passes).

### 6.1 Steps

| Step | Action |
|------|--------|
| 0.1 | Create `_run-history/<run-id>/` and `manifest.json`. Record SHA-256 of every input file. |
| 0.2 | Scan each section file for `\hl{...}`, `\inlinenote{...}`, `(CITE)`, `\textbf{******}`, `TBD`, `???`, and bare `(CITE)` markers. These are **user-acknowledged gaps** to be carried forward to Phase 4. |
| 0.3 | Scan each section file for $M_n \rightarrow M_{n+1}$ patterns and $M_n \rightarrow A_{n+1}$ patterns. Count occurrences of each. Identify mixed-usage sections. (LaTeX: `M_\d \\rightarrow M_\d`, `M_\d \\rightarrow A_\d`, etc. Markdown: similar.) |
| 0.4 | Scan each section for Greek term occurrences (regex over `\gk{...}` and `\textgreek{...}` and raw Greek Unicode). Build a per-section Greek-token frequency table. |
| 0.5 | Scan each section for the user's coined terms: `basic affective valence`, `pathos simpliciter`, `resonant kin[eē]sis`, `resonant aisth[eē]ma`, `resonant orexis`, `articulational concretion`. Build a per-section occurrence table. |
| 0.6 | Scan each section for translation-variants of `Befindlichkeit`, `Stimmung`, `Sorge`, `Mitsein`, etc. Build a per-section translation-variant table. (The memory record indicates the user wants `Befindlichkeit → state-of-mind` and `Stimmung → mood/attunement` — flag any deviations.) |
| 0.7 | Parse the actualization-chain HTML (`actualization-chain-v7.html`) and extract the canonical node + motion + sub-node IDs. Cross-reference with the dissertation prose. |
| 0.8 | Compute basic stats per section: word count, sentence count, average sentence length, citation density (cites per 1000 words), Greek-token density, footnote density. |
| 0.9 | Write `phase0-preflight.md` summarizing all of the above as a single dashboard. |

### 6.2 Phase 0 deliverable

**`phase0-preflight.md`** — a single-page dashboard the user can scan in 2 minutes:
- Per-section: word count, citation density, footnote count, `\hl`/`\inlinenote` count, `M→M` vs. `M→A` count, coined-term occurrences, Befindlichkeit-translation-variant count.
- Mixed-usage flag: which sections mix old and new numbering.
- Diagram parse: confirm node IDs match prose; flag any prose references to nodes not in the diagram.
- File-hash table for the run.

**Why this is single-agent and sequential**: Phase 0 is mostly I/O and regex; no analytic reasoning required. Fast and cheap.

---

## 7. Phase 1 — Per-section metadata

**Goal**: For each section, produce a structured JSON metadata skeleton capturing section structure, expected concepts, expected loci, OCR/format confidence, deferral notes. Body text NOT stored (consistent with corpus pipelines' copyright-respect convention — though here body text is the user's own).

**Duration estimate**: 8–12 min wall time, up to 3 agents in 3 parallel batches.

### 7.1 Per-section JSON schema

```jsonc
{
  "section_id": "DISS-04-EMOTION",
  "title": "Emotion is Motion",
  "file_path": "tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md",
  "format": "markdown-with-latex",
  "chain_region_covered": ["A3-engagement", "M3-to-A4", "A4-initial"],
  "status_per_user": "gold-standard",
  "word_count": 102898,
  "sections": [
    { "subsection_id": "DISS-04-S1", "heading": "Emotion: The Form of Desire Under Evaluative Disclosure", "lines": "1-12" },
    { "subsection_id": "DISS-04-S2", "heading": "E\\textit{motion} is \\textit{Motion}: The Affective Architecture", "lines": "13-..." }
    // etc.
  ],
  "expected_concepts": ["pathos", "pathē", "paschein", "sōtēria", "basic affective valence", "resonant orexis", "articulational concretion", "hexis", "Befindlichkeit", "Stimmung", "doxa"],
  "expected_aristotle_loci": ["DA II.5, 417b2-7", "DA III.10, 433b12-25", "Met. 21, 1022b15-21", "MA 7, 701a29-b1", "Rhet. II.1, 1378a20-22"],
  "expected_heidegger_loci": ["BCAP 115", "BCAP 122", "BCAP 125", "BCAP 131-132", "BCAP 133", "BCAP 134", "BCAP 176", "SZ §29, H.134-138", "SZ §68b, H.340"],
  "expected_secondary_loci": ["Burke Grammar 280-281", "Frede 1992"],
  "two_pass": true,
  "gold_standard": true,
  "preflight_flags": {
    "highlight_markers": <count>,
    "inlinenote_markers": <count>,
    "cite_placeholders": <count>,
    "asterisk_placeholders": <count>,
    "numbering_inconsistency": <count of mixed M→M vs M→A>
  },
  "lanham_will_be_baseline_for": ["DISS-00-INTRO", "DISS-01-A0", "DISS-02-A1A2", "DISS-03-A3", "DISS-05-A4"]
}
```

### 7.2 Per-section metadata for the diagram (DISS-DIAG-V7)

```jsonc
{
  "section_id": "DISS-DIAG-V7",
  "file_path": "tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/actualization-chain-v7.html",
  "format": "html-svg-interactive",
  "chain_region_covered": ["A0", "A1", "A2", "A3-NOESIS", "A3-MEMORY", "A3-DISCURSIVE", "A3-SPECULATIVE", "A3-doxa-band", "M01", "M12", "M23", "M34", "settled-doxai", "A4", "recursive-loop"],
  "diagram_nodes_canonical": ["A0", "A1", "A2", "A3-NOESIS", "A3-MEMORY", "A3-DISCURSIVE", "A3-SPECULATIVE", "A4"],
  "diagram_motions_canonical": ["M01", "M12", "M23", "M34"],
  "diagram_label_convention": "Mn→An (e.g., M_{01} displays as M_1→A_1)",
  "static_export_format": "TikZ-LaTeX-in-markdown (.md file containing a complete \\documentclass[border=30pt,tikz]{standalone} block, compilable with pdflatex; matches the reference file `Actualization of Desire Diagram in Latex Format.md` in the same diagram folder)",
  "static_exports_needed": [
    {"id": "diag-A0", "for_section": "DISS-01-A0", "scope": "A0 standalone (sensible object in actuality, motion-time substrate)", "output_path": "_per-section/DISS-DIAG-V7/static-exports/diag-A0-for-section-1.1.md"},
    {"id": "diag-A1-A2", "for_section": "DISS-02-A1A2", "scope": "A1 → M01 → A2, with resonant_kinesis dual-trace (resonant_aisthema + resonant_orexis) and kinetic-roles column", "output_path": "_per-section/DISS-DIAG-V7/static-exports/diag-A1-A2-for-section-1.2.md"},
    {"id": "diag-M2-A3-doxa", "for_section": "DISS-03-A3", "scope": "M2→A3 with three orientational modes (NOESIS, MEMORY, DISCURSIVE+SPECULATIVE) + doxa band as orthogonal layer", "output_path": "_per-section/DISS-DIAG-V7/static-exports/diag-M2-A3-doxa-for-section-1.3.md"},
    {"id": "diag-A3-M3-A4-feedback", "for_section": "DISS-04-EMOTION", "scope": "A3-doxa-band → M3→A4 three input paths (deliberation-no-doxa, settled-hexis, emotion-mediated) + A4 + diachronic feedback loop indicator", "output_path": "_per-section/DISS-DIAG-V7/static-exports/diag-A3-M3-A4-for-section-1.4.md"},
    {"id": "diag-hexeis", "for_section": "DISS-04-EMOTION", "scope": "hexeis/settled doxa with M23 connector (for §1.4 hexis-saturation + technē/praxis bivalent treatment); user has flagged this region as currently under-developed in the source HTML — static export must match whatever development state the source has at run time + note the gap", "output_path": "_per-section/DISS-DIAG-V7/static-exports/diag-hexeis-for-section-1.4.md"},
    {"id": "diag-A4-recursive", "for_section": "DISS-05-A4", "scope": "A4 + recursive loop back to A0' (showing how completed action reconstitutes the perceptual field as a new A0 substrate)", "output_path": "_per-section/DISS-DIAG-V7/static-exports/diag-A4-recursive-for-section-1.5.md"},
    {"id": "diag-full", "for_section": "DISS-00-INTRO and final document front-matter", "scope": "Full A0→A4 chain at single-page scale (for the introduction's overview reference and any TOC-adjacent reproduction)", "output_path": "_per-section/DISS-DIAG-V7/static-exports/diag-full-chain.md"}
  ],
  "underdeveloped_subsections": ["hexeis/settled doxa region (per user note)"],
  "two_pass": true
}
```

### 7.3 Quality checks (Phase 1)

- [ ] 7 metadata files written (6 sections + 1 diagram)
- [ ] Every metadata file has `expected_concepts`, `expected_aristotle_loci`, `expected_heidegger_loci`, `expected_secondary_loci`
- [ ] Section heading structure recorded with line ranges
- [ ] Preflight flag counts propagated from Phase 0
- [ ] Diagram metadata names every canonical node + motion + sub-node ID

---

## 8. Phase 2 — Deep per-section analysis

**Goal**: For each section, produce a rigorous claim-level reconstruction of the section's argument, the citations supporting it, the concepts deployed, the relations among claims, and the Lanham profile of the prose. This is the pipeline's analytic core and the longest phase.

**Duration estimate**: 35–50 min wall time, up to 6 agents in parallel (one per section), background; diagram agent runs separately (~10 min).

**Execution discipline**: §1.4 (DISS-04-EMOTION) is analyzed **first and synchronously** because it provides the Lanham profile baseline for the parallel-running other agents. Once §1.4 is done, §§1.0/1.1/1.2/1.3/1.5 fire in parallel.

### 8.1 Per-section analysis template

Each section produces **5 artifacts**:

1. **`phase2-claims.{md,json}`** — granular claim extraction (the core deliverable)
2. **`phase2-narrative.md`** — paraphrastic reconstruction of the section's argument
3. **`phase2-edges.csv`** — argument graph
4. **`phase2-lanham-profile.json`** — Lanham metrics
5. **`citation-gap-table.{md,json}`** — flagged citation needs

#### 8.1.1 Claim extraction (`phase2-claims.{md,json}`)

For each section, scan paragraph-by-paragraph (and where dense, sentence-by-sentence) for propositional claims. For each:

```jsonc
{
  "claim_id": "DISS-01-C12",
  "section_id": "DISS-01-A0",
  "subsection_id": "DISS-01-S2",
  "location": { "line_start": 47, "line_end": 49 },
  "claim_text": "Aristotle's three-factor schema is scale-invariant: it applies at the cosmic level (Prime Mover → spheres → sublunary motion) and at the psychological level (sensible objects → sense-faculty → perceiver).",
  "claim_type": "interpretive-architectural",
  "logical_role": "structural-principle",
  "supports": ["DISS-01-C13", "DISS-02-C04"],
  "supported_by": ["DISS-01-C11"],
  "primary_citations_currently_in_text": [
    { "locus": "DA III.10, 433b12-25", "status": "T1-textually-confirmed" }
  ],
  "secondary_citations_currently_in_text": [],
  "implicit_citations_needed": [
    { "locus": "Met. XII, 1072a23-26 (Prime Mover)", "status": "T5-under-supported", "rationale": "Cosmic-level claim asserted without locus; corpus/index has META-12 unit covering this." },
    { "locus": "Phys. VIII, 256a-260a (cosmic Prime Mover argument)", "status": "T5-under-supported", "rationale": "Same as above; corpus/index PHYS-08 unit covers this." }
  ],
  "support_tier": "T5-under-supported",
  "is_coined_term_present": false,
  "is_interpretive_move": true,
  "interpretive_flag_present": false,
  "interpretive_flag_recommended": "The chapter says 'It is not accidental; it reflects Aristotle's conviction...' which is interpretive; add explicit '[INTERP-LOW]' equivalent or rewrite as 'On the reading I am developing...'.",
  "remediation": {
    "action": "ADD_PRIMARY_CITATION",
    "candidate_loci_from_corpus_index": [
      "corpus/index/Aristotle - Complete Works/META-12 (Metaphysics XII)",
      "corpus/index/Aristotle - Complete Works/PHYS-08 (Physics VIII)"
    ],
    "candidate_loci_from_chromadb": [],
    "candidate_perplexity_query": null,
    "estimated_remediation_effort": "small (5-10 min)"
  }
}
```

The Markdown version (`phase2-claims.md`) renders each claim block as a structured section with the same fields, optimized for human reading.

**Granularity rule**: a "claim" is a discrete proposition that could plausibly be true or false, contested or supported. A complex sentence often contains 2–3 claims (e.g., "Motion is the actuality of the potential qua potential; it is a genuine actuality, and yet it is incomplete because its *telos* lies outside itself" contains three claims). The pipeline extracts each.

**Volume estimate per section**: §1.0 ~60–90 claims (it's a high-density introduction); §1.1 ~150–200 claims (architectural-philosophical); §1.2 ~120–160 claims; §1.3 ~140–180 claims; §1.4 ~250–350 claims (longest section, most developed); §1.5 ~80–120 claims (concluding). **Total: ~800–1200 claims across the dissertation.**

#### 8.1.2 Paraphrastic narrative (`phase2-narrative.md`)

A 1500–3500 word reconstruction of the section's argument *in the user's own voice* — purpose: confirm the analyst has understood the argument before flagging weaknesses. Two functions:

1. **Reading verification**: if the narrative doesn't sound like the user's argument, the analyst has misread, and the entire claim-extraction is suspect.
2. **Skeleton for cross-section synthesis**: Phase 3 uses these narratives as the basis for the cross-section consistency check.

#### 8.1.3 Argument graph (`phase2-edges.csv`)

```csv
source_claim,relation,edge_domain,target,note,location
DISS-01-C12,depends_on,architectural,DISS-01-C03,"Scale-invariance presupposes the three-factor schema is well-formulated.","line 47"
DISS-01-C12,grounds,architectural,DISS-01-C13,"Scale-invariance is what licenses the iterated chain at the psychological level.","line 50"
DISS-01-C12,cites-as-support,citation,ARISTOTLE-LOCUS:DA III.10 433b12-25,"Three-factor schema definition","line 47"
DISS-01-C12,needs-citation,citation,ARISTOTLE-LOCUS:Met. XII 1072a23-26,"Cosmic Prime Mover","line 47"
```

**Target edge count per section**: 40–80 per section; ~300–500 total across the dissertation.

#### 8.1.4 Lanham profile (`phase2-lanham-profile.json`)

Output of `LanhamStyleController.analyze(text, { genre: 'academic', analyzerTier: 'auto' })`. Records every axis score, label, confidence, sub-metrics, and (where relevant) the Tier 2 deep-analyzer result for promoted axes (currently `periodicRunning`).

For §1.4, this becomes the **per-section target metric set** for the synthesis phase.

#### 8.1.5 Citation gap table (`citation-gap-table.{md,json}`)

A per-section consolidated view of every claim flagged at T4/T5/T6/T7/T8. Sorted by remediation effort (small → large) and severity (T6 unsupported → T5 under-supported → T8 secondary-needed). Each row has:
- claim ID + brief text
- support tier
- current citation status
- recommended remediation (with corpus-index candidates, ChromaDB candidates, or Perplexity query)
- estimated effort

**This table is what the user actually consults section-by-section during revision.**

### 8.2 Special agent guidance per section

| Section | Special instructions |
|---------|----------------------|
| DISS-04-EMOTION (run FIRST) | (a) Compute Lanham baseline before others run. (b) Extract every coined-term occurrence with its definition-in-context — this is the canonical source for the terminology-reckoning deliverable. (c) Identify the *pathos*-Metaphysics-fourfold passage and the perception-as-*krisis* passage as RELOCATION candidates (the user has flagged these for §1.2). (d) Extract the user's `feedback loop` analysis (synchronic vs. diachronic) — this is one of the most novel architectural moves and gets dedicated CONCEPT nodes. |
| DISS-00-INTRO | (a) The introduction frames `phantasia` as the temporal-narrative-synthesizing capacity; check if this framing has drifted relative to what §§1.1–1.4 actually develop. (b) Extract the introduction's "promised arguments" and cross-reference with what subsequent sections deliver — surface any unfulfilled promises. (c) The Methodology subsection makes architectural commitments about the actualization chain; check these against the final form in §§1.1–1.5. |
| DISS-01-A0 | (a) This is the section richest in *Physics*, *Metaphysics* citations — verify every Bekker reference is correct. (b) The strong reading of *Physics* IV.14 ("time without soul is ontologically incomplete") is the section's most consequential interpretive move; verify its flag-as-interpretive is present and explicit. (c) Burke's *Grammar* p.280–281 is heavily cited — verify the page numbers against the corpus/index Burke pipeline entries. (d) Check the entire section for both numbering conventions ($M_n \rightarrow M_{n+1}$ AND $M_n \rightarrow A_{n+1}$) and document every occurrence. |
| DISS-02-A1A2 | (a) The user has explicitly noted this section needs (i) *pathos*-Metaphysics-sense relocated from §1.4, (ii) *paschein* preservation/destruction relocated from §1.4, (iii) perception-as-*krisis* relocated from §1.4. Identify the **target insertion points** in §1.2 where these passages should land. (b) Verify that the *resonant kinēsis* dual-trace introduction (here in §1.2) is consistent with how §1.3 (phantasma inherits dual-trace) and §1.4 (basic affective valence / resonant orexis) deploy the structure. (c) The Heideggerian *Zuhandenheit* and *In-der-Welt-sein* glosses appear here — verify against BCAP corpus index. |
| DISS-03-A3 | (a) This section introduces the **three orientational modes + doxa-as-orthogonal-layer** which is one of the dissertation's most distinctive architectural moves. Verify the architectural claims are textually grounded (Aristotle on the synthetic-deliberative function + Heidegger on *doxa* in BCAP). (b) The Papachristou three-grades-of-phantasia citation is flagged with `\inlinenote` — surface as a citation need. (c) The hexeis/settled-doxai discussion is acknowledged-incomplete in the diagram metadata; identify where in the prose this is also incomplete. (d) Check coined-term usage: this section uses `resonant orexis` and `phantasma`-borne hedonic tonality heavily — flag any inconsistencies with §1.4's definitions. |
| DISS-05-A4 | (a) This section uses **only the old $M_n \rightarrow M_{n+1}$ convention** (in the portion read); confirm and produce a full migration patch. (b) Verify that the conclusion's framing matches the introduction's framing (§1.0); surface any drift. (c) The three-types-of-action distinction (simple appetition / habitual-procedural / evaluatively-complex) is here treated in depth; verify consistency with §1.4's parallel treatment. (d) The Heideggerian *aretē*-as-praxis-*hexis* discussion is dissertation-novel; flag interpretive moves carefully. |
| DISS-DIAG-V7 | (a) Compare the diagram's node IDs and motion IDs against every prose reference in §§1.0–1.5; report mismatches. (b) Identify the static-export specifications needed for each section (the diagram is interactive HTML; the dissertation needs print-version cutouts). (c) Identify the hexeis/settled-doxai region's under-development per user note. (d) Verify Mₙ→Aₙ display-label transform (line 1522 of the HTML: "M01 -> M₁→A₁") is consistently applied. |

### 8.3 Quality checks per section

- [ ] Claim count within expected range
- [ ] Every claim has a `support_tier`
- [ ] Every CITATION-NEED claim has at least 1 `candidate_loci_from_corpus_index` entry OR explicit `awaits-perplexity-resolution` flag
- [ ] Every COINED-TERM occurrence is recorded with definition-in-context
- [ ] Every numbering inconsistency from Phase 0 is mapped to specific claim-level locations
- [ ] Every `\hl` and `\inlinenote` marker from Phase 0 is attached to a specific claim
- [ ] Lanham profile is computed; for non-§1.4 sections, also compute deltas from §1.4 baseline
- [ ] Narrative is 1500–3500 words and uses the user's own vocabulary
- [ ] Edge count within expected range
- [ ] Citation-gap-table sorted by effort/severity

---

## 9. Phase 3 — Synthesis

**Goal**: Roll up per-section analyses into cross-section deliverables that surface architectural-level findings (terminology, numbering, relocations, style drift, consistency, citation coverage).

**Duration estimate**: 25–35 min wall time, 4 parallel waves.

### 9.1 Phase 3 — Wave 1: Terminology + numbering + ontology

Three parallel agents:

#### 9.1.1 Agent 3A — Terminology Reckoning

**Output**: `_synthesis/terminology-reckoning.{md,json}`

**Method**:
1. Aggregate every CONCEPT and CONCEPT-COINED across all section claim files.
2. For each, build a canonical record:
   - Canonical name (the user's preferred form)
   - Variants used in the prose (e.g., "basic affective valence" / "basic hedonic tonality" / "basic *pathos*")
   - Definition-in-context per section (so the reader can compare how the term is defined at §1.4 vs. §1.3)
   - Section-by-section occurrence count
   - Tension flag: does the term's definition drift across sections?
   - Reckoning-with-Aristotelian-correlate: which of Aristotle's four *pathos* senses (Met. 21) does the term map onto?
   - Reckoning-with-Heideggerian-correlate: which Heideggerian structure does the term correspond to (e.g., `basic affective valence` ↔ `Befindlichkeit`-as-basic-attunement)?
3. **Specifically address the user's flagged-for-review terms**:

##### Terms requiring explicit reckoning (from user prompt):

| User-coined term | User's working gloss | Aristotelian correlate | Heideggerian correlate | Reckoning task |
|------------------|----------------------|------------------------|------------------------|----------------|
| **`pathos` (most general)** | Aristotle's *Metaphysics* sense — any being's susceptibility to alteration | *Met.* 21, 1022b15 (alterability) | *Pathos* as way-of-being of finite living being (*BCAP* 131-132) | Verify this sense is established BEFORE any specialized sense is deployed; user has flagged this should move to §1.2 |
| **`basic affective valence`** | Most basic hedonic tonality (good/bad, pursue/avoid) co-given with *aisthēsis*; ALSO part of *resonant kinēsis* after sensible object departs | *DA* III.7, 431a8-12 (perception's `kritikon` / `phasis`); *Met.* 21 sense (2) | `Befindlichkeit` at its most basic — pre-doxa attunement | Verify uniformity of definition across §§1.2, 1.3, 1.4. **Flag**: does the term cover both the present-object case AND the after-object case, or only one? Per the user's prompt, both. Verify the prose actually carries this dual scope. |
| **`pathos simpliciter`** | Part of `basic affective valence` — specifically the basic hedonic tonality co-given with object of sense WHEN PRESENT | Same as basic affective valence's first scope | Same as basic affective valence's first scope | **Tension check**: `pathos simpliciter` is defined as "part of `basic affective valence`" — verify the prose maintains the part-of relation. If `pathos simpliciter` IS one half (the present-object half) and `resonant orexis` IS the other half (the residual half), then `basic affective valence` = `pathos simpliciter` ∪ `resonant orexis`. Is this the user's intent? **Surface this as a clarification question.** |
| **`resonant kinēsis`** | The residual, dual traces left behind after interacting with a sensible object; persists | *On Dreams* 459a24-460b3; *DA* II.5, 417a-b (residual motion) | Heidegger's reading of perception-as-being-affected in *BCAP* | Verify the "dual" trace is consistently named: *resonant aisthēma* + *resonant orexis*. Check that nothing in §§1.2–1.4 treats `resonant kinēsis` as single-trace or three-trace. |
| **`resonant aisthēma`** | The formal, eidetic residue — the "what it is" | *DA* II.12, 424a17-24 (form received without matter) | *Eidos*-character of the look (*BCAP* 135 "what *phantasia* makes present is the *eidos*") | Verify it is consistently distinguished from the *phantasma* proper (which appears at A₃, not at A₂). The user's chain: *resonant aisthēma* is at A₂; *phantasma* is constituted at A₃ from A₂'s *resonant kinēsis*. |
| **`resonant orexis`** | Sub-category of basic affective valence; the residual half (the "why it matters") | *Pathos*-as-act-of-altered-being (*Met.* 21 sense 2 applied to memory/anticipation) | Reading of *Befindlichkeit*-as-persistent-tonality | **CRITICAL — user-flagged for rework**: When memory elicits articulationally concrete *pathē* (anger at remembered slight, fear at anticipated evil), what is the structural relation between `resonant orexis` and that emotion? Options to surface for user: (1) `resonant orexis` = basic only; concrete *pathē* require `resonant orexis` + *doxa*, so `resonant orexis` itself remains basic. (2) `resonant orexis` = the *unified affective stratum* including any *pathē* concretized over the residue; concrete *pathē* are higher articulations of `resonant orexis`. (3) `resonant orexis` is renamed/split into `resonant orexis (basic)` + `resonant pathē` (concrete). The user has not yet decided; the pipeline surfaces all three options with the section-by-section evidence that bears on each. |
| **`pathē` / `emotion`** (user uses interchangeably) | The catalog of emotions of the *Rhetoric* — anger, fear, pity, shame, joy, etc. | *Rhet.* II.1, 1378a20-22 (definition); *Rhet.* II.2-11 (catalog) | `Stimmung` (mood) + the existential-disclosive moods of *Sorge* | Verify uniformity. Specifically: does the user ever use `pathē` to refer to basic affective valence? (Per user's prompt, no — `pathē` is reserved for the concrete *Rhetoric* catalog.) Surface any drift. |
| **`articulational concretion`** | Propositional, more developed version of basic *pathos* that depends on *doxa* for its development | *DA* III.3, 427b21-24 (*doxa* → emotion immediately); *Rhet.* II.1 propositional structure | Heidegger on *logos*-articulation grounded in pre-logos `Befindlichkeit` (*BCAP* 176) | Verify this is the only term used for this notion; check if the user ever just says "emotion" where "articulational concretion" is meant. The user's prompt suggests `articulational concretion` is the meta-category distinguishing pathē from "other pathos like *pathos simpliciter* or *resonant orexis*". |

4. **Translation reckoning** (separate sub-table):
   - `Befindlichkeit`: per memory note, user wants "state-of-mind" — but §1.4 alternates "state-of-mind / attunement / disposition" and §1.2 has variants. Flag every occurrence; propose a consistent rendering with footnote at first occurrence.
   - `Stimmung`: per memory note, user wants "mood/attunement". Flag deviations.
   - Other German terms: `Sorge`, `Mitsein`, `Geworfenheit`, `Zuhandenheit`, `Bewegtheit`, `In-der-Welt-sein`, `Erschlossenheit` — record translation choices and check consistency.

5. **Greek term reckoning** (separate sub-table):
   - `pathos` / `pathē` / `paschein` cluster: verify the corpus-index Aristotle pipeline's canonical entries are linked in every section.
   - `kinēsis` / `energeia` / `entelecheia` / `dynamis`: same.
   - `phantasia` / `phantasma`: same.
   - `doxa` / `nous` / `aisthēsis`: same.

##### Output (`terminology-reckoning.md`) structure

```
# Terminology Reckoning — Run <id>

## 1. User-coined terms (8 canonical) + cross-section drift table

### 1.1 pathos (most general sense)
- Canonical definition (proposed): ...
- Aristotelian correlate: Met. 21, 1022b15 (alterability)
- Heideggerian correlate: BCAP 131-132
- Occurrences:
  - DISS-01-A0: 0
  - DISS-02-A1A2: 0 — **user has flagged for relocation here**
  - DISS-03-A3: 2 (lines X, Y)
  - DISS-04-EMOTION: 14 (lines ...) — currently the canonical definition site
  - DISS-05-A4: 0
- Definition drift: ...
- Relocation recommendation: move the canonical definition site from §1.4 (lines A-B) to §1.2 (insertion point after line C). See `relocations.md` for the patch.

### 1.2 basic affective valence
... [same structure] ...

[... 8 user-coined terms total ...]

## 2. Translation variants (Befindlichkeit, Stimmung, Sorge, ...)
[per-term variant tables with recommended canonical rendering]

## 3. Greek-term reckoning (pathos cluster, kinēsis cluster, phantasia cluster, doxa cluster)
[per-cluster canonical-form tables]

## 4. Clarification questions for user (the items that require a decision)
- Q1: `pathos simpliciter` ∪ `resonant orexis` = `basic affective valence`. Is this the user's intent?
- Q2: When memory elicits anger/fear/shame, what is the structural relation between `resonant orexis` and that emotion? (3 options surfaced; recommend (1) but the choice is the user's.)
- Q3: `Befindlichkeit` translation: standardize to "state-of-mind" (per memory note) but several occurrences in §1.4 use "attunement" — should we preserve the in-context variation or standardize uniformly?
- Q4: ... [as discovered]
```

#### 9.1.2 Agent 3B — Numbering audit (A₀..A₄ + Mₙ→Aₙ₊₁)

**Output**: `_synthesis/numbering-audit.{md,json}` + per-file patch suggestions

**Method**:
1. Aggregate Phase 0's numbering scan results across all sections.
2. For each section, produce a **patch list**:
   - Every occurrence of $M_n \rightarrow M_{n+1}$ that should become $M_n \rightarrow A_{n+1}$
   - Every occurrence of `$M_n \to A_{n+1}$` already in the correct form
   - Every mixed occurrence (e.g., footnote uses old, body uses new)
3. **Cross-reference with the diagram**: every Mₙ→Aₙ reference in prose must correspond to an actual motion in the diagram. Surface orphan references.
4. **Cross-reference with the diagram's hexeis/settled-doxai region**: per §1.4, settled doxai are an "additional unmoved originator → M₃→A₃" (diagram line 2451). Prose should align with this convention.
5. Generate a **per-file Edit-ready patch list**:

```jsonc
{
  "file": "tmp/Dissertation/1.5 - A4 - Completed Action/1.5 - A4 - Completed Action.md",
  "patches": [
    { "line": 3, "old": "$M_3 \\rightarrow M_4$", "new": "$M_3 \\rightarrow A_4$", "context_before": "...reached through the *orektikon* transition ", "context_after": " in which desire..." },
    { "line": 7, "old": "$M_3 \\rightarrow M_4$", "new": "$M_3 \\rightarrow A_4$", "context_before": "...rendered possible by ", "context_after": "..." },
    // ... etc
  ],
  "total_patches": <n>,
  "estimated_remediation_effort": "small (10-20 min for whole-file mechanical pass)"
}
```

6. Also patch §1.1 inline TikZ diagram (lines 184-200 of `1.1 - A0 - Motion and Time.md`) where motions are still labeled `M_0 \!\to\! M_1`, `M_1 \!\to\! M_2`, etc.

#### 9.1.3 Agent 3C — Concept ontology

**Output**: `_synthesis/concept-matrix.csv` + canonical concept list embedded in `terminology-reckoning.md`

**Method**: Standard book-level ontology pass (per Calleja+H&R pipelines):
1. Deduplicate concepts across all sections.
2. Assign centrality tier (core / important / supporting).
3. Build the matrix:

```csv
concept,DISS-00,DISS-01,DISS-02,DISS-03,DISS-04,DISS-05,sections_used,centrality
energeia ateles,2,3,1,0,2,1,5,core
resonant kinēsis,0,0,3,2,2,1,4,core
articulational concretion,0,0,0,0,3,1,2,important
hexis (bivalent: technē vs praxis),0,0,0,0,3,3,2,important
...
```

Cells: 0=absent, 1=mentioned, 2=supporting, 3=central.

### 9.2 Phase 3 — Wave 2: Cross-section consistency + relocations

#### 9.2.1 Agent 3D — Inconsistency + fallacy detection

**Output**: `_synthesis/inconsistencies-and-fallacies.{md,json}`

**Method**:
1. Aggregate every INCONSISTENCY and FALLACY-CANDIDATE flagged in Phase 2 across all sections.
2. Add cross-section inconsistencies:
   - **Definitional drift**: same term defined differently in different sections.
   - **Architectural mismatch**: §1.0 promises X, §§1.1–1.4 deliver Y.
   - **Citation-reuse inconsistency**: same Heidegger passage cited at one section claiming X, at another claiming Y; verify the claims are compatible.
   - **Numbering inconsistency**: already captured by 3B.
3. Tag each finding with severity:
   - **CRITICAL**: undermines the dissertation's central thesis; must be fixed before final draft.
   - **MAJOR**: produces reader confusion; should be fixed.
   - **MINOR**: stylistic-level inconsistency; recommended fix.
4. Tag each finding with category:
   - definitional
   - architectural
   - citational
   - numbering
   - terminological
   - fallacy-circular
   - fallacy-equivocation
   - fallacy-strawman
   - fallacy-hasty-generalization
   - interpretive-unflagged
   - overreach

5. For each finding, propose a specific remediation.

##### Common patterns to watch for (per dissertation specifics)

| Pattern | Where to look | Why |
|---------|---------------|-----|
| Equivocation on `pathos` | §§1.2, 1.4 | The 4 *Metaphysics* senses + the *Rhetoric* sense + the user's `pathos simpliciter` coining: easy to slip between senses without re-grounding. |
| Equivocation on `kinēsis` vs `energeia` | §§1.1, 1.3, 1.4 | Aristotle's own treatment is non-uniform; the dissertation must specify whether "motion of the soul in cognition" is `energeia ateles` or `energeia haplē`. Section 1.1 commits to `energeia ateles` for the chain's transitions; verify subsequent sections honor this. |
| Conflation of `phantasia` (activity) with `phantasma` (product) | §§1.3, 1.4 | Papachristou's three-fold (capacity/activity/product). §1.3 attempts the disambiguation; check whether §1.4's usage maintains it. |
| Conflation of `basic affective valence` vs `pathē` | §§1.3, 1.4 | This is the user's central articulational-concretion distinction; must be airtight. |
| Strong-reading-of-*Physics*-IV.14 unflagged uses | §§1.1, 1.2, 1.4 | §1.1 carefully flags this as interpretive-cautious; downstream sections must not implicitly upgrade it to confirmed. |
| `Bewegtheit` quotation marker `\textbf{******}` | §1.1 line ~23 | User has flagged for manual verbatim; until supplied, the surrounding argument is partially under-supported. |
| `In-der-Welt-sein` quotation marker `\textbf{******}` | §1.1 line ~51 | Same as above. |
| Burke `Grammar` page-280-281 reuse | §§1.1, 1.3, 1.4, 1.5 | Verify the same Burke passage is cited consistently across sections. |
| `Stimmung` translation drift | §§1.2, 1.3, 1.4 | Per memory note, user wants consistent rendering. |
| Three-types-of-action treatment | §§1.4, 1.5 | Both sections develop this; verify the bivalent-hexis story is told the same way in both. |

#### 9.2.2 Agent 3E — Relocations + outlines

**Output**: `_synthesis/relocations.{md,json}`

**Method**:
1. Aggregate every RELOCATION candidate flagged in Phase 2.
2. For each relocation, identify:
   - **Source location** (file, line range, ~word count of the passage to relocate)
   - **Target location** (file, proposed insertion point, with surrounding context to verify the fit)
   - **Rationale** (why the user wants this move; what the move accomplishes structurally)
   - **Required downstream edits**: when the passage moves, what citations need updating? what cross-references in other sections need adjustment?
3. **User-mandated relocations** (from prompt):
   - *pathos*-Metaphysics-fourfold (§1.4 → §1.2): identify the exact passage in §1.4 (likely the "*Metaphysics* Fourfold" subsection), specify the §1.2 target (likely just before *aisthēsis*-as-being-affected is introduced), draft the bridge text the user would need to write to integrate.
   - *paschein*-preservation-vs-destruction (§1.4 → §1.2): the *DA* II.5, 417b2-7 passage is currently in both §1.1 and §1.4; verify §1.2 doesn't already have it; propose adding it in §1.2 (just before the *resonant kinēsis* introduction).
   - Perception-as-*krisis* (§1.4 → §1.2): the *BCAP* 126 passage on `mesotēs` + `kritikon` is currently in §1.4; propose moving the *philosophical* statement of perception-as-*krisis* to §1.2 while retaining the *emotional* application in §1.4 (which is where the position-taking aspect of *pathē* uses it).

4. **Pipeline-detected relocation candidates** (beyond the user's explicit list): the analyst should be alert to any passage that addresses a concept structurally before the section in which the concept is canonically developed. For example, §1.1 occasionally invokes `phantasia` in passing but the canonical *phantasia* treatment is §1.3; check if §1.1's invocation is appropriate (foreshadowing) or excess (relocation candidate).

5. **Output structure**: same as a sequenced patch list — relocate-from / relocate-to / bridge-text-suggestion / downstream-edit-list.

### 9.3 Phase 3 — Wave 3: Lanham style matrix

#### 9.3.1 Agent 3F — Lanham profile matrix

**Output**: `_synthesis/lanham-profile-matrix.{md,json}`

**Method**:
1. §1.4's Lanham profile is the **baseline** (the gold standard).
2. For each other section, compute the delta on each of the six axes + tacit-patterns axis.
3. Tag each axis-delta as:
   - **Aligned**: within ±0.1 of baseline.
   - **Drift-toward**: §1.4 is at e.g. 0.6 and §1.1 is at 0.5 (closer to neutral); §1.1 is "weaker" on this axis.
   - **Drift-away**: §1.4 is at 0.6 and §1.1 is at 0.7 (more pronounced); §1.1 is "stronger" on this axis. (Could be intentional or excess.)
   - **Inverse**: §1.4 is at 0.6 and §1.1 is at 0.3 (different label); §1.1 is on the other side of the threshold.
4. Generate per-section recommendations:
   - "§1.0 has noun-style score 0.45 vs §1.4's 0.62. The introduction is more noun-heavy than the gold-standard chapter. Recommended: review §1.0 paragraphs 3-7 for nominalization clusters and prepositional-phrase chains."
   - "§1.5 has periodic-running score 0.30 vs §1.4's 0.50. The conclusion has more terminal-short sentences than the gold-standard. Recommended: review §1.5 for paragraph-closing brevity that may undercut the section's wrap-up function."
5. Cross-reference Lanham findings with claim-level findings — if a section is both Lanham-drifted AND claim-density-low, that's a high-priority revision target.

**Note**: The Lanham profile is *informative*, not prescriptive. The user has explicit style preferences that may differ from the §1.4 profile in some sections (e.g., the introduction may *intentionally* be more accessible). The pipeline surfaces deltas; the user decides which to act on.

### 9.4 Phase 3 — Wave 4: Citation-gap consolidation

#### 9.4.1 Agent 3G — Citation gap master + corpus routing

**Output**: `_synthesis/citation-gap-master.{md,json}` + `_synthesis/corpus-routing-plan.{md,json}` + `_synthesis/perplexity-queue.{md,json}`

**Method**:
1. Aggregate every CITATION-NEED entry across all section citation-gap-tables.
2. Sort into three tiers by remediation route:
   - **Tier A (corpus-routable)**: the missing citation can be resolved from `corpus/index/<existing-pipeline>/`. The corpus-routing-plan specifies the exact pipeline unit and page anchor.
   - **Tier B (chromadb-routable)**: the missing citation is likely in the ChromaDB collections (`metaphysics`, `new_media`, `rhetorical_ontology`) but not yet indexed at the corpus/index level. Phase 4 will run targeted ChromaDB queries.
   - **Tier C (perplexity-queue)**: the missing citation is genuinely external to the existing corpus. Phase 4 will issue Perplexity API queries.
3. **Apply the user's source priority** (per `feedback-corpus-index-first.md`): always try corpus/index first; fall back to ChromaDB; fall back to Perplexity. Never skip to Perplexity if the citation is reachable from corpus/index.
4. **Apply the user's missing-source placeholder rule** (per `feedback-missing-source-placeholder.md`): if Phase 4 cannot locate the required quotation in the corpus, cite by Bekker/SZ/BCAP locus and leave the quotation body as `\textbf{******}` — the user will fill the verbatim manually.
5. For each Tier A gap, produce the routing record:

```jsonc
{
  "gap_id": "DISS-01-GAP-007",
  "claim_id": "DISS-01-C12",
  "claim_text_short": "Aristotle's three-factor schema is scale-invariant...",
  "missing_locus": "Met. XII, 1072a23-26 (Prime Mover)",
  "tier": "A",
  "corpus_index_route": {
    "pipeline": "Aristotle - Complete Works",
    "unit_id": "META-12",
    "page_range_in_book": "1072a20-30",
    "expected_content": "Prime Mover argument; unmoved-mover cosmology",
    "retrieval_action": "Read corpus/index/Aristotle - Complete Works/META-12/[unit-output-file]"
  },
  "chromadb_route": null,
  "perplexity_query": null,
  "user_action_recommended": "Verify Met. XII.7 passage at 1072a23-26; add as footnote/inline citation at DISS-01 line 50 after 'cosmic level'. Suggested phrasing: 'see Metaphysics XII.7, 1072a23-26 on the unmoved mover'.",
  "estimated_effort": "small (5 min)"
}
```

6. For each Tier B gap, produce the ChromaDB query record (precise term + collection).
7. For each Tier C gap, produce the Perplexity query (with explicit scholar/text targets where possible — e.g., "Coope on Aristotle Physics IV.14; Broadie commentary on Physics; recent JHP articles on time-without-soul").

8. **Special handling for the `\textbf{******}` placeholders**: these are claims that already have the locus identified but lack the verbatim. Treat as Tier A gaps where the locus is *given* but the quotation must be confirmed from the corpus.

### 9.5 Phase 3.5 — Tier C cache reconciliation (NEW; uses pre-existing 2026-05-10 Perplexity work)

**Goal**: Parse `tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md` into structured form, map its entries to current DISS-04-EMOTION claims (and any spillover to DISS-03-A3 or DISS-05-A4), and slot the pre-existing citations into the citation-gap-master BEFORE Phase 4 issues any Perplexity queries.

**Duration estimate**: 10–18 min wall time, 1 sequential agent.

#### 9.5.1 Steps

| Step | Action |
|------|--------|
| 3.5.1 | Parse `MASTER-CITATION-REPORT.md` into structured JSON. Output: `_synthesis/master-citation-report-parsed.json`. Each entry has: `cache_id` (e.g., `CACHE-Q-HAW-10`), `priority_stars` (1–4), `source_id` (the report's Source ID), `author`, `year`, `title`, `locus`, `verbatim_text`, `pathe_section` (the old §-number from the report, e.g., "§1.1"), `subsection` (A/B/C/D from the report), `insertion_anchor` (the "Insert near" quoted phrase), `use_designation` (in-text/footnote/epigraph), `rationale`. |
| 3.5.2 | Build the **Pathe → DISS section map**. All Pathe §§1.1–1.9 in the report correspond to subsections of DISS-04-EMOTION (`1.4 - Emotion is Motion.md`). Specifically: Pathe §1.1 (Emotion: The Form of Desire Under Evaluative Disclosure) = DISS-04 opening subsection; Pathe §1.2 (Pathos and Pathe: Two Articulational Concretions) = DISS-04 second subsection; Pathe §1.3 (Enmattered-Accounts) = DISS-04 third subsection; Pathe §1.4 (The Articulational Concretion: From Doxa to Pathē) = DISS-04 fourth subsection; Pathe §1.5 (Somatic Preparation) = DISS-04 fifth subsection; Pathe §1.6 (Variable Presence) = DISS-04 sixth subsection (note: this content may have shifted to §1.5 in the new dissertation structure since the user's §1.5 "A4 - Completed Action" treats the three-types-of-action distinction; verify); Pathe §1.7 (The Feedback Loop) = DISS-04 seventh subsection; Pathe §1.8 (Emotion's Function in the Chain) = DISS-04 eighth subsection; Pathe §1.9 (Conclusion) = DISS-04 closing. Record the map in `_synthesis/pathe-to-diss-section-map.md`. |
| 3.5.3 | For each cache entry, **match to a current DISS-04-EMOTION claim** by the `insertion_anchor` (quoted phrase). Use Phase 2's `phase2-claims.json` for DISS-04-EMOTION as the matching target. Method: substring search of the cache entry's insertion-anchor against current §1.4 prose; if anchor matches a phrase still present in §1.4, link the cache entry to the claim that contains the phrase. If the anchor has been edited out of the current §1.4, attempt fuzzy match (Levenshtein ≤30% diff against any current claim text); flag fuzzy matches for user verification. Record match status: `exact-anchor-match` / `fuzzy-anchor-match` / `anchor-not-found-needs-user-review`. |
| 3.5.4 | For each cache entry that successfully matches a DISS-04-EMOTION claim, **convert the cache entry into a Tier C fill proposal** at `_per-section/DISS-04-EMOTION/citation-fills/cache-<cache_id>.md`. The proposal format adopts the master report's format (priority, source, locus, verbatim, anchor, use, rationale) plus the new pipeline's tier-tagging (here: `tier: "C-cache"` for cache hits vs. `tier: "C-fresh"` for fresh Perplexity queries) and downloaded-PDF pointer (if applicable). |
| 3.5.5 | For each DISS-04-EMOTION citation gap from Phase 2, **check whether the gap is now covered by a cache hit**. Classify each DISS-04-EMOTION gap as: `cache-hit-strong` (★★★★ or ★★★ cache entry) / `cache-hit-supplementary` (★★ or ★ cache entry) / `cache-partial-hit` (cache entry exists but doesn't fully resolve the gap) / `cache-miss-need-perplexity`. Update the citation-gap-master with these tags. |
| 3.5.6 | **Cross-section spillover check**: scan the cache entries for any that might apply to DISS-03-A3 (phantasma proper / orientational modes / doxa) or DISS-05-A4 (three-types-of-action / hexeis-bivalence). The report's coverage is theoretically DISS-04-only, but the user has noted content has moved between sections (e.g., *pathos*-Metaphysics-fourfold from §1.4 to §1.2; perception-as-*krisis* from §1.4 to §1.2); some cache entries may now apply to DISS-02-A1A2 or DISS-03-A3. Surface candidates with low-confidence flag for user review. |
| 3.5.7 | Generate the **Perplexity-savings report**. Estimate the number of Perplexity queries saved by cache hits: target metric is `dis04_perplexity_queries_eliminated` (expected: 15–25 out of an estimated 25–30 DISS-04-EMOTION queries). Update the Perplexity budget allocation: 40 total queries can now be redistributed across §§1.0/1.1/1.2/1.3/1.5 instead of being mostly consumed by §1.4. Output: `_synthesis/perplexity-budget-allocation.md`. |
| 3.5.8 | **Flag the 17 sources** in the master report's References against the existing corpus/index. Sources already in corpus/index (Frede, White, Caston 1995, Hawhee, Papachristou, Nussbaum, Gonzalez, Bowin, Burke, Gross 2017, Gross & Kemmann eds. 2005, Rickert): mark `corpus-index-already-pipeline` — these cache entries should propagate to `awaits-corpus-resolution` (Tier A) routing where possible, since the corpus/index pipeline is the authoritative source. Sources NOT yet in corpus/index but in `corpus/download/` (Agosta 2010, Costache 2013, Withy 2023, Fredal 2020, Sheehan 2015, Christensen 2016, Dow 2011, Corcilius 2013, Caston 2021): mark `corpus-download-only` — these are the candidates for Phase 4 prelude basic ingest, and any with ≥5 substantive pages flag for deep-analysis. |

#### 9.5.2 Phase 3.5 deliverables

- `_synthesis/master-citation-report-parsed.json` — structured form of all 244 entries
- `_synthesis/pathe-to-diss-section-map.md` — old-to-new section mapping
- `_synthesis/perplexity-budget-allocation.md` — re-distributed budget after cache reconciliation
- `_synthesis/cache-coverage-summary.md` — for each DISS-04 gap: cache-hit-strong / cache-hit-supplementary / cache-partial-hit / cache-miss-need-perplexity, with counts and the redistributed Perplexity budget
- `_per-section/DISS-04-EMOTION/citation-fills/cache-*.md` — one file per cache hit (expected: 150-244 files)
- Updated `_synthesis/citation-gap-master.{md,json}` — gaps re-tagged with cache status

#### 9.5.3 Phase 3.5 quality gates

- [ ] All 244 cache entries parsed into structured form
- [ ] Pathe → DISS section map covers all 9 Pathe sub-numbers
- [ ] ≥80% of cache entries achieve `exact-anchor-match` or `fuzzy-anchor-match` against current DISS-04-EMOTION claims (the remaining ≤20% surface for user review)
- [ ] ≥150 cache fill files written to DISS-04-EMOTION's citation-fills directory
- [ ] Both `(CITE)` placeholders flagged in the master report (Pathe §1.6 Nussbaum; Pathe §1.7 De Insomniis) are mapped to current dissertation claims
- [ ] Perplexity-budget-allocation specifies the redistribution: expected ≥15 query slots freed from §1.4 and redistributed to §§1.0/1.1/1.2/1.3/1.5
- [ ] 17-sources-vs-corpus-index audit produced; both `corpus-index-already-pipeline` and `corpus-download-only` cohorts identified

### 9.6 Phase 3 quality gates

- [ ] Terminology reckoning covers all 8 user-coined terms with cross-section drift analysis
- [ ] User's 4 clarification questions are surfaced explicitly
- [ ] Numbering audit produces patch lists for every section with mixed usage
- [ ] Concept matrix has ≥30 rows; ≥10 core concepts
- [ ] Inconsistency catalog has ≥15 findings with severity tags
- [ ] User-mandated 3 relocations are each fully specified with source/target/bridge-text/downstream-edits
- [ ] Lanham profile matrix covers all 6 sections; §1.4 is the explicit baseline
- [ ] Citation gap master is sorted into Tier A/B/C with route specifications
- [ ] Corpus-routing plan resolves ≥70% of gaps as Tier A (i.e., corpus/index can answer most needs)
- [ ] Perplexity queue is non-empty but moderate (target: 20–40 queries total for the whole dissertation, not 200)

---

## 10. Phase 4 — Gap-filling search

**Goal**: Execute the Tier A / B / C retrieval plan from Phase 3G + Phase 3.5 cache reconciliation, and produce candidate citation snippets the user can drop into the dissertation.

**Duration estimate**: 50–95 min wall time (with the Phase 4.0 prelude ingest added); parallel agents per route.

### 10.0 Phase 4 prelude — basic ingest of `corpus/download/` PDFs (NEW)

**Goal**: Bring the 22 already-downloaded PDFs from the 2026-05-10 Perplexity run into ChromaDB so they're queryable by Phase 4 Tier B/C for any gap not directly covered by the master citation report.

**Duration estimate**: 15–25 min wall time (depending on PDF count and OCR needs), sequential single agent.

**User-confirmed state 2026-05-13**: only `pdftotext -layout` text extraction has been done; the full corpus ingest pipeline (Marker → ChromaDB embed → KU extraction) has NOT been run.

**Steps**:

| Step | Action |
|------|--------|
| 4.0.1 | Read `corpus/download/MANIFEST.json` and enumerate the 22 PDFs. For each, record: `qid`, `author`, `year`, `title`, `venue`, `filename`, `status`. |
| 4.0.2 | For each PDF, determine if it is **already in corpus/index** (i.e., it duplicates a corpus pipeline already in `corpus/index/<Pipeline>/`). If yes, mark `skip-already-in-index` and **route any cache hit from this source to Tier A** (corpus-index retrieval) instead of Tier B/C, since the curated pipeline output is preferred over the raw PDF text. |
| 4.0.3 | For each PDF NOT in corpus/index (the `corpus-download-only` cohort identified in Phase 3.5.8), run **basic ingest**: (a) confirm `pdftotext -layout` cache exists in `corpus/download/text-cache/<filename>.txt` (the user has already done this); generate it if missing using the existing ingest infrastructure (Marker → PyMuPDF → pdftotext tier fallback per `dual-machine-architecture.md`). (b) Chunk the text at paragraph + page-boundary granularity. (c) Generate embeddings via the existing embedding service (port 8000, gte-Qwen2-1.5B-instruct). (d) Insert into a new ChromaDB collection `dissertation-perplexity-cache` with metadata: `source-pdf-filename`, `author`, `year`, `title`, `page-anchor`, `chunk-index`. (e) Log to `corpus/download/_ingest-logs/<filename>-<run-id>.log`. |
| 4.0.4 | **Deep-analysis flag**: for each ingested PDF, compute a `dissertation-relevance-density` score: (count of dissertation-relevant key terms × matched count) / total chunks. Terms include all 8 user-coined terms, the major Aristotle/Heidegger loci already in §3.3, and the Lanham axes. PDFs with density ≥ threshold are flagged in `_synthesis/perplexity-downloads-flagged-for-deep-analysis.md` as candidates for full corpus/index pipeline. |
| 4.0.5 | Emit `corpus/download/_basic-ingest-summary.md`: per-PDF ingest status, density score, deep-analysis flag, chromadb collection + chunk count. |

**Cost**: basic ingest uses local services only (no external API calls); ChromaDB embed is the only meaningful resource consumer. Estimated runtime: 15–25 minutes for 22 PDFs (depending on whether Marker re-extraction is needed; if `pdftotext -layout` cache is sufficient, drop to 5–8 minutes).

**Note**: This prelude must run BEFORE Phase 4 Tier B/C so that downstream agents can query the new `dissertation-perplexity-cache` ChromaDB collection.

### 10.1 Tier A — corpus/index retrieval

For each Tier A gap:
1. Read the specified pipeline unit's output file in `corpus/index/<pipeline>/<unit>/...`.
2. Extract the relevant passage with full citation metadata (Bekker number, SZ section + H-page, GA volume + page, etc.).
3. Construct an **insertion proposal**:
   - **Where**: file path + line number of the claim that needs the citation.
   - **What**: the citation in the dissertation's house style (footnote vs. inline, author-prominent vs. parenthetical).
   - **Why**: 1-2 sentence rationale tying the citation to the claim.
4. Output to `_per-section/<section-id>/citation-fills/<gap-id>.md`.

**Quality bar**: every Tier A fill must include the verbatim quotation (≤25 words for primary text per copyright convention; up to 200 words for the user's own dissertation work which has no copyright issue) AND the precise citation, even if the dissertation prose will paraphrase rather than quote.

### 10.2 Tier B — ChromaDB retrieval

For each Tier B gap:
1. Construct the ChromaDB query (collection + term + filters).
2. Execute and retrieve top-3 candidates.
3. Confirm relevance manually (per the `feedback-corpus-index-first.md` quality gate — ChromaDB results have lower precision than curated corpus/index).
4. If a Tier B result is sufficiently strong, **promote it to a corpus/index candidate for later integration** (this generates Phase 5 backlog: add this passage to the corpus/index in a future cycle).
5. Construct the insertion proposal (same format as Tier A).

### 10.3 Tier C — cache-first retrieval, then Perplexity with `corpus/download/` ingest

**Cache-first principle (added 2026-05-13)**: BEFORE issuing any new Perplexity query for a Tier C gap, check the master citation report cache (Phase 3.5 output). Most DISS-04-EMOTION Tier C gaps are expected to be satisfied by the cache; the 40-query Perplexity budget is reserved for genuine cache misses across all sections.

**Tier C resolution priority** (per gap):

1. **C-cache-strong** (★★★★ or ★★★ master report entry exists for this gap): use the cache entry directly; produce the proposal from cached data; **no Perplexity query consumed**.
2. **C-cache-supplementary** (★★ or ★ master report entry): use the cache entry but mark its supplementary status; user may use it or escalate to a fresh query in a future run. **No query consumed** unless user requests escalation.
3. **C-cache-partial** (cache entry near-match but not exact): use the cache entry as a starting point; issue 1 targeted Perplexity query to find a stronger-fit source if the budget permits. **Consumes 1 query.**
4. **C-cache-miss** (no relevant master report entry): issue fresh Perplexity query. **Consumes 1 query.**

Per user directive 2026-05-13, Perplexity may freely download PDFs of returned scholarly articles and run a basic ingest into the corpus. This minimizes user review effort: the user reviews a proposal that already references a vetted, downloaded source, not a bare bibliographic record. The same protocol applies to BOTH cache-derived and fresh-query-derived proposals.

**Budget**: 40 Perplexity queries per run *as the initial allocation* (NOT a hard cap — see Pause-and-Notify Protocol below; per user 2026-05-13, the user is willing to raise the cap and spend more than $100 if needed for best results). Monetary budget cap: $100 per run, soft cap with pause-and-notify at $20 remaining. **Expected cache savings**: ~15–25 queries freed from DISS-04-EMOTION's would-be allocation, redistributable across §§1.0/1.1/1.2/1.3/1.5.

**Model + context-size escalation policy** (added 2026-05-13 per user directive):

The pipeline uses a graduated escalation policy that starts cheap and escalates ONLY when justified. The default model is `sonar-pro` (validated against the 2026-05-10 baseline at ~$0.015/query with `search_context_size: low`). Escalation steps and their typical costs:

| Step | Model | search_context_size | Typical cost/query | When to use |
|------|-------|---------------------|--------------------|-------------|
| **S1 (default)** | `sonar-pro` | `low` | ~$0.015 | First attempt for every gap. Adequate when the query has well-specified scholar/text targets (per the 2026-05-10 baseline, ~73% of returns were directly usable). |
| **S2 (escalate context)** | `sonar-pro` | `medium` | ~$0.04 | Escalate when S1 returns: (a) no source that actually supports the claim, OR (b) sources that are too peripheral, OR (c) sources behind paywalls with no open alternative. Medium context surfaces more sources per query and surfaces obscurer venues. |
| **S3 (escalate to deep research)** | `sonar-deep-research` | n/a (model-managed) | ~$1–5 (averages $2–3) | Escalate when S2 still does not resolve a gap AND the gap is for a **load-bearing claim** (T5/T6 in the support-tier ladder; or claim flagged as `architectural` / `dissertation-pillar`). Sonar-deep-research synthesizes across multiple sources and runs multi-step reasoning; reserve for genuinely difficult questions like contested scholarly debates (e.g., "Coope vs. Broadie on *Physics* IV.14"). |

**Escalation cap per gap**: 3 attempts max (S1 → S2 → S3). After S3 returns no usable source, the gap is flagged `unresolvable-via-perplexity` and surfaced for user review as a candidate for either (a) acceptance of the strongest available result, (b) corpus-only handling with explicit `\textbf{******}` placeholder per `feedback-missing-source-placeholder.md`, or (c) reframing of the claim to match what scholarship actually supports.

**Decision rule for auto-escalation**:
- After S1: a return is "usable" if at least 1 returned source (i) has an accessible URL, (ii) Perplexity's `why_relevant` field matches the claim's terms, AND (iii) the returned author/work is plausible for the topic (not a hallucination based on title-string-matching). If 0 usable results, auto-escalate to S2.
- After S2: usability bar is same; if 0 usable results AND the gap is load-bearing per Phase 2's support-tier tagging (T5/T6 with `architectural` or `dissertation-pillar` flag), auto-escalate to S3. If the gap is non-load-bearing (T8 secondary-needed), STOP and flag as unresolvable rather than spend S3 cost on a low-stakes gap.
- All escalations are logged in `_synthesis/perplexity-escalation-log.jsonl`.

**Cost projection per run** (with escalation policy active, assuming a typical mix):
- ~60% of gaps resolved at S1: 0.6 × 25 × $0.015 = **$0.23**
- ~25% escalate to S2: 0.25 × 25 × $0.04 = **$0.25**
- ~10% escalate to S3: 0.10 × 25 × $2.50 = **$6.25**
- ~5% unresolvable (sunk cost of all 3 attempts averaging $2.55 with mostly S3-failure cost): 0.05 × 25 × $2.55 = **$3.19**
- **Per-run expected total: ~$10**
- **Lifetime (4-run revision cycle) expected total: ~$25-40**

**Workflow** for each Tier C gap (when no cache hit or cache-partial requires escalation):

1. **Query construction**: build the Perplexity query with explicit scholar/text targets and the support-tier metadata so the escalation policy can make decisions (e.g., "Coope on Aristotle Physics IV.14 time-without-soul ontological commitment; recent JHP articles 2015-2024 — gap classification: T5 architectural; pillar claim").

2. **Query execution + budget tracking**:
   - Increment the run's Perplexity query counter (toward the initial 40-query allocation).
   - Each escalation S1→S2 or S2→S3 counts as a separate query for the cap.
   - Track cumulative cost.
   - **Pause-and-Notify Protocol** (updated 2026-05-13): the pipeline pauses and notifies the user when **either** of:
     - Query counter reaches 36 (90% of initial allocation), OR
     - Remaining budget falls under $20, OR
     - Credits run out mid-run.
     - The notification includes: (a) current run state (queries used, cost spent, gaps remaining, gaps awaiting S2/S3 escalation), (b) **escalation-class breakdown** (how many remaining gaps are likely-S1 vs. likely-S2 vs. likely-S3), (c) projected cost-to-completion with current escalation policy, (d) options:
       - **(i) Add funds + continue** (default expectation per user 2026-05-13): user raises the budget; pipeline resumes with same policy.
       - **(ii) Raise query cap from 40 to N** (with cost projection): user authorizes a higher cap.
       - **(iii) Switch remaining gaps to S1-only** (cheap mode): cap escalation at S1 for the remainder of the run, accept potentially-weaker results.
       - **(iv) Defer remaining gaps to next run**: stop Tier C now; remaining gaps go onto the punch list for the next run.
       - **(v) Downgrade remaining gaps to "no Perplexity attempted — surface as future-research-needed"**.

3. **PDF download** (if Perplexity returns a citable scholarly article):
   - Attempt to download to `corpus/download/<author>-<year>-<short-title-slug>.pdf` (e.g., `coope-2005-time-for-aristotle.pdf`).
   - Record the source URL, the SHA-256, the timestamp, and the originating gap ID in `corpus/download/_manifest.jsonl` (append-only).
   - If download fails (paywall, dead link, etc.), proceed with bibliographic-record-only handling.

4. **Basic ingest** (per `feedback-corpus-index-first.md` and the existing ingest pipeline):
   - Run the standard PDF ingest: text extraction (Marker → PyMuPDF → pdftotext tier fallback per dual-machine architecture), basic chunking, embedding into ChromaDB under a new `dissertation-perplexity-fills` collection (or existing `rhetorical_ontology` / `metaphysics` if topically aligned), title/author/year metadata extraction.
   - Output: ingest log at `corpus/download/_ingest-logs/<gap-id>-<timestamp>.log`.

5. **Citation extraction**:
   - With the article ingested, run a targeted ChromaDB query against the downloaded article to locate the specific passage that supports the dissertation's claim.
   - Extract the verbatim quotation (with full page anchor) needed for the citation proposal.

6. **Deep-analysis flag**:
   - If basic ingest reveals the article is dense/important enough to warrant a full corpus/index pipeline (signals: ≥5 pages of substantive engagement with dissertation-relevant terms; cited in already-existing pipelines; matches a hole in the corpus/index ontology), **flag** the article in `_synthesis/perplexity-downloads-flagged-for-deep-analysis.md` for later consideration as its own corpus/index pipeline.
   - The basic ingest serves the immediate dissertation need; the flag preserves the option of upgrading it later.

7. **Vetting** (per ICP-pipeline validation principles):
   - Verify the cited author/work actually exists in the downloaded PDF (not just in Perplexity's response).
   - Verify the page numbers in Perplexity's citation match the downloaded PDF's pagination.
   - Verify the quotation (if any) is faithful to the downloaded source.
   - Tag as `vetted` / `partial-vetted` / `unvetted-needs-user-review`.

8. **Insertion proposal**:
   - Construct the same proposal format as Tier A/B with these additions: pointer to the downloaded PDF, pointer to the ingest log, vetting tag.
   - File path: `_per-section/<section-id>/citation-fills/<gap-id>-tier-c.md`.

9. **Never auto-insert** into the dissertation: every Tier C fill goes through user review, regardless of vetting tag. The vetting tag tells the user how thoroughly the proposal has been pre-screened; it does not bypass review.

**What "user review" entails** (per Q-D, now resolved):

When the user is ready to address Tier C fills:
- Open `_synthesis/citation-gap-master.md` (or per-section `revision-checklist.md`) and scan Tier C entries.
- For each entry, open the corresponding proposal file at `_per-section/<section-id>/citation-fills/<gap-id>-tier-c.md`.
- The proposal file contains: (a) the original dissertation claim with line anchor, (b) the proposed citation in the dissertation's house style (footnote/inline, author-prominent, Bekker/SZ/GA conventions per Appendix B), (c) the proposed footnote/inline text, (d) the verbatim source quotation with page anchor, (e) pointer to the downloaded PDF for verification, (f) vetting tag explaining how thoroughly the pipeline pre-screened the source.
- The user decides per proposal: **accept** (manually paste into dissertation, or approve a pipeline-generated patch), **modify** (adjust the proposed citation text and accept the modified version), or **reject** (mark the gap as `user-rejected-perplexity-source` and either route to a different gap-fill strategy or leave the gap open).
- Decisions persist across runs: if a Tier C source was rejected in run N, run N+1 will not re-propose the same source for the same gap.

Estimated user review effort per Tier C proposal: 1-3 minutes (skim claim, skim proposed citation, spot-check verbatim against downloaded PDF if uncertain, accept/modify/reject).

### 10.4 Phase 4 deliverable

`_run-history/<run-id>/citation-fills/` directory with:
- One file per gap: `<gap-id>-<route-tier>.md` containing the proposal
- An aggregate index `citation-fills-index.md` with sortable table (section, gap-id, tier, status)

### 10.5 Quality gates

- [ ] Every Tier A gap has a fill proposal (or explicit "corpus-index pipeline unit does not actually contain the expected content — re-route to Tier B/C" note)
- [ ] Every Tier B gap has a ChromaDB result vetted for relevance
- [ ] Every Tier C gap has either a vetted Perplexity result OR a "no scholarly source located — surface as a genuine knowledge gap" flag
- [ ] Total Tier A fills: aim for ≥60% of all gaps
- [ ] Total `\textbf{******}` placeholders resolved: aim for 100% if the user-named locus is in the corpus

---

## 11. Phase 5 — Revision roadmap

**Goal**: Compile every finding into a single ordered, scoped, executable to-do list the user can work through section-by-section.

**Duration estimate**: 8–12 min wall time, single agent (mostly synthesis from prior phases).

### 11.1 Revision roadmap structure

```markdown
# Dissertation Revision Roadmap — Run <id>

## Total scope
- Sections to revise: 6 (+ diagram)
- Claims flagged: <total>
- Citation gaps: <total> (Tier A: <n>, B: <n>, C: <n>)
- Relocations: <n>
- Numbering patches: <n total mechanical fixes>
- Terminology questions for user: 4 (Q1-Q4 per terminology-reckoning §4)
- Estimated total effort: <hours range>

## Critical-path order (do these FIRST, IN ORDER)

### Step 1 — Terminology clarification (USER DECISION REQUIRED)
- Answer Q1-Q4 in `terminology-reckoning.md §4`
- Estimated effort: 30-60 min (the user reviews, decides, and either accepts the pipeline's recommended canonical definitions or supplies their own)
- Blocks: nothing can be revised cleanly until terminology is locked.

### Step 2 — Mechanical numbering migration (Mₙ→Mₙ₊₁ → Mₙ→Aₙ₊₁)
- File DISS-01-A0: <n> patches
- File DISS-04-EMOTION: <n> patches
- File DISS-05-A4: <n> patches (largest, single-convention old-form)
- Estimated effort: 20-40 min (mechanical Find/Replace + spot-check)
- Blocks: section-level revisions (so the user isn't editing a moving target)

### Step 3 — Relocations (user-mandated 3 relocations)
- Relocation 1 (pathos-Metaphysics-fourfold §1.4 → §1.2): <effort>
- Relocation 2 (paschein-preservation §1.4 → §1.2): <effort>
- Relocation 3 (perception-as-krisis §1.4 → §1.2): <effort>
- Estimated effort: 90-180 min total (the user adapts the bridge-text proposals)
- Blocks: §1.2 cannot be finalized until relocations are complete.

### Step 4 — Diagram static exports (per-section cutouts)
- 6 static exports needed: A₀ standalone, A₁→A₂ + dual-trace, M₂→A₃ + A₃-row + doxa-band, A₃-doxa-band → M₃→A₄ three paths + A₄, A₄ + recursive loop, hexeis/settled-doxai with M₂₃ connector
- Estimated effort: 60-90 min (manual SVG export from the interactive HTML or re-creation in vector tool)
- Blocks: final PDF compilation

### Step 5 — Hexeis/settled-doxai development (diagram region currently under-fleshed)
- Diagram: develop the hexeis/settled-doxai region with more nodes (currently a single Settled-Doxai box; user has flagged this as under-developed)
- Prose: develop the corresponding discussion in §1.4 (already partial) and link to §1.5 (already touched on)
- Estimated effort: 90-180 min

## Section-by-section revision (do these in parallel, in any order, AFTER critical-path steps 1-4)

### §1.0 Introduction
- Open citation gaps: <n> (Tier A: <n>, B: <n>, C: <n>)
- Highest-priority claims to revise:
  - DISS-00-C<n>: <claim text>
    - Fill from: corpus/index/<pipeline>/<unit>
    - Estimated effort: <minutes>
  - ...
- Lanham drift findings: <summary>
- Architectural-mismatch findings: <list>
- Estimated total effort: <hours>

### §1.1 A₀ Motion and Time
[same structure]

### §1.2 A₁→A₂ Aisthesis
- POST-RELOCATIONS: incorporate the 3 relocated passages
- Open citation gaps: <n>
- ...

### §1.3 A₃ Orientational Modes
[same structure]

### §1.4 Emotion is Motion (GOLD STANDARD — least revision needed)
- Open citation gaps: <n> (mostly secondary-scholarship reinforcement)
- POST-RELOCATIONS: remove the relocated passages cleanly (with appropriate bridge text remaining)
- ...

### §1.5 A₄ Completed Action (CONCLUSION — revise LAST, after §§1.0-1.4 are stable)
- Open citation gaps: <n>
- Architectural-mismatch findings: realign with the revised §1.0 framing
- ...

## Post-revision: re-run pipeline
After completing all section revisions, **re-run this pipeline** on the revised draft.
- Run-time: ~2-3 hours (parallelized)
- New `_run-history/<new-run-id>/` directory will be created
- `_living/diff-from-previous.md` will surface:
  - Resolved flags (success!)
  - Remaining open flags
  - Newly-introduced flags (from revisions that fixed one thing and broke another)
- Iterate as needed.

## Backlog (not blocking, but address before final submission)
- <items that surfaced as Tier B/C and remain unresolved>
- <items the user deferred during the run>
- <Phase 4 cross-pipeline corpus integration: register the dissertation as a corpus pipeline once final>
```

### 11.2 Quality gates (Phase 5)

- [ ] Roadmap orders the work into critical-path (5 sequential steps) + section parallel work
- [ ] Every section has a citation-gap count + Lanham-drift summary + estimated effort
- [ ] Critical-path step 1 (terminology) explicitly flags the user decisions required
- [ ] Re-run protocol is documented
- [ ] Backlog explicitly captures Phase 4 forward-integration (registering the dissertation as a corpus pipeline)

---

## 12. Orchestration

| Phase | Agents | Concurrency | Wall time | Outputs |
|-------|--------|-------------|-----------|---------|
| 0 | 1 (preflight) | sequential | 6–10 min | preflight dashboard |
| 1 | 7 (metadata) | 3 parallel batches | 8–12 min | 7 metadata JSONs + manifest |
| 2.a §1.4 baseline | 1 (gold standard first) | sequential | 8–14 min | §1.4 full Phase-2 artifact set + Lanham baseline |
| 2.b §§1.0/1.1/1.2/1.3/1.5 | 5 (parallel) | parallel background | 25–40 min | 5 sections' Phase-2 artifact sets |
| 2.c Diagram | 1 (diagram audit) | parallel with 2.b | 8–12 min | diagram metadata + node-audit + static-export needs |
| 3 Wave 1 | 3 (terminology, numbering, ontology) | parallel | 12–18 min | terminology-reckoning + numbering-audit + concept-matrix |
| 3 Wave 2 | 2 (inconsistency, relocations) | parallel | 12–18 min | inconsistencies-and-fallacies + relocations |
| 3 Wave 3 | 1 (Lanham) | parallel with W1/W2 | 8–14 min | lanham-profile-matrix |
| 3 Wave 4 | 1 (citation gap master) | sequential after W1-3 | 10–14 min | citation-gap-master + corpus-routing-plan + perplexity-queue |
| 3.5 Cache reconciliation | 1 (master report parser + cache matcher) | sequential after W4 | 10–18 min | parsed master report, pathe→DISS map, cache-coverage summary, budget reallocation, ~150–244 cache fill files |
| 4.0 corpus/download prelude | 1 (basic ingest of 22 PDFs) | sequential before Tier B/C | 15–25 min (5–8 if pdftotext cache reused) | dissertation-perplexity-cache ChromaDB collection, ingest logs, deep-analysis flags |
| 4 Tier A | 3–5 (parallel per pipeline) | parallel | 20–30 min | citation-fills (Tier A) |
| 4 Tier B | 2–3 (parallel per collection) | parallel | 15–25 min | citation-fills (Tier B; now includes `dissertation-perplexity-cache` collection) |
| 4 Tier C | 2–3 (parallel per query batch) | parallel | 10–25 min (reduced from 20–40 by cache hits) | citation-fills (Tier C; cache-strong/supplementary/partial/miss tagged) |
| 5 Roadmap | 1 (revision-roadmap compiler) | sequential | 8–12 min | revision-roadmap |

**Total wall time**: ~3–4.5 hours for a complete first run (the Phase 3.5 cache reconciliation + Phase 4.0 prelude add ~25–43 min but the cache hits reduce Phase 4 Tier C wall time, so net delta is ~10–20 min); second/third runs are faster (~1.5–2.5 hours) because the corpus retrieval cache warms and the master report parsing is incremental.

**Token budget**: budget ~600K-1.2M tokens per full run (mostly Phase 2 + Phase 4 retrieval). Phase 3.5 parsing is text-only and adds <50K tokens.

**Perplexity query budget**: 40 queries / $100 hard cap. Expected actual consumption with the master report cache active: 15–25 queries (60–85% of budget reserved for genuine cache misses across §§1.0/1.1/1.2/1.3/1.5; §1.4 expected to consume 0–5 queries thanks to the cache).

---

## 13. Quality gates (global)

- [ ] All 7 primary units have full Phase 2 artifact sets (5 artifacts each + diagram audit)
- [ ] ≥800 claims extracted across the dissertation (target: 800-1200)
- [ ] ≥300 argument edges produced
- [ ] ≥150 citation needs identified
- [ ] ≥70% of citation needs are Tier A (resolvable from corpus/index)
- [ ] ≥95% of `\textbf{******}` placeholders resolved (verbatim located in corpus/index for the named locus)
- [ ] Every user-coined term has a cross-section drift analysis
- [ ] User's 4 clarification questions are surfaced explicitly
- [ ] Numbering audit is exhaustive and produces Edit-ready patches
- [ ] 3 user-mandated relocations are each fully specified
- [ ] Lanham profile matrix covers all 6 sections with §1.4 as baseline
- [ ] Revision roadmap is single-file, ordered, scoped, executable
- [ ] All artifacts are version-stamped to the run-id
- [ ] `_living/diff-from-previous.md` is generated when a prior run exists

---

## 14. Anticipated risks + mitigations

| Risk | Mitigation |
|------|------------|
| Claim-extraction inflation: pipeline produces 2000+ claims and the user can't actually work through them. | Per-section claim cap at 350; Phase 2 agents trained to merge claims at the right granularity (one proposition = one claim, not one sentence = one claim). Phase 5 roadmap surfaces only T4/T5/T6/T7 claims for user action; T1/T2/T3 are recorded but not on the punch list. |
| Lanham profile false-positives: the §1.4 gold-standard is itself drift-tolerant in places (e.g., the etymological excursus on "emotion" is intentionally Anglo-Saxon-register vs. the rest of the chapter's Latinate register); naively measuring deltas would flag this as a problem. | Lanham agent runs per-subsection where the section is long, not just per-section; agent is instructed to recognize within-§1.4 variation and produce a §1.4 profile range rather than a single point. |
| Terminology reckoning produces too many "decision items" for user: every minor variant becomes a Q for the user. | Agent 3A merges variants by similarity threshold; only surface decisions where the variants genuinely conflict (definitional drift) vs. stylistic variation (same definition, different surface form). Target: 4-8 user decisions, not 40. |
| Numbering audit misses footnote and TikZ-embedded occurrences. | Phase 0 scan uses regex over the full file including LaTeX comment/footnote/TikZ environments; Phase 3B verifies coverage by computing total $M$-occurrences in each file and reconciling. |
| Corpus-index pipeline units don't actually contain the page the claim needs: pipeline unit `META-12` exists but doesn't cover 1072a23-26 because the indexer skipped that range. | Tier A retrieval includes a verification step: open the actual unit output and confirm the expected content is present. If not, re-route the gap to Tier B or C and note "corpus/index pipeline coverage gap" for a future indexing run. |
| Perplexity API returns hallucinated citations. | Per the ICP-pipeline validation principles in MEMORY: vet every Perplexity result for author/work existence and page-number plausibility; tag unvetted findings explicitly. Never auto-insert. Phase 4 Tier C agent runs the vetting step. |
| User-coined term `resonant orexis` is genuinely under-determined and the pipeline can't decide among the 3 options. | Pipeline does NOT decide. Surfaces all 3 options with per-section evidence; user picks. The Q3 clarification question makes this explicit in the user's review queue. |
| `\textbf{******}` placeholders correspond to passages the corpus index does not contain (e.g., Heidegger GA 65 references). | Per the `feedback-missing-source-placeholder.md` rule, keep the `\textbf{******}` as-is, leave the locus citation; the user fills the verbatim manually from their own access to the volume. |
| Re-run diff produces too many false-positive "new flags" because line numbers shifted. | Diff is computed on **claim IDs** (which are stable across renumbering as long as the claim text is preserved within ±20% similarity) rather than line numbers. Phase 0 Phase-0 reconciles claim IDs across runs by fuzzy matching on claim text. |
| The actualization-chain HTML has not yet been updated to reflect the hexeis/settled-doxai region's full structure; pipeline cannot audit something that isn't there yet. | The diagram audit explicitly flags under-developed regions as `pending-user-development`; the pipeline does not invent diagram structure. Revision roadmap step 5 captures the diagram-development work. |
| User's style preferences differ intentionally between sections (e.g., §1.0 deliberately more accessible than §1.4). | Lanham agent's recommendations are advisory and ranked by drift severity; user can mark any specific recommendation as `intentional-keep-as-is`, which the pipeline records and respects in future runs. |
| Citation insertion proposals don't match the user's preferred citation style (footnote vs inline, author-prominent vs parenthetical). | Phase 4 agents read MEMORY's style profile and the existing citation patterns in §1.4 (the canonical sample); citation proposals match those patterns by default. The user can adjust during integration. |

---

## 15. Pre-flight question resolutions (LOCKED 2026-05-13)

All eight pre-flight questions are resolved. Each row records the user's directive and how the pipeline applies it.

| # | Question | Resolution |
|---|----------|------------|
| Q-A | Canonical file selection for sections with multiple variants | **Use ONLY the specific files the user listed in the original prompt** (see §3.1 inventory). `.md` working copies of §§1.1 and §1.2 are EXCLUDED. The `Pathos and Pathe - Two Articulational Concretions.md` working copy under `1.4 - Emotion is Motion/` is EXCLUDED. Pipeline scope is fixed at the 7 files in §3.1. |
| Q-B | Diagram-static-export format | **TikZ-LaTeX-in-markdown `.md` files**, matching the reference format at `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/Actualization of Desire Diagram in Latex Format.md`. Each export is a complete `\documentclass[border=30pt,tikz]{standalone}` block wrapped in a `.md` file (so it sits cleanly alongside other dissertation markdown but compiles cleanly via `pdflatex` from inside the code block). Color palette, node styles, and arrow conventions match the reference. Output paths under `_per-section/DISS-DIAG-V7/static-exports/`. |
| Q-C | Perplexity budget per run | **40 queries initial allocation** (NOT a hard cap — user is willing to raise). **$100 monetary cap, soft limit with pause-and-notify at $20 remaining**. **Model + context escalation policy** (per user 2026-05-13): S1 = `sonar-pro` + `low` (default, ~$0.015/q); S2 = `sonar-pro` + `medium` (escalate when S1 returns no usable source, ~$0.04/q); S3 = `sonar-deep-research` (escalate when S2 fails AND the gap is load-bearing, ~$1–5/q averaging $2-3). Auto-escalation capped at 3 attempts per gap. Each escalation counts toward the 40-query allocation. **Pause-and-notify** at 36 queries OR <$20 OR credits exhausted; user options: add funds & continue / raise cap to N / S1-only-for-remainder / defer / downgrade. **Expected total per-run cost with escalation active: ~$10**; **lifetime (4 runs): ~$25-40** — well within the $100 cap as designed. See §10.3 for full details. |
| Q-D | Tier C results: review vs. auto-insert | **Surface all for user review**, never auto-insert. BUT (per user 2026-05-13): Perplexity is authorized to **freely download PDF sources to `corpus/download/`** and run a basic ingest (text extraction, embedding into ChromaDB, metadata extraction). This means by the time the user reviews a Tier C proposal, the PDF is already on disk, ingested, and the verbatim quotation has been extracted for inclusion in the proposal. **What user review involves** per Tier C proposal: open `_per-section/<section-id>/citation-fills/<gap-id>-tier-c.md`, skim the proposed citation (which includes verbatim, page anchor, and downloaded-PDF pointer), spot-check against the downloaded PDF if uncertain, **accept / modify / reject**. Estimated effort: 1-3 minutes per Tier C proposal. **Deep-analysis flag**: if the basic ingest reveals the article warrants a full corpus/index pipeline (≥5 pages of substantive engagement with dissertation-relevant terms), the article is flagged in `_synthesis/perplexity-downloads-flagged-for-deep-analysis.md` for later upgrade — but the immediate dissertation need is served by the basic ingest. |
| Q-E | Run-history retention | **Keep all runs indefinitely.** No automatic pruning. The user can `git rm` historical runs at their discretion. |
| Q-F | Pathe/ subdirectory | **Ignored.** The `Pathe/` subdirectory is notes-only; everything substantive has been consolidated into §1.4 - Emotion is Motion. |
| Q-G | Lanham analyzer tier | **`auto` (recommended).** See §15.1 below for rationale and the alternative options the user might consider. |
| Q-H | Revision roadmap format | **Hybrid (recommended).** See §15.2 below for rationale. Master strategic roadmap at `_synthesis/revision-roadmap.md`; per-section tactical checklists at `_per-section/<section-id>/revision-checklist.md`. |

### 15.1 Q-G expanded — Lanham analyzer tier selection

**Context**: The Lanham module has a two-tier architecture (per `lanham-style-controller.ts`):

- **Tier 1 — `LanhamProseAnalyzer` (heuristic)**: POS-tag heuristics, regex, token counting, syllable/phoneme analysis. No LLM calls. Computes all six Lanham axes + tacit patterns. ~5-10 seconds per section. Zero cost.
- **Tier 2 — `AdvancedLanhamAnalyzer` (deep)**: Dependency parsing + LLM-based clause-level structural analysis. Slower (~30-90 seconds per section depending on length) and costs roughly $0.50-2 per section in Claude API calls.

The controller maintains an **axis-promotion policy** (in code now):

| Axis | Promotion status | Active tier | Rationale |
|------|------------------|-------------|-----------|
| nounVerb | NOT promoted | Tier 1 | Tier 2 has not demonstrated monotonicity advantage |
| parataxisHypotaxis | NOT promoted | Tier 1 | Min advantage threshold 0.05 not yet met |
| **periodicRunning** | **PROMOTED** | **Tier 2** | **Validated +0.130 monotonicity advantage** |
| voice | NOT promoted | Tier 1 | — |
| primaryRegister | NOT promoted | Tier 1 | — |
| opacity | NOT promoted | Tier 1 | — |

The three tier choices for this pipeline:

| Choice | What runs | Cost per run (6 sections) | Speed | Accuracy |
|--------|-----------|---------------------------|-------|----------|
| **`heuristic`** | Tier 1 for all six axes | ~$0 LLM cost | ~30-60 s total | Strong on the 5 axes Tier 1 owns; weaker on `periodicRunning` (Tier 1 is at "low" confidence per the analyzer's `confidenceByAxis`) |
| **`deep`** | Tier 2 for axes where available, Tier 1 elsewhere | ~$3-12 total | ~3-9 min total | Currently equivalent to `auto` since Tier 2 is implemented for `periodicRunning` only; other axes fall back to Tier 1 |
| **`auto`** (recommended) | Controller decides per-axis using promotion policy: Tier 2 for `periodicRunning`, Tier 1 for everything else | ~$3-12 total | ~3-9 min total | Best of both — calibrated Tier 1 for axes where it leads, Tier 2 where validated to lead |

**Recommendation: `auto`**.

Reasons:
1. It's the controller's intended deployment mode (the AXIS_OVERRIDE_POLICY exists precisely so callers don't have to remember which axes Tier 2 is validated on).
2. The cost difference vs. `heuristic` is small ($3-12 total for 6 sections) and yields a meaningfully better `periodicRunning` score — which matters for the dissertation since long, periodic sentences are a signature §1.4 feature.
3. Future axis promotions will be picked up automatically when the calibration scripts (`scripts/lanham-calibration/`) validate them.

You could choose `heuristic` if you want a zero-LLM-cost diagnostic pass (e.g., a quick re-run after a small revision to check if the prose still scans). The accuracy loss is real but only on one axis.

You could choose `deep` if a future calibration round promotes more axes to Tier 2 and you want them all engaged. Today this choice is equivalent to `auto`.

**Default applied**: `auto`. Can be overridden per-run via `--lanham-tier=heuristic|deep|auto` if you ever want a fast diagnostic pass.

### 15.2 Q-H expanded — Roadmap format selection

**Single-file** (the original default):
- ✅ One canonical location to consult.
- ✅ Single source of truth for diff-across-runs.
- ❌ Long file; section-level work requires scrolling past unrelated content.
- ❌ Mixes strategic ordering (do §1.2 relocations before §1.4 cleanups) with tactical detail (specific footnote text for citation gap DISS-01-GAP-007).

**Multi-file (one per section)**:
- ✅ Tactical, in-context per section.
- ✅ Each file is self-contained, can sit on the desktop while you work.
- ❌ Cross-section ordering decisions live where? Risk of duplication.
- ❌ Diff-across-runs has to walk 6 files instead of 1.

**Hybrid (recommended)**:
- **Master strategic roadmap** at `_synthesis/revision-roadmap.md`. Contains: total scope, critical-path (the 5 sequential pre-section-revision steps: terminology decisions → numbering migration → relocations → diagram exports → hexeis development), per-section summaries (claim counts, citation-gap counts, Lanham drift summary, estimated effort), backlog. This is the "what should I work on today / next" view. Single source of truth for diff-across-runs.
- **Per-section tactical checklist** at `_per-section/<section-id>/revision-checklist.md`. Contains: every flagged claim from this section with full remediation detail inline (no need to context-switch to look up citation-fill proposals — they're either inlined or directly linked). Sortable by support-tier and remediation-effort. This is the "I'm working §1.2 right now, what's next" view.

The hybrid costs essentially nothing extra to produce — Phase 5's roadmap compiler already aggregates per-section data and splitting the output is mechanical.

**Recommendation: Hybrid.**

Reasons:
1. Different cognitive modes for strategic planning vs. tactical execution; separating the artifacts lets each mode have the right surface area.
2. The per-section checklist is the file you'd want open in a side panel while editing §1.2 in your main editor; the master roadmap is the file you'd consult once at the start of a work session to decide which section to focus on.
3. Diff-across-runs is cleanest from the master roadmap (which lists every open flag); per-section files are derived views and the diff infrastructure only needs to touch the master.

**Default applied**: Hybrid. Both files are produced.

---

## 16. Ready-to-execute summary

- **Inputs**: 6 dissertation section files + 1 HTML diagram (file scope locked per §3.1 / Appendix C), the existing corpus/index, the Lanham style module, the active style profile, MEMORY.md guidance
- **Pipeline**: 5 phases + Phase 0 preflight; ~25-32 agents across the run; 2.5–4 hr wall time first run
- **Outputs**: 7 per-section artifact sets (incl. 7 TikZ-in-md static diagram exports) + 13 synthesis deliverables + 4 graphs + 1 master roadmap + 6 per-section checklists, all under `corpus/index/Dissertation/_run-history/<run-id>/`
- **User-actionable end products**:
  1. `_synthesis/terminology-reckoning.md` §4 — 4 clarification questions to answer
  2. `_synthesis/numbering-audit.md` — mechanical patch list (~30-60 patches)
  3. `_synthesis/relocations.md` — 3 mandatory relocations + N pipeline-detected
  4. `_synthesis/revision-roadmap.md` — master strategic roadmap
  5. `_per-section/<section-id>/revision-checklist.md` — tactical per-section checklists (6 files)
  6. `_per-section/<section-id>/citation-fills/` — per-gap Tier A/B/C proposal files (incl. downloaded PDFs referenced by Tier C proposals via `corpus/download/`)
  7. `_per-section/DISS-DIAG-V7/static-exports/` — 7 TikZ-in-md diagram exports (compilable via pdflatex)
- **Re-runnability**: ✅ idempotent on unchanged input; ✅ diff against prior run; ✅ surfaces newly-introduced regressions
- **Pre-flight settings (locked)**: file inventory = 7 files (§3.1); diagram-export-format = TikZ-in-md; Perplexity = 40 queries initial allocation (raisable on pause-and-notify) + $100 soft cap + S1→S2→S3 escalation policy (sonar-pro low → sonar-pro medium → sonar-deep-research); Tier C = cache-first (244-entry MASTER-CITATION-REPORT) then corpus/download ingest + Perplexity with escalation for misses; **expected per-run cost ~$10, lifetime ~$25-40**; Lanham tier = auto; run retention = indefinite; Pathe/ = excluded; roadmap = hybrid
- **Activation**: on user's go-ahead. Phase 4 (the gap-filling search) is NOT parked — it's the deliverable's payoff. The corpus-index-first / ChromaDB / Perplexity-with-downloads routing is fully specified.

---

## Appendix A — Glossary of dissertation-coined terms

(Carry into every run — this is the canonical reference the pipeline uses for term identification.)

| Term | User's working gloss |
|------|----------------------|
| **`pathos` (most general)** | The most general sense articulated by Aristotle in *Metaphysics* (Δ 21, 1022b15): a being's susceptibility to alteration; "a quality in respect of which a thing can be altered." |
| **`basic affective valence`** | The most basic hedonic tonality (good/bad, pursue/avoid) that is (a) co-given with *aisthēsis* when the object of sense is actually present, AND (b) part of the residual motion (*resonant kinēsis*) on which the *phantasma* of that object depends. |
| **`pathos simpliciter`** | The basic hedonic tonality (good/bad, pursue/avoid) co-given with the object of sense WHEN ACTUALLY PRESENT. Part of `basic affective valence`. |
| **`resonant kinēsis`** | (User-coined.) The residual, *dual* traces left behind after interacting with a sensible object and which persist. The dual traces are `resonant aisthēma` (formal-eidetic) + `resonant orexis` (affective). |
| **`resonant aisthēma`** | The formal, eidetic residue that makes up part of `resonant kinēsis` — the "what it is." |
| **`resonant orexis`** | (User-flagged for possible rework.) Currently: a sub-category of `basic affective valence`; the other half of `resonant kinēsis` (alongside `resonant aisthēma`); the basic hedonic tonality (the "why it matters") that remains after the object of sense departs and continues to persist. **Open question**: when a memory elicits articulationally concrete *pathē* (anger, fear, shame), is `resonant orexis` (a) basic-only, or (b) also covering the articulationally concrete emotional structures of the *Rhetoric*'s catalog? |
| **`pathē` / `emotion`** | (Used interchangeably.) The catalog of emotions analyzed in Aristotle's *Rhetoric*: anger, fear, shame, pity, joy, etc. |
| **`articulational concretion`** | The propositional, more developed version of basic *pathos* that depends on *doxa* for its development. Differentiates *pathē* (concrete, *doxa*-mediated) from `pathos simpliciter` / `resonant orexis` (basic, pre-*doxa*). |

---

## Appendix B — Citation locus conventions used in the dissertation

(For Phase 4 retrieval — match these conventions in citation fills.)

| Source | Convention | Example |
|--------|-----------|---------|
| Aristotle primary | Bekker number with work abbreviation | `DA III.3, 428a1-3`; `Met. IX.8, 1049b12-17`; `Phys. IV.11, 219b1-2` |
| Aristotle work abbreviations | `DA` = *De Anima* / *On the Soul*; `Met.` = *Metaphysics*; `Phys.` = *Physics*; `NE` = *Nicomachean Ethics*; `MA` = *Movement of Animals*; `Rhet.` = *Rhetoric*; `Sense` = *Sense and Sensibilia* / *De Sensu*; `Mem.` = *On Memory* / *De Memoria*; `Insomn.` = *On Dreams* / *De Insomniis*; `HA` = *Historia Animalium*; `Poet.` = *Poetics* | |
| Heidegger BCAP | `BCAP <page>` (Indiana 2009 trans.) | `BCAP 110`, `BCAP 131-132` |
| Heidegger SZ | `SZ §<section>, H.<H-page>; Eng. <macquarrie-robinson-page>` | `SZ §29, H.135; Eng. 174` |
| Heidegger GA | `GA <vol>, p.~<page>` | `GA 18, p.~117` |
| Burke | `Burke, *Grammar*, pp.~<n>-<n>` or `*RoM*` for *Rhetoric of Motives* | `Burke, *Grammar*, pp.~280-281` |
| Secondary | author-year + page | `Frede 1992, 279`; `Hawhee, *Bodily Arts*, p.~154`; `White 1985, 502` |

---

## Appendix C — File listing (for run-config / claudeflow input manifest)

Scope-locked per user 2026-05-13. **Only the 7 files below are analyzed.** Any other variant (`.md` working copies of §§1.1/1.2, the `Pathos and Pathe` working copy under §1.4, anything in `Pathe/`) is excluded.

```
tmp/Dissertation/1.0 - Introduction/1.0 - Introduction.md
tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex
tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_OUTPUT_v1.tex
tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md
tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md
tmp/Dissertation/1.5 - A4 - Completed Action/1.5 - A4 - Completed Action.md
tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/actualization-chain-v7.html
```

Reference (consulted but not analyzed): `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/Actualization of Desire Diagram in Latex Format.md` — the format reference for the 7 TikZ-in-md static exports the pipeline will produce.

Explicitly excluded:
- `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1 - A0 - Motion and Time.md` (predecessor .md; .tex v2 is canonical)
- `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v1.tex` (superseded by v2)
- `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_PROMPT.md` (prompt artifact)
- `tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2 - A1-A2 - Aisthesis.md` (predecessor .md; .tex v1 is canonical)
- `tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_PROMPT.md` (prompt artifact)
- `tmp/Dissertation/1.4 - Emotion is Motion/1.2 Pathos and Pathe - Two Articulational Concretions.md` (working copy; consolidated into §1.4)
- `tmp/Dissertation/Pathe/*` (notes-only; consolidated into §1.4)

---

## Appendix D — Phase-by-phase activation checklist

```
[ ] Pre-Phase 0: all 8 pre-flight Qs RESOLVED (see §15); run-config locks in:
     - lanham-tier = auto
     - perplexity-cap = 40 queries / run, $100 budget soft-cap
     - tier-c-downloads = enabled (corpus/download/ + basic ingest)
     - roadmap-format = hybrid (master + per-section)
     - diagram-export-format = TikZ-in-md
     - file-inventory = 7 files (per §3.1, §App C)
[ ] Phase 0: preflight scan → produces _run-history/<run-id>/phase0-preflight.md
[ ] Phase 1: per-section metadata → 7 metadata JSONs (6 sections + 1 diagram)
[ ] Phase 2a: §1.4 deep analysis (synchronous, baseline) → §1.4's full artifact set + Lanham baseline
[ ] Phase 2b: §§1.0/1.1/1.2/1.3/1.5 deep analysis (parallel) → 5 artifact sets
[ ] Phase 2c: diagram deep analysis (parallel) → diagram audit + 7 TikZ-in-md static exports
[ ] Phase 3 Wave 1: terminology + numbering + ontology (3 parallel)
[ ] Phase 3 Wave 2: inconsistency + relocations (2 parallel)
[ ] Phase 3 Wave 3: Lanham profile matrix (auto tier)
[ ] Phase 3 Wave 4: citation gap master + corpus routing + Perplexity queue (preliminary; ≤40 queries — may shrink after Phase 3.5)
[ ] Phase 3.5: TIER C CACHE RECONCILIATION (new)
     - Parse tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md (244 entries)
     - Build pathe → DISS section map; match cache entries to current DISS-04-EMOTION claims by quoted-phrase anchor
     - Classify each DISS-04-EMOTION gap as cache-hit-strong / cache-hit-supplementary / cache-partial / cache-miss
     - Generate ~150–244 cache fill proposals in _per-section/DISS-04-EMOTION/citation-fills/cache-*.md
     - Re-allocate Perplexity budget (expected: 15–25 query slots freed from §1.4 → redistributed across §§1.0/1.1/1.2/1.3/1.5)
     - 17-sources-vs-corpus-index audit; identify corpus-download-only cohort for Phase 4.0 ingest
[ ] User decision point: review terminology-reckoning §4 (4 Qs) BEFORE Phase 4
[ ] Phase 4.0 prelude: BASIC INGEST OF `corpus/download/` PDFs (new)
     - Enumerate corpus/download/MANIFEST.json (22 PDFs)
     - Skip PDFs already in corpus/index (route their cache hits to Tier A)
     - For corpus-download-only PDFs: text extraction (Marker → PyMuPDF → pdftotext fallback; reuse text-cache/ where present) → chunk → embed via local service → insert into ChromaDB `dissertation-perplexity-cache` collection
     - Compute dissertation-relevance-density per PDF; flag deep-analysis candidates
[ ] Phase 4 Tier A: corpus/index retrieval (3-5 parallel) — includes cache hits routed to Tier A
[ ] Phase 4 Tier B: ChromaDB retrieval (2-3 parallel) — now queries `dissertation-perplexity-cache` collection too
[ ] Phase 4 Tier C: cache-first then fresh Perplexity with escalation (2-3 parallel)
     - For each DISS-04-EMOTION gap with cache hit: produce proposal from cached data, NO PERPLEXITY QUERY consumed
     - For genuine cache misses across all sections: issue fresh Perplexity query starting at S1 (sonar-pro + low context)
     - Auto-escalate per policy: S1 → S2 (sonar-pro + medium context) → S3 (sonar-deep-research) for load-bearing gaps only
     - Each escalation counts as separate query toward the 40-query initial allocation
     - Monitor: query count + spend; pause-and-notify at 36 queries OR <$20 budget remaining OR credits exhausted
     - Pause-options: add funds & continue / raise cap / S1-only-for-remainder / defer / downgrade
     - For each new download: SHA + manifest append + basic ingest + ChromaDB embed
     - Flag deep-analysis candidates in _synthesis/perplexity-downloads-flagged-for-deep-analysis.md
     - Log all escalations to _synthesis/perplexity-escalation-log.jsonl
[ ] Phase 5: revision roadmap compilation (hybrid: master + per-section checklists)
[ ] Generate _living/latest pointer
[ ] If prior run exists: generate _living/diff-from-previous.md
[ ] Report total wall time + token usage + Perplexity-budget-consumed + downloads-count; summary metrics to user
```

---

**End of plan v1.4. Pre-flight locked, existing cache integrated, escalation policy active. Awaiting user clearance to execute Phase 0.**
