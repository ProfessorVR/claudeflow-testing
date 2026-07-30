# 00 — Critical review of the draft claim-level plan

**Reviewed document:** `plans/index-overhaul-2026-07-29/index-entry-creation-plan-CLAIM-LEVEL-2026-07-29.md` (625 lines, working tree)
**Reviewer:** Phase 1 finalizing session (Fable), 2026-07-29
**Evidence base:** the four-workflow audit archive (239 verified findings: A 93 / B 63 / C 43 / D 40; 199 confirmed, 40 refuted), the ten narrative documents, and the read-only spot-checks logged in `phase1-worklog.md`.
**Binding directives applied throughout:** archon-cli is the target repository; index first, ingestion second; full re-ingestion and regeneration sanctioned; index data transfers into archon before work begins there; preservation first; **WRAITH fully retired** (wraith-infer :8100 and the bge-reranker-v2-m3 included; only removal work permitted); the archon agent-coding stack abandoned (archon-cli itself is NOT abandoned).

---

## 0. Verdict in one paragraph

The draft plan is substantially correct and unusually well-evidenced. Its central reframing (§0: addressing/schema/wiring, not authoring), its record model (§3), its gates (§8), and its phase skeleton (§12 A–F) survive review and are adopted with amendments. It has **one structural omission that the binding directives make disqualifying as-is — it contains no wraith-dependency treatment of any kind** — plus a handful of stale recommendations inherited from pre-directive documents, several places where its numbers have drifted against the live tree, and three gaps (no explicit content-defect worklist, no explicit off-machine preservation procedure, and preservation not isolated as an unconditional first phase). All are correctable; the final plan (01) corrects them.

---

## 1. Confirmations — what the draft gets right, tied to findings

