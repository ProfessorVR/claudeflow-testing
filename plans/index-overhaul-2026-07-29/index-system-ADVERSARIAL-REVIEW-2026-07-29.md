# Corpus Index — Exhaustive Adversarial Review

**Date:** 2026-07-29 · **Branch:** `feat/wraith-retrieval` · **Nothing was modified, committed, or pushed**
**Method:** three independent adversarial workflows — 231 agents, ~16.6M tokens, ~6,000 tool calls
**Companion:** `plans/index-entry-creation-plan-CLAIM-LEVEL-2026-07-29.md`

| Strand | Agents | Raw findings | Verified | Confirmed | Refuted |
|---|---|---|---|---|---|
| Every index entry (27 dirs, 1,758 files) | 106 | 551 defects, 50 CRITICAL | 93 | 89 | 4 |
| Every line of index code (~10.5k lines) | 73 | 353 findings → 48 distinct | 63 | 56 | 7 |
| Every entry-creation plan (15 docs) | 52 | 207 defects, 242 design inputs | 43 | 30 | **13** |

Every claim below carries `path:line`. Where a strand's own finding did not survive refutation it is recorded as refuted, not quietly dropped.

---

## 1. The finding that reframes the programme

Claim-level indexing has been treated as an authoring problem. It is an addressing, schema and wiring problem.

Roughly 5,000 claim-shaped records are already authored across the 27 entries, plus 4,961 span-anchored claims in the sandbox. Nearly none is addressable. The two artifacts that already hit the stated target were both built outside every plan in `plans/`, and neither is registered:

| Entry | Volume | Density |
|---|---|---|
| `corpus/index/Dissertation/` | 982 claim records, 100% line-anchored, 8-tier support taxonomy (T1 confirmed 277 … T7 overreach 22), 76% in an explicit `supports`/`supported_by` graph, 841 typed edges, 235 cached verbatims with `insertion_anchor` | **1 record / 58 words** |
| `Veri(dis)similitude (Salvo MA)/vds-claims-moves.md` | 157 claims with stable unique ids, tier, closed-vocabulary reuse disposition, RODA anchor enum, volatility flags | **1 record / 59 words** |
| Boredom Secondary (the gold standard) | 189 files, 137,928 words, 2,924 sub-items, 3,815 edge rows | **1 addressable record / 1,009 words** |

Boredom Secondary cost ~111 agent invocations and delivered **68 name-only strings to runtime — 2.3% reachability**. Measured against its own sources — 563,740 words across 45 PDFs — its 463 reading records work out to **one claim record per ~1,218 source words, roughly 21× coarser than the Dissertation entry**.

The canonical template's lineage matters, and the prior account had it backwards. The template post-dates Boredom Secondary by about ten hours and post-dates Phantasia, RDR2 Secondary and Emotion Secondary by 22–65 days. It did not cause their defects; it **codified Boredom's shape and propagated it forward**. It has been instantiated exactly once — as VR Pedagogy Secondary, which drew **36 defects, the most of any entry in the corpus**, while being judged excellent by its own standard (34/34 units complete, zero stubs, zero dangling ids, a concept matrix perfectly consistent with its ontology). A well-executed plan produced the most defective entry. That is the case against the current gate system in a single sentence.

VR Pedagogy's arithmetic is the sharpest version of the problem: 69 agent-turns and 99,531 authored words produced an entry from which **exactly one file is read by any consumer** — `_synthesis/cluster-ontology.md` — yielding 60 ontology nodes and **zero edges**, because no `tension-edges.json` exists, because the template never names the file.

Clause level is absolutely absent: **nothing in 1,758 files carries a sentence offset, character span, or bbox.** The address systems nonetheless exist — Aristotle records 2,323 Bekker line-pairs, RDR2 addresses 1,040 individual frames and 529 timestamps, VLE keys 34 student verbatims by respondent and item, and In-Game once held 995 line-ranges into an extracted text file that was deleted from `/tmp`. One deterministic re-extraction resurrects that last set in a single step.

---

## 2. Corrected census

Re-derived from the filesystem. The prior handoff's numbers needed correction a second time.

| Quantity | Prior handoff | Re-derived |
|---|---|---|
| Unit analyses | 691 | **372** — the prior figure counted every `.md`, inflating ~86% |
| Unit records | ~310 | **355 files / ~320 distinct units** |
| Distinct edge triples | ~9,762 | **~9,702** — held, within 0.6% |
| Edge rows serialized | 19,770 | 10,089 per-source + 9,442 synthesis |
| Unparseable JSON | 1 | **2** — `bcap-analysis/phase2-u-intro.md:376` holds invalid JSON inside a fenced block; embedded JSON was never checked |

