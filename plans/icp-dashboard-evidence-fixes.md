# ICP Dashboard Evidence Tab — Quote Detail Fixes

## Issues

1. **Select Quote Range and OCR Correction panels don't show italics** — Both panels use `escapeHtml(spanText)` (plain text), while the Full Quote panel gets rich HTML injected asynchronously from `icpLoadPdfMeta()`.
2. **Select Quote Range only supports single selection** — `icpUseSelection()` replaces the OCR editor content entirely each time; it cannot accumulate multiple highlighted chunks.
3. **Page numbers and running headers appear in panel text** — The `span.text` from ChromaDB chunks includes page headers/running titles. The `isNoise()` filter in `faceted-retrieval.ts` only filters *sentences* during scoring, not the raw chunk text displayed in the quote detail panels.

---

## Fix 1: Rich text (italics) in Select Quote Range and OCR Correction panels

### Root cause
In `icp-panel.js:1274`, the Select Quote Range panel is populated with:
```js
escapeHtml(spanText)  // plain text, no formatting
```
And at line 1293, the OCR Correction editor:
```js
escapeHtml(spanText)  // plain text, no formatting
```

Meanwhile, the Full Quote panel starts with `escapeHtml(spanText)` too, but gets *replaced* with rich HTML at line 1473 when `icpLoadPdfMeta()` returns:
```js
fullTextEl.innerHTML = meta.rich_text.html;  // replaces plain text
```
The OCR editor *does* get updated (line 1477), but the Select Quote Range panel (`icp-quote-selectable`) is never updated.

### Plan

**File: `icp-panel.js`, function `icpLoadPdfMeta()`** (around line 1468):

After the `meta.rich_text.html` check, also update `#icp-quote-selectable`:

```js
var selectable = document.getElementById('icp-quote-selectable');
if (selectable) {
  selectable.innerHTML = meta.rich_text.html;
}
```

This gives all three panels the same rich text (with `<i>`, `<b>`, `<sup>`, `<sub>` tags).

**Important**: The selectable panel needs to preserve user-select behavior. The existing CSS `.icp-quote-selectable` has `user-select: text` and `cursor: text`, which already supports selection over HTML elements — no CSS change needed.

---

## Fix 2: Multi-chunk selection in Select Quote Range

### Root cause
`icpUseSelection()` (line 1121) does a single `range.surroundContents(mark)` and then sets `editor.innerText = selectedText` — **replacing** the entire OCR editor content. There's no way to accumulate multiple selections.

### Plan

**File: `icp-panel.js`, function `icpUseSelection()`**:

Replace the current single-selection logic with an additive multi-selection approach:

1. **Keep the highlight logic** (`mark.className = 'icp-trim-highlight'`) — it already works for marking the selected range.
2. **Instead of replacing the editor**, *append* or *rebuild* editor content from all highlighted `<mark>` elements:

```js
function icpUseSelection() {
  var selectable = document.getElementById('icp-quote-selectable');
  var editor = document.getElementById('icp-quote-correction');
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    showICPError('Select text first by highlighting a portion of the quote above');
    return;
  }
  var range = sel.getRangeAt(0);
  if (!selectable || !selectable.contains(range.startContainer) || !selectable.contains(range.endContainer)) return;

  var selectedText = sel.toString().trim();
  if (!selectedText) return;

  // Highlight the selected range in the source div
  try {
    var mark = document.createElement('mark');
    mark.className = 'icp-trim-highlight';
    range.surroundContents(mark);
  } catch (e) {
    // surroundContents can fail on partial selections spanning elements
    // Fallback: wrap as much as possible
  }
  sel.removeAllRanges();

  // Rebuild the OCR correction editor from ALL highlighted marks
  icpSyncSelectionToEditor();
}

function icpSyncSelectionToEditor() {
  var selectable = document.getElementById('icp-quote-selectable');
  var editor = document.getElementById('icp-quote-correction');
  if (!selectable || !editor) return;

  var marks = selectable.querySelectorAll('mark.icp-trim-highlight');
  if (marks.length === 0) return;

  // Build editor content from all highlighted chunks, preserving inner HTML (italics etc)
  var chunks = [];
  for (var i = 0; i < marks.length; i++) {
    chunks.push(marks[i].innerHTML);
  }
  // Join with a visible separator so user can see chunk boundaries
  editor.innerHTML = chunks.join(' <span class="icp-chunk-sep">[…]</span> ');
}
```

