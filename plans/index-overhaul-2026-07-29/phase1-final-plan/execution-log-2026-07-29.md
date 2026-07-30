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
