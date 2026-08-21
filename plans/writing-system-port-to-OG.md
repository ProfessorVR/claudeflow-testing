# Implementation Plan: Port Writing System Fixes to claudeflow-OG

**Date**: 2026-03-20
**Source**: `claudeflow-testing` (branch: `writing-pipeline-v2`)
**Target**: `claudeflow-OG`
**Scope**: Analysis + implementation plan only — NO code changes

---

## 1. Situation Assessment

### What the Analysis Found

The `god-write-system-analysis.md` documents **95 findings** across 55 files (~44,671 lines) of the academic writing pipeline:

| Severity | Count | Examples |
|----------|-------|---------|
| CRITICAL | 18 | minRelevance regression, ReDoS, abort leak, div-by-zero, Levenshtein OOM |
| HIGH | 27 | Sentence splitting (3 files), substring author matching, greedy claim regex |
| MEDIUM | 34 | Dead code, missing error handling, stopword-inflated Jaccard |
| LOW | 16 | Unimplemented features, design weaknesses |

**Overall verdict**: FUNCTIONAL BUT FRAGILE — produces usable output but carries 60+ incremental fixes as tech debt.

### What Already Exists in claudeflow-OG

Both codebases share **~95% identical** writing pipeline files:

- `universal/` — 24 files (write-pipeline-orchestrator, universal-agent, cli, quality-integration, etc.)
- `core/composition/` — 20 files (model-router, icp-orchestrator, constrained-generator, etc.)
- `core/writing/` — 28-30 files (citation-validator, citation-enforcer, inline-validation, etc.)
- `retrieval/` — 6 files (smart-retrieval-layer, hybrid-retriever, faceted-retrieval, etc.)
- `cli/quality/` — 19 files (quality-gauntlet, 8 stages, endnote-generator, etc.)

### What claudeflow-testing Adds (not in OG)

| Module | Files | Purpose | Required? |
|--------|-------|---------|-----------|
| `core/abort/` | 2 | PipelineAbortController (file sentinel + AbortController) | YES (Stream Deck) |
| `core/config/` | 2 | Centralized config management (YAML + env vars) | RECOMMENDED |
| `core/resilience/` | 2 | Error recovery, exponential backoff, circuit breaker | RECOMMENDED |
| `core/gpu/` | 3 | GPU server lifecycle management | OPTIONAL |
| `core/universal-validation/` | 3 | Cross-module validation framework (tier system) | OPTIONAL |
| `pipelines/` | 6 | PDF analysis pipeline | OPTIONAL |

### Key Modified Files (testing vs OG)

These files exist in both but have diverged in `writing-pipeline-v2`:

1. **`core/composition/model-router.ts`** — Native fetch replaces SDK, abort signals, 120s timeout
2. **`universal/write-pipeline-orchestrator.ts`** — Abort integration, manifest cache, all Fix 9-60 changes
3. **`core/pipeline/coding-pipeline-orchestrator.ts`** — Abort signal checks
4. **`universal/quality-integration.ts`** — Gauntlet integration tightening
5. **`retrieval/smart-retrieval-layer.ts`** — L2→cosine fix, collection resolution
6. **`universal/author-scrubber.ts`** — Possessive stripping, full manifest author list
7. **`universal/domain-config.ts`** — Compound term handling
8. **`universal/gold-standard-config.ts`** — Word target defaults
9. **`observability/icp-api-routes.ts`** — .env loader, manifest caching
10. **`cli/quality/endnote-generator.ts`** — Formatting fixes

---

## 2. Implementation Strategy

### Approach: Selective Backport, Not Full Merge

The two codebases have diverged significantly. A `git merge` would produce hundreds of conflicts. Instead, **selectively backport** changes in priority order, verifying each phase independently.

### Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Modified files have diverged further in OG | Diff each file before patching; use OG's version as base |
| OG may have its own fixes not in testing | Compare both directions before overwriting |
| New modules may have undocumented dependencies | Check all imports before copying |
| Tests may not transfer cleanly | Run `vitest` after each phase |
| `.env` / config paths may differ | Verify all hardcoded paths |

---

## 3. Implementation Phases

### Phase 0: Pre-Flight (30 min)

**Goal**: Establish a safe working environment.

