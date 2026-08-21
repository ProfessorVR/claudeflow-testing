# Claude Code Memory - God Agent Project

## Style Profile Configuration (CRITICAL)

**Active Style Profile**: `dalton-academic-mkn82c3v`
- Learned from 3 documents: phantasia paper, VR rhetoric thesis, virtual things paper
- Located at: `.agentdb/universal/style-profiles.json`
- Backup analysis: `corpus/style/style-analysis.json`

### Key Style Characteristics
- Average sentence length: 31.24 words (long, complex sentences)
- High long-sentence ratio: 51.6%
- Passive voice ratio: 20.1%
- Formality score: 0.64
- Common transitions: "thus", "specifically", "indeed", "subsequently", "hence", "similarly", "accordingly"
- Author-prominent citations (99.2%): uses verbs like "observes", "argues", "suggests", "states"
- Citation style: MLA-influenced with embedded quotations

### Style Enforcement Rules

**USE `/god-write` FOR ALL ACADEMIC WRITING**
- The `/god-write` command automatically injects the active style profile
- It integrates with the full validation pipeline (Quality Gauntlet, Corpus Validator)

**When Task Tool is Required (retrieval issues with /god-write)**:
Always inject this style instruction into the prompt:

```
STYLE REQUIREMENTS (from trained profile "dalton-academic-mkn82c3v"):
- Sentence style: Average 31 words, 51% long sentences, complex structures
- Passive voice: ~20% of sentences
- Transitions: Use "thus", "specifically", "indeed", "accordingly", "hence"
- Citation integration: Author-prominent (e.g., "As Aristotle observes...", "Frede argues that...")
- Quote verbs: observes, argues, suggests, states, maintains, notes
- Tone: Formal (0.64), objective, cautious claims with hedging
- Avoid contractions, maintain academic register
```

## LLM Routing Rule (CRITICAL — User Directive 2026-02-13)

**ALL academic writing → Anthropic Claude (`costTier: 'high'`)**
- Decomposition, paragraph generation, paragraph plans, sentence mapping
- Files: `llm-decomposition-provider.ts`, `llm-generation-provider.ts`

**vLLM (Qwen Coder) → ONLY for coding tasks and OCR repair**
- OCR repair stays `costTier: 'low'` + `forceBackend: 'vllm'` in `auto-verifier.ts`
- ModelRouter key length check: >= 50 chars for Anthropic detection

**Dashboard .env fix (Fix 26)**: `icp-api-routes.ts` loads `.env` at module init, overriding truncated shell keys

## Corpus and Citation Validation

**Corpus Location**: `scripts/ingest/manifest.jsonl`
- Contains all ingested scholarly sources
- Citations MUST match entries in this manifest

**Validation Components**:
1. **QualityGauntlet** (7 stages): citation-verifier, toulmin-enforcer, argument-coherence, citation-completeness, citation-density, style-consistency, factual-accuracy
2. **CorpusValidator**: Validates citations exist in manifest
3. **QuotationFidelityValidator**: 70%+ similarity (lowered from 95% for OCR corpus), borderline counts as pass

## Service Endpoints

| Service | Port | Purpose |
|---------|------|---------|
| vLLM | 8002 | Qwen2.5-Coder-32B-Instruct-AWQ |
| Embedding | 8000 | gte-Qwen2-1.5B-instruct |
| ChromaDB | 8001 | Vector database |
| Observe | 3847 | Dashboard |

Start services: `/god-launch` or `./scripts/god-launch start`

## Dashboard Architecture (2026-02-10)

**Current**: Option A — Dashboard calls `SectionOrchestrator` directly for god-write parity
**Future**: Option B — Extract pipeline into standalone API service for production scale
- Dashboard becomes pure visualization layer
- Both CLI and dashboard call same HTTP API → God Write Service → SectionOrchestrator
- Better for: horizontal scaling, auth, rate limiting, multi-tenant

**Key fix**: L2→cosine similarity in `SmartRetrievalLayer` (`1 - L2²/2` for normalized embeddings)

## God-Write Pipeline Fixes (2026-02-10)

