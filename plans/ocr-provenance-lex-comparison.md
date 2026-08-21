# OCR-Provenance-lex vs God Agent Ingestion Pipeline: Comparative Analysis

**Date**: 2026-03-24
**Repo**: https://github.com/DarkCodePE/OCR-Provenance-lex (fork of ChrisRoyse/OCR-Provenance)

---

## Executive Summary

**Recommendation: Do NOT replace our ingestion system. Selectively adopt 2-3 ideas.**

OCR-Provenance-lex is a well-engineered MCP server for document intelligence with impressive provenance tracking. However, it has two critical dependencies on cloud APIs (Datalab for OCR, Gemini for NER/QA) that make it unsuitable as a replacement for our fully local pipeline. Its strengths are in provenance tracking and knowledge graph construction — areas where we could borrow design patterns without adopting the system wholesale.

---

## Architecture Comparison

| Dimension | Our System | OCR-Provenance-lex |
|-----------|-----------|-------------------|
| **Runtime** | Python scripts + TypeScript orchestration | TypeScript MCP server + Python workers |
| **OCR** | `pdftotext -layout` (local, free) + Tesseract fallback | Datalab cloud API (paid, per-page) |
| **Embeddings** | gte-Qwen2-1.5B (1536-dim, local GPU) | nomic-embed-text-v1.5 (768-dim, local GPU) |
| **Vector DB** | ChromaDB (persistent, 1536-dim) | SQLite + sqlite-vec 0.1.7-alpha (768-dim) |
| **Search** | Semantic (cosine) via ChromaDB | Hybrid BM25 + semantic via RRF fusion |
| **Entity extraction** | None (not in scope) | Gemini API (cloud, paid) |
| **Knowledge graph** | KU + reasoning edges (local, deterministic) | Entity co-occurrence graph (Gemini-dependent) |
| **Chunking** | Paragraph-aware, page-boundary respecting, 800-1200 tokens | Fixed 2000-char with overlap, page-aware mode |
| **Provenance** | SHA-256 doc_id + manifest JSONL (append-only) | Full SHA-256 chain at every stage, W3C PROV export |
| **Table extraction** | Camelot + quality filter (local) | None (relies on OCR markdown output) |
| **Image extraction** | PyMuPDF + page-coverage filter (local) | PyMuPDF + Gemini VLM for descriptions |
| **Cost** | $0 (fully local) | Datalab + Gemini API costs per document |
| **Offline capable** | Yes, fully | No — OCR and NER require internet |

---

## What OCR-Provenance-lex Does Better

### 1. Provenance Tracking (Significant Gap)
Their provenance model is genuinely superior to ours. Every transformation creates a cryptographic record with:
- Content hash, input hash, file hash at every stage
- Parent chain with depth tracking
- Processing parameters snapshot for reproducibility
- W3C PROV-JSON export for interoperability
- Hash verification that can detect tampering

**Our system**: Manifest JSONL with SHA-256 per file + doc_id. No per-chunk provenance, no processing parameter snapshots, no chain verification.

**Verdict**: This is their standout feature. Worth studying for design patterns.

### 2. Hybrid Search (BM25 + Semantic via RRF)
They combine FTS5 keyword search with vector similarity using Reciprocal Rank Fusion. This handles both exact-term and conceptual queries well.

**Our system**: Semantic-only via ChromaDB. The SmartRetrievalLayer in claudeflow-testing has hybrid search, but claudeflow-new doesn't have it yet.

**Verdict**: We already have this capability in the mature repo. Port SmartRetrievalLayer to claudeflow-new (already in the porting plan).

### 3. Entity Extraction + Knowledge Graph
They extract named entities via Gemini and build co-occurrence graphs with entity resolution (exact → fuzzy → AI matching).

**Our system**: Our KU/reasoning edge system is conceptually different — it promotes retrieval hits to citation-locked claims and derives cross-document reasoning edges. Not entity-focused.

**Verdict**: Different paradigms for different purposes. Their entity approach is good for legal/medical docs. Our KU approach is better for scholarly argumentation. Not a gap — a design choice.

---

## What Our System Does Better

### 1. Fully Local, Zero Cloud Dependencies
Our entire pipeline runs offline with no API costs. This is critical for:
- Academic corpus processing (thousands of pages, no per-page cost)
- Privacy-sensitive documents
- Reproducibility (no API version drift)
- Reliability (no rate limits, no downtime)

**Their system**: Cannot process a single document without Datalab API access. Cannot extract entities without Gemini. Two cloud SPOFs.

