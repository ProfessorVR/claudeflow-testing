# God-Write System — Comprehensive Technical Report

**Date:** 2026-03-23
**Branch:** `writing-pipeline-v2`
**Codebase:** `claudeflow-testing/src/god-agent/`
**Pipeline version:** v2 (with stages decomposition)

---

## 1. System Overview

God-write is an academic writing pipeline that generates PhD-level scholarly prose grounded in a curated corpus. It combines semantic retrieval from a ChromaDB vector database, LLM generation via Anthropic's Claude API, and a multi-stage post-processing chain that enforces citation fidelity, source constraints, and stylistic consistency.

The system runs entirely on a single WSL2 machine (RTX 4090) with four local services:

| Service | Port | Model | VRAM |
|---------|------|-------|------|
| vLLM | 8002 | Qwen2.5-Coder-32B-Instruct-AWQ | ~18 GB |
| Embedding | 8000 | GTE-Qwen2-1.5B-instruct | ~4.7 GB |
| ChromaDB | 8001 | — (vector store) | — |
| Dashboard | 3847 | — (Express + vanilla JS) | — |

All academic writing routes through Claude (Anthropic API). vLLM handles only coding tasks and OCR repair.

---

## 2. Entry Points

### 2.1 CLI (`src/god-agent/universal/cli.ts`)

```bash
# Basic
npx tsx cli.ts write "Topic\n1. Section One\n2. Section Two" --execute

# Full gold standard
npx tsx cli.ts write "Topic\n1. Section\n2. Section" \
  --execute --whitelist --rolling-context --multi-step \
  --enable-endnotes --word-target "3,000-3,500" \
  --use-corpus --corpus-collections rhetorical_ontology
```

**Key flags:**
| Flag | Purpose |
|------|---------|
| `--execute` | Actually generate content (vs. just planning) |
| `--whitelist` | Use corpus constraint — only cited sources from retrieved chunks |
| `--multi-step` | v1 → investigate → v2 pipeline (prevention plan) |
| `--rolling-context` | Per-section sequential generation (requires `--whitelist`) |
| `--enable-endnotes` | Generate bibliography/endnotes appendix |
| `--word-target` | Target word count (default: "3,000-3,500") |
| `--use-corpus` | Enable corpus retrieval |
| `--corpus-collections` | Specific ChromaDB collection(s) to search |
| `--nli-verify` | NLI verification (stub — not yet implemented) |
| `--candidate-selection` | Candidate selection (stub — not yet implemented) |
| `--json` | Output structured JSON with diagnostics |

### 2.2 `/god-write` Slash Command

Routes through the same CLI. The `/god-write` skill invokes `cli.ts write` with appropriate flags.

### 2.3 Dashboard (port 3847)

Express server (`observability/express-server.ts`) with `icp-api-routes.ts` providing REST endpoints. The dashboard UI (`observability/dashboard/`) calls `SectionOrchestrator` directly for god-write parity.

---

## 3. Pipeline Architecture

### 3.1 High-Level Flow

