# KU & Reasoning Edge System: Limitations Resolution Plan

**Status**: Living Document
**Created**: 2026-03-18
**Revised**: 2026-03-18 (incorporated user review feedback)
**Source**: `docs/ku-reasoning-system-technical-report.md` Section 16
**Tracks**: 9 active limitations + 6 future work items + 2 additional elements

---

## Priority Legend

| Priority | Meaning | Criteria |
|----------|---------|----------|
| **P0** | Blocking | Directly degrades generation quality or loses data |
| **P1** | High | Significant coverage/accuracy gap, moderate effort |
| **P2** | Medium | Improves robustness or developer experience |
| **P3** | Low | Nice-to-have, research-grade enhancements |

---

## Phase 1: Data Coverage (P0-P1)

### 1.1 Expand KU Database from 10 → 50+ KUs

**Limitation**: Only 10 KUs exist. Phase 7 pairwise reasoning produces negligible output (45 pairs). Edge coverage is dominated by manual bootstrap.

**Resolution**:
1. Run batch `god-learn update --query "..."` across all 6 analysis domains
2. Target queries per domain:
   - **aristotle**: phantasia faculty, De Anima III, aisthesis/phantasia distinction, dynamis/energeia, dual trace (antichesis)
   - **heidegger (bt)**: Dasein/being-in-the-world, hermeneutical-as/apophantical-as, temporality, care structure, Befindlichkeit
   - **heidegger (bcap)**: GA 18 rhetorical ontology, pathos, logos, Aristotle reception
   - **rickert**: ambient rhetoric, disclosure, rhetorical situation
   - **uexkull**: Umwelt, functional cycle, Bedeutungslehre, biosemiotic sign, Merkwelt/Wirkwelt
   - **phantasia**: phantasma formation, kinesis/chronos, rhetorical phantasia
3. After each batch: verify Phase 7 auto-triggers and produces meaningful edges
4. Goal: 50+ KUs, Phase 7 producing 100+ auto-derived edges

**Priority**: P0
**Effort**: Medium (scripted batch runs, manual query curation)
**Depends on**: Nothing (can start immediately)
**Acceptance**: `wc -l god-learn/knowledge.jsonl` >= 50; Phase 7 output >= 100 edges

---

### 1.2 Backfill knowledge_ids on 663 Orphaned Edges

**Limitation**: 79.7% of edges have empty `knowledge_ids`, making them invisible to KU-overlap surfacing in Phase 9 Path 1.

**Resolution**:
1. Write a script `scripts/backfill-edge-ku-links.py` that:
   - Loads all KUs from `god-learn/knowledge.jsonl`
   - For each edge, constructs the string `"{source} {relation} {target}"` and embeds it via gte-Qwen2-1.5B-instruct (port 8000)
   - Embeds each KU `claim` text via the same model
   - Computes cosine similarity between edge embeddings and KU claim embeddings
   - If best cosine similarity >= 0.65, adds the KU's `id` to the edge's `knowledge_ids`
   - Writes updated edges back to `god-reason/reasoning.jsonl`
2. Run after each KU expansion (Task 1.1)
3. Track orphan reduction metrics per run

**Design rationale**: Jaccard word overlap on short concept strings (e.g., "attunement") against full-sentence KU claims produces too many false positives. Semantic embedding via the existing gte-Qwen2 infrastructure captures equivalences like "temporal awareness" ↔ "time-consciousness" that lexical matching misses entirely.

**Priority**: P0
**Effort**: Low-Medium (single script; embedding infra already running on port 8000)
**Depends on**: 1.1 (more KUs = more linkable edges), embedding server running
**Acceptance**: Orphaned edges < 40% (down from 79.7%); spot-check 20 links for semantic validity

---

### 1.3 Backfill chunk_id Provenance on Existing KUs

**Limitation**: All 10 KUs have `chunk_id: null`. Phase 9 chunk-level overlap scoring returns zero. These KUs can only be found via doc_id or lexical matching.

