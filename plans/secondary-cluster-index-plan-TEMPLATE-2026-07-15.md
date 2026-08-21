# TEMPLATE Plan: Secondary-Literature Cluster → Compiled Index Entry (Sonnet-executable)

**Type:** reusable processing plan for turning ANY folder of secondary-literature PDFs into a corpus/index cluster entry.
**Modeled on:** `plans/boredom-secondary-cluster-index-plan-2026-07-14.md` and its executed output
`corpus/index/Boredom Secondary (Part III)/` (the canonical structural precedent — inspect it whenever a file shape is unclear).
Earlier precedents: `corpus/index/Red Dead Redemption 2 Secondary (2019-2023)/`, `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/`.
**Status:** TEMPLATE. Fill §P, then a cheaper model (Sonnet) executes Phases −1 → 5 with minimal judgment calls.
**Executor discipline:** every judgment call this plan cannot pre-make is turned into a *derivation procedure with a rubric*.
Where the rubric genuinely under-determines an answer, record the choice + reasoning in `phase0-overview.md` under `## Judgment calls`
and continue — do not stall. Where a fact cannot be verified, write `****** UNVERIFIED:` and continue.

---

## P. Parameters (fill these before execution — the ONLY hand-authored part)

| Param | Meaning | Example (Boredom run) |
|---|---|---|
| `SOURCE_DIR` | folder of PDFs to process | `corpus/boredom/` |
| `CLUSTER_NAME` | output folder under `corpus/index/` | `Boredom Secondary (Part III)` |
| `PREFIX` | unit-id prefix | `bor-sec-` |
| `PURPOSE` | 2–4 sentences: which dissertation part / analysis this cluster serves | Part III student-boredom empirical analysis |
| `ANCHORS` | 0–2 existing corpus entries this cluster is *about* or *grounds* (bridge targets; may be empty) | FCM entry; Boredom Experiment dataset entry |
| `ANCHOR_EDGE_NAMES` | one bridge relation per anchor | `bridges-to-fcm`; `grounds-measure` |
| `CONCORDANCE_HINT` (optional) | if the user already knows the primary-object anchor (§3), state it; else Sonnet derives it | construct × measure grid |

Everything below is invariant procedure. `N` = final analytical-unit count (derived in Phase −1).

---

## 0. Anchor discipline (READ FIRST — do not re-digest)

If `ANCHORS` is non-empty: each anchor already exists in the corpus and must be **bridged, never duplicated**. When a source
explicates an anchor's own content, cite the anchor's units by id via the matching `ANCHOR_EDGE_NAME` edge and point at it —
never re-explain the anchor's own argument. Find each anchor's canonical unit ids and ontology node list before Phase 2
(node lists usually live at `<anchor>/_synthesis/*ontology*.md`). If a named anchor entry does not exist yet on disk, leave its
bridges as `****** UNVERIFIED:` pointers and flag it in `phase0-overview.md` — do not block.

**Provenance discipline (carry through every unit and edge):**
- `FE` — the source's own published claim (paraphrased).
- `FAITHFUL-<AUTHOR>` — close paraphrase of a specific passage (with page anchor).
- `P` / `anticipatory-application` — *our* interpretive link from a source to the dissertation or another entry. Every
  cross-pipeline / bridge claim is `anticipatory-application`, never presented as the source's own claim.

**Copyright discipline:** all sources are copyrighted secondary literature. **No ≥25-word verbatim quotation anywhere.**
Paraphrase; anchor-phrases ≤12 words with a page number are permitted.

---

## Phase −1 — Survey & self-authored cluster spec (replaces the hand-written §1/§3/§4 of prior plans)

This phase produces the cluster-specific sections that were hand-authored in the Boredom plan. Work entirely from PDF metadata
+ first/last pages + abstracts — no deep reading yet.

**−1.1 Inventory.** For every file in `SOURCE_DIR`: `pdfinfo` (page count), `md5sum`, and `pdftotext -l 3` of the opening pages
to capture title/author/year/venue. Build a raw inventory table.