**Fixes applied to make `--execute` mode work end-to-end:**
- **Fix 9**: `.env` loader in `cli.ts` — CLI wasn't loading `.env`, so 108-char ANTHROPIC_API_KEY was unavailable (shell had truncated 16-char key)
- **Fix 10**: Skip DAI-001 agent selection in `write()` — it picked wrong agents (system-designer) for academic topics, contaminating prompt with coding instructions
- **Fix 11**: CLI output mapping uses `corpusContext` (not InteractionStore `sources`) for sourcesCount/retrievalStats
- **Fix 12**: Updated corpus context block instructions to handle OCR artifacts (don't copy raw page headers)
- **Fix 13**: `useInlineValidation` CLI flag passes `undefined` (not `false`) when unset, enabling auto-enable logic
- **Fix 14**: Prose sanitizer catches `[GENERATION FAILED]`, `[REQUIRES MANUAL REVIEW]`, and LLM meta-text leaks
- **Fix 15**: Duplicate section removal in prose sanitizer
- **Fix 16**: Inline validation recovery — units with validation score >= 0.8 use generated content instead of placeholder
- **Fix 17**: Quote fidelity threshold lowered from 0.95→0.70 and borderline quotes count as passing (OCR corpus text makes 95% unrealistic)
- **Fix 18**: Second sanitizer pass after citation enforcement catches post-enforcement artifacts
- **Fix 19**: Citation enforcement placeholder changed from `[CITATION NEEDED]` to empty string (removes hallucinated citations cleanly)
- **Fix 20**: Expanded LLM meta-text leak patterns in prose sanitizer ("Now I'll generate...", "Based on the evidence from the corpus...")
- **Fix 21**: Null safety for `lastValidationResult` in inline validation recovery (prevents crash when API errors occur before validation)
- **Fix 22**: `'' || '[CITATION NEEDED]'` is falsy in JS — changed `||` to `??` (nullish coalescing) in citation-validator.ts `correct()` method
- **Fix 23**: Strengthened corpus constraint prompt with "ZERO TOLERANCE" language, explicit rules about not citing scholars mentioned within corpus chunks
- **Fix 24**: Recovery (Fix 16) no longer recovers units with hallucinated citations — only recovers if `citationResults.hallucinated.length === 0`
- **Fix 25**: Post-enforcement non-corpus author scrubbing — scans final text for signal phrases referencing non-corpus authors and removes those sentences
- **Fix 26**: `.env` loader in `icp-api-routes.ts` — dashboard daemon inherits truncated 16-char key from shell; `.env` has full 108-char key. Always overrides `process.env` with `.env` values (not just missing keys)
- **Fix 27**: Replace `@anthropic-ai/sdk` with native `fetch` in ModelRouter — SDK v0.71.2 fails in WSL2 daemon processes
- **Fix 28**: ModelRouter constructor strips `undefined` config values before spreading (prevents `undefined` overwriting defaults like `anthropicModel`)
- **Fix 29**: `hybridSearch.mergeResults()` — when keyword results are empty, return semantic results at full score (was multiplying by 0.7 weight, dropping all scores below `minRelevance`)
- **Fix 30**: ModelRouter default `timeoutMs` increased from 30s to 120s, plus `AbortSignal.timeout(120000)` on Anthropic fetch (academic decomposition takes ~47s)
- **Fix 31**: vLLM OpenAI client timeout set to 10s (fail fast when vLLM is down instead of hanging)
- **Fix 32**: LLM decomposition `maxTokens` increased from 2000 to 4000 (Claude's rich facet JSON was being truncated)

**Pipeline execution path** (`--execute` mode):
1. `.env` loaded → valid API key available
2. Clean write prompt built (no agent selection noise)
3. Corpus retrieval (SmartRetrievalLayer) → chunks from ChromaDB
4. Corpus constraint built (whitelist of allowed sources)
5. If corpus >= 3 chunks → inline validation auto-enables (paragraph-by-paragraph generation)
6. If inline fails → direct Anthropic API call (fallback)
7. Prose sanitization → quality gauntlet → citation enforcement → **second sanitizer pass** → **non-corpus author scrub** → endnotes

**Additional fixes (2026-02-18 session — inline validation pipeline)**:
- **Fix 45**: `buildCorpusConstraint()` minRelevance changed from 0.5 to 0.0 — chunks at relevance 0.35-0.49 were in generation but not in constraint whitelist
- **Fix 46**: Author scrubber uses FULL corpus manifest for allowedAuthors, not just retrieved chunk authors (semantic search returns zero primary source chunks)
- **Fix 47**: Prose sanitizer `removeMetaAnalysisSections()` with keyword-based heading matching (strips inline validation planning artifacts)
- **Fix 48**: Expanded false positive word lists in citation-validator.ts, inline-validation-orchestrator.ts (approach, interpretation, investigation, synthesis, etc.)
- **Fix 49**: Author scrubber strips possessive `'s` from captured names before checking allowedAuthors (`"heidegger's"` → `"heidegger"`)
- **Fix 50**: Quality gauntlet revision DISABLED (`maxRevisions: 0`) — stages return 0.5 default, revision loop introduces hallucinated citations. Re-enable when gauntlet stages produce meaningful evaluations.
- **Prose sanitizer meta keyword refinement**: Removed overly-broad "evidence" keyword (stripped legitimate scholarly headings), replaced with specific phrases like "evidence identification", "citation evidence", etc.
- **Prose sanitizer heading-only patterns**: `## Generated Paragraph` headings stripped without removing content beneath them

**Gold Standard Restoration Fixes (2026-03-06/07 session)**:
- **Fix 33**: `extractRetrievalQueries()` — strip `**bold**` markers before matching, add "quotation fidelity"/"quality gauntlet" to meta filter
- **Fix 34**: `goldLog()` helper — direct stderr logging bypassing verbose gate
- **Fix 35**: `extractSemanticRetrievalQueries()` — compact keyword queries for embedding search (strips stopwords)
- **Fix 36**: Phase 1b source-targeted supplementation with `whereFilter: { author_raw: { $eq: author } }`
- **Fix 37**: `enforceSourceDiversity()` — relevance-first selection with per-source cap (replaces round-robin)
- **Fix 38**: CLI chunk count default: 28 for whitelist mode, 15 for standard
- **Fix 39**: `god-learn/knowledge.jsonl` created with 10 KUs
- **Fix 40**: Enriched style profile in `buildGoldStandardPrompt()` (paragraph length, citation style, characteristic features)
- **Fix 41**: Word target defaults to '3,000-3,500' for gold standard mode
- **Fix 42**: Source diversity constraint lists available sources explicitly, per-section source assignments
- **Fix 43**: Title extraction skips instruction lines (e.g., "You are generating...")
- **Fix 44**: Per-section word targets in prompt (~467 words/section)

**Multi-Step Drafting Research Fixes (2026-03-07)**:
- **Fix 51**: `trimChunkContent()` — Intelligent chunk trimming: 4,280 → 352 avg chars/chunk (92% reduction). Preserves quotations, page refs, key terms. Removes OCR boilerplate.
- **Fix 52**: `reorderChunksForAttention()` — Places highest-relevance chunks at start/end of prompt (mitigates "lost in the middle", LongLLMLingua: 21.4% improvement)
- Research report: `plans/multi-step-drafting-research.md`

**Dissertation-Strict Mode Fixes (2026-03-07)**:
- **Fix 53**: Phase 1b guard removed — `allChunks.length < targetChunks * 1.5` was preventing author-targeted supplementation (46 < 42 = false)
- **Fix 54**: `investigateV1()` — Local string-based v1 investigation (no LLM). Detects: hallucinated citations, phantom quotations, uncited claims, source imbalance, short sections.
- **Fix 55**: `validateRetrievalCoverage()` — Pre-generation check that key authors from topic have ≥2 chunks. Attempts targeted supplementation if missing.
- **Fix 56**: Top-level grounding constraints in prompt: "ONLY quote and cite from the corpus chunks below", "NEVER introduce any author names not in chunks", plus blacklist injection from prevention plan.
- **Fix 57**: `--multi-step` CLI flag — Enables v1→investigate→v2 pipeline. V1 runs without style profile, investigation is local-only, v2 gets full style + prevention plan constraints.
- **Fix 58**: `--nli-verify` and `--candidate-selection` CLI flag stubs (plumbing only, not yet implemented).
- Tests: 7 new unit tests for investigateV1 (all pass). Zero regressions in existing tests.
- Backup: `tmp/backup-pre-dissertation-strict/`

**MSD Test Results (2026-03-07, Opus 4.6 with trimming+reordering)**:
| Metric | Gold Std | Pre-trim v2 | MSD v2 (trimmed+styled) |
|--------|:-------:|:-----------:|:----------------------:|
| Main Text Words | 3,116 | 1,936 | **2,760** (+42.5%) |
| Quality Score | 73.2% | 79.9% | **74.1%** |
| Quotations | 4 | 13 | **24** |
| Authors Cited | 3 | 7 | **9** |
| Prompt Size | 27,183 | 66,885 | **20,409** (70% smaller) |
| Input Tokens | ~7K | ~17K | **5,908** (65% fewer) |
| Phantom Hawhee | 0 | 4 | **1** |
| Transitions | 7 types | 6 | **7 types** |

**Pipeline Improvements (2026-03-07, session 2)**:
- **Fix 59**: `extractPrimaryAuthors()` — Extracts ALL named authors from prompt (1+ mentions), not just 2+ like `extractKeyAuthors()`. Ensures primary sources get targeted retrieval.
- **Fix 60**: `buildSectionConstraints()` — Derives per-section citation/quotation constraints from section headings (e.g., "Section 1 names Aristotle → cite Aristotle ≥1 time"). Heidegger sections get ≥2 quotation quota.
- **Fix 61**: Phase 1c+ soft primary ratio check — Target ≥30% primary chunks, warn (not block) if below. Under-coverage warning injected into prompt.
- **Fix 62**: `claimsWithoutCitation` counter in `investigateV1()` stats — Always reported, even when zero.
- **Fix 63**: `multiStepDiagnostics` in WriteResult — Separate v1Diagnostics / preventionPlan / v2Diagnostics in output JSON. Includes `blacklistedAuthorsUsedInV2` count.
- **Fix 64**: YAML parse warn→debug — `agent-definition-loader.ts` only logs when `DEBUG` env set.
- **Fix 65**: DESC best-effort — Both inject and store calls wrapped in try/catch with silent fallback. Not a critical path dependency.
- **Fix 66**: `bodyWordCount` added to WriteResult interface (was returned but missing from type).

**Known remaining issues:**
- Quality gauntlet stages all return 0.5 (default) — Fix 50 disables revision as workaround
- "psychS-sight" OCR artifact in O'Gorman corpus chunks (fix in source PDF)
- Semantic retrieval returns ZERO Aristotle primary text chunks — all chunks are secondary scholarship. Needs corpus ingestion of Aristotle primary texts.

## ICP Pipeline Debug Status (2026-02-14)

**Problem**: ICP pipeline produces 0 words of prose. Ran `scripts/icp-run.ts` with Aristotle motion/time/phantasia prompt.

**Root cause identified**: Embedding API CUDA error when GPU VRAM unavailable (gaming).
- Embedding service at :8000 reports `status: online, vector_db_ready: true` but `/embed` returns `CUDA error: unknown error`
- SmartRetrievalLayer.semanticSearch() gets empty embedding → ChromaDB returns no results → 0 quote spans → 0 atoms → 0 paragraphs → empty prose

**Verified working**:
- ChromaDB at :8001 has 1000+ chunks with `collection=rhetorical_ontology`
- ChromaDB where clause `{collection: {$eq: "rhetorical_ontology"}}` returns results
- ICP decomposition (Stage 1) works — 7 facets generated via Anthropic Claude
- ICP quality gates (WS1-WS10 from plan) are implemented
- `scripts/icp-run.ts` runner script works end-to-end (loads .env, creates factory/orchestrator, runs pipeline)
- min_relevance lowered to 0.35 in icp-run.ts (default 0.7 filters out most chunks)

**To resume ICP pipeline test**:
1. Restart GPU services: `/god-launch start` (needs GPU VRAM free)
2. Verify embedding: `curl -s -X POST http://localhost:8000/embed -H "Content-Type: application/json" -d '{"texts":["test"]}'`
3. Run: `cd /home/dalton/projects/claudeflow-testing && npx tsx scripts/icp-run.ts`
4. If still 0 words, add logging to FacetedRetrieval to trace chunk→span conversion
5. If chunks retrieved but no generation, investigate claimProvider (undefined → no atoms → fallback plan)

**Other session work completed (2026-02-14)**:
- Unicode diacritic fix in `scripts/pdf/highlight-page.py` — 5-step fallback: raw→NFC→NFKC→substring→stripped
- Removed OCR Patch tab from ICP dashboard (`icp-panel.js`, `styles.css`)
- All 443 observability + 487 composition tests pass

## Common Issues

**"No corpus chunks available" from /god-write**:
- SmartRetrievalLayer may return 0 chunks
- Workaround: Use Task tool with `academic-writer` agent + manual style injection
- Check embedding service: `curl http://localhost:8000/`  (NOT `/health`)

**ChromaDB collection metadata** (discovered 2026-02-13):
- Collections: `metaphysics`, `new_media`, `rhetorical_ontology` (NOT `notes`/`theory`/`empirical`)
- Metadata fields: `author_raw`, `title_raw` (NOT `author`/`title`)
- Total chunks: ~2,920 in `knowledge_chunks` collection

**UCM daemon connection error**:
- Fix: `./scripts/god-launch restart ucm`

**`[TASK_QUEUED]` from CLI with `--execute`**:
- Root cause: ANTHROPIC_API_KEY not loaded from .env (Fixed: Fix 9 adds .env loader to cli.ts)
- If key is too short (< 50 chars), check `.env` file has full 108-char key
