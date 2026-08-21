# DISSERTATION PROSE — Methodological statement for the gaze-baseline decision (O-12)

**Status: drafting-ready. Paste into the laboratory section's method module (L2) when drafting reaches gaze,
and reference from L3.4.**
Written 2026-08-04 against the v4 analysis tree, on the author's ruling of the same date. Every number below was
read from `boredom-analysis-v4-2026-08-04/out/` and `figures/cross-cutting/gaze-baselines.csv` rather than from a
summary document.

**Spelling: American throughout, per the standing lock of 2026-08-04 — "center," never "centre."** The v4 tree's
generated tables and captions still carry the British form and are queued for the v5 regeneration pass; where this
document quotes a column name it gives the American form and the reader should expect the artifact to differ until
that pass runs.

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
all three are reported side by side in `figures/cross-cutting/gaze-baselines`. Two were carried into the
criterion-validity family; the third was not (§0.9).

**0.7 The empirical result, and it is a clean split.** The two baselines answer different questions, and each
answers only one.

| | fixed forward (device axis) | per-file median |
|---|---|---|
| **Separates the three films?** | **Yes**, on excursion *frequency*: departures beyond 10° per minute are lower on the boring film, 7 of 8 against clinical and 7 of 8 against interesting, both Holm p = 0.047, rank-biserial −0.889 and −0.944, Friedman p = 0.0302. The first gaze result in this study to survive correction. | **No.** Round 1 Friedman p = 0.1353; boring against clinical p = 0.84, boring against interesting p = 0.15. Round 2 alone separates perfectly at n = 4 (0/4 both contrasts, rb +1.000) but sits at the signed-rank floor of p = 0.125 and is descriptive. |
| **Agrees with what participants reported?** | **No.** Against boredom rho +0.359, permutation p = 0.0751; against engagement −0.391, p = 0.0515. Neither survives. | **Yes.** Against boredom rho +0.524, p = 0.0074; against engagement −0.527, p = 0.0075. Both survive comfortably. |
| Median amplitude, boring above clinical | 6 of 8 in Round 1, 4 of 4 in Round 2 | 5 of 8 in Round 1, 4 of 4 in Round 2 |
| Median amplitude, boring above interesting | 6 of 8 in Round 1, 3 of 4 in Round 2 | 7 of 8 in Round 1, 4 of 4 in Round 2 |

The fixed-forward *amplitude* measure — degrees from center — does not survive correction on stimulus separation
either (Holm p = 0.1172 and 0.1562). What survives on that baseline is frequency, not amplitude.

**0.8 The ruling (author, 2026-08-04).** Neither baseline is primary. **Each is assigned to the question it
answers, and the assignment is stated in the open.** The per-file measure is a within-episode measure of how far
the eye ranges relative to that episode's own posture, and it is the measure scored against self-report. The
fixed-forward measure is how often and how far the eye leaves the device's forward axis, and it is the measure
used for stimulus separation. Both remain computed, reported and available; neither result is presented without
its baseline named.

**0.9 What is NOT yet computed, and it is a hole in this justification.** The **per-participant baseline was never
scored against self-report.** The criterion family contains the per-file measure and four fixed-forward measures;
it contains no subject-baseline entry. That matters because the subject baseline produces the strongest
directional separation of the three on boring against interesting — 8 of 8 in Round 1 and 4 of 4 in Round 2 — so
a reader could reasonably ask why the one that looks best on that contrast was left out of the test that decided
the assignment. **Recommendation: add the subject baseline to the criterion family in the v5 pass.** It is two
additional tests; the permutation stage dominates runtime and two more tests will not materially change it. Until
that runs, the omission is stated rather than left to be noticed.

**0.10 Two defects in the current generated captions, both to be fixed in the v5 pass.**
1. The amplitude-versus-frequency caption blends the baselines inside a single sentence: it attributes a
   direction of "10/12 against clinical under the fixed-forward baseline" and an association of "rho +0.52" to the
   same measure, when the direction is fixed-forward and the association is per-file.
2. That same "10/12" is a count **pooled across rounds** for a channel the analysis marks not poolable and for
   which no pooled test is run anywhere. The count is of within-participant signs, each computed inside a single
   round, so it is more defensible than pooling values would be — but it is inconsistent with the analysis's own
   stated rule, and an internal inconsistency is what a reader catches. Either report it per round (6 of 8 and 4
   of 4) or state the exception and its reasoning.

**0.11 Standing caution attached to everything above.** Both rounds record gaze **eye-in-head, not head pose**
(F-03). No baseline choice changes this. A participant who turns their head away from the film registers no
deviation on any gaze channel here, and the search behavior visible in the session video was not instrumented in
this pass.

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
the participant. Neither is the correct measure of a single underlying thing. They are measures of two different
things that a single phrase — deviation from center — had been concealing.

