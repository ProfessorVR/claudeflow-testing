# Corpus/Index System Comparison — Our God Agent vs Archon

**Date:** 2026-06-24 · **For:** todo #4 (corpus/index analysis & entry system port decision)
**Method:** 6-agent workflow (2 mapped our `corpus/index/*` + compiler + drafting integration, 2 researched Archon, synthesis + adversarial review).
**Critique verdict:** *endorse-with-changes, **high confidence*** — the reviewer found **Archon's full source present locally** (`/tmp/claude-1000/-home-dalton-projects-claudeflow-testing/1168f25a-.../scratchpad/archon-cli`) and verified the load-bearing claims against real Rust (`schema.rs`, `relation_inferer.rs`, `store.rs`, `hybrid_retriever.rs`, `archon-cozo/lib.rs`, `assets/skills/.../SKILL.md`).

---

## 1. Decisive finding — this one is **migrate-and-preserve, not replace**

Unlike video and ingestion, our corpus/index is a **hand-authored scholarly artifact with no Archon equivalent**. Archon's knowledge layer (`archon-knowledge`) is a thin, auto-extracted, **non-LLM** 5-relation KB whose `relation_type` is limited to **4 hardcoded values** (`uses/requires/supports/co_mentions`, via substring `.contains()` in `relation_inferer.rs:39-50`). It cannot represent — let alone generate — our concept nodes (Greek lemmas, centrality, claim ledgers, interlocutors, design-principles, RO-hooks), typed reasoning edges, cross-text bridges, RODA A0–A4 crosswalks, or debate maps.

But Archon contributes **exactly the substrate we lack**: a real graph DB (**CozoDB Datalog on RocksDB**) with **additive idempotent `:create`** (`schema.rs:148-152` catches "already exists"/"conflicts") and **string-typed columns**, reachable via a generic public **`run_script_guarded`** (`archon-cozo/lib.rs:69`) — so our custom node/edge/bridge/debate types can physically co-exist with `kb_*` with no schema migration. Our side has **no graph engine at all** (loose git files + one flat 533 KB `compiled-index.json` loaded whole, retrieved by regex term-frequency linear scan).

**So: port = define new CozoDB relations + import our authored ontology + wire graph-aware tiered retrieval. Not "adopt Archon's instead."**

---

## 2. Capability matrix

| Dimension | Ours | Archon | Verdict |
|---|---|---|---|
| **Analytical schema** (concept nodes / typed edges / bridges / RODA) | DIA/RODA ontology: lang-tagged key_terms+gloss+locus, claim ledger C1–C20, interlocutors, design_principles, ro_hooks, anchor_phrases; typed reasoning edges; book tension-edges; RODA A0–A4 crosswalk | 5 flat relations (`kb_claims/entities/relations/source_quality/contradictions`); `relation_type` ∈ 4 values; no lemma/centrality/bridge/crosswalk/debate concept | **OURS** ✅ |
| Authoring model | 100% hand-authored per text (plan→anchor→units→typed JSON/MD/CSV→synthesis→bridges→gates) | auto-extraction only; inserts wired solely to the extraction loop, **no curated-write caller** | **Different** |
| Cross-text linking | reasoning edges + named-interlocutor tensions + RODA crosswalks + cluster debate-maps + citation-networks + crossPipelineHooks | only `kb_contradictions` + intra-chunk `kb_relations`; memory relationships = 5 closed enums | **OURS** ✅ |
| **Graph storage substrate** | none — loose files + flat blob, no query layer | **CozoDB Datalog on RocksDB**, additive `:create`, string-typed columns | **ARCHON** ✅ |
| Graph-aware retrieval for drafting | wired: `loadCorpusIndexContext`/`getActiveBridges`/`getActiveTensions` → 3 prompt blocks — **but regex linear-scan over a blob, not graph traversal** | **none** — only flat `list_*` scans; hybrid retrieval is vectors over **chunks**; KB rows never traversed for generation | **OURS** (contract) — reimplement as Datalog |
| Tiered retrieval (corpus-FIRST, vectors fallback) | explicit policy: authored ontology authoritative, vectors fallback | none — `hybrid_retriever` is a parallel weighted merge (0.55/0.45) over **one** chunk corpus | **OURS** ✅ |
| Provenance / citation of concepts → sources | every term/claim/edge carries `(p.NN / pdf NN)` + verified page-offset anchors — but **string** loci | per-record `document_id`/`chunk_id` → chunk granularity; **no page/locus/Bekker** field | **Parity** |
| Entry / authoring workflow | repeatable manual human/agent workflow; two shapes (single-text units, multi-source cluster) | `archon-init.sh` scaffolds skills/templates/specs/agents; `phdresearch` personas conceptually near | **Different** |