```
User Input → CLI Flag Parsing → .env Loading → UniversalAgent → WritePipelineOrchestrator.write()

write() orchestrates:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ RETRIEVAL STAGE                                                         │
  │  1. Extract retrieval queries from topic (section headings, concepts)   │
  │  2. Multi-query semantic search (SmartRetrievalLayer → ChromaDB)        │
  │  3. Author-targeted supplementation (if primary sources under-covered)  │
  │  4. Source diversity enforcement (per-source cap)                        │
  │  5. Chunk trimming (~450 chars, preserves quotes + page refs)           │
  │  6. Attention reordering (highest relevance at prompt edges)            │
  │  7. Build CorpusConstraint (whitelist of allowed sources)               │
  └────────────────────────────────┬────────────────────────────────────────┘
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ DRAFTING STAGE                                                          │
  │                                                                         │
  │  IF --multi-step:                                                       │
  │    8.  Generate v1 draft (Claude, NO style injection)                   │
  │    9.  investigateV1() — local string analysis (zero LLM cost):         │
  │        - Detect hallucinated citations (non-corpus authors)             │
  │        - Detect phantom quotations (quotes not in chunks)               │
  │        - Detect uncited claims (3+ sentences without citation)          │
  │        - Detect source imbalance (>40% from one source)                 │
  │        - Detect short sections (<350 words)                             │
  │    10. Build prevention plan from investigation findings                │
  │    11. Supplemental retrieval for under-covered sources                 │
  │                                                                         │
  │  IF --rolling-context:                                                  │
  │    12. Generate each section sequentially (~700 words/call):            │
  │        - Global outline + section-specific chunks + shared pool         │
  │        - Last 2 sections as sliding window context                      │
  │        - Citation tracker (who's been cited, who hasn't)                │
  │        - Trailing hook ("transition into next section")                 │
  │        - Source diversity: evict authors with 3+ citations from pool    │
  │    13. Conclusion gets hybrid context:                                  │
  │        - Full text of last 2 sections                                   │
  │        - 50-word Haiku summaries of all earlier sections                │
  │                                                                         │
  │  IF single-shot (neither flag):                                         │
  │    14. Build gold standard prompt (buildGoldStandardPrompt())           │
  │    15. Single Claude API call with full prompt                          │
  │                                                                         │
  │  Prompt assembly includes:                                              │
  │    - Style profile injection (from trained profile)                     │
  │    - Per-section word targets                                           │
  │    - Per-section source assignments (term-overlap scoring)              │
  │    - Corpus constraint block (allowed sources whitelist)                │
  │    - Knowledge units from god-learn/knowledge.jsonl                     │
  │    - Structural edges from god-reason/reasoning.jsonl                   │
  │    - Prevention plan constraints (if multi-step)                        │
  │    - Grounding rules ("ONLY cite from corpus chunks below")             │
  └────────────────────────────────┬────────────────────────────────────────┘
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ VALIDATION STAGE                                                        │
  │  16. Prose Sanitization (pass 1)                                        │
  │      - Strip LLM meta-text leaks ("Now I'll generate...", etc.)         │
  │      - Strip artifact patterns (Q1:, FLAG:, CLAIM N:, confidence %)     │
  │      - Remove duplicate sections                                        │
  │      - Remove meta-analysis section headings                            │
  │      - Strip "[GENERATION FAILED]", "[REQUIRES MANUAL REVIEW]"          │
  │                                                                         │
  │  17. Quality Gauntlet (scoring only, revisions DISABLED)                │
  │      → Returns stage scores but maxRevisions: 0                         │
  │      → 9 stages run but produce default 0.5 scores                     │
  │                                                                         │
  │  18. Citation Enforcement                                               │
  │      - Validate all citations against corpus manifest                   │
  │      - Auto-correct citations where possible                            │
  │      - Remove hallucinated citations (replace with empty string)        │
  │      - Quotation fidelity check (70% Jaccard threshold)                 │
  │                                                                         │
  │  19. Prose Sanitization (pass 2)                                        │
  │      - Catch post-enforcement artifacts                                 │
  │                                                                         │
  │  20. Non-Corpus Author Scrubbing                                        │
  │      - Scan for signal phrases referencing non-corpus authors            │
  │      - Remove containing sentences                                      │
  │      - Strip bare APA parentheticals                                    │
  │      - Diacritics-aware matching (Uexküll → Uexkull)                   │
  │      - Nobiliary particle handling (von, de, van)                       │
  │                                                                         │
  │  21. Endnotes (if --enable-endnotes)                                    │
  │      - Generate bibliography from cited sources                         │
  │      - Source verification layer                                        │
  │                                                                         │
  │  22. Final WriteResult assembly with diagnostics                        │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Deep Dives

### 4.1 SmartRetrievalLayer (`retrieval/smart-retrieval-layer.ts`)

The retrieval engine for all corpus-grounded generation.

**Capabilities:**
- Semantic search via GTE-Qwen2 embeddings + ChromaDB
- Hybrid search: semantic + keyword matching with configurable weights
- LRU query cache (1000 entries, 30-minute TTL)
- Parallel retrieval (5 concurrent queries)
- Knowledge graph integration (KUs from `god-learn/knowledge.jsonl`, edges from `god-reason/reasoning.jsonl`)
- Collection resolution by name (no hardcoded UUIDs)
- L2→cosine similarity conversion for normalized embeddings

**What it does NOT have (vs. Aristotle Prime):**
- No ColBERT late-interaction search
- No cross-encoder reranking (stub exists, returns input unchanged)
- No Reciprocal Rank Fusion
- No split retrieval (primary/secondary work ratio)
- No anti-search (contradiction retrieval)

**Key methods:**
| Method | Purpose |
|--------|---------|
| `retrieveContext()` | Main entry — semantic search with options |
| `hybridSearch()` | Combine semantic + keyword results |
| `getRelatedChunks()` | Expand context with surrounding chunks |
| `findCrossReferences()` | Cross-document concept analysis |
| `loadKnowledgeGraph()` | Load KU + edge data for prompt enrichment |

### 4.2 WritePipelineOrchestrator (`universal/write-pipeline-orchestrator.ts`)

The central orchestrator — a ~3,000-line class that coordinates the entire pipeline.

**Key methods:**
| Method | Purpose |
|--------|---------|
| `write()` | Main entry (~1,500 lines) — the full pipeline |
| `extractRetrievalQueries()` | Parse topic into section-level search queries |
| `extractPrimaryAuthors()` | Extract all named authors from prompt |
| `extractKeyAuthors()` | Extract authors with 2+ mentions |
| `buildSectionConstraints()` | Per-section citation/quotation constraints |
| `investigateV1()` | Zero-cost local analysis of v1 draft |
| `trimChunkContent()` | Intelligent chunk trimming (~92% reduction) |
| `reorderChunksForAttention()` | Highest relevance at prompt edges |
| `validateRetrievalCoverage()` | Pre-generation author coverage check |

**Dependencies injected via `WritePipelineDeps`:**
- `smartRetrieval` — retrieval layer
- `qualityIntegration` — gauntlet wrapper
- `proseSanitizer` — artifact cleanup
- `styleProfileManager` — trained style profiles
- `trajectoryBridge` — learning system feedback
- `writingGenerator` — Anthropic API wrapper
- `interactionStore` — interaction history

### 4.3 Gold Standard Prompt Builder (`universal/gold-standard-prompt-builder.ts`)

Standalone module for constructing the generation prompt. Used by both CLI and dashboard.

**What it injects:**
- MLA citation format rules (not APA)
- Style profile (sentence length, passive voice, transitions, tone)
- Grounding rules (corpus-only citations)
- Source diversity requirements
- Per-section word targets (~467 words/section for 7 sections)
- Per-section source assignments (term-overlap scoring)
- Knowledge units (from god-learn)
- Structural reasoning edges (from god-reason)
- Prevention plan constraints (blacklisted authors, under/over-cited sources)

### 4.4 Rolling Context Generation

Instead of one monolithic API call, generates each section sequentially.

**Per-section prompt includes:**
- Global outline (all section headings)
- Section-specific corpus chunks (assigned by term overlap)
- Shared pool of top-relevance chunks (filtered by citation count)
- Last 2 generated sections (sliding window)
- Citation tracker (cumulative author citation counts)
- Trailing hook instruction for inter-section transitions

**Conclusion handling:**
- Full text of last 2 sections
- 50-word Haiku summaries of earlier sections (forces synthesis)

**Source diversity enforcement:**
- Authors with 3+ citations have their chunks evicted from the shared pool

**Metrics (rolling vs single-shot):**
| Metric | Single-Shot | Rolling Context |
|--------|:-----------:|:---------------:|
| Prompt size/call | ~30K chars | ~14K chars |
| Section balance | Wildly uneven | ~700 words each |
| API calls | 1 | 8 + 8 Haiku summaries |
| Coherence | "8 blog posts glued together" | Continuous with transitions |

### 4.5 Multi-Step Drafting (v1 → investigate → v2)

**Step 1 — v1 Generation:**
- Claude generates a draft WITHOUT style injection
- Purpose: get a raw content draft to analyze

**Step 2 — investigateV1() (zero-cost, local string analysis):**
- Hallucinated citation detection: finds author names not in corpus
- Phantom quotation detection: finds quoted text not matching any chunk
- Uncited claim detection: 3+ consecutive sentences without citation
- Source imbalance detection: >40% citations from one source
- Short section detection: <350 words per section

**Step 3 — Prevention plan:**
- Blacklisted authors (detected hallucinations)
- Strengthened constraints for problem areas
- Under-cited sources to prioritize
- Over-cited sources to balance

**Step 4 — v2 Generation:**
- Full style profile injected
- Prevention plan constraints added to prompt
- Supplemental retrieval for under-covered sources

### 4.6 Quality Gauntlet (`cli/quality/quality-gauntlet.ts`)

Orchestrates 9 quality stages in sequence. **Currently scoring-only (revisions disabled via `maxRevisions: 0`).**

| Stage | File | What It Checks |
|-------|------|----------------|
| 1. Citation Verifier | `citation-verifier.ts` | Citations exist, formats correct |
| 2. Quotation Fidelity | `quotation-fidelity-stage.ts` | Quoted text matches source (70% Jaccard) |
| 3. Toulmin Enforcer | `toulmin-enforcer.ts` | Claim-evidence-warrant structure |
| 4. Argument Coherence | `argument-coherence-checker.ts` | Logical flow between claims |
| 5. Citation Completeness | `citation-completeness-verifier.ts` | All claims have citations |
| 6. Citation Density | `citation-density-checker.ts` | Min citations per paragraph |
| 7. Style Consistency | `style-consistency-validator.ts` | Matches trained style profile |
| 8. Factual Accuracy | `factual-accuracy-auditor.ts` | Claims grounded in sources |
| 9. Claim Verification | `claim-verification-stage.ts` | Individual claim validation |

**Why revisions are disabled:** The revision loop introduced hallucinated citations. Stages return 0.5 default scores. Re-enabling requires stages to produce meaningful evaluations (see Aristotle Prime DeBERTa NLI as replacement path).

### 4.7 Citation Enforcement (`core/writing/citation-enforcer.ts`)

Active enforcement (not just checking):
- Validates all citations against corpus manifest
- **Auto-correct**: fixes citation format, page numbers
- **Rejection**: removes hallucinated citations (replaces with empty string, not `[CITATION NEEDED]`)
- **Quotation fidelity**: 70% Jaccard similarity threshold (lowered from 95% for OCR corpus)
- Borderline quotations count as passing

### 4.8 Prose Sanitizer (`cli/composition/prose-sanitizer.ts`)

Runs twice — before and after citation enforcement.

**Patterns stripped:**
- Research markers: `Q1:`, `FLAG:`, `HYPOTHESIS TO TEST:`, `CLAIM N:`
- Confidence scores: `Confidence: 85%`
- Meta commentary: `[SYNTHESIS NEEDED]`, `[TODO:...]`, `[EVIDENCE REQUIRED]`
- Generation failures: `[GENERATION FAILED]`, `[REQUIRES MANUAL REVIEW]`
- LLM meta-text: "Now I'll generate...", "Based on the evidence from the corpus..."
- Duplicate sections
- Meta-analysis section headings (keyword-based detection)
- `## Generated Paragraph` headings (content preserved)

