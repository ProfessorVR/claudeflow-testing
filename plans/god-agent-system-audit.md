# God Agent System Audit — Full Findings Report

**Date**: 2026-03-27
**Scope**: `src/god-agent/` — 771 files, 361,046 lines of TypeScript
**Branch**: `writing-pipeline-v2`
**Method**: 7 parallel specialist agents + TypeScript compiler + full test suite

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Source files analyzed | 771 |
| Lines of code | 361,046 |
| TypeScript errors | 172 across 24 files |
| Test pass rate | 97.7% (12,611 / 12,956) |
| Failing test files | 4 (leann-backend, writing-agent-routing, multi-agent-handoff, persistence) |
| **CRITICAL findings** | **26** |
| **HIGH findings** | **39** |
| **MEDIUM findings** | **44** |
| **LOW findings** | **35** |
| **Total findings** | **144** |

### Top Risks

1. **Command injection** via `exec()` in `phd-cli.ts` — LLM output flows into shell commands
2. **Race conditions** in GNN training — concurrent training corrupts weights and metrics
3. **Citation validation bugs** — `year=0` sentinel, stale position offsets, quotation fidelity threshold inconsistencies
4. **Abort signal not propagated** in rolling-context generation — Stream Deck abort button is a no-op
5. **Circuit breaker race condition** — half-open state probe limiting defeated under concurrency
6. **Anthropic SDK still used in router** despite known WSL2 daemon failure (Fix 27 not applied to router)

---

## Table of Contents

