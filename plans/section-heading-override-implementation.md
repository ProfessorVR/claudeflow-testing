# Section Heading Override — Implementation Plan

**Date**: 2026-04-09
**Problem**: The god-write pipeline ignores explicit section headings in user prompts and generates its own outline from semantic retrieval queries.
**Root cause**: Two extraction functions serve different purposes but only the wrong one feeds the document outline.

## Diagnosis

The pipeline has two extraction paths:

| Function | Location | Output | Used For |
|----------|----------|--------|----------|
| `extractSemanticRetrievalQueries()` | write-pipeline-orchestrator.ts:403–470 | Keyword queries for embedding search | **Incorrectly** used as document outline via `subsections` |
| `extractRetrievalQueries()` | write-pipeline-orchestrator.ts:275–390 | User-provided section headings | **Only** used for `sectionConstraints` (citation rules), never the outline |

### Data Flow (Current — Broken)

```
User prompt with "Section 1: X, Section 2: Y, Section 3: Z"
  │
  ├─→ extractSemanticRetrievalQueries() → ["keyword1 keyword2", "author concept", ...]
  │     └─→ retrieval-stage.ts:126 → subsections = [semantic queries]  ← PROBLEM
  │
  └─→ extractRetrievalQueries() → ["Section 1: X", "Section 2: Y", "Section 3: Z"]
        └─→ retrieval-stage.ts:403 → sectionConstraints only (NOT outline)
  
  subsections (semantic queries) flows through:
    retrieval-stage.ts:430 → RetrievalResult.subsections
    write-pipeline-orchestrator.ts:3305 → const subsections = retrieval.subsections
    write-pipeline-orchestrator.ts:1007 → globalOutline: subsections
    gold-standard-prompt-builder.ts:237–240 → rendered as document section titles
```

### Data Flow (Fixed)

```
User prompt with "Section 1: X, Section 2: Y, Section 3: Z"
  │
  ├─→ extractRetrievalQueries() → ["Section 1: X", "Section 2: Y", "Section 3: Z"]
  │     └─→ IF explicit headings found → subsections = [user headings]  ← FIX
  │
  └─→ extractSemanticRetrievalQueries() → ["keyword1 keyword2", ...]
        └─→ used ONLY for retrieval queries, NOT for outline
  
  subsections (user headings) flows through same path → rendered correctly
```

## Changes Required

### Change 1: Detect explicit section headings in retrieval-stage.ts

**File**: `src/god-agent/universal/stages/retrieval-stage.ts`
**Location**: Around line 108–130

**Current** (line ~126):
```typescript
subsections = deps.extractSemanticRetrievalQueries(topic);
```

**New logic**:
```typescript
// Try to extract explicit section headings from the user prompt first
const explicitHeadings = deps.extractRetrievalQueries(topic);
const hasExplicitHeadings = explicitHeadings.length >= 2 
  && topic.toLowerCase().includes('section');

if (hasExplicitHeadings) {
  // User provided explicit section headings — use them as the document outline
  subsections = explicitHeadings;
  goldLog(`Using ${explicitHeadings.length} explicit section headings from prompt`);
} else {
  // No explicit headings — fall back to semantic query-derived outline
  subsections = deps.extractSemanticRetrievalQueries(topic);
}
```

**Why**: The detection heuristic checks for both parsed headings (>= 2) AND the word "section" in the prompt. This avoids false positives from prompts that happen to have numbered lists but aren't specifying an outline.

### Change 2: Ensure semantic queries still drive retrieval

**File**: `src/god-agent/universal/stages/retrieval-stage.ts`
**Location**: The retrieval loop that uses subsections for chunk retrieval (around lines 130–175)

**Current**: The `subsections` array drives both retrieval AND outline.

**New logic**: When explicit headings are used as `subsections`, the retrieval loop should ALSO run the semantic queries for chunk retrieval:

```typescript
// Semantic queries for retrieval (always generated, regardless of outline source)
const semanticQueries = deps.extractSemanticRetrievalQueries(topic);

// Use semantic queries for retrieval
for (const sq of semanticQueries) {
  // ... existing retrieval logic using sq ...
}

// subsections is either explicit headings or semantic queries (for outline)
```

