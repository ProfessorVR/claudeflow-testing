# Analysis Plan: VR Pedagogy Secondary Cluster (Part III) — EXECUTION-READY

**Type:** scholarly-source cluster (23 secondary-literature pieces on VR/desktop-3D/2D learning, presence, and simulation-based
education) — instantiated from `plans/secondary-cluster-index-plan-TEMPLATE-2026-07-15.md` (Phase −1 executed 2026-07-15).
Structural precedent: `corpus/index/Boredom Secondary (Part III)/` (plan `plans/boredom-secondary-cluster-index-plan-2026-07-14.md`).
**Status:** EXECUTION-READY — **GATE G0 sign-off obtained 2026-07-15** (all §9 decisions confirmed: Synnott excluded; name/prefix,
concordance axes, anchors, Lombard handling, and Strand-C granularity approved as recommended). A cheaper model (Sonnet), in a
fresh session, executes Phases 0→5 from this document alone. The only remaining user gate is **G1** (§6, pre-commit).
**Executor discipline:** judgment calls the plan cannot pre-make → record under `## Judgment calls` in `phase0-overview.md` and
continue. Unverifiable facts → `****** UNVERIFIED:` and continue.

## P. Parameters (filled)

| Param | Value |
|---|---|
| `SOURCE_DIR` | `corpus/pedagogy/` (24 PDFs on disk → 23 analytical units after §1B exclusion) |
| `CLUSTER_NAME` | `VR Pedagogy Secondary (Part III)` |
| `PREFIX` | `ped-sec-` |
| `PURPOSE` | The educational-VR / presence / simulation-learning backbone for the dissertation's **Part III** empirical analysis of student experience in the VLE. Part III's survey strata are **desktop-3D vs video-only** and its poles are **lab=VR ↔ deployment=2D-PC**; this cluster maps *who established which learning/experience construct* and *how it behaves across media conditions (IVR-HMD / desktop-3D / 2D)* — exactly the comparative literature Part III's findings must be read against. |
| `ANCHORS` | 1. `corpus/index/Virtual Learning Environments (King–Salvo)/` (units `vle-01-deployment-survey`, `vle-02-boredom-raw-dataset`, `vle-03-exemplar-bank`, `vle-04-mark-attention-span`; ontology `_synthesis/book-level-ontology.md`). 2. `corpus/index/Boredom Experiment (VR Attention Study)/` — **NOT YET BUILT** → all its bridges are `****** UNVERIFIED:` pointers. |
| `ANCHOR_EDGE_NAMES` | `bridges-to-vle` · `grounds-measure` (dataset, UNVERIFIED until built). Plus `bridges-to-part-iii` for direct dissertation links, always tagged `anticipatory-application`. |
| `CONCORDANCE_HINT` | construct × media-condition grid (derived below, §3) |

**Cross-cluster kinship (not a formal anchor):** `Boredom Secondary (Part III)` Strand F (Haj-Bolouri, Lin, Nacke — VR/immersion/engagement)
overlaps thematically; where a unit here genuinely engages one of those sources, add a `cites-cluster` edge to the `bor-sec-NN` id — optional, no floor.

## 0. Anchor discipline

Bridge, never duplicate. The VLE entry owns the description of the actual VLE, its survey, and its dataset — when a source's
findings bear on them, edge to the `vle-0N` unit; do not re-describe the VLE. All bridge/cross-pipeline claims tagged
`anticipatory-application`. Provenance tags `FE` / `FAITHFUL-<AUTHOR>` / `P` throughout. **No ≥25-word verbatim** (all sources
copyrighted); paraphrase + ≤12-word anchor-phrases with page numbers.

## 1A. The cluster — thematic strands (23 units)

**Strand A — Presence: concept & measurement (foundations).** Lombard & Ditton *At the Heart of It All* (1997); Witmer & Singer
*Measuring Presence in Virtual Environments: A Presence Questionnaire* (1998); Chow *Determinants of presence in 3D virtual
worlds: SEM analysis* (2016).

**Strand B — Theories & frameworks of VR learning (pedagogy models).** Dalgarno & Lee *What are the learning affordances of 3-D
virtual environments?* (2009); Fowler *Virtual reality and learning: Where is the pedagogy?* (2014); Makransky & Petersen *CAMIL*
(2021); Mayer et al. *The Promise and Pitfalls of Learning in Immersive Virtual Reality* (2022).

