# Comprehensive System Analysis: Knowledge, Reasoning, Writing, and Ingestion Pipelines

**Date**: 2026-04-07
**Scope**: Line-by-line analysis of every file in the knowledge, reasoning, reporting, writing, and ingestion systems
**Focus**: Hardening opportunities + leveraging the corpus index for cross-author analysis

---

## 1. System Inventory

| System | Primary Files | Records | Validation |
|--------|--------------|---------|------------|
| **Knowledge** | `god-learn/knowledge.jsonl` + `index.json` | 401 KUs | Zod schema + mtime cache |
| **Reasoning** | `god-reason/reasoning.jsonl` + `index.json` | 2,297 edges (788 manual, 33 bridge, 1,476 phase7) | SHA256 hash + referential integrity |
| **Ingestion** | `scripts/ingest/run_ingest*.py`, `manifest.jsonl` | 50 PDFs, 3,091 chunks | 3-tier fidelity gate |
| **Corpus Index** | `corpus/index/compiled-index.json` | ~500 ontology nodes, 120 tensions, 40 cross-pipeline hooks | Manual curation |
| **Writing** | `icp-orchestrator.ts`, `quality-integration.ts` | 11-stage pipeline | Citation enforcement + gauntlet |
| **Shared Loaders** | `src/god-agent/shared/jsonl-loaders.ts` | N/A | mtime-based invalidation |

---

## 2. Architecture Flow

```
INGESTION (3-tier: Marker GPU -> PyMuPDF -> pdftotext)
  |
  v
MANIFEST (manifest.jsonl: doc_id, author_raw, title_raw, chunks, sha256)
  |
  v
CHROMA (knowledge_chunks collection, 1536-D embeddings, per-chunk metadata)
  |
  v
PROMOTION (Phase 6: retrieval hits -> KU extraction -> knowledge.jsonl)
  |
  v
KNOWLEDGE (401 KUs with claim + sources[] + confidence)
  |
  v
REASONING (Phase 7: pairwise char n-gram similarity -> 15 canonical relations)
  |           + Manual edges (788) + Bridge edges (33) + LLM-derived (subset)
  |           + Dedup (C-01 self-ref removal, C-02 triple dedup)
  v
CORPUS INDEX (compiled-index.json: ontologyNodes, tensionEdges, crossPipelineHooks)
  |
  v
WRITING PIPELINE (11-stage ICP orchestrator)
  |-- Stage 2: Faceted retrieval (ChromaDB + KG boost)
  |-- Stage 4: Auto-verification (OCR-tolerant, 0.70 threshold)
  |-- Stage 6: Atom binding (claims -> quotes)
  |-- Stage 8: Generation (paragraph-by-paragraph + drift check)
  |-- WS4: Citation enforcement (3-phase: validate, fidelity, grounding)
  |-- WS5: Sanitization (2-pass artifact removal)
  |-- WS6: Quality gauntlet (8 stages, 0.80 threshold)
  |-- WS7: Endnote generation
  |-- Post: Edge coherence check (async, non-fatal)
  v
EXPORT (generated text + quality gates + endnotes + bibliography)
```

---

## 3. Findings by System

### 3.1 Knowledge System

**Strengths**:
- Zod-validated at parse boundary (TypeScript) with `.passthrough()` for forward compatibility
- mtime-based cache prevents stale reads in long-running processes (Fix F-09)
- Deterministic KU IDs: `ku_<sha256_first_16_hex>` ensures reproducibility
- Byte-offset index (`god-learn/index.json`) enables O(1) random access
- Rich provenance: bboxes, source_method, chunk_id per source

