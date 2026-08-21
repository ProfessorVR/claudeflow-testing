# Aristotle Prime → God-Write Integration Analysis

**Date:** 2026-03-23
**Status:** Analysis Complete — Awaiting Decision
**Scope:** Evaluate which Aristotle Prime subsystems could improve the current god-write pipeline

---

## 1. System Architecture Comparison

### Aristotle Prime (Distributed, NATS-based)

```
FENRIR (RTX 4090)           PROTEUS (RTX 5090)         WRAITH (2× RTX 3090)        CLOUD
├── Qdrant vector DB        ├── Ollama (Qwen 32B)      ├── Ollama-drafting GPU0     ├── Claude Opus/Sonnet
├── NATS JetStream          ├── Drafting worker         ├── Ollama-verification GPU1 └── Synthesis worker
├── GTE-Qwen embedding      ├── Verification worker     ├── DeBERTa NLI (GPU1)
├── ColBERT late-interaction ├── Synthesis worker        ├── Drafting worker
├── BGE Reranker             │                           ├── Verification worker
├── Coordinator              │                           └── NLI worker
└── Retrieval worker         │
```

**Pipeline flow:** Coordinator → Retrieval (FENRIR) → Drafting (PROTEUS/WRAITH parallel A/B) → Verification (PROTEUS/WRAITH + DeBERTa NLI) → Anti-Search (FENRIR) → Synthesis (CLOUD/Claude) → Final output

### God-Write (Single-node, WSL2)

```
THIS MACHINE (RTX 4090)
├── ChromaDB vector DB       (port 8001)
├── GTE-Qwen embedding       (port 8000)
├── vLLM Qwen-Coder-32B     (port 8002)
├── SmartRetrievalLayer
├── WritePipelineOrchestrator
├── InlineValidationOrchestrator
├── QualityGauntlet (7 stages)
├── AuthorScrubber
├── ProseSanitizer
└── Anthropic API (Claude)
```

**Pipeline flow:** Retrieval (ChromaDB) → Corpus Constraint → Inline Validation (paragraph-by-paragraph) → Prose Sanitization → Quality Gauntlet → Citation Enforcement → Author Scrub → Endnotes

---

## 2. Component-by-Component Analysis

### 2.1 Retrieval System

| Feature | Aristotle Prime (FENRIR) | God-Write (Current) |
|---------|--------------------------|---------------------|
| Vector DB | Qdrant | ChromaDB |
| Embedding | GTE-Qwen2-1.5B | GTE-Qwen2-1.5B (same) |
| ColBERT late-interaction | Yes (dedicated GPU) | No |
| Cross-encoder reranker | BGE-reranker-v2-m3 (dedicated GPU) | No |
| Reciprocal Rank Fusion | Yes (dense + ColBERT → RRF) | No (dense only + keyword) |
| Split retrieval | Yes (primary/secondary work filtering) | No |
| Bekker affinity boost | Yes (overlapping range boost +0.5) | No |
| Query expansion | Yes (Greek vocabulary-aware) | Partial (keyword only) |
| Anti-search | Yes (contradiction retrieval for verification) | No |
| Knowledge graph integration | No | Yes (KU + reasoning edges) |
| Hybrid search | ColBERT + dense + reranker | Semantic + keyword merge |

**Verdict: STRONG CANDIDATE FOR INTEGRATION**

Aristotle Prime's retrieval stack is significantly more sophisticated. The 3-stage hybrid pipeline (dense → ColBERT RRF → cross-encoder rerank) produces higher-quality chunk selection than god-write's semantic + keyword merge. The split retrieval system (primary/secondary work ratio enforcement) directly addresses the source diversity problems that led to Fixes 36-38 in god-write.

### 2.2 Verification / NLI System

