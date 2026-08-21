# Heidegger *Basic Concepts of Aristotelian Philosophy* Analysis Pipeline — Living Plan

**Status**: Phase 0 DONE | Phase 1 DONE | Phase 2 DONE | Phase 3 DONE | Phase 4 PARKED
**Created**: 2026-03-08
**Last Updated**: 2026-03-08

### Execution Summary (2026-03-08)

| Phase | Units | Agents | Key Outputs |
|-------|-------|--------|-------------|
| Phase 0 | 1 | 1 | Overview, 26 provisional Greek terms, 8 theses, 5 candidate tensions |
| Phase 1 | 13 JSONs + manifest | Direct write | Metadata skeletons, verified +15 PDF offset |
| Phase 2 | 13 unit analyses | 13 parallel agents | ~180 positions, ~300+ Greek terms, ~250+ edges, ~60 tensions |
| Phase 3 | Synthesis | 2 parallel agents | 42-concept matrix, 87 global edges, 7 productive tensions, 65-entry Greek appendix, 4 Mermaid graphs |

**Phase 3 deliverables**: book-level-ontology.md, global-edges.csv, tension-edges.json, concept-matrix.csv, bcap-greek-appendix.md/.json, 4 .mmd graphs (global, basic-concepts, practical-life, bridge)
**Source PDF**: `corpus/rhetorical_ontology/Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf`
**Edition**: Translated by Robert D. Metcalf and Mark B. Tanzer. Indiana University Press, 2009. GA 18.
**Existing Ingest**: 169 chunks in ChromaDB (doc_id `5fb2739afb848857`, collection `rhetorical_ontology`)
**Related**: `docs/dissertation/sections/incomplete/section-3-aristotle-heidegger-integration.pdf` (existing dissertation draft engaging BCAP)

---

## Book Structure (from TOC, verified against PDF)

The 2009 English translation organizes the course by **Parts → Chapters → §-sections**, not individual dated lectures. There are 28 §-sections across 2 Parts plus an Introduction.

### I. The Text of the Lecture on the Basis of Student Writings

| Unit | §§ | Title | Pages | Est. PDF Pages |
|------|-----|-------|-------|----------------|
| **Introduction** | §1–§2 | The Philological Purpose of the Lecture and Its Presuppositions | 3–7 | 16–20 |
| | | | | |
| **FIRST PART** | | **Preliminary Understanding as to the Indigenous Character of Conceptuality by Way of an Explication of Being-There as Being-in-the-World: An Orientation toward Aristotelian Basic Concepts** | | |
| FP Ch 1 | §3–§8 | Consideration of Definition as the Place of the Explicability of the Concept and the Return to the Ground of Definition | 9–31 | 22–44 |
| FP Ch 2 | §9–§12 | The Aristotelian Definition of the Being-There of the Human Being as ζωή πρακτική in the Sense of a ψυχῆς ἐνέργεια | 32–70 | 45–83 |
| FP Ch 3 | §13–§22 | The Interpretation of the Being-There of Human Beings with regard to the Basic Possibility of Speaking-with-One-Another Guided by Rhetoric | 71–181 | 84–194 |
| | | | | |
| **SECOND PART** | | **Retrieving Interpretation of Aristotelian Basic Concepts on the Basis of the Understanding of the Indigenous Character of Conceptuality** | | |
| SP Ch 1 | §23–§24 | The Being-There of Human Beings as the Indigenous Character of Conceptuality | 183–191 | 196–204 |
| SP Ch 2 | §25–§28 | Interpretation of the Cultivation of the Concept of κίνησις as a Radical Grasping of the Interpretedness of Being-There | 192–222 | 205–235 |

### II. Handwritten Manuscript Notes (pp. 225–265)

Fragmentary manuscript notes on individual §-sections. Supplementary material.

### III. Appendix (pp. 269–272) + Editors' Afterword (p. 273)

### §-Section Detail

