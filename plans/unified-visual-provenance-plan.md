# Unified Visual Provenance System — Execution Plan

**Date**: 2026-03-27
**Status**: DRAFT — awaiting approval before execution
**Goal**: Unify the ICP rendering system (`highlight-page.py`) with the v7 ingestion data layer (ChromaDB bboxes) into a single visual provenance architecture that serves both the endnote generator and the observability dashboard.

---

## Architecture

```
                          DATA LAYER (v7 ingestion)
                    ┌─────────────────────────────────┐
                    │  ChromaDB knowledge_chunks       │
                    │  ├── chunk text                  │
                    │  ├── page_start / page_end       │
                    │  ├── has_bboxes (boolean)        │
                    │  ├── source_method               │
                    │  └── bboxes (JSON coordinates)   │
                    └──────────────┬──────────────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               │                   │                   │
       GENERATION              RENDERING           DASHBOARD
    ┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
    │  god-write    │    │ highlight-page.py │   │  ICP Panel   │
    │  v2 pipeline  │    │ (6-strategy text  │   │  Quote Modal │
    │               │    │  + bbox fallback) │   │  PDF viewer  │
    │  endnote-gen  │───▶│                  │◀──│  zoom/nav    │
    │  (records     │    │  Returns: PNG    │   │  rich text   │
    │   citations)  │    │  with highlights │   │  footnotes   │
    └──────────────┘    └──────────────────┘   └──────────────┘
```

---

## Task 1: Replace Endnote Rendering Backend

### What

Replace the `render_citation_bbox.py` quote-mode call in `renderBboxOverlayAsync()` with a call to `highlight-page.py`.

### Why

`highlight-page.py` has a 6-strategy cascade (dehyphenation, Unicode normalization, sentence chunking, overlapping phrase windows, progressive snippets, start/end word windows) that handles every failure mode we encountered. The current difflib single-strategy matcher misses ~60% of citations.

### Files Changed

**`src/god-agent/cli/quality/endnote-generator.ts`** — `renderBboxOverlayAsync()` function

### Current Call

```typescript
const { stdout } = await execFileAsync('python3', [
  'scripts/ingest/render_citation_bbox.py',
  '--pdf', pdfPath,
  '--quote-text', quoteText,
  '--target-page', String(page),
  '--output-dir', outDir,
], { timeout: 10000 });
```

### New Call

```typescript
const outPath = path.join(outDir, `${safeName}_p${page}.png`);
const { stdout } = await execFileAsync('python3', [
  'scripts/pdf/highlight-page.py',
  pdfPath,
  String(page),
  outPath,
  quoteText,
  '150',   // DPI (150 for batch renders, 300 for dashboard)
], { timeout: 10000 });
```

### Response Parsing Change

`highlight-page.py` outputs `FOUND_ON_PAGE:<n>` on stdout if the text was found on an adjacent page. The function should:
1. Parse stdout for `FOUND_ON_PAGE:` to detect page corrections
2. Return `outPath` if the file was written (check `fs.existsSync`)
3. Return `null` if highlight-page found nothing and wrote a blank page

### Adjacent Page Handling

`highlight-page.py` already scans ±2 pages automatically. This eliminates the entire multi-page candidate loop in `renderBboxOverlayAsync` — the function reduces to a single subprocess call per citation.

### Output Filename Correction

`highlight-page.py` outputs `FOUND_ON_PAGE:<n>` when the text was found on an adjacent page. The endnote generator passes a static `outPath` based on the expected page number. If the actual page differs, the file must be renamed so the Markdown link accurately reflects which page is shown:

```typescript
const { stdout } = await execFileAsync('python3', args, { timeout: 10000 });

// Parse stdout to see what page was actually rendered
const pageMatch = stdout.match(/FOUND_ON_PAGE:(\d+)/);
const actualPage = pageMatch ? parseInt(pageMatch[1], 10) : page;

// Rename if highlight-page rendered an adjacent page
if (actualPage !== page && fs.existsSync(outPath)) {
  const correctedPath = path.join(outDir, `${safeName}_p${actualPage}.png`);
  fs.renameSync(outPath, correctedPath);
  return correctedPath;
}

return fs.existsSync(outPath) ? outPath : null;
```

