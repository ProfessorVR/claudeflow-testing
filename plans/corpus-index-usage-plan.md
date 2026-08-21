# Corpus Index — Living Usage Plan

**Status**: ACTIVE
**Created**: 2026-03-09
**Last Updated**: 2026-03-09 (rev 2: 2B multi-step pipeline protocol)

---

## 1. Infrastructure Inventory

### 5 Completed Pipelines

| Pipeline | Text | Author | Units | Phases | Canonical Nodes | Edges | Terminology | Graphs |
|----------|------|--------|-------|--------|----------------|-------|-------------|--------|
| **Aristotle** | 9 works (Barnes ed.) | Aristotle | 34 | 0–4 COMPLETE | 45 | 156 global | 164 Greek lemmas | 8 Mermaid |
| **Being and Time** | B&T (M/R 1962) | Heidegger | 17 | 0–3 COMPLETE | ~37 | 284 | 300 German lemmas | 5 Mermaid |
| **BCAP (GA 18)** | Basic Concepts | Heidegger | 13 | 0–3 COMPLETE | ~30 | ~180 | Greek+German appendix | 4 Mermaid |
| **Foray** | Worlds of Animals | von Uexküll | 14 | 0–3 COMPLETE | 35 | ~156 | 148 German lemmas | 5 Mermaid |
| **Ambient Rhetoric** | Ambient Rhetoric | Rickert | 10 | 0–3 COMPLETE | ~25 | ~120 | — | 3 Mermaid |
| **TOTAL** | **14 texts** | **5 authors** | **88 units** | — | **~172 nodes** | **~896 edges** | **~612 lemmas** | **25 graphs** |

### Shared Infrastructure

All 5 pipelines use:
- **11 edge relations**: `{depends_on, contrasts_with, refines, presupposes, explains, operationalizes, supports, undermines, exemplifies, historicizes, is_meaning_of}`
- **10 edge domains**: `{ontological, existential, biosemiotic, perceptual, teleological, temporal, methodological, rhetorical, psychological, logical}`
- **3 centrality tiers**: core / important / peripheral
- **Same Phase structure**: Phase 0 overview → Phase 1 JSON → Phase 2 unit analysis → Phase 3 synthesis → Phase 4 corpus ontology
- **Compatible cross-pipeline hooks**: All tagged [INTERP-high] for interpretive claims

### File Locations

```
corpus/index/
├── Aristotle - Complete Works/          # 123 files, Phases 0–4
├── Heidegger - Being and Time/
│   ├── bt-analysis/                     # Phase 2+3 analyses, graphs, appendix
│   └── bt-structured/                   # Phase 1 JSON skeletons
├── Heidegger - Basic Concepts of Aristotelian Philosophy/
│   ├── bcap-analysis/                   # Phase 2+3 analyses, graphs, appendix
│   └── bcap-structured/                 # Phase 1 JSON skeletons
├── Rickert - Ambient Rhetoric/
│   ├── rickert-analysis/                # Phase 2+3 analyses, graphs
│   └── rickert-structured/              # Phase 1 JSON skeletons
└── Von Uexkull - A Foray into the Worlds of Animals and Humans/
    ├── uex-analysis/                    # Phase 2+3 analyses, graphs, appendix
    └── uex-structured/                  # Phase 1 JSON skeletons
```

---

## 2. How to Use the Index for Dissertation Writing

### 2A. Single-Author Deep Dive

**Scenario**: Writing a section on Aristotle's theory of perception.

1. **Find relevant units** → Open `concept-matrix.csv`, scan the row for `aisthēsis` — shows: DA-02 (central), DA-03 (central), DA-04 (present), SS-01 (central), SS-02 (present), PHYS-03 (present)
2. **Read the analyses** → Open `phase2-da-03.md` (the five senses) and `phase2-ss-01.md` (objects of sense) for full outlines, key claims, Greek terms
3. **Get citations** → Open `aristotle-bekker-index.md`, search for `aisthēsis` — gives you every Bekker locus with PDF page, linked concepts, and unit ID
4. **Check tensions** → Open `corpus-ontology.md` §4D, find tension CT-07 (proper sensibles infallible vs. perceptual error)
5. **Write with `/god-write`** → The pipeline can pull these structured files as retrieval context

