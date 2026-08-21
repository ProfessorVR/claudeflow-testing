# God Agent Audit — Implementation Guide

**Date**: 2026-03-28 (revised)
**Companion**: `plans/god-agent-system-audit.md` (full findings)
**Execution Protocol**: `plans/god-agent-audit-execution-protocol.md` (environment, scope checks, rollback, session management)
**Usage**: Follow the execution protocol. For each phase, provide this file to Claude Code with the instruction: "Read `plans/god-agent-audit-implementation-guide.md` and execute Phase N."

---

## Execution Strategy

Fixes are organized into 8 phases by dependency and risk. Phases 1-7 fix bugs on the current codebase. Phase 8 performs architectural refactoring from a stable, bug-free base.

**Estimated total effort**: 8 phases × 1-2 hours each = 8-16 hours of Claude Code execution.

**Branch strategy**: Create `audit-fixes` from `writing-pipeline-v2`. Each phase gets its own commit.

### Revision Notes (2026-03-28)

Four corrections applied based on review:

1. **Non-atomic file writes**: All async file writes now use temp-then-rename (`writeFile(.tmp)` → `rename`) instead of bare `writeFile`. This prevents crash-corruption that the audit flagged elsewhere.
2. **Mutex memory leaks**: The per-layerId promise-based mutex now cleans up resolved keys via `.finally()` with a staleness guard, preventing unbounded Map growth in long-running daemons.
3. **Citation replacement strategy**: Clarified that the existing reverse-order sort in `correct()` is already correct. The real fix is WRIT-C4 (re-running validation on post-quotation-correction content so positions are accurate). Removed the fragile delta-tracking and dangerous `String.replaceAll` suggestions.
4. **Architectural completeness**: Added Phase 8 for full architectural deprecation — extracting shared retrieval logic, deprecating `ICPPipelineAdapter`, and documenting the router/routing boundary. This runs after all bugs are fixed to avoid masking issues during restructuring.

---

## Phase 1: Security Fixes (CRITICAL — Do First)

These are exploitable vulnerabilities that should be fixed before anything else.

### 1.1 Command Injection in `phd-cli.ts` [CLI-C1]

**File**: `src/god-agent/cli/phd-cli.ts`
**Lines**: 182-254

**Action**: Replace `exec()` with `execFile()` in both `storeToMemory` and `retrieveFromMemory`.

```
1. Read src/god-agent/cli/phd-cli.ts
2. Import { execFile } from 'child_process' and promisify it
3. Replace the exec() call in storeToMemory (line ~196) with execFile('npx', ['claude-flow', 'memory', 'store', key, escapedValue, '--namespace', namespace])
4. Replace the exec() call in retrieveFromMemory (line ~235) with execFile('npx', ['claude-flow', 'memory', 'retrieve', key, '--namespace', namespace])
5. Remove the shell escaping logic (line 194) since execFile doesn't use a shell
```

### 1.2 Path Traversal in `endnote-generator.ts` [CLI-C2]

**File**: `src/god-agent/cli/quality/endnote-generator.ts`
**Lines**: 22-83

**Action**: Add path boundary validation before `path.resolve`.

```
1. Read src/god-agent/cli/quality/endnote-generator.ts
2. Before line 31 (const pdfPath = path.resolve('corpus', pathRel)), add:
   const resolved = path.resolve('corpus', pathRel);
   const base = path.resolve('corpus');
   if (!resolved.startsWith(base + path.sep) && resolved !== base) {
     throw new Error(`Path traversal detected: ${pathRel}`);
   }
3. Use `resolved` instead of the original pdfPath assignment
```

### 1.3 Unbounded HTTP Response in `open-access-searcher.ts` [CLI-H1]

**File**: `src/god-agent/cli/quality/open-access-searcher.ts`
**Lines**: 403-428

**Action**: Add response size limit and host allowlist.

```
1. Read src/god-agent/cli/quality/open-access-searcher.ts
2. In httpGet(), add a maxBytes parameter (default 512 * 1024)
3. Track received bytes in the data handler; destroy request if exceeded
4. Add host allowlist: api.semanticscholar.org, archive.org, philpapers.org
5. Remove the unused parsedUrl variable (line 405) or use it for validation
```

### 1.4 Mock Citation Fallback [CLI-H3]

**File**: `src/god-agent/cli/dissertation/tools/tool-executor.ts`
**Lines**: 65-105, 296-297

**Action**: Remove MOCK_CITATIONS fallback from production path.

```
1. Read src/god-agent/cli/dissertation/tools/tool-executor.ts
2. At line 296-297 (getCitation fallback), instead of returning mock data, return { tool: 'getCitation', data: null }
3. In listAvailableSources (line 370-371), query actual corpus instead of MOCK_CITATIONS
4. Add a comment marking MOCK_CITATIONS as test-only
```