### 4.9 Author Scrubber (`universal/author-scrubber.ts`)

Post-enforcement cleanup:
- Scans for signal phrases: "As X argues", "Drawing on X", "X's account", "According to X"
- Checks if author is in corpus whitelist
- Removes sentences containing non-corpus author references
- Strips bare APA parentheticals `(Author Year)`
- Diacritics-aware: Uexküll → Uexkull
- Nobiliary particles: von, de, van handled correctly
- Possessive stripping: "Heidegger's" → "Heidegger"

### 4.10 Domain Config (`universal/domain-config.ts`)

Externalized domain knowledge:
- Primary authors: Aristotle, Heidegger, Plato
- Secondary authors: Frede, Caston, Papachristou, Nussbaum, etc.
- Key concepts: kinesis, chronos, phantasia, aisthesis, stimmung, etc.
- Primary titles: De Anima, Being and Time, Rhetoric, Physics
- Title aliases: Maps colloquial names to exact ChromaDB `title_raw` values

### 4.11 Style Profile System

**Trained profile**: `dalton-academic-mkn82c3v` (learned from 3 documents)

**Key characteristics:**
| Metric | Value |
|--------|-------|
| Avg sentence length | 31.24 words |
| Long sentence ratio | 51.6% |
| Passive voice | 20.1% |
| Formality score | 0.64 |
| Transitions | thus, specifically, indeed, subsequently, hence |
| Citation style | Author-prominent (99.2%): "observes", "argues", "suggests" |
| Format | MLA-influenced with embedded quotations |

