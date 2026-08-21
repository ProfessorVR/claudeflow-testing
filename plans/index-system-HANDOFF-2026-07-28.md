# Index System Programme — Execution Handoff

**Created:** 2026-07-28 · **Revised:** 2026-07-29 (v2, post-verification)
**For:** a clean session picking up execution with no prior context
**Repo:** `/home/dalton/projects/claudeflow-testing` · branch `feat/wraith-retrieval`

> **v2 notice.** The v1 handoff was checked by an 8-agent read-only verification pass (5 audits, 2 adversarial critiques, 1 synthesis; 988k tokens, 378 tool calls) plus direct spot-checks of every decision-critical claim. Its diagnosis held; **its numbers and all three Phase 0 commands did not.** Those are corrected inline below. Full correction table, evidence, and the reasoning behind every recommendation: `plans/index-system-HANDOFF-ADDENDUM-2026-07-28.md`.
>
> **Evidence tiering used below.** *Spot-checked* = re-derived directly in the revision session. *Audited* = established by the verification pass with `path:line`, not independently re-run. *v1* = inherited from the original audit, unchallenged.

## The four documents

| Document | Use it for |
|---|---|
| **this file** | What to do next, in order, with commands and traps |
| `plans/index-system-HANDOFF-ADDENDUM-2026-07-28.md` | Full correction table + evidence for everything in this file |
| `plans/index-system-implementation-plan-2026-07-28.md` | Phased plan, gates, risk register |
| `plans/index-system-report-2026-07-28.md` | Original evidence base — read with the addendum's corrections applied |

Read this file first. Consult the addendum when you need the evidence behind a correction, the plan for phase detail, the report for original citations.

---

## 0. Start here — the state in six lines

- Nothing under `corpus/index` has been modified. Zero byte drift since the D1 backup. **Spot-checked.**
- The programme's own tooling **is** modified and uncommitted — this matters, see §2.
- Three Phase 0 commands in v1 were wrong; §6 has the corrected ones.
- One item is urgent and was buried in Phase 2. It is now Phase 0 Item 0. Do it first.
- Five open questions need your answer before Phases 2, 3 and 5 are fully specified. See §10.
- Several recommendations below are **PENDING RATIFICATION** and are marked as such. Do not execute them as decided.

---

## 1. What this programme is

The corpus index is 27 hand-authored entry directories, 1,848 files, encoding cross-author and per-source analytical knowledge that vector search cannot reproduce. It is the system's differentiator.

Almost none of it is reachable by code. The compiler reads **four filename patterns** out of 1,848 files and emits one 664 KB JSON artifact with four arrays. **Roughly 310 unit records, 691 unit analyses, and ~9,762 distinct edges sit on disk and never reach runtime.**

> **Corrected from v1.** v1 said "357 unit records… 17,736 edge-CSV rows." Neither reconciles. 357 matches no derivation — §4's own units column sums to 323, corrected per-entry derivation gives 310. 17,736 double-counts nearly every edge, because `_synthesis/global-edges.csv` re-serializes the per-source files (Wendt control: 307 rows / 305 distinct on *both* sides, 100% intersection). Distinct triples ≈ 9,762. Separately 19,770 rows exist on disk and the `*-edges.csv` glob misses 2,034 of them — A Rhetoric of Motives ships 8 files named plain `edges.csv`; Grammar and In-Game ship `global-edges-pre-canonical.csv`. **Audited.**
>
> The headline is unchanged and still correct: **zero of it reaches runtime.**

The programme, in the user's stated priority order:

1. Wire the original index completely; repair weak and broken entries
2. Single-source entries for every source, **short articles included**
3. The analysis-upgrade sandbox (cross-author concept integration) — last

---

## 2. Already done, and what is *not* clean

### Full verified backup — do not skip reading this

```
.backups/corpus-index-full-20260728T230859Z/
  tree/                      full rsync -a mirror
  MANIFEST-source.sha256     SHA-256 of every source file
  MANIFEST-copy.sha256       SHA-256 of every mirrored file
  README.md                  provenance + restore recipes
.backups/corpus-index-full-20260728T230859Z.tar.gz         13 MB, 1,848 files
.backups/corpus-index-full-20260728T230859Z.tar.gz.sha256  878a8192...1ea3fe
```

Re-verified 2026-07-29 and it holds better than claimed: manifests identical (1,848 = 1,848), the recipe below returns `INTACT` exit 0, `sha256sum -c` on the tarball returns OK, and the live tree has **not drifted a single byte** since capture. D1 is done; restoring is safe. **Spot-checked.**

Restore whole tree:
```bash
cd /home/dalton/projects/claudeflow-testing
rsync -a --delete .backups/corpus-index-full-20260728T230859Z/tree/ corpus/index/
```

Re-verify the backup at any time:
```bash
cd .backups/corpus-index-full-20260728T230859Z/tree
find . -type f -print0 | sort -z | xargs -0 sha256sum | diff - ../MANIFEST-copy.sha256 && echo INTACT
```

One defect to avoid repeating: `…tar.gz.sha256` was written with an **absolute** path, so it only verifies at that exact location. Write future manifests with relative paths.

**Take a fresh timestamped backup before each destructive phase.** Reproducible script in §7.

### The tree is clean; the tooling is not

> **Corrected from v1.** v1 said "No source file has been modified. No code written." True for `corpus/index`. **False for the programme's own tooling**, and this invalidates the evidence base if anyone runs `git checkout`:
>
> | File | Worktree | HEAD |
> |---|---|---|
> | `scripts/compile-corpus-index.py` | **1,412 lines**, 19 registered entries | **1,397 lines**, 16 registered entries |
> | `corpus/index/compiled-index.json` | 701 nodes / 1,722 terms | 670 / 1,663 (tracked, dirty +583/−55) |
> | `scripts/ingest/run_ingest_phase2.py` | +206 / −69 | — |
> | `scripts/ingest/verify_ingest.py` | +18 / −4 | — |
> | `scripts/ingest/manifest.jsonl` | +882 | — |
> | `.gitignore` | +1 (uncommitted line 38) | — |
>
> **Spot-checked.** Every `path:line` in this file and in the report resolves against the **working tree**. A `git checkout` or `git stash` on the compiler or the artifact silently invalidates the whole evidence base. This is why §6 Item 1 must commit `compile-corpus-index.py`.

