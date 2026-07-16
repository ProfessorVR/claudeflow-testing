# Boredom Experiment — O-9 processing scripts (3 light channels)

Reproducible processing of the **raw** Boredom Experiment (VR Attention Study) dataset's deferred physiological
channels — `ch-hmd` (Omnicept arousal), `ch-fig` (MATLAB `.fig` extraction), `ch-eeg` (EEG workload) — plus
cross-validation and N=8 statistics. Companion to the anchor
`corpus/index/Boredom Experiment (VR Attention Study)/` and the scoping plan
`plans/boredom-experiment-o9-processing-scope-2026-07-16.md`.

**Results/findings are NOT here** (they are FE-U analysis) — see the untracked Part III note
`tmp/Dissertation/Part_III/reanalysis/boredom-o9-physiological-findings.md` and the working outputs under
`tmp/Dissertation/Part_III/boredom-o9-processing/out/`. This directory holds **code only**; `out/` is gitignored.

## Methods — grounded in the published papers (not inferred)
- **EEG** — King, Feeney, Tang, Das, Salvo, *Physiological Assessment…*, ASEE 2023 #37129: montage **F3, F4, P3,
  P4** (= data columns 0–3; Table 2 order), 200 Hz, **1–35 Hz** bandpass; boredom marker = **DMN power in
  alpha (8–12) + theta (4–8)**, higher = more boring-like. 2-s epochs, robust MAD artifact rejection.
- **Gaze** — King, Lo, Das, Salvo, *…Eye Tracking*, ASEE 2024 #44685: feature = **variance of the 5-point
  sliding-window-median Euclidean deviation of gaze from center** (higher = searching/boredom).
- **HMD arousal** — HP Reverb G2 Omnicept vendor-derived HR / HRV / cognitive-load / pupil; `0`-sentinels masked.

## Usage — interpreters matter (PATH trap)
Base `python3` under `/mnt/d` resolves to a scipy/pandas-less interpreter. Call the full paths:
```
cd scripts/boredom-o9          # or wherever the scripts live; they read /mnt/d and write ./out/
/home/dalton/.venv/bin/python                  ch_hmd.py    # pandas (+ openpyxl for one S03 xlsx)
/home/dalton/.pyenv/versions/3.11.9/bin/python3 ch_fig.py    # scipy
/home/dalton/.pyenv/versions/3.11.9/bin/python3 ch_eeg.py    # scipy
/home/dalton/.pyenv/versions/3.11.9/bin/python3 ch_validate.py
/home/dalton/.pyenv/versions/3.11.9/bin/python3 ch_stats.py
```
`common.py` = the shared canonical **S01–S08** ordering (raw folder names sorted; never de-tagged) + stimulus
normalization; imported by all channels so the cross-channel subject mapping is identical.

## Data-format variants handled (verified on all 8 subjects)
- HMD CSV: 12-col (H,M,S,ms + 8 signals) **and** a 9-col colon-timestamp variant (some S07 Boring files).
- HR/HRV/cognitive-load `0` = vendor no-reading sentinel → masked to NaN.
- `.fig`: flat layout (`BOR_`/`CLC_`/`INT_` prefixes) or nested per-stimulus folders; typos + bare names resolved
  by token + parent-folder matching; S03 md5-dup dedup; S07 missing Interesting handled.
- EEG anomalies auto-trimmed (S06-Boring double-length, S07-Interesting garbage tail).

## Caveats
- **EEG is suggestive** (~60% epoch retention; low SNR — the team itself demoted it for gaze). Raw band-power is
  not comparable across subjects; use within-subject normalization.
- **Statistics (N=8, Friedman + Wilcoxon, Holm):** only **pupil dilation** is significant (Boring < Clinical, all
  8 subjects, p=0.008); other surfaces are directionally consistent but n.s. — underpowered for per-channel
  inference. See the Part III note.
- `ch-obs` (session video) is a **separate deferred phase** and is not processed here.

## PII
Raw-tree inspection at `/mnt/d/PhD/Dissertation/Boredom Experiment/` is authorized; subject folders/filenames
carry real names, but every **output** is keyed on `S01–S08` only. The name→Sxx crosswalk is never persisted.
Only dissertation-facing output must be anonymized; these scripts enforce that at the output layer.
