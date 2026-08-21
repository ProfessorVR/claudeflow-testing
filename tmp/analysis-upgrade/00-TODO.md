# TODO — Concept-Aware Cross-Author Analytical Layer Upgrade

**Status:** Sandbox prototype done and tested. All items below are for promotion to live. Nothing in live corpus has been modified.

## Review artifacts (read in this order)

- [ ] `01-baseline-report.md` — audit of the prior system (strengths + 14 specific gaps)
- [ ] `02-research-synthesis.md` — 2024-2026 SOTA findings from Perplexity
- [ ] `03-implementation-plan.md` — phased upgrade design
- [ ] `04-final-summary.md` — sandbox results + A/B metrics
- [ ] `sandbox/tests/comparison-summary.md` — god-write output diff with actual prose
- [ ] `sandbox/corpus/index/Nussbaum 1985/` — 119 claims + 557 mentions + 24 bridge candidates
- [ ] `sandbox/corpus/index/Nussbaum 1985/bridge-candidates.jsonl` — review the 4 LLM-validated cross-author bridges

## Key results (already in sandbox)

- [x] Located the prior 5-pipeline (Aristotle, BCAP, B&T, Rickert, Uexküll) analytical system
- [x] Audited 14 gaps — biggest: secondary lit invisible, bridges narrative-only, Phase 5 PARKED
- [x] Perplexity research on GraphRAG / LightRAG / HippoRAG / PaperTrail / Neo4j LLM Graph Builder
- [x] Designed 7-phase additive upgrade (no rip-and-replace; file-based; backwards compatible)
- [x] Built sandbox at `tmp/analysis-upgrade/sandbox/`
- [x] Embedded 278 ontology nodes via GTE-Qwen (3.4s)
- [x] Extracted 119 claims from Nussbaum 1985 via Claude Sonnet 4.5 (~7 min)
- [x] Resolved claims → 557 ontology mentions (bi-encoder cosine)
- [x] Auto-generated 24 bridge candidates (4 substantive: alignment/extension/extension/contestation)
- [x] Recompiled sandbox index: 527 ontology nodes (+249), 142 hooks (+70), 119 claims, 557 mentions
- [x] Ran baseline + upgraded god-write on same prompt; restored live index cleanly
- [x] Measured: quality +0.022, Greek terms +5, Nussbaum citation appears for first time
- [x] **Second A/B test (targeted prompt + cap=5)** — v3 vs v1: quality +0.006, Uexküll +50%, "seeing-as" +150%
- [x] Wrote promotion-ready extended compiler (`sandbox/scripts/compile_corpus_index_v2.py`)

## Decisions to approve before promotion

- [ ] **Approve the 4 LLM-validated cross-author bridges** (especially the Uexküll contestation — verify Aristotle's aisthēmata vs phantasmata distinction is correctly characterized)
- [ ] **Approve adding 249 novel ontology nodes** from Nussbaum (auto-tagged `secondary-lit`, centrality `peripheral`) OR require human vetting first
- [ ] **Approve raising `getActiveBridges` cap from 1 → 3** per facet
- [ ] **Approve raising `getActiveTensions` cap from 3 → 5**

## Work to promote sandbox → live

- [ ] Move `tmp/analysis-upgrade/sandbox/scripts/*.py` → `scripts/analyze-secondary/` (~600 LOC)
- [ ] Add shell wrapper `scripts/analyze-secondary.sh <pdf-path>` for one-command extraction
- [ ] Extend `scripts/compile-corpus-index.py` to read `corpus/index/<paper>/{claims,concept-mentions,bridge-candidates}.jsonl`
- [ ] Add new top-level fields to `CompiledIndex` TypeScript interface: `claims`, `conceptMentions`, `bridgeCandidates`
- [ ] Add `loadActiveClaims(topic)` to `corpus-index-provider.ts` (return top-5 claims matching topic)
- [ ] Wire `activeClaims` into `write-pipeline-orchestrator.ts` prompts (new `## Secondary-Literature Claims` block)
- [ ] Raise hook/tension caps in `cross-author-utils.ts`
- [ ] Add `ontology-embeddings.jsonl` to `corpus/index/` and add concept-resolver to `smart-retrieval-layer.ts`
- [ ] (Optional) Implement hybrid scoring `0.7·cos + 0.3·jaccard` in smart-retrieval-layer

## Extraction batch (post-promotion)

- [ ] Run `analyze-secondary.sh` on the remaining secondary-lit PDFs (~30 files in `corpus/rhetorical_ontology/`, `corpus/metaphysics/`)
- [ ] Budget: ~$0.50 × 30 PDFs ≈ $15 in Sonnet 4.5 calls
- [ ] Human review of all bridge candidates tagged `needs_review: true` before promotion to `crossPipelineHooks`
- [ ] Recompile `corpus/index/compiled-index.json` once after batch completes

## Nice-to-have (v2)

- [ ] Concept constellation bridges: replace per-pair `(source, target)` with multi-author clusters (phantasia ⟷ Erschlossenheit ⟷ Merkbild ⟷ ambient rhetoric)
- [ ] HippoRAG-style GNN concept aggregation for multi-hop retrieval
- [ ] Interactive concept-neighborhood explorer (Neo4j Bloom or custom D3) for dissertation writing
- [ ] Feedback loop: god-write quality-gauntlet findings flow back into bridge/claim refinement
- [ ] Bridge graph auto-generation Mermaid file (currently `aristotle-graph-cross-pipeline.mmd` is static)

## Known risks

- Bi-encoder threshold 0.55 over-matches on generic English terms ("Perception" fires for many claims). Tightening to 0.65 drops coverage but improves precision.
- 66 direct-Aristotle hooks are unvetted (not LLM-validated). These should probably be tagged `low-confidence` in prompt injection.
- Cost scaling: each secondary-lit PDF is ~$0.50. A 50-paper library = ~$25. Worth it once; painful if reruns are needed.
