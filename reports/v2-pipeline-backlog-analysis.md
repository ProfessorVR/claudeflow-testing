# V2 Pipeline Backlog Analysis Report

**Date**: 2026-04-07
**Scope**: 4 issues discovered during god-write v2 pipeline integration testing
**Methodology**: Forensic code tracing through writeV2() and collaborator modules

---

## Executive Summary

Four issues were identified during the first successful corpus-grounded v2 pipeline run. One is a trivial serialization omission (Issue 3). One is an intentional design decision that should become configurable (Issue 2). Two are architectural mismatches between the LLM prompt instructions and the parsing/extraction logic (Issues 1 and 4).

**Priority order**: Issue 3 (trivial fix) → Issue 1 (word count) → Issue 4 (endnote author) → Issue 2 (revisions)

---

## Issue 1: Word Count Overshoot (4,562 words vs 500-1000 requested)

### Root Cause

`src/god-agent/universal/stages/retrieval-stage.ts`, lines 468-470:

```typescript
const wordTarget = length === 'comprehensive' || (!length && options.whitelistMode) ? '3,000-3,500' :
              length === 'long' ? '2,000-2,500' :
              length === 'medium' ? '1,500-2,000' : '800-1,000';
```

And `write-pipeline-orchestrator.ts:3209`:
```typescript
const length = options.length ?? 'medium';
```

### Why It Happens

1. The CLI passed no `--length` flag → defaults to `'medium'`
2. `'medium'` maps to word target `'1,500-2,000'`
3. The gold standard prompt builder (`gold-standard-prompt-builder.ts`) embeds this target **5+ times**: at lines 377, 380, 536, 646 — e.g., "a scholarly dissertation section of 1,500-2,000 words", "REMEMBER: 1,500-2,000 words main text"
4. The user's topic string says "500-1000 words" but the prompt builder at lines 446-453 actively strips word count references via regex — though this particular format (`500-1000`) may survive because the regex expects comma-separated thousands
5. The LLM sees "1,500-2,000 words" repeated 5× in system instructions vs "500-1000 words" once in the topic → follows the louder instruction
6. The 4,562 total includes a Validation Appendix (claim map, quotation ledger, citation ledger) which inflates the raw word count well beyond the body text target

### Recommended Fix

**Option A — Parse word target from topic string** (in `writeV2()`, after line 3284):

```typescript
const topicWordMatch = topic.match(/\b(\d{3,5})\s*[-–]\s*(\d{3,5})\s*words?\b/i)
  || topic.match(/\b(\d{3,5})\s*words?\b/i);
const effectiveWordTarget = topicWordMatch
  ? (topicWordMatch[2] ? `${topicWordMatch[1]}-${topicWordMatch[2]}` : topicWordMatch[1])
  : wordTarget;
```

Then pass `effectiveWordTarget` instead of `wordTarget` to `buildGoldStandardPrompt()`.

**Option B — Add `--word-target` CLI flag** that overrides the `length`-derived default.

Both options are complementary and should be implemented together.

### Risk Assessment

**LOW**. The word target is a prompt instruction only — changing it breaks no pipeline logic. The separate `bodyWordCount` vs `wordCount` reporting already handles appendix inflation.

---

## Issue 2: Quality Gauntlet Not Triggering Revisions

### Root Cause

`src/god-agent/universal/write-pipeline-orchestrator.ts`, line 3441:

```typescript
qualityValidation = await this.deps.qualityIntegration.validateAndRevise(content, {
  topic, style, format, trajectoryId, enabled: true, maxRevisions: 0,  // ← hardcoded
  corpusChunks: corpusChunks.length > 0 ? corpusChunks : undefined,
  knownAuthors: corpusConstraint?.sources?.map((s: any) => s.author).filter(Boolean) ?? [],
});
```

The comment at line 3436 confirms this is intentional: `// Quality gauntlet (scoring only)`.

### Why It Happens

