# RECONCILIATION

Two parts of the Round 2 tree are not inputs to this analysis. Both are recorded
here so their absence is a decision on the record rather than a gap.

## 1. The `VR Data Recorder/` tree - excluded entirely

**Author ruling, 2026-07-30: ignore all files under `VR Data Recorder/`.** The
exclusion is enforced in code, not by convention: `config.EXCLUDED_TREES` lists the
path and `adapters.r2_collect()` skips any directory beneath it while walking, so no
file in that tree can reach a feature, a table or a figure.

Reconnaissance before the ruling established what is there: 16 session folders, of
which 3 are marked `_Test`; 70 non-empty CSVs, of which 43 duplicate the organized
copies under `Subjects/` and **27 do not**.

Those 27 non-duplicate CSVs are therefore **unprocessed**. They are the only known
Round 2 material not represented in the analysis. If the ruling is ever revisited
they are where to look, and the reconciliation would need redoing from scratch,
because nothing about them has been read into this pipeline.

The `Subjects/` copies are preferred over the curated `EyeTrackingDatasets/` exports
for a separate reason that still applies: taking each cell from its subject folder
means subject-to-stimulus attribution comes from the folder structure rather than
from a filename, which is the more robust of the two.

## 2. The three `_Test` sessions - instrument validation, not cohort data

The `_Test` sessions are rehearsals and are excluded from the cohort. They are
reported here as instrument validation. Measured durations, from the same
reconnaissance: **3.64, 11.24 and 8.75 minutes** against a 17-minute
stimulus. One was additionally verified as dated two weeks before the session it
appears to rehearse.

None reaches stimulus length, which is what identifies them as rehearsals rather
than as short or aborted sessions.

**Provenance note:** the counts and durations in this file were measured during
reconnaissance on 2026-07-29/30, BEFORE the exclusion ruling, and are reported from
that record. They are not recomputed by this pipeline and cannot be, because the
tree is excluded from it by construction. Every other number in this analysis is
regenerated on every run; these are the exception, and they are labeled as such.

## 3. Video

All `.mkv` / OBS video, including the Round 1 eye-tracking overlay renders, is
out of scope by author ruling and is not processed. Head motion is measured from the
Round 2 IMU instead, which measures the head rather than the image.
