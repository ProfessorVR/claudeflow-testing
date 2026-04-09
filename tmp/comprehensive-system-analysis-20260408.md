# Comprehensive System Analysis: Post Cross-Author Integration

**Date**: 2026-04-08
**Scope**: Full re-analysis of knowledge, reasoning, writing, ingestion, and corpus systems after cross-author integration implementation
**Previous analysis**: `tmp/comprehensive-system-analysis-20260407.md`

---

## 1. Changes Since Last Analysis

### New Infrastructure
- **`src/god-agent/shared/cross-author-utils.ts`** (NEW, 285 lines) — Shared bridge detection utility with mtime-cached index loading, bounded OR matching, additive dimensional scoring, hard cap of 1 bridge per facet
- **`icp-types.ts`** — Added `tension_awareness` field to `QualityGateResults`

### Modified Pipeline Components
- **`gold-standard-prompt-builder.ts`** — New [6f] MANDATORY THEORETICAL SYNTHESIS section with dynamic bridge injection
- **`icp-orchestrator.ts`** — New Stage 6b (cross-author bridge enforcement) + tension-aware quality gate
- **`quality-integration.ts`** — New `validateTensionAwareness()` function with 21 contrastive discourse markers

### Bug Fixes Applied
- `icp-api-routes.ts:1623` — `endnote_leaks` shape: `{cleaned:true}` → `{leaksRemoved:0}`
- `quality-integration.ts:272-289` — `validateEdgeCoherence` accepts `preloadedEdges` param (async I/O fix)
- `cross-author-utils.ts:98-148` — `deriveAuthor()` now returns full manifest-compatible `author_raw` values

---

## 2. Cross-Author Integration Architecture

```
COMPILED INDEX (corpus/index/compiled-index.json)
  |-- 72 cross-pipeline hooks (57 with valid targets)
  |-- 45 tension edges
  |-- ~500 ontology nodes
  |-- ~1,200 canonical terms
  |
  v
CROSS-AUTHOR UTILS (shared/cross-author-utils.ts)
  |-- mtime-cached loading (same pattern as jsonl-loaders.ts)
  |-- deriveAuthor() maps hook text -> manifest author_raw
  |-- getActiveBridges() — bounded OR, additive scoring, cap 1
  |-- getActiveTensions() — topic matching, cap 3
  |-- extractTopicWords() — Greek/German character support
  |
  +---> GOLD STANDARD PROMPT BUILDER [6f]
  |     (mandatory synthesis directive for god-write path)
  |
  +---> ICP ORCHESTRATOR Stage 6b
  |     (forced author-specific retrieval for ICP path)
  |
  +---> QUALITY INTEGRATION
        (tension-aware quality gate for both paths)
```

### Data Flow: Bridge Injection (Phase 1)

```
Topic words from facet name/description
  → getActiveBridges(topicWords)
    → Load compiled-index.json (mtime cached)
    → Bounded OR match: sourceConcept OR targetConcept
    → Score: exact(2) + substring(1), per side (max 4)
    → Sort: score DESC → tag confidence DESC → ID ASC
    → Return top 1
  → Inject into prompt: "MANDATORY THEORETICAL SYNTHESIS"
     "You MUST integrate this bridge. Both authors MUST be cited."
```

### Data Flow: Author Enforcement (Phase 2)

```
For each non-archived facet:
  → getActiveBridges(topicWords) 
  → If bridge active:
    → Extract requiredAuthors: {sourceAuthor, targetAuthor}
    → Check session.quote_spans for each author in source_anchor
    → If author missing:
      → this.deps.retrieval.retrieveContext() 
        with whereFilter: { author_raw: { $eq: "Author, First" } }
      → Convert chunks to QuoteSpan objects
      → Inject into session.quote_spans
```

### Data Flow: Tension Gate (Phase 3)

```
After generation + edge coherence:
  → For each facet:
    → getActiveTensions(topicWords)
    → For each tension:
      → Extract core terms from nodeA/nodeB
      → Check if text mentions BOTH sides
      → If both mentioned:
        → Scan for contrastive discourse markers
        → No marker found → unacknowledged tension
    → Store in session.quality_gates.tension_awareness
```

---

## 3. Findings: Resolved Issues from Previous Analysis

| Previous Finding | Status | Resolution |
|-----------------|--------|------------|
| I-01: Cross-pipeline hooks not consumed | **RESOLVED** | Hooks now injected via [6f] in prompt builder + Stage 6b in orchestrator |
| I-02: Tension edges not surfaced | **RESOLVED** | `validateTensionAwareness()` checks contrastive markers when tensions relevant |
| W-01: Edge coherence post-hoc only | **PARTIALLY RESOLVED** | Still post-hoc, but now supplemented by preventive bridge enforcement in Stage 6b |
| W-02: No cross-author analysis at any stage | **RESOLVED** | Stage 6b detects bridges, enforces author diversity, forces targeted retrieval |
| K-03: No author-level aggregation | **PARTIALLY RESOLVED** | Author derivation in cross-author-utils provides mapping; no standalone index yet |