**Weaknesses**:

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| K-01 | **Multi-source KUs have no author consistency check.** A KU can cite contradictory authors as joint support for the same claim without flagging. | HIGH | `god-learn/knowledge.jsonl` schema |
| K-02 | **Confidence is per-KU, not per-source.** A high-confidence KU with one strong source and one weak source looks uniformly strong. | MEDIUM | `retrieval/types.ts:35-43` |
| K-03 | **No author-level aggregation.** Cannot query "all KUs by Heidegger" without scanning all 401 entries. | MEDIUM | No author index exists |
| K-04 | **`created_from_query` is optional and often null.** Provenance of how the KU was discovered is incomplete for manually promoted units. | LOW | Knowledge schema |
| K-05 | **Domain field is free-text.** Values like "aristotle", "temporal", "rhetorical" are not validated against a controlled vocabulary. | LOW | No enum validation |

### 3.2 Reasoning System

**Strengths**:
- 15 canonical relations with clear semantic hierarchy
- Deterministic generation: SHA256 hash of canonical fields, sorted output
- Top-K pruning (12 per unit) prevents edge explosion
- Contradiction gate blocks pipeline on hard conflicts (supports + contrasts_with)
- Three derivation types (manual, phase7, bridge) with separate trust levels

**Weaknesses**:

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| R-01 | **Phase 7 auto-derived edges are author-blind.** Pairwise comparison uses char n-gram similarity on claim text only; author identity is ignored. Two KUs from opposing authors can get a "supports" edge if they use similar vocabulary. | CRITICAL | `reason_over_knowledge.py:121-156` |
| R-02 | **Bridge edges are manually curated and frozen.** Only 33 bridge edges exist (18 BCAP, 15 B&T). No automated cross-pipeline bridge discovery. | HIGH | `god-reason/reasoning.jsonl` |
| R-03 | **Unanchored edges silently dropped.** Phase 7 edges without ontology anchors go to `unanchored-edges.jsonl` but are never reintegrated or surfaced. | HIGH | `merge-reasoning-edges.py:137-153` |
| R-04 | **Corroboration scoring doesn't weight by derivation.** A manual edge (human-curated) and a phase7 edge (auto-generated) contribute equally to corroboration. | MEDIUM | `compute-corroboration.py` |
| R-05 | **Soft tensions not blocking.** `{depends_on, contrasts_with}` pairs warn but don't block, allowing semantically questionable edges to propagate. | MEDIUM | `god_learn.py:45-111` |
| R-06 | **`is_variant_of` relation never triggers.** Despite the fix being in place (`score >= 0.18`), no current KU pairs qualify because discourse markers fire first. The relation exists in the ontology but has zero instances. | LOW | `reason_over_knowledge.py:149` |
| R-07 | **Topic bucketing disabled.** All 401 KUs in a single "all" bucket means O(n^2) pairwise comparison (80,200 pairs). Performance concern if KU count grows. | LOW | `reason_over_knowledge.py:183-188` |

### 3.3 Corpus Index (compiled-index.json)

**Strengths**:
- Rich ontology: ~500 nodes with Greek text, transliterations, definitions, centrality tiers
- 120 tension edges documenting intra-work conceptual conflicts
- 40 cross-pipeline hooks connecting authors (Aristotle <-> Heidegger <-> Rickert <-> Von Uexkull)
- ~1,200 canonical terms for greedy regex matching