1. Create a new branch in OG: `git checkout -b writing-pipeline-v2-port`
2. Run existing tests: `npx vitest run` — record baseline
3. Generate file-level diff list between the two codebases:
   ```bash
   diff -rq claudeflow-testing/src/god-agent/ claudeflow-OG/src/god-agent/ --exclude='*.bak' --exclude='*.pre-*'
   ```
4. Document any OG-only changes not present in testing (reverse diff)

### Phase 1: P0 Critical Bug Fixes (2-3 hours)

**Goal**: Fix the 8 issues that block correct output. These are small, surgical changes.

| # | Fix | File | Change |
|---|-----|------|--------|
| 1 | CRIT-01: minRelevance regression | `icp-orchestrator.ts:225` | Change `0.5` → `0.0` |
| 2 | CRIT-05: Division by zero | `gold-standard-prompt-builder.ts:412-427` | Guard `regularSections === 0` |
| 3 | CRIT-07: Weight overrides broken | `quality-gauntlet.ts:164-170` | Apply the prepared overrides |
| 4 | CRIT-18: Empty string = 100% similar | `quotation-fidelity-validator.ts:655` | Return `0.0` for empty input |
| 5 | CRIT-17: Pre-1500 dates flagged | `citation-verifier.ts:430-435` | Allow classical dates or make configurable |
| 6 | CRIT-11: Corpus unavailable = found | `citation-verifier.ts:335` | Return `{ found: false }` |
| 7 | CRIT-03: Abort controller leak | `write-pipeline-orchestrator.ts:145` | Clear in `finally` block |
| 8 | LOGIC-23/ARCH-15: Style targets contradict profile | `style-consistency-validator.ts:142-149` | Align sentence length target with 31-word profile |

**Verification**: Run existing tests. Manually test `god-write --execute` on a known topic.

### Phase 2: P1 Crash/Corruption Prevention (1-2 days)

**Goal**: Fix issues that cause crashes, data corruption, or silent wrong results.

| # | Fix | File | Effort |
|---|-----|------|--------|
| 1 | CRIT-10: Greedy JSON regex | `model-router.ts:392-406` | 1 hr — use lazy matching or JSON boundary detection |
| 2 | CRIT-06: Levenshtein OOM | `quotation-fidelity-validator.ts:664-690` | 2 hr — add early termination or bounded edit distance |
| 3 | CRIT-02: ReDoS patterns | `citation-validator.ts:194-251` | 2 hr — simplify nested quantifiers |
| 4 | CRIT-08: Promise.all failure | `quality-gauntlet.ts` | 30 min — switch to `Promise.allSettled` |
| 5 | CRIT-09: Uninitialized orchestrator | `universal-agent.ts:2683` | 10 min — add null check |
| 6 | CRIT-04/13: Phase ordering | `citation-enforcer.ts:199,209-227` | 2 hr — citation validation before quotation correction |
| 7 | CRIT-16: AbortSignal.any() polyfill | `model-router.ts:307` | 30 min — version check + polyfill |
| 8 | CRIT-12: Auto-fix replaces all | `quotation-fidelity-stage.ts:257-266` | 1 hr — position-targeted replace |
| 9 | ARCH-06: Shared sentence splitter | New: `core/writing/utils/sentence-splitter.ts` | 3 hr — abbreviation-aware, used by 3+ files |
| 10 | ARCH-07: Shared author normalizer | New: `core/writing/utils/author-normalizer.ts` | 2 hr — canonical "Last, First" normalization |

**Verification**: Run full test suite. Test with adversarial inputs (long quotes, malformed citations, classical dates).

### Phase 3: New Module Backport (1-2 days)

**Goal**: Add the new modules from testing that provide infrastructure improvements.

#### 3a. Abort Controller (`core/abort/`) — CRITICAL for Stream Deck

Copy from testing:
- `src/god-agent/core/abort/pipeline-abort.ts`
- `src/god-agent/core/abort/index.ts`

Then update integration points:
- `model-router.ts` — Add abort signal composition
- `write-pipeline-orchestrator.ts` — Add `PipelineAbortController` lifecycle
- `coding-pipeline-orchestrator.ts` — Add abort checks in phase loops

**Dependencies**: None (uses built-in `fs.watch`, `AbortController`)

#### 3b. Model Router Overhaul (`core/composition/model-router.ts`) — CRITICAL