This separates the two concerns: retrieval queries fetch chunks, subsections define the outline.

### Change 3: Clean heading text for outline display

**File**: `src/god-agent/universal/stages/retrieval-stage.ts` or `write-pipeline-orchestrator.ts`

The extracted headings may have prefixes like "Section 1:" that should be cleaned for display:

```typescript
// Strip "Section N:" prefix if present — the outline renderer adds its own numbering
const cleanedHeadings = explicitHeadings.map(h => 
  h.replace(/^Section\s+\d+[:.]\s*/i, '').trim()
);
```

### Change 4: Pass explicit headings through to sectionConstraints

**File**: `src/god-agent/universal/stages/retrieval-stage.ts`
**Location**: Around line 403

**Current**: `extractRetrievalQueries()` is called separately and only feeds `sectionConstraints`.

**New**: When explicit headings are detected in Change 1, the same headings should be used for both the outline AND `sectionConstraints`, ensuring consistency:

```typescript
// Line ~403: Use the same headings for constraints
const allSubsections = hasExplicitHeadings ? subsections : deps.extractRetrievalQueries(topic);
const sectionConstraints = deps.buildSectionConstraints(allSubsections, primaryAuthors);
```

## Files Modified

| File | Changes | Risk |
|------|---------|------|
| `src/god-agent/universal/stages/retrieval-stage.ts` | Changes 1–4: heading detection, retrieval separation, constraint alignment | Medium — core pipeline logic |
| No changes needed to `gold-standard-prompt-builder.ts` | It already renders `globalOutline` correctly | None |
| No changes needed to `write-pipeline-orchestrator.ts` | It passes `subsections` through unchanged | None |

## Testing

### Verification

1. Re-run the constrained 5-section prompt — sections should now match the explicit headings
2. Re-run an open-ended prompt (no explicit sections) — should fall back to semantic query outline (no regression)
3. Run `npx tsx scripts/verify-hardening.ts` — 77 tests should still pass

### Change 5: Post-generation outline drift detection

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts`
**Location**: Post-generation validation phase (after content is generated, before final output)

When explicit headings were used, compare the generated text's `## ` headings against the expected outline:

```typescript
if (hasExplicitHeadings) {
  const generatedHeadings = content.split('\n')
    .filter(l => l.startsWith('## '))
    .map(l => l.replace(/^##\s*\d*\.?\s*/, '').trim());
  
  const expectedHeadings = subsections.map(s => 
    s.replace(/^Section\s+\d+[:.]\s*/i, '').trim().toLowerCase()
  );
  
  const matched = generatedHeadings.filter(gh => 
    expectedHeadings.some(eh => gh.toLowerCase().includes(eh.substring(0, 20)))
  );
  
  if (matched.length < expectedHeadings.length * 0.6) {
    console.error(
      `[WARN] Outline drifted from user-specified sections: ` +
      `expected ${expectedHeadings.length} headings, matched ${matched.length}. ` +
      `Generated: ${generatedHeadings.slice(0, 5).join('; ')}`
    );
  }
}
```

**Why**: Passing the headings through correctly doesn't guarantee the LLM respects them. This catches non-compliance automatically rather than requiring manual review of every run.

### Acceptance Criteria

- Constrained prompt produces exactly 5 body sections matching the requested headings
- Open-ended prompt produces the same outline as before (regression check)
- Word count stays within 2500–3500 for a 3000-word target
- Rickert and Uexküll sections have substantive content grounded in corpus chunks
- Cross-author comparisons appear in sections 2–5
- Outline drift warning fires if LLM ignores explicit headings

## Future Work (Deferred)

- Extend heading detection heuristic beyond "section" keyword to cover other explicit-outline syntaxes (e.g., "Use the following headings:" with a numbered list). Current conservative check avoids false positives; only broaden when a concrete use case surfaces.

## Rollback

Backup already exists at `.backups/20260409_103215/`. If the fix causes regressions:
```bash
cp .backups/20260409_103215/src/god-agent/universal/stages/retrieval-stage.ts \
   src/god-agent/universal/stages/retrieval-stage.ts
```
