# Phase 1 worklog — reviewing/finalizing session (Fable), 2026-07-29

Running log of what was read, concluded, spot-verified, and skipped. Read-only session; the
only writes are into this folder (`phase1-final-plan/`).

## Session parameters

- Mandate: produce the final authoritative overhaul plan (index + ingestion) from the
  four-workflow audit archive; do not rerun the audit; read-only except this folder.
- Binding directives acknowledged: archon-cli is the target repo; index first, ingestion second;
  full re-ingest + regeneration sanctioned; index data transfers claudeflow → archon before
  work begins there; preservation first; **WRAITH fully retired** (wraith-infer :8100 and the
  bge-reranker-v2-m3 included — reranker eval win is an accepted deliberate loss; only
  wraith-touching work permitted is REMOVAL of dependencies); archon agent-coding stack
  (archon-coder + coding-agent crates) abandoned; archon-cli itself is NOT abandoned.
- Completion bar: 5 deliverables; traceability matrix covers all 239 verified findings
  (A=93, B=63, C=43, D=40; 199 confirmed + 40 refuted); 03-OPEN-QUESTIONS leads with the
  three carried-forward HANDOFF decisions.

## Reading log

### 1. Archive survey (ls)
- Ten narrative docs at top level confirmed: 00, 11, 12, 13-BOOT-PROMPT (user's, parallel
  session), 13-WORKFLOW-D-INCIDENT, 14, 15, 16, draft plan (625 lines), adversarial review
  (198 lines). Plus raw/{task-outputs, workflow-journals, workflow-scripts}, extracted/,
  sync-evidence.sh (NOT executed), sync.log. `:Zone.Identifier` files ignored as instructed.

### 2. 16-SESSION-CLOSE.md — read in full
- Corrected totals adopted: 280 agents / 20.81M tokens / 1,292 findings / 239 verified
  (A 106ag/551f/93v/4r · B 73/353/63/7 · C 52/207/43/13 · D 49/181/40/16). 199 confirmed.
- Nothing committed/pushed/branched; both repos on feat/wraith-retrieval; claudeflow HEAD
  6cb0f563b; archon HEAD 8758f2fa (measurement binary archon 1.3.11 7b44c665).
- Five post-audit user directives (§16.4) reshaped the draft plan; supersede
  15-ARCHON-FIRST-VERDICT's Python-adapter recommendation.
- Three decisions (§16.5) = the HANDOFF three. Four first actions (§16.7): preserve; transfer;
  stop the Unknown-author bridge fabrication (gold-standard-prompt-builder.ts:712-716); fix
  ig-10-incorporation.json (1 char, last unparseable JSON of 494).
- Workflow E cancelled mid-flight (8 started, 0 returned) — not a fifth evidence workflow.
- Standing rules: timestamped backups; WSL-only commits; sign-off before commit; no push
  without asking; no multi-agent workflow without per-run permission.

