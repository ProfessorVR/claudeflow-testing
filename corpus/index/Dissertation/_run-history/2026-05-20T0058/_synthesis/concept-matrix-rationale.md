# Concept Matrix Rationale

**Pipeline:** Dissertation Analysis Pipeline v1.4
**Run-id:** `2026-05-13T1439`
**Agent:** Phase 3 Wave 1 Agent C (Concept Ontology + Matrix)
**Inputs:** 6 × `phase2-claims.json` (DISS-00 through DISS-05), aggregated from 882 claims total
**Output:** `_synthesis/concept-matrix.csv` (81 concept rows, 6 section columns)

---

## 1. Method

For each section's `phase2-claims.json` I extracted (a) all claim-level
`coined_terms_present` / `ct` flags (high-signal user-coined vocabulary), and
(b) raw lowercase substring occurrences across all `claim_text` / `tx` values
(broader coverage including standard Aristotelian and Heideggerian terms,
secondary scholars, and chain-node labels). A concept's per-section score was
then assigned by hand-judgement against the section's stated thesis profile:

| Cell | Definition |
|:----:|:-----------|
| **0** | Absent. The concept does not appear (or appears only as accidental lexical noise). |
| **1** | Mentioned. 1–3 occurrences in peripheral roles, forward-pointer, or recap. |
| **2** | Supporting. Load-bearing in multiple claims but not the section's focal object. |
| **3** | Central. The section's primary object of analysis, or one of several primary objects. |

Coined-term claim flags carry higher weight than raw text counts (a section
that uses a coined term in 5+ flagged claims earns at least a 2, often a 3,
regardless of raw substring frequency). Conversely, substring hits on highly
polysemous terms (`logos`, `form`, `matter`) were down-weighted unless the
claim density confirmed argumentative load.