### 2. Intelligent Chunking
Our paragraph-aware, page-boundary-respecting chunking with 800-1200 token targets produces semantically coherent chunks. We also have `trimChunkContent()` for prompt optimization and `reorderChunksForAttention()` for LLM attention patterns.

**Their system**: Fixed 2000-character boundaries with overlap. Can split mid-sentence. They acknowledge this with `detectEntityBoundaryIssues()` but don't fix it.

### 3. Table and Image Extraction
We have dedicated extractors (camelot for tables, PyMuPDF for images) with quality filters that reject false positives (prose-as-table, full-page backgrounds).

**Their system**: No dedicated table extraction. Relies on whatever structure the OCR engine returns in its markdown output. Image extraction exists but descriptions require Gemini VLM.

### 4. OCR for Scanned Documents
Our OCR extractor detects content type (text-based/scanned/hybrid) and routes accordingly — pdftotext for clean text, Tesseract for scanned pages. Layout analysis handles multi-column pages.

**Their system**: All documents sent to Datalab regardless of type. More expensive but potentially higher quality for truly degraded scans (Datalab uses advanced ML models).

### 5. Learning Pipeline (KU + Reasoning Edges)
Our Phase 4-7 pipeline (retrieval → promotion → reasoning) produces citation-locked knowledge units and cross-document reasoning edges. This is a unique capability not present in OCR-Provenance-lex at all.

### 6. Determinism and Idempotency
Our pipeline is fully deterministic — same input always produces same output. Stable IDs via SHA-256 of content. Idempotent reruns (skip unchanged files). Their system has non-deterministic elements (Gemini responses, Datalab processing).

---

## What We Should Adopt (Design Patterns, Not Code)

### Priority 1: Enhanced Provenance Tracking
Adopt their per-stage hash chain concept into our manifest system:
- Add `content_hash` per chunk (we already compute `clean_sha256` and `raw_sha256`)
- Add `processing_params` snapshot to manifest records (reproducibility)
- Add chain verification tooling (recompute hashes, detect drift)
- Consider W3C PROV-JSON export for interoperability

**Effort**: Medium. Extend existing manifest JSONL format, add verification script.

### Priority 2: BM25 + Semantic Hybrid Search
Port SmartRetrievalLayer from claudeflow-testing (already planned). Consider adding FTS5 to our SQLite stores for keyword search alongside ChromaDB semantic search.

**Effort**: Already in progress (porting plan Phase 5+).

### Priority 3: Entity Resolution Patterns
If we ever add entity extraction to the scholarly pipeline, their 3-tier resolution strategy (exact → Dice similarity → AI disambiguation) with Union-Find merging is a solid pattern.

**Effort**: Future consideration, not immediate need.

---

## What We Should NOT Adopt

1. **Datalab OCR dependency** — Adds cost and removes offline capability. Our pdftotext + Tesseract + layout analyzer handles our scholarly corpus well.

2. **Gemini API dependency** — Our Anthropic Claude routing handles academic writing. Adding a second LLM provider creates complexity without clear benefit.

3. **sqlite-vec** — Alpha software. Our ChromaDB is production-grade and well-integrated. No reason to switch.

4. **Fixed-character chunking** — Our paragraph-aware chunking is strictly superior for scholarly texts.

5. **MCP server architecture for ingestion** — Our subprocess orchestration (god_learn.py) is simpler and works. No need to wrap ingestion in an MCP server.

---

## Cost Analysis

For our 32-PDF corpus (~4,500 pages):

| System | OCR Cost | Embedding Cost | NER Cost | Total |
|--------|----------|---------------|----------|-------|
| **Ours** | $0 (local) | $0 (local GPU) | N/A | **$0** |
| **OCR-Provenance** | ~$45-90 (Datalab, $0.01-0.02/page) | $0 (local GPU) | ~$5-15 (Gemini) | **$50-105** |

For a larger corpus (500 PDFs, ~50K pages):
- Ours: $0
- Theirs: $500-1,000+

---

## Conclusion

OCR-Provenance-lex is impressive engineering with a genuinely novel provenance model. But for our use case (scholarly corpus processing, fully local, no API costs, deterministic pipeline), it solves a different problem. Their target is legal/medical document processing where cloud API quality justifies the cost and provenance audit trails have regulatory value.

**Bottom line**: Keep our pipeline. Borrow their provenance chain design patterns for our next manifest format revision. Don't adopt their cloud dependencies.
