# DECISIONS REGISTER — Laboratory Boredom section (v6, 2026-08-05)

Supersedes `DECISIONS-REGISTER-v5-2026-08-05.md`. Complete and standalone.
Version chain: supersede with `-v7-`, never edit in place.

**v6 banks the viewing-order resolution and everything that came with it: the order settled and corroborated three
ways, the data-labeling question closed, the protocol change traced to its documented reason, the carryover
hypothesis tested against the two participants who generated it, and N-04 and N-07 resolved.**

---

## 0. STYLE AND SOURCE LOCKS

| # | Lock |
|---|---|
| **S-01** | **American spelling throughout — "center," never "centre."** Generalizes: *analyze, normalize, harmonize, labeled, artifact, behavior, recognize, organize*. *Analysis* is already American and is not part of the sweep. Footprint in the v4 analysis tree: **52 instances in generated `.md`/`.txt`, 76 in `analysis/*.py`.** Repaired in X-07. Prior-version documents keep their British forms and are never edited. |
| **S-02** | **`archon-cli-v3` is the sole source for corpus, index and ingested retrieval.** Binary `archon-cli-v3/target/release/archon` (v1.3.11); store `.archon/`; corpus `corpus/`; **index `index/` — at the PROJECT ROOT, not under `corpus/`.** `projects/archon-cli` retired. State 2026-08-05: 241 documents, 13,564 chunks, 18,238 pages, 0 failed. Re-chunked under native extraction, so **chunk-level references predating 2026-08-05 are stale**. |
| **S-03** | **Verification gates on EXACT MATCH** — never "found," never a fuzzy hit (a 99% fuzzy match has returned unrelated front-matter). FCM page loci **read from the running head, never computed**; the offsets are not constant. |

## 1. RULED — analysis scope and channel status

