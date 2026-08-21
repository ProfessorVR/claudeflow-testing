# Feature Difference: claudeflow-testing vs claudeflow-OG

**Date**: 2026-03-06
**Purpose**: Catalog feature differences to guide reimplementation of best aspects from `claudeflow-testing` into `claudeflow-OG`.
**Scope**: Excludes ICP (Interactive Composition Pipeline) per request.

---

## Executive Summary

Both codebases share the same foundational architecture (~51K LOC each). The key differences are:

1. **claudeflow-OG** has a richer composition/synthesis layer (micro/meso/macro passes, adversarial testing, SIR, chapter spec mapping) that `claudeflow-testing` lacks or simplified away
2. **claudeflow-testing** has 50+ battle-tested fixes (Fix 9-50) that harden the god-write pipeline against real-world failures (API key truncation, OCR artifacts, hallucination prevention, timeout tuning)
3. Both codebases contain the same fixes in many files — the fixes were applied to both, but `claudeflow-testing`'s ICP modifications introduced regressions in the god-write path

---

## FEATURES ONLY IN claudeflow-OG

### 1. Composition Synthesis Layer
**Location**: `src/god-agent/cli/composition/synthesis/`

| Component | File | Description |
|-----------|------|-------------|
| Composition Orchestrator | `composition-orchestrator.ts` | High-level staged composition (request mapping -> staged execution -> citation enforcement -> gauntlet -> endnotes) |
| Micro Pass | `passes/micro-pass.ts` | Sentence-level refinement |
| Meso Pass | `passes/meso-pass.ts` | Paragraph-level coherence |
| Macro Pass | `passes/macro-pass.ts` | Section-level structure |
| Chapter Spec Mapper | `chapter-spec-mapper.ts` | Maps chapter outlines to integration specs, preserves chapter structure through pipeline |

**Impact**: The 3-pass system (micro/meso/macro) provides graduated quality improvement that `claudeflow-testing` doesn't have. This is a **high-value reimplementation target**.

### 2. Semantic Intermediate Representation (SIR)
**Location**: `src/god-agent/cli/composition/synthesis/sir/`

| Component | Description |
|-----------|-------------|
| Claim Map | ToulminClaims with citation anchors |
| Dependency Graph | Claim relationship tracking |
| Concept Ledger | Key concepts and definitions |

**Impact**: SIR provides a structured intermediate layer between retrieval and generation. Enables better argument coherence. **Medium-value target** — useful but complex.

### 3. Segment Interfaces
**Location**: `src/god-agent/cli/composition/synthesis/interfaces/`

| Component | Description |
|-----------|-------------|
| Segment Interface | Defines segment boundaries |
| Transition Generator | Creates smooth inter-section transitions |
| Interface Reconciler | Reconciles overlapping interfaces |
| Interface Validator | Validates segment structure |

**Impact**: Handles multi-section documents better. **Medium-value target** for dissertation-length work.

### 4. Adversarial Testing Suite
**Location**: `src/god-agent/cli/composition/adversarial/`

| Component | Description |
|-----------|-------------|
| Citation Checker | Verifies all citations exist |
| Consistency Auditor | Checks for contradictions |
| Scope Police | Ensures claims match stated scope |
| Counter-Argument Tester | Tests against opposing arguments |

**Impact**: Catches logical and citation errors that the quality gauntlet misses. **High-value reimplementation target**.

### 5. Specialized Generators
**Location**: `src/god-agent/cli/composition/generators/`

| Component | Description |
|-----------|-------------|
| Claim Map Generator | Generates ToulminClaims from prompts |
| Concept Ledger Builder | Builds domain concept definitions |
| Dependency Graph Builder | Creates claim dependency structure |

### 6. Additional Style Enforcement Modules
**Location**: `src/god-agent/cli/style/`

| Module | In OG? | In Testing? | Description |
|--------|--------|-------------|-------------|
| `rhetorical-move-extractor.ts` | Yes | **No** | Identifies argument patterns (claim -> evidence -> conclusion) |
| `transition-pattern-mapper.ts` | Yes | **No** | Validates discourse marker usage ("thus", "accordingly") |
| `citation-integration-analyzer.ts` | Yes | **No** | Checks citation placement quality in prose |
| `deep-style-analyzer.ts` | Yes | **No** | Comprehensive style profiling |
| `phenomenological-marker-extractor.ts` | Yes | **No** | Domain-specific philosophical terminology detection |
| `argument-pattern-extractor.ts` | Yes | **No** | Toulmin model enforcement |
| `enhanced-style-drift-detector.ts` | Yes | Yes | Same in both |
| `register-enforcer.ts` | Yes | Yes | Same in both |