### 3. Draft plan HANDOFF + full plan (625 lines) — read in full
- HANDOFF three decisions noted verbatim (verbatim storage → C1; density band → D1; group
  layer → D1). Both corrections adopted: (a) Workflow A audited all 27 entries / 551 defects
  (synthesis's "12 of 27, 288" is wrong — input truncated at 220k chars); (b) plan strand
  refuted 13 of 43, mostly causal inversion (template dated 2026-07-15 blamed for May/June
  defects).
- Dirty-tree provenance caveat noted: compile-corpus-index.py 1,412 tree vs 1,397 HEAD (+15);
  compiled-index.json recompiled mid-session (builtAt 2026-07-29T19:00:44Z) by concurrent
  anchor repair.
- Plan structure: §0 finding; §0.2 directives + regeneration contract; §2 preconditions
  P1–P21 (Tier 0 observability, Tier 1 corruption, clause addressing); §3 record model;
  §3.1a archon verify-quote capability; §4 vocabularies; §5 locators; §6 profiles + GROUP;
  §7 pipeline phases 0–5; §8 gates; §9 orchestration; §10 migration table; §11 runtime
  contract; §12 sequencing A/B/C/D/E/F (A1 preservation, A2 transfer, B1–B4 verification,
  C1–C5 schema+import, D1–D4 creation system, E ingestion hardening, F re-ingest/regenerate);
  §13 decisions (4 settled, 3 open, 13.4 housekeeping); §14 vle-05 missing source PDF.
- WRAITH-RELEVANT observations flagged for 00-REVIEW: the draft plan's §11 "Keep … the rerank
  integration" (adversarial review §5) predates the retirement directive — must be overridden.
  Phase B wires archon-docs/archon-evidence into archon-draft — need to check whether any of
  those paths call wraith-infer; the known wraith dependency is archon retrieval calling
  :8100 (embeddings + bge-reranker-v2-m3). An explicit removal step must be added (binding
  directive) — the draft plan has NO wraith-removal step anywhere.

### 4. index-system-ADVERSARIAL-REVIEW-2026-07-29.md — read in full
- Covers strands A/B/C only (231 agents; D is separate in extracted/archon-first-synthesis.md §4).
- §6 refutations read closely per prompt instruction: 13 plan (causal inversions), 7 code,
  4 entry. Notables: cmd_verify manifest-destruction claim REFUTED (most confidently-wrong
  item); merge-idempotence refuted as filed BUT second run truncates unanchored-edges.jsonl
  1,141→0 (independently HIGH); clearJSONLCaches refuted (ESM) but bonus real finding at
  quality-integration.ts:749; 3A-window "fix" would fabricate 62 nodes; immutability-checker
  remedy would be permanently red.
- §7 corrections to programme documents and §8 recommended order noted for the final plan.
- Headline numbers verified against §2 corrected census (372 unit analyses, not 691; 2
  unparseable JSONs — note ig-10 fix leaves bcap phase2-u-intro.md:376 embedded-JSON case).

### 5. 00-SESSION-LOG.md — read in full
- §2.1 workflow C schema failure (mine-and-fixed); §2.2 the A-synthesis truncation (551 not
  288); §10 the drift-test error (backup-vs-backup, not live-vs-manifest; correct recipe
  recorded) and the concurrent-session discovery; §10.3 consequences — all audit findings
  derive from the PRE-repair tree; compiled-index.json recompiled 2026-07-29T19:00:44Z.

### 6. 15-ARCHON-FIRST-VERDICT.md + extracted/archon-first-synthesis.md — read in full
- Verdict was "hybrid: store+claim/clause in archon, adapters in Python, archon NOT producer
  of compiled-index.json" — SUPERSEDED by the binding directive (archon-cli is the target
  repo; regeneration dissolves the adapter long-pole).
- §15.2 corrections absorbed: bbox coverage 68% not 40/40 (evidence-find "exact" is a
  tautology — lib.rs:361 re-anchors chunk against own content); doc_chunk_spatial 11,311 of
  17,824 chunks (36.5% missing); locator null 16/18 in one run; the draft gate is on 1 of 5
  entry points; archon-draft has NO archon-docs/evidence dependency.
- §15.3 the decisive number: verify-quote 3.34–5.22 s exact / 12.12 s not-found → 42.5–151 h
  serial at 45k claims ⇒ ground claims by (chunk_id, range)→doc_chunk_blocks lookup, reserve
  find_fragment_bboxes for adversarial checking of supplied quotations.
- §15.4 hazards: byte-vs-char trap (doc_chunk_blocks cols named char_* but hold BYTE ranges,
  schema.rs:189-192); corpus text quality is the binding constraint (pnractical etc.).
- §15.6 conditions: 186 unpushed archon commits (HEAD on NO remote); CI only triggers on
  main (frozen 2026-06-13); cargo fmt gate red.
- Synthesis §4 = the D refutations record; §6 grounding design + dual-run prerequisites;
  §7 the cheapest-week list (mostly Python).

### 7. 11-, 12-, 13-WORKFLOW-D, 14- — read in full
- §11: user's anchor repair verbatim (6 files + recompile; 108 of 644 diff lines are the
  repair, rest is uncommitted 2026-07-20 work incl. 3 entries + vle-05 registration —
  commit-scoping hazard for Phase A preservation).
- §12: staleness sweep — 10 files carrying superseded assertions post-repair; 1 reaches the
  runtime artifact (Boredom Exp book-level-ontology.md:51 → compiled node still says
  "pending O-10"). Settles E10 + G19 as measured requirements; adds the post-recompile
  assertion gate (draft plan D3).