### 2B. Cross-Author Concept Tracing (Full Multi-Step Pipeline)

**Scenario**: Writing a 2,000–3,000 word section connecting Aristotle's φαντασία → Heidegger's Erschlossenheit → Uexküll's Merkbild, using only texts from the ingested corpus, with all anti-hallucination measures active.

#### Phase I: Index Reconnaissance (Manual — 5 min)

Walk the pre-built bridge chain before invoking the pipeline:

1. **Start with Aristotle** → `aristotle-graph-phantasia.mmd` (or `.svg`) shows phantasia across DA, Rhetoric, Movement of Animals, On Memory
2. **Find the bridge** → `de-anima-cross-pipeline-hooks.md` Hook 2: "phantasia → B&T Erschlossenheit (pre-theoretical disclosure)"; Hook 4: "phantasma → Uexkull Merkbild"
3. **Jump to B&T** → `bt-analysis/book-level-ontology.md`, Node 7 (Erschlossenheit): the "there" (Da) of Dasein, equiprimordially constituted by Befindlichkeit + Verstehen + Rede
4. **Jump to Uexküll** → `uex-analysis/book-level-ontology.md`, Node 23 (Merkbild): composite sensory representation requiring organized schemata; Node 25 (Suchbild): internally generated perceptual template
5. **Confirm the bridge graph** → `aristotle-graph-cross-pipeline.mmd` shows: `a_phantasia →|structural parallel| bt_erschlossenheit`, `a_phantasma →|organism-side correlate| u_merkbild`
6. **Note key passages for the prompt** — these anchor the retrieval:
   - Aristotle: DA III.3 429a1-2, III.8 431a17/432a1-3, MA 700b17-21, Rhet 1370a28
   - Heidegger: B&T §28 H.132-134, §29 H.134-140, §15 (Umsicht)
   - Uexküll: Foray pp. 50, 84; Theory of Meaning pp. 159, 192

**The key**: Each pipeline's cross-pipeline hooks file is a pre-built bridge. You don't need to re-read the primary texts to find connections — they're already mapped.

#### Phase II: Construct the Prompt

Build a writing prompt that encodes the argumentative spine from Phase I. The prompt should:
- Name all three authors and the specific concepts being traced
- Cite the key passages identified above (so retrieval can target them)
- State the thesis: the gap between these three is not between naive realism, phenomenological hermeneutics, and biosemiotics, but between three articulations of the same structural insight
- Specify word target (2,000–3,000 words)
- Request section structure (e.g., 5–7 sections tracing the argument)

Example prompt:

```
Write a 2,000–3,000 word section arguing that Aristotle's φαντασία (De Anima III.3,
429a1-2; III.8, 431a17, 432a1-3), Heidegger's Erschlossenheit (Being and Time §28,
H.132-134), and Uexküll's Merkbild (Foray into the Worlds of Animals and Humans,
pp. 89-95) are three articulations of the same structural insight: the living being
is always already outside itself, in the midst of a meaningful world that is disclosed
pre-theoretically.

Structure:
1. Aristotle: φαντασία as pre-theoretical disclosure — not "mental imagery" but a
   movement from actual sense that persists, guides desire, and enables thought
   (DA 431a17: "the soul never thinks without a phantasma")
2. The sensitive/deliberative distinction (DA 434a5-10) as a proto-phenomenological
   differentiation between pre-thematic engagement and explicit thematic apprehension
3. Heidegger's radicalization: Erschlossenheit strips the hylomorphic framework —
   Dasein is always already outside itself in a clearing of significance. The
   phantasia-Erschlossenheit parallel is pre-thematic disclosure in both cases.
4. Uexküll's biological reframing: Merkbild completes the trajectory — pre-theoretical
   disclosure is species-specific and constitutive rather than receptive. The Suchbild
   (search image) shows the organism projects a perceptual template.
5. The key divergence: Aristotle's form-reception (phantasma as residual movement in
   the sense-organ) vs. Uexküll's meaning-constitution (Merkbild as species-specific
   construction). Heidegger occupies the pivot between these two.
6. Synthesis: what unites all three is the rejection of the "cabinet model" — the
   living being is not enclosed in a mental space but is always already alongside
   entities in a meaningful world.

Use ONLY sources from the corpus. Cite with Bekker numbers for Aristotle, M/R page
numbers for Heidegger, and O'Neil page numbers for Uexküll.
```

