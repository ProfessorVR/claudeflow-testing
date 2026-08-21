# Boredom Experiment — FILE MANIFEST for the N=12 analysis

Generated 2026-07-30 from the live trees.

**PII rule in force, applied by construction.** No subject folder name and no subject-resident filename is
reproduced anywhere in this document — those are described structurally instead (label, stimulus, window,
format). Recorder-tree CSV filenames are date-stamped rather than person-named and are given verbatim so you
can find them. Subject labels come from sorted lexicographic folder order at runtime: `S01` is the first
folder in Round 1 `Subjects/` under `ls | sort`, `S02` the second, and so on; likewise `R2-01`…`R2-04`.

## Roots

```
R1    /mnt/d/PhD/Dissertation/Boredom Experiment/Subjects/
R2    /mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2/Subjects/
ETD   /mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2/EyeTrackingDatasets/EyeTrackingDatasets/
LOGS  /mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2/VR Data Recorder/Data Logs/
```

## A. `_Test` sessions — EXCLUDED from the cohort, reported as instrument validation

All three sit directly under `LOGS/`. Each is a **truncated *Interesting* rehearsal** — none reaches the
~18–20 min of a real episode. To find them: list `LOGS/` and take the three folders whose names end `_Test`.
They are uniquely identified below by their date token. Two of the three are the same person on different
dates; the third is a different person.

| # | folder name pattern | date | eye rows | eye span | vs 17-min stimulus |
|---|---|---|---|---|---|
| 1 | `<name>_03-08-24_Interesting_Test` | 03-08-24 | 26,212 | **3.64 min** | 21% |
| 2 | `<name>_02-12-24_ET_Interesting_Test` | 02-12-24 | 80,955 | **11.24 min** | 66% |
| 3 | `<name>_03-01-24_Interesting_Test` | 03-01-24 | 63,031 | **8.75 min** | 51% |

Per-session file detail (these filenames carry no name):

**date 03-08-24**

```
  CL-2024-03-08-141919.csv                   cog/hrv   5.1 KB
  EyeTracking-2024-03-08-141919.csv          eye       5.0 MB
  HR-2024-03-08-141920.csv                   hr        3.1 KB
  HRV-2024-03-08-141953.csv                  ZERO-BYTE 
  IMU-2024-03-08-141919.csv                  imu       27.6 MB
```

**date 02-12-24**

```
  CL-2024-02-12-154615.csv                   cog/hrv   23.6 KB
  EyeTracking-2024-02-12-154531.csv          eye       17.1 MB
  HR-2024-02-12-154543.csv                   hr        11.3 KB
  HRV-2024-02-12-154640.csv                  cog/hrv   1.0 KB
```

**date 03-01-24**

```
  CL-2024-03-01-142027.csv                   cog/hrv   18.4 KB
  EyeTracking-2024-03-01-142026.csv          eye       13.0 MB
  HR-2024-03-01-142028.csv                   hr        9.2 KB
  HRV-2024-03-01-142111.csv                  ZERO-BYTE 
  IMU-2024-03-01-142026.csv                  imu       66.2 MB
```

The cohort window is 2024-03-13 → 2024-03-21; these sit one to five weeks earlier. Their retention and rate
figures go into `QC-REPORT.md` so the instrument-validation claim is evidenced rather than asserted.

## B. Undated recorder sessions — EXCLUDED (cohort confirmed as twelve by the author)

These four folder names are numeric only — no person name, no stimulus label — so they are given verbatim.

| # | folder | eye rows | eye span | streams | reading |
|---|---|---|---|---|---|
| 1 | `133534656931370659` | 288,319 | 40.03 min | CL, EyeTracking, HR, HRV, IMU | **candidate re-export of R2-03 INT** — and it carries the IMU stream that R2-03 INT lacks |
| 2 | `133552774150432503` | 27,687 | 3.84 min | CL, EyeTracking, HR, IMU | aborted / setup capture |
| 3 | `133552776575377337` | 591 | 0.08 min | EyeTracking, IMU | aborted / setup capture |
| 4 | `133555315336291479` | 20,009 | 2.78 min | CL, EyeTracking, HR, IMU | aborted / setup capture |

These four contribute 15 of the 27 non-duplicate recorder CSVs; the three `_Test` sessions contribute the
other 12. None is a cohort participant.

## C. INCLUDED — Round 1 (S01–S08)

Every Round 1 HMD file follows the on-disk pattern `<participant>_HMD_<Stimulus>_Crop.<ext>`, so only the
varying part is listed. Each cell reads the **crop window only**; if a crop were ever absent the run fails and
logs rather than substituting the full recording.

