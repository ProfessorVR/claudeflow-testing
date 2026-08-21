# bex-00 — Corpus Overview: The Boredom Experiment Raw Dataset (lab/VR pole)

## What this entry is
The **raw-dataset / channel-structure anchor** for the Boredom Experiment (VR Attention Study) — the lab/VR pole of
Part III's empirical corpus. Eight subjects (**S01–S08**, anonymized) each viewed three 17-min stimuli
(Boring / Interesting / Clinical) under an HP Reverb G2 Omnicept HMD, with five measurement channels recorded plus a
per-video 7-item self-report. This entry catalogs the dataset's **channels** (its measurement structure); it does **not**
re-present the study's findings.

## Relationship to `vle-02` (read this before citing)
- **`vle-02-boredom-raw-dataset`** (under the King–Salvo VLE anchor) = the anonymized **derivative** view: aggregates,
  the four load-bearing cases (S03/S04/S05/S07), and the felt-duration findings. The study's *findings* are registered
  there as **vle nodes 10–14** (felt-duration dilation, sleep-collapse, within-instrument divergence, stimulus
  non-essentialism, depletion carryover).
- **This entry (`bex`)** = the *raw* dataset those derive from — the **channels**. It adds the channel layer to the
  compiled index without duplicating the finding layer.

## Gates (hard; hold over every file in this entry)
1. **PII.** Subjects are `S01–S08` only; the name→Sxx mapping is intentionally unrecorded. The raw `Subjects/` directory
   (person-named on disk) was **not enumerated** for this build — all metadata came from `vle-02` and the untracked
   reanalysis brief, both already anonymized. No real participant name appears in any file here.
2. **O-10 (consent scope) — RESOLVED 2026-07-29.** Author ruling: under the governing IRB protocol **all findings are
   reportable except the subject's name**. The former aggregates-plus-four-cases ceiling no longer binds, and the full
   per-subject 24-row matrix may be reported Sxx-keyed in dissertation-facing output. The `(Med)` marker is confirmed to
   denote a **medical student** — the stratum P2's own published recruitment paragraph names. The name→Sxx crosswalk
   remains underived and unpersisted; the PII gate above is unaffected.
3. **O-9 (processing) — THREE OF FOUR PROCESSED 2026-07-16.** `ch-eeg`, `ch-hmd` and `ch-fig` are processed at full N=8
   (scripts `scripts/boredom-o9/`, commit `b766783a5`; findings note
   `tmp/Dissertation/Part_III/reanalysis/boredom-o9-physiological-findings.md`). **`ch-obs` alone remains unprocessed**,
   scoped as its own final phase.

## Channel taxonomy (the deliverable; full node specs in `_synthesis/book-level-ontology.md` §3A)

| Channel | Modality | Register | Cohort N | Status | Unit |
|---|---|---|---|---|---|
| `ch-selfreport` | per-video 7-item questionnaire (incl. **felt-duration**) | FE-U | 8 | available (**full per-subject record**; O-10 resolved) | bex-01 |
| `ch-eeg` | 4-ch EEG F3/F4/P3/P4, DMN alpha/theta | FE (P1) / raw | 3 / 8 | **PROCESSED N=8** (suggestive; n.s.) | bex-02 |
| `ch-gaze` | gaze-variance @120 Hz + pupil | FE (P2) | 12 | published only (N=12 ≠ raw N=8) | bex-03 |
| `ch-hmd` | Omnicept telemetry / exposure protocol | raw | 8 | **PROCESSED N=8** (pupil = the one significant surface) | bex-04 |
| `ch-obs` | first-person in-VR headset feed (NOT a body cam) | raw | 8 | **the one channel still O-9 deferred** | bex-04 |
| `ch-fig` | per-subject MATLAB `.fig` | derived | 8 | **PROCESSED** (161/168 series; fig-only gaze/pupil) | bex-04 |
| `ch-stimulus` | 10× 4K60 state-contrast compilations | FE | — | metadata only | bex-04 |

**Cohort-N heterogeneity:** P1 EEG N=3 (one clean subject) · P2 gaze N=12 · raw self-report N=8. A published-channel
derivation is **not** the same cohort as the raw N=8 per-subject record — do not read a P1/P2 binding as raw-data
availability.

## The keystone (held at the FCM entry; pointer) — RESTATED at O-9, 2026-07-29
The keystone as published rested on the cross-instrument contradiction: 2023 EEG (`ch-eeg`) reading clinical as
boring-like while 2024 gaze (`ch-gaze`) read it as engaging-like (p=0.0004), with self-report engaged and felt time
dilated. **That version does not survive the N=8 reprocessing.** P1's EEG claim came from its one clean subject; at
N=8 the clinical stimulus's DMN power is *low* (engaging-like) and the boring-like reading holds in only 4/8 subjects,
which is chance. **The corrected keystone is `all-physiology-engaged` vs `self-report-bored` on the clinical
stimulus** — every processed surface (DMN, parietal alpha, gaze variance, cognitive load, pupil) places clinical with
the engaged pole while `ch-selfreport` rates it 6.0/9, between boring's 7.0 and interesting's 4.5. It is the stronger
form of the two-channel signature because it no longer depends on the noisiest instrument. Statistically, **only pupil
dilation separates the conditions at N=8** (Boring < Clinical in all 8, p=0.008); the other surfaces corroborate in
direction only. Canonical statement: FCM `_synthesis/fcm-king-salvo-bridge.md` — **that file still carries the
superseded wording and needs this correction applied.** This anchor's channels are the measurement substrate.

## Outbound relationships (this anchor points OUT)
→ FCM `fcm-king-salvo-bridge.md` (the keystone) · → Part III M2/M3 (felt-duration / *Hingehaltenheit* record +
two-channel divergence datum) · → `vle-02` (this raw dataset's anonymized derivative). The VR-pedagogy literature does
**not** ground measures here — that cluster's speculative `grounds-measure` edges were retired 2026-07-16; three
anticipatory bridges (ped-sec-14 → `ch-stimulus`; ped-sec-12, ped-sec-01) point *in* and are repointed at this entry.

## Processing status (O-9) — updated 2026-07-29
**Three of the four deferred channels are now processed** (2026-07-16, full N=8): `ch-eeg` (band-power reprocess to a
workload surface, methods taken from P1 itself), `ch-hmd` (arousal surface — pupil, cognitive load, HR, HRV, plus
gaze-deviation variance computed per P2's definition), and `ch-fig` (processed gaze and pupil cascades that exist only
in the `.fig` files, plus a tail-aligned validation confirming the HR/HRV/cognitive-load channel mapping in 60/63
checks). Scripts are committed at `scripts/boredom-o9/` (`b766783a5`); per-subject outputs stay untracked; the findings
note is `tmp/Dissertation/Part_III/reanalysis/boredom-o9-physiological-findings.md`.

**`ch-obs` is the one channel still deferred**, as its own final phase. Confirmed 2026-07-16 that no body camera was
ever recorded, so it yields stimulus-segmentation (a cross-channel alignment anchor) + head-restlessness + off-task —
signals that corroborate `ch-gaze`/`ch-hmd` rather than an independent third surface. Approach:
`plans/boredom-experiment-o9-processing-scope-2026-07-16.md` §2.4.

Currently usable: `ch-selfreport` (full per-subject record, O-10 resolved), the processed `ch-eeg`/`ch-hmd`/`ch-fig`
surfaces at N=8, and the published `ch-gaze` (P2, N=12) derivation.

## Analysis home
Full apparatus: `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` (untracked). This entry carries the
citable channel structure; the brief carries the per-subject record and the three-form re-reading.
