# DISSERTATION PROSE — Methodological statement for the gaze-baseline decision (v2)

**Supersedes `PROSE-METHODS-GAZE-BASELINE-v1-2026-08-04.md`, which is never edited.**
**Status: drafting-ready. Paste into the laboratory section's method module (L2) when drafting reaches gaze,
and reference from L3.5.**
Rewritten 2026-08-05 against the **v5** analysis tree, on the author's revised ruling of the same date. Every
number below was read from `boredom-analysis-v5-2026-08-05/out/` rather than from a summary document.

**What changed from v1.** v1 recorded D-12 as assigning the **per-file** baseline to the agreement question, and
recorded as an open hole that the **per-participant** baseline had never been scored against self-report. X-06
closed that hole: the per-participant baseline is now the strongest criterion channel in the study. **D-12 is
revised (author ruling 2026-08-05): the per-participant baseline is the assigned criterion measure**, the
per-file baseline is reported alongside it, and the device-forward baseline keeps the separation question. The
ground for the revision is the design, not the coefficient; §0.9 states it. v1's two generated-caption defects
(§0.10) were repaired in the v5 pass and are recorded here as closed.

**Spelling: American throughout (S-01) — "center," never "centre."** The v5 tree's generated tables and captions
now carry the American form; the v4 and earlier trees do not, and are never edited.

Register: scientific-direct, MLA, no module labels, no bold run-in heads. Sweeps applied.

---

## 0. THE WORK LOG — what was done, in order, and why

This section exists because the author asked that the decision be logged with its justification rather than
announced. It is the audit trail; §§A–C are the prose that comes out of it.

**0.1 The problem.** Gaze deviation is the angle between where the eye is looking and "center." Center is not
given by the data. It has to be defined against a reference, and the reference is a modeling choice that changes
every number downstream.

**0.2 What the published definition says.** The published gaze feature is `1 − X`, which is `1 − cos θ` against
the recording device's own forward axis. Center is therefore **the direction the headset is pointing**, and the
measure asks how far the eye has turned away from straight ahead (F-02).

**0.3 What the 2026 reimplementation actually computed.** It substituted **each file's own median gaze direction**
for the device axis: the Euclidean distance of the combined gaze vector from that recording's median direction,
then a five-point centered rolling median (METHODS §3.3). This was not flagged at the time. Its consequence is
structural rather than incidental: because the reference is the participant's own middle direction *within that
same recording*, any posture held for most of an episode is removed by construction. A participant who spends the
whole film looking down and to the left has a median that *is* down and to the left, and therefore reads as barely
deviating at all.

**0.4 Why the forward axis is per-round and not a constant.** Round 1 was recorded in Unreal and Round 2 in Unity,
and their device conventions differ — Round 1 X forward, Y horizontal, Z vertical; Round 2 Z forward, X
horizontal, Y vertical, confirmed from the original MATLAB (F-01). A single hard-coded forward direction would
give every Round 1 cell a meaningless offset near 90°. The restoration is therefore per-round, and that is a
correction rather than a convenience.

**0.5 The third candidate.** A **per-participant median**, one middle direction per person across their three
films, was added as a middle course: it preserves how the headset happened to sit on that person's face while
still exposing differences between their films.

**0.6 What was computed.** All three baselines were computed for all twelve participants and all three films, and
all three are reported side by side in `figures/cross-cutting/gaze-baselines`. From the v5 pass onward **all three
are also carried into the criterion-validity family**; in v1–v4 only two were (§0.9).

**0.7 The empirical result on the two questions.** Updated with the per-participant row, which v1 could not fill.

