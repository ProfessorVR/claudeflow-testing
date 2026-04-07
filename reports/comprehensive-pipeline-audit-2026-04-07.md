# Comprehensive Pipeline Audit Report

**Date**: 2026-04-07
**Scope**: Line-by-line forensic analysis of all knowledge, reasoning, writing, retrieval, quality, endnote, corpus index, and dashboard systems
**Finding Count**: 42 total — 5 CRITICAL, 12 HIGH, 16 MEDIUM, 9 LOW

---

## Executive Summary

The audit reveals three systemic issues that underpin the majority of individual findings:

1. **JSONL loading duplication** (F-29, F-30): Reasoning edges are loaded in 4 separate locations, KUs in 3 — with divergent validation, caching, and confidence mapping. This is the single largest source of bugs and maintenance risk.

2. **Silent retrieval failure** (F-13): The SmartRetrievalLayer returns an empty array on infrastructure failure, indistinguishable from "no relevant chunks." The writing pipeline then generates ungrounded content with no warning.

3. **Dashboard drift** (F-25, F-26, F-27, F-28): The dashboard has diverged significantly from the CLI — no Zod validation, no mtime caching, divergent confidence mapping, independent SmartRetrievalLayer instances, and no v2 pipeline support.

---

## CRITICAL FINDINGS (5)

### F-13: Silent Empty-Array Return on Retrieval Infrastructure Failure

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts:260-263`
**Category**: ERROR
**Description**: When `retrieveContext` throws ANY error (ChromaDB down, network timeout, DNS failure), it catches the error, logs a warning, and returns `[]`. The caller receives zero chunks with NO indication that retrieval failed. The writing pipeline cannot distinguish "no relevant chunks found" from "retrieval infrastructure is down" and proceeds to generate entirely ungrounded content.
**Recommended fix**: Return a discriminated result type `{ ok: true, chunks } | { ok: false, error }`, or throw on infrastructure failures and only return `[]` on legitimate empty results.

### F-25: Dashboard Creates 3 Independent SmartRetrievalLayer Instances

**File**: `src/god-agent/observability/icp-api-routes.ts:95, 1506, 1702`
**Category**: ERROR
**Description**: The dashboard creates up to three separate `SmartRetrievalLayer` instances with NO configuration (hardcoded `localhost:8001`/`localhost:8000` defaults). Each has its own KG cache and collection resolution state. If services run on different ports, the dashboard silently fails while the CLI works.
**Recommended fix**: Create a single shared `SmartRetrievalLayer` instance with proper configuration, injected into all routes.

### F-26: Dashboard Bypasses Zod Validation for Knowledge Units

**File**: `src/god-agent/observability/express-server.ts:2570-2598`
**Category**: TRAP
**Description**: The dashboard loads `knowledge.jsonl` via raw `JSON.parse` WITHOUT Zod validation. String confidences ("high"/"medium"/"low") are NOT normalized — they pass through and hit a divergent `confidenceMap` (`medium: 0.7, low: 0.5` vs CLI's `medium: 0.6, low: 0.3`). Malformed KUs crash the dashboard but are gracefully skipped in the CLI.
**Recommended fix**: Use `parseKnowledgeUnit()` from `retrieval/types.ts` in all dashboard code paths.

### F-40: .env Loader Unconditionally Overwrites All Environment Variables

**File**: `src/god-agent/observability/icp-api-routes.ts:62-80`
**Category**: TRAP
**Description**: The `.env` loader uses `process.env[key] = value` which ALWAYS overwrites, even shell-set, CI-injected, or Docker env vars. Dangerous for deployment environments where env vars should take precedence.
**Recommended fix**: Only set if `!process.env[key]`, or limit the override to specific known-problematic keys like `ANTHROPIC_API_KEY`.

### F-42: kgLoaded Flag Set Before Loading Completes — Reload Loop Risk

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts:687`
**Category**: TRAP
**Description**: `this.kgLoaded = true` is set BEFORE file reading and parsing. If the read fails, `kgKUs = []` and `kgLoaded = true`, but `kgKUMtimeMs = 0`. On the next call, the mtime check detects a "change" (0 vs actual mtime) and reloads. If the failure persists (permission error, corrupt file), this creates a reload loop on every call.
**Recommended fix**: Move `this.kgLoaded = true` to after both load attempts complete, or track "attempted" vs "succeeded" separately.