Stored in `.agentdb/universal/style-profiles.json` with backup at `corpus/style/style-analysis.json`.

### 4.12 Knowledge Graph Integration

**Knowledge Units** (`god-learn/knowledge.jsonl`): 10 KUs with full provenance (chunk IDs, doc IDs, pages, authors, confidence scores, domains).

**Reasoning Edges** (`god-reason/reasoning.jsonl`): 832 edges (792 original + 40 bridge edges) with relation types, domains, confidence scores, and knowledge unit links.

These are injected into the gold standard prompt as structural context.

### 4.13 Inline Validation Orchestrator (`core/writing/inline-validation-orchestrator.ts`)

Paragraph-by-paragraph generation with validation gates:
- Each paragraph validated BEFORE being added to output
- Citation lookup tool for real-time corpus checking
- Inline claim validation
- Quotation fidelity validation
- CCV Tier 1 gate
- Configurable retry per unit
- Auto-enables when corpus has ≥3 chunks

### 4.14 Model Router (`core/composition/model-router.ts`)

Centralized LLM routing:
- Native `fetch` replaces `@anthropic-ai/sdk` (SDK v0.71.2 fails in WSL2 daemon)
- Backend detection: Anthropic (keys ≥50 chars) vs vLLM
- 120s timeout with `AbortSignal.timeout()`
- Backend availability caching
- Cost tier routing: `high` → Anthropic, `low` → vLLM
- TTL-based backend cache refresh

