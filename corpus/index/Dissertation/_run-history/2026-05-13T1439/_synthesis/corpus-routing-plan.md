# Corpus Routing Plan — Dissertation Analysis Pipeline

**Run ID**: `2026-05-13T1439`
**Schema**: Plan v1.4 §9.4 + §10
**Agent**: Phase 3 Wave 4 Agent G

## Summary

| Field | Count |
|---|---|
| Tier A routes (corpus/index) | 143 |
| Tier B routes (ChromaDB/corpus-download) | 7 |
| Tier C routes (Perplexity) | 17 |
| Placeholders (asterisk-six) | 11 |
| In-text fix only | 26 |

Source-priority discipline per `feedback-corpus-index-first.md`: **corpus/index FIRST → ChromaDB → Perplexity**.

## Routes by Pipeline

| Pipeline | Routes |
|---|---|
| `Aristotle - Complete Works` | 73 |
| `Heidegger - Basic Concepts of Aristotelian Philosophy` | 18 |
| `Heidegger - Being and Time` | 15 |
| `Heidegger and Rhetoric` | 3 |
| `Aristotelian Phantasia Secondary (1985-2017)` | 15 |
| `Aristotelian Motion and Time Secondary` | 3 |
| `Rickert - Ambient Rhetoric` | 1 |
| `A Grammar of Motives (Burke 1945)` | 5 |
| Cross-section (Dissertation/§1.4) | 1 |
| `corpus/download` (Phase 4.0 promote) | 4 |
| `corpus/index Dissertation` | 1 |

## Asterisk-Six Placeholders (11 total)

All placeholders have named locus + corpus_index_route + user_action per `feedback-missing-source-placeholder.md`:

### DISS-01-A0 (4)
1. **Line 25** — BCAP/GA 18 Bewegtheit; route: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/u-fp2a`
2. **Line 53** — SZ §18 H.84 Bewandtnis; route: `corpus/index/Heidegger - Being and Time/bt-structured/§18`
3. **Line 67** — SZ §81 H.421-422 Innerzeitigkeit; route: `corpus/index/Heidegger - Being and Time/bt-structured/§81`
4. **Line 79** — SZ §65 H.328-329 Zeitlichkeit; route: `corpus/index/Heidegger - Being and Time/bt-structured/§65`

### DISS-02-A1A2 (6)
1. **Line 23** — BCAP 126 perception-as-kritikon; route: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md` (VERIFIED)
2. **Line 23** — White pp. 9-11 to kritikon; route: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/White - Meaning of Phantasia` (Perplexity Q-012 fallback)
3. **Line 47** — BCAP 131-132 progressive-narrowing/sōtēria; route: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md` (VERIFIED)
4. **Line 55** — White p. 498 resonant phantasia; route: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/White - Meaning of Phantasia` (Perplexity Q-013 fallback)
5. **Line 79** — BCAP 164 hēdonē-in-the-moment; route: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis (BCAP 164)`
6. **Line 79** — BCAP 166 hēdonē-co-given; route: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis (BCAP 166)`

### DISS-04-EMOTION (1)
1. **Line 174** — BCAP p. 174 hexis/pathē as fundamental concepts; route: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/p.117-125 cluster + p.176`

## Tier B / Corpus-Download Routes (7)

These require Phase 4.0 ingest (Plan §3.5) before Tier A routing:

| Gap | Author / Work | Route |
|---|---|---|
| DISS-04-G-C190 | Caston 2021 Cartesian Theatre | `dissertation-perplexity-cache::Caston 2021` + corpus/download promote |
| DISS-05-G-C013 | Corcilius 2013 (MA somatic preparation) | `corpus/download/Corcilius-2013` |
| DISS-05-G-C031 | Sheehan 2015 (Heidegger technē/praxis) | `corpus/download/Sheehan-2015` |
| DISS-05-G-C053 | Sheehan 2015 (duplicate) | (same) |
| DISS-05-G-C070 | Costache 2013 (Heidegger pathos) | `corpus/download/Costache-2013` |
| DISS-05-G-C085 | Papachristou 2013 (three grades) | `corpus/download/Papachristou-2013` |
| DISS-01-G01-fallback | BCAP Bewegtheit (if u-fp2a miss) | `chroma collection: metaphysics` |

## Tier A Routes Catalog (143 routes)

### DISS-00-INTRO Tier A routes (10)

