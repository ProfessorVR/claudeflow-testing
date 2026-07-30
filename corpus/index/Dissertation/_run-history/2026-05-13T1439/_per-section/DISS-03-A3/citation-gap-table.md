# Citation Gap Table — DISS-03-A3 (§1.3: A_3 and the Three Orientational Modes)

**Run**: 2026-05-13T1439
**Source**: `tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md`
**Total gaps flagged**: 32 (sorted by effort and severity below)

## Summary

| Severity | Count | Description |
|---|---|---|
| T7-overreach | 2 | Vague/truncated Bekker citations (lines 37, 117) |
| T5-under-supported | 23 | Citation placeholders + Heideggerian quote gaps |
| T8-secondary-needed | 7 | Optional secondary reinforcement |

| Effort | Count |
|---|---|
| Trivial | 8 |
| Small (5-10 min) | 12 |
| Small-medium (10-15 min) | 4 |
| Medium (15-25 min) | 5 |
| Large (deferred) | 3 |

| Corpus routing | Count |
|---|---|
| corpus/index only | 21 |
| corpus/index + ChromaDB | 4 |
| Perplexity required | **0** |
| Editorial only | 7 |

**KEY FINDING**: Every citation gap in §1.3 can be resolved from `corpus/index/` (primary + secondary) WITHOUT any Perplexity query. The Papachristou three-grades citation (DISS-03-G01, the most CRITICAL gap) has its complete contents already indexed at `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/phx-08-papachristou.md`.

---

## Top-priority gaps (CRITICAL + HIGH)

### DISS-03-G01 — Papachristou three-grades citation (CRITICAL)
- **Claim**: DISS-03-C076
- **Location**: line 61 (inlinenote: `have to cite/quote papacrhistoou three grades`)
- **Effort**: medium (15-25 min)
- **Resolution**: Insert footnote at line 7 (sensory/deliberative-phantasia distinction) acknowledging Papachristou's three-kinds expansion. Three integration options:
  - (a) integrate three-kind reading into prose
  - (b) acknowledge binary as standard DA III.10 reading with footnote on Papachristou's expansion
  - (c) defer three-kind reading to a later section
