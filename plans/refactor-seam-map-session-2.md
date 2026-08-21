# PASS 1 — Session 2: universal-agent.ts Seam Map

**Date**: 2026-02-11
**Scope**: `src/god-agent/universal/universal-agent.ts` (5,981 lines, ~80 methods)
**Primary Deliverable**: Extraction seam map (per R5)

---

## File Overview

- **Total lines**: 5,981
- **Public methods**: ~30
- **Private methods**: ~50
- **Largest method**: `write()` at ~934 LOC (lines 3306-4239)
- **Architectural complexity**: 10/10 — integrates 20+ external systems
- **Critical external deps**: GodAgent, SmartRetrievalLayer, QualityIntegration, CitationEnforcer, ProseSanitizer, StyleProfileManager, TrajectoryBridge, RoutingEngine, AgentSelector

---

## Extraction Candidates (Seam Map)

### SEAM-1: WritePipeline

| Field | Value |
|-------|-------|
| **Candidate name** | `WritePipelineOrchestrator` |
| **Line range** | 3306-4239 (`write()`), 2157-2225 (`buildCorpusConstraintPromptText`), 2234-2274 (`buildCorpusContextBlock`), 2280-2335 (`generateViaClaudeCode/AnthropicAPI`), 2342-2394 (`generateMockAcademicContent`), 5588-5708 (`scrubNonCorpusAuthors`, `buildCorpusSourcesFromChunks`), 5551-5578 (`extractKeyPointsFromTopic`) |
| **Inputs** | `topic: string`, `options: WriteOptions` (30+ fields), `this.smartRetrieval`, `this.qualityIntegration`, `this.styleProfileManager`, `this.trajectoryBridge`, `this.ucmClient`, `this.config`, `this.interactionStore` |
| **Outputs** | `WriteResult` with content, metadata, quality scores, citation info, endnotes |
| **Side effects** | Corpus retrieval (ChromaDB via SmartRetrievalLayer), Anthropic API calls, Claude CLI spawns, DESC episode injection/storage, quality gauntlet evaluation, citation enforcement, prose sanitization, staged composition, endnote generation, source verification, source acquisition, knowledge storage, trajectory feedback |
| **Internal dependencies** | `injectDESCEpisodes()`, `storeDESCEpisode()`, `embed()`, `maybeStorePattern()`, `assessQuality()`, `generateId()`, `log()`, `ensureInitialized()` |
| **Locking tests needed** | E2E write test with corpus, citation enforcement test, inline validation test, endnote generation test, staged composition test, author scrubbing test |
| **Risk** | **HIGH** — This is the core pipeline. 934-line method with ~25 branch points and 6 levels of nesting. Extraction requires careful dependency injection of ~10 subsystems. |
| **LOC** | ~1,200 (write + all helpers) |
| **Priority** | **#1 — CRITICAL** |

### SEAM-2: KnowledgeManager

| Field | Value |
|-------|-------|
| **Candidate name** | `KnowledgeOperations` |
| **Line range** | 4454-4998 |
| **Methods** | `storeKnowledge()` (4454-4528), `retrieveRelevant()` (4533-4552), `isChunkedEntry()` (4569-4583), `retrieveKnowledge()` (4597-4641), `reconstructChunkedKnowledge()` (4651-4725), `contentToKnowledgeEntry()` (4734-4747), `getKnowledgeChunks()` (4759-4812), `reconstructKnowledge()` (4823-4853), `queryKnowledge()` (4867-4961), `findMissingChunkIndices()` (4967-4981), `maybeStorePattern()` (4986-4998), `updateUsageStats()` (5000-5004) |
| **Inputs** | `KnowledgeEntry` partials, query strings, `this.agent` (GodAgent), `this.knowledgeChunker`, `this.interactionStore`, `this.domainExpertise` |
| **Outputs** | Knowledge entry IDs, KnowledgeEntry objects, KnowledgeChunk arrays, reconstructed content |
| **Side effects** | Embeds text (embedding API), stores/queries GodAgent patterns, updates InteractionStore, updates domain expertise tracking |
| **Internal dependencies** | `embed()`, `generateId()`, `log()` |
| **Locking tests needed** | `knowledge-chunker.test.ts` (exists), `persistence.test.ts` (exists), chunk storage/retrieval test, query deduplication test |
| **Risk** | **MEDIUM** — Well-bounded TASK-CHUNK operations. Clean inputs/outputs. Only dependency is on `embed()` and `GodAgent.store()/query()`. |
| **LOC** | ~550 |
| **Priority** | **#2 — HIGH** |

