# ICP Dashboard Round 3 — Fix Plan

**Date**: 2026-02-17
**Issues**: 7 (user-reported)
**Files affected**: `icp-panel.js`, `icp-api-routes.ts`, `styles.css`, `icp-types.ts`, `run-manifest.ts`

---

## Issue 1: Citation Enforcement Window Always Empty

**Symptom**: Quality gauntlet tab shows "No corpus constraint available for citation enforcement."

**Root cause (diagnosed 2026-02-17)**: A three-link failure chain prevents citation enforcement from ever running:

1. **`getCleanText` is never wired up** — Neither the dashboard factory (`icp-provider-factory.ts`) nor `icp-api-routes.ts` provides a `getCleanText` dependency to `ICPDependencies`. Without it, the auto-verifier falls back to `cleanText = spans.map(s => s.text).join(' ')` (line 1112 of `icp-orchestrator.ts`) — a degraded self-referential check.

2. **All 35 spans get `flagged` status** — The auto-verifier's Stage B multi-signal confidence score (threshold: 0.85 for `auto_verified`) consistently falls below threshold with the degraded fallback cleanText. Every span ends up `flagged` (confidence between 0.50 and 0.85).

3. **`getChunksFromSpans()` filters out all flagged spans** — Line 976 of `icp-orchestrator.ts` only accepts `auto_verified`, `human_verified`, or `human_corrected`. With everything `flagged`, it returns `[]` → `corpusConstraint` is never built → `CitationEnforcer` is never called → `citation_enforcement` is `undefined`.

**Fix (two-part: fix verification + optional relaxed mode)**:

### Part A: Wire up `getCleanText` (fixes verification at the source)

1. **In `icp-provider-factory.ts`**, implement `getCleanText(docId)`:
   - Query ChromaDB for chunks matching `doc_id`, ordered by page number
   - Concatenate chunk texts to reconstruct a clean document text
   - Cache results per `doc_id` to avoid repeated queries
   ```typescript
   async getCleanText(docId: string): Promise<string> {
     const chunks = await chromaCollection.get({
       where: { doc_id: { $eq: docId } },
       include: ['documents', 'metadatas'],
     });
     // Sort by page, concatenate
     return chunks.documents
       .map((doc, i) => ({ text: doc, page: chunks.metadatas[i]?.page ?? 0 }))
       .sort((a, b) => a.page - b.page)
       .map(c => c.text)
       .join('\n\n');
   }
   ```

2. **In `icp-api-routes.ts` `getFactoryResult()`**, pass `getCleanText` into the factory's `ICPDependencies`:
   ```typescript
   deps.getCleanText = async (docId) => factory.getCleanText(docId);
   ```

3. **In step-by-step routes** (`generate-prose`, `superprompt-generate`), after generation completes, build corpus constraint from verified spans and run `CitationEnforcer` — same logic as `icp-orchestrator.ts` lines 506-537.

### Part B: "Relax Verification" toggle on Quality Gauntlet tab (disabled by default)

1. **In `icp-panel.js`**, add a checkbox toggle to the Quality tab:
   ```html
   <label class="gauntlet-option">
     <input type="checkbox" id="icp-relax-verification" />
     Include flagged quotes in citation enforcement (relaxed mode)
   </label>
   ```
   - **Default: unchecked** (strict mode — only verified quotes feed into citation enforcement)
   - When checked, passes `relaxVerification: true` in the gauntlet/generate POST body

2. **In `icp-api-routes.ts`**, accept `relaxVerification` parameter:
   - When `true`, modify `getChunksFromSpans()` to also include `flagged` spans:
     ```typescript
     const allowedStatuses = relaxVerification
       ? ['auto_verified', 'human_verified', 'human_corrected', 'flagged']
       : ['auto_verified', 'human_verified', 'human_corrected'];
     ```
   - This allows citation enforcement to run even when auto-verification is strict

3. **In `icp-orchestrator.ts`**, add `relaxVerification?: boolean` to `ICPOrchestratorConfig` and thread it through to `getChunksFromSpans()`.

### Part C: Also run citation enforcement in step-by-step routes

In `icp-api-routes.ts`, after the gauntlet completes in the `generate-prose` and `superprompt-generate` routes:
- Build corpus constraint from session quote span metadata (`source_anchor` field → author, title)
- Run `CitationEnforcer` with that constraint
- Store result in `session.quality_gates.citation_enforcement`