**Resolution**:
1. For each KU, use the `claim` text as a retrieval query against ChromaDB
2. Pick the best-matching chunk (highest cosine similarity) from the KU's `doc_id` collection
3. Backfill `chunk_id` and `pages` fields
4. Run as part of the `god-learn update` cycle

**Priority**: P1
**Effort**: Low (single retrieval call per KU)
**Depends on**: ChromaDB running, existing KUs
**Acceptance**: All KUs have non-null `chunk_id`

---

## Phase 2: Quality & Accuracy (P1)

### 2.1 Fuzzy Corroboration Matching

**Limitation**: Corroboration scorer requires exact (source, relation, target) triple matches. Near-matches like "phantasia" vs "phantasia (I9)" are missed.

**Resolution**:
1. Extend `scripts/compute-corroboration.py` with fuzzy matching:
   - Normalize concept names: strip parenthetical qualifiers, lowercase, remove diacritics
   - Apply Jaccard similarity on normalized forms with threshold >= 0.8
   - Optional: use Levenshtein distance as tiebreaker
2. Add a `corroboration_method` field to edges: `"exact"` or `"fuzzy"`
3. Weight fuzzy matches lower (e.g., 1.3 instead of 1.5 for 2-pipeline fuzzy match)

**Priority**: P1
**Effort**: Medium
**Depends on**: Nothing
**Acceptance**: Corroborated triples increase from 3 to 10+

---

### 2.2 Resolve Contradictions + Add Ingestion-Time Contradiction Gate

**Limitation**: 1 confirmed contradiction exists: `resonant_motion contrasts_with resonant_affect` vs `resonant_motion supports resonant_affect` (both phantasia pipeline). More critically, the system allows contradictory edges to be ingested without any warning.

**Resolution (Part A — manual cleanup)**:
1. Review the source CSV entries for both edges
2. Consult the phantasia analysis notes to determine correct relationship
3. Remove or reclassify the incorrect edge
4. Also resolve the 2 potential contradictions:
   - `phantasia contrasts_with aisthesis` vs `phantasia depends_on aisthesis` — these may be legitimately non-contradictory (Aristotle distinguishes phantasia FROM aisthesis but phantasia DEPENDS ON sense-perception). Document the nuance.
   - `Apophantical-As contrasts_with Hermeneutical-As` vs `Apophantical-As depends_on Hermeneutical-As` — same pattern (derived-from but distinct). Document.

**Resolution (Part B — preventative gate)**:
1. Add a contradiction check to the `god-learn update` pipeline (in `god_learn.py` or as a post-Phase-7 hook)
2. Before committing new edges to `reasoning.jsonl`, scan for conflicts against existing edges
3. Distinguish two severity levels:
   - **Hard contradiction** (A supports B + A contrasts_with B): **block ingestion**, prompt user via CLI for resolution
   - **Soft tension** (A depends_on B + A contrasts_with B): **flag as warning**, log to `review-queue.json`, allow ingestion to proceed
4. The distinction matters because soft tensions are philosophically legitimate — Aristotle's phantasia genuinely both contrasts with and depends on aisthesis

**Priority**: P1
**Effort**: Low (Part A) + Medium (Part B)
**Depends on**: Nothing
**Acceptance**: `review-queue.json` contradictions = 0; new contradictory edges are blocked at ingestion time

---

### 2.3 Fix Phase 7 Vocabulary Mismatch

**Limitation**: `VOCAB_MAP` is lossy — the `similar` relation type was dropped. Phase 7's Jaccard-based classification is coarse (only 4 relation types vs 14 canonical types).

**Resolution**:
1. Add `similar` → `supports` mapping (closest canonical equivalent: weak support without causal mechanism)
2. Enrich `infer_relation()` with additional marker sets for more canonical types:
   - `defined_as` markers: "is defined as", "means", "refers to"
   - `refines` markers: "more precisely", "narrower", "specifically"
   - `presupposes` markers: "requires", "assumes", "prior to"
3. This is an interim fix until LLM edge derivation (2.4) replaces the heuristic

**Priority**: P2
**Effort**: Low
**Depends on**: Nothing
**Acceptance**: Phase 7 produces edges with 6+ distinct relation types (up from 4)

---