---

## HIGH FINDINGS (12)

### F-01: Knowledge Manager Uses Zero-Vector Full-Corpus Scan for ID Lookup

**File**: `src/god-agent/universal/knowledge-manager.ts:176`
**Category**: WEAKNESS
**Description**: `retrieveKnowledge()` creates a zero-vector embedding and queries with `k:100, minSimilarity:0` — a full-corpus linear scan with no semantic meaning. O(n) on every ID lookup.
**Recommended fix**: Add a direct ID-based lookup or maintain an in-memory ID-to-content map.

### F-02: Confidence Normalization Diverges Between CLI and Dashboard

**File**: `knowledge-manager.ts:537` vs `express-server.ts:2584`
**Category**: REDUNDANCY / TRAP
**Description**: CLI maps `{high: 0.9, medium: 0.6, low: 0.3}`. Dashboard maps `{high: 0.9, medium: 0.7, low: 0.5}`. Same KU shows different quality scores depending on the interface.
**Recommended fix**: Import the Zod `confidenceToNumber` transform everywhere. Delete all local `confidenceMap` objects.

### F-05: Python reason_id vs TypeScript id Field Mismatch

**File**: `scripts/reason/reason_over_knowledge.py:284` vs `src/god-agent/retrieval/types.ts:46`
**Category**: TRAP
**Description**: Python emits `reason_id`, Zod validates on `id`. The merge script patches this, but direct pipeline runs without the merge step will fail Zod validation and silently drop every edge.
**Recommended fix**: Add `reason_id: z.string().optional()` to the Zod schema and default `id` from `reason_id` via `.transform()`.

### F-08: Merge Script Reads and Writes Same File — Data Loss Risk

**File**: `scripts/merge-reasoning-edges.py:19`
**Category**: TRAP
**Description**: `PHASE7_SOURCE` and `OUTPUT` both point to `god-reason/reasoning.jsonl`. A crash between read (line 87) and write (line 206) destroys the file. Running twice without re-generating edges duplicates manual edges.
**Recommended fix**: Write to a temp file, atomically rename. Add an idempotency guard.

### F-12: API Fallback Silently Downgrades from Opus to Sonnet

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts:1027, 1213`
**Category**: WEAKNESS
**Description**: `generateViaClaudeCode` specifies `claude-opus-4-6` but on failure, the API fallback uses `claude-sonnet-4-20250514` — a significant quality downgrade for academic writing, with no warning.
**Recommended fix**: Pass the intended model tier through to the API fallback.

### F-27: Dashboard Has No mtime Cache Invalidation

**File**: `src/god-agent/observability/express-server.ts`, `icp-api-routes.ts:386-399`
**Category**: GAP
**Description**: The dashboard's knowledge/manifest loading has no mtime-based cache invalidation. Once loaded, data is never refreshed even if the underlying JSONL files change.
**Recommended fix**: Add mtime-based caching consistent with the CLI pipeline.

### F-28: Dashboard Bypasses the Entire V2 Staged Pipeline

**File**: `src/god-agent/observability/icp-api-routes.ts`
**Category**: GAP
**Description**: The dashboard's ICP routes use an independent `generateFromEvidence` path that bypasses chunk trimming, attention reordering, coverage validation, source diversity enforcement, and the structured validation stage.
**Recommended fix**: Route through the same staged pipeline infrastructure, or apply equivalent processing steps.

### F-29: Reasoning Edge Loading Duplicated in 4 Locations

**Files**: `smart-retrieval-layer.ts`, `quality-integration.ts`, `retrieval-stage.ts:360`, `write-pipeline-orchestrator.ts:319`
**Category**: REDUNDANCY
**Description**: Two use Zod validation, two use raw `JSON.parse`. Two have mtime caching, two do not. Schema changes must be replicated in four places.
**Recommended fix**: Create a single `loadReasoningEdges()` function in a shared module with Zod validation and mtime caching.

### F-30: Knowledge Unit Loading Duplicated in 3 Locations

**Files**: `smart-retrieval-layer.ts`, `retrieval-stage.ts:293`, `express-server.ts:2558`
**Category**: REDUNDANCY
**Description**: Same pattern as F-29 — divergent parsing, validation, and confidence mapping.
**Recommended fix**: Single shared loader function with Zod validation.

### F-31: Model ID Mismatch in API Fallback

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts:1213`
**Category**: TRAP
**Description**: `'claude-opus-4-6'` may not be a valid Anthropic API model identifier (needs date suffix). This would cause a 400 error from the API with no further fallback.
**Recommended fix**: Maintain a mapping of shorthand names to full API model IDs.

