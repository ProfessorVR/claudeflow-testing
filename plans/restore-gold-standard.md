# Plan: Restore God-Write to Gold Standard Quality (v4 — Fully Traced)

## Executive Summary

We have now traced the **complete provenance** of the gold standard document — from the user's `/god-write` command, through chunk retrieval, knowledge unit loading, prompt assembly, generation, quality gauntlet evaluation, and final file save. Every step is documented with timestamps, session IDs, and subagent logs.

The gold standard was the **second generation attempt** on Feb 7, 2026. The first attempt (v1, 8:16 AM) scored 78.1% but lacked style profile injection and had a phantom quotation. The second attempt (~12:03 AM Feb 8) added the full style profile, tightened quotation fidelity constraints, and produced the 73.2% gold standard.

**Strategy**: Automate in the pipeline what the parent Claude did manually — multi-query retrieval, source-targeted supplementation, knowledge unit loading, style profile injection, gold standard prompt assembly, single-shot generation, and post-hoc quality gauntlet.

## Complete Gold Standard Provenance

### Session & Artifacts

| Artifact | Location |
|----------|----------|
| Parent session | `c73a7e25-e700-4b24-a19b-dcb9e45f839f` |
| Gold standard subagent | `agent-a1a1fbb.jsonl` (entry 0 = prompt, 27,183 chars) |
| Gold standard document | `research/generated-motion-time-phantasia-section.md` |
| Styled version | `C:\Users\Dalton\Downloads\MT styled.pdf` |
| File timestamp | Feb 7, 2026 4:14 PM (actually generated ~12:03 AM Feb 8) |
| Quality Gauntlet score | 73.2%, 6/9 stages passed |

### Timeline (Feb 7–8, 2026)

```
Feb 6, 9:56 PM   /god-launch start --profile full (services started)
Feb 6, 9:59 PM   /god-ask run ingestion pipeline → 2,920 chunks ingested
Feb 6, 11:28 PM  Pipeline complete, tests passing

Feb 7, 8:02 AM   /god-write command issued with topic prompt
Feb 7, 8:09 AM   CLI retrieval bug: SmartRetrievalLayer found 30 chunks
                  but CLI reported chunksRetrieved: 0
                  Parent Claude manually queries ChromaDB:
                  → 7 topic-specific queries → 38 unique chunks → top 30
                  → Targeted Heidegger queries → 16 more chunks
                  → Merge & deduplicate → 45 unique → top 40 selected
Feb 7, 8:15 AM   Knowledge units loaded from god-learn/knowledge.jsonl
                  → 230 total → 138 relevant → 10 distilled for prompt
Feb 7, 8:16 AM   FIRST GENERATION (v1): ~2,800 words, NO style profile
Feb 7, 4:42 PM   Quality Gauntlet on v1: 78.1%, phantom quotation found
Feb 7, 5:03 PM   Investigation: phantom quote "number of motion with
                  respect to before and after" is paraphrase, not verbatim
Feb 7, 5:25 PM   Prevention plan created
Feb 7, 11:51 PM  User asks: "was the style profile injected?" → No
Feb 8, 12:03 AM  SECOND GENERATION (v2 = GOLD STANDARD):
                  → Full style profile injected (dalton-academic-mkn82c3v)
                  → Tightened quotation fidelity constraints
                  → Same corpus chunks re-used
                  → 6,427 words, 32 quotations, 29 claims
Feb 8, 12:08 AM  Quality Gauntlet on v2: 73.2%, results appended
                  → This becomes the gold standard document
```

### How Chunks Were Retrieved (The Automated Process)

The parent Claude orchestrated chunk retrieval manually because the CLI's built-in retrieval had a bug. The exact process:

**Step 1: Multi-query semantic search** (7 queries for 7 subsections)
```python
queries = [
    'Aristotle kinesis motion change potentiality actuality',
    'Aristotle time chronos number of motion',
    'Aristotle aisthesis perception temporal',
    'Aristotle phantasia imagination temporal binding',
    'Heidegger Aristotle kinesis ontological interpretation',
    'Heidegger being-there temporal structure Dasein',
    'perception imagination being temporal integration',
]
# Each query → ChromaDB semantic search → top results
# Merge all results → 38 unique chunks → select top 30
```

