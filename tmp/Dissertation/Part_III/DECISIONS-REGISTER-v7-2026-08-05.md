# DECISIONS REGISTER — Laboratory Boredom section (v7, 2026-08-05)

Supersedes `DECISIONS-REGISTER-v6-2026-08-05.md`. Complete and standalone.
Version chain: supersede with `-v8-`, never edit in place.

**v7 banks the L3 restructure, the elevation of criterion validity and gaze, three corrections to L4, the
withdrawal of the depletion lane, the Heidegger attunement note, and the S08 transition. Open decisions: 4, none
blocking.**

---

## 0. STYLE AND SOURCE LOCKS

| # | Lock |
|---|---|
| **S-01** | **American spelling throughout — "center," never "centre."** Also *analyze, normalize, harmonize, labeled, artifact, behavior, recognize, organize*; *analysis* is already American. Footprint in the v4 tree: 52 in generated `.md`/`.txt`, 76 in `analysis/*.py`. Repaired in X-07. Prior versions keep British forms and are never edited. |
| **S-02** | **`archon-cli-v3` is the sole source for corpus, index and retrieval.** Binary `target/release/archon` (v1.3.11); store `.archon/`; corpus `corpus/`; **index `index/` — PROJECT ROOT, not under `corpus/`.** State 2026-08-05: 241 documents, 13,564 chunks, 18,238 pages, 0 failed. Chunk-level references predating 2026-08-05 are stale. |
| **S-03** | **Verification gates on EXACT MATCH** — never "found," never fuzzy. FCM page loci **read from the running head, never computed**. |

## 1. RULED — analysis scope and channel status

| # | Ruling |
|---|---|
| R-01 | **Cognitive load is NOT load-bearing.** Vendor-computed. Appendix only. Evidenced: flat against self-report (rho −0.09 / +0.11, perm p 0.65 / 0.60). |
| R-02 | **Heart rate and HRV removed entirely.** Measurement failed for some participants owing to facial/head structure. Evidenced: rho +0.09 / +0.04, p 0.68 / 0.86. |
| R-03 / R-04 | **IMU head motion and video-derived head pose — DEFERRED.** Superseded in practice by X-05. |
| R-05 | **Load-bearing channels:** pupil, eye closure, gaze, the 7-item self-report. EEG a full negative. |
| R-06 | **Equal focus on all three films.** The clinical-centered framing was an IRB/publication necessity. |
| R-07 | **Survey administered per episode**, in the break immediately after each film. |
| R-08 | **Boring stimulus** = a 17-minute section of a 1989 Microsoft Word tutorial; task-structured instructional content, not visually empty filler. |
| R-09 | **S04's `minutes until bored` on the boring film is VOID.** Reclassified *never became bored*. |
| R-10 | **NARROWED by D-21.** R2-03 analyzed as a single session; the split dates stay out of the prose as dates. |
| R-11 | **Overlay videos** in scope as corroborating material, not as the foundation of any claim. Extended by X-05 and X-09. |

## 2. RULED — data, method, and argument

