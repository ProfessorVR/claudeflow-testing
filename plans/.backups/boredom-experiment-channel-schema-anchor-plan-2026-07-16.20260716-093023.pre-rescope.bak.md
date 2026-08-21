# Plan — Boredom Experiment (VR Attention Study) Channel-Schema Anchor

**Author:** drafted 2026-07-16; **revised 2026-07-16** (Opus reanalysis — see "Revision log" at end) for execution by a later session.
**Goal:** build the missing primary-object anchor `corpus/index/Boredom Experiment (VR Attention Study)/`
as a **channel-schema** entry so the **27 dangling edges** that reference the not-yet-built dataset in the
VR Pedagogy Secondary cluster can bind to **named dataset channels**. Of those 27, **24 are `grounds-measure`
pointers** (all currently unbuilt) that bind to channels; the remaining **3** are anticipatory bridges that
must be reconciled (see §4). This is the second of the two post-cluster follow-ups (the first was the
citation-year corrections).

**What "bind" means here (do not overclaim).** Binding a pointer to a channel makes the measure it grounds
**located and typed** — it does *not* by itself make it *empirically verified*. A pointer bound to an
**available** channel (`ch-selfreport`, published `ch-gaze`) is checkable now; a pointer bound to a
**declared-but-deferred** channel (`ch-eeg`, `ch-hmd`, `ch-obs`, all O-9) is located but stays unverifiable
until O-9 processing; a pointer with no matching channel is a **typed gap**. The GATE reports this split
(§5.4). Do not describe the deferred bindings as "verified."

## 0. Scope discipline — READ FIRST (three hard gates)

1. **PII gate (HARD).** The raw `Subjects/` directory is named with **real participant names**
   (confirmed 2026-07-16: eight person-named subfolders, three carrying a "(Med)" marker). **No real
   name may ever enter a tracked file, commit, prompt, or log — including a transient tool-output line.**
   All subjects are referred to ONLY by anonymized `S01–S08`. The name→Sxx mapping is intentionally **not
   recorded** (per `vle-02`).
   - **Do NOT `ls`/`find` inside `Subjects/` at all.** A raw listing prints real names into the session
     transcript *before* any scrub can run — scrubbing after the fact does not un-expose them. The
     per-subject structure (`EEG/.mat ×3`, `HMD/`, `OBS/`, `Images/.fig`, per-video `.txt`) is already
     recorded in `vle-02`; take counts from `vle-02`/the brief, not from a fresh listing.
   - Any raw listing that is truly needed is restricted to `Videos/` (contains no participant names).
2. **O-10 consent gate.** FE-U (unpublished raw self-report) *use in the dissertation* is provisional
   pending consent-scope confirmation. **This entry catalogs channel structure/metadata at the SAME
   derivative level `vle-02` already occupies — aggregates + the four load-bearing cases + channel
   taxonomy. It does NOT reproduce the full per-subject 24-row matrix into the tracked tree** (see §3, the
   `bex-01` note). The full matrix stays in the untracked `tmp/` brief and is referenced by pointer only.
   Extending FE-U materialization past the `vle-02` line requires explicit O-10 sign-off first.
3. **O-9 processing gate.** GPU comportment reads, `.mat` EEG reprocessing, and HMD-telemetry decoding
   are **deferred**. The entry defines these channels as *declared-but-unprocessed*; it must not attempt
   to read/parse `.mat`, EEG, or OBS video. Metadata (file presence, naming keys, published derivations)
   only.

**This is a metadata/schema build, not a data-analysis build.** Its product is a channel taxonomy plus a
binding table — not new empirical findings.

## 1. Source material (already on disk — do not re-collect)

- `corpus/index/Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md` — the
  existing anonymized derivative view (structure, the four load-bearing cases, aggregates). **Primary source
  and the O-10 ceiling for what bex-01 may reproduce.**
