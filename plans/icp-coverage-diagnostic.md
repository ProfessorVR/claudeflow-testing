# ICP Pipeline Improvements Plan

Status: DRAFT
Created: 2026-02-17
Last Updated: 2026-02-17

---

## 1. Coverage Diagnostic Gate (Phase 9-style pre-flight for ICP)

### Problem

The ICP pipeline has no pre-flight coverage check. It commits to all 11 stages
regardless of how much (or how little) evidence the corpus contains. When
retrieval returns 0 chunks (e.g., embedding CUDA error, empty collection, or
topic outside corpus), the pipeline proceeds through decomposition, ranking,
verification, binding, stress testing, generation, and review — producing empty
or garbage output with no clear diagnostic about *why*.

Phase 9's coverage grade (NONE/LOW/MED/HIGH) solves this cleanly for the
research pipeline. The ICP needs an equivalent.

### Proposed Solution

Insert a **Coverage Diagnostic** between Stage 2 (Faceted Retrieval) and
Stage 3 (Canonicalization). This is a gate, not a filter — it either lets the
pipeline proceed or returns early with an actionable diagnostic.

### Design

#### New Type: `CoverageDiagnostic`

```typescript
// In icp-types.ts
export type CoverageGrade = 'NONE' | 'LOW' | 'MED' | 'HIGH';

export interface FacetCoverageDiagnostic {
  facet_id: string;
  facet_label: string;
  grade: CoverageGrade;
  chunk_count: number;
  span_count: number;
  distinct_documents: number;
  best_similarity: number;      // highest cosine similarity among retrieved chunks
  scarcity_warnings: EvidenceScarcityWarning[];
}

export interface CoverageDiagnostic {
  overall_grade: CoverageGrade;
  facet_grades: FacetCoverageDiagnostic[];
  total_chunks: number;
  total_spans: number;
  total_distinct_documents: number;
  rationale: string[];          // human-readable reasons for the grade
  gaps: string[];               // facets with NONE or LOW coverage
  proceed: boolean;             // whether the pipeline should continue
  block_reason?: BlockReason;   // if proceed=false, why
}
```

#### Grading Logic (per-facet)

Mirrors Phase 9 but operates per-facet instead of per-query:

```
Per facet:
  spans == 0                             → NONE
  spans >= 5 AND docs >= 2 AND sim > 0.7 → HIGH
  spans >= 2 AND docs >= 1 AND sim > 0.5 → MED
  else                                   → LOW

Overall:
  all facets HIGH                        → HIGH
  majority MED+, no NONE on required     → MED
  any required facet NONE                → LOW
  all facets NONE                        → NONE
```

#### Gate Behavior

| Overall Grade | Pipeline Action |
|---------------|-----------------|
| HIGH          | Proceed normally |
| MED           | Proceed with warnings on session event log |
| LOW           | Proceed in `permissive` mode, emit strong warnings, set `evidence_strictness: 'permissive'` |
| NONE          | Early return with `CoverageDiagnostic` in result, `success: false`, clear `block_reason` |

#### Integration Point in `icp-orchestrator.ts`

```
Stage 1: Prompt → PromptSpec (decompose)
Stage 2: Faceted Retrieval → QuoteSpans
  ┌──────────────────────────────────────────┐
  │ NEW: Stage 2.5 — Coverage Diagnostic     │
  │   - Grade each facet                     │
  │   - Compute overall grade                │
  │   - Store on session.coverage_diagnostic │
  │   - Emit coverage event                  │
  │   - If NONE: early return                │
  │   - If LOW: downgrade to permissive      │
  └──────────────────────────────────────────┘
Stage 3: Canonicalization → Ranking
...
```

#### Session Field Addition

```typescript
// Add to ICPSession interface
coverage_diagnostic?: CoverageDiagnostic;
```

#### Event Emission

```typescript
// New event in icp-session-events.ts
emitCoverageDiagnosticEvent(session, diagnostic);
```

### Files to Modify

| File | Change |
|------|--------|
| `src/god-agent/core/composition/icp-types.ts` | Add `CoverageDiagnostic`, `FacetCoverageDiagnostic`, `CoverageGrade` types; add `coverage_diagnostic` to `ICPSession` |
| `src/god-agent/core/composition/icp-orchestrator.ts` | Add `computeCoverageDiagnostic()` method; insert gate after Stage 2 |
| `src/god-agent/core/composition/icp-session-events.ts` | Add `emitCoverageDiagnosticEvent()` |
| `src/god-agent/observability/dashboard/icp-panel.js` | Display coverage diagnostic in dashboard |
| `tests/god-agent/core/composition/icp-full-pipeline.test.ts` | Test coverage gate behavior (NONE early return, LOW permissive, etc.) |

### Open Questions

- [ ] Should LOW grade downgrade the entire pipeline to `permissive`, or only the specific facets that are LOW?
- [ ] Should the dashboard show per-facet coverage as a heatmap?
- [ ] Should the gate be configurable (e.g., `skipCoverageGate: true` for testing)?

---

## 2. Note: Per-Facet Decomposition in Phase 9

Phase 9 intentionally runs a single vector search for the entire query. Its
single-pass design is a deliberate choice — deterministic, simple, and aligned
with its role as a read-only epistemic diagnostic. Not planned for change.

That said, if per-facet coverage granularity is ever needed in the research
pipeline (e.g., detecting that a multi-topic query has HIGH coverage on one
sub-topic but NONE on another), the ICP's faceted decomposition approach
could be adapted. This would be a future extension, not a backport.

### Status: NOT PLANNED (noted for future reference only)

---

## 3. Future: Knowledge Unit + Reasoning Edge Integration in ICP

### Problem

The ICP retrieves chunks and extracts QuoteSpans, but has no equivalent to
Phase 9's knowledge units (distilled facts from `knowledge.jsonl`) or reasoning
edges (causal/relational links from `reasoning.jsonl`). These are pre-compiled
knowledge structures that could improve claim generation quality.

### Proposed Solution

After faceted retrieval (Stage 2), surface relevant KUs and reasoning edges
from the god-learn substrate and inject them into the claim generation context.
This gives the LLM structured knowledge alongside raw quotes.

### Status: IDEA (not yet designed)

---

## 4. Future: Embedding Health Check Before Pipeline

### Problem

The ICP pipeline silently produces 0 results when the embedding service is down
(CUDA error, service not running). The Feb 14 debug session traced this to
`SmartRetrievalLayer.semanticSearch()` getting an empty embedding, leading to
0 ChromaDB results cascading through the entire pipeline.

### Proposed Solution

Add a health probe at pipeline start — embed a test string and verify a
non-empty vector is returned. If the embedding service is unhealthy, fail fast
with a clear diagnostic instead of proceeding through 11 stages to produce
nothing.

### Status: IDEA (low effort, high value — should do alongside item 1)

---

## Changelog

| Date | Item | Change |
|------|------|--------|
| 2026-02-17 | 1 | Initial design for coverage diagnostic gate |
| 2026-02-17 | 2 | Added idea: per-facet decomposition for Phase 9 |
| 2026-02-17 | 3 | Added idea: KU/reasoning edge integration in ICP |
| 2026-02-17 | 4 | Added idea: embedding health check pre-flight |