### Phase 1 Verification

```bash
npx tsc --noEmit 2>&1 | grep -c 'error TS'  # Should not increase
npx vitest run tests/god-agent/cli/ --reporter=verbose  # Existing tests still pass
```

---

## Phase 2: Citation Pipeline Fixes (CRITICAL — Highest Impact on Output Quality)

These directly affect the quality of generated academic writing.

### 2.1 Year=0 Sentinel for Null-Year Sources [WRIT-C3]

**File**: `src/god-agent/core/writing/corpus-constraint-builder.ts`
**Line**: 256

**Action**: Skip year validation when source year is 0/null.

```
1. Read src/god-agent/core/writing/corpus-constraint-builder.ts
2. At line 256 where year = 0 is assigned for null years, change to year: meta.year ?? undefined
3. In validateSingleCitation(), when comparing years, add guard: if source.year is undefined or 0, skip year comparison
4. Search for Math.abs(year) usage in citation-validator.ts and ensure it handles undefined
```

### 2.2 Fix minRelevance Regression in ICPOrchestrator [COMP-H2]

**File**: `src/god-agent/core/composition/icp-orchestrator.ts`
**Lines**: 225-229

**Action**: One-line fix.

```
1. Read src/god-agent/core/composition/icp-orchestrator.ts
2. Change minRelevance: 0.5 to minRelevance: 0.0 at line 227
```

### 2.3 Citation Enforcer Runs on Wrong Content [WRIT-C4] — THE PRIMARY CITATION FIX

**File**: `src/god-agent/core/writing/citation-enforcer.ts`
**Lines**: 177-258

**Action**: Re-run citation validation on post-quotation-correction content so positions are accurate. This is the root cause of WRIT-C1 (stale position offsets) — fixing C4 makes the existing reverse-order replacement in `correct()` work correctly because positions will reference the actual string being modified.

```
1. Read src/god-agent/core/writing/citation-enforcer.ts
2. After line 199 (content = quotationCorrectedContent), re-run validation on the CORRECTED content:
   const updatedValidation = this.validator.validate(content, options);
   Use updatedValidation (NOT the original validation) for all subsequent operations
3. Replace hard-coded 0.95 threshold (line 233) with this.config.quotationMinSimilarity
4. Replace hard-coded 0.8 threshold (line 234) with this.config.claimMinTopicOverlap
```

**Why this fixes WRIT-C1**: The existing `correct()` method already sorts hallucinated citations in descending position order and replaces from the end of the string backward — this is the correct algorithm. The bug was that positions were computed against the ORIGINAL content, but `correct()` runs against the QUOTATION-CORRECTED content. Re-running validation on the corrected content produces accurate positions, making the reverse-order replacement work as designed.

### 2.4 Empty Citation Placeholder [WRIT-C2]

**File**: `src/god-agent/core/writing/citation-validator.ts`
**Line**: 169

**Action**: Enforce non-empty fallback.

```
1. Read src/god-agent/core/writing/citation-validator.ts
2. Change line 169 from:
   h.suggestion?.formatted ?? options.placeholder
   To:
   h.suggestion?.formatted ?? (options.placeholder || '[CITATION NEEDED]')
```

### 2.5 Negative Year Normalization [WRIT-H3]

**File**: `src/god-agent/core/writing/quotation-fidelity-validator.ts`
**Lines**: 355-370

**Action**: Apply `Math.abs()` when extracting year from citation pattern.

```
1. Read src/god-agent/core/writing/quotation-fidelity-validator.ts
2. In findAssociatedCitation(), after parseInt(match[2], 10), wrap with Math.abs()
```

### 2.6 Author Name Normalization [WRIT-M6]

**File**: `src/god-agent/core/writing/citation-validator.ts`
**Lines**: 549-557

**Action**: Handle compound surnames with prefixes.

```
1. Read src/god-agent/core/writing/citation-validator.ts
2. In normalizeAuthor():
   - For "von Uexküll" format: if first word is a known prefix (von, de, van, di, du, le, la), take the SECOND word as the key name
   - Add prefix list: ['von', 'de', 'van', 'di', 'du', 'le', 'la', 'el', 'al', 'bin', 'ibn']
```

### 2.7 Short Author Substring Match [WRIT-H5]

**File**: `src/god-agent/core/writing/corpus-constraint-builder.ts`
**Lines**: 305-314

**Action**: Require minimum author length for substring matching.

```
1. Read src/god-agent/core/writing/corpus-constraint-builder.ts
2. In validateCitation(), add guard: if normalizedAuthor.length < 4, require exact match instead of substring
```

### Phase 2 Verification

```bash
npx vitest run tests/god-agent/core/writing/ --reporter=verbose
npx vitest run tests/god-agent/core/composition/ --reporter=verbose
```

