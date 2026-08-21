# ICP Quote Span Selection — Improvement Implementation Plan

**Date**: 2026-02-14
**Scope**: Faceted retrieval, sentence scoring, span ranking, diversity, and quality assessment
**Current State**: Keyword heuristic scoring, stub facet alignment, mock cross-encoder, fixed 3-sentence windows

---

## Current Architecture Weaknesses

| Component | File:Line | Problem |
|-----------|-----------|---------|
| `scoreSentenceRelevance()` | `faceted-retrieval.ts:606` | Keyword term-coverage only — cannot distinguish substantive from incidental mentions |
| `scoreFacetAlignment()` | `quote-ranker.ts:383` | Returns static 0.7/0.5 — highest-weighted signal (0.35) is a stub |
| `computeRealScore()` | `cross-encoder-reranker.ts:532` | Falls back to mock scoring — real mode never executes |
| `extractWindowedSpans()` | `faceted-retrieval.ts:428` | Fixed 3-sentence windows — ignores argument boundaries |
| `rank()` | `quote-ranker.ts:194` | Linear combination with miscalibrated signals — no score normalization |
| Cross-facet dedup | `faceted-retrieval.ts:278` | Exact fingerprint only — misses near-duplicate/paraphrase spans |

---

## Priority 1 — Embedding-Based Sentence & Facet Scoring

### 1A. Replace `scoreSentenceRelevance` with embedding similarity

**What**: Batch-embed all sentences in a chunk via existing gte-Qwen2 at :8000, compute cosine similarity against the facet query embedding. Keep keyword heuristic as a fast pre-filter.

**Where**: `src/god-agent/retrieval/faceted-retrieval.ts:606-614`

**How**:
```
1. Cache facet query embedding (shared across all chunks for a facet)
2. Batch-embed all sentences in a chunk via POST /embed {texts: [...]}
3. Compute cosine similarity per sentence
4. Fast reject: keyword score < 0.05 skips embedding call entirely
```

**Latency**: ~500ms per facet (150 sentences batched in 1-2 API calls)

| Pros | Cons |
|------|------|
| Uses existing infrastructure (gte-Qwen2 at :8000) | Adds embedding API dependency to retrieval hot path |
| Captures semantic relevance, not just lexical overlap | Sentence-level embeddings less contextual than chunk-level |
| Batch API call keeps latency low | GPU must be available (CUDA errors = fallback to keyword) |
| Largest single accuracy improvement available | Need graceful degradation when embedding service is down |

### 1B. Implement real `scoreFacetAlignment` in QuoteRanker

**What**: Embed `span.text` and `facet.description`, compute cosine similarity. Currently the highest-weighted ranking signal (0.35) returns a constant.

**Where**: `src/god-agent/core/composition/quote-ranker.ts:383-388`

**How**:
```
1. At ranking time, batch-embed all candidate span texts
2. Embed each facet description (cache — facets don't change per run)
3. For each span, compute max cosine similarity across the facets it could support
4. Store embedding on QuoteSpan to avoid recomputation downstream
```

| Pros | Cons |
|------|------|
| Unblocks the most important ranking signal | Requires async refactor of `rank()` (currently sync) |
| Uses existing embedding infrastructure | Adds ~200-400ms to ranking phase |
| Immediately improves quote selection quality | Embeddings may not capture philosophical nuance well |

---

## Priority 2 — Diversity & Cross-Encoder Re-Ranking

### 2A. Add MMR (Maximal Marginal Relevance) diversity selection

**What**: After extracting spans per facet, apply MMR to select diverse quotes that balance relevance against redundancy. Currently, greedy selection picks the most relevant sentences with no diversity awareness.

**Where**: New method in `faceted-retrieval.ts`, called after `extractWindowedSpans()` in `retrieveForFacet()`

**Algorithm**:
```
MMR(d) = lambda * Relevance(d, query) - (1-lambda) * max(Similarity(d, d') for d' in Selected)
```

