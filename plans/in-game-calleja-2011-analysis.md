# Analysis Plan: Gordon Calleja — *In-Game: From Immersion to Incorporation* (MIT Press 2011)

**File**: `corpus/new_media/Calleja, Gordon - In-Game- From Immersion to Incorporation_(2011)_[My Copy].pdf`
**Pages**: 224 PDF pages
**Offset**: book p. *n* = PDF p. *n* (verified on Ch.3 / Ch.6 / Ch.10 / Conclusion / Appendix / Notes / References / Index landmarks — front matter already trimmed in this PDF)
**Date**: 2026-05-11
**Output root**: `corpus/index/In-Game (Calleja 2011)/`

**Plan version**: v3 (2026-05-11 — Uexküll Layer C + Gibson forward-reference added)

**User-locked decisions (2026-05-11)**:
- Calleja's PIM + Incorporation = **the dissertation's analytical instrument** for analyzing games (not merely an object of catalog). Pipeline output must be capture-grade and dissertation-deployable, not summary-grade.
- Dissertation will augment Calleja's model with (a) the user's existing **Aristotle + Heidegger ontological framework** (corpus indices: Phantasia Cluster, BCAP, Bowin AMT, dissertation chapters); (b) **Kenneth Burke's dramatistic pentad** (Act / Scene / Agent / Agency / Purpose [+ Attitude]); AND (c) **Jakob von Uexküll's functional circle** (*Funktionskreis*), **perception-tones / effect-tones** (*Merktöne* / *Wirktöne*), and **Umwelt** (corpus index: Uexküll *Foray into the Worlds of Animals and Humans*).
- Q1 Appendix → full unit with full edge target (≥35).
- Q2 Games-cited concordance → maximal coverage (target ≥50), Tier-A entries with per-dimension analytic-move capture.
- Q3 Pre-Calleja immersion debate-map → cap at 10 (was 8) if available.
- Q4 PIM operationalization manual → produced now, with Section E (Burke + ontological-grounding anticipation) added.

---

## 1. Why this work, why now

1. **First new-media / game-studies pipeline in the corpus.** Prior corpus folders all sit in `rhetorical_ontology/` (phenomenology, rhetoric, philosophy of mind, history of emotions). Calleja sits in `corpus/new_media/` — opening a new disciplinary axis.
2. **The dissertation's methodological instrument for game analysis.** Calleja's six-dimensional Player Involvement Model (kinesthetic, spatial, shared, narrative, affective, ludic) + Incorporation is what the dissertation will WIELD on games, not merely cite. The pipeline must produce a *dissertation-deployable* artifact (the PIM Operationalization Manual) — boundary criteria, decision rules, paradigm worked examples, application checklist. The Appendix and Tier-A games-cited concordance are training-data for the dissertation's empirical adaptation.
3. **Anticipates three augmentation layers** the dissertation will add to Calleja:
   - Layer A: **Aristotle + Heidegger ontological substrate** (already-indexed Phantasia Cluster + Heidegger BCAP + Bowin AMT). Each PIM concept gets a `dissertation_ontological_target` field pointing to its Aristotelian/Heideggerian grounding candidate.
   - Layer B: **Kenneth Burke's dramatistic pentad** (Act / Scene / Agent / Agency / Purpose + Attitude) as supplementary analytic resolution. Each PIM dimension gets candidate pentad-term mappings (e.g. *kinesthetic → Agency*, *spatial → Scene*, *ludic → Purpose+Act*). Burke's "consubstantiation"/"identification" flagged as candidate theoretical complement to Calleja's "incorporation."
   - Layer C: **Uexküll's biosemiotic framework** — *Funktionskreis* (functional circle: perception-marker → effect-marker → object → perception-marker, the proto-affordance loop), *Merktöne* / *Wirktöne* (perception-tones / effect-tones — qualitative coloring of perceived objects), and *Umwelt* (subjectively-constituted environment). Provisional mappings: Spatial → *Umwelt*; Kinesthetic → *Funktionskreis*; Affective → *Merktöne/Wirktöne*. Uexküll is also Gibson's upstream source — if Calleja cites Gibson, the Uexküll bridge is doubly anchored.
4. **Concept-bridge density to existing pipelines:**
   - **Phantasia Cluster** — Calleja's "spatial involvement" + "mental simulation" claims invoke imagery/phantasma operations; cross-pipeline bridges expected especially to Hawhee (rhetorical vision) and Papachristou (deliberative *phantasia*). Hawhee's *Moving Bodies: Kenneth Burke at the Edges of Language* (2009) is the existing Burke anchor in the corpus.
   - **Uncomfortable Situations (Gross 2017)** — Calleja's "affective involvement" maps onto Gross's situated-emotion theory; Calleja almost certainly cites J. J. Gibson (affordances) — same Gibson anchor as Gross's Radcliffe chapter
   - **Heidegger BCAP / Bowin AMT** — Calleja's temporal-phase distinction (macro = off-line; micro = moment-to-moment) parallels phenomenological time-analysis; this is one of the strongest dissertation-bridge candidates
