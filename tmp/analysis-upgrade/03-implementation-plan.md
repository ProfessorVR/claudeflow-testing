# Implementation Plan — Concept-Aware Cross-Author Analytical Layer

**Date:** 2026-04-18
**Goal:** Bring secondary literature (e.g., Nussbaum 1985) into the analytical layer AND make the layer drive retrieval/writing more directly.
**Constraint:** Build incrementally on the existing assets (`compile-corpus-index.py`, `compiled-index.json`, controlled vocabulary, cross-author hooks). No rip-and-replace.
**Test target:** `corpus/rhetorical_ontology/Nussbaum, Martha - The Role of Phantasia in Aristotle's Explanation of Action_(1985)_[My Copy].pdf`

---

## Design principles

1. **Additive, not replacement.** All new artifacts live alongside the existing index; existing god-write keeps working.
2. **JSON-first, file-based, no new services.** No Neo4j install — extend `compiled-index.json` schema and add sibling JSON files. Stays compatible with the existing Python compiler and TypeScript loaders.
3. **Sandbox isolation.** All test work happens under `tmp/analysis-upgrade/sandbox/` so the live corpus index is untouched until promotion.
4. **Measurable.** Every phase produces a delta on a god-write quality metric (chunk diversity, ontology-hit count, cross-author hook activation, citation-density).

---

## Phase 1 — Schema upgrade (additive)

Extend `compiled-index.json` with three new top-level arrays:

```jsonc
{
  "ontologyNodes":      [...existing...],
  "crossPipelineHooks": [...existing...],
  "tensionEdges":       [...existing...],
  "canonicalTerms":     [...existing...],

  // NEW:
  "claims": [
    {
      "id": "claim-nussbaum-001",
      "claim": "Phantasia is necessary but not sufficient for animal action.",
      "ground": "All animals have phantasia of some kind, but only some can deliberate.",
      "warrant": "Action requires both perceptual representation and orectic motivation.",
      "qualifier": "in standard cases",
      "rebuttal": "Setterfield (1980) treats phantasia as deliberative-only.",
      "author": "Nussbaum, Martha",
      "title": "The Role of Phantasia in Aristotle's Explanation of Action",
      "year": 1985,
      "citation": "Nussbaum 1985, p. 230",
      "section": "II",
      "chunk_ids": ["nussbaum-1985-c12", "nussbaum-1985-c13"],
      "concept_hits": ["phantasia", "orexis", "praxis", "deliberative-imagination"]
    }
  ],
  "conceptMentions": [
    {
      "chunk_id": "nussbaum-1985-c12",
      "ontology_node_id": "phantasia",
      "score": 0.91,
      "span": "phantasia in animal action",
      "author": "Nussbaum, Martha"
    }
  ],
  "bridgeCandidates": [
    {
      "id": "bridge-cand-001",
      "sourceText": "Aristotle - De Anima",
      "sourceConcept": "phantasia",
      "targetText": "Nussbaum 1985",
      "targetConcept": "necessary-condition-for-action",
      "evidence": "Nussbaum's reading of DA III.10",
      "score": 0.84,
      "tag": "INTERP-medium-AUTO",
      "needsReview": true
    }
  ]
}
```

Two **new JSON sidecars** (avoid bloating compiled-index.json):
- `corpus/index/claims.jsonl` — one claim per line
- `corpus/index/concept-mentions.jsonl` — one mention per line

The compiler aggregates both into `compiled-index.json`.

---

## Phase 2 — PaperTrail-style claim extractor (per-PDF)

A new script `scripts/analyze-secondary.py` (or `.ts`):

**Input:** PDF path + author/year/title metadata
**Process:**
1. Extract section structure (title + headings + paragraph offsets) — reuse existing OCR pipeline output if PDF already ingested; else call PyMuPDF.
2. For each section, run a **claim-extraction prompt** on Sonnet 4.6 (returns JSON list of `{claim, ground, warrant, qualifier, rebuttal, citation, section, char_offset_range}`).
3. For each claim, run a **concept-resolver prompt** + bi-encoder cosine matching against existing 278 ontology nodes (returns top-K matches with score).
4. For each claim's `concept_hits`, generate **bridge candidates** if the author has not been seen for that concept before (LLM verifies "is this a genuine cross-author conceptual bridge?").

**Output:**
- `claims.jsonl` (append)
- `concept-mentions.jsonl` (append)
- `bridge-candidates.jsonl` (append, all `needsReview: true`)

**Cost guardrail:** ~$0.20-0.50 per typical journal article (Sonnet 4.6 input cost dominates).

---

## Phase 3 — Concept-resolver bi-encoder (one-time)

Extend `compile-corpus-index.py`:
1. For each `ontologyNode`, build an embedding from `[name, transliteration, translation, definition]` using the existing GTE-Qwen embedder (port 8000).
2. Store as `ontologyNodes[i].embedding: Float32Array` (or in a sibling `ontology-embeddings.bin` for size).
3. Provide a TypeScript loader `getOntologyEmbeddings()`.

This is the **single biggest leverage point**: once nodes have embeddings, every chunk can be tagged with its top-K ontology hits at chunk-time, and queries can match concepts by similarity rather than substring.

---

## Phase 4 — Concept-aware retrieval (drop-in)

Extend `smart-retrieval-layer.ts`:

```typescript
// Before retrieval:
const queryConcepts = await resolveConcepts(query, topK=5);  // bi-encoder + threshold

// During scoring (per chunk):
const chunkConcepts = chunkMetadata.ontology_hits || [];   // populated by concept-resolver
const conceptOverlap = jaccard(queryConcepts, chunkConcepts);
const finalScore = 0.7 * cosineScore + 0.3 * conceptOverlap;
```

