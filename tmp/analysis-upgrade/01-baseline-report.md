# Baseline Report — Corpus Analysis & Cross-Author Integration System

**Date:** 2026-04-18
**Status:** Audit complete; gap analysis follows
**Scope:** Corpus + index + cross-pipeline analytical layer that goes beyond chunk/embed/semantic search

---

## 1. Architectural Overview

There are **three separate "layers"** that interact in this project:

### Layer A — Vector substrate (chunk/embed/search)
- **Stores:** ChromaDB collections `metaphysics`, `new_media`, `rhetorical_ontology`
- **Embedding:** GTE-Qwen2-1.5B (port 8000)
- **Manifest:** `scripts/ingest/manifest.jsonl` (~50 PDFs)
- **Code:** `src/god-agent/retrieval/smart-retrieval-layer.ts`, `hybrid-retriever.ts`, `faceted-retrieval.ts`
- **Capability:** semantic + keyword merge, Bekker affinity, source-diversity enforcement
- **Limit:** chunk-level granularity; no concept-aware ranking; treats Nussbaum 1985 etc. as undifferentiated chunks

### Layer B — LLM-deep analytical layer ("the system you remembered")
- **Plans:**
  - `plans/aristotle-corpus-analysis.md` (5 phases, 34 units, ~800 lines)
  - `plans/heidegger-bcap-analysis.md`
  - `plans/heidegger-bt-analysis.md`
  - `plans/rickert-ambient-rhetoric-analysis.md`
  - `plans/uexkull-foray-analysis.md`
  - `plans/phantasia-chapter-analysis.md`
- **Outputs (in `corpus/index/<author>/`):**
  - **Per-unit JSON skeletons:** unit metadata (id, label, books, Bekker range, PDF pages, tier, cluster, two-pass, dissertation_critical)
  - **Per-unit MD analyses (`phase2-*.md`):** hierarchical outline · key-concept tables (Greek+transliteration+Barnes+definition+centrality+citation) · main positions · interlocutors · cross-work refs · cross-pipeline hooks (Critical-tier only) · tensions · Greek terms · graph edges (controlled vocabulary JSON)
  - **Per-work syntheses:** `<work>-ontology.md`, `<work>-edges.csv`, `<work>-greek.json`, `<work>-cross-pipeline-hooks.md`
  - **Corpus-level (Aristotle):** `corpus-ontology.md`, `global-edges.csv`, `tension-edges.json`, `concept-matrix.csv`, `aristotle-greek-appendix.{md,json}`, `aristotle-bekker-index.{md,json}`, 8 Mermaid graphs (.mmd + .svg)
- **Controlled vocabulary:**
  - **Edge relations:** depends_on · contrasts_with · refines · presupposes · explains · operationalizes · supports · undermines · exemplifies · historicizes · is_meaning_of
  - **Edge domains:** ontological · existential · biosemiotic · perceptual · teleological · temporal · methodological · rhetorical · psychological · logical
  - **Centrality tiers:** core · important · peripheral
  - **Provenance tag for cross-author hooks:** [INTERP-high] · [INTERP-medium] · [INTERP-low]
- **Tiered analysis model:** Critical (10 sections, 18 units) · Standard (8 sections, 10 units) · Light (6 sections, 6 units)
- **Cross-pipeline bridge graph:** `aristotle-graph-cross-pipeline.mmd` — single hand-curated Mermaid diagram, 5 author subgraphs, ~40 cross-author edges

### Layer C — Compiled-index integration into writing pipeline
- **Compiler:** `scripts/compile-corpus-index.py` (ingests ~290 markdown/JSON files in `corpus/index/`)
- **Output:** `corpus/index/compiled-index.json` (8,727 lines, built 2026-04-07)
  - **278** ontologyNodes (canonical concepts with definitions/units/aliases/centrality)
  - **72** crossPipelineHooks (sourceConcept ↔ targetConcept with bridge prose, INTERP tag)
  - **45** tensionEdges (CT-01..CT-45 with conflict/dependency relations)
  - **873** canonicalTerms (deduplicated, length-sorted for greedy matching)
- **Consumers (active in production):**
  - `src/god-agent/universal/corpus-index-provider.ts` — `loadCorpusIndexContext(topic)` ranks ontology/hooks/tensions for a topic
  - `src/god-agent/shared/cross-author-utils.ts` — `getActiveBridges()` (cap=1), `getActiveTensions()` (cap=3), `expandQueryWithCanonicalTerms()` (adds Greek/aliases to retrieval queries)
  - `src/god-agent/retrieval/smart-retrieval-layer.ts` — exempts ontology terms from stopword filter
  - `write-pipeline-orchestrator.ts` — injects `crossPipelineHooks` and `tensionEdges` into prompts in 6+ places
  - `gold-standard-prompt-builder.ts` — Phase 1 mandatory bridge injection
  - `quality-integration.ts` — Phase 3 tension-aware quality gate
  - `icp-orchestrator.ts` — Phase 2 author-diverse retrieval enforcement

---

## 2. Coverage Summary