### 2.4 Activate LLM Edge Derivation

**Limitation**: `scripts/llm-edge-derivation.py` generates prompts but does not execute LLM calls. The Jaccard-based Phase 7 approach is too coarse for meaningful relationship classification.

**Resolution**:
1. Complete the LLM call implementation in `llm-edge-derivation.py`:
   - Use Anthropic Claude for classification (academic tasks → Anthropic per routing rule)
   - Prompt structure: present two KU claims, ask LLM to classify relationship from the 14 canonical types
   - Include a "none" option for unrelated pairs
2. Add confidence scoring from LLM response
3. Integrate into the `god-learn update` pipeline as a Phase 7b step
4. **Two-stage cost control** (50 KUs = 1,225 pairs):
   - **Stage 1 (free)**: Pre-filter with Jaccard overlap >= 0.04 AND semantic embedding cosine similarity >= 0.5 (via gte-Qwen2 on port 8000). This eliminates clearly unrelated pairs, reducing ~1,225 → ~200-300 candidates.
   - **Stage 2 (Anthropic)**: Classify only the filtered pairs. At ~300 pairs × ~500 tokens each = ~150K tokens — manageable.
5. Mark LLM-derived edges with `derivation: "llm"` and `generation_epoch` (see Task 5.2)

**Cost note**: vLLM (Qwen2.5-Coder) was considered for Stage 2 to reduce cost, but the Coder model is optimized for code generation, not philosophical relationship classification. It would perform poorly at distinguishing `presupposes` from `depends_on` in a Heideggerian context. If a general-purpose model is added to vLLM, tiered routing becomes viable.

**Priority**: P1
**Effort**: Medium-High (LLM integration, prompt engineering, cost management)
**Depends on**: 1.1 (more KUs makes this worthwhile), embedding server for Stage 1 pre-filter
**Acceptance**: LLM-derived edges with 14-type vocabulary; spot-check 20 edges for accuracy >= 85%; API cost < $5 per batch run

---

## Phase 3: Generation Quality (P1-P2)

### 3.1 Structural-to-Prose Mapping

**Limitation**: The STRUCTURAL RELATIONSHIPS prompt block provides concept-level constraints but the LLM sometimes enumerates relationships instead of weaving them into prose.

**Resolution**:
1. Modify the prompt block in `buildGoldStandardPrompt()` to include integration instructions:
   ```
   Use these relationships to STRUCTURE your argument — do not list them.
   Each relationship should be expressed through the flow of your prose,
   not stated as "X depends on Y". Show the relationship through analysis.
   ```
2. Add negative examples to the prompt: "Do NOT write 'phantasia presupposes aisthesis'; instead write 'Aristotle's account of phantasia is grounded in the prior operation of sense-perception...'"
3. Test with 3 god-write runs to verify prose quality improvement

**Priority**: P1
**Effort**: Low (prompt engineering only)
**Depends on**: Nothing
**Acceptance**: Manual review of 3 generations shows no enumeration-style relationship listing

---

### 3.2 Fix Endnote Reference Artifacts

**Limitation**: Endnote markers leak into main text in multi-step generation modes.

**Resolution**:
1. Audit the prose sanitizer (`author-scrubber.ts` and related) for endnote marker patterns
2. Add regex patterns to catch leaked endnote markers (e.g., `[1]`, `[EN1]`, superscript numbers)
3. Ensure the sanitizer runs AFTER endnote generation, not before

**Priority**: P2
**Effort**: Low
**Depends on**: Nothing
**Acceptance**: Multi-step generation output contains zero endnote artifacts in main text

---

## Phase 4: Infrastructure (P2-P3)

### 4.1 Real-Time Memory Server Integration

**Limitation**: `sync-ku-to-memory.py` writes a static JSON snapshot. No real-time queries or incremental updates.

**Resolution**:
1. Define a KU/edge query protocol for the memory server:
   - `GET /knowledge?domain=aristotle` — filter KUs by domain
   - `GET /edges?source=phantasia&limit=10` — filter edges by concept
   - `POST /knowledge` — add a new KU (incremental)
   - `POST /edges` — add new edges (incremental)