| § | Title | Pages | Key Greek/Concepts |
|---|-------|-------|--------------------|
| §1 | Philological Purpose of the Lecture | 3 | conceptuality, basic concepts |
| §2 | Presuppositions of the Philological Purpose | 4–7 | philosophy, demarcation |
| §3 | Determination of the Concept through Doctrine of Definition in Kant's Logic | 9–10 | definition, Kant |
| §4 | Aspects of Conceptuality of Aristotle's Basic Concepts | 11–12 | conceptuality, indigenous character |
| §5 | Return to the Ground of Definition | 13–14 | predicables, ὁρισμός, λόγος οὐσίας |
| §6 | Preliminary Clarification of λόγος | 15–16 | λόγος |
| §7 | Οὐσία as the Basic Concept of Aristotelian Philosophy | 17–25 | οὐσία, beings, being-characters, Metaphysics Δ8 |
| §8 | Ὁρισμός as Determinate Mode of Being-in-the-World | 26–31 | ὁρισμός, being-in-the-world |
| §9 | Being-There as ψυχή: Speaking-Being and Being-with-One-Another | 32–45 | ψυχή, λόγον ἔχειν, φωνή, ζῷον λόγον ἔχον, Das Man, Politics A2, Rhetoric A6/11 |
| §10 | Being-There as ἐνέργεια: The ἀγαθόν | 46–54 | ἐνέργεια, ἀγαθόν, τέχνη, πολιτική, NE A1–4 |
| §11 | The τέλειον (Metaphysics Δ16) | 55–62 | τέλειον, τέλος, limit |
| §12 | Continuing the Consideration of ἀγαθόν (NE A5–6) | 63–70 | ἀγαθόν, ἁπλῶς τέλειον, ἀρετή, ψυχῆς ἐνέργεια |
| §13 | Speaking-Being as Ability-to-Hear and Possibility of Falling | 71–77 | λόγον, falling, De Anima B4 |
| §14 | Basic Determination of Rhetoric and λόγος as πίστις | 78–92 | πίστις, rhetoric, ἦθος, πάθος, λόγος, Rhetoric A1–3 |
| §15 | Δόξα (NE Z10, Γ4) | 93–108 | δόξα, ζήτησις, ἐπιστήμη, φαντασία, πρόβλημα, πρότασις, Topics A4/10–11 |
| §16 | Ἦθος and πάθος as πίστεις (Rhetoric B1, NE B4) | 109–115 | ἦθος, πάθος, πίστις |
| §17 | Ἕξις (Metaphysics Δ23/20, NE B1–5) | 116–128 | ἕξις, ἀρετή, μεσότης, καιρός |
| §18 | Πάθος: General Meanings and Role in Being-There (Metaphysics Δ21, De Anima A1) | 129–139 | πάθος, ἕξις, εἶδος, ὕλη, φυσικός |
| §19 | The φυσικός and His Manner of Treating ψυχή (De Part. An. A1) | 140–161 | φυσικός, ἐπιστήμη, θεωρία, παιδεία, φύσει γινόμενα, τέχνη |
| §20 | Πάθος as ἡδονή and λύπη (NE K1–5) | 162–166 | ἡδονή, λύπη, πάθος |
| §21 | Φόβος (Rhetoric B5) | 167–175 | φόβος, φοβερά, σημεῖα, πάθη |
| §22 | Supplements to the Explication of Being-There as Being-in-the-World | 176–181 | ἕξις, ἀληθεύειν, NE Δ12–13, world of nature |
| §23 | Showing the Possibility of Conceptuality | 183–184 | conceptuality, intelligibility |
| §24 | The Double Sense of the Possibility of Conceptuality in Being-There | 185–191 | fore-having, fore-sight, fore-grasp, νοῦς, διανοεῖσθαι |
| §25 | Aristotelian Physics as ἀρχή-Research | 192–194 | ἀρχή, Physics |
| §26 | Movement as ἐντελέχεια τοῦ δυνάμει ὄντος (Physics Γ1) | 195–212 | ἐντελέχεια, ἐνέργεια, δύναμις, στέρησις, categories, Physics Γ1 |
| §27 | Movement as ἀόριστον (Physics Γ2) | 213–216 | ἀόριστον, ἑτερότης, ἀνισότης, μὴ ὄν, ἀτελής, ἔργον |
| §28 | Movement as ἐνέργεια τοῦ δυνάμει ποιητικοῦ καὶ παθητικοῦ (Physics Γ3) | 217–222 | ἐνέργεια, πρός τι, ποίησις, πάθησις |