- §13/§14: workflow D outage + resume mechanics; 13.5's refutation of the 157-tsc-error
  argument; opponent's case preserved. Resume re-ran all 40 verifiers (journal therefore
  holds 74 verifier results: 34 superseded pre-outage + 40 authoritative).

## Traceability-matrix data extraction (scripts in scratchpad, outputs NOT in archive)
- Verified-finding lists reconstructed from the four journals:
  - Selection logic recovered from the archived workflow scripts: A = per-batch
    CRITICAL|HIGH slice(0,8) over 12 batches → 93; B = per-scope CRITICAL|HIGH slice(0,7)
    over 9 scopes → 63; C = per-scope CRITICAL|HIGH slice(0,6) over 8 scopes → 43;
    D = per-assessor bearing≠NEUTRAL ∧ confidence≠low slice(0,5) over 8 assessors → 40.
  - D journal contains 74 verifier results; verified the last 40 are the authoritative
    resume pass (exactly 16 refuted, matching §15/§16 totals); first 34 are the superseded
    pre-outage pass (18 refuted) — NOT used.
  - Claim↔verdict pairing rebuilt by token-overlap + path/line-bonus scoring with 2-opt
    optimization (verdict records do not carry the finding they verified). Final counts
    match official totals exactly: A 93/4r, B 63/7r, C 43/13r, D 40/16r = 239/40r/199c.
  - B's 7 refuted and C's 13 refuted correspond 1:1 with the adversarial review §6.2/§6.1
    lists — cross-validation passed. The C placeholder harness artifact (plans/x.md:1,
    defect "d") is C-17 and pairs with the "no verifiable claim was filed" verdict.
  - Working data: scratchpad matrix_input.json (session-local; the matrix itself is
    deliverable 02).

## 13-BOOT-PROMPT-STALENESS-REPAIR — read (assumptions-register input only)
- Read §§0–2 in full; waves skimmed. Used solely to populate the DO-NOT-TOUCH out-of-band
  set (Boredom Experiment entry, FCM bridge + digest + fcm-04/05/06, VLE four sites,
  Boredom Secondary concordance, tmp/Dissertation draft files) and AR2. NOT used as
  evidence for any plan step, per the phase-1 prompt.