**Step 2: Source-targeted supplementation** (Heidegger-specific)
```python
# Additional queries filtered to Heidegger's Basic Concepts only
queries = [
    'being-moved movement kinesis Aristotle Physics interpretation',
    'pathos logos rhetoric soul being-in-the-world',
    'speaking hearing being-with-one-another',
    'Dasein time temporality now chronos',
]
# where_filter: path_rel contains "Basic Concepts"
# → 16 Heidegger-specific chunks
```

**Step 3: Merge, deduplicate, rank**
```python
# Combine general (30) + Heidegger-targeted (16) → 45 unique
# Select top 40 by relevance score
# Save to /tmp/god-write-corpus-chunks.json
```

**Step 4: Knowledge units from god-learn**
```python
# Load god-learn/knowledge.jsonl → 230 total KUs
# Filter by domain relevance (aristotle, heidegger, phantasia,
#   kinesis, time, perception, rhetoric) → 138 relevant
# Distill to 10 key claims for the prompt
```

**Step 5: Prompt assembly**
- Load style profile from `.agentdb/universal/style-profiles.json`
- Combine: Role + Style + Task + Constraints + Chunks + KUs + Output + REMEMBER
- Total: 27,183 chars (~7K tokens)

### Final Prompt Structure

```
[1] ROLE FRAMING (1 sentence)
    "You are an academic writing agent generating a scholarly dissertation
     section. You must write in the trained style profile provided below
     and draw EXCLUSIVELY from the corpus chunks and knowledge units provided."

[2] STYLE PROFILE (~750 words)
    ## STYLE PROFILE (dalton-academic-mkn82c3v)
    - Sentence Structure: avg 31 words, 14% short / 35% medium / 52% long
    - Complex sentences with semicolons: ~45%
    - Vocabulary: moderately formal, no contractions, 5.0 char avg, 3% technical
    - Tone: balanced, ~20% passive, 48% assertiveness, minimal hedging
    - Structure: 140+ word paragraphs, ~2.8% questions, "we" acceptable
    - Transitions: thus, specifically, indeed, subsequently, hence, similarly, accordingly
    - Features: philosophical openings, em-dashes, concept→evidence pattern
    - Citation style: title-page (Author, *Title*, p. X), MLA-influenced
    - Sample opening patterns from author's actual papers (3 examples)

[3] WRITING TASK (~100 words)
    ## WRITING TASK
    Title + 7 numbered subsections with descriptions

[4] CRITICAL CONSTRAINTS (~200 words)
    ### Quotation Fidelity (MANDATORY)
    - ONLY quote VERBATIM from corpus chunks
    - NEVER paraphrase then wrap in quotation marks
    - Every quote MUST have citation immediately following
    - 3-4+ quotations from Heidegger Basic Concepts
    - Quotations from 4+ different corpus sources
    ### Citation Requirements
    - Title-page format: (Author, *Title*, p. X)
    - Every section must have multiple citations
    - 15+ citations total
    - ALL citations ONLY from sources in corpus chunks
    ### Length
    - ~3,000-3,500 words + Validation Appendix

[5] CORPUS CHUNKS (~40 chunks, ~18,000 chars)
    ## CORPUS CHUNKS (Use ONLY these for quotations and citations)
    Format: --- CHUNK: Author, *Title* (Year), pp. X-Y ---
    [chunk text]
    Sources: ~13 distinct works, intentionally over-provided
    (~10 of 40 chunks went unused — over-provision is deliberate)

[6] KNOWLEDGE UNITS (~200 words)
    ## KNOWLEDGE UNITS (additional scholarly context)
    10 bullet-point claims (not quotable, thematic guidance only)

[7] OUTPUT FORMAT + REMEMBER BLOCK (~150 words)
    ## OUTPUT FORMAT
    - Write full section (3,000-3,500 words)
    - Validation Appendix: Claim Map, Quotation Fidelity Ledger,
      Citation Ledger, Validation Summary
    - REMEMBER: [final reinforcement of style + quotation fidelity]
```