**Weaknesses**:

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| I-01 | **Cross-pipeline hooks not consumed by writing pipeline.** 40 meticulously curated author bridges exist but the ICP orchestrator never queries them. | CRITICAL | `compiled-index.json` vs `icp-orchestrator.ts` |
| I-02 | **Tension edges not surfaced in quality gates.** 120 documented conceptual tensions exist but are not checked during generation or validation. | CRITICAL | `compiled-index.json` vs `quality-integration.ts` |
| I-03 | **Index is static.** No pipeline to automatically discover new ontology nodes, tensions, or hooks from newly ingested PDFs. | HIGH | Manual curation only |
| I-04 | **No author authority scoring.** All authors treated equally. No mechanism to weight primary sources (Aristotle's own text) over secondary commentary (interpreters). | HIGH | Entire pipeline |
| I-05 | **Canonical terms list (1,200 entries) not used for KU extraction.** Terms could guide which claims to extract but are only used for regex matching in merge. | MEDIUM | `compiled-index.json` |

### 3.4 Ingestion Pipeline

**Strengths**:
- 3-tier extraction with scholarly fidelity gate (Bekker numbers, Greek Unicode)
- Bounding box preservation (98.3% across corpus)
- Page-aware chunking (800-1200 tokens) with page_start/page_end tracking
- Deterministic doc_id: `sha256(path_rel:sha256)[:16]`
- Manifest tracks every file with status, phase, error, sha256

**Weaknesses**:

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| G-01 | **Author normalization is filename-dependent.** Regex parses "Author - Title_(Year)_[Qualifier].pdf" but has no canonical author table. "Von Uexkull" vs "Uexkull" vs "von Uexkull, Jakob" are treated as different authors. | HIGH | `run_ingest.py:84-94` |
| G-02 | **No cross-document deduplication.** If the same passage appears in two PDFs (e.g., Aristotle's Metaphysics in "Complete Works" and standalone edition), it creates duplicate chunks with different doc_ids. | MEDIUM | Chunking pipeline |
| G-03 | **Chunk boundary can split mid-sentence.** Token-count greedy packing doesn't check sentence boundaries. | MEDIUM | `run_ingest.py:216-285` |
| G-04 | **No OCR error rate tracking per chunk.** Fidelity gate is per-PDF but individual chunks may have varying OCR quality. | LOW | `scholarly_fidelity_gate.py` |

### 3.5 Writing Pipeline (ICP Orchestrator)

**Strengths**:
- 11-stage pipeline with checkpoint recovery
- 3-phase citation enforcement (validate, fidelity 0.70, grounding 0.30)
- Author scrubbing with diacritic-aware matching and nobiliary particle handling
- Non-corpus author removal via signal phrase regex
- Drift flag system catches generation divergence from evidence

**Weaknesses**:

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| W-01 | **Edge coherence is post-hoc only.** Contradictions between reasoning edges and generated text are detected AFTER generation, not prevented during binding or generation. | CRITICAL | `icp-orchestrator.ts:597-610` |
| W-02 | **No cross-author analysis at any pipeline stage.** Atoms from incompatible philosophical frameworks can be bound to the same paragraph without conflict detection. | CRITICAL | `icp-orchestrator.ts` stages 6-8 |
| W-03 | **Author-title pairing not validated.** Citation enforcer checks author OR title existence in corpus, not that the specific author wrote the specific title. | HIGH | `citation-enforcer.ts:175-227` |
| W-04 | **Post-correction author loss.** When citation enforcer auto-corrects a non-verbatim quote, the original author attribution may be silently dropped. | HIGH | `citation-enforcer.ts:329-366` |
| W-05 | **Quality gates are all non-fatal.** Failed gauntlet, failed edge coherence, failed citation enforcement (in auto-correct mode) all allow export to proceed. | HIGH | `icp-orchestrator.ts` (all try/catch blocks) |
| W-06 | **`endnote_leaks` shape was wrong.** Fixed in Phase 0 today (`{cleaned:true}` -> `{leaksRemoved:0}`), but indicates test coverage gap for quality gate shapes. | MEDIUM | `icp-api-routes.ts:1623` (FIXED) |
| W-07 | **Inline validator has no author coverage check.** `validateParagraph()` checks quote presence and atom coverage but not author diversity or author-specific requirements. | MEDIUM | `icp-inline-validator.ts:67-141` |
| W-08 | **No `author_conflict_detected` event type.** Session event system has 22 event types but none for author conflicts. | MEDIUM | `icp-session-events.ts:114-137` |

---

## 4. Cross-Author Analysis: Current State vs. Potential

### 4.1 What Exists

| Mechanism | Location | Cross-Author Capability |
|-----------|----------|------------------------|
| Cross-pipeline hooks | `compiled-index.json` (40 entries) | Aristotle <-> Heidegger <-> Rickert <-> Von Uexkull bridges |
| Tension edges | `compiled-index.json` (120 entries) | Intra-work only; no inter-author tensions |
| Bridge edges | `god-reason/reasoning.jsonl` (33 edges) | Manual cross-pipeline connections |
| Author scrubber | `author-scrubber.ts` | Removes non-corpus authors; no analysis |
| Pipeline field on edges | `reasoning.jsonl` | Tracks which author pipeline generated the edge |
| Corroboration scoring | `compute-corroboration.py` | Multi-pipeline agreement (indirect cross-author) |

### 4.2 What's Missing

| Gap | Impact | Recommendation |
|-----|--------|---------------|
| **No author-aware edge inference** | Phase 7 treats all KU pairs identically regardless of author | Add author-scoped bucketing: group KUs by author, then run cross-author comparison separately with enriched relation vocabulary |
| **Cross-pipeline hooks not consumed** | 40 curated bridges are wasted; LLM never sees them | Load `compiled-index.json` hooks in retrieval stage and inject as structural constraints alongside reasoning edges |
| **Tension edges not surfaced** | 120 documented contradictions invisible to quality gates | Create a `validateTensionAwareness()` quality gate that checks if generated text acknowledges known tensions |
| **No author authority tiers** | Primary texts weighted same as commentary | Add `authority_tier: 'primary' | 'secondary' | 'tertiary'` to manifest metadata and propagate to KU sources |
| **No cross-author conflict detection in binding** | Atoms from opposing frameworks silently merged | Add `checkAuthorConflict()` in atom binding (Stage 6) that cross-references reasoning edges for contrasts_with relations |
| **No author coverage requirement** | A paragraph about "Aristotle and Heidegger" could cite only one | Add `minDistinctAuthors` parameter to facet-level strictness configuration |

### 4.3 Leveraging the Index for Cross-Author Integration

The `compiled-index.json` is a goldmine that the pipeline currently ignores. Here's how each component could be leveraged:

**ontologyNodes (~500 entries)**:
- Use canonical definitions to VALIDATE KU claims during promotion (Phase 6)
- Surface centrality tier in retrieval ranking (core concepts boosted)
- Map KU claims to ontology nodes for structured knowledge graph

**tensionEdges (120 entries)**:
- Inject as CONSTRAINTS during generation: "When discussing X, acknowledge the tension between A and B"
- Use as QUALITY GATE: if generated text asserts X without acknowledging documented tension, flag for revision
- Feed into edge coherence check as additional contradiction sources

**crossPipelineHooks (40 entries)**:
- Load as STRUCTURAL CONSTRAINTS in gold standard prompt (alongside reasoning edges)
- Use to REQUIRE cross-author integration: "This section bridges Aristotle's phantasia with Heidegger's Erschlossenheit"
- Add as REQUIRED BINDINGS: if a facet covers a hook topic, ensure both authors are cited

**canonicalTerms (1,200 entries)**:
- Use for KU EXTRACTION: surface claims that contain canonical terms first
- Use for CONCEPT NORMALIZATION: map variant spellings to canonical forms before comparison
- Use for RETRIEVAL BOOST: queries containing canonical terms get enhanced search

---

## 5. Hardening Recommendations (Prioritized)

### Priority 1: Critical (Prevents Silent Errors)

| # | Recommendation | Effort | Files |
|---|---------------|--------|-------|
| H-01 | **Inject cross-pipeline hooks into generation prompts.** Load the 40 hooks from `compiled-index.json` and include relevant ones as structural constraints in the gold standard prompt, alongside reasoning edges. | Medium | `icp-orchestrator.ts`, `write-pipeline-orchestrator.ts` |
| H-02 | **Add tension-aware quality gate.** Create `validateTensionAwareness()` that checks if generated text acknowledges documented tensions when discussing concepts that appear in tensionEdges. | Medium | `quality-integration.ts` |
| H-03 | **Move edge coherence from post-hoc to preventive.** Run edge coherence check BEFORE generation (during binding, Stage 6) to prevent contradictory bindings from being created. | Medium | `icp-orchestrator.ts` |
| H-04 | **Add author-scoped reasoning.** In Phase 7, bucket KUs by author before pairwise comparison. Cross-author pairs should use enriched relation inference that considers the authors' frameworks. | High | `reason_over_knowledge.py` |

### Priority 2: High (Improves Accuracy)

| # | Recommendation | Effort | Files |
|---|---------------|--------|-------|
| H-05 | **Build canonical author table.** Create `corpus/index/authors.json` mapping variant names to canonical forms (e.g., "Von Uexkull" -> "von Uexkull, Jakob Johann"). Use during ingestion and KU extraction. | Low | New file + `run_ingest.py` |
| H-06 | **Add author-title pairing validation.** Citation enforcer should verify that cited (author, title) pairs actually exist in corpus, not just author OR title. | Medium | `citation-enforcer.ts` |
| H-07 | **Surface unanchored edges.** Instead of dropping Phase 7 edges without ontology anchors, surface them as "candidate relationships" in the dashboard for human review. | Low | `merge-reasoning-edges.py`, dashboard |
| H-08 | **Add authority tiers to manifest.** Extend manifest metadata with `authority_tier: 'primary' | 'secondary' | 'tertiary'` based on whether the PDF is the author's own work or commentary. | Low | `run_ingest.py`, manifest schema |

### Priority 3: Medium (Improves Analysis)

| # | Recommendation | Effort | Files |
|---|---------------|--------|-------|
| H-09 | **Build author-level KU index.** Create `god-learn/authors-index.json` mapping each author to their KU IDs for O(1) author-scoped queries. | Low | New file + `god_learn.py` |
| H-10 | **Add `minDistinctAuthors` to facet strictness.** Allow facets to require N distinct author citations. | Low | `icp-types.ts`, `icp-orchestrator.ts` |
| H-11 | **Re-enable topic bucketing.** Currently disabled in Phase 7 (`reason_over_knowledge.py:183-188`). Re-enable with author-aware buckets to reduce O(n^2) scaling. | Medium | `reason_over_knowledge.py` |
| H-12 | **Add `author_conflict_detected` event.** New session event type for cross-author conflicts during binding/generation. | Low | `icp-session-events.ts` |

### Priority 4: Low (Polish)

| # | Recommendation | Effort | Files |
|---|---------------|--------|-------|
| H-13 | **Validate domain field against controlled vocabulary.** Add enum validation to KU domain field matching corpus index domains. | Low | `retrieval/types.ts` |
| H-14 | **Track per-chunk OCR error rate.** Add `ocr_quality_score` to chunk metadata during ingestion for downstream quality weighting. | Medium | Ingestion pipeline |
| H-15 | **Add canonical term boosting in retrieval.** Use the 1,200 canonical terms from compiled-index.json to boost retrieval relevance when queries contain known philosophical terms. | Medium | Retrieval stage |

---

## 6. Compiled Index Deep Dive

### 6.1 Cross-Pipeline Hooks (Highest Leverage)

These 40 entries are the most valuable untapped resource. Sample entries:

| Hook ID | Source | Target | Bridge |
|---------|--------|--------|--------|
| `hook-de-anima-02` | DA's phantasia | B&T's Erschlossenheit | "DA's phantasia as the faculty that discloses appearances is structurally parallel to B&T's Erschlossenheit as the disclosedness of Being-in-the-world" |
| `hook-de-anima-03` | DA's aisthesis | B&T's Befindlichkeit | "DA's account of aisthesis as always-already-receptive maps onto B&T's Befindlichkeit as the pre-reflective attunement that constitutes thrown being-in-the-world" |
| `hook-de-anima-01` | DA's psyche | BCAP's zoe praktike | "DA's psyche as the principle of living movement anticipates BCAP's zoe praktike as the self-articulating life of practical engagement" |

**Current usage**: Only referenced by `merge-reasoning-edges.py` for ontology anchoring.
**Recommended usage**: Inject into generation prompts as REQUIRED structural connections.

### 6.2 Tension Edges (Quality Gate Material)

These 120 entries document where a single author's concepts are in tension:

| Tension ID | Node A | Node B | Tension |
|------------|--------|--------|---------|
| CT-01 | energeia (Metaphysics: pure actuality) | energeia (Rhetoric: vivid delivery) | "energeia shifts from metaphysical priority of pure actuality to rhetorical quality of vividness" |
| CT-45 | phantasia (DA: faculty distinct from sensation) | phantasia (DA: requires prior sensation) | "phantasia is both independent cognitive faculty and dependent on aisthesis" |

**Current usage**: Not consumed by any pipeline component.
**Recommended usage**: Quality gate that checks if text discussing these concepts acknowledges the documented tension.

### 6.3 Ontology Nodes (Concept Normalization)

The ~500 ontology nodes provide a canonical concept vocabulary:

```json
{
  "term": "phantasia (φαντασία)",
  "greek": "φαντασία",
  "transliteration": "phantasia",
  "definition": "The faculty of appearing/imagination in De Anima...",
  "centralityTier": "core",
  "units": ["DA-01", "DA-02", "DA-03"],
  "texts": ["Aristotle - De Anima", "Aristotle - Complete Works"]
}
```

**Current usage**: canonicalTerms list used for greedy regex matching in merge script.
**Recommended usage**: Concept normalization layer between KU extraction and reasoning.

---

## 7. Quantitative Summary

| Metric | Current | After Hardening (Estimated) |
|--------|---------|---------------------------|
| Knowledge Units | 401 | 401 (no change; quality improves) |
| Reasoning Edges | 2,297 | ~2,400 (unanchored reintegration, new bridge discovery) |
| Cross-Pipeline Hooks Used | 0 of 40 | 40 of 40 |
| Tension Edges Surfaced | 0 of 120 | 120 of 120 |
| Author Normalization | Filename-based | Canonical table + diacritic normalization |
| Cross-Author Quality Gates | 0 | 3 (tension awareness, author conflict, author diversity) |
| Edge Coherence Timing | Post-hoc only | Pre-generation (binding) + post-hoc |
| Quality Gate Enforcement | Non-fatal (all) | Configurable fatal/non-fatal per gate |

---

## 8. Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Injecting hooks into prompts | Prompt length increase (~2K tokens for 40 hooks) | Filter to relevant hooks per facet; cap at 10 |
| Pre-generation edge coherence | May block valid cross-tradition synthesis | Use as warning, not hard block; configurable threshold |
| Author-scoped bucketing in Phase 7 | Reduces cross-author edge discovery | Run both: within-author + cross-author passes |
| Canonical author table | Maintenance burden | Auto-generate from manifest, human-review only |
| Tension-aware quality gate | False positives on intentional juxtaposition | Scholar-in-the-loop: flag, don't block |

---

## 9. Implementation Sequence

```
Sprint 1 (Low-hanging fruit):
  H-05: Canonical author table
  H-08: Authority tiers in manifest
  H-09: Author-level KU index
  H-12: author_conflict_detected event

Sprint 2 (Index integration):
  H-01: Cross-pipeline hooks in generation prompts
  H-02: Tension-aware quality gate
  H-15: Canonical term boosting in retrieval

Sprint 3 (Pipeline hardening):
  H-03: Preventive edge coherence
  H-06: Author-title pairing validation
  H-07: Surface unanchored edges
  H-10: minDistinctAuthors facet parameter

Sprint 4 (Advanced reasoning):
  H-04: Author-scoped Phase 7 reasoning
  H-11: Re-enable topic bucketing
  H-14: Per-chunk OCR quality tracking
```
