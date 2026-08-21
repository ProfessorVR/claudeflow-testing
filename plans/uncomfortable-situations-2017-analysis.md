# Analysis Plan: Daniel M. Gross — *Uncomfortable Situations: Emotion between Science and the Humanities* (2017)

**File**: `corpus/rhetorical_ontology/Gross, Daniel M. - Uncomfortable Situations_(2017)_[My Copy].pdf`
**Pages**: 193 PDF pages
**Offset**: book p. *n* = PDF p. *n* + 10 (verified on 8 landmarks: TOC p.7 lists ch.1 at p.28→PDF 38; epilogue p.129→PDF 139; notes p.147→PDF 157; index p.175→PDF 185)
**Date**: 2026-05-10
**Output root**: `corpus/index/Uncomfortable Situations/`

---

## 1. Why this work, why now

1. **Same author as HR-01-GROSS**. Daniel M. Gross co-edited *Heidegger and Rhetoric* (2005) and wrote its opening "rhetorical ontology" essay. *Uncomfortable Situations* is his 2017 single-author monograph. Pipeline gives us a 12-year author-trajectory bridge — the first intra-author longitudinal node in the corpus.
2. **First single-author monograph by a rhetorician in the corpus** that does *not* take Heidegger as its primary text. Forces the controlled vocabulary to extend beyond the Heidegger-Aristotle axis.
3. **First-of-its-kind interdisciplinary spine** — emotion theory between cognitive neuroscience (Barrett, Barsalou, Preston) and literary humanities (Equiano, Radcliffe, Austen) with a Darwin scientific treatise as Chapter 1 anchor. The co-authored Epilogue with Stephanie D. Preston (behavioral neuroscientist, Univ. of Michigan) is itself a methodological hybrid object.
4. **Affect-theory / situated-emotion bridge**. Adds Lauren Berlant (*Cruel Optimism*), Brian Massumi-trajectory affect studies, and the Barrett/Barsalou "Situated Conceptualization" framework to the corpus — none present in the existing 6 pipelines.

---

## 2. Volume profile (pre-Phase-0)

| Field | Value |
|---|---|
| Title | *Uncomfortable Situations: Emotion between Science and the Humanities* |
| Author | Daniel M. Gross (1965– ); UC Irvine, English / Rhetoric |
| Co-author (Epilogue only) | Stephanie D. Preston (behavioral neuroscientist, Univ. of Michigan) |
| Publisher | University of Chicago Press, 2017 |
| ISBN | 978-0-226-48503-4 (cloth); DOI 10.7208/chicago/9780226485171.001.0001 |
| Length | 174 body pp. + notes (28 pp.) + index (≈10 pp.) |
| Units | 6 (Introduction + 4 chapters + co-authored Epilogue) |
| Cross-pipeline links | HR-01-GROSS (2005, same author), possibly Rickert *Ambient Rhetoric* (situatedness), Aristotle *Rhetoric* II (pathē) |

### Chapter / locus table (with verified offsets)

