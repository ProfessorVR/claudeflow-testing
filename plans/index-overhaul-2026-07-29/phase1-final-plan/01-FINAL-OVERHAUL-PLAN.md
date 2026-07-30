# 01 — FINAL OVERHAUL PLAN: index system and ingestion

**Status:** AUTHORITATIVE. Produced by the Phase 1 finalizing session, 2026-07-29, from the four-workflow audit archive (`plans/index-overhaul-2026-07-29/`), the draft claim-level plan, and the binding directives. Where this plan and the draft plan disagree, this plan wins; where this plan is silent, the draft plan's §3–§9 record model, vocabularies, locator model, profiles, pipeline and gate definitions apply as the specification of record.

**Repositories:** incumbent `/home/dalton/projects/claudeflow-testing` (branch `feat/wraith-retrieval`, HEAD `6cb0f563b` at snapshot) · target `/home/dalton/projects/archon-cli` (branch `feat/wraith-retrieval`, HEAD `8758f2fa` at snapshot).

**Standing rules (every phase, every step):** timestamped backup before any change · commits and pushes from WSL only · explicit sign-off with evidence before each commit · no push without asking · no multi-agent workflow without explicit per-run permission · read the Assumptions Register (§AR) before the first step of every session.

**Blocked-by-decision markers:** three steps carry `[DECISION n]` and cannot start until the corresponding question in `03-OPEN-QUESTIONS.md` is answered. Everything else is executable now.

---

## Phase 0 — PRESERVE (unconditional first; nothing else in any phase before this)

The only irreversible losses in the programme are: the hand-authored analytical layer under `corpus/index/` (untracked, one disk), the half-annotated resolver gold set, and the extracted claim corpus. The sandbox's 79 `.backups/` snapshots share the same volume and do not protect against disk loss. Everything else in the programme is regenerable.

### P0.1 — Fresh timestamped backup of `corpus/index` (post-repair state)

The existing D1 backup (`.backups/corpus-index-full-20260728T230859Z/`) predates the user's anchor repair; restoring it would revert wanted work. Take a new one first.

- **Commands** (from repo root):
  ```bash
  TS=$(date -u +%Y%m%dT%H%M%SZ)
  mkdir -p .backups/corpus-index-full-$TS
  rsync -a corpus/index/ .backups/corpus-index-full-$TS/tree/
  ( cd corpus/index && find . -type f -print0 | sort -z | xargs -0 sha256sum ) > .backups/corpus-index-full-$TS/MANIFEST-source.sha256
  ( cd .backups/corpus-index-full-$TS/tree && find . -type f -print0 | sort -z | xargs -0 sha256sum ) > .backups/corpus-index-full-$TS/MANIFEST-copy.sha256
  diff .backups/corpus-index-full-$TS/MANIFEST-source.sha256 .backups/corpus-index-full-$TS/MANIFEST-copy.sha256 && echo BACKUP-VERIFIED
  ```
- **Acceptance:** `BACKUP-VERIFIED` prints (the diff is empty). Note the manifests use **relative** paths (the archive's §10 records that the D1 recipe's absolute-path manifest caused a wrong drift test — do not repeat it).
- **Abort:** any diff output → do not proceed; investigate which file changed between rsync and hash (another session may be live in the repo — archive §10.3 hazard).

### P0.2 — Commit the hand-authored layer, the compiler, and the artifact (freeze the baseline)

