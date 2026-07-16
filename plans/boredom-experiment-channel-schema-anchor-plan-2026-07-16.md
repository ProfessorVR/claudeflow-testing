# Plan — Boredom Experiment lab-pole anchor + Pedagogy cross-pipeline edge correction

**Author:** drafted 2026-07-16; **rescoped 2026-07-16** after the Part III VLE-outline handoff clarified the
pedagogy cluster's real purpose (see "Rescope rationale" below). Filename retained for continuity; the
"channel-schema binding" framing of the prior draft is **superseded**.
**Primary goal:** improve the fidelity of the **compiled index** (the most important artifact in the
dissertation system) by (Phase 1) removing 24 backwards/speculative cross-pipeline edges and (Phase 2)
adding the one real primary-object node they were pointing at — the Boredom Experiment lab/VR pole.

## Rescope rationale (why this is no longer a "bind 24 pointers" job)

- The **VR Pedagogy Secondary cluster is the LIT-SLOT literature base for the Part III VLE-section outline**
  (`HANDOFF-PART-III-DESKTOP-OUTLINE-WALKTHROUGH-2026-07-15.md`): its units map onto argument modules
  M1.1–M1.6 / M4.2 (e.g. Dalgarno & Lee → M1.1, Lombard & Ditton → M1.2, Makransky/Parong-Mayer → M1.3,
  Petersen/Radianti/cybersickness → M1.4, and the **social-presence/CSCL bloc → the proposed M1.6 + M4.2
  "WE / co-watching" analysis**, the author's elevated focus). Its job is **evaluating the deployed VLEs**,
  not interfacing with the boredom lab dataset.
- The **boredom experiment is the lab/VR pole and sits *upstream* of the phenomenology** — it feeds the FCM
  boredom apparatus (King–Salvo second-form keystone) and Part III M2/M3 ("exits directly into M2/M3 where
  the boredom data starts"). It is **not** downstream of the pedagogy literature.
- Therefore the 24 `grounds-measure → boredomExperimentDataset` edges the prior cluster build generated are
  **backwards and redundant**. Two facts confirm deletion is non-destructive and correct (verified
  2026-07-16):
  1. **All 24 grounds-measure source units already carry a `bridges-to-part-iii` edge** (23/24 also a
     `bridges-to-vle` edge) — their real relationships are already in the graph.
  2. `grounds-measure` is a **legitimate, heavily-used relation** elsewhere (esp. Boredom Secondary,
     connecting phenomenology units to real instruments) — so the defect is these 24 specific misapplied
     edges, not the relation type.

**User decisions (2026-07-16): DELETE the 24 (not retype); SPLIT into two phases.**

---

# Phase 1 — Pedagogy-cluster edge correction (index fidelity; NO PII; low-risk)

Operates only on `corpus/index/VR Pedagogy Secondary (Part III)/` edge/synthesis files. Touches no raw data.

## 1.1 Delete the 24 `grounds-measure → boredomExperimentDataset` edges

Sources (regenerate the live list first — do not trust this cached list — with
`grep -n ",grounds-measure," "…/VR Pedagogy Secondary (Part III)/_synthesis/global-edges.csv"`):
ped-sec-02, 03, 04, 06, 07, 08, 09, 10, 11, 12, 13, 16, 18, 19, 22, 23, 25, 27, 28, 29, 30, 31, 32, 33.

- Delete each unit's `grounds-measure → boredomExperimentDataset` row in **both** places: the per-unit
  `…/<Author>/ped-sec-NN-*-edges.csv` file **and** the aggregated `_synthesis/global-edges.csv`
  (the global file is re-derived from the per-unit files; edit the per-unit source of truth, then
  regenerate/verify the global).
- **Precision guard — ped-sec-12 has TWO edges to the dataset:** delete only its `grounds-measure` row;
  its `bridges-to-part-iii → boredomExperimentDataset` row is one of the 3 survivors (§1.2), keep it.
- Non-destructive check: after deletion, confirm each of the 24 still has ≥1 `bridges-to-part-iii` edge
  (all 24) — i.e. no unit is orphaned from Part III by the deletion.

## 1.2 The 3 surviving bridges — WAIT (do not repoint in Phase 1)

These are genuine anticipatory bridges, not grounds-measure noise. The anchor does not exist until Phase 2,
so leave all three as honest `****** UNVERIFIED: anchor not yet built` placeholders now; repoint them in
Phase 2 §2.5. Repointing them now would aim an edge at a non-existent path — the very defect being cleaned.
- `ped-sec-14 --bridges-to--> boredomExperimentDataset` (media-condition ladder; → `#ch-stimulus` in P2).
- `ped-sec-12 --bridges-to-part-iii--> boredomExperimentDataset` (home/classroom ↔ deployment comparison).
- `ped-sec-01 --bridges-to-part-iii--> Part III dissertation (Boredom Experiment dataset placeholder)`.

## 1.3 Fix the §7 tally block (`_synthesis/cluster-ontology.md`, ~line 165)

- The `24 grounds-measure (all UNVERIFIED…)` clause is now **0** — remove the grounds-measure count from the
  summary (or state "grounds-measure edges to the boredom dataset retired 2026-07-16; see anchor entry").
- **`bridges-to-vle`: 50 → 49** (confirmed miscount; the stray `ped-sec-14 --bridges-to-->` is a distinct
  relation, not a mangled 50th — do not "restore" an edge).
- **`18 contests`**: clarify it folds `contests-reading-of` (15) + `contests` (2) + `contests-measurement-
  practice` (1); if the intent was the first two, it should read 17. Pick one and state it.
- All other tallies verified correct (34 units · 1,153 dedup edges · 65 `cites-cluster-author` · 19 extends
  · 68 `bridges-to-part-iii` · 60 nodes) — but re-derive the dedup-edge count *after* the 24 deletions
  (1,153 → ~1,129) and update it.

## 1.4 Re-derive, redraw, recompile

- Regenerate `_synthesis/global-edges.csv` from the per-unit edge files; update
  `_synthesis/graph-cross-pipeline-bridge.mmd` (drop the 24 boredom grounds-measure arcs; keep the 3 bridge
  arcs as pending).
- Check `_synthesis/manifest.json` `crossPipelineTargets.boredomExperimentDataset` / `bridgeCandidates` —
  update to reflect that grounds-measure candidates were retired; the 3 bridges remain pending Phase 2.
- Back up `compiled-index.json` + `scripts/compile-corpus-index.py`, run the compiler, and **verify the
  node/edge deltas** by reading `compiled-index.json` (expect: −24 cross-pipeline edges; node count
  unchanged).

## 1.5 Phase-1 GATE (show, then WAIT for sign-off before commit)

(a) the deletion diff (24 rows, both per-unit + global); (b) confirmation each of the 24 retains a
`bridges-to-part-iii` edge; (c) the tally-block correction; (d) compiled-index edge-count before→after;
(e) the 3 bridges shown still-as-placeholders. Backup before edits (timestamped `.backups/`).

---

# Phase 2 — Compact lab-pole anchor build (adds the node; PII/O-9/O-10 gates)

Builds `corpus/index/Boredom Experiment (VR Attention Study)/` as a **compact primary-object entry** — the
lab/VR pole. Its value is the node itself + its **outbound** edges to the phenomenology; it is NOT a binding
substrate for the (now-deleted) pedagogy pointers.

## 2.0 Hard gates — READ FIRST

1. **PII gate (HARD).** Raw `Subjects/` folders are named with real participant names (8 subjects, three
   "(Med)"). No real name may enter any tracked file, commit, prompt, or **transient tool-output line**.
   Subjects are `S01–S08` only; name→Sxx mapping stays unrecorded (`vle-02`). **Do NOT `ls`/`find` inside
   `Subjects/`** — a raw listing prints names into the transcript before any scrub; take structure/counts
   from `vle-02`/the brief. Only `Videos/` (no names) may be listed.
2. **O-10 consent gate.** FE-U dissertation use is provisional. This entry catalogs channel structure at the
   **same derivative level `vle-02` already occupies** — aggregates + the four load-bearing cases +
   taxonomy. It does **not** commit the full per-subject 24-row matrix (that stays in the untracked `tmp/`
   brief, referenced by pointer). Extending past the `vle-02` line needs explicit O-10 sign-off.
3. **O-9 processing gate.** `.mat` EEG reprocessing, HMD-telemetry decoding, OBS/GPU comportment reads are
   deferred. Those channels are *declared-but-unprocessed* metadata only.

## 2.1 Source material (on disk — do not re-collect)

- `…/Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md` — anonymized derivative
  view; the **O-10 ceiling** for what `bex-01` may reproduce.
- `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` — full record; **stays untracked**,
  reference by pointer.
- FCM digests: `…/Heidegger - The Fundamental Concepts of Metaphysics/bridge-sources/king-salvo-*`.
- Raw tree `/mnt/d/PhD/Dissertation/Boredom Experiment/` — metadata only, **`Videos/` listing only**.

## 2.2 Channel taxonomy — as dataset DOCUMENTATION (not a binding table)

Honest description of what the lab pole contains, with cohort-N kept distinct (P1 EEG N=3 · P2 gaze N=12 ·
raw self-report N=8) so published derivations aren't misread as raw-data availability.

| Channel | Modality | Register | N | Contents | Status |
|---|---|---|---|---|---|
| `ch-selfreport` | per-video questionnaire | FE-U | 8 | 7 items: fatigue-prior, boredom, engagement, minutes-until-bored, sleep-fight, **felt-duration**, fatigue-after; 24 episodes | available (aggregates + 4 cases only) |
| `ch-eeg` | 4-ch EEG | FE(P1)/raw | 3/8 | F3,F4,P3,P4; DMN alpha/theta; workload bands (B-Alert) | raw **O-9 deferred** |
| `ch-gaze` | eye-tracking | FE(P2) | 12 | gaze-variance @120 Hz; pupil; searching vs zombie-stare; clinical-vs-boring p=0.0004 | published only |
| `ch-hmd` | HMD telemetry | raw | 8 | HP Reverb G2 Omnicept; exposure protocol | raw **O-9 deferred** |
| `ch-obs` | session video | raw | 8 | OBS posture/fidget/watch-glance | raw **O-9 deferred** |
| `ch-fig` | figures | derived | 8 | per-subject MATLAB `.fig` | metadata only |
| `ch-stimulus` | video stimuli | FE | — | 10 4K60 compilations; key CLC/INT/Boring × LA/HA/IE/E/ME/AS/EC (BOR≡Boring, CLC≡Clinical, INT≡Interesting); 17-min | metadata only |

## 2.3 Entry structure (compact; mirror vle-02 / King–Salvo unit convention)

```
corpus/index/Boredom Experiment (VR Attention Study)/
  _synthesis/
    manifest.json                # channels[], subjects=S01..S08, registers, cohort-N, O-9/O-10, outbound edges
    dataset-overview.md          # profile, PII/consent/processing gates, channel taxonomy (§2.2)
    channel-schema.md/.json      # per-channel spec (documentation)
    cluster-ontology.md          # §3A Canonical Node List (channels + key constructs) — compiler harvest
    graph-channel-map.mmd        # channels × published derivations (P1/P2/P3), ≤25 edges
  units/
    bex-00-corpus-overview.md
    bex-01-selfreport-record.md/.json   # instrument SPEC + aggregates + 4 cases ONLY (O-10 ceiling; no per-subject matrix)
    bex-02-eeg-workload.md
    bex-03-gaze-arousal.md
    bex-04-stimulus-corpus.md
```
`ontology_format: header` + `analysis_subdir: _synthesis`; compiler harvests nodes only from
`_synthesis/cluster-ontology.md` `## 3A. Canonical Node List` (falls back book-level→cluster; verified
`compile-corpus-index.py` L1197–1207). Registers: FE / FE-U / FH / P.

## 2.4 The anchor's OUTBOUND edges (the load-bearing relationships)

Authored **from the anchor** (primary-object-first), not inbound from the literature:
- → FCM boredom apparatus: the King–Salvo **second-form keystone** (felt-time-vs-gaze; occupied surface /
  hollow depth), `bridges-to` the FCM entry.
- → Part III M2/M3 boredom analysis: felt-duration/*Hingehaltenheit* record + two-channel divergence datum.
- **Optional** construct-correspondences (author sparingly, only if analytically used): `ch-eeg` workload ↔
  the EEG-workload literature; `ch-selfreport` boredom/engagement ↔ Parong-Mayer boredom item — typed as
  construct-correspondence/bridge, NOT `grounds-measure`, with the "parallel, not commensurable" caveat for
  EEG-band ↔ self-report. Decide at build time whether these earn their place; default is to omit and let
  Part III carry the lab↔literature link at the outline/LIT-SLOT level.

## 2.5 Repoint the 3 deferred bridges (from Phase 1 §1.2)

Now that the anchor exists: `ped-sec-14 → …/Boredom Experiment (VR Attention Study)/…#ch-stimulus` (keep
`bridges-to`); `ped-sec-12` part-iii bridge and `ped-sec-01` placeholder → the built entry. Clear their
`****** UNVERIFIED` prefixes. Re-derive global-edges + recompile the pedagogy cluster.

## 2.6 Compiler wiring + Phase-2 GATE

1. Add `"Boredom Experiment (VR Attention Study)"` to `TEXT_DIRS` (`header`/`_synthesis`); back up script +
   `compiled-index.json` first.
2. Author `§3A Canonical Node List` (channels + key constructs; header `^##\s+3A[.:]`); run compiler; verify
   node/term deltas in `compiled-index.json` (expect +1 entry, +N channel/construct nodes).
3. Re-run the verbatim scanner (no ≥25-word verbatim; self-report numerics are data, not prose).
4. **GATE — show and WAIT for sign-off:** (a) channel taxonomy; (b) the anchor's outbound edges + the 3
   repointed bridges; (c) `TEXT_DIRS` diff + compiled node counts before→after; (d) **PII** — `grep -ri`
   the entry for the 8 names → empty, and no name entered any tool output; (e) **O-10** — `bex-01` carries
   only aggregates + 4 cases (no per-subject matrix).

---

## Out of scope (both phases)

- No retyping of the 24 (user chose delete). No `.mat`/EEG/HMD/OBS parsing (O-9). No FE-U materialization
  past the `vle-02` level (O-10). No `Subjects/` enumeration. No dissertation-prose drafting (that is the
  separate Part III VLE-outline walkthrough).

## Rescope log
- **2026-07-16 (Opus):** superseded the "bind 24 grounds-measure pointers to channels" framing after the
  Part III handoff showed the pedagogy cluster is Part III LIT-SLOT literature, and verification showed the
  24 boredom `grounds-measure` edges are redundant (every source already `bridges-to-part-iii`). User chose
  **delete + split**. Prior draft (with the full 24-pointer channel-binding machinery and the pre-resolved
  5/4/15 routing) is preserved at `plans/.backups/…pre-rescope.bak.md` for reference.
