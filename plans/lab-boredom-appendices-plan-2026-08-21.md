# Lab Boredom Section — Appendices Execution Plan (2026-08-21, v1; rulings v2 same day)

**RULINGS RECEIVED (author, 2026-08-21):** appendix set approved with A split into **A.1 and
A.2** (one per paper); E stays optional. These appendices serve **Section II only** — other
dissertation appendices exist to be created later, and the numbering WILL change then
(memory note filed: lab-boredom-appendix-renumbering). D-A approved with that renumbering
note. D-E: papers **bound in as PDFs at assembly**. D-F: questions recovered from the
survey-response files per author instruction — **DONE, cohort-verified identical across all
12 files; the seventh item is recovered** ("On a scale from 1-9, how tired are you after
watching the video (1 completely awake, 9 completely exhausted)"). D-G approved (technical
register). **FINAL RULINGS:** D-B film-comparison tables EXCLUDED from appendices;
equipment-bookkeeping tables (windows, harmonization, closure-proxy license) KEPT. D-C the
deployment-transfer topic DROPPED entirely. D-D understood — administration wording supplied
by the author at Appendix B drafting. D-H the ADMINISTERED wording is canonical, **no
footnote** on published variants; the L2-prose-vs-administered comparison is the author's
review at Appendix B drafting. CONSEQUENCE: Phase 1's paper re-verification of the six items
is OBSOLETE (canonical text comes from the cohort-verified files, not the paper).

Body complete at `bf2968ac0`; the appendix deferral has lifted. This plan gathers every
appendix promise made across outline v8, the drafted prose, and the session rulings, filters
it through the episode-only ruling, and sequences the work. **Protocol: identical to the
body** — batch gates with full presentation, tree-convention figures, folio-read loci,
EXACT-gated quotations, data-as-agent phrasing, never "laboratory," nothing committed
without sign-off.

## Phase 0 — rulings needed before any drafting

| id | decision | proposal |
|---|---|---|
| D-A | Appendix designation scheme | Section-scoped letters A–E as below; renumbered against the desktop section's appendices at Part assembly. Resolves the `******` in L1 fn A, L2's two footnotes, and L6 ¶21's footnote. |
| D-B | Episode-only filter on inherited appendix items | The v7-era appendix list included film-separation material (the 99-contrast forest, self-report pairwise film contrasts, the film-level EEG tables). The governing ruling EXCLUDES these outright ("not demoted, not appendixed"). Retained as instrumentation QC (not film findings): the two-window comparison, rate harmonization/decimation, closure-proxy licensing, blink-ceiling derivation. Confirm the exclusion list. |
| D-C | The old L6-appendix item "laboratory↔deployment transfer" | DROP — conflicts with the deployment bar; L7 carries the joining. |
| D-D | O-15: IRB-facing wording for survey administration | Author supplies at Appendix B drafting. |
| D-E | Papers-reprint appendix | Whether reprints are bound in as PDFs at assembly or cited-with-pointer; affects only the headnote now. |
| D-F | The seventh survey item's printed wording | Recovery route in Phase 1; if no form document survives, the author (who ran the study) states the wording, attributed as such. NEVER invented. |
| D-G | Register for appendices | Propose: the appendices may run at full technical register (the body/appendix split existed to move technical weight here); the body's lay-explanation rule does not bind appendix tables. |
| D-H | The 2023 paper prints item 2 in two variants (main text vs Table 4). Which is canonical for Appendix B — or both printed with the variance noted? |

## Proposed appendix set

**Appendix A — The published studies.** Reprints (or pointers per D-E) of the 2023 and 2024
papers with a short headnote stating the cohort-continuity fact (three reported of Round 1's
eight; all twelve in 2024 from the same recordings) and the IRB number.

