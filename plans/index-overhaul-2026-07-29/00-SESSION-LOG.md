# Index Overhaul — Session Log and Durable Evidence Store

**Session date:** 2026-07-28 → 2026-07-29 · **Repo:** `/home/dalton/projects/claudeflow-testing` · **Branch:** `feat/wraith-retrieval`
**Purpose:** a complete, compaction-proof record of the exhaustive adversarial review of the corpus index and of the claim/clause-level plan produced from it.
**State at time of writing:** nothing committed, nothing pushed, and **nothing under `corpus/index` modified by this session** — see §10, which corrects an error I repeated several times and records concurrent activity by another session.

---

## 0. How to use this directory

| Path | Contents |
|---|---|
| `00-SESSION-LOG.md` | this file — narrative, state, findings summary, resume instructions |
| `raw/workflow-journals/*.jsonl` | **verbatim** return value of every agent, one JSON object per line. The primary record |
| `raw/workflow-scripts/*.js` | the exact scripts, including the full prompt text sent to every agent |
| `raw/task-outputs/*.json` | full workflow results including each synthesis in full |
| `extracted/*.json`, `extracted/*.md` | parsed and re-derived data used to write the deliverables |

The two deliverables live one level up, in `plans/`:

- `plans/index-system-ADVERSARIAL-REVIEW-2026-07-29.md`
- `plans/index-entry-creation-plan-CLAIM-LEVEL-2026-07-29.md`

**All of this is untracked by git.** It is on one disk. Committing it is a pending decision (see §7).

---

## 1. What the user asked for

Verbatim, from the opening request:

> "i want you to conduct an exhaustive adversarial review of every single index entry, index creation plan (only to the end of creating your own detailed index entry creation plan), and every line of code involved in the index. my ultimate goal is to build, maintain, and leverage a large and extraordinalrily detailed index of every document. Every claima nd every clause. Every point of connection and every weakness."

Subsequent requests in order: what is the difference between `corpus/index` and the sandbox index; where are the deliverables; review the plan and present the decisions in layman's terms; can the planned index use the archon-cli verbatim/bbox system; run the two recommended verifications; update the plan and give a view on implementing in archon-cli first; log everything durably.

---

## 2. Work completed — four workflows

| ID | Workflow | Agents | Tokens | Result |
|---|---|---|---|---|
| A | `index-entry-adversarial-audit` — all 27 entry directories | 106 | 9.18M | **551 defects, 50 CRITICAL**; 93 verified → 89 confirmed, 4 refuted |
| B | `index-code-adversarial-audit` — every line of index code | 73 | 5.61M | **353 findings → 48 distinct**; 63 verified → 56 confirmed, 7 refuted; 104 prior claims tested |
| C | `index-creation-plan-review` — all 15 plan documents + schema derivation | 52 | 3.10M | **207 plan defects, 242 design inputs, 91 gates assessed**; 43 verified → 30 confirmed, **13 refuted** |
| D | `archon-first-index-assessment` | *running at time of writing* | — | see §5 |

Totals for A–C: **231 agents, ~17.9M subagent tokens, ~6,000 tool calls, 1,111 raw findings, 145 adversarially verified.**

### 2.1 A defect I introduced and corrected

Workflow C's first run (`w9eyz2vs6`) completed its 8 review agents but **all 43 verification agents failed** with `API Error: 400 tools.10.custom.input_schema.properties: Property keys should match pattern`. Cause: I used a non-ASCII property key (`真_cause`) in the verifier schema. Fixed to `true_cause`, resumed from cache via `resumeFromRunId`, and all 43 verifications then ran (`wllglf5ap`). **Both results are preserved** — `C-plan-review.result-v1-unverified.json` and `C-plan-review.result-v2-verified.json` — because the unverified run's synthesis contains material the verified one compressed.

### 2.2 A truncation I caught

Workflow A's synthesis agent received `JSON.stringify(compact).slice(0, 220000)` and the payload exceeded it, so its synthesis reported "12 of 27 entries received a full adversarial pass (288 filed defects)." That is **wrong**. All 27 entries were fully audited; the true figure is **551 defects**. Recovered by parsing `A-entry-audit.journal.jsonl` directly. Anyone reading the A synthesis must apply this correction.

---

## 3. Principal findings

Full detail is in `plans/index-system-ADVERSARIAL-REVIEW-2026-07-29.md`. The load-bearing items:

### 3.1 The reframing

