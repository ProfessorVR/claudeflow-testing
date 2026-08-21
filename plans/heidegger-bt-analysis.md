# Heidegger *Being and Time* (Macquarrie/Robinson) Analysis Pipeline — Living Plan

**Status**: Phase 0 COMPLETE | Phase 1 COMPLETE | Phase 2 COMPLETE | Phase 3 COMPLETE | Phase 4 PARKED
**Created**: 2026-03-09
**Last Updated**: 2026-03-09 (Round 2 feedback applied)

**Edition**: Martin Heidegger, *Being and Time* (trans. John Macquarrie & Edward Robinson, Blackwell 1962).
**Source PDF**: `corpus/rhetorical_ontology/Heidegger, Martin - Being and Time_(1962)_[My Copy].pdf`
**Related**: Rickert *Ambient Rhetoric* pipeline, BCAP pipeline.

---

## Pre-Execution Analysis (2026-03-09)

### Issues Found in Draft Plan

**CRITICAL — Structural errors that would produce wrong analyses:**

1. **Division I/II boundary is wrong.** Division One = §§9–44 (Preparatory Fundamental Analysis of Dasein). Division Two = §§45–83 (Dasein and Temporality). The draft places §§45–60 in Division I. In reality, Division Two begins at §45. The care chapter (§§39–44) is the *culmination* of Division One; being-towards-death (§45) opens Division Two.

2. **§§73–83 completely missing (~65 H. pages).** The draft ends at §72. The published text continues through §83:
   - Chapter V: Temporality and Historicality (§§72–77) — only §72 partially covered
   - Chapter VI: Within-time-ness and the Ordinary Conception of Time (§§78–83) — entirely absent
   These sections contain the analysis of "vulgar time," Aristotle's *Physics* Δ, the Hegel comparison, and the final question about Being in general. For a pipeline meant to feed into integration with BCAP (which culminates in κίνησις), omitting §§78–83 would be a critical gap.

3. **§-to-chapter mapping errors in Division One (labels don't match content):**
   - Draft BT-D1-U3 (§§19–21) labeled "The who of Dasein: everydayness and das Man" — **WRONG**. §§19–21 = Ch III.B: *Contrast between our analysis of worldhood and Descartes' Interpretation of the world*. Das Man is Ch IV (§§25–27).
   - Draft BT-D1-U4 (§§22–25) labeled "Worldhood: equipment, references, significance" — **WRONG**. Equipment/significance was §§14–18. §§22–24 = Ch III.C: *Spatiality*. §25 = start of Ch IV (the "who" question).
   - Draft BT-D1-U5 (§§26–27) labeled "Worldhood and reality; critique of Cartesianism" — **WRONG**. §§26–27 = Ch IV: Being-with-Others and das Man. The Cartesian critique was §§19–21.

4. **Introduction chapter split is off.** The Introduction has two chapters: Ch I = §§1–4 (not §§1–3), Ch II = §§5–8 (not §§4–8). §4 ("The ontical priority of the question of Being") belongs with §§1–3 in Ch I.

**SIGNIFICANT — Missing features from BCAP template:**

5. **PDF filename mismatch.** Draft says `[Macquarrie-Robinson].pdf`; actual file is `[My Copy].pdf`.

6. **No German terminology appendix.** B&T's German vocabulary is as philosophically contested as BCAP's Greek. M/R's translation choices (*Dasein*, *Zuhandenheit* → "readiness-to-hand," *Befindlichkeit* → "state-of-mind," *Sorge* → "care") are notoriously debated. A German terminology appendix (Phase 3 deliverable, analogous to BCAP's Greek appendix) would be valuable — especially since M/R include a "Glossary of German Terms" at p.503.

7. **`is_meaning_of` not in controlled relation set.** Used in example edges ("Temporality is_meaning_of Care") but not listed in the relation vocabulary: `{depends_on, contrasts_with, refines, presupposes, explains, operationalizes, supports, undermines, exemplifies, historicizes}`. Either add it to the set or use `explains`.

8. **No decision logs per phase.** BCAP plan uses these to track rationale for choices.

9. **No cross-pipeline compatibility appendix.** BCAP plan has one showing shared edge vocabulary with Rickert.

10. **No resource estimates.** BCAP plan includes these.

11. **Division Two unitization is too coarse.** 3 units for what should be ~6 chapters of material (once §§73–83 are included). The draft has some D2 units at ~40 H. pages while targeting 15–30.

12. **H. page ranges are approximate and need verification.** The TOC provides exact H. and English page numbers; these should be used instead of estimates.

### Resolution