| subj | BOR | CLC | INT | rows (B/C/I) | EEG `.mat` | `.fig` unique | survey |
|---|---|---|---|---|---|---|---|
| S01 | `_Crop.csv` | `_Crop.csv` | `_Crop.csv` | 2,178 / 2,179 / 1,964 | 3/3 | 21 | 1 |
| S02 | `_Crop.csv` | `_Crop.csv` | `_Crop.csv` | 2,734 / 2,716 / 2,648 | 3/3 | 21 | 1 |
| S03 | `_Crop.csv` | `_Crop.xlsx` | `_Crop.csv` | 2,115 / 2,403 / 2,047 | 3/3 | 21 of 35 files | 1 |
| S04 | `_Crop.csv` | `_Crop.csv` | `_Crop.csv` | 2,473 / 2,539 / 2,649 | 3/3 | 21 | 1 |
| S05 | `_Crop.csv` | `_Crop.csv` | `_Crop.csv` | 2,371 / 2,202 / 2,439 | 3/3 | 21 | 1 |
| S06 | `_Crop.csv` | `_Crop.csv` | `_Crop.csv` | 2,434 / 84,354 / 95,079 | 3/3 | 21 | 1 |
| S07 | `_Crop.csv` (+dup `_Crop 2`) | `_Crop.csv` | `_Crop.csv` | 2,900 / 2,618 / 2,897 | 3/3 | 14 | 1 |
| S08 | `_Crop.csv` | `_Crop.csv` | `_Crop.csv` | 2,307 / 2,663 / 2,286 | 3/3 | 21 | 1 |

**Round 1 totals: 24 crop windows · 24 EEG `.mat` · 161 unique `.fig` · 8 surveys.**

Cell-level flags carried into `QC-REPORT.md`:

- **S03 CLC** is the only `.xlsx` crop — read via `pd.read_excel(engine='openpyxl')`.
- **S03 `.fig`** set is 35 files containing md5-identical flat and nested duplicates; dedupes to 21.
- **S07 BOR** has a duplicate `_Crop 2`; the plain `_Crop` is used and the duplicate is logged.
- **S07 INT** — the HMD crop parses (2,897 rows, 79.1% eye validity) and all three EEG `.mat` are present.
  What is actually missing is the `.fig` set: 14 files, i.e. 7 signals × 2 stimuli instead of 3. Whether that
  EEG cell is usable is decided empirically at run time, not assumed.
- **S05 BOR** eye validity 21.2% — the sleep episode. Retained, not discarded.
- **S06** is the rate outlier **per cell, not per subject**: BOR 2.98 Hz, CLC 87.9/111.1 Hz,
  INT 99.1/125.0 Hz (mean/median). Rate-sensitive statistics are flagged at cell level.
- **S08** HR dropout: CLC 73.3%, INT 39.2% of rows carry a non-sentinel HR.

## D. INCLUDED — Round 2 (R2-01–R2-04)

Round 2 filenames are date-stamped and carry no name, so they are given verbatim. Subject↔stimulus
attribution comes from the folder, never from a filename.

