# Plan — Boredom Experiment (VR Attention Study) Channel-Schema Anchor

**Author:** drafted 2026-07-16 for execution by a later session (stronger model).
**Goal:** build the missing primary-object anchor `corpus/index/Boredom Experiment (VR Attention Study)/`
as a **channel-schema** entry so the **24 `grounds-measure` pointers** in the VR Pedagogy Secondary
cluster (all currently `****** UNVERIFIED:`) can bind to **named dataset channels** and become verifiable.
This is the second of the two post-cluster follow-ups (the first was the citation-year corrections).

## 0. Scope discipline — READ FIRST (three hard gates)

1. **PII gate (HARD).** The raw `Subjects/` directory is named with **real participant names**
   (confirmed 2026-07-16: eight person-named subfolders, three carrying a "(Med)" marker). **No real
   name may ever enter a tracked file, commit, prompt, or log.** All subjects are referred to ONLY by
   anonymized `S01–S08`. The name→Sxx mapping is intentionally **not recorded** (per `vle-02`). Any
   directory listing reproduced in the entry MUST be scrubbed to `S01…S08` before it is written to disk.
2. **O-10 consent gate.** FE-U (unpublished raw self-report) *use in the dissertation* is provisional
   pending consent-scope confirmation. This entry catalogs **channel structure/metadata**, which is the
   same register `vle-02` already occupies — it does **not** reproduce or newly *use* subject data beyond
   what `vle-02` and `boredom-experiment-brief.md` already carry. Do not extend FE-U use past that line.
3. **O-9 processing gate.** GPU comportment reads, `.mat` EEG reprocessing, and HMD-telemetry decoding
   are **deferred**. The entry defines these channels as *declared-but-unprocessed*; it must not attempt
   to read/parse `.mat`, EEG, or OBS video. Metadata (file presence, naming keys, published derivations)
   only.

**This is a metadata/schema build, not a data-analysis build.** Its product is a channel taxonomy plus a
binding table — not new empirical findings.

## 1. Source material (already on disk — do not re-collect)

- `corpus/index/Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md` — the
  existing anonymized derivative view (structure, the four load-bearing cases, aggregates). **Primary source.**
- `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` — the full 24-episode self-report
  table (S01–S08), P1/P2 published findings, three-form re-reading, the O-9/O-10 ledger. **Primary source.**
- Published-paper digests at the FCM entry (P1 ASEE 2023 #37129; P2 ASEE 2024 #44685; P3 Biomed Eng Educ
  2024) — `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/bridge-sources/king-salvo-*`.
- Raw tree at `/mnt/d/PhD/Dissertation/Boredom Experiment/` — **metadata only** (`ls`/`find` names, counts),
  scrubbed to Sxx. Top level = `Subjects/`, `Videos/`. Ten 4K60 stimulus compilations under `Videos/`
  (naming key CLC/INT/Boring × LA/HA/IE/E/ME/AS; EC = eyes-closed).

## 2. Channel taxonomy (the deliverable's core)

Define the dataset as a set of **named channels**, each with: id, modality, register (FE / FE-U /
declared-unprocessed), unit/scale, published-derivation pointer, and O-9/O-10 status. Proposed channels:

| Channel id | Modality | Register | Contents / scale | Status |
|---|---|---|---|---|
| `ch-selfreport` | per-video questionnaire | FE-U | 7 items: fatigue-prior (1–9), boredom (1–9), engagement (1–9), minutes-until-bored, sleep-fight (1–9), **felt-duration**, fatigue-after; N=8 × 3 videos = 24 episodes; viewing order where recorded | available (in brief) |
| `ch-eeg` | 4-channel EEG | FE (P1) / raw declared | F3,F4,P3,P4; DMN alpha/theta; `.mat` ×3 per subject; workload bands boredom<.40 / ideal .40–.70 / overload>.70 (B-Alert, cf. ped-sec-13) | raw **O-9 deferred** |
| `ch-gaze` | eye-tracking | FE (P2) | gaze-deviation variance @120 Hz; pupil dilation; searching-gaze vs zombie-stare; clinical-vs-boring p=0.0004 | published derivation only |
| `ch-hmd` | HMD telemetry | raw declared | HP Reverb G2 Omnicept telemetry; exposure-duration/session-time protocol | raw **O-9 deferred** |
| `ch-obs` | session video | raw declared | OBS recordings (posture/fidget/watch-glance comportment) | raw **O-9 deferred** |
| `ch-fig` | analysis figures | derived | per-subject MATLAB `.fig` | metadata only |
| `ch-stimulus` | video stimuli | FE | 10 state-contrast 4K60 compilations + per-subject labeled clips ("Focused", "Bored (EC,HA,LA)"); naming key CLC/INT/Boring × LA/HA/IE/E/ME/AS/EC; 17-min actual length | metadata only |

## 3. Entry structure (mirror the secondary-cluster + vle-02 conventions)