**Files**: `icp-provider-factory.ts` (new `getCleanText`), `icp-orchestrator.ts` (relaxVerification config, `getChunksFromSpans` filter), `icp-api-routes.ts` (wire `getCleanText`, accept `relaxVerification`, run enforcer in step-by-step routes), `icp-panel.js` (checkbox toggle), `styles.css` (toggle styles)

---

## Issue 2: Quality Gauntlet Progress Indicator

**Symptom**: No visual feedback during gauntlet execution — just static "Running gauntlet..." text.

**Root cause**: The gauntlet is a single blocking `await icpPost(...)` call. No SSE, WebSocket, or polling exists.

**Fix**: Add a client-side stopwatch timer (simplest approach — no backend changes needed):
- When "Run Gauntlet" is clicked, start a `setInterval(1000)` timer that updates a visible counter showing elapsed time: `"Running gauntlet... (42s)"`
- Show the current stage count if available (the gauntlet runs 9 stages sequentially — display `"Stage 3/9..."` by polling a lightweight status endpoint).
- **Minimal approach**: Just a stopwatch (`00:00` incrementing every second) next to the button, cleared when the response arrives.
- **Enhanced approach**: Add a `GET /api/icp/gauntlet-progress/:sessionId` endpoint that returns `{ running: boolean, currentStage: number, totalStages: number, elapsed: number }` stored in a session-level progress tracker. Poll every 2 seconds.

**Recommended**: Start with the stopwatch (pure frontend, zero backend changes), add stage progress polling if needed later.

**Files**: `icp-panel.js` (icpRunGauntlet function ~line 569), `styles.css`

---

## Issue 3: Claim Verification & Quotation Fidelity Review UI

**Symptom**: Failed claims and quotations are only shown as a score bar. No way to view, fix, verify, or reject individual items.

**Root cause**: The gauntlet returns rich `allIssues` data with per-claim verdicts and per-quote similarity scores, but:
1. `stage_results` only stores `{ name, score, passed }` — the detail is discarded
2. No interactive review UI exists
3. No API endpoints for claim/quote modification

**Fix (3 parts)**:

### 3a. Store detailed stage results
In `icp-api-routes.ts` gauntlet serialization (~line 2099), preserve the full `allIssues` array and per-stage detail:
```typescript
stage_results: gauntletResult.stageResults?.map((s: any) => ({
  name: s.stageName ?? s.name ?? 'unknown',
  score: s.score ?? 0,
  passed: s.passed ?? false,
  issues: s.issues ?? [],        // ADD: per-stage issues
  details: s.details ?? null,    // ADD: stage-specific detail object
})) ?? [],
allIssues: gauntletResult.allIssues ?? [],  // ADD: full issues array
```

### 3b. Claim verification review UI
Add an expandable detail section under the claim-verification stage bar:
- List each claim with its verdict (pass/fail/unverifiable)
- For failed claims: show the claim text, the expected corpus evidence, and the mismatch reason
- Action buttons: **Verify** (manually approve), **Fix** (edit claim text inline), **Reject** (remove claim from session)
- API: `PATCH /api/icp/claim/:sessionId/:claimId` with body `{ action: 'verify' | 'reject', fixedText?: string }`

### 3c. Quotation fidelity review UI
Add an expandable detail section under the quotation-fidelity stage bar:
- List each quotation with its similarity score and the corpus source text side-by-side
- Highlight differences (diff view)
- Action buttons: **Approve** (mark as acceptable despite low score), **Fix** (edit quote to match corpus), **Reject** (remove quote)
- API: `PATCH /api/icp/quote-fidelity/:sessionId/:quoteId` with body `{ action: 'approve' | 'fix' | 'reject', fixedText?: string }`

**Files**: `icp-panel.js` (quality panel renderer ~line 2672), `icp-api-routes.ts` (new endpoints + gauntlet serialization), `styles.css`, `icp-types.ts` (add to ICPEventAction union)

---

## Issue 4: Bibliography Shows Raw Doc IDs Instead of MLA Citations

**Symptom**: Export tab bibliography displays hex hashes like `5fb2739afb848857`.

**Root cause**: `RunManifestBuilder.buildBibliography()` in `run-manifest.ts:261` simply joins raw `doc_id` values:
```typescript
const docs = new Set(session.quote_spans.map(s => s.doc_id));
return [...docs].sort().join('\n');
```

The full pipeline path (`orchestrator.run()`) overrides this with formatted entries, but step-by-step routes don't.