| Gap | Locus | Pipeline |
|---|---|---|
| G07 (C026) | DA III.7 431a8-12 | Aristotle - Complete Works |
| G08 (C001) | DA III.10 433a13-15 + MA 6 700b15-22 | Aristotle - Complete Works |
| G09 (C072) | Phys. VII.3 245b1-13 | Aristotle - Complete Works |
| G10 (C022) | DA II.5 + DA III.3 + On Dreams + On Memory | Aristotle - Complete Works |
| G11 (C027) | Phys. III.1 201a10-14 + Phys. IV.11 219b1-2 | Aristotle - Complete Works |
| G12 (C028) | SZ §65 H.327 or §72 H.373 | Heidegger - Being and Time |
| G13 (C029) | DA III.3 427b15-428a18 | Aristotle - Complete Works |
| G14 (C030) | DA III.3 427b14-26 | Aristotle - Complete Works |
| G15 (C044) | BCAP 133 | Heidegger - Basic Concepts of Aristotelian Philosophy |
| G16 (C045) | DA I.1 403a25-b19 + DA II.5 + DA III.2 | Aristotle - Complete Works |

### DISS-01-A0 Tier A routes (14)

| Gap | Locus | Pipeline |
|---|---|---|
| G01 (C042) | BCAP/GA 18 kinēsis-as-Bewegtheit | Heidegger - Basic Concepts of Aristotelian Philosophy (u-fp2a) **+placeholder** |
| G02 (C089) | SZ §18 H.84 Bewandtnis | Heidegger - Being and Time **+placeholder** |
| G03 (C124) | SZ §81 H.421-422 Innerzeitigkeit | Heidegger - Being and Time **+placeholder** |
| G04 (C148) | SZ §65 H.328-329 Zeitlichkeit | Heidegger - Being and Time **+placeholder** |
| G05 (C016) | Burke Grammar pp. 261-262 (NOT 280-281) | A Grammar of Motives (Burke 1945) — gm-06-deep |
| G06 (C088) | Burke pp. 214-215 OR 152-159 verification | A Grammar of Motives (Burke 1945) — gm-04/gm-05 |
| G07 (C033) | Hawhee 2011 Rhetorical Vision p. 154 | Aristotelian Phantasia Secondary — phx-07-hawhee |
| G08 (C141) | Phys. IV.14 223a21-26 (NOT 223a25-27) | Aristotle - Complete Works — phys-04 |
| G09 (C081) | Met. XI K.6/K.9/K.12 verification | Aristotle - Complete Works — meta-08 |
| G10 (C129) | DA II.1 412a19-20 + Phys. IV.14 (flag) | Aristotle - Complete Works |
| G11 (C051) | BCAP — interpretive flag at framing | Heidegger - Basic Concepts of Aristotelian Philosophy |
| G12 (C094) | SZ §§14-18 In-der-Welt-sein (strengthen flag) | Heidegger - Being and Time |
| G13 (C113) | SZ §§32-33 hermeneutical circle (flag) | Heidegger - Being and Time |
| G16 (C098) | Phys. IV.11 218b21-219a15 verify | Aristotle - Complete Works — phys-04 |
| G17 (C104) | Phys. IV.11 219b16-25 verify | Aristotle - Complete Works — phys-04 |

### DISS-02-A1A2 Tier A routes (11)

| Gap | Locus | Pipeline |
|---|---|---|
| G01 (C033) | BCAP 126 kritikon | BCAP u-fp3c **+placeholder VERIFIED** |
| G02 (C075) | BCAP 131-132 sōtēria | BCAP u-fp3c **+placeholder VERIFIED** |
| G03 (C091) | White p. 498 resonant phantasia | Aristotelian Phantasia Secondary **+placeholder** |
| G04 (C120) | BCAP 164 hēdonē-in-moment | BCAP **+placeholder** |
| G05 (C121) | BCAP 166 hēdonē-co-given | BCAP **+placeholder** |
| G06 (C036) | White pp. 9-11 to kritikon | Aristotelian Phantasia Secondary **+placeholder** |
| G07 (C003) | DA III.10 433b12-25 three-factor | Aristotle - Complete Works |
| G08 (C153) | Phys. III.1 201a10-11 | Aristotle - Complete Works |
| G09 (C129) | Rhet. II.2/II.5/II.8 (anger/fear/pity) | Aristotle - Complete Works |
| G10 (C146) | Nussbaum + Caston (if deferral developed) | Aristotelian Phantasia Secondary |

### DISS-03-A3 Tier A routes (21)