```
corpus/index/Boredom Experiment (VR Attention Study)/
  _synthesis/
    manifest.json                 # channels[], subjects=S01..S08 (anonymized), registers, O-9/O-10 status
    dataset-overview.md           # profile, PII/consent/processing gates, channel taxonomy (§2 table)
    channel-schema.md / .json     # per-channel spec: id, modality, register, scale, derivation, status
    grounds-measure-binding.md    # THE payoff: 24 ped-sec pointers -> named channel(s) (§4)
    graph-channel-map.mmd         # channels x published derivations (P1/P2/P3), <=25 edges
  units/
    bex-01-selfreport-record.md/.json/.csv     # the 24-episode instrument (from brief; FE-U)
    bex-02-eeg-workload.md/...                  # EEG channel spec (declared; O-9)
    bex-03-gaze-arousal.md/...                  # P2 gaze/pupil channel (published)
    bex-04-stimulus-corpus.md/...               # the 10 compilations + naming key
    bex-00-corpus-overview.md                   # anchor overview (like vle-00)
```
Use `ontology_format: header` + `analysis_subdir: _synthesis` (same as the other Part III entries) so the
compiler's fallback picks up `_synthesis/cluster-ontology.md` (or add a `book-level-ontology.md`).
Provenance registers exactly as the brief defines them: **FE / FE-U / FH / P**.

## 4. The grounds-measure binding (why this entry exists)

For each of the **24 `grounds-measure` edges** in the VR Pedagogy cluster (list: ped-sec-02,03,04,06,07,08,
09,10,11,12,13,16,18,19,22,23,25,27,28,29,30,31,32,33 — verify against
`corpus/index/VR Pedagogy Secondary (Part III)/_synthesis/global-edges.csv`), read its existing
`****** UNVERIFIED:` note (each already names the measure it *would* ground) and bind it to a channel:

- EEG-workload-band pointers (ped-sec-10 boredom/ideal/overload; ped-sec-13 B-Alert band; ped-sec-06
  cognitive-load/self-regulation; ped-sec-07 arousal/EEG) → `ch-eeg` (declared; O-9).
- Boredom/engagement self-report pointers (ped-sec-08 boredom-rating item; ped-sec-09 presence/motivation/
  enjoyment scales; ped-sec-11 presence/self-efficacy chain) → `ch-selfreport`.
- Presence-instrument pointers (ped-sec-02 PQ items) → **flag: no presence channel exists** in this
  dataset; bind to `ch-selfreport` only if a presence item is later confirmed, else leave as a *typed gap*.
- Exposure-time / cybersickness pointers (ped-sec-23 exposure-duration/symptom) → `ch-hmd` exposure protocol.
- Gaze/attention pointers (ped-sec-07 distraction/arousal; ped-sec-22 time-on-task) → `ch-gaze`.
- Strand-F CMC pointers (ped-sec-25,27,28,29,30,31,32) → mostly *typed gaps* (no social channel); bind
  only where a self-report item plausibly maps, else record as "no channel — gap."

Output = a binding table. Then, **in the VR Pedagogy cluster**, rewrite each bound edge's target from
`****** UNVERIFIED: …anchor not yet built…` → the specific `Boredom Experiment (VR Attention Study)/…#ch-xxx`
channel id, keeping any residual instrument-equivalence caveat (e.g. ped-sec-13's B-Alert-band ↔
self-report-boredom crosswalk stays "parallel, not commensurable" until a crosswalk exists). This is a
cross-entry edit and must re-derive the cluster's `global-edges.csv` + recompile.

## 5. Compiler wiring + gates

1. Add `"Boredom Experiment (VR Attention Study)"` to `TEXT_DIRS` in `scripts/compile-corpus-index.py`
   (`header` / `_synthesis`). Back up script + `compiled-index.json` first.
2. Author `_synthesis/cluster-ontology.md` with a `## 3A. Canonical Node List` (channels + key constructs
   as nodes) so the compiler ingests it; run compiler; verify node/term deltas by reading `compiled-index.json`.
3. Re-run the verbatim scanner (no ≥25-word verbatim; the brief's `.txt` self-reports are data, not prose —
   keep numeric, no long quoted strings).
4. **GATE:** show (a) the channel taxonomy, (b) the 24→channel binding table with any typed gaps,
   (c) the TEXT_DIRS diff + compiled counts, (d) confirmation that no real name appears anywhere
   (`grep -ri` the entry for the eight names → must be empty). WAIT for sign-off before commit.

## 6. Explicitly out of scope (do NOT do here)

- No `.mat`/EEG/HMD/OBS parsing (O-9). No new FE-U use beyond `vle-02`/brief (O-10). No name→Sxx mapping.
- No GPU comportment reads of the compilations (that is the separate deferred `ch-obs`/`ch-stimulus` work).
- No dissertation-prose drafting — this builds the corpus-index anchor + rebinds pointers, nothing downstream.
```
