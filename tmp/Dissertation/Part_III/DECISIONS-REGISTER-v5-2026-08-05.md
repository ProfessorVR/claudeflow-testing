# DECISIONS REGISTER — Laboratory Boredom section (v5, 2026-08-05)

Supersedes `DECISIONS-REGISTER-v4-2026-08-04.md`. Complete and standalone.
Version chain: supersede with `-v6-`, never edit in place.

**v5 banks the definitional ruling — the section's argumentative spine — plus N-02, the drafting-model
preference, the archon-v3-only source rule, and the verification results of 2026-08-05.**

---

## 0. STYLE AND SOURCE LOCKS

| # | Lock |
|---|---|
| **S-01** | **American spelling throughout — "center," never "centre"** (2026-08-04). Generalizes: *analyze, normalize, harmonize, labeled, artifact, behavior, recognize, organize*. Note *analysis* is already American and is not part of the sweep. Measured footprint in the v4 analysis tree: **52 instances in generated `.md`/`.txt`, 76 in `analysis/*.py`**. Repaired in the v5 analysis pass (X-07). Prior-version documents keep their British forms and are never edited. |
| **S-02** | **NEW — `archon-cli-v3` is the sole source of truth for corpus, index and ingested retrieval** (2026-08-05). Binary `/home/dalton/projects/archon-cli-v3/target/release/archon` (v1.3.11); store `archon-cli-v3/.archon/`; corpus `archon-cli-v3/corpus/` (261 files, 9 subdirectories); index **`archon-cli-v3/index/`** — at the project root, **not** under `corpus/`. `projects/archon-cli` is retired for this work. Store verified 2026-08-05: **241 documents, 13,564 chunks, 18,238 pages, 0 failed, index queue empty**; a live hybrid search returns the expected documents. The store was re-chunked under the new native extraction, so **any chunk-level reference predating 2026-08-05 is stale**; page loci improved. |
| **S-03** | **NEW — verification gates on EXACT MATCH**, never on "found" and never on a fuzzy hit. A 99% fuzzy match has been observed returning unrelated front-matter boilerplate. FCM page loci are **read from the running head, never computed** — the offsets against the desktop draft's existing citations are not constant (confirmed 2026-08-05). |

## 1. RULED — analysis scope and channel status

