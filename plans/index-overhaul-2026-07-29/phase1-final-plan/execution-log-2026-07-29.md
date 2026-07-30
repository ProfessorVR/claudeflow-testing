# Execution log — Phase 0 (Preserve), 2026-07-29

Executor: same Fable session that produced the Phase-1 deliverables, on user instruction
"proceed with phase 0 execution" (taken as authorization for Phase 0's steps, including
its commits and the P0.5 cold-storage copy per 03-OPEN-QUESTIONS N1's recommendation).

## AR pre-flight (all pass)

| Check | Expected (AR) | Observed |
|---|---|---|
| Branch | feat/wraith-retrieval | feat/wraith-retrieval ✓ |
| HEAD | 6cb0f563b | 6cb0f563b ✓ |
| corpus/index tracked-modified | 9 (AR2 snapshot) | 9 ✓ |
| corpus/index untracked | ~1,554 (AR9) | 1,554 ✓ |
| corpus/index total files | ~1,891 (AR9) | 1,891 ✓ |
| compiler dirty | +15 lines (AR1) | +15 ✓ |

Sizes: corpus/index 47M · gold 1.3M · claims corpus 49M · archive 41M.

## Steps

### P0.1 — Fresh backup ✅
- `.backups/corpus-index-full-20260730T000050Z/` (tree + relative-path manifests).
- **Gate:** `BACKUP-VERIFIED` (empty manifest diff); 1,891 files hashed.

### P0.2 — Commit corpus/index + compiler ✅
- Commit `3665b485a` — 1,564 files (1,554 adds + 9 repair-modified + compiler +15),
  434,635 insertions. Message marks it a deliberate mixed-state preservation snapshot.
- Follow-up `998d0de8b` (P0.2b): force-added 2 files inside
  `VR Pedagogy…/.backups/phase1-edge-deletion-…/docs/` that the `docs/` gitignore rule
  caught. corpus/index now **1,891/1,891 tracked, 0 untracked of any kind**.
- Note: a `comm` discrepancy during acceptance was a `core.quotepath` artifact (the `×`
  in "Burke × Calleja"); resolved with `-c core.quotepath=false`.
- **Gate:** porcelain 0; tracked 1,891 ≥ 1,800 floor.

### P0.3 — Commit gold set + claim corpus ✅
- Commit `7ed74b426` — 106 files, 750,267 insertions; 24 claims.jsonl; the 2 relative
  symlinks stored as symlinks (mode 120000 confirmed in the commit).
- Follow-up `47316650c` (P0.3b): `data/prompts/` (canonical-suite.json — the extraction
  prompts) added so the whole `data/` tree is clean per the written acceptance.
- **Gate:** porcelain 0; claims.jsonl count 24.

### P0.4 — Commit the audit archive ✅
- Commit `d1cc588c1` — 122 files incl. raw journals, workflow scripts, task outputs,
  and the phase1-final-plan deliverables. (This log is updated and committed after P0.5
  as the final Phase-0 commit.)
- **Gate:** porcelain 0.

### P0.5 — Off-machine copy ✅ (ADAPTED — deviation logged)
- **Deviation from plan text:** the plan specified a full-branch `git bundle`. Discovered
  at execution: `.git` pack is **27.2 GiB** (node_modules and large binaries are tracked
  in history), making a full bundle impractical. Preservation intent (irreplaceable
  assets off-machine) satisfied instead by:
  1. Self-contained tarball `claudeflow-preserve-20260730T000050Z.tar.gz` (29 MB gz,
     2,474 entries: corpus/index + sandbox data/ + the audit archive; created WITHOUT
     `-h`, symlinks preserved), and
  2. Incremental bundle `claudeflow-preserve-commits-20260730T000050Z.bundle` (26 MB,
     verifies OK; contains the five Phase-0 commits, prerequisite `6cb0f563b`).
  A FULL-history off-machine copy remains outstanding and is folded into open question
  N2 (remote push) — flagged for the user.
- **Destination:** MacBook Air `daltonsalvo@192.168.50.10:~/claudeflow-preserve/`
  (03-N1's recommended destination). Mac SSH was intermittent (timed out on first
  attempts — probed CHIMERA .243 [unreachable] and PROTEUS tailscale [ping ok, no SSH]
  per the abort path, then the Mac answered on retry loops).
- **Gate:** `OFFMACHINE-VERIFIED` — remote SHA-256 of both artifacts identical to local
  (70e1304e… tar.gz / 1747f239… bundle); remote `tar -tzf | wc -l` = 2,474.

## Gate G0 — PASSED
1. BACKUP-VERIFIED logged ✓
2. Porcelain 0 across corpus/index, compiler, sandbox data, archive ✓ (this log's own
   final update is the last Phase-0 commit)
3. `git ls-files corpus/index` = 1,891 ≥ 1,800 ✓
4. Off-machine digest match logged ✓
5. Four first actions of 16-SESSION-CLOSE §16.7 mapped: preserve = DONE (Phase 0);
   transfer → step A7; bridge-fabrication stop → A3; ig-10 fix → A4 ✓

**Phase 0 complete. Nothing pushed to any git remote. Next: Phase A (A1–A13), no
decision blocks it.**

# Decisions — ruled 2026-07-29 (user, verbatim "1) A. 2) A 3) A")

| # | Ruling | Effect |
|---|---|---|
| 1 | (a) rights-tiered storage/display split | C1 CLAUSE schema stores the exact span always; `rights_tier` + `redact_on_render` columns; word ceilings on rendered output only. The 25-word blanket ban is retired |
| 2 | (a) density band 15–35 / 1,000 source words | D1 `check-density` and derived thresholds set (by profile) |
| 3 | (a) GROUP layer | debates / intra-cluster citations / evolution arc move to the optional GROUP layer, `N/A-by-construction` at N=1 |

Phases C and D are now unblocked. N1–N5 still open; N2 (archon remote push + CI)
recommended before C's schema work builds further on the unpushed pile.

# Phase B — executed 2026-07-29 (same session, "proceed")

All in archon-cli. Commits: `ad07a059` (B1+B2), `144c3021` (B3), `34babbc3` (B4).

**B1 — verify gate at the engine boundary.** DESIGN DEVIATION (documented in-code and
here): the plan/audit said "add archon-docs + archon-evidence to archon-draft's
Cargo.toml" — that is a **dependency cycle** (archon-evidence depends on archon-draft
for the Pack types; the D workflow missed this). The gate therefore lives in
`handle_draft_command` in the top crate — the ONLY CLI path to `orchestrator::run`, so
CLI `archon draft`, the TUI `/draft` shell-out, and the wizard are all gated by
construction. The `archon-fcdp` bin gates via a subprocess call to
`archon evidence verify-bank` (ARCHON_BIN override / sibling discovery); binary-not-
found REFUSES rather than passes. Store unavailable/EMPTY/verify-error all BLOCK
(never a silent pass); `ARCHON_DRAFT_ALLOW_UNVERIFIED=1` bypasses with a loud warning;
test-fixture packs skip. The TUI preflight's swallowed-Err chain (former :1050-1053
`.ok()` → None → clean pass) is now a visible blocking failure.