### SEAM-3: AuthorScrubber

| Field | Value |
|-------|-------|
| **Candidate name** | `AuthorScrubberService` |
| **Line range** | 5588-5708 |
| **Methods** | `scrubNonCorpusAuthors()` (5588-5681), `buildCorpusSourcesFromChunks()` (5687-5708) |
| **Inputs** | `content: string`, `constraint: CorpusConstraint`, `ContextChunk[]` |
| **Outputs** | `{content, removedCount, removedAuthors, contexts}`, `CorpusSource[]` |
| **Side effects** | None — pure function |
| **Internal dependencies** | None |
| **Locking tests needed** | Author scrubbing unit test (regex patterns, false positive handling) |
| **Risk** | **LOW** — Pure function with zero side effects. Easiest extraction target. |
| **LOC** | ~120 |
| **Priority** | **#3 — HIGH (easy win)** |

### SEAM-4: StyleProfileFacade

| Field | Value |
|-------|-------|
| **Candidate name** | `StyleProfileFacade` |
| **Line range** | 5732-5840 |
| **Methods** | `learnStyle()` (5742-5777), `listStyleProfiles()` (5782-5787), `setActiveStyleProfile()` (5792-5806), `getActiveStyleProfile()` (5811-5813), `getStyleCharacteristics()` (5818-5823), `getStyleStats()` (5828-5833), `getStyleProfileManager()` (5838-5840) |
| **Inputs** | `name`, `textSamples[]`, `profileId`, `this.styleProfileManager` |
| **Outputs** | `StoredStyleProfile`, `StyleProfileMetadata[]`, `StyleCharacteristics`, stats objects |
| **Side effects** | Creates/persists style profiles via StyleProfileManager |
| **Internal dependencies** | `log()` |
| **Locking tests needed** | `style-injector.test.ts` (exists), style profile lifecycle test |
| **Risk** | **LOW** — Thin delegation layer over StyleProfileManager. |
| **LOC** | ~110 |
| **Priority** | **#4 — MEDIUM** |

### SEAM-5: DESCEpisodeManager

| Field | Value |
|-------|-------|
| **Candidate name** | `DESCEpisodeManager` |
| **Line range** | 5008-5109 |
| **Methods** | `injectDESCEpisodes()` (5018-5049), `storeDESCEpisode()` (5058-5091), `_detectMode()` (5094-5108) |
| **Inputs** | `prompt: string`, context objects, `this.ucmClient`, `this.config` |
| **Outputs** | `{augmentedPrompt, episodesUsed, episodeIds}`, void, `AgentMode` |
| **Side effects** | UCM daemon calls (inject solutions, store episode) |
| **Internal dependencies** | `log()` |
| **Locking tests needed** | DESC injection test, episode storage test, mode detection test |
| **Risk** | **LOW** — Well-bounded. Only talks to UCM client. |
| **LOC** | ~100 |
| **Priority** | **#5 — MEDIUM** |

### SEAM-6: TaskRouter

| Field | Value |
|-------|-------|
| **Candidate name** | `TaskRoutingOrchestrator` |
| **Line range** | 1904-2135 (`task()`), 1403-1794 (`executeTaskDefault()`) |
| **Methods** | `task()` (1904-2135), `executeTaskDefault()` (1403-1794) |
| **Inputs** | `description: string`, `ITaskOptions`, agent selection, routing engine, pipeline generator |
| **Outputs** | `ITaskResult`, `TaskExecutionResult` |
| **Side effects** | Hook execution (pre/post-tool), vLLM provider calls, Claude provider calls, Claude CLI spawns, quality assessment, DESC episode injection/storage, routing feedback |
| **Internal dependencies** | `injectDESCEpisodes()`, `storeDESCEpisode()`, `assessQuality()`, `embed()`, `log()` |
| **Locking tests needed** | `task-routing.test.ts` (exists), `universal-agent-router.test.ts` (exists), provider fallback chain test |
| **Risk** | **HIGH** — `executeTaskDefault()` is 392 LOC with complex fallback chain (vLLM → Claude → CLI). Deeply coupled to hooks system. |
| **LOC** | ~620 |
| **Priority** | **#6 — MEDIUM (high risk)** |

