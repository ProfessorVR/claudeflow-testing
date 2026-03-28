# ICP ↔ God-Write Convergence Report (Implementation-Ready)

**Date:** 2026-03-27
**Branch:** `writing-pipeline-v2`
**Status:** APPROVED — Awaiting execution authorization
**Constraint:** God-write CLI is read-only. No modifications to existing CLI orchestration.

---

## 1. Executive Summary

The god-write CLI and the ICP dashboard are two parallel writing pipelines that share some infrastructure (ProseSanitizer, EndnoteGenerator, ConfigManager, EntailmentRules) but diverge significantly in orchestration, retrieval, generation, and validation. The CLI has accumulated **56+ fixes** and powerful features (multi-step drafting, rolling context, investigateV1, gold standard prompt building, author scrubbing, APA stripping) that the ICP dashboard does not leverage. Conversely, the ICP has unique strengths (faceted evidence curation, atom-level binding, trust tiers, OCR correction UI, PDF viewer, event audit trail) that the CLI lacks.

**Goal:** Bring the ICP dashboard up to feature parity with god-write's generation and validation pipeline by building an **ICPPipelineAdapter** that imports god-write utilities as read-only dependencies, while preserving all existing ICP interactive features. The CLI remains strictly untouched.

---

## 2. Architectural Decision: ICPPipelineAdapter

### Why Not Merge Orchestrators

The original report proposed merging `WritePipelineOrchestrator` and `ICPOrchestrator` into a unified backend. This is **rejected** because:

- The CLI has 56+ battle-tested fixes. Modifying it risks regressions in a reliable tool.
- The CLI is a batch pipeline (stages 1→8 sequential). The ICP is interactive and stateful (user pauses between stages to verify, bind, review). These are fundamentally different execution models.
- Merging creates bidirectional coupling where none is needed.

### Why Not Duplicate Logic

Forking `investigateV1()`, `buildRollingContextSectionPrompt()`, `trimChunkContent()`, etc. into ICP-specific copies would:

- Create two diverging codebases that need parallel bugfixes
- Recreate the exact problem that caused the current gap

### Solution: Adapter Pattern

The `ICPPipelineAdapter` is a **new file** that:

1. **Imports** god-write utility functions as read-only dependencies (no modifications to source files)
2. **Translates** between ICP's session/facet/atom model and god-write's chunk/section/constraint model
3. **Composes** utility calls into an ICP-specific flow with interactive pause points
4. **Emits** WebSocket events for real-time progress
5. **Feeds** trajectory data to SoNA for learning

```
┌──────────────────────────────────────────────────┐
│             ICP Dashboard (Frontend)              │
│                                                    │
│  Prompt  Evidence  Binding  Investigation  Export  │
│  Panel   + PDF     + Atoms  Panel (NEW)    Panel   │
│  (enhanced)                                        │
└──────────────────────┬─────────────────────────────┘
                       │ HTTP + WebSocket (port 3847)
┌──────────────────────┴─────────────────────────────┐
│           ICP API Routes (icp-api-routes.ts)        │
│           (enhanced with new endpoints)             │
└──────────────────────┬─────────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────────┐
│           ICPPipelineAdapter (NEW FILE)             │
│                                                     │
│  Composes god-write utilities into ICP flow:        │
│  ─ Calls trimChunkContent() on quote_spans          │
│  ─ Calls reorderChunksForAttention()                │
│  ─ Calls buildRollingContextSectionPrompt()         │
│  ─ Calls investigateV1() on v1 draft                │
│  ─ Calls scrubNonCorpusAuthors() post-gen           │
│  ─ Calls stripBareApaParentheticals()               │
│  ─ Calls stripEndnoteLeaks()                        │
│  ─ Maps results back to ICP session state           │
│  ─ Emits events to ICP event log + WebSocket        │
│  ─ Feeds trajectory data to SoNA                    │
│  ─ Enforces dynamic token budget ceiling            │
│                                                     │
│  Does NOT call WritePipelineOrchestrator             │
│  Does NOT modify any god-write source files          │
└──────────────────────┬─────────────────────────────┘
                       │ imports (read-only)
┌──────────────────────┴─────────────────────────────┐
│          God-Write Utilities (UNCHANGED)            │
│                                                     │
│  trimChunkContent()            (gold-standard)      │
│  reorderChunksForAttention()   (gold-standard)      │
│  buildRollingContextSectionPrompt()  (prompt-bldr)  │
│  buildGoldStandardPrompt()     (prompt-builder)     │
│  investigateV1()               (write-pipeline)     │
│  scrubNonCorpusAuthors()       (author-scrubber)    │
│  stripBareApaParentheticals()  (author-scrubber)    │
│  stripEndnoteLeaks()           (endnote-gen)        │
│  ProseSanitizer                (prose-sanitizer)    │
│  GoldStandardConfig            (gold-std-config)    │
│  DomainConfig                  (domain-config)      │
│  ModelRouter                   (model-router)       │
│  SmartRetrievalLayer           (retrieval)          │
│  enrichStyleProfile()          (style-profile)      │
│  validateRetrievalCoverage()   (write-pipeline)     │
│  enforceSourceDiversity()      (write-pipeline)     │
│  assignSourcesToSections()     (prompt-builder)     │
└────────────────────────────────────────────────────┘
```