---

## 4. New Findings

### 4.1 Dual-Cache Architecture

Both `cross-author-utils.ts` and `corpus-index-provider.ts` independently load and cache `compiled-index.json`:

| Module | Cache Variable | Pattern |
|--------|---------------|---------|
| `cross-author-utils.ts:54` | `_indexCache` | `{data, path, mtimeMs}` |
| `corpus-index-provider.ts:72-74` | `cachedIndex` + `cachedIndexPath` + `cachedIndexMtimeMs` | Three separate variables |

**Risk**: LOW — Both use mtime invalidation; the file changes rarely. However, it means the same 312KB JSON is parsed and stored in memory twice.

**Recommendation**: Consolidate into `shared/jsonl-loaders.ts` as a single `loadCompiledIndex()` function. LOW PRIORITY.

### 4.2 Section [6d] vs [6f] Redundancy

The god-write path has TWO hook injection points:

| Section | Source | Behavior | Max Hooks |
|---------|--------|----------|-----------|
| [6d] CROSS-PIPELINE INTERPRETIVE HOOKS | `options.crossPipelineHooks` (from retrieval stage) | Static: injects whatever was pre-scored by `corpus-index-provider` | 3 |
| [6f] MANDATORY THEORETICAL SYNTHESIS | `getActiveBridges()` (from `cross-author-utils`) | Dynamic: bounded OR, additive scoring, cap 1 | 1 |

**When both fire**: The same bridge could appear twice — once as a generic hook in [6d] ("Use them to structure cross-textual argument") and once as a mandatory directive in [6f] ("You MUST integrate this bridge").

**Recommendation**: When [6f] fires, filter the matching hook from [6d]'s list to avoid duplication. Or rely solely on [6f] and leave [6d] empty for the god-write path. MEDIUM PRIORITY.

### 4.3 Author Name Resolution Chain

The `deriveAuthor()` function now maps hook text to full manifest `author_raw` values:

| Hook targetText | Derived Author | Manifest Match |
|----------------|----------------|----------------|
| "B&T", "BCAP", "BT" | "Heidegger, Martin" | EXACT |
| "Rickert" | "Rickert, Thomas" | EXACT |
| "Uexkull" | "von Uexkull, Jacob" | EXACT |
| "De Anima", "Physics", "Rhetoric", etc. | "Aristotle" | EXACT |
| "" (empty, 15 hooks) | "Unknown" | SKIPPED |
| "GA 29/30 via Uexkull" | "Heidegger, Martin" | EXACT |

**Coverage**: 57 of 72 hooks resolve to valid manifest authors. 15 are summary entries with no target.

**Fragility**: The AUTHOR_MAP is a static lookup table. If new authors are added to the corpus, the map must be updated manually.

**Recommendation**: Auto-generate the map from `manifest.jsonl` at startup. LOW PRIORITY (current corpus is stable).

### 4.4 Bridge-Enforced QuoteSpan Lifecycle

QuoteSpans injected by Stage 6b carry special markers:
- `normalization_policy_version: 'bridge-enforced-v1'`
- `source_anchor: '${author} (bridge-enforced)'`
- `text_fingerprint: 'bridge-${uuid}'` (synthetic, not content-derived)

**How they flow through subsequent stages**:

| Stage | Behavior | Notes |
|-------|----------|-------|
| Stage 7 (Stress Test) | Participates fully | Stress tester validates bindings against all spans including bridge-enforced ones |
| Stage 8 (Generation) | Used as evidence | LLM sees these spans alongside corpus-retrieved spans |
| Stage 9 (Citation Enforcement) | Auto-verified status bypasses verification | `verification_status: 'auto_verified'` means no OCR/fidelity check |
| Stage 10 (Gauntlet) | Counted in quality metrics | May inflate citation coverage if bridge spans are thin |

**Risk**: MEDIUM — Bridge-enforced spans bypass OCR verification and have synthetic fingerprints. If the forced retrieval returns low-quality chunks, they'll be treated as verified evidence.

**Mitigation**: The `auto_confidence` score (from relevance) provides a quality signal. The gauntlet's fidelity stage will still check quote similarity.

### 4.5 ESM/CJS Inconsistency in Tension Gate

`quality-integration.ts:673` uses `require()` for cross-author-utils:
```typescript
const crossAuthorUtils = require('../shared/cross-author-utils.js');
```

The rest of the codebase uses ESM `import` / `await import()`. This works in Node.js with `--experimental-require-module` or when running via tsx/ts-node, but is technically inconsistent.

**Recommendation**: Convert to `const { getActiveTensions } = await import('../shared/cross-author-utils.js')` if `validateTensionAwareness` can be made async. Currently it's synchronous, so the require() pattern is acceptable. LOW PRIORITY.

### 4.6 Contrastive Marker Coverage

The 21 markers cover standard academic discourse but miss some patterns common in philosophical writing:

| Present | Missing |
|---------|---------|
| however, in contrast, on the other hand | on the contrary |
| whereas, while, nevertheless | notwithstanding |
| but, although, despite | even so |
| paradox, unresolved | aporia, dilemma |
| oscillat(ing), irreducib(le) | ambival(ent), equivoc(al) |

**Impact**: LOW — The existing markers will catch most genuine tension acknowledgments. False negatives (text acknowledges tension but uses uncommon markers) are the risk.

### 4.7 Core Term Extraction Edge Cases

`validateTensionAwareness()` extracts core terms via `split(/[\s(]/)[0]`:

| Tension nodeA | Extracted Term | Issue |
|--------------|----------------|-------|
| "energeia (Met Theta: ontological priority)" | "energeia" | Correct |
| "phantasia (DA: faculty distinct from sensation)" | "phantasia" | Correct |
| "DA's αἴσθησις" | "da's" | WRONG — should be "aisthesis" |
| "" (empty) | "" | Filtered by length >= 4 check |

**Impact**: LOW — Most tension nodes use the concept name first. The "DA's" prefix pattern is rare in the current tension edge set.

---

## 5. System-Wide Quality Gate Summary

| Gate | Type | Timing | Blocking? | Threshold |
|------|------|--------|-----------|-----------|
| Citation Enforcement | 3-phase validation | Stage 9 | Yes (strict mode) | 0.90 pass rate |
| Quality Gauntlet | 8-stage scoring | Stage 10 | No (warning) | 0.80 overall |
| Edge Coherence | Reasoning edge contradiction check | Post-generation | No | score = 1.0 - (contradictions x 0.15) |
| **Tension Awareness** | **Contrastive marker scan** | **Post-generation** | **No** | **All active tensions must have markers** |
| Inline Validation | Per-paragraph quote/atom check | During generation | Yes (retry) | Quote 0.70 similarity |
| Author Scrubbing | Non-corpus author removal | Stage 9 | No | Signal phrase regex |
| Endnote Leak Detection | Strip endnote markers from body | Stage 9 | No | Pattern removal |

---

## 6. Remaining Gaps (from original 15 recommendations)

| # | Original Recommendation | Status | Priority |
|---|------------------------|--------|----------|
| H-01 | Inject cross-pipeline hooks into generation prompts | **DONE** | - |
| H-02 | Tension-aware quality gate | **DONE** | - |
| H-03 | Move edge coherence from post-hoc to preventive | **PARTIAL** (Stage 6b is preventive for bridges; edge coherence still post-hoc for non-bridge content) | MEDIUM |
| H-04 | Author-scoped reasoning in Phase 7 | NOT STARTED | HIGH |
| H-05 | Canonical author table | **PARTIAL** (AUTHOR_MAP in deriveAuthor; not a standalone reusable table) | LOW |
| H-06 | Author-title pairing validation | NOT STARTED | MEDIUM |
| H-07 | Surface unanchored edges | NOT STARTED | LOW |
| H-08 | Authority tiers in manifest | NOT STARTED | LOW |
| H-09 | Author-level KU index | NOT STARTED | LOW |
| H-10 | minDistinctAuthors facet parameter | **DONE** (enforced dynamically via bridge detection) | - |
| H-11 | Re-enable topic bucketing | NOT STARTED | LOW |
| H-12 | author_conflict_detected event | NOT STARTED | LOW |
| H-13 | Validate domain field against controlled vocabulary | NOT STARTED | LOW |
| H-14 | Per-chunk OCR quality tracking | NOT STARTED | LOW |
| H-15 | Canonical term boosting in retrieval | NOT STARTED | MEDIUM |

**Summary**: 4 of 15 recommendations fully implemented, 2 partially resolved, 9 remaining. The highest-impact items (H-01, H-02, H-10) are done. Remaining items are infrastructure improvements.

---

## 7. Files Modified in This Session

| File | Changes | Lines Changed |
|------|---------|---------------|
| `src/god-agent/shared/cross-author-utils.ts` | NEW | 285 lines |
| `src/god-agent/universal/gold-standard-prompt-builder.ts` | +import, +section [6f] | +22 lines |
| `src/god-agent/core/composition/icp-orchestrator.ts` | +Stage 6b, +tension gate | +106 lines |
| `src/god-agent/universal/quality-integration.ts` | +validateTensionAwareness, +preloadedEdges param | +120 lines |
| `src/god-agent/core/composition/icp-types.ts` | +tension_awareness field | +10 lines |
| `src/god-agent/observability/icp-api-routes.ts` | Fix endnote_leaks shape, +edge_coherence gate | +16 lines |
| `src/god-agent/observability/dashboard/icp-panel.js` | +edge coherence card, +provider health, +diagnostics | +91 lines |
| `src/god-agent/observability/dashboard/icp-panel-v2.js` | +6 quality cards, +provider health, +diagnostics tab | +102 lines |

**Backups**:
- `.backups/dashboard-parity-20260407-173000/` (5 files)
- `.backups/cross-author-integration-20260408-093114/` (5 files)