> **PDF page offset**: **Verified +15** (book page + 15 = PDF page). Confirmed: book p.3 = PDF p.18, book p.4 = PDF p.19, book p.5 = PDF p.20. The front matter occupies PDF pages 1–17 (cover, half-title, series, title, copyright, TOC v–x, Translators' Preface xi–xii, section divider "I.", blank).

---

## Analysis Unit Groupings

First Part Chapter 3 spans ~111 pages (§13–§22) and must be subdivided. The 28 §-sections are grouped into **13 analysis units** to match the proven Rickert pipeline scale (~10-15 units):

| Unit ID | §§ | Label | Pages | ~Page Count |
|---------|-----|-------|-------|-------------|
| U-Intro | §1–§2 | Introduction: Philological Purpose | 3–7 | 5 |
| U-FP1a | §3–§5 | Definition, Predicables, Ground of Definition | 9–14 | 6 |
| U-FP1b | §6–§8 | Logos, Ousia, Horismos as Being-in-the-World | 15–31 | 17 |
| U-FP2a | §9–§10 | Zōē Praktikē: Psychē, Logos, Agathon | 32–54 | 23 |
| U-FP2b | §11–§12 | Teleion and Agathon (cont.) | 55–70 | 16 |
| U-FP3a | §13–§14 | Speaking-Being, Rhetoric, Pistis | 71–92 | 22 |
| U-FP3b | §15–§16 | Doxa, Ethos/Pathos as Pisteis | 93–115 | 23 |
| U-FP3c | §17–§18 | Hexis, Pathos (general meanings) | 116–139 | 24 |
| U-FP3d | §19–§20 | Phusikos, Hēdonē/Lupē | 140–166 | 27 |
| U-FP3e | §21–§22 | Phobos, Supplements to Being-in-the-World | 167–181 | 15 |
| U-SP1 | §23–§24 | Conceptuality and Its Double Sense | 183–191 | 9 |
| U-SP2a | §25–§26 | Physics as Archē-Research; Kinēsis as Entelecheia | 192–212 | 21 |
| U-SP2b | §27–§28 | Movement as Aoriston and Energeia | 213–222 | 10 |

**Total**: 13 units, ~218 pages of primary text.

**Micro-unit**: U-MS (Handwritten Manuscript, pp. 225–265) — restricted "delta" analysis only. Template limited to: (1) doctrines or Greek usages that diverge from the main text, (2) additional Greek terms not found in student-notes text, (3) any positions that contradict or significantly extend the main lecture. NOT a full ontology analysis — just a difference file. This prevents silent ignoring without doubling work.

---

## Phase 0 — Global Overview

### Goal
Produce a bird's-eye map of BCAP before detailed work begins.

### Input
Translators' Preface (pp. xi–xii) + Introduction §1–§2 (pp. 3–7) + TOC structure above.

### Deliverables
1. **Course overview**: 2–3 paragraphs on the course's aims — how Heidegger approaches Aristotle's basic concepts, relation to *Being and Time*, the 1922 "Natorp Report" as precursor.
2. **Provisional Greek concept list**: 15–25 key Greek/Aristotelian concepts expected to appear (οὐσία, φύσις, κίνησις, ἐνέργεια, δύναμις, λόγος, ἀλήθεια, πάθος, φρόνησις, ψυχή, ἕξις, τέχνη, δόξα, φόβος, ἡδονή/λύπη, πίστις, ἦθος, etc.)
3. **Provisional claims list**: 5–10 main theses Heidegger appears to defend about Aristotle.
4. **Candidate tensions**: 3–5 tensions to watch (e.g., Heidegger's reading vs. Aristotle's text, ontological vs. ethical registers).
5. **PDF page offset verification**: Read a known page, confirm offset.

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 0.1 | Read PDF pages ~16–20 (est. book pp. 3–7), verify offset | |
| 0.2 | Read Translators' Preface (PDF pp. 12–13) | |
| 0.3 | Produce overview + provisional lists | |
| 0.4 | Write to `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase0-overview.md` | |

### Output Location
`corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase0-overview.md`

### Decision Log — Phase 0

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-08 | Phase 0 added (mirrors Rickert pipeline) | Proven effective: seeds concept tracking, catches motifs TOC doesn't foreground |
| 2026-03-08 | Offset verification made explicit step | Rickert offset was wrong in initial estimate; verifying early prevents cascading errors |

---

## Phase 1 — Ingestion & Structuring (Metadata-Only Skeletons)

### Goal
Structured metadata corpus of BCAP with § numbering, section headings, page ranges, and tags. **No full text extraction** — content filtering blocks copyrighted Heidegger translations (same constraint as Rickert pipeline). Text will be read on-the-fly from the PDF during Phase 2.

### Output Format
```json
{
  "part": "First Part",
  "chapter": "Chapter 1",
  "unit_id": "U-FP1a",
  "sections": [
    {
      "section_id": "§3",
      "heading": "The Determination of the Concept through the Doctrine of Definition in Kant's Logic",
      "pages": "9-10",
      "pdf_pages": "22-23",
      "tags": ["definition", "Kant", "concept", "logic"],
      "subsections": [],
      "greek_terms_expected": ["ὁρισμός"]
    }
  ],
  "note": "Full text not stored due to content filtering. Read PDF pages on-the-fly for analysis."
}
```

**Key schema differences from Rickert**:
- `unit_id` instead of `chapter_id` (analysis units group multiple §-sections)
- `section_id` uses § numbering from the edition (§1, §2, ... §28)
- `subsections` array for the a), b), c), α., β., γ. structure visible in the TOC
- `greek_terms_expected` seeded from TOC (many Greek terms appear in TOC headings)
- No `text`, `endnotes`, or `block_quotes` fields (content filtering)

### Output Location
`corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/` — one JSON file per analysis unit plus a manifest.

### Planned Files

```
corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/
├── manifest.json
├── u-intro.json          (§1–§2)
├── u-fp1a.json           (§3–§5)
├── u-fp1b.json           (§6–§8)
├── u-fp2a.json           (§9–§10)
├── u-fp2b.json           (§11–§12)
├── u-fp3a.json           (§13–§14)
├── u-fp3b.json           (§15–§16)
├── u-fp3c.json           (§17–§18)
├── u-fp3d.json           (§19–§20)
├── u-fp3e.json           (§21–§22)
├── u-sp1.json            (§23–§24)
├── u-sp2a.json           (§25–§26)
└── u-sp2b.json           (§27–§28)
```

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 1.1 | Create output directories | |
| 1.2 | Write 13 unit JSON skeletons using TOC data + verified offset | |
| 1.3 | Build manifest.json | |
| 1.4 | Spot-check: confirm page ranges against PDF | |

### Quality Checks
- [ ] All 28 §-sections accounted for across 13 unit files
- [ ] Page numbers match TOC
- [ ] PDF page numbers use verified offset
- [ ] Greek terms from TOC headings seeded into `greek_terms_expected`
- [ ] Subsection structure (a, b, c, α, β, γ) captured where visible in TOC
- [ ] Special characters preserved (Greek Unicode)

### Decision Log — Phase 1

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-08 | Metadata-only skeletons (no text extraction) | Content filtering blocks copyrighted text; proven approach from Rickert |
| 2026-03-08 | §-numbering as primary IDs (not "L01" lecture IDs) | The 2009 edition uses §1–§28, not individual dated lectures; match the source |
| 2026-03-08 | 13 analysis units (not 28 individual §-analyses) | §3 is 2 pages, §9 is 14 pages — unit granularity varies too much; grouping to ~10-25 pages/unit matches Rickert pipeline scale |
| 2026-03-08 | Greek token detection deferred to Phase 2 | Can't run automated detection without extracted text; agents note Greek terms during on-the-fly PDF reading |
| 2026-03-08 | `greek_terms_expected` seeded from TOC | TOC contains abundant Greek — captures most key terms without needing text extraction |

---

## Phase 2 — Heidegger-Only Analysis (Per-Unit)