| # | Ruling |
|---|---|
| D-01 | Round 2 read from `_Crop` exclusively; non-wear trimming retired. |
| D-02 | `t_rel_s` is the session clock. |
| D-03 | Streams identified by filename, not column count. |
| D-04 | Gate re-baselined; Round-1-only checks bit-identical. |
| D-05 | Both Round 2 windows analyzed: `full` (primary) and `r1matched`. |
| D-06 | **Composite A = pupil + eye closure** (primary); Composite B = A + gaze (within-round only). A is cleaner. |
| D-07 | **Version discipline.** Documents chain; prior versions never edited. v1 analysis tree frozen. |
| D-08 | CropEvents.json is metadata, not a data source. |
| D-09 | **Criterion p is a WITHIN-SUBJECT PERMUTATION p** — 20,000 shuffles inside each participant, fixed seed. |
| D-10 | **Spearman reported; Pearson alongside.** On all four load-bearing associations Pearson is LARGER, so the reported figure is conservative. |
| D-11 | **The closure surface is named EYE CLOSURE.** Round 1 uses the validity-flag proxy, licensed at **r = 0.998** inside Round 2. Negative sign in the composite. Renamed in X-07. |
| D-12 | **Gaze baselines: NEITHER primary; each assigned to its question.** Fixed forward for stimulus separation; per-file median for agreement with self-report. Log: `PROSE-METHODS-GAZE-BASELINE-v1-2026-08-04.md`. |
| D-13 | **The two-questions distinction is introduced three times at increasing specificity.** |
| D-14 | **Body plus appendix.** Body ~30 pp; **literature module capped at 4–5 pp.** L2's split approved 2026-08-05; L3's split approved 2026-08-05. |
| D-15 | **The eye-only scope is accepted and made the section's methodological argument.** |
| D-16 | **EEG framing.** Dropped for scaling; the reprocessing then established what it could have carried. Agreement with self-report was asserted qualitatively in the published work and is computed here for the first time. |
| D-17 | **The three stimulus films are identified for the works cited.** |
| D-18 | **van den Brink et al. (2016) approved for citation** — pupil as an index of attention and arousal, not boredom-as-reported. |
| D-19 | **THE DEFINITIONAL SUBSTITUTION IS THE SECTION'S ARGUMENT.** Data collected under Eastwood/Fahlman; read under Heidegger, **to demonstrate what philosophy reveals when applied to scientifically collected and statistically analyzed data.** Consequences: the published studies could only ever have detected the first form; the keystone is a demonstration, not a measurement; the self-report channel is a first-form instrument — both a limit and the condition that makes the divergence legible. |
| D-20 | **N-02 approved.** The one-of-fifty-five citation observation and the sampling-rate seam are both stated in prose, as description rather than indictment. |
| D-21 | **R2-03 and S07 analyzed as single sessions in the standard order.** Nothing computational changes. |
| D-22 | **The carryover hypothesis is reported together with the data that does not support it**, briefly, at L6.3. |
| D-23 | **The definitional quotations are rendered once, together, at L1 ¶10**; paraphrased everywhere else. |
| D-24 | **The order confound and its control both appear in the findings**; L6.3 states what remains. The weight-bearing claim stays the twelve-of-twelve separation. |
| **D-25** | **NEW — L3 IS RESTRUCTURED PER CHANNEL** (author-approved 2026-08-05). Instead of criterion validity sitting as one subsection among ten, **both questions run through each channel**: does it separate the films, and does it agree with the person. Eye closure answers both; pupil only the first; gaze only the second. The oppositional ranking then **emerges from the material rather than being announced**, eye closure's primacy becomes self-evident, and D-13's distinction is taught by demonstration three times. Supersedes v4's L3 ordering and the interim proposal to move self-report to L3.2. |
| **D-26** | **NEW — criterion validity is the interpretive base of the analysis.** It is the study's own validation logic, never computed before, and it is what makes the keystone a finding rather than two unrelated measurements failing to align. **One distinction held in the prose:** it is the most *load-bearing* finding, not the strongest *evidence* — the strongest evidence remains the twelve-of-twelve closure separation, while the criterion result is correlational, episode-level, n = 12, describing this group only. |
| **D-27** | **NEW — gaze is presented as the criterion channel, and explicitly not as a separation channel.** Its significance is on the criterion test (rho +0.524 / −0.527) and it is not among the nine Holm survivors. Gaze and pupil are mirror images — one tracks the person and not the films, the other the films and not the person — and together they are the section's cleanest demonstration that *significant* is a property of a channel **on a question**, not a property a channel has. |
| **D-28** | **NEW — gaze results are reported per round for stimulus separation and pooled for criterion validity.** Raw magnitudes are never pooled across rounds: the five-point window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz, and decimation moves the value by 0.65–0.84×, a measured *range* that cannot be harmonized as the openness scales were. **Criterion validity legitimately pools both rounds and already does**, because within-subject z-scoring is scale-invariant and removes a multiplicative rate difference by construction. Stated limit: z-scoring removes a multiplicative difference exactly and does not guarantee removal of a rate effect on the *shape* of the between-film pattern. Per-round criterion splits added as a sensitivity check (X-06). |
| **D-29** | **NEW — the potentiality statement is corrected.** The situation does not furnish a single act; it **narrows the field of potentialities available for actualization**. Watching is what it furnishes toward the film; closing the eyes, shifting and falling asleep remain available and were actualized. The diagnosis concerns the restriction of the field and the worth of what remains in it. **Consequence:** sleep is an actualized potentiality rather than an absence, which is why sleep-exit is boredom's escape rather than its depth. The deployment parallel sharpens — that world furnished watching *and* the exit to YouTube; the laboratory removes the exit while leaving closure, agitation and sleep. |
| **D-30** | **NEW — bodily agitation was suppressed by instruction, and occurred anyway.** Round 1 participants were instructed to refrain from agitated movement (foot-tapping and the like) because it would corrupt the EEG; **the instruction was not given in Round 2**, EEG having been abandoned. **Movements occurred regardless in some participants — observed, never recorded.** Consequences: a fifth round-asymmetry (engine, axis convention, sampling rate, window, agitation instruction); L4.3's counter-move was constrained twice over, the room offering no exit and the protocol closing the body; and L6 gains a second, independent reason why restlessness is unmeasured — a design choice, not only a sensor limitation. The observed movement enters as an author observation, marked as such, carrying no claim. |
| **D-31** | **NEW — the within-episode transition is evidenced from closure timing only.** Closure onsets and durations are already reported, so the transition is shown at the granularity the section already uses. **O-04 remains closed**: no channel trajectory, no slope, no test on thirds. The single quantity computed for this purpose does not reopen the time-course analysis generally. |
| **D-32** | **NEW — L4.6's depletion lane is WITHDRAWN, not softened.** v1 and v4 both assert that boredom depletes and that the canonical account does not say so, making a laboratory-to-philosophy lane. The re-pinned counts do not support it (N-15). The withdrawal is written as a withdrawal. |
| **D-33** | **NEW — the attunement note is displayed in the text**, at L4.4 and wherever the third form is mentioned. The account this section adopts holds that a fundamental attunement **cannot be ascertained and ought not to be**, since ascertaining means making conscious and that alters what it targets. No measurement here can evidence profound boredom and none is claimed to; what the instruments show are episodic structures resembling parts of its anatomy, named as resemblances every time. **This converts the category caution from methodological modesty into a requirement of the frame**, and it applies section-wide rather than only at L4.4. It also sharpens what the section does claim: not the mood, but the structural grammar. |
| **D-34** | **NEW — L4.2 answers the aversive-arousal objection with a discriminating prediction.** Since pupil is half of composite A and tracks neither report, a reader may propose that the clinical divergence is aversive arousal mistaken for engagement. Aversion predicts the eyes close or turn away; they do neither — clinical eye-openness is statistically indistinguishable from the interesting film's and far above the boring film's, and closure is the channel that *does* track self-report. The prior-exposure check points the same way. The composite is a mixture and the section says so; the half that could be arousal is corroborated by the half that cannot. |
| **D-35** | **NEW — adopted by continuation 2026-08-05, recorded as reversible.** O-05: the per-participant matrix goes to the appendix. O-04: the within-episode time course stays out of the prose. O-07: prior exposure is a footnote, not an analytic variable. |

