# The Corpus Index System — Function, Integration, and Future Work

**Date:** 2026-07-28
**Basis:** 12-agent evidence audit (8 mapping agents, 3 adversarial verifiers, 1 synthesizer; 1.81M tokens, 657 tool calls). Every claim below is traceable to `path:line`. Where two agents disagreed, the verifier's correction is used and the disagreement is recorded.
**Companion:** `plans/index-system-implementation-plan-2026-07-28.md`

---

## 0. Executive summary

The corpus index is the most valuable and least engineered asset in the system. Twenty-seven hand-curated entry directories — 1,848 files, roughly 40 hours of expert annotation each for the best of them — encode exactly the cross-author, cross-text relational knowledge that the drafting pipeline cannot derive from vector search. It is genuinely the differentiator.

It is also almost entirely inert. Of those 1,848 files, the compiler reads **four filename patterns**. Everything the drafting LLM ever sees from the index arrives through a single 664 KB artifact, `corpus/index/compiled-index.json`, holding four arrays. The 219 edge CSVs (19,770 rows), all 877 per-unit analysis files, and every debate map and citation network are, at runtime, dead weight.

Five findings reframe the four goals you set:

1. **The index is already being ingested.** 772 of 1,182 manifest records are under `index/`; 25 chunks are live in ChromaDB with `collection="index"`. Your instinct to move it out is correct and the problem is present-tense, not hypothetical.

2. **"Mirror the corpus organization" is not well-defined as stated.** Document→domain is a many-to-many relation, not a function. `corpus/rhetorical_ontology` alone is the source for **eleven** separate entries; 23 PDFs are byte-identical duplicates across domains; 3 documents legitimately belong to more than one entry. A mirror flattens the only structure that distinguishes "Aristotle primary" from "secondary scholarship about Aristotle" — both live in `rhetorical_ontology`.

3. **"One entry per document" has no viable quality floor.** Every numeric gate in your own canonical protocol is cross-unit by construction. At N=1, debates, contested readings, intra-cluster citations, the concordance grid, and the scholarly-evolution arc all collapse to nothing. In the gold-standard cluster, 32 of 41 concepts and 12 of 12 debates are multi-unit.

4. **Grouping is blocked on a format problem, not a wiring problem.** The Phantasia Secondary cluster — the exact example you named — is invisible to the only cross-entry substrate. Registering it is not a config edit: its ontology is written in a prose dialect no parser in the repo can read. Adding it to `TEXT_DIRS` today compiles **zero** nodes and emits **no warning**.

5. **The sandbox is much further along than its own documentation says.** Phases 0–3 are complete, including a $25 batch extraction that produced 4,961 claims across 23 papers. Phase 4 is exactly half done. But the live ontology grew 278→701 nodes while the sandbox sat idle, and the resolver gold set — the artifact you're halfway through — resolves **100% against the sandbox ontology and only 25–36% against live**. That is the single most important number in this report.

---

## 1. What the index physically is

`corpus/index/` holds **27 entry directories** (1,848 files) plus the generated `compiled-index.json`.

*Note on the count: two mapping agents reported 28 and 9-unregistered. The verifier established the canonical figures — `ls -1` returns 28 lines because it includes `compiled-index.json`; `find -maxdepth 1 -type d` returns 28 because it includes `.backups`. The true figures are 27 entries, 19 registered, 8 unregistered.*

### 1.1 Seven layouts, not one

There is no normative schema. The tree is a stratified accretion:

| Layout | Example | Shape |
|---|---|---|
| Article-per-folder cluster | Aristotelian Phantasia Secondary | one dir per article, `_synthesis/` on top |
| Monograph | In-Game (Calleja 2011) | `units/` + `_synthesis/` + `bridge-sources/` |
| Structured/analysis pair | several | `X-structured/` + `X-analysis/` |
| Flat scope-manifest | Aristotle - Complete Works | flat, work-mapped |
| Flat data/video | RDR2 playthrough | flat |
| md-only "Part III lite" | VR Pedagogy Secondary | markdown only |
| Pipeline run-history | `Dissertation/` | not a source-text entry at all |

The dominant per-unit artifact is the triplet `<slug>.json` + `<slug>.md` + `<slug>-edges.csv`, but only ~180 of ~400 unit JSONs even share the `unit_id` key, and the triplet is complete for a minority of stems.

### 1.2 The edge CSVs are the largest payload and the least normalized

219 files (excluding `.backups`), 19,770 rows, **42 distinct header layouts**, **633 distinct `relation` values**. The canonical `source,relation,target,locus,note` header covers only 135 files (+5 whitespace variants). Only ~11% of source/target tokens carry a typed `TYPE:` prefix.

