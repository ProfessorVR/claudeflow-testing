# ICP Dashboard Fixes — Round 2

## Issue 1: Manual Quote Input in Evidence Tab

### Current State
The Evidence tab's "Quote Spans" section only shows quotes extracted from the pipeline (via faceted retrieval from ChromaDB). There is no way for the user to directly type/paste a quotation they want included. There is also no API endpoint to add a manual quote to a session.

### Plan

#### A. Backend: New API endpoint `POST /api/icp/add-quote/:sessionId`

**File: `src/god-agent/observability/icp-api-routes.ts`**

Add a new route that creates a `QuoteSpan` from user-provided text:

```ts
router.post('/add-quote/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId, res);
  if (!session) return;

  const { text, docId, page, sourceAnchor } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing required field: text' });
  }

  // Build a manual QuoteSpan
  const quoteId = crypto.randomUUID();
  const normalizedText = text.trim();
  const textFingerprint = sha256(normalizedText);
  const spanFingerprint = sha256((docId || 'manual') + textFingerprint);

  const span: QuoteSpan = {
    quote_id: quoteId,
    text_fingerprint: textFingerprint,
    span_fingerprint: spanFingerprint,
    doc_id: docId || 'manual-entry',
    page: page || 0,
    source_kind: 'primary',
    clean_text_range: [0, normalizedText.length],
    clean_range_hash: textFingerprint,
    patch_epoch: 0,
    normalization_policy_version: 'manual-v1',
    text: normalizedText,
    left_ctx_hash: '',
    right_ctx_hash: '',
    verification_status: 'human_verified', // manually entered = trusted
    auto_confidence: 1.0,
    source_anchor: sourceAnchor || undefined,
    provenance_scorecard: {
      extraction_confidence: 1.0,
      cross_ref_count: 0,
      human_audit: true,
    },
  };

  session.quote_spans.push(span);
  res.json({ quoteId, span_fingerprint: spanFingerprint });
});
```

**Note**: Need to check the exact shape of `ProvenanceScorecard` and provide valid defaults. Also import `crypto` if not already available.

#### B. Frontend: "Add Quote" UI in Evidence tab

**File: `src/god-agent/observability/dashboard/icp-panel.js`**

Add an "Add Quote" button below the quote filter row in `renderEvidencePanel()`. Clicking opens an inline form with:

1. A `contenteditable` div for the quote text (supports rich formatting — italics, bold, etc.)
2. A formatting toolbar identical to the OCR correction toolbar (italic, bold, superscript, subscript, remove format)
3. Optional fields: Document source (dropdown from manifest or free text), page number, source anchor (Bekker number etc.)
4. "Add Quote" submit button

```js
// After the filter row in renderEvidencePanel():
html += `
  <div class="icp-add-quote-section">
    <button class="btn btn-sm btn-primary" onclick="icpToggleAddQuote()">+ Add Quote</button>
    <div id="icp-add-quote-form" style="display:none">
      <div class="icp-edit-toolbar">
        <button onclick="icpManualQuoteFormat('italic')" class="btn btn-sm icp-edit-btn" title="Italic"><i>I</i></button>
        <button onclick="icpManualQuoteFormat('bold')" class="btn btn-sm icp-edit-btn" title="Bold"><b>B</b></button>
        <button onclick="icpManualQuoteFormat('superscript')" class="btn btn-sm icp-edit-btn" title="Superscript">x<sup>2</sup></button>
        <button onclick="icpManualQuoteFormat('subscript')" class="btn btn-sm icp-edit-btn" title="Subscript">x<sub>2</sub></button>
        <button onclick="icpManualQuoteFormat('removeFormat')" class="btn btn-sm icp-edit-btn" title="Remove formatting">T&#x0336;</button>
      </div>
      <div id="icp-manual-quote-editor" class="icp-quote-editor" contenteditable="true"
           spellcheck="true" placeholder="Paste or type quotation here..."></div>
      <div class="icp-add-quote-meta">
        <input id="icp-manual-quote-source" type="text" placeholder="Source (author/title)" class="icp-input-sm">
        <input id="icp-manual-quote-page" type="text" placeholder="Page" class="icp-input-sm" style="width:60px">
        <input id="icp-manual-quote-anchor" type="text" placeholder="Anchor (e.g. 1026a)" class="icp-input-sm" style="width:100px">
      </div>
      <div class="icp-add-quote-actions">
        <button onclick="icpSubmitManualQuote()" class="btn btn-sm btn-primary">Add Quote</button>
        <button onclick="icpToggleAddQuote()" class="btn btn-sm btn-secondary">Cancel</button>
      </div>
    </div>
  </div>