## 3. ESTABLISHED — findings about the instrument

| # | Finding |
|---|---|
| F-01 | Round 1 in Unreal (X forward), Round 2 in Unity (Z forward). |
| F-02 | The published gaze feature uses a **fixed forward** reference (`1 − X`); the 2026 reimplementation substituted each file's own median, removing sustained posture by construction. |
| F-03 | **Both rounds record gaze EYE-IN-HEAD, not head pose.** |
| F-04 | **Head movement is where disengagement is visible and it is unmeasured in this pass.** Never claim the boring film produced stillness. |
| F-05 | Round 1's window is the middle ~13.6 min; Round 2's crop is essentially the whole film. |
| F-06 | Round 2 closure is **binary at source** — {0,1} across 3,416,362 per-eye samples. |
| F-07 | Round 1 blink sentinel is the vector (−1, +1, −1). |
| F-08 | The film started on "open your eyes" and stopped on "close your eyes." |
| F-09 | **Viewing order, RESOLVED AND CORROBORATED.** S01 and S05 ran clinical → boring → interesting; the other six Round 1 participants and all four Round 2 participants ran interesting → clinical → boring. **Boring last in ten of twelve, second in two.** Corroborated by crop clock times, the author's manual review (agreeing on six of eight), and **the original uncut CSVs**, reproducing the crop order for the two disputed participants with a consistent 1:47–2:22 offset matching the crop trim. S01 confirmed a fourth way by its survey heading. **The data-labeling question is CLOSED.** |
| F-10 | **The published 120 Hz is the sensor's rate, not Round 1's logging rate** (~3 Hz median). Round 2 is the first round in which every attached sensor polled and logged at 120 Hz. |
| F-11 | **The published gaze cohort cannot contain Round 2.** |
| F-12 | **The operative definition and its lineage, verified EXACT.** Eastwood (2012) → Fahlman (2013) → P1 (2023) → this data. |
| F-13 | **The incompatibility is locatable.** Eastwood's environmental-attribution condition is denied by the second form's "There is nothing at all to be found that might have been boring" and "it arises from out of Dasein itself." |
| F-14 | **The protocol change has a documented reason and a traceable origin.** S01 and S05 were the first two participants; after them the order was fixed for everyone. This is the referent of P2's "early experiments" sentence. |
| **F-15** | **NEW — the frame forbids ascertaining attunement, verified EXACT in the FCM.** *"Not only can an attunement not be ascertained, it ought not to be ascertained, even if it were possible to do so."* · *"all making conscious means destroying, altering in each case"* · *"but of awakening it. Awakening means making something wakeful, letting whatever is sleeping become wakeful."* Immediately preceding, Heidegger addresses observation directly — it is no objection if listeners cannot ascertain the attunement in themselves, because there is nothing to be found by observation however astute, even calling on psychoanalysis. `RE-PIN` that last sentence's exact string at drafting; surrounding hyphenation interferes with matching. |

