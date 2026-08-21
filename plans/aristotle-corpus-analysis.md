# Aristotle Corpus Analysis Pipeline — Living Plan

**Status**: Phase 0 COMPLETE | Phase 0.5 COMPLETE | Phase 1 COMPLETE | Phase 2 COMPLETE | Phase 3 COMPLETE | Phase 4 COMPLETE | Phase 5 PARKED
**Created**: 2026-03-09
**Last Updated**: 2026-03-09

**Edition**: *The Complete Works of Aristotle: The Revised Oxford Translation*, ed. Jonathan Barnes, Bollingen Series LXXI·2, Princeton University Press, 1984. All PDFs are extracts from this edition.
**Related**: Heidegger BCAP pipeline (Aristotle through Heidegger's lens), Heidegger B&T pipeline (Aristotle as background), Uexküll pipeline (Bauplan/teleology connections).

---

## Pre-Execution Notes

### Corpus Character

This pipeline differs fundamentally from the Rickert, Uexküll, Heidegger B&T, and BCAP pipelines:

- **Multi-work corpus.** Nine separate treatises by a single author, spanning metaphysics, natural philosophy, psychology, rhetoric, and sensory theory. Each work has its own internal structure (Books, Chapters) and argumentative unity, but they cross-reference each other extensively.
- **Bekker pagination is canonical.** All Aristotle scholarship cites by Bekker numbers (e.g., 403a15), not PDF or book pages. The plan uses Bekker ranges throughout. PDF page numbers are recorded for extraction but are secondary.
- **Uniform translation.** All texts use the Revised Oxford Translation (Barnes edition), ensuring terminological consistency across works. This is an advantage over the other pipelines, where each text had a different translator.
- **No German terminology.** Unlike B&T/BCAP/Uexküll, the primary foreign terminology is **Greek**. The Greek Terminology Appendix replaces the German Terminology Appendix from other pipelines.
- **Disputed works.** *On Colours* and *On Things Heard* are traditionally attributed to the Peripatetic school, not securely to Aristotle. They are included as minor/peripheral works but flagged throughout.
- **Scale.** ~553 PDF pages total across 9 works. The 4 major works (Metaphysics, Physics, Rhetoric, De Anima) account for ~487 pages; the 5 minor works account for ~66 pages.

### Thematic Groupings

The 9 works fall into 4 thematic clusters:

1. **First Philosophy** — *Metaphysics* (being qua being, substance, causation, actuality/potentiality)
2. **Natural Philosophy** — *Physics* (nature, motion, causation, time, place, infinity, the unmoved mover)
3. **Psychology & Perception** — *De Anima*, *Sense and Sensibilia*, *On Memory*, *Movement of Animals*, *On Colours*, *On Things Heard* (soul, perception, phantasia, sensation, memory, animal motion)
4. **Rhetoric** — *Rhetoric* (persuasion, pisteis, pathos, ethos, style, arrangement)

These clusters map to different aspects of the dissertation's framework (rhetorical ontology, phantasia, perception, motion).

---

## Works Inventory

| # | Work | Latin/Traditional Title | Bekker Range | PDF Pages | Books/Chapters | Cluster | Priority |
|---|------|------------------------|-------------|-----------|----------------|---------|----------|
| 1 | *Metaphysics* | *Metaphysica* | 980a–1093b | 179 | 14 Books (Α–Ν) | First Philosophy | **HIGH** |
| 2 | *Physics* | *Physica* | 184a–267b | 134 | 8 Books (I–VIII) | Natural Philosophy | **HIGH** |
| 3 | *Rhetoric* | *Ars Rhetorica* | 1354a–1420b | 120 | 3 Books (I–III) | Rhetoric | **HIGH** |
| 4 | *On the Soul* | *De Anima* | 402a–435b | 54 | 3 Books (I–III) | Psychology | **HIGH** |
| 5 | *Sense and Sensibilia* | *De Sensu et Sensibilibus* | 436a–449b | 23 | 7 Chapters | Psychology | MEDIUM |
| 6 | *On Memory* | *De Memoria et Reminiscentia* | 449b–453b | 9 | 2 Chapters | Psychology | MEDIUM |
| 7 | *Movement of Animals* | *De Motu Animalium* | 698a–704b | 12 | 11 Chapters | Psychology | MEDIUM |
| 8 | *On Colours* | *De Coloribus* | 791a–799b | 12 | 6 Chapters | Psychology | LOW (disputed) |
| 9 | *On Things Heard* | *De Audibilibus* | 800a–804b | 10 | 1 Chapter | Psychology | LOW (disputed) |

**PDF locations** (all in `corpus/rhetorical_ontology/`):
- `Aristotle - Metaphysics_(2014)_[My Copy].pdf` (also in `corpus/metaphysics/`)
- `Aristotle - Physics_(2014)_[My Copy].pdf`
- `Aristotle - Rhetoric_(2014)_[Clean Copy].pdf`
- `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`
- `Aristotle - Sense And Sensibilia_(2014)_[Clean Copy].pdf`
- `Aristotle - On Memory_(2014)_[Clean Copy].pdf`
- `Aristotle - Movement Of Animals_(2014)_[My Copy].pdf`
- `Aristotle - On Colours_(2014)_[Clean Copy].pdf`
- `Aristotle - On Things Heard_(2014)_[Clean Copy].pdf`

---

## PDF Offsets

Each PDF is an extract from the Barnes Complete Works. Page 1 of each PDF is the Barnes title page, followed by copyright, then the work's own title/text. Offsets to be confirmed during Phase 0 by matching Bekker numbers to PDF pages.

| Work | Offset Formula | Confirmed? |
|------|---------------|------------|
| Metaphysics | PDF_page = (Bekker - 980) * 1.566 + 3; start: PDF 3 = 980a | Yes (3 landmarks, 24 total) |
| Physics | PDF_page = (Bekker - 184) * 1.590 + 3; start: PDF 3 = 184a | Yes (3 landmarks, 28 total) |
| Rhetoric | PDF_page = (Bekker - 1354) * 1.788 + 3; start: PDF 3 = 1354a | Yes (3 landmarks, 22 total) |
| De Anima | PDF_page = (Bekker - 402) * 1.576 + 3; start: PDF 3 = 402a | Yes (3 landmarks, 21 total) |
| Sense and Sensibilia | PDF_page = (Bekker - 436) * 1.615 + 3; start: PDF 3 = 436a | Yes (2 landmarks, 10 total) |
| On Memory | PDF_page = (Bekker - 449) * 1.750 + 3; start: PDF 3 = 449b | Yes (2 landmarks, 7 total) |
| Movement of Animals | PDF_page = (Bekker - 698) * 1.667 + 3; start: PDF 3 = 698a | Yes (2 landmarks, 7 total) |
| On Colours | PDF_page = (Bekker - 791) * 1.250 + 3; start: PDF 3 = 791a | Yes (2 landmarks, 9 total) |
| On Things Heard | PDF_page = (Bekker - 800) * 2.000 + 3; start: PDF 3 = 800a | Yes (2 landmarks, 5 total) |

---

## Unitization

### Design Principles

1. **Book = natural unit** for major works. Aristotle's Books are self-contained argumentative arcs.
2. **Long Books** (>20 PDF pages) may be split into 2 sub-units at natural chapter boundaries.
3. **Short works** (<15 PDF pages) are a single unit each.
4. **Target**: ~15–25 pages per unit (consistent with other pipelines).
5. **Two-pass** units are dissertation-critical (phantasia, perception, motion, rhetorical proofs, substance, actuality/potentiality).

### Work 1: Metaphysics (14 Books, ~179 PDF pages → 10 units)

| Unit ID | Books | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|-------|-------|-------------|--------|-----------|----------------------|
| META-01 | Α (I) | First Causes and Wisdom | 980a–993a | 16 | No | No |
| META-02 | α (II) + Β (III) | Aporiai and Method | 993a–1003a | 14 | No | No |
| META-03 | Γ (IV) | Being qua Being, Principle of Non-Contradiction | 1003a–1012b | 14 | **Yes** | **Yes** — being qua being, PNC |
| META-04 | Δ (V) | Philosophical Lexicon | 1012b–1025a | 16 | No | No — reference book, but key definitions |
| META-05 | Ε (VI) + Ζ (VII) i–iii | Being and Substance (intro) | 1025a–1029b | 12 | **Yes** | **Yes** — substance, essence |
| META-06 | Ζ (VII) iv–xvii | Substance, Essence, Form, Matter | 1029b–1041b | 18 | **Yes** | **Yes** — form/matter, εἶδος/ὕλη, central to dissertation |
| META-07 | Η (VIII) + Θ (IX) | Actuality and Potentiality | 1042a–1052a | 16 | **Yes** | **Yes** — ἐνέργεια/δύναμις, critical for motion theory |
| META-08 | Ι (X) + Κ (XI) | Unity, Contrariety, Summary | 1052a–1069a | 14 | No | No |
| META-09 | Λ (XII) | Substance and the Unmoved Mover | 1069a–1076a | 10 | **Yes** | **Yes** — unmoved mover, ἐνέργεια as pure actuality |
| META-10 | Μ (XIII) + Ν (XIV) | Mathematics and Forms | 1076a–1093b | 14 | No | No |

### Work 2: Physics (8 Books, ~134 PDF pages → 8 units)

| Unit ID | Books | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|-------|-------|-------------|--------|-----------|----------------------|
| PHYS-01 | I | Principles of Nature | 184a–192b | 16 | No | No |
| PHYS-02 | II | Nature, Causation, Necessity | 192b–200b | 16 | **Yes** | **Yes** — four causes, φύσις, τέχνη vs. φύσις |
| PHYS-03 | III | Motion, Infinity | 200b–208a | 16 | **Yes** | **Yes** — κίνησις definition, ἐντελέχεια τοῦ δυνάμει ὄντος |
| PHYS-04 | IV | Place, Void, Time | 208a–224a | 22 | **Yes** | **Yes** — time, place, now (νῦν), dissertation-critical |
| PHYS-05 | V | Classification of Motion | 224a–231a | 12 | No | No |
| PHYS-06 | VI | Continuity and the Infinite Divisibility of Motion | 231a–241b | 18 | No | No — but connects to time arguments |
| PHYS-07 | VII | Motion and the Mover | 241b–250b | 14 | No | No |
| PHYS-08 | VIII | Eternal Motion and the Prime Mover | 250b–267b | 20 | **Yes** | **Yes** — eternal motion, prime mover, ἐνέργεια |

### Work 3: Rhetoric (3 Books, ~120 PDF pages → 6 units)

| Unit ID | Books/Chapters | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|----------------|-------|-------------|--------|-----------|----------------------|
| RHET-01 | I.1–I.3 | Definition of Rhetoric, Kinds of Proof | 1354a–1359a | 12 | **Yes** | **Yes** — rhetoric defined, pisteis, enthymeme |
| RHET-02 | I.4–I.15 | Topics of Deliberative, Forensic, Epideictic | 1359a–1377b | 24 | No | No |
| RHET-03 | II.1–II.11 | Ethos, Pathos, Emotions | 1377b–1388b | 20 | **Yes** | **Yes** — πάθη, ἦθος, emotional persuasion |
| RHET-04 | II.12–II.26 | Character Types, Common Topics, Enthymeme | 1388b–1403b | 20 | No | No |
| RHET-05 | III.1–III.7 | Style (λέξις), Metaphor, Prose Rhythm | 1403b–1408b | 14 | **Yes** | **Yes** — λέξις, metaphor, πρὸ ὀμμάτων ποιεῖν |
| RHET-06 | III.8–III.19 | Arrangement, Delivery, Conclusion | 1408b–1420b | 18 | No | No |

### Work 4: De Anima (3 Books, ~54 PDF pages → 4 units)

| Unit ID | Books/Chapters | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|----------------|-------|-------------|--------|-----------|----------------------|
| DA-01 | I | History of Soul Theories | 402a–411b | 14 | No | No |
| DA-02 | II.1–II.6 | Definition of Soul, Faculties, Perception General | 412a–418a | 14 | **Yes** | **Yes** — ψυχή definition, ἐντελέχεια ἡ πρώτη |
| DA-03 | II.7–II.12 | The Five Senses, Common Sensibles | 418a–424b | 14 | **Yes** | **Yes** — individual senses, κοινὰ αἰσθητά |
| DA-04 | III.1–III.13 | Common Sense, Phantasia, Nous, Desire, Motion | 424b–435b | 14 | **Yes** | **Yes** — φαντασία (III.3), νοῦς, desire-motion |

### Work 5: Sense and Sensibilia (7 Chapters, ~23 PDF pages → 2 units)

| Unit ID | Chapters | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|----------|-------|-------------|--------|-----------|----------------------|
| SS-01 | 1–4 | Objects of Sense, Colour, Sound, Smell | 436a–443b | 12 | **Yes** | **Yes** — sensory objects, color theory |
| SS-02 | 5–7 | Taste, Touch, Common Sensibles, Simultaneous Perception | 443b–449b | 11 | No | No |

### Work 6: On Memory (2 Chapters, ~9 PDF pages → 1 unit)

| Unit ID | Chapters | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|----------|-------|-------------|--------|-----------|----------------------|
| MEM-01 | 1–2 | Memory and Recollection | 449b–453b | 9 | **Yes** | **Yes** — μνήμη, φάντασμα as memory-image, time-perception |

### Work 7: Movement of Animals (11 Chapters, ~12 PDF pages → 1 unit)

| Unit ID | Chapters | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|----------|-------|-------------|--------|-----------|----------------------|
| MA-01 | 1–11 | Animal Motion, Desire, Phantasia as Mover | 698a–704b | 12 | **Yes** | **Yes** — practical syllogism, phantasia in action |

### Work 8: On Colours (6 Chapters, ~12 PDF pages → 1 unit)

| Unit ID | Chapters | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|----------|-------|-------------|--------|-----------|----------------------|
| COL-01 | 1–6 | Colour Theory | 791a–799b | 12 | No | No — disputed authorship |

### Work 9: On Things Heard (1 Chapter, ~10 PDF pages → 1 unit)

| Unit ID | Chapters | Label | Bekker Range | ~Pages | Two-pass? | Dissertation-critical? |
|---------|----------|-------|-------------|--------|-----------|----------------------|
| AUD-01 | 1 | Acoustics and Sound Production | 800a–804b | 10 | No | No — disputed authorship |

### Unitization Summary

| Work | Units | Two-pass | Dissertation-critical |
|------|-------|----------|----------------------|
| Metaphysics | 10 | 5 | 5 |
| Physics | 8 | 4 | 4 |
| Rhetoric | 6 | 3 | 3 |
| De Anima | 4 | 3 | 3 |
| Sense and Sensibilia | 2 | 1 | 1 |
| On Memory | 1 | 1 | 1 |
| Movement of Animals | 1 | 1 | 1 |
| On Colours | 1 | 0 | 0 |
| On Things Heard | 1 | 0 | 0 |
| **Total** | **34** | **18** | **18** |

---

## Controlled Vocabularies

### Edge Relations (shared with B&T, BCAP, Rickert, Uexküll pipelines)

```
{depends_on, contrasts_with, refines, presupposes, explains, operationalizes,
 supports, undermines, exemplifies, historicizes, is_meaning_of}
```

### Edge Domains

```
{ontological, existential, biosemiotic, perceptual, teleological, temporal,
 methodological, rhetorical, psychological, logical}
```

New domains `psychological` (for De Anima/Parva Naturalia soul-faculty relations) and `logical` (for syllogistic, demonstration, dialectic) added for this pipeline. These complement existing pipeline domains.

### Centrality Tiers (3-tier, consistent with other pipelines)

- **core**: Concepts that are structurally necessary — remove them and the argument collapses.
- **important**: Concepts that carry significant weight but aren't load-bearing.
- **peripheral**: Concepts that appear briefly, illustrate a point, or connect to external debates.

---

## Provisional Key Concepts (~50 candidates for Phase 0)

### Metaphysics / First Philosophy
1. **οὐσία** (*ousia*) — substance / being / essence
2. **τὸ τί ἦν εἶναι** (*to ti ēn einai*) — essence / "what it was to be"
3. **εἶδος** (*eidos*) — form / species
4. **ὕλη** (*hulē*) — matter
5. **σύνολον** (*sunolon*) — composite (form + matter)
6. **ἐνέργεια** (*energeia*) — actuality / activity / being-at-work
7. **δύναμις** (*dunamis*) — potentiality / power / capacity
8. **ἐντελέχεια** (*entelecheia*) — actuality / being-at-work-staying-itself
9. **αἴτιον** / **αἰτία** (*aition/aitia*) — cause / explanation (four causes)
10. **τέλος** (*telos*) — end / goal / that-for-the-sake-of-which
11. **τὸ ὄν ᾗ ὄν** (*to on hēi on*) — being qua being

### Natural Philosophy / Physics
12. **φύσις** (*phusis*) — nature
13. **κίνησις** (*kinēsis*) — motion / change
14. **τόπος** (*topos*) — place
15. **χρόνος** (*chronos*) — time
16. **τὸ νῦν** (*to nun*) — the now
17. **τὸ ἄπειρον** (*to apeiron*) — the infinite
18. **συνεχές** (*suneches*) — the continuous
19. **ἀρχή** (*archē*) — principle / beginning
20. **στέρησις** (*sterēsis*) — privation

### Psychology / De Anima
21. **ψυχή** (*psuchē*) — soul
22. **αἴσθησις** (*aisthēsis*) — perception / sensation
23. **φαντασία** (*phantasia*) — imagination / appearance
24. **φάντασμα** (*phantasma*) — image / appearance (product of phantasia)
25. **νοῦς** (*nous*) — intellect / mind
26. **ὄρεξις** (*orexis*) — desire / appetite
27. **κοινὴ αἴσθησις** (*koinē aisthēsis*) — common sense
28. **κοινὰ αἰσθητά** (*koina aisthēta*) — common sensibles
29. **ἴδια αἰσθητά** (*idia aisthēta*) — proper sensibles
30. **τὸ αἰσθητικόν** (*to aisthētikon*) — the perceptive faculty
31. **νοῦς ποιητικός** / **νοῦς παθητικός** — active / passive intellect

### Perception & Parva Naturalia
32. **μνήμη** (*mnēmē*) — memory
33. **ἀνάμνησις** (*anamnēsis*) — recollection
34. **χρῶμα** (*chrōma*) — colour
35. **ψόφος** (*psophos*) — sound
36. **τὸ διαφανές** (*to diaphanes*) — the transparent (medium of sight)
37. **μεταξύ** (*metaxu*) — the medium / intermediate

### Rhetoric
38. **ῥητορική** (*rhētorikē*) — rhetoric (the art/faculty)
39. **πίστις** (*pistis*) — proof / persuasion / trust
40. **ἐνθύμημα** (*enthumēma*) — enthymeme
41. **παράδειγμα** (*paradeigma*) — example
42. **πάθος** (*pathos*) — emotion / affection / passion
43. **ἦθος** (*ēthos*) — character
44. **λέξις** (*lexis*) — style / diction / expression
45. **μεταφορά** (*metaphora*) — metaphor
46. **πρὸ ὀμμάτων ποιεῖν** (*pro ommatōn poiein*) — "setting before the eyes" / visualization
47. **φαινόμενον** (*phainomenon*) — appearance / what appears

### Cross-Cutting
48. **λόγος** (*logos*) — reason / account / speech / ratio
49. **τέχνη** (*technē*) — art / craft / skill
50. **ἕξις** (*hexis*) — state / disposition / habit

---

## Provisional Tensions (~12 candidates)

1. **εἶδος vs. ὕλη** — Form as prior to matter in definition, yet matter as necessary for composite substance; hylomorphism's internal tension.
2. **ἐνέργεια vs. δύναμις** — Actuality as prior in definition and substance, yet potentiality as prior in time; asymmetric priority.
3. **φύσις vs. τέχνη** — Nature acts for an end (teleological) like craft, yet nature has its principle within itself while craft is external.
4. **φαντασία vs. αἴσθησις** — Phantasia is "not without" perception, yet it can occur without present objects and can be false (perception of proper objects is always true).
5. **νοῦς vs. φαντασία** — Nous requires phantasmata ("the soul never thinks without a phantasma"), yet nous is separable and impassible while phantasia is bodily.
6. **Rhetoric as τέχνη vs. δύναμις** — Rhetoric defined as "the faculty [δύναμις] of observing the available means of persuasion," yet structured as a τέχνη with learnable rules.
7. **πάθος as cognitive vs. bodily** — Emotions defined in Rhetoric as "judgments" with cognitive conditions, yet in De Anima I.1 as λόγοι ἔνυλοι (enmattered accounts).
8. **κίνησις as ἀτελής vs. ἐνέργεια** — Motion is "incomplete actuality" (ἐνέργεια ἀτελής), but actuality is by definition complete; motion's ontological status is paradoxical.
9. **Unity of the soul vs. plurality of faculties** — The soul is one (form of the body), yet it has multiple faculties (nutritive, perceptive, intellectual) with apparent independence.
10. **Unmoved mover as thought vs. as cause of motion** — The unmoved mover moves as object of desire/thought (final cause) without itself being moved; causal efficacy without efficient causation.
11. **Common sensibles vs. proper sensibles** — Common sensibles (motion, shape, magnitude) are perceived by multiple senses, yet there is no dedicated organ for them; perception without a proper organ.
12. **Memory as of the past vs. phantasma as present** — Memory is "of the past," yet its vehicle is a phantasma which is present in the soul now; temporal displacement via present image.

---

## Phase 0: Global Overview & Unitization Confirmation

### Inputs
- TOC / book structure of all 9 works (from PDFs)
- Opening and closing passages of each work
- Bekker number verification on ≥2 pages per work

### Deliverables
1. `corpus/index/Aristotle - Complete Works/phase0-overview.md` — corpus overview, confirmed PDF offsets, confirmed unitization, refined concept list, refined tensions

### Quality Checks
- All 9 works accounted for
- PDF offset confirmed for each work (≥2 Bekker-to-PDF matches per work)
- Provisional concept list refined (≥40 terms)
- ≥10 candidate tensions identified
- All 34 units validated against PDF page ranges

---

## Phase 0.5: PDF Offset Validation

**Purpose**: Confirm exact PDF offsets for all 9 works before Phase 1 generates the 34 JSON skeletons. A single agent task that eliminates offset guesswork.

### Method

For each work, locate known Bekker landmarks in the PDF text and record the PDF page:

| Work | Landmark | Expected Bekker | PDF Page | Offset |
|------|----------|----------------|----------|--------|
| Metaphysics | "All men by nature desire to know" | 980a21 | ? | ? |
| Physics | First line of Book I | 184a10 | ? | ? |
| Rhetoric | First line of Book I | 1354a1 | ? | ? |
| De Anima | First line of Book I | 402a1 | ? | ? |
| Sense and Sensibilia | First line | 436a1 | ? | ? |
| On Memory | First line | 449b1 | ? | ? |
| Movement of Animals | First line | 698a1 | ? | ? |
| On Colours | First line | 791a1 | ? | ? |
| On Things Heard | First line | 800a1 | ? | ? |

Additionally, verify one mid-text and one late-text landmark per major work (Metaphysics, Physics, Rhetoric, De Anima) to confirm offset is uniform throughout.

### Deliverables
- Updated PDF Offsets table in this plan (above, currently "TBD")
- Offset formula per work: `Bekker page → PDF page`

### Quality Checks
- ≥2 confirmed landmark matches per work (≥3 for major works)
- Any non-uniform offsets flagged for special handling

### Resource
- 1 agent, ~15 minutes
- Reads first/mid/last pages of each PDF

---

## Phase 1: Ingestion & Structured Metadata

### Per-Unit JSON Schema

```jsonc
{
  "work": "metaphysics",
  "work_title": "Metaphysics",
  "latin_title": "Metaphysica",
  "unit_id": "META-01",
  "label": "First Causes and Wisdom",
  "books": ["Α (I)"],
  "bekker_range": "980a–993a",
  "pdf_pages": "6–22",
  "pdf_offset": 0,
  "tags": [],
  "greek_terms_expected": [],
  "two_pass": false,
  "dissertation_critical": false,
  "cluster": "first_philosophy"
}
```

### Deliverables
- `corpus/index/Aristotle - Complete Works/manifest.json` — 34 units + metadata
- `corpus/index/Aristotle - Complete Works/aristotle-meta-01.json` through `aristotle-aud-01.json` — 34 JSON skeletons
- Output directory: `corpus/index/Aristotle - Complete Works/`

### Quality Checks
- 34 JSON files + manifest
- All Bekker ranges covered without gaps
- PDF offsets applied correctly
- Cluster assignments consistent with thematic groupings

---

## Phase 2: Unit-by-Unit Analysis

### Three-Tier Analysis Model

Phase 2 uses three effort tiers, driven by the unit's dissertation relevance. This prevents template fatigue on non-critical units while preserving full analytical depth where it matters.

| Tier | Applies to | Template | Thresholds |
|------|-----------|----------|------------|
| **Critical** (two-pass) | 18 dissertation-critical units | Full template (10 sections) | ≥10 concepts, ≥5 positions, ≥10 Greek terms, ≥8 edges |
| **Standard** (single-pass) | 10 non-critical major-work units | Reduced template (8 sections) | ≥5 concepts, ≥3 positions, ≥5 Greek terms, ≥4 edges |
| **Light** | 6 non-critical minor/short units | Compact template (6 sections) | ≥3 concepts, ≥2 positions, ≥3 Greek terms, ≥3 edges |

**Tier assignments**:
- **Critical** (18): META-03, META-05, META-06, META-07, META-09, PHYS-02, PHYS-03, PHYS-04, PHYS-08, RHET-01, RHET-03, RHET-05, DA-02, DA-03, DA-04, SS-01, MEM-01, MA-01
- **Standard** (10): META-01, META-02, META-04, META-08, META-10, PHYS-01, PHYS-05, PHYS-07, RHET-02, RHET-04
- **Light** (6): PHYS-06, RHET-06, DA-01, SS-02, COL-01, AUD-01

### Dual-Citation Rule (all tiers)

The OCR of the Barnes edition's marginal Bekker numbers (e.g., 403a15) may be unreliable. For all citations in all templates, agents MUST provide a **dual citation**: the Bekker number (if legible) AND the PDF page number.

**Format**: `403a15–20 (PDF 12)` or, if Bekker is unreadable: `II.3 (PDF 12)`

Everywhere the templates say `citation`, this dual format is expected. If the Bekker number is entirely lost to OCR, use the internal Book/Chapter number plus PDF page. This guarantees a precise anchor for manual verification regardless of OCR quality.

### Critical Tier Template (full — 10 sections)

```markdown
## 1. Metadata
- Unit: [ID], Label: [label]
- Work: [title]
- Books/Chapters: [list]
- Bekker range: [range]
- PDF pages: [range]
- Tier: Critical
- OCR Confidence: High / Medium / Low
  [High if Bekker numbers legible and Greek text clean; Medium if some marginalia
  missing or garbled; Low if significant text garbling or missing pages]

## 2. Hierarchical Outline
[Book-level, then chapter-level, then sub-argument level]

## 3. Key Concepts
[table: concept | greek_term | transliteration | Barnes_translation | definition | centrality | first_appearance_citation | related_concepts]

## 4. Main Positions / Claims
[table: claim | evidence_type | strength | citation]

## 5. Interlocutors & Referenced Thinkers
[table: name | role | citations | relationship_to_Aristotle]
(Expected: Plato, Pre-Socratics, Pythagoreans, Empedocles, Democritus, Anaxagoras, etc.)

## 6. Cross-Work References
[Aristotle's own cross-references to his other works, with dual citations on both sides]

## 7. Cross-Pipeline Hooks (optional)
[Free-text note field. Record ONLY obvious terminological hooks — e.g., "here Aristotle
defines κίνησις exactly where BCAP §25 starts." Do NOT force connections. "None" is acceptable
and expected for most units. Tag all entries [INTERP-high].]

## 8. Tensions
[table: tension | node_a | node_b | type | description]

## 9. Greek Terms
[table: greek | transliteration | Barnes_translation | alternative_translations | definition | citations | translation_contested]

## 10. Graph Edges
[JSON array of edges following controlled vocabulary]
```

### Standard Tier Template (reduced — 8 sections)

```markdown
## 1. Metadata
[same as Critical]
- Tier: Standard
- OCR Confidence: High / Medium / Low

## 2. Hierarchical Outline
[same as Critical]

## 3. Key Concepts
[same as Critical]

## 4. Main Positions / Claims
[same as Critical]

## 5. Interlocutors & Cross-Work References
[MERGED: Interlocutors table + cross-work references in one section]

## 6. Tensions
[same as Critical §8]

## 7. Greek Terms
[simple list: greek | transliteration | Barnes_translation | citations]
(No alternative_translations or translation_contested columns — save detailed entries for Phase 4 appendix.)

## 8. Graph Edges
[JSON array of edges following controlled vocabulary]
```

Cross-pipeline hooks: **omitted** from Standard tier. Captured at work-level in Phase 3.

### Light Tier Template (compact — 6 sections)

```markdown
## 1. Metadata
[same as Critical]
- Tier: Light
- OCR Confidence: High / Medium / Low

## 2. Hierarchical Outline
[chapter-level only, no sub-argument detail]

## 3. Key Concepts + Positions
[MERGED: concepts table + main claims in one section]

## 4. Interlocutors & Cross-Work References
[MERGED, brief]

## 5. Greek Terms
[simple list: greek | transliteration | Barnes_translation | citations]

## 6. Graph Edges
[JSON array of edges following controlled vocabulary]
```

Cross-pipeline hooks and tensions: **omitted** from Light tier. Captured at work-level in Phase 3 if relevant.

### Template Design Rationale (D12–D15)

The three-tier model addresses four concerns:

1. **Template fatigue**: 34 units at full depth risks shallow box-ticking. Standard/Light tiers let non-critical units focus on what's actually there rather than filling quotas.
2. **Cross-pipeline prematurity**: Structured 7a/7b/7c sub-sections on every unit invite speculative Heidegger/Uexküll connections before the Aristotle ontology is stable. Cross-pipeline work is deferred to Phase 3 (work-level hooks) and Phase 4/5 (bridge graphs).
3. **Greek term efficiency**: Full lexicographic entries (alternative translations, contested flags) are expensive per-unit and redundant when the same term appears in 8 units. Phase 2 captures the raw data; Phase 4 appendix does the heavy definitional work for terms that cross multiple works or are dissertation-critical.
4. **Tier consistency**: Each unit's tier is fixed at plan time (above), not negotiated per-execution. Agents know their tier before starting.

### Execution Order

**Critical tier first** (18 units):
META-03, META-05, META-06, META-07, META-09, PHYS-02, PHYS-03, PHYS-04, PHYS-08,
RHET-01, RHET-03, RHET-05, DA-02, DA-03, DA-04, SS-01, MEM-01, MA-01

**Then Standard tier** (10 units):
META-01, META-02, META-04, META-08, META-10, PHYS-01, PHYS-05, PHYS-07, RHET-02, RHET-04

**Then Light tier** (6 units):
PHYS-06, RHET-06, DA-01, SS-02, COL-01, AUD-01

**Parallelization**: Up to 34 background agents. Most units are 10–20 PDF pages, well within context limits. The Metaphysics and Physics units share many cross-references, but Phase 2 captures these without requiring sequential execution.

### Deliverables
- `corpus/index/Aristotle - Complete Works/phase2-meta-01.md` through `phase2-aud-01.md` — 34 analysis files
- Output directory: `corpus/index/Aristotle - Complete Works/`

### Quality Checks per Unit
- All sections present for the unit's tier (10 / 8 / 6)
- Thresholds enforced per tier (see table above)
- Dual citations used throughout: Bekker + PDF page (see Dual-Citation Rule above)
- Cross-work references cite specific Bekker passages in both the current and referenced work
- `translation_contested` defaults to `false`; `true` only for genuinely debated translations (Critical tier only)

---

## Phase 3: Per-Work Synthesis

**This phase is unique to the multi-work pipeline.** Before creating the corpus-level ontology (Phase 4), each work gets its own local synthesis. This prevents the corpus-level synthesis from flattening work-specific nuances.

### Per-Work Deliverables

For each of the 9 works:

1. **`[work]-ontology.md`** — Work-level canonical concepts (with `global_candidate: true/false` flag), internal trajectory, key positions
2. **`[work]-edges.csv`** — De-duplicated edges within the work
3. **`[work]-greek.json`** — Greek terms specific to this work
4. **`[work]-cross-pipeline-hooks.md`** — Summary of cross-pipeline hooks collected from Phase 2 units, aggregated at work level. E.g., "Metaphysics Θ: key ἐνέργεια loci relevant to BCAP §§25–28; De Anima III.3: φαντασία passages that B&T leans on." This is the primary cross-pipeline artifact until Phase 5.

### Targeted Concepts List (pre-seeded from Phase 0)

The following provisional concepts from the Phase 0 candidate list MUST be included in a work's local ontology and automatically flagged `global_candidate: true` **if they appear in that work at all**, regardless of their local centrality. This prevents bottom-up agents from missing known structural pillars (e.g., an agent analyzing *Sense and Sensibilia* might see a minor appearance of φαντασία and fail to flag it without this instruction).

```
οὐσία, τὸ τί ἦν εἶναι, εἶδος, ὕλη, ἐνέργεια, δύναμις, ἐντελέχεια,
αἴτιον/αἰτία, τέλος, φύσις, κίνησις, τόπος, χρόνος, τὸ νῦν, ψυχή,
αἴσθησις, φαντασία, φάντασμα, νοῦς, ὄρεξις, κοινὴ αἴσθησις,
ῥητορική, πίστις, ἐνθύμημα, πάθος, ἦθος, λέξις, μεταφορά,
πρὸ ὀμμάτων ποιεῖν, λόγος, τέχνη, ἕξις
```

This list is injected into the Phase 3 agent prompt for each work. Genuinely new concepts can still bubble up organically if they meet the graduation criteria below.

### Concept Graduation Rule

Each work-level ontology may contain many local concepts, but only those meeting **at least one** of these criteria should be flagged `global_candidate: true`:

- Appears on the **Targeted Concepts List** above (automatic graduation)
- Appears in **≥2 works** (cross-work concept)
- Is **dissertation-critical** (directly relevant to the dissertation's argumentative spine)
- Is a **load-bearing node** in the work's internal graph (removing it collapses ≥3 edges)

Concepts that are locally important but don't meet these criteria remain work-specific and are not promoted to the corpus ontology in Phase 4. This keeps the global graph readable and centrality tiers meaningful.

### Quality Checks
- Each major work (Metaphysics, Physics, Rhetoric, De Anima): ≥12 local concepts (not all need to be global candidates), ≥25 edges
- Each medium work (Sense and Sensibilia): ≥6 concepts, ≥12 edges
- Each minor work (On Memory, Movement of Animals, On Colours, On Things Heard): ≥4 concepts, ≥6 edges
- Cross-pipeline hooks file present for each work (may be brief or "No obvious hooks" for minor works)

---

## Phase 4: Corpus-Level Ontology & Graphs

### 4A. Canonical Concept Nodes
- Promote only `global_candidate: true` concepts from Phase 3 work-level ontologies
- Assign centrality tier (core / important / peripheral)
- Track which works each concept appears in
- **Core** nodes must be usable in the dissertation's argumentative spine
- Target: **40–55 canonical nodes** (quality over quantity — if only 35 concepts are genuinely load-bearing, that's fine; do not inflate to hit a quota)

### 4B. Global Edge Table
- De-duplicate all graph edges from Phase 3
- Add `works` and `units` columns
- **Edge quality rule**: Prefer edges that (a) link concepts across works (cross-work edges), or (b) encode non-trivial structural relations within a work. De-prioritize purely illustrative edges.
- Target: 150–300 de-duplicated edges

### 4C. Cross-Work Integration Map
- **Unique to multi-work pipeline.** Systematic map of how concepts develop, shift, or are deployed differently across works.
- Example: ἐνέργεια in Metaphysics Θ (ontological priority) vs. De Anima II.1 (soul as first actuality) vs. Physics III (motion as incomplete actuality)
- Format: concept → {work, local_definition, local_role, differences}

### 4D. Productive Tensions
- Synthesize tensions from Phase 3 into corpus-level pairs
- Each tension: `{node_a, node_b, dependency_edge, conflict_edge, tension_description, works}`
- Target: 10–15 tensions

### 4E. Contested Nodes
- Identify concepts whose meaning shifts across works
- Expected: ἐνέργεια, οὐσία, φαντασία, λόγος, πάθος, τέχνη

### 4F. Corpus Trajectory
- How Aristotle's system hangs together across works
- Key architectonic bridges (Metaphysics→Physics→De Anima→Rhetoric)

### 4G. Greek Terminology Appendix
- All Greek terms from Phase 3, merged and de-duplicated
- **Two-depth approach**:
  - **Full entries** (with `alternative_translations`, `definition`, `translation_contested`): terms that appear in **≥2 works** OR are **dissertation-critical** (the ~50 provisional key concepts and any additional candidates surfaced in Phase 2/3). Expected: 60–100 full entries.
  - **Index entries** (with `transliteration`, `Barnes_translation`, `citations` only): all remaining one-off terms. Expected: 80–150 index entries.
- Fields (full): `greek`, `transliteration`, `Barnes_translation`, `alternative_translations`, `definition`, `citations`, `works`, `units`, `translation_contested`, `canonical_node_link`
- Fields (index): `greek`, `transliteration`, `Barnes_translation`, `citations`, `works`
- Output: `aristotle-greek-appendix.md` (human-readable) + `aristotle-greek-appendix.json` (structured)
- Target: 150–250 total lemmas (60–100 full + remainder index)

### 4H. Concept × Unit Matrix
- 40–55 canonical concepts × 34 units
- Cells: present / absent / central

### 4I. Mermaid Graphs (8 target)

1. **`aristotle-graph-global.mmd`** — Full corpus concept graph
2. **`aristotle-graph-metaphysics.mmd`** — Metaphysics internal structure (substance, causation, actuality/potentiality)
3. **`aristotle-graph-physics.mmd`** — Physics internal structure (motion, time, place, causation)
4. **`aristotle-graph-psychology.mmd`** — De Anima + Parva Naturalia (soul, perception, phantasia, nous)
5. **`aristotle-graph-rhetoric.mmd`** — Rhetoric internal structure (pisteis, pathos, lexis)
6. **`aristotle-graph-cross-work.mmd`** — Concept bridges across works
7. **`aristotle-graph-phantasia.mmd`** — Phantasia across all works (dissertation focal concept)
8. **`aristotle-graph-cross-pipeline.mmd`** — Aristotle ↔ Heidegger (BCAP + B&T) ↔ Uexküll bridge

### 4J. Bekker Index (Reverse Concordance)

A reverse index mapping Bekker citations to linked concepts and Greek terms. This becomes the master concordance for dissertation writing — anytime a specific Aristotle passage needs to be cited, the exact concept linkages and locations are immediately available.

**Format**: One entry per significant Bekker locus.

```
980a21: "All men by nature desire to know" → φύσις, ἐπιστήμη (PDF 6) [META-01]
403a3–b19: φαντασία definition → φαντασία, αἴσθησις, φάντασμα (PDF 12) [DA-04]
1048b18–35: ἐνέργεια priority over δύναμις → ἐνέργεια, δύναμις (PDF ??) [META-07]
```

- Source: Phase 2 citation fields + Phase 3 concept linkages
- Scope: All dissertation-critical Bekker loci (not every line — focus on passages that anchor key concepts)
- Target: 100–200 indexed loci
- Output: `aristotle-bekker-index.md` (human-readable, sorted by Bekker number) + `aristotle-bekker-index.json` (structured)

### Deliverables
| File | Content |
|------|---------|
| `corpus-ontology.md` | Canonical nodes (4A), cross-work map (4C), tensions (4D), contested nodes (4E), trajectory (4F) |
| `global-edges.csv` | De-duplicated corpus-level edges (4B) |
| `tension-edges.json` | Productive tensions (JSON) (4D) |
| `concept-matrix.csv` | Concepts × units (4H) |
| `aristotle-greek-appendix.md` | Greek appendix (human-readable) (4G) |
| `aristotle-greek-appendix.json` | Greek appendix (structured) (4G) |
| 8 `.mmd` files | Mermaid graphs (4I) |
| `aristotle-bekker-index.md` | Bekker reverse concordance (human-readable) (4J) |
| `aristotle-bekker-index.json` | Bekker reverse concordance (structured) (4J) |

Output directory: `corpus/index/Aristotle - Complete Works/`

### Quality Checks
- 40–55 canonical nodes (quality over quantity — do not inflate to hit a quota)
- 150–300 global edges (quality-filtered)
- ≥10 corpus-level tensions
- ≥150 Greek lemmas (60–100 full entries + remainder index entries)
- 8 Mermaid graphs render correctly
- Cross-pipeline bridge graph uses [INTERP-high] on all edges
- Cross-work integration map covers ≥10 concepts that appear in ≥2 works
- Bekker index covers ≥100 loci across all 9 works
- OCR Confidence triage: any unit flagged "Low" has been spot-checked before its data feeds into global edges/appendix

---

## Phase 5: Cross-Pipeline Integration (PARKED)

**DO NOT EXECUTE** until the user provides their own framework description.

### Integration Surfaces (Preliminary)

**Aristotle ↔ Heidegger BCAP**:
- Direct engagement: BCAP is Heidegger's lecture course on Aristotle's basic concepts
- οὐσία → Heidegger's re-interpretation as "being-there" / Dasein
- κίνησις → BCAP's central κίνησις analysis (§§25–28)
- ἐνέργεια/δύναμις → Heidegger's ontologizing of energeia
- πάθος/ἕξις → BCAP's analysis of affection and disposition
- ψυχή → BCAP's "ζωή πρακτική" interpretation
- λόγος → BCAP's rhetoric-grounded λόγος
- φρόνησις → practical wisdom (if present in Rhetoric/NE cross-refs)

**Aristotle ↔ Heidegger B&T**:
- ψυχή / Dasein → soul as being-in-the-world
- φαντασία / Erschlossenheit → disclosure / "as"-structure
- κίνησις / Sorge → motion/care
- αἴσθησις / Befindlichkeit → perception/attunement
- χρόνος / Zeitlichkeit → time/temporality

**Aristotle ↔ Uexküll**:
- Bauplan ↔ εἶδος/μορφή — blueprint as formal cause
- Funktionskreis ↔ κίνησις — functional cycle as motion
- Naturtechnik ↔ τέχνη — nature's technique
- Planmäßigkeit ↔ τέλος/ἐντελέχεια — purposiveness as final cause
- Umwelt ↔ αἴσθησις — perceptual world as sense-environment

### Deliverables (when activated)
- Mapping tables (Aristotle Greek → BCAP Greek/German → B&T German)
- Aristotle-Uexküll bridge (Greek→German cross-reference)
- Zones of alignment / conflict / extension
- Updated bridge Mermaid graphs with confirmed (not INTERP-high) edges

---

## Cross-Pipeline Compatibility

### Shared Infrastructure
- Same edge relation vocabulary (11 relations)
- Same centrality tier system (core / important / peripheral)
- Same Phase 2 template structure (adapted: 10 sections vs. 9, with cross-work refs)
- Compatible edge domains (shared: ontological, temporal, methodological, rhetorical, teleological, perceptual; new: psychological, logical)

### Integration Points
- Aristotle's φαντασία → Heidegger's Erschlossenheit, Uexküll's Merkwelt (perception-world)
- Aristotle's κίνησις → BCAP §§25–28, Physics III, Uexküll's Funktionskreis
- Aristotle's ψυχή → BCAP's ζωή πρακτική, De Anima's ἐντελέχεια
- Aristotle's πάθος → BCAP §§16–21, Rhetoric II, Uexküll's Stimmung
- Aristotle's τέχνη/φύσις → Uexküll's Naturtechnik, Heidegger's Zeug/Zuhandenheit

---

## Resource Estimates

| Phase | Units/Files | Est. Agents | Notes |
|-------|-------------|-------------|-------|
| Phase 0 | 1 file | 1 (direct) | Read opening/closing of all 9 works, provisional concepts/tensions |
| Phase 0.5 | Offset table | 1 (direct) | Bekker landmark validation for all 9 PDFs (~15 min) |
| Phase 1 | 34 JSON + manifest | 1 (direct) | Metadata extraction from verified structures + confirmed offsets |
| Phase 2 | 34 analysis files | Up to 34 (parallel) | Most units 10–20 pp., well within context |
| Phase 3 | 9 work-level syntheses | Up to 9 (parallel) | Per-work ontology before corpus merge |
| Phase 4 | ~16 files | 3–4 (parallel) | Corpus ontology + edges/graphs + appendix |
| Phase 5 | TBD | TBD | PARKED |

**Total estimated**: ~34 primary analysis units (vs. 17 for B&T, 13 for BCAP, 14 for Uexküll, 10 for Rickert). This is the largest pipeline, reflecting the multi-work scope.

---

## Decision Log

| # | Phase | Decision | Rationale |
|---|-------|----------|-----------|
| D1 | Plan | 34 units across 9 works | Book = natural unit for major works; minor works as single units |
| D2 | Plan | Two new edge domains: `psychological`, `logical` | De Anima faculty relations and syllogistic/dialectic patterns need dedicated domains |
| D3 | Plan | Phase 3 (per-work synthesis) added before corpus-level Phase 4 | Multi-work corpus needs intermediate synthesis to avoid flattening work-specific nuances |
| D4 | Plan | Cross-work references (§6) in Phase 2 template | Aristotle's works extensively cross-reference each other; capture these systematically |
| D5 | Plan | Greek terms replace German terms | Primary foreign terminology is Greek, not German |
| D6 | Plan | Disputed works (On Colours, On Things Heard) included as LOW priority | In the corpus; worth indexing even if not securely Aristotelian |
| D7 | Plan | 18 units flagged dissertation-critical | Focus on phantasia, perception, motion, substance, actuality/potentiality, rhetoric |
| D8 | Plan | Bekker pagination as canonical reference system | Standard in all Aristotle scholarship; PDF pages recorded but secondary |
| D9 | Plan | 8 Mermaid graphs (vs. 5 for other pipelines) | More works = more internal and cross-work structure to visualize; phantasia graph added for dissertation focus |
| D10 | R1 | Three-tier Phase 2 model (Critical / Standard / Light) | Prevents template fatigue on 34 units; non-critical units use reduced templates with merged sections and lower thresholds |
| D11 | R1 | Cross-pipeline refs demoted from per-unit structured sections to optional note field (Critical) or omitted (Standard/Light); aggregated at work-level in Phase 3 | Prevents speculative Heidegger/Uexküll connections before the Aristotle ontology is stable |
| D12 | R1 | Concept graduation rule: `global_candidate` flag in Phase 3, strict criteria for promotion to Phase 4 | Prevents quota-driven inflation; keeps corpus graph readable and centrality tiers meaningful |
| D13 | R1 | Phase 4 canonical nodes target lowered to 40–55 (from 50–70); edges to 150–300 (from 200–350) | Accept fewer nodes if they're genuinely load-bearing; quality over quantity |
| D14 | R1 | Greek appendix two-depth approach: full entries for cross-work/dissertation-critical terms, index entries for the rest | Concentrates lexicographic effort where it matters (ἐνέργεια, φαντασία, λόγος) without busywork on one-off terms |
| D15 | R1 | Phase 2 Standard/Light tiers use simplified Greek term format (no alternative_translations, no translation_contested) | Heavy definitional work deferred to Phase 4 appendix where de-duplication happens naturally |
| D16 | R2 | Dual-Citation Failsafe: all citations use `Bekker (PDF page)` format; if Bekker unreadable, use `Book.Chapter (PDF page)` | Barnes OCR marginal Bekker numbers may be unreliable; dual citation guarantees a verifiable anchor regardless of OCR quality |
| D17 | R2 | Targeted Concepts List pre-seeded into Phase 3 agent prompts | Prevents bottom-up agents from missing known structural pillars (e.g., φαντασία in minor works); automatic `global_candidate: true` for ~32 provisional concepts if they appear at all |
| D18 | R3 | Phase 4 QC targets aligned with actual expectations (40–55 nodes, 150–300 edges) | Previous "≥50 / ≥200" thresholds risked quota-driven inflation; ranges are honest targets |
| D19 | R3 | OCR Confidence Flag (High/Medium/Low) added to all Phase 2 tier templates | Creates triage list for Phase 4 — units flagged "Low" get spot-checked before their data feeds into global deliverables |
| D20 | R3 | Phase 0.5: PDF Offset Validation Script — 1 agent confirms Bekker landmarks against PDF pages for all 9 works | Eliminates offset guesswork before Phase 1 generates 34 JSON skeletons; 15-minute task with high downstream payoff |
| D21 | R3 | Phase 4J: Bekker Index (reverse concordance) — maps Bekker loci to concepts/terms | Master concordance for dissertation writing; 100–200 indexed loci covering all dissertation-critical passages |
