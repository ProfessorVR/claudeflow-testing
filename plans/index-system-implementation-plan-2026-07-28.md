# Index System — Phased Implementation Plan

**Date:** 2026-07-28 · **Revised:** 2026-07-29
**Companion report:** `plans/index-system-report-2026-07-28.md` (evidence citations)
**Corrections:** `plans/index-system-HANDOFF-ADDENDUM-2026-07-28.md` — **wins wherever it disagrees with this file**
**Status:** v5 — decisions ratified, Phase 0 backup complete, plan verified and corrected. No file under `corpus/index` has been modified.

**v3 supersedes v1/v2 ordering.** Directive received: wire the original index first and repair weak or broken entries; single-source entries next, **including short articles**; sandbox last.

> ### v5 verification pass (2026-07-29)
>
> An 8-agent read-only audit (5 audits, 2 adversarial critiques, 1 synthesis; 988k tokens, 378 tool calls) plus direct spot-checks tested this plan's claims. **The diagnosis held. The numbers and the Phase 0 commands did not.** Corrections are applied inline below and marked `[v5]`.
>
> **Five things a clean session must know before executing anything:**
>
> 1. **The urgent item was buried in Phase 2.** No walker's `SKIP_DIRS` excludes `index`; 518 of 522 latest index manifest records carry a falsy `phase` and re-embed on the next routine ingest. R2.6/R2.7 are now **Phase 0 Item 0**.
> 2. **All three Phase 0 commands were wrong.** `.gitignore:7` is `backups/` (no dot) and does not match `.backups/`; origin has five heads and zero tags, not one head; and the verification metric `git status --short corpus/index | wc -l` returns 27 because git collapses untracked directories.
> 3. **This plan's own evidence base sits on a dirty tree.** `scripts/compile-corpus-index.py` is 1,412 lines in the worktree against 1,397 at HEAD (19 registered entries vs 16). A `git checkout` invalidates every citation.
> 4. **The compiler is worse than recorded.** 17 silent-skip sites, not 7; zero `warn()` calls fire on the current corpus; `main()` at `:1361` always returns 0; and Gate C1's byte-identical clause is unachievable because `:1375` stamps `builtAt` unconditionally.
> 5. **Five recommendations are PENDING RATIFICATION**, not decided — see "Recommendations" below. The largest is moving Phase 2 to after Phase 5.

### Ratified decisions (2026-07-28)

| # | Decision |
|---|---|
| D1 | **Backup taken and verified.** `.backups/corpus-index-full-20260728T230859Z/` — 1,848 files, 41,711,698 bytes, SHA-256 manifests identical, archive restores bit-identical |
| D2 | **Tracking policy approved** — gitignore `.backups/`, track everything else under the index |
| D3 | **The 5 ontology-only entries get structured unit records and edges, and the FULL treatment.** No lite profile is ratified |
| D4 | **RDR2 Playthrough and Veri(dis)similitude are `analysis-artifact` entries** — no synthesis layer, excluded from source-entry gates, still reachable by entry-scoped retrieval |
| D5 | **In-Game ch.10 is a repair, not a choice.** All 13 chapters carry a topical + deep pair by design; `ig-10-incorporation.json` is simply corrupt (one unclosed object, lines 107–155) |
| D6 | **Aristotle - Complete Works is not broken.** It contributes 199 of 701 nodes plus all 72 hooks via `ARISTOTLE_WORK_MAP`. Removed from the repair list — the earlier zero-node flag was a census artifact |

---

## Priority basis

| Rank | Goal |
|---|---|
| **1** | Get the original index completely wired; resolve weak and broken entries |
| **2** | Single-source entries for every source, short articles included |
| **3** | Analysis-upgrade sandbox (cross-author concept integration) |

One note, recorded once and then set aside: I flagged that short articles don't decompose into the multi-unit structure the cluster gates assume. You've reaffirmed that articles get standalone entries, so that's the decision and the plan builds for it. The consequence is handled in Phase 6 with an article-scale entry profile rather than by relaxing the monograph gates.

Infrastructure phases (0–3) are not a competing priority. They are the wiring: nothing can be "completely wired" through a compiler that cannot fail, over seven incompatible layouts, at a path that is still being ingested.

---

## Where the index actually stands

Per-entry census, run 2026-07-28. `nodes` = ontology nodes reaching `compiled-index.json`; `units` = structured unit records on disk; `edges` = edge-CSV rows on disk.

### Healthy (11)

| Entry | Nodes | Units | Edges |
|---|---|---|---|
| Boredom Secondary (Part III) | 68 | 55 | 3,815 |
| A Grammar of Motives (Burke 1945) | 56 | 28 | 1,754 |
| VR Pedagogy Secondary (Part III) | 60 | 34 | 2,260 |
| Heidegger - Being and Time | 37 | **17** `[v5]` | 284 |
| Heidegger - Basic Concepts of Aristotelian Philosophy | 37 | **13** `[v5]` | 93 |
| Uncomfortable Situations | 36 | 6 | 744 |
| Heidegger and Rhetoric | 36 | 16 | 204 |
| Von Uexkull - A Foray | 35 | **14** `[v5]` | 152 |
| Heidegger - The Fundamental Concepts of Metaphysics | 32 | 15 | 880 |
| Rickert - Ambient Rhetoric | 25 | 10 | 56 |
| Wendt - Design for Dasein | 15 | **8** `[v5]` | 614 |

### Weak — registered but structurally thin (7)

| Entry | Nodes | Units | Edges | Missing |
|---|---|---|---|---|
| Virtual Learning Environments (King–Salvo) | 18 | **0** | **0** | units, edges, concept-matrix |
| Presence Theory (Foundations) | 10 | **0** | **0** | units, edges, manifest |
| Social Presence in Virtual Worlds (Part III) | 10 | **0** | **0** | units, edges, manifest |
| Rhetoric of Interactivity and VR (Part III) | 7 | **0** | **0** | units, edges, manifest |
| Boredom Experiment (VR Attention Study) | 7 | **0** | **0** | units, edges, concept-matrix |
| A Rhetoric of Motives (Burke 1950) | 39 | 8 | 420 | concept-matrix, manifest |
| In-Game (Calleja 2011) | 44 | 26 | 1,472 | **malformed `ig-10-incorporation.json`** |

The first five are ontology-only: they contribute concept names and nothing else. No unit records, no edges, no analytical substance.

### Broken or unregistered (9)