The two definitions separate on the evidence exactly as that difference predicts, and the separation is what
governs how each is used here. Against the device's forward axis, the eye's departures beyond ten degrees are
less frequent on the boring film than on either of the others, in seven of eight participants on both contrasts,
and this is the only gaze result in the study to survive correction for multiple comparisons. Against the same
axis, the association with what participants reported afterward does not survive: the coefficients run to +0.36
and −0.39 and their permutation probabilities to 0.075 and 0.052. Against the recording's own middle direction,
the pattern inverts. The measure does not separate the three films at all in the eight-participant round, and it
is the strongest single predictor of self-report in the entire analysis, at +0.52 against reported boredom and
−0.53 against reported engagement, both surviving the permutation test comfortably.

Neither baseline is therefore treated as primary. Each is used for the question it answers, and every gaze result
in this section names the baseline it was computed on. Where the argument concerns whether an instrument tells the
three films apart, the measure is angular departure from the device's forward axis. Where the argument concerns
whether an instrument agrees with what a participant said about their own episode, the measure is deviation from
that recording's own middle direction. Reporting only one of the two would have meant discarding a finding to
preserve a convention, and reporting either without naming its reference would have meant presenting two
different quantities under one name — which is the confusion this analysis inherited and set out to repair.

---

## B. Short form (one paragraph, if the method module runs tight)

Gaze deviation measures how far the eye has turned from center, and center must be defined against a reference
that the recording does not supply. Three references were computed: the headset's own forward axis, which
restores the published definition and retains sustained posture; each recording's own middle gaze direction, which
the reprocessing initially used and which removes sustained posture by construction, since the reference moves
with the participant; and each participant's middle direction across their three films. The first and second
answer different questions and the evidence separates them cleanly. Against the forward axis, departures beyond
ten degrees are less frequent on the boring film in seven of eight participants on both contrasts, the only gaze
result here to survive correction, while the association with self-report does not survive. Against the
recording's own middle direction, the measure does not separate the films and is the strongest single predictor of
self-report in the analysis, at +0.52 and −0.53. Neither is treated as primary: each is used for the question it
answers, and every gaze result names its baseline.

---

## C. Anticipated objections, with the answer already in the text

**"You used whichever definition gave you a result."** The opposite is what the log shows. All three baselines
were computed before any was chosen, all three are reported side by side in the figure, and the choice was made on
a stated principle — which question each measure can answer — rather than on which produced significance. The
inconvenient half is printed with the convenient half: the theoretically faithful restoration does *not* agree
with self-report, and the theoretically compromised measure does. That result was recorded against the analyst's
own prediction rather than discovered afterward.

**"Then the per-file measure is a bad measure and you should not use it at all."** It is a bad measure of
sustained posture and a good measure of within-episode range, which is a different quantity. The failure was
never that it computes something worthless; it was that it was substituted for a differently-defined published
feature without the substitution being marked. Marking it is the repair.

**"A single number called gaze deviation appears in the published work. Which one was it?"** The published
definition is the device-axis one. The reprocessing's per-file substitution is documented as a deviation from it,
with its consequence stated, and the restoration is carried through the whole analysis alongside it.

**"Why not just pool the two rounds and settle it with more participants?"** No gaze measure is pooled across the
rounds anywhere in this analysis. The feature is a windowed statistic — a five-point rolling median — and the
window spans about forty-two milliseconds at Round 2's rate and about a second and a half at Round 1's.
Recomputing the identical feature on Round 2 decimated to Round 1's rate moves its value by a factor of 0.65 to
0.84. They are not the same measurement, and combining them would produce a number belonging to neither round.

**"You left one of your three baselines out of the test that decided the question."** Conceded, stated in the
log, and queued: the per-participant baseline was computed for the figure and was not carried into the criterion
family. It is added in the next analysis pass. Until then the omission is reported rather than left to be found,
and the reason it matters is stated too — that baseline produces the strongest directional separation of the three
on one of the contrasts.

---

## D. Notes to self at drafting

- Never present a gaze number without naming its baseline. The whole justification collapses if one slips through
  unlabeled.
- The frequency result is on **fixed forward**; the criterion association is on **per-file median**. Do not let a
  sentence attach them to the same measure — the current generated caption does exactly that and is queued for
  repair.
- "center," never "centre," including where a table column is quoted; note the artifact's spelling differs until
  the v5 pass.
- Carry the eye-in-head caution wherever gaze is discussed, in the permitted form: the eye channels show
  withdrawal, and the search behavior visible in the session video was not instrumented in this pass.
- The figure to reference is `figures/cross-cutting/gaze-baselines`; the amplitude-versus-frequency figure is its
  companion and is the one whose caption needs fixing first.
