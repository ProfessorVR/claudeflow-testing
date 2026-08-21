# God-Write Pipeline Audit: Findings & Fix Plan

**Date**: 2026-03-06
**Goal**: Return god-write to premiere working state
**Scope**: All writing agents in claudeflow-testing (excludes ICP)

---

## Good News First

The god-write execution path is **structurally intact**. No broken imports, no ICP type leakage into the write path, and the staged composition (ICP) is properly isolated behind a `shouldUseStagedComposition` guard. The 14-stage pipeline order is correct: Retrieve → Constrain → Generate → Sanitize → Enforce → Sanitize → Scrub → Endnotes.

---

## P0: CRITICAL BUGS (Will cause incorrect output)

### 1. Fix 45 NOT Applied — minRelevance still 0.5
**File**: `src/god-agent/core/writing/corpus-constraint-builder.ts:74`
**Bug**: Default `minRelevance = 0.5` — should be `0.0` per Fix 45
**Impact**: Chunks with relevance 0.35–0.49 appear in generated content but are EXCLUDED from the citation whitelist. The citation validator then marks these citations as **hallucinated** and removes them. This is a **false positive hallucination trap** — the system removes correct citations.
**Fix**: Change line 74 from `minRelevance = 0.5` to `minRelevance = 0.0`

### 2. Quality Gauntlet Revision NOT Disabled
**File**: `src/god-agent/universal/quality-integration.ts:184`
**Bug**: `DEFAULT_MAX_REVISIONS = 3` — should be `0` per Fix 50
**Impact**: Quality gauntlet stages all return 0.5 (broken). With 3 revision iterations enabled, the pipeline:
1. Runs gauntlet → gets 0.5 (fails threshold)
2. Calls LLM to revise (wastes tokens, may inject hallucinations)
3. Runs gauntlet again → still 0.5
4. Repeats 2 more times
**Result**: 3x wasted LLM calls + potential hallucination injection from revision prompts
**Fix**: Set `DEFAULT_MAX_REVISIONS = 0` or pass `maxRevisions: 0` in pipeline options

### 3. Fix 46 NOT Applied — Author Scrubber Uses Wrong Author Set
**File**: `src/god-agent/universal/author-scrubber.ts:35`
**Bug**: Builds `allowedAuthors` from `constraint.sources` (retrieved chunks only), NOT full corpus manifest
**Impact**: If semantic retrieval returns only secondary scholarship (common — memory notes "ZERO Aristotle primary text chunks"), primary source authors get scrubbed. Sentences like "As Aristotle argues..." are removed even though Aristotle is in the corpus manifest.
**Fix**: Load full manifest from `scripts/ingest/manifest.jsonl` and merge with constraint.sources for allowedAuthors

### 4. SmartRetrievalLayer hybridSearch Weight Scaling (Fix 29 Not Applied Here)
**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts:174-224`
**Bug**: When keyword search returns 0 results, `mergeResults()` still multiplies semantic scores by `weights.semantic` (0.7). This drops all scores by 30%, pushing chunks below `minRelevance`.
**Impact**: Hybrid search with no keyword matches returns FEWER results than pure semantic search, or returns nothing at all.
**Fix**: When keyword results are empty, return semantic results at full score (1.0 multiplier)

---

## P1: HIGH-PRIORITY ISSUES (Degrades output quality)

### 5. All Inline Validation Units Fail → Placeholder Output
**File**: `src/god-agent/core/writing/inline-validation-orchestrator.ts:586-593`
**Issue**: When all paragraph units fail validation AND recovery conditions aren't met, output contains `[GENERATION FAILED: paragraph]` markers.
**Impact**: Memory notes "2/6 units pass on average" — remaining 4 produce placeholders. Final output has 4 placeholder sections.
**Mitigation**: Prose sanitizer catches `[GENERATION FAILED]` (Fix 14), but replacement is empty string → document has gaps.
**Fix**: Consider fallback to direct generation (no inline validation) when > 50% units fail, rather than outputting gaps.

### 6. Empty constraint.sources Cascading Failure
**File**: `src/god-agent/core/writing/citation-validator.ts:95-110`
**Issue**: If corpus retrieval returns 0 chunks → empty constraint → citation validator marks ALL citations as hallucinated → author scrubber removes ALL author references.
**Impact**: Zero-retrieval scenario produces citation-free, author-free text (academic garbage).
**Fix**: Add early exit: if 0 chunks retrieved, skip citation enforcement + author scrubbing entirely. Output raw generated text with a warning.

### 7. DEFAULT_MIN_RELEVANCE = 0.7 in SmartRetrievalLayer
**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts:35`
**Issue**: Default `0.7` filters aggressively. Write pipeline explicitly passes `0.0` (line 667 of orchestrator), but any other caller (dashboard, CLI direct) gets 0.7 by default.
**Impact**: Dashboard/daemon retrieval may return far fewer chunks than god-write CLI.
**Fix**: Lower default to `0.35` to match typical academic retrieval quality.