This is the most diverged file. Port these specific changes:
- Replace `@anthropic-ai/sdk` with native `fetch()` (Fix 27)
- Strip `undefined` config values in constructor (Fix 28)
- Default timeout: 30s → 120s with `AbortSignal.timeout()` (Fix 30)
- vLLM client timeout: 10s fail-fast (Fix 31)
- Abort signal integration with `PipelineAbortController`

**Strategy**: Don't copy the whole file. Apply each change as a discrete edit against OG's version.

#### 3c. Config Manager (`core/config/`) — RECOMMENDED

Copy from testing:
- `src/god-agent/core/config/config-manager.ts`
- `src/god-agent/core/config/index.ts`

**Dependencies**: None (built-in Node.js APIs only)

#### 3d. Error Recovery (`core/resilience/`) — RECOMMENDED

Copy from testing:
- `src/god-agent/core/resilience/error-recovery.ts`
- `src/god-agent/core/resilience/index.ts`

**Dependencies**: None (built-in timers/promises)

**Verification**: Test abort via Stream Deck script. Test model routing with vLLM down. Test config loading from `.god-agent/config.yaml`.

### Phase 4: Pipeline Orchestrator Backport (2-3 days)

**Goal**: Port Fix 9-60 changes to the main pipeline orchestrator and related files.

This is the highest-risk phase. `write-pipeline-orchestrator.ts` (4,093 lines) has accumulated the most changes.

#### Strategy: Fix-by-Fix Application

Do NOT copy the whole file. Apply each fix group as a discrete, testable change:

**Group A — .env and API Key (Fixes 9, 26)**
- `.env` loader in `cli.ts`
- `.env` loader in `icp-api-routes.ts`

**Group B — Prompt Construction (Fixes 10, 12, 23, 40, 41, 42, 43, 44)**
- Skip DAI-001 in write mode
- Corpus context OCR handling
- Corpus constraint "ZERO TOLERANCE" language
- Gold standard prompt enrichment
- Word target defaults and per-section targets

**Group C — Retrieval Improvements (Fixes 29, 33, 34, 35, 36, 37, 38, 45, 51, 52, 53, 55, 59)**
- Hybrid search merge fix
- Retrieval query extraction improvements
- Source-targeted supplementation
- Source diversity enforcement
- Chunk trimming and attention-aware reordering
- Phase 1b guard fix

**Group D — Generation Quality (Fixes 13, 16, 21, 24, 32, 50, 56, 57, 60)**
- `useInlineValidation` undefined→auto-enable
- Inline validation recovery logic
- Null safety for validation results
- maxTokens 2000→4000
- Quality gauntlet revision disabled
- Top-level grounding constraints
- Multi-step drafting flag
- Per-section citation constraints

**Group E — Post-Processing (Fixes 14, 15, 17, 18, 19, 20, 22, 25, 46, 47, 48, 49)**
- Prose sanitizer: meta-text leak patterns, duplicate section removal, meta-analysis sections
- Quote fidelity threshold: 0.95→0.70
- Citation enforcement: `||` → `??` (nullish coalescing)
- Second sanitizer pass
- Author scrubber: full manifest, possessive stripping
- False positive word list expansion

**Group F — Investigation (Fixes 54, 58)**
- `investigateV1()` local string-based investigation
- CLI flag stubs for NLI and candidate selection

**Verification after each group**: Run `vitest`. Run `god-write --execute` on a known topic. Compare output quality.

### Phase 5: Quality Gauntlet Fixes (1 day)

**Goal**: Fix the quality evaluation pipeline so it provides meaningful scores.

| # | Fix | File |
|---|-----|------|
| 1 | Apply weight overrides (from Phase 1) | `quality-gauntlet.ts` |
| 2 | Promise.allSettled (from Phase 2) | `quality-gauntlet.ts` |
| 3 | Fix style targets (from Phase 1) | `style-consistency-validator.ts` |
| 4 | Fix pre-1500 dates (from Phase 1) | `citation-verifier.ts` |
| 5 | Fix corpus-unavailable (from Phase 1) | `citation-verifier.ts` |
| 6 | Fix auto-fix position targeting (from Phase 2) | `quotation-fidelity-stage.ts` |