**Fix**:
1. **Fix `buildBibliography()`** in `run-manifest.ts` to generate proper MLA citations from quote span metadata:
   ```typescript
   private buildBibliography(session: ICPSession): string {
     const entries = new Map<string, string>();
     for (const span of session.quote_spans) {
       if (!entries.has(span.doc_id)) {
         const author = span.source_anchor?.split(',')[0] ?? span.doc_id;
         // Build MLA: Author. *Title*. Year.
         entries.set(span.doc_id, formatMLACitation(span));
       }
     }
     return '## Works Cited\n\n' + [...entries.values()].sort().join('\n\n');
   }
   ```
2. **Add `formatMLACitation()` helper** that uses `author_raw` and `title_raw` from quote span metadata (or falls back to `source_anchor`). Cross-reference with `scripts/ingest/manifest.jsonl` for complete bibliographic data.
3. **Render as formatted HTML** in `icp-panel.js` instead of `escapeHtml()` — parse the markdown `*italics*` for titles.

**Files**: `run-manifest.ts` (~line 261), `icp-panel.js` (export panel bibliography section ~line 3091), `icp-api-routes.ts` (ensure metadata flows through)

---

## Issue 5: Endnotes Missing Page Numbers, Author, Title

**Symptom**: Endnotes show minimal info or raw doc_id hashes.

**Root cause**: Two bugs:

1. **`buildEndnotes()` in `run-manifest.ts:247`** produces `"1. {doc_id}, p. {page}"` — no author, no title, uses raw hash when `source_anchor` is null.

2. **Endnote count regex is wrong** (`icp-api-routes.ts` and `icp-orchestrator.ts`):
   ```typescript
   total: (endnotesSection.match(/^\d+\./gm) ?? []).length
   ```
   But `EndnoteGenerator` produces `**[1]** Supporting quotations...` format — regex never matches.

**Fix**:
1. **Fix `buildEndnotes()`** to include author, title, and page number for each quote:
   ```typescript
   notes.push(`**[${idx}]** ${author}, *${title}*, p. ${page}. "${spanText}"`);
   ```
   Pull author/title from `span.metadata?.author_raw` and `span.metadata?.title_raw`, or from the corpus manifest.

2. **Fix endnote count regex** in both `icp-api-routes.ts` and `icp-orchestrator.ts`:
   ```typescript
   total: (endnotesSection.match(/\*\*\[\d+\]\*\*/gm) ?? []).length
   ```
   Or use a more robust count: `endnotesSection.split('\n').filter(l => /^\*?\*?\[?\d+/.test(l)).length`

3. **Render endnotes as formatted HTML** in `icp-panel.js` — convert markdown bold/italics to HTML tags instead of escaping them.

**Files**: `run-manifest.ts` (~line 247), `icp-api-routes.ts` (endnote count ~line 1882), `icp-orchestrator.ts` (~line 651), `icp-panel.js` (endnotes rendering in export panel)

---

## Issue 6: LaTeX Export for Overleaf

**Symptom**: No LaTeX download option exists. Only JSON download and "Copy Prose" button.

**Fix**: Add a "Download as LaTeX" button that converts the export package to a `.tex` file:

### Frontend (`icp-panel.js`)
Add button next to existing download buttons:
```html
<button onclick="icpDownloadLatex()" class="btn btn-primary">Download as LaTeX</button>
```

### LaTeX conversion function (`icp-panel.js`)
```javascript
function icpDownloadLatex() {
  const pkg = window._lastExport;
  if (!pkg) return;

  const prose = pkg.final_prose || '';
  const endnotes = pkg.endnotes || '';
  const bibliography = pkg.bibliography || '';

  // Convert markdown to LaTeX
  let latexProse = prose
    .replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}')     // bold
    .replace(/\*(.*?)\*/g, '\\textit{$1}')           // italic
    .replace(/``(.*?)"/g, '``$1\'\'')                 // smart quotes
    .replace(/\n\n/g, '\n\n\\par\n');                 // paragraph breaks

  // Convert inline citations: (Author, Year, p. XX) → \footnote{...}
  // or keep as parenthetical if preferred

  const tex = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{setspace}
\\doublespacing
\\usepackage{times}
\\usepackage{csquotes}

\\title{${escapeLatex(pkg.title || 'ICP Generated Prose')}}
\\author{}
\\date{}

\\begin{document}
\\maketitle

${latexProse}

${endnotes ? `\\section*{Endnotes}\n${convertEndnotesToLatex(endnotes)}` : ''}

${bibliography ? `\\section*{Works Cited}\n${convertBibToLatex(bibliography)}` : ''}

\\end{document}`;

  downloadFile(tex, 'icp-export.tex', 'application/x-tex');
}
```

### Helper functions
- `escapeLatex(text)`: Escape `#`, `$`, `%`, `&`, `_`, `{`, `}`, `~`, `^`
- `convertEndnotesToLatex(md)`: Convert markdown endnotes to LaTeX `\begin{enumerate}...\end{enumerate}`
- `convertBibToLatex(md)`: Convert "Works Cited" markdown to LaTeX hanging indent bibliography (`\begin{hangparas}`)

