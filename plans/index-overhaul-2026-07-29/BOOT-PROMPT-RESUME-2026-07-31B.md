# Boot prompt — paste into a clean session to resume the index overhaul
(saved 2026-07-31 evening; companion handoff: `HANDOFF-B-PROGRESS-DISSDELETE-2026-07-31B.md`)

---

First, read these in order — they are the complete state:
1. plans/index-overhaul-2026-07-29/HANDOFF-B-PROGRESS-DISSDELETE-2026-07-31B.md (this session's handoff — what was done, the pending commit bundle, all paths; treat its §5 gotchas as binding)
2. plans/index-overhaul-2026-07-29/HANDOFF-B-C-REMAINING-2026-07-31.md (the prior handoff — full B/C task definitions in §4; still the reference for B-4/B-1/C work)
3. The memory file project-index-overhaul-2026-07-29.md (auto-memory; read the two 2026-07-31 session blocks, especially the EVENING one)

Standing rules that override defaults:
- Work happens in /home/dalton/projects/archon-cli, branch feat/wraith-retrieval. Push ONLY to the private remote (ProfessorVR/archon-cli-private, SSH). Origin and forks are PUBLIC. claudeflow-testing's origin is ALSO PUBLIC — commit locally there, never push.
- WRAITH is fully retired (including the bge reranker — accepted loss; never reintroduce or relitigate). archon-coder is abandoned; archon-cli is not.
- No multi-agent Workflows without my per-run permission. Ultracode is off.
- Build with PATH=$HOME/.cargo/bin:$PATH LIBCLANG_PATH=/usr/lib/llvm-18/lib and verify the binary mtime AND --version hash after building (the stale-binary footgun has now hit three times).
- Verification-gated commits: show me evidence, wait for my sign-off before committing.
- The user-review tier (drift review, not-found tails, concordance, FCM ruling) is DEFERRED by me — do not start it; the machine work must not depend on it.
- The dissertation entry was DELETED on my order (2026-07-31) — reanalysis happens only after the first complete draft is done. Do not recreate or re-enrich it; F2 regeneration covers 26 entries, not 27.

Current state in one paragraph: The 2026-07-31 evening session completed B-3 (doc-id column refresh, 24 ids to fixed point), B-6 hygiene (3 phantom docs deleted after re-anchoring 23 clauses exact incl. the D5 pilot; test-paper removed; DISS-03-C001 re-pointed, later mooted), B-5(a)(b) (driver preflight page-scaled mirroring placement.rs, admissibility now FAILS bbox-less Marker fallbacks via the new pdf_marker_fallback flag, driver auto-requeues spatial regressions; 331/331 archon-docs tests incl. 2 new), B-2 (wendt+vds page loci parsed 296/296, wendt source registered, vds page_totals config; coverage/distribution now PASS: vds 0.91/0.066, wendt 0.554/0.0), a new `corpus-index remove` subcommand (single/batch, verify-before-remove, audit-trailed), and the user-ordered dissertation deletion (store −1,248 rows with backups; claudeflow corpus/index/Dissertation deleted, 358 git-tracked files; compiled-index regenerated unchanged; ChromaDB verified to contain no index-entry embeddings — nothing purged). Store now 34,673 rows / 233 docs; binary d4dc299d rebuilt+verified; check_ids 3/3 green; sole registration orphan = Miyauchi (pre-existing). NOTHING is committed — the whole session sits in the working trees of both repos. The Mac replica is STALE (store+binary+scripts changed post-deploy). GPU services down; ChromaDB + god daemons up.

Your first actions:
1. Verify state: cd /home/dalton/projects/archon-cli && git log --oneline -1 (expect d4dc299d + dirty tree); ./target/debug/archon --version (expect d4dc299d, binary mtime 2026-07-31 ~20:04); ./target/debug/archon corpus-index status (expect 34,673 rows); ./target/debug/archon docs list | head -1 (expect 233 document(s)).
2. FIRST ACTION — present the commit bundle for my sign-off (handoff §4 lists the suggested split: Rust commit, tooling commit, claudeflow local-only commit) with the evidence (test counts, gate outputs, store totals). WAIT for my sign-off. After I approve: commit, push archon → private remote ONLY, leave claudeflow local.
3. After the commit: offer the Mac replica re-sync (rsync store + scripts, rebuild, verify --version hash — see reference-archon-mac-stale-path-binary for the PATH footgun).
4. Then execute the remaining machine tier in order: B-4 skipped-span recovery (phase-f-skipped.jsonl: 208 Greek vs Kassel/Ross_Greek docs, 62 synthesis multi-doc spans, 31 unmapped-article spans), then B-1 thin-entry enrichment (heidegger-bcap-4-5 0.8, wendt 2.1, aristotle-da-3-3 2.5, caston-1995 3.3, nussbaum-1985 5.9, metzinger-2018 13.4; D-gate authoring per the pilot exemplar; resolve Miyauchi here) flowing into C-1 F2 regeneration (26 entries, ordered by the thin list), C-2 Heidegger claim layer, C-3/F3 acceptance measurement.
5. Pause for my rulings where marked (N1/N3/N5, preservation permission, drafting-plan review, vds MA-thesis ingest offer). Give me regular progress updates, pause before anything destructive or outward-facing, and keep all commits evidence-first with my sign-off.
