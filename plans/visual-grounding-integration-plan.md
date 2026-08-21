# Visual Grounding Integration Plan

**Date**: 2026-03-27
**Prerequisite**: Ingestion pipeline migration complete (3,091 chunks, 98.3% bboxes)
**Goal**: Make bounding box visual provenance flow end-to-end from ChromaDB through KU promotion, retrieval, god-write generation, and citation rendering.

---

## Current State

| Component | Bbox Support | Status |
|-----------|-------------|--------|
| ChromaDB chunks | 3,038/3,091 have `bboxes` JSON | DONE |
| `parallel_ingest.py` | Writes `has_bboxes`, `source_method`, `bboxes` to metadata | DONE |
| `promote_hits.py` | Does NOT copy bbox fields into KU sources | NEEDS PATCH |
| `knowledge.jsonl` | 6/131 KUs have bbox-enriched sources | NEEDS BACKFILL |
| `query_chunks.py` | Includes full `meta` dict (bboxes available) but not surfaced explicitly | NEEDS PATCH |
| `SmartRetrievalLayer.ts` | No bbox fields in `ContextChunk` type | NEEDS PATCH |
| `write-pipeline-orchestrator.ts` | No bbox handling | NEEDS PATCH |
| `endnote-generator.ts` | No visual citation rendering | NEEDS PATCH |
| `render_citation_bbox.py` | Script exists, untested in pipeline | NEEDS INTEGRATION |

---

## Task 1: Patch KU Promotion Pipeline

### Problem

`scripts/learn/promote_hits.py` lines 200-206 construct the KU `source` object with only 5 fields:

```python
source = {
    "author": author_guess,
    "title": title_guess,
    "path_rel": path_rel,
    "pages": pages_str,
    "chunk_id": chunk_id,
}
```

The full ChromaDB metadata (including `has_bboxes`, `source_method`, `bboxes`) is available in `meta` (line 186) but never copied into the source.

### Fix

**File**: `scripts/learn/promote_hits.py`
**Location**: Lines 200-206 (source dict construction)

Add three fields from `meta`:

```python
source = {
    "author": author_guess,
    "title": title_guess,
    "path_rel": path_rel,
    "pages": pages_str,
    "chunk_id": chunk_id,
    # Visual provenance from v7 pipeline
    "has_bboxes": bool(meta.get("has_bboxes", False)),
    "source_method": str(meta.get("source_method", "")),
    "bboxes": str(meta.get("bboxes", "")) if meta.get("has_bboxes") else "",
}
```

### Verification

After patching, run a single KU promotion and confirm the new source has bbox fields:

```bash
god-learn update --query "phantasia as distinct faculty in De Anima III" \
  --k 1 --overfetch 5 --skip-compile --skip-reasoning --skip-gpu-switch
# Check last KU in knowledge.jsonl for has_bboxes, source_method, bboxes
tail -1 god-learn/knowledge.jsonl | python3 -m json.tool | grep -E "has_bboxes|source_method|bboxes"
```

### Impact

All future KU promotions will automatically include visual provenance. No changes needed elsewhere in the promotion pipeline.

---

## Task 2: Backfill 125 Existing KUs

### Problem

125 of 131 KUs were created by the re-promotion pipeline (Phase D of migration) before the promote_hits.py patch. Their `chunk_id` references are valid — they point to v7 chunks in ChromaDB that DO have bboxes — but the KU source objects lack the visual metadata fields.

### Script: `scripts/backfill-ku-bboxes.py`

```
Input:  god-learn/knowledge.jsonl + ChromaDB at :8001
Output: god-learn/knowledge.jsonl (in-place update)

For each KU:
  For each source in KU.sources:
    If source.has_bboxes is missing or falsy:
      Look up source.chunk_id in ChromaDB
      If found and chunk has bboxes:
        Copy has_bboxes, source_method, bboxes into source
        Mark KU as modified
  If KU was modified:
    Recompute KU.id using verifier's canonical formula

Write modified knowledge.jsonl
Run normalize_knowledge_store() to fix ordering + rebuild index
```

### Key Details