**Files**: `icp-panel.js` (new functions + button in export panel ~line 3095)

---

## Issue 7: Claim Map Tab

**Symptom**: No Claim Map tab exists in the ICP dashboard.

**Root cause**: The tab and renderer are completely absent. The data IS available (`session.claim_map`) but only used for counts in the binding panel.

**Fix**: Add a new "Claim Map" tab after the Export tab.

### 7a. Add nav button (`icp-panel.js` ~line 80)
```html
<button class="icp-nav-btn" data-panel="claimmap">Claim Map</button>
```

### 7b. Add renderer to map (~line 927)
```javascript
claimmap: renderClaimMapPanel,
```

### 7c. Implement `renderClaimMapPanel(container, session)`
Mirror the main dashboard's Claim Map tab functionality:

1. **Claims list**: Show each claim from `session.claim_map.claims` with:
   - Claim text
   - Warrant
   - Backing/qualification/rebuttal (expandable)
   - Linked atoms (click to navigate)
   - Status indicator (verified/unverified)

2. **Dependency graph**: Render `claim_map.edges` as a visual DAG:
   - Option A: Use the existing Mermaid diagram from `RunManifestBuilder.buildClaimMapMermaid()`
   - Option B: Render as an interactive SVG with click-to-expand nodes

3. **Claim statistics**: Total claims, verified %, coverage (atoms with claims / total atoms)

4. **Interactive features** (matching main dashboard):
   - Click claim → expand to show supporting atoms and quotes
   - Edit claim text inline
   - Add/remove claim-atom links
   - Filter by facet

### 7d. Reference implementation
Check the main god agent dashboard for the existing Claim Map tab to replicate its features:
- Look in `src/god-agent/observability/dashboard/` for claim map rendering code
- The main dashboard likely uses `session.claim_map.claims` and `session.claim_map.edges`

**Files**: `icp-panel.js` (new tab + renderer), `styles.css` (claim map styles), `icp-api-routes.ts` (ensure claim_map is serialized — already confirmed at line 186)

---

## Implementation Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P1 | Issue 1: Citation enforcement (wire getCleanText + relaxed toggle) | High | Entire citation pipeline blocked without it |
| P1 | Issue 4: Bibliography MLA citations | Medium | Export unusable without it |
| P1 | Issue 5: Endnotes author/title/page | Medium | Export incomplete without it |
| P2 | Issue 3: Claim/quote review UI | High | Critical for quality iteration |
| P2 | Issue 6: LaTeX export | Medium | Essential for Overleaf workflow |
| P2 | Issue 7: Claim Map tab | High | Feature parity with main dashboard |
| P3 | Issue 2: Stopwatch/progress | Low | UX improvement |

---

## Files Modified Summary

| File | Issues | Changes |
|------|--------|---------|
| `icp-panel.js` | 1-7 | All seven issues touch this file |
| `icp-api-routes.ts` | 1, 3, 5 | Wire getCleanText, relaxVerification param, citation enforcement in step-by-step routes, gauntlet detail storage, endnote count fix, new PATCH endpoints |
| `icp-provider-factory.ts` | 1 | New `getCleanText(docId)` — query ChromaDB for doc chunks |
| `icp-orchestrator.ts` | 1, 5 | `relaxVerification` config, `getChunksFromSpans` filter update, endnote count regex fix |
| `styles.css` | 1, 2, 3, 7 | Relax-verification toggle, stopwatch styles, review UI styles, claim map styles |
| `run-manifest.ts` | 4, 5 | Bibliography and endnotes generation fixes |
| `icp-types.ts` | 1, 3 | `relaxVerification` in config type, new event actions for claim/quote review |