| subj | stim | eye (32c) | cog (8c) | hr (7c) | imu (16c) | hrv (8c) |
|---|---|---|---|---|---|---|
| R2-01 | BOR | `EyeTracking-2024-03-21-152854.csv`<br>26.1 MB | `CL-2024-03-21-153022.csv`<br>28.7 KB | `HR-2024-03-21-152909.csv`<br>18.4 KB | `IMU-2024-03-21-152857.csv`<br>141.4 MB | `HRV-2024-03-21-153006.csv` |
| R2-01 | CLC | `EyeTracking-2024-03-21-145909.csv`<br>28.5 MB | `CL-2024-03-21-145909.csv`<br>45.1 KB | `HR-2024-03-21-145914.csv`<br>19.5 KB | `IMU-2024-03-21-145909.csv`<br>142.1 MB | `HRV-2024-03-21-145916.csv` |
| R2-01 | INT | `EyeTracking-2024-03-21-142051.csv`<br>29.3 MB | `CL-2024-03-21-142051.csv`<br>47.1 KB | `HR-2024-03-21-142055.csv`<br>20.5 KB | **absent** | `HRV-2024-03-21-142102.csv` |
| R2-02 | BOR | `EyeTracking-2024-03-13-171503.csv`<br>25.1 MB | `CL-2024-03-13-171504.csv`<br>28.7 KB | **absent** | **absent** | **absent** |
| R2-02 | CLC | `EyeTracking-2024-03-13-164010.csv`<br>28.6 MB | `CL-2024-03-13-164011.csv`<br>45.1 KB | `HR-2024-03-13-164011.csv`<br>19.5 KB | `IMU-2024-03-13-164010.csv`<br>140.6 MB | `HRV-2024-03-13-164043.csv` |
| R2-02 | INT | `EyeTracking-2024-03-13-160644.csv`<br>28.9 MB | `CL-2024-03-13-160645.csv`<br>45.1 KB | `HR-2024-03-13-160647.csv`<br>19.5 KB | `IMU-2024-03-13-160644.csv`<br>142.0 MB | `HRV-2024-03-13-160644.csv` |
| R2-03 | BOR | `EyeTracking-2024-03-18-164921.csv`<br>31.0 MB | `CL-2024-03-18-164922.csv`<br>51.2 KB | `HR-2024-03-18-164922.csv`<br>21.5 KB | `IMU-2024-03-18-164921.csv`<br>157.2 MB | `HRV-2024-03-18-165015.csv` |
| R2-03 | CLC | `EyeTracking-2024-03-18-162222.csv`<br>33.7 MB | `CL-2024-03-18-162222.csv`<br>51.2 KB | `HR-2024-03-18-162224.csv`<br>23.6 KB | `IMU-2024-03-18-162222.csv`<br>166.5 MB | `HRV-2024-03-18-162231.csv` |
| R2-03 | INT | `EyeTracking-2024-03-15-140054.csv`<br>62.7 MB | `CL-2024-03-15-140054.csv`<br>102.4 KB | `HR-2024-03-15-140055.csv`<br>43.0 KB | **absent** | `HRV-2024-03-15-140102.csv` |
| R2-04 | BOR | `EyeTracking-2024-03-21-171311.csv`<br>27.7 MB | `CL-2024-03-21-171435.csv`<br>44.0 KB | `HR-2024-03-21-171322.csv`<br>19.5 KB | `IMU-2024-03-21-171311.csv`<br>142.9 MB | `HRV-2024-03-21-171419.csv` |
| R2-04 | CLC | `EyeTracking-2024-03-21-164323.csv`<br>29.4 MB | `CL-2024-03-21-164323.csv`<br>43.0 KB | `HR-2024-03-21-164327.csv`<br>20.5 KB | `IMU-2024-03-21-164323.csv`<br>147.2 MB | `HRV-2024-03-21-164339.csv` |
| R2-04 | INT | `EyeTracking-2024-03-21-161009.csv`<br>28.3 MB | `CL-2024-03-21-161010.csv`<br>45.1 KB | `HR-2024-03-21-161013.csv`<br>19.5 KB | `IMU-2024-03-21-161009.csv`<br>141.8 MB | `HRV-2024-03-21-161025.csv` |

**Round 2 totals: 12 eye · 12 cognitive-load · 11 HR · 9 IMU · 11 HRV · 4 surveys.**

Cell-level flags:

- **R2-01 INT** carries exactly one corrupt timestamp row (`ts/sys = 17`); the other 140,142 rows are a normal
  19.5-min capture at 120.12 Hz. Because `tsec()` subtracts the minimum, `duration_s` reads 1.7×10⁹ s and the
  time axis collapses, so every slope for that cell is fitted against a degenerate axis. Means, medians, sds
  and variances never touch the time axis and are unaffected. Fixed by a robust-span rule, and logged.
- **R2-02 BOR** has no HR and no IMU file, and its HRV file is absent — the sparsest cell in the set.
- **R2-01 BOR** HRV file exists with 11 rows, none valid.
- **R2-01 INT** and **R2-03 INT** have no IMU → IMU coverage is 9/12.
- **R2-03 INT** runs 40.5 min against the cohort's 18–22, and see §J: it was recorded three days early.

## E. Surveys — 12 files, one per subject folder

| round | location | n | use |
|---|---|---|---|
| R1 | Round 1 subject-folder root, `*.txt` | 8 | **used** — filename is person-named and is never read into any output |
| R2 | Round 2 subject folder, `*.txt` | 4 | **used** — attribution from the folder |
| R2 | Round 2 round-root `*.txt` | 8 files / 7 distinct md5 | **not used** — superset, see §I |

## F. Present but deliberately NOT used