| # | Ruling |
|---|---|
| R-01 | **Cognitive load is NOT load-bearing.** Vendor-computed. Appendix only. Evidenced: flat against self-report (rho −0.09 / +0.11, permutation p 0.65 / 0.60). |
| R-02 | **Heart rate and HRV removed entirely.** Measurement failed for some participants owing to facial/head structure. Appendix only. Evidenced: rho +0.09 / +0.04, permutation p 0.68 / 0.86. |
| R-03 | **IMU head motion — DEFERRED.** Superseded in practice by X-05. |
| R-04 | **Video-derived head pose — DEFERRED.** See X-05. |
| R-05 | **Load-bearing channels:** pupil, eye closure, gaze, and the 7-item self-report. EEG reported as a full negative. |
| R-06 | **Equal focus on all three films.** The clinical-centered framing was an IRB/publication necessity. |
| R-07 | **Survey administered per episode**, in the break immediately after each film. |
| R-08 | **Boring stimulus** = a 17-minute section of a **1989 Microsoft Word tutorial**. Task-structured instructional content, not visually empty filler. |
| R-09 | **S04's `minutes until bored` on the boring film is VOID.** Reclassified *never became bored*. |
| R-10 | **R2-03's split session dates**: ignore, do not report. |
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
| D-11 | **The closure surface is named EYE CLOSURE** (O-02). One definition: *the proportion of the episode during which the eyes were shut*; for Round 1, *the proportion during which the tracker could not obtain a valid read of both eyes*, licensed at **Pearson r = 0.998** inside Round 2. Enters the engaged composite with a negative sign. Renamed across tables and captions in X-07. |
| D-12 | **Gaze baselines: NEITHER primary; each assigned to the question it answers** (O-12). Fixed forward for **stimulus separation**; per-file median for **agreement with self-report**; every gaze result names its baseline. Log and drafting-ready prose: `PROSE-METHODS-GAZE-BASELINE-v1-2026-08-04.md`. |
| D-13 | **The two-questions distinction is introduced three times at increasing specificity** (O-13): methodology statement in the introduction, compact restatement in the method module, applied without re-explanation at the criterion subsection. |
| D-14 | **Section structure is body plus appendix** (O-09). Body ~30 pp. A methods-and-limits appendix carries technical detail, the full limit set, the criterion appendix and the per-participant matrix. **The literature module is capped at 4–5 pp** — explicitly not 8–10. Expected to compress further on a second pass once a complete draft exists. |
| D-15 | **The eye-only scope is accepted and made the section's methodological argument** (O-11): the published headline rested on the noisiest instrument and did not survive, while the strongest result comes from the simplest measurement — whether the eye was shut. Qualified by X-05. |
| D-16 | **EEG framing** (O-01). Both halves, in order: dropped for scaling; the reprocessing then established what it could have carried. Reconciliation: **agreement with self-report was asserted qualitatively in the published work and is computed here for the first time, per channel, with a clustering-corrected probability.** |
| D-17 | **The three stimulus films are identified for the works cited** (O-10): boring = Whamtan, "THE MOST BORING VIDEO EVER MADE (Microsoft Word tutorial, 1989)," YouTube, 20 April 2014; interesting = The Why Files, "How to Build a Working UFO \| Alien Reproduction Vehicles (ARVs)," 8 December 2022; clinical = UCI Virtual Reality, "Spinal Deformation," 11 April 2022. |
| D-18 | **van den Brink et al., "Pupil Diameter Tracks Lapses of Attention" (2016), approved for citation** from the unindexed `AD(H)D/` folder. Anchors pupil as an index of attention and arousal rather than boredom-as-reported. |
| **D-19** | **NEW AND LOAD-BEARING — the definitional substitution is the section's argument** (author-approved 2026-08-05). The data was collected under an explicit, cited, psychological definition of boredom; this section prioritizes Heidegger's instead, **to demonstrate what philosophy reveals when applied to scientifically collected and statistically analyzed data.** Three consequences, all ruled: (1) **the published studies could only ever have detected the first form**, because their operative definition builds the first form's structure into the construct — stated as a consequence of the definition, never as a criticism of the studies; (2) **the keystone appears as a divergence rather than a measurement** — the survey asks first-form questions, the physiology does not know that, and where they part company is where a non-first-form structure is operating; (3) **the self-report channel is an instrument of the first-form construct**, which is simultaneously a limit (L6.11) and the condition that makes the divergence legible (L4.2). Threads through §0a, L0.2, L0.3, L0.6, L1 ¶1/¶8/¶10/¶12, L2.2, L2.3, L4.2, L4.3, L4.5, L6.11. |
| **D-20** | **NEW — N-02 approved.** The observation that the two published papers engage one of the fifty-five indexed boredom units **is stated in prose**, as description of where the program stood rather than as indictment, with the phenomenology-of-VR citations in the same paragraph doing the redemptive work (L1 ¶8). The sampling-rate seam (F-10) is likewise stated, as a fact about logging rather than an error in the paper (L2.4). |

## 3. ESTABLISHED — findings about the instrument