| | device-forward | per-file median | per-participant median |
|---|---|---|---|
| **Separates the three films?** | **On frequency, yes.** Departures beyond 10° per minute are lower on the boring film, 7 of 8 against clinical and 7 of 8 against interesting, both Holm p = 0.047, rank-biserial −0.889 and −0.944, Friedman p = 0.0302. The only gaze result in this study to survive correction. On *amplitude*, no: Holm p = 0.1172 and 0.1562. | **No.** Round 1 Friedman p = 0.1353; boring against clinical p = 0.84, boring against interesting p = 0.15. | **Uneven.** Best of the three on boring against interesting (8 of 8 in Round 1, 4 of 4 in Round 2) and **worst on boring against clinical (4 of 8 in Round 1 — chance)**. |
| **Agrees with what participants reported?** | **No.** Against boredom rho +0.359, permutation p = 0.0751; against engagement −0.391, p = 0.0515. Neither survives. | **Yes.** +0.524, p = 0.0074; −0.527, p = 0.0075. | **Yes, and most strongly of the three.** **+0.590, p = 0.0024; −0.585, p = 0.0022.** |
| Median amplitude, boring above clinical | 6 of 8 (R1), 4 of 4 (R2) | 5 of 8, 4 of 4 | 4 of 8, 4 of 4 |
| Median amplitude, boring above interesting | 6 of 8, 3 of 4 | 7 of 8, 4 of 4 | 8 of 8, 4 of 4 |

**0.8 The ruling (author, 2026-08-04; REVISED 2026-08-05).** No baseline is primary. **Each is assigned to the
question it answers, and the assignment is stated in the open.** The **device-forward** measure is how often and
how far the eye leaves the device's forward axis, and it is the measure used for stimulus separation — where it
also carries the study's only correction-surviving gaze result. The **per-participant** measure is deviation from
that participant's own middle direction across their three films, and it is the measure scored against
self-report. The **per-file** measure is deviation from that recording's own middle direction, which is what the
reimplementation computed; it is reported alongside the per-participant measure on the agreement question. All
three remain computed and reported, and no result is presented without its baseline named.

**0.9 Why the per-participant baseline holds the agreement question, and why this is not measure-shopping.** The
ground is the design rather than the coefficient. The agreement analysis is entirely within-subject: every value
on both sides is scored against that participant's own three-film mean, so each person serves as their own
control. The per-participant baseline is the only one of the three constructed the same way. It removes what
differs *between* people and does not bear on the question — how the headset happened to sit on that face — and it
does so in the domain where that nuisance lives, by recentering the direction the eye is pointing before the angle
is taken. It preserves what differs *within* a person and does bear on the question: whether they held the eye
differently during one film than another. The per-file baseline goes one step further and recenters inside each
episode, which erases exactly that between-film difference before any test can see it; that it still reaches
+0.52 is more surprising than its being beaten. The device-forward baseline preserves the between-film difference
but carries the headset-fit variation along with it, which is why it belongs to the separation question, where
between-person differences are not what the test compares.

That argument stands whichever coefficient had come out larger. The empirical outcome corroborates it rather than
motivating it, and the two personal baselines agree in direction and in ranking, so the finding does not turn on
which of them is used. **v1 of this document recorded the per-participant baseline's absence from the criterion
family as a hole in the justification and recommended closing it in the next pass. It was closed, the omitted
measure won, and the assignment was revised accordingly** — which is the order these things should happen in, and
is stated rather than smoothed over.

**0.10 The two generated-caption defects recorded in v1 — both CLOSED in the v5 pass.**
1. The amplitude-versus-frequency caption blended the baselines inside a single sentence, attributing a direction
   computed on device-forward and an association computed on per-file to the same measure. The caption now states
   both panels' baseline explicitly and assigns each coefficient to the baseline it belongs to.
2. That same caption reported "10/12" as a count pooled across rounds for a channel the analysis marks not
   poolable. It now reports per round — 6 of 8 (Round 1) and 4 of 4 (Round 2) against clinical.
   A third defect, not recorded in v1, was also repaired: the gaze-baselines caption still described the choice of
   primary baseline as an open author decision after D-12 had closed it.

**0.11 Standing caution attached to everything above.** Both rounds record gaze **eye-in-head, not head pose**
(F-03). No baseline choice changes this. A participant who turns their head away from the film registers no
deviation on any gaze channel here, and the search behavior visible in the session video was not instrumented in
this pass.