`;
```

Functions:
- `icpToggleAddQuote()` — toggle form visibility
- `icpManualQuoteFormat(cmd)` — `document.execCommand()` on the manual editor
- `icpSubmitManualQuote()` — POSTs to `/api/icp/add-quote/:sessionId`, then refreshes the session

#### C. CSS

**File: `src/god-agent/observability/dashboard/styles.css`**

Add styles for `.icp-add-quote-section`, `.icp-add-quote-meta`, `.icp-add-quote-actions`, `.icp-input-sm`, and placeholder styling for the `contenteditable` editor.

---

## Issue 2: Clickable Citation Badges in Binding Tab

### Current State
In the binding tab (claims review view), each claim card shows a badge like `"3 citations"` at line 1754:
```js
<span class="badge-score">${c.citations.length} citation${...}</span>
```
This is a static `<span>` — not clickable, and doesn't show the actual quotations.

The `c.citations` array contains `CitationAnchor` objects with `{ key, author, year, locator, fullCitation, isPrimary }` — these are bibliographic references, not direct `quote_id` links.

However, once atoms and bindings exist, each `ClaimAtom` has `bound_quote_ids: string[]` which links to actual `QuoteSpan` objects. And in the binding view, bindings have `quote_ids`.

### Plan

#### A. Claims Review View (pre-binding) — Citation popover

**File: `icp-panel.js`, in `renderBindingPanel()` claims review section**

Make the citations badge clickable. On click, expand a section below the claim showing each `CitationAnchor`:

```js
// Replace the static badge:
${c.citations?.length ? `
  <span class="badge-score icp-citation-toggle" onclick="event.stopPropagation(); icpToggleCitationDetail('${safeAttr(c.id)}')"
        style="cursor:pointer">${c.citations.length} citation${c.citations.length !== 1 ? 's' : ''} &#9660;</span>
  <div class="icp-citation-detail" id="icp-citation-detail-${safeAttr(c.id)}" style="display:none">
    ${c.citations.map(cit => `
      <div class="icp-citation-entry">
        <strong>${escapeHtml(cit.author)} (${cit.year})</strong>
        ${cit.locator ? `, ${escapeHtml(cit.locator)}` : ''}
        ${cit.isPrimary ? '<span class="badge-score" style="font-size:0.7em">primary</span>' : ''}
        <div class="icp-citation-full">${escapeHtml(cit.fullCitation)}</div>
      </div>
    `).join('')}
  </div>
` : ''}
```

Function:
```js
function icpToggleCitationDetail(claimId) {
  var el = document.getElementById('icp-citation-detail-' + claimId);
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}
```

#### B. Binding/Atom View (post-binding) — Quote popover on atoms

In the atoms column, each atom shows `"N quotes bound"`. Make this clickable to expand and show the actual bound quote text:

```js
// Replace the atom-quotes line:
<div class="atom-quotes ${a.bound_quote_ids?.length > 0 ? 'icp-quotes-toggle' : ''}"
     onclick="event.stopPropagation(); icpToggleAtomQuotes('${safeAttr(a.atom_id)}')"
     style="${a.bound_quote_ids?.length > 0 ? 'cursor:pointer' : ''}">
  ${a.bound_quote_ids?.length || 0} quotes bound ${a.bound_quote_ids?.length > 0 ? '&#9660;' : ''}
</div>
<div class="icp-atom-quotes-detail" id="icp-atom-quotes-${safeAttr(a.atom_id)}" style="display:none">
  ${(a.bound_quote_ids || []).map(qid => {
    const span = spans.find(s => s.quote_id === qid);
    if (!span) return `<div class="icp-bound-quote muted">Quote ${qid.slice(0,8)}... (not found)</div>`;
    return `
      <div class="icp-bound-quote" onclick="icpOpenQuoteDetail('${safeAttr(qid)}')" style="cursor:pointer">
        <div class="quote-text-sm">"${escapeHtml((span.core_text || span.text || '').slice(0, 120))}${(span.core_text || span.text || '').length > 120 ? '...' : ''}"</div>
        <div class="quote-id-sm">${escapeHtml(icpDocMetaCache[span.doc_id]?.author || span.doc_id?.slice(0,12) || '')} p. ${Array.isArray(span.page) ? span.page[0] : span.page || '?'}</div>
      </div>
    `;
  }).join('')}
</div>
```