### 4.15 Pipeline Abort Controller (`core/abort/`)

- File sentinel + AbortController for pipeline cancellation
- Integrated into ModelRouter, WritePipelineOrchestrator, CodingPipelineOrchestrator
- Used by Stream Deck abort button

### 4.16 Endnote Generator (`cli/quality/endnote-generator.ts`)

- Generates bibliography from cited sources
- Source verification layer validates availability
- Missing source acquisition layer (stub for future open-access search)

### 4.17 Observability Dashboard (port 3847)

- Real-time pipeline monitoring
- ICP (Integrated Citation Pipeline) panel
- Run history and diagnostics
- Direct generation trigger (same path as CLI)
- `.env` loaded at module init (overrides truncated shell keys)

---

## 5. Configuration Constants (`gold-standard-config.ts`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `chunkTrimTarget` | 450 chars | Target trimmed chunk size |
| `targetChunks` | 28 | Default retrieval count (whitelist mode) |
| `maxChunksPerSource` | 8 | Source diversity cap |
| `targetTotalChunks` | 35 | Total after diversity enforcement |
| `relevanceFloor` | 0.25 | Minimum chunk relevance |
| `primaryRatioThreshold` | 0.3 | Trigger supplementation below this |
| `minSectionWords` | 350 | Flag sections shorter than this |
| `maxCorpusBlockChars` | 60,000 | ~15K tokens corpus block limit |
| `opusMaxTokens` | 16,384 | Max output tokens |
| `rollingContextWindowSize` | 2 | Prior sections in sliding window |
| `rollingContextSectionWords` | 700 | Target words per rolling section |
| `rollingContextSharedPoolSize` | 5 | Top chunks available to all sections |
| `rollingContextMaxChunksPerSection` | 10 | Chunk budget per section |
| `rollingContextSharedPoolMaxCitations` | 3 | Evict author from pool after N citations |