### Key Observations

1. **40 chunks provided, ~27 appeared in final prompt** — some filtering happened during prompt assembly (context window budget)
2. **~10 chunks went unused** — intentional over-provision gives Claude selection flexibility
3. **Knowledge units from god-learn pipeline** — 230 KUs → 138 relevant → 10 selected. These are thematic signposts, not quotable text.
4. **No separate source whitelist** — chunks define allowed sources implicitly
5. **No CARS model** — argumentative structure emerged from subsection outline
6. **No key concept tracking list** — terms emerged from chunks and task
7. **REMEMBER block at end** — reinforces style + quotation fidelity at maximum recency (prompt engineering technique)
8. **Citation format is MLA-influenced** — (Author, *Title*, p. X), NOT APA
9. **OCR artifacts in chunks** — Claude navigated around them by quoting clean passages
10. **v1 (no style) scored 78.1%, v2 (with style) scored 73.2%** — style injection lowered gauntlet score slightly but dramatically improved prose quality. The gauntlet's toulmin-enforcer penalizes the long, architectonic sentences that define the style.

### What the Gold Standard Did NOT Have

- No `write-pipeline-orchestrator.ts` involvement
- No inline validation (paragraph-by-paragraph)
- No citation enforcement post-processing
- No author scrubber
- No prose sanitizer
- No endnote generation
- No CARS model
- No separate source whitelist (chunks were the whitelist)
- No APA citation format

## Implementation Plan

### Phase 1: Multi-Query Chunk Retrieval

**What to automate**: The parent Claude's manual ChromaDB queries.

```typescript
async function retrieveGoldStandardChunks(
  topic: string,
  subsections: string[],
  options: { collections?: string[]; targetChunks?: number }
): Promise<CorpusChunk[]> {

  // Step 1: Generate per-subsection queries
  // Each subsection title → 1 semantic query
  const queries = subsections.map(s => extractSearchQuery(s));

  // Step 2: Multi-query retrieval (like gold standard's 7 queries)
  const allResults = [];
  for (const query of queries) {
    const results = await smartRetrieval.search(query, {
      collections: options.collections,
      limit: 15,  // top 15 per query
      minRelevance: 0.0,  // low threshold, filter later
    });
    allResults.push(...results);
  }

  // Step 3: Source-targeted supplementation
  // Identify key authors from topic → additional filtered queries
  const keyAuthors = extractKeyAuthors(topic); // e.g., ['Heidegger', 'Aristotle']
  for (const author of keyAuthors) {
    const authorResults = await smartRetrieval.search(topic, {
      collections: options.collections,
      authorFilter: author,
      limit: 16,
    });
    allResults.push(...authorResults);
  }

  // Step 4: Merge, deduplicate, diversify, rank
  const unique = deduplicateByChunkId(allResults);
  const diverse = ensureSourceDiversity(unique, {
    minSourcesRepresented: 8,
    maxChunksPerSource: 8,
  });

  // Step 5: Select top N (gold standard used ~40, prompt had ~27)
  const target = options.targetChunks || 35;
  return diverse.slice(0, target);
}
```

**Key difference from current system**: Multi-query (one per subsection) + source-targeted supplementation, not a single semantic query.

### Phase 2: Knowledge Unit Loading

**What to automate**: Loading from `god-learn/knowledge.jsonl` and filtering.

```typescript
async function loadRelevantKnowledgeUnits(
  topic: string,
  domains: string[],  // e.g., ['aristotle', 'heidegger', 'phantasia']
  limit: number = 10,
): Promise<string[]> {
  // Load all KUs from god-learn
  const allKUs = await loadKnowledgeUnits('god-learn/knowledge.jsonl');

  // Filter by domain relevance
  const relevant = allKUs.filter(ku =>
    domains.some(d => ku.claim.toLowerCase().includes(d))
  );

  // Rank by confidence and relevance, take top N
  return relevant
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
    .map(ku => `- ${ku.claim} (${ku.source})`);
}
```

### Phase 3: Gold Standard Prompt Builder

**What to automate**: Assembling the 7-section prompt in exact order.