---

## 3. What to port (priority order — corrected effort)

1. **NEW CozoDB relations for our ontology** — `corpus_concepts {name PK, greek, translit, translation, definition, type, centrality, units[], source_texts[]}`, `corpus_reasoning_edges {source, relation, target, locus, note, unit}`, `corpus_tensions {node_a, node_b, position, relation, against, dependency_relation, conflict_relation, locus, units[]}`, `corpus_bridges {src_text, src_concept, tgt_text, tgt_concept, bridge, relevance, tag}`, `roda_crosswalks {chain_node, source_element, text_correlate, lock}`, `debates {id, question, axis, positions[]}`, `lemmas`, plus `corpus_claims/_interlocutors/_principles/_ro_hooks`. Additive alongside `kb_*` (verified supported). **Effort M.**
2. **In-tree Rust importer reading the per-entry SOURCE files — NOT `compiled-index.json`.** **Effort re-rated L→M** (critique). It must use **per-entry-shape adapters** — the per-unit JSON is **not uniform**: Wendt = rich `units/*.json`; Aristotle = `bt`-structured; Heidegger = SZ-paginated; clusters = `debate-map.json`/concordances. It must unify **three incompatible tension shapes** (per-unit CSV `source/relation/target`; synthesis JSON `wendt_position/against`; compiled `nodeA/nodeB/dependency+conflict`), normalize the **~36-value `type` vocabulary**, and drop the **corrupt `centralityTier` overflow** (one 10,009-char blob). **This is the only step that risks data loss — treat shape-adapters + tension-unification as a first-class subtask.** Populate via `run_script_guarded` `:put` (or the existing `pub` `insert_*` fns — see §5).
3. **Per-unit claims/interlocutors/design_principles/ro_hooks as first-class records** — the highest-value analytical payload (Wendt `dfd-01`: 20 claims, 14 interlocutors, 8 principles, 6 ro_hooks), and **exactly what the current compiler drops** (§5). **Effort M.**
4. **Tiered corpus-FIRST/vectors-fallback retriever** reproducing `loadCorpusIndexContext`/`getActiveBridges`/`getActiveTensions` as **CozoDB Datalog graph traversal**, emitting the 3 prompt blocks (CANONICAL CONCEPT NODES / CROSS-PIPELINE HOOKS / CONCEPTUAL TENSIONS) + `injectedBridges`/`corpusIndexContributions`. Reuse Archon's `hybrid_retriever` as the **fallback tier** beneath it. **Effort L.**
5. **fastembed embeddings over concept node text** (name+greek+translit+definition) → `vec_corpus_concepts`, replacing our regex linear scan with real semantic node search; carry our multilingual canonical-term expansion (~1,396 terms). Self-contained (no Python/CUDA). **Effort M.** *(verify fastembed/HNSW relation availability — §6.)*
6. **Structured locus field + link concept nodes → `doc_chunks`** (page/pdf/Bekker provenance + DB-resolvable source) — ties directly into the verbatim-provenance work. **Effort M.**
7. **`analysis-entry` authoring SKILL** — `SKILL.md` (YAML frontmatter + markdown body, verified format) + a CozoDB upsert replacing the Python compile step; reuse `phdresearch` personas. **Effort: orchestration + upsert (OCR stays an external pre-step — §6).**

---

## 4. Adopt from Archon

- **CozoDB** as the ontology store (additive `:create`, string-typed columns — verified) — replaces loose files + flat blob.
- **fastembed + HNSW** for self-contained semantic node/prose embedding — replaces regex-substring retrieval (and never reintroduce ChromaDB / the GPU embedder).
- **`kb_contradictions` shape** (left/right + type + explanation + confidence) as the *template* for our tensions — *but note it gives **no retrieval leverage** (flat-scan only); adopt the shape, not any querying.*
- `document_id`/`chunk_id` chunk-granularity linkage as the DB-resolvable backbone, augmented with our finer page locus.
- The **skills/templates/specs scaffolding** + `phdresearch` personas as the host for the authoring workflow.
- `hybrid_retriever`'s vector+lexical merge as the **fallback tier** (reuse, don't replace).