Concretely: Phantasia's `global-edges.csv` is 10 columns / 706 rows; Boredom Secondary's is 6 columns / 1,897 rows; their head relation vocabularies are disjoint.

### 1.3 "Common artifact set" is a naming convention, not an interface

Five hand-built secondary clusters share 12 synthesis artifact filenames. At the schema level they share nothing:

- `cluster-ontology.json` — 5 schemas
- `debate-map.json` — 5 schemas
- `citation-network.json` — 5 schemas
- `book-level-ontology.json` — 7 schemas
- `tension-edges.json` — **10 mutually incompatible shapes across 10 files** (an 11th file exists; its shape is unverified)
- `concept-matrix.csv` — 16 distinct headers, 4 orientations
- `global-edges.csv` — 4 layouts

There is no shared unit-record type, no schema file, and no validator anywhere in the repo.

### 1.4 ID prefixes are the only cross-file join key, and they are unenforced

31 prefixes in use (`phx-`, `ped-sec-`, `dfd-`, `ptf-`, …), no registry file, 4 entries on non-numeric schemes, and Aristotle mixes uppercase `unit_id` values with lowercase filenames.

### 1.5 Provenance is largely absent

Only ~10 manifests record source PDFs, and most of those bibliographically rather than by path. **Nine entries have no machine-readable source path at all.** One declared path is simply broken: `Virtual Learning Environments (King–Salvo)/units/vle-05-…md:3` points at `corpus/virtual_learning_environments/`, which does not exist (the real directory is capitalized).

---

## 2. The compiler

`scripts/compile-corpus-index.py` — 1,412 lines, **zero arguments**. No argparse, no flags, no env vars, no incremental cache. Full rebuild in 0.02 s.

### 2.1 What it reads

A hardcoded 19-entry `TEXT_DIRS` dict (`:35-133`) plus a 10-entry `ARISTOTLE_WORK_MAP` (`:136-147`), and exactly four filename patterns:

- `book-level-ontology.md`
- `cluster-ontology.md` (fallback, added between 2026-06-23 and 2026-07)
- `*-ontology.md` (Aristotle glob)
- `*-cross-pipeline-hooks.md` (Aristotle only)
- `tension-edges.json`

Out of 1,843 files.

### 2.2 What it emits

`compiled-index.json`, 664,494 bytes, built `2026-07-20T16:03:58Z`:

| Key | Count |
|---|---|
| `ontologyNodes` | 701 |
| `crossPipelineHooks` | 72 (100% Aristotle) |
| `tensionEdges` | 64 |
| `canonicalTerms` | 1,722 |

### 2.3 Seven silent-skip sites

This is the compiler's defining characteristic: **a clean run proves nothing.**

- 8 of 27 entries are not in `TEXT_DIRS` and are invisible — no warning fires, because collection iterates `TEXT_DIRS`, not the filesystem.
- 4 of 11 `tension-edges.json` files produce **zero** edges silently (55 tension records dropped) because their records lack `node_a`/`node_b` and `_normalize_tension_edge` returns `None` without warning (`:1128-1129`).
- `parse_ontology_md` returns an empty list rather than erroring on unparseable input.
- No `--check` flag, no non-zero exit, no self-check against manifest-declared counts.

Malformed input is indistinguishable from absent input.

### 2.4 Twelve structured files ignored in favor of regex-parsing their markdown twins

Clean `*-ontology.json` siblings exist and are never read. The compiler regex-parses the `.md`.

### 2.5 Parse pollution

One `centralityTier` field holds **10,009 characters of a dumped markdown edge table**. `centralityTier` and `type` are unusable as filter keys.

### 2.6 Output is not byte-reproducible

`canonicalTerms` sorts on `(-len, lower())`, so 101 case-duplicate pairs tie completely and flip order per run under Python's randomized set iteration. Every recompile dirties a git-tracked file with meaningless reordering, defeating content-hash staleness checks and making real diffs unreadable.

### 2.7 It is invoked by no code, anywhere

`grep` for the script name across `src/` and `scripts/` returns nothing. It is run by hand. `god-learn compile` is a completely different thing (Phase 1–3 corpus ingest → Chroma, `scripts/god_learn/god_learn.py:333-340`) and never touches `compiled-index.json` — confirming the existing memory note.

---

## 3. How the index reaches retrieval

One canonical loader: `loadCompiledIndex()` in `src/god-agent/shared/jsonl-loaders.ts:198-218` (mtime-cached, hardcoded path). One bypass that re-reads and re-parses the file itself: `smart-retrieval-layer.ts:798`.

