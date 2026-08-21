# HANDOFF — Boredom Experiment anchor + O-9 processing (2026-07-17)

**Read this first in a clean session.** Covers the Boredom Experiment (VR Attention Study) corpus-index
anchor, the pedagogy-cluster edge correction, and the O-9 processing of the raw dataset's physiological
channels. All work is on branch **`writing-pipeline-v2`**; nothing pushed to remote.

---

## 0. Overall goal

Two intertwined goals, both now largely met:
1. **Corpus-index fidelity** (the user's most important artifact). The VR Pedagogy Secondary cluster had 24
   speculative `grounds-measure` edges pointing *at* the not-yet-built Boredom Experiment lab dataset —
   backwards (the pedagogy cluster is Part III **LIT-SLOT literature** for evaluating the deployed VLEs; the
   boredom lab is *upstream* of the phenomenology, feeding the FCM apparatus + Part III M2/M3, not grounded
   by the literature). Fix = retire the bad edges and build the real lab-pole anchor.
2. **O-9 processing** — turn the boredom dataset's declared-but-unprocessed raw channels (EEG, HMD telemetry,
   session video, MATLAB figures) into actual signal for the dissertation's boredom analysis.

The dataset is the **lab/VR pole** of Part III's empirical corpus. `vle-02-boredom-raw-dataset` (under the
King–Salvo VLE anchor) is its anonymized *derivative*; the new `Boredom Experiment (VR Attention Study)`
anchor is the *raw dataset / channel structure* home. Findings live at vle-02 (nodes 10–14); the anchor
holds the channels.

---

## 1. COMPLETED (chronological; commits on `writing-pipeline-v2`)

### Plan (rescoped)
- Original plan reviewed and **rescoped** from "bind 24 pointers to channels" → "delete the backwards edges +
  build a compact lab-pole anchor." User decisions: **DELETE (not retype) · SPLIT into two phases.**
  Plan file: `plans/boredom-experiment-channel-schema-anchor-plan-2026-07-16.md`.

### Phase 1 — pedagogy-cluster edge correction · commit `c92ea3d13`
- Deleted the **24 `grounds-measure → boredomExperimentDataset` edges** from each unit `-edges.csv` +
  `global-edges.csv` (1,153 → 1,129 rows) and from the mirrored `.json` `bridges` blocks (23 units;
  ped-sec-12 kept — it has a surviving part-iii bridge).
- Verified non-destructive: all 24 source units already carry `bridges-to-part-iii` (23/24 also
  `bridges-to-vle`), so their real relationships survive.
- Fixed the §7 tally (bridges-to-vle 50→49, grounds-measure 24→0, dedup 1,153→1,129); updated the graph,
  manifest, `anchor-pointers.md` registry, `phase0-overview.md`, and 5 unit `.md` files. 59 files total.
- **KEY: `compiled-index.json` is NOT affected by edge deletion** — the compiler ingests only §3A nodes +
  tension-edges, never relation edges (verified byte-identical on recompile).

### Phase 2 — build the lab-pole anchor · commit `48ac09a96`
- Built `corpus/index/Boredom Experiment (VR Attention Study)/` (9 files) mirroring the King–Salvo sibling.
- **§3A = 7 DATASET-CHANNEL nodes** (ch-selfreport, ch-eeg, ch-gaze, ch-hmd, ch-obs, ch-fig, ch-stimulus)
  → `compiled-index.json` **663 → 670 nodes (+7, additive-only verified)**. Registered in `TEXT_DIRS`.
- Non-duplicative (findings stay at vle-02); outbound edges → FCM keystone, Part III M2/M3, vle-02.
- Repointed the 3 surviving pedagogy bridges (ped-sec-14 → `#ch-stimulus`; ped-sec-12/01 part-iii).

### ch-obs correction + O-9 scoping · commit `2f4e3ed97`
- **Inspected the raw tree (user-authorized) and discovered ch-obs is NOT a body camera** — it is the
  subject's **first-person in-VR headset feed** (WMR screen capture). **User confirmed no body camera was
  ever recorded.** Corrected the anchor's ch-obs node + bex-00/bex-04/manifest + recompiled: ch-obs now
  yields stimulus-segmentation + head-restlessness + off-task, which **corroborate** ch-gaze/ch-hmd, not an
  independent surface. Keystone is a **two-surface** reading + corroboration.
- Produced the **O-9 processing scoping plan** (multi-agent workflow: 4 channel specialists → adversarial
  verify → synthesis): `plans/boredom-experiment-o9-processing-scope-2026-07-16.md`.

### (related, not mine) `d6e910a2d` — ped-sec-14 surname correction (Barrett, not "Colin") in the VR Pedagogy cluster.

### O-9 processing — THREE LIGHT CHANNELS (ch-hmd, ch-fig, ch-eeg)
- Fully processed, cross-validated, statistically tested, and grounded in the two published papers
  (see §4). Scripts committed · **commit `b766783a5`** → `scripts/boredom-o9/` (code only; `out/` gitignored;
  no PII). Outputs + the Part III findings note are **untracked** (FE-U per-subject) in `tmp/`.

