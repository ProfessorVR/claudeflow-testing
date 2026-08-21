# Analysis Plan: *Phantasia* Commentary Cluster (1985–2017)

**Type**: Scholarly-article cluster (9 secondary-literature pieces on Aristotle, predominantly on *phantasia*)
**Date**: 2026-05-10
**Output roots**:
- `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/` (main cluster, 8 articles)
- `corpus/index/Aristotelian Motion and Time Secondary/` (Bowin 2017 alone — separate mini-pipeline)

**User decisions locked 2026-05-10**: (1) folder names as above; (2) Wave 3 scholarly-evolution included; (3) citation-network = key-figures-only (Burnyeat / Schofield / Wedin / Modrak / Lycos / Sorabji); (4) Bowin extracted to his own category since he doesn't focus on *phantasia*.
**Authorization mode**: this is the FIRST scholarly-cluster pipeline in the corpus (prior pipelines: monographs, edited collection). Architecture diverges accordingly.

---

## 1. The cluster

| # | Author | Year | Article | PDF pp. | Discipline | Length |
|---|---|---|---|---|---|---|
| PHX-01 | Nussbaum, Martha | 1985 | The Role of *Phantasia* in Aristotle's Explanation of Action | 59 | philosophy of mind | LONGEST — canonical interpretive essay (foundational for all later) |
| PHX-02 | White, Kevin | 1985 | The Meaning of *Phantasia* in Aristotle's *De Anima* III, 3–8 | 23 | philosophy / Thomistic | textual close-reading of DA III.3–8 |
| PHX-03 | Frede, Dorothea | 1992 | The Cognitive Role of *Phantasia* in Aristotle | 9 | philosophy of mind | shortest; "supervenience on sense-perception" thesis |
| PHX-04 | Caston, Victor | 1995 | Why Aristotle Needs Imagination | 18 | philosophy of mind | functional-explanation argument; appearance/truth |
| PHX-05 | O'Gorman, Ned | 2005 | Aristotle's *Phantasia* in the *Rhetoric*: Lexis, Appearance, and the Epideictic Function of Discourse | 13 | rhetoric | *megethos*/amplification + epideictic |
| PHX-06 | Gonzalez, José M. | 2006 | The Meaning and Function of *Phantasia* in Aristotle's *Rhetoric* III.1 | 34 | classics / rhetoric | dense philological essay on *Rhet.* III.1 |
| PHX-07 | Hawhee, Debra | 2011 | Looking Into Aristotle's Eyes: Toward a Theory of Rhetorical Vision | 28 | rhetoric / communication | "rhetorical vision" thesis; explicitly cites Nussbaum 1985 |
| PHX-08 | Papachristou, Christina | 2013 | Three Kinds or Grades of *Phantasia* in Aristotle's *De Anima* | 30 | philosophy / Thomistic | tripartite *phantasia*; uses Aquinas reception |
| **TOTAL Phantasia cluster** | | | | **214 pp. (8 articles)** | | |
| **separate** | Bowin, John | 2017 | Aristotle on the Perception and Cognition of Time | 19 | philosophy of mind | EXTRACTED to `Aristotelian Motion and Time Secondary/` — does not focus on *phantasia*; bridges in via *De Memoria* 450a19–22 |

