# Gross & Kemmann (eds.) *Heidegger and Rhetoric* (2005) Analysis Pipeline — Living Plan

**Status**: DRAFT (Phase 0 NOT STARTED)
**Created**: 2026-05-10
**Last Updated**: 2026-05-10

**Edition**: Daniel M. Gross and Ansgar Kemmann (eds.), *Heidegger and Rhetoric*. SUNY series in Contemporary Continental Philosophy (Dennis J. Schmidt, series editor). Albany: State University of New York Press, 2005. ISBN 0-7914-6551-9 (hardcover) / 0-7914-6552-7 (paperback). LC B3279.H49H346 2005.
**Source PDF**: `corpus/rhetorical_ontology/Multiple Authors - Heidegger and Rhetoric_(2005)_[My Copy].pdf` (201 PDF pages, OCR'd by ABBYY FineReader 11)
**Related**: BCAP pipeline (the volume's primary reference text), BT pipeline (recurring secondary reference), Aristotle pipeline (primary Greek source for most contributors), Rickert pipeline (Daniel Gross is cited by Rickert; same theoretical neighborhood).

---

## Pre-Execution Notes

### What Is Different About This Pipeline

This is the **first secondary-literature pipeline** in the corpus index. All five prior pipelines (Aristotle, BCAP, BT, Rickert, Uexküll) analyze a single primary author. This one analyzes an edited volume of seven independent essays by seven different authors writing *about* Heidegger (and, by extension, Aristotle). The structural consequences are significant:

1. **Per-essay, not per-section, unitization.** Each essay is by definition a self-contained argument with its own thesis, methodology, and citation register. Splitting essays at section boundaries (as we did for BCAP §§ or BT chapters) would fracture coherent arguments. The natural unit is the essay; only Gross's 47-page Introduction may need to be split.

2. **Authors are interlocutors, not just sources.** When Hyde reads Heidegger, when Struever reads Heidegger, when Pöggeler reads Heidegger, each is producing a distinct *interpretation* of the same primary texts (BCAP, BT, *Rhetoric*, NE, *Politics*). Phase 3 must therefore include **inter-contributor disagreement mapping** — how, e.g., Pöggeler's "restricted" reading of Heideggerian rhetoric contrasts with Gross's "central to fundamental ontology" reading.

3. **Cross-pipeline references are textually grounded, not [INTERP-high].** Every Aristotle citation, every BCAP §, and every BT H-page these contributors invoke is a verbatim citation that can be cross-linked to the existing BCAP, BT, and Aristotle pipeline artifacts. This makes the cross-pipeline concordance for this volume a **first-class deliverable** rather than a parked Phase 4 artifact.

4. **Translation chains affect terminology fidelity.** Three of seven essays are translations:
   - Ch 2 Gadamer interview (German → English) by Lawrence Kennedy Schmidt
   - Ch 3 Michalski (German → English) by Jamey Findling
   - Ch 7 Pöggeler (German → English) by John Bailiff
   The other four were written in English by their authors. German technical terms (*Sprachlichkeit*, *Befindlichkeit*, *Sorge*, *Alltäglichkeit*, *Mitsein*) appear throughout. Greek technical terms (*pathos*, *dynamis*, *kairos*, *ethos*, *phronēsis*) appear in transliteration almost everywhere and in Greek script in some chapters.

**FOLDER STRUCTURE (per user directive 2026-05-10)**: Top-level index folder is the book title `Heidegger and Rhetoric`. Inside, each essay (and the Introduction) gets its own subfolder named `<Author> - <Abbreviated Title>`. Volume-level synthesis files sit at the top level or in a `_synthesis/` subfolder. This differs from the prior pipelines (which use a single `<work>-analysis/` + `<work>-structured/` pair) because the per-essay structure of an edited volume is the natural unit of organization.

```
corpus/index/Heidegger and Rhetoric/
├── _synthesis/                                 # Volume-level deliverables
│   ├── phase0-overview.md
│   ├── manifest.json
│   ├── book-level-ontology.md
│   └── (other Phase 3 deliverables)
├── Gross - Introduction (Being-Moved)/         # Ch 1, split into A and B sub-units
│   ├── phase2-hr-01-gross-a.md / .json
│   ├── phase2-hr-01-gross-b.md / .json
│   └── unit-metadata.json
├── Gadamer - Heidegger as Rhetor/              # Ch 2
├── Michalski - Hermeneutic Phenomenology as Philology/   # Ch 3
├── Hyde - Matter of the Heart (Epideictic and Conscience)/  # Ch 4
├── Struever - Alltäglichkeit (Timefulness)/    # Ch 5
├── Kisiel - Rhetorical Protopolitics/          # Ch 6
└── Pöggeler - Heidegger's Restricted Conception of Rhetoric/  # Ch 7
```

5. **The volume contains its own finished editorial apparatus** — not just a TOC and index but:
   - A 7-page **Selected Bibliography** (Kemmann), itself a curated research artifact organized into "Rhetoric Defined in Heidegger's Work" + "Published and Unpublished Works by Heidegger around SS 1924" + "Secondary Literature."
   - A 4-page **Contributors** section with biographical data on all seven authors plus the two translators.
   - An **Index of Names** (4 pp.) including sub-entries for Aristotle's works (organized by *De anima*, *De motu animalium*, *Metaphysics*, *Nicomachean Ethics*, *Physics*, *Politics*, *Rhetoric*, *Topics*) and for Heidegger's works.
   - An **Index of Subject Matter** (3 pp.) which functions as a pre-curated **trilingual concept glossary** — almost every entry has a German or Greek parenthetical (e.g., "Care (*Sorge*)", "Articulation (*Aussagen* / *logos*)", "Mood (*Stimmung* / *pathos*)").

   These editorial apparatuses must be ingested in their own right. The Subject Index in particular is a gift: it pre-resolves the German/Greek/English mappings the BCAP and BT pipelines built from scratch.

6. **The volume is dissertation-load-bearing.** Per the user's project notes (`section-3-aristotle-heidegger-integration.pdf`), this collection sits in the same neighborhood as the dissertation's Aristotle-Heidegger integration argument. All seven essays are dissertation-critical; **all seven warrant mandatory two-pass JSON-first analysis**. There are no "light tier" units in this pipeline.

### PDF Offset

> **Verified offset**: book page + 6 = PDF page (uniform throughout body text).
> Confirmed by three landmarks during draft-plan reconnaissance:
> - Ch 1 ("Introduction"), book p.1 = PDF p.7 (1+6=7) ✓
> - Ch 2 ("Heidegger as Rhetor"), book p.47 = PDF p.53 (47+6=53) ✓
> - Ch 3 ("Hermeneutic Phenomenology"), book p.65 = PDF p.71 (65+6=71) ✓
> - Ch 4 ("A Matter of the Heart"), book p.81 = PDF p.87 (81+6=87) ✓
> - Ch 5 ("Alltäglichkeit"), book p.105 = PDF p.111 (105+6=111) ✓
> - Ch 6 ("Rhetorical Protopolitics"), book p.131 = PDF p.137 (131+6=137) ✓
> - Ch 7 ("Heidegger's Restricted Conception"), book p.161 = PDF p.167 (161+6=167) ✓
> Front matter occupies PDF pp. 1–6: cover, series, title, copyright, contents (v), blank (vi).
> Phase 0 must re-confirm offset with one mid-text and one late-text landmark (Phase 0.1).

### OCR Quality Note

The PDF was OCR'd by ABBYY FineReader 11. Spot reading of the Bibliography reveals occasional artifacts (lowercase fragments, page-number drift), but the body text reads cleanly. **Phase 0 must include an OCR Confidence triage** (High / Medium / Low) per essay; flagging low-confidence pages early prevents bad data from feeding Phase 3.

---

## Volume Structure (from TOC, p. v / PDF p. 5)

| Ch | Author | Essay | Translator | Book pp. | PDF pp. | Body pp. | Notes pp. | Total |
|----|--------|-------|------------|----------|---------|----------|-----------|-------|
| 1 | Daniel M. Gross | Introduction: Being-Moved: The Pathos of Heidegger's Rhetorical Ontology | — | 1–46 | 7–52 | ~38 | ~8 (in-text/end) | 46 |
| 2 | Hans-Georg Gadamer (interviewed by Ansgar Kemmann) | Heidegger as Rhetor | Lawrence Kennedy Schmidt | 47–64 | 53–70 | ~16 | ~2 | 18 |
| 3 | Mark Michalski | Hermeneutic Phenomenology as Philology | Jamey Findling | 65–80 | 71–86 | ~14 | ~2 | 16 |
| 4 | Michael J. Hyde | A Matter of the Heart: Epideictic Rhetoric and Heidegger's Call of Conscience | — | 81–104 | 87–110 | ~20 | ~4 | 24 |
| 5 | Nancy S. Struever | *Alltäglichkeit*, Timefulness, in the Heideggerian Program | — | 105–130 | 111–136 | ~22 | ~4 | 26 |
| 6 | Theodore Kisiel | Rhetorical Protopolitics in Heidegger and Arendt | — | 131–160 | 137–166 | ~26 | ~4 | 30 |
| 7 | Otto Pöggeler | Heidegger's Restricted Conception of Rhetoric | John Bailiff | 161–176 | 167–182 | ~14 | ~2 | 16 |
| BIB | Ansgar Kemmann (compiler) | Selected Bibliography: Heidegger and Rhetoric | — | 177–183 | 183–189 | — | — | 7 |
| CON | — | Contributors | — | 185–188 | 191–194 | — | — | 4 |
| IX-N | — | Index of Names | — | 189–192 | 195–198 | — | — | 4 |
| IX-S | — | Index of Subject Matter | — | 193–195 | 199–201 | — | — | 3 |

**Body pages cited above** are approximate; per-essay note distribution must be confirmed at Phase 0 by reading the last 2–3 pages of each chapter (notes are typically at the chapter's end in this volume — Ch 2's notes at pp. 63–64 are confirmed).

### Per-Chapter Internal Section Structure (preliminary, from spot reading)

The contributors use varied internal structures. Phase 0 must confirm and record:

| Ch | Internal headings? | Heading style | Confirmed |
|----|-------------------|---------------|-----------|
| 1 | Yes — Roman-numeral major sections | "I. HERMENEUTICS OR RHETORIC?" (small caps) | 1 confirmed (p.5); rest TBD |
| 2 | Yes — Roman-numeral major sections | "I. BIOGRAPHICAL INTRODUCTION", "II. ON THE STATUS OF RHETORIC", "III. THE RHETORIC OF PHILOSOPHY", "IV. THE PHILOSOPHY OF RHETORIC IN THE UNIVERSE OF LINGUISTICALITY [SPRACHLICHKEIT]" | All 4 confirmed |
| 3 | TBD | (likely Roman; needs verification) | TBD |
| 4 | TBD | TBD | TBD |
| 5 | Yes — Roman + numbered subsections | "I. THE PLACE OF RHETORIC IN THE ARISTOTELIAN PROGRAM: LIFE AND TIMES" + "1. Heidegger's Account of the Nature of Rhetorical Inquiry: Rhetoric as Life Science" | I.1 confirmed; rest TBD |
| 6 | TBD (no heading visible at p.131) | (may be section-less or use later headings) | TBD |
| 7 | TBD (no heading visible at p.161) | (may be section-less or use later headings) | TBD |

Phase 0 records section structure into each chapter's Phase 1 JSON skeleton.

---

## Unitization

### Design Principles

1. **Essay = natural unit.** Seven essays, seven primary units.
2. **Long Introductions split.** Ch 1 (Gross, 46 body pp.) is split into 2 sub-units at a Roman-numeral section boundary identified during Phase 0.
3. **Editorial apparatus as research artifacts**, not analysis units:
   - Bibliography (BIB) → Phase 3 deliverable: extracted, structured, indexed
   - Subject Index → Phase 3F seed input for the volume's terminology appendix
   - Name Index → Phase 3 deliverable: cross-linked to interlocutor map
4. **Target unit size**: ~15–25 body pages per unit, consistent with prior pipelines.
5. **All units are dissertation-critical and two-pass.** No light-tier units in this pipeline.

### Primary Units (8 — assuming Gross is split)

| Unit ID | Ch | Author | Label | Book pp. | PDF pp. | ~Pages | Two-pass | Dissertation-critical |
|---------|----|--------|-------|----------|---------|--------|----------|----------------------|
| HR-01-GROSS-A | 1 | Gross | Introduction: Pathos & Rhetorical Ontology — opening through Sec. ~III | 1–~22 | 7–~28 | ~22 | **Yes** | **Yes** — frames volume's central thesis |
| HR-01-GROSS-B | 1 | Gross | Introduction: Sec. ~IV through close — political/genealogical work | ~23–46 | ~29–52 | ~24 | **Yes** | **Yes** — pathos genealogy, Heidegger politics |
| HR-02-GADAMER | 2 | Gadamer/Kemmann | Heidegger as Rhetor (interview) | 47–64 | 53–70 | 18 | **Yes** | **Yes** — rhetoric as *dynamis*; primary witness |
| HR-03-MICHALSKI | 3 | Michalski | Hermeneutic Phenomenology as Philology | 65–80 | 71–86 | 16 | **Yes** | **Yes** — GA 18 editor on Heidegger's method |
| HR-04-HYDE | 4 | Hyde | Epideictic Rhetoric and the Call of Conscience | 81–104 | 87–110 | 24 | **Yes** | **Yes** — direct BT §§54–60 bridge |
| HR-05-STRUEVER | 5 | Struever | *Alltäglichkeit*, Timefulness | 105–130 | 111–136 | 26 | **Yes** | **Yes** — everydayness + biological-text intrications |
| HR-06-KISIEL | 6 | Kisiel | Rhetorical Protopolitics in Heidegger and Arendt | 131–160 | 137–166 | 30 | **Yes** | **Yes** — political register; Arendt comparison |
| HR-07-POGGELER | 7 | Pöggeler | Heidegger's Restricted Conception of Rhetoric | 161–176 | 167–182 | 16 | **Yes** | **Yes** — negative case (rhetoric *abandoned*) |

> **Design note (HR-01-GROSS split)**: The 46-page Gross Introduction is too long for a single coherent analysis pass and far exceeds the 15–25 page target. The split point is the Roman-section boundary closest to the midpoint. Phase 0 confirms this against the actual section headings; the alternative is a 3-way split (HR-01-GROSS-A/B/C). Pre-execution estimate: 2-way split at section III/IV boundary.

> **Design note (HR-02-GADAMER format)**: The interview consists of 30+ short Q&A turns plus 31 footnotes. The thematic structure runs through the four Roman-numeral sections (Biographical / Status of Rhetoric / Rhetoric of Philosophy / Philosophy of Rhetoric in the Universe of Linguisticality). Treat as one unit: the interview's coherence is at the volume level, not the section level.

> **Design note (HR-06-KISIEL size)**: At 30 body pages, this is the largest single-essay unit. Acceptable because it is a tightly argued political-rhetorical genealogy and resists subdivision. Consider 3-pass (outline → concept/citation extraction → narrative synthesis) if context proves tight at execution time.

### Editorial Apparatus (3 — research-resource deliverables, NOT Phase 2 unit-template targets)

| Apparatus ID | Pages (book) | PDF pages | Phase 3 role |
|--------------|--------------|-----------|--------------|
| HR-BIB | 177–183 | 183–189 | Structured extraction → cross-pipeline citation reconciliation; bibliography concordance |
| HR-IX-N | 189–192 | 195–198 | Names index → interlocutor map enrichment |
| HR-IX-S | 193–195 | 199–201 | Subject index → seed for Phase 3F volume glossary (German/Greek/English) |

These are processed in Phase 3 (synthesis), not Phase 2 (unit analysis), because they are aggregated views of the volume's content rather than primary argumentative units.

### Unitization Summary

| | Units | Two-pass | Dissertation-critical | Light tier |
|--|-------|----------|----------------------|------------|
| Primary essays (with Gross split) | 8 | 8 | 8 | 0 |
| Editorial apparatus | 3 | — | — | — |

---

## Controlled Vocabularies

### Edge Relations (shared with all 5 prior pipelines)

```
{depends_on, contrasts_with, refines, presupposes, explains, operationalizes,
 supports, undermines, exemplifies, historicizes, is_meaning_of}
```

### Edge Domains (shared + specialized)

```
{ontological, existential, existentiale-structural, rhetorical, temporal,
 genealogical, methodological, hermeneutic, political, ethical, philological}
```

**New for this pipeline**:
- `hermeneutic` — Gadamer/Michalski/Pöggeler all explicitly engage hermeneutics as a meta-method; this domain captures relations *about interpretation itself* rather than relations *within* an ontology.
- `political` — Kisiel's "protopolitics," Gross's National Socialism discussion, Arendt connection. Distinct from `ethical` (which covers conscience, *phronēsis*, virtue).
- `philological` — Michalski's specific case for Heidegger's procedure as philology; covers terminological/etymological/textual-critical relations.

`ethical` is included for Hyde's call-of-conscience material and Struever's *phronēsis* discussion. Other domains are already standard from the prior pipelines.

### Centrality Tiers (3-tier, consistent with all prior pipelines)

- **core**: Concepts that are structurally necessary for the volume's overall claim about Heidegger and rhetoric.
- **important**: Concepts that carry significant weight in one or more essays.
- **peripheral**: Concepts that appear briefly, illustrate a point, or connect to external debates.

### Volume-Specific Object Types (new)

Phase 2 captures four kinds of structured entities (Phase 3 indexes them):

1. **CONCEPT** — Heideggerian/Aristotelian/rhetorical concepts (the standard prior-pipeline node type).
2. **POSITION** — A contributor's claim, marked by contributor (not just unit).
3. **HEIDEGGER-LOCUS** — A specific Heidegger primary citation (with GA volume + page, BT H-page, or Marburg-lecture date). Bridges directly to BCAP and BT pipelines.
4. **ARISTOTLE-LOCUS** — A specific Aristotle primary citation (with Bekker number where available). Bridges directly to the Aristotle pipeline's Bekker index.

Object-type prefixes are used in edge source/target fields: `CONCEPT:Pathos`, `POSITION:HR-04-HYDE-P3`, `HEIDEGGER-LOCUS:GA18.117`, `ARISTOTLE-LOCUS:Rhet.1378a20`.

---

## Provisional Key Concepts (Phase 0 seed list — ~50 candidates)

Drawn from the volume's own Index of Subject Matter (pp. 193–195), the abstracts reachable from the chapter openings, and Gross's explicit list (Introduction, p. 2: "the rhetorical genealogy of some of these key terms"). Phase 0 refines this against the full Subject Index.

### Core Heideggerian Concepts (German + English)

1. **Dasein** — being-there
2. **Mitsein** / **Miteinandersein** / **Mitsein** — being-with / being-with-one-another (Gross translates *koinōnia*)
3. **Sorge** — care
4. **Befindlichkeit** — attunement / state-of-mind / findingness
5. **Stimmung** — mood (Gross translates as *pathos*)
6. **Alltäglichkeit** — everydayness (the volume's most-cited term per Subject Index)
7. **Verfallen / Gerede** — falling / idle talk
8. **Angst** / **Furcht** — anxiety / fear (Gross: *Angst/phobos*)
9. **Augenblick** — moment (Gross: *Augenblick/kairos*)
10. **Ekstase** — ecstasy
11. **Entschluß** / **Entschlossenheit** — decision / resoluteness (Gross: *Entschluß/krisis*)
12. **Ruf des Gewissens** — call of conscience (Hyde's organizing concept)
13. **Lage** — situation (Gross: *being-in*)
14. **Glaube** / **Ansicht** — belief (Gross: *Glaube/doxa*)
15. **Überlegung** / **Beratung** — deliberation (Gross: *Überlegung*)
16. **Sprachlichkeit** — linguisticality (Gadamer)
17. **Erschlossenheit** — disclosedness
18. **Gelassenheit** — releasement (Gross signal in §1)
19. **Augenblick / Jeweiligkeit** — moment / each-each-time (Subject Index marks both)

### Aristotelian Concepts (Greek + English)

20. **rhētorikē** — rhetoric (specifically as Aristotle defines it — *dynamis* per Gadamer)
21. **dynamis** — power, faculty, capacity (Gadamer's preferred Aristotelian definition of rhetoric)
22. **technē** — art, craft, skill (the rejected definition of rhetoric per Gadamer)
23. **pathos / pathē** — passion / passions (the volume's most-cited Greek concept after *logos*)
24. **logos** — speech / reason / account
25. **ethos** — character
26. **doxa** — belief
27. **kairos** — opportune moment (Gross: linked to *Augenblick*)
28. **phronēsis** — practical wisdom (Hyde, Struever)
29. **koinōnia** — community / association (Gross: linked to *Mitsein*)
30. **polis** — city
31. **zōon politikon** — political animal
32. **zōon logon echon** — animal possessing speech / possessed by speech (Kisiel)
33. **endoxa** — common opinions (Subject Index, p. 194)
34. **enthymēma** — enthymeme
35. **pistis** — proof / persuasion / trust
36. **mesotēs** — mean (Subject Index: *meson*)
37. **energeia** — actuality
38. **entelecheia** — actuality / completion
39. **kinēsis** — motion / movement (Subject Index: *Bewegung/kinēsis*)
40. **physis** — nature
41. **hexis** — disposition / state
42. **epistēmē** — knowledge / science
43. **apodeixis** — demonstration

### Rhetorical-Theoretical Concepts (English-primary)

44. **epideictic** (epideiktikon) — Hyde's organizing rhetorical genus
45. **deliberative** (sumbouleutikon) — political rhetoric
46. **judicial** (dikanikon) — forensic rhetoric
47. **trope** — Gross's pivotal concept; tropology measures contingency
48. **discourse** (vs. communication) — Gross emphasizes discursive grounding
49. **persuasion (three modes)** — *ethos*, *pathos*, *logos*

### Methodological / Meta-Concepts

50. **Destruktion** — Heidegger's destructive method (Michalski)
51. **philology** — Michalski's framing
52. **hermeneutics of facticity** — Heidegger's term, recurrent
53. **fundamental ontology** — Gross/Pöggeler battleground concept
54. **protopolitics** — Kisiel's term
55. **rhetorical ontology** — Gross's titular concept (the volume's positive proposal)

---

## Provisional Tensions (Phase 0 seed list — ~10 candidates)

The volume's distinctive feature is **inter-contributor disagreement**. The seven contributors do not converge on a single thesis; they take different positions on whether rhetoric is central or peripheral to Heidegger, on whether Heidegger's "abandonment" of rhetoric after 1924 is principled or politically symptomatic, and on what the SS 1924 lectures finally show. Tensions are therefore tracked at three layers:

### Within-Volume Tensions (between contributors)

1. **Rhetoric as central vs. restricted** — Gross's titular claim ("Heidegger relocates rhetoric at the heart of his fundamental ontology", Intro p. 4) vs. Pöggeler's titular claim ("Heidegger's *Restricted* Conception of Rhetoric"). The volume opens and closes with directly opposed framings.

2. **Rhetoric as *dynamis* vs. *technē*** — Gadamer endorses *dynamis* as Aristotle's correct definition (and Heidegger's reading); some other contributors leave this ambiguous, and Pöggeler's "restricted" thesis may pull the other way.

3. **Continuity vs. rupture in Heidegger's career** — Gross argues SS 1924 → BT is a "direct genetic link" via rhetoric (Intro p. 2, citing Kisiel); Pöggeler tracks Heidegger's *post-1924* career toward poetics (Hölderlin, Trakl) and the abandonment of rhetorical concepts. Where does the rhetorical strand actually go?

4. **Politics — protopolitical vs. anti-political** — Kisiel argues for a "rhetorical protopolitics" already operative in 1923–24; Gross addresses Heidegger's "subsequent Nazism" (Intro p. 5) as compatible with political philosophy; Gadamer concedes Heidegger "erred" politically (Ch 2 p. 55) but does not connect this to rhetoric. What is the relation between Heideggerian rhetoric and Heideggerian politics?

5. **Pathos as cognitive vs. ontological-affective** — Hyde (epideictic) treats pathos as a deliberate rhetorical resource; Gross treats pathos as "the very substance in which propositional thought finds its objects and motivation" (Intro p. 4) — i.e., as ontological substrate. Are these compatible registers?

### Within-Heidegger Tensions (that contributors all confront)

6. **Hermeneutics displacing rhetoric** — Gadamer himself (per Gross's reading of Truth and Method's reception) "downplays" rhetorical loss; Gross interrogates this displacement (Intro pp. 5–6). Did Heidegger's hermeneutic turn cost him rhetoric?

7. **Phenomenology vs. philology** — Michalski's titular question. Heidegger's SS 1924 calls itself philological in aim; what does this mean for the phenomenological project of fundamental ontology?

### Cross-Pipeline Tensions (volume vs. existing pipeline data)

8. **BCAP unit U-FP3a (rhetoric/pistis) reading vs. Hyde's epideictic reading** — BCAP §§13–14 are about deliberative rhetoric (per Heidegger's text); Hyde focuses on the *epideictic* call. Do these readings fit, or does Hyde import an Aristotelian distinction Heidegger himself does not foreground?

9. **BT §§29–30 *Befindlichkeit*/*Furcht* vs. Gross's pathos genealogy** — The BT German appendix records *Befindlichkeit* as central; Gross argues *pathos* (the BCAP precursor) does conceptual work BT slightly conceals. Tension between BT-D1-U5 ontology and HR-01-GROSS reading.

10. **Aristotle pipeline's *kinēsis* (META-07/PHYS-03) vs. Kisiel's "rhetorical-political *kinēsis*"** — Kisiel reads Heidegger's SS 1924 *kinēsis* analysis (citing GA 18 §§25–28) as politically charged; the Aristotle pipeline's META-07 reads the same loci as ontologically primary. Phase 4 productive-tension candidate.

---

## Phase 0 — Global Overview, Offset Validation, Unitization Confirmation

### Goal

Produce a bird's-eye map of the volume, confirm PDF offset on additional landmarks, identify the Gross-split point, record per-essay note distribution, run OCR confidence triage, and refine the Phase 0 concept and tension lists.

### Inputs

- Front matter (PDF pp. 1–6): cover, series, title, copyright, contents
- TOC (book p. v / PDF p. 5)
- Gross Introduction full text (book pp. 1–46, PDF pp. 7–52) — read in full at Phase 0 because Gross's Introduction frames the entire volume
- Opening 2–3 pages of each remaining essay (already partially captured during draft-plan reconnaissance)
- Bibliography (book pp. 177–183, PDF pp. 183–189) — full read at Phase 0 because the bibliography's organization seeds Phase 3 cross-pipeline reconciliation
- Index of Subject Matter (book pp. 193–195, PDF pp. 199–201) — full read at Phase 0 because the index seeds Phase 3F's volume glossary

### Deliverables

1. **Volume overview** (3–4 paragraphs):
   - The volume's project and editorial framing (Gross + Kemmann)
   - The seven essays as a constellation: who agrees with whom, who opposes whom
   - The relationship of the volume to the BCAP/BT/Aristotle/Rickert pipelines
   - The volume's significance for the dissertation's argumentative spine

2. **PDF offset re-confirmation**:
   - Two additional landmark checks: a mid-book page (e.g., book p. 100 = PDF p. 106 expected) and a late-book page (e.g., book p. 175 = PDF p. 181 expected)
   - Front-matter Roman-numeral offset (TOC at "v" = PDF p. 5)
   - Note any drift (none expected; OCR offsets are usually uniform unless pages were scanned out of order)

3. **Per-essay note-distribution audit**:
   - Confirm whether notes are end-of-chapter (typical for this volume per Ch 2's pp. 63–64 notes) or footnote (in-text)
   - Record exact note pages per chapter
   - Required for accurate Phase 1 metadata

4. **Per-essay internal section audit**:
   - Confirm Roman-numeral structure (or its absence) for each essay
   - Record exact section headings + page ranges per essay
   - Required for accurate Phase 1 metadata

5. **Gross Introduction split-point decision**:
   - Read all Roman-numeral sections of HR-01-GROSS
   - Choose split that puts each sub-unit at ~20–25 pages
   - Document split rationale + alternative

6. **OCR Confidence triage** (per essay):
   - High / Medium / Low based on spot reading 5 random pages per essay
   - Low-confidence chapters get spot-checked again at Phase 3 before global deliverables

7. **Refined provisional concept list** (~50 → ~70 after Subject Index integration)

8. **Refined provisional tension list** (~10 → ~12)

9. **Refined provisional interlocutor list** — every figure cited by ≥2 contributors gets entered (Aristotle, Gadamer, Arendt, Plato, Cicero, Kant, Husserl, Bultmann, Scheler, Hartmann, Natorp, Foucault, Ricoeur, Habermas, Burke, Vico, Quintilian, etc.)

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 0.1 | Read mid-book and late-book landmark pages to re-confirm +6 offset | |
| 0.2 | Read Gross Introduction in full (PDF pp. 7–52) | |
| 0.3 | Read each essay's first 3 pages and last 2 pages (notes + close) | |
| 0.4 | Read full Bibliography (PDF pp. 183–189) | |
| 0.5 | Read full Subject Index (PDF pp. 199–201) | |
| 0.6 | Identify Gross split point | |
| 0.7 | Run OCR triage (5 random pages per essay) | |
| 0.8 | Compile overview + lists | |
| 0.9 | Write `corpus/index/Gross-Kemmann - Heidegger and Rhetoric/hr-analysis/phase0-overview.md` | |

### Output Location

`corpus/index/Gross-Kemmann - Heidegger and Rhetoric/hr-analysis/phase0-overview.md`

### Quality Checks

- [ ] Offset confirmed on ≥3 landmarks (1 already done; 2 more in Phase 0)
- [ ] All 7 essays' section structures recorded
- [ ] All 7 essays' note ranges recorded
- [ ] Gross split point chosen with rationale
- [ ] OCR triage complete; any "Low" essays flagged
- [ ] Concept list ≥60 terms with German/Greek/English columns
- [ ] Tension list ≥10 with linked contributor IDs
- [ ] Interlocutor list ≥30 figures with citation counts

### Decision Log — Phase 0

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-10 | Phase 0 reads Gross Introduction in full (not just opening) | Gross frames the entire volume; partial reading would underweight the editorial program |
| 2026-05-10 | Phase 0 reads Bibliography + Subject Index in full | Bibliography seeds Phase 3 cross-pipeline citation reconciliation; Subject Index is a pre-curated trilingual glossary that seeds Phase 3F |
| 2026-05-10 | OCR Confidence triage required | Edited volumes can have uneven scan quality across contributors; ABBYY is reliable but spot-check matters |
| 2026-05-10 | Per-essay section audit required | Section structure varies across contributors (Ch 2 has 4 Roman sections; Ch 6 may have none) |

---

## Phase 1 — Ingestion & Structured Metadata

### Goal

Create per-essay JSON metadata skeletons capturing: contributor info, essay structure (Roman sections + page anchors), note distribution, expected German/Greek terms (seeded from TOC + Subject Index + Phase 0), translation status, and OCR confidence flag. Body text is **not** stored due to copyright constraints (consistent with all prior pipelines); it is read on-the-fly in Phase 2.

### Per-Unit JSON Schema

```jsonc
{
  "volume": "Heidegger and Rhetoric",
  "editors": ["Daniel M. Gross", "Ansgar Kemmann"],
  "publisher": "State University of New York Press",
  "series": "SUNY series in Contemporary Continental Philosophy",
  "year": 2005,

  "unit_id": "HR-04-HYDE",
  "chapter": 4,
  "essay_title": "A Matter of the Heart: Epideictic Rhetoric and Heidegger's Call of Conscience",
  "author": {
    "name": "Michael J. Hyde",
    "affiliation_at_time": "Wake Forest University, Department of Communication",
    "discipline": "communication / rhetoric",
    "translator": null,
    "translation_status": "original_english",
    "prior_relevant_work": [
      "The Call of Conscience: Heidegger and Levinas, Rhetoric and the Euthanasia Debate (2001)",
      "'Heidegger on Rhetoric' (Analecta Husserliana 1983a)"
    ]
  },

  "book_pages": "81–104",
  "pdf_pages": "87–110",
  "body_pages": "81–~100",
  "notes_pages": "~100–104",

  "two_pass": true,
  "dissertation_critical": true,
  "ocr_confidence": "TBD",

  "sections": [
    {
      "section_id": "HR-04-HYDE-s1",
      "heading": "[opening — no heading visible]",
      "book_pages": "81–~85",
      "pdf_pages": "87–~91",
      "tags": ["call_of_conscience", "Aristotle", "Gadamer", "phronesis"]
    }
    // additional sections from Phase 0 audit
  ],

  "german_terms_expected": ["Ruf des Gewissens", "Gewissen", "Sorge", "Befindlichkeit"],
  "greek_terms_expected": ["epideiktikon", "phronēsis", "ethos", "pathos"],

  "primary_loci_expected": {
    "heidegger": ["BT §§54–60", "BT §§39–44 (care)", "BCAP relevant §§"],
    "aristotle": ["Rhet. I (epideictic genus)", "NE VI (phronēsis)"]
  },

  "note": "Full text not stored due to copyright. Read PDF pages on-the-fly for Phase 2 analysis."
}
```

**Schema features specific to this pipeline**:

- `author` block with affiliation, discipline, translator, translation_status, prior_relevant_work — captures the contributor as a *person* (not just a name), which matters for understanding rhetorical positioning in a multi-author volume.
- `translation_status` — one of `original_english`, `translated_from_german`, `translated_from_other`. Affects how German terms are tracked.
- `primary_loci_expected` — pre-populated guesses for Heidegger and Aristotle citations the essay will engage. Phase 2 confirms or expands these.

### Output Files

```
corpus/index/Gross-Kemmann - Heidegger and Rhetoric/hr-structured/
├── manifest.json
├── hr-01-gross-a.json
├── hr-01-gross-b.json
├── hr-02-gadamer.json
├── hr-03-michalski.json
├── hr-04-hyde.json
├── hr-05-struever.json
├── hr-06-kisiel.json
└── hr-07-poggeler.json
```

### Manifest Schema

```jsonc
{
  "volume": "Heidegger and Rhetoric",
  "editors": ["Daniel M. Gross", "Ansgar Kemmann"],
  "year": 2005,
  "publisher": "State University of New York Press",
  "isbn_hardcover": "0-7914-6551-9",
  "isbn_paperback": "0-7914-6552-7",
  "lc_call": "B3279.H49H346 2005",
  "pdf_path": "corpus/rhetorical_ontology/Multiple Authors - Heidegger and Rhetoric_(2005)_[My Copy].pdf",
  "pdf_total_pages": 201,
  "pdf_page_offset": 6,
  "phase1_status": "INCOMPLETE",
  "essays": [
    {
      "file": "hr-01-gross-a.json",
      "unit_id": "HR-01-GROSS-A",
      "chapter": 1,
      "author": "Daniel M. Gross",
      "essay_title": "Introduction: Being-Moved (part A)",
      "book_pages": "1–~22",
      "pdf_pages": "7–~28"
    },
    // ... all 8 units
  ],
  "editorial_apparatus": [
    { "id": "HR-BIB", "label": "Selected Bibliography", "compiler": "Ansgar Kemmann", "pdf_pages": "183–189" },
    { "id": "HR-IX-N", "label": "Index of Names", "pdf_pages": "195–198" },
    { "id": "HR-IX-S", "label": "Index of Subject Matter", "pdf_pages": "199–201" }
  ],
  "contributors": [
    { "name": "Daniel M. Gross", "role": "editor + Ch 1 author", "discipline": "rhetoric" },
    { "name": "Ansgar Kemmann", "role": "editor + Ch 2 interviewer + bibliographer", "discipline": "practical rhetoric" },
    { "name": "Hans-Georg Gadamer", "role": "Ch 2 interviewee (translated)", "discipline": "philosophical hermeneutics" },
    { "name": "Mark Michalski", "role": "Ch 3 author (translated); GA 18 editor", "discipline": "philosophy" },
    { "name": "Michael J. Hyde", "role": "Ch 4 author", "discipline": "communication ethics / rhetoric" },
    { "name": "Nancy S. Struever", "role": "Ch 5 author", "discipline": "intellectual history / rhetoric" },
    { "name": "Theodore Kisiel", "role": "Ch 6 author", "discipline": "philosophy (Heidegger studies)" },
    { "name": "Otto Pöggeler", "role": "Ch 7 author (translated)", "discipline": "philosophy (Heidegger studies)" },
    { "name": "Lawrence Kennedy Schmidt", "role": "Ch 2 translator", "discipline": "philosophy" },
    { "name": "Jamey Findling", "role": "Ch 3 translator", "discipline": "philosophy" },
    { "name": "John Bailiff", "role": "Ch 7 translator", "discipline": "philosophy" }
  ]
}
```

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 1.1 | Create `corpus/index/Gross-Kemmann - Heidegger and Rhetoric/hr-structured/` | |
| 1.2 | For each unit, write JSON skeleton with sections (from Phase 0 audit) + page ranges | |
| 1.3 | Seed `german_terms_expected` and `greek_terms_expected` from TOC + Subject Index | |
| 1.4 | Build `manifest.json` listing all 8 units + 3 editorial-apparatus pointers + 11 contributors | |
| 1.5 | Spot-check: verify section ranges and page spans against PDF | |

### Quality Checks

- [ ] All 8 unit JSONs + manifest written
- [ ] Each unit has author block with affiliation, discipline, translator (if any), translation_status
- [ ] Section structure recorded from Phase 0 audit (no placeholder TBD section_ids)
- [ ] Notes pages recorded per essay
- [ ] German/Greek expected terms seeded from Phase 0 Subject Index work
- [ ] PDF page numbers use verified +6 offset
- [ ] Contributors block in manifest has all 11 people with roles
- [ ] Editorial apparatus pointers in manifest match PDF locations

### Decision Log — Phase 1

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-10 | Metadata-only skeletons (no body text) | Copyright constraint; consistent with Rickert/BCAP/BT/Uexküll precedent |
| 2026-05-10 | `author` block expanded with affiliation/discipline/prior_work | Multi-author volume requires per-essay rhetorical-positioning data |
| 2026-05-10 | `translation_status` field | German technical terms behave differently in translated vs. originally-English essays |
| 2026-05-10 | `primary_loci_expected` field with separate Heidegger / Aristotle keys | Pre-targets the cross-pipeline concordance work in Phase 3 |
| 2026-05-10 | `ocr_confidence` field per unit | Allows Phase 3 to triage which units need spot-check before global deliverables |

---

## Phase 2 — Per-Essay Analysis

### Goal

Reconstruct each contributor's argument as rigorously and charitably as possible, with explicit tracking of (a) the contributor's positions, (b) the Heidegger primary loci cited, (c) the Aristotle primary loci cited, (d) the German/Greek technical terms used, and (e) the contributor's relations to other contributors in the volume.

### System Role (Analysis Agent)

```
You are a specialist in Heidegger studies, Aristotle studies, and the history of
rhetoric, analyzing one essay from the edited volume:

  Daniel M. Gross and Ansgar Kemmann (eds.), Heidegger and Rhetoric (SUNY 2005)

Your task is to reconstruct THIS contributor's argument as rigorously and
charitably as possible. The contributor is producing an interpretation of
Heidegger (and frequently of Aristotle through Heidegger). Track their
interpretive moves, but stay within their argumentative frame — do not
substitute your own reading of Heidegger or Aristotle.

CRITICAL: This is secondary literature. Citations are first-class data.
Capture every Heidegger primary citation (with GA volume + page if given,
BT H-page if given, lecture date if given, or page-only) and every Aristotle
primary citation (with Bekker number where given, work + chapter otherwise).
These citations will be cross-linked to the existing BCAP, BT, and Aristotle
pipelines in Phase 3.

Track German terminology carefully: where the contributor uses a German term
(in italic or not), record it with the English gloss they use AND any
parenthetical alternatives. The same applies to Greek terms (whether in
Greek script or transliterated).

Mark interpretive extrapolations on YOUR part with [INTERP-high] or
[INTERP-low]. The contributor's own interpretive moves are not [INTERP] —
they are this essay's content.
```

### Per-Unit Analysis Template (10 sections)

For each unit (HR-01-GROSS-A through HR-07-POGGELER), produce both a Markdown narrative and a JSON structured artifact.

#### Section 1: Unit Metadata

- `unit_id`, `chapter`, `essay_title`, `author`, `translator` (if any), `translation_status`
- `book_pages`, `pdf_pages`, `body_pages`, `notes_pages`
- `ocr_confidence` flag (High / Medium / Low)
- One-sentence essay thesis (in the contributor's own conceptual register)

#### Section 2: Hierarchical Outline

- Section-by-section walkthrough following the contributor's actual headings
- For each section: 3–6 bullets capturing what the contributor is doing argumentatively
- Note any rhetorical structure (epideictic / apologetic / philological / interview-Q&A / etc.)

#### Section 3: Contributor's Key Concepts

For each major concept the contributor deploys:

| Field | Description |
|-------|-------------|
| `name` | Canonical name (e.g., "call of conscience", "epideictic rhetoric", "rhetoric as dynamis") |
| `german_form` | German term (e.g., *Ruf des Gewissens*) — if applicable |
| `greek_form` | Greek term (e.g., *epideiktikon*, *dynamis*) — if applicable |
| `english_form` | The contributor's chosen English rendering |
| `definition_in_essay` | How THIS contributor uses the concept in this essay (paraphrased) |
| `type` | {ontological, existential, rhetorical, ethical, methodological, hermeneutic, political, philological, other} |
| `centrality_in_essay` | {central, supporting, illustrative} |
| `function` | {setup, critique, positive_proposal, bridge, example} |
| `pages` | Book page anchors |

#### Section 4: Contributor's Main Positions / Claims

| Field | Description |
|-------|-------------|
| `id` | Unit-prefixed ID (e.g., HR-04-HYDE-P1, HR-04-HYDE-P2) |
| `claim` | Concise statement in the contributor's own terms |
| `premises` | Key premises → conclusion |
| `targets` | Doctrines/positions the contributor is critiquing or refining |
| `status` | {core_essay_thesis, supporting_argument, methodological, illustrative} |
| `evidence_type` | {primary_text_citation, scholarly_argument, biographical_anecdote, hermeneutic_appeal, philological_argument} |
| `pages` | Book page anchors |

#### Section 5: Interlocutors & Traditions

For each major figure the contributor engages:

- **Name** (e.g., Aristotle, Plato, Husserl, Gadamer, Arendt, Ricoeur, Cicero)
- **Role**: What problem they frame, what concept the contributor takes from them, where the contributor critiques them
- **Citations**: Specific texts/passages the contributor cites
- **Relationship to contributor's argument**: borrowed / refined / critiqued / contrasted

This is the standard interlocutor section. The next two sections capture the cross-pipeline-distinctive data.

#### Section 6: Heidegger Primary Loci Cited (FIRST-CLASS DATA)

Every Heidegger primary citation in the essay, captured with full bibliographic detail:

```json
[
  {
    "locus_id": "HR-04-HYDE-HL1",
    "heidegger_text": "Being and Time",
    "edition_cited": "Macquarrie/Robinson trans.",
    "h_page": "289",
    "english_page": null,
    "ga_volume": null,
    "section_or_para": "§55",
    "context_in_essay": "Hyde quotes the call of conscience as 'silent' and 'discrete'",
    "contributor_use": "central — anchors the entire epideictic-conscience argument",
    "essay_pages": "p. 88, p. 92, p. 95",
    "bridge_to_pipeline": "BT pipeline unit BT-D2-U2 (§§54–60)"
  },
  {
    "locus_id": "HR-04-HYDE-HL2",
    "heidegger_text": "Basic Concepts of Aristotelian Philosophy",
    "edition_cited": "GA 18",
    "ga_volume": "GA 18",
    "ga_page": "117",
    "section_or_para": null,
    "context_in_essay": "Hyde notes Heidegger's gloss on Aristotelian rhetoric",
    "contributor_use": "supporting — secondary anchor",
    "essay_pages": "p. 89",
    "bridge_to_pipeline": "BCAP pipeline unit U-FP3a (§§13–14)"
  }
]
```

**Required fields**: `locus_id`, `heidegger_text`, `essay_pages`, `bridge_to_pipeline`. Other fields filled where the contributor provides them.

**Bridge format** (controlled): `BCAP pipeline unit X-XX`, `BT pipeline unit BT-X-X`, `Aristotle pipeline unit XXXX-XX`, or `no existing pipeline unit (locus is from text not yet indexed)`.

#### Section 7: Aristotle Primary Loci Cited (FIRST-CLASS DATA)

Every Aristotle primary citation in the essay, captured with Bekker number where the contributor provides one:

```json
[
  {
    "locus_id": "HR-04-HYDE-AL1",
    "aristotle_text": "Rhetoric",
    "book": "I",
    "chapter": "3",
    "bekker_range": "1358b1–1359a5",
    "context_in_essay": "Hyde uses the epideictic/deliberative/judicial typology",
    "contributor_use": "central — defines the genus that frames the essay",
    "essay_pages": "p. 82, p. 85",
    "bridge_to_pipeline": "Aristotle pipeline unit RHET-01"
  }
]
```

**Required fields**: `locus_id`, `aristotle_text`, `essay_pages`, `bridge_to_pipeline`.

**Bridge format** for Aristotle: maps to one of the 34 Aristotle units (META-01 through AUD-01). If the locus has a Bekker number, also feeds the Aristotle Bekker index.

#### Section 8: Tensions & Open Questions

- Internal tensions within the essay
- Tensions between this contributor and other contributors in the volume (cross-essay tensions are flagged here for Phase 3 consolidation)
- Each tension linked to position/concept IDs
- Mark `[INTERP-high]` for speculative readings on the analyst's part; the contributor's own framings are not [INTERP]

#### Section 9: German + Greek Terms Encountered

A merged terms table. The volume mixes German and Greek freely (often in the same paragraph), so a single table with a `language` field is more useful than separate German/Greek sections.

```json
[
  {
    "term": "Ruf des Gewissens",
    "language": "German",
    "english_in_essay": "call of conscience",
    "alternative_renderings_noted_by_contributor": [],
    "essay_pages": ["82", "88", "95"],
    "translation_contested_in_essay": false,
    "notes": "Hyde uses M/R rendering throughout; does not flag as contested"
  },
  {
    "term": "epideiktikon",
    "language": "Greek (transliterated)",
    "english_in_essay": "epideictic",
    "alternative_renderings_noted_by_contributor": ["display rhetoric"],
    "essay_pages": ["82", "85", "94"],
    "translation_contested_in_essay": false,
    "notes": "Hyde uses standard rhetorical-tradition rendering"
  }
]
```

`translation_contested_in_essay` defaults to `false`. Set to `true` only when the contributor explicitly flags translation as contested in this essay (e.g., Gadamer Ch 2 discussing *dynamis* vs. *technē*; Pöggeler Ch 7 if he flags any term).

This feeds Phase 3F (volume terminology appendix).

#### Section 10: Local Graph Edges

Standard 11-relation controlled vocabulary, with the expanded edge-domain set.

```json
[
  {
    "source": "CONCEPT:Call of Conscience",
    "target": "CONCEPT:Epideictic Rhetoric",
    "relation": "is_meaning_of",
    "edge_domain": "rhetorical",
    "note": "Hyde argues that the call of conscience IS the ontological-rhetorical equivalent of epideictic — silent display that calls Dasein to itself",
    "contributor": "HR-04-HYDE",
    "essay_pages": ["88", "92"]
  },
  {
    "source": "POSITION:HR-04-HYDE-P3",
    "target": "POSITION:HR-01-GROSS-B-P5",
    "relation": "supports",
    "edge_domain": "rhetorical",
    "note": "Hyde's epideictic-conscience argument supports Gross's broader pathos-as-substrate thesis (Gross frames; Hyde specifies)",
    "contributor": "HR-04-HYDE",
    "essay_pages": ["86", "100"]
  },
  {
    "source": "HEIDEGGER-LOCUS:BT.H289",
    "target": "ARISTOTLE-LOCUS:Rhet.1358b1",
    "relation": "operationalizes",
    "edge_domain": "rhetorical",
    "note": "Hyde reads BT §55 as operationalizing Aristotle's epideictic genus in the existential register",
    "contributor": "HR-04-HYDE",
    "essay_pages": ["88"]
  }
]
```

**Edge schema additions for this pipeline**:
- `contributor` field: identifies which essay produced the edge (essential for inter-contributor disagreement mapping in Phase 3)
- `essay_pages` field: page anchors within the contributor's essay

**Edge sources/targets** can be:
- `CONCEPT:<name>` (standard)
- `POSITION:<unit-prefixed-id>` (cross-essay positions)
- `HEIDEGGER-LOCUS:<text>.<page>` or `HEIDEGGER-LOCUS:GA<n>.<page>`
- `ARISTOTLE-LOCUS:<text>.<bekker>`
- `INTERLOCUTOR:<name>` (e.g., for cited figures the contributor builds an argument around)

Self-loops on concepts allowed with relations `{shifts, refines, complexifies}` and a non-trivial note.

### Output Locations

```
corpus/index/Gross-Kemmann - Heidegger and Rhetoric/hr-analysis/
├── phase0-overview.md
├── phase2-hr-01-gross-a.md  + phase2-hr-01-gross-a.json
├── phase2-hr-01-gross-b.md  + phase2-hr-01-gross-b.json
├── phase2-hr-02-gadamer.md  + phase2-hr-02-gadamer.json
├── phase2-hr-03-michalski.md + phase2-hr-03-michalski.json
├── phase2-hr-04-hyde.md     + phase2-hr-04-hyde.json
├── phase2-hr-05-struever.md + phase2-hr-05-struever.json
├── phase2-hr-06-kisiel.md   + phase2-hr-06-kisiel.json
└── phase2-hr-07-poggeler.md + phase2-hr-07-poggeler.json
```

### Execution Method

**Mandatory two-pass JSON-first** for all 8 units. (No light tier in this pipeline.)

- **Pass 1**: Outline + key concepts + Heidegger loci + Aristotle loci + German/Greek terms (JSON-structured). No narrative prose.
- **Pass 2**: Positions + tensions + edges + narrative Markdown, using Pass 1 JSON as structured context.

**Three-pass exception** for HR-06-KISIEL (30 body pp.):
- Pass 1a: Outline + key concepts + terms
- Pass 1b: Heidegger loci + Aristotle loci + positions
- Pass 2: Tensions + edges + narrative

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 2.1 | Create `corpus/index/Gross-Kemmann - Heidegger and Rhetoric/hr-analysis/` | |
| 2.2–2.9 | Analyze all 8 units (parallel where context allows) | |
| 2.10 | Cross-check: verify all Phase 0 target concepts appear in at least one unit | |
| 2.11 | Compile master concept table (concept → contributors who deploy it) | |
| 2.12 | Compile master interlocutor table (interlocutor → contributors who engage them) | |
| 2.13 | Compile master Heidegger-loci table (locus → contributors who cite it) | |
| 2.14 | Compile master Aristotle-loci table (locus → contributors who cite it) | |

### Parallelization

Up to 8 background agents. Most essays are 16–30 PDF pages and well within context limits. Gross's 46-page Introduction is split into A/B sub-units precisely so each fits a comfortable context window.

### Quality Checks per Unit

- [ ] All 10 template sections present
- [ ] Section 6 (Heidegger Loci) has at least 4 entries with `bridge_to_pipeline` filled
- [ ] Section 7 (Aristotle Loci) has at least 2 entries with `bridge_to_pipeline` filled
- [ ] Section 9 (German + Greek terms) has at least 8 entries
- [ ] Section 10 (Edges) has at least 12 edges, including at least 1 cross-contributor POSITION edge and at least 1 LOCUS-to-LOCUS edge
- [ ] Position IDs unique and unit-prefixed
- [ ] Concept definitions reflect the contributor's own usage (not generic glosses)
- [ ] [INTERP-high/low] markers used only for the analyst's interpretive moves, not the contributor's
- [ ] OCR confidence flag carried through from Phase 1
- [ ] No unit imports the analyst's own framework

### Decision Log — Phase 2

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-10 | All units mandatory two-pass | Every essay is dissertation-critical and dense with citations; single-pass risks incomplete locus capture |
| 2026-05-10 | Heidegger Loci as a dedicated first-class section (not part of citations footnote) | Enables direct cross-link to BCAP and BT pipelines as a structured table |
| 2026-05-10 | Aristotle Loci as a dedicated first-class section | Enables direct cross-link to Aristotle pipeline's Bekker index |
| 2026-05-10 | Merged German+Greek terms section (single table with `language` field) | Volume mixes both freely; separate sections fragment the data |
| 2026-05-10 | Edges include `contributor` + `essay_pages` fields | Required to support inter-contributor disagreement mapping in Phase 3 |
| 2026-05-10 | Edges support `HEIDEGGER-LOCUS:` and `ARISTOTLE-LOCUS:` source/target prefixes | Captures locus-to-locus relations the contributors construct (e.g., "BT §55 operationalizes Rhetoric I.3") |
| 2026-05-10 | Three-pass exception for HR-06-KISIEL (30 pp.) | Largest single-essay unit; politically dense; warrants extra capture pass |
| 2026-05-10 | Contributor's own interpretive moves NOT marked [INTERP] | The contributor IS the interpreter; their reading is the data, not noise |

---

## Phase 3 — Volume-Level Synthesis & Cross-Pipeline Concordance

This is the most distinctive phase in this pipeline, because the volume's value to the dissertation lies in (a) the inter-contributor disagreement map, (b) the cross-pipeline citation concordance, and (c) the volume terminology appendix. The standard book-level-ontology deliverables are still produced but augmented.

### Goal

Synthesize unit analyses into a volume-level intellectual map AND produce a cross-pipeline concordance that makes every Heidegger and Aristotle citation in the volume directly clickable to the corresponding BCAP, BT, or Aristotle pipeline unit.

### Deliverables

#### 3A: Canonical Concept Nodes

Standard merge across the 8 unit analyses:

| Field | Description |
|-------|-------------|
| `canonical_name` | e.g., "Call of Conscience" |
| `german_lemma` | e.g., *Ruf des Gewissens* |
| `greek_lemma` | e.g., *epideiktikon* |
| `english_form` | The volume's most-used English form |
| `definition_in_volume` | 2–3 sentence definition synthesizing the contributors' uses |
| `contributors` | List of contributors who deploy this concept (e.g., ["HR-04-HYDE", "HR-01-GROSS-A"]) |
| `centrality_in_volume` | {core, important, peripheral} based on contributor spread |
| `aliases` | Alternative terms used across contributors |
| `cross_pipeline_links` | Pointers to BCAP/BT/Aristotle/Rickert canonical nodes for the same concept |

Expected core nodes (~12): rhetoric, *pathos*, *logos*, *Mitsein*, *Sorge*, *Befindlichkeit*, *Alltäglichkeit*, *phronēsis*, *kairos*, *dynamis*, call of conscience, fundamental ontology

Expected important nodes (~15): epideictic, *zōon politikon*, *koinōnia*, *Stimmung*, *Augenblick*, *Verfallen*, *zōon logon echon*, hermeneutics of facticity, *phusis*/*technē*, protopolitics, philology, *Sprachlichkeit*, *Destruktion*, contingency/trope, attunement-as-mood

Expected peripheral nodes (~10): *Gelassenheit*, *Lage*, *Gewissheit*, *endoxa*, *enthymēma*, *pistis*, Ramism (in Gross's bibliography), Augustine (theology), Reformation theology, electronic poetics

#### 3B: Volume Edge Graph

Merged + de-duplicated across all 8 units. Edges retain the `contributor` field so the same edge from multiple contributors appears as a single de-duplicated entry with a contributor-list.

```csv
source,relation,edge_domain,target,note,contributors,unit_pages
CONCEPT:Pathos,is_meaning_of,ontological,CONCEPT:Stimmung,"Gross frames pathos as the ontological substrate translated as Stimmung in BT","HR-01-GROSS-A;HR-04-HYDE","p.4;p.85"
CONCEPT:Rhetoric,operationalizes,ontological,CONCEPT:Mitsein,"Volume-wide claim that rhetoric is the explicit form of being-with","HR-01-GROSS-A;HR-05-STRUEVER;HR-06-KISIEL","p.2;p.106;p.131"
CONCEPT:Rhetoric,refines,rhetorical,CONCEPT:Dynamis,"Gadamer/Heidegger reading: rhetoric is dynamis, not technē","HR-02-GADAMER","p.49"
```

**Target**: 80–150 de-duplicated volume-level edges.

#### 3C: Inter-Contributor Disagreement Map (NOVEL DELIVERABLE)

A dedicated artifact that maps where contributors disagree. Format:

```json
{
  "disagreements": [
    {
      "id": "DG1",
      "topic": "Centrality of rhetoric to Heidegger's mature thought",
      "position_a": {
        "contributors": ["HR-01-GROSS-A", "HR-01-GROSS-B"],
        "claim": "Heidegger relocates rhetoric at the heart of his fundamental ontology; SS 1924 is genetically primary for BT",
        "key_evidence": ["Intro p.4", "Intro p.2 (Kisiel-cited)"]
      },
      "position_b": {
        "contributors": ["HR-07-POGGELER"],
        "claim": "Heidegger's conception of rhetoric is fundamentally restricted; rhetoric does not govern the later 'topology of being'",
        "key_evidence": ["Ch 7 throughout"]
      },
      "synthesis": "The volume frames the disagreement openly: Gross opens claiming centrality, Pöggeler closes claiming restriction. Hyde and Struever align with Gross on the SS 1924 → BT continuity; Kisiel's protopolitical reading is compatible with both. The disagreement is generative — each side exposes what the other underplays.",
      "dissertation_relevance": "If the dissertation argues for a sustained Aristotelian-rhetorical strand in Heidegger, Pöggeler's restriction must be addressed; the volume itself stages the engagement."
    }
  ]
}
```

**Target**: 5–8 explicit disagreements with full structure.

#### 3D: Cross-Pipeline Citation Concordance (NOVEL DELIVERABLE)

For each Heidegger primary locus cited in the volume, a structured concordance entry:

```json
{
  "heidegger_locus_id": "HL-VOL-001",
  "heidegger_text": "Being and Time",
  "citation": "§55 (H.289)",
  "bridge_pipeline_unit": "BT pipeline → BT-D2-U2 (§§54–60)",
  "bridge_pipeline_path": "corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d2-u2.md",
  "cited_by_contributors": [
    {"unit": "HR-04-HYDE", "essay_page": "88", "context": "anchors the entire epideictic-conscience argument"},
    {"unit": "HR-01-GROSS-B", "essay_page": "31", "context": "supports pathos-genealogy claim"}
  ],
  "concordance_role": "Multi-cited — flagged for high-priority dissertation cross-reference"
}
```

Same for Aristotle loci, with the bridge pointing to the appropriate Aristotle pipeline unit + the Bekker index.

**Target**:
- ≥40 distinct Heidegger primary loci catalogued (BT, BCAP/GA 18, GA 19, GA 20, GA 22, *Ontologie*, *Wahrsein und Dasein*, *Letter on Humanism*, etc.)
- ≥30 distinct Aristotle primary loci catalogued (Rhetoric, NE, Politics, De Anima, Physics, Metaphysics)

**Output files**:
- `hr-heidegger-loci-concordance.md` (human-readable)
- `hr-heidegger-loci-concordance.json` (structured)
- `hr-aristotle-loci-concordance.md`
- `hr-aristotle-loci-concordance.json`

#### 3E: Volume Trajectory Narrative

2–3 paragraphs covering:

1. **The Gross framing (Intro)**: Heidegger relocates rhetoric at the heart of his fundamental ontology; pathos is constitutive of social life; the volume tracks the rhetorical genealogy of BT's key terms.
2. **The middle constellation (Chs 2–6)**: Gadamer's first-person testimony (rhetoric as *dynamis*); Michalski's philological framing; Hyde's epideictic-conscience bridge; Struever's *Alltäglichkeit*-as-timefulness; Kisiel's protopolitical reading. Each amplifies a different rhetorical register.
3. **The Pöggeler closing (Ch 7)**: The negative case — Heidegger's later "topology of being" leaves rhetoric behind. The volume thus closes by problematizing its own opening claim, making the volume itself a productive tension.

#### 3F: Volume Terminology Appendix

Aggregating Section 9 of all 8 units, augmented by the editor-curated Subject Index (which already provides German/Greek glosses for ~80 entries).

**Per-lemma entry structure**:

```json
{
  "lemma": "Befindlichkeit",
  "language": "German",
  "primary_english_in_volume": "attunement / state-of-mind",
  "alternative_renderings": ["mood-character", "findingness", "disposedness"],
  "in_subject_index": true,
  "subject_index_pages": ["27", "37", "59", "75", "109", "169"],
  "aristotelian_correlate": "pathos (sense in which it grounds logos)",
  "definition_in_volume": "...",
  "key_contributors": ["HR-01-GROSS-A", "HR-01-GROSS-B", "HR-02-GADAMER", "HR-04-HYDE"],
  "translation_contested_in_volume": false,
  "cross_pipeline_links": {
    "bt_pipeline": "bt-german-appendix.md → Befindlichkeit",
    "bcap_pipeline": "bcap-greek-appendix.md → pathos correlate"
  },
  "notes": "Subject Index links Befindlichkeit to both German term and Greek pathos, mirroring Gross's framing"
}
```

**Output files**:
- `hr-terminology-appendix.md`
- `hr-terminology-appendix.json`

**Expected size**: 100–150 lemmas (60–80 German + 50–70 Greek/Latin). Smaller than BT's 300 because the volume is shorter and recycles terminology, but larger than BCAP's 65 because of the multilingual Subject Index seed.

#### 3G: Concept × Contributor Matrix

CSV with rows = canonical concepts, columns = the 8 unit IDs, plus aggregate columns.

```csv
concept,HR-01A,HR-01B,HR-02,HR-03,HR-04,HR-05,HR-06,HR-07,unit_count,centrality
pathos,3,2,1,0,3,2,1,1,7,core
rhetoric_as_dynamis,1,0,3,0,0,0,0,1,3,important
call_of_conscience,1,1,0,0,3,0,0,0,3,important
Alltaglichkeit,1,1,0,1,0,3,1,0,5,important
phronēsis,0,0,2,0,2,1,1,0,4,important
```

(Cells: 0 = absent, 1 = mentioned, 2 = supporting, 3 = central.)

#### 3H: Bibliography Concordance (NOVEL DELIVERABLE)

Kemmann's Selected Bibliography (book pp. 177–183) is itself a research artifact. Phase 3 extracts it into structured form:

```json
{
  "bibliography_sections": {
    "abbreviations": ["GA: Gesamtausgabe", "SS: Summer Semester", "WS: Winter Semester"],
    "rhetoric_in_heidegger_loci": [
      {
        "source": "Lecture manuscript 1923/24",
        "title": "Wahrsein und Dasein nach Aristoteles",
        "publication_status": "unpublished",
        "ga_volume": null,
        "rhetoric_passages": ["Logos as die ursprüngliche Logik (3), following Aristotle's Rhetoric 1.2-3"]
      },
      {
        "source": "Lecture Course SS 1924",
        "title": "Grundbegriffe der aristotelischen Philosophie",
        "ga_volume": "GA 18",
        "rhetoric_passages": [
          "Die Auslegung des Daseins... (103-267)",
          "Die Rhetorik ist nichts anderes als die Auslegung des konkreten Daseins, die Hermeneutik des Daseins selbst (110)",
          "..."
        ]
      },
      // ... all 8 places where rhetoric is defined in Heidegger
    ],
    "heidegger_around_ss_1924": [...],
    "secondary_literature": [...]
  },
  "cross_pipeline_links": {
    "bcap_pipeline": "All 8 GA 18 rhetoric passages cross-link to BCAP units",
    "bt_pipeline": "Sein und Zeit GA 2 entry cross-links to BT-D1-U5 (§29 Befindlichkeit, §30 Furcht)"
  }
}
```

**Output files**:
- `hr-bibliography-extracted.md`
- `hr-bibliography-extracted.json`

#### 3I: Mermaid Graphs (5 target)

1. **`hr-graph-global.mmd`** — Volume-level concept graph, ~25–30 core/important nodes
2. **`hr-graph-essay-network.mmd`** — Inter-contributor agreement/disagreement graph (8 nodes = 8 essay-units, edges = supports/contrasts/extends)
3. **`hr-graph-pathos-cluster.mmd`** — Pathos and its German/Greek correlates across the volume (the volume's most-cited concept)
4. **`hr-graph-rhetoric-genealogy.mmd`** — How rhetoric is figured across the volume: as *dynamis* (Gadamer), as fundamental ontology heart (Gross), as restricted/abandoned (Pöggeler), etc.
5. **`hr-graph-cross-pipeline-bridge.mmd`** — Volume concepts ↔ BCAP, BT, Aristotle, Rickert canonical nodes (max 25 edges, prioritizing structural diversity)

#### 3J: Interlocutor Map

Aggregated from Section 5 of all 8 units. Two-tier structure:

- **Tier A (cited by ≥3 contributors)**: Gadamer, Aristotle, Plato, Heidegger himself (recursive!), Husserl, Arendt, Cicero, Quintilian, Kant, Bultmann, Foucault, Ricoeur, Habermas, Burke
- **Tier B (cited by 2 contributors)**: Vico, Curtius, Auerbach, Hartmann, Natorp, Scheler, Hegel, Nietzsche, Dilthey, Schleiermacher

Per interlocutor:
- contributors who engage them
- specific texts/passages cited
- role across the volume (framing source / target of critique / bridge figure)

**Output files**:
- `hr-interlocutor-map.md`
- `hr-interlocutor-map.json`

#### 3K: Productive Tensions Catalog

Standard tension layer from prior pipelines, augmented with the inter-contributor disagreements from 3C.

```json
[
  {
    "id": "VT1",
    "type": "inter-contributor",
    "node_a": "POSITION:HR-01-GROSS-A-P1 (rhetoric central)",
    "node_b": "POSITION:HR-07-POGGELER-P1 (rhetoric restricted)",
    "dependency_edge": {"relation": "shares_evidence", "note": "both contributors cite SS 1924 GA 18"},
    "conflict_edge": {"relation": "contrasts_with", "note": "opposite conclusions about rhetoric's enduring role"},
    "synthesis": "...",
    "contributors": ["HR-01-GROSS-A", "HR-01-GROSS-B", "HR-07-POGGELER"]
  }
]
```

**Target**: 8–12 tensions, mixing within-contributor and inter-contributor.

### Output Locations

```
corpus/index/Gross-Kemmann - Heidegger and Rhetoric/hr-analysis/
├── (Phase 0 + Phase 2 outputs above)
├── book-level-ontology.md           (3A + 3E + 3J + 3K)
├── book-level-ontology.json
├── global-edges.csv                  (3B; with contributor field)
├── tension-edges.json                (3K)
├── inter-contributor-disagreements.json  (3C — NOVEL)
├── inter-contributor-disagreements.md
├── concept-matrix.csv                (3G)
├── hr-heidegger-loci-concordance.md  (3D — NOVEL)
├── hr-heidegger-loci-concordance.json
├── hr-aristotle-loci-concordance.md  (3D — NOVEL)
├── hr-aristotle-loci-concordance.json
├── hr-terminology-appendix.md        (3F)
├── hr-terminology-appendix.json
├── hr-bibliography-extracted.md      (3H — NOVEL)
├── hr-bibliography-extracted.json
├── hr-interlocutor-map.md            (3J)
├── hr-interlocutor-map.json
├── hr-graph-global.mmd               (3I)
├── hr-graph-essay-network.mmd
├── hr-graph-pathos-cluster.mmd
├── hr-graph-rhetoric-genealogy.mmd
└── hr-graph-cross-pipeline-bridge.mmd
```

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 3.1 | Collect all 8 unit JSONs | |
| 3.2 | Aggregate all Heidegger loci → consolidate, dedupe, generate cross-pipeline bridges | |
| 3.3 | Aggregate all Aristotle loci → consolidate, dedupe, generate cross-pipeline bridges | |
| 3.4 | Aggregate German+Greek terms → merge with Subject Index seed → produce terminology appendix | |
| 3.5 | Merge concepts → canonical node list with centrality + cross-pipeline links | |
| 3.6 | Merge edges → de-duplicate with contributor lists → global edge list | |
| 3.7 | Build inter-contributor disagreement map | |
| 3.8 | Run tension detector + populate tension catalog | |
| 3.9 | Build interlocutor map | |
| 3.10 | Extract structured bibliography from PDF pp. 183–189 | |
| 3.11 | Build concept × contributor matrix | |
| 3.12 | Generate Mermaid graphs | |
| 3.13 | Write volume trajectory narrative | |
| 3.14 | Validate cross-pipeline bridges (sample 10 — confirm target pipeline units exist and contain relevant content) | |
| 3.15 | OCR triage check: spot-check any Phase 1 "Low" units before their data feeds globals | |

### Quality Checks

- [ ] ≥25 canonical nodes (~12 core + ~15 important)
- [ ] ≥80 de-duplicated volume edges
- [ ] ≥5 inter-contributor disagreements with full structure
- [ ] ≥40 Heidegger loci catalogued; ≥30 Aristotle loci catalogued
- [ ] Every locus has `bridge_to_pipeline` filled (or explicitly null with reason)
- [ ] ≥10 cross-pipeline bridges sampled and verified against actual BCAP/BT/Aristotle pipeline files
- [ ] ≥100 terminology lemmas (German + Greek combined)
- [ ] Bibliography fully extracted into structured form
- [ ] Interlocutor map covers Tier A (≥10 figures) + Tier B
- [ ] 5 Mermaid graphs render without errors
- [ ] Volume trajectory narrative covers all 8 essay-units
- [ ] No analyst-framework imports

### Decision Log — Phase 3

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-10 | Inter-contributor disagreement map as a dedicated 3C deliverable | Novel to multi-author volumes; the volume's value to the dissertation is largely the staged disagreement |
| 2026-05-10 | Cross-pipeline citation concordance as 3D | Captures the volume's role as a secondary-literature concordance for the existing primary-text pipelines |
| 2026-05-10 | Bibliography extraction as 3H | Kemmann's bibliography is a curated research artifact; structuring it preserves and extends its utility |
| 2026-05-10 | Subject Index used as terminology-appendix seed | Pre-curated trilingual glossary; shortcuts Phase 3F work |
| 2026-05-10 | Volume terminology lemmas track `cross_pipeline_links` | Same lemma in BT, BCAP, and HR appendices links across — preserves cross-pipeline coherence |
| 2026-05-10 | Edges retain `contributor` field through dedupe | A claim made by 3 contributors has different evidential weight than one made by 1 |
| 2026-05-10 | Mermaid `essay-network` graph (3I-2) added | Visualizes the volume as a network of intellectual positions, distinct from concept graph |
| 2026-05-10 | Tension catalog mixes within-contributor + inter-contributor tensions | Both kinds matter for dissertation chapter structuring |

---

## Phase 4 — Cross-Pipeline Integration (PARKED)

### Status: DO NOT EXECUTE until the user provides their dissertation framework.

### Future Trigger

Phase 4 activates when the user provides:
1. The HR (Heidegger and Rhetoric) volume ontology + concordances + appendix from Phases 2–3
2. A structured description of the user's dissertation framework
3. Anchors to existing BCAP, BT, Aristotle, and Rickert pipeline outputs

### What Phase 4 Will Produce

Because this volume is *itself* secondary literature about the BCAP and BT primary texts, Phase 4 here is differently structured than for the prior pipelines. Specifically:

1. **Promotion of cross-pipeline edges from candidate to confirmed**: The Phase 3D concordances are already textually grounded (the contributors did the textual work). Phase 4 elevates these from "concordance pointer" to "confirmed bridge edge in the existing pipeline graphs." This means writing back into the BCAP, BT, and Aristotle pipelines:
   - Each BCAP unit gets a "Heidegger-and-Rhetoric secondary engagement" subsection
   - Each BT unit gets the same
   - Each Aristotle Bekker locus cited in HR gets a "secondary scholarship: Heidegger and Rhetoric" entry

2. **Dissertation mapping**: For each contributor's central position, identify which dissertation chapter / section / argument the position supports, refines, or contests. Tag with INFORMS / DISTORTS / EXTENDS / REORIENTS.

3. **Strategic deployment plan**: For each of the user's dissertation arguments that this volume addresses, determine which contributor(s) to cite and how. (Pöggeler as critical foil for the rhetoric-as-central thesis? Hyde as primary support for an epideictic-conscience reading? etc.)

4. **Verifiable corpus enrichment**: Update the BCAP, BT, and Aristotle pipelines' cross-pipeline-hooks files to include Heidegger and Rhetoric volume references where appropriate.

### Output Location (future)

```
corpus/index/Gross-Kemmann - Heidegger and Rhetoric/hr-analysis/
├── integration-map.md
├── integration-map.json
├── dissertation-deployment-plan.md
└── pipeline-back-edits.md  (catalog of edits made to BCAP/BT/Aristotle pipelines)
```

### Decision Log — Phase 4

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-10 | Phase 4 parked as template | User explicitly defers integration until framework ready (consistent with all prior pipelines) |
| 2026-05-10 | Phase 4 includes "back-edits" to existing pipelines | Unique to secondary-literature pipelines: confirmed bridges should propagate to the primary-text pipelines they enrich |

---

## Appendix A: Global Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-10 | Plan created (5 phases: 0–4) | Mirrors proven prior-pipeline structure with multi-author / secondary-literature adaptations |
| 2026-05-10 | 8 units (7 essays, with Gross split into A/B) | Essays are natural units; Gross's 46 pp. exceeds the 15–25 target |
| 2026-05-10 | All units mandatory two-pass | All essays are dissertation-critical; no light tier in this pipeline |
| 2026-05-10 | New edge domains: `hermeneutic`, `political`, `philological` | Volume's contributors operate in these registers; existing domains insufficient |
| 2026-05-10 | New object types: HEIDEGGER-LOCUS, ARISTOTLE-LOCUS | Treats primary citations as first-class graph entities, enabling cross-pipeline edge tracking |
| 2026-05-10 | Edges carry `contributor` + `essay_pages` fields | Required for inter-contributor disagreement mapping |
| 2026-05-10 | Unit IDs use HR-NN-AUTHOR format | Author surname is more semantically meaningful than chapter number alone |
| 2026-05-10 | Folder name `Gross-Kemmann - Heidegger and Rhetoric` | Matches editor-name convention; ASCII-safe; disambiguates from broader topic |
| 2026-05-10 | Subfolder structure `hr-analysis/` + `hr-structured/` | Matches BCAP/BT/Rickert/Uexküll convention |
| 2026-05-10 | Volume's Subject Index used as Phase 3F seed | Editor-curated trilingual glossary saves substantial Phase 3 work |
| 2026-05-10 | Bibliography extracted as Phase 3H deliverable | Kemmann's bibliography is itself a curated research artifact |
| 2026-05-10 | Cross-pipeline citation concordance (3D) is a first-class deliverable | Volume's primary value to the dissertation is its citation density into the existing primary-text pipelines |
| 2026-05-10 | Inter-contributor disagreement map (3C) is a first-class deliverable | The volume's value lies precisely in the staged disagreements |
| 2026-05-10 | Phase 4 parked; will include back-edits to BCAP/BT/Aristotle pipelines | Secondary-literature pipelines should propagate confirmed bridges into the primary-text pipelines they enrich |

---

## Appendix B: Resource Estimates

| Phase | Units of Work | Approx Context per Unit | Notes |
|-------|--------------|------------------------|-------|
| Phase 0 | 1 deliverable | ~80 PDF pages (Gross intro + chapter starts + bibliography + subject index) | Read-heavy; single agent |
| Phase 1 | 8 unit JSONs + manifest | TOC + Subject Index data only | Fast; mostly metadata |
| Phase 2 | 8 essays × 2–3 passes | 16–46 PDF pages per essay (Gross sub-units 22–24 pp; Kisiel 30 pp; others 14–26 pp) | Up to 8 parallel agents; +1 extra pass for HR-06-KISIEL |
| Phase 3 | ~17 deliverables | All 8 unit JSONs + 3 editorial-apparatus inputs | 4–5 parallel synthesis agents (concepts/edges; tensions/disagreements; concordances; terminology; bibliography) |
| Phase 4 | Deferred | Requires user dissertation framework + cross-pipeline back-edits | PARKED |

**Total estimated**: 8 primary analysis units (vs. 17 for B&T, 13 for BCAP, 14 for Uexküll, 10 for Rickert, 34 for Aristotle). Smaller unit count, but per-unit extraction is denser (Heidegger loci + Aristotle loci as required first-class data).

---

## Appendix C: File Tree (planned)

```
corpus/index/Gross-Kemmann - Heidegger and Rhetoric/
├── hr-structured/                                     # Phase 1 output
│   ├── manifest.json
│   ├── hr-01-gross-a.json
│   ├── hr-01-gross-b.json
│   ├── hr-02-gadamer.json
│   ├── hr-03-michalski.json
│   ├── hr-04-hyde.json
│   ├── hr-05-struever.json
│   ├── hr-06-kisiel.json
│   └── hr-07-poggeler.json
│
├── hr-analysis/                                       # Phase 0 + 2 + 3 outputs
│   ├── phase0-overview.md
│   │
│   ├── phase2-hr-01-gross-a.md / .json                # Phase 2: 8 unit analyses
│   ├── phase2-hr-01-gross-b.md / .json
│   ├── phase2-hr-02-gadamer.md / .json
│   ├── phase2-hr-03-michalski.md / .json
│   ├── phase2-hr-04-hyde.md / .json
│   ├── phase2-hr-05-struever.md / .json
│   ├── phase2-hr-06-kisiel.md / .json
│   ├── phase2-hr-07-poggeler.md / .json
│   │
│   ├── book-level-ontology.md                         # Phase 3A + 3E + 3J + 3K
│   ├── book-level-ontology.json
│   ├── global-edges.csv                               # Phase 3B
│   ├── tension-edges.json                             # Phase 3K
│   ├── concept-matrix.csv                             # Phase 3G
│   │
│   ├── inter-contributor-disagreements.md             # Phase 3C — NOVEL
│   ├── inter-contributor-disagreements.json
│   │
│   ├── hr-heidegger-loci-concordance.md               # Phase 3D — NOVEL
│   ├── hr-heidegger-loci-concordance.json
│   ├── hr-aristotle-loci-concordance.md               # Phase 3D — NOVEL
│   ├── hr-aristotle-loci-concordance.json
│   │
│   ├── hr-terminology-appendix.md                     # Phase 3F
│   ├── hr-terminology-appendix.json
│   │
│   ├── hr-bibliography-extracted.md                   # Phase 3H — NOVEL
│   ├── hr-bibliography-extracted.json
│   │
│   ├── hr-interlocutor-map.md                         # Phase 3J
│   ├── hr-interlocutor-map.json
│   │
│   ├── hr-graph-global.mmd                            # Phase 3I
│   ├── hr-graph-essay-network.mmd
│   ├── hr-graph-pathos-cluster.mmd
│   ├── hr-graph-rhetoric-genealogy.mmd
│   ├── hr-graph-cross-pipeline-bridge.mmd
│   │
│   ├── integration-map.md                             # Phase 4 (future)
│   ├── integration-map.json
│   ├── dissertation-deployment-plan.md
│   └── pipeline-back-edits.md
```

---

## Appendix D: Cross-Pipeline Compatibility

This pipeline is designed to be compatible with all five prior pipelines.

| Element | Aristotle | BCAP | B&T | Uexküll | Rickert | HR (this) | Compatible? |
|---------|-----------|------|-----|---------|---------|-----------|-------------|
| Edge relations | 11 | 11 | 11 | 11 | 11 | 11 | ✓ identical |
| Edge domains | 10 | 6 | 7 | 7 | 4 | 11 (+hermeneutic, +political, +philological) | ✓ superset |
| Centrality tiers | core / important / peripheral | same | same | same | same | same | ✓ identical |
| Concept schema | name + greek + def + ... | + greek_form | + german_form | + german_term | name + def | + german_form + greek_form + english_form (trilingual) | ✓ superset |
| Position schema | id + claim + ... | + aristotelian_texts | + targets | + page_ref | + interlocutors | + evidence_type + contributor | ✓ superset |
| Locus tracking | Bekker index | implicit in citations | implicit | — | — | first-class HEIDEGGER-LOCUS + ARISTOTLE-LOCUS | ✓ NEW (subsumes prior) |
| Tension structure | dependency + conflict | same | same | same | same | + inter-contributor type | ✓ superset |
| Terminology appendix | Greek (164 lemmas) | Greek + German | German (300 lemmas) | German (148 lemmas) | — | German + Greek (~100–150) with cross-pipeline links | ✓ extends |
| Output format | MD + JSON + CSV + MMD | same | same | same | same | same + concordance MD/JSON | ✓ identical core |

### Integration Surfaces (Preliminary, for Phase 4)

This volume sits at the intersection of three primary pipelines. Confirmed bridges (already textually grounded by contributors):

**HR ↔ BCAP (heaviest overlap)**:
- HR-01-GROSS Intro p. 2 explicitly lists BCAP's central terms with German+Greek pairings
- HR-02-GADAMER (Ch 2 notes 7, 16, 18, 19, 20, 22, 25, 27, 29) directly cites GA 18 pages
- HR-03-MICHALSKI (Ch 3 by GA 18's editor) is meta-philological commentary on BCAP
- HR-05-STRUEVER (Ch 5) cites BCAP §§ throughout, esp. on rhetoric-as-life-science
- HR-06-KISIEL (Ch 6) cites GA 18 §§14, 122f, 241, 45f
- HR-07-POGGELER (Ch 7) addresses BCAP's place in Heidegger's career

**HR ↔ BT (significant overlap)**:
- HR-04-HYDE (Ch 4) is structurally a BT §§54–60 commentary
- HR-05-STRUEVER (Ch 5) Alltäglichkeit cross-links BT §27, §35
- HR-01-GROSS (BT 158, 178 cited explicitly)
- HR-06-KISIEL connects BT to SS 1924 ontologically

**HR ↔ Aristotle (specific bridges)**:
- HR-04-HYDE → Rhetoric I.3 (epideictic genus); NE VI (phronēsis)
- HR-02-GADAMER → Rhetoric I.2 (rhetoric as dynamis)
- HR-05-STRUEVER → Politics I, NE I, Parts of Animals, Movement of Animals
- HR-01-GROSS → Rhetoric II (pathē); NE II (hexis)

**HR ↔ Rickert (lighter overlap)**:
- Daniel Gross is in Rickert's intellectual neighborhood (rhetoric, ambient/material rhetoric)
- The volume's "rhetorical ontology" framing converges with Rickert's "ambient rhetoric"
- Phase 4 should explore but may yield modest bridges

**HR ↔ Uexküll (minimal)**:
- No direct citations expected; no integration in Phase 4

When Phase 4 of this pipeline is executed, the back-edits to BCAP, BT, and Aristotle pipelines will enrich those pipelines' cross-pipeline-hooks files with confirmed (not [INTERP-high]) edges drawn from the seven contributors' textually grounded readings.