---

## Phase 3: Concurrency & Race Condition Fixes (CRITICAL — Data Integrity)

### 3.1 Training Trigger Single-Flight [REAS-C1]

**File**: `src/god-agent/core/reasoning/training-trigger.ts`
**Lines**: 338-366

**Action**: Replace boolean flag with promise-based single-flight.

```
1. Read src/god-agent/core/reasoning/training-trigger.ts
2. Replace: private trainingInProgress = false;
   With: private trainingPromise: Promise<TriggerResult> | null = null;
3. In checkAndTrain():
   - if (this.trainingPromise) return { triggered: false, reason: 'Training already in progress' };
   - this.trainingPromise = this.executeTraining('threshold').finally(() => { this.trainingPromise = null; });
   - return this.trainingPromise;
4. Remove the this.trainingInProgress = true/false assignments from executeTraining()
```

### 3.2 Atomic Weight Save with Mutex Cleanup [REAS-C2]

**File**: `src/god-agent/core/reasoning/weight-manager.ts`
**Lines**: 425-530

**Action**: Add per-layerId async mutex WITH cleanup to prevent memory leaks in long-running daemons.

```
1. Read src/god-agent/core/reasoning/weight-manager.ts
2. Add: private saveLocks: Map<string, Promise<void>> = new Map();
3. Implement saveWeightsAtomic with mutex and cleanup:

   async saveWeightsAtomic(layerId: string): Promise<void> {
     const prior = this.saveLocks.get(layerId) ?? Promise.resolve();
     const next = prior.then(() => this._saveWeightsAtomicImpl(layerId));
     this.saveLocks.set(layerId, next);
     return next.finally(() => {
       // Only delete if no newer save was chained while we were running
       if (this.saveLocks.get(layerId) === next) {
         this.saveLocks.delete(layerId);
       }
     });
   }

   IMPORTANT: The .finally() cleanup with the === next staleness guard is
   critical. Without it, the saveLocks Map grows one key per unique layerId
   forever in a long-running daemon. The === next check ensures we only
   delete the key when the promise chain has fully drained — if a newer
   save was queued (saveLocks.get(layerId) !== next), the key stays alive
   for the newer promise's .finally() to handle.

4. Fix double-increment of updateCount (REAS-H7): only increment in saveWeightsAtomic, not in saveWeights
```

### 3.3 Circuit Breaker Timer Leak [ROUT-C1]

**File**: `src/god-agent/core/router/circuit-breaker.ts`
**Lines**: 413-421

**Action**: Clear timeout on success.

```
1. Read src/god-agent/core/router/circuit-breaker.ts
2. In executeWithTimeout(), assign the setTimeout to a variable and clearTimeout in a finally block
3. Apply same fix to retry-handler.ts (same pattern, lines ~426-431)
```

### 3.4 Circuit Breaker Half-Open Race [ROUT-C2]

**File**: `src/god-agent/core/router/circuit-breaker.ts`
**Lines**: 249-268

**Action**: Increment `halfOpenAttempts` inside `allowRequest()`.

```
1. Read src/god-agent/core/router/circuit-breaker.ts
2. In allowRequest(), in the 'half-open' case:
   - Move this.halfOpenAttempts++ BEFORE returning true
3. Remove the halfOpenAttempts increment from executeWithTimeout()
```

### 3.5 Rate Limiter Token Fix [ROUT-H6]

**File**: `src/god-agent/core/router/rate-limiter.ts`
**Lines**: 254-269

**Action**: Correlate token window entries to request IDs.

```
1. Read src/god-agent/core/router/rate-limiter.ts
2. Change tokenWindow entries to include requestId
3. In release(), find the entry matching the given requestId instead of the first recent entry
```

### 3.6 Atomic Async File Writes for Training Buffer [REAS-C5]

**File**: `src/god-agent/core/reasoning/training-trigger.ts`
**Lines**: 620-651

**Action**: Replace writeFileSync with debounced atomic async writes using temp-then-rename.

**IMPORTANT**: Do NOT use bare `fs/promises.writeFile` — a crash mid-write corrupts the file permanently. Use the temp-then-rename pattern for atomic writes.

