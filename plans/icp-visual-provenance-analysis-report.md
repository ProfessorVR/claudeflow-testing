# ICP Visual Provenance System — Analysis Report

**Date**: 2026-03-27
**Purpose**: Analyze the existing ICP citation visualization system and identify how it can improve the new visual grounding pipeline.
**Constraint**: READ-ONLY analysis — no code changes.

---

## Executive Summary

The ICP (Inline Citation Pipeline) already has a **mature, battle-tested visual citation provenance system** that is significantly more sophisticated than what we built today in the endnote generator. The ICP system uses a dedicated Python script (`scripts/pdf/highlight-page.py`) with a 6-strategy text search cascade, Unicode normalization, dehyphenation, and adjacent-page scanning — served via an Express API endpoint and rendered in a split-panel dashboard modal with zoom, pagination, and rich text extraction.

The critical finding: **we reinvented a weaker version of a system that already existed**. The new `render_citation_bbox.py` quote-level mode uses a single-strategy difflib fuzzy matcher, while the existing `highlight-page.py` uses a 6-strategy cascade that handles every failure mode we encountered today (hyphenation, ligatures, Unicode diacritics, partial matches) and more.

---

## The ICP Visual System: What Already Exists

### 1. `scripts/pdf/highlight-page.py` (626 lines)

This is the crown jewel. A production-grade PDF text highlighting engine with:

**6-Strategy Text Search Cascade:**

| Strategy | Description | Handles |
|----------|-------------|---------|
| 1. Full text match | Unicode fallback chain (raw → NFC → NFKC → diacritics-stripped) | Polytonic Greek, ligatures |
| 2. Original text as-is | Skips dehyphenation, tries raw | OCR-faithful quotes |
| 3. Sentence chunking | Splits quote into sentences, highlights each | Multi-sentence quotes |
| 4. Overlapping phrase windows | 12-word sliding window with step=6 | Partial matches, reformatted text |
| 5. Progressive snippet fallback | Tries 150, 100, 60, 40, 25 char prefixes | Heavily corrupted OCR |
| 6. Start/end word windows | 5, 4, 3-word windows from both ends | When middle is garbled |

**Additional capabilities our new system lacks:**
- **Dehyphenation**: `be-\nings` → `beings` (handles line-break hyphens in academic PDFs)
- **Unicode normalization chain**: NFC → NFKC → diacritics-stripped (handles polytonic Greek like `ἐντελέχεια`)
- **Punctuation stripping**: Last-resort matching without commas, semicolons, dashes
- **Rectangle deduplication**: Merges overlapping highlights (>80% area overlap threshold)
- **Adjacent page scanning**: Tries pages ±1 and ±2 from the target (handles off-by-one page references)
- **Visual styling**: Soft pink fill `(1.0, 0.7, 0.8)` at 35% opacity with `(0.9, 0.4, 0.5)` border — more visually distinctive than our yellow
- **300 DPI rendering**: Higher quality than our 150 DPI
- **Rich text extraction**: Returns HTML with `<i>`, `<b>`, `<sup>`, `<sub>` tags
- **Footnote extraction**: Detects superscript markers and extracts corresponding footnote text from the page

### 2. ICP API Endpoints

**`GET /api/icp/pdf-page/:docId/:page?highlight=text`** (`icp-api-routes.ts:388-475`)

- Accepts `docId` + page number + optional highlight text
- Spawns `highlight-page.py` as child process
- Returns PNG image with highlighted regions
- Sets `X-ICP-Actual-Page` header if text found on adjacent page
- Cleans up temporary files automatically

**`GET /api/icp/pdf-meta/:docId/:page?quote=text`** (`icp-api-routes.ts:482-536`)

- Returns JSON with rich text formatting and footnotes
- Used by the dashboard to show formatted text alongside the PDF image

### 3. ICP Dashboard Quote Detail Modal

**`icp-panel.js` lines 524-835** — A full split-panel UI:

```
┌──────────────────────────────────────────────────────┐
│ Quote Detail Modal                              [×]  │
├─────────────────────┬────────────────────────────────┤
│                     │                                │
│  Quote Text         │  PDF Page Viewer               │
│  ─────────          │  ──────────────                │
│  "The arousing of   │  [PNG of PDF page with         │
│   prejudice..."     │   pink highlighted region]      │
│                     │                                │
│  Source: Aristotle  │  [Zoom: 25% 50% 100% 200%]    │
│  Page: 3            │  [◄ Prev] Page 3 [Next ►]     │
│                     │  [⛶ Fullscreen]                │
│  Rich Text:         │                                │
│  <i>Rhetoric</i>   │                                │
│                     │                                │
│  Footnotes:         │                                │
│  ¹ See Rhet. II.1   │                                │
│                     │                                │
├─────────────────────┴────────────────────────────────┤
│  Verification: ✓ Verified                            │
└──────────────────────────────────────────────────────┘
```

Features:
- Loads PDF page via `/api/icp/pdf-page/:docId/:page?highlight=<quote>`
- Zoom controls (25%, 50%, 100%, 200%)
- Page navigation (prev/next buttons)
- Fullscreen toggle
- Concurrent rich text + footnote loading
- Keyboard navigation (arrow keys)
- Auto-detection of text found on adjacent page