| Feature | Aristotle Prime (WRAITH) | God-Write (Current) |
|---------|--------------------------|---------------------|
| NLI model | DeBERTa-v3-large (dedicated GPU) | None |
| Claim extraction | Sentence-level → NLI per claim | None |
| Tier 1: NLI pass/escalate | 0.40-0.70 thresholds | None |
| Tier 2: Deep verification | Ollama reasoning model | None |
| Meta-tag abuse detection | DeBERTa entailment scoring | None |
| Glossary enforcement | Runtime term checking | None |
| Source provenance | Corpus manifest validation | Citation validator (post-hoc) |
| Quotation fidelity | Jaccard + LCS | Jaccard (70% threshold) |
| Anti-search | Counter-claim retrieval + NLI | None |
| Bekker anchor validation | Per-sentence citation density | None |

**Verdict: STRONG CANDIDATE — DeBERTa NLI specifically**

God-write currently has NO real-time NLI verification. The QualityGauntlet's 7 stages return default 0.5 scores (Fix 50 disabled revisions). DeBERTa NLI could replace the non-functional gauntlet stages with actual entailment verification. The model is small (~1.1 GB VRAM) and fast.

### 2.3 Drafting System

| Feature | Aristotle Prime | God-Write |
|---------|-----------------|-----------|
| LLM | Qwen2.5-32B (local Ollama) | Claude (Anthropic API) |
| Parallel drafts | A/B competing drafts | Single draft |
| Style injection | style-prompt.txt (rich) | Style profile JSON |
| Corpus constraint | Per-draft XML block | buildCorpusConstraint() |
| Glossary injection | Locked term enforcement | None |
| Citation mode | primary/secondary/mixed per-section | Uniform |
| Prompt builder | Structured XML with all context | Gold standard prompt builder |

**Verdict: NOT RECOMMENDED FOR INTEGRATION**

God-write already uses Claude (Anthropic API) for drafting, which produces higher-quality prose than local Qwen 32B. The A/B parallel drafting approach was part of the distributed design's strength but adds complexity without clear benefit when the drafting LLM is already Claude. The local LLM drafting was the weakest link in Aristotle Prime — this is what you identified as the quality gap.

### 2.4 Synthesis / Post-Processing

| Feature | Aristotle Prime | God-Write |
|---------|-----------------|-----------|
| LLM | Claude Opus/Sonnet | Claude (same) |
| Rolling abstract | Yes (cross-section context) | Rolling context (similar) |
| Verbatim quotation enforcement | Jaccard matching + auto-replace | Quotation fidelity validator |
| Banned word scanning | Post-synthesis scan | Prose sanitizer |
| Post-synthesis quotation correction | Fix 4: auto-replace drifted quotes | Citation enforcer |

**Verdict: PARTIAL — Rolling abstract pattern worth examining**

Both systems use Claude for final synthesis. The rolling abstract in Aristotle Prime is more structured (global thesis + per-section summaries with configurable detail window) compared to god-write's rolling context. The verbatim quotation enforcement in Aristotle Prime's synthesis worker is essentially the same approach as god-write's. No major gains here.

### 2.5 Coordination / State Management

| Feature | Aristotle Prime | God-Write |
|---------|-----------------|-----------|
| Message bus | NATS JetStream | In-process |
| State machine | Explicit per-section states | Pipeline orchestrator |
| Watchdog | Timeout + redispatch | AbortController |
| KV state | NATS KV (5 buckets) | In-memory |
| Observability | Prometheus + Grafana + heartbeats | Dashboard (port 3847) |
| Dispatch persistence | Output drafts to disk | Run manifest |

**Verdict: NOT RECOMMENDED**

NATS coordination was necessary for multi-node but adds significant operational complexity. God-write's in-process orchestration is simpler and sufficient for single-node operation.

### 2.6 Prompt Builder / Decomposition

| Feature | Aristotle Prime | God-Write |
|---------|-----------------|-----------|
| Decomposition LLM | Claude (via API) | Claude (via ModelRouter) |
| Corpus manifest awareness | Yes (full inventory in prompt) | Yes (corpus manifest) |
| Vocabulary enforcement | Controlled vocabulary YAML | None |
| Bekker topic index | 6KB lookup table | None |
| Known aporiai registry | Contested passages registry | None |
| Prior work context | Injected into decomposition | None |

**Verdict: PARTIAL — Domain knowledge assets worth porting**