This is a **deliberate design decision**, not a bug. The v2 pipeline uses a multi-step strategy (v1 draft → investigate → v2 draft with prevention plan) instead of post-hoc revision. The gauntlet scores inform diagnostics but are not used to trigger rewrites. Each revision iteration would re-call the LLM, adding latency and cost.

### Recommended Fix

Make `maxRevisions` configurable rather than hardcoded. Add to `WriteOptions`:

```typescript
maxGauntletRevisions?: number;
```

Then at line 3441:
```typescript
maxRevisions: options.maxGauntletRevisions ?? 0,
```

Expose via CLI flag `--max-revisions <N>`. Default remains 0 (current behavior preserved).

### Risk Assessment

**MEDIUM**. Enabling revisions adds LLM calls (latency, cost, rate limit risk). The revision loop may conflict with the multi-step v1-investigate-v2 strategy, potentially undoing improvements the prevention plan introduced. Test with `maxRevisions: 1` first.

---

## Issue 3: Endnotes Not Serialized in JSON Output

### Root Cause

`src/god-agent/universal/write-pipeline-orchestrator.ts`, lines 3621-3651 (the return statement of `writeV2()`).

The variable `endnotesMetadataV2` is populated at lines 3574-3581:

```typescript
endnotesMetadataV2 = {
  generated: true,
  count: endnoteResult.stats.totalEndnotes,
  supportingQuotationsCount: endnoteResult.stats.totalSupportingQuotations,
};
```

But the return object at lines 3621-3651 has **NO `endnotes` property**. Compare to the legacy path at line 3098:

```typescript
endnotes: endnotesMetadata.generated ? endnotesMetadata : undefined,
```

The legacy path correctly maps the endnotes metadata to the `WriteResult` interface. The v2 path simply omitted this field.

### Why It Happens

Pure omission during the v2 extraction. The endnotes ARE in the generated text (content includes endnote markers and the endnotes section), and the metadata IS computed — it's just never assigned to the return object.

### Recommended Fix

In the return object starting at line 3621, add after `multiStepDiagnostics`:

```typescript
multiStepDiagnostics: multiStepDiagnosticsResult,
endnotes: endnotesMetadataV2.generated ? endnotesMetadataV2 : undefined,  // ← add this
pipelineHealth,
```

Also expand `endnotesMetadataV2` to include `endnotesSection` for parity with the legacy path.

### Risk Assessment

**VERY LOW**. Pure serialization fix — the data exists, it's just not being returned. One line.

---

## Issue 4: Endnote "Unknown" Primary Source Resolution

### Root Cause

`src/god-agent/cli/quality/endnote-generator.ts`, line 613:

```typescript
primaryCitation: {
  author: citation.author || 'Unknown',
```

This triggers when `citation.author` is `undefined`. The 6 regex patterns for citation extraction reveal why:

| Pattern | Line | Captures Author? | Matches Format |
|---------|------|-------------------|----------------|
| 1 | 388 | YES | `(Author, *Title*, p. X)` — parenthetical |
| 2 | 392 | YES | `Author (*Title* p. X)` — inline |
| 3 | 395 | YES | `Author, *Title* (year)` — bibliographic |
| 4 | 398 | NO | `"quote" (*Title* p. X)` — quotation with title |
| 5 | 401 | NO | `"quote" (citation text)` — quotation with ref |
| 6 | 404 | NO | `*Title* page-ref` — bare title reference |

### Why It Happens

The style profile (`dalton-academic-mkn82c3v`) specifies **author-prominent citations** (99.2%): verbs like "observes", "argues", "suggests", "states". The gold standard prompt reinforces this pattern.

When the LLM writes signal-phrase citations like:

> As Heidegger argues in *Being and Time*, "Being-true means Being-uncovering" (p. 262)

This produces two separate regex matches:
- `"Being-true means Being-uncovering" (p. 262)` matches Pattern 5 → `author: undefined`
- `*Being and Time*` with adjacent text may match Pattern 6 → `author: undefined`

