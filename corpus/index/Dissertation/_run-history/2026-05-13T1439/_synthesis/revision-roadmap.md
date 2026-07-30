# Dissertation Revision Roadmap — Run 2026-05-13T1439

**Generated**: 2026-05-13 (Phase 5 Revision Roadmap Compilation agent)
**Pipeline plan reference**: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/DISSERTATION-ANALYSIS-PIPELINE-PLAN.md` v1.4 §11
**Authoritative terminology source**: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/terminology-decisions-final.md` (USER-LOCKED 2026-05-13)
**Purpose**: Single-page-of-truth, user-facing strategic roadmap. Tactical per-section detail lives in the six `_per-section/<id>/revision-checklist.md` files.

---

## Run metadata

| Field | Value |
|---|---|
| Run-id | `2026-05-13T1439` |
| Run path | `corpus/index/Dissertation/_run-history/2026-05-13T1439/` |
| Wall-time | ~3.85 hours (14:54 → 18:45 PDT, 2026-05-13) |
| Total Perplexity spend | $2.33 of $100 cap (2.3% utilization; pause threshold never reached) |
| Perplexity queries executed | 17 (11 S1 + 4 S2 + 2 S3) |
| Citation-fill proposals produced | 154 (12 §1.0 + 22 §1.1 + 13 §1.2 + 25 §1.3 + 49 §1.4 + 33 §1.5) |
| Cache reconciliation | 244-entry MASTER-CITATION-REPORT; 34/37 §1.4 corpus-routable gaps cache-resolved (92%) |
| Token budget | Within plan estimates (no budget pause triggered) |

---

## Total scope

- **6 sections + 1 diagram** = 7 primary units
- **982 claims** extracted across the six sections; **841 cross-section edges**
- **207 citation gaps total** (Tier-routing breakdown below)
- **154 citation-fill proposals** already drafted (Phase 4 output, ready for user review)
- **21 inconsistency-and-fallacy findings** (5 CRITICAL, 10 MAJOR, 6 MINOR)
- **3 user-mandated relocations** + 31 downstream edits across §§1.0–1.5 + diagram
- **33 numbering migration patches** ($M_n \to M_{n+1}$ → $M_n \to A_n$) across 6 files + diagram
- **~50 terminology migration touchpoints** per `terminology-decisions-final.md`:
  - *pathos simpliciter* → *epithymia* × 23 occurrences (§§1.2/1.3/1.4)
  - *resonant orexis* → *resonant epithymia* × 24 occurrences (§§1.0/1.3/1.4/1.5)
  - *resonant pathē* insertions ~5 sites (§1.3 Memory + §1.4 Feedback Loop)
  - *Befindlichkeit* → `state-of-mind (*Befindlichkeit*)` × ~25 occurrences (§§1.2/1.4/1.5)
- **§1.5 is the SOLE Lanham-DRIFT section** across all 6 (periodic +0.14; sig-transition collapse 45→4)

### Tier breakdown of the 207 citation gaps

| Tier | Count | % | Routing |
|---|---|---|---|
| A — corpus/index routable | 143 | 69.1% | User adds verbatim from existing corpus/index pipelines |
| B — ChromaDB / corpus/download routable | 7 | 3.4% | User queries ChromaDB or Tier-B deep-analysis digest |
| C — Perplexity (cache + fresh) | 17 fresh + ~24 cache | 8.2% fresh + cache | 17 fresh Perplexity proposals written; 24 cache routes via MASTER-CITATION-REPORT |
| Placeholder (`******`) — user manual fill | 11 | 5.3% | User adds verbatim from source per `feedback-missing-source-placeholder.md` |
| In-text fix only (typos/Bekker/numbering) | 29 | 14.0% | Mechanical fixes; no external lookup |
| **Total** | **207** | **100%** | |

### Inconsistency severity distribution

| Severity | Count | Indicative findings |
|---|---|---|
| CRITICAL | 5 | INCONS-001 (Aₙ-naming systemic), INCONS-002 (Burke pp.280-281), INCONS-003 (Hawhee work-title), INCONS-004 (§1.0 internal contradiction), INCONS-005 (*pathos* equivocation risk) |
| MAJOR | 10 | INCONS-006…010, 011, 012, 013, 014, 021 |
| MINOR | 6 | INCONS-015…020 |

---

## Critical-path order (do these FIRST, IN ORDER)