### SEAM-7: LearningFeedback

| Field | Value |
|-------|-------|
| **Candidate name** | `LearningFeedbackManager` |
| **Line range** | 4309-4445 |
| **Methods** | `feedback()` (4322-4385), `learnFromInteraction()` (4390-4404), `reinforcePattern()` (4409-4427), `weakenPattern()` (4432-4445) |
| **Inputs** | Feedback ID/rating, `Interaction`, `this.interactionStore`, `this.trajectoryBridge`, `this.agent` |
| **Outputs** | `FeedbackResult`, void |
| **Side effects** | Updates InteractionStore, submits to TrajectoryBridge/SonaEngine, stores/modifies patterns |
| **Internal dependencies** | `embed()`, `storeKnowledge()` |
| **Locking tests needed** | Feedback submission test, pattern reinforcement test |
| **Risk** | **MEDIUM** — Depends on both KnowledgeManager and TrajectoryBridge. Should extract after SEAM-2. |
| **LOC** | ~140 |
| **Priority** | **#7 — LOW** |

### SEAM-8: CodeGenerator (DEAD)

| Field | Value |
|-------|-------|
| **Candidate name** | N/A — Dead code |
| **Line range** | 5111-5367 |
| **Methods** | `_generateCode()` (5111-5198), `buildPatternContext()` (5203-5215), `extractCodeFromResponse()` (5220-5230), `generateFallbackCode()` (5237-5315), `getRelevantContext()` (5320-5367) |
| **Status** | **DEAD CODE** — None of these methods are called anywhere in the codebase. They are remnants of the pre-DAI-001 code generation path. |
| **Risk** | **LOW** — Safe to delete entirely. |
| **LOC** | ~260 |
| **Action** | **DELETE** |

### SEAM-9: WritingGenerator Wrapper (DEAD)

| Field | Value |
|-------|-------|
| **Candidate name** | N/A — Dead code |
| **Line range** | 5371-5492 |
| **Methods** | `_generateWriting()` (5371-5421), `gatherWritingContext()` (5426-5462), `estimateWordCount()` (5467-5474), `_synthesize()` (5477-5492) |
| **Status** | **DEAD CODE** — None of these methods are called. Pre-DAI-001 writing generation path superseded by `write()`. Note: `estimateWordCount()` IS called at line 5387 from `_generateWriting()`, but since `_generateWriting()` itself is never called, the entire chain is dead. |
| **Risk** | **LOW** — Safe to delete entirely. |
| **LOC** | ~120 |
| **Action** | **DELETE** |

### SEAM-10: ProcessMode Dispatch (DEAD)

| Field | Value |
|-------|-------|
| **Candidate name** | N/A — Dead code |
| **Line range** | 5495-5519 |
| **Methods** | `_processCode()` (5495-5499), `_processResearch()` (5501-5505), `_processWrite()` (5507-5511), `_processGeneral()` (5513-5519) |
| **Status** | **DEAD CODE** — None of these methods are called anywhere. They are stub dispatchers from the pre-DAI-001 architecture. |
| **Risk** | **LOW** — Safe to delete entirely. |
| **LOC** | ~25 |
| **Action** | **DELETE** |

### SEAM-11: StatsCollector

| Field | Value |
|-------|-------|
| **Candidate name** | `StatsCollector` |
| **Line range** | 5842-5947 |
| **Methods** | `getStats()` (5847-5893), `calculateLearningEffectiveness()` (5898-5940), `getStatus()` (5945-5947) |
| **Inputs** | `this.agent`, `this.interactionStore`, SonaEngine |
| **Outputs** | `UnifiedLearningStats`, status object |
| **Side effects** | None — read-only |
| **Internal dependencies** | None |
| **Locking tests needed** | Stats accuracy test |
| **Risk** | **LOW** — Read-only aggregation. |
| **LOC** | ~105 |
| **Priority** | **#8 — LOW** |

---

## Dead Method Summary