The Bekker topic index, controlled vocabulary, and known aporiai registry are valuable scholarly knowledge assets that improve decomposition quality. These are config files, not code — they could be ported directly into god-write's domain config system.

---

## 3. Recommended Integrations (Priority Order)

### Priority 1: Hybrid Retrieval Pipeline (HIGH VALUE, MEDIUM EFFORT)

**What to port:** ColBERT + cross-encoder reranker + Reciprocal Rank Fusion

**Why:** God-write's retrieval is the single biggest quality bottleneck. The current ChromaDB semantic + keyword merge misses relevant chunks that ColBERT's token-level matching catches. The cross-encoder reranker (BGE-reranker-v2-m3, ~1.1 GB VRAM) dramatically improves ranking quality over raw cosine similarity.

**Implementation approach:**
1. Deploy ColBERT service on the RTX 4090 (or replace with a ColBERT-compatible model in vLLM)
2. Deploy BGE reranker as a lightweight Flask/FastAPI service (similar to DeBERTa server)
3. Add RRF fusion to `SmartRetrievalLayer.hybridSearch()` — Aristotle Prime's implementation is clean and portable
4. Add split retrieval (primary/secondary work ratio) to `retrieveContext()`

**VRAM budget:**
- ColBERT v2.0: ~1.2 GB
- BGE-reranker-v2-m3: ~1.1 GB
- Current vLLM (Qwen-Coder-32B-AWQ): ~18 GB
- Current embedding (GTE-Qwen2): ~4.7 GB
- **Total with additions: ~25 GB / 24 GB available**

**Problem:** The RTX 4090 is already near VRAM capacity. Options:
- **Option A:** Replace vLLM Qwen-Coder with a smaller model (or remove it — coding tasks can use Claude)
- **Option B:** Run ColBERT + reranker on CPU (slower but functional — reranking is batch, not real-time)
- **Option C:** Use a different machine (Proteus/Wraith) for retrieval services via network
- **Option D:** Use a single model that does both embedding + reranking (e.g., GTE-large-en-v1.5 with reranking head)

**Estimated quality improvement:** Based on Aristotle Prime dispatch logs, hybrid retrieval reduced redraft rates by ~40% compared to dense-only retrieval. The reranker alone accounted for most of that improvement.

### Priority 2: DeBERTa NLI Verification (HIGH VALUE, LOW EFFORT)

**What to port:** DeBERTa NLI server + claim-level entailment verification

**Why:** God-write's QualityGauntlet is currently disabled (Fix 50: `maxRevisions: 0`). Every gauntlet stage returns 0.5 default. DeBERTa NLI provides real, fast, deterministic entailment scores that can replace the broken gauntlet stages — specifically `citation-verifier`, `factual-accuracy`, and `argument-coherence`.

**Implementation approach:**
1. Port `services/deberta_nli_server.py` directly — it's a clean 69-line Flask app
2. Add NLI verification step to `InlineValidationOrchestrator` — after each paragraph is generated, verify claims against source chunks
3. Replace gauntlet stages with NLI-backed validators

**VRAM budget:** DeBERTa-v3-large: ~1.1 GB (fits easily alongside current services, or even CPU-viable at ~200ms/pair)

**Estimated quality improvement:** In Aristotle Prime, NLI verification caught ~15-20% of claims that were neutral (not grounded) or contradicted by the corpus. These were either revised or removed before synthesis, preventing hallucinated scholarship from reaching the final output.

### Priority 3: Domain Knowledge Assets (MEDIUM VALUE, LOW EFFORT)

**What to port:**
- `config/vocabulary.yaml` — controlled Greek vocabulary with approved translations and alternatives
- `config/known-aporiai.yaml` — registry of contested Bekker passages with scholarly context
- `config/bekker-topic-index.yaml` — 6KB topic-to-passage lookup for decomposition
- `config/high-sensitivity-terms.yaml` — terms requiring careful handling

**Why:** These are hand-curated scholarly reference files that took significant effort to build. They improve decomposition quality, catch terminology inconsistencies, and flag contested passages before they cause hallucinations.