---

## 2. WHERE WE ARE NOW

- **Anchor:** live and compiled — 9 files, 7 nodes in `compiled-index.json` (total 670).
- **Pedagogy cluster:** the 24 backwards edges gone; 3 bridges repointed to the built anchor.
- **O-9 three light channels:** DONE. Outputs in `tmp/Dissertation/Part_III/boredom-o9-processing/out/`;
  findings written to a Part III note; scripts committed.
- **Key analytical result (see §4):** every physiological surface reads BORING as the boredom outlier and
  CLINICAL as engaged; the paper's N=1 "clinical EEG ≈ boring" does **not** replicate at N=8. Statistically,
  **only pupil dilation is significant** at N=8; the rest are directional-only.
- **Disk:** WSL `/` was full (blocked Bash); user deleted the older `pre-focustracker` tarball → 142 G free.

---

## 3. WHAT REMAINS

1. **`ch-obs` — Phase d (deferred, not started).** The session-video (first-person VR feed) pass:
   stimulus-segmentation (CLIP) + head-restlessness (RAFT optical flow) + on/off-task. **Corroboration-only**
   (no body cam) — its main value is the stimulus-segmentation timestamps as a cross-channel alignment anchor.
   IO-bound (~85.6 GB, ~2–3 h), on **this PC's RTX 5090 (32 GB) — deactivate vLLM first**. Pre-fetch CLIP +
   raft_small weights. Full approach in §2.4 of the O-9 scoping plan.