---

## 5. Critical corrections from the adversarial pass (fold in before building)

- **Lossiness — precise truth.** The earlier claim "the compiler never reads tensions" is **wrong**: `compile-corpus-index.py:1227` *does* read `_synthesis/tension-edges.json` and emit `tensionEdges` (`:1338`). What it **actually drops** (verified): (a) **per-unit `units/*.json` entirely** — compiled concept nodes come from `*-ontology.md` markdown tables (`:1172/1185`), so the claim ledger / interlocutors / design_principles / ro_hooks / anchor_phrases **never reach the compiled artifact**; (b) **all `*-edges.csv` reasoning edges** (grep = 0 hits); (c) **crossPipelineHooks are Aristotle-only** (`:1204`). → **Migrating from `compiled-index.json` would discard the crown jewels; import from SOURCE files.** (Conclusion unchanged; supporting claim fixed.)
- **`insert_*` are `pub fn`, not `pub(crate)`.** They're public but **only called from the extraction loop** (`lib.rs:121-141`, `contradiction_scanner.rs:34`) — no curated caller exists. So the importer may **reuse them** or (cleaner) add new relations via `run_script_guarded`. Don't mis-scope this as "no public insert."
- **Resolved `[unverified]` → confirmed true:** additive idempotent `:create` (`schema.rs:148-152`); raw `:put` of **new** relations via generic public `run_script_guarded` (`archon-cozo/lib.rs:69`); **SKILL format** = `assets/skills/<name>/SKILL.md`, YAML frontmatter (name/description/license-source) + markdown body.

---

## 6. Still genuinely open (not in inspected files)

1. Can `doc_chunks` carry arbitrary page/locus/edition metadata for structured-citation attachment, or is a separate `corpus_locus` relation needed? *(Now answerable directly — Archon source is local.)*
2. `phdresearch` persona **content-fit** to the DIA/RODA analysis-entry workflow (dir exists; contents not read).
3. `fastembed`/HNSW availability for a new `vec_corpus_concepts` relation (`vec_constellations`/memory `vector_search` asserted, not opened).
4. End-to-end `:put` round-trip of our **open relation vocabulary** strings (hyphens like `applies-to-design`, quotes in loci, Greek UTF-8) through `run_script_guarded`'s `DataValue` params — low risk, unproven.
5. Is the existing TS drafting pipeline meant to **call into Archon** over an interface, or be reimplemented in Rust? (FFI/IPC vs native rewrite.)

---

## 7. Self-contained risks

- Importer/upsert **must be in-tree Rust** — do not ship `compile-corpus-index.py` (Python) or a Node migration script in the binary (a throwaway external one-off loader is fine).
- Embedding = **fastembed/HNSW only** — no ChromaDB / GPU embedder carryover.
- The authoring workflow's whole-unit read depends on `pdftotext` OCR — **treat OCR as an external pre-step**, not an in-binary runtime dependency (or use the Marker-on-Metal path from the ingestion amendment).
- Mermaid `.mmd` renderings assume external tooling — emit Datalog results, render outside; don't pull a Node/JS renderer in.
- **LLM-call boundary:** self-contained = the *substrate* (graph/retrieval) has no Node/Python/CUDA; the **drafting LLM call stays cloud Anthropic** (per routing) and lives *outside* the self-contained core. Keep that boundary explicit.

---

## 8. Sequence & bottom line

**Sequence:** (1) schema + importer **first** (only data-loss-risk step; per-entry adapters + tension unification are the hard part) → (2) tiered Datalog retriever reproducing the 3 prompt blocks + `injectedBridges` → (3) `analysis-entry` SKILL last. **Keep the TS/Python drafting pipeline live until the Datalog retriever reaches parity** against current `WriteResult` contributions; do not cut over the corpus-FIRST policy until validated.

**Bottom line:** of 8 dimensions, we lead on 5 (the whole analytical apparatus + drafting discipline), Archon leads on 1 (the graph substrate), 2 are different-purpose. This is the **opposite shape** of the other ports: almost everything of *ours* survives and gets a real home; almost nothing of Archon's *replaces* it — Archon supplies the database and embedding engine our curated ontology never had. The single risk is the importer (heterogeneous per-entry shapes + 3 tension schemas); everything else is additive and low-risk.
