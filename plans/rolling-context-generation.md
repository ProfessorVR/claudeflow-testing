# Rolling Context Generation (Option C) — Implementation Plan

**Date**: 2026-03-19
**Status**: Approved for implementation (with amendments v2)
**Branch**: writing-pipeline-v2

## Context

Long-form academic generation (5,000+ words, 8 sections) suffers from two problems:
1. **Token-distribution fatigue**: The LLM writes 270-word early sections then dumps 2,284 words into the conclusion
2. **Coherence loss in section-by-section generation**: Independent sections read like "8 blog posts glued together"

Rolling Context solves both: generate sections sequentially (~700 words each — Opus's sweet spot), feeding previously generated text back into subsequent prompts to maintain argumentative threading.

## Execution Flow

```
Phase 0: Parse --rolling-context CLI flag
Phase 1: Global retrieval (reuse existing pipeline — phases 1a-1f)
Phase 2: Allocate chunks to sections (term-overlap mapping + shared pool)
Phase 3: [If --multi-step] Generate v1 single-shot → investigateV1 → prevention plan
Phase 4: Section-by-section rolling generation loop:
   For each section i = 0..N-1:
     - Build rolling context window (last 2 sections' text)
     - Gather section-specific chunks + shared pool (filtered by citation tracker)
     - Build citation tracker (who's been cited, who hasn't)
     - Build trailing hook constraint (bridge to next section heading)
     - Build per-section prompt via buildRollingContextSectionPrompt()
     - Generate ~700 words via Anthropic API
     - Extract stats (citations, authors, quotations)
     - Generate 50-word Haiku summary of this section (background, for conclusion)
     - Update rolling state
   For conclusion:
     - Build hybrid context: full text of N-2 + N-1, Haiku summaries of 1..N-3
     - Synthesis-focused prompt (no new citations required)
Phase 5: Concatenate all sections with ## headings
Phase 6: Run full post-processing pipeline once (sanitize → gauntlet → enforce → scrub → endnotes)
Phase 7: Return WriteResult with rolling context diagnostics
```

## File Changes

### 1. `src/god-agent/universal/gold-standard-config.ts`
Add rolling context tuning constants:
```typescript
rollingContextWindowSize: 2,          // Prior sections in sliding window
rollingContextSectionWords: 700,      // Target words per section
rollingContextConclusionWords: 200,   // Target words for conclusion
rollingContextMaxTokens: 2048,        // Max output tokens per section call
rollingContextSharedPoolSize: 5,      // Shared chunk pool size
rollingContextMaxChunksPerSection: 10, // Max chunks per section prompt
rollingContextUseSummaries: true,      // Haiku summaries for conclusion context
rollingContextSharedPoolMaxCitations: 3, // Deprioritize shared chunk after N citations
```

### 2. `src/god-agent/universal/gold-standard-prompt-builder.ts`
Add new exported interface and function:

**`RollingContextSectionPromptOptions`** — per-section prompt config:
- `topic`, `globalOutline: string[]`, `currentSectionIndex`, `currentSectionHeading`
- `sectionWordTarget` (e.g., "600-800")
- `chunks: ContextChunk[]` (section-specific subset)
- `knowledgeUnits`, `structuralEdges`, `stylePrompt`
- `preventionPlan` (from v1 investigation, optional)
- `priorSectionsText` (rolling context — last 2 sections' generated text)
- `priorSectionSummaries?: string[]` (50-word Haiku summaries of sections 1..N-3, for conclusion)
- `citationTracker: { authorsCitedSoFar, authorsNotYetCited, totalCitationCount, totalQuotationCount }`
- `isConclusion: boolean`
- `nextSectionHeading?: string` (for trailing hook — omitted for conclusion)
- `sectionConstraint?: string`

**`buildRollingContextSectionPrompt(options)`** — pure function, prompt structure:
1. Role framing: "You are writing Section N of 8"
2. Style profile (reuse existing enrichment logic)
3. Global outline (all 8 headings — shows argument trajectory)
4. Current task: "Write Section N: {heading} (~600-800 words)"
5. Critical constraints (grounding rules, blacklist — reuse from gold standard)
6. Corpus chunks (section-specific, via `buildGoldStandardChunkBlock()`)
7. KUs + structural edges
8. Prior sections context: "Below is what you have written so far. Continue naturally."
9. Citation tracker: "Authors cited so far: X. NOT YET CITED: Y. Aim for 1-2 quotations."
10. Trailing hook: "End with a forward-looking transitional sentence bridging into: '{nextSectionHeading}'. Do NOT write a concluding paragraph." (omitted for conclusion)
11. Output format: "Write ONLY the section body. No heading, no appendix."

Conclusion variant: prior sections = full text of N-1 + N-2, plus 50-word summaries of 1..N-3. "Synthesize the argumentative threads. No new citations required. End with a final synthesis."

### 3. `src/god-agent/universal/write-pipeline-orchestrator.ts`
Add three new private methods + modify `write()` entry point:

**`allocateChunksToSections(subsections, chunks, sharedPoolSize)`**
- Uses existing `assignSourcesToSections()` for term-overlap scoring
- Top N chunks by relevance → shared pool (every section gets these)
- Remaining chunks → best-matching section (up to `maxChunksPerSection` each)
- Sections with < 3 chunks get supplemented from global pool
- **Amendment**: Shared pool filtered per-section by citation tracker — chunks whose author has ≥3 citations are deprioritized (evicted from that section's view)

**`extractSectionStats(content)`**
- Reuses citation/quotation regexes from `investigateV1()`
- Returns: `{ wordCount, citationCount, quotationCount, citedAuthors: string[] }`

**`writeRollingContext(topic, options, retrievalState)`** — the core loop:
- Initializes `RollingContextState` (generated sections, citation tracker)
- Loops over subsections, calling `buildRollingContextSectionPrompt()` + `generateViaClaudeCode()` per section
- Sliding window: last 2 sections for context
- After each section: extract stats, update citation tracker, generate 50-word Haiku summary (async)
- Shared pool filtered by citation tracker before each section's chunk assembly
- Trailing hook constraint injected for all non-conclusion sections
- Conclusion: hybrid context (full N-1 + N-2 text, Haiku summaries for earlier sections)
- After loop: concatenates sections, runs full post-processing pipeline
- Returns `WriteResult` with `rollingContext` diagnostics

**Entry point modification** (~line 1837):
```typescript
if (options.multiStep && options.rollingContext) {
  // v1 single-shot → investigate → v2 rolling context
  // Run v1 + investigation as today, then branch to rolling for v2
} else if (options.rollingContext) {
  // Direct rolling context (no v1 investigation)
}
```
Both paths call `writeRollingContext()` — the difference is whether a prevention plan exists.

### 4. `src/god-agent/universal/cli.ts`
- Parse `--rolling-context` flag (~line 1452)
- Pass `rollingContext: true` to `agent.write()` options

### 5. `src/god-agent/observability/express-server.ts`
- `buildGodWriteCliArgs()` (~line 3248): Add `if (flags.rollingContext) args.push('--rolling-context');`

### 6. `src/god-agent/observability/dashboard/index.html`
- Add "Rolling Context" toggle checkbox in the pipeline flags section (near whitelist/multi-step)

### 7. `src/god-agent/observability/dashboard/app.js`
- Add `rollingContext: checked('flag-rolling-context')` to `getGodWriteFlags()`
- Update Gold Standard preset: add `'rolling-context': true`

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Custom per-section prompt vs reusing `buildGoldStandardPrompt` | Custom `buildRollingContextSectionPrompt()` | Gold standard prompt is shaped for whole-document gen (all sections, global word target, validation appendix). Per-section needs different shape. Reuses chunk block builder and style/constraint blocks. |
| Chunk allocation | Hybrid: shared pool + section-specific | Avoids prompt bloat (28 chunks per section would repeat whole-doc approach). ~10-13 chunks per section keeps prompt tight. |
| v1→investigate→v2 scope | v1 global, investigation global, v2 per-section rolling | Need whole v1 draft to detect cross-section patterns. Prevention plan applies globally to all v2 section prompts. |
| Context window | Last 2 sections full text + Haiku summaries for earlier (conclusion only) | 2 sections ≈ 1,400 words ≈ 1,800 tokens. Conclusion gets full N-1/N-2 text + 50-word summaries of 1..N-3 — forces synthesis over copy-paste. |
| Trailing hook | Forward-looking bridge to next section heading | Prevents "mini-essay" effect where each section wraps up independently. Zero-cost prompt constraint. |
| Shared pool filtering | Deprioritize chunks after author hits 3 citations | Belt-and-suspenders source diversity: controls what model *sees*, not just what it's *told*. |
| Where code lives | New methods on `WritePipelineOrchestrator` | Follows established pattern. No new classes needed. |
| Post-processing | Runs once on concatenated output | Consistent with existing pipeline. Endnotes, citation enforcement, gauntlet all need full document context. |

## Prompt Size Budget (per-section call)

| Component | Estimated chars |
|-----------|----------------|
| Role + style profile | ~1,500 |
| Global outline (8 headings) | ~500 |
| Current task + constraints | ~2,500 |
| Corpus chunks (8-10 trimmed chunks) | ~4,000 |
| KUs + edges | ~1,500 |
| Prior sections (2 × ~700 words) | ~3,500 |
| Trailing hook constraint | ~150 |
| Citation tracker | ~300 |
| **Total (body sections)** | **~13,950 chars (~3,500 tokens input)** |
| **Total (conclusion, with summaries)** | **~12,500 chars** (summaries replace raw text for early sections) |

vs current whole-doc prompt: ~26,000-35,000 chars (~7,000-9,000 tokens). Dramatically smaller.

## Flag Composition

| Flag Combo | Behavior |
|---|---|
| `--whitelist --rolling-context` | Global retrieval → direct rolling context (no v1 investigation) |
| `--whitelist --rolling-context --multi-step` | Global retrieval → v1 single-shot → investigate → v2 rolling with prevention plan |
| `--rolling-context` (no `--whitelist`) | Error: rolling context requires whitelist mode |

## Verification

1. **Unit tests** (`tests/god-agent/universal/rolling-context-prompt.test.ts`):
   - `buildRollingContextSectionPrompt` includes outline, prior text, citation tracker
   - Conclusion variant includes all prior sections
   - Chunk block is section-specific
   - Prevention plan injected when present

2. **Unit tests** for `allocateChunksToSections` and `extractSectionStats`

3. **Integration test** (mock `generateViaClaudeCode`):
   - Loop runs 8 times, citation tracker accumulates, rolling window grows
   - Final output is concatenation with headings
   - Post-processing runs once on full text

4. **E2E smoke test**:
   ```bash
   npx tsx cli.ts write "Topic\n1. Section A\n2. Section B\n3. Conclusion" \
     --execute --whitelist --rolling-context --multi-step --enable-endnotes \
     --word-target "2,000" --use-corpus --corpus-collections rhetorical_ontology
   ```

5. **Comparison test**: Run dual-trace topic with `--rolling-context` vs v5/v6, compare metrics

## Amendments (v2, 2026-03-19)

| # | Amendment | Source | Impact |
|---|-----------|--------|--------|
| A1 | **Hybrid conclusion context**: Full text of N-1 + N-2, Haiku 50-word summaries of 1..N-3 | User critique #1 | Forces conclusion into synthesis mode; prevents lazy copy-paste from early sections |
| A2 | **Trailing hook enforcement**: "End with a forward-looking sentence bridging into '{nextSectionHeading}'" | User critique #2 | Eliminates mini-essay effect; zero-cost prompt constraint |
| A3 | **Monolithic v1 retained** (no interstitial investigation) | User critique #3 — accepted original design | Cross-section pattern detection (source imbalance, hallucination clustering) requires global scope |
| A4 | **Shared pool citation filtering**: Deprioritize chunks after author reaches 3 citations | User critique #4 | Programmatic source diversity enforcement at chunk-selection level |

All amendments unanimously agreed. Original plan updated in-place above.