Two facade modules wrap it: `src/god-agent/universal/corpus-index-provider.ts` and `src/god-agent/shared/cross-author-utils.ts`.

*Note: `corpus-index-provider.ts` has moved from `shared/` to `universal/` since the sandbox's gap review was written.*

### 3.1 Three touch points on the vector path

1. **Query expansion, before embedding** — `expandQueryWithCanonicalTerms` (`smart-retrieval-layer.ts:888`) and `expandQueryWithOntology` (`retrieval-stage.ts:172-183`).
2. **Post-hoc re-scoring, after the cross-encoder** — a +0.10 canonical-term boost (`smart-retrieval-layer.ts:252-291`).
3. **Prompt injection** — ontology/hook/tension lines and the "MANDATORY THEORETICAL SYNTHESIS" bridge block in `gold-standard-prompt-builder.ts`.

It is **never** used for ChromaDB pre-filtering. `where` filters carry author and title only. The one partial exception is ICP Stage 6b, which turns a bridge's derived authors into a `where: {author_raw: {$eq: …}}` supplemental query (`icp-orchestrator.ts:386-392`).

### 3.2 "corpus/index FIRST, ChromaDB fallback" is not implemented

The preference appears in plans, handoffs, and `REVISION-PROTOCOL.md`. **Zero code implements it.** The live order is inverted: ChromaDB is queried unconditionally and the index is additive, never gating.

This is a workflow rule you follow by hand. It is worth deciding whether you want it to become a code rule, because right now the two disagree.

### 3.3 Live caps

1 bridge per facet (`cross-author-utils.ts:498`), 3 tensions per facet (`:542`). The sandbox worktree raised these to 3 and 5; the change was never landed.

### 3.4 Dead and broken index-consuming paths

- The legacy `write()` branch.
- The ICP author-conflict-events block — imports a non-existent export.
- `RetrievalOptions.collections` — accepted everywhere, read nowhere.
- `FacetedRetrieval`'s 4-argument `hybridSearch` calls — TS2554 arity error confirmed by `tsc`; extra options are silently dropped at runtime under `tsx`. **The ICP path therefore never reranks.** ICP and the write pipeline currently run materially different retrieval quality.
- `_hooksDerivationDone` is a one-shot global that breaks author derivation after any cache invalidation.

### 3.5 Reranker status

Retrieval is already wired to the cross-encoder: `smart-retrieval-layer.ts:240` (rerank call), `:901` (`kind:'query'`), `:931` (poolSize), `:1184-1197` (enable + endpoint default), `:1206` (candidateMultiplier), `:1210-1220` (rerankResults); config in `config-manager.ts:134-138, :284-285, :365-366`.

`wraith-infer` at `192.168.50.22:8100` is **live**, serving gte-Qwen2-1.5B (1536-d) and `bge-reranker-v2-m3`. Local `:8000`/`:8001`/`:8002` are **down** — `.run/chroma.pid` 5972, `.run/embedder.pid` 6008, `.run/marker.pid` 6555 are all stale.

---

## 4. How the index reaches analysis and drafting

Through exactly one artifact — `compiled-index.json` — and nothing else. No runtime TS/JS code walks the per-entry directories; only Python build scripts do.

The drafting LLM sees ontology lines, hook lines, tension lines, and the mandatory-bridge block. The tension quality gate consumes tension edges. That is the whole surface.

### 4.1 Corrections to recorded assumptions

The audit surfaced several memory-file entries that no longer match the code:

| Recorded | Actual |
|---|---|
| "ChromaDB collections metaphysics/new_media/rhetorical_ontology" | **One collection, `knowledge_chunks`.** Those are values of a per-chunk metadata field `collection`, filtered by `where` (`run_ingest_phase2.py:192-193, :1094, :1742`; `smart-retrieval-layer.ts:90, :920`) |
| "QuotationFidelityValidator (70%+)" | Stage threshold is **0.90** (`quotation-fidelity-stage.ts:60-61`) |
| "QualityGauntlet (7 stages)" | **10 default stages**, weights summing to ~1.20 then normalized (`quality-gauntlet.ts:574-589`). Code comments still say 7 |
| "Secondary clusters NOT registered, by design" | **Policy reversed in practice.** Boredom Secondary (61 nodes) and VR Pedagogy Secondary (60) are now the two largest contributors, enabled by the `cluster-ontology.md` fallback (`compile-corpus-index.py:1217-1224`) |
| "God-write: EMBEDDED PACK not corpus retrieval" | True for the no-flag path (`write-pipeline-orchestrator.ts:3752-3756`) — **but** the documented `/god-write` invocation uses `--use-corpus` (`.claude/commands/god-write.md:27-33`), which under default v2 **does** inject index blocks (`:3532`). Pack-only mode requires dropping the flag |