#### Phase III: Execute with Multi-Step Pipeline

Run `/god-write` with the full anti-hallucination stack:

```bash
npx tsx src/god-agent/universal/cli.ts write "<PROMPT>" \
  --execute \
  --whitelist \
  --multi-step \
  --style academic \
  --format paper \
  --length comprehensive \
  --corpus-chunk-count 28 \
  --corpus-min-relevance 0.30 \
  --use-inline-validation \
  --inline-validation-strictness high \
  --citation-enforcement-mode strict \
  --citation-min-pass-rate 0.85 \
  --citation-max-hallucinations 0 \
  --enable-endnotes \
  --json
```

**What each flag does**:

| Flag | Purpose |
|------|---------|
| `--execute` | Full end-to-end pipeline (not two-phase) |
| `--whitelist` | Corpus-only constraint — only sources in `manifest.jsonl` are allowed |
| `--multi-step` | Enables v1 → investigate → v2 pipeline (Fix 57) |
| `--corpus-chunk-count 28` | Retrieves 28 chunks (higher count for whitelist mode) |
| `--corpus-min-relevance 0.30` | Catches lower-relevance but useful chunks (Fix 45) |
| `--use-inline-validation` | Paragraph-by-paragraph generation with per-unit validation |
| `--inline-validation-strictness high` | Tighter validation thresholds |
| `--citation-enforcement-mode strict` | Full citation enforcement pass |
| `--citation-min-pass-rate 0.85` | ≥85% of citations must validate against corpus |
| `--citation-max-hallucinations 0` | Zero tolerance for hallucinated citations |
| `--enable-endnotes` | Appends endnotes with quotation evidence |

#### Phase IV: What the Multi-Step Pipeline Does Internally

The `--multi-step` flag activates a three-stage pipeline (Fixes 51–66):

```
Stage 1: V1 Draft
  ├── Retrieval: SmartRetrievalLayer pulls 28 chunks from ChromaDB
  ├── Phase 1a: Semantic retrieval (embedding similarity)
  ├── Phase 1b: Source-targeted supplementation (author-specific queries)
  ├── Phase 1c: Primary author ratio check (≥30% primary chunks)
  ├── Chunk trimming: 4,280 → ~352 avg chars/chunk (Fix 51)
  ├── Attention reordering: highest-relevance at start/end (Fix 52)
  ├── Corpus constraint: whitelist of allowed sources from manifest
  └── V1 generation: Draft WITHOUT style profile (raw content focus)

Stage 2: Investigation (Fix 54 — local, no LLM)
  ├── Detects: hallucinated citations, phantom quotations
  ├── Detects: uncited claims, source imbalance, short sections
  ├── Produces: prevention plan + blacklist of non-corpus authors
  └── Outputs: v1Diagnostics JSON

Stage 3: V2 Revision
  ├── Injects: full style profile (dalton-academic-mkn82c3v)
  ├── Injects: prevention plan from investigation
  ├── Injects: blacklisted authors from v1
  ├── Top-level grounding: "ONLY quote and cite from the corpus chunks below"
  ├── V2 generation: Revision with style + constraints
  └── Post-processing:
      ├── Prose sanitizer (meta-text removal, duplicate sections)
      ├── Citation enforcement (strict mode)
      ├── Second sanitizer pass (post-enforcement artifacts)
      ├── Non-corpus author scrubber (Fix 25, Fix 46)
      └── Endnote generation
```

