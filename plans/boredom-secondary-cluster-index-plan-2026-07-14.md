# Analysis Plan: Boredom Secondary-Literature Cluster (Part III) — EXECUTION-READY

**Type:** scholarly-source cluster (~44 secondary-literature pieces on boredom — philosophy + hard-science) — modeled on
`corpus/index/Red Dead Redemption 2 Secondary (2019-2023)/` (plan `plans/rdr2-secondary-cluster-analysis.md`) and
`corpus/index/Aristotelian Phantasia Secondary (1985-2017)/` (plan `plans/phantasia-cluster-2025-analysis.md`).
**Status:** EXECUTION-READY. Written so a cheaper model (Sonnet) can execute Phases 0→4 with minimal judgment calls.
**Output root:** `corpus/index/Boredom Secondary (Part III)/` · prefix `bor-sec-` · cluster pattern (per-source folders + `_synthesis/`).
**Source PDFs:** `corpus/boredom/` (49 files on disk → ~44 analytical units after de-duplication; see §1B).
**Ultimate purpose:** the secondary-literature backbone for the dissertation's **Part III** empirical analysis of *student boredom*,
which reads boredom simultaneously through **phenomenology/philosophy** (Heidegger's three forms, via the existing FCM entry) and
**hard scientific data** (EEG, eye-tracking/pupillometry, HR/HRV). This cluster maps *who established which boredom construct* and
*which physiological signature*, organized so it directly feeds (a) the Part III survey/EEG/eye-tracking findings and (b) the
`Boredom Experiment (VR Attention Study)` dataset entry (see `plans/boredom-experiment-index-entry-plan-v2-2026-07-11.md`).

---

## 0. The two anchors this cluster bridges to (READ FIRST — do not re-digest)

This cluster is *secondary literature*. Two things it points at already exist in the corpus and must be **bridged, never duplicated**:

1. **Heidegger's FCM** — `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/`. The primary phenomenological source
   for profound/deep boredom (the three forms: *being bored by* / *being bored with* / *profound boredom*). Many humanities sources
   here are *readings of FCM*. When a source explicates FCM, cite the FCM entry's units (`fcm-04-first-form`, `fcm-05-second-form`,
   `fcm-06-third-form`, `fcm-07-particular-profound`) via an edge `bridges-to-fcm`, and **do not re-explain FCM's own argument** —
   point to it. FCM's ontology node-list lives at `_synthesis/book-level-ontology.md` (`## 3A. Canonical Node List`, header format).
2. **The Boredom Experiment dataset entry** — `corpus/index/Boredom Experiment (VR Attention Study)/` (built per the v2 plan; if not
   yet built, leave the bridge as a `****** UNVERIFIED:` pointer and flag it). The STEM sources here (EEG, pupillometry, gaze
   variance) are the *methodological literature* that dataset's measures rest on. Bridge with `grounds-measure` edges (e.g. an EEG
   frontal-alpha-asymmetry paper → the dataset's EEG channel; a pupil-dilation-as-load paper → the HMD `cognitive load` column).

**Provenance discipline (carry through every unit and edge):**
- `FE` — the source's own published claim (paraphrased).
- `FAITHFUL-<AUTHOR>` — close paraphrase of a specific passage (with page anchor).
- `P` / `anticipatory-application` — *our* interpretive link from a source to the dissertation or to another entry. Every
  cross-pipeline / bridge claim is `anticipatory-application`, never presented as the source's own claim.

---

## 1A. The cluster — thematic strands (44 units)

Six strands. `bor-sec-NN` numbering is assigned in §1C (the authoritative table). Page counts from `pdfinfo`.

