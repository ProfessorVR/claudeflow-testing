# Corpus/Index → Archon Migration Spec (build-ready)

**Date:** 2026-06-24 · **For:** todo #4 (migrate-and-preserve the hand-authored DIA/RODA ontology into Archon's CozoDB).
**Method:** 5-agent workflow (3 source-extractors on our entry shapes / Archon CozoDB mechanics / our drafting contract → spec author → adversarial review). **Verdict:** *endorse-with-changes, high confidence* — substrate verified sound against real Archon source; the critique caught material data-loss now folded in.
**Bound against source:** ours — `corpus/index/*`, `compile-corpus-index.py`, `corpus-index-provider.ts`, `cross-author-utils.ts`, `gold-standard-prompt-builder.ts`; Archon — `archon-cozo/lib.rs`, `archon-knowledge/schema.rs`, `archon-docs/{schema,embed_fastembed,store}.rs`.

---

## 0. Decisive framing

Migrate-and-preserve: our ontology has no Archon equivalent (`kb_*` = 5 flat relations, `relation_type` ∈ 4 hardcoded values, `hybrid_retriever` is chunks-only). Archon supplies only the **substrate** — CozoDB Datalog graph (via `run_script_guarded`), fastembed BGE-base-768 + HNSW, `assets/skills/<name>/SKILL.md`. We add **new `corpus_*` relations** (never touch `kb_*`) and reproduce our corpus-index→drafting contract as Datalog.

**Two load-bearing truths:**
1. **Do NOT migrate from `compiled-index.json` — it is lossy by construction.** `compile-corpus-index.py` never reads `*-edges.csv` (315+ reasoning edges in Wendt alone), silently drops Wendt's 12 `{wendt_position,against}` tensions (`_normalize_tension_edge` requires `nodeA/nodeB`), **excludes all clusters**, is Aristotle-only for cross-pipeline hooks, and emits corrupt `centralityTier` overflow. **Import from per-entry SOURCE files.**
2. **The substrate is the easy part; ADAPTER COVERAGE is the long pole.** The build is gated not by CozoDB mechanics (verified trivial) but by the **heterogeneity of ~19 hand-authored entries** — and the highest-value data (Burke/Calleja "-deep" files) lives in the least-standard shapes. Get the census + adapters right or the migration silently loses crown jewels.

The importer is an **external throwaway Rust binary** (links `archon-cozo` + `archon-docs`), run **once with the archon daemon DOWN** (single writer). It's fully re-runnable: `:create` is additive-or-ignore, `:put` is keyed upsert, all IDs are deterministic content hashes. The **TS pipeline stays live and authoritative until the Datalog retriever reaches line-for-line parity** (P5); cutover is the last phase.

---

## 1. Substrate — CozoDB relations (verified sound)

New `corpus_*` relations, created idempotently via `ensure_corpus_schema(db)` looping `:create` through the `run_create` additive-or-ignore pattern (`archon-knowledge/schema.rs:147-159`), inserted via `run_script_guarded(db, "?[…] <- [[$p]] :put …", params, ScriptMutability::Mutable, …)`. All array/nested data is **JSON-in-`String`** (Cozo has no nested-array column); anything queried-on gets a **flattened child relation**.

| Relation | Key → cols (abridged) | Holds |
|---|---|---|
| `corpus_entries` | `entry_id =>` title, author, year, kind, **pattern**, source_dir, status | one row per top-level entry; `pattern` selects the adapter |
| `corpus_concepts` | `concept_id =>` entry_id, name, greek, transliteration, translation, definition, kind, centrality_tier, units_json, aliases_json, primary_locus | canonical concept node (mirrors runtime `OntologyNode`) |
| `corpus_concept_terms` | `concept_id, term =>` freq | inverted index for the BLOCK-1 scorer (**see §4 scorer correction**) |
| `reasoning_edges` | `edge_id =>` entry_id, unit, **source, relation, target**, locus, note | free-text reasoning graph (the bulk `compile-*.py` drops) |
| `corpus_tensions` | `tension_id =>` entry_id, **shape_origin**, label, endpoint_a, endpoint_b, directed, dep_relation, conflict_relation, units_json, locus, description | unified superset of all tension geometries (§3) |
| `corpus_bridges` | `bridge_id =>` source_text, source_concept, **source_author**, target_text, target_concept, **target_author**, title, bridge, relevance, tag | cross-pipeline hooks; authors **pre-derived at import** (`deriveAuthor`) and stored |
| `corpus_roda_crosswalks` | `row_id =>` entry_id, chain_node, roda_element, design_correlate, mapping, note | A0–A4 ↔ RODA ↔ correlate (parsed from markdown tables) |
| `corpus_debates` | `debate_id =>` entry_id, question, axis, positions_json | cluster debate-maps |
| `corpus_lemmas` | `lemma_id =>` entry_id, lemma, locus, source_kind, ref_id | key-terms / anchor-phrases / Bekker / game-elements |
| `corpus_claims` | `claim_id =>` entry_id, **local_id**, text, locus, unit | per-unit claim ledger (**synthesize `local_id` when absent — §2**) |
| `corpus_interlocutors` / `corpus_design_principles` / `corpus_ro_hooks` | per-unit rich arrays | Wendt/cluster analytical payload `compile-*.py` drops |
| `corpus_concept_chunks` | `concept_id, chunk_id =>` link_kind, anchor_phrase, confidence | concept ↔ `doc_chunks` provenance (§6) |
| `vec_corpus_concepts` (+ `:concept_idx` HNSW) | `concept_id =>` embedding `<F32;768>`, provider | concept vectors (exact copy of `vec_text_chunks` template, `archon-docs/schema.rs:255-285`; wrong-dim auto-rejected) |

