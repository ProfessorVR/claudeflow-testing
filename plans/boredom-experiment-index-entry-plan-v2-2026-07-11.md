# Boredom Experiment → corpus/index entry — EXECUTION-READY plan v2 (2026-07-11)

**Status:** EXECUTION-READY. Supersedes `boredom-experiment-index-entry-plan-2026-07-10.md` (v1, kept for
history). All blocking decisions are resolved; the HMD column schema is confirmed by the author and verified
against the raw bytes; the 24-cell file table is fully enumerated. Two remaining items (O-10 consent scope,
O-14 sample-framing) are **non-blocking flags** carried into the writing phase, not gates on the build.
Awaiting user sign-off to execute Phases 2→6 (GATE G0 already largely satisfied — see §9).

**Goal:** turn the **HMD eye-tracking layer** of the Boredom Experiment dataset (`/mnt/d/PhD/Dissertation/
Boredom Experiment/`, ~92 GB) into a proper `corpus/index/` entry. Survey/self-report layer is already done
(§2); EEG/OBS remain out of scope (§8). This plan adds only the eye-tracking (HMD CSV) channel.

---

## 0. What changed from v1 (the review diff)

1. **O-11 resolved → standalone entry** (Pattern A), VLE keeps a bridge-pointer. (Was: recommendation only.)
2. **HMD column schema LOCKED** (§3.3) — author-confirmed and byte-verified at `KitFeen_HMD_Boredom_Crop.csv`
   line 380. v1's "inferred, NOT confirmed" column guesses are replaced with ground truth. Field D (was
   "unclear") = **milliseconds**, resolved from the timestamp cadence.
3. **P1/P2 papers are NOT missing.** v1 said "not yet confirmed present in corpus/index." They are present
   **and already digested** at the FCM entry (`bridge-sources/king-salvo-eyetracking-digest.md`,
   `king-salvo-physiological-digest.md`) with raw text at `tmp/Dissertation/Part_III/style/pubs/p2-eyetrack-*.txt`.
   O-12 therefore never required an external hunt — it was answerable from in-tree material + the author.
4. **The 24-cell subject×condition→file table is fully enumerated** (§3.2) — Phase 2's file-discovery is
   effectively pre-done, including every exception and filename typo.
5. **New finding: CSV cadence is ~3 Hz, not the paper's 120 Hz** (§3.4). Forces two rules: (a) exact
   replication of P2's 120 Hz gaze-variance is impossible from these CSVs — only a 3 Hz approximation of the
   directional contrast; (b) compute pupil/load/gaze aggregates **over eyes-open rows only**.
6. **O-13 override:** S08 (Rishi)/Clinical → **use the uncropped raw file**, flagged `UNCROPPED` (v1 default
   was "exclude"; author chose to keep it).
7. **O-15 resolved:** "(Med)" = **medical student** (3/8). Adds an optional subgroup read on the *clinical*
   (spinal-surgery) video (possible desensitization).
8. **Worked proof-of-pipeline added** (§7): S05's self-reported "fell asleep on the boring video" is now
   corroborated across gaze + pupil + cardiac channels (77% eyes-closed on boring vs ~12–14% on the other
   two). This is the flagship cross-modal exemplar and the template for `bor-03`.

---

## 1. Grounding — how corpus/index entries are built here (unchanged from v1, condensed)

Three structural patterns are in use; this entry uses **Pattern A — book/synthesis** (`units/` +
`_synthesis/manifest.json` + `_synthesis/<x>-ontology.md`, optional `bridge-sources/`), the same as VLE, FCM,
Wendt, Burke, Calleja. Universal rules:

- **Raw data never enters the tracked tree.** It stays on the `/mnt/d` mount; only anonymized/derived
  digests and aggregates are committed. `vle-02` models this (a bolded `**Location:**` line with path+size).
- **Every claim carries a provenance tag:** `FE` (published) · `FE-U` (unpublished raw — this dataset's
  register) · `P`/`anticipatory-application` (interpretive) · `FAITHFUL-<AUTHOR>` (close paraphrase).
- **Subjects are anonymized to S01–S08** by sorted directory order; the name↔code mapping is **never written
  to any tracked file** (§3.1).
