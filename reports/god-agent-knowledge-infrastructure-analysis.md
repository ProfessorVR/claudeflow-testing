# God Agent Knowledge Infrastructure: Comprehensive Analysis Report

**Date**: 2026-04-06  
**Scope**: Visual Provenance, KU/Reasoning Edge System, Corpus Index, Retrieval & Writing Integration  
**Purpose**: Document current state, identify gaps, and propose improvements for writing quality, retrieval, and cross-author concept integration

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Visual Provenance & Spatial Coordinate System](#2-visual-provenance--spatial-coordinate-system)
3. [Knowledge Units (KUs)](#3-knowledge-units-kus)
4. [Reasoning Edges](#4-reasoning-edges)
5. [Corpus Index System](#5-corpus-index-system)
6. [Integration Status: What's Wired vs. Theoretical](#6-integration-status-whats-wired-vs-theoretical)
7. [Critical Gaps](#7-critical-gaps)
8. [Improvement Recommendations](#8-improvement-recommendations)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Executive Summary

The God Agent project contains a sophisticated multi-layered knowledge infrastructure designed for dissertation-quality academic writing on rhetorical ontology. The system spans five interlocking subsystems:

| Subsystem | Scale | Status |
|-----------|-------|--------|
| **Visual Provenance** (bboxes) | 3,091 chunks, 98.5% coverage | Data layer complete; dashboard wiring pending |
| **Knowledge Units** | 401 KUs (398 Aristotle, 2 Rickert, 1 Heidegger) | Functional but domain-skewed |
| **Reasoning Edges** | 3,684 Phase 7 auto-derived | **Schema mismatch breaks write pipeline integration** |
| **Corpus Index** | 5 texts, 87 units, ~250 analysis files | Most complete subsystem; cross-pipeline hooks operational |
| **Retrieval Integration** | ChromaDB + SmartRetrievalLayer | Core retrieval works; KG boost/rerank never activated |

**The headline finding**: The corpus index system is the most valuable and most complete knowledge layer, yet it is the *least integrated* into the automated writing pipeline. Meanwhile, the KU/edge system that *is* wired into the pipeline has a critical schema mismatch that silently produces zero structural relationships in generated prose.

---

## 2. Visual Provenance & Spatial Coordinate System

### 2.1 Data Model

Each chunk in ChromaDB carries three bbox fields:

```
has_bboxes:    boolean     — true for 98.5% of 3,091 chunks
source_method: string      — "marker+bbox" | "pymupdf+bbox"
bboxes:        string      — JSON-encoded array of per-page entries
```

The bboxes JSON structure:

```json
[{
  "page_num": 354,
  "coords": [37.99, 40.87, 398.17, 542.61],    // super-box (union rect)
  "blocks": [                                     // individual text blocks
    [37.99, 40.87, 345.04, 148.70],
    [93.04, 161.76, 398.17, 268.04]
  ]
}]
```

- Coordinates are in native PDF point space (1/72 inch, origin top-left)
- A single chunk can span multiple pages (array has one entry per page)
- `coords` = union bounding rectangle; `blocks` = individual text-block rectangles

### 2.2 Coordinate Flow: Ingestion → Rendering

```
PDF (v7 pipeline)
 └─ PyMuPDF get_text("blocks") or Marker layout analysis
    └─ per-block [x1,y1,x2,y2] in PDF point space
       └─ merged into chunk-level coords + blocks
          └─ stored as JSON string in ChromaDB metadata
             └─ SmartRetrievalLayer.semanticSearch() → ContextChunk.metadata
                └─ write-pipeline CorpusSearchFn → CorpusChunk (gap CLOSED)
                   └─ EndnoteGenerator.filterAndRankQuotations()
                      └─ renderBboxOverlayAsync() → highlight-page.py
                         └─ 6-strategy text search cascade
                            └─ PNG with highlighted text or bbox fallback
```

### 2.3 Rendering Engine: `highlight-page.py`

The production renderer uses a 6-strategy cascade for text location:

1. Full text with Unicode normalization (NFC → NFKC → diacritics-stripped)
2. Original text as-is (no dehyphenation)
3. Sentence-level chunking (each sentence independently)
4. Overlapping phrase windows (12-word, step=6)
5. Progressive snippet fallback (150/100/60/40/25 char prefixes)
6. Start/end word windows (5/4/3-word from both ends)

Plus ±2 adjacent page scanning and a bbox structural fallback when all text strategies fail.

### 2.4 Visual Provenance Status

| Component | Status |
|-----------|--------|
| ChromaDB bbox storage | **Complete** — 98.5% coverage |
| SmartRetrievalLayer mapping | **Complete** — bbox fields in ContextChunk |
| Write pipeline CorpusSearchFn | **Complete** — bbox fields forwarded to CorpusChunk |
| Endnote generator rendering | **Complete** — full pipeline with fallback |
| KU source bbox backfill | **Complete** — via backfill-ku-bboxes.py |
| ICP Dashboard PDF viewer | **Pending** — Tasks 4-6 from unified plan |
| Bbox-informed retrieval ranking | **Not implemented** — bboxes are provenance-only |

---

## 3. Knowledge Units (KUs)

### 3.1 Data Model

```json
{
  "id": "ku_0073eab1d96588dc",           // "ku_" + MD5(claim+sources)
  "claim": "exact extracted sentence",
  "sources": [{
    "author": "Burke, Kenneth",
    "title": "A Grammar of Motives",
    "path_rel": "rhetorical_ontology/...",
    "pages": "356–358",
    "chunk_id": "0950ef01880ad8ae:00188",
    "has_bboxes": true,
    "source_method": "marker+bbox",
    "bboxes": "[...]"
  }],
  "confidence": "high",
  "tags": [],
  "domain": "aristotle",
  "created_from_query": "the triggering query",
  "debug": { "extract_reason": "...", "rank": 4, "distance": 0.735 }
}
```

### 3.2 Current State

| Metric | Value |
|--------|-------|
| Total KUs | 401 |
| Quarantined | 47 (archived 2026-03-26) |
| Domain: `aristotle` | 398 (99.3%) |
| Domain: `rickert` | 2 |
| Domain: `heidegger_bt` | 1 |
| With chunk_id | ~391 (batch-promoted have IDs; 10 original had null) |
| With bboxes | All that have chunk_ids (via backfill) |

### 3.3 Creation Pipeline

```
god-learn update --query "..."
  → Phase 4: query_chunks.py (ChromaDB semantic search)
  → Phase 5: Highlight re-ranking
  → Phase 6: promote_hits.py (extract claim, write to knowledge.jsonl)
  → Phase 7: reason_over_knowledge.py (auto-derive edges)
```

### 3.4 Critical Issue: Domain Skew

398/401 KUs are tagged `aristotle`. This is a coverage artifact — the batch promotion queries during the expansion sprint were Aristotle-focused. Heidegger, Rickert, and Uexküll are nearly absent from the KU layer despite having comprehensive corpus index analyses. This means:

- The 1.2x KU claim overlap boost in `boostWithKnowledgeGraph` would only benefit Aristotle-related queries
- KU-based prompt injection in the writing pipeline is almost exclusively Aristotelian
- Cross-author integration cannot rely on the KU layer in its current state

---

## 4. Reasoning Edges

### 4.1 Edge Sources

| Source | Count | Schema | In canonical reasoning.jsonl? |
|--------|-------|--------|-------------------------------|
| Phase 7 auto-derived | 3,684 | `reason_id`, `knowledge_ids`, `evidence[]` | **Yes** (only source) |
| Manual bootstrap (6 pipelines) | ~791 | `id`, `source`, `target`, `relation` | **No** — lost in Phase 7 re-run |
| LLM-derived | 2 | `id`, `source`, `target`, `confidence` | No — separate file |
| Historical Phase 7 | 277 | Mixed | No — separate file |

### 4.2 Schema Comparison (The Critical Mismatch)

**Manual/LLM edges** (what the write pipeline expects):
```json
{
  "id": "edge_fdcc4955000d",
  "source": "kinesis",              // ← named concept
  "target": "chronos",             // ← named concept
  "relation": "presupposes",
  "corroboration_score": 1.5
}
```

**Phase 7 edges** (what's actually in reasoning.jsonl):
```json
{
  "reason_id": "ru_001a003ecd14f010",
  "knowledge_ids": ["ku_db58...", "ku_e3ed..."],
  "evidence": [{ "ku_id": "...", "claim": "...", "sources": [...] }],
  "relation": "contrasts_with",
  "score": 0.182,
  "shared_ngrams_count": 87
}
```

**No `source` or `target` fields exist in Phase 7 edges.** The write pipeline filters edges by matching topic terms against `source`/`target` strings. With Phase 7 edges, this filter returns **zero matches every time**. The `## STRUCTURAL RELATIONSHIPS` block injected into writing prompts is silently empty.

### 4.3 Phase 7 Relation Distribution

| Relation | Count | % |
|----------|-------|---|
| `contrasts_with` | 1,886 | 51% |
| `supports` | 704 | 19% |
| `explains` | 547 | 15% |
| `defined_as` | 316 | 9% |
| `refines` | 156 | 4% |
| `presupposes` | 75 | 2% |

The `contrasts_with` dominance is a classifier artifact — short shared n-gram sets between philosophically distinct claims trigger the contrast classifier.

### 4.4 What Was Lost

The 791 manually-curated edges from the six analysis pipelines (phantasia, rickert, bt, bcap, uexkull, aristotle) encoded hand-verified philosophical relationships with **named concept nodes** (e.g., `kinesis PRESUPPOSES chronos`, `Befindlichkeit EXPLAINS attunement`). These were replaced when the full Phase 7 re-run overwrote `reasoning.jsonl`. They exist only in `tmp/backup-pre-ku-plan-2026-03-18/`.

---

## 5. Corpus Index System

### 5.1 Structure Overview

```
corpus/index/
├── Aristotle - Complete Works/          (117 files, Phase 4 complete)
│   ├── 33 unit JSONs, manifest.json
│   ├── 34 phase2 analyses
│   ├── corpus-ontology.md (20 core + 19 important nodes)
│   ├── 9 per-work ontologies + edge CSVs
│   ├── 9 cross-pipeline-hooks.md files
│   ├── bekker-index.json (157 loci)
│   ├── tension-edges.json (8+ cross-work pairs)
│   └── 8+ graph files (.mmd + .svg)
│
├── Heidegger - Being and Time/          (55 files, Phase 3 complete)
│   ├── bt-structured/ (17 units + manifest)
│   └── bt-analysis/ (37 files: phase2s, ontology, tensions, contested nodes, graphs)
│
├── Heidegger - Basic Concepts (BCAP)/   (42 files, Phase 3 complete)
│   ├── bcap-structured/ (13 units + manifest)
│   └── bcap-analysis/ (28 files: phase2s, ontology, tensions, graphs)
│
├── Rickert - Ambient Rhetoric/          (30 files, Phase 3 complete)
│   ├── rickert-structured/ (10 units + manifest)
│   └── rickert-analysis/ (19 files: phase2s, ontology, tensions, graphs)
│
└── Von Uexkull - A Foray.../           (46 files, Phase 3 complete)
    ├── uex-structured/ (14 units + manifest)
    └── uex-analysis/ (31 files: phase2s, ontology, tensions, contested nodes, graphs)
```

**Total**: ~290 files across 87 structural units and 5 texts.

### 5.2 Analysis Phase Architecture

Each text went through a multi-phase deep analysis:

| Phase | Product | Content |
|-------|---------|---------|
| **Phase 0** | `phase0-overview.md` | Book overview, structural table, provisional concepts, theses, tensions, unitization |
| **Phase 1** | `manifest.json` + unit JSONs | Structural decomposition into units with section-level metadata, page ranges, tags |
| **Phase 2** | `phase2-*.md` (per unit) | 6-section analysis: metadata, hierarchical outline, key concepts table (with German/Greek), positions & arguments, interlocutors, tensions |
| **Phase 3** | `book-level-ontology.md` | Canonical node list (core/important/peripheral tiers) with translations, types, definitions |
| **Phase 3B** | `tension-edges.json` | Productive tension pairs with dependency + conflict edges |
| **Phase 3C** | `global-edges.csv` | Intra-text conceptual edge list with relation, domain, evidence |
| **Phase 3D** | `contested-nodes.md` | Concepts that shift meaning across the text (BT: 7, Uexkull: documented) |
| **Phase 4** | Corpus-level synthesis | Cross-work ontology, Bekker index, per-work edges, cross-pipeline hooks (Aristotle only) |

### 5.3 Cross-Author Integration Mechanisms

The index system provides **five mechanisms** for cross-author concept linking:

**a. Cross-pipeline-hooks.md** (Aristotle only, 9 files)
Each hook maps an Aristotle locus (Bekker citation) to a target in BCAP, BT, Uexkull, or Rickert with a named bridge structure. Key documented chains:

- `ψυχή (DA)` → `ζωή πρακτική (BCAP)` → `Erschlossenheit / Being-in-the-World (BT)`
- `αἴσθησις (DA)` → `Befindlichkeit (BT)`
- `φάντασμα (DA)` → `Merkbild (Uexkull)` → perceptual representation
- `πάθος (Rhet)` → `Befindlichkeit (BCAP §§16-21 + BT §29)`
- `φόβος (Rhet II.5)` → `Furcht/Angst (BT §§30,40)` → BCAP φόβος analysis
- `λέξις/μεταφορά (Rhet III)` → Rickert's ambient suasion
- `πρὸ ὀμμάτων ποιεῖν` → `φαντασία (DA)` → `Erschlossenheit (BT)` (three-hop)
- `ἦθος as πίστις (Rhet)` → Heidegger's existential reading (BCAP)

**b. Cross-pipeline graph files** — Mermaid + SVG for Aristotle, Uexkull, BT, BCAP

**c. Tension edges with cross-text references** — BT tension-edges reference Aristotle's Physics IV; Aristotle tension-edges carry multi-work `works` fields

**d. Concept matrix + global edges** — Enable graph traversal within and across texts

**e. `[INTERP-high]` tagging** — All cross-text interpretive connections tagged for interpretive transparency

### 5.4 Completeness Assessment

| Text | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 3B | Phase 3D | Phase 4 | Cross-hooks |
|------|---------|---------|---------|---------|----------|----------|---------|-------------|
| Aristotle | ✓ | ✓ (33 units) | ✓ (34 files) | ✓ (corpus-level) | ✓ (8+ pairs) | — | ✓ | ✓ (9 files) |
| BT | ✓ | ✓ (17 units) | ✓ (17 files) | ✓ (37 nodes) | ✓ (9 pairs) | ✓ (7 nodes) | — | — |
| BCAP | ✓ | ✓ (13 units) | ✓ (13 files) | ✓ (37 nodes) | ✓ (7 pairs) | — | — | — |
| Rickert | ✓ | ✓ (10 units) | ✓ (12 files) | ✓ | ✓ (4+ pairs) | — | — | — |
| Uexkull | ✓ | ✓ (14 units) | ✓ (14 files) | ✓ (28 nodes) | ✓ (10 pairs) | ✓ | — | — |

**Key gaps**: Only Aristotle has cross-pipeline hooks. BT Section 5a "BCAP Cross-References" was planned but disabled. No Rickert contested-nodes analysis.

---

## 6. Integration Status: What's Wired vs. Theoretical

### 6.1 Summary Table

| Data Source | Python Retrieval | TS Writing Pipeline | TS Quality Check | Endnote Gen |
|-------------|-----------------|---------------------|------------------|-------------|
| **ChromaDB chunks** | ✓ Fully wired | ✓ Via SmartRetrievalLayer | ✓ Corpus context | — |
| **Bbox data** | Pass-through only | ✓ In ContextChunk metadata | — | ✓ Rendering |
| **KUs (knowledge.jsonl)** | Source for edges | ✓ Text bullets in prompt | — | — |
| **Reasoning edges** | — | **BROKEN** (schema mismatch) | Stderr-only check | — |
| **Corpus index structured units** | — | **NOT WIRED** | — | — |
| **Corpus index phase2 analyses** | — | **NOT WIRED** | — | — |
| **Corpus index ontologies** | — | **NOT WIRED** | — | — |
| **Cross-pipeline hooks** | — | **NOT WIRED** | — | — |
| **Tension edges (index)** | — | **NOT WIRED** | — | — |
| **Global edges CSVs** | — | **NOT WIRED** | — | — |
| **Concept matrices** | — | **NOT WIRED** | — | — |
| **KG boost (boostWithKG)** | N/A | Code exists, **never enabled** | N/A | N/A |
| **Cross-encoder rerank** | N/A | Flag accepted, **stub (no-op)** | N/A | N/A |

### 6.2 What the Writing Pipeline Actually Uses

1. **ChromaDB semantic search** → raw chunk text with author/title/pages
2. **KU claims** → up to 10 plain-text bullets (keyword-filtered, almost all Aristotle)
3. **Reasoning edges** → intended to inject up to 30 structural relationships, but **silently produces zero** due to Phase 7 schema mismatch
4. **Bbox data** → forwarded to endnote generator for visual rendering only

### 6.3 What the Writing Pipeline Does NOT Use

- The entire corpus index system (~290 files of deep structural analysis)
- Cross-pipeline hooks (the hand-verified cross-author concept bridges)
- Book-level ontologies (canonical concept definitions with Greek/German)
- Tension edges (productive philosophical tensions with synthesis notes)
- Concept matrices (concept distribution across units)
- Global edge CSVs (verified intra-text conceptual relationships)
- Contested nodes (concepts that shift meaning — critical for accurate citation)

---

## 7. Critical Gaps

### Gap 1: Phase 7 Edge Schema Mismatch (CRITICAL — Silent Failure)

**Impact**: The `## STRUCTURAL RELATIONSHIPS` section in every writing prompt is empty. The write pipeline's Step 2b and `SmartRetrievalLayer.boostWithKnowledgeGraph()` both filter on `source`/`target` fields that don't exist in Phase 7 edges.

**Root cause**: Phase 7 re-run replaced the manual bootstrap edges (which had named concept nodes) with KU-pair edges (which have `knowledge_ids` and `evidence[]` arrays instead).

**Current effect**: Zero structural relationships are injected into any generated prose. The system operates as if the reasoning edge layer doesn't exist.

### Gap 2: Corpus Index Completely Disconnected from Pipeline

**Impact**: ~290 files of hand-verified structural analysis, concept ontologies, cross-author hooks, and philosophical tension analysis are invisible to the writing pipeline. The system generates prose using only raw chunk retrieval + a few KU claims, ignoring the most sophisticated layer of analysis.

**This is the single largest quality opportunity.** The corpus index contains:
- Named concept definitions that would prevent terminological imprecision
- Cross-pipeline hooks that would enable structurally grounded cross-author integration
- Tension analyses that would enable nuanced treatment of philosophical disagreements
- Concept matrices that would inform section-level topic coverage

### Gap 3: KU Domain Skew

**Impact**: 99.3% of KUs are Aristotle-domain. The KU layer provides essentially no support for writing about Heidegger, Rickert, or Uexkull.

### Gap 4: Manual Bootstrap Edges Not Restored

**Impact**: 791 hand-verified philosophical relationship edges (with named concept nodes) exist only in backup. These are the edges that would actually work with the current write pipeline's `source`/`target` filtering.

### Gap 5: KG Boost and Rerank Never Activated

**Impact**: The retrieval stage calls `retrieveContext()` without `boostWithKG: true`, and `rerank: true` calls a stub. Two implemented-but-unused features that would improve retrieval relevance.

### Gap 6: Edge Coherence Check is Non-Blocking

**Impact**: `validateEdgeCoherence()` finds contradictions between generated text and edge relationships but only logs to stderr. It never triggers revision or contributes to the quality gauntlet score.

### Gap 7: Bbox Data Unused for Retrieval Quality

**Impact**: Bboxes enable precise page-region provenance but are only used for endnote rendering. They could inform retrieval confidence (chunks with precise spatial coordinates are more reliably attributed) and citation validation (verify quoted text actually appears at the claimed page location).

---

## 8. Improvement Recommendations

### 8.1 HIGH PRIORITY — Fix What's Broken

#### R1: Restore Manual Bootstrap Edges + Adapter Layer
**Effort**: Medium  
**Impact**: Immediate — structural relationships re-appear in writing prompts

1. Restore the 791 manual edges from `tmp/backup-pre-ku-plan-2026-03-18/` into a canonical file (e.g., `god-reason/manual-edges.jsonl`)
2. Modify the edge-loading code in `retrieval-stage.ts` to read **both** `reasoning.jsonl` and `manual-edges.jsonl`
3. Add a Phase 7 → write-pipeline adapter that extracts concept terms from `evidence[].claim` to synthesize `source`/`target` pseudo-fields for Phase 7 edges
4. Merge-sort by `corroboration_score` / `score` (normalized)

#### R2: Enable KG Boost in Retrieval Stage
**Effort**: Low (one-line change)  
**Impact**: 1.2x score boost for chunks backed by verified KU claims

Set `boostWithKG: true` in the `retrieveContext()` calls within `runRetrievalStage()`. The implementation already works — it's just never turned on.

### 8.2 HIGH PRIORITY — Connect the Corpus Index

#### R3: Corpus Index Injection Layer
**Effort**: High  
**Impact**: Transformative — enables structurally grounded cross-author integration

Build a `CorpusIndexProvider` that:
1. Loads relevant `book-level-ontology.md` for each author appearing in the topic/section
2. Extracts canonical concept definitions matching retrieved chunk concepts
3. Loads relevant `cross-pipeline-hooks.md` entries for cross-author sections
4. Injects a `## CANONICAL CONCEPTS` and `## CROSS-AUTHOR BRIDGES` block into the gold standard prompt

**Prompt injection format**:
```
## CANONICAL CONCEPTS
- **Befindlichkeit** (attunement/disposition): Heidegger's term for the existential 
  structure through which Dasein finds itself always already in a mood...
  [BT §29, BCAP §§16-21]

## CROSS-AUTHOR BRIDGES
- Aristotle's πάθος (Rhet II) → Heidegger's Befindlichkeit (BT §29): 
  Both identify affective disclosure as rhetorically constitutive, not merely 
  ornamental. [INTERP-high]
```

#### R4: Tension-Aware Writing Constraints
**Effort**: Medium  
**Impact**: Prevents false synthesis; enables nuanced argumentation

1. Load `tension-edges.json` for relevant texts
2. When the topic involves two nodes that appear in a tension pair, inject the tension description as a writing constraint
3. Instruction: "These concepts stand in productive tension — do not collapse them into simple equivalence"

### 8.3 MEDIUM PRIORITY — Expand Coverage

#### R5: Multi-Domain KU Expansion
**Effort**: Medium (batch scripting)  
**Impact**: Balances KU layer across all five texts

Run `god-learn update` with queries targeting Heidegger, Rickert, and Uexkull concepts:
- BT: Befindlichkeit, Erschlossenheit, Zuhandenheit, Zeitlichkeit, In-der-Welt-sein
- BCAP: ζωή πρακτική, λόγος ἀποφαντικός, πάθη, ἕξις
- Rickert: ambient rhetoric, attunement, dwelling, chōra, kairos
- Uexkull: Umwelt, Funktionskreis, Merkwelt, Bedeutung, Gegengefüge

Target: ≥50 KUs per domain.

#### R6: LLM Edge Derivation at Scale
**Effort**: Medium  
**Impact**: High-quality concept-node edges that work with existing pipeline

The LLM edge pipeline (`llm-edge-derivation.py`) produces edges with proper `source`/`target` fields. Scale from 2 → 200+ edges. These would immediately work with the write pipeline's existing filtering logic.

### 8.4 MEDIUM PRIORITY — Quality Improvements

#### R7: Wire Edge Coherence into Quality Gauntlet
**Effort**: Low  
**Impact**: Catches logical contradictions before output

Modify `validateAndRevise()` to include edge coherence score as a gauntlet stage. If the generated text contradicts ≥2 verified edges, trigger a revision pass with the contradictions cited.

#### R8: Bbox-Informed Citation Validation
**Effort**: Medium  
**Impact**: Higher citation accuracy

Add a post-generation step that:
1. For each citation in generated text, checks if the cited chunk has bboxes
2. If yes, verifies the cited page range falls within the bbox page ranges
3. Flags citations where the text's page claim doesn't match the bbox data

### 8.5 LOWER PRIORITY — Infrastructure

#### R9: Implement Cross-Encoder Reranking
**Effort**: High (requires model selection + inference pipeline)  
**Impact**: Better retrieval precision, especially for nuanced philosophical queries

Replace the `rerankResults()` stub with an actual cross-encoder (e.g., `bge-reranker-v2-m3` via the vLLM server or a dedicated endpoint).

#### R10: ICP Dashboard Visual Provenance (Tasks 4-6)
**Effort**: Medium  
**Impact**: Observable verification of citation spatial accuracy

Complete the three remaining tasks from `unified-visual-provenance-plan.md`:
- Task 4: ICP API bbox query parameter
- Task 5: Dashboard quote detail modal with match badges
- Task 6: `X-ICP-Match-Type` response header

---

## 9. Implementation Roadmap

### Phase A: Fix the Broken Edge Pipeline (1 session)

1. Restore manual edges from backup → `god-reason/manual-edges.jsonl`
2. Modify `retrieval-stage.ts` edge loader to read both files
3. Add Phase 7 adapter to extract concept pseudo-fields from evidence claims
4. Set `boostWithKG: true` in retrieval calls
5. **Verify**: Run a test generation and confirm `## STRUCTURAL RELATIONSHIPS` is non-empty

### Phase B: Corpus Index Integration (2-3 sessions)

1. Build `CorpusIndexProvider` class with loaders for:
   - `book-level-ontology.md` → canonical concept definitions
   - `cross-pipeline-hooks.md` → cross-author bridges
   - `tension-edges.json` → productive tensions
   - `global-edges.csv` → verified relationships
2. Add concept-matching logic (match retrieved chunk concepts against ontology nodes)
3. Add prompt injection into `GoldStandardPromptBuilder`
4. Add tension-aware writing constraints
5. **Verify**: Generate a cross-author section (e.g., Aristotle πάθος → Heidegger Befindlichkeit) and compare quality with/without index injection

### Phase C: Coverage Expansion (1-2 sessions)

1. Run batch KU promotion for Heidegger, Rickert, Uexkull domains
2. Scale LLM edge derivation to 200+ edges
3. Re-run Phase 7 to generate edges over the expanded KU set
4. Merge manual + Phase 7 + LLM edges with proper schema handling

### Phase D: Quality & Observability (1-2 sessions)

1. Wire edge coherence into quality gauntlet
2. Add bbox-informed citation validation
3. Complete ICP dashboard visual provenance (Tasks 4-6)
4. Add corpus index coverage metrics to the observability dashboard

---

## Appendix A: File Locations

| File | Purpose | Count |
|------|---------|-------|
| `god-learn/knowledge.jsonl` | Canonical KU store | 401 |
| `god-learn/index.json` | KU byte-offset index | 401 entries |
| `god-learn/quarantine-2026-03-26.jsonl.archive` | Removed KUs | 47 |
| `god-reason/reasoning.jsonl` | Canonical edges (Phase 7 only) | 3,684 |
| `god-reason/llm-derived-edges.jsonl` | LLM edges | 2 |
| `god-reason/phase7-derived-edges.jsonl` | Historical Phase 7 | 277 |
| `god-reason/review-queue.json` | Contradiction audit | 0 active |
| `corpus/index/` | Structured text analyses | ~290 files |
| `scripts/ingest/render_citation_bbox.py` | Chunk bbox renderer | — |
| `scripts/pdf/highlight-page.py` | Production quote renderer | — |
| `scripts/backfill-ku-bboxes.py` | KU bbox backfill | — |
| `scripts/reason/reason_over_knowledge.py` | Phase 7 edge derivation | — |
| `scripts/learn/promote_hits.py` | KU promotion | — |
| `scripts/merge-reasoning-edges.py` | Edge merge migration | — |
| `src/god-agent/retrieval/smart-retrieval-layer.ts` | KG-boosted retrieval | — |
| `src/god-agent/universal/knowledge-manager.ts` | TS KU bridge | — |
| `src/god-agent/universal/quality-integration.ts` | Edge coherence check | — |
| `src/god-agent/cli/quality/endnote-generator.ts` | Bbox rendering pipeline | — |

## Appendix B: Cross-Author Concept Integration Chains (from corpus index)

These chains are documented in the cross-pipeline-hooks.md files and represent the core dissertation argument structure:

```
Aristotle ψυχή (DA) ──→ BCAP ζωή πρακτική ──→ BT Erschlossenheit
     │                        │                      │
     └── αἴσθησις (DA) ─────→ Befindlichkeit ←──── πάθος (Rhet)
                                    │
                                    └──→ Rickert: ambient attunement
     
     φάντασμα (DA) ──→ Uexkull Merkbild ──→ perceptual representation
                             │
                             └── Funktionskreis ──→ organism-environment
                                                     world-constitution
     
     φόβος (Rhet II.5) ──→ BT Furcht/Angst (§§30,40) ──→ BCAP φόβος
     
     λέξις/μεταφορά (Rhet III) ──→ Rickert: ambient suasion
     
     πρὸ ὀμμάτων ποιεῖν ──→ φαντασία (DA) ──→ Erschlossenheit (BT)
```

These chains are currently *documented but not machine-readable by the pipeline*. Making them available to the writing system would be the single highest-impact improvement for dissertation-quality cross-author integration.