- **Chunk ID validity**: All 125 re-promoted KUs were created during Phase D (Quarantine Recovery) by running `god-learn update` against the current ChromaDB. Every `chunk_id` in these KUs was returned directly by ChromaDB during promotion — they are guaranteed to exist. The only KUs with potentially stale chunk references are the 10 `manual_curation` KUs, which were skipped during re-promotion and remain in the quarantine archive.

- **Lookup strategy**: Direct lookup only. `col.get(ids=[chunk_id])` for each source. If a chunk_id is not found (should not happen for the 125 re-promoted KUs), log a warning and skip. No page-matching or semantic-matching fallback is needed — it would be dead code.

- **ID recomputation**: The verifier (`scripts/learn/verify_knowledge.py`) computes KU IDs as:
  ```python
  def canonical_source_key(src):
      return f"{src.get('path_rel','')}:{src.get('pages','')}:{src.get('chunk_id','')}"

  def recompute_id(claim, sources):
      payload = {
          'claim': claim.strip(),
          'sources': sorted(canonical_source_key(s) for s in sources),
      }
      return 'ku_' + sha256(json.dumps(payload, sort_keys=True))[:16]
  ```
  Adding `has_bboxes`/`source_method`/`bboxes` does NOT change the canonical source key (only `path_rel`, `pages`, `chunk_id` are used), so IDs should remain stable. However, if the fallback updates `chunk_id` to a different chunk, the ID will change and `normalize_knowledge_store()` must be run afterward.

- **`bboxes` field size**: The `bboxes` JSON string can be large (10-50KB per chunk for multi-page documents). This is acceptable in `knowledge.jsonl` but should be noted for memory considerations if loading all KUs at once.

### Verification

```bash
python3 scripts/backfill-ku-bboxes.py --dry-run   # preview changes
python3 scripts/backfill-ku-bboxes.py              # apply
python3 scripts/learn/verify_knowledge.py --strict_order  # must pass
python3 -c "
import json
bbox = sum(1 for l in open('god-learn/knowledge.jsonl')
           if any(s.get('has_bboxes') for s in json.loads(l).get('sources',[])))
print(f'KUs with bboxes: {bbox}/131')
"   # target: 131/131 (or close, with warnings for unfound chunks)
```

### Estimated Runtime

Seconds. 131 KU sources × 1 ChromaDB lookup each = ~131 HTTP calls to localhost.

---

## Task 3: Surface Bboxes in god-write

This task has three sub-components: retrieval output, TypeScript type propagation, and citation rendering.

### 3a. Patch `query_chunks.py` to explicitly include bbox fields

**File**: `scripts/retrieval/query_chunks.py`
**Location**: Lines 222-231 (candidate dict construction)

Currently the candidate dict includes `"meta": meta` (the full ChromaDB metadata dict), so bboxes are technically available. But when `--print_json` output is consumed by the TypeScript pipeline, only the explicitly listed fields are reliably used. Add explicit fields:

```python
candidates.append({
    "raw_rank": raw_rank,
    "chunk_id": chunk_id,
    "distance": dist,
    "path_rel": safe_get_meta(meta, "path_rel", "UNKNOWN_PATH"),
    "page_start": safe_get_meta(meta, "page_start", "NA"),
    "page_end": safe_get_meta(meta, "page_end", "NA"),
    "text": doc.strip() if args.include_docs else None,
    "meta": meta,
    # Visual provenance (v7)
    "has_bboxes": bool(meta.get("has_bboxes", False)),
    "source_method": str(meta.get("source_method", "")),
    "bboxes": str(meta.get("bboxes", "")) if meta.get("has_bboxes") else "",
})
```

**Impact**: The JSON output from `query_chunks.py --print_json` will now include bbox fields at the top level of each result, making them available to the TypeScript consumer without parsing the nested `meta` object.

### 3b. Add bbox fields to TypeScript types

**File**: `src/god-agent/retrieval/types.ts`

Add to the `ContextChunk` interface (or equivalent chunk type):

```typescript
/** Visual provenance from v7 ingestion pipeline */
hasBboxes?: boolean;
sourceMethod?: string;
/** JSON string of bounding box coordinates per page */
bboxes?: string;
```

**File**: `src/god-agent/retrieval/smart-retrieval-layer.ts`