---

## 3. Execution Model: Event-Driven State Machine

### Why Not Suspend-and-Resume

The adapter does **not** suspend. A suspended pipeline would require:
- A long-running server process or serialized continuation
- Complex checkpoint logic for backward transitions (user re-retrieves after verifying)
- Per-session process/thread overhead for concurrent sessions
- Fragility if the user closes the browser and returns later

### Stateless Between Invocations

Each API call is a **complete, short-lived invocation**. The ICP session object is the persistent state. The adapter reads current session state, calls the relevant utilities, writes results back, and returns.

```
POST /session      → adapter.decompose()    → session saved → DECOMPOSED
POST /retrieve     → adapter.retrieve()     → session saved → RETRIEVED
     ... user verifies quotes in UI ...
     ... user binds atoms in UI ...
POST /generate     → adapter.generate()     → session saved → GENERATED (via WS)
     ... user reviews investigation results ...
POST /regenerate   → adapter.regenerateV2() → session saved → REGENERATED (via WS)
POST /validate     → adapter.validate()     → session saved → VALIDATED
     ... user reviews quality gates ...
POST /export       → adapter.export()       → package returned → EXPORTED
```

### Pipeline Phase State Machine

```
DECOMPOSED ──→ RETRIEVED ──→ VERIFIED ──→ BOUND ──→ GENERATED
                  ↑                                     │
                  │              ┌──────────────────────┤
                  │              ↓                      ↓
                  └── (re-retrieve)  INVESTIGATED → REGENERATED
                                                        │
                                                        ↓
                                                   VALIDATED ──→ EXPORTED
```

- Transitions are **user-initiated** (button clicks), not automatic
- The adapter validates the session is in the correct phase before executing
- Backward transitions are allowed: re-retrieve after verifying, re-generate after binding new atoms
- `PARTIALLY_GENERATED` state exists for aborted rolling context generation

### The Rolling Context Exception

Within `adapter.generate()`, if rolling context is enabled, the adapter runs a **multi-step internal loop** that streams progress via WebSocket:

```typescript
adapter.generate(session):
  priorSections = []
  summaries = []
  citationTracker = new CitationTracker()

  for i, section in enumerate(outline):
    // Build context with tiered compression
    contextSections = buildTieredContext(i, priorSections, summaries)

    // Dynamic pre-flight token budget check
    prompt = buildRollingContextSectionPrompt(
      section, contextSections, citationTracker, chunks, outline
    )
    prompt = enforceTokenCeiling(prompt, contextSections, chunks)

    text = await modelRouter.generateText(prompt)
    priorSections.push(text)
    citationTracker.update(text)

    // Generate Haiku summary for future compression
    if (outline.length - i > windowSize):
      summary = await modelRouter.generateText({
        prompt: `Summarize in ~50 words, preserving key claims and citations: ${text}`,
        costTier: 'low',
        maxTokens: 100
      })
      summaries.push(summary)

    ws.emit('section-complete', {
      index: i, text,
      citationTracker: citationTracker.snapshot(),
      tokenBudget: { used, remaining, downgrades }
    })

  session.generated_text = combinedSections
  session.section_summaries = summaries
  session.pipeline_phase = 'GENERATED'
```

If the user aborts (via `PipelineAbortController`), the adapter saves completed sections and sets `pipeline_phase = 'PARTIALLY_GENERATED'`.

---

## 4. Tiered Compression Strategy

### The Problem

Rolling context for a 7-section chapter accumulates ~4,900 words of prior text. Injecting all of it into every subsequent prompt causes token budget explosion and attention degradation.

### The Solution: Two-Zone Sliding Window

The `rollingContextWindowSize` (default: 2) defines how many recent sections appear as full text. All earlier sections are compressed to ~50-word Haiku summaries.

```
Generating Section 5 of 7:

Section 1:  ██░░░░░░  Haiku summary (~50 words)     ← COLD
Section 2:  ██░░░░░░  Haiku summary (~50 words)     ← COLD
Section 3:  ████████  Full text (~700 words)         ← WARM
Section 4:  ████████  Full text (~700 words)         ← HOT
Section 5:  ▓▓▓▓▓▓▓▓  [GENERATING NOW]
Section 6:  ░░░░░░░░  Outline title only             ← FUTURE
Section 7:  ░░░░░░░░  Outline title only             ← FUTURE
```

### Why Not UCM Daemon

The UCM daemon's progressive summarization is wrong for this task:
- **Latency:** 5-10 second round-trip per section vs. instant Haiku call
- **Quality:** UCM's general-purpose compression may drop citation references the next section needs
- **Cost:** Haiku summary costs ~1/60th of an Opus call — negligible for 5 calls

UCM's value is **between sessions** (maintaining compressed representation of prior chapters for future context). That's a future enhancement, not part of the core rolling context loop.

### Dynamic Pre-Flight Token Budget Check

**Token ceiling:** 12,000 input tokens
**Downgrade trigger:** 10,500 tokens (1,500-token buffer for estimation variance)

