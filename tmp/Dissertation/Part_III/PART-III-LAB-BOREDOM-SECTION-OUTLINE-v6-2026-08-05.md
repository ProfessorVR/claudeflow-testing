# Part III — Laboratory Boredom Section — MODULAR OUTLINE v6 (2026-08-05)

**Status: AMENDMENTS LAYER over v5.** v5 remains the module-by-module drafting specification for every module
and paragraph not amended below; this document carries the changes and is read *with* it, not instead of it.
That is a deliberate departure from the usual supersede-and-restate discipline, taken because the amendments are
surgical and restating 580 lines risked transcription drift in the numbers that just changed. **Recommendation:
assemble a consolidated v7 at the start of the next session, before drafting L1.**

Rulings ledger: **`DECISIONS-REGISTER-v8-2026-08-05.md`**.
Analysis tree: **`boredom-analysis-v5-2026-08-05/`** — v4 retained untouched as the audit artifact.

---

## A. GLOBAL — every module

**A-1. Eye closure signs are inverted (D-11).** The surface is eye closure throughout, and every figure for it
now runs in the closure direction. Anywhere v5 quotes a number for this channel, the sign flips:

| where in v5 | v5 said | v6 says |
|---|---|---|
| L3.3 criterion | rho −0.460 vs boredom, +0.416 vs engagement | **+0.460** vs boredom, **−0.416** vs engagement |
| L3.3 separation | rb −0.974 (BORvCLC), −1.000 (BORvINT) | **rb +0.974**, **+1.000** |
| L3.3 Round 1 alone | 7/8 and 8/8 | unchanged — 7/8 and 8/8 |
| L3.1, L3.6 | closure among the nine Holm survivors | unchanged |

**Probabilities do not move at all** — Holm 0.0020 / 0.0015, permutation 0.0212 / 0.0370 stand as written. The
composite is provably unchanged and `keystone-decomposition.csv` is byte-identical to v4, so **L3.7's
decomposition table, L4.2's keystone and L4.5's anomaly set are untouched.**

**A-2. American spelling** is now executed in the generated tree, so captions may be quoted as they stand.

## B. L1 — THE THREE LITERATURES

**B-1. ¶3 loses Hernández Albarracín (author ruling 2026-08-05: ignore any article not written in English).**
`bor-sec-11` is Spanish-language (*Tópicos, Revista de Filosofía* 62, 2022). Every quotation the entry supplies
is an English rendering of Spanish text and cannot be verified verbatim — all eleven candidates failed the exact
gate for exactly this reason. **¶3 now rests on Quaranta (`bor-sec-10`) alone**, which it can: Quaranta is the
film-viewership-as-being-in-the-world argument the paragraph needs, and the stimulus here *is* film, watched
under mandate, in a headset. **No works-cited entry is required for `bor-sec-11`.** It is the only non-English
source among the eighteen; the other seventeen are unaffected.

**B-2. ★ ¶4 must not cite Thomson as a boredom source (A-02).** `bor-sec-19` contains **zero occurrences** of
"bored," "boredom" or "Langeweile." v5 places him in the boredom-and-education paragraph beside Mansikka and
Gibbs; doing so would assert a treatment that is not in the text. Two options, and the second is recommended:
either drop him from ¶4 entirely, or keep him for the frame he does supply — paideia, enframing, teaching as
"letting learn," and an ontohistorical account of meaninglessness — stated as a frame for the education strand
rather than as a reading of boredom. **Recommended: keep, reframed, in one sentence**, since the strand's
argument benefits from the enframing account and the honest attribution costs nothing.

**B-3. ¶6 — Scharinger is 2015, not 2019 (A-03),** and is likewise not a boredom source; it is a dual-measure
methodological anchor. v5 already flagged the year; this confirms it from the entry's own bibliographic
correction, against a directory name that carries the wrong year.

**B-4. ★ ¶6 gains a published precedent for the section's oppositional ranking (A-04).** In Scharinger, pupil
dilation and EEG alpha **both** registered the load manipulation independently and **did not correlate with each
other** (r = −.16, −.14, ns), and alpha alone tracked reading comprehension. That is L3.6's structure — two
channels registering the same thing and disagreeing with each other — with a prior in the literature. It
strengthens ¶6 from "pupil indexes load and attention, not boredom-as-reported" to the sharper claim that
**channels registering one manipulation routinely fail to agree**, which is what makes the oppositional ranking
a finding rather than an anomaly.

**B-5. ¶4 gains Mansikka's pedagogical precedent for the keystone (A-09).** His second form maps onto
engaged-but-inauthentic learning: a student fully occupied, even high-achieving, while governed by *das Man*.
The consequence he draws is the one this section demonstrates instrumentally — that form is invisible to
behavioral-engagement metrics **because engagement and hollow boredom are compatible rather than opposed.** Use
in ¶4; hand forward to L4.2, which shows it in two channels rather than arguing it.

**B-6. ¶5 confirmations.** Kim's null is as v5 states it — no significant correlation between questionnaire
scores and any physiological feature at thirteen analyzed participants (A-06). Barry gives alpha as global
arousal against focal activation, **and the further point that eyes-closed and eyes-open are non-equivalent
baselines** (A-07), which bears on this section twice over. Yuvaraj's "no resting baseline" gap is confirmed:
both conditions are active, eyes-open video-viewing (A-08).

