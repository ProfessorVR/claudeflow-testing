# Writing System Code Review — Living Plan

**Date:** 2026-03-07
**Last Updated:** 2026-03-07 (refined after owner feedback)
**Status:** Pending execution — awaiting prioritization decision
**Branch:** god-agent-v2-pr
**Backup:** `tmp/writing_system_gold-standard-v2/`

---

## System Overview

A typical `--whitelist --multi-step --execute` run flows: CLI (`cli.ts`) parses flags, loads `.env`, instantiates `UniversalAgent`, and delegates to `WritePipelineOrchestrator.write()`. In whitelist mode, the orchestrator performs multi-query semantic retrieval via `SmartRetrievalLayer` (embedding API + ChromaDB), supplements under-represented primary authors with targeted queries, enforces source diversity, trims chunks to ~450 chars, and reorders for attention (highest relevance at prompt edges). A `CorpusConstraint` is built from retrieved chunks + full manifest.

With `--multi-step`, the orchestrator generates a v1 draft without style injection via Claude Code CLI (falling back to Anthropic messages API). It runs `investigateV1()` — a zero-cost local string analysis detecting hallucinated citations, phantom quotations, uncited claims, source balance issues, and short sections — producing a prevention plan. Supplemental retrieval fills gaps. A v2 prompt is assembled via `buildGoldStandardPrompt()` with style profile + prevention plan + section constraints, sent through generation again.

Post-generation executes: prose sanitization → quality gauntlet (scoring-only, revisions disabled) → citation enforcement (auto-correct, removing invalid citations) → second sanitization → non-corpus author scrubbing → optional staged composition → endnotes → source verification. The final `WriteResult` carries diagnostics from every stage.

---

## Issue Table