The ceiling is derived from attention degradation research (Liu et al., 2023) — retrieval accuracy drops significantly when relevant content sits mid-context beyond ~10K tokens. Corpus chunks must stay in high-attention zones (prompt start and end). If total input exceeds the ceiling, chunks get pushed into the dead zone regardless of reordering.

```typescript
enforceTokenCeiling(prompt, contextSections, chunks):
  inputTokens = estimateTokens(prompt)  // chars / 3.5 (conservative)

  // Cascade 1: Downgrade oldest WARM section to COLD summary
  while inputTokens > 10_500 and context.warmSections.length > 1:
    oldest = context.warmSections.shift()
    summary = summaries[oldest.index]  // already generated
    context.coldSections.push({ type: 'summary', text: summary })
    prompt = rebuild(prompt)
    inputTokens = estimateTokens(prompt)
    ws.emit('budget-warning', { action: 'downgraded-section', section: oldest.index })

  // Cascade 2: Reduce chunk count by 30%
  if inputTokens > 10_500:
    chunks = chunks.slice(0, Math.ceil(chunks.length * 0.7))
    prompt = rebuild(prompt)
    inputTokens = estimateTokens(prompt)
    ws.emit('budget-warning', { action: 'trimmed-chunks', remaining: chunks.length })

  // Hard floors: never drop below 1 WARM section or 5 chunks
  return prompt
```

**Token budget arithmetic (worst case, section 7 of 7):**

| Component | Tokens |
|-----------|--------|
| System prompt + style + grounding | ~1,500 |
| Summaries (sections 1-5, 50 words each) | ~350 |
| Full text (sections 5-6, ~700 words each) | ~2,000 |
| Corpus chunks (trimmed, ~10 per section) | ~3,500 |
| Citation tracker + outline | ~500 |
| **Total input** | **~7,850** |
| Output budget (conclusion) | ~400 |
| **Total** | **~8,250** |

Well under the 12K ceiling. The dynamic check is a safeguard for users who customize Advanced Settings aggressively (high window size, high chunks-per-source).

---

## 5. SoNA Trajectory Feedback Integration

### The Gap

The original report lacked a mechanism to capture user corrections made in the dashboard and feed them back into the SoNA learning engine. The ICP's manual verification workflow (verify/reject/flag/OCR-correct) and quality gate reviews generate high-fidelity trajectory data that should improve learned patterns.

### Dual Feedback Sources

1. **Investigation results** (system-generated): When `investigateV1()` detects hallucinations, phantom quotes, or over-cited sources, these findings become trajectory data regardless of whether the user acts on them. The system learns what kinds of prompts and corpus configurations produce which failure modes.

2. **User corrections** (human-generated): When the user edits generated text in quality gates, verifies/rejects quotes, or adjusts bindings after reviewing investigation results, these corrections are packaged as quality assessments.

### Implementation

Add a **"Submit Feedback"** action in the Quality Gates panel:

```typescript
adapter.submitFeedback(session):
  // Compute quality delta between generated and user-corrected text
  delta = computeTextDelta(session.generated_text, session.corrected_text)

  // Package investigation results
  investigationFindings = {
    hallucinatedAuthors: session.investigation.blacklistedAuthors,
    phantomQuotations: session.investigation.phantomQuotes,
    overCitedSources: session.investigation.overCitedSources,
    shortSections: session.investigation.shortSections
  }

  // Package user verification actions
  verificationActions = session.event_log
    .filter(e => e.action in ['verify', 'reject', 'flag', 'patch'])
    .map(e => ({ action: e.action, quoteId: e.data.quoteId, timestamp: e.timestamp }))

  // Submit to SoNA as trajectory assessment
  await sonaEngine.submitAssessment({
    trajectoryId: session.trajectory_id,
    qualityScore: computeQualityScore(delta, investigationFindings),
    investigationFindings,
    verificationActions,
    userCorrections: delta,
    sessionConfig: {
      multiStepDrafting: session.config.multiStep,
      rollingContext: session.config.rollingContext,
      chunkOptimization: session.config.chunkOptimization,
      groundingStrictness: session.config.groundingStrictness
    }
  })
```

This gives SoNA three signal types:
- **What the system caught** (investigation results → pattern weights for detection)
- **What the user fixed** (text corrections → pattern weights for generation quality)
- **What configuration produced the outcome** (session config → optimal default tuning)

---

## 6. Real-Time Streaming and Cost Tracking

### WebSocket Streaming

Multi-step drafting and rolling context generation take 3-5 minutes for a 7-section chapter. Standard HTTP requests will time out. The existing Express + WebSocket infrastructure on port 3847 handles this.

**Events emitted during generation:**

| Event | Payload | When |
|-------|---------|------|
| `stage-start` | `{ stage, totalStages }` | Each pipeline stage begins |
| `section-complete` | `{ index, text, citationTracker, tokenBudget }` | Each rolling context section finishes |
| `budget-warning` | `{ action, detail }` | Dynamic token ceiling triggers downgrade |
| `investigation-complete` | `{ findings: PreventionPlan }` | investigateV1 finishes (multi-step) |
| `gate-result` | `{ gate, passed, detail }` | Each quality gate completes |
| `generation-complete` | `{ totalSections, totalWords, totalTokensUsed, totalCost }` | Full generation done |
| `abort-acknowledged` | `{ completedSections, phase }` | User cancelled; partial state saved |