2. **Larger-N follow-up (optional).** At N=8 only pupil is significant. Testing the EEG/gaze surfaces
   individually would need a larger N (e.g. P2's own N=12 gaze cohort).
3. **Decide disposition of O-9 outputs.** Currently untracked FE-U. Options: fold aggregate (per-stimulus,
   no per-subject) summaries into the anchor or a Part III chapter; or leave in `tmp/`. (Scripts already
   committed; per-subject outputs deliberately not.)
4. **Nothing pushed** — remote push is a separate, gated decision.

---

## 4. KEY FINDINGS (paper-grounded)

Methods grounded in the two published papers (not inferred):
- **EEG** (King et al., ASEE 2023 #37129): montage **F3, F4, P3, P4** (= data columns 0–3), 1–35 Hz; boredom
  marker = DMN power in **alpha (8–12) + theta (4–8)** (higher = boring-like) — NOT a theta/alpha ratio.
- **Gaze** (King et al., ASEE 2024 #44685): **variance of the 5-point-median Euclidean deviation from
  center** (higher = searching/boredom) — NOT angle-from-mean.

Within-subject z-scored surfaces (higher DMN/gaze-var = boring-like; higher load/pupil = engaged):

| stimulus | EEG DMN | parietal α | gaze var | cognitive-load | pupil |
|---|---|---|---|---|---|
| **Boring** | +0.48 | +0.70 | +0.21 | −0.19 | −0.69 |
| Clinical | −0.24 | −0.32 | −0.20 | +0.33 | +0.40 |
| Interesting | −0.24 | −0.38 | −0.01 | −0.14 | +0.30 |

- **All 5 surfaces converge:** boring is the outlier; clinical sits with the engaged pole.
- **Keystone corrected:** the 2023 paper's "clinical EEG ≈ boring" (from its 1 clean subject) does NOT
  replicate at N=8 (clinical DMN low = engaging-like; keystone 4/8 = chance). Reframed keystone = **all
  physiology engaged vs self-report bored** on clinical (self-report 6.0/9) — more robust than the paper's
  N=1 EEG split.
- **N=8 statistics (Friedman + Wilcoxon, Holm):** ONLY **pupil dilation** significant (Friedman p=0.030;
  Boring < Clinical in all 8, p=0.008, effect −1.0). EEG DMN p=0.20, parietal-α p=0.22, gaze-var p=0.61,
  cog-load p=0.61, HR p=0.20, HRV p=0.61 — directional but underpowered. **Report the convergence + pupil,
  not per-channel significance.**

---

## 5. IMPORTANT PATHS

### Corpus-index anchor (tracked)
- `corpus/index/Boredom Experiment (VR Attention Study)/` — the lab-pole anchor.
  - `_synthesis/book-level-ontology.md` — **§3A Canonical Node List** (the 7 channel nodes the compiler harvests).
  - `_synthesis/manifest.json` — channels[], outbound bridges, gates, `future_work_deferred_processing`, `scoping_plan` pointer.
  - `_synthesis/graph-channel-map.mmd`; `bridge-sources/paper-digest-pointers.md`; `units/bex-00..bex-04`.
- `corpus/index/Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md` — the
  anonymized derivative (the **O-10 ceiling** for what may be committed; aggregates + 4 cases, no per-subject matrix).
- `corpus/index/VR Pedagogy Secondary (Part III)/_synthesis/` — the pedagogy cluster (edges corrected in Phase 1).
- `corpus/index/compiled-index.json` — the compiled index (670 nodes, 7 = bex).
- `scripts/compile-corpus-index.py` — the compiler (`TEXT_DIRS` has the bex entry; `python3 scripts/compile-corpus-index.py` to rebuild).

### Plans (tracked)
- `plans/boredom-experiment-channel-schema-anchor-plan-2026-07-16.md` — the rescoped anchor plan (Phases 1+2, both done).
- `plans/boredom-experiment-o9-processing-scope-2026-07-16.md` — the file-verified O-9 processing scoping plan (ch-obs = Phase d).

### O-9 processing scripts (tracked) + outputs (UNtracked)
- `scripts/boredom-o9/` — **committed** code: `common.py`, `ch_hmd.py`, `ch_fig.py`, `ch_eeg.py`,
  `ch_validate.py`, `ch_stats.py`, `README.md`, `.gitignore` (excludes `out/`).
- `tmp/Dissertation/Part_III/boredom-o9-processing/` — the working run dir (same scripts) + `out/` with all
  result CSVs (ch-hmd-wide/long/qc, ch-fig-long/coverage/validation, ch-eeg-bandpower/keystone/summary/qc,
  ch-stats, combined-features). **Untracked (FE-U).**
- `tmp/Dissertation/Part_III/reanalysis/boredom-o9-physiological-findings.md` — the **Part III findings note**
  (anonymized aggregates; companion to the brief). **Untracked.**

### Source data & references
- **Raw dataset (PII):** `/mnt/d/PhD/Dissertation/Boredom Experiment/` — `Subjects/` (8 person-named folders,
  three "(Med)"; **NEVER commit names**; sorted folder order = S01..S08) + `Videos/` (10 4K60 compilations).
- `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` — the full FE-U record (24-episode
  per-subject table; untracked; the O-10-gated master).
- Published papers: `corpus/Virtual Learning Environments/King, Christine and Dalton Salvo - physiological
  assessment of learning in VR clinical immersion environment.pdf` (P1 EEG) and `...Assessment of Student
  Engagement in VR Clinical Immersion through Eye Tracking.pdf` (P2 gaze). Read via `pdftotext`, not as images.
- FCM digests: `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/bridge-sources/king-salvo-{physiological,eyetracking,phenomenological}-digest.md` + `_synthesis/fcm-king-salvo-bridge.md` (the keystone).
- Part III VLE-outline handoff (context for the pedagogy cluster's real role): `tmp/Dissertation/Part_III/HANDOFF-PART-III-DESKTOP-OUTLINE-WALKTHROUGH-2026-07-15.md`.

### Memory (auto-loaded each session)
- `project-boredom-experiment-channel-anchor-plan.md` — the rescope + Phases 1/2.
- `project-boredom-experiment-o9-processing-scope.md` — the O-9 scoping, processing, findings, stats.

---

## 6. CONVENTIONS / GOTCHAS (must-know)

- **PII (user-authorized scope):** inspecting the raw tree is allowed; **only the final dissertation-facing
  output must be anonymized (S01–S08).** All committed files + the Part III note are Sxx-only. The name→Sxx
  crosswalk is never persisted. Scripts derive Sxx at runtime from sorted folder names (never de-tagged).
- **Interpreters (PATH trap):** base `python3` under `/mnt/d` lacks scipy/pandas. Use full paths:
  `/home/dalton/.venv/bin/python` (pandas + openpyxl) for **ch-hmd**;
  `/home/dalton/.pyenv/versions/3.11.9/bin/python3` (scipy, torch 2.9.1+cu128, cv2, transformers) for
  **ch-fig / ch-eeg / ch-validate / ch-stats / ch-obs**. Only extra install needed was `openpyxl` (done).
- **Gates:** PII (above); **O-10** = don't commit the full per-subject FE-U matrix (keep to vle-02 derivative
  level); **O-9** = the processing gate (three light channels now done; ch-obs deferred).
- **Data-format variants handled** (verified across all 8 subjects; in the scripts): HMD 12-col + a 9-col
  colon-timestamp variant (S07 Boring); HR/HRV/cog-load `0` = vendor sentinel (masked); `.fig` flat
  (`BOR_`/`CLC_`/`INT_` prefixes) vs nested folders + typos; EEG anomaly trimming (S06-BOR double-length,
  S07-INT garbage tail); S07 missing Interesting; S03 xlsx crop; S08 HR-dropout; S05-BOR low eye-validity.
- **Hardware:** this PC has an **RTX 5090, 32 GB VRAM**; deactivate vLLM before any ch-obs GPU run. EEG/HMD/fig
  need no GPU. WSL `/` is ~86% used (142 G free) after the tarball delete — watch it before the ch-obs 85 GB pass.
- **Compiler:** relation edges (`global-edges.csv`) are NOT ingested into `compiled-index.json` — only §3A
  nodes + `*-tension-edges.json`. Edge changes need no recompile; node changes do.
