# ICP Dashboard — User Guide

**Last updated**: 2026-03-29

This guide covers both the V2 streamlined dashboard (recommended) and the V1 full-featured interface.

---

## Quick Start (V2 — Standard Mode)

1. Open the dashboard at `http://localhost:3847`
2. Click the **ICP V2** tab
3. Select **Standard** depth mode
4. Enter your research topic in the prompt field
5. Click **Prepare Evidence**
6. Review quotes in the Evidence panel — verify the good ones, reject the bad
7. Click **Proceed to Quality Gates** in the footer
8. Review quality gate results
9. Click **Proceed to Export**
10. Click **Copy to Clipboard** or **Download .md**

---

## V2 Dashboard

### Depth Modes

Choose one before running the pipeline:

| Mode | What Happens | When to Use |
|------|-------------|-------------|
| **Express** | Auto-verifies evidence (confidence >= 85%), rejects uncertain quotes, generates immediately, lands on Export | Quick drafts, iteration, when corpus is well-curated |
| **Standard** | Prepares evidence, waits for your review, then generates | Normal writing workflow |
| **Full** | Same as Standard, plus the Advanced Diagnostics drawer (binding inspector, stress test, planner, heatmap) | Research-grade work requiring maximum control |

### Panel 1: Prompt

**Purpose**: Configure and launch the pipeline.

**Fields**:
- **Research Question**: Your topic or thesis (required). This drives retrieval and generation.
- **Source Mode**: `Corpus Only` (default) uses only your ingested PDFs. `Hybrid` adds external sources. `External` allows any source.
- **Min Relevance**: Cosine similarity threshold for retrieved chunks (0-1, default 0.5). Lower = more chunks, potentially less relevant.
- **Max Chunks**: Maximum evidence chunks to retrieve per facet (default 20).
- **Word Count Target**: Target length for generated output.
- **Draft Category**: `Section` (1,000-2,000 words), `Chapter` (3,000-5,000), `Paper` (5,000+), `Essay` (variable).

**Buttons**:
- **Prepare Evidence** (Standard/Full): Creates a session, decomposes your prompt into research facets, retrieves corpus evidence, ranks and auto-verifies quotes. Lands on the Evidence panel.
- **Run Full Pipeline** (Express): Does everything above plus automatic verification + generation + quality gates. Lands on Export.
- **Run to Evidence Only**: Always behaves like Standard mode regardless of depth selection.

**What happens internally** (POST /session — stages 1-4):
1. Your prompt is decomposed into research facets (thematic dimensions)
2. For each facet, the system searches the corpus for relevant passages
3. Retrieved quotes are deduplicated and ranked by relevance
4. An auto-verifier checks each quote against the source PDF text

### Panel 2: Evidence

**Purpose**: Review and verify the evidence the system retrieved before generating text.

**Layout**: A scrollable list of quote cards, each showing:
- **Status badge**: Color-coded verification status (green = auto-verified, blue = human-verified, orange = corrected, red = rejected, yellow-orange = flagged)
- **Confidence score**: Auto-verifier's confidence (0-100%)
- **Quote text**: First 200 characters of the retrieved passage
- **Source info**: Document ID and page number
- **Action buttons**: Verify / Reject / Flag (per card)

**Bulk Actions** (toolbar at top):
- **Select All / Deselect All**: Toggle checkboxes on all visible cards
- **Verify Selected**: Bulk-verify all checked quotes as `human_verified`
- **Reject Selected**: Bulk-reject all checked quotes
- **Verify All Auto-verified**: One-click approval for all quotes the system is confident about (>= 85% confidence). Quotes between 50-85% remain flagged for your review.

**Filters**:
- Status filter: All / Verified / Pending / Rejected
- Sort: By confidence (default, descending) / By source / By page

**Clicking a quote's text** opens the **Provenance Viewer** — a split-pane modal showing:
- Left: the source PDF page rendered at 300 DPI with the quoted text highlighted
- Right: full quote text, source metadata, confidence score, verification controls
- Keyboard: `Esc` closes, `+`/`-` zoom, `0` reset zoom

**Footer**: **Proceed to Quality Gates** (enabled when at least 1 quote is verified). This triggers text generation from your reviewed evidence.

### Panel 3: Quality

**Purpose**: Review quality gate results after generation.

**Quality gate cards** (each shows pass/fail/N/A with expandable details):

