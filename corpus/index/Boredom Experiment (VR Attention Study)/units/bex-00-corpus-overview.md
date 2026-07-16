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
2. **O-10 (consent scope).** FE-U (unpublished self-report) is kept at the `vle-02` derivative level — aggregates + the
   four cases. The **full per-subject 24-row matrix is NOT committed** here; it stays in the untracked brief, referenced
   by pointer (`bridge-sources/paper-digest-pointers.md`).
3. **O-9 (processing).** `.mat` EEG, HMD telemetry, OBS video, and MATLAB `.fig` outputs are **declared-but-unprocessed**
   metadata. No parsing / reprocessing / GPU video processing.

## Channel taxonomy (the deliverable; full node specs in `_synthesis/book-level-ontology.md` §3A)

| Channel | Modality | Register | Cohort N | Status | Unit |
|---|---|---|---|---|---|
| `ch-selfreport` | per-video 7-item questionnaire (incl. **felt-duration**) | FE-U | 8 | available (aggregates + 4 cases) | bex-01 |
| `ch-eeg` | 4-ch EEG F3/F4/P3/P4, DMN alpha/theta | FE (P1) / raw | 3 / 8 | raw **O-9 deferred** | bex-02 |
| `ch-gaze` | gaze-variance @120 Hz + pupil | FE (P2) | 12 | published only (N=12 ≠ raw N=8) | bex-03 |
| `ch-hmd` | Omnicept telemetry / exposure protocol | raw | 8 | raw **O-9 deferred** | bex-04 |
| `ch-obs` | first-person in-VR headset feed (NOT a body cam) | raw | 8 | raw **O-9 deferred** | bex-04 |
| `ch-fig` | per-subject MATLAB `.fig` | derived | 8 | metadata only | bex-04 |
| `ch-stimulus` | 10× 4K60 state-contrast compilations | FE | — | metadata only | bex-04 |

**Cohort-N heterogeneity:** P1 EEG N=3 (one clean subject) · P2 gaze N=12 · raw self-report N=8. A published-channel
derivation is **not** the same cohort as the raw N=8 per-subject record — do not read a P1/P2 binding as raw-data
availability.

## The keystone (held at the FCM entry; pointer)
The cross-instrument contradiction — 2023 EEG (`ch-eeg`) reads clinical as boring-like while 2024 gaze (`ch-gaze`)
reads it as engaging-like (p=0.0004), with self-report (`ch-selfreport`) engaged and felt time dilated — is the second
form's **two-channel signature**: occupied surface, hollow depth, detectable only as the disagreement of a surface and
a depth channel. Canonical statement: FCM `_synthesis/fcm-king-salvo-bridge.md`. This anchor's channels are the
measurement substrate of that keystone.

## Outbound relationships (this anchor points OUT)
→ FCM `fcm-king-salvo-bridge.md` (the keystone) · → Part III M2/M3 (felt-duration / *Hingehaltenheit* record +
two-channel divergence datum) · → `vle-02` (this raw dataset's anonymized derivative). The VR-pedagogy literature does
**not** ground measures here — that cluster's speculative `grounds-measure` edges were retired 2026-07-16; three
anticipatory bridges (ped-sec-14 → `ch-stimulus`; ped-sec-12, ped-sec-01) point *in* and are repointed at this entry.

## Deferred processing — future work (O-9)
Four of the seven channels are **catalogued but not yet processed**: `ch-eeg` (raw `.mat` per-subject streams),
`ch-hmd` (Omnicept telemetry — already exported to CSV), `ch-obs` (first-person in-VR headset feed), and `ch-fig`
(MATLAB `.fig` outputs). They are named and located here so the index records what the lab pole contains, but no
signal has been extracted from them in this build. A **file-verified scoping plan**,
`plans/boredom-experiment-o9-processing-scope-2026-07-16.md`, decodes every format and sequences the work: three
channels are light CPU work (`ch-fig`/`ch-hmd` extract already-computed HR/HRV/pupil/cognitive-load; `ch-eeg` is a
seconds-long band-power reprocess to a full-N=8 workload surface). **`ch-obs` is a separate final phase and yields
corroboration only** — confirmed 2026-07-16 that no body camera was ever recorded, so it gives stimulus-segmentation
(a cross-channel alignment anchor) + head-restlessness + off-task, which corroborate `ch-gaze`/`ch-hmd` rather than an
independent third surface. Currently usable now: `ch-selfreport` (aggregates + four cases) and the published `ch-gaze`
(P2, N=12) / `ch-eeg` (P1, N=3) derivations.

## Analysis home
Full apparatus: `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` (untracked). This entry carries the
citable channel structure; the brief carries the per-subject record and the three-form re-reading.