Function:
```js
function icpToggleAtomQuotes(atomId) {
  var el = document.getElementById('icp-atom-quotes-' + atomId);
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}
```

#### C. Binding Cards — Quote popover on bindings

Similarly, in each binding card, make the `"Quotes: N"` line expandable:

```js
<div class="binding-quotes icp-quotes-toggle"
     onclick="event.stopPropagation(); icpToggleBindingQuotes('${safeAttr(b.binding_id)}')"
     style="cursor:pointer">
  Quotes: ${b.quote_ids.length} &#9660;
</div>
<div class="icp-binding-quotes-detail" id="icp-binding-quotes-${safeAttr(b.binding_id)}" style="display:none">
  ${b.quote_ids.map(qid => {
    const span = spans.find(s => s.quote_id === qid);
    if (!span) return `<div class="icp-bound-quote muted">${qid.slice(0,8)}...</div>`;
    return `
      <div class="icp-bound-quote" onclick="icpOpenQuoteDetail('${safeAttr(qid)}')" style="cursor:pointer">
        <div class="quote-text-sm">"${escapeHtml((span.core_text || span.text || '').slice(0, 100))}..."</div>
      </div>
    `;
  }).join('')}
</div>
```

#### D. CSS

```css
.icp-citation-detail { margin-top: 6px; padding: 6px 8px; background: #1a1a2e; border: 1px solid #333; border-radius: 4px; }
.icp-citation-entry { margin-bottom: 4px; font-size: 0.85em; color: #ccc; }
.icp-citation-full { font-size: 0.8em; color: #888; margin-top: 2px; }
.icp-bound-quote { padding: 4px 6px; margin: 2px 0; background: #151530; border-radius: 3px; font-size: 0.85em; }
.icp-bound-quote:hover { background: #1e1e3a; }
.icp-atom-quotes-detail, .icp-binding-quotes-detail { margin-top: 4px; }
.icp-quotes-toggle { color: #7986cb; }
.icp-quotes-toggle:hover { text-decoration: underline; }
.icp-citation-toggle { cursor: pointer; }
.icp-citation-toggle:hover { text-decoration: underline; }
```

---

## Issue 3: SuperPrompt Tab — Binding Quality and Quote Context Always Crossed Out

### Root Cause

The enrichment chips show `applied` or `skipped` class. The `skipped` class has `text-decoration: line-through` (styles.css line 4961). The chips are rendered from `enrichment_manifest.entries`.

**Binding Quality** is skipped when:
1. `sessionContext.binding_quality` is empty/undefined (constrained-generator.ts:1650)
2. No binding quality data exists for the paragraph's specific atoms (line 1668)

**Quote Context** is skipped when:
1. The paragraph's `required_quotes` don't match any spans with `context_before`, `context_after`, or `core_text` set (constrained-generator.ts:1730-1734)

#### Investigation Path A: binding_quality data flow

The `session.pipeline_metrics.bindingQuality` is populated in `icp-orchestrator.ts:846` during Stage 4A (Claude-as-judge assessment). This only runs during the **full pipeline** (`POST /pipeline`).

The **step-by-step dashboard flow** goes: decompose → retrieve → generate-claims → bind-and-stress. The bind-and-stress endpoint (`POST /bind-and-stress/:sessionId`) calls `runClaimStages()` which does atom decomposition + binding + stress test, but **may not run the Claude-as-judge quality assessment**.

Let me verify:

**File: `icp-api-routes.ts`, bind-and-stress route** — need to check if it populates `pipeline_metrics.bindingQuality`.

#### Investigation Path B: quote context (core_text/context_before/context_after)

These context window fields are populated by `faceted-retrieval.ts` during the P0.2/P0.3 context windowing step. If the retrieve stage didn't run these steps, or if the spans were extracted without context windowing, these fields would be empty → quote context enrichment gets skipped.

### Plan

#### A. Diagnose the data flow

**Step 1**: Check the bind-and-stress route to see if it populates binding quality metrics.

**Step 2**: Check the retrieve route to see if context windowing is being applied to spans.