**Appendix B — The survey instrument.** The seven items verbatim (six re-verified EXACT
against the 2023 paper's tables; the seventh per D-F); administration facts (verbal, proctor-
recorded, in the ~5-minute breaks; O-15 wording per D-D); the two derived quantities; the
D-39 coding rules (NA on 1–9 items = scale floor 1; blank minutes-until-bored = never-bored
category, never zero); the parsing-confidence table (exact counts from the tree's journal);
the felt_duration_min column-name clarification.

**Appendix C — Methods in full.** The full criterion-method statement (base:
PROSE-METHODS-CRITERION-VALIDITY-v2 — numbers and logic stand; register per D-G); the
gaze-baseline statement (PROSE-METHODS-GAZE-BASELINE-v2, every result names its reference);
window mechanics + the two-window comparison; rate harmonization + the decimation
measurement; the closure definition (both eyes, per-eye sentinel), the Round-1 proxy license
(r = 0.998 inside Round 2), the 500 ms blink ceiling (VanderWerf 334 ± 67 ms) and its
gaze-position dependency; poolability rules (means pool; variances and windowed statistics
do not); the O-14 multiplicity footnote (no correction in the criterion family, by choice,
stated).

**Appendix D — Full results tables.** All generated by script from the v5 tree, tree
convention (ddof=1), full cohort always:
- D1: the complete criterion table — every channel × both ratings, Spearman and Pearson,
  permutation and analytic p (criterion-validity.csv, pooled).
- D2: the per-round split for the two load-bearing channels (promised by L6 ¶20's footnote).
- D3: the whole-survey battery — every item vs both ratings and vs both eye measures, with
  the within-participant paired tallies.
- D4: the divergence decomposition (all 36) + the episode-wide sensitivity sweep (12/8/9).
- D5: the per-participant matrix (O-05 adopted): per episode, both eye measures (z and raw),
  all seven items, category.
- D6: with/without-S06 (promised by L3's footnote): all eight load-bearing correlations and
  the four paired tallies, at twelve and at eleven — REQUIRES FRESH COMPUTATION.
- D7: EEG retention/SNR table + the flat channels' criterion rows printed (cognitive load,
  HR) — the numbers that make the exclusions non-arbitrary.
- D8: closure-episode counts per round (blink-length vs extended; the 4,365/5,131 splits).

**Appendix E (optional, time permitting, author-ordered memory item)** — the bodycam +
head-motion demonstration on the covered Round 2 cells.

## Phase 1 — recovery and computation (before any prose)

1. **Seventh item**: search the experiment data root for the survey form document (the
   per-subject `.txt` files hold answers, not questions); if none, D-F fallback.
2. **Re-verify the six items** EXACT against the 2023 paper PDF through the gate.
3. **Compute D6** (all twelve, then drop S06, re-standardize the eleven from scratch —
   leave-one-PARTICIPANT-out discipline).
4. **Write `analysis/appendix_tables.py`** — additive script in the v5 tree emitting
   D1–D8 as LaTeX; gates untouched; version discipline noted in the tree.
5. **Exact parsing-confidence counts** re-read from the tree's journal (the D-39 numbers).

## Phase 2 — table generation and verification

Generate all tables; spot-verify one value per table against the source CSV by hand;
Complete-Cohort law applies (no table ships from a subset); any figure challenged is
re-derived from the data.

## Phase 3 — drafting, batch-gated

- B14: Appendix A headnote + Appendix B (1–2 batches; B blocked by D-D/D-F/D-H).
- B15–16: Appendix C (2 batches — criterion statement, then instrumentation).
- B17–18: Appendix D framing prose + tables presented in full (2 batches).
- B19 (optional): Appendix E.

## Phase 4 — integration

Pin the designations into the three `******` footnotes (L1, L2 ×2, L6); re-render L1 from
the master; regenerate the assembled `Part_III_Section_II.tex` with appendices; update the
memory state note; commit gate.

## Risks / flags

- Desktop-section appendix designations may collide at Part assembly (D-A renumbering).
- PROSE-METHODS v1 files must NEVER be pasted (inverted closure signs) — v2 only.
- The old film-scoped tables (stats-pairwise, selfreport-pairwise, replication-r1-vs-r2)
  stay out of Appendix D per D-B unless the author rules otherwise.