The four "disagreeing edge layers" have **four different causes**, not one staleness problem:

| Entry | per / synth | Actual relationship |
|---|---|---|
| Boredom Secondary | 1,918 / 1,897 | Lossy projection — 21 rows lost `locus` and `note` |
| VR Pedagogy | 1,131 / 1,129 | Ad-hoc deletion of exactly 2 rows mislabelled "dedup"; the rows carry distinct notes |
| **FCM** | 428 / **452** | **Strict superset** — 24 edges authored only at synthesis level. The opposite of stale |
| Aristotle | 246 / 156 | Near-disjoint — 33 of 368 triples shared; Greek-script ids vs latin snake_case. An abandoned re-encoding |
| Grammar | 878 / 876 | 2 rows |

---

## 3. Critical defects — entries

50 CRITICAL across 27 entries. The ones that change decisions:

**Aristotle locators are systematically wrong.** 33 of 34 unit records carry `pdf_pages` from a superseded linear offset; errors reach 47 pages (`aristotle-phys-08.json:9`). The bekker-index — the artifact designed for "rapid lookup of dissertation-critical passages" — has **101 of 188 loci off by more than two pages**, worst cases ~44. Recorded memory said ~30. Only `aristotle-meta-05.json` is correct.

**VR Pedagogy poisoned the global term matcher.** 19 of 60 nodes had their parenthetical qualifier mis-parsed into a `greek` slot, truncating the node name and injecting the bare English words `technological` and `control` into `canonicalTerms` — the greedy match list shared by *every* registered text corpus-wide (`_synthesis/cluster-ontology.md:182` + 18 more).

**D4 is factually false.** The handoff records as ratified that analysis-artifact entries are "still reachable by entry-scoped retrieval" (`index-system-HANDOFF-2026-07-28.md:109`). RDR2 Playthrough and Veri(dis)similitude are absent from `TEXT_DIRS` *and* absent from the vector store. There is no path by which either reaches a drafting run — including the 157 page-anchored claims that are the closest thing in the corpus to the target.

**Six entry trees are entirely untracked by git** — Grammar of Motives (91 files), Rhetoric of Motives (35), VLE, Presence Theory, Social Presence, Rhetoric of Interactivity. That includes the Burke×Calleja consubstantiation bridge the whole game-behavior integration depends on.

**Canonical POSITIONs are authored into files nothing reads.** In-Game's 18 and Uncomfortable's 18 live only in `book-level-ontology.json`; the compiler reads the `.md` twin. These are the layer closest to the claim-level goal and the layer that is dropped.

**Uexküll ships four incompatible German orthographies** and the corrupted one is the one that reaches runtime. For a book whose entire analytic value is its German terminology, a reader searching `Gegengefüge` finds nothing.

**A stale VLE figure propagated into 10 live locations in a sibling entry**, where it is now cited as fact. Seven of 18 VLE nodes carry counts the entry's own units superseded on 2026-07-23/24, with no field recording which layer is current.

---

## 4. Critical defects — code

56 confirmed, deduplicated to 48 distinct. The ones that are actively producing wrong output today:

**The compiler cannot report anything.** Its docstring at `:14-15` has promised stderr warnings since the file was written. `warn()` emits **zero bytes** on the live corpus. Root cause: all 12 `warn()` sites sit inside `except` handlers or missing-file guards, while the 23 real discard sites are bare `continue`/`return None` and can never reach a handler. `main()` at `:1361` always returns 0; there is no `argparse`, no `sys.exit`, no `assert` anywhere in 1,412 lines.

**Cross-author bridging has never worked.** `cross-author-utils.ts:473-474` evaluates `t.includes(targetLower)`; with an empty `targetConcept` — true of **31 of 72 hooks** — `t.includes('')` is always true in JavaScript. Unrelated topic word-sets (`['zzzzz','qqqqqq']` and `['boredom','attunement','pedagogy']`) return the same 31 hooks. It is not a matcher; it is a near-constant function.

**And the prompt then orders a fabrication.** `cross-author-utils.ts:498` slices to one bridge, which for most topics is `hook-de-anima-07` — whose `targetText`, `targetConcept`, `bridge` and `relevance` are all empty strings. `gold-standard-prompt-builder.ts:712-716` renders: `**Bridge [hook-de-anima-07]:** Summary Matrix (Aristotle) ↔ ? (Unknown)`, followed by `Both authors (Aristotle and Unknown) MUST be cited with direct textual evidence`. "Summary Matrix" is a markdown heading the compiler mistook for a concept. This is a mandatory, high-confidence-framed instruction to fabricate a cross-author synthesis with a non-existent author, injected into a doctoral drafting prompt.