**Strand C — Media-comparison & process experiments (IVR vs desktop-3D vs 2D — the Part III poles).** Parong & Mayer *Learning
science in immersive virtual reality* (2018); Makransky & Lilleholt *emotional value of immersive VR in education* (2018);
Makransky et al. *Adding immersive VR to a science lab simulation causes more presence but less learning* (2019); Makransky &
Petersen *process of learning with desktop VR: SEM* (2019); Makransky et al. *Equivalence of desktop VR at home and in class*
(2019); Parong & Mayer *Cognitive and affective processes for learning science in immersive VR* (2020); Colin et al. *Comparing
VR, desktop-3D, and 2D versions of a category learning experiment* (2022).

**Strand D — Simulation-based & desktop-3D learning in professional education (health/nursing/chemistry).** Cook et al.
*Technology-Enhanced Simulation for Health Professions Education* (2011, meta-analysis); Merchant et al. *learner
characteristics, desktop 3D VR environments, and college chemistry* (2012); Makransky et al. *Simulation-based VLE in medical
genetics counseling* (2016); Dubovi et al. *Now I know how! …nursing students with non-immersive desktop VR simulation* (2017);
Kononowicz et al. *Virtual Patient Simulations: SR & Meta-Analysis* (2019); Roe et al. *Veteran-Centric Simulations in a Nursing
Program* (2019).

**Strand E — Reviews, agendas & constraints.** Potkonjak et al. *Virtual laboratories for education in STE* (2016); Radianti et
al. *A systematic review of immersive VR applications for higher education* (2020); Cossio et al. *Cybersickness and discomfort
from HMDs: systematic review* (2025).

## 1B. De-duplication & exclusions (Phase −1 findings; md5 audit found 0 duplicates)

| File on disk | Disposition | Reason |
|---|---|---|
| `Synnott, John et al. - Online trolling - The case of Madeleine McCann (2017).pdf` | **EXCLUDE (recommend; confirm at G0)** | Investigative psychology of online trolling — no pedagogy/VR-learning content; almost certainly misfiled into `corpus/pedagogy/`. Record in `manifest.json → excluded`; leave the PDF in place. |
| `Lombard, Matthew & Theresa Ditton - … (1997).pdf` | **KEEP, flag `OCR-LOW`** | Image-only web printout (69pp; `pdftotext` yields 0 words). Fallback: `Read` the PDF ≤10pp at a time, or OCR to text first if tooling available. Unit stays `deep` — it is the presence-concept foundation. |

Net: 24 files − 1 excluded = **23 analytical units**. Confirm in `phase0-overview.md`.

## 1C. Authoritative unit table (provisional; `manifest.json` becomes authoritative at Phase 0)

Folders: `<Author> - <Short Title> (<Year>)/`. Depth rubric: `deep` = full-read article; `map` = ≤10pp. No `deep-long` units.

| id | slug | author | year | pp | strand | depth |
|---|---|---|---|---|---|---|
| ped-sec-01 | lombard-presence-concept | Lombard & Ditton | 1997 | 69* | A | deep (OCR-LOW) |
| ped-sec-02 | witmer-presence-questionnaire | Witmer & Singer | 1998 | 17 | A | deep |
| ped-sec-03 | chow-presence-determinants | Chow | 2016 | 18 | A | deep |
| ped-sec-04 | dalgarno-affordances | Dalgarno & Lee | 2009 | 23 | B | deep |
| ped-sec-05 | fowler-pedagogy | Fowler | 2014 | 11 | B | deep |
| ped-sec-06 | makransky-camil | Makransky & Petersen | 2021 | 22 | B | deep |
| ped-sec-07 | mayer-promise-pitfalls | Mayer et al. | 2022 | 11 | B | deep |
| ped-sec-08 | parong-learning-science-ivr | Parong & Mayer | 2018 | 14 | C | deep |
| ped-sec-09 | makransky-lilleholt-emotional-value | Makransky & Lilleholt | 2018 | 24 | C | deep |
| ped-sec-10 | makransky-presence-less-learning | Makransky et al. | 2019 | 12 | C | deep |
| ped-sec-11 | makransky-petersen-desktop-sem | Makransky & Petersen | 2019 | 16 | C | deep |
| ped-sec-12 | makransky-equivalence-home-class | Makransky et al. | 2019 | 14 | C | deep |
| ped-sec-13 | parong-cognitive-affective | Parong & Mayer | 2020 | 16 | C | deep |
| ped-sec-14 | colin-vr-desktop-2d | Colin et al. | 2022 | 22 | C | deep |
| ped-sec-15 | cook-tes-meta | Cook et al. | 2011 | 11 | D | deep |
| ped-sec-16 | merchant-chemistry-desktop-3d | Merchant et al. | 2012 | 18 | D | deep |
| ped-sec-17 | makransky-genetics-vle | Makransky et al. | 2016 | 9 | D | map |
| ped-sec-18 | dubovi-nursing-desktop-vr | Dubovi et al. | 2017 | 12 | D | deep |
| ped-sec-19 | kononowicz-virtual-patients | Kononowicz et al. | 2019 | 20 | D | deep |
| ped-sec-20 | roe-veteran-sims | Roe et al. | 2019 | 6 | D | map |
| ped-sec-21 | potkonjak-virtual-labs | Potkonjak et al. | 2016 | 19 | E | deep |
| ped-sec-22 | radianti-ivr-review | Radianti et al. | 2020 | 29 | E | deep |
| ped-sec-23 | cossio-cybersickness | Cossio et al. | 2025 | 18 | E | deep |