| # | Finding |
|---|---|
| F-01 | Round 1 in Unreal (X forward), Round 2 in Unity (Z forward). Confirmed from `eyetrackdatamapping_V3.m`. |
| F-02 | The published gaze feature uses a **fixed forward** reference (`1 − X`); the 2026 reimplementation substituted each file's own median, removing sustained posture by construction. |
| F-03 | **Both rounds record gaze EYE-IN-HEAD, not head pose.** R2 combined gaze never exceeds 38.8°. |
| F-04 | **Head movement is where disengagement is visible and it is unmeasured in this pass.** Never claim the boring film produced stillness. |
| F-05 | Round 1's window is the middle ~13.6 min; Round 2's crop is essentially the whole film. |
| F-06 | Round 2 closure is **binary at source** — {0,1} across 3,416,362 per-eye samples. |
| F-07 | Round 1 blink sentinel is the vector (−1, +1, −1). |
| F-08 | The film started on "open your eyes" and stopped on "close your eyes." |
| F-09 | **Viewing order is very largely fixed and confounded with stimulus.** The published protocol set interesting → clinical → boring because early experiments showed the boring film raised exhaustion. **Ten of twelve ran that order; S01 and S05 ran clinical → boring → interesting.** |
| F-10 | **The published 120 Hz is the sensor's rate, not Round 1's logging rate.** Round 1's telemetry logs at a median 3.00 Hz; Round 2 is the first round in which every attached sensor polled and logged at 120 Hz. |
| F-11 | **The published gaze cohort cannot contain Round 2** — the 2024 paper's access dates are January 2024; Round 2 was recorded March 2024. |
| **F-12** | **NEW — the operative definition and its lineage, all verified EXACT 2026-08-05.** P1's methods state it adopted Fahlman et al.'s definition, **"the aversive experience of having an unfulfilled desire to be engaged in satisfying activity,"** declares its focus to be *state* boredom, and selects the stimulus under the same authority: **"State boredom often derives from information or environmental stimuli that is monotonous, redundant, and/or meaningless."** Fahlman's definition is Eastwood's: **"the aversive experience of wanting, but being unable, to engage in satisfying activity,"** requiring that one **"attribute the cause of our aversive state to the environment."** Lineage: Eastwood (2012) → Fahlman (2013) → P1 (2023) → this data. |
| **F-13** | **NEW — the incompatibility is locatable.** Eastwood's environmental-attribution condition is denied by Heidegger's second form — **"There is nothing at all to be found that might have been boring"** (FCM pp.107–108, bbox p107) and what is boring **"arises from out of Dasein itself"** (pp.126–127, bbox p126) — and the third form leaves no particular want to be unfulfilled. Core definition anchor: **"that which holds us in limbo and yet leaves us empty"** (pp.84–85, bbox p84). All EXACT. |

## 4. FINDINGS from the analysis runs

| # | Finding |
|---|---|
| N-01 | **Criterion validity.** Gaze deviation rho +0.524 vs boredom (perm p 0.0074), −0.527 vs engagement (0.0075); eye closure −0.460 (0.0212) and +0.416 (0.0370). **Pupil does not track self-report** (−0.17, p 0.40). |
| N-02 | **Amplitude and frequency point opposite ways.** Frequency lower on the boring film, 7/8 both contrasts, **Holm p = 0.047** — the first gaze result to survive correction. |
| N-03 | The re-crop left eye closure completely unmoved (11/12, F 0.0004, W 0.0010, rb −0.974). |
| N-04 | Closure is window-invariant; pupil is cleaner on the matched window (0.097 → 0.017). |
| N-05 | Composite A is cleaner than B (clinical 8/4/0/0 against 7/3/1/1). |
| N-06 | Divergence concentrates on the clinical film — 8/12 against 0 on boring. |
| N-07 | The per-file gaze baseline correlates with self-report better than the fixed-forward restoration (0.52 vs 0.36). Now governed by D-12. |
| N-08 | The first criterion run's analytic p-values were wrong; three associations are now reported as non-significant. |
| N-09 | Spearman and Pearson agree closely (median \|r − rho\| = 0.032, max 0.117). |
| N-10 | The clustering correction applies to Pearson exactly as to Spearman. |
| N-11 | **The order confound has a partial internal control.** S01 and S05 saw the boring film second and the interesting film last, and in both the boring film still carried the lower eye-open fraction (0.904 vs 0.926; 0.212 vs 0.852). S05's 449 s closure occurred mid-session. Boring sits below interesting in **12 of 12**. **At n = 2, descriptive; it does not dissolve the confound.** |
| N-12 | **The two published studies engage one of the 55 indexed boredom units** (Raffaelli). Their lineage is clinical-immersion engineering education plus vendor documentation. The 2023 paper cites phenomenology of VR — Morie, Heinzel and Heinzel, Tham — as framing rather than as an interpretive frame. **Stated in prose per D-20.** |