## Wraith-dependency reconnaissance (read-only, both repos)
- **archon-cli:** reranker = `crates/archon-docs/src/rerank_http.rs` (DEFAULT_URL
  http://192.168.50.22:8100/v1/rerank, model bge-reranker-v2-m3), wire-points at
  `retrieval.rs:141-171` and `archon-evidence/src/lib.rs:187`; OFF by default
  (ARCHON_DOCS_RERANK_ENABLED gate) and degrades gracefully on error. Wraith embeddings =
  env-opt-in OpenAI-compat provider (commit 7b44c665), backend name
  "wraith-gte-qwen2-1536-v2", ISOLATED namespace; auto-selection defaults to LOCAL
  fastembed 768. Ingestion: local Marker sidecar per `.archon/policy.toml:202-207`
  (~/.venv-marker python; marker_url commented out, localhost anyway) — NO wraith
  dependency in ingestion. archon-coder crates contain incidental "wraith" strings —
  abandoned stack, exempted from the removal grep.
- **incumbent:** `services.rerank` default enabled:true w/ the :8100 endpoint
  (config-manager.ts:284-289; GOD_RERANK_* envs :365-366) but per-call opt-in
  (`options.rerank ?? false`, smart-retrieval-layer.ts:201) + graceful degradation
  (warn-once comment :69). Embeddings local :8000 (gte-Qwen2 via local service), ChromaDB
  local :8001 — neither is wraith.
- Conclusion baked into plan step A5/A6 + gate G-A5.

## Spot-verifications this session (all read-only, each logged with reason)
| Check | Result | Why |
|---|---|---|
| curl http://192.168.50.22:8100/health | **ONLINE** (gte-Qwen2 dim1536 + bge-reranker-v2-m3, cuda) | Retirement directive not yet physical → AR5 + G-A5 must run with service stopped |
| `archon docs model-status` | backend fastembed-onnx, dim 768; RocksDB 21,929 raw vecs; HNSW 21,929×768; (cosmetic tokio panic on exit) | Which embeddings the production index uses → wraith-free by default |
| `archon evidence find "perception imagination and the soul" --mode hybrid --limit 3 --json` (no wraith env) | Returns candidates, exit 0 | Proves retrieval functions with zero wraith involvement under default env |
| `archon docs status` | 227 sources / 226 ingested / 17,824 chunks | Firms the 224-vs-226/227 discrepancy in archive figures (AR4) |
| `git show 7b44c665` | Wraith embeddings opt-in via env; dedicated namespace isolated from 768 store | Confirms production index untouched by the 1536 eval |
| compile-corpus-index.py `wc -l` | 1,412 (still dirty tree) | AR1 |
| corpus/index counts | 1,891 files total; 1,554 untracked; 9 tracked-modified (7 Boredom Exp incl. bex-01/03, Boredom Sec concordance, compiled-index.json) | AR2/AR9 — archive's 1,522/1,758 have drifted |
| ig-10-incorporation.json | STILL unparseable (line 155 col 3); full path is …/Calleja - From Immersion to Incorporation/… (one dir deeper than 16-SESSION-CLOSE cites) | Step A4 path correction |
| plans/ root duplicates | Deleted (confirmed absent) | Draft §13.4 resolved |
| gold set + claims corpus | Present (gold ~1.3MB; 24 claims.jsonl) | P0.3 targets exist |
| archon-cli/index fork | 2,226 files on disk | A7 replaces it |

## Traceability pairing quality (final)
- Improved scorer (token overlap + path/line-number bonus + 2-opt): A 93/93, B 63/63,
  C 43/43, D 40/40 assigned; refuted counts match official (4/7/13/16). The C placeholder
  harness artifact pairs correctly (plans/x.md:1 ↔ "no verifiable claim was filed").
  B/C refuted sets correspond 1:1 to adversarial review §6.2/§6.1. Reconstructed data
  preserved at `matrix-input-reconstructed.json` in this folder (fields: original claim,
  verdict, corrected severity, reasoning excerpt, match_score per row).

## Deliverables produced (all five + supporting data)
1. `00-REVIEW-OF-DRAFT-PLAN.md` — confirmations (10), corrections (wraith omission =
   disqualifying; superseded recommendations; drifted numbers), gaps (7), sequencing +
   preconditions assessment, directive-impact table.
2. `01-FINAL-OVERHAUL-PLAN.md` — Phases 0/A/B/C/D/E/F; preservation unconditional first
   (P0.1–P0.5 with commands + off-machine copy + G0); explicit wraith removal A5 (archon)
   + A6 (incumbent) with gate G-A5 run wraith-down; A7 manifest-verified transfer;
   C8 corpus-wide quote re-anchoring (the draft's S0, restored); DO-NOT-TOUCH list;
   Assumptions Register AR1–AR10; consolidated gate ledger. [DECISION n] markers on C1/D1.
3. `02-FINDINGS-TRACEABILITY.md` — all 239 findings, four workflows, no truncation:
   199 confirmed (173 addressed / 26 deferred / 0 rejected / 0 component-abandoned — the
   empty categories are explained, not skipped) + 40 refuted with per-item reasons and
   journal pointers.
4. `03-OPEN-QUESTIONS.md` — leads with the three carried HANDOFF decisions (verbatim
   storage → C1; density → D1; group layer → D1), then five new (N1 off-machine
   destination; N2 archon push/CI authorization; N3 purge index-derived store records;
   N4 pilot-entry choice; N5 archive weight). Wraith question NOT raised (settled).
5. `04-EXECUTION-BRIEF.md` — the paste-in prompt: read order, standing rules, gate
   discipline, stop-and-ask conditions.

## What was skipped, and why
- Raw journals were read selectively (structure + all verification records + assessor
  finding lists), not line-by-line in full — the prompt instructs trusting verified
  findings; full-journal rereads were only needed to reconstruct the verified set.
- E-production-readiness.journal.jsonl: not read beyond confirming 8 started / 0 results
  (cancelled workflow, per prompt).
- sync-evidence.sh: read only as evidence context, NEVER executed.
- No writes anywhere outside this folder; no archon store writes (read-only subcommands
  only); no commits; nothing pushed.

## Session close
All five deliverables exist; the matrix covers 239/239 across A–D; 03 leads with the
carried decisions. Phase 1 mandate complete.