| what | where | count | why |
|---|---|---|---|
| Round 1 full-window HMD CSVs | R1 subject `HMD/` | 24 | crop-only rule — the fallback path must never execute |
| Round 1 duplicate `_Crop 2` | S07 BOR | 1 | plain `_Crop` preferred |
| ETD curated eye CSVs | `ETD/` | 12 | cross-check only; `Subjects/` preferred so attribution comes from the folder |
| recorder CSVs duplicating `Subjects/` | `LOGS/` | 43 | already organised |
| recorder CSVs not duplicating | `LOGS/` | 27 | 12 `_Test` + 15 undated non-cohort (§A, §B) |
| zero-byte CSVs | `LOGS/` | 4 | application artefacts |
| session video | R1 subject `OBS/` + R2 | 0 + 10 | author-ruled out of scope this pass |
| `.ipynb` analysis notebook | Round 2 root | 1 | method documentation, not input |
| VR Data Recorder binaries | `VR Data Recorder/` | ~241 | application install |

## G. Counts to expect in `RUN-MANIFEST.json`

```
Round 1   24 crop windows        (8 subjects x 3 stimuli, 0 fallback)
          24 EEG .mat
         161 unique .fig         (S07 contributes 14, cohort norm 21)
           8 surveys
Round 2   12 eye  |  12 cog  |  11 hr  |  9 imu  |  11 hrv
           4 surveys
TOTAL     12 subjects x 3 stimuli = 36 subject-stimulus cells
```

## H. Two corrections to the existing recon note

1. **Round 2 does have HRV.** `boredom-round2-recon-2026-07-29.md` states there is no HRV stream and that HRV
   stays at N=8. Eleven `HRV-*.csv` files exist under Round 2 `Subjects/`, header
   `ts/hw,ts/sys,ts/omni,sensor/dev/id,sensor/dev/sub,sensor/loc,sdnn,rmssd`, and **10 of 12 cells carry
   usable rows**. The catch is density: ~10 rows per cell against Round 1's ~2,400, and the quantity differs —
   Round 1 records a single vendor HRV index, Round 2 records `sdnn` and `rmssd` separately. Reported
   within-round with `poolable: false` on both grounds.
2. **An 8-column collision exists in the Round 2 parser.** `ch_hmd_r2.collect()` identifies streams by column
   count alone, and HRV files are 8 columns exactly like cognitive-load files. Today it is harmless: the rule
   is largest-file-wins and every `HRV-*.csv` is ~0 MB against a real `CL-*.csv` — verified, all 12 cells
   selected a `CL-` file. But that is order-of-magnitude luck rather than logic, and in the 02-12-24 `_Test`
   session the HRV file *is* classified as cognitive load. The new tree matches on filename prefix **and**
   header, and asserts the selected column set before use.

## I. The Round 2 survey-identity question — resolved

The recon note recorded eight root-level `.txt` resolving to six distinct people, called the match unreliable,
and promoted the question to load-bearing because the keystone needs self-report on both sides. It closes:

- **8 files at the Round 2 root, 7 distinct by md5.**
- **One is a blank instrument template** — not a participant at all. This is what made the count look odd.
- **1 exact-duplicate pair** among the rest.
- That leaves **6 distinct participant surveys** — precisely the "six distinct people"
  the note could not account for.
- **2 of the 4 in-folder Round 2 surveys have an md5 twin at the root** (R2-01, R2-02); the other two exist only inside their subject folder.

**Consequence:** the four in-folder surveys are authoritative and complete, so self-report exists for all 12
subjects and **the keystone is testable at N=12**. The root-level set is a superset containing non-cohort
material and is not read. The note's stated blocker — "there is no verified self-report for the Round 2
subjects" — no longer holds.

## J. Viewing order, derived from timestamps

Round 1 states the order in its stimulus headings for one subject only. The wall-clock timestamps in the HMD
crops reproduce that stated order exactly (1/1), which validates the method; order is therefore derived from
timestamps for all 12 subjects rather than left at "where noted".

| subj | round | order | note |
|---|---|---|---|
| S01 | 1 | CLC → BOR → INT | the one subject with a stated order; timestamps agree |
| S02–S04, S06–S08 | 1 | INT → CLC → BOR | |
| S05 | 1 | CLC → BOR → INT | |
| R2-01 | 2 | INT → CLC → BOR | single sitting, 38 / 30 min gaps |
| R2-02 | 2 | INT → CLC → BOR | single sitting, 33 / 35 min gaps |
| R2-03 | 2 | INT → CLC → BOR | **INT recorded 3.10 days earlier**; CLC→BOR gap 27 min |
| R2-04 | 2 | INT → CLC → BOR | single sitting, 33 / 30 min gaps |

**R2-03 needs flagging in the write-up.** Its *Interesting* episode is not only the 40.5-minute duration
outlier already noted — it was recorded **three days before** that subject's other two episodes. It therefore
carries no within-session carryover from them, and its fatigue-prior item refers to a different day. Any order
or depletion analysis must treat R2-03 INT as a separate sitting.