I'd suggest updating those memory files; three of them would mislead a future session.

---

## 5. Ingestion, and why the index must move

### 5.1 The index is already ingested

All Python walkers use `root.rglob("*")` with one shared `SKIP_DIRS = {".extracted_media", "__pycache__", "node_modules", ".git", ".ingest_cache"}`. **`index` is not excluded.**

Present state:
- **772 of 1,182 manifest records** (522 unique docs) are under `index/`
- **4 PDFs reached Phase 5** and are live in ChromaDB as **25 chunks** with `collection="index"`
- **516 `.md` + 2 `.txt`** reached Phase 1 only — manifest rows, never embedded

So the index is polluting the retrieval corpus today, at low but nonzero volume, and occupying 65% of the manifest.

### 5.2 Domain assignment is positional

`collection_from_relpath()` takes the first path segment of the corpus-relative path. It is Chroma *metadata*, not a Chroma collection.

### 5.3 Blast radius of relocating `corpus/index`

The first mapping agent put this at "7 files, ~12 lines." The verifier found that estimate incomplete in four ways:

1. **A string-free coupling class exists.** Code that reconstructs a corpus path by joining the corpus root to a manifest `path_rel` resolves into `corpus/index` without containing the substring, and survives any grep-driven migration. At least four additional must-change sites: `endnote-generator.ts:31`, `missing_link_detector.py:439`, `coverage_analyzer.py:470`, `orphan_identifier.py:335`. **The 772 manifest `path_rel` values must also be rewritten** or these silently resolve to non-existent files.

2. **A third full-corpus driver was missed, and it is the primary user-facing one.** `scripts/god_learn/god_learn.py:755` defaults `--root` to `<repo>/corpus` and shells `run_ingest_phase2.py` (`:332-340`, `:720-721`). It is exposed as `/god-learn-compile`, `/god-learn-update`, `/god-learn-verify`. **One keystroke walks `corpus/index`.**

3. **The SQLite vector store carries path strings.** `strings vector_db_1536/chroma.sqlite3 | grep -c corpus/index` = **458**. By field: `chroma:document` 41, `path_abs` 25, `raw_content` 1. Critically, **39 of those are embedded prompt/memory text in `god_agent_vectors_1536` — not fixable by re-ingestion.**

4. **The prose blast radius is dominated by a surface neither mapping agent counted.** `corpus/index` is massively self-referential: **297 files inside it** (245 `.md`, 51 `.json`, 1 `.mmd`) cite their own location. Plus 47 live plans, 389 tmp files, 3 files under `reports/`, and `corpus/download/_basic-ingest-summary.md`.

Two further must-change sites: `audit_ingest.py` and `verify_ingest.py` have **no `SKIP_DIRS` at all** (`:60`, `:67`) — they walk `.extracted_media` and `.backups` that the ingesters skip — and both default `--root` to a machine-specific absolute path (`:97`, `:166`).

One correction in the other direction: the `.backups` ingestion exposure was rated HIGH citing `reingest-max.sh`. That driver runs `--pdf-only`, and the actual exposure is **12 markdown files, 0 PDFs**. Downgrade to medium-low and re-attribute to the all-extension drivers.

### 5.4 Git exposure

Git tracks **335 of 1,848** files under `corpus/index` — 3 subtrees plus `compiled-index.json`. **82% has no history.** A `git clean -fd` or a fresh clone loses Aristotle (131 files), Dissertation (358), Burke, Heidegger, Calleja, RDR2, Rickert, and Uexküll. The rest of `corpus/` is untracked but **not gitignored**.

This is the highest-severity finding in the report and it is unrelated to any of the four goals.

---

## 6. How entries are created today

By hand, as a long agentic session driven by a per-entry plan document in `plans/`, against a 7-phase pipeline (−1 through 5) with exactly two human gates: **G0** (plan/spec approval) and **G1** (pre-commit review).

The reusable executable spec is `plans/secondary-cluster-index-plan-TEMPLATE-2026-07-15.md`. It is an LLM-agent pipeline, not code. **There is no programmatic generator for any synthesis artifact anywhere in `scripts/` or `src/`.**

### 6.1 The quality floor is largely unenforced