- **Corpus route**: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/phx-08-papachristou.md` (pdf pp. 14-17; Aquinas Sentencia Liber II passage on *motus phantasiae*; Table 2: imperfect / sensitive / calculative)

### DISS-03-G06 — DA III.3 citation truncated to "14-15" (HIGH)
- **Claim**: DISS-03-C035
- **Location**: line 37
- **Effort**: trivial
- **Resolution**: Replace "14-15" with full Bekker reference. Likely DA III.3, 427b14-15.
- **Corpus route**: `corpus/index/Aristotle - Complete Works/DA-III-3/`

### DISS-03-G09 — Ecstatic-temporality + Gewesenheit quotations (HIGH)
- **Claim**: DISS-03-C052, C053
- **Location**: line 43 (\hl{(I need quotations for ecstatic temporality and gewesenheit)})
- **Effort**: medium (15-25 min)
- **Resolution**: Insert verbatim quotations from SZ §65 (ecstatic temporality + Gewesenheit).
- **Corpus route**: `corpus/index/Heidegger - Being and Time/`

### DISS-03-G11 — Hexeis/settled-doxai section development (HIGH, deferred)
- **Claim**: DISS-03-C055 (line 45 `\hl{(Repeat quote in the final settled disposition section.)}`) + DISS-03-C059 (line 47 "settled memory...like a settled doxa, as an additional unmoved originator")
- **Effort**: large (deferred to hexeis-development task)
- **Resolution**: §1.3 properly gestures at the hexeis structure but does not develop it. Deferred to §3 Wave 1 hexeis-development task spanning §§1.3-1.5. NO immediate action in §1.3 beyond cross-linking.
- **Cross-section**: see §1.4 (hexis-saturation + technē/praxis bivalence) and §1.5 (hexeis development in concluding action).

### DISS-03-G15 — "DA p. 6" vague pagination (HIGH)
- **Claim**: DISS-03-C145
- **Location**: line 117
- **Effort**: small (5-10 min)
- **Resolution**: Replace "DA p. 6" with specific Bekker locus. Likely DA II.4, 415b21-28 OR DA III.10.
- **Corpus route**: `corpus/index/Aristotle - Complete Works/DA-II-4/` or `DA-III-10/`

### DISS-03-G16 — "Physics 15-17" vague pagination (HIGH)
- **Claim**: DISS-03-C148
- **Location**: line 117
- **Effort**: small (5 min)
- **Resolution**: Replace "Physics 15-17" with Physics II.1, 192b13-23.
- **Corpus route**: `corpus/index/Aristotle - Complete Works/PHYS-02/`

### DISS-03-G19 — Four-vs-three orientational-modes inconsistency (HIGH, architectural)
- **Claim**: DISS-03-C030
- **Location**: line 31 (says "Four orientational modes" but enumerates three)
- **Effort**: small (5-10 min)
- **Resolution**: Delete line-31 paragraph (near-duplicate of line 29) OR edit "Four" to "Three". Recommend deletion.

---

## Medium-priority gaps

| Gap ID | Claim | Location | User marker | Effort | Resolution |
|--------|-------|----------|-------------|--------|------------|
| DISS-03-G02 | C006 | line 7 (`\hl{CITE}`) | hl#1 | small | Papachristou + Frede footnote |
| DISS-03-G03 | C008 | line 7 (two `footnote{CITE}`) | content placeholders | small | DA III.10, 433b29 + DA III.3, 428a1-3 |
| DISS-03-G04 | C010 | line 9 (`footnote{soul never thinks...Heidegger noesis}`) | content placeholder | small | DA III.7, 431a16-17 + BCAP 134 |
| DISS-03-G07 | C038 | line 37 (`\hl{Heidegger logos/speech quote}`) | hl#2 | small-medium | BCAP 95/110/176 logos passage |
| DISS-03-G10 | C053 | line 43 | (combined w/ G09) | medium | Same SZ §65 locus as G09 |
| DISS-03-G12 | C082 | line 65 (`\hl{(CITE)}`) | hl#6 | small | SZ §65 ecstases locus |
| DISS-03-G13 | C084 | line 67 (`\hl{(double check numbering)}`) | hl#7 (self-flagged) | trivial | Migrate M_2→M_3 to M_2→A_3 |
| DISS-03-G14 | C090 | line 77 (`\hl{(Expand)}`) | hl#8 | small-medium | Expand 2-3 sentences with BCAP |
| DISS-03-G17 | C155 | line 123 (`\inlinenote`) | inlinenote#3 | medium | User decision: integrate or delete |
| DISS-03-G20 | C003 | line 5 | (none) | small | DA III.7, 431a14-17 |
| DISS-03-G21 | C009 | line 9 (`footnote{secondary quotations}`) | content placeholder | small-medium | Frede + Caston secondary |
| DISS-03-G22 | C026 | line 29 | (none) | small | DA III.11, 434a16-21 |
| DISS-03-G23 | C078 | line 65 | (none) | small | DA III.10, 433b12-25 |
| DISS-03-G27 | C063 | line 53 | (none) | small | DA III.10, 433b29 + III.11 |
| DISS-03-G29 | C143 | line 117 | (none) | small | DA III.10, 433a27-29 |
| DISS-03-G05 | C011 | line 9 (`footnote{Quotation, definition, point.}`) | content placeholder | small-medium | Burke RoM 19-23/55-59 identification |
| DISS-03-G18 | C031 | line 33 (`\inlinenote{bracket-disambiguation}`) | inlinenote#2 | trivial | Add disambiguation footnote (user's own solution) |

---

## Low-priority gaps (optional reinforcement + editorial)

| Gap ID | Claim | Description | Effort |
|---|---|---|---|
| DISS-03-G08 | C039 | `\hl{conceptual}` lexical review | trivial |
| DISS-03-G24 | C021 | Met. IX.6-8 dunamis/energeia optional reinforcement | small |
| DISS-03-G25 | C034 | DA III.8 abstraction reinforcement | small |
| DISS-03-G26 | C036 | Met. Z.10 + Caston hedging | small |
| DISS-03-G28 | C115 | Rhet. II.1 pathē locus optional | small |
| DISS-03-G30 | C034 | Add hedging language ("on the present account") | trivial |
| DISS-03-G31 | C037 | Hedge "every man" claim | trivial |
| DISS-03-G32 | C049 | Hedge "functions not merely as X" claim | trivial |

---

## Deferred / cross-section items

| Deferred ID | Description | Owner |
|---|---|---|
| DISS-03-D01 | Hexeis/settled-doxai development (lines 45 + 47) — gestured not developed | §3 Wave 1 hexeis-development task spanning §§1.3-1.5 |
| DISS-03-D02 | Five M→M-old-convention migrations (lines 59, 65, 67, 114, 117) | §3 Wave 1 numbering audit |
| DISS-03-D03 | Phase-1-metadata records inlinenote at line 125 but file has 124 lines | §3 audit (counting artifact) |

---

## Corpus routing summary

The §1.3 citation gaps split across these `corpus/index/` sub-corpora:

| Sub-corpus | Hits |
|---|---|
| Aristotle - Complete Works (DA III.3, III.7, III.8, III.10, III.11; Mem.; MA; Met. Z.10, IX; Phys. II; Rhet. II) | 14 |
| Aristotelian Phantasia Secondary (1985-2017) (Papachristou, Frede, Caston) | 5 |
| Heidegger - Basic Concepts of Aristotelian Philosophy | 4 |
| Heidegger - Being and Time | 3 |
| A Grammar of Motives (Burke 1945) | 1 |
| Editorial-only (no corpus needed) | 7 |
| **Total (some claims hit multiple corpora)** | 34 routes for 32 gaps |

**Perplexity queries needed: ZERO.** All §1.3 gaps resolvable from corpus/index alone. This frees §1.3's share of the Perplexity budget for redistribution to §§1.0/1.1/1.2/1.5 per the Phase 3.5 / Phase 4 reallocation policy.

---

## User-acknowledged markers attached to gaps (cross-reference)

13 user-acknowledged markers from phase-1-metadata are attached to specific gaps:

| # | Marker | Line | Gap ID(s) | Status |
|---|--------|------|-----------|--------|
| 1 | `\hl{CITE}` (line 7) | 7 | G02 | Pending Papachristou/Frede |
| 2 | `\hl{Heidegger logos/speech quote}` | 37 | G07 | Pending BCAP |
| 3 | `\hl{conceptual}` | 37 | G08 | Editorial lexical review |
| 4 | `\hl{(I need quotations for ecstatic temporality and gewesenheit)}` | 43 | G09, G10 | Pending SZ §65 |
| 5 | `\hl{(Repeat quote in the final settled disposition section.)}` | 45 | G11 (deferred D01) | Hexeis-development task |
| 6 | `\hl{(CITE)}` | 65 | G12 | Pending SZ §65 (combined with G09/G10/G12) |
| 7 | `\hl{(double check numbering)}` | 67 | G13 (deferred D02) | Mechanical migration |
| 8 | `\hl{(Expand)}` | 77 | G14 | Pending BCAP expansion |
| 9 | `\inlinenote` Frede dual-trace reference | 1 | (integrated) | Already-integrated reference; verify Frede page |
| 10 | `\inlinenote` bracket-disambiguation | 33 | G18 | User's own solution available |
| 11 | `\inlinenote{have to cite/quote papacrhistoou three grades}` | 61 | **G01 (CRITICAL)** | Papachristou index corpus-routed |
| 12 | `\inlinenote` Heidegger BCAP 124 krisis-doxa | 123 | G17 | User integration decision required |
| 13 | `\inlinenote` line 125 | 125 | D03 (artifact) | Phase-1-metadata counting issue |

All 13 markers tracked. Eight resolvable from corpus/index immediately; three require user decision (integration vs. delete); two are deferred for cross-section coordination.