Without this, a file named `citation_p34.png` would silently contain an image of page 35 — confusing for anyone exporting the Markdown to a static viewer.

### Verification

Run god-write with `--enable-endnotes --render-bbox-overlays` and compare hit rate against the current difflib approach. Expected: significantly higher match rate due to the 6-strategy cascade.

---

## Task 2: Add Chunk-Level Bbox Fallback to `highlight-page.py`

### What

Add a `--fallback-bboxes` argument to `highlight-page.py` that accepts a JSON string of chunk-level bounding box coordinates. When all 6 text search strategies fail (paraphrased content), the script draws the chunk-level bbox as a structural fallback.

### Why

The ICP text search is excellent for direct quotes but cannot highlight paraphrased concepts. The v7 ingestion bboxes provide a guaranteed structural boundary for every chunk, ensuring 100% visual provenance coverage even when text matching fails.

### File Changed

**`scripts/pdf/highlight-page.py`**

### Implementation

Add argument parsing:
```python
# After existing arg parsing (line ~554):
fallback_bboxes = None
for i, arg in enumerate(sys.argv[5:], start=5):
    if arg == '--fallback-bboxes' and i + 1 < len(sys.argv):
        fallback_bboxes = json.loads(sys.argv[i + 1])
```

Add fallback rendering after the 6-strategy cascade fails (line ~586):
```python
if search_text and not rects and fallback_bboxes:
    # Text search failed — draw chunk-level bbox as structural fallback
    for entry in fallback_bboxes:
        page_num_fb = entry.get('page_num', entry.get('page'))
        if page_num_fb == page_num:
            coords = entry.get('coords', [])
            if len(coords) == 4:
                x1, y1, x2, y2 = coords
                fb_rect = fitz.Rect(x1, y1, x2, y2)
                shape = page.new_shape()
                shape.draw_rect(fb_rect)
                # Use a distinct color (light blue) to distinguish from quote highlights (pink)
                shape.finish(color=(0.3, 0.5, 0.8), fill=(0.7, 0.85, 1.0),
                             fill_opacity=0.2, width=1.0)
                shape.commit(overlay=True)
                rects.append(fb_rect)  # Count as found for reporting
```

### Color Semantics

| Color | Meaning |
|-------|---------|
| Pink fill `(1.0, 0.7, 0.8)` | Exact text match (quote found via 6-strategy cascade) |
| Light blue fill `(0.7, 0.85, 1.0)` | Structural fallback (chunk-level bbox, text not found) |

This gives the user immediate visual feedback on the confidence of each highlight.

### Verification

Test with a paraphrased citation that the text search cannot find. Confirm: light blue chunk-level bbox appears instead of nothing.

---

## Task 3: Wire Endnote Generator to Pass Bbox Fallback Data

### What

Update the `renderBboxOverlayAsync` call to pass the chunk's bbox coordinates as `--fallback-bboxes` to `highlight-page.py`, so the structural fallback is available when text search fails.

### File Changed

**`src/god-agent/cli/quality/endnote-generator.ts`** — inside `renderBboxOverlayAsync()`

### Implementation

```typescript
const args = [
  'scripts/pdf/highlight-page.py',
  pdfPath,
  String(page),
  outPath,
  quoteText,
  '150',
];

// Pass chunk-level bboxes as structural fallback
if (fallbackBboxPages?.length) {
  args.push('--fallback-bboxes', JSON.stringify(fallbackBboxPages));
}
```

---

## Task 4: Update ICP API `/pdf-page/` Endpoint with Bbox Fallback

### What