```
1. Read src/god-agent/core/reasoning/training-trigger.ts
2. Replace the writeFileSync call with an atomic write sequence:

   private async atomicWriteFile(targetPath: string, data: string): Promise<void> {
     const tmpPath = targetPath + '.tmp';
     await fs.promises.writeFile(tmpPath, data, 'utf-8');
     await fs.promises.rename(tmpPath, targetPath);  // atomic on same filesystem
   }

3. Add debounce: schedule persist after 500ms, collapsing rapid additions:

   private persistDebounceTimer?: NodeJS.Timeout;

   private schedulePersist(): void {
     if (this.persistDebounceTimer) clearTimeout(this.persistDebounceTimer);
     this.persistDebounceTimer = setTimeout(() => {
       this.persistBufferToDisk().catch(err =>
         console.error('[TrainingTrigger] Buffer persist failed:', err)
       );
     }, 500);
   }

4. Call schedulePersist() from addTrajectory() instead of persistBufferToDisk()
5. In persistBufferToDisk(), use this.atomicWriteFile() instead of writeFileSync
6. Replace unlinkSync in clearPersistedBuffer with fs/promises.unlink
7. In destroy(), flush any pending debounce: if (this.persistDebounceTimer) { clearTimeout(...); await this.persistBufferToDisk(); }
```

### Phase 3 Verification

```bash
npx vitest run tests/god-agent/core/reasoning/ --reporter=verbose
npx vitest run tests/god-agent/core/router/ --reporter=verbose  # if tests exist
```

---

## Phase 4: Abort Signal + Component Fixes (HIGH)

### 4.1 Abort Signal Propagation [COMP-C3]

**File**: `src/god-agent/core/composition/icp-pipeline-adapter.ts`
**Lines**: 841-876, 1007-1078

**Action**: Thread abort signal through rolling-context generation.

```
1. Read src/god-agent/core/composition/icp-pipeline-adapter.ts
2. Add abortSignal?: AbortSignal parameter to generateRollingContext() signature (line ~1007)
3. Pass abortSignal from generate() call at line ~872
4. Inside generateRollingContext section loop, check abortSignal.aborted before each section
5. Pass abortSignal to this.modelRouter.call() inside the loop
```

### 4.2 ICPOrchestrator Stateless Per-Run [COMP-C1]

**File**: `src/god-agent/core/composition/icp-orchestrator.ts`
**Lines**: 163-165

**Action**: Convert mutable instance fields to local variables.

```
1. Read src/god-agent/core/composition/icp-orchestrator.ts
2. Remove instance fields: corpusConstraint, retrievedChunks, stylePromptCache
3. Declare them as local variables inside run()
4. Thread them as parameters through private helper methods that need them
```

### 4.3 Anthropic Provider SDK Fix [ROUT-H7]

**File**: `src/god-agent/core/router/providers/anthropic-provider.ts`
**Lines**: 12, 119-124

**Action**: Replace `@anthropic-ai/sdk` with native `fetch`, matching `model-router.ts` pattern.

```
1. Read src/god-agent/core/composition/model-router.ts to see the existing fetch-based Anthropic call pattern
2. Read src/god-agent/core/router/providers/anthropic-provider.ts
3. Replace the SDK-based doComplete() with a direct fetch call to https://api.anthropic.com/v1/messages
4. Match the headers, body format, and error handling from model-router.ts
```

### 4.4 `recordBatch()` Silent Error Drop [REAS-H6]

**File**: `src/god-agent/core/reasoning/training-history.ts`
**Lines**: 231-249

**Action**: One-line fix — add `return` before `withRetrySync`.

```
1. Read src/god-agent/core/reasoning/training-history.ts
2. Change withRetrySync(() => ...) to return withRetrySync(() => ...)
   OR wrap in try-catch and re-throw
```

### Phase 4 Verification

```bash
npx vitest run tests/god-agent/ --reporter=verbose
# Manually test abort: trigger a god-write with rolling context and hit abort
```

---

## Phase 5: Claim Validation & Writing Quality Fixes (HIGH)

### 5.1 BLOCKED Verdict Counting [WRIT-H1]

**File**: `src/god-agent/core/writing/comprehensive-claim-validator.ts`
**Lines**: 698-728

```
1. Read src/god-agent/core/writing/comprehensive-claim-validator.ts
2. Add case 'BLOCKED': stats.skipped++; break; in the switch statement at calculateStatistics()
```

### 5.2 Composite Claim Over-Detection [WRIT-H2]

**File**: `src/god-agent/core/writing/comprehensive-claim-validator.ts`
**Lines**: 526-536

```
1. Read src/god-agent/core/writing/comprehensive-claim-validator.ts
2. Remove "and", "but" from the conjunction check in isCompositeClaim()
3. Keep logical connectives: "therefore", "thus", "hence", "consequently", "moreover"
```

### 5.3 Discourse Phrase Blocklist [WRIT-M4]

**File**: `src/god-agent/core/writing/claim-verifier.ts`
**Lines**: 456-470

```
1. Read src/god-agent/core/writing/claim-verifier.ts
2. Remove overly broad patterns from sentenceStartBlocklist: "this", "it"
3. Keep specific unresolvable referents: "the former", "the latter", "said"
4. For discoursePatterns: remove "this view", "this account", "this argument" (common in academic writing)
```

### 5.4 All-Uncertain Paragraph Verdict [WRIT-H6]