**−1.2 De-duplication & haystacks (rubric).**
- Identical md5 → **DROP** the duplicate (keep the cleaner filename; record in `excluded`).
- Same study, different file (preprint vs published, `(1)` copies, different md5 but same title/authors) → **MERGE → 1 unit**;
  analyze the published/better copy; note the other as `dup-variant` in the unit JSON.
- Very large file (>300pp) that is a proceedings volume / edited collection where only specific paper(s) are relevant →
  **HAYSTACK**: grep the extracted `.txt` for the relevant title, find its page range, re-extract with `pdftotext -f/-l`, and
  analyze the extracted paper(s) as normal unit(s). If it cannot be cleanly isolated, create the unit as a `map`-depth stub and
  flag `HAYSTACK-UNRESOLVED`.
- Monograph or edited volume that is *substantively* relevant beyond one chapter → keep as **one `deep-long` unit**, read
  chapter-selectively (only the chapters bearing on `PURPOSE`), cap edges per the floor table below.

**−1.3 Strands.** Cluster the units into 4–8 thematic strands (A, B, C…). Rubric: group first by *discipline register*
(e.g. philosophy/humanities vs empirical/STEM vs applied), then by *shared object* within a register. Strands with fewer than
3 members should be merged into a neighbor unless they carry a distinct bridge role. Name each strand with a one-line gloss.

**−1.4 Authoritative unit table.** Assign `PREFIX``01…N` grouped by strand, zero-padded; reserve `-00-` for
`PREFIX``00-corpus-overview`. For each unit record: `id, slug, folder, author, year, title, pp, strand, depth, sourceFile`.
- **Slug:** first-author surname + short-title fragment, lowercase-hyphenated (Boredom precedent: `bor-sec-13-slaby-other-side`).
- **Folder:** `<Author> - <Short Title> (<Year>)/` (omit year if unknown).
- **Depth rubric:** `deep` = journal article/chapter, full read · `deep-long` = monograph / edited volume / long review
  (chapter-selective) · `map` = ≤10pp, stubs, haystack-derived, or marginal-relevance pieces.
- **This table is provisional; `_synthesis/manifest.json` written in Phase 0 is authoritative thereafter.** (Boredom lesson:
  the count drifted 44→55 between plan and manifest; the manifest, not the plan, is ground truth.)