**Lambda by facet role**:
- Core facets: 0.6 (balanced — need diverse primary/secondary sources)
- Supporting facets: 0.7 (more relevance-focused)
- Exploratory/comparative facets: 0.4 (maximum diversity across authors)

**Similarity metric**: 7-gram Jaccard (already implemented in `quote-ranker.ts:362`) — avoids extra embedding calls.

| Pros | Cons |
|------|------|
| Eliminates near-duplicate quotes across documents | Lambda tuning requires experimentation per corpus |
| Ensures multi-source coverage for strict facets | Jaccard may miss semantic near-duplicates |
| Zero additional infrastructure needed | O(n^2) pairwise comparison (acceptable for n < 100 spans) |
| Naturally improves cross-facet dedup (catches paraphrases) | May deprioritize the "best" quote in favor of diversity |

### 2B. Wire up real cross-encoder re-ranking

**What**: The codebase already has a `CrossEncoderReranker` class at `cli/retrieval/cross-encoder-reranker.ts` but it only runs in mock mode. Wire it to a real model for sentence-level re-ranking within chunks.

**Model options** (ranked by recommendation):

| Model | Params | NDCG@10 | Latency/pair | VRAM | Notes |
|-------|--------|---------|-------------|------|-------|
| ms-marco-MiniLM-L-12-v2 | 33M | ~0.395 | ~8ms | 132MB | Best effort/accuracy tradeoff |
| Jina Reranker v2 | 137M | ~0.42 | ~12ms | 548MB | 8K context, handles long passages |
| bge-reranker-v2-m3 | 568M | ~0.43 | ~25ms | 2.2GB | Best accuracy, multilingual (Greek/Latin) |
| ms-marco-MiniLM-L-6-v2 | 22M | ~0.39 | ~5ms | 88MB | Fastest, already in config |

**Serving options**:
1. **TEI (Text Embeddings Inference)** on port 8003 — purpose-built for reranking, recommended
2. **ONNX Runtime in-process** via `onnxruntime-node` — no extra daemon, ~500MB memory
3. **vLLM** — reuse existing infrastructure but suboptimal for cross-encoders

**Where**: Apply between embedding scoring and window selection in `extractWindowedSpans()`:
```
Keyword pre-filter → Embedding scoring → Cross-encoder re-rank top candidates → Window selection
```

| Pros | Cons |
|------|------|
| Cross-encoders are the gold standard for passage re-ranking | Requires deploying another model (VRAM/infra cost) |
| Joint query-document encoding captures fine-grained relevance | MS MARCO training data is web search, not philosophy |
| bge-reranker-v2-m3 handles Greek/Latin transliterations | Adds 5-10 seconds per facet at sentence level |
| Existing class just needs real mode implementation | TEI or ONNX adds deployment complexity |

---

## Priority 3 — Ranking Fusion & Dynamic Windows

### 3A. Replace linear combination with Reciprocal Rank Fusion (RRF)

**What**: The current `rank()` method uses a linear weighted sum of signals with different scales and several stubs. RRF is more robust because it operates on ranks (not raw scores), requires no normalization, and degrades gracefully when signals are miscalibrated.

**Where**: `src/god-agent/core/composition/quote-ranker.ts:194-227`

**Algorithm**:
```
RRF(d) = sum over rankers: 1 / (K + rank_r(d))   where K = 60
```

**Signals to rank independently**:
1. Facet alignment (embedding cosine — from Priority 1B)
2. Retrieval relevance (core_relevance_score from retrieval)
3. Source authority (doc_authority_tier, inverted)
4. Binding potential (bound vs. unbound)
5. OCR quality (ocr_risk_score, inverted — currently computed but unused)
6. Quote length suitability (penalize < 40 chars or > 400 chars)