Steps 1–7 are sequenced for a reason: terminology must lock before sections can revise (terminology touches every section); numbering must lock before sections finalize (so the user is not editing a moving target); architectural Aₙ-naming must resolve before §§1.0 and 1.5 can finalize. Steps 5–7 can begin in parallel with Step 4 once the Aₙ convention is fixed.

---

### Step 1 — Terminology migration (USER DECISIONS LOCKED — execute mechanically)

**Reference**: `_synthesis/terminology-decisions-final.md`
**Status**: USER-AUTHORIZED Q1/Q2/Q3/Q4 decisions; ready to execute
**Effort**: **150–245 min (~2.5–4 hours)**
**Blocks**: All section-level revisions

| Sub-step | Action | Sites | Effort |
|---|---|---|---|
| 1.1 | Find/Replace *pathos simpliciter* → *epithymia* (LaTeX italics preserved) | 23 occurrences across §§1.2 (8), 1.3 (8), 1.4 (7) | 15–30 min |
| 1.2 | Find/Replace *resonant orexis* → *resonant epithymia* | 24 occurrences across §§1.0 (2), 1.3 (15), 1.4 (6), 1.5 (1) | 15–25 min |
| 1.3 | Identify and INSERT *resonant pathē* at memory-/expectation-phantasma-attached emotion sites | §1.3 Memory subsection (lines 41–48) + §1.4 Feedback Loop (lines 86–115) | 60–90 min |
| 1.4 | Standardize *Befindlichkeit* → `state-of-mind (*Befindlichkeit*)` (italicized German parenthetical after every occurrence) | ~25 occurrences across §§1.2 (4), 1.4 (18), 1.5 (3); resolves INCONS-007 | 30–45 min |
| 1.5 | Insert 4 footnotes at first-use sites — *epithymia* (§1.2 ~line 41), *resonant epithymia* (§1.2 ~line 63), *resonant pathē* (§1.3 Memory or §1.4 Feedback Loop), `state-of-mind (*Befindlichkeit*)` (§1.2 or §1.4) | 4 footnote insertions (verbatim in `terminology-decisions-final.md` §§3.1–3.4) | 30–45 min |
| 1.6 | Add basic-affective-valence cross-reference at §1.2 line 57 (per Q4b) | 1 sentence (~15 words) | 5–10 min |

**Downstream effect on Phase 4 proposals**: The 154 citation-fill files reference the OLD terminology in their anchor-text fields (e.g., `*pathos simpliciter*`). At fill-acceptance time, the user replaces the anchor wording with the new term. No file rewriting needed pre-acceptance.

---

### Step 2 — Mechanical numbering migration ($M_n \to M_{n+1}$ → $M_n \to A_n$)

**Reference**: `_synthesis/numbering-audit.json` (33 patches) + `_synthesis/diagram-renumbering-patch.md`
**Warrant**: *Physics* V.1, 224b7–8 — motions take their name from the actuality they produce
**Effort**: **30–60 min** total
**Blocks**: Section-level revisions (avoid editing a moving target)

| Section | Patches | Notes |
|---|---|---|
| §1.0 (TikZ block, lines 186/190/194/198) | 4 | All user-facing TikZ labels |
| §1.1 | 3 | Includes notation-declaration revision at line 5 (user-review-recommended phrasing) |
| §1.2 | 2 | **USER REVIEW REQUIRED** at lines 83/99 — Option (c) recommended (same as $M_2 \to A_3$ phantastic motion); see numbering-audit.json §"substantively_distinct_user_review_required" |
| §1.3 | 5 | Includes `\hl{(double check numbering)}` annotation cleanup at line 67 |
| §1.4 | 4 | Includes notation-declaration revision at line 118 (user-review-recommended phrasing) |
| §1.5 | 4 | Includes subsection-title rewrite at line 1 |
| Diagram | 9 dev-comment + 1 already-user-facing | Runtime SVG arrow labels already correct via `motionDisplayId()` at HTML line 1522 |
| **TOTAL** | **33 patches** | |

---

### Step 3 — Burke + Hawhee citation corrections (CRITICAL — INCONS-002, INCONS-003)

**References**: `_synthesis/burke-correction-evidence.md`, `_synthesis/hawhee-correction-evidence.md` (Edit-ready patches included)
**Effort**: **30–45 min**