## 4. FINDINGS from the analysis runs

| # | Finding |
|---|---|
| N-01 | **Criterion validity.** Gaze deviation +0.524 vs boredom (perm p 0.0074), −0.527 vs engagement (0.0075); eye closure −0.460 (0.0212) and +0.416 (0.0370). **Pupil tracks neither** (−0.17, p 0.40). |
| N-02 | **Amplitude and frequency point opposite ways.** Frequency lower on the boring film, 7/8 both contrasts, **Holm p = 0.047**. |
| N-03 | The re-crop left eye closure completely unmoved (11/12, F 0.0004, W 0.0010, rb −0.974). |
| N-04 | Closure is window-invariant; pupil is cleaner on the matched window (0.097 → 0.017). |
| N-05 | Composite A is cleaner than B (clinical 8/4/0/0 against 7/3/1/1). |
| N-06 | Divergence concentrates on the clinical film — 8/12 against 0 on boring. |
| N-07 | The per-file gaze baseline correlates with self-report better than the fixed-forward restoration (0.52 vs 0.36). Governed by D-12. |
| N-08 | The first criterion run's analytic p-values were wrong; three associations are now non-significant. |
| N-09 | Spearman and Pearson agree closely (median \|r − rho\| = 0.032). |
| N-10 | The clustering correction applies to Pearson exactly as to Spearman. |
| N-11 | **The order confound has a partial internal control.** In S01 and S05 the last-viewed film still carried the higher eye-open fraction (0.926 vs 0.904; 0.852 vs 0.212); S05's 449 s closure occurred mid-session; boring sits below interesting in 12 of 12. **n = 2, descriptive.** |
| N-12 | **The two published studies engage one of the 55 indexed boredom units.** The 2023 paper cites phenomenology of VR as framing rather than as an interpretive frame. |
| N-13 | **The carryover hypothesis, tested against the two participants who generated it.** Exhaustion half-supported (S05 depletion +5, S01 0); degradation of the subsequent experience **not** supported — the interesting film that followed was rated less boring (3.50 vs 4.83) and felt shorter (15.0 vs 22.7 min). n = 2 against n = 6, descriptive. Possible contrast effect, flagged not asserted. |
| **N-14** | **NEW — the transition case is S08, not S07 or S05.** Share of each third of the boring episode spent with eyes closed, extended closures allocated by overlap: **16.8% → 58.7% → 89.2%**, against under 8% in every third of both her other films. Self-report matches: bored within 30 s, sleep-fight 8/9, boredom 9, engagement 1. **S05 is the terminal category arriving at once** (55.1 / 100.0 / 66.8, dominated by one event beginning early). **S07 is neither** (25.8 / 55.2 / 39.7, peaking mid-episode) and escalates inside her *first-viewed* film too (5.8 / 10.5 / 28.9), which reads as a personal tendency rather than a stimulus response. **No cohort claim is available:** last third above first third in 6/8 on boring against 5/8 on each other film. Residual confound: boring came last for S08; partial answer, her second-position film shows no escalation. **Read per D-33 as first-form counter-move exhausting toward sleep-exit, never as a move into profound boredom.** |
| **N-15** | **NEW — depletion is a session effect, not a boredom effect.** More fatigued after: **boring 9/12, clinical 8/12, interesting 8/12**; medians +1.5, +1.0, +1.0; the omnibus does not separate them (p = 0.3965). v1's "6/8 after the boring stimulus" was a number without its comparison. **What survives:** the boring film has by far the widest spread — depletion from −6 to +5, against clinical −3 to +2 and interesting −1 to +3 — producing the three largest depletions (+5, +5, +4) and the only substantial restoration (−6, S04). The same film exhausts some and restores another. L4.6 becomes L4.5's coda rather than an independent lane. |
| **N-16** | **NEW — gaze deviation median works where it was properly sampled.** In Round 2, at 120 Hz, it separates the films **perfectly** — boring above both others in 4/4, at the n = 4 signed-rank floor of p = 0.125, so perfect separation is the strongest obtainable result. In Round 1, at ~3 Hz, it separates nothing (Friedman 0.135; boring against clinical 0.84). Direct support for the rate account rather than for the feature being weak, and the argument for D-27's elevation. |
| **N-17** | **NEW — the aversive-arousal objection fails its own prediction.** Aversion to surgical footage predicts the eyes close or turn away. Clinical eye-openness is statistically indistinguishable from the interesting film's (CLCvINT p = 0.2036) and far above the boring film's, and closure is the channel that tracks self-report. Prior-exposure strata are near-indistinguishable on the clinical film. |