Claim-level indexing has been treated as an authoring problem. It is an **addressing, schema and wiring** problem. ~5,000 claim-shaped records are already authored on disk, plus 4,961 span-anchored claims in the sandbox. Nearly none is addressable.

`corpus/index/Dissertation/` holds 982 claim records, 100% line-anchored, with an 8-tier support taxonomy and 76% in an explicit support graph — **one record per 58 words**. `Veri(dis)similitude (Salvo MA)/vds-claims-moves.md` holds 157 with stable ids — one per 59 words. Boredom Secondary, the nominated gold standard, is **one per 1,218 source words**, roughly 21× coarser. Both dense artifacts were built outside every plan in `plans/` and neither is registered.

### 3.2 Corrected census

| Quantity | Prior handoff | Re-derived |
|---|---|---|
| Unit analyses | 691 | **372** (prior counted every `.md`, inflating ~86%) |
| Unit records | ~310 | 355 files / ~320 distinct units |
| Distinct edge triples | ~9,762 | ~9,702 — held within 0.6% |
| Unparseable JSON | 1 | **2** — `bcap-analysis/phase2-u-intro.md:376` holds invalid JSON in a fenced block |

The four "disagreeing edge layers" have four different causes. FCM's synthesis layer is a **strict superset** (24 edges exist only there) — the opposite of stale.

### 3.3 Actively wrong output today

- `cross-author-utils.ts:473-474` — `t.includes('')` is always true in JS; 31 of 72 hooks fire for **every** topic. Cross-author bridging has never worked.
- `gold-standard-prompt-builder.ts:712-716` — emits `Bridge: Summary Matrix (Aristotle) ↔ ? (Unknown)` then `Both authors MUST be cited with direct textual evidence`. A mandatory instruction to fabricate.
- `compile-corpus-index.py:718-721` — unreachable `break`; two shipped nodes corrupt. `Preparatory Rhetoric` carries a 10,009-char `centralityTier` (3.07% of the artifact); `Temporalität` ships another record's units as its own.
- Retrieval de-duplicates on `page_start` across all authors; `chunkId` already exists and is unused.
- 71 of 117 primary texts labelled `secondary` to the model (`cross-author-utils.ts:317`).
- 5,437 reasoning edges rejected at runtime: `PASS: 0 DROPPED: 5437`.
- The compiler emits **zero bytes to stderr** while discarding ~38% of what it reads; `main()` always returns 0.
- Twelve structured `*-ontology.json` files sit in directories the compiler scrapes; the string `ontology.json` appears nowhere in its 1,412 lines.

### 3.4 The 13 refuted plan defects — causal inversion

The plan strand had the highest refutation rate and the reason is systematic. The canonical template is dated **2026-07-15**; the defects attributed to it live in files from **May and June**. Phantasia's ontology is 65 days older than the template. `grep -n "tension-edges" ` on the template returns **zero hits**. The template *codified* Boredom's shape; it did not cause Phantasia's.

True causes located: four per-book plans specified `tension-edges.json` by **count** and never by key name (`in-game-calleja-2011-analysis.md:211`, `grammar-of-motives-burke-1945-analysis.md:255`, `uncomfortable-situations-2017-analysis.md:199,:260`, `wendt-design-for-dasein-analysis.md:44,:74`). And `aristotle-corpus-analysis.md:317-345` **already mandates** a "Phase 0.5: PDF Offset Validation" — so Aristotle's locator errors are a compliance failure, not a specification gap.

One filed "defect" was a harness artifact (`plan_line: "plans/x.md:1"`, `defect: "d"`). Retained in the record rather than deleted.

### 3.5 Corrections owed to the existing handoff

Strike: the `cmd_verify` manifest-destruction claim (refuted — all 248 removed rows have a later `ok` row for the same path, two failed rows survive, and it logs the dedup); the `normalize-edges` blank-triple claim; the merge-idempotence claim; the `clearJSONLCaches` live-caller claim; the `run_ingest.py` skip claim; the immutability-checker claim.

---

## 4. Live verification against archon-cli — verbatim

Run 2026-07-29 from `/home/dalton/projects/archon-cli` using `./target/debug/archon`, version **`archon 1.3.11 (7b44c665)`**, HEAD `8758f2fa` (binary one test-only commit behind). Store: `/home/dalton/projects/archon-cli/.archon/archon-data.db`, 987 MB, 224 documents. `claudeflow-testing/.archon/archon-data.db` is 28 KB and empty.

### Test A — sub-span narrowing