Most of these overlap with Phases 1-2. This phase is primarily about **testing the gauntlet as a whole** after individual fixes.

**Verification**: Run gauntlet on known-good text. Verify scores are reasonable (not all 0.5 defaults).

### Phase 6: Dashboard & Observability (Optional, 1 day)

**Goal**: Port dashboard improvements if OG uses the observability dashboard.

- `icp-api-routes.ts` — .env loader, manifest caching
- `icp-panel.js` — UI improvements
- `styles.css` — Visual updates
- `express-server.ts` — Any structural changes

**Skip if**: OG doesn't use the dashboard actively.

---

## 4. Files NOT to Port

These exist in testing but should NOT go to OG:

| File/Directory | Reason |
|---------------|--------|
| `*.pre-*-bak` files (100+) | Development artifacts, not production code |
| `*.git-version` files | Diff snapshots |
| `plans/` directory | Session-specific planning documents |
| `tmp/` directory | Temporary files |
| `streamdeck/` scripts | WSL2-specific; port only if OG runs in WSL2 |
| `phantasia-analysis/`, `phantasia-structured/` | Domain-specific analysis outputs |
| `god-learn/`, `god-reason/` data files | Corpus-specific data |

---

## 5. Dependency Changes

**No new npm packages required.** All new modules use built-in Node.js APIs:

- `core/abort/` → `fs.watch`, `AbortController` (built-in)
- `core/config/` → `fs`, custom YAML parsing (built-in)
- `core/resilience/` → `timers/promises` (built-in)
- `core/gpu/` → `child_process` (built-in)

**One removal possible**: `@anthropic-ai/sdk` can be removed from `model-router.ts` if native `fetch()` is adopted (Fix 27). However, other files may still import it — verify before removing from `package.json`.

---

## 6. Test Strategy

### Existing Tests to Update

Tests in `tests/god-agent/` that reference modified files need re-verification:

- `tests/god-agent/core/composition/model-router.test.ts` — Update for native fetch
- `tests/god-agent/retrieval/smart-retrieval-layer.test.ts` — Update for L2→cosine
- All quality gauntlet stage tests — Verify against new targets

### New Tests to Add

| Test File | Covers |
|-----------|--------|
| `tests/god-agent/core/abort/pipeline-abort.test.ts` | File sentinel, abort propagation |
| `tests/god-agent/universal/investigate-v1.test.ts` | Copy from testing (7 tests exist) |
| Sentence splitter unit tests | Abbreviation handling, edge cases |
| Author normalizer unit tests | Format variations, Unicode |

### Integration Test

After all phases: run `god-write --execute` with:
1. A philosophical topic (tests classical date handling, compound terms)
2. A topic with known corpus coverage (tests retrieval + citation)
3. A multi-section topic (tests word targets, rolling context)

---

## 7. Estimated Timeline

| Phase | Effort | Cumulative |
|-------|--------|-----------|
| Phase 0: Pre-flight | 30 min | 30 min |
| Phase 1: P0 bug fixes | 2-3 hr | ~3.5 hr |
| Phase 2: P1 crash prevention | 1-2 days | ~2 days |
| Phase 3: New module backport | 1-2 days | ~3.5 days |
| Phase 4: Pipeline orchestrator | 2-3 days | ~6 days |
| Phase 5: Quality gauntlet | 1 day | ~7 days |
| Phase 6: Dashboard (optional) | 1 day | ~8 days |

**Total estimate**: 7-8 working days for full port, or **3-4 days** for Phases 0-3 (critical fixes + new infrastructure).

---

## 8. Decision Points

Before starting, decide:

1. **Full port vs critical-only?** Phases 0-3 get you 80% of the value. Phases 4-6 are the remaining 20% with higher risk.
2. **Stream Deck support needed in OG?** If yes, Phase 3a (abort controller) is mandatory.
3. **Dashboard used in OG?** If no, skip Phase 6 entirely.
4. **Should OG switch from `@anthropic-ai/sdk` to native `fetch()`?** Fix 27 works, but it's a significant change.
5. **Test coverage target?** The analysis notes minimal test coverage for a 45K-line subsystem. How much new testing to add?

---

*Plan generated 2026-03-20. Based on analysis of 95 findings across 55 files in god-write-system-analysis.md, cross-referenced against claudeflow-OG file inventory (713 files).*