### Goal
Reconstruct Heidegger's phenomenological-hermeneutic reading of Aristotle, unit by unit, with explicit tracking of Greek concepts and their roles.

### System Role (Analysis Agent)

```
You are a specialist in Heidegger and Aristotle analyzing Martin Heidegger's
Basic Concepts of Aristotelian Philosophy (1924 Marburg lectures, GA 18).

Your task is to reconstruct Heidegger's interpretation of Aristotle's basic
concepts as rigorously and charitably as possible, without comparing it to
other frameworks unless Heidegger himself does so.

Focus especially on how he treats Greek terms and Aristotelian concepts
(e.g. ousia, phusis, kinēsis, energeia, dunamis, logos, pathos, psuchē,
phronēsis, etc.) and how these feed into notions like being-in-the-world,
Dasein, care, attunement, worldhood.

Prefer explicit structures (lists, tables, JSON edges, graph formats) and
always mark interpretive extrapolations with [INTERP-high] or [INTERP-low].
```

### Per-Unit Analysis Template

For each of the 13 analysis units, produce:

#### Section 1: Unit Metadata
- Unit ID, part/chapter, §-sections covered, page range
- One-sentence unit thesis in Heidegger's terms

#### Section 2: Hierarchical Outline
- 2–4 top-level sections with labels capturing main moves (clarification of a basic concept, destruction/genealogy, phenomenological re-reading, link to factical life)
- For each section: 2–6 bullets describing what Heidegger is doing conceptually

#### Section 3: Key Concepts (Heidegger on Aristotle)
For each major concept in this unit:

| Field | Description |
|-------|-------------|
| `name` | Canonical name (e.g., "kinēsis", "phronēsis", "logos") |
| `greek_form` | Unicode Greek and/or normalized transliteration |
| `definition` | Paraphrased as Heidegger uses it here |
| `type` | {ontological, existential, ethical, logical, rhetorical, methodological, other} |
| `dependencies` | Earlier concepts this depends on |
| `function` | {setup, critique, positive_proposal, bridge, example} |
| `pages` | Page anchors |

**Cross-unit target concept list** (track across all units; update from Phase 0):
οὐσία, φύσις, κίνησις, ἐνέργεια/ἐντελέχεια, δύναμις, λόγος, ἀλήθεια, πάθος, ψυχή, φρόνησις, τέχνη, νοῦς, δόξα, φόβος, ἡδονή/λύπη, πίστις, ἦθος, ἕξις, ἀρετή, ἀγαθόν, τέλος/τέλειον, ὁρισμός, εἶδος, ὕλη, ζωή πρακτική, φαντασία, παιδεία, καιρός, ἀρχή, στέρησις

Plus Heideggerian terms: being-in-the-world, Dasein/being-there, care, attunement, worldhood, The One (Das Man), fore-having/fore-sight/fore-grasp, falling, factical life

#### Section 4: Main Positions & Arguments

| Field | Description |
|-------|-------------|
| `id` | Unit-prefixed ID (e.g., U-FP1a-P1, U-FP3b-P2) |
| `claim` | Concise statement of the position |
| `premises` | Key premises → conclusion |
| `aristotelian_texts` | Specific Aristotelian works/passages referenced |
| `status` | {core_course_thesis, local_support, methodological, illustrative} |

#### Section 4a: Key Interlocutors & What Heidegger Does with Them
For each major interlocutor in this unit (Aristotle primarily, but also Plato, Kant, Husserl, etc.):
- **Name**
- **Role**: What conceptual work they do in this unit
- **Key borrowings**: What Heidegger takes
- **Key departures**: Where Heidegger breaks or re-reads
- **Aristotelian texts cited**: Specific works and passages

#### Section 4b (optional): Anticipations of *Being and Time* `[INTERP]`
**Restricted to**: Second Part units (U-SP1, U-SP2a, U-SP2b) and U-FP2b, U-FP3a only. For all other units, return the default line below.

**Guard**: Only fill this in if Heidegger himself uses language clearly echoed in *Being and Time* (e.g., being-in-the-world, falling, care, fore-having/fore-sight/fore-grasp). Do NOT speculate about structural parallels that Heidegger does not himself signal. Otherwise return:
> "No explicit BT anticipation in this unit."

When filled: 2–4 bullet points on how this material feeds into BT.

