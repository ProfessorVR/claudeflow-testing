# ICP Dashboard & God-Write Pipeline — Comprehensive System Report

**Date**: 2026-03-29
**Purpose**: Full architectural analysis for dashboard streamlining
**Scope**: 18 source files, ~15,000 LOC across 5 subsystems

---

## Executive Summary

The system has **two parallel generation pipelines** and a **13-panel dashboard** that mixes both workflows into a single UI. This is the root cause of user confusion.

| Pipeline | Entry Point | Generation Approach | Quality Gates | Dashboard Panels |
|----------|-------------|-------------------|---------------|-----------------|
| **ICP Orchestrator** | `ICPOrchestrator.run()` | 11-stage claim-atom pipeline (decompose → retrieve → verify → bind → stress → plan → generate → enforce → gauntlet → endnotes → export) | Full (8 gates) | Evidence, Binding, Stress, Planner, Heatmap, Quality, Export |
| **God-Write** | `WritePipelineOrchestrator.write()` | Gold-standard prompt → ModelRouter direct call (single-shot or rolling context) | Full (same 8 gates) | Gen Progress, Investigation |

**Key Finding**: The `/adapter/generate` route was migrated to ICPOrchestrator in Phase 8.2B, but the dashboard UI still reflects the old adapter's stepped workflow. The dashboard needs to be updated to match.

---

## 1. Architecture Overview

### 1.1 Pipeline Flow Comparison

**ICP Orchestrator (11 stages):**
```
User Prompt
  → [1] PromptDecomposer → PromptSpec + Facets
  → [2] FacetedRetrieval → QuoteSpans (sentence-level, per-facet)
  → [3] QuoteRanker → canonicalize + rank + active set
  → [4] AutoVerifier → verification statuses (2-stage: structural + confidence)
  → [5] WritingContractBuilder → thesis, scope, section outline
  → [6] ClaimAtomBinder → decompose claims → bind to quotes → demote unbound
  → [7] ClaimStressTester → warrant adequacy + contradiction detection
  → [8] ConstrainedGenerator → paragraph plan → validate → generate with drift checks
  → [9] CitationEnforcer + AuthorScrubber + APA strip + endnote leak strip + sanitizer (2-pass)
  → [10] QualityGauntlet (9 weighted stages) + EndnoteGenerator + Bibliography
  → [11] RunManifestBuilder → ExportPackage
```

**God-Write Pipeline (legacy/v2):**
```
User Prompt
  → DESC episode injection
  → Multi-query retrieval (Phase 1a-1f: semantic queries, author supplementation,
      source diversity, chunk trimming, attention reordering, coverage validation)
  → KU + structural edge loading
  → Style profile injection
  → [If multiStep] v1 draft → investigateV1 → prevention plan → v2 draft
  → [If rollingContext] section-by-section with sliding window + citation tracker
  → [Else] single-shot gold standard prompt
  → Prose sanitization → Quality gauntlet → Citation enforcement → Author scrubbing
  → APA stripping → Endnote leak stripping → Endnote generation
  → Source verification → Pattern storage → DESC storage
```

### 1.2 Shared Components

Both pipelines share these quality gate modules:

| Module | Purpose | Key Config |
|--------|---------|------------|
| `CitationEnforcer` | Phase 4/7/8: hallucination detection, quotation fidelity, claim grounding | mode: strict/auto-correct/warn, minPassRate: 0.9, maxHallucinations: 3 |
| `QualityGauntlet` | 9-stage weighted scoring (argument coherence, citation completeness, style, factual accuracy, etc.) | overallThreshold: 0.80, parallel: true, 5-min cache |
| `ProseSanitizer` | 34-pattern artifact removal (research markers, LLM meta-text, debug markers) + section/paragraph dedup | Zero-tolerance (all critical) |
| `EndnoteGenerator` | 6-pattern citation extraction → corpus search → MLA table → bbox overlays | maxQuotationsPerEndnote: 3, minRelevance: 0.65 |
| `scrubNonCorpusAuthors` | 6 signal-phrase patterns, diacritics-aware, nobiliary particle handling | Manifest-based allowlist |
| `stripBareApaParentheticals` | Remove (Author Year) citations (wrong for MLA format) | Negative lookahead preserves MLA |
| `stripEndnoteLeaks` | Remove [EN1], superscript digits, standalone [N] from main text | Safety: preserves parenthetical refs |