**0.12 The per-round split (X-06b).** The criterion tests were recomputed inside each round separately, as a check
that the pooled association is not produced by one of them. On the per-participant baseline: pooled +0.590,
Round 1 +0.475, Round 2 +0.868 against boredom; pooled −0.585, Round 1 −0.429, Round 2 −0.928 against engagement.
Both rounds point the same way, so the pooled value is carried by both. Gaze is markedly stronger in Round 2,
where the feature was sampled at 120 Hz rather than ~3 Hz — the rate its definition assumes — which is
independent support for the sampling-rate account. Round 2 is thin by construction: four participants give twelve
paired points and only 6⁴ = 1,296 distinct within-subject arrangements, so that column is descriptive.

---

## A. The full statement (four paragraphs — use all four where space allows)

Gaze deviation measures how far the eye has turned from center, and center is not something the recording
supplies. It has to be defined, and the definition is a modeling decision rather than a detail of implementation.
Three definitions are defensible here and all three were computed. The first takes center to be the direction the
headset itself is pointing, which restores the published feature: the measure then asks how far the eye has turned
away from straight ahead. The second takes center to be the middle direction of that particular recording, which
is what the reprocessing initially computed. The third takes center to be the middle direction of that
participant across all three of their films, which preserves however the headset happened to sit on that person's
face while still exposing differences between the films they watched.

The second definition carries a consequence worth stating plainly, because it is not obvious and it is not small.
When the reference is the recording's own middle direction, any posture held for most of an episode disappears by
construction. A participant who spends a whole film looking down and to the left has a median direction that is
itself down and to the left, and against that reference they register almost no deviation at all. The measure
therefore reports how much the eye *moved around* within an episode and is blind to where the eye was *held*. The
first definition has the opposite property: it retains sustained posture, because its reference does not move with
the participant. The third sits between them, removing the posture a person holds across their whole session
while keeping the differences between their three films. None of the three is the correct measure of a single
underlying thing. They are measures of different things that one phrase — deviation from center — had been
concealing.

Each is therefore used for the question it can answer, and the assignment follows from how each is built rather
than from how each scored. Where the argument concerns whether an instrument tells the three films apart, the
measure is angular departure from the device's forward axis, which is also the only gaze measure here to survive
correction for multiple comparisons: departures beyond ten degrees are less frequent on the boring film in seven
of eight participants on both contrasts. Where the argument concerns whether an instrument agrees with what a
participant said about their own episode, the measure is deviation from that participant's own middle direction
across their three films. That comparison is within-subject throughout — each person is scored against
themselves — and this is the only one of the three baselines constructed the same way, removing what differs
between people while preserving what differs between one person's films. The measure defined inside each single
episode cannot serve that question, because it removes the between-film difference before the test can reach it.

The evidence bears the assignment out, which is corroboration rather than its justification. Against the
participant's own baseline the association with self-report is the strongest in the entire analysis, at +0.59
against reported boredom and −0.59 against reported engagement, both surviving the permutation test comfortably;
against the recording's own middle direction it stands next at +0.52 and −0.53, pointing the same way, so nothing
in the finding depends on which of the two is chosen; and against the device's forward axis it does not survive at
all, at +0.36 and −0.39. Reporting only one of the three would have meant discarding a finding to preserve a
convention, and reporting any of them without naming its reference would have meant presenting different
quantities under one name — which is the confusion this analysis inherited and set out to repair. Every gaze
result in this section names the baseline it was computed on.

---

## B. Short form (one paragraph, if the method module runs tight)