Extend the existing `/api/icp/pdf-page/:docId/:page` endpoint to accept an optional `?bboxes=<json>` query parameter. When the text highlight search fails, the endpoint falls back to drawing the chunk-level bboxes from ChromaDB.

### Why

The dashboard Quote Detail Modal currently calls this endpoint with `?highlight=<text>`. If the text search fails, the user sees a blank page. With the bbox fallback, they always see the source paragraph highlighted.

### File Changed

**`src/god-agent/observability/icp-api-routes.ts`** — `/pdf-page/` handler

### Implementation

The endpoint is strictly a stateless pass-through. It does NOT query ChromaDB. The caller (dashboard or endnote generator) is responsible for providing the specific chunk's bboxes.

After the existing `highlightText` extraction (line ~414):
```typescript
const bboxesParam = typeof req.query.bboxes === 'string' ? req.query.bboxes : '';

// Build args for highlight-page.py
const scriptArgs = [scriptPath, pdfPath, String(pageNum), tmpOutput, highlightText, '300'];
if (bboxesParam) {
  scriptArgs.push('--fallback-bboxes', bboxesParam);
}
```

### Why No ChromaDB Auto-Lookup

A ChromaDB query inside a static image rendering endpoint is an anti-pattern for three reasons:

1. **Performance**: Rapid page-flipping in the dashboard would trigger a database call per page where text isn't immediately found.
2. **Loss of specificity**: A `where` clause matching `doc_id + page_start/page_end` returns every chunk on that page. A single PDF page often contains 3-4 chunks — drawing all their bboxes defeats the purpose of a specific visual citation.
3. **Data already exists on the client**: The dashboard's `QuoteSpan` object already carries the specific chunk metadata. The endnote generator already has `sq.bboxPages`. Both callers can pass the exact bboxes they need.

---

## Task 5: Update Dashboard Quote Detail Modal

### What

Enhance the ICP Quote Detail Modal in `icp-panel.js` to:
1. Pass bbox data when opening the PDF viewer (for structural fallback)
2. Show a visual indicator of match type (exact text vs structural fallback)
3. Add a "Visual Provenance" badge showing the extraction method (`marker+bbox`, `pymupdf+bbox`)

### Files Changed

**`src/god-agent/observability/dashboard/icp-panel.js`** — `icpLoadPdfPage()` and modal construction

### Implementation

#### 5a. Pass bboxes to the PDF page loader

```javascript
function icpLoadPdfPage(docId, page, highlightText, bboxes) {
  var url = '/api/icp/pdf-page/' + encodeURIComponent(docId) + '/' + page;
  var params = [];
  if (highlightText) params.push('highlight=' + encodeURIComponent(highlightText));
  if (bboxes) params.push('bboxes=' + encodeURIComponent(JSON.stringify(bboxes)));
  if (params.length) url += '?' + params.join('&');
  // ... rest of loader
}
```

#### 5b. Show match type indicator

Add to the PDF toolbar area:
```javascript
// After image loads, check response header for match type
img.onload = function() {
  var matchType = xhr.getResponseHeader('X-ICP-Match-Type'); // 'text' or 'bbox-fallback'
  var badge = document.getElementById('icp-match-type-badge');
  if (badge) {
    badge.textContent = matchType === 'text' ? 'Exact Quote Match' : 'Structural Match (Paragraph)';
    badge.className = matchType === 'text' ? 'match-badge match-exact' : 'match-badge match-structural';
  }
};
```

#### 5c. Show extraction method badge

In the quote metadata panel (left side of modal), add:
```javascript
if (span.source_method) {
  html += '<div class="icp-source-method">';
  html += '<span class="method-badge">' + span.source_method + '</span>';
  html += '</div>';
}
```

### Styling

**`src/god-agent/observability/dashboard/styles.css`**:

```css
.match-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.match-exact {
  background: #e8f5e9;
  color: #2e7d32;
}
.match-structural {
  background: #e3f2fd;
  color: #1565c0;
}
.method-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  background: #f3e5f5;
  color: #7b1fa2;
}
```