2. Implement in the memory server daemon
3. Replace `sync-ku-to-memory.py` with event-driven push from `god-learn update`

**Priority**: P2
**Effort**: High (protocol design + daemon integration)
**Depends on**: Memory server architecture decisions
**Acceptance**: `god-learn update` pushes new KUs/edges to memory server without manual sync

---

### 4.2 Community Detection on Knowledge Graph

**Limitation**: The 670-node graph has no structural analysis beyond per-pipeline edge counts.

**Resolution**:
1. Implement Leiden algorithm (or Louvain) clustering in `scripts/graph-visualize.py`
2. Dependencies: `networkx`, `leidenalg` (or `cdlib`)
3. Output: cluster assignments per node, inter-cluster edge counts, cluster labels (derived from dominant domain)
4. Use clusters to:
   - Identify thematic subgraphs (e.g., "temporal concepts in Aristotle+Heidegger")
   - Guide targeted KU promotion (prioritize under-represented clusters)
   - Improve edge filtering in god-write (prefer intra-cluster edges for focused topics)

**Priority**: P3
**Effort**: Medium
**Depends on**: 1.1, 1.2 (richer graph makes clustering meaningful)
**Acceptance**: Graph partitioned into 5-15 thematic clusters with interpretable labels

---

### 4.3 Multi-Hop Retrieval Expansion (replaces Transitive Confidence Propagation)

**Limitation**: Edge confidence is per-edge only. No mechanism to discover indirectly related concepts.

**Original approach (rejected)**: Store inferred transitive edges in `reasoning.jsonl`. This was rejected because philosophical relationships are rarely strictly transitive — "A depends_on B" + "B contrasts_with C" tells you nothing reliable about A→C. Storing inferred edges would pollute the corpus-grounded graph with hallucinated relationships.

**Resolution (retrieval-time traversal)**:
1. Extend `SmartRetrievalLayer.boostWithKnowledgeGraph()` to support multi-hop traversal:
   - Current: 1-hop traversal with 1.1x boost
   - New: 2-hop traversal with decaying boost (1.1x for 1-hop, 1.05x for 2-hop)
2. This is purely a **retrieval expansion** — no edges are stored in `reasoning.jsonl`
3. The graph remains corpus-grounded; transitive paths are only used to broaden the retrieval net
4. Add a `maxHops` parameter to the `boostWithKG` options (default: 1, max: 2)

**Priority**: P3
**Effort**: Low-Medium (extends existing traversal logic)
**Depends on**: Nothing (existing boostWithKG infrastructure)
**Acceptance**: Retrieval with `maxHops: 2` returns relevant chunks that `maxHops: 1` misses; no new edges stored

---

## Phase 5: Schema & Lifecycle (P1-P2) — Additional Elements

### 5.1 Edge Expiration / Epoch Tracking

**Motivation**: As the database expands from 10 to 50+ KUs and LLM-derived edges are added, older manual edges may become obsolete or superseded by higher-confidence edges covering the same relationship.

**Resolution**:
1. Add two fields to the edge schema:
   - `generation_epoch`: Monotonic integer incremented each time `god-learn update` runs. Cleaner than timestamps for comparison.
   - `derivation`: One of `"manual"`, `"phase7"`, `"llm"`, `"bridge"` — tracks how the edge was produced
2. Backfill existing edges: all current 832 edges get `generation_epoch: 0`, `derivation: "manual"` (or `"bridge"` for bridge edges)
3. Modify god-write edge injection to use epoch as secondary sort:
   - Primary sort: `corroboration_score` descending (existing)
   - Secondary sort: `generation_epoch` descending (newer first)
4. This naturally surfaces fresher, higher-confidence edges above stale bootstrap edges

**Priority**: P1
**Effort**: Low (schema addition + backfill script + one sort line change)
**Depends on**: Nothing
**Acceptance**: All edges have `generation_epoch` and `derivation` fields; god-write sorts by epoch as tiebreaker

---

### 5.2 Ingestion-Time Contradiction Gate

(Defined in Task 2.2 Part B — listed here for cross-reference as it spans both quality and schema concerns.)