- **What:** `git add corpus/index && git add scripts/compile-corpus-index.py && git commit` (WSL, sign-off first per standing rules).
- **Why this exact scope:** (a) ~1,554 untracked files under `corpus/index` are the only copy of the hand-authored judgment (spot-verified this session; the archive's 1,522 grew — do not hard-code counts); (b) the compiler is +15 lines dirty vs HEAD and every audit citation resolves against the dirty tree — committing freezes the line numbers; (c) `compiled-index.json`'s diff vs HEAD is ~644 lines of which only ~108 are the anchor repair, the rest being uncommitted 2026-07-20 work (three entries + vle-05 registration). **This commit is a preservation snapshot of the mixed state, deliberately.** Say so in the commit message so no future session tries to unpick it.
- **Acceptance (can fail):** `git status --porcelain corpus/index scripts/compile-corpus-index.py | wc -l` returns **0** after the commit, and `git ls-files corpus/index | wc -l` ≥ the file count observed before commit (record both numbers in the session log).
- **Rollback:** the commit is local; `git reset --soft HEAD~1` restores the pre-commit state exactly. Nothing is pushed in this step.

### P0.3 — Commit the sandbox gold set and claim corpus

- **What:** `git add tmp/analysis-upgrade/production-sandbox/data/gold tmp/analysis-upgrade/production-sandbox/data/corpus && git commit`.
- **Contents being protected:** 25/50 dev items mid-annotation + 20/20 holdout, the 1,124-line `CONVENTIONS.md`, the ~480 KB drift log (gold, ~1.3 MB verified on disk); 24 `claims.jsonl` files / 4,961 claims + 14,811 concept mentions + 552 bridge candidates (corpus). The partial annotations are only meaningful with the conventions that produced them — commit the whole trees, in-progress state included.
- **Caveat:** the corpus tree contains two **relative symlinks** (`compiled-index.json`, `ontology-embeddings.jsonl`). Git stores symlinks as symlinks — fine. If any later step archives this tree with tar, do **not** use `tar -h` (it doubles the tree).
- **Acceptance:** `git status --porcelain tmp/analysis-upgrade/production-sandbox/data | wc -l` → 0; `git ls-files tmp/analysis-upgrade/production-sandbox/data/corpus | grep -c claims.jsonl` → 24.
- **Rollback:** `git reset --soft HEAD~1`.

### P0.4 — Commit the audit archive

- **What:** `git add plans/index-overhaul-2026-07-29 && git commit` (≈39 MB, includes this `phase1-final-plan/` folder).
- **Why:** the archive is the sole evidence base for this programme and is untracked on one disk (00-SESSION-LOG §7 left this pending). It is cheap, local, and reversible; if the user objects to repo weight later, it can be moved to an artifacts branch — but it must not remain unversioned.
- **Acceptance:** `git status --porcelain plans/index-overhaul-2026-07-29 | wc -l` → 0.

### P0.5 — Off-machine copy

- **What:** produce a git bundle of the branch after P0.2–P0.4 and copy it plus a checksummed tarball of the three asset trees to the MacBook Air dev box (permanent SSH `daltonsalvo@192.168.50.10`; use `bash -lc` semantics for remote commands per the standing Mac note).
  ```bash
  TS=$(date -u +%Y%m%dT%H%M%SZ)
  git bundle create /tmp/claudeflow-preserve-$TS.bundle feat/wraith-retrieval
  git bundle verify /tmp/claudeflow-preserve-$TS.bundle
  scp /tmp/claudeflow-preserve-$TS.bundle daltonsalvo@192.168.50.10:~/claudeflow-preserve/
  ssh daltonsalvo@192.168.50.10 "bash -lc 'shasum -a 256 ~/claudeflow-preserve/claudeflow-preserve-$TS.bundle'"
  shasum -a 256 /tmp/claudeflow-preserve-$TS.bundle   # compare the two digests by eye; they must match
  ```
- **Note on standing rules:** this is a *copy to the user's own second machine*, not a push to a remote; it still gets explicit sign-off before running (standing rule), and it does **not** substitute for the Mac-sync discipline (Mac sync of working code still requires WSL-verified WORKING + permission — this is a cold-storage copy only).
- **Acceptance (can fail):** the two SHA-256 digests match, and `ssh … git bundle verify` on the Mac exits 0.
- **Abort:** Mac unreachable → fall back to any second physical medium; do NOT proceed past Phase 0 with zero off-machine copies. (If no medium exists at all, stop and ask — this is the one precondition the programme cannot waive.)

### Gate G0 (phase exit)

All five checks below pass, each capable of failing:
1. `BACKUP-VERIFIED` from P0.1 logged.
2. `git status --porcelain corpus/index scripts/compile-corpus-index.py tmp/analysis-upgrade/production-sandbox/data plans/index-overhaul-2026-07-29 | wc -l` → **0**.
3. `git ls-files corpus/index | wc -l` ≥ 1,800 (sanity floor well under the observed 1,891 total but far above the previously-tracked 335 — proves the mass-add happened).
4. Off-machine digest match logged (P0.5).
5. The four first actions of 16-SESSION-CLOSE §16.7 are now either done (preserve ✓ here) or scheduled (transfer → A7; bridge fabrication → A3; ig-10 → A4) — check the mapping is recorded in the session log.

---

## Phase A — Stop active corruption, remove wraith, transfer the index

All steps reversible; each is a small diff with its own acceptance. Order within the phase: A1–A4 and A10 (incumbent quick fixes) → A5/A6 (wraith removal) → A7–A9 (transfer chain, depends on P0.2). A11–A13 may interleave.

> **Dirty-tree caveat applies to every path:line in this phase:** citations resolve against the working tree as committed in P0.2. After P0.2 the committed tree IS the audited tree (+the out-of-band repairs), so line drift is fixed at that commit. Executor: before each edit, confirm the cited line contains the cited text; if not, grep for the quoted code and update the log — never edit by line number alone.

### A1 — `SKIP_DIRS += "index"` (stops the index re-embedding itself into the corpus)

- **Files/lines:** `scripts/ingest/run_ingest.py:365`, `scripts/ingest/run_ingest_phase2.py:978`, `scripts/ingest/parallel_ingest.py:69` (paths corrected by the archon-first synthesis — under `scripts/ingest/`, not `scripts/`). All three currently read `{".extracted_media", "__pycache__", "node_modules", ".git", ".ingest_cache"}`.
- **Change:** add `"index"` to each set (three tokens total).
- **Why:** 516–518 of 522 index manifest records re-chunk and re-embed on every routine ingest; ingestion cost grows with index size and the index pollutes the corpus store (B-08 context; review §8 item 1).
- **Acceptance:** `grep -n '"index"' scripts/ingest/run_ingest.py scripts/ingest/run_ingest_phase2.py scripts/ingest/parallel_ingest.py` shows all three; a `--dry-run` (or equivalent listing mode) of the ingest walker no longer lists any path under `corpus/index/`.
- **Rollback:** revert the three-token diff.

### A2 — Compiler field-spill fix (the one compiler edit that is in scope)

- **File/lines:** `scripts/compile-corpus-index.py:718-721`.
- **Change:** reorder so the terminator arm (`elif stripped.startswith("###") or stripped.startswith("---"): break`) precedes the absorb arm (`elif current_key and stripped:`). Four lines. Also bound the field/value split at `:308` to its enclosing section if trivially adjacent; otherwise leave `:308` alone (it is superseded at Phase F).
- **Why:** the absorb arm fires 108 times for 21,879 chars and the break arm fires zero; two shipped nodes are corrupt — `Preparatory Rhetoric` (10,009-char `centralityTier`, 973 junk unit tokens, 3.07% of the artifact) and `Temporalität` (another record's units as its own) (B-25, B-32, B-39, A-03, A-04). Recompiles are demonstrably happening (the anchor repair ran one), so this corruption re-enters the drafting prompt today.
- **Acceptance (can fail):** recompile, then:
  ```bash
  python3 - <<'EOF'
  import json; d=json.load(open('corpus/index/compiled-index.json'))
  bad=[n['name'] for n in d['ontologyNodes'] if len(str(n.get('centralityTier','')))>40 or len(n.get('units',[]))>120]
  print('BAD:',bad); raise SystemExit(1 if bad else 0)
  EOF
  ```
  exits 0 (no node with an absurd tier string or a >120-element units array).
- **Rollback:** revert the diff; the pre-recompile artifact is in git (P0.2).
- **Scope note:** this is the ONLY compiler-hardening edit performed. The compiler is a frozen legacy producer by settled decision; P1–P7/P12/P16–P18-class work is superseded by the archon-native path (Phases C–F). Do not be tempted into further compiler work.

### A3 — Kill the bridge fabrication (three coordinated edits, one commit)

- **Edits:**
  1. `src/god-agent/shared/cross-author-utils.ts:473-474` — guard both sides: `targetLower.length > 0 && t.includes(targetLower)` (B-58: `t.includes('')` is always true; 31 of 72 hooks fire for every topic).
  2. `src/god-agent/universal/gold-standard-prompt-builder.ts:712-716` — refuse to emit a bridge section when either author is `Unknown`/undefined/empty (B-61, B-36: the prompt currently mandates citing a non-existent author with "direct textual evidence").
  3. `src/god-agent/shared/cross-author-utils.ts:56, :342, :351` — delete the `_hooksDerivationDone` one-shot; derive lazily per hook (B-59: no reset anywhere; any recompile renders `(undefined)` into the prompt after logging "Bridge activated").
- **Acceptance (can fail):** a drafting-prompt build (dry-run) on two unrelated topics (`['zzzzz','qqqqqq']` vs a real topic) no longer returns identical hook sets, and no emitted prompt contains the string `(Unknown)` or `(undefined)`; grep the built prompt artifact to prove it.
- **Rollback:** revert the commit.

### A4 — Fix `ig-10-incorporation.json` (+ record the second unparseable JSON)

- **File (full path — the 16-SESSION-CLOSE citation is one level short):** `corpus/index/In-Game (Calleja 2011)/Calleja - From Immersion to Incorporation/ig-10-incorporation.json`, line 155: change `],` → `},` (line 134 opens an object; 155 closes it as an array — A-17). Spot-verified still broken this session (`Expecting ',' delimiter: line 155 column 3`).
- **Acceptance:** `python3 -c "import json;json.load(open('<path>'))"` exits 0; a tree-wide JSON parse sweep (`find corpus/index -name '*.json' -exec python3 -c …`) reports **0** unparseable files.
- **Companion record (no edit now):** `corpus/index/bcap-analysis/phase2-u-intro.md:376` holds invalid JSON inside a fenced block (corrected census). Fenced-block JSON is out of the strict-importer path; log it on the Phase F defect checklist for BCAP rather than editing prose here.
- **Rollback:** one-character revert.

### A5 — WRAITH removal, archon side **[the explicit wraith-dependency removal step]**

Spot-verified baseline (this session): with default env, archon already retrieves wraith-free — embedding backend `fastembed-onnx` dim 768 (HNSW 21,929 vectors), reranker disabled unless `ARCHON_DOCS_RERANK_ENABLED` is truthy, and it degrades gracefully on error. **But wraith-infer was still ONLINE at recon time** — the retirement is a directive, not yet a physical state — and wraith-specific code, defaults and namespaces remain in the tree. Remove them:

- **Edits (archon-cli):**
  1. Delete `crates/archon-docs/src/rerank_http.rs` (the `HttpReranker` whose `DEFAULT_URL` is `http://192.168.50.22:8100/v1/rerank`, model `bge-reranker-v2-m3`).
  2. Remove wire-point A: `crates/archon-docs/src/retrieval.rs:141-171` — drop the `HttpReranker::from_env()` branch and the pool-widening arithmetic tied to it; keep the `rerank.rs` trait + `NoopReranker` (generic abstraction, not wraith).
  3. Remove wire-point B: `crates/archon-evidence/src/lib.rs:187` region — same treatment.
  4. `crates/archon-docs/src/embed_openai.rs` — keep the generic OpenAI-compatible provider and the `kind` (query|document) extension (both are provider-agnostic), but remove the hardcoded `"wraith-gte-qwen2-1536-v2"` backend name at `:155` in favor of a name derived from the configured model, and delete any comment/default that names the WRAITH host.
  5. `grep -rn "192.168.50.22\|wraith" crates/ src/ --include='*.rs' --include='*.toml'` — every remaining hit must be either (a) inside `crates/archon-coder/**` (abandoned, DO-NOT-TOUCH — leave as-is) or (b) removed by this step. Zero hits outside archon-coder is the exit condition.
  6. Purge the wraith embedding namespace data if present: check for `wraith-gte-qwen2-1536-v2`-keyed rows/caches in the doc vector store; if found, delete that namespace only (the 768 fastembed namespace is production and untouched). Record before/after counts.
- **Gate G-A5 (can fail; run with NO wraith service):** with wraith-infer physically stopped or unreachable (verify first: `curl -s -m 3 http://192.168.50.22:8100/health` must FAIL; if the host still answers, block it for the test shell, e.g. `ARCHON_DOCS_RERANK_ENABLED=` unset + firewall/hosts null-route, or coordinate the actual shutdown), run:
  1. `archon docs model-status` → backend `fastembed-onnx`, dimension 768, smoke embed ok.
  2. `archon evidence find "perception imagination and the soul" --mode hybrid --limit 5 --json` → returns ≥1 candidate, exit 0.
  3. `archon docs verify-quote "the soul is in a way all existing things" --limit 2 --json` → `match_kind == "exact"`.
  4. `grep -rn "192.168.50.22" crates/ src/ --include='*.rs' | grep -v archon-coder | wc -l` → 0.
- **Rollback:** revert the commit (all removals are code-local; the 768 store is untouched).
- **Do not relitigate:** the recorded eval (raw 1536 regression; reranker win) is acknowledged; the reranker loss is accepted by directive. No step anywhere may reintroduce a wraith call.

### A6 — WRAITH removal, incumbent side

- **Edits (claudeflow-testing):**
  1. `src/god-agent/core/config/config-manager.ts:284-289` — set `services.rerank.enabled: false` and remove the `192.168.50.22:8100` endpoint default (empty string or delete the block; keep the config *shape* so old configs parse).
  2. Leave `smart-retrieval-layer.ts`'s graceful-degradation path in place (it already treats reranker-down as keep-order); with `enabled:false` it is never entered.
  3. `grep -rn "192.168.50.22\|8100" src/ scripts/ .env* 2>/dev/null` — remaining hits must be comments/docs only; remove live references.
- **Why not delete more:** the incumbent is the live drafting engine until Phase F; minimal diff, maximal certainty. The embedding service at `127.0.0.1:8000` and ChromaDB at `:8001` are local, not wraith — untouched.
- **Acceptance:** a full drafting retrieval run (`--execute` dry path or the cheapest end-to-end retrieval invocation) completes with no connection attempt to 192.168.50.22 (verify by log absence and, if available, `ss`/`tcpdump` spot-check during the run) and no 8-second timeout stalls.
- **Rollback:** revert the commit.

### A7 — Transfer the index into archon (one-way, manifest-verified) **[binding directive]**

- **What:** replace the stale `archon-cli/index/` fork (built 2026-07-16; missing Presence Theory, Rhetoric of Interactivity and VR, Social Presence — 25 files; ~2,226 files on disk today) with a verified copy of the incumbent tree as committed in P0.2.
  ```bash
  cd /home/dalton/projects/archon-cli
  git rm -r --cached index/ && rm -rf index/           # remove the stale fork (its own commit message schedules this)
  rsync -a /home/dalton/projects/claudeflow-testing/corpus/index/ index/
  ( cd /home/dalton/projects/claudeflow-testing/corpus/index && find . -type f -print0 | sort -z | xargs -0 sha256sum ) > /tmp/xfer-src.sha256
  ( cd index && find . -type f -print0 | sort -z | xargs -0 sha256sum ) > /tmp/xfer-dst.sha256
  diff /tmp/xfer-src.sha256 /tmp/xfer-dst.sha256 && echo TRANSFER-VERIFIED
  ```
- **Ownership rules (write them into BOTH trees as `INDEX-OWNERSHIP.md`, dated):** until Phase C completes, `claudeflow-testing/corpus/index` is the authoring home and archon's copy is a **read replica refreshed on demand by re-running this step**; from the first entry created under the locked schema in archon (Phase D4), ownership moves to archon and the claudeflow tree is frozen as reference. Never build a two-way sync — that is how the fork drifted.
- **Gate G-A7 (can fail):** `TRANSFER-VERIFIED` prints; file count parity (`find | wc -l` equal both sides); the three previously-missing entries exist in archon (`ls "index/Presence Theory (Foundations)" "index/Social Presence in Virtual Worlds (Part III)" "index/Rhetoric of Interactivity and Virtual Reality (Part III)"` all succeed); `INDEX-OWNERSHIP.md` present and dated in both trees.
- **Rollback:** archon-side `git checkout -- index/` (or reset the commit); the incumbent tree is never written by this step.

### A8 — Production index-path config + staleness check (archon)

- **What:** add a production `ARCHON_INDEX_PATH` / `--corpus-index-root` reader (~30–60 lines). Today `DEFAULT_INDEX_PATH` is a cwd-relative const at `crates/archon-evidence/src/index.rs:24` and `ARCHON_INDEX_PATH` exists only under `#[cfg(test)]` (`:800-804`); the loader itself is already path-generic (`index.rs:266 load(path: impl AsRef<Path>)`). Add a staleness check: compare the loaded artifact's `builtAt` against the tree's newest entry mtime and emit a loud warning above a threshold (a 13-day-stale artifact silently routed retrieval/curation/drafting — D-07, D-36).
- **Acceptance:** `ARCHON_INDEX_PATH=/wrong/path archon evidence find … --index` fails LOUDLY (non-zero or explicit warning, not silence); pointed at the A7 copy it succeeds; artificially backdating `builtAt` in a scratch copy triggers the staleness warning.
- **Rollback:** revert commit.

### A9 — Log the index-load `.ok()` swallows (archon)

- **What:** four of the five index-load sites swallow failure with `.ok()` (`src/command/evidence.rs:154,:218`, `curate.rs:341,:624`, `draft.rs:263` — one already handles). Replace each with a logged warning carrying the path and error; distinguish absent / unreadable / parse-failed.
- **Acceptance:** with `ARCHON_INDEX_PATH` pointed at a corrupt scratch file, each command emits a visible warning naming the path (test at least `evidence find` and one curate path).
- **Rollback:** revert commit.

### A10 — Truncation guards on the reasoning merge chain (incumbent data-loss stopper)

- **Files:** `scripts/merge-reasoning-edges.py:19,:22,:206` (PHASE7_SOURCE and OUTPUT are the same path; `open(OUTPUT,'w')` truncates its own input, no backup — B-57) and `scripts/reason/reason_over_knowledge.py:449-457` (write_outputs truncates `god-reason/reasoning.jsonl` on every Phase-7 run, destroying merged manual/LLM edges; fires inside routine `god-learn update` — B-55). Also the second-run hazard: a re-run truncates `unanchored-edges.jsonl` 1,141→0 (B-49's surviving real finding).
- **Change (minimal):** before any `open(path,'w')` on these outputs, write `path.bak-<UTC timestamp>` and refuse to proceed (exit non-zero with a message) if the about-to-be-written file is non-empty and no `--force` flag is given.
- **Acceptance:** running the merge twice in a scratch copy leaves the first run's output recoverable in a `.bak-*`; second run without `--force` exits non-zero.
- **Rollback:** revert; guards are additive.

### A11 — vle-05 source PDF restoration attempt

- **What:** the quotation verifies (exact, sim 1.00) but the declared source PDF (`King, Christine and Dalton Salvo - scalable-virtual-reality-…pdf`) resolves nowhere under `corpus/` (§14 of the draft plan). Search the machine and the Mac for the file (`find / locate` by name fragments; check the archon ingest-time path recorded in the store via `archon docs inspect doc-4caaf4dc`). If found: restore to `corpus/Virtual Learning Environments/` and commit. If not found: record on the Phase F defect checklist; archon retains full text/14 pp/21 chunks under `doc-4caaf4dc`, so provenance survives either way.
- **Acceptance:** either the PDF exists at the declared path (and its sha256 is recorded in the entry) or a dated not-found record exists on the F2 checklist. Both outcomes pass; silence fails.

### A12 — Retrieval dedupe key: `chunkId`, not `page_start` (incumbent, interim quality)

- **Files:** `src/god-agent/universal/stages/retrieval-stage.ts:226, :303, :343` and the 16 keying sites in `write-pipeline-orchestrator.ts` (B-26: ingest never writes the two metadata fields the current key reads, so every chunk collapses to `"undefined:<page_start>"` — corpus-wide dedup by page number across authors).
- **Change:** key on `chunk.chunkId` (already present on every chunk).
- **Acceptance:** a retrieval run on a broad query returns >1 chunk sharing the same `page_start` across different documents (previously impossible); no duplicate `chunkId` in any returned set.
- **Rollback:** revert commit.

### A13 — `authority_tier` honest default (incumbent, interim quality)

- **File:** `src/god-agent/shared/cross-author-utils.ts:317` — missing `authority_tier` now emits `UNCLASSIFIED`, never defaults to `secondary` (B-60: 71 of 117 titles mislabelled to the model, including the Greek critical editions).
- **Acceptance:** the built corpus catalog labels *FCM* and the Greek editions as `UNCLASSIFIED` (grep the generated catalog), not `secondary`.
- **Rollback:** revert commit.

### Gate G-A (phase exit)

1. G-A5 passed **with wraith stopped/unreachable** (logged output of all four sub-checks).
2. G-A7 `TRANSFER-VERIFIED` + three-entry check + ownership files.
3. A2's artifact assertion exits 0 on a fresh recompile.
4. A3's two-topic bridge check logged.
5. Tree-wide JSON parse sweep: 0 unparseable.
6. All Phase A commits made with sign-off; nothing pushed without asking.

---

## Phase B — Verification before generation (archon)

Fastest path to dissertation value: every quotation checkable before any new record is authored. All in archon-cli.

### B1 — Wire verification into the drafting **engine**, not the TUI wrapper

- **What:** add `archon-docs` + `archon-evidence` dependencies to `crates/archon-draft/Cargo.toml` (verified absent — the engine structurally cannot verify anything); move the `verify.rs:88-101 blocking()` gate (`Missing|Drift|NearVerbatim|WrongSource` reject; only `Exact` passes; 6 tests) to the engine boundary in `handle_draft_command`/orchestrator so ALL five entry points are gated (today only the TUI `/draft` preflight is, and it then shells out to the ungated path — D-12 refutation detail; `slash.rs:210`). Close the swallowed `Err` at `draft.rs:1050-1053` (a Cozo failure currently yields a clean, warning-free pass). ~60–120 lines.
- **Acceptance (can fail):** a pack containing the ped-sec-29 fabrication (`"sense of being in the place"`) is REJECTED on every entry point: `archon draft`, TUI `/draft`, `archon-fcdp run`, the wizard, `evidence curate --draft`. A pack of verified quotes passes. A forced Cozo error produces a visible failure, not a pass.

### B2 — Gate on `match_kind == "exact"`; never on `found`

- **What:** audit every consumer of the verify-quote JSON for keying on `found` (`docs.rs:141` emits `"found": !locations.is_empty()`; `REPORT_FLOOR = 0.60` means fabrications return `found: true` with fuzzy hits). Change consumers to `match_kind`; leave the report floor for display.
- **Acceptance:** the fabricated quotation yields verdict `fail` through every consumer; `grep -rn '"found"' crates/ src/ --include='*.rs'` has no remaining decision-keyed use (display-only allowed and marked).

### B3 — Expose `char_start`/`char_end` on `QuoteFragment` and both emitters

- **What:** the offsets are computed and discarded for want of a field. Per the D refinement this is ~10 lines across 4 files: `local_range: Option<(usize,usize)>` already reaches `fragment_for` (`quote_verify.rs:371`, destructured `:374`, used `:375/:391`); the `QuoteFragment` literal at `:405-411` omits it. Add the two fields to the struct (`:33-46`) and emit in `src/command/docs.rs:150-160` and `src/command/evidence.rs:568` (also `curate.rs:682-688` per the exists-vs-built table).
- **Byte-vs-char rule applies (C2):** name the emitted fields for what they hold. `local_span_in_chunk` returns BYTES; either emit `byte_start`/`byte_end` or convert at the single conversion point C2 establishes. Do not ship fields named `char_*` holding byte offsets — that is the exact trap `doc_chunk_blocks` already set (`schema.rs:189-192`).
- **Acceptance:** `archon docs verify-quote "the soul is in a way all existing things" --json` returns the span fields, and slicing the stored chunk text by those offsets (with the declared semantics) reproduces the quotation byte-for-byte — test on one Greek/German quotation as well (the multibyte case is the point).
- **Downstream plumbing (with B1, not before):** once the engine consumes verification (B1), widen the pack structs so the offsets and the `FragmentLocator` (Bekker/page — currently dropped at the curation bridge) survive `QuoteFragment` → `CuratedQuote` (`pack.rs:20-41`) → `QuoteEntry` (`draft/lib.rs:169-173`). Fields that flow nowhere are a down-payment, not a delivery — this is why B3 ships as plumbing for B1 rather than first.

### B4 — Corruption-aware outcome classes

- **What:** the checker reports `exact / drifted / store-corruption-suspected / not-found`, never a binary. With ligature/OCR damage in the store (`pnractical`, `consiaered in 1tsely`, `Involvernent` returned by live retrieval), a binary checker accuses correct quotations and the user learns to distrust it. Heuristic: on near-miss, test whether restoring fi/ff/fl ligature drops or common OCR confusions on the STORE side produces an exact match → classify `store-corruption-suspected`.
- **Acceptance:** a test quotation against a known ligature-damaged span (e.g., a `benefcial`-class chunk) classifies as `store-corruption-suspected`, not `not-found`; the ped-sec-29 fabrication still classifies `not-found`.

### Gate G-B (phase exit)

The B1 five-entry-point rejection matrix logged (5/5 reject the fabrication, 5/5 pass a verified pack) · B3 round-trip on an English and a Greek quotation logged · B4 three-way classification demonstration logged. Any miss fails the phase.

---

## Phase C — Schema, then integration (archon) `[C1 blocked by DECISION 1]`

### C1 — Lock the record set as Cozo relations `[DECISION 1: verbatim storage]`

- **What:** create `corpus_*` relations for CLAIM / CLAUSE / EDGE / TENSION / TERM / SOURCE exactly per draft plan §3 (field lists, closed enums per §4, locator model per §5), plus JSON Schema files and one worked, schema-valid exemplar per type committed beside the schemas. `rights_tier` and `redact_on_render` are columns — hence the decision block. Route all writes through the archon-cozo retry guard (archon-knowledge currently issues raw `db.run_script` with no retry — exists-vs-built table); use batched writers (the 38-line `store.rs:508-545` precedent), never one-transaction-per-row.
- **Why care despite the regeneration contract:** Cozo has no `ALTER`; a schema mistake is a redo (re-extraction over 226 documents), not a catastrophe — but redo is days. Design once.
- **Query-plan hygiene (design requirement, from workflow D):** Cozo executes a stored-relation atom first in a rule body as a full scan with post-filter — no prefix pushdown for the `*rel{...}, key = $param` form archon uses everywhere (24 such sites in `store.rs` alone; value reads cost 2,543 ms where the covering-index count cost 80 ms). Bulk-path queries written for C3–C7 must use key-prefix forms from the start; an FTS decision over clause text is explicitly deferred to Phase E/F (one-way in storage once created over ~450k rows).
- **Acceptance:** `:create` scripts idempotent (re-run swallows only "already exists"); each exemplar validates against its JSON Schema AND inserts+reads back through the store layer; a deliberately invalid exemplar is REJECTED by the validator (the validator must be able to fail).

### C2 — The byte-versus-char convention, in one place

- **What:** a single documented module owns the conversion between byte offsets (what `doc_chunk_blocks` and `local_span_in_chunk` actually hold/return) and char offsets (what `quote_verify.rs:150` normalizes to). Every record field is named for what it holds. A conformance test slices Greek (Bekker-bearing) and German (umlaut-bearing) spans both ways.
- **Acceptance:** the conformance test passes; `grep` finds no new field named `char_*` populated directly from `local_span_in_chunk` without conversion.

### C3 — Import the sandbox claim corpus

- **What:** 4,961 claims (93.0% char-span), 14,811 concept mentions with `{bekker, chunk_id, char_start, char_end}`, 552 bridge candidates — from the P0.3-committed tree into the C1 relations. Grounding uses the **direct `(chunk_id, local range) → doc_chunk_blocks` lookup — NEVER `find_fragment_bboxes`** (12 s not-found path × 45k claims = 151 h; the measured decisive number). Reserve verify-quote for adversarial checking of supplied quotations.
- **Acceptance (can fail):** imported counts equal source counts exactly (4,961 / 14,811 / 552); a random 20-claim sample's spans slice to the recorded text; total import wall-clock consistent with direct lookup (minutes, not hours — if it runs hours, the wrong grounding path is in use: ABORT).

### C4 — Import the already-claim-shaped entries

- **What:** `Dissertation/` 982 line-anchored records (8-tier taxonomy, 841 typed edges, 235 cached verbatims + insertion_anchor), `Veri(dis)similitude` 157 (parse the pipe table → JSONL), Wendt 139 (mint ids for the 91 id-less; resolve the 20 collisions). Vocabulary crosswalks per draft §4.2.
- **Acceptance:** counts match (982/157/139); zero id collisions cross-entry (checker exits non-zero on any); the 235 verbatims re-anchor via B3's path with outcome classes recorded (B4 classes make store-corruption distinguishable — expect not 100% exact; expect 0 unexplained).

### C5 — Import the relational apparatus from all 27 entries (the irreplaceable layer)

- **What:** debates, tensions, concordances, contested readings, interlocutor maps → TENSION/EDGE/GROUP-layer records. The TENSION schema must absorb all eight on-disk shapes (draft §3.3 list). This is the layer no extraction reproduces and the §0.2.2 row that decides whether regeneration counts as improvement.
- **Acceptance (can fail):** per-entry imported-row counts published against source counts with **zero silent drops** (a discard without a logged reason fails the gate); the four currently-zero-yield tension files (In-Game 12, Grammar 16+21, Wendt 12, BT 9 — A-14, A-45, A-62, A-06) all yield their full counts; FCM's 24 synthesis-only edges (superset case) present; spot-resolution: 10 random tension endpoints resolve to node records.

### C6 — SOURCE records carry the archon `document_id`

- **What:** every SOURCE record stores its `archon doc-…` id (the vle-05 lesson — it is the only reason that provenance survived the PDF going missing). Populate by matching sha256 where possible; else by title-match with a human-confirm list.
- **Acceptance:** ≥ 95% of SOURCE records carry a document_id that `archon docs inspect` resolves; the remainder are on a named exception list with reasons.

### C7 — Reasoning-edge disposition at import

- **What:** the incumbent's reasoning layer is 100% runtime-dead (5,437 rows dropped by one schema mismatch: Phase-7 emits no source/target; the zod schema requires both — B-53). Do NOT patch the incumbent. At import, map reasoning rows into the C1 EDGE model (endpoints resolved from `knowledge_ids`), with unresolvable rows quarantined and counted.
- **Acceptance:** imported + quarantined = source row count exactly; quarantine reasons enumerated.

### C8 — Re-anchor every existing quotation in `corpus/index` (the draft plan's "S0")

- **What:** run every quotation already sitting in the index through `docs verify-quote`, gated on `match_kind == "exact"`, classified by B4's outcome classes, writing a per-entry verification ledger. Coverage list from the draft §10 row: the 49 `bbox ✓` assertions, 235 Dissertation cached verbatims (already in C4), 488 BCAP inline quotations, 1,725 Boredom quoted spans ≥40 chars, 1,230 BT quoted strings, 2,090 FCM quoted spans, and the Part III OCR-only "ALL UNVERIFIED" candidates (Presence Theory's three FAITHFUL-LEPECQ bridge quotes among them). This converts a decade of unverifiable quotation into either a span-anchored CLAUSE record or a named defect on the F2 checklist. Batch through the adversarial verify path deliberately (this IS the supplied-quotation case) but budget it: at 3.3–12 s per call, run as an unattended batch with a resumable ledger, not interactively.
- **Acceptance (can fail):** ledger rows = quotation count discovered by the sweep (published per entry); every row carries one of the four B4 classes; zero rows unclassified; `store-corruption-suspected` and `not-found` rows land on the F2 checklist for their entries.

### Gate G-C (phase exit)

Aggregate: ~6,200+ claims queryable in archon (C3+C4); C5's per-entry zero-silent-drop table published; C6 ≥95%; a live `archon` query returns a Dissertation claim with its span, tier, and source document_id end-to-end. Any sub-gate failure blocks D.

---

## Phase D — Lock the creation system `[D1 blocked by DECISIONS 2 and 3]`

### D1 — Ship the checkers as executables `[DECISION 2: density band · DECISION 3: group layer]`

- **What:** the full checker set from draft §8 (`check-schema`, `check-ids`, `check-loci`, `check-projection`, `check-density`, `check-coverage`, `check-registration`, `check-quotes`, `check-lemmas`, `check-mermaid`, `check-debates`, `check-reachability`, `emit-gates`), each a named executable with a numeric threshold and an exit code. `gates.json`/`metrics.json` written by checkers only, never by an authoring agent. Thresholds are expressions over machine-read values (never frozen constants — one plan froze N=23 against a manifest of 34). A gate whose executable is missing FAILS. Quote gate keys on `match_kind == "exact"` (B2). GROUP-layer gates emit `N/A-by-construction` per Decision 3.
- **Acceptance (the checkers must be able to fail):** run the suite against a deliberately-corrupted fixture entry → non-zero with named failures; run against the D4 pilot → green; run `check-reachability` against today's Boredom Secondary → FAILS at ~2.3% (a checker that passes the known-bad case is itself broken).

### D2 — Separate producer from judge structurally

- **What:** the verifying pass runs as a different agent/process than the author, on a checker-selected random sample (k records, loci opened and resolved), never on an author-chosen trio (today: 1.8% author-chosen). No gate verdict is embedded in the artifact it judges.
- **Acceptance:** the gate report's sample list provably derives from a seeded RNG over the record set (seed recorded); the artifact contains no self-verdict fields.

### D3 — Post-recompile assertion (no superseded assertion survives)

- **What:** after any recompile/regeneration, re-read the produced artifact and fail on any assertion matching the superseded-fact list (the `ch-selfreport pending O-10` case shipped through a verified "clean and additive" recompile — archive §12: "no loss on any axis" is not "no falsehood on any axis").
- **Acceptance:** seeding the superseded-fact list with `pending O-10` against the current artifact FAILS until the four §12.1 in-entry sites are repaired — this doubles as the regression test.

### D4 — Reverse-reference index + post-change sweep (E10 + G19)

- **What:** build the record-id → citing-files map at compile time; any correction becomes transactional (all citing sites resolved or explicitly waived before the recompile is accepted). The G19 sweep (grep the whole index for assertions about a changed entry's prior state) runs as a gate after every entry change.
- **Acceptance:** replaying the 2026-07-29 anchor repair scenario against the tool finds ≥ the 10 files the manual sweep found (archive §12) — fewer fails the gate.

### D5 — Author ONE entry end-to-end under the locked system

- **What:** one entry from the citation-priority queue, full pipeline (draft §7 Phases 0–5): source prep with admissibility probes and locator calibration, day-one registration, extraction to records at the Decision-2 density, aggregation by script, independent verification, wiring. All gates green at N=1.
- **Acceptance:** `emit-gates` exit 0 with every gate listed and none `N/A` except the three GROUP gates; reachability ≥ 0.95; density within the Decision-2 band; a live archon query returns this entry's claims.

### Gate G-D (phase exit)

D1 suite red-on-bad/green-on-pilot both logged · D3 regression test logged · D4 anchor-repair replay logged · D5 pilot entry live-queryable. Ownership note: from D5's success, entry authoring happens in archon; stamp the ownership change per A7's `INDEX-OWNERSHIP.md`.

---

## Phase E — Ingestion hardening (after the index is complete and locked)

Archon's ingestion was **never covered by a verified audit workflow** — every figure below is a spot measurement. E0 exists to fix that before E1–E4 spend effort.

### E0 — Measurement pass (read-only)

- **What:** measure and publish: bbox coverage by ingest path (spot figure: 68% of candidates; `chunk-doc-*` has bbox, `chunk-pdf-image-ocr-*` does not); `doc_chunk_spatial` coverage (spot: 11,311 rows / 17,824 chunks = 63.5%); locator coverage (spot: null in 16/18 in one run); ligature-corruption incidence (sample per document: search for `benefcial|difcult|signifcant`-class dropouts); OCR damage incidence (`pnractical`-class tokens). Publish per-document, not corpus-aggregate.
- **Acceptance:** a table with one row per ingested document exists; each E1–E4 step below cites it.

### E1 — pypdfium2 ligature fix

- **What:** `~/.venv-marker` pins pypdfium2 4.30.0, which drops lowercase fi/ff/fl ligatures (`beneficial`→`benefcial`) — CITATION-FATAL and invisible to every existing check. Fix is a **version bump in that venv, not text repair**. Re-verify Marker still runs after the bump (sidecar smoke test on a 2-page fixture).
- **Acceptance:** re-extracting a known-affected page yields the ligature words intact; the sidecar smoke test passes.

### E2 — Admissibility probes as ingest gates

- **What:** per draft §7 Phase 0: per-page text-hash distinctness, words-per-page floor, ligature probe, diacritic probe (German/Greek), citation completeness. Failures quarantine the source with a remediation task; they do not author around it. (One current entry shipped with identical text_hash on all 11 pages and every verbatim UNVERIFIED.)
- **Acceptance:** the probe suite fails the known-bad fixtures (the 11-identical-hash case) and passes clean ones.

### E3 — Spatial/locator coverage improvement

- **What:** for the OCR-path documents lacking bbox/spatial rows: re-extract via the local Marker sidecar where feasible (E1 first); where not feasible, ensure every clause locator degrades per the §5 rule (`degradation_reason` from the closed set; a bbox-required gate FAILS CLOSED on a third of the corpus if this is skipped — the D refutation that corrected 40/40→68%).
- **Acceptance:** post-pass, `doc_chunk_spatial` coverage strictly increased (against E0's table) AND 100% of clause locators either have bbox or carry a `degradation_reason`.

### E4 — Ingest bookkeeping honesty (the incumbent scripts feed nothing after F, but archon's own ingest inherits the requirements)

- **What:** carry the B-42/B-44/B-45/B-47/B-50 findings as requirements on archon's ingest (not as incumbent patches): batch write failures must fail the batch report; skip-checks must compare like hashes; bbox attachment must be keyed, not positional; renamed files must be reconcilable; a status="ok" record requires embeddings actually written.
- **Acceptance:** each requirement has a named test in archon's ingest test suite; the five tests exist and pass.

### Gate G-E (phase exit)

E0 table published · E1 ligature round-trip logged · E2 probes red-on-bad · E3 coverage strictly increased with 100% locator accounting · E4 five tests green. Then and only then F.

---

## Phase F — Re-ingest and regenerate

### F1 — Full re-ingestion under the hardened pipeline

- **What:** re-ingest the 226-document corpus through the E-hardened, wraith-free, local-Marker pipeline. Interim claim spans over the old store are invalidated by design (regeneration contract §0.2.1: store `chunk_id` + local range; a re-ingest invalidates a derivation, not a record).
- **Acceptance:** document count ≥ current (227 sources / 226 ingested); E0's per-document table re-run shows ligature incidence ~0 and coverage ≥ E3 levels; zero quarantined-without-reason sources.

### F2 — Regenerate every entry under the locked creation system, against the defect checklist

- **What:** regenerate the 27 entries (and the ~265-single-source-entry direction as ruled) under D's gates. **Each entry's regeneration acceptance includes its per-entry defect checklist derived from `02-FINDINGS-TRACEABILITY.md`** — every confirmed finding filed against that entry is explicitly resolved (fixed/obsoleted-by-regeneration) or waived with a reason. The relational apparatus is migrated (C5), never re-derived.
- **Acceptance:** per entry: all D1 gates green + defect checklist fully dispositioned + relational-layer row counts ≥ C5 imports for that entry.

### F3 — Programme acceptance (the §0.2.2 table, measured)

| Property | Baseline (audited) | Target | Measured by |
|---|---|---|---|
| Addressable records / 1,000 source words | ~0.8 | 15–35 (Decision 2) | `check-density` |
| Records reaching runtime | 2.3% (Boredom Sec.) / ~1% (VR Ped.) | ≥95% | `check-reachability` |
| Character spans | 0 in 1,758 files | ≥90% where text layer exists | `check-loci` |
| Quotations machine-verifiable | 0 (a fabrication passed 14 gates) | 100% gated on `match_kind=="exact"` | `check-quotes` |
| Gates satisfiable by narration | 14 of 14 | 0 | D1 suite construction |
| Relational apparatus | present, rich, unreachable | preserved AND reachable | C5 counts + `check-reachability` |

- **Acceptance:** every row at target. Any row short → the programme is not done; no partial declarations of completion.

---

## DO-NOT-TOUCH list (binding on every phase)

1. **All WRAITH components except removal:** the wraith-infer service and its host, `bge-reranker-v2-m3`, the gte-Qwen2 1536 embedding path and its namespace data (A5 deletes; nothing else reads or writes), any plan/step that would call, revive, monitor, or depend on them. The reranker eval outcome is an accepted loss — do not relitigate.
2. **The archon agent-coding stack:** `crates/archon-coder/**`, its tests, its branches (archon-coder/WRAITH-CODING-AGENT work), and any coding-agent crates. Its residual `wraith` strings are exempt from A5's zero-grep condition. No step may build on, fix, or integrate it.
3. **The out-of-band repair set** unless a verified finding independently requires it: everything the anchor-repair/staleness sessions touched or scheduled — the Boredom Experiment entry (all files), `Boredom Secondary (Part III)/_synthesis/boredom-construct-measure-concordance.md`, the FCM king-salvo bridge + physiological digest + fcm-04/05/06 units, the VLE ontology/manifest/vle-00/vle-02 sites, and `tmp/Dissertation/**` draft files. The D3/D4 tooling *reads* them; only the user's repair session *writes* them. (Exception: P0 commits them as-is — preservation is not modification.)
4. **`corpus/` source PDFs** (read-only throughout; A11 may ADD a restored file).
5. **The incumbent compiler beyond A2** (frozen legacy producer, settled decision).
6. **`archon-cli` CI/workflow definitions** except as Phase-C/D work requires new tests (the CI-points-at-main problem is real but is the user's call — see 03, new question N2).
7. **The user's global `~/.claude/settings.json`** and Mac sync (standing rules).

---

## Assumptions Register (§AR) — executor verifies before acting

| # | Assumption | Verify with | If it fails |
|---|---|---|---|
| AR1 | Every audit `path:line` resolves against the working tree as frozen by P0.2 (e.g., `compile-corpus-index.py` = 1,412 lines, not HEAD's 1,397; `compiled-index.json` recompiled at builtAt 2026-07-29T19:00:44Z) | Before each edit: confirm the cited line contains the cited text; else grep the quoted code | Update the citation in the session log; never edit by line number alone |
| AR2 | The out-of-band repair set is **live and growing**. At Phase-1 close it was 9 tracked-modified files (7 Boredom Experiment incl. bex-01/bex-03, the Boredom Secondary concordance, compiled-index.json) + backups; the three archive docs (11-/12-/13-BOOT-) are a **lower bound** | `git status --porcelain corpus/index` at execution time, diffed against the audit snapshot and against P0.2 | Any finding located in a repaired file is "possibly already resolved" — re-verify the defect exists before acting on it |
| AR3 | Branch = `feat/wraith-retrieval` in both repos; nothing from the audit was committed/pushed; archon HEAD `8758f2fa` with binary `archon 1.3.11 (7b44c665)` one test-only commit behind | `git branch --show-current`; `git log -1 --format=%h`; `archon --version` | Stop; reconcile before any step — citations and store figures assume these states |
| AR4 | Archon store figures are **spot measurements, not audited findings**: 227 sources / 226 ingested / 17,824 chunks / `doc_chunk_blocks` 114,612 rows / `doc_chunk_spatial` 11,311 / bbox ~68% by path / HNSW 21,929×768 (fastembed) | `archon docs status`, `docs model-status` (read-only) at execution time | Re-measure and use live numbers; E0 formalizes this |
| AR5 | Wraith-infer may or may not be running at any moment (it was STILL ONLINE at Phase-1 recon despite the retirement directive) | `curl -m 3 http://192.168.50.22:8100/health` | G-A5 must run with it stopped/blocked; coordinate actual shutdown with the user if it still answers |
| AR6 | Default-env archon retrieval is wraith-free (fastembed 768; reranker off) — spot-verified 2026-07-29 | Re-run the two commands in G-A5 items 1–2 | If a wraith env var has since been set (shell profile, systemd, .env), unset it as part of A5 |
| AR7 | `plans/` root duplicates of the plan+review are deleted; the folder copies are canonical | `ls plans/*2026-07-29*.md` | If they have reappeared, delete only after byte-comparison |
| AR8 | ig-10's unparseable JSON is at the FULL path given in A4 (one directory deeper than 16-SESSION-CLOSE's citation) | the A4 parse command | Search `find corpus/index -name 'ig-10-incorporation.json'` |
| AR9 | Counts drift: corpus/index 1,891 files / 1,554 untracked at Phase-1 close (archive said 1,758–1,759 / 1,522) | `find corpus/index -type f | wc -l`; `git ls-files --others --exclude-standard corpus/index | wc -l` | Use live counts; gates use ratios/floors, not stale absolutes |
| AR10 | Two sessions may operate on this repo concurrently (demonstrated 2026-07-29) | Before/after `git status` around any multi-file operation | If drift appears mid-step, stop, re-snapshot, re-verify the step's preconditions |

---

## Consolidated gate ledger (every gate can fail; every gate has a command)

G0 (preserve) → G-A5 (wraith-off retrieval, 4 checks) → G-A7 (transfer manifest) → G-A (phase) → G-B (5-entry-point rejection matrix + span round-trip + 3-way classification) → G-C (import counts + zero-silent-drop + end-to-end query) → G-D (red-on-bad checkers + anchor-repair replay + pilot entry) → G-E (measurement + ligature + coverage + 5 ingest tests) → F3 (programme acceptance table). An executor who cannot produce a gate's logged output does not proceed past it.