**Frontend handling:**
- Generation Progress panel renders `section-complete` events as a live progress bar
- Citation tracker updates in real-time from `section-complete` payloads
- Budget warnings surface as inline alerts
- Investigation results populate the Investigation panel immediately

### Real-Time Token & Cost Visualization

Add a **cost estimator widget** adjacent to the Prompt panel configuration:

```
┌─────────────────────────────────────┐
│  Estimated Cost for Current Config  │
│                                     │
│  Retrieval:     ~2K tokens  $0.01   │
│  v1 Draft:     ~12K tokens  $0.18   │
│  Investigation:  ~4K tokens  $0.06   │
│  v2 Draft:     ~12K tokens  $0.18   │
│  Summaries:     ~1K tokens  $0.00   │
│  Validation:    ~3K tokens  $0.04   │
│  ─────────────────────────────────  │
│  Total:        ~34K tokens  $0.47   │
│                                     │
│  (Multi-step ON, Rolling ON,        │
│   7 sections, Anthropic Opus)       │
└─────────────────────────────────────┘
```

- Updates dynamically as the user toggles checkboxes
- Shows per-stage breakdown
- Uses current Anthropic pricing for cost estimate
- During generation, switches from "estimated" to "actual" with running total

---

## 7. Feature Comparison Matrix

| Feature | God-Write CLI | ICP Dashboard | ICP After Convergence |
|---------|:---:|:---:|:---:|
| **RETRIEVAL** | | | |
| SmartRetrievalLayer (semantic + hybrid) | YES | NO | YES (via adapter) |
| Knowledge Graph boosting (reasoning edges) | YES | NO | YES (checkbox) |
| Retrieval coverage validation | YES | NO | YES (auto + "Supplement" button) |
| Source diversity enforcement | YES | PARTIAL | YES (cross-facet) |
| Query decomposition | YES (regex+KG) | YES (LLM) | YES (both; ICP LLM primary) |
| Corpus folder scoping | NO | YES | YES (preserved) |
| **GENERATION** | | | |
| Rolling context (section-by-section) | YES | NO | YES (checkbox, default ON for chapter/paper) |
| Gold standard prompt builder | YES | PARTIAL | YES (used in generation, not just preview) |
| Multi-step drafting (v1 → investigate → v2) | YES | NO | YES (checkbox, default ON) |
| investigateV1 (hallucination pre-scan) | YES | NO | YES (results in Investigation panel) |
| Prevention plan (blacklist + supplemental) | YES | NO | YES (user reviews before v2) |
| Chunk trimming (92% reduction) | YES | NO | YES (checkbox, default ON) |
| Attention reordering | YES | NO | YES (automatic with chunk optimization) |
| Shared pool + per-section allocation | YES | NO | YES (via rolling context) |
| Section-specific source assignments | YES | NO | YES (displayed in Planner) |
| Per-section word targets | YES | PARTIAL | YES (configurable in Advanced Settings) |
| Citation status tracker | YES | NO | YES (real-time in Generation Progress) |
| Haiku summaries for conclusion | YES | NO | YES (checkbox, default ON) |
| Tiered compression (COLD/WARM/HOT) | YES | NO | YES (automatic in rolling context) |
| Dynamic token budget ceiling | NO | NO | YES (12K ceiling, auto-downgrade) |
| **VALIDATION** | | | |
| Inline validation (per-paragraph) | YES | NO | YES (checkbox, default OFF) |
| Quality gauntlet (7-stage) | YES | PARTIAL (display only) | YES (active execution) |
| Citation enforcement | YES | PARTIAL (display only) | YES (active execution) |
| Edge coherence validation | YES | NO (placeholder) | YES (replaces stress test) |
| Author scrubbing | YES | NO | YES (checkbox, default ON) |
| APA citation stripping | YES | NO | YES (automatic in validation) |
| Prose sanitization (multi-pass) | YES | YES (single pass) | YES (multi-pass after each gate) |
| Endnote leak detection | YES | NO | YES (automatic in validation) |
| Revision loop (up to 3 iterations) | YES | NO | YES (checkbox, default OFF) |
| **PROMPTING** | | | |
| Style profile enrichment | YES | PARTIAL | YES (auto-enrich before injection) |
| Corpus constraint (source whitelist) | YES | PARTIAL | YES (minRelevance=0.0) |
| Zero-tolerance grounding constraints | YES | NO | YES (default for strict/moderate) |
| Domain config integration | YES | NO | YES (auto-loaded at session creation) |
| Knowledge units in generation | YES | PARTIAL | YES (checkbox, default ON) |
| Structural edges in generation | YES | PARTIAL | YES (checkbox, default ON) |
| **UI / INTERACTIVITY** | | | |
| PDF page viewer with highlight | NO | YES | YES (preserved) |
| OCR correction editor | NO | YES | YES (preserved) |
| Facet editor | NO | YES | YES (preserved) |
| Atom-level claim binding | NO | YES | YES (preserved) |
| Trust tier computation | NO | YES | YES (preserved) |
| Evidence heatmap | NO | YES | YES (preserved) |
| Event audit trail | NO | YES | YES (preserved + SoNA events) |
| Quote verification workflow | NO | YES | YES (preserved) |
| Session management | NO | YES | YES (preserved) |
| Run manifest / reproducibility | NO | YES | YES (preserved) |
| Investigation panel | NO | NO | YES (new) |
| Generation progress (real-time) | NO | NO | YES (new, WebSocket-streamed) |
| Cost estimator | NO | NO | YES (new, dynamic) |
| SoNA trajectory feedback | PARTIAL | NO | YES (new, from corrections + investigation) |
| Pipeline abort | YES (CLI) | NO | YES (button + PipelineAbortController) |
| **ARCHITECTURE** | | | |
| CLI isolation | N/A | N/A | YES (adapter pattern, zero CLI changes) |
| Stateless execution | NO (batch) | PARTIAL | YES (event-driven state machine) |
| Manifest caching | YES | NO | YES (60s TTL) |
| Cost-tier routing | YES | NO | YES (dropdown) |

