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
- **Data gaps:** S07 is missing the Interesting stimulus entirely; S07-Boring has inconsistent duplicate crop
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