| Unit ID | Heading | Book pp. | PDF pp. | Body pp. | Primary object |
|---|---|---|---|---|---|
| US-00-INTRO | Introduction — Uncomfortable Situations | 1–27 | 11–37 | 27 | Berlant *Cruel Optimism*; Barsalou et al. situated conceptualization (Wilson-Mendenhall 2011); Persuasion epigraph |
| US-01-DARWIN | Ch.1 Defending the Humanities with Charles Darwin's *The Expression of the Emotions in Man and Animals* | 28–51 | 38–61 | 24 | Darwin 1872 *Expression*; emotion-illustration plates |
| US-02-EQUIANO | Ch.2 Bearing Up in *The Interesting Narrative of … Olaudah Equiano* | 52–76 | 62–86 | 25 | Equiano 1789 *Interesting Narrative* |
| US-03-RADCLIFFE | Ch.3 Hostile Environments in Ann Radcliffe's *The Romance of the Forest* | 77–110 | 87–120 | 34 | Radcliffe 1791 *Romance of the Forest*; J. J. Gibson affordances |
| US-04-AUSTEN | Ch.4 Mixed Feelings in Jane Austen's *Sense and Sensibility* | 111–128 | 121–138 | 18 | Austen 1811 *Sense and Sensibility*; Galen humours tradition |
| US-05-EPILOGUE | Epilogue — Irreconcilable Differences? (with Stephanie Preston) | 129–146 | 139–156 | 18 | C. P. Snow "Two Cultures"; reticence/apathy/empathy correlation studies |
| US-NOTES | Notes (8 chapters' worth, numbered per-section) | 147–174 | 157–184 | 28 | — (bibliography mining only) |
| US-INDEX | Index | 175–[end] | 185–193 | ≈10 | (curated subject/author glossary seed) |

---

## 3. Folder layout (per user's HR convention: book-title top folder, `<Author> - <Abbreviated Title>` subfolders)

For a single-author monograph the subfolder author is uniformly **Gross** except the Epilogue (Gross & Preston). Subfolders take abbreviated chapter titles:

```
corpus/index/Uncomfortable Situations/
├── _synthesis/
│   ├── manifest.json
│   ├── phase0-overview.md
│   ├── book-level-ontology.{md,json}
│   ├── global-edges.csv
│   ├── tension-edges.json
│   ├── concept-matrix.csv
│   ├── contested-nodes.md
│   ├── chapter-arc-disagreements.{md,json}
│   ├── us-emotion-loci-concordance.{md,json}        # Darwin, Berlant, Barrett, Barsalou
│   ├── us-literary-loci-concordance.{md,json}        # Equiano, Radcliffe, Austen
│   ├── us-rhetoric-loci-concordance.{md,json}        # Aristotle bridges, HR-01-GROSS author-evolution
│   ├── us-neuroscience-loci-concordance.{md,json}    # Preston, Barrett, fMRI literature
│   ├── us-terminology-appendix.{md,json}
│   ├── us-bibliography-extracted.{md,json}
│   ├── us-interlocutor-map.{md,json}
│   ├── us-author-evolution-2005-to-2017.md           # NEW deliverable: HR-01-GROSS ↔ US-* drift
│   ├── us-graph-global.mmd
│   ├── us-graph-chapter-network.mmd
│   ├── us-graph-emotion-cluster.mmd
│   ├── us-graph-science-humanities-bridge.mmd
│   └── us-graph-cross-pipeline-bridge.mmd
├── Gross - Introduction (Uncomfortable Situations)/
│   ├── us-00-intro.json
│   ├── us-00-intro.md
│   └── us-00-intro-edges.csv
├── Gross - Darwin (Expression of the Emotions)/
│   ├── us-01-darwin.json
│   ├── us-01-darwin.md
│   └── us-01-darwin-edges.csv
├── Gross - Equiano (Interesting Narrative)/
│   ├── us-02-equiano.json … md … edges.csv
├── Gross - Radcliffe (Romance of the Forest)/
│   ├── us-03-radcliffe.json … md … edges.csv
├── Gross - Austen (Sense and Sensibility)/
│   ├── us-04-austen.json … md … edges.csv
└── Gross & Preston - Epilogue (Irreconcilable Differences)/
    ├── us-05-epilogue.json … md … edges.csv
```

---

## 4. Controlled vocabulary (extensions to corpus-wide schema)

### 4.1 Object types — replace Heidegger/Aristotle defaults with US-pipeline set

| Type | Description | Examples |
|---|---|---|
| CONCEPT | Volume-level concept node | "uncomfortable situation", "situated emotion", "negative affordance", "mixed feeling", "bearing up" |
| POSITION | Authored stance / claim | "Darwin's continuity thesis defends humanities" (Gross), "reticence/empathy/apathy are dissociable" (Preston) |
| DARWIN-LOCUS | Page or figure in *Expression of the Emotions* (1872) | "Darwin 1872, plate III", "Darwin 1872, p.196 (grief muscles)" |
| EQUIANO-LOCUS | Page/chapter in Equiano *Interesting Narrative* (1789) | "Equiano ch.2 (Middle Passage)", "Equiano p.40 (kidnapping)" |
| RADCLIFFE-LOCUS | Volume/page in *Romance of the Forest* (1791, 3 vols.) | "Radcliffe vol.II ch.13", "Radcliffe vol.III (abbey scene)" |
| AUSTEN-LOCUS | Volume/chapter in *Sense and Sensibility* (1811, 3 vols.) | "Austen vol.I ch.7 (Marianne at Norland)" |
| NEUROSCIENCE-LOCUS | Cited primary scientific paper | "Wilson-Mendenhall et al. 2011 *Neuropsychologia*", "Barrett 2017 'Theory of Constructed Emotion'" |
| RHETORICAL-LOCUS | Aristotle *Rhetoric* / classical rhetoric cite | "Aristotle *Rhet.* II.5 (fear)", "Cicero *De oratore* III.221 (passions)" |
| GROSS-2005-LOCUS | Cross-pipeline anchor to *Heidegger and Rhetoric* (HR-01-GROSS) | "HR-01-GROSS s2 (rhetorical ontology)", "HR-01 epigraph BT 178" |
| INTERLOCUTOR | Named theorist Gross is in dialogue with | Berlant, Massumi, Sedgwick, Barrett, Barsalou, J. J. Gibson, Galen, Smith, Hume |
| LITERARY-CHARACTER | Operative character qua emotion-vehicle | "Marianne Dashwood", "Adeline (Radcliffe)", "Equiano-narrator" |

### 4.2 Edge relations — corpus-standard 11 + 3 new

Standard: `defines`, `cites`, `extends`, `contests`, `concedes`, `qualifies`, `bridges-to-pipeline`, `instances-in-text`, `glosses-greek`, `glosses-german`, `marginal-note`.

**New for US**:

| Relation | Description |
|---|---|
| `re-reads-author` | Gross's chapter constitutes a re-reading of a specific primary text (e.g. US-02-EQUIANO `re-reads-author` Equiano *Interesting Narrative*) |
| `cross-discipline-bridges` | Edge spans humanities↔science boundary (e.g. Darwin plate `cross-discipline-bridges` Berlant *Cruel Optimism*) |
| `revises-prior-author-position` | Edge linking US-* node to HR-01-GROSS-* node where Gross's 2017 position revises his 2005 position |

### 4.3 Edge domains — corpus-standard 11 + 2 new

Add: `affect-theory`, `cognitive-neuroscience-of-emotion`.

### 4.4 Centrality tiers
Unchanged: Tier-1 (volume pillar), Tier-2 (chapter-central), Tier-3 (supporting).

---

## 5. Five-phase pipeline (mirrors HR pipeline; differences flagged)

### Phase 0 — Volume overview (sequential, single agent)

**Inputs**: PDF, this plan.
**Tasks**:
1. Read TOC, copyright, acknowledgments, index.
2. Verify offset on 8 landmarks (already done: +10). Re-confirm by sampling first/last page of each unit.
3. Enumerate Chapter notes structure (`Notes` section pp.147–174 is divided by chapter heading; no numbered single sequence — confirm).
4. Mine the Index for a pre-curated subject/author glossary seed.
5. Identify OCR alerts — sample-flag any rotated/skewed pages.
6. Map cross-pipeline bridge candidates (HR-01-GROSS, Rickert, Aristotle).
7. Produce `phase0-overview.md` (~6–8 K words): concept inventory (target ≥40), interlocutor census (target ≥30), tension list (target ≥8), cross-pipeline node candidates.
8. Produce `manifest.json` with 6 units + author profile + offset + special-feature flags.

**Output**: `_synthesis/phase0-overview.md`, `_synthesis/manifest.json`.

### Phase 1 — Per-unit metadata (6 sequential or 2 parallel batches)

For each of US-00 through US-05, produce `us-NN-<slug>.json` mirroring the HR per-essay metadata schema:
- unit_id, chapter, title, book_pages, pdf_pages, body_page_count, notes_page_count, two_pass flag, dissertation_critical flag, ocr_confidence
- sections (sub-sections of the chapter where headings exist; opening section if no internal headings)
- expected German terms (slim — Gross writes in English; only Heidegger/affect-theory carryover terms like *Stimmung*, *Befindlichkeit*)
- expected Greek terms (slim — Aristotelian *pathē*, *phronesis*, *epideiktikon* only where Gross invokes them)
- primary_loci_expected: keyed buckets — `darwin`, `equiano`, `radcliffe`, `austen`, `neuroscience`, `rhetoric_classical`, `gross_2005`, `other_primary`
- note

**Special handling — US-05-EPILOGUE**: dual-author block, `author: [Gross, Preston]`, `co_authored: true`. Preston has independent prior work (*The Altruistic Brain*, 2014; numerous *PNAS* / *Neuropsychologia* papers on empathy/altruism) — preserve her attribution separately.

### Phase 2 — Deep per-unit analysis (6 parallel agents)

Each agent reads its PDF range and produces:

**JSON deliverable** (`us-NN-<slug>.json` extended with):
- `outline`: section-by-section paraphrase
- `concepts`: list of {name, definition, centrality_tier, first_appearance_pdf_page}
- `positions`: list of {claimant, claim, support, contested_by}
- `loci`: arrays keyed by type — darwin_loci, equiano_loci, radcliffe_loci, austen_loci, neuroscience_loci, rhetorical_loci, gross_2005_loci
- `edges`: CSV-ready triples {source_id, relation, target_id, domain, evidence_page, contributor: "Gross" or "Preston"}
- `tensions`: within-chapter contradictions (target ≥2/chapter)
- `interlocutors`: named theorists with page anchors

**Markdown deliverable** (`us-NN-<slug>.md`, target 3,000–6,500 words):
- Paraphrastic synthesis (NO verbatim quotation of primary literary or scientific texts beyond ≤25-word fair-use snippets with page anchor)
- Section-by-section concept introduction
- Tension narrative
- Cross-pipeline-bridge candidate paragraph (HR-01-GROSS / Rickert / Aristotle)

**Edges CSV** (`us-NN-<slug>-edges.csv`): all triples in tabular form.

**Special agent guidance**:
- **US-01-DARWIN**: capture the plate-figure references (Darwin's photographs of grief, anger, fear) as DARWIN-LOCUS entries with figure numbers.
- **US-02-EQUIANO**: 18th-century slave narrative; flag any modern-edition page-mapping concerns; preserve Gross's argument that Equiano "bears up" is a rhetorical-emotional disposition not reducible to pathē.
- **US-03-RADCLIFFE**: longest body chapter (34 pp.); use Gibson *affordance* concept as central node; map "hostile environment" as the volume's contribution to ecological-emotion theory.
- **US-04-AUSTEN**: shortest chapter (18 pp.); concentrate on the "mixed feelings" concept and the Galen-humours critique.
- **US-05-EPILOGUE**: dual-author attribution required on every edge. Capture C. P. Snow "Two Cultures" framing. Preston's neuroscience contributions (empathy/apathy correlation, reticence factor) must be attributed to Preston specifically; the synthesizing claims attributed to Gross-and-Preston jointly.
- **Content-filter avoidance** (HR-07-Pöggeler lesson): no verbatim block quotation of long passages from Equiano, Radcliffe, Austen, or Darwin. Paraphrase + page anchor.

### Phase 3 — Volume-level synthesis (5 parallel agents + 1 Mermaid wave)

#### Wave 1 (5 parallel agents):

**3A — Book-level ontology**: deduplicate concepts across the 6 units → ≤40 canonical CONCEPT nodes; deduplicate POSITIONs; merge synonyms; assign Tier-1/2/3 centrality. Output: `book-level-ontology.{md,json}`.

**3B — Global edge graph**: concatenate the 6 unit edge CSVs, deduplicate, resolve target IDs to canonical-ontology IDs. Output: `global-edges.csv` (target ≥160 edges). Tensions split into `tension-edges.json` (target ≥8).

**3C — Concept matrix**: canonical concept × 6 units presence/tier table. Output: `concept-matrix.csv`. Contested-nodes list. Output: `contested-nodes.md`.

**3D — Loci concordances (FOUR sub-concordances)** — one agent, four outputs:
- `us-emotion-loci-concordance.{md,json}`: Darwin + Berlant + Barrett + Barsalou + affect-theory
- `us-literary-loci-concordance.{md,json}`: Equiano + Radcliffe + Austen (+ ancillary literary refs)
- `us-rhetoric-loci-concordance.{md,json}`: Aristotle *Rhetoric*, Cicero, classical rhetoric; **plus** HR-01-GROSS cross-pipeline anchor table
- `us-neuroscience-loci-concordance.{md,json}`: every cited fMRI / behavioral-neuroscience / cognitive-psychology paper, Preston's prior work explicit

**3E — Bibliography & interlocutor maps**:
- `us-bibliography-extracted.{md,json}`: mine the Notes section (pp.147–174) for the complete reference list, sectioned by chapter; Section A = primary literary/scientific objects, Section B = affect-theory secondary, Section C = neuroscience papers, Section D = general humanities references.
- `us-interlocutor-map.{md,json}`: Tier-A theorists (named ≥3 times) vs. Tier-B (cited ≤2 times).
- `us-terminology-appendix.{md,json}`: lemmatized index of affect-theory terminology (target ≥150 lemmas).

#### Wave 2 (1 agent, after Wave 1 complete):

**3F — Five Mermaid graphs** (render-validate each via `mmdc` v11.14):
1. `us-graph-global.mmd` — Tier-1 concept network, ≤30 nodes / ≤40 edges.
2. `us-graph-chapter-network.mmd` — 6 unit nodes + inter-chapter conceptual edges.
3. `us-graph-emotion-cluster.mmd` — situated-emotion cluster (Berlant/Barrett/Barsalou/Preston).
4. `us-graph-science-humanities-bridge.mmd` — explicit science-humanities bridge edges (the volume's titular argument).
5. `us-graph-cross-pipeline-bridge.mmd` — US-* nodes ↔ HR-01-GROSS, Rickert, Aristotle, BCAP — **hard cap 25 edges**.

#### Wave 3 (1 agent, NEW — author-evolution deliverable):

**3G — Gross 2005 → 2017 author-evolution**: read HR-01-GROSS analysis outputs side-by-side with US-* outputs; produce `us-author-evolution-2005-to-2017.md` documenting:
- Concept continuities (rhetorical ontology → situated emotion)
- Concept revisions (e.g. ethos/pathos centrality in HR-01 vs. neuroscience-mediated affect in US-*)
- Methodological drift (Heidegger-Aristotle close-reading vs. interdisciplinary cognitive-rhetoric)
- 3–5 specific `revises-prior-author-position` edges with locus anchors on both ends.

### Phase 4 — Cross-pipeline integration (PARKED)

Per the precedent of all 6 prior pipelines, Phase 4 stays parked until the user activates with a dissertation framework. When activated, Phase 4 will:
- Register US-pipeline canonical nodes into the dissertation working-set
- Reconcile US-rhetoric loci with the Aristotle-Rhetoric pipeline
- Reconcile US-emotion cluster with the Rickert *Ambient Rhetoric* (situatedness/affordance overlap)
- Activate the 3–5 `revises-prior-author-position` edges as live dissertation evidence

---

## 6. Orchestration plan

| Phase | Agents | Concurrency | Approx. wall time |
|---|---|---|---|
| 0 | 1 | sequential | 8–12 min |
| 1 | 6 (metadata only) | 2 batches of 3 | 6–10 min |
| 2 | 6 (deep analysis) | 6 parallel background | 25–35 min |
| 3 Wave 1 | 5 | 5 parallel background | 20–30 min |
| 3 Wave 2 | 1 (mermaid) | sequential after Wave 1 | 10–15 min |
| 3 Wave 3 | 1 (author-evolution) | sequential after Wave 1 | 10–15 min |

Total: ~90–120 min wall time end-to-end with parallel orchestration.

---

## 7. Quality gates

- **Offset audit**: every locus citation in every output must be re-anchorable; sample 10 random loci, verify by opening the PDF page.
- **No-verbatim audit**: scan every `.md` deliverable for ≥30-consecutive-word strings from primary literary texts; flag and paraphrase if found (Equiano, Radcliffe, Austen, Darwin).
- **Edge target**: ≥160 edges in `global-edges.csv`; ≥8 entries in `tension-edges.json`; ≥3 entries in `us-author-evolution-2005-to-2017.md`.
- **Cross-pipeline bridge cap**: ≤25 edges in `us-graph-cross-pipeline-bridge.mmd` (hard).
- **Mermaid validation**: all 5 graphs must render via `mmdc` v11.14 without error.
- **Co-authorship attribution audit**: every US-05-EPILOGUE edge must carry a `contributor` field of `"Gross"`, `"Preston"`, or `"Gross & Preston"`.

---

## 8. Open questions for user (before execution)

1. **Author-evolution deliverable (Phase 3 Wave 3)** is new to the pipeline — confirm desired? It compares HR-01-GROSS (2005) ↔ US-* (2017) for the same author across 12 years.
2. **Preston's prior neuroscience corpus** — should we register Preston as a corpus-author (with her own author-page if she ever appears as primary in a future pipeline)? For now I'll treat her only as Epilogue co-author + INTERLOCUTOR.
3. **Index mining depth** — should `us-terminology-appendix` lemmatize all ≈400 index entries, or only those with >1 page reference? (Default: latter.)
4. **Cross-pipeline target** — confirm HR-01-GROSS is the priority anchor; Rickert *Ambient Rhetoric* and Aristotle *Rhetoric* II as secondary anchors. BCAP/BT bridges only if explicitly cited by Gross 2017.

---

## 9. Anticipated risks & mitigations

| Risk | Mitigation |
|---|---|
| Content-filter trips on long quotations from Equiano (slave-narrative violence) or Radcliffe (gothic threat scenes) | Pre-brief every Phase 2 agent: paraphrase + page anchor only; no ≥25-word verbatim from primary literary texts. |
| OCR errors in 18th-century reprinted passages embedded in Gross's text | Phase 0 spot-check; flag any unit where embedded primary quotation OCR is degraded. |
| Preston's neuroscience citations have rapidly-evolving DOIs / preprint shadows | Phase 3E bibliography mining uses Gross's note text as the canonical citation form; no live DOI lookup unless needed. |
| Concept ontology bloats past 40 canonical nodes (volume genuinely interdisciplinary) | Cap at 50; merge synonyms aggressively in Phase 3A; demote to Tier-3 rather than create new Tier-1 nodes. |
| HR-01-GROSS author-evolution claims drift into speculation | Phase 3G constrained to evidence-anchored claims only; every `revises-prior-author-position` edge must cite two specific page anchors (one HR-01, one US-*). |

---

## 10. Ready-to-execute summary

- **Inputs**: PDF (verified), this plan, prior HR pipeline outputs (for cross-pipeline bridges and the author-evolution Phase 3G).
- **Pipeline**: 5 phases, ~14 agents (1+6+6+5+1+1), ~90–120 min wall time.
- **Outputs**: 6 unit folders (each with .json + .md + edges.csv) + 1 `_synthesis/` folder with ~20 deliverables (ontology, edges, matrices, concordances, bibliography, terminology, interlocutors, author-evolution, 5 Mermaid graphs).
- **Folder root**: `corpus/index/Uncomfortable Situations/`.
- **Activation**: on user's go-ahead. Phase 4 stays parked.