| # | Severity | Area | Issue | Why it matters | Suggested change | Status |
|---|----------|------|-------|---------------|-----------------|--------|
| 1 | Critical | orchestrator | **3,083-line God Object** — Retrieval, prompt building, LLM generation (2 backends), investigation, coverage validation, corpus formatting, citation enforcement, author scrubbing, endnotes, and result assembly all in one class. | Any change risks breaking others. Testing individual stages is impossible. The `write()` method is ~1,500 lines of sequential logic with deep nesting. | Extract into `RetrievalOrchestrator`, `PromptAssembler`, `PostGenerationPipeline`, `MultiStepDrafter`. The `write()` method becomes a thin pipeline coordinator. | ⬜ |
| 2 | Critical | orchestrator | **Hardcoded author/concept regex patterns** — `extractRetrievalQueries()`, `extractPrimaryAuthors()`, `extractKeyAuthors()`, `buildSectionConstraints()` all have hardcoded philosopher names (Aristotle, Heidegger, etc.) duplicated across 5 methods. | System only works for one dissertation's domain. Adding a new corpus requires modifying 5+ regex patterns. | Extract a `DomainVocabulary` config loaded from JSON, referenced by all methods. | ⬜ |
| 3 | Critical | retrieval | **Hardcoded ChromaDB collection UUID** — `collectionId: '256473d0-...'` in SmartRetrievalLayer. | If collection is recreated (new UUID), retrieval silently returns zero results. Operational time bomb. | Resolve collection ID by name at startup via ChromaDB API. | ⬜ |
| 4 | High | orchestrator | **Duplicate Anthropic API implementations** — `generateViaAnthropicAPI()` in orchestrator and `callAnthropic()` in `ModelRouter` are independent fetch implementations with different timeouts (180s vs 120s), models, and error handling. | Bug fixes must be applied in two places. Inconsistent timeout/retry behavior. | Use `ModelRouter` from the orchestrator. | ⬜ |
| 5 | High | orchestrator | **`write()` mutates its options parameter** — `options = resolved` overwrites caller's view. `options.multiStep = false` mutates a flag mid-execution for flow control. | Unexpected mutation bugs for callers reusing options. Non-obvious side effects. | Deep-clone options at start. Use local booleans for flow control. | ⬜ |
| 6 | High | retrieval | **`getChunkById()`, `getChunksByRange()`, `rerankResults()` are unimplemented stubs** — Return null/empty. `getRelatedChunks()` always fails. `rerank: true` (default) is a no-op. | Public APIs that silently fail. False sense of retrieval quality from "re-ranking" that doesn't exist. | Implement or remove. Change rerank default to `false`. | ⬜ |
| 7 | High | tests | **Retrieval tests don't test retrieval** — All SmartRetrievalLayer tests call live endpoints (which fail), asserting only `Array.isArray(results)`. | Zero actual coverage of retrieval logic. Tests verify error handling, not happy path. | Mock embedding API + ChromaDB with nock/msw. Assert on chunk content, scores, dedup, diversity. | ⬜ |
| 8 | High | multiple | **`console.log` in SmartRetrievalLayer pollutes stdout** — 10+ `console.log` calls. Orchestrator uses `goldLog()`, `deps.log()`, and `process.stderr.write()` interchangeably. | In JSON output mode, console.log to stdout breaks JSON parsing by parent process. | Route all logging through injected `deps.log()` or structured logger. Remove all `console.log`. | ⬜ |
| 9 | High | multiple | **Duplicate `ContextChunk` type definitions** — Defined in `retrieval/types.ts`, `corpus-constraint-builder.ts`, and imported separately with slightly different shapes (`id` vs `chunkId`, optional `clean_text`). | Type mismatches cause `as` casts. New fields don't propagate. | Single canonical `ContextChunk` in `retrieval/types.ts`, imported everywhere. | ⬜ |
| 10 | Medium | orchestrator | **`loadCorpusManifest()` called 3+ times per write** — Each call reads and parses the full JSONL from disk. | Unnecessary I/O per write. Manifest doesn't change during a single write. | Cache at orchestrator level or accept as constructor dependency. | ⬜ |
| 11 | Medium | orchestrator | **Prompt can exceed 60K+ chars with no token check** — `MAX_CHARS = 60000` is corpus block alone. Full prompt adds role, style, constraints, output format. | Token-budget overflows possible with 28+ chunks. Model may truncate response. | Add total token estimate (chars/4), warn or trim if approaching context limit. | ⬜ |
| 12 | Medium | orchestrator | **Magic constants scattered throughout** — `450`, `28`, `8`, `35`, `0.25`, `0.3`, `350`, `60000`, `16384`, `0.4` as inline literals. | Hard to tune. Risk of inconsistent updates. Many tracked as "fixes" in memory docs but values live inline. | Consolidate into a named `GoldStandardConfig` object with documented defaults. | ⬜ |
| 13 | Medium | model-router | **Backend availability cached permanently** — Once `availableBackends` is set, never refreshes unless `resetBackendCache()` called explicitly. | vLLM coming online after first check remains invisible for process lifetime. | Add TTL to backend cache (re-check every 5 min). | ⬜ |
| 14 | Medium | quality | **Quality gauntlet mutates shared state** — `updateConfig()` on gauntlet/orchestrator called per-request inside `validateAndRevise()`. Objects shared across all write calls. | Concurrent writes with different thresholds clobber each other's config. | Define immutable base config; pass `{ ...baseConfig, ...requestOverrides }` as frozen object to `gauntlet.run()` — no mutation, cheaper than cloning instances. | ⬜ |
| 15 | Medium | cli | **`.env` loading uses string length heuristic** — `process.env[key].length < val.length` applies globally to all env vars. | Legitimate shorter env vars get overwritten. Designed for one bug (truncated API key) but applies broadly. | Use dotenv, or apply length heuristic only to `ANTHROPIC_API_KEY`. | ⬜ |
| 16 | Medium | author-scrubber | **Sentence splitting destroys paragraph structure** — `content.split(/(?<=[.!?])\s+/)` then rejoin with single spaces. | Output loses all paragraph formatting when any sentences are removed. | Track and preserve paragraph boundaries (double newlines) during scrubbing. | ⬜ |
| 17 | Medium | orchestrator | **`investigateV1()` uses `mainText.indexOf(sentence)` for citation window** — Always returns first occurrence if sentence appears twice. | Citation detection may check wrong location for duplicate sentences. | Use actual index from split iteration. | ⬜ |
| 18 | Low | faceted-retrieval | **`hybridSearch()` argument count mismatch** — FacetedRetrieval passes 4 args, SmartRetrievalLayer accepts 3. | TypeScript error or silently ignored 4th argument. | Align signatures. | ⬜ |
| 19 | Low | retrieval | **Cache key uses `JSON.stringify(options)`** — Object key order not guaranteed. | Equivalent option objects with different key order cause cache misses. | Sort keys before stringifying. | ⬜ |
| 20 | Low | orchestrator | **`generateMockAcademicContent()` is dead code** — 47 lines only called with testing flag. | Bloat in already oversized file. | Move to test helper file. | ⬜ |
| 21 | Low | prompt-builder | **Quotation strictness controls sourcing rules** — `sourcingRules[strictness.quotation]` instead of separate dimension. | Tightening quotation strictness unexpectedly tightens sourcing. Violates orthogonality. | Use dedicated strictness dimension. | ⬜ |

---

## Systemic Patterns

**Defensive degradation with no failure observability.** Nearly every stage is wrapped in `try { ... } catch { log; continue }`. A broken embedding service, misconfigured ChromaDB, or corrupt manifest all produce the same symptom: empty results propagating silently. No failure accumulator, no structured error reporting in `WriteResult`, no way to distinguish "clean run with zero hits" from "embedding service was down."

