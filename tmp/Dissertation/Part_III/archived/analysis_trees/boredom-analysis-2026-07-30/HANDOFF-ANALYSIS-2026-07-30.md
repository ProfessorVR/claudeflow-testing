# HANDOFF — Boredom Experiment full analysis (N=12)

**Written 2026-07-30, end of Phase 7. Phases 0–7 COMPLETE and verified. The analysis is finished.**
Everything below is verified against the live trees, not remembered.

---

## 1. The goal

Produce the complete analysis, statistics and figure suite for the empirical chapter of the
dissertation: 12 participants (Round 1 `S01`–`S08`, Round 2 `R2-01`–`R2-04`), sensor recordings across
three 17-minute video conditions (Boring / Clinical / Interesting), plus a 7-item self-report
instrument per episode. **Analysis, statistics and figures only — no chapter prose.**

The authoritative specification is:

```
plans/boredom-eyetracking-full-analysis-execution-2026-07-30.md
```

Where this handoff and that document disagree, **the specification wins**.

---

## 2. Current state — one line

**All seven phases are complete.** The four locked checks pass at two independent gates on every run,
23 tables and 65 figures are written, all 7 reproducibility artefacts are generated from the run, and
**two consecutive full runs produce 300 of 301 artefacts byte-identical** — the sole exception being
`RUN-MANIFEST.json`, whose only differing line is its UTC timestamp.

Nothing is outstanding in the code. What remains is author judgment (§11) and the chapter itself.

---

## 3. Where everything lives

| what | path |
|---|---|
| **Analysis tree (this work)** | `tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/` |
| Entry point | `analysis/run.py` |
| Output tables (23 CSVs) | `out/` |
| Intermediate canonical outputs (11) | `out/_raw/` |
| **Figures (65 × PDF+PNG+CSV+caption)** | `figures/` — plus `figures/INDEX.md` |
| **Reproducibility artefacts (7)** | tree root — `RUN-MANIFEST.json`, `METHODS.md`, `EXCLUSIONS.log`, `QC-REPORT.md`, `FINDINGS.md`, `SOURCES.md`, `RECONCILIATION.md` |
| Backups of every file touched | `.backups/` (timestamped) |
| **Methodology of record — DO NOT EDIT** | `scripts/boredom-o9/` |
| Round 2 parser (extendable, not edited) | `tmp/Dissertation/Part_III/boredom-o9-processing/ch_hmd_r2.py` |
| Prior findings | `tmp/Dissertation/Part_III/reanalysis/boredom-o9-physiological-findings.md` |
| Round 2 recon | `tmp/Dissertation/Part_III/reanalysis/boredom-round2-recon-2026-07-29.md` |
| Self-report record | `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` |
| Section-level resume doc | `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-ANALYSIS-AND-SECTION-2026-07-30.md` |
| Raw data, Round 1 | `/mnt/d/PhD/Dissertation/Boredom Experiment/Subjects/` |
| Raw data, Round 2 | `/mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2/Subjects/` |
| **EXCLUDED ENTIRELY (author ruling)** | `…/Boredom Experiment Round 2/VR Data Recorder/` |
| **EXCLUDED (author ruling)** | all `.mkv` / OBS video, incl. `…/Videos/Eye Tracking Overlay Videos` |

**Run it with:**

```bash
cd tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/analysis
/home/dalton/.venv/bin/python run.py              # full run: tables + figures + artefacts
/home/dalton/.venv/bin/python run.py --no-figures # tables only
```

A full run takes **about 80 seconds**, including md5 of all 104 input files (1.93 GB) and all 65
figures. To force the timelines to rebuild from raw data, delete `out/_raw/timeline-*.csv`; they
otherwise rebuild automatically whenever their source fingerprint changes.

---

## 4. Module state — 15 modules, all complete, no stubs

| module | what it does |
|---|---|
| `config.py` | every constant that affects a number; all 8 author decisions with rationale; timeline + figure parameters |
| `adapters.py` | 8 documented wrappers over the methodology of record; nothing copied, nothing edited |
| `journal.py` | exclusions, QC, coercions, deterministic CSV writing, **PII guard** |
| `stats.py` | Friedman, Wilcoxon, Holm, rank-biserial, within-subject z, pooling |
| `gate.py` | the four locked checks, run twice per execution |
| `r1.py` | Round 1 features, both rate variants, closure episodes |
| `r2.py` | Round 2 features, timestamp repair, blinks, IMU, non-wear trim |
| `survey.py` | defensive 7-item parser with per-item confidence |
| `crossref.py` | keystone, moderation, replication, self-report tests |
| `eeg.py` | band power, retention, artifact ratio, full negatives |
| `run.py` | single deterministic entry point |
| **`series.py`** | **NEW (Phase 6)** — rebuilds the per-sample timelines the summary tables discard |
| **`sensitivity.py`** | **NEW (Phase 6)** — keystone under all 7 composite definitions |
| **`figures.py`** | **IMPLEMENTED (Phase 6)** — the 65-figure suite |
| **`report.py`** | **IMPLEMENTED (Phase 7)** — the 7 reproducibility artefacts |