| Method | Lines | LOC | Called? | Verdict |
|--------|-------|-----|--------|---------|
| `_generateCode()` | 5111-5198 | 88 | NEVER | DELETE |
| `buildPatternContext()` | 5203-5215 | 13 | Only by `_generateCode` (dead) | DELETE |
| `extractCodeFromResponse()` | 5220-5230 | 11 | Only by `_generateCode` (dead) | DELETE |
| `generateFallbackCode()` | 5237-5315 | 79 | Only by `_generateCode` (dead) | DELETE |
| `getRelevantContext()` | 5320-5367 | 48 | Only by `generateFallbackCode` (dead) | DELETE |
| `_generateWriting()` | 5371-5421 | 51 | NEVER | DELETE |
| `gatherWritingContext()` | 5426-5462 | 37 | Only by `_generateWriting` (dead) | DELETE |
| `estimateWordCount()` | 5467-5474 | 8 | Only by `_generateWriting` (dead) | DELETE |
| `_synthesize()` | 5477-5492 | 16 | NEVER | DELETE |
| `_processCode()` | 5495-5499 | 5 | NEVER | DELETE |
| `_processResearch()` | 5501-5505 | 5 | NEVER | DELETE |
| `_processWrite()` | 5507-5511 | 5 | NEVER | DELETE |
| `_processGeneral()` | 5513-5519 | 7 | NEVER | DELETE |
| `_detectMode()` | 5094-5108 | 15 | NEVER | DELETE |
| `writePaper()` | 4252-4307 | 56 | NEVER (0 external callers) | DELETE |
| **Total dead** | | **~444 LOC** | | |

---

## Option Handling Inconsistency Analysis

### Pattern: `||` vs `??` for defaults

**Uses `||` (treats `0`, `''`, `false` as falsy — potentially incorrect):**

| Line | Code | Risk |
|------|------|------|
| 3456 | `collections: options.corpusCollections \|\| []` | LOW — empty array intended |
| 3457 | `maxChunks: options.corpusChunkCount \|\| 15` | **MEDIUM** — `0` would default to `15` |
| 3458 | `minRelevance: options.corpusMinRelevance \|\| 0.75` | **MEDIUM** — `0` would default to `0.75` |
| 3819 | `mode: options.citationEnforcementMode \|\| 'auto-correct'` | LOW — string, empty not expected |
| 3820 | `minPassRate: options.citationMinPassRate \|\| 0.85` | **MEDIUM** — `0` would default to `0.85` |
| 3821 | `maxHallucinations: options.citationMaxHallucinations \|\| 3` | **HIGH** — `0` means "allow zero hallucinations" but `||` would default to `3` |
| 4275 | `options.styleProfileId \|\| activeProfile?.metadata.id` | LOW — empty string not expected |

**Uses `??` (correct nullish coalescing — 100+ instances):**
- All constructor defaults (lines 774-800)
- All option defaults in `ask()`, `research()`, `write()` (most lines)
- All knowledge chunk reconstruction (lines 4659-4722)

**Recommendation**: Lines 3457, 3458, 3820, 3821 should be changed from `||` to `??` to correctly handle `0` values. Line 3821 is the highest risk — a user passing `maxHallucinations: 0` to mean "zero tolerance" would silently get `3` allowed.

---

## write() Control Flow Analysis

**Lines**: 3306-4239 (934 LOC)
**Cyclomatic complexity**: ~35 (estimated from branch points)
**Max nesting depth**: 6 levels

### Major Branch Points (25 primary):