### Scholarly profile
- **5 philosophy-of-mind pieces** (Nussbaum, White, Frede, Caston, Papachristou)
- **3 rhetoric pieces** (O'Gorman, Gonzalez, Hawhee)
- **28-year span** (1985–2013 for the phantasia cluster) — enables scholarly-evolution tracking
- **Citation hub**: Nussbaum 1985 is cited by all 5 later phantasia-cluster pieces (verified for Hawhee 2011 p.152)
- **Separate Bowin mini-pipeline**: time-perception focus; bridges into phantasia cluster via *De Mem.* 450a19–22

---

## 2. Why this work, why now

1. **First scholarly-cluster pipeline** in the corpus. Prior pipelines all treated single books (monograph or edited collection); this one treats 9 independent articles as a unified intellectual debate. Architecture innovations propagate to future cluster work.
2. **Direct support for Dalton's existing dissertation work**. `plans/phantasia-chapter-analysis.md` already executed Phases 0-4 for Dalton's dissertation chapters on *phantasia*. This new pipeline supplies the secondary-literature backbone Dalton's chapters draw on or rebut.
3. **First-of-its-kind concept-debate map**. Unlike the other pipelines (where the volume's argument is the organizing thread), here the *concept* (*phantasia*) is the thread, and the 9 articles are arguments about it.
4. **High cross-pipeline yield**. Direct bridges to:
   - **Aristotle pipeline** (every article is an Aristotle commentary; this cluster IS Aristotle-secondary-literature)
   - **Heidegger BCAP** (Aristotle 1924 Marburg lectures — Heidegger on *phantasia* in *De Anima* + *Rhetoric*)
   - **HR-2005** (Hawhee, Gross-Kemmann editorial position on rhetorical-emotion lineage)
   - **Dalton dissertation chapters** (`corpus/dissertation/in_progress/rhetorical phantasia test.pdf`)
   - **Uncomfortable Situations (Gross 2017)** (situated-emotion adjacency via Hawhee's rhetorical-vision project)

---

## 3. Folder layout

Per user's standard convention (`<Author> - <Short Title>` subfolders), and adopting a thematic top-level since no single book contains these articles:

```
corpus/index/Phantasia Commentary Cluster (1985-2017)/
├── _synthesis/
│   ├── manifest.json
│   ├── phase0-overview.md
│   ├── cluster-ontology.{md,json}
│   ├── global-edges.csv
│   ├── debate-map.{md,json}           # NEW: cross-article disagreements catalogued
│   ├── concept-matrix.csv
│   ├── contested-readings.md          # NEW (replaces contested-nodes for cluster pipelines)
│   ├── citation-network.{md,json}     # NEW: who cites whom across the 9 articles
│   ├── phx-aristotle-loci-concordance.{md,json}    # DA, NE, Rhet., De Mem., Phys., Met. citations
│   ├── phx-greek-terminology-appendix.{md,json}    # phantasia + cognate Greek glossary
│   ├── phx-secondary-literature-network.{md,json}  # Burnyeat, Schofield, Wedin, Modrak, etc.
│   ├── phx-scholarly-evolution-1985-2017.md        # NEW: chronological trajectory of the debate
│   ├── phx-graph-citation-network.mmd
│   ├── phx-graph-concept-debate.mmd
│   ├── phx-graph-discipline-cluster.mmd
│   ├── phx-graph-aristotle-locus-density.mmd
│   └── phx-graph-cross-pipeline-bridge.mmd
├── Nussbaum - Phantasia in Action (1985)/
│   └── phx-01-nussbaum.{json,md,edges.csv}
├── White - Phantasia in DA III.3-8 (1985)/
│   └── phx-02-white.{json,md,edges.csv}
├── Frede - Cognitive Role of Phantasia (1992)/
│   └── phx-03-frede.{json,md,edges.csv}
├── Caston - Why Aristotle Needs Imagination (1995)/
│   └── phx-04-caston.{json,md,edges.csv}
├── O'Gorman - Phantasia in Rhetoric (2005)/
│   └── phx-05-ogorman.{json,md,edges.csv}
├── Gonzalez - Phantasia in Rhetoric III.1 (2006)/
│   └── phx-06-gonzalez.{json,md,edges.csv}
├── Hawhee - Rhetorical Vision (2011)/
│   └── phx-07-hawhee.{json,md,edges.csv}
├── Papachristou - Three Kinds of Phantasia (2013)/
│   └── phx-08-papachristou.{json,md,edges.csv}
└── Bowin - Perception and Cognition of Time (2017)/
    └── phx-09-bowin.{json,md,edges.csv}
```

---

## 4. Controlled vocabulary (cluster-specific)

### 4.1 Object types

| Type | Description | Examples |
|---|---|---|
| CONCEPT | Concept used by multiple articles | "phantasia as supervenient on aisthesis", "phantasma", "appearance/truth", "decaying motion", "rhetorical vision", "epideictic amplification" |
| READING | An interpretive thesis about Aristotle | "Nussbaum's interpretive thesis: phantasia = interpretation", "Frede's supervenience thesis", "Caston's functional-explanation thesis" |
| ARISTOTLE-LOCUS | Aristotle citation by Bekker number or book/chapter | "DA III.3 428a1–429a9", "DA III.10 433b29", "Rhet. III.1 1404a11", "De Mem. 1 449b30", "De Mem. 1 450a19–22", "NE VI.5", "Met. IV.4–5 (Protagorean appearance)" |
| ARISTOTLE-WORK | Aristotle treatise as object | *De Anima*, *De Memoria et Reminiscentia*, *Rhetoric*, *Physics* IV (time), *NE* VI–VII, *Met.* IV, *Sophistical Refutations* |
| ANCIENT-INTERLOCUTOR | Pre/peri-Aristotelian figure | Plato (esp. *Phaedrus*, *Sophist*), Protagoras, Theaetetus, Stoics, Sextus Empiricus |
| MEDIEVAL-INTERLOCUTOR | Patristic/Scholastic reception | Thomas Aquinas (*Sentencia libri De anima*), Averroes, Avicenna |
| MODERN-INTERLOCUTOR | Modern philosophy/rhetoric secondary | Burnyeat, Schofield, Wedin, Modrak, Lycos, Bynum, Rorty, Sorabji, Striker, Heidegger (GA 18), Kennedy, Burke, Vivian, Vasaly, Olbricht |
| AUTHOR (this cluster) | One of the 9 authors qua interlocutor | Nussbaum (cited by 6 later), Frede (cited by Caston, Hawhee, etc.) |
| GREEK-TERM | Lemmatized Greek lexeme central to the debate | *phantasia*, *phantasma*, *aisthesis*, *aisthema*, *doxa*, *pathos*, *kinesis*, *energeia*, *dynamis*, *logos*, *hexis*, *megethos*, *enargeia*, *pro ommatōn poiein* |
| DEBATE-AXIS | Spectrum on which articles position themselves | "interpretive vs. presentational", "central vs. peripheral", "cognitive vs. perceptual", "psychological vs. rhetorical", "supervenient vs. independent" |

### 4.2 Edge relations — corpus-standard 11 + 4 new for cluster work

Standard: `defines`, `cites`, `extends`, `contests`, `concedes`, `qualifies`, `bridges-to-pipeline`, `instances-in-text`, `glosses-greek`, `glosses-german`, `marginal-note`.

**New for cluster pipelines**:

| Relation | Description |
|---|---|
| `cites-cluster-author` | Article X cites another article in this cluster (Hawhee 2011 → Nussbaum 1985) |
| `contests-reading-of` | Article disagrees with another's reading of a specific Aristotle locus |
| `extends-reading-of` | Article builds on another's reading without disagreement |
| `shifts-debate-axis` | Article reframes the question (e.g. O'Gorman shifts from psychology to rhetoric) |

### 4.3 Edge domains — corpus-standard 11 + 3 new

Add: `philosophy-of-mind`, `philology-of-aristotle`, `rhetorical-theory-of-imagination`.

### 4.4 Centrality tiers (cluster-adapted)

- **Tier-1**: load-bearing in the cluster's central debate (e.g. *phantasia* itself, *phantasma*, supervenience, decaying-motion)
- **Tier-2**: chapter-central in one article but secondary in others
- **Tier-3**: locally significant, one-article phenomenon

---

## 5. Five-phase pipeline (cluster-adapted)

### Phase 0 — Cluster overview
**Sequential**, 1 agent. Produces:
- `phase0-overview.md` (~5K words): cluster profile, citation-hub identification (Nussbaum as anchor), discipline split, debate-axis preview, cross-pipeline targets, OCR audit
- `manifest.json` with 9 unit entries + each article's bibliographic spine + cross-citation map

### Phase 1 — Per-article metadata
6 sequential or 3 parallel batches of 3. Each `phx-NN-<author>.json` carries:
- bibliographic header (journal, volume, pages, year)
- author profile (affiliation at time, discipline, prior/subsequent work on *phantasia*)
- abstract paraphrase
- section structure (most articles have explicit section headings — verify)
- expected Greek terminology
- expected Aristotle loci (DA / Rhet. / etc.)
- expected cluster-author citations (e.g. Hawhee's expected cite-list)
- OCR confidence

### Phase 2 — Deep per-article analysis
9 parallel agents. Each produces:
- **JSON deliverable**: outline (continuous-prose paraphrase, page-anchored), concepts (≥10 per article; longer articles ≥20), readings (≥3 interpretive theses per article), Aristotle loci (heavy), Greek terms, cluster-citations (who-cites-whom), interlocutors, tensions, edges
- **Markdown deliverable** (1,500–4,000 words depending on article length): paraphrastic synthesis, NO ≥25-word verbatim from copyrighted articles, cross-article positioning paragraph (where does this article sit on the debate axes?)
- **Edges CSV**: source/relation/target/domain/evidence (article-internal page or PDF page)/contributor (always the author name) — target counts: short articles ≥15 edges, medium ≥25, long (Nussbaum) ≥40

**Special guidance per article**:
- **Nussbaum 1985 (59pp)**: longest; foundational. Map all *Movement of Animals* citations and the 432a3–10 *phantasmata* passage. Distinguish her interpretive thesis from De Anima close-reading.
- **White 1985**: same year as Nussbaum, independent. Textually careful DA III.3–8 commentary. Capture the wax-tablet/picture analogies.
- **Frede 1992**: shortest. The supervenience thesis ("phantastike not a separate faculty, supervenes on sense-perception") is the chapter's signature.
- **Caston 1995**: focus on the appearance/truth dichotomy + Protagorean antirealism. Capture his refutation of the "every-appearance-true" reading.
- **O'Gorman 2005 + Gonzalez 2006**: rhetoric-cluster pair. Both work on *Rhet.* III.1. O'Gorman frames around *megethos*; Gonzalez does dense philology on the Bekker text.
- **Hawhee 2011**: explicit Nussbaum-citation. Maps *phantasia* across *Rhetoric* I/II/III. "Rhetorical vision" as her coinage.
- **Papachristou 2013**: Aquinas reception — captures Latin Aquinas passages. Three-kinds/grades thesis: indeterminate vs. determinate vs. deliberative *phantasia*.
- **Bowin 2017**: time + *phantasia*. Use the *De Memoria* 450a19–22 passage as central. Bridge to perception-of-time.

### Phase 3 — Cluster-level synthesis

**Wave 1 (5 parallel agents)**:

3A — **Cluster ontology**: deduplicate concepts/readings across 9 articles → ≤45 canonical CONCEPT nodes + ≤25 canonical READING nodes. Output: `cluster-ontology.{md,json}`.

3B — **Global edges + debate map**: concat the 9 edge CSVs, deduplicate, resolve cross-cluster citations. Produce `global-edges.csv` (target ≥220 edges). Separately produce `debate-map.{md,json}` cataloguing 8–12 explicit cross-article disagreements (e.g. Nussbaum's "phantasia-as-interpretation" vs. Frede's "phantasia-as-supervenient-image"; Hawhee vs. O'Gorman on the dominant rhetorical function).

3C — **Concept matrix + contested readings**: 9-column × ~40-concept matrix showing presence/centrality. Identify 8–12 contested readings (concepts where the 9 authors take incompatible positions). Output: `concept-matrix.csv`, `contested-readings.md`.

3D — **Aristotle locus concordance + Greek terminology**: every Bekker citation across the 9 articles, organized by Aristotle work (DA, Rhet., De Mem., Phys., NE, Met., Mot. An., SE). Cross-pipeline anchored to existing Aristotle-pipeline corpus-index if present. Greek glossary: every Greek lemma used by ≥2 articles, with each author's gloss tracked. Outputs: `phx-aristotle-loci-concordance.{md,json}` + `phx-greek-terminology-appendix.{md,json}`.

3E — **Citation network + secondary-literature mapping**: who cites whom across the 9 articles AND across non-cluster secondary literature (Burnyeat, Schofield, Wedin, Modrak, etc.). Outputs: `citation-network.{md,json}` + `phx-secondary-literature-network.{md,json}`.

**Wave 2 (1 agent)** — 5 Mermaid graphs:
1. `phx-graph-citation-network.mmd` — 9-node directed graph showing intra-cluster citations (Nussbaum at center, arrows from 6 later articles)
2. `phx-graph-concept-debate.mmd` — concept-axis diagram showing where each article sits on 4 debate axes
3. `phx-graph-discipline-cluster.mmd` — 3 subgraphs (philosophy-of-mind / rhetoric / time-perception hinge) with within- and across-discipline edges
4. `phx-graph-aristotle-locus-density.mmd` — Aristotle-work × article density map (which work each article relies on most)
5. `phx-graph-cross-pipeline-bridge.mmd` — phantasia-cluster nodes ↔ Aristotle pipeline, Heidegger BCAP (GA 18 phantasia), Dalton dissertation chapters, HR-2005, Uncomfortable Situations (Gross 2017) — **hard cap 25 edges**

**Wave 3 (1 agent, NEW for cluster work)** — `phx-scholarly-evolution-1985-2017.md`:
Chronological trajectory of the debate. ~2,000 words. Tracks:
- 1985: Nussbaum + White (independent foundational essays, philosophy-of-mind framing)
- 1992–1995: Frede + Caston (consolidation; supervenience + functional-explanation theses)
- 2005–2006: O'Gorman + Gonzalez (rhetorical turn — *phantasia* in *Rhetoric* III rather than DA III)
- 2011: Hawhee (synthesis: explicitly cites Nussbaum 1985; "rhetorical vision" as the rhetoric-cluster's payoff)
- 2013: Papachristou (Aquinas-reception revisitation; tripartite *phantasia*)
- 2017: Bowin (time-perception hinge — circles back to philosophy of mind but uses *De Memoria* differently)

### Phase 4 — Cross-pipeline integration (PARKED)
Per all prior pipelines. Activation requires dissertation framework.

---

## 6. Orchestration

| Phase | Agents | Concurrency | Wall time |
|---|---|---|---|
| 0 | 1 | sequential | 8–12 min |
| 1 | 9 (metadata) | 3 batches of 3 | 6–10 min |
| 2 | 9 (deep) | 9 parallel background | 30–45 min |
| 3 Wave 1 | 5 | 5 parallel background | 25–35 min |
| 3 Wave 2 | 1 (Mermaid) | sequential | 12–18 min |
| 3 Wave 3 | 1 (scholarly evolution) | sequential | 10–15 min |

**Total**: ~100–135 min wall time.

---

## 7. Quality gates

- ≥220 deduplicated edges in `global-edges.csv`
- 8–12 documented debates in `debate-map.json`
- 8–12 contested readings in `contested-readings.md`
- ≥100 Bekker citations canonicalized in Aristotle-locus concordance
- ≥40 Greek lemmas tracked in Greek-terminology appendix
- ≥20 cluster-internal citations mapped in citation-network
- All 5 Mermaid graphs render via `mmdc` v11.14
- Cross-pipeline graph capped at 25 edges
- **Content-filter discipline**: no ≥25-word verbatim from any cluster article; paraphrase + page anchor only (these are copyrighted journal articles)

---

## 8. Open questions

1. **Top-level folder name** — proposed `Phantasia Commentary Cluster (1985-2017)`. Acceptable? Alternative: `Aristotle Phantasia Secondary Literature` or simpler `Phantasia Commentary`.
2. **Scholarly-evolution deliverable (Wave 3)** — new addition appropriate for cluster pipelines. Confirm desired?
3. **Citation network depth** — should the secondary-literature-network catalog only Burnyeat/Schofield/Wedin/Modrak (the obvious key figures cited across multiple articles) or include all named scholars in any article's references? Default: former.
4. **Bowin as inlier or outlier** — Bowin's article is mostly about time-perception with *phantasia* as a sub-component. Include him fully as PHX-09 or flag as "adjacent" with reduced edge targets? Default: full inclusion (≥20 edges).

---

## 9. Anticipated risks & mitigations

| Risk | Mitigation |
|---|---|
| 9 agents reading copyrighted journal articles → content-filter risk | Pre-brief: paraphrase + Bekker/page anchor only; ≤25-word verbatim from any article |
| Long Nussbaum article (59pp) → agent context exhaustion | Two-pass: Pass 1 metadata + outline, Pass 2 edges + cross-citations |
| OCR quality varies ([Clean Copy] flagged as clean; [My Copy] = scanned by Dalton, possibly degraded) | Phase 0 spot-check each PDF for OCR confidence; flag Nussbaum and Hawhee for special handling |
| Greek terminology rendered inconsistently across articles (e.g. *phantasia* vs. *phantasía* vs. *φαντασία*) | Greek-terminology appendix maintains canonical form + tracks each author's typographic choice |
| Citation-network drift: agents might miss in-text cluster-citations | Provide each Phase 2 agent with the list of other 8 articles + key publication years; ask agent to flag every observed cite |
| Wave-3 scholarly-evolution narrative drifts into speculation | Constrain to evidence-anchored claims; every chronological move must cite specific article + page |

---

## 10. Ready-to-execute summary

- **Inputs**: 9 PDFs (verified), this plan, prior Aristotle-pipeline corpus-index (for cross-pipeline anchors)
- **Pipeline**: 5 phases, ~26 agents total (1+9+9+5+1+1), ~100–135 min wall time
- **Outputs**: 9 unit folders (each .json + .md + edges.csv) + `_synthesis/` folder with ~22 deliverables
- **Folder root**: `corpus/index/Phantasia Commentary Cluster (1985-2017)/`
- **Activation**: on user's go-ahead. Phase 4 stays parked.