- Missing/unconfirmed source → `******` (or `****** UNVERIFIED:`).
- Material another entry canonically owns → **bridge-pointer**, never a duplicate digest (the P1/P2/P3 paper
  digests live at FCM; we point, never re-digest — see `.../VLE/bridge-sources/paper-digest-pointers.md`).
- Unit files: `<prefix>-NN-<slug>.md`, zero-padded, `-00-` = overview; optional sibling `.json` (the norm in
  FCM). `manifest.json` fields: `entry`, `units`, `sources`, `provenance_discipline`, `analysis_home`,
  `registration`, `prefix`, `kind`, `status`.
- **Compiler wiring (verified):** add one dict entry to `TEXT_DIRS` near the top of
  `scripts/compile-corpus-index.py` (`{"label": …, "ontology_format": "header", "analysis_subdir":
  "_synthesis"}`), then re-run `python3 scripts/compile-corpus-index.py`. The parser reads the
  `## 3A. Canonical Node List` section of the ontology file in header format (`#### N. Name` + `- **key**:
  value` bullets).

## 2. What already exists (build on top, do not re-derive)

| Artifact | Path | Contents |
|---|---|---|
| VLE stub unit | `corpus/index/Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md` | Survey overview + aggregates + 4 load-bearing cases. Becomes a bridge-pointer under O-11 (§6 Phase 6). |
| Dataset audit | `tmp/Dissertation/Part_III/boredom-dataset/00-audit.md` | Per-subject file/size/dir/ext counts; S-code mapping source. |
| Survey digests | `tmp/Dissertation/Part_III/boredom-dataset/subject-survey-digests.md` | Anonymized per-subject survey → digest. |
| Reanalysis brief | `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` | **Survey layer, done.** 7-item table (N=8, 24 episodes), three-form FCM re-read, provenance-tagged. |
| Paper digests (FCM entry) | `corpus/index/Heidegger - FCM/bridge-sources/king-salvo-{eyetracking,physiological,phenomenological}-digest.md` | P1/P2/P3 already digested — **cite these, never re-digest.** P2 digest documents the Omnicept capture (120 Hz, per-eye pupil X/Y + dilation, HR/HRV). |
| Raw paper text | `tmp/Dissertation/Part_III/style/pubs/p2-eyetrack-clean.txt` (+ p1, p3) | Methods sections corroborating the column schema. |
| Governing plan | `plans/part-iii-reanalysis-and-draft-plan-2026-07-06.md` | Source of O-9/O-10. |

**Key implication:** survey layer analyzed + drafted; this plan is narrowly the **eye-tracking (HMD CSV)
layer**, integrated with what exists — not a survey re-analysis.

## 3. Locked data facts (verified against the raw mount)

### 3.1 Subject mapping (S01–S08 by sorted directory order — verified stable)
Sorted `Subjects/` order reproduces the audit's `(Med)` markers exactly (S02/S03/S08), confirming the mapping
is stable and reusable. **Never commit this table to the tracked tree; derive it at runtime from the sorted
directory listing.**

| Code | (internal only) | (Med)? |
|---|---|---|
| S01 | Andrew Do | — |
| S02 | Andrew Kinoshita | ✓ |
| S03 | Anthony Wu | ✓ |
| S04 | Crystal Lai | — |
| S05 | Kit Feen | — |
| S06 | Milan Das | — |
| S07 | Quangminh Tang | — |
| S08 | Rishi Vermani | ✓ |

### 3.2 The 24-cell file table (LOCKED — the authoritative source for the eye-tracking layer)
Conditions normalize to **BOR / CLC / INT** regardless of raw-filename spelling (`Boredom` vs `Boring` is the
same condition). Paths are under `Subjects/<name>/HMD/`. The extraction script builds this map at runtime by
S-code; the names below are for this plan only.

