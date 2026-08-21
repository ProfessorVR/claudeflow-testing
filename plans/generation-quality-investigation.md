# Generation Quality Investigation: Why V2/V3 Are Worse Than the Original

**Date**: 2026-03-18
**Context**: After executing the KU system limitations plan, god-write outputs on the same "dual trace antichesis" topic are significantly worse than the original `docs/dual-trace-antichesis.md`.

---

## Findings Summary

| Issue | Root Cause | Severity | Fix Complexity |
|-------|-----------|----------|---------------|
| Only 4 sections (vs 8 original) | Topic decomposition falls to Pattern 3 cross-product, which produces `Aristotle × {motion, affect, ontology, time}` = 4 queries | **HIGH** | Medium |
| ~4,200 words (vs ~5,700 original) | Direct consequence of 4 sections × ~1,000 words each | **HIGH** | Solved by fixing section count |
| `(Hawhee 2011)` citation artifacts | No post-processing stage strips parenthetical citations from valid corpus authors | **MEDIUM** | Low |
| Missing T-Stage chain, dioxis/phyge concepts | Not surfaced because Pattern 3 only extracts author×concept pairs, not domain-specific conceptual categories | **HIGH** | Medium |

---

## Issue 1: Section Count — 4 vs 8

### How Section Count Is Determined

`extractRetrievalQueries()` at `write-pipeline-orchestrator.ts:156-229` uses three patterns in priority order:

| Pattern | Trigger | What It Does |
|---------|---------|-------------|
| **1. Numbered sections** | Lines matching `^\d+\.\s+` | Extracts "1. Title" lines as sections |
| **2. Markdown headings** | Lines matching `^#{1,3}\s+` | Extracts "## Title" lines as sections |
| **3. Author×Concept cross-product** | Fallback when 1 & 2 find nothing | Matches known authors and concepts, returns up to 6 cross-product pairs |

### What Happens With Our Topic

**Input**: `"The Dual Trace: Resonant Motion, Resonant Affect, and the Mechanism of Antichesis in Aristotle's Ontology of Motion and Time"`

- **Pattern 1**: No numbered lines → skip
- **Pattern 2**: No markdown headings → skip
- **Pattern 3**:
  - Authors found: `["Aristotle"]` (from `domainConfig.primaryAuthors`)
  - Concepts found: `["motion", "affect", "ontolog", "time"]` (from `domainConfig.keyConcepts`)
  - Cross-product: `["Aristotle motion", "Aristotle affect", "Aristotle ontolog", "Aristotle time"]`
  - Returns 4 queries → **4 sections**

### What the Original Had

The original was generated with a prompt that included **8 explicit section titles** (likely passed as a multi-line topic string or via `--chapter-outline`):

```
1. Kinēsis as Ontological Ground
2. The T-Stage Chain and Taking-As
3. Dioxis and Phygē: The Pursuit/Avoidance Structure
4. Resonant Motion: The Kinetic Trace
5. Resonant Affect: The Affective Trace
6. Antichesis: The Unitary Mechanism of Internal Resonance
7. The Dual Trace and Temporal Navigation
8. Conclusion: Completing the Human Experience
```

Pattern 1 would have matched all 8 numbered lines → 8 sections.

### Why This Matters

The section count directly controls:
- **Prompt structure**: `buildGoldStandardPrompt()` (line 807-828) generates per-section word targets
- **Word distribution**: 4 sections → ~933 words/section; 8 sections → ~467 words/section
- **Conceptual coverage**: 4 generic author×concept queries miss domain-specific constructs like "T-Stage chain", "dioxis/phyge", "antichesis"

### Fix Options

**Option A: Pass section outline explicitly**

Run the command with numbered sections in the topic string:
```bash
npx tsx src/god-agent/universal/cli.ts write "The Dual Trace: Resonant Motion, Resonant Affect, and the Mechanism of Antichesis
1. Kinēsis as Ontological Ground
2. The T-Stage Chain and Taking-As
3. Dioxis and Phygē: The Pursuit/Avoidance Structure
4. Resonant Motion: The Kinetic Trace
5. Resonant Affect: The Affective Trace
6. Antichesis: The Unitary Mechanism of Internal Resonance
7. The Dual Trace and Temporal Navigation
8. Conclusion: Completing the Human Experience" --execute --whitelist --multi-step --enable-endnotes
```

This is the simplest fix and requires zero code changes. Pattern 1 will match all 8 sections.

