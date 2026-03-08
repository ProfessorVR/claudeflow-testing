# Writing System Refactoring Plan — v2 Pipeline

**Date:** 2026-03-07
**Status:** Approved — awaiting execution
**Parent:** `plans/writing-system-code-review.md` (issue table + architectural improvements)
**Backup:** `tmp/writing_system_gold-standard-v2/`
**Branch:** `writing-pipeline-v2` (to be created from `god-agent-v2-pr`)

---

## Global Safety Net

### Feature flag

- Config: `WRITING_PIPELINE_VERSION=legacy|v2`
- Available as BOTH env variable AND CLI flag (`--pipeline-version v2`)
- CLI flag overrides env var (enables A/B testing in same session)
- In `WritePipelineOrchestrator.write()`:
  - `legacy` → current monolithic code path
  - `v2` → new staged pipeline
- Default: `legacy` until v2 is fully validated

### Branching and checkpoints

- Work in long-lived branch: `writing-pipeline-v2`
- Existing backup: `tmp/writing_system_gold-standard-v2/` (canonical snapshot of last "good" state)
- After each major step: `git tag writing-pipeline-v2-stepN`
- Rollback: `git reset --hard writing-pipeline-v2-stepN` to any stable point

---

## Phase 1 — Low-Risk, Contained Fixes

### Step 1: ChromaDB collection + logging