5. **Pedagogically clean structure.** Calleja built the book on his King's College London qualitative-research dissertation; the Appendix ("A Tale of Two Worlds") describes the *World of Warcraft* + *Planetside* case-study corpus. This methodological transparency makes the Appendix a foundational seed for the dissertation's empirical adaptation chapter — hence FULL-UNIT treatment with full edge target.

---

## 2. Volume profile

| Item | Value |
|---|---|
| Author | Gordon Calleja |
| Affiliation (2011) | Center for Computer Games Research, IT University of Copenhagen |
| Publisher | MIT Press |
| Year | 2011 |
| Body pages | 186 (book pp. 1–186 = Intro through Conclusion) |
| Appendix | 14 pp. (book pp. 187–200) — qualitative research methodology + *World of Warcraft* + *Planetside* case profiles |
| Notes | 4 pp. (book pp. 201–204) |
| References | 14 pp. (book pp. 205–218) — substantial bibliography |
| Index | 6 pp. (book pp. 219–224) |
| Units | **12** (Intro + 10 numbered chapters + Conclusion + Appendix) |
| OCR confidence (preliminary) | High — MIT Press production typography, clean TOC, no rotated pages observed |

### 2.1 Chapter / unit table (verified offsets)

| Unit ID | Heading | Book pp. | PDF pp. | Role in argument |
|---|---|---|---|---|
| IG-00-INTRO | Introduction | 1–6 | 1–6 | Problem statement: immersion + presence terms are conflated and imprecise; book proposes *incorporation* as replacement |
| IG-01-GAMES | Games Beyond Games | 7–16 | 7–16 | Game studies' three traditional axes (formal / experiential / sociocultural); Wittgensteinian family-resemblance approach |
| IG-02-IMMERSION | Immersion | 17–34 | 17–34 | Literature review and critique of "immersion" — Murray 1997, Ryan 2001, McMahan 2003, Brown & Cairns 2004, presence theory (Lombard, Witmer, Slater) |
| IG-03-MODEL | The Player Involvement Model | 35–54 | 35–54 | **CENTRAL CHAPTER** — introduces 6-dimensional model + macro/micro temporal-phase distinction; this is the volume's load-bearing theoretical apparatus |
| IG-04-KINESTHETIC | Kinesthetic Involvement | 55–72 | 55–72 | Dimension 1: bodily action, control schemes, motor learning |
| IG-05-SPATIAL | Spatial Involvement | 73–92 | 73–92 | Dimension 2: virtual-environment habitation; navigation; place-vs-space |
| IG-06-SHARED | Shared Involvement | 93–112 | 93–112 | Dimension 3: social co-presence with other players (NOT "Share" — TOC typo) |
| IG-07-NARRATIVE | Narrative Involvement | 113–134 | 113–134 | Dimension 4: scripted-narrative + alterbiography (emergent narrative) |
| IG-08-AFFECTIVE | Affective Involvement | 135–146 | 135–146 | Dimension 5: emotion in gameplay; bridges directly to Gross 2017 Uncomfortable Situations |
| IG-09-LUDIC | Ludic Involvement | 147–166 | 147–166 | Dimension 6: rules, goals, agency, choice |
| IG-10-INCORPORATION | From Immersion to Incorporation | 167–180 | 167–180 | Synthesis chapter — the titular argument: replace "immersion" with "incorporation" as primary theoretical frame |
| IG-11-CONCLUSION | Conclusion | 181–186 | 181–186 | Methodological reflection + future-research agenda |
| IG-APX | Appendix: A Tale of Two Worlds | 187–200 | 187–200 | *World of Warcraft* + *Planetside* case profiles + qualitative methodology |
| IG-NOTES | Notes | 201–204 | 201–204 | Endnotes by chapter |
| IG-REFS | References | 205–218 | 205–218 | Bibliography (substantial — expect ≥200 entries) |
| IG-INDEX | Index | 219–224 | 219–224 | Back-of-book index |

---

## 3. Folder layout (per `<Author> - <Short Title>` subfolder convention)