| Entry | Nodes | Units | Edges | Problem |
|---|---|---|---|---|
| Aristotle - Complete Works | via work-map | **34** `[v5]` | 402 | Registered `table` format, **no ontology file**; nodes arrive only through `ARISTOTLE_WORK_MAP`. `[v5]` The other 11 `.json` files are 9 `*-greek.json` + greek-appendix + bekker-index, not unit records. **`[v5]` One directory-name coupling to know: `compile-corpus-index.py:1239` hardcodes `CORPUS_INDEX / "Aristotle - Complete Works"` — rename it and all 72 hooks vanish** |
| Aristotelian Phantasia Secondary | **0** | 8 | 1,414 | Unregistered; ships `cluster-ontology.json` (41 concepts) the compiler never opens; no manifest |
| RDR2 Secondary (2019-2023) | **0** | 12 | 1,012 | Unregistered; ships JSON (21 concepts) |
| Aristotelian Emotion Secondary | **0** | 5 | 420 | Unregistered; ships JSON (40 concepts) |
| Aristotelian Motion and Time Secondary | **0** | 1 | 58 | Unregistered; **no ontology at all**; 5 files total — abandoned mid-creation |
| Dissertation | **0** | 33 | 1,682 | Not a source-text entry — pipeline run-history store |
| Game-Behavior Analysis Method | **0** | 1 | 0 | Methodology document store, 9 versions of one file |
| RDR2 (Salvo Playthrough) | **0** | 0 | 0 | Primary-analysis artifact; no synthesis layer |
| Veri(dis)similitude (Salvo MA) | **0** | 0 | 0 | Primary-analysis artifact; no synthesis layer |

### The headline number

**~310 unit records · 691 unit analyses · ~9,762 distinct edges on disk. Zero of them reach runtime.**

Only ontology nodes compile. Everything else — every unit breakdown, every relationship, every concept matrix, every debate map — is authored and unreachable. That is what "completely wired" has to fix.

> **[v5] Both counts were wrong; the headline is not.** "357 unit records" reconciles with no derivation — the census table above sums to 323, corrected per-entry derivation gives 310. Five per-entry counts are off: Being and Time 17 not 18 (the 18th `.json` is `manifest.json`), BCAP 13 not 14, Uexküll 14 not 15, Aristotle 34 not 45 (the extra 11 are 9 `*-greek.json` + greek-appendix + bekker-index), and Wendt **8** not 7 — an undercount.
>
> "17,736 edge rows" double-counts nearly every edge: `_synthesis/global-edges.csv` re-serializes the per-source files. Wendt control — `units/*-edges.csv` 307 rows / 305 distinct, `_synthesis/global-edges.csv` 307 / 305, intersection 305. Distinct triples ≈ **9,762**. Separately, 19,770 rows exist on disk and the `*-edges.csv` glob misses **2,034**: A Rhetoric of Motives ships 8 files named plain `edges.csv`; Grammar and In-Game ship `global-edges-pre-canonical.csv`.
>
> **Four entries disagree between the two layers** — FCM 428 vs 452, Aristotle 246 vs 156, Grammar 878 vs 876, Phantasia 708 vs 706 — and nothing in the repo records which is stale. Which layer is authoritative is an open decision; it sizes both Gate W1 and W5.4.
>
> Also: "Boredom Secondary 68 nodes" is a label-**attribution** count (771 attributions across 701 nodes); only **61** node objects carry it as their sole `text`. Same denominator slip as D6's "199 of 701."

---

## Phase map

| Phase | Name | Effort | Gate |
|---|---|---|---|
| **0** | Preservation — **now includes Item 0, stop the ingestion** | 0.5 d | P0 |
| **1** | Compiler hardening + registry triage | **4–6 d** `[v5]` | C1 |
| **1.5** | **Thin wiring spike** — *proposed, pending ratification* | 3–5 d | — |
| **4A** | Hard breakage — *proposed promotion ahead of Phase 3* | 1 d | — |
| **3** | Normalization layer | 5–8 d | N1 |
| **4** | Entry repair (4B–4D) | 6–10 d | Q1 |
| **5** | **Wiring** — unit/edge/apparatus reach runtime; entry-scoped + index-first retrieval | 8–12 d | W1 |
| **2** | Index relocation — *proposed move to here, pending ratification* | 3–4 d | R1 |
| **6** | Single-source entries at scale | large — scoped at gate | E1 |
| **7** | Cross-cutting groups | 8–12 d + compute | G1 |
| **8** | Analysis-upgrade sandbox | 6–10 d + ~$15 | S1–S5 |

Phase 4 (repair) and Phase 5 (wiring) interleave — the 13 healthy entries can be wired while the weak ones are repaired.

> **[v5] The ordering above is the *proposed* one.** v4's order was 0→1→2→3→4→5→6→7→8. Four changes are proposed and **none is ratified**; reasoning is in "Recommendations" at the end of this file. The numbering is kept stable (Phase 2 is still "Phase 2") so that every existing R2.x item reference survives.
>
> **Effort revised.** Phase 1 raised to 4–6 d: 17 skip sites rather than 7, plus three items that were mis-scoped (C1.6, C1.7, C1.8 — see Phase 1 below).

---

## Phase 0 — Preservation

Unchanged from v2, and still first. 82% of `corpus/index` is untracked but not gitignored, so `git clean -fd` deletes Aristotle (131 files), Dissertation (358), Burke, Heidegger, Calleja, RDR2. `writing-pipeline-v3` has no upstream and the `pre-promotion-20260419` tag is local-only.

| # | Item | Status |
|---|---|---|
| **P0.0** | **`[v5] NEW` Stop the ingestion — add `"index"` to `SKIP_DIRS` in all three walkers** | **do first** |
| P0.1 | Full verified backup of `corpus/index` | **DONE** — see D1, re-verified 2026-07-29, zero byte drift |
| P0.2 | Apply tracking policy: gitignore `.backups/`, track the rest | approved, **rule text corrected `[v5]`** |
| P0.3 | Push branch + tag to origin | approved, **targets corrected `[v5]`** |
| P0.4 | Back up `production-sandbox/data/` off-machine (~$25 claims + ~40 h annotation, irrecoverable) | pending |

### `[v5]` P0.0 — stop the ingestion *(new, do before everything)*

Pulled forward from R2.6/R2.7 because it is the only leak that worsens while the rest is deliberated. Three dict literals, ~2 minutes, fully reversible, nothing written, moved or deleted:

- `scripts/ingest/run_ingest_phase2.py:978`
- `scripts/ingest/run_ingest.py:365`
- `scripts/ingest/parallel_ingest.py:69`

All three are verbatim `{".extracted_media", "__pycache__", "node_modules", ".git", ".ingest_cache"}` — `index` is absent. `should_skip_phase2` (`:312-331`) requires `int(rec.get("phase") or 0) >= 2`, and **518 of 522 distinct latest `index/` manifest records carry a falsy `phase`** — so the next routine ingest re-embeds roughly 2,100 chunks of the index's own analytical prose into the live retrieval corpus.

While there, fix the walkers' default roots (R2.7): `audit_ingest.py:97` and `verify_ingest.py:166` hardcode an absolute path; `watch_corpus.py:175` defaults to a bare relative `corpus`.

### `[v5]` P0.2 — the approved rule does not work as written

`.gitignore:7` is `backups/` — **no dot** — and does not match `.backups/`. `git check-ignore -v --no-index '.backups/x'` exits 1. Eight untracked `.backups/` trees exist repo-wide totalling 82 MB, one of them inside `corpus/index`. Use **one global rule** instead of the two corpus-scoped ones:

```
.backups/
```

Verified against a scratch `core.excludesFile` with the repo untouched: all four nested `.backups` paths ignored, real entry files not ignored, untracked count 1,512 → 1,434.

Stage with an explicit pathspec, never `git add -A` — that stages 11,524 paths including the 82 MB `.backups/` and the 551 MB `tmp/analysis-upgrade/production-sandbox/` (`tmp/` appears nowhere in `.gitignore`). `node_modules` is **tracked** (12,695 files, 376 modified), so `git commit -a` sweeps a zod bump into the commit.

**Verify with `--untracked-files=all`.** The plan's stated metric `git status --short corpus/index | wc -l` returns **27** because git collapses untracked directories — it cannot distinguish success from doing nothing. Correct figures: 1,512 untracked now → 1 after; `git ls-files corpus/index` 335 → 1,768.

**Also commit `scripts/compile-corpus-index.py`.** It is 1,412 lines in the worktree against 1,397 at HEAD (19 registered entries vs 16). Every `path:line` in this plan and in the report resolves against the working tree; a `git checkout` invalidates the evidence base.

### `[v5]` P0.3 — the stated remote state was wrong, and the target is arguably the wrong branch

Origin has **five** heads (`audit-fixes`, `god-agent-v2`, `god-agent-v2-pr`, `main`, `writing-pipeline-v2`) and **zero** tags against 83 local. `writing-pipeline-v3` is 3 commits unique but **11 commits behind** origin/writing-pipeline-v2, and the tag's target `54c2ba1fe` is already reachable from origin — that push carries no new history.

Meanwhile **`feat/wraith-retrieval`, the branch this programme executes on, has 11 local-only commits and no upstream.** Repo-wide, 32 commits exist nowhere but this disk. A second remote `upstream` (`ste-bah/claudeflow-testing`) is unmentioned anywhere. Recommended order: `feat/wraith-retrieval` first, then the side branch and tag if wanted.

### `[v5]` P0.4 — the expensive half has no backup and the fallback disks are not mounted

`data/corpus` = 49 MB, 4,939 claims across 24 `claims.jsonl` files, **no backup anywhere on this machine**; the 79 snapshots under `production-sandbox/.backups/` cover `data/gold` only and sit on the same volume. `/mnt/nas` and `/mnt/j` exist as directories but are **not mounted** — both resolve to the root volume. Real mounts: `/mnt/f` (8.6T), `/mnt/m` (9.1T), `/mnt/h`, `/mnt/i`, `/mnt/c`, `/mnt/d`.

Archive the **whole** tree (gzips to 7.9 MB) — `data/corpus` holds two relative symlinks that dangle if the large derived artifacts are excluded, and `tar -h` doubles the archive. Write the `.sha256` with a **relative** path and verify **at the destination**.

**Gate P0 `[v5]`:** P0.0 applied · backup verified (done) · tracking policy applied **with the working rule** · agreed pushes resolve on origin · sandbox data byte-verified in a second location. If only `/mnt/m` is available, record a **partial** pass.

**Constraint:** WSL only, and I ask before each push.

---

## Phase 1 — Compiler hardening and registry triage

The compiler cannot fail. **Seventeen** silent-skip sites `[v5]` mean a clean run proves nothing, so no repair in Phase 4 can be verified until this lands.

> **`[v5]` Worse than "it does not warn."** The compiler emits **zero `warn()` calls** on the current corpus while discarding 55 tension records, despite its docstring at `:14-15` promising warnings to stderr (monkey-patched run counted 0). And it has **no exit-code discipline at all** — no `sys.exit`, no error counter, no `--strict`; `main()` at `:1361` always returns 0.
>
> The 17 in-branch content-discarding sites (22 counting structural omissions): `:260, :346, :430, :546, :559, :596, :650, :690, :727, :827, :837, :1110, :1120, :1128, :1267, :1290, :1300`.

### 1A — Make it fail loudly

| # | Item | Evidence |
|---|---|---|
| C1.1 | `--check` flag and non-zero exit | No argparse at all today; `main():1361` always returns 0 |
| C1.2 | Warn on entry directories absent from the registry | 8 of 27 invisible, silently |
| C1.3 | Warn on registered entries yielding zero nodes | Aristotle - Complete Works is registered with no ontology file |
| C1.4 | Warn on `tension-edges.json` files yielding zero edges | 4 of 11 drop **55 of 119** records at `:1128-1129` |
| C1.5 | Error, not empty list, on unparseable ontology input | **`[v5]` `parse_ontology_md` does not exist** — the real entry points are `parse_table_ontology` (`:195`), `parse_header_ontology` (`:513`), `_parse_field_value_ontology` (`:292`). Substance holds for all three |
| C1.6 | Self-check against manifest-declared counts | **`[v5]` Nearly no data to check against** — of 27 entries only 5 declare any count field, only 3 declare `total_units`, **zero** declare an expected node count. The one `nodeCount` on disk was generated by the compiler's own parser, so checking it is a tautology. Either author expected counts as part of 1C, or drop C1.6 |
| C1.7 | Deterministic output | 101 case-duplicate pairs flip per run. **`[v5]` The sort fix alone is not enough**: `:1375` writes `"builtAt": datetime.now(timezone.utc).isoformat()` unconditionally, so Gate C1's byte-identical clause can never pass. A third source: `deduplicate_ontology_nodes` (`:1319-1321`) keys on `node["name"].lower()` with no text component, merging nodes across works (771 raw → 701, 70 absorbed, no per-merge log) |
| C1.8 | **`[v5]` Fix the unreachable `break`, not the pollution** | Root cause found. `elif current_key and stripped:` (`:718`) precedes `elif stripped.startswith("###") …: break` (`:720-721`), so once any field key is seen the break can never fire — **the last field of the last node in *any* header section absorbs the rest of the file.** Today one `centralityTier` holds 10,009 chars and its `units` array 973 garbage tokens. Reordering two `elif` arms is the fix |

### `[v5]` 1D — Fix the runtime caches *(moved from W5.7, pending ratification)*

`_hooksDerivationDone` (`cross-author-utils.ts:56`, guard `:342`, set `:351`) is a one-shot global with **no reset anywhere** — grep across `src/` and `tests/` returns only those three lines. `jsonl-loaders.ts:205-213` invalidates on mtime and returns a *fresh* graph; 0 of 72 hooks carry a `sourceAuthor` key, so derivation at `:344-349` is the only source. **Recompiling mid-process empties `requiredAuthors` → `icp-orchestrator.ts:368` `continue` → cross-author backfill silently disabled, no log line.** A second uninvalidated cache compounds it: `smart-retrieval-layer.ts:794`.

The exposure begins the moment Phase 1 starts recompiling. Leaving the fix at Phase 5 means four phases of drafting sessions silently losing a retrieval path while the index is supposedly being improved.