**File**: `src/god-agent/core/writing/comprehensive-claim-validator.ts`
**Lines**: 725-727

```
1. Read src/god-agent/core/writing/comprehensive-claim-validator.ts
2. After the verifiedClaims === 0 guard (where supportRatio stays 0):
   Add: if (stats.uncertain === stats.totalClaims) return 'NEEDS_REVIEW';
```

### 5.5 Quotation Fidelity Threshold Consistency [WRIT-M2]

**File**: `src/god-agent/core/writing/inline-validation-orchestrator.ts`
**Lines**: 956-975

```
1. Read src/god-agent/core/writing/inline-validation-orchestrator.ts
2. Replace hard-coded 0.70 in passingRate check (line ~974) with the threshold variable
```

### 5.6 Author List Truncation [WRIT-L6]

**File**: `src/god-agent/core/writing/inline-validation-orchestrator.ts`
**Lines**: 779-785

```
1. Read src/god-agent/core/writing/inline-validation-orchestrator.ts
2. Increase the author list limit from 20 to 50, or remove the limit entirely for corpora < 100 authors
```

### Phase 5 Verification

```bash
npx vitest run tests/god-agent/core/writing/ --reporter=verbose
```

---

## Phase 6: TypeScript Errors, Test Fixes, Cleanup (MEDIUM)

### 6.1 StructuredLogger API Fix (42 errors)

```
1. Read src/god-agent/core/observability/logger.ts to find the current public API
2. Either:
   a. Make .log() public again (if no security reason for making it private)
   b. Or add a public .emit() or .write() method that wraps .log()
3. Update all 7 affected files to use the public method
```

### 6.2 ContextChunk Type Alignment (15+ errors)

```
1. Read src/god-agent/retrieval/types.ts for the canonical ContextChunk definition
2. Search for .id usage on ContextChunk — replace with .chunkId
3. Search for .source usage on ContextChunk — replace with appropriate field
4. Fix icp-orchestrator.ts line 679: add chunkId and docId to the mapped object
5. Fix express-server.ts lines 4044, 4068: use .chunkId instead of .id
```

### 6.3 StyleCharacteristics Type Alignment (10 errors)

```
1. Read the canonical StyleCharacteristics type definition
2. Either add back the removed properties or update the drift detectors:
   - enhanced-style-drift-detector.ts
   - experimental/style-drift-detector.ts
   - experimental/enhanced-quality-integration.ts
```

### 6.4 pipeline-daemon-service.ts (7 errors)

```
1. Read src/god-agent/cli/pipeline-daemon-service.ts
2. Fix the import: either re-export completeAndNext from the correct module or remove the import
3. Fix function call argument counts to match current signatures
```

### 6.5 retrieval-orchestrator.ts Variable Before Assignment (4 errors)

```
1. Read src/god-agent/cli/dissertation/tools/retrieval-orchestrator.ts
2. Initialize response variable before the try block: let response: ResponseType | undefined;
3. Add undefined checks before using response
```

### 6.6 Failing Test Fixes

```
1. leann-backend.test.ts: Update BackendSelector test expectations to match current API
   - getRecommendedBackend may have been renamed or removed
   - Performance tier expectations may need updating
2. persistence.test.ts: Update error message regex to include "Unsupported storage version"
3. writing-agent-routing.test.ts: Check if domain detection logic changed; update test expectations
4. multi-agent-handoff.test.ts: Investigate namespace isolation — may be a real bug in memory server
```

### Phase 6 Verification

```bash
npx tsc --noEmit 2>&1 | grep -c 'error TS'  # Target: 0 (excluding __experimental__)
npx vitest run --reporter=verbose  # Target: 0 failures
```

---

## Phase 7: Retrieval, UCM, Graph, and Remaining Subsystem Fixes

### 7.1 UsageTracker Unit Mismatch [RETR-C1]

**File**: `src/god-agent/core/ucm/token/usage-tracker.ts`
**Line**: 183

**Action**: One-line fix — multiply threshold by 100.

```
1. Read src/god-agent/core/ucm/token/usage-tracker.ts
2. Change: const warningThreshold = this.config.warningThreshold ?? 0.8;
   To: const warningThreshold = (this.config.warningThreshold ?? 0.8) * 100;
```

### 7.2 EpisodeStore Vector Insert Outside Transaction [RETR-C2]

**File**: `src/god-agent/core/episode/episode-store.ts`
**Lines**: 234-255

```
1. Read src/god-agent/core/episode/episode-store.ts
2. Move the vectorBackend.insert() call OUTSIDE the db.transaction callback
3. Only insert into vector backend AFTER the SQL transaction has committed successfully
```

### 7.3 FallbackGraph Write-Behind [RETR-C4]