| Cell | File (basename) | Flag |
|---|---|---|
| S01·BOR | `AndrewDo_HMD_Boredom_Crop.csv` | clean |
| S01·CLC | `AndrewDo_HMD_Clinical_Crop.csv` | clean |
| S01·INT | `AndrewDo_HMD_Interesting_Crop.csv` | clean |
| S02·BOR | `AndrewKinoshita_HMD_Boring_Crop.csv` | clean |
| S02·CLC | `AndrewKinoshita_HMD_Clinical_Crop.csv` | clean |
| S02·INT | `AndrewKinoshita_HMD_Interesting_Crop.csv` | clean |
| S03·BOR | `AnthonyWu_HMD_Boring_Crop.csv` | clean |
| **S03·CLC** | `AnthonyWu_HMD_Clinical (Cropped).xlsx` | **`ALT-FORMAT`** — xlsx, read via pandas/openpyxl |
| S03·INT | `AnthonyWu_HMD_Interesting_Crop.csv` | clean |
| S04·BOR | `CrystalLai_HMD_Boring_Crop.csv` | clean |
| S04·CLC | `CrystalLai_HMD_Clinical_Crop.csv` | clean |
| S04·INT | `CrystalLai_HMD_Interesting_Crop.csv` | clean |
| S05·BOR | `KitFeen_HMD_Boredom_Crop.csv` | clean (note: no space in "KitFeen" here) |
| S05·CLC | `Kit Feen_HMD_Clinical_Crop.csv` | clean (space in "Kit Feen") |
| S05·INT | `Kit Feen_HMD_Interesting_Crop.csv` | clean |
| **S06·CLC** | `MilanBas_HMD_Clinical_Crop.csv` | **`TYPO`** ("Bas"→Das) — presence fine, don't glob on "Das" |
| S06·BOR | `MilanDas_HMD_Boredom_Crop.csv` | clean |
| S06·INT | `MilanDas_HMD_Interesting_Crop.csv` | clean |
| **S07·BOR** | `Quangimnh Tang_HMD_Boring_Crop 2.csv` | **`CROP2`** — use Crop **2** (2023-06-19, final), not Crop; "Quangimnh" typo |
| S07·CLC | `Quangminh Tang_HMD_Clinical_Crop.csv` | clean |
| S07·INT | `Quangminh Tang_HMD_Interesting_Crop.csv` | clean |
| S08·BOR | `RishiVermani_HMD_Boring_Crop.csv` | clean |
| **S08·CLC** | `RishiVermani_HMD_Clinical.csv` | **`UNCROPPED`** (O-13) — no crop exists; use raw, caveat: may include experiment start/end noise |
| S08·INT | `RishiVermani_HMD_Interesting_Crop.csv` | clean |

21 clean cropped CSVs + 3 exceptions (`ALT-FORMAT`, `CROP2`, `UNCROPPED`). No silent gaps; all 24 cells accounted for.

### 3.3 HMD CSV schema (LOCKED — author-confirmed, byte-verified)
No header row; 12 comma-separated fields (field 5 is space-delimited internally, so comma-splitting yields
exactly 12). Example (S01·BOR): `22,8,15,756,X=0.995 Y=0.038 Z=-0.092,3.848587,3.894028,1,1,0.306231,73,117.302933`

| Col | Field | Meaning | Notes |
|---|---|---|---|
| A | 1 | timestamp — hour | |
| B | 2 | timestamp — minute | |
| C | 3 | timestamp — second | |
| **D** | 4 | timestamp — **milliseconds** (0–999) | resolved from cadence; A:B:C.D is the clock |
| E | 5 | gaze direction vector `X= Y= Z=`; **Z = combined gaze** | all `-1` (e.g. `X=-1 Y=1 Z=-1`) = **eyes closed** sentinel |
| F | 6 | **pupil dilation — LEFT** (mm, ~3.8) | `-1` when eyes closed |
| G | 7 | **pupil dilation — RIGHT** (mm) | `-1` when eyes closed |
| H | 8 | **left eye** open(1)/closed(0) | |
| I | 9 | **right eye** open(1)/closed(0) | |
| J | 10 | **estimated cognitive load** (0–1) | Omnicept index; **unreliable when eyes closed** (still emits a held value) |
| K | 11 | **heart rate** (bpm) | range-confirmed (~59–91 observed) |
| L | 12 | **HRV** (likely, ms) | soft-confirmed; caveat as "likely HRV" in the unit |