### 8. ChromaDB v1 API in GPU Server Manager
**File**: `src/god-agent/core/gpu/gpu-server-manager.ts:198`
**Issue**: Uses deprecated `/api/v1/heartbeat` endpoint. SmartRetrievalLayer correctly uses v2.
**Impact**: GPU manager health checks always fail → logs false "ChromaDB down" warnings.
**Fix**: Update to `/api/v2/heartbeat` or use the same endpoint as SmartRetrievalLayer.

---

## P2: MEDIUM ISSUES (Edge cases & fragility)

### 9. Duplicate HybridRetriever Classes
**Files**:
- `src/god-agent/retrieval/hybrid-retriever.ts` (515 lines, has `retrieve()`)
- `src/god-agent/cli/retrieval/hybrid-retriever.ts` (575 lines, has `search()`)

**Issue**: Two classes with same name, different APIs. EnhancedHybridRetriever extends CLI version (has `search()`), but neither is used by the write pipeline.
**Impact**: Confusion only — no runtime impact since write pipeline uses SmartRetrievalLayer directly.
**Fix**: Consider consolidating or clearly documenting which is canonical.

### 10. EnhancedHybridRetriever is Dead Code
**File**: `src/god-agent/cli/retrieval/enhanced-hybrid-retriever.ts`
**Issue**: Zero imports anywhere in the write pipeline or CLI. Query expansion and multi-query RRF fusion features are never invoked.
**Impact**: 300+ lines of unused code. The query expansion logic (academic term mapping, synonym expansion) could improve retrieval quality if integrated.
**Fix**: Either integrate into SmartRetrievalLayer or remove to reduce confusion.

### 11. getRelatedChunks() Always Returns Empty
**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts:596-611`
**Issue**: `getChunkById()` is unimplemented (returns null), so `getRelatedChunks()` always returns `[]`.
**Impact**: Related chunk expansion never works. Retrieval can't follow "before/after" context windows.
**Fix**: Implement using ChromaDB get-by-ID API, or remove the dead method.

### 12. Inline Validation Recovery Null Safety
**File**: `src/god-agent/core/writing/inline-validation-orchestrator.ts:516-520`
**Issue**: Recovery checks `lastValidationResult?.overallScore >= 0.8` and `lastValidationResult.citationResults?.hallucinated?.length` but if `lastValidationResult` is null AND `lastGeneratedContent` exists, the `?.` chain prevents crash but evaluates to false → recovery never fires.
**Impact**: Units that generated good content but had a validation error (API timeout before validation) can't recover. Fix 21 addresses this partially.
**Fix**: Add explicit check: if `lastGeneratedContent` exists AND no validation was run (null result), attempt recovery with content-only checks.

### 13. Hyphenated Author Names in Citation Validator
**File**: `src/god-agent/core/writing/citation-validator.ts:619-627`
**Issue**: `normalizeAuthor("Smith-Jones")` → `"jones"` (loses "smith" component).
**Impact**: Hyphenated-name authors may not match corpus entries. Edge case for most academic writing.
**Fix**: Split on hyphens and check both components.

---

## P3: LOW-PRIORITY (Cleanup & optimization)

### 14. Entailment Rules Orphaned
**File**: `src/god-agent/core/writing/entailment/entailment-rules.ts`
**Issue**: Not imported by any god-write pipeline component. Only referenced by ICP's writing-contract-builder.
**Impact**: Dead code, no runtime effect.
**Fix**: Leave as-is (ICP may use it).

### 15. LLM Generation Provider maxTokens = 2000
**File**: `src/god-agent/core/composition/llm-generation-provider.ts:82, 106, 129`
**Issue**: Structured output methods use 2000 tokens. Fix 32 increased decomposition to 4000 but generation provider wasn't updated.
**Impact**: Complex paragraph plans may truncate. Low frequency since write pipeline uses direct Anthropic API, not this provider.
**Fix**: Increase to 4000 for consistency.

### 16. Hardcoded ChromaDB Collection UUID
**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts:61`
**Issue**: `collectionId: '256473d0-5091-4494-af4d-007e8f62d43f'` — breaks if ChromaDB is reset.
**Impact**: Low (backup collection name exists), but fragile.
**Fix**: Use collection name lookup instead of UUID.