- `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` — the full 24-episode self-report
  table (S01–S08), P1/P2 published findings, three-form re-reading, the O-9/O-10 ledger. **Primary source;
  stays untracked — reference by pointer, do not copy the per-subject matrix into `corpus/index/`.**
- Published-paper digests at the FCM entry (P1 ASEE 2023 #37129; P2 ASEE 2024 #44685; P3 Biomed Eng Educ
  2024) — `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/bridge-sources/king-salvo-*`.
- Raw tree at `/mnt/d/PhD/Dissertation/Boredom Experiment/` — **metadata only, and only `Videos/` may be
  listed** (see §0.1). Top level = `Subjects/` (do not enumerate), `Videos/`. Ten 4K60 stimulus
  compilations under `Videos/` (naming key CLC/INT/Boring × LA/HA/IE/E/ME/AS; EC = eyes-closed).

**Cohort-N heterogeneity (record it, don't smooth it over).** Three different N's live in this dataset and
must be kept distinct in the channel specs and binding table:
- **P1 EEG published** N=3 (one clean subject) — `ch-eeg` published derivation.
- **P2 gaze published** N=12 — `ch-gaze` published derivation.
- **Raw self-report on disk** N=8 (S01–S08) — `ch-selfreport`, and the raw per-subject `.mat`/telemetry.
A pointer bound to a *published* channel (P1/P2) is not bound to the N=8 raw per-subject data. Mark this in
the binding table so no one later reads a published-derivation binding as raw-data availability.

## 2. Channel taxonomy (the deliverable's core)

Define the dataset as a set of **named channels**, each with: id, modality, register (FE / FE-U /
declared-unprocessed), unit/scale, published-derivation pointer, cohort-N, and O-9/O-10 status. Proposed channels:

| Channel id | Modality | Register | Cohort N | Contents / scale | Status |
|---|---|---|---|---|---|
| `ch-selfreport` | per-video questionnaire | FE-U | N=8 raw | 7 items: fatigue-prior (1–9), boredom (1–9), engagement (1–9), minutes-until-bored, sleep-fight (1–9), **felt-duration**, fatigue-after; 8 × 3 videos = 24 episodes; viewing order where recorded | **available** (aggregates + 4 cases in vle-02/brief; full matrix NOT committed — see §3) |
| `ch-eeg` | 4-channel EEG | FE (P1) / raw declared | P1 N=3 (1 clean); raw N=8 | F3,F4,P3,P4; DMN alpha/theta; `.mat` ×3 per subject; workload bands boredom<.40 / ideal .40–.70 / overload>.70 (B-Alert crosswalk, cf. ped-sec-13 — *parallel, not commensurable*) | raw **O-9 deferred** |
| `ch-gaze` | eye-tracking | FE (P2) | P2 N=12 | gaze-deviation variance @120 Hz; pupil dilation; searching-gaze vs zombie-stare; clinical-vs-boring p=0.0004 | **published derivation only** (N=12 ≠ raw N=8) |
| `ch-hmd` | HMD telemetry | raw declared | raw N=8 | HP Reverb G2 Omnicept telemetry; exposure-duration/session-time protocol | raw **O-9 deferred** |
| `ch-obs` | session video | raw declared | raw N=8 | OBS recordings (posture/fidget/watch-glance comportment) | raw **O-9 deferred** |
| `ch-fig` | analysis figures | derived | raw N=8 | per-subject MATLAB `.fig` | metadata only |
| `ch-stimulus` | video stimuli | FE | shared | 10 state-contrast 4K60 compilations + per-subject labeled clips ("Focused", "Bored (EC,HA,LA)"); naming key CLC/INT/Boring × LA/HA/IE/E/ME/AS/EC; 17-min actual length | metadata only |

**Naming-key alias note:** the self-report codes videos as `INT/CLC/BOR`; the stimulus compilations use
`Interesting/Clinical/Boring`. Record `BOR ≡ Boring`, `CLC ≡ Clinical`, `INT ≡ Interesting` in the channel
spec so cross-references resolve.

## 3. Entry structure (mirror the vle-02 / King–Salvo unit convention)

```
corpus/index/Boredom Experiment (VR Attention Study)/
  _synthesis/
    manifest.json                 # channels[], subjects=S01..S08 (anonymized), registers, cohort-N, O-9/O-10 status
    dataset-overview.md           # profile, PII/consent/processing gates, channel taxonomy (§2 table)
    channel-schema.md / .json     # per-channel spec: id, modality, register, N, scale, derivation, status
    grounds-measure-binding.md    # THE payoff: 24 ped-sec pointers -> named channel(s) + the 3 bridges (§4)
    cluster-ontology.md           # §3A Canonical Node List (channels + key constructs) — harvested by compiler
    graph-channel-map.mmd         # channels x published derivations (P1/P2/P3), <=25 edges
  units/
    bex-00-corpus-overview.md                  # anchor overview (like vle-00)
    bex-01-selfreport-record.md/.json          # instrument SPEC + aggregates + 4 load-bearing cases ONLY
    bex-02-eeg-workload.md/...                  # EEG channel spec (declared; O-9)
    bex-03-gaze-arousal.md/...                  # P2 gaze/pupil channel (published; N=12)
    bex-04-stimulus-corpus.md/...              # the 10 compilations + naming key
```

**`bex-01` scope ceiling (O-10).** `bex-01` documents the **7-item instrument structure**, the **N=8
aggregates**, and the **four load-bearing cases** (S03/S04/S05/S07) — i.e. exactly what `vle-02` already
carries. It does **NOT** ship a per-subject `.csv` of all 24 episodes into the tracked tree (that would be
new FE-U materialization beyond the vle-02 line — see §0.2). Where a binding needs the raw matrix, it
pointer-references `boredom-experiment-brief.md §1`. (If the full matrix is later judged necessary in the
committed tree, that is a separate O-10 decision, not this build.)

**Compiler note.** Use `ontology_format: header` + `analysis_subdir: _synthesis` (same as the other Part III
entries). The compiler harvests nodes **only** from `_synthesis/cluster-ontology.md`'s `## 3A. Canonical
Node List` (falls back from `book-level-ontology.md` to `cluster-ontology.md`; verified against
`scripts/compile-corpus-index.py` L1197–1207). The `bex-NN` units are human/reference material — every node
that must compile has to be mirrored into §3A. Provenance registers exactly as the brief defines them:
**FE / FE-U / FH / P**.

## 4. The binding (why this entry exists)

**4a. Enumerate ALL 27 edges targeting the dataset.** Regenerate the working list, do not trust a cached
count: `grep -iE "boredomExperiment|Boredom Experiment" "corpus/index/VR Pedagogy Secondary (Part III)/_synthesis/global-edges.csv"`.
As of 2026-07-16 this yields **27 edges**:
- **24 `grounds-measure`** (bind to channels): ped-sec-02,03,04,06,07,08,09,10,11,12,13,16,18,19,22,23,25,
  27,28,29,30,31,32,33.
- **3 non-`grounds-measure` references** that must also be reconciled, NOT ignored:
  - `ped-sec-14 --bridges-to--> boredomExperimentDataset` — anticipatory bridge (IVR/desktop-3D/2D ladder ×
    the dataset's media/condition channels). **Resolved: rebind target →
    `Boredom Experiment (VR Attention Study)/…#ch-stimulus`** (its media-condition compilations), keep the
    `bridges-to` relation.
  - `ped-sec-12 --bridges-to-part-iii--> boredomExperimentDataset` — ped-sec-12 also has a grounds-measure
    edge (a typed gap, §4c). **Resolved: this Part-III bridge carries the home/classroom↔deployment
    comparison** (the grounds-measure edge itself has no channel); rebind target to the built entry, keep
    the `bridges-to-part-iii` relation.
  - `ped-sec-01 --bridges-to-part-iii--> Part III dissertation (Boredom Experiment dataset placeholder)` —
    update the placeholder wording once the anchor exists (no channel binding; presence-concept bridge).

**4b. Two target-string shapes — do NOT find/replace on `******`.** Of the 24 grounds-measure edges, only
**12** carry a `****** UNVERIFIED: …anchor not yet built…` target string (ped-sec-03,06,07,10,13,16,18,22,
27,28,30,32); the other **12** already carry *descriptive* targets (e.g. `boredomExperimentDataset
(DATASET-CHANNEL)`, `Boredom Experiment (VR Attention Study) dataset channel` — ped-sec-02,04,08,09,11,12,
19,23,25,29,31,33). Key the rewrite on **(source-id, relation)**, not on the placeholder text, or half the
edges are silently skipped. **Also clear the `****** UNVERIFIED:` prefix in the `note` column** of each
bound edge (not just the target), keeping any residual instrument-equivalence caveat.

**4c. PRE-RESOLVED routing (verified 2026-07-16 against each edge's note text; 16/18/19/33 verified by
reading the units).** Every one of the 24 is accounted for. Dataset self-report = the 7-item instrument
(fatigue-prior, **boredom**, **engagement**, minutes-until-bored, sleep-fight, felt-duration, fatigue-after)
— it has NO presence, self-efficacy, cognitive-load, social-presence, learning-outcome, or heart-rate item,
which is why so many land as typed gaps.

| ped-sec | unit (short) | measure it would ground (from note/unit) | channel | disposition |
|---|---|---|---|---|
| 04 | Dalgarno & Lee Affordances | motivation/engagement affordance (Affordance 3) | `ch-selfreport` (engagement) | **available** |
| 08 | Parong & Mayer 2018 | boredom-rating item | `ch-selfreport` (boredom) | **available** |
| 09 | Makransky & Lilleholt | motivation/enjoyment scales (presence = gap) | `ch-selfreport` (engagement, partial) | **available** (partial) |
| 22 | Radianti IVR Review | engagement + time-on-task | `ch-selfreport` (engagement) + `ch-gaze` (attention) | **available** |
| 07 | Mayer Promise & Pitfalls | distraction/arousal (EEG + gaze; HR = no channel) | `ch-gaze` (arousal) + `ch-eeg` (arousal) | **available** via gaze; eeg part O-9 |
| 06 | CAMIL | EEG-workload + self-regulation/disengagement | `ch-eeg` (workload) [+`ch-obs` soft] | **declared-O9** |
| 10 | Makransky Presence-but-Less-Learning | EEG-derived boredom/optimal/overload bands | `ch-eeg` (workload bands) | **declared-O9** |
| 13 | Parong & Mayer 2020 | EEG-workload boredom band (B-Alert); *parallel, not commensurable* w/ self-report | `ch-eeg` (workload band) | **declared-O9** |
| 23 | Cossio Cybersickness | exposure-time / habituation vs HMD exposure protocol (SSQ symptom = no channel) | `ch-hmd` (exposure protocol) | **declared-O9** |
| 02 | Witmer & Singer PQ | presence (PQ) items | — no presence channel | **typed gap** (presence) |
| 03 | Chow Presence Determinants | CSE / perceived-usefulness / presence SEM covariates | — not collected | **typed gap** |
| 11 | Makransky Desktop VR SEM | presence / self-efficacy process chain | — not collected | **typed gap** |
| 12 | Makransky Equivalence Home/Class | home vs classroom deployment condition | — no deployment axis (stimulus-type only) | **typed gap** (Part-III bridge handles it, see 4a) |
| 16 | Merchant Chemistry Desktop-3D | self-efficacy / spatial / usability / presence SEM | — no matching channel | **typed gap** |
| 18 | Dubovi Nursing Desktop VR | presence (PQ) + procedural learning; video time-on-task | — no channel (`ch-obs` soft, O-9) | **typed gap** |
| 19 | Kononowicz Virtual Patients | learning-outcome meta-analysis (knowledge/skills) | — no learning-outcome channel (`ch-selfreport` engagement soft) | **typed gap** |
| 25 | Gunawardena & Zittle | social presence | — no social channel | **typed gap** (social) |
| 27 | Tu Social-Presence Measurement | social presence | — no social channel | **typed gap** (social) |
| 28 | Richardson & Swan | social presence / satisfaction | — no social channel | **typed gap** (social) |
| 29 | Biocca Robust Theory | social presence | — no social channel | **typed gap** (social) |
| 30 | Kreijns CSCL Pitfalls | social interaction / CSCL | — no social channel | **typed gap** (social) |
| 31 | Terry & Doolittle | social presence | — no social channel | **typed gap** (social) |
| 32 | Richardson Social-Presence Meta | social presence | — no social channel | **typed gap** (social) |
| 33 | De Back Collaborative CAVE VR | collaborative/behavioral-engagement proxies | — no social/behavioral channel (`ch-obs` soft, O-9) | **typed gap** |

**Disposition split (report at the GATE): 5 available · 4 declared-O9 · 15 typed gap.** A pointer may
multi-bind (07 → gaze+eeg; 22 → selfreport+gaze). "Soft" adjacencies (06/18/33 → `ch-obs`; 19 → engagement)
are recorded in the note but do NOT count as bindings while O-9/partial. **The 15 typed gaps are a real
product, not a failure:** they convert vague `****** UNVERIFIED` into a precise typed statement (e.g. "the
dataset measures no social presence, so this pointer has no channel") — the entire Strand-F social bloc
(25,27,28,29,30,31,32) plus the presence/self-efficacy/SEM/learning-outcome studies fall here.

**Watch items to re-confirm at execution (do not skip):** (i) whether any `ch-selfreport` presence item
exists that would flip 02 from gap → available; (ii) 09's presence component stays gap even though its
motivation/enjoyment binds; (iii) 13's B-Alert-band ↔ self-report-boredom caveat "parallel, not
commensurable" is preserved verbatim.

**4d. Output + cross-entry edit.** Produce `grounds-measure-binding.md` = a table with columns
`source-id | measure (from note) | channel | disposition {available / declared-O9 / typed-gap} | cohort-N |
residual caveat`. Then, **in the VR Pedagogy cluster**, rewrite each bound edge (per 4b) from its current
target → the specific `Boredom Experiment (VR Attention Study)/…#ch-xxx` channel id, and reconcile the 3
edges in 4a. Keep non-commensurable caveats (e.g. ped-sec-13's B-Alert-band ↔ self-report-boredom stays
"parallel, not commensurable" until a crosswalk exists). This is a cross-entry edit and must re-derive the
cluster's `global-edges.csv` + recompile.

**4e. Fold in the tally-block reconciliation (same edit).** The rebind changes the meaning of the §7
summary block in `…/VR Pedagogy Secondary (Part III)/_synthesis/cluster-ontology.md` (line ~165:
`24 grounds-measure (all UNVERIFIED…)` no longer holds). While touching that block, correct the one
confirmed miscount and clarify one ambiguity (audited 2026-07-16 against field-2 relation counts):
- **`bridges-to-vle`: prose says 50, actual is 49** — fix to 49. (The stray `ped-sec-14 --bridges-to-->`
  edge is a *distinct* relation to the dataset, not a mangled 50th `bridges-to-vle`; do not "restore" an
  edge.)
- **`18 contests`** only reconciles if it folds `contests-reading-of` (15) + `contests` (2) +
  `contests-measurement-practice` (1); if the intent was the first two only, it should read 17. Clarify the
  wording rather than leaving it ambiguous.
- All other tallies verified correct: 34 units · 1,153 dedup edges · 65 `cites-cluster-author` · 19 extends
  · 68 `bridges-to-part-iii` · 24 `grounds-measure` · 60 nodes. Do not change these.

## 5. Compiler wiring + gates

1. Add `"Boredom Experiment (VR Attention Study)"` to `TEXT_DIRS` in `scripts/compile-corpus-index.py`
   (`ontology_format: "header"` / `analysis_subdir: "_synthesis"`). Back up script + `compiled-index.json`
   first (per backup discipline).
2. Author `_synthesis/cluster-ontology.md` with a `## 3A. Canonical Node List` (channels + key constructs
   as nodes; header must match `^##\s+3A[.:]`) so the compiler ingests it; run compiler; verify node/term
   deltas by reading `compiled-index.json`.
3. Re-run the verbatim scanner (no ≥25-word verbatim; the brief's `.txt` self-reports are data, not prose —
   keep numeric, no long quoted strings).
4. **GATE — show all of the following and WAIT for sign-off before commit:**
   - (a) the channel taxonomy (§2) with cohort-N column;
   - (b) the binding table (§4d) covering **all 24** grounds-measure edges + the **3** reconciled bridges,
     matching the **pre-resolved routing in §4c** with the **disposition split reported explicitly** —
     expected **5 available · 4 declared-O9 · 15 typed-gap** (flag any deviation from §4c and why);
   - (c) the `TEXT_DIRS` diff + compiled node/term counts (before → after);
   - (d) the cross-entry rewrite diff (24 targets + 3 bridges + notes) **and** the §7 tally-block
     correction (50→49, contests clarification);
   - (e) **PII confirmation** — `grep -ri` the entire new entry for the eight participant names → must be
     empty; confirm no name entered any tool output during the build;
   - (f) **O-10 confirmation** — `bex-01` carries only aggregates + 4 cases (no committed per-subject
     matrix).

## 6. Explicitly out of scope (do NOT do here)

- No `.mat`/EEG/HMD/OBS parsing (O-9). No FE-U materialization past the `vle-02` derivative level (O-10):
  no committed per-subject 24-row matrix. No name→Sxx mapping. No enumeration of `Subjects/`.
- No GPU comportment reads of the compilations (that is the separate deferred `ch-obs`/`ch-stimulus` work).
- No dissertation-prose drafting — this builds the corpus-index anchor + rebinds pointers, nothing downstream.

---

## Revision log (2026-07-16, Opus reanalysis of the prior draft)

- **A. Scope widened 24 → 27.** Prior draft counted only the 24 `grounds-measure` edges; missed
  `ped-sec-14 --bridges-to-->`, `ped-sec-12 --bridges-to-part-iii-->`, and `ped-sec-01` placeholder, all
  targeting the dataset. Now reconciled in §4a.
- **B. Rewrite trap fixed.** Only 12/24 grounds-measure edges carry the `****** UNVERIFIED:` string; a
  find/replace on it skipped the other 12 (which already have descriptive targets). §4b now keys on
  (source-id, relation) and covers the `note` column too.
- **C. O-10 self-contradiction resolved.** Prior §3 specced a full per-subject `bex-01…csv` into the tracked
  tree while gate #2 promised no FE-U extension beyond `vle-02` (which carries only aggregates + 4 cases).
  §0.2 / §3 now cap `bex-01` at the vle-02 level; raw matrix stays in the untracked brief by pointer.
- **D. PII hardening.** Forbade any `ls`/`find` inside `Subjects/` (raw listing surfaces names into the
  transcript before scrub is possible); counts come from `vle-02`. Only `Videos/` may be listed.
- **E. "Verifiable" de-overclaimed.** Distinguished available / declared-O9 / typed-gap dispositions; GATE
  now reports the split. Added cohort-N heterogeneity (P1 N=3 · P2 N=12 · raw N=8) so published-derivation
  bindings aren't misread as raw-data availability.
- **F. All 24 routed.** §4c now forces every ID into a row, including the seven the prior draft left
  unrouted (03,04,12,16,18,19,33).
- **G. Conventions clarified.** `units/bex-NN` mirrors the King–Salvo/vle-02 convention (deliberate);
  BOR≡Boring/CLC≡Clinical/INT≡Interesting alias recorded; §4e folds the 50→49 tally fix + contests
  clarification into the cross-entry edit rather than a separate cleanup.