| # | Ruling |
|---|---|
| R-01 | **Cognitive load is NOT load-bearing.** Vendor-computed. Appendix only. Evidenced: flat against self-report (rho −0.09 / +0.11, permutation p 0.65 / 0.60). |
| R-02 | **Heart rate and HRV removed entirely.** Measurement failed for some participants owing to facial/head structure. Appendix only. Evidenced: rho +0.09 / +0.04, p 0.68 / 0.86. |
| R-03 | **IMU head motion — DEFERRED.** Superseded in practice by X-05. |
| R-04 | **Video-derived head pose — DEFERRED.** See X-05. |
| R-05 | **Load-bearing channels:** pupil, eye closure, gaze, the 7-item self-report. EEG a full negative. |
| R-06 | **Equal focus on all three films.** The clinical-centered framing was an IRB/publication necessity. |
| R-07 | **Survey administered per episode**, in the break immediately after each film. |
| R-08 | **Boring stimulus** = a 17-minute section of a **1989 Microsoft Word tutorial**. Task-structured instructional content, not visually empty filler. |
| R-09 | **S04's `minutes until bored` on the boring film is VOID.** Reclassified *never became bored*. |
| **R-10** | **NARROWED by D-21.** R2-03's split session dates are no longer simply "ignore, do not report" — the participant is *analyzed* as a single session, and the dates stay out of the prose as dates. |
| R-11 | **Overlay videos** in scope as corroborating material, not as the foundation of any claim. Extended by X-05. |

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
| D-09 | **Criterion p is a WITHIN-SUBJECT PERMUTATION p** — 20,000 shuffles inside each participant, fixed seed. Analytic values retained beside, never quoted as the result. |
| D-10 | **Spearman reported; Pearson alongside in the appendix.** On all four load-bearing associations Pearson is the LARGER, so the reported figure is conservative. |
| D-11 | **The closure surface is named EYE CLOSURE.** *The proportion of the episode during which the eyes were shut*; for Round 1, *the proportion during which the tracker could not obtain a valid read of both eyes*, licensed at **r = 0.998** inside Round 2. Negative sign in the engaged composite. Renamed across tables and captions in X-07. |
| D-12 | **Gaze baselines: NEITHER primary; each assigned to the question it answers.** Fixed forward for **stimulus separation**; per-file median for **agreement with self-report**; every gaze result names its baseline. Log: `PROSE-METHODS-GAZE-BASELINE-v1-2026-08-04.md`. |
| D-13 | **The two-questions distinction is introduced three times at increasing specificity**: introduction, method module, then applied without re-explanation at the criterion subsection. |
| D-14 | **Section structure is body plus appendix.** Body ~30 pp; a methods-and-limits appendix carries technical detail, the full limit set, the criterion appendix and the per-participant matrix. **Literature module capped at 4–5 pp**, expected to compress further on a second pass once a complete draft exists. |
| D-15 | **The eye-only scope is accepted and made the section's methodological argument.** Qualified by X-05. |
| D-16 | **EEG framing.** Both halves, in order: dropped for scaling; the reprocessing then established what it could have carried. **Agreement with self-report was asserted qualitatively in the published work and is computed here for the first time, per channel, with a clustering-corrected probability.** |
| D-17 | **The three stimulus films are identified for the works cited.** Boring = Whamtan, "THE MOST BORING VIDEO EVER MADE (Microsoft Word tutorial, 1989)," YouTube, 20 April 2014; interesting = The Why Files, "How to Build a Working UFO \| Alien Reproduction Vehicles (ARVs)," 8 December 2022; clinical = UCI Virtual Reality, "Spinal Deformation," 11 April 2022. |
| D-18 | **van den Brink et al., "Pupil Diameter Tracks Lapses of Attention" (2016), approved for citation.** Anchors pupil as an index of attention and arousal rather than boredom-as-reported. |
| D-19 | **THE DEFINITIONAL SUBSTITUTION IS THE SECTION'S ARGUMENT.** The data was collected under an explicit, cited psychological definition of boredom; this section prioritizes Heidegger's instead, **to demonstrate what philosophy reveals when applied to scientifically collected and statistically analyzed data.** Consequences: (1) **the published studies could only ever have detected the first form**, their operative definition building the first form's structure into the construct — stated as a consequence, never as criticism; (2) **the keystone appears as a divergence rather than a measurement**; (3) **the self-report channel is an instrument of the first-form construct**, simultaneously a limit (L6.11) and the condition that makes the divergence legible (L4.2). |
| D-20 | **N-02 approved.** The observation that the two published papers engage one of the fifty-five indexed boredom units is stated in prose as description of where the program stood, with the phenomenology-of-VR citations doing the redemptive work (L1 ¶8). The sampling-rate seam (F-10) likewise, as a fact about logging rather than an error. |
| **D-21** | **NEW — R2-03 and S07 are analyzed as single sessions in the standard order** (author, 2026-08-05), exactly like the other participants of their rounds, despite the recorded material spanning more than one sitting. Nothing computational changes, since order is not a covariate in any test; it changes only what the prose may assert. Narrows R-10. |
| **D-22** | **NEW — the carryover hypothesis is reported together with the data that does not support it** (author-approved 2026-08-05), briefly, at L6.3. Same posture as D-20: it forecloses a reviewer finding it first, and it is the section's own method turned on the study that produced the data. |
| **D-23** | **NEW — N-07 resolved.** The definitional quotations are **rendered once, together, at L1 ¶10** — Eastwood's environmental-attribution condition beside the FCM's "nothing at all to be found" — and paraphrased everywhere else. |
| **D-24** | **NEW — N-04 resolved on the conservative reading.** The order confound **and** its internal control both appear in the findings at L3.10, because a reader meets the order fact there and will not wait for the limits to learn whether it was handled. L6.3 then states what remains, including that the control is Round-1-only and n = 2. The weight-bearing claim stays the twelve-of-twelve separation; the pair is a check that points the right way, and the prose says so rather than inflating it. |

## 3. ESTABLISHED — findings about the instrument