### 17. Prose Sanitizer Fingerprint Deduplication (80 chars)
**File**: `src/god-agent/cli/composition/prose-sanitizer.ts:271-308`
**Issue**: Paragraph deduplication uses first 80 characters as fingerprint. Paragraphs with identical starts but different content get deduplicated incorrectly.
**Impact**: Very rare edge case in practice.
**Fix**: Increase to 150 chars or use hash of full paragraph.

### 18. Silent Retrieval Failures (11 locations)
**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts` (11 `return []` catch blocks)
**Issue**: All failures return empty array — caller can't distinguish "no results" from "service down".
**Impact**: Write pipeline handles gracefully (warns and continues), but diagnostics are harder.
**Fix**: Return `{ results: [], error?: string }` object instead.

---

## REDUNDANCIES

| Component | Issue | Recommendation |
|-----------|-------|----------------|
| Two HybridRetriever classes | retrieval/ and cli/retrieval/ versions with different APIs | Consolidate or clearly separate concerns |
| EnhancedHybridRetriever | 300+ LOC never used | Integrate query expansion into SmartRetrievalLayer or remove |
| getRelatedChunks() | Always returns [] | Implement or remove |
| Entailment rules | Orphaned from write pipeline | Leave (ICP uses it) |
| FacetedRetrieval | Only used by ICP, not god-write | Leave (ICP uses it) |

---

## RECOMMENDED FIX ORDER

```
Sprint 1: Fix P0 Bugs (30 min)
  [ ] #1: corpus-constraint-builder.ts:74 → minRelevance = 0.0
  [ ] #2: quality-integration.ts:184 → DEFAULT_MAX_REVISIONS = 0
  [ ] #3: author-scrubber.ts:35 → Load full manifest for allowedAuthors
  [ ] #4: smart-retrieval-layer.ts mergeResults → full score when keywords empty

Sprint 2: Fix P1 Issues (1-2 hours)
  [ ] #5: Inline validation all-fail fallback to direct generation
  [ ] #6: Empty constraint early-exit in pipeline
  [ ] #7: Lower DEFAULT_MIN_RELEVANCE to 0.35
  [ ] #8: GPU manager ChromaDB v2 heartbeat

Sprint 3: Verify End-to-End (test)
  [ ] Run god-write --execute with Aristotle/phantasia prompt
  [ ] Verify citations are not falsely flagged
  [ ] Verify no revision loops
  [ ] Verify author names not incorrectly scrubbed
  [ ] Check output for placeholder markers
```

---

## TRAPS TO WATCH FOR

1. **The minRelevance trap**: Pipeline passes 0.0 to corpus constraint builder, but the default parameter is 0.5. If the argument doesn't arrive (undefined/null), it falls back to 0.5 and silently filters chunks.

2. **The revision loop trap**: Quality gauntlet returns 0.5 for all stages. With revision enabled, the system burns 3x LLM calls trying to "improve" text that the gauntlet can't evaluate. Each revision may inject new hallucinations.

3. **The author scrubber trap**: If retrieval returns only secondary sources (common for classical texts), the scrubber's allowedAuthors set contains only commentators. Primary source authors (Aristotle, Plato, etc.) get scrubbed from the output.

4. **The hybrid search weight trap**: Empty keyword results cause semantic scores to be multiplied by 0.7, pushing marginal chunks below the relevance threshold. The pipeline thinks retrieval found nothing, but semantic search actually had results.

5. **The all-fail inline validation trap**: When citation checking is aggressive (false positives on new words each run), most units fail. The output becomes a document of `[GENERATION FAILED]` placeholders that the sanitizer strips to empty strings, leaving a document with gaps.
