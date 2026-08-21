# Visual Provenance Pipeline Integration Plan

**Date**: 2026-03-27
**Status**: LIVING PLAN
**Goal**: Make bounding box visual provenance flow end-to-end from ChromaDB through god-write to rendered citation overlays.

---

## Current State

```
ChromaDB (3,091 chunks, 98.5% bboxes)
  ↓ has_bboxes, source_method, bboxes
SmartRetrievalLayer.ts (maps all 3 fields into ContextChunk.metadata)
  ↓ ContextChunk with bbox fields populated
WritePipelineOrchestrator.ts
  ↓ CorpusSearchFn callback (lines 3195-3214)
  ✗ DROPS bbox fields during ContextChunk → CorpusChunk mapping
  ↓ CorpusChunk WITHOUT bbox data
EndnoteGenerator.ts (types are ready, formatting has Visual column)
  ✗ Never receives bbox data → Visual column always shows "—"
  ✗ Never calls render_citation_bbox.py
```

---

## Task 1: Bridge the CorpusSearchFn Gap

### Problem

`write-pipeline-orchestrator.ts` lines 3202-3213 maps `ContextChunk` → `CorpusChunk` for the endnote generator but omits bbox fields:

```typescript
return chunks.map(chunk => ({
  id: chunk.chunkId,
  text: chunk.content,
  metadata: {
    author: chunk.metadata?.author,
    title: chunk.metadata?.title,
    year: chunk.metadata?.year,
    pageRef: chunk.metadata?.pageRef,
    docId: chunk.metadata?.docId,
    // MISSING: has_bboxes, source_method, bboxes, path_rel
  },
  score: chunk.relevanceScore,
}));
```

### Fix

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts`
**Location**: Lines 3205-3211 (metadata object inside `chunks.map`)

Add the four missing fields:

```typescript
metadata: {
  author: chunk.metadata?.author,
  title: chunk.metadata?.title,
  year: chunk.metadata?.year,
  pageRef: chunk.metadata?.pageRef,
  docId: chunk.metadata?.docId,
  // Visual provenance (v7)
  has_bboxes: chunk.metadata?.has_bboxes ?? false,
  source_method: chunk.metadata?.source_method ?? '',
  bboxes: chunk.metadata?.has_bboxes ? (chunk.metadata?.bboxes ?? '') : '',
  path_rel: chunk.metadata?.path_rel ?? '',
},
```

### Why `path_rel` is also needed

`render_citation_bbox.py` requires the PDF file path to draw overlays. The endnote generator needs `path_rel` to locate the source PDF on disk. It's already in `ContextChunk.metadata` from SmartRetrievalLayer but was being dropped in this same mapping.

### Verification

After this change, run god-write with `--enable-endnotes` and check that the endnotes table includes the "Visual" column with `bbox p.X` entries instead of `—`.

### Impact

This is the only code change needed to complete the data flow. Once the bbox fields survive the `CorpusSearchFn` mapping, the endnote generator's existing code (which we already patched in Task 3c) will:
1. Parse the `bboxes` JSON string into `bboxPages` arrays
2. Populate `hasBboxes` and `bboxPages` on `SupportingQuotation` and `primaryCitation`
3. Render the "Visual" column in the endnotes table with page numbers

---

## Task 2: Wire `render_citation_bbox.py` into Endnote Generation

### Problem

The endnote generator formats a text-based "Visual" column (`bbox p.5, 6`) but does not actually render the bounding box overlays onto the PDF pages. `render_citation_bbox.py` exists as a standalone CLI tool but nothing calls it.

### Design

Add a `renderBboxOverlays` post-processing step in the endnote generator that collects all rendering tasks and executes them concurrently via `Promise.all()`. Each render spawns `render_citation_bbox.py` asynchronously to produce a PNG image of the source page with highlighted bounding boxes.

**Critical constraint**: Do NOT use `spawnSync` in a loop. An essay with 15 endnotes and 2 supporting quotations each = 45 render calls at ~1-2s each. Synchronous execution would freeze the Node.js event loop for 45-90 seconds, causing the UCM daemon WebSocket heartbeat to fail and the CLI to appear hung. Since these are stateless, independent Python subprocesses with no shared state or ordering dependency, they are safe to run concurrently.

**File**: `src/god-agent/cli/quality/endnote-generator.ts`

Add after the endnotes are generated (in `generateEndnotes()`, after `formatEndnotesSection`):

```typescript
// Render bbox overlays concurrently for all endnotes with visual provenance
if (config.renderBboxOverlays) {
  const renderTasks: Promise<void>[] = [];

  for (const endnote of endnotes) {
    // Primary citation
    if (endnote.primaryCitation.hasBboxes && endnote.primaryCitation.pathRel) {
      renderTasks.push(
        renderBboxOverlayAsync(endnote.primaryCitation.pathRel, endnote.primaryCitation.bboxPages ?? [])
          .then(path => { if (path) endnote.primaryCitation.visualRefPath = path; })
      );
    }
    // Supporting quotations
    for (const sq of endnote.supportingQuotations) {
      if (sq.hasBboxes && sq.pathRel) {
        renderTasks.push(
          renderBboxOverlayAsync(sq.pathRel, sq.bboxPages ?? [])
            .then(path => { if (path) sq.visualRefPath = path; })
        );
      }
    }
  }

  // Wait for all renders to complete concurrently (~2-5s total instead of 45-90s sequential)
  await Promise.all(renderTasks);
}
```

The `renderBboxOverlayAsync` helper:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

async function renderBboxOverlayAsync(
  pathRel: string,
  bboxPages: Array<{ page: number; coords: number[] }>
): Promise<string | null> {
  if (!bboxPages.length) return null;

  const pdfPath = path.resolve('corpus', pathRel);
  const outDir = path.resolve('tmp', 'citation-renders');

  const bboxArg = JSON.stringify(bboxPages).replace(/'/g, "'\\''");

  try {
    const { stdout } = await execAsync(
      `python3 scripts/ingest/render_citation_bbox.py ` +
      `--pdf '${pdfPath}' ` +
      `--bboxes-json '${bboxArg}' ` +
      `--output-dir '${outDir}'`,
      { timeout: 10000 }
    );
    const output = JSON.parse(stdout);
    return output.image_path;
  } catch {
    return null; // Graceful fallback: text-only endnote, no render
  }
}
```