#### Phase V: Quality Validation

After the pipeline completes, verify:

1. **Word count**: Should be 2,000–3,000 words
2. **Citation check**: `citationResults.hallucinated` should be empty (zero tolerance)
3. **Source coverage**: All three authors (Aristotle, Heidegger, Uexküll) should appear with citations
4. **Quotation fidelity**: ≥70% similarity (lowered for OCR corpus, Fix 17)
5. **Style match**: Long sentences (~31 words avg), author-prominent citations, formal register
6. **Multi-step diagnostics**: Check `v1Diagnostics` and `v2Diagnostics` in output JSON for any remaining issues
7. **Blacklisted authors in v2**: `blacklistedAuthorsUsedInV2` should be 0

#### Phase VI: Feedback Loop

After reviewing the output:

```bash
npx tsx src/god-agent/universal/cli.ts feedback <trajectoryId> <0.0-1.0> \
  --trajectory --notes "cross-author phantasia trace: <observations>"
```

This feeds back into the God Agent's learning system for future runs.

#### Files Consulted in This Trace

| Step | File | What It Provides |
|------|------|------------------|
| 1 | `aristotle-graph-phantasia.mmd` | Visual map of phantasia across 5 Aristotle works |
| 2 | `de-anima-cross-pipeline-hooks.md` | Hook 2 (phantasia→Erschlossenheit), Hook 4 (phantasma→Merkbild) |
| 2 | `movement-animals-cross-pipeline-hooks.md` | Hook 2 (phantasia as practical mover → BCAP/Rickert) |
| 3 | `bt-analysis/book-level-ontology.md` | Node 7 (Erschlossenheit definition, units, edges) |
| 4 | `uex-analysis/book-level-ontology.md` | Node 23 (Merkbild), Node 25 (Suchbild), tensions |
| 5 | `aristotle-graph-cross-pipeline.mmd` | Full Aristotle↔Heidegger↔Uexküll edge map |
| — | `scripts/ingest/manifest.jsonl` | Corpus whitelist (citation validation source) |
| — | `.agentdb/universal/style-profiles.json` | Style profile `dalton-academic-mkn82c3v` |

### 2C. Tension-Driven Chapter Structure

**Scenario**: Structuring a dissertation chapter around a productive tension.

