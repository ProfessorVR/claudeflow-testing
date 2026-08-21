# Boredom Experiment → corpus/index entry — PRELIMINARY plan (2026-07-10)

**Status:** DRAFT / handoff-ready. This plan is intentionally preliminary — it is meant to be fed to a more
capable model (Fable) for refinement and execution, not executed as-is. Every section below tries to give
that rerun everything it needs without re-deriving context: exact paths, prior decisions, open unknowns,
and the repo's structural conventions. Where this plan is under-specified, it says so explicitly rather than
guessing silently.

**Goal:** turn the raw multimodal Boredom Experiment dataset (`D:\PhD\Dissertation\Boredom Experiment`,
~92 GB, WSL mount `/mnt/d/PhD/Dissertation/Boredom Experiment`) into a proper `corpus/index/` entry — the
first one built for this dataset's **HMD eye-tracking CSVs** specifically (EEG/OBS/Images remain out of
scope for now; see §7 Non-goals). A stub unit already exists (`vle-02-boredom-raw-dataset.md`, quoted in
full in §2) but it only carries survey-derived findings; the eye-tracking channel has never been touched.

---

## 1. Grounding — how corpus/index entries are built here

Researched directly from the repo (`corpus/index/`, `scripts/compile-corpus-index.py`, and prior planning
docs) rather than assumed. Three structural patterns are in active use:

- **Pattern A — book/synthesis** (`units/` + `_synthesis/manifest.json` + `_synthesis/<x>-ontology.md`,
  optional `bridge-sources/`). Used by VLE, FCM, Wendt, Burke, Calleja, Rickert, Uexküll.
- **Pattern B — cluster** (`_synthesis/` with cluster-wide ontology/edges/concordance files, plus one
  subfolder per source with `<prefix>-NN-<author>.{json,md,edges.csv}` triples). Used for secondary-lit
  clusters (Aristotelian Phantasia Secondary, RDR2 Secondary).
- **Pattern C — flat/freestanding** (`manifest.json` at entry root, topical `.md` files, dedicated
  derivative subfolders like `frame-traces/`, `transcripts/`). Used by RDR2 (Salvo Playthrough) — the
  closest existing precedent for *raw multimedia data* inside an index entry, because it stores derivatives
  (transcripts, beat-maps) rather than raw footage, which stays external.

**Universal rules that apply regardless of pattern:**
- Raw data **never enters the tracked tree**. It stays at its original location; only anonymized/derived
  digests, aggregates, and exemplar write-ups get committed. VLE's `vle-02` unit models this exactly: a
  bolded `**Location:**` line stating path + size + "raw stays on D:; only anonymized derivatives enter
  tracked trees."