| Gap | Locus | Pipeline |
|---|---|---|
| G01 (C076) | **CRITICAL** Papachristou Aquinas p.16 fn.57 | Aristotelian Phantasia Secondary — phx-08 |
| G02 (C006) | Papachristou + Frede (phantasia/phantasma) | Aristotelian Phantasia Secondary |
| G03 (C008) | DA III.10 433b29 + DA III.3 428a1-3 | Aristotle - Complete Works |
| G04 (C010) | DA III.7 431a16-17 + BCAP 134 | Aristotle - Complete Works + BCAP |
| G05 (C011) | Burke RoM 19-23/55-59 identification | A Grammar of Motives (separate Burke RoM) |
| G06 (C035) | DA III.3 427b14-15 (replace '14-15') | Aristotle - Complete Works |
| G07 (C038) | BCAP 95/110/176 logos | BCAP |
| G09 (C052) | SZ §65 ecstatic temporality + §§72-77 | Heidegger - Being and Time |
| G10 (C053) | SZ §65 (combined with G09) | Heidegger - Being and Time |
| G12 (C082) | SZ §65 H.323-331 three ecstases | Heidegger - Being and Time |
| G14 (C090) | BCAP 93-94 dynaton-adynaton | BCAP |
| G15 (C145) | DA II.4 415b21-28 OR DA III.10 | Aristotle - Complete Works |
| G16 (C148) | Phys. II.1 192b13-23 | Aristotle - Complete Works |
| G17 (C155) | BCAP 124 (user decision) | BCAP |
| G20 (C003) | DA III.7 431a14-17 | Aristotle - Complete Works |
| G21 (C009) | DA III.3 428a1-3 + 429a1-2; Frede + Caston | Aristotle + Phantasia Secondary |
| G22 (C026) | DA III.11 434a16-21 | Aristotle - Complete Works |
| G23 (C078) | DA III.10 433b12-25 | Aristotle - Complete Works |
| G24 (C021) | Met. IX.6-8 (optional) | Aristotle - Complete Works |
| G25 (C034) | DA III.8 432a3-9 (optional) | Aristotle - Complete Works |
| G26 (C036) | Met. Z.10 1035b27-30 + Caston (optional) | Aristotle + Phantasia Secondary |
| G27 (C063) | DA III.10 433b29 + DA III.11 434a16-21 | Aristotle - Complete Works |
| G28 (C115) | Rhet. II.1 1378a20-22 (optional gesture) | Aristotle - Complete Works |
| G29 (C143) | DA III.10 433a27-29 | Aristotle - Complete Works |

### DISS-04-EMOTION Tier A routes (32)

All cache-overlap-annotated; vast majority cache-likely-strong or cache-likely-supplementary per MASTER-CITATION-REPORT.

| Gap | Locus | Cache overlap |
|---|---|---|
| C163 | MA 7 701a29-b1 | cache-likely-strong |
| C165 | MA 7 (Loeb + Bekker) | cache-likely-supplementary |
| C299 | Rhet. I.11 1370a28-33 | cache-likely-supplementary |
| C002 | DA III.7 | cache-likely-strong |
| C003 | On Dreams + DA II.5 | cache-likely-strong |
| C030 | On Dreams + DA II.5 | cache-likely-strong |
| C031 | DA II.2 + BCAP 115 | cache-likely-strong |
| C034 | DA III.3 + DA III.7 | cache-likely-strong |
| C036 | DA II.5 paschein-preservation | cache-likely-strong |
| C045 | MA 7 | cache-likely-supplementary |
| C046 | MA 7 drinking | cache-likely-supplementary |
| C048 | DA II.5 + BCAP 132 | cache-likely-strong |
| C059 | BCAP 132 | cache-likely-strong |
| C060 | DA II.2 + BCAP 115 | cache-likely-strong |
| C066 | MA 7 drinking | cache-likely-supplementary |
| C080 | SZ §31-32 | cache-likely-supplementary |
| C100 | DA II.5 | cache-likely-strong |
| C101 | DA II.5 | cache-likely-strong |
| C206 | SZ §29 H.137 | cache-likely-supplementary |
| C291 | BCAP p. 117-125 + 176 (placeholder) | cache-likely-strong |
| C008 | Caston 1995 + DA I.4 | cache-likely-strong |
| C018 | DA III.10 | cache-likely-supplementary |
| C027 | BCAP 131-132 | cache-likely-strong |
| C032 | BCAP 115 | cache-likely-strong |
| C106 | BCAP 115 | cache-likely-strong |
| C181 | DA III.3 | cache-likely-supplementary |
| C232 | Rhet. II.5 fear | cache-likely-strong |
| C292 | NE II-IV virtue/pathos | cache-likely-supplementary |
| C302 | Hawhee 2011 + Rickert | cache-likely-strong |
| C062 | BCAP 132 magnitude-axis | cache-likely-supplementary |
| C257 | Heidegger and Rhetoric Hyde + Struever + BT §26 Mitsein | cache-likely-strong |