All issues resolved below. `is_meaning_of` added to the controlled relation set (it captures a specific B&T relationship — temporal meaning — that `explains` doesn't fully convey). German terminology appendix added as Phase 3F. Unitization corrected against the actual TOC.

---

## Book Structure (from TOC, verified against PDF)

The Macquarrie/Robinson translation (Blackwell 1962) uses **H.** (Heidegger/Niemeyer) marginal pagination throughout. The TOC provides both H. page numbers and English page numbers.

> **PDF page offset**: **Verified +1** (English page + 1 = PDF page). Confirmed: English p.21 (Introduction, §1) = PDF p.22. Front matter occupies PDF pages 1–21 (cover, title, blank, copyright, blank, dedication, blank, contents pp.8–12, translators' preface pp.13–16, author's preface p.17, blanks, part-one half-title).

### Introduction

| § | Title | H. | Eng. p. | PDF p. |
|---|-------|-----|---------|--------|
| §1 | The necessity for explicitly restating the question of Being | H.2 | 21 | 22 |
| §2 | The formal structure of the question of Being | H.5 | 24 | 25 |
| §3 | The ontological priority of the question of Being | H.8 | 28 | 29 |
| §4 | The ontical priority of the question of Being | H.11 | 32 | 33 |
| §5 | The ontological analytic of Dasein as laying bare the horizon... | H.15 | 36 | 37 |
| §6 | The task of Destroying the history of ontology | H.19 | 41 | 42 |
| §7 | The phenomenological method of investigation | H.27 | 49 | 50 |
| §8 | Design of the treatise | H.39 | 63 | 64 |

### Part One, Division One: Preparatory Fundamental Analysis of Dasein (§§9–44)

| Ch | §§ | Title | H. | Eng. p. |
|----|-----|-------|-----|---------|
| I | §§9–11 | Exposition of the Task of a Preparatory Analysis of Dasein | H.41–50 | 67–76 |
| II | §§12–13 | Being-in-the-World in General as the Basic State of Dasein | H.52–62 | 78–90 |
| III | §§14–24 | The Worldhood of the World | H.63–113 | 91–148 |
| | §§14–18 (A) | Analysis of Environmentality and Worldhood in General | H.63–88 | 91–121 |
| | §§19–21 (B) | Contrast: Descartes' Interpretation of the World | H.89–101 | 122–134 |
| | §§22–24 (C) | The Aroundness of the Environment, and Dasein's Spatiality | H.101–113 | 134–148 |
| IV | §§25–27 | Being-in-the-World as Being-with and Being-one's-Self. The "They" | H.113–130 | 149–168 |
| V | §§28–38 | Being-in as Such | H.130–180 | 169–224 |
| | §§28–34 (A) | The Existential Constitution of the "There" | H.130–166 | 169–210 |
| | §§35–38 (B) | The Everyday Being of the "There", and the Falling of Dasein | H.166–180 | 210–224 |
| VI | §§39–44 | Care as the Being of Dasein | H.180–230 | 225–273 |

### Part One, Division Two: Dasein and Temporality (§§45–83)

| Ch | §§ | Title | H. | Eng. p. |
|----|-----|-------|-----|---------|
| — | §45 | The outcome of the preparatory fundamental analysis... | H.231 | 274 |
| I | §§46–53 | Dasein's Possibility of Being-a-Whole, and Being-towards-Death | H.235–267 | 279–311 |
| II | §§54–60 | Dasein's Attestation of an Authentic Potentiality-for-Being, and Resoluteness | H.267–301 | 312–348 |
| III | §§61–66 | Dasein's Authentic Potentiality-for-Being-a-Whole, and Temporality as the Ontological Meaning of Care | H.301–331 | 349–380 |
| IV | §§67–71 | Temporality and Everydayness | H.334–370 | 383–421 |
| V | §§72–77 | Temporality and Historicality | H.372–404 | 424–455 |
| VI | §§78–83 | Temporality and Within-time-ness as the Source of the Ordinary Conception of Time | H.404–437 | 456–488 |

**Back matter**: Author's Notes (p.489), Glossary of German Terms (p.503), Index (p.524).

**Projected "Time and Being" (Division Three)**: unwritten. Note its projected function: the reversal (*Kehre*) from the meaning of Being via Dasein's temporality to the temporality of Being itself.

---

## Analysis Unit Groupings

Being and Time spans ~435 H. pages (H.2–H.437) across an Introduction + 12 chapters. Grouped into **17 analysis units** at ~15–30 H. pages each, aligned with chapter boundaries:

### Introduction (2 units)

| Unit ID | §§ | Label | H. pages | Eng. pages | ~H. page count |
|---------|-----|-------|----------|------------|----------------|
| BT-Intro-U1 | §§1–4 | The question of Being: necessity, structure, priority | H.2–14 | 21–35 | 13 |
| BT-Intro-U2 | §§5–8 | Method: phenomenology, Destruktion, design of treatise | H.15–40 | 36–64 | 25 |

### Division One: Preparatory Fundamental Analysis of Dasein (9 units)

| Unit ID | §§ | Ch | Label | H. pages | Eng. pages | ~H. page count |
|---------|-----|-----|-------|----------|------------|----------------|
| BT-D1-U1 | §§9–13 | I–II | Task of existential analytic; being-in-the-world as basic state | H.41–62 | 67–90 | 22 |
| BT-D1-U2 | §§14–18 | III.A | Worldhood: equipment, readiness-to-hand, significance | H.63–88 | 91–121 | 25 |
| BT-D1-U3 | §§19–21 | III.B | Descartes' ontology of the world (critique) | H.89–101 | 122–134 | 13 |
| BT-D1-U4 | §§22–27 | III.C + IV | Spatiality; the "who" of Dasein: being-with, das Man | H.101–130 | 134–168 | 29 |
| BT-D1-U5 | §§28–31 | V.A (pt 1) | State-of-mind, fear, understanding, interpretation | H.130–148 | 169–188 | 18 |
| BT-D1-U6 | §§32–34 | V.A (pt 2) | Assertion, discourse, language | H.148–166 | 188–210 | 18 |
| BT-D1-U7 | §§35–38 | V.B | Falling: idle talk, curiosity, ambiguity, thrownness | H.166–180 | 210–224 | 14 |
| BT-D1-U8 | §§39–42 | VI (pt 1) | Anxiety; care as the being of Dasein | H.180–200 | 225–246 | 20 |
| BT-D1-U9 | §§43–44 | VI (pt 2) | Reality, worldhood, truth | H.200–230 | 244–273 | 30 |

> **Design note (BT-D1-U4)**: §§22–24 (spatiality) and §§25–27 (das Man) are merged into one unit because §§22–24 alone is only ~12 H. pages and §§25–27 is ~17. The merge puts the unit at 29 H. pages, within target range. Alternative: split into two units (BT-D1-U4a: §§22–24, BT-D1-U4b: §§25–27) if finer granularity is needed for the das Man analysis.

> **Design note (BT-D1-U8/U9)**: §§39–44 is split because it covers ~50 H. pages and two distinct phases: the positive account of care through anxiety (§§39–42) and the reality/truth discussions (§§43–44) which are partly defensive/appendicular. The user's original single unit is defensible if you prefer fewer units.

### Division Two: Dasein and Temporality (6 units)

| Unit ID | §§ | Ch | Label | H. pages | Eng. pages | ~H. page count |
|---------|-----|-----|-------|----------|------------|----------------|
| BT-D2-U1 | §§45–53 | preamble + I | Being-towards-death | H.231–267 | 274–311 | 36 |
| BT-D2-U2 | §§54–60 | II | Conscience, guilt, resoluteness | H.267–301 | 312–348 | 34 |
| BT-D2-U3 | §§61–66 | III | Temporality as ontological meaning of care | H.301–331 | 349–380 | 30 |
| BT-D2-U4 | §§67–71 | IV | Temporality and everydayness | H.334–370 | 383–421 | 36 |
| BT-D2-U5 | §§72–77 | V | Temporality and historicality | H.372–404 | 424–455 | 32 |
| BT-D2-U6 | §§78–83 | VI | Within-time-ness; ordinary conception of time | H.404–437 | 456–488 | 33 |

**Total**: 17 units, ~435 H. pages of primary text.

> **Design note (Division Two unit size)**: D2 units average ~33 H. pages, slightly above the 15–30 target. This is acceptable because each D2 chapter is a tight argumentative unit. Splitting (e.g., death into §§45–49 + §§50–53; conscience into §§54–57 + §§58–60) is an option if units prove too dense during Phase 2. Decision deferred to execution.

> **Design note (§45)**: §45 is a transitional summary (H.231–234, ~4 pages) that recaps Division One and frames Division Two's task. Grouped with Ch I (being-towards-death) rather than as a standalone unit.

---

## Phase 0 — Global Overview & Unitization

### Goal
Produce a bird's-eye map of Being and Time and confirm analysis units against the actual PDF.

### Input
- Translators' Preface (pp.13–16, PDF pp.14–17)
- Author's Preface to the Seventh Edition (p.17, PDF p.18)
- Both Introduction chapters: §§1–4 + §§5–8 (pp.21–64, PDF pp.22–65)
- Table of Contents (pp.8–12, PDF pp.8–12)

### Deliverables

1. **Book overview** (2–3 paragraphs)
   - Overall project: question of Being; why Dasein is the privileged entity; phenomenology as method; incompleteness (no Division Three).
   - Structural overview: Introduction → Division One → Division Two.

2. **Structural overview**:
   - Introduction: §§1–8 (necessity of the question; phenomenological method; design of the treatise)
   - Division One: §§9–44 ("Preparatory Fundamental Analysis of Dasein")
   - Division Two: §§45–83 ("Dasein and Temporality")
   - Projected Division Three: "Time and Being" (unwritten)

3. **Provisional core concept list** (25–35 items)

   Dasein, Being (*Sein*), beings (*Seiendes*), being-in-the-world (*In-der-Welt-sein*), world, worldhood, ready-to-hand (*Zuhandenheit*), present-at-hand (*Vorhandenheit*), significance (*Bedeutsamkeit*), equipment (*Zeug*), involvement (*Bewandtnis*), care (*Sorge*), concern (*Besorgen*), solicitude (*Fürsorge*), thrownness (*Geworfenheit*), projection (*Entwurf*), fallenness (*Verfallenheit*), everydayness (*Alltäglichkeit*), das Man (the "they"), state-of-mind/attunement (*Befindlichkeit*), understanding (*Verstehen*), interpretation (*Auslegung*), assertion (*Aussage*), discourse (*Rede*), idle talk (*Gerede*), curiosity (*Neugier*), ambiguity (*Zweideutigkeit*), anxiety (*Angst*), being-towards-death (*Sein-zum-Tode*), anticipation (*Vorlaufen*), conscience (*Gewissen*), guilt (*Schuld*), resoluteness (*Entschlossenheit*), authenticity/inauthenticity (*Eigentlichkeit/Uneigentlichkeit*), disclosedness (*Erschlossenheit*), historicality (*Geschichtlichkeit*), temporality (*Zeitlichkeit*), temporal ecstases, within-time-ness (*Innerzeitigkeit*), world-time, clock time, destiny (*Schicksal*), fate (*Geschick*).

4. **Provisional claims list** (6–10 items)
   - The essence of Dasein lies in its existence.
   - Being-in-the-world is a unitary, basic constitution, not an added relation.
   - Care is the being of Dasein.
   - Authenticity/inauthenticity are existentiell possibilities grounded in the structure of care.
   - Temporality is the ontological meaning of care and the horizon for the understanding of Being.
   - Everyday time-reckoning (clock time) is derivative of originary temporality.
   - Death is Dasein's ownmost, non-relational, certain, and indefinite possibility.
   - Historicality is grounded in temporality; it is not the same as "having a history."

5. **Candidate tensions** (4–6 items)
   - Dasein-centrism vs. the "question of Being itself" (the hermeneutic circle as methodological problem).
   - Authenticity vs. sociality/das Man (is the "they" purely deficient?).
   - Historicality vs. individual decision (Dasein's "heritage" vs. radical individuation in being-towards-death).
   - The status of Division Two vs. the unwritten "Time and Being" (is the project completable?).
   - Ontological vs. ontic register (where does Heidegger's analysis slip between the two?).

6. **Unitization confirmation**: Verify the 17 units above against PDF page breaks and § headings.

7. **PDF page offset verification**: Confirm +1 offset (English p + 1 = PDF p).

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 0.1 | Read PDF pp.22–23 (est. English pp.21–22), verify offset | |
| 0.2 | Read Translators' Preface (PDF pp.14–17) | |
| 0.3 | Read Author's Preface (PDF p.18) | |
| 0.4 | Read Introduction §§1–4 (PDF pp.22–36) | |
| 0.5 | Read Introduction §§5–8 (PDF pp.37–65) | |
| 0.6 | Produce overview + provisional lists | |
| 0.7 | Write to `corpus/index/Heidegger - Being and Time/bt-analysis/phase0-overview.md` | |

### Output Location
- `corpus/index/Heidegger - Being and Time/bt-analysis/phase0-overview.md` — prose overview + provisional lists
- `corpus/index/Heidegger - Being and Time/bt-structured/manifest.json` — unit listing (created in Phase 1 but schema confirmed here)

### Decision Log — Phase 0

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-09 | Phase 0 added (mirrors BCAP pipeline) | Proven effective: seeds concept tracking, catches motifs TOC doesn't foreground |
| 2026-03-09 | Offset verification made explicit step | BCAP offset was initially wrong; verifying early prevents cascading errors |
| 2026-03-09 | §§1–4 (not §§1–3) as Introduction Ch I | Matches M/R TOC exactly; §4 is Ch I, not Ch II |

---

## Phase 1 — Ingestion & Structured Metadata

### Goal
Create a structured metadata corpus for Being and Time, unit-level, without storing large copyrighted text blobs. Content is read on-the-fly during Phase 2.

### Output Format (per unit)
```json
{
  "part": "Part One",
  "division": "Division One",
  "unit_id": "BT-D1-U2",
  "chapter": "III.A",
  "sections": [
    {
      "section_id": "§14",
      "heading": "The idea of the worldhood of the world in general",
      "h_pages": "63–66",
      "eng_pages": "91–95",
      "pdf_pages": "92–96",
      "tags": ["worldhood", "environment", "Umwelt"],
      "german_terms_expected": ["Weltlichkeit", "Umwelt", "Bewandtnis"],
      "subsections": ["A. Analysis of environmentality and worldhood in general"]
    }
  ],
  "note": "Full text not stored due to content constraints. Read pages on-the-fly for analysis."
}
```

**Key schema features** (adapted from BCAP):
- `unit_id` groups multiple §-sections (same as BCAP)
- `h_pages` and `eng_pages` both tracked (B&T has dual pagination)
- `pdf_pages` uses verified +1 offset
- `german_terms_expected` seeded from TOC headings and the Glossary of German Terms (p.503) — analogous to BCAP's `greek_terms_expected`
- No `text`, `endnotes`, or `block_quotes` fields (content filtering constraint)

### Output Location
```
corpus/index/Heidegger - Being and Time/bt-structured/
├── manifest.json
├── bt-intro-u1.json        (§§1–4)
├── bt-intro-u2.json        (§§5–8)
├── bt-d1-u1.json           (§§9–13)
├── bt-d1-u2.json           (§§14–18)
├── bt-d1-u3.json           (§§19–21)
├── bt-d1-u4.json           (§§22–27)
├── bt-d1-u5.json           (§§28–31)
├── bt-d1-u6.json           (§§32–34)
├── bt-d1-u7.json           (§§35–38)
├── bt-d1-u8.json           (§§39–42)
├── bt-d1-u9.json           (§§43–44)
├── bt-d2-u1.json           (§§45–53)
├── bt-d2-u2.json           (§§54–60)
├── bt-d2-u3.json           (§§61–66)
├── bt-d2-u4.json           (§§67–71)
├── bt-d2-u5.json           (§§72–77)
└── bt-d2-u6.json           (§§78–83)
```

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 1.1 | Create `corpus/index/Heidegger - Being and Time/bt-structured/` | |
| 1.2 | For each unit, write JSON skeleton with §, headings, H./Eng./PDF pages | |
| 1.3 | Seed `german_terms_expected` from TOC + Glossary (p.503) | |
| 1.4 | Build `manifest.json` listing all 17 units | |
| 1.5 | Spot-check: verify § ranges and page spans vs. PDF | |

### Quality Checks
- [ ] All §§1–83 mapped to units (Introduction + Division One + Division Two)
- [ ] No overlaps or gaps in § coverage
- [ ] H. page ranges match TOC exactly
- [ ] Eng. page ranges match TOC exactly
- [ ] PDF page numbers use verified +1 offset
- [ ] Tags capture main concepts per unit
- [ ] `german_terms_expected` seeded for units where TOC/Glossary provides terms
- [ ] Special characters (dashes, accents, German) preserved in headings

### Decision Log — Phase 1

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-09 | Metadata-only skeletons (no text extraction) | Content filtering blocks copyrighted text; proven approach from Rickert + BCAP |
| 2026-03-09 | `german_terms_expected` added to schema | B&T's German is as philosophically loaded as BCAP's Greek; M/R Glossary (p.503) provides initial seed |
| 2026-03-09 | Dual H./Eng./PDF pagination tracked | B&T scholarship uses H. numbers; PDF reading needs English/PDF numbers |

---

## Phase 2 — Being-and-Time-Only Unit Analyses

### Goal
Reconstruct Heidegger's ontology of Dasein and temporality unit by unit, without importing your own framework.

### System Role (Analysis Agent)
```
You are a specialist in Heidegger analyzing Being and Time (Macquarrie &
Robinson 1962), Part One: Introduction (§§1–8), Division One: Preparatory
Fundamental Analysis of Dasein (§§9–44), and Division Two: Dasein and
Temporality (§§45–83).

Your task is to reconstruct Heidegger's account of Dasein, being-in-the-world,
care, everydayness, authenticity, historicality, and temporality as rigorously
and charitably as possible, without comparing it to other frameworks unless
Heidegger himself explicitly does so.

Track German terminology carefully: for key Heideggerian terms, note both the
German and the Macquarrie/Robinson English rendering, especially where the
translation is contested or where Heidegger uses a term in a non-standard way.

Prefer explicit structures (tables, JSON edges, graph formats) and always
mark interpretive extrapolations with [INTERP-high] or [INTERP-low].
```

### Per-Unit Analysis Template

For each unit (BT-Intro-U1 … BT-D2-U6), produce:

#### Section 1: Unit Metadata
- `unit_id`, `part`, `division`, `chapter`, `§-range`, `H. page range`, `Eng. page range`
- One-sentence unit thesis: what this unit contributes to the overall project.

#### Section 2: Hierarchical Outline
- 2–4 top-level sections with labels (e.g., "Reawakening the question of Being," "Being-in as such," "Worldhood," "Fallenness," "Care," "Being-towards-death," "Temporality and care," "Within-time-ness")
- For each: 2–6 bullets describing Heidegger's main conceptual moves.

#### Section 3: Key Concepts (Heidegger, B&T)

For each major concept in the unit:

| Field | Description |
|-------|-------------|
| `name` | Canonical name (e.g., "Dasein", "being-in-the-world", "care", "fallenness") |
| `german_form` | German term (e.g., *Sorge*, *Befindlichkeit*, *Zuhandenheit*) |
| `mr_translation` | Macquarrie/Robinson English rendering |
| `definition` | Paraphrased definition in this unit's context |
| `type` | {ontological, existential, existentiale, methodological, phenomenological, temporal, other} |
| `dependencies` | Concepts it presupposes (e.g., care depends on ahead-of-itself + already-in + alongside) |
| `function` | {setup, critique, positive_proposal, bridge, example} |
| `sections` | § and H. page anchors |

**Cross-unit target concept list** (updated from Phase 0):

Dasein, Being (*Sein*), beings (*Seiendes*), being-in-the-world, world, worldhood, ready-to-hand (*Zuhandenheit*), present-at-hand (*Vorhandenheit*), equipment (*Zeug*), significance (*Bedeutsamkeit*), involvement (*Bewandtnis*), care (*Sorge*), concern (*Besorgen*), solicitude (*Fürsorge*), thrownness (*Geworfenheit*), projection (*Entwurf*), fallenness (*Verfallenheit*), everydayness (*Alltäglichkeit*), das Man, state-of-mind (*Befindlichkeit*), understanding (*Verstehen*), interpretation (*Auslegung*), assertion (*Aussage*), discourse (*Rede*), idle talk (*Gerede*), curiosity (*Neugier*), ambiguity (*Zweideutigkeit*), anxiety (*Angst*), being-towards-death (*Sein-zum-Tode*), anticipation (*Vorlaufen*), conscience (*Gewissen*), guilt (*Schuld*), resoluteness (*Entschlossenheit*), destiny (*Schicksal*), historicality (*Geschichtlichkeit*), temporality (*Zeitlichkeit*), temporal ecstases (*Ekstasen*), within-time-ness (*Innerzeitigkeit*), world-time, clock time, disclosedness (*Erschlossenheit*), authenticity (*Eigentlichkeit*).

#### Section 4: Main Positions & Arguments

| Field | Description |
|-------|-------------|
| `id` | Unit-prefixed ID (e.g., BT-D1-U2-P1) |
| `claim` | Concise statement of the position |
| `premises` | Key premises → conclusion |
| `targets` | Doctrines/traditions criticized (e.g., Cartesian subject, vulgar time concept, Hegel's spirit) |
| `status` | {core_book_thesis, local_support, methodological, illustrative} |

#### Section 5: Interlocutors & Traditions

For each major interlocutor in the unit (Descartes, Aristotle, Kant, Husserl, Hegel, Dilthey, Kierkegaard, etc.):
- **Name**
- **Role**: What problem they frame or what concept Heidegger takes from them
- **Borrowings vs. breaks**: What he takes, what he rejects or reinterprets
- **Specific texts cited** (where identifiable)

#### Section 5a (optional): BCAP Cross-References `[INTERP]`

**Restricted to**: Units where Heidegger explicitly uses language or concepts that appear in BCAP (GA 18) — particularly being-in-the-world, das Man, attunement, fallenness, care, Aristotelian citations, and the kinēsis/temporality nexus. For all other units, return:
> "No explicit BCAP cross-reference in this unit."

**Guard**: Only fill this in if the connection is textually grounded in B&T (e.g., Heidegger cites Aristotle's *Physics* in §§78–83, or uses *Befindlichkeit* in a way that parallels his BCAP reading of πάθος). Do NOT speculate about structural parallels that Heidegger does not himself signal.

**Disabled until BCAP ontology exists.** Until the BCAP ontology artifacts (from `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/`) are available and can be referenced, always return the default "No explicit BCAP cross-reference in this unit." Do not infer cross-references from memory or secondary literature.

When filled (after BCAP ontology is available): 2–4 bullet points on how this material connects to BCAP.

#### Section 6: Tensions & Open Questions
- Internal tensions (e.g., Dasein-centrism vs. Being itself; authenticity vs. sociality; ambiguity in historicality)
- Each tension linked to positions/concepts by ID
- Mark `[INTERP-high]` for speculative readings, `[INTERP-low]` for safer ones

#### Section 7: German Terms Encountered

List of significant German terms encountered in this unit's PDF pages:

```json
[
  {
    "german_form": "Zuhandenheit",
    "mr_translation": "readiness-to-hand",
    "alternative_translations": ["handiness", "availableness"],
    "h_pages": ["69", "71", "73", "74", "83"],
    "translation_contested": true,
    "notes": "M/R's compound captures the tool-character but misses the 'zu' (toward/for) directedness"
  }
]
```

`translation_contested`: whether the M/R rendering is debated in the literature. **Default = false.** Only set to `true` when: (a) the term appears in the M/R Glossary (p.503) with translator's remarks, or (b) there is a known alternative rendering in the literature you actually care about (e.g., *Besorgen*, *Fürsorge*, *Zeitlichkeit*, *Befindlichkeit*, *Zuhandenheit*, *Vorhandenheit*, *Erschlossenheit*). Straightforward items (e.g., *Seiendes* → "beings") stay `false` to keep the appendix focused on genuinely interpretive terms.

**Condensed table format**: For units where many German terms repeat from earlier analyses, Section 7 may use a compact table (term | M/R | pages | contested?) rather than full JSON objects. Every term must still be listed — no "see previous unit" cross-references.

This feeds Phase 3F (German Terminology Appendix).

#### Section 8: Local Graph Edges

Relations vocabulary (controlled set):
`depends_on`, `contrasts_with`, `refines`, `presupposes`, `explains`, `operationalizes`, `supports`, `undermines`, `exemplifies`, `historicizes`, `is_meaning_of`

> **Note**: `is_meaning_of` added to capture the specific B&T relationship where temporality is the *ontological meaning* (Sinn) of care. This is stronger than `explains` — it names a foundational-ontological grounding relation.

`edge_domain`: {ontological, existential, existentiale-structural, rhetorical, temporal, genealogical, methodological}

```json
[
  {
    "source": "CONCEPT:Being-in-the-world",
    "target": "CONCEPT:Dasein",
    "relation": "depends_on",
    "edge_domain": "existentiale-structural",
    "note": "Being-in-the-world is the basic constitution of Dasein, not a relation between subject and object."
  },
  {
    "source": "CONCEPT:Temporality",
    "target": "CONCEPT:Care",
    "relation": "is_meaning_of",
    "edge_domain": "temporal",
    "note": "Temporality is the ontological meaning of care (§65)."
  },
  {
    "source": "CONCEPT:Everydayness",
    "target": "CONCEPT:Authenticity",
    "relation": "contrasts_with",
    "edge_domain": "existential",
    "note": "Authentic existence is a modification of everydayness, not its opposite."
  }
]
```

Self-loops allowed with relations `{shifts, refines, complexifies}` where concepts develop over the book (e.g., time, world, understanding).

Later, a tension detector will pick up cases where a pair has both dependency and conflict edges.

### Output Location

`corpus/index/Heidegger - Being and Time/bt-analysis/` — one Markdown + one JSON per analysis unit:
- `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-intro-u1.md` / `.json`
- `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-intro-u2.md` / `.json`
- ...through...
- `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d2-u6.md` / `.json`

### Execution Method

**Single pass** (lighter units: BT-Intro-U1, BT-D1-U1, BT-D1-U3, BT-D1-U6, BT-D1-U7):
Read PDF pages on-the-fly → produce full analysis in one pass.

**Mandatory two-pass JSON-first** (all dissertation-critical units):
- BT-D1-U2 (worldhood/equipment — foundational for your rhetorical ontology)
- BT-D1-U4 (das Man — central to Heidegger/rhetoric intersection)
- BT-D1-U5 (Befindlichkeit — connects to BCAP πάθος)
- BT-D1-U8 (care — the structural whole)
- BT-D1-U9 (reality/truth — contested terrain)
- BT-D2-U1 (being-towards-death)
- BT-D2-U3 (temporality as meaning of care — the culmination)
- BT-D2-U5 (historicality)
- BT-D2-U6 (within-time-ness — connects to BCAP κίνησις and Aristotle's Physics)

Two-pass method:
- Pass 1: Outline + key concepts + German terms (JSON-structured)
- Pass 2: Positions/tensions/edges + narrative, using Pass 1 output as context

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 2.1 | Create output directory `corpus/index/Heidegger - Being and Time/bt-analysis/` | |
| 2.2–2.18 | Analyze units BT-Intro-U1 through BT-D2-U6 (17 units, parallelized) | |
| 2.19 | Cross-check: verify all target German concepts appear at least once | |
| 2.20 | Compile master concept table (concept → units where it appears) | |
| 2.21 | Compile master interlocutor table | |

### Quality Checks
- [ ] All 8 sections present for each unit (5a optional)
- [ ] Concept definitions reflect Heidegger's usage in B&T, not generic glosses
- [ ] Position IDs unique and unit-prefixed
- [ ] Interlocutors listed with specific roles
- [ ] `[INTERP-high/low]` markers used and summarized in Section 6
- [ ] Edge relations use only the controlled set (11 relations); each edge has an `edge_domain`
- [ ] Each unit yields at least 10–20 edges
- [ ] German terms include both `german_form` and `mr_translation`
- [ ] `translation_contested` flag populated for all German terms in Section 7
- [ ] No comparisons to your own framework
- [ ] BCAP cross-references (Section 5a) only when textually grounded

### Decision Log — Phase 2

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-09 | `german_form` + `mr_translation` fields added to concept schema | Central to B&T scholarship; M/R translations are contested |
| 2026-03-09 | Section 7 (German Terms Encountered) added | Feeds Phase 3F appendix; captures translation_contested metadata |
| 2026-03-09 | `is_meaning_of` added to edge relations | Captures a specific B&T grounding relation (Sinn) that `explains` doesn't convey |
| 2026-03-09 | Section 5a: BCAP cross-references made optional with [INTERP] guard | B&T and BCAP share vocabulary (being-in-the-world, Befindlichkeit, das Man); but only note when textually grounded |
| 2026-03-09 | 9 units designated mandatory two-pass | Dissertation-critical sections; prevents thin analyses on most-cited material |
| 2026-03-09 | BT-D2-U6 (§§78–83) flagged as BCAP-critical | Contains Aristotle's Physics Δ discussion — direct link to BCAP kinēsis material |
| 2026-03-09 | `translation_contested` defaults to `false`; only `true` for genuinely interpretive terms | User feedback: straightforward items (*Seiendes* → "beings") add noise; focus on M/R Glossary-flagged and literature-contested terms |
| 2026-03-09 | Section 5a disabled until BCAP ontology artifacts exist | User feedback: prevents agents from inventing BCAP data; keeps B&T pipeline truly standalone |

---

## Phase 3 — Book-Level Ontology & Graphs

### Goal
Synthesize unit analyses into a global ontology of B&T (concepts, structures, temporality) and thematic sub-graphs.

### Deliverables

#### 3A: Canonical Node List (B&T Concepts)

Merge unit concepts into canonical nodes. For each:

| Field | Description |
|-------|-------------|
| `canonical_name` | e.g., "Care" |
| `german_lemma` | e.g., *Sorge* (links to appendix) |
| `mr_translation` | e.g., "care" |
| `type` | {concept, position, method, example} |
| `definition` | 2–3 sentence definition in Heidegger's sense |
| `units` | List of analysis units where it appears |
| `aliases` | Alternative terms/translations (e.g., Stambaugh's renderings) |
| `centrality` | {core, important, peripheral} |

Expected core nodes (~12): Dasein, Being, being-in-the-world, care, temporality, understanding, state-of-mind, discourse, fallenness, thrownness, projection, resoluteness

Expected important nodes (~15): worldhood, ready-to-hand, present-at-hand, das Man, anxiety, being-towards-death, conscience, guilt, historicality, within-time-ness, authenticity, everydayness, disclosedness, equipment, solicitude

Expected peripheral nodes (~10): significance, involvement, spatiality, fear, curiosity, ambiguity, idle talk, destiny, fate, world-time

#### 3B: Global Edge List and Thematic Sub-Graphs

Merge and de-duplicate edges. Generate at minimum:

1. **Existential structure sub-graph**: Dasein → being-in-the-world → worldhood/being-with/being-in → care. The structural core of Division One.
2. **Authenticity/temporality sub-graph**: Death → conscience → resoluteness → temporality → historicality. The argumentative arc of Division Two.
3. **Temporality/time sub-graph**: Originary temporality → ecstases → within-time-ness → world-time → clock time. The derivation chain of §§61–83.
4. **Phenomenological bridge sub-graph** (if Phase 4 integration is anticipated): How B&T concepts connect to BCAP concepts (being-in-the-world ↔ ζωή πρακτική; Befindlichkeit ↔ πάθος; care ↔ ψυχῆς ἐνέργεια; temporality ↔ κίνησις). **Constrained to max 20 edges.**

#### 3C: Tension Layer
Same structure as Rickert/BCAP: node pairs with both dependency + conflict edges → productive tensions.

#### 3D: Contested/Unstable Nodes
Nodes whose meaning shifts across the book (e.g., "world" gains temporal meaning in Division Two; "understanding" is temporalized in §68).

#### 3E: Book Trajectory Narrative
2–3 paragraphs on how B&T proceeds:
1. **Introduction**: The question of Being has been forgotten; Dasein is the privileged entity for inquiry because it already has an understanding of Being; phenomenology is the method.
2. **Division One**: The preparatory analytic — from being-in-the-world (worldhood, being-with, being-in) through everydayness and falling to the structural whole of care.
3. **Division Two**: The radicalization — being-towards-death, conscience, resoluteness; temporality as the meaning of care; the derivative status of everyday time.

#### 3F: German Terminology Appendix (KEY NEW ELEMENT)

**Aggregation**: Collect all `german_form` entries and Section 7 German term lists across all 17 unit analyses. Merge into canonical lemma entries.

**Per-lemma entry structure**:
```json
{
  "lemma": "Sorge",
  "mr_translation": "care",
  "alternative_translations": ["concern", "worry"],
  "forms_encountered": ["Sorge", "Besorgen", "Fürsorge"],
  "related_german_terms": ["Besorgen (concern)", "Fürsorge (solicitude)"],
  "definition_in_bt": "The being of Dasein: the unified structural whole of ahead-of-itself-already-being-in-the-world-alongside-entities-within-the-world.",
  "key_sections": ["§41 (H.191–196)", "§65 (H.323–331)"],
  "units": ["BT-D1-U8", "BT-D2-U3"],
  "translation_contested": true,
  "translation_notes": "M/R use 'care' but note the German carries connotations absent in English. Stambaugh also uses 'care'. Some scholars prefer leaving Sorge untranslated.",
  "preferred_translation": "",
  "canonical_node_link": "CONCEPT:Care (core/existentiale)",
  "notes": ""
}
```

**Output files**:
- `corpus/index/Heidegger - Being and Time/bt-analysis/bt-german-appendix.md` — human-readable, citable
- `corpus/index/Heidegger - Being and Time/bt-analysis/bt-german-appendix.json` — structured dictionary

#### 3G: Concept × Unit Matrix
Same format as Rickert/BCAP concept × chapter/unit matrix.

#### 3H: Exportable Graph Views
- `corpus/index/Heidegger - Being and Time/bt-analysis/bt-graph-global.mmd` — Full B&T Mermaid graph
- `corpus/index/Heidegger - Being and Time/bt-analysis/bt-graph-existential-structure.mmd` — Division One core
- `corpus/index/Heidegger - Being and Time/bt-analysis/bt-graph-authenticity-temporality.mmd` — Division Two arc
- `corpus/index/Heidegger - Being and Time/bt-analysis/bt-graph-time-derivation.mmd` — Temporality → clock time chain
- `corpus/index/Heidegger - Being and Time/bt-analysis/bt-graph-bridge.mmd` — B&T ↔ BCAP bridge (optional, max 20 edges)

### Output Location
```
corpus/index/Heidegger - Being and Time/bt-analysis/
├── phase0-overview.md
├── phase2-bt-intro-u1.md / .json ... phase2-bt-d2-u6.md / .json  (17 unit analyses)
├── book-level-ontology.md                    (3A–3E)
├── book-level-ontology.json
├── global-edges.csv                          (with edge_domain)
├── tension-edges.json
├── contested-nodes.md
├── concept-matrix.csv
├── bt-german-appendix.md                     (3F — KEY)
├── bt-german-appendix.json
├── bt-graph-global.mmd
├── bt-graph-existential-structure.mmd
├── bt-graph-authenticity-temporality.mmd
├── bt-graph-time-derivation.mmd
└── bt-graph-bridge.mmd                       (optional)
```

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 3.1 | Collect all unit German term lists (Section 7 data) | |
| 3.2 | **Aggregate German terms → provisional lemma list** | |
| 3.3 | Merge concepts → canonical node list with centrality + german_lemma (informed by lemma list from 3.2) | |
| 3.4 | Collect all unit edge JSONs | |
| 3.5 | Merge + de-duplicate edges → global edge list | |
| 3.6 | Generate thematic sub-graphs (4 sub-graphs, max 15–20 edges each) | |
| 3.7 | Run tension detector on global edges | |
| 3.8 | Identify contested/unstable nodes | |
| 3.9 | Build concept × unit matrix | |
| 3.10 | Write book trajectory narrative | |
| 3.11 | **Complete German appendix** (fill remaining fields from provisional lemmas) | |
| 3.12 | Generate Mermaid graphs (global + 4 sub-graphs) | |
| 3.13 | Export CSV edge list | |
| 3.14 | Validate graph integrity | |

### Quality Checks
- [ ] All target German concepts appear in canonical node list AND appendix
- [ ] Every appendix lemma links back to a canonical node
- [ ] Every canonical node with `german_lemma` links to an appendix entry
- [ ] `translation_contested` populated for every appendix entry
- [ ] No orphan nodes in any graph
- [ ] All 5 Mermaid graphs render without errors
- [ ] Macro-trajectory covers Introduction + both Divisions
- [ ] Tension layer captures at least 4–6 productive tensions
- [ ] No references to your own framework
- [ ] Bridge sub-graph (if generated) constrained to max 20 edges

### Decision Log — Phase 3

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-09 | German appendix as Phase 3F (not Phase 1) | Requires Phase 2 analysis to populate usage; Phase 1 can only seed expected terms |
| 2026-03-09 | Four thematic sub-graphs (not three) | Added time-derivation chain (§§61–83 arc) alongside existential structure, authenticity, and bridge |
| 2026-03-09 | German aggregation at steps 3.1–3.2 (before node creation) | Learned from BCAP: lemma list should drive canonical node list, not follow it |
| 2026-03-09 | Bridge sub-graph made optional | Phase 4 integration is parked; bridge graph only useful if BCAP ontology is ready |
| 2026-03-09 | `preferred_translation` field added to German appendix (optional, initially blank) | User feedback: gives a clean place to record your own terminological decisions in Phase 4+ without rewriting appendix entries |

---

## Phase 4 — Deferred Integration (PARKED)

### Status: DO NOT EXECUTE until architectonic is ready.

### Future Trigger
This phase activates when you provide:
1. The B&T ontology + German appendix from Phases 2–3
2. The BCAP ontology + Greek appendix
3. The Rickert ontology
4. A structured description of your own framework

### Template (parked)

```
You will receive:
(a) The book-level ontology of Being and Time (Phases 2–3 output),
    including the German terminology appendix
(b) The course-level ontology of Heidegger's BCAP (including Greek appendix)
(c) The Rickert Ambient Rhetoric ontology
(d) A structured description of [your] Aristotelian/rhetorical framework

Your task:
1. MAPPING TABLE: For each node in the B&T ontology, identify the closest
   analog in (b), (c), and (d) (or mark "no direct analog").
   For each mapping, tag with one or more of: INFORMS, DISTORTS, EXTENDS,
   REORIENTS. Specify which level(s) of [your] architectonic the node touches.

2. GERMAN-GREEK CROSS-REFERENCE: For each German term in the B&T appendix
   that has a Greek cognate in the BCAP appendix, compare:
   - Heidegger's B&T usage vs. his BCAP reading of the Greek
   - Where the later B&T formulation develops, transforms, or abandons
     the earlier BCAP Aristotelian material

3. ZONES OF ALIGNMENT: Where B&T supports your framework.
   - Shared phenomenological commitments
   - Compatible analyses of world, attunement, practical life
   - Temporality/kinēsis connections

4. ZONES OF CONFLICT: Where they diverge.
   - Heidegger's ontologization of rhetoric (B&T §§34–37 vs. BCAP §§13–14)
   - Subordination of λόγος to existential structure
   - Care vs. your register of rhetorical agency

5. INTEGRATION SCENARIOS (2–3 alternatives):
   - Conservative: cite Heidegger where he supports your readings
   - Dialogical: sustained engagement showing how your framework emerges
     from and revises Heidegger's Aristotle/Dasein-analytic
   - Critical: foreground where Heidegger's reading fails and your
     framework corrects it

Until inputs (b)–(d) are provided, do not speculate about integration.
```

### Output Location (future)
- `corpus/index/Heidegger - Being and Time/bt-analysis/integration-map.md`
- `corpus/index/Heidegger - Being and Time/bt-analysis/integration-map.json`

### Decision Log — Phase 4

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-09 | Phase 4 parked as template only | User explicitly requested deferred integration |
| 2026-03-09 | INFORMS/DISTORTS/EXTENDS/REORIENTS taxonomy | Matches BCAP Phase 4 for consistency |
| 2026-03-09 | German-Greek cross-reference added | B&T German appendix + BCAP Greek appendix enables term-level comparison |
| 2026-03-09 | Three-text integration (B&T + BCAP + Rickert) | All three pipelines will be complete; triple integration more valuable than pairwise |

---

## Appendix A: Global Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-09 | Plan created (5 phases: 0–4) | Mirrors proven BCAP pipeline with B&T-specific adaptations |
| 2026-03-09 | 17 analysis units (from 83 §-sections) | ~15–30 H. pages per unit; matches BCAP pipeline scale |
| 2026-03-09 | Division boundary corrected: D1 = §§9–44, D2 = §§45–83 | User draft had §§45–60 in Division One; corrected per M/R TOC |
| 2026-03-09 | §§73–83 added (was missing from draft) | ~65 H. pages including within-time-ness, Aristotle Physics, Hegel; critical for BCAP integration |
| 2026-03-09 | §-to-chapter labels corrected | Draft had §§19–21 as "das Man" (actually Descartes); §§26–27 as "Cartesianism" (actually das Man) |
| 2026-03-09 | Introduction split corrected to §§1–4 / §§5–8 | Per M/R TOC: Ch I = §§1–4, Ch II = §§5–8 |
| 2026-03-09 | PDF filename corrected to `[My Copy].pdf` | Draft had `[Macquarrie-Robinson].pdf`; verified actual filename |
| 2026-03-09 | German terminology tracking added (Phase 2 Section 7 + Phase 3F appendix) | B&T German is as philosophically loaded as BCAP Greek; M/R translation contested |
| 2026-03-09 | `is_meaning_of` added to controlled relation set | Captures specific B&T grounding relation (Sinn) |
| 2026-03-09 | Metadata-only Phase 1 (no text extraction) | Content filtering constraint; proven from Rickert + BCAP |
| 2026-03-09 | BCAP cross-references (Section 5a) made optional with guard | Prevents anachronistic readings; only note when textually grounded |
| 2026-03-09 | Section 5a disabled until BCAP ontology artifacts exist | User feedback: keeps B&T pipeline standalone; prevents fabricated cross-references |
| 2026-03-09 | Dual H./Eng./PDF pagination throughout | B&T scholarship uses H. numbers; PDF reading needs English/PDF numbers |
| 2026-03-09 | `translation_contested` default = false; scoped to genuinely contested terms | User feedback: reduces noise on straightforward translations |
| 2026-03-09 | `preferred_translation` field added to German appendix (blank until Phase 4+) | User feedback: clean slot for your own terminological decisions without rewriting entries |
| 2026-03-09 | **Future harmonization note**: `is_meaning_of` may be promoted to the shared relation set across all three pipelines | Useful for BCAP ("movement as meaning of phusis") and Rickert ("ambience as mode of disclosure"); keep use rare and heavily justified |
| 2026-03-09 | **Future harmonization note**: BT-D1-U4 (§§22–27) may be split at execution time if spatiality and das Man need separate treatment | Merged default is correct for target unit size; split only if Phase 2 reveals distinct analytical needs |

## Appendix B: Resource Estimates

| Phase | Units of Work | Approx Context per Unit | Notes |
|-------|--------------|------------------------|-------|
| Phase 0 | 1 prompt | Translators' Preface + Introduction §§1–8 (~40 H. pages) | Single pass |
| Phase 1 | 17 unit JSONs + manifest | TOC data + Glossary only | Fast; minimal PDF reading |
| Phase 2 | 17 analyses × 1–2 passes | ~15–35 PDF pages/unit | +1 extra pass for 9 dissertation-critical units |
| Phase 3 | 2–3 synthesis passes | All 17 unit analyses | Includes German appendix generation |
| Phase 4 | Deferred | — | Requires your framework description + BCAP + Rickert ontologies |

## Appendix C: File Tree (planned)

```
corpus/
├── index/Heidegger - Being and Time/bt-structured/                         # Phase 1 output
│   ├── manifest.json
│   ├── bt-intro-u1.json                   (§§1–4)
│   ├── bt-intro-u2.json                   (§§5–8)
│   ├── bt-d1-u1.json ... bt-d1-u9.json   (§§9–44, 9 units)
│   ├── bt-d2-u1.json ... bt-d2-u6.json   (§§45–83, 6 units)
│   └── (17 unit files total)
│
├── index/Heidegger - Being and Time/bt-analysis/                            # Phase 2–3 output
│   ├── phase0-overview.md
│   ├── phase2-bt-intro-u1.md / .json
│   ├── ...
│   ├── phase2-bt-d2-u6.md / .json         (17 unit analyses)
│   ├── book-level-ontology.md
│   ├── book-level-ontology.json
│   ├── global-edges.csv
│   ├── tension-edges.json
│   ├── contested-nodes.md
│   ├── concept-matrix.csv
│   ├── bt-german-appendix.md              # Phase 3F — KEY
│   ├── bt-german-appendix.json
│   ├── bt-graph-global.mmd
│   ├── bt-graph-existential-structure.mmd
│   ├── bt-graph-authenticity-temporality.mmd
│   ├── bt-graph-time-derivation.mmd
│   ├── bt-graph-bridge.mmd                # Optional (B&T ↔ BCAP)
│   └── integration-map.md                 # Phase 4 (future)
```

## Appendix D: Cross-Pipeline Compatibility

This pipeline is designed to be compatible with both the Rickert *Ambient Rhetoric* and the BCAP analysis pipelines for future cross-text integration:

| Element | Rickert Pipeline | BCAP Pipeline | B&T Pipeline | Compatible? |
|---------|-----------------|---------------|--------------|-------------|
| Edge relations | 10-relation set | 10-relation set | 11-relation set (+`is_meaning_of`) | ✓ (superset) |
| Edge domains | ontological, rhetorical, genealogical, methodological | ontological, existential, rhetorical, logical, genealogical, methodological | ontological, existential, existentiale-structural, rhetorical, temporal, genealogical, methodological | ✓ (superset) |
| Concept schema | name, definition, type, dependencies, function, pages | Same + greek_form, greek_lemma | Same + german_form, mr_translation | ✓ (superset) |
| Position schema | id, claim, premises, interlocutors, status | Same + aristotelian_texts | Same | ✓ |
| Tension detection | dependency + conflict on same pair | Same | Same | ✓ |
| Centrality | core/important/peripheral | Same | Same | ✓ |
| Output format | Markdown + JSON + CSV + Mermaid | Same | Same | ✓ |
| Terminology appendix | — | Greek appendix | German appendix | ✓ (parallel structure) |

When Phase 4 of all three pipelines is ready, the shared vocabulary enables direct cross-referencing — particularly through:
- BCAP ↔ B&T: Heidegger's own development (1924 → 1927)
- BCAP ↔ Rickert: Shared Aristotelian sources (rhetoric, pathos, practical life)
- B&T ↔ Rickert: Shared Heideggerian concepts (being-in-the-world, attunement, dwelling, care)