- Every claim carries a **provenance tag**: `FE` (faithful-empirical, published) · `FE-U` (faithful-
  empirical, unpublished/raw — this dataset's register) · `P`/`PROJECTED`/`anticipatory-application`
  (interpretive layer) · `FAITHFUL-<AUTHOR>` (close paraphrase, no added interpretation).
- Subjects are anonymized to codes (**S01–S08**, assigned by sorted directory order) with the name↔code
  mapping **deliberately not recorded** in any tracked file. This mapping already exists implicitly from
  the earlier audit pass (§2) — real names must never appear in the new index entry.
- Missing/unconfirmed source → placeholder `******` (or `****** UNVERIFIED:` for the relaxed variant).
- When material is canonically owned by another entry, add a **pointer in `bridge-sources/`**, never a
  duplicate digest.
- Unit files: `<prefix>-NN-<slug>.md`, zero-padded, `-00-` reserved for the entry overview unit. A sibling
  `<prefix>-NN-<slug>.json` (structured metadata) is optional but is the norm in FCM; VLE does not use it
  uniformly. `manifest.json` fields recur loosely: `entry`, `units`, `sources`, `provenance_discipline`,
  `analysis_home`, `registration`, `prefix`, `kind`, `status`.
- Wiring into `compiled-index.json` requires one code change: add an entry to the `TEXT_DIRS` dict near the
  top of `scripts/compile-corpus-index.py` (`{"label": ..., "ontology_format": "header"|"table",
  "analysis_subdir": "_synthesis"}`), then re-run `python3 scripts/compile-corpus-index.py`. The parser
  looks for a `## 3A. Canonical Node List` section in the ontology file, in either header (`#### N. Name`
  + `- **key**: value` bullets) or pipe-table format.

## 2. What already exists (do not re-derive — build on top of it)

| Artifact | Path | Contents |
|---|---|---|
| VLE raw-dataset stub unit | `corpus/index/Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md` | 19-line overview: location/size/subject roster/naming key/deferred items (O-9 HMD/.mat processing, O-10 consent) + survey aggregate stats + 4 load-bearing cases. Quoted in the parent research turn — this is the precedent to extend or supersede, not duplicate. |
| Dataset audit | `tmp/Dissertation/Part_III/boredom-dataset/00-audit.md` | Per-subject (S01–S08) file/size/dir/ext counts; Videos/ inventory (10 4K compilations) with naming key; explicitly flags "Any .mat/HMD processing DEFERRED (O-9)". |
| Subject survey digests | `tmp/Dissertation/Part_III/boredom-dataset/subject-survey-digests.md` | Per-subject free-text survey → structured digest (already anonymized to S01–S08). |
| Reanalysis brief | `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` | Full 7-item self-report table (N=8, 24 episodes), three-form re-reading against FCM boredom theory, provenance-tagged. This is the **survey/self-report layer** already done — the plan below is specifically about adding the **eye-tracking (HMD) layer** it never covered. |
| Cross-case synthesis / deployment brief | `tmp/Dissertation/Part_III/reanalysis/cross-case-synthesis.md`, `deployment-brief.md` | Downstream synthesis built on the survey layer only. |
| Governing plan | `plans/part-iii-reanalysis-and-draft-plan-2026-07-06.md` | The plan that produced everything above; Decisions O-9 (raw HMD/.mat processing, deferred pending GPU session) and O-10 (subject↔paper mapping / FE-U consent scope, unresolved) govern this exact dataset and should be treated as still-open unless the user confirms otherwise. |

**Key implication:** the survey (self-report) layer is analyzed and drafted; the physiological/eye-tracking
layer is not. This plan's job is narrowly the **eye-tracking (HMD CSV) layer**, integrated with what already
exists rather than re-analyzing surveys from scratch.

## 3. Data inventory — what's actually in the raw folder (recon-only; nothing parsed beyond headers)

**Top level:** `Subjects/` (8 subject folders) + `Videos/` (10 stimulus compilations, no readme/codebook/
consent doc anywhere in the tree).

**Subjects (real names on disk — must map to S01–S08 per the existing audit's sorted-directory-order
convention before anything enters the tracked tree):** Andrew Do, Andrew Kinoshita (Med), Anthony Wu (med),
Crystal Lai, Kit Feen, Milan Das, Quangminh Tang, Rishi Vermani (Med). Three carry a "(Med)"/"(med)" suffix
— unconfirmed meaning, flagged as O-10-adjacent.

**Per-subject folders:** `EEG/` (.mat ×3, one per condition), `HMD/` (.csv/.xlsx, 5–7 files), `OBS/` (.mp4,
1 or 3 files), `Images/` (.fig, 14–35 files — already-derived MATLAB plots, not raw data). All 8 subjects
have complete EEG and non-empty HMD/OBS/Images; no subject is missing an entire modality.

**HMD CSV files — the new layer this plan targets:**
- Naming: `<Name>_HMD_<Condition>.csv` (raw) + `<Name>_HMD_<Condition>_Crop.csv` (trimmed — confirmed by
  the user as the correct file: false data removed from start/end of the experiment). Where both a `_Crop`
  and `_Crop 2` exist (confirmed case: Quangminh Tang, Boring condition), **Crop 2 is the corrected/final
  version** — confirmed both by the user's instruction and independently by file modification date
  (Crop: 2023-05-31, Crop 2: 2023-06-19).
- **Exceptions found — the plan must handle these, not silently skip them:**
  - Anthony Wu (med), Clinical condition: no `_Crop.csv`; instead `AnthonyWu_HMD_Clinical (Cropped).xlsx`
    — different file format, same intent. Needs its own read path (openpyxl/pandas, not a plain CSV read).
  - Rishi Vermani (Med), Clinical condition: **no cropped file exists at all** (only raw) — a true gap,
    not a naming variant. This subject/condition pair may need to be excluded from the eye-tracking layer
    or handled via the uncropped file with an explicit caveat.
  - Minor filename typos across the corpus that do NOT affect presence but complicate any programmatic
    globbing: `MilanBas_HMD_Clinical.csv` (should be `MilanDas_...`), `AndrweKinoshita_OBS_*.mp4` vs
    `AndrewKinoshita_...` elsewhere, and the condition label spelled `Boredom` (in some EEG/HMD filenames)
    vs `Boring` (elsewhere, including all Video/OBS filenames and the survey brief's own vocabulary) — same
    condition, inconsistent label, not a fourth condition. **A file-discovery step should not assume clean
    glob patterns; it should build an explicit subject×condition→filepath table and flag anomalies.**
- **CSV structure — no header row anywhere.** Content is 12 comma-separated fields per row, no column
  labels, no codebook found in the tree. Example row (Andrew Do, Boring_Crop):
  `22,8,15,756,X=0.995 Y=0.038 Z=-0.092,3.848587,3.894028,1,1,0.306231,73,117.302933`
  Inferred (NOT confirmed) structure: fields 1–4 = timestamp (H,M,S,ms); field 5 = a rotation/gaze-direction
  vector packed as text (`X=.. Y=.. Z=..`); fields 6–7 = probably gaze/screen coordinates (sentinel `-1,-1`
  pairs with `0,0` flags in some rows — likely "eye-tracking lost"); fields 8–9 = 0/1 flags, plausibly
  per-eye or gaze-validity; field 10 (~0.3–0.8 range) possibly pupil dilation or a load index; field 11
  (~70–120 range) plausibly heart rate; field 12 unclear (elapsed seconds into condition, or an HRV metric
  — needs confirmation). **This inference is unverified and must be either confirmed by the user/a lab
  protocol document, or explicitly caveated as inferred in the resulting index unit — do not encode it as
  ground truth without one or the other.** This is the single most important open item for the advanced-
  model rerun to resolve before writing any interpretive claims off these columns.

**EEG (.mat) and OBS (.mp4):** noted as present/sized but explicitly out of scope for this pass (see §7)
since the user's stated target is the eye-tracking data specifically. `.mat` parsing requires
`scipy.io.loadmat` (out of scope for a recon pass, in scope for the execution phase below).

**Images/ (.fig):** already-derived plots per condition (Cognitive Load, Eye Gaze Axis/Median, HR, HRV, eye
dilation) — likely produced by whatever MATLAB pipeline generated the published P1/P2 papers. These could
serve as a **cross-check** for any new HMD-CSV-derived metrics (e.g., if the plan derives a pupil-dilation
timeseries from the CSVs, compare its shape against the corresponding `.fig` if it can be opened) but are
themselves already-processed, not raw.

## 4. Proposed corpus/index architecture — open decision, not yet built

**Decision needed (O-11, new):** should the eye-tracking layer become (a) a **new standalone entry**
(e.g. `corpus/index/Boredom Experiment (VR Attention Study)/`) using Pattern A, with `vle-02` in VLE
rewritten as a bridge-pointer into it, mirroring the "bridge-sources not re-digest" convention already used
elsewhere (VLE's own `bridge-sources/` points at FCM for material FCM canonically owns); or (b) an
**expansion of the existing `vle-02` unit in place**, keeping everything inside the VLE entry. **This
plan's recommendation is (a)**: the dataset is large enough (EEG+HMD+OBS+survey, 8 subjects, multiple
already-published papers) to eventually be its own multi-unit entry regardless of what this pass covers,
and Pattern A's `units/`+`_synthesis/`+`bridge-sources/` split is exactly suited to layering in EEG/OBS
units later without re-architecting. But this is the user's call, not a foregone conclusion — flag it as
open for the advanced-model rerun to either confirm with the user or execute against this recommendation.

**Proposed folder tree (Pattern A, assuming decision (a)):**

```
corpus/index/Boredom Experiment (VR Attention Study)/
├── units/
│   ├── bor-00-corpus-overview.md              # supersedes/absorbs vle-02's overview content
│   ├── bor-01-survey-self-report.md           # migrated from vle-02 + reanalysis brief §1 (already done)
│   ├── bor-02-eye-tracking-hmd-dataset.md      # NEW — this plan's actual target
│   ├── bor-02-eye-tracking-hmd-dataset.json    # NEW — structured per-subject/condition metadata
│   └── bor-03-exemplar-cases.md                # NEW or migrated — load-bearing cases across survey+gaze
├── _synthesis/
│   ├── manifest.json
│   └── boredom-ontology.md                     # `## 3A. Canonical Node List` — required by the compiler
├── bridge-sources/
│   └── fcm-boredom-theory-pointer.md            # points at FCM's canonical boredom-theory digests, no re-digest
```

**Not proposed for this pass (see §7 Non-goals):** `bor-04-eeg-dataset.md`, `bor-05-obs-video-dataset.md` —
future units, same pattern, once EEG/.mat parsing and OBS video review are separately scoped.

## 5. Controlled vocabulary (decide up front, per the cluster-plan precedent)

- **Provenance tags in force:** `FE-U` for anything read directly off the HMD CSVs (raw physiological
  signal, unpublished); `P` for any interpretive/theoretical mapping (e.g. relating a gaze-variance
  pattern to a Heideggerian boredom-form); `FAITHFUL-<AUTHOR>` not applicable here (no secondary-lit
  paraphrase in this unit). Carry over the register already established in the reanalysis brief exactly.
- **Subject codes:** S01–S08, reusing the *existing* sorted-directory-order mapping from `00-audit.md` —
  do not re-derive a new mapping; consistency with the survey layer (which already uses S01–S08 and is
  cross-referenced by named case, e.g. "S07's double-high answers") is required or the eye-tracking unit
  cannot be cross-linked to existing exemplar cases.
- **Condition labels:** normalize to `BOR` / `CLC` / `INT` (matching the reanalysis brief's table header
  exactly), regardless of which raw-filename spelling variant (`Boredom` vs `Boring`) sourced the data —
  and note the normalization explicitly in the unit so the raw/index mismatch is traceable.
- **Data-quality flags (new, needed for this layer specifically):** `GAZE-LOST` (sentinel `-1,-1` rows),
  `MISSING-CROP` (Rishi Vermani/Clinical), `ALT-FORMAT` (Anthony Wu/Clinical .xlsx), `PARTIAL-SESSION`
  (Quangminh Tang/Interesting EEG has a filename-embedded "last 5-7 min garbage" flag — check whether the
  HMD file for the same subject/condition has a matching truncation).

## 6. Phased pipeline (mirrors the gated-phase / decision-table idiom used in `part-iii-reanalysis-and-draft-plan-2026-07-06.md`)

**Phase 0 — Confirm open decisions before building anything.** Resolve or explicitly carry forward O-9
(raw HMD processing — this whole plan IS that resolution), O-10 (consent/subject-paper mapping — still
gates any eventual dissertation *use* of this data, not its indexing), and the new O-11 (standalone entry
vs. VLE-in-place, §4). **GATE G0** — user sign-off on O-11 and on the column-semantics confirmation
question in §3 before any interpretive claims are written.

**Phase 1 — Column semantics confirmation.** Before parsing 40+ CSVs at scale, get the HMD column meaning
confirmed — either the user has/recalls a lab codebook, or it needs reconstructing from the published P1/
P2 papers (ASEE 2023 #37129, ASEE 2024 #44685 — both already cited in the reanalysis brief, likely present
in `corpus/index` or the library already) which describe the HP Reverb G2 Omnicept capture pipeline and
its output fields. **Do not proceed to Phase 2 with unconfirmed column semantics stated as fact.**

**Phase 2 — Programmatic file-discovery + data-quality pass.** Build the explicit subject×condition→
filepath table referenced in §3 (handles the Crop/Crop 2/xlsx/missing-file exceptions), then run a
lightweight per-file quality scan (row counts, GAZE-LOST proportion, session-length sanity check against
the 17-min actual stimulus length already established in the reanalysis brief) — output as a structured
table, this becomes the seed for `bor-02-eye-tracking-hmd-dataset.json`.

**Phase 3 — Metric extraction.** Once columns are confirmed (Phase 1), derive the same kind of aggregate
metrics the *published* P2 paper already reports (gaze-deviation variance, pupil-dilation comparison
engaging>boring) directly from the raw CSVs for all 8 subjects — this is the dataset's real contribution
over the published N=12 sample, since P2's N=12 likely isn't identical to these 8 raw subjects (needs
checking — another open item). Cross-check derived metrics against the corresponding `Images/*.fig` plots
where feasible.

**Phase 4 — Unit + JSON authoring.** Write `bor-02-eye-tracking-hmd-dataset.md` following the `vle-02`
precedent's structure (overview → instrument/measure description with aggregates → named load-bearing
cases → "Analytical role" closing section linking to `bor-01` survey unit and to any FCM boredom-theory
bridge claim) plus the sibling `.json` metadata file (per-subject/condition file paths, row counts,
data-quality flags, extraction method/date — mirroring FCM's `.json` unit schema's `extraction` audit-trail
field).

**Phase 5 — Corpus formalization.** Build/update `manifest.json`, write `boredom-ontology.md` with the
required `## 3A. Canonical Node List` section (header format, matching VLE's), add the `TEXT_DIRS`
registration diff to `scripts/compile-corpus-index.py`, re-run the compiler, verify node counts in
`compiled-index.json`, re-run the repo's verbatim-quote detector. **GATE G1** — show the diff and compiled
output, wait for sign-off before committing.

**Phase 6 — Cross-linking.** Update `vle-02` (if decision O-11 = standalone entry) to a short bridge-
pointer at the VLE entry, per the "pointer not re-digest" convention; update the reanalysis brief's
"deferred work" section (§7 of `boredom-experiment-brief.md`) to reflect what's now resolved vs. still
deferred (EEG/.mat, OBS/video review remain deferred per §7 Non-goals below).

## 7. Non-goals for this pass (explicit, so the rerun doesn't scope-creep)

- **EEG (.mat) parsing** — separate future unit (`bor-04`), needs `scipy.io.loadmat` and likely a GPU/
  compute session; not touched here.
- **OBS video review / frame-tier comportment reads** — already flagged as deferred (needs GPU session,
  ffmpeg/whisper) in the existing audit; not touched here.
- **Subject↔published-paper identity mapping and any dissertation-text *use* of this data** — gated on
  O-10 consent-scope confirmation, unrelated to whether the data gets indexed.
- **Re-analyzing the survey/self-report layer** — already done (`bor-01`/`vle-02` migration is pure
  reorganization, not new analysis).

## 8. Decisions

**Resolved (carried forward from governing plan / user's own instruction this session):**
| # | Decision |
|---|---|
| — | `_Crop` files are authoritative over raw; `_Crop 2` supersedes `_Crop` when both exist (user-confirmed, cross-checked by file date). |
| — | Subject anonymization: S01–S08 by sorted directory order, mapping not recorded in tracked files. |
| — | Raw data stays external; only derivatives/digests are committed. |

**Open (need explicit user sign-off or advanced-model resolution before Phase 2+):**
| # | Question | This plan's recommendation |
|---|---|---|
| O-9 | Raw HMD/.mat processing — previously deferred. This plan IS the HMD half of that resolution; .mat (EEG) stays deferred. | Proceed with HMD only, per §7. |
| O-10 | Subject↔paper mapping / FE-U consent scope for dissertation *use*. | Out of scope for indexing itself; re-flag as still-open, don't resolve implicitly. |
| O-11 (new) | Standalone `Boredom Experiment (VR Attention Study)` entry vs. expand `vle-02` in place. | Standalone (Pattern A), with VLE holding a bridge-pointer — see §4. |
| O-12 (new) | HMD CSV column semantics — currently inferred from row content only, no codebook found. | Confirm via P1/P2 published papers' methods sections or ask user for a lab codebook before Phase 3. |
| O-13 (new) | Rishi Vermani/Clinical missing crop file — exclude from eye-tracking layer, or process the uncropped file with a caveat? | Exclude by default; note as a gap, don't silently substitute raw data as if it were cropped. |
| O-14 (new) | Does the published P2 paper's N=12 sample overlap with these 8 raw subjects, partially or fully? Affects whether Phase 3's derived metrics are "replication" or "extension" framing. | Check before writing any comparative claim in `bor-02`. |
| O-15 (new) | "(Med)" cohort marker meaning (3 of 8 subjects) — medical background? Different consent track? | Ask user; don't guess in the index unit. |

## 9. Quality gates (must hold before the entry is considered done)

- [ ] No real subject names anywhere in `corpus/index/` — only S01–S08.
- [ ] Every HMD-derived numeric claim in `bor-02` carries `FE-U`; every theory-linking claim carries `P`.
- [ ] Column-semantics inference (§3) is either confirmed with a cited source or explicitly marked
      unconfirmed inline — never stated as bare fact.
- [ ] File-discovery table accounts for all 8 subjects × 3 conditions (24 cells), with explicit
      MISSING-CROP/ALT-FORMAT/PARTIAL-SESSION flags where applicable — no silent gaps.
- [ ] `boredom-ontology.md` contains a parseable `## 3A. Canonical Node List`; `compile-corpus-index.py`
      runs clean and `compiled-index.json` node counts are verified, not assumed.
- [ ] `vle-02` cross-reference resolved one way or the other per O-11 (not left dangling/duplicated).
- [ ] No verbatim >25 words from any published source (P1/P2 papers) — paraphrase + citation only.

## 10. Key paths (for the advanced-model rerun — everything it needs, no re-discovery required)

- Raw data root: `/mnt/d/PhD/Dissertation/Boredom Experiment/` (`Subjects/`, `Videos/`)
- Existing stub unit: `corpus/index/Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md`
- Existing manifest/ontology precedent: `corpus/index/Virtual Learning Environments (King–Salvo)/_synthesis/manifest.json`, `.../_synthesis/book-level-ontology.md`
- `.md`+`.json` unit-pair schema precedent: `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/units/fcm-11-organism.{md,json}`
- Pattern C (raw-multimedia derivative) precedent: `corpus/index/Red Dead Redemption 2 (Salvo Playthrough)/manifest.json`, `.../frame-traces/`, `.../transcripts/`
- Compiler: `scripts/compile-corpus-index.py` (`TEXT_DIRS` dict ~lines 35–103; header-ontology parser ~lines 483–745)
- Compiled output: `corpus/index/compiled-index.json`
- Prior audit: `tmp/Dissertation/Part_III/boredom-dataset/00-audit.md`
- Prior survey digests: `tmp/Dissertation/Part_III/boredom-dataset/subject-survey-digests.md`
- Prior reanalysis brief (survey layer, already done — do not redo): `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md`
- Related downstream docs: `tmp/Dissertation/Part_III/reanalysis/cross-case-synthesis.md`, `deployment-brief.md`
- Governing plan (source of O-9/O-10, session context): `plans/part-iii-reanalysis-and-draft-plan-2026-07-06.md`
- Cluster-pattern planning-methodology precedent: `plans/rdr2-secondary-cluster-analysis.md`
- Published source papers referenced by the reanalysis brief: P1 = ASEE 2023 #37129 (N=3); P2 = ASEE 2024 #44685 (N=12) — locate in library/corpus before Phase 1; not yet confirmed present in `corpus/index`.
