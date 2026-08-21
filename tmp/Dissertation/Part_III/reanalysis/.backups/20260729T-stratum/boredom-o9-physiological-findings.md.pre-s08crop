# Boredom Experiment — O-9 Physiological Reanalysis (N=8, paper-grounded)

**Companion to** `boredom-experiment-brief.md` (which covered the FE-U self-report + published P1/P2 findings).
This note reports the **processed physiological channels** of the raw dataset — EEG, eye-tracking, HMD arousal —
computed for **all 8 subjects (S01–S08)** at the O-9 processing pass (2026-07-16). Register: **FE-U** (processed
from the raw record); **methods are FE**, grounded in the two published papers rather than inferred:

- **EEG** (King, Feeney, Tang, Das, Salvo — ASEE 2023 #37129): 4 channels **F3, F4, P3, P4** (frontal + parietal),
  200 Hz, 1–35 Hz bandpass. Boredom marker = **increased DMN power in alpha (8–12 Hz) + theta (4–8 Hz)**
  (higher = more boring-like). 2-s epochs, robust artifact rejection (~60% retained).
- **Gaze** (King, Lo, Das, Salvo — ASEE 2024 #44685): **variance of the 5-point-median Euclidean deviation of
  gaze from screen-center** (higher = restless searching / boredom; lower = engaged or "zombie stare").
- **HMD arousal** (HP Reverb G2 Omnicept, already vendor-derived): pupil dilation, cognitive-load index, HR, HRV
  (0-sentinels masked).

Processing scripts + full outputs: `tmp/Dissertation/Part_III/boredom-o9-processing/` (README documents every
data-quality flag). Subjects are `S01–S08` throughout; no raw participant data is reproduced here.

## The physiological surfaces, per stimulus (within-subject z-scores)

Values are each subject's stimulus z-scored against their own three-video mean (so cross-subject amplitude
differences don't dominate), then averaged across the cohort. **Higher DMN / parietal-alpha / gaze-variance =
more boring-like; higher cognitive-load / pupil = more engaged.**

| stimulus | EEG DMN | parietal α | gaze variance | cognitive-load | pupil |
|---|---|---|---|---|---|
| **Boring** | **+0.48** | **+0.70** | **+0.21** | −0.19 | −0.69 |
| Clinical | −0.24 | −0.32 | −0.20 | **+0.33** | **+0.40** |
| Interesting | −0.24 | −0.38 | −0.01 | −0.14 | +0.30 |

Raw magnitudes for reference: parietal alpha **BOR 22.9 vs CLC 11.4 vs INT 12.4 µV²**; gaze-deviation variance
BOR 0.0112 vs CLC 0.0100 vs INT 0.0106; pupil BOR 3.26 vs CLC 3.46 vs INT 3.34 mm; cognitive-load BOR 0.514 vs
CLC 0.551 vs INT 0.533. (HR/HRV — vendor-held, some dropout — are highest on boring: HR 83.2/82.3/81.9,
HRV 97.4/91.1/81.0; treat as secondary.)

## Finding 1 — every physiological surface converges on the same boredom outlier
Across all five channels the pattern is consistent and mutually corroborating: **Boring is the outlier** — high
DMN activity (the paper's parietal-alpha marker is unambiguous: ~2× the other videos), high gaze-deviation
variance (the restless searching gaze), and the *lowest* pupil dilation and cognitive-load. **Clinical and
Interesting cluster together at the engaged pole** on every measure. The multi-channel convergence is the
strongest form of the result — no single noisy instrument carries it. **Statistically, however, only pupil
dilation separates the conditions at N=8** (Boring < Clinical in all 8 subjects, p=0.008); the convergence is
*directional across channels*, not per-channel significance (see Statistical tests).

## Finding 2 — the keystone, corrected on the wider record
The 2023 paper's headline claim — **clinical EEG resembles boring** — rested on its **one clean subject** (of
N=3). **At N=8 with the confirmed F3/F4/P3/P4 montage it does not replicate:** clinical's DMN power is *low*
(engaging-like), statistically indistinguishable from interesting, and clinical resembles boring on the EEG in
only **4/8 subjects** (chance). So the second-form signature is **not** "gaze occupied vs EEG hollow." It is
cleaner and more robust: **the physiological surface as a whole reads clinical as engaged** (low DMN, low gaze
variance, high pupil, high cognitive-load) **while the self-report rates clinical fairly boring** (mean 6.0/9,
between boring 7.0 and interesting 4.5, per `vle-02`). The occupied-surface / hollow-depth divergence is
**physiology-engaged vs self-report-bored** — a stronger keystone than the paper's fragile N=1 EEG split, and
one that does not depend on the noisiest instrument. [P — the second-form mapping is anticipatory-application.]
Formally, the clinical-engaged reading is **significant for pupil** (Boring < Clinical, all 8, p=0.008) and
**directional** for the other channels — so the reframed keystone is well-supported qualitatively and by pupil
specifically, and awaits a larger N for channel-by-channel confirmation.

## Caveats (honest)
- **EEG is suggestive, not decisive** — ~60% epoch retention (S05-CLC 47%, S08-CLC 36%, S08-INT 44%); the team
  itself demoted EEG for gaze on SNR grounds. Raw band-power is not comparable across subjects (per-subject
  amplitude varies) — the within-subject z-scores above are the comparable form.
- **N=8, no formal power** — the multi-channel convergence is the evidence; statistical tests are in the next
  section, read with the small-N caveat.
- **Data gaps:** S07's Interesting episode: **the session ran and was recorded, but the physiological capture failed** (author-confirmed 2026-07-29) — so the EEG and figure series are absent for that episode while the self-report exists. Describe it as a capture failure, not as a subject who did not complete the protocol; S07-Boring has inconsistent duplicate crop
  files (lower confidence); S08 has heavy HR dropout; S05-Boring has low eye-tracking validity (21%).
- Category caution in force: episodic structural grammar, not *Grundstimmung* claims.

## Statistical tests (N=8, within-subjects: Friedman omnibus + Wilcoxon signed-rank, Holm-corrected)
At N=8 the non-parametric tests are conservative, and **only one surface reaches significance:**
- **Pupil dilation — SIGNIFICANT.** Friedman χ²=7.0, **p=0.030**; post-hoc **Boring < Clinical in all 8
  subjects** (Wilcoxon p=0.008 Holm-corrected, rank-biserial **−1.0**, a perfect separation). Pupil is the
  cleanest engagement/boredom signal in the dataset (consistent with P2's pupil-dilation finding).
- **All other surfaces n.s.** at N=8: EEG DMN (χ²=3.25, p=0.20), parietal alpha (χ²=3.0, p=0.22), gaze-deviation
  variance (χ²=1.0, p=0.61), cognitive-load (p=0.61), HR (p=0.20), HRV (p=0.61). Their *means* run in the
  expected direction (boring = the boredom outlier), but the effect is not consistent enough across all 8
  subjects to survive formal testing — expected given N=8, the EEG's low SNR, and large per-subject amplitude
  variation (parietal alpha's ~2× mean gap is driven by a subset, not a uniform within-subject ranking).

**Interpretation.** The evidence is the **directional convergence across five channels**, not per-channel
significance. Only **pupil dilation** is statistically robust at this N; the multi-channel agreement raises
confidence descriptively but the study is **underpowered for channel-by-channel inference**. Testing the EEG/gaze
surfaces individually would need a larger N (e.g. P2's own N=12 gaze cohort). This does not weaken the
*qualitative* keystone (physiology-engaged vs self-report-bored), but the **quantitative** claim rests
significantly on pupil, with the other channels corroborating in direction only.

Full test table: `boredom-o9-processing/out/ch-stats.csv`.

## The (Med) stratum check (2026-07-29)

**Occasion.** O-10 was resolved 2026-07-29 (author ruling: all findings reportable under the governing IRB protocol
except the subject's name), and the `(Med)` marker was confirmed to denote a **medical student** — the stratum P2's own
published recruitment paragraph names, alongside undergraduate and MEng biomedical engineers. Three of the eight
subjects carry it. Since prior exposure to clinical footage is the obvious alternative explanation for the keystone,
the split was run against the processed surfaces. Subjects are Sxx-keyed by the same canonical ordering the O-9 scripts
use (`common.subject_map()`); no name was read into any output. **N=8 with a 3/5 split has no inferential power — every
comparison below is descriptive.**

### Finding A — the stratum makes no difference on the clinical stimulus, which answers the exposure objection
On the stimulus the keystone rests on, the two strata are indistinguishable:

| | n | self-report boredom | engagement | felt duration | engaged-composite |
|---|---|---|---|---|---|
| medical students | 3 | **6.00** | 4.33 | 21.7 min | +0.367 |
| non-medical | 5 | **6.00** | 4.20 | 22.4 min | +0.256 |

The boredom means are identical, the felt-duration dilation is the same, and the physiological composite runs in the
same direction and rough magnitude. **The pupil separation (Boring < Clinical) holds 3/3 and 5/5** — the one
statistically robust surface is stratum-invariant. Students who have watched real procedures rate the clinical footage
exactly as bored as students who have not, and their bodies read exactly as engaged. The divergence is therefore not an
artifact of clinical naivety, which is the first objection a reader will raise.

### Finding B — the keystone decomposes unidirectionally at subject level
Scoring each subject as divergent where the engaged-composite is positive *and* self-report boredom is ≥5:

- **4/8 divergent** in the keystone direction (physiology engaged, self-report bored): S02, S04, S07, S08.
- **2/8 concordant-engaged** (physiology engaged, self-report not bored): S01, S03.
- **2/8 concordant-bored** (physiology below zero, self-report 6): S05, S06.
- **0/8 reverse-divergent.** No subject reads physiologically bored while reporting engagement.

The cohort-mean keystone therefore decomposes into half the cohort actually diverging and **nobody diverging the other
way**. That asymmetry is a stronger structural claim than the mean, and it is the honest form of the result: the
divergence is not universal, but it has a direction.

### Finding C — the physiological ordering is stable across strata where self-report's is not (SCOPED)
Within each stratum, self-report boredom by stimulus versus the physiological surfaces:

| | BOR | CLC | INT |
|---|---|---|---|
| self-report, medical students | 9.00 | 6.00 | 3.67 |
| self-report, non-medical | 5.80 | 6.00 | 5.00 |
| engaged-composite, medical students | −0.372 | +0.367 | +0.005 |
| engaged-composite, non-medical | −0.504 | +0.256 | +0.247 |
| pupil z, medical students | −0.974 | +0.249 | +0.725 |
| pupil z, non-medical | −0.522 | +0.483 | +0.039 |

By self-report the medical students produce the designed monotonic ordering with a wide spread, while the non-medical
group is nearly flat and mildly inverted — rating the *clinical* film as the most boring of the three, above the
designated boring control. The physiology shows no such instability: Boring is the outlier in both strata on both the
composite and pupil.

**Scope this carefully.** Excluding the two cases the brief already flags as anomalies — S04's inversion (boring rated
1) and S06's boredom on the interesting film — the non-medical boring mean rises from 5.80 to **8.00**, and the
flatness disappears. So Finding C is *not* "self-report failed in the non-medical group." What it honestly says is that
**both documented anomaly cases fall in the same stratum**, which offers a candidate account for them (differential
engagement with medical and technical content) in place of treating them as idiosyncratic noise. At n=3 and n=5, with
the effect carried by two subjects, this is a hypothesis for a larger-N replication, not a claim. Reported as a
case-level observation only.

*Script: scratchpad `med_stratum_check.py` (reads folder names for the boolean tag only; emits Sxx exclusively).*

## ch-obs — probe-closed 2026-07-29 (remains unprocessed, with a reason)

A pilot pass was run before committing to the full ch-obs processing phase. It closed the channel rather than opening
it, and the reason is worth stating because it is a finding about the material rather than a shortfall of effort.

**What the channel actually contains.** Twenty video files, not twenty-four, in two shapes. Four subjects
(S02, S04, S07, S08) have one recording per stimulus. **Four (S01, S03, S05, S06) have a single continuous unedited
session recording of 65–88 minutes** containing all three stimuli plus the breaks between them, so for those subjects
the filename carries no usable stimulus label. Total 81.7 GB / 9.11 h, all 4K60 HEVC. Three further files sit outside
the `OBS/` folders: two sub-minute captures (S01, S03) that look like aborted takes, and one 12.2-minute recording at
S08's folder root — **author-ruled 2026-07-29: ignore it.** A 560×420 `.avi` in `S01/Images/` sits among the MATLAB
outputs and is an analysis artifact, not participant video. Separately, S07's Interesting session **was recorded**
even though its physiological capture failed — the video's existence is what establishes that the episode ran.

**The decisive finding.** For the Boring and Interesting stimuli the subject views a small bright video panel floating
in a **featureless black void**; for Clinical the subject is inside a fully textured 360° operating room. Optical flow
measures apparent motion of image features, and black has none. **Global flow magnitude therefore tracks the
stimulus's visual richness rather than the subject's head motion**, and any cross-stimulus restlessness comparison
built on it would be an artifact rather than a measurement. Within a single stimulus the signal is real — a pilot
window showed a roughly sixfold swing in ten-second means — but the cross-stimulus contrast, which is the only
contrast this study needs, is not recoverable without panel-tracking or strict within-stimulus normalization.

**Why the channel is not required.** Its declared primary value was stimulus-segmentation timestamps as a
cross-channel alignment anchor. Alignment matters only for within-episode time-course claims, and **every finding in
this note is a per-episode aggregate** computed from the stimulus-window crop files. Head-restlessness would in any
case corroborate `ch-gaze`, which is processed here and published at N=12. The raw feed also carries **no gaze
overlay** — the eye-tracking dot appears only in the edited `Videos/` compilations.

**Feasibility, for the record.** Nothing here was blocked by cost. NVDEC decode ran at 11–12× realtime, putting a full
pass near 50 minutes rather than the 2–3 hours originally scoped; CLIP embedded 244 frames in 0.9 s; Farneback flow
ran at 158 frame-pairs per second. The channel was closed on validity, not on time.

**Status: OUT OF SCOPE for the laboratory section (author-ruled 2026-07-29) — the video material is set aside
altogether for this pass.** Future work, gesture-scale. A study that wanted a visible-*Zeitvertreib* channel would need to record it
deliberately — a body or face camera, or a VR environment with a textured surround for every condition — rather than
recover it from a first-person feed whose background is black for two conditions in three.