In the chunk mapping function (where ChromaDB results are converted to `ContextChunk`), add:

```typescript
hasBboxes: meta?.has_bboxes ?? false,
sourceMethod: meta?.source_method ?? '',
bboxes: meta?.has_bboxes ? (meta?.bboxes ?? '') : '',
```

### 3c. Pass bboxes through write pipeline to endnote generator

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts`

The corpus context block already passes chunk metadata to the prompt builder. The bboxes should flow through without modification — they're just additional fields on the chunk objects. No changes needed here unless the pipeline explicitly strips unknown fields.

**File**: `src/god-agent/cli/quality/endnote-generator.ts`

During endnote generation, for each cited source that has `hasBboxes: true`:

1. Parse the `bboxes` JSON string to get page coordinates
2. Call `render_citation_bbox.py` with the source PDF path and coordinates
3. Include the rendered bbox reference (image path or coordinate annotation) in the endnote

```typescript
// In endnote generation, after building the citation entry:
if (chunk.hasBboxes && chunk.bboxes) {
  const bboxData = JSON.parse(chunk.bboxes);
  // Option A: Generate image snippet
  const snippetPath = await renderBboxSnippet(chunk.pathRel, bboxData);
  citation.visualRef = snippetPath;
  // Option B: Just attach coordinates for downstream rendering
  citation.bboxPages = bboxData.map(b => ({
    page: b.page_num,
    coords: b.coords,
  }));
}
```

The `renderBboxSnippet` function would call `render_citation_bbox.py`:

```typescript
async function renderBboxSnippet(pdfPath: string, bboxes: BboxEntry[]): Promise<string> {
  const outPath = path.join(tmpDir, `bbox_${hash}.png`);
  const result = spawnSync('python3', [
    'scripts/ingest/render_citation_bbox.py',
    '--pdf', pdfPath,
    '--bboxes', JSON.stringify(bboxes),
    '--output', outPath,
  ]);
  return result.status === 0 ? outPath : '';
}
```

### Verification

```bash
# 1. Verify query_chunks outputs bbox fields
python3 scripts/retrieval/query_chunks.py "phantasia" --k 1 --include_docs --print_json \
  | python3 -c "import sys,json; r=json.load(sys.stdin)['results'][0]; print(r.get('has_bboxes'), r.get('source_method'))"

# 2. Run god-write and check if endnotes include visual references
npx tsx src/god-agent/universal/cli.ts write "test topic" \
  --execute --whitelist --length short --enable-endnotes --pipeline-version v2
# Inspect output for bbox/visual references in endnotes
```

---

## Implementation Order

```
Task 1: Patch promote_hits.py          [5 min, 3 lines changed]
   ↓
Task 2: Create + run backfill script   [30 min, ~100 lines new script]
   ↓
Task 3a: Patch query_chunks.py         [5 min, 3 lines added]
   ↓
Task 3b: Patch TypeScript types        [15 min, ~10 lines across 2 files]
   ↓
Task 3c: Patch endnote generator       [45 min, ~30 lines new + render integration]
   ↓
Verification: Full pipeline smoke test  [10 min]
```

**Total estimated time**: ~2 hours

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Backfill chunk_id not found in ChromaDB | Medium | Low | Fallback to same-doc page match, then semantic match |
| `bboxes` JSON string too large for KU file | Low | Low | Typical: 10-50KB per chunk; knowledge.jsonl stays under 20MB |
| `render_citation_bbox.py` fails on certain PDFs | Medium | Low | Graceful fallback: skip visual ref, keep text citation |
| TypeScript type changes break existing consumers | Low | Medium | Fields are optional (`?`), no breaking change |
| Endnote generator latency increase from rendering | Medium | Low | Rendering is per-citation (< 1s each), total < 10s for typical output |

---

## Out of Scope (Future)

1. **PDF viewer overlay**: Interactive bbox highlighting in a web-based PDF viewer
2. **Dashboard bbox preview**: Show visual provenance in the observability dashboard ICP panel
3. **Streaming bbox rendering**: Real-time bbox overlay during inline validation
4. **Cross-chunk bbox merging**: Merge bboxes when a citation spans multiple chunks from the same page