### 3.4 Cadence + the eyes-open filtering rule (methodological, forced by §3.3)
- **Sampling cadence ≈ 2.99 Hz** in the committed CSVs (timestamps advance ~333 ms/row), **not** the paper's
  120 Hz. The 120 Hz stream is not in these CSVs (presumably the `.mat`, out of scope). **Consequence:**
  P2's exact 120 Hz gaze-variance statistic cannot be reproduced; only a 3 Hz approximation of the
  *directional* contrast (BOR high-variance vs CLC/INT low-variance) is testable. State this caveat inline in
  `bor-02`.
- **Eyes-open filtering rule:** compute pupil dilation (F,G), cognitive load (J), and gaze-deviation variance
  (from E) **only over rows where H=1 & I=1**. Report **eyes-closed proportion** (H=0 & I=0, equivalently
  F=−1) separately as its own signal — it is the withdrawal/sleep datum, not noise (see §7). HR (K) and HRV
  (L) remain valid during eyes-closed and are computed over all rows.

## 4. Architecture — O-11 resolved: standalone entry (Pattern A)

```
corpus/index/Boredom Experiment (VR Attention Study)/
├── units/
│   ├── bor-00-corpus-overview.md              # absorbs vle-02's overview content
│   ├── bor-01-survey-self-report.md           # migrated from vle-02 + reanalysis brief §1 (reorg, not new analysis)
│   ├── bor-02-eye-tracking-hmd-dataset.md      # NEW — this plan's target (schema §3.3, metrics §6 Phase 3)
│   ├── bor-02-eye-tracking-hmd-dataset.json    # NEW — per-cell file table, row counts, quality flags, extraction audit
│   └── bor-03-exemplar-cases.md                # NEW — load-bearing cases across survey+gaze; flagship = S05 (§7)
├── _synthesis/
│   ├── manifest.json
│   └── boredom-ontology.md                     # `## 3A. Canonical Node List` (header format) — required by compiler
└── bridge-sources/
    └── fcm-paper-digest-pointers.md            # points at FCM's P1/P2/P3 digests + the keystone bridge; no re-digest