- The verbatim-quote detector — the mandatory G1 copyright gate — **does not exist**. It is currently satisfied by agent self-attestation.
- Mermaid render validation **has never been performed** (`mmdc` not installed; the RDR2 quality-gates report records it as deferred).
- Only **2 of 27** entries have a `quality-gates-report.md`; only **1 of 27** (RDR2) has a machine-readable `metrics` object.
- `ig-10-incorporation.json` (45,350 B) is **malformed and unparseable** — the only unparseable file of 494. Its folder also holds a parallel `ig-10-deep.{json,md,-edges.csv}` triplet, so which file is authoritative for In-Game chapter 10 is undetermined.

### 6.2 The gates are cross-unit by construction

From the canonical template (`:216-229`): ≥12·N edges · 8–12 debates · 8–12 contested readings · ≥50 lemmas · ≥max(10, N/4) intra-cluster citations · every unit in ≥1 concordance cell.

Gold-standard evidence that these are genuinely cross-unit: 32 of 41 concepts multi-unit; **all 12 debates multi-unit**; 288 canonical loci canonicalized from 628 raw; 213 lemmas from 279 raw; 31 directed intra-cluster citations.

**At N=1 this all evaluates to zero.** That is the structural argument against one-entry-per-document, and it comes from your own protocol rather than from an outside opinion.

---

## 7. Corpus↔index mapping reality

Exact-basename provenance resolution over all 288 corpus PDFs against every entry's full text: only **168/288 (58%)** are referenced by any entry.

| Domain | PDFs | Covered |
|---|---|---|
| boredom | 50 | 50 |
| pedagogy | 35 | 35 |
| download | 35 | 34 |
| biomedical_engineering | 19 | 19 |
| rhetorical_ontology | 63 | **24** |
| new_media | 43 | **2** |
| metaphysics | 19 | **2** |
| Virtual Learning Environments | 5 | 1 |
| Part_II | 1 | 1 |
| **AD(H)D** | **17** | **0** |
| **textual_analysis** | **1** | **0** |
| dissertation | 0 | — |

**Fan-out is 11:1.** `corpus/rhetorical_ontology` (63 PDFs) is the exact-verified source for eleven separate entries: A Grammar of Motives, A Rhetoric of Motives, Aristotelian Emotion Secondary, Aristotle - Complete Works, Dissertation, Heidegger - BCAP, Heidegger - Being and Time, Heidegger and Rhetoric, Rickert - Ambient Rhetoric, Uncomfortable Situations, Von Uexküll.

**Multi-domain entries:** Aristotelian Emotion Secondary = {download, rhetorical_ontology}; Aristotle - Complete Works = {metaphysics, rhetorical_ontology}; Boredom Secondary = {boredom, biomedical_engineering}; Dissertation = {download, rhetorical_ontology}.

**Documents in more than one entry:** `Burke, Kenneth - A Rhetoric of Motives_(1950)_[My Copy].pdf` → {A Grammar of Motives, A Rhetoric of Motives, Dissertation}. Three PDFs are in this class.

**Cross-domain byte-identical duplicates:** `md5sum` over 288 PDFs → **23 duplicate groups, 20 cross-domain**. 17 × (biomedical_engineering, boredom); 2 × (metaphysics, new_media) — Heim's *Metaphysics of Virtual Reality* and *Virtual Realism*; 1 × (download, rhetorical_ontology) — Corcilius. Because Boredom Secondary's `units[].sourceFile` values are bare filenames, **17 of its 55 units have genuinely ambiguous domain provenance.**

**Consequence.** Before "mirror the corpus organization" is even specifiable it needs: (i) a canonical-domain rule for the 20 duplicate groups, (ii) a representation for one-document-to-many-entries, (iii) a policy for the 11:1 fan-out, (iv) a decision on the 3 zero-coverage domains, (v) re-derived provenance for the 9 entries that declare none.

Auto-creation on ingest would also spawn entries for literature deliberately never indexed — **AD(H)D alone = 17 new entries.**

---

## 8. Key-stability risks

| Risk | Mechanism | Path:line |
|---|---|---|
| `doc_id` is path-derived | `sha256(f'{path_rel}:{sha256_file}')[:16]`; chunk ids `{doc_id}:{idx:05d}`. Relocating any document mints a new doc_id and chunk-id namespace **with no dedup against the old chunks** | `run_ingest_phase2.py:220-222, :659, :699, :1825-1833` |
| Author resolution parses the display label | `deriveAuthor` splits on `' - '`; result becomes the ChromaDB `author_raw` exact-match filter for ICP Stage 6b. Renaming an entry breaks author-scoped retrieval | `cross-author-utils.ts:364-406, :395-398, :358-362` |
| `text` is a label, not a path, and does not round-trip | `'Burke - A Grammar of Motives'` ≠ dir `A Grammar of Motives (Burke 1945)`; 10 Aristotle labels are not directories at all | `compile-corpus-index.py:34-147, :1330-1332` |
| Entry names hardcoded in code | 5 literal `corpus/index/<Entry>/…/global-edges.csv` paths | `scripts/normalize-edges.py:37-41` |
| `TEXT_DIRS` keys are directory names | Any rename silently drops the entry | `compile-corpus-index.py:35-133` |
| Nondeterministic artifact | Recompile dirties git with meaningless reordering | §2.6 |
| 82% of the index has no git history | — | §5.4 |