`run.py` was **not modified** to accommodate either phase; it already checked `figures.IMPLEMENTED`
and the return value of `report.write_all()`. `crossref.py` was **not modified** either — see §7.

---

## 5. The four locked checks — the gate

Checked automatically at **Gate 1** (canonical code path) and **Gate 2** (this tree's own extractors);
`run.py` aborts on failure.

| check | n | direction | Friedman | Wilcoxon | rb |
|---|---|---|---|---|---|
| Round 1 pupil dilation | 8 | 8/8 Boring < Clinical | 0.0302 | 0.0078 | −1.00 |
| Round 1 eye-closure | 8 | 7/8 Boring lowest | 0.0076 | 0.0156 | −0.944 |
| Pooled pupil | 12 | 10/12 | 0.0458 | 0.0093 | −0.821 |
| Pooled eye-closure | 12 | 11/12 | 0.0004 | 0.0010 | −0.974 |

**All four have passed on every run.** One detail is load-bearing: Round 1's openness proxy
(`pct_valid_eye`, 0–100) **must** be rescaled by 1/100 onto Round 2's 0–1 fraction before any pooled
signed-rank test. Rescaled reproduces rb=−0.974; unscaled gives rb=−0.872, p=0.0049. Lives in
`config.R1_OPENNESS_SCALE`.

**The five secondary values in spec §4 also reproduce exactly.** One needs its variant named to make
sense: Round 1 gaze variance is **p=0.6065 in the `asis` variant** (the spec's figure) and **p=0.3247
in `unified`** (the harmonised figure). Both are correct; they are different variants, not a
discrepancy. Note the direction convention differs too — the tables count Boring *lower* (4/8 asis,
3/8 unified), earlier notes counted Boring *higher* (4/8, 5/8). Same fact from the other side.

---

## 6. Author decisions, all applied

| # | decision | where implemented |
|---|---|---|
| D1 | S06 rate mismatch — compute **both** unified and as-is | `config.RATE_VARIANTS`, `r1.extract()` |
| D2 | S07's Interesting episode **counts** as valid data | no exclusion; confirmed 24/24 EEG cells parse |
| D3 | **HRV excluded, both rounds**; HR retained | `config.EXCLUDE_HRV`, logged per cell — **CONFIRMED 2026-07-30, see §11** |
| D4 | R2-01's bad timestamp row dropped, clock recomputed | `adapters.r2_time_seconds()` |
| D5 | Blink ≤ 500 ms per VanderWerf et al. 2003 | `config.BLINK_MAX_MS` |
| D6 | EEG — report everything, no retention floor | `eeg.analyse()` |
| D7 | Single interpreter `/home/dalton/.venv/bin/python` | `config.INTERPRETER` |
| D8 | Output at `boredom-analysis-2026-07-30/` | `config.OUT` |
| — | "Halfway" survey answer read as 8.5 min | `config.HALFWAY_MIN`, logged as author-approved |
| — | Ignore all files under `VR Data Recorder/` | `config.EXCLUDED_TREES` |
| — | Ignore all video, incl. eye-tracking overlays | not read by any module; noted in `RECONCILIATION.md` §3 |

---

## 7. Findings

**Confirmed and stable**

- **Pupil and eye openness are the two surfaces that carry the result.** 9 pairwise contrasts survive
  Holm across the entire analysis (of 87 computed), and every one of them is pupil or openness.
- **Openness is the strongest effect in the dataset.** Pooled N=12: Boring below Interesting in **12/12**
  subjects (rb=−1.00, Holm p=0.0015) and below Clinical in 11/12 (rb=−0.974, Holm p=0.0020).
- **EEG is not significant anywhere.** 0 of 5 surfaces reach Friedman p<0.05; 0 of 15 pairwise contrasts
  survive Holm; keystone concordance is 4/8, exactly chance. Retention averages 62.3% (range
  36.3–74.4%, 3 of 24 cells below 50%). This is the evidence for the "dropped because too noisy"
  ruling, and it is reported rather than asserted.
- **S05's sleep event is directly visible** as a single continuous **449.2-second** eye closure beginning
  245.4 s into the Boring episode. It is unmistakable in three figures: the closure heatmap, S05's
  time-series card (openness floors, pupil vanishes, HR sinks to ~50 bpm and rebounds at wake), and the
  QC report's 21.2% validity flag.
- **Prior exposure resolves 4/12** and the strata remain near-indistinguishable on clinical — boredom
  6.00 vs 5.12, engaged composite 0.286 vs 0.277. The exposure objection is still answered at N=12.
- **The openness↔validity proxy check is now computed, not asserted.** Within Round 2, where both
  measures exist, the validity-flag proxy and the vendor's continuous openness correlate at
  **Pearson r=0.9979** across the 12 cells, reproducing the r=0.998 the specification cites. This is
  what licenses Round 1's proxy, and it is now regenerated on every run.

**Instrument findings**

- **Round 2 openness is BINARY**, not continuous — {0, 1} only across 3,416,362 per-eye samples. The
  threshold is therefore irrelevant and the blink/extended-closure split rests **entirely** on the
  VanderWerf duration ceiling.
- **A headset on/off artefact in Round 2.** Round 2 has no crop export, so recordings include non-wear
  time. Trimmed columns added; **conclusions identical either way**, and the artefact is plainly
  visible as black bars at both edges of every Round 2 row in the closure heatmap.
- **S06's harmonisation flips its direction on gaze variance** (see §5). The within-Round-1 decimation
  factors land inside the 0.65–0.84 band measured across rounds, independently confirming the
  no-pooling rule.
- **Blink rate is not recoverable in Round 1.** Median sampling interval ~334 ms = the mean spontaneous
  blink duration. Blink rate is a Round 2 measure only.
- **Round 2 does have HRV**, contrary to the recon note — 11 files, 10 of 12 cells usable. Excluded
  anyway by author ruling, but the record needed correcting.
- **A divergence case in Round 2**: R2-02's Interesting episode carries the S07 signature (boredom 7
  *and* engagement 6). Full within-instrument divergent set: S05, S07 (×2), R2-02.

---

## 8. The reverse case — read this before writing anything

The specification asks whether the zero-reverse asymmetry holds at N=12. **It does not.** The clinical
decomposition is:

| category | n | subjects |
|---|---|---|
| divergent (physiology engaged, self-report bored) | 5/12 | S02, S04, S07, S08, R2-02 |
| concordant-engaged | 3/12 | S01, S03, R2-04 |
| concordant-bored | 3/12 | S05, S06, R2-01 |
| **reverse** | **1/12** | **R2-03** |

Three things must travel with that number. **All three are now computed by the pipeline** —
`sensitivity.py`, `out/keystone-composite-sensitivity.csv`, and the right-hand panel of
`figures/cross-cutting/keystone-decomposition` — rather than recalled from a previous session:

1. **It is sensitive to how the engaged composite is built.** Reverse cases number **0** under openness
   alone, **1** under the baseline (pupil + cognitive load + openness), **2** under pupil + cognitive
   load, and **3** under pupil alone. R2-03 is reverse under **6 of 7** definitions.
2. **It survives the non-wear trim** (composite −0.510 untrimmed, −0.451 trimmed).
3. **"Reverse" is a within-subject relative statement, not an absolute one.** R2-03 reported boredom
   3/1/2 across the three videos and engagement 8 on clinical — they never reported being bored by
   anything, and never became bored on any stimulus (`minutes until bored` blank on all three by
   design, not by missingness). Their clinical episode is simply their own relative physiological
   minimum. That is materially different from "physiologically bored while reporting engagement", and
   the honest form of the finding says so without making the case disappear.

`sensitivity.py` asserts on every run that its baseline subset reproduces `crossref.keystone()`
exactly. If it ever drifts, the run fails rather than quietly reporting a second, different answer.

---

## 9. Verification status

| check | result |
|---|---|
| Four locked checks, Gate 1 + Gate 2 | **PASS**, every run |
| Five secondary spec §4 values | **all reproduce** (see §5 on the gaze-variance variant) |
| Two consecutive full runs | **300 of 301 artefacts byte-identical** |
| The one difference | `RUN-MANIFEST.json`, sole differing line `run_utc` |
| `git status --porcelain scripts/boredom-o9/` | **empty** |
| PII sweep across every text output | **clean** |
| Timeline validation vs wide tables | r ≈ 0.9999 both channels, both rounds |

Byte-identity covers every CSV **and every PDF and PNG**, which is stronger than the specification
requires (it asks only for CSVs). Figure metadata is pinned so no creation timestamp is embedded.

---

## 10. Standing constraints — non-negotiable

- **PII.** `S01`–`S08` / `R2-01`–`R2-04` only. No participant name in any output, log, figure, caption
  or filename. The crosswalk is never persisted; it is derived at runtime from sorted folder order via
  `common.subject_map()`. `journal.emit_guard()` is a **backstop, not the mechanism** — redact by
  construction. The manifest identifies input files by md5 under a redacted label, never by path.
- **Never edit `scripts/boredom-o9/`.** Wrap, don't edit; record every wrapper. Currently clean; all 8
  wrappers are printed verbatim in `METHODS.md` §9.
- **Never pool a rate-dependent feature across rounds.** Every pooled statistic carries a `poolable`
  flag and a one-line reason. Figures draw Round 1 and Round 2 as separate bands and markers.
- **Crop windows only** for Round 1. Enforced before the run in `adapters.run_ch_hmd()`.
- **Nothing is omitted for being non-significant.** The forest plot carries all 87 contrasts.
- **No chapter prose. No commits. No video processing.** Back up before touching any existing file, and
  say so first.
- Label every n<6 result **descriptive**; at n=4 the Wilcoxon floor is p=0.125, so perfect separation is
  the strongest obtainable result and must be stated as such.

---

## 11. Open — author judgment, not code

**HRV scope — RESOLVED 2026-07-30.** Ruling: **HRV is excluded, in both rounds; heart rate is
retained** as a reported surface. Applied as `config.EXCLUDE_HRV = True`, logged per cell with its
reason, and fully recoverable by flipping that flag. Round 1 HRV sat at Friedman p=0.6065 before
exclusion, and `METHODS.md` states that so the cost of the ruling is visible.

**Still open — the two ASEE works-cited entries.** `SOURCES.md` carries them by lead author only. The
full author lists, first names and paper titles need to come from your own records; only the paper
numbers and their methodological roles were verified here.

> The omission is deliberate. **Several co-author surnames are also participant surnames** — the studies
> were run within the lab and members of the author team appear in the participant pool. The PII guard
> caught this when the full lists were first written.
>
> Nothing about citing the papers is improper: those author lists are already published and public, and
> the crosswalk is not recoverable from them. But a works-cited entry sits a few pages from a
> per-subject results matrix, and the two together narrow the pool a reader is choosing from. This is a
> narrowing risk, not an identification.
>
> **Recommendation:** cite both papers in full and normally in the works cited, which is required and
> correct, and keep the per-subject matrix label-keyed as it already is. Take no further action. The
> decision is yours, and it is better made now than noticed at review.

**Available but unused — the Round 1 eye-tracking overlay videos**
(`…/Boredom Experiment/Videos/Eye Tracking Overlay Videos`). Out of scope by author ruling and not
touched. If that ruling is ever revisited, their one real use is visual corroboration that S05's 449 s
event is eyes *shut* rather than tracker loss, and likewise for S08's Boring dropout — currently
carried indirectly by the `-1` sentinel and the validity figures. That would be corroboration of an
already-quantified result, not new evidence.

---

## 12. Sources

- **VanderWerf, Frans, Petra Brassinga, Dirk Reits, Majid Aramideh, and Bram Ongerboer de Visser.**
  "Eyelid Movements: Behavioral Studies of Blinking in Humans Under Different Stimulus Conditions."
  *Journal of Neurophysiology*, vol. 89, no. 5, 2003, pp. 2784–96. doi:10.1152/jn.00557.2002.
  — Source of the 334 ± 67 ms spontaneous blink duration behind `config.BLINK_MAX_MS`. Quoted verbatim
  from the full text: "The total duration of spontaneous blinks was 334 ± 67 ms, the down phase
  duration was 92 ± 17 ms, and the up phase duration lasted 242 ± 55 ms." Those blinks were recorded
  **while subjects watched a video**, which matches this paradigm closely.
- **King et al.** ASEE 2023, paper **#37129**. — F3/F4/P3/P4 montage and the DMN alpha+theta boredom
  marker, implemented by `ch_eeg.py`.
- **King et al.** ASEE 2024, paper **#44685**. — The gaze-deviation-variance feature implemented by
  `ch_hmd.py`.

Full entries and the co-author/participant collision note live in `SOURCES.md`. See §11.

---

## 13. Where to start reading the results

1. `FINDINGS.md` — every result with n, test, statistic, effect size and poolability; negatives included.
2. `figures/cross-cutting/forest-effect-sizes` — the one figure showing which surfaces carry the result.
3. `figures/cross-cutting/keystone-decomposition` — the N=12 decomposition and the reverse-case sensitivity.
4. `figures/cross-cutting/eye-closure-heatmap` — S05's sleep event at a glance.
5. `figures/cross-cutting/eeg-justification` — the figure that earns the "dropped because too noisy" sentence.
6. `METHODS.md` — the text the methods section is built from.
