# bex-03 — `ch-gaze`: The Eye-Tracking Gaze / Arousal Channel

**Register:** FE (published as P2). **Published derivation only** — this channel is cited at the published-derivation
level; the raw per-subject gaze streams are not processed here.

## Channel structure
- **Measure:** gaze-deviation variance @ **120 Hz** + pupil dilation.
- **Published derivation (P2):** ASEE 2024 #44685, **N=12**. Findings: clinical-vs-boring **p = 0.0004**, with clinical
  *resembling engaging*; pupil dilation engaging > boring in 6/12; the **high-arousal searching gaze vs low-arousal
  "zombie stare"** distinction (zombie stare in 2 subjects); viewing order reversed after boring-first exhaustion
  carryover.

## Cohort-N caution
P2's **N=12 is a different cohort** from the raw self-report N=8 (S01–S08) and from P1's N=3 EEG. A binding to this
channel is a binding to the published N=12 gaze derivation — not to the raw N=8 per-subject record.

## Channel role
The **surface** reading in the keystone's two-channel pairing: gaze reads clinical as **engaging-like** (occupied
surface) while `ch-eeg` reads it as boring-like (hollow depth) and `ch-selfreport` splits — the disagreement that is the
second form's two-channel signature. The searching-gaze/zombie-stare contrast also supplies the third-form-analog
(withdrawn, low-arousal) pole. Findings registered at `vle-02`; keystone at the FCM entry.