1. **Browse tensions** → `tension-edges.json` (Aristotle), `tension-edges.json` (B&T), etc.
2. **Pick a generative one** → e.g., Aristotle CT-04: "phantasia is derivative from perception yet autonomous"
3. **Find where it lives** → The tension entry lists works and units where it manifests
4. **Check if it crosses authors** → Does Heidegger address this tension? Search B&T's cross-pipeline hooks
5. **Structure the chapter**: Thesis (Aristotle's position) → Complication (the tension) → Heidegger's response → Uexküll's biological reframing → Your synthesis

### 2D. Terminology Concordance

**Scenario**: Ensuring consistent translation choices across your dissertation.

1. **Greek** → `aristotle-greek-appendix.md` (164 lemmas with alternative translations, contested flags)
2. **German (Heidegger)** → `bt-analysis/bt-german-appendix.md` (300 lemmas), `bcap-analysis/bcap-greek-appendix.md`
3. **German (Uexküll)** → `uex-analysis/uex-german-appendix.md` (148 lemmas)
4. **Cross-language** → When writing about ἐνέργεια/Wirklichkeit/actuality, check all three appendices to ensure your translation choice is consistent and flagged where contested

### 2E. Writing Session Workflow

**Before writing a section**:
```
1. Identify the topic concepts (e.g., phantasia, perception, motion)
2. Scan concept-matrix.csv for each pipeline → find relevant units
3. Read the relevant Phase 2 analyses for textual evidence
4. Read the relevant ontology nodes for synthesized definitions
5. Check cross-pipeline hooks for inter-author connections
6. Check tensions for argumentative structure
7. Check Bekker index (Aristotle) for precise citation anchors
8. Construct a detailed prompt with specific passages, thesis, and section structure
9. Execute with /god-write using the multi-step pipeline:
   --execute --whitelist --multi-step --corpus-chunk-count 28
   --use-inline-validation --citation-enforcement-mode strict
   --citation-max-hallucinations 0 --enable-endnotes
10. Review v1Diagnostics and v2Diagnostics in output
11. Provide feedback via `cli.ts feedback <trajectoryId> <rating>`
```

**Standard flags for all writing sessions** (copy-paste):
```bash
--execute --whitelist --multi-step --style academic --format paper \
--length comprehensive --corpus-chunk-count 28 --corpus-min-relevance 0.30 \
--use-inline-validation --inline-validation-strictness high \
--citation-enforcement-mode strict --citation-min-pass-rate 0.85 \
--citation-max-hallucinations 0 --enable-endnotes --json
```

---

## 3. How Cross-Author Integration Works

### 3A. The Bridge Architecture

Each pipeline was built independently but shares:
- **Compatible edge vocabulary** (same 11 relations across all 5 pipelines)
- **Compatible domain tags** (same 10 domains)
- **Cross-pipeline hooks** (pre-mapped connection points between pipelines)

This means you can query across pipelines without re-reading the primary texts:

```
Aristotle concept → [cross-pipeline hook] → Heidegger concept → [cross-pipeline hook] → Uexküll concept
```

### 3B. Pre-Mapped Integration Surfaces

| Surface | Aristotle ↔ | BCAP | B&T | Uexküll | Rickert |
|---------|------------|------|-----|---------|---------|
| **Perception** | αἴσθησις | Aisthanesthai | Befindlichkeit | Merkwelt | suasive materiality |
| **Imagination** | φαντασία | phänomenologische Auslegung | Erschlossenheit | Merkbild | — |
| **Motion** | κίνησις | Bewegtheit (§§25-28) | Sorge | Funktionskreis | — |
| **Substance/Being** | οὐσία | Anwesenheit | Vorhandenheit | — | — |
| **Time** | χρόνος | — | Zeitlichkeit (§§78-83) | — | kairos |
| **Nature/Craft** | φύσις/τέχνη | — | Zeug/Zuhandenheit | Naturtechnik | ambient rhetoric |
| **Emotion** | πάθος | πάθη (§§16-21) | Stimmung | Stimmung | — |
| **Soul/Life** | ψυχή | ζωή πρακτική | Dasein | Bauplan | — |
| **Style/Expression** | λέξις/μεταφορά | — | — | — | rhetorical thing |

### 3C. Single-Discussion Writing Session

When writing a multi-author paragraph, you can:

1. **State the Aristotelian position** — Cite from the Bekker index, use the Phase 2 analysis for evidence
2. **Show Heidegger's appropriation** — Use the BCAP cross-pipeline hooks to show how Heidegger reads Aristotle (e.g., κίνησις → Bewegtheit)
3. **Introduce Uexküll's biological reframing** — Use the Uexküll cross-pipeline hooks to show how the same structure appears in biosemiotics (e.g., Funktionskreis)
4. **Add Rickert's rhetorical dimension** — Use Rickert's concept of ambient rhetoric to frame the whole discussion

**The index makes this possible in one session** because:
- You don't need to re-read 4 books — the Phase 2 analyses have the evidence
- You don't need to discover connections — the cross-pipeline hooks have them mapped
- You don't need to find citations — the Bekker index and German appendices have them located
- You don't need to worry about terminology — the appendices flag contested translations

### 3D. Multi-Author Concept Tracing Protocol

For any concept that spans 2+ authors:

```
Step 1: Find the concept in each pipeline's ontology
Step 2: Compare definitions across pipelines (cross-work integration map)
Step 3: Check if it's a contested node (meaning shifts across authors)
Step 4: Read the relevant cross-pipeline hooks
Step 5: Build the argument: Author A says X, Author B transforms X into Y, Author C...
Step 6: Cite precisely using the Bekker index + German appendices
```

---

## 4. Phase 5: Cross-Pipeline Integration (NOT YET STARTED)

### What Phase 5 Would Produce

When you provide your dissertation framework, Phase 5 will:

1. **Unified mapping tables**: Aristotle Greek → BCAP Greek/German → B&T German → Uexküll German → Rickert English
2. **Cross-pipeline edge graph**: All [INTERP-high] hooks promoted to confirmed edges where warranted
3. **Zones of alignment / conflict / extension** across all 5 authors
4. **Dissertation-ready bridge graphs**: Updated Mermaid graphs with verified cross-author connections
5. **Integration narrative**: How the 5 authors' systems relate to your dissertation's argumentative spine

### What's Needed to Activate Phase 5

- Your dissertation framework description (chapter structure, argumentative spine, which concepts are load-bearing)
- Decision on which cross-pipeline hooks to promote from [INTERP-high] to confirmed
- Any additional integration surfaces not already captured

---

## 5. Maintenance & Update Protocol

### When to Update This Plan

- [ ] After adding a new text/pipeline to the index
- [ ] After completing Phase 5 for any pipeline
- [ ] After a writing session reveals a missing connection or incorrect mapping
- [ ] After revising dissertation chapter structure

### Adding New Texts

To add a new author/text to the index:
1. Create a plan following the pipeline template (see `plans/aristotle-corpus-analysis.md`)
2. Execute Phases 0-4
3. Add cross-pipeline hooks referencing existing pipelines
4. Update the Integration Surfaces table in §3B above

### Correcting the Index

If a writing session reveals:
- **Wrong citation** → Update the relevant Phase 2 file and Bekker index
- **Missing concept** → Add to the relevant ontology, update concept matrix
- **Bad cross-pipeline hook** → Demote or remove from the hooks file
- **New connection discovered** → Add to the relevant hooks file, tag [INTERP-high]

---

## 6. Quick Reference: File Types and Their Uses

| File Type | Example | Use For |
|-----------|---------|---------|
| `phase2-*.md` | `phase2-da-04.md` | Deep reading of a specific unit — outline, concepts, claims, evidence |
| `*-ontology.md` | `corpus-ontology.md` | Synthesized concept definitions, trajectories, contested meanings |
| `*-edges.csv` | `global-edges.csv` | Finding structural relations between concepts |
| `tension-edges.json` | (per pipeline) | Argument structure — productive contradictions to build chapters around |
| `*-greek-appendix.*` | `aristotle-greek-appendix.md` | Translation choices, contested terms, cross-work citations |
| `*-german-appendix.*` | `bt-german-appendix.md` | Same, for German terminology |
| `concept-matrix.csv` | (per pipeline) | Finding which units discuss a concept |
| `*-bekker-index.*` | `aristotle-bekker-index.md` | Precise citation lookup by passage |
| `*-cross-pipeline-hooks.md` | `de-anima-cross-pipeline-hooks.md` | Pre-mapped connections to other authors |
| `*.mmd` | `aristotle-graph-phantasia.mmd` | Visual concept maps for presentations or orientation |
| `manifest.json` | (per pipeline) | Unit metadata, PDF locations, tier assignments |

---

## 7. Decision Log

| # | Date | Decision | Rationale |
|---|------|----------|-----------|
| U1 | 2026-03-09 | Plan created after all 5 pipelines reached Phase 3+ | Infrastructure sufficient for systematic cross-author writing |
| U2 | 2026-03-09 | Phase 5 remains PARKED across all pipelines | Awaiting user's dissertation framework before cross-pipeline integration |
| U3 | 2026-03-09 | Aristotle pipeline is the only one at Phase 4 | Largest pipeline (34 units, 9 works); others at Phase 3 with book-level ontology |
| U4 | 2026-03-09 | 2B revised to use full multi-step pipeline (v1→investigate→v2) | All cross-author writing uses `--whitelist --multi-step --citation-max-hallucinations 0` for corpus-only, zero-hallucination output |
| U5 | 2026-03-09 | Standard flags block added to 2E | Every writing session should use the same anti-hallucination stack; flags are copy-paste ready |
