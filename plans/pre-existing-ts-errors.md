# Pre-Existing TypeScript Errors — Analysis & Fix Plan

**Total errors**: 169 (across ~20 files, excluding node_modules)
**Date**: 2026-02-17

---

## Error Categories

### Category 1: StructuredLogger `.log` is private (TS2341) — 40 errors

**Files**: `__experimental__/*.ts`, `context-tier-manager.ts`, `context-manager.ts`

**Root cause**: `StructuredLogger.log()` is declared `private` at `core/observability/logger.ts:188`. Multiple modules call `this.logger.log(level, msg)` directly instead of using the public wrappers (`info()`, `warn()`, `error()`, `debug()`).

**Fix**: Change `private log(...)` to `protected log(...)` in `logger.ts:188`. This allows subclasses and composition consumers to call `log()` while still hiding it from external callers. Alternatively, replace all `.log(level, msg)` calls with the appropriate public method.

**Recommended**: Change to `protected`. One-line fix, 40 errors resolved.

---

### Category 2: StyleCharacteristics missing properties (TS2339/TS2353) — 22 errors

**Files**: `__experimental__/enhanced-quality-integration.ts`, `__experimental__/style-drift-detector.ts`, `cli/style/enhanced-style-drift-detector.ts`

**Root cause**: These files reference old property names (`avgSentenceLength`, `avgWordLength`, `formalityScore`, `avgParagraphLength`) that were refactored into nested sub-objects on `StyleCharacteristics`. The interface now uses:
- `sentences: SentenceMetrics` (has `averageLength`)
- `vocabulary: VocabularyMetrics`
- `structure: StructureMetrics` (has `averageParagraphLength`)
- `tone: ToneMetrics` (has `formalityScore`)

**Fix**: Update property accesses in all three files:
- `avgSentenceLength` → `sentences.averageLength`
- `avgWordLength` → `vocabulary.averageWordLength`
- `formalityScore` → `tone.formalityScore`
- `avgParagraphLength` → `structure.averageParagraphLength`

Also fix the object literal constructions that use old property names.

**Effort**: Medium. Need to read each file to map old→new property paths.

---

### Category 3: section-orchestrator.ts interface drift (TS2339/TS2322/TS18048) — 26 errors

**File**: `cli/dissertation/section-orchestrator.ts`

**Root causes** (multiple):

1. **`ContextChunk` missing `.text`, `.source`** (lines 1842-1845, 1141-1150): Interface changed. Need to check current `ContextChunk` shape and update accesses.

2. **`QualityIssue.location` missing `chapterId`** (lines 1309-1310): Object literals create `{ paragraphIndex, lineNumber }` but `IssueLocation` requires `chapterId`. Add the missing property.

3. **`RevisionRequest` missing `.gauntletResult`, `.currentText`** (lines 1375-1393): Interface changed. Need to add these fields to the interface or update callers.

4. **`StoredStyleProfile` missing `.deepStyle`** (line 1476): Property not on the stored profile type. May need to add as optional or access via a different path.

5. **`TieredContext.tier1Hot` missing `styleInjection`, `tokenCount`** (line 2153): Constructor object literal is incomplete.

6. **`SectionContext` missing `.corpusChunks`** (lines 2225-2251): Property doesn't exist on the type.

7. **`EndnoteGeneratorConfig` mismatch** (line 2211): Passing `CorpusSuggestion[]` where config expected.

8. **`retrievalStats` possibly undefined** (lines 722-725): Needs null-safety (`?.` or `!.`).

**Fix**: This file has heavy interface drift — its internal types have diverged from the shared types. A targeted pass updating each call site is needed.

**Effort**: High. 26 errors across ~15 distinct issues.

---

### Category 4: icp-api-routes.ts type mismatches (TS2307/TS2345/TS2551/etc.) — 24 errors

**File**: `observability/icp-api-routes.ts`

**Root causes**:

1. **Missing module `claim-map.js`** (lines 1298-1299, 1490-1491): `../../cli/composition/sir/claim-map.js` doesn't exist. The SIR (Structured Interpretation & Reasoning) module was likely moved or renamed. Need to find the correct import path.

2. **`BlockReason` vs `{ facet_id, reason }`** (lines 1388, 1521): `BlockReason` type doesn't have a `reason` field. Check actual `BlockReason` interface and update the type annotation.

3. **`atom_id` vs `atom_ids`** (lines 1635, 1751): Singular `atom_id` doesn't exist on `ClaimBinding`; it's `atom_ids` (plural). Simple typo fix.

4. **`revision_guidance` doesn't exist on gauntlet type** (lines 2079, 2301, 2351): The gauntlet results type doesn't include this field. Need to add it to the type or remove from code.

5. **`revision_history` doesn't exist on `QualityGateResults`** (lines 2394-2400): Missing property. Add to interface.

6. **`gauntlet_revision` not in `ICPEventAction`** (line 2405): Missing action type. Add to union.

7. **`"warning"` not in `ICPEventSeverity`** (line 2408): Severity union has `'warn'` not `'warning'`. Change to `'warn'`.

8. **`"quality"` not in `ICPEventCategory`** (line 2410): Category union doesn't include `'quality'`. Add it or use `'analytics'`.

9. **`"primary"` not in `SourceKind`** (line 2514): `SourceKind` is `'CORPUS' | 'EXTERNAL'`. Change to `'CORPUS'`.

