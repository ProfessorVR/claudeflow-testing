# Phase 0 Overview — Aristotelian Emotion Secondary (1975–2015)

**Cluster type**: Scholarly cluster — 5 secondary-literature units on Aristotle's theory of emotion (*pathē*), organized around the **judgmental vs. non-judgmental** debate (does emotion require *doxa*/belief, or only *phantasia*/appearance?).
**Date**: 2026-06-04
**Pipeline**: Tier 2 (per-unit `{json,md,edges.csv}` + cluster `_synthesis/`) **minus the five `.mmd` graphs** (per user, 2026-06-04). Executed by direct close reading (not the agent pipeline).
**Output root**: `corpus/index/Aristotelian Emotion Secondary (1975-2015)/`
**Unit prefix**: `aes`; units numbered by year of the analyzed work.
**Model after**: `plans/phantasia-cluster-2025-analysis.md` (the spec that produced the `phx` / "Aristotelian Phantasia Secondary (1985-2017)" cluster).

> **Why this cluster exists.** It is the secondary-literature backbone for the fixes flagged in `tmp/Dissertation/Section-5-Emotion-ADVISOR-REVIEW-2026-06-04.md` — above all **T1-2** (the *doxa*-gate vs. the *phantasia*-based reading), but also **T1-4** (grief / emotions toward non-realizable goods) and the **animal-emotion / analogical-pathos** problem. Unlike the *phantasia* cluster (organized by a *concept*), this cluster is organized by a *dispute*: whether the cognition constitutive of *pathos* is belief (*doxa*) or appearance (*phantasia*).

---

## 1. The cluster

