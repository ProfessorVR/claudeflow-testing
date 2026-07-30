# bex-02 — `ch-eeg`: The 4-Channel EEG / Workload Channel

**Register:** FE (published as P1) / FE-U (reprocessed). **Raw status: PROCESSED at O-9, 2026-07-16** — all 24 `.mat`
files parsed to a full-N=8 workload surface using P1's own published method.

## Channel structure
- **Montage:** 4-channel EEG — **F3, F4, P3, P4** — read for DMN alpha/theta activity. Raw storage: `.mat` ×3 per
  subject (one per stimulus), N=8 on disk.
- **Published derivation (P1):** ASEE 2023 #37129, **N=3** (one clean subject). Finding: EEG **suggestive only** — for
  the one clean subject, clinical ≈ boring control (i.e. the depth/workload channel reads clinical as *boring-like*).
  This is the corroborating-only leg of the keystone (lean on gaze + felt-time; EEG corroborates).
- **Workload-band crosswalk (parallel, not commensurable):** a B-Alert-style band scheme — boredom < .40 / ideal
  .40–.70 / overload > .70 — is the vocabulary the VR-pedagogy EEG literature (e.g. ped-sec-10, ped-sec-13) would align
  against. That alignment is a **crosswalk, not an equivalence**: the band ↔ self-report-boredom mapping stays "parallel,
  not commensurable" until an explicit crosswalk exists.

## Cohort-N caution
P1's N=3 (one clean) is **not** the raw N=8 self-report cohort and **not** P2's N=12 gaze cohort. A pointer bound to
this channel via the published P1 derivation is bound to N=3, not to per-subject raw EEG.

## Channel role — RESTATED at O-9, 2026-07-29
This channel was the **depth** half of the keystone as published: where `ch-gaze` read clinical as engaging-like,
`ch-eeg` read it as boring-like, and that disagreement was taken as the second form's signature. **The reprocessing
withdraws this channel from that role.** P1's reading came from its single clean subject; across all eight, clinical's
DMN power is *low* — engaging-like, statistically indistinguishable from the interesting stimulus — and the boring-like
reading holds in 4/8, which is chance. `ch-eeg` now sits with every other physiological surface on the engaged side for
clinical, and the divergence that carries the keystone runs between **the physiology as a whole and `ch-selfreport`**,
not between two instruments. The channel's remaining evidential weight is corroborative and directional: Boring is the
outlier (DMN +0.48, parietal α +0.70 in within-subject z-scores, parietal alpha ~2× the other stimuli in raw
magnitude), but neither surface reaches significance at N=8 (DMN p=0.20, parietal α p=0.22) and epoch retention runs
~60% with low SNR. Report it as convergent direction, never as a per-channel result.