---

## Task 6: Add `X-ICP-Match-Type` Response Header

### What

Have `highlight-page.py` output a match type indicator, and have the ICP API forward it as a response header so the dashboard knows whether the highlight was an exact text match or a structural bbox fallback.

### Files Changed

- **`scripts/pdf/highlight-page.py`** — output `MATCH_TYPE:text` or `MATCH_TYPE:bbox-fallback`
- **`src/god-agent/observability/icp-api-routes.ts`** — parse and set `X-ICP-Match-Type` header

### Implementation

In `highlight-page.py`, after rendering:
```python
if rects and not used_fallback:
    print("MATCH_TYPE:text", flush=True)
elif rects and used_fallback:
    print("MATCH_TYPE:bbox-fallback", flush=True)
else:
    print("MATCH_TYPE:none", flush=True)
```

In `icp-api-routes.ts`, parse stdout:
```typescript
const matchType = stdout.includes('MATCH_TYPE:text') ? 'text'
  : stdout.includes('MATCH_TYPE:bbox-fallback') ? 'bbox-fallback'
  : 'none';
res.setHeader('X-ICP-Match-Type', matchType);
```

---

## Implementation Order

```
Task 1: Replace endnote rendering backend          [15 min]
  - Swap render_citation_bbox.py → highlight-page.py in renderBboxOverlayAsync
  - Simplify: single call per citation (no multi-page loop — highlight-page scans ±2)
  - Parse FOUND_ON_PAGE stdout for page corrections
  ↓
Task 2: Add bbox fallback to highlight-page.py     [20 min]
  - Add --fallback-bboxes argument
  - Draw light blue structural box when 6-strategy cascade fails
  - Output MATCH_TYPE indicator
  ↓
Task 3: Wire endnote generator bbox passthrough     [5 min]
  - Pass --fallback-bboxes from renderBboxOverlayAsync
  ↓
Task 4: Update ICP API endpoint                     [20 min]
  - Add ?bboxes= query param to /pdf-page/
  - Auto-lookup bboxes from ChromaDB when no explicit bboxes provided
  - Forward X-ICP-Match-Type header
  ↓
Task 5: Update dashboard Quote Detail Modal         [30 min]
  - Pass bboxes to icpLoadPdfPage
  - Add match type badge (Exact Quote / Structural Match)
  - Add extraction method badge (marker+bbox / pymupdf+bbox)
  - CSS styling for badges
  ↓
Task 6: Add X-ICP-Match-Type header                [10 min]
  - highlight-page.py outputs match type
  - ICP API parses and forwards as header
  ↓
Verification: End-to-end test                      [15 min]
  - god-write with --enable-endnotes --render-bbox-overlays
  - Dashboard: open Quote Detail Modal, verify highlights
  - Test paraphrased citation → blue structural fallback
  - Test exact quote → pink text highlight
```

**Total estimated time**: ~2 hours

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `highlight-page.py` slower than `render_citation_bbox.py` | Medium | Low | Higher quality output justifies ~0.5s extra per render. Concurrent execution mitigates wall-clock impact. |
| Adjacent page scan returns wrong page | Low | Low | `FOUND_ON_PAGE` header lets client know actual page. Dashboard updates label automatically. |
| ChromaDB auto-lookup adds latency to API endpoint | Low | Low | Only triggers when text search fails AND no explicit bboxes. Single HTTP call to localhost. |
| Dashboard CSS conflicts with existing styles | Low | Low | Scoped class names (`match-badge`, `method-badge`) avoid conflicts. |

---

## What This Plan Does NOT Change

- **ChromaDB schema** — no changes to chunk metadata or ingestion pipeline
- **KU structure** — no changes to knowledge.jsonl or reasoning.jsonl
- **god-write generation** — no changes to drafting, validation, or citation enforcement
- **`render_citation_bbox.py` chunk-id mode** — the original ChromaDB lookup mode remains for standalone use; only the quote-level rendering path is replaced
