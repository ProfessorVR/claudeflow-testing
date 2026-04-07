# Post-Implementation Forensic Analysis Report

**Date**: 2026-04-06
**Scope**: Line-by-line analysis of all knowledge, retrieval, writing, visual provenance systems after KG Infrastructure Repair
**Methodology**: Two parallel forensic investigations — (1) all modified/created files, (2) all existing pipeline code

---

## Executive Summary

The KG Infrastructure Repair successfully resolved 7 critical gaps. However, forensic analysis revealed **6 CRITICAL, 12 HIGH, 14 MEDIUM, and 7 LOW** findings across the full pipeline. The most dangerous: the newly-enabled `boostWithKnowledgeGraph()` has 3 correctness bugs that silently degrade retrieval boosting, and the merged `reasoning.jsonl` contains 419 self-referential edges and 1,351 duplicates that pollute prompt injection.

**Immediate action required on**: self-referential edge removal, duplicate deduplication, stopword exemption for edge concepts.

---

## CRITICAL FINDINGS (6)

### C-01: 419 Self-Referential Edges in reasoning.jsonl

**File**: `god-reason/reasoning.jsonl`
**Impact**: Edges where `source == target` (e.g., "Rhetoric contrasts_with Rhetoric") match broadly against topics, consume the 30-edge prompt slot budget, and produce false positives in edge coherence validation.

**Fix**: Add `e['source'] != e['target']` filter in `merge-reasoning-edges.py` at the anchoring step. Re-run merge.

### C-02: 1,351 Duplicate Edge Triples in reasoning.jsonl

**File**: `god-reason/reasoning.jsonl`
**Impact**: Duplicate `(source, relation, target)` triples amplify certain relationships and starve unique edges of prompt representation.

**Fix**: Add deduplication by `(source.lower(), relation, target.lower())` triple in `merge-reasoning-edges.py`. Keep the edge with highest `corroboration_score`.

### C-03: KG Edge Traversal Fails on Stopword Concepts ("Being", "being")

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts`, lines 577-583
**Impact**: The `tokenize()` function (line 729) removes "being" as a stopword. Edge concepts like "Being" (core Heidegger concept) are lowercased to "being" then removed from `topicWords`. The edge traversal at line 577-583 checks `topicWords.has(src)` — this NEVER matches "being", silently breaking KG boosting for a central concept in the corpus.

**Fix**: Exempt edge concept terms from stopword filtering. Add a second check: `|| rawTopicLower.includes(src)` to match against the unfiltered topic string.

### C-04: KU `confidence` Type Mismatch

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts`, line 41
**Impact**: Interface declares `confidence: number` but actual JSONL stores `"high"`, `"medium"`, `"low"` strings. JavaScript coercion means `"high" > 0.5` evaluates to `true` — any future numeric comparison will silently produce wrong results.

**Fix**: Change interface to `confidence: string | number` and normalize on load.