```typescript
function buildGoldStandardPrompt(options: {
  topic: string;
  title: string;
  subsections: { title: string; description: string }[];
  chunks: CorpusChunk[];
  knowledgeUnits: string[];
  styleProfile: StyleProfile;
  wordTarget?: string;
}): string {
  return [
    // [1] Role framing
    `You are an academic writing agent generating a scholarly dissertation section. You must write in the trained style profile provided below and draw EXCLUSIVELY from the corpus chunks and knowledge units provided.`,

    // [2] Style profile
    formatStyleProfile(options.styleProfile),

    // [3] Writing task
    formatWritingTask(options.title, options.subsections),

    // [4] Critical constraints
    formatConstraints({
      wordTarget: options.wordTarget || '3,000-3,500',
      minHeideggerQuotes: 3,
      minSourceDiversity: 4,
      minTotalCitations: 15,
    }),

    // [5] Corpus chunks
    formatCorpusChunks(options.chunks),

    // [6] Knowledge units
    formatKnowledgeUnits(options.knowledgeUnits),

    // [7] Output format + REMEMBER block
    formatOutputInstructions(),
    formatRememberBlock(options.styleProfile),
  ].join('\n\n');
}
```

**The REMEMBER block** (must be the LAST thing in the prompt):
```
REMEMBER: Write in the trained [author] style throughout. Long, architectonic
sentences with semicolons and multiple clauses. Philosophical and declarative
openings. Use "thus," "indeed," "hence," "accordingly" as transitions. Balanced
perspective with occasional first-person "we" constructions. Substantial
paragraphs (~140+ words). NEVER put text in quotation marks unless it appears
VERBATIM in the corpus chunks above.
```

### Phase 4: Integration into WritePipelineOrchestrator

**File**: `src/god-agent/universal/write-pipeline-orchestrator.ts`

When `whitelistMode` (gold standard mode) is active:

```typescript
if (options.whitelistMode) {
  // === GOLD STANDARD MODE ===

  // 1. Extract subsections from topic (or use decomposed queries)
  const subsections = this.extractSubsections(topic) || decomposedQueries;

  // 2. Multi-query chunk retrieval (Phase 1)
  const chunks = await retrieveGoldStandardChunks(topic, subsections, {
    collections: options.corpusCollections,
    targetChunks: 35,
  });

  // 3. Load knowledge units (Phase 2)
  const knowledgeUnits = await loadRelevantKnowledgeUnits(topic,
    this.extractDomains(topic), 10);

  // 4. Load style profile
  const styleProfile = await this.loadStyleProfile('dalton-academic-mkn82c3v');

  // 5. Build gold standard prompt (Phase 3)
  const prompt = buildGoldStandardPrompt({
    topic, title: this.extractTitle(topic),
    subsections, chunks, knowledgeUnits, styleProfile,
    wordTarget: options.length === 'comprehensive' ? '3,000-3,500' : '1,500-2,000',
  });

  // 6. Single-shot generation (NO inline validation)
  const generatedText = await this.generateSingleShot(prompt);

  // 7. Post-generation verification (Phase 5)
  // ... citation enforcement, author scrubber, prose sanitizer ...

  // 8. Quality Gauntlet (eval only, append results)
  // ... run gauntlet, append report to output ...
}
```

### Phase 5: Post-Generation Verification

Keep all existing verification as a safety net the gold standard never had:

**5a. Citation Enforcement Against Manifest**
- Verify every citation matches `scripts/ingest/manifest.jsonl`
- Chunks define generation sources, but manifest catches any hallucinated citations
- This is the key advantage over the gold standard

**5b. Author Scrubber**
- Full manifest author list (Fix 46)
- Catches citations to authors not in corpus

**5c. Prose Sanitizer**
- 2 passes (Fix 18)
- Strip any leaked `[1]`, `[2]` endnote markers
- Meta-analysis section removal (Fix 47)

**5d. Quality Gauntlet (Eval Only)**
- Run all 9 stages, `maxRevisions: 0` (no revision loop — Fix 50)
- Append results to output (like gold standard)
- Gold standard scored 73.2% — this is the benchmark
- Known false positives: citation-completeness flags quotes in appendix tables