| # | Author | Year | Work | Type | Discipline | Pole on the central axis |
|---|--------|------|------|------|------------|--------------------------|
| **aes-01** | Fortenbaugh, W. W. | 1975 | *Aristotle on Emotion* | monograph (~100 pp.) | ancient phil. / philosophical psychology | **Judgmental** — the cognitivist *locus classicus*: emotions essentially involve a belief/judgment, hence are reason- and rhetoric-responsive |
| **aes-02** | Konstan, David | 2006 | *The Emotions of the Ancient Greeks* | monograph (~420 pp.) | classics / history of emotions | **Judgmental (social-cognitive)** — *pathē* are construals of others' acts bearing on social standing; emotions = judgments, denied to animals/children |
| **aes-03** | Moss, Jessica | 2009 | "Akrasia and Perceptual Illusion" | article (~38 pp., *AGPh* 91.2) | ancient phil. / moral psychology | **Non-judgmental** — *akrasia* = conflict between *phantasia* and reason, structurally like perceptual illusion; the motivating appearance is non-doxastic |
| **aes-04** | Moss, Jessica | 2012 | *Aristotle on the Apparent Good* | monograph (~240 pp.) | ancient phil. / moral psychology | **Non-judgmental** — the apparent good (incl. the passions' object) is a quasi-perceptual *phantasia* appearance, not a rational belief |
| **aes-05** | Dow, Jamie | 2015 | *Passions and Persuasion in Aristotle's Rhetoric* | monograph | ancient phil. / rhetoric | **Judgmental (affirmation)** — defends, *against* the "mere appearance" reading, that the passions require the subject's *affirming* the representation as true |

**Span**: 1975–2015 (40 years) — supports a scholarly-evolution narrative (Wave 3).
**Disciplinary split**: 4 ancient-philosophy/moral-psychology + 1 classics; Dow bridges to rhetoric.
**Poles**: Judgmental = Fortenbaugh, Konstan, Dow (≈ the dissertation's allies). Non-judgmental = Moss ×2 (the dissertation's rival). The cluster's spine is this opposition.

### OCR audit
All five are **clean text-layer PDFs**; `pdftotext` extraction is crisp (verified on Moss-AG TOC/Introduction and Konstan TOC/Preface). **No Marker/GPU OCR repair required.** Greek appears transliterated in running text in all five (e.g. *phantasia*, *orexis*, *pathē*), with occasional polytonic Greek in Moss/Konstan footnotes — track typographic variants in the Greek-terminology appendix.

---

## 2. Scope decisions (monographs scoped to emotion-relevant chapters)

| Unit | Scope (printed pages) | Rationale |
|------|----------------------|-----------|
| **aes-01 Fortenbaugh** | Whole (short book); core = the chapters on emotion-as-cognition, emotion in relation to belief & appearance, and the effect of emotion on judgment | Foundational cognitivist statement; short enough to read entire |
| **aes-02 Konstan** | **Ch. 1 *Pathos* and Passion (3–40)** [conceptual core]; **Ch. 2 Anger (41–76)**, **Ch. 4 Shame (91–110)**, **Ch. 5 Envy & Indignation (111–128)**, **Ch. 6 Fear (129–155)**, **Ch. 10 Pity (201–218)**, **Ch. 12 Grief (244–258)** | Ch. 1 = his theory of *pathos*; the rest = the dissertation's catalog emotions + **Grief** for T1-4 |
| **aes-03 Moss "Akrasia"** | Whole article | Central rival thesis; = published version of Moss-AG Ch. 5 |
| **aes-04 Moss-AG** | **Ch. 4 Passions & the Apparent Good (69–99)** [core: §4.1 "Doxastic vs. phantastic accounts of the passions"; §4.6 "accepting vs. believing"]; **Ch. 3 *Phantasia* (48–67)**; **Introduction (xi–xv)**; Ch. 5 (100–136) treated as book-form of aes-03 | Ch. 4 *is* the T1-2 debate, by name; Ch. 3 = her *phantasia* account |
| **aes-05 Dow** | The "Feeling Fantastic Again — Passions, Appearances, and Beliefs" chapter + the chapter(s) defining the passions as pleasures/pains with a cognitive (affirmation) component | Dow's defense of the affirmation/belief reading against recalcitrance |

---

## 3. Debate axes (cluster-defining spectra)

1. **DOXASTIC ↔ PHANTASTIC** *(central)*: is the cognition constitutive of *pathos* a belief (*doxa*) or an appearance (*phantasia*)? Fortenbaugh/Konstan/Dow → doxastic/affirmational; Moss → phantastic/non-doxastic.
2. **Cognitive-evaluative ↔ quasi-perceptual**: is the evaluative content a judgment *that p*, or a perception-like *appearing-good*? (Moss's "appears good as things appear large.")
3. **Social-relational ↔ individual-psychological**: Konstan foregrounds the interpersonal/status construal (toward-whom); the philosophers foreground the agent's internal cognitive state.
4. **Reason-governed ↔ pleasure/appearance-governed**: Moss restricts reason's role and centers pleasure; Fortenbaugh makes emotion answerable to reason via belief.
5. **Animals have *pathē* ↔ *pathē* are rational-only**: Konstan reads Aristotle as denying *pathē* "in the proper sense" to animals/children (supports the rationality/*doxa* requirement); Moss's non-doxastic appearance lowers the bar.

---

## 4. Mapping to the dissertation's Section 5 findings

| §5 finding (from the advisor review) | Primary texts/chapters that arm it |
|---|---|
| **T1-2** *doxa*-gate vs. *phantasia* rival; recalcitrance (rope-snake, sun, fiction) | Moss-AG §4.1, §4.5–4.6 (rival); Moss "Akrasia" (illusion model = recalcitrance); Dow "Feeling Fantastic Again" (the *affirmation* defense = ally); Fortenbaugh (belief view = ally) |
| **T1-4** emotion toward non-realizable goods / grief | Konstan Ch. 12 **Grief** (argues grief did *not* fit Aristotle's emotion-conception); Moss on desire/wish and the apparent good |
| **animal-emotion / analogical *pathos*** (1079 fn) | Konstan Preface + Ch. 1 (animals/children lack *pathē* "in the proper sense"); Moss on non-rational motivation (Part II) |
| **two-tier reconciliation** (basic tonality = *phantasia*; civic emotions = *doxa*) | Moss (lower tier) ↔ Dow/Fortenbaugh (higher tier) — the cluster's contested-readings doc will ground this |
| **toward-whom / *Mitsein*** (five-fold element 2) | Konstan (social-relational construal of each emotion) |

---

## 5. Cross-pipeline bridges

- **Aristotelian Phantasia Secondary (1985–2017)** — direct: **Moss vs. Caston/Frede** on what *phantasia* is and does; Nussbaum on *phantasia* & action. (Bridge edges, capped.)
- **Heidegger – Basic Concepts of Aristotelian Philosophy (BCAP)** — *pathos* as being-taken; *doxa* as yes-saying. The dissertation's Heideggerian frame meets the analytic debate here.
- **Uncomfortable Situations (Gross 2017)** — situated/social emotion; Gross explicitly contra Nussbaum/Sorabji "brain science."
- **Corcilius (2011 non-rational pleasure/pain/desire; 2013 animal motion)** — already in corpus; bears on the animal-*pathos* and somatic-substrate questions.
- **Dissertation Part I §5** — the consumer of this cluster.

## 6. Supplementary sources already in corpus (not core units; cite as available)
- `corpus/download/Jamie_Dow_2011_Aristotle_s_Theory_of_the_Emotions_Emotions_as_Pleasures.pdf` — Dow's 2011 article (the pleasures/pains thesis; precursor to the 2015 book).
- `corpus/download/.../Q-016_cit08_..._ROLE_OF_EMOTION-AROUSAL_IN_ARISTOTLE_S_RHETORIC...pdf`
- `corpus/download/.../Q-017_cit03_SHAME_AND_VIRTUE_IN_ARISTOTLE.pdf`

---

## 7. Pipeline status (this cluster)

- [x] **Phase 0** — overview + manifest (this doc + `manifest.json`)
- [x] **Layer-1 ingest, Phase 1** — all 5 PDFs chunked into `rhetorical_ontology` (pdftotext; `ok=590 failed=0` whole-root run, 2026-06-04)
- [ ] **Layer-1 ingest, Phase 2 (embeddings)** — DEFERRED (whole-root re-embed risk; not needed for analysis; run deliberately later)
- [x] **Phase 2 (deep per-unit analysis)** — COMPLETE (2026-06-04). All 5 units → `{json, md, edges.csv}`. aes-03 by direct close-read; aes-01/02/04/05 by spec'd subagents over the actual PDF text. Edge counts: 42/46/28/52/42.
- [x] **Phase 3 (cluster synthesis, minus graphs)** — COMPLETE (2026-06-04). Written: `cluster-ontology.{md,json}`, `global-edges.csv` (210 edges), `debate-map.{md,json}`, `concept-matrix.csv` (37 concepts × 5), `contested-readings.md` (10 contested readings + dissertation bridge), `aes-aristotle-loci-concordance.{md,json}` (14 keystone convergence loci), `aes-greek-terminology-appendix.{md,json}` (40 lemmas), `citation-network.{md,json}`, `aes-secondary-literature-network.{md,json}`, `aes-scholarly-evolution-1975-2015.md`. The five `.mmd` graphs intentionally omitted per user.

### Quality gates — RESULT
- global-edges.csv: **210** (gate ≥150) ✓
- contested readings: **10** (gate 8–12) ✓
- Bekker citations in concordance: **~160 distinct loci across 16 works** (gate ≥80) ✓
- Greek lemmas tracked (≥2 units): **40** (gate ≥35) ✓
- All JSON valid; content-filter respected (unit longest-verbatim ≤23 words; synthesis is original prose).

### Quality gates (scaled for 5 units, books-heavy)
- ≥150 deduplicated edges in `global-edges.csv`
- 8–12 contested readings in `contested-readings.md` (central axis foregrounded)
- ≥80 Bekker citations canonicalized in the Aristotle-locus concordance
- ≥35 Greek lemmas tracked
- **Content-filter discipline**: NO ≥25-word verbatim from any copyrighted unit; paraphrase + page anchor only (short attributed phrases permitted).
