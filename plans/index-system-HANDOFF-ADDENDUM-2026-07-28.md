# Index System Handoff — Verification Addendum

**Created:** 2026-07-28
**Amends:** `plans/index-system-HANDOFF-2026-07-28.md`
**Basis:** 8-agent read-only verification pass (5 audits, 2 adversarial critiques, 1 synthesis; 988k tokens, 378 tool calls), plus direct spot-checks of every decision-critical claim.
**Status:** Nothing modified. No code written, no pushes made. `corpus/index` has not drifted a single byte since the D1 backup.

Read this alongside the handoff. Where the two disagree, this file wins — every claim here was re-derived this session.

---

## 1. Verdict

The handoff's diagnosis is sound and its structure is executable. Its **numbers and its Phase 0 commands are not.** Three things must change before any Phase 0 step runs:

1. **`.gitignore:7` is `backups/`, not `.backups/`.** D2's tracking policy therefore does not do what it says. Running Phase 0 item 1 as written leaves an 82 MB backup store stageable.
2. **The remote state in Phase 0 item 2 is wrong.** Origin has five heads and zero tags, not one head.
3. **The urgent item is buried in Phase 2.** `SKIP_DIRS` excludes no `index` in any walker; 518 of 522 latest `index/` manifest records carry a falsy `phase` and will be re-embedded into the live corpus on the next routine ingest. That is a three-line fix sitting behind the highest-blast-radius phase in the programme.

---

## 2. Corrections to the handoff

Only rows where the handoff is wrong or stale. Confirmed claims are omitted.

### 2.1 Census and counts

| Handoff claim | Actual | Evidence |
|---|---|---|
| §4 "Healthy — 11" | The table has 13 rows; 14 with Aristotle. 13+5+4+4+1 = 27 only if the header reads 13 | HANDOFF:87 vs body :91–103 |
| §1 "357 unit records" | Reconciles with nothing. §4's own units column sums to 323; corrected per-entry derivation is 310 | HANDOFF:23 vs :91–126 |
| Being and Time 18 units | 17 — the 18th `.json` is `manifest.json` | `bt-structured/manifest.json` (`total_units: 17`) |
| BCAP 14 units | 13 | `bcap-structured/manifest.json` (`total_units: 13`) |
| Uexküll 15 units | 14 | `uex-structured/manifest.json` |
| Wendt 7 units | 8 (`dfd-00`…`dfd-07`) — an *under*count, opposite direction | `Wendt - Design for Dasein/_synthesis/manifest.json` |
| Aristotle 45 units | 34 structured records; the extra 11 are 9 `*-greek.json` + greek-appendix + bekker-index | `Aristotle - Complete Works/manifest.json` |
| "17,736 edge-CSV rows" | Double-counts nearly every edge — `_synthesis/global-edges.csv` re-serializes the per-source files. ~9,762 distinct triples. Separately, 19,770 rows exist on disk; the `*-edges.csv` glob misses 2,034 (A Rhetoric of Motives ships 8 files named plain `edges.csv`; Grammar and In-Game ship `global-edges-pre-canonical.csv`) | Wendt control: `units/*-edges.csv` 307 rows / 305 distinct = `_synthesis/global-edges.csv` 307 / 305, intersection 305 |
| "Boredom Secondary (68)" | 68 is a label-*attribution* count from the §9 recipe; only 61 node objects carry it as their sole `text`. Same denominator slip as D6's "199 of 701" | `compiled-index.json` grouped by `text` |

### 2.2 Compiler