1. **Inversion of the order of work (schema/checkers/loader before authoring).** Confirmed by the strongest pattern in the audit: a well-executed build produced the most defective entry (VR Pedagogy: 36 defects, 1 readable file, 60 nodes, 0 edges — A-70, A-71, A-72, A-78, C-19, C-24), and all 14 current gates are narration-satisfiable (C-23, C-36). The plan's "gates that cannot fail" diagnosis is verified across C-02..C-43.
2. **The regeneration contract (§0.2.1) and its three consequences.** Sound. The Cozo no-`ALTER` constraint is real (D findings; `run_create` swallows only "already exists") and the redo-cost framing is the correct response given sanctioned re-ingestion.
3. **§3.1a (archon supplies the clause layer) and P19/P20/P21.** Verified live in the archive (00-SESSION-LOG §4) and consistent with D-01, D-08, D-14, D-15, D-25, D-40. The four-line correction from §13.5 of the D incident report (the `local_range` parameter already reaches `fragment_for`) should be carried into the step text.
4. **Gate on `match_kind == "exact"`, never `found`** (P20, §8 quote gate). Verified: the ped-sec-29 fabrication returns `found: true` at fuzzy 0.741/0.704 (`REPORT_FLOOR = 0.60`).
5. **The grounding design note** — never ground extracted claims via `find_fragment_bboxes` (3.34–5.22 s exact / 12.12 s not-found → 42.5–151 h serial at 45k claims); ground by `(chunk_id, local range) → doc_chunk_blocks`. This is the single most consequential performance finding (D-04 refutation → §15.3) and the draft carries it correctly.
6. **The byte-versus-char convention step (C2).** Confirmed hazard: `doc_chunk_blocks` columns are *named* `char_start/char_end` but the schema doc comment says byte ranges, and `local_span_in_chunk` returns bytes while `quote_verify.rs:150` normalizes into a char vector. On a Greek/German corpus this is exactly the Port-#2 byte-vs-codepoint failure mode repeating.
7. **A1 preservation content** (three irreplaceable assets: 1,522-file untracked hand-authored layer — now **1,554** untracked, see §3.2 below; gold set mid-annotation; 4,961-claim corpus) and **A2 manifest-verified transfer**. Both confirmed; the stale `archon-cli/index/` fork (missing three entries, zero readers, own commit message says wipe-before-PR — D-19 refuted, D-23, D-37) is the cautionary case the draft correctly cites.
8. **The GROUP layer (§6.4) and the three genuinely N=1-collapsing gates.** Verified against the gold cluster (12/12 and 11/11 debate axes multi-unit). The draft's correction of the earlier "every numeric gate is cross-unit" overstatement is itself correct.
9. **§10 migration table and C5 (migrate the relational apparatus; regenerate claims/clauses).** The "irreplaceable = hand-authored relational judgment" analysis is the right reading of §0.2.2's binding row.
10. **E10 / G19 / D3 (reverse-reference index, post-change sweep, post-recompile assertion).** Independently demonstrated twice in one day (the audit's stale-VLE-figure propagation into 10 live sites, and the anchor repair leaving 10 stale files, one reaching the runtime artifact — §11, §12 archive docs).

---

## 2. Corrections — where the draft is wrong or overtaken

### 2.1 WRAITH: the disqualifying omission

The draft plan **never mentions wraith at all**. Under the retirement directive this is not a nitpick; three of its inherited recommendations actively point the wrong way:

- **Adversarial review §5 "Keep … the rerank integration"** (incumbent keep-list) — **overridden.** The incumbent's reranker (`services.rerank`, endpoint `http://192.168.50.22:8100/v1/rerank`, config-manager.ts:284-289) is a wraith component. It must be disabled/removed, not kept.
- **The archon "Rerank wire-point A/B"** (`crates/archon-docs/src/retrieval.rs:141-171`, `crates/archon-evidence/src/lib.rs:187`, `crates/archon-docs/src/rerank_http.rs` with `DEFAULT_URL = "http://192.168.50.22:8100/v1/rerank"`, model `bge-reranker-v2-m3`) and the **wraith embedding opt-in** (`embed_openai.rs`, backend `wraith-gte-qwen2-1536-v2`, enabled only via `ARCHON_DOCS_EMBEDDING_PROVIDER=openai-compatible` + base URL per commit `7b44c665`) are the concrete archon wraith touchpoints. The final plan adds an explicit removal step (01 §Phase A, step A5) with a gate that exercises retrieval with no wraith service running.
- **The recorded reranker eval win** (memory: raw 1536 regression, reranker the win) — acknowledged and **accepted as a deliberate loss** per the directive. Not relitigated anywhere in the final plan.

**Spot-verified this session (good news that shrinks the removal step):** with default env, archon retrieval **already runs wraith-free** — `archon docs model-status` reports backend `fastembed-onnx`, dimension 768, Rust HNSW 21,929 vectors dim 768; `archon evidence find --mode hybrid` returned candidates with no wraith env set. The reranker is off unless `ARCHON_DOCS_RERANK_ENABLED` is truthy and degrades gracefully on error; the wraith 1536 embeddings live in an isolated namespace that the production path never touches. The removal step is therefore mostly code/config hygiene plus a hard gate — not a retrieval rebuild. **Also spot-verified: wraith-infer was still ONLINE at recon time** (`/health` returned status online, gte-Qwen2 dim 1536 + bge-reranker-v2-m3, cuda). "Retired" is a directive, not yet a physical state; the removal gate must run with the service actually stopped or unreachable, and must not rely on today's network state.

**Ingestion is wraith-clean already:** archon's live policy uses the local Marker **sidecar** (`.archon/policy.toml:202-203`, `scripts/archon_marker_sidecar.py` via `~/.venv-marker/bin/python3.11`, device auto local CUDA→MPS→CPU); `marker_url` is commented out and points at localhost anyway. Phase F re-ingestion does not need WRAITH GPU Marker. (The memory-recorded "best-quality plan = WRAITH GPU Marker" is superseded by the retirement; the local sidecar with the `archon-accel` OOM ladder is the plan of record. Note `~/.venv-marker` pins pypdfium2 4.30.0 — the ligature-dropping version; the bump is now a named Phase E step, see 01 §Phase E.)

- **Incumbent side:** `services.rerank` defaults `enabled: true` with the wraith endpoint (config-manager.ts:284-289; env keys `GOD_RERANK_ENDPOINT`/`GOD_RERANK_ENABLED`:365-366), but reranking is per-call opt-in (`options.rerank ?? false`, smart-retrieval-layer.ts:201) and degrades with a once-per-process warning when unreachable. Interim drafting therefore survives wraith-off today; the removal step flips the default and removes the endpoint so nothing ever waits 8 s on a dead host.
- **B-27 (rerank-boost interaction) is a shared-code finding**, not wraith-only: the +0.10 canonical-term boost saturates at 1.0 over *any* base score, reranked or not. It stays in scope (see traceability).
- **D-28 / D-31 (bug-compatibility traps for a legacy-view emitter)** concern an artifact the plan already defers ("Deferred: legacy-view emitter"); with the emitter deferred these become documentation requirements, not build steps.

### 2.2 Stale or superseded recommendations inside the archive that the draft partially inherits

- **15-ARCHON-FIRST-VERDICT's "keep authoring adapters in Python / archon not the producer"** — already superseded by §0.2 in the draft itself; confirmed superseded here. The final plan builds record production natively around archon per the directive, with the Python compiler frozen as the legacy producer for the incumbent drafting path only.
- **Archon-first synthesis §6 "the corpus tree does not move; delete archon's fork; read in place across the repo boundary"** — **overridden by the transfer directive.** The index transfers into archon (A7 in the final plan), one-way, manifest-verified, with declared ownership; the stale fork is replaced, not merely deleted. The synthesis's underlying argument (two drifting copies must end) is preserved by the ownership/staleness rules, not by read-in-place.
- **The "very first commit = SKIP_DIRS" ranking** stands, with the path correction the synthesis itself makes: the three sites are `scripts/ingest/run_ingest.py:365`, `scripts/ingest/run_ingest_phase2.py:978`, `scripts/ingest/parallel_ingest.py:69` (under `scripts/ingest/`, not `scripts/`).

### 2.3 Numbers that have drifted against the live tree (spot-verified this session)

| Draft figure | Live value (2026-07-29, this session) | Consequence |
|---|---|---|
| 1,522 untracked files under `corpus/index` | **1,554** untracked; **1,891** total files (archive said 1,758/1,759) | Preservation step must not hard-code counts; acceptance checks use ratios/deltas, not absolute counts |
| Out-of-band repair = 6 files + compiled-index | **9 tracked-modified** now: 7 Boredom Experiment files (bex-01 and bex-03 now included), the Boredom Secondary concordance, and `compiled-index.json` | Confirms the prompt's "lower bound" warning; executor must diff at execution time |
| `ig-10-incorporation.json` cited as `corpus/index/In-Game (Calleja 2011)/ig-10-incorporation.json` (16-SESSION-CLOSE §16.7) | Actual path is one level deeper: `corpus/index/In-Game (Calleja 2011)/Calleja - From Immersion to Incorporation/ig-10-incorporation.json`; still unparseable (`Expecting ',' delimiter: line 155 column 3`) | Final plan carries the full path (step A4) |
| archon store "224 documents" (§3.1a) vs "226/227" elsewhere | `archon docs status` live: **227 sources / 226 ingested / 17,824 chunks** (one source perpetually "Ingesting: 1") | Use 226-ingested as the working figure; all archon-store figures remain spot measurements, not audited findings |
| `plans/` root duplicate copies (draft §13.4, "pending confirmation") | **Already deleted** (16-SESSION-CLOSE records 2 deletions by instruction; confirmed absent on disk) | §13.4 is resolved housekeeping; drop from open decisions |
| `compile-corpus-index.py` 1,412 lines dirty | Confirmed still 1,412 in tree | Dirty-tree caveat stands unchanged |

### 2.4 Corrections the draft already instructs readers to apply — re-confirmed here

- Workflow A audited **all 27 entries, 551 defects**; the A synthesis's "12 of 27, 288" is a truncation artifact (input sliced at 220,000 chars). Verified against the journal (106 results; 93 verifications reconstructed exactly).
- The plan strand's 13 refutations are causal inversions: the 2026-07-15 template did not cause May/June defects; the true causes are the per-book plans specifying `tension-edges.json` by count with no key names, and unenforced (not missing) offset-validation requirements. Both corrections are baked into the final plan's step rationales.

---

## 3. Gaps — what the draft misses

1. **No explicit content-defect worklist.** The audit produced a large set of confirmed *content* defects in specific entries (e.g., the RDR2 refuted-claim family A-29..A-32; VLE stale nodes A-83/A-87; Aristotle locators A-54..A-56; Presence Theory unverified quotations A-86). The draft's Phase F "regenerate everything" would eventually rebuild them, but nothing binds regeneration to the known defect list, so a regenerated entry could ship with a known defect unexamined. The final plan adds **F2's per-entry defect checklist derived from the traceability matrix**: an entry's regeneration acceptance includes explicitly resolving or waiving each confirmed finding filed against it.
2. **Preservation is inside Phase A rather than being its own unconditional phase, and has no off-machine procedure.** The Phase-1 prompt requires preservation as step 1 with exact commands, a destination, and a verification check. The final plan promotes it to **Phase 0** with a fresh timestamped backup (per archive §10.4 — the D1 backup pre-dates the anchor repair and restoring it would revert wanted work), the git commits, and an off-machine copy with a verified manifest.
3. **No treatment of the second unparseable JSON.** Fixing ig-10 leaves `bcap-analysis/phase2-u-intro.md:376` (invalid JSON inside a fenced block; embedded JSON was never checked — corrected census). Cheap to note, so the final plan's A4 records it as a companion check rather than leaving "the last unparseable JSON of 494" as an absolute claim.
4. **The commit-scoping hazard for `compiled-index.json` is described but not proceduralized.** The user's own measurement: 644 diff lines vs HEAD, only 108 attributable to the anchor repair; the rest is uncommitted 2026-07-20 work (three entries + vle-05 registration). Phase 0's commit steps in the final plan state explicitly that the commit is a *preservation snapshot of the mixed state*, message-annotated, not an endorsement of any single change — and that this is deliberate, so no future session tries to unpick it.
5. **No named step for the incumbent's data-loss time bombs that fire on routine operations.** B-55/B-57 (a routine `god-learn update` truncates `god-reason/reasoning.jsonl`, destroying merge-reasoning-edges output; the merge script truncates its own input with no backup) can destroy hand-curated data *during* the overhaul while the incumbent remains the live drafting engine. The final plan adds a two-line guard to Phase A (backup-before-truncate / refuse) — the cheapest insurance in the whole programme.
6. **Wraith removal, as above** (§2.1) — the largest gap, now step A5/A6 with its own gate.
7. **The archon-coder DO-NOT-TOUCH boundary is absent** (the draft predates the abandonment). The final plan's DO-NOT-TOUCH list names `crates/archon-coder` and the coding-agent branches; no step may build on them. (Spot-check found no plan step that currently does — the abandonment is a fence, not a change.)

---

## 4. Sequencing assessment

The draft's A→B→C→D→E→F order is correct and is retained with these amendments:

- **Phase 0 (Preserve) is split out ahead of Phase A** and contains the fresh backup, the three git-preservation commits, and the off-machine copy. Rationale: the draft itself says A1 "precedes everything"; the prompt requires it as step 1; and Phase A contains code edits that a failed half-step could tangle with an unpreserved tree.
- **Wraith removal lands in Phase A** (not later): it is small, reversible, and the gate ("retrieval works with wraith stopped") is a precondition for trusting every later phase's retrieval-dependent gates.
- **The A7 transfer stays after the Phase 0 commits** (the draft's A1→A2 dependency is real: the manifest to verify against must exist in git first).
- **B before C stands**: the checker (verify-quote path hardening) is the fastest dissertation value and C's imports want B's corruption-aware outcome classes to classify quote re-anchoring results (draft §10 "re-anchor every existing quotation" needs B4's `exact / drifted / store-corruption-suspected / not-found` to avoid mass false accusations).
- **Within C, C5 (relational-apparatus import) is gated as hard as C3/C4**, because it is "small in volume and large in value" and the one asset regeneration cannot recover — the draft says this; the final plan makes its gate explicit (row-count + spot-resolution checks per entry).
- **E/F remain last, per the directive.** E's content is updated for the wraith retirement (local Marker sidecar, pypdfium2 bump named) and for the fact that archon ingestion was never audited (every figure spot-measured; E opens with its own measurement pass).

---

## 5. Preconditions (§2 tiers) — completeness check against the directives

The draft's P1–P18 were written before the "compiler is a frozen legacy producer" settlement (§13, settled). Under that settlement:

- **Still executed (incumbent, interim honesty):** P8, P9, P10 (the bridge-fabrication trio — B-36, B-58, B-59, B-61), the `:718-721` elif reorder from P11 (B-25, B-32, B-39 — corruption reaching today's drafting prompts on every recompile, and recompiles are demonstrably happening), plus SKIP_DIRS and the ig-10 fix. Also now A6 (incumbent wraith default-off) and the B-55/B-57 truncation guard.
- **Superseded by archon-native generation (not executed in the incumbent):** P1–P7 (observability/CI/golden tests for the frozen compiler), P12 (merge key), P13/P14/P15 (TS retrieval hardening — carried instead as requirements on archon's evidence path where equivalent risks exist), P16–P18 (offset threading / extra passthrough / ontology-JSON source-of-truth — the archon-native record model and the 12-file structured-JSON reader make these moot). Each such finding is dispositioned individually in 02 (mostly "addressed by supersession at C/D/F" or "deferred — frozen legacy, retired at F"); none is silently dropped.
- **Clause addressing (P19, P20, P21):** all three retained, renumbered into Phase B (B3, B2, and C's SOURCE record requirement respectively).

The tier ordering itself (observability → stop corruption → clause addressing) was correct for a harden-in-place world; under the settled decisions the operative ordering is the phase ordering above, and §2's残 content survives as the *requirements list* the archon-native implementations must satisfy (carried into 01's step acceptance criteria).

---

## 6. Where the binding directives change the draft's assumptions — consolidated list

| Draft assumption | Directive impact |
|---|---|
| §11 keep-list includes "the rerank integration" (via adversarial review §5) | **Reversed** — wraith reranker removed both repos (A5/A6); loss accepted |
| No wraith dependency step anywhere | **Added** — A5 (archon) + A6 (incumbent) + gate G-A5 with wraith stopped |
| Archon-first synthesis: read index in place, delete fork, tree does not move | **Overridden by transfer directive** — A7 one-way manifest-verified transfer; ownership dated in both trees |
| 15-VERDICT: Python authoring adapters permanent | **Superseded** — regeneration contract; Python compiler frozen legacy; archon-native records |
| Phase F re-ingest could use WRAITH GPU Marker (per prior infra memory) | **Local Marker sidecar only** (already the live policy); pypdfium2 bump becomes a named E step |
| archon-coder available as tooling | **Abandoned** — fenced in DO-NOT-TOUCH; no step may depend on it |
| Preservation as Phase A step A1 | **Promoted to Phase 0**, with off-machine copy and verification |
| §13.4 duplicate plan copies pending deletion | **Done** — resolved before this session |

---

## 7. Note on the draft's three open decisions

Carried forward verbatim into `03-OPEN-QUESTIONS.md` as required, with their phase-blocks intact (verbatim storage → C1; density band → D1; group layer → D1). None is settled by the wraith retirement. The wraith-infer/reranker question that 16-SESSION-CLOSE §16.6 said needed a ruling **is settled by the directive and is not raised.**