1. **L3365**: `if (dataSourceMode === 'corpus')` — corpus-only mode restrictions
2. **L3400**: `if (this.styleProfileManager)` — style profile injection
3. **L3428**: `if (this.trajectoryBridge)` — trajectory creation
4. **L3452**: `if (options.useCorpus)` — corpus retrieval
5. **L3485**: `if (corpusChunks.length > 0)` — corpus constraint building
6. **L3525**: `if (corpusChunks.length > 0)` — corpus context block
7. **L3537**: `if (citationBudgetResult.sufficient)` — citation budget check
8. **L3554**: `if (dataSourceMode === 'corpus')` — fail-fast check
9. **L3607**: `if (shouldUseInlineValidation && hasUsableCorpus && !options.forceExecute)` — inline validation path
10. **L3685**: `if (inlineValidationResult.document.length > 0)` — inline success check
11. **L3701**: `if (usedInlineValidation && ...)` — used inline result
12. **L3712**: `if (options.forceExecute)` — force execute / mock path
13. **L3757**: `if (sanitizationResult.artifactCount > 0)` — sanitization reporting
14. **L3781**: `if (this.qualityIntegration)` — quality gauntlet
15. **L3812**: `if (corpusConstraint && corpusChunks.length > 0)` — citation enforcement
16. **L3829**: `if (citationEnforcementResult.action === 'pass')` — enforcement result
17. **L3859**: `if (citationEnforcementResult && ... !== 'pass')` — post-enforcement sanitization
18. **L3875**: `if (corpusConstraint && corpusConstraint.sources.length > 0)` — author scrubbing
19. **L3905**: try/catch — error handling for scrubbing
20. **L3926**: `if (shouldUseStagedComposition && !options.forceExecute)` — staged composition
21. **L3990**: `if (options.enableEndnotes && ...)` — endnote generation
22. **L4066**: `if (options.verifySources)` — source verification
23. **L4082**: `if (options.acquireMissing && ...)` — source acquisition
24. **L4127**: `if (!qualityValidation && this.config.autoLearn)` — quality fallback
25. **L4137**: `if (this.config.autoLearn && this.trajectoryBridge && trajectoryId)` — trajectory feedback

### External Calls (18):
1. `injectDESCEpisodes()` — UCM daemon
2. `SmartRetrievalLayer.retrieveContext()` — ChromaDB
3. `buildCorpusConstraint()` — CorpusConstraintBuilder
4. `buildCorpusConstraintPromptText()` — local
5. `buildCorpusContextBlock()` — local
6. `calculateCitationBudget()` — CitationBudget
7. `createInlineValidationOrchestrator()` — InlineValidationOrchestrator factory
8. `InlineValidationOrchestrator.generateWithInlineValidation()` — Anthropic API
9. `generateViaClaudeCode()` — Claude CLI subprocess
10. `generateViaAnthropicAPI()` — Anthropic API direct
11. `ProseSanitizer.sanitize()` — local
12. `QualityIntegration.validateAndRevise()` — quality gauntlet
13. `CitationEnforcer.enforce()` — citation validation
14. `scrubNonCorpusAuthors()` — local
15. `compositionOrchestrator.composeChapter/composeSimple()` — staged composition
16. `generateEndnotes()` — endnote generation
17. `SourceVerificationLayer.verifyCitationsAgainstCorpus()` — verification
18. `MissingSourceAcquisitionLayer.acquireSources()` — acquisition

---

## Extraction Priority & Sequencing

### Phase 1 — Dead Code Removal (Tranche F)
Delete dead methods (SEAM-8, 9, 10 + `writePaper`, `_detectMode`). **~444 LOC removed, zero risk.**

### Phase 2 — Easy Extractions (Tranche G)
Extract in order:
1. **AuthorScrubber** (SEAM-3) — pure function, zero deps
2. **DESCEpisodeManager** (SEAM-5) — only UCM client dep
3. **StyleProfileFacade** (SEAM-4) — thin delegation
4. **StatsCollector** (SEAM-11) — read-only

**~435 LOC extracted, low risk.**

### Phase 3 — Medium Extractions (Tranche H)
5. **KnowledgeManager** (SEAM-2) — well-bounded TASK-CHUNK ops
6. **LearningFeedback** (SEAM-7) — depends on SEAM-2

**~690 LOC extracted, medium risk.**

### Phase 4 — Hard Extractions (Tranche I)
7. **TaskRouter** (SEAM-6) — complex fallback chain, hooks
8. **WritePipeline** (SEAM-1) — the 934-line monster

**~1,820 LOC extracted, high risk.**

### Expected Result
After all 4 phases: **universal-agent.ts drops from 5,981 → ~2,600 lines** (57% reduction).
Remaining: constructor, initialize, ask(), code(), research(), prepareCodeTask(), prepareWriteTask(), accessors, shutdown.

---

## Circular Dependency Check

**Result**: No circular dependencies found. `universal-agent.ts` imports from many modules, but none of those modules import from `universal-agent.ts`. The dependency graph is a clean DAG radiating outward from universal-agent.ts.