**B2 — exit-code honesty + match_kind keying.** `evidence verify-bank` exits non-zero
on failure (it printed FAIL-FAST while exiting 0). The bank path was already keyed on
exact-only statuses (verify.rs blocking()); `docs.rs` "found" remains display-only.

**B3 — byte offsets exposed.** `QuoteFragment.byte_start/byte_end` (named for what
they HOLD — chunk-local UTF-8 BYTE indices, per the C2 rule) populated from the
already-present `local_range` and emitted in both JSON emitters.

**B4 — StoreCorruptionSuspected.** New blocking-but-diagnosed status: an in-scope
failure that matches EXACTLY after simulating the pypdfium2 fi/ff/fl dropout on the
quote accuses the STORE (remedy: re-extract), never the quotation.

## Gate G-B — PASSED
1. Rejection matrix (fabricated ped-sec-29 quote planted in a real curated pack):
   `archon draft` exit 1 (DRIFT 63%, blocked BEFORE model init) · `archon-fcdp` exit 3
   · `verify-bank` exit 1 · TUI/wizard covered by construction (single engine call
   site, gate above it in the same function). Real pack: `verify-bank` exit 0
   (exact-1.00 + bbox). Forced store failure (empty-store cwd): visible refusal,
   exit 1. Bypass hatch prints its loud warning.
2. B3 round-trip: English exact (bytes 2916–2956, width 40 B = span byte-length);
   Greek exact span 17 chars / 30 bytes emits width exactly 30 — byte semantics
   proven on multibyte content.
3. B4 three-way demonstration: TRUE quote vs ligature-damaged store (King & Salvo
   'benefcial') → STORE-CORRUPTION SUSPECTED (located, p.8, bbox, exit 1); the
   fabrication → DRIFT (not misdiagnosed); exact + not-found unchanged.
4. Test suites: archon-evidence + archon-draft green (85 tests).