Plus: **raise activation caps** (`getActiveBridges` 1→3, `getActiveTensions` 3→5), and rank bridges by query-concept overlap rather than substring match.

---

## Phase 5 — Cross-author bridge auto-generator (offline batch)

A new script `scripts/generate-bridge-candidates.py`:
- For every pair of authors, find ontology nodes with overlapping embedding clusters (cosine > 0.6).
- For each candidate pair, run an **LLM prompt**: "Here are the definitions of X (author A) and Y (author B). Is there a genuine conceptual bridge? If so, describe it as: structural / genealogical / contrastive / identity. Tag confidence (high/medium/low). Cite both sources."
- Output `bridge-candidates.jsonl`. Human reviews → promotes to `crossPipelineHooks`.

This is the **Phase 5 of the original plan** (PARKED), now operationalized.

---

## Phase 6 — Glue + integration

1. `compile-corpus-index.py` — read claims, concept-mentions, bridge-candidates; embed ontology nodes; emit single compiled-index.json.
2. `corpus-index-provider.ts` — load new fields; add `loadActiveClaims(topic)` and `loadActiveConcepts(topic)`.
3. `write-pipeline-orchestrator.ts` — inject `## Active Claims (from secondary lit)` and `## Active Concept Constellations` into the prompt alongside existing hooks/tensions.
4. `gold-standard-prompt-builder.ts` — when a `phantasia` query fires, surface the constellation `phantasia ⟷ Erschlossenheit ⟷ Merkbild ⟷ ambient-rhetoric` as a single bridge block, plus any Nussbaum/Burnyeat claims that touch the constellation.

---

## Phase 7 — Validation harness

Compare on a fixed prompt ("Discuss Aristotle's account of phantasia in relation to action, drawing on contemporary scholarship"):
- **Baseline:** current god-write, current compiled-index
- **Upgraded:** sandbox compiled-index (with Nussbaum claims/concepts/bridges)
- **Metrics:**
  - chunk-source diversity (count of distinct authors in retrieved chunks)
  - ontology-hit count (how many concept nodes activated)
  - cross-author hook count (how many bridges fired)
  - citation density (citations / 100 words)
  - secondary-lit citation count (Nussbaum/Burnyeat etc. cited)
  - new-claim integration (does the output reference the extracted claims?)

---

## Sandbox layout

```
tmp/analysis-upgrade/sandbox/
├── corpus/index/                       # cloned snapshot of corpus/index
│   ├── compiled-index.json             # the upgraded one
│   ├── claims.jsonl                    # NEW
│   ├── concept-mentions.jsonl          # NEW
│   ├── bridge-candidates.jsonl         # NEW
│   ├── ontology-embeddings.bin         # NEW
│   └── Nussbaum 1985/                  # NEW per-PDF folder
│       ├── nussbaum-1985-overview.md
│       ├── nussbaum-1985-claims.jsonl
│       └── nussbaum-1985-concepts.jsonl
├── scripts/                            # sandbox-only versions
│   ├── analyze-secondary.py
│   ├── embed-ontology.py
│   ├── generate-bridge-candidates.py
│   └── compile-corpus-index-v2.py      # extended compiler
└── tests/
    ├── before-prompt.txt
    ├── before-output.md
    ├── after-prompt.txt
    └── after-output.md
```

---

## Execution sequence (numbered for the todo list)

1. **Set up sandbox.** Snapshot `corpus/index/` to `tmp/analysis-upgrade/sandbox/corpus/index/`.
2. **Embed ontology nodes.** Call GTE-Qwen on each of 278 nodes; write `ontology-embeddings.bin` + add `embedding_idx` to compiled-index.json.
3. **Extract Nussbaum claims.** Run `analyze-secondary.py` against the Nussbaum 1985 PDF using Sonnet 4.6.
4. **Resolve Nussbaum concepts.** For each claim's text, embed → top-K ontology match → write `concept-mentions.jsonl`.
5. **Generate bridge candidates.** For Nussbaum's top concepts (phantasia, orexis, praxis, etc.), run cross-author bridge prompt against existing nodes from other authors.
6. **Recompile** the sandbox index.
7. **Patch the loader.** Sandbox-only TypeScript that reads from `tmp/analysis-upgrade/sandbox/corpus/index/compiled-index.json` instead of the live one.
8. **Run baseline god-write** (live index) on test prompt → save output.
9. **Run upgraded god-write** (sandbox index, expanded caps, hybrid scoring) → save output.
10. **Diff metrics.** Compute the validation table above.
11. **Report.** Markdown summary + side-by-side excerpts.

---

## Out of scope (deferred for v2)

- Replacing ChromaDB with a graph DB.
- True GNN/HippoRAG-style concept aggregation (we approximate with bi-encoder + overlap scoring).
- Toulmin model full extraction (we capture {claim, ground, warrant, qualifier, rebuttal} but don't validate completeness).
- Auto-promotion of bridge candidates (humans still review before promotion).

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Sonnet 4.6 cost balloons | Cap at 1 PDF for test; ~$0.50 max |
| Ontology embeddings model mismatch | Use same GTE-Qwen embedder as ChromaDB (already running on :8000) |
| Bridge-candidate LLM hallucination | Tag all auto-generated bridges as `INTERP-medium-AUTO`; require human review |
| Sandbox loader breaks live writes | Use environment variable `CORPUS_INDEX_PATH` for sandbox toggle |
| GTE-Qwen embedding endpoint down | Fail-fast in script; user can restart via `/god-launch` |