#### Section 5: Tensions & Open Questions
- Internal tensions (e.g., where Heidegger's reading strains the Aristotle text, or where multiple senses of a Greek term are in play)
- Each tension linked to specific positions/concepts by ID
- Marked `[INTERP-high]` or `[INTERP-low]`

#### Section 6: Greek Terms Encountered
List of all Greek terms encountered in this unit's PDF pages:

```json
[
  {
    "greek_form": "οὐσία",
    "transliteration": "ousia",
    "pages": ["17", "18", "19", "20", "22", "25"],
    "translation_in_text": "being / beingness",
    "translation_status": "partially glossed"
  }
]
```

`translation_status` (per-unit): {explicitly_translated, translated_in_note, left_untranslated, partially_glossed}

Note: `translation_status` is recorded **per-unit** in Phase 2. The same term may be explicitly translated in one unit and left untranslated in another. Phase 3D aggregates these into a `translation_status_summary` string (e.g., "explicitly_translated in U-FP2a, partially_glossed elsewhere").

**Condensed table format**: For units where many Greek terms repeat from earlier analyses, Section 6 may use a compact table (term | pages | status) rather than full JSON objects. Every term must still be listed — no "see previous unit" cross-references, as analyses should be independently readable.

This feeds Phase 3D (Greek Appendix).

#### Section 7: Local Graph Edges
Relations vocabulary (controlled set):
`depends_on`, `contrasts_with`, `refines`, `presupposes`, `explains`, `operationalizes`, `supports`, `undermines`, `exemplifies`, `historicizes`

`edge_domain`: {ontological, existential, rhetorical, logical, genealogical, methodological}

```json
[
  {
    "source": "CONCEPT:Kinēsis",
    "target": "CONCEPT:Phusis",
    "relation": "depends_on",
    "edge_domain": "ontological",
    "note": "phusis is understood in terms of kinēsis as bringing-forth"
  }
]
```

Self-loops allowed with relations {shifts, refines, complexifies} and non-trivial notes.

### Output Location
`corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/` — one Markdown per analysis unit.
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-intro.md`
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp1a.md`
- ... through ...
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-sp2b.md`

### Execution Method

**Single pass** (lighter units: U-Intro, U-FP1a, U-FP1b, U-FP2b, U-FP3e, U-SP1, U-SP2b, U-MS):
Read PDF pages on-the-fly → produce full analysis in one pass.

**Mandatory two-pass JSON-first** (all dissertation-critical units: U-FP2a, U-FP3a, U-FP3b, U-FP3c, U-FP3d, U-SP2a):
These are the densest sections and the ones most likely to be cited in the dissertation. Hard rule — no single-pass on these.
- Pass 1: Outline + key concepts + Greek terms (JSON-structured)
- Pass 2: Positions/tensions/edges + narrative, using Pass 1 output as context

This increases calls slightly but reduces rework on the material that matters most.

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 2.1 | Create output directory `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/` | |
| 2.2–2.14 | Analyze units U-Intro through U-SP2b (13 units, parallelized) | |
| 2.15 | Cross-check: verify all target Greek concepts appear at least once | |
| 2.16 | Compile master concept table (concept → units where it appears) | |
| 2.17 | Compile master interlocutor table (mainly Aristotelian texts cited) | |

### Quality Checks
- [ ] Every analysis includes all 7 sections (4b optional)
- [ ] Position IDs are unique and unit-prefixed
- [ ] Concept definitions are *Heidegger's usage*, not standard Aristotle scholarship
- [ ] Greek forms include both Unicode and transliteration
- [ ] `translation_status` populated for every Greek term in Section 6
- [ ] Interpretive extrapolations marked `[INTERP-high/low]`, consolidated in Section 5
- [ ] No comparisons to your own framework
- [ ] Edge relations use only the controlled vocabulary
- [ ] Each edge includes `edge_domain` classification
- [ ] Each unit produces 10–20 edges minimum
- [ ] Aristotelian texts cited are specific (NE A1, Rhetoric B5, Physics Γ1, etc.)

### Decision Log — Phase 2

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-08 | `greek_form` field added to concept schema | Central to reconstructing Heidegger's philological method |
| 2026-03-08 | Section 6 (Greek Terms Encountered) added | Feeds Phase 3D appendix; captures translation_status metadata |
| 2026-03-08 | `edge_domain` includes both `existential` and `rhetorical` | BCAP covers both: Rhetoric B is a major section, and existential analysis runs throughout |
| 2026-03-08 | `aristotelian_texts` field in positions | Heidegger's arguments are tied to specific Aristotle passages; tracking these is essential |
| 2026-03-08 | Section 4b: BT anticipations made optional with [INTERP] | Anachronistic readings are tempting but distortive; only note when Heidegger himself signals |
| 2026-03-08 | 2-pass exception for U-FP3a, U-FP3b, U-FP3d | Densest units (rhetoric, doxa, phusikos) at 22–27 pages each |
| 2026-03-08 | 13 analysis units, not 28 individual §-analyses | Matches proven Rickert pipeline scale; prevents thin analyses on 2-page sections |
| 2026-03-08 | **Mandatory two-pass expanded** to all FP Ch 3 units + U-FP2a + U-SP2a | User feedback: these are dissertation-critical sections; single-pass risks rework on most-cited material |
| 2026-03-08 | BT anticipation guard tightened to SP units + U-FP2b/U-FP3a only | User feedback: structural echoes only in Second Part + specific First Part units |
| 2026-03-08 | Greek Section 6: condensed table format allowed, no cross-references | User feedback on redundancy concern; compromise preserves independent readability |
| 2026-03-08 | U-MS promoted to micro-unit with "delta" template | User feedback: silent ignoring worse than light pass; restricted to divergences only |

---

## Phase 3 — Course-Level Ontology, Graph, and Greek Appendix

### Goal
Synthesize all unit analyses into a unified Heidegger-on-Aristotle ontology and generate a Greek appendix.

### Deliverables

#### 3A: Canonical Node List (Heidegger's Basic Concepts)
Merge unit concepts into canonical nodes. For each:

| Field | Description |
|-------|-------------|
| `canonical_name` | e.g., "Kinēsis" |
| `greek_lemma` | Unicode Greek (if applicable); links to appendix |
| `type` | {concept, position, method, example} |
| `definition` | 2–3 sentence definition in Heidegger's sense |
| `units` | List of analysis units where it appears |
| `aliases` | Alternative terms/translations |
| `centrality` | {core, important, peripheral} |

Expected core nodes (~10): οὐσία, κίνησις, ἐνέργεια/ἐντελέχεια, δύναμις, λόγος, πάθος, ψυχή, ἕξις, being-in-the-world, being-there (Dasein)
Expected important nodes (~10-15): φύσις, ἀλήθεια, δόξα, πίστις, ἀγαθόν, τέλος/τέλειον, ὁρισμός, φόβος, ἡδονή/λύπη, ἀρετή, τέχνη, ζωή πρακτική, φαντασία, The One (Das Man), care
Expected peripheral nodes (~5-10): εἶδος, ὕλη, στέρησις, παιδεία, καιρός, ποίησις, ἀρχή

#### 3B: Global Edge List and Thematic Sub-Graphs
Merge and de-duplicate edges. Generate at minimum:

1. **"Basic Concepts" sub-graph**: Relations among οὐσία, κίνησις, ἐνέργεια, ἐντελέχεια, δύναμις, φύσις, στέρησις — the ontological core from the Second Part.
2. **"Practical Life" sub-graph**: Relations among πάθος, ψυχή, ἕξις, πίστις, δόξα, ἀγαθόν, ἀρετή, φρόνησις, φόβος, ἡδονή/λύπη — the existential-rhetorical material from First Part Chapters 2–3.
3. **"Phenomenological Bridge" sub-graph**: How Aristotelian concepts connect to Heideggerian notions (being-in-the-world, Dasein, care, The One, falling, attunement). **Constrained to max 20 edges**, selected for both strength and conceptual diversity: "Select up to 20 bridge edges that collectively cover as many distinct Aristotelian concepts and Heideggerian notions as possible, rather than clustering on a single hub like 'being-in-the-world'." This ensures the bridge graph remains compact but surfaces structurally interesting peripheral edges (e.g., φόβος → attunement), not just the obvious high-degree connections.

#### 3C: Tension Layer
Same structure as Rickert: node pairs with both dependency + conflict edges → productive tensions.

#### 3D: Contested/Unstable Nodes
Nodes whose Heidegger-reading shifts across the course.

#### 3E: Course Trajectory Narrative
2–3 paragraphs on how the course proceeds:
1. **Introduction + First Part Ch 1**: Methodological framing — why Aristotle, what "basic concepts" means, the ground of definition in being-in-the-world.
2. **First Part Chs 2–3**: The long middle — Aristotle's practical life (zōē praktikē), rhetoric (pistis, pathos, phobos), hexis, doxa. This is where Heidegger builds his case that Aristotle's "basic concepts" are rooted in the everyday being-there of human beings.
3. **Second Part**: The payoff — kinēsis, energeia, entelecheia, dunamis. How movement is the key to Aristotle's ontology and how this anticipates BT's temporality.

#### 3F: Greek Appendix (KEY NEW ELEMENT)

**Aggregation**: Collect all `greek_form` entries and Section 6 Greek term lists across all 13 unit analyses. Merge into canonical lemma entries.

**Per-lemma entry structure**:
```json
{
  "lemma": "kinēsis",
  "greek_unicode": "κίνησις",
  "forms_encountered": ["κίνησις", "κινήσεως", "kinēsis", "kinesis"],
  "conventional_translations": ["movement", "motion", "change"],
  "heidegger_usage": "Heidegger reads kinēsis as the fundamental character of being for Aristotle — not mere locomotion but the being-underway of beings toward their entelecheia. Kinēsis names the unfinished, the not-yet-at-its-end, the atelēs.",
  "key_aristotelian_loci": ["Physics Γ1 (201a10)", "Physics Γ2", "Physics Γ3"],
  "units": ["U-SP2a", "U-SP2b"],
  "pages": ["195-216"],
  "translation_status_by_unit": {"U-SP2a": "partially_glossed", "U-SP2b": "left_untranslated"},
  "translation_status_summary": "partially_glossed in U-SP2a, left_untranslated in U-SP2b",
  "canonical_node_link": "CONCEPT:Kinēsis (core/ontological)",
  "notes": ""
}
```

**Translation status taxonomy**:
- `explicitly_translated`: Metcalf/Tanzer give a clear English rendering
- `translated_in_note`: Translation appears in translator's note or footnote
- `left_untranslated`: Greek term used without English equivalent
- `partially_glossed`: Sometimes translated, sometimes left in Greek

**Output files**:
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/bcap-greek-appendix.md` — human-readable, citable
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/bcap-greek-appendix.json` — structured dictionary

#### 3G: Concept × Unit Matrix
Same format as Rickert's concept × chapter matrix.

#### 3H: Exportable Graph Views
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/bcap-graph-global.mmd` — Full course Mermaid graph
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/bcap-graph-basic-concepts.mmd` — Ontological core sub-graph
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/bcap-graph-practical-life.mmd` — Existential-rhetorical sub-graph
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/bcap-graph-bridge.mmd` — Aristotle→Heidegger bridge sub-graph

### Output Location
```
corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/
├── phase0-overview.md
├── phase2-u-intro.md ... phase2-u-sp2b.md    (13 unit analyses)
├── book-level-ontology.md                      (3A–3E)
├── book-level-ontology.json
├── global-edges.csv                            (with edge_domain)
├── tension-edges.json
├── contested-nodes.md
├── concept-matrix.csv
├── bcap-greek-appendix.md                      (3F — KEY)
├── bcap-greek-appendix.json
├── bcap-graph-global.mmd
├── bcap-graph-basic-concepts.mmd
├── bcap-graph-practical-life.mmd
└── bcap-graph-bridge.mmd
```

### Execution Steps

| Step | Action | Status |
|------|--------|--------|
| 3.1 | Collect all unit Greek term lists (Section 6 data) | |
| 3.2 | **Aggregate Greek terms → provisional lemma list** | |
| 3.3 | Merge concepts → canonical node list with centrality + greek_lemma (informed by lemma list from 3.2) | |
| 3.4 | Collect all unit edge JSONs | |
| 3.5 | Merge + de-duplicate edges → global edge list | |
| 3.6 | Generate thematic sub-graphs (basic concepts, practical life, bridge — max 15-20 edges each) | |
| 3.7 | Run tension detector on global edges | |
| 3.8 | Identify contested/unstable nodes | |
| 3.9 | Build concept × unit matrix | |
| 3.10 | Write course trajectory narrative | |
| 3.11 | **Complete Greek appendix** (fill remaining fields from provisional lemmas created at 3.2, now linked to canonical nodes) | |
| 3.12 | Generate Mermaid graphs (global + 3 sub-graphs) | |
| 3.13 | Export CSV edge list | |
| 3.14 | Validate graph integrity | |

### Quality Checks
- [ ] All target Greek concepts appear in canonical node list AND appendix
- [ ] Every appendix lemma links back to a canonical node
- [ ] Every canonical node with `greek_lemma` links to an appendix entry
- [ ] `translation_status` populated for every appendix entry
- [ ] `key_aristotelian_loci` are specific (book, chapter, Bekker numbers where possible)
- [ ] No orphan nodes in any graph
- [ ] All 4 Mermaid graphs render without errors
- [ ] Macro-trajectory covers both Parts and the methodological→ontological arc
- [ ] Tension layer captures at least 3–5 productive tensions
- [ ] No references to your own framework

### Decision Log — Phase 3

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-08 | Greek appendix as Phase 3D (not Phase 1) | Requires Phase 2 analysis to populate Heidegger's usage; Phase 1 can only seed expected terms from TOC |
| 2026-03-08 | Three thematic sub-graphs (not two) | Added "Phenomenological Bridge" sub-graph to capture the Aristotle→Heidegger translation moves explicitly |
| 2026-03-08 | `translation_status` taxonomy with 4 levels | Captures where the English translation leaves Greek "foreign" — directly useful for your scholarly work |
| 2026-03-08 | `canonical_node_link` in appendix entries | Bidirectional linking between appendix and ontology prevents drift |
| 2026-03-08 | `key_aristotelian_loci` with Bekker numbers where possible | Heidegger cites specific passages; tracking these enables cross-reference with your own Aristotle work |
| 2026-03-08 | Greek aggregation moved to steps 3.1–3.2 (before node creation) | User feedback: lemma list should drive canonical node list, not follow it |
| 2026-03-08 | `translation_status` changed to per-unit + summary | User feedback: same term may shift treatment across units; single field flattens variation |
| 2026-03-08 | Bridge sub-graph capped at 15–20 edges | Prevents duplication of global graph; select by structural importance |

---

## Phase 4 — Deferred Integration (PARKED)

### Status: DO NOT EXECUTE until architectonic is ready.

### Future Trigger
This phase activates when you provide:
1. The BCAP ontology + Greek appendix from Phases 2–3
2. A structured description of your own Aristotelian framework (e.g., on kinēsis, phusis, time, aisthēsis, logos, phantasia)

### Template (parked)

```
You will receive:
(a) The course-level ontology of Heidegger's Basic Concepts of Aristotelian
    Philosophy (Phases 2–3 output), including the Greek appendix
(b) A structured description of [your] Aristotelian/rhetorical framework

Your task:
1. MAPPING TABLE: For each node in the BCAP ontology, identify the closest
   analog in [your] framework (or mark "no direct analog").
   For each mapping, tag with one or more of: INFORMS, DISTORTS, EXTENDS,
   REORIENTS. Multiple tags per mapping are expected — a single reading
   (e.g., phronēsis) may both INFORM and REORIENT relative to your framework.
   Specify which level(s) of [your] architectonic the node touches.

2. GREEK CROSS-REFERENCE: For each Greek term in the BCAP appendix,
   compare Heidegger's reading to your own usage/interpretation.
   Flag cases where Heidegger's phenomenological re-reading opens
   possibilities vs. cases where it forecloses them.

3. ZONES OF ALIGNMENT: Where the two frameworks agree.
   - Shared Aristotelian sources and readings
   - Compatible phenomenological/ontological commitments
   - Mutual concepts (e.g., pathos, kinēsis, energeia)

4. ZONES OF CONFLICT: Where they diverge.
   - Different readings of the same Greek terms
   - Contradictory positions on Aristotle
   - Heidegger's ontologization vs. your own register

5. INTEGRATION MOVES:
   - Direct adoption: Heidegger's reading maps cleanly onto your framework
   - Critical appropriation: take the reading but correct for Heidegger's
     specific distortions (e.g., his subordination of rhetoric to ontology)
   - Productive contrast: use Heidegger as foil to sharpen your own position
   - Extension: your framework addresses what Heidegger neglects

6. INTEGRATION SCENARIOS (2–3 alternatives):
   - Conservative: cite Heidegger where he supports your readings
   - Dialogical: sustained engagement, showing how your framework emerges
     from and revises Heidegger's Aristotle
   - Critical: foreground where Heidegger's reading fails Aristotle and
     your framework corrects it

Until input (b) is provided, do not speculate about integration.
```

### Output Location (future)
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/integration-map.md`
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/integration-map.json`

### Decision Log — Phase 4

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-08 | Phase 4 parked as template only | User explicitly requested deferred integration |
| 2026-03-08 | INFORMS/DISTORTS/EXTENDS taxonomy for mapping | More specific than Rickert's alignment/conflict; Heidegger's Aristotle readings have a specific character of creative distortion |
| 2026-03-08 | Greek cross-reference added to template | The Greek appendix makes concept-level comparison possible at the philological level |
| 2026-03-08 | "Critical appropriation" as integration move type | Heidegger's readings are too productive to ignore but too tendentious to adopt wholesale |
| 2026-03-08 | REORIENTS added to mapping taxonomy; multi-tagging allowed | User feedback: "distorts" is normatively loaded; some readings reorient rather than distort; single tags per mapping too restrictive |

---

## Appendix A: Global Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-08 | Plan created (5 phases: 0–4) | Mirrors proven Rickert pipeline with BCAP-specific adaptations |
| 2026-03-08 | §-numbering as primary IDs | Matches the 2009 edition's actual structure |
| 2026-03-08 | 13 analysis units (grouped from 28 §-sections) | Proven pipeline scale from Rickert (~10-15 units) |
| 2026-03-08 | Metadata-only Phase 1 (no text extraction) | Content filtering constraint; proven from Rickert |
| 2026-03-08 | Greek tracking deferred to Phase 2, appendix at Phase 3 | Can't extract text for automated detection; agents collect during on-the-fly reading |
| 2026-03-08 | `edge_domain` includes `existential`, `rhetorical`, `logical` | BCAP covers all three registers |
| 2026-03-08 | Three thematic sub-graphs | Matches BCAP's actual content: ontological core, practical life, phenomenological bridge |
| 2026-03-08 | `translation_status` in Greek appendix | Tracks where Metcalf/Tanzer leave terms untranslated — scholarly utility |
| 2026-03-08 | BT anticipations made optional with [INTERP] | Prevents anachronistic readings; only note when structurally unavoidable |
| 2026-03-08 | **Round 2 feedback applied**: mandatory 2-pass expanded, BT guard tightened, Greek aggregation reordered, translation_status graded, REORIENTS added, U-MS as micro-unit, bridge graph capped | User review of initial plan |

## Appendix B: Resource Estimates

| Phase | Units of Work | Approx Context per Unit | Notes |
|-------|--------------|------------------------|-------|
| Phase 0 | 1 prompt | Translators' Preface + §1–§2 (~10 pages) | Single pass |
| Phase 1 | 13 unit JSONs + manifest | TOC data only | Fast; no PDF reading needed |
| Phase 2 | 13 analyses × 1–2 passes | ~15–25 PDF pages/unit | +1 extra pass for U-FP3a, U-FP3b, U-FP3d |
| Phase 3 | 2–3 synthesis passes | All 13 unit analyses | Includes Greek appendix generation |
| Phase 4 | Deferred | — | Requires your framework description |

## Appendix C: File Tree (planned)

```
corpus/
├── index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/                    # Phase 1 output
│   ├── manifest.json
│   ├── u-intro.json
│   ├── u-fp1a.json
│   ├── u-fp1b.json
│   ├── u-fp2a.json
│   ├── u-fp2b.json
│   ├── u-fp3a.json
│   ├── u-fp3b.json
│   ├── u-fp3c.json
│   ├── u-fp3d.json
│   ├── u-fp3e.json
│   ├── u-sp1.json
│   ├── u-sp2a.json
│   └── u-sp2b.json
│
├── index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/                       # Phase 2–3 output
│   ├── phase0-overview.md
│   ├── phase2-u-intro.md
│   ├── phase2-u-fp1a.md
│   ├── ...
│   ├── phase2-u-sp2b.md
│   ├── book-level-ontology.md
│   ├── book-level-ontology.json
│   ├── global-edges.csv
│   ├── tension-edges.json
│   ├── contested-nodes.md
│   ├── concept-matrix.csv
│   ├── bcap-greek-appendix.md           # Phase 3D — KEY
│   ├── bcap-greek-appendix.json
│   ├── bcap-graph-global.mmd
│   ├── bcap-graph-basic-concepts.mmd
│   ├── bcap-graph-practical-life.mmd
│   ├── bcap-graph-bridge.mmd
│   └── integration-map.md              # Phase 4 (future)
```

## Appendix D: Cross-Pipeline Compatibility

This pipeline is designed to be compatible with the Rickert *Ambient Rhetoric* analysis pipeline for future cross-text integration:

| Element | Rickert Pipeline | BCAP Pipeline | Compatible? |
|---------|-----------------|---------------|-------------|
| Edge relations | 10-relation controlled set | Same 10-relation set | ✓ |
| Edge domains | ontological, rhetorical, genealogical, methodological | ontological, existential, rhetorical, logical, genealogical, methodological | ✓ (superset) |
| Concept schema | name, definition, type, dependencies, function, pages | Same + greek_form, greek_lemma | ✓ (superset) |
| Position schema | id, claim, premises, interlocutors, status | Same + aristotelian_texts | ✓ (superset) |
| Tension detection | dependency + conflict on same pair | Same | ✓ |
| Centrality | core/important/peripheral | Same | ✓ |
| Output format | Markdown + JSON + CSV + Mermaid | Same | ✓ |

When Phase 4 of both pipelines is ready, the shared vocabulary enables direct cross-referencing between Rickert's ambient ontology and Heidegger's Aristotelian ontology — particularly through shared Heideggerian concepts (being-in-the-world, attunement, dwelling, Dasein).