Gaze deviation measures how far the eye has turned from center, and center must be defined against a reference
that the recording does not supply. Three references were computed: the headset's own forward axis, which
restores the published definition and retains sustained posture; each recording's own middle gaze direction, which
the reprocessing initially used and which removes sustained posture by construction, since the reference moves
with the participant; and each participant's middle direction across their three films, which removes how the
headset sat on that face while keeping the differences between their films. Each is used for the question it can
answer. Against the forward axis, departures beyond ten degrees are less frequent on the boring film in seven of
eight participants on both contrasts, the only gaze result here to survive correction, while the association with
self-report does not survive. Agreement with self-report is scored on the participant's own baseline, the only one
of the three built the way the within-subject comparison is built, and there the association is the strongest in
the analysis at +0.59 and −0.59; the recording's own middle direction stands next at +0.52 and −0.53 and points
the same way. Every gaze result names its baseline.

---

## C. Anticipated objections, with the answer already in the text

**"You used whichever definition gave you a result."** All three baselines were computed before any was chosen,
all three are reported side by side in the figure, and each is assigned on a stated principle — which question its
construction lets it answer — rather than on which produced significance. The inconvenient half is printed with
the convenient half: the theoretically faithful restoration of the published definition does *not* agree with
self-report, and it is the measure the study inherited that fails there. The two baselines that do agree point the
same way and rank the channels identically, so the finding does not depend on the choice between them.

**"You changed the assignment after seeing which baseline scored highest."** The assignment changed once, and the
sequence is on the log at §0.9. The per-participant baseline was computed from the outset but had not been scored
against self-report; the omission was recorded in the previous version of this statement as a hole in the
justification, together with a recommendation to close it. It was closed in the next analysis pass. The reason it
now holds the agreement question is that the agreement analysis is within-subject and this is the only baseline
built that way; that argument would stand had the coefficient come out lower, and the previous assignment is
reported beside it rather than removed.

**"Then the per-file measure is a bad measure and you should not use it at all."** It is a bad measure of
sustained posture and a good measure of within-episode range, which is a different quantity. The failure was
never that it computes something worthless; it was that it was substituted for a differently-defined published
feature without the substitution being marked. Marking it is the repair, and it is reported alongside the assigned
measure on the question they share.

**"A single number called gaze deviation appears in the published work. Which one was it?"** The published
definition is the device-axis one. The reprocessing's per-file substitution is documented as a deviation from it,
with its consequence stated, and the restoration is carried through the whole analysis alongside it.

**"Why not just pool the two rounds and settle it with more participants?"** No gaze measure is pooled across the
rounds for stimulus separation anywhere in this analysis. The feature is a windowed statistic — a five-point
rolling median — and the window spans about forty-two milliseconds at Round 2's rate and about a second and a half
at Round 1's. Recomputing the identical feature on Round 2 decimated to Round 1's rate moves its value by a factor
of 0.65 to 0.84. They are not the same measurement, and combining them would produce a number belonging to neither
round. Criterion validity legitimately pools both rounds, because within-subject z-scoring is scale-invariant and
removes a multiplicative rate difference by construction; the stated limit is that it does not guarantee removal
of a rate effect on the *shape* of the between-film pattern, and the per-round split at §0.12 is what bounds that.

**"The baseline you now favor separates the films worst on one contrast."** True, and reported: on boring against
clinical in Round 1 it sits at four of eight, which is chance. That is why it is not the separation measure. The
separation question belongs to the device-forward baseline, and the two assignments are independent.

---

## D. Notes to self at drafting

- Never present a gaze number without naming its baseline. The whole justification collapses if one slips through
  unlabeled. The v5 tables name the baseline inside every channel label, so quoting the label is enough.
- The criterion association is on the **per-participant** baseline; the frequency result is on **device-forward**;
  the per-file measure is reported alongside the first. Do not let a sentence attach any two of them to one
  measure — v1's generated caption did exactly that and was repaired in the v5 pass.
- "center," never "centre," including where a table column is quoted.
- Carry the eye-in-head caution wherever gaze is discussed, in the permitted form: the eye channels show
  withdrawal, and the search behavior visible in the session video was not instrumented in this pass.
- The figure to reference is `figures/cross-cutting/gaze-baselines`; the amplitude-versus-frequency figure is its
  companion. Both captions were repaired in the v5 pass and can now be quoted as they stand.