```
archon docs verify-quote "enabling collaborative team viewing" --limit 2 --json
```
```
exact  sim=1.0  pp.4-4
src: King, Christine and Dalton Salvo - scalable-virtual-reality-global-cli
source_span (36 chars): 'enabling collaborative team  viewing'
frag p.4 bbox=[71,73,542,261]  h=188pt  locator=None
```
Narrowed from the chunk's pp.4–6 / 642pt box to a single page and 188pt.

### Test B — Bekker locator

```
archon docs verify-quote "the soul is in a way all existing things" --limit 2 --json
```
```
exact sim=1.000 pp.48-48  Aristotle - On The Soul (De Anima)_(2014)_[My Copy].
span(40c): 'the soul is in a way all existing things'
p.48 bbox=h=41pt locator=Bekker:431b1
```
Clause-level citation end to end: exact match, single page, ~2-line box, Bekker number read off the running head.

### Test C — the `ped-sec-29` fabrication

```
archon docs verify-quote "sense of being in the place" --limit 2 --json
```
```
found: True
fuzzy sim=0.741 pp.22-24  Sorabji, Richard - Body and Soul in Aristotle_(1974)
fuzzy sim=0.704 pp.20-23  Heidegger, Martin - Being and Time_(1962)_[My Copy].
```
**No exact match.** Only noise-floor fuzzy hits on unrelated books. `found: true` fires because `REPORT_FLOOR = 0.60` — so any gate must key on `match_kind == "exact"`, never on `found`.

### Coverage sample

```
archon evidence find "perception imagination and the soul" --mode hybrid --limit 40 --json
```
40 candidates · 40 re-anchored · **40/40 with real Marker bboxes** · 0 unresolved · locator kinds `{none: 32, Bekker: 8}` across 15 distinct documents (39 `rhetorical_ontology`, 1 `new_media`). bbox geometry: width median 335pt, height median 302pt, min 30pt, max 537pt; only 3 of 40 exceed 500pt.

**Caveat established:** `evidence find` re-anchors each retrieved chunk against **its own content** (`crates/archon-evidence/src/lib.rs:361` passes `s.r.content`), so its provenance is trivially exact and its bbox is chunk-wide. The real sub-span path is `docs verify-quote` → `locate_quote`.

### The correction this forced

I had told the user archon supplies `char_start`/`char_end`. **It does not, at the query surface.** `QuoteFragment` (`crates/archon-docs/src/quote_verify.rs:33-46`) has no offset fields and neither JSON emitter returns them. Archon *computes* them — `find_subslice` → `(a,b)` at `:169-176`, `local_span_in_chunk` → `(lo,hi)` at `:296-310` — uses them to narrow page and bbox, then discards them for want of a field. **Adding two struct fields and two emitter lines is the entire remaining gap to clause-level addressing.**

### The `bbox ✓` mystery, solved

`src/command/evidence.rs:487-497` prints the literal string `" · bbox ✓"`. `provenance_json` at `:568` emits the coordinates. All 49 ticks in `corpus/index` came from reading the pretty output instead of passing `--json`.

### The `vle-05` data-integrity item

`units/vle-05-scalable-vr-global-immersion.md:67` claims `exact-1.00 (sim 1.00) · bbox ✓`. **The claim is true** and re-verifies today. But its declared source resolves nowhere: `corpus/virtual_learning_environments/` does not exist, `corpus/Virtual Learning Environments/` exists and lacks the file, and nothing matching `*scalable-virtual*` is under `corpus/`. Archon ingested it 2026-07-20 from a path that has since changed and retains full text, 14 pages, 21 chunks, 5 VLM image descriptions. Recoverable **only because vle-05 recorded `archon doc-4caaf4dc`**.

---

## 5. Currently underway

**Workflow D — `archon-first-index-assessment`** · task `wvvjgtsq1` · run `wf_d1b488a2-eed`
Script: `raw/workflow-scripts/archon-first-index-assessment-wf_d1b488a2-eed.js`
Journal (grows as it runs): `raw/workflow-journals/D-archon-first.journal.jsonl`

Eight assessors — `index-reader-to-producer`, `cozo-store-readiness`, `evidence-curation-state`, `fcdp-draft-consumer`, `corpus-adapter-cost`, `incumbent-compat-and-shim`, `rust-velocity-and-repo-health`, `adversarial-critic` — each verified on its load-bearing claims, then a synthesis producing a recommendation and a migration shape.

**If this session ends before it completes:** re-read the journal for per-agent results; the task output will be at `.claude-tmp/.../tasks/wvvjgtsq1.output`. Re-run with
`Workflow({scriptPath: "<raw/workflow-scripts/archon-first-index-assessment-wf_d1b488a2-eed.js>", resumeFromRunId: "wf_d1b488a2-eed"})`.