**Two shipped ontology nodes are corrupt.** The unreachable `break` at `:718-721` is real: instrumented across all 17 header files, the absorb arm fires 108 times for 21,879 characters and the break arm fires **zero** times. `Preparatory Rhetoric` (Rickert) carries a 10,009-character `centralityTier` and 973 junk unit tokens — 20,377 bytes, 3.07% of the whole artifact. `Temporalität` (Being and Time) carries 586 units **inherited from a different tension record**, so the prompt asserts `[D1-U1, D1-U5, D1-U8, D2-U2, D2-U3]` where the source says `Intro-U2, D2-U6`: a plausible-looking, wholly wrong provenance claim with no garbage token to tip anyone off.

**The corpus is de-duplicated by page number across every author.** `retrieval-stage.ts:226, :303, :343` and 16 sites in `write-pipeline-orchestrator.ts` key on `page_start`. The unique `chunkId` already exists and already lands on `chunk.chunkId`. This gets *worse* with volume, as more works share low page numbers.

**71 of 117 primary texts are labelled secondary scholarship to the model.** `cross-author-utils.ts:317` defaults any title with a missing `authority_tier` to `'secondary'` — including *Fundamental Concepts of Metaphysics* and the Greek critical editions of *De Anima*, *Physica* and *Ars Rhetorica*.

**5,437 reasoning edges are rejected at runtime.** `PASS: 0 DROPPED: 5437` — the entire reasoning layer is dead to every consumer, from one schema mismatch.

**Twelve structured `*-ontology.json` files sit in the directories the compiler scrapes.** The string `ontology.json` appears nowhere in its 1,412 lines. *Heidegger and Rhetoric*'s is 56,912 bytes with structured `canonical_nodes` carrying `contributors` and `cross_pipeline_links`, `contested_concepts` with per-contributor readings, and a `tension_summary` — none of it recoverable from the markdown scrape. The pipeline is doing the hardest possible job, recovering structure from prose, while the structure is on disk in the same folder.

**Merging destroys provenance.** `deduplicate_ontology_nodes:1319-1348` keys on `name.lower()` with no text component. All 51 collisions are cross-text; 14,066 characters of definition are discarded; in 32 of 51 the surviving definition and the surviving tier come from different books. `type` and `centralityTier` are never merged at all, so the **first book in `TEXT_DIRS` order dictates both — and the Part III secondary clusters are listed first**, systematically demoting `das Man`, `Pathos`, `Kairos` and `Enthymeme` to Boredom Secondary.

**No CI job references the compiler or the artifact.** `grep -rn "compile-corpus-index\|compiled-index" .github/workflows/` returns nothing.

---

## 5. Scalability — the verdict

Sizing from the real corpus: 224 documents × ~200 claims ≈ 45,000 claim records; × ~10 clauses ≈ 450,000 clause records.

| Component | Breaks at | Why |
|---|---|---|
| Compiler | **Already broken at 1×** | Not runtime — silence. Zero warnings while discarding 37.6% of header source and 55 of 119 tensions. Registration is a 19-key hand-maintained literal that has already lost 8 of 27 directories |
| Artifact format | **~50×** | 712 bytes/record; Node parses 664 KB into 5.7 MB heap (8.6× expansion), twice per process. `MAX_STRING_LENGTH` is a hard wall regardless of RAM. Git-tracked and rewritten in full every build |
| Loader | **24.97×** | `reasoning.jsonl` is 21.5 MB; `readFileSync` throws `ERR_STRING_TOO_LONG` at 536,870,888 chars — uncaught at `:89` (process death), silent at `:210` (total blackout) |
| Retrieval | **Hard cap 50, at any volume** | Pool capped at `Math.min(maxChunks*3, 50)`. The KG boost is a linear scan: ~1.2M iterations per sub-query today, ~120M at 100× |
| Prompt builder | **Two opposite walls** | Caps are absolute integers, so at 100× the emitted context is byte-identical while discard goes 82% → 99.8% — blinder, silently. Meanwhile `buildCorpusCatalog` scales linearly: 2,110 tokens → ~211,000 at 100× |
| Reasoner | **Already at 86% of budget** | 172,578 pairs against a 200,000 default. One more entry and the cross-author pass silently never runs |