---

## Execution Order (Recommended)

```
Quick Wins (do anytime, no dependencies):
  2.2a Resolve existing contradictions
  2.3  Phase 7 vocabulary fix
  3.1  Structural-to-prose prompt fix
  3.2  Endnote artifact fix
  5.1  Edge epoch/derivation schema addition

Phase 1 (Weeks 1-2): Data Coverage
  1.1 KU expansion (50+ KUs)          ← START HERE
  1.2 Backfill knowledge_ids (semantic embedding approach)
  1.3 Backfill chunk_id provenance

Phase 2 (Week 3): Quality
  2.1 Fuzzy corroboration
  2.2b Ingestion-time contradiction gate
  2.4 LLM edge derivation (two-stage cost control)

Phase 3 (Week 4): Generation
  (quick wins already done above)

Phase 4 (Weeks 5+): Infrastructure
  4.1 Memory server integration
  4.2 Community detection
  4.3 Multi-hop retrieval expansion
```

---

## Progress Tracker

| Task | Priority | Status | Date | Notes |
|------|----------|--------|------|-------|
| 1.1 KU expansion | P0 | DONE | 2026-03-18 | 54 KUs (10→54), script: batch-ku-promote.py |
| 1.2 Backfill knowledge_ids | P0 | DONE | 2026-03-18 | 49.3% orphaned (down from 79.7%), script: backfill-edge-ku-links.py |
| 1.3 Backfill chunk_id | P1 | DONE | 2026-03-18 | All 54 KUs have chunk_id, script: backfill-ku-chunk-ids.py |
| 2.1 Fuzzy corroboration | P1 | DONE | 2026-03-18 | Extended compute-corroboration.py with fuzzy matching |
| 2.2 Resolve contradictions | P1 | DONE | 2026-03-18 | Removed 1 hard contradiction, documented 2 soft tensions, added ingestion gate |
| 2.3 Phase 7 vocab fix | P2 | DONE | 2026-03-18 | Added defined_as, refines, presupposes + similar→supports mapping |
| 2.4 LLM edge derivation | P1 | DONE | 2026-03-18 | 2 edges derived via Claude, two-stage pipeline active |
| 3.1 Prose mapping prompt | P1 | DONE | 2026-03-18 | BAD/GOOD examples added to STRUCTURAL RELATIONSHIPS block |
| 3.2 Endnote artifacts | P2 | DONE | 2026-03-18 | stripEndnoteLeaks() in quality-integration.ts, integrated into both pipelines |
| 4.1 Memory server RT | P2 | DEFERRED | | Requires memory server architecture decisions |
| 4.2 Community detection | P3 | DONE | 2026-03-18 | Louvain clustering added to graph-visualize.py |
| 4.3 Multi-hop retrieval | P3 | DONE | 2026-03-18 | 2-hop traversal with 1.05x boost, maxHops option |
| 5.1 Edge epoch tracking | P1 | DONE | 2026-03-18 | All 1103 edges have generation_epoch + derivation fields |

---

## Metrics Dashboard

Track after each sprint:

| Metric | Baseline (2026-03-18) | Target | Current (2026-03-18) |
|--------|----------------------|--------|---------|
| Knowledge Units | 10 | 50+ | **54** |
| Total edges | 832 | 1000+ | **1,103** |
| Orphaned edges (%) | 79.7% | <40% | **49.3%** |
| Corroborated triples | 3 | 10+ | 3 (fuzzy matching ready, needs more cross-pipeline overlap) |
| Contradictions | 1 | 0 | **0** (gate active) |
| Phase 7 auto-derived edges | ~0 | 100+ | **277** |
| LLM-derived edges | 0 | 50+ | 2 (pipeline active, scales with KU count) |
| KUs with chunk_id | 0/10 | all | **54/54** |
| Relation types in Phase 7 | 4 | 6+ | **7** (added defined_as, refines, presupposes) |
| Edges with epoch tracking | 0/832 | all | **1,103/1,103** |
| Edge derivation breakdown | — | — | manual: 791, phase7: 277, bridge: 33, llm: 2 |