| # | Finding |
|---|---|
| F-01 | Round 1 in Unreal (X forward), Round 2 in Unity (Z forward). |
| F-02 | The published gaze feature uses a **fixed forward** reference (`1 − X`); the 2026 reimplementation substituted each file's own median, removing sustained posture by construction. |
| F-03 | **Both rounds record gaze EYE-IN-HEAD, not head pose.** R2 combined gaze never exceeds 38.8°. |
| F-04 | **Head movement is where disengagement is visible and it is unmeasured in this pass.** Never claim the boring film produced stillness. |
| F-05 | Round 1's window is the middle ~13.6 min; Round 2's crop is essentially the whole film. |
| F-06 | Round 2 closure is **binary at source** — {0,1} across 3,416,362 per-eye samples. |
| F-07 | Round 1 blink sentinel is the vector (−1, +1, −1). |
| F-08 | The film started on "open your eyes" and stopped on "close your eyes." |
| **F-09** | **RESOLVED AND CORROBORATED — the viewing order, all twelve.** Round 1: **S01 and S05 ran clinical → boring → interesting; S02, S03, S04, S06, S07, S08 ran interesting → clinical → boring.** Round 2: **all four ran interesting → clinical → boring**, on dated epoch timestamps. **Boring last in ten of twelve, second in two.** Three independent corroborations: crop-file clock times; the author's manual review (agreeing on six of eight); and **the original uncut CSVs**, whose start times reproduce the crop-derived order for the two disputed participants with a consistent 1:47–2:22 offset matching the crop rule's own trim. S01 is confirmed a fourth way by its survey heading, the only one that states an order. **The data-labeling question is CLOSED** — consistent offsets across independently named uncut and cropped files mean the stimulus labels are sound, so no physiological value is attached to the wrong film. |
| F-10 | **The published 120 Hz is the sensor's rate, not Round 1's logging rate.** Round 1 logs at a median 3.00 Hz; Round 2 is the first round in which every attached sensor polled and logged at 120 Hz. |
| F-11 | **The published gaze cohort cannot contain Round 2** — the 2024 paper's access dates are January 2024; Round 2 was recorded March 2024. |
| F-12 | **The operative definition and its lineage, all verified EXACT.** P1's methods adopt Fahlman et al.'s definition — **"the aversive experience of having an unfulfilled desire to be engaged in satisfying activity"** — declare the focus to be *state* boredom, and select the stimulus under the same authority: **"State boredom often derives from information or environmental stimuli that is monotonous, redundant, and/or meaningless."** Fahlman's definition is Eastwood's: **"the aversive experience of wanting, but being unable, to engage in satisfying activity,"** requiring that one **"attribute the cause of our aversive state to the environment."** Lineage: Eastwood (2012) → Fahlman (2013) → P1 (2023) → this data. |
| F-13 | **The incompatibility is locatable.** Eastwood's environmental-attribution condition is denied by the second form — **"There is nothing at all to be found that might have been boring"** (FCM pp.107–108, bbox p107); what is boring **"arises from out of Dasein itself"** (pp.126–127, bbox p126). Core anchor: **"that which holds us in limbo and yet leaves us empty"** (pp.84–85, bbox p84). All EXACT. |
| **F-14** | **NEW — the protocol change has a documented reason and a traceable origin.** **S01 and S05 were the first two participants through the experiment.** After observing them the team hypothesized that the boring film was so boring it depressed the film that followed directly after, and reorganized the order to interesting → clinical → boring for everyone afterward. This is the referent of P2's published sentence: *"Early experiments revealed that the boring video increased levels of exhaustion, negatively impacting participants' subsequent experiences with the other videos."* So the two deviant orders belong to the two participants whose sessions produced the rule. |

## 4. FINDINGS from the analysis runs

| # | Finding |
|---|---|
| N-01 | **Criterion validity.** Gaze deviation +0.524 vs boredom (perm p 0.0074), −0.527 vs engagement (0.0075); eye closure −0.460 (0.0212) and +0.416 (0.0370). **Pupil does not track self-report** (−0.17, p 0.40). |
| N-02 | **Amplitude and frequency point opposite ways.** Frequency lower on the boring film, 7/8 both contrasts, **Holm p = 0.047** — the first gaze result to survive correction. |
| N-03 | The re-crop left eye closure completely unmoved (11/12, F 0.0004, W 0.0010, rb −0.974). |
| N-04 | Closure is window-invariant; pupil is cleaner on the matched window (0.097 → 0.017). |
| N-05 | Composite A is cleaner than B (clinical 8/4/0/0 against 7/3/1/1). |
| N-06 | Divergence concentrates on the clinical film — 8/12 against 0 on boring. |
| N-07 | The per-file gaze baseline correlates with self-report better than the fixed-forward restoration (0.52 vs 0.36). Governed by D-12. |
| N-08 | The first criterion run's analytic p-values were wrong; three associations are now reported as non-significant. |
| N-09 | Spearman and Pearson agree closely (median \|r − rho\| = 0.032, max 0.117). |
| N-10 | The clustering correction applies to Pearson exactly as to Spearman. |
| N-11 | **The order confound has a partial internal control.** S01 and S05 saw the boring film second and the interesting film last, and in both the last-viewed film still carried the higher eye-open fraction (0.926 against 0.904; 0.852 against 0.212). S05's 449 s closure occurred mid-session. Boring sits below interesting in **12 of 12**. **At n = 2, descriptive; it does not dissolve the confound.** |
| N-12 | **The two published studies engage one of the 55 indexed boredom units** (Raffaelli). The 2023 paper cites phenomenology of VR — Morie, Heinzel and Heinzel, Tham — as framing rather than as an interpretive frame. Stated in prose per D-20. |
| **N-13** | **NEW — the carryover hypothesis, tested against the two participants who generated it.** For S01 and S05 the film directly after the boring one was the interesting film. Against the six who saw it first: self-reported boredom **3.50 against 4.83**, felt duration **15.0 against 22.7 minutes**, engagement 5.50 against 5.33, eye-open fraction 0.889 against 0.887, pupil 3.10 against 3.42. **The published rationale's two halves fare differently.** *Exhaustion* is half-supported: S05's depletion on the boring film is **+5**, the largest in Round 1, while S01's is **0**. *Degradation of the subsequent experience* is **not supported on self-report** — the interesting film that followed was rated less boring and felt seven minutes shorter than for participants who met it fresh. Only pupil runs in the hypothesized direction, and raw pupil compared across people is the least trustworthy quantity in this dataset. **n = 2 against n = 6, descriptive, no test**, and the two differ from the rest in more than order: earliest sessions, least settled protocol, and S05 is the sleep case with 21.2% eye validity on the boring film. **Reported per D-22 as an observation, never as a claim.** Possible alternative reading, flagged and not asserted: a contrast effect, the interesting film benefiting from what preceded it — which is the relation-not-property argument operating across sequence rather than across persons (L4.5). |