---

## 3. Ratified decisions — do not relitigate

| # | Decision |
|---|---|
| **D1** | Backup taken and verified (above) |
| **D2** | Tracking policy approved: **gitignore `.backups/`, track everything else** under the index. *Note: v1's rule text was wrong — see §6 Item 1 for the working rule* |
| **D3** | The 5 ontology-only entries get structured unit records, edges, **and the full treatment**. No lite profile. *Its sequencing is now in question — see §8* |
| **D4** | **RDR2 (Salvo Playthrough)** and **Veri(dis)similitude (Salvo MA)** are `analysis-artifact` entries — no synthesis layer, excluded from source-entry gates, **still reachable by entry-scoped retrieval** |
| **D5** | In-Game ch.10 is a **repair, not a choice**. All 13 chapters carry a topical + deep pair by design |
| **D6** | **Aristotle - Complete Works is healthy** — 199 of 701 nodes + all 72 hooks via `ARISTOTLE_WORK_MAP` |
| **D7** | Articles get standalone entries. Concern raised and overruled; build for it |

---

## 4. Verified state of the index

Census run 2026-07-28, **unit counts corrected 2026-07-29**. `nodes` = reaching `compiled-index.json`; `units` = structured unit records; `edges` = edge-CSV rows *(inflated — see §1)*.

### Healthy — 13 *(v1 said 11; the table always had 13 rows)*

| Entry | Nodes | Units | Edges |
|---|---|---|---|
| Boredom Secondary (Part III) | 68 † | 55 | 3,815 |
| VR Pedagogy Secondary (Part III) | 60 | 34 | 2,260 |
| A Grammar of Motives (Burke 1945) | 56 | 28 | 1,754 |
| In-Game (Calleja 2011) | 44 | 26 | 1,472 |
| A Rhetoric of Motives (Burke 1950) | 39 | 8 | 420 |
| Heidegger - Being and Time | 37 | **17** *(v1: 18 — the 18th `.json` is `manifest.json`)* | 284 |
| Heidegger - Basic Concepts of Aristotelian Philosophy | 37 | **13** *(v1: 14)* | 93 |
| Uncomfortable Situations | 36 | 6 | 744 |
| Heidegger and Rhetoric | 36 | 16 | 204 |
| Von Uexkull - A Foray | 35 | **14** *(v1: 15)* | 152 |
| Heidegger - The Fundamental Concepts of Metaphysics | 32 | 15 | 880 |
| Rickert - Ambient Rhetoric | 25 | 10 | 56 |
| Wendt - Design for Dasein | 15 | **8** *(v1: 7 — an* under*count)* | 614 |

Plus **Aristotle - Complete Works** — 199 nodes across 10 work labels, **34** structured unit records *(v1: 45; the extra 11 are 9 `*-greek.json` + greek-appendix + bekker-index)*, 402 edges, all 72 hooks.

† 68 is a label-**attribution** count from the §9 recipe (771 attributions across 701 nodes). Only **61** node objects carry it as their sole `text`. The same denominator slip produces D6's "199 of 701." Both figures are fine as long as you know which question they answer. **Audited.**

### Ontology-only — 5, all → full treatment per D3

| Entry | Sources | Nodes | Units | Edges |
|---|---|---|---|---|
| Virtual Learning Environments (King–Salvo) | 5 | 18 | 0 | 0 |
| Presence Theory (Foundations) | 4 | 10 | 0 | 0 |
| Social Presence in Virtual Worlds (Part III) | 3 | 10 | 0 | 0 |
| Rhetoric of Interactivity and VR (Part III) | 2 | 7 | 0 | 0 |
| Boredom Experiment (VR Attention Study) | 5 ch | 7 | 0 | 0 |

They have per-source analyses in markdown and a concept matrix; they lack structured unit records and edges.

### Unregistered but real — 4

| Entry | Units | Edges | Fix |
|---|---|---|---|
| Aristotelian Phantasia Secondary (1985-2017) | 8 | 1,414 | Ships `cluster-ontology.json` with **41 concepts**; compiler never opens JSON |
| RDR2 Secondary (2019-2023) | 12 | 1,012 | Ships JSON, **21 concepts** (thin: concept, units, tier) |
| Aristotelian Emotion Secondary (1975-2015) | 5 | 420 | Ships JSON, **40 concepts** (thin: label, units) |
| Aristotelian Motion and Time Secondary | 1 | 58 | **5 files total** — abandoned mid-creation; needs full entry creation |

### `analysis-artifact` class — 4, per D4

Dissertation · Game-Behavior Analysis Method · RDR2 (Salvo Playthrough) · Veri(dis)similitude (Salvo MA)

---

## 5. Traps — read before touching anything

### 5.1 A clean compiler run proves nothing

`scripts/compile-corpus-index.py` (1,412 lines, **zero arguments**) discards content silently at **17 in-branch sites** — 22 counting structural omissions. v1 said seven; Phase 1A's scope and Gate C1 were sized against the wrong number. **Audited:** `:260, :346, :430, :546, :559, :596, :650, :690, :727, :827, :837, :1110, :1120, :1128, :1267, :1290, :1300`.

Worse than "it does not warn": **it emits zero `warn()` calls on the current corpus** while discarding 55 tension records, despite the docstring at `:14-15` promising warnings to stderr. And it has **no exit-code discipline at all** — no `sys.exit`, no error counter, no `--strict`; `main()` at `:1361` always returns 0. **Spot-checked (`builtAt`, line counts); audited (warn count, site enumeration).**

Specifics worth knowing before you touch Phase 1:

- 8 of 27 entries absent from `TEXT_DIRS` → invisible, no warning (collection iterates the registry, not the filesystem)
- 4 of 11 `tension-edges.json` files yield **zero** edges silently, dropping 55 of 119 records (`:1128-1129`). Cause: none carries the `node_a`/`node_b` pair the guard requires. Their schemas are `pole_A`/`pole_B`; `wendt_position`/`against`; and two label/description-only forms
- **`parse_ontology_md` does not exist.** v1 named a function that isn't there. The real entry points are `parse_table_ontology` (`:195`), `parse_header_ontology` (`:513`), `_parse_field_value_ontology` (`:292`). The substance — returns `[]` rather than erroring — holds for all three
- No `--check`, no non-zero exit, no self-check against manifest counts

**Never verify a repair by "the compiler ran clean."** Phase 1 exists to fix this and must land before Phase 4.

### 5.1a The parse pollution has a root cause, and it is a general bug

v1's C1.8 said "strip parse pollution," treating a symptom. The cause is an **unreachable `break` at `:718-721`**: `elif current_key and stripped:` (`:718`) precedes `elif stripped.startswith("###") or …: break` (`:720-721`), so once any field key has been seen the break can never fire. **The last field of the last node in *any* header section absorbs the rest of the file.** Today one `centralityTier` holds 10,009 chars of a dumped edge table and its `units` array holds 973 garbage tokens. Reordering two `elif` arms is the fix. **Audited.**

### 5.2 The output is not byte-reproducible — and the sort fix alone will not fix it

`canonicalTerms` sorts on `(-len, lower())`; 101 case-duplicate pairs tie and flip per run under Python's randomized set iteration. Every recompile dirties a git-tracked file with meaningless reordering.

**But `:1375` writes `"builtAt": datetime.now(timezone.utc).isoformat()` unconditionally.** Gate C1's "two consecutive runs byte-identical" is unachievable regardless of what you do to the sort, because C1.7 was scoped to `canonicalTerms` only. Enforce that gate literally and Phase 1 never exits. **Spot-checked.**

A third source: `deduplicate_ontology_nodes` (`:1319-1321`) keys on `node["name"].lower()` with **no text component**, so nodes from different works merge — `Destruktion` becomes `"Heidegger - Being and Time; Heidegger and Rhetoric"` via the provenance concatenation at `:1331-1332`. 771 raw → 701, i.e. 70 nodes absorbed with no per-merge log. **Audited.**

### 5.3 The compiler reads no JSON ontologies

`ontology.json` appears **nowhere** in its 1,412 lines. It dispatches on `ontology_format` with two handlers (`header` ×17, `table` ×2). A third (`json`) is an established pattern, ~1 day, +102 concepts.

> **Corrected from v1.** There are **five** `cluster-ontology.json` files in four-to-five shapes, not three. Boredom Secondary ships a compiler-native one (`nodeCount: 68`, `generatedBy: parse_header_ontology`) and VR Pedagogy a minimal `{cluster, nodes[60]}`. **Both entries already register via markdown — wiring their JSON naively double-counts 128 nodes.** Phase 1B needs a precedence rule, not just adapters. **Audited.**

### 5.4 Renaming an entry directory silently drops it — but not the way v1 said

`TEXT_DIRS` is keyed by directory name, so a rename drops the entry. Five entry paths are also hardcoded in `scripts/normalize-edges.py:37-41`.

> **Corrected from v1.** v1 claimed `deriveAuthor` parses the entry display label and that renaming breaks author-scoped retrieval. **Entry directory names never reach `deriveAuthor`** — it receives hook `sourceText`/`targetText`, which come from `ARISTOTLE_WORK_MAP` (`:136-147`) and `_infer_target_text()` (`:1050-1070`) (`cross-author-utils.ts:395-398`).
>
> The real coupling is narrower and sharper: `compile-corpus-index.py:1239` `aristotle_dir = CORPUS_INDEX / "Aristotle - Complete Works"`. **Rename that one directory and all 72 hooks vanish.** **Audited.**

### 5.5 `doc_id` is path-derived

`doc_id = sha256(f'{path_rel}:{sha256_file}')[:16]`, chunk ids `{doc_id}:{idx:05d}` (`run_ingest_phase2.py:221-223` *(v1 said :220-222; :220 is blank)*, `:659`, `:699`). **Relocating any document mints a new namespace with no dedup against old chunks.**

**But R2.5 "purge before move" has no implementation.** The only delete in the ingest tree is `run_ingest_phase2.py:1830 coll.delete(ids=_stale)`, fed by `coll.get(where={"path_rel": path_rel})` at `:1686` — which returns **zero rows once the path changes**. `ls scripts/ingest/` contains no purge script. No phase backs up the 6.5 GB `vector_db_1536/` before a first-run destructive operation. **Audited.**

### 5.6 The index is being ingested right now — this is the urgent item

772 of 1,182 manifest records are under `index/`; no walker excludes it. `SKIP_DIRS` is verbatim `{".extracted_media", "__pycache__", "node_modules", ".git", ".ingest_cache"}` at all three sites: `run_ingest_phase2.py:978`, `run_ingest.py:365`, `parallel_ingest.py:69`. **Spot-checked.**

`should_skip_phase2` (`:312-331`) requires `int(rec.get("phase") or 0) >= 2`. Of 522 distinct latest `index/` manifest records, **518 carry a falsy `phase`** — so the next routine ingest re-embeds them, roughly 2,100 chunks of the index's own analytical prose competing with source material in every retrieval. **Audited.**

Also note: manifest and vector store **have already diverged**. The manifest marks 522 index documents `ok` with 2,134 chunks, but zero of their `doc_id`s exist in `vector_db_1536`; the only index chunks present are 25 from 6 PDFs under `Game-Behavior Analysis Method`. "Manifest clean" and "store clean" are independent facts. **Audited.**

**This is v1's Phase 2 item R2.6 — a three-line change — sitting behind the highest-blast-radius phase in the programme. It is now Phase 0 Item 0.**

### 5.7 Stale facts in memory files — correct these