### 4. ICP Types (`icp-types.ts`)

The `QuoteSpan` type tracks:
- `doc_id` — for PDF lookup
- `page` — for rendering
- `text` — the quoted text (passed as `?highlight=`)
- `provenance_scorecard` — fidelity metrics
- `verification_status` — manual/auto verification state

---

## Comparison: ICP System vs New Visual Grounding

| Capability | ICP (`highlight-page.py`) | New (`render_citation_bbox.py`) |
|-----------|--------------------------|-------------------------------|
| **Text search strategies** | 6-strategy cascade | 1 (difflib fuzzy match) |
| **Unicode handling** | NFC → NFKC → diacritics-stripped | `re.sub(r'\W+', '')` only |
| **Dehyphenation** | Yes (`be-\nings` → `beings`) | No |
| **Sentence splitting** | Yes (multi-segment) | Ellipsis splitting only |
| **Adjacent page scanning** | ±2 pages automatic | Multi-page from bbox candidates only |
| **Rectangle deduplication** | >80% area overlap merge | None |
| **Rendering DPI** | 300 | 150 |
| **Highlight style** | Pink fill (0.35 opacity) + border | Yellow fill (0.3 opacity) + orange border |
| **Rich text extraction** | Yes (italic, bold, super/subscript) | No |
| **Footnote extraction** | Yes | No |
| **API endpoint** | Yes (`/api/icp/pdf-page/`) | Subprocess only |
| **Dashboard UI** | Full modal with zoom/nav/fullscreen | Markdown link to PNG |
| **Serving model** | On-demand (render per request) | Batch (render all at generation time) |

---

## Key Architectural Differences

### On-Demand vs Batch Rendering

The ICP system renders PDF pages **on demand** when the user clicks a citation in the dashboard. It passes the quote text as a query parameter, and the server renders the highlighted page in real-time. This means:
- No orphan PNGs
- No pre-rendering overhead during generation
- Always uses the latest PDF (no stale renders)
- Works for any citation without pre-computation

The new system renders **at generation time** — spawning Python subprocesses during the endnote generation phase. This means:
- All renders happen during the pipeline run (adds ~2-5s)
- PNGs must be stored on disk
- Orphan management required
- Only citations that pass through the endnote generator get renders

### Text Search Robustness

The ICP `highlight-page.py` was clearly built iteratively to handle real-world failures:
- The 6-strategy cascade with progressively looser matching suggests it was developed through actual failures with academic PDFs
- The dehyphenation specifically targets the exact problem we identified today
- The Unicode normalization chain handles the exact polytonic Greek issue common in Aristotle/Heidegger scholarship
- The adjacent-page scanning solves the off-by-one page reference problem we encountered

The new `render_citation_bbox.py` uses a single difflib approach that is elegant but brittle — it was written in one session without iterative hardening against real-world failures.

---

## Recommendations

### Immediate: Replace `render_citation_bbox.py` Quote Mode with `highlight-page.py`

The new system's quote-level rendering in `render_citation_bbox.py` should call `highlight-page.py` instead of reimplementing text search. `highlight-page.py` already handles every failure mode we've encountered and more.

The `renderBboxOverlayAsync` function in `endnote-generator.ts` would spawn:
```
python3 scripts/pdf/highlight-page.py <pdf_path> <page_num> <output_path> <quote_text> 150
```
instead of:
```
python3 scripts/ingest/render_citation_bbox.py --pdf ... --quote-text ... --target-page ...
```

### Medium-term: Expose Endnote Citations via ICP API

Instead of batch-rendering PNGs during generation, the endnote generator could record `(docId, page, quoteText)` tuples in its output. The dashboard or any viewer could then call `/api/icp/pdf-page/:docId/:page?highlight=<quote>` on demand, leveraging the full ICP infrastructure (zoom, pagination, rich text, footnotes) without any new code.

### Long-term: Unify the Two Systems

The ICP quote-level verification pipeline and the endnote generator's visual provenance should share a single rendering backend. The `QuoteSpan` type from `icp-types.ts` already has all the fields needed, and the ICP API already has the endpoints. The endnote generator should produce `QuoteSpan`-compatible data that the ICP dashboard can display directly.

---

## Files Referenced

| File | Lines | Purpose |
|------|-------|---------|
| `scripts/pdf/highlight-page.py` | 626 | Production PDF highlighting engine (6-strategy cascade) |
| `src/god-agent/observability/icp-api-routes.ts` | ~56K | Express endpoints including `/api/icp/pdf-page/` |
| `src/god-agent/observability/dashboard/icp-panel.js` | ~74K | Dashboard frontend with Quote Detail Modal |
| `src/god-agent/core/composition/icp-types.ts` | ~1.2K | Type definitions including `QuoteSpan`, `ProvenanceScorecard` |
| `src/god-agent/core/composition/icp-orchestrator.ts` | ~32K | Citation tracking through 10-stage pipeline |
| `scripts/ingest/render_citation_bbox.py` | ~300 | New bbox renderer (less robust than highlight-page.py) |
| `src/god-agent/cli/quality/endnote-generator.ts` | ~31K | Endnote generation with visual provenance integration |