## 5. DEFERRED

| # | Item |
|---|---|
| X-01 / X-02 | IMU head motion; video head pose — superseded in practice by X-05. |
| X-03 | Further gaze-baseline sensitivity — partly discharged by D-12; see X-06. |
| X-04 | Extending `channel-correlation` to the v3 gaze columns — awaiting approval; changes an existing figure. |
| X-05 | **The overlay pass.** *If time permits*, use the gaze-overlay videos for **every participant × every film** to add awareness of head movement and of where participants were actually looking. The intended route to a head channel; supersedes the IMU rationale. **Changes nothing in current claims and no current wording may anticipate it.** |
| X-06 | **Add the per-participant gaze baseline to the criterion family.** Computed for the figure, never scored against self-report, and it produces the strongest directional separation of the three on boring against interesting (8/8 R1, 4/4 R2) — so its omission from the test that decided D-12 is a hole in that justification. Stated in the prose until it runs. |
| X-07 | **The v5 analysis regeneration pass**, one run covering: (a) the composite misdescribed in `report.py:493`, `figures.py:656`, `crossref.py`'s docstring; the stale "1099–2430 s" in `figures.py:523` and `config.py:194`; the empty enumerations and "+nan trimmed"; (b) the two gaze-caption defects — baselines blended in one sentence, and "10/12" pooled across rounds for a channel marked not poolable; (c) the **eye closure** rename (D-11); (d) the **American spelling sweep** (S-01); (e) X-06; **(f) NEW — the `EXCLUSIONS.log` line reading "3/3 episodes whose heading states an order" reads as three participants; it is three episodes belonging to one participant, S01.** |
| X-08 | **Group index entries for the nine documents ingested 2026-08-04/05** (Fahlman, Eastwood, Mugon, Morie, Heinzel, Tham, Meyer, Tamim, Parhi); none has one yet, so retrieval runs `docs search` → `verify-quote` without an entry to consult first. Also pending: index entries for `AD(H)D/` (author's own pass). |

## 6. OPEN — awaiting the author (8)

| # | Question | Where | Status |
|---|---|---|---|
| O-03 | The two ASEE works-cited entries; co-author/participant surname overlap | L1 ¶8, L2.1 | at assembly |
| O-04 | Within-episode time course — computed, never reported | L3.7 | open |
| O-05 | Per-participant matrix as an appendix | L3.6 | shaped by D-14 |
| O-06 | How much of the published studies to re-present vs cite | L1 ¶8 | constrained by the 4–5 pp cap |
| O-07 | Prior exposure — analytic variable or footnote | L4.5 | open |
| O-08 | How much apparatus the prose carries against the appendix | L2.10, L3 | body/appendix split needs specifics |
| O-14 | Multiplicity in the criterion family — recommendation is a footnote | L2.8 (`******`) | at drafting |
| O-15 | IRB-facing survey wording | L2.2, L2.8 (`******`) | at drafting |

**Standing, not a question:** **N-06 — draft with Fable at xhigh; Opus for the physiological analysis. The author
switches the model personally and is to be NOTIFIED when Stage 3 begins.**

**Resolved since v5:** the viewing order (F-09, F-14) · the data-labeling question (closed, F-09) · R2-03 and S07
single-session (D-21) · the carryover check reported (D-22, N-13) · N-07 → D-23 · N-04 → D-24.

## 7. STANDING

PII: `S01`–`S08` / `R2-01`–`R2-04` only; crosswalk never persisted; no participant name in any output, log,
figure, caption or filename — **note that Round 1 source filenames themselves carry participant names, so
directory listings and file paths are never reproduced in any output.** The author may use names in conversation;
they never reach a file.
Verification-gated: quotes EXACT before entering prose; **index entry → `archon docs search` → `verify-quote`
(EXACT only) → PDF last**, all from `archon-cli-v3`; backups before touching approved files; **nothing committed
without explicit sign-off**.
Doctrine: chain-node walkthrough is the analytical form · NO-STALL · GREATEST-DESIRE · "demonstrated" never
"prove".
Statistics: directional convergence plus the surfaces that reach significance; never per-channel significance for
channels that do not; n < 6 labeled descriptive; at n = 4 the signed-rank floor is p = 0.125.
Category caution: episodic structural grammar only, never a *Grundstimmung* claim. No learning-outcome claims.