| Gate | What It Checks |
|------|---------------|
| **Citation Enforcement** | All citations reference real corpus sources. Hallucinated author names detected and corrected. |
| **Quality Gauntlet** | 9-stage weighted evaluation: argument coherence, citation completeness, citation density, style consistency, factual accuracy, Toulmin structure, quotation fidelity, claim verification. Overall score 0-100%. |
| **Prose Sanitization** | LLM artifacts removed (research markers like `Q1:`, meta-commentary like `[TODO:]`, debug markers, formatting leaks). Two passes. |
| **Author Scrubbing** | Signal phrases referencing non-corpus authors removed (e.g., "As Smith argues..." when Smith isn't in your corpus). |
| **APA Stripping** | Bare (Author Year) citations removed (wrong format for MLA-style output). |
| **Endnotes** | Supporting quotations generated for inline citations, formatted as MLA table. |

**Investigation Traces** (collapsible section): If multi-step drafting ran, shows v1 investigation results — hallucinated authors found, phantom quotations, section word count issues, and the prevention plan applied to v2 generation.

**Gate Override**: If gates are failing, the footer shows **Proceed to Export (N gates failing)** with a confirmation dialog. The override is logged to the session event log.

### Panel 4: Export

**Purpose**: Review and download the final output.

**Display**:
- Word count and quality score summary
- Rendered Markdown (headings, bold, italic, paragraphs)
- Full generated text with section structure

**Actions**:
- **Copy to Clipboard**: Copies raw Markdown to clipboard
- **Download .md**: Downloads as `icp-export-{sessionId}.md`
- **Modify & Regenerate**: Returns to Evidence panel (Standard/Full) or Prompt (Express) with the session preserved. Allows you to adjust evidence or parameters and re-generate.
- **Start Over**: Creates a new session (confirms first since current session is discarded from view, though it persists on the server)

### Advanced Drawer (Full Mode Only)

A collapsible panel below the main content with diagnostic tabs:

| Tab | Shows |
|-----|-------|
| **Binding** | Claim-to-quote bindings: how many atoms each binding covers, support kind (direct quote / paraphrase / inference) |
| **Stress Test** | Warrant adequacy results: which claims have strong/weak/missing evidence support |
| **Planner** | Paragraph plan: how atoms are organized into paragraphs with quote requirements |
| **Heatmap** | Evidence density visualization (available after generation) |

### Progress Bar

The horizontal progress indicator at the top shows 4 macro-phases:

```
  Prepare    →    Review    →    Validate    →    Export
    ✓               ●              ○               ○
```

- **Prepare**: Prompt decomposition + evidence retrieval + ranking + auto-verification
- **Review**: Your evidence review (skipped in Express mode)
- **Validate**: Text generation + quality gates
- **Export**: Final output ready

Completed phases are clickable — click to navigate back. In Express mode, Prepare and Review auto-complete.

---

## V1 Dashboard

The original 13-panel interface. Access via the **ICP Pipeline** tab.

### Panel Sequence

| Panel | Purpose | Key Actions |
|-------|---------|-------------|
| **Prompt** | Configure pipeline parameters (12 feature toggles, advanced settings, cost estimator) | "Run Pipeline" (stages 1-4), "Generate (Adapter)" (full pipeline) |
| **Evidence** | Two-column layout: facets on left, quotes on right. Filter by status, limit results. | Click quote → full detail modal with PDF viewer + OCR correction editor |
| **Investigation** | V1 draft analysis: hallucinated authors, phantom quotations, section word counts, prevention plan | "Re-generate with Prevention Plan" |
| **Binding** | Three-column: atoms, bindings, available quotes. Manual atom-to-quote binding. | Create/delete bindings |
| **Stress Test** | Warrant adequacy testing for atoms + bindings | "Run Stress Test" button |
| **Planner** | Paragraph plan preview with atom coverage progress bar | Read-only |
| **Gen Progress** | Real-time WebSocket streaming of generation progress (section by section) | Cancel button during generation |
| **Heatmap** | Evidence density visualization across paragraphs (color-coded by atom/quote density) | Read-only |
| **Corpus Diff** | Compare two pipeline runs (placeholder) | Enter run IDs, click "Run Diff" |
| **Facets** | Edit facet names, roles, strictness, descriptions | Inline editing with auto-save |
| **Quality** | Quality gate results (same as V2 Quality panel) | "Run Validation", "Submit Feedback" |
| **Export** | Gold-standard prompt preview + export package (JSON download) | "Build Gold Prompt", "Export", "Download" |
| **Events** | Session event log with actor/action/severity filtering | Filter by user-visible, category |

### Quote Detail Modal (V1 Unique Feature)

The V1 Evidence panel has a rich quote inspection modal accessed by clicking any quote card:

**Left pane**:
- Full quote text with rich formatting (loaded from PDF metadata)
- Footnotes extracted from the source page
- OCR correction editor (contenteditable div) with formatting toolbar:
  - **I** (Italic), **B** (Bold), **x^** (Superscript), **x_** (Subscript)
  - Remove Format, Join Hyphen (fixes line-break hyphens), Copy From Rich Text
- Save Correction: submits OCR patch + sets status to `human_corrected`
- Verify / Flag buttons

**Right pane**:
- PDF page renderer (server-side 300 DPI PNG)
- Zoom controls: -/+, percentage display, 1:1 reset, Fit Width
- Fullscreen toggle (hides left pane, expands PDF)
- Page navigation (Prev/Next)
- Match type badge: "Exact Quote Match" (green), "Structural Match" (yellow), "No Match" (red)

**Keyboard shortcuts**: Esc (close/exit fullscreen), +/- (zoom), 0 (reset zoom)

---

## Common Workflows

### "I want a quick draft from my corpus"

1. V2 → Express mode → enter topic → **Run Full Pipeline** → download from Export

### "I want to review evidence before generating"

1. V2 → Standard mode → enter topic → **Prepare Evidence**
2. Review quotes in Evidence → verify good ones, reject bad ones
3. **Proceed to Quality Gates** → generation runs → review gates
4. **Proceed to Export** → download

### "I want maximum control over the composition"

1. V2 → Full mode → enter topic → **Prepare Evidence**
2. Review evidence with bulk actions
3. Open Advanced Drawer → inspect bindings, stress test results, paragraph plan
4. **Proceed to Quality Gates** → review all 8+ gate results
5. If gates fail: override with confirmation, or **Modify & Regenerate**
6. **Proceed to Export** → download

### "I want to correct OCR errors in a source"

1. V1 → Evidence panel → click a quote card
2. In the modal, review the PDF page (right pane) against the extracted text (left pane)
3. Edit the text in the OCR Correction editor using the formatting toolbar
4. Click **Save Correction** (submits OCR patch to the system)
5. The quote is now marked `human_corrected` and will be used with the corrected text

### "The quality gates are failing — what do I do?"

1. Check which gates failed in the Quality panel
2. Expand each failing gate to see specific issues
3. Common fixes:
   - **Citation Enforcement failing**: Your evidence set may be too thin. Go back to Evidence, verify more quotes, or lower the Min Relevance threshold on the Prompt panel.
   - **Quality Gauntlet low score**: The generated text may have structural issues. Click **Modify & Regenerate** to adjust your prompt or evidence.
   - **Author Scrubbing removed authors**: The model cited authors not in your corpus. The scrubber already fixed this; the gate is informational.
4. If the failures are acceptable, use the gate override (confirm dialog) to proceed to Export.

---

## Service Requirements

The dashboard requires these backend services running:

| Service | Port | Purpose | Start Command |
|---------|------|---------|---------------|
| Express Server | 3847 | Dashboard + API | `./scripts/god-launch start observe` |
| ChromaDB | 8001 | Vector database (corpus chunks) | `./scripts/god-launch start chroma` |
| Embedding Server | 8000 | Text embedding (gte-Qwen2-1.5B) | `./scripts/god-launch start embed` |

Start all services: `./scripts/god-launch start` or `/god-launch start`

Verify services: `curl http://localhost:8000/` (embedding), `curl http://localhost:8001/api/v1` (ChromaDB)

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "No evidence retrieved" | Embedding service down or corpus not ingested | Check `curl http://localhost:8000/` returns 200. Run ingestion if empty. |
| "TASK_QUEUED" errors | ANTHROPIC_API_KEY missing or truncated | Check `.env` has full 108-character key |
| PDF viewer shows "not available" | PDF file not in corpus directory or pdftoppm not installed | Verify `ls corpus/` contains PDFs. Install poppler-utils. |
| Quality gauntlet scores 0.5 for all stages | Gauntlet stages returning defaults (known issue) | Scores are informational; citation enforcement is the primary quality signal |
| Express mode says "Insufficient evidence" | No quotes met the 85% confidence threshold | Switch to Standard mode to manually verify lower-confidence quotes |