| Handoff claim | Actual | Evidence |
|---|---|---|
| "seven silent-skip sites" | **17** in-branch content-discarding sites (22 counting structural omissions). Phase 1A's scope and Gate C1 are sized against the wrong number | `compile-corpus-index.py:260, :346, :430, :546, :559, :596, :650, :690, :727, :827, :837, :1110, :1120, :1128, :1267, :1290, :1300` |
| "`parse_ontology_md` returns `[]`" | No such function exists. Real entry points are `parse_table_ontology` (:195), `parse_header_ontology` (:513), `_parse_field_value_ontology` (:292). The substance holds for all three | `grep -rn parse_ontology_md` → no match |
| C1.8 "strip parse pollution" | Treats a symptom. The cause is an **unreachable `break` at :718–721**: `elif current_key and stripped:` (:718) precedes `elif stripped.startswith("###") …: break` (:720–721), so once any field key is seen the break can never fire. The last field of the last node in *any* header section absorbs the rest of the file. Reordering two `elif` arms is the fix | verified by inspection; one `centralityTier` holds 10,009 chars, its `units` array 973 garbage tokens |
| Phase 1B "three shape adapters" | **Five** `cluster-ontology.json` files in four-to-five shapes. Boredom Secondary ships a compiler-native one (`nodeCount: 68`, `generatedBy: parse_header_ontology`) and VR Pedagogy a minimal `{cluster, nodes[60]}`. Both already register via markdown — wiring their JSON naively double-counts 128 nodes | `find corpus/index -name cluster-ontology.json` → 5 |
| Gate C1 "two consecutive runs byte-identical" | **Unachievable regardless of the sort fix.** `:1375` writes `"builtAt": datetime.now(timezone.utc).isoformat()` unconditionally; C1.7 is scoped to `canonicalTerms` only | `compile-corpus-index.py:1375` |
| C1.6 "self-check against manifest counts" | Almost no data to check against: of 27 entries only 5 declare any count field, only 3 declare `total_units`, **zero** declare an expected node count. The one `nodeCount` on disk was generated by the compiler's own parser — a tautology | per-entry manifest scan |

### 2.3 Retrieval and runtime

| Handoff claim | Actual | Evidence |
|---|---|---|
| §5.7 "One collection, `knowledge_chunks`… filtered by `where`" | Five Chroma collections exist (`local_vectors_1536`, `god_agent_vectors_1536`, `knowledge_chunks`, `v2_knowledge_chunks`, `dissertation-perplexity-cache`). Only `knowledge_chunks` is queried — but **no production code emits a `where` on the `collection` field**; every live filter is `author_raw` or `title_raw` | `chroma.sqlite3` collections table; `retrieval-stage.ts:208, :261, :286, :340`; `icp-orchestrator.ts:390` |
| §5.4 "`deriveAuthor` parses the display label → renaming breaks author-scoped retrieval" | Entry directory names never reach `deriveAuthor`; it receives hook `sourceText`/`targetText` from `ARISTOTLE_WORK_MAP` (:136–147) and `_infer_target_text()` (:1050–1070). The real coupling is `compile-corpus-index.py:1239` `aristotle_dir = CORPUS_INDEX / "Aristotle - Complete Works"` — rename that one directory and all 72 hooks vanish | `cross-author-utils.ts:395–398` |
| §5.5 doc_id at `run_ingest_phase2.py:220-222` | `:221–223` (:220 is blank). `:659` and `:699` are exact | — |
| Phase 5 "fix the `FacetedRetrieval` arity bug (TS2554) — the ICP path silently never reranks" | Fixing the arity does **not** buy reranking. `hybridSearch` (`faceted-retrieval.ts:324–376`) has no rerank path at all and hardcodes `semanticSearch(query, {maxChunks:20, minRelevance:0.6})` at :353–356. Also `npx tsc --noEmit` reports **157 errors**, so `npm run build` cannot succeed and the bug can never surface in CI — everything runs through `tsx` (transpile-only). Re-scope this item | `faceted-retrieval.ts:158, :190, :324–376` |
| §5.8 service state | Still down, confirmed this session: `curl` returns HTTP `000` on `:8000`, `:8001`, `:8002`; `.run/*.pid` (5972/6008/6555) stale with no `/proc` entries. **No phase lists `/god-launch` as a prerequisite**, yet Gate R1 requires a full re-ingest | live check |

### 2.4 Phase 0 and git