| Recorded | Actual |
|---|---|
| "ChromaDB collections metaphysics/new_media/rhetorical_ontology" | Five Chroma collections exist (`local_vectors_1536`, `god_agent_vectors_1536`, `knowledge_chunks`, `v2_knowledge_chunks`, `dissertation-perplexity-cache`). Only `knowledge_chunks` is ever queried — and **no production code emits a `where` on the `collection` field**; every live filter is `author_raw` or `title_raw`. *(v1 said "one collection, filtered by where" — half right.)* **Audited** |
| "QuotationFidelityValidator (70%+)" | Threshold is **0.90** (`quotation-fidelity-stage.ts:60-61`) |
| "QualityGauntlet (7 stages)" | **10 default stages** (`quality-gauntlet.ts:574-589`); comments still say 7 |
| "Secondary clusters NOT registered, by design" | **Reversed in practice** — Boredom Secondary and VR Pedagogy are the two largest contributors |
| "corpus/index FIRST, ChromaDB fallback" | **A human workflow rule only.** Zero code implements it; live order is inverted |

### 5.8 Service state — all local services are down

`:8000` (embedder), `:8001` (Chroma), `:8002` (vLLM) return HTTP `000`; `.run/*.pid` (5972 / 6008 / 6555) are stale with no `/proc` entries. **Spot-checked 2026-07-29.** `wraith-infer` on WRAITH `:8100` (GPU 1) was live at audit time serving gte-Qwen2-1.5B + `bge-reranker-v2-m3`.

**No phase lists `/god-launch` as a prerequisite, yet Gate R1 requires a full re-ingest.** Start services before any phase that touches retrieval or ingestion.

### 5.9 Retrieval changes here are not reliably improvements

Recorded eval: raw 1536 gte-Qwen2 was a **regression** vs 768 fastembed (MRR 0.285 vs 0.493); the cross-encoder reranker was the win (768+rerank MRR 0.547). **A/B any retrieval change before default-on**, especially index-first ordering in Phase 5C.

### 5.10 Runtime caches fail the moment Phase 1 starts recompiling

`_hooksDerivationDone` (`cross-author-utils.ts:56`, guard `:342`, set `:351`) is a one-shot global with **no reset anywhere** — grep across `src/` and `tests/` returns only those three lines. `jsonl-loaders.ts:205-213` invalidates on mtime and returns a *fresh* graph; 0 of 72 hooks carry a `sourceAuthor` key, so derivation at `:344-349` is the only source. Recompile mid-process → empty `requiredAuthors` → `icp-orchestrator.ts:368` `continue` → **cross-author backfill silently disabled, no log line.** A second uninvalidated cache compounds it: `smart-retrieval-layer.ts:794`.

v1 scheduled this fix in Phase 5 (W5.7). **The exposure starts in Phase 1.** See §8. **Audited.**

### 5.11 CI will fire on these paths and nobody mentioned it

`.github/workflows/god-audit.yml:5-21` triggers on `corpus/**`, `scripts/ingest/**`, `vector_db_1536/**` and runs `missing_link_detector.py` — one of the four path-join sites R2.3 must change. `.github/workflows/god-learn-qa.yml:41-53` runs `immutability_checker.py --verify`, whose protected list includes `scripts/ingest/manifest.jsonl` and `god-reason/reasoning.jsonl` — the two files R2.4 and Phase 3 mutate. Zero occurrences of "github", "workflow" or "CI" in any programme document before this revision. **Audited.**

### 5.12 Gate R1's own check mutates the artifact it checks

`god_learn.py:711-718 cmd_verify` calls `deduplicate_manifest()` **first**, rewriting `manifest.jsonl` in place (1,182 → ~696 records) and destroying the 248 `status=failed` index rows. It keys on `path_abs`, so post-move old and new paths survive as two keys. **Audited.**

---

## 6. Execution order

> **Two changes from v1, both PENDING RATIFICATION** — reasoning in §8. A clean session should execute Phase 0 as written (it is corrected fact, not recommendation) and **ask before acting on the reordering.**

### Phase 0 — finish preservation *(next action)*

```bash
cd /home/dalton/projects/claudeflow-testing
```

#### Item 0 — stop the ingestion *(NEW; do this first)*

Pulled forward from Phase 2 R2.6 because it is the only leak that worsens while everything else is deliberated. Three dict literals, ~2 minutes, fully reversible, nothing written, moved or deleted:

- `scripts/ingest/run_ingest_phase2.py:978` — add `"index"` to `SKIP_DIRS`
- `scripts/ingest/run_ingest.py:365` — same
- `scripts/ingest/parallel_ingest.py:69` — same

While there, fix the walkers' default roots (v1's R2.7): `audit_ingest.py:97` and `verify_ingest.py:166` hardcode the absolute `/home/dalton/projects/claudeflow-testing/corpus`; `watch_corpus.py:175` defaults to a bare relative `corpus`.

#### Item 1 — apply tracking policy (D2)

> **v1's rule text does not work.** `.gitignore:7` is `backups/` — **no dot** — and does not match `.backups/`. `git check-ignore -v --no-index '.backups/x'` exits 1. Eight untracked `.backups/` trees exist repo-wide totalling 82 MB, one of them inside `corpus/index` itself. **Spot-checked.**

Replace v1's two corpus-scoped rules with **one global rule** in `.gitignore`:

```
.backups/
```

This covers root, `plans/`, `scripts/`, `tmp/Dissertation/` and all four nested per-entry stores, making `corpus/index/**/.backups/` redundant. Verified against a scratch `core.excludesFile` with the repo untouched: all four nested `.backups` paths ignored, real entry files not ignored, untracked count 1,512 → 1,434.

Stage with an **explicit pathspec, never `git add -A`**:

```bash
git add --dry-run corpus/index    # 1512 before the rule, 1434 after
git add corpus/index
git add scripts/compile-corpus-index.py   # REQUIRED — see §2
```

Verify — **v1's metric was useless**, `git status --short corpus/index | wc -l` returns 27 because git collapses untracked directories:

```bash
git status --short --untracked-files=all corpus/index | wc -l   # 1512 → 1
git ls-files corpus/index | wc -l                               # 335 → 1768
```