## 5. DEFERRED

| # | Item |
|---|---|
| X-01 / X-02 | IMU head motion; video head pose — superseded by X-05. |
| X-03 | Further gaze-baseline sensitivity — partly discharged by D-12; see X-06. |
| X-04 | Extending `channel-correlation` to the v3 gaze columns — awaiting approval. |
| X-05 | **The overlay pass.** If time permits, gaze overlays for every participant × film, to add awareness of head movement and of where participants were looking. The intended route to a head channel. **No current wording anticipates it.** |
| X-06 | **Next analysis pass additions:** (a) the per-participant gaze baseline scored against self-report — computed for the figure, never tested, and it produces the strongest directional separation of the three baselines on boring against interesting; **(b) NEW — per-round criterion splits (R1-only, R2-only) as a sensitivity check that the pooled association is not carried by one round. Expect Round 2 to be thin: four participants give twelve paired points and only 1,296 distinct within-subject arrangements, so descriptive at best.** |
| X-07 | **The v5 analysis regeneration pass:** the composite misdescribed in `report.py:493`, `figures.py:656` and `crossref.py`'s docstring; the stale "1099–2430 s"; the empty enumerations and "+nan trimmed"; the two gaze-caption defects; the **eye closure** rename; the **American spelling sweep**; X-06; and the `EXCLUSIONS.log` line reading "3/3 episodes whose heading states an order," which reads as three participants when it is three episodes belonging to S01. |
| X-08 | **Group index entries for the nine documents ingested 2026-08-04/05.** |
| **X-09** | **NEW — manual review of the session video to demonstrate the S08 transition directly**, if time permits. Would move it from a closure-timing inference to something seen. Same rule as X-05: no current wording anticipates it. |

## 6. OPEN — awaiting the author (4, none blocking)

| # | Question | Where |
|---|---|---|
| O-03 | The two ASEE works-cited entries; co-author/participant surname overlap | L1 ¶8, L2.1 — at assembly |
| O-06 | How much of the published studies to re-present vs cite | L1 ¶8 — constrained by the 4–5 pp cap |
| O-14 | Multiplicity in the criterion family — recommendation is a footnote | L2.8 (`******`) — at drafting |
| O-15 | IRB-facing survey wording | L2.2, L2.8 (`******`) — at drafting |

**Standing, not a question:** **N-06 — draft with Fable at xhigh; Opus for the physiological analysis. The author
switches the model personally and is to be NOTIFIED when Stage 3 begins.**

**Resolved since v6:** the L3 restructure (D-25) · criterion validity as interpretive base (D-26) · gaze elevated
(D-27) · the three-sets question (D-28) · potentiality (D-29) · agitation (D-30) · the within-episode transition
(D-31) · the depletion withdrawal (D-32) · the attunement note (D-33) · the aversive-arousal answer (D-34) ·
O-04, O-05, O-07 by continuation (D-35) · O-08 by the L2 and L3 splits.

## 7. STANDING

PII: `S01`–`S08` / `R2-01`–`R2-04` only; crosswalk never persisted. **Round 1 source filenames carry participant
names, so directory listings and file paths are never reproduced in any output.**
Verification-gated: quotes EXACT before entering prose; **index entry → `docs search` → `verify-quote` (EXACT
only) → PDF last**, all from `archon-cli-v3`; backups before touching approved files; **nothing committed without
explicit sign-off**.
Doctrine: chain-node walkthrough is the analytical form · NO-STALL · GREATEST-DESIRE · "demonstrated" never
"prove" · **potentiality is always actualized within a narrowed field (D-29)**.
Statistics: directional convergence plus the surfaces that reach significance; never per-channel significance for
channels that do not; n < 6 labeled descriptive; at n = 4 the signed-rank floor is p = 0.125.
Category caution: episodic structural grammar only, never a *Grundstimmung* claim — **and per D-33 this is a
requirement of the frame, not modesty**. No learning-outcome claims.