3. **Update `icpResetTrim()`** to also clear the editor properly (it already removes marks and resets the editor — just verify it calls `icpSyncSelectionToEditor` or resets to full text).

4. **Add CSS** for `.icp-chunk-sep` in `styles.css`:
```css
.icp-chunk-sep { color: #555; font-size: 0.85em; user-select: none; }
```

5. **Add a "Remove Last Selection" button** next to "Use Selection" and "Reset":
```html
<button onclick="icpRemoveLastSelection()" class="btn btn-sm btn-secondary">Undo Last</button>
```

```js
function icpRemoveLastSelection() {
  var selectable = document.getElementById('icp-quote-selectable');
  if (!selectable) return;
  var marks = selectable.querySelectorAll('mark.icp-trim-highlight');
  if (marks.length > 0) {
    var last = marks[marks.length - 1];
    last.replaceWith(last.textContent);
  }
  icpSyncSelectionToEditor();
}
```

---

## Fix 3: Filter page numbers and running headers from panel text

### Root cause
The raw chunk text from ChromaDB (`span.text`) contains page numbers and running headers (e.g., `"150 ARISTOTLE'S METAPHYSICS\n..."` or `"Chapter 7\n..."`). These are *not* filtered before display. The `isNoise()` function in `faceted-retrieval.ts` only operates at the sentence level during core text scoring, and it doesn't modify the stored chunk text.

### Plan

Two-pronged approach: **client-side display filter** + **server-side rich text filter**.

#### A. Client-side display filter (icp-panel.js)

Add a `stripPageNoise(text)` utility function:

```js
function stripPageNoise(text) {
  // Remove standalone page numbers (e.g., "150\n" or "\n150\n")
  text = text.replace(/(?:^|\n)\s*\d{1,4}\s*(?:\n|$)/g, '\n');
  // Remove running headers: lines that are ALL-CAPS (possibly with numbers)
  // e.g., "ARISTOTLE'S METAPHYSICS" or "ON THE SOUL"
  text = text.replace(/(?:^|\n)[A-Z][A-Z\s'''\-:,]{5,}(?:\n|$)/g, '\n');
  // Remove "Chapter N" lines
  text = text.replace(/(?:^|\n)\s*Chapter\s+\d+\s*(?:\n|$)/gi, '\n');
  // Clean up excess newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}
```

Apply this to `spanText` at the point of display (line 1227 area):
```js
var spanText = stripPageNoise(span.text || '');
```

This affects all three panels (Full Quote, Select Range, OCR Correction) simultaneously.

#### B. Server-side rich text filter (highlight-page.py)

In `extract_rich_text()`, after collecting `formatted_parts` (line 494 area), filter out spans that look like page headers or page numbers:

```python
# Filter out page headers and page numbers from rich text
def is_page_noise(part):
    text = part["text"].strip()
    if not text:
        return True
    # Standalone page number
    if re.match(r'^\d{1,4}$', text):
        return True
    # All-caps running header (5+ chars)
    if len(text) > 5 and text == text.upper() and re.match(r'^[A-Z\s\'\-:,]+$', text):
        return True
    return False

formatted_parts = [p for p in formatted_parts if not is_page_noise(p)]
```

This ensures the `rich_text.html` returned by the API also excludes headers/page numbers.

---

## Implementation Order

1. **Fix 1** (quick win) — Add `selectable.innerHTML = meta.rich_text.html` in `icpLoadPdfMeta()`. ~5 lines changed.
2. **Fix 3** (medium) — Add `stripPageNoise()` client-side + `is_page_noise()` server-side. ~20 lines each.
3. **Fix 2** (larger) — Refactor `icpUseSelection()` to support multi-chunk accumulation. ~40 lines changed, new `icpSyncSelectionToEditor()` + `icpRemoveLastSelection()` functions.

## Files Modified

| File | Changes |
|------|---------|
| `src/god-agent/observability/dashboard/icp-panel.js` | Fix 1: update selectable in `icpLoadPdfMeta()`. Fix 2: rewrite `icpUseSelection()`, add `icpSyncSelectionToEditor()`, `icpRemoveLastSelection()`. Fix 3: add `stripPageNoise()`. |
| `src/god-agent/observability/dashboard/styles.css` | Fix 2: add `.icp-chunk-sep` style. |
| `scripts/pdf/highlight-page.py` | Fix 3: add `is_page_noise()` filter in `extract_rich_text()`. |