**5e. Endnotes**
- OFF by default (gold standard had none)
- Only if `--enable-endnotes` explicitly set

### Phase 6: CLI Integration

**File**: `src/god-agent/universal/cli.ts`

| Flag | Behavior |
|------|----------|
| `--whitelist` / `-w` | Gold standard mode: multi-query retrieval + style + single-shot + gauntlet |
| `--enable-endnotes` | Add endnotes (OFF by default in gold standard mode) |
| `--gauntlet` | Run Quality Gauntlet post-hoc (ON by default in gold standard mode) |
| `--use-corpus` / `--rag` | Current RAG mode with inline validation (unchanged) |

Default for `--whitelist`:
```
chunks (multi-query) + style profile + knowledge units + single-shot
+ citation enforcement + author scrubber + prose sanitizer + gauntlet
- NO inline validation
- NO endnotes
```

### Phase 7: Testing & Comparison

1. **Exact reproduction**: Motion/Time/Phantasia topic, same collection
2. **New topic**: Orienting Faculties (different topic, same corpus)
3. **Metrics comparison:**

   | Metric | Target | Gold Standard | v1 Whitelist | Current RAG |
   |--------|--------|---------------|-------------|-------------|
   | Words | 5,000–7,000 | 6,427 | 6,982 | ~1,752 |
   | Sources | 8+ | 10 | 11 | ~5 |
   | Claims mapped | 25+ | 29 | 7 | N/A |
   | Quotations tracked | 25+ | 32 | 7 | N/A |
   | Quotation fidelity | 100% | 100% | 100% | ~83% |
   | Style compliance | Profile match | Confirmed | Not injected | Not injected |
   | Quality Gauntlet | 70%+ | 73.2% | Disabled | Disabled |
   | Endnote markers | 0 | 0 | 55 | varies |
   | Citation style | MLA title-page | MLA title-page | Bracketed [n] | Mixed |
   | Citation enforcement | 100% manifest | None (no enforcement) | 100% | ~83% |

4. **Regression test**: `--use-corpus` mode unchanged
5. **A/B test**: Same prompt, gold standard mode vs current RAG

## File Changes Required

| File | Change | Effort |
|------|--------|--------|
| `write-pipeline-orchestrator.ts` | Replace whitelistMode branch with gold standard mode: multi-query retrieval, KU loading, style injection, prompt builder, single-shot generation, gauntlet append | Large |
| `write-pipeline-orchestrator.ts` | Add `retrieveGoldStandardChunks()` — multi-query + source-targeted + dedup + diversify | Medium |
| `write-pipeline-orchestrator.ts` | Add `buildGoldStandardPrompt()` — 7-section prompt template with REMEMBER block | Medium |
| `write-pipeline-orchestrator.ts` | Add `loadRelevantKnowledgeUnits()` — god-learn KU loading + domain filtering | Small |
| `cli.ts` | Update `--whitelist` semantics, default endnotes off, add `--gauntlet` | Small |
| `universal-agent.ts` | Update WriteResult type if needed | Small |
| `prose-sanitizer.ts` | Add endnote marker `[n]` stripping for gold standard mode | Small |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Context window with ~35 chunks + style + constraints | Low | High | Gold standard was 27K chars (~7K tokens). Budget: ~6K words prompt, 194K for output. |
| SmartRetrievalLayer returns narrow results | Medium | Medium | Multi-query (7+ queries) + source-targeted supplementation ensures diversity. Fall back to collection-wide retrieval if needed. |
| Knowledge units file (`god-learn/knowledge.jsonl`) missing or empty | Medium | Low | Graceful fallback: skip KU section if unavailable. Gold standard had 10 KUs but they're guidance, not critical. |
| Quality Gauntlet returns 0.5 defaults | Medium | Low | Gold standard gauntlet produced real scores. If defaults, investigate stage config. Worst case: note "evaluation pending." |
| Multi-query retrieval too slow | Low | Low | Gold standard retrieval took ~2 min total. Acceptable for a generation that takes ~3 min. |
| Embedding service down (GPU unavailable) | Medium | High | Check embedding health before retrieval. If down, fall back to keyword-only search or abort with clear error. |