---

## 6. Fix History Summary (Fixes 9–60)

The pipeline accumulated 60+ incremental fixes across multiple sessions:

| Range | Focus Area |
|-------|-----------|
| 9–13 | Core pipeline: .env loading, DAI-001 skip, output mapping, corpus instructions, inline validation flag |
| 14–20 | Prose sanitization: generation failures, duplicates, meta-text leaks, citation placeholders |
| 21–24 | Citation robustness: null safety, nullish coalescing, corpus constraints, hallucination recovery |
| 25–26 | Author scrubbing, dashboard .env fix |
| 27–32 | ModelRouter: native fetch, config safety, hybrid search, timeout tuning, vLLM fail-fast, maxTokens |
| 33–44 | Gold standard: query extraction, semantic queries, source targeting, diversity enforcement, style enrichment |
| 45–50 | Inline validation: minRelevance, full manifest authors, meta-analysis stripping, false positives, gauntlet disable |
| 51–52 | Multi-step drafting: chunk trimming (92% reduction), attention reordering |
| 53–60 | Dissertation-strict: supplementation guard, investigateV1, retrieval coverage, grounding constraints, multi-step flag, section constraints |

---

## 7. Known Limitations

1. **Quality Gauntlet disabled** — 9 stages run but return default 0.5 scores. No real verification.
2. **No NLI verification** — Claims are not checked for entailment against source passages.
3. **No reranking** — Retrieval uses raw cosine similarity; no cross-encoder.
4. **No contradiction detection** — No anti-search for counter-claims.
5. **3,000-line orchestrator** — `write()` is ~1,500 lines of sequential logic.
6. **Hardcoded domain knowledge** — Author/concept patterns in 5+ regex patterns (partially externalized to DomainConfig).
7. **Duplicate LLM implementations** — Anthropic API called independently in orchestrator, ModelRouter, and inline validation.
8. **Silent degradation** — try/catch-and-continue pattern means upstream failures (embedding down, ChromaDB unreachable) produce empty results without visible errors.
9. **Single-node only** — No remote service support; all services must run locally.

---

## 8. File Inventory

### Core Pipeline (~44,671 lines across 55 files)

| Directory | File Count | Purpose |
|-----------|-----------|---------|
| `universal/` | 24 | Orchestrator, CLI, quality integration, style, domain config, gold standard |
| `core/composition/` | 20 | ModelRouter, ICP orchestrator, constrained generator, prompt builder |
| `core/writing/` | 28 | Citation validator/enforcer, inline validation, corpus constraints, claims |
| `retrieval/` | 6 | SmartRetrievalLayer, hybrid retriever, faceted retrieval, types |
| `cli/quality/` | 19 | Quality gauntlet, 9 stages, endnote generator, source verification |
| `cli/composition/` | 4 | Prose sanitizer, composition orchestrator |
| `core/abort/` | 2 | Pipeline abort controller |
| `core/config/` | 2 | Centralized config management |
| `observability/` | 5 | Dashboard, Express server, ICP API routes |

---

## 9. Execution Modes Summary

| Mode | Flags | API Calls | Best For |
|------|-------|-----------|----------|
| **Basic** | `--execute` | 1 | Quick drafts |
| **Whitelist** | `--execute --whitelist` | 1 | Corpus-grounded single-shot |
| **Multi-step** | `--execute --whitelist --multi-step` | 2 (v1 + v2) | Hallucination prevention |
| **Rolling** | `--execute --whitelist --rolling-context` | 8+ | Section balance, coherence |
| **Full Gold Standard** | `--execute --whitelist --rolling-context --multi-step --enable-endnotes` | 10+ | Maximum quality |