**ChromaDB name-based resolution (Issue #3)**
- Add config: `CHROMA_COLLECTION_NAME` and optionally `CHROMA_COLLECTION_ID` (env or JSON)
- On `SmartRetrievalLayer` initialization:
  - Try name-based lookup via ChromaDB API
  - If UUID is also configured, verify it matches the name-resolved UUID
  - If both are present and **disagree**, `hardFailure` with clear error ("Collection name X resolved to UUID Y, but config specifies UUID Z — update config or verify corpus")
  - If name lookup fails but UUID is configured, use UUID with `degradedMode` warning
  - If neither resolves, `hardFailure` and abort
- **Rollback:** revert this file + config; flip flag to `legacy`

**Unified logging (Issue #8)**
- Define interface `Logger` with `info/warn/error`
- Inject `Logger` into `SmartRetrievalLayer`, `WritePipelineOrchestrator`, key modules
- Replace ALL `console.log` and direct `process.stderr.write` with `logger.*`
- Manual verification: run in `--json` mode, confirm no stdout pollution
- **Rollback:** revert logging changes only; legacy path unaffected

### Step 2: Env handling + smoke test

**Fix .env loading heuristic (Issue #15)**
- Replace global `length <` heuristic with standard `dotenv` loading
- If guard still needed, apply ONLY to `ANTHROPIC_API_KEY`
- **Rollback:** revert `cli.ts` env logic

**Integration smoke test (for rollback confidence)**
- Add a test script that:
  - Runs `god-write` with `WRITING_PIPELINE_VERSION=legacy`
  - Runs `god-write` with `WRITING_PIPELINE_VERSION=v2` (after Phase 2)
  - Compares: non-empty output, no hard failures, citation pass rate, word count range
- This becomes the quick sanity check before/after each phase
- **Rollback:** tests don't affect runtime

---

## Phase 2 — Orchestrator Decomposition (Behind the Flag)

### Step 3: Introduce stages without removing legacy logic

**Define stage I/O contracts FIRST**

Before copying any code, define the input/output types:

```typescript
// Stage contracts
interface RetrievalResult {
  chunks: ContextChunk[];
  corpusConstraint: CorpusConstraint | null;
  corpusContextInfo: CorpusContextInfo;
  primaryAuthors: string[];
  knowledgeUnits: string[];
  stylePrompt: string;
}

interface DraftingResult {
  content: string;
  multiStepDiagnostics: MultiStepDiagnostics | null;
  preventionPlan: PreventionPlan | null;
  sectionConstraints: string[];
}

interface ValidationResult {
  content: string;            // post-validated content
  qualityScore: number;
  citationEnforcement: CitationEnforcementResult | null;
  proseSanitization: SanitizationResult | null;
  bodyWordCount: number;
  pipelineHealth: 'clean' | 'degraded' | 'failed';
}
```

This forces identification of cross-stage data dependencies upfront and may adjust grouping.

**Create stage modules**
- `src/god-agent/universal/stages/RetrievalStage.ts`
- `src/god-agent/universal/stages/DraftingStage.ts`
- `src/god-agent/universal/stages/ValidationStage.ts`
- `src/god-agent/universal/stages/pipeline-utils.ts` (chunk dedup, trimming, token estimation, attention reorder)

Copy existing logic from `WritePipelineOrchestrator.write()` into these modules, preserving exact behavior:
- `RetrievalStage`: multi-query retrieval, primary-author supplementation, trimming, diversity, CorpusConstraint build
- `DraftingStage`: v1 generation, investigateV1, prevention plan, v2 prompt build + generation
- `ValidationStage`: gauntlet, citation enforcement, prose sanitization, author scrubber, appendix

**Wire v2 path**

In `WritePipelineOrchestrator.write()`:
```typescript
if (pipelineVersion === 'v2') {
  const retrieval = await RetrievalStage.run(topic, options, ctx);
  const drafting = await DraftingStage.run(retrieval, options, ctx);
  const validation = await ValidationStage.run(drafting, options, ctx);
  return assembleWriteResult(retrieval, drafting, validation, ctx);
} else {
  // existing monolithic logic unchanged
}
```

- Run smoke test; if anything looks off, flip flag to `legacy`
- **Rollback:** set `WRITING_PIPELINE_VERSION=legacy` or revert stage wiring; legacy body still present

### Step 4: Slim the orchestrator

Once v2 path is stable:
- Remove the legacy `write()` body from the orchestrator (it's preserved in git tags + backup directory — no separate `.legacy.ts` file needed)
- Replace main `write()` with the thin coordinator (~200 lines)
- Keep the feature flag for one more release cycle pointing to the same v2 code (flag removal is a future cleanup)
- **Rollback:** `git reset --hard writing-pipeline-v2-step3` restores legacy body

---

## Phase 3 — DomainConfig, Shared Types, and Token Budget

### Step 5: DomainConfig for authors/concepts (Issue #2)

**Create DomainConfig**
- File: `.god-agent/domain-config.json`
  ```json
  {
    "primaryAuthors": ["Aristotle", "Heidegger"],
    "secondaryAuthors": ["Frede", "Caston", "Papachristou", "Nussbaum", "O'Gorman", "Hawhee", "Rickert", "Burke", "White", "Gonzalez", "Bowin"],
    "keyConcepts": ["kinesis", "chronos", "phantasia", "aisthesis", "energeia", "dunamis"]
  }
  ```
- `DomainConfigLoader`:
  - Reads JSON at startup
  - Exposes `getPrimaryAuthors()`, `getSecondaryAuthors()`, `getKeyConcepts()`
  - If JSON fails to load → use `DEFAULT_DOMAIN_CONFIG` constant (same data, inline in loader module)
  - Fallback is STILL a DomainConfig object flowing through the same code path — no branching between "config mode" and "legacy regex mode"
  - Log `degradedMode` warning on fallback

**Update consumers:**
- `extractRetrievalQueries()`
- `extractPrimaryAuthors()`
- `extractKeyAuthors()`
- `buildSectionConstraints()`
- All build regex from `DomainConfig` arrays instead of hardcoded patterns
- Generic heuristics stay in code (e.g., "if author named in heading → treat as primary for that section")
- **Rollback:** revert DomainConfig usage, restore hardcoded lists

### Step 6: Unify types, constants, and token budget (Issues #9, #12, review improvement #6)

**Canonical ContextChunk (Issue #9)**
- Single definition in `retrieval/types.ts`
- Update all consumers: `corpus-constraint-builder.ts`, stages, inline-validation, etc.
- Remove duplicate definitions and `as` casts

**GoldStandardConfig (Issue #12)**
- Central config object for magic numbers:
  ```typescript
  const GOLD_STANDARD_CONFIG = {
    chunkTrimTarget: 450,
    targetChunks: 28,
    maxChunksPerSource: 8,
    targetTotalChunks: 35,
    relevanceFloor: 0.25,
    primaryRatioThreshold: 0.3,
    minSectionWords: 350,
    maxCorpusBlockChars: 60000,
    overCitationThreshold: 0.4,
    opusMaxTokens: 16384,
  };
  ```
- Replace inline literals with `GOLD_STANDARD_CONFIG.*`

**Token budget planner (Architectural improvement #6)**
- Add to `pipeline-utils.ts`:
  ```typescript
  function estimateTokenBudget(chunks, stylePrompt, constraints) →
    { inputTokens, suggestedMaxOutput, overBudget: boolean }
  ```
- Call in `DraftingStage` before generation
- If `overBudget`: trim chunks from middle (lowest relevance) until within budget
- Replaces scattered char-counting with centralized budget management

- **Rollback:** revert type imports and config usage to previous literals

---

## Phase 4 — LLM Routing and Error Observability

### Step 7: Unify Anthropic calls via ModelRouter (Issue #4)

**Add `generateText()` convenience method to ModelRouter**
- Wraps the single-user-message pattern so callers don't construct `[{ role: 'user', content }]`
- Signature: `ModelRouter.generateText(prompt, { model, maxTokens, timeout }) → string`

**Centralize all LLM calls**
- Update orchestrator/DraftingStage generation to use `ModelRouter.generateText()`
- Update any inline validation or diagnostic LLM calls
- Remove or deprecate `generateViaAnthropicAPI()` (direct fetch)
- Default v2 path to use ModelRouter; legacy path unchanged for one cycle

**Fix backend cache TTL (Issue #13)**
- Add 5-minute TTL to `availableBackends` cache in ModelRouter
- If vLLM comes online after initial check, it becomes available on next TTL expiry

- **Rollback:** switch v2 path back to direct calls, or `WRITING_PIPELINE_VERSION=legacy`

### Step 8: PipelineContext + pipelineHealth + gauntlet config (Issues #14, architectural improvement #4)

**PipelineContext**
- Object passed through all stages:
  ```typescript
  interface PipelineContext {
    hardFailures: PipelineEvent[];
    degradedEvents: PipelineEvent[];
    warnings: PipelineEvent[];
  }
  ```
- Replace generic `try/catch { log; continue }`:
  - Non-recoverable error → push to `hardFailures`, abort
  - Tolerated fallback → push to `degradedEvents`, continue
  - Minor issues → push to `warnings`

**Expose pipelineHealth in WriteResult**
- Compute: `clean` (no entries) | `degraded` (any degradedEvents) | `failed` (any hardFailures)
- Return in `WriteResult`, propagate to CLI JSON output
- Consumers can branch on `pipelineHealth` without inspecting individual warnings

**Quality gauntlet immutable config (Issue #14)**
- Define `BASE_GAUNTLET_CONFIG` as immutable constant
- Pass `Object.freeze({ ...BASE_GAUNTLET_CONFIG, ...requestOverrides })` to `gauntlet.run()`
- No mutation of shared state

- **Rollback:** stages treat PipelineContext as optional, fall back to current logging; legacy unaffected

---

## Phase 5 — Tests and Polish

### Step 9: Real integration tests

**Mocked integration tests**
- Using nock/msw, mock: embedding API, ChromaDB, Anthropic/LLM
- End-to-end tests under v2 flag:
  - Feed known chunks with deterministic mock responses
  - Run `RetrievalStage → DraftingStage → ValidationStage`
  - Assert: citation count, hallucinated authors absent, section headings present, word count ranges, `pipelineHealth`

**Golden-output regression test**
- Run full pipeline with fixed prompt + fixed mock chunks
- Capture output once as golden file in test directory
- Future runs assert same output
- Golden file updated deliberately when prompt changes are made

- **Rollback:** tests don't affect runtime

### Step 10: Clean up low-severity items

Address remaining issues from the code review:

| Issue # | Fix |
|---------|-----|
| #5 | Deep-clone options at start of `write()`, use local booleans for flow control |
| #6 | Implement or remove retrieval stubs (`getChunkById`, `rerankResults`); set `rerank` default to `false` |
| #10 | Cache `loadCorpusManifest()` result at orchestrator level |
| #16 | Preserve paragraph boundaries in author-scrubber (track double-newlines during scrub) |
| #17 | Fix `investigateV1()` `indexOf` issue — use actual split index |
| #18 | Align `hybridSearch()` signatures between FacetedRetrieval and SmartRetrievalLayer |
| #19 | Sort keys before `JSON.stringify` in cache key construction |
| #20 | Move `generateMockAcademicContent()` to test helpers |
| #21 | Use dedicated strictness dimension for sourcing rules in prompt-builder |

- **Rollback:** all local changes; revert individual files if regression

---

## Execution Log

_Update this section as fixes are implemented._

| Date | Phase.Step | Action Taken | Tag | Result |
|------|-----------|-------------|-----|--------|
| 2026-03-07 | 1.1-1.2 | ChromaDB name-based resolution + unified Logger + .env fix | `writing-pipeline-v2-step1` | 61/62 pass (1 pre-existing) |
| 2026-03-07 | 2.3 | Stage types, PipelineContext, writeV2() method, CLI flag | `writing-pipeline-v2-step3` | 0 TS errors in modified files |
| 2026-03-07 | 3.5-3.6 | DomainConfig + GoldStandardConfig + ContextChunk unification | `writing-pipeline-v2-step6` | 17/17 corpus-constraint-builder pass |
| 2026-03-07 | 4.7-4.8 | ModelRouter generateText() + TTL + gauntlet config safety | `writing-pipeline-v2-step8` | 27/27 model-router pass |
| 2026-03-07 | 5.10 | Options clone, manifest cache, indexOf fix, cache keys, rerank default | `writing-pipeline-v2-step10` | 105/106 pass (1 pre-existing) |
| 2026-03-07 | 5.9 | Integration tests (17 tests) | `writing-pipeline-v2-step9` | 17/17 pass |

---

## Issue Coverage Matrix

All 21 issues from the code review mapped to refactoring steps:

| Issue # | Severity | Covered in | Notes |
|---------|----------|-----------|-------|
| 1 | Critical | Phase 2 (Steps 3-4) | Orchestrator decomposition |
| 2 | Critical | Phase 3 (Step 5) | DomainConfig |
| 3 | Critical | Phase 1 (Step 1) | ChromaDB name resolution |
| 4 | High | Phase 4 (Step 7) | ModelRouter unification |
| 5 | High | Phase 5 (Step 10) | Options clone + local booleans |
| 6 | High | Phase 5 (Step 10) | Remove/implement stubs |
| 7 | High | Phase 5 (Step 9) | Mock-based integration tests |
| 8 | High | Phase 1 (Step 1) | Logging unification |
| 9 | High | Phase 3 (Step 6) | Canonical ContextChunk |
| 10 | Medium | Phase 5 (Step 10) | Cache manifest |
| 11 | Medium | Phase 3 (Step 6) | Token budget planner |
| 12 | Medium | Phase 3 (Step 6) | GoldStandardConfig |
| 13 | Medium | Phase 4 (Step 7) | Backend cache TTL |
| 14 | Medium | Phase 4 (Step 8) | Gauntlet immutable config |
| 15 | Medium | Phase 1 (Step 2) | dotenv fix |
| 16 | Medium | Phase 5 (Step 10) | Author scrubber paragraphs |
| 17 | Medium | Phase 5 (Step 10) | investigateV1 indexOf fix |
| 18 | Low | Phase 5 (Step 10) | hybridSearch signature |
| 19 | Low | Phase 5 (Step 10) | Cache key sort |
| 20 | Low | Phase 5 (Step 10) | Dead code removal |
| 21 | Low | Phase 5 (Step 10) | Prompt-builder strictness |