### F-14: Config Spread Overwrites Merged Nested Defaults

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts:95`
**Category**: TRAP
**Description**: `...config` at the end of the constructor spread replaces the carefully merged nested objects (`chromadb`, `embeddingApi`, etc.) with the caller's partial objects, losing the default values.
**Recommended fix**: Remove the trailing `...config` spread.

### F-41: Dashboard Session Store Has No TTL or Cleanup

**File**: `src/god-agent/observability/icp-api-routes.ts:106-115`
**Category**: WEAKNESS
**Description**: In-memory `Map<string, ICPSession>()` with no persistence, no TTL, no max-sessions limit. Sessions grow unboundedly; server restart loses all state.
**Recommended fix**: Add a session TTL (e.g., 24 hours) with periodic cleanup.

---

## MEDIUM FINDINGS (16)

| ID | File | Category | Description |
|----|------|----------|-------------|
| F-03 | knowledge-manager.ts:554 | WEAKNESS | Empty catch swallows malformed JSONL — no warning emitted |
| F-04 | knowledge-manager.ts:505 | GAP | `updateUsageStats()` is a no-op — usage fields never updated |
| F-06 | reason_over_knowledge.py:148 | GAP | Edge directionality is arbitrary for asymmetric relations |
| F-09 | write-pipeline-orchestrator.ts:319 | TRAP | `extractRetrievalQueries` loads edges via raw JSON.parse without Zod |
| F-10 | write-pipeline-orchestrator.ts:517 | WEAKNESS | Hardcoded `heidegger` check for quotation requirements |
| F-11 | write-pipeline-orchestrator.ts:842 | WEAKNESS | `extractSectionStats` citation regex misses non-italicized formats |
| F-15 | smart-retrieval-layer.ts:773 | GAP | Stopword "being" unprotected if compiled-index.json is missing |
| F-16 | types.ts:81 | TRAP | `parseKnowledgeUnit` calls `JSON.parse` twice on validation failure |
| F-17 | quality-integration.ts:421 | WEAKNESS | Edge coherence penalty ignores derivation tier weighting |
| F-22 | endnote-generator.ts:426 | GAP | Citation patterns miss lowercase-starting authors (von Uexkull) |
| F-32 | retrieval-stage.ts:229 | TRAP | Keyword expansion mutates relevanceScore on already-seen chunks |
| F-08 | merge-reasoning-edges.py:19 | TRAP | Read/write same file — crash destroys data |
| F-14 | smart-retrieval-layer.ts:95 | TRAP | Config spread overwrites merged nested defaults |
| F-18 | quality-integration.ts:193 | GAP | `\w` in relation patterns doesn't match Greek/German characters |
| F-36 | quality-integration.ts:210 | GAP | `is_variant_of` missing from contradiction relation sets |
| F-41 | icp-api-routes.ts:106 | WEAKNESS | Session store has no TTL or cleanup |

---

## LOW FINDINGS (9)

| ID | File | Category | Description |
|----|------|----------|-------------|
| F-07 | reason_over_knowledge.py:182 | REDUNDANCY | 40 lines of commented-out `topic_bucket` function |
| F-19 | corpus-index-provider.ts:122 | WEAKNESS | Topic term filter drops 3-letter philosophical terms (act, one, end) |
| F-20 | corpus-index-provider.ts:77 | GAP | Compiled index cache has no TTL alongside mtime checks |
| F-21 | compile-corpus-index.py:61 | GAP | TypeScript OntologyNode interface missing Python-emitted fields |
| F-23 | endnote-generator.ts:640 | WEAKNESS | `location.paragraphIndex` always 0, never computed |
| F-24 | endnote-generator.ts:291 | GAP | EndnoteGenerator is stateful — cumulative numbering across calls |
| F-33 | domain-config.ts:78 | WEAKNESS | Domain config cache has no invalidation mechanism |
| F-34 | smart-retrieval-layer.ts:488 | WEAKNESS | `getCacheStats().hitRate` measures re-access ratio, not actual hit rate |
| F-37 | gold-standard-config.ts | WEAKNESS | Frozen config with no runtime override mechanism |
| F-38 | retrieval-stage.ts:344 | WEAKNESS | `console.error` with emoji bypasses structured logger |
| F-35 | write-pipeline-orchestrator.ts:812 | WEAKNESS | Chunk dedup key uses undefined `source_id` field |
| F-39 | endnote-generator.ts:56 | WEAKNESS | Bbox rendering has no concurrency limit — corrupted PDF causes cascade timeout |

---

## Implementation Priorities

### Priority 1: Eliminate JSONL Loading Duplication (fixes 8 findings)

Create `src/god-agent/shared/jsonl-loaders.ts` with Zod-validated, mtime-cached loaders for both KUs and edges. Import everywhere. This single refactor resolves: F-02, F-05, F-09, F-26, F-29, F-30, and partially F-27.

### Priority 2: Fix Silent Retrieval Failure (F-13)

Return a discriminated result type from `retrieveContext()`. The writing pipeline must abort or warn when retrieval infrastructure is down rather than silently generating ungrounded content.

### Priority 3: Dashboard Parity (F-25, F-26, F-27, F-28, F-40)

- Single shared SmartRetrievalLayer instance
- Zod validation for all JSONL loading
- mtime cache invalidation
- Route through v2 staged pipeline
- Fix .env loader to not overwrite shell env vars

### Priority 4: KG Loading Flag Race (F-42)

Move `kgLoaded = true` to after successful loading to prevent reload loops on persistent failures.

### Priority 5: Model Fallback Chain (F-12, F-31)

Ensure the API fallback preserves the intended model tier and uses valid API model identifiers.

---

## Verification Commands

```bash
# Check for remaining raw JSON.parse of JSONL files (should be 0 after Priority 1):
grep -rn 'JSON.parse.*line\|JSON.parse.*l)' src/god-agent/ --include='*.ts' | grep -v node_modules | grep -v '.bak' | grep -v types.ts

# Check for divergent confidence mappings (should be 0 after Priority 1):
grep -rn 'medium.*0\.[567].*low.*0\.[35]' src/god-agent/ --include='*.ts' | grep -v node_modules

# Check for multiple SmartRetrievalLayer instantiations (should be 1 after Priority 3):
grep -rn 'new SmartRetrievalLayer' src/god-agent/ --include='*.ts' | grep -v node_modules | grep -v '.bak'

# Check kgLoaded flag placement:
grep -n 'kgLoaded = true' src/god-agent/retrieval/smart-retrieval-layer.ts
```