---

## 8. Gap Details

### Priority 1: Generation Quality (Critical)

#### G1. Multi-Step Drafting (v1 → investigate → v2)
- **God-write has:** Generate v1, run `investigateV1()` to detect hallucinations/phantom quotes/short sections/over-citation, build prevention plan, optionally do supplemental retrieval, generate v2 with blacklist + prevention constraints.
- **ICP lacks:** Single-pass generation via ConstrainedGenerator. No feedback loop.
- **Adapter method:** `adapter.generate()` runs v1, calls `investigateV1()`, emits `investigation-complete` WS event, waits for `POST /regenerate` to run v2 with prevention plan.
- **UI:** "Multi-Step Drafting" checkbox (default ON). Investigation panel shows results between v1 and v2.

#### G2. Rolling Context Generation
- **God-write has:** Section-by-section with sliding window, citation tracking, shared chunk pool, per-section source assignments, Haiku summaries.
- **ICP lacks:** Per-paragraph generation without cross-paragraph context.
- **Adapter method:** `adapter.generate()` loops through sections with `buildRollingContextSectionPrompt()`, tiered compression, dynamic budget checks. Streams `section-complete` events.
- **UI:** "Rolling Context" checkbox (default ON for chapter/paper). Generation Progress panel shows real-time section status and citation tracker.

#### G3. Chunk Trimming + Attention Reordering
- **God-write has:** `trimChunkContent()` (4,280→352 avg chars), `reorderChunksForAttention()` (high relevance at edges).
- **ICP lacks:** Full chunks, wasted tokens, attention degradation.
- **Adapter method:** Applied in `adapter.generate()` before prompt building.
- **UI:** "Chunk Optimization" checkbox (default ON). Shows before/after token counts.

#### G4. Zero-Tolerance Grounding Constraints
- **God-write has:** "ONLY quote and cite from the corpus chunks below", "NEVER introduce any author names not in chunks", blacklist injection.
- **ICP lacks:** Writing contract strictness without explicit grounding language.
- **Adapter method:** Injected into generation prompt for strict/moderate modes.
- **UI:** "Grounding Strictness" dropdown (Strict / Moderate / Permissive).

### Priority 2: Post-Generation Validation (High)

#### G5. Author Scrubbing
- **Adapter method:** Calls `scrubNonCorpusAuthors()` in `adapter.validate()`. Uses full corpus manifest for allowedAuthors.
- **UI:** "Scrub non-corpus authors" checkbox (default ON). Quality Gates shows removed count, author names, context snippets with undo option.

#### G6. APA Citation Stripping
- **Adapter method:** Calls `stripBareApaParentheticals()` after author scrubbing in `adapter.validate()`.
- **UI:** Automatic; results shown in Quality Gates citation enforcement section.

#### G7. Endnote Leak Detection
- **Adapter method:** Calls `stripEndnoteLeaks()` after generation, before endnote generation.
- **UI:** Automatic; leak count shown in Quality Gates.

#### G8. Second Sanitizer Pass
- **Adapter method:** ProseSanitizer runs after every text-modifying gate (generation, citation enforcement, author scrubbing).
- **UI:** Sanitizer pass count shown in Quality Gates.

#### G9. Citation Enforcement Execution
- **Adapter method:** Calls `citation-validator.ts` `correct()` method in `adapter.validate()`.
- **UI:** Quality Gates shows hallucinated/corrected counts. "Run Gate" button per gate.

#### G10. Inline Validation (Per-Paragraph)
- **Adapter method:** When enabled, each section in rolling context loop passes through `InlineValidationOrchestrator` gates.
- **UI:** "Inline Validation" checkbox (default OFF — adds latency). Per-paragraph status in Planner.

### Priority 3: Retrieval Enhancements (Medium)

#### G11. SmartRetrievalLayer Integration
- **Adapter method:** `adapter.retrieve()` augments FacetedRetrieval with SmartRetrievalLayer for hybrid search, KG boosting, page expansion.
- **UI:** "KG Boosting" and "Page Context Expansion" checkboxes.