## Success Criteria

- [ ] Multi-query retrieval produces 25-35 diverse chunks from 8+ sources
- [ ] Style profile injected (full `dalton-academic-mkn82c3v` with sample patterns)
- [ ] Knowledge units loaded from god-learn (10 thematic bullets)
- [ ] Prompt follows exact 7-section structure: Role → Style → Task → Constraints → Chunks → KUs → Output+REMEMBER
- [ ] Single-shot generation (no inline validation)
- [ ] 25+ claims mapped in validation appendix
- [ ] 25+ quotations tracked with corpus verification
- [ ] All quotations corpus-verified (100%)
- [ ] 8+ distinct sources cited
- [ ] MLA-influenced citation format: (Author, *Title*, p. X)
- [ ] Author-prominent citations — ZERO bracketed endnote markers
- [ ] Quality Gauntlet runs post-hoc, results appended (target: 70%+)
- [ ] Post-generation citation enforcement catches any hallucinated citations
- [ ] REMEMBER block is the last section of the prompt
- [ ] Existing RAG mode (`--use-corpus`) unchanged (no regression)

## Reference Artifacts

| Artifact | Location |
|----------|----------|
| Gold standard document | `D:\god-agent-backup-20260210\...\research\generated-motion-time-phantasia-section.md` |
| Styled PDF | `C:\Users\Dalton\Downloads\MT styled.pdf` |
| Exact generation prompt (27,183 chars) | `.claude/projects/.../c73a7e25-.../subagents/agent-a1a1fbb.jsonl` (entry 0) |
| Parent session (full trace) | `.claude/projects/.../c73a7e25-e700-4b24-a19b-dcb9e45f839f.jsonl` |
| v1 generation (first attempt) | Session entry [6132], subagent with `creative-writer` type |
| Chunk retrieval scripts | Session entries [6095]–[6117] (Python + ChromaDB) |
| Knowledge unit loading | Session entry [6120] (`god-learn/knowledge.jsonl`) |
| v1 whitelist attempt (this session) | `tmp/gold-standard-test-20260306-115930/content.md` |
| Pre-refactor backup (91 GB) | `backups/full-project-backup-20260210-141317.tar.gz` |
| Extracted backup | `D:\god-agent-backup-20260210\` |
| Corpus manifest | `scripts/ingest/manifest.jsonl` |
| Style profile | `.agentdb/universal/style-profiles.json` (`dalton-academic-mkn82c3v`) |
| Knowledge units | `god-learn/knowledge.jsonl` (230 KUs) |
| Write pipeline | `src/god-agent/universal/write-pipeline-orchestrator.ts` |
| CLI | `src/god-agent/universal/cli.ts` |
| Two-step timeline replication (v1/v2) | `tmp/gold-timeline/` |

## Critical Finding: Prompt Size and Chunk Trimming (2026-03-07)

### Problem

The pipeline prompt is **66,885 chars (~17K tokens)** — 2.5× larger than the gold standard's **27,183 chars (~7K tokens)**. The model consistently stops generating at ~5K output tokens (`stop_reason=end_turn`) despite 16K available, producing ~1,936 prose words vs the gold standard's 3,116. Larger input context compresses output length.

### Root Cause

The entire bloat is in **raw chunk content**, not instruction overhead:

| | Gold Standard | Current Pipeline | Ratio |
|---|:---:|:---:|:---:|
| Instruction chars | ~9,000 | ~8,700 | 1:1 |
| Chunk chars | ~18,000 | ~58,000 | **3.2×** |
| Chunks | 40 | 28 | 0.7× |
| **Chars per chunk** | **~450** | **~2,071** | **4.6×** |

The gold standard parent Claude **trimmed each chunk to its key passage** (~450 chars, 2-3 quotable sentences). Our pipeline injects full raw ChromaDB chunks (~2,071 chars each) including OCR boilerplate, page headers, and bibliographic strings.

### Recommended Fix: Chunk Trimming

Add a chunk trimming step before prompt assembly that extracts the most relevant 2-3 sentences from each chunk using either:

1. **Keyword-based extraction**: Score sentences by overlap with the section query that retrieved the chunk, keep top 2-3
2. **LLM-based extraction**: Fast local model (Qwen via vLLM) extracts quotable passages per chunk
3. **Sliding window**: Keep the highest-density passage of ~450 chars within each chunk

Expected impact:
- Prompt size: ~67K → ~30K (close to gold standard's 27K)
- Output length: ~2K → ~3K+ words (model has more room to write)
- Phantom citations: `(Hawhee 2011)` eliminated (bibliographic strings trimmed out)
- Quotation quality: Higher signal-to-noise in chunks = better verbatim extraction

### Two-Step Process Validation (2026-03-07)

Replicated the gold standard timeline (v1 without style → investigate → v2 with style):

| Metric | v1 (no style) | v2 (with style) | Gold Standard |
|--------|:---:|:---:|:---:|
| Quality Score | 75.3% | **79.9%** | 73.2% |
| Direct Quotations | 0 | **13** | 4 |
| Authors Cited | 7 | **7** | 3 |
| Total Citations | 28 | **27** | ~15 |
| Prose Words | 2,097 | 1,936 | 3,116 |

The two-step process exceeds the gold standard on all metrics except word count, which is constrained by prompt size (see above). Chunk trimming is the primary remaining blocker.

### Multi-Step Drafting Research Implementation (2026-03-07)

Implemented the two P0 changes from `plans/multi-step-drafting-research.md`:

**P0-A: Intelligent Chunk Trimming** — `trimChunkContent()` method added to `write-pipeline-orchestrator.ts`
- Trims each chunk from ~4,280 avg chars → ~352 avg chars (92% reduction)
- Preserves quotation-bearing sentences, page references, argument-dense content
- Removes OCR artifacts, headers, boilerplate
- Reduces prompt from 66,885 → ~20,000 chars (70% reduction)
- Input tokens from ~17K → ~5,900 (65% reduction)

**P0-B: Attention-Optimized Chunk Reordering** — `reorderChunksForAttention()` method
- Places highest-relevance chunks at start and end of prompt
- Places medium-relevance chunks in the middle
- Mitigates "lost in the middle" effect (LongLLMLingua: 21.4% improvement)

**Results (MSD v1 = no style, MSD v2 = with style, both using trimming+reordering):**

| Metric | Gold Std | Pre-trim v2 | MSD v1 (trimmed) | MSD v2 (trimmed+styled) |
|--------|:-------:|:-----------:|:----------------:|:----------------------:|
| Main Text Words | 3,116 | 1,936 | 1,988 | **2,760** |
| Quality Score | 73.2% | 79.9% | 81.3% | **74.1%** |
| Quotations | 4 | 13 | 16 | **24** |
| Authors Cited | 3 | 7 | 9 | **9** |
| Prompt Size | 27,183 | 66,885 | 19,379 | **20,409** |
| Input Tokens | ~7K | ~17K | 5,632 | **5,908** |
| Phantom Hawhee | 0 | 4 | 0 | **1** |
| Avg Sentence Len | 31.2 | N/A | 29.7 | **30.7** |
| Transitions | 7 types | 6 | 3 | **7 types** |

**Key improvements from chunk trimming:**
- Word count: 1,936 → 2,760 (+42.5%) — approaching gold standard's 3,116
- Quotations: 13 → 24 (chunks now contain cleaner, more quotable text)
- Phantom citations: 4 → 1 (trimming removes OCR artifact text that caused phantom `(Hawhee 2011)`)
- Style compliance: All 7 transition types present, avg sentence length 30.7 (target: 31.2)
- Prompt compression: 70% smaller prompt = model uses output budget for content, not attention dilution

**Remaining gap:** Main text still ~356 words below gold standard (2,760 vs 3,116). Possible fixes:
- Increase chunk target from 450 to ~550 chars (preserve more context per chunk)
- Explicitly separate word target for main text vs appendix in the prompt
- Add "minimum words per section" constraint (~400 words per section × 7 sections = 2,800+)
