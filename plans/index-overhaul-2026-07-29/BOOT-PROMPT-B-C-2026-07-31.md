# Boot prompt for the next session (paste everything below the line)

---

First, read these in order — they are the complete state:
1. plans/index-overhaul-2026-07-29/HANDOFF-B-C-REMAINING-2026-07-31.md (the handoff — goal, everything done, what remains as sections B and C, all paths; treat its §5 gotchas as binding)
2. plans/index-overhaul-2026-07-29/REMAINING-WORK-2026-07-31.md (the A/B/C work register)
3. The memory file project-index-overhaul-2026-07-29.md (auto-memory; read the 2026-07-31 session blocks)

Standing rules that override defaults:
- Work happens in /home/dalton/projects/archon-cli, branch feat/wraith-retrieval. Push ONLY to the private remote (ProfessorVR/archon-cli-private, SSH). Origin and forks are PUBLIC. claudeflow-testing's origin is ALSO PUBLIC — commit locally there, never push.
- WRAITH is fully retired (including the bge reranker — accepted loss; never reintroduce or relitigate). archon-coder is abandoned; archon-cli is not.
- No multi-agent Workflows without my per-run permission. Ultracode is off.
- Build with PATH=$HOME/.cargo/bin:$PATH LIBCLANG_PATH=/usr/lib/llvm-18/lib and verify the binary mtime AND --version hash after building (the stale-binary footgun has hit twice).
- Verification-gated commits: show me evidence, wait for my sign-off before committing.
- The user-review tier (drift review, not-found tails, concordance, FCM ruling) is DEFERRED by me — do not start it; the machine work must not depend on it.

Current state in one paragraph: F1 full re-ingest, the Phase-F prose extractors, F2 triage, and the complete 15-checker gate suite are DONE and committed (archon HEAD d4dc299d on the private remote); the store holds 8,525 clauses / 35,922 rows with 4,316 exact + 1,773 near-verbatim anchors, the core ledger is 93.8% machine-verified, not-in-corpus and timeout classes are empty, ligature docs are 0, and the Mac replica at daltonsalvo@192.168.50.10:~/projects/archon-cli is built and verified current (d4dc299d, full store, zero re-ingest). GPU services are down (restart via /god-launch only if needed).

Your first actions:
1. Verify state: git log --oneline -3 in archon-cli (expect d4dc299d); ./target/debug/archon --version (expect d4dc299d); ./target/debug/archon corpus-index status (expect 35,922 rows).
2. Execute section B of the handoff in its recommended order: B-3 doc-id column refresh, B-6 hygiene (ask me about test-paper and the DISS-03-C001 target when you reach them), B-5(a)(b) driver preflight page-scaling + loud Marker-fallback failure, then B-2 page-locus enrichment, B-4 skipped-span recovery, and B-1 thin-entry enrichment flowing into C-1.
3. Then section C: F2 entry regeneration ordered by the thin-entry list, the Heidegger claim layer (C-2), and the F3 acceptance measurement — pausing for my rulings where the handoff marks them (N1/N3/N5, preservation permission, drafting-plan review).
4. Give me regular progress updates, pause before anything destructive or outward-facing, and keep all commits evidence-first with my sign-off.