Where the dissertation treats variants as **distinct objects** (e.g.
`phantasia` vs. `phantasma / phantasmata`, `kinēsis` as a general doctrine vs.
`resonant kinēsis` as a coined extension), I kept them as separate rows.
Where the schema's threefold variants are presented as facets of a single
faculty (e.g. Frede's *capacity / activity / product*), I merged them into a
single row "Frede threefold (capacity/activity/product)".

### Centrality assignment (`core` / `important` / `supporting`)

Per Plan §9.1.3 and §9.6:

- **`core`**: appears in ≥4 sections at score ≥2, OR is thesis-essential
  machinery (actualization chain, three-factor schema, resonant kinēsis,
  resonant orexis, resonant aisthēma, dual-trace, articulational concretion,
  basic affective valence, pathos simpliciter, phantasia, phantasma,
  energeia ateles, kinēsis, orexis, doxa, pathē, orthogonal committal
  doxa). Members of this "thesis-essential" set are tagged `core` even if
  they appear in only 3 sections, because the dissertation's structure
  *presupposes* them downstream.
- **`important`**: appears in 2–3 sections at score ≥2 (chapter-internal
  load-bearing but not dissertation-spanning).
- **`supporting`**: ≤2 sections at score ≥1, or all-section appearance only at
  score 1 (cited in passing).

---

## 2. Headline numbers

| Tier | Count | Examples |
|:-----|------:|:---------|
| **core** | 28 | actualization chain, resonant kinēsis, phantasia, pathos, doxa, orexis, three-factor schema, A_0–A_4 chain nodes, articulational concretion, basic affective valence, dual-trace thesis, orthogonal committal doxa, rhetorical phantasia |
| **important** | 21 | unmoved originator, Dasein, Befindlichkeit, hexis (bivalent), residual trace, alloiōsis, logos enulos, perception-as-joint-energeia, sense-organ, priority of actuality, ontological/ontic distinction |
| **supporting** | 32 | Burke, Frede, Nussbaum, Papachristou, Uexküll, Rickert, kairos, technē, praxis, eidos, sumplokē, hylomorphism, scale-invariance, Mitsein, taking-as-something |
| **TOTAL** | **81** | (Quality gate: ≥30 rows, ≥10 core — both PASS) |

The 28 core concepts represent the dissertation's irreducible architectural
machinery. Approximately half are user-coined (resonant kinēsis / orexis /
aisthēma, dual-trace thesis, articulational concretion, basic affective
valence, pathos simpliciter, orthogonal committal doxa, the actualization
chain with its Aₙ nodes); the other half are canonical Aristotelian terms
that the dissertation re-articulates within its bespoke architecture
(phantasia, phantasma, aisthēsis, kinēsis, orexis, doxa, pathē, energeia
ateles, dunamis, three-factor schema, moved mover, motion-time parallel,
rhetorical phantasia).

---

## 3. Per-section concept coverage profiles

### DISS-00-INTRO — "Rhetorical Phantasia: The Soul's Temporal Medium"

**Signature concepts (score = 3):**
1. `phantasia` (47 mentions across 94 claims)
2. `actualization chain (Aₙ)` + all five chain nodes A_0 through A_4
3. `three-factor schema (DA III.10)` (8 explicit references)
4. `motion-time parallel` (9 mentions)
5. `rhetorical phantasia / soul's rhetorical nature` (the section's framing thesis)
6. `scale-invariance of unmoved originators` (introduced as one of five methodological elements)

**Profile:** The introduction is a *meta-architectural* section. It does not
develop any one node in depth; rather it surveys all five chain nodes,
introduces all the user-coined vocabulary at preview-strength (resonant
kinēsis is the precursor "resonant motion" here at T_3), and lays out the
five-element methodological apparatus (three-factor schema, priority of
actuality, terminus-naming principle, scale-invariance, actuality-first
architecture). Heideggerian apparatus is light (SZ §72 cited once); the
introduction is heavily Aristotelian.

### DISS-01-A0 — "A_0: Motion and Time as Ontological Horizon"

**Signature concepts (score = 3):**
1. `dunamis / potentiality` (42 mentions; the dominant lexeme of the section)
2. `A_0 (motion-time as first actuality)` (15 mentions; the node itself)
3. `actualization chain (Aₙ)` (6 mentions; the chain's grounding)
4. `kinēsis (motion)` (11 mentions)
5. `energeia ateles` + `entelecheia` (5 + 3 mentions; energeia-ateles is the section's defining doctrine)
6. `priority of actuality` (4 mentions; the section's methodological anchor)
7. `motion-time parallel`

**Profile:** §1.0 is the ontological foundation. It develops Aristotle's
Physics III.1 / IV.11 + Metaphysics IX.8 apparatus into the chain's first
actuality. The phantasia-specific machinery (resonant kinēsis, dual-trace,
phantasma) is **almost entirely absent** here — appropriately, since §1.0
operates at the level of motion/time/actuality/potentiality ontology before
any perceptual specification. Heideggerian temporal-horizon language
(`ecstatic temporality`, `Dasein`) is present at moderate strength — the
section's secondary Heideggerian gloss.

### DISS-02-A1A2 — "A_1 → A_2: The Actualization of Perception"

**Signature concepts (score = 3):**
1. `resonant kinēsis` + `resonant aisthēma` + `resonant orexis` (12 + 6 + 15 coined-term claim flags) — the dual-trace components introduced here
2. `dual-trace thesis` (27 occurrences) — the section's signature interpretive move
3. `hylomorphism` (8 mentions) — the perceptual reception mechanism
4. `alloiōsis (alteration)` + `preservative alteration` (20 mentions) — perception as preservative alloiōsis
5. `aisthēma`, `aisthēsis`, `sense-organ` (9 + 8 + 10 mentions)
6. `A_1`, `A_2` chain nodes
7. `pathos / pathē` + `pathos simpliciter` (29 + 10 mentions)
8. `perception as joint energeia (single event, two logoi)` — the unity-of-mover-and-moved thesis
9. `logos enulos / enmattered accounts` (8 mentions)

**Profile:** §1.1–1.2 is the perceptual mechanics chapter. This is where the
user's coined vocabulary is **canonically introduced and defined** (resonant
kinēsis, resonant aisthēma, resonant orexis, dual-trace thesis, pathos
simpliciter). Heidegger BCAP is heavily cited (11 mentions). Uexküll / Umwelt
appears here in moderate strength as a secondary biological-ontological
gloss. The hylomorphic perception apparatus (DA II.5 / II.12, On Dreams 2) is
fully exposited.

### DISS-03-A3 — "A_3: Completed Cognitive Actuality and the Three Orientational Modes"

**Signature concepts (score = 3):**
1. `phantasma / phantasmata` (108 mentions across 156 claims; the section's primary object)
2. `phantasia` (83 mentions)
3. `doxa (opinion/belief)` (82 mentions; orthogonal committal layer)
4. `orthogonal committal doxa` (12 explicit occurrences) — the section's signature interpretive move
5. `three orientational modes (intellection/memory/deliberative-speculative)` — the section's structural frame
6. `noēsis / nous`, `memory (mnēmē)`, `bouleutikē phantasia` — the three modes themselves
7. `taking-as-something` (4 coined-flags + 2 truth/falsity variants) — the aspectual-presentation move
8. `A_3 (phantasma proper)`, `A_4 (completed cognitive actuality)` — entry and exit nodes
9. `resonant orexis` (16 coined-flags; bridge to A_4 + setup for §1.4's flip)
10. `central organ / kardia` — the seat of phantasma generation

**Profile:** §1.3 is the largest section (156 claims) and the most
architecturally dense. It develops the phantasma as the cognitive object
under three orientational modes (intellection, memory, deliberative-
speculative synthesis) plus an *orthogonal* doxa-committal dimension. This is
the dissertation's distinctive cognitive-architecture proposal.

### DISS-04-EMOTION — "Emotion: The Articulational Concretion of Pathos"

**Signature concepts (score = 3):**
1. `pathos / pathē` (144 mentions across 306 claims — heaviest density in the dissertation)
2. `doxa` (47 mentions; gates emotion)
3. `articulational concretion` (22 coined-term claim flags) — the section's coined mechanism
4. `basic affective valence` (35 coined-flags) — the baseline affective layer
5. `Befindlichkeit (state-of-mind)` (17 mentions), `Stimmung (mood)` (13), `Geworfenheit (thrownness)` (17) — the section's Heideggerian triad
6. `being-affected / pathein` (9 mentions; affect ontology)
7. `rhetorical phantasia / soul's rhetorical nature` (38 mentions) — emotion as rhetorical mechanism
8. `ontological/ontic distinction` (18 mentions; pathē as ontologically constitutive vs ontically discrete)
9. `phantasma / phantasmata` (26 mentions; emotion's material)
10. `actualization chain (Aₙ)` (4 mentions; emotion as articulation at A_3/A_4)
11. `orexis (desire)` (14 mentions; emotion as mobilized orexis)

**Profile:** §1.4 is the emotion chapter and the dissertation's
Aristotelian-Heideggerian synthesis. It is where Heideggerian apparatus
(Befindlichkeit, Stimmung, Geworfenheit) is most heavily deployed. The
section's signature coined moves are `articulational concretion` (the
mechanism by which basic affective valence becomes determinate emotion under
doxa-content) and `basic affective valence` (the pre-determinate substrate).

### DISS-05-A4 — "M_3 → M_4 and A_4: The Three Types of Action"

**Signature concepts (score = 3):**
1. `hexis (bivalent: technē vs praxis)` (37 mentions + technē-hexis / praxis-hexis coined-flags) — central
2. `doxa` (48 mentions; gates action via doxa-gate mechanism)
3. `doxa-gate / content-conditional gating` (3 "doxa-gate" coined-flags + 1 "content-conditional gating")
4. `praxis (action)` (14 mentions), `technē (craft)` (11 mentions) — the bivalent hexis modes
5. `orexis` (16 mentions), `pathos / pathē` (25 mentions; central to evaluatively complex action)
6. `realizable good (to orekton / to prakton)` — unmoved originator of orectic motion
7. `three-factor schema (DA III.10)` — invariant across the three action types
8. `moved mover` (orextikon as moved mover)
9. `habituation / ethos (sedimentation)` — the dispositional substrate
10. `A_4 (completed cognitive actuality)` — the terminal node of the chain

**Profile:** §1.5 is the action chapter. It deploys the schema established in
earlier sections at a terminal node, but adds the bivalent technē/praxis
hexis distinction and the doxa-gate mechanism for action-type discrimination.
Phantasia-specific machinery is at lower strength (the action chapter
*presupposes* §1.3's A_3 + §1.4's emotion machinery and works from their
output).

---

## 4. Cross-section concept gaps worth surfacing

The matrix reveals several distribution patterns that may or may not be
architecturally appropriate — flagged here for Phase 4 cross-section
synthesis review:

### 4.1 Coined-vocabulary diffusion gaps

| Concept | Pattern | Gap-significance |
|:--------|:--------|:-----------------|
| `dual-trace thesis` | DISS-00 (2) ← DISS-02 (3) → DISS-03 (2) → DISS-04 (1) → DISS-05 (0) | The thesis is introduced in §1.2 and *should* persist as an active organizing principle in §§1.3–1.5. §1.5's drop to 0 is concerning — the dual-trace machinery is what makes resonant orexis flip into emotion-desire-composite at A_4; the section should at minimum recapitulate it. |
| `resonant orexis` | DISS-02 (3) → DISS-03 (3) → DISS-04 (2) → DISS-05 (1) | Strong distribution; the user's note about "§1.5: 1" may understate — DISS-05 has 1 coined-flag and 1 text-hit, plausibly appropriate as recapitulation but worth a sanity-check at synthesis. |
| `articulational concretion` | DISS-00 (0) → DISS-04 (3) → DISS-05 (1) | Heavy in §1.4 (the coined home) with §1.5 carrying it forward. Notable absence in DISS-00: the intro never previews "articulational concretion" by name even though §1.4 develops it as the central pathos-articulation mechanism. Phase 4 may want to add a forward-pointer at §1.0. |
| `basic affective valence` | DISS-02 (2) → DISS-04 (3) → DISS-05 (1) | Introduced lightly in §1.2 (as content of pathos simpliciter), canonically developed in §1.4. The §1.3 absence (0) is appropriate (§1.3 is cognitive, not affective). |
| `orthogonal committal doxa` | DISS-00 (1) → DISS-03 (3) → DISS-04 (2) → DISS-05 (2) | §1.3 is the home; downstream usage is appropriate. §1.0 introduces it lightly at the chapter-roadmap (DISS-00-C091). |

### 4.2 Chain-node coverage gaps

| Node | Coverage profile | Comment |
|:-----|:-----------------|:--------|
| `A_0` | INTRO=3, §1.0=3, §1.1-1.2=2, §1.3=1, §1.4=0, §1.5=2 | §1.4's absence (0) is *unexpected*: emotion is supposed to operate within the chain's ontological ground, so a footnote-level reference to A_0 might be warranted. §1.5 recovers via the "A_0' (recursive new A_0)" coined-flag. |
| `A_4` | INTRO=3, §1.0=1, §1.1-1.2=1, §1.3=3, §1.4=1, §1.5=3 | §1.4's score of 1 may be low — emotion's role is precisely to mobilize orexis *toward* A_4. Phase 4 should verify §1.4 has adequate forward-references to A_4. |

### 4.3 Heideggerian apparatus distribution

| Concept | Distribution | Gap |
|:--------|:-------------|:----|
| `Befindlichkeit` | §1.2=2, §1.4=3, §1.5=1 | Heavily concentrated in §1.4 (the affect chapter); appropriate. §1.0–1.1 / §1.3 absence is appropriate. |
| `Heidegger BCAP` | §1.0=1, §1.2=2, §1.3=1, §1.4=2 | BCAP is the dissertation's main Heideggerian primary; the §1.5 absence (0) is notable. The action chapter's bivalent hexis distinction is **deeply BCAP-rooted** (technē vs praxis at GA18 §17-18); the apparent absence of BCAP citations in §1.5 is the matrix's most surfacing-worthy gap. Phase 4 (citation gap analysis) should sharpen this. |
| `Heidegger Being and Time (SZ)` | INTRO=1, §1.0=2, §1.3=1, §1.4=2, §1.5=1 | Even distribution; appropriate. |
| `Mitsein` | §1.4=2 only | Mitsein appears *only* in §1.4 (twice). Given the dissertation's rhetorical-soul framing, Mitsein should plausibly appear in §1.0 (the rhetorical-soul thesis assumes inter-subjective context) and §1.5 (action is social action). Surfacing-worthy. |

### 4.4 Secondary-scholar distribution

- `Burke` appears in DISS-00 (2), §1.0 (1), §1.3 (1) — concentrated in
  meta-architectural sections; appropriate.
- `Nussbaum` appears only in DISS-00 + §1.2 — single-page citations; expected.
- `Papachristou` appears only in DISS-00 + §1.3 (three-grades-of-phantasia) —
  appropriate concentration.
- `Uexküll` appears only in DISS-00 + §1.2 — DISS-02's Umwelt-frame is its main
  home. **Surfacing-worthy:** Uexküll could potentially appear in §1.5 (action
  is umwelt-relative) but does not. Phase 4 may flag this.
- `Rickert` and `White (1985)` appear only in DISS-00 — single-citations;
  appropriate.

### 4.5 Concepts present in one section but plausibly missing elsewhere

| Concept | Present in | Plausibly missing from |
|:--------|:-----------|:----------------------|
| `central organ / kardia` | INTRO (2), §1.3 (3) | §1.2 (the perceptual chapter — kardia is the seat of pathēma-reception) and §1.4 (emotion lives in the central organ). |
| `practical syllogism` | INTRO (1), §1.3 (1), §1.4 (1), §1.5 (2) | The practical-syllogism apparatus is canonically how orexis converts to action (MA 7, 701a7-35). §1.5 has it (2); appropriate. §1.4 should arguably elevate it from 1 to 2. |
| `eudaimonia` | (NONE) | Not present at any score in any section. This is an architectural choice (the dissertation is not about virtue ethics) but may surface as a gap if Phase 4 audits NE-coverage. |
| `phronēsis` | (NONE) | Similar to above. The technē/praxis distinction is the closest substitute; the absence of explicit phronēsis is consistent with the dissertation's restricted focus. |
| `taking-as-something` | §1.3 (3), §1.5 (1) | This is a §1.3 coined move that arguably should appear in §1.4 (emotion as taking-the-world-as-such-and-such); §1.4's score of 0 is surfacing-worthy. |

---

## 5. Quality gate confirmation

Per Plan §9.6:

| Gate | Required | Actual | Status |
|:-----|---------:|-------:|:------:|
| Concept matrix has ≥30 rows | 30 | **81** | PASS |
| ≥10 core concepts identified | 10 | **28** | PASS |
| CSV is well-formed (proper escaping for commas) | yes | 82 rows × 9 fields uniform; `perception as joint energeia (single event, two logoi)` properly quoted | PASS |

---

## 6. Notes for Phase 4 (citation gap analysis) downstream

The matrix surfaces three high-priority gaps that Phase 4 should investigate
with primary-source citation analysis:

1. **`dual-trace thesis` drop to 0 in §1.5** — verify that §1.5 either
   recapitulates the thesis or has a defensible reason to elide it.
2. **`Heidegger BCAP` absence in §1.5** — the technē-vs-praxis distinction is
   GA18-rooted; the absence is plausibly a citation gap rather than an
   architectural choice.
3. **`articulational concretion` not previewed in DISS-00** — the
   introduction surveys every other coined term; adding a one-line preview of
   articulational concretion at §1.0's chapter-roadmap (line 68, DISS-00-C092)
   would improve the dissertation's architectural cohesion.

Additional medium-priority gaps:
- `Mitsein` confined to §1.4 only
- `Uexküll / Umwelt` confined to §1.2 + INTRO
- `central organ / kardia` missing from §1.2 / §1.4
- `taking-as-something` missing from §1.4