---

## 2. Dashboard UI Analysis

### 2.1 Panel Inventory (13 panels)

| # | Panel | Primary API Calls | Pipeline | Current State |
|---|-------|------------------|----------|---------------|
| 0 | **Prompt** | `POST /session`, `GET /corpus-folders`, `GET /adapter/cost-estimate` | Both | Working. Has "Run Pipeline" (stages 1-4) and "Generate (Adapter)" buttons |
| 1 | **Evidence** | `GET /session/:id`, `POST /verify`, `POST /patch`, `GET /pdf-page`, `GET /pdf-meta` | ICP | Working but **no "next step" button, no "Select All"** |
| 2 | **Investigation** | Reads `session.investigation_results` | God-Write | Shows v1 analysis. Has "Re-generate with Prevention Plan" button |
| 3 | **Binding** | `POST /bind/:id`, `DELETE /bind/:id/:bindingId` | ICP | Working. Manual atom-to-quote binding |
| 4 | **Stress Test** | `POST /stress-test/:id` | ICP | Working. Shows warrant adequacy results |
| 5 | **Planner** | Reads `session.paragraph_plan` | ICP | Working. Shows atom coverage + paragraph structure |
| 6 | **Gen Progress** | `POST /adapter/generate/:id`, WebSocket | God-Write | Shows section-by-section generation progress |
| 7 | **Heatmap** | Reads `session.paragraph_plan` | ICP | Working. Evidence density visualization |
| 8 | **Corpus Diff** | `GET /corpus-diff/:r1/:r2` | ICP | MVP placeholder |
| 9 | **Facets** | `GET /facets/:id`, `PUT /facets/:id/:fid` | ICP | Working. Editable facet settings |
| 10 | **Quality** | `POST /adapter/validate/:id` | Both | Shows all quality gate results. Has "Run Validation" + "Submit Feedback" buttons |
| 11 | **Export** | `POST /export/:id`, `POST /build-gold-prompt/:id` | Both | Working. Gold prompt preview + export package download |
| 12 | **Events** | `GET /events/:id` | Both | Working. Filterable event log |

### 2.2 Evidence Panel Details

**Current Controls:**
- Status filter dropdown: All / Auto-verified / Human-verified / Flagged / Auto-rejected
- Limit dropdown: Top 10 / 25 / 50 / All
- Per-quote cards with: status badge, text preview (200 chars), doc ID, page, confidence %
- Per-quote actions: Verify / Reject / Flag buttons
- Click → Quote detail modal (split pane: quote info + PDF viewer with zoom/fullscreen)

**Missing:**
- No "Select All" / "Verify All" bulk action
- No "Next Phase" / "Proceed to Generation" button
- No indication of what to do after reviewing evidence

**Quote Detail Modal Features:**
- Left: status, source info, full quote text, footnotes, OCR correction editor (contenteditable with formatting toolbar: bold, italic, super/subscript, join hyphen, copy from rich text)
- Right: PDF page renderer (300 DPI via pdftoppm), zoom controls (+/-, 1:1, fit width, fullscreen), page navigation, match type badge (exact/structural/none)
- Keyboard shortcuts: Escape, +/-, 0

### 2.3 Prompt Panel Details

**Input Fields (25+ form elements):**
- Research question textarea
- Source mode: corpus / hybrid / external
- Min relevance (0-1), Max chunks (1-100)
- Corpus folder selector (auto-populated from Chroma/filesystem)
- Draft category: section / chapter / paper / essay / article / report
- Word count target selector
- Style profile selector

**Pipeline Feature Checkboxes (12):**
- Multi-step drafting, Rolling context, Chunk optimization, KG boosting
- Knowledge units, Structural edges, Author scrubbing, Conclusion summaries
- Inline validation, Quality gauntlet, Revision loop, Page context expansion

**Advanced Settings (10):**
- Grounding strictness, Cost tier, Chunk trim target, Shared pool size
- Context window, Section words, Max chunks/source, Relevance floor
- Over-citation threshold, Token budget ceiling

### 2.4 WebSocket Integration