**Option B: Improve Pattern 3 with reasoning edge concepts**

Extend the fallback to use the knowledge graph:
1. Load reasoning edges relevant to the topic (already done in Step 2b)
2. Extract unique source/target concept names from the top-30 edges
3. Use these as section candidates instead of the generic author×concept cross-product
4. This would produce sections like "kinesis and chronos", "phantasia and aisthesis" — much closer to the original

**Option C: Add LLM-assisted decomposition**

Before generation, send the topic to Claude with a decomposition prompt:
```
Given this essay topic, produce 6-8 section titles that comprehensively cover the subject:
Topic: "The Dual Trace: Resonant Motion, Resonant Affect, and the Mechanism of Antichesis..."
```

This is the highest quality option but adds an API call and ~15s latency.

---

## Issue 2: Parenthetical Citation Artifacts — `(Hawhee 2011)`

### The Post-Processing Pipeline

Six stages run after generation, in this order:

| # | Stage | File | Catches `(Hawhee 2011)`? |
|---|-------|------|-------------------------|
| 1 | ProseSanitizer | prose-sanitizer.ts | No — keyword-based, not citation regex |
| 2 | QualityGauntlet | quality-integration.ts | No — scores only, doesn't edit text |
| 3 | CitationEnforcer | citation-validator.ts | **Extracts it, marks VALID** (Hawhee is in corpus) |
| 4 | ProseSanitizer (2nd pass) | prose-sanitizer.ts | No — same patterns as stage 1 |
| 5 | AuthorScrubber | author-scrubber.ts | No — **signal-phrase patterns only** |
| 6 | stripEndnoteLeaks | quality-integration.ts | No — endnote markers only |

### Why It Leaks

**Hawhee IS in the corpus** (`manifest.jsonl`: "Hawhee, Debra", year 2011, 31 chunks). The citation validator correctly identifies `(Hawhee 2011)` and marks it **valid** because the author+year match. The enforcer therefore does not remove it.

The **author scrubber** (stage 5) only catches signal-phrase patterns:
- `As Hawhee argues...` → caught
- `Hawhee observes that...` → caught
- `Drawing on Hawhee...` → caught
- `(Hawhee 2011)` → **NOT caught** — no signal-phrase prefix

### The Real Problem

The citation is **technically valid** (corpus source exists) but **stylistically wrong**:
1. The style profile mandates MLA-influenced signal-phrase citations: `(Author, *Title*, p. X)`
2. `(Hawhee 2011)` is APA-style — wrong format, missing title and page number
3. It appears mid-sentence, breaking prose flow

This is not a hallucination — it's a **style violation** that no current stage detects.

### Fix Options

**Option A (Recommended): Prompt-level prevention**

Add to the gold standard prompt's Citation Requirements section:
```
- NEVER use APA-style parenthetical citations like (Author Year) or (Author, Year).
- ALWAYS use signal-phrase citations: As Author observes in *Title*, "quotation" (p. X).
- If you must use a parenthetical, it MUST include title and page: (Author, *Title*, p. X).
```

This is preventive rather than corrective. Zero false-positive risk.

**Option B: Post-processing regex**

Add a new stage (or extend AuthorScrubber) that detects bare parenthetical citations:
```typescript
// Match (Author Year) or (Author, Year) WITHOUT title or page
const bareParenthetical = /\(([A-Z][a-z]+(?:\s+(?:et\s+al\.?|and\s+[A-Z][a-z]+))?)[,\s]+(\d{4})\)/g;
```

For each match, either:
- Remove the parenthetical entirely (leaving the surrounding sentence intact)
- Or convert to signal-phrase format using the corpus manifest's title

**Caveat**: This risks false positives on legitimate parenthetical references in quotations.

**Option C: Citation format validator stage**

Add a new QualityGauntlet stage that checks citation FORMAT (not just author/source validity):
- Extract all citations
- Verify each matches the expected MLA format: `(Author, *Title*, p. X)`
- Flag format violations for rewriting

---

## Recommendation

For an immediate re-run that matches the original quality:

1. **Use Option A for sections**: Pass the 8-section outline explicitly in the topic string
2. **Use Option A for citations**: Add APA-prevention language to the prompt

Both are zero-code-change solutions that can be tested immediately.

For a permanent fix:
- **Section count**: Implement Option B (edge-concept decomposition) so bare topic strings auto-decompose into rich section outlines
- **Citation format**: Implement Option A (prompt prevention) + Option B (post-processing cleanup as safety net)