| Correction | Sites | Action |
|---|---|---|
| Burke *Grammar* pp.280–281 → pp.253 + pp.261–262 | 3 §1.1 instances + PROMPT.md sweep (lines 43, 47, 127, 172) | "one actuality always precedes" → p.253; "man is prior to boy" + entelechy → pp.261–262 |
| Hawhee *Bodily Arts* → "Looking Into Aristotle's Eyes" / "Rhetorical Vision" (2011) p.154 | 1 §1.1 instance (line 19 .md / line 21 .tex) | Replace book attribution with article attribution per `hawhee-correction-evidence.md` Option B |

**Sweep also**: §§1.3/1.4/1.5 for further Burke pp.280–281 occurrences (none detected by Phase 3 but verify on revision).

---

### Step 4 — Architectural Aₙ-naming systemic-inconsistency resolution (INCONS-001 / 004 / 011 / 013)

**Reference**: `_synthesis/inconsistencies-and-fallacies.json` INCONS-001 + INCONS-004
**Effort**: **60–120 min**
**Blocks**: §§1.0 and 1.5 cannot finalize without this resolution

Adopt the **diagram convention** chain-wide (Convention (b) per INCONS-001):

| Node | Canonical meaning |
|---|---|
| $A_0$ | Motion + time (ontological horizon) |
| $A_1$ | Completed perception |
| $A_2$ | *Phantasma* proper |
| $A_3$ | Branching cognitive actualities (three orientational modes + orthogonal doxa) |
| $A_4$ | Completed action (*praxis*) |

**Actions**:
1. Rewrite §1.0 line 45 prose for $A_3$ = "completed cognitive actuality (phantasma under three orientational modes + doxa)" and $A_4$ = "completed action (*praxis*)"
2. Rewrite §1.0 line 64 to describe $A_2 \to A_3$ as cognitive engagement of the *phantasma*
3. Rewrite §1.0 line 68 to describe $M_3 \to A_4$ (post-Step 2) as orectic motion to action
4. Verify §1.0 embedded TikZ labels (Step 2 already migrated these mechanically)
5. Propagate to §§1.1–1.4 chain references — especially §1.3's three-vs-four orientational-modes confusion (INCONS-012, line 31 "Four orientational modes" → "Three orientational modes")
6. Resolve §1.5 line 5 "§1.5" self-reference (INCONS-013) → likely "§1.4"

---

### Step 5 — Relocations (3 user-mandated)

**Reference**: `_synthesis/relocations.json` + `_synthesis/relocations.md`
**Effort**: **180–240 min total** (~3–4 hours)
**Blocks**: §1.2 finalization
**Execution order**: REL-001 → REL-002 (coupled; the DA II.5 footnote moves with REL-001) → REL-003

| Relocation | Source | Target | Words moved | Effort |
|---|---|---|---|---|
| **REL-001** *pathos*-Metaphysics-fourfold | §1.4 lines 35–49 (DISS-04-S3b) | §1.2 lines 43–47 (DISS-02-S4) | ~850 (of 1,002) | 75–90 min |
| **REL-002** *paschein* preservation/destruction | §1.4 line 23 (DISS-04-S3 terminal ¶) | §1.2 line 41 (DISS-02-S4, extending C062) | ~280 | 40–50 min |
| **REL-003** perception-as-*krisis* BCAP 126 | §1.4 lines 57–58 (DISS-04-S3c) | §1.2 lines 23–25 (DISS-02-S2; fills existing `******` placeholder) | ~320 | 60–90 min |
| Cross-section verification | §§1.0, 1.1, 1.3, 1.5 cross-refs | n/a | n/a | 20–30 min |

**REL-001 + REL-002 are coupled**: the DA II.5 footnote at §1.4 line 46 is structurally bound to the fourfold-narrowing gloss; it moves with REL-001. Execute REL-001 first.

**REL-003 fills an existing `******` placeholder at §1.2 line 23** (one of 6 in §1.2), reducing §1.2's placeholder count from 6 to 5.

---

### Step 6 — Diagram static exports (per-section cutouts)

**Reference**: `_per-section/DISS-DIAG-V7/static-exports/` (7 pre-generated files)
**Effort**: **30–45 min** (review + integrate the pre-generated exports)

Static exports already produced in Phase 2c:
- `diag-full-chain.md` (full $A_0 \to A_4$ chain)
- `diag-A0-for-section-1.1.md`
- `diag-A1-A2-for-section-1.2.md`
- `diag-M2-A3-doxa-for-section-1.3.md`
- `diag-A3-M3-A4-for-section-1.4.md`
- `diag-hexeis-for-section-1.4.md`
- `diag-A4-recursive-for-section-1.5.md`