10. **`RunManifestConfig` requires `runsDir`, `policiesDir`** (lines 1847, 3291): Empty `{}` passed where config is required.

11. **`"analytics"` vs `"strict"` comparison** (line 1793): Comparing string literal types that can never overlap.

**Fix**: Mix of type union additions, typo fixes, and import path corrections.

**Effort**: Medium-high. Many individual fixes but each is straightforward.

---

### Category 5: pipeline-daemon-service.ts signature mismatches (TS2305/TS2554) — 7 errors

**File**: `cli/pipeline-daemon-service.ts`

**Root cause**: `completeAndNext` is no longer exported from `coding-pipeline-cli.js`, and several function calls have wrong argument counts.

**Fix**: Update imports and function call signatures to match the current API.

---

### Category 6: retrieval-orchestrator.ts variable used before assigned (TS2454) — 4 errors

**File**: `cli/dissertation/tools/retrieval-orchestrator.ts`

**Root cause**: `let response` declared without initializer, used in a try/catch block where assignment may not have happened.

**Fix**: Initialize with `let response: T | undefined` and add null check, or restructure the try/catch.

---

### Category 7: Misc individual errors — 10 errors

| File | Error | Fix |
|------|-------|-----|
| `llm-clients.ts:70` | `string | null` not assignable to `string` | Add `!` or null check |
| `llm-clients.ts:150-151` | `.function` missing on tool call type | OpenAI SDK type change, use type guard |
| `enhanced-hybrid-retriever.ts:244` | `modelEndpoint` optional vs required | Provide default value |
| `cli/retrieval/index.ts:99` | `CitationGraphJSON` → `CitationGraph` | Fix export name |
| `cli/statistics/index.ts:1` | Missing `.js` extension | Add `.js` to relative import |
| `register-enforcer.ts:226` | Duplicate object key | Remove one |
| `entailment-rules.ts:562` | `rationale` optional vs required | Add `rationale: ''` default |
| `pdf-cli.ts:12` | Missing `chalk` module | `npm install chalk` or use alternative |
| `composition-orchestrator.ts:186` | `recommendedWordCount` missing | Check `CitationBudgetResult` interface |
| `quality-integration.ts:283,290,331` | `this.log` doesn't exist | Add logger property |
| `write-pipeline-orchestrator.ts:876` | Agent selection type mismatch | Provide required `ILoadedAgentDefinition` fields |
| `llm-claim-provider.ts:164-165` | `.toLowerCase()` on `never` | Dead code — unreachable filter branch |
| `feedback-learning.ts:367`, `satisfaction-tracker.ts:435` | `storeMetadata` missing on `TrajectoryBridge` | Add method or use alternative |

---

## Implementation Priority

### Priority 1: Quick wins (resolve 50+ errors)

1. **`logger.ts` — change `private log` to `protected log`** — Resolves ~40 TS2341 errors across 8 files.
2. **`icp-types.ts` — add missing union members** — Add `'gauntlet_revision'` to `ICPEventAction`, `'warning'` to `ICPEventSeverity` (or change callers to `'warn'`), `'quality'` to `ICPEventCategory`. Also add `revision_guidance` and `revision_history` to `QualityGateResults.gauntlet`.

### Priority 2: Type corrections (resolve ~30 errors)

3. **`icp-api-routes.ts` — targeted fixes** — Fix `atom_id` → `atom_ids`, `'primary'` → `'CORPUS'`, add `RunManifestConfig` defaults, fix module import paths.
4. **Style drift detector files** — Map old `StyleCharacteristics` property names to new nested structure.

### Priority 3: Larger refactors (resolve ~40 errors)

5. **`section-orchestrator.ts`** — Fix interface drift across 15+ call sites.
6. **`pipeline-daemon-service.ts`** — Update function signatures.
7. **`retrieval-orchestrator.ts`** — Fix uninitialized variable pattern.

### Priority 4: Low-value / __experimental__ (can defer)

8. **`__experimental__/*.ts`** — These are experimental modules. Fix StyleCharacteristics and StructuredLogger issues.
9. **Misc individual fixes** — Each resolves 1-2 errors.

---

## Files Modified

| File | Error Count | Priority |
|------|-------------|----------|
| `core/observability/logger.ts` | 0 (enables 40 fixes) | P1 |
| `core/composition/icp-types.ts` | 0 (enables 10+ fixes) | P1 |
| `observability/icp-api-routes.ts` | 24 | P2 |
| `__experimental__/style-drift-detector.ts` | 11 | P4 |
| `__experimental__/enhanced-quality-integration.ts` | 14 | P4 |
| `cli/style/enhanced-style-drift-detector.ts` | 12 | P2 |
| `cli/context/context-tier-manager.ts` | 13 | P1 (via logger fix) |
| `universal/context-manager.ts` | 7 | P1 (via logger fix) |
| `cli/dissertation/section-orchestrator.ts` | 26 | P3 |
| `cli/pipeline-daemon-service.ts` | 7 | P3 |
| `cli/dissertation/tools/retrieval-orchestrator.ts` | 4 | P3 |
| `universal/write-pipeline-orchestrator.ts` | 6 | P3 |
| `universal/quality-integration.ts` | 4 | P3 |
| Other (11 files, 1-2 errors each) | ~15 | P4 |