### C-05: KU `sources` Schema Mismatch

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts`, line 40
**Impact**: Interface declares `pages: number[]` but actual data stores `pages: "356-358"` (string). `doc_id` doesn't exist in actual data. `title`, `path_rel`, `has_bboxes`, `source_method`, `bboxes` exist but aren't in the interface. Not currently causing crashes (sources array is unused) but any future access will break.

**Fix**: Update interface to match actual JSONL schema.

### C-06: ReasoningEdge Interface Defined in 3 Separate Files with Divergent Schemas

**Files**: `smart-retrieval-layer.ts:48`, `quality-integration.ts:156`, `write-pipeline-orchestrator.ts` (implicit `as any` casts)
**Impact**: `confidence` is `string | number` in one, `string` in another. `derivation` is generic `string` in one, union type in another. `knowledge_ids` exists in one, absent in another. Drift will silently introduce bugs.

**Fix**: Extract shared `ReasoningEdge` to `src/god-agent/retrieval/types.ts` (which already exists). Both modules import from there.

---

## HIGH FINDINGS (12)

### H-01: Legacy `write()` Path Has Inferior KU Logic

**File**: `write-pipeline-orchestrator.ts`, lines 1830-1855
**Impact**: Legacy path uses single-path KU filter (keyword only, cap 10). V2 path uses dual-path (keyword + domain label, cap 15) + pre-flight warning. Different outputs for same input.

**Fix**: Backport v2 logic to legacy path, or mark legacy as deprecated.

### H-02: Legacy Edge Filter Lacks Guard

**File**: `write-pipeline-orchestrator.ts`, line 1869-1872
**Impact**: Missing `if (!src && !tgt) return false;` guard present in v2 path. Edges with empty source/target would pass through.

**Fix**: Add the guard.

### H-03: Module-Level Caches Never Invalidate

**Files**: `corpus-index-provider.ts:72`, `quality-integration.ts:222`, `smart-retrieval-layer.ts:77`
**Impact**: In long-running processes (dashboard, daemon), stale knowledge graphs persist after recompilation.

**Fix**: Add file mtime checks or wire up a `clearCaches()` signal.

### H-04: 55 Duplicate Ontology Node Names in compiled-index.json

**File**: `corpus/index/compiled-index.json`
**Impact**: Duplicate names (e.g., "Substance" from both DA and Met) waste the 12-node prompt budget.

**Fix**: Merge nodes with same canonical name across texts in `compile-corpus-index.py`.

### H-05: `normalize_edge()` in report.py Drops `source`/`target` Concept Names

**File**: `scripts/interaction/report.py`, lines 341-357
**Impact**: Normalized edges lack concept labels. Only the `raw` field preserves them.

**Fix**: Add `"source"` and `"target"` to the normalized output.

### H-06: `infer_relation()` Collapses Two Distinct Similarity Tiers to "supports"

**File**: `scripts/reason/reason_over_knowledge.py`, lines 117-152
**Impact**: `"inheritance"` (score >= 0.18, near-duplicate) and `"support"` (score >= 0.08, modest) both map to `"supports"`. Downstream code cannot distinguish high-confidence from low-confidence support.

**Fix**: Map `"inheritance"` to a distinct relation like `"near_duplicate"` or emit a `strength` field.

### H-07: KnowledgeManager JSONL Adapter Mishandles String Confidence

**File**: `src/god-agent/universal/knowledge-manager.ts`, line 545
**Impact**: Reads string `"high"` into a field typed as `number`. Latent type coercion bug.

**Fix**: Normalize on load: `{ high: 0.9, medium: 0.6, low: 0.3 }[obj.confidence] ?? 0.5`.

### H-08: Endnote Generator Hardcodes `corpus/` Path Prefix

**File**: `src/god-agent/cli/quality/endnote-generator.ts`, line 31
**Impact**: If PDFs aren't at `<cwd>/corpus/<pathRel>`, all bbox renders fail silently (catch returns null).

**Fix**: Make corpus root configurable or add a warning log on file-not-found.

### H-09: Bbox Page Key Inconsistency (`page` vs `page_num`)

**Files**: `endnote-generator.ts:598`, `highlight-page.py:596`
**Impact**: TypeScript emits `{page: N}`, Python expects `page_num` (with fallback to `page`). Works via fallback but fragile.

**Fix**: Standardize on `page_num` everywhere.

### H-10: Synchronous File I/O in Async Retrieval Context

**Files**: `retrieval-stage.ts:292-293,360-361`, `corpus-index-provider.ts:78-79`
**Impact**: `fs.readFileSync` blocks the event loop during retrieval. With 3,723 edges (~14MB), this causes noticeable latency.

**Fix**: Replace with `fs.promises.readFile`.

### H-11: `promote_hits.py` `str()` on Bboxes May Produce Non-JSON

**File**: `scripts/learn/promote_hits.py`, line 211
**Impact**: If ChromaDB client returns bboxes as a parsed list instead of string, `str()` produces Python repr (single quotes) which is not valid JSON.

**Fix**: Use `json.dumps()` if input is a list, pass through if already string.

### H-12: Tokenizer Strips Greek/Unicode Characters

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts`, line 729
**Impact**: The tokenizer regex `[^a-z\u00e4\u00f6\u00fc\u00df\-]` strips Greek characters. Edge concepts with Greek Unicode won't match.

**Fix**: Expand regex to include `\u0370-\u03FF` (Greek block) and `\u1F00-\u1FFF` (extended Greek).

---

## MEDIUM FINDINGS (14)

| ID | File | Issue |
|----|------|-------|
| M-01 | `corpus-index-provider.ts:93,169` | Redundant regex escape (inline vs function) |
| M-02 | `retrieval-stage.ts:363` vs `corpus-index-provider.ts:115` | `> 3` vs `>= 4` — same semantics, inconsistent style |
| M-03 | `merge-reasoning-edges.py:19,22` | Reads and writes same file path — crash between read/write loses data |
| M-04 | `retrieval-stage.ts:300+` | Multiple `as any` casts bypass type safety on JSONL parsing |
| M-05 | 31 nodes in `compiled-index.json` | Missing definitions — rendered as useless name-only entries |
| M-06 | `quality-integration.ts:195-204` | Global-flag regex with mutable `lastIndex` state |
| M-07 | `compile-corpus-index.py` | No unit tests for 800+ line multi-format parser |
| M-08 | `smart-retrieval-layer.ts:549-567` | O(n×m) quadratic KU-chunk overlap computation |
| M-09 | `report.py:216-235` | KU normalizer checks only first source for overlap |
| M-10 | `render_citation_bbox.py` | Legacy renderer superseded by `highlight-page.py` but not deprecated |
| M-11 | `highlight-page.py:596` | Dual-key `page_num`/`page` bbox page lookup |
| M-12 | `query_chunks.py:234` | Same `str()` bboxes pattern as H-11 |
| M-13 | `reason_over_knowledge.py:281` | `reason_id` vs `id` primary key divergence |
| M-14 | `knowledge-manager.ts:579-586` | `flushToJSONL` writes minimal source schema (missing bbox fields) |