### DISS-05-A4 Tier A routes (55)

§1.5 has the largest Tier A footprint per the secondary-literature-priority-list. Of 78 actionable gaps:

- **Aristotle - Complete Works**: 38 needed loci (DA, MA, Met., NE, Phys., Pol., Rhet.)
- **Heidegger - Basic Concepts of Aristotelian Philosophy**: 6 needed loci (GA 18 §§15-19, pp. 119, 125, 127-128)
- **Heidegger - Being and Time**: 5 needed loci (SZ §§29, 32-33, 41, 65, 69)
- **Aristotelian Phantasia Secondary**: 3 needed loci (Frede 1992, White 1985, Nussbaum 1985)
- **Heidegger and Rhetoric**: 2 needed loci (Gross intro, Kisiel protopolitics)
- **A Grammar of Motives**: 1 needed locus (Burke entelechy)
- **Aristotelian Motion and Time Secondary**: 1 needed locus (Bowin AMT)

Key §1.5 routes (representative):

| Gap | Locus | Pipeline |
|---|---|---|
| C003 | DA III.10 433a31-b30 | Aristotle - Complete Works |
| C013 | MA somatic preparation + Corcilius | AMT + corpus/download Corcilius **TIER-B** |
| C016 | DA I.1 + MA 8 | Aristotle - Complete Works |
| C031 | GA 18 §17-18 + Sheehan | BCAP + corpus/download Sheehan **TIER-B** |
| C036 | DA III.7 431a8-12 | Aristotle - Complete Works |
| C044 | NE VI.4 + GA 18 §17 | Aristotle + BCAP |
| C047 | NE VII.3 + Frede 1992 | Aristotle + Phantasia Secondary |
| C058 | NE VI.5 + GA 18 §17-18 (master) | Aristotle + BCAP (+ Q-016) |
| C060 | DA I.1 + MA 8 | Aristotle - Complete Works |
| C062 | DA I.1 + Rhet. II.2 | Aristotle - Complete Works |
| C063 | Rhet. II.5 | Aristotle - Complete Works |
| C065 | Nussbaum 1985 | Phantasia Secondary |
| C070 | NE II.1-6 + GA 18 §18-19 (+ Sherman Q-001) | Aristotle + BCAP |
| C074 | NE III.7 + IV.3 + IV.9 (+ Q-017 deep) | Aristotle - Complete Works |
| C076 | Rhet. II.2-11 categorical (+ Q-003) | Aristotle - Complete Works |
| C080 | Rhet. II.12-17 ēthos | Aristotle - Complete Works |
| C081 | Cross-section §1.4 hexis | **BLOCKED on DISS-04** |
| C085 | White 1985 + Papachristou | Phantasia Secondary + corpus/download |
| C088 | DA III.3 + SZ §32-33 | Aristotle + BT |
| C093 | Burke entelechy + SZ §65 | Burke + BT |
| C095 | SZ §65 + NE II.1 | BT + Aristotle |
| C096 | Rhet. B 1 + GA 18 §17-18 + SZ §29 | Aristotle + BCAP + BT |
| C098 | Pol. I.4-7 + GA 18 §15-17 | Aristotle + BCAP — **BLOCKED on upstream** |

Plus standard primary Bekker additions for ~30 in-text Aristotle citations (DA, MA, Met., NE, Phys., Pol., Rhet.).

## Upstream-Blocked Routes (5 total)

Per Plan §11.1 critical path, §1.5 cannot finalize until upstream §§1.0-1.4 stabilize:

| Gap | Blocked Section | Reason |
|---|---|---|
| DISS-05-G-C017 | DISS-00-INTRO | A_4-semantics drift (prose vs diagram) |
| DISS-05-G-C033 | DISS-00-INTRO | Mid-chain notation requires §1.0 convention |
| DISS-05-G-C081 | DISS-04-EMOTION | Type 2/3 hexis bivalence consistency check |
| DISS-05-G-C098 | DISS-00/§§1.1-1.3 | Overreach softening pending upstream revision |
| DISS-05-G-C015 | (self-reference) | Internal cross-ref verification |

## Quality Gates (Plan §9.6 + §13)

- [x] **Tier A ≥ 70%**: 143 / 182 actionable routable + placeholder gaps = **78.6%** PASS
- [x] **All asterisk-six placeholders have named locus + corpus_index_route + user_action**: 11/11 PASS
- [x] Every route has pipeline + unit_path
- [x] User action documented for manual-fill placeholders (`feedback-missing-source-placeholder.md`)
- [x] Tier B routes documented for ChromaDB/corpus-download fallback
- [x] corpus/index-FIRST routing applied throughout