### 1B — Read the JSON ontologies

The compiler reads **zero** JSON ontologies; the string `ontology.json` appears nowhere in its 1,412 lines. It already dispatches on `ontology_format` with two handlers (`header` ×17, `table` ×2), so a third is an established pattern.

Three unregistered clusters already ship structured ontologies it never opens:

| Cluster | Concepts | Fields |
|---|---|---|
| Phantasia Secondary | **41** | id, canonical_name, definition, centrality_tier, synonyms_merged, appears_in_units, first_pdf_page, domain |
| Emotion Secondary | **40** | label, units *(thin)* |
| RDR2 Secondary | **21** | concept, units, tier *(thin)* |

Add an `ontology_format: "json"` branch plus three shape adapters. **~1 day, +102 concepts.**

> **`[v5]` Five `cluster-ontology.json` files exist, not three, and two of them are traps.** Boredom Secondary ships a compiler-native one (`nodeCount: 68`, `generatedBy: parse_header_ontology`) and VR Pedagogy a minimal `{cluster, nodes[60]}`. **Both entries already register via markdown — wiring their JSON naively double-counts 128 nodes.** 1B needs a precedence rule (JSON wins, markdown wins, or JSON only where the entry is otherwise unregistered) before the adapters are written.

Target state: **JSON is the machine-readable ontology for every entry; markdown is the human prose.** Boredom Secondary already proves the `.md → .json` generation path and stamps it drift-proof; the prose clusters already have authoritative JSON. Generate where missing, read where present.

### 1C — Registry triage

Introduce an explicit **entry class** field. Four classes:

| Class | Members | Treatment |
|---|---|---|
| `source-entry` | the 21 real index entries | Full gates; compiled; retrievable |
| `analysis-artifact` | **Dissertation · Game-Behavior Analysis Method · RDR2 (Salvo Playthrough) · Veri(dis)similitude (Salvo MA)** | **No synthesis layer** (D4). Excluded from source-entry gates and from the ontology compile. **Still reachable by entry-scoped retrieval** — they are useful when drafting Part II |
| `incomplete` | Motion and Time Secondary | Queued for Phase 4 entry creation |
| `excluded` | — | Reserved |

The `analysis-artifact` class is what stops these four reading as defects forever. Veri(dis)similitude's own `phase0-overview.md` states the rationale: *"the other `corpus/index/` folders index external sources to be cited across the dissertation. This thesis is the author's own prior work being rewritten into Part II."*

Also replace registry-keyed-by-directory-name with explicit entry IDs. Today a rename silently drops an entry, and five entry paths are hardcoded in `scripts/normalize-edges.py:37-41`.

**Gate C1 `[v5]`:** two consecutive runs byte-identical **after excluding `builtAt`**; `--check` fails on a corrupted fixture; warnings fire for every unregistered entry, every zero-node registered entry, and all 4 zero-yield tension files; the **3 thin** JSON clusters register with non-zero nodes **and the 2 markdown-registered ones do not double-count**.

---

## `[v5]` Phase 1.5 — Thin wiring spike *(NEW, pending ratification — 3–5 d)*

An additive, **default-off** entry-scope read path over the 77 unit JSONs already structured on disk across six entries: Uexküll 14, Being and Time 17, BCAP 13, FCM 15, Rickert 10, Wendt 8. Reads `_synthesis/` and per-unit JSON directly — architecture B from the report §10.3. Needs no relocation, no normalization layer, no repair.

**Why it belongs here.** The stated priority #1 is "wire the index completely," and wiring is Phase 5 — behind 26–38 days of prerequisites. Nothing about *proving the concept* requires any of them. The spike answers the question the whole programme bets on — does unit-level content in the drafting prompt change output quality? — in days, and produces the volume evidence W5.4's still-open storage-shape decision needs while that decision is still cheap to change.

Not a gate. If the spike shows unit-level content does not move output quality, that is the single most valuable finding the programme could surface, and it surfaces it before the expensive phases rather than after.

---

## `[v5]` Phase 4A — promoted ahead of Phase 3 *(pending ratification — 1 d)*

Gate N1 requires "all 494 JSON files parse," but the only failing file is repaired in Phase 4. Landing 4A first makes N1 achievable. Detail in the Phase 4 section below; the work is one character, one path string, and four tension-schema parsers.

---

## Phase 2 — Relocate the index out of `corpus/`

> **`[v5]` PENDING RATIFICATION: move this phase to after Phase 5.** The stated justification does not survive inspection, and two of its items are unimplementable as written. Reasoning in "Recommendations" at the end of this file. Numbering is kept at "Phase 2" so every R2.x reference survives.
>
> **R2.6 and R2.7 have been pulled forward to Phase 0 Item 0** — they are the urgent part and do not need the rest of this phase.
>
> **Two defects to fix before this phase can run at all:**
>
> - **R2.5's purge does not exist.** The only delete in the ingest tree is `run_ingest_phase2.py:1830 coll.delete(ids=_stale)`, fed by `coll.get(where={"path_rel": path_rel})` at `:1686` — which returns **zero rows once the path changes**. `ls scripts/ingest/` contains no purge script. Write one, and back up the 6.5 GB `vector_db_1536/` before a first-run destructive operation.
> - **Gate R1 contradicts itself.** R2.4 rewrites 772 manifest `path_rel` values *to* the new path; Gate R1 requires zero records *under* the new path. Separately, 296 files inside `corpus/index` contain the literal `corpus/index` in their own prose (1,800 line-hits), 219 already ingested `ok` — any re-ingestion reproduces them all. See Open Decisions.
>
> **Two more things nothing in v4 accounted for:**
>
> - **CI fires on these paths.** `.github/workflows/god-audit.yml:5-21` triggers on `corpus/**`, `scripts/ingest/**`, `vector_db_1536/**` and runs `missing_link_detector.py` — one of R2.3's four sites. `.github/workflows/god-learn-qa.yml:41-53` runs `immutability_checker.py --verify`, whose protected list includes `scripts/ingest/manifest.jsonl` and `god-reason/reasoning.jsonl` — the two files R2.4 and Phase 3 mutate.
> - **`/god-learn-verify`, Gate R1's own check, mutates the artifact.** `god_learn.py:711-718 cmd_verify` calls `deduplicate_manifest()` first, rewriting `manifest.jsonl` in place (1,182 → ~696 records) and destroying the 248 `status=failed` index rows. It keys on `path_abs`, so post-move old and new paths survive as two keys.
> - **Manifest and vector store have already diverged.** The manifest marks 522 index documents `ok` with 2,134 chunks, but zero of their `doc_id`s exist in `vector_db_1536`; the only index chunks present are 25 from 6 PDFs under `Game-Behavior Analysis Method`. Gate R1 tests the manifest only.
> - **All three local services are down** (`:8000`/`:8001`/`:8002` return HTTP `000`; `.run/*.pid` stale) and no phase lists `/god-launch` as a prerequisite — yet Gate R1 requires a full re-ingest.