**Impact**: OG has 6 additional style analysis modules. The `rhetorical-move-extractor`, `citation-integration-analyzer`, and `argument-pattern-extractor` are **high-value targets** for academic writing quality.

### 7. Additional Retrieval Components

| Module | In OG? | In Testing? | Description |
|--------|--------|-------------|-------------|
| `hybrid-retriever.ts` (base) | Yes | **No** | Base hybrid retriever with BM25 + semantic fusion |
| `bm25-index.ts` | Yes | **No** | Keyword indexing with TF-IDF scoring |
| `semantic-chunker.ts` | Yes | **No** | Semantically coherent chunk splitting |
| `citation-expander.ts` | Yes | **No** | Author name expansion, citation abbreviation resolution |
| `reranking-cache.ts` | Yes | **No** | Dedicated LRU cache for reranking results |

**Impact**: OG has a more complete retrieval stack. The BM25 index and semantic chunker are **medium-value targets**.

### 8. Additional Quality/Validation Components

| Module | In OG? | In Testing? | Description |
|--------|--------|-------------|-------------|
| `citation-enforcer.ts` (dedicated) | Yes | Inline | Three enforcement modes: strict/warn/off with quota-based hallucination limits |
| `missing-source-acquisition.ts` | Yes | **No** | Identifies missing sources, suggests acquisition |
| `source-verification-layer.ts` | Yes | **No** | Verifies source authority and quality |
| `open-access-searcher.ts` | Yes | **No** | Finds open-access versions of sources |
| `revision-orchestrator.ts` | Yes | **No** | Dedicated revision loop manager after quality checks |
| `rq-tracker.ts` | Yes | **No** | Research question tracking through generation |
| `continuity-checker.ts` | Yes | **No** | Cross-section document continuity |
| `dissertation-style-drift-detector.ts` | Yes | **No** | Dissertation-specific style tracking |
| `tiered-validation.ts` | Yes | **No** | Experimental multi-tier validation |
| `corpus-citation-connector.ts` | Yes | **No** | Links citations to specific corpus chunks |

**Impact**: OG has a much richer validation ecosystem. The `revision-orchestrator`, `continuity-checker`, and `corpus-citation-connector` are **high-value targets**.

### 9. Observability Enhancements (OG)

| Component | In OG? | In Testing? | Description |
|-----------|--------|-------------|-------------|
| `daemon.ts` / `daemon-server.ts` | Yes | **No** | Persistent daemon service |
| `express-server.ts` | Yes | **No** | Dedicated HTTP API server |
| `socket-server.ts` | Yes | **No** | WebSocket real-time updates |
| `sse-broadcaster.ts` | Yes | **No** | Server-sent events for streaming |
| `socket-client.ts` | Yes | **No** | Dashboard client |
| `event-store.ts` | Yes | Partial | Persistent event logging |

**Impact**: OG has a full real-time observability stack. `claudeflow-testing` has a simpler logger/metrics/bus setup. **Low-priority** unless you need real-time dashboard streaming.

---

## FEATURES ONLY IN claudeflow-testing (Fixes to Port to OG)

### Critical Fixes (Must Port)

These are the battle-tested fixes from `claudeflow-testing` that should be ported to OG:

#### API Key & Environment Fixes
| Fix | Description | Files |
|-----|-------------|-------|
| **Fix 9** | `.env` loader in CLI — full 108-char ANTHROPIC_API_KEY (shell truncates to 16) | `cli.ts` |
| **Fix 26** | `.env` loader in `icp-api-routes.ts` — dashboard daemon inherits truncated key | `icp-api-routes.ts` |

#### LLM Routing Fixes
| Fix | Description | Files |
|-----|-------------|-------|
| **Fix 27** | Native `fetch` instead of `@anthropic-ai/sdk` (SDK fails in WSL2 daemon) | `model-router.ts` |
| **Fix 28** | Strip `undefined` config values before spreading (prevents default overwrites) | `model-router.ts` |
| **Fix 30** | Timeout 30s -> 120s + AbortSignal (academic decomposition ~47s) | `model-router.ts` |
| **Fix 31** | vLLM client timeout 10s (fail fast when down) | `model-router.ts` |
| **Fix 32** | Decomposition maxTokens 2000 -> 4000 (JSON truncation) | `llm-decomposition-provider.ts` |