| Handoff claim | Actual | Evidence |
|---|---|---|
| §6 "`git ls-remote --heads origin` lists only `writing-pipeline-v2`" | **Five heads**: `audit-fixes`, `god-agent-v2`, `god-agent-v2-pr`, `main`, `writing-pipeline-v2`. Origin carries **zero** tags against 83 local | `git ls-remote --heads origin` (5 refs); `--tags` → empty |
| §6 verify with `git status --short corpus/index \| wc -l` | Returns **27** — git collapses untracked directories. The metric cannot distinguish success from doing nothing. Use `--untracked-files=all` (1,512 now) | live check |
| §6 "gitignore `corpus/index/**/.backups/`" | `.gitignore:7` is `backups/` (no dot) and does not match. `git check-ignore --no-index '.backups/x'` exits 1. Eight untracked `.backups/` trees exist repo-wide, 82 MB | live check |
| §2 "No source file has been modified. No code written." | True for `corpus/index` (zero byte drift). **False for the programme's own tooling**: `compile-corpus-index.py` is 1,412 lines in the worktree vs **1,397 at HEAD** (+3 uncommitted `TEXT_DIRS` entries, 19 registered vs 16 at HEAD). Also `run_ingest_phase2.py` +206/−69, `verify_ingest.py` +18/−4, `manifest.jsonl` +882, `.gitignore` +1 | `git diff --stat` |
| §5.2 residue "458 hits, of which 39 are embedded prompt text" | Different units: 458 = `strings` *lines*, 39 = metadata *rows*. Raw byte occurrences 497; live-table occurrences 319. The 39 live in `god_agent_vectors_1536`, not `knowledge_chunks`, so rebuilding the corpus collection never clears them | `strings -a … \| grep -c` 458; `grep -a -o` 497 |

### 2.5 Repairs

| Handoff claim | Actual | Evidence |
|---|---|---|
| Q4.1 ig-10 "one unclosed object, lines 107–155" | Bracket-**type** mismatch at :155 only. `:134` opens `"non_game_studies_anchor_theories": {`, `:155` closes with `],`. `expected_game_loci` (:107–119) is well-formed and not implicated. **One-character fix** (`],` → `},`) | `sed -n '134p;155p'` |
| Q4.6 "install `mmdc` (render validation has **never** run)" | mmdc **11.14.0 is installed** at `~/.nvm/versions/node/v22.22.0/bin/mmdc`, and validation has run twice. The real gap: 13 of 15 `.mmd`-bearing entries lack a record | `which mmdc`; `Aristotelian Phantasia Secondary/_synthesis/render-validation.txt`; `Uncomfortable Situations/_synthesis/render-validation.txt` |
| Gate W1 "his 15 units" | 14, per the entry's own manifest; the implementation plan says 14. A gate whose pass condition is a disputed integer gets argued, not measured | `uex-structured/manifest.json` |
| Q4.3 "the 4 zero-yield tension files" | Cause identified: none of the four carries the `node_a`/`node_b` pair the guard at `:1128–1129` requires. Their schemas are `pole_A`/`pole_B`; `wendt_position`/`against`; and two label/description-only forms. 55 of 119 records vanish | per-file inspection |

---

## 3. Findings the handoff missed

Ranked by severity. Phase attribution is where the fix belongs, not where the exposure starts.

### Blockers

**B1 — Phase 0, today. The next routine ingest floods the live corpus with ~2,100 index chunks.**
`SKIP_DIRS` contains no `index` entry in any walker — `run_ingest_phase2.py:978`, `run_ingest.py:365`, `parallel_ingest.py:69`, all verbatim `{".extracted_media", "__pycache__", "node_modules", ".git", ".ingest_cache"}`. `should_skip_phase2` (:312–331) requires `int(rec.get("phase") or 0) >= 2`; of 522 distinct latest `index/` manifest records, **518 have a falsy `phase`**. The index's own analytical prose then competes with source material in every retrieval. This is Phase 2's R2.6 — a three-line change sitting behind the highest-blast-radius phase in the programme.

**B2 — Phase 0. The handoff's evidence base rests on a dirty tree.**
Every §5 `path:line` citation and the entire §4 census resolve against the working tree, not HEAD. `compiled-index.json` is tracked and dirty (+583/−55; worktree 701 nodes / 1,722 terms, HEAD 670 / 1,663). A `git checkout` or `git stash` on `scripts/compile-corpus-index.py` or that artifact silently invalidates the handoff wholesale.