**Connection:** `ws{s}://{host}/ws/icp`
**Message Types:**
| Type | Direction | Data |
|------|-----------|------|
| `subscribe` | Client → Server | `{ sessionId }` |
| `abort` | Client → Server | `{ sessionId }` |
| `subscribed` | Server → Client | `{ sessionId }` |
| `section-complete` | Server → Client | `{ index, wordCount, text }` |
| `investigation-complete` | Server → Client | `{ issues }` |
| `budget-warning` | Server → Client | `{ action, detail }` |
| `generation-complete` | Server → Client | `{ totalSections, totalWords }` |
| `abort-acknowledged` | Server → Client | `{ completedSections, totalSections }` |
| `gate-result` | Server → Client | `{ gate, passed }` |

---

## 3. API Route Inventory (28 endpoints)

### 3.1 Session Management
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/session` | Create session + run stages 1-4 (decompose, retrieve, rank, verify) |
| GET | `/session/:id` | Full session state (serialized) |
| GET | `/sessions` | List all sessions (summary) |
| DELETE | `/session/:id` | Delete session |

### 3.2 Evidence & Verification
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/retrieve/:id` | Re-run faceted retrieval, add new spans |
| POST | `/verify` | Update quote verification status |
| POST | `/patch` | Submit OCR correction |
| GET | `/pdf-page/:docId/:page` | Render PDF page as PNG (300 DPI, with highlight/bbox) |
| GET | `/pdf-meta/:docId/:page` | Rich text + footnotes extraction |
| GET | `/doc-info/:docId` | Document metadata from manifest |
| GET | `/corpus-folders` | Available corpus subfolders |

### 3.3 Composition & Analysis
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/bind/:id` | Create claim-to-quote binding |
| DELETE | `/bind/:id/:bindingId` | Remove binding |
| POST | `/stress-test/:id` | Run/query stress test |
| POST | `/generate/:id` | Query generation status |
| POST | `/build-gold-prompt/:id` | Build gold-standard prompt |
| POST | `/export/:id` | Generate ExportPackage |
| GET | `/events/:id` | Session event log |
| GET | `/corpus-diff/:r1/:r2` | Compare runs (placeholder) |
| GET | `/facets/:id` | Facets with coverage stats |
| PUT | `/facets/:id/:fid` | Update facet settings |

### 3.4 Pipeline Orchestration (adapter routes)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/adapter/generate/:id` | Run full 11-stage ICPOrchestrator pipeline |
| POST | `/adapter/regenerate/:id` | Re-run pipeline |
| POST | `/adapter/validate/:id` | Return quality gate results |
| POST | `/adapter/feedback/:id` | Submit user feedback |
| GET | `/adapter/cost-estimate` | Token cost estimation |
| GET | `/adapter/config-defaults` | Pipeline defaults |
| GET | `/diagnostics` | API health check |

---

## 4. Type System Summary

### 4.1 Core Session State (ICPSession — 50+ fields)

**Identity & Lifecycle:**
- `session_id`, `revision`, `created_at`, `updated_at`
- `pipeline_phase`: CREATED → DECOMPOSED → RETRIEVED → VERIFIED → BOUND → GENERATED → PARTIALLY_GENERATED → INVESTIGATED → REGENERATED → VALIDATED → EXPORTED

**Evidence Layer:**
- `prompt_spec`: PromptSpec (research questions, facets, retrieval lexicon, success criteria)
- `source_scope`: SourceScopeSpec (mode, corpus config, authority policy)
- `facets`: Facet[] (13 fields each: role, strictness, evidence policy map, atoms/reverse mode)
- `quote_spans`: QuoteSpan[] (30+ fields each: 3-tier identity, provenance scorecard, verification status, OCR repair)
- `canonical_registry_snapshot`: frozen at session start for deterministic scoring

**Composition Layer:**
- `atoms`: ClaimAtom[] (stable UUID, semantic text, modality, kind, evidence mode, bound quotes)
- `bindings`: ClaimBinding[] (atom IDs ↔ quote IDs with support kind)
- `hypothesis_claims`: HypothesisClaim[] (demoted unbound atoms)
- `writing_contract`: WritingContract (thesis, scope, sections, facet requirements)
- `stress_test_report`: StressTestReport