| Pros | Cons |
|------|------|
| No score normalization needed | Loses magnitude information (a slightly-better span ranks the same as a much-better one) |
| Robust to miscalibrated/stub signals | K=60 constant may need tuning for small candidate sets |
| Well-studied, production-proven (Elasticsearch uses RRF) | More complex to debug than linear combination |
| Handles heterogeneous signal types naturally | Cannot weight signals differently (all ranks treated equally) |

**Variant**: Weighted RRF — multiply each term by a signal weight to preserve the existing `QuoteRankSpec` weights.

### 3B. Dynamic discourse-aware window sizing

**What**: Replace fixed 3-sentence windows with discourse-boundary-aware expansion. Window size varies by intended support kind and argument structure.

**Where**: `src/god-agent/retrieval/faceted-retrieval.ts:428-592`

**Rules**:
- `DIRECT_QUOTE`: 1-2 sentences (tight, precise citation)
- `PARAPHRASE_SUPPORTED`: 3-5 sentences (capture the argument)
- `INFERENCE`: 3-5 sentences (enough context for the reader to follow the reasoning)
- Expand to discourse markers: stop at "however", "moreover", "therefore", "in contrast"
- Cap at 5 sentences max

| Pros | Cons |
|------|------|
| Produces more natural citation boundaries | Discourse markers are language-specific heuristics |
| Shorter windows for direct quotes reduce noise | Requires knowing the intended support kind at retrieval time |
| Longer windows for paraphrase capture full arguments | Variable window sizes complicate fingerprinting |
| Aligns window granularity with citation purpose | May extract overly long spans for paraphrase contexts |

---

## Priority 4 — LLM-as-Judge & Entailment Checking

### 4A. Claude-based post-binding quality verification

**What**: After claim-atom-binder binds quotes to atoms, run Claude as a judge on the ~10-30 bound quotes to assess multi-dimensional quality. Quotes scoring below threshold trigger re-binding with next-best candidate.

**Where**: New step between `ClaimAtomBinder.bind()` and prose generation in `icp-orchestrator.ts`

**Assessment dimensions**:
```json
{
  "relevance": "0-1 — Does this quote support the facet claim?",
  "quotability": "0-1 — Is this a clean, citable passage?",
  "argumentative_weight": "0-1 — How strong as evidence?",
  "source_authority": "0-1 — Primary vs. secondary source fit?",
  "contextual_fit": "0-1 — Does it fit the argumentative flow?"
}
```

**Cost estimate**: ~10-30 bound quotes * ~$0.005/assessment = $0.05-0.15 per pipeline run

| Pros | Cons |
|------|------|
| Most accurate quality assessment possible | Adds $0.05-0.15 and ~30-60s per pipeline run |
| Captures argumentative relevance (not just semantic) | LLM quality judgments can be inconsistent |
| Only scores bound quotes (not all candidates) | Requires Anthropic API availability |
| Multi-dimensional scoring enables fine-grained filtering | Re-binding on failure adds pipeline complexity |
| Can generate human-readable rationales | Risk of circular reasoning (LLM writes + LLM judges) |

### 4B. NLI entailment checking for claim-quote pairs

**What**: Deploy a DeBERTa NLI model to verify that bound quotes actually entail their associated claim atoms. This catches "topically relevant but argumentatively irrelevant" quotes.

**Model**: `microsoft/deberta-v3-base-mnli-fever-anli` (~86M params, ~92% NLI accuracy)

**Where**: Runs alongside or instead of 4A as a cheaper automated check

| Pros | Cons |
|------|------|
| Cheap and fast (~5ms per pair) | NLI models trained on general text, not philosophy |
| Directly measures evidential support | May struggle with complex philosophical arguments |
| Binary signal (entails/contradicts/neutral) is easy to act on | Requires deploying another model |
| Can run on every candidate, not just bound quotes | Academic claims often require interpretation, not strict entailment |

---

## Priority 5 — Long-Term Architecture

### 5A. Late chunking for sentence embeddings