#### G12. Retrieval Coverage Validation
- **Adapter method:** After retrieval, calls `validateRetrievalCoverage()`. If key authors have <2 chunks, offers targeted supplementation.
- **UI:** Coverage badge in pipeline stages. "Supplement" button for under-represented authors.

#### G13. Source Diversity Enforcement
- **Adapter method:** Calls `enforceSourceDiversity()` after merging facet results.
- **UI:** Diversity metrics in Evidence panel.

### Priority 4: Configuration & Prompting (Medium)

#### G14. Domain Config Integration
- **Adapter method:** Loads `domain-config.json` at session creation. Uses for title normalization, author classification.
- **UI:** Automatic; no additional controls needed.

#### G15. Knowledge Units + Structural Edges in Generation
- **Adapter method:** When enabled, injects KUs from `god-learn/knowledge.jsonl` and filtered edges from `god-reason/reasoning.jsonl` into generation prompt.
- **UI:** "Include Knowledge Units" and "Include Reasoning Edges" checkboxes (default ON).

#### G16. Style Profile Enrichment
- **Adapter method:** Calls `enrichStyleProfile()` before injection.
- **UI:** "Style Preview" expansion showing enriched characteristics.

#### G17. Gold Standard Config Tuning
- **Adapter method:** Exposes `GOLD_STANDARD_CONFIG` parameters via API.
- **UI:** Advanced Settings collapsible section with per-session overrides.

### Priority 5: Architecture (Infrastructure)

#### G18. PipelineAbortController
- **Adapter method:** Creates `PipelineAbortController` per generation request. Saves partial state on abort.
- **UI:** "Cancel" button in pipeline status banner and Generation Progress panel.

#### G19. Manifest Caching
- **Adapter method:** 60-second TTL cache for corpus manifest in ICP API routes.
- **UI:** None (transparent).

#### G20. Cost-Tier Routing
- **Adapter method:** Sets `costTier: 'high'` for all generation calls.
- **UI:** "Cost Tier" dropdown (High=Anthropic / Low=vLLM).

---

## 9. Dashboard UI Specifications

### Prompt Panel Enhancements

**Existing controls (preserved):**
- Research prompt textarea
- Source mode dropdown (corpus/hybrid/external)
- Min relevance slider (0-1, default 0.5, step 0.05)
- Max chunks input (1-100, default 20)
- Corpus folder dropdown
- Draft category dropdown (section/chapter/paper/essay/article)
- Word count target dropdown (500-1000 / 1000-2000 / 2000-4000 / 4000+)
- Style profile dropdown

**New checkbox controls:**

| Control | Default | Condition | Maps To |
|---------|---------|-----------|---------|
| Multi-Step Drafting | ON | Always | v1→investigate→v2 |
| Rolling Context | ON | draft_category in [chapter, paper] | Section-by-section generation |
| Chunk Optimization | ON | Always | trimChunkContent + reorderChunksForAttention |
| KG Boosting | ON | Always | Reasoning edges in retrieval |
| Knowledge Units | ON | Always | god-learn KUs in prompt |
| Structural Edges | ON | Always | god-reason edges in prompt |
| Author Scrubbing | ON | Always | Post-gen non-corpus author removal |
| Conclusion Summaries | ON | Rolling Context ON | Haiku summaries for conclusion |
| Inline Validation | OFF | Always | Per-paragraph validation gates |
| Quality Gauntlet | OFF | Always | 7-stage quality assessment |
| Revision Loop | OFF | Always | Iterative revision (max 3) |
| Page Context Expansion | OFF | Always | Retrieve surrounding chunks |

**New dropdown controls:**

| Control | Options | Default |
|---------|---------|---------|
| Grounding Strictness | Strict / Moderate / Permissive | Strict |
| Cost Tier | High (Anthropic) / Low (vLLM) | High |

**Advanced Settings (collapsible):**

| Parameter | Default | Source |
|-----------|---------|--------|
| Chunk trim target | 450 chars | `GOLD_STANDARD_CONFIG.chunkTrimTarget` |
| Shared pool size | 5 | `GOLD_STANDARD_CONFIG.rollingContextSharedPoolSize` |
| Rolling context window | 2 | `GOLD_STANDARD_CONFIG.rollingContextWindowSize` |
| Section word target | 700 | `GOLD_STANDARD_CONFIG.rollingContextSectionWords` |
| Conclusion word target | 200 | `GOLD_STANDARD_CONFIG.rollingContextConclusionWords` |
| Max chunks per source | 8 | `GOLD_STANDARD_CONFIG.maxChunksPerSource` |
| Relevance floor | 0.25 | `GOLD_STANDARD_CONFIG.relevanceFloor` |
| Over-citation threshold | 40% | `GOLD_STANDARD_CONFIG.overCitationThreshold` |
| Token budget ceiling | 12,000 | (new) |
| Downgrade trigger | 10,500 | (new) |

**Cost estimator widget** (adjacent to controls):
- Updates dynamically as user toggles checkboxes
- Per-stage token/cost breakdown
- Switches from "estimated" to "actual" during generation

### New Panel: Investigation (Panel 2.5, between Evidence and Binding)