**Generation Layer:**
- `paragraph_plan`: ParagraphPlanEntry[] (atom IDs, required quotes, section ID)
- `paragraph_ledger`: ParagraphLedger (coverage stats, drift flags per paragraph)
- `sentence_scopes`: SentenceScope[] (sentence → atom mapping)
- `generated_text`: Map<string, string>
- `review_results`: ReviewResults (quote fidelity, claim coverage, facet coverage)

**Quality Layer:**
- `quality_gates`: QualityGateResults (11 sub-results: citation enforcement, gauntlet, endnotes, bibliography, sanitization, style profile, checkpoints, author scrubbing, APA stripping, endnote leaks, investigation)
- `run_manifest`: RunManifest (immutable snapshot for reproducibility)
- `event_log`: ICPSessionEvent[] (append-only audit trail)

### 4.2 Verification Status Flow
```
[initial] → flagged (from FacetedRetrieval sentence extraction)
         → auto_verified (AutoVerifier Stage A passed + confidence ≥ 0.85)
         → auto_rejected (Stage A failed + confidence < 0.50)
         → human_verified (user clicks Verify)
         → human_corrected (user edits text + saves)
         → rejected (user clicks Reject)
         → stale_verified (corpus patch invalidated previous verification)
```

### 4.3 Quality Gauntlet Stages (9 stages, 1.0 total weight)

| # | Stage | Weight | Purpose |
|---|-------|--------|---------|
| 0 | CitationVerifier | 0.08 | Author-in-corpus check |
| 1 | QuotationFidelityStage | 0.10 | Verbatim quotation check |
| 2 | ToulminEnforcer | 0.08 | Argument structure |
| 3 | ArgumentCoherenceChecker | 0.15 | Logical flow |
| 4 | CitationCompletenessVerifier | 0.15 | Missing citations, format |
| 5 | CitationDensityChecker | 0.10 | PhD-level density (15+ per section) |
| 6 | StyleConsistencyValidator | 0.12 | Tone, vocabulary |
| 7 | FactualAccuracyAuditor | 0.10 | Internal consistency |
| 8 | ClaimVerificationStage | 0.07 | CCV entailment |

---

## 5. Key Configuration Constants (GOLD_STANDARD_CONFIG)

| Constant | Value | Purpose |
|----------|-------|---------|
| chunkTrimTarget | 450 | Target chars per chunk |
| targetChunks | 28 | Default retrieval count |
| maxChunksPerSource | 8 | Diversity cap |
| targetTotalChunks | 35 | Post-diversity target |
| relevanceFloor | 0.25 | Minimum relevance |
| minSectionWords | 350 | Minimum section length |
| maxCorpusBlockChars | 60,000 | Corpus context budget (~15K tokens) |
| overCitationThreshold | 0.40 | Flag if one source >40% |
| opusMaxTokens | 16,384 | Max generation tokens |
| primaryRatioThreshold | 0.30 | Primary author chunk ratio |
| rollingContextWindowSize | 2 | Prior sections in window |
| rollingContextSectionWords | 700 | Words per rolling section |
| rollingContextConclusionWords | 200 | Conclusion target |
| rollingContextMaxTokens | 2,048 | Per-section token limit |
| rollingContextSharedPoolSize | 5 | Shared pool chunks |
| rollingContextMaxChunksPerSection | 10 | Per-section chunk limit |
| rollingContextSharedPoolMaxCitations | 3 | Deprioritize after N citations |

---

## 6. Dashboard Streamlining Recommendations

### 6.1 Critical Issues

1. **No "Run Full Pipeline" on Prompt page** — User must know to navigate to Gen Progress and click "Generate (Adapter)". Should be a single prominent button on Prompt that runs everything and lands on Export.

2. **No "Select All" on Evidence** — Reviewing 20-50 quotes one by one is tedious. Bulk verify/reject needed.

3. **No workflow progression indicators** — After Evidence review, user has no guidance on next step. No "Next Phase" buttons, no progress bar, no wizard-style flow.

4. **Two generation workflows in one UI** — ICP pipeline (manual step-by-step) and adapter pipeline (automated) share panels but have different lifecycles. The Gen Progress panel serves the adapter workflow but not the ICP workflow.

5. **Investigation panel orphaned** — Only populated when the old adapter ran multi-step drafting. Now that adapter uses ICPOrchestrator.run() (which has its own investigation via stress test), this panel may show no data.

### 6.2 Recommended Changes

**Immediate (dashboard UX fixes):**