Sequenced here so that Phase 3 normalization and Phase 5 wiring target final paths rather than being rewritten afterwards.

The index is being ingested **now**: 772 of 1,182 manifest records are under `index/`, and 25 chunks are live in ChromaDB with `collection="index"`.

| # | Item |
|---|---|
| R2.1 | Move the tree; preserve `.backups/` |
| R2.2 | Update ~7 literal-string sites (~12 lines) |
| R2.3 | Update 4 string-free sites that join corpus root to manifest `path_rel` — `endnote-generator.ts:31`, `missing_link_detector.py:439`, `coverage_analyzer.py:470`, `orphan_identifier.py:335`. These survive any grep-driven migration |
| R2.4 | Rewrite 772 manifest `path_rel` values, or R2.3's sites resolve to nothing |
| R2.5 | Purge the 25 ingested index chunks from ChromaDB **before** the move (`doc_id` is path-derived; relocation mints a new namespace with no dedup) |
| R2.6 | Add `index` to `SKIP_DIRS` in every walker |
| R2.7 | Give `audit_ingest.py` / `verify_ingest.py` a `SKIP_DIRS` and a relative default root — they have neither (`:60`, `:67`, `:97`, `:166`) |
| R2.8 | Handle `god_learn.py:755`, which defaults `--root` to `<repo>/corpus` and is the primary user-facing driver via `/god-learn-compile`, `/god-learn-update`, `/god-learn-verify` |
| R2.9 | Update `scripts/normalize-edges.py:37-41` |
| R2.10 | Prose sweep — **297 self-referential files inside the index itself**, 47 live plans, 389 tmp files, 3 under `reports/` |

**Known residue:** `strings vector_db_1536/chroma.sqlite3 | grep -c corpus/index` = 458, of which **39 are embedded prompt/memory text and cannot be fixed by re-ingestion.** Accept as stale or re-embed deliberately.

> **`[v5]` Those two numbers are in different units.** 458 = `strings` *lines*; 39 = metadata *rows*. Raw byte occurrences are 497; live-table occurrences 319. And the 39 live in **`god_agent_vectors_1536`, not `knowledge_chunks`** — so rebuilding the corpus collection never clears them, whatever Gate R1 says.

**Gate R1:** ingest dry-run produces zero manifest records under the new path; fresh Chroma build has zero path hits outside the 39; `/god-learn-verify` passes.

---

## Phase 3 — Normalization layer

The pivot for everything after it. Today: 4 incompatible unit-JSON schemas, 4 `global-edges.csv` layouts, 4 `concept-matrix.csv` orientations, **42 edge-CSV header dialects**, **633 distinct relation values**, 31 unenforced ID prefixes, no schema file, no validator.

| # | Item |
|---|---|
| N3.1 | Define a canonical **unit record** — id, entry, title, locus range, concepts, arguments, claims, edges, provenance |
| N3.2 | Define a canonical **edge record**; collapse 633 relation values to a controlled vocabulary with an explicit long tail |
| N3.3 | One adapter per schema family. `plans/archon-corpus-index-migration-spec.md:45-58` already names 8 families — reuse that inventory |
| N3.4 | Validator + schema file + ID-prefix registry |
| N3.5 | Extend `scripts/normalize-edges.py` past its 5 hardcoded paths, which cover **none** of the five secondary clusters |
| **`[v5]` N3.6** | **Adapt the three apparatus classes v4 never named** — see below |

> **`[v5]` Three whole apparatus classes have no adapter and no mention in v4:**
>
> - **67 `.mmd` files across 15 entries encode 1,544 arrow-edges.** `plans/archon-corpus-index-migration-spec.md` §2 already records for both the aristotle-manifest and heidegger-sz families that "Edges live only in .mmd (open item)"
> - **144 `cross_pipeline_bridges` entries live in 22 unit JSONs.** Runtime has 72 hooks, 100% Aristotle, only because the compiler globs `*-cross-pipeline-hooks.md` under the Aristotle directory (`:1239-1244`)
> - **35 `*-deep.json` files** carry positions, tensions, interlocutors and ratio-catalogs that N3.1's canonical unit record has no slot for
>
> Also settle **which edge layer is authoritative** before N3.2 — per-source `*-edges.csv` or `_synthesis/global-edges.csv`. They are the same data serialized twice, and four entries disagree between layers. See Open Decisions.

**Gate N1:** all 27 entries load through the adapter layer into the canonical type; validator passes; all 494 JSON files parse — **`[v5]` which requires 4A to land first**, since the only failing file is repaired in Phase 4.

---

## Phase 4 — Entry repair

Concrete work list from the census. Runs concurrently with Phase 5 wiring of the healthy entries.

### 4A — Hard breakage (do first)

| # | Item |
|---|---|
| Q4.1 | **Repair** `ig-10-incorporation.json`. **`[v5]` This is a one-character fix, not a 48-line reconstruction.** `:134` opens `"non_game_studies_anchor_theories": {`; `:155` closes with `],`. Bracket-*type* mismatch at `:155` only — change `],` to `},`. `expected_game_loci` (`:107-119`) is well-formed and **not** implicated, contrary to v4. Validate against `ig-09-ludic.json`'s 27-key shape. Pre-repair original preserved in the D1 backup |
| Q4.2 | `Virtual Learning Environments/units/vle-05-…md:3` declares `corpus/virtual_learning_environments/` — does not exist; real directory is capitalized |
| Q4.3 | The 4 `tension-edges.json` files dropping 55 of 119 records silently. **`[v5]` Cause identified:** none carries the `node_a`/`node_b` pair the guard at `:1128-1129` requires. Their schemas are `pole_A`/`pole_B`; `wendt_position`/`against`; and two label/description-only forms. Write four parsers |

*(Aristotle - Complete Works removed — see D6, it is healthy.)*

### 4B — Structural thinness: the 5 ontology-only entries → FULL treatment (D3)

VLE, Presence Theory, Social Presence, Rhetoric of Interactivity, and Boredom Experiment each have per-source analyses in markdown but **0 structured unit records and 0 edges**.

**Decision D3: all five get structured unit records, edges, and the full profile.** No lite profile is ratified.

> **`[v5]` D3 stands; its *sequencing* is in question.** Full treatment for these five is single-source entry authoring, **by hand, at N=19**, and three of the five clusters (N = 2, 3, 4) cannot bind the cross-unit gates. This plan's own risk register says of Phase 6: *"do not start authoring at scale before E6.2 works."* **Phase 4B is that campaign, before the automation exists.** Its dependency is arguably E6.2, not Phase 1. Recommendation: run 4B after the article-profile pipeline. Pending ratification — the decision that these entries get the full treatment is not being reopened.

Current state:

| Entry | Sources | Per-source analysis | Has | Needs |
|---|---|---|---|---|
| Presence Theory (Foundations) | 4 | 3.7–5.6 KB each | cluster-ontology, concept-matrix (4×10), citations, drafting-loci, bridge-to-part-ii | unit records, edges, full synthesis apparatus |
| Social Presence in Virtual Worlds | 3 | 5.7–6.1 KB each | same set | same |
| Rhetoric of Interactivity and VR | 2 | 4.6–4.9 KB each | same set | same |
| Virtual Learning Environments | 5 | incl. a 20 KB unit | manifest, book-level-ontology, paper-digest-pointers | unit records, edges, full synthesis apparatus |
| Boredom Experiment | 5 channels | self-report, EEG, gaze, stimulus corpus | manifest, book-level-ontology, graph-channel-map | unit records, edges, full synthesis apparatus |

**Scoping consequence to resolve during execution.** Three of these clusters hold only 2–4 sources, and the cluster-level gates (8–12 debates, ≥50 lemmas, ≥max(10, N/4) intra-cluster citations) do not have enough material to bind at N=2. Under the Phase 6 direction this resolves cleanly: **each source becomes its own standalone entry carrying the full single-source profile, and the cluster survives as a group** whose relational gates scale with membership. Where a group is genuinely too small to support debates, either additional sources are added or the group's relational artifacts are deferred until it grows — a scoping call per cluster, not a weakening of the standard.

**Also required:** the Part III presence units carry a self-declared defect — *"Candidate quotations — ALL UNVERIFIED (OCR-only; re-verify against a clean PDF)."* These are cited in Part III, so verification is part of the full treatment, not optional polish.

### 4C — Missing apparatus

| Entry | Missing |
|---|---|
| A Rhetoric of Motives | concept-matrix, manifest |
| Phantasia Secondary | manifest |
| Motion and Time Secondary | everything — 5 files; needs full entry creation |

### 4D — Quality floor

| # | Item |
|---|---|
| Q4.5 | Build the verbatim-quote detector — the mandatory G1 copyright gate, currently satisfied by agent self-attestation |
| Q4.6 | **`[v5]` Backfill render-validation records — `mmdc` is already installed and validation HAS run.** mmdc **11.14.0** lives at `~/.nvm/versions/node/v22.22.0/bin/mmdc`, and two records exist (`Aristotelian Phantasia Secondary/_synthesis/render-validation.txt`, `Uncomfortable Situations/_synthesis/render-validation.txt`). The real gap: **13 of 15 `.mmd`-bearing entries lack a record.** Rescope from install to backfill |
| Q4.7 | Backfill `quality-gates-report.md` — only 2 of 27 entries have one; only 1 has machine-readable `metrics` |
| Q4.8 | Re-derive provenance for the **9 entries with no machine-readable source path** |

**Gate Q1:** every entry either passes its profile's gates or is explicitly classified with a lighter profile; zero unparseable files; zero silent-drop warnings from the Phase 1 compiler.

---

## Phase 5 — Wiring

The core of the directive. Make the 357 unit records, 691 analyses, and 17,736 edges reachable, and make "point the system at one work" a real operation.

### 5A — Get the content into runtime

| # | Item |
|---|---|
| W5.1 | Emit **unit records** into the compiled output — id, entry, title, locus range, concepts, arguments, claims |
| W5.2 | Emit **edges** — 17,736 rows, normalized per Phase 3 |
| W5.3 | Emit the **apparatus** — concept matrices, debate maps, citation networks, contested nodes, terminology appendices |
| W5.4 | Decide the storage shape. The artifact is already 664 KB from ontology nodes alone; unit records and 17.7k edges will not fit one JSON blob loaded per process. Likely a queryable store (SQLite) with the compiled JSON retained as a summary |

### 5B — Entry-scoped retrieval

| # | Item |
|---|---|
| W5.5 | Entry registry with stable IDs (from Phase 1C) |
| W5.6 | `scope: {entry: 'von-uexkull-foray'}` primitive — resolves to that entry's units, edges, and concepts with no vector search |
| W5.7 | Fix the paths that block scoping — **`[v5]` all three sub-items rescoped, see below** |

> **`[v5]` W5.7 as written gets two of its three items wrong.**
>
> - **`RetrievalOptions.collections` strands 167 real chunks.** `retrieval-stage.ts:189-197` pushes `'textual_analysis'` and `'v2_knowledge_chunks'` into a field `smart-retrieval-layer.ts` normalizes at `:194` and never reads; `v2_knowledge_chunks` holds 167 chunks unreachable at runtime. Worse, the field means Chroma *collections* at some call sites and metadata *values* at others (`corpus-constraint-builder.ts:251-252`) — **wiring it naively makes one field mean two things.** Decide the semantics first.
> - **Fixing the `FacetedRetrieval` arity does NOT buy reranking.** `hybridSearch` (`faceted-retrieval.ts:324-376`) has no rerank path at all and hardcodes `semanticSearch(query, {maxChunks:20, minRelevance:0.6})` at `:353-356`. Adding reranking is separate work. Also `npx tsc --noEmit` reports **157 errors**, so `npm run build` cannot succeed and the bug can never surface in CI — everything runs through `tsx` (transpile-only), which is why 4-arg calls to a 3-param method execute silently.
> - **`_hooksDerivationDone` — move to Phase 1D.** Its exposure starts on the first recompile, four phases before this fix would land. See Phase 1D.

Today the nearest capability is an `author_raw` ChromaDB filter (`retrieval-stage.ts:261, :340`) that scopes **raw PDF chunks**, not index entries. It searches the book, not your analysis of it.

### 5C — Index-first ordering

`corpus/index FIRST → embeddings → source PDFs` currently has **zero code**. It lives in `REVISION-PROTOCOL.md` as a workflow rule you follow by hand; the live order is inverted, with ChromaDB queried unconditionally and the index only expanding queries and adding a +0.10 boost.

| # | Item |
|---|---|
| W5.8 | Implement the three-tier order as an actual retrieval path |
| W5.9 | A/B before default-on |

The A/B is not ceremony. Recorded history in this system: raw 1536 embeddings were a **regression** (MRR 0.285 vs 0.493); only the reranker was a win. Retrieval changes here have not been reliably improvements, and index-first is a large behavioural change.

**Gate W1:** a query scoped to Uexküll returns his 14 units and their concepts, arguments, and 152 edges without a vector search; the drafting prompt contains unit-level content rather than 35 concept names; index-first A/B'd with a recorded keep/rollback decision.

---

## Phase 6 — Single-source entries at scale

Every source gets a standalone entry, articles included.

### Scale

| Quantity | Count |
|---|---|
| Corpus PDFs | 288 |
| Unique after dedup (23 duplicate groups, 20 cross-domain) | ~265 |
| PDFs referenced by any entry today | 168 (58%) |
| Entries today | 27 |
| Units inside secondary clusters that become standalone article entries | **114** (Boredom 55, VR Pedagogy 34, RDR2 Sec 12, Phantasia 8, Emotion 5) |
| Net new entries to author | **~140** |