**File**: `src/god-agent/core/graph-db/fallback-graph.ts`

**Action**: Add dirty-flag write-behind with atomic temp-then-rename on flush.

```
1. Read src/god-agent/core/graph-db/fallback-graph.ts
2. Add dirty flag and flush timer:

   private dirty = false;
   private flushTimer: NodeJS.Timeout | null = null;

   private scheduleFlush(): void {
     this.dirty = true;
     if (!this.flushTimer) {
       this.flushTimer = setTimeout(() => {
         this.flushTimer = null;
         this.save().catch(err => console.error('[FallbackGraph] Flush failed:', err));
       }, 500);
     }
   }

3. In save(), use atomic temp-then-rename:
   - Write to this.filePath + '.tmp'
   - Then rename to this.filePath

4. Replace await this.save() in each mutation method with this.scheduleFlush()
5. In close(), flush synchronously: if (this.dirty) await this.save();
6. In close(), clear the timer: if (this.flushTimer) clearTimeout(this.flushTimer);
```

### 7.4 SmartRetrievalLayer O(1) LRU [RETR-H1]

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts`
**Lines**: 1206-1235

```
1. Read src/god-agent/core/memory/lru-cache.ts to understand the existing LRU API
2. Read src/god-agent/retrieval/smart-retrieval-layer.ts
3. Replace the Map<string, CacheEntry> + linear eviction scan with LRUCache from core/memory
```

### 7.5 KG Load Race Fix [RETR-H8]

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts`
**Lines**: 670-708

```
1. Read src/god-agent/retrieval/smart-retrieval-layer.ts
2. Replace: private kgLoaded = false;
   With: private kgLoadPromise: Promise<void> | null = null;
3. In loadKnowledgeGraph():
   if (!this.kgLoadPromise) { this.kgLoadPromise = this._doLoadKG(); }
   return this.kgLoadPromise;
```

### 7.6 GPU Server Manager Async [RETR-H4]

**File**: `src/god-agent/core/gpu/gpu-server-manager.ts`

```
1. Read src/god-agent/core/gpu/gpu-server-manager.ts
2. Replace all execSync calls with promisified exec/execFile
3. Await results in the async callers
```

### 7.7 Rolling Context Division by Zero [UNIV-C1]

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts`
**Line**: 925

```
1. Read src/god-agent/universal/write-pipeline-orchestrator.ts around line 925
2. Change: const regularSections = subsections.length - (conclusionIdx >= 0 ? 1 : 0);
   To: const regularSections = Math.max(1, subsections.length - (conclusionIdx >= 0 ? 1 : 0));
```

### 7.8 Attention Reordering Fix [UNIV-H3]

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts`
**Lines**: 609-627

```
1. Read src/god-agent/universal/write-pipeline-orchestrator.ts around line 609
2. Fix the return to match the stated [high, ..., high] pattern:
   - Split top into two halves
   - Return [...topHalf1, ...mid, ...bottom, ...topHalf2]
3. Update the comment to match the actual implementation
```

### 7.9 Author Scrubber Paragraph Preservation [UNIV-M6]

**File**: `src/god-agent/universal/author-scrubber.ts`
**Lines**: 93, 127

```
1. Read src/god-agent/universal/author-scrubber.ts
2. Change split to not consume \n: split(/(?<=[.!?]) +(?=[A-Z""\u201c])/)
3. Or: track paragraph boundaries before split, restore after rejoin
```

### 7.10 Inline Validation Guard for Rolling Context [UNIV-H4]

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts`

```
1. Read src/god-agent/universal/write-pipeline-orchestrator.ts around the shouldUseInlineValidation assignment
2. Add !options.rollingContext to the guard:
   const shouldUseInlineValidation = (options.whitelistMode || options.rollingContext) ? false : ...
```

### Phase 7 Verification

```bash
npx vitest run tests/god-agent/retrieval/ --reporter=verbose
npx vitest run tests/god-agent/core/episode/ --reporter=verbose
npx vitest run tests/god-agent/core/graph-db/ --reporter=verbose
npx vitest run tests/god-agent/universal/ --reporter=verbose
```

---

## Phase 8: Architectural Refactoring (Run AFTER All Bug Fixes)

**Prerequisite**: Phases 1-7 must be complete and verified. This phase restructures the codebase from a stable, bug-free base. Refactoring a buggy codebase risks masking bugs or introducing new ones during restructuring.

### 8.1 Extract Shared Retrieval Logic

**Problem**: ~600 lines of retrieval logic (Phase 1a multi-query, 1b author supplementation, 1c diversity enforcement, 1d trimming, 1e attention reordering, 1f coverage validation, KU loading, edge loading, corpus constraint building) are duplicated between the legacy `write()` method and `writeV2()` in `write-pipeline-orchestrator.ts`. The stub file `stages/retrieval-stage.ts` was intended for this extraction but never completed.

```
1. Read src/god-agent/universal/write-pipeline-orchestrator.ts — identify the retrieval
   logic in write() (lines ~1933-2200) and writeV2() (lines ~3576-3786)