1. **Prompt page "Run Full Pipeline" button** — Creates session → calls `POST /adapter/generate/:id` → shows spinner → auto-navigates to Export tab when done. One-click workflow.

2. **Evidence "Select All" button** — Bulk-verifies all auto_verified quotes. Also: "Reject Low Confidence" button for quotes below threshold.

3. **Evidence "Proceed to Generation" button** — Sticky footer button that navigates to the appropriate next step.

4. **Pipeline progress bar** — Top-level indicator showing: Prompt → Evidence → Generation → Quality → Export with checkmarks for completed stages.

**Structural (simplify panel layout):**

5. **Merge Investigation into Quality** — Investigation results (hallucinated authors, phantom quotations, section word counts) are quality metrics. Show them alongside gauntlet results in the Quality panel.

6. **Hide advanced panels by default** — Binding, Stress Test, Planner, Heatmap, Corpus Diff are power-user tools. Show them under an "Advanced" toggle. Default view: Prompt → Evidence → Quality → Export.

7. **Auto-populate Export on generation** — When `/adapter/generate` completes, the Export panel should already have the final prose, endnotes, bibliography, and quality gate summary ready. No need for a separate "Export" button click.

---

## 7. File Index

| File | Lines | Purpose |
|------|-------|---------|
| `core/composition/icp-orchestrator.ts` | 905 | 11-stage pipeline orchestrator |
| `core/composition/icp-types.ts` | 1,596 | All ICP type definitions (50+ interfaces) |
| `core/composition/icp-session-events.ts` | 317 | 15 event factory functions |
| `core/composition/prompt-decomposer.ts` | 271 | Prompt → facets decomposition |
| `core/composition/retrieval-utils.ts` | 440 | investigateV1, trimChunkContent, reorderChunks, enforceSourceDiversity, validateCoverage |
| `core/composition/quote-ranker.ts` | ~400 | 3-pass canonicalization + weighted ranking + budget enforcement |
| `core/composition/claim-atom-binder.ts` | ~350 | Toulmin decomposition → binding → demotion + migration |
| `core/composition/claim-stress-tester.ts` | ~300 | Warrant adequacy + contested scholarship + contradiction retrieval |
| `core/composition/constrained-generator.ts` | ~500 | Paragraph plan → validate → generate with dual drift detection |
| `core/composition/run-manifest.ts` | ~400 | Immutable snapshots + policy store + export package |
| `core/composition/auto-verifier.ts` | ~350 | 2-stage verification (structural + confidence) + OCR repair |
| `core/composition/icp-provider-factory.ts` | ~150 | Wires ModelRouter → ICPDependencies |
| `retrieval/faceted-retrieval.ts` | ~400 | Per-facet retrieval + span extraction + scarcity checks |
| `core/writing/citation-enforcer.ts` | ~500 | Phase 4/7/8: hallucination + fidelity + grounding |
| `cli/quality/quality-gauntlet.ts` | ~600 | 9-stage weighted scoring with parallel execution + caching |
| `cli/quality/endnote-generator.ts` | ~700 | 6-pattern citation extraction + MLA tables + bbox overlays |
| `cli/composition/prose-sanitizer.ts` | ~300 | 34-pattern artifact removal + dedup |
| `universal/write-pipeline-orchestrator.ts` | ~3,600 | God-write legacy + v2 pipelines |
| `universal/gold-standard-prompt-builder.ts` | ~600 | 7-section single-shot + 11-section rolling context prompts |
| `universal/gold-standard-config.ts` | ~65 | Magic numbers (chunk sizes, token budgets, rolling window) |
| `universal/author-scrubber.ts` | ~190 | 6 signal-phrase patterns + APA stripping |
| `universal/quality-integration.ts` | ~1,050 | Edge coherence + endnote leak stripping + quality validation loop |
| `observability/icp-api-routes.ts` | ~1,700 | 28 REST endpoints + session store |
| `observability/dashboard/icp-panel.js` | ~2,350 | 13-panel frontend + WebSocket + PDF viewer |
| `observability/dashboard/app.js` | ~7,400 | Main dashboard (ICP tab integration) |
| `observability/dashboard/index.html` | ~2,140 | HTML structure |
| `observability/dashboard/styles.css` | ~5,500 | 200+ ICP CSS classes |