**B3 — Phase 1. The compiler emits zero `warn()` calls while discarding 55 tension records.**
Its docstring (:14–15) promises warnings to stderr; a monkey-patched run counted 0. It has **no exit-code discipline at all** — no `sys.exit`, no counter, no `--strict`; `main()` at :1361 always returns 0.

**B4 — Phase 1. Gate C1's byte-identical clause is unachievable.** See §2.2 (`builtAt`).

**B5 — Phase 1. The unreachable `break` is a general parser bug, not a Rickert one-off.** See §2.2.

**B6 — Phase 1 exposure, fix currently scheduled Phase 5. `_hooksDerivationDone` starts failing the moment Phase 1 begins recompiling.**
`cross-author-utils.ts:56` one-shot flag, guard :342, set :351 — grep across `src/` and `tests/` returns only those three lines; no reset exists. `jsonl-loaders.ts:205–213` invalidates on mtime and returns a *fresh* graph; 0 of 72 hooks carry a `sourceAuthor` key, so derivation at :344–349 is the only source. Recompile mid-process → empty `requiredAuthors` → `icp-orchestrator.ts:368` `continue` → cross-author backfill silently disabled, no log line. A second uninvalidated cache compounds it: `smart-retrieval-layer.ts:794`.

**B7 — Phase 2. R2.5 "purge before move" has no implementation, and the built-in cleanup no-ops on exactly this operation.**
The only delete in the ingest tree is `run_ingest_phase2.py:1830 coll.delete(ids=_stale)`, fed by `coll.get(where={"path_rel": path_rel})` at :1686 — which returns zero rows once the path changes. `ls scripts/ingest/` contains no purge script. No phase backs up the 6.5 GB `vector_db_1536/` before a first-run destructive operation.

**B8 — Phase 2. Gate R1's two clauses contradict each other.**
R2.4 rewrites 772 manifest `path_rel` values *to* the new path; Gate R1 requires zero records *under* the new path. Separately, 296 files inside `corpus/index` contain the literal string `corpus/index` in their own prose (1,800 line-hits), 219 already ingested `ok` — any re-ingestion reproduces them all.

### High

**H9 — Phase 2/5. Manifest and vector store have already diverged for `index/`.** The manifest marks 522 index documents `ok` with 2,134 chunks, but zero of their `doc_id`s exist in `vector_db_1536`; the only index chunks present are 25 from 6 PDFs under `Game-Behavior Analysis Method`. "Manifest clean" and "store clean" are independent facts; Gate R1 tests only the first.

**H10 — Phase 0/6. `corpus/` itself (2.7 GB, 288 source PDFs) has no backup and no tracking.** `git ls-files corpus | grep -v '^corpus/index/'` → 0; 3,079 untracked non-index paths, none gitignored. That is the entire input to Phase 6.

**H11 — Phase 5. `RetrievalOptions.collections` strands 167 real chunks.** `retrieval-stage.ts:189–197` pushes `'textual_analysis'` and `'v2_knowledge_chunks'` into a field that `smart-retrieval-layer.ts` normalizes at :194 and never reads; `v2_knowledge_chunks` holds 167 chunks unreachable at runtime. Worse, the field means Chroma *collections* at some call sites and metadata *values* at others (`corpus-constraint-builder.ts:251–252`) — wiring it naively makes one field mean two things.

### Medium

**M12 — Phase 3/5. Three apparatus classes have no adapter and no mention.** 67 `.mmd` files across 15 entries encode 1,544 arrow-edges — `plans/archon-corpus-index-migration-spec.md` §2 records for two families that "Edges live only in .mmd (open item)". 144 `cross_pipeline_bridges` entries live in 22 unit JSONs (runtime has 72 hooks, 100% Aristotle, because the compiler globs `*-cross-pipeline-hooks.md` under the Aristotle dir only, :1239–1244). And 35 `*-deep.json` files carry positions, tensions, interlocutors and ratio-catalogs that N3.1's canonical record has no slot for.