**What**: Instead of embedding sentences independently, pass the full chunk through the embedding model and extract per-sentence embeddings from hidden states at sentence boundaries. Each sentence embedding is contextualized by its surrounding text.

**Impact**: Significantly better sentence-level embeddings (each sentence "knows" its context)
**Effort**: Requires modifying the embedding service API to expose per-token hidden states
**Prerequisite**: Custom inference code or a model that supports this natively (Jina embeddings v3 does)

### 5B. Proposition-level chunking at ingestion

**What**: Re-ingest the corpus with proposition-level splitting where each chunk = one atomic claim/fact. Maintain original paragraph chunks as "parent documents" for context expansion.

**Impact**: Dramatically improves retrieval precision (each chunk exactly matches one query concept)
**Effort**: High — requires re-ingesting entire corpus + maintaining dual index
**Model**: Use an LLM to decompose paragraphs into propositions (Dense X Retrieval approach)

### 5C. Hierarchical multi-granularity indexing

**What**: Index at sentence, paragraph, and section levels simultaneously in ChromaDB with separate collections. Retrieve at sentence-level for precision, expand to paragraph-level for context.

**Impact**: Best-of-both-worlds: precise retrieval + rich context
**Effort**: High — triple storage, complex retrieval logic
**Prerequisite**: ChromaDB supports multiple collections (already has `metaphysics`, `new_media`, `rhetorical_ontology`)

---

## Implementation Sequence

```
Phase 1 (Week 1-2): Embedding-based scoring
  ├─ 1A: Replace scoreSentenceRelevance with embedding scoring
  ├─ 1B: Implement real scoreFacetAlignment
  └─ Tests: Compare quote selection quality before/after on test prompts

Phase 2 (Week 2-3): Diversity & re-ranking
  ├─ 2A: Add MMR diversity selection per facet
  ├─ 2B: Deploy cross-encoder model + wire real mode
  └─ Tests: Measure span diversity (distinct docs, distinct arguments)

Phase 3 (Week 3-4): Ranking & windows
  ├─ 3A: Replace linear fusion with RRF
  ├─ 3B: Dynamic discourse-aware windows
  └─ Tests: End-to-end pipeline run, compare output prose quality

Phase 4 (Week 4-5): Quality verification
  ├─ 4A: LLM-as-judge post-binding check
  ├─ 4B: NLI entailment checking (optional, if VRAM permits)
  └─ Tests: Citation accuracy audit on generated sections

Phase 5 (Future): Architecture evolution
  ├─ 5A: Late chunking
  ├─ 5B: Proposition-level re-ingestion
  └─ 5C: Hierarchical indexing
```

---

## Key Model Recommendations

| Role | Model | Why |
|------|-------|-----|
| Sentence embedding | gte-Qwen2-1.5B (existing) | Already deployed, good sentence-level quality |
| Cross-encoder reranker | bge-reranker-v2-m3 (if VRAM) or MiniLM-L-12-v2 (fallback) | Best accuracy for multilingual academic text |
| NLI entailment | deberta-v3-base-mnli-fever-anli | Lightweight, high NLI accuracy |
| LLM-as-judge | Anthropic Claude (existing) | Already in pipeline, best reasoning quality |

## Risk Factors

1. **GPU VRAM contention**: Qwen2.5-Coder-32B already uses most VRAM. Adding a reranker model may require swapping or time-sharing.
2. **Embedding service dependency**: If GPU has CUDA errors (known issue), all embedding-based scoring fails. Need robust fallback to keyword scoring.
3. **Latency budget**: Each improvement adds latency. Total pipeline time must remain < 5 minutes per section.
4. **Philosophy domain gap**: All recommended models are trained on general/web text. Philosophy-specific fine-tuning may be needed for optimal results.
5. **OCR quality**: Garbled text produces poor embeddings regardless of model quality. OCR repair (existing auto-verifier) should run before embedding.