**Hardcoded domain knowledge.** Author names and concepts baked into 5+ regex patterns across the orchestrator, section constraints, retrieval query extraction, and keyword builders. Single-dissertation tool, not a general engine.

**Duplicate implementations of same capability.** Anthropic API called via native fetch in 3 places. Chunk deduplication logic in 4 locations. Corpus constraint building happens twice per write. Each copy has slightly different behavior.

**Tests verify error paths, not success paths.** Retrieval tests assert only that errors produce empty arrays. The investigateV1 tests are the exception with genuine behavioral assertions. Rest provides false confidence.

**Configuration by scattered magic constants.** Tunable values hardcoded as literals throughout multi-thousand-line files with no centralized view.

---

## Top 5 Architectural Improvements (Refined)

1. **Decompose `write()` into 3 lifecycle-phase stages + utility functions**
   - `RetrievalStage` — multi-query retrieval, chunk trimming, diversity enforcement, coverage checks, CorpusConstraint building.
   - `DraftingStage` — v1 generation, investigateV1(), prevention plan, v2 prompt assembly via buildGoldStandardPrompt(), v2 generation.
   - `ValidationStage` — quality gauntlet, citation enforcement, prose sanitization, author scrubbing, appendix handling.
   - Pure standalone helpers (not classes) for: chunk deduplication, token budget estimation, chunk trimming, attention reordering.
   - The orchestrator's `write()` becomes a thin coordinator (~200 lines) wiring stages together.
   - **Why this grouping over 4+ classes:** Avoids over-fragmentation. PromptAssembler and MultiStepDrafter would share massive implicit context (chunks, prevention plan, style, section constraints). The 3-stage split follows natural data-flow boundaries: retrieval → drafting → validation.

2. **Externalize domain vocabulary into minimal DomainConfig**
   - Config file (`.god-agent/domain-config.json`):
     ```json
     {
       "primaryAuthors": ["Aristotle", "Heidegger"],
       "secondaryAuthors": ["Frede", "Caston", "Papachristou", ...],
       "keyConcepts": ["kinesis", "chronos", "phantasia", ...]
     }
     ```
   - Generic behavioral heuristics stay in code (e.g., "if author is named in section heading, treat as primary for that section") — these are logic, not domain data.
   - **Why minimal:** A full config DSL encoding all patterns would be harder to debug than the hardcoded regexes. This handles the real failure mode (adding a new corpus) without over-engineering.

3. **Unify LLM calls through `ModelRouter`** — All calls (orchestrator generation, inline validation, v1 diagnostics) route through one place. Centralizes retry logic, timeouts, cost tracking, backend fallback.

4. **Introduce 3-tier PipelineContext for error observability**
   - Three levels: `hardFailure` (pipeline must abort), `degradedMode` (fell back, produced output), `softWarning` (non-critical).
   - Only use try/catch-and-continue where a fallback is explicitly acceptable — record it as `degradedMode`.
   - `WriteResult` gets a top-level `pipelineHealth: 'clean' | 'degraded' | 'failed'` field derived from the worst-level entry.
   - **Why 3-tier over flat accumulator:** Consumers can branch on `pipelineHealth` without inspecting individual warnings. Explicitly recording fallbacks prevents the current "zero hits vs upstream failure" ambiguity.

5. **Create genuine integration tests with mocked services** — Mock embedding API, ChromaDB, and Anthropic with deterministic responses (nock/msw). Test the full pipeline end-to-end with known inputs producing verifiable outputs.

### Additional Improvement (added from feedback)

6. **Explicit token-budget planner** (Medium-High)
   - A function: `estimateTokenBudget(chunks, stylePrompt, constraints) → { inputTokens, suggestedMaxOutput, warning? }`
   - Formalizes the ad-hoc `MAX_CHARS = 60000` and `16384` maxTokens constants.
   - Called before generation; warns or trims if approaching context limit.
   - Replaces scattered char-counting with centralized budget management.

---

## Top 5 Actions to Take Next

1. Extract `write()` into 3 lifecycle stages (`RetrievalStage`, `DraftingStage`, `ValidationStage`) + pure utility functions, reducing the orchestrator to a ~200-line coordinator.
2. Replace the hardcoded ChromaDB collection UUID with a name-based lookup at startup.
3. Route all `console.log` in `SmartRetrievalLayer` through the structured logger to prevent stdout corruption in JSON mode.
4. Consolidate the three independent Anthropic API fetch implementations into `ModelRouter`.
5. Write mock-based integration tests for `investigateV1()` + `buildGoldStandardPrompt()` + post-generation validation with deterministic chunk data.

---

## Execution Log

_Update this section as fixes are implemented._

| Date | Issue # | Action Taken | Result |
|------|---------|-------------|--------|
| — | — | — | — |