**Strand A — Heideggerian / phenomenological boredom (humanities; readings of FCM).** These bridge heavily to the FCM entry.
Aho (Melancholia, Deep Boredom, 2020, 3pp — short commentary); Elpidorou & Freeman *Affectivity in Heidegger I* (2015);
Elpidorou & Freeman *Affectivity in Heidegger II: Temporality, Boredom, and Beyond* (2015); Elpidorou & Freeman *Is Profound
Boredom Boredom?* (2019); Elpidorou & Freeman *Fear, Anxiety, and Boredom* (2020); Elpidorou *Boredom as a Concept in
Phenomenology* (2023); Gibbs *The Concept of Profound Boredom* (2011); Hughes *Meaninglessness and Monotony in Pandemic
Boredom* (2023); Mihačević *Boredom That Wishes Not To Be* (2022); Quaranta *In the Mood for Heideggerian Boredom: Film
Viewership* (2024); Hernández Albarracín *Cinematographic Analytic of Boredom* (`Hernandez-Alvarez-Pallares (1).pdf`); Slaby
*Living in the Moment* (2017); Slaby *The Other Side of Existence: Heidegger on Boredom* (2010); Zabalo *Notes on Boredom and
Metaphysics, Sociologically Framed* (2019).

**Strand B — Boredom, mood & education (humanities-pedagogy; Heidegger-adjacent).** Directly serve Part III's *student*-boredom frame.
Aroles & Küpers *Towards an Integral Pedagogy in the Age of Digital Gestell* (2022); Feldges *Boredom in Educational Contexts: a
critical review* (2020); Mertel *Heidegger, Technology and Education* (2020); Standish *Can Boredom Educate Us?* (2015); Thomson
*Heidegger on Ontological Education* (2001).

**Strand C — Psychology / cognitive science of boredom (empirical-behavioral, non-EEG).**
Darling *Synthesising Boredom: a predictive processing approach* (2023); Raffaelli et al. *The knowns and unknowns of boredom: a
review* (2018); Tam et al. *Attention Drifting In and Out: The Boredom Feedback Model* (2021); Murphy et al. *Mundane Emotions:
Losing Yourself in Boredom, Time and Technology* (2023); Clark & Hassert *Undecidability and opacity of metacognition* (2013).

**Strand D — EEG / neurophysiology of boredom (STEM).** These `grounds-measure`-bridge to the dataset's EEG channel.
Barry et al. *EEG differences between eyes-closed and eyes-open resting conditions* (2007); Kim et al. *Detecting boredom from eye
gaze and EEG* (2018); Miyauchi & Kawasaki *EEG oscillations… task-unrelated thoughts… boredom* (2018); Perone et al. *Over and
over again: frontal EEG asymmetry across a boring task* (2019); Seo et al. *Machine-learning approaches for boredom classification
using EEG* (2019); Yakobi et al. *Behavioral and EEG evidence for reduced attentional control… in boredom* (2021); Yuvaraj et al.
*EEG-based functional connectivity patterns during boredom in an educational context* (2025).

**Strand E — Eye-tracking / gaze / pupillometry (STEM-methods).** `grounds-measure`-bridge to the dataset's HMD eye-tracking channel.
Cheval et al. *Physically active individuals look for more: an eye-tracking study of attentional bias*; Charoenpit & Ohkura
*Exploring Emotion in an E-Learning System Using Eye Tracking*; Holmqvist et al. *Eye tracking: empirical foundations for a minimal
reporting guideline*; *Review of eye-tracking metrics involved in emotional and cognitive processes* (preprint v3); Scharinger et
al. *Pupil Dilation and EEG Alpha… Load on Executive Functions* (2019); Sharma et al. *Eye-tracking and AI to enhance motivation and
learning*; *Predicting Affect from Gaze Data during Interaction with an Intelligent Tutoring System* (ITS 2014).

**Strand F — VR / immersion / engagement (STEM-applied; bridges to Part III VR setting).**
Haj-Bolouri *The Experience of Immersive Virtual Reality: A Phenomenology-Inspired Inquiry* (2023); Lin et al. *The Impact of Virtual
Reality on Student Engagement* (2024); Lindley & Nacke *Flow and Immersion in First-Person Shooters* (`Nacke, L. and Craig, L.…`).