```

Deferred future units (§8): `bor-04-eeg-dataset.md`, `bor-05-obs-video-dataset.md`.

## 5. Controlled vocabulary + data-quality flags

- **Provenance:** `FE-U` for anything read off the HMD CSVs (unpublished raw signal); `P` for any
  theory-linking claim; `FE` only when citing the published P1/P2 (via the FCM bridge digests). Carry the
  reanalysis brief's register exactly.
- **Subject codes:** reuse the existing S01–S08 mapping (§3.1) — do **not** re-derive; the survey layer
  already cross-references cases by S-code (e.g. "S07 double-high," "S05 sleep-collapse"), so consistency is
  required for cross-linking.
- **Condition labels:** normalize to `BOR`/`CLC`/`INT`; note the raw `Boredom`/`Boring` variance so the
  raw↔index mapping stays traceable.
- **Data-quality flags:** `EYES-CLOSED` (H=0&I=0 / pupil=−1 rows; report as % per cell) · `ALT-FORMAT`
  (S03·CLC xlsx) · `UNCROPPED` (S08·CLC, O-13) · `CROP2` (S07·BOR) · `TYPO` (S06·CLC "Bas") · `LOW-CADENCE`
  (the universal ~3 Hz caveat).

## 6. Phased pipeline

**Phase 0 — Decisions.** Resolved (§9); GATE G0 satisfied except the two non-blocking flags (O-10, O-14),
which do not gate the build. Proceed on user sign-off of this v2.

**Phase 1 — Column semantics.** ✅ **Done** — schema locked (§3.3). This phase reduces to *documenting* the
schema in `bor-02` with the author-confirmed + byte-verified provenance, and citing the P2 methods (Omnicept)
via the FCM digest for the capture context. No parsing-at-scale until Phase 2.

**Phase 2 — File-discovery + data-quality pass.** The subject×condition→file table is pre-built (§3.2). Write
an extraction script that: (a) derives S-codes at runtime from the sorted `Subjects/` listing (**never writes
names**); (b) resolves each of the 24 cells to its file per §3.2, honoring the 3 exceptions; (c) reads each
file (pandas; openpyxl for the S03·CLC xlsx), applies the §3.3 schema; (d) emits per-cell: total rows,
duration, cadence, `EYES-CLOSED %`, valid-rows count. Output = the seed for `bor-02…json`. Flag any cell
whose cadence/row-count is anomalous.

**Phase 3 — Metric extraction (eyes-open rows only, per §3.4).** Per cell derive: mean pupil dilation
(mean of F,G over eyes-open rows) · gaze-deviation variance (angular deviation of the E vector from the
session median gaze direction, eyes-open rows — the 3 Hz analog of P2's metric) · mean cognitive load (J,
eyes-open) · mean HR (K) / HRV (L, all rows) · `EYES-CLOSED %` (all rows). Then test the P2-style contrasts:
pupil dilation INT>BOR? gaze-variance BOR>CLC≈INT (does CLC resemble INT, the keystone)? Cross-check derived
series against the corresponding `Images/*.fig` where openable. **Optional subgroup read (O-15):** do the 3
`(Med)` subjects differ on **CLC** (spinal-surgery desensitization)? Report as secondary, N=3 caution.
**Framing caveat (O-14):** these 8 are fewer than P2's N=12 — until the author confirms overlap, frame as
"raw HMD re-derivation for 8 subjects; overlap with the published N=12 not established," not "extension."

**Phase 4 — Unit + JSON authoring.** Write `bor-02…md` on the `vle-02` structural precedent (overview →
instrument/measure description with aggregates → named load-bearing cases → "Analytical role" closing that
links to `bor-01` survey unit and the FCM keystone bridge). Every numeric claim `FE-U`; every theory link
`P`; the 3 Hz and eyes-open caveats inline; no verbatim >25 words from P1/P2. Write the sibling `.json`
(per-cell file table, row counts, quality flags, extraction method+date — mirroring FCM's `.json`
`extraction` audit field).

**Phase 5 — Corpus formalization.** Build `manifest.json`; write `boredom-ontology.md` with a parseable
`## 3A. Canonical Node List` (header format). Add the `TEXT_DIRS` diff:
```python
    "Boredom Experiment (VR Attention Study)": {
        "label": "Boredom Experiment (VR Attention Study)",
        "ontology_format": "header",
        "analysis_subdir": "_synthesis",
    },
```
Re-run `python3 scripts/compile-corpus-index.py`; verify node counts in `compiled-index.json` (not assumed);
re-run the repo's verbatim-quote detector. **GATE G1** — show the diff + compiled output; **wait for
sign-off before committing** (per the await-manual-verification discipline). Timestamped backup before any
edit to existing tracked files.

**Phase 6 — Cross-linking.** Rewrite `vle-02` to a short bridge-pointer at the VLE entry (pointer, not
re-digest); update the reanalysis brief's §7 "deferred work" to mark HMD resolved, EEG/OBS still deferred.

## 7. Worked proof-of-pipeline — S05 cross-modal sleep confirmation (seed for bor-03)

The schema (§3.3) and eyes-open rule (§3.4) already yield a load-bearing result. S05 (Kit Feen) self-reported
the boring video as *"5 min (fell asleep)"* in the survey layer. The HMD channel corroborates it independently:

| S05 condition | eyes-closed (H=0&I=0) | pupil-lost (F=−1) |
|---|---|---|
| **BOR** | **77.0%** (1826/2371) | 79.0% |
| CLC | 11.6% | 13.5% |
| INT | 13.8% | 14.8% |

Eyes shut 77% of the boring session vs ~12–14% otherwise; line 380 is a continuous multi-second eyes-closed
run (not a blink) with HR falling to **59 bpm** and HRV elevated (~138) — cardiac corroboration of sleep
onset. **Four channels agree** (self-report, gaze, pupil, cardiac). This is `bor-03`'s flagship case and the
physiological anchor for the survey layer's "dilation requires a wakeful held witness; sleep is boredom's
*exit*" claim [P mapping; FE-U data]. It also proves the extraction pipeline end-to-end before scaling to 24
cells.

## 8. Non-goals (explicit — no scope creep)

- **EEG (.mat) parsing** — future `bor-04`; needs `scipy.io.loadmat`, likely a GPU/compute session.
- **OBS video / frame-tier comportment reads** — future `bor-05`; needs GPU + ffmpeg/whisper.
- **Subject↔published-paper identity mapping & dissertation *use* of FE-U data** — gated on O-10 consent
  scope; unrelated to whether the data gets indexed.
- **Re-analyzing the survey layer** — done; `bor-01` migration is reorganization, not new analysis.

## 9. Decisions ledger

**Resolved:**
| # | Decision |
|---|---|
| O-9 | HMD processing proceeds (this plan); .mat/EEG stays deferred. |
| O-11 | **Standalone** `Boredom Experiment (VR Attention Study)` entry (Pattern A); VLE holds a bridge-pointer. |
| O-12 | HMD column schema **locked** (§3.3); D=ms verified; L="likely HRV" (soft, caveat inline). |
| O-13 | S08·CLC → **use uncropped raw**, flagged `UNCROPPED`. |
| O-15 | "(Med)" = **medical student** (3/8; optional CLC-desensitization subgroup read). |
| — | `_Crop` authoritative over raw; `_Crop 2` supersedes `_Crop`; S01–S08 by sorted dir order, mapping unrecorded; raw stays external. |

**Non-blocking flags (carry into writing, do not gate the build):**
| # | Flag | Handling |
|---|---|---|
| O-10 | FE-U consent scope for dissertation *use* (papers ran under UCI IRB Exempt #2023-2678). | Indexing anonymized derivatives is safe now; **quoting** per-subject FE-U data in the dissertation awaits the author confirming #2023-2678 covers secondary/dissertation use. Keep the `FE-U … pending O-10` tag. |
| O-14 | These 8 subjects < P2's N=12. Subset or partly-new? | Default framing "8 subjects; overlap with N=12 not established" until the author confirms; affects one sentence of comparative wording in `bor-02`. |

## 10. Quality gates (must hold before the entry is "done")

- [ ] No real subject names anywhere in `corpus/index/` **or in any committed script** — only S01–S08 (script derives codes at runtime).
- [ ] Every HMD-derived numeric claim in `bor-02` carries `FE-U`; every theory-linking claim carries `P`.
- [ ] The 3 Hz cadence caveat and the eyes-open filtering rule are stated inline in `bor-02`.
- [ ] File-discovery table covers all 24 cells with explicit `ALT-FORMAT`/`UNCROPPED`/`CROP2`/`TYPO` flags — no silent gaps.
- [ ] `boredom-ontology.md` has a parseable `## 3A. Canonical Node List`; `compile-corpus-index.py` runs clean; `compiled-index.json` node counts verified, not assumed.
- [ ] `vle-02` resolved to a bridge-pointer per O-11 (not left duplicated/dangling).
- [ ] No verbatim >25 words from P1/P2; paraphrase + citation via the FCM bridge digests only.
- [ ] Timestamped backup taken before editing any existing tracked file; GATE G1 sign-off obtained before commit.

## 11. Key paths + the one hard constraint

- Raw root: `/mnt/d/PhD/Dissertation/Boredom Experiment/` (`Subjects/`, `Videos/`)
- Stub to supersede: `corpus/index/Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md`
- Pattern A precedent: `.../VLE/_synthesis/{manifest.json,book-level-ontology.md}`, `.../VLE/bridge-sources/paper-digest-pointers.md`
- `.md`+`.json` unit-pair precedent: `corpus/index/Heidegger - FCM/units/fcm-11-organism.{md,json}`
- Paper digests to point at (never re-digest): `corpus/index/Heidegger - FCM/bridge-sources/king-salvo-{eyetracking,physiological,phenomenological}-digest.md`; keystone `.../_synthesis/fcm-king-salvo-bridge.md`
- P2 methods raw text (Omnicept capture): `tmp/Dissertation/Part_III/style/pubs/p2-eyetrack-clean.txt`
- Compiler: `scripts/compile-corpus-index.py` (`TEXT_DIRS` ~lines 35–103)
- Compiled output: `corpus/index/compiled-index.json`
- Prior audit / survey digests / reanalysis brief: `tmp/Dissertation/Part_III/{boredom-dataset/00-audit.md, boredom-dataset/subject-survey-digests.md, reanalysis/boredom-experiment-brief.md}`

**HARD CONSTRAINT for the extraction script:** it reads real filenames (which contain names) from the mount,
but must map to S-codes by sorted-directory order **in memory** and write **only** S-codes to any output.
No name may reach any committed file — including the script's own source (no hardcoded name→code table).