Widest coverage gaps: `new_media` 2/43, `metaphysics` 2/19, `AD(H)D` 0/17, `textual_analysis` 0/1.

This is by far the largest spend in the plan. At the current hand-driven rate — one cluster of 8 articles is a long agentic session — ~250 entries is not feasible manually. Phase 6 is therefore mostly an automation build.

### 6A — Two entry profiles

The monograph gates cannot apply to a 20-page article, so define a second profile rather than weakening the first:

| Profile | Applies to | Units | Gates |
|---|---|---|---|
| **Monograph** | Books, edited volumes | one per chapter (14–28 observed) | Full existing gates |
| **Article** | Journal articles, chapters | one per section, or single-unit with section-level structure | Concept extraction, argument structure, claims, edges, loci, provenance. **No** debates, citation networks, or evolution arcs — those are group-level |

The article profile is what makes the directive coherent: an article entry stands on its own as a complete breakdown of *that source*, and the relational apparatus lives at the group level where it has something to relate.

### 6B — Automation

| # | Item |
|---|---|
| E6.1 | Genre classifier (monograph vs article), validated against all 27 existing entries |
| E6.2 | Article-profile authoring pipeline — the largest build in this plan |
| E6.3 | Promote the 114 cluster units to standalone entries, retaining clusters as groups over them |
| E6.4 | Ingest hook: new source → classify → scaffold → queue for authoring |
| E6.5 | Opt-out list — AD(H)D's 17 PDFs and any other deliberately-unindexed material |
| E6.6 | Canonical-domain rule for the 20 cross-domain duplicate groups; a representation for one-document-to-many-entries (3 PDFs today) |

### 6C — On mirroring corpus organization

Document→domain is many-to-many, so a literal mirror is not implementable. Under this design the mirroring lands where it is well-defined: **entries mirror `corpus/` one-to-one** (each single-source entry has exactly one source document, so the mapping is a function), while **groups** stay organized analytically. That preserves the distinction between "Aristotle primary" and "scholarship about Aristotle," both of which live in `rhetorical_ontology`.

**Gate E1:** classifier validated; article profile ratified against 3 hand-built exemplars; per-domain priority order agreed; opt-out list written.

---

## Phase 7 — Cross-cutting groups

Unchanged in substance from v2, but now cleaner: with every source a standalone entry, groups become **selections over entries** rather than containers of units.

| # | Item |
|---|---|
| G7.1 | Construct per-entry embedding documents (title, abstract-equivalent, concepts, Greek terms) |
| G7.2 | Re-embed via wraith-infer `:8100`, `kind:'document'`. The existing 278-record artifact is a valid subset — 277 present in the live 701-node ontology, ~39.5% coverage. Re-embed the 423 newer nodes; ~4 s at the measured rate |
| G7.3 | Member selection: embed-recall → `bge-reranker-v2-m3` precision. **Not pure cosine** — recorded eval says raw 1536 regresses, rerank wins |
| G7.4 | Deterministic evidence assembly |
| G7.5 | LLM authoring of group-level artifacts — debates, citation networks, contested readings, evolution arcs |
| G7.6 | Build the eval harness. `corpus/eval/` does not exist; `scripts/eval-retrieval.ts` was never written |

**Gate G1:** "secondary literature on Aristotle's phantasia" recovers ≥90% of the hand-built cluster with ≤2 false positives. Baseline today: 10 nodes, all primary Aristotle/Heidegger, **zero** from the 8-unit phantasia cluster.

---

## Phase 8 — Analysis-upgrade sandbox

Now last, per directive. The horizontal layer: claims → concept resolution → cross-author bridges.

State: Phases 0–3b complete (4,961 claims, 23 papers, ~$25), R1/R1.3 kept, Phase 4 gold set **25 of 50** dev items, Phase 5 E-ladder **never run** (`run-experiment.sh` and `run-ab.sh` are `exit 1` stubs), Phase 6 promotion not started.

**Moving this last is arguably a benefit.** The gold set's labels resolve 100% against the sandbox's 278-node ontology and only 25–36% against the live 701-node one. Running Phases 1–7 first means there will be exactly one settled ontology to rebase onto, instead of rebasing now and drifting again.

| # | Item |
|---|---|
| S8.1 | Rebase gold-set labels onto the post-Phase-7 ontology; preserve claim texts, genres, locked ordering, SHA lineage |
| S8.2 | Finish dev 26–50 under a **frozen** `CONVENTIONS.md`, deferred triggers disarmed, new patterns to a flat observations file, time-boxed |
| S8.3 | Build the experiment harness (both runners are stubs); build `corpus/eval/` if Phase 7 has not |
| S8.4 | Resolve the noise floor — Δ F1 ≥ 0.02 on 50 items is single-item resolution. Widen to ~0.06 and demote F1 to a tripwire, with the prose-side A/B as the decision signal |
| S8.5 | Run E0–E8; merge (one real conflict, `write-pipeline-orchestrator.ts`; 4 of 9 files merge clean); promote behind a default-off flag |

**Note on drift:** the worktree forked at `54c2ba1fe`; live is 22 commits ahead. Deferring further increases the merge cost. Phase 0 preservation is what makes that acceptable — the code is safe, just increasingly stale.

**Gate S1–S5:** as v2, unchanged.

---

## Risk register

| Risk | Phase | Mitigation |
|---|---|---|
| Compiled artifact outgrows a JSON blob | 5A | Decide storage shape before emitting; SQLite with JSON summary retained |
| Index-first ordering regresses retrieval | 5C | A/B before default-on; recorded history says retrieval changes here are not reliably wins |
| Normalization balloons | 3 | Time-box per adapter family; ship the 5 secondary clusters first |
| Article profile becomes a weaker second standard | 6A | Profile is explicit and machine-readable; entries declare which profile they were built to |
| ~140 new entries at hand-driven cost | 6 | Phase 6 is an automation build, not an authoring campaign; do not start authoring at scale before E6.2 works |
| Thin JSON ontologies under-deliver | 1B | Emotion and RDR2 carry no definitions; expect less retrieval contribution than Phantasia's 41 |
| Sandbox merge cost grows while deferred | 8 | Phase 0 secures the code; accept staleness as the price of one settled ontology |
| `doc_id` churn orphans chunks | 2 | Purge before move — **`[v5]` the purge does not exist; write it first** |
| Repair unverifiable | 4 | Phase 1 must land first — a clean compiler run currently proves nothing |
| **`[v5]` Index re-embedded into the live corpus on the next routine ingest** | **0** | **518 of 522 records re-ingest today. P0.0 — three dict literals. Do it before anything else** |
| **`[v5]` Evidence base invalidated by `git checkout`** | **0** | Compiler is 1,412 lines in the worktree vs 1,397 at HEAD; every citation resolves against the worktree. Commit it in P0.2 |
| **`[v5]` Cross-author backfill silently dies the moment Phase 1 recompiles** | **1** | `_hooksDerivationDone` has no reset and no log line. Move the fix to Phase 1D |
| **`[v5]` Gate C1 unachievable, so Phase 1 never exits** | **1** | `builtAt` is stamped unconditionally at `:1375`. Exclude it from the byte-identical comparison |
| **`[v5]` Phase 1B double-counts 128 nodes** | **1** | Two of the five `cluster-ontology.json` files belong to entries already registered via markdown. Decide precedence before writing adapters |
| **`[v5]` CI fires on the relocation and on Phase 3's mutations** | **2, 3** | `god-audit.yml` triggers on `corpus/**`; `god-learn-qa.yml` runs `immutability_checker.py --verify` over `manifest.jsonl` and `reasoning.jsonl`. Neither appears in any programme document |
| **`[v5]` Gate R1's own check mutates the manifest it checks** | **2** | `/god-learn-verify` calls `deduplicate_manifest()` first, 1,182 → ~696 records, destroying 248 `status=failed` rows |
| **`[v5]` `corpus/` itself — 2.7 GB, 288 source PDFs — has no backup and no tracking** | **0, 6** | 3,079 untracked non-index paths, none gitignored. It is the entire input to Phase 6 |
| **`[v5]` A full re-ingest is required to prove Gate R1 while all local services are down** | **2** | `:8000`/`:8001`/`:8002` return HTTP `000`; no phase lists `/god-launch` as a prerequisite |
| **`[v5]` The programme's core bet is unproven until day ~30** | **5** | Add Phase 1.5, the thin wiring spike, over the 77 unit JSONs already on disk |