### Pre-requisite: Extend `render_citation_bbox.py`

The current script accepts a `chunk_id` and looks up bboxes from ChromaDB. For endnote integration, it needs an additional mode that accepts bboxes directly via `--bboxes-json` and a `--pdf` path, bypassing the ChromaDB lookup.

**File**: `scripts/ingest/render_citation_bbox.py`

Add argument:
```python
ap.add_argument("--pdf", help="Direct PDF path (bypasses ChromaDB lookup)")
ap.add_argument("--bboxes-json", help="Direct bboxes JSON (bypasses ChromaDB lookup)")
```

Add branch in `main()`:
```python
if args.pdf and args.bboxes_json:
    bboxes = json.loads(args.bboxes_json)
    for bbox_entry in bboxes:
        render_bbox_overlay(args.pdf, bbox_entry['page'], bbox_entry, output_path)
```

### Configuration

Add to `EndnoteGeneratorConfig`:
```typescript
/** Whether to render bbox overlay images (default: false) */
renderBboxOverlays?: boolean;
```

And to the CLI options in `write-pipeline-orchestrator.ts`:
```typescript
/** Render visual provenance overlays for endnote citations */
renderBboxOverlays?: boolean;
```

### Verification

```bash
npx tsx src/god-agent/universal/cli.ts write \
  "Phantasia in De Anima III" \
  --execute --whitelist --length short --enable-endnotes \
  --render-bbox-overlays --pipeline-version v2

# Check tmp/citation-renders/ for PNG files
ls -la tmp/citation-renders/*.png
```

---

## Task 3: Surface Bbox Renders in Endnote Output

### Problem

Even after Task 2 generates the PNG images, the endnotes section is Markdown text. The rendered images need to be referenced in a way that downstream consumers (dashboard, PDF export, web viewer) can display them.

### Design

Extend the endnotes Markdown table to include image references for citations with visual provenance:

```markdown
## Endnotes

| # | Primary Source | Page(s) | Visual | Supporting Quotations |
|---|--------------|---------|--------|----------------------|
| [1] | Aristotle, *De Anima* | pp. 88-90 | [bbox p.88](tmp/citation-renders/bbox_a1b2c3.png) | "..." (Frede) [bbox] |
```

When `renderBboxOverlays` is enabled and a render succeeds, the "Visual" column changes from `bbox p.88` to a Markdown link `[bbox p.88](path/to/render.png)`. This is backward-compatible — without rendering enabled, the column still shows plain text page indicators.

**File**: `src/god-agent/cli/quality/endnote-generator.ts`
**Location**: `formatEndnotesSection()`, in the visual cell construction

```typescript
// Current:
visualCell = `bbox p.${pageNums}`;

// With render path:
if (primary.visualRefPath) {
  visualCell = `[bbox p.${pageNums}](${primary.visualRefPath})`;
} else {
  visualCell = `bbox p.${pageNums}`;
}
```

### Verification

After god-write, inspect the endnotes section for Markdown image links. Verify the linked PNG files exist and contain visible bounding box highlights on the correct PDF pages.

---

## Implementation Order

```
Task 1: Bridge CorpusSearchFn             [5 min, 4 lines added]
  ↓
Task 2: Wire render_citation_bbox.py      [45 min]
  ├── Extend render_citation_bbox.py      [15 min, add --pdf and --bboxes-json mode]
  ├── Add renderBboxOverlay helper in TS  [15 min]
  └── Add config flag + CLI option        [15 min]
  ↓
Task 3: Surface renders in endnote output [10 min, conditional Markdown link]
  ↓
Verification: god-write smoke test        [10 min]
```

**Total estimated time**: ~1.5 hours

---

## Design Decisions

### Why NOT pass bboxes to the LLM prompt

The `PromptBuilder` and `ConstrainedGenerator` have zero bbox awareness. This is correct and intentional. Bounding box coordinate arrays (e.g., `[120.5, 45.2, 300.1, 90.8]`) provide no semantic value to the language model during academic prose generation. Including them would:
- Waste thousands of context tokens per chunk
- Distract the model from text content
- Provide no improvement in generation quality

Bboxes are purely a **post-generation verification and rendering** concern.

### Why `renderBboxOverlays` defaults to `false`

Rendering spawns a Python subprocess per citation, adding ~1-2s per endnote. For most god-write runs, the text-based `bbox p.X` indicator is sufficient. The full rendering should be opt-in for:
- Final dissertation output
- Dashboard visual audit
- Citation verification workflows

### Why render to PNG, not PDF overlay

PNGs are immediately displayable in Markdown, web dashboards, and terminal image viewers. PDF overlays require a separate viewer. PNGs also allow the observability dashboard to show citation grounding inline.

---

## Future Extensions (Not in Scope)

1. **Dashboard integration**: Show bbox renders in the ICP panel alongside generation results
2. **Interactive PDF viewer**: Web-based PDF.js viewer with bbox overlay layer
3. **Batch audit mode**: Render all citations from a god-write run as a single visual audit report
4. **Citation confidence scoring**: Use bbox area coverage + OCR confidence to score citation reliability