2. Read src/god-agent/universal/stages/retrieval-stage.ts (the existing stub)
3. Extract the shared retrieval sequence into stages/retrieval-stage.ts:
   - Accept: topic, options (typed — NOT Record<string, any>), SmartRetrievalLayer, DomainConfig
   - Return: { corpusChunks, knowledgeUnits, structuralEdges, corpusConstraint, seenIds, retrievalStats }
4. Update write() to call the extracted retrieval stage
5. Update writeV2() to call the same extracted retrieval stage
6. Delete the duplicated retrieval code from both methods
7. Fix the seenIds scope leak (UNIV-C3): the extracted stage returns seenIds
   explicitly, so Phase 4b+ supplementation can use it
```

### 8.2 Deprecate ICPPipelineAdapter → Migrate Dashboard to ICPOrchestrator

**Problem**: `ICPPipelineAdapter` (1,540 lines) is a parallel pipeline to `ICPOrchestrator` with independent quality gate logic. Fixes applied to one don't reach the other. The adapter exists solely to bridge the dashboard routes to the god-write pipeline, but it reimplements retrieval, generation, and validation independently.

**This is a two-step refactor. Complete and verify Step A before starting Step B.**

#### Step A: Extract Utility Functions

Extract shared utilities out of ICPPipelineAdapter into a standalone module. This step does NOT delete the adapter or change any dashboard routes — it only moves pure functions and updates imports.

```
1. Read src/god-agent/core/composition/icp-pipeline-adapter.ts — identify the standalone
   utility functions: investigateV1, trimChunkContent, reorderChunksForAttention,
   enforceSourceDiversity, validateRetrievalCoverage
2. Create src/god-agent/core/composition/retrieval-utils.ts — move each function there
3. Update icp-pipeline-adapter.ts to import from retrieval-utils.ts instead of defining locally
4. Update write-pipeline-orchestrator.ts to import from retrieval-utils.ts (replacing its
   own independent implementations of the same logic)
5. Search for any other files importing these functions from icp-pipeline-adapter.ts
   and update their imports
6. Run full test suite: npx vitest run --reporter=verbose
7. Commit: "refactor(audit): Phase 8.2A — extract retrieval utils from ICPPipelineAdapter"
```

#### Step B: Rewire Dashboard Routes and Delete Adapter [includes COMP-H1 resolution]

Now that the utilities live in a shared module, replace the adapter with ICPOrchestrator in the dashboard routes and delete the adapter file.

**COMP-H1 (Duplicate Quality Gates)**: ICPPipelineAdapter and ICPOrchestrator currently have independent quality gate sequences. Rather than creating a shared `quality-gate-pipeline.ts` class (which would be immediately obsoleted by this step), ensure that ICPOrchestrator's quality gate logic is complete and correct when it absorbs the adapter's responsibilities. During step 3 below, explicitly verify that every quality gate stage present in ICPPipelineAdapter has an equivalent in ICPOrchestrator before deleting the adapter.

```
1. Read src/god-agent/core/composition/icp-pipeline-adapter.ts — catalog its remaining
   public API: retrieve(), generate(), validate(), regenerateV2(), estimateCost()
   ALSO catalog its quality gate sequence (COMP-H1): identify each validation/quality
   stage and its ordering
2. Read src/god-agent/observability/icp-api-routes.ts — identify which adapter methods
   the dashboard routes call
3. For each dashboard route that calls ICPPipelineAdapter:
   a. Map the call to the equivalent ICPOrchestrator method
   b. If ICPOrchestrator lacks the method, add it as a thin wrapper
   c. COMP-H1 check: verify that every quality gate stage from the adapter exists
      in ICPOrchestrator. If any stage is missing, port it before proceeding