#### Writing Pipeline Fixes
| Fix | Description | Files |
|-----|-------------|-------|
| **Fix 10** | Skip DAI-001 agent selection for academic topics (picks wrong agents) | `universal-agent.ts` |
| **Fix 11** | Output uses `corpusContext` sources, not `InteractionStore` | `cli.ts` |
| **Fix 12** | Corpus context block handles OCR artifacts (strip page headers) | `write-pipeline-orchestrator.ts` |
| **Fix 13** | `useInlineValidation` defaults to `undefined` (enables auto-enable) | `cli.ts` |
| **Fix 23** | "ZERO TOLERANCE" corpus constraint language | `write-pipeline-orchestrator.ts` |

#### Citation & Validation Fixes
| Fix | Description | Files |
|-----|-------------|-------|
| **Fix 17** | Quote fidelity 0.95 -> 0.70 + borderline passes (OCR corpus) | `inline-validation-orchestrator.ts` |
| **Fix 19** | Citation placeholder `[CITATION NEEDED]` -> empty string | `citation-validator.ts` |
| **Fix 22** | `??` not `\|\|` for empty string placeholder | `citation-validator.ts` |
| **Fix 24** | Only recover inline units if 0 hallucinated citations | `inline-validation-orchestrator.ts` |
| **Fix 45** | `minRelevance` 0.5 -> 0.0 in corpus constraint builder | `corpus-constraint-builder.ts` |
| **Fix 48** | Expanded false-positive word lists (118 items) | `citation-validator.ts`, `inline-validation-orchestrator.ts` |
| **Fix 50** | Quality gauntlet revision DISABLED (maxRevisions: 0) | `quality-integration.ts` |

#### Prose Sanitizer Fixes
| Fix | Description | Files |
|-----|-------------|-------|
| **Fix 14** | Catches `[GENERATION FAILED]`, `[REQUIRES MANUAL REVIEW]` | `prose-sanitizer.ts` |
| **Fix 15** | Duplicate section removal | `prose-sanitizer.ts` |
| **Fix 18** | Second sanitizer pass after citation enforcement | `write-pipeline-orchestrator.ts` |
| **Fix 20** | Expanded LLM meta-text leak patterns | `prose-sanitizer.ts` |
| **Fix 47** | `removeMetaAnalysisSections()` keyword-based heading removal | `prose-sanitizer.ts` |

#### Author Scrubber Fixes
| Fix | Description | Files |
|-----|-------------|-------|
| **Fix 25** | Post-enforcement non-corpus author scrubbing | `author-scrubber.ts` |
| **Fix 46** | Full corpus manifest for allowedAuthors | `author-scrubber.ts` |
| **Fix 49** | Strip possessive `'s` before author matching | `author-scrubber.ts` |

#### Retrieval Fixes
| Fix | Description | Files |
|-----|-------------|-------|
| **Fix 29** | Hybrid search: keyword empty -> return semantic at full score | `smart-retrieval-layer.ts` |

### Context Management Enhancements (claudeflow-testing)

`claudeflow-testing` has a more developed `context-manager.ts` (430 lines) with:
- Per-operation token tracking (write, research, revision, validation)
- Health thresholds: Warning (75%), Critical (90%)
- Auto-summarization trigger on critical
- 3 pruning strategies: oldest-first, preserve-recent, least-important
- Token estimation: 4 chars ~ 1 token

OG's context manager is simpler (interaction history, corpus context, retrieval caching).

**Impact**: **High-value** — this is the feature you built specifically to avoid context limitation hits.

### Prompt Builder Engine
**File**: `src/god-agent/core/composition/prompt-builder-engine.ts`

Present in both, but `claudeflow-testing` version has:
- 3 strictness levels (strict/moderate/permissive) with full presets
- Section-level configuration (title, instructions[], citationsRequired, minQuotations)
- Validation appendix + quality gauntlet removed from prompt (pipeline handles it)

**Impact**: Minor differences. Port the strictness presets if missing from OG.

---

## FEATURES PRESENT IN BOTH (Same or Near-Identical)