**Recommendation: replace the parse-and-emit layer; harden the loaders, adapters and orchestration.**

Replace `compile-corpus-index.py`'s parse and emit layers (~1,100 of 1,412 lines), `normalize-edges.py` (306 lines, and it is untracked with zero callers), `merge-reasoning-edges.py`, and the TS matching/rendering layer (~600 lines). Four grounds: the structured data already exists and the compiler ignores it; the defect density is architectural rather than incidental — the *same* unbounded-section bug exists independently in two parsers; the emitted schema has ten flat fields and not one is an identity or an anchor, and the parsers discard offsets in the first statement of every function; and nothing depends on current behaviour — `grep` over `tests/` finds **zero** tests referencing any of the three TS modules, and the bridge feature has never actually worked, so there is no working behaviour to preserve.

Keep the five markdown parsers as per-format adapters. They handle four genuinely different dialects real analysts produced over a year, and they work — 771 nodes, zero exceptions. Keep the mtime-cache pattern, the Zod boundary, the dropped-line counters at `jsonl-loaders.ts:66-68`, the HTTP wiring, and the rerank integration. Estimate 2–4 weeks, and it deletes more than it ports.

---

## 6. What did not survive — the honest record

### 6.1 Plan-defect refutations (13 of 43)

The plan strand had the highest refutation rate, and the refutations share one mechanism: **causal inversion**. The canonical template is dated 2026-07-15. The defects attributed to it live in files authored weeks to months earlier.

| Attributed defect | Verdict |
|---|---|
| The template caused the three prose-dialect ontologies | **Refuted.** Phantasia's ontology is dated 2026-05-11 — 65 days *before* the template; Emotion 41 days before; RDR2 Secondary 22 days before. The template names them as "Earlier sibling plans" and is the **fix**, not the cause. True cause: `phantasia-cluster-2025-analysis.md:178` and `rdr2-secondary-cluster-analysis.md:73` specify the deliverable as `cluster-ontology.{md,json}` with no section header, no field format, no wiring step and no gate |
| The template caused the four zero-yield `tension-edges.json` files | **Refuted.** `grep -n "tension-edges" ` on the template returns **zero hits**, and all four files predate it by 3 weeks to 2 months. True cause: four per-book plans each specified the file by target *count* only — `in-game-calleja-2011-analysis.md:211`, `grammar-of-motives-burke-1945-analysis.md:255`, `uncomfortable-situations-2017-analysis.md:199,:260`, `wendt-design-for-dasein-analysis.md:44,:74` |
| No plan requires page-offset verification | **Refuted.** At least eight do. `aristotle-corpus-analysis.md:317-345` defines a whole "Phase 0.5: PDF Offset Validation" requiring ≥2 Bekker landmarks per work, with mid-text and late-text landmarks explicitly "to confirm offset is uniform throughout". Aristotle and Rickert are **compliance failures, not specification gaps** — which is an argument for executable gates, not for more prose |
| The VR Pedagogy node corruption comes from an unrestricted section split | **Refuted on mechanism.** Re-running the compiler's exact regex returns 60 matches, **0 of them before the `## 3A.` heading**. The defect is real but its cause is `_parse_header_section:672-687`, which files any trailing parenthetical into the `greek` field |
| 42 hooks carry an empty `targetConcept` | **Refuted on count** — the true figure is **31 of 72**, inflated ~35%. The runtime defect itself reproduces exactly |
| The migration spec caused Dissertation and Veri(dis)similitude to be unregistered | **Refuted.** `TEXT_DIRS` never contained either entry in *any* of the four revisions of the file, including one predating the spec by 2.5 months |
| Six further attributions | Refuted on chronology, mis-citation, or a cause located elsewhere |

One filed "defect" was a harness artifact: a record with `plan_line: "plans/x.md:1"`, `defect: "d"`, `consequence: "c"` — unpopulated template fields on a file that does not exist. It is reported here rather than deleted.

### 6.2 Code-finding refutations (7 of 63)