**Step 3**: Add logging/visibility: In `renderSuperPromptCard()`, show the `skip_reason` text for skipped enrichments more prominently (currently it's only in the tooltip). This helps users understand WHY something is crossed out.

#### B. Fix binding quality propagation

**File: `icp-api-routes.ts`**

In the superprompt assembly route (`POST /superprompt/:sessionId`), the session context is built at line 2976:
```ts
binding_quality: session.pipeline_metrics?.bindingQuality?.assessments?.map(...)
```

If `pipeline_metrics` is undefined or `bindingQuality` is not populated (because the step-by-step flow skips it), this will be `undefined` → enrichment skipped.

**Fix**: In the `bind-and-stress` route, after binding completes, run the Claude-as-judge assessment if it wasn't already run. Alternatively, populate `pipeline_metrics.bindingQuality` from the binding results themselves.

The simpler fix: In the superprompt assembly, if `pipeline_metrics.bindingQuality` is not available but `session.bindings` exist, synthesize binding quality from the binding data directly:

```ts
// Fallback: synthesize binding quality from bindings if metrics don't exist
let bindingQualityData = session.pipeline_metrics?.bindingQuality?.assessments;
if (!bindingQualityData && session.bindings?.length > 0) {
  bindingQualityData = session.bindings.flatMap(b =>
    b.atom_ids.flatMap(atomId =>
      b.quote_ids.map(quoteId => ({
        atomId,
        quoteId,
        scores: { overall: 0.6 }, // default medium for un-assessed bindings
      }))
    )
  );
}
```

#### C. Fix quote context propagation

**File: `icp-api-routes.ts`** or **`faceted-retrieval.ts`**

Check if `context_before`/`context_after`/`core_text` are being set on spans in the step-by-step flow. If the retrieve step populates these fields but they're lost when spans are serialized/deserialized between endpoints, that's a data transfer bug.

If the context windowing genuinely didn't run (e.g., the step-by-step retrieve uses a different code path), the fix is to ensure the same context windowing logic runs in both the full pipeline and the step-by-step retrieve.

**Simpler approach**: In the superprompt assembly, if spans lack context fields, run a lightweight context extraction on the spot using the span's `text` field:
- `core_text` = the full text (or first N characters as a reasonable approximation)
- `context_before` / `context_after` = empty (honest about missing data)

This at least ensures the enrichment applies with whatever data exists, rather than being completely skipped.

#### D. Show skip reasons visibly

**File: `icp-panel.js`, `renderSuperPromptCard()`**

Currently the skip reason is only in the tooltip. Make it visible as a small label next to skipped chips:

```js
// In enrichmentChips rendering, for skipped entries, show the reason:
`<span class="enrichment-chip skipped" title="${escapeHtml(e.skip_reason || 'skipped')}">
  ${escapeHtml(e.label)}
  <span class="enrichment-skip-label">${escapeHtml(e.skip_reason || '')}</span>
</span>`
```

Add CSS:
```css
.enrichment-skip-label { font-size: 0.7em; color: #666; display: block; text-decoration: none; }
```

---

---

## Issue 4: SuperPrompt Generation Fails (All Backends Exhausted)

### Symptoms

Clicking "Generate All" in the SuperPrompt tab shows an error notification. The generation fails for every paragraph.

### Root Cause (Diagnosed)

The error from ModelRouter:
```
All backends failed. Errors:
  anthropic[0]: Anthropic API error 529: overloaded
  anthropic[1]: 529 overloaded
  anthropic[2]: 529 overloaded
  vllm[0]: 400 This model's maximum context length is 16384 tokens.
           However, your request has 22733 input tokens.
```

**Two cascading failures:**

1. **Anthropic 529 (overloaded)**: The API returns HTTP 529 when rate-limited or under heavy load. ModelRouter retries 3 times (`maxRetries: 2` = 3 total attempts), but the backoff is far too aggressive for 529:
   - Attempt 0 → fail → wait `Math.pow(2, 0) * 500` = **500ms**
   - Attempt 1 → fail → wait `Math.pow(2, 1) * 500` = **1000ms**
   - Attempt 2 → fail → exhausted

   529 overloaded errors typically need 10-60 seconds of backoff. 0.5-1s is essentially a no-op.

2. **vLLM fallback impossible**: SuperPrompts are ~22,000 tokens. The vLLM backend (Qwen2.5-Coder-32B) has a 16,384 token context limit. The fallback always fails with 400.

### Plan

#### A. Longer backoff for 529 errors

**File: `src/god-agent/core/composition/model-router.ts`**

Add 529-specific backoff logic in the retry loop (around line 144):

```ts
// Exponential backoff between retries
if (attempt < this.config.maxRetries) {
  // Check if the error is a 529 overloaded — needs longer backoff
  const is529 = lastError?.message?.includes('529');
  const baseDelay = is529 ? 15000 : 500; // 15s base for 529, 0.5s for others
  const delay = Math.pow(2, attempt) * baseDelay;
  await this.sleep(delay);
}
```

This gives 529 errors: 15s → 30s → (fail) instead of 0.5s → 1s → (fail).

#### B. Respect `Retry-After` header

**File: `model-router.ts`, `callAnthropic()` method**

When the Anthropic API returns 529, it may include a `Retry-After` header. Parse it and use it as the backoff delay:

```ts
if (!resp.ok) {
  const retryAfter = resp.headers.get('retry-after');
  const errMsg = `Anthropic API error ${resp.status}: ${(await resp.text()).slice(0, 200)}`;
  const err = new Error(errMsg);
  if (retryAfter) {
    (err as any).retryAfterMs = parseInt(retryAfter, 10) * 1000;
  }
  throw err;
}
```

Then in the retry loop:
```ts
const retryMs = (lastError as any)?.retryAfterMs;
const delay = retryMs || Math.pow(2, attempt) * baseDelay;
await this.sleep(delay);
```

#### C. Skip vLLM fallback for large prompts

**File: `model-router.ts`, `resolveBackendOrder()` or the main `call()` loop**

Before attempting the vLLM backend, estimate the prompt size. If it exceeds vLLM's context limit (16,384 tokens ≈ ~50,000 characters as a conservative heuristic), skip vLLM entirely:

```ts
// In the backend attempt loop, before calling vLLM:
if (backend === 'vllm') {
  const promptLength = (systemPrompt?.length || 0) + (prompt?.length || 0);
  // Rough heuristic: 1 token ≈ 3 chars. vLLM limit = 16384 tokens ≈ 49152 chars
  if (promptLength > 45000) {
    errors.push(`vllm: skipped (prompt ~${Math.round(promptLength / 3)} tokens exceeds 16384 limit)`);
    continue;
  }
}
```

This avoids wasting a round-trip to vLLM that will always fail for superprompts.

#### D. Increase `maxRetries` for generation calls

**File: `src/god-agent/core/composition/llm-generation-provider.ts`**

In `generateParagraph()` (line 76), the ModelRouter call doesn't specify `maxRetries`, so it uses the default (2 = 3 attempts). For generation calls (which are expensive to set up), increase to 4-5 attempts:

```ts
const result = await this.router.call({
  prompt: fullPrompt,
  systemPrompt: systemPrompt,
  maxTokens: 2000,
  temperature: 0.7,
  costTier: 'high',
  maxRetries: 4, // 5 total attempts for generation
});
```

With the 529-specific backoff (15s base), this gives: 15s → 30s → 60s → 120s before giving up — much more reasonable for temporary overload.

---

## Implementation Order

1. **Issue 4** (critical) — Fix ModelRouter retry/backoff for 529 errors and vLLM overflow. Without this, the entire generation path is broken during Anthropic overload periods.
2. **Issue 3** (diagnosis + fix) — Investigate bind-and-stress route and retrieve route data flow. Fix binding quality fallback and skip reason visibility. Most impact on existing workflow correctness.
3. **Issue 2** (clickable citations) — Pure frontend enhancement, no API changes. Medium complexity.
4. **Issue 1** (manual quote input) — Requires new API endpoint + frontend form. Largest scope.

## Files Modified

| File | Changes |
|------|---------|
| `icp-panel.js` | Issue 1: Add quote form + functions. Issue 2: Clickable citation badges, atom quote popovers, binding quote popovers. Issue 3: Show skip reasons. |
| `styles.css` | Issue 1: Form styles. Issue 2: Citation/quote detail styles. Issue 3: Skip label style. |
| `icp-api-routes.ts` | Issue 1: New `POST /add-quote/:sessionId` endpoint. Issue 3: Binding quality fallback in superprompt assembly. |
| `model-router.ts` | Issue 4: 529-specific backoff (15s base), `Retry-After` header support, skip vLLM for large prompts. |
| `llm-generation-provider.ts` | Issue 4: Increase `maxRetries` to 4 for generation calls. |