| Feature | Notes |
|---------|-------|
| Write Pipeline Orchestrator | Same architecture, testing has more fixes applied |
| Universal Agent + CLI | Same structure |
| Citation Validator | Same, testing has Fix 22/19/48 |
| Inline Validation Orchestrator | Same, testing has Fix 17/24/21 |
| Corpus Constraint Builder | Same, testing has Fix 45 |
| Prose Sanitizer | Same base, testing has Fix 14/15/20/47 |
| Author Scrubber | Same base, testing has Fix 25/46/49 |
| Model Router | Same base, testing has Fix 27/28/30/31 |
| Enhanced Hybrid Retriever | Same (query expansion, RRF fusion) |
| Faceted Retrieval | Same (per-facet span extraction) |
| Cross-Encoder Reranker | Same |
| Enhanced Style Drift Detector | Same |
| Register Enforcer | Same |
| Pipeline Daemon Service | Same |
| Statistics Module | Same |
| Feedback Learning (experimental) | Same |
| Satisfaction Tracker (experimental) | Same |
| Human Verification (experimental) | Same |
| Enhanced Quality Integration (experimental) | Same |
| Provenance Ledger (experimental) | Same |
| Quality Gauntlet (7-9 stages) | Same, testing has Fix 50 (revision disabled) |
| Entailment Rules | Same |
| Endnote Generation | Same |

---

## REIMPLEMENTATION PRIORITY MATRIX

### Tier 1: Must Port (Fixes from testing -> OG)
These are proven fixes that prevent real failures:

1. **All Fix 9-50 changes** — API keys, timeouts, citation validation, prose sanitization, author scrubbing
2. **Context Manager enhancements** — token tracking, auto-summarization, pruning strategies (this is the context limitation prevention you built)

### Tier 2: High Value (OG features to preserve)
These are features OG has that testing lost or simplified:

1. **Micro/Meso/Macro Pass System** — graduated quality improvement
2. **Adversarial Testing Suite** — citation checker, consistency auditor, scope police, counter-argument tester
3. **Rhetorical Move Extractor** — argument pattern identification
4. **Citation Integration Analyzer** — citation placement quality
5. **Argument Pattern Extractor** — Toulmin enforcement
6. **Revision Orchestrator** — dedicated revision loop (separate from quality gauntlet)
7. **Continuity Checker** — cross-section document continuity
8. **Corpus Citation Connector** — links citations to specific chunks

### Tier 3: Medium Value
1. **SIR (Semantic Intermediate Representation)** — structured claim/concept layer
2. **Segment Interfaces** — transition generation, interface reconciliation
3. **BM25 Index** — keyword search backbone
4. **Semantic Chunker** — better chunk splitting
5. **RQ Tracker** — research question tracking
6. **Source Verification Layer** — source authority checking

### Tier 4: Low Priority
1. **Real-time observability stack** (WebSocket, SSE, daemon server) — nice-to-have
2. **Missing Source Acquisition** — edge case
3. **Open Access Searcher** — edge case
4. **Dissertation Style Drift Detector** — specialized
5. **Tiered Validation** — experimental

---

## RECOMMENDED REIMPLEMENTATION ORDER

```
Phase 1: Port All Fixes (testing -> OG)
  - Fix 9, 26 (API key / .env loading)
  - Fix 27, 28, 30, 31, 32 (LLM routing)
  - Fix 10, 11, 12, 13, 23 (writing pipeline)
  - Fix 17, 19, 22, 24, 45, 48, 50 (citation/validation)
  - Fix 14, 15, 18, 20, 47 (prose sanitizer)
  - Fix 25, 46, 49 (author scrubber)
  - Fix 29 (retrieval)

Phase 2: Port Context Manager
  - Token tracking per operation
  - Health thresholds (75% warning, 90% critical)
  - Auto-summarization
  - Pruning strategies

Phase 3: Verify OG's Composition Layer Still Works
  - Test micro/meso/macro passes
  - Test adversarial suite
  - Test SIR pipeline
  - Ensure no regressions from fix porting

Phase 4: Integration Testing
  - End-to-end god-write with --execute
  - Verify citation enforcement pipeline
  - Verify style profile injection
  - Verify inline validation with OCR corpus
```

---

## KNOWN ISSUES IN BOTH CODEBASES

1. Quality gauntlet stages all return 0.5 (default) — not properly evaluating content
2. "psychS-sight" OCR artifact in O'Gorman corpus chunks
3. Signal phrase citations missing page numbers (8/11 in test)
4. Paragraph deduplication uses first-80-chars fingerprint — may need tuning
5. Inline validation: 2/6 units pass on average (aggressive citation false positives)
6. Semantic retrieval returns ZERO primary text chunks — needs author-boosting
7. ICP auto-verification flags all 31 spans (0% auto-verified)