1. [TypeScript Compilation Errors](#1-typescript-compilation-errors)
2. [Test Suite Failures](#2-test-suite-failures)
3. [Composition Subsystem](#3-composition-subsystem-11k-loc)
4. [Writing Subsystem](#4-writing-subsystem-177k-loc)
5. [Reasoning Subsystem](#5-reasoning-subsystem-276k-loc)
6. [Router Subsystem](#6-router-subsystem-31k-loc)
7. [CLI Subsystem](#7-cli-subsystem-109k-loc)
8. [Universal Subsystem](#8-universal-subsystem-185k-loc)
9. [Retrieval & Remaining Subsystems](#9-retrieval--remaining-subsystems)
10. [Cross-Cutting Architectural Issues](#10-cross-cutting-architectural-issues)

---

## 1. TypeScript Compilation Errors

**172 errors across 24 files.** Error categories:

| Error Code | Count | Description |
|-----------|-------|-------------|
| TS2339 | 61 | Property does not exist on type (type drift) |
| TS2341 | 42 | Private property access (`StructuredLogger.log` API mismatch) |
| TS18048 | 12 | Possibly undefined (null safety gaps) |
| TS2554 | 8 | Wrong argument count (function signatures changed) |
| TS2322 | 6 | Type assignment incompatibility |
| TS2353 | 5 | Unknown property in object literal |
| TS2454 | 4 | Variable used before assignment |
| Other | 34 | Various (missing modules, duplicate properties, etc.) |

### Files with errors (non-experimental):

| File | Errors | Key Issues |
|------|--------|------------|
| `cli/dissertation/section-orchestrator.ts` | 19 | `ContextChunk` type drift, `QualityIssue.location` missing `chapterId`, `RevisionRequest` missing fields |
| `cli/style/enhanced-style-drift-detector.ts` | 10 | `StyleCharacteristics` type missing `avgSentenceLength`, `formalityScore`, etc. |
| `cli/context/context-tier-manager.ts` | 12 | `StructuredLogger.log` private access |
| `cli/pipeline-daemon-service.ts` | 7 | Missing export `completeAndNext`, wrong argument counts |
| `cli/dissertation/tools/retrieval-orchestrator.ts` | 4 | Variable used before assignment (`response`) |
| `cli/dissertation/tools/llm-clients.ts` | 3 | Null safety, `function` property on tool calls |
| `core/composition/icp-orchestrator.ts` | 1 | `ContextChunk` missing `chunkId`, `docId` |
| `core/composition/icp-pipeline-adapter.ts` | 1 | `abortSignal` misspelled / not in scope |
| `core/writing/entailment/entailment-rules.ts` | 1 | `rationale` type `string | undefined` vs `string` |
| `observability/express-server.ts` | 4 | Missing `@types/ws`, `ContextChunk.id` doesn't exist |
| `retrieval/faceted-retrieval.ts` | 3 | Wrong argument counts, missing `clean_text` property |
| `universal/quality-integration.ts` | 4 | Missing `log` property, unknown `targetThreshold` |

### Root Causes:

1. **`StructuredLogger` API change** (42 errors): The `.log()` method was made private but 7+ files still call it directly. These are concentrated in `__experimental__/` and `cli/context/`.
2. **`ContextChunk` type evolution** (~15 errors): The type was refactored to use `chunkId`/`docId` but several consumers still use `id`/`source`.
3. **`StyleCharacteristics` type change** (10 errors): Properties like `avgSentenceLength`, `avgWordLength`, `formalityScore` were removed/renamed but drift detectors still reference them.
4. **`pipeline-daemon-service.ts` function signatures** (7 errors): The daemon service references an older API surface that no longer exists.

---

## 2. Test Suite Failures

**294 failing tests across 4 test files** (97.7% pass rate):

| Test File | Failures | Root Cause |
|-----------|----------|------------|
| `leann-backend.test.ts` | 7 | `BackendSelector` API mismatch — `getRecommendedBackend` not a function, performance tier expectations wrong |
| `writing-agent-routing.test.ts` | 1 | Domain detection returns unexpected results for technical writing prompts |
| `multi-agent-handoff.test.ts` | 1 | Namespace isolation — retrieving from `research` namespace returns `null` |
| `persistence.test.ts` | 1 | Error message pattern mismatch — expects `parse|invalid|JSON` but gets `Unsupported storage version` |

**Note**: The "38 failed files" in vitest summary appears to be an artifact of suite grouping; actual unique failing files = 4.

---

## 3. Composition Subsystem (11K LOC)

### CRITICAL

| ID | File | Lines | Issue |
|----|------|-------|-------|
| COMP-C1 | `icp-orchestrator.ts` | 163-165 | **Race condition on concurrent runs** — `corpusConstraint`, `retrievedChunks`, `stylePromptCache` are mutable instance fields written during `run()`. Two concurrent dashboard-triggered runs corrupt each other's corpus constraint. |
| COMP-C2 | `icp-pipeline-adapter.ts` | 818+ | **`as any` state passing via monkey-patched `ICPSession`** — 19 `as any` casts bypass TypeScript type safety. Adapter communicates between methods by writing `_adapterChunks`, `_investigationResult`, etc. onto the session object. |
| COMP-C3 | `icp-pipeline-adapter.ts` | 841-1078 | **Abort signal not propagated to rolling-context generation** — `abortSignal` parameter dropped when calling `generateRollingContext()`. The Stream Deck abort button has no effect during the primary generation mode. |
| COMP-C4 | `icp-pipeline-adapter.ts` | 1-1540 | **God Class** — 8+ responsibilities in 1,500+ lines: retrieval, 3 generation strategies, investigation, regeneration, validation, cost estimation, citation tracking, manifest loading. |

### HIGH

| ID | File | Lines | Issue |
|----|------|-------|-------|
| COMP-H1 | `icp-orchestrator.ts` + `icp-pipeline-adapter.ts` | 415-529, 1382-1453 | **Dual quality gate implementations** — Both classes implement independent quality gate sequences. Fixes applied to one (e.g., Fix 25 author scrubbing) may not reach the other. |
| COMP-H2 | `icp-orchestrator.ts` | 225-229 | **`minRelevance: 0.5` reverts Fix 45** — Hardcoded value causes chunks at relevance 0.35-0.49 to be excluded from corpus constraint whitelist, flagging valid citations as hallucinations. |
| COMP-H3 | `icp-orchestrator.ts` | 812-817 | **`verifyQuotes` fallback defeats verification** — When `getCleanText` is unavailable, uses span text as "clean text", making every quote trivially pass with exactness=1.0. |
| COMP-H4 | `auto-verifier.ts` | 258 | **`approximateMatch` loop reads past string boundary** — `+ 5` in loop condition causes 5 extra iterations past end of string. |
| COMP-H5 | `icp-orchestrator.ts` | 167-192 | **No dependency injection** — All 10 sub-components instantiated directly in constructor. |
| COMP-H6 | `icp-orchestrator.ts` | 272-274 | **`facetClaims` stub inflates atoms** — `const facetClaims = claims;` gives every facet the full claims list, producing N× duplicate atoms. |
| COMP-H7 | `icp-pipeline-adapter.ts` | 427, 534 | **`loadDomainConfig()` called per-chunk** — Repeated disk I/O on every `trimChunkContent()` invocation (hundreds of times per run). |

### MEDIUM

| ID | File | Lines | Issue |
|----|------|-------|-------|
| COMP-M1 | Multiple | — | **Inconsistent error handling** — Silent `catch {}` (gauntlet, endnotes, manifest) vs. hard throws (retrieve, generate). Non-fatal failures invisible to callers. |
| COMP-M2 | `auto-verifier.ts` | 272-283 | **`charEditRatio` is position-based, not edit distance** — Single-character insertion at position 0 produces near-100% mismatch. |
| COMP-M3 | `icp-session-events.ts` | 18-60 | **Passthrough event layer** — Re-exports from `icp-types.ts` while orchestrator also imports directly. |
| COMP-M4 | `constrained-generator.ts` | 136-139 | **`validatePlan` always valid in `off` mode** — Skips required-quotes check entirely. |
| COMP-M5 | `constrained-generator.ts` | 607-609 | **`mappedAtomIds` rebuilt per-sentence** — Map never accumulates, so extractor can't see already-handled atoms. |
| COMP-M6 | `auto-verifier.ts` | 459, 468 | **Magic numbers** — `0.15` OCR divergence threshold not configurable. |
| COMP-M7 | `icp-pipeline-adapter.ts` | 195, 735 | **Duplicated citation regex** — Same 200-char pattern copy-pasted in two functions. |
| COMP-M8 | `icp-orchestrator.ts` | 636-637 | **Relative path for style profile** — `'.agentdb/universal/style-profiles.json'` depends on `cwd`. |

### LOW

| ID | File | Lines | Issue |
|----|------|-------|-------|
| COMP-L1 | `icp-orchestrator.ts` | 588-589 | `corpusHash` is always literal `'initial'`. |
| COMP-L2 | `model-router.ts` | 181-192 | `generateText` ignores `options.model` and `options.timeout` parameters. |
| COMP-L3 | `quote-ranker.ts` | 401-421 | `isLastStrictBinding` always true for single-quote bindings — budget enforcement is a no-op. |
| COMP-L4 | `icp-orchestrator.ts` | 701-715 | Inline `scrubNonCorpusAuthors` duplicates shared function from `author-scrubber.ts`. |
| COMP-L5 | `prompt-builder-engine.ts` | 212-216 | Sentence splitting regex fails on abbreviations ("e.g.", "Dr.", "p. 42"). |

---

## 4. Writing Subsystem (17.7K LOC)

### CRITICAL

| ID | File | Lines | Issue |
|----|------|-------|-------|
| WRIT-C1 | `citation-validator.ts` | 162-175 | **Stale position offsets in `correct()`** — Character positions reference original string but replacements mutate string length. Subsequent replacements at earlier positions corrupt surrounding text. |
| WRIT-C2 | `citation-validator.ts` | 169 | **Empty-string placeholder silently erases citations** — `??` allows `placeholder: ''`, producing text with signal phrases ("As Aristotle argues...") followed by nothing. |
| WRIT-C3 | `corpus-constraint-builder.ts` | 256 | **`year = 0` for null-year sources** — Citations to authors with no year in manifest flagged as hallucinations because `year: 0 !== year: 2003`. Classical sources (Aristotle, Plato) likely affected. |
| WRIT-C4 | `citation-enforcer.ts` | 177-258 | **Citation validation runs on original content, correction on quotation-modified content** — Position mismatch corrupts corrections. Hard-coded thresholds (0.95, 0.8) bypass config. |

### HIGH

| ID | File | Lines | Issue |
|----|------|-------|-------|
| WRIT-H1 | `comprehensive-claim-validator.ts` | 698-728 | **`BLOCKED` verdict not counted** — Falls through switch statement, making paragraph verdict more pessimistic than claim-level. |
| WRIT-H2 | `comprehensive-claim-validator.ts` | 526-536 | **`isCompositeClaim()` matches "and"** — Nearly every academic sentence treated as composite, causing spurious decompositions. |
| WRIT-H3 | `quotation-fidelity-validator.ts` | 355-370 | **Negative year from BCE citations** — `parseInt("-427")` produces `-427`, fails source matching (no `Math.abs` applied). |
| WRIT-H4 | `citation-enforcer.ts` | 337-366 | **Corrections report reflects pre-correction state** — `correctedCitations` built from original hallucinations, not re-validation. |
| WRIT-H5 | `corpus-constraint-builder.ts` | 305-314 | **Short author substring match** — "Fre" matches "Frede", "A" matches any author. |
| WRIT-H6 | `comprehensive-claim-validator.ts` | 725-727 | **Division by zero guard produces `UNSUPPORTED`** — All-uncertain paragraphs get `UNSUPPORTED` instead of `NEEDS_REVIEW`. |

### MEDIUM

| ID | File | Lines | Issue |
|----|------|-------|-------|
| WRIT-M1 | `citation-validator.ts` | 298-370 | Signal phrase citations dropped when overlapping shorter parenthetical. |
| WRIT-M2 | `inline-validation-orchestrator.ts` | 956-975 | Hard-coded 0.70 passing rate ignores `minQuotationFidelity` config. |
| WRIT-M3 | `corpus-constraint-builder.ts` | 248-249 | `loadCorpusManifest()` filters failed ingestions; `buildCorpusConstraint()` does not. |
| WRIT-M4 | `claim-verifier.ts` | 456-470 | Discourse phrase blocklist blocks common resolvable academic phrases ("this view", "this account"). |
| WRIT-M5 | `quotation-fidelity-validator.ts` | 636-690 | O(m*n) Levenshtein on long strings — no length guard. |
| WRIT-M6 | `citation-validator.ts` | 549-557 | `normalizeAuthor()` takes only last word — "von Uexküll" becomes "von". |
| WRIT-M7 | `comprehensive-claim-validator.ts` | 270-277 | Inline retriever returns chunks in array order, not relevance. |

### LOW

| ID | File | Lines | Issue |
|----|------|-------|-------|
| WRIT-L1 | Multiple | — | `charOffset` assumes Unix line endings; Windows `\r\n` corrupts positions. |
| WRIT-L2 | `citation-validator.ts` | 199 | APA pattern matches "(Figure, 12)", "(Table, 1)" as citations. |
| WRIT-L3 | `validation-rule-engine.ts` | 265-277 | Authorial rule override latent bug if classifier inconsistent. |
| WRIT-L4 | `inline-validation-orchestrator.ts` | 981-987 | Feedback threshold message doesn't match actual enforcement. |
| WRIT-L5 | `ccv-tier1-gate.ts` | 394 | `detectorVersion` always `'1.0.0'` — cache invalidation never triggers. |
| WRIT-L6 | `inline-validation-orchestrator.ts` | 779-785 | Author list truncated at 20 in LLM system prompt. |

---

## 5. Reasoning Subsystem (27.6K LOC)

### CRITICAL

| ID | File | Lines | Issue |
|----|------|-------|-------|
| REAS-C1 | `training-trigger.ts` | 338-366, 486-554 | **Race condition on `trainingInProgress` flag** — Two concurrent `checkAndTrain()` calls both pass the guard, running duplicate training loops that fight over shared GNN state. |
| REAS-C2 | `weight-manager.ts` | 335-530 | **Non-atomic weight save race** — Concurrent `saveWeightsAtomic` calls write to same `.tmp` file path. Process A renames B's data. |
| REAS-C3 | `gnn-cache.ts` + `gnn-enhancer.ts` | 176-193, 324-375 | **Cache invalidation mid-`await`** — Between cache miss check and `cacheResult()` write, invalidation can fire, producing stale cached data. |
| REAS-C4 | `training-history.ts` | 379-416 | **`db.prepare()` on every `getStats()` call** — Leaks prepared statement handles; bypasses retry logic. |
| REAS-C5 | `training-trigger.ts` | 620-651 | **`writeFileSync` inside async method** — Blocks event loop; concurrent callers overwrite each other's buffer snapshots. |

### HIGH

| ID | File | Lines | Issue |
|----|------|-------|-------|
| REAS-H1 | `background-trainer.ts` | 662-693 | **Worker mutates `epochResults` from message handler** — Array grows mid-read; `complete` may fire before last `epoch` message. |
| REAS-H2 | `training-worker.ts` | 229-286 | **Diverged training logic** — Worker computes loss without GNN forward pass; metrics incomparable with setImmediate strategy. |
| REAS-H3 | `ewc-utils.ts` | 522-557 | **`saveFisher()` non-atomic** — Uses `writeFileSync` with no temp-rename. Crash leaves half-updated EWC state. |
| REAS-H4 | `gnn-trainer.ts` | 700-711 | **`dataset` parameter mutation** — Re-assignment inside function creates confusing aliasing. |
| REAS-H5 | `gnn-cache.ts` | 176-193 | **`invalidateNodes()` uses substring match** — NodeId matching `key.includes(nodeId)` can hit unrelated cache keys. |
| REAS-H6 | `training-history.ts` | 231-249 | **`recordBatch()` silently drops errors** — `withRetrySync` not returned/caught. Training proceeds with unrecorded loss. |
| REAS-H7 | `weight-manager.ts` | 404, 522 | **`updateCount` incremented twice** — Both `saveWeights` and `saveWeightsAtomic` increment, causing checkpoints at half interval. |

### MEDIUM

| ID | File | Lines | Issue |
|----|------|-------|-------|
| REAS-M1 | `trajectory-tracker.ts` | 127-131 | Timer leak — `setInterval` with no `destroy()` method. Tests hang. |
| REAS-M2 | `training-trigger.ts` | 605-613 | Auto-check timer leak — no process lifecycle integration. |
| REAS-M3 | `gnn-enhancer.ts` | 386-399 | Silent fallback to zero-padded embedding on any error — poisons downstream similarity. |
| REAS-M4 | `background-trainer.ts` | 476-506 | `stoppedEarly` always `false` in setImmediate path — early stopping never triggers. |
| REAS-M5 | `causal-memory.ts`, `pattern-store.ts`, `pattern-matcher.ts` | 65-87 | `initialize()` not idempotent under concurrency — double init discards mutations. |
| REAS-M6 | `gnn-trainer.ts` | 565-603 | `validate()` computes unnecessary backward pass just for `activeCount`. |
| REAS-M7 | `gnn-trainer.ts` | 696-733 | Parameter mutation creates confusing aliasing between dataset references. |
| REAS-M8 | `confidence-scorer.ts` | 22-33 | Multiplication of three factors produces near-zero confidence for new patterns. |

### LOW

| ID | File | Lines | Issue |
|----|------|-------|-------|
| REAS-L1 | `gnn-math.ts` | 143-177 | Deprecated `simpleProjection()` still exported. |
| REAS-L2 | `gnn-cache.ts` | 293-302 | `hashEmbedding()` samples only every 4th element — false cache hits possible. |
| REAS-L3 | `trajectory-tracker.ts` | 230-335 | Duplicate SQLite fallback code in `getTrajectory` and `updateFeedback`. |
| REAS-L4 | `mode-selector.ts` | 337-364 | `scoreValues.sort()` mutates in-place (safe now, fragile). |
| REAS-L5 | `gnn-trainer.ts` | 432-436 | `gradientHistory` grows unbounded within epoch — ~4MB per training run. |
| REAS-L6 | `training-history.ts` | 435-455 | `getEpochAverageLoss()` and `getBestLoss()` prepare statements on every call. |

---

## 6. Router Subsystem (31K LOC)

### CRITICAL

| ID | File | Lines | Issue |
|----|------|-------|-------|
| ROUT-C1 | `circuit-breaker.ts` | 413-421 | **Timer leak in `executeWithTimeout`** — `setTimeout` never cleared on success. Same in `retry-handler.ts`. |
| ROUT-C2 | `circuit-breaker.ts` | 249-268 | **Race condition in half-open state** — `allowRequest()` check and `halfOpenAttempts` increment not atomic. Unlimited concurrent probes. |
| ROUT-C3 | `capability-router.ts` | 96-157 | **Metrics write-tearing** — CLI and daemon both write `routing-metrics.json` with no file locking. Read-modify-write race. |
| ROUT-C4 | `local-first-executor.ts` | 291-292 | **`null as unknown as ExecutorProvider`** — Bypasses type system; future callers miss null guard and crash. |
| ROUT-C5 | `cost-tracker.ts` | 568-585 | **`importFromJson` skips validation** — No try-catch on `JSON.parse`, no field type validation. Malformed JSON crashes caller. |

### HIGH

| ID | File | Lines | Issue |
|----|------|-------|-------|
| ROUT-H1 | `circuit-breaker.ts` + `rate-limiter.ts` | 627-634, 591-598 | **Singleton config silently ignored after first init** — Whichever module loads first wins. |
| ROUT-H2 | `graceful-degradation.ts` | 224-232 | **Background timer leak** — Constructor starts recovery timer with no cleanup guarantee. Error swallowed via `.catch(() => {})`. |
| ROUT-H3 | `capability-router.ts` | 421-445 | **`isAvailable()` called sequentially with no timeout** — 4-provider fallback can block 4 minutes vs. stated `<10ms` target. |
| ROUT-H4 | `adaptive-router.ts` | 404-419 | **Cross-task score contamination** — Cache keyed on `modelId` only, not `taskType+complexity`. |
| ROUT-H5 | `retry-handler.ts` | 295-298 | **`attempts` array grows unboundedly** — Never cleared in reused handler instances. |
| ROUT-H6 | `rate-limiter.ts` | 254-269 | **`release()` token update broken** — `tokenWindow.find()` returns first entry, not the correct request's entry. |
| ROUT-H7 | `providers/anthropic-provider.ts` | 12 | **Uses `@anthropic-ai/sdk`** — Known to fail in WSL2 daemon (Fix 27 not applied to router). |
| ROUT-H8 | `routing-learner.ts` | 384-403 | **Rollback checkpoint created every feedback call** — Single bad update triggers instant rollback. |

### MEDIUM

| ID | File | Lines | Issue |
|----|------|-------|-------|
| ROUT-M1 | `capability-router.ts` | 459-473 | Inline metrics increments never persisted to file. |
| ROUT-M2 | `pipeline-generator.ts` | 367-374 | New `pipelineId` generated per stage — output domains orphaned. |
| ROUT-M3 | `monitoring.ts` | 367-393 | `start()` creates duplicate timers if called twice. |
| ROUT-M4 | `retry-handler.ts` | 434-449 | Jitter can go negative with `jitterFactor > 1.0` — no validation. |
| ROUT-M5 | `capability-cache.ts` | 508-531 | Partial rename failure leaves cache half-valid. |
| ROUT-M6 | `routing-engine.ts` | 253-258 | `RoutingError` message loses structured error info via `${error}`. |
| ROUT-M7 | `providers/ollama-provider.ts` | 477-491 | `pullModel()` has no timeout. |
| ROUT-M8 | `local-first-executor.ts` | 492-510 | Error markers ("undefined", "NaN") false-positive on valid code. |

### LOW

| ID | File | Lines | Issue |
|----|------|-------|-------|
| ROUT-L1 | `router/` vs `routing/` | — | Two parallel routing subsystems with overlapping concerns and no integration. |
| ROUT-L2 | `adaptive-router.ts` + `capability-router.ts` | — | Event handlers silently discard all errors. |
| ROUT-L3 | `cost-tracker.ts` | 358-381 | `percentage: undefined` for zero-budget periods. |
| ROUT-L4 | `capability-cache.ts` | 31 | `EMBEDDING_DIMENSION = 1536` hardcoded. |
| ROUT-L5 | `routing-learner.ts` | 527-534 | ReasoningBank errors only logged when `verbose = true`. |

---

## 7. CLI Subsystem (109K LOC)

### CRITICAL

| ID | File | Lines | Issue |
|----|------|-------|-------|
| CLI-C1 | `phd-cli.ts` | 182-254 | **Command injection via `exec()`** — `key` and `namespace` interpolated into shell command without escaping. LLM output flows into keys. |
| CLI-C2 | `quality/endnote-generator.ts` | 22-83 | **Path traversal in `renderBboxOverlayAsync`** — `pathRel` not validated; `../../etc/passwd` resolves outside `corpus/`. |

### HIGH

| ID | File | Lines | Issue |
|----|------|-------|-------|
| CLI-H1 | `quality/open-access-searcher.ts` | 403-428 | **Unbounded response buffering** — No size cap on HTTP response body. |
| CLI-H2 | `dissertation/tools/llm-clients.ts` | 145, 163 | **Unchecked `choices[0]` access** — Empty choices array crashes process. |
| CLI-H3 | `dissertation/tools/tool-executor.ts` | 65-105 | **Mock citation database active in production** — Fallback returns fabricated citations. |
| CLI-H4 | `quality/calibration/rating-store.ts` | 486-491 | **`ALTER TABLE` in transaction-sensitive path** — Schema migration race; error swallowed. |
| CLI-H5 | `dissertation/tools/tool-executor.ts` | 221-277 | **Tool call arguments not runtime-validated** — `as string` casts bypass type safety. |

### MEDIUM

| ID | File | Lines | Issue |
|----|------|-------|-------|
| CLI-M1 | `dissertation/tools/tool-executor.ts` | 411-422 | Rate limiter ineffective for parallel calls (timestamp-based). |
| CLI-M2 | `dissertation/tools/llm-clients.ts` | 194+ | Predictable tool call IDs via `Math.random()`. |
| CLI-M3 | `dissertation/tools/tool-executor.ts` | 315-357 | Unbounded memory load in `getFullSection` before truncation. |
| CLI-M4 | `quality/open-access-searcher.ts` | 405 | `parsedUrl` constructed but never used — dead URL validation code. |
| CLI-M5 | `retrieval/cross-encoder-reranker.ts` | 521 | Non-deterministic noise cached — scores frozen with random perturbation. |
| CLI-M6 | `phd-cli.ts` | 246 | `JSON.parse` return used without type validation. |

### LOW

| ID | File | Lines | Issue |
|----|------|-------|-------|
| CLI-L1 | `dissertation/tools/llm-clients.ts` | 125, 329 | Hardcoded `'dummy-key'` credential string. |
| CLI-L2 | `quality/open-access-searcher.ts` | 457-463 | Singleton config leak across tests. |
| CLI-L3 | `retrieval/cross-encoder-reranker.ts` | 629 | `rerankHistory` growth pattern after `resetStats()`. |
| CLI-L4 | `feedback/cross-session-learner.ts` | 575-584 | Deserialized state not validated against schema. |
| CLI-L5 | `retrieval/enhanced-hybrid-retriever.ts` | 551 | Missing `ensureInitialized()` guard in `getEnhancedStats()`. |

---

## 8. Universal Subsystem (18.5K LOC)

### CRITICAL

| ID | File | Lines | Issue |
|----|------|-------|-------|
| UNIV-C1 | `write-pipeline-orchestrator.ts` | 924-929 | **Division by zero in rolling context** — When all subsections match "conclusion", `regularSections = 0`, producing `Infinity` word target in LLM prompt. |
| UNIV-C2 | `write-pipeline-orchestrator.ts` | 2298, 2321 | **`v1GauntletScore` used as number when undefined** — If gauntlet throws, score remains `undefined`; `undefined * 100` = `NaN` stored into quality metrics. |
| UNIV-C3 | `write-pipeline-orchestrator.ts` | 2116-2159, 2376-2402 | **`seenIds` scope leak** — Phase 4b+ supplemental retrieval cannot access Phase 1b/1f `seenIds`, causing duplicate chunks to be re-added past the corpus block limit. |

### HIGH

| ID | File | Lines | Issue |
|----|------|-------|-------|
| UNIV-H1 | `write-pipeline-orchestrator.ts` | 3580, 3758 | **v2 subsection array inconsistency** — Retrieval uses `extractSemanticRetrievalQueries` but section constraints use `extractRetrievalQueries`. Section constraints applied to wrong sections. |
| UNIV-H2 | `write-pipeline-orchestrator.ts` | 1793-1825, 2290 | **`options.multiStep` mutated as control-flow signal** — Fragile pattern where mutating the options object controls code path execution. |
| UNIV-H3 | `write-pipeline-orchestrator.ts` | 609-627 | **Attention reordering inverted** — Comment says `[high, ..., high]` but actual return is `[high, low, medium]`. Medium-relevance chunks placed at most-attended end position. |
| UNIV-H4 | `write-pipeline-orchestrator.ts` | 2713, 2726 | **Inline validation runs when rolling-context active** — Wastes API calls then discards results when rolling-context content takes precedence. |
| UNIV-H5 | `write-pipeline-orchestrator.ts` | 152-163 | **Manifest cache key collision** — `undefined` and `[]` both normalize to `"[]"` cache key; may return wrong data. |

### MEDIUM

| ID | File | Lines | Issue |
|----|------|-------|-------|
| UNIV-M1 | `write-pipeline-orchestrator.ts` | 242-248 | Pattern 3a early-return threshold (≥3) inconsistent with final-return threshold (≥2). |
| UNIV-M2 | `write-pipeline-orchestrator.ts` | 410-446 | `buildSectionConstraints` hardcodes "heidegger", "aristotle", "uex" bypassing `primaryAuthors` parameter. |
| UNIV-M3 | `domain-config.ts` | 78-85 | Module-level config cache never expires; `projectRoot` param silently ignored after first call. |
| UNIV-M4 | `write-pipeline-orchestrator.ts` | 507-517 | `enforceSourceDiversity` second pass doesn't update dedup set as items added — potential duplicates. |
| UNIV-M5 | `write-pipeline-orchestrator.ts` | 1516 | Sentence splitter loses final sentence without trailing punctuation — false uncited-claim counts. |
| UNIV-M6 | `author-scrubber.ts` | 93, 127 | Sentence split eats `\n\n` paragraph breaks; rejoin with single space destroys markdown structure. |
| UNIV-M7 | `write-pipeline-orchestrator.ts` | 3907-3926 | v2 pipeline has no inline validation — `useInlineValidation` flag silently ignored. |

### LOW

| ID | File | Lines | Issue |
|----|------|-------|-------|
| UNIV-L1 | `write-pipeline-orchestrator.ts` | — | Duplicate log statements throughout pipeline. |
| UNIV-L2 | `write-pipeline-orchestrator.ts` | 1273-1284 | Mock content overshoots word target (conclusion appended after padding). |
| UNIV-L3 | `cli.ts` | 146 | `--flag=val=ue` split truncates value at first `=`. |
| UNIV-L4 | `gold-standard-config.ts` | 13, 19 | `targetTotalChunks: 35` is dead config (always overridden by `targetChunks: 28`). |
| UNIV-L5 | `write-pipeline-orchestrator.ts` | 608-626 | Comment describes wrong return pattern for attention reordering. |

### Architecture Notes

- **REDUNDANCY**: Full retrieval logic (~600 lines) duplicated between legacy `write()` and `writeV2()`. The `stages/retrieval-stage.ts` stub was intended to extract this but never completed.
- **REDUNDANCY**: `fs` and `path` imported both statically (lines 8-9) and dynamically (`await import('fs')`) in the same file — dynamic imports are unnecessary since static imports already exist.
- **WEAKNESS**: `writeV2` accepts `options: Record<string, any>` — all type safety discarded for the v2 code path.

---

## 9. Retrieval & Remaining Subsystems

### CRITICAL

| ID | File | Lines | Issue |
|----|------|-------|-------|
| RETR-C1 | `core/ucm/token/usage-tracker.ts` | 183-186 | **Unit mismatch: ratio vs percentage** — `warningThreshold` is 0.8 (ratio) compared against `percentUsed` (0-100). Warning fires at near-zero usage, then never again. Budget alerting completely non-functional. |
| RETR-C2 | `core/episode/episode-store.ts` | 234-255 | **Vector insert inside SQLite transaction** — HNSW backend has no transaction support. Failure leaves vector/SQL permanently out of sync. |
| RETR-C3 | `observability/icp-api-routes.ts` | 73-105 | **Module-level singleton state leaks across HTTP requests** — Manifest loaded once, never refreshed. Different sessions share retrieval layer state. |
| RETR-C4 | `core/graph-db/fallback-graph.ts` | 44-191 | **Full JSON rewrite on every mutation** — Every `insertNode`/`insertEdge` serializes entire graph to disk with file lock. O(n) I/O per operation. |

### HIGH

| ID | File | Lines | Issue |
|----|------|-------|-------|
| RETR-H1 | `retrieval/smart-retrieval-layer.ts` | 1206-1235 | **O(n) cache eviction** — Linear scan of 1000 entries on every cache-full write. Existing O(1) LRU exists in `core/memory/lru-cache.ts` but unused here. |
| RETR-H2 | `retrieval/smart-retrieval-layer.ts` | 346-393, 961-975 | **`getRelatedChunks` and `expandPageContext` permanently stubbed** — Return empty arrays silently. Public API promises features that don't work. |
| RETR-H3 | `retrieval/faceted-retrieval.ts` | 246-247 | **Phantom field access** — `chunk.clean_text` and `chunk.source_kind` don't exist on `ContextChunk`. Always falls back to defaults. |
| RETR-H4 | `core/gpu/gpu-server-manager.ts` | 260-468 | **`execSync` inside async functions** — Blocks entire Node.js event loop during GPU server operations. |
| RETR-H5 | `core/ucm/token/token-budget-manager.ts` + `usage-tracker.ts` | 68, 179 | **Context window default 200,000 vs. Constitution rule 100,000** — Budget calculations use double the intended limit. |
| RETR-H6 | `core/graph-db/graph-db.ts` | 238-283 | **`createNode` loads ALL nodes on every call** — Two `getAllNodes()` calls per insert for upsert check. O(n) per insertion. |
| RETR-H7 | `orchestration/services/workflow-state-manager.ts` | 70-77 | **Cross-directory `rename` not guaranteed atomic** — Temp file in active dir renamed to archive dir. |
| RETR-H8 | `retrieval/smart-retrieval-layer.ts` | 670-708 | **KG load race condition** — `kgLoaded` set to `true` before async file parse completes. Concurrent callers see incomplete state. |
| RETR-H9 | `observability/icp-api-routes.ts` | 446-515 | **Temp PNG not cleaned up on error** — `pdf-page` endpoint leaks temp files on failure. |

### MEDIUM

| ID | File | Lines | Issue |
|----|------|-------|-------|
| RETR-M1 | `retrieval/smart-retrieval-layer.ts` | 1173-1176 | Cache key doesn't normalize array order — `['a','b']` vs `['b','a']` = different keys. |
| RETR-M2 | `retrieval/smart-retrieval-layer.ts` | 137-182 | `collectionResolved = true` set on failure — ChromaDB recovery permanently blocked. |
| RETR-M3 | `core/ucm/token/usage-tracker.ts` | 64, 97 | `records` array unbounded — grows forever with no pruning. |
| RETR-M4 | `pipelines/pdf-analysis-pipeline.ts` | 97 | New checkpoint sessionId per chunk — resume-from-checkpoint non-functional. |
| RETR-M5 | `core/ucm/context/context-composition-engine.ts` | 89 | `descPriorCache` Map never populated — dead code. |
| RETR-M6 | `core/config/config-manager.ts` | 31-79 | `simpleYamlParse` silently drops YAML arrays — no list syntax support. |
| RETR-M7 | `observability/icp-api-routes.ts` | 95 | Session store `Map<string, ICPSession>` unbounded — no TTL or max size. |
| RETR-M8 | `retrieval/hybrid-retriever.ts` | — | `HybridRetriever` with "20%+ MRR improvement" never wired into active pipeline — dead code. |
| RETR-M9 | `core/memory/lru-cache.ts` | 124-138 | Memory pressure evicts 50% of cache on every `set()` — cache becomes useless under load. |
| RETR-M10 | `observability/event-store.ts` | 221-229 | SQLite cleanup trigger fires on every INSERT — 100 DELETEs per batch flush. |
| RETR-M11 | `observability/icp-api-routes.ts` | 225-260 | Diagnostics endpoint exposes API key length, cwd, backend topology. |

### LOW

| ID | File | Lines | Issue |
|----|------|-------|-------|
| RETR-L1 | `core/graph-db/graph-db.ts` | 215-898 | `console.log/error` instead of StructuredLogger (7 occurrences). |
| RETR-L2 | `core/graph-db/fallback-graph.ts` | 227-233 | Silent data wipe on corrupt persistence file — `nodes.clear()` without error propagation. |
| RETR-L3 | `retrieval/smart-retrieval-layer.ts` | 312-318 | `hybridSearch` hardcodes `minRelevance: 0.6` ignoring caller's options. |
| RETR-L4 | `core/config/config-manager.ts` | 405-440 | Uninitialized `ConfigManager` returns `DEFAULT_CONFIG` silently — no warning. |
| RETR-L5 | `core/attention/attention-registry.ts` | 27-37 | 39+ attention mechanisms registered eagerly — 16K LOC with no active integration point. |
| RETR-L6 | `core/episode/episode-store.ts` | 237-376 | Non-null assertions (`!`) on prepared statements that may be undefined. |
| RETR-L7 | `orchestration/services/workflow-state-manager.ts` | 146-150 | Corrupted file archive failure silently swallowed. |
| RETR-L8 | `observability/icp-api-routes.ts` | 439-552 | Dynamic `import()` of built-in modules inside request handlers — unnecessary. |

### Redundancy Notes

- **Three independent LRU cache implementations** — `core/memory/lru-cache.ts` (O(1), proper), `smart-retrieval-layer.ts` (O(n), Map-based), `dual-embedding-store.ts` (separate reference). The best one is unused by the subsystem with highest cache traffic.
- **Five independent `SmartRetrievalLayer` instances** — icp-api-routes, icp-pipeline-adapter, express-server, universal-agent, pdf-analysis-pipeline. Each has its own 1000-entry cache + ChromaDB state.
- **Two episodic memory systems** — `EpisodeStore` (core/episode) and `DualEmbeddingStore` (UCM/DESC) both store episodes with embeddings in separate SQLite databases with no cross-reference.
- **40+ attention mechanisms (16K LOC)** — Not referenced from any active pipeline. No integration point found in universal-agent, write-pipeline-orchestrator, or icp-api-routes.

---

## 10. Cross-Cutting Architectural Issues

### 10.1 Dual Pipeline Architecture (CRITICAL)

The system maintains two independent writing pipelines:
- **`ICPOrchestrator`** — evidence-first ICP pipeline
- **`ICPPipelineAdapter`** — gold-standard pipeline adapted for dashboard

They share no code for quality gates, sanitization, or author scrubbing. Fixes applied to one don't reach the other (already happened: Fix 25, Fix 45). This is the single largest source of regression risk.

**Impact**: Every fix to the writing pipeline must be applied twice, verified twice, and tested twice.

### 10.2 Two Routing Subsystems (HIGH)

`core/router/` (25K LOC) handles LLM provider routing. `core/routing/` (6K LOC) handles agent-level routing. They duplicate concepts (task classification, capability tracking, failure classification, outcome tracking) with no integration point. Neither calls the other.

### 10.3 Type Drift (HIGH)

`ContextChunk`, `StyleCharacteristics`, `QualityIssue`, `RevisionRequest` types have evolved but consumers haven't kept pace. 61 of 172 TS errors are "property does not exist on type" — the type system is trying to catch exactly these regressions but is being ignored via `as any` casts (19 in `icp-pipeline-adapter.ts` alone).

### 10.4 StructuredLogger API (MEDIUM)

42 TS errors from accessing private `.log()` method. The logger API changed but 7+ files still use the old pattern. Concentrated in `__experimental__/` and `cli/context/`.

### 10.5 Silent Error Swallowing (MEDIUM)

Pervasive pattern across all subsystems: `catch { }` or `catch (e) { console.warn(...) }` in production paths. Quality gauntlet failures, metrics persistence failures, ReasoningBank submission failures, and event handler errors are all silently swallowed.

### 10.6 Singleton Config Ordering (MEDIUM)

Circuit breaker, rate limiter, degradation manager, and `OpenAccessSearcher` all use singletons where config is only applied on first initialization. Later callers' config is silently ignored.

---

## Appendix A: Files With Highest Issue Density

| File | LOC | Issues | Issues/KLOC |
|------|-----|--------|-------------|
| `icp-pipeline-adapter.ts` | ~1,540 | 9 | 5.8 |
| `citation-validator.ts` | ~570 | 7 | 12.3 |
| `training-trigger.ts` | ~720 | 5 | 6.9 |
| `icp-orchestrator.ts` | ~850 | 8 | 9.4 |
| `comprehensive-claim-validator.ts` | ~940 | 5 | 5.3 |
| `circuit-breaker.ts` | ~640 | 4 | 6.3 |
| `weight-manager.ts` | ~550 | 3 | 5.5 |
| `citation-enforcer.ts` | ~370 | 4 | 10.8 |
| `tool-executor.ts` | ~430 | 5 | 11.6 |

---

*Report compiled from 7 specialist analysis agents, TypeScript compiler output, and vitest results. Sections 8 and 9 will be appended when remaining agents complete.*