---

## 6. Deliverables and their current state

**`plans/index-system-ADVERSARIAL-REVIEW-2026-07-29.md`** — consolidated review. Sections: corrected census; critical entry defects; critical code defects; scalability verdict with the harden-or-replace recommendation; the honest refutation record; corrections owed to the existing programme documents; recommended order; open decisions.

**`plans/index-entry-creation-plan-CLAIM-LEVEL-2026-07-29.md`** — the new creation plan. Revised twice this session after the archon verification. Current structure:

- §0 framing, including the archon finding and the VR Pedagogy control case
- §2 preconditions — 2.1 observability, 2.2 stop active corruption, **2.3 clause addressing (rewritten: P19 expose archon's offsets, P20 gate on `match_kind`, P21 record `document_id`; P16 demoted from "the gate for the entire programme")**
- §3 record model — 3.1 CLAUSE, **3.1a the clause layer mostly exists already in archon-cli (new)**, 3.2 CLAIM, 3.3 EDGE/TENSION/TERM/SOURCE
- §4 controlled vocabularies, derived by union-and-dedup from observed use with counts
- §5 locator model — **`bbox` and `bekker` marked implemented**
- §6 entry profiles and the GROUP layer
- §7 pipeline, §8 gates (**quote gate now keys on `match_kind == "exact"`**), §9 orchestration
- §10 migration table — **new row: re-anchor every existing quotation in `corpus/index`**
- §11 runtime contract, §12 sequencing — **re-sequenced with a new S-1 (1–2 d) and S0 (2–3 d) front end**
- §13 six decisions, §14 the vle-05 data-integrity item

---

## 7. Decisions pending with the user

1. **Verbatim storage** — does a rights-tiered storage/display split replace the blanket 25-word ban? A clause-level index needs the clause; the ban is applied uniformly to Aristotle, Radcliffe 1794, Equiano 1789 and the user's own MA thesis.
2. **Sandbox promotion** — move 4,961 span-anchored claims out of `tmp/` now, or keep as Phase 8? Currently untracked with no off-machine backup, alongside ~40 h of gold annotation.
3. **Compiler disposition** — replace the parse-and-emit layer (~1,100 of 1,412 lines) or harden in place?
4. **Density target** — 15–35 records per 1,000 source words, i.e. 50–500 claims per article against today's ~7.
5. **Group layer** — debates, intra-cluster citations and evolution arcs move to an optional GROUP layer.
6. **Which store is authoritative** — the 224-document corpus with all provenance is in `archon-cli/.archon`; `claudeflow-testing/.archon` is empty.

Plus, carried and unresolved from the previous handoff: does the index move out of `corpus/` and to where; are the 772 index manifest records deleted or rewritten; what goes into the Phase 0 commit; which pushes are authorised.

Also pending: **whether to commit this directory.** It is 13 MB, untracked, and on one disk.

---

## 8. What was NOT done

- Nothing committed. Nothing pushed. No branch created.
- No file under `corpus/index` modified — verified, still byte-identical to the D1 manifest.
- `scripts/` and `src/` untouched by this session; the diffs present there are pre-existing.
- Phase 0 Item 0 (`"index"` into `SKIP_DIRS`) **not applied** — still outstanding and still urgent.
- Nothing written to the archon store; only read-only subcommands were run.

---

## 9. Resume instructions for a clean session

1. Read `plans/index-system-ADVERSARIAL-REVIEW-2026-07-29.md`, then the creation plan, then this log.
2. Apply the §2.2 correction before quoting any number from workflow A's synthesis (551 defects, not 288).
3. Raw per-agent evidence is in `raw/workflow-journals/*.jsonl`, one JSON object per line, keyed by `type: "result"`.
4. Three urgent items are independent of every pending decision: add `"index"` to `SKIP_DIRS` at `run_ingest_phase2.py:978`, `run_ingest.py:365`, `parallel_ingest.py:69`; get the six untracked entry trees into git; and stop the `Unknown` author bridge fabrication at `gold-standard-prompt-builder.ts:712-716`.
5. The cheapest high-value work is S-1 + S0 in the creation plan: expose archon's char offsets, gate on `match_kind`, then re-anchor every existing quotation in the index.

---

## 10. Correction: the drift claim was tested with the wrong recipe, and another session is live in this repo

Recorded 2026-07-29 ~12:00 PDT, on discovering five modified files under `corpus/index` that were not present earlier in the session.

### 10.1 My error

I stated several times, including in §0 of the first version of this log, that "`corpus/index` still matches the D1 manifest byte for byte." I tested it with the recipe given in `plans/index-system-HANDOFF-2026-07-28.md` §2:

```bash
cd .backups/corpus-index-full-20260728T230859Z/tree
find . -type f -print0 | sort -z | xargs -0 sha256sum | diff - ../MANIFEST-copy.sha256 && echo INTACT
```

That command hashes the **backup copy** and compares it to `MANIFEST-copy.sha256`. It proves the backup is internally intact. **It does not touch the live tree and cannot detect live drift.** The correct test is the live tree against `MANIFEST-source.sha256`:

```bash
cd corpus/index && find . -type f -print0 | sort -z | xargs -0 sha256sum > /tmp/live-now.sha256
cd - && diff <(sort /tmp/live-now.sha256) <(sort .backups/corpus-index-full-20260728T230859Z/MANIFEST-source.sha256)
```

Run correctly, that returns **23 differing lines**. The claim was wrong in method, and I repeated it in the review document and in conversation.

**This is also a defect in the handoff itself.** Its six-line state block asserts "Nothing under `corpus/index` has been modified. Zero byte drift since the D1 backup. **Spot-checked.**" while the only recipe it supplies for the purpose cannot establish that. Anyone who "spot-checked" with the printed command verified the backup, not the tree.

### 10.2 What actually changed, and who changed it

Not this session. `find corpus/index -newermt '2026-07-29 06:00' -not -newermt '2026-07-29 11:30'` returns **nothing** — the entire window covering all three audit workflows. Every subagent was instructed strictly read-only and every one complied.

The changes are a deliberate, correctly-backed-up repair by **another session working concurrently in this repo**, between 11:37 and 12:00 PDT:

| File | mtime |
|---|---|
| `Boredom Experiment (VR Attention Study)/_synthesis/book-level-ontology.md` | 11:39:38 |
| `…/_synthesis/manifest.json` | 11:41:22 |
| `…/units/bex-00-corpus-overview.md` | 11:46:41 |
| `…/units/bex-02-eeg-workload.md` | 11:54:49 |
| `…/units/bex-04-stimulus-corpus.md` | 11:54:49 |
| `corpus/index/compiled-index.json` | **12:00:44** — `builtAt: 2026-07-29T19:00:44Z` |

Originals are preserved under `corpus/index/Boredom Experiment (VR Attention Study)/.backups/20260729-o9-status-repair/`, including a `compiled-index.json.pre`. The convention matches the user's standing rule exactly.

The edit is substantive and correct-looking: the manifest's O-9 block moves three of four channels from deferred to **processed** (`ch-eeg`, `ch-hmd`, `ch-fig`, full N=8, 2026-07-16), leaves only `ch-obs` deferred as its own final phase, and records `ch-selfreport` as O-10 resolved 2026-07-29 with the full 24-episode per-subject record now usable. That is the O-9/O-10 work described in the project memory, not corruption.

**The compiler was run at 12:00:44** — approximately one minute before this check, i.e. while this session was live.

### 10.3 Consequences

1. **Every finding in this review was derived from the pre-repair tree.** The census, the 551 defects and the code line numbers resolve against the state before 11:37. The Boredom Experiment entry's defect list (12 filed, 0 CRITICAL) is now partly stale in the user's favour — the entry got better.
2. **`compiled-index.json` has been recompiled**, so any node or term count quoted in the review is from the previous build. The artifact is nondeterministic by construction (`builtAt` plus 101 tied sort positions), so a diff of it will show churn unrelated to the repair.
3. **Concurrency hazard.** Two sessions are operating on this repo. Anything this session proposes to change under `corpus/index`, `scripts/`, or the compiler must be re-checked against the tree at execution time, not against the state recorded here. Phase 0's tracking-policy commit in particular would now sweep the o9-repair files and the `.backups/20260729-o9-status-repair/` directory.
4. **The D1 backup is still valid as a restore point** for the pre-repair state, and remains internally intact. But restoring it would now **revert the o9-status repair.** Do not run the handoff's `rsync --delete` restore recipe without first taking a fresh backup.

### 10.4 Recommended immediate action

Take a fresh timestamped backup of `corpus/index` capturing the post-repair state, using the §7 recipe in the handoff but writing the `.sha256` with a **relative** path. That gives a clean restore point for the current tree and preserves D1 as the pre-repair point.