**M13 — Phase 0/2. GitHub Actions workflows nobody mentioned will fire.** `.github/workflows/god-audit.yml:5–21` triggers on `corpus/**`, `scripts/ingest/**`, `vector_db_1536/**` and runs `missing_link_detector.py` — one of the four path-join sites R2.3 must change. `.github/workflows/god-learn-qa.yml:41–53` runs `immutability_checker.py --verify`, whose protected list includes `scripts/ingest/manifest.jsonl` and `god-reason/reasoning.jsonl` — the two files R2.4 and Phase 3 mutate. Zero occurrences of "github", "workflow" or "CI" in any of the three programme documents.

**M14 — Phase 2. `/god-learn-verify` — Gate R1's own check — mutates the artifact.** `god_learn.py:711–718 cmd_verify` calls `deduplicate_manifest()` first, rewriting `manifest.jsonl` in place (1,182 → ~696 records) and destroying the 248 `status=failed` index rows. It keys on `path_abs`, so post-move old and new paths survive as two keys.

**M15 — Phase 3. `deduplicate_ontology_nodes` merges across different texts by lowercased name.** `compile-corpus-index.py:1319–1321` keys on `node["name"].lower()` with no text component; :1331–1332 concatenates provenance into one string (`Destruktion` → `"Heidegger - Being and Time; Heidegger and Rhetoric"`). 771 raw → 701, i.e. 70 nodes absorbed with no per-merge log.

**M16 — Phase 0. 89 files / 6.4 MB live in four nested per-entry `.backups/` dirs** (Boredom Secondary, VR Pedagogy, Social Presence, Veri(dis)similitude). D2's rule untracks them while the 13 MB tar still carries them. Eight empty directories exist under `corpus/index`, which git cannot represent — D2 does not preserve the tree shape D1 captured.

---

## 4. Revised Phase 0

### Item 0 — stop the ingestion (new; do first)

Pulled forward from Phase 2 R2.6. Three dict literals, ~2 minutes, fully reversible, nothing written or moved:

- `scripts/ingest/run_ingest_phase2.py:978` — add `"index"` to `SKIP_DIRS`
- `scripts/ingest/run_ingest.py:365` — same
- `scripts/ingest/parallel_ingest.py:69` — same

While there, fix the three walkers' default roots: `audit_ingest.py:97` and `verify_ingest.py:166` hardcode the absolute `/home/dalton/projects/claudeflow-testing/corpus`; `watch_corpus.py:175` defaults to a bare relative `corpus`.

### Item 1 — tracking policy (D2)

**Not safe as written.** Replace the handoff's two corpus-scoped rules with one global rule in `.gitignore`:

```
.backups/
```

This covers root, `plans/`, `scripts/`, `tmp/Dissertation/` and all four nested per-entry stores, making `corpus/index/**/.backups/` redundant. Verified with a scratch `core.excludesFile` (repo untouched): all four nested `.backups` paths ignored, real entry files not ignored, untracked count 1,512 → 1,434.

Stage with an explicit pathspec, never `git add -A`:

```bash
git add --dry-run corpus/index    # 1512 before the rule, 1434 after
git add corpus/index
```

Verify (replacing HANDOFF:196, which returns 27):

```bash
git status --short --untracked-files=all corpus/index | wc -l   # 1512 → 1
git ls-files corpus/index | wc -l                               # 335 → 1768
```

Hazards: `git add -A` at repo root stages 11,524 paths including the 82 MB `.backups/` and the 551 MB `tmp/analysis-upgrade/production-sandbox/` (`tmp/` appears nowhere in `.gitignore`). `node_modules` is **tracked** — 12,695 files, 376 currently modified — so `git commit -a` sweeps a zod version bump into the commit. `.gitignore` already carries one uncommitted line 38 that will ride along.

### Item 2 — pushes