The author name "Heidegger" is in the signal-phrase text BEFORE the quotation — outside any capture group.

**Pattern 1 is the ONLY pattern that captures `author`**, and it only matches parenthetical citations like `(Heidegger, *Being and Time*, p. 262)`. Since the style profile actively discourages parenthetical citations in favor of signal-phrase ones, the majority of citations hit patterns 4/5/6 which have no author capture.

**The irony**: the citation format the prompt instructs and the style profile encourages (signal-phrase, author-prominent) is precisely the format the endnote generator cannot parse for author attribution.

### Recommended Fix

Add a signal-phrase citation pattern:

```typescript
// Pattern 7: Signal-phrase: As Author verb in *Title*, "quote" (p. X)
const signalPattern = /(?:As|For|According to|Following)\s+([A-Z][a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:observes|argues|suggests|states|notes|contends|claims|maintains|writes|explains|demonstrates|emphasizes)\s+(?:in\s+)?\*([^*]+)\*[,.]?\s*"([^"]+)"\s*\(([^)]+)\)/g;
```

Additionally, add a post-extraction lookback for patterns 4/5/6 that lack authors:

```typescript
for (const citation of citations) {
  if (!citation.author && citation.title) {
    const lookback = content.substring(
      Math.max(0, citation.position - 200), citation.position
    );
    const authorMatch = lookback.match(
      /(?:As|For)\s+([A-Z][a-zA-Z]+)\s+(?:observes|argues|suggests|states|notes|writes|explains)/
    );
    if (authorMatch) citation.author = authorMatch[1];
  }
}
```

### Risk Assessment

**MEDIUM**. Modifying citation extraction regexes affects all endnote generation. The signal-phrase pattern needs careful testing against actual generated text to avoid false positives. The lookback heuristic is inherently fuzzy.

---

## Implementation Plan

### Batch 1: Trivial Fix (Issue 3)

**File**: `write-pipeline-orchestrator.ts`
**Change**: Add `endnotes` field to `writeV2()` return object
**Effort**: 1 line
**Risk**: Very low

### Batch 2: Word Count (Issue 1)

**Files**: `write-pipeline-orchestrator.ts`, `cli.ts`
**Change**: Parse word target from topic string + add `--word-target` CLI flag
**Effort**: ~15 lines
**Risk**: Low

### Batch 3: Endnote Author Resolution (Issue 4)

**File**: `endnote-generator.ts`
**Change**: Add signal-phrase regex pattern + post-extraction lookback
**Effort**: ~30 lines
**Risk**: Medium — needs testing against saved outputs

### Batch 4: Configurable Revisions (Issue 2)

**Files**: `write-pipeline-orchestrator.ts`, `cli.ts`, `stage-types.ts`
**Change**: Make `maxRevisions` configurable, add CLI flag
**Effort**: ~10 lines
**Risk**: Medium — revision loop may conflict with multi-step strategy

---

## Verification Commands

```bash
# After Batch 1 (endnote serialization):
# Re-run god-write and check JSON output has endnotes field
npx tsx src/god-agent/universal/cli.ts write "test" --execute --json --use-corpus --enable-endnotes 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'endnotes: {d.get(\"endnotes\")}')"

# After Batch 2 (word count):
# Run with explicit word target in topic
npx tsx src/god-agent/universal/cli.ts write "write 500 words on Being" --execute --json --use-corpus 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'wordCount: {d[\"wordCount\"]} (target: 500)')"

# After Batch 3 (endnote author):
# Check endnote primary sources are resolved
# (requires visual inspection of endnote table in output)

# After Batch 4 (revisions):
npx tsx src/god-agent/universal/cli.ts write "test" --execute --json --use-corpus --max-revisions 1 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); r=d['result']; print(f'score: {r[\"qualityScore\"]:.3f}, revisions: {r[\"revisionIterations\"]}')"
```