Hazards. `git add -A` at repo root stages 11,524 paths including the 82 MB `.backups/` and the 551 MB `tmp/analysis-upgrade/production-sandbox/` — **`tmp/` appears nowhere in `.gitignore`**. `node_modules` is **tracked** (12,695 files, 376 currently modified), so `git commit -a` sweeps a zod version bump into the commit; ~93% of the modified-file noise is node_modules. `.gitignore` already carries an uncommitted line 38 that will ride along.

**Open question — see §10 Q4:** whether `compiled-index.json` goes into this commit.

#### Item 2 — pushes

> **v1's premise was wrong.** Origin has **five** heads (`audit-fixes`, `god-agent-v2`, `god-agent-v2-pr`, `main`, `writing-pipeline-v2`) and **zero** tags against 83 local. **Spot-checked.**

Relevant state: `writing-pipeline-v3` = `1268adbcf`, no upstream, 3 unique commits, **11 commits behind** origin/writing-pipeline-v2. The tag `pre-promotion-20260419` targets `54c2ba1fe`, **already reachable from origin/writing-pipeline-v2** — that push carries no new history. Meanwhile **`feat/wraith-retrieval`, the branch this programme executes on, has 11 local-only commits and no upstream.** Repo-wide, 32 commits exist nowhere but this disk. A second remote `upstream` (`ste-bah/claudeflow-testing`) is unmentioned in any document. `.git/FETCH_HEAD` is 13 days stale.

Candidates in value order — **ask before each**:

```bash
git push -u origin feat/wraith-retrieval     # 11 commits that actually matter  ← recommended first
git push origin writing-pipeline-v3          # 3 commits, stale side branch
git push origin pre-promotion-20260419       # tag object only, no new history
```

`writing-pipeline-v3` is checked out as a worktree at `tmp/analysis-upgrade/production-sandbox/src-worktree` with 12 uncommitted changes — pushing sends the committed tip, not what that directory holds.

#### Item 3 — back up `production-sandbox/data/` off-machine

`tmp/analysis-upgrade/production-sandbox/data/` = 50 MB, 105 files + 2 symlinks, untracked and not gitignored. `data/corpus` = 49 MB, 4,939 claims across 24 `claims.jsonl` files — **no backup anywhere on this machine**; the 79 snapshots under `production-sandbox/.backups/` cover `data/gold` only and sit on the same volume.

`/mnt/nas` and `/mnt/j` **exist as directories but are not mounted** — both resolve to the root volume. Real mounts: `/mnt/f` (8.6T), `/mnt/m` (9.1T), `/mnt/h`, `/mnt/i`, `/mnt/c`, `/mnt/d`. Headroom 233 G of 1007 G.

Back up the **whole** tree — it gzips to 7.9 MB:

```bash
cd tmp/analysis-upgrade/production-sandbox
tar -czf /tmp/sandbox-data-$(date -u +%Y%m%dT%H%M%SZ).tar.gz data    # no -h
cd /tmp && sha256sum sandbox-data-*.tar.gz > sandbox-data-*.tar.gz.sha256   # RELATIVE path
# scp both to CHIMERA (dalton@192.168.50.243) or Mac (daltonsalvo@192.168.50.10)
ssh <host> 'sha256sum -c sandbox-data-*.tar.gz.sha256'               # verify AT DESTINATION
```

Do **not** size-optimise: `data/corpus` holds two relative symlinks (`compiled-index.json -> compiled-index.v2.json`, `ontology-embeddings.jsonl -> ontology-embeddings.v1.jsonl`); excluding the large derived artifacts drops the archive to 1.8 MB and leaves both dangling. Do **not** use `tar -h` — it doubles the archive. Verifying at the source proves nothing.

**Gate P0:** Item 0 applied · tracking applied with the working rule · agreed pushes resolve on origin · sandbox data byte-verified **in a second location**. If only `/mnt/m` is available, record a **partial** pass, not a pass.

> **Ask before each push.** Standing rule: commits and pushes from WSL only, never from the Mac.

---

### Phase 1 — compiler hardening + registry triage (4–6 d)

> Effort raised from v1's 3–4 d: 17 skip sites not 7, plus three items v1 mis-scoped.

**1A: make it fail loudly.** `--check` + non-zero exit · warn on unregistered entries · warn on registered-but-zero-node · warn on zero-yield tension files (write parsers for the four divergent schemas: `pole_A`/`pole_B`, `wendt_position`/`against`, two label/description-only forms) · error on unparseable ontology · deterministic output.

Three v1 items need rescoping:

- **C1.7 determinism** must also freeze or omit `builtAt` (`:1375`), or Gate C1 can never pass (§5.2)
- **C1.8 "strip parse pollution"** should instead **fix the unreachable `break` at `:718-721`** (§5.1a) — cause, not symptom
- **C1.6 "self-check vs manifest counts"** has almost no data to check against: of 27 entries only 5 declare any count field, only 3 declare `total_units`, **zero** declare an expected node count. The one `nodeCount` on disk was generated by the compiler's own parser — checking it against that is a tautology. Either author expected counts as part of 1C, or drop C1.6

**1B: read the JSON ontologies.** Add `ontology_format: "json"` + adapters → **+102 concepts** from Phantasia (41), Emotion (40), RDR2 Secondary (21). **Needs a precedence rule first** — five `cluster-ontology.json` files exist and two belong to entries that already register via markdown; naive wiring double-counts 128 nodes (§5.3).

**1C: entry registry** with stable IDs and an **entry class** field (`source-entry` / `analysis-artifact` / `incomplete` / `excluded`). Classify the four D4/D6 artifacts. Replace registry-keyed-by-directory-name.

**1D *(moved from W5.7, PENDING RATIFICATION)*: fix the runtime caches** — `_hooksDerivationDone`, the `smart-retrieval-layer.ts:794` protected-terms cache. Reasoning in §8.

**Gate C1 (revised):** two consecutive runs byte-identical **after excluding `builtAt`** · `--check` fails on a corrupted fixture · warnings fire for every unregistered entry and all 4 zero-yield tension files · the 3 thin JSON clusters register with non-zero nodes and the 2 markdown-registered ones do not double-count.

---

