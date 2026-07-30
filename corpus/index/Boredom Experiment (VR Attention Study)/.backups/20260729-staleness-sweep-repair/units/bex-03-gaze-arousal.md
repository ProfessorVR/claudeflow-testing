# bex-03 — `ch-gaze`: The Eye-Tracking Gaze / Arousal Channel

**Register:** FE (published as P2) / FE-U (N=8 arousal surface reprocessed at O-9). P2's gaze derivation is cited at
the published level; the **raw N=8 arousal and gaze-variance streams are now processed** via `ch-hmd`/`ch-fig`
(O-9, 2026-07-16) and are reported below alongside it, kept distinct by cohort.

## Channel structure
- **Measure:** gaze-deviation variance @ **120 Hz** + pupil dilation.
- **Published derivation (P2):** ASEE 2024 #44685, **N=12**. Findings: clinical-vs-boring **p = 0.0004**, with clinical
  *resembling engaging*; pupil dilation engaging > boring in 6/12; the **high-arousal searching gaze vs low-arousal
  "zombie stare"** distinction (zombie stare in 2 subjects); viewing order reversed after boring-first exhaustion
  carryover.

## The processed N=8 surfaces (O-9, 2026-07-16 — FE-U)
Within-subject z-scores, each subject's stimulus scored against their own three-video mean, then averaged across the
cohort. Higher DMN / parietal alpha / gaze variance = more boring-like; higher cognitive load / pupil = more engaged.

| stimulus | EEG DMN | parietal α | gaze variance | cognitive load | pupil |
|---|---|---|---|---|---|
| **Boring** | **+0.48** | **+0.70** | **+0.21** | −0.19 | −0.69 |
| Clinical | −0.24 | −0.32 | −0.20 | **+0.33** | **+0.40** |
| Interesting | −0.24 | −0.38 | −0.01 | −0.14 | +0.30 |

Raw magnitudes for reference: parietal alpha BOR 22.9 vs CLC 11.4 vs INT 12.4 µV²; gaze-deviation variance BOR 0.0112
vs CLC 0.0100 vs INT 0.0106; pupil BOR 3.26 vs CLC 3.46 vs INT 3.34 mm; cognitive load BOR 0.514 vs CLC 0.551 vs INT
0.533. HR and HRV are vendor-held with some dropout and run highest on boring — treat as secondary.

**All five surfaces converge:** Boring is the outlier, and clinical sits with interesting at the engaged pole.
**Statistically, only pupil dilation separates the conditions at N=8** — Friedman p=0.030, with Boring < Clinical in
all 8 subjects (Wilcoxon p=0.008 Holm-corrected, rank-biserial −1.0, a perfect separation). Everything else is
directional only: EEG DMN p=0.20, parietal α p=0.22, gaze variance p=0.61, cognitive load p=0.61, HR p=0.20, HRV
p=0.61. **The evidence is the directional convergence across five channels, not per-channel significance** — report it
that way. Testing the EEG and gaze surfaces individually would need a larger N. Full test table:
`boredom-o9-processing/out/ch-stats.csv`.

## Cohort-N caution
P2's **N=12 is a different cohort** from the raw self-report N=8 (S01–S08) and from P1's N=3 EEG. A binding to this
channel is a binding to the published N=12 gaze derivation — not to the raw N=8 per-subject record.

## Channel role — RESTATED at O-9, 2026-07-29
As published, this channel was the **surface** half of the keystone: gaze reading clinical as engaging-like against
`ch-eeg` reading it boring-like. The reprocessing dissolves that pairing — `ch-eeg` no longer reads clinical as
boring-like at N=8 — and relocates the divergence. Gaze now sits with **every other physiological surface** on the
engaged side for clinical, and the disagreement that carries the keystone runs between the physiology as a whole and
`ch-selfreport`, which rates clinical 6.0/9. The searching-gaze versus zombie-stare contrast is unaffected and still
supplies the withdrawn, low-arousal third-form analog. Findings registered at `vle-02`; keystone at the FCM entry,
which still carries the superseded wording and needs correcting.