**B-7. Quotation discipline (A-01, S-04).** The index entries put paraphrases inside quotation marks — two of the
first ten candidates were not verbatim — and they use ellipses inside quoted spans, which cannot verify exact by
construction. **Nothing from an entry enters prose without passing the gate in its own right**, and two archon
behaviors must be ruled out before a quotation is called wrong (hyphens break the FTS parser; unrestricted search
can miss a present quotation — both fixed by `--doc`).

## C. L2 — THE APPARATUS AND THE DATA

**C-1. L2.5 is now accurate as written.** The surface is eye closure, defined as the proportion of the episode
during which the eyes were shut; Round 1 uses the validity-flag proxy licensed at r = 0.998; the composite sign
is negative. All of that is what the tree now computes.

**C-2. ★ L2.9 is rewritten by the revised D-12.** Three baselines, each assigned to the question its construction
lets it answer: **device-forward** for stimulus separation, **per-participant** for agreement with self-report,
**per-file** reported alongside the second. The ground stated in the prose is the design — the agreement analysis
is within-subject and the per-participant baseline is the only one built the same way — with the coefficient as
corroboration, not as the reason. v5's sentence that the per-participant baseline's absence from the criterion
family is "stated until X-06 runs" is **void**: X-06 ran, and that baseline won. Prose:
**`PROSE-METHODS-GAZE-BASELINE-v2-2026-08-05.md`** (v1 is superseded and must not be pasted).

**C-3. L2.8 takes the v2 criterion statement.** **`PROSE-METHODS-CRITERION-VALIDITY-v2-2026-08-05.md`** — v1
carries the eye-closure signs inverted and calls the per-file baseline the strongest predictor, both now false.
`O-14` and `O-15` remain the two `******`.

## D. L3 — THE FINDINGS

**D-1. ★ L3.2 — sleep-fight is 10 of 12, not 12 of 12 (D-37).** The data is 10 higher, 0 lower, **2 tied** (S04
at 1/1, S06 at 6/6). Permitted form: *no participant fought sleep less on the boring film than on the interesting
one, and ten of twelve fought it more.* rb = +1.000 remains correct, since rank-biserial excludes ties. S04's tie
is consistent with her inversion profile and **corroborates L3.9 rather than weakening it.**

**D-2. L3.3 signs invert per A-1.** The prose reads more naturally in the closure direction: more closure, more
reported boredom.

**D-3. ★ L3.5 gains X-06's two results (N-18, N-19).** The per-participant baseline is the strongest criterion
channel in the study at **+0.590 / −0.585**, and it is **uneven on separation** — best on boring against
interesting (8/8 in Round 1), chance on boring against clinical (4/8) — which is why the separation assignment
does not move. And the per-round split gives **independent support for the rate account**: every load-bearing
association points the same way in both rounds, and gaze is markedly stronger in Round 2 (+0.812 / −0.914 on the
per-file measure; +0.868 / −0.928 on the per-participant) than in Round 1. N-16 previously rested only on the
separation test; the criterion test now shows the same asymmetry independently.

**D-4. Reported direction counts changed convention (D-36).** `direction` now reports the count agreeing with the
effect. Load-bearing downward effects are unmoved; self-report items and the EEG negatives print the complement
of what v4 printed. This aligns the artifact with the convention the outline already used.

**D-5. L3.9's case set is enriched by the repaired sensitivity reporting.** The swept reverse cases are now
reported with their counts and baseline composites: **R2-03 reverse under 4 of 7 definitions** (baseline
composite +0.425, boredom 3/1/2), **R2-04 under 3 of 7** (+0.486, boredom 7/2/3), **S03 under 1 of 7** (+0.274,
boredom 9/3/3). The robustness clause is conditional per case: S03's single-definition case *is* an artifact of
that one choice and is now said to be.

## E. L4 AND L6 — O-03

**E-1. O-03 is resolved and its analytic consequence is WITHDRAWN (D-38).** Author ruling 2026-08-05: the
co-author/participant overlap is not stated in this section, being unnecessary to its argument. **No disclosure
sentence, no re-identification exposure, and no hypothesis-awareness alternative account in L4.2 or L6.** R2-03's
profile is explained from their own answers exactly as v5 has it — never bored by anything, so the clinical
episode is their own relative minimum. v5's §E entry for O-03 and the handoff's §3.2 are both void.

## F. WHAT IS UNCHANGED

L0, L4.1, L4.2 (apart from E-1), L4.3, L4.4, L4.5, L4.6, L5, L6 (apart from E-1) and L7 stand exactly as v5
specifies them, including the keystone, the three-film decomposition, the S08 transition, the withdrawn depletion
lane, the attunement note, and the two constraints that must never be violated. **No number in the keystone,
the decomposition or the sensitivity sweep moved during X-07.**

## G. OPEN — 3, none blocking

`O-06` how much of the published studies to re-present · `O-14` multiplicity as a footnote · `O-15` IRB-facing
survey wording.

## H. WORKFLOW

**Stage 3 drafting has not begun.** Before L1: finish Step A's tail (see the verification ledger §4 — the four
un-indexed documents and the `_synthesis` sections are not yet read, and 39 quotation candidates remain
unverified). Draft in 1–3 ¶ batches with an approval gate per batch, bare ¶-numbers when presenting, **Fable at
xhigh — notify the author before beginning so the model is switched.**