**Incidental finding (for Phase E's measurement pass):** the ligature dropout is
widespread — probe tokens (`signifcant`, `benefcial`, `difcult`, `specifcally`,
`confdence`) each hit ≥2 chunks across at least 4 different documents, including the
user's own King & Salvo paper.

# Phase A — executed 2026-07-29 (same session, user instruction "proceed with phase a")

| Step | Commit(s) | Gate result |
|---|---|---|
| A1 SKIP_DIRS+="index" (3 walker sites) | `4c6f376b2` (cf) | predicate simulation: index path skipped, corpus path not ✓ |
| A2 compiler elif reorder :718-721 | `41fbc3885` (cf) | Preparatory Rhetoric 10,009-char tier → 'peripheral'/2 units; Temporalität units now match source (Intro-U2, D2-U6); artifact −38 KB; no node >120 units ✓. NOTE: two >40-char tier strings remain — AUTHORED source annotations (VR Ped 'Debate axis 8', Social Presence hub note) → F2 checklist, not spill |
| A3 bridge-fabrication trio | `82b6da1d7` (cf) | fake topics → 0 bridges (was 31); 'befindlichkeit' → exactly hook-de-anima-03 with real authors; 'φαντασία' → hook-de-anima-02; no Unknown/empty bridge selectable; tsc 0 errors ✓ |
| A4 ig-10 `],`→`},` (line 155) | `766241ac1` (cf) | parses, 42 keys; tree-wide sweep 494/494 JSON parse ✓ |
| A5 WRAITH removal (archon) | `95939871` (ar) | G-A5: binary contains 0 host-string occurrences; model-status fastembed-onnx/768; hybrid evidence find returns candidates; verify-quote exact; grep clean outside archon-coder ✓. **wraith-infer still physically ONLINE — shutdown remains with the user.** Orphaned 1536 namespace rows found in RocksDB store — purge deferred to Phase F store rebuild (deleting without tooling risks corruption) |
| A6 WRAITH removal (incumbent) | `fb8bd0ebd` (cf) | services.rerank disabled/endpoint removed; smart-retrieval + cross-encoder fallbacks emptied; WRAITH Marker defaults retired (.env, run_ingest_phase2, parallel_ingest); test-rerank-wiring.ts deleted; sweep clean (manifest provenance data + 'retired' annotations only); py+tsc clean ✓ |
| A7 transfer → archon | `acb282fad` (cf) + `270a8d4a`,`83988485` (ar) | TRANSFER-VERIFIED (1,892/1,892 SHA-256 match, empty diff); three previously-missing entries present; INDEX-OWNERSHIP.md in both trees; replica 100% git-tracked (134 .backups files force-added). Refreshed + TRANSFER-REVERIFIED after the post-A4 recompile |
| A8 ARCHON_INDEX_PATH + staleness | `53851f67` (ar) | wrong path → loud 'No such file'; corrupt → loud parse error w/ position; valid explicit path loads 701/1,722/64; backdated fixture → STALE warning; **the check caught a real gap during acceptance** (A4 postdated the A2 recompile) → recompiled (cf `…`) + transfer refreshed; clean replica now silent ✓ |
| A9 loud index loads (4 .ok() sites) | same commit | absent/corrupt distinguished and logged at evidence/curate/draft sites ✓ |
| A10 truncation guards | `0058a9103` (cf) | scratch isolation tests: refuse rc=2 + timestamped .bak without force; proceeds with --force/env; empty passthrough. NOTE: god-learn update Phase 7 now stops at the guard unless GOD_REASON_FORCE=1 — intentional |
| A11 vle-05 PDF restored | `e9667fe65` (cf) | found under archon-cli/corpus/virtual_learning_environments/ (per A-80 refutation); copied to corpus/Virtual Learning Environments/; sha256 identical (48328f882539…) ✓ |
| A12 chunkId dedupe (14 sites) | `95ad1bb28` (cf) | tsc clean; **live-retrieval confirmation DEFERRED** — embedding/ChromaDB services stopped; run scratchpad a12_live_test.ts at next drafting session (OPEN GATE ITEM) |
| A13 authority_tier UNCLASSIFIED | `1cde56321` (cf) | exactly 71 works → UNCLASSIFIED (the audit's count); explicit tiers unchanged ✓ |

(cf = claudeflow-testing, ar = archon-cli. Plus recompile-hygiene commits after A4.)

## Gate G-A — PASSED (with two carried items)
1. G-A5 logged ✓ (semantics: removal-by-code proven at binary level; physical shutdown pending with user)
2. G-A7 TRANSFER-VERIFIED + three entries + ownership ✓
3. A2 artifact assertion on fresh recompile ✓
4. A3 two-topic bridge check ✓
5. JSON sweep 0 unparseable ✓
6. All commits local, sign-off = user's phase authorization; nothing pushed ✓

**Carried items:** (i) A12 live-retrieval check when services are up; (ii) wraith-infer physical shutdown (user's call).
**Discovered defects filed for later phases:** exact-mode + --index feeds the canonical-expanded query to Cozo FTS and fails to parse (pre-existing; Phase C); `archon docs model-status` panics on exit dropping a tokio runtime (cosmetic, pre-existing).

## P0.5 addendum — deep completeness verification on the Mac (user-requested)

Ran a full per-file verification ON the Mac (script preserved at
`~/claudeflow-preserve/mac_verify.sh` alongside three manifests for future re-checks):

1. Files present with expected sizes; digests re-matched (70e1304e… / 1747f239…).
2. `gzip -t` OK; `git bundle list-heads` → `d1cc588c1 refs/heads/feat/wraith-retrieval`.
3. Tarball extracted on the Mac: 2,118 files + 2 symlinks.
4. **Per-file SHA-256 against locally generated manifests: corpus/index 1,891/1,891 OK ·
   sandbox data 105/105 OK · archive 121/121 OK (execution log excluded — it was
   finalized after the tarball was cut) · 0 failures.**
5. Spot checks: 24 claims.jsonl; CONVENTIONS.md exactly 1,124 lines; 01-FINAL-OVERHAUL-PLAN.md present.
6. VERDICT: **COMPLETE-AND-VERIFIED**. Extraction scratch removed; final Mac footprint
   53 MB (2 archives + checksums + manifests + verify script).
