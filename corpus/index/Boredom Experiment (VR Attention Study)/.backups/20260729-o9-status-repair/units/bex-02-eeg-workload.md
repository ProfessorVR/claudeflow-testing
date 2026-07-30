# bex-02 — `ch-eeg`: The 4-Channel EEG / Workload Channel

**Register:** FE (published as P1) / raw (declared). **Raw status: O-9 deferred** — `.mat` files are declared metadata,
not parsed for this build.

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

## Channel role
The **workload/depth** reading in the keystone's two-channel pairing: where `ch-gaze` reads clinical as engaging-like,
`ch-eeg` reads it as boring-like — the surface/depth disagreement that *is* the second form's signature. Raw `.mat`
reprocessing (all 8 subjects, all bands) awaits **O-9**.