CozoScript with hyphenated/underscored relation **values** (`applies-to-design`) and Greek UTF-8 is fine — they're String data, not identifiers (critique-verified).

---

## 2. Corpus census + adapters — THE LONG POLE (critique-mandated P0.5)

**The synthesis named only 4 adapters; the critique verified that covers ~40% of entries and drops the richest files.** Before any import, enumerate **every** entry dir → a concrete adapter, and map the crown-jewel fields. Provisional family map (each entry's on-disk layout must be confirmed in P0.5):

| Adapter family | Entries (provisional) | Source layout | Crown-jewel fields that MUST land |
|---|---|---|---|
| **wendt-rich** | Wendt | `units/*.json` + `_synthesis/{book-level-ontology,tension-edges,global-edges,manifest}` + `bridge-sources/roda-crosswalk.md` | claims, interlocutors, **design_principles, ro_hooks**, anchor_phrases, **mediation_relations, object_types_present** (omitted by synthesis), key_terms.gloss |
| **burke-monograph** ⚠️ | A Grammar of Motives, A Rhetoric of Motives | per-chapter `gm-NN-<slug>.json` **+ `gm-NN-DEEP.json` companion** | **the `-DEEP.json` is the single richest file in the corpus** — concepts, positions, tensions, cross_pipeline_bridges, edges, **aristotle_exegesis_table, aquinas_exegesis, act_term_operationalization, philosophic_school_x_pentad_table, pentad_term_featured, ratio_catalog**. Burke×2 are registered in the 528-node set; **no synthesis adapter touched these — highest-value, currently dropped** |
| **calleja-monograph** ⚠️ | In-Game (Calleja) | per-chapter `ig-NN-*` (+ `-deep` companion) | same chapter+deep structure as Burke |
| **structured-analysis** ⚠️ | Rickert (Ambient Rhetoric), Von Uexküll | `X-structured/` + `X-analysis/` (a THIRD scope-manifest variant) | Uexküll `uex-analysis/tension-edges.json {tension,nodeA,nodeB,type,units,description}` (the `uexkull-nodes` tension shape) |
| **aristotle-manifest** | Aristotle – Complete Works | `aristotle-*.json` read-scope manifests + `aristotle-bekker-index.json` (188 entries) | bekker-index → lemmas; greek_terms_expected → concepts. **Edges live only in `.mmd` (open item)** |
| **heidegger-sz** | Being and Time (+ verify BCAP / FCM / &Rhetoric) | `bt-structured/bt-*.json` (triple pagination h/eng/pdf) + `bt-analysis/*.md` + `concept-matrix.csv` | section headings + german_terms → concepts/lemmas; triple-pagination → **one opaque composite locus** (don't parse). **Edges in `.mmd`/`.md` (open item)** |
| **cluster-article** | RDR2 Secondary, Aristotelian Emotion/Motion/Phantasia Secondary | `<Article>/rdr-*.{json,-edges.csv}` + `_synthesis/{debate-map,citation-network,concordance,cluster-ontology}` | concepts, interlocutors, game_elements, tensions[flat], + **readings, themes, debate_axis_positions, cluster_citations, sections** (synthesis mapped only 4 of 14 fields) |
| **defer / special (explicit disposition)** | Dissertation, Veri(dis)similitude (Salvo MA), Game-Behavior Method (Burke×Calleja), Uncomfortable Situations, Heidegger&Rhetoric | mixed | decide import-vs-defer per entry in P0.5; these are the user's own work or method artifacts, not third-party analyses |

### 2a. CSV dialect normalizer — MANDATORY before any `reasoning_edges` import
A fixed positional 5-col reader **corrupts** data: `*-edges.csv` has **≥10 header layouts** (verified), e.g. `source,relation,target,locus,note` (only 20 files); `source_claim,relation,edge_domain,target,note,location` (**target is col 4**); `source,target,relation,domain,weight,units,evidence` (**relation is col 3**); `source_id,relation,target_id,domain,evidence_pdf_page,…,notes` (8-col, relation is a **citation ID**); `src,rel,dst,book_page,note`. Build a **header-sniffing dialect layer** that maps each file's header to canonical `{source, relation, target, locus, note, unit}` *before* insert. Without it the largest payload is silently mis-columned.

### 2b. Field-mapping gotchas (critique-verified)
- `corpus_claims.local_id` is required but `claims[].id` exists in only **2 of 7** Wendt units → **synthesize stable local_ids** (e.g. `{unit}-c{n}`) or `:put` fails.
- Wendt `_synthesis/tension-edges.json` is a **dict `{note, tensions:[…]}`**, not a bare array — read `.tensions`.
- Do **not** reuse `compile-corpus-index.py:_normalize_tension_edge` (it drops the wendt-position shape).
- `centrality_tier` comes from `book-level-ontology.json core_nodes[].centrality` (trusted), whitelisted to `{core, important, peripheral, medium}` — **not** the corrupt compiled value. Entries lacking `book-level-ontology` (Aristotle/Heidegger) get empty `centrality_tier` (acceptable — it's not scored/rendered anyway).

---

## 3. Tension unification (superset — sound for the inspected shapes)

`corpus_tensions` superset = `{shape_origin, label, endpoint_a, endpoint_b, directed('true'/'false'), dep_relation, conflict_relation, units_json, locus, description}`. Mappings:

- **csv-edge** (tension-verb rows only): `endpoint_a=source, endpoint_b=target, directed='true', conflict_relation=relation`. (Non-tension rows → `reasoning_edges` only; a tension row appears in both — `reasoning_edges` keeps the full graph, `corpus_tensions` is the tension-filtered projection.)
- **wendt-position** `{wendt_position, relation, against, unit, locus, note}`: `endpoint_a=wendt_position, endpoint_b=against, directed='true', conflict_relation=relation, units=split(unit)`. *(The shape `compile-*.py` drops.)*
- **uexkull-nodes** `{tension, nodeA, nodeB, type, units, description}`, `type="contrasts_with"`: `label=tension, endpoint_a=nodeA, endpoint_b=nodeB, directed='false', conflict_relation=type`.
- **compiled-dual** `{nodeA, nodeB, dependencyRelation, conflictRelation, …}`: maps 1:1 (the runtime `TensionEdge` shape — `corpus_tensions` is a strict superset).
- **cluster-debate** (flat `"X vs. Y"` strings): `endpoint_a=full string, endpoint_b='', directed='false', conflict_relation='vs'`.

BLOCK-3 render projects back to `{nodeA=endpoint_a, nodeB=endpoint_b, description, units}`; single-endpoint rows degrade to `- TENSION [id]: <endpoint_a> — desc`.

> Open: a **full relation-verb census** across all `*-edges.csv` is needed to finalize which verbs are "tension-verbs" (projection into `corpus_tensions`) vs reasoning-only.

---

## 4. Datalog retriever — reproduce the 3 blocks (with the scorer fixed)

Reproduce `loadCorpusIndexContext` (caps **12 / 3 / 5**) + the mandatory bridge, with **exact render templates** and **three distinct scorers kept separate**. Corpus-FIRST = the ontology query **always runs and seeds vector query-expansion**; vectors are **additive, never a substitute** (`retrieval-stage.ts:169-184`).

**⚠️ Scorer correction (critique-verified, load-bearing):** `scoreCandidate` uses JS `.match()` = **SUBSTRING count anywhere** in searchText (`"design"` counts inside `"designer"`, `"redesign"`). A token-equality inverted index (`term == $topic`) **silently diverges**. So the term-frequency scorer must use **substring matching** — either `str_includes` per topic-term over a per-row `search_text` column, or an n-gram-expanded index. Treat the **P5 line-for-line parity diff against live TS as a HARD gate.**

- **BLOCK 1 — CANONICAL CONCEPT NODES** (cap 12). searchText = name+greek+translit+definition+aliases; substring-count over topic terms (len≥4), no length-norm, score>0, sort DESC, slice 12. Render: `- {**greek**|**name**}{ (translit)}{: definition[:200]}{ [units[:5]]}`. Header `## CANONICAL CONCEPT NODES (from corpus ontology)` + "Prefer these definitions over paraphrase."
- **MANDATORY THEORETICAL SYNTHESIS** (cap 1, run FIRST to get `$mandatory`). Scorer B: per side, exact-in-topics(len≥5)=2 / substring=1, sum max 4; tiebreak score DESC, tag-confidence(high=2/med=1) DESC, id ASC. Render `## MANDATORY THEORETICAL SYNTHESIS` + `**Bridge [id]:** src (srcAuthor) ↔ tgt (tgtAuthor)` + "Both authors MUST be cited with direct textual evidence." (authors read off `corpus_bridges`).
- **BLOCK 2 — CROSS-PIPELINE HOOKS** (cap 3, AFTER removing the mandatory bridge id). searchText = src+tgt+bridge+title; substring-count. Render `- HOOK [src → tgt]: … — bridge[:150] [tag]`. + "do not invent additional bridges."
- **BLOCK 3 — CONCEPTUAL TENSIONS** (cap 5; a separate `getActiveTensions` quality-gate uses cap 3 + distinct-matching-topics len≥5). searchText = nodeA+nodeB+description. Render `- TENSION [id]: nodeA ↔ nodeB — desc[:200] [ALL units]` (tensions join **all** units, unlike concepts' slice-5). + "do not paper over them."
- **Graph traversal** (the capability Archon lacks): recursive Datalog over `reasoning_edges` for DIA/RODA chain-walks (A0→A4) — `reach[a,b] := *reasoning_edges{source:a,target:b}; reach[a,b] := reach[a,mid], *reasoning_edges{source:mid,target:b}`.
- **Observability emit:** `corpusIndexContributions` (ontologyNodesUsed/hooksInjected/tensionEdgesUsed = rendered lines `slice(0,50)`) + `injectedBridges {id,sourceAuthor,sourceConcept,targetAuthor,targetConcept,bridgeText}`.

> Open: two tokenizers + two thresholds feed the consumers (provider len≥4 raw-split; bridges/tensions len≥5 `extractTopicWords`). The retriever must preserve **both** per-consumer.

---

## 5. Embedding (corrected fastembed details)

Embed concept text with the in-tree **`FastembedProvider`** (`archon-docs/embed_fastembed.rs`, `EmbeddingModel::BGEBaseENV15`, 768-dim). **Critique corrections:**
- API is the **`LocalEmbeddingProvider` trait: `embed_chunks(&[String]) -> Vec<Vec<f32>>` and `embed_query(&str) -> Vec<f32>`** — *not* `provider.embed`. Constructor `with_load_timeout` (no zero-arg `new`).
- Model cache = **`dirs::data_dir()/archon/fastembed`** (*not* `~/.cache/fastembed`). **Cold cache needs network** — the one non-self-contained step at import; pre-warm it.
- Fastembed **prepends `search_document: ` to documents and `search_query: ` to queries and L2-normalizes both** — account for the asymmetric prefixes in the score formula (`score = 1 - cosine_distance/2`); embed concepts as documents, queries as queries.
- Per concept, input = `[name, greek, translit, translation, definition].filter(non-empty).join(' ')` (Aristotle/Heidegger manifest concepts: name + matched bekker/section text — their only body). `:put vec_corpus_concepts` after `ensure` of the HNSW index. v1 = one vector per concept (fastest path to BLOCK-1 parity); per-phrase embeddings are a follow-on.

---

## 6. Concept → `doc_chunks` provenance (ties into the verbatim-provenance work)

`corpus_concept_chunks {concept_id, chunk_id => link_kind, anchor_phrase, confidence}` (composite key, modeled on `doc_kb_memberships`; `chunk_id` is a plain FK into `doc_chunks`, no enforcement — exactly as `kb_claims` references chunks). Resolution: run each Wendt `anchor_phrase` / `key_terms.gloss` / `definition` as an HNSW query over `vec_text_chunks`; where cosine ≥ ~0.9, write a row (`link_kind='anchor-match'`, confidence=score). This makes the **QuotationFidelityValidator path queryable in Datalog**: given a concept → fetch its chunk(s) → compare quoted text against `doc_chunks.content` + the page-level (and, post verbatim-spec, sub-page bbox) provenance.

**Rightsized expectation (critique):** `anchor_phrases` exist in only **2 of 8** Wendt units, and Aristotle/Heidegger scope-manifests store **no body text** — so most concepts are **locus-only** (no chunk row) unless their PDFs were OCR-ingested. Provenance coverage is uneven *by design*; downstream checks must tolerate locus-only concepts.

---

## 7. The `analysis-entry` skill (replaces the lossy Python compiler)

`assets/skills/analysis-entry/SKILL.md` (YAML frontmatter + markdown, verified format) drives the **in-tree Rust importer** — it ships **no Python/interpreter**. OCR/PDF→`doc_chunks` is an **external pre-step** (the v7 Marker pipeline), out of scope. Steps: detect entry pattern from folder layout → `ensure_corpus_schema` (idempotent) → run the matching adapter (unify tensions, normalize type vocab, drop corrupt centrality) → build inverted-index + embed → resolve anchor→chunk → verify row counts (re-run idempotent). The CozoDB upsert **replaces `compile-corpus-index.py`**, which is then retired.

---

## 8. Phases (P0.5 inserted; adapter coverage is the long pole)

| Phase | Goal | Effort |
|---|---|---|
| **P0** | `ensure_corpus_schema` + idempotency harness (all `corpus_*` + `vec_corpus_concepts` + HNSW via run_create additive-or-ignore; prove re-runnable) | M |
| **P0.5** ⚠️ | **Corpus census + adapter coverage** — enumerate ALL 19 entry dirs → adapter (add burke-monograph **+ -DEEP fields**, calleja-monograph, structured-analysis); build the **CSV dialect normalizer**; tabulate the relation-verb census; map omitted crown-jewel fields (Burke -deep tables, Wendt mediation_relations/object_types_present, cluster readings/themes/debate_axis_positions); disposition the defer/special entries | **L (the long pole)** |
| **P1** | Wendt rich-unit adapter end-to-end (reference shape) — verify the 315+ edges + 12 wendt-position tensions land | L |
| **P2** | Tension unification + type/centrality normalization (4-shape superset; 36→controlled enum fold; centrality corruption drop) | M |
| **P3** | Remaining adapters — **burke-monograph + -deep (highest value)**, calleja-monograph, structured-analysis (Rickert/Uexküll), Aristotle/Heidegger manifests, clusters | L |
| **P4** | Inverted index (**substring-capable**) + fastembed embedding (corrected API/cache/prefixes) | M |
| **P5** | Datalog retriever to PARITY — 3 blocks + mandatory bridge, exact templates/caps/scorers, **line-for-line diff vs live TS as the HARD gate** | XL |
| **P6** | concept→`doc_chunks` linkage (anchor/key-term resolution; ties to verbatim-provenance) | M |
| **P7** | `analysis-entry` SKILL + cutover (retire `compile-*.py`; switch writer to Datalog once P5 parity holds; keep TS as rollback) | M |

**Sequencing reality:** the substrate (P0) is trivial; **P0.5 + P3 adapter coverage is where the data-loss risk and most of the effort live** — Burke/Calleja/Rickert/Uexküll are the highest-value, least-covered data. P5 parity is the cutover gate.

---

## 9. Open items & self-contained risks

**Open items:** Aristotle/Heidegger reasoning edges live only in `.mmd`/`.svg` (v1 imports nodes/lemmas, edges deferred — needs a `.mmd→CSV` pre-pass or hand-authoring); finalize the tension-verb whitelist via the full relation-verb census; `roda-crosswalk.md` markdown-table parser is per-entry hand-tuned (non-Aristotle bridges hand-modeled into `corpus_bridges`); verify exact Cozo string-fn names for the mandatory-bridge `str_includes`/max-per-side query; confirm `::hnsw` indices survive sqlite-backend restarts; decide whether to populate `queryExpansions` or preserve empty-array parity.

**Self-contained risks:** the importer links `archon-docs` for `FastembedProvider` → needs the onnx model cache warmed (cold cache needs network — the only non-self-contained import step); `run_script_guarded` takes a **process-wide write lock** → **run with the archon daemon DOWN** (else SQLITE_BUSY); nested JSON is `String` → any query that filters on array membership must use a **flattened child relation**, not the JSON string; the **drafting LLM call stays cloud Anthropic outside the substrate** — "self-contained" = retrieval+embedding only, the binary cannot draft offline; the **3-scorer parity** (len≥4 vs ≥5, substring vs bidirectional-substring vs one-directional, render slices 200/150/200, units 5-vs-all) will silently diverge under any unified/`contains` shortcut — the P5 diff is the gate.