**Appears after:** `POST /generate` with multi-step drafting ON

**Contents:**
- **Hallucinated Citations:** Author names found in v1 draft but not in corpus manifest. Listed with context snippets.
- **Phantom Quotations:** Quoted text in v1 draft not found in any corpus chunk. Listed with quoted text and surrounding sentence.
- **Short Sections:** Sections under 350 words. Listed with section title and word count.
- **Over-Cited Sources:** Authors exceeding 40% of citations. Listed with author name and percentage.
- **Prevention Plan Summary:** Blacklisted authors, supplemental retrieval targets.
- **Action Button:** "Re-generate with Prevention Plan" → triggers `POST /regenerate`

### New Panel: Generation Progress (Panel 5.5, sub-panel in Planner or standalone)

**Appears during:** `adapter.generate()` with rolling context ON

**Contents (real-time via WebSocket):**
- **Section Progress Bar:** X / N sections complete, with per-section word count vs target
- **Citation Tracker Table:** Author → Count, with "uncited" rows highlighted in amber
- **Token Budget Meter:** Current input tokens / 12K ceiling, with downgrade alerts
- **Cost Running Total:** Actual tokens used and cumulative cost
- **Per-Section Validation Status:** (if inline validation ON) Pass/fail per paragraph
- **Abort Button:** Saves completed sections as `PARTIALLY_GENERATED`

### Quality Gates Enhancement

**New capabilities (active execution, not just display):**

| Gate | Trigger | Display |
|------|---------|---------|
| Citation Enforcement | "Run Gate" button | Hallucinated count, corrected count, before/after diff |
| Author Scrubbing | "Run Gate" button | Removed count, author names, context snippets, undo per sentence |
| APA Stripping | Automatic after author scrubbing | Stripped count |
| Endnote Leak Detection | Automatic after generation | Leak count, marker types removed |
| Prose Sanitization | Automatic after each text-modifying gate | Pass count, artifacts removed |
| Edge Coherence | "Run Gate" button (replaces placeholder stress test) | Contradictions found, score |
| Quality Gauntlet | "Run Gate" button (if checkbox ON) | 7-stage scores, overall %, critical issues |
| SoNA Feedback | "Submit Feedback" button | Packages corrections + investigation into trajectory assessment |

**"Run All Gates"** button executes all gates in sequence, displaying results progressively.

---

## 10. Implementation Phases

### Phase 1: Adapter Foundation + Core Utilities
**New files:**
- `src/god-agent/core/composition/icp-pipeline-adapter.ts`

**Changes to existing ICP files:**
- `icp-api-routes.ts`: New endpoints (`/regenerate`, `/validate` as active execution, `/feedback`)
- `icp-types.ts`: Add `pipeline_phase`, `investigation_results`, `section_summaries`, `trajectory_id`, `config` fields to ICPSession

**Adapter methods implemented:**
1. `adapter.retrieve()` — Augments FacetedRetrieval with SmartRetrievalLayer
2. `adapter.generate()` — Applies `trimChunkContent()`, `reorderChunksForAttention()`, grounding constraints
3. `adapter.validate()` — Runs `scrubNonCorpusAuthors()`, `stripBareApaParentheticals()`, `stripEndnoteLeaks()`, multi-pass ProseSanitizer, citation enforcement via `correct()`
4. Load `DomainConfig` at session creation

**Validates:** Single-pass generation through adapter produces output equivalent to god-write CLI.

### Phase 2: Multi-Step Drafting + Rolling Context
**Adapter methods implemented:**
1. `adapter.generate()` extended with v1→`investigateV1()`→v2 flow
2. `adapter.regenerateV2()` — Takes prevention plan, generates v2
3. Rolling context section loop with `buildRollingContextSectionPrompt()`
4. Citation status tracker in session state
5. Haiku summary generation for tiered compression
6. Dynamic pre-flight token budget check with auto-downgrade cascade
7. `PipelineAbortController` integration

**Validates:** Multi-section chapter generation matches CLI rolling context output quality.

### Phase 3: WebSocket Streaming + Dashboard UI
**Frontend changes:**
1. Prompt panel: Add all checkbox/dropdown controls + Advanced Settings
2. Cost estimator widget
3. Investigation panel (v1 results display)
4. Generation Progress panel (WebSocket-driven)
5. Quality Gates: Active execution with "Run Gate" buttons and before/after diffs
6. Abort button

**Backend changes:**
1. WebSocket event emission in adapter methods
2. `GET /api/icp/cost-estimate` endpoint (dynamic based on config)

**Validates:** Full interactive workflow — configure → retrieve → verify → generate (with streaming) → investigate → regenerate → validate → export.

### Phase 4: Deep Integration + SoNA
1. KU + structural edge injection into generation prompt
2. Inline validation toggle (InlineValidationOrchestrator in rolling context loop)
3. Retrieval coverage validation after Stage 2 with "Supplement" button
4. Edge coherence validation (replaces stress test placeholder)
5. Style profile enrichment before injection
6. SoNA trajectory feedback: "Submit Feedback" action packaging corrections + investigation results
7. Manifest caching (60s TTL)
8. Cost-tier routing dropdown