**Strand G — Books / edited volumes (chapter-selective deep read).**
Cykowski *Heidegger's Metaphysical Abyss: Between the Human and the Animal* (2021, 199pp monograph); Hadjioannou (ed.) *Heidegger on
Affect* (2019, 321pp edited volume). Treat each as **one unit** but read **chapter-selectively** — extract only the boredom/FCM
material (Cykowski's boredom + animal-poverty chapters; the *Heidegger on Affect* chapters on boredom/mood/attunement). Cap edges as
for the long theses.

## 1B. De-duplication & haystack rules (apply in Phase 0 — do NOT create units for these)

| File on disk | Disposition | Reason |
|---|---|---|
| `Review_of_eye_tracking_metrics…v3 (1).pdf` | **DROP** | byte-identical (md5) to `…v3.pdf`. Keep the non-`(1)` copy → `bor-sec` Strand E. |
| `Intelligent Tutoring Systems.pdf` (727pp) | **DROP as a unit** | byte-identical (md5) to `Predicting Affect from Gaze Data….pdf`, which is the single extracted paper. Analyze the single-paper file only. |
| `Human Computer Interaction - 2019.pdf` (781pp) | **HAYSTACK — extract 1 paper** | Full INTERACT 2019 proceedings. The relevant paper is **"GazeMotive: A Gaze-Based Motivation-Aware E-Learning Tool."** Extract that paper's pages with `pdftotext -f <first> -l <last>` after locating it, analyze as one Strand-E unit `bor-sec-…-gazemotive`; ignore the rest. If GazeMotive cannot be cleanly isolated, create the unit as a `map`-depth stub and flag `HAYSTACK-UNRESOLVED`. |
| `Yakobi - …reduced… (2021).pdf` **and** `Yakobi, Ofir et al - …reduce… (2021).pdf` | **MERGE → 1 unit** | different md5 but same study (preprint vs published). Analyze the **`Yakobi, Ofir et al`** (published) file; note the second as `dup-variant` in the unit JSON. |

Net: 49 files − 2 exact-dups − 1 proceedings-dup − 1 Yakobi-merge − (GazeMotive extracted from the 781pp file, +1) = **~44 analytical units**
(the 781pp proceedings yields 1 unit, not 0). Confirm the exact count in `phase0-overview.md`.

## 1C. Authoritative unit table (assign at Phase 0; fill `pp` from pdfinfo already run)

Numbering: group by strand for legibility, zero-padded, `-00-` reserved for the overview. Slugs = first-author surname (lowercase).
Sonnet: build this table verbatim into `manifest.json`. Folder names follow the RDR2 precedent
(`<Author> - <Short Title> (<Year>)`). Two examples fully spelled; replicate the pattern for all:

- `bor-sec-00-corpus-overview` (overview unit, no folder — lives in `_synthesis/` conceptually; emit as `units/bor-sec-00-corpus-overview.md`).
- `bor-sec-01-slaby-other-side` — folder `Slaby - The Other Side of Existence (2010)/` → `bor-sec-01-slaby.{md,json}` + `bor-sec-01-slaby-edges.csv`.

Assign `bor-sec-01…44` across strands A→G in the order listed in §1A. Record for each: `id, slug, folder, author, year, title, pp,
strand (A–G), depth`. **Depth rubric:** `deep` (journal article / chapter, full read); `deep-long` (monograph/edited volume/long
review — chapter-selective, cap edges); `map` (≤10pp or a stub/haystack-derived, lighter pass). Books (Cykowski, Hadjioannou) =
`deep-long`. Aho (3pp), Elpidorou *Boredom as a Concept* (8pp), Lin (8pp), Miyauchi (6pp), Clark & Hassert (3pp) = `map` or short-`deep`.

---

## 2. Folder layout (create exactly this)

```
corpus/index/Boredom Secondary (Part III)/
├── _synthesis/
│   ├── manifest.json
│   ├── phase0-overview.md
│   ├── cluster-ontology.{md,json}              # dedup concepts/constructs; .md has the compiler node-list (§5)
│   ├── global-edges.csv                        # all per-unit edges concatenated + deduped
│   ├── debate-map.{md,json}                    # cross-source disagreements (see §4 seeds)
│   ├── concept-matrix.csv                      # source × construct presence
│   ├── contested-readings.md
│   ├── citation-network.{md,json}              # who cites whom within the cluster
│   ├── boredom-construct-measure-concordance.{md,json}   # *** the primary-object anchor (see §3) ***
│   ├── boredom-secondary-literature-network.{md,json}    # external hubs: Heidegger, Eastwood/Danckert, Elpidorou, Csikszentmihalyi…
│   ├── boredom-terminology-appendix.{md,json}  # construct + method lemmas (see §4)
│   ├── boredom-scholarly-evolution.md          # thematic, not generational (2001–2025)
│   └── graph-{citation-network,concept-debate,discipline-cluster,construct-measure-density,cross-pipeline-bridge}.mmd
├── bridge-sources/
│   └── anchor-pointers.md                      # pointers to FCM units + the Boredom Experiment dataset entry; NO re-digest
├── Slaby - The Other Side of Existence (2010)/  bor-sec-01-slaby.{json,md}  bor-sec-01-slaby-edges.csv
├── …                                            (one folder per unit, bor-sec-01 … bor-sec-44)
└── units/
    └── bor-sec-00-corpus-overview.md
```

## 3. The concordance — this cluster's primary-object anchor (§3 is the payoff)

Where the RDR2 cluster concords sources to *game elements* and the phantasia cluster to *Aristotle's Bekker loci*, this cluster
concords sources to a **two-axis grid**: (i) **boredom constructs** and (ii) **physiological / behavioral measures**. This grid is
exactly what makes the philosophy↔hard-science reading legible, and it is what Part III cites.

**Construct axis (rows — canonical labels; normalize each source's own term to these):**
`profound/deep boredom (FCM 3rd form)` · `being-bored-by (1st form)` · `being-bored-with (2nd form)` · `situational vs. trait/state
boredom` · `boredom proneness` · `mind-wandering / task-unrelated thought` · `attentional disengagement / meta-awareness` ·
`boredom-as-regulatory-signal (functional account)` · `flow / engagement (contrast pole)` · `monotony / meaninglessness` ·
`temporality of boredom (time-drag)`.

**Measure axis (columns — canonical labels):**
`EEG frontal alpha asymmetry` · `EEG alpha/theta power` · `EEG functional connectivity` · `EEG eyes-open vs eyes-closed` ·
`pupil dilation / pupillometry` · `gaze variance / fixation dispersion` · `blink / eye-closure` · `heart rate / HRV` ·
`self-report / survey scale` · `behavioral (RT / errors / performance-monitoring)` · `predictive-processing model` ·
`ML classification`.

Each cell = the source(s) that treat that construct with that measure, with a page anchor and a one-line note. The `.md` renders as a
matrix; the `.json` is `{construct, measure, sources:[{id, locus, note}]}`. **This concordance is the seam to both anchors:** rows map
to FCM units; columns map to the Boredom Experiment dataset channels.

## 4. Controlled vocabulary (cluster-adapted)

- **Object types:** `CONSTRUCT` (a boredom concept) · `MEASURE` (an EEG/eye-tracking/self-report signal) · `READING/CLAIM` ·
  `THEORY-MODEL` (e.g. predictive-processing, MAC model, regulatory account) · `THEME` · `DEBATE-AXIS` · `INTERLOCUTOR` (an
  external hub author) · `AUTHOR` (this cluster) · `TERM` · `FCM-NODE` (a bridge target) · `DATASET-CHANNEL` (a bridge target).
- **Edge relations:** standard (`defines, cites, extends, contests, concedes, qualifies, instances-in-text`) + cluster
  (`cites-cluster-author, contests-reading-of, extends-reading-of, shifts-debate-axis`) + **primary-object**
  (`treats-construct`, `operationalizes-measure`, `construct-measured-by`) + **bridge** (`bridges-to-fcm` → an FCM unit;
  `grounds-measure` → a Boredom Experiment dataset channel; `bridges-to-part-iii` → the dissertation, tagged `anticipatory-application`).
- **Themes (axis seeds):** phenomenology of mood/attunement · boredom & education / student disengagement · functional vs.
  pathological boredom · attention & mind-wandering · neurophysiological signatures · eye-tracking methodology · VR/immersion &
  engagement · temporality & meaning · technology/digital-Gestell & boredom.
- **Debate axes (seeds — target 8–12 documented):** boredom-as-deficit ↔ boredom-as-functional/adaptive (Elpidorou's regulatory
  good vs. deficit accounts) · profound boredom *is* boredom ↔ profound boredom is a distinct existential mood (Elpidorou & Freeman
  *Is Profound Boredom Boredom?* vs. Heideggerians) · boredom as unified construct ↔ heterogeneous family (Raffaelli review) ·
  self-report ↔ physiological-marker as ground truth · EEG frontal-asymmetry-as-boredom-marker ↔ confound-with-arousal · situational
  ↔ trait framing · monotony/environment-caused ↔ meaning/agent-caused.

## 5. Five-phase pipeline (cluster-adapted; the executable core)

**Phase 0 — overview + de-dup + haystack resolution.**
1. Run `pdftotext` on every source in `corpus/boredom/` to a scratch dir (`/tmp/.../boredom-txt/`), one `.txt` per source. **This is
   mandatory** — give downstream agents the `.txt` path, never the PDF (avoids image-payload cost and the API-400 multi-page-image
   issue). Note any source whose `.txt` is near-empty → `OCR-LOW` flag (image-only scan; fall back to `Read` on the PDF, ≤10pp at a time).
2. Apply §1B de-dup/haystack rules. For the 781pp INTERACT file, locate "GazeMotive" (grep the `.txt` for the title, find its page
   range, re-extract with `-f/-l`).
3. Write `phase0-overview.md` (cluster profile; the six strands; the humanities/STEM split; external citation-hub guesses —
   Heidegger, Elpidorou, Eastwood & Danckert, Csikszentmihalyi, Mann & Robinson; OCR audit; final unit count) and `manifest.json`
   (the §1C unit table + `themes`, `debate_axes`, `crossPipelineTargets`, `excluded`/`deduped`).

**Phase 1 — per-source metadata** (`bor-sec-NN-<slug>.json`, header fields only): bib header, author/discipline, strand (A–G),
abstract paraphrase (≤60 words, no verbatim), section structure, **expected constructs treated**, **expected measures
operationalized**, expected interlocutors, `bridges-to-fcm` candidates, `grounds-measure` candidates, OCR confidence.

**Phase 2 — deep per-source** (one agent per unit; **two-pass** on the 2 books + long reviews). Each unit emits three files:
- `bor-sec-NN-<slug>.md` — paraphrastic synthesis (**humanities units 1,500–3,500w; STEM units 1,000–2,500w**; **no ≥25-word
  verbatim** — all copyrighted; anchor-phrases ≤12 words + page). Sections: header line (type/discipline/depth/corpus-role) →
  Thesis/Aim → Structure → Constructs → Measures & methods (STEM) *or* Reading of FCM (humanities Strand A/B) → Findings/Claims →
  Constructs-treated & Measures-operationalized (the concordance feed) → Analytical role (links to FCM units + dataset channels +
  Part III, the last tagged `anticipatory-application`).
- `bor-sec-NN-<slug>.json` — mirror of the RDR2 unit JSON: `{id, slug, citation, discipline, strand, depth, thesis, sections,
  constructs[], measures[], readings[], concepts[], interlocutors[], tensions[], bridges:{fcm:[...], dataset_channels:[...]},
  extraction:{tool, date, ocr_confidence}}`. STEM units: populate `measures[]` richly (signal, apparatus, sample N, key result).
- `bor-sec-NN-<slug>-edges.csv` — columns `source,relation,target,locus,note`. **Edge floors:** short/`map` ≥12 · `deep` ≥20 ·
  `deep-long` ≥35. Every unit must carry ≥1 `treats-construct` and (STEM) ≥1 `operationalizes-measure`; humanities Strand-A units
  must carry ≥1 `bridges-to-fcm` (to a specific `fcm-0N` unit).

**Phase 3 — cluster synthesis** (author in-loop for quality; waves):
- **3A** `cluster-ontology.{md,json}` — dedup constructs/measures/readings into canonical nodes; the `.md` carries the compiler
  node-list (see §5-compiler below).
- **3B** `global-edges.csv` (concat + dedup all unit edges) + `debate-map.{md,json}` (8–12 documented disagreements from §4 seeds,
  each with the sources on each pole + a resolution note).
- **3C** `concept-matrix.csv` (source × construct presence) + `contested-readings.md`.
- **3D** `boredom-construct-measure-concordance.{md,json}` (§3 — the anchor) + `boredom-terminology-appendix.{md,json}` (≥50 lemmas:
  constructs, measures, models, Heideggerian terms). Concordance must map **every construct row to ≥1 FCM node** and **every measure
  column to ≥1 dataset channel** where one exists (else `****** UNVERIFIED:` if the dataset entry isn't built yet).
- **3E** `citation-network.{md,json}` (intra-cluster) + `boredom-secondary-literature-network.{md,json}` (external hubs). Then the 5
  Mermaid graphs + `boredom-scholarly-evolution.md` (thematic arc: existential-phenomenology → functional psychology → neuro/eye
  operationalization → VR/education application).

**Phase 4 — cross-pipeline integration + bridge-sources.** Write `bridge-sources/anchor-pointers.md`: a table pointing each relevant
unit at (a) the FCM units it reads and (b) the Boredom Experiment dataset channel it grounds — **pointers only, no re-digest** (model
on `.../VLE/bridge-sources/paper-digest-pointers.md`). Build `graph-cross-pipeline-bridge.mmd` (hard cap **≤25 edges**) linking the
cluster to FCM, the dataset entry, and Part III. All bridge edges tagged `anticipatory-application`.

## 6. Compiler wiring (Phase 5 — do LAST, then GATE)

Add one dict entry to `TEXT_DIRS` near the top of `scripts/compile-corpus-index.py` (the list runs ~lines 35–103):
```python
    "Boredom Secondary (Part III)": {
        "label": "Boredom Secondary (Part III)",
        "ontology_format": "header",
        "analysis_subdir": "_synthesis",
    },
```
The parser reads the `## 3A. Canonical Node List` section of `_synthesis/cluster-ontology.md` in **header format**
(`#### N. Name` + `- **key**: value` bullets) — replicate FCM's `book-level-ontology.md` structure exactly. Then run
`python3 scripts/compile-corpus-index.py`; **verify node counts in `corpus/index/compiled-index.json` (do not assume)**; re-run the
repo's verbatim-quote detector. **GATE G1 — show the `TEXT_DIRS` diff + the compiled node/term counts + one sample unit trio, and
WAIT for user sign-off before committing** (per the await-manual-verification discipline). Take a timestamped backup of
`compile-corpus-index.py` and `compiled-index.json` into `.backups/` before editing.

## 7. Orchestration (for the executing model)

- **Use the Agent tool, not Workflow** (no Workflow opt-in). Budget: 1 (Phase 0) + 44 (metadata, batchable) + 44 (deep) + ~6
  (synthesis waves, author in-loop) agents. Batch metadata agents in groups; the two books get dedicated two-pass agents.
- **Reliability lesson (Wendt/RDR2 builds):** the pre/post-task hook intermittently no-ops a subagent (~1/8). Mitigation: pre-extract
  every source to `.txt` in Phase 0, give agents that path, **harvest successes + self-author any gaps**, and verify all three files
  exist on disk for every unit before starting synthesis.
- Give each deep agent: the source `.txt` path, its `bor-sec-NN` id/slug/strand/depth, the §4 controlled vocabulary, the §3
  concordance axes, the edge floors, and the bridge targets (FCM unit list + dataset channel list). Author the synthesis layer
  (ontology, debate-map, concordance, evolution) yourself, not via subagents.

## 8. Quality gates (must hold before "done")

- [ ] ~44 units, each with `.md` + `.json` + `-edges.csv` present on disk (no silent gaps); de-dup/haystack rules from §1B applied and recorded.
- [ ] ≥ **550** deduplicated global edges · **8–12** documented debates · **8–12** contested readings · ≥ **50** terminology lemmas · ≥ **10** intra-cluster citations.
- [ ] **Concordance complete:** every construct row → ≥1 FCM node; every measure column → ≥1 dataset channel (or explicit `****** UNVERIFIED:` if dataset entry unbuilt); every unit appears in ≥1 concordance cell.
- [ ] Every Strand-A/B unit carries ≥1 `bridges-to-fcm` edge to a specific `fcm-0N` unit; every Strand-D/E unit carries ≥1 `grounds-measure` edge.
- [ ] **No ≥25-word verbatim** from any source (paraphrase + ≤12-word anchor + page); provenance tags present (`FE`/`FAITHFUL`/`P`/`anticipatory-application`), every bridge/cross-pipeline claim tagged `anticipatory-application`.
- [ ] 5 Mermaid graphs render; cross-pipeline graph ≤25 edges.
- [ ] `cluster-ontology.md` has a parseable `## 3A. Canonical Node List`; `compile-corpus-index.py` runs clean; `compiled-index.json` counts verified; verbatim detector clean.
- [ ] Timestamped backup taken before editing any tracked file; **GATE G1 sign-off obtained before commit.**

## 9. Decisions to confirm (reasoned recommendations — push back freely)

1. **Scope:** the ~44 units in §1A after the §1B de-dup. *Recommend as listed.* Confirm the two big books (Cykowski 199pp,
   Hadjioannou 321pp) are **in** as chapter-selective `deep-long` units (recommend yes — both are core Heidegger-affect/boredom).
2. **Folder name / prefix:** `Boredom Secondary (Part III)` · `bor-sec-`. (Alt: `Boredom Secondary Literature`.) *Recommend as given.*
3. **Concordance anchoring:** the construct×measure grid (§3) as the primary-object anchor, rows→FCM nodes, columns→dataset channels.
   *Recommend* — this is what makes the philosophy↔hard-science reading legible and directly serves Part III.
4. **Cross-pipeline (Phase 4) active** now, bridging FCM (read-only) + the Boredom Experiment dataset entry + Part III. *Recommend.*
   If the dataset entry isn't built yet, leave dataset bridges as flagged `****** UNVERIFIED:` pointers rather than blocking.
5. **GazeMotive extraction** from the 781pp INTERACT proceedings as the one salvaged unit; drop the ITS proceedings dup. *Recommend.*
6. **compiled-index.json:** built via the compiler at Phase 5 (not hand-edited); GATE G1 before commit.

## 10. Key paths

- Source PDFs: `corpus/boredom/` · scratch text: `/tmp/claude-.../scratchpad/boredom-txt/`
- FCM anchor entry: `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/` (units `fcm-04..07`; ontology `_synthesis/book-level-ontology.md`)
- Dataset anchor entry (target of `grounds-measure`): `corpus/index/Boredom Experiment (VR Attention Study)/` (per `plans/boredom-experiment-index-entry-plan-v2-2026-07-11.md`)
- Structural precedents: `corpus/index/Red Dead Redemption 2 Secondary (2019-2023)/` (unit `.md`/`.json`/`-edges.csv` shape, `_synthesis/`) · `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/`
- Bridge-pointer precedent: `.../Virtual Learning Environments (King–Salvo)/bridge-sources/paper-digest-pointers.md`
- Compiler: `scripts/compile-corpus-index.py` (`TEXT_DIRS` ~lines 35–103) · output `corpus/index/compiled-index.json`
- Prior plans to mirror: `plans/rdr2-secondary-cluster-analysis.md`, `plans/phantasia-cluster-2025-analysis.md`