### Phase 1.5 — thin wiring spike *(NEW, PENDING RATIFICATION — 3–5 d)*

An additive, **default-off** entry-scope read path over the 77 unit JSONs already structured on disk across six entries: Uexküll 14, Being and Time 17, BCAP 13, FCM 15, Rickert 10, Wendt 8. Needs no relocation, no normalization, no repair.

It answers the question the whole programme bets on — **does unit-level content in the drafting prompt change output quality?** — in days rather than after 26–38 days of prerequisites, and produces the volume evidence W5.4's still-open storage-shape decision needs. Reasoning in §8.

---

### Phase 2 — relocate the index out of `corpus/` (3–4 d) — **PENDING RATIFICATION: move to after Phase 5**

Full item list in the plan (R2.1–R2.10). Four traps: string-free path-join sites (`endnote-generator.ts:31`, `missing_link_detector.py:439`, `coverage_analyzer.py:470`, `orphan_identifier.py:335`), 772 manifest `path_rel` rewrites, purge-before-move for `doc_id`, and `god_learn.py:755` which defaults `--root` to `<repo>/corpus` and is the primary user-facing driver.

**Two defects to fix before this phase can run at all:**

- **R2.5's purge does not exist** (§5.5). Write it, and back up the 6.5 GB `vector_db_1536/` first
- **Gate R1 contradicts itself.** R2.4 rewrites 772 manifest `path_rel` values *to* the new path; Gate R1 requires zero records *under* the new path. Separately, 296 files inside `corpus/index` contain the literal string `corpus/index` in their own prose (1,800 line-hits), 219 already ingested `ok` — any re-ingestion reproduces them all. See §10 Q2

R2.6 and R2.7 have been **pulled forward into Phase 0 Item 0**.

Irreducible residue: `corpus/index` string hits in `vector_db_1536/chroma.sqlite3` — 458 `strings` *lines* / 497 raw byte occurrences / 319 live-table occurrences; **39 metadata rows are embedded prompt/memory text not fixable by re-ingestion.** *(v1 conflated these units.)* The 39 live in `god_agent_vectors_1536`, **not** `knowledge_chunks`, so rebuilding the corpus collection never clears them.

**Gate R1 (needs rewriting per Q2):** ingest dry-run · fresh Chroma build has zero hits outside the 39 · `/god-learn-verify` passes — **but note that check mutates the manifest** (§5.12).

---

### Phase 3 — normalization layer (5–8 d)

One canonical unit record, one canonical edge record, one adapter per schema family (8 named in `plans/archon-corpus-index-migration-spec.md:45-58`), a validator, a schema file, an ID-prefix registry. Today: 42 edge-CSV header dialects, 633 relation values, 31 unenforced ID prefixes, no validator anywhere.

**Three apparatus classes have no adapter and no mention in v1:**

- **67 `.mmd` files across 15 entries encode 1,544 arrow-edges.** The migration spec records for two families that "Edges live only in .mmd (open item)"
- **144 `cross_pipeline_bridges` entries live in 22 unit JSONs.** Runtime has 72 hooks, 100% Aristotle, because the compiler globs `*-cross-pipeline-hooks.md` under the Aristotle dir only (`:1239-1244`)
- **35 `*-deep.json` files** carry positions, tensions, interlocutors and ratio-catalogs that N3.1's canonical record has no slot for

**Gate N1:** all 27 entries load into the canonical type · validator passes · all 494 JSON files parse — **note this requires 4A (below) to land first**, since the single failing file is repaired in Phase 4.

---

### Phase 4 — entry repair (6–10 d)

**4A *(PENDING RATIFICATION: promote ahead of Phase 3)*:**