```
corpus/index/In-Game (Calleja 2011)/
├── _synthesis/
│   ├── manifest.json
│   ├── phase0-overview.md
│   ├── book-level-ontology.{md,json}
│   ├── global-edges.csv
│   ├── tension-edges.json
│   ├── concept-matrix.csv               # 12 units × ~35 concepts
│   ├── contested-nodes.md
│   ├── ig-pim-operationalization-manual.{md,json}    # CORE DELIVERABLE: dissertation-deployable methodology manual (Sections A-E)
│   ├── ig-games-cited-concordance.{md,json}    # Maximal coverage (≥50 games); Tier-A entries with per-dimension analytic-move capture
│   ├── ig-immersion-vs-incorporation-debate-map.{md,json}   # cap at 10 pre-Calleja models
│   ├── ig-bibliography-extracted.{md,json}
│   ├── ig-interlocutor-map.{md,json}
│   ├── ig-terminology-appendix.{md,json}
│   ├── ig-graph-global.mmd
│   ├── ig-graph-involvement-model.mmd
│   ├── ig-graph-temporal-phase-arc.mmd
│   ├── ig-graph-games-cited-network.mmd
│   └── ig-graph-cross-pipeline-bridge.mmd
├── Calleja - Introduction (In-Game)/                 # IG-00
├── Calleja - Games Beyond Games/                     # IG-01
├── Calleja - Immersion (Lit Review)/                 # IG-02
├── Calleja - The Player Involvement Model/           # IG-03
├── Calleja - Kinesthetic Involvement/                # IG-04
├── Calleja - Spatial Involvement/                    # IG-05
├── Calleja - Shared Involvement/                     # IG-06
├── Calleja - Narrative Involvement/                  # IG-07
├── Calleja - Affective Involvement/                  # IG-08
├── Calleja - Ludic Involvement/                      # IG-09
├── Calleja - From Immersion to Incorporation/        # IG-10
├── Calleja - Conclusion (In-Game)/                   # IG-11
└── Calleja - Appendix (Tale of Two Worlds)/          # IG-APX
```

---

## 4. Controlled vocabulary (cluster-specific extensions)

### 4.1 Object types

| Type | Description | Examples |
|---|---|---|
| CONCEPT | Volume-level concept | "incorporation", "involvement", "macro-phase", "micro-phase", "virtual environment habitation", "alterbiography" |
| POSITION | Authored stance | "Calleja: incorporation displaces immersion as primary theoretical frame" |
| INVOLVEMENT-DIMENSION | One of the 6 axes | KINESTHETIC, SPATIAL, SHARED, NARRATIVE, AFFECTIVE, LUDIC — first-class object type |
| TEMPORAL-PHASE | Macro / micro | First-class type — pervasive in the book |
| GAME-LOCUS | A specific game cited in Calleja's analysis | *World of Warcraft* (Blizzard 2004), *Planetside* (SOE 2003), *Half-Life 2*, *Tomb Raider*, *Tetris*, *Civilization*, *EverQuest*, *Counter-Strike*, etc. |
| INTERLOCUTOR | Cited theorist | Murray (1997), Ryan (2001), Aarseth (1997), Juul, Salen + Zimmerman, McMahan, Gibson, Tronstad, Brown + Cairns, Slater, Witmer, Lombard |
| METHODOLOGICAL-ANCHOR | Qualitative-research element | semi-structured interview, *WoW* case profile, *Planetside* case profile, ethnographic observation, Wittgensteinian family resemblance |
| PRE-CALLEJA-IMMERSION-MODEL | A specific immersion-account Calleja critiques | Murray's "deep immersion"; Ryan's "spatial / temporal / emotional immersion"; presence-theory immersion (Lombard); flow theory (Csikszentmihalyi); McMahan's "perceptual / psychological immersion" |
| BURKE-PENTAD-TERM | Burke 1945 dramatistic term (anticipatory tagging) | Act, Scene, Agent, Agency, Purpose, Attitude |
| UEXKULL-CONSTRUCT | Uexküllian biosemiotic construct (anticipatory tagging) | *Funktionskreis* (functional circle), *Merkmal/Merkträger* (perception-marker / mark-bearer), *Wirkmal/Wirkträger* (effect-marker / effect-bearer), *Merkwelt / Wirkwelt*, *Merktöne / Wirktöne* (perception-tones / effect-tones), *Umwelt*, *Umweltforschung* |
| ONTOLOGICAL-GROUNDING-CANDIDATE | Aristotelian/Heideggerian/Uexküllian construct that anchors a PIM concept (anticipatory tagging) | *phantasia*-spatial-imagery + Uexküll *Umwelt* (Spatial); *aisthesis-kinesis* + Uexküll *Funktionskreis* (Kinesthetic); BCAP *Mitsein* (Shared); *muthos*/emplotment (Narrative); Aristotle *pathē* + Gross 2017 + Uexküll *Merktöne/Wirktöne* (Affective); *phronesis*+deliberative *phantasia* (Ludic); macro/micro temporal phase ↔ BCAP/Bowin time-perception |

### 4.2 Edge relations — corpus-standard 11 + 2 new

Standard: `defines`, `cites`, `extends`, `contests`, `concedes`, `qualifies`, `bridges-to-pipeline`, `instances-in-text`, `glosses-greek`, `glosses-german`, `marginal-note`.

**New for this pipeline**:

| Relation | Description |
|---|---|
| `operationalizes-via-game` | Calleja uses a specific game (GAME-LOCUS) to demonstrate a concept |
| `replaces-prior-construct` | Calleja's term explicitly displaces a prior construct (e.g. `incorporation replaces-prior-construct immersion-Murray`) |
| `maps-to-pentad-term` | Anticipatory: a PIM concept maps to a Burke pentad term in the dissertation's planned augmentation |
| `awaits-ontological-grounding-in` | Anticipatory: a PIM concept's planned Aristotle/Heidegger grounding target (links to existing corpus indices) |

### 4.3 Edge domains — corpus-standard + 4 new

Add: `game-studies`, `virtual-worlds-theory`, `presence-research`, `qualitative-game-research-methods`.

### 4.4 Centrality tiers
Tier-1 (volume pillar) / Tier-2 (chapter-central) / Tier-3 (supporting) — standard.

---

## 5. Five-phase pipeline

### Phase 0 — Volume overview
1 agent, sequential. Produces `phase0-overview.md` (~5–6K words) + `manifest.json`. Special tasks:
- Verify offset on additional landmarks (done above)
- Mine `References` (book pp. 205–218) for full bibliography seed
- Mine `Index` for terminology / interlocutor seed
- **Pre-tag the 6-dimensional involvement model as the canonical spine** — all unit metadata must reference which dimension(s) the chapter operationalizes
- Identify OCR alerts (none expected — MIT Press production)
- **Calleja-cites-Burke check**: search References + Index for Kenneth Burke. Flag presence/absence. If absent, the dissertation's pentad augmentation is *creative*, not *exegetical*.
- **Calleja-cites-Heidegger/Aristotle check**: search for Heidegger, Aristotle, Merleau-Ponty, Gibson. Affordance theory (Gibson) almost certainly present — confirm; bridges to Gross 2017 Radcliffe chapter.
- **Calleja-cites-Uexküll check**: search References + Index for Uexküll, Funktionskreis, Merkwelt, Wirkwelt, Umwelt, perception-tone, effect-tone, biosemiotics. Even if Uexküll not direct-cited, the Gibson citation is a downstream proxy (Gibson built on Uexküll). Flag both possibilities — direct (exegetical bridge) vs. indirect via Gibson (mediated bridge).
- Map cross-pipeline bridge candidates explicitly:
  - Phantasia Cluster (esp. Hawhee rhetorical vision; Papachristou deliberative phantasia; Hawhee's *Moving Bodies* Burke anchor)
  - Uncomfortable Situations (Ch. IG-08 Affective ↔ US Berlant/Barrett/Barsalou; shared Gibson anchor)
  - Heidegger BCAP (Ch. IG-03 macro/micro temporal phase ↔ BCAP phenomenology of time)
  - Bowin AMT (time-perception backdrop)
  - **Uexküll *Foray*** (Spatial ↔ *Umwelt*; Kinesthetic ↔ *Funktionskreis*; Affective ↔ *Merktöne/Wirktöne*) — strong bridges to Layer C augmentation; doubly-anchored if Calleja cites Gibson
  - Dalton dissertation (virtual-worlds adaptation target — every IG concept becomes a candidate operationalizable construct)
  - Kenneth Burke (1945, *A Grammar of Motives*) — anticipatory bridge for dissertation pentad augmentation

### Phase 1 — Per-unit metadata
12 unit metadata files (`ig-NN-<slug>.json`), in 4 parallel batches of 3. Each carries:
- bibliographic spine, section structure (verify internal headings per chapter — Calleja uses titled subsections), expected GAME-LOCUS list, expected dimension(s), expected interlocutors, OCR confidence

### Phase 2 — Deep per-unit analysis
12 parallel agents (background). Each produces:
- **JSON**: outline (page-anchored), concepts ≥15, positions ≥4, dimension-tags (which of the 6 dimensions this chapter develops), game_loci ≥5 per chapter (Ch.4–9 ≥10), interlocutors ≥10, tensions ≥2, edges
- **Markdown**: paraphrastic narrative 2,500–5,500 words; sections include explicit "dimension operationalization" paragraph and "cross-pipeline bridges" paragraph
- **Edges CSV**: target counts — Intro/Conclusion ≥20; chapters ≥35; centerpiece Ch.3 + Ch.10 ≥45

**Special agent guidance**:
- **IG-03 (Player Involvement Model)** — triple-pass + **operationalization extraction** (capture-grade, not summary-grade):
   1. Outline + concepts + edges (standard)
   2. Macro/micro temporal-phase distinction in full + all 6 dimensions' operational definitions (≤60 words each)
   3. Boundary criteria for each dimension (4–6 features Calleja uses to distinguish dimensions when they overlap, e.g. spatial vs. kinesthetic in *Half-Life 2*); decision rules for ambiguous cases; evidence-source per criterion (interview / observation / theoretical inference)
- **IG-10 (From Immersion to Incorporation)** — triple-pass + **operationalization extraction**:
   1. Standard outline + concepts + edges
   2. Full *replaces-prior-construct* mapping (each of ≤10 prior immersion-models → what incorporation absorbs / replaces / refuses)
   3. Incorporation rubric: identify the 4–6 components Calleja identifies as constitutive of incorporation; how each maps onto the 6 dimensions; what differentiates "incorporated" from "merely involved" play
- **IG-04 through IG-09 (six dimension chapters)** — each agent must produce: (a) explicit "dimension operationalization" paragraph in .md; (b) paradigm worked examples from the chapter (5–8 games per dimension with Calleja's analytic-move described); (c) candidate Burke-pentad-term mapping (anticipatory, flagged as *projected* not *exegetical*); (d) candidate ontological-grounding target from Aristotle/Heidegger corpus indices; (e) **candidate Uexküllian-construct mapping** (Funktionskreis / Merktöne / Wirktöne / Umwelt — anticipatory, flagged as *projected*; Spatial chapter IG-05 + Kinesthetic IG-04 + Affective IG-08 carry the strongest expected mappings)
- **IG-02 (Immersion lit review)** — dense citation chapter; capture **up to 10** PRE-CALLEJA-IMMERSION-MODEL entries with citation + critique anchor (recommended set: Murray, Ryan, McMahan, Brown+Cairns, Lombard, Witmer, Slater, Csikszentmihalyi, Biocca, Tronstad — verify availability from text)
- **IG-APX (Appendix)** — **FULL unit, full edge target (≥35).** Three required deliverable elements:
   1. Calleja's qualitative-research methodology (semi-structured interview design, recruitment, analytic procedure)
   2. *World of Warcraft* case profile (Blizzard 2004) — game mechanics, social structure, Calleja's analytic deployment
   3. *Planetside* case profile (SOE 2003) — same depth
   Treat as the methodological seed for the dissertation's empirical adaptation.
- **Content-filter**: paraphrase only; no ≥25-word verbatim from Calleja. Game-title quotation is fine. Interview-data quotes (in Appendix + sprinkled in chapters) treated as primary text — paraphrase + page anchor only.

### Phase 3 — Volume synthesis

**Wave 1 (5 parallel agents)**:

3A — **Book-level ontology**: deduplicate concepts across 12 units → ≤40 canonical CONCEPT nodes; deduplicate POSITIONs; merge synonyms; assign Tier-1/2/3. Output: `book-level-ontology.{md,json}`.

3B — **Global edges + tensions**: concat 12 unit edges, deduplicate, resolve canonical IDs. Output: `global-edges.csv` (target ≥260 edges). Tensions output: `tension-edges.json` (target 10–14).

3C — **Concept matrix + contested nodes**: 12 × ~35 matrix. Identify ~8 contested concepts. Outputs: `concept-matrix.csv`, `contested-nodes.md`.

3D — **PIM Operationalization Manual + games-cited concordance + immersion-debate map** (consolidated agent — 3 core deliverables; this is the dissertation-facing core of the pipeline):

#### 3D.i — `ig-pim-operationalization-manual.{md,json}` (CORE DELIVERABLE)
Dissertation-deployable methodology manual. 5 sections.

**Section A — 6 dimension entries** (each ~250–400 words):
- Operational definition (≤60 words, drawn verbatim-paraphrastically from Calleja Ch.3 + Ch.4–9)
- 4–6 boundary criteria distinguishing this dimension from adjacent ones
- Macro-phase signatures (what the dimension looks like in macro phase) + micro-phase signatures
- Paradigm worked examples (4–6 games Calleja uses to demonstrate this dimension, with the analytic move per game)
- Ambiguous-case decision rules
- `dissertation_ontological_target` field: Aristotelian/Heideggerian construct from existing corpus indices (e.g. Kinesthetic → *aisthesis-kinesis* via Bowin AMT + Phantasia Cluster; Spatial → phantasia spatial-imagery via Hawhee + Papachristou; Affective → *pathē* via Aristotle + Gross 2017; etc.)
- `burke_pentad_mapping` field: candidate pentad term(s) (e.g. Kinesthetic→Agency; Spatial→Scene; Shared→Agent+ratio; Narrative→Act+Purpose; Affective→Attitude; Ludic→Purpose+Act)
- `uexkull_construct_mapping` field: candidate Uexküllian construct(s) (e.g. Kinesthetic → *Funktionskreis* (functional circle); Spatial → *Umwelt* / *Merkwelt+Wirkwelt*; Affective → *Merktöne / Wirktöne*; Ludic → *Wirkmal* (effect-marker)+goal-structure; Narrative → *Bedeutungsträger* (meaning-carrier) sequence)

**Section B — Incorporation rubric**:
- The 4–6 components constitutive of incorporation (extracted from IG-10)
- Mapping of each component onto the 6 dimensions
- Criteria differentiating "incorporated" from "merely involved" play
- Candidate theoretical bridge: Calleja's *incorporation* ↔ Burke's *consubstantiation* / *identification* (flagged as projected dissertation move, not Calleja's claim)

**Section C — Worked example walkthrough**:
- Reconstruct Calleja's full analytic application of PIM to *World of Warcraft* (or *Planetside* — pick whichever has denser Appendix treatment), step by step, drawing on chapters + Appendix
- Identify all 6 dimensions in operation for the chosen game; macro + micro phase signatures present; incorporation criteria met or not met
- This becomes the dissertation's template for analyzing a new game

**Section D — Application checklist + analytic-question battery for the dissertation**:
- 30–40 dissertation-deployable analytic questions, grouped by dimension and phase
- Example structure: "(Spatial / Macro): What spatial mental models does the user maintain off-line? What navigation strategies persist between sessions?" / "(Affective / Micro): What pathē are evoked moment-to-moment? Via which game elements?" / etc.
- Includes Burke-pentad questions as a parallel column (e.g. "(Scene): What features of the virtual environment foreground themselves as setting? How does the Scene constrain Action?")
- Includes ontological-grounding-probe questions (e.g. "(Kinesthetic / Phantasia probe): What *phantasmata* persist after kinesthetic actualization? What is the macro/micro phase of *aisthesis-kinesis* in this game?")

**Section E — Burke + Uexküll + Aristotelian/Heideggerian ontological-grounding anticipation** (NEW):
- Per-dimension **Burke pentad mapping** with rationale (~80 words per dimension)
- Per-dimension **Uexküllian-construct mapping** with rationale (~80 words per dimension; cite Uexküll *Foray* corpus-index anchors). Highlighted bridges: Spatial ↔ *Umwelt*; Kinesthetic ↔ *Funktionskreis*; Affective ↔ *Merktöne/Wirktöne*
- Per-dimension **Aristotelian/Heideggerian grounding-target** with corpus-index anchor (cite specific PHX / BCAP / Bowin AMT entries)
- **Three-layer integration table**: 6 dimensions × 3 augmentation layers (Burke / Uexküll / Aristotle-Heidegger) — shows the dissertation's full multi-layer analytical apparatus per dimension
- The "**consubstantiation ↔ incorporation**" theoretical move flagged with potential leverage + risk
- The "**Umwelt ↔ virtual-environment-habitation**" theoretical move flagged as Layer C's signature payoff: Uexküll's *Umwelt* is arguably more apt than Heideggerian *In-der-Welt-sein* for the bounded, designer-constituted nature of virtual environments
- Where each augmentation layer ADDS analytic resolution PIM lacks (Burke: motive/agent ratio; Uexküll: perception-action loop granularity + tone-coloring; Aristotle/Heidegger: ontological grounding of temporal phase)
- Where each layer CONFLICTS with PIM or with the other layers (Burke dramatist-motive vs. Calleja phenomenological-experiential; Uexküll biosemiotic-objectivist vs. Calleja subjectivist-qualitative; flag integration challenges)
- **Gibson as the implicit Uexküll bridge**: if Calleja cites Gibson (highly likely), Layer C is doubly-anchored — directly via Uexküll corpus index AND indirectly via Calleja's existing Gibson citation. Document the chain.
- **Future Gibson pipeline note (forward reference)**: J. J. Gibson's *Ecological Approach to Visual Perception* is in the corpus and will be analyzed as its own pipeline subsequently. When that pipeline exists, the Uexküll → Gibson → Calleja inheritance chain becomes a direct three-pipeline-bridge in the corpus index (rather than the current mediated bridge). The Manual Section E `gibson_pipeline_status` field should be set to `"pending-future-pipeline"` so the deliverable surfaces this when the dissertation activates Phase 4.

#### 3D.ii — `ig-games-cited-concordance.{md,json}` (MAXIMAL coverage, target ≥50)
For each game: developer + year + genre + chapter-citations + `depth_of_treatment` (passing / illustrative / sustained-analysis). **Tier-A entries (cited ≥3 chapters OR sustained analysis)** carry richer schema:
- Which dimension(s) Calleja uses the game to demonstrate
- The precise analytic move he makes (≤80 words)
- Interview/observation evidence Calleja draws on
- Macro vs. micro phase profile of the game (per Calleja's treatment)
- Whether the game appears in *WoW*/*Planetside* Appendix detail

Tier-A candidates (verify in Phase 2): *World of Warcraft*, *Planetside*, *Half-Life 2*, *Tetris*, *Civilization*, *EverQuest*, *Counter-Strike*, *Tomb Raider*, *Doom*, *Quake*.

#### 3D.iii — `ig-immersion-vs-incorporation-debate-map.{md,json}` (cap at 10 named pre-Calleja models)
Each entry: prior-author claim (≤40 words) × Calleja's replacement claim (≤40 words) × what incorporation absorbs vs. refuses vs. recasts. Recommended set: Murray 1997 (deep immersion), Ryan 2001 (spatial/temporal/emotional immersion), McMahan 2003 (perceptual/psychological), Brown + Cairns 2004 (engagement/engrossment/total immersion), Lombard + Ditton 1997 (presence), Witmer + Singer 1998 (presence questionnaire), Slater + Wilbur 1997 (presence factor), Csikszentmihalyi 1990 (flow), Biocca 1997 (cyborg/presence), Tronstad 2008 (role-immersion).

3E — **Bibliography + interlocutor map + terminology appendix**:
- `ig-bibliography-extracted.{md,json}` from References (book pp. 205–218); target ≥180 entries grouped: A=games (≥40 cited as primary objects); B=game studies + new media (Aarseth, Juul, Salen, Murray, Ryan, McMahan); C=presence + virtual reality (Lombard, Slater, Witmer, Biocca); D=narrative + literary (Murray, Ryan); E=phenomenology + cognitive (Gibson, Heidegger if cited, Merleau-Ponty if cited); F=qualitative-method references
- `ig-interlocutor-map.{md,json}` — Tier-A (≥3 units) and Tier-B; expected Tier-A: Murray, Ryan, Aarseth, Juul, Gibson, Csikszentmihalyi, Salen+Zimmerman, McMahan
- `ig-terminology-appendix.{md,json}` — Option C hybrid (~120 lemmas expected from a ~6-page index)

**Wave 2 (1 agent)** — 5 Mermaid graphs:
1. `ig-graph-global.mmd` — Tier-1 concept network ≤30n / ≤40e
2. `ig-graph-involvement-model.mmd` — the 6-dimensional model with macro/micro arcs + concept clusters under each dimension; Burke-pentad mapping shown as parallel column
3. `ig-graph-temporal-phase-arc.mmd` — macro→micro phase visualization with concept distribution
4. `ig-graph-games-cited-network.mmd` — top ~15 games × chapters bipartite (Tier-A games highlighted)
5. `ig-graph-cross-pipeline-bridge.mmd` — IG nodes ↔ Phantasia Cluster / Uncomfortable Situations / Heidegger BCAP / Bowin AMT / **Uexküll *Foray*** / **Dalton dissertation** / **Burke 1945** (HARD CAP 25 edges). Burke nodes: *Grammar of Motives* (1945 pentad source), *Rhetoric of Motives* (consubstantiation/identification), Hawhee 2009 *Moving Bodies* (existing corpus Burke anchor). Uexküll nodes: *Funktionskreis*, *Umwelt*, *Merktöne/Wirktöne*. Edge priority order: dissertation > Uexküll-Burke (the two dissertation augmentation layers) > Phantasia > US > BCAP/AMT.

### Phase 4 — Cross-pipeline integration (PARKED)
Per the precedent of every prior pipeline. Activation gates on the dissertation framework. When activated, expected high-yield bridges: IG-03 macro/micro temporal phases ↔ Dalton T-stage schema; IG-05 spatial involvement ↔ phantasia spatial-image operations; IG-08 affective involvement ↔ Gross 2017 + Berlant cruel optimism; **incorporation ↔ Burke consubstantiation** (the candidate theoretical move flagged in Manual Section E).

**Note**: although Phase 4 is parked, the PIM Operationalization Manual (3D.i) is *itself* dissertation-ready. Phase 4 activation would integrate the Manual with the dissertation chapters as live evidence, not produce new analysis. The Manual's Section E provides the full 6 × 3 layer-augmentation table (Burke × Uexküll × Aristotle-Heidegger × 6 PIM dimensions) that the dissertation will operationalize.

---

## 6. Orchestration

| Phase | Agents | Concurrency | Wall time |
|---|---|---|---|
| 0 | 1 | sequential | 12–16 min (added: Burke-cite check + Aristotle/Heidegger-cite check) |
| 1 | 12 metadata | 4 batches of 3 | 8–12 min |
| 2 | 12 deep (Ch.3 + Ch.10 triple-pass; Ch.4–9 add Burke + ontological tagging; Appendix full unit) | 12 parallel background | 40–55 min |
| 3 Wave 1 | 5 (3D consolidated = manual + games + debate-map; richer than original) | 5 parallel background | 30–45 min |
| 3 Wave 2 | 1 | sequential | 14–20 min |

**Total**: ~105–145 min wall time end-to-end (added ~15 min vs. v1 to accommodate operationalization-manual depth, Burke/ontological tagging, and Appendix full-unit treatment).

---

## 7. Quality gates

- ≥260 deduplicated edges in `global-edges.csv`
- 10–14 canonical tensions
- **≥50 games catalogued** in games-cited concordance (maximal coverage); ≥8 Tier-A entries with full schema
- **≥180 bibliography entries**
- ≥120 terminology lemmas
- **PIM Operationalization Manual**: 5 sections complete; 6 dimension entries each with operational definition + boundary criteria + macro/micro signatures + paradigm games + decision rules + `dissertation_ontological_target` + `burke_pentad_mapping`
- **Incorporation rubric** populated with 4–6 components
- **Worked example walkthrough** for *WoW* or *Planetside* (Manual Section C)
- **Application checklist** has 30–40 dissertation-deployable analytic questions (Manual Section D)
- **Burke + ontological-grounding anticipation** (Manual Section E) covers all 6 dimensions
- **Appendix is FULL UNIT** with ≥35 edges; methodology + WoW case + Planetside case all captured
- ≤10 pre-Calleja immersion models documented in debate-map
- All 5 Mermaid graphs render via `mmdc` v11.14
- Cross-pipeline graph capped at 25 edges; includes Burke nodes
- **Content-filter**: no ≥25-word verbatim from Calleja

---

## 8. Open questions (ALL RESOLVED 2026-05-11)

1. **Appendix treatment** → ✅ Full unit with full edge target (≥35).
2. **Games-cited concordance scope** → ✅ Maximal coverage (target ≥50), Tier-A entries with per-dimension analytic-move capture.
3. **Pre-Calleja immersion-debate map scope** → ✅ Cap at 10 named pre-Calleja models if available (was 8). Recommended set: Murray, Ryan, McMahan, Brown+Cairns, Lombard, Witmer, Slater, Csikszentmihalyi, Biocca, Tronstad.
4. **Dissertation-bridge depth** → ✅ Produce now, as Section D + Section E of the PIM Operationalization Manual (application checklist + analytic-question battery + Burke/ontological-grounding anticipation).

---

## 9. Anticipated risks & mitigations

| Risk | Mitigation |
|---|---|
| Game-title proliferation (potentially 100+ games passing-cited) → games-cited concordance bloats | Use the `depth_of_treatment` flag; only Tier-A games (≥3 chapters or sustained analysis) get full schema; Tier-B = single-row catalog with ≥50 total |
| Calleja's qualitative-research interview quotes might be primary-text-like in copyright terms | Treat interview-data quotes the same as primary text: paraphrase + page anchor only; no ≥25-word verbatim |
| Chapter 3 + Chapter 10 are both load-bearing → triple-pass agents may run long | Allow ~15-min extension on each; budget for them in orchestration |
| Pre-Calleja immersion literature is voluminous → IG-02 lit-review chapter agent context exhaustion | Provide IG-02 agent with the explicit 10-model anchor list upfront; constrain scope to Calleja's own selections |
| Cross-pipeline graph could overflow (Phantasia Cluster + US + BCAP + Bowin AMT + dissertation + Burke ≥ 25 edges) | HARD CAP 25 edges enforced; priority order: dissertation > PIM-Burke pentad mapping > Phantasia > US > BCAP/AMT |
| Burke pentad / Uexküllian / Aristotelian-Heideggerian mappings for dimensions are *anticipatory*, not Calleja's claim — risk of inserting dissertation-projection into the Calleja synthesis | Every `maps-to-pentad-term`, `maps-to-uexkull-construct`, and `awaits-ontological-grounding-in` edge MUST carry a `provenance` field = "anticipatory-projection (dissertation)" — never represented as Calleja's claim. EXCEPT: if Calleja directly cites Gibson, the Uexküll-via-Gibson chain may be flagged as "mediated-exegetical" rather than purely anticipatory. |
| Operationalization Manual could blur Calleja's exposition with dissertation extensions | Manual Section A–C = Calleja-faithful (page-anchored to Calleja text); Section D = dissertation-deployable (uses Calleja's vocabulary, no projection); Section E = explicitly flagged as *anticipatory* dissertation augmentation |

---

## 10. Ready-to-execute summary

- **Inputs**: PDF (verified), this plan v2, prior corpus indices for cross-pipeline anchors (Phantasia Cluster, US, BCAP, Bowin AMT, dissertation chapters, Hawhee Burke anchor)
- **Pipeline**: 5 phases, ~31 agents total (1+12+12+5+1), ~105–145 min wall time
- **Outputs**: 13 unit folders (each .json + .md + edges.csv) + `_synthesis/` folder with ~17 deliverables, including:
  - **`ig-pim-operationalization-manual.{md,json}`** — the dissertation-deployable core (5 sections: Calleja-faithful A–C + dissertation-deployable D + anticipatory Burke/ontological E)
  - `ig-games-cited-concordance.{md,json}` — maximal ≥50 games, Tier-A with full analytic-move schema
  - `ig-immersion-vs-incorporation-debate-map.{md,json}` — ≤10 named pre-Calleja models
- **Folder root**: `corpus/index/In-Game (Calleja 2011)/`
- **Activation**: on user's go-ahead. Phase 4 stays parked.
