# Perplexity Research Synthesis (2024-2026 SOTA for the design problem)

**Date:** 2026-04-18
**Source:** 4 parallel Perplexity Sonar-Pro queries (raw JSON in `perplexity/`)

---

## TL;DR — what's actually new since 2024

1. **Hybrid graph+vector retrieval beats chunk-only by 15-30% NDCG@10 on multi-hop reasoning.** This is the consensus 2024-2026 finding (arXiv:2506.05690).
2. **Best fusion formula:** `score = α · cos-sim + (1-α) · |C_q ∩ C_c| / |C_q ∪ C_c|` with α≈0.7, where `C_q` and `C_c` are the *concept sets* extracted from query and chunk. +25% NDCG@10 in HippoRAG-style pipelines.
3. **Concept identity preservation across multiple authors** (the central problem here) is best handled by **Neo4j LLM Graph Builder + custom Cypher coref** or **Cognee** (modular doc-level entity canonicalization). GraphRAG re-extracts concepts per corpus; LightRAG only embeds them. Neither preserves identity natively across pipelines.
4. **PaperTrail (2026)** = best practical pattern for extracting claims+evidence from scholarly PDFs: 3-stage (offline paper-level extraction → real-time answer extraction → claim-evidence matching), Gemini-2.5-Pro 10-shot, SPECTER embeddings, section-aware segmentation.
5. **Toulmin/Walton extraction** does not have a polished off-the-shelf tool for long-form philosophy. Hand-rolled prompts on Sonnet-class models (with section context) are still SOTA.
6. **Concept-to-chunk grounding** (assigning each chunk a set of ontology-node hits) is the single biggest enabler for ontology-aware retrieval. Pipeline: spaCy/LLM extract → bi-encoder embed (BGE-large or GTE-Qwen) → link to ontology via bi-encoder + threshold → store in vector DB metadata.

---

## Approach Comparison Table (compressed)

| System | Strength for our use case | Cost | Verdict |
|--------|---------------------------|------|---------|
| **GraphRAG (MSFT)** | Hierarchical communities, global summaries | High LLM cost, ~$0.50-2/MB | Overkill; re-extracts → loses curated ontology |
| **LightRAG** | Dual-level coarse/fine retrieval, cheap | Low | Use the *retrieval pattern*, ignore the extraction |
| **Neo4j LLM Graph Builder** | Custom edge types, Cypher, vector co-storage | Med | Best fit for OUR case (custom controlled vocab) |
| **HippoRAG** (NeurIPS 2024) | +28% NDCG@10, GNN concept aggregation | Med | Use the concept-pooling idea |
| **Cognee** | Modular doc-level coref | Low-med | Best alternative to Neo4j if we stay file-based |
| **PaperTrail** (2026) | Claim+evidence extraction over PDFs | Med (Gemini call/page) | Adopt the 3-stage pipeline |
| **RankRAG** | PageRank reranking on retrieved subgraph | Low | Use as reranker on top of vector |

---

## What this means for our implementation

The 2024-2026 SOTA validates the architecture we already have *partially*:

**We already have** (and these are correct moves per SOTA):
- Hand-curated philosophy ontology (the most expensive thing — done)
- Controlled-vocabulary edge types (Neo4j-style — done as JSON)
- Cross-pipeline hooks (bridges, the rare humanities innovation — done as MD)

**SOTA says we are missing**:
1. **Concept embeddings co-stored with nodes** (so ontology becomes searchable, not just keyword-matchable)
2. **Concept-to-chunk grounding** (each chunk metadata = list of ontology-node hits)
3. **Hybrid score fusion** (not just keyword expansion of the query)
4. **Per-PDF claim extraction pipeline** (PaperTrail pattern — for secondary lit like Nussbaum)
5. **Concept-canonicalization across pipelines** (Neo4j-style coref so a new author's "imagination" links to existing `phantasia` node)

**SOTA says we are over/under-shooting**:
- We don't need a full Neo4j install; our compiled-index.json with added embedding column + Cypher-style traversal can give 80% of the value at 5% the operational cost.
- We don't need GraphRAG's hierarchical communities; we already have *manual* communities (per-author syntheses).
- We DO need a small embedding-aware concept-resolver — this is the single biggest leverage point.

---

## Specific tools/repos worth borrowing patterns from

| Pattern | Borrow from | What we copy |
|---------|-------------|--------------|
| Concept embedding co-store | LightRAG, HippoRAG | `concept_id → embedding` in same DB as chunks |
| Score fusion `0.7·cos + 0.3·jaccard` | HippoRAG / arXiv:2506.05690 | Wrap our existing retriever |
| Per-PDF claim extraction | PaperTrail (2026) | 10-shot prompt template, section segmentation |
| Custom edge types in graph | Neo4j LLM Graph Builder | Already have (controlled vocab JSON) |
| Bi-encoder concept resolver | spaCy + BGE-reranker pattern | Use our existing GTE-Qwen embedder |
| Cross-author canonicalization | Cognee modular coref | LLM prompt: "Is X in author A the same concept as Y in author B?" |

---

## Recommended target architecture

```
NEW PDF (e.g., Nussbaum)
    │
    ├─► [a] Existing chunker (no change)
    │       → ChromaDB chunks
    │
    └─► [b] NEW: PaperTrail-style claim extractor
            → claims.jsonl: {id, claim, evidence, section, author, year, citations}
                │
                └─► NEW: concept resolver (LLM + bi-encoder)
                    → concept-mentions.jsonl: {chunk_id, ontology_node_id, score, span}
                        │
                        ├─► PATCH chunk metadata in ChromaDB (add ontology_hits[])
                        ├─► PATCH compiled-index.json (add new ontology nodes if novel)
                        └─► NEW: cross-author bridge candidate generator
                                → bridge-candidates.jsonl: {sourceConcept, targetConcept, evidence, score}
                                    └─► human review → promote to crossPipelineHooks

WRITE-TIME RETRIEVAL
    │
    ├─► query → existing query expansion (keep)
    ├─► ontology resolver → C_q (concept set for query)
    ├─► hybrid score: 0.7·cos + 0.3·|C_q ∩ C_c|/|C_q ∪ C_c|
    └─► return chunks + active hooks/tensions (raise cap from 1→3)
```

---

## Caveats

- Perplexity returned thin results for argument-mining and cross-document NLP queries (q2/q3). The plan below relies more on the systems-level findings (q1/q4) and on adapting known patterns to our existing assets, rather than on a single SOTA paper.
- Custom controlled-vocabulary edges + Greek/German term tracking + per-Bekker grounding are *not* in any SOTA framework. Our existing analytical layer is more domain-rich than anything SOTA offers; the upgrade is in *operationalizing* it, not replacing it.