---

## LOW FINDINGS (7)

| ID | File | Issue |
|----|------|-------|
| L-01 | `write-pipeline-orchestrator.ts:1833` | Dynamic `await import('fs')` vs static import already available |
| L-02 | `compiled-index.json` | 8 canonical terms < 4 chars — can't match via topic scoring |
| L-03 | `merge-reasoning-edges.py:129` | `pipeline` field naming inconsistency |
| L-04 | `gold-standard-prompt-builder.ts:299-307` | Inconsistent indentation in new prompt sections |
| L-05 | `endnote-generator.ts:80,601,707` | Silent catch blocks hide bbox rendering failures |
| L-06 | `endnote-generator.ts:711` | Non-deterministic supporting quotation IDs |
| L-07 | `reason_over_knowledge.py:183` | Substring topic filtering misses variant spellings |

---

## Implementation Plan for Critical + High Fixes

### Batch 1: Data Integrity (can run immediately, no code changes)

```bash
# Fix C-01 + C-02: Add self-ref filter and dedup to merge script, re-run
# Edit merge-reasoning-edges.py:
#   1. Add: active_edges = [e for e in active_edges if e.get('source') != e.get('target')]
#   2. Add: dedup by (source.lower(), relation, target.lower()), keep highest corroboration_score
# Then re-run: python3 scripts/merge-reasoning-edges.py
```

### Batch 2: KG Boost Correctness (C-03 + H-12)

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts`
1. **C-03**: In `boostWithKnowledgeGraph()` edge traversal (line 577-583), add fallback: `|| rawTopicLower.includes(src)` after `topicWords.has(src)`
2. **H-12**: Expand tokenizer regex (line 729) to include Greek Unicode range

### Batch 3: Type Safety (C-04 + C-05 + C-06 + H-07)

1. Extract shared `ReasoningEdge` and `KnowledgeUnit` interfaces to `src/god-agent/retrieval/types.ts`
2. Update both `smart-retrieval-layer.ts` and `quality-integration.ts` to import from shared types
3. Fix `confidence` normalization in both loaders
4. Fix `sources` interface to match actual JSONL schema

### Batch 4: Legacy Path Alignment (H-01 + H-02)

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts`
1. Add `!src && !tgt` guard to legacy edge filter
2. Backport dual-path KU filter to legacy path (or mark as deprecated)

### Batch 5: Data Quality (H-04 + M-05)

1. Merge duplicate ontology nodes in `compile-corpus-index.py`
2. Filter out definitionless nodes (or backfill definitions)
3. Re-run: `python3 scripts/compile-corpus-index.py`

### Batch 6: Bbox/Page Key Standardization (H-08 + H-09)

1. Standardize on `page_num` in endnote generator TypeScript
2. Make corpus root configurable in endnote generator

### Batch 7: Infrastructure (H-03 + H-10)

1. Add file mtime cache invalidation to corpus-index-provider and edge loaders
2. Convert synchronous file reads to async in retrieval-stage.ts

---

## Verification Commands for Fixes

```bash
# After Batch 1 (data integrity):
python3 -c "
import json
lines = [json.loads(l) for l in open('god-reason/reasoning.jsonl') if l.strip()]
self_refs = sum(1 for e in lines if e.get('source') == e.get('target'))
triples = [(e.get('source','').lower(), e.get('relation',''), e.get('target','').lower()) for e in lines]
dupes = len(triples) - len(set(triples))
print(f'Self-refs: {self_refs} (must be 0)')
print(f'Duplicate triples: {dupes} (must be 0)')
print(f'Total active edges: {len(lines)}')
"

# After Batch 2 (KG boost):
# Test with "Being" topic — should find edges with Being concept
python3 -c "
import json
edges = [json.loads(l) for l in open('god-reason/reasoning.jsonl') if l.strip()]
being_edges = [e for e in edges if e.get('source','').lower() == 'being' or e.get('target','').lower() == 'being']
print(f'Edges involving Being: {len(being_edges)} (should be > 0)')
"

# After Batch 3 (type safety):
npx tsc --noEmit 2>&1 | grep -c "types.ts"

# After Batch 5 (data quality):
python3 -c "
import json
d = json.load(open('corpus/index/compiled-index.json'))
names = [n['name'] for n in d['ontologyNodes']]
dupes = len(names) - len(set(names))
no_def = sum(1 for n in d['ontologyNodes'] if not n.get('definition'))
print(f'Duplicate names: {dupes} (should be 0)')
print(f'Missing definitions: {no_def} (should be 0)')
"
```