User integrates these into the dissertation LaTeX during final compilation.

---

### Step 7 — Hexeis / settled-doxai development (diagram region + §1.4/§1.5 prose)

**Reference**: `phase2-node-audit.json` (SETTLED-DOXAI flagged user-under-developed) + INCONS-021 (Type 2/Type 3 hexis bivalence consistency)
**Effort**: **90–180 min**

- Develop diagram SETTLED-DOXAI region (additional nodes; user-flagged underdeveloped at HTML line 1186)
- Develop §1.4 *hexeis* prose (current 31 *hexis*/*hexeis* occurrences in §1.5, ~12 in §1.4)
- Develop §1.5 praxis-hexis/technē-hexis bivalence treatment (DISS-05-C081 forward-bridges to §1.4)
- Insert §1.4 forward-promise mentioning Type 2 (habitual-procedural) chains (INCONS-021)
- Insert §1.5 cross-reference to §1.4 at praxis-hexis introduction

---

## Critical-path effort summary

| Step | Effort (min, midpoint) |
|---|---|
| Step 1 — Terminology migration | 198 (range 150–245) |
| Step 2 — Numbering migration | 45 (range 30–60) |
| Step 3 — Burke + Hawhee corrections | 38 (range 30–45) |
| Step 4 — Aₙ-naming resolution | 90 (range 60–120) |
| Step 5 — Relocations | 210 (range 180–240) |
| Step 6 — Diagram static exports | 38 (range 30–45) |
| Step 7 — Hexeis development | 135 (range 90–180) |
| **TOTAL critical-path** | **~754 min (~12.6 hours)** (range 9.5–15.6 hours) |

---

## Section-by-section revision (after critical-path Steps 1–7)

Each section has a tactical checklist at `_per-section/<id>/revision-checklist.md`. Summary:

### §1.0 Introduction — `_per-section/DISS-00-INTRO/revision-checklist.md`
- Citation gaps: **16** (T6: 4, T5: 8, T7: 3, T4: 1)
- Phase 4 fills: **12** files
- Inconsistencies: INCONS-001/004 (Aₙ architectural — resolved at Step 4), INCONS-005 (pathos register-key footnote), INCONS-014 (phantasia/phantasma distinction), INCONS-015 (resonant motion → resonant kinēsis)
- Promises: 7 fulfilled / 3 partial / 1 unfulfilled-deferred (Chapter ??? placeholder)
- Lanham: **ALL-ALIGNED** with §1.4; register at -0.08 (boundary)
- Estimated post-critical-path effort: **3–5 hours**

### §1.1 A₀ Motion and Time — `_per-section/DISS-01-A0/revision-checklist.md`
- Citation gaps: **18** (T8: 5, T5: 8, T4: 4, T7: 1)
- Phase 4 fills: **22** files (includes 6 Tier-C Perplexity proposals)
- Inconsistencies: INCONS-002 (Burke pp.280-281 — Step 3), INCONS-003 (Hawhee — Step 3), INCONS-009 (Phys IV.14 strong-reading flag propagation; Bekker 223a25-27 → 223a21-26)
- Lanham: **ALL-ALIGNED**; composite 0.488 (above §1.4 baseline 0.439)
- Estimated post-critical-path effort: **4–6 hours**

### §1.2 A₁→A₂ Aisthēsis — `_per-section/DISS-02-A1A2/revision-checklist.md` (POST-RELOCATIONS)
- Citation gaps: **16** (T8: 3, T5: 13) + **6 `******` placeholders** (REL-003 fills 1; 5 remain)
- Phase 4 fills: **13** files (includes 3 Tier-C Perplexity for White verbatims)
- Inconsistencies: INCONS-010 (§1.2 lines 83/99 numbering — Step 2)
- Lanham: **ALL-ALIGNED**; uniform -0.02 to -0.03 across axes (content-driven, not style drift)
- Relocations: TARGET of all 3 relocations (REL-001, REL-002, REL-003)
- Post-relocation word count: ~+850 (REL-001) + 280 (REL-002) + 320 (REL-003) = ~+1,450 words
- Estimated post-critical-path effort: **5–7 hours**

### §1.3 A₃ Orientational Modes — `_per-section/DISS-03-A3/revision-checklist.md`
- Citation gaps: **32** (T8: 7, T5: 23, T7: 2; 21 corpus_index_only, 4 corpus+ChromaDB, 7 editorial)
- Phase 4 fills: **25** files (includes 1 Tier-C Perplexity proposal for Papachristou/Aquinas)
- Inconsistencies: INCONS-012 (three-vs-four orientational modes — Step 4)
- Lanham: **ALL-ALIGNED** (closest match to §1.4 of any non-gold section; all deltas within ±0.03)
- Terminology: largest *resonant orexis* → *resonant epithymia* migration (15 of 24 occurrences)
- Estimated post-critical-path effort: **5–7 hours**

### §1.4 Emotion is Motion — `_per-section/DISS-04-EMOTION/revision-checklist.md` (GOLD STANDARD)
- Citation gaps: **46** total (T8: 9, T5: 24, T7: 11, T4: 2); but 34/37 corpus-routable are cache-resolved (92%)
- Phase 4 fills: **49** files (densest section)
- Inconsistencies: INCONS-006 (line 120 pathē/pathos? marker — Q4a resolved NO), INCONS-007 (Befindlichkeit drift — Step 1.4), INCONS-008 (subsection cross-ref notation §1.X collision), INCONS-011 (basic-affective-valence locus — resolved by Step 4), INCONS-016/017/018/019 (typos), INCONS-021 (Type 2/3 hexis bivalence)
- Relocations: SOURCE of all 3 relocations (REL-001, REL-002, REL-003)
- Post-relocation word count: ~-1,450 words (compensated by feedback-loop and hexeis development in Step 7)
- Lanham: **GOLD STANDARD BASELINE** — minimal style revision; preserve as-is
- Estimated post-critical-path effort: **3–5 hours** (less than other sections; the section is the baseline)

### §1.5 A₄ Completed Action — `_per-section/DISS-05-A4/revision-checklist.md` (CONCLUSION — revise LAST)
- Citation gaps: **78** (highest count; structurally most under-developed) — 50 Aristotle + 12 Heidegger + 8 secondary + 35 interpretive-flag + 4 numbering + 4 cross-ref-verifications
- Phase 4 fills: **33** files (includes 7 Tier-C Perplexity proposals + 2 S3 deep-research essays Q-016/Q-017)
- Inconsistencies: INCONS-013 (§1.5 self-reference — Step 4), INCONS-020 ("chain analysis is complete" overreach), INCONS-021 (Type 2/3 hexis bivalence — Step 7)
- Lanham: **DRIFT (sole drift section)** — periodic +0.14 toward periodic; signature-transition collapse 45→4; opacity × sig-transitions composite 14.2× below §1.4 baseline; zero footnotes; zero explicit interpretive flags
- **Blocked on upstream**: 5 gaps (DISS-05-G-C017, C033, C081, C098, C015); revise LAST
- Estimated post-critical-path effort: **12–18 hours** (highest single-section effort by far)

---

## Section-by-section effort summary

| Section | Effort (hours, midpoint) | Sequencing |
|---|---|---|
| §1.0 | 4.0 | After Steps 1–4 (terminology + Aₙ resolution) |
| §1.1 | 5.0 | After Steps 1–3 (terminology + numbering + Burke/Hawhee) |
| §1.2 | 6.0 | After Steps 1–5 (terminology + numbering + Aₙ + relocations) |
| §1.3 | 6.0 | After Steps 1–4 (terminology + numbering + Aₙ resolves three-vs-four) |
| §1.4 | 4.0 | After Steps 1–5 (terminology + relocations done) |
| §1.5 | 15.0 | **LAST** — after all §§1.0–1.4 stabilize |
| **TOTAL section-level** | **~40 hours** | |

**Grand-total user-execution effort** (critical-path Steps 1–7 + section-level): **~52.6 hours (range 49.5–55.6 hours)**, well-distributed across multiple sessions.

---

## Post-revision: re-run pipeline

After all section revisions are complete, re-run this pipeline on the revised draft:

- **Run-time**: ~2–3 hours (parallelized; this run took ~3.85 hours and included setup overhead)
- **New `_run-history/<new-run-id>/` directory** will be created
- **`_living/diff-from-previous.md`** will surface:
  - **Resolved flags** (the wins)
  - **Remaining open flags** (carried forward)
  - **Newly-introduced flags** (often: revisions that fixed one thing and broke another, e.g., relocation seams in §1.2)
  - **Sections with shifted Lanham profile** (e.g., §1.5 post-revision should show signature-transition restoration 4 → ≥30)

Per Plan §15.2 Q-H the second run will likely also surface:
- §1.2 Lanham profile shift after the three relocations land (+1,450 words; predict still ALIGNED per Phase 3 Wave 3 finding)
- §1.5 Lanham profile shift after signature-transitions restored (predict ALL-ALIGNED post-revision)
- §1.4 Lanham profile shift after -1,450 words removed (predict still GOLD-STANDARD baseline)

---

## Backlog (not blocking; address before final submission)

### Deep-analysis sources flagged for potential future corpus/index pipelines

Per `_synthesis/deep-analysis-source-digests.md` (Phase 4 Tier B):

| Source | Density (relevance score) | Status | Recommendation |
|---|---|---|---|
| Caston 2021 *Aristotle on the Cartesian Theatre* | 47.17 ★★★ | corpus/download only | **Most-substantive deep-analysis candidate**; consider full corpus/index pipeline for §1.3 and §1.4 phantasma content-theory |
| Agosta 2010 *Clearing of the Affects* | 39.41 ★★★ | corpus/download only | Consider full corpus/index pipeline for §1.4 BCAP secondary backing |
| Dow 2011 *Aristotle's Theory of the Emotions* | 8.21 ★★★ | corpus/download only | Consider full corpus/index pipeline for §1.4 hedonic-tonality + Rhetoric II support |
| Costache 2013 | operationally upgraded ★★→★★★ | secondary | Already pipelined; flagged for promotion |

### Corpus-index pipeline gaps surfaced by Phase 4

- **NE II–IV pipeline gap** — surfaced by DISS-04-G42 (per-pathos hexis correlate listing) and DISS-05-G10 (NE direct-quote needs). The corpus has Aristotle-Complete-Works text but no dedicated NE II–IV exegetical pipeline.
- **Burke *Rhetoric of Motives* (1950) pipeline gap** — surfaced by DISS-03-G05 (Hazlitt identification). Currently only Burke *Grammar of Motives* (1945) is pipelined.

### Phase 4 forward-integration

- **Register the dissertation itself as a corpus/index pipeline** once the final draft is approved. This enables future works (e.g., a second dissertation chapter, articles drawn from this chapter) to cite this chapter via the same pipeline machinery.

### Resolved user-internal uncertainty

- ICE C236 "pathē/pathos?" user-internal uncertainty at §1.4 line 120 (INCONS-006) — **resolved by terminology-decisions Q4a**: NO *pathē* for basic affective valence. Confirm during revision and remove the parenthetical question mark.

---

## Quality-gate compliance (Plan §11.2)

| Gate | Status |
|---|---|
| Roadmap orders work into critical-path (≥5 sequential steps) + parallel section work | PASS (7 critical-path steps + 6 parallelizable per-section checklists) |
| Every section has citation-gap count + Lanham-drift summary + estimated effort | PASS (all 6 sections summarized above + tactical checklists) |
| Critical-path Step 1 (terminology) — flagged as user decision in plan but LOCKED here | PASS (USER-AUTHORIZED via `terminology-decisions-final.md`; Step 1 is now executable, not gating) |
| Re-run protocol documented | PASS (post-revision section above) |
| Backlog explicitly captures Phase 4 forward-integration | PASS (backlog section above; 4 source candidates + 2 corpus-index pipeline gaps + dissertation-as-pipeline note) |

---

## Single-question gating summary (for the user)

| Question | Answer |
|---|---|
| What do I do FIRST? | Step 1 — terminology migration (~3 hrs; mechanical now that decisions are locked) |
| What blocks what? | Step 1 blocks all section-level revisions; Step 2 blocks final-form section revisions; Step 4 blocks §1.0 and §1.5 finalization; Step 5 blocks §1.2 finalization |
| What's the most painful section? | §1.5 (12–18 hrs; revise LAST after §§1.0–1.4 stabilize) |
| What's the easiest section? | §1.0 (3–5 hrs) and §1.4 (3–5 hrs; §1.4 is the gold standard with minimal style revision) |
| Total effort? | ~50–55 hours of focused revision work |
| Anything I can defer until after submission? | Caston 2021 / Agosta 2010 / Dow 2011 full pipelines; NE II–IV pipeline; Burke *Rhetoric of Motives* pipeline; dissertation-as-pipeline registration |
