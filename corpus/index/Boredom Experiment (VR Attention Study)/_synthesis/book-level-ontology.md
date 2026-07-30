# bex — Boredom Experiment (VR Attention Study) — Raw-Dataset Channel Ontology

The citable home for Part III's **lab/VR pole as a raw dataset**: the Boredom Experiment (VR Attention Study), an
8-subject study collecting EEG, HMD telemetry, session video (OBS), eye-tracking, and per-video self-reports across
three 17-min stimuli (Boring / Interesting / Clinical). This entry is the **raw-dataset / channel-structure anchor**;
its anonymized *derivative* view — aggregates, the four load-bearing cases, and the felt-duration findings — already
lives as **`vle-02-boredom-raw-dataset`** under the King–Salvo VLE anchor, and the study's *findings* are registered as
vle nodes 10–14 there. **This entry does not duplicate those findings** — its nodes are the dataset's **channels** (its
measurement structure), the layer the derivative and the FCM keystone draw from.

Provenance registers: **FE** = faithful-empirical published (P1 physiological / P2 eye-tracking) · **FE-U** =
faithful-empirical unpublished raw record (per-video self-reports, plus the O-9 reprocessed physiological surfaces;
**O-10 resolved 2026-07-29 — reportable in full except the subject's name**) · **FH** = faithful-Heidegger ·
**P** = projected reading (`anticipatory-application`).

**Gates over this entry (see `units/bex-00-corpus-overview.md` §Gates):** PII (subjects are `S01–S08` only; **no real
name in any file** — this gate is permanent and unchanged); O-10 **RESOLVED 2026-07-29** (author ruling: under the
governing IRB protocol all findings are reportable *except* the subject's name, so the former
aggregates-plus-four-cases ceiling no longer binds; the per-subject matrix may be reported Sxx-keyed in
dissertation-facing output, and the `(Med)` marker is confirmed to denote a **medical student** — the stratum P2's
own published recruitment paragraph names. The name→Sxx crosswalk remains underived and unpersisted); O-9 **three of
four channels PROCESSED 2026-07-16** (see below).

**O-9 processing status (updated 2026-07-29).** `ch-eeg`, `ch-hmd` and `ch-fig` are **PROCESSED** — full N=8, methods
grounded in the two published papers, cross-validated and statistically tested; scripts at `scripts/boredom-o9/`
(commit `b766783a5`), per-subject outputs untracked, findings note at
`tmp/Dissertation/Part_III/reanalysis/boredom-o9-physiological-findings.md`. **`ch-obs` remains UNPROCESSED** and is
scoped as its own final phase (GPU stimulus-segmentation + head-restlessness + off-task, which **corroborate**
`ch-gaze`/`ch-hmd` rather than adding an independent surface): see
`plans/boredom-experiment-o9-processing-scope-2026-07-16.md`. Currently usable: `ch-selfreport` (full record),
`ch-eeg`/`ch-hmd`/`ch-fig` (processed N=8), `ch-gaze` (P2 published derivation, N=12).

## Map of the entry
- **units/** `bex-00-corpus-overview` · `bex-01-selfreport-record` · `bex-02-eeg-workload` · `bex-03-gaze-arousal` · `bex-04-stimulus-corpus`.
- **_synthesis/** this file · `manifest.json` (entry meta + `channels[]` spec + outbound bridges) · `graph-channel-map.mmd`.
- **bridge-sources/** `paper-digest-pointers.md` (P1/P2/P3 digests live at the FCM entry — not duplicated).
- **Outbound relationships (this anchor points OUT):** → FCM `_synthesis/fcm-king-salvo-bridge.md` (the second-form
  two-channel **keystone** — **RESTATED at O-9, 2026-07-29:** the published N=1 reading, *EEG reads clinical
  boring-like while gaze reads it engaging-like*, **does not replicate at N=8** (clinical DMN is low, i.e.
  engaging-like; the split holds in 4/8 = chance). The corrected keystone is **all-physiology-engaged vs
  self-report-bored** on the clinical stimulus — every processed surface reads clinical with the engaged pole while
  self-report rates it 6.0/9 — which is stronger than the paper's version because it does not rest on the noisiest
  instrument. The bridge file still carries the superseded wording and needs the same correction) · → Part III M2/M3
  (the felt-duration / *Hingehaltenheit* record + the two-channel divergence datum) · → the King–Salvo `vle-02`
  derivative (this raw dataset is what `vle-02` anonymizes).
- **Cohort-N heterogeneity (kept distinct):** P1 EEG N=3 (one clean) · P2 gaze N=12 · raw self-report N=8 (S01–S08).
  A published-channel derivation (P1/P2) is **not** the same cohort as the raw N=8 per-subject record.

## 3A. Canonical Node List

#### 1. ch-selfreport — per-video self-report channel
- **definition**: The 7-item per-video questionnaire (fatigue-prior 1–9 · boredom 1–9 · engagement 1–9 · minutes-until-bored · sleep-fight 1–9 · **felt-duration** · fatigue-after), administered to 8 subjects across 3 stimuli = 24 episodes; viewing order recorded where noted [FE-U; **O-10 resolved 2026-07-29 — reportable in full except the subject's name**]. The channel `vle-02`'s aggregates and four load-bearing cases derive from. The full per-subject 24-row matrix lives in the untracked reanalysis brief and **may now be reported Sxx-keyed** in dissertation-facing output; it is not reproduced in the index because the index holds channel structure, not findings. Boredom and engagement are asked as two separate items rather than one bipolar axis, which is what allows the layers to diverge within a single instrument (S07 rated the clinical stimulus boredom-6 and engagement-7 at once).
- **type**: DATASET-CHANNEL
- **units**: bex-01
- **centrality**: core
- **aliases**: 7-item instrument, felt-duration channel, boredom/engagement self-report

#### 2. ch-eeg — 4-channel EEG workload channel
- **definition**: F3, F4, P3, P4 DMN alpha/theta; `.mat` ×3 per subject; published as P1 (ASEE 2023 #37129, N=3, one clean subject — clinical ≈ boring control). A B-Alert workload-band crosswalk (boredom<.40 / ideal .40–.70 / overload>.70) runs **parallel, not commensurable**, with self-report boredom. **PROCESSED at O-9 (2026-07-16), full N=8**, methods taken from P1 itself (montage F3/F4/P3/P4 = data columns 0–3; 1–35 Hz; boredom marker = DMN power in alpha 8–12 + theta 4–8, higher = boring-like — NOT a theta/alpha ratio). Result: within-subject z-scores put **Boring** as the outlier (DMN +0.48, parietal α +0.70) with clinical and interesting together at the engaged pole; **P1's N=1 "clinical EEG ≈ boring" does not replicate** (4/8 = chance). EEG is suggestive, not decisive — ~60% epoch retention, low SNR, n.s. at N=8 (DMN p=0.20, parietal α p=0.22); raw band-power is not comparable across subjects, so the within-subject z-score is the comparable form.
- **type**: DATASET-CHANNEL
- **units**: bex-02
- **centrality**: core
- **aliases**: EEG channel, DMN workload, physiological channel (P1)

#### 3. ch-gaze — eye-tracking gaze/arousal channel
- **definition**: Gaze-deviation variance @120 Hz + pupil dilation; published as P2 (ASEE 2024 #44685, N=12): clinical-vs-boring **p=0.0004**, clinical resembling engaging; high-arousal searching gaze vs low-arousal "zombie stare." Published derivation only — its N=12 cohort is **not** the raw N=8 self-report cohort.
- **type**: DATASET-CHANNEL
- **units**: bex-03
- **centrality**: core
- **aliases**: eye-tracking channel, searching-gaze vs zombie-stare, arousal channel (P2)

#### 4. ch-stimulus — video-stimulus corpus
- **definition**: Ten state-contrast 4K60 compilations plus per-subject labeled clips; naming key CLC/INT/Boring × LA/HA/IE/E/ME/AS (EC = eyes-closed); 17-min actual length. Three canonical stimuli: Boring = 1989 Word tutorial · Interesting = alien-reproduction-vehicles · Clinical = 360° spinal surgery. Aliases: BOR≡Boring, CLC≡Clinical, INT≡Interesting.
- **type**: DATASET-CHANNEL
- **units**: bex-04
- **centrality**: core
- **aliases**: stimulus corpus, 4K60 compilations, media-condition channel

#### 5. ch-hmd — HMD telemetry / exposure channel
- **definition**: HP Reverb G2 Omnicept telemetry; exposure-duration / session-time protocol — the reference for exposure-time and cybersickness questions. **PROCESSED at O-9 (2026-07-16), full N=8** — headerless 12-column CSV (wall-clock, gaze unit-vector, L/R pupil mm, validity flags, vendor cognitive-load, HR, HRV), yielding the arousal surface: **pupil dilation, cognitive load, HR, HRV**, plus gaze-deviation variance computed per P2's definition. **Pupil is the dataset's one statistically robust surface** (Friedman p=0.030; Boring < Clinical in all 8 subjects, Wilcoxon p=0.008 Holm, rank-biserial −1.0); cognitive load, HR and HRV are directional only. Format variants handled in the scripts: a 9-column colon-timestamp variant, `0` as a vendor sentinel on HR/HRV/cognitive-load, `_Crop` files being lower-rate re-exports rather than row subsets.
- **type**: DATASET-CHANNEL
- **units**: bex-04
- **centrality**: supporting
- **aliases**: HMD channel, exposure protocol, Omnicept telemetry

#### 6. ch-obs — session-video channel (first-person in-VR headset feed)
- **definition**: OBS screen-capture of the subject's first-person in-VR view (Windows Mixed Reality feed) — 4K/HEVC/60 fps, ~85.6 GB across 8 subjects. **NOT a body/comportment camera: no participant body footage was ever recorded (confirmed 2026-07-16), so posture/fidget/watch-glance are not recoverable and there is no independent third behavioral surface.** What the feed yields: stimulus-state **segmentation** (a precise cross-channel alignment anchor for `ch-eeg`/`ch-hmd`/`ch-fig`), head-restlessness (global optical flow), and on/off-task — signals that **corroborate `ch-gaze`/`ch-hmd`, not a new axis.** **The one channel still UNPROCESSED (O-9)** — the other three light channels were processed 2026-07-16; this one is its own final phase, GPU-bound and IO-bound, and is scoped in `plans/boredom-experiment-o9-processing-scope-2026-07-16.md`.
- **type**: DATASET-CHANNEL
- **units**: bex-04
- **centrality**: supporting
- **aliases**: OBS channel, in-VR headset feed, stimulus-segmentation / alignment source

#### 7. ch-fig — analysis-figure channel
- **definition**: Per-subject MATLAB `.fig` analysis outputs derived from the EEG/gaze channels. **PROCESSED at O-9 (2026-07-16)** — MATLAB v5 files read with `scipy.io.loadmat`; 161 unique series of 168 extracted. Its unique value is the **processed** gaze (two filter levels) and pupil (five-level denoise cascade) that exist only in the `.fig` and cannot be regenerated from the raw CSV; HR/HRV/cognitive-load traces proved byte-exact tail-aligned duplicates of the HMD CSV and are kept as validation, not as new signal (fig ≡ CSV in 60/63 checks, confirming the channel mapping). Known gaps: S07 is missing the entire Interesting set; S03 carries md5-identical flat and nested duplicates.
- **type**: DATASET-CHANNEL
- **units**: bex-04
- **centrality**: peripheral
- **aliases**: figure channel, MATLAB .fig outputs