---

## `[v5]` Recommendations — PENDING RATIFICATION

Recorded 2026-07-29 by the verification pass. **None of this has been approved.** A clean session should surface these before acting on them.

### R-1. Keep Phase 1 before Phase 2, but move Phase 2 to after Phase 5

Phase 2's stated justification — "sequenced before normalization and wiring so those target final paths" — does not survive inspection.

Phase 5's coupling to the location is **one constant plus one line**: `compile-corpus-index.py:31` `CORPUS_INDEX = REPO / "corpus" / "index"` (+ `:32` output) and `jsonl-loaders.ts:200` `resolve(root, 'corpus', 'index', 'compiled-index.json')`. Phase 4 is content editing addressed relative to entry directories — the tree's parent is irrelevant. Phase 3's only path coupling is N3.5, which extends `normalize-edges.py` past the five hardcoded literals at `:37-41` — **the same five lines R2.9 hand-edits**, so running Phase 2 first means editing five strings that N3.5 then deletes.

Against that thin benefit, Phase 2 at position 2 costs:

- **It invalidates the programme's own evidence base mid-flight.** R2.10 sweeps 297 index files + 47 live plans + 389 tmp files, including `plans/index-system-report-2026-07-28.md` (11 hits) — the document Phases 3 and 4 execute against.
- **It buries Phase 4's content diffs.** The sweep rewrites 297 files inside `corpus/index` at exactly the point Phase 4 starts editing entry content; nothing distinguishes mechanical path churn from real repair.
- **Its gate is self-contradictory and its purge does not exist.**
- **It requires a full re-ingest to prove Gate R1** while all three local services are down.

**The one durable argument *for* the move is never given as Phase 2's reason:** §6C makes entries mirror `corpus/` one-to-one, at which point an index living inside `corpus/` would need entries for itself. If that is the reason, adopt it explicitly and schedule the move after Phase 5 as one mechanical commit on a settled tree. If the reason is path hygiene, the move is not worth its cost.

### R-2. Promote 4A ahead of Phase 3

Gate N1 requires all 494 JSON files to parse; the only failing file is repaired in Phase 4. 4A is one character, one path string, and four tension parsers.

### R-3. Move the runtime-cache fixes from W5.7 to Phase 1D

`_hooksDerivationDone` starts failing on the first recompile. Leaving the fix at Phase 5 means four phases of drafting sessions silently losing the cross-author backfill path, with no log line, while the index is supposedly being improved.

### R-4. Add Phase 1.5, the thin wiring spike

Priority #1 is "wire the index completely," and wiring is Phase 5 — behind 26–38 days of prerequisites, none of which the *proof* requires. Six entries already carry 77 structured unit JSONs. Days, not a month, to answer the question the programme bets on, and it supplies the evidence W5.4 needs while that call is still cheap.

### R-5. Re-examine 4B's sequencing (not D3 itself)

D3 stands. But 4B is hand-authoring 19 single-source entries before the automation that exists to do exactly that, and three of its five clusters cannot bind the cross-unit gates at N = 2, 3, 4. Its real dependency is E6.2.

---

## Open decisions

D1–D7 are ratified. `[v5]` raises five that now **do** block Phases 2, 3 and 5:

1. **`[v5]` Does the index move at all, and to where?** No destination path appears in any of the three documents. If the answer is "yes, because §6C makes entries mirror `corpus/` one-to-one," say so — that is the only justification that holds (R-1). If it is path hygiene, drop the move.
2. **`[v5]` Are the 772 index manifest records deleted or rewritten?** R2.4 says rewrite, R2.6 says exclude, Gate R1 says zero records under the new path. Three incompatible end-states. The rewrite covers only 522 distinct paths (126 appear up to 3×) and 248 of the 772 are `status=failed`.
3. **`[v5]` Which edge layer is authoritative — per-source `*-edges.csv` or `_synthesis/global-edges.csv`?** Same data serialized twice; four entries disagree between layers (FCM 428 vs 452, Aristotle 246 vs 156, Grammar 878 vs 876, Phantasia 708 vs 706); nothing records which is stale. Sizes both Gate W1 and W5.4.
4. **`[v5]` What goes into the Phase 0 commit, and what happens to `compiled-index.json`?** Committing it locks in a +583/−55 diff nobody can classify as real change versus `canonicalTerms` churn; excluding it means Phase 1 must land the deterministic sort before the artifact is baselined. `compile-corpus-index.py` must be committed either way.
5. **`[v5]` Which pushes are authorised, and what counts as "off-machine"?** Three candidate pushes and three candidate destinations (CHIMERA `192.168.50.243`, Mac `192.168.50.10`, WRAITH) versus the same-machine fallback `/mnt/m`.

Carried from v4, none blocking Phases 0–1:

6. **Per-cluster scoping for the three small presence clusters** (2–4 sources each) — add sources, or defer group-level relational artifacts until membership grows? Decide during Phase 4B, per cluster.
7. **Per-domain priority order for Phase 6** — `new_media` (2/43) and `metaphysics` (2/19) are the widest coverage gaps; `AD(H)D` (0/17) is presumed opt-out.
8. **Storage shape for the wired index** (W5.4) — SQLite versus a growing JSON artifact. Decide at the start of Phase 5; Phase 1.5 supplies the evidence if ratified.

Execution handoff: `plans/index-system-HANDOFF-2026-07-28.md` (v2). Corrections and evidence: `plans/index-system-HANDOFF-ADDENDUM-2026-07-28.md`.