Origin has five heads and zero tags. `writing-pipeline-v3` = `1268adbcf`, no upstream, 3 unique commits, **11 commits behind** origin/writing-pipeline-v2. The tag's target `54c2ba1fe` is already reachable from origin/writing-pipeline-v2, so pushing the tag carries no new history. Meanwhile **`feat/wraith-retrieval` — the branch this programme executes on — has 11 local-only commits and no upstream**; repo-wide, 32 commits exist nowhere but this disk. A second remote `upstream` (`ste-bah/claudeflow-testing`) exists and is unmentioned. `.git/FETCH_HEAD` is 13 days stale.

Candidates, in value order:

```bash
git push -u origin feat/wraith-retrieval     # 11 commits that actually matter
git push origin writing-pipeline-v3          # 3 commits, stale side branch
git push origin pre-promotion-20260419       # tag object only, no new history
```

Note `writing-pipeline-v3` is checked out as a worktree at `tmp/analysis-upgrade/production-sandbox/src-worktree` with 12 uncommitted changes — pushing sends the committed tip, not what that directory holds.

### Item 3 — sandbox backup

`tmp/analysis-upgrade/production-sandbox/data/` = 50 MB, 105 files + 2 symlinks, untracked and not gitignored. `data/corpus` = 49 MB, 4,939 claims across 24 `claims.jsonl` files, **no backup anywhere on this machine**; the 79 snapshots under `production-sandbox/.backups/` cover `data/gold` only and sit on the same volume. Gold set is 25 dev / 20 holdout, matching the handoff.

`/mnt/nas` and `/mnt/j` exist as directories but are **not mounted** — both resolve to the root volume. Real mounts: `/mnt/f` (8.6T), `/mnt/m` (9.1T), `/mnt/h`, `/mnt/i`, `/mnt/c`, `/mnt/d`. Headroom 233 G of 1007 G.

Back up the whole tree — it gzips to 7.9 MB:

```bash
cd tmp/analysis-upgrade/production-sandbox
tar -czf /tmp/sandbox-data-$(date -u +%Y%m%dT%H%M%SZ).tar.gz data    # no -h
cd /tmp && sha256sum sandbox-data-*.tar.gz > sandbox-data-*.tar.gz.sha256   # RELATIVE path
# scp both to CHIMERA (dalton@192.168.50.243) or Mac (daltonsalvo@192.168.50.10)
ssh <host> 'sha256sum -c sandbox-data-*.tar.gz.sha256'               # verify AT DESTINATION
```

Do not size-optimise: `data/corpus` holds two relative symlinks (`compiled-index.json -> compiled-index.v2.json`, `ontology-embeddings.jsonl -> ontology-embeddings.v1.jsonl`); excluding the large derived artifacts drops the archive to 1.8 MB and leaves both dangling. Do not use `tar -h` — it doubles the archive. Do not repeat the absolute-path mistake in `.backups/corpus-index-full-20260728T230859Z.tar.gz.sha256`, which only verifies at that exact path.

### What is genuinely solid

D1 holds, and better than claimed. Manifests identical (1,848 = 1,848), the §2 re-verification recipe returns `INTACT` exit 0, `sha256sum -c` on the tarball returns OK, and the live tree has **not drifted a single byte** since capture. Restoring is safe.

---

## 5. Ordering

**Keep P1 before P2. Move P2 to after P5. Split R2.6/R2.7 forward into Phase 0.**

P2's stated justification — "sequenced before normalization and wiring so those target final paths" — does not survive inspection. P5's coupling to the location is one constant plus one line: `compile-corpus-index.py:31` `CORPUS_INDEX = REPO / "corpus" / "index"` (+ :32 output) and `jsonl-loaders.ts:200` `resolve(root, 'corpus', 'index', 'compiled-index.json')`. P4 is content editing addressed relative to entry directories — the tree's parent is irrelevant. P3's only path coupling is N3.5, which extends `normalize-edges.py` past the five hardcoded literals at :37–41 — the same five lines R2.9 hand-edits, so running P2 first means editing five strings that N3.5 then deletes.

Against that thin benefit, P2 at position 2 costs:

- **It invalidates the programme's own evidence base mid-flight.** R2.10 sweeps 297 index files + 47 live plans + 389 tmp files, including `plans/index-system-report-2026-07-28.md` (11 hits) — the document the handoff names as the evidence base P3 and P4 execute against.
- **It buries P4's content diffs.** The sweep rewrites 297 files inside `corpus/index` at exactly the point P4 starts editing entry content; nothing distinguishes mechanical path churn from real repair.
- **Its gate is self-contradictory and its purge does not exist** (B7, B8).
- **It requires a full re-ingest to prove Gate R1** while `:8000`, `:8001`, `:8002` are all down.

The one durable argument *for* the move is Phase 6's §6C rationale: with every source a standalone entry, an index living inside `corpus/` would need entries for itself. That is a real reason, and it is never given as P2's reason. If the move is kept, adopt that justification and schedule it after P5, as one mechanical commit on a settled tree.

Two further changes:

1. **Promote 4A ahead of P3.** Gate N1 requires "all 494 JSON files parse", but the single failing file is repaired in P4. 4A is small: ig-10 is one character, plus the VLE path at `vle-05-…md:3`, plus parsers for the four divergent tension schemas.
2. **Move the three runtime-state fixes out of W5.7 into Phase 1.** `_hooksDerivationDone` starts failing on the first recompile (B6). Leaving it at P5 means four phases of drafting sessions silently losing a retrieval path, precisely while the index is supposedly being improved.

### Recommended addition — Phase 1.5, a thin wiring spike

An additive, default-off entry-scope read path over the six entries that already have structured units on disk — Uexküll 14, Being and Time 17, BCAP 13, FCM 15, Rickert 10, Wendt 8 = 77 unit JSONs. Needs no relocation, no normalization, no repair. It answers the question the whole programme bets on — does unit-level content in the drafting prompt change output quality? — in days rather than after 26–38 claimed prerequisite days, and produces the volume evidence W5.4's still-open storage-shape decision needs.

---

## 6. Open questions

1. **Does the index move at all, and to where?** No destination path appears in any of the three documents. If the answer is "yes, because Phase 6 makes entries mirror `corpus/` one-to-one", say so — that is the only justification that holds. If it is path hygiene, the move is not worth its cost.
2. **Are the 772 index manifest records deleted or rewritten?** R2.4 says rewrite, R2.6 says exclude, Gate R1 says zero records under the new path. Three incompatible end-states. The rewrite covers only 522 distinct paths (126 appear up to 3×) and 248 of the 772 are `status=failed`.
3. **Which edge layer is authoritative — per-source `*-edges.csv` or `_synthesis/global-edges.csv`?** Same data serialized twice (Wendt: 307/305 on both sides, 100% intersection), and four entries disagree between layers (FCM 428 vs 452, Aristotle 246 vs 156, Grammar 878 vs 876, Phantasia 708 vs 706). Nothing records which is stale. This decides both Gate W1's edge count and W5.4's storage sizing.
4. **What goes into the Phase 0 commit, and what happens to `compiled-index.json`?** Committing it locks in a +583/−55 diff nobody can classify as real change vs. known `canonicalTerms` churn; excluding it means Phase 1 must land the deterministic sort before the artifact is baselined. The handoff's citations also depend on the uncommitted `compile-corpus-index.py` (+15 lines) — commit that or the evidence base is one `git checkout` from invalid.
5. **Which pushes are authorised, and what counts as off-machine?** Three candidate pushes and three candidate destinations (CHIMERA, Mac, WRAITH) versus the same-machine fallback `/mnt/m`.

---

## 7. Sequencing consequence for D3

Not a correction — a scheduling observation. D3 ratifies full treatment for the five ontology-only entries, covering 19 sources. That is single-source entry authoring, by hand, at N=19, and three of the five clusters (N = 2, 3, 4) cannot bind the cross-unit gates. The implementation plan's own risk register says of Phase 6: *"do not start authoring at scale before E6.2 works."* Phase 4B is that campaign, before the automation exists. D3 stands; its **sequencing** likely belongs after the article-profile pipeline, not before it.