| Attributed defect | Verdict |
|---|---|
| `cmd_verify` destroys 248 failed index rows | **Refuted.** Numbers reproduce exactly, the defect does not: all 248 removed rows have a strictly later `ok` row for the identical `path_abs`; zero current-failure rows are lost; two `status='failed'` rows survive; it prints and logs the dedup; the file is git-tracked. **This is the existing handoff's most confidently-wrong item** |
| `normalize_row` fabricates 8,889 blank triples | **Refuted.** Wrong metric — actual blank triples are 895 (4.3%), and neither figure is reachable through the CLI, which exits 2 on that input. The script has zero callers and is untracked |
| The merge is non-idempotent, destroying manual-edge provenance | **Refuted as filed** — three-run simulation reaches a fixpoint and preserves the hand-curated boundary. **But it aimed at the wrong file:** a second merge run truncates `unanchored-edges.jsonl` from **1,141 records to 0**, unrecoverably. Independently HIGH |
| `clearJSONLCaches()` is a loaded gun | **Refuted.** The project is ESM; `require` throws `ReferenceError` before reaching it. **Bonus real finding:** the identical broken `require` at `quality-integration.ts:749` sits inside a swallowing `try/catch`, so `detectUnanchoredEdges` runs with ontology expansion permanently empty, always, with zero log output |
| The 3A window loses 153 rows | **Refuted.** The window is deliberate and protective; simulating the "fix" fabricates 62 nodes named `depends_on`, `presupposes`, `contrasts_with` |
| `corpus/index` lacks immutability protection | **Refuted.** Arithmetic off ~35×, and the proposed remedy would produce a permanently red gate because `builtAt` is stamped every run |
| `run_ingest.py` traps 531 phase-less records | **Refuted**, and the proposed fix is actively harmful — it would re-append all 531 on every run |

### 6.3 Entry-defect refutations (4 of 93)

Minor: three severity downgrades and one "missing" artifact that exists under a different name in `_synthesis/`.

---

## 7. Corrections to the existing programme documents

The handoff and implementation plan should be amended:

- **Strike** the `cmd_verify` manifest-destruction claim, the `normalize-edges` blank-triple claim, the merge-idempotence claim, the `clearJSONLCaches` live-caller claim, the `run_ingest.py` skip claim, and the immutability-checker claim.
- **Correct** "691 unit analyses" to 372, "17 discard sites" to a figure well above 22, the FCM edge-layer disagreement from "stale" to "synthesis is a superset", and the bekker-index locator error from ~30 to 101 of 188.
- **Add**, as the four largest omissions: the twelve structured `*-ontology.json` files that make the scrape architecture unnecessary; the runtime rejection of all 5,437 reasoning edges; the `t.includes('')` always-true bridge matcher; and the `undefined:page_start` de-duplication key.
- **Retire** D4's claim that analysis-artifact entries are retrievable. They are not, by either path.

What held up: the compiler's structural facts throughout — parser entry points, `TEXT_DIRS`, Aristotle-only hooks, the tension guard, the no-exit-code posture, the `:718` mechanism, the caching topology, `SKIP_DIRS`, the ingest id scheme, and the CI triggers.

---

## 8. Recommended order

1. **Phase 0 Item 0 still stands** — `"index"` into `SKIP_DIRS` at the three sites. 516 index markdown files are re-chunked and re-embedded on every compile, so ingestion cost grows with index size.
2. **Observability before anything else.** `--strict`, an error counter, a golden-file test, atomic writes, a total sort key. Nothing below is reviewable until these land; this is why a 10,009-character field survived three feature commits.
3. **The four cheap TS fixes with the widest blast radius:** the bridge guard, the `Unknown` author refusal, `_hooksDerivationDone`, and `chunkId` de-duplication.
4. **Schema align the reasoning edges** — one change resurrects a 5,437-edge graph that is currently 100% dead. Highest value per line in the report.
5. **Make the index path injectable** (~20 lines) and land the measurement harness, then run the paired A/B on the seven sources that already have both representations. About $22, no new authoring, and it answers whether claim-level content changes output before the expensive work starts.
6. **Then** offset threading, and the migration table in the creation plan.

---

## 9. Open decisions

Beyond the five in the existing handoff, this review adds five:

1. **Verbatim storage.** Two entries deliberately suppress verbatim text. A clause-level index needs the clause. Does a rights-tiered storage/display split replace the blanket 25-word ban?
2. **Sandbox promotion.** 4,961 span-anchored claims at 93% char-span coverage are the only clause-level addressing in the system, sitting in `tmp/`, untracked and unbacked-up. Promote now, or keep as Phase 8?
3. **Compiler disposition.** Replace the parse-and-emit layer, or harden in place?
4. **Density target.** 15–35 records per 1,000 source words implies 50–500 claims per article against today's ~7.
5. **Group layer.** Only three gates genuinely collapse at N=1 — debates, intra-cluster citations, evolution arc. Confirm they move to a GROUP layer and that entry-level gates drop them.