**−1.5 Primary-object concordance axes (the payoff — derive with care).** Every prior cluster concords its sources to the
*primary objects the dissertation will actually cite*: RDR2-secondary → game elements; Phantasia → Bekker loci; Boredom →
a two-axis construct × measure grid. Derivation rubric: ask *"when the dissertation cites this cluster, what two things must a
lookup connect?"* Usually: (rows) the canonical concepts/constructs the sources treat, normalized to ≤15 labels; (columns) either
an anchor's canonical loci/channels, or the sources' methods/measures, ≤15 labels. If `CONCORDANCE_HINT` was given, use it.
Rows should map onto anchor #1's nodes and columns onto anchor #2's channels/loci where anchors exist. Write the two axis
label-lists into the cluster spec; they are frozen vocabulary for Phase 2 (sources' own terms get normalized *to* these labels,
with the source's own term recorded in the note).

**−1.6 Controlled vocabulary.**
- **Object types:** start from `CONSTRUCT · MEASURE/LOCUS · READING/CLAIM · THEORY-MODEL · THEME · DEBATE-AXIS · INTERLOCUTOR ·
  AUTHOR · TERM` + one type per anchor (bridge-target type). Adapt names to the domain; keep ≤12 types.
- **Edge relations:** standard `defines, cites, extends, contests, concedes, qualifies, instances-in-text` + cluster
  `cites-cluster-author, contests-reading-of, extends-reading-of, shifts-debate-axis` + primary-object relations matching the
  concordance axes (e.g. `treats-<row-type>`, `operationalizes-<col-type>`) + one bridge relation per anchor
  (from `ANCHOR_EDGE_NAMES`), bridge edges always tagged `anticipatory-application`.
- **Theme seeds:** 6–10, from the strand glosses.
- **Debate-axis seeds:** 6–10 candidate `X ↔ Y` disagreements gleaned from abstracts/titles (target 8–12 *documented* by Phase 3).

**−1.7 Emit the cluster spec** as `plans/<slugified-CLUSTER_NAME>-index-plan-<date>.md` containing: filled §P, the strand list,
the −1.4 unit table, the de-dup table, the concordance axes, and the controlled vocabulary — i.e. a concrete sibling of the
Boredom plan. **GATE G0 — present this spec to the user and WAIT for sign-off before Phase 0** (this is the one place the user
corrects scope/axes cheaply; per the plan-review-process discipline, save it to `plans/` and iterate).

---

## 2. Folder layout (create exactly this)

```
corpus/index/<CLUSTER_NAME>/
├── _synthesis/
│   ├── manifest.json                      # authoritative unit table + themes, debate seeds, crossPipelineTargets, excluded
│   ├── phase0-overview.md                 # cluster profile, strands, OCR audit, judgment calls, final unit count
│   ├── cluster-ontology.{md,json}         # deduped canonical nodes; .md carries `## 3A. Canonical Node List` (compiler input)
│   ├── global-edges.csv                   # all per-unit edges concatenated + deduped
│   ├── debate-map.{md,json}               # 8–12 documented cross-source disagreements
│   ├── concept-matrix.csv                 # source × canonical-node presence (x = treated, a = analogical-only)
│   ├── contested-readings.md
│   ├── citation-network.{md,json}         # intra-cluster: who cites whom
│   ├── <topic>-concordance.{md,json}      # *** the primary-object anchor grid (Phase −1.5 axes) ***
│   ├── <topic>-secondary-literature-network.{md,json}   # external citation hubs
│   ├── <topic>-terminology-appendix.{md,json}           # ≥50 lemmas
│   ├── <topic>-scholarly-evolution.md     # thematic arc across the cluster's date range
│   └── graph-{citation-network,concept-debate,discipline-cluster,concordance-density,cross-pipeline-bridge}.mmd
├── bridge-sources/
│   └── anchor-pointers.md                 # pointers to anchor units/channels; NO re-digest (only if ANCHORS non-empty)
├── <Author> - <Short Title> (<Year>)/     # one folder per unit
│   ├── <PREFIX>NN-<slug>.md
│   ├── <PREFIX>NN-<slug>.json
│   └── <PREFIX>NN-<slug>-edges.csv
└── units/
    └── <PREFIX>00-corpus-overview.md
```

## 5. Five-phase pipeline (the executable core)

**Phase 0 — extraction + overview.**
1. `pdftotext` every source in `SOURCE_DIR` to the scratchpad (`<scratchpad>/<prefix>-txt/`), one `.txt` per source. **Mandatory** —
   downstream agents get the `.txt` path, never the PDF (avoids image-payload cost and the multi-page-image API-400 failure).
   Near-empty `.txt` → flag `OCR-LOW` (image-only scan; fall back to `Read` on the PDF ≤10pp at a time).
2. Apply the −1.2 de-dup/haystack dispositions; perform any haystack extractions now.
3. Write `phase0-overview.md` (cluster profile; strands; discipline split; external citation-hub guesses; OCR audit; judgment
   calls; final `N`) and `manifest.json` (unit table + `themes`, `debate_axes_seeds`, `crossPipelineTargets`, `excluded`).
   Manifest keys, matching the Boredom precedent: `cluster, prefix, createdPhase0, sourceDir, totalSourceFilesOnDisk,
   totalAnalyticalUnits, totalAnalyticalUnitsNote, planSource, planCorrections, ocrAudit, strands, units, excluded, themes,
   debate_axes_seeds, crossPipelineTargets`.

**Phase 1 — per-source metadata** (`<PREFIX>NN-<slug>.json`, header fields only): bib header, author/discipline, strand, abstract
paraphrase (≤60 words, no verbatim), section structure, expected concordance rows treated, expected concordance columns
operationalized, expected interlocutors, per-anchor bridge candidates, OCR confidence.

**Phase 2 — deep per-source** (one agent per unit; **two-pass** on `deep-long` units). Each unit emits three files:
- `<PREFIX>NN-<slug>.md` — paraphrastic synthesis. Length: humanities/theory units 1,500–3,500w; empirical/STEM units
  1,000–2,500w; `map` units 400–1,000w. Section skeleton (adapt names to domain, keep the order):
  header line (type/discipline/depth/corpus-role) → Thesis/Aim → Structure → <Row-axis objects treated> → <Column-axis
  methods/loci> *or* Reading-of-anchor (for anchor-reading strands) → Findings/Claims → concordance feed (explicit list of
  row×column cells this unit fills, with pages) → Analytical role (links to anchor units + `PURPOSE`, tagged
  `anticipatory-application`). End with a "Not treated:" line naming salient canonical nodes the source does NOT touch.
- `<PREFIX>NN-<slug>.json` — keys, matching the Boredom precedent: `{id, slug, citation, discipline, strand, depth, thesis,
  sections, constructs[], measures[], readings[], concepts[], interlocutors[], tensions[], bridges:{<anchor-key>:[...]},
  extraction:{tool, date, ocr_confidence}}` (rename `constructs`/`measures` to the row/column axis names if the domain differs).
- `<PREFIX>NN-<slug>-edges.csv` — columns `source,relation,target,locus,note`. **Edge floors:** `map` ≥12 · `deep` ≥20 ·
  `deep-long` ≥35. Every unit ≥1 row-axis edge; column-relevant units ≥1 column-axis edge; anchor-reading-strand units ≥1
  bridge edge to a *specific* anchor unit id. Loci must carry page anchors on both sides where applicable (see the Boredom
  `bor-sec-13` edges for the target quality bar).

**Phase 3 — cluster synthesis** (author the synthesis layer YOURSELF in the main loop, not via subagents; waves):
- **3A** `cluster-ontology.{md,json}` — dedup row/column objects + readings into canonical nodes. The `.md` MUST contain a
  `## 3A. Canonical Node List` section in **header format**: `#### N. Name` + `- **key**: value` bullets, including at minimum
  `definition`, `type`, `units` (comma-separated unit ids where genuinely treated; analogical-only links excluded and recorded
  in `concept-matrix.csv` as `a`), `centrality` (core/supporting/peripheral). Replicate the Boredom/FCM structure exactly —
  the compiler parses this section.
- **3B** `global-edges.csv` (concat + dedup) + `debate-map.{md,json}` (8–12 documented disagreements, each with the sources on
  each pole + a resolution note).
- **3C** `concept-matrix.csv` + `contested-readings.md`.
- **3D** the concordance `{md,json}` (grid per −1.5; `.md` renders the matrix, `.json` is
  `{row, column, sources:[{id, locus, note}]}`) + terminology appendix (≥50 lemmas). Concordance must map every row to ≥1
  anchor-1 node and every column to ≥1 anchor-2 channel/locus where anchors exist (else `****** UNVERIFIED:`).
- **3E** `citation-network.{md,json}` + external-hubs network + the 5 Mermaid graphs + `<topic>-scholarly-evolution.md`
  (thematic arc, not merely chronological).

**Phase 4 — cross-pipeline integration** (only if `ANCHORS` non-empty). `bridge-sources/anchor-pointers.md`: a table pointing
each relevant unit at its anchor units/channels — **pointers only, no re-digest** (model:
`corpus/index/Virtual Learning Environments (King–Salvo)/bridge-sources/paper-digest-pointers.md`). Build
`graph-cross-pipeline-bridge.mmd`, hard cap **≤25 edges**, all tagged `anticipatory-application`.

## 6. Compiler wiring (Phase 5 — do LAST, then GATE)

1. Timestamped backups of `scripts/compile-corpus-index.py` and `corpus/index/compiled-index.json` into `.backups/` first.
2. Add one dict entry to `TEXT_DIRS` near the top of `scripts/compile-corpus-index.py`:
```python
    "<CLUSTER_NAME>": {
        "label": "<CLUSTER_NAME>",
        "ontology_format": "header",
        "analysis_subdir": "_synthesis",
    },
```
3. Run `python3 scripts/compile-corpus-index.py`; **verify the new entry's node/term counts in `compiled-index.json` by reading
   them (do not assume)**; re-run the repo's verbatim-quote detector.
4. **GATE G1 — show the `TEXT_DIRS` diff + compiled node/term counts + one full sample unit trio, and WAIT for user sign-off
   before committing** (await-manual-verification discipline). Never commit before G1.

## 7. Orchestration (for the executing model)

- **Use the Agent tool, not Workflow** (no Workflow opt-in). Budget: 1 (Phase −1/0, main loop) + N (Phase-1 metadata, batch in
  groups of ~8) + N (Phase-2 deep, one agent each; `deep-long` units get dedicated two-pass agents) + Phase 3 authored in the
  main loop.
- **Reliability lesson (Wendt/RDR2/Boredom builds):** pre/post-task hooks intermittently no-op a subagent (~1/8). Mitigation:
  pre-extract every source to `.txt` in Phase 0; give agents the `.txt` path; after each batch, **verify all three files exist
  on disk for every unit and self-author any gaps** before proceeding to synthesis.
- Give each Phase-2 agent: the `.txt` path, its `id/slug/strand/depth`, the controlled vocabulary, the concordance axes, the
  edge floors, the anchor unit-id list(s), the provenance tags, and the ≤25-word verbatim ban. Include one exemplar: point it at
  the Boredom `bor-sec-13` trio as the quality bar.
- Deviations from this plan discovered mid-run go into `manifest.json → planCorrections` (Boredom precedent), not silently.

## 8. Quality gates (must hold before "done"; thresholds scale with N)

- [ ] N units, each with `.md` + `.json` + `-edges.csv` on disk (no silent gaps); de-dup/haystack dispositions recorded in `excluded`.
- [ ] ≥ **12·N** deduplicated global edges (Boredom: 550 @ ~44) · **8–12** documented debates · **8–12** contested readings ·
      ≥ **50** terminology lemmas · ≥ **max(10, N/4)** intra-cluster citations.
- [ ] **Concordance complete:** every row → ≥1 anchor-1 node, every column → ≥1 anchor-2 channel (or `****** UNVERIFIED:`);
      every unit appears in ≥1 concordance cell.
- [ ] Every anchor-reading-strand unit carries ≥1 bridge edge to a specific anchor unit id; every column-relevant unit carries
      ≥1 column-axis edge.
- [ ] **No ≥25-word verbatim**; provenance tags present throughout; every bridge/cross-pipeline claim tagged `anticipatory-application`.
- [ ] 5 Mermaid graphs render; cross-pipeline graph ≤25 edges.
- [ ] `cluster-ontology.md` has a parseable `## 3A. Canonical Node List`; compiler runs clean; `compiled-index.json` counts
      verified by reading; verbatim detector clean.
- [ ] Backups taken before editing any tracked file; **GATE G0 (spec) and GATE G1 (compile) sign-offs obtained; no commit before G1.**

## 9. Key paths

- Structural precedent (canonical): `corpus/index/Boredom Secondary (Part III)/` + its plan `plans/boredom-secondary-cluster-index-plan-2026-07-14.md`
- Quality-bar sample unit: `corpus/index/Boredom Secondary (Part III)/Slaby - The Other Side of Existence (2010)/bor-sec-13-slaby-other-side.{md,json,-edges.csv}`
- Header-format node-list exemplar: `corpus/index/Boredom Secondary (Part III)/_synthesis/cluster-ontology.md` (`## 3A`)
- Bridge-pointer precedent: `corpus/index/Virtual Learning Environments (King–Salvo)/bridge-sources/paper-digest-pointers.md`
- Compiler: `scripts/compile-corpus-index.py` (`TEXT_DIRS` near top) · output `corpus/index/compiled-index.json`
- Earlier sibling plans: `plans/rdr2-secondary-cluster-analysis.md` · `plans/phantasia-cluster-2025-analysis.md`