4. Update icp-api-routes.ts to instantiate ICPOrchestrator instead of ICPPipelineAdapter
5. Delete icp-pipeline-adapter.ts
6. Run full test suite + manually test dashboard ICP workflow end-to-end
7. Commit: "refactor(audit): Phase 8.2B — migrate dashboard to ICPOrchestrator, delete adapter (resolves COMP-H1)"
```

### 8.3 Document Router/Routing Boundary (ADR)

**Problem**: `core/router/` (25K LOC) handles LLM provider routing. `core/routing/` (6K LOC) handles agent-level routing. They duplicate vocabulary (task classification, capability tracking, failure classification) but serve genuinely different concerns. Merging them is not "remove duplication" — it's "design a new unified routing architecture."

```
1. Create docs/adr/001-router-vs-routing-boundary.md with:

   ## Context
   Two routing subsystems exist:
   - core/router/ — "Which LLM backend handles this request?" (provider selection,
     circuit breaking, rate limiting, cost tracking)
   - core/routing/ — "Which agent handles this task?" (DAI-001 agent selection,
     capability indexing, pipeline generation)

   ## Decision
   These are separate architectural layers. core/routing/ selects the AGENT;
   core/router/ selects the LLM BACKEND for that agent's API calls. They should
   NOT be merged. However, shared concepts should be deduplicated:

   ## Deduplication targets
   - Task classification: router/task-classifier.ts vs routing/task-analyzer.ts
     → Extract shared TaskClassification type; routing/ calls router/'s classifier
   - Failure classification: router/retry-handler.ts error classification vs
     routing/failure-classifier.ts → Merge into a single failure taxonomy
   - Outcome tracking: router/outcome-tracker.ts vs routing/routing-learner.ts
     → Routing learner should consume router's outcome events, not duplicate tracking

2. Implement the deduplication targets:

   IMPORTANT: This project uses tsconfig path aliases (@god-agent/* → src/god-agent/*).
   There is NO existing core/shared/ or core/types/ directory. Place shared types in
   the existing router subsystem (the lower-level layer that routing/ depends on):

   a. Create core/router/shared-types.ts with TaskClassification and FailureTaxonomy types
   b. Have routing/task-analyzer.ts import TaskClassification from @god-agent/core/router/shared-types
   c. Have routing/failure-classifier.ts import FailureTaxonomy from @god-agent/core/router/shared-types
   d. Wire routing-learner.ts to subscribe to router outcome events
   e. Do NOT create a new core/shared/ directory — it has no path alias and would
      require tsconfig.json changes that risk breaking all existing imports
```

### 8.4 Type `writeV2` Options Parameter

**Problem**: `writeV2` accepts `options: Record<string, any>`, discarding all type safety from the public `write()` method's 30+ typed fields.

```
1. Read src/god-agent/universal/write-pipeline-orchestrator.ts
2. Extract the options type from write()'s parameter list into a named interface:
   export interface WriteOptions { ... }
3. Use WriteOptions in both write() and writeV2() signatures
4. Fix any type errors that surface in writeV2() — these are real bugs hidden by Record<string, any>
```

### Phase 8 Verification

```bash
npx tsc --noEmit 2>&1 | grep -c 'error TS'  # Should decrease (fewer as-any casts needed)
npx vitest run --reporter=verbose  # Full suite
# Manually test: dashboard ICP pipeline end-to-end after ICPPipelineAdapter removal
# Manually test: god-write with both legacy and v2 pipeline versions
```

---

## Quick Reference: Fix Priority by Impact

| Priority | Fix IDs | Impact | Effort |
|----------|---------|--------|--------|
| P0 — NOW | CLI-C1, CLI-C2 | Security: command injection, path traversal | 30 min |
| P0 — NOW | WRIT-C3, COMP-H2 | Citation pipeline: year=0 + minRelevance regression | 15 min |
| P0 — NOW | RETR-C1 | Budget alerting completely broken (unit mismatch) | 5 min |
| P0 — NOW | UNIV-C1 | Division by zero in rolling context | 5 min |
| P1 — This Week | REAS-C1, REAS-C2, ROUT-C1, ROUT-C2 | Race conditions in training + circuit breaker | 2 hrs |
| P1 — This Week | COMP-C3 | Abort signal propagation (Stream Deck) | 1 hr |
| P1 — This Week | WRIT-C4 (fixes C1) | Citation enforcer position corruption (root cause) | 1 hr |
| P1 — This Week | RETR-C2, RETR-C4, RETR-H8 | Episode store atomicity + graph I/O + KG race | 2 hrs |
| P2 — Next Sprint | ROUT-H7 | Anthropic SDK in router (WSL2 daemon failure) | 1 hr |
| P2 — Next Sprint | All Phase 5 | Writing quality improvements | 2 hrs |
| P2 — Next Sprint | RETR-H1, UNIV-H3, UNIV-H4 | LRU cache, attention reorder, inline validation guard | 2 hrs |
| P3 — Backlog | Phase 6 | TypeScript errors, test fixes | 3 hrs |
| P3 — Backlog | Phase 7 remaining | GPU async, author scrubber, remaining subsystem fixes | 2 hrs |
| P4 — After Stabilization | Phase 8 | Architectural refactoring from stable base | 4-6 hrs |

---

## How to Execute

Tell Claude Code:

```
Read plans/god-agent-audit-implementation-guide.md and execute Phase N.
Do not modify any files outside the scope described for that phase.
After completing each fix, run the verification command.
Commit with message: "fix(audit): Phase N — [brief description]"
```

Replace N with the phase number (1-8).