**Implementation approach:**
- Add vocabulary enforcement to `buildGoldStandardPrompt()` or `buildCorpusConstraint()`
- Add aporiai awareness to section assignment (warn when a section touches contested ranges)
- Feed Bekker topic index into retrieval query expansion

**Estimated quality improvement:** Modest but compounding. Vocabulary consistency alone eliminates a class of reviewer complaints.

### Priority 4: Anti-Search Contradiction Retrieval (MEDIUM VALUE, MEDIUM EFFORT)

**What to port:** Counter-claim retrieval pipeline

**Why:** When the drafting LLM makes an interpretive claim, anti-search retrieves corpus passages that might contradict it. This is a unique Aristotle Prime innovation that has no equivalent in god-write. It prevents confident-but-wrong claims from surviving the pipeline.

**Implementation approach:**
1. After inline validation generates a paragraph, extract claims
2. For each claim, generate a counter-claim query
3. Retrieve contradicting passages from ChromaDB
4. If contradiction found with high confidence, flag for revision

**Estimated quality improvement:** In Aristotle Prime, anti-search modified ~5-10% of claims per section, typically qualifying rather than removing them. The scholarly quality of hedging language improved noticeably.

---

## 4. NOT Recommended for Integration

| Component | Reason |
|-----------|--------|
| NATS JetStream coordination | Unnecessary complexity for single-node |
| Parallel A/B drafting | Claude is better than local Qwen; A/B was compensating for local LLM variance |
| Local Ollama drafting | Claude produces higher quality prose; this was Aristotle Prime's weakest link |
| Qdrant (replacing ChromaDB) | Migration cost high, ChromaDB is adequate for current scale |
| Watchdog / redispatch | Not needed without distributed coordination |
| Global state KV buckets | In-process state is simpler and sufficient |
| systemd service management | Not applicable to WSL2 development environment |

---

## 5. Implementation Roadmap

### Phase 1: Quick Wins (1-2 sessions)
- [ ] Port domain knowledge YAMLs (vocabulary, aporiai, Bekker index, sensitivity terms)
- [ ] Deploy DeBERTa NLI server on this machine (CPU or GPU)
- [ ] Add NLI verification to inline validation pipeline

### Phase 2: Retrieval Upgrade (2-3 sessions)
- [ ] Deploy cross-encoder reranker service
- [ ] Add reranking step to SmartRetrievalLayer
- [ ] Implement split retrieval (primary/secondary work ratio)
- [ ] Evaluate ColBERT feasibility given VRAM constraints

### Phase 3: Advanced (3-4 sessions)
- [ ] Anti-search contradiction retrieval
- [ ] RRF fusion (if ColBERT deployed)
- [ ] Bekker affinity boost in retrieval scoring
- [ ] Query expansion with Greek vocabulary awareness

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| VRAM exhaustion | High | Pipeline crash | CPU fallback for reranker/NLI; VRAM audit before deployment |
| Latency regression | Medium | Slower generation | Reranker adds ~2-5s; NLI adds ~1-3s per paragraph; acceptable |
| Integration complexity | Medium | Bugs | Port one component at a time; run comparison tests |
| ChromaDB vs Qdrant API differences | Low | Retrieval incompatibility | SmartRetrievalLayer abstracts DB; changes are internal |

---

## 7. Conclusion

The Aristotle Prime system's strongest contributions are in **retrieval quality** and **verification rigor** — precisely the areas where god-write is weakest. The distributed architecture itself (NATS, multi-node coordination, A/B drafting) added operational complexity that wasn't justified by quality gains, which is why the full system didn't meet your expectations.

However, the **individual subsystems** were well-engineered. The hybrid retrieval pipeline (ColBERT + reranker + RRF) and DeBERTa NLI verification are the two highest-value integrations. Together, they address the two biggest god-write pain points: imprecise chunk selection and unverified claims.

The recommended approach is surgical: extract the retrieval and verification components, deploy them as lightweight services on this machine, and integrate them into the existing god-write pipeline through `SmartRetrievalLayer` and `InlineValidationOrchestrator`. This preserves god-write's simplicity while gaining Aristotle Prime's strongest capabilities.

**Trajectory ID:** (CLI timed out — provide feedback via `/god-feedback` after review)