| Source | Pipeline Plan | Unit JSON | Phase-2 MD | Per-work synthesis | Cross-pipeline hooks | In compiled-index |
|--------|--------------:|----------:|-----------:|-------------------:|---------------------:|------------------:|
| Aristotle (9 works) | aristotle-corpus-analysis.md | 34 | 34 | 9 | 9 | yes |
| Heidegger BCAP    | heidegger-bcap-analysis.md   | 13 | 13 | 1 | 1 | yes |
| Heidegger B&T     | heidegger-bt-analysis.md     | 17 | 17 | 1 | 1 | yes |
| Rickert           | rickert-ambient-rhetoric.md  | 10 | 10 | 1 | 1 | yes |
| Uexküll           | uexkull-foray-analysis.md    | 13 | 13 | 1 | 1 | yes |
| **Total**         |                              | **87** | **87** | **13** | **13** | yes |

**Secondary literature (chunked-only, not analyzed):** Nussbaum 1985 (*Role of Phantasia in Aristotle's Explanation of Action*), and ~30 other PDFs in `corpus/rhetorical_ontology/`, `corpus/metaphysics/`, `corpus/new_media/`. These are searchable by chunk, but invisible to the conceptual layer.

---

## 3. Concept-Linking Mechanics (How Cross-Author Linkage Currently Works)

1. **Authorship of bridges = LLM (one-shot per work) + manual curation.** Phase-2 agents write a free-text "Cross-Pipeline Hooks" section in each Critical-tier unit's MD file. Those are aggregated per-work in Phase 3 (`<work>-cross-pipeline-hooks.md`). Phase 4 (corpus-level) creates the single Mermaid bridge graph. Phase 5 (formal integration) is **PARKED**.

2. **Compilation = rule-based parser.** `compile-corpus-index.py` parses MD headers (`## Hook 1: ψυχή (DA) → ζωή πρακτική (BCAP)`) and extracts source/target text + concept + the first sentence of each `**Bridge structure**` section. Bridge text is **truncated to one sentence** (`first_sentence(text)`).

3. **Activation at write-time = topic-word substring match.**
   - `getActiveBridges(facetTopicWords)` lowercases facet words ≥ 5 chars; fires if any word is a substring of `sourceConcept` or `targetConcept`. Caps at **1** bridge per facet.
   - `getActiveTensions(facetTopicWords)` similar; caps at **3**.
   - `loadCorpusIndexContext(topic)` ranks ontology (12), hooks (3), tensions (5) by simple term-frequency.

4. **Query expansion.** `expandQueryWithCanonicalTerms(query)` looks for ontology-node `name`/`transliteration` substrings in the query and appends Greek + aliases + translation to the embedding-side query.

---

## 4. Strengths

- **Genuinely PhD-quality philosophical analysis.** The cross-pipeline hooks (e.g., DA hook 4: φάντασμα → Merkbild with the form-reception vs. constitutive-projection divergence) are the kind of synthetic move a graduate seminar produces, not boilerplate. 9 cross-author hooks for *De Anima* alone, all with `bridge structure` + `dissertation relevance` paragraphs.
- **Bekker-precise citations** (`429a1–2 (PDF 44)`) propagate from per-unit MD into the compiled index → into prompts.
- **Controlled vocabulary** (11 relations × 10 domains) lets the system distinguish "depends on" from "contrasts with" instead of an undifferentiated "related to" mush.
- **Tiered analysis** prevents quality-flattening: 18 dissertation-critical units get full 10-section treatment, 16 less-critical units use compact templates.
- **Active integration**: hooks/tensions/ontology actually flow into Claude write prompts via 6+ injection points; query expansion runs before retrieval.
- **Mermaid graphs render** (8 Aristotle SVGs + per-pipeline graphs).

---

## 5. Gaps and Limitations (the reasons the system isn't yet what you envisioned)

### G1. Coverage limited to 5 primary authors; secondary literature is invisible
Nussbaum, Burnyeat, Wedin, Caston, Schofield (the active phantasia-scholarship cluster) are chunked but **not** in `compiled-index.json`. Concept layer treats these as if they don't exist; god-write retrieves Nussbaum chunks but cannot link them to the φαντασία ontology node.

### G2. Bridges are single-pair, not multi-author constellations
Each hook is `(sourceConcept, targetConcept)` — Aristotle↔Heidegger, Aristotle↔Uexküll, etc. There is **no triangulation node** like `phantasia ⟷ Erschlossenheit ⟷ Merkbild ⟷ ambient-rhetoric` as a single conceptual constellation. Result: a query about "phantasia and disclosure" can fetch the Aristotle↔B&T hook OR the Aristotle↔Uexküll hook, but cannot return the constellation.

### G3. Bridges are narrative-only, not edge-structured
`crossPipelineHooks` schema is `{sourceConcept, targetConcept, bridge: string, relevance: string, tag}`. The `bridge` is **truncated to first sentence** by the compiler. The full structural reasoning (e.g., the wax-signet → form-reception → Weltbildung threshold logic) is in MD prose but not in queryable structured fields. There is no `relation_type`, no `evidentiary_support`, no `counter_authors`, no `confidence_score`.

### G4. Phase-5 cross-pipeline integration is PARKED
The plan explicitly says: *"DO NOT EXECUTE until the user provides their own framework description."* Result: only 13 cross-pipeline-hooks files exist (one per work for the per-work synthesis stage), totaling 72 hooks. The promised "mapping tables (Aristotle Greek → BCAP Greek/German → B&T German)", "zones of alignment / conflict / extension", and "updated bridge Mermaid graphs with confirmed (not INTERP-high) edges" do not exist.

### G5. No claim-level extraction
Each Phase-2 MD has a `## 4. Main Positions / Claims` table (`claim | evidence_type | strength | citation`), but **the compiler ignores it.** Result: ~87 units × ~5 claims/unit ≈ 435 atomic claims with citations are not in the compiled index. God-write cannot answer "what does each author *assert* about the relation between phantasia and action?"

### G6. No formal argument structure
Edges have `relation` ∈ {depends_on, contrasts_with, refines, presupposes, explains, operationalizes, supports, undermines, exemplifies, historicizes, is_meaning_of} but there is no Toulmin/Walton/IBIS argument schema (claim · ground · warrant · backing · qualifier · rebuttal). Result: the system cannot model "Nussbaum argues *X* from *Y*; Wedin argues *not-X* from *Z*; the disagreement turns on *W*."

### G7. Concept nodes don't link to chunk IDs
`ontologyNodes` lists `units: [META-07, DA-04, ...]` but units are *unit-IDs from the analytical layer*, not chunk-IDs from the vector substrate. Result: even a perfect ontology hit cannot pull the source paragraphs from ChromaDB without round-tripping through Bekker→PDF→chunk lookup.

### G8. Bridge graph is static & hand-curated
`aristotle-graph-cross-pipeline.mmd` is a single artisan Mermaid file. There is no script that generates new bridge edges from MD hook files; new analytical content does not propagate.

### G9. Concept embeddings absent
Nodes have textual definitions but no embedding vectors. Retrieval cannot say "the user is asking about *captivation* — the closest ontology concept is `Benommenheit`/`weltarm` cluster."

### G10. No cross-author *contestation* tracking
Tensions are intra-Aristotle (CT-01..CT-45). There is no `inter-author tension` schema like "Heidegger reads *energeia* as `Anwesenheit`; Caston reads it as `oscillating-actuality` — they conflict on *X*."

### G11. Activation rules are too restrictive
- `getActiveBridges` cap of 1 per facet means dense facets only see one bridge.
- 5-char minimum filter excludes critical short Greek terms (`νοῦς` is 4 ASCII chars after transliteration).
- No semantic match — only substring; "imagination" misses "phantasia" if both aren't already in expansion table.

### G12. No feedback loop
Compiled index is built nightly (or manually) by `compile-corpus-index.py`. Insights produced *during* god-write (e.g., a quality-gauntlet finding that reveals a missing tension) do not flow back into the index.

### G13. Unit JSON skeletons are mostly empty
Each `aristotle-da-04.json` etc. is a stub (`tags: []`, `greek_terms_expected: []`). All the analytical content lives in MD prose; the parser has to re-parse markdown every compile. No JSON-LD, no SHACL, no validation.

### G14. No visualization beyond Mermaid
8 SVGs total. No interactive graph, no concept-neighborhood explorer, no retrieval explainability ("why did you cite Nussbaum here?").

---

## 6. The Question You're Implicitly Asking

> *Given that I built this LLM-deep analytical layer to enable cross-author concept linking, and given that secondary literature (Nussbaum) is invisible to it, and given that bridges are narrative-only, what's the smallest set of changes that lets a new PDF (Nussbaum 1985) flow into the analytical layer AND lets god-write surface its claims as part of cross-author concept constellations?*

That is the design target for the implementation plan in document `03-implementation-plan.md`.

---

## 7. Inventory Numbers (for reference)

| Asset | Count | Where |
|------:|------:|:------|
| Author pipelines (plans) | 5 | `plans/*-analysis.md` |
| Phase-2 unit MDs | ~87 | `corpus/index/<author>/` |
| Phase-2 unit JSONs | ~87 | `corpus/index/<author>/<author>-structured/` |
| Per-work syntheses | 13 | `corpus/index/<author>/` |
| Cross-pipeline hook files | 13 | `corpus/index/<author>/<work>-cross-pipeline-hooks.md` |
| Mermaid graphs (rendered) | 14+ | `corpus/index/<author>/*.mmd` + `.svg` |
| compiled-index.json size | 8727 lines | `corpus/index/compiled-index.json` |
| → ontologyNodes | 278 | (canonical concepts) |
| → crossPipelineHooks | 72 | (5-author bridges) |
| → tensionEdges | 45 | (intra-author CT-01..CT-45) |
| → canonicalTerms | 873 | (deduplicated) |
| Edge relation types | 11 | controlled vocabulary |
| Edge domains | 10 | controlled vocabulary |
| Cross-author hook activation cap | 1 | `getActiveBridges` |
| Tension activation cap | 3 | `getActiveTensions` |
| Secondary-lit PDFs not in concept layer | ~30 | `corpus/rhetorical_ontology/`, etc. |