---

## 9. The analysis-upgrade sandbox — true state

The sandbox's own `00-TODO.md` (Apr 18) reads "prototype done, promotion pending." The filesystem disagrees. Four generations exist:

1. `sandbox/` (Apr 18) — Nussbaum-only proof of concept
2. `claim-extractor-upgrade/` (Apr 18–19) — 6-stage genre-aware extractor, Opus-judged gold eval, precision 1.00 / recall 0.67
3. `integration-sandbox/` (Apr 19) — end-to-end on 3 papers
4. `production-sandbox/` (Apr 19 – **May 6**, 551 MB, git worktree on `writing-pipeline-v3`) — the real state, superseding `03-implementation-plan.md` entirely

### 9.1 Phase status against MASTER-PLAN.md

| Phase | Status |
|---|---|
| 0 — backup | **COMPLETE.** Exact byte-match verification: 306/306 files, 6,072,017/6,072,017 bytes for `corpus/index/`; 133/133 files, 33,724,440 bytes for `tmp/analysis-upgrade/`. *(The plan's "≥1.1 GB" gate was a bad size estimate; the manifest documents the substitution explicitly. Not a gate failure — a documented substitution.)* Real limitation: the snapshot was taken at 07:48 and `production-sandbox` was created at 07:51, so it contains **no Phase 2/3a/3b/4 output.** |
| 1 — worktree isolation | **COMPLETE** |
| 2 — consumer wiring B1–B7 + H1 | **COMPLETE**, O1 smoke gate passing. This retires the gap review's headline complaint ("we built the producer, not the consumer") |
| 3a — canary | **COMPLETE** |
| 3b — batch extraction | **COMPLETE.** 15 PDFs, ~$20, 158 min. 1,145→**4,921 claims** in `compiled-index.v2.json`, 8→**23 authors**, 96→**552 bridges**, 558→**1,136 hooks**, 1,990→**7,389 ontology nodes** |
| R1 / R1.3 (unplanned detour) | Evaluated and KEPT |
| 4 — gold set | **HALF DONE.** Holdout 20/20; dev **25 of 50** |
| 5 — E0–E8 ladder | **NEVER RUN.** `run-experiment.sh` and `run-ab.sh` are both explicit `exit 1` stubs |
| 6 — promotion | **NOT STARTED.** Zero promotion, verified four independent ways |
| 7 — rollback | Unverified |

### 9.2 A counting correction that matters

All batch counts came from `wc -l`, but **22 of 24 `claims.jsonl` files have no trailing newline**, so each is undercounted by exactly one. Python non-empty-line count gives **4,961**, not 4,939.

Downstream: `compiled-index.v2.json` holds 4,921 claims, so the faithfulness filter dropped **40** records, not 18. The same off-by-one affects the GEN-1 (119/557/24) and GEN-3 (79/320/24) figures wherever `wc -l` was used.

Likewise `ontology-embeddings.jsonl` is **278 records**, not 277.

### 9.3 The number that reframes the whole sandbox

While the sandbox sat idle from May 6 to today, the live index grew **278 → 701 ontology nodes** and **45 → 64 tension edges** via 14 new clusters (Boredom Secondary, VR Pedagogy Secondary, Presence Theory, Social Presence, Rhetoric of Interactivity, RDR2 Secondary, Burke, Calleja, Wendt, FCM, VLE…).

Consequences:

- The 278-node `ontology-embeddings.jsonl` now covers **277/701 = 39.5%** of the live ontology. *(Not "invalidated" — a valid subset. Re-embedding the 423 newer nodes makes it usable; a from-scratch rebuild is not required. At the measured 2026-04 rate, 701 nodes is ~4 seconds.)*
- **The resolver gold set's labels resolve 100% against the sandbox ontology but only 25–36% against live.**

That second point is decisive. Finishing dev items 26–50 against the sandbox ontology would produce 25 more annotations that are already two-thirds stale on arrival. **The gold set needs an ontology-rebase decision before annotation resumes, not after.** This is a genuine change from what I told you earlier today: I had verified the gold set was internally consistent and safe to resume, which it is — but internal consistency was the wrong test. The set is coherent with a snapshot of the world that no longer exists.

### 9.4 Drift and merge

Worktree forked at `54c2ba1fe` (2026-04-17); live HEAD is **22 commits ahead**, 822 net new lines across 5 of the 9 promotion-target files. A trial merge produces **one real conflict**, in `write-pipeline-orchestrator.ts`. Four of the nine files — `jsonl-loaders.ts`, `cross-author-utils.ts`, `corpus-index-provider.ts`, `stage-types.ts` — have zero live changes.

### 9.5 What is and is not at risk

The Phase-2/R1/R1.3 **code is committed** as three real commits on `writing-pipeline-v3` (`1268adbcf`, `670fd2939`, `1e0aa7e34`); those objects live in the main repo's `.git`, not in `tmp/`. Deleting `tmp/analysis-upgrade` orphans the worktree registration but does not destroy code.

The exposure is different and worse than "don't delete tmp/":

- **`git ls-remote --heads origin` lists only `writing-pipeline-v2`.** `writing-pipeline-v3` has **no upstream**. Tag `pre-promotion-20260419` is **absent from the remote.**
- The ~$25 of extracted claim data and ~40 h of gold annotation under `production-sandbox/data/` are **untracked and irrecoverable.**

**The code survives tmp-deletion but not disk loss.** Given your WSL-only push discipline, this is worth fixing this week regardless of what else happens.

### 9.6 The Phase 4 process problem

215 drift-log entries and a 1,124-line `CONVENTIONS.md` support 25 annotated items. May 2–4 produced 21 convention-codification snapshots and **zero** new annotations. The edit distribution across Apr 22 → May 6 (80 / 34 / 40 / 40 / 15 / 5 / 1) is roughly uniform — and `CONVENTIONS.md` §8.1's own health test diagnoses a uniform distribution as "chronic underspecification (unhealthy)," expecting a healthy one to cluster early and taper.

The halt was the process reaching its own stall point.

### 9.7 A gate below its own noise floor

Phase 5 pre-registers keep/rollback at Δ dev F1 ≥ 0.02 on a 50-item set. At n=50, roughly one item flipping *is* 0.02 F1. The decision threshold sits at single-item resolution.

---

## 10. Feasibility of the four stated goals

| Goal | Verdict |
|---|---|
| **(a)** Move `index/` out of `corpus/` | **Feasible and necessary.** Blast radius is larger than first estimated — 4 extra code sites, 772 manifest rows, 458 SQLite string hits (39 unfixable by re-ingestion), 297 self-referential files, 47 plans. Mechanical, but not a one-line change |
| **(b)** Mirror corpus organization | **Not well-defined as stated.** Document→domain is many-to-many. Needs five prior decisions (§7) |
| **(c)** Auto-create per-document entries on ingest | **No viable quality floor.** ~60% of the value in existing entries is definitionally cross-document (§6.2). Would also spawn 17 unwanted AD(H)D entries |
| **(d)** On-demand cross-cutting groups | **Feasible, and the most valuable of the four** — but blocked on a format rewrite, not a config edit |

### 10.1 Why (d) is blocked

The Phantasia Secondary cluster — your named example — is one of the 8 unregistered entries. The natural fix is "add it to `TEXT_DIRS`." That does not work.

`grep -cE '^#### [0-9]+\.'` and `grep -cE '^\|'` both return **0** for Phantasia, RDR2 Secondary, and Emotion Secondary. Their H2s are prose section names (`## Volume-pillar concepts (Tier-1)`, `## Canonical CONCEPT nodes (38)`, `## Organizing structure`) — no `## 3A`. The body form is flowing prose with bold inline IDs:

```
**PHX-C-001 phantasia (the faculty/phenomenon)** is the unavoidable umbrella…
```

For contrast, the registered Boredom Secondary has **68** numbered headers.

Adding these three to `TEXT_DIRS` today compiles **zero** nodes and emits **no warning**. Three of your highest-quality clusters, including the nominated gold standard, are written in an ontology dialect no code in the repo can read.

Coverage check: a "phantasia group" query against `compiled-index.json` today finds **10 nodes**, all from primary Aristotle/Heidegger entries, and **zero** from the 8-unit Phantasia secondary cluster — against 18 entries with raw text hits.

### 10.2 Granularity mismatch

The request is for groups of **entries**. Available signals:

| Signal | Level | Count |
|---|---|---|
| Ontology embeddings | concept node | 701 (278 embedded) |
| ChromaDB | chunk | 413,160 |
| Folders | document | 269 unit JSONs |
| Manifests | cluster | 5 |

**Nothing is embedded at the unit or entry level.** Any grouping architecture must first choose and construct a representation level.

### 10.3 Four candidate architectures

**A — Compiled-index-only.** Cheapest; currently broken. Requires the format rewrite first. Inherits parse pollution.

**B — Direct-from-source with per-shape adapters.** Read `_synthesis/` and per-unit JSON off disk, bypassing the compiler — the approach `plans/archon-corpus-index-migration-spec.md:14-17` already mandates ("import from SOURCE files, not compiled-index.json") with 8 named adapter families (`:45-58`). Requires the normalization layer. `scripts/normalize-edges.py` exists for exactly this but is hardcoded to 5 pipeline paths covering **none** of the five secondary clusters.

**C — Embed-recall → rerank-precision.** Re-embed all 701 nodes (and/or construct per-unit documents) via wraith-infer with `kind:'document'`, retrieve top-K by cosine, re-rank with `bge-reranker-v2-m3`. Justified by the recorded eval verdict: raw 1536 cosine is a regression (MRR 0.285 vs 0.493 for 768 fastembed) but **rerank is the win** (768+rerank MRR 0.547; 1536+rerank R@10 0.573). Reuses `embed_ontology.py` / `resolve_concepts.py` verbatim.

**D — LLM synthesis over assembled evidence.** The actual group generator: deterministic member selection and evidence assembly (via A/B/C) → LLM authoring of the 12-artifact core, gated by the numeric quality gates already specified in the template and the node/edge caps already specified in `render-validation.txt`. Cost profile is the entry-creation profile, not a transform profile.

The evidence points to **B + C for member selection, D for authoring** — with A available later, once the format gap is closed, as a fast path.

### 10.4 What exists for grouping today

`cross-author-utils.ts:440-474` / `:500-530`: drop words under 5 characters, lowercase, substring containment against hook `sourceConcept`/`targetConcept` and tension `nodeA`/`nodeB`/`description`, hard cap 1 bridge per facet. **String matching, not semantic.**

---

## 11. Future work, ranked by value per unit of risk

**Tier 1 — do regardless of which goals you pursue**

1. **Get the index and the sandbox into git and onto a remote.** 82% of the index is untracked; `writing-pipeline-v3` has no upstream; the pre-promotion tag is local-only.
2. **Make the compiler fail loudly.** `--check`, non-zero exit, warning on unregistered entries, warning on zero-yield tension files, self-check against manifest counts. Seven silent-skip sites make every clean run meaningless.
3. **Make the compiled artifact deterministic.** One tiebreaker in the `canonicalTerms` sort.
4. **Rebase or retire the resolver gold set** before annotating item 26.

**Tier 2 — unblocks everything downstream**

5. **A normalization layer** — one unit-record type, one edge schema, adapters per family, a validator, and a schema file. Every other ambition sits on this.
6. **Close the ontology-format gap** for the 3 prose-dialect clusters. Either write a prose-dialect parser or convert the clusters; the parser is likely cheaper and is certainly less destructive.
7. **Build the eval harness.** `corpus/eval/` does not exist; `scripts/eval-retrieval.ts` was never written. Group-membership precision/recall cannot be measured today.

**Tier 3 — the stated goals**

8. Relocate the index (§10 (a)).
9. Cross-cutting groups (§10 (d)) — the highest-value feature in the request.
10. Revisit (b) and (c) only after the five §7 decisions are made, and probably in a different form than stated.

**Tier 4 — quality floor**

11. The verbatim-quote detector (the G1 copyright gate currently satisfied by self-attestation).
12. Install `mmdc` and actually run render validation.
13. Fix `ig-10-incorporation.json` and decide which In-Game ch.10 file is authoritative.
14. Fix the ICP `hybridSearch` arity bug — the ICP path silently never reranks.

---

## 12. Open questions the audit could not settle

1. The 11th `tension-edges.json` file's schema.
2. MASTER-PLAN Phase 7 status.
3. Three of the nine entries with no machine-readable source path.
4. The 20+ vs 42 edge-CSV header-dialect count reconciliation (one `head -1 | sort | uniq -c` on a fixed basis settles it).
5. Whether the +0.10 canonical boost applied **after** the cross-encoder was ever evaluated in the rerank A/B harness.
6. Whether `RetrievalOptions.collections` was ever functional in a prior revision.
7. Whether `FacetedRetrieval` is intended to get reranking at all.
8. Whether the `Debate axis N:` entries in `canonicalTerms` are intentional or an extraction bug.