**Validates:** SoNA receives trajectory data from dashboard corrections. Quality gates produce meaningful scores.

### Phase 5: Polish + Regression Testing
1. Source assignment visualization (which sources → which paragraphs)
2. Revision loop (optional, checkbox)
3. Run manifest enhancement for convergence regression testing
4. Cross-session diversity metrics
5. Coverage badge in pipeline stages
6. Style Preview expansion

**Validates:** ICP generates text indistinguishable from god-write CLI for identical prompts and configurations.

---

## 11. Files Modified or Created

### New Files

| File | Purpose |
|------|---------|
| `src/god-agent/core/composition/icp-pipeline-adapter.ts` | Adapter layer composing god-write utilities for ICP flow |

### Modified Files (ICP only — no CLI changes)

| File | Changes |
|------|---------|
| `src/god-agent/observability/icp-api-routes.ts` | New endpoints: `/regenerate`, `/validate` (active), `/feedback`, `/cost-estimate`; WebSocket event emission |
| `src/god-agent/core/composition/icp-types.ts` | New session fields: `pipeline_phase`, `investigation_results`, `section_summaries`, `trajectory_id`, `config`, `corrected_text` |
| `src/god-agent/observability/dashboard/icp-panel.js` | Investigation panel, Generation Progress panel, enhanced Quality Gates, checkbox controls, Advanced Settings, cost estimator |
| `src/god-agent/observability/dashboard/styles.css` | Styles for new panels and controls |
| `src/god-agent/observability/dashboard/app.js` | WebSocket event handlers for generation streaming |

### God-Write Files (READ-ONLY — imported, never modified)

| File | Utilities Imported |
|------|-------------------|
| `src/god-agent/universal/write-pipeline-orchestrator.ts` | `investigateV1()`, `validateRetrievalCoverage()`, `enforceSourceDiversity()` |
| `src/god-agent/universal/gold-standard-prompt-builder.ts` | `buildRollingContextSectionPrompt()`, `buildGoldStandardPrompt()`, `assignSourcesToSections()`, `buildGoldStandardChunkBlock()` |
| `src/god-agent/universal/gold-standard-config.ts` | `GOLD_STANDARD_CONFIG` |
| `src/god-agent/universal/author-scrubber.ts` | `scrubNonCorpusAuthors()`, `stripBareApaParentheticals()` |
| `src/god-agent/universal/domain-config.ts` | `loadDomainConfig()`, `DomainConfig` |
| `src/god-agent/universal/quality-integration.ts` | `QualityIntegration` |
| `src/god-agent/cli/quality/endnote-generator.ts` | `stripEndnoteLeaks()` |
| `src/god-agent/cli/composition/prose-sanitizer.ts` | `ProseSanitizer` |
| `src/god-agent/retrieval/smart-retrieval-layer.ts` | `SmartRetrievalLayer` |
| `src/god-agent/core/composition/model-router.ts` | `ModelRouter` |
| `src/god-agent/core/writing/inline-validation-orchestrator.ts` | `InlineValidationOrchestrator` |

---

## 12. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Token budget explosion from custom Advanced Settings | High | Dynamic pre-flight check with 12K ceiling; auto-downgrade cascade |
| Multi-step drafting doubles API cost | Medium | Optional checkbox; cost estimator shows impact before run |
| Rolling context increases generation time 5-8x | Medium | WebSocket streaming; abort button; partial state preservation |
| investigateV1 false positives | Low | Investigation panel shows results for human review before v2 |
| Author scrubber removes legitimate authors | Low | Quality Gates shows removed sentences with undo option |
| Quality gauntlet revision loop degrades text | Medium | Revision loop OFF by default; `maxRevisions: 0` until gauntlet stages tuned |
| Adapter import breaks if CLI utility signatures change | Low | Adapter is the only consumer; adapter tests verify import contracts |
| Session state grows large with rolling context | Low | Tiered compression; Haiku summaries; event log pagination |
| `estimateTokens()` heuristic underestimates actual count | Low | Conservative multiplier (chars/3.5); 1,500-token buffer between trigger and ceiling |

---

## 13. Success Metrics

After convergence, the ICP dashboard must:

1. **Generate text indistinguishable from god-write CLI output** for the same prompt and configuration
2. **Provide interactive control** over every god-write parameter via checkboxes, dropdowns, and Advanced Settings
3. **Show investigation results** (hallucinations, phantom quotes, over-citation) in a dedicated panel before v2 generation
4. **Track citation status** in real-time during rolling context generation via WebSocket streaming
5. **Apply all post-generation gates** (author scrubbing, APA stripping, endnote cleanup, multi-pass sanitization, citation enforcement) with active execution and before/after diffs
6. **Support abort** for long-running multi-step generations with partial state preservation
7. **Feed trajectory data to SoNA** from both investigation results and user corrections
8. **Show real-time cost tracking** during generation with pre-run estimates
9. **Enforce dynamic token budget** with transparent auto-downgrade and user-visible warnings
10. **Preserve all existing ICP strengths:** faceted evidence, atom binding, trust tiers, PDF viewer, OCR correction, 7-state verification, event trail, session management, run manifests
11. **Make zero changes to god-write CLI source files**