## 5. DEFERRED

| # | Item | Condition |
|---|---|---|
| X-01 / X-02 | IMU head motion; video head pose | superseded in practice by X-05 |
| X-03 | Further gaze-baseline sensitivity | partly discharged by D-12; see X-06 |
| X-04 | Extending `channel-correlation` to the v3 gaze columns | awaiting approval; changes an existing figure |
| X-05 | **The overlay pass.** *If time permits*, use the gaze-overlay videos for **every participant × every film** to add awareness of head movement and of where participants were actually looking. The intended route to a head channel; supersedes the IMU rationale. **Changes nothing in current claims and no current wording may anticipate it.** Twelve overlays with `_Crop` CSVs and heatmaps already exist from the 2026-08-01 pipeline. |
| X-06 | **Add the per-participant gaze baseline to the criterion family** in the next analysis pass. It was computed for the figure and never scored against self-report, and it produces the strongest directional separation of the three baselines on boring against interesting (8/8 R1, 4/4 R2) — so its omission from the test that decided D-12 is a hole in that justification. Stated in the prose until it runs. |
| X-07 | **The v5 analysis regeneration pass**, one run covering: (a) the composite misdescribed in `report.py:493`, `figures.py:656`, `crossref.py`'s docstring; the stale "1099–2430 s" in `figures.py:523` and `config.py:194`; the empty enumerations and "+nan trimmed"; (b) the two gaze-caption defects — baselines blended in one sentence, and "10/12" pooled across rounds for a channel marked not poolable; (c) the **eye closure** rename (D-11); (d) the **American spelling sweep** (S-01); (e) X-06. Run after the walkthrough, before any caption is carried into the dissertation. |
| **X-08** | **NEW — group index entries for the nine documents ingested 2026-08-04/05.** None yet carries one, so retrieval for them runs `docs search` → `verify-quote` without an entry to consult first. Also pending: index entries for the `AD(H)D/` folder (author's own pass; judged unlikely to bear on this section beyond D-18). |

## 6. OPEN — awaiting the author (11)

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
| N-04 | **Viewing-order presentation** — findings plus the internal control, or limits alone | L3.10, L6.3 | **open** |
| **N-06** | **NEW — drafting model.** Fable at xhigh for prose, Opus for the physiological analysis. Session model switches with `/model`; cleanest is to switch at Stage 3. Nothing in this material should trip a safeguard — ordinary human-subjects research under an IRB protocol with label-only PII — and the drafting inputs are summary statistics, not raw physiological records. | Stage 3 | **open** |
| **N-07** | **NEW — whether the four verified definitional quotations appear in rendered prose or only as citations.** §0a's argument can be made by paraphrase, but the incompatibility is sharpest when Eastwood's environmental-attribution condition and the FCM's "nothing at all to be found" sit on the page together. Recommendation: quote both, once, at L1 ¶10. | L1 ¶10, L2.2 | **open** |

**Resolved since v4:** O-02 → D-11 (already banked) · **the definitional argument → D-19** · **N-02 → D-20** ·
N-03 → D-18 · N-05 → the 12-¶ L1 architecture in outline v4 · N-01 discharged for the nine ingested documents.

## 7. STANDING

PII: `S01`–`S08` / `R2-01`–`R2-04` only; crosswalk never persisted; no name in any output, log, figure, caption or
filename. The author may use names in conversation; they never reach a file.
Verification-gated: quotes EXACT before entering prose; **index entry → `archon docs search` → `verify-quote`
(EXACT only) → PDF last**, all from `archon-cli-v3`; backups before touching approved files; **nothing committed
without explicit sign-off**.
Doctrine: chain-node walkthrough is the analytical form · NO-STALL · GREATEST-DESIRE · "demonstrated" never
"prove".
Statistics: directional convergence plus the surfaces that reach significance; never per-channel significance for
channels that do not; n < 6 labeled descriptive; at n = 4 the signed-rank floor is p = 0.125.
Category caution: episodic structural grammar only, never a *Grundstimmung* claim. No learning-outcome claims.