\* printout pages; the underlying article is a standard journal article. `ped-sec-00-corpus-overview` → `units/`.

## 2. Folder layout

Exactly per the TEMPLATE §2, with `<topic>` = `vr-pedagogy`:
`corpus/index/VR Pedagogy Secondary (Part III)/` containing `_synthesis/` (manifest, phase0-overview, cluster-ontology,
global-edges, debate-map, concept-matrix, contested-readings, citation-network,
**`vr-pedagogy-construct-condition-concordance.{md,json}`**, `vr-pedagogy-secondary-literature-network.{md,json}`,
`vr-pedagogy-terminology-appendix.{md,json}`, `vr-pedagogy-scholarly-evolution.md`, 5 `.mmd` graphs), `bridge-sources/anchor-pointers.md`,
one folder per unit with the `.md`/`.json`/`-edges.csv` trio, and `units/ped-sec-00-corpus-overview.md`.

## 3. The concordance — construct × media-condition grid (the primary-object anchor)

When Part III cites this cluster, the lookup it needs is *"which construct behaves how under which medium."* Rows map to the
VLE entry's nodes / Part III survey constructs; columns map to Part III's strata & poles (and, once built, the Boredom
Experiment dataset's conditions).

**Construct axis (rows — canonical labels; normalize each source's own term to these, recording the source's term in the note):**
`presence (spatial/physical)` · `social presence / co-presence` · `immersion (technological)` · `agency / interactivity` ·
`embodiment / self-representation` · `cognitive load (extraneous vs germane)` · `affect: enjoyment & intrinsic motivation` ·
`situational interest` · `self-efficacy` · `engagement / flow` · `learning outcomes: retention & transfer` ·
`learning outcomes: procedural / skills` · `cybersickness & physical discomfort` · `representational fidelity`.

**Media-condition axis (columns — canonical labels):**
`IVR (HMD)` · `desktop-3D / non-immersive VR` · `2D video / slideshow / text` · `screen-based virtual patient / sim` ·
`conventional instruction (control)` · `home vs classroom setting` · `SEM / process model (no media contrast)` ·
`review / meta-analytic aggregate`.

Each cell = source(s) treating that construct under that condition, with page anchor + one-line note (incl. direction of
effect where the source reports one). `.md` renders the matrix; `.json` is `{construct, condition, sources:[{id, locus, note}]}`.
Every construct row → ≥1 VLE-entry node where one exists; media-condition columns → the Boredom Experiment dataset conditions
as `****** UNVERIFIED:` until that entry is built.

## 4. Controlled vocabulary

- **Object types:** `CONSTRUCT` · `MEDIA-CONDITION` · `READING/CLAIM` · `THEORY-MODEL` (CAMIL, CTML/value-added, affordance
  model, presence-determinants SEM) · `THEME` · `DEBATE-AXIS` · `INTERLOCUTOR` (external hub: Slater, Sweller, Moreno, Mayer-as-cited…) ·
  `AUTHOR` · `TERM` · `VLE-NODE` (bridge target) · `DATASET-CHANNEL` (bridge target, UNVERIFIED).
- **Edge relations:** standard (`defines, cites, extends, contests, concedes, qualifies, instances-in-text`) + cluster
  (`cites-cluster-author, contests-reading-of, extends-reading-of, shifts-debate-axis`) + primary-object (`treats-construct`,
  `tests-condition`, `construct-under-condition`) + bridge (`bridges-to-vle` → a `vle-0N` unit; `grounds-measure` → dataset
  channel, UNVERIFIED; `bridges-to-part-iii` → dissertation; all bridges tagged `anticipatory-application`) + optional
  cross-cluster `cites-cluster` → `bor-sec-NN`.
- **Themes:** presence & its measurement · the immersion→presence→learning causal chain · cognitive load & seductive details in
  IVR · affective/motivational route to learning · media-comparison vs value-added methodology · simulation-based professional
  education · cybersickness & ergonomic constraints · design affordances & pedagogy integration · deployment context
  (home/class; lab/field).
- **Debate axes (seeds — target 8–12 documented):**
  1. more immersion → more learning ↔ immersion adds presence but *not* learning (Makransky 2019; Parong & Mayer 2018 vs
     affordance optimism of Dalgarno & Lee, Radianti).
  2. media-comparison designs are informative ↔ methods-not-media / value-added is the valid paradigm (Mayer et al. 2022).
  3. presence as technology-determined (immersion-driven; Witmer & Singer's control/sensory factors) ↔ presence as
     psychologically/individually determined (Lombard & Ditton; Chow's SEM determinants).
  4. affective route (presence → enjoyment/motivation → learning; Makransky & Lilleholt, CAMIL) ↔ cognitive-load route
     (presence → distraction/extraneous load → less learning; Parong & Mayer 2020).
  5. desktop-3D is a sufficient, cost-effective proxy for IVR ↔ IVR carries unique affordances (Colin et al.; Merchant;
     Makransky-equivalence vs CAMIL/Radianti).
  6. simulation beats no-intervention strongly ↔ sim-vs-sim differences negligible (Cook et al.; Kononowicz).
  7. cybersickness/novelty as substantive moderator of IVR learning ↔ ignorable side-effect (Cossio vs most Strand-C designs).
  8. deployment context matters (lab vs home vs classroom) ↔ context-equivalence (Makransky-equivalence; Part III's own poles).

## 5. Five-phase pipeline

Per TEMPLATE §5, with these cluster specifics:

**Phase 0.** **Re-extract all sources first** — the Phase −1 scratchpad was session-specific and will NOT exist in the executing
session. Run `pdftotext "<pdf>" "<your-scratchpad>/ped-sec-txt/<basename>.txt"` for every PDF in `corpus/pedagogy/` except the
excluded Synnott file, and confirm word counts are non-trivial (`wc -w`). Expected result (verified 2026-07-15): every source
extracts cleanly at 4k–22k words EXCEPT Lombard & Ditton, which yields 0 words (`OCR-LOW`, image-only printout) — the Phase-2
agent for `ped-sec-01` must `Read` the PDF in ≤10pp chunks instead. Then write `phase0-overview.md` + `manifest.json` (keys per
TEMPLATE; `excluded` = Synnott; `planSource` = this file).

**Phase 1.** Per-unit metadata JSONs. Expected-constructs / expected-conditions fields use §3 labels; `bridges-to-vle` candidates
from `vle-01…04`.

**Phase 2.** One agent per unit, given: the `.txt` path (or PDF-chunk instruction for ped-sec-01), id/slug/strand/depth, §3 axes,
§4 vocabulary, edge floors (`map` ≥12 · `deep` ≥20), anchor unit ids, provenance tags, ≤25-word verbatim ban, and the quality
exemplar `corpus/index/Boredom Secondary (Part III)/Slaby - The Other Side of Existence (2010)/bor-sec-13-slaby-other-side.*`.
Unit `.md` lengths: theory/framework units (A/B) 1,500–3,000w; empirical/review units (C/D/E) 1,000–2,500w; `map` 400–1,000w.
Section skeleton: header line → Thesis/Aim → Structure → Constructs → Conditions & design (sample N, instruments, key stats) →
Findings/Claims → Concordance feed (explicit row×column cells with pages) → Analytical role (VLE units + Part III, tagged
`anticipatory-application`) → "Not treated:" line. STEM empirical units populate `measures[]`-equivalent (`conditions[]`) richly:
design, N, instruments (e.g. PQ, IPQ, cognitive-load scales, EEG in ped-sec-10), effect direction. Every unit ≥1
`treats-construct`; Strand-C/D units ≥1 `tests-condition`; every unit ≥1 `bridges-to-vle` OR `bridges-to-part-iii` edge.

**Phase 3.** Synthesis waves 3A–3E per TEMPLATE, authored in the main loop. `cluster-ontology.md` MUST carry the header-format
`## 3A. Canonical Node List` (compiler input). Evolution arc for `vr-pedagogy-scholarly-evolution.md`: presence-concept
foundations (1997–98) → affordance optimism & desktop-3D era (2009–2016) → the media-comparison reckoning & dual-path process
models (2018–2021) → consolidation, boundary conditions, and constraints (2022–2025).

**Phase 4.** `bridge-sources/anchor-pointers.md`: table pointing units at `vle-0N` units and (UNVERIFIED) dataset channels —
pointers only. `graph-cross-pipeline-bridge.mmd` ≤25 edges, all `anticipatory-application`.

## 6. Compiler wiring (Phase 5 — LAST, then GATE)

Backups of `scripts/compile-corpus-index.py` + `corpus/index/compiled-index.json` to `.backups/` first. Add to `TEXT_DIRS`:
```python
    "VR Pedagogy Secondary (Part III)": {
        "label": "VR Pedagogy Secondary (Part III)",
        "ontology_format": "header",
        "analysis_subdir": "_synthesis",
    },
```
Run the compiler; verify the new entry's node/term counts in `compiled-index.json` by reading them; run the verbatim detector.
**GATE G1 — show the `TEXT_DIRS` diff + compiled counts + one sample unit trio; WAIT for sign-off before commit.**

## 7. Orchestration

Agent tool, not Workflow. Budget: Phase 0 in main loop (extraction done) + 23 metadata agents (batches of ~8) + 23 deep agents +
Phase 3 in main loop. Hook-flakiness mitigation per TEMPLATE: after each batch verify all three files exist per unit; self-author
gaps. Mid-run deviations → `manifest.json → planCorrections`.

## 8. Quality gates (N = 23)

- [ ] 23 unit trios on disk; Synnott recorded in `excluded`; ped-sec-01 OCR path documented.
- [ ] ≥ **276** deduplicated global edges (12·N) · **8–12** documented debates · **8–12** contested readings · ≥ **50** lemmas ·
      ≥ **10** intra-cluster citations (the Makransky/Mayer network makes this easy — expect far more).
- [ ] Concordance complete: every construct row → ≥1 VLE node where one exists; dataset-condition mappings `****** UNVERIFIED:`;
      every unit in ≥1 cell.
- [ ] Every unit ≥1 `bridges-to-vle` or `bridges-to-part-iii` edge; Strand-C/D units ≥1 `tests-condition` edge.
- [ ] No ≥25-word verbatim; provenance tags throughout; all bridges `anticipatory-application`.
- [ ] 5 Mermaid graphs render; cross-pipeline graph ≤25 edges.
- [ ] Parseable `## 3A. Canonical Node List`; compiler clean; compiled counts verified; verbatim detector clean.
- [ ] Backups before edits; **G0 obtained 2026-07-15; G1 sign-off still required; no commit before G1.**

## 9. G0 decisions — ALL CONFIRMED by the user 2026-07-15 (execute as stated; do not re-open)

1. **Exclude Synnott (trolling)** as misfiled. **CONFIRMED: exclude** (record in `manifest.json → excluded`; leave PDF in place).
2. **Cluster name / prefix:** `VR Pedagogy Secondary (Part III)` · `ped-sec-`. **CONFIRMED.**
3. **Concordance axes:** construct × media-condition (§3), rows→VLE nodes, columns→Part III strata/poles + dataset conditions.
   **CONFIRMED.**
4. **Anchors:** VLE (King–Salvo) active; Boredom Experiment dataset entry as `****** UNVERIFIED:` pointers (unbuilt); Boredom
   Secondary as informal cross-cluster edges only. **CONFIRMED (unobjected).**
5. **Lombard & Ditton handling:** keep as `deep` with PDF-chunk reading (no OCR reprocessing detour). **CONFIRMED (unobjected).**
6. **Strand C granularity:** the seven Makransky/Parong/Colin experiments kept as separate units. **CONFIRMED.**

## 10. Key paths

- Source PDFs: `corpus/pedagogy/` · scratch text: `<scratchpad>/ped-sec-txt/` (extracted 2026-07-15; ped-sec-01 = 0 words, OCR-LOW)
- Anchor 1: `corpus/index/Virtual Learning Environments (King–Salvo)/` (units `vle-01…04`; bridge-pointer precedent `bridge-sources/paper-digest-pointers.md`)
- Anchor 2 (UNVERIFIED, unbuilt): `corpus/index/Boredom Experiment (VR Attention Study)/` per `plans/boredom-experiment-index-entry-plan-v2-2026-07-11.md`
- Structural precedent + quality bar: `corpus/index/Boredom Secondary (Part III)/` (`bor-sec-13-slaby-other-side.*`; `_synthesis/cluster-ontology.md` §3A)
- Template: `plans/secondary-cluster-index-plan-TEMPLATE-2026-07-15.md`
- Compiler: `scripts/compile-corpus-index.py` (`TEXT_DIRS`) · output `corpus/index/compiled-index.json`