- `ig-10-incorporation.json` — **a one-character fix.** `:134` opens `"non_game_studies_anchor_theories": {`; `:155` closes with `],`. Bracket-*type* mismatch at `:155` only. `expected_game_loci` (`:107-119`) is well-formed and **not** implicated, contrary to v1. Validate against `ig-09-ludic.json`'s 27-key shape. **Spot-checked**
- VLE broken path (`vle-05-…md:3` → lowercase dir that doesn't exist)
- The 4 zero-yield tension files (schemas listed in §5.1)

**4B:** the 5 ontology-only entries → structured unit records, edges, full profile (D3). Includes verifying the Part III presence units' **OCR-only unverified quotations** — they are cited in Part III. *(Sequencing question — see §8.)*

**4C:** missing apparatus — *A Rhetoric of Motives* (concept-matrix, manifest), Phantasia (manifest), Motion & Time (full creation).

**4D:** quality floor — verbatim-quote detector (the G1 copyright gate, currently self-attestation only) · backfill `quality-gates-report.md` (2 of 27 have one) · re-derive provenance for the 9 entries with no machine-readable source path.

> **v1's Q4.6 was wrong.** `mmdc` **11.14.0 is already installed** (`~/.nvm/versions/node/v22.22.0/bin/mmdc`) and render validation **has run twice** — see `Aristotelian Phantasia Secondary/_synthesis/render-validation.txt` and `Uncomfortable Situations/_synthesis/render-validation.txt`. The real gap: 13 of 15 `.mmd`-bearing entries lack a record. This is a backfill, not an install. **Audited.**

**Gate Q1:** every entry passes its class's gates or is explicitly classified · zero unparseable files · zero silent-drop warnings.

---

### Phase 5 — wiring (8–12 d)

The core deliverable. Emit unit records, edges, and the apparatus into runtime. **Decide storage shape first** (W5.4) — the artifact is already 664 KB from ontology nodes alone; SQLite is the likely answer. Phase 1.5, if ratified, supplies the volume evidence for that call.

Then: entry registry with stable IDs · `scope: {entry: 'von-uexkull-foray'}` primitive · implement index-first ordering and **A/B it before default-on**.

**W5.7 needs rescoping.** Three sub-items, and v1 got two of them wrong:

- `RetrievalOptions.collections` — accepted everywhere, read nowhere. It **strands 167 real chunks**: `retrieval-stage.ts:189-197` pushes `'textual_analysis'` and `'v2_knowledge_chunks'` into a field `smart-retrieval-layer.ts` normalizes at `:194` and never reads; `v2_knowledge_chunks` holds 167 chunks unreachable at runtime. Worse, the field means Chroma *collections* at some call sites and metadata *values* at others (`corpus-constraint-builder.ts:251-252`) — **wiring it naively makes one field mean two things**
- `FacetedRetrieval` arity bug — **fixing the arity does not buy reranking.** `hybridSearch` (`faceted-retrieval.ts:324-376`) has no rerank path at all and hardcodes `semanticSearch(query, {maxChunks:20, minRelevance:0.6})` at `:353-356`. Also `npx tsc --noEmit` reports **157 errors**, so `npm run build` cannot succeed and the bug can never surface in CI — everything runs through `tsx` (transpile-only), which is why 4-arg calls to a 3-param method execute silently
- `_hooksDerivationDone` — **PENDING RATIFICATION: move to Phase 1D** (§5.10, §8)

**Gate W1:** an entry-scoped Uexküll query returns his **14** units *(v1 said 15; the entry's own manifest says 14)*, concepts, arguments, and edges without a vector search · the drafting prompt carries unit-level content, not 35 concept names · index-first A/B'd with a recorded decision.

---

### Phase 6 — single-source entries at scale

288 PDFs → ~265 unique after dedup (23 duplicate groups, 20 cross-domain). 27 entries today. **114 cluster units promote to standalone entries; ~140 net new to author.**

This is an **automation build**, not an authoring campaign. Do not start authoring at scale before the article-profile pipeline works. Two profiles: monograph (one unit per chapter, full gates) and article (concepts, arguments, claims, edges, loci, provenance — relational apparatus lives at group level).

> **Data at risk, unaddressed by any phase:** `corpus/` itself — 2.7 GB, 288 source PDFs — has **no backup and no tracking.** `git ls-files corpus | grep -v '^corpus/index/'` → 0; 3,079 untracked non-index paths, none gitignored. That is the entire input to this phase. **Audited.**

### Phase 7 — cross-cutting groups

With every source a standalone entry, groups become selections over entries. Embed-recall → `bge-reranker-v2-m3` precision; **not pure cosine**. Validate on "secondary literature on Aristotle's phantasia" — baseline today is 10 nodes, all primary Aristotle/Heidegger, **zero** from the 8-unit phantasia cluster.

### Phase 8 — analysis-upgrade sandbox

Last, per directive. State: Phases 0–3b complete (4,961 claims, 23 papers, ~$25), Phase 4 gold set **25 of 50** dev items, Phase 5 E-ladder **never run** (both runners are `exit 1` stubs), no promotion.

The gold set resolves 100% against the sandbox's 278-node ontology and **25–36% against live**. Deferring is a benefit: rebase once, onto a settled ontology, rather than twice.

---

## 7. Reproducing the backup

```bash
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
SRC=/home/dalton/projects/claudeflow-testing/corpus/index
DEST=/home/dalton/projects/claudeflow-testing/.backups/corpus-index-full-$STAMP
mkdir -p "$DEST" && rsync -a --numeric-ids "$SRC/" "$DEST/tree/"
( cd "$SRC" && find . -type f -print0 | sort -z | xargs -0 sha256sum ) > "$DEST/MANIFEST-source.sha256"
( cd "$DEST/tree" && find . -type f -print0 | sort -z | xargs -0 sha256sum ) > "$DEST/MANIFEST-copy.sha256"
diff -q "$DEST/MANIFEST-source.sha256" "$DEST/MANIFEST-copy.sha256" && echo "VERIFIED"
( cd /home/dalton/projects/claudeflow-testing/corpus && tar -czf "$DEST.tar.gz" index )
cd "$(dirname "$DEST")" && sha256sum "$(basename "$DEST").tar.gz" > "$(basename "$DEST").tar.gz.sha256"
```

*(Last two lines changed from v1 to write a **relative** path into the `.sha256`, so it verifies anywhere.)*

Note: 89 files / 6.4 MB live in four **nested** per-entry `.backups/` dirs (Boredom Secondary, VR Pedagogy, Social Presence, Veri(dis)similitude). D2's rule untracks them while the 13 MB tar still carries them. Eight empty directories exist under `corpus/index`, which git cannot represent — D2 does not preserve the tree shape D1 captured.

---

## 8. Recommendations and reasoning — **PENDING RATIFICATION**

Recorded 2026-07-29. None of this has been approved. A clean session should surface these to the user before acting.

### R-1. Keep P1 before P2, but move P2 to after P5

**Reasoning.** P2's stated justification — "sequenced before normalization and wiring so those target final paths" — does not survive inspection.

P5's coupling to the location is **one constant plus one line**: `compile-corpus-index.py:31` `CORPUS_INDEX = REPO / "corpus" / "index"` (+ `:32` output) and `jsonl-loaders.ts:200` `resolve(root, 'corpus', 'index', 'compiled-index.json')`. P4 is content editing addressed relative to entry directories — the tree's parent is irrelevant. P3's only path coupling is N3.5, which extends `normalize-edges.py` past the five hardcoded literals at `:37-41` — **the same five lines R2.9 hand-edits**, so running P2 first means editing five strings that N3.5 then deletes.

Against that thin benefit, P2 at position 2 costs:

- **It invalidates the programme's own evidence base mid-flight.** R2.10 sweeps 297 index files + 47 live plans + 389 tmp files, including `plans/index-system-report-2026-07-28.md` (11 hits) — the document this handoff names as the evidence base P3 and P4 execute against
- **It buries P4's content diffs.** The sweep rewrites 297 files inside `corpus/index` at exactly the point P4 starts editing entry content; nothing distinguishes mechanical path churn from real repair
- **Its gate is self-contradictory and its purge does not exist** (§5.5, §5.12, Q2)
- **It requires a full re-ingest to prove Gate R1** while all three local services are down (§5.8)

**The one durable argument *for* the move is never given as P2's reason:** Phase 6 §6C makes entries mirror `corpus/` one-to-one, at which point an index living inside `corpus/` would need entries for itself. If that is the reason, adopt it explicitly and schedule the move after P5 as a single mechanical commit on a settled tree. If the reason is path hygiene, the move is not worth its cost.

### R-2. Promote 4A ahead of Phase 3

Gate N1 requires "all 494 JSON files parse," but the single failing file is repaired in Phase 4. 4A is small — ig-10 is one character, plus one path string, plus four tension parsers. Landing it before P3 makes N1 achievable.

### R-3. Move the runtime-cache fixes from W5.7 into Phase 1D

`_hooksDerivationDone` starts failing on the **first recompile** (§5.10). Leaving the fix at P5 means four phases of drafting sessions silently losing the cross-author backfill path — with no log line — precisely while the index is supposedly being improved.

### R-4. Add Phase 1.5, the thin wiring spike

The programme's stated priority #1 is "wire the index completely," and wiring is P5 — behind 26–38 days of prerequisites. Nothing about proving the concept requires the relocation, the normalization layer, or the repairs: six entries already carry 77 structured unit JSONs on disk. An additive, default-off entry-scope read over those answers the core bet in days and de-risks everything downstream. It also produces the volume evidence W5.4 needs, while that decision is still cheap to change.

### R-5. Re-examine D3's sequencing (not D3 itself)

D3 stands: the five ontology-only entries get the full treatment. But that is single-source entry authoring, **by hand, at N=19**, and three of the five clusters (N = 2, 3, 4) cannot bind the cross-unit gates. The implementation plan's own risk register says of Phase 6: *"do not start authoring at scale before E6.2 works."* Phase 4B is that campaign, before the automation exists. Its **sequencing** likely belongs after the article-profile pipeline.

---

## 9. Standing constraints

- **Verification-gated.** Show evidence and wait for sign-off before committing.
- **Backup before changes**, timestamped under `.backups/`.
- **Commits and pushes from WSL only**, never the Mac. Ask before each push.
- **Do not edit** the user's global `~/.claude/settings.json`.
- **Present proposed edits as flowing prose**, not code blocks, when discussing content.
- **Discuss conceptual forks in prose** — do not poll with option menus.
- **Plans go in `plans/`** and get multi-round review.
- Bash heredocs are blocked by a hook — use the Write tool for file creation.
- **Ultracode is off by default.** It was enabled for the 2026-07-29 verification session only. Do not use Workflow orchestration unless the user re-enables it.

---

## 10. Open questions — needed before Phases 2, 3 and 5 are specifiable

1. **Does the index move at all, and to where?** No destination path appears in any document. If the answer is "yes, because Phase 6 makes entries mirror `corpus/` one-to-one," say so — that is the only justification that holds (§8 R-1).
2. **Are the 772 index manifest records deleted or rewritten?** R2.4 says rewrite, R2.6 says exclude, Gate R1 says zero records under the new path. Three incompatible end-states. The rewrite covers only 522 distinct paths (126 appear up to 3×) and 248 of the 772 are `status=failed`.
3. **Which edge layer is authoritative — per-source `*-edges.csv` or `_synthesis/global-edges.csv`?** Same data serialized twice (Wendt: 307/305 both sides, 100% intersection), and four entries **disagree** between layers (FCM 428 vs 452, Aristotle 246 vs 156, Grammar 878 vs 876, Phantasia 708 vs 706). Nothing records which is stale. This decides both Gate W1's edge count and W5.4's storage sizing.
4. **What goes into the Phase 0 commit, and what happens to `compiled-index.json`?** Committing it locks in a +583/−55 diff nobody can classify as real change versus known `canonicalTerms` churn; excluding it means Phase 1 must land the deterministic sort before the artifact is baselined. `compile-corpus-index.py` must be committed either way (§2).
5. **Which pushes are authorised, and what counts as "off-machine"?** Three candidate pushes (§6 Item 2) and three candidate destinations — CHIMERA `192.168.50.243`, Mac `192.168.50.10`, WRAITH — versus the same-machine fallback `/mnt/m`.

---

## 11. Quick verification recipes

```bash
# entry count (27 dirs + compiled-index.json)
find corpus/index -maxdepth 1 -mindepth 1 -type d -not -name '.backups' | wc -l

# registered entries (19 in worktree, 16 at HEAD — see §2)
python3 -c "import re;s=open('scripts/compile-corpus-index.py').read();b=s[s.index('TEXT_DIRS: dict[str, dict] = {'):s.index('\n}\n',s.index('TEXT_DIRS'))];print(len(re.findall(r'^    \"([^\"]+)\":',b,re.M)))"

# nodes per label — NOTE this counts ATTRIBUTIONS (771), not node objects (701)
python3 -c "
import json;from collections import Counter
d=json.load(open('corpus/index/compiled-index.json'));c=Counter()
for n in d['ontologyNodes']:
    for p in str(n.get('text','?')).split(';'): c[p.strip()]+=1
[print(f'{v:5d}  {k}') for k,v in c.most_common()]"

# every JSON under the index parses (expect exactly 1 failure pre-4A)
python3 -c "
import json,pathlib
bad=[]
for p in pathlib.Path('corpus/index').rglob('*.json'):
    if '.backups' in p.parts: continue
    try: json.loads(p.read_text())
    except Exception as e: bad.append((str(p.relative_to('corpus/index')),str(e)[:50]))
print(len(bad),'unparseable')
for b in bad: print('  ',b[0],'|',b[1])"

# is the index still being ingested? (expect NO 'index' pre-Item-0)
grep -rn 'SKIP_DIRS = ' scripts/ingest/*.py

# untracked index files — use -uall; the short form returns 27 (collapsed dirs)
git status --short --untracked-files=all corpus/index | wc -l

# is .backups actually ignored? (exit 1 = NOT ignored)
git check-ignore -v --no-index '.backups/x'; echo "exit=$?"

# service state (expect 000 x3 until /god-launch)
for p in 8000 8001 8002; do printf "%s -> " $p; curl -s -o /dev/null -w '%{http_code}\n' --max-time 2 http://localhost:$p/; done
```
